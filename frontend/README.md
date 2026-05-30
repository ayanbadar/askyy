# Askyy Frontend

React app with **Vite**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, TanStack Query, Axios, and React Router.

## Getting started

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Ensure the Django API is running on port **8000** and create a user:

```bash
cd ../backend
python manage.py createsuperuser
```

## Stack

| Tool            | Role                                             |
| --------------- | ------------------------------------------------ |
| Tailwind CSS v4 | Utility styling (`@tailwindcss/vite`)            |
| shadcn/ui       | Accessible UI primitives in `src/components/ui/` |
| Lucide React    | Icons                                            |
| TanStack Query  | Server state                                     |
| Axios           | HTTP client + JWT                                |

## shadcn/ui

Configured via `components.json`. Theme tokens live in `src/styles/index.css`.

Add more components:

```bash
npx shadcn@latest add dialog dropdown-menu
```

Import from `@/components/ui/*`:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
```

## Auth flow

1. **Sign in** (`/login`) — Google SSO (when `VITE_GOOGLE_CLIENT_ID` is set) or username/password via `POST /api/auth/login`
2. **Session restore** — `GET /api/auth/me` with Bearer token
3. **Protected routes** — `/` and `/dashboard` require auth
4. **Token refresh** — automatic on `401` via Axios interceptor

## Environment variables

| Variable                | Description                | Default                       |
| ----------------------- | -------------------------- | ----------------------------- |
| `VITE_API_BASE_URL`     | Backend API base           | `http://localhost:8000/api`   |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web client ID | (empty — hides Google button) |

During `npm run dev`, Vite proxies `/api` to `http://localhost:8000`.

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Production build         |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run ESLint               |
