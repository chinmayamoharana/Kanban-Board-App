# Real-Time Collaborative Kanban Board

A full-stack Kanban board built for local development with Django, Django REST Framework, Channels, React, Vite, and Tailwind CSS.

## Run Locally

### Backend

Open a terminal in [`kanban_backend`](c:\Users\mohar\OneDrive\Desktop\django-rest-framework-react\Kanban%20Board%20App\kanban_backend).

```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The Django API and WebSocket server run at `http://127.0.0.1:8000`.

### Frontend

Open a second terminal in [`kanban-frontend`](c:\Users\mohar\OneDrive\Desktop\django-rest-framework-react\Kanban%20Board%20App\kanban-frontend).

```powershell
npm install
npm run dev
```

The Vite app runs at `http://127.0.0.1:5173` or `http://localhost:5173`.

## Local-Only Defaults

- The frontend API base URL is fixed to `http://127.0.0.1:8000/api/`.
- The frontend WebSocket base URL is fixed to `ws://127.0.0.1:8000`.
- Django only allows `127.0.0.1` and `localhost`.
- CORS and CSRF are limited to the local Vite dev server.
- SQLite remains the default database at [`kanban_backend/db.sqlite3`](c:\Users\mohar\OneDrive\Desktop\django-rest-framework-react\Kanban%20Board%20App\kanban_backend\db.sqlite3).

## Useful Checks

From [`kanban_backend`](c:\Users\mohar\OneDrive\Desktop\django-rest-framework-react\Kanban%20Board%20App\kanban_backend):

```powershell
python manage.py check
python manage.py test apps.accounts apps.boards
```

From [`kanban-frontend`](c:\Users\mohar\OneDrive\Desktop\django-rest-framework-react\Kanban%20Board%20App\kanban-frontend):

```powershell
npm run build
```
