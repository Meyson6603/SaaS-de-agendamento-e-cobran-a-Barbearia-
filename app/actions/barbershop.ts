"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import {
  isValidBrazilianPhone,
  normalizeBrazilianPhone,
} from "@/lib/brazilian-phone";
import { prisma } from "@/lib/prisma";

export type CreateBarbershopState = {
  error: string | null;
  success: string | null;
};

export async function createBarbershopForOwner(
  _previousState: CreateBarbershopState,
  formData: FormData,
): Promise<CreateBarbershopState> {
  await requirePlatformAdmin();

  const name = getFormString(formData, "name");
  const slug = getFormString(formData, "slug").toLowerCase();
  const phoneInput = getFormString(formData, "phone");
  const ownerEmail = getFormString(formData, "ownerEmail").toLowerCase();

  if (name.length < 2 || name.length > 100) {
    return {
      error: "O nome precisa ter entre 2 e 100 caracteres.",
      success: null,
    };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 60) {
    return {
      error:
        "Use um identificador com letras minúsculas, números e hífens, sem espaços.",
      success: null,
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
    return {
      error: "Informe o e-mail de uma conta cadastrada e verificada.",
      success: null,
    };
  }

  if (phoneInput && !isValidBrazilianPhone(phoneInput)) {
    return {
      error: "Informe um telefone brasileiro válido ou deixe o campo vazio.",
      success: null,
    };
  }

  const owner = await prisma.user.findUnique({
    where: { email: ownerEmail },
    select: { id: true, emailVerified: true },
  });

  if (!owner || !owner.emailVerified) {
    return {
      error: "Não encontrei uma conta verificada com esse e-mail.",
      success: null,
    };
  }

  const existingSlug = await prisma.barbershop.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingSlug) {
    return {
      error: "Esse identificador já está em uso. Escolha outro.",
      success: null,
    };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const shop = await transaction.barbershop.create({
        data: {
          name,
          slug,
          phone: phoneInput ? normalizeBrazilianPhone(phoneInput) : null,
        },
        select: { id: true },
      });

      await transaction.membership.create({
        data: {
          shopId: shop.id,
          userId: owner.id,
          role: "OWNER",
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: "Esse identificador acabou de ser cadastrado. Escolha outro.",
        success: null,
      };
    }

    throw error;
  }

  revalidatePath("/admin/barbearias");
  revalidatePath("/admin");
  revalidatePath("/gerencia");

  return {
    error: null,
    success: `Barbearia cadastrada e vinculada ao proprietário ${ownerEmail}.`,
  };
}

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
