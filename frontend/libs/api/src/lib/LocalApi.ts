
import { download } from "@tauri-apps/plugin-upload";
import { downloadDir } from "@tauri-apps/api/path";
import { save } from "@tauri-apps/plugin-dialog";

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

const deriveDownloadFilename = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const last = urlObj.pathname.split("/").pop();
    if (last && last.length > 0) return last;
  } catch {
    // fall through
  }
  return "downloaded_file";
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
): Promise<string | null | undefined> => {
  if (!getAskLocationBeforeDownload()) return undefined;
  const filename = deriveDownloadFilename(url);
  const chosen = await save({ defaultPath: filename });
  return chosen ?? null;
};

/** Downloads `url` to an explicit absolute filesystem path. */
export const downloadUrlToPath = async (url: string, path: string) => {
  await download(url, path);
};

export const downloadFileFromUrl = async (url: string) => {
  console.log("GOT THE URL", url);
  try {
    const filename = deriveDownloadFilename(url);

    let filePath: string;
    const chosen = await promptDownloadLocationIfNeeded(url);
    if (chosen === null) {
      // User dismissed the picker.
      return;
    }
    if (typeof chosen === "string") {
      filePath = chosen;
    } else {
      const downloadsPath = await downloadDir();
      filePath = `${downloadsPath}/${filename}`;
    }

    await download(url, filePath);

    console.log(
      `File downloaded and saved to ${filePath}`,
    );
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};
