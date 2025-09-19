import { ApiManager, ApiResponse } from './ApiManager';
export declare class EngineApi extends ApiManager {
    ConvertTbxToGltf({ mediaFileToken, uuidIdempotencyToken, }: {
        mediaFileToken: string;
        uuidIdempotencyToken: string;
    }): Promise<ApiResponse<string>>;
    uploadSceneSnapshot({ screenshot, sceneMediaToken, }: {
        screenshot: File;
        sceneMediaToken?: string;
    }): Promise<ApiResponse<string>>;
    enqueueImageGeneration({ disableSystemPrompt, prompt, snapshotMediaToken, additionalImages, }: {
        disableSystemPrompt: boolean;
        prompt: string;
        snapshotMediaToken: string;
        additionalImages?: string[];
    }): Promise<ApiResponse<string>>;
    pollJobSession(jobToken: string): Promise<ApiResponse<{
        status: string;
        result: {
            generated_images?: string[];
            error?: string;
        };
    }>>;
    pollStudioSessionJobs(jobToken: string): Promise<ApiResponse<{
        status: string;
        result: {
            generated_images?: string[];
            error?: string;
        };
    }>>;
}
//# sourceMappingURL=EngineApi.d.ts.map