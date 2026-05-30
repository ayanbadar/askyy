from django.urls import path

from auth.views import GoogleAuthView, LoginView, MeView, TokenRefreshAPIView

app_name = 'auth'

urlpatterns = [
    path('google/', GoogleAuthView.as_view(), name='google'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshAPIView.as_view(), name='token-refresh'),
    path('me/', MeView.as_view(), name='me'),
]
