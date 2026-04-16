# Kailani — Fashion Marketplace

A two-sided marketplace connecting fashion models, brands, and photographers. Core mechanic: swipe-based discovery with verified profiles and real-time messaging.

---

## What This App Does

- **Models** build rich profiles with measurements, rates, portfolio images, availability, and tags. They swipe on brand campaigns and get discovered by brands and photographers.
- **Brands** post campaigns, swipe on models, build shortlists, and hire talent directly through the platform.
- **Photographers** build portfolios and connect with both models (test shoots) and brands (campaigns).
- **Admins** verify accounts, approve profiles, manage users, and oversee platform health.

---

## Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL via Neon |
| Auth | JWT (access 15min + refresh 7d), bcrypt, role-based |
| File Storage | Cloudinary (images, portfolios) |
| Email | Resend (verification, password reset, notifications) |
| Real-time | Socket.io (dev only — MUST swap to Pusher before going live) |
| Monorepo | npm workspaces |

---

## ⚠️ CRITICAL PRE-LAUNCH: SWAP SOCKET.IO FOR PUSHER

**Before going live with real users, Socket.io MUST be replaced with Pusher.**

Why: Socket.io on a single Railway server cannot handle concurrent connections at scale. Pusher is a managed real-time service that scales automatically.

Steps when ready:
1. Create a Pusher account at pusher.com
2. Create a new app, select US East region
3. Install: `npm install pusher pusher-js` in api and web respectively
4. Replace all `io.emit(...)` calls with `pusher.trigger(...)`
5. Replace all `socket.on(...)` calls with `channel.bind(...)`
6. Remove Socket.io from the Dockerfile and dependencies

The business logic stays identical — only the transport layer changes.

---

## Monorepo Structure

```
kailani/
├── CLAUDE.md
├── package.json              ← workspace root
├── apps/
│   ├── web/                  ← Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── (auth)/       ← login, signup, forgot-password
│   │   │   ├── (model)/      ← dashboard, profile, portfolio, jobs, swipe
│   │   │   ├── (brand)/      ← dashboard, campaigns, discover, inbox, shortlists
│   │   │   ├── (photographer)/ ← dashboard, portfolio, availability
│   │   │   └── (admin)/      ← users, approvals, analytics, verification queue
│   │   ├── components/
│   │   └── lib/
│   └── api/                  ← Node.js/Express backend
│       ├── src/
│       │   ├── routes/       ← auth, models, brands, photographers, campaigns, messages, media, admin, swipe
│       │   ├── middleware/   ← JWT auth, role guard, Cloudinary upload, rate limiting, Zod validation
│       │   ├── services/     ← auth, model, campaign, message, email, swipe, notification
│       │   └── lib/          ← prisma client, socket.io (temp), pusher (when ready)
│       └── prisma/
│           └── schema.prisma
└── packages/
    └── types/                ← shared TypeScript interfaces
```

---

## User Roles

- **MODEL** — profile with measurements, portfolio, rates, availability; swipes on campaigns; gets discovered
- **BRAND** — brand profile; posts campaigns; swipes on models; manages shortlists and applications
- **PHOTOGRAPHER** — portfolio; connects with models and brands; availability calendar
- **ADMIN** — approves/bans accounts; manages verification queue; views platform analytics

---

## Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://kailani-web.vercel.app |
| Backend API | Railway | https://kailaniapi-production.up.railway.app |
| Database | Neon (PostgreSQL) | via DATABASE_URL env var |
| Images | Cloudinary | cloud name: dt85sew8i |
| Email | Resend | from: onboarding@resend.dev (update to custom domain before launch) |

Auto-deploy: Both Vercel and Railway watch the `main` branch. Every `git push` to `main` triggers a new deployment automatically.

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

# Add before launch:
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SENTRY_DSN=
ALGOLIA_APP_ID=
ALGOLIA_API_KEY=
```

### apps/web/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:4000

# Add before launch:
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=
```

### Vercel Environment Variables (production)
```
NEXT_PUBLIC_API_URL=https://kailaniapi-production.up.railway.app
```

---

## API Routes

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-email

GET    /api/models               ?location=&tags=&height=&page=
GET    /api/models/:id
PUT    /api/models/me
POST   /api/models/me/portfolio
DELETE /api/models/me/portfolio/:imageId

GET    /api/brands/:id
PUT    /api/brands/me

GET    /api/photographers/:id
PUT    /api/photographers/me
POST   /api/photographers/me/portfolio

GET    /api/campaigns            ?status=open&tags=&location=
POST   /api/campaigns
GET    /api/campaigns/:id
PUT    /api/campaigns/:id
DELETE /api/campaigns/:id
POST   /api/campaigns/:id/apply
GET    /api/campaigns/:id/applications
PUT    /api/applications/:id/status

GET    /api/swipe/queue          ← next cards to show current user
POST   /api/swipe/like           Body: { targetId, targetType }
POST   /api/swipe/pass           Body: { targetId, targetType }
GET    /api/swipe/matches        ← mutual likes

GET    /api/threads
POST   /api/threads
GET    /api/threads/:id/messages
POST   /api/threads/:id/messages

GET    /api/admin/users
PUT    /api/admin/users/:id/approve
PUT    /api/admin/users/:id/verify
DELETE /api/admin/users/:id
GET    /api/admin/verification-queue
GET    /api/admin/stats
```

---

## Feature Roadmap

### Phase 1 — Complete profiles (build now)
- [ ] Rich model profiles: measurements (height, bust, waist, hips, shoe size), hair/eye color, rates, tags, look book, bio
- [ ] Brand profiles: industry, website, past campaigns, brand aesthetic
- [ ] Photographer role: add PHOTOGRAPHER to Role enum, create PhotographerProfile model, add routes
- [ ] Portfolio management: reorder images, set cover photo, delete images
- [ ] Availability calendar: models and photographers mark open/busy dates

### Phase 2 — Swipe discovery
- [ ] Swipe queue API: serve cards based on role (models see campaigns, brands see models)
- [ ] Like/pass recording with match detection
- [ ] Swipe UI: card stack with swipe gestures (use framer-motion)
- [ ] Match notification when both sides like each other
- [ ] "You matched!" screen opens messaging thread automatically

### Phase 3 — Account verification
- [ ] ID upload on signup (Cloudinary, private folder)
- [ ] Admin verification queue dashboard
- [ ] Verified badge on approved profiles (tiered: New, Rising, Elite, Agency)
- [ ] Rejection flow with reason sent via email
- [ ] Auto-flag accounts with no portfolio after 7 days

### Phase 4 — Messaging
- [ ] Real-time message delivery (Socket.io now, Pusher before launch)
- [ ] Read receipts
- [ ] Typing indicators
- [ ] Message notifications via Resend email + Twilio SMS
- [ ] ⚠️ SWAP SOCKET.IO FOR PUSHER before launch

### Phase 5 — Campaigns
- [ ] Campaign posting with rich details (budget, dates, location, mood board images)
- [ ] Application flow: apply → shortlist → accept/reject
- [ ] Campaign status management (draft → open → closed → completed)
- [ ] Campaign discovery page with filters

### Phase 6 — Trust and reputation
- [ ] Post-job reviews: both sides rate each other after a completed campaign
- [ ] Saved boards: brands save models to private shortlist boards
- [ ] Report/block users
- [ ] Profile view counts visible to model

### Phase 7 — Pre-launch platform additions
- [ ] **Pusher** — replace Socket.io for scalable real-time (pusher.com)
- [ ] **Stripe** — payments: brands pay models, subscription tiers (stripe.com)
- [ ] **Google/Apple OAuth** — social login to reduce signup friction
- [ ] **Sentry** — error monitoring in production (sentry.io)
- [ ] **Twilio** — SMS notifications for matches and messages (twilio.com)
- [ ] **Algolia** — powerful model search by tags, location, measurements (algolia.com)
- [ ] **PostHog** — product analytics, understand user behavior (posthog.com)
- [ ] **Custom domain** — replace kailani-web.vercel.app with real domain
- [ ] **Custom email domain** — replace onboarding@resend.dev with noreply@kailani.com
- [ ] **Content moderation** — auto-flag inappropriate images (Cloudinary AI or AWS Rekognition)
- [ ] **GDPR/Terms** — privacy policy and terms of service pages

### Phase 8 — Advanced and scale
- [ ] AI matching: recommend models to brands based on past hires and aesthetic
- [ ] Mobile app: React Native (shares types and API with web)
- [ ] Analytics dashboard: views, match rate, hire rate per profile
- [ ] Premium subscription tiers: featured placement, unlimited swipes, analytics
- [ ] Agency accounts: manage multiple models under one agency profile
- [ ] Contract generation: e-sign via DocuSign or HelloSign

---

## Security Checklist

### Completed
- [x] Rate limiting on auth routes (10 req / 15 min)
- [x] File type and size validation on uploads (jpg/png/webp, max 5MB)
- [x] ADMIN role cannot be created via public signup
- [x] CORS locked to FRONTEND_URL
- [x] Zod input validation on all request bodies
- [x] JWT with short-lived access tokens (15 min)
- [x] .env files in .gitignore
- [x] Migration files committed to git

### Before launch
- [ ] Add Sentry for production error tracking
- [ ] Set up uptime monitoring (Better Uptime or Railway built-in)
- [ ] Penetration test auth routes
- [ ] GDPR privacy policy page
- [ ] Terms of service page
- [ ] Content moderation for uploaded images

---

## Running Locally

```bash
npm install
cd apps/api && npx prisma migrate dev
cd ../..
npm run dev                  # starts api (4000) + web (3000)
```

---

## Code Conventions

- TypeScript strict mode everywhere
- Prisma for all DB access — no raw SQL
- REST API — no GraphQL
- Error responses: `{ error: string, code?: string }`
- Tailwind for all styling — no CSS modules
- shadcn/ui for all UI primitives
- All API calls use `process.env.NEXT_PUBLIC_API_URL` — never hardcode localhost
- Commit at end of every working session
- Never commit .env files
