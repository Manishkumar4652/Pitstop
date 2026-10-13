# PitStop — Master Implementation Plan & Roadmap

This document outlines the ordered, step-by-step development roadmap for PitStop. Each phase defines explicit scope boundaries, dependencies, implementation tasks, and verifiable acceptance criteria.

---

## Phase 0: Project Foundation, Architecture & Planning (CURRENT)

**Status**: Completed  
**Goal**: Establish system architecture, repository structure, security guidelines, design tokens, and comprehensive specifications.

### Tasks
- [x] Inspect workspace environment (Node.js v24.14.1, npm 11.11.0, Git 2.50.1).
- [x] Create core project documentation (`README.md`, `AGENTS.md`, `docs/requirements.md`, `docs/architecture.md`, `docs/design-system.md`, `docs/implementation-plan.md`, `docs/progress.md`).
- [x] Create safe template files (`.gitignore`, `.env.example`).
- [x] Document design system tokens and responsive breakpoints.
- [x] Initialize Git repository.

### Acceptance Criteria
- [x] Architecture, security boundaries, and data schemas fully documented.
- [x] MVP boundaries explicitly defined.
- [x] No credentials or secrets committed.
- [x] Next step (Phase 1) clearly identified.

---

## Phase 1: Monorepo Infrastructure & Package Setup

**Status**: Planned (Pending Approval)  
**Goal**: Initialize npm workspace structure with `apps/web`, `apps/api`, and `packages/shared-types`.

### Scope & Tasks
- Initialize root `package.json` with npm workspaces configuration (`apps/*`, `packages/*`).
- Create `packages/shared-types` workspace package (TypeScript setup, export shared Enums, DTOs, Zod schemas).
- Initialize `apps/api` Express TypeScript project (TypeScript compiler config, npm scripts for build/dev).
- Initialize `apps/web` Next.js (App Router, Tailwind CSS, Lucide Icons setup).
- Configure root scripts for concurrent execution (`npm run dev`, `npm run build`, `npm run lint`).

### Acceptance Criteria
- Running `npm run build` from root compiles `packages/shared-types`, `apps/api`, and `apps/web` without errors.
- Running `npm run dev` starts both Next.js frontend and Express backend concurrently.
- No third-party packages installed outside current phase requirements.

---

## Phase 2: Backend Core API, Database Schemas & Authentication

**Status**: Planned  
**Goal**: Build database connection, Mongoose schemas, JWT authentication, and core middleware.

### Scope & Tasks
- Configure MongoDB Atlas / Mongoose connection in `apps/api/src/config/db.ts`.
- Implement Mongoose models (`User`, `RestStop`, `Deal`, `Job`, `CheckIn`).
- Implement authentication endpoints (`/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/me`).
- Create middleware: `authMiddleware` (JWT verification), `rbacMiddleware` (Role checks), `rateLimiter`, `errorHandler`.
- Write Zod validation schemas in `packages/shared-types` and integrate into controllers.

### Acceptance Criteria
- API boots cleanly and connects to MongoDB.
- User registration and login return valid JWT tokens and user objects.
- Protected routes reject unauthenticated requests with HTTP 401 and role mismatches with HTTP 403.
- Automated API test script confirms auth flow success.

---

## Phase 3: Frontend Base, Design Tokens & Component Library

**Status**: Planned  
**Goal**: Establish Next.js layout structure, Tailwind design system, and core UI component primitives.

### Scope & Tasks
- Configure Tailwind CSS custom tokens (`#F7B928`, `#202124`, `#F4F6F8`, `#E3E5E8`).
- Build reusable UI primitives: `Button`, `Card`, `Badge`, `Input`, `Select`, `Modal`, `Table`, `Drawer`.
- Build layout primitives: `Header`, `Footer`, `Sidebar`, `BottomNav` (Mobile navigation).
- Set up API client utility (`lib/api-client.ts`) with token injection and error handling.

### Acceptance Criteria
- Design tokens applied consistently across primitives.
- All components verified responsive across 320px, 480px, 768px, 1024px, and 1440px breakpoints.
- Accessible focus rings and keyboard navigation functional.

---

## Phase 4: Public Landing Page & Rest-Stop Discovery

**Status**: Planned  
**Goal**: Build public routes (`/`, `/explore`, `/rest-stops/[slug]`, `/jobs`, `/how-it-works`).

### Scope & Tasks
- Implement landing page (`/`) with Hero, Tagline, Facility Highlights, and Search bar.
- Implement Rest-Stop Discovery page (`/explore`) with location search, facility multi-filter checkboxes, and card/map view toggles.
- Implement Rest-Stop Detail page (`/rest-stops/[slug]`) displaying amenities, location map link, operating hours, active deals, and check-in button.
- Implement Public Job Board (`/jobs`).
- Connect public pages to REST API backend endpoints (`GET /api/v1/rest-stops`, `GET /api/v1/rest-stops/:id`).

### Acceptance Criteria
- Public users can search rest stops by keyword, city, or facility filter.
- Dynamic rest-stop detail pages render valid data from backend.
- Attempting authenticated actions (e.g. check-in) prompts user login/registration.

---

## Phase 5: Rider Authenticated Portal & Check-in Flow

**Status**: Planned  
**Goal**: Implement rider routes (`/rider/dashboard`, `/rider/check-ins`, `/rider/deals`, `/rider/saved`, `/rider/profile`).

### Scope & Tasks
- Build Rider Dashboard with active check-in status, recommended stops, saved deals.
- Implement Check-in verification system:
  - QR Code scanner component / OTP entry modal.
  - API endpoint `POST /api/v1/check-ins/verify` verifying QR/OTP payload server-side.
- Build Rider Deals page to generate single-use redemption coupons.
- Build Rider Profile & saved rest-stops bookmarking.

### Acceptance Criteria
- Riders can log in and view their personal dashboard.
- Check-in submission sends payload to backend; server verifies and records check-in timestamp.
- Successful check-in unlocks active deals for the rider.

---

## Phase 6: Merchant Portal & Facility Management

**Status**: Planned  
**Goal**: Implement merchant routes (`/merchant/dashboard`, `/merchant/rest-stop`, `/merchant/check-ins`, `/merchant/deals`, `/merchant/analytics`).

### Scope & Tasks
- Merchant registration workflow (Business details, address, facility checklist upload).
- Merchant Rest-Stop Management (`/merchant/rest-stop`): Toggle open/close status, update facilities, update live capacity indicator (Available / Busy / Full).
- Merchant Check-in Desk (`/merchant/check-ins`): View business QR code for printing, manually enter rider OTP to validate check-in.
- Merchant Deals Manager (`/merchant/deals`): Create, edit, and pause rider-exclusive deals.
- Merchant Analytics (`/merchant/analytics`): Footfall metrics and deal redemptions.

### Acceptance Criteria
- Merchants can manage their rest-stop facilities and live occupancy status.
- Merchants can validate rider OTP check-ins in real time.
- Created deals appear immediately on public and rider deal listings.

---

## Phase 7: Micro-Jobs Marketplace & Rider Applications

**Status**: In Progress  
**Goal**: Implement micro-job listing, application lifecycle, atomic capacity management, and portal fulfillment workflows.

### Sub-Phases & Progress:
- [x] **Phase 7A: Job Application Data Architecture & Merchant Jobs APIs (COMPLETED)**
  - Mongoose `JobApplication` model with `{ jobId, riderId }` unique index and lookup indexes.
  - Shared schemas: `MerchantJobQuerySchema`, `JobMerchantResponseSchema`, `JobApplicationResponseSchema`.
  - Backend endpoints: `GET /api/v1/merchant/jobs` and `GET /api/v1/merchant/jobs/:id` with application counts and role enforcement.
- [x] **Phase 7B: Job Application Lifecycle & Atomic Capacity Management (COMPLETED)**
  - Rider application submission: `POST /api/v1/jobs/:id/apply` (duplicate prevention, eligibility checks, 409 conflict mapping).
  - Rider application tracking: `GET /api/v1/rider/applications` (caller-isolated query, pagination, status filtering, job summaries).
  - Merchant applicant review: `GET /api/v1/merchant/jobs/:id/applications` (ownership check, pagination, sorting, privacy-safe rider details).
  - Merchant status update: `PATCH /api/v1/merchant/applications/:id/status` (accept/reject, atomic `$inc` capacity check, compensation rollback, invariant `0 <= acceptedRidersCount <= requiredRiders`).
  - Rider application withdrawal: `POST /api/v1/rider/applications/:id/withdraw` (pending-only withdrawal, no capacity decrement).
  - Concurrency & real MongoDB integration test suite verified (45 tests passing).
- [x] **Phase 7C: Merchant Portal Micro-Jobs BFF & UI Integration (COMPLETED)**
  - Next.js BFF routes under `apps/web/app/api/merchant/jobs/*` and `.../applications/*` with CSRF validation, HttpOnly cookie forwarding, strict schema validation, and zero token exposure.
  - Connected `/merchant/jobs` UI to live backend data with real status filters, keyword search, pagination, and live metrics.
  - Connected `CreateJobModal` (active rest stop validation, pay/schedule validation) and `EditJobModal` (operational status updating).
  - Built interactive `JobApplicantsModal` with pending-only 1-click Accept/Reject controls, anti-duplicate click states, and HTTP 409 capacity conflict handling.
  - Comprehensive BFF and client test suite (15 tests passing, 82 web tests total).
- [x] **Phase 7D: Rider Marketplace Micro-Jobs BFF & UI Integration (COMPLETED)**
  - Next.js BFF routes under `apps/web/app/api/jobs/*` and `.../rider/applications/*` with CSRF validation, HttpOnly cookie forwarding, strict schema validation, and zero token exposure.
  - Connected public `/jobs` gig discovery marketplace to live backend data with real-time keyword search, category filter, pay-type toggle (`hourly` vs `fixed`), sorting, pagination, and honest loading/empty/error states.
  - Reusable `JobCard` and `JobDetailModal` with guest "Log in to Apply" flow (sanitized `returnUrl`), rider application submission with optional notes (max 200 chars), anti-duplicate click states, and HTTP 409 conflict handling.
  - Connected `/rider/applications` application tracking portal with live metrics strip, operational status tabs, shift schedule details, and 1-click pending application withdrawal.
  - Updated `RiderNav` and `rider/dashboard` with direct links to jobs discovery and applications.
  - Comprehensive BFF and client test suite (17 tests passing, 99 web tests total, 390 monorepo tests total).

### Acceptance Criteria
- [x] Merchants can post micro-jobs with explicit time and pay details (Phase 3D2B1 / 7A / 7C).
- [x] Riders can apply for open jobs; backend prevents duplicate applications (Phase 7B / 7D).
- [x] Merchants can accept applicants; slot count increments atomically; invariant `acceptedRidersCount <= requiredRiders` strictly preserved (Phase 7B / 7C).
- [x] Riders can withdraw pending applications safely without corrupting counter (Phase 7B / 7D).
- [x] Live UI integrated on merchant portal with applicant review modal and capacity conflict handling (Phase 7C).
- [x] Live UI integrated on rider jobs marketplace and application tracking (Phase 7D).

---

## Phase 8: End-to-End Integration Audit & Release Readiness
 
**Status**: Completed  
**Goal**: Verification-first audit of end-to-end integration flows across Phases 7A-7D, empirical concurrency verification, database invariant enforcement, and deployment readiness review.
 
### Scope & Tasks
- [x] Comprehensive review of monorepo architecture, security boundaries, and data flow.
- [x] Empirical verification of complete 12-point business flow against live Express backend and MongoDB.
- [x] Concurrency and atomic capacity invariant inspection (`0 <= acceptedRidersCount <= requiredRiders`).
- [x] Identified and fixed capacity reduction edge case in `updateMerchantJobHandler` (preventing `requiredRiders < acceptedRidersCount`).
- [x] Enforced status transition guardrail preventing reopening expired jobs with end times in the past.
- [x] Added deterministic concurrency and End-to-End lifecycle tests on real MongoDB.
- [x] Audited environment variables, cookie security, CSRF protection, and documented `QR_SIGNING_SECRET` in `.env.example`.
- [x] Monorepo test suite verification: 394/394 passing tests, 0 typecheck errors, 0 lint warnings, production build succeeded.
 
### Acceptance Criteria
- [x] End-to-end business flow verified empirically on real backend and MongoDB.
- [x] Simultaneous acceptances on 1-slot job strictly constrained to single winner (409 conflict and safe rollback for loser).
- [x] Capacity counter invariant strictly guaranteed on creation, updates, acceptance, and withdrawals.
- [x] All 394 monorepo tests passing across `@pitstop/api` and `@pitstop/web`.
- [x] Production build and strict TypeScript compiler pass cleanly.
 
---
 
## Phase 9: Admin Dashboard, Moderation & System Controls
 
**Status**: Completed  
**Goal**: Implement administrator routes (`/admin`, `/admin/merchants`, `/admin/rest-stops`, `/admin/jobs`, `/admin/deals`, `/admin/login`).

### Scope & Tasks
- [x] Admin Authentication and Role-Based Authorization:
  - Enforced `UserRole.ADMIN` on backend routes (`/api/v1/admin/*`) and BFF gateway (`/api/admin/*`).
  - Prohibited public registration of admin accounts in Zod schemas and auth controllers.
  - Dedicated admin login UI at `/admin/login` enforcing `requiredRole: UserRole.ADMIN` with CSRF protection and sanitized `returnUrl`.
  - Secure server-side check with `verifyAdminAccess` helper for Next.js App Router admin pages.
- [x] Admin Dashboard (`/admin`):
  - Real database-backed stats aggregation endpoint (`GET /api/v1/admin/stats`) aggregating users, merchants, rest stops, jobs, applications, and check-ins.
  - Distinguishes authentic zero counts from unavailable/disconnected systems.
  - Implemented loading skeletons, empty states, error banners, and manual refresh controls.
- [x] Merchant Verification Queue (`/admin/merchants`):
  - Paginated search, status filtering (`pending_review`, `verified`, `rejected`, `suspended`), safe detail view, and status update modal.
  - Transition reason logging and zero credential leakage in DTOs.
- [x] Rest-Stop Moderation (`/admin/rest-stops`):
  - Live venue listings with city and status filters, view detail dialogs, approve and suspend actions.
  - Immediate public marketplace hiding of non-active stops (`pending_approval`, `suspended`, `inactive`).
- [x] Jobs and Deals Moderation (`/admin/jobs`, `/admin/deals`):
  - Moderation controls preserving capacity invariants (`0 <= acceptedRidersCount <= requiredRiders`).
  - Safe status transitions for flagged or inappropriate listings.
- [x] Persistent Moderation Audit Trail (`AuditLog` Collection):
  - Dedicated Mongoose model and mock store fallback capturing admin ID, action, target, previous and new statuses, and moderation reason.
  - Integrated audit log inspection endpoint (`GET /api/v1/admin/audit-logs`) and dashboard activity stream.
- [x] Monorepo Test Suite & Quality Verification:
  - Added comprehensive backend (`admin.test.ts`) and web BFF (`admin.test.ts`) suites.
  - Monorepo tests: 430/430 passing (319 api, 111 web), 0 typecheck errors, 0 lint warnings, production build succeeded.

### Acceptance Criteria
- [x] Admin users can view platform health metrics backed by real database data.
- [x] Non-admin roles (riders, merchants, unauthenticated users) are strictly denied admin endpoints with HTTP 401/403.
- [x] Administrative actions are permanently recorded in backend audit logs.
- [x] All 430 tests passing across `@pitstop/api` and `@pitstop/web`.
 
---
 
## Phase 10: Production Readiness & Deployment Audit

**Status**: Completed  
**Goal**: Comprehensive integration testing, performance optimization, responsive design audit, and security hardening.

### Scope & Tasks
- [x] Production Environment Audit:
  - Enforced `MONGODB_URI` and `JWT_SECRET` (>= 32 chars) as required in production via Zod `superRefine`.
  - Validated `QR_SIGNING_SECRET` (>= 32 chars) cleanly decoupled and never exposed to client bundles.
  - Verified strict CORS origin validation matching `CLIENT_URL` in production.
  - Verified `PITSTOP_API_BASE_URL` is server-only; no sensitive variables exposed via `NEXT_PUBLIC_*`.
  - Verified production cookies enforce `HttpOnly: true`, `SameSite: 'lax'`, and `Secure: true`.
  - Added unit test suite `apps/api/src/__tests__/envConfig.test.ts` (8/8 tests passing).
- [x] Database and Deployment Readiness:
  - Verified database failure safety (throws 503 in production instead of falling back to mock stores).
  - Inspected all Mongoose model indexes (`2dsphere`, unique compound, lookup indexes).
  - Graceful shutdown handles `SIGTERM`/`SIGINT` with 10-second unref timeout and connection cleanup.
  - Created [`docs/deployment.md`](file:///c:/Users/Manish/Desktop/Pitstop/docs/deployment.md) documenting independent deployment and operational runbooks.
- [x] Security Audit:
  - Verified authentication, RBAC, resource isolation, and CSRF Origin / Referer validation.
  - Verified input sanitization: RegExp injection prevented using `escapeRegex` utility.
  - Rate limiting active on authentication endpoints.
  - DTO serialization systematically strips sensitive metadata (`passwordHash`).
- [x] Browser & Responsive Testing:
  - Executed browser subagent session capturing public homepage, explore rest stops, micro-jobs marketplace, and admin login.
  - Verified mobile responsive layout at 375px viewport with readable typography and clean navigation.
- [x] Final Monorepo Quality Verification:
  - All 438 tests passing across packages (327 api, 111 web), 0 failures.
  - TypeScript compiler 100% clean (0 errors).
  - ESLint 100% clean (0 warnings).
  - Production Next.js build: 59 routes generated successfully.

### Acceptance Criteria
- [x] Zero open critical bugs or security vulnerabilities.
- [x] All user roles operate cleanly according to requirements.
- [x] Independent deployment requirements and runbooks documented.
- [x] Monorepo verification passes with 100% test success rate.

