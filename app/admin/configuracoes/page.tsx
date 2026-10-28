import { Suspense } from "react";
import { getPlatformSettingsStatus } from "@/lib/admin-data";

export const metadata = {
  title: "Configurações | Administração Navalha",
};

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<p className="auth-loading">Carregando configurações...</p>}>
      <AdminSettingsContent />
    </Suspense>
  );
}

async function AdminSettingsContent() {
  const settings = await getPlatformSettingsStatus();

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">OPERAÇÃO</p>
          <h1>Configurações da plataforma</h1>
          <p>
            Confira o estado da configuração técnica sem expor credenciais.
          </p>
        </div>
      </div>

      <section
        aria-label="Estado das configurações"
        className="admin-settings-list"
      >
        <Setting label="URL de autenticação" value={settings.baseUrl} />
        <Setting
          label="Banco de dados"
          value={settings.databaseConfigured ? "Configurado" : "Não configurado"}
          configured={settings.databaseConfigured}
        />
        <Setting
          label="Login com Google"
          value={settings.googleConfigured ? "Configurado" : "Não configurado"}
          configured={settings.googleConfigured}
        />
        <Setting
          label="E-mails de administrador"
          value={
            settings.adminEmailsConfigured ? "Configurados" : "Não configurados"
          }
          configured={settings.adminEmailsConfigured}
        />
      </section>

      <p className="admin-notice">
        Segredos e parâmetros operacionais são configurados no ambiente de
        execução. Esta tela não exibe nem altera valores secretos.
      </p>
    </>
  );
}

function Setting({
  label,
  value,
  configured,
}: {
  label: string;
  value: string;
  configured?: boolean;
}) {
  return (
    <article className="admin-setting">
      <span>{label}</span>
      <strong
        className={
          configured === undefined
            ? undefined
            : configured
              ? "admin-setting-configured"
              : "admin-setting-missing"
        }
      >
        {value}
      </strong>
    </article>
  );
}
