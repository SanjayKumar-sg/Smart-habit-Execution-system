from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import (User, MedicalRecord, UserPreferences, Badge, UserBadge,
                     DoctorPatientRelationship, ChatMessage, MedicalAlert, MedicationLog)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=['user', 'patient', 'doctor', 'admin'], default='user', required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'role']

    def create(self, validated_data):
        role = validated_data.pop('role', 'user')
        user = User.objects.create_user(**validated_data)
        user.role = role
        user.save(update_fields=['role'])
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
        except Exception:
            return None

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'avatar', 'role', 'bio',
                  'date_of_birth', 'height_cm', 'weight_kg', 'preferred_language',
                  'dark_mode', 'notification_enabled', 'voice_assistant_enabled',
                  'timezone', 'total_points', 'level', 'streak_count', 'longest_streak',
                  'last_active', 'created_at', 'medical_record']
        read_only_fields = ['total_points', 'level', 'streak_count', 'longest_streak', 'last_active', 'created_at']


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


# ── Doctor–Patient ─────────────────────────────────────────────────────────────

class DoctorPatientSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    patient_username = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    patient_id = serializers.IntegerField(source='patient.id', read_only=True)
    doctor_id = serializers.IntegerField(source='doctor.id', read_only=True)

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}".strip() or obj.patient.username

    def get_patient_username(self, obj):
        return obj.patient.username

    def get_doctor_name(self, obj):
        return f"{obj.doctor.first_name} {obj.doctor.last_name}".strip() or obj.doctor.username

    class Meta:
        model = DoctorPatientRelationship
        fields = ['id', 'doctor_id', 'doctor_name', 'patient_id', 'patient_name',
                  'patient_username', 'status', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


# ── Chat ───────────────────────────────────────────────────────────────────────

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.SerializerMethodField()

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username

    def get_sender_role(self, obj):
        return obj.sender.role

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'sender_name', 'sender_role', 'receiver',
                  'message', 'is_read', 'timestamp']
        read_only_fields = ['sender', 'timestamp', 'is_read']


# ── Alerts ─────────────────────────────────────────────────────────────────────

class MedicalAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalAlert
        fields = '__all__'
        read_only_fields = ['triggered', 'triggered_value', 'triggered_at', 'created_at']


# ── Medication Log ─────────────────────────────────────────────────────────────

class MedicationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationLog
        fields = '__all__'
        read_only_fields = ['user', 'date', 'taken_at', 'points_awarded']
