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

1. **Authentication Flow**:
   - Client sends credentials (`/api/v1/auth/login` or `/api/v1/auth/send-otp`).
   - Server returns JWT containing `userId`, `role`, and `isVerified`.
   - Client stores token in HTTP-only Cookie or Secure Local Memory for API request header authorization (`Bearer <token>`).

2. **Authorization Middleware**:
   ```
   Request ---> RateLimiter ---> AuthMiddleware (Verify JWT) ---> RBACMiddleware (Check Role) ---> Controller
   ```

3. **Geospatial Distance Queries**:
   - RestStop collection indexes `location` field with `{ location: '2dsphere' }`.
   - Discovery endpoint uses `$near` or `$geoNear` to return nearest stops within a specified radius (e.g., 5km).

---

## 6. External Service Integration Boundaries

- **Maps & Geocoding**: Abstracted behind `IMapService` interface. MVP uses direct Google Maps / Mapbox deep-links for navigation, ready for embedded Mapbox GL / Leaflet maps.
- **SMS / OTP Service**: Abstracted behind `ISmsService` interface. Development mode uses a mock OTP engine; production can toggle Twilio / MSG91.
- **Media Storage**: Abstracted behind `IStorageService` interface. Development uses local uploads; production connects to Cloudinary / AWS S3.
