from rest_framework import serializers
from .models import Sample, TestResult, TestAnalyte, InstrumentQueue, QCLog
from patient_portal.models import TestOrder


class TestAnalyteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestAnalyte
        fields = '__all__'


class SampleSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='test_order.patient.username', read_only=True)
    test_name = serializers.CharField(source='test_order.test_name', read_only=True)
    test_order_id = serializers.IntegerField(source='test_order.id', read_only=True)
    
    class Meta:
        model = Sample
        fields = ['id', 'accession_number', 'barcode', 'status', 'patient_name', 'test_name', 'test_order_id',
                  'accessioned_date', 'processing_started', 'processing_completed']
        read_only_fields = ['accession_number', 'barcode']


class TestResultSerializer(serializers.ModelSerializer):
    analyte_name = serializers.CharField(source='analyte.analyte_name', read_only=True)
    unit = serializers.CharField(source='analyte.unit', read_only=True)
    normal_range_low = serializers.DecimalField(source='analyte.normal_range_low', max_digits=10, decimal_places=2, read_only=True)
    normal_range_high = serializers.DecimalField(source='analyte.normal_range_high', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = TestResult
        fields = ['id', 'analyte', 'analyte_name', 'unit', 'value', 'is_flagged', 'flag_type', 
                  'validated', 'normal_range_low', 'normal_range_high']


class InstrumentQueueSerializer(serializers.ModelSerializer):
    sample_info = SampleSerializer(source='sample', read_only=True)
    
    class Meta:
        model = InstrumentQueue
        fields = ['id', 'sample', 'sample_info', 'status', 'added_date', 'started_date', 'completed_date']


class QCLogSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(source='technician.username', read_only=True)
    
    class Meta:
        model = QCLog
        fields = ['id', 'technician', 'technician_name', 'event_type', 'description', 'timestamp']