# PitStop — Technical Architecture & System Design

## 1. Monorepo & System Architecture Overview

PitStop utilizes a clean, modular monorepo architecture managed via **npm workspaces**. This ensures strict separation of concerns between the user-facing web frontend and the backend REST API, while sharing common domain models and validation rules via a dedicated package.

```
                     +----------------------------------+
                     |     Client Applications          |
                     |  (Mobile Web / Desktop Browsers) |
                     +----------------------------------+
                                      |
                                      | HTTPS / JSON REST API
                                      v
                     +----------------------------------+
                     |         apps/api                 |
                     |  (Express.js + Node.js + TS)     |
                     +----------------------------------+
                               |              |
           +-------------------+              +-------------------+
           | Data Access                      | Validation & Types |
           v                                  v
+-----------------------+           +-----------------------------------+
|  MongoDB Atlas /      |           |   packages/shared-types           |
|  Mongoose ODM         |           |   (Zod Schemas & TypeScript DTOs) |
+-----------------------+           +-----------------------------------+
```

---

## 2. Directory Layout & Package Boundaries

```
pitstop/
├── apps/
│   ├── web/                     # Next.js App Router Frontend
│   │   ├── app/                 # Route pages & layouts (App Router)
│   │   │   ├── (public)/        # Landing, Explore, Jobs, How-it-works
│   │   │   ├── (auth)/          # Login, Register, OTP verification
│   │   │   ├── rider/           # Authenticated Rider portal
│   │   │   ├── merchant/        # Authenticated Merchant portal
│   │   │   └── admin/           # Protected Admin portal
│   │   ├── components/          # Reusable UI components & design system primitives
│   │   │   ├── ui/              # Buttons, Cards, Inputs, Badges, Modals
│   │   │   ├── layout/          # Navigation, Header, Sidebar, BottomNav
│   │   │   └── features/        # RestStopCard, CheckinModal, JobCard
│   │   ├── lib/                 # API client services, utils, auth helper
│   │   └── styles/              # Global CSS & Tailwind configuration
│   │
│   └── api/                     # Express.js Backend REST API
│       └── src/
│           ├── config/          # DB connection, env loading, constants
│           ├── middleware/      # Auth JWT, Role RBAC, Rate limit, Error handler
│           ├── modules/         # Domain-driven backend modules
│           │   ├── auth/        # Auth controller, service, routes
│           │   ├── users/       # User management module
│           │   ├── rest-stops/  # Rest stops discovery & management
│           │   ├── check-ins/   # QR/OTP check-in verification module
│           │   ├── deals/       # Merchant deals & redemption module
│           │   ├── jobs/        # Micro-jobs & application module
│           │   └── admin/       # Moderation & system stats module
│           ├── models/          # Mongoose database schemas
│           └── utils/           # Logger, API error responses, helper functions
│
├── packages/
│   └── shared-types/            # Shared TypeScript Types & Validation Schemas
│       └── src/
│           ├── enums/           # UserRoles, RestStopFacility, JobStatus, CheckinStatus
│           ├── dtos/            # Request/Response payloads for API contracts
│           ├── models/          # Shared domain interfaces
│           └── schemas/         # Zod validation schemas
│
└── docs/                        # Specifications, Design Tokens, Roadmap
```

---

## 3. Technology Stack Specification

| Component | Selected Technology | Rationale & Compatibility |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14+ (App Router)** | Full SSR/SSG support for public SEO pages (`/explore`, `/rest-stops/[slug]`), client-side interactivity for portals. |
| **Frontend Language** | **TypeScript 5.x (Strict)** | End-to-end type safety, eliminating runtime null pointer crashes. |
| **Styling & UI** | **Tailwind CSS 3.4+ / 4.x** | Utility-first styling with custom PitStop design system tokens. |
| **Iconography** | **Lucide React** | Lightweight, accessible, consistent icon set. |
| **Backend Runtime** | **Node.js 20/24 LTS** | High-concurrency I/O performance. |
| **Backend Framework**| **Express.js 4.x** | Fast, unopinionated REST API framework with rich middleware ecosystem. |
| **Database** | **MongoDB Atlas & Mongoose 8.x** | Flexible JSON document model ideal for location geospatial indexes (`2dsphere`), rest-stop facility arrays, and variable job metadata. |
| **Validation** | **Zod 3.x** | Shared schema validation between Next.js forms and Express API routes. |
| **Authentication** | **JWT (JSON Web Tokens)** | Stateless authentication with HTTP-only cookies or Bearer headers. |

---

## 4. Database Schema Design (Mongoose)

### 4.1 User Schema (`users`)
```typescript
interface IUser {
  _id: ObjectId;
  name: string;
  phone: string;                // Primary identifier for India mobile users
  email?: string;
  passwordHash?: string;        // Hashed with bcrypt
  role: 'rider' | 'merchant' | 'admin';
  isVerified: boolean;
  avatarUrl?: string;
  riderProfile?: {
    platform: 'zomato' | 'swiggy' | 'blinkit' | 'zepto' | 'uber' | 'ola' | 'rapido' | 'other';
    vehicleType: '2-wheeler-ev' | '2-wheeler-petrol' | 'bicycle' | 'auto' | 'car';
    vehicleNumber?: string;
  };
  merchantProfile?: {
    businessName: string;
    businessType: 'restaurant' | 'tea_stall' | 'garage' | 'supermarket' | 'service_center' | 'other';
    gstNumber?: string;
    address: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 RestStop Schema (`rest_stops`)
```typescript
interface IRestStop {
  _id: ObjectId;
  merchantId: ObjectId;         // Reference to User (Merchant)
  name: string;
  slug: string;
  description: string;
  address: {
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  location: {
    type: 'Point';
    coordinates: [number, number]; // [Longitude, Latitude] for geospatial 2dsphere index
  };
  facilities: Array<
    'drinking_water' | 'seating' | 'charging' | 'restroom' | 'wifi' | 'parking' | 'air_conditioning' | 'first_aid'
  >;
  images: string[];
  capacity: {
    maxRiders: number;
    currentOccupancy: number;
    status: 'available' | 'busy' | 'full';
  };
  operatingHours: Array<{
    day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
    openTime: string;  // e.g. "08:00"
    closeTime: string; // e.g. "22:00"
    isOpen: boolean;
  }>;
  status: 'pending_approval' | 'active' | 'suspended';
  rating: {
    average: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.3 Deal Schema (`deals`)
```typescript
interface IDeal {
  _id: ObjectId;
  restStopId: ObjectId;
  merchantId: ObjectId;
  title: string;
  description: string;
  discountPercentage?: number;
  flatDiscountAmount?: number;
  originalPrice?: number;
  dealPrice?: number;
  terms: string;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  maxRedemptionsPerRider?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.4 Micro-Job Schema (`jobs`)
```typescript
interface IJob {
  _id: ObjectId;
  merchantId: ObjectId;
  restStopId: ObjectId;
  title: string;
  description: string;
  category: 'parcel_sorting' | 'loading_unloading' | 'flyer_distribution' | 'cleaning_prep' | 'store_assistant' | 'other';
  payAmount: number;            // INR amount
  payType: 'fixed' | 'hourly';
  durationMinutes: number;
  startTime: Date;
  endTime: Date;
  requiredRiders: number;
  acceptedRidersCount: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  instructions: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.5 CheckIn Schema (`check_ins`)
```typescript
interface ICheckIn {
  _id: ObjectId;
  riderId: ObjectId;
  restStopId: ObjectId;
  merchantId: ObjectId;
  method: 'qr_code' | 'otp';
  verificationCode?: string;
  status: 'pending' | 'verified' | 'expired' | 'rejected';
  checkInTime: Date;
  checkOutTime?: Date;
  locationAtCheckIn?: {
    type: 'Point';
    coordinates: [number, number];
  };
  createdAt: Date;
}
```

---

## 5. Security Architecture & Data Flow

1. **Authentication Flow (Phase 3C)**:
   - **Registration** (`POST /api/v1/auth/register`): Validates request with `RegisterRequestSchema`. Enforces role restrictions (`rider` or `merchant` only; public `admin` registration is strictly forbidden). Hashes passwords with `bcryptjs` (salt rounds: 12 in production, 8 in test). Verifies phone and email uniqueness, returning HTTP 409 on duplicate records. Issues signed JWT and sanitized `UserPublicProfile`.
   - **Login** (`POST /api/v1/auth/login`): Verifies credentials with phone and password. Uses constant-time bcrypt verification and returns generic invalid-credential errors (HTTP 401) on missing user or mismatched password to protect against account enumeration attacks.
   - **Current User Profile** (`GET /api/v1/auth/me`): Protected endpoint requiring Bearer JWT. Loads active user profile from database, excluding `passwordHash` and internal metadata.

2. **JWT Token Structure & Secret Management**:
   - Access tokens are cryptographically signed using `JWT_SECRET` (validated at boot to be >= 32 characters).
   - Standard claims: `{ sub: userId, role: UserRole, iat: number, exp: number }`.
   - Default expiration: `15m` (configurable via `JWT_EXPIRES_IN`).
   - Tokens never include passwords, email addresses, or unnecessary personal data.

3. **Authorization Middleware**:
   ```
   Request ---> AuthMiddleware (Extract Bearer, verify JWT, load DB user) ---> RBACMiddleware (Check UserRole) ---> Controller
   ```
   - `authenticateJwt`: Rejects missing, malformed, expired, or tampered tokens with HTTP 401. Attaches verified user context to typed `req.user`.
   - `requireRoles(...allowedRoles)`: Enforces zero-trust role-based access control. Returns HTTP 401 for unauthenticated calls and HTTP 403 for role mismatches.

4. **Rest-Stop Business APIs (Phase 3D1)**:
   - **Public Discovery**:
     - `GET /api/v1/rest-stops`: Returns paginated active rest stops (`status: 'active'`). Supports text search, `$all` facility filter, city filter, and allowlisted sorting. Page size is constrained to a maximum of 50.
     - `GET /api/v1/rest-stops/:slug`: Retrieves single active rest stop by unique slug. Returns HTTP 404 for missing, pending, or suspended rest stops.
   - **Merchant Operations**:
     - `POST /api/v1/rest-stops`: Merchant only. Derives `merchantId` from authenticated user token. Sets initial status strictly to `pending_approval`. Client-supplied status, ratings, and merchant IDs are rejected via `.strict()` Zod validation.
     - `PATCH /api/v1/rest-stops/:id`: Merchant only. Enforces server-side ownership (`restStop.merchantId === req.user._id`), returning HTTP 403 Forbidden on ownership mismatches. Restricts updates to an explicit allowlist of properties.
   - **Admin Moderation**:
     - `GET /api/v1/admin/rest-stops`: Admin only. Lists rest stops of all statuses with merchant ID references and administrative metadata.
     - `PATCH /api/v1/admin/rest-stops/:id/status`: Admin only. Validates status transitions to `pending_approval`, `active`, or `suspended`.

5. **Deals Business APIs (Phase 3D2A)**:
   - **Public Discovery**:
     - `GET /api/v1/deals`: Returns active deals meeting strict public visibility criteria (`isActive: true`, `validFrom <= now`, `validUntil > now` if set, and linked to a rest stop where `status === 'active'`). Supports text search, `discountType` filter, `restStopId` filter, pagination (max limit 50), and allowlisted sorting.
     - `GET /api/v1/deals/:id`: Returns safe deal DTO. Only returns 200 if the deal is active, not expired, and linked to an active rest stop. Returns HTTP 404 for missing, inactive, expired, or unavailable deals without leaking private merchant or moderation details.
   - **Merchant Operations**:
     - `POST /api/v1/deals`: Merchant only. Derives `merchantId` from authenticated user token. Validates that the merchant owns the associated `restStopId` and that the rest stop is approved and active (`status === 'active'`). Rejects past `validUntil` dates, invalid discount percentages, and client-supplied merchant IDs.
     - `PATCH /api/v1/deals/:id`: Merchant only. Enforces server-side ownership (`deal.merchantId === req.user._id`), returning HTTP 403 Forbidden on ownership mismatches. Prevents activating an expired deal without extending its validity window. Restricts updates to strictly allowlisted deal properties via `.strict()` Zod schema.
   - **Admin Moderation**:
     - `GET /api/v1/admin/deals`: Admin only. Lists all deals (active, inactive, paused, expired) across all venues with administrative metadata. Supports pagination and status filtering.
     - `PATCH /api/v1/admin/deals/:id/status`: Admin only. Toggles status/isActive (e.g. pausing or reinstating deals). Rejects attempts to activate expired deals. Extraneous fields are rejected via `.strict()` Zod schema.

6. **Micro-Jobs Business APIs (Phase 3D2B1)**:
   - **Public Discovery**:
     - `GET /api/v1/jobs`: Returns open micro-jobs meeting strict rider eligibility criteria (`status: 'open'`, `acceptedRidersCount < requiredRiders`, `endTime > now`, and linked to an approved rest stop where `status === 'active'`). Supports text search, `category` filter, `restStopId` filter, `payType` filter, pagination (max limit 50), and allowlisted sorting (`newest`, `oldest`, `pay_desc`, `pay_asc`, `duration_asc`).
     - `GET /api/v1/jobs/:id`: Returns safe job DTO. Only returns 200 if the job is open, unfilled, future-dated, and linked to an active rest stop. Returns HTTP 404 for missing, cancelled, filled, or unavailable jobs without leaking merchant private state.
   - **Merchant Operations**:
     - `POST /api/v1/jobs`: Merchant only. Derives `merchantId` from authenticated user token. Validates that the merchant owns the referenced `restStopId` and that the rest stop is approved and active (`status === 'active'`). Rejects past `endTime`, inverted timings (`endTime <= startTime`), duration under 15 minutes, and client-supplied merchant IDs. Sets initial status strictly to `open` with 0 accepted riders.
     - `PATCH /api/v1/jobs/:id`: Merchant only. Enforces server-side ownership (`job.merchantId === req.user._id`), returning HTTP 403 Forbidden on ownership mismatches. Restricts updates to an explicit allowlist via `.strict()` Zod schema. Merchants can only transition status between `open` and `cancelled`. Prevents modifying completed jobs.
   - **Admin Moderation**:
     - `GET /api/v1/admin/jobs`: Admin only. Lists all micro-jobs across all merchants and venues with administrative metadata. Supports pagination, category, and status filters.
     - `PATCH /api/v1/admin/jobs/:id/status`: Admin only. Moderates job status (`open`, `in_progress`, `completed`, `cancelled`). Extraneous fields are rejected via `.strict()` Zod schema.


7. **Check-In & Verification APIs (Phase 3D2B2)**:
   - **Rider Operations**:
     - `POST /api/v1/check-ins`: Rider only. Derives `riderId` strictly from authenticated server user token. Validates referenced `restStopId` exists and is approved and active (`status === 'active'`). Derives `merchantId` from verified rest stop. Enforces duplicate check-in policy: a check-in within a 15-minute cooldown window at the same rest stop returns HTTP 409 Conflict. Generates server-side cryptographic token and sets initial status strictly to `pending`. Rejects client-supplied status, riderId, merchantId, and server timestamps via `.strict()` Zod schema. Returns safe rider DTO without exposing raw verification codes or location coordinates.
     - `GET /api/v1/check-ins/me`: Rider only. Mounted before `/:id`. Returns paginated check-in records belonging exclusively to the authenticated rider. Supports pagination (max limit 50) and safe timestamp sorting (`newest`, `oldest`). Excludes sensitive verification secrets.
     - `GET /api/v1/check-ins/:id`: Rider only. Retrieves check-in record belonging to the authenticated rider. Returns HTTP 404 if the record does not exist or belongs to another rider (preventing identity or venue presence leakage).
   - **Merchant Operations**:
     - `GET /api/v1/merchant/check-ins`: Merchant only. Returns check-in records for rest stops owned by the authenticated merchant. Supports `restStopId` filter with verified venue ownership check (returns HTTP 403 Forbidden if requesting another merchant's stop). Privacy safeguards: excludes rider phone numbers, email addresses, exact GPS coordinates, and verification secrets.
   - **Admin Moderation**:
     - `GET /api/v1/admin/check-ins`: Admin only. Lists check-ins across all venues. Supports pagination and filtering by `status`, `restStopId`, `riderId`, and `merchantId`. Admin DTO contains only authorized moderation fields with secrets stripped.

8. **Public Rest-Stop Discovery Frontend Integration (Phase 4A)**:
   - **Server-Only API Client (`apps/web/lib/api/`)**:
     - `PITSTOP_API_BASE_URL`: Server-only environment variable pointing to the backend API (`http://127.0.0.1:5000/api/v1` default). Never exposed through `NEXT_PUBLIC_*`.
     - `fetchPublicRestStops`: Server function with timeout, parameter serialization, envelope validation, and zero-masquerade fallback guards.
     - `fetchPublicRestStopBySlug`: Server function returning individual rest-stop details. Differentiates genuine 404s (`ApiNotFoundError`) from server/network faults.
   - **Internal Route Handler (`/api/rest-stops`)**:
     - Server-side route handler in Next.js App Router for client queries. Validates and allowlists query parameters (`page`, `limit <= 50`, `search`, `city`, `facilities`, `sort`). Rejects invalid values and forbids arbitrary proxying.
   - **Explore Discovery Experience (`/explore`)**:
     - Server Component SSR initial load with live backend data. Client Component handles debounced search, multi-facility filters, honest sort labels (`Newest Added`, `Highest Rated`, `Name (A–Z)`, `Oldest First`), and full server pagination.
   - **Rest Stop Details (`/rest-stops/[slug]`)**:
     - Dynamic SSR routing with `dynamicParams = true`. Maps genuine backend 404s to `notFound()`, while network/server failures trigger retryable error boundaries (`error.tsx`).
   - **Zero-Masquerade Fallback Policy**:
     - In production (`NODE_ENV === 'production'`), demo fallback is strictly forbidden. Network failures display retryable error states and never fabricate listings.
     - In development, demo fallback is disabled by default and runs only when `PITSTOP_ENABLE_DEMO_FALLBACK=true`, clearly displaying sample data notice banners.

---

9. **Live Backend Integration Verification & Readiness Audit (Phase 4B)**:
   - **Live Express Server Verification**:
     - Verified top-level health (`/health`) and versioned health (`/api/v1/health`) over live HTTP against a running Express instance on port 5000.
     - Verified public discovery endpoints (`GET /api/v1/rest-stops`, `GET /api/v1/rest-stops/:slug`) with real network requests, validating pagination metadata (`total`, `page`, `limit`, `totalPages`, `hasNextPage`, `hasPrevPage`) and query parameters (`search`, `city`, `facilities`, `sort`).
   - **Database Connection & Verification Status**:
     - **Local MongoDB**: Verified active connection on `mongodb://127.0.0.1:27017/pitstop_dev`. Live queries executed against Mongoose models.
     - **MongoDB Atlas**: Cloud MongoDB Atlas URI (`mongodb+srv://`) is currently unconfigured in the development environment. In adherence with truth-in-reporting rules, Atlas live integration remains unexercised until valid credentials and network access are provisioned.
   - **Public Data Privacy & Zero-Leak Enforcement**:
     - Public responses guaranteed free of merchant credentials, internal admin notes, passwords, and user IDs.
     - Public copy neutralized across `/explore`, `RestStopCard`, and `/rest-stops/[slug]` to eliminate unsubstantiated claims ("verified partner", "verified location" replaced with neutral labels).
   - **404 vs Network Failure Discrimination**:
     - Genuine missing slugs return HTTP 404 (`ApiNotFoundError`), cleanly routed to Next.js `notFound()`.
     - Server and network faults return `ApiNetworkError` or `ApiError`, cleanly triggering retryable error boundaries (`error.tsx`) without data fabrication.

---

10. **Rider Authentication & Secure Session Integration (Phase 5A)**:
    - **HttpOnly Cookie BFF Architecture**:
      - Next.js server-side route handlers (`/api/auth/*`) act as a security gateway between browser clients and the Express backend.
      - Upon successful registration (`POST /api/auth/register`) or login (`POST /api/auth/login`), the JWT token is attached strictly as an `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` (in production) cookie named `pitstop_token`.
      - Raw JWT tokens are stripped from response bodies, preventing client-side JavaScript, XSS payloads, or unauthorized scripts from accessing bearer tokens.
      - Token storage in `localStorage` or `sessionStorage` is strictly prohibited across the codebase.
    - **CSRF Defense**:
      - State-changing authentication requests (`/api/auth/login`, `/api/auth/register`, `/api/auth/logout`) validate origin/referer headers against the application host.
    - **Backend Rate Limiting**:
      - Express backend enforces server-side IP rate limiting on `/api/v1/auth/register` (15 attempts/15m) and `/api/v1/auth/login` (25 attempts/15m) returning HTTP 429 with `RateLimitError` and `Retry-After` headers.
    - **Session Lifecycle & Route Protection**:
      - `getServerSession()` validates the active `pitstop_token` against Express `GET /api/v1/auth/me`. Expired or invalid tokens trigger cookie invalidation.
      - Protected rider routes (`/rider/dashboard`, `/rider/profile`) enforce authentication via server-side session checks, redirecting unauthenticated visitors to `/rider/login?returnUrl=...`.
      - Safe open-redirect prevention: `returnUrl` is sanitized to ensure it begins with a single leading slash (`/`) and does not target external domains.
      - Authenticated rider profiles render genuine user data (`name`, `phone`, `email`, `platform`, `vehicleType`, `vehicleNumber`) without fabricating check-in or visit metrics.

---

11. **Secure Check-In Verification Protocol & Backend API (Phase 5B1)**:
    - **Protocol Overview & Trust Boundaries**:
      - Solves the physical presence verification challenge for gig workers checking in at partner rest stops without requiring complex rotating hardware displays or external paid geolocation tracking services.
      - A random code generated during check-in creation is never treated as proof of physical venue presence.
      - **Venue QR Credential Authority**: Only the venue's authenticated merchant owner (`UserRole.MERCHANT` where `restStop.merchantId == user._id`) or system administrator (`UserRole.ADMIN`) can issue, retrieve, or rotate a venue's QR credential.
      - **Cryptographic Token Binding**: Credentials use HMAC-SHA256 signatures generated with the server's private secret (`QR_SIGNING_SECRET` or `JWT_SECRET`). The payload binds the rest stop ID (`restStopId`), temporal validity window (`issuedAt`, `expiresAt`), cryptographic nonce, and venue rotation version (`version`).
      - **Rest Stop Association & Rotation**: Each rest stop maintains a `qrRotationVersion` counter. If a merchant suspects a printed QR code has been leaked, photographing it, or shared remotely, they can invoke the rotation endpoint (`POST /api/v1/merchant/rest-stops/:id/qr-credential/rotate`). Incrementing the counter immediately revokes and invalidates all previously printed or cached credentials for that venue without requiring a distributed blacklist.
      - **Rider Verification Flow (`POST /api/v1/check-ins/verify`)**:
        - Rider submits `{ restStopId, qrCredential, location? }`.
        - Rider identity is derived strictly from validated JWT claims (`req.user._id`), never from client-supplied request bodies.
        - Server verifies:
          1. Rider authentication (`UserRole.RIDER`).
          2. Rest stop exists and is in `ACTIVE` status.
          3. Cryptographic HMAC signature matches server key.
          4. `payload.restStopId == requested restStopId` (prevents cross-venue replay).
          5. `payload.version == restStop.qrRotationVersion` (prevents revoked/rotated credential reuse).
          6. `Date.now() <= payload.expiresAt` (enforces expiration window).
          7. Anti-abuse cooldown: Enforces 15-minute cooldown per rider per venue.
          8. Atomic state transition: If an existing `PENDING` check-in exists for this rider at the venue within the cooldown window, it is atomically transitioned to `VERIFIED` with `verifiedAt` populated; otherwise, a new `VERIFIED` check-in record is created.
      - **Merchant Desk Flow (`POST /api/v1/merchant/check-ins/:id/confirm` & `:id/reject`)**:
        - Authenticated merchant can confirm or reject pending check-ins at venues they own.
        - Enforces ownership isolation: Merchants cannot view, confirm, or reject check-ins for venues owned by other merchants (HTTP 403 Forbidden).
        - Pending check-ins older than 15 minutes automatically expire (`CheckinStatus.EXPIRED`) and cannot be confirmed.
        - Optional OTP verification: Merchants can optionally supply the rider's short-lived verification code to validate physical arrival.
      - **Rider Cancellation Flow (`POST /api/v1/check-ins/:id/cancel`)**:
        - Authenticated rider can cancel their own pending check-in. Non-pending check-ins cannot be cancelled. Other riders cannot cancel records they do not own.
      - **Zero Secret Leak & Privacy Guarantees**:
        - Check-in DTOs (`formatRiderCheckIn`, `formatMerchantCheckIn`, `formatAdminCheckIn`) strictly strip cryptographic signing secrets, OTP verification codes, and private raw coordinate logs.
        - Merchant views see rider display name for desk greeting, but rider phone numbers and emails are never exposed in merchant footfall endpoints.

---

12. **Rider QR Scanner & Verification UI Architecture (Phase 5B2)**:
    - **Client-Side Scanner Lifecycle & Hardware Management**:
      - Utilizes `html5-qrcode` loaded strictly on the client via dynamic import inside `useEffect`, preventing server-side rendering crashes or `navigator` reference errors.
      - **Explicit Opt-in Camera Activation**: Camera hardware stream is never started on page load or modal open. The user must explicitly tap "Start Camera Scanner", ensuring transparent permission requests and respecting user privacy.
      - **Exhaustive Hardware State Machine**: Models states explicitly: `idle`, `requesting`, `scanning`, `verifying`, `success`, `cooldown`, `error`, `permission_denied`, `camera_unavailable`, and `unsupported`. Provides actionable instructions when browser permissions are blocked.
      - **Resource Teardown**: Upon modal close, component unmount, or scan completion, all video tracks are terminated and `scanner.stop()` / `scanner.clear()` are executed to release the physical camera hardware.
    - **Scan Callback Deduplication & Race Condition Defense**:
      - Uses a synchronous execution ref (`isProcessingRef`). When a QR code is detected, subsequent scan callbacks are dropped immediately and the camera stream is halted before sending the verification request.
      - Prevents duplicate network requests and race conditions from high-frequency camera frames.
    - **BFF Security Gateway (`/api/check-ins/*`)**:
      - Next.js server-side route handlers proxy client verification and history calls to the Express REST API.
      - Reads the HttpOnly `pitstop_token` session cookie and attaches `Authorization: Bearer <token>` server-side.
      - Enforces CSRF origin header validation via `validateCsrfOrigin`.
      - Automatically clears the session cookie if the backend signals session expiry (`HTTP 401`).
    - **Secure Manual Entry Fallback**:
      - For riders with damaged camera lenses, poor lighting, or unsupported devices, an accessible fallback allows manual token entry.
      - Arbitrary input is never marked verified client-side. The manual token is submitted to the exact same backend verification endpoint (`POST /api/check-ins/verify`), ensuring identical HMAC cryptographic verification and expiration enforcement.
    - **User Experience & Platform Integration**:
      - Integrated directly on the rest-stop detail page (`/rest-stops/[slug]`) via [`RestStopCheckInDesk.tsx`](file:///c:/Users/Manish/Desktop/Pitstop/apps/web/components/rest-stops/RestStopCheckInDesk.tsx), pre-scoping the scanner modal to the selected venue.
      - Integrated into the authenticated rider dashboard ([`apps/web/app/rider/dashboard/page.tsx`](file:///c:/Users/Manish/Desktop/Pitstop/apps/web/app/rider/dashboard/page.tsx)) via [`RiderCheckInSection.tsx`](file:///c:/Users/Manish/Desktop/Pitstop/apps/web/components/rider/RiderCheckInSection.tsx), displaying real authenticated check-in footfall, status badges, and arrival timestamps.

---

13. **Merchant Authentication & Protected Portal Integration (Phase 6A)**:
    - **Role-Enforced BFF Authentication Gateway (`/api/auth/*`)**:
      - Merchant registration (`POST /api/auth/register`) enforces `role: UserRole.MERCHANT` alongside backend-validated `merchantProfile` metadata (`businessName`, `businessType`, `gstNumber`, `address`).
      - Public registration strictly rejects attempts to inject `role: 'admin'` or unauthorized privileges.
      - Merchant login (`POST /api/auth/login`) accepts an optional `requiredRole: UserRole.MERCHANT` parameter. When supplied, the BFF validates user credentials against the Express backend and verifies the resulting role claim. If a valid user attempts to log into the merchant portal with a non-merchant role (e.g. `UserRole.RIDER`), the request is rejected with HTTP 403 Forbidden and no session cookie is issued.
      - Session cookies are strictly `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` (in production). Bearer JWTs are never returned in JSON bodies or stored in `localStorage`/`sessionStorage`.
    - **Server-Side Route Protection (`verifyMerchantAccess`)**:
      - All merchant routes (`/merchant`, `/merchant/dashboard`, `/merchant/rest-stops`, `/merchant/rest-stops/new`, `/merchant/deals`, `/merchant/jobs`) are guarded on the server before rendering.
      - Unauthenticated requests are immediately redirected to `/merchant/login?returnUrl=...`.
      - Authenticated riders navigating to merchant routes are stopped server-side and presented with [`MerchantAccessDenied.tsx`](file:///c:/Users/Manish/Desktop/Pitstop/apps/web/components/merchant/MerchantAccessDenied.tsx), an accessible 403 screen offering one-tap navigation back to the rider portal or account sign-out, eliminating redirect loops.
    - **Open-Redirect Defense**:
      - The `returnUrl` query parameter is strictly sanitized to require a leading single slash (`/`) and reject protocol-relative URLs (`//`), control characters, or external domains.
    - **Truthful Identity & Zero-State Dashboard**:
      - Replaced hardcoded demo merchant identities on `/merchant` with live authenticated user sessions (`session.user.name`, `session.user.phone`, `session.user.email`).
      - Replaced fabricated footfall and revenue metrics with honest zero-states, clearly documenting that venue management and real-time footfall analytics will connect to database collections in Phase 6B.
    - **Rate Limiting Architecture & Production Considerations**:
      - Authentication endpoints utilize Express in-memory token-bucket rate limiting (`apps/api/src/middleware/rateLimit.ts`).
      - Documented architectural constraints: In multi-instance or serverless deployments, in-memory rate limiting does not share state across processes. Production deployments should configure a distributed Redis store (e.g. `rate-limit-redis`) or enforce rate limits at the edge API gateway / reverse proxy (e.g. Nginx, Cloudflare) with trusted `trust proxy` configuration.

---

14. **Merchant Rest-Stop Management & Venue QR Integration (Phase 6B)**:
    - **Backend Merchant Venue Endpoints (`/api/v1/merchant/rest-stops`)**:
      - `GET /api/v1/merchant/rest-stops`: Lists rest stops owned strictly by the authenticated merchant across all moderation statuses (`pending_approval`, `active`, `suspended`). Filters by status and search keyword; paginates results.
      - `GET /api/v1/merchant/rest-stops/:id`: Retrieves a single rest stop owned by the authenticated merchant. Returns HTTP 403 Forbidden on ownership mismatches.
      - `POST /api/v1/rest-stops`: Validates `CreateRestStopRequestSchema`, derives `merchantId` strictly from server-side JWT session, sets initial status to `pending_approval`.
      - `PATCH /api/v1/rest-stops/:id`: Enforces server-side ownership before updating mutable fields.
    - **Next.js BFF Security Gateway (`/api/merchant/rest-stops/*`)**:
      - Server-side route handlers proxy frontend requests to the Express backend using HttpOnly cookie `pitstop_token`.
      - State-changing operations (`POST /api/merchant/rest-stops`, `PATCH /api/merchant/rest-stops/[id]`, `POST .../qr-credential/rotate`) validate origin and referer headers against the host via `validateCsrfOrigin`.
      - Empty update bodies are intercepted with HTTP 400 before triggering backend network calls.
      - Tokens are never exposed to browser client JavaScript or stored in client-side storage.
    - **Cryptographic Venue QR Credential Protocol**:
      - `GET /api/v1/merchant/rest-stops/:id/qr-credential`: Retrieves an active venue's cryptographic QR payload signed via HMAC-SHA256 with the server-side `CHECKIN_SIGNING_SECRET`. Rejects pending/suspended venues with HTTP 400.
      - `POST /api/v1/merchant/rest-stops/:id/qr-credential/rotate`: Atomically increments venue's `qrRotationVersion` in database, regenerating the signed QR credential and immediately invalidating all previous token versions upon rider verification attempts.
      - **Security Disclosure**: The QR payload is a venue identifier signed with timestamp and rotation version. As a static displayed QR, it does not guarantee physical presence or single-use. Verification cooldown windows (15 min) and GPS verification provide layered presence defenses.
    - **Merchant Experience UI & Printable Posters**:
      - `/merchant/rest-stops`: Live backend-connected dashboard showing owned venues with metrics strip (Total, Active, Under Review, Capacity), status pills, search filter, and edit/QR action drawers.
      - `/merchant/rest-stops/new`: Real registration form submitting directly to the backend API.
      - `VenueQrModal`: Modal rendering SVG/Canvas QR codes via `qrcode`, rotation confirmation warning with poster replacement notice, and dedicated CSS print-media poster view.

---

15. **Merchant Deals & Promotional Offers Management (Phase 6C)**:
    - **Backend Merchant Deal Endpoints (`/api/v1/merchant/deals`)**:
      - `GET /api/v1/merchant/deals`: Lists promotional deals owned strictly by the authenticated merchant across all operational statuses (`active`, `inactive`, `expired`). Filters by status, associated `restStopId`, and search keyword (`title`, `description`, `promoCode`); paginates results.
      - `GET /api/v1/merchant/deals/:id`: Retrieves a single deal with populated `restStopName`, strictly enforcing ownership (`deal.merchantId === callerMerchantId`). Returns HTTP 403 Forbidden on ownership mismatches.
      - `POST /api/v1/deals`: Derives `merchantId` strictly from server-side JWT session (`UserRole.MERCHANT`). Validates that `restStopId` exists, belongs to the authenticated merchant, and possesses `status === RestStopStatus.ACTIVE`. Venues in `pending_approval` or `suspended` states reject deal creation with HTTP 400.
      - `PATCH /api/v1/deals/:id`: Enforces server-side ownership (`deal.merchantId === callerMerchantId`). Validates discount bounds, validity date ranges, and strictly rejects reactivating expired deals (`isActive: true` with `validUntil <= now`) with HTTP 400.
    - **Next.js BFF Security Gateway (`/api/merchant/deals/*`)**:
      - `GET /api/merchant/deals`: Proxies listing requests using the HttpOnly `pitstop_token` session cookie.
      - `POST /api/merchant/deals`: Enforces CSRF origin header validation via `validateCsrfOrigin`, validates payload via `CreateDealRequestSchema`, and forwards creation to backend.
      - `GET /api/merchant/deals/[id]`: Proxies single deal retrieval with cookie-backed bearer token.
      - `PATCH /api/merchant/deals/[id]`: Enforces CSRF origin verification, validates body via `UpdateDealRequestSchema`, rejects empty update bodies (`{}`) with HTTP 400 before making backend calls, and forwards updates to backend.
      - Zero token exposure: Raw JWTs are never exposed to browser JavaScript or stored in local storage.
    - **Business Rules & Discount Validation**:
      - `discountType: 'percentage'`: Validates `discountValue` is between 1% and 100%.
      - `discountType: 'flat'`: Validates `discountValue > 0` and `minSpend >= discountValue` if `minSpend` is provided.
      - `discountType: 'free_item'`: Validates `discountValue` is 0 or positive.
      - Date window: `validUntil > validFrom` (if both provided); prevents setting `validUntil` in the past when creating or activating deals.
    - **Merchant Experience UI & State Management**:
      - `/merchant/deals` ([`MerchantDealsContent.tsx`](file:///c:/Users/Manish/Desktop/Pitstop/apps/web/components/merchant/MerchantDealsContent.tsx)): Real backend-connected management interface with live metrics strip (Total Deals, Active, Paused, Expired), status tabs (`all`, `active`, `inactive`, `expired`), venue selector, keyword search, and zero-masquerade empty/loading/error states.
      - `CreateDealModal`: Restricts venue selection exclusively to owned active rest stops. Validates discount rules and date ranges.
      - `EditDealModal`: Allows editing permitted fields (title, description, discount value, terms, valid dates, active toggle) without allowing venue tampering.
      - Quick Toggle: Allows 1-click status pausing/reactivation with explicit warning if trying to reactivate an expired offer.

---

16. **Micro-Jobs Data Architecture & Merchant Jobs APIs (Phase 7A)**:
    - **`JobApplication` Data Model (`apps/api/src/models/JobApplication.ts`)**:
      - Encapsulates the application lifecycle between a gig worker (`riderId`, ref: `User`), a micro-job (`jobId`, ref: `Job`), and a merchant poster (`merchantId`, ref: `User`).
      - Dedicated lifecycle status enum: `JobApplicationStatus` (`'pending'`, `'accepted'`, `'rejected'`, `'withdrawn'`). Distinct from `JobStatus`.
      - **Database-Level Unique Invariant**: Compound unique index `{ jobId: 1, riderId: 1 }, { unique: true }` strictly prevents duplicate applications by the same rider for the same job at the database level.
      - **Lookup Indexes**: Compound indexes on `{ merchantId: 1, status: 1 }`, `{ riderId: 1, status: 1 }`, and `{ jobId: 1, status: 1 }` support high-performance status filtering and applicant queries.
    - **Merchant Micro-Job Endpoints (`/api/v1/merchant/jobs`)**:
      - `GET /api/v1/merchant/jobs`: Authenticated endpoint restricted to `UserRole.MERCHANT`. Derives `merchantId` strictly from verified server-side JWT session (`req.user.sub`). Returns only jobs owned by the caller across all operational statuses (`all`, `open`, `in_progress`, `completed`, `cancelled`). Supports pagination, keyword search (`title`, `description`, `instructions`), `category`, and `restStopId` filtering. Aggregates total applications and pending applications per job.
      - `GET /api/v1/merchant/jobs/:id`: Authenticated endpoint restricted to `UserRole.MERCHANT`. Validates that the requested job belongs to the authenticated merchant (`job.merchantId === callerMerchantId`); strictly rejects cross-merchant access attempts with HTTP 403 Forbidden. Populates associated venue name and application counts.
    - **Phase 7B Capacity Invariant Specification**:
      - `acceptedRidersCount` must never exceed `requiredRiders`.
      - In Phase 7B, applicant acceptance MUST be executed via an atomic database condition:
        `Job.findOneAndUpdate({ _id: jobId, status: 'open', $expr: { $lt: ['$acceptedRidersCount', '$requiredRiders'] } }, { $inc: { acceptedRidersCount: 1 } })`.
      - Read-modify-save patterns are strictly prohibited for counter increments to prevent race conditions during concurrent acceptance.
    - **Data Privacy & DTO Boundaries**:
      - Merchant job DTOs (`JobMerchantResponse`) provide operational summaries without exposing internal database internals or sensitive rider metadata.
      - Public discovery continues to expose only open, non-expired, unfilled jobs linked to active rest stops.

17. **Job Application Lifecycle & Atomic Capacity Management (Phase 7B)**:
    - **Rider Job Application (`POST /api/v1/jobs/:id/apply`)**:
      - Authenticated endpoint restricted to `UserRole.RIDER`.
      - Derives `riderId` exclusively from verified JWT session; derives `merchantId` from the persisted job document.
      - Enforces multi-point eligibility checks: job status must be `open`, end time must be in future (`endTime > now`), remaining capacity must be available (`acceptedRidersCount < requiredRiders`), and associated venue must have `status === RestStopStatus.ACTIVE`.
      - Database compound unique index `{ jobId: 1, riderId: 1 }` guarantees idempotent application submission. Duplicate submissions map to HTTP 409 Conflict.
      - Returns privacy-safe application DTO (`JobApplicationResponse`) excluding password hashes, internal secrets, and unneeded contact details.
    - **Rider Application History (`GET /api/v1/rider/applications`)**:
      - Authenticated endpoint restricted to `UserRole.RIDER`.
      - Queries strictly isolated to the calling rider (`riderId === req.user.sub`).
      - Supports pagination (`page`, `limit` capped at 50) and operational status filtering (`all`, `pending`, `accepted`, `rejected`, `withdrawn`).
      - Populates safe micro-job summaries (`jobTitle`, `restStopName`, `payAmount`, `payType`, `durationMinutes`, `startTime`, `endTime`, `instructions`).
    - **Merchant Applicant Review (`GET /api/v1/merchant/jobs/:id/applications`)**:
      - Authenticated endpoint restricted to `UserRole.MERCHANT`.
      - Strictly validates merchant ownership of the parent micro-job (`job.merchantId === callerMerchantId`); cross-merchant access returns HTTP 403 Forbidden.
      - Supports pagination, status filtering, and deterministic sorting (`newest`, `oldest`).
      - Populates safe applicant identity (`riderName`, `riderProfile.vehicleType`) while strictly omitting credentials, tokens, or private contact vectors.
    - **Merchant Application Status Update (`PATCH /api/v1/merchant/applications/:id/status`)**:
      - Authenticated endpoint restricted to `UserRole.MERCHANT`.
      - Accepts target status: strictly `'accepted'` or `'rejected'`.
      - Enforces valid state machine transition: only applications in `pending` status may be updated. Repeated acceptance, acceptance of rejected/withdrawn applications, and invalid transitions reject with HTTP 400 Bad Request.
      - **Atomic Capacity Invariant**: `0 <= acceptedRidersCount <= requiredRiders`.
      - **Two-Phase Atomic Conditional Update Strategy**:
        1. Atomically transitions `JobApplication` from `pending` to `accepted`.
        2. Atomically increments capacity on `Job` with condition: `{ _id: jobId, merchantId, status: 'open', endTime: { $gt: now }, $expr: { $lt: ['$acceptedRidersCount', '$requiredRiders'] } }, { $inc: { acceptedRidersCount: 1 } }`.
        3. If job conditional write returns null (job filled or expired in flight), immediately triggers compensation rollback: resets `JobApplication` status to `pending` and throws HTTP 409 Conflict.
      - **Rejection Transition**: Sets status to `rejected` without touching the job capacity counter.
    - **Rider Application Withdrawal (`POST /api/v1/rider/applications/:id/withdraw`)**:
      - Authenticated endpoint restricted to `UserRole.RIDER`.
      - Validates rider ownership (`app.riderId === callerRiderId`); cross-rider access returns HTTP 403 Forbidden.
      - Permits withdrawal only for applications in `pending` status.
      - Sets status to `withdrawn`. Because pending applications never consume capacity, the counter is not decremented, preserving the invariant.

18. **Merchant Micro-Jobs BFF & UI Integration (Phase 7C)**:
    - **Next.js BFF Security Gateway (`apps/web/app/api/merchant/jobs/*` & `.../applications/*`)**:
      - `GET /api/merchant/jobs`: Validates query parameters against `MerchantJobQuerySchema`. Proxies listing requests using the HttpOnly `pitstop_token` session cookie.
      - `POST /api/merchant/jobs`: Enforces CSRF origin header validation via `validateCsrfOrigin`, validates payload via `CreateJobRequestSchema`, and forwards creation to Express backend (`POST /api/v1/jobs`).
      - `GET /api/merchant/jobs/[id]`: Proxies single job retrieval with cookie-backed bearer token to `GET /api/v1/merchant/jobs/:id`.
      - `PATCH /api/merchant/jobs/[id]`: Enforces CSRF origin validation, validates body via `UpdateJobRequestSchema`, rejects empty payloads with HTTP 400 before making backend calls, and forwards updates to `PATCH /api/v1/jobs/:id`.
      - `GET /api/merchant/jobs/[id]/applications`: Enforces merchant session authentication and proxies applicant queries to `GET /api/v1/merchant/jobs/:id/applications` with query filtering.
      - `PATCH /api/merchant/applications/[id]/status`: Enforces CSRF origin check, validates status against `UpdateJobApplicationStatusSchema` (strictly `'accepted'` or `'rejected'`), and proxies to Express `PATCH /api/v1/merchant/applications/:id/status`. Gracefully translates HTTP 409 capacity conflicts into actionable client feedback.
      - **Zero Token Exposure**: Raw JWTs are never returned to client JavaScript or accessible from the browser DOM.
    - **Merchant Experience UI & State Management**:
      - `/merchant/jobs` ([`MerchantJobsContent.tsx`](file:///c:/Users/Manish/Desktop/Pitstop/apps/web/components/merchant/MerchantJobsContent.tsx)): Real backend-connected management interface with live metrics strip (Total Jobs, Open/Active, Accepted Riders, Pending Applicants), category filter, operational status tabs (`all`, `open`, `in_progress`, `completed`, `cancelled`), keyword search, and zero-masquerade empty/loading/error states.
      - `CreateJobModal`: Restricts venue selection exclusively to owned active rest stops loaded via `fetchMerchantRestStops`. Validates pay bounds, required rider capacity, and date/time ranges before submission.
      - `EditJobModal`: Allows updating operational status (`open` / `cancelled`), pay, duration, instructions, and required rider counts with input validation.
      - `JobApplicantsModal`: Interactive applicant review experience displaying safe applicant metadata (`riderName`, `vehicleType`, `notes`, `createdAt`). Only allows Accept/Reject actions on pending applications. Implements loading indicators per application to prevent duplicate clicks and handles HTTP 409 capacity conflicts by displaying explanatory messages and auto-refreshes applicant and job counters.

19. **Rider Marketplace Micro-Jobs BFF & UI Integration (Phase 7D)**:
    - **Next.js BFF Security Gateway (`apps/web/app/api/jobs/*` & `.../rider/applications/*`)**:
      - `GET /api/jobs`: Public endpoint validating query parameters (`page`, `limit`, `search`, `category`, `restStopId`, `payType`, `sortBy`) against `JobQuerySchema`. Proxies discovery requests to Express backend `GET /api/v1/jobs`. No mock fallback in production.
      - `GET /api/jobs/[id]`: Public endpoint validating job ID and proxying single job detail lookups to Express backend `GET /api/v1/jobs/:id`.
      - `POST /api/jobs/[id]/apply`: Enforces CSRF origin header verification via `validateCsrfOrigin`, reads HttpOnly `pitstop_token` session cookie server-side, validates payload against `ApplyJobRequestSchema` (optional notes up to 200 characters), and forwards application request to Express backend `POST /api/v1/jobs/:id/apply`. Safely translates HTTP 409 conflict (full capacity or already applied) and HTTP 401 session expiry into actionable client feedback.
      - `GET /api/rider/applications`: Enforces rider session authentication via HttpOnly `pitstop_token`, validates query parameters (`page`, `limit`, `status`) against `RiderJobApplicationQuerySchema`, and proxies query to Express backend `GET /api/v1/rider/applications`.
      - `POST /api/rider/applications/[id]/withdraw`: Enforces CSRF origin verification and rider session authentication, forwarding withdrawal requests to Express backend `POST /api/v1/rider/applications/:id/withdraw`.
      - **Zero Token Exposure**: Raw JWTs are strictly kept server-side in HttpOnly cookies and never leaked to client JavaScript or browser storage.
    - **Rider Experience UI & State Management**:
      - `/jobs` ([`JobsContent.tsx`](file:///c:/Users/Manish/Desktop/Pitstop/apps/web/components/jobs/JobsContent.tsx)): Real backend-connected gig marketplace with keyword search, category filter, pay-type toggle (`hourly` vs `fixed`), sorting, pagination, and honest loading, empty, and retryable error states. Supports auto-opening job details via query parameter (`?jobId=...`).
      - `JobCard` ([`JobCard.tsx`](file:///c:/Users/Manish/Desktop/Pitstop/apps/web/components/jobs/JobCard.tsx)): Semantic card displaying job title, category badge, rest stop link, pay rate/fixed amount, duration, shift time window, and required rider capacity.
      - `JobDetailModal` ([`JobDetailModal.tsx`](file:///c:/Users/Manish/Desktop/Pitstop/apps/web/components/jobs/JobDetailModal.tsx)): Comprehensive detail view. For guests, displays an honest "Log in to Apply" action with sanitized `returnUrl` parameter (`/rider/login?returnUrl=/jobs?jobId=...`). For authenticated riders, displays an application form with optional note input (max 200 chars). Disables button during inflight submission to prevent duplicate clicks. Gracefully handles HTTP 409 conflicts and auto-refreshes job data.
      - `/rider/applications` ([`RiderApplicationsContent.tsx`](file:///c:/Users/Manish/Desktop/Pitstop/apps/web/components/rider/RiderApplicationsContent.tsx)): Dedicated rider portal interface tracking application status history with live metrics strip (Total Applications, Pending, Accepted, Withdrawn/Rejected), operational status tabs (`all`, `pending`, `accepted`, `rejected`, `withdrawn`), shift timing details, and 1-click withdrawal for pending applications with confirmation and anti-duplicate loading state.
      - Navigation Integration: Added "Browse Jobs" (`/jobs`) and "My Applications" (`/rider/applications`) to `RiderNav`, and integrated a "My Applications" action in `rider/dashboard`.

20. **End-to-End Integration Audit & Release Readiness (Phase 8)**:
    - **Capacity Invariant Enforcement**:
      - Strictly guarantees `0 <= acceptedRidersCount <= requiredRiders` at all layers.
      - `PATCH /api/v1/jobs/:id` actively validates that merchants cannot reduce `requiredRiders` below the existing `acceptedRidersCount`. Attempts to do so are rejected with HTTP 400 Bad Request.
      - Disallows setting `status: 'open'` on jobs whose effective end time is in the past, preventing the accidental revival of expired micro-jobs.
      - `EditJobModal.tsx` incorporates client-side guardrails matching backend invariants.
    - **Deterministic Concurrency & Two-Phase Conditional Updates**:
      - Verified against live MongoDB: concurrent acceptances targeting the last remaining slot on a job execute safely using conditional update `{ $expr: { $lt: ['$acceptedRidersCount', '$requiredRiders'] } }`.
      - Exactly one request wins (HTTP 200) and the loser fails with HTTP 409 Conflict, triggering automatic compensation rollback that restores the application status to `pending`.
      - Persisted `acceptedRidersCount` in MongoDB is guaranteed never to exceed `requiredRiders`.
    - **Security & Data Privacy Invariants**:
      - All protected endpoints enforce server-side JWT authentication and RBAC checks; client-supplied IDs are ignored.
      - HttpOnly cookie transport keeps raw tokens completely isolated from client JavaScript.
      - State-changing Next.js BFF routes strictly enforce CSRF Origin / Referer validation.
      - DTO serialization systematically strips sensitive metadata (`passwordHash`, private tokens, credentials).
      - Production guards reject requests with HTTP 503 if the database is disconnected, preventing unintended in-memory mock fallback in production environments.
    - **Environment & Key Management**:
      - Independent `QR_SIGNING_SECRET` configuration for venue HMAC-SHA256 signatures, cleanly decoupled from `JWT_SECRET`.
      - MongoDB connection URIs masked in all server logs to prevent credential leakage.

21. **Admin Dashboard & System Moderation (Phase 9)**:
    - **Authentication & Role Authorization**:
      - Enforces strict `UserRole.ADMIN` RBAC across backend routes and BFF routes.
      - Public registration of admin accounts is prohibited at the schema and route layer.
      - Dedicated admin login UI at `/admin/login` requiring `requiredRole: UserRole.ADMIN` and redirecting unauthorized roles with HTTP 403 Forbidden.
      - Server components protected with `verifyAdminAccess` helper; client-side token never leaked to JavaScript.
    - **Real Database-Backed Metrics Aggregation (`GET /api/v1/admin/stats`)**:
      - Aggregates live platform health metrics across MongoDB collections (`User`, `RestStop`, `Deal`, `Job`, `JobApplication`, `CheckIn`).
      - Distinguishes genuine zero counts from disconnected/unavailable services.
      - Returns counts of users by role, rest stops and jobs by operational status, pending moderation queues, and recent audit activity.
    - **Merchant Verification Workflow (`GET, PATCH /api/v1/admin/merchants`)**:
      - Paginated search and filtering by verification status (`pending_review`, `verified`, `rejected`, `suspended`).
      - Safe merchant DTO serialization without leaking passwords, salt hashes, or private tokens.
      - Status transitions log mandatory moderation reasons and update verification flags atomically.
    - **Rest-Stop, Jobs & Deals Moderation**:
      - Searchable, paginated listings with city, category, and status filters.
      - Approval, suspension, and cancellation transitions with immediate public marketplace reflection (non-active venues and jobs hidden immediately).
      - Strict invariant enforcement preserving job capacity (`0 <= acceptedRidersCount <= requiredRiders`) and venue ownership.
    - **Persistent Moderation Audit Trail (`AuditLog` Collection)**:
      - Dedicated schema and Mongoose model recording `adminId`, `adminName`, `action`, `targetType` (`merchant`, `rest_stop`, `job`, `deal`, `user`), `targetId`, `targetName`, `prevStatus`, `newStatus`, `reason`, and `createdAt`.
      - Every administrative status change automatically commits an immutable audit record.
    - **BFF Gateway Security & CSRF Enforcement**:
      - 11 dedicated BFF endpoints under `/api/admin/*` forwarding HttpOnly session cookie to Express API.
      - All mutating endpoints (`PATCH /api/admin/*/:id/status`) enforce CSRF origin/referer verification.

---

## 6. External Service Integration Boundaries

- **Maps & Geocoding**: Abstracted behind `IMapService` interface. MVP uses direct Google Maps / Mapbox deep-links for navigation, ready for embedded Mapbox GL / Leaflet maps.
- **SMS / OTP Service**: Abstracted behind `ISmsService` interface. Development mode uses a mock OTP engine; production can toggle Twilio / MSG91.
- **Media Storage**: Abstracted behind `IStorageService` interface. Development uses local uploads; production connects to Cloudinary / AWS S3.

