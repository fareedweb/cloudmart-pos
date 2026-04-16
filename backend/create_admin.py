from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.models import User
from core.security import hash_password

db: Session = SessionLocal()
try:
    # Check if admin user exists
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            name="Administrator",
            email="admin@cloudmart.com",
            username="admin",
            hashed_password=hash_password("admin123"),
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.commit()
        print("Default admin user created: username=admin, password=admin123")
    else:
        print("Admin user already exists")
finally:
    db.close()