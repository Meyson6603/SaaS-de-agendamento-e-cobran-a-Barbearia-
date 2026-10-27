import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import SignOutButton from "./sign-out-button";
import { requireSession } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Painel | Navalha Barbearia",
  description: "Área autenticada da plataforma de agendamentos.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="auth-loading">Carregando seu painel...</p>}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const session = await requireSession();

  return (
    <main className="auth-page">
      <header className="site-header">
        <Link aria-label="Navalha, página inicial" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            N
          </span>
          <span>NAVALHA</span>
        </Link>
        <SignOutButton />
      </header>

      <section aria-labelledby="dashboard-title" className="auth-card">
        <p className="eyebrow">CONTA CONECTADA</p>
        <h1 id="dashboard-title">Olá, {session.user.name}</h1>
        <p className="auth-description">
          Você entrou com {session.user.email}. O acesso seguro está funcionando.
        </p>
        <p className="auth-setup-notice">
          O painel da barbearia e a agenda pessoal serão construídos nas próximas
          etapas.
        </p>
        <Link className="auth-back-link" href="/">
          Ir para o agendamento demonstrativo
        </Link>
      </section>
    </main>
  );
}
