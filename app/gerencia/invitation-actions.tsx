"use client";

import { useActionState } from "react";
import {
  cancelShopInvitation,
  resendShopInvitation,
  type ShopInvitationState,
} from "@/app/actions/shop-invitations";

const initialState: ShopInvitationState = { error: null, success: null };

export default function InvitationActions({
  invitationId,
}: {
  invitationId: string;
}) {
  const [resendState, resendAction, isResending] = useActionState(
    resendShopInvitation,
    initialState,
  );
  const [cancelState, cancelAction, isCancelling] = useActionState(
    cancelShopInvitation,
    initialState,
  );
  const state = resendState.error || resendState.success
    ? resendState
    : cancelState;

  return (
    <div className="manager-invitation-actions">
      <form action={resendAction}>
        <input name="invitationId" type="hidden" value={invitationId} />
        <button className="manager-action-button" disabled={isResending} type="submit">
          {isResending ? "Enviando..." : "Reenviar"}
        </button>
      </form>
      <form action={cancelAction}>
        <input name="invitationId" type="hidden" value={invitationId} />
        <button className="manager-action-button" disabled={isCancelling} type="submit">
          {isCancelling ? "Cancelando..." : "Cancelar"}
        </button>
      </form>
      {state.error && <span className="auth-error">{state.error}</span>}
      {state.success && <span className="profile-success">{state.success}</span>}
    </div>
  );
}
