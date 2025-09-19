export interface CanvasBgRemovedEvent {
    media_token: string;
    image_cdn_url: string;
    maybe_frontend_subscriber_id?: string;
    maybe_frontend_subscriber_payload?: string;
}
export declare const useCanvasBgRemovedEvent: (asyncCallback: (event: CanvasBgRemovedEvent) => Promise<void>) => void;
//# sourceMappingURL=CanvasBgRemovedEvent.d.ts.map