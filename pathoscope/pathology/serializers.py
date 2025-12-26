from rest_framework import serializers
from .models import PathologyCase

class PathologyCaseSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.username', read_only=True)
    finalized_by_name = serializers.CharField(source='finalized_by.username', read_only=True)

    class Meta:
        model = PathologyCase
        fields = [
            'id',
            'patient',
            'patient_name',
            'test_order',
            'accession_number',
            'barcode',
            'dicom_file',
            'uploaded_at',
            'status',
            'body_part_examined',
            'image_preview',
            'annotations',
            'pathologist_notes',
            'doctor_notes',
            'is_finalized',
            'finalized_by',
            'finalized_by_name',
            'finalized_date',
            'report_pdf',
            'study_date',
            'icd_code',
            'icd_description'
        ]
        read_only_fields = ['uploaded_at', 'image_preview', 'accession_number', 'barcode', 
                           'is_finalized', 'finalized_by', 'finalized_date', 'report_pdf']