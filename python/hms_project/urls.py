"""
URL configuration for hms_project project.
"""
from django.contrib import admin
from django.urls import path, include
from .views import api_root

urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/appointments/', include('appointments.urls')),
    path('api/doctors/', include('doctors.urls')),
    path('api/calendar/', include('calendar_integration.urls')),
]

