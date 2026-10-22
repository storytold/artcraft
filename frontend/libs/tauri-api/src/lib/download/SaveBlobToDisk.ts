// SaveBlobToDisk: writes in-memory bytes (a Blob, e.g. a finished video-editor export) to a file on disk.
// downloadUrlToPath cannot do this: it hands the URL to a Rust HTTP client, which rejects blob: URLs
// (they only exist inside the webview). The bytes are written through the Tauri fs plugin instead.
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { downloadDir } from "@tauri-apps/api/path";
import { getAskLocationBeforeDownload } from "./LocalDownloads";

/**
 * Saves `blob` as `filename`.
 *
 * With the "Ask location before download" setting on, shows the native save dialog pre-filled with
 * `filename`; otherwise writes into the OS Downloads folder.
 *
 * Returns the absolute path written, or `null` when the user dismissed the dialog.
 */
export const saveBlobToDisk = async (
  blob: Blob,
  filename: string,
): Promise<string | null> => {
  const safeName = sanitizeFilename(filename);

  let targetPath: string;
  if (getAskLocationBeforeDownload()) {
    const chosen = await save({ defaultPath: safeName });
    if (chosen === null) return null;
    targetPath = chosen;
  } else {
    targetPath = `${await downloadDir()}/${safeName}`;
  }

  await writeFile(targetPath, new Uint8Array(await blob.arrayBuffer()));
  return targetPath;
};

// Project names become file names; path separators and characters Windows/macOS reject are replaced with "_".
export const sanitizeFilename = (filename: string): string => {
  const cleaned = filename.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim();
  return cleaned.length > 0 ? cleaned : "export";
};
