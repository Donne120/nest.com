from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT. data must include 'sub' (user_id) and optionally 'org_id'."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        org_id: Optional[str] = payload.get("org_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception

    # Verify token org matches user's org (prevents org-hopping with stale tokens)
    if user.role != models.UserRole.super_admin:
        if user.organization_id is None or user.organization_id != org_id:
            raise credentials_exception

    return user


def require_manager(current_user: models.User = Depends(get_current_user)) -> models.User:
    allowed = {models.UserRole.manager, models.UserRole.admin, models.UserRole.super_admin}
    if current_user.role not in allowed:
        raise HTTPException(status_code=403, detail="Manager access required")
    return current_user


def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    allowed = {models.UserRole.admin, models.UserRole.super_admin}
    if current_user.role not in allowed:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def require_super_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != models.UserRole.super_admin:
        raise HTTPException(status_code=403, detail="Super-admin access required")
    return current_user
