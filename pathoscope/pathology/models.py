import numpy as np
import pydicom
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.db import models
from django.conf import settings


class PathologyCase(models.Model):
    # Status choices
    SAMPLE_RECEIVED = 'sample_received'
    AWAITING_REVIEW = 'awaiting_review'
    IN_REVIEW = 'in_review'
    REPORT_READY = 'report_ready'
    
    STATUS_CHOICES = [
        (SAMPLE_RECEIVED, 'Sample Received'),
        (AWAITING_REVIEW, 'Awaiting Pathologist Review'),
        (IN_REVIEW, 'In Review'),
        (REPORT_READY, 'Report Ready'),
    ]
    
    # 1. Link to Patient
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pathology_cases')
    
    # Link to TestOrder
    test_order = models.OneToOneField('patient_portal.TestOrder', on_delete=models.CASCADE, related_name='pathology_case', null=True, blank=True)

    # 2. Accessioning fields
    accession_number = models.CharField(max_length=50, unique=True, blank=True)
    barcode = models.CharField(max_length=100, unique=True, blank=True)
    
    # 3. The DICOM File
    dicom_file = models.FileField(upload_to='dicom_slides/', blank=True, null=True)

    # Preview Image (Auto-Generated)
    image_preview = models.ImageField(upload_to='dicom_previews/', blank=True, null=True)

    # 4. Metadata for Organization & Comparison
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=SAMPLE_RECEIVED)
    body_part_examined = models.CharField(max_length=100, blank=True)

    # 5. Annotations & Measurements
    annotations = models.JSONField(default=list, blank=True)

    # 6. Pathologist Report
    pathologist_notes = models.TextField(blank=True, null=True)
    doctor_notes = models.TextField(blank=True, null=True)  # Keep for AI compatibility
    
    # 7. Report Finalization
    is_finalized = models.BooleanField(default=False)
    finalized_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='finalized_cases')
    finalized_date = models.DateTimeField(null=True, blank=True)
    report_pdf = models.FileField(upload_to='pathology_reports/', blank=True, null=True)

    # 8. Comparison Logic
    study_date = models.DateField(null=True, blank=True)
    
    # 9. ICD-10 Integration
    icd_code = models.CharField(max_length=20, blank=True, null=True)
    icd_description = models.CharField(max_length=255, blank=True, null=True)

    def save(self, *args, **kwargs):
        # Save normally first so the file exists on disk
        super().save(*args, **kwargs)

        # If we have a DICOM but no preview, try to generate one
        if self.dicom_file and not self.image_preview:
            try:
                self.generate_preview()
            except Exception as e:
                print(f"Error converting DICOM preview: {e}")

    def generate_preview(self):
        """
        Reads the DICOM file, converts the pixel data to a standard PNG image,
        and saves it to the image_preview field.
        """
        ds = pydicom.dcmread(self.dicom_file.path)

        if not hasattr(ds, 'pixel_array'):
            return

        pixel_array = ds.pixel_array.astype(float)

        # Normalize pixels to 0-255 range
        if pixel_array.max() > 0:
            scaled_image = (np.maximum(pixel_array, 0) / pixel_array.max()) * 255.0
        else:
            scaled_image = pixel_array

        scaled_image = np.uint8(scaled_image)

        # Convert to PNG using Pillow
        image = Image.fromarray(scaled_image)

        # Save to memory buffer
        buffer = BytesIO()
        image.save(buffer, format="PNG")

        # Save to Django field
        file_name = f"preview_{self.id}.png"
        self.image_preview.save(file_name, ContentFile(buffer.getvalue()), save=False)

        # Grab Study Date from DICOM metadata if not set
        if not self.study_date and hasattr(ds, 'StudyDate'):
            try:
                d_str = ds.StudyDate
                if d_str:
                    from datetime import datetime
                    self.study_date = datetime.strptime(d_str, '%Y%m%d').date()
            except:
                pass

        super().save(update_fields=['image_preview', 'study_date'])

    def __str__(self):
        return f"Case {self.id} - {self.patient.username}"