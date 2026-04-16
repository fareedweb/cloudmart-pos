from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from core.database import get_db
from models.models import User, UserRole
import os

SECRET_KEY = os.getenv("SECRET_KEY", "cloudmart-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours for POS shift

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(password: str) -> str:
    # Truncate password to 72 bytes as required by bcrypt
    password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise credentials_exception
    return user

def require_role(*roles: UserRole):
    def checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return checker

admin_only = require_role(UserRole.admin)
manager_or_admin = require_role(UserRole.admin, UserRole.manager)
any_role = require_role(UserRole.admin, UserRole.manager, UserRole.cashier)
