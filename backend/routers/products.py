from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from core.security import any_role, manager_or_admin
from models.models import Product, ActivityLog
from schemas.auth import ProductCreate, ProductUpdate, ProductOut

router = APIRouter()

@router.get("/", response_model=List[ProductOut])
def get_products(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = None,
    low_stock: bool = False,
    db: Session = Depends(get_db),
    current_user=Depends(any_role)
):
    q = db.query(Product).filter(Product.is_active == True)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%") | Product.barcode.ilike(f"%{search}%"))
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if low_stock:
        q = q.filter(Product.stock_qty <= Product.low_stock_threshold)
    return q.all()

@router.get("/barcode/{barcode}", response_model=ProductOut)
def get_by_barcode(barcode: str, db: Session = Depends(get_db), current_user=Depends(any_role)):
    product = db.query(Product).filter(Product.barcode == barcode, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db), current_user=Depends(any_role)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductOut)
def create_product(data: ProductCreate, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    try:
        # Check for duplicate barcode if provided
        if data.barcode:
            existing = db.query(Product).filter(Product.barcode == data.barcode).first()
            if existing:
                raise HTTPException(status_code=400, detail=f"Product with barcode '{data.barcode}' already exists")
        
        product = Product(**data.dict())
        db.add(product)
        db.add(ActivityLog(user_id=current_user.id, action="create_product", module="products", details=f"Created product: {data.name}"))
        db.commit()
        db.refresh(product)
        return product
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in data.dict(exclude_none=True).items():
        setattr(product, k, v)
    db.add(ActivityLog(user_id=current_user.id, action="update_product", module="products", details=f"Updated product ID: {product_id}"))
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    db.add(ActivityLog(user_id=current_user.id, action="delete_product", module="products", details=f"Deleted product ID: {product_id}"))
    db.commit()
    return {"message": "Product deleted"}
