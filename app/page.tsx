import Link from "next/link";
import ServicePicker, { type Service } from "./_components/service-picker";

const services: Service[] = [
  {
    id: "classic-cut",
    name: "Corte clássico",
    description: "Corte feito na tesoura ou máquina, do seu jeito.",
    duration: 45,
    price: 45,
    category: "CABELO",
  },
  {
    id: "beard",
    name: "Barba",
    description: "Modelagem com toalha quente e acabamento preciso.",
    duration: 30,
    price: 35,
    category: "BARBA",
  },
  {
    id: "cut-and-beard",
    name: "Corte + barba",
    description: "Um cuidado completo para renovar o visual.",
    duration: 75,
    price: 70,
    category: "COMBO",
  },
  {
    id: "eyebrow",
    name: "Acabamento",
    description: "Contorno e acabamento para deixar tudo em ordem.",
    duration: 20,
    price: 25,
    category: "DETALHES",
  },
];

export default function Home() {
  return (
    <main className="booking-page">
      <header className="site-header">
        <Link aria-label="Navalha, página inicial" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            N
          </span>
          <span>NAVALHA</span>
        </Link>
        <span className="header-caption">AGENDAMENTO ONLINE</span>
      </header>

      <div className="booking-content">
        <section aria-labelledby="shop-name" className="shop-card">
          <div className="shop-monogram" aria-hidden="true">
            N.
          </div>
          <div className="shop-details">
            <p className="eyebrow">SUA BARBEARIA DE CONFIANÇA</p>
            <h1 id="shop-name">Navalha Barbearia</h1>
            <p className="shop-address">Rua das Flores, 120 · São Paulo, SP</p>
          </div>
          <span className="open-status">
            <span aria-hidden="true" className="status-dot" />
            Aberto hoje
          </span>
        </section>

        <section aria-labelledby="booking-title" className="booking-section">
          <ServicePicker services={services} />
        </section>

        <footer className="page-footer">
          <span>Feito para cuidar bem do seu tempo.</span>
          <span>Seus dados são usados apenas para o agendamento.</span>
        </footer>
      </div>
    </main>
  );
}
