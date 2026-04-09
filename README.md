# Real-Time Kanban Board

A full-stack Kanban board application built with Django, Django REST Framework, Channels, React, Vite, and Tailwind CSS.

This app lets users register, create boards, invite teammates, organize work into lists and cards, and see board changes update live through WebSockets.

## Features

- JWT-based authentication with register, login, token refresh, and current-user endpoints
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
  - delete tasks
  - leave boards
- Realtime board updates over WebSockets for list, task, board, and member changes
- Responsive animated frontend built with Tailwind CSS and Framer Motion

## Tech Stack

### Backend

- Django
- Django REST Framework
- Simple JWT
- Django Channels
- Daphne
- SQLite

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

- Frontend REST base URL: `http://127.0.0.1:8000/api/`
- Frontend WebSocket base URL: `ws://127.0.0.1:8000`
- Allowed Django hosts: `127.0.0.1`, `localhost`
- Allowed frontend origins: `http://127.0.0.1:5173`, `http://localhost:5173`
- Default database: SQLite at `kanban_backend/db.sqlite3`
- Channels layer: in-memory, which is best suited for local development and a single-process server

If you want to change the frontend connection targets, update:

- `kanban-frontend/src/api/axios.js`
- `kanban-frontend/src/hooks/useSocket.js`

## Main API Routes

### Authentication

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/token/refresh/`
- `GET /api/auth/me/`

### Boards

- `GET /api/boards/`
- `POST /api/boards/`
- `GET /api/boards/{id}/`
- `DELETE /api/boards/{id}/`
- `GET /api/boards/{id}/members/`
- `POST /api/boards/{id}/invite/`
- `POST /api/boards/{id}/leave/`
- `PATCH /api/boards/{id}/members/{member_id}/role/`
- `DELETE /api/boards/{id}/members/{member_id}/`

### Lists

- `POST /api/boards/lists/`
- `PATCH /api/boards/lists/{id}/`
- `PATCH /api/boards/lists/{id}/move/`

### Tasks

- `POST /api/boards/tasks/`
- `PATCH /api/boards/tasks/{id}/`
- `PATCH /api/boards/tasks/{id}/move/`
- `DELETE /api/boards/tasks/{id}/`

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

## Notes

- Registration returns JWT tokens from the backend immediately, but the current frontend flow redirects users to the login page after signup.
- Task model support includes `due_date`, though the current UI focuses on title, description, and assignee editing.
- This repository is configured for local development, not production deployment.
