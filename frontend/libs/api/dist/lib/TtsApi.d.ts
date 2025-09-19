import { ApiManager, ApiResponse } from './ApiManager.js';
import { Visibility } from './enums/Visibility.js';
export interface GenerateTtsAudioRequest {
    creator_set_visibility?: Visibility;
    uuid_idempotency_token: string;
    tts_model_token: string;
    inference_text: string;
    is_storyteller_demo?: boolean;
}
export interface GenerateTtsAudioResponse {
    success?: boolean;
    inference_job_token?: string;
    inference_job_token_type?: string;
    BadInput?: string;
}
export declare class TtsApi extends ApiManager {
    GenerateTtsAudio(request: GenerateTtsAudioRequest): Promise<ApiResponse<{
        inference_job_token?: string;
        inference_job_token_type?: string;
    }>>;
}
//# sourceMappingURL=TtsApi.d.ts.map