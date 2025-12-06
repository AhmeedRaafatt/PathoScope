from rest_framework import serializers
from .models import PatientProfile, Appointment, TestOrder, Invoice


class PatientProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = PatientProfile
        fields = ['id', 'username', 'email', 'phone', 'address', 'chronic_diseases', 'date_of_birth']


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'date', 'time', 'reason', 'status', 'notes']
        read_only_fields = ['patient', 'status'] # Ensure patient can't fake status

    def validate(self, data):
        """
        Check if the appointment slot is already taken.
        """
        appointment_date = data.get('date')
        appointment_time = data.get('time')

        # Check if ANY appointment exists at this exact date and time
        # We exclude 'cancelled' appointments because those slots are free again
        if Appointment.objects.filter(
            date=appointment_date, 
            time=appointment_time
        ).exclude(status='cancelled').exists():
            raise serializers.ValidationError("This time slot is already booked. Please choose another time.")

        return data


class TestOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestOrder
        fields = ['id', 'test_type', 'test_name', 'order_date', 'status', 'report_url', 'slide_url']


class InvoiceSerializer(serializers.ModelSerializer):
    test_name = serializers.CharField(source='test_order.test_name', read_only=True)
    
    class Meta:
        model = Invoice
        fields = ['id', 'test_name', 'amount', 'payment_status', 'created_date', 'paid_date']