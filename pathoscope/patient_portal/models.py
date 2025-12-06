from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

User = get_user_model()


class PatientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    chronic_diseases = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"Profile of {self.user.username}"


class Appointment(models.Model):
    PENDING = 'pending'
    CONFIRMED = 'confirmed'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (CONFIRMED, 'Confirmed'),
        (COMPLETED, 'Completed'),
        (CANCELLED, 'Cancelled'),
    ]
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    date = models.DateField()
    time = models.TimeField()
    reason = models.CharField(max_length=200, default='Sample Collection')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.patient.username} - {self.date} {self.time}"


class TestOrder(models.Model):
    HEMATOLOGY = 'hematology'
    PATHOLOGY = 'pathology'
    
    TEST_TYPE_CHOICES = [
        (HEMATOLOGY, 'Hematology'),
        (PATHOLOGY, 'Pathology'),
    ]
    
    PENDING = 'pending'
    IN_PROGRESS = 'in_progress'
    COMPLETE = 'complete'
    REPORT_READY = 'report_ready'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (IN_PROGRESS, 'In Progress'),
        (COMPLETE, 'Complete'),
        (REPORT_READY, 'Report Ready'),
    ]
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_orders')
    test_type = models.CharField(max_length=20, choices=TEST_TYPE_CHOICES)
    test_name = models.CharField(max_length=100)
    order_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    report_url = models.CharField(max_length=500, blank=True)  # For PDF reports
    slide_url = models.CharField(max_length=500, blank=True)  # For DICOM viewer
    
    def __str__(self):
        return f"{self.patient.username} - {self.test_name}"


class Invoice(models.Model):
    UNPAID = 'unpaid'
    PAID = 'paid'
    PARTIAL = 'partial'
    
    PAYMENT_STATUS_CHOICES = [
        (UNPAID, 'Unpaid'),
        (PAID, 'Paid'),
        (PARTIAL, 'Partial'),
    ]
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invoices')
    test_order = models.ForeignKey(TestOrder, on_delete=models.CASCADE, related_name='invoices')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default=UNPAID)
    created_date = models.DateTimeField(auto_now_add=True)
    paid_date = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Invoice {self.id} - {self.patient.username}"
    

@receiver(post_save, sender=TestOrder)
def create_test_invoice(sender, instance, created, **kwargs):
    """
    Automatically creates an Invoice whenever a new TestOrder is created.
    """
    if created:
        price = 0.00
        if instance.test_type == TestOrder.HEMATOLOGY:
            price = 50.00
        elif instance.test_type == TestOrder.PATHOLOGY:
            price = 150.00
        
        Invoice.objects.create(
            patient=instance.patient,
            test_order=instance,
            amount=price,
            payment_status=Invoice.UNPAID
        )