# Wit

Meat inventory & lot traceability platform.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Prisma ORM |
| Hosting | Vercel (app) + Railway/Neon (database) |
| CI/CD | GitHub Actions |

## Branching Strategy

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | Production-ready code | Production (Vercel) |
| `staging` | Pre-release integration | Staging (Vercel) |
| `feat/*` | Feature branches | PR previews (Vercel) |
| `fix/*` | Bug fixes | PR previews (Vercel) |

- Open a PR from `feat/*` or `fix/*` → `staging` for review.
- Merge `staging` → `main` for production release.
- Direct pushes to `main` are restricted to merges only.

## Local Development Setup

**Time to first run: ~10 minutes**

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Docker)

### 1. Clone & install

```bash
git clone https://github.com/<org>/wit-app.git
cd wit-app
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
# Local PostgreSQL — create the database first (see step 3)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wit_dev"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set up the database

**Option A — local PostgreSQL:**

```bash
createdb wit_dev
npx prisma migrate dev
```

**Option B — Docker:**

```bash
docker run -d \
  --name wit-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=wit_dev \
  -p 5432:5432 \
  postgres:15
npx prisma migrate dev
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the Wit landing page.

Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

### 5. Verify everything works

```bash
npm run lint        # ESLint
npx tsc --noEmit    # TypeScript
npm run build       # Production build
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL (used for redirects, CORS) |
| `NODE_ENV` | No | `development` / `production` / `test` |

See `.env.example` for a full template with comments.

## CI/CD Pipeline

Two GitHub Actions workflows run on every push:

### `.github/workflows/ci.yml`
Runs on all branches and PRs:
1. **Lint & Type Check** — ESLint + `tsc --noEmit`
2. **Tests** — `npm test` (when test suite exists)
3. **Build** — `npm run build` (catches build-time errors)

### `.github/workflows/deploy.yml`
Runs on pushes to `main` and `staging`:
- Push to `staging` → deploys to Vercel staging environment
- Push to `main` → deploys to Vercel production (`--prod`)

### Required GitHub Secrets

Set these in **GitHub → Settings → Secrets → Actions**:

| Secret | How to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel project → Settings → General |
| `VERCEL_PROJECT_ID` | Vercel project → Settings → General |
| `DATABASE_URL` | Your Railway / Neon connection string |
| `NEXT_PUBLIC_APP_URL` | Your Vercel production URL |

## Environments

| Environment | Branch | Database | URL |
|---|---|---|---|
| Development | local | `wit_dev` (local) | `localhost:3000` |
| Staging | `staging` | Railway staging DB | `staging.wit.app` (TBD) |
| Production | `main` | Railway prod DB | `wit.app` (TBD) |

## Project Structure

```
wit-app/
├── app/
│   ├── api/
│   │   └── health/       # GET /api/health
│   ├── layout.tsx
│   └── page.tsx          # Hello-world landing page
├── prisma/
│   └── schema.prisma     # Database schema
├── .github/
│   └── workflows/
│       ├── ci.yml        # Lint, typecheck, test, build
│       └── deploy.yml    # Vercel deploy on main/staging
├── .env.example          # Environment variable template
└── README.md
```
