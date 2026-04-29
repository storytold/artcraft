/**
 * Subtle blue-tinted Truchet (random-diagonal) tile pattern used as a
 * background flourish on landing, pricing, and content pages. Each variant
 * has its own deterministic 6x4 grid so different pages feel related but
 * not identical.
 */

type TruchetCell = "/" | "\\";
type TruchetGrid = readonly (readonly TruchetCell[])[];

export type TruchetVariant = "landing" | "pricing" | "content" | "auth";

const GRIDS: Record<TruchetVariant, TruchetGrid> = {
  landing: [
    ["/", "\\", "/", "/", "\\", "/"],
    ["\\", "/", "/", "\\", "\\", "/"],
    ["/", "/", "\\", "/", "/", "\\"],
    ["\\", "/", "/", "\\", "/", "/"],
  ],
  pricing: [
    ["\\", "\\", "/", "\\", "/", "\\"],
    ["/", "\\", "\\", "/", "\\", "/"],
    ["\\", "/", "\\", "\\", "/", "\\"],
    ["/", "\\", "/", "\\", "\\", "/"],
  ],
  content: [
    ["/", "/", "\\", "/", "\\", "\\"],
    ["\\", "\\", "/", "\\", "/", "/"],
    ["/", "\\", "\\", "/", "\\", "/"],
    ["\\", "/", "/", "\\", "/", "\\"],
  ],
  auth: [
    ["\\", "/", "\\", "/", "\\", "/"],
    ["/", "\\", "/", "\\", "/", "\\"],
    ["\\", "/", "/", "\\", "\\", "/"],
    ["/", "\\", "\\", "/", "/", "\\"],
  ],
};

interface TruchetPatternProps {
  className?: string;
  /** Multiplier on the default fill/stroke alpha. Defaults to 1. */
  intensity?: number;
  /** Which deterministic 6x4 grid to render. Defaults to "landing". */
  variant?: TruchetVariant;
}

export function TruchetPattern({
  className,
  intensity = 1,
  variant = "landing",
}: TruchetPatternProps) {
  // Slightly reduced base opacity for a quieter overall feel.
  const fillA = `rgba(120,170,255,${0.036 * intensity})`;
  const fillB = `rgba(120,170,255,${0.0095 * intensity})`;
  const diagStroke = `rgba(120,170,255,${0.16 * intensity})`;
  const gridStroke = `rgba(120,170,255,${0.065 * intensity})`;

  const grid = GRIDS[variant];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      {grid.flatMap((row, ri) =>
        row.map((dir, ci) => {
          const x = ci * 200;
          const y = ri * 200;
          const isSlash = dir === "/";
          const triA = isSlash
            ? `${x},${y} ${x + 200},${y} ${x},${y + 200}`
            : `${x},${y} ${x + 200},${y} ${x + 200},${y + 200}`;
          const triB = isSlash
            ? `${x + 200},${y} ${x + 200},${y + 200} ${x},${y + 200}`
            : `${x},${y} ${x + 200},${y + 200} ${x},${y + 200}`;
          const diag = isSlash
            ? `M${x},${y + 200}L${x + 200},${y}`
            : `M${x},${y}L${x + 200},${y + 200}`;
          return (
            <g key={`${ri}-${ci}`}>
              <polygon points={triA} fill={fillA} />
              <polygon points={triB} fill={fillB} />
              <path d={diag} stroke={diagStroke} strokeWidth="0.6" fill="none" />
            </g>
          );
        }),
      )}
      {[1, 2, 3].map((i) => (
        <line
          key={`h${i}`}
          x1="0"
          y1={i * 200}
          x2="1200"
          y2={i * 200}
          stroke={gridStroke}
          strokeWidth="0.5"
        />
      ))}
      {[1, 2, 3, 4, 5].map((i) => (
        <line
          key={`v${i}`}
          x1={i * 200}
          y1="0"
          x2={i * 200}
          y2="800"
          stroke={gridStroke}
          strokeWidth="0.5"
        />
      ))}
    </svg>
  );
}

export default TruchetPattern;

/**
 * Drop-in subtle backdrop combining a top + bottom Truchet pattern with
 * radial fades. Place once at the top of a page's root <div> (which must be
 * `relative`, as most marketing pages already are).
 */
interface PagePatternBackdropProps {
  variant?: TruchetVariant;
}

export function PagePatternBackdrop({
  variant = "content",
}: PagePatternBackdropProps) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[1100px] z-0"
        style={{
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 35%, black 25%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 35%, black 25%, transparent 80%)",
        }}
      >
        <TruchetPattern
          variant={variant}
          intensity={0.5}
          className="absolute inset-0 w-full h-full"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[700px] z-0"
        style={{
          maskImage:
            "radial-gradient(ellipse 75% 60% at 50% 60%, black 20%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 60% at 50% 60%, black 20%, transparent 80%)",
        }}
      >
        <TruchetPattern
          variant={variant}
          intensity={0.5}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </>
  );
}
