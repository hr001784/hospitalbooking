# Date and Time Format Examples

## ⚠️ Common Format Errors and Solutions

If you're getting these errors:
```json
{
    "date": ["Date has wrong format. Use one of these formats instead: YYYY-MM-DD."],
    "start_time": ["Time has wrong format. Use one of these formats instead: hh:mm[:ss[.uuuuuu]]."],
    "end_time": ["Time has wrong format. Use one of these formats instead: hh:mm[:ss[.uuuuuu]]."]
}
```

## ✅ CORRECT Formats

### Date Format: `YYYY-MM-DD`

**✅ Correct Examples:**
- `"2025-12-06"` ✅
- `"2025-01-15"` ✅
- `"2026-03-20"` ✅

**❌ Incorrect Examples:**
- `"12-06-2025"` ❌ (Wrong order)
- `"2025/12/06"` ❌ (Wrong separator)
- `"Dec 6, 2025"` ❌ (Wrong format)
- `"06-12-2025"` ❌ (Wrong order)

### Time Format: `HH:MM` or `HH:MM:SS`

**✅ Correct Examples:**
- `"10:00"` ✅ (HH:MM format)
- `"10:00:00"` ✅ (HH:MM:SS format)
- `"14:30"` ✅ (HH:MM format)
- `"14:30:00"` ✅ (HH:MM:SS format)
- `"09:15"` ✅ (HH:MM format - use leading zero)

**❌ Incorrect Examples:**
- `"10:00 AM"` ❌ (Don't use AM/PM)
- `"10.00"` ❌ (Wrong separator)
- `"10"` ❌ (Missing minutes)
- `"10:0"` ❌ (Minutes must be 2 digits)
- `"25:00"` ❌ (Invalid hour, max is 23)
- `"10:60"` ❌ (Invalid minutes, max is 59)

## Complete Examples

### Example 1: Set Availability (Doctor)

**✅ CORRECT:**
```json
{
    "date": "2025-12-06",
    "time_slots": [
        {
            "start_time": "10:00",
            "end_time": "11:00",
            "is_available": true
        },
        {
            "start_time": "11:00",
            "end_time": "11:30",
            "is_available": true
        }
    ]
}
```

**Python Code:**
```python
import requests

session = requests.Session()
session.post('http://localhost:8000/api/auth/login/', 
             json={'username': 'dr_smith', 'password': 'SecurePass123!'})

# ✅ CORRECT Format
response = session.post('http://localhost:8000/api/doctors/availability/',
    json={
        "date": "2025-12-06",  # YYYY-MM-DD
        "time_slots": [
            {
                "start_time": "10:00",  # HH:MM
                "end_time": "11:00",    # HH:MM
                "is_available": True
            }
        ]
    }
)
print(response.json())
```

### Example 2: Book Appointment (Patient)

**✅ CORRECT:**
```json
{
    "doctor_id": 123,
    "date": "2025-12-06",
    "start_time": "10:00:00",
    "end_time": "11:00:00",
    "notes": "Regular checkup"
}
```

**Python Code:**
```python
import requests

session = requests.Session()
session.post('http://localhost:8000/api/auth/login/', 
             json={'username': 'patient_john', 'password': 'SecurePass123!'})

# ✅ CORRECT Format
response = session.post('http://localhost:8000/api/appointments/book/',
    json={
        "doctor_id": 123,
        "date": "2025-12-06",      # YYYY-MM-DD
        "start_time": "10:00:00",  # HH:MM:SS
        "end_time": "11:00:00",    # HH:MM:SS
        "notes": "Regular checkup"
    }
)
print(response.json())
```

### Example 3: JavaScript/Fetch

**✅ CORRECT:**
```javascript
const availabilityData = {
    date: "2025-12-06",  // YYYY-MM-DD
    time_slots: [
        {
            start_time: "10:00",  // HH:MM
            end_time: "11:00",     // HH:MM
            is_available: true
        }
    ]
};

fetch('http://localhost:8000/api/doctors/availability/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(availabilityData)
});
```

### Example 4: cURL

**✅ CORRECT:**
```bash
curl -X POST http://localhost:8000/api/doctors/availability/ \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "date": "2025-12-06",
    "time_slots": [
      {
        "start_time": "10:00",
        "end_time": "11:00",
        "is_available": true
      }
    ]
  }'
```

## Quick Reference Table

| Field | Format | Example | Notes |
|-------|--------|---------|-------|
| `date` | `YYYY-MM-DD` | `"2025-12-06"` | Use hyphens, 4-digit year |
| `start_time` | `HH:MM` or `HH:MM:SS` | `"10:00"` or `"10:00:00"` | 24-hour format, use colons |
| `end_time` | `HH:MM` or `HH:MM:SS` | `"11:00"` or `"11:00:00"` | 24-hour format, use colons |

## Common Mistakes to Avoid

1. ❌ **Don't use** `"12/06/2025"` → ✅ **Use** `"2025-12-06"`
2. ❌ **Don't use** `"10:00 AM"` → ✅ **Use** `"10:00"`
3. ❌ **Don't use** `"10.00"` → ✅ **Use** `"10:00"`
4. ❌ **Don't use** `"10"` → ✅ **Use** `"10:00"`
5. ❌ **Don't use** `"9:5"` → ✅ **Use** `"09:05"` (leading zeros)

## Testing Your Format

Use this Python function to validate your format:

```python
from datetime import datetime

def validate_date_time(date_str, time_str):
    """Validate date and time formats"""
    try:
        # Validate date
        datetime.strptime(date_str, '%Y-%m-%d')
        print(f"✅ Date '{date_str}' is valid")
        
        # Validate time (try both formats)
        try:
            datetime.strptime(time_str, '%H:%M')
            print(f"✅ Time '{time_str}' is valid (HH:MM format)")
        except ValueError:
            datetime.strptime(time_str, '%H:%M:%S')
            print(f"✅ Time '{time_str}' is valid (HH:MM:SS format)")
        
        return True
    except ValueError as e:
        print(f"❌ Error: {e}")
        return False

# Test examples
validate_date_time("2025-12-06", "10:00")      # ✅ Valid
validate_date_time("2025-12-06", "10:00:00")   # ✅ Valid
validate_date_time("12-06-2025", "10:00")     # ❌ Invalid date
validate_date_time("2025-12-06", "10:00 AM")  # ❌ Invalid time
```

