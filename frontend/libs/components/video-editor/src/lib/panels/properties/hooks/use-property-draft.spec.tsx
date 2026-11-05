import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { usePropertyDraft } from "./use-property-draft";
import { usePropertyDraft as useAssetPropertyDraft } from "../../assets/hooks/use-property-draft";

it.each([usePropertyDraft, useAssetPropertyDraft])("previews a leading-decimal calculation on blur before committing", (useDraft) => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const events: unknown[] = [];
  let draft!: ReturnType<typeof usePropertyDraft<number>>;
  function Probe() {
    draft = useDraft({
      displayValue: "100",
      parse: (text: string) => text.trim() && Number.isFinite(Number(text)) ? Number(text) : null,
      onPreview: (value: number) => events.push(value),
      onCommit: () => events.push("commit"),
    });
    return null;
  }
  const root = createRoot(document.createElement("div"));
  try {
    act(() => root.render(createElement(Probe)));
    act(() => draft.onFocus());
    act(() => draft.onChange({ target: { value: ".5 * 100" } } as Parameters<typeof draft.onChange>[0]));
    act(() => draft.onBlur({ target: { value: ".5 * 100" } } as Parameters<typeof draft.onBlur>[0]));
    expect(events).toEqual([50, "commit"]);
    expect(draft!.displayValue).toBe("100");
  } finally {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  }
});
