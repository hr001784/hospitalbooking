from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import AvailabilitySlot, Appointment
from .serializers import AvailabilitySlotSerializer, AppointmentSerializer, AppointmentCreateSerializer
from users.models import User
from calendar_integration.services import GoogleCalendarService
from django.conf import settings
import requests


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def availability_list_create(request):
    """List or create availability slots (Doctor only)"""
    if not request.user.is_authenticated:
        return Response({
            'error': 'Authentication required',
            'message': 'Please login first',
            'login_url': '/api/auth/login/'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not request.user.is_doctor:
        return Response({
            'error': 'Permission denied',
            'message': 'Only doctors can manage availability slots',
            'your_role': request.user.role,
            'help': 'Please login with a doctor account'
        }, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        # List only current user's availability slots
        slots = AvailabilitySlot.objects.filter(doctor=request.user)
        
        # Filter by date if provided
        date_filter = request.query_params.get('date')
        if date_filter:
            slots = slots.filter(date=date_filter)
        
        # Filter by availability status
        available_only = request.query_params.get('available_only', 'false').lower() == 'true'
        if available_only:
            slots = slots.filter(is_booked=False)
            # Also filter out past slots
            now = timezone.now()
            slots = [slot for slot in slots if slot.is_available]
        
        serializer = AvailabilitySlotSerializer(slots, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = AvailabilitySlotSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(doctor=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def availability_detail(request, pk):
    """Retrieve, update or delete availability slot (Doctor only)"""
    if not request.user.is_doctor:
        return Response({'error': 'Only doctors can manage availability'}, status=status.HTTP_403_FORBIDDEN)
    
    slot = get_object_or_404(AvailabilitySlot, pk=pk, doctor=request.user)
    
    if request.method == 'GET':
        serializer = AvailabilitySlotSerializer(slot)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Don't allow updating if already booked
        if slot.is_booked:
            return Response({'error': 'Cannot update a booked slot'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = AvailabilitySlotSerializer(slot, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if slot.is_booked:
            return Response({'error': 'Cannot delete a booked slot'}, status=status.HTTP_400_BAD_REQUEST)
        slot.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def available_slots(request):
    """Get available slots for a doctor (Patient view)"""
    if not request.user.is_authenticated:
        return Response({
            'error': 'Authentication required',
            'message': 'Please login first',
            'login_url': '/api/auth/login/'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not request.user.is_patient:
        return Response({
            'error': 'Permission denied',
            'message': 'Only patients can view available slots',
            'your_role': request.user.role
        }, status=status.HTTP_403_FORBIDDEN)
    
    doctor_id = request.query_params.get('doctor_id')
    date = request.query_params.get('date')
    
    if not doctor_id:
        return Response({'error': 'doctor_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        doctor = User.objects.get(id=doctor_id, role='doctor', is_active=True)
    except User.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
    
    slots = AvailabilitySlot.objects.filter(
        doctor=doctor,
        is_booked=False
    )
    
    if date:
        slots = slots.filter(date=date)
    
    # Filter out past slots
    now = timezone.now()
    available_slots_list = [slot for slot in slots if slot.is_available]
    
    serializer = AvailabilitySlotSerializer(available_slots_list, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def book_appointment(request):
    """Book an appointment (Patient only)"""
    if not request.user.is_authenticated:
        return Response({
            'error': 'Authentication required',
            'message': 'Please login first',
            'login_url': '/api/auth/login/'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not request.user.is_patient:
        return Response({
            'error': 'Permission denied',
            'message': 'Only patients can book appointments',
            'your_role': request.user.role
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = AppointmentCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    doctor_id = serializer.validated_data['doctor_id']
    date = serializer.validated_data['date']
    start_time = serializer.validated_data['start_time']
    end_time = serializer.validated_data['end_time']
    notes = serializer.validated_data.get('notes', '')
    
    try:
        doctor = User.objects.get(id=doctor_id, role='doctor', is_active=True)
    except User.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Use database transaction to prevent race conditions
    with transaction.atomic():
        # Select for update to lock the row
        slot = AvailabilitySlot.objects.select_for_update().filter(
            doctor=doctor,
            date=date,
            start_time=start_time,
            end_time=end_time,
            is_booked=False
        ).first()
        
        if not slot:
            return Response({'error': 'Slot not found or already booked'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Double-check availability
        if not slot.is_available:
            return Response({'error': 'Slot is no longer available'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark slot as booked
        slot.is_booked = True
        slot.save()
        
        # Create appointment
        appointment = Appointment.objects.create(
            patient=request.user,
            doctor=doctor,
            slot=slot,
            notes=notes
        )
    
    # Create Google Calendar events
    calendar_service = GoogleCalendarService()
    try:
        # Create event in doctor's calendar
        if doctor.google_calendar_token:
            doctor_event = calendar_service.create_appointment_event(
                doctor, appointment, is_doctor=True
            )
            if doctor_event:
                appointment.doctor_calendar_event_id = doctor_event.get('id')
        
        # Create event in patient's calendar
        if request.user.google_calendar_token:
            patient_event = calendar_service.create_appointment_event(
                request.user, appointment, is_doctor=False
            )
            if patient_event:
                appointment.patient_calendar_event_id = patient_event.get('id')
        
        appointment.save()
    except Exception as e:
        # Log error but don't fail the booking
        print(f"Calendar integration error: {e}")
    
    # Send confirmation email
    try:
        email_data = {
            'action': 'BOOKING_CONFIRMATION',
            'to_email': request.user.email,
            'to_name': request.user.get_full_name() or request.user.username,
            'doctor_name': doctor.get_full_name() or doctor.username,
            'appointment_date': str(appointment.slot.date),
            'appointment_time': str(appointment.slot.start_time),
            'appointment_id': appointment.id
        }
        requests.post(settings.EMAIL_SERVICE_URL, json=email_data, timeout=5)
    except Exception as e:
        print(f"Email service error: {e}")
    
    response_serializer = AppointmentSerializer(appointment)
    return Response(response_serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def appointment_list(request):
    """List appointments for current user"""
    if request.user.is_doctor:
        appointments = Appointment.objects.filter(doctor=request.user)
    elif request.user.is_patient:
        appointments = Appointment.objects.filter(patient=request.user)
    else:
        return Response({'error': 'Invalid user role'}, status=status.HTTP_403_FORBIDDEN)
    
    # Filter by status if provided
    status_filter = request.query_params.get('status')
    if status_filter:
        appointments = appointments.filter(status=status_filter)
    
    serializer = AppointmentSerializer(appointments, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def appointment_detail(request, pk):
    """Retrieve or update appointment"""
    appointment = get_object_or_404(Appointment, pk=pk)
    
    # Check if user has permission to view this appointment
    if request.user != appointment.doctor and request.user != appointment.patient:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        serializer = AppointmentSerializer(appointment)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Only allow updating notes or cancelling
        serializer = AppointmentSerializer(appointment, data=request.data, partial=True)
        if serializer.is_valid():
            # If status is being changed to cancelled
            if 'status' in request.data and request.data['status'] == 'cancelled':
                appointment.cancel()
            else:
                serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

