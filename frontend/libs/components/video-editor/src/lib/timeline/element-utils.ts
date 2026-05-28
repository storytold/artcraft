import { DEFAULT_NEW_ELEMENT_DURATION } from "./creation";
import {
  MASKABLE_ELEMENT_TYPES,
  RETIMABLE_ELEMENT_TYPES,
  VISUAL_ELEMENT_TYPES,
  type CreateEffectElement,
  type CreateGraphicElement,
  type CreateTimelineElement,
  type CreateVideoElement,
  type CreateImageElement,
  type CreateStickerElement,
  type CreateUploadAudioElement,
  type CreateLibraryAudioElement,
  type TextElement,
  type SceneTracks,
  type TimelineElement,
  type AudioElement,
  type VideoElement,
  type ImageElement,
  type MaskableElement,
  type RetimableElement,
  type VisualElement,
  type UploadAudioElement,
} from "./types";
import { DEFAULTS } from "./defaults";
import type { MediaType } from "../media/types";
import { buildDefaultEffectInstance } from "../effects";
import { buildDefaultGraphicInstance } from "../graphics";
import type { ParamValues } from "../params";
import {
  buildDefaultParamValues,
  getBuiltInElementParams,
} from "../params/registry";
import { capitalizeFirstLetter } from "../utils/string";
import { type MediaTime, ZERO_MEDIA_TIME } from "../wasm";

// Element-construction + type-guard helpers. The `build*Element`
// functions produce CreateTimelineElement values (id-less) — the caller
// stamps an id at insert time. Default params are pulled from
// params/registry so the panel and the renderer always see the same
// initial state.

export function canElementHaveAudio(
  element: TimelineElement,
): element is AudioElement | VideoElement {
  return element.type === "audio" || element.type === "video";
}

export function isVisualElement(
  element: TimelineElement,
): element is VisualElement {
  return (VISUAL_ELEMENT_TYPES as readonly string[]).includes(element.type);
}

export function isMaskableElement(
  element: TimelineElement,
): element is MaskableElement {
  return (MASKABLE_ELEMENT_TYPES as readonly string[]).includes(element.type);
}

export function isRetimableElement(
  element: TimelineElement,
): element is RetimableElement {
  return (RETIMABLE_ELEMENT_TYPES as readonly string[]).includes(element.type);
}

export function canElementBeHidden(
  element: TimelineElement,
): element is VisualElement {
  return isVisualElement(element);
}

export function hasElementEffects({
  element,
}: {
  element: TimelineElement;
}): boolean {
  return isVisualElement(element) && (element.effects?.length ?? 0) > 0;
}

export function hasMediaId(
  element: TimelineElement,
): element is UploadAudioElement | VideoElement | ImageElement {
  return "mediaId" in element;
}

export function requiresMediaId({
  element,
}: {
  element: CreateTimelineElement;
}): boolean {
  return (
    element.type === "video" ||
    element.type === "image" ||
    (element.type === "audio" && element.sourceType === "upload")
  );
}

function buildDefaultElementParams({
  type,
}: {
  type: TimelineElement["type"];
}): ParamValues {
  return buildDefaultParamValues(getBuiltInElementParams({ type }));
}

export function buildTextElement({
  raw,
  startTime,
}: {
  raw: Partial<Omit<TextElement, "type" | "id">>;
  startTime: MediaTime;
}): CreateTimelineElement {
  const t = raw as Partial<TextElement>;

  return {
    type: "text",
    name: t.name ?? DEFAULTS.text.element.name,
    duration: t.duration ?? DEFAULT_NEW_ELEMENT_DURATION,
    startTime,
    trimStart: ZERO_MEDIA_TIME,
    trimEnd: ZERO_MEDIA_TIME,
    params: {
      ...buildDefaultElementParams({ type: "text" }),
      ...(t.params ?? {}),
    },
  };
}

export function buildEffectElement({
  effectType,
  startTime,
  duration,
}: {
  effectType: string;
  startTime: MediaTime;
  duration?: MediaTime;
}): CreateEffectElement {
  const instance = buildDefaultEffectInstance({ effectType });
  return {
    type: "effect",
    name: capitalizeFirstLetter({ string: instance.type }),
    effectType,
    params: instance.params,
    duration: duration ?? DEFAULT_NEW_ELEMENT_DURATION,
    startTime,
    trimStart: ZERO_MEDIA_TIME,
    trimEnd: ZERO_MEDIA_TIME,
  };
}

export function buildStickerElement({
  stickerId,
  name,
  startTime,
  intrinsicWidth,
  intrinsicHeight,
}: {
  stickerId: string;
  name?: string;
  startTime: MediaTime;
  intrinsicWidth?: number;
  intrinsicHeight?: number;
}): CreateStickerElement {
  const stickerNameFromId =
    stickerId.split(":").slice(1).pop()?.replaceAll("-", " ") ?? stickerId;
  return {
    type: "sticker",
    name: name ?? stickerNameFromId,
    stickerId,
    intrinsicWidth,
    intrinsicHeight,
    duration: DEFAULT_NEW_ELEMENT_DURATION,
    startTime,
    trimStart: ZERO_MEDIA_TIME,
    trimEnd: ZERO_MEDIA_TIME,
    params: buildDefaultElementParams({ type: "sticker" }),
  };
}

export function buildGraphicElement({
  definitionId,
  name,
  startTime,
  params,
}: {
  definitionId: string;
  name?: string;
  startTime: MediaTime;
  params?: Partial<ParamValues>;
}): CreateGraphicElement {
  const instance = buildDefaultGraphicInstance({ definitionId });
  return {
    type: "graphic",
    name: name ?? capitalizeFirstLetter({ string: instance.definitionId }),
    definitionId: instance.definitionId,
    params: mergeParamValues({
      base: {
        ...buildDefaultElementParams({ type: "graphic" }),
        ...instance.params,
      },
      overrides: params,
    }),
    duration: DEFAULT_NEW_ELEMENT_DURATION,
    startTime,
    trimStart: ZERO_MEDIA_TIME,
    trimEnd: ZERO_MEDIA_TIME,
  };
}

function mergeParamValues({
  base,
  overrides,
}: {
  base: ParamValues;
  overrides?: Partial<ParamValues>;
}): ParamValues {
  const result: ParamValues = { ...base };
  for (const [key, value] of Object.entries(overrides ?? {})) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

function buildVideoElement({
  mediaId,
  name,
  duration,
  startTime,
}: {
  mediaId: string;
  name: string;
  duration: MediaTime;
  startTime: MediaTime;
}): CreateVideoElement {
  return {
    type: "video",
    mediaId,
    name,
    duration,
    startTime,
    trimStart: ZERO_MEDIA_TIME,
    trimEnd: ZERO_MEDIA_TIME,
    sourceDuration: duration,
    isSourceAudioEnabled: true,
    hidden: false,
    params: buildDefaultElementParams({ type: "video" }),
  };
}

function buildImageElement({
  mediaId,
  name,
  duration,
  startTime,
}: {
  mediaId: string;
  name: string;
  duration: MediaTime;
  startTime: MediaTime;
}): CreateImageElement {
  return {
    type: "image",
    mediaId,
    name,
    duration,
    startTime,
    trimStart: ZERO_MEDIA_TIME,
    trimEnd: ZERO_MEDIA_TIME,
    hidden: false,
    params: buildDefaultElementParams({ type: "image" }),
  };
}

function buildUploadAudioElement({
  mediaId,
  name,
  duration,
  startTime,
  buffer,
}: {
  mediaId: string;
  name: string;
  duration: MediaTime;
  startTime: MediaTime;
  buffer?: AudioBuffer;
}): CreateUploadAudioElement {
  const element: CreateUploadAudioElement = {
    type: "audio",
    sourceType: "upload",
    mediaId,
    name,
    duration,
    startTime,
    trimStart: ZERO_MEDIA_TIME,
    trimEnd: ZERO_MEDIA_TIME,
    sourceDuration: duration,
    params: buildDefaultElementParams({ type: "audio" }),
  };
  if (buffer) {
    element.buffer = buffer;
  }
  return element;
}

export function buildElementFromMedia({
  mediaId,
  mediaType,
  name,
  duration,
  startTime,
  buffer,
}: {
  mediaId: string;
  mediaType: MediaType;
  name: string;
  duration: MediaTime;
  startTime: MediaTime;
  buffer?: AudioBuffer;
}): CreateTimelineElement {
  switch (mediaType) {
    case "audio":
      return buildUploadAudioElement({
        mediaId,
        name,
        duration,
        startTime,
        buffer,
      });
    case "video":
      return buildVideoElement({ mediaId, name, duration, startTime });
    case "image":
      return buildImageElement({ mediaId, name, duration, startTime });
  }
}

export function buildLibraryAudioElement({
  sourceUrl,
  name,
  duration,
  startTime,
  buffer,
}: {
  sourceUrl: string;
  name: string;
  duration: MediaTime;
  startTime: MediaTime;
  buffer?: AudioBuffer;
}): CreateLibraryAudioElement {
  const element: CreateLibraryAudioElement = {
    type: "audio",
    sourceType: "library",
    sourceUrl,
    name,
    duration,
    startTime,
    trimStart: ZERO_MEDIA_TIME,
    trimEnd: ZERO_MEDIA_TIME,
    sourceDuration: duration,
    params: buildDefaultElementParams({ type: "audio" }),
  };
  if (buffer) {
    element.buffer = buffer;
  }
  return element;
}

export function getElementsAtTime({
  tracks,
  time,
}: {
  tracks: SceneTracks;
  time: number;
}): { trackId: string; elementId: string }[] {
  const result: { trackId: string; elementId: string }[] = [];
  const orderedTracks = [...tracks.overlay, tracks.main, ...tracks.audio];

  for (const track of orderedTracks) {
    for (const element of track.elements) {
      const elementStart = element.startTime;
      const elementEnd = element.startTime + element.duration;

      if (time > elementStart && time < elementEnd) {
        result.push({ trackId: track.id, elementId: element.id });
      }
    }
  }

  return result;
}

export function getElementFontFamilies({
  tracks,
}: {
  tracks: SceneTracks;
}): string[] {
  const families = new Set<string>();
  for (const track of [...tracks.overlay, tracks.main, ...tracks.audio]) {
    for (const element of track.elements) {
      if (element.type === "text" && typeof element.params.fontFamily === "string") {
        families.add(element.params.fontFamily);
      }
      if ("masks" in element) {
        for (const mask of element.masks ?? []) {
          if (mask.type === "text" && mask.params.fontFamily) {
            families.add(mask.params.fontFamily);
          }
        }
      }
    }
  }
  return [...families];
}
