import "server-only";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-session";

function getAllowedAdminEmails(): Set<string> {
  return new Set(
    (process.env.PLATFORM_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requirePlatformAdmin() {
  const session = await requireSession();
  const allowedAdminEmails = getAllowedAdminEmails();

  if (allowedAdminEmails.size === 0) {
    throw new Error(
      "Configure PLATFORM_ADMIN_EMAILS with at least one verified administrator email.",
    );
  }

  if (
    !session.user.emailVerified ||
    !allowedAdminEmails.has(session.user.email.trim().toLowerCase())
  ) {
    redirect("/dashboard");
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };
}
