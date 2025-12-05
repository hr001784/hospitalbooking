from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from .serializers import UserSerializer, SignUpSerializer, DoctorProfileSerializer, PatientProfileSerializer
from .models import User, DoctorProfile, PatientProfile
import requests
from django.conf import settings


@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def signup(request):
    """User signup endpoint"""
    if request.method == 'GET':
        # Return helpful information for GET requests (browsable API)
        return Response({
            'message': 'Signup endpoint - Use POST method to create an account',
            'method': 'POST',
            'required_fields': ['username', 'email', 'password', 'password_confirm', 'role'],
            'role_options': ['doctor', 'patient'],
            'example': {
                'username': 'testuser',
                'email': 'user@example.com',
                'password': 'securepassword123',
                'password_confirm': 'securepassword123',
                'role': 'doctor',
                'first_name': 'John',
                'last_name': 'Doe',
                'phone_number': '+1234567890'
            }
        })
    
    # POST request handling
    serializer = SignUpSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Send welcome email via serverless function
        try:
            email_data = {
                'action': 'SIGNUP_WELCOME',
                'to_email': user.email,
                'to_name': user.get_full_name() or user.username,
                'role': user.role
            }
            requests.post(settings.EMAIL_SERVICE_URL, json=email_data, timeout=5)
        except Exception as e:
            # Log error but don't fail signup
            print(f"Email service error: {e}")
        
        return Response({
            'message': 'User created successfully',
            'user': UserSerializer(user).data,
            'next_steps': {
                'login': 'Visit /api/auth/login/ to login with your credentials',
                'dashboard': 'After login, visit /api/auth/dashboard/ to see your dashboard'
            }
        }, status=status.HTTP_201_CREATED)
    
    # Return detailed validation errors
    errors = serializer.errors
    error_messages = []
    for field, messages in errors.items():
        if isinstance(messages, list):
            error_messages.extend([f"{field}: {msg}" for msg in messages])
        else:
            error_messages.append(f"{field}: {messages}")
    
    return Response({
        'error': 'Validation failed',
        'errors': serializer.errors,
        'messages': error_messages,
        'help': 'Please check the required fields and try again'
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def login_view(request):
    """User login endpoint"""
    if request.method == 'GET':
        # Return helpful information for GET requests (browsable API)
        return Response({
            'message': 'Login endpoint - Use POST method to login',
            'method': 'POST',
            'required_fields': ['username', 'password'],
            'example': {
                'username': 'your_username',
                'password': 'your_password'
            }
        })
    
    # POST request handling
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'error': 'Missing required fields',
            'message': 'Username and password are required',
            'required_fields': ['username', 'password']
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(request, username=username, password=password)
    if user is not None:
        if not user.is_active:
            return Response({
                'error': 'Account disabled',
                'message': 'Your account has been disabled. Please contact support.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        login(request, user)
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'next_steps': {
                'dashboard': 'Visit /api/auth/dashboard/ to see your dashboard',
                'appointments': 'Visit /api/appointments/ to manage appointments'
            }
        }, status=status.HTTP_200_OK)
    
    return Response({
        'error': 'Invalid credentials',
        'message': 'The username or password you entered is incorrect',
        'help': 'Please check your credentials and try again, or sign up at /api/auth/signup/'
    }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def logout_view(request):
    """User logout endpoint"""
    if request.method == 'GET':
        if not request.user.is_authenticated:
            return Response({
                'message': 'You are not logged in',
                'login_url': '/api/auth/login/'
            })
        return Response({
            'message': 'Logout endpoint - Use POST method to logout',
            'method': 'POST',
            'current_user': UserSerializer(request.user).data if request.user.is_authenticated else None
        })
    
    if not request.user.is_authenticated:
        return Response({
            'message': 'You are not logged in',
            'login_url': '/api/auth/login/'
        }, status=status.HTTP_200_OK)
    
    logout(request)
    return Response({
        'message': 'Logout successful',
        'next_steps': {
            'login': 'Visit /api/auth/login/ to login again'
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def auth_status(request):
    """Check authentication status"""
    if request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user': UserSerializer(request.user).data,
            'message': 'You are logged in'
        })
    else:
        return Response({
            'authenticated': False,
            'message': 'You are not logged in. Please login at /api/auth/login/',
            'login_url': '/api/auth/login/',
            'signup_url': '/api/auth/signup/'
        })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def current_user(request):
    """Get current authenticated user"""
    if not request.user.is_authenticated:
        return Response({
            'error': 'Authentication required',
            'message': 'Please login first at /api/auth/login/',
            'login_url': '/api/auth/login/',
            'signup_url': '/api/auth/signup/'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def dashboard(request):
    """Role-based dashboard information"""
    if not request.user.is_authenticated:
        return Response({
            'error': 'Authentication required',
            'message': 'Please login first to access your dashboard',
            'login_url': '/api/auth/login/',
            'signup_url': '/api/auth/signup/',
            'instructions': {
                'step1': 'Visit /api/auth/signup/ to create an account',
                'step2': 'Visit /api/auth/login/ to login',
                'step3': 'Then visit this endpoint again to see your dashboard'
            }
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    user = request.user
    
    if user.is_doctor:
        try:
            profile = user.doctor_profile
            profile_data = DoctorProfileSerializer(profile).data
        except DoctorProfile.DoesNotExist:
            profile = DoctorProfile.objects.create(user=user)
            profile_data = DoctorProfileSerializer(profile).data
    elif user.is_patient:
        try:
            profile = user.patient_profile
            profile_data = PatientProfileSerializer(profile).data
        except PatientProfile.DoesNotExist:
            profile = PatientProfile.objects.create(user=user)
            profile_data = PatientProfileSerializer(profile).data
    else:
        profile_data = None
    
    return Response({
        'user': UserSerializer(user).data,
        'profile': profile_data,
        'role': user.role,
        'message': f'Welcome to your {user.role} dashboard!'
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def list_doctors(request):
    """List all doctors (for patients)"""
    if not request.user.is_authenticated:
        return Response({
            'error': 'Authentication required',
            'message': 'Please login first to view doctors',
            'login_url': '/api/auth/login/',
            'signup_url': '/api/auth/signup/'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not request.user.is_patient:
        return Response({
            'error': 'Permission denied',
            'message': 'Only patients can view the list of doctors',
            'your_role': request.user.role
        }, status=status.HTTP_403_FORBIDDEN)
    
    doctors = User.objects.filter(role='doctor', is_active=True)
    doctors_data = []
    for doctor in doctors:
        try:
            profile = doctor.doctor_profile
            doctors_data.append({
                'id': doctor.id,
                'username': doctor.username,
                'email': doctor.email,
                'first_name': doctor.first_name,
                'last_name': doctor.last_name,
                'specialization': profile.specialization,
                'bio': profile.bio
            })
        except DoctorProfile.DoesNotExist:
            doctors_data.append({
                'id': doctor.id,
                'username': doctor.username,
                'email': doctor.email,
                'first_name': doctor.first_name,
                'last_name': doctor.last_name,
                'specialization': '',
                'bio': ''
            })
    
    return Response(doctors_data)

