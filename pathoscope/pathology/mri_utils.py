"""
MRI/CT Volume Processing Utilities for MPR and Volume Rendering
"""
import os
import numpy as np
import pydicom
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile


def process_dicom_folder(case, dicom_files_data):
    """
    Process multiple DICOM files into a 3D volume for MPR viewing.
    
    Args:
        case: PathologyCase instance
        dicom_files_data: List of tuples (filename, file_content_bytes)
    
    Returns:
        True if successful, raises exception otherwise
    """
    try:
        case.status = 'processing'
        case.save(update_fields=['status'])
        
        # Parse all DICOM files and extract pixel data with position info
        slice_data = []
        
        for filename, content in dicom_files_data:
            try:
                ds = pydicom.dcmread(BytesIO(content))
                
                if not hasattr(ds, 'pixel_array'):
                    continue
                
                # Get position for sorting
                position = 0
                if hasattr(ds, 'SliceLocation'):
                    position = float(ds.SliceLocation)
                elif hasattr(ds, 'ImagePositionPatient'):
                    position = float(ds.ImagePositionPatient[2])
                elif hasattr(ds, 'InstanceNumber'):
                    position = float(ds.InstanceNumber)
                
                # Get pixel data
                pixel_array = ds.pixel_array.astype(np.float32)
                
                # Apply rescale slope/intercept if present (for CT)
                if hasattr(ds, 'RescaleSlope') and hasattr(ds, 'RescaleIntercept'):
                    pixel_array = pixel_array * ds.RescaleSlope + ds.RescaleIntercept
                
                slice_data.append({
                    'position': position,
                    'pixels': pixel_array,
                    'ds': ds
                })
            except Exception as e:
                print(f"Error reading {filename}: {e}")
                continue
        
        if len(slice_data) < 2:
            raise ValueError(f"Not enough valid DICOM slices. Found {len(slice_data)}, need at least 2.")
        
        # Sort by position
        slice_data.sort(key=lambda x: x['position'])
        
        # Stack into 3D volume (z, y, x) = (slices, rows, columns)
        volume = np.stack([s['pixels'] for s in slice_data], axis=0)
        
        # Extract metadata from first slice
        first_ds = slice_data[0]['ds']
        
        case.is_volume = True
        case.num_slices = volume.shape[0]
        case.volume_depth = volume.shape[0]
        case.volume_height = volume.shape[1]
        case.volume_width = volume.shape[2]
        
        if hasattr(first_ds, 'SliceThickness'):
            case.slice_thickness = float(first_ds.SliceThickness)
        
        if hasattr(first_ds, 'PixelSpacing'):
            case.pixel_spacing_y = float(first_ds.PixelSpacing[0])
            case.pixel_spacing_x = float(first_ds.PixelSpacing[1])
        
        if hasattr(first_ds, 'Modality'):
            case.modality = first_ds.Modality
        
        if hasattr(first_ds, 'SeriesDescription'):
            case.series_description = str(first_ds.SeriesDescription)
        
        if hasattr(first_ds, 'BodyPartExamined'):
            case.body_part_examined = str(first_ds.BodyPartExamined)
        
        # Calculate window/level
        if hasattr(first_ds, 'WindowCenter') and hasattr(first_ds, 'WindowWidth'):
            wc = first_ds.WindowCenter
            ww = first_ds.WindowWidth
            case.window_center = float(wc[0] if isinstance(wc, (list, pydicom.multival.MultiValue)) else wc)
            case.window_width = float(ww[0] if isinstance(ww, (list, pydicom.multival.MultiValue)) else ww)
        else:
            # Auto-calculate from data
            case.window_center = float(np.mean(volume))
            case.window_width = float(np.std(volume) * 4)
        
        # Save volume to compressed numpy file
        volume_dir = os.path.join('media', 'dicom_volumes')
        os.makedirs(volume_dir, exist_ok=True)
        volume_path = f'dicom_volumes/volume_{case.id}.npy'
        full_path = os.path.join('media', volume_path)
        np.save(full_path, volume)
        case.volume_file = volume_path
        
        # Generate preview images for all three planes
        generate_mpr_previews(case, volume)
        
        # Extract study date
        if hasattr(first_ds, 'StudyDate'):
            try:
                from datetime import datetime
                case.study_date = datetime.strptime(first_ds.StudyDate, '%Y%m%d').date()
            except:
                pass
        
        case.status = 'awaiting_review'
        case.save()
        
        return True
        
    except Exception as e:
        case.status = 'sample_received'  # Reset status on error
        case.save(update_fields=['status'])
        raise e


def generate_mpr_previews(case, volume):
    """Generate preview images for axial, sagittal, and coronal views"""
    
    def normalize_to_uint8(arr, wc=None, ww=None):
        """Normalize array to 0-255 range with optional windowing"""
        arr = arr.astype(np.float32)
        
        if wc is not None and ww is not None:
            min_val = wc - ww / 2
            max_val = wc + ww / 2
            arr = np.clip(arr, min_val, max_val)
            if max_val > min_val:
                arr = (arr - min_val) / (max_val - min_val) * 255
        else:
            if arr.max() > arr.min():
                arr = (arr - arr.min()) / (arr.max() - arr.min()) * 255
        
        return arr.astype(np.uint8)
    
    wc = case.window_center
    ww = case.window_width
    
    # Axial preview (middle slice) - this becomes image_preview
    axial_idx = volume.shape[0] // 2
    axial_slice = normalize_to_uint8(volume[axial_idx, :, :], wc, ww)
    axial_img = Image.fromarray(axial_slice)
    buffer = BytesIO()
    axial_img.save(buffer, format='PNG')
    case.image_preview.save(f'axial_{case.id}.png', ContentFile(buffer.getvalue()), save=False)
    
    # Sagittal preview (middle slice)
    sagittal_idx = volume.shape[2] // 2
    sagittal_slice = normalize_to_uint8(volume[:, :, sagittal_idx], wc, ww)
    sagittal_slice = np.flipud(sagittal_slice)  # Correct orientation
    sagittal_img = Image.fromarray(sagittal_slice)
    buffer = BytesIO()
    sagittal_img.save(buffer, format='PNG')
    case.sagittal_preview.save(f'sagittal_{case.id}.png', ContentFile(buffer.getvalue()), save=False)
    
    # Coronal preview (middle slice)
    coronal_idx = volume.shape[1] // 2
    coronal_slice = normalize_to_uint8(volume[:, coronal_idx, :], wc, ww)
    coronal_slice = np.flipud(coronal_slice)  # Correct orientation
    coronal_img = Image.fromarray(coronal_slice)
    buffer = BytesIO()
    coronal_img.save(buffer, format='PNG')
    case.coronal_preview.save(f'coronal_{case.id}.png', ContentFile(buffer.getvalue()), save=False)


def get_slice_as_png(case, plane, index, window_center=None, window_width=None):
    """
    Extract a single slice from the volume and return as PNG bytes.
    
    Args:
        case: PathologyCase instance
        plane: 'axial', 'sagittal', or 'coronal'
        index: slice index
        window_center: window center for display (optional)
        window_width: window width for display (optional)
    
    Returns:
        PNG image bytes or None
    """
    volume = case.get_volume_array()
    if volume is None:
        return None
    
    wc = window_center if window_center is not None else case.window_center
    ww = window_width if window_width is not None else case.window_width
    
    if plane == 'axial':
        if 0 <= index < volume.shape[0]:
            slice_data = volume[index, :, :]
        else:
            return None
    elif plane == 'sagittal':
        if 0 <= index < volume.shape[2]:
            slice_data = volume[:, :, index]
            slice_data = np.flipud(slice_data)
        else:
            return None
    elif plane == 'coronal':
        if 0 <= index < volume.shape[1]:
            slice_data = volume[:, index, :]
            slice_data = np.flipud(slice_data)
        else:
            return None
    else:
        return None
    
    # Apply windowing
    slice_data = slice_data.astype(np.float32)
    if wc is not None and ww is not None:
        min_val = wc - ww / 2
        max_val = wc + ww / 2
        slice_data = np.clip(slice_data, min_val, max_val)
        if max_val > min_val:
            slice_data = ((slice_data - min_val) / (max_val - min_val) * 255).astype(np.uint8)
        else:
            slice_data = np.zeros_like(slice_data, dtype=np.uint8)
    else:
        if slice_data.max() > slice_data.min():
            slice_data = ((slice_data - slice_data.min()) / (slice_data.max() - slice_data.min()) * 255).astype(np.uint8)
        else:
            slice_data = np.zeros_like(slice_data, dtype=np.uint8)
    
    # Convert to image
    img = Image.fromarray(slice_data)
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()


def get_volume_data_for_rendering(case, downsample=2):
    """
    Get volume data optimized for 3D rendering.
    
    Args:
        case: PathologyCase instance
        downsample: factor to reduce resolution (2 = half resolution)
    
    Returns:
        dict with volume data and metadata or None
    """
    volume = case.get_volume_array()
    if volume is None:
        return None
    
    # Downsample for web transfer
    if downsample > 1:
        volume = volume[::downsample, ::downsample, ::downsample]
    
    # Normalize to 0-255
    wc = case.window_center
    ww = case.window_width
    
    if wc is not None and ww is not None:
        min_val = wc - ww / 2
        max_val = wc + ww / 2
        volume = np.clip(volume, min_val, max_val)
        if max_val > min_val:
            volume = ((volume - min_val) / (max_val - min_val) * 255).astype(np.uint8)
        else:
            volume = np.zeros_like(volume, dtype=np.uint8)
    else:
        if volume.max() > volume.min():
            volume = ((volume - volume.min()) / (volume.max() - volume.min()) * 255).astype(np.uint8)
        else:
            volume = np.zeros_like(volume, dtype=np.uint8)
    
    return {
        'data': volume.flatten().tolist(),
        'dimensions': list(volume.shape),  # [z, y, x]
        'spacing': [
            case.slice_thickness or 1.0,
            case.pixel_spacing_y or 1.0,
            case.pixel_spacing_x or 1.0
        ]
    }
