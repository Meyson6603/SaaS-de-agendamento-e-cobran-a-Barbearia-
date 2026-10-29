"use server";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

type OtpResult = { success: true } | { success: false; error: string };

export async function sendEmailOtp(): Promise<OtpResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Entre na sua conta para verificar o e-mail." };

  const email = session.user.email.trim().toLowerCase();
  const recent = await prisma.otpChallenge.findFirst({
    where: { userId: session.user.id, createdAt: { gte: new Date(Date.now() - 60_000) } },
    select: { id: true },
  });
  if (recent) return { success: false, error: "Aguarde 1 minuto antes de solicitar outro código." };

  const code = String(randomInt(100000, 1000000));
  const challenge = await prisma.otpChallenge.create({
    data: {
      userId: session.user.id,
      email,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    },
  });

  try {
    await sendEmail({
      to: email,
      subject: "Seu código de confirmação | Navalha",
      text: `Seu código Navalha é ${code}. Ele expira em 10 minutos.`,
    });
  } catch (error) {
    await prisma.otpChallenge.delete({ where: { id: challenge.id } });
    if (error instanceof Error && error.message === "E-mail transacional não está configurado.") {
      return { success: false, error: "O envio de e-mail ainda não está configurado." };
    }
    throw error;
  }

  return { success: true };
}

export async function verifyEmailOtp(codeInput: string): Promise<OtpResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Entre na sua conta para verificar o e-mail." };

  const code = codeInput.trim();
  if (!/^\d{6}$/.test(code)) {
    return { success: false, error: "Informe o código de 6 dígitos recebido por e-mail." };
  }

  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      userId: session.user.id,
      email: session.user.email.trim().toLowerCase(),
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) return { success: false, error: "Código expirado. Solicite um novo código." };
  if (challenge.attempts >= 5) {
    return { success: false, error: "Limite de tentativas atingido. Solicite um novo código." };
  }

  const matches = timingSafeEqual(
    Buffer.from(challenge.codeHash, "hex"),
    Buffer.from(hashCode(code), "hex"),
  );
  if (!matches) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    return { success: false, error: "Código incorreto." };
  }

  await prisma.$transaction([
    prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { emailOtpVerifiedAt: new Date() },
    }),
  ]);
  return { success: true };
}

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}
