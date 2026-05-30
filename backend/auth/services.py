from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractBaseUser
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token


class GoogleAuthError(Exception):
    """Raised when Google token verification or user provisioning fails."""


class GoogleAuthService:
    def __init__(self) -> None:
        self._user_model = get_user_model()

    def authenticate(self, token: str) -> AbstractBaseUser:
        idinfo = self.verify_id_token(token)
        return self.get_or_create_user(idinfo)

    def verify_id_token(self, token: str) -> dict:
        client_id = settings.GOOGLE_OAUTH_CLIENT_ID
        if not client_id:
            raise GoogleAuthError('Google sign-in is not configured.')

        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                client_id,
            )
        except ValueError as exc:
            raise GoogleAuthError('Invalid or expired Google token.') from exc

        issuer = idinfo.get('iss')
        if issuer not in ('accounts.google.com', 'https://accounts.google.com'):
            raise GoogleAuthError('Invalid token issuer.')

        if not idinfo.get('email_verified'):
            raise GoogleAuthError('Google account email is not verified.')

        return idinfo

    def get_or_create_user(self, idinfo: dict) -> AbstractBaseUser:
        email = idinfo['email']
        sub = idinfo['sub']
        given_name = idinfo.get('given_name', '')
        family_name = idinfo.get('family_name', '')
        full_name = idinfo.get('name', '')

        user = self._user_model.objects.filter(email__iexact=email).first()
        if user is None:
            username = self._unique_username(f'google_{sub}')
            user = self._user_model(
                username=username,
                email=email,
                first_name=given_name or self._first_name_from_full(full_name),
                last_name=family_name or self._last_name_from_full(full_name),
            )
            user.set_unusable_password()
            user.save()
            return user

        updated_fields: list[str] = []
        if not user.first_name and given_name:
            user.first_name = given_name
            updated_fields.append('first_name')
        if not user.last_name and family_name:
            user.last_name = family_name
            updated_fields.append('last_name')
        if updated_fields:
            user.save(update_fields=updated_fields)

        return user

    def _unique_username(self, base: str) -> str:
        username = base
        suffix = 1
        while self._user_model.objects.filter(username=username).exists():
            username = f'{base}_{suffix}'
            suffix += 1
        return username

    @staticmethod
    def _first_name_from_full(full_name: str) -> str:
        parts = full_name.split(maxsplit=1)
        return parts[0] if parts else ''

    @staticmethod
    def _last_name_from_full(full_name: str) -> str:
        parts = full_name.split(maxsplit=1)
        return parts[1] if len(parts) > 1 else ''


google_auth_service = GoogleAuthService()
