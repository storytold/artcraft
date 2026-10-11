import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { JobStatus } from "@storyteller/api";
import { FetchProxy } from "@storyteller/tauri-utils";

vi.mock("@storyteller/tauri-utils", () => ({ FetchProxy: vi.fn() }));

import { useGenerationJobs } from "./useGenerationJobs";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function job(token: string, status = JobStatus.STARTED, mediaType = "audio") {
  return { job_token: token, created_at: "2026-10-10T12:00:00Z", updated_at: "2026-10-10T12:00:00Z", request: { inference_category: mediaType }, status: { status }, maybe_result: status === JobStatus.COMPLETE_SUCCESS ? { entity_token: `${token}-media`, media_links: { cdn_url: "https://example.test/audio.mp3" } } : null };
}

describe("generation request ownership", () => {
  let root: Root;
  let container: HTMLDivElement;
  let current: ReturnType<typeof useGenerationJobs>;
  let requests: ReturnType<typeof deferred<Response>>[];
  let mediaResponse: ReturnType<typeof deferred<Response>> | undefined;
  function Harness(props: { mediaType: "audio" | "image"; enabled?: boolean }) {
    current = useGenerationJobs(props);
    return <div>{current.inProgress.map((j) => j.id).join(",")}</div>;
  }
  async function mount(mediaType: "audio" | "image" = "audio", enabled = true) {
    await act(async () => root.render(<Harness mediaType={mediaType} enabled={enabled} />));
  }
  async function respond(index: number, jobs: any[]) {
    await act(async () => { requests[index].resolve(Response.json({ success: true, jobs })); });
  }
  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    requests = [];
    mediaResponse = undefined;
    vi.mocked(FetchProxy).mockImplementation((url: string, options: any) => {
      expect(options.credentials).toBe("include");
      if (url.endsWith("/v1/jobs/session")) {
        const request = deferred<Response>(); requests.push(request); return request.promise;
      }
      if (url.includes("/v1/media_files/file/")) {
        return mediaResponse?.promise ?? Promise.resolve(Response.json({ success: true, media_file: {} }));
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); });

  it("does not restore an older pending job after a newer completed response", async () => {
    await mount();
    await act(async () => { window.dispatchEvent(new Event("task-queue-update")); });
    await respond(1, [job("new", JobStatus.COMPLETE_SUCCESS)]);
    await respond(0, [job("old")]);
    expect(current.inProgress).toEqual([]);
    expect(container.textContent).toBe("");
  });
  it("ignores an obsolete media filter's response", async () => {
    await mount(); await mount("image");
    await respond(1, [job("image", JobStatus.STARTED, "image")]);
    await respond(0, [job("audio")]);
    expect(current.inProgress.map((j) => j.id)).toEqual(["image"]);
  });
  it("does not commit an outstanding request after polling is disabled", async () => {
    await mount(); await mount("audio", false); await respond(0, [job("late")]);
    expect(current.inProgress).toEqual([]);
  });
  it("ignores a superseded response whose batch expansion was already running", async () => {
    mediaResponse = deferred<Response>();
    await mount(); await respond(0, [job("pending")]);
    await act(async () => { window.dispatchEvent(new Event("task-queue-update")); });
    await respond(1, [job("old-completion", JobStatus.COMPLETE_SUCCESS)]);
    await act(async () => { window.dispatchEvent(new Event("task-queue-update")); });
    await respond(2, [job("current")]);
    await act(async () => { mediaResponse!.resolve(Response.json({ success: true, media_file: {} })); });
    expect(current.inProgress.map((j) => j.id)).toEqual(["current"]);
    expect(current.newlyCompleted).toEqual([]);
  });
  it("still publishes a current pending job and its completed replacement", async () => {
    await mount(); await respond(0, [job("current")]);
    expect(current.inProgress.map((j) => j.id)).toEqual(["current"]);
    await act(async () => { window.dispatchEvent(new Event("task-queue-update")); });
    await respond(1, [job("current", JobStatus.COMPLETE_SUCCESS)]);
    expect(current.inProgress).toEqual([]);
    expect(current.newlyCompleted.map((j) => j.id)).toEqual(["current-media"]);
  });
  it("keeps making progress when a newer poll is still pending", async () => {
    await mount();
    await act(async () => { window.dispatchEvent(new Event("task-queue-update")); });
    await respond(0, [job("slow-first")]);
    expect(current.inProgress.map((j) => j.id)).toEqual(["slow-first"]);
    await act(async () => { window.dispatchEvent(new Event("task-queue-update")); });
    await respond(1, [job("slow-second")]);
    expect(current.inProgress.map((j) => j.id)).toEqual(["slow-second"]);
    await respond(2, [job("slow-third")]);
    expect(current.inProgress.map((j) => j.id)).toEqual(["slow-third"]);
  });
  it("does not add historic completions during the initial load", async () => {
    await mount(); await respond(0, [job("historic", JobStatus.COMPLETE_SUCCESS)]);
    expect(current.newlyCompleted).toEqual([]);
  });
});
