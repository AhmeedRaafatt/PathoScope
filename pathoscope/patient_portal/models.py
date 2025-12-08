from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class PatientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    chronic_diseases = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"Profile of {self.user.username}"


# Test pricing dictionary
TEST_PRICES = {
    'hematology': {
        'CBC': 50.00,
        'RBC Count': 100.00,
        'WBC Count': 80.00,
        'Hemoglobin': 60.00,
        'Platelet Count': 70.00,
        'Blood Glucose': 40.00,
    },
    'pathology': {
        'Tissue Biopsy': 150.00,
        'Fine Needle Aspiration': 200.00,
        'Bone Marrow Biopsy': 300.00,
        'Skin Biopsy': 120.00,
    }
}


class Appointment(models.Model):
    CONFIRMED = 'confirmed'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'
    
    STATUS_CHOICES = [
        (CONFIRMED, 'Confirmed'),
        (COMPLETED, 'Completed'),
        (CANCELLED, 'Cancelled'),
    ]
    
    HEMATOLOGY = 'hematology'
    PATHOLOGY = 'pathology'
    
    TEST_TYPE_CHOICES = [
        (HEMATOLOGY, 'Hematology'),
        (PATHOLOGY, 'Pathology'),
    ]
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    date = models.DateField()
    time = models.TimeField()
    test_type = models.CharField(max_length=20, choices=TEST_TYPE_CHOICES, default='hematology')
    selected_tests = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=CONFIRMED)
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
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='test_orders')
    test_type = models.CharField(max_length=20, choices=TEST_TYPE_CHOICES)
    test_name = models.CharField(max_length=100)
    order_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    report_url = models.CharField(max_length=500, blank=True)
    slide_url = models.CharField(max_length=500, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
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
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='invoices', null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default=UNPAID)
    created_date = models.DateTimeField(auto_now_add=True)
    paid_date = models.DateTimeField(null=True, blank=True)
    items = models.JSONField(default=list)  # Store list of {test_name, price}
    
    def __str__(self):
        return f"Invoice {self.id} - {self.patient.username}"