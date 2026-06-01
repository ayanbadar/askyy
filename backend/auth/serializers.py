from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


class TokenPairResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()


class TokenRefreshResponseSerializer(serializers.Serializer):
    access = serializers.CharField()


class UserSerializer(serializers.Serializer):
    id = serializers.CharField()
    username = serializers.CharField()
    email = serializers.EmailField()
    name = serializers.CharField()
    is_superuser = serializers.BooleanField()


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField()


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_username(self, value: str) -> str:
        username = value.strip()
        if not username:
            raise serializers.ValidationError('Username is required.')
        if (
            get_user_model()
            .objects.filter(username__iexact=username, is_active=True)
            .exists()
        ):
            raise serializers.ValidationError('This username is already taken.')
        return username

    def validate_email(self, value: str) -> str:
        return value.strip().lower()

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value


class VerifySignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()

    def validate_otp(self, value: str) -> str:
        otp = value.strip()
        if not otp.isdigit():
            raise serializers.ValidationError('Verification code must be 6 digits.')
        return otp


class ResendSignupOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class SignupResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    email = serializers.EmailField()
