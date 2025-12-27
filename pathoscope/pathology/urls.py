from django.urls import path
from .views import (
    ScheduledPathologyPatientsView,
    AccessionPathologySampleView,
    UploadSlideView,
    PathologistQueueView,
    CaseDetailView,
    PatientCasesListView,
    SaveAnnotationsView,
    UpdateReportView,
    FinalizeReportView,
    RunAIAnalysisView,
    MPRVolumeInfoView,
    MPRGetSliceView,
    MPRVolumeDataView,
)

urlpatterns = [
    # Lab Tech URLs
    path('scheduled-patients/', ScheduledPathologyPatientsView.as_view(), name='scheduled-pathology-patients'),
    path('accession/', AccessionPathologySampleView.as_view(), name='accession-pathology-sample'),
    path('upload/', UploadSlideView.as_view(), name='upload-slide'),
    
    # Pathologist URLs
    path('queue/', PathologistQueueView.as_view(), name='pathologist-queue'),
    path('case/<int:pk>/', CaseDetailView.as_view(), name='case-detail'),
    path('case/<int:pk>/update-report/', UpdateReportView.as_view(), name='update-report'),
    path('case/<int:pk>/finalize/', FinalizeReportView.as_view(), name='finalize-report'),
    
    # Common URLs
    path('list/', PatientCasesListView.as_view(), name='list-cases'),
    path('case/<int:pk>/save-annotations/', SaveAnnotationsView.as_view(), name='save-annotations'),
    path('case/<int:pk>/save/', SaveAnnotationsView.as_view(), name='save-annotations-alt'),
    path('case/<int:pk>/ai-analyze/', RunAIAnalysisView.as_view(), name='ai-analyze'),
    
    # MPR (Multiplanar Reconstruction) URLs
    path('case/<int:pk>/mpr/info/', MPRVolumeInfoView.as_view(), name='mpr-volume-info'),
    path('case/<int:pk>/mpr/slice/', MPRGetSliceView.as_view(), name='mpr-get-slice'),
    path('case/<int:pk>/mpr/volume-data/', MPRVolumeDataView.as_view(), name='mpr-volume-data'),
]