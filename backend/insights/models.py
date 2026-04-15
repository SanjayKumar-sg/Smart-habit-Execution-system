from django.db import models
from users.models import User
from habits.models import Habit

class InsightCategory(models.TextChoices):
    PATTERN = 'pattern', 'Pattern'
    ENERGY = 'energy', 'Energy'
    MOOD = 'mood', 'Mood'
    CONSISTENCY = 'consistency', 'Consistency'
    RECOMMENDATION = 'recommendation', 'Recommendation'
    MEDICAL = 'medical', 'Medical'

class Insight(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='insights')
    category = models.CharField(max_length=20, choices=InsightCategory.choices)
    title = models.CharField(max_length=200)
    body = models.TextField()
    icon = models.CharField(max_length=10, default='💡')
    is_positive = models.BooleanField(default=True)
    is_read = models.BooleanField(default=False)
    generated_at = models.DateTimeField(auto_now_add=True)

class AICoachMessage(models.Model):
    ROLE_CHOICES = [('user','User'),('assistant','Assistant')]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coach_messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

class MoodEntry(models.Model):
    MOOD_CHOICES = [
        ('great','😊 Great'),('good','🙂 Good'),
        ('neutral','😐 Neutral'),('bad','😕 Bad'),('terrible','😞 Terrible'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mood_entries')
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES)
    energy_level = models.IntegerField(default=5)
    note = models.TextField(blank=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('user', 'date')
