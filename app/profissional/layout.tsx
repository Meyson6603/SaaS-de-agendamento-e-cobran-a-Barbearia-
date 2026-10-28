import { Suspense } from "react";
import ManagerShell from "@/app/gerencia/manager-shell";
import { requireSession } from "@/lib/auth-session";

export const instant = false;

export default function ProfessionalLayout({
  children,
}: LayoutProps<"/profissional">) {
  return (
    <Suspense
      fallback={<p className="auth-loading">Verificando seu acesso...</p>}
    >
      <ProtectedProfessionalShell>{children}</ProtectedProfessionalShell>
    </Suspense>
  );
}

async function ProtectedProfessionalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return <ManagerShell userName={session.user.name}>{children}</ManagerShell>;
}
