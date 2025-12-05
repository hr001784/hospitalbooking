# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Python 3.11+ installed
- ✅ PostgreSQL installed and running
- ✅ Node.js 18+ installed (for email service)
- ✅ Google Cloud Project with Calendar API enabled

## Step-by-Step Setup

### 1. Clone and Navigate

```bash
cd /path/to/project
```

### 2. Create Virtual Environment

```bash
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Setup PostgreSQL Database

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database and user
CREATE DATABASE hms_db;
CREATE USER hms_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE hms_db TO hms_user;
\q
```

### 5. Configure Environment Variables

Create `.env` file in project root:

```env
SECRET_KEY=your-secret-key-here-generate-with-django-secret-key-generator
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=hms_db
DB_USER=hms_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/calendar/callback/

EMAIL_SERVICE_URL=http://localhost:3000/email
```

**Generate SECRET_KEY:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 6. Run Database Migrations

```bash
python setup.py
# OR manually:
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### 7. Setup Email Service

```bash
cd serverless-email
npm install

# Create .env file in serverless-email directory:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
FROM_EMAIL=your-email@gmail.com
```

**Gmail App Password Setup:**
1. Go to Google Account Settings
2. Security → 2-Step Verification (enable if not enabled)
3. Security → App passwords
4. Generate app password for "Mail"
5. Use this password (not your regular password)

### 8. Start Services

**Terminal 1 - Django Server:**
```bash
python manage.py runserver
```

**Terminal 2 - Email Service:**
```bash
cd serverless-email
npm start
```

### 9. Test the Setup

1. **Access Admin Panel:**
   - Visit: http://localhost:8000/admin/
   - Login with superuser credentials

2. **Test API:**
   ```bash
   # Sign up as doctor
   curl -X POST http://localhost:8000/api/auth/signup/ \
     -H "Content-Type: application/json" \
     -d '{"username":"dr_test","email":"doctor@test.com","password":"test123","password_confirm":"test123","role":"doctor","first_name":"Test","last_name":"Doctor"}'
   
   # Sign up as patient
   curl -X POST http://localhost:8000/api/auth/signup/ \
     -H "Content-Type: application/json" \
     -d '{"username":"patient_test","email":"patient@test.com","password":"test123","password_confirm":"test123","role":"patient","first_name":"Test","last_name":"Patient"}'
   ```

## Common Issues

### Database Connection Error
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -U hms_user -d hms_db`

### Migration Errors
- Delete migration files (except `__init__.py`) and run `makemigrations` again
- Check database permissions

### Email Service Not Working
- Verify SMTP credentials
- Check if Gmail app password is correct
- Ensure email service is running on port 3000

### Google Calendar OAuth Error
- Verify OAuth credentials in Google Cloud Console
- Check redirect URI matches exactly
- Ensure Calendar API is enabled

## Next Steps

1. Read the full [README.md](README.md) for detailed documentation
2. Explore API endpoints using Postman or curl
3. Create test users and appointments
4. Test Google Calendar integration
5. Record your demo video

## Support

If you encounter issues:
1. Check error messages in terminal
2. Review Django logs
3. Verify all environment variables are set correctly
4. Ensure all services are running

