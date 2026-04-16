from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import any_role, manager_or_admin
from models.models import Product, StockMovement, ActivityLog
from schemas.auth import StockAdjust

router = APIRouter()

@router.post("/adjust")
def adjust_stock(data: StockAdjust, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product: raise HTTPException(404, "Product not found")
    if data.type == "stock_in": product.stock_qty += data.quantity
    elif data.type == "stock_out":
        if product.stock_qty < data.quantity: raise HTTPException(400, "Insufficient stock")
        product.stock_qty -= data.quantity
    elif data.type == "adjustment": product.stock_qty = data.quantity
    movement = StockMovement(product_id=data.product_id, type=data.type, quantity=data.quantity, note=data.note, reference=data.reference)
    db.add(movement)
    db.add(ActivityLog(user_id=current_user.id, action="stock_adjust", module="inventory", details=f"Product {data.product_id}: {data.type} {data.quantity}"))
    db.commit()
    return {"message": "Stock updated", "new_stock": product.stock_qty}

@router.get("/movements")
def stock_movements(product_id: int = None, db: Session = Depends(get_db), current_user=Depends(any_role)):
    q = db.query(StockMovement).order_by(StockMovement.created_at.desc())
    if product_id: q = q.filter(StockMovement.product_id == product_id)
    return q.limit(200).all()

@router.get("/low-stock")
def low_stock_alerts(db: Session = Depends(get_db), current_user=Depends(any_role)):
    return db.query(Product).filter(Product.stock_qty <= Product.low_stock_threshold, Product.is_active == True).all()
