from django.urls import path
from .views import PasswordChangeView, RegisterView, UserDetailView, SafeTokenRefreshView
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', SafeTokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='user_detail'),
    path('change-password/', PasswordChangeView.as_view(), name='change_password'),
]
