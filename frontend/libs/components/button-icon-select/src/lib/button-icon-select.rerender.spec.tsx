import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";

vi.mock("@storyteller/ui-tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@storyteller/icons", () => ({
  DynamicIcon: () => <i />,
}));

import { ButtonIconSelect } from "./button-icon-select";

const Icon = (() => null) as never;
const SELECTED = "bg-brand-primary/20";

// Parent re-renders on every change and builds a NEW options array inline.
const Parent = ({ controlled }: { controlled?: boolean }) => {
  const [count, setCount] = useState(0);
  const [value, setValue] = useState("a");
  return (
    <>
      <span data-testid="count">{count}</span>
      <ButtonIconSelect
        options={[
          { value: "a", icon: Icon, text: "A" },
          { value: "b", icon: Icon, text: "B" },
        ]}
        selectedOption={controlled ? value : undefined}
        onOptionChange={(v) => {
          setCount((c) => c + 1);
          setValue(v);
        }}
      />
    </>
  );
};

const isSelected = (el: HTMLElement) =>
  (el.closest("button") as HTMLElement).className.includes(SELECTED);

describe("ButtonIconSelect with inline options", () => {
  afterEach(() => cleanup());

  it("keeps the clicked option selected when the parent re-renders (uncontrolled)", () => {
    const { getByText } = render(<Parent />);
    fireEvent.click(getByText("B"));
    expect(isSelected(getByText("B"))).toBe(true);
    expect(isSelected(getByText("A"))).toBe(false);
  });

  it("still follows selectedOption when controlled", () => {
    const { getByText } = render(<Parent controlled />);
    fireEvent.click(getByText("B"));
    expect(isSelected(getByText("B"))).toBe(true);
  });
});
