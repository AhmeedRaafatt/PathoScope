import numpy as np
import pydicom
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.db import models
from django.conf import settings


class PathologyCase(models.Model):
    # 1. Link to Patient
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pathology_cases')

    # 2. The DICOM File
    dicom_file = models.FileField(upload_to='dicom_slides/')

    # --- NEW: The Preview Image (Auto-Generated) ---
    image_preview = models.ImageField(upload_to='dicom_previews/', blank=True, null=True)

    # 3. Metadata for Organization & Comparison
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='Pending Review')
    body_part_examined = models.CharField(max_length=100, blank=True)

    # --- Advanced Features Support (Retained) ---

    # Feature A: Annotations & Measurements
    annotations = models.JSONField(default=dict, blank=True)

    # Feature B: Notes
    doctor_notes = models.TextField(blank=True, null=True)

    # Feature C: Comparison Logic
    study_date = models.DateField(null=True, blank=True)
    # --- NEW: ICD-10 Integration ---
    icd_code = models.CharField(max_length=20, blank=True, null=True)  # e.g., "C50.911"
    icd_description = models.CharField(max_length=255, blank=True,
                                       null=True)  # e.g., "Malignant neoplasm of right female breast"

    def save(self, *args, **kwargs):
        # 1. Save normally first so the file exists on disk
        super().save(*args, **kwargs)

        # 2. If we have a DICOM but no preview, try to generate one
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
        # Read the DICOM file from disk
        ds = pydicom.dcmread(self.dicom_file.path)

        # Extract pixel data
        if not hasattr(ds, 'pixel_array'):
            return  # Skip if no image data found

        pixel_array = ds.pixel_array.astype(float)

        # Normalize pixels to 0-255 range (Standard Image format)
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

        # Save to Django field (without triggering recursion)
        file_name = f"preview_{self.id}.png"
        self.image_preview.save(file_name, ContentFile(buffer.getvalue()), save=False)

        # Attempt to grab Study Date from DICOM metadata if not set
        if not self.study_date and hasattr(ds, 'StudyDate'):
            try:
                # DICOM date format is usually YYYYMMDD
                d_str = ds.StudyDate
                if d_str:
                    from datetime import datetime
                    self.study_date = datetime.strptime(d_str, '%Y%m%d').date()
            except:
                pass

        super().save(update_fields=['image_preview', 'study_date'])

    def __str__(self):
        return f"Case {self.id} - {self.patient.username}"