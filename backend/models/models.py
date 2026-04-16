from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    cashier = "cashier"

class PaymentMethod(str, enum.Enum):
    cash = "cash"
    card = "card"
    qr = "qr"
    split = "split"

class StockMovementType(str, enum.Enum):
    stock_in = "stock_in"
    stock_out = "stock_out"
    adjustment = "adjustment"
    return_in = "return_in"
    sale_out = "sale_out"

class SaleStatus(str, enum.Enum):
    completed = "completed"
    held = "held"
    voided = "voided"
    refunded = "refunded"

# ── Users & Auth ──────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.cashier)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sales = relationship("Sale", back_populates="cashier")
    shifts = relationship("Shift", back_populates="user")
    activity_logs = relationship("ActivityLog", back_populates="user")

class Shift(Base):
    __tablename__ = "shifts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    login_time = Column(DateTime(timezone=True), server_default=func.now())
    logout_time = Column(DateTime(timezone=True), nullable=True)
    opening_cash = Column(Float, default=0)
    closing_cash = Column(Float, nullable=True)
    user = relationship("User", back_populates="shifts")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(255))
    module = Column(String(100))
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="activity_logs")

# ── Products & Inventory ──────────────────────────────────────
class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    products = relationship("Product", back_populates="category")

class Brand(Base):
    __tablename__ = "brands"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    products = relationship("Product", back_populates="brand")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    barcode = Column(String(100), unique=True, nullable=True)
    sku = Column(String(100), unique=True, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    cost_price = Column(Float, default=0)
    selling_price = Column(Float, nullable=False)
    tax_rate = Column(Float, default=0)
    stock_qty = Column(Float, default=0)
    low_stock_threshold = Column(Float, default=10)
    expiry_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    category = relationship("Category", back_populates="products")
    brand = relationship("Brand", back_populates="products")
    stock_movements = relationship("StockMovement", back_populates="product")
    sale_items = relationship("SaleItem", back_populates="product")

class StockMovement(Base):
    __tablename__ = "stock_movements"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    type = Column(Enum(StockMovementType))
    quantity = Column(Float)
    reference = Column(String(100), nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    product = relationship("Product", back_populates="stock_movements")

# ── Suppliers ─────────────────────────────────────────────────
class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    contact_person = Column(String(100), nullable=True)
    email = Column(String(150), nullable=True)
    phone = Column(String(30), nullable=True)
    address = Column(Text, nullable=True)
    credit_limit = Column(Float, default=0)
    balance = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    po_number = Column(String(50), unique=True)
    status = Column(String(30), default="pending")
    total_amount = Column(Float, default=0)
    paid_amount = Column(Float, default=0)
    notes = Column(Text, nullable=True)
    ordered_at = Column(DateTime(timezone=True), server_default=func.now())
    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="order")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("purchase_orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float)
    unit_cost = Column(Float)
    order = relationship("PurchaseOrder", back_populates="items")

# ── Customers ─────────────────────────────────────────────────
class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    phone = Column(String(30), unique=True, nullable=True)
    email = Column(String(150), nullable=True)
    loyalty_points = Column(Float, default=0)
    credit_balance = Column(Float, default=0)
    discount_pct = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sales = relationship("Sale", back_populates="customer")

# ── Sales ─────────────────────────────────────────────────────
class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True)
    cashier_id = Column(Integer, ForeignKey("users.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    status = Column(Enum(SaleStatus), default=SaleStatus.completed)
    subtotal = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    tax_amount = Column(Float, default=0)
    total_amount = Column(Float, default=0)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.cash)
    cash_given = Column(Float, nullable=True)
    change_given = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    cashier = relationship("User", back_populates="sales")
    customer = relationship("Customer", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale")
    returns = relationship("Return", back_populates="sale")

class SaleItem(Base):
    __tablename__ = "sale_items"
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float)
    unit_price = Column(Float)
    discount_pct = Column(Float, default=0)
    tax_rate = Column(Float, default=0)
    line_total = Column(Float)
    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")

# ── Returns ───────────────────────────────────────────────────
class Return(Base):
    __tablename__ = "returns"
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    return_type = Column(String(30), default="full")
    refund_method = Column(String(30))
    refund_amount = Column(Float)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sale = relationship("Sale", back_populates="returns")
    items = relationship("ReturnItem", back_populates="return_record")

class ReturnItem(Base):
    __tablename__ = "return_items"
    id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, ForeignKey("returns.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float)
    refund_amount = Column(Float)
    return_record = relationship("Return", back_populates="items")

# ── Day End ───────────────────────────────────────────────────
class DayEnd(Base):
    __tablename__ = "day_ends"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True)
    cashier_id = Column(Integer, ForeignKey("users.id"))
    opening_cash = Column(Float, default=0)
    closing_cash_physical = Column(Float, default=0)
    closing_cash_system = Column(Float, default=0)
    cash_difference = Column(Float, default=0)
    total_sales = Column(Float, default=0)
    total_returns = Column(Float, default=0)
    total_expenses = Column(Float, default=0)
    net_profit = Column(Float, default=0)
    is_locked = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ── Expenses ──────────────────────────────────────────────────
class ExpenseCategory(Base):
    __tablename__ = "expense_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True)
    expenses = relationship("Expense", back_populates="category")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("expense_categories.id"))
    description = Column(String(255))
    amount = Column(Float)
    expense_date = Column(Date)
    added_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    category = relationship("ExpenseCategory", back_populates="expenses")

# ── Settings ──────────────────────────────────────────────────
class StoreSetting(Base):
    __tablename__ = "store_settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
