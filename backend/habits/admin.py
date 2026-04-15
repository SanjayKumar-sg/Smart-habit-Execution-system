from django.contrib import admin
from .models import Goal, Habit, MicroTask, HabitLog, Nudge

admin.site.register(Goal)
admin.site.register(Habit)
admin.site.register(MicroTask)
admin.site.register(HabitLog)
admin.site.register(Nudge)
