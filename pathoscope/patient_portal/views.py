from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone
from .models import PatientProfile, Appointment, TestOrder, Invoice
from .serializers import PatientProfileSerializer, AppointmentSerializer, TestOrderSerializer, InvoiceSerializer


class PatientProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = PatientProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        profile, created = PatientProfile.objects.get_or_create(user=self.request.user)
        return profile


class AppointmentListCreateView(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Appointment.objects.filter(patient=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)


class AvailableSlotsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Placeholder: Return sample available dates
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