# Kailani — Fashion Marketplace

A two-sided marketplace connecting fashion models, brands, and photographers. Core mechanic: swipe-based discovery with verified profiles, real-time messaging, and a trusted community built on verified experience sharing.

---

## What This App Does

- **Models** build rich profiles, get discovered by brands and photographers, apply to campaigns, and grow their career through education and community.
- **Brands** post campaigns, discover and hire verified talent, and build their reputation through transparent working relationships.
- **Photographers** connect with models and brands, showcase their portfolio, and find creative collaborators.
- **Admins** verify accounts, moderate content, manage the platform, and maintain community standards.

---

## Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript, Prisma ORM (deployed as one Vercel serverless function) |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (access 15min + refresh 7d), bcrypt, role-based |
| File Storage | Cloudinary (images, portfolios, ID verification) |
| Email | Resend (verification, password reset, notifications) |
| Real-time | REST polling (inbox 3s, thread list 15s, unread count 30s) |
| Monorepo | npm workspaces |

---

## Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel project `kailani` | https://kailani.forpono.com |
| Backend API | Vercel project `kailani-api` | https://kailani-api.forpono.com |
| Database | Supabase project `kailani` (ref rpgxwfqqptycdpgylauh) | via DATABASE_URL / DIRECT_URL |
| Images | Cloudinary | cloud name: dt85sew8i |
| Email | Resend | from: onboarding@resend.dev |

---

## User Roles

- **MODEL** — rich profile, portfolio, measurements, rates, availability; swipes on campaigns; gets discovered
- **BRAND** — brand profile; posts campaigns; swipes on models; manages shortlists and applications
- **PHOTOGRAPHER** — portfolio; connects with models and brands; availability calendar
- **ADMIN** — approves/bans accounts; manages verification queue; moderates community; views analytics

---

## Feature Roadmap

### Phase 1 — Rich profiles ✅ COMPLETE
- [x] Model profiles: measurements, rates, tags, look book, bio, availability
- [x] Brand profiles: industry, website, logo, bio, location
- [x] Photographer role and profiles
- [x] Portfolio management: upload, reorder, set cover, delete
- [x] Profile image (headshot/avatar)
- [x] Availability calendar

### Phase 2 — Swipe discovery ✅ COMPLETE
- [x] Swipe queue API (models see campaigns, brands see models)
- [x] Like/pass recording with match detection
- [x] Swipe UI with framer-motion card stack
- [x] Match overlay with messaging CTA
- [x] Keyboard shortcuts for desktop
- [x] Discover link in navbar for all roles

### Phase 3 — Account verification ✅ COMPLETE
- [x] ID upload on signup
- [x] Admin verification queue with lightbox
- [x] Approved vs verified distinction
- [x] Verified badge on profiles
- [x] Rejection flow with reason via email
- [x] Get Verified navbar link for unverified users

### Phase 4 — Real-time messaging ✅ COMPLETE
- [x] REST polling for new messages (3s per open thread, 15s per thread list, 30s per unread badge)
- [x] Read receipts (`POST /api/threads/:id/read` after each poll picks up new messages)
- [x] Unread count badge on navbar
- [x] Mobile-friendly split panel inbox
- [x] Cross-role messaging (model ↔ brand ↔ photographer)

### Phase 5 — Campaigns ✅ COMPLETE
- [x] Campaign discovery for models with filters
- [x] Campaign management for brands
- [x] Application flow: apply → shortlist → accept/reject
- [x] Acceptance/rejection emails via Resend
- [x] Model job tracking page
- [x] Public campaign detail pages

### Phase 6 — Trust and reputation ✅ COMPLETE
- [x] Post-job star ratings and reviews
- [x] Saved boards (Pinterest-style) for brands
- [x] Report and block users
- [x] Admin reports queue
- [x] Blocked users excluded from swipe queue and search

### Completed extras
- [x] Forgot password / reset password flow
- [x] Approval gating (unapproved models hidden from brands)
- [x] Beautiful 3-step signup with role selection
- [x] Auto-create profile records on signup
- [x] Rate limiting on auth routes
- [x] Zod input validation
- [x] CORS lockdown
- [x] File type/size validation on uploads

---

## Phase 7 — Verified experience sharing ✅ COMPLETE

Design principle: only people who completed a confirmed job together can share their experience. This makes all feedback credible and eliminates fake reviews.

- [x] Structured review dimensions per role (not just star + comment)
  - Model: Communication · Punctuality · Professionalism · Creative collaboration · Would work again
  - Brand: Communication · Payment promptness · Brief clarity · Respect on set · Would work again
  - Photographer: Technical skill · Communication · Punctuality · Creative direction · Would work again
- [x] 48-hour response window before review goes public — reviewee can add their perspective
- [x] Auto-publish logic: reviews go public after deadline regardless of response
- [x] Review summary on profile: dimension bars, avg rating, % would work again
- [x] "Working together" community feed at /community — tied to completed campaigns
- [x] Red flag detection: auto-alert admin when 3+ reviews mention same keyword (late, payment, unsafe, unprofessional, harassment, inappropriate)
- [x] "Community Flagged" badge on profiles + admin flagged-users queue with clear-flag action
- [x] Campaign completion flow: brand marks campaign COMPLETED, emails all accepted models, unlocks reviews
- [x] Own profile view: "This is how others see your profile" banner with completeness indicator and suggestions
- [x] "View My Profile" button on all three profile edit pages (model, brand, photographer)

---

## Phase 8 — Content platform ✅ COMPLETE

### Education + tutorials
- [x] Tutorials page at /tutorials (modeling, beauty, photography, industry guides, brand resources, career development)
- [ ] Q&A forums: ask industry experts, searchable by topic (future)
- [ ] Mentorship program: experienced professionals mentor newcomers (future)

### Community
- [x] Community feed at /community — posts, tips, behind-the-scenes from verified users (ties into Phase 7 completed campaigns)
- [x] News feed at /news — industry news and platform updates
- [ ] Events and meetups: local casting calls, industry events calendar (future)
- [ ] Weekly challenges: photo contests with community voting (future)

### Tools and utilities
- [x] **Comp card generator**: two-page professional PDF comp card from profile data — page 1 (headshot, measurements, tags), page 2 (credits, skills); shareable public link at /comp-card/[userId]; subtle Kailani watermark
- [x] Rate calculator at /tools/rate-calculator — fair market rates by location, experience level, and usage type
- [ ] Mood board builder: brands build visual briefs for campaigns using saved images (future)
- [ ] Casting calendar: industry events, open calls, seasonal campaign dates (future)
- [ ] AI photo feedback: portfolio scoring and posing/lighting suggestions (premium feature, future)
- [ ] Contract templates: model release forms, usage rights agreements (future)

### Discovery and inspiration
- [x] Spotlights at /admin/spotlights (admin management) + homepage display — model/brand/photographer of the week
- [ ] Trending looks feed: editorial inspiration curated from platform content (future)
- [ ] Behind the scenes: shoot day content shared by users (future)

### Completed extras (Phase 8 session)
- [x] Comprehensive model profile fields: physical attributes (height, weight, build, hair, eyes, skin tone, playing age), measurements (bust, waist, hips, shoe), credits (TV, film, modeling, commercial), skills, languages, education, union status, representation, website
- [x] UI/UX polish: skeleton loaders, sonner toast notifications, framer-motion page transitions, consistent empty states, mobile hamburger nav
- [x] Always-visible portfolio panel on public profiles: 55/45 split layout, sticky right panel, spring animation, full-screen lightbox, brand CTAs pinned to bottom, own-profile management overlays
- [x] Interactive portfolio gallery with lightbox: masonry grid, right-side sliding panel, keyboard nav, URL sync (?photo=N), cover badge, management mode
- [x] Navigation links for all content: navbar (all roles), role dashboards, homepage cards

---

## Phase 9 — Pre-launch platforms

- [ ] **Pusher or SSE** — swap REST polling for a push channel once traffic grows (pusher.com)
- [ ] **Stripe** — brand payments to models, subscription tiers (stripe.com)
- [ ] **Google/Apple OAuth** — social login to reduce signup friction
- [ ] **Sentry** — error monitoring in production (sentry.io)
- [ ] **Twilio** — SMS notifications for matches and messages (twilio.com)
- [ ] **Algolia** — powerful model search by tags, location, measurements (algolia.com)
- [ ] **PostHog** — product analytics, understand user behavior (posthog.com)
- [x] **Custom domain** — kailani.forpono.com (web), kailani-api.forpono.com (api)
- [ ] **Custom email domain** — replace onboarding@resend.dev with noreply@kailani.com
- [ ] **Content moderation** — auto-flag inappropriate images (Cloudinary AI)
- [ ] **PWA support** — installable on iPhone/Android from browser
- [ ] **GDPR/Terms** — privacy policy and terms of service pages

---

## Phase 10 — Scale features

- [ ] AI matching: recommend models to brands based on past hires and aesthetic
- [ ] Mobile app: React Native (shares types and API with web)
- [ ] Analytics dashboard: views, match rate, hire rate per profile
- [ ] Premium subscription tiers: featured placement, unlimited swipes, analytics
- [ ] Agency accounts: manage multiple models under one agency profile
- [ ] Contract generation and e-signing

---

## Security Checklist

### Completed ✅
- [x] Rate limiting on auth routes (10 req / 15 min; best-effort per instance on serverless)
- [x] Trust proxy set for the Vercel edge
- [x] File type and size validation on uploads (4 MB cap for Vercel body limit)
- [x] ADMIN role cannot be created via public signup
- [x] CORS locked to FRONTEND_URL
- [x] Zod input validation on all request bodies
- [x] JWT with short-lived access tokens (15 min)
- [x] .env files in .gitignore
- [x] Migration files committed to git

### Before launch
- [ ] Sentry error tracking
- [ ] Uptime monitoring
- [ ] Penetration test auth routes
- [ ] GDPR privacy policy
- [ ] Terms of service
- [ ] Content moderation for uploads

---

## Environment Variables

### apps/api (Vercel project `kailani-api`)
```
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.<ref>:<password>@aws-0-us-west-1.pooler.supabase.com:5432/postgres
JWT_SECRET=
JWT_REFRESH_SECRET=
CLOUDINARY_CLOUD_NAME=dt85sew8i
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
EMAIL_FROM=onboarding@resend.dev
FRONTEND_URL=https://kailani.forpono.com
NODE_ENV=production

# Add before launch:
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SENTRY_DSN=
ALGOLIA_APP_ID=
ALGOLIA_API_KEY=
```

### apps/web (Vercel project `kailani`)
```
NEXT_PUBLIC_API_URL=https://kailani-api.forpono.com
```

---

## Running Locally

```bash
npm install
cd apps/api && npx prisma migrate dev
cd ../..
npm run dev
```

---

## Code Conventions

- TypeScript strict mode everywhere
- Prisma for all DB access — no raw SQL
- REST API — no GraphQL
- Error responses: `{ error: string, code?: string }`
- Tailwind for all styling — no CSS modules
- shadcn/ui for all UI primitives
- All API calls use `process.env.NEXT_PUBLIC_API_URL`
- Commit at end of every working session
- Never commit .env files

---

## Cross-Project Operating Rules

These apply to every project under `~/Desktop/Developer`. Canonical source:
`~/Desktop/Developer/CLAUDE.md`.

- **Full test suite is the commit gate.** The full suite must be green before
  every commit — not optional. Targeted checks (typecheck, focused tests) are
  *in addition to*, never *instead of*, the full suite. "Commit at end of every
  working session" above still requires a green suite first.
- **Explicit file lists for git commits.** Stage named files; `git add -A` is the
  exception, not the default — it sweeps untracked or in-flight work (build
  artifacts, local tooling dirs) into the wrong commit.
- **Platform fixes ship separately from feature work.** Bug and platform fixes go
  in their own commits. Bundling is allowed only under genuine production
  pressure, and must be named explicitly in the commit message.
- **Investigation before implementation.** Surface design questions and
  ambiguities before writing code. Never silently pick a default at a fork —
  document the decision or ask.
