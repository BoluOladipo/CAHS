# Centralized Agro Hub (CAHS) — Architecture Decisions and Assumptions

This document records all architectural choices, simulation parameters, and default values adopted where the build prompt left room for discretion, strictly aligned with the principles in Section 1.

---

## 1. Non-Negotiable Prototype Honesty Principles
1. **Simulated Financial Movement**: All payments, escrow releases, loan disbursements, repayments, and savings operations are simulated. No real currency is transferred or stored.
2. **Concept Proposal Disclaimers**: Zenith Bank is a proposed commercial partner; no binding agreement exists. Every benefit attributed to Zenith Bank is labelled "Proposed partnership benefit" and subject to formal credit, regulatory, and commercial approvals.
3. **Human Credit Decisions**: AI models and rule engines only generate review checklists and data summaries. Only authenticated human Bank Officers can approve, counter-offer, or reject loan applications.
4. **Savings Protections**: Savings accounts and fixed tenors are held by the partner bank (simulated), not CAHS. Displayed returns are explicitly marked as "projected" and subject to bank liquidity and interest rate policies.
5. **Separation of Revenue**: Gross Transaction Value (GTV) and customer deposit balances are strictly excluded from CAHS corporate revenue analytics.

---

## 2. Technical Stack and Infrastructure
- **Monorepo Structure**: npm workspaces with three packages:
  - `apps/web`: React 18, TypeScript, Vite, Tailwind CSS.
  - `apps/api`: Node.js, Express, TypeScript, Prisma ORM, Swagger/OpenAPI.
  - `packages/shared`: Shared types, domain constants, pure business rule validators.
- **Database**: PostgreSQL 16+ with relational schemas, strict foreign key constraints, and an append-only `audit_events` table.
- **Port Strategy**:
  - API: Port `4000`
  - Web: Port `5173`
  - Local Dedicated PostgreSQL: Port `5433` (isolated cluster to prevent conflicts with pre-existing local instances).

---

## 3. Financial & Fee Calculations (Section 4.6 & 9)
- **Currency**: Nigerian Naira (₦).
- **Platform Marketplace Fee**:
  - Standard Non-Zenith Customer: 2.0% (e.g., ₦2,000 on ₦100,000).
  - Eligible Zenith Customer: 1.6% (default in the 1.5%–1.6% range; ₦1,600 on ₦100,000).
  - Discount Funder: Recorded per rule as `"bank"`.
- **Logistics Discount**:
  - Eligible Zenith Customer receives a 6% discount (e.g., ₦50,000 delivery reduced by ₦3,000 to ₦47,000, fitting the ₦46,000–₦48,000 bracket).
  - Discount Funder: Recorded on quotes as `"bank"`.
- **Storage Discount**:
  - Eligible Zenith Customer receives 5% off participating warehouse bookings (funder recorded as `"cahs"`).

---

## 4. Operational & Delivery Milestones (Section 4.4)
The shipment workflow enforces the exact 6-state progression:
1. `packaged`
2. `collected`
3. `in_transit`
4. `arrived_at_destination_warehouse`
5. `out_for_delivery`
6. `delivered`

- Driver contact details and simulated GPS coordinates are only rendered for active shipments (`in_transit`, `out_for_delivery`) and restricted to the buyer, seller, assigned logistics provider, and admin.

---

## 5. Credit & Savings Models (Section 4.7 & 4.8)
- **Loan Products**: Progressive tenors (90, 180, 270 days) for amounts between ₦100,000 and ₦5,000,000.
- **Consent-Gated Data Attachment**: Loan applicants must explicitly grant consent (`share_with_bank_for_loan`) for CAHS order/transaction histories to be appended to the loan package.
- **Savings Tenors & Returns**:
  - 30 Days: 8% p.a. (Zenith eligible) vs 6% p.a. (standard).
  - 90 Days: 12% p.a. (Zenith eligible) vs 9% p.a. (standard).
  - 180 Days: 14% p.a. (Zenith eligible) vs 11% p.a. (standard).
  - All returns are qualified as "projected return".

---

## 6. AI & Decision Support (Section 4.9)
- Feature-flagged under `FF_AI`.
- Uses deterministic statistical fallbacks when no external Anthropic API key is supplied.
- All AI chat prompts and responses are logged to `ai_interactions`.
- Prompts attempting to solicit loan approvals or return guarantees are intercepted with explicit policy guardrails.
