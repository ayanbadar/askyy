from django.contrib import admin

from auth.models import SignupVerification


@admin.register(SignupVerification)
class SignupVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'expires_at', 'attempts', 'created_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('otp_code', 'expires_at', 'attempts', 'created_at')
