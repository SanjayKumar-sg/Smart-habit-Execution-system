from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, MedicalRecord, UserPreferences, Badge, UserBadge

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    class Meta:
        model = User
        fields = ['id','username','email','password','first_name','last_name']
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        UserPreferences.objects.create(user=user)
        MedicalRecord.objects.create(user=user)
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    def validate(self, data):
        user = authenticate(**data)
        if not user:
            raise serializers.ValidationError('Invalid credentials')
        return {'user': user}

class UserSerializer(serializers.ModelSerializer):
    medical_record = serializers.SerializerMethodField()
    
    def get_medical_record(self, obj):
        try:
            return MedicalRecordSerializer(obj.medical_record).data
        except:
            return None
            
    class Meta:
        model = User
        fields = ['id','username','email','first_name','last_name','avatar','role','bio',
                  'date_of_birth','height_cm','weight_kg','preferred_language',
                  'dark_mode','notification_enabled','voice_assistant_enabled',
                  'timezone','total_points','level','streak_count','longest_streak',
                  'last_active','created_at','medical_record']
        read_only_fields = ['total_points','level','streak_count','longest_streak','last_active','created_at']

class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = '__all__'
        read_only_fields = ['user']

class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = '__all__'
        read_only_fields = ['user']

class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = '__all__'

class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)
    class Meta:
        model = UserBadge
        fields = '__all__'
