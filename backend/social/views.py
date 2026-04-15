from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from users.models import User
from .models import Friendship, Challenge, ChallengeParticipant
from .serializers import FriendshipSerializer, ChallengeSerializer, UserMiniSerializer

class LeaderboardView(APIView):
    def get(self, request):
        users = User.objects.order_by('-total_points')[:20]
        data = []
        for i, u in enumerate(users, 1):
            d = UserMiniSerializer(u).data
            d['rank'] = i
            data.append(d)
        return Response(data)

class FriendListView(APIView):
    def get(self, request):
        friendships = Friendship.objects.filter(
            status='accepted'
        ).filter(requester=request.user) | Friendship.objects.filter(
            status='accepted', receiver=request.user
        )
        friends = []
        for f in friendships:
            friend = f.receiver if f.requester == request.user else f.requester
            friends.append(UserMiniSerializer(friend).data)
        return Response(friends)

class SendFriendRequestView(APIView):
    def post(self, request):
        receiver_id = request.data.get('user_id')
        try:
            receiver = User.objects.get(id=receiver_id)
            fr, created = Friendship.objects.get_or_create(requester=request.user, receiver=receiver)
            return Response(FriendshipSerializer(fr).data, status=201 if created else 200)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

class RespondFriendRequestView(APIView):
    def post(self, request, pk):
        action = request.data.get('action')
        try:
            fr = Friendship.objects.get(pk=pk, receiver=request.user)
            fr.status = 'accepted' if action == 'accept' else 'declined'
            fr.save()
            return Response(FriendshipSerializer(fr).data)
        except Friendship.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

class ChallengeListCreateView(generics.ListCreateAPIView):
    serializer_class = ChallengeSerializer
    def get_queryset(self):
        return Challenge.objects.filter(is_active=True).order_by('-created_at')
    def perform_create(self, serializer):
        challenge = serializer.save(creator=self.request.user)
        ChallengeParticipant.objects.create(challenge=challenge, user=self.request.user)

class JoinChallengeView(APIView):
    def post(self, request, pk):
        try:
            challenge = Challenge.objects.get(pk=pk)
            cp, created = ChallengeParticipant.objects.get_or_create(challenge=challenge, user=request.user)
            return Response({'joined': True, 'challenge': challenge.title})
        except Challenge.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
