from rest_framework import generics, permissions
from .models import PathologyCase
from .serializers import PathologyCaseSerializer

#Ai imports
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import PathologyCase
from .ai_utils import detect_nuclei # Import your new engine

# 1. For Lab Tech: Upload a new Slide
class UploadSlideView(generics.CreateAPIView):
    queryset = PathologyCase.objects.all()
    serializer_class = PathologyCaseSerializer
    # Optional: Add permission so only Staff can upload
    # permission_classes = [permissions.IsAuthenticated]


# 2. For Pathologist/Patient: List all cases (Supports Comparison Mode)
class PatientCasesListView(generics.ListAPIView):
    serializer_class = PathologyCaseSerializer

    def get_queryset(self):
        # Allow filtering by patient_id so we can "Compare" specific patient history
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            return PathologyCase.objects.filter(patient_id=patient_id).order_by('-uploaded_at')
        return PathologyCase.objects.all()


# 3. For Saving Annotations (The "Save" button in your Viewer)
class SaveAnnotationsView(generics.UpdateAPIView):
    queryset = PathologyCase.objects.all()
    serializer_class = PathologyCaseSerializer

    def patch(self, request, *args, **kwargs):
        # This allows the frontend to send just the new "annotations" JSON
        return super().partial_update(request, *args, **kwargs)


class RunAIAnalysisView(APIView):
    def post(self, request, pk):
        try:
            case = PathologyCase.objects.get(pk=pk)

            # Check if we have a preview image to analyze
            if not case.image_preview:
                return Response({"error": "No image available to analyze."}, status=400)

            # Run the AI
            image_path = case.image_preview.path
            ai_annotations, ai_report = detect_nuclei(image_path)

            # Merge with existing annotations (don't delete doctor's work)
            current_annotations = case.annotations if isinstance(case.annotations, list) else []
            updated_annotations = current_annotations + ai_annotations

            # Save to Database
            case.annotations = updated_annotations

            # Append to Doctor Notes
            if case.doctor_notes:
                case.doctor_notes += f"\n\n--- {ai_report} ---"
            else:
                case.doctor_notes = ai_report

            case.save()

            return Response({
                "message": "AI Analysis Complete",
                "annotations": updated_annotations,
                "report": ai_report
            }, status=200)

        except PathologyCase.DoesNotExist:
            return Response({"error": "Case not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)