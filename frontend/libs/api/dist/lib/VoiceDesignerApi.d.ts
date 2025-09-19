import { ApiManager, ApiResponse } from './ApiManager.js';
import { ZsDataset } from './models/Dataset.js';
interface VoiceDesignerParams {
    text: string;
    uuidIdempotencyToken: string;
    voiceToken: string;
}
export declare class VoiceDesignerApi extends ApiManager {
    EnqueueTts(params: VoiceDesignerParams): Promise<ApiResponse<{
        inference_job_token?: string;
        voice_token?: string;
    }>>;
    ListDatasetsByUser({ username, }: {
        username: string;
    }): Promise<ApiResponse<ZsDataset[]>>;
}
export {};
//# sourceMappingURL=VoiceDesignerApi.d.ts.map