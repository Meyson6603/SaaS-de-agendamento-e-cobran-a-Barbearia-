import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth-session";
import EmailSignUpForm from "./email-sign-up-form";

export const metadata: Metadata = {
  title: "Criar conta | Navalha Barbearia",
  description: "Crie sua conta para acessar os serviços da Navalha Barbearia.",
};

export default function SignUpPage() {
  return (
    <Suspense fallback={<p className="auth-loading">Carregando cadastro...</p>}>
      <SignUpContent />
    </Suspense>
  );
}

async function SignUpContent() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-page">
      <header className="site-header">
        <Link aria-label="Navalha, página inicial" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            N
          </span>
          <span>NAVALHA</span>
        </Link>
        <span className="header-caption">NOVA CONTA</span>
      </header>

      <section aria-labelledby="signup-title" className="auth-card">
        <p className="eyebrow">SEJA BEM-VINDO</p>
        <h1 id="signup-title">Crie sua conta</h1>
        <p className="auth-description">
          Cadastre-se com seu nome, e-mail e uma senha.
        </p>

        <EmailSignUpForm />

        <p className="auth-switch">
          Já tem uma conta? <Link href="/login">Entre</Link>
        </p>
        <Link className="auth-back-link" href="/">
          Voltar para a página de agendamento
        </Link>
      </section>
    </main>
  );
}
