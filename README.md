# Centralized Agro Hub (CAHS)

> **Hackathon Pitch Prototype & Concept Proposal**  
> **Proposed Partner:** Zenith Bank  
> **Currency:** Nigerian Naira (₦) | **Primary Market:** Nigeria

---

## 1. Prototype Honesty & Disclaimers

> [!NOTE]
> **Prototype Transparency Banner**:
> *"Prototype: simulated payments, loans and savings. No real funds are handled."*
>
> **Concept Proposal Notice**:
> *"Concept proposal. Subject to validation, approvals and partnership agreements."*
>
> - Zenith Bank has not formally agreed to any partnership; all mentioned benefits are labelled **"Proposed partnership benefit"**.
> - Bank officers own all credit underwriting, approval, and pricing decisions. AI never approves or rejects loan applications.
> - Savings deposits are held and administered by the bank (simulated). Returns are strictly "projected".
> - Gross Transaction Value (GTV) and customer deposits are never reported as CAHS revenue.

---

## 2. Platform Architecture

CAHS is built as a modular monorepo using npm workspaces:

```
CAHS/
├── apps/
│   ├── api/             # Express + TypeScript backend (REST API, Prisma, Swagger)
│   └── web/             # React 18 + Vite + Tailwind CSS frontend
├── packages/
│   └── shared/          # Shared domain types, constants & business rule logic
├── docs/
│   ├── ASSUMPTIONS.md              # Architectural decisions & simulation assumptions
│   ├── PRIVACY_AND_COMPLIANCE.md   # NDPA principles, RBAC & security design
│   ├── INTEGRATION_PLAN.md         # Phase 3 integration blueprint
│   └── DEMO_SCRIPT.md              # 5-7 minute pitch walkthrough script
├── docker-compose.yml   # Multi-container startup (Postgres, API, Web)
└── start-cahs.bat       # One-click Windows development launcher
```

---

## 3. Quick Start & Setup

### Prerequisites
- Node.js >= 20
- npm >= 10
- PostgreSQL 16+ (or Docker Desktop)

### Option A: Local Node.js Development
1. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   cp .env.example apps/api/.env
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Database Migration & Seeding**:
   ```bash
   npm run db:generate
   npx prisma db push --schema=apps/api/prisma/schema.prisma
   npm run db:seed
   ```
4. **Start Development Servers**:
   ```bash
   npm run dev
   ```
   - **Frontend**: http://localhost:5173
   - **API Server**: http://localhost:4000
   - **API Documentation (Swagger UI)**: http://localhost:4000/api/docs
   - **API Health Check**: http://localhost:4000/api/health

### Option B: Docker Compose
```bash
docker compose up --build
```

---

## 4. Demo Login Accounts

All seeded demo accounts use the password: **`Demo1234!`**

| Role | Email | Description |
| :--- | :--- | :--- |
| **Farmer** | `farmer@cahs.demo` | Amina Yusuf (Kano, 8ha Maize/Tomatoes, Zenith Linked) |
| **Trader (Zenith)** | `trader.zenith@cahs.demo` | Chinedu Okeke (Lagos, Eligible for 1.6% fee & 6% logistics discount) |
| **Trader (Standard)** | `trader@cahs.demo` | Fatima Bello (Kaduna, Standard 2.0% fee) |
| **Logistics Provider** | `logistics@cahs.demo` | Sahel Haulage (Kano, CAC Verified, Active Fleet) |
| **Storage Provider** | `storage@cahs.demo` | GreenSilo Kano (Kano, CAC Verified Dry Warehouse) |
| **Bank Officer** | `bank@cahs.demo` | Adaeze Nwosu (Zenith Bank Officer, Credit Underwriter) |
| **Platform Admin** | `admin@cahs.demo` | Platform Administrator (Verifications, Audit, Pilot Analytics) |

---

## 5. Verification & Testing

To run the automated unit and business rule test suite:
```bash
npm test
```

Tests cover:
- Section 9 business rules (fee math, logistics discount, loan approvals, milestone progressions, driver privacy, savings disclosures, payment security).
- Capacity assertion and stock ledger reconciliation.
- Copy honesty assertions checking prototype and concept proposal banners.
