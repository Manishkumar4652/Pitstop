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

**Status**: Planned  
**Goal**: Implement micro-job listing, 1-tap application, and fulfillment workflow.

### Scope & Tasks
- Merchant Job Management (`/merchant/jobs`): Post off-peak micro-jobs (Title, pay rate, duration, slots, instructions).
- Rider Job Discovery & Application (`/rider/jobs`): Search jobs, view distance/pay, submit 1-tap application.
- Application Review Portal (`/merchant/applications`): Accept/Reject applicant riders.
- Rider Application Tracking (`/rider/applications`): View status changes (Applied -> Accepted -> Completed).
- Backend API endpoints for job creation, searching, applying, and status updates.

### Acceptance Criteria
- Merchants can post micro-jobs with explicit time and pay details.
- Riders can apply for open jobs; backend prevents duplicate applications.
- Merchants can accept applicants; slot count decrements automatically.

---

## Phase 8: Admin Dashboard, Moderation & System Controls

**Status**: Planned  
**Goal**: Implement administrator routes (`/admin/dashboard`, `/admin/merchants`, `/admin/users`, `/admin/rest-stops`, `/admin/reports`).

### Scope & Tasks
- Admin Dashboard displaying system-wide metrics (Users, Rest Stops, Check-ins, Active Jobs).
- Merchant Onboarding Verification Queue (`/admin/merchants`): Review pending merchant profiles, approve or reject.
- Content Moderation (`/admin/rest-stops`, `/admin/jobs`): Flag or deactivate inappropriate listings.
- User Directory (`/admin/users`): Manage rider and merchant accounts.
- Audit logging of all administrative actions.

### Acceptance Criteria
- Admin users can view platform health metrics.
- Unapproved merchants cannot publish rest-stops or jobs until approved by admin.
- Administrative actions are recorded in backend audit logs.

---

## Phase 9: Polishing, Testing, Security Audit & Launch Readiness

**Status**: Planned  
**Goal**: Comprehensive integration testing, performance optimization, responsive design audit, and security hardening.

### Scope & Tasks
- End-to-end user workflow testing across mobile and desktop.
- Security audit (Rate limiting verification, XSS/CORS check, input sanitization check).
- Performance optimization (Image optimization, bundle size check, Lighthouse audit).
- Complete documentation updates (`README.md`, `docs/progress.md`).

### Acceptance Criteria
- Zero open critical bugs or security vulnerabilities.
- All user roles operate cleanly according to requirements.
- Final user approval for production deployment.
