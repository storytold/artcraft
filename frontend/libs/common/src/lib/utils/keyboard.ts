/**
 * For an element with `role="button"`: Enter or Space clicks it, as they would a native button.
 * Keys pressed on a control inside it are left to that control.
 */
export function clickOnEnterOrSpace(event: {
  key: string;
  preventDefault(): void;
  target: unknown;
  currentTarget: { click(): void };
}) {
  if (event.target !== event.currentTarget) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.currentTarget.click();
  }
}
