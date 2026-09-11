// Focuses the first prompt editor inside `container` and places the caret at
// the end of its content. Handles both a plain <textarea> and a contentEditable
// div (the MentionTextarea), since the fullscreen overlay can hold either.

export function focusEditorAtEnd(container: HTMLElement | null): void {
  if (!container) return;

  const textarea = container.querySelector("textarea");
  if (textarea) {
    textarea.focus();
    const end = textarea.value.length;
    textarea.setSelectionRange(end, end);
    return;
  }

  const editable = container.querySelector<HTMLElement>(
    '[contenteditable="true"]',
  );
  if (editable) {
    editable.focus();
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(editable);
    range.collapse(false); // collapse to the end
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
