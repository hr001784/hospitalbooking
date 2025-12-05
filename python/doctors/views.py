from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from appointments.models import AvailabilitySlot, Appointment
from appointments.serializers import AvailabilitySlotSerializer, AppointmentSerializer
from appointments.views import availability_list_create, availability_detail, appointment_list, appointment_detail
from users.models import User, DoctorProfile
from users.serializers import DoctorProfileSerializer, UserSerializer


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def doctor_dashboard(request):
    """Doctor-specific dashboard with appointments and availability"""
    if not request.user.is_authenticated:
        return Response({
            'error': 'Authentication required',
            'message': 'Please login first',
            'login_url': '/api/auth/login/'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not request.user.is_doctor:
        return Response({
            'error': 'Permission denied',
            'message': 'Only doctors can access this dashboard',
            'your_role': request.user.role
        }, status=status.HTTP_403_FORBIDDEN)
    
    user = request.user
    
    # Get doctor profile
    try:
        profile = user.doctor_profile
        profile_data = DoctorProfileSerializer(profile).data
        specialization = profile.specialization
    except DoctorProfile.DoesNotExist:
        profile = DoctorProfile.objects.create(user=user)
        profile_data = DoctorProfileSerializer(profile).data
        specialization = ''
    
    # Get today's appointments
    today = timezone.now().date()
    today_appointments = Appointment.objects.filter(
        doctor=user,
        slot__date=today,
        status='confirmed'
    )
    
    # Get upcoming appointments (future)
    upcoming_appointments = Appointment.objects.filter(
        doctor=user,
        slot__date__gte=today,
        status='confirmed'
    ).order_by('slot__date', 'slot__start_time')[:10]
    
    # Get availability status
    available_slots = AvailabilitySlot.objects.filter(
        doctor=user,
        is_booked=False,
        date__gte=today
    )
    
    # Find next available slot
    next_available = available_slots.filter(
        date__gte=today
    ).order_by('date', 'start_time').first()
    
    return Response({
        'doctor_id': user.id,
        'doctor_name': user.get_full_name() or user.username,
        'username': user.username,
        'email': user.email,
        'specialization': specialization,
        'profile': profile_data,
        'today_appointments': today_appointments.count(),
        'upcoming_appointments': [
            {
                'id': apt.id,
                'patient_id': apt.patient.id,
                'patient_name': apt.patient.get_full_name() or apt.patient.username,
                'patient_email': apt.patient.email,
                'date': str(apt.slot.date),
                'time': f"{apt.slot.start_time}-{apt.slot.end_time}",
                'status': apt.status,
                'notes': apt.notes
            }
            for apt in upcoming_appointments
        ],
        'availability_status': 'available' if next_available else 'no_slots',
        'next_available_slot': f"{next_available.date} {next_available.start_time}-{next_available.end_time}" if next_available else None,
        'total_upcoming_appointments': Appointment.objects.filter(
            doctor=user,
            slot__date__gte=today,
            status='confirmed'
        ).count()
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def doctor_bookings(request):
    """Get all bookings/appointments for the logged-in doctor"""
    if not request.user.is_authenticated:
        return Response({
            'error': 'Authentication required',
            'message': 'Please login first',
            'login_url': '/api/auth/login/'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not request.user.is_doctor:
        return Response({
            'error': 'Permission denied',
            'message': 'Only doctors can view bookings',
            'your_role': request.user.role
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get all appointments for this doctor
    appointments = Appointment.objects.filter(doctor=request.user).order_by('-slot__date', '-slot__start_time')
    
    # Filter by status if provided
    status_filter = request.query_params.get('status')
    if status_filter:
        appointments = appointments.filter(status=status_filter)
    
    # Filter by date if provided
    date_filter = request.query_params.get('date')
    if date_filter:
        appointments = appointments.filter(slot__date=date_filter)
    
    serializer = AppointmentSerializer(appointments, many=True)
    
    return Response({
        'doctor_id': request.user.id,
        'bookings': serializer.data,
        'total_bookings': appointments.count()
    })


@api_view(['PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def doctor_booking_detail(request, pk):
    """Update or cancel a specific booking (doctor's own bookings only)"""
    if not request.user.is_authenticated:
        return Response({
            'error': 'Authentication required',
            'message': 'Please login first',
            'login_url': '/api/auth/login/'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not request.user.is_doctor:
        return Response({
            'error': 'Permission denied',
            'message': 'Only doctors can manage bookings',
            'your_role': request.user.role
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get appointment and verify it belongs to this doctor
    appointment = get_object_or_404(Appointment, pk=pk, doctor=request.user)
    
    if request.method == 'PUT':
        # Allow updating status and notes
        serializer = AppointmentSerializer(appointment, data=request.data, partial=True)
        if serializer.is_valid():
            # If status is being changed to cancelled
            if 'status' in request.data and request.data['status'] == 'cancelled':
                appointment.cancel()
            else:
                serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Cancel the appointment
        appointment.cancel()
        return Response({
            'message': 'Appointment cancelled successfully',
            'appointment_id': appointment.id
        }, status=status.HTTP_200_OK)

