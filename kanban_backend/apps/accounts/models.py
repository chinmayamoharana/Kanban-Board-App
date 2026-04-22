from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)
    avatar = models.FileField(upload_to='avatars/', blank=True, null=True)
    
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username
