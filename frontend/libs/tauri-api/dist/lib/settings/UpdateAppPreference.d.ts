import { PreferredDownloadDirectory } from './GetAppPreferences';
export interface UpdateAppPreferencesRequest {
    preference: PreferenceName;
    value: undefined | string | boolean | PreferredDownloadDirectory;
}
export declare enum PreferenceName {
    PreferredDownloadDirectory = "preferred_download_directory",
    PlaySounds = "play_sounds",
    EnqueueSuccessSound = "enqueue_success_sound",
    EnqueueFailureSound = "enqueue_failure_sound",
    GenerationSuccessSound = "generation_success_sound",
    GenerationFailureSound = "generation_failure_sound",
    GenerationEnqueueSound = "generation_enqueue_sound"
}
export interface UpdateAppPreferencesResult {
    success: boolean;
}
export declare const UpdateAppPreferences: (request: UpdateAppPreferencesRequest) => Promise<UpdateAppPreferencesResult>;
//# sourceMappingURL=UpdateAppPreference.d.ts.map