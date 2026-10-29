"use client";

import type { SubmitEvent } from "react";
import { useState } from "react";
import { createBooking } from "@/app/actions/booking";
import { sendEmailOtp, verifyEmailOtp } from "@/app/actions/email-otp";
import { createOnlinePayment } from "@/app/actions/online-payment";
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
  emailVerified: boolean;
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
  emailVerified,
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
  const [savedPhone] = useState(
    customerPhone ? normalizeBrazilianPhone(customerPhone) : "",
  );
  const [notes, setNotes] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const hasSavedPhone = Boolean(savedPhone);

  async function persistPhone(value: string) {
    if (!isValidBrazilianPhone(value)) {
      setErrorMessage("Informe um telefone brasileiro válido, com DDD e número.");
      return false;
    }

    if (normalizeBrazilianPhone(value) !== savedPhone) {
      const result = await saveCustomerPhone(value);
      if (!result.success) {
        setErrorMessage(result.error);
        return false;
      }
    }

    return true;
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const phoneValue = String(formData.get("phone") ?? "").trim();

    if (!(await persistPhone(phoneValue))) {
      return;
    }

    if (!emailVerified) {
      setIsSendingOtp(true);
      setErrorMessage(null);
      try {
        const result = await sendEmailOtp();
        if (!result.success) {
          setErrorMessage(result.error);
          return;
        }
        setOtpSent(true);
        return;
      } finally {
        setIsSendingOtp(false);
      }
    }

    await confirmBooking(notes);
  }

  async function confirmEmail() {
    setIsVerifyingOtp(true);
    setErrorMessage(null);
    try {
      const result = await verifyEmailOtp(otpCode);
      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }
      await confirmBooking(notes);
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  async function confirmBooking(customerNote: string) {
    setIsConfirming(true);
    try {
      const result = await createBooking(
        shopSlug,
        serviceId,
        professionalId,
        dateValue,
        time,
        customerNote,
      );
      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }
      setBookingConfirmed(true);
      setConfirmedBookingId(result.bookingId);
      onBookingComplete();
    } catch {
      setErrorMessage("Não foi possível confirmar o agendamento. Tente novamente.");
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleOnlinePayment() {
    if (!confirmedBookingId) return;
    setIsStartingPayment(true);
    setErrorMessage(null);
    try {
      const result = await createOnlinePayment(confirmedBookingId);
      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }
      window.location.assign(result.checkoutUrl);
    } catch {
      setErrorMessage("Não foi possível iniciar o pagamento online. Tente novamente.");
    } finally {
      setIsStartingPayment(false);
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
        <button
          className="submit-booking"
          disabled={isStartingPayment}
          onClick={() => void handleOnlinePayment()}
          type="button"
        >
          {isStartingPayment ? "Abrindo pagamento..." : "Pagar online"}
        </button>
        {errorMessage && (
          <p aria-live="polite" className="auth-error" role="alert">
            {errorMessage}
          </p>
        )}
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
        {otpSent && (
          <div className="form-field form-field-full">
            <label htmlFor="email-otp">Código enviado para {customerEmail}</label>
            <input
              id="email-otp"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setOtpCode(event.target.value)}
              pattern="\d{6}"
              required
              value={otpCode}
            />
            <button
              className="booking-restart"
              disabled={isVerifyingOtp || isConfirming}
              onClick={() => void confirmEmail()}
              type="button"
            >
              {isVerifyingOtp ? "Verificando..." : "Verificar e-mail"}
            </button>
          </div>
        )}

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
          {!emailVerified && (
            <span className="auth-field-hint">
              Você receberá um código de verificação por e-mail.
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
            onChange={(event) => setNotes(event.target.value)}
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
          disabled={isSendingOtp || isConfirming}
          type="submit"
        >
          {isSendingOtp
            ? "Enviando código..."
            : isConfirming
              ? "Confirmando..."
              : otpSent
                ? "Código enviado por e-mail"
                : "Confirmar agendamento"}
        </button>
      </form>

      <p className="schedule-disclaimer">
        Ao confirmar, o horário é validado novamente e salvo na agenda da barbearia.
      </p>
    </section>
  );
}
