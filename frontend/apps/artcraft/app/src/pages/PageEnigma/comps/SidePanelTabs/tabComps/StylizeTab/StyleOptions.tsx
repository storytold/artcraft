import { PremiumLock } from "~/components";
import { useShallow } from "zustand/shallow";
import { Switch } from "@headlessui/react";
import { twMerge } from "tailwind-merge";

import { useContext } from "react";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";
import { usePageEnigmaStore } from "~/pages/PageEnigma/PageEnigmaStore";

export function StyleOptions() {
  const editorEngine = useContext(EngineContext);
  const {
    faceDetail,
    upscale,
    lipSync,
    cinematic,
    enginePreProcessing,
    setFaceDetail,
    setUpscale,
    setLipSync,
    setCinematic,
    setEnginePreProcessing,
  } = usePageEnigmaStore(
    useShallow((s) => ({
      faceDetail: s.faceDetail,
      upscale: s.upscale,
      lipSync: s.lipSync,
      cinematic: s.cinematic,
      enginePreProcessing: s.enginePreProcessing,
      setFaceDetail: s.setFaceDetail,
      setUpscale: s.setUpscale,
      setLipSync: s.setLipSync,
      setCinematic: s.setCinematic,
      setEnginePreProcessing: s.setEnginePreProcessing,
    })),
  );

  const handleCinematicChange = () => {
    const next = !cinematic;
    setCinematic(next);
    if (next) setUpscale(false);
  };

  const enginePreProcessingChange = () => {
    const next = !enginePreProcessing;
    setEnginePreProcessing(next);
    if (editorEngine) {
      editorEngine.engine_preprocessing = next;
    }
  };

  const handleUpscaleChange = () => {
    const next = !upscale;
    setUpscale(next);
    if (next) setCinematic(false);
  };

  const handleLipsyncChange = () => setLipSync(!lipSync);
  const handleFaceDetailerChange = () => setFaceDetail(!faceDetail);

  return (
    <div className="flex w-full flex-col justify-center gap-4 rounded-b-lg bg-ui-panel">
      <div className="w-full">
        <div>
          <div className="flex items-center py-[6px]">
            <Switch.Group>
              <Switch.Label
                className={twMerge(
                  "mr-3 grow text-sm font-medium transition-opacity",
                )}
              >
                Sync Lips with Speech
              </Switch.Label>
              <Switch
                checked={lipSync}
                onChange={handleLipsyncChange}
                className={twMerge(
                  lipSync
                    ? "bg-brand-primary hover:bg-brand-primary-400"
                    : "bg-brand-secondary-800 hover:bg-brand-secondary-600",
                  "focus:ring-indigo-500 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0",
                )}
              >
                <span
                  className={`${
                    lipSync ? "translate-x-6" : "translate-x-1"
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </Switch.Group>
            <hr className="opacity-[5%]" />
          </div>
        </div>
        <PremiumLock requiredPlan="any" plural={true} className="mt-2">
          <div className="flex flex-col gap-[6px]">
            <hr className="opacity-[5%]" />
            <div className="flex w-full items-center">
              <Switch.Group>
                <Switch.Label
                  className={twMerge(
                    "mr-3 grow text-sm font-medium transition-opacity",
                  )}
                >
                  Face Detailer
                </Switch.Label>
                <Switch
                  checked={faceDetail}
                  onChange={handleFaceDetailerChange}
                  className={twMerge(
                    faceDetail
                      ? "bg-brand-primary hover:bg-brand-primary-400"
                      : "bg-brand-secondary-800 hover:bg-brand-secondary-600",
                    "focus:ring-indigo-500 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0",
                  )}
                >
                  <span
                    className={`${
                      faceDetail ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </Switch.Group>
            </div>

            <hr className="opacity-[5%]" />
            <div className="flex w-full items-center">
              <Switch.Group>
                <Switch.Label
                  className={twMerge(
                    "mr-3 grow text-sm font-medium transition-opacity",
                    cinematic ? "opacity-50" : "",
                  )}
                >
                  Upscale
                </Switch.Label>
                <Switch
                  checked={upscale}
                  onChange={handleUpscaleChange}
                  className={twMerge(
                    upscale
                      ? "bg-brand-primary hover:bg-brand-primary-400"
                      : "bg-brand-secondary-800 hover:bg-brand-secondary-600",
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0",
                  )}
                >
                  <span
                    className={`${
                      upscale ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </Switch.Group>
            </div>
            <hr className="opacity-[5%]" />
            <div className="flex items-center">
              <Switch.Group>
                <Switch.Label
                  className={twMerge(
                    "mr-3 grow text-sm font-medium transition-opacity",
                    upscale ? "opacity-50" : "",
                  )}
                >
                  Use Cinematic
                </Switch.Label>
                <Switch
                  checked={cinematic}
                  onChange={handleCinematicChange}
                  className={twMerge(
                    cinematic
                      ? "bg-brand-primary hover:bg-brand-primary-400"
                      : "bg-brand-secondary-800 hover:bg-brand-secondary-600",
                    "focus:ring-indigo-500 relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none focus:ring-0 focus:ring-offset-0",
                  )}
                >
                  <span
                    className={`${
                      cinematic ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </Switch.Group>
            </div>
            <hr className="opacity-[5%]" />
            <div className="flex w-full items-center">
              <Switch.Group>
                <Switch.Label
                  className={twMerge(
                    "mr-3 grow text-sm font-medium transition-opacity",
                  )}
                >
                  Engine Preprocessing
                </Switch.Label>
                <Switch
                  checked={enginePreProcessing}
                  onChange={enginePreProcessingChange}
                  className={twMerge(
                    enginePreProcessing
                      ? "bg-brand-primary hover:bg-brand-primary-400"
                      : "bg-brand-secondary-800 hover:bg-brand-secondary-600",
                    "focus:ring-indigo-500 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0",
                  )}
                >
                  <span
                    className={`${
                      enginePreProcessing ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </Switch.Group>
            </div>
            <hr className="opacity-[5%]" />
          </div>
        </PremiumLock>
      </div>
    </div>
  );
}
