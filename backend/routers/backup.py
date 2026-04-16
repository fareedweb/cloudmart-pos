from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import admin_only
from models.models import ActivityLog

router = APIRouter()

@router.post("/manual")
def manual_backup(db: Session = Depends(get_db), current_user=Depends(admin_only)):
    db.add(ActivityLog(user_id=current_user.id, action="manual_backup", module="backup", details="Manual backup triggered"))
    db.commit()
    return {"message": "Backup initiated", "status": "queued"}

@router.get("/audit-logs")
def audit_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user=Depends(admin_only)):
    logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    return [{"id": l.id, "user": l.user.name if l.user else "system", "action": l.action, "module": l.module, "details": l.details, "timestamp": str(l.created_at)} for l in logs]
