-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FARMER', 'TRADER', 'STORAGE_PROVIDER', 'LOGISTICS_PROVIDER', 'BANK_OFFICER', 'PLATFORM_ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "fullName" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "isEligibleZenithCustomer" BOOLEAN NOT NULL DEFAULT false,
    "zenithLinkedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "farmSizeHa" DOUBLE PRECISION,
    "crops" TEXT,
    "businessName" TEXT,
    "bio" TEXT,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "maskedAccount" TEXT NOT NULL,
    "accountEncrypted" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isZenith" BOOLEAN NOT NULL,

    CONSTRAINT "BankLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cacNumber" TEXT,
    "address" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationSubmission" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reviewerId" TEXT,
    "decisionNote" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationId" TEXT,
    "loanApplicationId" TEXT,
    "disputeId" TEXT,
    "podId" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "produceType" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "reservedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "availableFrom" TIMESTAMP(3) NOT NULL,
    "availableTo" TIMESTAMP(3) NOT NULL,
    "harvestDate" TIMESTAMP(3),
    "harvestNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "alt" TEXT NOT NULL,

    CONSTRAINT "ListingImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'placed',
    "deliveryMode" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "zenithDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountFunder" TEXT,
    "logisticsCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rating" INTEGER,
    "ratingComment" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageFacility" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "businessId" TEXT,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "storageType" TEXT NOT NULL,
    "capacity" DOUBLE PRECISION NOT NULL,
    "available" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "pricePerUnitPeriod" DOUBLE PRECISION NOT NULL,
    "periodLabel" TEXT NOT NULL DEFAULT 'week',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorageFacility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageBooking" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "produceType" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "charge" DOUBLE PRECISION NOT NULL,
    "zenithDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountFunder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorageBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "condition" TEXT,
    "destination" TEXT,
    "orderRef" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "requesterId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "loadDesc" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "serviceLevel" TEXT NOT NULL,
    "pickupWindow" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "baseCharge" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "customerPays" DOUBLE PRECISION NOT NULL,
    "discountFunder" TEXT,
    "conditions" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offered',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "etaWindow" TEXT,
    "mockLat" DOUBLE PRECISION,
    "mockLng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentMilestone" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "note" TEXT,
    "location" TEXT,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofOfDelivery" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProofOfDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "providerRef" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "holdReleased" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "fees" DOUBLE PRECISION NOT NULL,
    "discounts" DOUBLE PRECISION NOT NULL,
    "discountFunder" TEXT,
    "netToSeller" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'held',
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "raisedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "nonZenithPercent" DOUBLE PRECISION NOT NULL,
    "zenithPercent" DOUBLE PRECISION NOT NULL,
    "discountFunder" TEXT NOT NULL,
    "appliesToEligibleZenithOnly" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FeeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountRule" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "percentOff" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fixedOff" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountFunder" TEXT NOT NULL,

    CONSTRAINT "DiscountRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minAmount" DOUBLE PRECISION NOT NULL,
    "maxAmount" DOUBLE PRECISION NOT NULL,
    "tenorsDays" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LoanProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanApplication" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "productId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "amount" DOUBLE PRECISION NOT NULL,
    "purpose" TEXT NOT NULL,
    "tenorDays" INTEGER NOT NULL,
    "farmInfo" TEXT NOT NULL,
    "crops" TEXT NOT NULL,
    "landSizeHa" DOUBLE PRECISION NOT NULL,
    "historicalSales" TEXT NOT NULL,
    "bankMasked" TEXT NOT NULL,
    "attachSummaries" BOOLEAN NOT NULL DEFAULT false,
    "consentSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "internalNotes" TEXT,

    CONSTRAINT "LoanApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanDecision" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "counterAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepaymentSchedule" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',

    CONSTRAINT "RepaymentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repayment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "simulated" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Repayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tenorDays" INTEGER NOT NULL,
    "zenithRatePercent" DOUBLE PRECISION NOT NULL,
    "nonZenithRatePercent" DOUBLE PRECISION NOT NULL,
    "earlyWithdrawalNote" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SavingsProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "principal" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maturesAt" TIMESTAMP(3) NOT NULL,
    "projected" DOUBLE PRECISION NOT NULL,
    "acknowledged" BOOLEAN NOT NULL,

    CONSTRAINT "SavingsAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "produceType" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "avgPrice" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "synthetic" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiFlag" (
    "id" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "note" TEXT,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataCorrectionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataCorrectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PilotMetricSnapshot" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "payload" TEXT NOT NULL,
    "demo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PilotMetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigKV" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ConfigKV_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ComplaintCase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "summary" TEXT NOT NULL,
    "stepsTried" TEXT,
    "relatedTxnRef" TEXT,
    "relatedOrderId" TEXT,
    "assignedTo" TEXT,
    "resolutionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplaintCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessFinancialProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthLabel" TEXT NOT NULL DEFAULT 'Current Month',
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 2400000,
    "totalExpenditure" DOUBLE PRECISION NOT NULL DEFAULT 1650000,
    "recordedLosses" DOUBLE PRECISION NOT NULL DEFAULT 120000,
    "netResult" DOUBLE PRECISION NOT NULL DEFAULT 630000,
    "prodChangePercent" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
    "revChangePercent" DOUBLE PRECISION NOT NULL DEFAULT 12.0,
    "sharedWithBank" BOOLEAN NOT NULL DEFAULT false,
    "sharedAt" TIMESTAMP(3),
    "breakdownJson" TEXT,
    "aiPlanJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessFinancialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_userId_key_key" ON "Consent"("userId", "key");

-- CreateIndex
CREATE INDEX "Listing_produceType_state_status_grade_idx" ON "Listing"("produceType", "state", "status", "grade");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_paymentId_key" ON "Settlement"("paymentId");

-- CreateIndex
CREATE INDEX "AuditEvent_entity_entityId_idx" ON "AuditEvent"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "ComplaintCase_priority_status_idx" ON "ComplaintCase"("priority", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessFinancialProfile_userId_key" ON "BusinessFinancialProfile"("userId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankLink" ADD CONSTRAINT "BankLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationSubmission" ADD CONSTRAINT "VerificationSubmission_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationSubmission" ADD CONSTRAINT "VerificationSubmission_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "VerificationSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_loanApplicationId_fkey" FOREIGN KEY ("loanApplicationId") REFERENCES "LoanApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_podId_fkey" FOREIGN KEY ("podId") REFERENCES "ProofOfDelivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageFacility" ADD CONSTRAINT "StorageFacility_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageFacility" ADD CONSTRAINT "StorageFacility_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageBooking" ADD CONSTRAINT "StorageBooking_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "StorageFacility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageBooking" ADD CONSTRAINT "StorageBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "StorageBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "DeliveryRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "DeliveryRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentMilestone" ADD CONSTRAINT "ShipmentMilestone_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofOfDelivery" ADD CONSTRAINT "ProofOfDelivery_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyLedger" ADD CONSTRAINT "LoyaltyLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_productId_fkey" FOREIGN KEY ("productId") REFERENCES "LoanProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanDecision" ADD CONSTRAINT "LoanDecision_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanDecision" ADD CONSTRAINT "LoanDecision_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepaymentSchedule" ADD CONSTRAINT "RepaymentSchedule_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repayment" ADD CONSTRAINT "Repayment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsAccount" ADD CONSTRAINT "SavingsAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsAccount" ADD CONSTRAINT "SavingsAccount_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SavingsProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInteraction" ADD CONSTRAINT "AiInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataCorrectionRequest" ADD CONSTRAINT "DataCorrectionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintCase" ADD CONSTRAINT "ComplaintCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessFinancialProfile" ADD CONSTRAINT "BusinessFinancialProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

