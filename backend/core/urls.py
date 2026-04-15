from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/habits/', include('habits.urls')),
    path('api/insights/', include('insights.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/social/', include('social.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
