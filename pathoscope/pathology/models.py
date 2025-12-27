import os
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
    PROCESSING = 'processing'
    
    STATUS_CHOICES = [
        (SAMPLE_RECEIVED, 'Sample Received'),
        (AWAITING_REVIEW, 'Awaiting Pathologist Review'),
        (IN_REVIEW, 'In Review'),
        (REPORT_READY, 'Report Ready'),
        (PROCESSING, 'Processing Volume'),
    ]
    
    # 1. Link to Patient
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pathology_cases')
    
    # Link to TestOrder
    test_order = models.OneToOneField('patient_portal.TestOrder', on_delete=models.CASCADE, related_name='pathology_case', null=True, blank=True)

    # 2. Accessioning fields
    accession_number = models.CharField(max_length=50, unique=True, blank=True)
    barcode = models.CharField(max_length=100, unique=True, blank=True)
    
    # 3. The DICOM File (for single files - backward compatibility)
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
    
    # 10. MRI/CT Volume Support (for MPR)
    is_volume = models.BooleanField(default=False)  # True if this is a 3D volume (multiple slices)
    num_slices = models.IntegerField(default=0)
    volume_file = models.FileField(upload_to='dicom_volumes/', blank=True, null=True)  # Compressed numpy volume
    modality = models.CharField(max_length=10, blank=True)  # MR, CT, etc.
    series_description = models.CharField(max_length=255, blank=True)
    
    # Volume dimensions
    volume_depth = models.IntegerField(default=0)  # Z (number of slices)
    volume_height = models.IntegerField(default=0)  # Y (rows)
    volume_width = models.IntegerField(default=0)  # X (columns)
    slice_thickness = models.FloatField(null=True, blank=True)
    pixel_spacing_x = models.FloatField(null=True, blank=True)
    pixel_spacing_y = models.FloatField(null=True, blank=True)
    
    # Window/Level for display
    window_center = models.FloatField(null=True, blank=True)
    window_width = models.FloatField(null=True, blank=True)
    
    # Preview images for MPR planes
    sagittal_preview = models.ImageField(upload_to='dicom_previews/', blank=True, null=True)
    coronal_preview = models.ImageField(upload_to='dicom_previews/', blank=True, null=True)

    def save(self, *args, **kwargs):
        # Save normally first so the file exists on disk
        super().save(*args, **kwargs)

        # If we have a DICOM but no preview, try to generate one (single file mode)
        if self.dicom_file and not self.image_preview and not self.is_volume:
            try:
                self.generate_preview()
            except Exception as e:
                print(f"Error converting DICOM preview: {e}")

    def get_volume_array(self):
        """Load the 3D volume numpy array from file"""
        if self.volume_file:
            return np.load(self.volume_file.path)
        return None
    
    def get_axial_slice(self, index):
        """Get a single axial slice (original orientation)"""
        volume = self.get_volume_array()
        if volume is not None and 0 <= index < volume.shape[0]:
            return volume[index, :, :]
        return None
    
    def get_sagittal_slice(self, index):
        """Get a single sagittal slice (side view)"""
        volume = self.get_volume_array()
        if volume is not None and 0 <= index < volume.shape[2]:
            return volume[:, :, index]
        return None
    
    def get_coronal_slice(self, index):
        """Get a single coronal slice (front view)"""
        volume = self.get_volume_array()
        if volume is not None and 0 <= index < volume.shape[1]:
            return volume[:, index, :]
        return None

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