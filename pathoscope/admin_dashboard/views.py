from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Count, Q

# Import models from your other apps
from patient_portal.models import Appointment, TestOrder
from hematology.models import Sample, TestAnalyte

# Import local models (Audit Log & Broadcast)
from .models import AdminActionLog, SystemBroadcast

# Import serializers
from .serializers import (
    UserManagementSerializer,
    DashboardStatsSerializer,
    AdminActionLogSerializer,
    SystemBroadcastSerializer
)
from hematology.serializers import TestAnalyteSerializer

User = get_user_model()


# 1. THE MAIN DASHBOARD (STATISTICS)
class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # -- User Stats --
        total_patients = User.objects.filter(role='patient').count()
        # Corrected: Use list for role__in
        total_staff = User.objects.filter(role__in=['lab_tech', 'pathologist']).count()
        total_lab_tech = User.objects.filter(role='lab_tech').count()
        # Corrected: Use role= for single value, or role__in=['pathologist']
        total_pathologist = User.objects.filter(role='pathologist').count()

        # -- Appointment Stats --
        pending_appointments = Appointment.objects.filter(status='scheduled').count()
        completed_appointments = Appointment.objects.filter(status='completed').count()

        # -- Lab/Hematology Stats --
        lab_stats = Sample.objects.aggregate(
            received=Count('id', filter=Q(status='received')),
            in_analysis=Count('id', filter=Q(status__in=['in_analysis', 'awaiting_validation'])),
            completed=Count('id', filter=Q(status='report_ready'))
        )

        data = {
            'total_patients': total_patients,
            'total_staff': total_staff,
            'total_lab_tech': total_lab_tech,
            'total_pathologist': total_pathologist,
            'pending_appointments': pending_appointments,
            'completed_appointments': completed_appointments,
            'samples_received': lab_stats['received'],
            'samples_in_analysis': lab_stats['in_analysis'],
            'reports_completed': lab_stats['completed'],
        }

        return Response(data)


# 2. USER MANAGEMENT (CRUD)
class UserListView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()
    serializer_class = UserManagementSerializer

    def get_queryset(self):
        role = self.request.query_params.get('role')
        if role:
            return User.objects.filter(role=role)
        return User.objects.all()

    def perform_create(self, serializer):
        # 1. Save the new user first so we get an ID
        user_instance = serializer.save()

        # 2. Create the Log Entry
        AdminActionLog.objects.create(
            actor=self.request.user,
            action_type='CREATE',
            target_model='User',
            target_id=str(user_instance.id),
            details=f"Created new user: {user_instance.username} (Role: {user_instance.role})"
        )


class UserDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()
    serializer_class = UserManagementSerializer

    def perform_destroy(self, instance):
        # --- ENHANCEMENT 1: AUDIT TRAIL ---
        # Log the deletion before it happens
        AdminActionLog.objects.create(
            actor=self.request.user,
            action_type='DELETE',
            target_model='User',
            target_id=str(instance.id),
            details=f"Deleted user: {instance.username} (Email: {instance.email}, Role: {instance.role})"
        )

        # Now delete (Cascade will handle appointments/test orders)
        instance.delete()


# 3. LAB CONFIGURATION (Manage Test Ranges)
class TestAnalyteManagerView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    queryset = TestAnalyte.objects.all()
    serializer_class = TestAnalyteSerializer


class TestAnalyteDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = TestAnalyte.objects.all()
    serializer_class = TestAnalyteSerializer


# 4. AUDIT LOGS VIEW (New)
class AuditLogListView(generics.ListAPIView):
    """
    Admin can view the history of all actions.
    """
    permission_classes = [IsAdminUser]
    queryset = AdminActionLog.objects.all().order_by('-timestamp')
    serializer_class = AdminActionLogSerializer


# 5. BROADCAST MANAGER (New)
class BroadcastManagerView(generics.ListCreateAPIView):
    """
    Admin: Create a new announcement or view all past ones.
    """
    permission_classes = [IsAdminUser]
    queryset = SystemBroadcast.objects.all().order_by('-created_at')
    serializer_class = SystemBroadcastSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ActiveBroadcastView(generics.RetrieveAPIView):
    """
    Public/Staff: Fetch the current active message (if any).
    Used by the Frontend to show the banner.
    """
    # Any logged-in user (patient, staff, admin) can see the alert
    permission_classes = [IsAuthenticated]
    serializer_class = SystemBroadcastSerializer

    def get_object(self):
        # Return the most recent active broadcast
        return SystemBroadcast.objects.filter(is_active=True).order_by('-created_at').first()