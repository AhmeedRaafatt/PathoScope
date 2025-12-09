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
    class Meta:
        model = TestOrder
        fields = ['id', 'test_type', 'test_name', 'order_date', 'status', 'report_url', 'slide_url', 'price']


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['id', 'amount', 'payment_status', 'created_date', 'paid_date', 'items']