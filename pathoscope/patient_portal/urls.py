from django.urls import path
from .views import (
    PatientProfileView,
    AppointmentListCreateView,
    CancelAppointmentView,
    AvailableSlotsView,
    AvailableTestsView,
    TestOrderListView,
    InvoiceListView,
    PayInvoiceView
)

urlpatterns = [
    path('profile/', PatientProfileView.as_view(), name='patient-profile'),
    path('appointments/', AppointmentListCreateView.as_view(), name='appointments'),
    path('appointments/<int:appointment_id>/cancel/', CancelAppointmentView.as_view(), name='cancel-appointment'),
    path('appointments/available-slots/', AvailableSlotsView.as_view(), name='available-slots'),
    path('available-tests/', AvailableTestsView.as_view(), name='available-tests'),
    path('test-orders/', TestOrderListView.as_view(), name='test-orders'),
    path('invoices/', InvoiceListView.as_view(), name='invoices'),
    path('invoices/<int:invoice_id>/pay/', PayInvoiceView.as_view(), name='pay-invoice'),
]