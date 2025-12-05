from django.urls import path
from . import views

urlpatterns = [
    path('authorize/', views.authorize, name='calendar_authorize'),
    path('callback/', views.oauth_callback, name='calendar_callback'),
    path('status/', views.connection_status, name='calendar_status'),
    path('disconnect/', views.disconnect, name='calendar_disconnect'),
]

