from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, users, products, categories, inventory, suppliers, sales, customers, returns, reports, dayend, expenses, settings, backup

app = FastAPI(title="CloudMart POS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(suppliers.router, prefix="/api/suppliers", tags=["Suppliers"])
app.include_router(sales.router, prefix="/api/sales", tags=["Sales"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(returns.router, prefix="/api/returns", tags=["Returns"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(dayend.router, prefix="/api/dayend", tags=["Day End"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["Expenses"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
app.include_router(backup.router, prefix="/api/backup", tags=["Backup"])

@app.get("/")
def root():
    return {"message": "CloudMart POS API", "version": "1.0.0"}
