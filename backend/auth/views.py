from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from auth.serializers import (
    GoogleAuthSerializer,
    TokenPairResponseSerializer,
    TokenRefreshResponseSerializer,
    UserSerializer,
)
from auth.services import GoogleAuthError, google_auth_service


class LoginView(TokenObtainPairView):
    """Issue JWT access and refresh tokens for valid credentials."""

    permission_classes = (AllowAny,)

    @extend_schema(
        request=TokenObtainPairSerializer,
        responses={200: TokenPairResponseSerializer},
        description=(
            'Authenticate with username and password. '
            'Returns short-lived access and long-lived refresh tokens.'
        ),
        tags=['Auth'],
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class TokenRefreshAPIView(TokenRefreshView):
    """Exchange a valid refresh token for a new access token."""

    permission_classes = (AllowAny,)

    @extend_schema(
        request=TokenRefreshSerializer,
        responses={200: TokenRefreshResponseSerializer},
        description='Obtain a new access token using a refresh token.',
        tags=['Auth'],
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class GoogleAuthView(APIView):
    """Exchange a Google ID token for JWT access and refresh tokens."""

    permission_classes = (AllowAny,)

    @extend_schema(
        request=GoogleAuthSerializer,
        responses={200: TokenPairResponseSerializer},
        description=(
            'Authenticate with a Google ID token from Sign in with Google. '
            'Returns JWT access and refresh tokens.'
        ),
        tags=['Auth'],
    )
    def post(self, request: Request) -> Response:
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = google_auth_service.authenticate(
                serializer.validated_data['id_token'],
            )
        except GoogleAuthError as exc:
            return Response({'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    """Return the authenticated user's profile."""

    permission_classes = (IsAuthenticated,)

    @extend_schema(
        responses={200: UserSerializer},
        description='Current user profile (requires a valid access token).',
        tags=['Auth'],
    )
    def get(self, request: Request) -> Response:
        user = request.user
        return Response(
            {
                'id': str(user.pk),
                'username': user.username,
                'email': user.email,
                'name': user.get_full_name() or user.username,
            },
            status=status.HTTP_200_OK,
        )
