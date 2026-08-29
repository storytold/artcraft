import { GetAppInfo } from "@storyteller/tauri-api";
import { StorytellerApiHostStore } from "@storyteller/api";
import { forceGetUserInfoAndSubcriptions } from "~/signals";
import { createStorytellerApiHostSync } from "./StorytellerApiHostSync";
import type { ApiHostSyncResult } from "./StorytellerApiHostSync";

const hostStore = StorytellerApiHostStore.getInstance();

const syncStorytellerApiHost = createStorytellerApiHostSync({
  getNativeHost: async () => (await GetAppInfo()).payload.storyteller_host,
  getCurrentHost: () => hostStore.getApiSchemeAndHost(),
  setCurrentHost: (host) => hostStore.setApiSchemeAndHost(host),
});

/**
 * Installs the native-configured API host. The returned promise resolves only
 * after the host store has been updated, so callers can safely mount REST
 * consumers afterward.
 */
export const SyncStorytellerApiConfig = (): Promise<ApiHostSyncResult> =>
  syncStorytellerApiHost();

/**
 * Refreshes session state after a host change. Startup treats this as
 * noncritical: a session/network failure must not undo a successfully
 * installed API host or prevent the application shell from rendering.
 */
export const RefreshSessionAfterApiHostChange = async (): Promise<void> => {
  await forceGetUserInfoAndSubcriptions();
};
