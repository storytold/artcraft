import { WaveformCache } from "./service";

const requests: Array<{ resolve: (response: Response) => void }> = [];
const observed: Promise<unknown>[] = [];
let fetchSource: ReturnType<typeof vi.fn>;

// Failed HTTP responses do not reach audio decoding or retime calculations.
// Fail loudly if a test accidentally exercises those unrelated paths.
vi.mock("../../media/audio", () => ({ createAudioContext: () => { throw new Error("Unexpected decoder call"); } }));
vi.mock("../../media/waveform-summary", () => ({ buildSourceWaveformSummary: () => { throw new Error("Unexpected waveform calculation"); } }));

beforeEach(() => {
  requests.length = 0;
  observed.length = 0;
  fetchSource = vi.fn(() => new Promise<Response>((resolve) => requests.push({ resolve })));
  vi.stubGlobal("fetch", fetchSource);
});

afterEach(async () => {
  for (const request of requests) request.resolve(new Response("", { status: 503 }));
  await Promise.allSettled(observed);
  vi.unstubAllGlobals();
});

it("keeps the replacement download cached when an invalidated source request fails", async () => {
  const cache = new WaveformCache();
  const previous = requestSummary(cache);
  cache.clearSource({ sourceKey: "media:audio-a" });
  const replacement = requestSummary(cache);
  requests[0].resolve(new Response("", { status: 503 }));
  await expect(previous).rejects.toThrow("Failed to fetch waveform source: 503");

  const joined = requestSummary(cache);
  expect(fetchSource).toHaveBeenCalledTimes(2);
  expect(joined).toBe(replacement);
});

it("keeps the new project request cached after clearing all older summaries", async () => {
  const cache = new WaveformCache();
  const previous = requestSummary(cache);
  cache.clearAll();
  const replacement = requestSummary(cache);
  requests[0].resolve(new Response("", { status: 503 }));
  await expect(previous).rejects.toThrow("Failed to fetch waveform source: 503");

  const joined = requestSummary(cache);
  expect(fetchSource).toHaveBeenCalledTimes(2);
  expect(joined).toBe(replacement);
});

it("still shares concurrent requests for the same active source", () => {
  const cache = new WaveformCache();
  const first = requestSummary(cache);
  const second = requestSummary(cache);
  expect(first).toBe(second);
  expect(fetchSource).toHaveBeenCalledTimes(1);
});

it("still retries when the current source request itself fails", async () => {
  const cache = new WaveformCache();
  const failed = requestSummary(cache);
  requests[0].resolve(new Response("", { status: 404 }));
  await expect(failed).rejects.toThrow("Failed to fetch waveform source: 404");
  const retry = requestSummary(cache);
  expect(retry).not.toBe(failed);
  expect(fetchSource).toHaveBeenCalledTimes(2);
});

function requestSummary(cache: WaveformCache) {
  const promise = cache.getSourceSummary({ sourceKey: "media:audio-a", audioUrl: "https://media.example/audio-a.wav" });
  // Record and immediately observe every potentially rejected promise so
  // teardown can settle pending fetches without leaking unhandled rejection.
  observed.push(promise);
  void promise.catch(() => {});
  return promise;
}
