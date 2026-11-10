/** For an element with `role="button"`: Enter or Space clicks it, as they would a native button. */
export function clickOnEnterOrSpace(event: {
  key: string;
  preventDefault(): void;
  currentTarget: { click(): void };
}) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.currentTarget.click();
  }
}
