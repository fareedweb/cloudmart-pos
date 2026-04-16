# routers/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.security import admin_only, hash_password
from models.models import User, ActivityLog
from schemas.auth import UserCreate, UserUpdate, UserOut

router = APIRouter()

@router.get("/", response_model=List[UserOut])
def get_users(db: Session = Depends(get_db), current_user=Depends(admin_only)):
    return db.query(User).all()

@router.post("/", response_model=UserOut)
def create_user(data: UserCreate, db: Session = Depends(get_db), current_user=Depends(admin_only)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(name=data.name, email=data.email, username=data.username, hashed_password=hash_password(data.password), role=data.role)
    db.add(user)
    db.add(ActivityLog(user_id=current_user.id, action="create_user", module="users", details=f"Created user: {data.username}"))
    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), current_user=Depends(admin_only)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for k, v in data.dict(exclude_none=True).items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user

@router.get("/activity-logs")
def activity_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user=Depends(admin_only)):
    logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    return [{"id": l.id, "user": l.user.name if l.user else None, "action": l.action, "module": l.module, "details": l.details, "created_at": l.created_at} for l in logs]
