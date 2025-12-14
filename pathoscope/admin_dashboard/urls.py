from django.urls import path
from .views import (
    AdminDashboardStatsView,
    UserListView,
    UserDetailView,
    TestAnalyteManagerView,
    TestAnalyteDetailView,
    AuditLogListView,
    BroadcastManagerView,
    ActiveBroadcastView,
)

urlpatterns = [
    # Dashboard Statistics
    path('stats/', AdminDashboardStatsView.as_view(), name='admin-stats'),

    # User Management
    path('users/', UserListView.as_view(), name='admin-user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='admin-user-detail'),

    # Lab Configuration
    path('analytes/', TestAnalyteManagerView.as_view(), name='admin-analyte-list'),
    path('analytes/<int:pk>/', TestAnalyteDetailView.as_view(), name='admin-analyte-detail'),

    path('audit-logs/', AuditLogListView.as_view(), name='audit-log-list'),

    # Enhancement 4: Broadcasts
    path('broadcasts/', BroadcastManagerView.as_view(), name='broadcast-manage'), # Admin creates here
    path('broadcasts/active/', ActiveBroadcastView.as_view(), name='broadcast-active'), # Users fetch here
]