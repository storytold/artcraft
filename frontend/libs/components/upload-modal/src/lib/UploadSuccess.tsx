// The shared button component (primary / secondary variants).
import {
  Button
} from "@storyteller/ui-button"

// Props for the success screen the upload dialogs show when an upload finishes. Shown by this library's
// Image, 3D and Splat dialogs.
interface Props {
  // What was added; inserted into the message. The dialogs pass "Image", "Splat", "3D model" or "Animation",
  // and UploadModalMedia passes its own `title`.
  title: string;
  // Called when the user presses "Ok". Each dialog uses it to tell its host (`onSuccess`) and close; the
  // Image, 3D and Splat dialogs may also open the gallery first.
  onOk: () => void;
}

// Success screen: a centered "Added <title> to your library" line and one primary "Ok" button.
// Pure presentation: it holds no state and calls nothing but `onOk`.
export const UploadSuccess = ({ title, onOk }: Props) => {
  return (
    <>
      {/* The confirmation line, centered and dimmed (half opacity). */}
      <div className="w-100 text-center opacity-50">{`Added ${title} to your library`}</div>
      {/* Button row, pushed to the right. */}
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onOk} variant="primary">
          Ok
        </Button>
      </div>
    </>
  );
};
