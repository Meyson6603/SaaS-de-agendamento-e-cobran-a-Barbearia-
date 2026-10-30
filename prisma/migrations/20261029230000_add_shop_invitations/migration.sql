CREATE TYPE "InvitationRole" AS ENUM ('MANAGER', 'PROFESSIONAL');

CREATE TABLE "ShopInvitation" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "inviteeId" TEXT,
    "email" TEXT NOT NULL,
    "role" "InvitationRole" NOT NULL,
    "displayName" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShopInvitation_tokenHash_key" ON "ShopInvitation"("tokenHash");
CREATE INDEX "ShopInvitation_shopId_email_idx" ON "ShopInvitation"("shopId", "email");
CREATE INDEX "ShopInvitation_email_acceptedAt_idx" ON "ShopInvitation"("email", "acceptedAt");
ALTER TABLE "ShopInvitation" ADD CONSTRAINT "ShopInvitation_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopInvitation" ADD CONSTRAINT "ShopInvitation_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
