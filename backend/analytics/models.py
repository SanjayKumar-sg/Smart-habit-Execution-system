from django.db import models
from users.models import User

class WeeklyAnalytics(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='weekly_analytics')
    week_start = models.DateField()
    total_habits = models.IntegerField(default=0)
    completed_habits = models.IntegerField(default=0)
    completion_rate = models.FloatField(default=0)
    avg_energy = models.FloatField(default=0)
    points_earned = models.IntegerField(default=0)
    best_day = models.CharField(max_length=20, blank=True)
    health_score = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('user', 'week_start')

class HealthReport(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='health_reports')
    title = models.CharField(max_length=200)
    period_start = models.DateField()
    period_end = models.DateField()
    summary = models.TextField()
    completion_rate = models.FloatField(default=0)
    total_points = models.IntegerField(default=0)
    recommendations = models.TextField(blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
