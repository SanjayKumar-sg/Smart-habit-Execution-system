from django.contrib import admin
from .models import WeeklyAnalytics, HealthReport

admin.site.register(WeeklyAnalytics)
admin.site.register(HealthReport)
