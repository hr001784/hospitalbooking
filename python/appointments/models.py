from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from users.models import User


class AvailabilitySlot(models.Model):
    """Doctor availability time slots"""
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='availability_slots', limit_choices_to={'role': 'doctor'})
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_booked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['doctor', 'date', 'start_time', 'end_time']
        ordering = ['date', 'start_time']
        indexes = [
            models.Index(fields=['doctor', 'date', 'is_booked']),
        ]
    
    def clean(self):
        """Validate slot times"""
        if self.end_time <= self.start_time:
            raise ValidationError('End time must be after start time')
        
        # Check if slot is in the past
        slot_datetime = timezone.datetime.combine(self.date, self.start_time)
        if timezone.make_aware(slot_datetime) < timezone.now():
            raise ValidationError('Cannot create availability slots in the past')
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.doctor.username} - {self.date} {self.start_time} to {self.end_time}"
    
    @property
    def is_available(self):
        """Check if slot is available (future and not booked)"""
        slot_datetime = timezone.datetime.combine(self.date, self.start_time)
        slot_aware = timezone.make_aware(slot_datetime)
        return not self.is_booked and slot_aware > timezone.now()


class Appointment(models.Model):
    """Patient appointments with doctors"""
    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments', limit_choices_to={'role': 'patient'})
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_appointments', limit_choices_to={'role': 'doctor'})
    slot = models.OneToOneField(AvailabilitySlot, on_delete=models.CASCADE, related_name='appointment')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Google Calendar event IDs
    doctor_calendar_event_id = models.CharField(max_length=255, blank=True, null=True)
    patient_calendar_event_id = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        ordering = ['slot__date', 'slot__start_time']
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['doctor', 'status']),
        ]
    
    def __str__(self):
        return f"Appointment: {self.patient.username} with Dr. {self.doctor.username} on {self.slot.date} at {self.slot.start_time}"
    
    def cancel(self):
        """Cancel appointment and free up the slot"""
        self.status = 'cancelled'
        self.slot.is_booked = False
        self.slot.save()
        self.save()

