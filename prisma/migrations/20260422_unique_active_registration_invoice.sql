-- Complemento de idempotencia: uma inscricao nao pode ter mais de uma fatura ativa.
-- Faturas VOID ficam fora do indice para permitir reprocessamento explicito apos cancelamento.
CREATE UNIQUE INDEX IF NOT EXISTS "FinancialInvoice_active_registration_unique"
ON "FinancialInvoice"("registrationId")
WHERE "registrationId" IS NOT NULL AND "status" != 'VOID';
