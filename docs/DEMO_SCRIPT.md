# Centralized Agro Hub (CAHS) — 5-7 Minute Pitch Demo Script

This script walks through an end-to-end demonstration of the Centralized Agro Hub prototype, showing marketplace commerce, verified logistics, storage booking, banking benefits, loan workflows, and administrative oversight.

---

## Demo Test Credentials
All test accounts share the demo password: **`Demo1234!`**

| Role | Email | Highlights |
| :--- | :--- | :--- |
| **Farmer** | `farmer@cahs.demo` | Amina Yusuf (Kano, 8ha Maize/Tomatoes, Zenith Linked) |
| **Trader (Zenith-Eligible)** | `trader.zenith@cahs.demo` | Chinedu Okeke (Lagos, Eligible for 1.6% fee & 6% logistics discount) |
| **Trader (Standard)** | `trader@cahs.demo` | Fatima Bello (Kaduna, Standard 2.0% fee) |
| **Logistics Provider** | `logistics@cahs.demo` | Sahel Haulage (Kano, CAC Verified, Active Fleet) |
| **Storage Provider** | `storage@cahs.demo` | GreenSilo Kano (Kano, CAC Verified Dry Warehouse) |
| **Bank Officer** | `bank@cahs.demo` | Adaeze Nwosu (Zenith Bank Officer, Credit Queue Reviewer) |
| **Platform Admin** | `admin@cahs.demo` | CAHS Admin (Verification, Dispute & Pilot Analytics) |

---

## 5-7 Minute Walkthrough Steps

### Step 1: Landing Page & Prototype Transparency (0:00 - 0:45)
1. Navigate to `http://localhost:5173/`.
2. Point out the persistent disclaimer banners:
   - *"Prototype: simulated payments, loans and savings. No real funds are handled."*
   - *"Concept proposal. Subject to validation, approvals and partnership agreements."*
3. Visit the **Zenith proposal** page (`/partnership`) highlighting the proposed structure, and the **Team** page (`/team`) showing verified placeholders.

### Step 2: Farmer Produce Listing & AI Price Insights (0:45 - 1:45)
1. Log in as `farmer@cahs.demo`.
2. Go to **My listings** (`/app/listings/mine`).
3. Click **Create listing** for Maize or Tomatoes.
4. Show the **AI price insights** banner: shows indicative price range (e.g. ₦36,000 - ₦44,000 per bag) and demand signals derived from synthetic 12-month historical data.
5. Publish the listing to the active marketplace.

### Step 3: Trader Order, Fee Comparison & Checkout (1:45 - 2:45)
1. Switch user or log in as `trader.zenith@cahs.demo`.
2. Navigate to **Market** (`/app/market`) and filter or search for Maize.
3. Use the **Compare** tool (`/app/compare`) to inspect two listings side by side.
4. Place an order for 20 bags.
5. In the checkout overview, highlight the **transparent fee breakdown**:
   - Platform transaction fee: ₦1,600 (1.6% for Zenith customers) vs standard ₦2,000 (2.0%).
   - Discount funder explicitly stated: *"Funded by: bank"*.
6. Complete payment via the **Simulated Sandbox Checkout** (`/app/pay`). Show simulated receipt generation.

### Step 4: Verified Logistics Quote & 6-Milestone Tracking (2:45 - 3:45)
1. From the order confirmation, request transport from Kano to Lagos.
2. View quotes from verified providers:
   - Notice standard ₦50,000 base charge is discounted to ₦47,000 for the Zenith-eligible trader (6% off).
   - Quote explicitly states route, load, service level, and discount funder.
3. Accept the quote.
4. Open the active shipment tracker (`/app/shipments/:id`).
5. Demonstrate the progression through all 6 mandatory milestones:
   `packaged → collected → in_transit → arrived_at_destination_warehouse → out_for_delivery → delivered`.
6. Highlight that driver contact details and simulated GPS coordinates are only visible while the shipment is actively in transit.
7. Upload proof of delivery to complete the shipment.

### Step 5: Storage Facility Booking & Stock Movement (3:45 - 4:30)
1. Go to **Storage** (`/app/storage`).
2. Show verified warehouse badges (unverified facilities cannot accept bookings).
3. Book 50 bags at GreenSilo Kano.
4. Log into `storage@cahs.demo` -> **Facilities** (`/app/warehouse`) to inspect the booking.
5. Record intake of 50 bags and subsequent dispatch of 10 bags.
6. Open the **Stock Ledger** (`/app/ledger/:id`) to verify the reconciled running balance (40 bags remaining).

### Step 6: Farmer Loan Application & Bank Officer Console (4:30 - 5:30)
1. Return to `farmer@cahs.demo` and go to **Loans** (`/app/loans`).
2. Click **Apply for loan**. Enter farm size (8ha), requested amount (₦1,000,000), purpose (Fertilizer).
3. Toggle the **Consent checkbox**: *"Share platform transaction summaries with the bank"*.
4. Submit the application.
5. Log in as `bank@cahs.demo` and open the **Loan queue** (`/app/bank/loans`).
6. Open the applicant's dossier:
   - View the **AI Loan-readiness summary**: confirms applicant provided farm details, sales history, and attached verified platform order records.
   - Note the prominent label: *"Decision support only. Not a credit decision."*
7. Record a human decision: Click **Approve** (or counter-offer) with a mandatory officer note.
8. Switch back to farmer to view the simulated repayment schedule and repayment tracker.

### Step 7: Fixed-Term Savings & Full Disclosures (5:30 - 6:15)
1. Go to **Savings** (`/app/savings`).
2. Review product terms (e.g. 90-day fixed savings at 12% projected return for Zenith eligible vs 9% standard).
3. Point out the mandatory risk disclosure checkbox:
   - Explicitly confirms funds are administered by Zenith Bank.
   - States returns are "projected" and subject to early withdrawal conditions.
4. Open the savings account and view the active balance countdown.

### Step 8: Platform Admin, Audit Log & Pilot Dashboard (6:15 - 7:00)
1. Log in as `admin@cahs.demo`.
2. Inspect **Verifications** (`/app/admin/verify`) to approve or review pending business CAC documents.
3. Open **Audit log** (`/app/admin/audit`) demonstrating that every single status change, payment, milestone update, and loan decision created an immutable record.
4. Open the **Pilot Analytics Dashboard** (`/app/admin/analytics`):
   - Review metrics grouped by Customer Growth, Marketplace Activity, Service Quality, and Financial Outcomes.
   - Show that Gross Transaction Value and Customer Deposits are strictly separated from CAHS operational revenue.

### Step 9: Zecathon Feature 1 — AI Support & Urgency Triage (7:00 - 8:00)
1. Go to **AI Support & Triage** (`/app/support`).
2. Demonstrate **Stage 1 (Guided Self-Service)**:
   - Select the prompt: *"Money debited from my account but order is still showing unpaid"*.
   - Click **Analyze with AI Assistant**.
   - Show instant classification: Category `PAYMENT`, Assessed Urgency `CRITICAL`.
   - Point out the internal system lookup fact and numbered resolution steps.
   - Highlight the security notice: *"Security reminder: Neither CAHS nor Zenith Bank will ever ask for your PIN, OTP, or password."*
3. Demonstrate **Stage 2 (Urgency Escalation)**:
   - Click **No — Escalate to Zenith Bank Team**.
   - Case is created with priority `CRITICAL` at the top of the bank triage pool.
4. Switch to `bank@cahs.demo` -> **Complaint queue** (`/app/bank/complaints`):
   - Show the live urgency-ranked dashboard with Critical cases highlighted at the top.
   - Click **Assign to Me**, enter an investigation note, and click **Confirm Resolve**.
   - Switch back to customer view to show the live resolution status update!

### Step 10: Zecathon Feature 2 — Pending-State Payment Protection (8:00 - 9:00)
1. Go to the **Simulated Payment Sandbox** (`/app/pay`).
2. Click **Incomplete Transfer (Trigger Pending)**.
3. Point out the single customer transaction card:
   - Status: `PENDING (Background retry scheduled)`.
   - Guarantee: *"You see one single transaction and will not be charged twice."*
4. Click **Run Background Retry Attempt**: increments retry attempt with exponential backoff timestamp.
5. Click **Simulate Bank Confirmation (Success)**: status updates to Successful and fulfills order.
6. Open **Pending payments engine** (`/app/admin/payments-engine`):
   - Show the timestamped bank switch audit ledger tracking every attempt without cluttering the customer experience.
   - Demonstrate the **Timeout & Hold Release** simulation: releases all holds back to the user with zero debit.

### Step 11: Zecathon Feature 3 — Business Financial Insights (9:00 - 10:00)
1. Go to **Financial insights** (`/app/insights`).
2. Review the monthly summary matching the Zecathon 6.0 specification:
   - **Total Revenue**: ₦2,400,000 (`+12%` growth vs prior month)
   - **Total Expenditure**: ₦1,650,000
   - **Recorded Losses**: ₦120,000 (ambient heat spoilage & transit damage)
   - **Net Margin Cash Flow**: ₦630,000 (`+8%` production volume)
3. Inspect the **AI Business Growth Plan**:
   - Cold Chain Spoilage Mitigation (+₦52,000/mo recovered)
   - Freight Consolidation Pooling (-₦35,000 transport cost)
   - High-Demand Crop Shift (+14% demand index)
   - Zenith Working Capital Pre-Qualification (up to ₦1.5m seasonal credit)
4. Demonstrate **Consent-Based Underwriting**:
   - Toggle **Grant Consent to Share with Bank**.
5. Switch to `bank@cahs.demo` -> **Customer insights** (`/app/bank/insights`):
   - Select Amina Yusuf (`farmer@cahs.demo`).
   - The officer views the verified monthly figures and AI cash flow analysis to underwrite seasonal loans without manual paperwork!

