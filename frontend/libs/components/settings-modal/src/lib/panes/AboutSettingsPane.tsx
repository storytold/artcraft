import { useEffect, useRef, useState } from "react";
import {
  GetAppInfo,
  GetAppInfoPayload,
} from "@storyteller/tauri-api";
import { Label } from "@storyteller/ui-label";
import { toast } from "react-hot-toast";
import { gtagEvent } from "@storyteller/google-analytics";
import { useExperimentalStore } from "../experimental-store";

const UNLOCK_CLICK_COUNT = 7;
const UNLOCK_WINDOW_MS = 5000;

interface AboutSettingsPaneProps {}

export const AboutSettingsPane = (args: AboutSettingsPaneProps) => {
  const [appInfo, setAppInfo] = useState<
    GetAppInfoPayload | undefined
  >(undefined);

  const enabled = useExperimentalStore((s) => s.enabled);
  const enable = useExperimentalStore((s) => s.enable);
  const clickTimes = useRef<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const prefs = await GetAppInfo();
      setAppInfo(prefs.payload);
    };
    fetchData();
  }, []);

  const handleVersionClick = () => {
    if (enabled) return;
    const now = performance.now();
    const recent = clickTimes.current.filter((t) => now - t < UNLOCK_WINDOW_MS);
    recent.push(now);
    clickTimes.current = recent;
    if (recent.length >= UNLOCK_CLICK_COUNT) {
      clickTimes.current = [];
      enable();
      gtagEvent("unlock_experimental_menu", {});
      toast.success("Experimental features unlocked");
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>
            Artcraft Version
          </Label>
          <div
            onClick={handleVersionClick}
            style={{ cursor: "default", userSelect: "none" }}
          >
            {appInfo?.artcraft_version}
          </div>
        </div>

        <div className="space-y-1">
          <Label>Artcraft Host</Label>
          <div>{appInfo?.storyteller_host}</div>
        </div>

        <div className="space-y-1">
          <Label>Git Commit ID</Label>
          <div>{appInfo?.git_commit_short_id} &middot; {appInfo?.git_commit_id}</div>
        </div>

        <div className="space-y-1">
          <Label>Git Commit Timestamp</Label>
          <div>{appInfo?.git_commit_timestamp}</div>
        </div>

        <div className="space-y-1">
          <Label>
            Build Timestamp
          </Label>
          <div>{appInfo?.build_timestamp}</div>
        </div>

        <div className="space-y-1">
          <Label>
            Operating System
          </Label>
          <div>{appInfo?.os_platform} ({appInfo?.os_version})</div>
        </div>

        <div className="space-y-1">
          <Label>
            Artcraft Data Directory
          </Label>
          <div>{appInfo?.artcraft_root_directory}</div>
        </div>

        <div className="space-y-1">
          <Label>
            Downloads Directory
          </Label>
          <div>{appInfo?.download_directory}</div>
        </div>

      </div>
    </>
  );
};
