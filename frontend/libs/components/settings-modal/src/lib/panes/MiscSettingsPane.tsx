import { useEffect, useState } from "react";
import { Button } from "@storyteller/ui-button";
import {
  AppPreferencesPayload,
  CustomDirectory,
  GetAppPreferences,
  SystemDirectory,
} from "@storyteller/tauri-api";
import { PreferenceName, UpdateAppPreferences } from "@storyteller/tauri-api";
import { open } from "@tauri-apps/plugin-dialog";
import { Label } from "@storyteller/ui-label";
import { Switch } from "@storyteller/ui-switch";
import { DownloadDirectoryReveal } from "@storyteller/tauri-api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faMagnifyingGlass,
  faRotateLeft,
} from "@fortawesome/pro-solid-svg-icons";
import { useEnterToGenerateStore } from "@storyteller/ui-promptbox";
import {
  getAskLocationBeforeDownload,
  setAskLocationBeforeDownload,
} from "@storyteller/api";

interface MiscSettingsPaneProps {}

export const MiscSettingsPane = (args: MiscSettingsPaneProps) => {
  const [preferences, setPreferences] = useState<
    AppPreferencesPayload | undefined
  >(undefined);

  const enterToGenerate = useEnterToGenerateStore((s) => s.enabled);
  const setEnterToGenerate = useEnterToGenerateStore((s) => s.setEnabled);

  const [askLocationBeforeDownload, setAskLocationBeforeDownloadState] =
    useState<boolean>(() => getAskLocationBeforeDownload());

  const toggleAskLocationBeforeDownload = (enabled: boolean) => {
    setAskLocationBeforeDownload(enabled);
    setAskLocationBeforeDownloadState(enabled);
  };

  useEffect(() => {
    const fetchData = async () => {
      const prefs = await GetAppPreferences();
      console.log("prefs", prefs);
      setPreferences(prefs.preferences);
    };
    fetchData();
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
    console.log("prefs", prefs);
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

  return (
    <div className="space-y-4 text-base-fg">
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
          <FontAwesomeIcon icon={faFolder} />
          Choose Directory
        </Button>
        <Button variant="destructive" onClick={clearDirectory}>
          <FontAwesomeIcon icon={faRotateLeft} />
          Use Default
        </Button>
        <Button variant="secondary" onClick={showDirectory}>
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          Show Directory
        </Button>
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
          enabled={askLocationBeforeDownload}
          setEnabled={toggleAskLocationBeforeDownload}
        />
      </div>
      <div className="flex flex-col gap-2 pt-3">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="enter-to-generate">Enter to generate</Label>
          <p className="text-xs opacity-70">
            When on, pressing Enter submits the prompt and Shift+Enter adds a
            new line. When off (default), both Enter and Shift+Enter add a new
            line - use only the button to submit.
          </p>
        </div>
        <Switch enabled={enterToGenerate} setEnabled={setEnterToGenerate} />
      </div>
    </div>
  );
};
