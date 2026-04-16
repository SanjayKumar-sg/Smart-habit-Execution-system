from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('medical-record/', views.MedicalRecordView.as_view(), name='medical_record'),
    path('admin/medical-record/', views.AdminMedicalRecordView.as_view(), name='admin_medical_record'),
    path('preferences/', views.UserPreferencesView.as_view(), name='preferences'),
    path('badges/', views.BadgesView.as_view(), name='badges'),
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),
]
