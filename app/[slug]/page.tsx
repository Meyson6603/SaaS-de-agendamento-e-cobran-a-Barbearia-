import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicAccountMenu from "@/app/_components/public-account-menu";
import ServicePicker, { type Service } from "@/app/_components/service-picker";
import { getBookingDates } from "@/lib/booking-availability";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export const instant = false;

export const metadata = {
  title: "Agendamento online | Navalha",
  description: "Consulte serviços e horários disponíveis na sua barbearia.",
};

export default async function PublicBarbershopPage({
  params,
  searchParams,
}: PageProps<"/[slug]">) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const shop = await prisma.barbershop.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      timezone: true,
      services: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          durationMinutes: true,
          price: true,
          professionals: {
            where: { professional: { isActive: true } },
            orderBy: { professional: { displayName: "asc" } },
            select: {
              professional: { select: { id: true, displayName: true } },
            },
          },
        },
      },
    },
  });

  if (!shop) {
    notFound();
  }

  const services: Service[] = shop.services
    .map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description ?? "",
      duration: service.durationMinutes,
      price: Number(service.price),
      category: "SERVIÇO",
      professionals: service.professionals.map(({ professional }) => professional),
    }))
    .filter((service) => service.professionals.length > 0);
  const dates = getBookingDates(shop.timezone);
  const requestedServiceId =
    typeof search.service === "string" ? search.service : null;
  const requestedProfessionalId =
    typeof search.professional === "string" ? search.professional : null;
  const requestedService = services.find(({ id }) => id === requestedServiceId);
  const requestedProfessional = requestedService?.professionals.find(
    ({ id }) => id === requestedProfessionalId,
  );
  const initialSelection =
    requestedService &&
    requestedProfessional &&
    typeof search.date === "string" &&
    dates.some(({ value }) => value === search.date) &&
    typeof search.time === "string" &&
    /^([01]\d|2[0-3]):([0-5]\d)$/.test(search.time)
      ? {
          serviceId: requestedService.id,
          professionalId: requestedProfessional.id,
          date: search.date,
          time: search.time,
        }
      : null;

  return (
    <main className="booking-page">
      <header className="site-header">
        <Link aria-label="Navalha, página inicial" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">N</span>
          <span>NAVALHA</span>
        </Link>
        <div className="header-actions">
          <span className="header-caption">AGENDAMENTO ONLINE</span>
          <Suspense fallback={<Link className="header-account-link" href="/login">Entrar</Link>}>
            <PublicAccountMenu />
          </Suspense>
        </div>
      </header>

      <div className="booking-content">
        <section aria-labelledby="shop-name" className="shop-card">
          <div className="shop-monogram" aria-hidden="true">N.</div>
          <div className="shop-details">
            <p className="eyebrow">AGENDE SEU ATENDIMENTO</p>
            <h1 id="shop-name">{shop.name}</h1>
            <p className="shop-address">Horários exibidos no fuso local da barbearia</p>
          </div>
          <span className="open-status">
            <span aria-hidden="true" className="status-dot" />
            Agendamento online
          </span>
        </section>

        <section aria-labelledby="booking-title" className="booking-section">
          <Suspense fallback={<p className="auth-loading">Carregando serviços...</p>}>
            <AuthenticatedServicePicker
              dates={dates}
              initialSelection={initialSelection}
              services={services}
              shopSlug={slug}
              timezone={shop.timezone}
            />
          </Suspense>
        </section>

        <footer className="page-footer">
          <span>Feito para cuidar bem do seu tempo.</span>
          <span>Seus dados são usados apenas para o agendamento.</span>
        </footer>
      </div>
    </main>
  );
}

async function AuthenticatedServicePicker({
  dates,
  initialSelection,
  services,
  shopSlug,
  timezone,
}: {
  dates: ReturnType<typeof getBookingDates>;
  initialSelection: {
    serviceId: string;
    professionalId: string;
    date: string;
    time: string;
  } | null;
  services: Service[];
  shopSlug: string;
  timezone: string;
}) {
  const session = await getSession();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { phone: true },
      })
    : null;

  if (session && !user) {
    throw new Error("The authenticated user could not be loaded.");
  }

  return (
    <ServicePicker
      dates={dates}
      initialSelection={initialSelection}
      isAuthenticated={Boolean(session)}
      customerProfile={
        session
          ? {
              name: session.user.name,
              email: session.user.email,
              phone: user?.phone ?? null,
            }
          : null
      }
      services={services}
      shopSlug={shopSlug}
      timezone={timezone}
    />
  );
}
