export interface ImageToVideoGenerationCompleteEvent {
    generated_video: GeneratedVideo;
    maybe_frontend_subscriber_id?: string;
    maybe_frontend_subscriber_payload?: string;
}
export interface GeneratedVideo {
    media_token: string;
    cdn_url: string;
}
export declare const useImageToVideoGenerationCompleteEvent: (asyncCallback: (event: ImageToVideoGenerationCompleteEvent) => Promise<void>) => void;
//# sourceMappingURL=ImageToVideoGenerationCompleteEvent.d.ts.map