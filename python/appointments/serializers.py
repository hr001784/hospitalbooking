from rest_framework import serializers
from .models import AvailabilitySlot, Appointment
from users.serializers import UserSerializer
from django.utils import timezone


class AvailabilitySlotSerializer(serializers.ModelSerializer):
    doctor = UserSerializer(read_only=True)
    doctor_id = serializers.IntegerField(write_only=True, required=False)
    is_available = serializers.ReadOnlyField()
    
    class Meta:
        model = AvailabilitySlot
        fields = ('id', 'doctor', 'doctor_id', 'date', 'start_time', 'end_time', 'is_booked', 'is_available', 'created_at')
        read_only_fields = ('is_booked',)


class AppointmentSerializer(serializers.ModelSerializer):
    patient = UserSerializer(read_only=True)
    doctor = UserSerializer(read_only=True)
    slot = AvailabilitySlotSerializer(read_only=True)
    slot_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Appointment
        fields = ('id', 'patient', 'doctor', 'slot', 'slot_id', 'status', 'notes', 'created_at', 
                  'doctor_calendar_event_id', 'patient_calendar_event_id')
        read_only_fields = ('patient', 'status', 'doctor_calendar_event_id', 'patient_calendar_event_id')


class AppointmentCreateSerializer(serializers.Serializer):
    """Serializer for creating appointments"""
    doctor_id = serializers.IntegerField()
    date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    notes = serializers.CharField(required=False, allow_blank=True)

