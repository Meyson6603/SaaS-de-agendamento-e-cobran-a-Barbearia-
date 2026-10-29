import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { formatBrazilianPhone } from "@/lib/brazilian-phone";
import { getProfessionalDashboard } from "@/lib/professional-data";
import PaymentManagementActions from "@/app/_components/payment-management-actions";

export const metadata: Metadata = {
  title: "Minha agenda | Navalha",
  description: "Consulte seus próximos atendimentos.",
};

export default function ProfessionalPage(
  props: PageProps<"/profissional">,
) {
  return (
    <Suspense fallback={<p className="auth-loading">Carregando sua agenda...</p>}>
      <ProfessionalDashboard searchParams={props.searchParams} />
    </Suspense>
  );
}

async function ProfessionalDashboard({
  searchParams: searchParamsPromise,
}: {
  searchParams: PageProps<"/profissional">["searchParams"];
}) {
  const searchParams = await searchParamsPromise;
  const pageParam = searchParams.page;
  const requestedPage =
    typeof pageParam === "string" && /^\d+$/.test(pageParam)
      ? Number(pageParam)
      : 1;
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
  const requestedProfessionalId =
    typeof searchParams.professional === "string"
      ? searchParams.professional
      : undefined;
  const dashboard = await getProfessionalDashboard(
    page,
    requestedProfessionalId,
  );

  if (dashboard.professionals.length === 0) {
    return (
      <section className="manager-access-pending">
        <p className="eyebrow">
          {dashboard.isPlatformAdmin
            ? "ADMINISTRAÇÃO DA PLATAFORMA"
            : "ÁREA DO PROFISSIONAL"}
        </p>
        <h1>
          {dashboard.isPlatformAdmin
            ? "Nenhum perfil profissional cadastrado"
            : "Seu acesso profissional ainda não foi configurado"}
        </h1>
        <p>
          {dashboard.isPlatformAdmin
            ? "Ainda não há perfis profissionais cadastrados nas barbearias."
            : "Peça ao proprietário ou gerente da barbearia para vincular sua conta como profissional. Depois disso, seus próximos atendimentos aparecerão aqui."}
        </p>
        <Link
          className="submit-booking manager-return-link"
          href={dashboard.isPlatformAdmin ? "/gerencia" : "/"}
        >
          {dashboard.isPlatformAdmin
            ? "Ir para gestão das barbearias"
            : "Voltar para a página inicial"}
        </Link>
      </section>
    );
  }

  return (
    <>
      <div className="manager-page-heading">
        <div>
          <p className="eyebrow">
            {dashboard.isPlatformAdmin
              ? "ADMINISTRAÇÃO DA PLATAFORMA"
              : "ÁREA DO PROFISSIONAL"}
          </p>
          <h1>{dashboard.isPlatformAdmin ? "Agenda profissional" : "Minha agenda"}</h1>
          <p>
            {dashboard.isPlatformAdmin
              ? "Consulte a agenda de qualquer profissional cadastrado."
              : "Consulte seus próximos atendimentos e os dados dos clientes."}
          </p>
        </div>
      </div>

      {dashboard.isPlatformAdmin && (
        <form action="/profissional" className="professional-filter">
          <div className="manager-form-field">
            <label htmlFor="professional-filter">Profissional e barbearia</label>
            <select
              defaultValue={dashboard.selectedProfessionalId ?? ""}
              id="professional-filter"
              name="professional"
            >
              {dashboard.professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.displayName} — {professional.shop.name}
                </option>
              ))}
            </select>
          </div>
          <button className="auth-submit" type="submit">
            Ver agenda
          </button>
        </form>
      )}

      <section aria-label="Resumo da agenda" className="manager-metrics">
        <ProfessionalMetric
          label="Atendimentos ativos ou próximos"
          value={dashboard.upcomingBookingsCount}
        />
        <ProfessionalMetric
          label="Barbearias"
          value={new Set(dashboard.professionals.map(({ shopId }) => shopId)).size}
        />
        <ProfessionalMetric
          label={dashboard.isPlatformAdmin ? "Perfis profissionais" : "Seus perfis"}
          value={dashboard.professionals.length}
        />
      </section>

      <section
        aria-labelledby="professional-bookings-title"
        className="manager-panel"
      >
        <div className="manager-panel-heading">
          <div>
            <p className="eyebrow">AGENDA CONFIRMADA</p>
            <h2 id="professional-bookings-title">
              Atendimentos em andamento ou próximos
            </h2>
          </div>
          <span>
            {dashboard.upcomingBookingsCount
              ? `Página ${dashboard.currentPage} de ${dashboard.totalPages}`
              : "Nenhum horário próximo"}
          </span>
        </div>

        {dashboard.upcomingBookings.length ? (
          <div className="professional-booking-list">
            {dashboard.upcomingBookings.map((booking) => (
              <article className="professional-booking" key={booking.id}>
                <time
                  dateTime={booking.startsAt.toISOString()}
                  className="professional-booking-time"
                >
                  {formatBookingDate(
                    booking.startsAt,
                    booking.professional.shop.timezone,
                  )}
                  <span>
                    Até{" "}
                    {new Intl.DateTimeFormat("pt-BR", {
                      timeStyle: "short",
                      timeZone: booking.professional.shop.timezone,
                    }).format(booking.endsAt)}
                  </span>
                </time>
                <div className="professional-booking-details">
                  <strong>{booking.customer.name}</strong>
                  <span>{booking.serviceNameSnapshot}</span>
                  <span>{booking.professional.shop.name}</span>
                  {booking.customer.phone && (
                    <a href={`tel:${booking.customer.phone}`}>
                      {formatBrazilianPhone(booking.customer.phone)}
                    </a>
                  )}
                  {booking.customerNote && (
                    <p className="professional-booking-note">
                      Observação: {booking.customerNote}
                    </p>
                  )}
                  <PaymentManagementActions
                    bookingId={booking.id}
                    paymentMethod={booking.payment?.method ?? null}
                    paymentStatus={booking.payment?.status ?? "PENDING"}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="manager-empty">
            Você não tem atendimentos confirmados em andamento ou próximos.
            Quando houver agendamentos, eles aparecerão aqui.
          </p>
        )}

        {dashboard.totalPages > 1 && (
          <nav aria-label="Paginação da agenda" className="professional-pagination">
            {dashboard.currentPage > 1 ? (
              <Link
                href={professionalPageHref(
                  dashboard.currentPage - 1,
                  dashboard.selectedProfessionalId,
                )}
              >
                Anteriores
              </Link>
            ) : (
              <span aria-disabled="true">Anteriores</span>
            )}
            {dashboard.currentPage < dashboard.totalPages ? (
              <Link
                href={professionalPageHref(
                  dashboard.currentPage + 1,
                  dashboard.selectedProfessionalId,
                )}
              >
                Próximos
              </Link>
            ) : (
              <span aria-disabled="true">Próximos</span>
            )}
          </nav>
        )}
      </section>
    </>
  );
}

function professionalPageHref(page: number, professionalId: string | null) {
  const params = new URLSearchParams({ page: String(page) });
  if (professionalId) params.set("professional", professionalId);
  return `/profissional?${params.toString()}`;
}

function ProfessionalMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="manager-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function formatBookingDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date);
}
