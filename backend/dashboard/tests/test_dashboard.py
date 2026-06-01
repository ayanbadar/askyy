from __future__ import annotations

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from chat.models import Conversation, Message
from dashboard.services.time_utils import time_utils_service
from dashboard.services.user import user_dashboard_service

User = get_user_model()


class DashboardTimeUtilsTests(TestCase):
    def test_percent_change_from_zero(self):
        self.assertEqual(time_utils_service.percent_change(5, 0), 100.0)
        self.assertEqual(time_utils_service.percent_change(0, 0), 0.0)

    def test_percent_change_rounding(self):
        self.assertEqual(time_utils_service.percent_change(11, 10), 10.0)


class UserDashboardServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='dashboard-user',
            email='dashboard@example.com',
            password='test-pass-123',
        )
        self.conversation = Conversation.objects.create(
            user=self.user,
            title='Reset password help',
        )
        Message.objects.create(
            conversation=self.conversation,
            role=Message.Role.USER,
            content='How do I reset my password?',
        )
        Message.objects.create(
            conversation=self.conversation,
            role=Message.Role.ASSISTANT,
            content='Open settings and choose reset password.',
        )

    def test_build_user_dashboard_includes_conversation_metrics(self):
        payload = user_dashboard_service.build_user_dashboard(self.user)

        self.assertEqual(payload['stats']['my_conversations'], 1)
        self.assertEqual(len(payload['recent_conversations']), 1)
        self.assertEqual(
            payload['recent_conversations'][0]['topic'],
            'Reset password help',
        )
        self.assertEqual(payload['recent_conversations'][0]['messages'], 2)
        self.assertEqual(len(payload['weekly_activity']), 7)


class DashboardAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='api-user',
            email='api@example.com',
            password='test-pass-123',
        )
        self.admin = User.objects.create_superuser(
            username='admin-user',
            email='admin@example.com',
            password='test-pass-123',
        )

    def test_user_dashboard_requires_authentication(self):
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_dashboard_returns_payload(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/dashboard/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stats', response.data)
        self.assertIn('weekly_activity', response.data)
        self.assertIn('recent_conversations', response.data)

    def test_admin_dashboard_requires_admin(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/dashboard/admin/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_dashboard_returns_payload(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/dashboard/admin/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('response_breakdown', response.data)
        self.assertIn('knowledge_sources', response.data)
        self.assertIn('model_usage', response.data)
