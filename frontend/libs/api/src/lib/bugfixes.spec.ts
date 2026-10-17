import { beforeEach, describe, expect, it, vi } from "vitest";

// StorytellerApiHostStore touches `window` at import time; stub it first.
vi.hoisted(() => {
  (globalThis as any).window = {};
});

// All HTTP goes through FetchProxy; replace it with a controllable mock.
const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@storyteller/tauri-utils", () => ({ FetchProxy: fetchMock }));

import { ApiManager, HttpApiError } from "./ApiManager.js";
import { MiscApi } from "./MiscApi.js";
import { VideoApi } from "./VideoApi.js";
import { EngineApi } from "./EngineApi.js";
import { PromptsApi } from "./PromptsApi.js";
import { PasswordResetApi } from "./PasswordResetApi.js";

// Build a minimal Response-like object.
const res = (ok: boolean, status: number, json: () => Promise<any>) => ({
  ok,
  status,
  json,
});
const okJson = (body: any) => res(true, 200, async () => body);
const htmlError = (status: number) =>
  res(false, status, async () => {
    throw new SyntaxError("Unexpected token <");
  });

beforeEach(() => {
  fetchMock.mockReset();
});

describe("ApiManager query building", () => {
  it("uses & when the endpoint already has a query", async () => {
    fetchMock.mockResolvedValue(okJson({}));
    await new ApiManager().fetch("http://x/a?b=1", {
      method: "GET",
      query: { c: "2" },
    });
    expect(fetchMock.mock.calls[0][0]).toBe("http://x/a?b=1&c=2");
  });

  it("does not append a bare ? for an empty query", async () => {
    fetchMock.mockResolvedValue(okJson({}));
    await new ApiManager().fetch("http://x/a", { method: "GET", query: {} });
    expect(fetchMock.mock.calls[0][0]).toBe("http://x/a");
  });
});

describe("ApiManager.fetchMultipartFormData", () => {
  it("throws HttpApiError for a non-JSON error body", async () => {
    fetchMock.mockResolvedValue(htmlError(502));
    await expect(
      new ApiManager().fetchMultipartFormData("http://x", {
        method: "POST",
        body: new FormData(),
      }),
    ).rejects.toBeInstanceOf(HttpApiError);
  });

  it("still returns a JSON error body", async () => {
    fetchMock.mockResolvedValue(
      res(false, 400, async () => ({ success: false, BadInput: "bad" })),
    );
    const out = await new ApiManager().fetchMultipartFormData<any>("http://x", {
      method: "POST",
      body: new FormData(),
    });
    expect(out.BadInput).toBe("bad");
  });
});

describe("error message typos", () => {
  it("MiscApi returns err.message", async () => {
    fetchMock.mockRejectedValue(new Error("boom"));
    const out = await new MiscApi().GetStatusAlertCheck();
    expect(out).toEqual({ success: false, errorMessage: "boom" });
  });

  it("VideoApi.EnqueueStudio returns errorMessage", async () => {
    fetchMock.mockRejectedValue(new Error("boom"));
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const out = await new VideoApi().EnqueueStudio({
      enqueueVideo: {} as any,
    });
    spy.mockRestore();
    expect(out).toEqual({ success: false, errorMessage: "boom" });
  });
});

describe("snapshot uploads with non-JSON bodies", () => {
  const file = new Blob(["x"]) as File;
  it("EngineApi uses FetchProxy and returns an error shape", async () => {
    fetchMock.mockResolvedValue(htmlError(502));
    const out = await new EngineApi().uploadSceneSnapshot({ screenshot: file });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(out.success).toBe(false);
  });

  it("PromptsApi returns an error shape", async () => {
    fetchMock.mockResolvedValue(htmlError(502));
    const out = await new PromptsApi().uploadSceneSnapshot({
      screenshot: file,
    });
    expect(out.success).toBe(false);
  });
});

describe("PromptsApi.pollJobSession", () => {
  it("returns an error shape on HTTP failure", async () => {
    fetchMock.mockResolvedValue(htmlError(404));
    const out = await new PromptsApi().pollJobSession("job_1");
    expect(out.success).toBe(false);
    expect(out.errorMessage).toContain("404");
  });

  it("returns an error shape when state is missing", async () => {
    fetchMock.mockResolvedValue(okJson({ success: true }));
    const out = await new PromptsApi().pollJobSession("job_1");
    expect(out.success).toBe(false);
  });
});

describe("PasswordResetApi.RedeemPasswordReset", () => {
  it("falls back to the generic message for a non-JSON error body", async () => {
    fetchMock.mockResolvedValue(htmlError(502));
    const out = await new PasswordResetApi().RedeemPasswordReset({
      resetToken: "t",
      newPassword: "a",
      newPasswordValidation: "a",
    });
    expect(out.success).toBe(false);
    expect(out.errorMessage).toBe("Failed to reset password. Please try again.");
  });
});
