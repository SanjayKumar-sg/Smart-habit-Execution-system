from django.db import models
from users.models import User

class Goal(models.Model):
    CATEGORY_CHOICES = [
        ('fitness','Fitness'),('hydration','Hydration'),('sleep','Sleep'),
        ('nutrition','Nutrition'),('mindfulness','Mindfulness'),('custom','Custom'),
    ]
    STATUS_CHOICES = [('active','Active'),('paused','Paused'),('completed','Completed')]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    target_value = models.FloatField(blank=True, null=True)
    target_unit = models.CharField(max_length=50, blank=True)
    deadline = models.DateField(blank=True, null=True)
    color = models.CharField(max_length=7, default='#6C63FF')
    icon = models.CharField(max_length=50, default='🎯')
    progress_percent = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Habit(models.Model):
    FREQUENCY_CHOICES = [('daily','Daily'),('weekly','Weekly'),('custom','Custom')]
    DIFFICULTY_CHOICES = [('easy','Easy'),('medium','Medium'),('hard','Hard')]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='habits')
    goal = models.ForeignKey(Goal, on_delete=models.SET_NULL, null=True, blank=True, related_name='habits')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    scheduled_time = models.TimeField(blank=True, null=True)
    duration_minutes = models.IntegerField(default=15)
    streak_count = models.IntegerField(default=0)
    best_streak = models.IntegerField(default=0)
    completion_rate = models.FloatField(default=0)
    points_per_completion = models.IntegerField(default=10)
    is_active = models.BooleanField(default=True)
    color = models.CharField(max_length=7, default='#6C63FF')
    icon = models.CharField(max_length=50, default='✅')
    # Habit stacking: link habits
    stacked_after = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='stacked_habits')
    created_at = models.DateTimeField(auto_now_add=True)

class MicroTask(models.Model):
    STATUS_CHOICES = [('pending','Pending'),('in_progress','In Progress'),('completed','Completed'),('skipped','Skipped')]

    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='micro_tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    duration_minutes = models.IntegerField(default=5)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    scheduled_date = models.DateField()
    completed_at = models.DateTimeField(blank=True, null=True)
    points = models.IntegerField(default=5)

class HabitLog(models.Model):
    MOOD_CHOICES = [
        ('great','😊 Great'),('good','🙂 Good'),('neutral','😐 Neutral'),
        ('bad','😕 Bad'),('terrible','😞 Terrible'),
    ]
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='logs')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='habit_logs')
    date = models.DateField()
    completed = models.BooleanField(default=False)
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES, blank=True)
    energy_level = models.IntegerField(default=5)  # 1-10
    notes = models.TextField(blank=True)
    duration_actual = models.IntegerField(blank=True, null=True)
    points_earned = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('habit', 'date')

class Nudge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='nudges')
    habit = models.ForeignKey(Habit, on_delete=models.SET_NULL, null=True, blank=True)
    message = models.TextField()
    nudge_type = models.CharField(max_length=30, choices=[
        ('motivational','Motivational'),('reminder','Reminder'),
        ('smart','Smart'),('achievement','Achievement'),
    ], default='smart')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
