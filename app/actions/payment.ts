"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-session";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";
import { notifyBookingParticipants } from "@/lib/notifications";

export type PaymentManagementState = {
  error: string | null;
  success: string | null;
};

const inPersonMethods = new Set(["PIX", "CASH", "CARD_ON_SITE"]);

export async function recordInPersonPayment(
  _previousState: PaymentManagementState,
  formData: FormData,
): Promise<PaymentManagementState> {
  const session = await getSession();
  if (!session) {
    return { error: "Entre na sua conta para registrar o pagamento.", success: null };
  }

  const bookingId = getFormString(formData, "bookingId");
  const method = getFormString(formData, "method");
  if (!isValidId(bookingId) || !inPersonMethods.has(method)) {
    return { error: "Confira o agendamento e a forma de pagamento.", success: null };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      shopId: true,
      professionalId: true,
      customerId: true,
      serviceNameSnapshot: true,
      startsAt: true,
      status: true,
      shop: { select: { slug: true, timezone: true } },
      payment: { select: { status: true } },
    },
  });

  if (!booking || !(await canRecordPayment(booking, session.user))) {
    return { error: "Agendamento não encontrado ou sem acesso.", success: null };
  }
  if (booking.status !== "CONFIRMED" && booking.status !== "COMPLETED") {
    return { error: "Só é possível registrar pagamentos de atendimentos válidos.", success: null };
  }
  if (!booking.payment) {
    return { error: "Este agendamento não possui um pagamento para atualizar.", success: null };
  }
  if (booking.payment.status === "PAID") {
    return { error: "Este pagamento já foi registrado.", success: null };
  }
  if (booking.payment.status === "REFUNDED") {
    return { error: "Um pagamento estornado não pode ser registrado novamente.", success: null };
  }

  const updated = await prisma.$transaction(async (transaction) => {
    const result = await transaction.payment.updateMany({
      where: {
        bookingId: booking.id,
        status: { in: ["PENDING", "FAILED"] },
      },
      data: {
        method: method as "PIX" | "CASH" | "CARD_ON_SITE",
        status: "PAID",
        paidAt: new Date(),
      },
    });
    if (result.count === 1) {
      await notifyBookingParticipants(transaction, {
        bookingId: booking.id,
        shopId: booking.shopId,
        customerId: booking.customerId,
        professionalId: booking.professionalId,
        serviceName: booking.serviceNameSnapshot,
        startsAt: booking.startsAt,
        timezone: booking.shop.timezone,
        type: "PAYMENT_RECEIVED",
        actorId: session.user.id,
        paymentMethod: method,
      });
    }
    return result;
  });

  if (updated.count !== 1) {
    return { error: "O pagamento mudou. Atualize a página e tente novamente.", success: null };
  }

  revalidatePath(`/${booking.shop.slug}`);
  revalidatePath("/dashboard");
  revalidatePath("/gerencia");
  revalidatePath("/profissional");
  revalidatePath("/admin");
  return { error: null, success: "Pagamento presencial registrado." };
}

async function canRecordPayment(
  booking: { shopId: string; professionalId: string },
  user: { id: string; email: string; emailVerified: boolean },
) {
  if (isPlatformAdmin(user)) return true;

  const membership = await prisma.membership.findUnique({
    where: { shopId_userId: { shopId: booking.shopId, userId: user.id } },
    select: { role: true, professional: { select: { id: true } } },
  });

  return (
    membership?.role === "OWNER" ||
    membership?.role === "MANAGER" ||
    (membership?.role === "PROFESSIONAL" &&
      membership.professional?.id === booking.professionalId)
  );
}

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isValidId(value: string) {
  return value.length > 0 && value.length <= 100;
}
