export interface GetAppPreferencesResult {
    preferences: AppPreferencesPayload;
}
export interface AppPreferencesPayload {
    preferred_download_directory: PreferredDownloadDirectory;
    play_sounds: boolean;
    enqueue_success_sound?: string;
    enqueue_failure_sound?: string;
    generation_success_sound?: string;
    generation_failure_sound?: string;
    generation_enqueue_sound?: string;
}
export type PreferredDownloadDirectory = SystemDirectory | CustomDirectory;
export interface SystemDirectory {
    system: string;
}
export interface CustomDirectory {
    custom: string;
}
export declare const GetAppPreferences: () => Promise<GetAppPreferencesResult>;
//# sourceMappingURL=GetAppPreferences.d.ts.map