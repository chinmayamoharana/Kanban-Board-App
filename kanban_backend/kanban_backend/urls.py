from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from apps.core.views import home


def api_root(_request):
    return JsonResponse({
        "status": "ok",
        "message": "Kanban API is running",
    })

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api_root'),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/boards/', include('apps.boards.urls')),
]
