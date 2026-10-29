import "server-only";
import { mapMercadoPagoStatus } from "@/lib/payment-status";

export { mapMercadoPagoStatus };

const mercadoPagoApi = "https://api.mercadopago.com";

type PreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
};

type PaymentResponse = {
  id?: number;
  status?: string;
  external_reference?: string;
  payment_method_id?: string;
};

export async function createMercadoPagoPreference(input: {
  bookingId: string;
  serviceName: string;
  amount: number;
  customerEmail: string;
}) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const appUrl = process.env.APP_URL;
  if (!accessToken || !appUrl) {
    throw new Error("Mercado Pago não está configurado.");
  }

  const response = await fetch(`${mercadoPagoApi}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `booking-${input.bookingId}`,
    },
    body: JSON.stringify({
      items: [
        {
          id: input.bookingId,
          title: input.serviceName,
          quantity: 1,
          currency_id: "BRL",
          unit_price: input.amount,
        },
      ],
      payer: { email: input.customerEmail },
      external_reference: input.bookingId,
      back_urls: {
        success: `${appUrl}/dashboard?payment=success`,
        failure: `${appUrl}/dashboard?payment=failure`,
        pending: `${appUrl}/dashboard?payment=pending`,
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/payments/mercadopago/webhook`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago recusou a preferência (${response.status}).`);
  }

  const preference = (await response.json()) as PreferenceResponse;
  const checkoutUrl = preference.init_point ?? preference.sandbox_init_point;
  if (!preference.id || !checkoutUrl) {
    throw new Error("Mercado Pago não retornou um checkout válido.");
  }

  return { id: preference.id, checkoutUrl };
}

export async function getMercadoPagoPayment(paymentId: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Mercado Pago não está configurado.");
  }

  const response = await fetch(`${mercadoPagoApi}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Mercado Pago recusou a consulta (${response.status}).`);
  }
  return (await response.json()) as PaymentResponse;
}
