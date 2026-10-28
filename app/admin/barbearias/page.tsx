import { Suspense } from "react";
import { getAdminBarbershops } from "@/lib/admin-data";

export const metadata = {
  title: "Barbearias | Administração Navalha",
};

export default function AdminBarbershopsPage() {
  return (
    <Suspense fallback={<p className="auth-loading">Carregando barbearias...</p>}>
      <AdminBarbershopsContent />
    </Suspense>
  );
}

async function AdminBarbershopsContent() {
  const barbershops = await getAdminBarbershops();

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">CADASTROS DA PLATAFORMA</p>
          <h1>Barbearias</h1>
          <p>
            {barbershops.length}{" "}
            {barbershops.length === 1
              ? "barbearia cadastrada"
              : "barbearias cadastradas"}
            {barbershops.length === 100 ? " (limite da listagem)" : ""}.
          </p>
        </div>
      </div>

      <section aria-label="Lista de barbearias" className="admin-panel">
        {barbershops.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Barbearia</th>
                  <th scope="col">Proprietário</th>
                  <th scope="col">Equipe</th>
                  <th scope="col">Agendamentos</th>
                  <th scope="col">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {barbershops.map((shop) => {
                  const owner = shop.memberships[0]?.user;

                  return (
                    <tr key={shop.id}>
                      <th scope="row">
                        <span className="admin-table-primary">{shop.name}</span>
                        <span className="admin-table-secondary">
                          /{shop.slug}
                        </span>
                      </th>
                      <td>
                        {owner ? (
                          <>
                            <span className="admin-table-primary">
                              {owner.name}
                            </span>
                            <span className="admin-table-secondary">
                              {owner.email}
                            </span>
                          </>
                        ) : (
                          "Sem proprietário"
                        )}
                      </td>
                      <td>{shop._count.memberships}</td>
                      <td>{shop._count.bookings}</td>
                      <td>{formatDate(shop.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">Nenhuma barbearia cadastrada ainda.</p>
        )}
      </section>
      <p className="admin-notice">
        Esta listagem é somente para consulta. Ações de edição, suspensão e
        exclusão não estão disponíveis nesta etapa.
      </p>
    </>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}
