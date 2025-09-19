// Artcraft / Storyteller API backend
const DEFAULT_API_HOST = "https://api.storyteller.ai";

// NB(bt,2025-09-25): 'nx' is creating multiple copies of the library with name 
//   mangling, so the singleton pattern fails to resolve to a single instance.
(window as any).STORYTELLER_API_HOST_STORE = undefined;

export class StorytellerApiHostStore {
  // NB(bt,2025-09-25): 'nx' is creating multiple copies of the library with name 
  //   mangling, so the singleton pattern fails to resolve to a single instance.
  // private static instance: StorytellerApiHostStore;

  /**
   * The scheme and host of the API.
   * This can optionally include a port, but no path components (including `/`).
   * eg. http://localhost:12345 or https://api.storyteller.ai
   */
  private apiSchemeAndHost: string;

  // NB(bt,2025-09-25): 'nx' is creating multiple copies of the library with name 
  //   mangling, so the singleton pattern fails to resolve to a single instance.
  // public static getInstance(): StorytellerApiHostStore {
  //   if (StorytellerApiHostStore.instance !== undefined) {
  //     return StorytellerApiHostStore.instance;
  //   }
  //   const instance = new StorytellerApiHostStore(DEFAULT_API_HOST);
  //   StorytellerApiHostStore.instance = instance;
  //   return instance;
  // }

  public static getInstance(): StorytellerApiHostStore {
    if ((window as any).STORYTELLER_API_HOST_STORE !== undefined) {
      return (window as any).STORYTELLER_API_HOST_STORE;
    }
    const instance = new StorytellerApiHostStore(DEFAULT_API_HOST);
    (window as any).STORYTELLER_API_HOST_STORE = instance;
    return instance;
  }

  /** Get the API scheme and host. */
  public getApiSchemeAndHost(): string {
    console.debug("StorytellerApiHostStore.getApiSchemeAndHost()", this.apiSchemeAndHost, this.constructor.name);
    return this.apiSchemeAndHost;
  }

  /** 
   * Externally update the API host. 
   * This is used to sync with Tauri for enabling easier development.
   */
  public setApiSchemeAndHost(apiSchemeAndHost: string) {
    console.debug("StorytellerApiHostStore.setApiSchemeAndHost()", apiSchemeAndHost, this.constructor.name);

    // TODO(bt,2025-07-06): Actually parse URL.
    if (!apiSchemeAndHost.startsWith("http://") && !apiSchemeAndHost.startsWith("https://")) {
      throw new Error(`Scheme not included in URL: ${apiSchemeAndHost}`);
    }

    const FINAL_VALID_SLASH = "https://".lastIndexOf("/");
    if (apiSchemeAndHost.lastIndexOf("/") > FINAL_VALID_SLASH) {
      throw new Error(`Path components should not be included in URL: ${apiSchemeAndHost}`);
    }

    this.apiSchemeAndHost = apiSchemeAndHost;
  }

  private constructor(apiSchemeAndHost: string) {
    this.apiSchemeAndHost = apiSchemeAndHost;
  }
}
