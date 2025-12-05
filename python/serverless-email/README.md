# HMS Email Service

Serverless email service for Hospital Management System using AWS Lambda and Serverless Framework.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env` file or set environment variables:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
```

For Gmail, you'll need to:
- Enable 2-factor authentication
- Generate an App Password (not your regular password)

## Running Locally

```bash
npm start
# or
serverless offline start
```

The service will run on `http://localhost:3000/email`

## Deployment

```bash
serverless deploy
```

## API

### POST /email

Request body:
```json
{
  "action": "SIGNUP_WELCOME" | "BOOKING_CONFIRMATION",
  "to_email": "user@example.com",
  "to_name": "User Name",
  "role": "doctor" | "patient" (for SIGNUP_WELCOME),
  "doctor_name": "Dr. Smith" (for BOOKING_CONFIRMATION),
  "appointment_date": "2024-01-15" (for BOOKING_CONFIRMATION),
  "appointment_time": "10:00:00" (for BOOKING_CONFIRMATION),
  "appointment_id": "123" (for BOOKING_CONFIRMATION)
}
```

