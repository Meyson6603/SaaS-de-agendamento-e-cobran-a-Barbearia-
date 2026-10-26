"use client";

import type { SubmitEvent } from "react";

export type CustomerDetails = {
  name: string;
  phone: string;
  email: string;
  notes: string;
};

type CustomerDetailsFormProps = {
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
  serviceName,
  date,
  time,
  onSubmit,
}: CustomerDetailsFormProps) {
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    onSubmit({
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
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
        <div className="form-field">
          <label htmlFor="customer-name">Nome completo</label>
          <input
            autoComplete="name"
            id="customer-name"
            name="name"
            placeholder="Ex.: Ana Silva"
            required
            type="text"
          />
        </div>

        <div className="form-field">
          <label htmlFor="customer-phone">Telefone</label>
          <input
            autoComplete="tel"
            id="customer-phone"
            name="phone"
            placeholder="(11) 99999-9999"
            required
            type="tel"
          />
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="customer-email">E-mail</label>
          <input
            autoComplete="email"
            id="customer-email"
            name="email"
            placeholder="voce@exemplo.com"
            required
            type="email"
          />
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

        <button className="submit-booking" type="submit">
          Confirmar agendamento
        </button>
      </form>

      <p className="schedule-disclaimer">
        Demonstração: estes dados não serão enviados nem salvos.
      </p>
    </section>
  );
}
