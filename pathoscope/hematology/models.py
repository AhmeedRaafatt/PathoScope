from django.db import models
from django.contrib.auth import get_user_model
from patient_portal.models import Appointment, TestOrder

User = get_user_model()


# Test analytes with normal ranges for automated validation
class TestAnalyte(models.Model):
    test_name = models.CharField(max_length=100)  # e.g., "CBC"
    analyte_name = models.CharField(max_length=100)  # e.g., "White Blood Cell Count"
    unit = models.CharField(max_length=50)  # e.g., "cells/μL"
    normal_range_low = models.DecimalField(max_digits=10, decimal_places=2)
    normal_range_high = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.test_name} - {self.analyte_name}"


# Sample accessioning and tracking
class Sample(models.Model):
    RECEIVED = 'received'
    IN_ANALYSIS = 'in_analysis'
    AWAITING_VALIDATION = 'awaiting_validation'
    REPORT_READY = 'report_ready'
    
    STATUS_CHOICES = [
        (RECEIVED, 'Sample Received'),
        (IN_ANALYSIS, 'In Analysis'),
        (AWAITING_VALIDATION, 'Awaiting Validation'),
        (REPORT_READY, 'Report Ready'),
    ]
    
    accession_number = models.CharField(max_length=50, unique=True)
    test_order = models.OneToOneField(TestOrder, on_delete=models.CASCADE, related_name='sample')
    barcode = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=RECEIVED)
    accessioned_date = models.DateTimeField(auto_now_add=True)
    processing_started = models.DateTimeField(null=True, blank=True)
    processing_completed = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.accession_number} - {self.test_order.test_name}"


# Instrument queue simulation
class InstrumentQueue(models.Model):
    WAITING = 'waiting'
    PROCESSING = 'processing'
    COMPLETED = 'completed'
    
    STATUS_CHOICES = [
        (WAITING, 'Waiting'),
        (PROCESSING, 'Processing'),
        (COMPLETED, 'Completed'),
    ]
    
    sample = models.ForeignKey(Sample, on_delete=models.CASCADE, related_name='queue_entries')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=WAITING)
    added_date = models.DateTimeField(auto_now_add=True)
    started_date = models.DateTimeField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.sample.accession_number} - {self.status}"


# Test results with auto-flagging
class TestResult(models.Model):
    sample = models.ForeignKey(Sample, on_delete=models.CASCADE, related_name='results')
    analyte = models.ForeignKey(TestAnalyte, on_delete=models.CASCADE)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    is_flagged = models.BooleanField(default=False)
    flag_type = models.CharField(max_length=20, blank=True)  # "HIGH" or "LOW"
    validated = models.BooleanField(default=False)
    validated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    validated_date = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.sample.accession_number} - {self.analyte.analyte_name}: {self.value}"


# QC logging for audit trail
class QCLog(models.Model):
    technician = models.ForeignKey(User, on_delete=models.CASCADE)
    event_type = models.CharField(max_length=100)  # e.g., "Reagent Check", "Calibration"
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.event_type} by {self.technician.username} at {self.timestamp}"