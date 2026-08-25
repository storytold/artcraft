import { describe, expect, it } from "vitest";

import { expectValid, type SchemaName } from "../../test/helpers/contract";
import { GENERATION_KINDS } from "../src/catalogue";
import { createFakeUpstream } from "../src/index";

const RESPONSE_SCHEMA: Record<(typeof GENERATION_KINDS)[number], SchemaName> = {
  image: "OmniGenImageCostResponse",
  video: "OmniGenVideoCostResponse",
  audio: "OmniGenAudioCostResponse",
  mesh: "OmniGenMeshCostResponse",
  splat: "OmniGenSplatCostResponse",
};

const A_MODEL = {
  image: "seedream_4",
  video: "seedance_2p0",
  audio: "suno_music",
  mesh: "meshy_v6",
  splat: "marble_1p0",
} as const;

async function cost(kind: string, body: unknown) {
  return createFakeUpstream().request(`/v1/omni_gen/cost/${kind}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("cost estimates", () => {
  it.each(GENERATION_KINDS)(
    "estimates a %s generation in the spec shape, without a session",
    async (kind) => {
      const response = await cost(kind, { model: A_MODEL[kind], prompt: "a corgi" });
      expect(response.status).toBe(200);
      const body = await response.json<{ cost_in_credits: number }>();
      expectValid(RESPONSE_SCHEMA[kind], body);
      expect(body.cost_in_credits).toBeGreaterThan(0);
    },
  );

  it("scales video by batch count and duration", async () => {
    const one = await (
      await cost("video", { model: "seedance_2p0", duration_seconds: 6 })
    ).json<{ cost_in_credits: number }>();
    const twelve = await (
      await cost("video", { model: "seedance_2p0", duration_seconds: 12 })
    ).json<{ cost_in_credits: number }>();
    const batch = await (
      await cost("video", { model: "seedance_2p0", duration_seconds: 6, video_batch_count: 2 })
    ).json<{ cost_in_credits: number }>();
    expect(twelve.cost_in_credits).toBe(one.cost_in_credits * 2);
    expect(batch.cost_in_credits).toBe(one.cost_in_credits * 2);
  });

  it("rejects an unknown model for the kind, and a missing model, with the common envelope", async () => {
    const wrongKind = await cost("image", { model: "seedance_2p0" });
    expect(wrongKind.status).toBe(400);
    const body = await wrongKind.json<{ message: string }>();
    expectValid("CommonWebError", body);
    expect(body.message).toBe("unknown model: seedance_2p0");
    expect((await cost("image", { prompt: "no model" })).status).toBe(400);
  });
});
