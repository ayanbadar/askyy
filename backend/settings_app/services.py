from django.contrib.auth.models import AbstractBaseUser
from django.utils import timezone
from rest_framework.request import Request


def split_display_name(name: str) -> tuple[str, str]:
    parts = name.strip().split(maxsplit=1)
    if not parts:
        return '', ''
    if len(parts) == 1:
        return parts[0], ''
    return parts[0], parts[1]


def serialize_account_settings(user: AbstractBaseUser) -> dict:
    return {
        'id': str(user.pk),
        'username': user.username,
        'email': user.email,
        'name': user.get_full_name() or user.username,
    }


def update_account_settings(
    user: AbstractBaseUser,
    *,
    name: str | None = None,
    email: str | None = None,
) -> AbstractBaseUser:
    updated_fields: list[str] = []

    if name is not None:
        first_name, last_name = split_display_name(name)
        user.first_name = first_name
        user.last_name = last_name
        updated_fields.extend(['first_name', 'last_name'])

    if email is not None:
        user.email = email
        updated_fields.append('email')

    if updated_fields:
        user.save(update_fields=updated_fields)

    return user


def format_device_label(user_agent: str) -> str:
    if not user_agent:
        return 'Unknown device'

    browser = 'Browser'
    if 'Edg/' in user_agent or 'Edge/' in user_agent:
        browser = 'Edge'
    elif 'Chrome/' in user_agent:
        browser = 'Chrome'
    elif 'Firefox/' in user_agent:
        browser = 'Firefox'
    elif 'Safari/' in user_agent:
        browser = 'Safari'

    operating_system = 'Unknown OS'
    if 'Windows' in user_agent:
        operating_system = 'Windows'
    elif 'Mac OS X' in user_agent or 'Macintosh' in user_agent:
        operating_system = 'macOS'
    elif 'Android' in user_agent:
        operating_system = 'Android'
    elif 'iPhone' in user_agent or 'iPad' in user_agent:
        operating_system = 'iOS'
    elif 'Linux' in user_agent:
        operating_system = 'Linux'

    return f'{browser} on {operating_system}'


def serialize_security_settings(request: Request) -> dict:
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    now = timezone.now()

    return {
        'requires_current_password': request.user.has_usable_password(),
        'sessions': [
            {
                'id': 'current',
                'device': format_device_label(user_agent),
                'location': 'Last active now',
                'is_current': True,
                'last_active_at': now,
            },
        ],
    }


def change_password(
    user: AbstractBaseUser,
    *,
    new_password: str,
) -> AbstractBaseUser:
    user.set_password(new_password)
    user.save(update_fields=['password'])
    return user
