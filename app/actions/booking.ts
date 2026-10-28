"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth-session";
import { isValidBrazilianPhone } from "@/lib/brazilian-phone";
import {
  getAvailableBookingTimes,
  getBookingStart,
  isBookingSlotAvailable,
} from "@/lib/booking-availability";
import { prisma } from "@/lib/prisma";

export type BookingResult =
  | { success: true; bookingId: string }
  | { success: false; error: string };

export async function loadBookingTimes(
  slug: string,
  serviceId: string,
  professionalId: string,
  date: string,
) {
  if (
    typeof slug !== "string" ||
    typeof serviceId !== "string" ||
    typeof professionalId !== "string" ||
    typeof date !== "string" ||
    slug.length > 60 ||
    serviceId.length > 100 ||
    professionalId.length > 100 ||
    date.length !== 10
  ) {
    return {
      success: false as const,
      error: "Não foi possível consultar os horários informados.",
      times: [],
    };
  }

  const shop = await prisma.barbershop.findUnique({
    where: { slug },
    select: { id: true, timezone: true },
  });

  if (!shop) {
    return { success: false as const, error: "Esta barbearia não foi encontrada.", times: [] };
  }

  const times = await getAvailableBookingTimes({
    shopId: shop.id,
    serviceId,
    professionalId,
    date,
    timezone: shop.timezone,
  });

  return { success: true as const, times };
}

export async function createBooking(
  slug: string,
  serviceId: string,
  professionalId: string,
  date: string,
  time: string,
  customerNote: string,
): Promise<BookingResult> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Entre na sua conta para confirmar o agendamento." };
  }

  if (
    typeof slug !== "string" ||
    typeof serviceId !== "string" ||
    typeof professionalId !== "string" ||
    typeof date !== "string" ||
    typeof time !== "string" ||
    typeof customerNote !== "string" ||
    slug.length > 60 ||
    serviceId.length > 100 ||
    professionalId.length > 100 ||
    date.length !== 10
  ) {
    return { success: false, error: "Confira os dados do agendamento e tente novamente." };
  }

  if (customerNote.trim().length > 500) {
    return { success: false, error: "A observação pode ter no máximo 500 caracteres." };
  }

  const [shop, customer] = await Promise.all([
    prisma.barbershop.findUnique({
      where: { slug },
      select: { id: true, timezone: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    }),
  ]);

  if (!shop) {
    return { success: false, error: "Esta barbearia não foi encontrada." };
  }

  if (!customer?.phone || !isValidBrazilianPhone(customer.phone)) {
    return {
      success: false,
      error: "Salve um telefone válido no seu perfil antes de confirmar.",
    };
  }

  const startsAt = getBookingStart(date, time, shop.timezone);

  if (!startsAt) {
    return {
      success: false,
      error: "Esse horário não está mais disponível. Escolha outra data ou horário.",
    };
  }

  try {
    const outcome = await prisma.$transaction(
      async (transaction) => {
        const serviceAssignment = await transaction.professionalService.findFirst({
          where: {
            shopId: shop.id,
            serviceId,
            professionalId,
            professional: { isActive: true },
            service: { isActive: true },
          },
          select: {
            service: {
              select: {
                name: true,
                durationMinutes: true,
                price: true,
              },
            },
          },
        });

        if (!serviceAssignment) {
          return { booking: null, reason: "service" as const };
        }

        const endsAt = new Date(
          startsAt.getTime() + serviceAssignment.service.durationMinutes * 60_000,
        );
        const available = await isBookingSlotAvailable({
          shopId: shop.id,
          serviceId,
          professionalId,
          startsAt,
          endsAt,
          timezone: shop.timezone,
          db: transaction,
        });

        if (!available) {
          return { booking: null, reason: "slot" as const };
        }

        const booking = await transaction.booking.create({
          data: {
            shopId: shop.id,
            professionalId,
            serviceId,
            customerId: session.user.id,
            startsAt,
            endsAt,
            serviceNameSnapshot: serviceAssignment.service.name,
            serviceDurationSnapshot: serviceAssignment.service.durationMinutes,
            servicePriceSnapshot: serviceAssignment.service.price,
            customerNote: customerNote.trim() || null,
            payment: {
              create: {
                amount: serviceAssignment.service.price,
                status: "PENDING",
              },
            },
          },
          select: { id: true },
        });
        return { booking, reason: null };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (outcome.reason === "service") {
      return {
        success: false,
        error: "Esse serviço não está disponível com o profissional escolhido.",
      };
    }

    if (outcome.reason === "slot" || !outcome.booking) {
      return {
        success: false,
        error: "Esse horário acabou de ser reservado. Escolha outro horário.",
      };
    }

    revalidatePath(`/${slug}`);
    revalidatePath("/dashboard");
    revalidatePath("/gerencia");
    revalidatePath("/profissional");
    return { success: true, bookingId: outcome.booking.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return {
        success: false,
        error: "O horário foi reservado por outra pessoa. Escolha outro horário.",
      };
    }

    throw error;
  }
}
