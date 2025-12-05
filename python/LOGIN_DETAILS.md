# Login Endpoint - Complete Documentation

## Endpoint Information

**URL:** `/api/auth/login/`  
**Method:** `POST` (also accepts `GET` for information)  
**Authentication:** Not required (public endpoint)  
**Content-Type:** `application/json` or `multipart/form-data`  
**Session:** Creates a session cookie upon successful login

---

## Field Details

### Required Fields

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `username` | string | Username or email | Can use either username or email to login |
| `password` | string | Account password | Must match the password used during signup |

**Note:** The `username` field accepts both username and email address. Django's authentication system will try both.

---

## Request Examples

### Example 1: Login with Username

```json
{
    "username": "dr_smith",
    "password": "SecurePass123!"
}
```

### Example 2: Login with Email

```json
{
    "username": "dr.smith@hospital.com",
    "password": "SecurePass123!"
}
```

### Example 3: Minimal Request

```json
{
    "username": "testuser",
    "password": "mypassword123"
}
```

---

## Success Response

**Status Code:** `200 OK`

**Response Body:**
```json
{
    "message": "Login successful",
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
        "dashboard": "Visit /api/auth/dashboard/ to see your dashboard",
        "appointments": "Visit /api/appointments/ to manage appointments"
    }
}
```

**What Happens:**
1. ✅ User is authenticated
2. ✅ Session cookie is created and stored
3. ✅ User can now access protected endpoints
4. ✅ Session persists for 24 hours (configurable)

---

## Error Responses

### 1. Missing Fields (400 Bad Request)

**Request:**
```json
{
    "username": "dr_smith"
    // password missing
}
```

**Response:**
```json
{
    "error": "Missing required fields",
    "message": "Username and password are required",
    "required_fields": ["username", "password"]
}
```

### 2. Invalid Credentials (401 Unauthorized)

**Request:**
```json
{
    "username": "dr_smith",
    "password": "wrongpassword"
}
```

**Response:**
```json
{
    "error": "Invalid credentials",
    "message": "The username or password you entered is incorrect",
    "help": "Please check your credentials and try again, or sign up at /api/auth/signup/"
}
```

**Possible Causes:**
- Incorrect username/email
- Incorrect password
- Account doesn't exist
- Typo in credentials

### 3. Account Disabled (403 Forbidden)

**Response:**
```json
{
    "error": "Account disabled",
    "message": "Your account has been disabled. Please contact support."
}
```

**Note:** This occurs if the user account exists but `is_active` is set to `False`.

---

## Using the Endpoint

### Method 1: Browser (DRF Browsable API) - Recommended

1. **Visit:** `http://localhost:8000/api/auth/login/`
2. **Scroll down** to the HTML form
3. **Fill in:**
   - Username: Your username or email
   - Password: Your password
4. **Click** the **POST** button
5. **View** the response
6. **Session cookie** is automatically stored in your browser
7. **Access protected endpoints** - You're now logged in!

**Important:** Keep the same browser window/tab open. The session cookie persists across requests in the same browser session.

### Method 2: cURL

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dr_smith",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt
```

**Note:** The `-c cookies.txt` flag saves the session cookie to a file. Use `-b cookies.txt` in subsequent requests to include the cookie.

**Using the cookie in next request:**
```bash
curl -X GET http://localhost:8000/api/auth/dashboard/ \
  -b cookies.txt
```

### Method 3: PowerShell

```powershell
# Login
$body = @{
    username = "dr_smith"
    password = "SecurePass123!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri http://localhost:8000/api/auth/login/ `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -SessionVariable session

# Use session in next request
Invoke-WebRequest -Uri http://localhost:8000/api/auth/dashboard/ `
  -WebSession $session
```

### Method 4: Python (requests)

```python
import requests

# Create a session to maintain cookies
session = requests.Session()

# Login
url = "http://localhost:8000/api/auth/login/"
data = {
    "username": "dr_smith",
    "password": "SecurePass123!"
}

response = session.post(url, json=data)
print(response.json())

# Use the same session for authenticated requests
dashboard_response = session.get("http://localhost:8000/api/auth/dashboard/")
print(dashboard_response.json())
```

### Method 5: JavaScript (fetch)

```javascript
// Login
fetch('http://localhost:8000/api/auth/login/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: Include cookies
    body: JSON.stringify({
        username: 'dr_smith',
        password: 'SecurePass123!'
    })
})
.then(response => response.json())
.then(data => {
    console.log('Login successful:', data);
    // Now make authenticated requests
    return fetch('http://localhost:8000/api/auth/dashboard/', {
        credentials: 'include' // Include cookies
    });
})
.then(response => response.json())
.then(data => console.log('Dashboard:', data))
.catch(error => console.error('Error:', error));
```

### Method 6: Postman

1. **Create a new request**
2. **Method:** POST
3. **URL:** `http://localhost:8000/api/auth/login/`
4. **Headers:** 
   - `Content-Type: application/json`
5. **Body (raw JSON):**
   ```json
   {
       "username": "dr_smith",
       "password": "SecurePass123!"
   }
   ```
6. **Send** the request
7. **Check Cookies** - Postman automatically stores session cookies
8. **Use the same collection** for subsequent requests - cookies are shared

---

## GET Request (Information Only)

You can send a `GET` request to see endpoint information:

**Request:**
```bash
GET http://localhost:8000/api/auth/login/
```

**Response:**
```json
{
    "message": "Login endpoint - Use POST method to login",
    "method": "POST",
    "required_fields": ["username", "password"],
    "example": {
        "username": "your_username",
        "password": "your_password"
    }
}
```

---

## Session Management

### Session Duration
- **Default:** 24 hours (86400 seconds)
- **Configurable:** Set in `settings.py` via `SESSION_COOKIE_AGE`
- **Auto-refresh:** Session extends on each request if `SESSION_SAVE_EVERY_REQUEST = True`

### Session Cookie
- **Name:** `sessionid` (default Django session cookie name)
- **HttpOnly:** Yes (not accessible via JavaScript for security)
- **Secure:** No (in development, set to True in production with HTTPS)
- **SameSite:** Lax (default)

### Checking Session Status

**Endpoint:** `GET /api/auth/status/`

**Response (Authenticated):**
```json
{
    "authenticated": true,
    "user": {
        "id": 1,
        "username": "dr_smith",
        "email": "dr.smith@hospital.com",
        "role": "doctor"
    },
    "message": "You are logged in"
}
```

**Response (Not Authenticated):**
```json
{
    "authenticated": false,
    "message": "You are not logged in. Please login at /api/auth/login/",
    "login_url": "/api/auth/login/",
    "signup_url": "/api/auth/signup/"
}
```

---

## After Successful Login

Once logged in, you can access protected endpoints:

### For Doctors:
- ✅ `/api/auth/dashboard/` - Doctor dashboard
- ✅ `/api/appointments/availability/` - Manage availability slots
- ✅ `/api/appointments/` - View own appointments
- ✅ `/api/calendar/authorize/` - Connect Google Calendar

### For Patients:
- ✅ `/api/auth/dashboard/` - Patient dashboard
- ✅ `/api/auth/doctors/` - View all doctors
- ✅ `/api/appointments/available-slots/` - View available slots
- ✅ `/api/appointments/book/` - Book appointments
- ✅ `/api/appointments/` - View own appointments
- ✅ `/api/calendar/authorize/` - Connect Google Calendar

---

## Logout

**Endpoint:** `POST /api/auth/logout/`

**Request:**
```bash
POST http://localhost:8000/api/auth/logout/
```

**Response:**
```json
{
    "message": "Logout successful",
    "next_steps": {
        "login": "Visit /api/auth/login/ to login again"
    }
}
```

**What Happens:**
- Session is destroyed
- Session cookie is cleared
- User must login again to access protected endpoints

---

## Important Notes

1. **Username vs Email:** You can use either username or email in the `username` field. Django tries both.

2. **Session Persistence:** After login, the session cookie persists in your browser. You don't need to login again for 24 hours (unless you logout or clear cookies).

3. **Same Browser:** Session cookies are browser-specific. If you login in Chrome, you won't be logged in Firefox.

4. **Security:** 
   - Passwords are never sent back in responses
   - Passwords are hashed and never stored in plain text
   - Session cookies are HttpOnly (not accessible via JavaScript)

5. **Case Sensitivity:** Usernames are case-sensitive. "Dr_Smith" and "dr_smith" are different.

6. **Password:** Passwords are case-sensitive and must match exactly.

---

## Common Issues and Solutions

### Issue: "Invalid credentials"
**Possible Causes:**
- Wrong username/email
- Wrong password
- Account doesn't exist
- Typo in credentials

**Solutions:**
1. Double-check username and password
2. Try using email instead of username (or vice versa)
3. Verify account exists at `/api/auth/signup/`
4. Reset password (if feature implemented)
5. Check for typos or extra spaces

### Issue: "Missing required fields"
**Solution:** Ensure both `username` and `password` are included in the request.

### Issue: "Account disabled"
**Solution:** Contact administrator to enable your account.

### Issue: Session not persisting
**Possible Causes:**
- Cookies disabled in browser
- Using incognito/private mode
- Different browser/device
- Session expired

**Solutions:**
1. Enable cookies in browser settings
2. Use normal browsing mode (not incognito)
3. Use the same browser where you logged in
4. Login again if session expired

### Issue: Can't access protected endpoints after login
**Possible Causes:**
- Session cookie not being sent
- Using different browser/client
- Session expired

**Solutions:**
1. Ensure cookies are enabled
2. Use the same browser/client where you logged in
3. Check session status at `/api/auth/status/`
4. Login again if needed

---

## Testing

### Quick Test Flow

1. **Signup** (if you don't have an account):
   ```bash
   POST /api/auth/signup/
   {
       "username": "testuser",
       "email": "test@example.com",
       "password": "testpass123",
       "password_confirm": "testpass123",
       "role": "doctor"
   }
   ```

2. **Login:**
   ```bash
   POST /api/auth/login/
   {
       "username": "testuser",
       "password": "testpass123"
   }
   ```

3. **Check Status:**
   ```bash
   GET /api/auth/status/
   ```

4. **Access Dashboard:**
   ```bash
   GET /api/auth/dashboard/
   ```

5. **Logout:**
   ```bash
   POST /api/auth/logout/
   ```

### Automated Testing

You can use the provided test script:
```bash
python test_api.py
```

This script automatically:
- Creates test users
- Tests login functionality
- Verifies session management

---

## Security Best Practices

1. **Never share credentials** - Keep username and password private
2. **Use HTTPS in production** - Encrypt login requests
3. **Logout when done** - Especially on shared computers
4. **Strong passwords** - Use complex passwords
5. **Session timeout** - Sessions expire after inactivity
6. **HttpOnly cookies** - Prevents XSS attacks
7. **CSRF protection** - Enabled by default in Django

---

## Next Steps

After successful login:

1. **Visit Dashboard:** `/api/auth/dashboard/`
2. **Check Profile:** `/api/auth/me/`
3. **Manage Appointments:** `/api/appointments/`
4. **Connect Calendar:** `/api/calendar/authorize/` (optional)
5. **Logout when done:** `/api/auth/logout/`

---

## API Flow Diagram

```
┌─────────────┐
│   Signup    │
│  (Optional) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Login    │ ────► Creates Session Cookie
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Dashboard  │ ────► Requires Session Cookie
│  Protected  │
│  Endpoints  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Logout    │ ────► Destroys Session
└─────────────┘
```

---

For quick reference, see `LOGIN_QUICK_REFERENCE.md`

