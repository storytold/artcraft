import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  BUILT_IN_SAFE_ZONES,
  matchingSafeZones,
  type SafeZone,
} from "@storyteller/common";
import { useSceneStore } from "../stores/SceneState";
import { useCanvasPresetsStore } from "../stores/CanvasPresetsStore";

/**
 * The safe zones that fit the canvas as it is now, built-in and the user's
 * own, and the one shown over it. A safe zone shows only while the canvas has
 * exactly its aspect ratio; when a result of another ratio becomes the base
 * image, `shown` turns null and comes back if the canvas fits again.
 */
export function useCanvasSafeZones(): {
  width: number;
  height: number;
  matching: SafeZone[];
  shown: SafeZone | null;
  show: (id: string | null) => void;
} {
  const customPresets = useCanvasPresetsStore((s) => s.customPresets);
  const { width, height, safeZoneId, setSafeZoneId } = useSceneStore(
    useShallow((s) => ({
      ...s.getAspectRatioDimensions(),
      safeZoneId: s.safeZoneId,
      setSafeZoneId: s.setSafeZoneId,
    })),
  );
  const matching = useMemo(
    () =>
      matchingSafeZones(
        [
          ...BUILT_IN_SAFE_ZONES,
          ...customPresets.flatMap((preset) => preset.safeZones),
        ],
        width,
        height,
      ),
    [customPresets, width, height],
  );
  const shown = matching.find((zone) => zone.id === safeZoneId) ?? null;
  return { width, height, matching, shown, show: setSafeZoneId };
}
