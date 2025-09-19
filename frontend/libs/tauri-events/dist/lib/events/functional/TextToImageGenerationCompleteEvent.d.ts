export interface TextToImageGenerationCompleteEvent {
    generated_images: GeneratedImage[];
    maybe_frontend_subscriber_id?: string;
    maybe_frontend_subscriber_payload?: string;
}
export interface GeneratedImage {
    media_token: string;
    cdn_url: string;
    maybe_thumbnail_template?: string;
}
export declare const useTextToImageGenerationCompleteEvent: (asyncCallback: (event: TextToImageGenerationCompleteEvent) => Promise<void>) => void;
//# sourceMappingURL=TextToImageGenerationCompleteEvent.d.ts.map