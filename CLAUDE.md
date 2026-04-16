# Kailani

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
cp .env.example .env   # fill in your values
npm install            # install all workspaces
cd apps/api && npx prisma migrate dev
npm run dev            # starts both api (port 4000) and web (port 3000) concurrently
```

## Code conventions
- TypeScript strict mode everywhere
- Prisma for all DB access — no raw SQL
- REST API — no GraphQL
- Error responses: `{ error: string, code?: string }`
- Tailwind for all styling — no CSS modules or styled-components
- shadcn/ui for all UI primitives
