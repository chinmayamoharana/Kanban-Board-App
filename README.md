# Real-Time Kanban Board

A full-stack Kanban board application built with Django, Django REST Framework, Channels, React, Vite, and Tailwind CSS.

This app lets users register, create boards, invite teammates, organize work into lists and cards, set due dates on tasks, and see board changes update live through WebSockets.

## Assignment Status

All core assignment points are implemented and working in the current build.

- Authentication with register, login, token refresh, and current-user endpoints
- Protected board dashboard with user-specific access
- Board creation, membership management, and role-based permissions
- List and task CRUD with drag-and-drop reordering
- Task details with due dates, assignees, comments, checklist items, and attachments
- Realtime updates over WebSockets for collaborative work
- Search and filter support in the board view
- Profile editing with avatar upload and password change
- MySQL database integration for the backend
- Local development setup documented for both frontend and backend

Verification completed locally:

- Django system checks pass
- Frontend production build passes
- MySQL connection and migrations are configured

## Features

- JWT-based authentication with register, login, token refresh, and current-user endpoints
- Registration returns tokens immediately and signs the user in right away
- Protected dashboard that shows every board the signed-in user belongs to
- Board creation with automatic owner/admin membership
- Admin/member roles for each board
- Admin-only board management actions:
  - create lists
  - invite members by username or email
  - change member roles
  - remove members
  - delete boards
- Shared task workflow for board members:
  - create tasks inside lists
  - drag and drop lists
  - drag and drop tasks across lists
  - edit task title, description, and assignee
  - set and edit task due dates
  - add comments and view activity history
  - upload attachments to tasks
  - add checklist items and mark them done
  - delete tasks
  - leave boards
- Search and filter tasks directly from the board view
- Profile editing with avatar upload and password change
- Realtime board updates over WebSockets for list, task, board, and member changes
- Responsive animated frontend built with Tailwind CSS and Framer Motion

## Tech Stack

### Backend

- Django
- Django REST Framework
- Simple JWT
- Django Channels
- Daphne
- MySQL

### Frontend

- React 18
- Vite
- React Router
- Axios
- Tailwind CSS
- Framer Motion
- `@hello-pangea/dnd`
- Lucide React

## Project Structure

```text
Kanban Board App/
|-- kanban_backend/
|   |-- apps/
|   |   |-- accounts/   # auth, registration, user details
|   |   |-- boards/     # boards, members, lists, tasks
|   |   `-- core/       # websocket routing and broadcast events
|   |-- kanban_backend/ # Django settings, ASGI, URLs
|   `-- requirements.txt
|-- kanban-frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- context/
|   |   |-- hooks/
|   |   `-- pages/
|   `-- package.json
`-- README.md
```

## How It Works

1. A user registers or logs in.
2. After authentication, the user lands on the dashboard and can create or open boards.
3. Each board contains ordered lists, and each list contains ordered tasks.
4. Admins manage the board structure and membership.
5. Members collaborate on tasks, and changes are broadcast live to connected clients.

## Run Locally

### Backend

Open a terminal in `kanban_backend`.

```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Create a MySQL database and user, then add these values to `kanban_backend/.env`:

```env
DJANGO_DB_ENGINE=django.db.backends.mysql
DJANGO_DB_NAME=kanban_board_app
DJANGO_DB_USER=your_mysql_user
DJANGO_DB_PASSWORD=your_mysql_password
DJANGO_DB_HOST=127.0.0.1
DJANGO_DB_PORT=3306
DJANGO_DB_CHARSET=utf8mb4
```

Then run:

```powershell
python manage.py migrate
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000`.

### Frontend

Open a second terminal in `kanban-frontend`.

```powershell
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:5173`.

## Default Local Configuration

- Frontend REST base URL: `http://127.0.0.1:8000/`
- Frontend WebSocket base URL: `ws://127.0.0.1:8000`
- Allowed Django hosts: read from `DJANGO_ALLOWED_HOSTS`
- Allowed frontend origins: read from `DJANGO_CORS_ALLOWED_ORIGINS`
- Default database: MySQL configured through `kanban_backend/.env`
- Channels layer: in-memory, which is best suited for local development and a single-process server

If you want to change the frontend connection targets, update:

- `kanban-frontend/src/api/axios.js`
- `kanban-frontend/src/hooks/useSocket.js`

## Main API Routes

### Root Routes

- `POST /auth/register/`
- `POST /auth/login/`
- `POST /auth/token/refresh/`
- `GET /auth/me/`

### API Routes

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/token/refresh/`
- `GET /api/auth/me/`

### Root Boards

- `GET /boards/`
- `POST /boards/`
- `GET /boards/{id}/`
- `DELETE /boards/{id}/`
- `GET /boards/{id}/members/`
- `POST /boards/{id}/invite/`
- `POST /boards/{id}/leave/`
- `PATCH /boards/{id}/members/{member_id}/role/`
- `DELETE /boards/{id}/members/{member_id}/`

### API Boards

- `GET /api/boards/`
- `POST /api/boards/`
- `GET /api/boards/{id}/`
- `DELETE /api/boards/{id}/`
- `GET /api/boards/{id}/members/`
- `POST /api/boards/{id}/invite/`
- `POST /api/boards/{id}/leave/`
- `PATCH /api/boards/{id}/members/{member_id}/role/`
- `DELETE /api/boards/{id}/members/{member_id}/`

### Root Lists

- `POST /lists/`
- `PATCH /lists/{id}/`
- `PATCH /lists/{id}/move/`

### API Lists

- `POST /api/lists/`
- `PATCH /api/lists/{id}/`
- `PATCH /api/lists/{id}/move/`

### Root Tasks

- `POST /tasks/`
- `PATCH /tasks/{id}/`
- `PATCH /tasks/{id}/move/`
- `DELETE /tasks/{id}/`

### API Tasks

- `POST /api/tasks/`
- `PATCH /api/tasks/{id}/`
- `PATCH /api/tasks/{id}/move/`
- `DELETE /api/tasks/{id}/`
- `GET /api/tasks/{id}/comments/`
- `POST /api/tasks/{id}/comments/`
- `DELETE /api/tasks/{id}/comments/{comment_id}/`
- `GET /api/tasks/{id}/checklist/`
- `POST /api/tasks/{id}/checklist/`
- `PATCH /api/tasks/{id}/checklist/{item_id}/`
- `DELETE /api/tasks/{id}/checklist/{item_id}/`
- `GET /api/tasks/{id}/attachments/`
- `POST /api/tasks/{id}/attachments/`
- `DELETE /api/tasks/{id}/attachments/{attachment_id}/`
- `GET /api/tasks/{id}/activity/`

### WebSocket

- `ws://127.0.0.1:8000/ws/boards/{board_id}/`

## Permissions Summary

- Auth is required for all board endpoints.
- A user only sees boards they belong to.
- Board admins can manage board structure and membership.
- Board members can create, edit, move, assign, and delete tasks.
- A board must always keep at least one admin.

## Useful Checks

From `kanban_backend`:

```powershell
python manage.py check
python manage.py test apps.accounts apps.boards apps.core
```

From `kanban-frontend`:

```powershell
npm run build
```

## Render Deployment

If you deploy the backend on Render, the WebSocket connection only works when the service starts with the ASGI app, not the WSGI app.

Use this start command on Render:

```powershell
daphne -b 0.0.0.0 -p $PORT kanban_backend.asgi:application
```

This repository also includes a `render.yaml` blueprint that uses the same command.

## Notes

- Registration returns JWT tokens from the backend immediately and the frontend signs the user in after signup.
- Task model support includes `due_date`, and the current UI lets users edit it from the task details modal.
- User profiles support avatar uploads and password changes from the navbar profile modal.
- This repository is configured for local development, not production deployment.
- If you want to test with SQLite instead, set `DJANGO_DB_ENGINE=django.db.backends.sqlite3` and `DJANGO_DB_NAME=db.sqlite3` in `kanban_backend/.env`.
