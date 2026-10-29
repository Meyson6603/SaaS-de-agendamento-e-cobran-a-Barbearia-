"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-session";
import { createMercadoPagoPreference } from "@/lib/mercado-pago";
import { prisma } from "@/lib/prisma";

export type OnlinePaymentResult =
  | { success: true; checkoutUrl: string }
  | { success: false; error: string };

export async function createOnlinePayment(
  bookingId: string,
): Promise<OnlinePaymentResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Entre na sua conta para pagar." };
  if (!bookingId || bookingId.length > 100) {
    return { success: false, error: "Agendamento inválido." };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      customerId: true,
      status: true,
      serviceNameSnapshot: true,
      servicePriceSnapshot: true,
      customer: { select: { email: true } },
      payment: {
        select: {
          status: true,
          provider: true,
          providerReference: true,
          checkoutUrl: true,
        },
      },
    },
  });

  if (!booking || booking.customerId !== session.user.id) {
    return { success: false, error: "Agendamento não encontrado." };
  }
  if (booking.status !== "CONFIRMED") {
    return { success: false, error: "Este agendamento não pode receber pagamento." };
  }
  if (!booking.payment || booking.payment.status === "PAID") {
    return { success: false, error: "Este agendamento já está pago ou sem cobrança." };
  }
  if (booking.payment.provider === "MERCADO_PAGO" && booking.payment.checkoutUrl) {
    return { success: true, checkoutUrl: booking.payment.checkoutUrl };
  }

  try {
    const preference = await createMercadoPagoPreference({
      bookingId: booking.id,
      serviceName: booking.serviceNameSnapshot,
      amount: Number(booking.servicePriceSnapshot),
      customerEmail: booking.customer.email,
    });
    await prisma.payment.update({
      where: { bookingId: booking.id },
      data: {
        provider: "MERCADO_PAGO",
        providerReference: preference.id,
        checkoutUrl: preference.checkoutUrl,
        method: "ONLINE_CARD",
      },
    });
    revalidatePath("/dashboard");
    return { success: true, checkoutUrl: preference.checkoutUrl };
  } catch (error) {
    if (error instanceof Error && error.message === "Mercado Pago não está configurado.") {
      return { success: false, error: "O pagamento online ainda não está configurado." };
    }
    throw error;
  }
}
