from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


class TokenCryptoError(Exception):
    """Raised when token encryption or decryption fails."""


def _get_fernet() -> Fernet:
    key = settings.GOOGLE_TOKEN_ENCRYPTION_KEY
    if not key:
        raise TokenCryptoError('GOOGLE_TOKEN_ENCRYPTION_KEY is not configured.')
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_token(value: str) -> str:
    if not value:
        return ''
    return _get_fernet().encrypt(value.encode()).decode()


def decrypt_token(value: str) -> str:
    if not value:
        return ''
    try:
        return _get_fernet().decrypt(value.encode()).decode()
    except InvalidToken as exc:
        raise TokenCryptoError('Stored token could not be decrypted.') from exc
