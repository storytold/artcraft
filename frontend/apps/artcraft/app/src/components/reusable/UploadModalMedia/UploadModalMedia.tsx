// UploadModalMedia: modal window for uploading an image or mp4 as a "plane" asset, walking through upload states
// (form -> uploading -> success/error). Exported through the reusable/ barrel; at the time of writing no other file
// in app/src imports it. Form is UploadFilesMedia; success/error screens come from @storyteller/ui-upload-modal.

import { useEffect, useState } from "react";

import { LoadingDots } from "@storyteller/ui-loading";
import { Modal } from "@storyteller/ui-modal";

import { UploadAssetError, UploadSuccess } from "@storyteller/ui-upload-modal";
import { UploadFilesMedia } from "./UploadFilesMedia";
import { FilterEngineCategories, UploaderStates } from "~/enums";
import { initialUploaderState, UploaderState } from "~/models";

// isOpen/onClose: visibility; onSuccess: called when the user acknowledges success; title/fileTypes: passed to the form.
interface Props {
  onClose: () => void;
  onSuccess: () => void;
  isOpen: boolean;
  title: string;
  fileTypes: string[];
  options?: {
    fileSubtypes?: { [key: string]: string }[];
  };
}

/**
 * Modal shell. Picks which screen to show from uploaderState.status.
 */
export function UploadModalMedia({
  isOpen,
  onClose,
  onSuccess,
  title,
  fileTypes,
}: Props) {
  // Current step of the upload (ready, uploading..., success, or an error kind).
  const [uploaderState, setUploaderState] =
    useState<UploaderState>(initialUploaderState);

  const updateUploaderState = (newState: UploaderState) => {
    setUploaderState(newState);
  };
  const resetModalState = () => {
    setUploaderState(initialUploaderState);
  };

  // Every time the modal is (re)opened, go back to the empty "ready" form.
  useEffect(() => {
    if (isOpen) {
      resetModalState();
    }
  }, [isOpen]);

  // Maps each upload status to the screen for it. Called as a plain function below (see the note in the JSX).
  const UploaderModalContent = () => {
    switch (uploaderState.status) {
      case UploaderStates.ready:
        return (
          <UploadFilesMedia
            title={title}
            fileTypes={fileTypes}
            onClose={onClose}
            onUploadProgress={updateUploaderState}
          />
        );
      case UploaderStates.uploadingAsset:
      case UploaderStates.uploadingCover:
      case UploaderStates.settingCover:
        return (
          <>
            <LoadingDots className="mb-1 bg-transparent" />
            <div className="hud-label w-full text-center text-base-fg/50">Uploading...</div>
          </>
        );
      case UploaderStates.success:
        return (
          <UploadSuccess
            title={title}
            onOk={() => {
              onSuccess();
              onClose();
            }}
          />
        );
      case UploaderStates.assetError:
        return (
          <UploadAssetError
            onCancel={onClose}
            onRetry={() => {
              resetModalState();
            }}
            type={FilterEngineCategories.IMAGE_PLANE}
            errorMessage={uploaderState.errorMessage}
          />
        );
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
      default:
        // Render nothing for any state without a view, instead of falling off the end.
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {/* Inline call — `<Comp />` would be a fresh component reference each render, remounting the dropzone mid-click and breaking the file picker. */}
      {UploaderModalContent()}
    </Modal>
  );
}
