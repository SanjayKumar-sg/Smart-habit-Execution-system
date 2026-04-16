from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    LANGUAGE_CHOICES = [
        ('en', 'English'), ('es', 'Spanish'), ('fr', 'French'),
        ('de', 'German'), ('hi', 'Hindi'), ('zh', 'Chinese'),
        ('ar', 'Arabic'), ('pt', 'Portuguese'),
    ]
    ROLE_CHOICES = [('patient','Patient'),('doctor','Doctor'),('admin','Admin')]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='patient')
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    height_cm = models.FloatField(blank=True, null=True)
    weight_kg = models.FloatField(blank=True, null=True)
    preferred_language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='en')
    dark_mode = models.BooleanField(default=False)
    notification_enabled = models.BooleanField(default=True)
    voice_assistant_enabled = models.BooleanField(default=True)
    timezone = models.CharField(max_length=50, default='UTC')
    total_points = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    streak_count = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_active = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'

class MedicalRecord(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='medical_record')
    conditions = models.TextField(blank=True, help_text='CSV of conditions e.g. diabetes,hypertension')
    medications = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    resting_heart_rate = models.IntegerField(blank=True, null=True)
    blood_pressure_systolic = models.IntegerField(blank=True, null=True)
    blood_pressure_diastolic = models.IntegerField(blank=True, null=True)
    blood_glucose = models.FloatField(blank=True, null=True)
    fitness_level = models.CharField(max_length=20, choices=[
        ('beginner','Beginner'),('intermediate','Intermediate'),('advanced','Advanced')
    ], default='beginner')
    doctor_notes = models.TextField(blank=True)
    proposed_ai_plan = models.TextField(blank=True, null=True, help_text="AI generated plan awaiting approval")
    confirmed_ai_plan = models.TextField(blank=True, null=True, help_text="Doctor approved AI plan")
    last_updated = models.DateTimeField(auto_now=True)

    def get_conditions_list(self):
        return [c.strip() for c in self.conditions.split(',') if c.strip()]

class UserPreferences(models.Model):
    THEME_CHOICES = [('light','Light'),('dark','Dark'),('system','System')]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='system')
    language = models.CharField(max_length=10, default='en')
    notifications_habit_reminders = models.BooleanField(default=True)
    notifications_nudges = models.BooleanField(default=True)
    notifications_achievements = models.BooleanField(default=True)
    notifications_social = models.BooleanField(default=True)
    quiet_hours_start = models.TimeField(blank=True, null=True)
    quiet_hours_end = models.TimeField(blank=True, null=True)
    preferred_workout_time = models.TimeField(blank=True, null=True)
    weekly_goal_hours = models.IntegerField(default=7)
    updated_at = models.DateTimeField(auto_now=True)

class Badge(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50)
    points_required = models.IntegerField(default=0)
    rarity = models.CharField(max_length=20, choices=[
        ('common','Common'),('rare','Rare'),('epic','Epic'),('legendary','Legendary')
    ], default='common')

class UserBadge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('user', 'badge')
