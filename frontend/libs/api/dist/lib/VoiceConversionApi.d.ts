import { ApiManager, ApiResponse } from './ApiManager.js';
interface VoiceConversionParams {
    autoPredictF0?: boolean;
    creatorSetVisibility?: string;
    isStorytellerDemo?: boolean;
    overrideF0Method?: string;
    sourceMediaUploadToken: string;
    transpose?: number;
    uuidIdempotencyToken: string;
    voiceConversionModelToken: string;
}
export declare class VoiceConversionApi extends ApiManager {
    ConvertVoice(params: VoiceConversionParams): Promise<ApiResponse<string>>;
}
export {};
//# sourceMappingURL=VoiceConversionApi.d.ts.map