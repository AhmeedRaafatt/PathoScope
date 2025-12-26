from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from patient_portal.models import TestOrder, Appointment, Invoice
from .models import PathologyCase
from .serializers import PathologyCaseSerializer
from .ai_utils import detect_nuclei
from .utils import generate_pathology_report_pdf
import uuid


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


# Lab Tech: Upload DICOM file (Backward compatible)
class UploadSlideView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Support both new workflow (with case_id) and old workflow (create new case)
        case_id = request.data.get('case_id')
        patient_id = request.data.get('patient')
        dicom_file = request.FILES.get('dicom_file')
        
        if not dicom_file:
            return Response({'error': 'dicom_file is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            if case_id:
                # New workflow: Update existing case
                case = PathologyCase.objects.get(id=case_id)
                case.dicom_file = dicom_file
                case.status = PathologyCase.AWAITING_REVIEW
                case.save()
            else:
                # Old workflow: Create new case (for backward compatibility)
                if not patient_id:
                    return Response({'error': 'patient or case_id is required'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Generate accession number for old workflow
                accession_number = f"PATH-{uuid.uuid4().hex[:8].upper()}"
                barcode = f"BAR-{uuid.uuid4().hex[:12].upper()}"
                
                case = PathologyCase.objects.create(
                    patient_id=patient_id,
                    dicom_file=dicom_file,
                    accession_number=accession_number,
                    barcode=barcode,
                    status=PathologyCase.AWAITING_REVIEW
                )
            
            serializer = PathologyCaseSerializer(case)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except PathologyCase.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)


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
            
            # Update test order status
            if case.test_order:
                case.test_order.status = TestOrder.REPORT_READY
                case.test_order.report_url = case.report_pdf.url
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