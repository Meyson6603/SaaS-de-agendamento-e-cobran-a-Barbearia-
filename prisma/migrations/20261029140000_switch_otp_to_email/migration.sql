ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailOtpVerifiedAt" TIMESTAMP(3);

ALTER TABLE "OtpChallenge" ADD COLUMN IF NOT EXISTS "email" TEXT;

UPDATE "OtpChallenge" AS challenge
SET "email" = "User"."email"
FROM "User"
WHERE "User"."id" = challenge."userId";

DELETE FROM "OtpChallenge" WHERE "email" IS NULL;

ALTER TABLE "OtpChallenge" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "OtpChallenge" DROP COLUMN IF EXISTS "phone";

DROP INDEX IF EXISTS "OtpChallenge_phone_createdAt_idx";
CREATE INDEX IF NOT EXISTS "OtpChallenge_email_createdAt_idx" ON "OtpChallenge"("email", "createdAt");
