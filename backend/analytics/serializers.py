from rest_framework import serializers
from .models import WeeklyAnalytics, HealthReport

class WeeklyAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyAnalytics
        fields = '__all__'

class HealthReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthReport
        fields = '__all__'
