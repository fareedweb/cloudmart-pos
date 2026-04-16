from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import verify_password, create_access_token, hash_password, get_current_user
from models.models import User, Shift, ActivityLog
from schemas.auth import Token, PasswordReset
from datetime import datetime

router = APIRouter()

@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form.username, User.is_active == True).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    shift = Shift(user_id=user.id)
    db.add(shift)
    log = ActivityLog(user_id=user.id, action="login", module="auth", details=f"User {user.username} logged in")
    db.add(log)
    db.commit()
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "name": user.name, "role": user.role, "username": user.username}}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    shift = db.query(Shift).filter(Shift.user_id == current_user.id, Shift.logout_time == None).first()
    if shift:
        shift.logout_time = datetime.utcnow()
    log = ActivityLog(user_id=current_user.id, action="logout", module="auth")
    db.add(log)
    db.commit()
    return {"message": "Logged out successfully"}

@router.post("/reset-password")
def reset_password(data: PasswordReset, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name, "role": current_user.role, "username": current_user.username, "email": current_user.email}
