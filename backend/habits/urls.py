from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('goals/', views.GoalListCreateView.as_view(), name='goal-list'),
    path('goals/<int:pk>/', views.GoalDetailView.as_view(), name='goal-detail'),
    path('habits/', views.HabitListCreateView.as_view(), name='habit-list'),
    path('habits/<int:pk>/', views.HabitDetailView.as_view(), name='habit-detail'),
    path('habits/today/', views.TodayHabitsView.as_view(), name='today-habits'),
    path('microtasks/', views.MicroTaskListView.as_view(), name='microtask-list'),
    path('microtasks/<int:pk>/', views.MicroTaskUpdateView.as_view(), name='microtask-detail'),
    path('logs/', views.HabitLogCreateView.as_view(), name='log-create'),
    path('logs/<int:habit_id>/', views.HabitLogListView.as_view(), name='log-list'),
    path('nudges/', views.NudgeListView.as_view(), name='nudge-list'),
    path('nudges/<int:pk>/read/', views.NudgeMarkReadView.as_view(), name='nudge-read'),
]
