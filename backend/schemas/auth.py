from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from models.models import UserRole, PaymentMethod, SaleStatus, StockMovementType

# ── Auth ──────────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class PasswordReset(BaseModel):
    old_password: str
    new_password: str

# ── Users ─────────────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: str
    username: str
    password: str
    role: UserRole = UserRole.cashier

class UserUpdate(BaseModel):
    name: Optional[str]
    email: Optional[str]
    role: Optional[UserRole]
    is_active: Optional[bool]

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime
    class Config: from_attributes = True

# ── Categories ────────────────────────────────────────────────
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_active: bool
    class Config: from_attributes = True

# ── Products ──────────────────────────────────────────────────
class ProductCreate(BaseModel):
    name: str
    barcode: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    cost_price: float = 0
    selling_price: float
    tax_rate: float = 0
    stock_qty: float = 0
    low_stock_threshold: float = 10
    expiry_date: Optional[date] = None

class ProductUpdate(BaseModel):
    name: Optional[str]
    barcode: Optional[str]
    selling_price: Optional[float]
    cost_price: Optional[float]
    tax_rate: Optional[float]
    low_stock_threshold: Optional[float]
    is_active: Optional[bool]
    expiry_date: Optional[date]

class ProductOut(BaseModel):
    id: int
    name: str
    barcode: Optional[str]
    sku: Optional[str]
    cost_price: float
    selling_price: float
    tax_rate: float
    stock_qty: float
    low_stock_threshold: float
    expiry_date: Optional[date]
    is_active: bool
    category_id: Optional[int]
    brand_id: Optional[int]
    class Config: from_attributes = True

# ── Stock ─────────────────────────────────────────────────────
class StockAdjust(BaseModel):
    product_id: int
    type: StockMovementType
    quantity: float
    note: Optional[str] = None
    reference: Optional[str] = None

# ── Suppliers ─────────────────────────────────────────────────
class SupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    credit_limit: float = 0

class SupplierOut(BaseModel):
    id: int
    name: str
    contact_person: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    credit_limit: float
    balance: float
    is_active: bool
    class Config: from_attributes = True

class POItemCreate(BaseModel):
    product_id: int
    quantity: float
    unit_cost: float

class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    items: List[POItemCreate]
    notes: Optional[str] = None

# ── Customers ─────────────────────────────────────────────────
class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    discount_pct: float = 0

class CustomerOut(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    loyalty_points: float
    credit_balance: float
    discount_pct: float
    is_active: bool
    class Config: from_attributes = True

# ── Sales ─────────────────────────────────────────────────────
class SaleItemCreate(BaseModel):
    product_id: int
    quantity: float
    unit_price: float
    discount_pct: float = 0
    tax_rate: float = 0

class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    items: List[SaleItemCreate]
    discount_amount: float = 0
    payment_method: PaymentMethod = PaymentMethod.cash
    cash_given: Optional[float] = None
    notes: Optional[str] = None

class SaleOut(BaseModel):
    id: int
    invoice_number: str
    status: SaleStatus
    subtotal: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    payment_method: PaymentMethod
    cash_given: Optional[float]
    change_given: Optional[float]
    created_at: datetime
    class Config: from_attributes = True

# ── Returns ───────────────────────────────────────────────────
class ReturnItemCreate(BaseModel):
    product_id: int
    quantity: float
    refund_amount: float

class ReturnCreate(BaseModel):
    sale_id: int
    return_type: str = "full"
    refund_method: str
    items: List[ReturnItemCreate]
    reason: Optional[str] = None

# ── Day End ───────────────────────────────────────────────────
class DayEndCreate(BaseModel):
    date: date
    opening_cash: float = 0
    closing_cash_physical: float = 0
    notes: Optional[str] = None

# ── Expenses ──────────────────────────────────────────────────
class ExpenseCategoryCreate(BaseModel):
    name: str

class ExpenseCreate(BaseModel):
    category_id: int
    description: str
    amount: float
    expense_date: date

# ── Settings ──────────────────────────────────────────────────
class SettingUpdate(BaseModel):
    key: str
    value: str
