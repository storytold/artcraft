import { describe, expect, it } from "vitest";

import { expectValid, type SchemaName } from "../../test/helpers/contract";
import { GENERATION_KINDS, isKnownModel } from "../src/catalogue";
import { createFakeUpstream } from "../src/index";

const RESPONSE_SCHEMA: Record<(typeof GENERATION_KINDS)[number], SchemaName> = {
  image: "OmniGenImageModelsResponse",
  video: "OmniGenVideoModelsResponse",
  audio: "OmniGenAudioModelsResponse",
  mesh: "OmniGenMeshModelsResponse",
  splat: "OmniGenSplatModelsResponse",
};

interface ModelsBody {
  models: { model: string; full_name: string; model_creator: string }[];
  providers: { provider: string; models: { model: string }[] }[];
}

describe("model catalogues", () => {
  it.each(GENERATION_KINDS)("serves a spec-shaped %s catalogue without a session", async (kind) => {
    const response = await createFakeUpstream().request(`/v1/omni_gen/models/${kind}?provider=all`);
    expect(response.status).toBe(200);
    const body = await response.json<ModelsBody>();
    expectValid(RESPONSE_SCHEMA[kind], body);
    expect(body.models.length).toBeGreaterThan(0);
    expect(body.models.every((m) => m.full_name && m.model_creator)).toBe(true);
    const listed = new Set(body.providers.flatMap((p) => p.models.map((m) => m.model)));
    expect(body.models.every((m) => listed.has(m.model))).toBe(true);
  });

  it("defaults to the models Artcraft routes itself, like upstream", async () => {
    const video = await (
      await createFakeUpstream().request("/v1/omni_gen/models/video")
    ).json<ModelsBody>();
    expectValid("OmniGenVideoModelsResponse", video);
    expect(video.models.map((m) => m.model)).toEqual(["happy_horse_1p0"]);
    expect(video.providers.map((p) => p.provider)).toEqual(["artcraft"]);
    const image = await (
      await createFakeUpstream().request("/v1/omni_gen/models/image?provider=artcraft")
    ).json<ModelsBody>();
    expect(image.models).toEqual([]);
  });

  it("lists everything for kinds whose endpoint declares no filter", async () => {
    const audio = await (
      await createFakeUpstream().request("/v1/omni_gen/models/audio")
    ).json<ModelsBody>();
    expect(audio.models.length).toBe(5);
    const ignored = await (
      await createFakeUpstream().request("/v1/omni_gen/models/audio?provider=midjourney")
    ).json<ModelsBody>();
    expect(ignored.models.length).toBe(5);
  });

  it("rejects a provider value outside the endpoint's enum", async () => {
    const response = await createFakeUpstream().request(
      "/v1/omni_gen/models/image?provider=midjourney",
    );
    expect(response.status).toBe(400);
    expectValid("CommonWebError", await response.json());
  });

  it("knows its own model ids and nothing else", () => {
    expect(isKnownModel("video", "seedance_2p0")).toBe(true);
    expect(isKnownModel("image", "seedance_2p0")).toBe(false);
    expect(isKnownModel("image", "made_up_model")).toBe(false);
  });
});
