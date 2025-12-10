from django.urls import path
from .views import (
    AccessionSampleView,
    DashboardView,
    ScheduledPatientsView,
    AddToQueueView,
    QueueListView,
    CompleteProcessingView,
    EnterResultsView,
    SampleResultsView,
    TestAnalytesView,
    ValidateResultsView,
    QCLogView
)

urlpatterns = [
    path('accession/', AccessionSampleView.as_view(), name='accession-sample'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('scheduled-patients/', ScheduledPatientsView.as_view(), name='scheduled-patients'),
    path('queue/add/', AddToQueueView.as_view(), name='add-to-queue'),
    path('queue/', QueueListView.as_view(), name='queue-list'),
    path('samples/<int:sample_id>/complete/', CompleteProcessingView.as_view(), name='complete-processing'),
    path('samples/<int:sample_id>/results/enter/', EnterResultsView.as_view(), name='enter-results'),
    path('samples/<int:sample_id>/results/', SampleResultsView.as_view(), name='sample-results'),
    path('samples/<int:sample_id>/validate/', ValidateResultsView.as_view(), name='validate-results'),
    path('analytes/', TestAnalytesView.as_view(), name='test-analytes'),
    path('qc-log/', QCLogView.as_view(), name='qc-log'),
]