# FitPulse — Health & Fitness Tracker

FitPulse is a full-stack fitness dashboard for tracking workouts, nutrition, goals, and progress trends. Built with TanStack Start, React 19, Tailwind CSS v4, and PostgreSQL (Neon) via Prisma.

## Features

- JWT authentication (register / login)
- Workout logging with MET-based calorie estimates
- Nutrition tracking with server-side food search
- Goals with progress logging (max 5 active)
- Dashboard aggregations and reports with CSV/JSON export
- Optional sample data seeding for new accounts

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env.local
   ```

   Fill in:

   - `DATABASE_URL` — Neon PostgreSQL connection string
   - `JWT_SECRET` — at least 32 random characters
   - `VITE_API_BASE_URL=/api` (default)

3. **Database**

   ```bash
   npx prisma db push
   ```

4. **Run dev server**

   ```bash
   npm run dev
   ```

   Open the URL shown in the terminal (usually `http://localhost:5173`).

## Deploy to Vercel

1. Push the repo to GitHub and import into [Vercel](https://vercel.com).
2. Create a [Neon](https://neon.tech) database and copy the connection string.
3. In Vercel project **Settings → Environment Variables**, add:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `VITE_API_BASE_URL=/api`
4. Deploy. `postinstall` runs `prisma generate` automatically.
5. Run `npx prisma db push` once against your production database (locally with prod `DATABASE_URL` or via Neon SQL console migrations).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server + `/api` middleware |
| `npm run build` | Generate Prisma client and production build |
| `npm run start` | Preview production build |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:studio` | Open Prisma Studio |

## Folder structure

```
api/                 Vercel serverless entry (routes /api/*)
prisma/              Schema and migrations
plugins/             Vite dev API middleware
src/
  components/        UI and layout components
  lib/               Client API, store, types, utilities
  routes/            TanStack Router file routes
  server/            API handlers, auth, Prisma, seed
```

## Known limitations

- Steps and sleep on the dashboard use placeholder values (not device-integrated).
- Water tracking is stored in the browser session (resets at midnight).
- Profile name/email are read-only after registration (no update endpoint).
- Food database is a fixed server-side list (no external nutrition API).
- Forgot-password flow is UI-only.

## Tech stack

- **Frontend:** TanStack Start, TanStack Router, TanStack Query, Zustand, shadcn/ui, Framer Motion, Recharts
- **Backend:** Vercel serverless functions, Prisma, PostgreSQL (Neon), jose (JWT), bcryptjs
