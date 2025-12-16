from rest_framework import serializers
from .models import PathologyCase

class PathologyCaseSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.username', read_only=True)

    class Meta:
        model = PathologyCase
        fields = [
            'id',
            'patient',
            'patient_name',
            'dicom_file',
            'uploaded_at',
            'status',
            'body_part_examined',
            'image_preview',  # <--- The PNG for the viewer
            'annotations',  # <--- Sending drawings to frontend
            'doctor_notes', # <--- Sending notes to frontend
            'study_date'    # <--- Helping frontend sort for comparison
        ]
        read_only_fields = ['uploaded_at', 'status', 'image_preview']