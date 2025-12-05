from django.contrib import admin
from .models import AvailabilitySlot, Appointment


@admin.register(AvailabilitySlot)
class AvailabilitySlotAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'date', 'start_time', 'end_time', 'is_booked', 'created_at')
    list_filter = ('is_booked', 'date', 'doctor')
    search_fields = ('doctor__username', 'doctor__email')
    date_hierarchy = 'date'


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'slot', 'status', 'created_at')
    list_filter = ('status', 'slot__date', 'doctor', 'patient')
    search_fields = ('patient__username', 'doctor__username')
    date_hierarchy = 'slot__date'

