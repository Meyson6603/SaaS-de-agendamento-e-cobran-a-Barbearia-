import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import VerifyEmailForm from "./verify-email-form";

export const metadata: Metadata = {
  title: "Verificar e-mail | Navalha Barbearia",
  description: "Confirme o e-mail da sua conta Navalha.",
};

export default function VerifyEmailPage(props: PageProps<"/verificar-email">) {
  return (
    <Suspense fallback={<p className="auth-loading">Carregando acesso...</p>}>
      <VerifyEmailContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function VerifyEmailContent({
  searchParams,
}: {
  searchParams: PageProps<"/verificar-email">["searchParams"];
}) {
  const search = await searchParams;
  const email = typeof search.email === "string" ? search.email : "";
  const redirectTo =
    typeof search.redirectTo === "string" ? search.redirectTo : "/";
  const isVerified = search.verified === "true";
  const hasError = typeof search.error === "string";

  return (
    <main className="auth-page">
      <header className="site-header">
        <Link aria-label="Navalha, página inicial" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            N
          </span>
          <span>NAVALHA</span>
        </Link>
        <span className="header-caption">VERIFICAÇÃO DE E-MAIL</span>
      </header>

      <section aria-labelledby="verify-email-title" className="auth-card">
        <p className="eyebrow">ATIVAÇÃO DA CONTA</p>
        <h1 id="verify-email-title">
          {isVerified ? "E-mail confirmado" : "Confirme seu e-mail"}
        </h1>
        {isVerified ? (
          <>
            <p className="auth-description">
              Sua conta está pronta. Entre para continuar.
            </p>
            <Link className="auth-submit auth-submit-link" href="/login">
              Ir para o login
            </Link>
          </>
        ) : (
          <>
            <p className="auth-description">
              Enviamos um link de confirmação para{" "}
              <strong>{email || "seu e-mail"}</strong>. O link expira em 1 hora.
            </p>
            {hasError && (
              <p aria-live="polite" className="auth-error" role="alert">
                O link é inválido ou expirou. Solicite um novo link abaixo.
              </p>
            )}
            <VerifyEmailForm email={email} redirectTo={redirectTo} />
          </>
        )}
        <p className="auth-switch">
          <Link href="/login">Voltar para o login</Link>
        </p>
      </section>
    </main>
  );
}
