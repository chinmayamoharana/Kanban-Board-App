from django.contrib.auth import get_user_model
from django.test import TestCase

from .serializers import UserRegistrationSerializer


User = get_user_model()


class UserRegistrationSerializerTests(TestCase):
    def setUp(self):
        User.objects.create_user(
            username='existinguser',
            email='existing@example.com',
            password='StrongPass123!',
        )

    def test_duplicate_username_and_email_return_friendly_messages(self):
        serializer = UserRegistrationSerializer(
            data={
                'username': 'existinguser',
                'email': 'existing@example.com',
                'password': 'StrongPass123!',
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors['username'][0], 'This username is already taken.')
        self.assertEqual(serializer.errors['email'][0], 'An account with this email already exists.')

    def test_strong_unique_registration_is_valid(self):
        serializer = UserRegistrationSerializer(
            data={
                'username': 'newuser',
                'email': 'newuser@example.com',
                'password': 'StrongPass123!',
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_registration_representation_includes_jwt_tokens(self):
        serializer = UserRegistrationSerializer(
            data={
                'username': 'tokentest',
                'email': 'tokentest@example.com',
                'password': 'StrongPass123!',
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        payload = serializer.data

        self.assertEqual(payload['id'], user.id)
        self.assertEqual(payload['username'], 'tokentest')
        self.assertEqual(payload['email'], 'tokentest@example.com')
        self.assertIn('access', payload)
        self.assertIn('refresh', payload)
