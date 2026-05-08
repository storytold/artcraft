import { useEffect, useState } from "react";

import { LoadingDots } from "@storyteller/ui-loading";
import { Modal } from "@storyteller/ui-modal";

import { UploadAssetError, UploadSuccess } from "@storyteller/ui-upload-modal";
import { UploadFilesMedia } from "./UploadFilesMedia";
import { FilterEngineCategories, UploaderStates } from "~/enums";
import { initialUploaderState, UploaderState } from "~/models";

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

export function UploadModalMedia({
  isOpen,
  onClose,
  onSuccess,
  title,
  fileTypes,
}: Props) {
  const [uploaderState, setUploaderState] =
    useState<UploaderState>(initialUploaderState);

  const updateUploaderState = (newState: UploaderState) => {
    setUploaderState(newState);
  };
  const resetModalState = () => {
    setUploaderState(initialUploaderState);
  };

  useEffect(() => {
    if (isOpen) {
      resetModalState();
    }
  }, [isOpen]);

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
            <div className="w-100 text-center opacity-50">Uploading...</div>
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
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {/* Inline call — `<Comp />` would be a fresh component reference each render, remounting the dropzone mid-click and breaking the file picker. */}
      {UploaderModalContent()}
    </Modal>
  );
}
