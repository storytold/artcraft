import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Spec for the model-list hooks. Each of the five hooks (image, video, audio, mesh, splat) fetches its list once per
// session, caches it, drops disabled models, shares one request between hooks that mount together, and tells the host
// app's error notifier when the list cannot be loaded. The five copies are checked with the same table of tests.

const api = vi.hoisted(() => ({ calls: {} as Record<string, number>, impl: {} as Record<string, () => Promise<unknown>> }));

vi.mock("@storyteller/api", () => {
  const method = (name: string) => () => {
    api.calls[name] = (api.calls[name] ?? 0) + 1;
    return api.impl[name]();
  };
  return {
    OmniGenApi: class {
      getImageModels = method("image");
      getVideoModels = method("video");
      getAudioModels = method("audio");
      getMeshModels = method("mesh");
      getSplatModels = method("splat");
    },
  };
});

type Kind = "image" | "video" | "audio" | "mesh" | "splat";
const KINDS: Kind[] = ["image", "video", "audio", "mesh", "splat"];
const HOOKS: Record<Kind, string> = {
  image: "useOmniGenImageModels",
  video: "useOmniGenVideoModels",
  audio: "useOmniGenAudioModels",
  mesh: "useOmniGenMeshModels",
  splat: "useOmniGenSplatModels",
};

const ok = (...models: Array<{ model: string; is_disabled?: boolean }>) => Promise.resolve({ success: true, models });

// Every test gets a fresh copy of the module, because the caches live at module level.
async function load() {
  vi.resetModules();
  const mod = await import("./omni-gen-hooks");
  return mod as unknown as Record<string, () => { models: Array<{ model: string }>; isLoading: boolean; error: string | null }> &
    typeof import("./omni-gen-hooks");
}

beforeEach(() => {
  api.calls = {};
  api.impl = {};
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe.each(KINDS)("%s models hook", (kind) => {
  it("starts loading and then returns the models", async () => {
    api.impl[kind] = () => ok({ model: "a" }, { model: "b" });
    const mod = await load();
    const { result } = renderHook(() => mod[HOOKS[kind]]());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.models).toEqual([]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.models.map((m) => m.model)).toEqual(["a", "b"]);
    expect(result.current.error).toBeNull();
  });

  it("drops models that are marked disabled", async () => {
    api.impl[kind] = () => ok({ model: "a" }, { model: "off", is_disabled: true }, { model: "c", is_disabled: false });
    const mod = await load();
    const { result } = renderHook(() => mod[HOOKS[kind]]());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.models.map((m) => m.model)).toEqual(["a", "c"]);
  });

  it("fetches once for hooks that mount together and for hooks that mount later", async () => {
    api.impl[kind] = () => ok({ model: "a" });
    const mod = await load();
    const first = renderHook(() => mod[HOOKS[kind]]());
    const second = renderHook(() => mod[HOOKS[kind]]());
    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));
    const later = renderHook(() => mod[HOOKS[kind]]());
    expect(later.result.current.isLoading).toBe(false);
    expect(later.result.current.models.map((m) => m.model)).toEqual(["a"]);
    expect(api.calls[kind]).toBe(1);
  });

  it("reports an error and tells the notifier when the request fails", async () => {
    api.impl[kind] = () => Promise.reject(new Error("boom"));
    const mod = await load();
    const notifier = vi.fn();
    mod.setOmniGenErrorNotifier(notifier);
    const { result } = renderHook(() => mod[HOOKS[kind]]());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("boom");
    expect(result.current.models).toEqual([]);
    expect(notifier).toHaveBeenCalledWith(mod.OMNI_MODELS_OUTAGE_MESSAGE);
  });

  it("treats an empty list as a failure", async () => {
    api.impl[kind] = () => ok();
    const mod = await load();
    const notifier = vi.fn();
    mod.setOmniGenErrorNotifier(notifier);
    const { result } = renderHook(() => mod[HOOKS[kind]]());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toMatch(new RegExp(`No ${kind} models returned`));
    expect(notifier).toHaveBeenCalledTimes(1);
  });

  it("tries again on the next mount after a failure, and then recovers", async () => {
    let attempt = 0;
    api.impl[kind] = () => (attempt++ === 0 ? Promise.reject(new Error("down")) : ok({ model: "back" }));
    const mod = await load();
    const first = renderHook(() => mod[HOOKS[kind]]());
    await waitFor(() => expect(first.result.current.error).toBe("down"));
    first.unmount();
    const second = renderHook(() => mod[HOOKS[kind]]());
    await waitFor(() => expect(second.result.current.models.map((m) => m.model)).toEqual(["back"]));
    expect(second.result.current.error).toBeNull();
    expect(api.calls[kind]).toBe(2);
  });
});

describe("outage messages", () => {
  it("has different copy for loading the models and for starting a generation", async () => {
    const mod = await load();
    expect(mod.OMNI_MODELS_OUTAGE_MESSAGE).not.toBe(mod.OMNI_GENERATE_OUTAGE_MESSAGE);
  });
});
