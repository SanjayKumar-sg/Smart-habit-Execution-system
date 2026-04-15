from django.urls import path
from . import views
urlpatterns = [
    path('', views.InsightListView.as_view(), name='insights'),
    path('coach/', views.AICoachView.as_view(), name='ai-coach'),
    path('mood/', views.MoodEntryView.as_view(), name='mood'),
]
