import type { Mock } from "vitest";

// Stands in for the real worker: records what it was sent and lets a test
// answer, stay silent or fail on its behalf.
const { FakeWorker } = vi.hoisted(() => {
  class FakeWorker {
    static instances: FakeWorker[] = [];
    onmessage: ((event: { data: unknown }) => void) | null = null;
    onerror: (() => void) | null = null;
    onmessageerror: (() => void) | null = null;
    posted: { id: number }[] = [];
    terminated = false;

    constructor() {
      FakeWorker.instances.push(this);
    }

    postMessage(message: { id: number }): void {
      this.posted.push(message);
    }

    terminate(): void {
      this.terminated = true;
    }

    ready(): void {
      this.onmessage?.({ data: { ready: true } });
    }

    finish(job: number): void {
      const { id } = this.posted[job];
      this.onmessage?.({ data: { id, ok: true, glb: new ArrayBuffer(4) } });
    }
  }
  return { FakeWorker };
});

vi.mock("./convertModelToGlb.worker?worker&inline", () => ({
  default: FakeWorker,
}));

vi.mock("./modelToGlb", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./modelToGlb")>()),
  convertModelBufferToGlb: vi.fn(async () => new ArrayBuffer(4)),
}));

describe("convertModelToGlb", () => {
  let convertModelToGlb: (file: File) => Promise<File>;
  let timeoutMs: number;
  let convertOnMainThread: Mock;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.stubGlobal("Worker", FakeWorker);
    FakeWorker.instances = [];
    // The queue and the worker handle are module state: start each test
    // from a fresh copy.
    vi.resetModules();
    const converter = await import("./convertModelToGlb");
    convertModelToGlb = converter.convertModelToGlb;
    timeoutMs = converter.CONVERSION_TIMEOUT_MS;
    const parser = await import("./modelToGlb");
    convertOnMainThread = parser.convertModelBufferToGlb as Mock;
    convertOnMainThread.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("sends the worker one file at a time", async () => {
    const first = convertModelToGlb(modelFile("first.stl"));
    const second = convertModelToGlb(modelFile("second.obj"));
    await settle();
    const [worker] = FakeWorker.instances;
    expect(worker.posted).toHaveLength(1);

    worker.finish(0);
    expect((await first).name).toBe("first.glb");
    expect(worker.posted).toHaveLength(2);

    worker.finish(1);
    expect((await second).name).toBe("second.glb");
    expect(FakeWorker.instances).toHaveLength(1);
  });

  it("stops a conversion that outlives the time budget", async () => {
    const stuck = convertModelToGlb(modelFile("stuck.stl"));
    const waiting = convertModelToGlb(modelFile("waiting.stl"));
    const stuckResult = expect(stuck).rejects.toThrow("took longer than");
    await settle();
    FakeWorker.instances[0].ready();

    await vi.advanceTimersByTimeAsync(timeoutMs);
    await stuckResult;
    expect(FakeWorker.instances[0].terminated).toBe(true);

    // The file queued behind it runs on a fresh worker.
    expect(FakeWorker.instances).toHaveLength(2);
    FakeWorker.instances[1].finish(0);
    expect((await waiting).name).toBe("waiting.glb");
    expect(convertOnMainThread).not.toHaveBeenCalled();
  });

  it("doesn't rerun a file on the main thread after it crashes the worker", async () => {
    const crashing = convertModelToGlb(modelFile("crashing.stl"));
    const waiting = convertModelToGlb(modelFile("waiting.stl"));
    const crashingResult = expect(crashing).rejects.toThrow(
      "stopped unexpectedly",
    );
    await settle();
    FakeWorker.instances[0].ready();

    FakeWorker.instances[0].onerror?.();
    await crashingResult;
    expect(FakeWorker.instances[0].terminated).toBe(true);

    expect(FakeWorker.instances).toHaveLength(2);
    FakeWorker.instances[1].finish(0);
    expect((await waiting).name).toBe("waiting.glb");
    expect(convertOnMainThread).not.toHaveBeenCalled();
  });

  it("converts on the main thread when the worker never starts", async () => {
    const first = convertModelToGlb(modelFile("first.stl"));
    const second = convertModelToGlb(modelFile("second.stl"));
    await settle();

    // An error before the ready message: the script failed to load.
    FakeWorker.instances[0].onerror?.();
    expect((await first).name).toBe("first.glb");
    expect((await second).name).toBe("second.glb");
    expect(convertOnMainThread).toHaveBeenCalledTimes(2);

    // And it stays there: no second worker is started.
    await convertModelToGlb(modelFile("third.stl"));
    expect(FakeWorker.instances).toHaveLength(1);
    expect(convertOnMainThread).toHaveBeenCalledTimes(3);
  });
});

// ─── helpers ──────────────────────────────────────────────────────────────

// jsdom's File has no arrayBuffer().
function modelFile(name: string): File {
  return Object.assign(new File(["mesh"], name), {
    arrayBuffer: async () => new ArrayBuffer(4),
  });
}

// Lets the file reads finish so the queued jobs reach the worker.
async function settle(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
}
