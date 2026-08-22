from datetime import datetime, timedelta, timezone
from typing import Optional
# PyJWT (maintained) — replaced python-jose 3.3.0, which is unmaintained and
# carries CVE-2024-33663 (alg confusion) + CVE-2024-33664 (JWT-bomb DoS).
import jwt
from jwt import PyJWTError
import bcrypt
import uuid
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Always HS256 — never derive from config to prevent algorithm-downgrade attacks
_JWT_ALGORITHM = "HS256"
_COOKIE_NAME = "nest_token"


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT with a unique JTI for revocation support."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({
        "exp": expire,
        "iat": now,
        "jti": str(uuid.uuid4()),  # unique token ID — used for revocation
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=_JWT_ALGORITHM)


def _extract_token(request: Request, bearer_token: Optional[str]) -> Optional[str]:
    """Try Authorization header first, then httpOnly cookie."""
    if bearer_token:
        return bearer_token
    return request.cookies.get(_COOKIE_NAME)


def get_current_user(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = _extract_token(request, bearer_token)
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[_JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        org_id: Optional[str] = payload.get("org_id")
        jti: Optional[str] = payload.get("jti")
        if user_id is None:
            raise credentials_exception
    except PyJWTError:
        raise credentials_exception

    # Check token revocation blocklist
    if jti:
        revoked = db.query(models.RevokedToken).filter(
            models.RevokedToken.jti == jti
        ).first()
        if revoked:
            raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception

    # Verify token org matches user's org (prevents org-hopping with stale tokens)
    if user.role != models.UserRole.super_admin:
        if user.organization_id is None or user.organization_id != org_id:
            raise credentials_exception

    return user


def revoke_token(token: str, db: Session) -> None:
    """Add a token's JTI to the revocation blocklist."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[_JWT_ALGORITHM],
            options={"verify_exp": False},  # allow revoking expired tokens too
        )
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and exp:
            expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
            # Only store if not already revoked
            if not db.query(models.RevokedToken).filter(models.RevokedToken.jti == jti).first():
                db.add(models.RevokedToken(jti=jti, expires_at=expires_at))
                db.commit()
    except PyJWTError:
        pass  # Invalid token — nothing to revoke


def require_educator(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    current_user = get_current_user(request, bearer_token, db)
    allowed = {models.UserRole.educator, models.UserRole.owner, models.UserRole.super_admin}
    if current_user.role not in allowed:
        raise HTTPException(status_code=403, detail="Educator access required")
    return current_user


def require_owner(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    current_user = get_current_user(request, bearer_token, db)
    allowed = {models.UserRole.owner, models.UserRole.super_admin}
    if current_user.role not in allowed:
        raise HTTPException(status_code=403, detail="Owner access required")
    return current_user


def require_super_admin(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    current_user = get_current_user(request, bearer_token, db)
    if current_user.role != models.UserRole.super_admin:
        raise HTTPException(status_code=403, detail="Super-admin access required")
    return current_user


# ─── Per-account login lockout ────────────────────────────────────────────────
# The login endpoint is rate-limited per IP (10/min), but that does nothing
# against a distributed / rotating-IP attacker hammering ONE account. This adds a
# per-account failed-attempt counter with a temporary lockout, keyed on the email
# (lower-cased). In-memory with a TTL — no schema change; fine for the single
# Render web instance. Resets on a successful login. Keeps the generic error so
# account existence still isn't leaked (a locked account and a non-existent one
# both eventually just say "try later" the same way).
import threading

_LOGIN_MAX_FAILS = 5
_LOGIN_LOCK_SECONDS = 15 * 60          # lock 15 min after threshold
_LOGIN_WINDOW_SECONDS = 15 * 60        # failures older than this don't count
_login_fail_state: dict[str, dict] = {}   # email -> {"fails": int, "first": ts, "locked_until": ts}
_login_lock = threading.Lock()


def _login_key(email: str) -> str:
    return (email or "").strip().lower()


def login_locked_until(email: str) -> Optional[datetime]:
    """Return the datetime the account is locked until, or None if not locked."""
    key = _login_key(email)
    if not key:
        return None
    now = datetime.now(timezone.utc).timestamp()
    with _login_lock:
        st = _login_fail_state.get(key)
        if st and st.get("locked_until", 0) > now:
            return datetime.fromtimestamp(st["locked_until"], tz=timezone.utc)
    return None


def register_login_failure(email: str) -> None:
    """Record a failed login; lock the account once the threshold is reached."""
    key = _login_key(email)
    if not key:
        return
    now = datetime.now(timezone.utc).timestamp()
    with _login_lock:
        st = _login_fail_state.get(key)
        # reset the window if the last failure streak is stale
        if not st or (now - st.get("first", now)) > _LOGIN_WINDOW_SECONDS:
            st = {"fails": 0, "first": now, "locked_until": 0}
        st["fails"] += 1
        if st["fails"] >= _LOGIN_MAX_FAILS:
            st["locked_until"] = now + _LOGIN_LOCK_SECONDS
        _login_fail_state[key] = st


def clear_login_failures(email: str) -> None:
    """Clear the failure counter on a successful login."""
    key = _login_key(email)
    with _login_lock:
        _login_fail_state.pop(key, None)
