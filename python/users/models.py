from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model with role support"""
    ROLE_CHOICES = [
        ('doctor', 'Doctor'),
        ('patient', 'Patient'),
    ]
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Google Calendar OAuth token storage
    google_calendar_token = models.TextField(blank=True, null=True)
    google_calendar_refresh_token = models.TextField(blank=True, null=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role']
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_doctor(self):
        return self.role == 'doctor'
    
    @property
    def is_patient(self):
        return self.role == 'patient'


class DoctorProfile(models.Model):
    """Extended profile for doctors"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    specialization = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    license_number = models.CharField(max_length=50, blank=True)
    
    def __str__(self):
        return f"Dr. {self.user.get_full_name() or self.user.username}"


class PatientProfile(models.Model):
    """Extended profile for patients"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=100, blank=True)
    emergency_phone = models.CharField(max_length=15, blank=True)
    
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} (Patient)"

