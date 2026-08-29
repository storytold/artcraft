export interface ApiHostSyncResult {
  host: string;
  changed: boolean;
  source: "native" | "cache";
}

export interface ApiHostSyncDependencies {
  getNativeHost: () => Promise<string | null | undefined>;
  getCurrentHost: () => string;
  setCurrentHost: (host: string) => void;
  now?: () => number;
  syncThresholdMs?: number;
}

/**
 * Creates a small synchronization coordinator for the native-configured API
 * host. Concurrent callers share the same native request, while a failed
 * request remains retryable.
 */
export const createStorytellerApiHostSync = ({
  getNativeHost,
  getCurrentHost,
  setCurrentHost,
  now = Date.now,
  syncThresholdMs = 10_000,
}: ApiHostSyncDependencies): (() => Promise<ApiHostSyncResult>) => {
  let inFlight: Promise<ApiHostSyncResult> | undefined;
  let lastSuccessAt: number | undefined;
  let lastHost: string | undefined;

  return () => {
    if (inFlight) {
      return inFlight;
    }

    if (
      lastSuccessAt !== undefined &&
      lastHost !== undefined &&
      getCurrentHost() === lastHost &&
      now() - lastSuccessAt <= syncThresholdMs
    ) {
      return Promise.resolve({
        host: lastHost,
        changed: false,
        source: "cache",
      });
    }

    const request = (async (): Promise<ApiHostSyncResult> => {
      const nativeHost = (await getNativeHost())?.trim();
      if (!nativeHost) {
        throw new Error(
          "Tauri app info did not provide a Storyteller API host",
        );
      }

      const changed = getCurrentHost() !== nativeHost;
      setCurrentHost(nativeHost);
      lastHost = nativeHost;
      lastSuccessAt = now();

      return { host: nativeHost, changed, source: "native" };
    })();
    const sharedRequest = request.finally(() => {
      inFlight = undefined;
    });
    inFlight = sharedRequest;

    return sharedRequest;
  };
};
