import { TASK_QUEUE_LAST_READ_KEY, readTaskQueueLastReadAt } from "~/components/signaled/TopBar/taskQueueStorage";

const realStorage = (globalThis as Record<string, unknown>).localStorage;

const stubStorage = (getItem: (key: string) => string | null) => {
  Object.defineProperty(globalThis, "localStorage", { value: { getItem }, configurable: true });
};

afterEach(() => {
  if (realStorage === undefined) delete (globalThis as Record<string, unknown>).localStorage;
  else Object.defineProperty(globalThis, "localStorage", { value: realStorage, configurable: true });
});

describe("readTaskQueueLastReadAt (#1984)", () => {
  it("returns the stored timestamp", () => {
    stubStorage(() => "1728000000000");
    expect(readTaskQueueLastReadAt()).toBe(1728000000000);
  });

  it("returns 0 when nothing is stored", () => {
    stubStorage(() => null);
    expect(readTaskQueueLastReadAt()).toBe(0);
  });

  it("returns 0 instead of throwing when the read is denied", () => {
    stubStorage(() => {
      throw new DOMException("Generated task queue read denial", "SecurityError");
    });
    expect(readTaskQueueLastReadAt()).toBe(0);
  });

  it("returns 0 for a corrupt value instead of NaN", () => {
    stubStorage(() => "not-a-timestamp");
    expect(readTaskQueueLastReadAt()).toBe(0);
  });

  it("reads exactly the task-queue key", () => {
    const seen: string[] = [];
    stubStorage((key) => {
      seen.push(key);
      return null;
    });
    readTaskQueueLastReadAt();
    expect(seen).toEqual([TASK_QUEUE_LAST_READ_KEY]);
  });
});
