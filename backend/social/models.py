from django.db import models
from users.models import User

class Friendship(models.Model):
    STATUS_CHOICES = [('pending','Pending'),('accepted','Accepted'),('declined','Declined')]
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('requester', 'receiver')

class Challenge(models.Model):
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_challenges')
    title = models.CharField(max_length=200)
    description = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField()
    participants = models.ManyToManyField(User, through='ChallengeParticipant', related_name='challenges')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class ChallengeParticipant(models.Model):
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    progress = models.FloatField(default=0)
    joined_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('challenge', 'user')
