"use client";

import type { SubmitEvent } from "react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailForm({
  email,
  redirectTo,
}: {
  email: string;
  redirectTo: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: `${window.location.origin}/verificar-email?verified=true&redirectTo=${encodeURIComponent(redirectTo)}`,
      });

      setMessage(
        result.error
          ? "Não foi possível reenviar o e-mail. Tente novamente."
          : "Um novo link foi enviado. Confira sua caixa de entrada.",
      );
    } catch {
      setMessage("Não foi possível reenviar o e-mail. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <button
        className="auth-submit"
        disabled={isSubmitting || !email}
        type="submit"
      >
        {isSubmitting ? "Reenviando..." : "Reenviar e-mail de confirmação"}
      </button>
      {message && (
        <p aria-live="polite" className="auth-success" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
