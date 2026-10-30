"use client";

import { useActionState } from "react";
import {
  inviteShopMember,
  type ShopInvitationState,
} from "@/app/actions/shop-invitations";

const initialState: ShopInvitationState = { error: null, success: null };

export default function ShopInvitationForm({ shopId }: { shopId: string }) {
  const [state, formAction, isPending] = useActionState(
    inviteShopMember,
    initialState,
  );

  return (
    <form action={formAction} className="manager-team-form">
      <input name="shopId" type="hidden" value={shopId} />
      <div className="manager-form-field">
        <label htmlFor="invite-member-email">E-mail do convidado</label>
        <input
          autoComplete="email"
          id="invite-member-email"
          name="email"
          placeholder="email@exemplo.com"
          required
          type="email"
        />
      </div>
      <div className="manager-form-field">
        <label htmlFor="invite-member-role">Papel</label>
        <select defaultValue="MANAGER" id="invite-member-role" name="role">
          <option value="MANAGER">Gerente</option>
          <option value="PROFESSIONAL">Profissional</option>
        </select>
      </div>
      <div className="manager-form-field">
        <label htmlFor="invite-member-display-name">
          Nome profissional (se aplicável)
        </label>
        <input
          id="invite-member-display-name"
          maxLength={100}
          name="displayName"
          placeholder="Ex.: João Navalha"
        />
      </div>
      <button className="auth-submit" disabled={isPending} type="submit">
        {isPending ? "Enviando..." : "Enviar convite"}
      </button>
      <p className="manager-field-help">
        O convite expira em 7 dias. A pessoa poderá criar uma conta ou entrar
        com o e-mail convidado.
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
