import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth-session";
import { getSafeRedirectTo } from "@/lib/redirect-url";
import EmailSignInForm from "./email-sign-in-form";
import GoogleSignInButton from "./sign-in-button";

export const metadata: Metadata = {
  title: "Entrar | Navalha Barbearia",
  description: "Entre na sua conta para acessar o sistema de agendamentos.",
};

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <Suspense fallback={<p className="auth-loading">Carregando acesso...</p>}>
      <LoginContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const search = await searchParams;
  const redirectTo = getSafeRedirectTo(search.redirectTo);
  const session = await getSession();

  if (session) {
    redirect(redirectTo);
  }

  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <main className="auth-page">
      <header className="site-header">
        <Link aria-label="Navalha, página inicial" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            N
          </span>
          <span>NAVALHA</span>
        </Link>
        <span className="header-caption">ACESSO À CONTA</span>
      </header>

      <section aria-labelledby="login-title" className="auth-card">
        <p className="eyebrow">BEM-VINDO DE VOLTA</p>
        <h1 id="login-title">Entre na sua conta</h1>
        <p className="auth-description">
          Acesse sua agenda e acompanhe seus agendamentos.
        </p>

        <EmailSignInForm redirectTo={redirectTo} />

        <div aria-hidden="true" className="auth-divider auth-divider-social">
          <span>ou entre com Google</span>
        </div>

        <GoogleSignInButton enabled={googleConfigured} redirectTo={redirectTo} />

        {!googleConfigured && (
          <p className="auth-setup-notice">
            O login com Google ainda precisa ser configurado pelo administrador
            do sistema.
          </p>
        )}

        <p className="auth-switch">
          Ainda não tem conta?{" "}
          <Link href={`/cadastro?redirectTo=${encodeURIComponent(redirectTo)}`}>
            Cadastre-se
          </Link>
        </p>

        <Link className="auth-back-link" href="/">
          Voltar para a página de agendamento
        </Link>
      </section>
    </main>
  );
}
