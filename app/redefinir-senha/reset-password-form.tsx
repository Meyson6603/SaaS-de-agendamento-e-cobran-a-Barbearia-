"use client";

import type { SubmitEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      setErrorMessage("A senha deve ter entre 8 e 128 caracteres.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await authClient.resetPassword({
        newPassword,
        token,
      });

      if (result.error) {
        setErrorMessage("O link é inválido ou expirou. Solicite um novo link.");
        setIsSubmitting(false);
        return;
      }

      setIsReset(true);
    } catch {
      setErrorMessage("Não foi possível redefinir a senha. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isReset) {
    return (
      <div className="auth-result">
        <p aria-live="polite" className="auth-success" role="status">
          Senha atualizada com sucesso.
        </p>
        <Link className="auth-submit auth-submit-link" href="/login">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form-field">
        <label htmlFor="reset-password">Nova senha</label>
        <input
          autoComplete="new-password"
          id="reset-password"
          maxLength={128}
          minLength={8}
          name="newPassword"
          required
          type="password"
        />
      </div>
      <div className="auth-form-field">
        <label htmlFor="reset-password-confirm">Confirmar nova senha</label>
        <input
          autoComplete="new-password"
          id="reset-password-confirm"
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
        {isSubmitting ? "Atualizando..." : "Atualizar senha"}
      </button>
    </form>
  );
}
