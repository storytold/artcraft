import { describe, expect, it } from "vitest";

import { createFakeUpstream } from "../src/index";

describe("fake upstream", () => {
  it("identifies itself as fake on /_status", async () => {
    const response = await createFakeUpstream().request("/_status");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, fake: true });
  });

  it("knows nothing else yet", async () => {
    const response = await createFakeUpstream().request("/v1/session");
    expect(response.status).toBe(404);
  });
});
