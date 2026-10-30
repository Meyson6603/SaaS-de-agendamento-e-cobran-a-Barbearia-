import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { findUnique, sendEmail } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique },
  },
}));

vi.mock("@/lib/email", () => ({
  sendEmail,
}));

import { sendBookingEventEmails } from "@/lib/booking-emails";

const booking = {
  serviceNameSnapshot: "Corte Navalha",
  startsAt: new Date("2026-11-02T12:00:00.000Z"),
  shop: { name: "Navalha Barbearia", timezone: "America/Sao_Paulo" },
  customer: { name: "Cliente", email: "cliente@example.com" },
  professional: {
    displayName: "Profissional",
    membership: {
      user: { name: "Profissional", email: "profissional@example.com" },
    },
  },
};

describe("booking transactional emails", () => {
  beforeEach(() => {
    findUnique.mockReset();
    sendEmail.mockReset();
    findUnique.mockResolvedValue(booking);
    sendEmail.mockResolvedValue(undefined);
  });

  it.each([
    ["CONFIRMED", "Agendamento confirmado"],
    ["CANCELLED", "Agendamento cancelado"],
    ["RESCHEDULED", "Agendamento remarcado"],
  ] as const)("sends the %s message to both participants", async (event, subject) => {
    await sendBookingEventEmails("booking-1", event);

    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "booking-1" } }),
    );
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "cliente@example.com",
        subject: `${subject} | Navalha Barbearia`,
        text: expect.stringContaining("Corte Navalha"),
      }),
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "profissional@example.com" }),
    );
  });

  it("does not throw when one delivery fails", async () => {
    sendEmail
      .mockRejectedValueOnce(new Error("provider unavailable"))
      .mockResolvedValueOnce(undefined);

    await expect(
      sendBookingEventEmails("booking-1", "CONFIRMED"),
    ).resolves.toBeUndefined();
  });

  it("does not send when the booking no longer exists", async () => {
    findUnique.mockResolvedValue(null);

    await sendBookingEventEmails("missing-booking", "CANCELLED");

    expect(sendEmail).not.toHaveBeenCalled();
  });
});
