from django.contrib import admin
from django.urls import path, include, re_path
from django.http import JsonResponse
from django.conf import settings
from django.views.static import serve
from rest_framework.routers import DefaultRouter

from apps.boards.views import BoardViewSet, ListViewSet, TaskViewSet
from apps.core.views import home


def api_root(_request):
    return JsonResponse({
        "status": "ok",
        "message": "Kanban API is running",
    })


root_router = DefaultRouter()
root_router.register(r'boards', BoardViewSet, basename='root-board')
root_router.register(r'lists', ListViewSet, basename='root-list')
root_router.register(r'tasks', TaskViewSet, basename='root-task')

api_router = DefaultRouter()
api_router.register(r'boards', BoardViewSet, basename='api-board')
api_router.register(r'lists', ListViewSet, basename='api-list')
api_router.register(r'tasks', TaskViewSet, basename='api-task')

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('', include(root_router.urls)),
    path('auth/', include('apps.accounts.urls')),
    path('api/', api_root, name='api_root'),
    path('api/', include(api_router.urls)),
    path('api/auth/', include('apps.accounts.urls')),
]

# Attachments and avatars need to stay reachable even when DEBUG is False.
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
