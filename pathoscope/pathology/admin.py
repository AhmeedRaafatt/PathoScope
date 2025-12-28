from django.contrib import admin
from .models import PathologyCase

@admin.register(PathologyCase)
class PathologyCaseAdmin(admin.ModelAdmin):
    list_display = ['id', 'accession_number', 'patient', 'status', 'is_finalized', 'uploaded_at']
    list_filter = ['status', 'is_finalized', 'uploaded_at']
    search_fields = ['accession_number', 'patient__username', 'barcode']
    readonly_fields = ['accession_number', 'barcode', 'uploaded_at', 'finalized_date']