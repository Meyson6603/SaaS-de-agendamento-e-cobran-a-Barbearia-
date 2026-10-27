import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import SignOutButton from "./sign-out-button";
import { requireSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import EditProfileForm from "./edit-profile-form";

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
  const now = new Date();
  const [upcomingBookings, bookingHistory, payments] = await Promise.all([
    prisma.booking.findMany({
      where: {
        customerId: session.user.id,
        startsAt: { gte: now },
        status: "CONFIRMED",
      },
      orderBy: { startsAt: "asc" },
      include: {
        shop: { select: { name: true } },
        professional: { select: { displayName: true } },
      },
    }),
    prisma.booking.findMany({
      where: {
        customerId: session.user.id,
        startsAt: { lt: now },
        status: "COMPLETED",
      },
      orderBy: { startsAt: "desc" },
      include: {
        shop: { select: { name: true } },
        professional: { select: { displayName: true } },
      },
    }),
    prisma.payment.findMany({
      where: { booking: { customerId: session.user.id } },
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            serviceNameSnapshot: true,
            startsAt: true,
            shop: { select: { name: true } },
          },
        },
      },
    }),
  ]);

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

      <div className="customer-dashboard">
        <section aria-labelledby="dashboard-title" className="dashboard-welcome">
          <p className="eyebrow">SUA CONTA</p>
          <h1 id="dashboard-title">Olá, {session.user.name}</h1>
          <p>{session.user.email}</p>
          <Link className="dashboard-book-link" href="/">
            Ver serviços e horários
          </Link>
        </section>

        <section
          aria-labelledby="profile-title"
          className="dashboard-section"
          id="perfil"
        >
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">DADOS DA CONTA</p>
              <h2 id="profile-title">Meu perfil</h2>
            </div>
          </div>
          <EditProfileForm name={session.user.name} />
        </section>

        <section
          aria-labelledby="upcoming-title"
          className="dashboard-section"
          id="agenda"
        >
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">SUA AGENDA</p>
              <h2 id="upcoming-title">Próximos horários</h2>
            </div>
          </div>
          {upcomingBookings.length ? (
            <div className="account-record-list">
              {upcomingBookings.map((booking) => (
                <article className="account-record" key={booking.id}>
                  <div>
                    <strong>{booking.serviceNameSnapshot}</strong>
                    <span>{booking.shop.name}</span>
                    <span>Com {booking.professional.displayName}</span>
                  </div>
                  <time dateTime={booking.startsAt.toISOString()}>
                    {formatBookingDate(booking.startsAt)}
                  </time>
                </article>
              ))}
            </div>
          ) : (
            <p className="account-empty-state">
              Você ainda não tem horários agendados. Quando confirmar um
              agendamento, ele aparecerá aqui.
            </p>
          )}
        </section>

        <section
          aria-labelledby="history-title"
          className="dashboard-section"
          id="historico"
        >
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">ATENDIMENTOS CONCLUÍDOS</p>
              <h2 id="history-title">Histórico de cortes</h2>
            </div>
          </div>
          {bookingHistory.length ? (
            <div className="account-record-list">
              {bookingHistory.map((booking) => (
                <article className="account-record" key={booking.id}>
                  <div>
                    <strong>{booking.serviceNameSnapshot}</strong>
                    <span>{booking.shop.name}</span>
                    <span>Com {booking.professional.displayName}</span>
                  </div>
                  <time dateTime={booking.startsAt.toISOString()}>
                    {formatBookingDate(booking.startsAt)}
                  </time>
                </article>
              ))}
            </div>
          ) : (
            <p className="account-empty-state">
              Seus atendimentos concluídos aparecerão aqui.
            </p>
          )}
        </section>

        <section
          aria-labelledby="payments-title"
          className="dashboard-section"
          id="pagamentos"
        >
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">ACOMPANHAMENTO</p>
              <h2 id="payments-title">Pagamentos</h2>
            </div>
          </div>
          {payments.length ? (
            <div className="account-record-list">
              {payments.map((payment) => (
                <article className="account-record" key={payment.id}>
                  <div>
                    <strong>{payment.booking.serviceNameSnapshot}</strong>
                    <span>{payment.booking.shop.name}</span>
                    <span>{paymentStatusLabel(payment.status)}</span>
                  </div>
                  <span className="account-record-amount">
                    {formatCurrency(Number(payment.amount))}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <p className="account-empty-state">
              Seus pagamentos aparecerão aqui quando houver agendamentos
              registrados.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function formatBookingDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

function paymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendente",
    PAID: "Pago",
    FAILED: "Não concluído",
    REFUNDED: "Estornado",
  };

  return labels[status] ?? "Status indisponível";
}
