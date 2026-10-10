# AGENTS.md — Guidelines for AI Coding Assistants

Welcome, AI assistant. You are pair-programming on **PitStop**, a web platform for gig workers and local merchants in India.
Before writing or modifying any code in this repository, you **MUST** read and adhere to the guidelines below.

---

## 1. MANDATORY CONTEXT READING

Before proposing or executing any non-trivial code changes, you must review the following core documentation in order:
1. [`README.md`](file:///c:/Users/Manish/Desktop/Pitstop/README.md) — Tech stack, environment, and run commands.
2. [`docs/requirements.md`](file:///c:/Users/Manish/Desktop/Pitstop/docs/requirements.md) — Scope, roles, MVP boundaries, and features.
3. [`docs/architecture.md`](file:///c:/Users/Manish/Desktop/Pitstop/docs/architecture.md) — Monorepo layout, API contracts, data models, and service boundaries.
4. [`docs/design-system.md`](file:///c:/Users/Manish/Desktop/Pitstop/docs/design-system.md) — PitStop visual identity, color tokens (`#F7B928`), responsive design rules, and accessibility standards.
5. [`docs/implementation-plan.md`](file:///c:/Users/Manish/Desktop/Pitstop/docs/implementation-plan.md) — Phased roadmap and acceptance criteria.
6. [`docs/progress.md`](file:///c:/Users/Manish/Desktop/Pitstop/docs/progress.md) — Current state, completed phases, tested components, and active phase.

---

## 2. MONOREPO STRUCTURE & ARCHITECTURE RULES

- **Monorepo Layout**:
  - `apps/web`: Next.js (App Router, React, TypeScript, Tailwind CSS, Lucide Icons).
  - `apps/api`: Node.js + Express + TypeScript + Mongoose (MongoDB).
  - `packages/shared-types`: Shared TypeScript interfaces, DTOs, Enums, and validation schemas (Zod).
  - `docs`: Project documentation and specifications.
- **Strict Separation of Concerns**:
  - Web frontend MUST NOT access MongoDB or server-side DB models directly. All data access must pass through `apps/api` REST endpoints.
  - API backend MUST NOT serve HTML/React views. It is purely a JSON REST API.
  - Shared domain types MUST reside in `packages/shared-types` to ensure end-to-end type safety.

---

## 3. SECURITY & DATA PRIVACY MANDATES

- **No Hardcoded Secrets**: Never commit `.env` files, API keys, credentials, JWT secrets, or DB passwords.
- **Server-Side Authorization**: Every API endpoint requiring authentication MUST validate JWT tokens and enforce role-based access control (`Public`, `Rider`, `Merchant`, `Admin`) on the server.
- **Zero Client Trust**: Do not rely on frontend checks for permissions, price calculations, check-in validation, or job statuses. Always re-verify on the backend.
- **Input Validation**: Validate every request body, query parameter, and route parameter using Zod schemas on the backend before processing.
- **Data Privacy**: Location coordinates and personal user details must be treated with privacy. Only store essential location history required for verified check-ins.

---

## 4. DESIGN & STYLING CONVENTIONS

- **Brand Identity**:
  - Primary Accent: PitStop Yellow (`#F7B928`).
  - Page Background: Soft Gray (`#F4F6F8`).
  - Surface Background: White (`#FFFFFF`).
  - Primary Text: Charcoal (`#202124`).
  - Secondary Text: Muted Gray (`#686868`).
  - Border: Light Gray (`#E3E5E8`).
- **Use Tokens**: Always use Tailwind utilities or CSS custom properties defined in the design system. Never use arbitrary inline color values or random hex codes.
- **Mobile-First Responsive**: All UI components must be fully usable on mobile screens (320px–479px) up to wide desktop screens (1440px+). Use clean navigation, bottom navigation bars for riders on mobile, and responsive drawer/modal patterns.

---

## 5. CODE QUALITY & TESTING STANDARDS

- **TypeScript**: Strict mode enabled across all packages. Avoid `any` types; prefer strict interfaces and type guards.
- **Empirical Verification**: Never claim a feature is complete without running build/compile scripts or running tests.
- **Progress Log Updates**: Always update [`docs/progress.md`](file:///c:/Users/Manish/Desktop/Pitstop/docs/progress.md) at the end of each completed phase or major milestone.

---

## 6. PHASED DEVELOPMENT APPROACH

- Do not attempt to build future phases prematurely.
- Complete current active phase acceptance criteria before moving forward.
- Ask for user approval before starting new phases or introducing external paid services.
