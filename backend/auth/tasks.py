import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def _build_signup_otp_email(*, username: str, otp: str) -> tuple[str, str]:
    subject = f'Your {settings.EMAIL_SUBJECT_PREFIX} verification code'
    message = (
        f'Hi {username},\n\n'
        f'Your verification code is: {otp}\n\n'
        f'This code expires in {settings.SIGNUP_OTP_LIFETIME_MINUTES} minutes.\n\n'
        f'If you did not create an account, you can ignore this email.'
    )
    return subject, message


@shared_task(
    name='auth.tasks.send_signup_otp_email',
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={'max_retries': 3},
)
def send_signup_otp_email(
    self,
    *,
    email: str,
    username: str,
    otp: str,
) -> None:
    subject, message = _build_signup_otp_email(username=username, otp=otp)

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception:
        logger.exception('Failed to send signup OTP email to %s', email)
        raise
