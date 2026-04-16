from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import any_role, admin_only
from models.models import StoreSetting
from schemas.auth import SettingUpdate

router = APIRouter()

DEFAULT_SETTINGS = {"store_name": "CloudMart Supermart","currency": "SGD","currency_symbol": "$","tax_rate": "9","tax_name": "GST","receipt_footer": "Thank you for shopping at CloudMart!","loyalty_rate": "10","backup_schedule": "daily","printer_type": "thermal_80mm"}

@router.get("/")
def get_settings(db: Session = Depends(get_db), current_user=Depends(any_role)):
    settings = {s.key: s.value for s in db.query(StoreSetting).all()}
    return {**DEFAULT_SETTINGS, **settings}

@router.post("/")
def update_setting(data: SettingUpdate, db: Session = Depends(get_db), current_user=Depends(admin_only)):
    setting = db.query(StoreSetting).filter(StoreSetting.key == data.key).first()
    if setting: setting.value = data.value
    else: db.add(StoreSetting(key=data.key, value=data.value))
    db.commit()
    return {"message": "Updated", "key": data.key}

@router.post("/bulk")
def update_bulk(settings: list[SettingUpdate], db: Session = Depends(get_db), current_user=Depends(admin_only)):
    for data in settings:
        setting = db.query(StoreSetting).filter(StoreSetting.key == data.key).first()
        if setting: setting.value = data.value
        else: db.add(StoreSetting(key=data.key, value=data.value))
    db.commit()
    return {"message": f"Updated {len(settings)} settings"}
