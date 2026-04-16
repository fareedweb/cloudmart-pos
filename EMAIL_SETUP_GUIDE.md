# Email Configuration Guide for CloudMart POS

## Overview
The CloudMart POS system can send automatic email reports when you complete the daily day-end closing. This helps managers stay updated with daily sales summaries without manually checking the system.

## What Gets Sent?
When you close the day, an HTML email report includes:
- **Daily Summary**: Total Sales, Returns, Expenses, Net Profit
- **Cash Reconciliation**: Opening Cash, System Closing, Physical Count, Cash Difference
- **Personnel Info**: Who closed the day and when

## Setup Instructions

### Option 1: Gmail (Recommended)

#### Step 1: Generate Gmail App Password
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Sign in to your Google account
3. Select "Mail" and "Windows Computer" (or your device)
4. Generate the password
5. Copy the 16-character password

#### Step 2: Configure Backend
In the `backend/.env` file, add:
```
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Option 2: Other Email Providers

**Outlook/Hotmail:**
```
SMTP_EMAIL=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

**Office 365:**
```
SMTP_EMAIL=your-email@yourdomain.com
SMTP_PASSWORD=your-password
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
```

**Custom SMTP Server:**
Contact your email/hosting provider for SMTP details and add them to the .env file.

### Step 3: Restart Backend
After updating .env, restart the FastAPI backend:
```bash
# Press Ctrl+C to stop the current process
# Then run again:
uvicorn main:app --reload --port 8000
```

### Step 4: Test
1. Go to POS → Day-End Closing
2. Enter closing cash and click "Close Day"
3. You should see "✓ Report email sent to: your-email@gmail.com"
4. Check your email inbox for the report

## Troubleshooting

### Email Not Sending?
- ✓ Check that SMTP_PASSWORD is set and not empty
- ✓ Verify user account has an email address
- ✓ Check backend console for error messages
- ✓ For Gmail: Ensure 2FA is enabled and you're using an App Password (not your regular password)

### "Invalid login" Error?
- Double-check SMTP credentials
- Gmail: Make sure you're using the 16-character app password without spaces

### Disable Email
Leave SMTP settings blank in .env file. The system will work normally without sending emails.

## Security Notes
- Never commit `.env` file to version control - it contains passwords
- Use separate email accounts for different environments (dev, staging, production)
- For shared systems, use a service account email instead of personal email

## Example: Daily Report Email
```
Subject: CloudMart Day-End Report - 2026-04-15

CloudMart POS - Day-End Report
Date: 2026-04-15
Closed by: Admin User

Daily Summary
Metric              Amount
Total Sales         $1,245.67
Total Returns       $45.00
Total Expenses      $123.45
Net Profit          $1,077.22

Cash Reconciliation
Item                Amount
Opening Cash        $500.00
System Closing      $1,745.67
Physical Count      $1,750.00
Difference          $4.33
```