import { ApiManager, ApiResponse } from './ApiManager.js';
import { Prompts } from './models/Prompts.js';
export declare class PromptsApi extends ApiManager {
    enqueueImageGeneration({ disableSystemPrompt, prompt, snapshotMediaToken, additionalImages, }: {
        disableSystemPrompt: boolean;
        prompt: string;
        snapshotMediaToken: string;
        additionalImages?: string[];
    }): Promise<ApiResponse<string>>;
    pollJobSession(jobToken: string, thumbnailWidth?: number): Promise<ApiResponse<{
        job_token: string;
        request: {
            maybe_model_title: string;
        };
        status: {
            status: string;
            progress_percentage: number;
        };
        result: {
            image_url: string;
            thumbnail_url: string;
            public_bucket_path: string;
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
    GetPromptsByToken({ token, }: {
        token: string;
    }): Promise<ApiResponse<Prompts>>;
    uploadSceneSnapshot({ screenshot, sceneMediaToken, }: {
        screenshot: File;
        sceneMediaToken?: string;
    }): Promise<ApiResponse<string>>;
}
//# sourceMappingURL=PromptsApi.d.ts.map