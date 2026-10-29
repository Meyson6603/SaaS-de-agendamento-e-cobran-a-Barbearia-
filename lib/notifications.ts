import { Prisma } from "@/generated/prisma/client";

type NotificationDb = Prisma.TransactionClient;

type BookingNotificationInput = {
  bookingId: string;
  shopId: string;
  customerId: string;
  professionalId: string;
  serviceName: string;
  startsAt: Date;
  timezone: string;
  type: "BOOKING_CONFIRMED" | "BOOKING_CANCELLED" | "BOOKING_RESCHEDULED" | "PAYMENT_RECEIVED";
  actorId?: string;
  paymentMethod?: string;
};

export async function notifyBookingParticipants(
  db: NotificationDb,
  input: BookingNotificationInput,
) {
  const [professional, managers] = await Promise.all([
    db.professional.findUnique({
      where: { id: input.professionalId },
      select: { membership: { select: { userId: true } } },
    }),
    db.membership.findMany({
      where: { shopId: input.shopId, role: { in: ["OWNER", "MANAGER"] } },
      select: { userId: true },
    }),
  ]);

  const recipients = new Set([
    input.customerId,
    professional?.membership.userId,
    ...managers.map(({ userId }) => userId),
  ]);
  if (input.actorId) recipients.delete(input.actorId);

  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: input.timezone,
  }).format(input.startsAt);
  const content = notificationContent(input, date);

  await db.notification.createMany({
    data: [...recipients].filter(Boolean).map((userId) => ({
      userId: userId as string,
      shopId: input.shopId,
      bookingId: input.bookingId,
      type: input.type,
      title: content.title,
      message: content.message,
    })),
  });
}

function notificationContent(
  input: BookingNotificationInput,
  date: string,
) {
  if (input.type === "BOOKING_CONFIRMED") {
    return {
      title: "Agendamento confirmado",
      message: `${input.serviceName} está marcado para ${date}.`,
    };
  }
  if (input.type === "BOOKING_CANCELLED") {
    return {
      title: "Agendamento cancelado",
      message: `${input.serviceName}, que estava marcado para ${date}, foi cancelado.`,
    };
  }
  if (input.type === "BOOKING_RESCHEDULED") {
    return {
      title: "Agendamento remarcado",
      message: `${input.serviceName} foi remarcado para ${date}.`,
    };
  }
  return {
    title: "Pagamento recebido",
    message: `Pagamento de ${input.serviceName} recebido${input.paymentMethod ? ` via ${input.paymentMethod}` : ""}.`,
  };
}
