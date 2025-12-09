from django.shortcuts import render

# Create your views here.
from rest_framework import generics, status
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from .serializers import SignUpSerializer


# 1. Sign Up Logic
class SignUpView(generics.CreateAPIView):
    serializer_class = SignUpSerializer


# ... keep your imports at the top ...



class LoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        # This function checks the database automatically
        user = authenticate(username=username, password=password)

        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "role": user.role,
                "username": user.username
            }, status=status.HTTP_200_OK)
        else:
            # --- Feature 1: Send Error to Frontend ---
            # We return a 401 (Unauthorized) status with a clear message
            return Response(
                {"error": "Invalid Username or Password. Please try again."},
                status=status.HTTP_401_UNAUTHORIZED
            )