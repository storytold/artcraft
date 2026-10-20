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
// The file picker + preview + file list + Upload button; it does the uploading and reports progress back up.
import { UploadFilesSplat } from "./UploadFilesSplat";
import {
  FilterEngineCategories,
  // The splat extensions the picker accepts.
  SPLAT_FILE_TYPE,
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

// What the host passes in. Mounted by GlobalFileDropHandler (drag a file onto the app) and the scene page's
// adapter (useTauriPageSceneAdapter); neither passes `options` today.
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
  // Extra settings passed straight through to the picker component.
  options?: {
    fileSubtypes?: { [key: string]: string }[];
    hasLength?: boolean;
    hasThumbnailUpload?: boolean;
  };
}

// The list of accepted splat extensions, built once at load time instead of on every render.
const splatFileTypes = Object.values(SPLAT_FILE_TYPE);

// The "Upload a Splat" dialog: a small state machine. It shows the picker while `ready`, an "Uploading..."
// screen while a single upload runs, then success or an error screen. It owns only that state; the picker
// component does the real work and reports through `onUploadProgress`.
export function UploadModalSplat(props: Props) {
  // Splats always upload as this category (the 3D dialog picks its category from toggles instead).
  const selectedCategory = FilterEngineCategories.SPLAT;
  const { isOpen, onClose, onSuccess, title, titleIcon, initialFiles, options } = props;
  // Which screen to show: `ready`, an uploading step, `success` or an error step.
  const [uploaderState, setUploaderState] =
    useState<UploaderState>(initialUploaderState);

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
            <UploadFilesSplat
              title={title}
              engineCategory={selectedCategory}
              fileTypes={splatFileTypes}
              initialFiles={initialFiles}
              options={{
                ...(options ?? {}),
              }}
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
            title="Splat"
            onOk={() => {
              // Open the gallery's view mode (it shows while ViewMode is true). As of this annotation nothing
              // outside tests reads DuringDrag, so setting it has no visible effect.
              galleryModalVisibleViewMode.value = true;
              galleryModalVisibleDuringDrag.value = true;
              // Tell the host which category was added, then close.
              onSuccess(selectedCategory);
              onClose();
            }}
          />
        );
      }
      // The splat itself failed to upload: heading names the category; "Try again" returns to the picker.
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
      // The splat was saved but its cover image failed (uploading it, or attaching it). The heading says
      // "Thumbnail"; "Try again" returns to the picker, and uploading again saves a second copy (see N-105).
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
