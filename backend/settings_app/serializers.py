from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from settings_app.danger import can_delete_account

User = get_user_model()


class AccountSettingsSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField()
    name = serializers.CharField(max_length=150)


class AccountSettingsUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_email(self, value: str) -> str:
        request = self.context['request']
        if (
            User.objects.filter(email__iexact=value)
            .exclude(pk=request.user.pk)
            .exists()
        ):
            raise serializers.ValidationError('This email is already in use.')
        return value


class ActiveSessionSerializer(serializers.Serializer):
    id = serializers.CharField()
    device = serializers.CharField()
    location = serializers.CharField()
    is_current = serializers.BooleanField()
    last_active_at = serializers.DateTimeField()


class SecuritySettingsSerializer(serializers.Serializer):
    requires_current_password = serializers.BooleanField()
    sessions = ActiveSessionSerializer(many=True)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True,
        trim_whitespace=False,
    )
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs: dict) -> dict:
        user = self.context['request'].user

        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {'confirm_password': 'Passwords do not match.'},
            )

        if user.has_usable_password():
            current_password = attrs.get('current_password', '')
            if not current_password:
                raise serializers.ValidationError(
                    {'current_password': 'Current password is required.'},
                )
            if not user.check_password(current_password):
                raise serializers.ValidationError(
                    {'current_password': 'Current password is incorrect.'},
                )

        validate_password(attrs['new_password'], user)
        return attrs


class OpenAIModelOptionSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()


class PlatformSettingsSerializer(serializers.Serializer):
    default_model = serializers.CharField()
    max_tokens_per_request = serializers.IntegerField()
    rate_limit_per_minute = serializers.IntegerField()
    public_signup_enabled = serializers.BooleanField()
    maintenance_mode = serializers.BooleanField()
    model_options = OpenAIModelOptionSerializer(many=True)


class PlatformSettingsUpdateSerializer(serializers.Serializer):
    default_model = serializers.CharField(required=False)
    max_tokens_per_request = serializers.IntegerField(
        required=False,
        min_value=256,
        max_value=128000,
    )
    rate_limit_per_minute = serializers.IntegerField(
        required=False,
        min_value=1,
        max_value=1000,
    )
    public_signup_enabled = serializers.BooleanField(required=False)
    maintenance_mode = serializers.BooleanField(required=False)

    def validate_default_model(self, value: str) -> str:
        from settings_app.platform import is_openai_chat_model

        if not is_openai_chat_model(value):
            raise serializers.ValidationError('Select a supported OpenAI model.')
        return value


class DangerSettingsSerializer(serializers.Serializer):
    requires_password_confirmation = serializers.BooleanField()
    can_delete_account = serializers.BooleanField()


class DeleteAccountSerializer(serializers.Serializer):
    password = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs: dict) -> dict:
        user = self.context['request'].user

        if not can_delete_account(user):
            raise serializers.ValidationError(
                'Cannot delete the only admin account on this instance.',
            )

        if user.has_usable_password():
            password = attrs.get('password', '')
            if not password:
                raise serializers.ValidationError(
                    {'password': 'Password is required to delete your account.'},
                )
            if not user.check_password(password):
                raise serializers.ValidationError(
                    {'password': 'Password is incorrect.'},
                )

        return attrs
