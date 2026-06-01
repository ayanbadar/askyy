from django.core.cache import cache

from settings_app.platform import get_platform_settings


def is_chat_available_for_user(user) -> bool:
    platform_settings = get_platform_settings()
    if not platform_settings.maintenance_mode:
        return True
    return user.is_superuser


def resolve_chat_model(requested_model: str | None) -> str:
    platform_settings = get_platform_settings()
    if requested_model:
        return requested_model
    return platform_settings.default_model


def get_max_tokens_per_request() -> int:
    return get_platform_settings().max_tokens_per_request


def check_chat_rate_limit(user) -> bool:
    platform_settings = get_platform_settings()
    cache_key = f'chat_rate:{user.pk}'
    request_count = cache.get(cache_key, 0)

    if request_count >= platform_settings.rate_limit_per_minute:
        return False

    cache.set(cache_key, request_count + 1, timeout=60)
    return True


def is_public_signup_enabled() -> bool:
    return get_platform_settings().public_signup_enabled
