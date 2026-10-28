"use client";

import { useActionState } from "react";
import {
  addShopManager,
  type AddManagerState,
} from "@/app/actions/shop-members";

const initialState: AddManagerState = { error: null, success: null };

export default function ManagerTeamForm({
  shopId,
}: {
  shopId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    addShopManager,
    initialState,
  );

  return (
    <form action={formAction} className="manager-team-form">
      <input name="shopId" type="hidden" value={shopId} />
      <div className="manager-form-field">
        <label htmlFor="manager-email">Adicionar gerente</label>
        <input
          autoComplete="email"
          id="manager-email"
          name="managerEmail"
          placeholder="email@exemplo.com"
          required
          type="email"
        />
      </div>
      <button className="auth-submit" disabled={isPending} type="submit">
        {isPending ? "Adicionando..." : "Adicionar gerente"}
      </button>
      <p className="manager-field-help">
        A pessoa precisa ter uma conta verificada. O sistema ainda não envia
        convites por e-mail.
      </p>
      {state.error && (
        <p aria-live="polite" className="auth-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p aria-live="polite" className="profile-success" role="status">
          {state.success}
        </p>
      )}
    </form>
  );
}
