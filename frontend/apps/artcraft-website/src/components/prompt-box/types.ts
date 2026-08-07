export interface RefImage {
  id: string;
  url: string;
  /** Full-res URL for the deck preview modal; falls back to `url`. */
  fullUrl?: string;
  file: File;
  mediaToken: string;
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

export type { MentionItem } from "@storyteller/ui-promptbox";
