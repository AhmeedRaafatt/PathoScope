from django.shortcuts import render

# Create your views here.
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from .serializers import SignUpSerializer


# 1. Sign Up Logic
class SignUpView(generics.CreateAPIView):
    serializer_class = SignUpSerializer


# 2. Sign In Logic
class LoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        # Verify credentials
        user = authenticate(username=username, password=password)

        if user is not None:
            # Create or get the token for React to use
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "role": user.role,
                "username": user.username
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Wrong Credentials"}, status=status.HTTP_400_BAD_REQUEST)
