"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cancelBooking,
  loadRescheduleTimes,
  rescheduleBooking,
  type BookingManagementState,
} from "@/app/actions/booking-management";

type BookingDateOption = {
  value: string;
  accessibleLabel: string;
};

const initialState: BookingManagementState = { error: null, success: null };

export default function BookingManagementActions({
  bookingId,
  dates,
  currentStartAt,
  timezone,
}: {
  bookingId: string;
  dates: BookingDateOption[];
  currentStartAt: string;
  timezone: string;
}) {
  const router = useRouter();
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelBooking, initialState);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const requestId = useRef(0);

  async function chooseDate(value: string) {
    const currentRequest = ++requestId.current;
    setDate(value);
    setTime("");
    setTimes([]);
    setError(null);
    setSuccess(null);
    if (!value) return;
    setLoadingTimes(true);
    try {
      const result = await loadRescheduleTimes(bookingId, value);
      if (currentRequest !== requestId.current) return;
      if (!result.success) {
        setError(result.error);
        return;
      }
      const current = localDateTime(currentStartAt, timezone);
      setTimes(result.times.filter((candidate) => value !== current.date || candidate !== current.time));
    } catch {
      if (currentRequest === requestId.current) setError("Não foi possível consultar os horários.");
    } finally {
      if (currentRequest === requestId.current) setLoadingTimes(false);
    }
  }

  async function saveReschedule() {
    if (!date || !time || saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await rescheduleBooking(bookingId, date, time);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(result.success);
      setRescheduling(false);
      setDate("");
      setTime("");
      setTimes([]);
      router.refresh();
    } catch {
      setError("Não foi possível remarcar o agendamento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="booking-management-actions">
      <button
        className="manager-secondary-action"
        onClick={() => {
          setRescheduling((value) => !value);
          setConfirmingCancel(false);
          setError(null);
        }}
        type="button"
      >
        {rescheduling ? "Fechar remarcação" : "Remarcar"}
      </button>
      {rescheduling && (
        <section aria-label="Escolher novo horário" className="booking-reschedule-panel">
          <label className="manager-form-field">
            Nova data
            <select onChange={(event) => void chooseDate(event.target.value)} value={date}>
              <option value="">Selecione uma data</option>
              {dates.map((option) => (
                <option key={option.value} value={option.value}>{option.accessibleLabel}</option>
              ))}
            </select>
          </label>
          {date && (
            <div aria-live="polite" className="booking-reschedule-times">
              <span>Horários no fuso {timezone === "America/Sao_Paulo" ? "de Brasília" : timezone}</span>
              {loadingTimes ? <p className="auth-loading">Consultando horários...</p> : times.length ? (
                <div aria-label="Horários disponíveis" className="time-grid">
                  {times.map((candidate) => (
                    <button
                      aria-pressed={candidate === time}
                      className={`time-option${candidate === time ? " time-option-selected" : ""}`}
                      key={candidate}
                      onClick={() => setTime(candidate)}
                      type="button"
                    >
                      {candidate}
                    </button>
                  ))}
                </div>
              ) : <p className="manager-empty">Não há horários disponíveis nessa data.</p>}
            </div>
          )}
          {error && <p aria-live="polite" className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={!date || !time || loadingTimes || saving} onClick={() => void saveReschedule()} type="button">
            {saving ? "Salvando..." : "Confirmar novo horário"}
          </button>
        </section>
      )}
      {success && <p aria-live="polite" className="profile-success" role="status">{success}</p>}
      <form action={cancelAction} className="booking-cancel-form">
        <input name="bookingId" type="hidden" value={bookingId} />
        {confirmingCancel ? (
          <div className="booking-cancel-confirmation">
            <p>O agendamento será cancelado. O pagamento não será alterado automaticamente.</p>
            <button className="manager-secondary-action" disabled={cancelPending} type="submit">
              {cancelPending ? "Cancelando..." : "Confirmar cancelamento"}
            </button>
            <button className="booking-cancel-back" disabled={cancelPending} onClick={() => setConfirmingCancel(false)} type="button">Voltar</button>
          </div>
        ) : (
          <button className="booking-cancel-trigger" onClick={() => { setConfirmingCancel(true); setRescheduling(false); }} type="button">
            Cancelar agendamento
          </button>
        )}
        {cancelState.error && <p aria-live="polite" className="auth-error" role="alert">{cancelState.error}</p>}
        {cancelState.success && <p aria-live="polite" className="profile-success" role="status">{cancelState.success}</p>}
      </form>
    </div>
  );
}

function localDateTime(value: string, timezone: string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}` };
}
