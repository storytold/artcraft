import { FileUploader as DragDropFileUploader } from "react-drag-drop-files";
// Usage refer to https://github.com/KarimMokhtar/react-drag-drop-files

import { DragAndDropZone } from "./drag-and-drop-zone";

export const FileUploader = ({
  file,
  fileTypes,
  handleChange,
}: {
  file: File | undefined;
  handleChange: (file: File) => void;
  fileTypes: string[];
}) => (
  <DragDropFileUploader
    handleChange={handleChange}
    name="file"
    maxSize={50}
    types={fileTypes}
  >
    <DragAndDropZone file={file} fileTypes={fileTypes} />
  </DragDropFileUploader>
);
