import { useEffect, useState } from "react";
import { SoundManager } from "@storyteller/soundboard";
import { Button } from "@storyteller/ui-button";
import { faPlay } from "@fortawesome/pro-solid-svg-icons";
import {
  AppPreferencesPayload,
  GetAppPreferences,
} from "@storyteller/tauri-api";
import { PreferenceName, UpdateAppPreferences } from "@storyteller/tauri-api";
import { Select, SelectValue } from "@storyteller/ui-select";
import { Switch } from "@storyteller/ui-switch";
import { Label } from "@storyteller/ui-label";

interface AudioSettingsPaneProps {}

export const AudioSettingsPane = (args: AudioSettingsPaneProps) => {
  const [preferences, setPreferences] = useState<
    AppPreferencesPayload | undefined
  >(undefined);

  useEffect(() => {
    const fetchData = async () => {
      const prefs = await GetAppPreferences();
      setPreferences(prefs.preferences);
    };
    fetchData();
  }, []);

  const playSounds = preferences?.play_sounds || false;

  const deleteFileSound = orNone(preferences?.delete_file_sound);
  const enqueueSuccessSound = orNone(preferences?.enqueue_success_sound);
  const enqueueFailureSound = orNone(preferences?.enqueue_failure_sound);
  const generationSuccessSound = orNone(preferences?.generation_success_sound);
  const generationFailureSound = orNone(preferences?.generation_failure_sound);

  const reloadPreferences = async () => {
    const prefs = await GetAppPreferences();
    setPreferences(prefs.preferences);
  };

  const setPlaySounds = async (checked: boolean) => {
    //const value = checked ? "true" : "false";
    await UpdateAppPreferences({
      preference: PreferenceName.PlaySounds,
      value: checked,
    });
    await reloadPreferences();
  };

  const setDeleteFileSound = async (val: string) => {
    let sendVal = val === "none" ? undefined : val;
    await UpdateAppPreferences({
      preference: PreferenceName.DeleteFileSound,
      value: sendVal,
    });
    SoundManager.playPreview(val);
    await reloadPreferences();
  };

  const setEnqueueSuccessSound = async (val: string) => {
    let sendVal = val === "none" ? undefined : val;
    await UpdateAppPreferences({
      preference: PreferenceName.EnqueueSuccessSound,
      value: sendVal,
    });
    SoundManager.playPreview(val);
    await reloadPreferences();
  };

  const setEnqueueFailureSound = async (val: string) => {
    let sendVal = val === "none" ? undefined : val;
    await UpdateAppPreferences({
      preference: PreferenceName.EnqueueFailureSound,
      value: sendVal,
    });
    SoundManager.playPreview(val);
    await reloadPreferences();
  };

  const setSuccessSound = async (val: string) => {
    let sendVal = val === "none" ? undefined : val;
    await UpdateAppPreferences({
      preference: PreferenceName.GenerationSuccessSound,
      value: sendVal,
    });
    SoundManager.playPreview(val);
    await reloadPreferences();
  };

  const setFailureSound = async (val: string) => {
    let sendVal = val === "none" ? undefined : val;
    await UpdateAppPreferences({
      preference: PreferenceName.GenerationFailureSound,
      value: sendVal,
    });
    SoundManager.playPreview(val);
    await reloadPreferences();
  };

  const playSound = (val?: string) => {
    if (val !== undefined && val !== "none") {
      SoundManager.playPreview(val);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col">
          <Label htmlFor="play-sounds">
            Play Notification Sounds for Events?
          </Label>
          <Switch enabled={playSounds} setEnabled={setPlaySounds} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="success-sound">Delete File Sound</Label>
          <div className="flex items-center gap-2">
            <Select
              id="success-sound"
              value={deleteFileSound}
              onChange={(val: SelectValue) => setDeleteFileSound(val as string)}
              options={SoundManager.OPTIONS}
              className="grow"
            />
            <Button
              variant="primary"
              className="w-[40px] h-[40px]"
              icon={faPlay}
              onClick={() => playSound(deleteFileSound)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="success-sound">Enqueue Success Sound</Label>
          <div className="flex items-center gap-2">
            <Select
              id="success-sound"
              value={enqueueSuccessSound}
              onChange={(val: SelectValue) => setEnqueueSuccessSound(val as string)}
              options={SoundManager.OPTIONS}
              className="grow"
            />
            <Button
              variant="primary"
              className="w-[40px] h-[40px]"
              icon={faPlay}
              onClick={() => playSound(enqueueSuccessSound)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="success-sound">Enqueue Failure Sound</Label>
          <div className="flex items-center gap-2">
            <Select
              id="success-sound"
              value={enqueueFailureSound}
              onChange={(val: SelectValue) => setEnqueueFailureSound(val as string)}
              options={SoundManager.OPTIONS}
              className="grow"
            />
            <Button
              variant="primary"
              className="w-[40px] h-[40px]"
              icon={faPlay}
              onClick={() => playSound(enqueueFailureSound)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="success-sound">Generation Success Sound</Label>
          <div className="flex items-center gap-2">
            <Select
              id="success-sound"
              value={generationSuccessSound}
              onChange={(val: SelectValue) => setSuccessSound(val as string)}
              options={SoundManager.OPTIONS}
              className="grow"
            />
            <Button
              variant="primary"
              className="w-[40px] h-[40px]"
              icon={faPlay}
              onClick={() => playSound(generationSuccessSound)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="failure-sound">Generation Failure Sound</Label>
          <div className="flex items-center gap-2">
            <Select
              id="failure-sound"
              value={generationFailureSound}
              onChange={(val: SelectValue) => setFailureSound(val as string)}
              options={SoundManager.OPTIONS}
              className="grow"
            />
            <Button
              variant="primary"
              className="w-[40px] h-[40px]"
              icon={faPlay}
              onClick={() => playSound(generationFailureSound)}
            />
          </div>
        </div>

      </div>
    </>
  );
};

const orNone = (val: string | undefined | null): string => {
  if (!!!val) {
    return "none";
  }
  return val;
};
