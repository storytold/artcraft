type TruchetCell = "/" | "\\";
type TruchetGrid = readonly (readonly TruchetCell[])[];

const GRID: TruchetGrid = [
  ["/", "\\", "/", "/", "\\", "/"],
  ["\\", "/", "/", "\\", "\\", "/"],
  ["/", "/", "\\", "/", "/", "\\"],
  ["\\", "/", "/", "\\", "/", "/"],
];

interface TruchetPatternProps {
  className?: string;
  intensity?: number;
}

export const TruchetPattern = ({
  className,
  intensity = 1,
}: TruchetPatternProps) => {
  const fillA = `rgba(255,255,255,${0.036 * intensity})`;
  const fillB = `rgba(255,255,255,${0.0095 * intensity})`;
  const diagStroke = `rgba(255,255,255,${0.16 * intensity})`;
  const gridStroke = `rgba(255,255,255,${0.065 * intensity})`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      {GRID.flatMap((row, ri) =>
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
};
