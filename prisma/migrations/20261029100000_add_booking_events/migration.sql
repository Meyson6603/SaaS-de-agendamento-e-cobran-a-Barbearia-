CREATE TYPE "BookingEventType" AS ENUM ('CANCELLED', 'RESCHEDULED');

CREATE TABLE "BookingEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "type" "BookingEventType" NOT NULL,
    "previousStartsAt" TIMESTAMPTZ(3),
    "previousEndsAt" TIMESTAMPTZ(3),
    "newStartsAt" TIMESTAMPTZ(3),
    "newEndsAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookingEvent_bookingId_createdAt_idx" ON "BookingEvent"("bookingId", "createdAt");
CREATE INDEX "BookingEvent_actorId_createdAt_idx" ON "BookingEvent"("actorId", "createdAt");

ALTER TABLE "BookingEvent" ADD CONSTRAINT "BookingEvent_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingEvent" ADD CONSTRAINT "BookingEvent_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
