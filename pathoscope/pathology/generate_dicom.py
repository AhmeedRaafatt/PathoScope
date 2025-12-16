import pydicom
from pydicom.dataset import FileDataset
import numpy as np
import datetime, os

# Create the file meta information
filename = "test_slide.dcm"
file_meta = pydicom.dataset.FileMetaDataset()
file_meta.MediaStorageSOPClassUID = '1.2.840.10008.5.1.4.1.1.7'
file_meta.MediaStorageSOPInstanceUID = '1.2.3'
file_meta.ImplementationClassUID = '1.2.3.4'
file_meta.TransferSyntaxUID = pydicom.uid.ImplicitVRLittleEndian

# Create the dataset
ds = FileDataset(filename, {}, file_meta=file_meta, preamble=b"\0" * 128)
ds.PatientName = "Test^Patient"
ds.PatientID = "123456"
ds.StudyDate = datetime.datetime.now().strftime('%Y%m%d')
ds.Modality = 'OT'
ds.Rows = 512
ds.Columns = 512
ds.BitsAllocated = 8
ds.BitsStored = 8
ds.HighBit = 7
ds.PixelRepresentation = 0
ds.SamplesPerPixel = 1
ds.PhotometricInterpretation = "MONOCHROME2"

# Create a simple image (a square with a gradient)
pixel_data = np.zeros((512, 512), dtype=np.uint8)
for i in range(512):
    pixel_data[i, :] = i // 2  # Gradient
pixel_data[100:400, 100:400] = 255  # White box in middle

ds.PixelData = pixel_data.tobytes()
ds.save_as(filename)
print(f"Success! Created {filename}")