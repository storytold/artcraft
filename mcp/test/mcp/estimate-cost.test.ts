import { describe, expect, it } from "vitest";

import { estimateCost } from "../../src/mcp/tools/estimate-cost";
import { ToolFailure } from "../../src/mcp/tools/types";
import { principalFromProps } from "../../src/tokens/principal";
import { createUpstreamClient } from "../../src/upstream/client";
import { createFakeUpstream } from "../../fake-upstream/src/index";
import { SIGNED_SESSION } from "../helpers/fixtures";

const principal = principalFromProps({
  credential: { kind: "session", signedSession: SIGNED_SESSION },
  grantIssuedAt: 1_800_000_000_000,
  userToken: "user_x",
  username: "x",
  displayName: "X",
  scopes: ["read:catalog"],
});

/** Routes the tool's upstream calls into the fake, recording the bodies sent. */
function fakeUpstream() {
  const fake = createFakeUpstream();
  const sent: { path: string; body: unknown }[] = [];
  const upstream = createUpstreamClient({
    baseUrl: "https://api.example.test",
    use: "read",
    credential: principal.credential,
    fetch: async (input, init) => {
      const request = new Request(input, init);
      sent.push({ path: new URL(request.url).pathname, body: await request.clone().json() });
      return fake.fetch(new Request(`http://fake${new URL(request.url).pathname}`, request));
    },
  });
  return { sent, context: { principal, upstream } };
}

describe("estimate_cost", () => {
  it("passes the model and parameters through and labels the result as public pricing", async () => {
    const { sent, context } = fakeUpstream();
    const result = await estimateCost.handler(context, {
      kind: "video",
      model: "seedance_2p0",
      parameters: { prompt: "a corgi", duration_seconds: 12, aspect_ratio: "wide_sixteen_by_nine" },
    });
    expect(sent).toEqual([
      {
        path: "/v1/omni_gen/cost/video",
        body: {
          prompt: "a corgi",
          duration_seconds: 12,
          aspect_ratio: "wide_sixteen_by_nine",
          model: "seedance_2p0",
        },
      },
    ]);
    expect(result.structured).toMatchObject({
      kind: "video",
      model: "seedance_2p0",
      cost_in_credits: 420,
      cost_in_usd_cents: 140,
      is_free: false,
      has_watermark: false,
      failures_are_refunded: true,
    });
    expect(result.structured.pricing_note).toMatch(/^Public pricing/);
    expect(result.text).toBe(
      "Estimated 420 credits (about $1.40) for a video generation with seedance_2p0. failures are refunded. Public pricing; the user's plan may lower it.",
    );
  });

  it("drops null parameters and works without any", async () => {
    const { sent, context } = fakeUpstream();
    await estimateCost.handler(context, {
      kind: "image",
      model: "seedream_4",
      parameters: { prompt: null, resolution: "two_k" },
    });
    expect(sent[0]?.body).toEqual({ resolution: "two_k", model: "seedream_4" });
    const bare = await estimateCost.handler(context, { kind: "mesh", model: "meshy_v6" });
    expect(bare.structured.cost_in_credits).toBe(104);
  });

  it("surfaces upstream's validation message for a model of the wrong kind", async () => {
    const { context } = fakeUpstream();
    await expect(
      estimateCost.handler(context, { kind: "image", model: "seedance_2p0" }),
    ).rejects.toThrow(/unknown model: seedance_2p0/);
    await expect(
      estimateCost.handler(context, { kind: "image", model: "seedance_2p0" }),
    ).rejects.toThrow(ToolFailure);
  });

  it("estimates every kind", async () => {
    const { context } = fakeUpstream();
    const models = {
      image: "seedream_4",
      video: "seedance_2p0",
      audio: "suno_music",
      mesh: "meshy_v6",
      splat: "marble_1p0",
    } as const;
    for (const [kind, model] of Object.entries(models) as [keyof typeof models, string][]) {
      const result = await estimateCost.handler(context, { kind, model });
      expect(result.structured.cost_in_credits).toBeGreaterThan(0);
    }
  });

  it("is declared read-only and scoped to read:catalog", () => {
    expect(estimateCost.requiredScope).toBe("read:catalog");
    expect(estimateCost.annotations.readOnlyHint).toBe(true);
  });
});
