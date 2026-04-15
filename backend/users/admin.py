from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, MedicalRecord, UserPreferences, Badge, UserBadge

admin.site.register(User, UserAdmin)
admin.site.register(MedicalRecord)
admin.site.register(UserPreferences)
admin.site.register(Badge)
admin.site.register(UserBadge)
