import Link from "next/link";
import AccountMenu from "@/app/_components/account-menu";
import { getSession } from "@/lib/auth-session";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

export default async function PublicAccountMenu() {
  const session = await getSession();

  if (!session) {
    return (
      <Link className="header-account-link" href="/login">
        Entrar
      </Link>
    );
  }

  const platformAdmin = isPlatformAdmin(session.user);
  const professionalProfile = platformAdmin
    ? null
    : await prisma.professional.findFirst({
        where: {
          isActive: true,
          membership: { userId: session.user.id, role: "PROFESSIONAL" },
        },
        select: { id: true },
      });

  return (
    <AccountMenu
      hasProfessionalAccess={Boolean(professionalProfile)}
      isPlatformAdmin={platformAdmin}
      name={session.user.name}
    />
  );
}
