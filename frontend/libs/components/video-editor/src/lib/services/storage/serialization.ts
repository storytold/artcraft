import type { MediaAsset } from "../../media/types";
import type { TProject } from "../../project/types";
import type { AudioTrack, TScene } from "../../timeline/types";
import type {
  MediaAssetData,
  SerializedProject,
  SerializedScene,
} from "./types";

// JSON document shape persisted by ProjectStorageAdapter implementations.
// TProject only references media by `mediaId`, so the document carries a
// manifest of the media bin alongside the project — enough for the editor
// to re-resolve every asset through MediaSourceAdapter on load.
export interface ProjectDocument {
  version: 1;
  project: SerializedProject;
  media: MediaAssetData[];
}

export function serializeProjectDocument({
  project,
  media,
}: {
  project: TProject;
  media: MediaAssetData[];
}): ProjectDocument {
  return {
    version: 1,
    project: {
      ...project,
      metadata: {
        ...project.metadata,
        createdAt: project.metadata.createdAt.toISOString(),
        updatedAt: project.metadata.updatedAt.toISOString(),
      },
      scenes: project.scenes.map(serializeScene),
    },
    media,
  };
}

// Accepts both the versioned document shape and legacy envelopes whose
// `data` was a raw TProject (IndexedDB rows structured-cloned before the
// document wrapper existed — their Date fields may still be real Dates).
export function deserializeProjectDocument(
  data: unknown,
): { project: TProject; media: MediaAssetData[] } | null {
  if (!data || typeof data !== "object") return null;

  if ("metadata" in data) {
    return {
      project: reviveProject(data as SerializedProject),
      media: [],
    };
  }

  if ("project" in data) {
    const document = data as ProjectDocument;
    if (!document.project?.metadata) return null;
    return {
      project: reviveProject(document.project),
      media: document.media ?? [],
    };
  }

  return null;
}

export function mediaAssetToData(asset: MediaAsset): MediaAssetData {
  // `thumbnailUrl` is deliberately dropped: runtime thumbnails are data:
  // or blob: URLs regenerated during rehydration, and embedding them
  // would bloat the persisted document.
  return {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    size: asset.file?.size ?? 0,
    lastModified: asset.file?.lastModified ?? 0,
    width: asset.width,
    height: asset.height,
    duration: asset.duration,
    fps: asset.fps,
    hasAudio: asset.hasAudio,
    ephemeral: asset.ephemeral,
  };
}

function serializeScene(scene: TScene): SerializedScene {
  return {
    ...scene,
    tracks: {
      ...scene.tracks,
      audio: scene.tracks.audio.map(stripAudioBuffers),
    },
    createdAt: scene.createdAt.toISOString(),
    updatedAt: scene.updatedAt.toISOString(),
  };
}

// AudioElement.buffer holds a decoded AudioBuffer — a runtime cache that
// can't survive JSON (or structured clone). It's rebuilt from the media
// source after load.
function stripAudioBuffers(track: AudioTrack): AudioTrack {
  return {
    ...track,
    elements: track.elements.map((element) => {
      if (!element.buffer) return element;
      const { buffer: _buffer, ...rest } = element;
      return rest as typeof element;
    }),
  };
}

function reviveProject(project: SerializedProject | TProject): TProject {
  return {
    ...project,
    metadata: {
      ...project.metadata,
      createdAt: toDate(project.metadata.createdAt),
      updatedAt: toDate(project.metadata.updatedAt),
    },
    scenes: project.scenes.map((scene) => ({
      ...scene,
      createdAt: toDate(scene.createdAt),
      updatedAt: toDate(scene.updatedAt),
    })),
  };
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}
