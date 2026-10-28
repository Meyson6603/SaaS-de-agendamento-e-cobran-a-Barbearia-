import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const SLOT_INTERVAL_MINUTES = 15;
const BOOKING_WINDOW_DAYS = 45;

export type BookingDateOption = {
  value: string;
  weekday: string;
  day: string;
  accessibleLabel: string;
};

export function getBookingDates(timezone: string, days = 14): BookingDateOption[] {
  const today = getLocalDate(new Date(), timezone);
  const todayDate = parseDate(today);
  if (!todayDate) {
    throw new Error("The current date could not be calculated in the shop timezone.");
  }
  const dates: BookingDateOption[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(todayDate);
    date.setUTCDate(date.getUTCDate() + offset);
    const value = formatDate(date);
    const dateAtNoon = zonedDateTimeToDate(value, 12 * 60, timezone);
    if (!dateAtNoon) {
      throw new Error("The date could not be calculated in the shop timezone.");
    }
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      timeZone: timezone,
    });
    const weekday = formatter.formatToParts(dateAtNoon)
      .find((part) => part.type === "weekday")?.value;

    dates.push({
      value,
      weekday: weekday
        ? `${weekday.charAt(0).toUpperCase()}${weekday.slice(1, 3)}`
        : "",
      day: String(date.getUTCDate()).padStart(2, "0"),
      accessibleLabel: new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "full",
        timeZone: timezone,
      }).format(dateAtNoon),
    });
  }

  return dates;
}

export async function getAvailableBookingTimes({
  shopId,
  serviceId,
  professionalId,
  date,
  timezone,
}: {
  shopId: string;
  serviceId: string;
  professionalId: string;
  date: string;
  timezone: string;
}) {
  const dateParts = parseDate(date);
  if (!dateParts || !isWithinBookingWindow(date, timezone)) {
    return [];
  }

  const dayEndDate = new Date(dateParts);
  dayEndDate.setUTCDate(dayEndDate.getUTCDate() + 1);
  const dayStart = zonedDateTimeToDate(date, 0, timezone);
  const dayEnd = zonedDateTimeToDate(formatDate(dayEndDate), 0, timezone);

  if (!dayStart || !dayEnd) {
    return [];
  }

  const weekday = weekdays[dateParts.getUTCDay()];
  const assignment = await prisma.professionalService.findFirst({
    where: { shopId, serviceId, professionalId },
    select: {
      professional: {
        select: {
          isActive: true,
          weeklyAvailability: {
            where: { weekday },
            select: { startMinute: true, endMinute: true },
          },
        },
      },
    },
  });

  if (!assignment?.professional.isActive) {
    return [];
  }

  const [bookings, blockedPeriods] = await Promise.all([
    prisma.booking.findMany({
      where: {
        shopId,
        professionalId,
        status: "CONFIRMED",
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
      },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.availabilityException.findMany({
      where: {
        shopId,
        professionalId,
        type: "BLOCKED",
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);
  const service = await prisma.service.findFirst({
    where: { id: serviceId, shopId, isActive: true },
    select: { durationMinutes: true },
  });

  if (!service) {
    return [];
  }

  const now = new Date();
  const availableMinutes = new Set<number>();

  for (const interval of assignment.professional.weeklyAvailability) {
    for (
      let startMinute = interval.startMinute;
      startMinute + service.durationMinutes <= interval.endMinute;
      startMinute += SLOT_INTERVAL_MINUTES
    ) {
      const start = zonedDateTimeToDate(date, startMinute, timezone);
      if (!start || start <= now) {
        continue;
      }

      const end = new Date(start.getTime() + service.durationMinutes * 60_000);
      const conflicts = [...bookings, ...blockedPeriods].some(
        (period) => start < period.endsAt && end > period.startsAt,
      );

      if (!conflicts) {
        availableMinutes.add(startMinute);
      }
    }
  }

  return [...availableMinutes]
    .sort((left, right) => left - right)
    .map((minutes) => ({
      value: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
    }));
}

export async function isBookingSlotAvailable({
  shopId,
  serviceId,
  professionalId,
  startsAt,
  endsAt,
  timezone,
  db = prisma,
}: {
  shopId: string;
  serviceId: string;
  professionalId: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  db?: Prisma.TransactionClient;
}) {
  const localStart = getLocalDateParts(startsAt, timezone);
  const localEnd = getLocalDateParts(new Date(endsAt.getTime() - 1), timezone);

  if (localStart.date !== localEnd.date) {
    return false;
  }

  const startMinute = localStart.hour * 60 + localStart.minute;
  const endMinute = localEnd.hour * 60 + localEnd.minute + 1;
  const parsedLocalDate = parseDate(localStart.date);
  if (!parsedLocalDate) {
    return false;
  }
  const weekday = weekdays[parsedLocalDate.getUTCDay()];

  const assignment = await db.professionalService.findFirst({
    where: {
      shopId,
      serviceId,
      professionalId,
      professional: {
        isActive: true,
        shopId,
      },
      service: { isActive: true, shopId },
    },
    select: {
      service: { select: { durationMinutes: true } },
      professional: {
        select: {
          weeklyAvailability: {
            where: {
              weekday,
              startMinute: { lte: startMinute },
              endMinute: { gte: endMinute },
            },
            select: { id: true },
          },
        },
      },
    },
  });

  if (
    !assignment ||
    assignment.service.durationMinutes !== (endsAt.getTime() - startsAt.getTime()) / 60_000 ||
    assignment.professional.weeklyAvailability.length === 0
  ) {
    return false;
  }

  const [conflictingBooking, blockedPeriod] = await Promise.all([
    db.booking.findFirst({
      where: {
        shopId,
        professionalId,
        status: "CONFIRMED",
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
      select: { id: true },
    }),
    db.availabilityException.findFirst({
      where: {
        shopId,
        professionalId,
        type: "BLOCKED",
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
      select: { id: true },
    }),
  ]);

  return !conflictingBooking && !blockedPeriod;
}

export function getBookingStart(date: string, time: string, timezone: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  const parsedDate = parseDate(date);

  if (!parsedDate || !match || !isWithinBookingWindow(date, timezone)) {
    return null;
  }

  const minutes = Number(match[1]) * 60 + Number(match[2]);
  const startsAt = zonedDateTimeToDate(date, minutes, timezone);
  if (!startsAt || startsAt <= new Date()) {
    return null;
  }

  return startsAt;
}

function getLocalDate(date: Date, timezone: string) {
  const parts = getLocalDateParts(date, timezone);
  return parts.date;
}

function isWithinBookingWindow(date: string, timezone: string) {
  const parsedDate = parseDate(date);
  if (!parsedDate || date < getLocalDate(new Date(), timezone)) {
    return false;
  }

  const maxDate = new Date(getLocalDate(new Date(), timezone) + "T12:00:00Z");
  maxDate.setUTCDate(maxDate.getUTCDate() + BOOKING_WINDOW_DAYS);
  return date <= formatDate(maxDate);
}

function getLocalDateParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

function zonedDateTimeToDate(date: string, minutes: number, timezone: string) {
  const parsedDate = parseDate(date);
  if (!parsedDate) {
    return null;
  }

  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const desired = Date.UTC(
    parsedDate.getUTCFullYear(),
    parsedDate.getUTCMonth(),
    parsedDate.getUTCDate(),
    hour,
    minute,
  );
  let timestamp = desired;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const local = getLocalDateParts(new Date(timestamp), timezone);
    const [year, month, day] = local.date.split("-").map(Number);
    const represented = Date.UTC(year, month - 1, day, local.hour, local.minute);
    timestamp += desired - represented;
  }

  const result = new Date(timestamp);
  const local = getLocalDateParts(result, timezone);

  if (local.date !== date || local.hour !== hour || local.minute !== minute) {
    return null;
  }

  return result;
}

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return formatDate(date) === value ? date : null;
}

function formatDate(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

const weekdays = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;
