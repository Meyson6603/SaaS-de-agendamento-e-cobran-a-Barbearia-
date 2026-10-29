import { describe, expect, it } from "vitest";
import { mapMercadoPagoStatus } from "@/lib/payment-status";

describe("Mercado Pago status mapping", () => {
  it.each([
    ["approved", "PAID"],
    ["rejected", "FAILED"],
    ["cancelled", "FAILED"],
    ["refunded", "REFUNDED"],
    ["charged_back", "REFUNDED"],
    ["in_process", "PENDING"],
    [undefined, "PENDING"],
  ] as const)("%s maps to %s", (providerStatus, localStatus) => {
    expect(mapMercadoPagoStatus(providerStatus)).toBe(localStatus);
  });
});
