from django.urls import path
from . import views
from appointments.views import availability_list_create, availability_detail

urlpatterns = [
    # Doctor dashboard
    path('dashboard/', views.doctor_dashboard, name='doctor_dashboard'),
    
    # Availability endpoints (route to appointments views)
    path('availability/', availability_list_create, name='doctor_availability_list_create'),
    path('availability/<int:pk>/', availability_detail, name='doctor_availability_detail'),
    
    # Bookings endpoints
    path('bookings/', views.doctor_bookings, name='doctor_bookings'),
    path('bookings/<int:pk>/', views.doctor_booking_detail, name='doctor_booking_detail'),
]

