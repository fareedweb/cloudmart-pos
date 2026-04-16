from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db
from core.security import manager_or_admin
from models.models import DayEnd, Sale, Return, Expense, SaleStatus, User
from schemas.auth import DayEndCreate
from datetime import date
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

router = APIRouter()

def send_dayend_email(user: User, dayend_data: dict, recipient_email: str):
    """Send day end report via email"""
    try:
        # Email configuration
        sender_email = os.getenv('SMTP_EMAIL', 'noreply@cloudmart.com')
        sender_password = os.getenv('SMTP_PASSWORD', '')
        smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', 587))
        
        # If no credentials, skip email
        if not sender_password or not recipient_email:
            return False
        
        # Create email message
        message = MIMEMultipart('alternative')
        message['Subject'] = f"CloudMart Day-End Report - {dayend_data['date']}"
        message['From'] = sender_email
        message['To'] = recipient_email
        
        # HTML email body
        html = f"""<html>
            <body style="font-family: Arial, sans-serif;">
                <h2>CloudMart POS - Day-End Report</h2>
                <p>Date: <strong>{dayend_data['date']}</strong></p>
                <p>Closed by: <strong>{user.name}</strong></p>
                <hr>
                <h3>Daily Summary</h3>
                <table style="border-collapse: collapse; width: 100%;" border="1">
                    <tr style="background-color: #f5f5f5;">
                        <td style="padding: 8px;"><strong>Metric</strong></td>
                        <td style="padding: 8px;" align="right"><strong>Amount</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">Total Sales</td>
                        <td style="padding: 8px;" align="right">${dayend_data['total_sales']:.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">Total Returns</td>
                        <td style="padding: 8px;" align="right">${dayend_data['total_returns']:.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">Total Expenses</td>
                        <td style="padding: 8px;" align="right">${dayend_data['total_expenses']:.2f}</td>
                    </tr>
                    <tr style="background-color: #e8f5e9;">
                        <td style="padding: 8px;"><strong>Net Profit</strong></td>
                        <td style="padding: 8px;" align="right"><strong>${dayend_data['net_profit']:.2f}</strong></td>
                    </tr>
                </table>
                <h3>Cash Reconciliation</h3>
                <table style="border-collapse: collapse; width: 100%;" border="1">
                    <tr style="background-color: #f5f5f5;">
                        <td style="padding: 8px;"><strong>Item</strong></td>
                        <td style="padding: 8px;" align="right"><strong>Amount</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">Opening Cash</td>
                        <td style="padding: 8px;" align="right">${dayend_data['opening_cash']:.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">System Closing</td>
                        <td style="padding: 8px;" align="right">${dayend_data['closing_cash_system']:.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">Physical Count</td>
                        <td style="padding: 8px;" align="right">${dayend_data['closing_cash_physical']:.2f}</td>
                    </tr>
                    <tr style="background-color: {'#fff3cd' if abs(dayend_data['cash_difference']) > 10 else '#e8f5e9'};">
                        <td style="padding: 8px;"><strong>Difference</strong></td>
                        <td style="padding: 8px;" align="right"><strong>${dayend_data['cash_difference']:.2f}</strong></td>
                    </tr>
                </table>
                <hr>
                <p style="color: #666;"><small>This is an automated report from CloudMart POS System</small></p>
            </body>
        </html>"""
        
        part = MIMEText(html, 'html')
        message.attach(part)
        
        # Send email
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, recipient_email, message.as_string())
        
        return True
    except Exception as e:
        print(f"Email send failed: {e}")
        return False

@router.post("/")
def close_day(data: DayEndCreate, db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    existing = db.query(DayEnd).filter(DayEnd.date == data.date).first()
    if existing and existing.is_locked: raise HTTPException(400, "Day already locked")
    sales = db.query(Sale).filter(func.date(Sale.created_at) == data.date, Sale.status == SaleStatus.completed).all()
    returns = db.query(Return).filter(func.date(Return.created_at) == data.date).all()
    expenses = db.query(Expense).filter(Expense.expense_date == data.date).all()
    total_sales = sum(s.total_amount for s in sales)
    total_returns = sum(r.refund_amount for r in returns)
    total_expenses = sum(e.amount for e in expenses)
    cash_system = data.opening_cash + sum(s.total_amount for s in sales if s.payment_method == "cash")
    record = existing or DayEnd(date=data.date)
    record.cashier_id = current_user.id
    record.opening_cash = data.opening_cash
    record.closing_cash_physical = data.closing_cash_physical
    record.closing_cash_system = cash_system
    record.cash_difference = data.closing_cash_physical - cash_system
    record.total_sales = total_sales
    record.total_returns = total_returns
    record.total_expenses = total_expenses
    record.net_profit = total_sales - total_returns - total_expenses
    record.is_locked = True
    record.notes = data.notes
    if not existing: db.add(record)
    db.commit()
    
    # Prepare response data
    response_data = {
        "date": str(data.date), 
        "total_sales": round(total_sales,2), 
        "net_profit": round(record.net_profit,2), 
        "transactions": len(sales),
        "total_returns": round(total_returns, 2),
        "total_expenses": round(total_expenses, 2),
        "opening_cash": data.opening_cash,
        "closing_cash_system": round(cash_system, 2),
        "closing_cash_physical": data.closing_cash_physical,
        "cash_difference": round(record.cash_difference, 2),
        "email_sent": False
    }
    
    # Try to send email if configured and user has email
    if current_user.email:
        email_sent = send_dayend_email(current_user, response_data, current_user.email)
        response_data["email_sent"] = email_sent
    
    return response_data

@router.get("/")
def get_dayend_records(db: Session = Depends(get_db), current_user=Depends(manager_or_admin)):
    return db.query(DayEnd).order_by(DayEnd.date.desc()).limit(30).all()
