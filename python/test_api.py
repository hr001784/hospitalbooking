#!/usr/bin/env python
"""
Simple API test script
Run this after starting the server to test basic functionality
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_signup(role="doctor"):
    """Test user signup"""
    url = f"{BASE_URL}/api/auth/signup/"
    data = {
        "username": f"test_{role}",
        "email": f"test_{role}@example.com",
        "password": "testpass123",
        "password_confirm": "testpass123",
        "role": role,
        "first_name": "Test",
        "last_name": role.capitalize()
    }
    response = requests.post(url, json=data)
    print(f"\n{'='*50}")
    print(f"Signup ({role}):")
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print(f"Success! User created: {response.json()}")
        return response.json()['user']['id']
    else:
        print(f"Error: {response.json()}")
        return None

def test_login(username, password):
    """Test user login"""
    url = f"{BASE_URL}/api/auth/login/"
    data = {
        "username": username,
        "password": password
    }
    session = requests.Session()
    response = session.post(url, json=data)
    print(f"\n{'='*50}")
    print(f"Login ({username}):")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Success! Logged in: {response.json()}")
        return session
    else:
        print(f"Error: {response.json()}")
        return None

def test_create_availability(session, date="2024-12-25", start_time="10:00:00", end_time="11:00:00"):
    """Test creating availability slot"""
    url = f"{BASE_URL}/api/appointments/availability/"
    data = {
        "date": date,
        "start_time": start_time,
        "end_time": end_time
    }
    response = session.post(url, json=data)
    print(f"\n{'='*50}")
    print("Create Availability:")
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print(f"Success! Slot created: {response.json()}")
        return response.json()['id']
    else:
        print(f"Error: {response.json()}")
        return None

def test_list_doctors(session):
    """Test listing doctors"""
    url = f"{BASE_URL}/api/auth/doctors/"
    response = session.get(url)
    print(f"\n{'='*50}")
    print("List Doctors:")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Success! Found {len(response.json())} doctors")
        for doctor in response.json():
            print(f"  - {doctor['username']} ({doctor.get('specialization', 'N/A')})")
        return response.json()[0]['id'] if response.json() else None
    else:
        print(f"Error: {response.json()}")
        return None

def test_book_appointment(session, doctor_id, date="2024-12-25", start_time="10:00:00", end_time="11:00:00"):
    """Test booking appointment"""
    url = f"{BASE_URL}/api/appointments/book/"
    data = {
        "doctor_id": doctor_id,
        "date": date,
        "start_time": start_time,
        "end_time": end_time,
        "notes": "Test appointment"
    }
    response = session.post(url, json=data)
    print(f"\n{'='*50}")
    print("Book Appointment:")
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print(f"Success! Appointment booked: {response.json()}")
        return response.json()['id']
    else:
        print(f"Error: {response.json()}")
        return None

def main():
    print("="*50)
    print("HMS API Test Script")
    print("="*50)
    print("\nMake sure the Django server is running on http://localhost:8000")
    
    # Test doctor signup
    doctor_id = test_signup("doctor")
    if not doctor_id:
        print("\n❌ Doctor signup failed. Exiting.")
        return
    
    # Test doctor login
    doctor_session = test_login("test_doctor", "testpass123")
    if not doctor_session:
        print("\n❌ Doctor login failed. Exiting.")
        return
    
    # Test creating availability
    slot_id = test_create_availability(doctor_session)
    
    # Test patient signup
    patient_id = test_signup("patient")
    if not patient_id:
        print("\n❌ Patient signup failed. Exiting.")
        return
    
    # Test patient login
    patient_session = test_login("test_patient", "testpass123")
    if not patient_session:
        print("\n❌ Patient login failed. Exiting.")
        return
    
    # Test listing doctors
    doctor_id_for_booking = test_list_doctors(patient_session)
    if not doctor_id_for_booking:
        print("\n❌ No doctors found. Exiting.")
        return
    
    # Test booking appointment
    appointment_id = test_book_appointment(patient_session, doctor_id_for_booking)
    
    print("\n" + "="*50)
    print("Test Summary")
    print("="*50)
    print("✅ Doctor signup: OK" if doctor_id else "❌ Doctor signup: FAILED")
    print("✅ Doctor login: OK" if doctor_session else "❌ Doctor login: FAILED")
    print("✅ Create availability: OK" if slot_id else "❌ Create availability: FAILED")
    print("✅ Patient signup: OK" if patient_id else "❌ Patient signup: FAILED")
    print("✅ Patient login: OK" if patient_session else "❌ Patient login: FAILED")
    print("✅ List doctors: OK" if doctor_id_for_booking else "❌ List doctors: FAILED")
    print("✅ Book appointment: OK" if appointment_id else "❌ Book appointment: FAILED")
    print("="*50)

if __name__ == '__main__':
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to server.")
        print("Make sure Django server is running: python manage.py runserver")
    except Exception as e:
        print(f"\n❌ Error: {e}")

