from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Avg, Count
import datetime
import random
from .models import Goal, Habit, MicroTask, HabitLog, Nudge
from .serializers import GoalSerializer, HabitSerializer, MicroTaskSerializer, HabitLogSerializer, NudgeSerializer
from users.models import User

MICRO_TASK_TEMPLATES = {
    'fitness': ['5-min warm-up stretch', 'Push-ups set', 'Walk briskly', 'Cool-down stretch', 'Core exercises'],
    'hydration': ['Drink 1 glass of water', 'Refill your bottle', 'Herbal tea break', 'Hydration check-in'],
    'sleep': ['Set phone to Do Not Disturb', 'Dim lights 30min before bed', 'Quick body scan meditation', 'Journal 3 gratitude points'],
    'nutrition': ['Prep healthy snack', 'Log your meal', 'Eat mindfully', 'Drink water before eating'],
    'mindfulness': ['3-min breathing exercise', 'Gratitude note', 'Body scan', 'Mindful walk'],
    'custom': ['Start with a small step', 'Review your goal', 'Take action', 'Reflect on progress'],
}

NUDGE_MESSAGES = [
    "🌟 You usually complete tasks around this time! Let's keep the momentum.",
    "💪 Start with just one small step — that's all it takes!",
    "🔥 Your streak is on the line. Don't break the chain!",
    "⚡ Energy boost time! A quick habit can set the tone for the day.",
    "🎯 Consistency beats perfection. Just show up today!",
    "🧠 Your future self will thank you for completing this now.",
    "✨ Small actions lead to big results. Time to crush it!",
]

def generate_micro_tasks(habit):
    category = habit.goal.category if habit.goal else 'custom'
    templates = MICRO_TASK_TEMPLATES.get(category, MICRO_TASK_TEMPLATES['custom'])
    today = datetime.date.today()
    difficulty = habit.difficulty
    count = 3 if difficulty == 'easy' else 5 if difficulty == 'medium' else 7
    selected = random.sample(templates * 3, min(count, len(templates * 3)))
    for i, title in enumerate(selected[:count]):
        MicroTask.objects.get_or_create(
            habit=habit,
            title=title,
            scheduled_date=today,
            defaults={'order': i, 'duration_minutes': 5, 'points': 5}
        )

def adjust_difficulty(habit):
    """Adaptive difficulty: increase if consistent, reduce if skipping."""
    recent_logs = HabitLog.objects.filter(habit=habit).order_by('-date')[:7]
    if recent_logs.count() < 3:
        return
    completed = recent_logs.filter(completed=True).count()
    rate = completed / recent_logs.count()
    diff_map = ['easy', 'medium', 'hard']
    current_idx = diff_map.index(habit.difficulty)
    if rate >= 0.85 and current_idx < 2:
        habit.difficulty = diff_map[current_idx + 1]
    elif rate <= 0.3 and current_idx > 0:
        habit.difficulty = diff_map[current_idx - 1]
    habit.save(update_fields=['difficulty'])

def update_streak(habit, user):
    today = datetime.date.today()
    yesterday = today - datetime.timedelta(days=1)
    yesterday_log = HabitLog.objects.filter(habit=habit, date=yesterday, completed=True).first()
    if yesterday_log:
        habit.streak_count += 1
    else:
        habit.streak_count = 1
    if habit.streak_count > habit.best_streak:
        habit.best_streak = habit.streak_count
    habit.save(update_fields=['streak_count', 'best_streak'])
    if habit.streak_count > user.streak_count:
        user.streak_count = habit.streak_count
        user.save(update_fields=['streak_count'])

# --- Goal Views ---
class GoalListCreateView(generics.ListCreateAPIView):
    serializer_class = GoalSerializer
    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user).prefetch_related('habits')
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class GoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GoalSerializer
    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user)

# --- Habit Views ---
class HabitListCreateView(generics.ListCreateAPIView):
    serializer_class = HabitSerializer
    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user, is_active=True).prefetch_related('micro_tasks', 'logs')
    def perform_create(self, serializer):
        habit = serializer.save(user=self.request.user)
        generate_micro_tasks(habit)

class HabitDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HabitSerializer
    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user)

class TodayHabitsView(APIView):
    def get(self, request):
        today = datetime.date.today()
        habits = Habit.objects.filter(user=request.user, is_active=True).prefetch_related('logs', 'micro_tasks')
        # Ensure micro tasks exist for today
        for habit in habits:
            generate_micro_tasks(habit)
        serializer = HabitSerializer(habits, many=True)
        total = habits.count()
        done = HabitLog.objects.filter(user=request.user, date=today, completed=True).count()
        progress = round((done / total * 100) if total > 0 else 0, 1)
        return Response({
            'habits': serializer.data,
            'summary': {
                'total': total,
                'completed': done,
                'progress_percent': progress,
                'date': today.isoformat(),
            }
        })

# --- MicroTask Views ---
class MicroTaskListView(generics.ListAPIView):
    serializer_class = MicroTaskSerializer
    def get_queryset(self):
        today = datetime.date.today()
        return MicroTask.objects.filter(habit__user=self.request.user, scheduled_date=today)

class MicroTaskUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = MicroTaskSerializer
    def get_queryset(self):
        return MicroTask.objects.filter(habit__user=self.request.user)
    def perform_update(self, serializer):
        task = serializer.save()
        if task.status == 'completed' and not task.completed_at:
            from django.utils import timezone as tz
            task.completed_at = tz.now()
            task.save(update_fields=['completed_at'])

# --- Habit Log Views ---
class HabitLogCreateView(generics.CreateAPIView):
    serializer_class = HabitLogSerializer
    def perform_create(self, serializer):
        habit_id = self.request.data.get('habit')
        habit = Habit.objects.get(id=habit_id, user=self.request.user)
        completed = self.request.data.get('completed', False)
        points = habit.points_per_completion if completed else 0
        log = serializer.save(user=self.request.user, points_earned=points)
        if completed:
            update_streak(habit, self.request.user)
            self.request.user.total_points += points
            self.request.user.save(update_fields=['total_points'])
            adjust_difficulty(habit)
            # Generate smart nudge
            Nudge.objects.create(
                user=self.request.user,
                habit=habit,
                message=random.choice(NUDGE_MESSAGES),
                nudge_type='achievement'
            )
        return log

class HabitLogListView(generics.ListAPIView):
    serializer_class = HabitLogSerializer
    def get_queryset(self):
        habit_id = self.kwargs.get('habit_id')
        qs = HabitLog.objects.filter(user=self.request.user)
        if habit_id:
            qs = qs.filter(habit_id=habit_id)
        return qs.order_by('-date')[:30]

# --- Nudges ---
class NudgeListView(generics.ListAPIView):
    serializer_class = NudgeSerializer
    def get_queryset(self):
        return Nudge.objects.filter(user=self.request.user, is_read=False).order_by('-created_at')[:10]

class NudgeMarkReadView(APIView):
    def post(self, request, pk):
        Nudge.objects.filter(pk=pk, user=request.user).update(is_read=True)
        return Response({'status': 'ok'})

# --- Dashboard Summary ---
class DashboardView(APIView):
    def get(self, request):
        user = request.user
        today = datetime.date.today()
        habits = Habit.objects.filter(user=user, is_active=True)
        total_habits = habits.count()
        completed_today = HabitLog.objects.filter(user=user, date=today, completed=True).count()
        progress = round((completed_today / total_habits * 100) if total_habits else 0, 1)
        avg_energy = HabitLog.objects.filter(user=user, date=today).aggregate(avg=Avg('energy_level'))['avg'] or 5
        nudges = Nudge.objects.filter(user=user, is_read=False).count()
        return Response({
            'user': {'name': user.get_full_name() or user.username, 'level': user.level, 'points': user.total_points},
            'today': {'progress_percent': progress, 'completed': completed_today, 'total': total_habits},
            'streak': user.streak_count,
            'energy_score': round(avg_energy * 10, 1),
            'unread_nudges': nudges,
            'date': today.isoformat(),
        })
