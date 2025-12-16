from django.urls import path
from .views import UploadSlideView, PatientCasesListView, SaveAnnotationsView , RunAIAnalysisView

urlpatterns = [
    path('upload/', UploadSlideView.as_view(), name='upload-slide'),
    path('list/', PatientCasesListView.as_view(), name='list-cases'),
    path('case/<int:pk>/save-annotations/', SaveAnnotationsView.as_view(), name='save-annotations'),
# --- ENSURE THIS LINE EXISTS FOR SAVING ---
    path('case/<int:pk>/save/', SaveAnnotationsView.as_view(), name='save-annotations'),
# --- NEW AI URL ---
    path('case/<int:pk>/ai-analyze/', RunAIAnalysisView.as_view(), name='ai-analyze'),
]