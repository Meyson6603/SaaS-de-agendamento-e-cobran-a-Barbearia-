"use client";

import type { SubmitEvent } from "react";
import { useState } from "react";
import { createBooking } from "@/app/actions/booking";
import { saveCustomerPhone } from "@/app/actions/customer-profile";
import {
  formatBrazilianPhone,
  isValidBrazilianPhone,
  normalizeBrazilianPhone,
} from "@/lib/brazilian-phone";

type CustomerDetailsFormProps = {
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  date: string;
  dateValue: string;
  onBookingComplete: () => void;
  onRestart: () => void;
  professionalName: string;
  professionalId: string;
  serviceId: string;
  serviceName: string;
  shopSlug: string;
  time: string;
};

export default function CustomerDetailsForm({
  customerEmail,
  customerName,
  customerPhone,
  date,
  dateValue,
  onBookingComplete,
  onRestart,
  professionalName,
  professionalId,
  serviceId,
  serviceName,
  shopSlug,
  time,
}: CustomerDetailsFormProps) {
  const [phone, setPhone] = useState(
    customerPhone ? formatBrazilianPhone(customerPhone) : "",
  );
  const [savedPhone, setSavedPhone] = useState(
    customerPhone ? normalizeBrazilianPhone(customerPhone) : "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const hasSavedPhone = Boolean(savedPhone);

  async function persistPhone(value: string) {
    const digits = normalizeBrazilianPhone(value);

    if (!isValidBrazilianPhone(value)) {
      setErrorMessage("Informe um telefone brasileiro válido, com DDD e número.");
      return false;
    }

    if (digits === savedPhone) {
      return true;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const result = await saveCustomerPhone(value);

      if (!result.success) {
        setErrorMessage(result.error);
        return false;
      }

      setPhone(formatBrazilianPhone(result.phone));
      setSavedPhone(result.phone);
      return true;
    } catch {
      setErrorMessage("Não foi possível salvar seu telefone. Tente novamente.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const phoneValue = String(formData.get("phone") ?? "").trim();

    if (!(await persistPhone(phoneValue))) {
      return;
    }

    setIsConfirming(true);
    setErrorMessage(null);

    try {
      const result = await createBooking(
        shopSlug,
        serviceId,
        professionalId,
        dateValue,
        time,
        String(formData.get("notes") ?? "").trim(),
      );

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      setBookingConfirmed(true);
      onBookingComplete();
    } catch {
      setErrorMessage("Não foi possível confirmar o agendamento. Tente novamente.");
    } finally {
      setIsConfirming(false);
    }
  }

  if (bookingConfirmed) {
    return (
      <section
        aria-live="polite"
        aria-labelledby="booking-complete-heading"
        className="customer-section booking-complete"
      >
        <span aria-hidden="true" className="booking-complete-icon">✓</span>
        <p className="eyebrow">AGENDAMENTO REGISTRADO</p>
        <h3 id="booking-complete-heading">Está confirmado, {customerName}!</h3>
        <p className="booking-complete-message">
          Seu horário foi salvo e já está disponível na sua conta.
        </p>
        <dl className="booking-complete-details">
          <div><dt>Serviço</dt><dd>{serviceName}</dd></div>
          <div><dt>Profissional</dt><dd>{professionalName}</dd></div>
          <div><dt>Data</dt><dd>{date}</dd></div>
          <div><dt>Horário</dt><dd>{time}</dd></div>
        </dl>
        <button className="booking-restart" onClick={onRestart} type="button">
          Fazer outro agendamento
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="customer-details-heading" className="customer-section">
      <div className="schedule-heading">
        <div>
          <p className="eyebrow">ÚLTIMA ETAPA</p>
          <h3 id="customer-details-heading">Seus dados</h3>
        </div>
        <span className="schedule-timezone">Confirme os detalhes</span>
      </div>

      <div className="booking-review">
        <span className="summary-label">RESUMO DO AGENDAMENTO</span>
        <strong>{serviceName} com {professionalName}</strong>
        <span>{date} às {time}</span>
        <span>{customerName} · {customerEmail}</span>
      </div>

      <form className="customer-form" onSubmit={handleSubmit}>
        <div className="form-field form-field-full">
          <label htmlFor="customer-phone">
            {hasSavedPhone ? "Telefone salvo" : "Seu telefone"}
          </label>
          <div className="phone-input-group">
            <span aria-hidden="true" className="phone-country-code">+55</span>
            <input
              autoComplete="tel-national"
              id="customer-phone"
              inputMode="numeric"
              maxLength={15}
              name="phone"
              onBlur={() => {
                if (phone.trim()) {
                  void persistPhone(phone);
                }
              }}
              onChange={(event) => {
                setPhone(formatBrazilianPhone(event.target.value));
                setErrorMessage(null);
              }}
              placeholder="(11) 99999-9999"
              required
              type="tel"
              value={phone}
            />
          </div>
          {hasSavedPhone && (
            <span className="auth-field-hint">
              Esse número já está salvo na sua conta.
            </span>
          )}
          <span className="auth-field-hint">
            Digite o DDD e o número, sem o código do país. Ex.: (11) 99999-9999.
          </span>
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="customer-notes">
            Observação <span className="optional-label">(opcional)</span>
          </label>
          <textarea
            id="customer-notes"
            maxLength={500}
            name="notes"
            placeholder="Tem alguma preferência para o atendimento?"
            rows={3}
          />
        </div>

        {errorMessage && (
          <p aria-live="polite" className="auth-error form-field-full" role="alert">
            {errorMessage}
          </p>
        )}

        <button
          className="submit-booking"
          disabled={isSaving || isConfirming}
          type="submit"
        >
          {isSaving
            ? "Salvando telefone..."
            : isConfirming
              ? "Confirmando..."
              : "Confirmar agendamento"}
        </button>
      </form>

      <p className="schedule-disclaimer">
        Ao confirmar, o horário é validado novamente e salvo na agenda da barbearia.
      </p>
    </section>
  );
}
