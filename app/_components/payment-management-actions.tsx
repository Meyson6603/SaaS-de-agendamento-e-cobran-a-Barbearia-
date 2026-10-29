"use client";

import { useActionState } from "react";
import {
  recordInPersonPayment,
  type PaymentManagementState,
} from "@/app/actions/payment";

const initialState: PaymentManagementState = { error: null, success: null };

export default function PaymentManagementActions({
  bookingId,
  paymentStatus,
  paymentMethod,
}: {
  bookingId: string;
  paymentStatus: string;
  paymentMethod: string | null;
}) {
  const [state, action, pending] = useActionState(
    recordInPersonPayment,
    initialState,
  );

  if (paymentStatus === "PAID") {
    return (
      <span className="payment-management-status">
        Pago{paymentMethod ? ` via ${paymentMethodLabel(paymentMethod)}` : ""}
      </span>
    );
  }

  return (
    <form action={action} className="payment-management-form">
      <input name="bookingId" type="hidden" value={bookingId} />
      <label>
        <span className="sr-only">Forma de pagamento</span>
        <select defaultValue="PIX" disabled={pending} name="method">
          <option value="PIX">PIX</option>
          <option value="CASH">Dinheiro</option>
          <option value="CARD_ON_SITE">Cartão</option>
        </select>
      </label>
      <button disabled={pending} type="submit">
        {pending ? "Registrando..." : "Registrar pagamento"}
      </button>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.success && <p className="form-success">{state.success}</p>}
    </form>
  );
}

function paymentMethodLabel(method: string) {
  const labels: Record<string, string> = {
    PIX: "PIX",
    CASH: "dinheiro",
    CARD_ON_SITE: "cartão",
  };
  return labels[method] ?? method;
}
