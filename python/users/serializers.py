from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, DoctorProfile, PatientProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone_number', 'first_name', 'last_name')
        read_only_fields = ('id',)


class DoctorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = DoctorProfile
        fields = ('id', 'user', 'specialization', 'bio', 'license_number')


class PatientProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = PatientProfile
        fields = ('id', 'user', 'date_of_birth', 'address', 'emergency_contact', 'emergency_phone')


class SignUpSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'role', 'phone_number', 'first_name', 'last_name')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        
        # Create profile based on role
        if user.role == 'doctor':
            DoctorProfile.objects.create(user=user)
        elif user.role == 'patient':
            PatientProfile.objects.create(user=user)
        
        return user

