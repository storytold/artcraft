import { render, screen } from "@testing-library/react";

import { ButtonDropdown } from "./button-dropdown";

describe("ButtonDropdown", () => {
  it("renders the trigger label", () => {
    render(
      <ButtonDropdown label="Actions" options={[{ label: "Duplicate" }]} />,
    );
    expect(screen.getByText("Actions")).toBeTruthy();
  });
});
