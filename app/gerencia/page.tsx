import { Suspense } from "react";
import Link from "next/link";
import BookingSetupForms from "./booking-setup-forms";
import ManagerTeamForm from "./manager-team-form";
import { getManagerDashboard } from "@/lib/manager-data";

export const metadata = {
  title: "Painel da barbearia | Navalha",
  description: "Gerencie a operação da sua barbearia.",
};

export default function ManagerPage(props: PageProps<"/gerencia">) {
  return (
    <Suspense
      fallback={<p className="auth-loading">Carregando painel da barbearia...</p>}
    >
      <ManagerDashboard searchParams={props.searchParams} />
    </Suspense>
  );
}

async function ManagerDashboard({
  searchParams: searchParamsPromise,
}: {
  searchParams: PageProps<"/gerencia">["searchParams"];
}) {
  const searchParams = await searchParamsPromise;
  const shopId =
    typeof searchParams.shop === "string" ? searchParams.shop : undefined;

  const dashboard = await getManagerDashboard(shopId);

  if (!dashboard.selectedShop || !dashboard.metrics) {
    return (
      <section className="manager-access-pending">
        <p className="eyebrow">
          {dashboard.isPlatformAdmin ? "ADMINISTRAÇÃO DA PLATAFORMA" : "ACESSO À BARBEARIA"}
        </p>
        <h1>
          {dashboard.isPlatformAdmin
            ? "Ainda não há barbearias cadastradas"
            : "Seu acesso de gestão ainda não foi configurado"}
        </h1>
        <p>
          {dashboard.isPlatformAdmin
            ? "Cadastre uma barbearia para começar a acompanhar e gerenciar a operação por aqui."
            : "O administrador da plataforma precisa cadastrar a barbearia e vincular sua conta como proprietário. Se você já deveria ter acesso, confirme com o administrador que ele usou o mesmo e-mail da sua conta."}
        </p>
        <Link
          className="submit-booking manager-return-link"
          href={dashboard.isPlatformAdmin ? "/admin/barbearias" : "/"}
        >
          {dashboard.isPlatformAdmin
            ? "Cadastrar barbearia"
            : "Voltar para a página inicial"}
        </Link>
      </section>
    );
  }

  const {
    isPlatformAdmin,
    selectedShop,
    metrics,
    shops,
    upcomingBookings,
    managers,
    professionals,
    services,
    weeklyAvailability,
    availabilityBlocks,
  } = dashboard;
  const formattedRevenue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(metrics.paidRevenue));
  const isPublicBookingConfigured =
    metrics.professionals > 0 && metrics.services > 0 && weeklyAvailability.length > 0;

  return (
    <>
      <div className="manager-page-heading">
        <div>
          <p className="eyebrow">
            {isPlatformAdmin
              ? "ADMINISTRAÇÃO DA PLATAFORMA"
              : `PAINEL ${selectedShop.role === "OWNER" ? "DO PROPRIETÁRIO" : "DO GERENTE"}`}
          </p>
          <h1>{selectedShop.name}</h1>
          <p>
            {isPlatformAdmin
              ? "Acompanhe e gerencie a operação desta barbearia."
              : "Gerencie a operação da sua barbearia em um só lugar."}
          </p>
        </div>
        <span className="manager-shop-slug">/{selectedShop.slug}</span>
      </div>

      {shops.length > 1 && (
        <nav aria-label="Suas barbearias" className="manager-shop-switcher">
          <span>{isPlatformAdmin ? "Todas as barbearias:" : "Suas barbearias:"}</span>
          {shops.map((shop) => (
            <Link
              aria-current={shop.id === selectedShop.id ? "page" : undefined}
              href={`/gerencia?shop=${encodeURIComponent(shop.id)}`}
              key={shop.id}
            >
              {shop.name}
            </Link>
          ))}
        </nav>
      )}

      <section aria-label="Indicadores da barbearia" className="manager-metrics">
        <ManagerMetric label="Profissionais ativos" value={metrics.professionals} />
        <ManagerMetric label="Serviços ativos" value={metrics.services} />
        <ManagerMetric label="Agendamentos totais" value={metrics.bookings} />
        <ManagerMetric label="Confirmados hoje" value={metrics.todaysBookings} />
        <ManagerMetric label="Pagamentos recebidos" value={formattedRevenue} />
      </section>

      <BookingSetupForms
        shopId={selectedShop.id}
        professionals={professionals}
        services={services}
        weeklyAvailability={weeklyAvailability}
        availabilityBlocks={availabilityBlocks}
        timezone={selectedShop.timezone}
      />

      <section aria-labelledby="manager-bookings-title" className="manager-panel">
        <div className="manager-panel-heading">
          <div>
            <p className="eyebrow">AGENDA</p>
            <h2 id="manager-bookings-title">Próximos atendimentos</h2>
          </div>
          <span>Até 5 próximos</span>
        </div>
        {upcomingBookings.length ? (
          <div className="manager-booking-list">
            {upcomingBookings.map((booking) => (
              <article className="manager-booking" key={booking.id}>
                <time dateTime={booking.startsAt.toISOString()}>
                  {formatBookingDate(booking.startsAt)}
                </time>
                <div>
                  <strong>{booking.serviceNameSnapshot}</strong>
                  <span>{booking.customer.name}</span>
                  <span>Com {booking.professional.displayName}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="manager-empty">
            Ainda não há atendimentos confirmados para os próximos horários.
          </p>
        )}
      </section>

      <section aria-labelledby="manager-next-steps-title" className="manager-next-steps">
        <div>
          <p className="eyebrow">AGENDA PÚBLICA</p>
          <h2 id="manager-next-steps-title">Compartilhe seu link</h2>
          <p>
            Compartilhe o link público da barbearia para que os clientes
            consultem os serviços e horários disponíveis.
          </p>
        </div>
        <dl>
          <div>
            <dt>Link público</dt>
            <dd>
              <Link href={`/${selectedShop.slug}`}>/{selectedShop.slug}</Link>
            </dd>
          </div>
          <div>
            <dt>Configuração</dt>
            <dd>{isPublicBookingConfigured ? "Pronta" : "Pendente"}</dd>
          </div>
        </dl>
      </section>

      {(selectedShop.role === "OWNER" || isPlatformAdmin) && (
        <section
          aria-labelledby="manager-team-title"
          className="manager-panel manager-team-panel"
        >
          <div className="manager-panel-heading">
            <div>
              <p className="eyebrow">
                {isPlatformAdmin ? "ACESSOS DA BARBEARIA" : "ACESSOS"}
              </p>
              <h2 id="manager-team-title">Gerentes da barbearia</h2>
            </div>
          </div>
          {managers.length ? (
            <ul className="manager-team-list">
              {managers.map((manager) => (
                <li key={manager.id}>
                  <span>{manager.name}</span>
                  <span>{manager.email}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="manager-empty">Nenhum gerente adicional cadastrado.</p>
          )}
          <ManagerTeamForm shopId={selectedShop.id} />
        </section>
      )}
    </>
  );
}

function ManagerMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article className="manager-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function formatBookingDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}
