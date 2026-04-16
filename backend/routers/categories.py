from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import any_role, manager_or_admin
from models.models import Category, ActivityLog
from schemas.auth import CategoryCreate

router = APIRouter()

@router.get("/")
def get_categories(db: Session = Depends(get_db), current_user=Depends(any_role)):
    return db.query(Category).filter(Category.is_active == True).all()

@router.post("/")
def create_category(data: CategoryCreate, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    cat = Category(**data.dict())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat: raise HTTPException(404, "Category not found")
    cat.is_active = False
    db.commit()
    return {"message": "Category deleted"}
