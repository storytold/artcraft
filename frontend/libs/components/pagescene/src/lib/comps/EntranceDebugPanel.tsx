// Dev-only floating control for tuning the drop-in entrance animation timing
// without re-editing constants. Mounted only under import.meta.env.DEV in
// Stage3DBody. Sets the shared `entranceDebugSettings.durationScale`, which the
// EntranceAnimator reads when a new object is dropped — so move the slider, then
// drop an object to see it at that speed.

import { useEffect, useState } from "react";
import {
  ENTRANCE_BASE_DURATIONS,
  entranceDebugSettings,
} from "../engine/entranceAnimation";

// The preferred timing is now baked into ENTRANCE_BASE_DURATIONS, so the panel
// starts at 1× (real) and just lets you scale around it while tuning.
const DEFAULT_SCALE = 1;

export function EntranceDebugPanel() {
  const [scale, setScale] = useState(DEFAULT_SCALE);

  // Keep the shared knob in sync with this panel's lifetime (dev only).
  useEffect(() => {
    entranceDebugSettings.durationScale = DEFAULT_SCALE;
    return () => {
      entranceDebugSettings.durationScale = 1;
    };
  }, []);

  const apply = (value: number) => {
    entranceDebugSettings.durationScale = value;
    setScale(value);
  };

  const meshSec = (ENTRANCE_BASE_DURATIONS.mesh * scale).toFixed(2);
  const splatSec = (ENTRANCE_BASE_DURATIONS.splat * scale).toFixed(2);

  return (
    <div className="pointer-events-auto absolute right-2 top-16 z-50 w-56 rounded-lg border border-white/10 bg-black/70 p-3 text-xs text-white/80 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between font-medium text-white/90">
        <span>Entrance speed</span>
        <span className="tabular-nums">{scale.toFixed(2)}×</span>
      </div>
      <input
        type="range"
        min={0.25}
        max={12}
        step={0.25}
        value={scale}
        onChange={(e) => apply(parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="mt-2 flex justify-between tabular-nums text-white/50">
        <span>mesh {meshSec}s</span>
        <span>splat {splatSec}s</span>
      </div>
      <button
        type="button"
        onClick={() => apply(1)}
        className="mt-2 w-full rounded border border-white/10 py-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white/90"
      >
        Reset to 1× (real timing)
      </button>
    </div>
  );
}
