from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
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
    except JWTError:
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
    except JWTError:
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
