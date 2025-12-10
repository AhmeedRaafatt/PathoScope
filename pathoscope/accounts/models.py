from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # Defining the Roles based on your Project Document [cite: 2, 3, 4, 5, 6]
    PATIENT = 'patient'
    LAB_TECH = 'lab_tech' # hematologist
    PATHOLOGIST = 'pathologist' #pathology
    ADMIN = 'admin'

    ROLE_CHOICES = [
        (PATIENT, 'Patient'),
        (LAB_TECH, 'Lab Technician'),
        (PATHOLOGIST, 'Pathologist'),
        (ADMIN, 'Admin'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=PATIENT)

    # You can add profile fields here later (like phone number, address, etc.)

    def __str__(self):
        return f"{self.username} ({self.role})"
