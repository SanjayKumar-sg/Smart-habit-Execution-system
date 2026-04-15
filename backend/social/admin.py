from django.contrib import admin
from .models import Friendship, Challenge, ChallengeParticipant

admin.site.register(Friendship)
admin.site.register(Challenge)
admin.site.register(ChallengeParticipant)
