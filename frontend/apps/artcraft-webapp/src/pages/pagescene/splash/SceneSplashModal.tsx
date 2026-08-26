// Edit-3D splash modal. Mirrors the design language of
// SignupCtaModal (flat near-black surface, hairline border,
// font-display heading) so the editor's onboarding modal feels
// like the rest of the webapp, not a one-off.

import { Modal } from "@storyteller/ui-modal";
import { useSceneSplashStore } from "./scene-splash-store";
import { useSceneSplashActions } from "./useSceneSplashActions";
import { SceneSplashCard } from "./SceneSplashCard";
import { EXAMPLE_SCENES } from "./example-scenes";

export function SceneSplashModal({
  currentSceneToken,
}: {
  currentSceneToken?: string;
}) {
  const isOpen = useSceneSplashStore((s) => s.isOpen);
  const close = useSceneSplashStore((s) => s.close);
  const { pickBlank, pickExample } = useSceneSplashActions(currentSceneToken);

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      className="w-full max-w-3xl overflow-hidden border border-white/15 bg-ui-modal p-0"
      childPadding={false}
      backdropClassName="!bg-black/80"
      closeOnOutsideClick
      showClose
      accessibleTitle="Start a new scene"
    >
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/15"
        />

        <div className="relative px-8 pt-10 pb-8 sm:px-10 sm:pt-12 sm:pb-10">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-[34px] sm:leading-[1.1]">
            Start a new <span className="text-primary">scene</span>.
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/55">
            Open a blank stage or pick an example to get oriented.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-5 sm:grid-cols-2">
            <SceneSplashCard
              variant="blank"
              title="Blank scene"
              description="Empty stage, your camera"
              onClick={pickBlank}
            />
            {EXAMPLE_SCENES.map((scene) => (
              <SceneSplashCard
                key={scene.id}
                variant="example"
                title={scene.title}
                description={scene.description}
                accentClass={scene.accentClass}
                outputToken={scene.outputToken}
                onClick={() => pickExample(scene)}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
