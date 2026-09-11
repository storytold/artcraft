import { useEffect, useState } from "react";

import { LoadingDots } from "@storyteller/ui-loading";
import { Modal } from "@storyteller/ui-modal";
import { UploadAssetError } from "../UploadModal/UploadAssetError";
import { UploadSuccess } from "../UploadModal/UploadSuccess";
import { FilterEngineCategories, UploaderStates } from "~/enums";
import { initialUploaderState, UploaderState } from "~/models";
import { UploadImageMedia } from "./UploadImageMedia";

interface Props {
  onClose: () => void;
  onSuccess: (data?: string) => void;
  isOpen: boolean;
  title: string;
  fileTypes: string[];
  options?: {
    fileSubtypes?: { [key: string]: string }[];
  };
}

export function UploadImageMediaModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  fileTypes,
}: Props) {
  const [uploaderState, setUploaderState] =
    useState<UploaderState>(initialUploaderState);

  const updateUploaderState = (newState: UploaderState) => {
    console.debug("newState", newState);
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
          <UploadImageMedia
            title={"Image"}
            fileTypes={fileTypes}
            onClose={onClose}
            onUploadProgress={updateUploaderState}
          />
        );
      case UploaderStates.uploadingAsset:
      case UploaderStates.uploadingCover:
      case UploaderStates.settingCover:
      case UploaderStates.uploadingImage:
        return (
          <>
            <LoadingDots className="mb-1 bg-transparent" />
            <div className="w-100 text-center opacity-50">Uploading...</div>
          </>
        );
      case UploaderStates.success:
        return (
          <UploadSuccess
            title={"Image"}
            onOk={() => {
              onSuccess(uploaderState.data);
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
      case UploaderStates.imageCreateError:
        return (
          <UploadAssetError
            onCancel={onClose}
            onRetry={() => {
              resetModalState();
            }}
            type={"Image"}
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
