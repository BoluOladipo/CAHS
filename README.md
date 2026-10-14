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

