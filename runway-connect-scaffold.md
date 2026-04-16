# Runway Connect — Project Scaffold

A two-sided marketplace connecting fashion models and brands, with an agency-style admin layer.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (access + refresh tokens), bcrypt |
| File Storage | AWS S3 (or Cloudinary as drop-in) |
| Real-time | Socket.io (messaging) |
| Monorepo | npm workspaces |

---

## Project Structure

```
runway-connect/
├── CLAUDE.md                   ← instructions for Claude Code
├── package.json                ← workspace root
├── .env.example
│
├── apps/
│   ├── web/                    ← Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── signup/page.tsx
│   │   │   ├── (model)/
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── profile/page.tsx
│   │   │   │   ├── portfolio/page.tsx
│   │   │   │   └── jobs/page.tsx
│   │   │   ├── (brand)/
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── campaigns/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── discover/page.tsx
│   │   │   │   └── inbox/page.tsx
│   │   │   ├── (admin)/
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── users/page.tsx
│   │   │   │   ├── approvals/page.tsx
│   │   │   │   └── analytics/page.tsx
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/             ← shadcn/ui components
│   │   │   ├── model/
│   │   │   │   ├── ModelCard.tsx
│   │   │   │   └── ModelProfile.tsx
│   │   │   ├── brand/
│   │   │   │   ├── CampaignCard.tsx
│   │   │   │   └── BrandProfile.tsx
│   │   │   └── shared/
│   │   │       ├── Navbar.tsx
│   │   │       └── MessageThread.tsx
│   │   ├── lib/
│   │   │   ├── api.ts          ← typed fetch wrapper
│   │   │   └── auth.ts         ← token helpers
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── api/                    ← Express backend
│       ├── src/
│       │   ├── index.ts        ← server entry
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── models.ts
│       │   │   ├── brands.ts
│       │   │   ├── campaigns.ts
│       │   │   ├── messages.ts
│       │   │   ├── media.ts
│       │   │   └── admin.ts
│       │   ├── middleware/
│       │   │   ├── auth.ts     ← JWT verify + role guard
│       │   │   └── upload.ts   ← multer + S3
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── model.service.ts
│       │   │   ├── campaign.service.ts
│       │   │   └── message.service.ts
│       │   └── lib/
│       │       ├── prisma.ts
│       │       └── socket.ts
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
│
└── packages/
    └── types/                  ← shared TypeScript types
        ├── src/
        │   ├── user.ts
        │   ├── campaign.ts
        │   └── message.ts
        └── package.json
```

---

## Database Schema (Prisma)

```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  MODEL
  BRAND
  ADMIN
}

enum CampaignStatus {
  DRAFT
  OPEN
  CLOSED
  COMPLETED
}

enum ApplicationStatus {
  PENDING
  SHORTLISTED
  ACCEPTED
  REJECTED
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  role         Role
  approved     Boolean   @default(false)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  modelProfile  ModelProfile?
  brandProfile  BrandProfile?
  sentMessages  Message[]     @relation("SentMessages")
  threads       ThreadMember[]
}

model ModelProfile {
  id           String   @id @default(cuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id])
  displayName  String
  bio          String?
  height       Int?     // cm
  bust         Int?
  waist        Int?
  hips         Int?
  shoeSize     Float?
  hairColor    String?
  eyeColor     String?
  location     String?
  instagramUrl String?
  portfolioImages String[]   // S3 URLs
  coverImage   String?
  tags         String[]
  applications Application[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model BrandProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  brandName   String
  industry    String?
  website     String?
  logoUrl     String?
  bio         String?
  location    String?
  campaigns   Campaign[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Campaign {
  id          String          @id @default(cuid())
  brandId     String
  brand       BrandProfile    @relation(fields: [brandId], references: [id])
  title       String
  description String
  budget      String?
  location    String?
  startDate   DateTime?
  endDate     DateTime?
  tags        String[]
  status      CampaignStatus  @default(DRAFT)
  applications Application[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model Application {
  id          String            @id @default(cuid())
  campaignId  String
  campaign    Campaign          @relation(fields: [campaignId], references: [id])
  modelId     String
  model       ModelProfile      @relation(fields: [modelId], references: [id])
  coverNote   String?
  status      ApplicationStatus @default(PENDING)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@unique([campaignId, modelId])
}

model Thread {
  id        String         @id @default(cuid())
  members   ThreadMember[]
  messages  Message[]
  createdAt DateTime       @default(now())
}

model ThreadMember {
  threadId String
  userId   String
  thread   Thread @relation(fields: [threadId], references: [id])
  user     User   @relation(fields: [userId], references: [id])

  @@id([threadId, userId])
}

model Message {
  id        String   @id @default(cuid())
  threadId  String
  thread    Thread   @relation(fields: [threadId], references: [id])
  senderId  String
  sender    User     @relation("SentMessages", fields: [senderId], references: [id])
  body      String
  createdAt DateTime @default(now())
}
```

---

## API Routes

```
POST   /api/auth/register          Body: { email, password, role }
POST   /api/auth/login             Body: { email, password }
POST   /api/auth/refresh

GET    /api/models                 Query: ?location=&tags=&page=
GET    /api/models/:id
PUT    /api/models/me              (model auth required)
POST   /api/models/me/portfolio    Upload image

GET    /api/brands/:id
PUT    /api/brands/me              (brand auth required)

GET    /api/campaigns              Query: ?status=open&tags=
POST   /api/campaigns              (brand auth required)
GET    /api/campaigns/:id
PUT    /api/campaigns/:id          (brand auth required)
DELETE /api/campaigns/:id

POST   /api/campaigns/:id/apply    (model auth required)
GET    /api/campaigns/:id/applications   (brand auth required)
PUT    /api/applications/:id/status      (brand auth required)

GET    /api/threads                (auth required)
POST   /api/threads                Body: { recipientId }
GET    /api/threads/:id/messages
POST   /api/threads/:id/messages   Body: { body }

GET    /api/admin/users            (admin required)
PUT    /api/admin/users/:id/approve
DELETE /api/admin/users/:id
GET    /api/admin/stats
```

---

## Key Files to Generate First

When opening this in Claude Code, build in this order:

1. **Workspace root** — `package.json` with workspaces, `.env.example`
2. **`packages/types`** — shared User, Campaign, Message interfaces
3. **`apps/api`** — Prisma schema → `npx prisma migrate dev` → Express routes → auth middleware
4. **`apps/web`** — Next.js install → auth pages → role-based layouts → dashboards

---

## Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/runway_connect"

# Auth
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# File Storage (pick one)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET=""

# OR Cloudinary
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# App
PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## CLAUDE.md (paste into project root)

```markdown
# Runway Connect

A two-sided fashion marketplace: models build profiles and apply to brand campaigns; brands post campaigns and discover talent; admins oversee the platform.

## Architecture
- `apps/web` — Next.js 14 frontend (App Router, TypeScript, Tailwind, shadcn/ui)
- `apps/api` — Node.js/Express backend (TypeScript, Prisma, JWT, Socket.io)
- `packages/types` — shared TypeScript interfaces used by both apps
- Database: PostgreSQL via Prisma ORM
- File storage: AWS S3 (or Cloudinary)

## User Roles
- **MODEL** — creates a profile with measurements, portfolio images, and tags; browses and applies to campaigns; messages brands
- **BRAND** — creates a brand profile; posts campaigns; browses model profiles; accepts/rejects applications; messages models
- **ADMIN** — approves new accounts; manages all users; views platform analytics

## Auth
JWT with access token (15 min) + refresh token (7 days). Role is encoded in the token payload. Route-level middleware: `requireAuth`, `requireRole('MODEL' | 'BRAND' | 'ADMIN')`.

## Running locally
```bash
npm install          # install all workspaces
cd apps/api && npx prisma migrate dev
npm run dev          # starts both api (port 4000) and web (port 3000) concurrently
```

## Code conventions
- TypeScript strict mode everywhere
- Prisma for all DB access — no raw SQL
- REST API — no GraphQL
- Error responses: `{ error: string, code?: string }`
- Tailwind for all styling — no CSS modules or styled-components
- shadcn/ui for all UI primitives
```

---

## Getting Started with Claude Code

```bash
# 1. Create the project
mkdir runway-connect && cd runway-connect

# 2. Open Claude Code and paste CLAUDE.md into the project root
# Then ask Claude Code:

"Set up the monorepo workspace with npm workspaces.
Create the packages/types package first, then scaffold the apps/api Express
server with Prisma connected to PostgreSQL, then scaffold the apps/web
Next.js 14 app with Tailwind and shadcn/ui. Use the schema and route list
from CLAUDE.md as the source of truth."
```
