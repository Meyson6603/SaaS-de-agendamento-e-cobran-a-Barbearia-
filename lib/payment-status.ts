export function mapMercadoPagoStatus(status: string | undefined) {
  if (status === "approved") return "PAID" as const;
  if (status === "rejected" || status === "cancelled") return "FAILED" as const;
  if (status === "refunded" || status === "charged_back") return "REFUNDED" as const;
  return "PENDING" as const;
}
