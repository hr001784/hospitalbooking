from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import redirect
from .services import GoogleCalendarService
from users.models import User
import json


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def authorize(request):
    """Initiate Google Calendar OAuth flow"""
    calendar_service = GoogleCalendarService()
    authorization_url, state = calendar_service.get_authorization_url()
    
    # Store state in session for verification
    request.session['oauth_state'] = state
    
    return Response({
        'authorization_url': authorization_url,
        'state': state
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def oauth_callback(request):
    """Handle OAuth callback and store tokens"""
    code = request.GET.get('code')
    state = request.GET.get('state')
    
    # Verify state
    session_state = request.session.get('oauth_state')
    if not state or state != session_state:
        return Response({'error': 'Invalid state parameter'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not code:
        return Response({'error': 'Authorization code not provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        calendar_service = GoogleCalendarService()
        credentials = calendar_service.get_credentials_from_code(code)
        
        # Store tokens in user model
        user = request.user
        user.google_calendar_token = json.dumps({
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'expiry': credentials.expiry.isoformat() if credentials.expiry else None
        })
        if credentials.refresh_token:
            user.google_calendar_refresh_token = credentials.refresh_token
        user.save()
        
        # Clear state from session
        del request.session['oauth_state']
        
        return Response({
            'message': 'Google Calendar connected successfully',
            'connected': True
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to connect Google Calendar: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def connection_status(request):
    """Check Google Calendar connection status"""
    user = request.user
    is_connected = bool(user.google_calendar_token)
    
    return Response({
        'connected': is_connected
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def disconnect(request):
    """Disconnect Google Calendar"""
    user = request.user
    user.google_calendar_token = None
    user.google_calendar_refresh_token = None
    user.save()
    
    return Response({
        'message': 'Google Calendar disconnected successfully'
    })

