"use client";

import { useActionState } from "react";
import {
  addWeeklyAvailability,
  createProfessional,
  createShopService,
  removeWeeklyAvailability,
  toggleProfessionalStatus,
  toggleShopService,
  updateProfessional,
  updateShopService,
  updateWeeklyAvailability,
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
  description: string | null;
  durationMinutes: number;
  price: string;
  isActive: boolean;
  professionals: { id: string; displayName: string; isActive: boolean }[];
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
                  <div>
                    <span>{professional.displayName}</span>
                    <span>{professional.userEmail}</span>
                    {!professional.isActive && <strong>Desativado</strong>}
                  </div>
                  <ProfessionalEditor shopId={shopId} professional={professional} />
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
                    {!service.isActive && <span>Desativado</span>}
                  </div>
                  <ServiceEditor
                    activeProfessionals={activeProfessionals}
                    service={service}
                    shopId={shopId}
                  />
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
                  <AvailabilityEditor availability={availability} shopId={shopId} />
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

function ProfessionalEditor({
  shopId,
  professional,
}: {
  shopId: string;
  professional: ProfessionalOption;
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateProfessional,
    initialState,
  );
  const [toggleState, toggleAction, togglePending] = useActionState(
    toggleProfessionalStatus,
    initialState,
  );

  return (
    <details className="booking-config-editor">
      <summary>Editar</summary>
      <form action={updateAction} className="manager-team-form">
        <input name="shopId" type="hidden" value={shopId} />
        <input name="professionalId" type="hidden" value={professional.id} />
        <div className="manager-form-field">
          <label htmlFor={`professional-name-${professional.id}`}>Nome profissional</label>
          <input
            id={`professional-name-${professional.id}`}
            maxLength={100}
            name="displayName"
            required
            defaultValue={professional.displayName}
          />
        </div>
        <button className="auth-submit" disabled={updatePending} type="submit">
          {updatePending ? "Salvando..." : "Salvar alterações"}
        </button>
        <ActionFeedback state={updateState} />
      </form>
      <form action={toggleAction}>
        <input name="shopId" type="hidden" value={shopId} />
        <input name="professionalId" type="hidden" value={professional.id} />
        <input name="isActive" type="hidden" value={String(professional.isActive)} />
        <button className="manager-secondary-action" disabled={togglePending} type="submit">
          {togglePending
            ? "Atualizando..."
            : professional.isActive
              ? "Desativar profissional"
              : "Ativar profissional"}
        </button>
        <ActionFeedback state={toggleState} />
      </form>
    </details>
  );
}

function ServiceEditor({
  shopId,
  service,
  activeProfessionals,
}: {
  shopId: string;
  service: ServiceOption;
  activeProfessionals: ProfessionalOption[];
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateShopService,
    initialState,
  );
  const [toggleState, toggleAction, togglePending] = useActionState(
    toggleShopService,
    initialState,
  );
  const assignedProfessionalIds = new Set(
    service.professionals.map(({ id }) => id),
  );

  return (
    <details className="booking-config-editor">
      <summary>Editar</summary>
      <form action={updateAction} className="manager-team-form">
        <input name="shopId" type="hidden" value={shopId} />
        <input name="serviceId" type="hidden" value={service.id} />
        <div className="manager-form-field">
          <label htmlFor={`service-name-${service.id}`}>Nome do serviço</label>
          <input
            id={`service-name-${service.id}`}
            maxLength={100}
            name="name"
            required
            defaultValue={service.name}
          />
        </div>
        <div className="manager-form-field">
          <label htmlFor={`service-description-${service.id}`}>Descrição</label>
          <input
            id={`service-description-${service.id}`}
            maxLength={500}
            name="description"
            defaultValue={service.description ?? ""}
          />
        </div>
        <div className="booking-inline-fields">
          <div className="manager-form-field">
            <label htmlFor={`service-duration-${service.id}`}>Duração (minutos)</label>
            <input
              id={`service-duration-${service.id}`}
              max={480}
              min={5}
              name="durationMinutes"
              required
              type="number"
              defaultValue={service.durationMinutes}
            />
          </div>
          <div className="manager-form-field">
            <label htmlFor={`service-price-${service.id}`}>Preço (R$)</label>
            <input
              id={`service-price-${service.id}`}
              inputMode="decimal"
              name="price"
              required
              defaultValue={service.price.replace(".", ",")}
            />
          </div>
        </div>
        <fieldset className="booking-professional-options">
          <legend>Profissionais que oferecem este serviço</legend>
          {activeProfessionals.map((professional) => (
            <label key={professional.id}>
              <input
                defaultChecked={assignedProfessionalIds.has(professional.id)}
                name="professionalIds"
                type="checkbox"
                value={professional.id}
              />
              {professional.displayName}
            </label>
          ))}
        </fieldset>
        <button className="auth-submit" disabled={updatePending} type="submit">
          {updatePending ? "Salvando..." : "Salvar alterações"}
        </button>
        <ActionFeedback state={updateState} />
      </form>
      <form action={toggleAction}>
        <input name="shopId" type="hidden" value={shopId} />
        <input name="serviceId" type="hidden" value={service.id} />
        <input name="isActive" type="hidden" value={String(service.isActive)} />
        <button className="manager-secondary-action" disabled={togglePending} type="submit">
          {togglePending
            ? "Atualizando..."
            : service.isActive
              ? "Desativar serviço"
              : "Ativar serviço"}
        </button>
        <ActionFeedback state={toggleState} />
      </form>
    </details>
  );
}

function AvailabilityEditor({
  shopId,
  availability,
}: {
  shopId: string;
  availability: AvailabilityOption;
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateWeeklyAvailability,
    initialState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeWeeklyAvailability,
    initialState,
  );

  return (
    <details className="booking-config-editor">
      <summary>Editar</summary>
      <form action={updateAction} className="manager-team-form">
        <input name="shopId" type="hidden" value={shopId} />
        <input name="availabilityId" type="hidden" value={availability.id} />
        <div className="manager-form-field">
          <label htmlFor={`availability-weekday-${availability.id}`}>Dia da semana</label>
          <select
            defaultValue={availability.weekday}
            id={`availability-weekday-${availability.id}`}
            name="weekday"
            required
          >
            {weekdayOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="booking-inline-fields">
          <div className="manager-form-field">
            <label htmlFor={`availability-start-${availability.id}`}>Das</label>
            <input
              defaultValue={formatMinute(availability.startMinute)}
              id={`availability-start-${availability.id}`}
              name="startTime"
              required
              type="time"
            />
          </div>
          <div className="manager-form-field">
            <label htmlFor={`availability-end-${availability.id}`}>Até</label>
            <input
              defaultValue={formatMinute(availability.endMinute)}
              id={`availability-end-${availability.id}`}
              name="endTime"
              required
              type="time"
            />
          </div>
        </div>
        <button className="auth-submit" disabled={updatePending} type="submit">
          {updatePending ? "Salvando..." : "Salvar alterações"}
        </button>
        <ActionFeedback state={updateState} />
      </form>
      <form action={removeAction}>
        <input name="shopId" type="hidden" value={shopId} />
        <input name="availabilityId" type="hidden" value={availability.id} />
        <button className="manager-secondary-action" disabled={removePending} type="submit">
          {removePending ? "Removendo..." : "Remover horário"}
        </button>
        <ActionFeedback state={removeState} />
      </form>
    </details>
  );
}

function formatMinute(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60,
  ).padStart(2, "0")}`;
}
