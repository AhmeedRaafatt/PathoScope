from django.urls import path
from .views import (
    PatientProfileView,
    AppointmentListCreateView,
    AvailableSlotsView,
    TestOrderListView,
    InvoiceListView,
    PayInvoiceView
)

urlpatterns = [
    path('profile/', PatientProfileView.as_view(), name='patient-profile'),
    path('appointments/', AppointmentListCreateView.as_view(), name='appointments'),
    path('appointments/available-slots/', AvailableSlotsView.as_view(), name='available-slots'),
    path('test-orders/', TestOrderListView.as_view(), name='test-orders'),
    path('invoices/', InvoiceListView.as_view(), name='invoices'),
    path('invoices/<int:invoice_id>/pay/', PayInvoiceView.as_view(), name='pay-invoice'),
]