import "server-only";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-session";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

export async function getManagerDashboard(shopId?: string) {
  const session = await requireSession();
  const platformAdmin = isPlatformAdmin(session.user);
  const memberships = platformAdmin
    ? await prisma.barbershop.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          phone: true,
          createdAt: true,
        },
      }).then((shops) =>
        shops.map((shop) => ({ role: "ADMIN" as const, shop })),
      )
    : await prisma.membership.findMany({
        where: {
          userId: session.user.id,
          role: { in: ["OWNER", "MANAGER"] },
        },
        orderBy: { createdAt: "asc" },
        select: {
          role: true,
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
              phone: true,
              createdAt: true,
            },
          },
        },
      });

  if (memberships.length === 0) {
    return {
      userName: session.user.name,
      isPlatformAdmin: platformAdmin,
      shops: [],
      selectedShop: null,
      metrics: null,
      upcomingBookings: [],
      managers: [],
      professionals: [],
      services: [],
      weeklyAvailability: [],
    };
  }

  const selectedMembership = shopId
    ? memberships.find(({ shop }) => shop.id === shopId)
    : memberships[0];

  if (!selectedMembership) {
    redirect("/gerencia");
  }

  const shop = selectedMembership.shop;
  const now = new Date();
  const [
    professionals,
    services,
    bookings,
    todaysBookings,
    paidRevenue,
    upcomingBookings,
    managers,
    team,
    configuredServices,
    weeklyAvailability,
  ] =
    await Promise.all([
      prisma.professional.count({
        where: { shopId: shop.id, isActive: true },
      }),
      prisma.service.count({
        where: { shopId: shop.id, isActive: true },
      }),
      prisma.booking.count({ where: { shopId: shop.id } }),
      prisma.booking.count({
        where: {
          shopId: shop.id,
          startsAt: { gte: getSaoPauloDayStart(now), lt: getSaoPauloDayStart(addDays(now, 1)) },
          status: "CONFIRMED",
        },
      }),
      prisma.payment.aggregate({
        where: { booking: { shopId: shop.id }, status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.booking.findMany({
        where: {
          shopId: shop.id,
          startsAt: { gte: now },
          status: "CONFIRMED",
        },
        take: 5,
        orderBy: { startsAt: "asc" },
        select: {
          id: true,
          startsAt: true,
          serviceNameSnapshot: true,
          customer: { select: { name: true } },
          professional: { select: { displayName: true } },
        },
      }),
      prisma.membership.findMany({
        where: { shopId: shop.id, role: "MANAGER" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.professional.findMany({
        where: { shopId: shop.id },
        orderBy: { displayName: "asc" },
        select: {
          id: true,
          displayName: true,
          isActive: true,
          membership: {
            select: { user: { select: { name: true, email: true } } },
          },
        },
      }),
      prisma.service.findMany({
        where: { shopId: shop.id },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          durationMinutes: true,
          price: true,
          isActive: true,
          professionals: {
            select: { professional: { select: { id: true, displayName: true } } },
          },
        },
      }),
      prisma.weeklyAvailability.findMany({
        where: { shopId: shop.id },
        orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
        select: {
          id: true,
          weekday: true,
          startMinute: true,
          endMinute: true,
          professional: { select: { displayName: true } },
        },
      }),
    ]);

  return {
    userName: session.user.name,
    isPlatformAdmin: platformAdmin,
    shops: memberships.map(({ role, shop: memberShop }) => ({
      ...memberShop,
      role,
    })),
    selectedShop: { ...shop, role: selectedMembership.role },
    metrics: {
      professionals,
      services,
      bookings,
      todaysBookings,
      paidRevenue: paidRevenue._sum.amount?.toString() ?? "0",
    },
    upcomingBookings,
    managers:
      selectedMembership.role === "OWNER" || platformAdmin
        ? managers.map(({ id, createdAt, user }) => ({
            id,
            createdAt,
            name: user.name,
            email: user.email,
          }))
        : [],
    professionals: team.map(({ membership, ...professional }) => ({
      ...professional,
      userName: membership.user.name,
      userEmail: membership.user.email,
    })),
    services: configuredServices.map(
      ({ professionals: serviceProfessionals, price, ...service }) => ({
        ...service,
        price: price.toString(),
        professionals: serviceProfessionals.map(
          ({ professional }) => professional,
        ),
      }),
    ),
    weeklyAvailability,
  };
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getSaoPauloDayStart(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return new Date(`${values.year}-${values.month}-${values.day}T00:00:00-03:00`);
}
