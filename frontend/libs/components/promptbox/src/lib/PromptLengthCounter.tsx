/** Whether a prompt of `length` characters is over the model's `maxLen` (Infinity: no limit). */
export const isOverPromptLimit = (length: number, maxLen: number) =>
  Number.isFinite(maxLen) && length > maxLen;

/** The "12 / 1000" counter in a prompt box's corner, red once the prompt is over the limit. */
export const PromptLengthCounter = ({
  prompt,
  maxLen,
  idleClassName = "text-base-fg/40",
}: {
  prompt: string;
  maxLen: number;
  idleClassName?: string;
}) => (
  <span
    className={`pointer-events-none absolute -bottom-1 right-4 text-[10px] tabular-nums ${isOverPromptLimit(prompt.length, maxLen) ? "text-red-500" : idleClassName}`}
  >
    {prompt.length} / {Number.isFinite(maxLen) ? maxLen : "∞"}
  </span>
);
