"use client";

import type { SubmitEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function EmailSignInForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setErrorMessage("E-mail ou senha inválidos. Confira os dados e tente novamente.");
        setIsSubmitting(false);
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setErrorMessage("Não foi possível entrar. Tente novamente.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form-field">
        <label htmlFor="sign-in-email">E-mail</label>
        <input
          autoComplete="email"
          id="sign-in-email"
          name="email"
          required
          type="email"
        />
      </div>
      <div className="auth-form-field">
        <label htmlFor="sign-in-password">Senha</label>
        <input
          autoComplete="current-password"
          id="sign-in-password"
          name="password"
          required
          type="password"
        />
      </div>
      {errorMessage && (
        <p aria-live="polite" className="auth-error" role="alert">
          {errorMessage}
        </p>
      )}
      <button className="auth-submit" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Entrando..." : "Entrar com e-mail"}
      </button>
    </form>
  );
}
