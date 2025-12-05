# Setup Checklist

Use this checklist to ensure your HMS project is properly configured.

## Pre-Setup

- [ ] Python 3.11+ installed
- [ ] PostgreSQL installed and running
- [ ] Node.js 18+ installed
- [ ] Git repository initialized (if pushing to GitHub)

## Database Setup

- [ ] PostgreSQL service is running
- [ ] Database `hms_db` created
- [ ] User `hms_user` created with password
- [ ] Permissions granted to user

**SQL Commands:**
```sql
CREATE DATABASE hms_db;
CREATE USER hms_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE hms_db TO hms_user;
```

## Python Environment

- [ ] Virtual environment created
- [ ] Virtual environment activated
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] No installation errors

## Environment Configuration

- [ ] `.env` file created in project root
- [ ] `SECRET_KEY` generated and added
- [ ] Database credentials configured
- [ ] Google Calendar OAuth credentials added
- [ ] Email service URL configured

**Generate SECRET_KEY:**
```bash
python generate_secret_key.py
```

## Google Cloud Setup

- [ ] Google Cloud project created
- [ ] Google Calendar API enabled
- [ ] OAuth 2.0 credentials created (Web application)
- [ ] Redirect URI added: `http://localhost:8000/api/calendar/callback/`
- [ ] Client ID and Secret copied to `.env`

## Django Setup

- [ ] Migrations created (`python manage.py makemigrations`)
- [ ] Migrations applied (`python manage.py migrate`)
- [ ] Superuser created (`python manage.py createsuperuser`)
- [ ] Admin panel accessible at `/admin/`

## Email Service Setup

- [ ] Navigated to `serverless-email/` directory
- [ ] Node.js dependencies installed (`npm install`)
- [ ] `.env` file created in `serverless-email/` directory
- [ ] SMTP credentials configured
- [ ] Gmail app password generated (if using Gmail)
- [ ] Email service tested locally (`npm start`)

**Gmail App Password:**
1. Google Account → Security
2. Enable 2-Step Verification
3. App Passwords → Generate
4. Use generated password (not regular password)

## Testing

- [ ] Django server starts without errors
- [ ] Email service starts on port 3000
- [ ] Admin panel accessible
- [ ] API endpoints respond
- [ ] Test script runs successfully (`python test_api.py`)

## Verification Steps

### 1. Test Server Startup
```bash
python manage.py runserver
```
- [ ] Server starts on http://localhost:8000
- [ ] No errors in console

### 2. Test Admin Panel
- [ ] Visit http://localhost:8000/admin/
- [ ] Login with superuser
- [ ] Can see Users, Appointments, Availability Slots

### 3. Test API Endpoints
```bash
# Test signup
curl -X POST http://localhost:8000/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123","password_confirm":"test123","role":"doctor"}'
```
- [ ] Returns 201 status
- [ ] User created successfully

### 4. Test Email Service
```bash
# From serverless-email directory
curl -X POST http://localhost:3000/email \
  -H "Content-Type: application/json" \
  -d '{"action":"SIGNUP_WELCOME","to_email":"test@test.com","to_name":"Test User","role":"doctor"}'
```
- [ ] Returns 200 status
- [ ] Email received

### 5. Test Google Calendar (Optional)
- [ ] Visit `/api/calendar/authorize/` (while logged in)
- [ ] Get authorization URL
- [ ] Complete OAuth flow
- [ ] Calendar connected successfully

## Common Issues & Solutions

### Issue: Database Connection Error
**Solution:**
- Verify PostgreSQL is running
- Check credentials in `.env`
- Test connection: `psql -U hms_user -d hms_db`

### Issue: Migration Errors
**Solution:**
- Delete `__pycache__` folders
- Delete migration files (except `__init__.py`)
- Run `makemigrations` again

### Issue: Email Service Not Working
**Solution:**
- Verify SMTP credentials
- Check if using Gmail app password (not regular password)
- Ensure email service is running on port 3000
- Check serverless-email logs

### Issue: Google Calendar OAuth Error
**Solution:**
- Verify redirect URI matches exactly
- Check OAuth credentials in Google Cloud Console
- Ensure Calendar API is enabled

### Issue: Import Errors
**Solution:**
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`
- Check Python version: `python --version`

## Pre-Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] `DEBUG=False` in production `.env`
- [ ] `SECRET_KEY` changed to production key
- [ ] `ALLOWED_HOSTS` includes production domain
- [ ] Database credentials updated for production
- [ ] Google OAuth redirect URI updated for production
- [ ] Email service deployed (if using AWS Lambda)
- [ ] `EMAIL_SERVICE_URL` updated to production URL
- [ ] Static files collected (`python manage.py collectstatic`)
- [ ] Security headers configured
- [ ] SSL certificate configured (HTTPS)

## Git Repository Setup

- [ ] `.gitignore` configured
- [ ] `.env` file NOT committed (in `.gitignore`)
- [ ] All code files committed
- [ ] README.md committed
- [ ] Repository pushed to GitHub/GitLab

## Documentation

- [ ] README.md reviewed and accurate
- [ ] QUICKSTART.md reviewed
- [ ] DEPLOYMENT.md reviewed
- [ ] All setup instructions tested

## Final Verification

- [ ] Can sign up as doctor
- [ ] Can sign up as patient
- [ ] Can create availability slots
- [ ] Can book appointments
- [ ] Google Calendar integration works
- [ ] Email notifications sent successfully
- [ ] All features working as expected

---

**Status:** ☐ Not Started | ☐ In Progress | ☐ Complete

**Date Completed:** _______________

**Notes:**
_________________________________
_________________________________
_________________________________

