import { cn } from "@/lib/utils";

interface RawTagProps {
  value: string;
  className?: string;
}

// Renders a raw backend enum value (e.g. "complete_success") in a small muted
// monospace pill. Pair next to a humanized label so debugging is unambiguous.
export function RawTag({ value, className }: RawTagProps) {
  return (
    <span
      title="Raw backend value"
      className={cn(
        "text-[10px] font-mono text-muted-foreground/60 leading-none",
        className,
      )}
    >
      {value}
    </span>
  );
}
