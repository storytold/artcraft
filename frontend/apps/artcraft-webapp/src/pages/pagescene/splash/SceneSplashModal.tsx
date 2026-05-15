// Edit-3D splash modal. Mirrors the design language of
// SignupCtaModal (bg-[#161618], border-white/10, off-center primary
// glow, font-display heading) so the editor's onboarding modal feels
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
      className="rounded-2xl w-full max-w-3xl overflow-hidden border border-white/10 bg-[#161618] p-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
      childPadding={false}
      backdropClassName="!bg-black/80"
      closeOnOutsideClick
      showClose
      accessibleTitle="Start a new scene"
    >
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/25 blur-[80px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
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
