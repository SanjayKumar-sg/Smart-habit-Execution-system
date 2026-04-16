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
        # Accepted friends
        friendships = Friendship.objects.filter(
            status='accepted'
        ).filter(requester=request.user) | Friendship.objects.filter(
            status='accepted', receiver=request.user
        )
        friends = []
        for f in friendships:
            friend = f.receiver if f.requester == request.user else f.requester
            d = UserMiniSerializer(friend).data
            d['friendship_id'] = f.id
            friends.append(d)

        # Pending received
        pending_received = Friendship.objects.filter(receiver=request.user, status='pending')
        pending_sent = Friendship.objects.filter(requester=request.user, status='pending')

        return Response({
            'friends': friends,
            'pending_received': FriendshipSerializer(pending_received, many=True).data,
            'pending_sent': FriendshipSerializer(pending_sent, many=True).data,
        })


class SendFriendRequestView(APIView):
    def post(self, request):
        receiver_id = request.data.get('user_id')
        try:
            receiver = User.objects.get(id=receiver_id)
            if receiver == request.user:
                return Response({'error': "Can't add yourself"}, status=400)
            fr, created = Friendship.objects.get_or_create(
                requester=request.user, receiver=receiver,
                defaults={'status': 'pending'}
            )
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


class SearchUsersView(APIView):
    """Search users by username or name for friend requests."""
    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
            return Response([])
        users = User.objects.filter(
            username__icontains=q
        ).exclude(id=request.user.id)[:10]
        return Response(UserMiniSerializer(users, many=True).data)


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
            cp, created = ChallengeParticipant.objects.get_or_create(
                challenge=challenge, user=request.user
            )
            return Response({'joined': True, 'challenge': challenge.title})
        except Challenge.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
