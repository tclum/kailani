# Kailani

A two-sided fashion marketplace connecting models and brands, with an agency-style admin layer.

- **Models** build profiles, upload portfolio images, and apply to brand campaigns
- **Brands** post campaigns, browse talent, and manage applications
- **Admins** approve accounts and monitor platform analytics

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (access + refresh tokens), bcrypt |
| Real-time | Socket.io (messaging) |
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
DATABASE_URL="postgresql://youruser:yourpassword@localhost:5432/kailani"
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
