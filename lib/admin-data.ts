import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export async function getPlatformOverview() {
  await requirePlatformAdmin();
  const { startOfToday, startOfTomorrow } = getSaoPauloDayRange();

  const [
    users,
    barbershops,
    memberships,
    bookings,
    todaysBookings,
    paidRevenue,
    recentBarbershops,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.barbershop.count(),
    prisma.membership.count(),
    prisma.booking.count(),
    prisma.booking.count({
      where: {
        startsAt: { gte: startOfToday, lt: startOfTomorrow },
        status: "CONFIRMED",
      },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.barbershop.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: { select: { memberships: true, bookings: true } },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { memberships: true, bookings: true } },
      },
    }),
  ]);

  return {
    metrics: {
      users,
      barbershops,
      memberships,
      bookings,
      todaysBookings,
      paidRevenue: paidRevenue._sum.amount?.toString() ?? "0",
    },
    recentBarbershops,
    recentUsers,
  };
}

export async function getAdminBarbershops() {
  await requirePlatformAdmin();

  return prisma.barbershop.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      _count: { select: { memberships: true, bookings: true } },
      memberships: {
        where: { role: "OWNER" },
        take: 1,
        select: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
}

export async function getAdminUsers() {
  await requirePlatformAdmin();

  return prisma.user.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { memberships: true, bookings: true } },
    },
  });
}

export async function getPlatformSettingsStatus() {
  await requirePlatformAdmin();

  return {
    baseUrl:
      process.env.BETTER_AUTH_URL ?? "http://localhost:3000 (padrão local)",
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    googleConfigured: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    ),
    adminEmailsConfigured: Boolean(
      process.env.PLATFORM_ADMIN_EMAILS?.split(",").some((email) =>
        email.trim(),
      ),
    ),
  };
}

function getSaoPauloDayRange() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const today = `${values.year}-${values.month}-${values.day}`;
  const startOfToday = new Date(`${today}T00:00:00-03:00`);
  const nextDate = new Date(`${today}T00:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const startOfTomorrow = new Date(`${nextDate.toISOString().slice(0, 10)}T00:00:00-03:00`);

  return { startOfToday, startOfTomorrow };
}
