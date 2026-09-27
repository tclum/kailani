# Kailani

A two-sided fashion marketplace connecting models and brands, with an agency-style admin layer.

- **Models** build profiles, upload portfolio images, and apply to brand campaigns
- **Brands** post campaigns, browse talent, and manage applications
- **Admins** approve accounts and monitor platform analytics

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui — Vercel project `kailani` at kailani.forpono.com |
| Backend | Node.js, Express, TypeScript — Vercel project `kailani-api` at kailani-api.forpono.com (single serverless function) |
| ORM | Prisma |
| Database | Supabase project `kailani` (ref rpgxwfqqptycdpgylauh) |
| Auth | JWT (access + refresh tokens), bcrypt |
| Real-time | REST polling (open thread 3s, thread list 15s, unread badge 30s) |
| Monorepo | npm workspaces |

---

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a hosted connection string)

---

## Running locally

### 1. Clone and install

```bash
git clone git@github.com:tclum/kailani.git
cd kailani
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in at minimum:

```bash
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="any-long-random-string"
JWT_REFRESH_SECRET="another-long-random-string"
```

S3/Cloudinary fields can be left blank for now — file uploads will return placeholder URLs.

### 3. Run the database migration

```bash
cd apps/api
npx prisma migrate dev --name init
```

### 4. Start both servers

From the project root:

```bash
npm run dev
```

| Service | URL |
|---|---|
| Web (Next.js) | http://localhost:3000 |
| API (Express) | http://localhost:4000 |

---

## First-time setup

1. Go to `http://localhost:3000/signup` and create a **Model** account and a **Brand** account
2. New accounts require admin approval before they can use the platform
3. Create an admin user by opening Prisma Studio and updating a user row directly:

```bash
cd apps/api
npx prisma studio
```

Set `role = ADMIN` and `approved = true` on your user, then log in at `/login`. You'll be routed to `/admin/dashboard` where you can approve other accounts.

---

## Demo mode

A build of the web app that runs entirely in the browser, for showing Kailani as a portfolio piece without deploying the API or a database.

**What it is.** When the web app is built with `NEXT_PUBLIC_DEMO_MODE=1`, every call through `apiFetch`/`apiUpload` (`apps/web/lib/api.ts`) is answered by an in-browser fake backend in `apps/web/lib/demo/` instead of the network. Nothing is sent to `NEXT_PUBLIC_API_URL`. `/login` shows an "Enter the demo" role picker in place of the credential form, and `/signup`, `/forgot-password`, and `/reset-password` redirect to `/login`. A banner on every page reads "Demo — fictional data, stored only in your browser." With the flag unset, the app behaves exactly as before.

**Build it.**

```bash
NEXT_PUBLIC_DEMO_MODE=1 npm run build --workspace=apps/web
cd apps/web && npx next start
```

The API, Prisma, and Supabase are not needed. `NEXT_PUBLIC_NEWSAPI_KEY` is never read in demo mode (`/news` shows fixture articles).

**What is fictional.** All people, brands, campaigns, messages, reviews, and news articles come from `apps/web/lib/demo/fixtures/` and are invented. Names and some bios are adapted from `apps/api/prisma/seed.ts` with every real brand, agency, and publication removed. Images are from picsum.photos, randomuser.me, and images.unsplash.com.

**How it works.**

- `lib/demo/routes.mjs`: the route table (method + path pattern → handler name) and the `DEFERRED` list of endpoints owned by later slices.
- `lib/demo/resolve.mjs`: route matching, shared by the router and the coverage check.
- `lib/demo/router.ts` + `lib/demo/handlers/*.ts`: the fake API. Handlers return the same response shapes as `apps/api/src/routes`, or throw `{ error }` like the real API. Unmatched and deferred routes answer "Not available in the demo".
- `lib/demo/store.ts`: one state object, seeded from the fixtures and saved to `localStorage` under `kailani_demo_state_v1`. If storage is unavailable, the demo runs in memory for the session. **Reset demo** in the navbar restores the fixtures.
- Sign-in issues an unsigned token whose payload is `{ userId, role, exp }` (one year out), so `lib/auth.ts` works unchanged.
- Messaging: messaging a demo user writes a scripted reply dated 2 to 4 seconds in the future. The inbox's normal polling picks it up.
- `lib/demo/flag.ts` (`isDemo()`) is the only reader of `NEXT_PUBLIC_DEMO_MODE`.

**Roles enabled so far.** Model (Kaia Mercer), plus the public pages: `/`, `/campaigns/[id]`, `/community`, `/news`, `/tutorials`, `/comp-card/[userId]`, `/tools/rate-calculator`. Brand, Photographer, and Admin come in later slices; their `/me` and admin endpoints are listed in `DEFERRED`.

**Accepted gaps.**

- Uploads (portfolio, profile photo, ID verification) become in-memory object URLs and are not persisted. After a reload the image falls back to the fixture image.
- Spotlights ignore the real API's current-week filter, so the fixture spotlights never expire.
- The comp card draws images with `crossOrigin="anonymous"`. Only the demo model's portrait is served from a host that sends CORS headers (Unsplash), so other models' public comp cards show a broken hero portrait (randomuser.me sends no CORS header).
- Known and out of scope (pre-existing, found during slice 1): `parseJwt` decodes base64url with plain `atob`; React hydration errors #418/#423/#425 on `/` and `/model/profile` (also on flag-off builds); `SwipeStack` has no keyboard shortcuts though CLAUDE.md says it does; the admin spotlights page double-stringifies its request body.

**Coverage check.** Every API path the web app calls must have a demo route or a `DEFERRED` entry:

```bash
node apps/web/scripts/check-demo-coverage.mjs             # exits nonzero on any gap
node apps/web/scripts/check-demo-coverage.mjs --selftest  # proves each check can fail
```

It also fails when a file outside `apps/web/lib/` calls `fetch()` against the API base, when a `DEFERRED` entry falls outside the brand/photographer/admin prefixes, when a route names an unregistered handler, or when any file other than `lib/demo/flag.ts` reads `NEXT_PUBLIC_DEMO_MODE`.

---

## Project structure

```
kailani/
├── apps/
│   ├── api/                  # Express backend
│   │   ├── prisma/           # Database schema + migrations
│   │   └── src/
│   │       ├── routes/       # auth, models, brands, campaigns, messages, admin
│   │       ├── middleware/   # JWT auth, file upload
│   │       └── services/     # Business logic
│   └── web/                  # Next.js 14 frontend
│       ├── app/
│       │   ├── (auth)/       # Login, signup
│       │   ├── (model)/      # Model dashboard, profile, portfolio, jobs
│       │   ├── (brand)/      # Brand dashboard, campaigns, discover, inbox
│       │   └── (admin)/      # Admin dashboard, users, approvals, analytics
│       ├── components/
│       │   ├── ui/           # shadcn/ui primitives
│       │   ├── model/        # ModelCard, ModelProfile
│       │   ├── brand/        # CampaignCard, BrandProfile
│       │   └── shared/       # Navbar, MessageThread
│       └── lib/              # API fetch wrapper, auth token helpers
└── packages/
    └── types/                # Shared TypeScript interfaces
```

---

## API reference

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh

GET    /api/models               ?location= &tags= &page=
GET    /api/models/:id
PUT    /api/models/me
POST   /api/models/me/portfolio

GET    /api/brands/:id
PUT    /api/brands/me

GET    /api/campaigns            ?status= &tags=
POST   /api/campaigns
GET    /api/campaigns/:id
PUT    /api/campaigns/:id
DELETE /api/campaigns/:id

POST   /api/campaigns/:id/apply
GET    /api/campaigns/:id/applications
PUT    /api/campaigns/applications/:id/status

GET    /api/threads
POST   /api/threads
GET    /api/threads/:id/messages
POST   /api/threads/:id/messages

GET    /api/admin/users
PUT    /api/admin/users/:id/approve
DELETE /api/admin/users/:id
GET    /api/admin/stats
```

---

## Quick smoke test

```bash
# Health check
curl http://localhost:4000/health

# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"model@test.com","password":"password123","role":"MODEL"}'
```
