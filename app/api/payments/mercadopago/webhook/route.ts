import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getMercadoPagoPayment, mapMercadoPagoStatus } from "@/lib/mercado-pago";
import { notifyBookingParticipants } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let payload: { data?: { id?: string | number }; type?: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (
    !isValidMercadoPagoSignature(
      signature,
      requestId,
      new URL(request.url).searchParams.get("data.id") ??
        (payload.data?.id ? String(payload.data.id) : null),
    )
  ) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  if (payload.type !== "payment" || !payload.data?.id) {
    return NextResponse.json({ received: true });
  }

  const providerPayment = await getMercadoPagoPayment(String(payload.data.id));
  const bookingId = providerPayment.external_reference;
  if (!bookingId) return NextResponse.json({ received: true });

  const paymentStatus = mapMercadoPagoStatus(providerPayment.status);
  const payment = await prisma.payment.findUnique({
    where: { bookingId },
    select: { bookingId: true, status: true, booking: {
      select: {
        shopId: true, customerId: true, professionalId: true,
        serviceNameSnapshot: true, startsAt: true, shop: { select: { timezone: true } },
      },
    } },
  });
  if (!payment) return NextResponse.json({ received: true });

  await prisma.$transaction(async (transaction) => {
    const updated = await transaction.payment.updateMany({
      where: { bookingId, status: { not: "PAID" } },
      data: {
        status: paymentStatus,
        method: "ONLINE_CARD",
        paidAt: paymentStatus === "PAID" ? new Date() : null,
      },
    });
    if (updated.count === 1 && paymentStatus === "PAID") {
      await notifyBookingParticipants(transaction, {
        bookingId,
        shopId: payment.booking.shopId,
        customerId: payment.booking.customerId,
        professionalId: payment.booking.professionalId,
        serviceName: payment.booking.serviceNameSnapshot,
        startsAt: payment.booking.startsAt,
        timezone: payment.booking.shop.timezone,
        type: "PAYMENT_RECEIVED",
        paymentMethod: "Mercado Pago",
      });
    }
  });

  return NextResponse.json({ received: true });
}

function isValidMercadoPagoSignature(
  signature: string | null,
  requestId: string | null,
  dataId: string | null,
) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !signature || !requestId || !dataId) return false;
  const timestamp = signature.match(/(?:^|,)ts=([^,]+)/)?.[1];
  const receivedHash = signature.match(/(?:^|,)v1=([^,]+)/)?.[1];
  if (!timestamp || !receivedHash) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const expectedHash = createHmac("sha256", secret).update(manifest).digest("hex");
  const received = Buffer.from(receivedHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
