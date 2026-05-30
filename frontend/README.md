# Askyy Frontend

React boilerplate with Vite, TypeScript, TanStack Query, Axios, React Router, Tailwind CSS, and auth scaffolding.

## Getting started

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Production build         |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run ESLint               |

## Project structure

```
src/
├── api/              # Axios client and API modules
├── components/       # Reusable UI + ProtectedRoute
├── constants/        # Shared constants (auth token key)
├── contexts/         # AuthProvider + useAuth hook
├── hooks/            # React Query hooks + useAsync
├── lib/              # QueryClient configuration
├── pages/            # Route-level pages
├── styles/           # Tailwind entry CSS
├── types/            # Shared TypeScript types
├── App.tsx           # Route definitions
└── main.tsx          # Providers (Query, Auth, Router)
```

## Features

### Axios HTTP client

Centralized instance in `src/api/client.ts` with:

- Base URL from environment
- Auth token injection
- 401 handling and normalized errors

### TanStack Query

Server state is managed with React Query. Example:

```ts
import { useQuery } from '@tanstack/react-query';
import { getHealth } from '@/api';

export function useHealthQuery() {
  return useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
  });
}
```

DevTools are enabled in development (bottom-left panel).

### Auth

- `AuthProvider` restores session from `localStorage` via `GET /auth/me`
- `LoginPage` at `/login` calls `POST /auth/login`
- `ProtectedRoute` guards `/dashboard` and redirects unauthenticated users

Expected API responses:

```ts
// POST /auth/login
{ token: string; user: { id: string; email: string; name: string } }

// GET /auth/me (Bearer token)
{ id: string; email: string; name: string }
```

### Tailwind CSS v4

Utility-first styling via `@tailwindcss/vite`. Global styles live in `src/styles/index.css`.

## Environment variables

| Variable            | Description      | Default                     |
| ------------------- | ---------------- | --------------------------- |
| `VITE_API_BASE_URL` | Backend API base | `http://localhost:3000/api` |

## Path aliases

```ts
import { Layout } from '@/components/Layout';
```
