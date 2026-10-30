import "server-only";

import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

type BookingEmailEvent = "CONFIRMED" | "CANCELLED" | "RESCHEDULED";

export async function sendBookingEventEmails(
  bookingId: string,
  event: BookingEmailEvent,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      serviceNameSnapshot: true,
      startsAt: true,
      shop: { select: { name: true, timezone: true } },
      customer: { select: { name: true, email: true } },
      professional: {
        select: {
          displayName: true,
          membership: { select: { user: { select: { name: true, email: true } } } },
        },
      },
    },
  });

  if (!booking) {
    console.error(`[booking-email] Agendamento ${bookingId} não encontrado.`);
    return;
  }

  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: booking.shop.timezone,
  }).format(booking.startsAt);
  const content = getEmailContent(event, booking.serviceNameSnapshot, date);
  const recipients = [
    { name: booking.customer.name, email: booking.customer.email },
    {
      name: booking.professional.membership.user.name,
      email: booking.professional.membership.user.email,
    },
  ];

  const results = await Promise.allSettled(
    recipients.map(({ name, email }) =>
      sendEmail({
        to: email,
        subject: `${content.subject} | ${booking.shop.name}`,
        text: [
          `Olá, ${name}!`,
          "",
          content.message,
          `Serviço: ${booking.serviceNameSnapshot}`,
          `Data: ${date}`,
          `Barbearia: ${booking.shop.name}`,
        ].join("\n"),
      }),
    ),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `[booking-email] Falha ao enviar ${event.toLowerCase()} para ${recipients[index].email}:`,
        result.reason,
      );
    }
  });
}

function getEmailContent(
  event: BookingEmailEvent,
  serviceName: string,
  date: string,
) {
  if (event === "CONFIRMED") {
    return {
      subject: "Agendamento confirmado",
      message: `Seu agendamento de ${serviceName} foi confirmado para ${date}.`,
    };
  }
  if (event === "CANCELLED") {
    return {
      subject: "Agendamento cancelado",
      message: `O agendamento de ${serviceName} marcado para ${date} foi cancelado.`,
    };
  }
  return {
    subject: "Agendamento remarcado",
    message: `Seu agendamento de ${serviceName} foi remarcado para ${date}.`,
  };
}
