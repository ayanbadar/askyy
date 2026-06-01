from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction

from auth.models import SignupVerification
from auth.tasks import send_signup_otp_email


class SignupError(Exception):
    """Raised when signup or verification fails."""


class SignupService:
    def __init__(self) -> None:
        self._user_model = get_user_model()

    @transaction.atomic
    def register(self, *, username: str, email: str, password: str) -> None:
        username = username.strip()
        email = email.strip().lower()

        if self._user_model.objects.filter(username__iexact=username).exists():
            raise SignupError('This username is already taken.')

        existing = self._user_model.objects.filter(email__iexact=email).first()
        if existing is not None and existing.is_active:
            raise SignupError('An account with this email already exists.')

        if existing is not None:
            user = existing
            user.username = username
            user.set_password(password)
            user.is_active = False
            user.save(update_fields=['username', 'password', 'is_active'])
        else:
            user = self._user_model(
                username=username,
                email=email,
                is_active=False,
            )
            user.set_password(password)
            user.save()

        verification = SignupVerification.create_for_user(user)
        self._queue_otp_email(
            email=email,
            username=username,
            otp=verification.otp_code,
        )

    @transaction.atomic
    def verify(self, *, email: str, otp: str):
        email = email.strip().lower()
        user = self._user_model.objects.filter(email__iexact=email).first()
        if user is None or user.is_active:
            raise SignupError('Invalid verification request.')

        try:
            verification = user.signup_verification
        except SignupVerification.DoesNotExist:
            raise SignupError('Invalid verification request.') from None

        if verification.attempts >= settings.SIGNUP_OTP_MAX_ATTEMPTS:
            raise SignupError('Too many failed attempts. Please request a new code.')

        if not verification.verify(otp):
            if verification.is_expired():
                raise SignupError(
                    'Verification code has expired. Please request a new one.'
                )
            raise SignupError('Invalid verification code.')

        user.is_active = True
        user.save(update_fields=['is_active'])
        verification.delete()
        return user

    def resend_otp(self, *, email: str) -> None:
        email = email.strip().lower()
        user = self._user_model.objects.filter(email__iexact=email).first()
        if user is None or user.is_active:
            raise SignupError('No pending signup found for this email.')

        try:
            verification = user.signup_verification
        except SignupVerification.DoesNotExist:
            raise SignupError('No pending signup found for this email.') from None

        otp = verification.refresh_otp()
        self._queue_otp_email(email=email, username=user.username, otp=otp)

    def _queue_otp_email(self, *, email: str, username: str, otp: str) -> None:
        transaction.on_commit(
            lambda: send_signup_otp_email.delay(
                email=email,
                username=username,
                otp=otp,
            ),
        )


signup_service = SignupService()
