# Deployment Checklist

## Backend

Set these environment variables:

- `DJANGO_DEBUG=False`
- `DJANGO_SECRET_KEY=<strong-secret>`
- `DJANGO_ALLOWED_HOSTS=<your-backend-host>`
- `DJANGO_CORS_ALLOWED_ORIGINS=<your-frontend-origin>`
- `DJANGO_CSRF_TRUSTED_ORIGINS=<your-frontend-origin>`

Run:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

Start command:

```bash
daphne -b 0.0.0.0 -p $PORT kanban_backend.asgi:application
```

## Frontend

Set these environment variables:

- `VITE_WS_URL=<backend-ws-url>` if your WebSocket endpoint is on a different host

Build:

```bash
npm run build
```

If you deploy with Vercel, the frontend build will pick up [`kanban-frontend/.env.production`](/c:/Users/mohar/OneDrive/Desktop/django-rest-framework-react/Kanban%20Board%20App/kanban-frontend/.env.production) and call the Render backend directly. The repo-root [`vercel.json`](/c:/Users/mohar/OneDrive/Desktop/django-rest-framework-react/Kanban%20Board%20App/vercel.json) still exists as a fallback build/proxy path for monorepo deployments.
