import { render, screen } from "@testing-library/react";

import { TabSelector } from "./tab-selector";

describe("TabSelector", () => {
  it("renders every tab", () => {
    render(
      <TabSelector
        tabs={[
          { id: "image", label: "Image" },
          { id: "video", label: "Video" },
        ]}
        activeTab="image"
        onTabChange={() => undefined}
      />,
    );
    expect(screen.getByText("Image")).toBeTruthy();
    expect(screen.getByText("Video")).toBeTruthy();
  });
});
