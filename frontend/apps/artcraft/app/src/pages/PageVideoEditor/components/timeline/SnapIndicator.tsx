interface Props {
  x: number | null;
  height: number;
}

export function SnapIndicator({ x, height }: Props) {
  if (x === null) return null;

  return (
    <div
      className="pointer-events-none absolute top-0 z-30 w-[1px] bg-yellow-400"
      style={{ left: x, height }}
    />
  );
}
