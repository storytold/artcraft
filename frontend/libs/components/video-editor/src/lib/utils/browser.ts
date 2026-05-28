export function downloadBlob({
  blob,
  filename,
}: {
  blob: Blob;
  filename: string;
}): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function findScrollParent({
  element,
}: {
  element: HTMLElement;
}): HTMLElement | null {
  let parent = element.parentElement;
  while (parent) {
    const { overflow, overflowX } = window.getComputedStyle(parent);
    if (/auto|scroll/.test(overflow + overflowX)) return parent;
    parent = parent.parentElement;
  }
  return null;
}

export function isTypableDOMElement({
  element,
}: {
  element: HTMLElement;
}): boolean {
  if (element.isContentEditable) return true;

  if (element.tagName === "INPUT") {
    return !(element as HTMLInputElement).disabled;
  }

  if (element.tagName === "TEXTAREA") {
    return !(element as HTMLTextAreaElement).disabled;
  }

  return false;
}
