import { render } from "@testing-library/react";
import { Circle, Square } from "lucide-react";

import { ButtonIconSelect } from "./button-icon-select";

describe("ButtonIconSelect", () => {
  it("renders one button per option", () => {
    const { container } = render(
      <ButtonIconSelect
        options={[
          { value: "circle", icon: Circle },
          { value: "square", icon: Square },
        ]}
        selectedOption="circle"
      />,
    );
    expect(container.querySelectorAll("button")).toHaveLength(2);
  });
});
