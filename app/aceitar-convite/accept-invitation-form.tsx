"use client";

import type { SubmitEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  acceptShopInvitation,
  type AcceptInvitationState,
} from "@/app/actions/accept-shop-invitation";

const initialState: AcceptInvitationState = {
  error: null,
  success: null,
  redirectTo: null,
};

export default function AcceptInvitationForm({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function accept() {
    const formData = new FormData();
    formData.set("token", token);
    const result = await acceptShopInvitation(initialState, formData);
    setState(result);
    if (result.redirectTo) router.replace(result.redirectTo);
  }

  async function handleLogin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setState(initialState);
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setState({ error: "E-mail ou senha inválidos.", success: null, redirectTo: null });
      } else {
        await accept();
      }
    } catch {
      setState({ error: "Não foi possível entrar. Tente novamente.", success: null, redirectTo: null });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-result">
      <form className="auth-form" onSubmit={handleLogin}>
        <input name="email" type="hidden" value={email} />
        <div className="auth-form-field">
          <label htmlFor="invitation-password">Senha da conta</label>
          <input
            autoComplete="current-password"
            id="invitation-password"
            name="password"
            required
            type="password"
          />
        </div>
        {state.error && (
          <p aria-live="polite" className="auth-error" role="alert">
            {state.error}
          </p>
        )}
        {state.success && (
          <p aria-live="polite" className="auth-success" role="status">
            {state.success}
          </p>
        )}
        <button className="auth-submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Entrando..." : "Entrar e aceitar convite"}
        </button>
      </form>
      <Link
        className="auth-inline-link"
        href={`/cadastro?redirectTo=${encodeURIComponent(`/aceitar-convite?token=${token}`)}`}
      >
        Ainda não tenho conta
      </Link>
    </div>
  );
}
