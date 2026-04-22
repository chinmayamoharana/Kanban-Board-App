from rest_framework import serializers
from .models import Board, BoardMember, List, Task, TaskAttachment, TaskActivity, TaskChecklistItem, TaskComment
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'avatar_url')

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


class TaskCommentSerializer(serializers.ModelSerializer):
    author_detail = UserSerializer(source='author', read_only=True)

    class Meta:
        model = TaskComment
        fields = '__all__'


class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_detail = UserSerializer(source='uploaded_by', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = TaskAttachment
        fields = '__all__'

    def get_file_url(self, obj):
        request = self.context.get('request')
        if not obj.file:
            return None
        url = obj.file.url
        if request:
            return request.build_absolute_uri(url)
        return url


class TaskChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskChecklistItem
        fields = '__all__'


class TaskActivitySerializer(serializers.ModelSerializer):
    actor_detail = UserSerializer(source='actor', read_only=True)

    class Meta:
        model = TaskActivity
        fields = '__all__'


class TaskCommentInputSerializer(serializers.Serializer):
    body = serializers.CharField(max_length=2000, trim_whitespace=True)


class TaskAttachmentInputSerializer(serializers.Serializer):
    file = serializers.FileField()


class TaskChecklistInputSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, trim_whitespace=True)


class TaskChecklistUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False, allow_blank=False, trim_whitespace=True)
    is_done = serializers.BooleanField(required=False)


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
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    checklist_items = TaskChecklistItemSerializer(many=True, read_only=True)
    activity_logs = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    attachment_count = serializers.SerializerMethodField()
    checklist_total = serializers.SerializerMethodField()
    checklist_done = serializers.SerializerMethodField()
    
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

    def get_comment_count(self, obj):
        return getattr(obj, 'comment_count', obj.comments.count())

    def get_attachment_count(self, obj):
        return getattr(obj, 'attachment_count', obj.attachments.count())

    def get_checklist_total(self, obj):
        return getattr(obj, 'checklist_total', obj.checklist_items.count())

    def get_checklist_done(self, obj):
        done = getattr(obj, 'checklist_done', None)
        if done is not None:
            return done
        return obj.checklist_items.filter(is_done=True).count()

    def get_activity_logs(self, obj):
        if not self.context.get('include_activity_logs'):
            return []
        return TaskActivitySerializer(obj.activity_logs.all(), many=True, context=self.context).data

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
