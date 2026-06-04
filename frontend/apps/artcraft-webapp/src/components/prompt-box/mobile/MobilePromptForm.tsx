import { type ReactNode, useMemo } from "react";
import { GenerateButton } from "@storyteller/ui-button";
import { MentionTextarea } from "../MentionTextarea";
import { buildMentionColorMap } from "../mention-colors";
import { useMobileCreateTabs } from "../../generation-gallery/mobile-create-tabs";
import type { MentionItem } from "../types";

interface MobilePromptFormProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  placeholder?: string;
  submitLabel?: string;
  credits?: number | null;
  mentionItems?: MentionItem[];
  // Whether tapping Create will actually start a generation (logged in, prompt
  // present, no missing required input). Gates the auto-switch to History.
  autoAdvance?: boolean;

  // Layout slots, rendered top → bottom.
  banner?: ReactNode;
  inputModeSelector?: ReactNode;
  modelField: ReactNode;
  frames?: ReactNode;
  mediaRefs?: ReactNode;
  settingsFields?: ReactNode;
  extraActions?: ReactNode;
  countField?: ReactNode;
}

export function MobilePromptForm({
  prompt,
  onPromptChange,
  onSubmit,
  isSubmitting,
  placeholder = "Describe what you want...",
  submitLabel = "Create",
  credits,
  mentionItems,
  autoAdvance = true,
  banner,
  inputModeSelector,
  modelField,
  frames,
  mediaRefs,
  settingsFields,
  extraActions,
  countField,
}: MobilePromptFormProps) {
  const { goToHistory } = useMobileCreateTabs();
  // Memoize so a new colorMap identity doesn't re-fire MentionTextarea's
  // DOM-sync effect on every parent render (caret-loss source on iOS).
  const colorMap = useMemo(
    () => buildMentionColorMap(mentionItems),
    [mentionItems],
  );

  const handleCreate = () => {
    onSubmit();
    if (autoAdvance) goToHistory();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-3">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
          {banner}
          {inputModeSelector}
          {modelField}
          {frames}
          {mediaRefs}

          <div className="rounded-xl border border-ui-panel-border bg-ui-controls p-3">
            <MentionTextarea
              value={prompt}
              onChange={onPromptChange}
              mentionItems={mentionItems ?? []}
              colorMap={colorMap}
              placeholder={placeholder}
              className="min-h-[120px] max-h-[40vh] w-full text-md text-base-fg"
            />
          </div>

          {settingsFields}
          {extraActions}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-ui-panel-border bg-ui-panel px-3 py-3">
        {countField}
        <GenerateButton
          className="h-11 rounded-xl flex-1 items-center justify-center border-none bg-primary text-base text-white disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleCreate}
          disabled={!prompt.trim() || isSubmitting}
          loading={isSubmitting}
          credits={credits}
        >
          {submitLabel}
        </GenerateButton>
      </div>
    </div>
  );
}
