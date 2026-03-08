import type { BlendMode, Transform } from "./rendering";

export type TrackType = "video" | "audio" | "text";

// --- Base Element ---

export interface BaseTimelineElement {
  id: string;
  name: string;
  duration: number;
  startTime: number;
  trimStart: number;
  trimEnd: number;
  sourceDuration?: number;
}

// --- Element Types ---

export interface VideoElement extends BaseTimelineElement {
  type: "video";
  mediaId: string;
  muted?: boolean;
  transform: Transform;
  opacity: number;
  blendMode?: BlendMode;
}

export interface ImageElement extends BaseTimelineElement {
  type: "image";
  mediaId: string;
  transform: Transform;
  opacity: number;
  blendMode?: BlendMode;
}

export interface AudioElement extends BaseTimelineElement {
  type: "audio";
  mediaId: string;
  volume: number;
  muted?: boolean;
}

export interface TextElement extends BaseTimelineElement {
  type: "text";
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  textAlign: "left" | "center" | "right";
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  transform: Transform;
  opacity: number;
  blendMode?: BlendMode;
}

export type TimelineElement =
  | VideoElement
  | ImageElement
  | AudioElement
  | TextElement;

export type VisualElement = VideoElement | ImageElement | TextElement;
export type ElementType = TimelineElement["type"];

// --- Create types (without id, assigned on insert) ---

export type CreateVideoElement = Omit<VideoElement, "id">;
export type CreateImageElement = Omit<ImageElement, "id">;
export type CreateAudioElement = Omit<AudioElement, "id">;
export type CreateTextElement = Omit<TextElement, "id">;
export type CreateTimelineElement =
  | CreateVideoElement
  | CreateImageElement
  | CreateAudioElement
  | CreateTextElement;

// --- Track Types ---

interface BaseTrack {
  id: string;
  name: string;
}

export interface VideoTrack extends BaseTrack {
  type: "video";
  elements: (VideoElement | ImageElement)[];
  isMain: boolean;
  muted: boolean;
  hidden: boolean;
}

export interface AudioTrack extends BaseTrack {
  type: "audio";
  elements: AudioElement[];
  muted: boolean;
}

export interface TextTrack extends BaseTrack {
  type: "text";
  elements: TextElement[];
  hidden: boolean;
}

export type TimelineTrack = VideoTrack | AudioTrack | TextTrack;

// --- Drag & Drop ---

export interface ElementDragState {
  isDragging: boolean;
  elementId: string | null;
  trackId: string | null;
  startMouseX: number;
  startMouseY: number;
  startElementTime: number;
  clickOffsetTime: number;
  currentTime: number;
  currentMouseY: number;
}

export interface DropTarget {
  trackIndex: number;
  isNewTrack: boolean;
  insertPosition: "above" | "below" | null;
  xPosition: number;
  targetElement: { elementId: string; trackId: string } | null;
}

// --- Scene ---

export interface TScene {
  id: string;
  name: string;
  tracks: TimelineTrack[];
}
