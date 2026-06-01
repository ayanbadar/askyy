import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class SignupVerification(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='signup_verification',
    )
    otp_code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'signup verification'
        verbose_name_plural = 'signup verifications'

    def __str__(self) -> str:
        return f'Signup verification for {self.user}'

    @classmethod
    def create_for_user(cls, user):
        cls.objects.filter(user=user).delete()
        otp = f'{secrets.randbelow(1_000_000):06d}'
        lifetime = timedelta(minutes=settings.SIGNUP_OTP_LIFETIME_MINUTES)
        return cls.objects.create(
            user=user,
            otp_code=otp,
            expires_at=timezone.now() + lifetime,
        )

    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def verify(self, code: str) -> bool:
        if self.is_expired():
            return False

        max_attempts = settings.SIGNUP_OTP_MAX_ATTEMPTS
        if self.attempts >= max_attempts:
            return False

        if self.otp_code != code.strip():
            self.attempts += 1
            self.save(update_fields=['attempts'])
            return False

        return True

    def refresh_otp(self):
        self.otp_code = f'{secrets.randbelow(1_000_000):06d}'
        lifetime = timedelta(minutes=settings.SIGNUP_OTP_LIFETIME_MINUTES)
        self.expires_at = timezone.now() + lifetime
        self.attempts = 0
        self.save(update_fields=['otp_code', 'expires_at', 'attempts'])
        return self.otp_code
