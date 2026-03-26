from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.exceptions import AuthenticationFailed
from .serializers import UserRegistrationSerializer, UserSerializer
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Registers a new user and returns JWT tokens immediately
    """
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer


class UserDetailView(generics.RetrieveAPIView):
    """
    Returns details of the authenticated user
    """
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class SafeTokenRefreshSerializer(TokenRefreshSerializer):
    """
    Custom refresh serializer that checks if user exists
    """
    def validate(self, attrs):
        try:
            return super().validate(attrs)
        except User.DoesNotExist:
            raise AuthenticationFailed('The account linked to this refresh token no longer exists.')


class SafeTokenRefreshView(TokenRefreshView):
    serializer_class = SafeTokenRefreshSerializer