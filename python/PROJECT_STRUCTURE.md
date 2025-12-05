# Project Structure

```
hms-project/
│
├── hms_project/              # Django project configuration
│   ├── __init__.py
│   ├── settings.py          # Django settings with all configurations
│   ├── urls.py              # Main URL routing
│   ├── wsgi.py              # WSGI configuration for deployment
│   └── asgi.py              # ASGI configuration
│
├── users/                    # User management app
│   ├── __init__.py
│   ├── models.py            # User, DoctorProfile, PatientProfile models
│   ├── views.py             # Authentication & user management views
│   ├── serializers.py       # User serializers for API
│   ├── urls.py              # User-related URL patterns
│   ├── admin.py             # Django admin configuration
│   └── apps.py              # App configuration
│
├── appointments/             # Appointments & availability app
│   ├── __init__.py
│   ├── models.py            # AvailabilitySlot, Appointment models
│   ├── views.py             # Availability & booking views
│   ├── serializers.py       # Appointment serializers
│   ├── urls.py              # Appointment URL patterns
│   ├── admin.py             # Admin configuration
│   └── apps.py              # App configuration
│
├── calendar_integration/     # Google Calendar OAuth integration
│   ├── __init__.py
│   ├── services.py          # GoogleCalendarService class
│   ├── views.py             # OAuth callback & status views
│   ├── urls.py              # Calendar URL patterns
│   └── apps.py              # App configuration
│
├── serverless-email/         # AWS Lambda email service
│   ├── handler.py           # Lambda function handler
│   ├── serverless.yml       # Serverless Framework config
│   ├── package.json         # Node.js dependencies
│   ├── requirements.txt     # Python dependencies
│   └── README.md            # Email service documentation
│
├── manage.py                 # Django management script
├── requirements.txt          # Python dependencies
├── setup.py                 # Setup script
├── test_api.py              # API testing script
├── generate_secret_key.py   # Secret key generator
│
├── README.md                # Main documentation
├── QUICKSTART.md            # Quick start guide
├── DEPLOYMENT.md            # Deployment instructions
├── PROJECT_STRUCTURE.md     # This file
│
├── .gitignore               # Git ignore rules
├── vercel.json              # Vercel deployment config
├── Procfile                 # Heroku/Railway deployment config
└── runtime.txt              # Python version specification
```

## Key Components

### 1. User Management (`users/`)
- **Models:**
  - `User`: Custom user model with role (doctor/patient)
  - `DoctorProfile`: Extended profile for doctors
  - `PatientProfile`: Extended profile for patients
- **Features:**
  - Sign up with role selection
  - Login/logout
  - Role-based access control
  - Google Calendar token storage

### 2. Appointments (`appointments/`)
- **Models:**
  - `AvailabilitySlot`: Doctor time slots
  - `Appointment`: Patient bookings
- **Features:**
  - Create/manage availability slots (doctors)
  - View available slots (patients)
  - Book appointments with race condition protection
  - Appointment status management

### 3. Calendar Integration (`calendar_integration/`)
- **Services:**
  - `GoogleCalendarService`: OAuth2 flow and event creation
- **Features:**
  - Google Calendar OAuth authorization
  - Automatic event creation for appointments
  - Token management and refresh

### 4. Email Service (`serverless-email/`)
- **Handler:**
  - `send_email`: Lambda function for sending emails
- **Features:**
  - SIGNUP_WELCOME emails
  - BOOKING_CONFIRMATION emails
  - SMTP integration (Gmail supported)

## Database Schema

### Users
- User (extends AbstractUser)
  - role: doctor/patient
  - email (unique)
  - google_calendar_token
  - google_calendar_refresh_token

### Appointments
- AvailabilitySlot
  - doctor (FK to User)
  - date, start_time, end_time
  - is_booked
- Appointment
  - patient (FK to User)
  - doctor (FK to User)
  - slot (OneToOne with AvailabilitySlot)
  - status: confirmed/cancelled/completed
  - doctor_calendar_event_id
  - patient_calendar_event_id

## API Endpoints Summary

### Authentication (`/api/auth/`)
- POST `/signup/` - User registration
- POST `/login/` - User login
- POST `/logout/` - User logout
- GET `/me/` - Current user info
- GET `/dashboard/` - Role-based dashboard
- GET `/doctors/` - List doctors (patients only)

### Appointments (`/api/appointments/`)
- GET/POST `/availability/` - List/create slots (doctors)
- GET/PUT/DELETE `/availability/<id>/` - Slot management
- GET `/available-slots/` - View available slots (patients)
- POST `/book/` - Book appointment (patients)
- GET `/` - List appointments
- GET/PUT `/<id>/` - Appointment details

### Calendar (`/api/calendar/`)
- GET `/authorize/` - Get OAuth URL
- GET `/callback/` - OAuth callback
- GET `/status/` - Connection status
- POST `/disconnect/` - Disconnect calendar

## Security Features

1. **Password Hashing**: Django's built-in password hashing
2. **Session Authentication**: Secure session-based auth
3. **Role-Based Access**: Permission checks on all endpoints
4. **Race Condition Protection**: Database transactions with `select_for_update`
5. **OAuth State Verification**: CSRF protection for OAuth flow

## Environment Variables

Required in `.env`:
- `SECRET_KEY`: Django secret key
- `DEBUG`: Debug mode (True/False)
- `ALLOWED_HOSTS`: Comma-separated host list
- `DB_*`: PostgreSQL connection details
- `GOOGLE_*`: Google Calendar OAuth credentials
- `EMAIL_SERVICE_URL`: Serverless email service URL

## Deployment Files

- `vercel.json`: Vercel deployment configuration
- `Procfile`: Heroku/Railway deployment command
- `runtime.txt`: Python version specification
- `serverless.yml`: AWS Lambda deployment config

