import {
  getCreatorIconPath,
  IMAGE_MODELS,
  VIDEO_MODELS,
} from "@storyteller/model-list";

interface BadgeInfo {
  id: string;
  label: string;
  iconSrc: string;
}

interface ModelBadgeGridProps {
  className?: string;
}

const ROW_COUNT = 3;
// Per-row marquee durations (seconds). Deliberately mismatched so the three
// rows never move in lockstep.
const ROW_DURATIONS = [56, 68, 62];

// Transparent border in the base keeps the box size constant when the hover
// highlight border appears, so the marquee doesn't jitter. The chip lights up
// only while the pointer is over it.
const badgeClasses =
  "rounded-2xl px-6 py-3 text-2xl font-normal flex-shrink-0 bg-[#121212] text-white/90 text-center h-[58px] flex items-center justify-center gap-1.5 border-2 border-transparent transition-all duration-300 hover:bg-primary/30 hover:text-white hover:font-semibold hover:shadow-lg hover:border-primary/60";

// Build one badge per unique model (deduped by display name so e.g. an
// image+video pair like "Grok" only shows once), pulling the correct brand
// icon from the canonical model mapping.
const BADGES: BadgeInfo[] = (() => {
  const seen = new Set<string>();
  const badges: BadgeInfo[] = [];
  for (const model of [...IMAGE_MODELS, ...VIDEO_MODELS]) {
    if (seen.has(model.fullName)) continue;
    seen.add(model.fullName);
    badges.push({
      id: model.id,
      label: model.fullName,
      iconSrc: getCreatorIconPath(model.creator),
    });
  }
  return badges;
})();

// Distribute badges round-robin across the rows so each row carries a mix of
// brands rather than all of one creator clumping together.
const ROWS: BadgeInfo[][] = Array.from({ length: ROW_COUNT }, () => []);
BADGES.forEach((badge, i) => {
  ROWS[i % ROW_COUNT].push(badge);
});

export default function ModelBadgeGrid({
  className = "",
}: ModelBadgeGridProps) {
  return (
    <div
      className={`select-none relative z-10 h-full overflow-hidden ${className}`}
    >
      {/* Gradient fade overlays mask the marquee edges */}
      <div className="absolute left-0 top-0 w-32 xl:w-96 h-full bg-gradient-to-r from-[#080808] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 w-32 xl:w-96 h-full bg-gradient-to-l from-[#080808] to-transparent z-10 pointer-events-none" />

      <div className="flex flex-col gap-4 h-full justify-center py-4">
        {ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="overflow-hidden">
            <div
              className="flex w-max motion-reduce:[animation:none]"
              style={{
                animationName: "marquee-track",
                animationDuration: `${ROW_DURATIONS[rowIdx]}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                // Even rows scroll right (reversed), odd rows scroll left.
                animationDirection: rowIdx % 2 === 0 ? "reverse" : "normal",
              }}
            >
              {/* Two identical copies make the loop seamless: translating the
                  track by -50% lands exactly on the start of the second copy. */}
              {[0, 1].map((copy) => (
                <div
                  key={copy}
                  className="flex gap-4 pr-4 flex-shrink-0"
                  aria-hidden={copy === 1}
                >
                  {row.map((badge) => (
                    <div key={`${copy}-${badge.id}`} className={badgeClasses}>
                      <span className="mr-2 w-6 h-6 inline-flex">
                        <img
                          src={badge.iconSrc}
                          alt=""
                          className="w-full h-full invert"
                        />
                      </span>
                      {badge.label}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
