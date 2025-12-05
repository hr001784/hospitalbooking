# Signup Endpoint - Complete Documentation

## Endpoint Information

**URL:** `/api/auth/signup/`  
**Method:** `POST` (also accepts `GET` for information)  
**Authentication:** Not required (public endpoint)  
**Content-Type:** `application/json` or `multipart/form-data`

---

## Field Details

### Required Fields

| Field | Type | Description | Validation Rules |
|-------|------|-------------|-----------------|
| `username` | string | Unique username for login | Required, must be unique |
| `email` | string | Email address | Required, must be unique, valid email format |
| `password` | string | Account password | Required, must pass Django password validators (min length, complexity) |
| `password_confirm` | string | Password confirmation | Required, must match `password` exactly |
| `role` | string | User role | Required, must be either `"doctor"` or `"patient"` |

### Optional Fields

| Field | Type | Description | Max Length |
|-------|------|-------------|------------|
| `first_name` | string | User's first name | 150 characters |
| `last_name` | string | User's last name | 150 characters |
| `phone_number` | string | Contact phone number | 15 characters |

---

## Password Requirements

Django's password validators enforce:
- **Minimum length**: 8 characters (default)
- **Not too common**: Cannot be a common password
- **Not entirely numeric**: Cannot be all numbers
- **Not too similar to username**: Cannot be too similar to username

---

## Role Options

### 1. Doctor (`"doctor"`)
- Creates a `DoctorProfile` automatically
- Can manage availability slots
- Can view own appointments
- Can connect Google Calendar

### 2. Patient (`"patient"`)
- Creates a `PatientProfile` automatically
- Can view available doctors
- Can book appointments
- Can view own appointments
- Can connect Google Calendar

---

## Request Examples

### Example 1: Signup as Doctor (Minimal)

```json
{
    "username": "dr_smith",
    "email": "dr.smith@hospital.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "role": "doctor"
}
```

### Example 2: Signup as Doctor (Complete)

```json
{
    "username": "dr_john_smith",
    "email": "john.smith@hospital.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "role": "doctor",
    "first_name": "John",
    "last_name": "Smith",
    "phone_number": "+1-555-123-4567"
}
```

### Example 3: Signup as Patient (Minimal)

```json
{
    "username": "patient_jane",
    "email": "jane.doe@email.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "role": "patient"
}
```

### Example 4: Signup as Patient (Complete)

```json
{
    "username": "jane_doe",
    "email": "jane.doe@email.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "role": "patient",
    "first_name": "Jane",
    "last_name": "Doe",
    "phone_number": "+1-555-987-6543"
}
```

---

## Success Response

**Status Code:** `201 Created`

```json
{
    "message": "User created successfully",
    "user": {
        "id": 1,
        "username": "dr_smith",
        "email": "dr.smith@hospital.com",
        "role": "doctor",
        "phone_number": "+1-555-123-4567",
        "first_name": "John",
        "last_name": "Smith"
    },
    "next_steps": {
        "login": "Visit /api/auth/login/ to login with your credentials",
        "dashboard": "After login, visit /api/auth/dashboard/ to see your dashboard"
    }
}
```

---

## Error Responses

### 1. Validation Error (400 Bad Request)

**Example: Missing Required Fields**
```json
{
    "error": "Validation failed",
    "errors": {
        "email": ["This field is required."],
        "role": ["This field is required."]
    },
    "messages": [
        "email: This field is required.",
        "role: This field is required."
    ],
    "help": "Please check the required fields and try again"
}
```

**Example: Password Mismatch**
```json
{
    "error": "Validation failed",
    "errors": {
        "password": ["Password fields didn't match."]
    },
    "messages": [
        "password: Password fields didn't match."
    ],
    "help": "Please check the required fields and try again"
}
```

**Example: Invalid Email**
```json
{
    "error": "Validation failed",
    "errors": {
        "email": ["Enter a valid email address."]
    },
    "messages": [
        "email: Enter a valid email address."
    ],
    "help": "Please check the required fields and try again"
}
```

**Example: Duplicate Email**
```json
{
    "error": "Validation failed",
    "errors": {
        "email": ["user with this email already exists."]
    },
    "messages": [
        "email: user with this email already exists."
    ],
    "help": "Please check the required fields and try again"
}
```

**Example: Weak Password**
```json
{
    "error": "Validation failed",
    "errors": {
        "password": [
            "This password is too short. It must contain at least 8 characters.",
            "This password is too common."
        ]
    },
    "messages": [
        "password: This password is too short. It must contain at least 8 characters.",
        "password: This password is too common."
    ],
    "help": "Please check the required fields and try again"
}
```

**Example: Invalid Role**
```json
{
    "error": "Validation failed",
    "errors": {
        "role": ["\"invalid_role\" is not a valid choice."]
    },
    "messages": [
        "role: \"invalid_role\" is not a valid choice."
    ],
    "help": "Please check the required fields and try again"
}
```

---

## Using the Endpoint

### Method 1: Browser (DRF Browsable API)

1. Visit: `http://localhost:8000/api/auth/signup/`
2. Scroll down to the HTML form
3. Fill in all required fields
4. Click the **POST** button
5. View the response

### Method 2: cURL

```bash
curl -X POST http://localhost:8000/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dr_smith",
    "email": "dr.smith@hospital.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "role": "doctor",
    "first_name": "John",
    "last_name": "Smith"
  }'
```

### Method 3: PowerShell

```powershell
$body = @{
    username = "dr_smith"
    email = "dr.smith@hospital.com"
    password = "SecurePass123!"
    password_confirm = "SecurePass123!"
    role = "doctor"
    first_name = "John"
    last_name = "Smith"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8000/api/auth/signup/ `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

### Method 4: Python (requests)

```python
import requests

url = "http://localhost:8000/api/auth/signup/"
data = {
    "username": "dr_smith",
    "email": "dr.smith@hospital.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "role": "doctor",
    "first_name": "John",
    "last_name": "Smith"
}

response = requests.post(url, json=data)
print(response.json())
```

### Method 5: JavaScript (fetch)

```javascript
fetch('http://localhost:8000/api/auth/signup/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        username: 'dr_smith',
        email: 'dr.smith@hospital.com',
        password: 'SecurePass123!',
        password_confirm: 'SecurePass123!',
        role: 'doctor',
        first_name: 'John',
        last_name: 'Smith'
    })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

---

## What Happens After Signup

1. **User Account Created**: User account is created with provided information
2. **Profile Created**: 
   - If `role` is `"doctor"`, a `DoctorProfile` is automatically created
   - If `role` is `"patient"`, a `PatientProfile` is automatically created
3. **Password Hashed**: Password is securely hashed using Django's password hashing
4. **Welcome Email**: A welcome email is sent via the serverless email service (if configured)
5. **Ready to Login**: User can immediately login with the created credentials

---

## GET Request (Information Only)

You can also send a `GET` request to see endpoint information:

**Request:**
```bash
GET http://localhost:8000/api/auth/signup/
```

**Response:**
```json
{
    "message": "Signup endpoint - Use POST method to create an account",
    "method": "POST",
    "required_fields": [
        "username",
        "email",
        "password",
        "password_confirm",
        "role"
    ],
    "role_options": [
        "doctor",
        "patient"
    ],
    "example": {
        "username": "testuser",
        "email": "user@example.com",
        "password": "securepassword123",
        "password_confirm": "securepassword123",
        "role": "doctor",
        "first_name": "John",
        "last_name": "Doe",
        "phone_number": "+1234567890"
    }
}
```

---

## Important Notes

1. **Email Uniqueness**: Each email can only be used once. If you try to signup with an existing email, you'll get an error.

2. **Username Uniqueness**: Each username must be unique. If taken, you'll get an error.

3. **Password Security**: Passwords are never stored in plain text. They are hashed using Django's secure password hashing.

4. **Profile Auto-Creation**: Profiles are automatically created based on the role selected.

5. **Email Service**: Welcome emails are sent asynchronously. If the email service is not running, signup will still succeed (email failure doesn't block account creation).

6. **Session**: After signup, you need to login separately to get a session. Signup does not automatically log you in.

---

## Common Issues and Solutions

### Issue: "Password fields didn't match"
**Solution:** Ensure `password` and `password_confirm` are exactly the same.

### Issue: "user with this email already exists"
**Solution:** Use a different email address or login with existing account.

### Issue: "This password is too short"
**Solution:** Use a password with at least 8 characters.

### Issue: "This password is too common"
**Solution:** Use a more unique password (avoid common passwords like "password123").

### Issue: "role: \"xyz\" is not a valid choice"
**Solution:** Use either `"doctor"` or `"patient"` (lowercase, exact match).

---

## Next Steps After Signup

1. **Login**: Visit `/api/auth/login/` with your credentials
2. **Dashboard**: After login, visit `/api/auth/dashboard/` to see your dashboard
3. **For Doctors**: 
   - Create availability slots at `/api/appointments/availability/`
   - Connect Google Calendar at `/api/calendar/authorize/`
4. **For Patients**:
   - View doctors at `/api/auth/doctors/`
   - View available slots at `/api/appointments/available-slots/`
   - Book appointments at `/api/appointments/book/`

---

## Testing

You can test the signup endpoint using the provided examples or the test script:

```bash
python test_api.py
```

This will automatically create test users and verify the signup functionality.

