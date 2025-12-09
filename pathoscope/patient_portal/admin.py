from django.contrib import admin
from .models import PatientProfile, Appointment, TestOrder, Invoice

admin.site.register(PatientProfile)
admin.site.register(Appointment)
admin.site.register(TestOrder)
admin.site.register(Invoice)