from django.db.models import Prefetch, Max
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from .models import Board, BoardMember, List, Task, TaskActivity, TaskAttachment, TaskChecklistItem, TaskComment
from .serializers import (
    BoardInviteSerializer,
    BoardMemberSerializer,
    BoardSerializer,
    ListSerializer,
    TaskActivitySerializer,
    TaskAttachmentInputSerializer,
    TaskAttachmentSerializer,
    TaskChecklistInputSerializer,
    TaskChecklistItemSerializer,
    TaskChecklistUpdateSerializer,
    TaskCommentInputSerializer,
    TaskCommentSerializer,
    TaskSerializer,
)
from .services import BoardService
from apps.core.events import broadcast_board_event


class BoardAccessMixin:
    def get_board_membership(self, board=None):
        if board is None:
            board = self.get_board()
        return BoardMember.objects.filter(board=board, user=self.request.user).first()

    def require_board_member(self, board=None):
        membership = self.get_board_membership(board)
        if not membership:
            raise PermissionDenied('You do not have access to this board.')
        return membership

    def require_board_admin(self, board=None):
        membership = self.require_board_member(board)
        if membership.role != 'admin':
            raise PermissionDenied('Only board admins can perform this action.')
        return membership


class BoardViewSet(BoardAccessMixin, viewsets.ModelViewSet):
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        task_queryset = Task.objects.select_related('assigned_to').prefetch_related(
            'comments__author',
            'attachments__uploaded_by',
            'checklist_items',
        )
        list_queryset = List.objects.order_by('position').prefetch_related(
            Prefetch('tasks', queryset=task_queryset),
        )
        member_queryset = BoardMember.objects.select_related('user').order_by('role', 'user__username')
        return (
            Board.objects.filter(members__user=self.request.user)
            .distinct()
            .select_related('owner')
            .prefetch_related(
                Prefetch('lists', queryset=list_queryset),
                Prefetch('members', queryset=member_queryset),
            )
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        board = serializer.save(owner=self.request.user)
        BoardMember.objects.create(board=board, user=self.request.user, role='admin')
        broadcast_board_event(
            board.id,
            'board_created',
            {'board_id': board.id, 'name': board.name},
        )

    def perform_update(self, serializer):
        self.require_board_admin(serializer.instance)
        board = serializer.save()
        broadcast_board_event(
            board.id,
            'board_updated',
            {'board_id': board.id, 'name': board.name},
        )

    def perform_destroy(self, instance):
        self.require_board_admin(instance)
        board_id = instance.id
        instance.delete()
        broadcast_board_event(board_id, 'board_deleted', {'board_id': board_id})

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        board = self.get_object()
        self.require_board_member(board)
        members = board.members.select_related('user').order_by('role', 'user__username')
        serializer = BoardMemberSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        board = self.get_object()
        self.require_board_admin(board)

        serializer = BoardInviteSerializer(data=request.data, board=board, request=request)
        serializer.is_valid(raise_exception=True)
        membership, created = BoardService.invite_member(
            board=board,
            user=serializer.validated_data['user'],
            role=serializer.validated_data['role'],
        )

        membership_data = BoardMemberSerializer(membership).data
        broadcast_board_event(
            board.id,
            'member_joined',
            {'board_id': board.id, 'member': membership_data, 'created': created},
        )
        return Response(membership_data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        board = self.get_object()
        membership = self.require_board_member(board)
        removed_member = BoardService.leave_board(board, request.user)
        broadcast_board_event(
            board.id,
            'member_left',
            {'board_id': board.id, 'member_id': membership.id, 'user_id': removed_member.user_id},
        )
        return Response({'status': 'left board'})

    @action(detail=True, methods=['patch'], url_path=r'members/(?P<member_id>[^/.]+)/role')
    def update_member_role(self, request, pk=None, member_id=None):
        board = self.get_object()
        self.require_board_admin(board)
        role = request.data.get('role')
        if role not in {'admin', 'member'}:
            raise ValidationError({'role': 'Role must be either admin or member.'})

        membership = BoardService.update_member_role(board, member_id, role, request.user)
        membership_data = BoardMemberSerializer(membership).data
        broadcast_board_event(
            board.id,
            'member_updated',
            {'board_id': board.id, 'member': membership_data},
        )
        return Response(membership_data)

    @action(detail=True, methods=['delete'], url_path=r'members/(?P<member_id>[^/.]+)')
    def remove_member(self, request, pk=None, member_id=None):
        board = self.get_object()
        self.require_board_admin(board)
        membership = BoardMember.objects.get(board=board, id=member_id)
        removed_user_id = membership.user_id
        removed_membership_id = membership.id
        BoardService.remove_member(board, member_id, request.user)
        broadcast_board_event(
            board.id,
            'member_removed',
            {'board_id': board.id, 'member_id': removed_membership_id, 'user_id': removed_user_id},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ListViewSet(BoardAccessMixin, viewsets.ModelViewSet):
    serializer_class = ListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return List.objects.filter(board__members__user=self.request.user).distinct().select_related('board')

    def perform_create(self, serializer):
        board = serializer.validated_data['board']
        self.require_board_admin(board)

        board_list = BoardService.create_list(board=board, title=serializer.validated_data['title'])
        serializer.instance = board_list
        list_data = ListSerializer(board_list).data
        broadcast_board_event(
            board.id,
            'list_created',
            {'board_id': board.id, 'list': list_data},
        )

    def perform_update(self, serializer):
        self.require_board_admin(serializer.instance.board)
        board_list = serializer.save()
        list_data = ListSerializer(board_list).data
        broadcast_board_event(
            board_list.board_id,
            'list_updated',
            {'board_id': board_list.board_id, 'list': list_data},
        )

    def perform_destroy(self, instance):
        self.require_board_admin(instance.board)
        board_id = instance.board_id
        list_id = instance.id
        instance.delete()
        broadcast_board_event(
            board_id,
            'list_deleted',
            {'board_id': board_id, 'list_id': list_id},
        )

    @action(detail=True, methods=['patch'])
    def move(self, request, pk=None):
        new_position = request.data.get('position')
        if new_position is not None:
            board_list = self.get_object()
            self.require_board_admin(board_list.board)
            BoardService.reorder_list(board_list.id, new_position)
            board_list.refresh_from_db()
            broadcast_board_event(
                board_list.board_id,
                'list_moved',
                {'board_id': board_list.board_id, 'list_id': board_list.id, 'position': int(new_position)},
            )
            return Response({'status': 'list moved'})
        return Response({'error': 'position required'}, status=status.HTTP_400_BAD_REQUEST)

class TaskViewSet(BoardAccessMixin, viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Task.objects.filter(list__board__members__user=self.request.user)
            .distinct()
            .select_related('list', 'assigned_to', 'list__board')
            .prefetch_related(
                'comments__author',
                'attachments__uploaded_by',
                'checklist_items',
                'activity_logs__actor',
            )
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['include_activity_logs'] = True
        return context

    def perform_create(self, serializer):
        task_list = serializer.validated_data['list']
        self.require_board_member(task_list.board)

        task = BoardService.create_task(
            task_list=task_list,
            title=serializer.validated_data['title'],
            description=serializer.validated_data.get('description'),
            assigned_to=serializer.validated_data.get('assigned_to'),
            due_date=serializer.validated_data.get('due_date'),
        )
        serializer.instance = task
        BoardService.record_activity(
            task=task,
            actor=self.request.user,
            action='task_created',
            message=f"Created task '{task.title}'.",
            metadata={'title': task.title},
        )
        task_data = TaskSerializer(task).data
        broadcast_board_event(
            task_list.board_id,
            'task_created',
            {'board_id': task_list.board_id, 'task': task_data},
        )

    def perform_update(self, serializer):
        self.require_board_member(serializer.instance.list.board)
        task = serializer.save()
        BoardService.record_activity(
            task=task,
            actor=self.request.user,
            action='task_updated',
            message=f"Updated task '{task.title}'.",
            metadata={'title': task.title},
        )
        task_data = TaskSerializer(task).data
        broadcast_board_event(
            task.list.board_id,
            'task_updated',
            {'board_id': task.list.board_id, 'task': task_data},
        )

    def perform_destroy(self, instance):
        self.require_board_member(instance.list.board)
        board_id = instance.list.board_id
        task_id = instance.id
        instance.delete()
        broadcast_board_event(
            board_id,
            'task_deleted',
            {'board_id': board_id, 'task_id': task_id},
        )

    @action(detail=True, methods=['patch'])
    def move(self, request, pk=None):
        new_list_id = request.data.get('list_id')
        new_position = request.data.get('position')
        
        if new_list_id is not None and new_position is not None:
            task = self.get_object()
            self.require_board_member(task.list.board)
            old_list_id = task.list_id
            BoardService.move_task(task.id, new_list_id, new_position)
            task.refresh_from_db()
            BoardService.record_activity(
                task=task,
                actor=request.user,
                action='task_moved',
                message=f"Moved task '{task.title}'.",
                metadata={'from_list_id': old_list_id, 'to_list_id': int(new_list_id), 'position': int(new_position)},
            )
            broadcast_board_event(
                task.list.board_id,
                'task_moved',
                {
                    'board_id': task.list.board_id,
                    'task_id': task.id,
                    'from_list_id': old_list_id,
                    'list_id': int(new_list_id),
                    'position': int(new_position),
                },
            )
            return Response({'status': 'task moved'})
        return Response({'error': 'list_id and position required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, pk=None):
        task = self.get_object()
        self.require_board_member(task.list.board)

        if request.method.lower() == 'get':
            serializer = TaskCommentSerializer(task.comments.all(), many=True, context=self.get_serializer_context())
            return Response(serializer.data)

        serializer = TaskCommentInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = TaskComment.objects.create(
            task=task,
            author=request.user,
            body=serializer.validated_data['body'],
        )
        BoardService.record_activity(
            task=task,
            actor=request.user,
            action='comment_added',
            message=f"Commented on '{task.title}'.",
            metadata={'comment_id': comment.id},
        )
        comment_data = TaskCommentSerializer(comment, context=self.get_serializer_context()).data
        broadcast_board_event(
            task.list.board_id,
            'task_comment_added',
            {'board_id': task.list.board_id, 'task_id': task.id, 'comment': comment_data},
        )
        return Response(comment_data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path=r'comments/(?P<comment_id>[^/.]+)')
    def delete_comment(self, request, pk=None, comment_id=None):
        task = self.get_object()
        self.require_board_member(task.list.board)
        comment = TaskComment.objects.get(task=task, id=comment_id)
        comment.delete()
        BoardService.record_activity(
            task=task,
            actor=request.user,
            action='comment_deleted',
            message=f"Deleted a comment on '{task.title}'.",
            metadata={'comment_id': int(comment_id)},
        )
        broadcast_board_event(
            task.list.board_id,
            'task_comment_deleted',
            {'board_id': task.list.board_id, 'task_id': task.id, 'comment_id': int(comment_id)},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get', 'post'], url_path='checklist')
    def checklist(self, request, pk=None):
        task = self.get_object()
        self.require_board_member(task.list.board)

        if request.method.lower() == 'get':
            serializer = TaskChecklistItemSerializer(task.checklist_items.all(), many=True, context=self.get_serializer_context())
            return Response(serializer.data)

        serializer = TaskChecklistInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        next_position = task.checklist_items.aggregate(max_position=Max('position'))['max_position']
        item = TaskChecklistItem.objects.create(
            task=task,
            title=serializer.validated_data['title'],
            position=0 if next_position is None else next_position + 1,
        )
        BoardService.record_activity(
            task=task,
            actor=request.user,
            action='checklist_item_added',
            message=f"Added checklist item on '{task.title}'.",
            metadata={'checklist_item_id': item.id},
        )
        item_data = TaskChecklistItemSerializer(item, context=self.get_serializer_context()).data
        broadcast_board_event(
            task.list.board_id,
            'task_checklist_item_added',
            {'board_id': task.list.board_id, 'task_id': task.id, 'item': item_data},
        )
        return Response(item_data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch', 'delete'], url_path=r'checklist/(?P<item_id>[^/.]+)')
    def checklist_item(self, request, pk=None, item_id=None):
        task = self.get_object()
        self.require_board_member(task.list.board)
        item = TaskChecklistItem.objects.get(task=task, id=item_id)

        if request.method.lower() == 'delete':
            item.delete()
            BoardService.record_activity(
                task=task,
                actor=request.user,
                action='checklist_item_deleted',
                message=f"Removed a checklist item from '{task.title}'.",
                metadata={'checklist_item_id': int(item_id)},
            )
            broadcast_board_event(
                task.list.board_id,
                'task_checklist_item_deleted',
                {'board_id': task.list.board_id, 'task_id': task.id, 'item_id': int(item_id)},
            )
            return Response(status=status.HTTP_204_NO_CONTENT)

        serializer = TaskChecklistUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_fields = []
        if 'title' in serializer.validated_data:
            item.title = serializer.validated_data['title']
            updated_fields.append('title')
        if 'is_done' in serializer.validated_data:
            item.is_done = serializer.validated_data['is_done']
            updated_fields.append('is_done')
        item.save(update_fields=updated_fields or None)
        BoardService.record_activity(
            task=task,
            actor=request.user,
            action='checklist_item_updated',
            message=f"Updated checklist item on '{task.title}'.",
            metadata={'checklist_item_id': item.id, 'is_done': item.is_done},
        )
        item_data = TaskChecklistItemSerializer(item, context=self.get_serializer_context()).data
        broadcast_board_event(
            task.list.board_id,
            'task_checklist_item_updated',
            {'board_id': task.list.board_id, 'task_id': task.id, 'item': item_data},
        )
        return Response(item_data)

    @action(detail=True, methods=['get', 'post'], url_path='attachments')
    @parser_classes([MultiPartParser, FormParser])
    def attachments(self, request, pk=None):
        task = self.get_object()
        self.require_board_member(task.list.board)

        if request.method.lower() == 'get':
            serializer = TaskAttachmentSerializer(task.attachments.all(), many=True, context=self.get_serializer_context())
            return Response(serializer.data)

        serializer = TaskAttachmentInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uploaded_file = serializer.validated_data['file']
        attachment = TaskAttachment.objects.create(
            task=task,
            uploaded_by=request.user,
            file=uploaded_file,
            original_name=uploaded_file.name,
        )
        BoardService.record_activity(
            task=task,
            actor=request.user,
            action='attachment_added',
            message=f"Attached file to '{task.title}'.",
            metadata={'attachment_id': attachment.id, 'file_name': attachment.original_name},
        )
        attachment_data = TaskAttachmentSerializer(attachment, context=self.get_serializer_context()).data
        broadcast_board_event(
            task.list.board_id,
            'task_attachment_added',
            {'board_id': task.list.board_id, 'task_id': task.id, 'attachment': attachment_data},
        )
        return Response(attachment_data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path=r'attachments/(?P<attachment_id>[^/.]+)')
    def delete_attachment(self, request, pk=None, attachment_id=None):
        task = self.get_object()
        self.require_board_member(task.list.board)
        attachment = TaskAttachment.objects.get(task=task, id=attachment_id)
        attachment.delete()
        BoardService.record_activity(
            task=task,
            actor=request.user,
            action='attachment_deleted',
            message=f"Removed an attachment from '{task.title}'.",
            metadata={'attachment_id': int(attachment_id)},
        )
        broadcast_board_event(
            task.list.board_id,
            'task_attachment_deleted',
            {'board_id': task.list.board_id, 'task_id': task.id, 'attachment_id': int(attachment_id)},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'], url_path='activity')
    def activity(self, request, pk=None):
        task = self.get_object()
        self.require_board_member(task.list.board)
        serializer = TaskActivitySerializer(task.activity_logs.all(), many=True, context=self.get_serializer_context())
        return Response(serializer.data)
