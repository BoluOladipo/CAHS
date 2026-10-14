# Centralized Agro Hub (CAHS)

[![Zenith Bank Zecathon 6.0](https://img.shields.io/badge/Zenith%20Bank-Zecathon%206.0%20Entry-red?style=for-the-badge)](https://github.com/BoluOladipo/CAHS)
[![Track: Smart SME Financing](https://img.shields.io/badge/Track-Smart%20SME%20Financing%20%26%20Growth-green?style=for-the-badge)](https://github.com/BoluOladipo/CAHS)
[![Tests Passing](https://img.shields.io/badge/Tests-28%20Passed%20(100%25)-success?style=for-the-badge)](https://github.com/BoluOladipo/CAHS)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge)](https://github.com/BoluOladipo/CAHS)

> **Category:** Agricultural Technology · Digital Finance · Artificial Intelligence · Supply Chain Management  
> **Proposed Partner:** Zenith Bank Plc  
> **Primary Currency:** Nigerian Naira (₦) | **Primary Target Market:** Nigeria

---

## Executive Summary

**Centralized Agro Hub (CAHS)** is a connected digital agricultural ecosystem that brings produce trade, cold-room and dry storage booking, verified logistics haulage, payments, and responsible bank-controlled SME financing onto one coordinated platform.

It connects **farmers**, **buyers/traders**, **storage facility operators**, **CAC-verified logistics companies**, and **participating financial institutions** (proposed partner: **Zenith Bank**). By organizing these activities in a single hub, CAHS reduces supply-chain fragmentation, improves transaction visibility, cuts post-harvest food spoilage, and provides structured data so banks can lend responsibly to agribusinesses with minimal credit history.

```
[Farmers] ──► [CAHS Marketplace] ──► [Buyers / Traders] ──► [Protected Payments] ──► [Storage & Logistics] ──► [Delivery]
                                             ▲
                                             │ (Consent-Gated Financials & Underwriting)
                                             ▼
                             [Zenith Bank Portal / Credit Queue]
```

### Three Signature AI & Trust Capabilities (Zecathon 6.0 Alignment)
1. **AI Support Assistant & Urgency Triage**: Two-stage customer resolution. Stage 1 guides users through self-service with system records checks (never asking for PIN/OTP/password); Stage 2 automatically scores and routes unresolved cases to Zenith Bank ranked by urgency (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
2. **Pending-State Payment Protection Engine**: If a network delay or incomplete transfer occurs, the payment enters a protected pending state with automatic exponential retries using the identical reference. Customers see a single unified transaction (no duplicate charges), and funds holds auto-release on timeout.
3. **Business Financial Insights**: Consolidates recorded money-in and money-out into monthly revenue breakdowns, loss tracking, and an explainable AI growth plan. Customers can opt-in to share this verified ledger directly with Zenith Bank to pre-qualify for seasonal agricultural loans.

---

## Zecathon 6.0 Judging Criteria Alignment

| Zecathon Requirement | Judging Criterion | How CAHS Addresses It | Where in Code / UI |
| :--- | :--- | :--- | :--- |
| **Problem & Opportunity** | **Impact** | Solves post-harvest losses, scattered agricultural records, and lack of SME credit data. | [docs/ASSUMPTIONS.md](file:///C:/Users/Black/Double%20X/CAHS/docs/ASSUMPTIONS.md) |
| **Innovative AI / Emerging Tech** | **Innovation & Creativity** | Price & demand forecasting, spoilage advisory, pending-payment retry engine, AI complaint triage. | [services/ai.ts](file:///C:/Users/Black/Double%20X/CAHS/apps/api/src/services/ai.ts), `/app/support` |
| **Impact & Value** | **Impact** | Customer acquisition for Zenith Bank, fee income, lower servicing costs, responsible agri-lending. | `/app/admin/analytics`, `/partnership` |
| **Target Users & Feasibility** | **Feasibility** | 6 distinct roles (Farmer, Trader, Storage, Logistics, Bank Officer, Admin) with complete workflows. | `/app`, [pages-app.tsx](file:///C:/Users/Black/Double%20X/CAHS/apps/web/src/pages-app.tsx) |
| **Growth Beyond Pilot** | **Scalability** | Reusable banking retry engine, crop & state expandability, modular REST/OpenAPI architecture. | [docs/INTEGRATION_PLAN.md](file:///C:/Users/Black/Double%20X/CAHS/docs/INTEGRATION_PLAN.md) |
| **Team & Expertise** | **Feasibility** | 4-member multidisciplinary team (Project Lead, AI/Business, Data Analyst, QA/Testing). | `/team`, [README.md](file:///C:/Users/Black/Double%20X/CAHS/README.md#6-team-and-expertise) |

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
│   ├── DEMO_SCRIPT.md              # 5-10 minute pitch walkthrough script
│   └── ZECATHON_PROPOSAL.txt       # Official Zecathon 6.0 proposal specification
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

## 5. Zenith Bank Zecathon 6.0 Alignment

CAHS addresses the **Smart SME Financing and Growth Platform** track, with three dedicated AI and trust modules aligned to judging criteria:

### A. AI Customer Support & Urgency Triage (`/app/support`, `/app/bank/complaints`)
- **Stage 1 (Guided Self-Service)**: Identifies issue category (`PAYMENT`, `DELIVERY`, `DISPUTE`, `LOAN`, `REFUND`, `ACCOUNT`), queries internal transaction/shipment records, delivers clear numbered steps, and strictly enforces security (never asks for PIN, OTP, or password).
- **Stage 2 (Urgency-Ranked Escalation)**: Unresolved cases are scored and ranked:
  - `CRITICAL`: Money debited without order confirmation, suspected fraud, imminent perishable loss (<24h). Immediate alert to bank team.
  - `HIGH`: Perishable crop transit delay, loan disbursement failure.
  - `MEDIUM`: Quality/grade dispute, CAC document verification delay.
  - `LOW`: General enquiry or how-to.
- **Bank Officer Triage Queue**: Live dashboard filtered by priority and status, with assignment and resolution audit trail.

### B. Pending-State Payment Protection Engine (`/app/pay`, `/app/admin/payments-engine`)
- **Single Transaction View**: Customer sees a single unified transaction state — no duplicate records, no messy failed entries.
- **Idempotent Background Retries**: Automatic retries over backoff intervals (30s, 2m, 5m, 15m) using the exact same provider reference, making double debits impossible.
- **Auto-Release on Timeout**: If the retry window ends without bank switch confirmation, status becomes `Not completed`, all reserved holds are released, and zero debit is taken.
- **Internal Audit Ledger**: Every attempt is logged with timestamp and switch codes for bank reconciliation, hidden from customer view.

### C. Business Financial Insights (`/app/insights`, `/app/bank/insights`)
- **Monthly Summary**: Displays ₦2,400,000 revenue (`+12%`), ₦1,650,000 expenditure, ₦120,000 recorded losses (spoilage/damage), and ₦630,000 net result (`+8%` production volume).
- **AI Business Growth Plan**: Explainable recommendations (cold chain upgrade recovering ~₦52k/mo, freight pooling saving ~₦35k/mo, high-demand soya bean shift, Zenith seasonal loan pre-qualification).
- **Consent-Based Underwriting**: Customer explicitly toggles consent to share verified ledger figures with Zenith Bank credit officers to fast-track SME agricultural loans.

---

## 6. Team and Expertise

Within the Zecathon team size limit (4 members):

| Member | Role | Contribution to CAHS |
| :--- | :--- | :--- |
| **Oladipo Boluwaduro Emmanuel** | Full-stack Developer / Project Manager | Leads build of platform (marketplace, storage, logistics, payments flow, and pending-state retry engine), manages scope, timeline and team coordination. |
| **Oladeji Martins** | AI / Business Analyst | Designs the AI assistant, complaint urgency triage, and growth-plan logic; shapes business model, bank incentives, and partner discussions. |
| **Obinyan Emmanuel Onosetale** | Data Analyst | Builds the financial insights: revenue/expenditure breakdowns, production and revenue % change, loss tracking, and pilot metrics reporting. |
| **Kayode Toluwani Prosper** | QA / QT | Tests every feature before demo, including payment retry/pending states, complaint routing, data accuracy, security, and usability. |

**Official Contact:** Oladipo Boluwaduro Emmanuel (Project Lead) · team@cahs.ng · +234 812 345 6789 · Lagos, Nigeria.

---

## 7. Verification & Automated Testing

To run the automated unit and business rule test suite across all workspaces:
```bash
npm test
```

Tests cover 28 assertions:
- **Zecathon 6.0 Urgency Complaint Triage**: Priority ranking rules (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and strict prohibition of PIN/OTP/password requests.
- **Zecathon 6.0 Pending-State Payment Protection**: Idempotent references across retries, single-charge guarantee, and auto-release on timeout.
- **Zecathon 6.0 Financial Insights**: Net balance reconciliation (₦2.4m - ₦1.65m - ₦120k = ₦630k) and consent-gated bank sharing.
- **Core Business Rules**: Platform fee math, logistics discount, loan decision authority, milestone sequences, driver privacy, savings disclosures, and capacity constraints.
- **Prototype Honesty**: Verifies presence of prototype disclaimers and proposed partnership notices.

---

## 8. Interactive Demo Pages & Navigation

When running locally (`npm run dev`):

| Page / Feature | URL | Description |
| :--- | :--- | :--- |
| **Landing & Marketplace** | `http://localhost:5173/` | Overview of CAHS connected agricultural ecosystem. |
| **Team & Expertise** | `http://localhost:5173/team` | Official 4-person multidisciplinary Zecathon team. |
| **Zenith Concept Proposal** | `http://localhost:5173/partnership` | Strategic rationale, proposed benefits & pilot roadmap. |
| **AI Support & Triage** | `http://localhost:5173/app/support` | Stage 1 self-service + Stage 2 urgency-ranked escalation. |
| **Bank Complaint Queue** | `http://localhost:5173/app/bank/complaints` | Priority-ranked queue for Zenith Bank customer care officers. |
| **Pending Payments Engine** | `http://localhost:5173/app/admin/payments-engine` | Automatic background retry ledger & timeout hold release. |
| **Business Financial Insights** | `http://localhost:5173/app/insights` | Monthly revenue/expense breakdown, loss tracking & AI growth plan. |
| **Bank Customer Underwriting** | `http://localhost:5173/app/bank/insights` | Consent-gated financial review for Zenith loan officers. |
| **Swagger / OpenAPI Docs** | `http://localhost:4000/api/docs` | Interactive REST API documentation and schema explorer. |
| **API Health Check** | `http://localhost:4000/api/health` | Live service health monitor. |


