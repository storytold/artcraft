import type { VideoInfoReadOnlyResponse } from './types';

// Dev: same-origin `/v1/...`, proxied to http://localhost:12345 by Vite (see
// vite.config.ts). Prod: call the public API host directly.
const API_BASE = import.meta.env.DEV ? '' : 'https://api.storyteller.ai';

const READ_ONLY_PATH = '/v1/video_info/read_only';

export class VideoInfoApiError extends Error {
  constructor(
    public readonly kind: 'rate_limited' | 'too_large' | 'http' | 'network',
    message: string,
  ) {
    super(message);
    this.name = 'VideoInfoApiError';
  }
}

/** Upload a video file and return the detected provenance. */
export async function readVideoInfo(
  file: File,
): Promise<VideoInfoReadOnlyResponse> {
  const form = new FormData();
  form.append('file', file, file.name || 'upload.mp4');

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${READ_ONLY_PATH}`, {
      method: 'POST',
      body: form,
    });
  } catch (err) {
    throw new VideoInfoApiError(
      'network',
      'Could not reach the analysis server. Is it running?',
    );
  }

  if (response.status === 429) {
    throw new VideoInfoApiError(
      'rate_limited',
      "Whoa, slow down — that's one video every few seconds. Try again in a moment.",
    );
  }
  if (response.status === 413) {
    throw new VideoInfoApiError('too_large', 'That video is too large to analyze.');
  }
  if (!response.ok) {
    throw new VideoInfoApiError(
      'http',
      `The server returned an error (${response.status}).`,
    );
  }

  return (await response.json()) as VideoInfoReadOnlyResponse;
}
