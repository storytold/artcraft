import { createStorytellerApiHostSync } from "./StorytellerApiHostSync";

describe("createStorytellerApiHostSync", () => {
  it("installs the native host before resolving", async () => {
    let currentHost = "https://api.example.test";
    const sync = createStorytellerApiHostSync({
      getNativeHost: async () => "http://localhost:12345",
      getCurrentHost: () => currentHost,
      setCurrentHost: (host) => {
        currentHost = host;
      },
    });

    await expect(sync()).resolves.toEqual({
      host: "http://localhost:12345",
      changed: true,
      source: "native",
    });
    expect(currentHost).toBe("http://localhost:12345");
  });

  it("shares one native request between concurrent callers", async () => {
    let resolveHost!: (host: string) => void;
    const getNativeHost = jest.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveHost = resolve;
        }),
    );
    const sync = createStorytellerApiHostSync({
      getNativeHost,
      getCurrentHost: () => "https://api.example.test",
      setCurrentHost: () => undefined,
    });

    const first = sync();
    const second = sync();
    expect(second).toBe(first);
    expect(getNativeHost).toHaveBeenCalledTimes(1);

    resolveHost("https://native.example.test");
    await expect(first).resolves.toMatchObject({
      host: "https://native.example.test",
      source: "native",
    });
  });

  it("uses a successful cached host without repeating a changed result", async () => {
    let now = 100;
    let currentHost = "https://api.example.test";
    const getNativeHost = jest.fn(async () => "https://native.example.test");
    const sync = createStorytellerApiHostSync({
      getNativeHost,
      getCurrentHost: () => currentHost,
      setCurrentHost: (host) => {
        currentHost = host;
      },
      now: () => now,
      syncThresholdMs: 10,
    });

    await expect(sync()).resolves.toMatchObject({
      changed: true,
      source: "native",
    });
    now = 105;
    await expect(sync()).resolves.toEqual({
      host: "https://native.example.test",
      changed: false,
      source: "cache",
    });
    expect(getNativeHost).toHaveBeenCalledTimes(1);

    now = 111;
    await expect(sync()).resolves.toEqual({
      host: "https://native.example.test",
      changed: false,
      source: "native",
    });
    expect(getNativeHost).toHaveBeenCalledTimes(2);
  });

  it("retries after a native failure", async () => {
    const getNativeHost = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error("native unavailable"))
      .mockResolvedValueOnce("https://native.example.test");
    const sync = createStorytellerApiHostSync({
      getNativeHost,
      getCurrentHost: () => "https://api.example.test",
      setCurrentHost: () => undefined,
    });

    await expect(sync()).rejects.toThrow("native unavailable");
    await expect(sync()).resolves.toMatchObject({
      host: "https://native.example.test",
    });
    expect(getNativeHost).toHaveBeenCalledTimes(2);
  });

  it("does not trust the cache when another caller changed the host store", async () => {
    let currentHost = "https://api.example.test";
    const getNativeHost = jest.fn(async () => "https://native.example.test");
    const sync = createStorytellerApiHostSync({
      getNativeHost,
      getCurrentHost: () => currentHost,
      setCurrentHost: (host) => {
        currentHost = host;
      },
    });

    await sync();
    currentHost = "https://other.example.test";
    await expect(sync()).resolves.toMatchObject({
      changed: true,
      source: "native",
    });
    expect(getNativeHost).toHaveBeenCalledTimes(2);
    expect(currentHost).toBe("https://native.example.test");
  });

  it.each([undefined, null, "", "   "])(
    "rejects a missing native host (%p)",
    async (nativeHost) => {
      const setCurrentHost = jest.fn();
      const sync = createStorytellerApiHostSync({
        getNativeHost: async () => nativeHost,
        getCurrentHost: () => "https://api.example.test",
        setCurrentHost,
      });

      await expect(sync()).rejects.toThrow(
        "Tauri app info did not provide a Storyteller API host",
      );
      expect(setCurrentHost).not.toHaveBeenCalled();
    },
  );

  it("does not cache a host rejected by the host store", async () => {
    const getNativeHost = jest.fn(async () => "not-a-url");
    const sync = createStorytellerApiHostSync({
      getNativeHost,
      getCurrentHost: () => "https://api.example.test",
      setCurrentHost: () => {
        throw new Error("invalid host");
      },
    });

    await expect(sync()).rejects.toThrow("invalid host");
    await expect(sync()).rejects.toThrow("invalid host");
    expect(getNativeHost).toHaveBeenCalledTimes(2);
  });
});
