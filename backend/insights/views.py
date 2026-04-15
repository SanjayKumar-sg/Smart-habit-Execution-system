from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Avg, Count
import datetime
import random
from .models import Insight, AICoachMessage, MoodEntry
from .serializers import InsightSerializer, AICoachMessageSerializer, MoodEntrySerializer
from habits.models import HabitLog, Habit

AI_RESPONSES = {
    'motivation': [
        "🌟 You're doing amazing! Remember, every small step counts toward your bigger goal. Keep pushing!",
        "💪 Progress isn't always linear, but consistency is your superpower. You've got this!",
        "🔥 Think about why you started. Your health journey is worth every effort!",
    ],
    'suggestion': [
        "🧘 Try the 2-minute rule: if a task takes less than 2 minutes, do it now. It builds momentum!",
        "⚡ Based on your patterns, you're most productive in the morning. Schedule your hardest habits then.",
        "💧 Hydration directly impacts your energy. Try drinking a glass of water before each habit session.",
        "🌙 Consistent sleep times can boost your habit completion rate by up to 40%.",
    ],
    'medical': [
        "Based on your medical record, I recommend starting with low-intensity exercises and gradually increasing.",
        "Given your fitness level, try adding 5 minutes to your workout each week for safe progression.",
        "Your resting heart rate suggests you'd benefit from more recovery days between intense sessions.",
    ],
    'default': [
        "Hello! I'm your AI Habit Coach 🤖. How can I help you today? I can offer motivation, habit suggestions, or analyze your patterns!",
        "Great question! Let's work together to build habits that stick. What area would you like to focus on?",
        "I'm here to support your health journey. Tell me more about your goals and I'll give personalized advice!",
    ]
}

def generate_ai_response(user_message, user):
    msg = user_message.lower()
    if any(w in msg for w in ['motivat', 'encourage', 'inspire', 'help me']):
        return random.choice(AI_RESPONSES['motivation'])
    elif any(w in msg for w in ['suggest', 'tip', 'advice', 'how to', 'improve']):
        return random.choice(AI_RESPONSES['suggestion'])
    elif any(w in msg for w in ['medical', 'health', 'doctor', 'condition', 'record']):
        return random.choice(AI_RESPONSES['medical'])
    else:
        return random.choice(AI_RESPONSES['default'])

def generate_insights_for_user(user):
    today = datetime.date.today()
    week_ago = today - datetime.timedelta(days=7)
    logs = HabitLog.objects.filter(user=user, date__gte=week_ago)
    total = logs.count()
    completed = logs.filter(completed=True).count()
    rate = completed / total if total > 0 else 0
    insights = []
    if rate >= 0.8:
        insights.append(Insight(user=user, category='consistency', title='Outstanding Consistency! 🎯',
            body='You completed over 80% of your habits this week. Keep it up!', icon='🏆', is_positive=True))
    elif rate < 0.4:
        insights.append(Insight(user=user, category='consistency', title='Let\'s pick up the pace 💪',
            body='Your completion rate dipped this week. Try reducing task difficulty temporarily.', icon='📉', is_positive=False))
    avg_energy = logs.aggregate(avg=Avg('energy_level'))['avg']
    if avg_energy and avg_energy < 5:
        insights.append(Insight(user=user, category='energy', title='Energy levels are low ⚡',
            body='Your average energy score is below average. Prioritize sleep and hydration.', icon='⚡', is_positive=False))
    # Check medical record for recommendations
    try:
        medical = user.medical_record
        if medical.fitness_level == 'beginner' and rate > 0.7:
            insights.append(Insight(user=user, category='medical', title='Ready to level up! 🏃',
                body='Based on your medical profile and high completion rate, consider increasing exercise intensity.', icon='❤️', is_positive=True))
    except:
        pass
    Insight.objects.filter(user=user, generated_at__date=today).delete()
    Insight.objects.bulk_create(insights)
    return insights

class InsightListView(generics.ListAPIView):
    serializer_class = InsightSerializer
    def get_queryset(self):
        generate_insights_for_user(self.request.user)
        return Insight.objects.filter(user=self.request.user).order_by('-generated_at')[:10]

class AICoachView(APIView):
    def get(self, request):
        messages = AICoachMessage.objects.filter(user=request.user).order_by('-timestamp')[:20]
        return Response(AICoachMessageSerializer(messages, many=True).data)

    def post(self, request):
        content = request.data.get('message', '').strip()
        if not content:
            return Response({'error': 'Message is required'}, status=400)
        user_msg = AICoachMessage.objects.create(user=request.user, role='user', content=content)
        ai_reply = generate_ai_response(content, request.user)
        ai_msg = AICoachMessage.objects.create(user=request.user, role='assistant', content=ai_reply)
        return Response({
            'user_message': AICoachMessageSerializer(user_msg).data,
            'ai_response': AICoachMessageSerializer(ai_msg).data,
        })

class MoodEntryView(generics.ListCreateAPIView):
    serializer_class = MoodEntrySerializer
    def get_queryset(self):
        return MoodEntry.objects.filter(user=self.request.user).order_by('-date')[:30]
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
