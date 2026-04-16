# CloudMart POS — Complete Setup Guide

## Project structure
```
cloudmart/
├── frontend/        ← React + Vite (deploy to Netlify)
└── backend/         ← FastAPI Python (deploy to Render)
```

---

## Backend setup

### 1. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Create .env file
```
DATABASE_URL=postgresql://user:password@host/cloudmart
SECRET_KEY=your-super-secret-key-change-this

# Optional: Email for Day-End Reports
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

**Email Setup (Optional):**
- When you complete day-end closing, an automated email report is sent
- For Gmail: Generate an [App Password](https://myaccount.google.com/apppasswords) and use that instead of your regular password
- Leave SMTP settings blank to disable email notifications

### 3. Initialize database
```bash
# With Supabase: run the app once and tables auto-create
python -c "from core.database import Base, engine; from models.models import *; Base.metadata.create_all(bind=engine)"
```

### 4. Create first admin user
```bash
python -c "
from core.database import SessionLocal
from core.security import hash_password
from models.models import User, UserRole
db = SessionLocal()
admin = User(name='Admin', email='admin@cloudmart.com', username='admin', hashed_password=hash_password('admin123'), role=UserRole.admin)
db.add(admin)
db.commit()
print('Admin created: admin / admin123')
"
```

### 5. Run locally
```bash
uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

---

## Frontend setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Create .env file
```
VITE_API_URL=http://localhost:8000/api
```

### 3. Run locally
```bash
npm run dev
# App: http://localhost:5173
```

---

## 🚀 Deployment

**See [DEPLOYMENT.md](DEPLOYMENT.md) for complete step-by-step guide:**
- Deploy backend to **Render** (free)
- Deploy frontend to **Netlify** (free)
- Setup PostgreSQL on **Supabase** (free)
- Configure custom domains & CORS
- Troubleshooting & monitoring

---

## Default login
```
Username: admin
Password: admin123
```
**Change this immediately after first login!**

---

## Modules
| # | Module | Route | Roles |
|---|--------|-------|-------|
| 1 | Auth & Users | /login, /users | Admin |
| 2 | Products | /products | Admin, Manager |
| 3 | Inventory | /inventory | Admin, Manager |
| 4 | Suppliers | /suppliers | Admin, Manager |
| 5 | POS Cashier | /pos | All |
| 6 | Customers | /customers | All |
| 7 | Returns | /returns | Admin, Manager |
| 8 | Reports | /reports | Admin, Manager |
| 9 | Day End | /dayend | Admin, Manager |
| 10 | Expenses | /expenses | Admin, Manager |
| 11 | Settings | /settings | Admin |
| 12 | Backup | /backup | Admin |

---

## Tech stack
- **Frontend**: React 18, Vite, Zustand, Recharts, React Router v6, Axios
- **Backend**: FastAPI, SQLAlchemy, JWT, Passlib/bcrypt
- **Database**: PostgreSQL (Supabase)
- **Hosting**: Netlify (frontend) + Render (backend) — both free

CloudMart Supermart POS © 2024
