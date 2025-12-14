from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import AdminActionLog, SystemBroadcast
from patient_portal.models import Appointment, TestOrder
from hematology.models import Sample  # Assuming your lab app is named 'hematology'

User = get_user_model()


class UserManagementSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_active', 'date_joined']
        # 'role' assumes you have a role field in your custom User model
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Securely handle password creation for new staff
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class DashboardStatsSerializer(serializers.Serializer):
    # This serializer doesn't use a model; it just structures the stats data
    total_patients = serializers.IntegerField()
    total_staff = serializers.IntegerField()

    # Appointment Stats
    pending_appointments = serializers.IntegerField()
    completed_appointments = serializers.IntegerField()

    # Lab Stats (Derived from Sample status in hematology/models.py)
    samples_received = serializers.IntegerField()
    samples_in_analysis = serializers.IntegerField()
    reports_completed = serializers.IntegerField()



# 1. Audit Log Serializer
class AdminActionLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.username', read_only=True)

    class Meta:
        model = AdminActionLog
        fields = '__all__'

# 4. Broadcast Serializer
class SystemBroadcastSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = SystemBroadcast
        fields = ['id', 'message', 'is_active', 'created_by_name', 'created_at', 'expires_at']
        read_only_fields = ['created_by', 'created_at']