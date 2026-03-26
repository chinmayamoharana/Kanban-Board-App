from rest_framework import serializers
from .models import Board, BoardMember, List, Task
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')


class BoardInviteSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    role = serializers.ChoiceField(choices=BoardMember.ROLE_CHOICES, default='member')

    def __init__(self, *args, **kwargs):
        self.board = kwargs.pop('board', None)
        self.request = kwargs.pop('request', None)
        super().__init__(*args, **kwargs)

    def validate_identifier(self, value):
        identifier = value.strip()
        if not identifier:
            raise serializers.ValidationError('Username or email is required.')
        return identifier

    def validate(self, attrs):
        identifier = attrs['identifier']
        user = User.objects.filter(username__iexact=identifier).first()
        if not user:
            user = User.objects.filter(email__iexact=identifier).first()

        if not user:
            raise serializers.ValidationError({'identifier': 'No user found with that username or email.'})

        if self.request and self.request.user == user:
            raise serializers.ValidationError({'identifier': 'You are already a member of this board.'})

        if self.board and BoardMember.objects.filter(board=self.board, user=user).exists():
            raise serializers.ValidationError({'identifier': 'That user is already on this board.'})

        attrs['user'] = user
        return attrs


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_detail = UserSerializer(source='assigned_to', read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'

    def validate(self, attrs):
        task_list = attrs.get('list') or getattr(self.instance, 'list', None)
        assigned_to = attrs.get('assigned_to')

        if task_list and assigned_to:
            is_member = BoardMember.objects.filter(board=task_list.board, user=assigned_to).exists()
            if not is_member:
                raise serializers.ValidationError({'assigned_to': 'Assigned user must be a board member.'})

        return attrs

class ListSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    
    class Meta:
        model = List
        fields = '__all__'

class BoardMemberSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = BoardMember
        fields = '__all__'

class BoardSerializer(serializers.ModelSerializer):
    lists = ListSerializer(many=True, read_only=True)
    members = BoardMemberSerializer(many=True, read_only=True)
    owner_detail = UserSerializer(source='owner', read_only=True)
    current_user_role = serializers.SerializerMethodField()
    
    class Meta:
        model = Board
        fields = '__all__'
        read_only_fields = ('owner',)

    def get_current_user_role(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        membership = obj.members.filter(user=request.user).first()
        return membership.role if membership else None
