# NAVITECS — Full Project Documentation

BIM-focused engineering consultancy website built with **Next.js 16 App Router**, **TypeScript**, **Prisma + MariaDB**, and **Tailwind CSS**. Dark-themed, fully server-rendered where beneficial, with a custom headless admin panel.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Getting Started](#2-getting-started)
3. [Environment Variables](#3-environment-variables)
4. [Project Structure](#4-project-structure)
5. [Public Routes](#5-public-routes)
6. [Admin Routes](#6-admin-routes)
7. [API Routes — Public](#7-api-routes--public)
8. [API Routes — Admin](#8-api-routes--admin)
9. [Database Schema](#9-database-schema)
10. [TypeScript Types](#10-typescript-types)
11. [Authentication System](#11-authentication-system)
12. [Forms — How They Work](#12-forms--how-they-work)
13. [Content Block System](#13-content-block-system)
14. [File Upload & Security](#14-file-upload--security)
15. [Analytics & Cookie Consent](#15-analytics--cookie-consent)
16. [Rate Limiting](#16-rate-limiting)
17. [Timezone Handling](#17-timezone-handling)
18. [Real-Time Admin Updates (SSE)](#18-real-time-admin-updates-sse)
19. [Key Libraries](#19-key-libraries)
20. [Architectural Decisions](#20-architectural-decisions)

---

## 1. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16.2.4 |
| Language | TypeScript | 6.0.3 |
| Runtime | React | 19.2.5 |
| Styling | Tailwind CSS | 4.2.4 |
| UI Primitives | Radix UI + shadcn/ui | — |
| Animations | Framer Motion | — |
| ORM | Prisma | 7.8.0 |
| Database | MariaDB (via XAMPP) | — |
| DB Adapter | @prisma/adapter-mariadb | 7.8.0 |
| Auth | Custom session-based (bcryptjs) | — |
| Forms | React Hook Form + Zod | — |
| Analytics | Google Analytics 4 (Consent Mode v2) | — |
| Icons | Lucide React | — |
| Charts | Recharts | — |

**Important rules:**
- Dark theme only — always `bg-black`, never default to light
- Use `shadcn/ui` components from `src/components/ui/` before building custom primitives
- Path alias `@/*` maps to `src/*`
- No test suite

---

## 2. Getting Started

```bash
# Install dependencies
npm install

# Run development server (Turbopack)
npm run dev

# Production build
npm run build

# Lint
npm run lint
```

**First-time setup (create initial superadmin):**

```bash
# Method 1: CLI script
npx tsx scripts/seed-superadmin.ts

# Method 2: API endpoint (only works when NO admin users exist)
curl -X POST http://localhost:3000/api/setup/superadmin \
  -H "Content-Type: application/json" \
  -d '{"username":"yourusername","password":"yourpassword123"}'
```

After the first AdminUser is created, the setup endpoint returns 403 and the setup page disables itself.

---

## 3. Environment Variables

All variables live in `.env.local` at the project root. Never commit this file.

```env
# ─── Google Analytics ──────────────────────────────────────────────────────────
# Leave empty to fully disable GA (no script loads, no tracking)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# ─── Admin Auth ────────────────────────────────────────────────────────────────
# Used by bcrypt during initial setup / password changes
ADMIN_PASSWORD=your_initial_password

# Secret used to sign session tokens (any long random string, keep it secret)
SESSION_SECRET=some_long_random_hex_string_here

# Legacy field (not actively used but referenced in some configs)
AUTH_SECRET=some_long_random_hex_string_here

# ─── Database ──────────────────────────────────────────────────────────────────
# Full Prisma URL (used by `prisma migrate` / `prisma studio`)
DATABASE_URL=mysql://root:@localhost:3306/navitecs

# Individual credentials used by @prisma/adapter-mariadb at runtime
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=navitecs
```

**Variable naming convention:**
- `NEXT_PUBLIC_*` variables are bundled into the client-side JavaScript and are visible to the browser. Only use this prefix for values that are safe to expose publicly (e.g., the GA measurement ID).
- All other variables are server-only and never sent to the client.

---

## 4. Project Structure

```
navitecs.next.js/
├── prisma/
│   ├── schema.prisma          # Database schema — models, fields, relations
│   └── migrations/            # Auto-generated migration files
├── scripts/
│   └── seed-superadmin.ts     # CLI tool to create first admin user
├── uploads/
│   ├── cvs/                   # CV PDF files (UUID filenames, outside web root)
│   └── images/                # Project images (.webp, UUID filenames)
├── src/
│   ├── app/                   # Next.js App Router pages and API routes
│   │   ├── layout.tsx         # Root layout (metadata, fonts, RootLayoutWrapper)
│   │   ├── page.tsx           # / → HomeClient
│   │   ├── about/             # /about
│   │   ├── services/          # /services
│   │   ├── projects/          # /projects and /projects/[id]
│   │   ├── careers/           # /careers and /careers/apply
│   │   ├── contact/           # /contact
│   │   ├── privacy-policy/    # /privacy-policy (static)
│   │   ├── terms-of-service/  # /terms-of-service (static)
│   │   ├── api/               # API routes (see sections 7–8)
│   │   └── navitecs-control-admin/  # Admin panel pages (see section 6)
│   ├── components/
│   │   ├── pages/             # "use client" components for public pages
│   │   ├── admin/             # "use client" components for admin pages
│   │   ├── ui/                # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   │   ├── Navigation.tsx     # Fixed top navigation with mobile drawer
│   │   ├── Footer.tsx         # Site footer
│   │   ├── CustomCursor.tsx   # Custom cursor visual effect
│   │   ├── PromoPopup.tsx     # Admin-controlled promotional popup
│   │   ├── CookieConsent.tsx  # GDPR cookie consent banner
│   │   ├── CookieSettingsButton.tsx  # Button in footer to re-open consent
│   │   └── RootLayoutWrapper.tsx     # Decides layout chrome per route
│   ├── lib/
│   │   ├── adminAuth.ts       # Session creation, validation, audit logging
│   │   ├── proxy.ts           # Auth guard helpers (requireAdmin, requireSuperAdmin)
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── blocks.ts          # Content block factory (11 types)
│   │   ├── consent.ts         # localStorage consent read/write
│   │   ├── analytics.ts       # GA4 init, Consent Mode v2
│   │   ├── cvValidation.ts    # PDF upload validation
│   │   ├── imageValidation.ts # Image upload validation + resizing
│   │   ├── rateLimit.ts       # In-memory rate limiter
│   │   ├── popup.ts           # Popup config helpers
│   │   ├── dateUtils.ts       # Timezone-aware date utilities (Europe/Sarajevo)
│   │   └── events.ts          # Server-side EventEmitter for SSE broadcasts
│   ├── hooks/
│   │   ├── usePageView.ts     # Tracks page views & time-on-page
│   │   ├── useConsent.ts      # Reads consent state from localStorage
│   │   └── useAdminStream.ts  # Connects to SSE stream for real-time updates
│   ├── types/
│   │   └── index.ts           # All shared TypeScript types
│   ├── data/
│   │   └── projects.ts        # (Legacy static project data, superseded by DB)
│   └── styles/
│       └── index.css          # Tailwind CSS entry point
├── .env.local                 # Environment variables (not committed)
├── .claude/                   # Claude Code context files
├── next.config.ts
├── tsconfig.json
└── package.json
```

### Page pattern

Every public route follows a strict split:

```
src/app/careers/page.tsx                    ← Server Component
src/components/pages/CareersClient.tsx      ← "use client" Client Component
```

- **Server Component** (`page.tsx`): exports `metadata` for SEO, optionally fetches data server-side, renders the Client Component.
- **Client Component** (`*Client.tsx`): marked `"use client"`, owns all interactivity, state, animations, and event handlers.

---

## 5. Public Routes

| Path | Client Component | Description |
|---|---|---|
| `/` | `HomeClient` | Landing page — hero, features, call-to-action sections |
| `/about` | `AboutClient` | Company information, team, values |
| `/services` | `ServicesClient` | Service offerings (BIM, structural, thermal, seismic, etc.) |
| `/projects` | `ProjectsClient` | Portfolio gallery — fetches all published projects from DB, supports filtering |
| `/projects/[id]` | `ProjectDetailsClient` | Full case study — dynamic content blocks, media gallery |
| `/careers` | `CareersClient` | Active job listings — fetched from DB at request time |
| `/careers/apply` | `ApplyClient` | Multi-step job application form with CV upload |
| `/contact` | `ContactClient` | Inquiry/contact form |
| `/privacy-policy` | *(server-only)* | Static legal page |
| `/terms-of-service` | *(server-only)* | Static legal page |

### How public pages fetch data

Public pages that need DB data use Next.js server components to fetch at request time:

```typescript
// src/app/careers/page.tsx
import { prisma } from "@/lib/db";

export default async function CareersPage() {
  const jobs = await prisma.job.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return <CareersClient jobs={jobs} />;
}
```

The fetched data is passed as props to the Client Component. No API call is made from the client for the initial render.

### ProjectDetailsClient content blocks

Individual project pages (`/projects/[id]`) render a dynamic list of `ContentBlock` objects stored as JSON in the database. Each block has a `type` (e.g., `"text"`, `"gallery"`, `"before-after"`) and a `data` object specific to that type. See [Section 13](#13-content-block-system) for full details.

---

## 6. Admin Routes

All admin routes live under `/navitecs-control-admin/`. They are **not indexed** by search engines and render outside the public navigation/footer layout.

### Authentication wrapper

Every admin page is wrapped in `AdminShell` (a server component). It calls `getAdminSession()` server-side. If no valid session cookie exists, it redirects to `/navitecs-control-admin/login`.

```typescript
// Simplified AdminShell pattern
const session = await getAdminSession();
if (!session) redirect("/navitecs-control-admin/login?expired=1");
```

### Admin pages

| Path | Client Component | Access | Description |
|---|---|---|---|
| `/navitecs-control-admin/login` | `LoginClient` | Public | Username/password login form |
| `/navitecs-control-admin/setup` | `SetupClient` | One-time | Bootstrap wizard for first admin account |
| `/navitecs-control-admin/dashboard` | `DashboardClient` | Admin | Overview: totals, recent submissions, real-time updates |
| `/navitecs-control-admin/jobs` | `JobsClient` | Admin | List, create, reorder, toggle active jobs |
| `/navitecs-control-admin/jobs/new` | `JobFormClient` | Admin | Create new job posting |
| `/navitecs-control-admin/jobs/[id]/edit` | `JobFormClient` | Admin | Edit existing job |
| `/navitecs-control-admin/projects` | `ProjectsAdminClient` | Admin | List, reorder, toggle status of projects |
| `/navitecs-control-admin/projects/new` | `ProjectFormClient` | Admin | Create project with rich block editor |
| `/navitecs-control-admin/projects/[id]/edit` | `ProjectFormClient` | Admin | Edit project |
| `/navitecs-control-admin/applications` | `ApplicationsClient` | Admin | Browse, filter, score, download CVs |
| `/navitecs-control-admin/applicants` | `ApplicantsClient` | Admin | Deduplicated applicant profiles with scoring |
| `/navitecs-control-admin/contacts` | `ContactsClient` | Admin | Contact form submissions |
| `/navitecs-control-admin/company-contacts` | `CompanyContactsClient` | Admin | Deduplicated company/contact profiles |
| `/navitecs-control-admin/popup` | `PopupSettingsClient` | Admin | Configure the site-wide promotional popup |
| `/navitecs-control-admin/statistics` | `StatisticsClient` | Admin | Page view analytics and traffic charts |
| `/navitecs-control-admin/sessions` | `SessionsClient` | **Superadmin** | View and revoke all active admin sessions |
| `/navitecs-control-admin/users` | `UsersClient` | **Superadmin** | Create, manage, and delete admin accounts |
| `/navitecs-control-admin/audit-log` | `AuditLogClient` | **Superadmin** | Full log of admin actions with IP and metadata |

### Roles

- **`admin`** — Can manage jobs, projects, applications, contacts, popup. Cannot access users, sessions, or audit log.
- **`superadmin`** — Full access to everything including user management and the audit trail.

---

## 7. API Routes — Public

These endpoints are callable without authentication.

### `POST /api/apply` — Job Application Submission

Accepts a `multipart/form-data` request.

**Rate limit:** 3 requests per hour per IP.

**Request fields (FormData):**

| Field | Type | Required | Notes |
|---|---|---|---|
| `firstName` | string | Yes | |
| `lastName` | string | Yes | |
| `email` | string | Yes | Valid email |
| `phone` | string | Yes | 7–20 chars |
| `role` | string | Yes | Job title being applied for |
| `jobId` | string | No | Links to Job record |
| `linkedin` | string | No | URL |
| `portfolio` | string | No | URL |
| `message` | string | No | Cover letter |
| `currentlyEmployed` | `"yes"` \| `"no"` | Yes | |
| `noticePeriod` | string | No | `"immediate"`, `"2-weeks"`, `"1-month"`, `"3-months"` |
| `yearsOfExperience` | string | Yes | `"0-1"`, `"1-3"`, `"3-5"`, `"5-10"`, `"10+"` |
| `location` | string | Yes | Applicant's location |
| `bimSoftware` | string | No | Comma-separated list of BIM tools |
| `consentDataSharing` | `"true"` \| `"false"` | Yes | GDPR consent for data processing |
| `consentFutureUse` | `"true"` \| `"false"` | Yes | GDPR consent for future use |
| `cv` | File | No | PDF, max 5 MB |

**CV security pipeline:** size check → extension check → MIME check → magic bytes. Stored with a UUID filename in `uploads/cvs/`.

**Applicant deduplication:** The server upserts an `Applicant` record keyed by email. All applications from the same email are linked to the same Applicant, enabling cross-application tracking.

**Response:** `{ ok: true }` on success, `{ error: string }` on failure.

---

### `POST /api/contact` — Contact Form Submission

Accepts JSON.

**Rate limit:** 5 requests per hour per IP.

**Request body:**

```typescript
{
  name: string;
  email: string;
  company: string;
  phone: string;
  projectType: string;
  projectServices: string;   // comma-separated selected services
  message: string;
  consentDataProcessing: boolean;
}
```

**CompanyContact deduplication:** Upserts a `CompanyContact` record by email, linking all contact submissions from the same company/person.

**Response:** `{ ok: true }` on success.

---

### `GET /api/jobs` — Active Job Listings

Returns all active jobs ordered by `order` field. Used by the public careers page.

**Response:**
```typescript
Array<{
  id: string;
  title: string;
  summary: string;
  department: string;
  location: string;
  type: string;
  description: string;
  active: boolean;
  createdAt: string;
  requirements: string[] | null;
}>
```

---

### `GET /api/popup` — Promotional Popup Config

Returns the singleton popup configuration. Used by `PromoPopup.tsx` on every public page.

**Response:** `PopupConfig` object (see [Database Schema](#9-database-schema)).

---

### `POST /api/track` — Page View Tracking

Records a custom page view in the DB (independent of GA).

**Request:** `{ path: string, referrer?: string }`

**Behavior:** Automatically resolves the visitor's country from IP using a geoIP lookup. Returns `{ id: number }` — the page view record ID, which is used later to update the `duration` field.

---

### `PATCH /api/track/duration` — Update Time-on-Page

Called on page exit (via Beacon API) to record how long a visitor spent on a page.

**Request:** `{ id: number, duration: number }` (duration in seconds)

---

### `POST /api/setup/superadmin` — One-Time Superadmin Bootstrap

Only works when zero `AdminUser` rows exist. Creates the first superadmin.

**Request:** `{ username: string, password: string }` (password min 12 chars, username: lowercase letters, numbers, `_`, `-`)

**Response:** `{ ok: true, id: number, username: string }`

After the first user is created, this endpoint always returns 403.

---

## 8. API Routes — Admin

All admin API routes require a valid session cookie (`nca_sess`). They are called from admin Client Components via `fetch()`.

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login with username + password. Sets `nca_sess` HTTP-only cookie. Rate limited: 10 failures per 15 min per IP. |
| `POST` | `/api/auth/logout` | Clears session from DB and expires cookie. |
| `GET` | `/api/admin/me` | Returns current user: `{ id, username, role }`. |
| `POST` | `/api/admin/verify-password` | Verifies the current user's password before destructive actions. Has 3-attempt lockout: on 3 failures, the session is terminated and the admin is logged out. |

---

### Jobs

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/jobs` | All jobs (draft + published), ordered by `order`. |
| `POST` | `/api/admin/jobs` | Create job. Body: full Job schema. Auto-generates slug `id` from title. |
| `GET` | `/api/admin/jobs/[id]` | Single job by ID. |
| `PUT` | `/api/admin/jobs/[id]` | Update job fields. |
| `DELETE` | `/api/admin/jobs/[id]` | Delete job. |
| `POST` | `/api/admin/jobs/reorder` | Update `order` fields. Body: `{ ids: string[] }` (ordered array of job IDs). |

---

### Projects

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/projects` | All projects, ordered by `order`. |
| `POST` | `/api/admin/projects` | Create project. |
| `GET` | `/api/admin/projects/[id]` | Single project. |
| `PUT` | `/api/admin/projects/[id]` | Update project. Also deletes any server-hosted image files that were removed during the edit. |
| `DELETE` | `/api/admin/projects/[id]` | Delete project and all its image files from disk. Re-sequences `order` values. |
| `POST` | `/api/admin/projects/reorder` | Update `order` fields. Body: `{ ids: string[] }`. |

---

### Applications

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/applications` | Paginated list (20/page). Supports query params: `jobId`, `dateFrom`, `dateTo`, `minScore`, `hasScore`, `hasCV`, `page`. |
| `GET` | `/api/admin/applications/[id]` | Single application with applicant data. |
| `PATCH` | `/api/admin/applications/[id]` | Update applicant scoring: `score` (1–10), `comments`, `fitsRoles`, `doesNotFit`. |
| `DELETE` | `/api/admin/applications/[id]` | Delete application. Also deletes CV file if present. |
| `GET` | `/api/admin/applications/[id]/cv` | Download the CV file for this application. |
| `GET` | `/api/admin/applications/export` | Export all applications to Excel (.xlsx). |
| `GET` | `/api/admin/applications/stale-count` | Count applications where CV was deleted. |

---

### Contacts

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/contacts` | All contacts. Supports: `email`, `name`, `projectType`, `service`, `projectServices`, `dateFrom`, `dateTo`. |
| `GET` | `/api/admin/contacts/[id]` | Single contact submission. |
| `DELETE` | `/api/admin/contacts/[id]` | Delete submission. |
| `GET` | `/api/admin/contacts/export` | Export contacts to Excel. |
| `GET` | `/api/admin/contacts/stale-count` | Count stale records. |

---

### Company Contacts (Deduplication)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/company-contacts` | All deduplicated company contact profiles. |
| `GET` | `/api/admin/company-contacts/[id]` | Single profile with all linked submissions. |
| `PATCH` | `/api/admin/company-contacts/[id]` | Update scoring: `score`, `comments`. |

---

### Applicants (Deduplication)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/applicants` | All deduplicated applicant profiles. |
| `PATCH` | `/api/admin/applicants/[id]` | Update scoring: `score`, `comments`, `fitsRoles`, `doesNotFit`. |

---

### Dashboard & Statistics

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/dashboard/quick` | Quick summary totals (application count, contact count, etc.). |
| `GET` | `/api/admin/dashboard/stats` | Chart data for the dashboard (time-series). |
| `GET` | `/api/admin/statistics` | Detailed analytics (page views, top pages, countries, traffic chart). Supports `from`, `to` date filters. |

---

### File Management

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/admin/images` | Upload a project image. Validates magic bytes, resizes to max 2048px, stores as `.webp` with UUID filename. |
| `GET` | `/api/admin/cv/[filename]` | Serve a CV file to the admin. Files are stored outside the web root and never served publicly. |
| `POST` | `/api/admin/cv/bulk` | Bulk delete CV files. Body: `{ ids: string[] }` (application IDs). |

---

### Sessions & Users (Superadmin only)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/sessions` | All active admin sessions. |
| `DELETE` | `/api/admin/sessions/[id]` | Revoke a specific session. |
| `GET` | `/api/admin/users` | All admin user accounts. |
| `POST` | `/api/admin/users` | Create admin user. Body: `{ username, password, role }`. Username: lowercase letters/numbers/`_`/`-`, min 3 chars. Password: min 12 chars. |
| `PATCH` | `/api/admin/users/[id]` | Change password. Body: `{ currentPassword, newPassword }`. Verifies current password before changing. Invalidates all sessions for that user. |
| `DELETE` | `/api/admin/users/[id]` | Delete admin user. Requires password verification via `/api/admin/verify-password` first (3-attempt lockout). Cannot delete yourself or the last superadmin. |

---

### Audit Log (Superadmin only)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/audit-log` | Paginated audit trail. Supports: `action`, `username`, `ip`, `dateFrom`, `dateTo`, `page`. |

---

### Real-Time Stream

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/stream` | Server-Sent Events (SSE) stream. Emits `new_application` and `new_contact` events when public forms are submitted. Also sends a `heartbeat` every 30 seconds to keep the connection alive. |

---

### Popup Config

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/popup` | Fetch current popup config. |
| `PUT` | `/api/admin/popup` | Update popup config. Supports all popup fields (see DB schema). |

---

## 9. Database Schema

The database uses **MariaDB** via the Prisma `@prisma/adapter-mariadb` adapter. All `DateTime` fields store values in **UTC**. The Prisma schema lives at `prisma/schema.prisma`.

### AdminUser

Stores admin panel accounts.

```prisma
model AdminUser {
  id        Int            @id @default(autoincrement())
  username  String         @unique @db.VarChar(100)
  password  String         @db.VarChar(255)   // bcrypt hash, 12 rounds
  role      String         @default("admin") @db.VarChar(20)  // "admin" | "superadmin"
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  sessions  AdminSession[]
  auditLogs AuditLog[]
}
```

### AdminSession

One row per active login. Tokens are 96-character hex strings (48 random bytes).

```prisma
model AdminSession {
  id        String    @id @default(cuid())
  userId    Int
  token     String    @unique @db.VarChar(128)
  ip        String?   @db.VarChar(45)
  userAgent String?   @db.VarChar(500)
  expiresAt DateTime                        // UTC; session TTL = 4 hours
  createdAt DateTime  @default(now())
  user      AdminUser @relation(...)
}
```

### AuditLog

Immutable record of every admin action.

```prisma
model AuditLog {
  id        Int        @id @default(autoincrement())
  action    String     @db.VarChar(100)    // e.g. "login", "user_created", "project_deleted"
  ip        String?    @db.VarChar(45)
  username  String?    @db.VarChar(100)
  userId    Int?
  user      AdminUser? @relation(...)
  metadata  Json?                          // arbitrary context (e.g. deleted item ID)
  createdAt DateTime   @default(now())
}
```

### Project

Rich case study records. `id` is a manually assigned kebab-case slug.

```prisma
model Project {
  id              String    @id @db.VarChar(200)  // e.g. "office-tower-sarajevo"
  title           String    @db.VarChar(255)
  category        String    @db.VarChar(100)
  location        String?
  projectSize     String?   // e.g. "12,000 m²"
  timeline        String?   // e.g. "2023–2024"
  numberOfUnits   String?
  clientType      String?
  description     String    @db.Text
  featuredImage   String?   // URL path, e.g. "/api/images/uuid.webp"
  scopeOfWork     Json?     // string[]
  toolsAndTech    Json?     // string[]
  challenge       String?   @db.Text
  solution        String?   @db.Text
  results         Json?     // string[]
  valueDelivered  Json?     // string[]
  media           Json?     // MediaItem[] — { url, caption?, type? }
  contentBlocks   Json?     // ContentBlock[] — rich block array (see Section 13)
  status          String    @default("published")  // "draft" | "published"
  featured        Boolean   @default(false)
  seoTitle        String?
  seoDescription  String?   @db.Text
  order           Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### Job

Active or inactive job postings.

```prisma
model Job {
  id           String        @id @default(cuid())
  title        String        @db.VarChar(255)
  summary      String        @db.VarChar(500)  // short text for careers list
  department   String        @db.VarChar(100)
  location     String        @db.VarChar(100)
  type         String        @db.VarChar(50)   // "Full-time", "Part-time", "Contract", etc.
  description  String        @db.Text
  requirements Json?         // string[] — skill options shown on apply form
  active       Boolean       @default(true)
  order        Int           @default(0)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  applications Application[]
}
```

### Application

One row per form submission from the public apply page.

```prisma
model Application {
  id                 String     @id @default(cuid())
  firstName          String
  lastName           String
  email              String
  phone              String
  role               String     // job title being applied for
  linkedin           String?
  portfolio          String?
  message            String?    @db.Text
  cvFileName         String?    // original filename (display only)
  cvPath             String?    // filesystem path (relative to uploads/)
  cvDeletable        Boolean    @default(false)  // admin-marked: safe to delete
  currentlyEmployed  Boolean?
  noticePeriod       String?
  yearsOfExperience  String?
  location           String?
  bimSoftware        String?    // comma-separated list
  consentDataSharing Boolean    @default(false)
  consentFutureUse   Boolean    @default(false)
  submittedAt        DateTime   @default(now())
  jobId              String?    // FK → Job (nullable, set to null if job deleted)
  applicantId        String?    // FK → Applicant (deduplicated by email)
}
```

### Applicant

Deduplicated person record. One row per unique email across all applications.

```prisma
model Applicant {
  id           String        @id @default(cuid())
  email        String        @unique
  firstName    String
  lastName     String
  phone        String?
  score        Int?          // admin score 1–10
  comments     String?       @db.Text
  fitsRoles    String?       @db.Text
  doesNotFit   String?       @db.Text
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  applications Application[]
}
```

### Contact

One row per contact form submission.

```prisma
model Contact {
  id                    String          @id @default(cuid())
  name                  String
  email                 String
  company               String?
  phone                 String?
  projectType           String?
  service               String?
  projectServices       String?         // comma-separated selected services
  message               String          @db.Text
  consentDataProcessing Boolean         @default(false)
  submittedAt           DateTime        @default(now())
  companyContactId      String?         // FK → CompanyContact (deduplicated)
}
```

### CompanyContact

Deduplicated company/person record. One row per unique email across all contact submissions.

```prisma
model CompanyContact {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String
  company   String?
  phone     String?
  score     Int?      // admin score 1–10
  comments  String?   @db.Text
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  contacts  Contact[]
}
```

### PageView

Custom analytics — one row per page visit (independent of GA).

```prisma
model PageView {
  id        Int      @id @default(autoincrement())
  path      String   @db.VarChar(255)
  country   String?  @db.VarChar(2)   // ISO 3166-1 alpha-2 country code
  referrer  String?  @db.VarChar(500)
  duration  Int?     // seconds the visitor spent on the page
  createdAt DateTime @default(now())
}
```

### PopupConfig

Singleton (always `id = 1`). Stores the configuration for the site-wide promotional popup.

```prisma
model PopupConfig {
  id            Int      @id @default(1)
  enabled       Boolean  @default(false)
  badge         String   // e.g. "INSIGHT"
  category      String
  title         String
  description   String   @db.Text
  buttonText    String
  linkUrl       String
  linkType      String   @default("external")  // "internal" | "external"
  openInNewTab  Boolean  @default(true)
  updatedAt     DateTime @updatedAt
}
```

---

## 10. TypeScript Types

All shared types are declared in `src/types/index.ts`. These are the types used between API responses and Client Components.

### Project types

```typescript
type Project = {
  id: string;
  title: string;
  category: string;
  location?: string | null;
  projectSize?: string | null;
  timeline?: string | null;
  numberOfUnits?: string | null;
  clientType?: string | null;
  description: string;
  featuredImage?: string | null;
  scopeOfWork: string[];
  toolsAndTech: string[];
  challenge?: string | null;
  solution?: string | null;
  results: string[];
  valueDelivered: string[];
  media: MediaItem[];
  contentBlocks: ContentBlock[];
  status: "draft" | "published";
  featured: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

type MediaItem = {
  url: string;
  caption?: string;
  type?: "image" | "video";
};
```

### Job & Application types

```typescript
type Job = {
  id: string;
  title: string;
  summary: string;
  department: string;
  location: string;
  type: string;
  description: string;
  active: boolean;
  createdAt: string;
  requirements?: string[];
};

type Application = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  linkedin: string;
  portfolio: string;
  message: string;
  cvFileName?: string;
  submittedAt: string;
  job?: { id: string; title: string } | null;
  applicant?: ApplicantRanking | null;
};

// Deduplicated applicant with all their applications
type GroupedApplicant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  score: number | null;
  comments: string | null;
  fitsRoles: string | null;
  doesNotFit: string | null;
  applications: ApplicationEntry[];
};
```

### How types relate to Prisma models

Prisma returns raw DB types (with `Date` objects, `null` for missing fields, `unknown` for JSON columns). Each API route transforms the raw Prisma result into the corresponding TypeScript type before sending it to the client. JSON columns (e.g., `media`, `contentBlocks`) are cast with `Array.isArray()` guards:

```typescript
// Example from src/app/api/admin/projects/[id]/route.ts
function toResponse(p: PrismaProject): Project {
  return {
    ...p,
    scopeOfWork:   Array.isArray(p.scopeOfWork)   ? (p.scopeOfWork as string[])        : [],
    media:         Array.isArray(p.media)          ? (p.media as MediaItem[])           : [],
    contentBlocks: Array.isArray(p.contentBlocks)  ? (p.contentBlocks as ContentBlock[]) : [],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
```

This `toResponse` pattern is used in every API route that returns data containing JSON columns or `Date` objects. It ensures the client always receives clean, typed values rather than `unknown`.

---

## 11. Authentication System

### What this system is (and is not)

- **Custom DB-backed opaque sessions** — no Auth.js, no NextAuth, no JWT, no refresh tokens.
- The session token is a 96-char hex string (48 bytes, 384 bits of entropy) from `crypto.randomBytes`.
- **The raw token is never stored anywhere** — only its SHA-256 hash lives in the database. A full DB dump cannot be replayed.
- Sessions are immediately and completely revocable by deleting the DB row.
- Two expiry bounds: a sliding 4-hour idle timeout, and a hard 24-hour absolute cap from login time.

### Login flow

```
Client (LoginClient.tsx)
  → POST /api/auth/login { username, password }
      → Rate limit check (10 failures / 15 min / IP — persisted in LoginAttempt table)
      → Look up AdminUser by username
      → bcrypt.compare(password, user.password)   // 12 salt rounds; constant-time
      → Always run bcrypt even when user not found (prevents timing-based user enumeration)
      → If valid:
          → createSession(userId, ip, userAgent)
              → token = crypto.randomBytes(48).toString("hex")  // raw, 384-bit entropy
              → tokenHash = SHA-256(token)                       // only this goes in DB
              → INSERT AdminSession { tokenHash, expiresAt: now+4h, absoluteExpiresAt: now+24h }
              → return token   // raw token — lives in memory only for this call
          → Set-Cookie: nca_sess=<raw token>; HttpOnly; SameSite=Strict; Secure (prod); Path=/
          → logAudit("login_success", ...)
  ← { ok: true } + Set-Cookie header
```

### Session validation (every protected API request)

On every call to a protected API route, `getSessionFromCookie()` is called:

```typescript
// src/lib/adminAuth.ts
export async function getSessionUser(token: string): Promise<AdminSessionUser | null> {
  const tokenHash = hashSessionToken(token);   // SHA-256 — never query by raw token
  const now       = new Date();

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session)                          return null;  // no such session
  if (session.expiresAt <= now)          return null;  // idle timeout exceeded
  if (session.absoluteExpiresAt <= now)  return null;  // 24-hour hard cap exceeded

  // Slide the idle window if < 2 hours remain, capped at absoluteExpiresAt
  const idleRemaining = session.expiresAt.getTime() - now.getTime();
  if (idleRemaining < SESSION_RENEW_THRESHOLD_MS) {
    const newExpiry = new Date(Math.min(now + SESSION_MAX_AGE_MS, session.absoluteExpiresAt));
    await prisma.adminSession.update({ where: { tokenHash }, data: { expiresAt: newExpiry } });
  }

  return { id, username, role, sessionId, sessionTokenHash: tokenHash };
}
```

### Session expiry rules

| Rule | Value | Behaviour |
|---|---|---|
| Idle timeout | 4 hours | Extended on each API request when < 2 h remain |
| Absolute max | 24 hours from login | Never extended — forces re-login after 24 h of continuous use |
| Slide threshold | 2 hours remaining | Only writes to DB when renewal is actually needed |

### Auth guards

Used at the top of every admin API route handler:

```typescript
// src/lib/proxy.ts

export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null; // null = allowed to proceed
}

export async function requireSuperAdmin(): Promise<NextResponse | null> {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

// Usage in every admin API route:
export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;
  // ... proceed
}
```

### Session revocation

Sessions can be revoked instantly at any time:

```typescript
// Revoke one session (logout, lockout)
await deleteSession(session.sessionTokenHash);

// Revoke all sessions for a user (password change)
await deleteAllUserSessions(userId);

// Revoke any session by DB row ID (superadmin sessions page)
await deleteSessionById(sessionId);
```

### Password verification lockout (`/api/admin/verify-password`)

Required before any destructive action (deleting a user, project, etc.). Maintains an in-memory failure counter keyed by session ID:

- **1st / 2nd failure:** Returns `{ error, attemptsLeft }` — status 401.
- **3rd failure:** Calls `deleteSession(sessionTokenHash)` to immediately terminate the session, writes a `verify_password_lockout` audit entry with `flaggedAsSuspicious: true`, returns status 403.

The `DeleteModal` component handles this flow transparently.

### Password hashing

```typescript
const hash  = await bcrypt.hash(password, 12);        // 12 salt rounds — on create/change
const valid = await bcrypt.compare(plaintext, hash);  // constant-time compare
```

---

## 12. Forms — How They Work

All forms use local React state for field values, client-side validation before submission, a `fetch()` call to the relevant API route, and then handle the JSON response.

### `ApplyClient.tsx` — Job Application Form

**State structure:**

```typescript
const [form, setForm] = useState({
  firstName: "", lastName: "", email: "", phone: "",
  role: "", linkedin: "", portfolio: "", message: "",
  currentlyEmployed: "" as "yes" | "no" | "",
  noticePeriod: "", yearsOfExperience: "", location: "",
  bimSoftware: [] as string[],
  consents: { dataSharing: false, futureUse: false },
});
const [cvFile, setCvFile] = useState<File | null>(null);
```

**Client-side validation (runs before any network call):**

```typescript
function validate(): string | null {
  if (!form.firstName.trim()) return "First name is required.";
  if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return "Valid email required.";
  if (!form.currentlyEmployed) return "Please indicate your employment status.";
  if (!form.consents.dataSharing || !form.consents.futureUse) return "Both consents are required.";
  if (cvFile && cvFile.size > 5 * 1024 * 1024) return "CV must be under 5 MB.";
  return null;
}
```

**Submission (multipart/form-data because of file upload):**

```typescript
async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  const err = validate();
  if (err) { setError(err); return; }

  const fd = new FormData();
  fd.append("firstName", form.firstName);
  // ... append all fields
  if (cvFile) fd.append("cv", cvFile);

  const res = await fetch("/api/apply", { method: "POST", body: fd });
  if (res.ok) {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
    resetForm();
  } else {
    const j = await res.json();
    setError(j.error ?? "Something went wrong.");
  }
}
```

---

### `ContactClient.tsx` — Contact Form

**State structure:**

```typescript
const [form, setForm] = useState({
  name: "", email: "", company: "", phone: "",
  projectType: "", message: "",
  selectedServices: [] as string[],
  consent: false,
});
```

**Submission (JSON):**

```typescript
const res = await fetch("/api/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: form.name,
    email: form.email,
    company: form.company,
    phone: form.phone,
    projectType: form.projectType,
    projectServices: form.selectedServices.join(", "),
    message: form.message,
    consentDataProcessing: form.consent,
  }),
});
```

---

### `ProjectFormClient.tsx` — Admin Project Editor

**Form shape (abbreviated):**

```typescript
type FormData = {
  title: string;
  category: string;         // "BIM Coordination" | "Structural" | "Thermal" | ...
  description: string;
  featuredImage: string;    // "/api/images/uuid.webp" or ""
  scopeOfWork: string[];    // array managed by MultiStringInput
  toolsAndTech: string[];
  results: string[];
  valueDelivered: string[];
  media: MediaItem[];
  contentBlocks: ContentBlock[];  // managed by BlockEditor
  status: "draft" | "published";
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
};
```

**Submission:**

```typescript
// Create
const res = await fetch("/api/admin/projects", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(formData),
});

// Update
const res = await fetch(`/api/admin/projects/${id}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(formData),
});
```

Server-side Zod validation runs on all fields. If validation fails, the response is:
```json
{ "error": { "fieldErrors": { "title": ["Required"] }, "formErrors": [] } }
```

Client components parse this with:
```typescript
const flat = j.error as { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
const msg = flat.fieldErrors?.title?.[0] ?? flat.formErrors?.[0] ?? "Failed to save.";
```

**Multi-string inputs** (scope of work, tools, results, etc.) use a shared pattern — a text input with an "Add" button that appends to the array, and a remove button per item. No external library.

---

### `UsersClient.tsx` — Admin User Management

**Create user:**
- Username auto-lowercased, invalid chars stripped in `onChange`
- Client validates: min 3 chars, `/^[a-z0-9_-]+$/`
- Password: min 12 chars
- POST to `/api/admin/users`

**Change password:**
- Three fields: current password, new password, confirm new password
- Client validates: current non-empty, new ≥ 12 chars, new === confirm
- Confirm field border turns red in real-time if new passwords don't match
- PATCH to `/api/admin/users/[id]` with `{ currentPassword, newPassword }`
- Server verifies `currentPassword` against the user's bcrypt hash before updating

**Delete user:**
- Uses the shared `DeleteModal` component (two-step: confirmation → password entry with lockout)
- After `DeleteModal` verifies the password, it calls `DELETE /api/admin/users/[id]`

---

### Server-side Zod validation pattern

Every mutating API route validates the request body with Zod:

```typescript
const Schema = z.object({
  title: z.string().min(1).max(255),
  active: z.boolean().default(true),
  requirements: z.array(z.string()).optional(),
});

const body = await request.json().catch(() => null);
const parsed = Schema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}

// Safely access validated, typed data
const { title, active, requirements } = parsed.data;
```

`parsed.error.flatten()` returns the shape `{ fieldErrors: Record<string, string[]>, formErrors: string[] }`. Client components always check this structure when parsing error responses.

---

## 13. Content Block System

Projects use a flexible array of content blocks stored as `Json[]` in the `contentBlocks` column. This allows each case study to have a fully custom page layout without schema migrations.

### Block types

Defined in `src/lib/blocks.ts`:

| Type | Description | Key `data` fields |
|---|---|---|
| `text` | Rich text paragraph | `content: string` |
| `image` | Single image with caption | `url: string`, `caption?: string`, `alt?: string` |
| `gallery` | Grid of images | `images: { url, caption? }[]`, `columns?: 2 \| 3 \| 4` |
| `challenge` | Challenge description | `content: string` |
| `solution` | Solution description | `content: string` |
| `results` | Bulleted results list | `items: string[]` |
| `value-delivered` | Value delivered list | `items: string[]` |
| `bim-embed` | Embedded BIM viewer | `url: string`, `title?: string` |
| `video` | Video embed | `url: string`, `caption?: string` |
| `before-after` | Side-by-side comparison slider | `beforeUrl: string`, `afterUrl: string`, `beforeLabel?: string`, `afterLabel?: string` |
| `cta` | Call-to-action section | `heading: string`, `text: string`, `buttonText: string`, `buttonUrl: string` |

### ContentBlock type

```typescript
// src/lib/blocks.ts
type ContentBlock = {
  id: string;       // UUID — assigned once by createBlock(), never changes
  type: ContentBlockType;
  order: number;    // display order, 0-indexed, managed by drag-drop in BlockEditor
  data: Record<string, unknown>;  // type-specific payload
};
```

### Creating a block

```typescript
import { createBlock } from "@/lib/blocks";

// In the admin block editor, when user clicks "Add Gallery block":
const newBlock = createBlock("gallery", existingBlocks.length);
// Returns: { id: "uuid-...", type: "gallery", order: 3, data: { images: [], columns: 3 } }
setBlocks((prev) => [...prev, newBlock]);
```

### Rendering blocks (public project page)

```typescript
// In ProjectDetailsClient.tsx
{project.contentBlocks
  .sort((a, b) => a.order - b.order)
  .map((block) => {
    switch (block.type) {
      case "text":        return <TextBlock    key={block.id} data={block.data} />;
      case "image":       return <ImageBlock   key={block.id} data={block.data} />;
      case "gallery":     return <GalleryBlock key={block.id} data={block.data} />;
      case "before-after":return <BeforeAfter  key={block.id} data={block.data} />;
      // ... etc
    }
  })
}
```

---

## 14. File Upload & Security

### CV uploads (`POST /api/apply`)

Uploaded CVs pass through a 5-layer security pipeline before being written to disk:

1. **Size check** — max 5 MB. Rejects before any disk write.
2. **Extension check** — filename must end in `.pdf` (case-insensitive).
3. **Double-extension attack prevention** — rejects filenames like `malware.exe.pdf`.
4. **MIME type check** — `Content-Type` header must be `application/pdf`.
5. **Magic bytes check** — first 4 bytes must be `25 50 44 46` (`%PDF`). This is authoritative — the browser MIME type can be spoofed.

**Storage:** Files are saved to `uploads/cvs/<uuid>.pdf`. This directory is **not** under `public/` and has no direct URL. The original filename is stored in `cvFileName` for display. The disk filename is always a UUID to prevent path traversal attacks.

**Serving:** `GET /api/admin/cv/[filename]` checks authentication before streaming the file. Public users cannot access CVs.

---

### Image uploads (`POST /api/admin/images`)

Project images go through a similar pipeline:

1. **Magic bytes** — must match JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), or WebP (`52 49 46 46 ... 57 45 42 50`).
2. **Double-extension prevention.**
3. **Size limit** — max 10 MB raw input.
4. **Dimension limit** — max 4096×4096 px input.
5. **Processing** — resized to max 2048px longest side, converted to `.webp`, saved as `uploads/images/<uuid>.webp`.

Images are served publicly via `GET /api/images/[filename]` and referenced in project data as `/api/images/<uuid>.webp`.

---

## 15. Analytics & Cookie Consent

### Consent Mode v2

The site implements Google Consent Mode v2. The GA script **never loads** until the user explicitly grants consent.

**Startup sequence:**

```typescript
// analytics.ts — called once from RootLayoutWrapper on mount
initConsentDefaults();
// → gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ... })
// GA script is NOT injected yet
```

**When the user accepts:**

```typescript
// CookieConsent.tsx → consent.ts → analytics.ts
saveConsent({ analytics: true });        // writes to localStorage
applyConsent(true);                      // called by useConsent hook listener
// → gtag("consent", "update", { analytics_storage: "granted" })
// → Dynamically injects <script src="gtag.js?id=G-XXXXXXXX"> into <head>
// → GA starts tracking
```

**When the user rejects:**

```typescript
applyConsent(false);
// → gtag("consent", "update", { analytics_storage: "denied" })
// GA script never loads
```

Only `analytics_storage` is toggled. No advertising, personalization, or functional consent signals are used.

### Custom analytics (always-on)

Independent of GA, the `usePageView` hook records every page visit to the `PageView` table. This runs regardless of consent and collects only:
- URL path
- Country (IP-derived, IP itself is not stored)
- Referrer
- Time on page (seconds)

No cookies, no personal data.

### `useConsent` hook

```typescript
// src/hooks/useConsent.ts
export function useConsent(): ConsentState | null {
  const [consent, setConsent] = useState<ConsentState | null>(readConsent);

  useEffect(() => {
    const update = () => setConsent(readConsent());
    window.addEventListener("navitecs:consent-updated", update);
    return () => window.removeEventListener("navitecs:consent-updated", update);
  }, []);

  return consent;
}
```

`ConsentState` shape:
```typescript
type ConsentState = {
  necessary: true;           // always true, cannot be disabled
  analytics: boolean;
  version: string;
  updatedAt: string;         // ISO timestamp of last change
};
```

Stored in `localStorage` under the key `navitecs_consent`.

---

## 16. Rate Limiting

In-memory, sliding fixed-window counters. Defined in `src/lib/rateLimit.ts`.

```typescript
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfter: number }
```

**Applied limits:**

| Endpoint | Key format | Limit | Window |
|---|---|---|---|
| `POST /api/apply` | `apply:<ip>` | 3 requests | 1 hour |
| `POST /api/contact` | `contact:<ip>` | 5 requests | 1 hour |
| `POST /api/auth/login` | `login:<ip>` | 10 failures | 15 minutes |

Login failures are also persisted to the `LoginAttempt` table so they survive server restarts.

**Example usage in a route:**

```typescript
const { ok, retryAfter } = rateLimit(`apply:${ip}`, 3, 60 * 60 * 1000);
if (!ok) {
  return NextResponse.json(
    { error: `Too many submissions. Please wait ${retryAfter} seconds.` },
    { status: 429 }
  );
}
```

**Production note:** The in-memory store resets on server restart and is not shared between instances. For a multi-instance deployment, replace with a Redis-backed limiter.

---

## 17. Timezone Handling

All `DateTime` values in the database are stored in **UTC**. Two explicit configurations enforce this:

**1. MariaDB server** — add to `[mysqld]` in XAMPP's `my.ini`:
```ini
default-time-zone = '+00:00'
```

**2. MariaDB driver** — in `src/lib/db.ts`:
```typescript
const adapter = new PrismaMariaDb({
  // ...
  timezone: "+00:00",
  // Without this, the mariadb npm package defaults to 'local',
  // which on a Windows machine set to UTC+2 shifts every timestamp
  // 2 hours backward when reading from the DB.
});
```

### Displaying dates in the admin panel

All date formatting explicitly specifies `timeZone: "Europe/Sarajevo"` so times always display in local business time regardless of the server's OS timezone:

```typescript
new Date(record.createdAt).toLocaleString("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Sarajevo",  // always explicit — never omit this
})
```

If you omit `timeZone`, the output is determined by the rendering environment (UTC on the server during SSR, browser timezone on the client) — causing inconsistent results.

### Date range filters in admin

Admin filter inputs send `"YYYY-MM-DD"` strings. `src/lib/dateUtils.ts` converts them to UTC Date boundaries that account for DST:

```typescript
// User picks "2026-04-28" in the filter UI

// Start of day in Sarajevo = 2026-04-27T22:00:00.000Z (UTC)
const from = tzStartOfDay("2026-04-28");

// End of day in Sarajevo = 2026-04-28T21:59:59.999Z (UTC)
const to = tzEndOfDay("2026-04-28");

await prisma.contact.findMany({
  where: { submittedAt: { gte: from, lte: to } },
});
```

Without this, a filter for "28 Apr" would miss records submitted between 22:00–00:00 on that day.

---

## 18. Real-Time Admin Updates (SSE)

The admin dashboard shows live notifications when a new application or contact is submitted, without polling.

### How it works

```
Public form submitted
  → /api/apply or /api/contact handler runs
  → adminEvents.emit("new_application") or adminEvents.emit("new_contact")
      (adminEvents is the singleton EventEmitter in src/lib/events.ts)

Admin has dashboard open
  → /api/admin/stream handler is running (SSE connection active)
  → Listener receives event
  → Writes "event: new_application\ndata: {}\n\n" to the response stream
  → Browser EventSource fires "new_application" event
  → useAdminStream hook calls onEvent("new_application")
  → Dashboard component refetches stats
```

### Client hook

```typescript
// src/hooks/useAdminStream.ts
useAdminStream({
  onEvent: (type) => {
    if (type === "new_application") refetchApplications();
    if (type === "new_contact")     refetchContacts();
  },
});
```

The hook connects to `GET /api/admin/stream` via `EventSource`. It automatically reconnects after 5 seconds if the connection drops. A heartbeat is sent every 30 seconds to keep the connection alive through proxies.

The server supports up to 50 concurrent admin connections (EventEmitter `maxListeners: 50`).

---

## 19. Key Libraries

### `src/lib/adminAuth.ts`

| Export | Description |
|---|---|
| `createSession(userId, ip, userAgent)` | Generates 96-char hex token, inserts `AdminSession`, sets HTTP-only cookie response header |
| `getSessionUser(token)` | Looks up token in DB, checks expiry, returns `AdminSessionUser` or null |
| `getSessionFromCookie()` | Reads `nca_sess` cookie and calls `getSessionUser` |
| `deleteSession(token)` | Removes one session row from DB |
| `deleteAllUserSessions(userId)` | Removes all sessions for a user (used on password change) |
| `logAudit(action, userId, username, ip, metadata?)` | Inserts a row into `AuditLog` |

### `src/lib/proxy.ts`

| Export | Description |
|---|---|
| `requireAdmin()` | Returns 401 `NextResponse` if no valid session, else `null` |
| `requireSuperAdmin()` | Returns 401/403 if not superadmin, else `null` |
| `getAdminSession()` | Returns current `AdminSessionUser` or null |

### `src/lib/blocks.ts`

| Export | Description |
|---|---|
| `createBlock(type, order)` | Creates a `ContentBlock` with default `data` for the given type |
| `blockSummary(block)` | Returns a human-readable summary string (used in editor list view) |
| `ContentBlockType` | Union type of all 11 valid block type strings |

### `src/lib/dateUtils.ts`

| Export | Description |
|---|---|
| `tzStartOfDay(dateStr)` | Parse `"YYYY-MM-DD"` as start of day in `Europe/Sarajevo`, return UTC `Date` |
| `tzEndOfDay(dateStr)` | Parse `"YYYY-MM-DD"` as 23:59:59.999 in `Europe/Sarajevo`, return UTC `Date` |

### `src/lib/analytics.ts`

| Export | Description |
|---|---|
| `initConsentDefaults()` | Calls `gtag("consent", "default", { analytics_storage: "denied", ... })` — must run before any GA call |
| `applyConsent(granted)` | Updates Consent Mode and conditionally injects the GA script |
| `trackEvent(name, params?)` | Fires `gtag("event", name, params)` — no-op if GA not loaded |
| `isGALoaded()` | Returns `true` if the GA script is active |

### `src/lib/rateLimit.ts`

| Export | Description |
|---|---|
| `rateLimit(key, limit, windowMs)` | Returns `{ ok: boolean, retryAfter: number }` |
| `getClientIp(headers)` | Extracts real IP from `X-Forwarded-For` or `X-Real-IP` headers. Normalizes IPv6 loopback. |

---

## 20. Architectural Decisions

### 1. Custom session auth instead of NextAuth

The admin panel uses a hand-rolled session system (HTTP-only cookie, DB-persisted token, bcrypt). This avoids the complexity of OAuth providers for a single-tenant admin panel where only a small number of trusted users ever log in.

### 2. Deduplication tables (Applicant & CompanyContact)

Rather than querying applications or contacts by email on every request, the server maintains a canonical record per unique email. Every new submission upserts the canonical record. This enables:
- Viewing a person's full history across multiple job postings or contact requests
- Internal scoring and notes that persist across submissions
- Fast admin UI grouping without complex runtime aggregation

### 3. JSON columns for arrays and blocks

Fields like `scopeOfWork`, `results`, `contentBlocks` are stored as JSON (not normalized into child tables). This trades referential integrity for schema flexibility — the block editor can support new block types without a migration. All JSON columns are typed on read using `Array.isArray()` guards in the `toResponse` helper.

### 4. Content blocks over fixed sections

Earlier architectures used fixed DB columns for challenge/solution/results. The block system replaces this with an ordered array of typed objects, letting each case study have a completely unique layout. Adding a new block type requires only a new case in the factory and renderer — no schema change.

### 5. UTC storage + explicit timezone in display

All timestamps are stored UTC. The MariaDB driver is configured with `timezone: "+00:00"` to prevent local-time shift on a Windows development machine. Every date rendered in the admin panel passes `timeZone: "Europe/Sarajevo"` explicitly, ensuring consistent output during Next.js SSR (which runs in UTC) and client hydration (which uses browser timezone).

### 6. Files outside the web root

CV files are in `uploads/cvs/` — not under `public/`. There is no direct URL. Downloads are gated behind `GET /api/admin/cv/[filename]` which checks session auth first. Project images in `uploads/images/` are public but served through `GET /api/images/[filename]` to allow access control if needed in the future.

### 7. Consent Mode v2 before any GA load

The GA script is never injected until the user clicks "Accept". Consent Mode v2 defaults (`analytics_storage: "denied"`) are set on page load via a lightweight inline `gtag` stub, so even if the script somehow loaded, it would not fire measurement calls. Only `analytics_storage` is grantable.

### 8. In-memory rate limiting

Simple sliding-window counters in a `Map<string, Entry>`. Zero dependencies, sub-millisecond overhead. Acceptable for a single-instance deployment (XAMPP + PM2 or similar). For a multi-instance production deployment behind a load balancer, replace with a Redis-backed limiter such as `rate-limiter-flexible`.

### 9. SSE for real-time admin updates instead of WebSockets

SSE is unidirectional (server → client), stateless from the client's perspective, and works over regular HTTP/1.1. It requires no separate WebSocket server or upgrade handshake. The server-side `EventEmitter` bridge (`src/lib/events.ts`) connects the HTTP handlers that receive form submissions to the SSE stream handlers watching the admin dashboard. Supports ~50 concurrent admin connections.

### 10. Full audit trail

Every login, logout, create, update, delete, password change, and failed verification attempt writes a row to `AuditLog` with the action name, performing user, IP address, and a `metadata` JSON object containing relevant context (e.g., the ID and name of the deleted record). Superadmins can filter and export this log to investigate incidents.
