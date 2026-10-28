"use client";

import { useActionState } from "react";
import {
  addWeeklyAvailability,
  createProfessional,
  createShopService,
  type BarbershopSetupState,
} from "@/app/actions/barbershop-setup";

type ProfessionalOption = {
  id: string;
  displayName: string;
  userEmail: string;
  isActive: boolean;
};

type ServiceOption = {
  id: string;
  name: string;
  durationMinutes: number;
  price: string;
  isActive: boolean;
  professionals: { id: string; displayName: string }[];
};

type AvailabilityOption = {
  id: string;
  weekday: string;
  startMinute: number;
  endMinute: number;
  professional: { displayName: string };
};

const initialState: BarbershopSetupState = { error: null, success: null };
const weekdayOptions = [
  ["MONDAY", "Segunda-feira"],
  ["TUESDAY", "Terça-feira"],
  ["WEDNESDAY", "Quarta-feira"],
  ["THURSDAY", "Quinta-feira"],
  ["FRIDAY", "Sexta-feira"],
  ["SATURDAY", "Sábado"],
  ["SUNDAY", "Domingo"],
] as const;
const weekdayLabels = new Map<string, string>(weekdayOptions);
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function BookingSetupForms({
  shopId,
  professionals,
  services,
  weeklyAvailability,
}: {
  shopId: string;
  professionals: ProfessionalOption[];
  services: ServiceOption[];
  weeklyAvailability: AvailabilityOption[];
}) {
  const [professionalState, professionalAction, professionalPending] =
    useActionState(createProfessional, initialState);
  const [serviceState, serviceAction, servicePending] = useActionState(
    createShopService,
    initialState,
  );
  const [availabilityState, availabilityAction, availabilityPending] =
    useActionState(addWeeklyAvailability, initialState);
  const activeProfessionals = professionals.filter(({ isActive }) => isActive);

  return (
    <section aria-labelledby="setup-title" className="manager-panel booking-setup">
      <div className="manager-panel-heading">
        <div>
          <p className="eyebrow">CONFIGURAÇÃO DA AGENDA</p>
          <h2 id="setup-title">Equipe, serviços e horários</h2>
        </div>
      </div>

      <div className="booking-setup-grid">
        <div className="booking-setup-block">
          <h3>Profissionais</h3>
          {professionals.length ? (
            <ul className="manager-team-list">
              {professionals.map((professional) => (
                <li key={professional.id}>
                  <span>{professional.displayName}</span>
                  <span>{professional.userEmail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="manager-empty">A equipe ainda não foi cadastrada.</p>
          )}
          <form action={professionalAction} className="manager-team-form">
            <input name="shopId" type="hidden" value={shopId} />
            <div className="manager-form-field">
              <label htmlFor="professional-display-name">Nome profissional</label>
              <input
                autoComplete="name"
                id="professional-display-name"
                maxLength={100}
                name="displayName"
                required
              />
            </div>
            <div className="manager-form-field">
              <label htmlFor="professional-email">E-mail da conta verificada</label>
              <input
                autoComplete="email"
                id="professional-email"
                name="email"
                required
                type="email"
              />
            </div>
            <button className="auth-submit" disabled={professionalPending} type="submit">
              {professionalPending ? "Adicionando..." : "Adicionar profissional"}
            </button>
            <p className="manager-field-help">
              A pessoa precisa ter uma conta verificada e não pode ter outro papel
              nesta barbearia.
            </p>
            <ActionFeedback state={professionalState} />
          </form>
        </div>

        <div className="booking-setup-block">
          <h3>Serviços</h3>
          {services.length ? (
            <ul className="booking-config-list">
              {services.map((service) => (
                <li key={service.id}>
                  <div>
                    <strong>{service.name}</strong>
                    <span>
                      {service.durationMinutes} min ·{" "}
                      {currencyFormatter.format(Number(service.price))}
                    </span>
                    <span>
                      {service.professionals.map(({ displayName }) => displayName).join(", ")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="manager-empty">Nenhum serviço foi cadastrado.</p>
          )}
          <form action={serviceAction} className="manager-team-form">
            <input name="shopId" type="hidden" value={shopId} />
            <div className="manager-form-field">
              <label htmlFor="service-name">Nome do serviço</label>
              <input id="service-name" maxLength={100} name="name" required />
            </div>
            <div className="manager-form-field">
              <label htmlFor="service-description">
                Descrição <span>(opcional, até 500 caracteres)</span>
              </label>
              <input
                id="service-description"
                maxLength={500}
                name="description"
              />
            </div>
            <div className="booking-inline-fields">
              <div className="manager-form-field">
                <label htmlFor="service-duration">Duração (minutos)</label>
                <input
                  id="service-duration"
                  max={480}
                  min={5}
                  name="durationMinutes"
                  required
                  type="number"
                />
              </div>
              <div className="manager-form-field">
                <label htmlFor="service-price">Preço (R$)</label>
                <input
                  id="service-price"
                  inputMode="decimal"
                  name="price"
                  placeholder="45,00"
                  required
                />
              </div>
            </div>
            <fieldset className="booking-professional-options">
              <legend>Profissionais que oferecem este serviço</legend>
              {activeProfessionals.length ? (
                activeProfessionals.map((professional) => (
                  <label key={professional.id}>
                    <input
                      name="professionalIds"
                      type="checkbox"
                      value={professional.id}
                    />
                    {professional.displayName}
                  </label>
                ))
              ) : (
                <p className="manager-field-help">
                  Cadastre um profissional antes de criar serviços.
                </p>
              )}
            </fieldset>
            <button
              className="auth-submit"
              disabled={servicePending || activeProfessionals.length === 0}
              type="submit"
            >
              {servicePending ? "Salvando..." : "Cadastrar serviço"}
            </button>
            <ActionFeedback state={serviceState} />
          </form>
        </div>

        <div className="booking-setup-block">
          <h3>Disponibilidade semanal</h3>
          {weeklyAvailability.length ? (
            <ul className="booking-config-list">
              {weeklyAvailability.map((availability) => (
                <li key={availability.id}>
                  <div>
                    <strong>
                      {weekdayLabels.get(availability.weekday) ?? availability.weekday}
                    </strong>
                    <span>{availability.professional.displayName}</span>
                    <span>
                      {formatMinute(availability.startMinute)}–{formatMinute(availability.endMinute)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="manager-empty">
              Defina os horários em que cada profissional atende.
            </p>
          )}
          <form action={availabilityAction} className="manager-team-form">
            <input name="shopId" type="hidden" value={shopId} />
            <div className="manager-form-field">
              <label htmlFor="availability-professional">Profissional</label>
              <select
                disabled={!activeProfessionals.length}
                id="availability-professional"
                name="professionalId"
                required
              >
                <option value="">Selecione</option>
                {activeProfessionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="manager-form-field">
              <label htmlFor="availability-weekday">Dia da semana</label>
              <select id="availability-weekday" name="weekday" required>
                {weekdayOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="booking-inline-fields">
              <div className="manager-form-field">
                <label htmlFor="availability-start">Das</label>
                <input id="availability-start" name="startTime" required type="time" />
              </div>
              <div className="manager-form-field">
                <label htmlFor="availability-end">Até</label>
                <input id="availability-end" name="endTime" required type="time" />
              </div>
            </div>
            <button
              className="auth-submit"
              disabled={availabilityPending || !activeProfessionals.length}
              type="submit"
            >
              {availabilityPending ? "Salvando..." : "Adicionar horário"}
            </button>
            <p className="manager-field-help">
              Os horários são recorrentes semanalmente. Intervalos disponíveis
              são divididos em blocos de 15 minutos.
            </p>
            <ActionFeedback state={availabilityState} />
          </form>
        </div>
      </div>
    </section>
  );
}

function ActionFeedback({ state }: { state: BarbershopSetupState }) {
  if (state.error) {
    return (
      <p aria-live="polite" className="auth-error" role="alert">
        {state.error}
      </p>
    );
  }

  if (state.success) {
    return (
      <p aria-live="polite" className="profile-success" role="status">
        {state.success}
      </p>
    );
  }

  return null;
}

function formatMinute(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60,
  ).padStart(2, "0")}`;
}
