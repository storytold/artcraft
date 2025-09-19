import { ApiManager, ApiResponse } from './ApiManager.js';
interface GenerateVideoStyleTransferRequest {
    creator_set_visibility: string;
    disable_lcm: boolean;
    enable_lipsync: boolean;
    frame_skip: number;
    global_ipa_media_token: string;
    input_depth_file: string;
    input_file: string;
    input_normal_file: string;
    input_outline_file: string;
    negative_prompt: string;
    prompt: string;
    remove_watermark: boolean;
    style: string;
    travel_prompt: string;
    trim_end_millis: number;
    trim_start_millis: number;
    use_cinematic: boolean;
    use_face_detailer: boolean;
    use_strength: number;
    use_upscaler: boolean;
    uuid_idempotency_token: string;
}
export declare class VideoApi extends ApiManager {
    EnqueueStudio({ enqueueVideo, }: {
        enqueueVideo: GenerateVideoStyleTransferRequest;
    }): Promise<ApiResponse<{
        inference_job_token?: string;
        inference_job_token_type?: string;
    }>>;
}
export {};
//# sourceMappingURL=VideoApi.d.ts.map