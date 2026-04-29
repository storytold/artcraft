import { MediaFileAnimationType, ClipGroup, ClipType } from "~/enums";
import { XYZ } from "../datastructures/common";
import { MediaFileType } from "~/pages/PageScene/enums";

export interface Clip {
  version: number;
  clip_uuid: string;
  type: ClipType;
  group: ClipGroup;
  media_id: string;
  object_uuid?: string;
  name: string;
  offset: number;
  length: number;
  selected?: boolean;
}

export interface Keyframe {
  version: number;
  keyframe_uuid: string;
  group: ClipGroup;
  object_uuid: string;
  offset: number;
  position: XYZ;
  rotation: XYZ;
  scale: XYZ;
  selected?: boolean;
}

export interface CharacterGroup {
  id: string;
  characters: CharacterTrack[];
}

export interface CharacterTrack {
  object_uuid: string;
  media_id: string;
  mediaType: MediaFileType;
  animationType?: MediaFileAnimationType;
  name: string;
  muted: boolean;
  minimized: boolean;
  animationClips: Clip[];
  positionKeyframes: Keyframe[];
  expressionClips: Clip[];
  lipSyncClips: Clip[];
}

export interface CameraGroup {
  id: string;
  keyframes: Keyframe[];
}

export interface AudioGroup {
  id: string;
  muted: boolean;
  clips: Clip[];
}

export interface ObjectGroup {
  id: string;
  objects: ObjectTrack[];
}

export interface ObjectTrack {
  object_uuid: string;
  name: string;
  keyframes: Keyframe[];
}

export interface PromptTravelGroup {
  id: string;
  clips: Clip[];
}

export interface UpdateTime {
  currentTime: number;
}
