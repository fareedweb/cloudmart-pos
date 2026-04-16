from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import any_role, manager_or_admin
from models.models import Supplier, PurchaseOrder, PurchaseOrderItem
from schemas.auth import SupplierCreate, PurchaseOrderCreate
import random, string

router = APIRouter()

@router.get("/")
def get_suppliers(db: Session = Depends(get_db), current_user=Depends(any_role)):
    return db.query(Supplier).filter(Supplier.is_active == True).all()

@router.post("/")
def create_supplier(data: SupplierCreate, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    supplier = Supplier(**data.dict())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.put("/{sup_id}")
def update_supplier(sup_id: int, data: SupplierCreate, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    sup = db.query(Supplier).filter(Supplier.id == sup_id).first()
    if not sup: raise HTTPException(404, "Supplier not found")
    for k, v in data.dict().items(): setattr(sup, k, v)
    db.commit()
    return sup

@router.post("/purchase-orders")
def create_po(data: PurchaseOrderCreate, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    po_number = "PO-" + "".join(random.choices(string.digits, k=8))
    total = sum(i.quantity * i.unit_cost for i in data.items)
    po = PurchaseOrder(supplier_id=data.supplier_id, po_number=po_number, total_amount=total, notes=data.notes)
    db.add(po)
    db.flush()
    for item in data.items:
        db.add(PurchaseOrderItem(order_id=po.id, product_id=item.product_id, quantity=item.quantity, unit_cost=item.unit_cost))
    db.commit()
    return {"po_number": po_number, "total": total}

@router.get("/purchase-orders")
def get_pos(supplier_id: int = None, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    q = db.query(PurchaseOrder)
    if supplier_id: q = q.filter(PurchaseOrder.supplier_id == supplier_id)
    return q.order_by(PurchaseOrder.ordered_at.desc()).all()
