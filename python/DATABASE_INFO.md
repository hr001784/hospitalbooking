# Database Information

## ✅ Yes, Data is Stored in SQL Database!

Your Hospital Management System uses **SQLite** (a SQL database) for local development and can be configured to use **PostgreSQL** for production.

## Current Database Status

### Database Type: **SQLite**
- **File**: `db.sqlite3`
- **Location**: `c:\Users\Admin\.cursor\python\db.sqlite3`
- **Size**: ~196 KB
- **Status**: ✅ Active and storing data

### Current Data Count:
- **Users**: 4 users registered
- **Availability Slots**: 1 slot created
- **Appointments**: 0 appointments (ready for booking)

## Database Tables

The following SQL tables are created and managed by Django:

### User Management Tables:
1. **users_user** - Main user accounts (doctors and patients)
2. **users_doctorprofile** - Extended doctor profiles
3. **users_patientprofile** - Extended patient profiles

### Appointment Tables:
4. **appointments_availabilityslot** - Doctor availability time slots
5. **appointments_appointment** - Patient appointments/bookings

### Django System Tables:
6. **django_migrations** - Migration history
7. **django_session** - User session data
8. **django_admin_log** - Admin action logs
9. **auth_permission** - User permissions
10. **auth_group** - User groups
11. **contenttypes** - Content type registry

## Database Schema

### Users Table (`users_user`)
```sql
- id (Primary Key)
- username (Unique)
- email (Unique)
- password (Hashed)
- role (doctor/patient)
- phone_number
- first_name
- last_name
- google_calendar_token
- google_calendar_refresh_token
- created_at
- updated_at
```

### Availability Slots Table (`appointments_availabilityslot`)
```sql
- id (Primary Key)
- doctor_id (Foreign Key → users_user)
- date (Date)
- start_time (Time)
- end_time (Time)
- is_booked (Boolean)
- created_at (DateTime)
- updated_at (DateTime)
```

### Appointments Table (`appointments_appointment`)
```sql
- id (Primary Key)
- patient_id (Foreign Key → users_user)
- doctor_id (Foreign Key → users_user)
- slot_id (Foreign Key → appointments_availabilityslot)
- status (confirmed/cancelled/completed)
- notes (Text)
- doctor_calendar_event_id
- patient_calendar_event_id
- created_at (DateTime)
- updated_at (DateTime)
```

## Database Configuration

### Current Setup (SQLite - Development)
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### Production Setup (PostgreSQL - Optional)
To use PostgreSQL, set environment variable:
```bash
DB_ENGINE=postgresql
DB_NAME=hms_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

## How to View Database Data

### Using Django Admin:
1. Create superuser: `python manage.py createsuperuser`
2. Access: `http://localhost:8000/admin/`
3. Login and view all tables

### Using Django Shell:
```python
python manage.py shell

# View users
from users.models import User
User.objects.all()

# View availability slots
from appointments.models import AvailabilitySlot
AvailabilitySlot.objects.all()

# View appointments
from appointments.models import Appointment
Appointment.objects.all()
```

### Using SQLite Browser:
1. Download DB Browser for SQLite: https://sqlitebrowser.org/
2. Open `db.sqlite3` file
3. Browse tables and run SQL queries

## Database Migrations

All migrations have been applied:
- ✅ `users` app migrations
- ✅ `appointments` app migrations
- ✅ Django system migrations

To check migrations:
```bash
python manage.py showmigrations
```

## Data Persistence

✅ **All data is persisted** in the SQLite database file (`db.sqlite3`):
- User registrations
- Login sessions
- Doctor availability slots
- Patient appointments
- User profiles

The database file is stored locally and persists between server restarts.

## Backup Recommendations

1. **Regular Backups**: Copy `db.sqlite3` file regularly
2. **Before Updates**: Backup before running migrations
3. **Production**: Use PostgreSQL with automated backups

## Database Queries Examples

### Get all doctors:
```python
from users.models import User
doctors = User.objects.filter(role='doctor')
```

### Get available slots for a doctor:
```python
from appointments.models import AvailabilitySlot
slots = AvailabilitySlot.objects.filter(
    doctor_id=123,
    is_booked=False
)
```

### Get patient appointments:
```python
from appointments.models import Appointment
appointments = Appointment.objects.filter(
    patient_id=456,
    status='confirmed'
)
```

## Summary

✅ **Database**: SQLite (SQL database)  
✅ **Status**: Active and storing data  
✅ **Tables**: 11+ tables created  
✅ **Data**: Users, slots, and appointments stored  
✅ **Migrations**: All applied successfully  

Your data is safely stored in a SQL database!

