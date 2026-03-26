from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Max
from rest_framework.exceptions import ValidationError

from .models import Board, BoardMember, List, Task


User = get_user_model()

class BoardService:
    @staticmethod
    @transaction.atomic
    def create_list(board, title):
        next_position = board.lists.aggregate(max_position=Max('position'))['max_position']
        return List.objects.create(
            board=board,
            title=title,
            position=0 if next_position is None else next_position + 1,
        )

    @staticmethod
    @transaction.atomic
    def create_task(task_list, **task_data):
        next_position = task_list.tasks.aggregate(max_position=Max('position'))['max_position']
        return Task.objects.create(
            list=task_list,
            position=0 if next_position is None else next_position + 1,
            **task_data,
        )

    @staticmethod
    @transaction.atomic
    def move_task(task_id, new_list_id, new_position):
        task = Task.objects.get(id=task_id)
        old_list = task.list
        new_list = List.objects.get(id=new_list_id)

        old_tasks = list(Task.objects.filter(list=old_list).exclude(id=task_id).order_by('position'))
        if old_list.id == new_list.id:
            new_tasks = old_tasks
        else:
            new_tasks = list(Task.objects.filter(list=new_list).exclude(id=task_id).order_by('position'))

        insert_at = max(0, min(int(new_position), len(new_tasks)))
        new_tasks.insert(insert_at, task)

        if old_list.id == new_list.id:
            for index, item in enumerate(new_tasks):
                item.position = index
                item.save(update_fields=['position'])
            return task

        for index, item in enumerate(old_tasks):
            item.position = index
            item.save(update_fields=['position'])

        for index, item in enumerate(new_tasks):
            item.position = index
            item.list = new_list
            item.save(update_fields=['list', 'position'])

        return task

    @staticmethod
    @transaction.atomic
    def reorder_list(list_id, new_position):
        board_list = List.objects.get(id=list_id)
        board = board_list.board

        lists = list(List.objects.filter(board=board).exclude(id=list_id).order_by('position'))
        insert_at = max(0, min(int(new_position), len(lists)))
        lists.insert(insert_at, board_list)

        for index, board_list_item in enumerate(lists):
            board_list_item.position = index
            board_list_item.save(update_fields=['position'])

        return board_list

    @staticmethod
    @transaction.atomic
    def invite_member(board, user, role='member'):
        membership, created = BoardMember.objects.get_or_create(
            board=board,
            user=user,
            defaults={'role': role},
        )

        if not created and membership.role != role:
            membership.role = role
            membership.save(update_fields=['role'])

        return membership, created

    @staticmethod
    @transaction.atomic
    def update_member_role(board, member_id, role, acting_user):
        membership = BoardMember.objects.select_related('user').get(board=board, id=member_id)

        if membership.user_id == acting_user.id and role != 'admin':
            admin_count = BoardMember.objects.filter(board=board, role='admin').count()
            if admin_count <= 1:
                raise ValidationError('At least one admin must remain on the board.')

        membership.role = role
        membership.save(update_fields=['role'])
        return membership

    @staticmethod
    @transaction.atomic
    def remove_member(board, member_id, acting_user):
        membership = BoardMember.objects.select_related('user').get(board=board, id=member_id)

        if membership.user_id == acting_user.id:
            raise ValidationError('Use the leave board action instead.')

        if membership.role == 'admin':
            admin_count = BoardMember.objects.filter(board=board, role='admin').count()
            if admin_count <= 1:
                raise ValidationError('At least one admin must remain on the board.')

        membership.delete()
        return membership

    @staticmethod
    @transaction.atomic
    def leave_board(board, user):
        membership = BoardMember.objects.select_related('user').get(board=board, user=user)
        if membership.role == 'admin':
            admin_count = BoardMember.objects.filter(board=board, role='admin').count()
            if admin_count <= 1:
                raise ValidationError({'detail': 'You must promote another admin before leaving the board.'})

        membership.delete()
        return membership
