from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import Board, BoardMember, List, Task
from .services import BoardService


User = get_user_model()


class BoardServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='boardowner',
            email='boardowner@example.com',
            password='StrongPass123!',
        )
        self.board = Board.objects.create(name='Team Board', owner=self.user)
        BoardMember.objects.create(board=self.board, user=self.user, role='admin')
        self.todo = List.objects.create(board=self.board, title='Todo', position=0)
        self.doing = List.objects.create(board=self.board, title='Doing', position=1)
        self.task_a = Task.objects.create(list=self.todo, title='Task A', position=0)
        self.task_b = Task.objects.create(list=self.todo, title='Task B', position=1)

    def test_create_list_appends_to_end(self):
        done = BoardService.create_list(self.board, 'Done')

        self.assertEqual(done.position, 2)

    def test_reorder_list_updates_positions(self):
        BoardService.reorder_list(self.doing.id, 0)

        self.todo.refresh_from_db()
        self.doing.refresh_from_db()
        self.assertEqual(self.doing.position, 0)
        self.assertEqual(self.todo.position, 1)

    def test_move_task_within_same_list_reorders_positions(self):
        BoardService.move_task(self.task_b.id, self.todo.id, 0)

        self.task_a.refresh_from_db()
        self.task_b.refresh_from_db()
        self.assertEqual(self.task_b.position, 0)
        self.assertEqual(self.task_a.position, 1)

    def test_move_task_across_lists_updates_list_and_positions(self):
        BoardService.move_task(self.task_a.id, self.doing.id, 0)

        self.task_a.refresh_from_db()
        self.task_b.refresh_from_db()
        self.assertEqual(self.task_a.list_id, self.doing.id)
        self.assertEqual(self.task_a.position, 0)
        self.assertEqual(self.task_b.position, 0)


class BoardCollaborationApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password='StrongPass123!',
        )
        self.member = User.objects.create_user(
            username='memberuser',
            email='member@example.com',
            password='StrongPass123!',
        )
        self.other = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='StrongPass123!',
        )
        self.board = Board.objects.create(name='Team Board', owner=self.admin)
        self.admin_membership = BoardMember.objects.create(board=self.board, user=self.admin, role='admin')
        self.member_membership = BoardMember.objects.create(board=self.board, user=self.member, role='member')
        self.todo = List.objects.create(board=self.board, title='Todo', position=0)
        self.task = Task.objects.create(list=self.todo, title='Assigned task', position=0)

    def test_admin_can_invite_by_username(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            f'/api/boards/{self.board.id}/invite/',
            {'identifier': 'otheruser', 'role': 'member'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(BoardMember.objects.filter(board=self.board, user=self.other, role='member').exists())

    def test_member_cannot_invite_users(self):
        self.client.force_authenticate(user=self.member)

        response = self.client.post(
            f'/api/boards/{self.board.id}/invite/',
            {'identifier': 'otheruser', 'role': 'member'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_member_cannot_create_lists(self):
        self.client.force_authenticate(user=self.member)

        response = self.client.post(
            '/api/boards/lists/',
            {'board': self.board.id, 'title': 'Blocked list'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_member_can_assign_task_to_board_member(self):
        self.client.force_authenticate(user=self.member)

        response = self.client.patch(
            f'/api/boards/tasks/{self.task.id}/',
            {'assigned_to': self.member.id},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.assigned_to_id, self.member.id)

    def test_task_cannot_be_assigned_to_non_member(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f'/api/boards/tasks/{self.task.id}/',
            {'assigned_to': self.other.id},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('assigned_to', response.data)

    def test_last_admin_cannot_leave_board(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(f'/api/boards/{self.board.id}/leave/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_promote_member(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f'/api/boards/{self.board.id}/members/{self.member_membership.id}/role/',
            {'role': 'admin'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.member_membership.refresh_from_db()
        self.assertEqual(self.member_membership.role, 'admin')
