# Deployment Checklist

## Backend

Set these environment variables:

- `DJANGO_DEBUG=False`
- `DJANGO_SECRET_KEY=<strong-secret>`
- `DJANGO_ALLOWED_HOSTS=<your-backend-host>,<your-frontend-host>`
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

Build:

```bash
npm run build
```

Recommended Vercel environment variables:

- `VITE_API_BASE_URL=https://kanban-board-app-9ip9.onrender.com/api/`
- `VITE_WS_BASE_URL=wss://<your-backend-host>`
