<div align="center">

```
███████╗██╗████████╗██████╗ ██╗   ██╗██╗     ███████╗███████╗
██╔════╝██║╚══██╔══╝██╔══██╗██║   ██║██║     ██╔════╝██╔════╝
█████╗  ██║   ██║   ██████╔╝██║   ██║██║     ███████╗█████╗  
██╔══╝  ██║   ██║   ██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝  
██║     ██║   ██║   ██║     ╚██████╔╝███████╗███████║███████╗
╚═╝     ╚═╝   ╚═╝   ╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝
```

**Track. Train. Transform.**

[![TanStack](https://img.shields.io/badge/TanStack-Start-FF4154?style=flat-square)](https://tanstack.com/start)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00E5BF?style=flat-square)](https://neon.tech)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)

</div>

---

FitPulse is a full-stack fitness dashboard for tracking workouts, nutrition, goals, and progress trends. Built on a modern React 19 + TanStack stack with a serverless PostgreSQL backend, it gives you a single place to log everything that matters and watch your progress compound over time.

---

## ✦ Features

| | Feature | Description |
|---|---|---|
| 🔐 | **JWT Authentication** | Secure register & login flow with jose + bcryptjs |
| 🏋️ | **Workout Logging** | Log exercises with MET-based calorie burn estimates |
| 🥗 | **Nutrition Tracking** | Server-side food search with macro breakdowns |
| 🎯 | **Goal Tracking** | Up to 5 active goals with incremental progress logging |
| 📊 | **Dashboard & Reports** | Aggregated insights with CSV and JSON export |
| 🌱 | **Sample Data Seeding** | One-click demo data for new accounts |

---

## ⚡ Quick Start

### 1 — Install dependencies

```bash
npm install
```

### 2 — Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
# Neon PostgreSQL connection string
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# At least 32 random characters — generate with: openssl rand -base64 32
JWT_SECRET="your-super-secret-key-here"

# Leave as-is for local dev
VITE_API_BASE_URL=/api
```

### 3 — Push database schema

```bash
npx prisma db push
```

### 4 — Start the dev server

```bash
npm run dev
```

Open the URL shown in the terminal — usually [`http://localhost:5173`](http://localhost:5173).

> **Tip:** On first login you'll be offered sample data seeding. Accept it to pre-populate workouts, nutrition entries, and goals so the dashboard comes alive immediately.

---

## 🚀 Deploy to Vercel

1. **Push to GitHub** and import the repo at [vercel.com/new](https://vercel.com/new).

2. **Create a Neon database** at [neon.tech](https://neon.tech) and copy the connection string.

3. **Add environment variables** in your Vercel project under **Settings → Environment Variables**:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Your Neon connection string |
   | `JWT_SECRET` | 32+ random characters |
   | `VITE_API_BASE_URL` | `/api` |

4. **Deploy.** The `postinstall` script runs `prisma generate` automatically — no extra steps.

5. **Migrate the production database** by running the following once with your production `DATABASE_URL` set locally (or via the Neon SQL console):

   ```bash
   DATABASE_URL="your-prod-url" npx prisma db push
   ```

---

## 🛠 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with `/api` middleware |
| `npm run build` | Generate Prisma client and production build |
| `npm run start` | Preview the production build locally |
| `npm run db:push` | Push Prisma schema changes to the database |
| `npm run db:studio` | Open Prisma Studio — visual database browser |

---

## 📁 Project Structure

```
fitpulse/
├── api/                    # Vercel serverless entry — routes /api/*
├── prisma/                 # Schema and migration history
├── plugins/                # Vite dev-server API middleware
└── src/
    ├── components/         # Shared UI and layout components
    ├── lib/                # API client, Zustand store, types, utilities
    ├── routes/             # TanStack Router file-based routes
    └── server/             # API handlers, auth helpers, Prisma client, seed
```

---

## 🧰 Tech Stack

### Frontend
| Library | Role |
|---|---|
| [TanStack Start](https://tanstack.com/start) | Full-stack React framework |
| [TanStack Router](https://tanstack.com/router) | File-based, type-safe routing |
| [TanStack Query](https://tanstack.com/query) | Server state & data fetching |
| [Zustand](https://zustand-demo.pmnd.rs) | Lightweight client state |
| [shadcn/ui](https://ui.shadcn.com) | Accessible component library |
| [Framer Motion](https://www.framer.com/motion) | Animations & transitions |
| [Recharts](https://recharts.org) | Chart & data visualization |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |

### Backend
| Library | Role |
|---|---|
| [Vercel Functions](https://vercel.com/docs/functions) | Serverless API handlers |
| [Prisma](https://prisma.io) | Type-safe ORM |
| [Neon](https://neon.tech) | Serverless PostgreSQL |
| [jose](https://github.com/panva/jose) | JWT signing & verification |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Password hashing |

---

## ⚠️ Known Limitations

These are current gaps — contributions welcome:

- **Steps & sleep** on the dashboard show placeholder values — no wearable/device integration yet.
- **Water intake** is stored in browser session state and resets at midnight.
- **Profile editing** (name/email) is not supported after registration.
- **Food database** is a fixed server-side list — no third-party nutrition API is wired in.
- **Forgot password** flow is UI-only; no email delivery is implemented.

---

## 🤝 Contributing

1. Fork the repo and create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes and add tests if applicable
3. Open a pull request with a clear description of what you've changed and why

Bug reports and feature requests are welcome via [GitHub Issues](../../issues).

---

<div align="center">

Built with ❤️ using [TanStack](https://tanstack.com) · [Neon](https://neon.tech) · [Vercel](https://vercel.com)

</div>
