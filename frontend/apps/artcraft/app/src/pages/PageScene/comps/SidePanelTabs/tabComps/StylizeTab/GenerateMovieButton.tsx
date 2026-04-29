import { faFilm } from "@fortawesome/pro-solid-svg-icons";
import { Label } from "~/components";
import { Button } from "@storyteller/ui-button";
import { GenerationOptions } from "~/pages/PageScene/models/generationOptions";
import { usePageSceneStore } from "~/pages/PageScene/PageSceneStore";
import { useEffect, useRef } from "react";

interface GenerateMovieButtonProps {
  setGenerateSectionHeight: (height: number) => void;
}

export function GenerateMovieButton({
  setGenerateSectionHeight,
}: GenerateMovieButtonProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Resizes Height of Generate Movie Section that's at the bottom dynamically if squeezed
  useEffect(() => {
    const currentElement = ref.current;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        if (target) {
          const height = target.offsetHeight;
          setGenerateSectionHeight(height);
        }
      }
    });

    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateMovie = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const s = usePageSceneStore.getState();
    void new GenerationOptions(
      s.upscale,
      s.faceDetail,
      s.styleStrength,
      s.lipSync,
      s.cinematic,
      s.globalIPAMediaToken,
      s.enginePreProcessing,
    );
    // TODO: wire to editor.videoGeneration.generate(options) once editor.ts is migrated.
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-0 border-t border-[#363636] bg-ui-controls/60 p-4 shadow-lg"
    >
      <Label>
        <div className="mb-2 leading-tight">
          When you&apos;re done, render your animation with AI{" "}
          <span className="text-xs font-normal text-white/70">
            (This may take several minutes)
          </span>
        </div>
      </Label>

      <Button
        icon={faFilm}
        variant="primary"
        className="h-11 w-full"
        onClick={generateMovie}
      >
        Generate Movie
      </Button>
    </div>
  );
}
