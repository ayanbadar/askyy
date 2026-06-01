from django.urls import path

from auth.views import (
    GoogleAuthView,
    LoginView,
    MeView,
    ResendSignupOtpView,
    SignupView,
    TokenRefreshAPIView,
    VerifySignupView,
)

app_name = 'auth'

urlpatterns = [
    path('google/', GoogleAuthView.as_view(), name='google'),
    path('login/', LoginView.as_view(), name='login'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('signup/verify/', VerifySignupView.as_view(), name='signup-verify'),
    path('signup/resend/', ResendSignupOtpView.as_view(), name='signup-resend'),
    path('refresh/', TokenRefreshAPIView.as_view(), name='token-refresh'),
    path('me/', MeView.as_view(), name='me'),
]
