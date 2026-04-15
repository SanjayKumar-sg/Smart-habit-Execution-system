from django.urls import path
from . import views
urlpatterns = [
    path('weekly/', views.WeeklyStatsView.as_view(), name='weekly-stats'),
    path('monthly/', views.MonthlyStatsView.as_view(), name='monthly-stats'),
    path('consistency/', views.HabitConsistencyView.as_view(), name='consistency'),
    path('reports/', views.HealthReportListView.as_view(), name='health-reports'),
]
