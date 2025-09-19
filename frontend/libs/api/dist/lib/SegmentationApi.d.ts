import { ApiManager } from './ApiManager.js';
export interface Coordinates {
    coordinates: [number, number];
    include: boolean;
}
export interface ObjectData {
    style: {
        color: SegmentationColor;
    };
    object_id: number;
    points: Coordinates[];
}
export type SegmentationColor = [number, number, number];
export interface RequestFrame {
    timestamp: number;
    objects: ObjectData[];
}
export interface ResponseFrame {
    b64_image_data: number;
    idx: number;
    timestamp: number;
    objects: ObjectData[];
    preview_image_url: string;
}
export interface SegmentationRequest {
    session_id: string;
    fps: number;
    frames: RequestFrame[];
    propagate: boolean;
}
export interface SegmentationResponse {
    session_id: string;
    fps: number;
    masked_video_cdn_url: string;
    frames: ResponseFrame[];
    propagate: boolean;
}
export declare class SegmentationApi extends ApiManager {
    createSession(blobVideo: File | Blob): Promise<{
        session_id: string;
    }>;
    addPointsToSession(session_id: string, fps: number, frames: RequestFrame[], propagate: boolean): Promise<SegmentationResponse>;
}
//# sourceMappingURL=SegmentationApi.d.ts.map