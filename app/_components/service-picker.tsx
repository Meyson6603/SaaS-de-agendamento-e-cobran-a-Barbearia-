"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { loadBookingTimes } from "@/app/actions/booking";
import CustomerDetailsForm from "./customer-details-form";

type BookingDateOption = {
  value: string;
  weekday: string;
  day: string;
  accessibleLabel: string;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  professionals: { id: string; displayName: string }[];
};

type ServicePickerProps = {
  customerProfile: {
    name: string;
    email: string;
    phone: string | null;
    emailVerified: boolean;
  } | null;
  dates: BookingDateOption[];
  initialSelection: {
    serviceId: string;
    professionalId: string;
    date: string;
    time: string;
  } | null;
  isAuthenticated: boolean;
  services: Service[];
  shopSlug: string;
  timezone: string;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function ServicePicker({
  customerProfile,
  dates,
  initialSelection,
  isAuthenticated,
  services,
  shopSlug,
  timezone,
}: ServicePickerProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    initialSelection?.serviceId ?? null,
  );
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(
    initialSelection?.professionalId ?? null,
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(
    initialSelection?.date ?? null,
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(Boolean(initialSelection));
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const availabilityRequestId = useRef(0);
  const selectedService = services.find(({ id }) => id === selectedServiceId);
  const selectedProfessional = selectedService?.professionals.find(
    ({ id }) => id === selectedProfessionalId,
  );
  const selectedDateOption = dates.find(({ value }) => value === selectedDate);
  const step = selectedTime ? 3 : selectedProfessionalId ? 2 : 1;

  useEffect(() => {
    if (!initialSelection) {
      return;
    }

    const requestId = ++availabilityRequestId.current;

    loadBookingTimes(
      shopSlug,
      initialSelection.serviceId,
      initialSelection.professionalId,
      initialSelection.date,
    )
      .then((result) => {
        if (requestId !== availabilityRequestId.current) {
          return;
        }

        if (!result.success) {
          setAvailabilityError(result.error);
          return;
        }

        const times = result.times.map(({ value }) => value);
        setAvailableTimes(times);
        if (times.includes(initialSelection.time)) {
          setSelectedTime(initialSelection.time);
        } else {
          setAvailabilityError(
            "Esse horário não está mais disponível. Escolha um novo horário.",
          );
        }
      })
      .catch(() => {
        if (requestId === availabilityRequestId.current) {
          setAvailabilityError("Não foi possível consultar os horários. Tente novamente.");
        }
      })
      .finally(() => {
        if (requestId === availabilityRequestId.current) {
          setIsLoadingTimes(false);
        }
      });

    return () => {
      if (requestId === availabilityRequestId.current) {
        availabilityRequestId.current += 1;
      }
    };
  }, [initialSelection, shopSlug]);

  function resetSchedule() {
    availabilityRequestId.current += 1;
    setSelectedServiceId(null);
    setSelectedProfessionalId(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setAvailableTimes([]);
    setAvailabilityError(null);
    setBookingComplete(false);
  }

  async function selectDate(date: string) {
    const requestId = ++availabilityRequestId.current;
    setSelectedDate(date);
    setSelectedTime(null);
    setAvailableTimes([]);
    setAvailabilityError(null);
    setIsLoadingTimes(true);

    if (!selectedServiceId || !selectedProfessionalId) {
      setIsLoadingTimes(false);
      return;
    }

    try {
      const result = await loadBookingTimes(
        shopSlug,
        selectedServiceId,
        selectedProfessionalId,
        date,
      );
      if (requestId !== availabilityRequestId.current) {
        return;
      }

      if (!result.success) {
        setAvailabilityError(result.error);
        return;
      }

      setAvailableTimes(result.times.map(({ value }) => value));
    } catch {
      if (requestId === availabilityRequestId.current) {
        setAvailabilityError("Não foi possível consultar os horários. Tente novamente.");
      }
    } finally {
      if (requestId === availabilityRequestId.current) {
        setIsLoadingTimes(false);
      }
    }
  }

  return (
    <>
      <div className="booking-heading">
        <div>
          <p className="eyebrow">RESERVE SEU HORÁRIO</p>
          <h2 id="booking-title">
            {bookingComplete
              ? "Agendamento confirmado"
              : selectedTime
                ? "Informe seus dados"
                : selectedProfessional
                  ? "Escolha data e horário"
                  : selectedService
                    ? "Escolha um profissional"
                    : "Escolha seu serviço"}
          </h2>
          <p className="section-description">
            {bookingComplete
              ? "Seu horário foi registrado e já aparece na sua conta."
              : selectedTime
                ? customerProfile?.phone
                  ? "Confira os dados da sua conta e confirme seu e-mail."
                  : "Informe seu telefone para confirmar."
                : selectedProfessional
                  ? "Consulte a disponibilidade real da agenda."
                  : selectedService
                    ? "Selecione quem realizará o atendimento."
                    : "Os serviços e horários abaixo são fornecidos pela barbearia."}
          </p>
        </div>
        <span className="step-count">
          {String(step).padStart(2, "0")} <span>/ 03</span>
        </span>
      </div>

      <div aria-label="Etapas do agendamento" className="stepper">
        <Step label="Serviço" number="01" active={step === 1} complete={Boolean(selectedService)} />
        <span aria-hidden="true" className="step-line" />
        <Step
          label="Horário"
          number="02"
          active={step === 2}
          complete={Boolean(selectedDate && selectedTime)}
        />
        <span aria-hidden="true" className="step-line" />
        <Step
          label="Seus dados"
          number="03"
          active={step === 3}
          complete={bookingComplete}
        />
      </div>

      {!services.length ? (
        <p className="account-empty-state">
          Esta barbearia ainda não publicou serviços com profissionais e horários
          configurados.
        </p>
      ) : (
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
                    availabilityRequestId.current += 1;
                    setIsLoadingTimes(false);
                    setSelectedServiceId(service.id);
                    setSelectedProfessionalId(null);
                    setSelectedDate(null);
                    setSelectedTime(null);
                    setAvailableTimes([]);
                    setBookingComplete(false);
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
                    {service.description || "Atendimento profissional."}
                  </span>
                  <span className="service-card-bottom">
                    <span className="service-duration">
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

          {selectedService && (
            <section aria-labelledby="professional-heading" className="schedule-section">
              <div className="schedule-heading">
                <div>
                  <p className="eyebrow">EQUIPE</p>
                  <h3 id="professional-heading">Com quem você quer agendar?</h3>
                </div>
              </div>
              <div aria-label="Profissionais disponíveis" className="professional-option-grid">
                {selectedService.professionals.map((professional) => (
                  <button
                    aria-pressed={selectedProfessionalId === professional.id}
                    className={`professional-option${selectedProfessionalId === professional.id ? " professional-option-selected" : ""}`}
                    key={professional.id}
                    onClick={() => {
                      availabilityRequestId.current += 1;
                      setIsLoadingTimes(false);
                      setSelectedProfessionalId(professional.id);
                      setSelectedDate(null);
                      setSelectedTime(null);
                      setAvailableTimes([]);
                      setBookingComplete(false);
                    }}
                    type="button"
                  >
                    {professional.displayName}
                  </button>
                ))}
              </div>
            </section>
          )}

          {selectedProfessional && (
            <section aria-labelledby="date-heading" className="schedule-section">
              <div className="schedule-heading">
                <div>
                  <p className="eyebrow">AGENDA DA BARBEARIA</p>
                  <h3 id="date-heading">Qual dia funciona para você?</h3>
                </div>
                <span className="schedule-timezone">
                  {timezone === "America/Sao_Paulo" ? "Horário de Brasília" : timezone}
                </span>
              </div>

              <div aria-label="Datas disponíveis" className="date-grid">
                {dates.map((date) => (
                  <button
                    aria-pressed={selectedDate === date.value}
                    aria-label={date.accessibleLabel}
                    className={`date-option${selectedDate === date.value ? " date-option-selected" : ""}`}
                    key={date.value}
                    onClick={() => void selectDate(date.value)}
                    type="button"
                  >
                    <span>{date.weekday}</span>
                    <strong>{date.day}</strong>
                  </button>
                ))}
              </div>

              {selectedDate && (
                <div aria-labelledby="time-heading" className="time-section">
                  <h3 id="time-heading">Horários disponíveis</h3>
                  {isLoadingTimes ? (
                    <p className="auth-loading">Consultando a agenda...</p>
                  ) : availabilityError ? (
                    <p aria-live="polite" className="auth-error" role="alert">
                      {availabilityError}
                    </p>
                  ) : availableTimes.length ? (
                    <div aria-label="Horários disponíveis" className="time-grid">
                      {availableTimes.map((time) => (
                        <button
                          aria-pressed={selectedTime === time}
                          className={`time-option${selectedTime === time ? " time-option-selected" : ""}`}
                          key={time}
                          onClick={() => {
                            setSelectedTime(time);
                            setBookingComplete(false);
                          }}
                          type="button"
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="account-empty-state">
                      Não há horários disponíveis neste dia. Escolha outra data.
                    </p>
                  )}
                </div>
              )}
              <p className="schedule-disclaimer">
                A disponibilidade é atualizada antes de confirmar o agendamento.
              </p>
            </section>
          )}

          {selectedService && selectedProfessional && selectedDate && selectedTime && (
            isAuthenticated && customerProfile ? (
              <CustomerDetailsForm
                date={selectedDateOption?.accessibleLabel ?? selectedDate}
                dateValue={selectedDate}
                customerEmail={customerProfile.email}
                customerName={customerProfile.name}
                customerPhone={customerProfile.phone}
                emailVerified={customerProfile.emailVerified}
                onBookingComplete={() => setBookingComplete(true)}
                onRestart={resetSchedule}
                professionalName={selectedProfessional.displayName}
                professionalId={selectedProfessional.id}
                serviceId={selectedService.id}
                serviceName={selectedService.name}
                shopSlug={shopSlug}
                time={selectedTime}
              />
            ) : (
              <section
                aria-labelledby="booking-login-heading"
                className="customer-section booking-login-required"
              >
                <p className="eyebrow">ENTRE NA SUA CONTA</p>
                <h3 id="booking-login-heading">Faça login para continuar</h3>
                <p>
                  É necessário entrar na sua conta antes de confirmar e registrar
                  o agendamento.
                </p>
                <Link
                  className="booking-login-link"
                  href={`/login?redirectTo=${encodeURIComponent(
                    `/${shopSlug}?${new URLSearchParams({
                      service: selectedService.id,
                      professional: selectedProfessional.id,
                      date: selectedDate,
                      time: selectedTime,
                    }).toString()}`,
                  )}`}
                >
                  Entrar
                </Link>
              </section>
            )
          )}
        </>
      )}

      <p className="sr-only" aria-live="polite">
        {selectedDateOption ? `${selectedDateOption.accessibleLabel}, ${selectedTime ?? ""}` : ""}
      </p>
    </>
  );
}

function Step({
  label,
  number,
  active,
  complete,
}: {
  label: string;
  number: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      aria-current={active ? "step" : undefined}
      className={`step${complete ? " step-complete" : active ? " step-active" : ""}`}
    >
      <span className="step-number">{complete ? "✓" : number}</span>
      <span>{label}</span>
    </div>
  );
}
