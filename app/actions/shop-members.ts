"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth-session";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

export type AddManagerState = {
  error: string | null;
  success: string | null;
};

export async function addShopManager(
  _previousState: AddManagerState,
  formData: FormData,
): Promise<AddManagerState> {
  const session = await getSession();

  if (!session) {
    return { error: "Entre na sua conta para continuar.", success: null };
  }

  const shopId = getFormString(formData, "shopId");
  const managerEmail = getFormString(formData, "managerEmail").toLowerCase();

  if (!shopId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmail)) {
    return {
      error: "Informe o e-mail de uma conta cadastrada e verificada.",
      success: null,
    };
  }

  const ownerMembership = await prisma.membership.findUnique({
    where: { shopId_userId: { shopId, userId: session.user.id } },
    select: { role: true },
  });

  if (ownerMembership?.role !== "OWNER" && !isPlatformAdmin(session.user)) {
    return {
      error: "Somente o proprietário ou administrador da plataforma pode adicionar gerentes.",
      success: null,
    };
  }

  const manager = await prisma.user.findUnique({
    where: { email: managerEmail },
    select: { id: true, emailVerified: true },
  });

  if (!manager || !manager.emailVerified) {
    return {
      error: "Não encontrei uma conta verificada com esse e-mail.",
      success: null,
    };
  }

  const existingMembership = await prisma.membership.findUnique({
    where: { shopId_userId: { shopId, userId: manager.id } },
    select: { role: true },
  });

  if (existingMembership) {
    return {
      error:
        existingMembership.role === "MANAGER"
          ? "Essa pessoa já é gerente desta barbearia."
          : "Essa conta já tem outro papel nesta barbearia.",
      success: null,
    };
  }

  try {
    await prisma.membership.create({
      data: { shopId, userId: manager.id, role: "MANAGER" },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: "Essa pessoa já foi vinculada à barbearia.",
        success: null,
      };
    }

    throw error;
  }

  revalidatePath("/gerencia");

  return {
    error: null,
    success: `A conta ${managerEmail} agora tem acesso de gerente.`,
  };
}

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
