// The category type that `type` may be (the dialogs pass a category, or a plain label string).
import { FilterEngineCategories } from "@storyteller/api";
// The shared button component (primary / secondary variants).
import { Button } from "@storyteller/ui-button";
// Props for the error screen the upload dialogs show when an upload step fails. Shown by this library's
// Image, 3D and Splat dialogs and by the app's UploadModalMedia and UploadImageMediaModal.
interface Props {
  // Called by "Cancel"; every dialog passes its own `onClose`.
  onCancel: () => void;
  // Called by "Try again"; every dialog passes a function that calls its `resetModalState()` (back to the file picker).
  onRetry: () => void;
  // What failed, shown in the heading. The dialogs pass the selected category, "Thumbnail" (cover-image
  // failures) or, in UploadImageMediaModal, "Image".
  type: FilterEngineCategories | string;
  // The reason to show; "Unknown Error" is displayed when it is missing.
  errorMessage?: string;
}

// Error screen: a heading naming what failed, the reason, and Cancel / Try again buttons. Pure presentation:
// it holds no state and calls nothing but the two callbacks above.
export const UploadAssetError = ({
  onCancel,
  onRetry,
  type,
  errorMessage,
}: Props) => {
  return (
    <>
      {/* Heading, e.g. "Error in Uploading Thumbnail". */}
      <h3>Error in Uploading {type}</h3>
      {/* The reason, or a fallback when the backend gave none. */}
      <p>{errorMessage ?? "Unknown Error"}</p>
      {/* Button row, pushed to the right: the quiet option first, the primary action last. */}
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button onClick={onRetry} variant="primary">
          Try again
        </Button>
      </div>
    </>
  );
};
