ALTER TABLE "Payment"
ADD COLUMN "provider" TEXT,
ADD COLUMN "providerReference" TEXT,
ADD COLUMN "checkoutUrl" TEXT;

CREATE UNIQUE INDEX "Payment_providerReference_key"
ON "Payment"("providerReference");
