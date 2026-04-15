from rest_framework import serializers
from users.models import User
from .models import Friendship, Challenge, ChallengeParticipant

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','username','first_name','last_name','avatar','total_points','level','streak_count']

class FriendshipSerializer(serializers.ModelSerializer):
    requester = UserMiniSerializer(read_only=True)
    receiver = UserMiniSerializer(read_only=True)
    class Meta:
        model = Friendship
        fields = '__all__'

class ChallengeSerializer(serializers.ModelSerializer):
    creator = UserMiniSerializer(read_only=True)
    participant_count = serializers.SerializerMethodField()
    class Meta:
        model = Challenge
        fields = '__all__'
    def get_participant_count(self, obj):
        return obj.participants.count()
