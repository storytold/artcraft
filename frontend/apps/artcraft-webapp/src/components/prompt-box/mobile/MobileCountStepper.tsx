import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/pro-solid-svg-icons";

interface MobileCountStepperProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  options?: number[] | null;
}

const DEFAULT_MAX = 4;

// Compact "- N/max +" stepper for the create bar. Steps through predefined
// batch sizes when given, otherwise 1..max.
export function MobileCountStepper({
  value,
  onChange,
  max,
  options,
}: MobileCountStepperProps) {
  const allowed = options?.length
    ? [...options].sort((a, b) => a - b)
    : Array.from({ length: max ?? DEFAULT_MAX }, (_, i) => i + 1);
  const maxValue = allowed[allowed.length - 1] ?? max ?? DEFAULT_MAX;
  const index = allowed.indexOf(value);

  const step = (delta: number) => {
    if (index === -1) {
      onChange(allowed[0]);
      return;
    }
    const next = allowed[index + delta];
    if (next != null) onChange(next);
  };

  return (
    <div className="flex h-11 shrink-0 items-center rounded-xl border border-ui-panel-border bg-ui-controls px-1">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={index <= 0}
        className="flex h-9 w-8 items-center justify-center rounded-lg text-base-fg/80 transition-colors hover:bg-white/10 disabled:opacity-30"
      >
        <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
      </button>
      <span className="min-w-10 text-center text-sm font-semibold tabular-nums text-base-fg">
        {value}/{maxValue}
      </span>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={index === allowed.length - 1}
        className="flex h-9 w-8 items-center justify-center rounded-lg text-base-fg/80 transition-colors hover:bg-white/10 disabled:opacity-30"
      >
        <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
      </button>
    </div>
  );
}
