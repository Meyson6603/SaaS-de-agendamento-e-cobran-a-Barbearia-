import { describe, expect, it } from "vitest";
import {
  formatBrazilianPhone,
  isValidBrazilianPhone,
  normalizeBrazilianPhone,
} from "@/lib/brazilian-phone";

describe("Brazilian phone validation", () => {
  it("normalizes country code and formatting", () => {
    expect(normalizeBrazilianPhone("+55 (62) 99959-6375")).toBe("62999596375");
    expect(formatBrazilianPhone("62999596375")).toBe("(62) 99959-6375");
  });

  it("accepts valid mobile and landline numbers", () => {
    expect(isValidBrazilianPhone("(62) 99959-6375")).toBe(true);
    expect(isValidBrazilianPhone("(11) 3456-7890")).toBe(true);
  });

  it("rejects invalid area codes and subscriber numbers", () => {
    expect(isValidBrazilianPhone("(00) 99999-9999")).toBe(false);
    expect(isValidBrazilianPhone("(62) 89999-9999")).toBe(false);
  });
});
