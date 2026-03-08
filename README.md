# Travel Map

A full-stack travel memory app for documenting trips and places on an interactive map.

It combines a public browsing experience with a role-based admin panel for managing trips, places, uploads, users, and groups.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-20232A?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

## Why this project?

Most travel journals are list-first. This project is map-first.

Instead of storing memories as disconnected posts, Travel Map organizes them around geography, routes, timelines, and grouped place collections. It is designed for personal archives, travel blogs, family trip logs, and private shared memory spaces.

## Features

- Interactive map-based browsing for places and trips
- Public pages for map view, places, trips, and timeline browsing
- Rich place records with summary, description, images, tags, companions, rating, and trip ordering
- Trip records with date ranges, cover images, tags, and optional route display
- Role-based admin dashboard
- Persisted authentication with seeded first admin user
- User roles: `viewer`, `editor`, `admin`
- Group management and user-to-group assignment
- Visibility modes for content, including support for authenticated/group-aware access
- Local image uploads served by the backend
- SQL migration system with automatic migration run on backend startup
- Docker Compose setup for local full-stack development

## Tech stack

### Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- MapLibre via `mapcn`

### Backend

- FastAPI
- Pydantic v2
- PostgreSQL
- `psycopg`
- SQL migration files tracked in `backend/migrations`

### Dev tooling

- Docker Compose
- `unittest` for backend tests

## Screenshots

### Home map
![Home map](docs/screenshots/home-map.png)

### Places
![Places page](docs/screenshots/places-page.png)

### Timeline
![Timeline page](docs/screenshots/timeline.png)

### Admin
![Admin edit place](docs/screenshots/admin-place-edit-page.png)

## Screens and flows

### Public experience

- `/` map-first landing page with search and trip filtering
- `/places` paginated place browsing with facets
- `/trips` trip browsing
- `/timeline` combined chronological view of trips and places

### Admin experience

- `/admin/login` sign-in page
- `/admin` overview dashboard
- `/admin/places` manage places
- `/admin/trips` manage trips
- `/admin/users` manage users and groups as an admin

## Repository layout

```text
.
├── backend/              FastAPI app, migrations, tests, media storage
├── frontend/             Next.js app
├── docs/                 Architecture notes 
└── docker-compose.yml    Local development stack
```

## Quick start

### Option 1: Docker Compose

This is the fastest way to run the full stack locally.

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

Default development credentials from `docker-compose.yml`:

- Admin email: `admin@example.com`
- Admin password: `change-me`

Change those before using the project outside local development.

### Option 2: Run frontend and backend manually

#### 1. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Important backend environment variables:

```env
APP_ENV=development
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/travel_map
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
ADMIN_NAME=Admin
SESSION_SECRET=change-me-long-random-secret
SESSION_TTL_SECONDS=86400
PASSWORD_SALT=travel-map-salt
MEDIA_ROOT=./media
MEDIA_URL_PREFIX=/media
MAX_UPLOAD_BYTES=10485760
```

#### 2. Configure the frontend

```bash
cp frontend/.env.example frontend/.env.local
```

Frontend environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_MAPCN_STYLE_URL=
NEXT_PUBLIC_MAPCN_ACCESS_TOKEN=
```

The map style variables are optional and depend on the map style/provider you want to use with `mapcn`.

#### 3. Install dependencies

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Frontend:

```bash
cd frontend
npm install
```

#### 4. Start PostgreSQL

Use your local PostgreSQL instance, or start only the database through Docker:

```bash
docker compose up db
```

#### 5. Start the backend

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 6. Start the frontend

```bash
cd frontend
npm run dev
```

## Database and migrations

- Migrations live in `backend/migrations`
- The backend runs migrations automatically on startup
- Applied migrations are tracked in the `schema_migrations` table
- You can also run migrations manually:

```bash
cd backend
python run_migrations.py
```

- On first startup, the app seeds an admin user from `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` if it does not already exist

## Authentication and authorization

The app uses backend-issued signed session tokens and role-based access control.

### Roles

- `viewer`: can access read-only admin views
- `editor`: can create and update places, trips, and uploads
- `admin`: can manage users, groups, and destructive actions

### Groups

- Groups are stored in PostgreSQL
- Users can belong to one or more groups
- Content supports visibility and group assignment fields
- Group-aware viewing is already wired into listing behavior for authenticated users

## Media uploads

- Uploads are stored locally under `backend/media` by default
- Files are served by the FastAPI backend under `/media/<filename>`
- Supported image types include `jpeg`, `png`, `webp`, `gif`, and `avif`
- Default upload limit is `10 MB` per file

## API notes

Selected backend routes:

- `GET /health`
- `GET /api/places`
- `GET /api/places/query`
- `GET /api/trips`
- `GET /api/trips/query`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/admin/places`
- `GET /api/admin/trips`
- `GET /api/admin/users`

## Verification

Frontend production build:

```bash
cd frontend
npm run build
```

Backend syntax verification:

```bash
cd backend
python -m compileall app run_migrations.py tests
```

Backend tests:

```bash
docker compose exec backend python -m unittest discover -s tests -v
```

## Current status

This project is already usable for local development and open-source collaboration, with a working frontend, backend, auth system, admin panel, migrations, uploads, and backend test coverage.

Areas that still look active or evolving:

- deeper group-based visibility rules
- more complete admin filtering/faceting
- broader frontend integration or end-to-end tests
- production hardening for storage, auditability, and deployment

## Contributing

Contributions are welcome.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
