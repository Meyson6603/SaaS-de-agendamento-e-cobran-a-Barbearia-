import { Suspense } from "react";
import ManagerShell from "./manager-shell";
import { requireSession } from "@/lib/auth-session";

export const instant = false;

export default function ManagerLayout({
  children,
}: LayoutProps<"/gerencia">) {
  return (
    <Suspense
      fallback={<p className="auth-loading">Verificando seu acesso...</p>}
    >
      <ProtectedManagerShell>{children}</ProtectedManagerShell>
    </Suspense>
  );
}

async function ProtectedManagerShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return <ManagerShell userName={session.user.name}>{children}</ManagerShell>;
}
