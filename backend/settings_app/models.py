from django.db import models

from settings_app.constants import DEFAULT_OPENAI_CHAT_MODEL


class PlatformSettings(models.Model):
    SINGLETON_PK = 1

    default_model = models.CharField(max_length=64, default=DEFAULT_OPENAI_CHAT_MODEL)
    max_tokens_per_request = models.PositiveIntegerField(default=4096)
    rate_limit_per_minute = models.PositiveIntegerField(default=60)
    public_signup_enabled = models.BooleanField(default=True)
    maintenance_mode = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'platform settings'
        verbose_name_plural = 'platform settings'

    def __str__(self) -> str:
        return 'Platform settings'

    def save(self, *args, **kwargs):
        self.pk = self.SINGLETON_PK
        super().save(*args, **kwargs)
