import { FileUploader as DragDropFileUploader } from "react-drag-drop-files";
// Usage refer to https://github.com/KarimMokhtar/react-drag-drop-files

import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { DragAndDropZone } from "./drag-and-drop-zone";

export const FileUploader = ({
  files,
  fileTypes,
  handleChange,
  multiple = false,
  fileIcon,
}: {
  files: File[];
  handleChange: (files: File[]) => void;
  fileTypes: string[];
  multiple?: boolean;
  fileIcon?: IconDefinition;
}) => (
  <DragDropFileUploader
    handleChange={(result: File | File[]) => {
      if (Array.isArray(result)) {
        handleChange(result);
      } else if (result instanceof File) {
        handleChange([result]);
      } else {
        // react-drag-drop-files may return a FileList from the file picker when multiple=true;
        // Array.isArray returns false for FileList, so normalize via Array.from.
        handleChange(Array.from(result as unknown as Iterable<File>));
      }
    }}
    name="file"
    maxSize={50}
    types={fileTypes}
    multiple={multiple}
    classes="!outline-none"
  >
    <DragAndDropZone files={files} fileTypes={fileTypes} fileIcon={fileIcon} />
  </DragDropFileUploader>
);
