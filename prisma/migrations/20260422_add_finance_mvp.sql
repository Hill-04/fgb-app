-- Financeiro MVP: faturas como fonte de verdade financeira.
-- Valores monetarios sao armazenados em centavos (INTEGER).

CREATE TABLE IF NOT EXISTS "FinancialInvoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "number" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "championshipId" TEXT,
  "registrationId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" DATETIME,
  "subtotalCents" INTEGER NOT NULL DEFAULT 0,
  "discountCents" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER NOT NULL DEFAULT 0,
  "paidCents" INTEGER NOT NULL DEFAULT 0,
  "balanceCents" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "FinancialInvoice_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "FinancialInvoice_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "FinancialInvoice_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "FinancialInvoiceItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "invoiceId" TEXT NOT NULL,
  "registrationFeeId" TEXT,
  "feeKey" TEXT,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitValueCents" INTEGER NOT NULL,
  "totalCents" INTEGER NOT NULL,
  "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancialInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FinancialInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FinancialInvoiceItem_registrationFeeId_fkey" FOREIGN KEY ("registrationFeeId") REFERENCES "RegistrationFee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "FinancialPayment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "invoiceId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "method" TEXT NOT NULL DEFAULT 'MANUAL',
  "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
  "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reference" TEXT,
  "notes" TEXT,
  "createdByUserId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancialPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FinancialInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FinancialPayment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "FinancialAuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "invoiceId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "metadataJson" TEXT,
  "createdByUserId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancialAuditLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FinancialInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FinancialAuditLog_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "FinancialInvoice_number_key" ON "FinancialInvoice"("number");
CREATE INDEX IF NOT EXISTS "FinancialInvoice_teamId_idx" ON "FinancialInvoice"("teamId");
CREATE INDEX IF NOT EXISTS "FinancialInvoice_championshipId_idx" ON "FinancialInvoice"("championshipId");
CREATE INDEX IF NOT EXISTS "FinancialInvoice_registrationId_idx" ON "FinancialInvoice"("registrationId");
CREATE INDEX IF NOT EXISTS "FinancialInvoice_status_idx" ON "FinancialInvoice"("status");
CREATE INDEX IF NOT EXISTS "FinancialInvoice_dueDate_idx" ON "FinancialInvoice"("dueDate");
CREATE INDEX IF NOT EXISTS "FinancialInvoice_issueDate_idx" ON "FinancialInvoice"("issueDate");

CREATE INDEX IF NOT EXISTS "FinancialInvoiceItem_invoiceId_idx" ON "FinancialInvoiceItem"("invoiceId");
CREATE INDEX IF NOT EXISTS "FinancialInvoiceItem_registrationFeeId_idx" ON "FinancialInvoiceItem"("registrationFeeId");

CREATE INDEX IF NOT EXISTS "FinancialPayment_invoiceId_idx" ON "FinancialPayment"("invoiceId");
CREATE INDEX IF NOT EXISTS "FinancialPayment_status_idx" ON "FinancialPayment"("status");
CREATE INDEX IF NOT EXISTS "FinancialPayment_paidAt_idx" ON "FinancialPayment"("paidAt");

CREATE INDEX IF NOT EXISTS "FinancialAuditLog_invoiceId_idx" ON "FinancialAuditLog"("invoiceId");
CREATE INDEX IF NOT EXISTS "FinancialAuditLog_createdAt_idx" ON "FinancialAuditLog"("createdAt");
