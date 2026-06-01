from django.urls import path

from dashboard.views import AdminDashboardView, UserDashboardView

urlpatterns = [
    path('', UserDashboardView.as_view(), name='dashboard-user'),
    path('admin/', AdminDashboardView.as_view(), name='dashboard-admin'),
]
