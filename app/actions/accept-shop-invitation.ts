"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth-session";
import { hashInvitationToken } from "@/lib/shop-invitations";
import { prisma } from "@/lib/prisma";

export type AcceptInvitationState = {
  error: string | null;
  success: string | null;
  redirectTo: string | null;
};

export async function acceptShopInvitation(
  _previousState: AcceptInvitationState,
  formData: FormData,
): Promise<AcceptInvitationState> {
  const session = await getSession();
  const token = getFormString(formData, "token");
  if (!session || !token) {
    return {
      error: session
        ? "O convite não foi encontrado."
        : "Entre ou crie sua conta para aceitar o convite.",
      success: null,
      redirectTo: session ? null : `/login?redirectTo=${encodeURIComponent(`/aceitar-convite?token=${token}`)}`,
    };
  }

  const invitation = await prisma.shopInvitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    include: { shop: { select: { name: true, slug: true } } },
  });
  if (
    !invitation ||
    invitation.acceptedAt ||
    invitation.expiresAt <= new Date() ||
    invitation.email.toLowerCase() !== session.user.email.toLowerCase()
  ) {
    return { error: "Este convite é inválido, expirou ou pertence a outro e-mail.", success: null, redirectTo: null };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const membership = await transaction.membership.create({
        data: {
          shopId: invitation.shopId,
          userId: session.user.id,
          role: invitation.role,
        },
        select: { id: true },
      });
      if (invitation.role === "PROFESSIONAL") {
        await transaction.professional.create({
          data: {
            shopId: invitation.shopId,
            membershipId: membership.id,
            displayName: invitation.displayName || session.user.name,
          },
        });
      }
      await transaction.shopInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date(), inviteeId: session.user.id },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Sua conta já está vinculada a esta barbearia.", success: null, redirectTo: null };
    }
    throw error;
  }

  revalidatePath("/gerencia");
  revalidatePath("/profissional");
  return {
    error: null,
    success: `Convite aceito. Você agora faz parte da equipe da ${invitation.shop.name}.`,
    redirectTo: invitation.role === "PROFESSIONAL" ? "/profissional" : "/gerencia",
  };
}

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
