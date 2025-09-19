import { ClipGroup, ClipType } from '../enums';
import { XYZ } from '../types';
export interface QueueClip {
    version: number;
    type: ClipType;
    group: ClipGroup;
    object_uuid?: string;
    clip_uuid?: string;
    media_id?: string;
    name?: string;
    offset?: number;
    length?: number;
    selected?: boolean;
}
export interface QueueKeyframe {
    version: number;
    keyframe_uuid?: string;
    group: ClipGroup;
    object_uuid: string;
    object_name?: string;
    offset?: number;
    position: XYZ;
    rotation: XYZ;
    scale: XYZ;
    selected?: boolean;
}
//# sourceMappingURL=Queue.d.ts.map