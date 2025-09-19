export declare class StorytellerApiHostStore {
    /**
     * The scheme and host of the API.
     * This can optionally include a port, but no path components (including `/`).
     * eg. http://localhost:12345 or https://api.storyteller.ai
     */
    private apiSchemeAndHost;
    static getInstance(): StorytellerApiHostStore;
    /** Get the API scheme and host. */
    getApiSchemeAndHost(): string;
    /**
     * Externally update the API host.
     * This is used to sync with Tauri for enabling easier development.
     */
    setApiSchemeAndHost(apiSchemeAndHost: string): void;
    private constructor();
}
//# sourceMappingURL=StorytellerApiHostStore.d.ts.map