import type {
  VideoInfoNoteRequest,
  VideoInfoNoteResponse,
  VideoInfoUploadResponse,
} from './types';

// Dev: same-origin `/v1/...`, proxied to http://localhost:12345 by Vite (see
// vite.config.ts). Prod: call the public API host directly.
const API_BASE = import.meta.env.DEV ? '' : 'https://api.storyteller.ai';

// The upload endpoint persists a record (and returns its token) in addition to
// returning the detected provenance.
const UPLOAD_PATH = '/v1/video_info/upload';

const NOTES_PATH = '/v1/video_info/notes';

export class VideoInfoApiError extends Error {
  constructor(
    public readonly kind: 'rate_limited' | 'too_large' | 'http' | 'network',
    message: string,
  ) {
    super(message);
    this.name = 'VideoInfoApiError';
  }
}

/**
 * Upload a video file, persist a record, and return the detected provenance
 * along with the stored record's token.
 */
export async function uploadVideo(
  file: File,
): Promise<VideoInfoUploadResponse> {
  const form = new FormData();
  form.append('file', file, file.name || 'upload');
  if (file.name) {
    form.append('maybe_filename', file.name);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${UPLOAD_PATH}`, {
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

  return (await response.json()) as VideoInfoUploadResponse;
}

/**
 * Create or update a note about an uploaded video. Pass
 * `maybe_uploaded_video_note_token` to update the existing note.
 */
export async function saveVideoNote(
  request: VideoInfoNoteRequest,
): Promise<VideoInfoNoteResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${NOTES_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch (err) {
    throw new VideoInfoApiError('network', 'Could not reach the server to save your note.');
  }

  if (response.status === 429) {
    throw new VideoInfoApiError('rate_limited', 'Saving too quickly — try again in a moment.');
  }
  if (!response.ok) {
    throw new VideoInfoApiError('http', `The server returned an error (${response.status}).`);
  }

  return (await response.json()) as VideoInfoNoteResponse;
}
