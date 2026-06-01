from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractBaseUser

User = get_user_model()


class AccountDeletionError(Exception):
    """Raised when an account cannot be deleted."""


def can_delete_account(user: AbstractBaseUser) -> bool:
    if user.is_superuser and User.objects.filter(is_superuser=True).count() <= 1:
        return False
    return True


def serialize_danger_settings(user: AbstractBaseUser) -> dict:
    return {
        'requires_password_confirmation': user.has_usable_password(),
        'can_delete_account': can_delete_account(user),
    }


def delete_user_account(user: AbstractBaseUser) -> None:
    if not can_delete_account(user):
        raise AccountDeletionError(
            'Cannot delete the only admin account on this instance.',
        )

    user.delete()
