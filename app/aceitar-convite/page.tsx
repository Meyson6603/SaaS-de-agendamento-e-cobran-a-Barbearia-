import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AcceptInvitationForm from "./accept-invitation-form";
import { prisma } from "@/lib/prisma";
import { hashInvitationToken } from "@/lib/shop-invitations";

export const metadata: Metadata = {
  title: "Aceitar convite | Navalha Barbearia",
  description: "Aceite seu convite para fazer parte da equipe.",
};

export default function AcceptInvitationPage(
  props: PageProps<"/aceitar-convite">,
) {
  return (
    <Suspense fallback={<p className="auth-loading">Carregando convite...</p>}>
      <AcceptInvitationContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function AcceptInvitationContent({
  searchParams,
}: {
  searchParams: PageProps<"/aceitar-convite">["searchParams"];
}) {
  const search = await searchParams;
  const token = typeof search.token === "string" ? search.token : "";
  const invitation = token
    ? await prisma.shopInvitation.findUnique({
        where: { tokenHash: hashInvitationToken(token) },
        select: {
          email: true,
          role: true,
          displayName: true,
          expiresAt: true,
          acceptedAt: true,
          cancelledAt: true,
          shop: { select: { name: true } },
        },
      })
    : null;
  const isValid = Boolean(
    invitation &&
      !invitation.acceptedAt &&
      !invitation.cancelledAt &&
      invitation.expiresAt > new Date(),
  );

  return (
    <main className="auth-page">
      <header className="site-header">
        <Link aria-label="Navalha, página inicial" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">N</span>
          <span>NAVALHA</span>
        </Link>
        <span className="header-caption">CONVITE DA EQUIPE</span>
      </header>
      <section aria-labelledby="invitation-title" className="auth-card">
        <p className="eyebrow">ACESSO À EQUIPE</p>
        <h1 id="invitation-title">
          {isValid ? "Você recebeu um convite" : "Convite indisponível"}
        </h1>
        {isValid && invitation ? (
          <>
            <p className="auth-description">
              <strong>{invitation.shop.name}</strong> convidou{" "}
              <strong>{invitation.email}</strong> para atuar como{" "}
              {invitation.role === "MANAGER"
                ? "gerente"
                : `profissional${invitation.displayName ? ` (${invitation.displayName})` : ""}`}
              .
            </p>
            <AcceptInvitationForm email={invitation.email} token={token} />
          </>
        ) : (
          <p className="auth-description">
            Este convite é inválido, já foi utilizado ou expirou.
          </p>
        )}
        <p className="auth-switch">
          <Link href="/login">Entrar em outra conta</Link>
        </p>
      </section>
    </main>
  );
}
