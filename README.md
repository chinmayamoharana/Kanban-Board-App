# Real-Time Collaborative Kanban Board

A full-stack Kanban board built with Django, Django REST Framework, Channels, React, Vite, and Tailwind CSS.

It now includes:

- JWT authentication
- shared boards with invited members
- role-based permissions for admins and members
- task assignment to board members
- drag-and-drop list and task reordering
- targeted real-time updates over WebSockets
- responsive UI with animated Tailwind styling

## Tech Stack

### Backend

- Django 5
- Django REST Framework
- SimpleJWT
- Channels
- Daphne
- SQLite3 by default

### Frontend

- React 18
- Vite
- Tailwind CSS
- Axios
- `@hello-pangea/dnd`
- `lucide-react`

## Project Structure

```text
Kanban Board App/
|-- kanban_backend/
|   |-- apps/
|   |   |-- accounts/
|   |   |-- boards/
|   |   `-- core/
|   |-- kanban_backend/
|   `-- manage.py
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

## Features

- User registration and login
- JWT-based protected API access
- Create and view boards
- Invite users to a board using username or email
- Board member roles: `admin` and `member`
- Admin-only control for board structure and member management
- Member collaboration on task creation, movement, updates, and assignment
- Assign board members to tasks from the UI
- Task details modal for editing title, description, and assignee
- View board members
- Leave board and delete board actions
- Drag and drop lists and tasks
- Real-time targeted task, list, member, and board updates without full-board reloads
- Modern responsive glassmorphism-inspired UI

## Permission Model

### Admin

- Create, update, and delete boards
- Invite members
- Change member roles
- Remove members
- Create, move, update, and delete lists
- Manage tasks

### Member

- Access boards they belong to
- Create, update, move, delete, and assign tasks
- View board members
- Leave the board

## Backend Setup

Open a terminal in [`kanban_backend`](c:\Users\mohar\OneDrive\Desktop\django-rest-framework-react\Kanban%20Board%20App\kanban_backend).

### 1. Create and activate a virtual environment

```powershell
python -m venv venv
.\venv\Scripts\activate
```

### 2. Install backend dependencies

```powershell
pip install -r requirements.txt
```

### 3. Run migrations

```powershell
python manage.py migrate
```

This creates the local SQLite database file at [`kanban_backend/db.sqlite3`](c:\Users\mohar\OneDrive\Desktop\django-rest-framework-react\Kanban%20Board%20App\kanban_backend\db.sqlite3) if it does not already exist.

### 4. Start the backend server

```powershell
python manage.py runserver
```

To test from another device on the same network:

```powershell
python manage.py runserver 0.0.0.0:8000
```

## Frontend Setup

Open a second terminal in [`kanban-frontend`](c:\Users\mohar\OneDrive\Desktop\django-rest-framework-react\Kanban%20Board%20App\kanban-frontend).

### 1. Install dependencies

```powershell
npm install
```

### 2. Start the Vite dev server

```powershell
npm run dev
```

### 3. Build for production

```powershell
npm run build
```

## Environment Variables

The backend uses SQLite3 by default, so you do not need to provision or configure a separate database server.

### Backend

```env
DJANGO_SECRET_KEY=your_secret_key
DJANGO_DEBUG=True
```

The backend reads these values from [`kanban_backend/.env`](c:\Users\mohar\OneDrive\Desktop\django-rest-framework-react\Kanban%20Board%20App\kanban_backend\.env) automatically.
The backend always uses the local SQLite file at [`kanban_backend/db.sqlite3`](c:\Users\mohar\OneDrive\Desktop\django-rest-framework-react\Kanban%20Board%20App\kanban_backend\db.sqlite3).

### Frontend

For local development, the frontend talks to the Django backend at `http://127.0.0.1:8000/api/`.
For deployment, set:

```env
VITE_API_BASE_URL=/api/
VITE_WS_BASE_URL=wss://your-backend-host
```

You can also point `VITE_API_BASE_URL` directly at your backend API URL if you prefer.

## Deployment

This project is ready for a simple single-instance deploy.

- SQLite3 keeps setup lightweight and works without a separate database service.
- The in-memory Channels layer means WebSockets are limited to one app process.
- Make sure the deploy target keeps `kanban_backend/db.sqlite3` on persistent storage if you want data to survive restarts.
- The included [`Procfile`](/c:/Users/mohar/OneDrive/Desktop/django-rest-framework-react/Kanban%20Board%20App/Procfile) starts the ASGI app with Daphne.
- The root [`vercel.json`](/c:/Users/mohar/OneDrive/Desktop/django-rest-framework-react/Kanban%20Board%20App/vercel.json) builds `kanban-frontend`, serves `kanban-frontend/dist`, and proxies `/api/*` to the backend.

## API Overview

### Auth

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/token/refresh/`
- `GET /api/auth/me/`

### Boards

- `GET /api/boards/`
- `POST /api/boards/`
- `GET /api/boards/:id/`
- `DELETE /api/boards/:id/`
- `GET /api/boards/:id/members/`
- `POST /api/boards/:id/invite/`
- `POST /api/boards/:id/leave/`
- `PATCH /api/boards/:id/members/:memberId/role/`
- `DELETE /api/boards/:id/members/:memberId/`

### Lists

- `POST /api/boards/lists/`
- `PATCH /api/boards/lists/:id/`
- `PATCH /api/boards/lists/:id/move/`

### Tasks

- `POST /api/boards/tasks/`
- `PATCH /api/boards/tasks/:id/`
- `PATCH /api/boards/tasks/:id/move/`
- `DELETE /api/boards/tasks/:id/`

## Real-Time Flow

1. A user updates a board, member, list, or task through the REST API.
2. Django saves the change.
3. Channels broadcasts a specific board event to `/ws/boards/<board_id>/`.
4. Connected clients patch only the affected state locally.
5. The UI updates without reloading the full board for routine changes.

Examples of targeted events:

- `task_created`
- `task_updated`
- `task_moved`
- `task_deleted`
- `list_created`
- `list_updated`
- `list_moved`
- `list_deleted`
- `member_joined`
- `member_updated`
- `member_removed`
- `member_left`
- `board_updated`
- `board_deleted`

## Testing

Backend checks:

```powershell
python manage.py check
python manage.py test apps.accounts apps.boards
```

Frontend build:

```powershell
npm run build
```

## Notes

- The project uses the in-memory Channels layer only.
- Real-time updates work without Redis as long as the app runs in a single process.
- The project allows all hosts in development mode for easier device testing.
- CORS is enabled for development.
- The local database lives in [`kanban_backend/db.sqlite3`](c:\Users\mohar\OneDrive\Desktop\django-rest-framework-react\Kanban%20Board%20App\kanban_backend\db.sqlite3).
- WebSocket URLs can be configured with `VITE_WS_BASE_URL`.

## Future Improvements

- Presence indicators for active collaborators
- Notification toasts for live events
- Richer invite flows with pending invitations
- Due date and task priority UI
- Activity history per board
