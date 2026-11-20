import { render } from "@testing-library/react";

import { FileUploader } from "./file-uploader";

describe("FileUploader", () => {
  it("renders the drop zone", () => {
    const { baseElement } = render(
      <FileUploader
        files={[]}
        fileTypes={["png", "jpg"]}
        handleChange={() => undefined}
      />,
    );
    expect(baseElement).toBeTruthy();
  });
});
