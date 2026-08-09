import { bootstrapArtcraftApp } from "./bootstrapArtcraftApp";

const nativeResult = {
  host: "https://native.example.test",
  changed: true,
  source: "native" as const,
};

describe("bootstrapArtcraftApp", () => {
  it("sets the desktop host before rendering", async () => {
    const order: string[] = [];

    await expect(
      bootstrapArtcraftApp({
        isDesktopApp: () => true,
        syncApiHost: async () => {
          order.push("host");
          return nativeResult;
        },
        refreshSession: async () => {
          order.push("session");
        },
        renderApp: () => order.push("render"),
        renderApiHostError: () => order.push("error"),
      }),
    ).resolves.toBe(true);

    expect(order[0]).toBe("host");
    expect(order).toContain("render");
    expect(order).not.toContain("error");
  });

  it("skips native synchronization on the web", async () => {
    const syncApiHost = jest.fn(async () => nativeResult);
    const refreshSession = jest.fn(async () => undefined);
    const renderApp = jest.fn();

    await expect(
      bootstrapArtcraftApp({
        isDesktopApp: () => false,
        syncApiHost,
        refreshSession,
        renderApp,
        renderApiHostError: jest.fn(),
      }),
    ).resolves.toBe(true);

    expect(syncApiHost).not.toHaveBeenCalled();
    expect(refreshSession).not.toHaveBeenCalled();
    expect(renderApp).toHaveBeenCalledTimes(1);
  });

  it("withholds desktop rendering when the native host cannot be installed", async () => {
    const error = new Error("native unavailable");
    const renderApp = jest.fn();
    const renderApiHostError = jest.fn();

    await expect(
      bootstrapArtcraftApp({
        isDesktopApp: () => true,
        syncApiHost: async () => {
          throw error;
        },
        refreshSession: async () => undefined,
        renderApp,
        renderApiHostError,
      }),
    ).resolves.toBe(false);

    expect(renderApp).not.toHaveBeenCalled();
    expect(renderApiHostError).toHaveBeenCalledWith(error);
  });

  it("does not refresh a session when the host is unchanged", async () => {
    const refreshSession = jest.fn(async () => undefined);

    await bootstrapArtcraftApp({
      isDesktopApp: () => true,
      syncApiHost: async () => ({ ...nativeResult, changed: false }),
      refreshSession,
      renderApp: jest.fn(),
      renderApiHostError: jest.fn(),
    });

    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("renders even when the noncritical session refresh rejects", async () => {
    const reportSessionRefreshError = jest.fn();
    const renderApp = jest.fn();

    await expect(
      bootstrapArtcraftApp({
        isDesktopApp: () => true,
        syncApiHost: async () => nativeResult,
        refreshSession: async () => {
          throw new Error("session unavailable");
        },
        renderApp,
        renderApiHostError: jest.fn(),
        reportSessionRefreshError,
      }),
    ).resolves.toBe(true);

    await Promise.resolve();
    await Promise.resolve();
    expect(renderApp).toHaveBeenCalledTimes(1);
    expect(reportSessionRefreshError).toHaveBeenCalledTimes(1);
  });

  it("renders even when the noncritical session refresh throws synchronously", async () => {
    const reportSessionRefreshError = jest.fn();
    const renderApp = jest.fn();

    await expect(
      bootstrapArtcraftApp({
        isDesktopApp: () => true,
        syncApiHost: async () => nativeResult,
        refreshSession: () => {
          throw new Error("session setup failed");
        },
        renderApp,
        renderApiHostError: jest.fn(),
        reportSessionRefreshError,
      }),
    ).resolves.toBe(true);

    await Promise.resolve();
    await Promise.resolve();
    expect(renderApp).toHaveBeenCalledTimes(1);
    expect(reportSessionRefreshError).toHaveBeenCalledTimes(1);
  });
});
