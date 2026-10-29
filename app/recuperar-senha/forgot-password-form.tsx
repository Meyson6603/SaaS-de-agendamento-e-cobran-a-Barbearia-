"use client";

import type { SubmitEvent } from "react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (result.error) {
        setErrorMessage("Não foi possível solicitar a redefinição. Tente novamente.");
        setIsSubmitting(false);
        return;
      }

      setIsSent(true);
    } catch {
      setErrorMessage("Não foi possível solicitar a redefinição. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSent) {
    return (
      <p aria-live="polite" className="auth-success" role="status">
        Se o e-mail estiver cadastrado, enviaremos um link de redefinição. Confira
        também a caixa de spam.
      </p>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form-field">
        <label htmlFor="forgot-password-email">E-mail</label>
        <input
          autoComplete="email"
          id="forgot-password-email"
          name="email"
          required
          type="email"
        />
      </div>
      {errorMessage && (
        <p aria-live="polite" className="auth-error" role="alert">
          {errorMessage}
        </p>
      )}
      <button className="auth-submit" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Enviando..." : "Enviar link de recuperação"}
      </button>
    </form>
  );
}
