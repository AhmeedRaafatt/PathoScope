import cv2
import numpy as np
import os
from django.conf import settings


def detect_nuclei(image_path):
    """
    Uses Computer Vision to find dark cell nuclei in the biopsy.
    Returns a list of annotations (boxes) and a text summary.
    """
    # 1. Load the image using OpenCV
    img = cv2.imread(image_path)
    if img is None:
        return [], "Error: Could not read image."

    # 2. Convert to Grayscale (simplifies the image)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 3. Thresholding (The "Magic" Step)
    # This separates dark spots (nuclei) from the light background
    # We use Otsu's binarization for automatic threshold detection
    # Invert first because nuclei are dark
    gray_inv = cv2.bitwise_not(gray)
    thresh_val, binary = cv2.threshold(gray_inv, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # 4. Find Contours (The shapes of the blobs)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # 5. Filter & Format Results
    annotations = []
    cell_count = 0

    for cnt in contours:
        area = cv2.contourArea(cnt)

        # Filter: Ignore tiny noise dots and huge artifacts
        if 50 < area < 5000:
            x, y, w, h = cv2.boundingRect(cnt)

            # Create a Box Annotation
            annotations.append({
                "type": "rect",
                "x": int(x),
                "y": int(y),
                "w": int(w),
                "h": int(h),
                "color": "#00FF00",  # Green boxes for cells
                "label": "Cell"
            })
            cell_count += 1

            # Limit to 100 boxes max to avoid crashing the browser with too much drawing
            if cell_count >= 100:
                break

    # 6. Generate a simple Report
    if cell_count > 50:
        severity = "High Density - Possible Inflammation or Tumor"
    elif cell_count > 20:
        severity = "Moderate Cellular Density"
    else:
        severity = "Low Cellular Density (Normal)"

    summary = f"AI Analysis Result:\n- Detected {len(contours)} potential cells.\n- Analyzed regions of interest.\n- Classification: {severity}"

    return annotations, summary