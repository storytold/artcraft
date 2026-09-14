
import { download } from "@tauri-apps/plugin-upload";
import { open, save } from "@tauri-apps/plugin-dialog";
import { DownloadUrl, GetDownloadPath } from "@storyteller/tauri-api";

const ASK_LOCATION_BEFORE_DOWNLOAD_KEY = "artcraft_ask_location_before_download";

export const getAskLocationBeforeDownload = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ASK_LOCATION_BEFORE_DOWNLOAD_KEY) === "true";
  } catch {
    return false;
  }
};

export const setAskLocationBeforeDownload = (enabled: boolean): void => {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      window.localStorage.setItem(ASK_LOCATION_BEFORE_DOWNLOAD_KEY, "true");
    } else {
      window.localStorage.removeItem(ASK_LOCATION_BEFORE_DOWNLOAD_KEY);
    }
  } catch {
    // ignore storage failures
  }
};

/**
 * Prompts the user with a native save dialog if the
 * "Ask location before download" setting is on.
 *
 * Returns:
 *  - the chosen absolute path when the user picked one
 *  - `null` when the user dismissed the dialog (caller should abort)
 *  - `undefined` when the toggle is off (caller should fall back to default)
 */
export const promptDownloadLocationIfNeeded = async (
  url: string,
  model?: string,
): Promise<string | null | undefined> => {
  if (!getAskLocationBeforeDownload()) return undefined;
  const { path } = await GetDownloadPath(url, { model });
  const chosen = await save({ defaultPath: path });
  return chosen ?? null;
};

/**
 * Prompts the user to pick a directory (e.g. for batch downloads).
 * Returns the chosen absolute path, or `null` when dismissed.
 */
export const pickDownloadDirectory = async (): Promise<string | null> => {
  const chosen = await open({ directory: true, multiple: false });
  return typeof chosen === "string" ? chosen : null;
};

/** Downloads `url` to an explicit absolute filesystem path. */
export const downloadUrlToPath = async (url: string, path: string) => {
  await download(url, path);
};

export const downloadFileFromUrl = async (url: string, _mediaClass?: string, model?: string) => {
  console.log("GOT THE URL", url);
  try {
    const chosen = await promptDownloadLocationIfNeeded(url, model);
    if (chosen === null) {
      // User dismissed the picker.
      return;
    }
    if (typeof chosen === "string") {
      await download(url, chosen);
    } else {
      await DownloadUrl(url, { model });
    }
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};
