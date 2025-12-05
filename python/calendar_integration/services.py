from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from django.conf import settings
from users.models import User
from appointments.models import Appointment
import json
from datetime import datetime, timedelta


class GoogleCalendarService:
    """Service for Google Calendar integration"""
    
    SCOPES = ['https://www.googleapis.com/auth/calendar']
    
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI
    
    def get_authorization_url(self):
        """Get Google OAuth authorization URL"""
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri]
                }
            },
            scopes=self.SCOPES,
            redirect_uri=self.redirect_uri
        )
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        return authorization_url, state
    
    def get_credentials_from_code(self, code):
        """Exchange authorization code for credentials"""
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri]
                }
            },
            scopes=self.SCOPES,
            redirect_uri=self.redirect_uri
        )
        flow.fetch_token(code=code)
        return flow.credentials
    
    def get_user_credentials(self, user):
        """Get credentials for a user from stored tokens"""
        if not user.google_calendar_token:
            return None
        
        try:
            token_data = json.loads(user.google_calendar_token)
            creds = Credentials(
                token=token_data.get('token'),
                refresh_token=user.google_calendar_refresh_token or token_data.get('refresh_token'),
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.client_id,
                client_secret=self.client_secret
            )
            return creds
        except Exception as e:
            print(f"Error loading credentials: {e}")
            return None
    
    def create_appointment_event(self, user, appointment, is_doctor=True):
        """Create a calendar event for an appointment"""
        creds = self.get_user_credentials(user)
        if not creds:
            return None
        
        try:
            service = build('calendar', 'v3', credentials=creds)
            
            # Prepare event details
            slot = appointment.slot
            start_datetime = datetime.combine(slot.date, slot.start_time)
            end_datetime = datetime.combine(slot.date, slot.end_time)
            
            # Convert to RFC3339 format
            start_time_rfc = start_datetime.isoformat() + 'Z'
            end_time_rfc = end_datetime.isoformat() + 'Z'
            
            if is_doctor:
                title = f"Appointment with {appointment.patient.get_full_name() or appointment.patient.username}"
                description = f"Patient: {appointment.patient.get_full_name() or appointment.patient.username}\n"
            else:
                title = f"Appointment with Dr. {appointment.doctor.get_full_name() or appointment.doctor.username}"
                description = f"Doctor: Dr. {appointment.doctor.get_full_name() or appointment.doctor.username}\n"
            
            if appointment.notes:
                description += f"Notes: {appointment.notes}\n"
            
            description += f"Appointment ID: {appointment.id}"
            
            event = {
                'summary': title,
                'description': description,
                'start': {
                    'dateTime': start_time_rfc,
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': end_time_rfc,
                    'timeZone': 'UTC',
                },
            }
            
            created_event = service.events().insert(calendarId='primary', body=event).execute()
            return created_event
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return None
        except Exception as e:
            print(f"Error creating calendar event: {e}")
            return None

