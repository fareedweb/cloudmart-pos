from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from core.security import any_role, manager_or_admin
from models.models import Sale, SaleItem, Product, Customer, ActivityLog, StockMovement, StockMovementType, SaleStatus
from schemas.auth import SaleCreate, SaleOut
from datetime import datetime
import random, string

router = APIRouter()

def generate_invoice():
    return "INV-" + datetime.now().strftime("%Y%m%d") + "-" + "".join(random.choices(string.digits, k=4))

@router.post("/", response_model=SaleOut)
def create_sale(data: SaleCreate, db: Session = Depends(get_db), current_user=Depends(any_role)):
    try:
        subtotal = 0
        tax_amount = 0
        sale_items = []

        for item in data.items:
            product = db.query(Product).filter(Product.id == item.product_id, Product.is_active == True).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
            if product.stock_qty < item.quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")
            
            line = item.unit_price * item.quantity
            disc = line * (item.discount_pct / 100)
            tax = (line - disc) * (item.tax_rate / 100)
            line_total = (line - disc) + tax
            subtotal += line - disc
            tax_amount += tax
            
            # Create SaleItem but don't add to session yet
            sale_item = SaleItem(
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount_pct=item.discount_pct,
                tax_rate=item.tax_rate,
                line_total=line_total
            )
            sale_items.append(sale_item)
            product.stock_qty -= item.quantity

        total = subtotal + tax_amount - data.discount_amount
        change = (data.cash_given - total) if data.cash_given else None

        # Create Sale with items in the relationship
        sale = Sale(
            invoice_number=generate_invoice(),
            cashier_id=current_user.id,
            customer_id=data.customer_id,
            subtotal=subtotal,
            discount_amount=data.discount_amount,
            tax_amount=tax_amount,
            total_amount=total,
            payment_method=data.payment_method,
            cash_given=data.cash_given,
            change_given=change,
            notes=data.notes,
            items=sale_items  # Set items through relationship
        )
        
        db.add(sale)

        if data.customer_id:
            customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
            if customer:
                customer.loyalty_points += round(total / 10, 2)

        db.add(ActivityLog(user_id=current_user.id, action="create_sale", module="sales", details=f"Sale total: {total}"))
        db.commit()
        db.refresh(sale)
        return sale
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
        if customer:
            customer.loyalty_points += round(total / 10, 2)

    db.add(ActivityLog(user_id=current_user.id, action="create_sale", module="sales", details=f"Sale total: {total}"))
    db.commit()
    db.refresh(sale)
    return sale

@router.get("/", response_model=List[SaleOut])
def get_sales(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), current_user=Depends(any_role)):
    return db.query(Sale).order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/{sale_id}")
def get_sale(sale_id: int, db: Session = Depends(get_db), current_user=Depends(any_role)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return {
        "id": sale.id, "invoice_number": sale.invoice_number,
        "status": sale.status, "subtotal": sale.subtotal,
        "discount_amount": sale.discount_amount, "tax_amount": sale.tax_amount,
        "total_amount": sale.total_amount, "payment_method": sale.payment_method,
        "cash_given": sale.cash_given, "change_given": sale.change_given,
        "created_at": sale.created_at,
        "items": [{"product_id": i.product_id, "quantity": i.quantity, "unit_price": i.unit_price, "line_total": i.line_total} for i in sale.items],
        "cashier": {"id": sale.cashier.id, "name": sale.cashier.name},
        "customer": {"id": sale.customer.id, "name": sale.customer.name} if sale.customer else None
    }

@router.post("/{sale_id}/hold")
def hold_sale(sale_id: int, db: Session = Depends(get_db), current_user=Depends(any_role)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    sale.status = SaleStatus.held
    db.commit()
    return {"message": "Sale held"}

@router.post("/{sale_id}/void")
def void_sale(sale_id: int, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    for item in sale.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock_qty += item.quantity
    sale.status = SaleStatus.voided
    db.add(ActivityLog(user_id=current_user.id, action="void_sale", module="sales", details=f"Voided sale {sale.invoice_number}"))
    db.commit()
    return {"message": "Sale voided"}
