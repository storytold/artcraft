export interface RefImage {
  id: string;
  url: string;
  fullUrl?: string;
  file?: File;
  mediaToken?: string;
  isCustom?: boolean;
}

export interface RefVideo {
  id: string;
  url: string;
  file: File;
  mediaToken: string;
  duration: number;
}

export interface RefAudio {
  id: string;
  url: string;
  file: File;
  mediaToken: string;
  duration: number;
}

export interface MentionItem {
  label: string;
  type: "image" | "video" | "audio" | "character";
  preview?: string;
}
