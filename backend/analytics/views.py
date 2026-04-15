from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Avg, Count, Sum
import datetime
from habits.models import HabitLog, Habit
from .models import WeeklyAnalytics, HealthReport
from .serializers import WeeklyAnalyticsSerializer, HealthReportSerializer

class WeeklyStatsView(APIView):
    def get(self, request):
        today = datetime.date.today()
        days = []
        for i in range(6, -1, -1):
            day = today - datetime.timedelta(days=i)
            logs = HabitLog.objects.filter(user=request.user, date=day)
            total = logs.count()
            done = logs.filter(completed=True).count()
            days.append({
                'date': day.isoformat(),
                'day': day.strftime('%a'),
                'completed': done,
                'total': total,
                'rate': round((done / total * 100) if total else 0, 1),
            })
        return Response({'weekly': days})

class MonthlyStatsView(APIView):
    def get(self, request):
        today = datetime.date.today()
        start = today.replace(day=1)
        logs = HabitLog.objects.filter(user=request.user, date__gte=start)
        stats = {
            'total_logs': logs.count(),
            'completed': logs.filter(completed=True).count(),
            'avg_energy': round(logs.aggregate(avg=Avg('energy_level'))['avg'] or 0, 1),
            'points_earned': logs.aggregate(total=Sum('points_earned'))['total'] or 0,
        }
        stats['completion_rate'] = round(
            stats['completed'] / stats['total_logs'] * 100 if stats['total_logs'] else 0, 1)
        stats['health_score'] = round(stats['completion_rate'] * 0.6 + stats['avg_energy'] * 4, 1)
        return Response(stats)

class HabitConsistencyView(APIView):
    def get(self, request):
        habits = Habit.objects.filter(user=request.user, is_active=True)
        result = []
        for habit in habits:
            logs_30 = HabitLog.objects.filter(habit=habit, date__gte=datetime.date.today()-datetime.timedelta(days=30))
            done = logs_30.filter(completed=True).count()
            total = logs_30.count()
            result.append({
                'habit': habit.title, 'icon': habit.icon, 'color': habit.color,
                'streak': habit.streak_count, 'best_streak': habit.best_streak,
                'completion_rate': round((done/total*100) if total else 0, 1),
                'difficulty': habit.difficulty,
            })
        return Response(result)

class HealthReportListView(APIView):
    def get(self, request):
        reports = HealthReport.objects.filter(user=request.user).order_by('-generated_at')
        return Response(HealthReportSerializer(reports, many=True).data)

    def post(self, request):
        today = datetime.date.today()
        start = today - datetime.timedelta(days=30)
        logs = HabitLog.objects.filter(user=request.user, date__gte=start)
        total = logs.count()
        done = logs.filter(completed=True).count()
        energy = logs.aggregate(avg=Avg('energy_level'))['avg'] or 5
        rate = round((done/total*100) if total else 0, 1)
        report = HealthReport.objects.create(
            user=request.user,
            title=f'Monthly Health Report - {today.strftime("%B %Y")}',
            period_start=start, period_end=today,
            summary=f'You completed {done} out of {total} habit sessions ({rate}%) with an average energy score of {round(energy,1)}/10.',
            completion_rate=rate,
            total_points=logs.aggregate(p=Sum('points_earned'))['p'] or 0,
            recommendations='Keep up morning habits. Consider adding hydration reminders. Sleep consistency can be improved.'
        )
        return Response(HealthReportSerializer(report).data, status=201)
