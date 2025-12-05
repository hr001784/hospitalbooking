# Signup Endpoint - Quick Reference

## Endpoint
```
POST /api/auth/signup/
```

## Required Fields
```json
{
    "username": "string (unique)",
    "email": "string (unique, valid email)",
    "password": "string (min 8 chars)",
    "password_confirm": "string (must match password)",
    "role": "string ('doctor' or 'patient')"
}
```

## Optional Fields
```json
{
    "first_name": "string",
    "last_name": "string",
    "phone_number": "string (max 15 chars)"
}
```

## Quick Examples

### Doctor Signup
```json
{
    "username": "dr_smith",
    "email": "dr.smith@hospital.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "role": "doctor",
    "first_name": "John",
    "last_name": "Smith"
}
```

### Patient Signup
```json
{
    "username": "patient_jane",
    "email": "jane@email.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "role": "patient",
    "first_name": "Jane",
    "last_name": "Doe"
}
```

## Success Response (201)
```json
{
    "message": "User created successfully",
    "user": { /* user data */ },
    "next_steps": {
        "login": "/api/auth/login/",
        "dashboard": "/api/auth/dashboard/"
    }
}
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Password fields didn't match" | Passwords don't match | Ensure password and password_confirm are identical |
| "user with this email already exists" | Email already registered | Use different email or login |
| "This password is too short" | Password < 8 characters | Use longer password |
| "This field is required" | Missing required field | Include all required fields |

## Test URL
Visit: `http://localhost:8000/api/auth/signup/`

For complete documentation, see `SIGNUP_DETAILS.md`

