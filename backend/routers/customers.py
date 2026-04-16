from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import any_role, manager_or_admin
from models.models import Customer, Sale, SaleStatus
from schemas.auth import CustomerCreate

router = APIRouter()

@router.get("/")
def get_customers(db: Session = Depends(get_db), current_user=Depends(any_role)):
    return db.query(Customer).filter(Customer.is_active == True).all()

@router.post("/")
def create_customer(data: CustomerCreate, db: Session = Depends(get_db), current_user=Depends(any_role)):
    customer = Customer(**data.dict())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.get("/{cust_id}")
def get_customer(cust_id: int, db: Session = Depends(get_db), current_user=Depends(any_role)):
    c = db.query(Customer).filter(Customer.id == cust_id).first()
    if not c: raise HTTPException(404, "Customer not found")
    sales = db.query(Sale).filter(Sale.customer_id == cust_id, Sale.status == SaleStatus.completed).order_by(Sale.created_at.desc()).limit(20).all()
    return {**{k: v for k,v in c.__dict__.items() if not k.startswith("_")}, "recent_sales": [{"invoice": s.invoice_number, "total": s.total_amount, "date": str(s.created_at)} for s in sales]}
