# CloudMart POS - Deployment Guide (Netlify + Render)

## Overview
- **Frontend**: Deploy to Netlify (free)
- **Backend**: Deploy to Render (free)
- **Database**: Use Supabase PostgreSQL (free)

---

## Step 1: Prepare GitHub Repository

### Create GitHub Repository
```bash
cd cloudmart
git init
git add .
git commit -m "Initial CloudMart POS commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/cloudmart-pos.git
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create Supabase Database (Free)
1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Create a new project
4. Go to Settings → Database → Connection String
5. Copy the PostgreSQL connection string
6. Keep this safe - you'll need it for Render

### 2.2 Deploy Backend to Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository
5. Configure:
   - **Name**: `cloudmart-pos-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend`

### 2.3 Add Environment Variables on Render
Click **"Environment"** and add:
```
DATABASE_URL=postgresql://...your-supabase-connection-string...
SECRET_KEY=your-random-secret-key-here

SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### 2.4 Create Tables & Admin User
1. Wait for deployment to complete
2. Go to your Render app → Shell
3. Run:
```bash
python -c "from core.database import Base, engine; from models.models import *; Base.metadata.create_all(bind=engine)"
```
4. Create admin user:
```bash
python -c "
from core.database import SessionLocal
from core.security import hash_password
from models.models import User, UserRole
db = SessionLocal()
admin = User(name='Admin', email='admin@example.com', username='admin', hashed_password=hash_password('admin123'), role=UserRole.admin)
db.add(admin)
db.commit()
"
```

**Your backend URL will be**: `https://cloudmart-pos-backend.onrender.com`

---

## Step 3: Deploy Frontend to Netlify

### 3.1 Configure Frontend for Production
Edit `frontend/.env.production`:
```
VITE_API_URL=https://cloudmart-pos-backend.onrender.com/api
```

### 3.2 Deploy to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click **"Add new site"** → **"Import an existing project"**
4. Connect your GitHub repository
5. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### 3.3 Add Environment Variables
Click **"Site settings"** → **"Build & deploy"** → **"Environment**:
```
VITE_API_URL=https://cloudmart-pos-backend.onrender.com/api
```

### 3.4 Deploy
Click **"Deploy site"**

**Your frontend URL will be**: `https://cloudmart-pos.netlify.app` (or custom domain)

---

## Step 4: Connect Frontend to Backend (CORS)

Add to `backend/main.py` list of allowed origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://cloudmart-pos.netlify.app",  # Your Netlify URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Step 5: Custom Domain (Optional)

### Domain for Backend (Render)
1. Go to Render → Your app → Settings
2. Click **"Custom Domain"**
3. Enter: `api.yourdomain.com`
4. Add DNS record from Render panel

### Domain for Frontend (Netlify)
1. Go to Netlify → Site settings → Domain management
2. Click **"Add custom domain"**
3. Enter: `yourdomain.com` or `app.yourdomain.com`
4. Update DNS at your registrar

---

## Troubleshooting

### Backend won't start on Render?
- Check build logs: Deploy → Build Logs
- Ensure `requirements.txt` has all dependencies
- Check environment variables are set correctly

### "Cannot GET /" error?
- Check the backend Start Command is correct
- Verify DATABASE_URL is valid
- Check Render logs for errors

### Frontend shows "Cannot reach API"?
- Verify VITE_API_URL in Netlify environment
- Rebuild frontend after changing env vars
- Check CORS is configured with your frontend URL
- Check backend is running on Render

### Database connection fails?
- Test Supabase connection string locally first
- Check IP whitelist on Supabase (should allow all)
- Verify PostgreSQL connection format is correct

---

## Free Tier Limits

| Service | Free Tier | Cost |
|---------|-----------|------|
| Render   | 750 hours/month + sleep after 15 min | Upgrade for always-on |
| Netlify  | Unlimited deploys | Free |
| Supabase | 500MB database | Upgrade for more |

**Note**: Render web services sleep after 15 minutes with no traffic. First request will be slow (30 seconds).
To keep always-on: Upgrade to Starter tier ($7/month)

---

## Monitoring & Updates

### Update Backend on Render
```bash
git add .
git commit -m "Update changes"
git push origin main
```
→ Render auto-redeploys

### Update Frontend on Netlify
```bash
git add .
git commit -m "Update changes"
git push origin main
```
→ Netlify auto-redeploys

### View Logs
- **Render**: Logs → Recent logs
- **Netlify**: Deploys → Deploy log
- **Supabase**: Logs (in dashboard)

---

## Security Checklist

- [ ] Change default admin password after deployment
- [ ] Generate strong SECRET_KEY for backend
- [ ] Use Gmail App Password (not regular password)
- [ ] Remove `.env` files from git (use `.gitignore`)
- [ ] Set up HTTPS (automatic on both Netlify + Render)
- [ ] Configure email domain/sender properly
- [ ] Regular database backups (Supabase auto-backs up)
- [ ] Monitor API logs for suspicious activity