import Link from "next/link";
import SignOutButton from "../dashboard/sign-out-button";

export default function ManagerShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <main className="manager-page">
      <header className="site-header manager-header">
        <Link aria-label="Navalha, página inicial" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            N
          </span>
          <span>NAVALHA</span>
        </Link>
        <div className="manager-header-user">
          <span>{userName}</span>
          <SignOutButton />
        </div>
      </header>

      <div className="manager-content">{children}</div>
    </main>
  );
}
