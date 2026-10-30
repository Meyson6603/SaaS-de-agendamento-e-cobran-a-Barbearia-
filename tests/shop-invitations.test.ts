import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { create, sendEmail } = vi.hoisted(() => ({
  create: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    shopInvitation: { create },
  },
}));

vi.mock("@/lib/email", () => ({
  sendEmail,
}));

import {
  createShopInvitation,
  hashInvitationToken,
} from "@/lib/shop-invitations";

describe("shop invitations", () => {
  beforeEach(() => {
    create.mockReset();
    sendEmail.mockReset();
    create.mockImplementation(async ({ data }) => ({
      id: "invitation-1",
      ...data,
    }));
    sendEmail.mockResolvedValue(undefined);
  });

  it("stores only a hash and sends a seven-day invitation", async () => {
    const invitation = await createShopInvitation({
      shopId: "shop-1",
      shopName: "Navalha Barbearia",
      email: "convidado@example.com",
      role: "PROFESSIONAL",
      displayName: "Convidado",
    });

    const data = create.mock.calls[0][0].data;
    expect(data.shopId).toBe("shop-1");
    expect(data.email).toBe("convidado@example.com");
    expect(data.role).toBe("PROFESSIONAL");
    expect(data.displayName).toBe("Convidado");
    expect(data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(data.tokenHash).not.toContain("convidado");
    expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now() + 6 * 24 * 60 * 60 * 1000);
    expect(invitation.id).toBe("invitation-1");
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "convidado@example.com",
        subject: "Convite para a equipe da Navalha Barbearia | Navalha",
        text: expect.stringContaining("Aceite o convite pelo link:"),
      }),
    );
  });

  it("hashes the same token deterministically", () => {
    expect(hashInvitationToken("token")).toBe(hashInvitationToken("token"));
    expect(hashInvitationToken("token")).not.toBe(hashInvitationToken("other-token"));
  });
});
