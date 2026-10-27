"use client";

import { useState } from "react";
import Link from "next/link";
import CustomerDetailsForm, {
  type CustomerDetails,
} from "./customer-details-form";

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
  customerProfile: {
    name: string;
    email: string;
    phone: string | null;
  } | null;
  isAuthenticated: boolean;
  services: Service[];
};

const availableTimes = ["09:00", "10:30", "13:00", "14:30", "16:00"];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getGreetingName(fullName: string): string {
  const names = fullName.trim().split(/\s+/).filter(Boolean);

  if (names.length < 2) {
    return names[0] ?? "";
  }

  return [names[0], names[names.length - 1]].join(" ");
}

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

export default function ServicePicker({
  customerProfile,
  isAuthenticated,
  services,
}: ServicePickerProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] =
    useState<CustomerDetails | null>(null);
  const selectedService = services.find(
    (service) => service.id === selectedServiceId,
  );
  const greetingName = customerDetails
    ? getGreetingName(customerDetails.name)
    : "";
  const hasSelectedSchedule = Boolean(selectedDate && selectedTime);
  const isBookingComplete = Boolean(customerDetails && hasSelectedSchedule);
  const currentStep = hasSelectedSchedule ? 3 : selectedService ? 2 : 1;

  return (
    <>
      <div className="booking-heading">
        <div>
          <p className="eyebrow">RESERVE SEU HORÁRIO</p>
          <h2 id="booking-title">
            {isBookingComplete
              ? "Demonstração concluída"
              : hasSelectedSchedule
                ? "Informe seus dados"
                : selectedService
                  ? "Escolha data e horário"
                  : "Escolha seu serviço"}
          </h2>
          <p className="section-description">
            {isBookingComplete
              ? "Nenhum horário foi reservado e seus dados não foram enviados."
              : hasSelectedSchedule
                ? customerProfile?.phone
                  ? "Confira os dados da sua conta para continuar."
                  : "Informe seu telefone para continuar."
                : selectedService
                  ? "Selecione um dia e depois um horário disponível."
                  : "Um bom corte começa com um bom momento."}
          </p>
        </div>
        <span className="step-count">
          {String(currentStep).padStart(2, "0")} <span>/ 03</span>
        </span>
      </div>

      <div aria-label="Etapas do agendamento" className="stepper">
        <div
          aria-current={currentStep === 1 ? "step" : undefined}
          className={`step${selectedService ? " step-complete" : " step-active"}`}
        >
          <span className="step-number">{selectedService ? "✓" : "01"}</span>
          <span>Serviço</span>
        </div>
        <span aria-hidden="true" className="step-line" />
        <div
          aria-current={currentStep === 2 ? "step" : undefined}
          className={`step${hasSelectedSchedule ? " step-complete" : selectedService ? " step-active" : ""}`}
        >
          <span className="step-number">{hasSelectedSchedule ? "✓" : "02"}</span>
          <span>Horário</span>
        </div>
        <span aria-hidden="true" className="step-line" />
        <div
          aria-current={currentStep === 3 ? "step" : undefined}
          className={`step${isBookingComplete ? " step-complete" : hasSelectedSchedule ? " step-active" : ""}`}
        >
          <span className="step-number">{isBookingComplete ? "✓" : "03"}</span>
          <span>Seus dados</span>
        </div>
      </div>

      {!isBookingComplete && (
        <>
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
                    setCustomerDetails(null);
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
                  <span className="service-description">
                    {service.description}
                  </span>
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
                        setCustomerDetails(null);
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

              {selectedDate && selectedTime && !customerDetails && (
                <div className="schedule-confirmation">
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
                    Confira o horário e preencha seus dados abaixo.
                  </span>
                </div>
              )}

              <p className="schedule-disclaimer">
                Datas e horários de demonstração; ainda não representam a
                disponibilidade real da barbearia.
              </p>
            </section>
          )}

          {selectedService && selectedDate && selectedTime && (
            isAuthenticated && customerProfile ? (
              <CustomerDetailsForm
                date={selectedDate}
                customerEmail={customerProfile.email}
                customerName={customerProfile.name}
                customerPhone={customerProfile.phone}
                onSubmit={setCustomerDetails}
                serviceName={selectedService.name}
                time={selectedTime}
              />
            ) : (
              isAuthenticated ? (
                <p className="auth-error" role="alert">
                  Não foi possível carregar os dados da sua conta.
                </p>
              ) : (
                <section
                  aria-labelledby="booking-login-heading"
                  className="customer-section booking-login-required"
                >
                  <p className="eyebrow">ENTRE NA SUA CONTA</p>
                  <h3 id="booking-login-heading">
                    Faça login para continuar
                  </h3>
                  <p>
                    É necessário entrar na sua conta antes de confirmar um
                    agendamento. Nenhum horário será confirmado sem login.
                  </p>
                  <Link className="booking-login-link" href="/login">
                    Entrar
                  </Link>
                </section>
              )
            )
          )}
        </>
      )}

      {customerDetails && selectedService && selectedDate && selectedTime && (
        <section
          aria-live="polite"
          aria-labelledby="booking-complete-heading"
          className="customer-section booking-complete"
        >
          <span aria-hidden="true" className="booking-complete-icon">
            ✓
          </span>
          <p className="eyebrow">FLUXO DE DEMONSTRAÇÃO</p>
          <h3 id="booking-complete-heading">
            Obrigado{greetingName ? `, ${greetingName}` : ""}!
          </h3>
          <p className="booking-complete-message">
            Esta tela é apenas uma demonstração. O agendamento não foi
            confirmado.
          </p>
          <dl className="booking-complete-details">
            <div>
              <dt>Serviço</dt>
              <dd>{selectedService.name}</dd>
            </div>
            <div>
              <dt>Data</dt>
              <dd>
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "long",
                  timeZone: "UTC",
                }).format(new Date(`${selectedDate}T12:00:00Z`))}
              </dd>
            </div>
            <div>
              <dt>Horário</dt>
              <dd>{selectedTime}</dd>
            </div>
          </dl>
          <p className="booking-complete-notice">
            Seu telefone foi salvo na sua conta. Nenhum agendamento foi
            registrado.
          </p>
          <button
            className="booking-restart"
            onClick={() => {
              setCustomerDetails(null);
              setSelectedServiceId(null);
              setSelectedDate(null);
              setSelectedTime(null);
            }}
            type="button"
          >
            Começar outro agendamento
          </button>
        </section>
      )}
    </>
  );
}
