from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')
        extra_kwargs = {
            'username': {'validators': []},
            'email': {'validators': []},
        }

    def validate(self, attrs):
        errors = {}

        username = attrs.get('username', '').strip()
        email = attrs.get('email', '').strip()

        if User.objects.filter(username__iexact=username).exists():
            errors['username'] = ['This username is already taken.']

        if User.objects.filter(email__iexact=email).exists():
            errors['email'] = ['An account with this email already exists.']

        if errors:
            raise serializers.ValidationError(errors)

        attrs['username'] = username
        attrs['email'] = email
        return attrs

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')
