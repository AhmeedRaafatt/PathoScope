from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q
from .models import Sample, TestResult, TestAnalyte, InstrumentQueue, QCLog
from .serializers import (SampleSerializer, TestResultSerializer, TestAnalyteSerializer, 
                          InstrumentQueueSerializer, QCLogSerializer)
from patient_portal.models import TestOrder, Appointment
import uuid


# Sample Accessioning - Check-in patients
class AccessionSampleView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        test_order_id = request.data.get('test_order_id')
        
        try:
            test_order = TestOrder.objects.get(id=test_order_id, test_type='hematology')
            
            # Check if already accessioned
            if hasattr(test_order, 'sample'):
                return Response({'error': 'Sample already accessioned'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate unique accession number and barcode
            accession_number = f"HEM-{uuid.uuid4().hex[:8].upper()}"
            barcode = f"BAR-{uuid.uuid4().hex[:12].upper()}"
            
            # Create sample
            sample = Sample.objects.create(
                test_order=test_order,
                accession_number=accession_number,
                barcode=barcode,
                status=Sample.RECEIVED
            )
            
            # Update appointment status to COMPLETED
            if test_order.appointment:
                test_order.appointment.status = Appointment.COMPLETED
                test_order.appointment.save()
            
            serializer = SampleSerializer(sample)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except TestOrder.DoesNotExist:
            return Response({'error': 'Test order not found'}, status=status.HTTP_404_NOT_FOUND)


# Real-time tracking dashboard
class DashboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        samples = Sample.objects.select_related('test_order__patient').all().order_by('-accessioned_date')
        serializer = SampleSerializer(samples, many=True)
        return Response(serializer.data)

# View scheduled patients (confirmed appointments not yet accessioned)
class ScheduledPatientsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get all hematology test orders that are pending and don't have samples yet
        scheduled_orders = TestOrder.objects.filter(
            test_type='hematology',
            status=TestOrder.PENDING
        ).exclude(
            sample__isnull=False  # Exclude orders that already have samples
        ).select_related('patient', 'appointment').order_by('appointment__date', 'appointment__time')
        
        # Build response data
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

# Add sample to instrument queue
class AddToQueueView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        sample_id = request.data.get('sample_id')
        
        try:
            sample = Sample.objects.get(id=sample_id)
            
            # Check processing slots (max 5)
            processing_count = InstrumentQueue.objects.filter(status=InstrumentQueue.PROCESSING).count()
            
            if processing_count >= 5:
                # Add to waiting queue
                queue_entry = InstrumentQueue.objects.create(sample=sample, status=InstrumentQueue.WAITING)
                return Response({'message': 'Added to waiting queue', 'position': 'waiting'}, status=status.HTTP_200_OK)
            else:
                # Start processing immediately
                queue_entry = InstrumentQueue.objects.create(
                    sample=sample, 
                    status=InstrumentQueue.PROCESSING,
                    started_date=timezone.now()
                )
                sample.status = Sample.IN_ANALYSIS
                sample.processing_started = timezone.now()
                sample.save()
                
                return Response({'message': 'Processing started', 'position': 'processing'}, status=status.HTTP_200_OK)
                
        except Sample.DoesNotExist:
            return Response({'error': 'Sample not found'}, status=status.HTTP_404_NOT_FOUND)


# View instrument queue
class QueueListView(generics.ListAPIView):
    serializer_class = InstrumentQueueSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return InstrumentQueue.objects.filter(
            Q(status=InstrumentQueue.PROCESSING) | Q(status=InstrumentQueue.WAITING)
        ).order_by('added_date')


# Complete processing simulation
class CompleteProcessingView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, sample_id):
        try:
            sample = Sample.objects.get(id=sample_id)
            queue_entry = InstrumentQueue.objects.get(sample=sample, status=InstrumentQueue.PROCESSING)
            
            # Mark as completed
            queue_entry.status = InstrumentQueue.COMPLETED
            queue_entry.completed_date = timezone.now()
            queue_entry.save()
            
            sample.status = Sample.AWAITING_VALIDATION
            sample.processing_completed = timezone.now()
            sample.save()
            
            # Check if any waiting samples can start
            waiting = InstrumentQueue.objects.filter(status=InstrumentQueue.WAITING).order_by('added_date').first()
            if waiting:
                waiting.status = InstrumentQueue.PROCESSING
                waiting.started_date = timezone.now()
                waiting.save()
                
                waiting.sample.status = Sample.IN_ANALYSIS
                waiting.sample.processing_started = timezone.now()
                waiting.sample.save()
            
            return Response({'message': 'Processing completed'}, status=status.HTTP_200_OK)
            
        except (Sample.DoesNotExist, InstrumentQueue.DoesNotExist):
            return Response({'error': 'Sample or queue entry not found'}, status=status.HTTP_404_NOT_FOUND)


# Enter test results with auto-flagging
class EnterResultsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, sample_id):
        try:
            sample = Sample.objects.get(id=sample_id)
            results_data = request.data.get('results', [])
            
            for result_item in results_data:
                analyte_id = result_item.get('analyte_id')
                value = result_item.get('value')
                
                analyte = TestAnalyte.objects.get(id=analyte_id)
                
                # Auto-flagging logic
                is_flagged = False
                flag_type = ""
                
                if value > analyte.normal_range_high:
                    is_flagged = True
                    flag_type = "HIGH"
                elif value < analyte.normal_range_low:
                    is_flagged = True
                    flag_type = "LOW"
                
                # Create or update result
                TestResult.objects.update_or_create(
                    sample=sample,
                    analyte=analyte,
                    defaults={
                        'value': value,
                        'is_flagged': is_flagged,
                        'flag_type': flag_type
                    }
                )
            
            return Response({'message': 'Results entered successfully'}, status=status.HTTP_200_OK)
            
        except Sample.DoesNotExist:
            return Response({'error': 'Sample not found'}, status=status.HTTP_404_NOT_FOUND)
        except TestAnalyte.DoesNotExist:
            return Response({'error': 'Test analyte not found'}, status=status.HTTP_404_NOT_FOUND)


# View results for a sample
class SampleResultsView(generics.ListAPIView):
    serializer_class = TestResultSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        sample_id = self.kwargs.get('sample_id')
        return TestResult.objects.filter(sample_id=sample_id)


# Get available analytes for a test
class TestAnalytesView(generics.ListAPIView):
    serializer_class = TestAnalyteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        test_name = self.request.query_params.get('test_name')
        if test_name:
            return TestAnalyte.objects.filter(test_name=test_name)
        return TestAnalyte.objects.all()


# Validate/Approve results
class ValidateResultsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, sample_id):
        try:
            sample = Sample.objects.get(id=sample_id)
            results = TestResult.objects.filter(sample=sample)
            
            # Mark all results as validated
            results.update(
                validated=True,
                validated_by=request.user,
                validated_date=timezone.now()
            )
            
            # Update sample and test order status
            sample.status = Sample.REPORT_READY
            sample.save()
            
            sample.test_order.status = TestOrder.REPORT_READY
            sample.test_order.save()
            
            return Response({'message': 'Results validated successfully'}, status=status.HTTP_200_OK)
            
        except Sample.DoesNotExist:
            return Response({'error': 'Sample not found'}, status=status.HTTP_404_NOT_FOUND)


# QC logging
class QCLogView(generics.ListCreateAPIView):
    serializer_class = QCLogSerializer
    permission_classes = [IsAuthenticated]
    queryset = QCLog.objects.all().order_by('-timestamp')
    
    def perform_create(self, serializer):
        serializer.save(technician=self.request.user)