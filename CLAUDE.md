# Kailani — Fashion Marketplace

A two-sided marketplace connecting fashion models and brands, with an agency-style admin layer.

## What This App Does
- **Models** build profiles with measurements, portfolio images, and tags; browse and apply to brand campaigns; message brands
- **Brands** create brand profiles; post campaigns; browse and discover models; accept/reject applications; message models
- **Admins** approve new accounts; manage all users; view platform analytics

---

## Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL via Neon |
| Auth | JWT (access 15min + refresh 7d tokens), bcrypt, role-based |
| File Storage | Cloudinary (images, portfolio uploads) |
| Email | Resend (verification, password reset) |
| Real-time | Socket.io (messaging — already installed) |
| Monorepo | npm workspaces |

---

## Monorepo Structure

```
kailani/
├── CLAUDE.md
├── package.json              ← workspace root, run everything from here
├── apps/
│   ├── web/                  ← Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── (auth)/       ← login, signup pages
│   │   │   ├── (model)/      ← model dashboard, profile, portfolio, jobs
│   │   │   ├── (brand)/      ← brand dashboard, campaigns, discover, inbox
│   │   │   └── (admin)/      ← admin panel, users, approvals, analytics
│   │   ├── components/
│   │   └── lib/
│   └── api/                  ← Node.js/Express backend
│       ├── src/
│       │   ├── routes/       ← auth, models, brands, campaigns, messages, media, admin
│       │   ├── middleware/   ← JWT auth, role guard, Cloudinary upload
│       │   ├── services/     ← auth, model, campaign, message, email
│       │   └── lib/          ← prisma client, socket.io
│       └── prisma/
│           └── schema.prisma
└── packages/
    └── types/                ← shared TypeScript interfaces (User, Campaign, Message)
```

---

## User Roles

- **MODEL** — profile with measurements, portfolio images, tags; applies to campaigns; messages brands
- **BRAND** — brand profile; posts campaigns; discovers models; manages applications; messages models
- **ADMIN** — approves/bans accounts; manages all users; views platform analytics

---

## Auth Flow

JWT with access token (15 min) + refresh token (7 days). Role is encoded in the token payload.

Route-level middleware:
- `requireAuth` — verifies JWT
- `requireRole('MODEL' | 'BRAND' | 'ADMIN')` — checks role in token

---

## API Routes

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/models               ?location=&tags=&page=
GET    /api/models/:id
PUT    /api/models/me
POST   /api/models/me/portfolio  (Cloudinary upload)

GET    /api/brands/:id
PUT    /api/brands/me

GET    /api/campaigns            ?status=open&tags=
POST   /api/campaigns
GET    /api/campaigns/:id
PUT    /api/campaigns/:id
DELETE /api/campaigns/:id
POST   /api/campaigns/:id/apply
GET    /api/campaigns/:id/applications
PUT    /api/applications/:id/status

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

## Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://kailani-web.vercel.app |
| Backend API | Railway | https://kailaniapi-production.up.railway.app |
| Database | Neon (PostgreSQL) | via DATABASE_URL env var |
| Images | Cloudinary | cloud name: dt85sew8i |
| Email | Resend | from: onboarding@resend.dev |

**Auto-deploy:** Both Vercel and Railway are connected to the `main` branch on GitHub. Every `git push` to `main` triggers a new deployment automatically.

---

## Environment Variables

### apps/api/.env
```
DATABASE_URL=                    ← Neon PostgreSQL connection string
JWT_SECRET=                      ← random 32-char string
JWT_REFRESH_SECRET=              ← different random 32-char string
CLOUDINARY_CLOUD_NAME=dt85sew8i
CLOUDINARY_API_KEY=              ← from Cloudinary dashboard
CLOUDINARY_API_SECRET=           ← from Cloudinary dashboard
RESEND_API_KEY=                  ← from Resend dashboard
EMAIL_FROM=onboarding@resend.dev
FRONTEND_URL=https://kailani-web.vercel.app
NODE_ENV=production
PORT=4000
```

### apps/web/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:4000   ← local dev
```

### Vercel Environment Variables (production)
```
NEXT_PUBLIC_API_URL=https://kailaniapi-production.up.railway.app
```

---

## Running Locally

```bash
npm install                          # install all workspaces
cd apps/api && npx prisma migrate dev  # run migrations (first time only)
cd ../..
npm run dev                          # starts api (port 4000) + web (port 3000)
```

---

## What's Working ✅

- User registration and login (model, brand, admin roles)
- JWT authentication with role-based access
- Model profile creation and editing
- Portfolio image uploads via Cloudinary
- Email verification and password reset via Resend
- Full deployment on Vercel + Railway
- Database on Neon PostgreSQL

## Still To Build ⬜

- Real-time messaging with Socket.io (installed, needs wiring up)
- Campaign posting and discovery
- Model search and filtering
- Application flow (apply, shortlist, accept, reject)
- Admin approval dashboard
- Analytics page
- Custom domain (when ready to launch)
- Swap Socket.io for Pusher (when scaling)

---

## Code Conventions

- TypeScript strict mode everywhere
- Prisma for all DB access — no raw SQL
- REST API — no GraphQL
- Error responses: `{ error: string, code?: string }`
- Tailwind for all styling — no CSS modules
- shadcn/ui for all UI primitives
- All API calls in frontend use `process.env.NEXT_PUBLIC_API_URL` — never hardcode localhost
