from django.contrib import admin
from .models import Insight, AICoachMessage, MoodEntry

admin.site.register(Insight)
admin.site.register(AICoachMessage)
admin.site.register(MoodEntry)
