import {
  TASK_QUEUE_LAST_READ_KEY,
  readTaskQueueLastReadAt,
  writeTaskQueueLastReadAt,
} from "~/components/signaled/TopBar/taskQueueStorage";

const realStorage = (globalThis as Record<string, unknown>).localStorage;

const stubStorage = (storage: {
  getItem?: (key: string) => string | null;
  setItem?: (key: string, value: string) => void;
}) => {
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
};

afterEach(() => {
  if (realStorage === undefined) delete (globalThis as Record<string, unknown>).localStorage;
  else Object.defineProperty(globalThis, "localStorage", { value: realStorage, configurable: true });
});

describe("readTaskQueueLastReadAt (#1984)", () => {
  it("returns the stored timestamp", () => {
    stubStorage({ getItem: () => "1728000000000" });
    expect(readTaskQueueLastReadAt()).toBe(1728000000000);
  });

  it("returns 0 when nothing is stored", () => {
    stubStorage({ getItem: () => null });
    expect(readTaskQueueLastReadAt()).toBe(0);
  });

  it("returns 0 instead of throwing when the read is denied", () => {
    stubStorage({
      getItem: () => {
        throw new DOMException("Generated task queue read denial", "SecurityError");
      },
    });
    expect(readTaskQueueLastReadAt()).toBe(0);
  });

  it("returns 0 for a corrupt value instead of NaN", () => {
    stubStorage({ getItem: () => "not-a-timestamp" });
    expect(readTaskQueueLastReadAt()).toBe(0);
  });

  it("reads exactly the task-queue key", () => {
    const seen: string[] = [];
    stubStorage({
      getItem: (key) => {
        seen.push(key);
        return null;
      },
    });
    readTaskQueueLastReadAt();
    expect(seen).toEqual([TASK_QUEUE_LAST_READ_KEY]);
  });
});

describe("writeTaskQueueLastReadAt (#1984)", () => {
  it("writes the timestamp under the task-queue key", () => {
    const written: Array<[string, string]> = [];
    stubStorage({
      setItem: (key, value) => {
        written.push([key, value]);
      },
    });
    writeTaskQueueLastReadAt(1728000000000);
    expect(written).toEqual([[TASK_QUEUE_LAST_READ_KEY, "1728000000000"]]);
  });

  it("does not throw when the write is denied", () => {
    stubStorage({
      setItem: () => {
        throw new DOMException("Generated task queue write denial", "SecurityError");
      },
    });
    expect(() => writeTaskQueueLastReadAt(1728000000000)).not.toThrow();
  });
});
