import { Suspense } from "react";
import Link from "next/link";
import { getPlatformOverview } from "@/lib/admin-data";

export const metadata = {
  title: "Administração | Navalha",
  description: "Visão geral administrativa da plataforma Navalha.",
};

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="auth-loading">Carregando indicadores...</p>}>
      <AdminOverview />
    </Suspense>
  );
}

async function AdminOverview() {
  const { metrics, recentBarbershops, recentUsers } =
    await getPlatformOverview();
  const formattedRevenue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(metrics.paidRevenue));

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">VISÃO GERAL</p>
          <h1>Painel da plataforma</h1>
          <p>Acompanhe as contas e a atividade cadastradas no sistema.</p>
        </div>
      </div>

      <section aria-label="Indicadores da plataforma" className="admin-metrics">
        <Metric label="Usuários" value={metrics.users} />
        <Metric label="Barbearias" value={metrics.barbershops} />
        <Metric label="Membros de equipes" value={metrics.memberships} />
        <Metric label="Agendamentos" value={metrics.bookings} />
        <Metric label="Agendamentos hoje" value={metrics.todaysBookings} />
        <Metric label="Pagamentos de serviços" value={formattedRevenue} />
      </section>

      <section aria-labelledby="admin-shops-title" className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">CADASTROS RECENTES</p>
            <h2 id="admin-shops-title">Barbearias</h2>
          </div>
          <Link href="/admin/barbearias">Ver todas</Link>
        </div>
        {recentBarbershops.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Identificador</th>
                  <th scope="col">Equipe</th>
                  <th scope="col">Agendamentos</th>
                </tr>
              </thead>
              <tbody>
                {recentBarbershops.map((shop) => (
                  <tr key={shop.id}>
                    <th scope="row">{shop.name}</th>
                    <td>{shop.slug}</td>
                    <td>{shop._count.memberships}</td>
                    <td>{shop._count.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">Nenhuma barbearia cadastrada ainda.</p>
        )}
      </section>

      <section aria-labelledby="admin-users-title" className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">CONTAS RECENTES</p>
            <h2 id="admin-users-title">Usuários</h2>
          </div>
          <Link href="/admin/usuarios">Ver todos</Link>
        </div>
        {recentUsers.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">Verificado</th>
                  <th scope="col">Agendamentos</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id}>
                    <th scope="row">{user.name}</th>
                    <td>{user.email}</td>
                    <td>{user.emailVerified ? "Sim" : "Não"}</td>
                    <td>{user._count.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">Nenhum usuário cadastrado ainda.</p>
        )}
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="admin-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
