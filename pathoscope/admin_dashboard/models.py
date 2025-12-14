from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

# 1. AUDIT TRAIL MODEL
class AdminActionLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('LOGIN', 'Login'),
    ]

    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)  # The Admin who did it
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES)
    target_model = models.CharField(max_length=50)  # e.g., "User", "Analyte"
    target_id = models.CharField(max_length=50, null=True, blank=True) # ID of the object changed
    details = models.TextField()  # e.g., "Deleted user 'dr_house'"
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.actor} - {self.action_type} - {self.timestamp}"

# 4. SYSTEM BROADCAST MODEL
class SystemBroadcast(models.Model):
    message = models.CharField(max_length=255)  # "Server maintenance at 10 PM"
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True) # Optional auto-expiration

    def __str__(self):
        return self.message