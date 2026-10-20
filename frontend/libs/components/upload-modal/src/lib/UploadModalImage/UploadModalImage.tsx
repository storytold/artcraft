// React state/effect hooks used to remember the upload step and reset it each time the dialog opens.
import { useEffect, useState } from "react";
// Animated "..." spinner shown while an upload is running.
import { LoadingDots } from "@storyteller/ui-loading";
// The shared dialog shell (title bar, close button, centered panel).
import { Modal } from "@storyteller/ui-modal";
// The error screen (heading, reason, Cancel / Try again).
import { UploadAssetError } from "../UploadAssetError";
// The success screen ("Added <title> to your library" and Ok).
import { UploadSuccess } from "../UploadSuccess";
// The file picker + file list + Upload button; it does the uploading and reports progress back up.
import { UploadFilesImage } from "./UploadFilesImage";
import {
  FilterEngineCategories,
  // The image extensions the picker accepts.
  IMAGEPLANE_FILE_TYPE,
  UploaderState,
  UploaderStates,
  // The state a fresh dialog starts in (`ready`).
  initialUploaderState,
} from "../Types";
import type { LucideIcon } from "lucide-react";
// Two shared "gallery" signals; setting them from the success screen opens the gallery (see onOk below).
import {
  galleryModalVisibleViewMode,
  galleryModalVisibleDuringDrag,
} from "@storyteller/ui-gallery-modal";

// What the host passes in. Mounted by GlobalFileDropHandler (drag a file onto the app), UploadImagesButton
// (top bar) and the scene page's adapter (useTauriPageSceneAdapter).
interface Props {
  // Close the dialog (the host flips `isOpen` off).
  onClose: () => void;
  // Told which category was uploaded, when the user presses Ok on the success screen.
  onSuccess: (category: FilterEngineCategories) => void;
  // Whether the dialog is showing.
  isOpen: boolean;
  // Dialog title and the icon beside it.
  title: string;
  titleIcon: LucideIcon;
  // Files to preselect when the dialog opens (for example files the user dropped on the app).
  initialFiles?: File[];
}

// The list of accepted image extensions, built once at load time instead of on every render.
const imageFileTypes = Object.values(IMAGEPLANE_FILE_TYPE);

// The "Upload an Image" dialog: a small state machine. It shows the picker while `ready`, an "Uploading..."
// screen while a single upload runs, then success or an error screen. It owns only that state; the picker
// component does the real work and reports through `onUploadProgress`.
export function UploadModalImage(props: Props) {
  const { isOpen, onClose, onSuccess, title, titleIcon, initialFiles } = props;
  // Which screen to show: `ready`, an uploading step, `success` or an error step.
  const [uploaderState, setUploaderState] =
    useState<UploaderState>(initialUploaderState);

  // Images always upload as this category (the 3D dialog picks its category from toggles instead).
  const selectedCategory = FilterEngineCategories.IMAGE_PLANE;

  // The callback handed to the picker; whatever state it reports becomes the screen shown.
  const updateUploaderState = (newState: UploaderState) => {
    setUploaderState(newState);
  };

  // Back to the picker (used by "Try again" and by the reopen effect below).
  const resetModalState = () => {
    setUploaderState(initialUploaderState);
  };

  // Each time the dialog is opened, start from the picker again. Needed because GlobalFileDropHandler keeps this
  // component mounted and only toggles `isOpen`, so the last run's success or error screen would otherwise return.
  useEffect(() => {
    if (isOpen) {
      resetModalState();
    }
  }, [isOpen]);


  // Chooses what goes inside the dialog for the current step.
  const UploaderModalContent = () => {
    switch (uploaderState.status) {
      // Waiting for files: show the picker.
      case UploaderStates.ready:
        return (
          <div className="space-y-4">
            <UploadFilesImage
              title={title}
              fileTypes={imageFileTypes}
              initialFiles={initialFiles}
              onClose={onClose}
              onUploadProgress={updateUploaderState}
            />
          </div>
        );
      // A single-file upload is running (several files stay on the picker, which shows its own per-row progress).
      case UploaderStates.uploadingAsset:
      case UploaderStates.uploadingCover:
      case UploaderStates.settingCover: {
        // "n / total" counter, when the reporter supplied one.
        const p = uploaderState.uploadProgress;
        return (
          <>
            <LoadingDots className="mb-1 bg-transparent" />
            <div className="w-100 text-center opacity-50">
              {p && p.total > 1
                ? `Uploading ${p.current} / ${p.total}...`
                : "Uploading..."}
            </div>
          </>
        );
      }
      // Everything uploaded: confirm, and on Ok open the gallery and close the dialog.
      case UploaderStates.success: {
        return (
          <UploadSuccess
            title="Image"
            onOk={() => {
              // Open the gallery so the user can drag the freshly
              // uploaded image onto the canvas.
              // (The gallery's view mode shows while ViewMode is true. As of this annotation nothing outside
              // tests reads DuringDrag, so setting it has no visible effect.)
              galleryModalVisibleViewMode.value = true;
              galleryModalVisibleDuringDrag.value = true;
              // Tell the host which category was added, then close.
              onSuccess(selectedCategory);
              onClose();
            }}
          />
        );
      }
      // The image itself failed to upload: heading names the category; "Try again" returns to the picker.
      case UploaderStates.assetError:
        return (
          <UploadAssetError
            onCancel={onClose}
            onRetry={() => {
              resetModalState();
            }}
            type={selectedCategory}
            errorMessage={uploaderState.errorMessage}
          />
        );
      // A cover-image step failed. The Image uploader has no cover step and never reports these two states; the case
      // is the same as in the 3D and Splat dialogs.
      case UploaderStates.coverCreateError:
      case UploaderStates.coverSetError:
        return (
          <UploadAssetError
            onCancel={onClose}
            onRetry={() => {
              resetModalState();
            }}
            type={"Thumbnail"}
            errorMessage={uploaderState.errorMessage}
          />
        );
    }
    // Any other state (not reported by this dialog's uploader) renders an empty body.
    return undefined;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      titleIcon={titleIcon}
      title={title}
      className="max-w-xl"
      showClose={true}
    >
      {/* Inline call — `<Comp />` would be a fresh component reference each render, remounting the dropzone mid-click and breaking the file picker. */}
      {UploaderModalContent()}
    </Modal>
  );
}
