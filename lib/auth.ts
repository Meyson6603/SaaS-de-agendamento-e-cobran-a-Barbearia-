import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  baseURL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  account: {
    encryptOAuthTokens: true,
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Redefinição de senha | Navalha",
        text: [
          `Olá, ${user.name}!`,
          "",
          "Recebemos uma solicitação para redefinir a senha da sua conta Navalha.",
          `Acesse o link para criar uma nova senha: ${url}`,
          "",
          "Esse link expira em 1 hora. Se você não solicitou a redefinição, ignore este e-mail.",
        ].join("\n"),
      });
    },
  },
  emailVerification: {
    expiresIn: 3600,
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Confirme seu e-mail | Navalha",
        text: [
          `Olá, ${user.name}!`,
          "",
          "Confirme seu e-mail para ativar o acesso à sua conta Navalha.",
          `Acesse o link para confirmar: ${url}`,
          "",
          "Esse link expira em 1 hora.",
        ].join("\n"),
      });
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [baseURL],
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {},
});
