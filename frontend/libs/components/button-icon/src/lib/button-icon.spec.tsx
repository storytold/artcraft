import { render } from "@testing-library/react";
import { Circle } from "lucide-react";

import { ButtonIcon } from "./button-icon";

describe("ButtonIcon", () => {
  it("renders a button with the icon", () => {
    const { container } = render(
      <ButtonIcon icon={Circle} onClick={() => undefined} />,
    );
    expect(container.querySelector("button")).toBeTruthy();
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
