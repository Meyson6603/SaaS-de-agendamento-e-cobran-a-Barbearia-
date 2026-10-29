import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar senha | Navalha Barbearia",
  description: "Solicite um link para redefinir a senha da sua conta.",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<p className="auth-loading">Carregando acesso...</p>}>
      <main className="auth-page">
        <header className="site-header">
          <Link aria-label="Navalha, página inicial" className="brand" href="/">
            <span aria-hidden="true" className="brand-mark">
              N
            </span>
            <span>NAVALHA</span>
          </Link>
          <span className="header-caption">RECUPERAÇÃO DE ACESSO</span>
        </header>

        <section aria-labelledby="forgot-password-title" className="auth-card">
          <p className="eyebrow">ACESSO À CONTA</p>
          <h1 id="forgot-password-title">Esqueceu sua senha?</h1>
          <p className="auth-description">
            Informe seu e-mail e enviaremos um link para criar uma nova senha.
          </p>
          <ForgotPasswordForm />
          <p className="auth-switch">
            Lembrou da senha? <Link href="/login">Voltar para o login</Link>
          </p>
        </section>
      </main>
    </Suspense>
  );
}
