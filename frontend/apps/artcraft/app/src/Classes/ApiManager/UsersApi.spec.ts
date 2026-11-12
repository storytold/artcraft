import { describe, expect, it, vi } from "vitest";
import { UsersApi } from "./UsersApi";

describe("UsersApi", () => {
  it("returns the connection error when the session request fails", async () => {
    const api = new UsersApi();
    vi.spyOn(api, "fetch").mockRejectedValueOnce(new Error("network unavailable"));

    await expect(api.GetSession()).resolves.toMatchObject({
      success: false,
      errorMessage: "network unavailable",
    });
  });
});
