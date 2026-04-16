from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import manager_or_admin
from models.models import Return, ReturnItem, Product, Sale, ActivityLog, SaleStatus
from schemas.auth import ReturnCreate

router = APIRouter()

@router.post("/")
def create_return(data: ReturnCreate, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    sale = db.query(Sale).filter(Sale.id == data.sale_id).first()
    if not sale: raise HTTPException(404, "Sale not found")
    total_refund = sum(i.refund_amount for i in data.items)
    ret = Return(sale_id=data.sale_id, approved_by=current_user.id, return_type=data.return_type, refund_method=data.refund_method, refund_amount=total_refund, reason=data.reason)
    db.add(ret)
    db.flush()
    for item in data.items:
        db.add(ReturnItem(return_id=ret.id, product_id=item.product_id, quantity=item.quantity, refund_amount=item.refund_amount))
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product: product.stock_qty += item.quantity
    sale.status = SaleStatus.refunded
    db.add(ActivityLog(user_id=current_user.id, action="return", module="returns", details=f"Return for sale {sale.invoice_number}"))
    db.commit()
    return {"message": "Return processed", "refund_amount": total_refund}

@router.get("/")
def get_returns(db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    returns = db.query(Return).order_by(Return.created_at.desc()).limit(100).all()
    return [{"id": r.id, "sale_id": r.sale_id, "return_type": r.return_type, "refund_amount": r.refund_amount, "reason": r.reason, "created_at": str(r.created_at)} for r in returns]
