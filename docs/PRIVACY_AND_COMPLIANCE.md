# Centralized Agro Hub (CAHS) — Privacy & Compliance Architecture

This document outlines how CAHS incorporates Privacy by Design and adheres to the principles of the **Nigeria Data Protection Act (NDPA)** and modern privacy standards, without claiming premature statutory certification for this hackathon prototype.

---

## 1. Principles of the Nigeria Data Protection Act (NDPA)

### 1.1 Purpose Limitation
- Data collected during registration, produce listing, order processing, and logistics is utilized solely for platform fulfillment and declared services.
- Data is never repurposed for secondary monetization or unsolicited third-party marketing.

### 1.2 Data Minimization
- Financial account details: CAHS **never** stores unmasked bank account numbers, primary account numbers (PAN), CVVs, or cardholder credentials.
- Bank links store only a masked account reference (e.g. `****4412`), an encrypted token for simulated operations, and a verification timestamp.

### 1.3 Explicit & Granular Consent
- Users retain granular control over data sharing via `/app/privacy`.
- **Loan Assessment Consent (`share_with_bank_for_loan`)**: Platform transaction histories (orders, sales volumes, completion rates) are only attached to loan dossiers if the applicant actively opts in.
- Revoking consent immediately prevents future compilation of transaction summaries and is logged with an immutable audit event.

### 1.4 Accuracy and Right to Rectification
- Users have an in-app data correction request workflow (`/app/privacy` -> Data Correction Form).
- Requests write to `data_correction_requests` for administrative resolution.

---

## 2. Role-Based Access Control (RBAC) & Least Privilege

Access to personal data and commercial transactions is restricted strictly by role:

| Stakeholder | Visible Information | Protected / Hidden Information |
| :--- | :--- | :--- |
| **Farmer** | Own listings, own sales orders, own storage bookings, own loans | Other farmers' listings financials, buyer private banking details |
| **Trader** | Public marketplace listings, own purchases, own deliveries | Farm-level operational dossiers not relevant to order |
| **Storage Provider** | Booking quantities, crop types, scheduled intake/dispatch | Producer financial details, unrelated warehouse capacity |
| **Logistics Provider** | Origin/destination, load description, delivery contacts for active shipments | Financial transaction splits, historical loans |
| **Bank Officer** | Consented loan dossiers, business performance summaries, KYC artifacts | Passwords, raw credentials, unconsented private activities |
| **Platform Admin** | Verification submissions, audit events, dispute evidence | Sensitive personal fields not required for moderation |

---

## 3. Security & Cryptographic Safeguards

1. **Field-Level Encryption**:
   - Sensitive fields (account tokens, personal identifiers) are encrypted at rest using AES-256 via `FIELD_ENCRYPTION_KEY`.
2. **Access-Restricted Logistics Telemetry**:
   - Driver contact numbers and vehicle location coordinates are only exposed to authorized parties (buyer, seller, carrier, admin) and only while the shipment milestone is active (`in_transit`, `out_for_delivery`).
3. **Audit Logging**:
   - Append-only `audit_events` log records every authentication attempt, status transition, document view, sensitive access, and administrative override with timestamp and actor ID.
4. **Fraud & Error Reporting**:
   - An accessible "Report fraud or error" route (`/app/report`) is embedded throughout the platform.
