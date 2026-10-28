import { Suspense } from "react";
import { getAdminUsers } from "@/lib/admin-data";

export const metadata = {
  title: "Usuários | Administração Navalha",
};

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<p className="auth-loading">Carregando usuários...</p>}>
      <AdminUsersContent />
    </Suspense>
  );
}

async function AdminUsersContent() {
  const users = await getAdminUsers();

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">CONTAS DA PLATAFORMA</p>
          <h1>Usuários</h1>
          <p>
            {users.length} {users.length === 1 ? "conta listada" : "contas listadas"}
            {users.length === 100 ? " (limite da listagem)" : ""}.
          </p>
        </div>
      </div>

      <section aria-label="Lista de usuários" className="admin-panel">
        {users.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Usuário</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">Verificação</th>
                  <th scope="col">Barbearias</th>
                  <th scope="col">Agendamentos</th>
                  <th scope="col">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <th scope="row">{user.name}</th>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`admin-status${user.emailVerified ? " admin-status-ok" : " admin-status-pending"}`}
                      >
                        {user.emailVerified ? "Verificado" : "Pendente"}
                      </span>
                    </td>
                    <td>{user._count.memberships}</td>
                    <td>{user._count.bookings}</td>
                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">Nenhum usuário cadastrado ainda.</p>
        )}
      </section>
      <p className="admin-notice">
        Por segurança, esta página não permite alterar contas ou redefinir
        credenciais.
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
