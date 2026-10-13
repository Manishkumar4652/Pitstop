# PitStop — Production Deployment & Operational Runbook

This guide documents the production deployment requirements, environment configurations, operational runbooks, health checks, backup/recovery strategies, and security hardening procedures for the PitStop platform.

---

## 1. System Architecture & Independent Deployment

PitStop is structured as an npm monorepo with strict decoupling between the client/BFF web application and the REST API service. They can and should be deployed independently.

```
                    ┌────────────────────────┐
                    │      Delivery Rider     │
                    │      Local Merchant    │
                    │      Administrator     │
                    └───────────┬────────────┘
                                │ HTTPS / WSS
                                ▼
       ┌──────────────────────────────────────────────────┐
       │   apps/web — Next.js 14 App Router + BFF Layer   │
       │   - Hosting: Vercel / AWS Amplify / Docker / Node│
       │   - Public UI, Client Components, Static SSR     │
       │   - BFF API routes (/api/*)                      │
       │   - HttpOnly Cookie Transport & CSRF Protection  │
       └────────────────────────┬─────────────────────────┘
                                │ Internal / VPC HTTPS
                                ▼
       ┌──────────────────────────────────────────────────┐
       │   apps/api — Express 4 + TypeScript REST Service │
       │   - Hosting: AWS ECS / Render / Fly.io / K8s     │
       │   - Pure JSON REST Endpoints (/api/v1/*)         │
       │   - JWT Role-Based Authorization (RBAC)          │
       │   - Zod Request Validation & Atomic Invariants   │
       └────────────────────────┬─────────────────────────┘
                                │ TLS Connection String
                                ▼
       ┌──────────────────────────────────────────────────┐
       │   MongoDB Atlas (Database Engine)                │
       │   - Replica Set / Dedicated Cluster              │
       │   - 2dsphere Geo Indexes, Compound Uniques       │
       │   - Automated Daily Backups & PITR               │
       └──────────────────────────────────────────────────┘
```

---

## 2. Environment Configuration Matrix

### Backend API (`apps/api`)

| Variable | Required in Production | Default | Purpose / Security Standard |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | `development` | Set to `production` to activate production guards, strict CORS, and disable stack traces. |
| `PORT` | Optional | `5000` | Port for Express HTTP listener. |
| `API_PORT` | Optional | (uses `PORT`) | Specific override for API port if shared with reverse proxy. |
| `API_URL` | Optional | `http://localhost:5000` | Canonical external URL of the API service. |
| `CLIENT_URL` | **Yes** | `http://localhost:3000` | Strict origin allowlist for production CORS requests from the web frontend. |
| `API_PREFIX` | Optional | `/api/v1` | URL namespace for versioned REST API endpoints. |
| `MONGODB_URI` | **Yes** | None | Full MongoDB Atlas connection URI (`mongodb+srv://...`). Validated at startup. |
| `JWT_SECRET` | **Yes** | None | Cryptographic secret for signing auth tokens. **Must be >= 32 characters** (enforced by Zod schema). |
| `JWT_EXPIRES_IN` | Optional | `15m` | Token lifetime window. Short-lived access token. |
| `QR_SIGNING_SECRET`| Optional | Falls back to `JWT_SECRET` | Dedicated secret for signing venue HMAC-SHA256 QR credentials. **Must be >= 32 characters** if specified. |

### Frontend Web (`apps/web`)

| Variable | Required in Production | Default | Purpose / Security Standard |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | `development` | Set to `production` to enable Next.js production optimization and cookie security. |
| `PORT` | Optional | `3000` | Port for Next.js HTTP server. |
| `PITSTOP_API_BASE_URL` | **Yes** | `http://127.0.0.1:5000/api/v1` | **Server-only** backend URL. Never prefix with `NEXT_PUBLIC_*`. |
| `PITSTOP_ENABLE_DEMO_FALLBACK` | **Must be false** | `false` | Strictly forbidden in production. Production always serves live backend data. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Optional | None | Optional public token for client-side map rendering (if Mapbox is enabled). |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY`| Optional | None | Optional public key for client-side Google Maps SDK (if Google Maps is enabled). |

---

## 3. Database Deployment & Index Management

### MongoDB Atlas Setup Checklist
1. **Cluster Provisioning**:
   - Minimum M10 cluster recommended for production to enable Automated Daily Snapshots and Point-in-Time Recovery (PITR).
2. **Network Security**:
   - Configure IP Access List to allow only the backend API server VPC / static egress IPs.
   - Do not use `0.0.0.0/0` in production environments.
3. **Index Creation (`autoIndex`)**:
   - In development/test, Mongoose automatically builds indexes (`autoIndex: true`).
   - In production (`NODE_ENV=production`), `autoIndex` is automatically set to `false` in `apps/api/src/config/database.ts` to prevent performance degradation during deployment.
   - Pre-build indexes using MongoDB Compass or the MongoDB CLI before launching new application versions.
4. **Required Production Indexes**:
   - `User`: `{ phone: 1 }` (unique), `{ email: 1 }` (sparse unique), `{ role: 1 }`
   - `RestStop`: `{ location: "2dsphere" }`, `{ slug: 1 }` (unique), `{ merchantId: 1 }`, `{ "address.city": 1, status: 1 }`
   - `Deal`: `{ restStopId: 1, isActive: 1 }`, `{ merchantId: 1, isActive: 1 }`
   - `Job`: `{ restStopId: 1, status: 1 }`, `{ merchantId: 1, status: 1 }`, `{ category: 1, status: 1 }`
   - `JobApplication`: `{ jobId: 1, riderId: 1 }` (unique compound), `{ merchantId: 1, status: 1 }`, `{ riderId: 1, status: 1 }`, `{ jobId: 1, status: 1 }`
   - `CheckIn`: `{ riderId: 1, restStopId: 1, checkInTime: -1 }`, `{ restStopId: 1, status: 1 }`
   - `AuditLog`: `{ createdAt: -1 }`, `{ targetType: 1 }`, `{ targetId: 1 }`, `{ adminId: 1 }`

---

## 4. Health Checks & Liveness Probes

The backend exposes two standard endpoints for container orchestrators, load balancers, and monitoring tools:

1. **Process Liveness Probe (`GET /health`)**:
   - Route: `http://api-service:5000/health`
   - Response: HTTP 200 OK
   ```json
   {
     "status": "ok",
     "service": "PitStop REST API",
     "environment": "production",
     "timestamp": "2026-10-12T10:00:00.000Z",
     "uptimeSeconds": 86400
   }
   ```
2. **Database Readiness Probe (`GET /api/v1/health`)**:
   - Route: `http://api-service:5000/api/v1/health`
   - Response when connected: HTTP 200 OK
   ```json
   {
     "status": "ok",
     "service": "PitStop REST API v1",
     "environment": "production",
     "database": "connected",
     "timestamp": "2026-10-12T10:00:00.000Z",
     "uptimeSeconds": 86400
   }
   ```
   - If the database is disconnected or unreachable, the database field reports `"disconnected"` and active data endpoints safely return HTTP 503 Service Unavailable.

---

## 5. Security & Reverse Proxy Guidelines

1. **Reverse Proxy Configuration (`trust proxy`)**:
   - When running behind AWS ALB, Cloudflare, or Nginx, configure the proxy to forward `X-Forwarded-For` and `X-Forwarded-Proto`.
   - Ensure the reverse proxy strips spoofed incoming client headers.
2. **CORS Restrictions**:
   - In production, `createCorsMiddleware` strictly rejects any origin that does not match `CLIENT_URL`.
3. **Session Cookie Isolation**:
   - `AUTH_COOKIE_NAME` (`pitstop_token`) is marked `HttpOnly: true`, `SameSite: 'lax'`, and `Secure: true` in production.
   - Client-side JavaScript cannot read or extract JWT authentication tokens.
4. **CSRF Protection on BFF**:
   - All state-mutating requests (`POST`, `PATCH`, `DELETE`) verified against request `Origin` and `Host` headers.
5. **No Credential Logging**:
   - MongoDB connection strings are sanitized with `maskMongoUri()` to prevent password leaks in container logs.
   - Stack traces are withheld from public error envelopes in production (`isProd` guard).

---

## 6. Backup, Recovery & Incident Response

1. **Continuous Backups**:
   - Enable Continuous Cloud Backups in MongoDB Atlas with retention period of at least 7 days.
2. **Database Outage Fail-Safe**:
   - If MongoDB Atlas becomes unavailable during runtime, the API enters a safe state where data-mutating operations fail with HTTP 503 instead of corrupting state or serving fabricated mock data.
3. **Graceful Shutdown**:
   - The Express application listens for `SIGTERM` and `SIGINT` signals. Upon receipt:
     - Closes incoming HTTP socket connections to finish in-flight requests.
     - Calls `disconnectDatabase()` to cleanly flush MongoDB connection pools.
     - Enforces a 10-second unref timeout to prevent zombie processes.
