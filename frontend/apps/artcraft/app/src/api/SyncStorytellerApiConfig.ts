import { GetAppInfo } from "@storyteller/tauri-api";
import { StorytellerApiHostStore } from "@storyteller/api";
import { forceGetUserInfoAndSubcriptions } from "~/signals";

// Time before we should call Tauri again.
const SYNC_THRESHOLD = 10 * 1000;

/**
 * Keep track of if we can call Tauri again.
 */
class Cache {
  private static instance: Cache;
  private lastFetchSuccess?: number;

  public static getInstance(): Cache {
    if (Cache.instance !== undefined) {
      return Cache.instance;
    }
    const instance = new Cache();
    Cache.instance = instance;
    return instance;
  }

  public canCall() : boolean {
    if (this.lastFetchSuccess === undefined) {
      return true;
    }
    return Date.now() - this.lastFetchSuccess > SYNC_THRESHOLD;
  }

  public setCallSuccess() {
    this.lastFetchSuccess = Date.now();
  }
}

/**
 * Syncs our view of the Storyteller API configs with Tauri.
 * Runs any necessary user session functions if things change.
 */
export const SyncStorytellerApiConfig = async () => {
  console.log("SyncStorytellerApiConfig()")

  const cache = Cache.getInstance();
  const oldValue = StorytellerApiHostStore.getInstance().getApiSchemeAndHost();

  if (!cache.canCall()) {
    return;
  }

  GetAppInfo().then(async (appInfo) => {
    console.log("SyncStorytellerApiConfig() - appInfo", appInfo);

    const schemeAndHost = appInfo.payload.storyteller_host;
    if (!schemeAndHost) {
      return ;
    }

    console.log(`Updating hostname to ${schemeAndHost}`);
    StorytellerApiHostStore.getInstance().setApiSchemeAndHost(schemeAndHost);

    cache.setCallSuccess();

    if (oldValue !== schemeAndHost) {
      console.log("SyncStorytellerApiConfig() - force session refresh")
      // NB: This is a hack that might prevent the login screen from being shown 
      // if the user is working in development.
      await forceGetUserInfoAndSubcriptions();
    }
  });
}
