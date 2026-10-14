# Centralized Agro Hub (CAHS) — Integration Plan (Phase 3 Roadmap)

This document specifies the interface abstraction model used in the prototype and outlines the transition plan from the current sandbox/mock architecture to production-grade integrations in **Phase 3**.

---

## 1. Current Interface Abstractions (Prototype)

All external banking and payments services are strictly decoupled behind TypeScript interfaces located in `apps/api/src/services/providers.ts`:

1. **`PaymentProvider`**:
   - Current: `MockSandboxProvider` (simulates redirect, hosted checkout, transaction reference generation, webhook callback).
   - Future: Paystack, Flutterwave, or NIBSS Instant Payment (NIP) gateway.
2. **`BankAccountVerificationService`**:
   - Current: `MockBankAccountVerificationService` (validates 10-digit NUBAN, checks bank title, masks account).
   - Future: Direct Zenith Bank Open Banking API or Paystack NUBAN Resolution API.
3. **`LoanReferralService`**:
   - Current: `MockLoanReferralService` (queues application into local database).
   - Future: Bank Core Banking System (e.g. Finacle, Oracle FLEXCUBE) or Origination API.
4. **`SavingsProductService`**:
   - Current: `MockSavingsProductService` (records fixed-term deposit in local ledger under simulated administration).
   - Future: Core banking term deposit origination endpoint with direct ledger booking.
5. **`AIService`**:
   - Current: Statistical regression + rules fallback with optional Anthropic Claude SDK integration.
   - Future: Dedicated fine-tuned agricultural advisory LLM with vector retrieval (RAG) for crop agronomy and regional market trends.

---

## 2. Requirements for Phase 3 Production Readiness

Before connecting to live banking rails or payment acquiring services, the following milestones must be achieved:

### 2.1 Formal Approvals & Legal Governance
- Executed partnership memorandum of understanding (MoU) and Service Level Agreement (SLA) with Zenith Bank.
- Regulatory clearance with the Central Bank of Nigeria (CBN) regarding payment facilitation and referral agency boundaries.
- Data Processing Agreement (DPA) compliant with the Nigeria Data Protection Act (NDPA).

### 2.2 Security Review & Penetration Testing
- Third-party CREST-certified penetration test of API endpoints and cloud infrastructure.
- Field encryption key rotation policy utilizing Hardware Security Modules (AWS KMS, Azure Key Vault, or HashiCorp Vault).
- Webhook signature verification (HMAC SHA-512) and IP whitelisting for all incoming payment notifications.

### 2.3 Financial Reconciliation & Settlement Operations
- Automated daily settlement reconciliation daemon comparing:
  - CAHS internal transaction logs.
  - Payment acquirer settlement reports.
  - Participating bank credit advices.
- Dual-control Maker-Checker workflow for dispute resolutions exceeding threshold values.
- Automated reversal and refund triggers for timed-out or aborted delivery milestones.

### 2.4 Support & Operational Workflows
- 24/7 incident management desk with dedicated escalation lines between CAHS engineering and bank operations.
- Real-time fraud detection rules monitoring abnormal checkout velocity and duplicate produce listings.
