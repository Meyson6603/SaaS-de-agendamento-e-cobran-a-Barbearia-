"use client";

import { useState } from "react";

export type Service = {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
};

type ServicePickerProps = {
  services: Service[];
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function ServicePicker({ services }: ServicePickerProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const selectedService = services.find(
    (service) => service.id === selectedServiceId,
  );

  return (
    <>
      <div aria-label="Serviços disponíveis" className="service-grid">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id;

          return (
            <button
              aria-pressed={isSelected}
              className={`service-card${isSelected ? " service-card-selected" : ""}`}
              key={service.id}
              onClick={() => setSelectedServiceId(service.id)}
              type="button"
            >
              <span className="service-card-top">
                <span className="service-category">{service.category}</span>
                <span aria-hidden="true" className="selection-indicator">
                  {isSelected ? "✓" : ""}
                </span>
              </span>
              <span className="service-name">{service.name}</span>
              <span className="service-description">{service.description}</span>
              <span className="service-card-bottom">
                <span className="service-duration">
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="15"
                    viewBox="0 0 16 16"
                    width="15"
                  >
                    <circle cx="8" cy="8" r="6" />
                    <path d="M8 4.5V8l2.25 1.5" />
                  </svg>
                  {service.duration} min
                </span>
                <span className="service-price">
                  {currencyFormatter.format(service.price)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="selection-summary">
        {selectedService ? (
          <>
            <div className="summary-copy">
              <span className="summary-label">SERVIÇO SELECIONADO</span>
              <span className="summary-service">
                {selectedService.name}
                <span aria-hidden="true"> · </span>
                {currencyFormatter.format(selectedService.price)}
              </span>
              <span className="summary-next">
                A escolha do horário será a próxima etapa.
              </span>
            </div>
            <span aria-hidden="true" className="summary-check">
              ✓
            </span>
          </>
        ) : (
          <p className="selection-hint">
            Selecione um serviço para começar seu agendamento.
          </p>
        )}
      </div>
    </>
  );
}
