from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def api_root(request):
    """API root endpoint with available endpoints information"""
    return JsonResponse({
        'message': 'Welcome to Hospital Management System (HMS) API',
        'version': '1.0.0',
        'endpoints': {
            'authentication': {
                'signup': '/api/auth/signup/',
                'login': '/api/auth/login/',
                'logout': '/api/auth/logout/',
                'auth_status': '/api/auth/status/',
                'current_user': '/api/auth/me/',
                'dashboard': '/api/auth/dashboard/',
                'list_doctors': '/api/auth/doctors/',
            },
            'doctors': {
                'dashboard': '/api/doctors/dashboard/',
                'availability': '/api/doctors/availability/',
                'availability_detail': '/api/doctors/availability/<id>/',
                'bookings': '/api/doctors/bookings/',
                'booking_detail': '/api/doctors/bookings/<id>/',
            },
            'appointments': {
                'availability': '/api/appointments/availability/',
                'available_slots': '/api/appointments/available-slots/',
                'book_appointment': '/api/appointments/book/',
                'list_appointments': '/api/appointments/',
            },
            'calendar': {
                'authorize': '/api/calendar/authorize/',
                'callback': '/api/calendar/callback/',
                'status': '/api/calendar/status/',
                'disconnect': '/api/calendar/disconnect/',
            },
            'admin': '/admin/',
        },
        'documentation': {
            'readme': 'See README.md for detailed documentation',
            'quickstart': 'See QUICKSTART.md for setup instructions',
        }
    })

