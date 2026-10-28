import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import PublicAccountMenu from "@/app/_components/public-account-menu";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function Home() {
  const shops = await prisma.barbershop.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  if (shops.length === 1) {
    redirect(`/${shops[0].slug}`);
  }

  return (
    <main className="booking-page">
      <header className="site-header">
        <Link aria-label="Navalha, página inicial" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">N</span>
          <span>NAVALHA</span>
        </Link>
        <Suspense fallback={<Link className="header-account-link" href="/login">Entrar</Link>}>
          <PublicAccountMenu />
        </Suspense>
      </header>

      <div className="booking-content shop-directory">
        <section className="booking-heading">
          <div>
            <p className="eyebrow">AGENDE SEU PRÓXIMO ATENDIMENTO</p>
            <h1>Encontre sua barbearia</h1>
            <p className="section-description">
              Escolha uma barbearia para consultar serviços e horários reais.
            </p>
          </div>
        </section>

        {shops.length ? (
          <div className="shop-directory-list">
            {shops.map((shop) => (
              <Link
                className="shop-directory-card"
                href={`/${shop.slug}`}
                key={shop.id}
              >
                <span aria-hidden="true" className="shop-monogram">N.</span>
                <span>
                  <strong>{shop.name}</strong>
                  <span>Ver serviços e horários disponíveis</span>
                </span>
                <span aria-hidden="true" className="shop-directory-arrow">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <section className="shop-directory-empty">
            <h2>Nenhuma barbearia disponível ainda</h2>
            <p>
              Assim que uma barbearia for cadastrada e configurar seus serviços
              e horários, o link de agendamento aparecerá aqui.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
