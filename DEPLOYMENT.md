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

Build:

```bash
npm run build
```

The frontend now uses direct URLs in code, so no frontend `.env` file is required.
In production it calls the Render backend directly and connects WebSockets to the Render host.
