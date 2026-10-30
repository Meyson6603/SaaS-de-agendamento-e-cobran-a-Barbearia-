"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth-session";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";
import {
  createShopInvitation,
  hashInvitationToken,
  invitationExpirationMs,
  sendInvitationEmail,
} from "@/lib/shop-invitations";

export type ShopInvitationState = {
  error: string | null;
  success: string | null;
};

export async function inviteShopMember(
  _previousState: ShopInvitationState,
  formData: FormData,
): Promise<ShopInvitationState> {
  const session = await getSession();
  const shopId = getFormString(formData, "shopId");
  const email = getFormString(formData, "email").toLowerCase();
  const role = getFormString(formData, "role");
  const displayName = getFormString(formData, "displayName");

  if (!session) {
    return { error: "Entre na sua conta para continuar.", success: null };
  }
  if (!shopId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Informe um e-mail válido.", success: null };
  }
  if (role !== "MANAGER" && role !== "PROFESSIONAL") {
    return { error: "Selecione um papel válido para o convite.", success: null };
  }
  if (
    role === "PROFESSIONAL" &&
    (displayName.length < 2 || displayName.length > 100)
  ) {
    return { error: "Informe o nome profissional.", success: null };
  }

  const shop = await prisma.barbershop.findUnique({
    where: { id: shopId },
    select: { id: true, name: true, slug: true },
  });
  const membership = await prisma.membership.findUnique({
    where: { shopId_userId: { shopId, userId: session.user.id } },
    select: { role: true },
  });

  if (
    !shop ||
    (!isPlatformAdmin(session.user) &&
      membership?.role !== "OWNER" &&
      membership?.role !== "MANAGER")
  ) {
    return { error: "Você não tem permissão para enviar convites.", success: null };
  }
  if (
    role === "MANAGER" &&
    !isPlatformAdmin(session.user) &&
    membership?.role !== "OWNER"
  ) {
    return { error: "Somente o proprietário pode convidar gerentes.", success: null };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: { shopId_userId: { shopId, userId: existingUser.id } },
      select: { id: true },
    });
    if (existingMembership) {
      return { error: "Essa conta já está vinculada à barbearia.", success: null };
    }
  }

  try {
    await prisma.shopInvitation.updateMany({
      where: { shopId, email, acceptedAt: null, cancelledAt: null },
      data: { cancelledAt: new Date() },
    });
    await createShopInvitation({
      shopId,
      shopName: shop.name,
      email,
      role,
      displayName: role === "PROFESSIONAL" ? displayName : undefined,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: "Não foi possível gerar o convite. Tente novamente.",
        success: null,
      };
    }
    throw error;
  }

  revalidatePath("/gerencia");
  return { error: null, success: `Convite enviado para ${email}.` };
}

export async function resendShopInvitation(
  _previousState: ShopInvitationState,
  formData: FormData,
): Promise<ShopInvitationState> {
  const session = await getSession();
  const invitationId = getFormString(formData, "invitationId");
  if (!session || !invitationId) {
    return { error: "Não foi possível reenviar o convite.", success: null };
  }

  const invitation = await prisma.shopInvitation.findUnique({
    where: { id: invitationId },
    include: { shop: { select: { name: true } } },
  });
  if (!invitation || invitation.acceptedAt || invitation.cancelledAt) {
    return { error: "Esse convite não está pendente.", success: null };
  }
  const membership = await prisma.membership.findUnique({
    where: { shopId_userId: { shopId: invitation.shopId, userId: session.user.id } },
    select: { role: true },
  });
  if (
    !isPlatformAdmin(session.user) &&
    membership?.role !== "OWNER" &&
    !(membership?.role === "MANAGER" && invitation.role === "PROFESSIONAL")
  ) {
    return {
      error: "Você não tem permissão para reenviar este convite.",
      success: null,
    };
  }

  const token = randomUUID().replaceAll("-", "");
  const replacement = await prisma.$transaction(async (transaction) => {
    await transaction.shopInvitation.update({
      where: { id: invitation.id },
      data: { cancelledAt: new Date() },
    });
    return transaction.shopInvitation.create({
      data: {
        shopId: invitation.shopId,
        email: invitation.email,
        role: invitation.role,
        displayName: invitation.displayName,
        tokenHash: hashInvitationToken(token),
        expiresAt: new Date(Date.now() + invitationExpirationMs),
      },
    });
  });
  const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  await sendInvitationEmail({
    email: replacement.email,
    shopName: invitation.shop.name,
    role: replacement.role,
    displayName: replacement.displayName,
    url: `${baseURL}/aceitar-convite?token=${token}`,
  });
  revalidatePath("/gerencia");
  return { error: null, success: `Convite reenviado para ${replacement.email}.` };
}

export async function cancelShopInvitation(
  _previousState: ShopInvitationState,
  formData: FormData,
): Promise<ShopInvitationState> {
  const session = await getSession();
  const invitationId = getFormString(formData, "invitationId");
  const invitation = invitationId
    ? await prisma.shopInvitation.findUnique({
        where: { id: invitationId },
        select: { shopId: true, acceptedAt: true, cancelledAt: true, role: true },
      })
    : null;
  if (!session || !invitation || invitation.acceptedAt || invitation.cancelledAt) {
    return { error: "Esse convite não está pendente.", success: null };
  }
  const membership = await prisma.membership.findUnique({
    where: { shopId_userId: { shopId: invitation.shopId, userId: session.user.id } },
    select: { role: true },
  });
  if (
    !isPlatformAdmin(session.user) &&
    membership?.role !== "OWNER" &&
    !(membership?.role === "MANAGER" && invitation.role === "PROFESSIONAL")
  ) {
    return {
      error: "Você não tem permissão para cancelar este convite.",
      success: null,
    };
  }
  await prisma.shopInvitation.update({
    where: { id: invitationId },
    data: { cancelledAt: new Date() },
  });
  revalidatePath("/gerencia");
  return { error: null, success: "Convite cancelado." };
}

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
