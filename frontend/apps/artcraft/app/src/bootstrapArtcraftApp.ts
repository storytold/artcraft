import type { ApiHostSyncResult } from "./api/StorytellerApiHostSync";

export interface BootstrapArtcraftAppDependencies {
  isDesktopApp: () => boolean;
  syncApiHost: () => Promise<ApiHostSyncResult>;
  refreshSession: () => Promise<unknown>;
  renderApp: () => void;
  renderApiHostError: (error: unknown) => void;
  reportSessionRefreshError?: (error: unknown) => void;
}

/**
 * Installs the native API host before rendering desktop REST consumers. A
 * session refresh caused by a changed host is deliberately noncritical: it
 * runs after host installation and cannot prevent the app from rendering.
 */
export const bootstrapArtcraftApp = async ({
  isDesktopApp,
  syncApiHost,
  refreshSession,
  renderApp,
  renderApiHostError,
  reportSessionRefreshError = console.error,
}: BootstrapArtcraftAppDependencies): Promise<boolean> => {
  if (isDesktopApp()) {
    let syncResult: ApiHostSyncResult;
    try {
      syncResult = await syncApiHost();
    } catch (error) {
      renderApiHostError(error);
      return false;
    }

    if (syncResult.changed) {
      void Promise.resolve()
        .then(refreshSession)
        .catch(reportSessionRefreshError);
    }
  }

  renderApp();
  return true;
};
