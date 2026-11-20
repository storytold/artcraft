import { fetch as desktopFetch } from "@tauri-apps/plugin-http";
import { MediaFilesApi, MediaUploadApi, UsersApi } from "@storyteller/api";
import {
  CommandSuccessStatus,
  DownloadUrl,
  GetAppPreferences,
} from "@storyteller/tauri-api";

export type AaoMediaKind = "image" | "video";

export interface AaoMediaJob {
  state: "pending" | "succeeded" | "failed";
  files: string[];
  error?: string;
}

export class MediaHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requestAaoMedia(path: string, options?: RequestInit) {
  const fetchMedia = import.meta.env.DEV ? fetch : desktopFetch;
  const base = import.meta.env.DEV ? "/aao-media" : "http://127.0.0.1:8771";
  const response = await fetchMedia(`${base}${path}`, {
    ...options,
    headers: { "X-AAO-Studio": "1", ...options?.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new MediaHttpError(
      response.status,
      typeof error?.detail === "string"
        ? error.detail
        : `AAO media service returned HTTP ${response.status}`,
    );
  }
  return response;
}

interface FileImport {
  uuid: string;
  token?: string;
  downloaded?: boolean;
}

interface LibraryImport {
  kind: AaoMediaKind;
  provider: string;
  owner: string | null;
  files: Record<number, FileImport>;
  done?: boolean;
  error?: string;
}

const STORAGE_KEY = "aao-library-imports";
export const AAO_IMPORT_CHANGED = "aao-import-changed";
export const AAO_LIBRARY_UPDATED = "aao-library-updated";
let working = false;

function readImports(): Record<string, LibraryImport> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveImport(id: string, job: LibraryImport) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...readImports(), [id]: job }),
  );
  window.dispatchEvent(new Event(AAO_IMPORT_CHANGED));
}

export function getAaoLibraryImport(id: string | undefined) {
  return id ? readImports()[id] : undefined;
}

export async function getArtCraftLibraryOwner() {
  const session = await new UsersApi().GetSession();
  const user = session.data?.loggedIn ? session.data.user : undefined;
  return user?.user_token ?? user?.core_info?.user_token ?? null;
}

export function queueAaoLibraryImport(
  id: string,
  kind: AaoMediaKind,
  provider: string,
  owner: string | null,
) {
  const previous = getAaoLibraryImport(id);
  if (previous?.done) return;
  saveImport(id, {
    kind,
    provider,
    owner: previous?.owner ?? owner,
    files: previous?.files ?? {},
  });
}

export async function getArtCraftMediaUrl(token: string) {
  const media = await new MediaFilesApi().GetMediaFileByToken({
    mediaFileToken: token,
  });
  return media.data?.media_links?.cdn_url;
}

async function importJob(id: string, entry: LibraryImport, job: AaoMediaJob) {
  const api = new MediaUploadApi();
  for (const [index, name] of job.files.entries()) {
    const file = (entry.files[index] ??= { uuid: crypto.randomUUID() });
    if (file.token) continue;
    if (!entry.owner)
      throw new Error("Sign in to ArtCraft, then retry the library import.");
    // Store the upload key before starting. Retrying an interrupted request uses the same key.
    saveImport(id, entry);
    const result = await requestAaoMedia(`/jobs/${id}/files/${index}`);
    const blob = await result.blob();
    if ((await getArtCraftLibraryOwner()) !== entry.owner) {
      throw new Error(
        "Sign in to the ArtCraft account that started the job to finish importing.",
      );
    }
    const uploaded = await api.ImportGeneratedMedia({
      kind: entry.kind,
      uuid: file.uuid,
      fileName: name,
      blob,
    });
    if (!uploaded.success || !uploaded.data) {
      if (
        uploaded.success === false &&
        !/idempotency token/i.test(uploaded.errorMessage ?? "")
      ) {
        // ArtCraft explicitly rejected this upload. The next attempt needs a fresh key.
        delete entry.files[index];
      }
      throw new Error(
        uploaded.errorMessage || `Could not import ${name} to My Library.`,
      );
    }
    file.token = uploaded.data;
    saveImport(id, entry);
    window.dispatchEvent(new Event(AAO_LIBRARY_UPDATED));
  }
  const { preferences } = await GetAppPreferences();
  if (preferences.auto_download) {
    for (const [index, name] of job.files.entries()) {
      const file = entry.files[index];
      if (file.downloaded) continue;
      if (!file.token || (await getArtCraftLibraryOwner()) !== entry.owner) {
        throw new Error(
          "Sign in to the ArtCraft account that started the job to finish downloading.",
        );
      }
      const url = await getArtCraftMediaUrl(file.token);
      if (!url)
        throw new Error(
          `ArtCraft hasn't returned a download URL for ${name} yet.`,
        );
      const result = await DownloadUrl(url, {
        model: entry.provider,
        batch_index: job.files.length > 1 ? index + 1 : undefined,
      });
      if (result.status !== CommandSuccessStatus.Success)
        throw new Error(`Could not auto-download ${name}.`);
      file.downloaded = true;
      saveImport(id, entry);
    }
  }
  entry.done = true;
  saveImport(id, entry);
}

export function watchAaoLibraryImports() {
  let stopped = false;
  const tick = async () => {
    if (working || stopped) return;
    working = true;
    try {
      for (const [id, entry] of Object.entries(readImports())) {
        if (stopped || entry.done || entry.error) continue;
        let job: AaoMediaJob;
        try {
          job = await (await requestAaoMedia(`/jobs/${id}`)).json();
        } catch (error) {
          if (error instanceof MediaHttpError && error.status === 404) {
            saveImport(id, { ...entry, error: error.message });
          }
          continue;
        }
        if (job.state === "pending") continue;
        try {
          if (job.state === "failed")
            throw new Error(job.error || "Generation failed.");
          await importJob(id, entry, job);
        } catch (error) {
          saveImport(id, {
            ...entry,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } finally {
      working = false;
    }
  };
  void tick();
  const interval = setInterval(tick, 1500);
  return () => {
    stopped = true;
    clearInterval(interval);
  };
}
