import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRaw } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: queryRaw },
}));

import { GET } from "@/app/api/health/route";

describe("health endpoint", () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  it("reports a healthy database", async () => {
    queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      database: "ok",
    });
  });

  it("reports database failures as unavailable", async () => {
    queryRaw.mockRejectedValue(new Error("database unavailable"));

    const response = await GET();

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      status: "error",
      database: "unavailable",
    });
  });
});
