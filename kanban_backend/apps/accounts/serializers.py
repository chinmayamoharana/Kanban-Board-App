from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

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

    def to_representation(self, instance):
        """
        Return user info + JWT tokens immediately after registration
        """
        refresh = RefreshToken.for_user(instance)
        return {
            'id': instance.id,
            'username': instance.username,
            'email': instance.email,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }

class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'avatar_url', 'avatar')

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get('request')
        url = obj.avatar.url
        version = None
        try:
            modified_time = obj.avatar.storage.get_modified_time(obj.avatar.name)
            version = int(modified_time.timestamp())
        except Exception:
            version = None

        if version:
            url = f'{url}?v={version}'

        if request:
            return request.build_absolute_uri(url)
        return url

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        username = attrs.get('username', instance.username if instance else '').strip()
        email = attrs.get('email', instance.email if instance else '').strip()

        errors = {}

        username_exists = User.objects.filter(username__iexact=username).exclude(pk=getattr(instance, 'pk', None)).exists()
        if username and username_exists:
            errors['username'] = ['This username is already taken.']

        email_exists = User.objects.filter(email__iexact=email).exclude(pk=getattr(instance, 'pk', None)).exists()
        if email and email_exists:
            errors['email'] = ['An account with this email already exists.']

        if errors:
            raise serializers.ValidationError(errors)

        attrs['username'] = username
        attrs['email'] = email
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        validate_password(attrs['new_password'], self.context['request'].user)
        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user
