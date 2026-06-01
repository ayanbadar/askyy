from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui',
    ),
    path(
        'api/docs/redoc/',
        SpectacularRedocView.as_view(url_name='schema'),
        name='redoc',
    ),
    path('api/auth/', include('auth.urls')),
    path('api/sources/', include('sources.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/settings/', include('settings_app.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/', include('core.urls')),
]
