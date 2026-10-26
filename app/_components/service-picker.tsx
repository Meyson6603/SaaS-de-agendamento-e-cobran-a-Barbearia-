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

type AvailableDate = {
  value: string;
  weekday: string;
  day: string;
  accessibleLabel: string;
};

type ServicePickerProps = {
  services: Service[];
};

const availableTimes = ["09:00", "10:30", "13:00", "14:30", "16:00"];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getAvailableDates(): AvailableDate[] {
  const dates: AvailableDate[] = [];
  const date = new Date();

  while (dates.length < 5) {
    if (date.getDay() !== 0) {
      const value = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");
      const weekday = new Intl.DateTimeFormat("pt-BR", {
        weekday: "short",
      })
        .format(date)
        .replace(".", "");
      const accessibleLabel = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "full",
      }).format(date);

      dates.push({
        value,
        weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
        day: String(date.getDate()).padStart(2, "0"),
        accessibleLabel,
      });
    }

    date.setDate(date.getDate() + 1);
  }

  return dates;
}

export default function ServicePicker({ services }: ServicePickerProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const selectedService = services.find(
    (service) => service.id === selectedServiceId,
  );

  return (
    <>
      <div className="booking-heading">
        <div>
          <p className="eyebrow">RESERVE SEU HORÁRIO</p>
          <h2 id="booking-title">
            {selectedService ? "Escolha data e horário" : "Escolha seu serviço"}
          </h2>
          <p className="section-description">
            {selectedService
              ? "Selecione um dia e depois um horário disponível."
              : "Um bom corte começa com um bom momento."}
          </p>
        </div>
        <span className="step-count">
          {selectedService ? "02" : "01"} <span>/ 03</span>
        </span>
      </div>

      <div aria-label="Etapas do agendamento" className="stepper">
        <div
          aria-current={selectedService ? undefined : "step"}
          className={`step${selectedService ? " step-complete" : " step-active"}`}
        >
          <span className="step-number">{selectedService ? "✓" : "01"}</span>
          <span>Serviço</span>
        </div>
        <span aria-hidden="true" className="step-line" />
        <div
          aria-current={selectedService ? "step" : undefined}
          className={`step${selectedService ? " step-active" : ""}`}
        >
          <span className="step-number">02</span>
          <span>Horário</span>
        </div>
        <span aria-hidden="true" className="step-line" />
        <div className="step">
          <span className="step-number">03</span>
          <span>Seus dados</span>
        </div>
      </div>

      <div aria-label="Serviços disponíveis" className="service-grid">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id;

          return (
            <button
              aria-pressed={isSelected}
              className={`service-card${isSelected ? " service-card-selected" : ""}`}
              key={service.id}
              onClick={() => {
                setSelectedServiceId(service.id);
                setSelectedDate(null);
                setSelectedTime(null);
              }}
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
                Escolha uma data e um horário para continuar.
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

      {selectedService && (
        <section aria-labelledby="date-heading" className="schedule-section">
          <div className="schedule-heading">
            <div>
              <p className="eyebrow">AGENDA DA BARBEARIA</p>
              <h3 id="date-heading">Qual dia funciona para você?</h3>
            </div>
            <span className="schedule-timezone">Horário de Brasília</span>
          </div>

          <div aria-label="Datas disponíveis" className="date-grid">
            {getAvailableDates().map((date) => {
              const isSelected = selectedDate === date.value;

              return (
                <button
                  aria-pressed={isSelected}
                  aria-label={date.accessibleLabel}
                  className={`date-option${isSelected ? " date-option-selected" : ""}`}
                  key={date.value}
                  onClick={() => {
                    setSelectedDate(date.value);
                    setSelectedTime(null);
                  }}
                  type="button"
                >
                  <span>{date.weekday}</span>
                  <strong>{date.day}</strong>
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div aria-labelledby="time-heading" className="time-section">
              <h3 id="time-heading">Horários disponíveis</h3>
              <div aria-label="Horários disponíveis" className="time-grid">
                {availableTimes.map((time) => {
                  const isSelected = selectedTime === time;

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={`time-option${isSelected ? " time-option-selected" : ""}`}
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      type="button"
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedDate && selectedTime && (
            <div aria-live="polite" className="schedule-confirmation">
              <span>
                Horário selecionado:{" "}
                <strong>
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "long",
                    timeZone: "UTC",
                  }).format(new Date(`${selectedDate}T12:00:00Z`))}
                  {" às "}
                  {selectedTime}
                </strong>
              </span>
              <span className="summary-next">
                A próxima etapa será informar seus dados.
              </span>
            </div>
          )}

          <p className="schedule-disclaimer">
            Datas e horários de demonstração; ainda não representam a
            disponibilidade real da barbearia.
          </p>
        </section>
      )}
    </>
  );
}
