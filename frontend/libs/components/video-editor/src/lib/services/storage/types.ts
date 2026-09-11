import type { MediaType } from "../../media/types";
import type {
  TProject,
  TProjectMetadata,
  TTimelineViewState,
} from "../../project/types";
import type { TScene } from "../../timeline/types";

// Persistence-layer interface: a key-value store with async semantics.
// Used by both the project store (one row per project) and the media
// store (one row per asset blob/thumbnail).
export interface StorageAdapter<T> {
  get(key: string): Promise<T | null>;
  set(args: { key: string; value: T }): Promise<void>;
  remove(key: string): Promise<void>;
  list(): Promise<string[]>;
  clear(): Promise<void>;
}

// "Wire" shape of a media asset — what hits IndexedDB / network. The
// runtime MediaAsset (media/types.ts) extends this with the live File
// handle.
export interface MediaAssetData {
  id: string;
  name: string;
  type: MediaType;
  size: number;
  lastModified: number;
  width?: number;
  height?: number;
  duration?: number;
  fps?: number;
  hasAudio?: boolean;
  ephemeral?: boolean;
  thumbnailUrl?: string;
}

// Serialized project = Date fields encoded as ISO strings, so JSON
// roundtripping is lossless.
export type SerializedScene = Omit<TScene, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type SerializedProjectMetadata = Omit<
  TProjectMetadata,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

export type SerializedProject = Omit<TProject, "metadata" | "scenes"> & {
  metadata: SerializedProjectMetadata;
  scenes: SerializedScene[];
  timelineViewState?: TTimelineViewState;
};

export interface StorageConfig {
  projectsDb: string;
  mediaDb: string;
  savedSoundsDb: string;
  version: number;
}

// File System Access API augmentation — these async-iterator methods
// are part of the spec but missing from some lib.dom.d.ts revisions.
declare global {
  interface FileSystemDirectoryHandle {
    keys(): AsyncIterableIterator<string>;
    values(): AsyncIterableIterator<FileSystemHandle>;
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  }
}
