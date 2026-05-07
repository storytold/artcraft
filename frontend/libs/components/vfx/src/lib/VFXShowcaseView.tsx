import { useEffect } from "react";
import { ShowcaseCarousel } from "./ShowcaseCarousel";
import { VFXResultCard } from "./VFXResultCard";
import { useVFXStore } from "./store";
import { VFX_SHOWCASE } from "./showcase-fixtures";

interface VFXShowcaseViewProps {
  onTryThis: () => void;
}

export const VFXShowcaseView = ({ onTryThis }: VFXShowcaseViewProps) => {
  const selectedShowcaseId = useVFXStore((s) => s.selectedShowcaseId);
  const setSelectedShowcaseId = useVFXStore((s) => s.setSelectedShowcaseId);

  useEffect(() => {
    if (!selectedShowcaseId && VFX_SHOWCASE.length > 0) {
      setSelectedShowcaseId(VFX_SHOWCASE[0].id);
    }
  }, [selectedShowcaseId, setSelectedShowcaseId]);

  const activeId = selectedShowcaseId ?? VFX_SHOWCASE[0]?.id ?? "";
  const entry = VFX_SHOWCASE.find((e) => e.id === activeId) ?? VFX_SHOWCASE[0];
  if (!entry) return null;

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-4 overflow-y-auto px-3 pb-6 pt-4 sm:px-6">
      <ShowcaseCarousel
        entries={VFX_SHOWCASE}
        activeId={activeId}
        onSelect={setSelectedShowcaseId}
      />

      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-2xl font-bold text-white">{entry.title}</h2>
        <p className="text-sm text-white/60">{entry.description}</p>
      </div>

      <VFXResultCard
        data={{
          prompt: entry.prompt,
          resolution: entry.resolution,
          source: entry.source,
          mask: entry.mask,
          reference: entry.reference,
          outputUrl: entry.outputUrl,
          status: "complete",
          title: entry.title,
        }}
        onTryThis={onTryThis}
        className="w-[min(960px,calc(100vw-32px),calc((100vh-440px)*1.7))] min-w-[min(320px,calc(100vw-32px))]"
      />
    </div>
  );
};
