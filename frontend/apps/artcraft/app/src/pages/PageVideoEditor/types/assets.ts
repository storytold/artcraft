export type MediaType = "image" | "video" | "audio";

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  file: File;
  url?: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
}
