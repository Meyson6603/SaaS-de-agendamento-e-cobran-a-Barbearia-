import Link from "next/link";
import SignOutButton from "../dashboard/sign-out-button";

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/barbearias", label: "Barbearias" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export default function AdminShell({
  adminName,
  children,
}: {
  adminName: string;
  children: React.ReactNode;
}) {
  return (
    <main className="admin-page">
      <header className="site-header admin-header">
        <Link aria-label="Navalha, página inicial" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            N
          </span>
          <span>NAVALHA</span>
        </Link>
        <div className="admin-header-user">
          <span>{adminName}</span>
          <SignOutButton />
        </div>
      </header>

      <div className="admin-layout">
        <aside aria-label="Navegação administrativa" className="admin-sidebar">
          <p className="eyebrow">ADMINISTRAÇÃO DA PLATAFORMA</p>
          <nav className="admin-nav">
            {navigation.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <Link className="admin-public-link" href="/">
            Ver página pública
          </Link>
        </aside>
        <div className="admin-main">{children}</div>
      </div>
    </main>
  );
}
