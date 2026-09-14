import { useEffect, useState } from "react";
import { Button } from "@storyteller/ui-button";
import {
  AppPreferencesPayload,
  CustomDirectory,
  DownloadDirectoryReveal,
  GetAppPreferences,
  PreferenceName,
  PreferredDownloadFilename,
  SystemDirectory,
  UpdateAppPreferences,
} from "@storyteller/tauri-api";
import { open } from "@tauri-apps/plugin-dialog";
import { Label } from "@storyteller/ui-label";
import { Switch } from "@storyteller/ui-switch";
import { Select } from "@storyteller/ui-select";
import { FolderIcon, RotateCcwIcon, SearchIcon } from "lucide-react";
import {
  getAskLocationBeforeDownload,
  setAskLocationBeforeDownload,
} from "@storyteller/api";

const DEFAULT_CUSTOM_FORMAT = "{model}_{date}";
const FILENAME_OPTIONS = [
  { value: "artcraft_convention", label: "ArtCraft convention" },
  { value: "custom", label: "Custom format" },
];

export const DownloadsSettingsPane = () => {
  const [preferences, setPreferences] = useState<
    AppPreferencesPayload | undefined
  >(undefined);
  const [filenameMode, setFilenameMode] = useState("artcraft_convention");
  const [customFormat, setCustomFormat] = useState(DEFAULT_CUSTOM_FORMAT);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [askLocationBeforeDownload, setAskLocationBeforeDownloadState] =
    useState<boolean>(() => getAskLocationBeforeDownload());

  const toggleAskLocationBeforeDownload = (enabled: boolean) => {
    setAskLocationBeforeDownload(enabled);
    setAskLocationBeforeDownloadState(enabled);
  };

  useEffect(() => {
    const fetchData = async () => {
      const prefs = await GetAppPreferences();
      setPreferences(prefs.preferences);
      const filename = prefs.preferences.preferred_download_filename;
      if (filename && typeof filename === "object") {
        setFilenameMode("custom");
        setCustomFormat(filename.custom_format);
      }
    };
    fetchData().catch((error) => setSettingsError(String(error)));
  }, []);

  // NB: This might be a complex type.
  const outerDownloadObject = preferences?.preferred_download_directory || {};
  const downloadDirectory =
    "custom" in outerDownloadObject
      ? (outerDownloadObject.custom as string)
      : "";
  const currentDownloadLabel =
    "system" in outerDownloadObject
      ? "System Download Directory"
      : downloadDirectory;

  const reloadPreferences = async () => {
    const prefs = await GetAppPreferences();
    setPreferences(prefs.preferences);
  };

  const openDirectoryPicker = async () => {
    let directory = await open({
      multiple: false,
      directory: true,
      defaultPath: downloadDirectory || undefined,
    });
    if (directory === null) {
      return; // User dismissed the dialog choice
    }
    await UpdateAppPreferences({
      preference: PreferenceName.PreferredDownloadDirectory,
      value: {
        custom: directory,
      } as CustomDirectory,
    });
    await reloadPreferences();
  };

  const clearDirectory = async () => {
    await UpdateAppPreferences({
      preference: PreferenceName.PreferredDownloadDirectory,
      value: {
        system: "downloads",
      } as SystemDirectory,
    });
    await reloadPreferences();
  };

  const showDirectory = async () => {
    await DownloadDirectoryReveal();
  };

  const toggleAutoDownload = async (enabled: boolean) => {
    setSaving(true);
    setSettingsError(null);
    try {
      await UpdateAppPreferences({ preference: PreferenceName.AutoDownload, value: enabled });
      await reloadPreferences();
    } catch (error) {
      setSettingsError(String(error));
    } finally {
      setSaving(false);
    }
  };

  const saveFilenamePreference = async (value: PreferredDownloadFilename) => {
    setSaving(true);
    setFormatError(null);
    try {
      await UpdateAppPreferences({ preference: PreferenceName.PreferredDownloadFilename, value });
      await reloadPreferences();
      setFilenameMode(typeof value === "string" ? value : "custom");
    } catch (error) {
      setFormatError(String(error));
    } finally {
      setSaving(false);
    }
  };

  const saveCustomFormat = async () => {
    const format = customFormat.trim();
    if (!format) {
      setFormatError("Format cannot be empty");
      return;
    }
    if (/[/\\'"`%<>|:*?\x00-\x1f\x7f]/.test(format) || format.includes("..")) {
      setFormatError("Format cannot contain slashes, quotes, or other unsafe characters");
      return;
    }
    await saveFilenamePreference({ custom_format: format });
  };

  return (
    <div className="space-y-4 text-base-fg">
      {settingsError && <p role="alert" className="text-red-400">{settingsError}</p>}
      <div className="space-y-2">
        <Label htmlFor="download-path">Default Download Directory</Label>
        <p className="opacity-80">
          This is where downloads are placed after downloading. The current path
          is:
        </p>
        <div className="py-1.5 px-2 rounded-md mt-1 bg-ui-panel border border-ui-panel-border text-base-fg">
          <pre>{currentDownloadLabel}</pre>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" onClick={openDirectoryPicker}>
          <FolderIcon />
          Choose Directory
        </Button>
        <Button variant="destructive" onClick={clearDirectory}>
          <RotateCcwIcon />
          Use Default
        </Button>
        <Button variant="secondary" onClick={showDirectory}>
          <SearchIcon />
          Show Directory
        </Button>
      </div>
      <div className="flex flex-col gap-2 pt-3">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="auto-download">Auto Download</Label>
          <p className="text-xs opacity-70">
            Downloads to your system the minute generations complete
          </p>
        </div>
        <Switch
          id="auto-download"
          label="Auto Download"
          enabled={preferences?.auto_download ?? false}
          setEnabled={toggleAutoDownload}
          disabled={!preferences || saving}
        />
      </div>
      <div className="flex flex-col gap-2 pt-3">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="ask-location-before-download">
            Ask location before download
          </Label>
          <p className="text-xs opacity-70">
            When on, a system file picker appears every time you download from
            the lightbox or anywhere in the app, letting you choose the save
            location for that file. When off, downloads go straight to the
            default download directory above.
          </p>
        </div>
        <Switch
          id="ask-location-before-download"
          label="Ask location before download"
          enabled={askLocationBeforeDownload}
          setEnabled={toggleAskLocationBeforeDownload}
        />
      </div>
      <fieldset disabled={!preferences || saving} className="flex flex-col gap-2 border-0 p-0">
        <Label htmlFor="download-filename-mode">Preferred download naming scheme</Label>
        <p className="text-xs opacity-70">
          {"The ArtCraft convention is {model}_{date}.{ext}, with a batch number when a generation produces several files."}
        </p>
        <div className="max-w-xs">
          <Select
            id="download-filename-mode"
            options={FILENAME_OPTIONS}
            value={filenameMode}
            onChange={(value) => {
              setFormatError(null);
              if (value === "custom") {
                setFilenameMode("custom");
              } else {
                saveFilenamePreference("artcraft_convention");
              }
            }}
          />
        </div>
        {filenameMode === "custom" && (
          <>
            <Label htmlFor="download-filename-format">Custom format</Label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="download-filename-format"
                type="text"
                value={customFormat}
                onChange={(event) => setCustomFormat(event.target.value)}
                placeholder={DEFAULT_CUSTOM_FORMAT}
                spellCheck={false}
                className="min-w-0 flex-1 rounded-md border border-ui-controls-border bg-ui-controls px-3 py-2 font-mono text-xs"
              />
              <Button variant="secondary" onClick={saveCustomFormat}>Save format</Button>
            </div>
            <p className="text-xs opacity-70">
              {"Tokens: {model}, {date}, {YYYY}, {YY}, {MM}, {DD}, {HH}, {mm}, {SS}, {batch_index}. The file extension is added automatically. Batch numbers are added automatically if omitted."}
            </p>
            <p className="text-xs opacity-70">Changes apply after you click Save format.</p>
          </>
        )}
        {formatError && <p role="alert" className="text-xs text-red-400">{formatError}</p>}
      </fieldset>
    </div>
  );
};
