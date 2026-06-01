from django.conf import settings

from settings_app.constants import (
    DEFAULT_OPENAI_CHAT_MODEL,
    OPENAI_CHAT_MODEL_IDS,
    OPENAI_CHAT_MODELS,
)
from settings_app.models import PlatformSettings


def get_openai_model_options() -> list[dict[str, str]]:
    return [
        {'value': model_id, 'label': label} for model_id, label in OPENAI_CHAT_MODELS
    ]


def is_openai_chat_model(model_id: str) -> bool:
    return model_id in OPENAI_CHAT_MODEL_IDS


def get_platform_settings() -> PlatformSettings:
    defaults = {
        'default_model': settings.RAG_CHAT_MODEL or DEFAULT_OPENAI_CHAT_MODEL,
        'max_tokens_per_request': 4096,
        'rate_limit_per_minute': 60,
        'public_signup_enabled': True,
        'maintenance_mode': False,
    }
    if not is_openai_chat_model(defaults['default_model']):
        defaults['default_model'] = DEFAULT_OPENAI_CHAT_MODEL

    platform_settings, _created = PlatformSettings.objects.get_or_create(
        pk=PlatformSettings.SINGLETON_PK,
        defaults=defaults,
    )
    return platform_settings


def serialize_platform_settings(platform_settings: PlatformSettings) -> dict:
    return {
        'default_model': platform_settings.default_model,
        'max_tokens_per_request': platform_settings.max_tokens_per_request,
        'rate_limit_per_minute': platform_settings.rate_limit_per_minute,
        'public_signup_enabled': platform_settings.public_signup_enabled,
        'maintenance_mode': platform_settings.maintenance_mode,
        'model_options': get_openai_model_options(),
    }


def update_platform_settings(
    platform_settings: PlatformSettings,
    **fields,
) -> PlatformSettings:
    allowed_fields = {
        'default_model',
        'max_tokens_per_request',
        'rate_limit_per_minute',
        'public_signup_enabled',
        'maintenance_mode',
    }
    updated_fields: list[str] = []

    for field_name, value in fields.items():
        if field_name not in allowed_fields or value is None:
            continue
        setattr(platform_settings, field_name, value)
        updated_fields.append(field_name)

    if updated_fields:
        platform_settings.save(update_fields=[*updated_fields, 'updated_at'])

    return platform_settings
