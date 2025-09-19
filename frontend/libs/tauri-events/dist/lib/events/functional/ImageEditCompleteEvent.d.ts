export interface ImageEditCompleteEvent {
    edited_images: EditedImage[];
    maybe_frontend_subscriber_id?: string;
    maybe_frontend_subscriber_payload?: string;
}
export interface EditedImage {
    media_token: string;
    cdn_url: string;
    maybe_thumbnail_template?: string;
}
export declare const useImageEditCompleteEvent: (asyncCallback: (event: ImageEditCompleteEvent) => Promise<void>) => void;
//# sourceMappingURL=ImageEditCompleteEvent.d.ts.map