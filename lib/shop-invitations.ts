import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createShopInvitation(input: {
  shopId: string;
  shopName: string;
  email: string;
  role: "MANAGER" | "PROFESSIONAL";
  displayName?: string;
}) {
  const token = randomBytes(32).toString("hex");
  const invitation = await prisma.shopInvitation.create({
    data: {
      shopId: input.shopId,
      email: input.email,
      role: input.role,
      displayName: input.displayName || null,
      tokenHash: hashInvitationToken(token),
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
    },
  });
  const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const url = `${baseURL}/aceitar-convite?token=${token}`;

  await sendInvitationEmail({
    email: input.email,
    shopName: input.shopName,
    role: input.role,
    displayName: input.displayName,
    url,
  });

  return invitation;
}

export async function sendInvitationEmail(input: {
  email: string;
  shopName: string;
  role: "MANAGER" | "PROFESSIONAL";
  displayName?: string | null;
  url: string;
}) {
  await sendEmail({
    to: input.email,
    subject: `Convite para a equipe da ${input.shopName} | Navalha`,
    text: [
      `Você foi convidado para fazer parte da equipe da ${input.shopName}.`,
      "",
      input.role === "MANAGER"
        ? "Papel: gerente"
        : `Papel: profissional${input.displayName ? ` (${input.displayName})` : ""}`,
      `Aceite o convite pelo link: ${input.url}`,
      "",
      "O convite expira em 7 dias e pode ser usado uma única vez.",
    ].join("\n"),
  });
}

export const invitationExpirationMs = INVITATION_TTL_MS;
