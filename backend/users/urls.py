from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Profile & Prefs
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('preferences/', views.UserPreferencesView.as_view(), name='preferences'),

    # Medical Record
    path('medical-record/', views.MedicalRecordView.as_view(), name='medical_record'),
    path('admin/medical-record/', views.AdminMedicalRecordView.as_view(), name='admin_medical_record'),

    # Badges & Leaderboard
    path('badges/', views.BadgesView.as_view(), name='badges'),
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),

    # Doctor–Patient
    path('doctor/patients/', views.PatientListView.as_view(), name='doctor_patients'),
    path('doctors/', views.DoctorListView.as_view(), name='doctor_list'),
    path('doctor-request/', views.RequestDoctorView.as_view(), name='request_doctor'),
    path('doctor/patients/<int:pk>/status/', views.UpdatePatientStatusView.as_view(), name='patient_status'),
    path('doctor/patient-trend/', views.PatientTrendDataView.as_view(), name='patient_trend'),

    # Chat
    path('chat/', views.ChatMessageListView.as_view(), name='chat'),
    path('chat/unread/', views.UnreadMessageCountView.as_view(), name='chat_unread'),

    # Medical Alerts
    path('alerts/', views.MedicalAlertView.as_view(), name='medical_alerts'),
    path('alerts/triggered/', views.TriggeredAlertsView.as_view(), name='triggered_alerts'),

    # Medication Log
    path('medication/', views.MedicationLogView.as_view(), name='medication_log'),
    path('medication/<int:pk>/take/', views.MarkMedicationTakenView.as_view(), name='medication_take'),
]
