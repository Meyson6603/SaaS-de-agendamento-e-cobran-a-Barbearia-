"use client";

import type { SubmitEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function EmailSignUpForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    if (password.length < 8 || password.length > 128) {
      setErrorMessage("A senha deve ter entre 8 e 128 caracteres.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        setErrorMessage(
          "Não foi possível criar a conta. Confira os dados e tente novamente.",
        );
        setIsSubmitting(false);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Não foi possível criar a conta. Tente novamente.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form-field">
        <label htmlFor="signup-name">Nome completo</label>
        <input
          autoComplete="name"
          id="signup-name"
          maxLength={100}
          name="name"
          required
          type="text"
        />
      </div>
      <div className="auth-form-field">
        <label htmlFor="signup-email">E-mail</label>
        <input
          autoComplete="email"
          id="signup-email"
          name="email"
          required
          type="email"
        />
      </div>
      <div className="auth-form-field">
        <label htmlFor="signup-password">Senha</label>
        <input
          autoComplete="new-password"
          id="signup-password"
          maxLength={128}
          minLength={8}
          name="password"
          required
          type="password"
        />
        <span className="auth-field-hint" id="signup-password-requirements">
          Use entre 8 e 128 caracteres.
        </span>
      </div>
      <div className="auth-form-field">
        <label htmlFor="signup-confirm-password">Confirmar senha</label>
        <input
          autoComplete="new-password"
          id="signup-confirm-password"
          maxLength={128}
          minLength={8}
          name="confirmPassword"
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
        {isSubmitting ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}
