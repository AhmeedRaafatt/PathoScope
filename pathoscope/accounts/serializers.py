from rest_framework import serializers
from django.contrib.auth import get_user_model
import re  # Import Regex for password checking

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']


class SignUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'role']
        extra_kwargs = {'password': {'write_only': True}}

    # --- Feature 3: Email Validation ---
    def validate_email(self, value):
        # 1. Check if email is blank
        if not value:
            raise serializers.ValidationError("Email is required.")

        # 2. Check specific domain (e.g., must end in @mail.com)
        # You can change '@mail.com' to '@gmail.com' or whatever you prefer
        if not value.endswith("@gmail.com"):
            raise serializers.ValidationError("Email must be a valid address ending with @gmail.com")

        # 3. Check if email is already taken
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")

        return value

    # --- Feature 2: Strong Password Validation ---
    def validate_password(self, value):
        # Rule 1: Minimum Length
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")

        # Rule 2: Must contain a number
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one number.")

        # Rule 3: Must contain an uppercase letter
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")

        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', User.PATIENT)
        )
        return user