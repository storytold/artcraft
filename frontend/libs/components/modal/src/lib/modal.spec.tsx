import { render, screen } from "@testing-library/react";

import { Modal } from "./modal";

describe("Modal", () => {
  it("renders its content when open", () => {
    render(
      <Modal isOpen={true} onClose={() => undefined} title="Settings">
        <p>Modal body</p>
      </Modal>,
    );
    expect(screen.getByText("Modal body")).toBeTruthy();
  });
});
