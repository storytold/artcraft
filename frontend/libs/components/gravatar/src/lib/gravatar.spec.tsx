import { render } from "@testing-library/react";

import { Gravatar } from "./gravatar";

describe("Gravatar", () => {
  it("renders an avatar image", () => {
    const { container } = render(<Gravatar size={32} username="demo" />);
    expect(container.querySelector("img")).toBeTruthy();
  });
});
