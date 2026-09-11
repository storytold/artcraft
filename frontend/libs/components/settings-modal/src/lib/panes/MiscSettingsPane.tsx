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
import { FolderIcon, RotateCcwIcon, SearchIcon } from "lucide-react";
import { useEnterToGenerateStore } from "@storyteller/ui-promptbox";
import { useModelPickerStyleStore } from "@storyteller/ui-popover";
import { useKeybindsStore } from "@storyteller/keybinds";
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

  const modelPickerStyle = useModelPickerStyleStore((s) => s.style);
  const setModelPickerStyle = useModelPickerStyleStore((s) => s.setStyle);

  const cheatsheetSticky = useKeybindsStore((s) => s.cheatsheetSticky);
  const setCheatsheetSticky = useKeybindsStore((s) => s.setCheatsheetSticky);

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
      <div className="flex flex-col gap-2 pt-3">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="group-models-by-family">Group models by family</Label>
          <p className="text-xs opacity-70">
            When on (default), the model picker groups models into submenus by
            family, like Seedance or Veo. When off, every model shows in one
            flat list.
          </p>
        </div>
        <Switch
          enabled={modelPickerStyle === "grouped"}
          setEnabled={(on) => setModelPickerStyle(on ? "grouped" : "flat")}
        />
      </div>
      <div className="flex flex-col gap-2 pt-3">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="cheatsheet-sticky">
            Keep shortcut cheatsheet open
          </Label>
          <p className="text-xs opacity-70">
            In the editors, holding Ctrl (⌘ on Mac) alone for a few seconds
            shows a cheatsheet of the keyboard shortcuts. When on, it stays on
            screen after you release the key until you press Esc or click
            outside it. When off (default), it disappears as soon as you let
            go.
          </p>
        </div>
        <Switch enabled={cheatsheetSticky} setEnabled={setCheatsheetSticky} />
      </div>
    </div>
  );
};
