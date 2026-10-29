import { describe, expect, it } from "vitest";
import { getSafeRedirectTo } from "@/lib/redirect-url";

describe("safe redirect URLs", () => {
  it("keeps local paths and query strings", () => {
    expect(getSafeRedirectTo("/navalha-teste?service=1")).toBe(
      "/navalha-teste?service=1",
    );
  });

  it("rejects external and authentication redirects", () => {
    expect(getSafeRedirectTo("https://example.com")).toBe("/dashboard");
    expect(getSafeRedirectTo("/login")).toBe("/dashboard");
    expect(getSafeRedirectTo("/cadastro")).toBe("/dashboard");
    expect(getSafeRedirectTo(undefined, "/")).toBe("/");
  });
});
