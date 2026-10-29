"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth-session";
import { isPlatformAdmin } from "@/lib/platform-admin";
import {
  getAvailableBookingTimes,
  getBookingStart,
  isBookingSlotAvailable,
} from "@/lib/booking-availability";
import { prisma } from "@/lib/prisma";

export type BookingManagementState = {
  error: string | null;
  success: string | null;
};

export type RescheduleTimesResult =
  | { success: true; times: string[] }
  | { success: false; error: string; times: [] };

type BookingAccessDb = Pick<Prisma.TransactionClient, "membership">;
type BookingUser = { id: string; email: string; emailVerified: boolean };
type BookingTarget = { shopId: string; customerId: string };

export async function loadRescheduleTimes(
  bookingId: string,
  date: string,
): Promise<RescheduleTimesResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Entre na sua conta para consultar horários.", times: [] };
  }
  if (!isValidId(bookingId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { success: false, error: "Confira a data selecionada.", times: [] };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true, shopId: true, customerId: true, status: true, startsAt: true,
      serviceId: true, professionalId: true, serviceDurationSnapshot: true,
      shop: { select: { timezone: true } },
    },
  });
  if (!booking || !(await canAccessBooking(prisma, booking, session.user))) {
    return { success: false, error: "Agendamento não encontrado ou sem acesso.", times: [] };
  }
  if (booking.status !== "CONFIRMED" || booking.startsAt <= new Date()) {
    return { success: false, error: "Este agendamento não pode mais ser remarcado.", times: [] };
  }

  const times = await getAvailableBookingTimes({
    shopId: booking.shopId,
    serviceId: booking.serviceId,
    professionalId: booking.professionalId,
    date,
    timezone: booking.shop.timezone,
    excludeBookingId: booking.id,
    durationMinutes: booking.serviceDurationSnapshot,
  });
  return { success: true, times: times.map(({ value }) => value) };
}

export async function cancelBooking(
  _previousState: BookingManagementState,
  formData: FormData,
): Promise<BookingManagementState> {
  const session = await getSession();
  if (!session) return { error: "Entre na sua conta para cancelar.", success: null };
  const bookingId = getFormString(formData, "bookingId");
  if (!isValidId(bookingId)) return { error: "Agendamento inválido.", success: null };

  try {
    const outcome = await prisma.$transaction(async (transaction) => {
      const booking = await transaction.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true, shopId: true, customerId: true, status: true,
          startsAt: true, endsAt: true, shop: { select: { slug: true } },
        },
      });
      if (!booking || !(await canAccessBooking(transaction, booking, session.user))) {
        return { reason: "access" as const };
      }
      const now = new Date();
      if (booking.status !== "CONFIRMED" || booking.startsAt <= now) {
        return { reason: "not-cancellable" as const };
      }
      const updated = await transaction.booking.updateMany({
        where: { id: booking.id, status: "CONFIRMED", startsAt: { gt: now } },
        data: { status: "CANCELLED" },
      });
      if (updated.count !== 1) return { reason: "changed" as const };
      await transaction.bookingEvent.create({
        data: {
          bookingId: booking.id, actorId: session.user.id, type: "CANCELLED",
          previousStartsAt: booking.startsAt, previousEndsAt: booking.endsAt,
        },
      });
      return { reason: null, slug: booking.shop.slug };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (outcome.reason) return cancellationError(outcome.reason);
    revalidateBookingViews(outcome.slug);
    return { error: null, success: "Agendamento cancelado." };
  } catch (error) {
    if (isSerializationConflict(error)) {
      return { error: "O agendamento mudou. Atualize a página e tente novamente.", success: null };
    }
    throw error;
  }
}

export async function rescheduleBooking(
  bookingId: string,
  date: string,
  time: string,
): Promise<BookingManagementState> {
  const session = await getSession();
  if (!session) return { error: "Entre na sua conta para remarcar.", success: null };
  if (!isValidId(bookingId) || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
    return { error: "Confira a nova data e horário.", success: null };
  }

  try {
    const outcome = await prisma.$transaction(async (transaction) => {
      const booking = await transaction.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true, shopId: true, customerId: true, status: true,
          startsAt: true, endsAt: true, serviceId: true, professionalId: true,
          serviceDurationSnapshot: true, shop: { select: { slug: true, timezone: true } },
        },
      });
      if (!booking || !(await canAccessBooking(transaction, booking, session.user))) {
        return { reason: "access" as const };
      }
      const now = new Date();
      if (booking.status !== "CONFIRMED" || booking.startsAt <= now) {
        return { reason: "not-reschedulable" as const };
      }
      const newStartsAt = getBookingStart(date, time, booking.shop.timezone);
      if (!newStartsAt) return { reason: "invalid-slot" as const };
      if (newStartsAt.getTime() === booking.startsAt.getTime()) {
        return { reason: "same-slot" as const };
      }
      const newEndsAt = new Date(
        newStartsAt.getTime() + booking.serviceDurationSnapshot * 60_000,
      );
      const available = await isBookingSlotAvailable({
        shopId: booking.shopId, serviceId: booking.serviceId,
        professionalId: booking.professionalId, startsAt: newStartsAt,
        endsAt: newEndsAt, timezone: booking.shop.timezone,
        excludeBookingId: booking.id, durationMinutes: booking.serviceDurationSnapshot,
        db: transaction,
      });
      if (!available) return { reason: "slot-unavailable" as const };
      const updated = await transaction.booking.updateMany({
        where: { id: booking.id, status: "CONFIRMED", startsAt: { gt: now } },
        data: { startsAt: newStartsAt, endsAt: newEndsAt },
      });
      if (updated.count !== 1) return { reason: "changed" as const };
      await transaction.bookingEvent.create({
        data: {
          bookingId: booking.id, actorId: session.user.id, type: "RESCHEDULED",
          previousStartsAt: booking.startsAt, previousEndsAt: booking.endsAt,
          newStartsAt, newEndsAt,
        },
      });
      return { reason: null, slug: booking.shop.slug };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (outcome.reason) return rescheduleError(outcome.reason);
    revalidateBookingViews(outcome.slug);
    return { error: null, success: "Agendamento remarcado." };
  } catch (error) {
    if (isSerializationConflict(error)) {
      return { error: "Esse horário foi reservado. Escolha outro.", success: null };
    }
    throw error;
  }
}

async function canAccessBooking(
  db: BookingAccessDb,
  booking: BookingTarget,
  user: BookingUser,
) {
  if (booking.customerId === user.id || isPlatformAdmin(user)) return true;
  const membership = await db.membership.findUnique({
    where: { shopId_userId: { shopId: booking.shopId, userId: user.id } },
    select: { role: true },
  });
  return membership?.role === "OWNER" || membership?.role === "MANAGER";
}

function cancellationError(reason: string): BookingManagementState {
  if (reason === "access") return { error: "Agendamento não encontrado ou sem acesso.", success: null };
  if (reason === "changed") return { error: "O agendamento mudou. Atualize a página.", success: null };
  return { error: "Só é possível cancelar agendamentos confirmados futuros.", success: null };
}

function rescheduleError(reason: string): BookingManagementState {
  const messages: Record<string, string> = {
    access: "Agendamento não encontrado ou sem acesso.",
    "not-reschedulable": "Este agendamento não pode mais ser remarcado.",
    "invalid-slot": "Escolha um horário futuro dentro do período disponível.",
    "same-slot": "Escolha um horário diferente do atual.",
    "slot-unavailable": "Esse horário não está disponível.",
    changed: "O agendamento mudou. Atualize a página.",
  };
  return { error: messages[reason] ?? "Não foi possível remarcar.", success: null };
}

function revalidateBookingViews(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath("/dashboard");
  revalidatePath("/gerencia");
  revalidatePath("/profissional");
  revalidatePath("/admin");
}

function isSerializationConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isValidId(value: string) {
  return value.length > 0 && value.length <= 100;
}
