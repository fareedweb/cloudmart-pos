from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from core.database import get_db
from core.security import manager_or_admin
from models.models import Sale, SaleItem, Product, Category, User, Expense, StockMovement, SaleStatus
from datetime import date, datetime, timedelta

router = APIRouter()

@router.get("/daily-sales")
def daily_sales(report_date: date = Query(default=date.today()), db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    sales = db.query(Sale).filter(
        func.date(Sale.created_at) == report_date,
        Sale.status == SaleStatus.completed
    ).all()
    return {
        "date": str(report_date),
        "total_transactions": len(sales),
        "total_revenue": round(sum(s.total_amount for s in sales), 2),
        "total_tax": round(sum(s.tax_amount for s in sales), 2),
        "total_discount": round(sum(s.discount_amount for s in sales), 2),
        "cash_sales": round(sum(s.total_amount for s in sales if s.payment_method == "cash"), 2),
        "card_sales": round(sum(s.total_amount for s in sales if s.payment_method == "card"), 2),
        "qr_sales": round(sum(s.total_amount for s in sales if s.payment_method == "qr"), 2),
    }

@router.get("/product-sales")
def product_sales(start: date = Query(default=date.today()), end: date = Query(default=date.today()), db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    results = db.query(
        Product.id, Product.name,
        func.sum(SaleItem.quantity).label("qty_sold"),
        func.sum(SaleItem.line_total).label("revenue"),
        func.sum(SaleItem.quantity * Product.cost_price).label("cost")
    ).join(SaleItem, SaleItem.product_id == Product.id
    ).join(Sale, Sale.id == SaleItem.sale_id
    ).filter(
        func.date(Sale.created_at).between(start, end),
        Sale.status == SaleStatus.completed
    ).group_by(Product.id, Product.name).all()
    return [{"id": r.id, "name": r.name, "qty_sold": round(r.qty_sold or 0, 2), "revenue": round(r.revenue or 0, 2), "cost": round(r.cost or 0, 2), "profit": round((r.revenue or 0) - (r.cost or 0), 2)} for r in results]

@router.get("/category-sales")
def category_sales(start: date = Query(default=date.today()), end: date = Query(default=date.today()), db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    results = db.query(
        Category.name,
        func.sum(SaleItem.line_total).label("revenue"),
        func.count(SaleItem.id).label("items_sold")
    ).join(Product, Product.category_id == Category.id
    ).join(SaleItem, SaleItem.product_id == Product.id
    ).join(Sale, Sale.id == SaleItem.sale_id
    ).filter(func.date(Sale.created_at).between(start, end), Sale.status == SaleStatus.completed
    ).group_by(Category.name).all()
    return [{"category": r.name, "revenue": round(r.revenue or 0, 2), "items_sold": r.items_sold} for r in results]

@router.get("/cashier-performance")
def cashier_performance(start: date = Query(default=date.today()), end: date = Query(default=date.today()), db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    results = db.query(
        User.id, User.name,
        func.count(Sale.id).label("total_sales"),
        func.sum(Sale.total_amount).label("total_revenue")
    ).join(Sale, Sale.cashier_id == User.id
    ).filter(func.date(Sale.created_at).between(start, end), Sale.status == SaleStatus.completed
    ).group_by(User.id, User.name).all()
    return [{"cashier_id": r.id, "name": r.name, "total_sales": r.total_sales, "total_revenue": round(r.total_revenue or 0, 2)} for r in results]

@router.get("/profit-margin")
def profit_margin(start: date = Query(default=date.today()), end: date = Query(default=date.today()), db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    revenue = db.query(func.sum(Sale.total_amount)).filter(func.date(Sale.created_at).between(start, end), Sale.status == SaleStatus.completed).scalar() or 0
    cost = db.query(func.sum(SaleItem.quantity * Product.cost_price)).join(Product).join(Sale).filter(func.date(Sale.created_at).between(start, end), Sale.status == SaleStatus.completed).scalar() or 0
    expenses = db.query(func.sum(Expense.amount)).filter(Expense.expense_date.between(start, end)).scalar() or 0
    gross_profit = revenue - cost
    net_profit = gross_profit - expenses
    return {"revenue": round(revenue, 2), "cost": round(cost, 2), "gross_profit": round(gross_profit, 2), "expenses": round(expenses, 2), "net_profit": round(net_profit, 2), "margin_pct": round((net_profit / revenue * 100) if revenue else 0, 2)}

@router.get("/inventory-valuation")
def inventory_valuation(db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    products = db.query(Product).filter(Product.is_active == True).all()
    items = [{"id": p.id, "name": p.name, "stock_qty": p.stock_qty, "cost_price": p.cost_price, "selling_price": p.selling_price, "cost_value": round(p.stock_qty * p.cost_price, 2), "sell_value": round(p.stock_qty * p.selling_price, 2)} for p in products]
    return {"items": items, "total_cost_value": round(sum(i["cost_value"] for i in items), 2), "total_sell_value": round(sum(i["sell_value"] for i in items), 2)}

@router.get("/tax-report")
def tax_report(start: date = Query(default=date.today()), end: date = Query(default=date.today()), db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    sales = db.query(Sale).filter(func.date(Sale.created_at).between(start, end), Sale.status == SaleStatus.completed).all()
    total_tax = round(sum(s.tax_amount for s in sales), 2)
    total_revenue = round(sum(s.total_amount for s in sales), 2)
    return {"start_date": str(start), "end_date": str(end), "total_transactions": len(sales), "total_revenue": total_revenue, "total_tax_collected": total_tax, "taxable_amount": round(total_revenue - total_tax, 2)}
