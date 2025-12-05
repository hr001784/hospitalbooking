from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('status/', views.auth_status, name='auth_status'),
    path('me/', views.current_user, name='current_user'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('doctors/', views.list_doctors, name='list_doctors'),
]

