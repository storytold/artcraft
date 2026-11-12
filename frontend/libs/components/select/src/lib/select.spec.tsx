import { render, screen } from "@testing-library/react";

import { Select } from "./select";

describe("Select", () => {
  it("renders the selected option", () => {
    render(
      <Select
        options={[
          { label: "One", value: 1 },
          { label: "Two", value: 2 },
        ]}
        value={2}
        onChange={() => undefined}
      />,
    );
    expect(screen.getByText("Two")).toBeTruthy();
  });
});
