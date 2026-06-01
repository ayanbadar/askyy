from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from dashboard.serializers import AdminDashboardSerializer, UserDashboardSerializer
from dashboard.services.admin import build_admin_dashboard
from dashboard.services.user import user_dashboard_service


class UserDashboardView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        responses={200: UserDashboardSerializer},
        description='Personal dashboard metrics for the authenticated user.',
        tags=['Dashboard'],
    )
    def get(self, request: Request) -> Response:
        return Response(
            user_dashboard_service.build_user_dashboard(request.user),
            status=status.HTTP_200_OK,
        )


class AdminDashboardView(APIView):
    permission_classes = (IsAuthenticated, IsAdminUser)

    @extend_schema(
        responses={200: AdminDashboardSerializer},
        description='Platform-wide dashboard metrics. Admin only.',
        tags=['Dashboard'],
    )
    def get(self, request: Request) -> Response:
        return Response(
            build_admin_dashboard(),
            status=status.HTTP_200_OK,
        )
