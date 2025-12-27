from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.http import HttpResponse
from patient_portal.models import TestOrder, Appointment, Invoice
from .models import PathologyCase
from .serializers import PathologyCaseSerializer
from .ai_utils import detect_nuclei
from .utils import generate_pathology_report_pdf
from .mri_utils import process_dicom_folder, get_slice_as_png, get_volume_data_for_rendering
import uuid
import zipfile
import threading


# Lab Tech: View scheduled pathology patients
class ScheduledPathologyPatientsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Get all pathology test orders that are pending and don't have cases yet
        scheduled_orders = TestOrder.objects.filter(
            test_type='pathology',
            status=TestOrder.PENDING
        ).exclude(
            pathology_case__isnull=False
        ).select_related('patient', 'appointment').order_by('appointment__date', 'appointment__time')
        
        scheduled_data = []
        for order in scheduled_orders:
            if order.appointment:
                scheduled_data.append({
                    'test_order_id': order.id,
                    'patient_name': order.patient.username,
                    'test_name': order.test_name,
                    'appointment_date': order.appointment.date,
                    'appointment_time': order.appointment.time,
                    'appointment_status': order.appointment.status,
                    'test_type': order.test_type
                })
        
        return Response(scheduled_data, status=status.HTTP_200_OK)


# Lab Tech: Accession sample (check-in)
class AccessionPathologySampleView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        test_order_id = request.data.get('test_order_id')
        
        try:
            test_order = TestOrder.objects.get(id=test_order_id, test_type='pathology')
            
            # Check if already accessioned
            if hasattr(test_order, 'pathology_case'):
                return Response({'error': 'Sample already accessioned'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate unique accession number and barcode
            accession_number = f"PATH-{uuid.uuid4().hex[:8].upper()}"
            barcode = f"BAR-{uuid.uuid4().hex[:12].upper()}"
            
            # Create pathology case
            pathology_case = PathologyCase.objects.create(
                test_order=test_order,
                patient=test_order.patient,
                accession_number=accession_number,
                barcode=barcode,
                status=PathologyCase.SAMPLE_RECEIVED
            )
            
            # Update appointment status to COMPLETED
            if test_order.appointment:
                test_order.appointment.status = Appointment.COMPLETED
                test_order.appointment.save()
            
            serializer = PathologyCaseSerializer(pathology_case)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except TestOrder.DoesNotExist:
            return Response({'error': 'Test order not found'}, status=status.HTTP_404_NOT_FOUND)


# Lab Tech: Upload DICOM file(s) - Supports both single file and folder/multiple files for MRI
class UploadSlideView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Support both new workflow (with case_id) and old workflow (create new case)
        case_id = request.data.get('case_id')
        patient_id = request.data.get('patient')
        
        # Get files - can be single file or multiple
        dicom_files = request.FILES.getlist('dicom_files')  # Multiple files
        dicom_file = request.FILES.get('dicom_file')  # Single file (backward compatibility)
        zip_file = request.FILES.get('zip_file')  # ZIP archive
        
        # Determine upload mode
        is_multi_file = len(dicom_files) > 1 or zip_file
        
        if not dicom_file and not dicom_files and not zip_file:
            return Response({'error': 'dicom_file, dicom_files, or zip_file is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            if case_id:
                case = PathologyCase.objects.get(id=case_id)
            else:
                if not patient_id:
                    return Response({'error': 'patient or case_id is required'}, status=status.HTTP_400_BAD_REQUEST)
                
                accession_number = f"PATH-{uuid.uuid4().hex[:8].upper()}"
                barcode = f"BAR-{uuid.uuid4().hex[:12].upper()}"
                
                case = PathologyCase.objects.create(
                    patient_id=patient_id,
                    accession_number=accession_number,
                    barcode=barcode,
                    status=PathologyCase.SAMPLE_RECEIVED
                )
            
            # Handle ZIP file
            if zip_file:
                dicom_files_data = []
                try:
                    with zipfile.ZipFile(zip_file, 'r') as zf:
                        for name in zf.namelist():
                            if name.lower().endswith('.dcm') or name.lower().endswith('.dicom'):
                                with zf.open(name) as f:
                                    dicom_files_data.append((name, f.read()))
                except zipfile.BadZipFile:
                    return Response({'error': 'Invalid ZIP file'}, status=status.HTTP_400_BAD_REQUEST)
                
                if len(dicom_files_data) > 1:
                    # Process as volume in background
                    def process_async():
                        try:
                            process_dicom_folder(case, dicom_files_data)
                        except Exception as e:
                            print(f"Error processing volume: {e}")
                    
                    thread = threading.Thread(target=process_async)
                    thread.start()
                    
                    case.status = PathologyCase.PROCESSING
                    case.save(update_fields=['status'])
                    
                    serializer = PathologyCaseSerializer(case)
                    return Response({
                        **serializer.data,
                        'message': f'Processing {len(dicom_files_data)} DICOM files into 3D volume...',
                        'is_processing': True
                    }, status=status.HTTP_200_OK)
                elif len(dicom_files_data) == 1:
                    # Single file in ZIP - treat as regular upload
                    from django.core.files.base import ContentFile
                    case.dicom_file.save(dicom_files_data[0][0], ContentFile(dicom_files_data[0][1]), save=True)
                    case.status = PathologyCase.AWAITING_REVIEW
                    case.save()
            
            # Handle multiple files upload
            elif len(dicom_files) > 1:
                dicom_files_data = []
                for f in dicom_files:
                    content = f.read()
                    dicom_files_data.append((f.name, content))
                
                # Process as volume in background
                def process_async():
                    try:
                        process_dicom_folder(case, dicom_files_data)
                    except Exception as e:
                        print(f"Error processing volume: {e}")
                
                thread = threading.Thread(target=process_async)
                thread.start()
                
                case.status = PathologyCase.PROCESSING
                case.save(update_fields=['status'])
                
                serializer = PathologyCaseSerializer(case)
                return Response({
                    **serializer.data,
                    'message': f'Processing {len(dicom_files_data)} DICOM files into 3D volume...',
                    'is_processing': True
                }, status=status.HTTP_200_OK)
            
            # Handle single file upload (backward compatibility)
            else:
                single_file = dicom_file or (dicom_files[0] if dicom_files else None)
                if single_file:
                    case.dicom_file = single_file
                    case.status = PathologyCase.AWAITING_REVIEW
                    case.save()
            
            serializer = PathologyCaseSerializer(case)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except PathologyCase.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Pathologist: View "To-Review" queue
class PathologistQueueView(generics.ListAPIView):
    serializer_class = PathologyCaseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PathologyCase.objects.filter(
            status=PathologyCase.AWAITING_REVIEW
        ).order_by('uploaded_at')


# Pathologist: Get case details for review
class CaseDetailView(generics.RetrieveAPIView):
    queryset = PathologyCase.objects.all()
    serializer_class = PathologyCaseSerializer
    permission_classes = [permissions.IsAuthenticated]


# For Pathologist/Patient: List all cases (Supports Comparison Mode)
class PatientCasesListView(generics.ListAPIView):
    serializer_class = PathologyCaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            return PathologyCase.objects.filter(patient_id=patient_id).order_by('-uploaded_at')
        return PathologyCase.objects.all()


# For Saving Annotations
class SaveAnnotationsView(generics.UpdateAPIView):
    queryset = PathologyCase.objects.all()
    serializer_class = PathologyCaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)


# Pathologist: Update report notes
class UpdateReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            case = PathologyCase.objects.get(pk=pk)
            
            pathologist_notes = request.data.get('pathologist_notes')
            icd_code = request.data.get('icd_code')
            icd_description = request.data.get('icd_description')
            
            if pathologist_notes:
                case.pathologist_notes = pathologist_notes
            if icd_code:
                case.icd_code = icd_code
            if icd_description:
                case.icd_description = icd_description
                
            case.status = PathologyCase.IN_REVIEW
            case.save()
            
            return Response({'message': 'Report updated successfully'}, status=status.HTTP_200_OK)
            
        except PathologyCase.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)


# Pathologist: Finalize report
class FinalizeReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            case = PathologyCase.objects.get(pk=pk)
            
            if case.is_finalized:
                return Response({'error': 'Report already finalized'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate PDF report
            pdf_file = generate_pathology_report_pdf(case, request.user)
            case.report_pdf = pdf_file
            
            # Finalize the case
            case.is_finalized = True
            case.finalized_by = request.user
            case.finalized_date = timezone.now()
            case.status = PathologyCase.REPORT_READY
            case.save()
            
            # Update test order status and URLs for patient portal
            if case.test_order:
                case.test_order.status = TestOrder.REPORT_READY
                # Set the full report URL
                if case.report_pdf:
                    case.test_order.report_url = request.build_absolute_uri(case.report_pdf.url)
                # Set slide URL if DICOM exists (for viewing in patient portal)
                if case.dicom_file:
                    case.test_order.slide_url = f"/patient/pathology/viewer/{case.id}"
                case.test_order.save()
            
            return Response({
                'message': 'Report finalized successfully',
                'report_url': case.report_pdf.url
            }, status=status.HTTP_200_OK)
            
        except PathologyCase.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)


# AI Analysis
class RunAIAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            case = PathologyCase.objects.get(pk=pk)

            if not case.image_preview:
                return Response({"error": "No image available to analyze."}, status=400)

            # Run the AI
            image_path = case.image_preview.path
            ai_annotations, ai_report = detect_nuclei(image_path)

            # Merge with existing annotations
            current_annotations = case.annotations if isinstance(case.annotations, list) else []
            updated_annotations = current_annotations + ai_annotations

            # Save to Database
            case.annotations = updated_annotations

            # Append to Doctor Notes
            if case.doctor_notes:
                case.doctor_notes += f"\n\n--- {ai_report} ---"
            else:
                case.doctor_notes = ai_report

            case.save()

            return Response({
                "message": "AI Analysis Complete",
                "annotations": updated_annotations,
                "report": ai_report
            }, status=200)

        except PathologyCase.DoesNotExist:
            return Response({"error": "Case not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


# ==============================================================================
# MPR (Multiplanar Reconstruction) VIEWS
# ==============================================================================

class MPRVolumeInfoView(APIView):
    """Get volume dimensions and metadata for the MPR viewer"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        try:
            case = PathologyCase.objects.get(pk=pk)
        except PathologyCase.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if not case.is_volume:
            return Response({'error': 'This case is not a 3D volume'}, status=status.HTTP_400_BAD_REQUEST)
        
        if case.status == 'processing':
            return Response({
                'status': 'processing',
                'message': 'Volume is still being processed'
            }, status=status.HTTP_200_OK)
        
        return Response({
            'status': 'ready',
            'is_volume': True,
            'dimensions': {
                'axial': case.volume_depth,
                'sagittal': case.volume_width,
                'coronal': case.volume_height,
            },
            'spacing': {
                'z': case.slice_thickness or 1.0,
                'y': case.pixel_spacing_y or 1.0,
                'x': case.pixel_spacing_x or 1.0,
            },
            'window': {
                'center': case.window_center,
                'width': case.window_width,
            },
            'modality': case.modality,
            'series_description': case.series_description,
            'body_part': case.body_part_examined,
            'num_slices': case.num_slices,
        }, status=status.HTTP_200_OK)


class MPRGetSliceView(APIView):
    """Get a single slice image from the 3D volume for MPR viewing"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        try:
            case = PathologyCase.objects.get(pk=pk)
        except PathologyCase.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if not case.is_volume:
            return Response({'error': 'This case is not a 3D volume'}, status=status.HTTP_400_BAD_REQUEST)
        
        if case.status == 'processing':
            return Response({'error': 'Volume is still being processed'}, status=status.HTTP_400_BAD_REQUEST)
        
        plane = request.query_params.get('plane', 'axial')
        index = int(request.query_params.get('index', 0))
        window_center = request.query_params.get('wc')
        window_width = request.query_params.get('ww')
        
        wc = float(window_center) if window_center else None
        ww = float(window_width) if window_width else None
        
        png_data = get_slice_as_png(case, plane, index, wc, ww)
        if png_data is None:
            return Response({'error': 'Invalid slice index or plane'}, status=status.HTTP_400_BAD_REQUEST)
        
        return HttpResponse(png_data, content_type='image/png')


class MPRVolumeDataView(APIView):
    """Get full volume data for 3D rendering (downsampled)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        try:
            case = PathologyCase.objects.get(pk=pk)
        except PathologyCase.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if not case.is_volume:
            return Response({'error': 'This case is not a 3D volume'}, status=status.HTTP_400_BAD_REQUEST)
        
        if case.status == 'processing':
            return Response({'error': 'Volume is still being processed'}, status=status.HTTP_400_BAD_REQUEST)
        
        downsample = int(request.query_params.get('downsample', 2))
        
        volume_data = get_volume_data_for_rendering(case, downsample)
        if volume_data is None:
            return Response({'error': 'Volume file not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(volume_data, status=status.HTTP_200_OK)