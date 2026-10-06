# Murgdur

A luxury fashion e-commerce platform built with Next.js 16 and NestJS 11. Includes a full customer storefront, admin portal, product/order management, WhatsApp concierge ordering, media uploads, SEO, Google OAuth, and rate-limited authentication.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Local Development Setup](#local-development-setup)
5. [Environment Variables](#environment-variables)
6. [Cloudflare R2 Setup](#cloudflare-r2-setup)
7. [Google OAuth Setup](#google-oauth-setup)
8. [Prisma — Database & Studio](#prisma--database--studio)
9. [Production Deployment (Docker)](#production-deployment-docker)
10. [Security](#security)
11. [Useful Commands](#useful-commands)

---

## Tech Stack

### Frontend (`/frontend`)

| Package | Version | Purpose |
|---|---|---|
| `next` | **16** | React framework — App Router, SSR, Turbopack, image optimisation, SEO metadata API |
| `react` / `react-dom` | **19** | UI rendering — React 19 with improved server components |
| `typescript` | 5 | Type safety across the entire frontend |
| `tailwindcss` | 3 | Utility-first CSS — all styling done via Tailwind classes |
| `next-auth` | **5 (beta)** | Auth.js v5 — JWT sessions, credentials login, Google OAuth |
| `axios` | 1 | HTTP client for all API calls to the backend |
| `gsap` | 3 | Animation library — hero slider transitions, scroll-triggered effects |
| `@studio-freight/lenis` | 1 | Smooth scroll library, integrated with GSAP ScrollTrigger |
| `framer-motion` | **12** | Page and component animations (React 19 compatible) |
| `@dnd-kit/core` + `sortable` | 6/10 | Drag-and-drop for admin reordering of products, homepage blocks etc. |
| `lucide-react` | 0.468 | Icon library — all icons throughout the site |
| `meilisearch` | 0.41 | Client-side search SDK for instant product search |
| `clsx` + `tailwind-merge` | — | Utility helpers for conditional Tailwind class merging |
| `@sentry/nextjs` | **10** | Error monitoring and performance tracking (requires DSN — see Environment Variables) |

### Backend (`/backend`)

| Package | Version | Purpose |
|---|---|---|
| `@nestjs/common` + `core` + `platform-express` | **11** | NestJS core framework — HTTP server, dependency injection, modules, guards |
| `@nestjs/config` | **4** | Loads `.env` variables and makes them available via `ConfigService` |
| `@nestjs/jwt` | **11** | JWT creation and verification for access tokens and refresh tokens |
| `@nestjs/passport` + `passport` + `passport-jwt` | — | JWT authentication strategy — validates Bearer tokens on protected routes |
| `@nestjs/throttler` | **6** | Global request rate limiting to prevent API abuse |
| `@nestjs/bullmq` + `bullmq` | **11** | Redis-backed background job queue — used for async tasks like email sending |
| `prisma` + `@prisma/client` | 5 | ORM for PostgreSQL — schema management, migrations, and type-safe DB queries |
| `ioredis` | 5 | Redis client — used for login rate limiting (brute force), caching, and BullMQ |
| `bcryptjs` | 3 | Pure-JS password hashing with 12 salt rounds (no native deps, replaces bcrypt) |
| `@aws-sdk/client-s3` | 3 | S3-compatible SDK for uploading/managing files on Cloudflare R2 |
| `multer` | **2.2** | Multipart file upload middleware — handles image uploads before sending to R2 |
| `sharp` | 0.33 | Server-side image processing — resizes thumbnails, detects image luminance |
| `nodemailer` | **9** | Sends transactional emails (OTP verification, order invoices, password reset) via SMTP |
| `pdfkit` | 0.19 | Generates invoice PDFs server-side and attaches them to order confirmation emails |
| `meilisearch` | 0.41 | Server-side Meilisearch client — indexes products for fast full-text search |
| `helmet` | 7 | Sets secure HTTP headers (CSP, X-Frame-Options, etc.) |
| `class-validator` + `class-transformer` | — | DTO validation — validates and transforms incoming request bodies |
| `rxjs` | 7 | Required by NestJS core for reactive patterns |
| `@sentry/node` | 10 | Error monitoring and performance tracking (requires DSN — see Environment Variables) |
| `reflect-metadata` | 0.2 | Required by TypeScript decorators used throughout NestJS |

### Infrastructure

| Tool | Purpose |
|---|---|
| **PostgreSQL 16** | Primary relational database — stores users, products, orders, config |
| **Redis 7** | Cache + message broker — login rate limiting (5 attempts / 5 min), BullMQ job queue |
| **Meilisearch v1.8** | Full-text search engine — fast product search with typo tolerance |
| **Cloudflare R2** | Object storage for product images, logos, OG images, favicons (S3-compatible, no egress fees) |
| **Docker Compose** | Runs the full stack locally and in production |
| **WhatsApp Concierge** | Order flow — customers are redirected to WhatsApp to complete orders with the team |
| **SMTP (Gmail / any)** | Transactional email delivery — OTP codes, invoices, password reset |

---

## Project Structure

```
MurgdurV2/
├── backend/                   NestJS 11 API server
│   ├── prisma/
│   │   ├── schema.prisma      Database schema — all models defined here
│   │   ├── migrations/        Auto-generated migration history
│   │   ├── seed.ts            Seeds initial data (admin user, categories)
│   │   └── seed.js            Plain JS seed for Docker (no ts-node needed)
│   ├── .npmrc                 Sets legacy-peer-deps=true for consistent installs
│   └── src/
│       ├── auth/              Login, register, OTP, Google OAuth, forgot password, JWT, rate limiting
│       ├── users/             User profile, addresses, role management
│       ├── products/          Product CRUD, categories, variants, images, search indexing
│       ├── orders/            Order creation, status management, invoice generation
│       ├── cart/              Server-side cart sync for logged-in users
│       ├── payments/          WhatsApp concierge + Cash on Delivery flow
│       ├── email/             SMTP email sending, invoice PDF generation, CRLF-safe headers
│       ├── media/             File upload to Cloudflare R2 via S3 SDK
│       ├── admin/             Admin-only endpoints (homepage slides, highlights, blocks, users)
│       ├── site-config/       Global site settings (fonts, colours, text, invoice branding, social links)
│       ├── verification/      OTP code creation and verification (email / password reset)
│       ├── newsletter/        Newsletter signup and management
│       ├── health/            Health check endpoint at /health
│       └── database/          PrismaService, RedisService
│
├── frontend/                  Next.js 16 App Router (React 19, Turbopack)
│   ├── .npmrc                 Sets legacy-peer-deps=true for consistent installs
│   └── src/
│       ├── app/
│       │   ├── (auth)/        Login, register, forgot-password pages
│       │   ├── (shop)/        Storefront — homepage, collections, products, cart, checkout
│       │   ├── (account)/     Orders, addresses, wishlist, profile (requires login)
│       │   ├── admin/         Admin portal — catalog, orders, homepage, themes, users, categories
│       │   ├── api/auth/      Auth.js v5 route handler (credentials + Google OAuth)
│       │   ├── layout.tsx     Root layout — fonts, CSS injection, SEO metadata, JSON-LD schemas
│       │   ├── robots.ts      Auto-generates /robots.txt
│       │   └── sitemap.ts     Auto-generates /sitemap.xml (static + dynamic product/category URLs)
│       ├── components/
│       │   ├── cinematic/     HeroSlider, ScrollGallery, EditorialSection, HomepageSectionHeading
│       │   ├── shop/          ProductGrid, ProductView, CategoryHero, FilterPanel, CartDrawer
│       │   ├── layout/        Navbar, Footer, SiteChrome (hides nav/footer on /admin routes)
│       │   ├── admin/         Admin-specific components (CategoryHighlightsManager, ProductRow, etc.)
│       │   └── ui/            Shared UI — Button, Input, PhoneInput, BackButton, NewsletterForm, etc.
│       ├── context/
│       │   ├── SiteConfigContext.tsx   Global site config (fonts, colours, text styles, social links)
│       │   ├── AuthContext.tsx         Authentication state
│       │   ├── CartContext.tsx         Cart — localStorage for guests, server-synced for logged-in users
│       │   ├── CurrencyContext.tsx     Currency selection (persisted in cookie with SameSite=Lax)
│       │   └── HeroThemeContext.tsx    Light/dark text theme per hero slide
│       ├── lib/
│       │   ├── api.ts          Axios instance with auth token injection
│       │   ├── auth.ts         Auth.js v5 config (credentials + Google providers, trustHost)
│       │   ├── site-config.ts  FONT_MAP and FONT_OPTIONS shared between server and client
│       │   └── utils.ts        Helpers — cn(), formatPrice(), formatDate(), safeUrl(), safeCdnUrl()
│       ├── proxy.ts            Route protection middleware (Next.js 16 convention, replaces middleware.ts)
│       └── types/              TypeScript interfaces for Product, Order, User, Address, etc.
│
├── infrastructure/
│   ├── docker-compose.local.yml   Runs only postgres, redis, meilisearch locally
│   └── docker-compose.prod.yml    Runs full stack in production with health checks and build args
│
├── .env                       Root production environment file (used by Docker Compose)
├── .npmrc                     (frontend and backend each have their own)
├── .snyk                      Snyk security policy — suppresses reviewed false positives
└── README.md
```

---

## Prerequisites

Install these before starting:

- [Node.js](https://nodejs.org/) v20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local postgres, redis, meilisearch)
- [Git](https://git-scm.com/)

---

## Local Development Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/murgdur.git
cd murgdur
```

### 2. Start local services (postgres, redis, meilisearch)

```bash
docker compose -f infrastructure/docker-compose.local.yml up -d
```

This starts:
- PostgreSQL on port `5432`
- Redis on port `6379`
- Meilisearch on port `7700`

### 3. Set up the backend

```bash
cd backend
cp .env.example .env
# Fill in .env — see Environment Variables section below
npm install
npx prisma migrate dev       # runs all migrations and creates the DB schema
npx prisma db seed           # seeds admin user + categories
npm run start:dev            # starts NestJS on http://localhost:3001
```

> **Note:** The seed requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` to be set in `backend/.env`. It will throw if `ADMIN_PASSWORD` is missing.

### 4. Set up the frontend

```bash
cd frontend
cp .env.example .env.local
# Fill in .env.local — see Environment Variables section below
npm install
npm run dev                  # starts Next.js on http://localhost:3000
```

### 5. Open the app

| URL | What it is |
|---|---|
| `http://localhost:3000` | Storefront |
| `http://localhost:3000/admin` | Admin portal |
| `http://localhost:3001/health` | Backend health check |
| `http://localhost:5555` | Prisma Studio (run `npx prisma studio` first) |
| `http://localhost:7700` | Meilisearch dashboard |

---

## Environment Variables

### Backend — `backend/.env`

```env
# ── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/murgdurV2?schema=public"
# For Docker production: host must be "postgres" (the service name), not "localhost"

# ── Redis ────────────────────────────────────────────────────────────────────
REDIS_URL="redis://localhost:6379"
# For Docker production: use redis://redis:6379
# Used for: login rate limiting (5 attempts per IP + per account → 5 min block), BullMQ jobs

# ── JWT ──────────────────────────────────────────────────────────────────────
JWT_SECRET="change-me-min-32-chars"
# Signs access tokens (15 min expiry) — generate with: openssl rand -hex 32
JWT_REFRESH_SECRET="change-me-different-secret"
# Signs refresh tokens (7 day expiry) — must be DIFFERENT from JWT_SECRET

# ── Cloudflare R2 (media storage) ────────────────────────────────────────────
CLOUDFLARE_R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="murgdur-media"
R2_PUBLIC_CDN_URL="https://pub-xxx.r2.dev"
# Use your custom domain or the free r2.dev URL

# ── Meilisearch ──────────────────────────────────────────────────────────────
MEILISEARCH_HOST="http://localhost:7700"
# For Docker: use http://meilisearch:7700 (overridden automatically in docker-compose)
MEILISEARCH_API_KEY="your-master-key"
# Must match MEILI_MASTER_KEY set in docker-compose

# ── Email (SMTP) ─────────────────────────────────────────────────────────────
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your@gmail.com"
SMTP_PASS="your-app-password"
# For Gmail: generate an App Password at myaccount.google.com/apppasswords
SMTP_FROM="Murgdur <your@gmail.com>"

# ── Admin seed credentials ────────────────────────────────────────────────────
ADMIN_EMAIL="admin@murgdur.com"
ADMIN_PASSWORD="your-secure-admin-password"
# Used by `npx prisma db seed` — ADMIN_PASSWORD is REQUIRED (no fallback)

# ── Monitoring (optional) ─────────────────────────────────────────────────────
SENTRY_DSN=""
# From sentry.io → your project → Settings → Client Keys — leave blank to disable

# ── Server ───────────────────────────────────────────────────────────────────
FRONTEND_URL="http://localhost:3000"
PORT=3001
NODE_ENV=development
```

### Frontend — `frontend/.env.local`

```env
# ── API URLs ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL="http://localhost:3001"
INTERNAL_API_URL="http://localhost:3001"
# Use http://backend:3001 for INTERNAL_API_URL in Docker production

# ── Auth.js v5 ───────────────────────────────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me-random-string"
AUTH_SECRET="change-me-random-string"
# AUTH_SECRET and NEXTAUTH_SECRET must be the same value
# Generate with: openssl rand -base64 32
AUTH_URL="http://localhost:3000"

# ── Google OAuth (optional) ──────────────────────────────────────────────────
NEXT_PUBLIC_GOOGLE_ENABLED="false"
# Set to "true" to show the Google sign-in button
# NOTE: baked in at BUILD TIME — must be set before building the Docker image
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
# From Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID

# ── Search ───────────────────────────────────────────────────────────────────
NEXT_PUBLIC_MEILISEARCH_HOST="http://localhost:7700"
NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY=""
# Search-only API key — NOT the master key

# ── Media / CDN ──────────────────────────────────────────────────────────────
NEXT_PUBLIC_CDN_URL="https://pub-xxx.r2.dev"
# Must match R2_PUBLIC_CDN_URL in backend — used by safeCdnUrl() to validate media URLs

# ── SEO ──────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL="https://murgdur.com"
# Your production domain — used for sitemap.xml, robots.txt, canonical URLs, OG tags

# ── Monitoring (optional) ─────────────────────────────────────────────────────
NEXT_PUBLIC_SENTRY_DSN=""
```

---

## Cloudflare R2 Setup

R2 stores all media uploads — product images, logos, OG images, favicons. S3-compatible, no egress fees.

### Step 1 — Create a bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **R2 Object Storage**
2. Click **Create bucket**, name it (e.g. `murgdur-media`)
3. Go to the bucket → **Settings** → copy the **S3 API endpoint** → `CLOUDFLARE_R2_ENDPOINT`

### Step 2 — Create API credentials

1. In R2 → **Manage R2 API Tokens** → **Create API Token**
2. Set permissions to **Object Read & Write** for your bucket
3. Save **Access Key ID** → `R2_ACCESS_KEY_ID`
4. Save **Secret Access Key** → `R2_SECRET_ACCESS_KEY` (shown only once)

### Step 3 — Make files publicly accessible

**Option A — Free `.r2.dev` subdomain:**
1. Bucket → **Settings** → **Public Access** → enable **R2.dev subdomain**
2. Copy the URL → `R2_PUBLIC_CDN_URL` and `NEXT_PUBLIC_CDN_URL`

**Option B — Custom domain (recommended):**
1. Bucket → **Settings** → **Custom Domains** → add your domain (e.g. `media.murgdur.com`)
2. Update both `R2_PUBLIC_CDN_URL` and `NEXT_PUBLIC_CDN_URL` to your custom domain

> **Important:** `R2_PUBLIC_CDN_URL` and `NEXT_PUBLIC_CDN_URL` must always match — the frontend uses `NEXT_PUBLIC_CDN_URL` to validate that media URLs belong to your own CDN.

### Step 4 — CORS policy

In your bucket → **Settings** → **CORS Policy**:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://murgdur.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Google OAuth Setup

### Step 1 — Create OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add **Authorized JavaScript origins**: `http://localhost:3000`
5. Add **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
6. Copy **Client ID** → `GOOGLE_CLIENT_ID`
7. Copy **Client Secret** → `GOOGLE_CLIENT_SECRET`

### Step 2 — Enable in environment

```env
NEXT_PUBLIC_GOOGLE_ENABLED="true"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

> **Important:** `NEXT_PUBLIC_GOOGLE_ENABLED` is baked in at **build time**. Changing it requires rebuilding the frontend Docker image (`--build --no-deps frontend`).

---

## Prisma — Database & Studio

### Run migrations

```bash
cd backend

# Development — creates a migration file and applies it
npx prisma migrate dev --name describe-your-change

# Quick sync without a migration file (development only)
npx prisma db push
```

### Seed the database

Requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`:

```bash
cd backend
npx prisma db seed
```

For Docker (after deploying):
```bash
docker cp backend/prisma/seed.js murgdur-backend:/app/prisma/seed.js
docker exec murgdur-backend node prisma/seed.js
```

### Prisma Studio

```bash
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

> **To manage the Docker database via Prisma Studio**, temporarily change `DATABASE_URL` in `backend/.env` to:
> ```
> DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/murgdur?schema=public"
> ```
> Then run `npx prisma studio`. Change it back when done.

---

## Production Deployment (Docker)

### 1. Fill in the root `.env` file

Key values to set (copy from `backend/.env.example` and add frontend vars):

```env
POSTGRES_PASSWORD="your-strong-password"
DATABASE_URL="postgresql://postgres:your-strong-password@postgres:5432/murgdur?schema=public"
JWT_SECRET="your-32-char-secret"           # openssl rand -hex 32
JWT_REFRESH_SECRET="your-other-32-char-secret"
NEXTAUTH_SECRET="your-nextauth-secret"
AUTH_SECRET="your-nextauth-secret"          # same as NEXTAUTH_SECRET
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
MEILI_MASTER_KEY="your-meilisearch-key"
MEILISEARCH_API_KEY="your-meilisearch-key"
ADMIN_EMAIL="admin@murgdur.com"
ADMIN_PASSWORD="your-secure-admin-password"
NEXT_PUBLIC_GOOGLE_ENABLED="true"           # if using Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
NEXT_PUBLIC_CDN_URL="https://pub-xxx.r2.dev"   # must match R2_PUBLIC_CDN_URL
R2_PUBLIC_CDN_URL="https://pub-xxx.r2.dev"
```

### 2. Build and start everything

```powershell
docker compose -f infrastructure/docker-compose.prod.yml --env-file .env up -d --build
```

Prisma migrations run automatically. All services start in the correct dependency order with health checks.

> **Note:** `NEXT_PUBLIC_*` variables are baked in at build time via Docker build args — they must be in `.env` before building the frontend image.

### 3. Seed the production database (first deploy only)

```powershell
docker cp backend/prisma/seed.js murgdur-backend:/app/prisma/seed.js
docker exec murgdur-backend node prisma/seed.js
```

### 4. Update after a code change

```powershell
# Rebuild only the changed service
docker compose -f infrastructure/docker-compose.prod.yml --env-file .env up -d --build --no-deps backend
docker compose -f infrastructure/docker-compose.prod.yml --env-file .env up -d --build --no-deps frontend
```

### 5. View logs

```powershell
docker compose -f infrastructure/docker-compose.prod.yml --env-file .env logs -f backend
docker compose -f infrastructure/docker-compose.prod.yml --env-file .env logs -f frontend
```

---

## Security

### Rate Limiting (Brute Force Protection)
Login attempts are rate-limited using Redis with two independent counters:
- **Per IP:** 5 failures from the same IP → 5 minute block
- **Per account:** 5 failures on the same email → 5 minute block (even from different IPs)

Both counters reset on successful login. Real client IP extracted from `X-Forwarded-For` header for use behind proxies.

### Authentication
- Access tokens: JWT, 15 minute expiry
- Refresh tokens: JWT, 7 day expiry
- Passwords: bcryptjs with 12 salt rounds (pure JS, no native deps)
- Email OTP: 10 minute expiry, single-use
- Auth.js v5 with `trustHost: true` for Docker/production compatibility

### Email Security
All `to` and `subject` headers are sanitized to strip `\r\n` characters — prevents CRLF injection via nodemailer.

### URL Sanitization
- `safeUrl()` — validates protocol is http/https, returns `parsed.href` (not raw input)
- `safeCdnUrl()` — additionally validates hostname against trusted CDN domain allowlist (`*.r2.dev`, `media.murgdur.com`). Used for all media `src`/`href` attributes in the admin portal.

### CSS Injection Prevention
Dynamic CSS injected via `<style>` tag is sanitized through `sanitizeCssValue()` which strips non-printable characters and `</style>` sequences before injection.

### Package Security
- `bcrypt` replaced with `bcryptjs` — eliminates native `node-pre-gyp` dependency chain vulnerabilities
- `nodemailer` upgraded to v9 — fixes SSRF and CRLF vulnerabilities
- `multer` forced to v2.2.0 via npm overrides (including `@nestjs/platform-express` internal copy)
- `postcss` forced to v8.5.x via npm overrides (including Next.js internal copy)

---

## Useful Commands

```bash
# ── Backend ──────────────────────────────────────────────────────────────────
npm run start:dev            # start with hot reload
npm run build                # compile TypeScript
npx prisma studio            # open DB browser at localhost:5555
npx prisma migrate dev       # create + apply a new migration
npx prisma db push           # sync schema without creating a migration file
npx prisma db seed           # seed initial data (requires ADMIN_PASSWORD env var)
npx tsc --noEmit             # type-check without building

# ── Frontend ─────────────────────────────────────────────────────────────────
npm run dev                  # start dev server at localhost:3000 (Turbopack)
npm run build                # production build
npx tsc --noEmit             # type-check without building

# ── Docker (local services only) ─────────────────────────────────────────────
docker compose -f infrastructure/docker-compose.local.yml up -d       # start postgres, redis, meilisearch
docker compose -f infrastructure/docker-compose.local.yml down         # stop all
docker compose -f infrastructure/docker-compose.local.yml down -v      # stop + wipe all data volumes

# ── Docker (production) ───────────────────────────────────────────────────────
docker compose -f infrastructure/docker-compose.prod.yml --env-file .env up -d --build   # full build + start
docker compose -f infrastructure/docker-compose.prod.yml --env-file .env ps              # check container status
docker compose -f infrastructure/docker-compose.prod.yml --env-file .env down            # stop all
docker builder prune -f                                                                    # clear build cache
```
