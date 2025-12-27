from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum
from django.utils import timezone
from datetime import timedelta, datetime
from django.db.models.functions import TruncDate
# Import models from your other apps
from patient_portal.models import Appointment, TestOrder, Invoice

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


# CUSTOM PERMISSION: Check if user has role="admin"
class IsAdminRole(permissions.BasePermission):
    """
    Custom permission to check if user has role="admin"
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == "admin"


# 1. THE MAIN DASHBOARD (STATISTICS)
class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        # -- User Stats --
        total_patients = User.objects.filter(role="patient").count()
        # Corrected: Use list for role__in
        total_staff = User.objects.filter(role__in=["lab_tech", "pathologist"]).count()
        total_lab_tech = User.objects.filter(role="lab_tech").count()
        # Corrected: Use role= for single value, or role__in=["pathologist"]
        total_pathologist = User.objects.filter(role="pathologist").count()

        # -- Appointment Stats --
        pending_appointments = Appointment.objects.filter(status="pending").count()
        completed_appointments = Appointment.objects.filter(status="completed").count()

        # -- Lab/Hematology Stats --
        lab_stats = Sample.objects.aggregate(
            received=Count("id", filter=Q(status="received")),
            in_analysis=Count("id", filter=Q(status__in=["in_analysis", "awaiting_validation"])),
            completed=Count("id", filter=Q(status="report_ready"))
        )

        # -- Invoice / Finance Stats (NEW) --
        # 1. Calculate Total Revenue (Sum of "amount" for all "paid" invoices)
        revenue_data = Invoice.objects.filter(payment_status__iexact="paid").aggregate(total_revenue=Sum("amount"))
        total_revenue = revenue_data["total_revenue"] or 0.00  # Handle None if no invoices exist

        # 2. Count Pending Invoices
        pending_invoices = Invoice.objects.filter(payment_status__iexact="unpaid").count()

        data = {
            "total_patients": total_patients,
            "total_staff": total_staff,
            "total_lab_tech": total_lab_tech,
            "total_pathologist": total_pathologist,
            "pending_appointments": pending_appointments,
            "completed_appointments": completed_appointments,
            "samples_received": lab_stats["received"],
            "samples_in_analysis": lab_stats["in_analysis"],
            "reports_completed": lab_stats["completed"],

            # New Fields
            "total_revenue": total_revenue,
            "pending_invoices": pending_invoices,
        }
        return Response(data)


# REVENUE TREND VIEW - Last 5 Days (from paid_date field)
class RevenueTrendView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        """
        Get revenue data for the last 5 days (including today) from Invoice.paid_date
        Groups multiple paid invoices on the same day and sums their amounts
        """
        today = timezone.now().date()
        revenue_data = []

        # Loop through last 5 days (today - 4 days back)
        for i in range(4, -1, -1):
            day = today - timedelta(days=i)
            day_start = timezone.make_aware(timezone.datetime.combine(day, timezone.datetime.min.time()))
            day_end = timezone.make_aware(timezone.datetime.combine(day, timezone.datetime.max.time()))

            # Get revenue for this specific day from paid_date field
            # Only include invoices with payment_status = "paid"
            daily_revenue = Invoice.objects.filter(
                payment_status__iexact="paid",
                paid_date__gte=day_start,
                paid_date__lte=day_end
            ).aggregate(total=Sum("amount"))

            revenue_amount = daily_revenue["total"] or 0.0

            revenue_data.append({
                "date": day.strftime("%a, %b %d"),
                "day": day.strftime("%Y-%m-%d"),
                "revenue": float(revenue_amount)
            })

        return Response(revenue_data)


# 2. USER MANAGEMENT (CRUD)
class UserListView(generics.ListCreateAPIView):
    permission_classes = [IsAdminRole]
    queryset = User.objects.all()
    serializer_class = UserManagementSerializer

    def get_queryset(self):
        queryset = User.objects.all()
        
        # Filter by role
        role = self.request.query_params.get("role")
        if role:
            queryset = queryset.filter(role=role)
        
        # Search by username or email
        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search)
            )
        
        return queryset

    def perform_create(self, serializer):
        # 1. Save the new user first so we get an ID
        user_instance = serializer.save()

        # 2. Create the Log Entry
        AdminActionLog.objects.create(
            actor=self.request.user,
            action_type="CREATE",
            target_model="User",
            target_id=str(user_instance.id),
            details=f"Created new user: {user_instance.username} (Role: {user_instance.role})"
        )


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, Update, or Delete a specific user.
    Supports PUT requests for updating user information including passwords.
    """
    permission_classes = [IsAdminRole]
    queryset = User.objects.all()
    serializer_class = UserManagementSerializer

    def perform_update(self, serializer):
        # Save the updated user
        user_instance = serializer.save()

        # Log the update action
        AdminActionLog.objects.create(
            actor=self.request.user,
            action_type="UPDATE",
            target_model="User",
            target_id=str(user_instance.id),
            details=f"Updated user: {user_instance.username} (Email: {user_instance.email}, Role: {user_instance.role})"
        )

    def perform_destroy(self, instance):
        # --- ENHANCEMENT 1: AUDIT TRAIL ---
        # Log the deletion before it happens
        AdminActionLog.objects.create(
            actor=self.request.user,
            action_type="DELETE",
            target_model="User",
            target_id=str(instance.id),
            details=f"Deleted user: {instance.username} (Email: {instance.email}, Role: {instance.role})"
        )

        # Now delete (Cascade will handle appointments/test orders)
        instance.delete()


# 3. LAB CONFIGURATION (Manage Test Ranges)
class TestAnalyteManagerView(generics.ListCreateAPIView):
    permission_classes = [IsAdminRole]
    queryset = TestAnalyte.objects.all()
    serializer_class = TestAnalyteSerializer


class TestAnalyteDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]
    queryset = TestAnalyte.objects.all()
    serializer_class = TestAnalyteSerializer


# 4. AUDIT LOGS VIEW (New)
class AuditLogListView(generics.ListAPIView):
    """
    Admin can view the history of all actions.
    Supports filtering by action_type and search by username or details.
    """
    permission_classes = [IsAdminRole]
    queryset = AdminActionLog.objects.all().order_by("-timestamp")
    serializer_class = AdminActionLogSerializer
    pagination_class = None  # Disable pagination for now

    def get_queryset(self):
        queryset = AdminActionLog.objects.all().order_by("-timestamp")
        
        # Filter by action type
        action_type = self.request.query_params.get('action_type', 'all')
        if action_type and action_type != 'all':
            queryset = queryset.filter(action_type=action_type)
        
        # Search by username or details
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(actor__username__icontains=search) |
                Q(details__icontains=search)
            )
        
        return queryset


# 5. BROADCAST MANAGER (New)
class BroadcastManagerView(generics.ListCreateAPIView):
    """
    Admin: Create a new announcement or view all past ones.
    """
    permission_classes = [IsAdminRole]
    queryset = SystemBroadcast.objects.all().order_by("-created_at")
    serializer_class = SystemBroadcastSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class BroadcastDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin: Edit or Delete a specific broadcast.
    """
    permission_classes = [IsAdminRole]
    queryset = SystemBroadcast.objects.all()
    serializer_class = SystemBroadcastSerializer

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        # Log the deletion
        AdminActionLog.objects.create(
            actor=self.request.user,
            action_type="DELETE",
            target_model="SystemBroadcast",
            target_id=str(instance.id),
            details=f"Deleted broadcast: '\''{instance.message}'\''"
        )
        instance.delete()


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
        return SystemBroadcast.objects.filter(is_active=True).order_by("-created_at").first()
