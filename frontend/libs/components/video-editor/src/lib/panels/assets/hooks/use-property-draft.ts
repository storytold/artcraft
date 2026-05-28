import { useState } from "react";
import { evaluateMathExpression } from "../../../utils/math";

// Local copy of the property-draft hook from the properties panel. We
// duplicate it (rather than reach into ../properties/hooks/...) so this
// panel can build without depending on whether the sibling properties
// port has landed yet. Drop this file once the shared properties hooks
// expose a stable lib-internal import path.

function looksLikeExpression({ input }: { input: string }): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (/[+*/]/.test(input)) return true;
  const minusIndex = trimmed.indexOf("-");
  return minusIndex > 0;
}

export function usePropertyDraft<T>({
  displayValue: sourceDisplay,
  parse,
  onPreview,
  onCommit,
  onStartEditing,
  supportsExpressions = true,
}: {
  displayValue: string;
  parse: (input: string) => T | null;
  onPreview: (value: T) => void;
  onCommit: () => void;
  onStartEditing?: () => void;
  supportsExpressions?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  return {
    displayValue: isEditing ? draft : sourceDisplay,
    scrubTo: (value: number) => {
      const parsed = parse(String(value));
      if (parsed !== null) onPreview(parsed);
    },
    commitScrub: onCommit,
    onFocus: () => {
      setIsEditing(true);
      setDraft(sourceDisplay);
      onStartEditing?.();
    },
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const nextDraft = event.target.value;
      setDraft(nextDraft);

      const parsed = parse(nextDraft);
      if (parsed !== null) {
        onPreview(parsed);
      }
    },
    onBlur: (
      event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const nextDraft = event.target.value;
      if (supportsExpressions && looksLikeExpression({ input: nextDraft })) {
        const evaluated = evaluateMathExpression({ input: nextDraft });
        if (evaluated !== null) {
          const parsed = parse(String(evaluated));
          if (parsed !== null) onPreview(parsed);
        }
      }
      onCommit();
      setIsEditing(false);
      setDraft("");
    },
  };
}
