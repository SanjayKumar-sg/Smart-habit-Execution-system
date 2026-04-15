from django.urls import path
from . import views
urlpatterns = [
    path('leaderboard/', views.LeaderboardView.as_view(), name='social-leaderboard'),
    path('friends/', views.FriendListView.as_view(), name='friends'),
    path('friends/request/', views.SendFriendRequestView.as_view(), name='friend-request'),
    path('friends/<int:pk>/respond/', views.RespondFriendRequestView.as_view(), name='friend-respond'),
    path('challenges/', views.ChallengeListCreateView.as_view(), name='challenges'),
    path('challenges/<int:pk>/join/', views.JoinChallengeView.as_view(), name='join-challenge'),
]
