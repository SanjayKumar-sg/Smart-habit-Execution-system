from rest_framework import serializers
from .models import Goal, Habit, MicroTask, HabitLog, Nudge
import datetime

class MicroTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = MicroTask
        fields = '__all__'
        read_only_fields = ['habit']

class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = '__all__'
        read_only_fields = ['user', 'points_earned']

class HabitSerializer(serializers.ModelSerializer):
    micro_tasks = MicroTaskSerializer(many=True, read_only=True)
    today_log = serializers.SerializerMethodField()
    stacked_after_title = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = '__all__'
        read_only_fields = ['user', 'streak_count', 'best_streak', 'completion_rate']

    def get_today_log(self, obj):
        today = datetime.date.today()
        try:
            log = obj.logs.get(date=today)
            return HabitLogSerializer(log).data
        except HabitLog.DoesNotExist:
            return None

    def get_stacked_after_title(self, obj):
        if obj.stacked_after:
            return obj.stacked_after.title
        return None

class GoalSerializer(serializers.ModelSerializer):
    habits = HabitSerializer(many=True, read_only=True)

    class Meta:
        model = Goal
        fields = '__all__'
        read_only_fields = ['user', 'progress_percent']

class NudgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nudge
        fields = '__all__'
        read_only_fields = ['user']
