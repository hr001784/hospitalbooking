# Mini Hospital Management System (HMS)

A comprehensive web application for managing doctor availability and patient appointments with Google Calendar integration and serverless email notifications.

## Features

### User Roles

1. **Doctor**
   - Sign up & login
   - Doctor dashboard
   - Set/update availability time slots
   - View and manage own bookings
   - Google Calendar integration

2. **Patient**
   - Sign up & login
   - Patient dashboard
   - View doctors and available time slots
   - Book appointments with doctors
   - Google Calendar integration

### Core Functionality

- **Authentication**: Secure sign up/login with password hashing and role-based access
- **Availability Management**: Doctors can create and manage time slots
- **Appointment Booking**: Patients can book available slots (with race condition protection)
- **Google Calendar Integration**: Automatic event creation for both doctors and patients
- **Email Notifications**: Serverless email service for welcome and booking confirmation emails

## Tech Stack

- **Backend**: Django 4.2.7
- **Database**: PostgreSQL
- **API**: Django REST Framework
- **Calendar**: Google Calendar API (OAuth2)
- **Email Service**: AWS Lambda (Serverless Framework)
- **Deployment**: Ready for Vercel/Railway/Render

## Project Structure

```
.
├── hms_project/          # Django project settings
├── users/                # User management app
├── appointments/         # Appointments and availability app
├── calendar_integration/ # Google Calendar OAuth integration
├── serverless-email/     # AWS Lambda email service
├── manage.py
├── requirements.txt
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.11+
- PostgreSQL (installed and running)
- Node.js 18+ (for serverless email service)
- Google Cloud Project with Calendar API enabled

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE hms_db;
CREATE USER hms_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE hms_db TO hms_user;
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=hms_db
DB_USER=hms_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Google Calendar API
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/calendar/callback/

# Email Service
EMAIL_SERVICE_URL=http://localhost:3000/email
```

### 3. Google Calendar API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:8000/api/calendar/callback/`
6. Copy Client ID and Client Secret to `.env`

### 4. Install Python Dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 5. Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### 6. Setup Serverless Email Service

```bash
cd serverless-email

# Install Node.js dependencies
npm install

# Configure SMTP (create .env file or set environment variables)
# For Gmail:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Use App Password, not regular password
FROM_EMAIL=your-email@gmail.com

# Run locally
npm start
# Service will run on http://localhost:3000/email
```

**Note**: For Gmail, you need to:
- Enable 2-factor authentication
- Generate an App Password (Settings > Security > App passwords)

### 7. Run Django Server

```bash
# From project root
python manage.py runserver
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication

- `POST /api/auth/signup/` - User signup
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/me/` - Get current user
- `GET /api/auth/dashboard/` - Get dashboard data
- `GET /api/auth/doctors/` - List all doctors (patients only)

### Appointments

- `GET /api/appointments/availability/` - List/create availability slots (doctors)
- `GET /api/appointments/availability/<id>/` - Get/update/delete slot (doctors)
- `GET /api/appointments/available-slots/` - Get available slots (patients)
- `POST /api/appointments/book/` - Book appointment (patients)
- `GET /api/appointments/` - List appointments
- `GET /api/appointments/<id>/` - Get/update appointment

### Google Calendar

- `GET /api/calendar/authorize/` - Get OAuth authorization URL
- `GET /api/calendar/callback/` - OAuth callback handler
- `GET /api/calendar/status/` - Check connection status
- `POST /api/calendar/disconnect/` - Disconnect Google Calendar

## Usage Examples

### 1. Sign Up as Doctor

```bash
curl -X POST http://localhost:8000/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dr_smith",
    "email": "dr.smith@example.com",
    "password": "securepassword",
    "password_confirm": "securepassword",
    "role": "doctor",
    "first_name": "John",
    "last_name": "Smith"
  }'
```

### 2. Sign Up as Patient

```bash
curl -X POST http://localhost:8000/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "patient_jane",
    "email": "jane@example.com",
    "password": "securepassword",
    "password_confirm": "securepassword",
    "role": "patient",
    "first_name": "Jane",
    "last_name": "Doe"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "username": "dr_smith",
    "password": "securepassword"
  }'
```

### 4. Create Availability Slot (Doctor)

```bash
curl -X POST http://localhost:8000/api/appointments/availability/ \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "date": "2024-01-15",
    "start_time": "10:00:00",
    "end_time": "11:00:00"
  }'
```

### 5. Book Appointment (Patient)

```bash
curl -X POST http://localhost:8000/api/appointments/book/ \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "doctor_id": 1,
    "date": "2024-01-15",
    "start_time": "10:00:00",
    "end_time": "11:00:00",
    "notes": "Regular checkup"
  }'
```

## Deployment

### Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "wsgi.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "wsgi.py"
    }
  ]
}
```

3. Deploy: `vercel`

### Railway/Render Deployment

1. Connect your Git repository
2. Set environment variables
3. Set build command: `pip install -r requirements.txt && python manage.py migrate`
4. Set start command: `gunicorn hms_project.wsgi:application`

## Testing

Run tests:

```bash
python manage.py test
```

## Demo Video

Create a 10-minute screen recording demonstrating:
1. Doctor signup and login
2. Creating availability slots
3. Patient signup and login
4. Viewing available doctors and slots
5. Booking an appointment
6. Google Calendar integration
7. Email notifications

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

