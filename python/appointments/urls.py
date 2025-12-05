from django.urls import path
from . import views

urlpatterns = [
    path('availability/', views.availability_list_create, name='availability_list_create'),
    path('availability/<int:pk>/', views.availability_detail, name='availability_detail'),
    path('available-slots/', views.available_slots, name='available_slots'),
    path('book/', views.book_appointment, name='book_appointment'),
    path('', views.appointment_list, name='appointment_list'),
    path('<int:pk>/', views.appointment_detail, name='appointment_detail'),
]

