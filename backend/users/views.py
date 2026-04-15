from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from .models import User, MedicalRecord, UserPreferences, Badge, UserBadge
from .serializers import (RegisterSerializer, LoginSerializer, UserSerializer,
                          MedicalRecordSerializer, UserPreferencesSerializer,
                          BadgeSerializer, UserBadgeSerializer)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response({'user': UserSerializer(user).data, 'tokens': tokens}, status=201)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        user.last_active = timezone.now()
        user.save(update_fields=['last_active'])
        tokens = get_tokens_for_user(user)
        return Response({'user': UserSerializer(user).data, 'tokens': tokens})

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    def get_object(self):
        return self.request.user

class MedicalRecordView(generics.RetrieveUpdateAPIView):
    serializer_class = MedicalRecordSerializer
    def get_object(self):
        record, _ = MedicalRecord.objects.get_or_create(user=self.request.user)
        return record
    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

class UserPreferencesView(generics.RetrieveUpdateAPIView):
    serializer_class = UserPreferencesSerializer
    def get_object(self):
        prefs, _ = UserPreferences.objects.get_or_create(user=self.request.user)
        return prefs
    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

class BadgesView(generics.ListAPIView):
    serializer_class = UserBadgeSerializer
    def get_queryset(self):
        return UserBadge.objects.filter(user=self.request.user).select_related('badge')

class LeaderboardView(APIView):
    def get(self, request):
        users = User.objects.order_by('-total_points')[:20]
        data = UserSerializer(users, many=True).data
        return Response(data)
