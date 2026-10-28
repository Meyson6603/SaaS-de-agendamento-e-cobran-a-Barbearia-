import { Suspense } from "react";
import AdminShell from "./admin-shell";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export default function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  return (
    <Suspense
      fallback={<p className="auth-loading">Verificando acesso administrativo...</p>}
    >
      <ProtectedAdminShell>{children}</ProtectedAdminShell>
    </Suspense>
  );
}

async function ProtectedAdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requirePlatformAdmin();

  return <AdminShell adminName={admin.name}>{children}</AdminShell>;
}
