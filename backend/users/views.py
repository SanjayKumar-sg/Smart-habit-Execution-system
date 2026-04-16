from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.db.models import Q
from .models import (User, MedicalRecord, UserPreferences, Badge, UserBadge,
                     DoctorPatientRelationship, ChatMessage, MedicalAlert, MedicationLog)
from .serializers import (RegisterSerializer, LoginSerializer, UserSerializer,
                          MedicalRecordSerializer, UserPreferencesSerializer,
                          BadgeSerializer, UserBadgeSerializer,
                          DoctorPatientSerializer, ChatMessageSerializer,
                          MedicalAlertSerializer, MedicationLogSerializer)
import datetime


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


# ── Auth ───────────────────────────────────────────────────────────────────────

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


# ── Profile ────────────────────────────────────────────────────────────────────

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


# ── Medical Record (Patient = read-only, Doctor/Admin = can write) ─────────────

class MedicalRecordView(generics.RetrieveUpdateAPIView):
    serializer_class = MedicalRecordSerializer

    def get_object(self):
        record, _ = MedicalRecord.objects.get_or_create(user=self.request.user)
        return record

    def perform_update(self, serializer):
        # Patients cannot edit their own medical records
        if self.request.user.role in ('patient', 'user'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Patients cannot edit medical records directly.")
        serializer.save(user=self.request.user)


class AdminMedicalRecordView(generics.RetrieveUpdateAPIView):
    """Doctor/Admin endpoint to read/update any patient's medical record."""
    serializer_class = MedicalRecordSerializer

    def get_object(self):
        user_id = self.request.query_params.get('user_id') or self.request.data.get('user_id')
        if not user_id:
            return None
        record, _ = MedicalRecord.objects.get_or_create(user_id=user_id)
        return record

    def perform_update(self, serializer):
        user_id = self.request.data.get('user_id')
        record = serializer.save(user_id=user_id)
        # Check medical alerts after vital update
        self._check_alerts(user_id, self.request.data)
        return record

    def _check_alerts(self, patient_id, vitals):
        """Fire alerts if any vital breaches a threshold."""
        alerts = MedicalAlert.objects.filter(patient_id=patient_id, is_active=True, triggered=False)
        for alert in alerts:
            value = vitals.get(alert.vital_name)
            if value is None:
                continue
            value = float(value)
            breached = False
            if alert.threshold_min is not None and value < alert.threshold_min:
                breached = True
            if alert.threshold_max is not None and value > alert.threshold_max:
                breached = True
            if breached:
                alert.triggered = True
                alert.triggered_value = value
                alert.triggered_at = timezone.now()
                alert.save(update_fields=['triggered', 'triggered_value', 'triggered_at'])


# ── Preferences ────────────────────────────────────────────────────────────────

class UserPreferencesView(generics.RetrieveUpdateAPIView):
    serializer_class = UserPreferencesSerializer

    def get_object(self):
        prefs, _ = UserPreferences.objects.get_or_create(user=self.request.user)
        return prefs

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)


# ── Badges & Leaderboard ────────────────────────────────────────────────────────

class BadgesView(generics.ListAPIView):
    serializer_class = UserBadgeSerializer

    def get_queryset(self):
        return UserBadge.objects.filter(user=self.request.user).select_related('badge')


class LeaderboardView(APIView):
    def get(self, request):
        users = User.objects.order_by('-total_points')[:20]
        data = UserSerializer(users, many=True).data
        return Response(data)


# ── Doctor–Patient Relationship ────────────────────────────────────────────────

class PatientListView(APIView):
    """Doctor sees ALL users (to add as patients) and their accepted/pending patients."""

    def get(self, request):
        # Only doctors can use this
        if request.user.role != 'doctor':
            return Response({'error': 'Forbidden'}, status=403)

        relationships = DoctorPatientRelationship.objects.filter(
            doctor=request.user
        ).select_related('patient')

        # list of all non-doctor users for doctor to pick from
        all_users = User.objects.exclude(role__in=['doctor', 'admin']).exclude(
            id__in=[r.patient_id for r in relationships]
        )

        return Response({
            'relationships': DoctorPatientSerializer(relationships, many=True).data,
            'available_users': UserSerializer(all_users, many=True).data,
        })


class AddPatientView(APIView):
    """Doctor sends a patient-acceptance request."""

    def post(self, request):
        if request.user.role != 'doctor':
            return Response({'error': 'Forbidden'}, status=403)
        patient_id = request.data.get('patient_id')
        try:
            patient = User.objects.get(id=patient_id)
            rel, created = DoctorPatientRelationship.objects.get_or_create(
                doctor=request.user, patient=patient,
                defaults={'status': 'accepted'}
            )
            if not created:
                rel.status = 'accepted'
                rel.save()
            # Promote patient's role
            if patient.role in ('user',):
                patient.role = 'patient'
                patient.save(update_fields=['role'])
            return Response(DoctorPatientSerializer(rel).data, status=201)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)


class UpdatePatientStatusView(APIView):
    """Doctor accepts or rejects a patient request."""

    def patch(self, request, pk):
        if request.user.role != 'doctor':
            return Response({'error': 'Forbidden'}, status=403)
        try:
            rel = DoctorPatientRelationship.objects.get(pk=pk, doctor=request.user)
            new_status = request.data.get('status')
            if new_status not in ('accepted', 'rejected'):
                return Response({'error': 'Invalid status'}, status=400)
            rel.status = new_status
            rel.save()
            if new_status == 'accepted' and rel.patient.role == 'user':
                rel.patient.role = 'patient'
                rel.patient.save(update_fields=['role'])
            return Response(DoctorPatientSerializer(rel).data)
        except DoctorPatientRelationship.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


# ── Chat ────────────────────────────────────────────────────────────────────────

class ChatMessageListView(APIView):
    """Get messages between current user and another user."""

    def get(self, request):
        other_id = request.query_params.get('with')
        if not other_id:
            return Response({'error': 'Provide ?with=<user_id>'}, status=400)
        messages = ChatMessage.objects.filter(
            (Q(sender=request.user) & Q(receiver_id=other_id)) |
            (Q(receiver=request.user) & Q(sender_id=other_id))
        ).order_by('timestamp')
        # Mark as read
        messages.filter(receiver=request.user, is_read=False).update(is_read=True)
        return Response(ChatMessageSerializer(messages, many=True).data)

    def post(self, request):
        receiver_id = request.data.get('receiver_id')
        message_text = request.data.get('message', '').strip()
        if not receiver_id or not message_text:
            return Response({'error': 'receiver_id and message are required'}, status=400)
        try:
            receiver = User.objects.get(id=receiver_id)
            msg = ChatMessage.objects.create(
                sender=request.user,
                receiver=receiver,
                message=message_text,
            )
            return Response(ChatMessageSerializer(msg).data, status=201)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)


class UnreadMessageCountView(APIView):
    def get(self, request):
        count = ChatMessage.objects.filter(receiver=request.user, is_read=False).count()
        return Response({'unread': count})


# ── Medical Alerts ──────────────────────────────────────────────────────────────

class MedicalAlertView(generics.ListCreateAPIView):
    serializer_class = MedicalAlertSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ('doctor', 'admin'):
            patient_id = self.request.query_params.get('patient_id')
            if patient_id:
                return MedicalAlert.objects.filter(patient_id=patient_id)
            return MedicalAlert.objects.filter(doctor=user)
        return MedicalAlert.objects.filter(patient=user)

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)


class TriggeredAlertsView(APIView):
    """Return all triggered (unresolved) alerts for a doctor's patients."""

    def get(self, request):
        if request.user.role in ('doctor', 'admin'):
            patient_ids = DoctorPatientRelationship.objects.filter(
                doctor=request.user, status='accepted'
            ).values_list('patient_id', flat=True)
            alerts = MedicalAlert.objects.filter(
                patient_id__in=patient_ids, triggered=True
            ).select_related('patient')
        else:
            alerts = MedicalAlert.objects.filter(patient=request.user, triggered=True)
        return Response(MedicalAlertSerializer(alerts, many=True).data)


# ── Medication Log ──────────────────────────────────────────────────────────────

class MedicationLogView(generics.ListCreateAPIView):
    serializer_class = MedicationLogSerializer

    def get_queryset(self):
        today = datetime.date.today()
        return MedicationLog.objects.filter(user=self.request.user, date=today)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MarkMedicationTakenView(APIView):
    def post(self, request, pk):
        try:
            log = MedicationLog.objects.get(pk=pk, user=request.user)
            log.taken = True
            log.taken_at = timezone.now()
            log.points_awarded = 5
            log.save()
            # Award points
            request.user.total_points += 5
            request.user.save(update_fields=['total_points'])
            return Response(MedicationLogSerializer(log).data)
        except MedicationLog.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


# ── AI Clinical Trend Summary (via frontend Groq) ──────────────────────────────

class PatientTrendDataView(APIView):
    """Provides raw patient data for AI trend summary generation in doctor portal."""

    def get(self, request):
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response({'error': 'patient_id required'}, status=400)
        if request.user.role not in ('doctor', 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        try:
            patient = User.objects.get(id=patient_id)
            record, _ = MedicalRecord.objects.get_or_create(user=patient)
            alerts = MedicalAlert.objects.filter(patient=patient, triggered=True)
            return Response({
                'patient': UserSerializer(patient).data,
                'medical_record': MedicalRecordSerializer(record).data,
                'triggered_alerts': MedicalAlertSerializer(alerts, many=True).data,
            })
        except User.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=404)
