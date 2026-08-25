import { describe, expect, it } from "vitest";

import { listModels } from "../../src/mcp/tools/list-models";
import { principalFromProps } from "../../src/tokens/principal";
import { createUpstreamClient } from "../../src/upstream/client";
import { modelsResponse } from "../../fake-upstream/src/catalogue";
import { SIGNED_SESSION } from "../helpers/fixtures";

const principal = principalFromProps({
  credential: { kind: "session", signedSession: SIGNED_SESSION },
  grantIssuedAt: 1_800_000_000_000,
  userToken: "user_x",
  username: "x",
  displayName: "X",
  scopes: ["read:catalog"],
});

/** Serves the fake's (spec-validated) catalogues, recording the requests. */
function catalogueUpstream() {
  const requests: URL[] = [];
  const upstream = createUpstreamClient({
    baseUrl: "https://api.example.test",
    use: "read",
    credential: principal.credential,
    fetch: (input) => {
      const url = new URL(new Request(input).url);
      requests.push(url);
      const kind = url.pathname.split("/").pop() as Parameters<typeof modelsResponse>[0];
      const filter = url.searchParams.get("provider");
      if (filter !== null && filter !== "all" && filter !== "artcraft") {
        return Promise.resolve(new Response("{}", { status: 400 }));
      }
      const body = modelsResponse(kind, filter ?? undefined);
      return Promise.resolve(
        new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } }),
      );
    },
  });
  return { requests, context: { principal, upstream } };
}

describe("list_models", () => {
  it("normalises a catalogue and passes the capability fields through verbatim", async () => {
    const { requests, context } = catalogueUpstream();
    const result = await listModels.handler(context, { kind: "video" });
    expect(requests.map((u) => u.pathname + u.search)).toEqual([
      "/v1/omni_gen/models/video?provider=all",
    ]);
    expect(result.structured.kind).toBe("video");
    const seedance = result.structured.models.find((m) => m.id === "seedance_2p0");
    expect(seedance).toMatchObject({ name: "Seedance 2.0", creator: "bytedance", disabled: false });
    expect(seedance?.capabilities).toMatchObject({
      duration_seconds_options: [4, 6, 8, 10],
      aspect_ratio_default: "wide_sixteen_by_nine",
      text_to_video_supported: true,
    });
    expect(seedance?.capabilities).not.toHaveProperty("model");
    expect(seedance?.capabilities).not.toHaveProperty("full_name");
    expect(result.structured.providers.some((p) => p.provider === "fal")).toBe(true);
    expect(result.text).toMatch(/^\d+ video models available: .*Seedance 2\.0 \(seedance_2p0\)/);
  });

  it("asks upstream for the complete catalogue and filters by provider itself", async () => {
    const { requests, context } = catalogueUpstream();
    const result = await listModels.handler(context, { kind: "image", provider: "midjourney" });
    expect(requests[0]?.search).toBe("?provider=all");
    expect(result.structured.models.map((m) => m.id)).toEqual([
      "midjourney_7",
      "midjourney_7_niji",
      "midjourney_8",
    ]);
    expect(result.structured.providers).toEqual([
      { provider: "midjourney", model_ids: ["midjourney_7", "midjourney_7_niji", "midjourney_8"] },
    ]);
  });

  it("filters the same way for kinds whose endpoint takes no query at all", async () => {
    const { requests, context } = catalogueUpstream();
    const result = await listModels.handler(context, { kind: "splat", provider: "world_labs" });
    expect(requests[0]?.search).toBe("");
    expect(result.structured.models.every((m) => m.creator === "world_labs")).toBe(true);
    expect(result.structured.models.map((m) => m.id)).not.toContain("triposplat");
  });

  it("serves every kind", async () => {
    const { context } = catalogueUpstream();
    for (const kind of ["image", "video", "audio", "mesh", "splat"] as const) {
      const result = await listModels.handler(context, { kind });
      expect(result.structured.models.length).toBeGreaterThan(0);
    }
  });

  it("is declared read-only and scoped to read:catalog", () => {
    expect(listModels.requiredScope).toBe("read:catalog");
    expect(listModels.annotations.readOnlyHint).toBe(true);
  });
});
