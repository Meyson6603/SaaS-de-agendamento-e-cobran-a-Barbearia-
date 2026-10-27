"use client";

import type { SubmitEvent } from "react";
import { useState } from "react";
import { saveCustomerPhone } from "@/app/actions/customer-profile";
import {
  formatBrazilianPhone,
  isValidBrazilianPhone,
  normalizeBrazilianPhone,
} from "@/lib/brazilian-phone";

export type CustomerDetails = {
  name: string;
  phone: string;
  email: string;
  notes: string;
};

type CustomerDetailsFormProps = {
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  serviceName: string;
  date: string;
  time: string;
  onSubmit: (details: CustomerDetails) => void;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeZone: "UTC",
});

export default function CustomerDetailsForm({
  customerEmail,
  customerName,
  customerPhone,
  serviceName,
  date,
  time,
  onSubmit,
}: CustomerDetailsFormProps) {
  const [phone, setPhone] = useState(
    customerPhone ? formatBrazilianPhone(customerPhone) : "",
  );
  const [savedPhone, setSavedPhone] = useState(
    customerPhone ? normalizeBrazilianPhone(customerPhone) : "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

      setPhone(result.phone);
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

    if (!(await persistPhone(String(formData.get("phone") ?? "").trim()))) {
      return;
    }

    onSubmit({
      name: customerName,
      phone: normalizeBrazilianPhone(String(formData.get("phone") ?? "")),
      email: customerEmail,
      notes: String(formData.get("notes") ?? "").trim(),
    });
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
        <strong>{serviceName}</strong>
        <span>
          {dateFormatter.format(new Date(`${date}T12:00:00Z`))} às {time}
        </span>
      </div>

      <form className="customer-form" onSubmit={handleSubmit}>
        <div className="form-field form-field-full">
          <label htmlFor="customer-phone">
            {hasSavedPhone ? "Telefone salvo" : "Seu telefone"}
          </label>
          <div className="phone-input-group">
            <span aria-hidden="true" className="phone-country-code">
              +55
            </span>
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

        <button className="submit-booking" disabled={isSaving} type="submit">
          {isSaving ? "Salvando telefone..." : "Confirmar agendamento"}
        </button>
      </form>

      <p className="schedule-disclaimer">
        Seu telefone fica salvo na sua conta para os próximos agendamentos.
        Esta demonstração ainda não reserva horários.
      </p>
    </section>
  );
}
