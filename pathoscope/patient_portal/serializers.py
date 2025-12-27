from rest_framework import serializers
from .models import PatientProfile, Appointment, TestOrder, Invoice, TEST_PRICES


class PatientProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = PatientProfile
        fields = ['id', 'username', 'email', 'phone', 'address', 'chronic_diseases', 'date_of_birth']


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'date', 'time', 'test_type', 'selected_tests', 'status', 'notes']
        read_only_fields = ['patient', 'status']

    def validate(self, data):
        """
        Check if the appointment slot is already taken.
        """
        appointment_date = data.get('date')
        appointment_time = data.get('time')

        if Appointment.objects.filter(
            date=appointment_date, 
            time=appointment_time
        ).exclude(status='cancelled').exists():
            raise serializers.ValidationError("This time slot is already booked. Please choose another time.")

        # Validate selected tests
        test_type = data.get('test_type')
        selected_tests = data.get('selected_tests', [])
        
        if not selected_tests:
            raise serializers.ValidationError("Please select at least one test.")
        
        # Validate that selected tests exist in TEST_PRICES
        available_tests = TEST_PRICES.get(test_type, {}).keys()
        for test in selected_tests:
            if test not in available_tests:
                raise serializers.ValidationError(f"Invalid test: {test}")

        return data


class TestOrderSerializer(serializers.ModelSerializer):
    # Include pathology case details for finalized reports
    pathology_case_id = serializers.SerializerMethodField()
    icd_code = serializers.SerializerMethodField()
    icd_description = serializers.SerializerMethodField()
    accession_number = serializers.SerializerMethodField()
    pathologist_name = serializers.SerializerMethodField()
    finalized_date = serializers.SerializerMethodField()
    image_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = TestOrder
        fields = ['id', 'test_type', 'test_name', 'order_date', 'status', 'report_url', 'slide_url', 'price',
                  'pathology_case_id', 'icd_code', 'icd_description', 'accession_number', 
                  'pathologist_name', 'finalized_date', 'image_preview']
    
    def get_pathology_case_id(self, obj):
        if obj.test_type == 'pathology' and hasattr(obj, 'pathology_case'):
            return obj.pathology_case.id
        return None
    
    def get_icd_code(self, obj):
        if obj.test_type == 'pathology' and hasattr(obj, 'pathology_case') and obj.pathology_case.is_finalized:
            return obj.pathology_case.icd_code
        return None
    
    def get_icd_description(self, obj):
        if obj.test_type == 'pathology' and hasattr(obj, 'pathology_case') and obj.pathology_case.is_finalized:
            return obj.pathology_case.icd_description
        return None
    
    def get_accession_number(self, obj):
        if obj.test_type == 'pathology' and hasattr(obj, 'pathology_case'):
            return obj.pathology_case.accession_number
        return None
    
    def get_pathologist_name(self, obj):
        if obj.test_type == 'pathology' and hasattr(obj, 'pathology_case') and obj.pathology_case.finalized_by:
            return obj.pathology_case.finalized_by.username
        return None
    
    def get_finalized_date(self, obj):
        if obj.test_type == 'pathology' and hasattr(obj, 'pathology_case') and obj.pathology_case.finalized_date:
            return obj.pathology_case.finalized_date.isoformat()
        return None
    
    def get_image_preview(self, obj):
        if obj.test_type == 'pathology' and hasattr(obj, 'pathology_case') and obj.pathology_case.image_preview:
            return obj.pathology_case.image_preview.url
        return None


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['id', 'amount', 'payment_status', 'created_date', 'paid_date', 'items']