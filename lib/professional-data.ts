import "server-only";

import { requireSession } from "@/lib/auth-session";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

const BOOKINGS_PER_PAGE = 20;

export async function getProfessionalDashboard(
  page: number,
  requestedProfessionalId?: string,
) {
  const session = await requireSession();
  const platformAdmin = isPlatformAdmin(session.user);
  const professionals = await prisma.professional.findMany({
    where: platformAdmin
      ? { isActive: true }
      : {
          isActive: true,
          membership: {
            userId: session.user.id,
            role: "PROFESSIONAL",
          },
        },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      displayName: true,
      shopId: true,
      membership: {
        select: {
          user: { select: { name: true, email: true } },
        },
      },
      shop: {
        select: {
          name: true,
          timezone: true,
        },
      },
    },
  });

  if (professionals.length === 0) {
    return {
      userName: session.user.name,
      isPlatformAdmin: platformAdmin,
      professionals: [],
      selectedProfessionalId: null,
      upcomingBookings: [],
      upcomingBookingsCount: 0,
      currentPage: 1,
      totalPages: 0,
    };
  }

  const now = new Date();
  const selectedProfessional =
    platformAdmin
      ? professionals.find(({ id }) => id === requestedProfessionalId) ??
        professionals[0]
      : null;
  const visibleProfessionals =
    selectedProfessional && platformAdmin
      ? [selectedProfessional]
      : professionals;
  const professionalIds = visibleProfessionals.map(({ id }) => id);
  const bookingFilter = {
    professionalId: { in: professionalIds },
    endsAt: { gte: now },
    status: "CONFIRMED" as const,
  };
  const upcomingBookingsCount = await prisma.booking.count({
    where: bookingFilter,
  });
  const totalPages = Math.ceil(upcomingBookingsCount / BOOKINGS_PER_PAGE);
  const currentPage =
    totalPages === 0 ? 1 : Math.min(page, totalPages);
  const upcomingBookings = await prisma.booking.findMany({
    where: bookingFilter,
    orderBy: { startsAt: "asc" },
    skip: (currentPage - 1) * BOOKINGS_PER_PAGE,
    take: BOOKINGS_PER_PAGE,
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      serviceNameSnapshot: true,
      customerNote: true,
      payment: { select: { status: true, method: true } },
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
      professional: {
        select: {
          displayName: true,
          shop: {
            select: {
              name: true,
              timezone: true,
            },
          },
        },
      },
    },
  });

  return {
    userName: session.user.name,
    isPlatformAdmin: platformAdmin,
    professionals: professionals.map(
      ({ membership, ...professional }) => ({
        ...professional,
        userName: membership.user.name,
        userEmail: membership.user.email,
      }),
    ),
    selectedProfessionalId: selectedProfessional?.id ?? null,
    upcomingBookings,
    upcomingBookingsCount,
    currentPage,
    totalPages,
  };
}
