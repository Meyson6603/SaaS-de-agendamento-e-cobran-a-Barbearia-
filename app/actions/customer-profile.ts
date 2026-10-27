"use server";

import { getSession } from "@/lib/auth-session";
import {
  isValidBrazilianPhone,
  normalizeBrazilianPhone,
} from "@/lib/brazilian-phone";
import { prisma } from "@/lib/prisma";

type SavePhoneResult =
  | { success: true; phone: string }
  | { success: false; error: string };

export async function saveCustomerPhone(input: string): Promise<SavePhoneResult> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Entre na sua conta para salvar seu telefone." };
  }

  if (!isValidBrazilianPhone(input)) {
    return {
      success: false,
      error: "Informe um telefone brasileiro válido, com DDD e número.",
    };
  }

  const phone = normalizeBrazilianPhone(input);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone },
  });

  return { success: true, phone };
}
