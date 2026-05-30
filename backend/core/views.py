from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request: Request) -> Response:
        return Response(
            {
                'status': 'ok',
                'timestamp': timezone.now().isoformat(),
            },
            status=status.HTTP_200_OK,
        )
