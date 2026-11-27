import { render } from "@testing-library/react";

import { MenuIconSelector } from "./menu-icon-selector";

describe("MenuIconSelector", () => {
  it("renders one button per menu item", () => {
    // Labels only surface in tooltips, so count the buttons instead.
    const { container } = render(
      <MenuIconSelector
        menuItems={[
          { id: "draw", label: "Draw", icon: <span /> },
          { id: "scene", label: "Scene", icon: <span /> },
        ]}
        activeMenu="draw"
        onMenuChange={() => undefined}
      />,
    );
    expect(container.querySelectorAll("button")).toHaveLength(2);
  });
});
