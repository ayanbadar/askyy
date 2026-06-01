from django.urls import path

from settings_app.views import (
    AccountSettingsView,
    ChangePasswordView,
    DangerSettingsView,
    DeleteAccountView,
    PlatformSettingsView,
    SecuritySettingsView,
)

app_name = 'settings'

urlpatterns = [
    path('account/', AccountSettingsView.as_view(), name='account'),
    path('security/', SecuritySettingsView.as_view(), name='security'),
    path('security/password/', ChangePasswordView.as_view(), name='security-password'),
    path('platform/', PlatformSettingsView.as_view(), name='platform'),
    path('danger/', DangerSettingsView.as_view(), name='danger'),
    path('danger/account/', DeleteAccountView.as_view(), name='danger-account'),
]
