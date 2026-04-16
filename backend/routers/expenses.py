from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import any_role, manager_or_admin
from models.models import Expense, ExpenseCategory
from schemas.auth import ExpenseCreate, ExpenseCategoryCreate
from datetime import date

router = APIRouter()

@router.get("/categories")
def get_categories(db: Session = Depends(get_db), current_user=Depends(any_role)):
    return db.query(ExpenseCategory).all()

@router.post("/categories")
def create_category(data: ExpenseCategoryCreate, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    cat = ExpenseCategory(name=data.name)
    db.add(cat)
    db.commit()
    return cat

@router.get("/")
def get_expenses(start: date = None, end: date = None, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    q = db.query(Expense).order_by(Expense.expense_date.desc())
    if start: q = q.filter(Expense.expense_date >= start)
    if end: q = q.filter(Expense.expense_date <= end)
    return q.limit(200).all()

@router.post("/")
def create_expense(data: ExpenseCreate, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    expense = Expense(**data.dict(), added_by=current_user.id)
    db.add(expense)
    db.commit()
    return expense

@router.delete("/{exp_id}")
def delete_expense(exp_id: int, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    exp = db.query(Expense).filter(Expense.id == exp_id).first()
    if not exp: raise HTTPException(404, "Expense not found")
    db.delete(exp)
    db.commit()
    return {"message": "Deleted"}
