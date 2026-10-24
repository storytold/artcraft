import { describe, expect, it } from "vitest";
import { remapResponseToAudioMediaItems } from "./utilities";

// Only the fields the mapper reads; cast because MediaInfo has many more required fields.
const media = (over: Record<string, unknown>) =>
  ({ token: "m_1", public_bucket_path: "/a.mp3", ...over }) as never;

describe("remapResponseToAudioMediaItems", () => {
  it("maps core fields and fills defaults", () => {
    const [item] = remapResponseToAudioMediaItems([media({})], []);
    expect(item).toMatchObject({
      version: 1,
      media_id: "m_1",
      object_uuid: "m_1",
      name: "Media Audio",
      description: "",
      publicBucketPath: "/a.mp3",
      category: "unknown",
      isMine: true,
      isNew: false,
    });
    expect(item.length).toBeUndefined();
  });

  it("prefers the media title, then the origin model title", () => {
    const withTitle = remapResponseToAudioMediaItems(
      [media({ maybe_title: "Mine", origin: { maybe_model: { title: "Model" } } })],
      [],
    );
    expect(withTitle[0].name).toBe("Mine");
    const withModel = remapResponseToAudioMediaItems(
      [media({ origin: { maybe_model: { title: "Model" } } })],
      [],
    );
    expect(withModel[0].name).toBe("Model");
  });

  it("picks the category from the origin product category unless it is 'unknown'", () => {
    const a = remapResponseToAudioMediaItems(
      [media({ origin: { product_category: "tts" }, origin_category: "x" })],
      [],
    );
    expect(a[0].category).toBe("tts");
    const b = remapResponseToAudioMediaItems(
      [media({ origin: { product_category: "unknown" }, origin_category: "x" })],
      [],
    );
    expect(b[0].category).toBe("x");
  });

  it("converts the duration the way the engine expects (seconds * 60)", () => {
    // Pins current behavior: 2000 ms -> 2 s -> 120. If `length` is meant to be
    // seconds, this is a unit bug to fix together with its consumers.
    const [item] = remapResponseToAudioMediaItems([media({ maybe_duration_millis: 2000 })], []);
    expect(item.length).toBe(120);
  });

  it("flags items as new only when a previous list exists and does not already hold them", () => {
    const prev = remapResponseToAudioMediaItems([media({ token: "old" })], []);
    const out = remapResponseToAudioMediaItems([media({ token: "old" }), media({ token: "fresh" })], prev);
    expect(out.map((i) => i.isNew)).toEqual([false, true]);
  });
});
