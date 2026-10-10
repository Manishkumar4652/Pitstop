# PitStop 🛵⚡

> **"Every rider deserves a place to stop."**

PitStop is a professional, scalable web platform designed for gig workers, delivery riders, ride-hailing drivers, and local merchants in India. 

It connects riders with verified rest stops providing drinking water, seating, charging points, clean restrooms, food deals, and local micro-job opportunities during off-peak hours.

---

## 🚀 Features Overview

- 📍 **Verified Rest-Stop Discovery**: Map & list views of nearest rest spots with detailed facility filters (Water, Seating, Charging, Restrooms, WiFi, Parking).
- 🎟️ **Merchant Deals & Discounts**: Exclusive food, beverage, and service offers for registered gig riders.
- 💼 **Local Micro-Jobs Marketplace**: Short-term paid tasks published by local merchants during off-peak hours.
- 🔒 **Secure Check-ins**: QR code and OTP-based server-verified check-ins at rest stops.
- ⭐️ **Two-Way Ratings & Moderation**: Trustworthy reviews and community feedback for riders and merchants.
- 🛡️ **Role-Based Access Control**: Tailored experiences for Public Visitors, Riders, Merchants, and System Administrators.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend App** | [Next.js](https://nextjs.org/) (App Router), React, TypeScript (Strict), Tailwind CSS, Lucide Icons |
| **Backend API** | Node.js, [Express.js](https://expressjs.com/), TypeScript, REST Architecture |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas), Mongoose ODM |
| **Shared Package** | TypeScript Shared DTOs, Enums, and Zod Validation Schemas (`packages/shared-types`) |
| **Environment** | Monorepo (npm Workspaces) |

---

## 📁 Monorepo Project Structure

```
pitstop/
├── apps/
│   ├── web/               # Next.js App Router Frontend Application
│   └── api/               # Express.js REST API Backend Application
├── packages/
│   └── shared-types/      # Common TypeScript interfaces, DTOs & Schemas
├── docs/                  # Project Specifications, Architecture & Design System
│   ├── requirements.md
│   ├── architecture.md
│   ├── design-system.md
│   ├── implementation-plan.md
│   └── progress.md
├── .env.example           # Global environment configuration template
├── .gitignore             # Workspace git ignore configuration
├── AGENTS.md              # Instructions for AI coding assistants
└── README.md              # Project overview & quick start guide
```

---

## 💻 Prerequisites

Before running PitStop locally, ensure you have installed:
- **Node.js**: `v18.x` or higher (Recommended: `v24.x`)
- **npm**: `v9.x` or higher (Recommended: `v11.x`)
- **Git**: `v2.x`
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017/pitstop_dev`) or a free [MongoDB Atlas Cluster](https://www.mongodb.com/cloud/atlas) connection URI.

---

## ⚙️ Environment Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Pitstop
   ```

2. **Configure Environment Variables**:
   Copy the example environment configuration file:
   ```bash
   cp .env.example .env
   ```
   *(Ensure you update `.env` with your local MongoDB connection string if required)*

3. **Install Dependencies**:
   ```bash
   npm install
   ```

---

## 🏃 Local Development Commands

- **Start all apps concurrently**:
  ```bash
  npm run dev
  ```
- **Start Web app only**:
  ```bash
  npm run dev --workspace=apps/web
  ```
- **Start API app only**:
  ```bash
  npm run dev --workspace=apps/api
  ```
- **Build all packages and apps**:
  ```bash
  npm run build
  ```
- **Run typecheck across all workspaces**:
  ```bash
  npm run typecheck
  ```
- **Run linting across all workspaces**:
  ```bash
  npm run lint
  ```

---

## 📑 Project Documentation

Comprehensive documentation is available in the [`docs/`](file:///c:/Users/Manish/Desktop/Pitstop/docs) directory:
- 📋 [**Requirements Specification**](file:///c:/Users/Manish/Desktop/Pitstop/docs/requirements.md)
- 🏗️ [**Architecture & System Design**](file:///c:/Users/Manish/Desktop/Pitstop/docs/architecture.md)
- 🎨 [**Design System & Visual Tokens**](file:///c:/Users/Manish/Desktop/Pitstop/docs/design-system.md)
- 🗺️ [**Implementation Plan & Roadmap**](file:///c:/Users/Manish/Desktop/Pitstop/docs/implementation-plan.md)
- 📊 [**Project Progress & Verification Log**](file:///c:/Users/Manish/Desktop/Pitstop/docs/progress.md)

---

## 📌 Current Status

- **Current Phase**: **Phase 1 — Monorepo Infrastructure & Package Setup** (Completed)
- **Next Phase**: **Phase 2 — Backend Core API, Database Schemas & Authentication** (Awaiting approval)
- **License**: Proprietary / Private
