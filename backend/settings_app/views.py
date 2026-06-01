from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from settings_app.danger import (
    AccountDeletionError,
    delete_user_account,
    serialize_danger_settings,
)
from settings_app.platform import (
    get_platform_settings,
    serialize_platform_settings,
    update_platform_settings,
)
from settings_app.serializers import (
    AccountSettingsSerializer,
    AccountSettingsUpdateSerializer,
    ChangePasswordSerializer,
    DangerSettingsSerializer,
    DeleteAccountSerializer,
    PlatformSettingsSerializer,
    PlatformSettingsUpdateSerializer,
    SecuritySettingsSerializer,
)
from settings_app.services import (
    change_password,
    serialize_account_settings,
    serialize_security_settings,
    update_account_settings,
)


class AccountSettingsView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        responses={200: AccountSettingsSerializer},
        description='Account profile fields for the settings page.',
        tags=['Settings'],
    )
    def get(self, request: Request) -> Response:
        return Response(
            serialize_account_settings(request.user),
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        request=AccountSettingsUpdateSerializer,
        responses={200: AccountSettingsSerializer},
        description='Update display name and/or email for the current user.',
        tags=['Settings'],
    )
    def patch(self, request: Request) -> Response:
        serializer = AccountSettingsUpdateSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        user = update_account_settings(
            request.user,
            name=serializer.validated_data.get('name'),
            email=serializer.validated_data.get('email'),
        )
        return Response(
            serialize_account_settings(user),
            status=status.HTTP_200_OK,
        )


class SecuritySettingsView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        responses={200: SecuritySettingsSerializer},
        description=(
            'Security settings overview, including whether a current password '
            'is required and active sessions for the current user.'
        ),
        tags=['Settings'],
    )
    def get(self, request: Request) -> Response:
        return Response(
            serialize_security_settings(request),
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        request=ChangePasswordSerializer,
        responses={200: SecuritySettingsSerializer},
        description='Set or update the password for the current user.',
        tags=['Settings'],
    )
    def post(self, request: Request) -> Response:
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        change_password(
            request.user,
            new_password=serializer.validated_data['new_password'],
        )
        return Response(
            serialize_security_settings(request),
            status=status.HTTP_200_OK,
        )


class PlatformSettingsView(APIView):
    permission_classes = (IsAuthenticated, IsAdminUser)

    @extend_schema(
        responses={200: PlatformSettingsSerializer},
        description='Global platform settings for this Askyy instance.',
        tags=['Settings'],
    )
    def get(self, request: Request) -> Response:
        platform_settings = get_platform_settings()
        return Response(
            serialize_platform_settings(platform_settings),
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        request=PlatformSettingsUpdateSerializer,
        responses={200: PlatformSettingsSerializer},
        description='Update global platform settings. Admin only.',
        tags=['Settings'],
    )
    def patch(self, request: Request) -> Response:
        serializer = PlatformSettingsUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        platform_settings = update_platform_settings(
            get_platform_settings(),
            **serializer.validated_data,
        )
        return Response(
            serialize_platform_settings(platform_settings),
            status=status.HTTP_200_OK,
        )


class DangerSettingsView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        responses={200: DangerSettingsSerializer},
        description='Danger zone settings for the current user.',
        tags=['Settings'],
    )
    def get(self, request: Request) -> Response:
        return Response(
            serialize_danger_settings(request.user),
            status=status.HTTP_200_OK,
        )


class DeleteAccountView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        request=DeleteAccountSerializer,
        responses={204: None},
        description='Permanently delete the current user account and related data.',
        tags=['Settings'],
    )
    def post(self, request: Request) -> Response:
        serializer = DeleteAccountSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        try:
            delete_user_account(request.user)
        except AccountDeletionError as exc:
            return Response({'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(status=status.HTTP_204_NO_CONTENT)
