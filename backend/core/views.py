from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from core.serializers import HealthResponseSerializer


class HealthView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(
        responses={200: HealthResponseSerializer},
        description='Returns API health status and the current server timestamp.',
        tags=['Health'],
    )
    def get(self, request: Request) -> Response:
        return Response(
            {
                'status': 'ok',
                'timestamp': timezone.now().isoformat(),
            },
            status=status.HTTP_200_OK,
        )
