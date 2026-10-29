import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ResetPasswordForm from "./reset-password-form";

export const metadata: Metadata = {
  title: "Redefinir senha | Navalha Barbearia",
  description: "Crie uma nova senha para acessar sua conta.",
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/redefinir-senha">) {
  return (
    <Suspense fallback={<p className="auth-loading">Carregando acesso...</p>}>
      <ResetPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ResetPasswordContent({
  searchParams,
}: {
  searchParams: PageProps<"/redefinir-senha">["searchParams"];
}) {
  const search = await searchParams;
  const token = typeof search.token === "string" ? search.token : null;
  const hasInvalidToken = search.error === "INVALID_TOKEN";

  return (
    <main className="auth-page">
      <header className="site-header">
        <Link aria-label="Navalha, página inicial" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            N
          </span>
          <span>NAVALHA</span>
        </Link>
        <span className="header-caption">NOVA SENHA</span>
      </header>

      <section aria-labelledby="reset-password-title" className="auth-card">
        <p className="eyebrow">ACESSO À CONTA</p>
        <h1 id="reset-password-title">Crie uma nova senha</h1>
        {token && !hasInvalidToken ? (
          <>
            <p className="auth-description">
              Escolha uma senha com entre 8 e 128 caracteres.
            </p>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <>
            <p className="auth-description">
              Este link é inválido ou expirou. Solicite uma nova redefinição.
            </p>
            <Link className="auth-submit auth-submit-link" href="/recuperar-senha">
              Solicitar novo link
            </Link>
          </>
        )}
        <p className="auth-switch">
          <Link href="/login">Voltar para o login</Link>
        </p>
      </section>
    </main>
  );
}
