import { render, screen } from "@testing-library/react";

import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its label", () => {
    render(<Badge label="Beta" />);
    expect(screen.getByText("Beta")).toBeTruthy();
  });
});
