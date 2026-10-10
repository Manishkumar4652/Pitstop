# PitStop — Product Requirements Document (PRD)

## 1. Product Overview & Vision

**Product Name**: PitStop  
**Tagline**: *"Every rider deserves a place to stop."*  
**Target Market**: India (Gig workers, delivery riders for Zomato, Swiggy, Blinkit, Zepto, Amazon, Flipkart; ride-hailing drivers for Uber, Ola, Rapido; local merchant partners).  

### Problem Statement
India's gig economy powers millions of daily doorstep deliveries and rides. However, gig workers face severe physical and operational challenges during their long shifts:
- Lack of clean, safe rest facilities (drinking water, seating, mobile charging, clean restrooms).
- Income downtime during non-peak afternoon hours (14:00 – 17:00).
- High cost of food and refreshments while on shift.
- Local merchants lack cost-effective ways to attract foot traffic and secure short-term operational help during off-peak windows.

### Solution Statement
PitStop is a web-based discovery and local opportunity platform connecting gig workers with verified merchant rest stops. Riders receive free or discounted amenities and exclusive food deals, while local merchants gain foot traffic and can publish short-term, verified micro-job postings for eligible riders.

---

## 2. Scope & Target Platform

- **Platform**: Responsive Web Application (Optimized for Mobile browsers, accessible on Tablets and Desktop).
- **Out of Scope for Initial MVP**:
  - Native iOS / Android apps (Web MVP first).
  - Built-in real money wallet / payment processing (Cash or third-party UPI redirect only in later phase).
  - Paid merchant subscription billing.
  - Complex automated AI routing / navigation engine (Google Maps / Mapbox deep-linking preferred).

---

## 3. User Roles & Capabilities

### 3.1 Public Visitor
- Browse public landing page, how-it-works, values, and merchant onboarding pages.
- Explore public rest-stop listings and public micro-job board with search & category filters.
- View rest-stop details, facility icons, operating hours, and basic ratings.
- Prompted to register/login when attempting to check in, save stops, apply for jobs, or redeem deals.

### 3.2 Rider
- **Account & Profile**: Register via Mobile OTP/Email, manage vehicle/work platform details (e.g., Zomato, Swiggy, Rapido).
- **Rest-Stop Discovery**: Filter rest stops by amenities (Drinking Water, Seating, Charging, Restroom, WiFi, Parking, AC), view distance, status (Open/Closed), and crowding indicators.
- **Check-ins**: Scan merchant QR code or provide OTP at rest stop to confirm check-in and unlock exclusive perks.
- **Deals & Discounts**: Browse active merchant food/beverage deals and generate single-use redemption codes.
- **Micro-Jobs Marketplace**: Search off-peak paid helper jobs (e.g., parcel sorting, store loading, flyer distribution), submit 1-tap application, track status.
- **Saved & History**: Bookmark favorite rest stops; view personal check-in and earnings/job application history.

### 3.3 Merchant
- **Registration & Verification**: Create merchant account, submit business details, address, operating hours, and facility photo proofs.
- **Rest-Stop Management**: Update available facilities, capacity status, and temporary announcements.
- **QR Code & Check-in Desk**: View/print unique business QR code; validate rider check-in OTPs/QR codes.
- **Deals & Offers Management**: Create, edit, activate, or pause rider-exclusive deals (e.g., "50% off Chai & Samosa").
- **Job Listings Management**: Post short-term micro-jobs with pay rate, time slot, required headcount, and instructions; review and accept/reject rider applications.
- **Analytics & Insights**: View daily rider footfall, deal redemptions, and job fulfillment metrics.

### 3.4 System Administrator
- **Dashboard & Moderation**: Monitor platform health, total users, active rest stops, check-ins, and job applications.
- **Merchant Verification**: Review and approve/reject pending merchant registrations and rest-stop profiles.
- **Content Moderation**: Flag, hide, or remove inappropriate job listings, deals, or reviews.
- **User Management**: Deactivate offending accounts (rider or merchant) reported for abuse.
- **Audit Logging & System Settings**: Track administrative actions and system configuration parameters.

---

## 4. Route Architecture

### Public Routes
- `/` — Landing Page (Hero, Tagline, Value Props, Quick Search, Featured Rest Stops).
- `/explore` — Search & Filter Rest-Stops (Interactive List + Map View).
- `/rest-stops/[slug]` — Detailed Rest-Stop View (Facilities, Operating Hours, Address, Deals, Reviews).
- `/jobs` — Public Micro-Job Board (Search & Filter by Location/Category).
- `/how-it-works` — Explainer for Riders & Merchants.
- `/for-merchants` — Merchant Partnership Onboarding Info.
- `/about` — Platform Mission & Vision.
- `/contact` — Support & Feedback Contact Form.
- `/privacy` — Privacy Policy & Data Protections.
- `/terms` — Terms of Service & User Conduct Guidelines.

### Rider Routes (Authenticated)
- `/rider/dashboard` — Personal summary (Recent check-ins, saved stops, active job applications).
- `/rider/map` — Nearby Map Discovery with GPS location toggle.
- `/rider/check-ins` — Active QR scanner / OTP generator for check-in.
- `/rider/deals` — Exclusive rider deals catalog & active coupons.
- `/rider/jobs` — Job search, filtered for rider preferences.
- `/rider/applications` — Track submitted micro-job applications and status (Applied, Accepted, Completed).
- `/rider/saved` — Bookmarked rest stops.
- `/rider/notifications` — System & application status alerts.
- `/rider/profile` — Rider profile, work platform, vehicle info, and account settings.

### Merchant Routes (Authenticated)
- `/merchant/dashboard` — Merchant overview (Today's check-ins, active deals, open jobs).
- `/merchant/profile` — Business details & contact information.
- `/merchant/rest-stop` — Facility management, hours, photos, and live capacity toggle.
- `/merchant/check-ins` — QR printer & manual OTP verification portal.
- `/merchant/deals` — Create and manage active deals.
- `/merchant/jobs` — Post new jobs and manage active listings.
- `/merchant/applications` — Review applicant riders for posted jobs.
- `/merchant/analytics` — Footfall, deal conversion, and job history analytics.
- `/merchant/billing` — (Future Phase) Subscription & billing history.

### Admin Routes (Protected)
- `/admin/dashboard` — Platform performance indicators & quick admin actions.
- `/admin/users` — Rider user directory & account management.
- `/admin/merchants` — Merchant approvals & verification queue.
- `/admin/rest-stops` — Master directory of rest stops.
- `/admin/jobs` — Moderation queue for micro-job postings.
- `/admin/check-ins` — Check-in audit log.
- `/admin/reports` — Community reports, flags, and conflict tickets.
- `/admin/advertisements` — (Future Phase) Sponsored listings management.
- `/admin/transactions` — (Future Phase) Financial audit logs.
- `/admin/settings` — Platform variables and notification triggers.

---

## 5. Security & Data Protection Requirements

1. **Role-Based Access Control (RBAC)**: All non-public API endpoints require valid JWT authentication. Middleware must verify the requesting user's role (`Rider`, `Merchant`, `Admin`) server-side.
2. **Input Validation & Sanitization**: Strict schema validation using Zod on all incoming API request payloads to prevent injection attacks and invalid data states.
3. **Password & Secret Security**: Passwords hashed with bcrypt (salt rounds = 12). API secrets and tokens stored exclusively in environment variables.
4. **Rate Limiting**: Protect authentication (`/api/auth/*`), check-in (`/api/check-ins/*`), and job application endpoints with rate limiting to prevent brute-force attacks.
5. **Data Privacy**: Location access is opt-in. Rider location coordinates are evaluated strictly for distance sorting and rest-stop check-in verification, not shared with third parties.

---

## 6. Functional Acceptance Criteria (MVP Boundaries)

- [ ] **Discovery**: Public users can search and filter rest stops by facilities (Water, Seating, Charging, Restrooms).
- [ ] **Check-in Verification**: Server verifies check-in via OTP or QR payload match within valid distance/time parameters.
- [ ] **Micro-Job Workflow**: Merchants can post jobs; riders can submit applications; merchants can update application status to Accepted/Rejected.
- [ ] **Deals Workflow**: Merchants can post deals; riders can generate single-use deal redemption codes; merchants can mark codes as redeemed.
- [ ] **Moderation**: Admin users can approve pending merchants and remove invalid listings.
- [ ] **Responsive Design**: All screens function without horizontal overflow across mobile (320px+), tablet, and desktop breakpoints.
