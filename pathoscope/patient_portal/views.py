from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone
from .models import PatientProfile, Appointment, TestOrder, Invoice, TEST_PRICES
from .serializers import PatientProfileSerializer, AppointmentSerializer, TestOrderSerializer, InvoiceSerializer


class PatientProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = PatientProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        profile, created = PatientProfile.objects.get_or_create(user=self.request.user)
        return profile


class AvailableTestsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response(TEST_PRICES)


class AppointmentListCreateView(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Appointment.objects.filter(patient=self.request.user)
    
    def perform_create(self, serializer):
        appointment = serializer.save(patient=self.request.user, status=Appointment.CONFIRMED)
        
        # Create test orders and invoice when appointment is confirmed
        test_type = appointment.test_type
        selected_tests = appointment.selected_tests
        
        total_amount = 0
        invoice_items = []
        
        for test_name in selected_tests:
            price = TEST_PRICES[test_type][test_name]
            
            # Create TestOrder
            TestOrder.objects.create(
                patient=self.request.user,
                appointment=appointment,
                test_type=test_type,
                test_name=test_name,
                price=price
            )
            
            total_amount += price
            invoice_items.append({'test_name': test_name, 'price': float(price)})
        
        # Create Invoice
        Invoice.objects.create(
            patient=self.request.user,
            appointment=appointment,
            amount=total_amount,
            items=invoice_items
        )


class CancelAppointmentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id, patient=request.user)
            
            if appointment.status == Appointment.COMPLETED:
                return Response({'error': 'Cannot cancel completed appointment'}, status=status.HTTP_400_BAD_REQUEST)
            
            appointment.status = Appointment.CANCELLED
            appointment.save()
            
            return Response({'message': 'Appointment cancelled successfully'}, status=status.HTTP_200_OK)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)


class AvailableSlotsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        import datetime
        today = datetime.date.today()
        available_dates = [
            (today + datetime.timedelta(days=i)).strftime('%Y-%m-%d')
            for i in range(1, 15)
        ]
        return Response({'available_dates': available_dates})


class TestOrderListView(generics.ListAPIView):
    serializer_class = TestOrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TestOrder.objects.filter(patient=self.request.user).order_by('-order_date')


class InvoiceListView(generics.ListAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Invoice.objects.filter(patient=self.request.user).order_by('-created_date')


class PayInvoiceView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, invoice_id):
        try:
            invoice = Invoice.objects.get(id=invoice_id, patient=request.user)
            invoice.payment_status = Invoice.PAID
            invoice.paid_date = timezone.now()
            invoice.save()
            return Response({'message': 'Payment successful'}, status=status.HTTP_200_OK)
        except Invoice.DoesNotExist:
            return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)