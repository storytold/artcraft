import { useEffect, useMemo, useState } from "react";
import { LoadingDots } from "@storyteller/ui-loading";
import { Modal } from "@storyteller/ui-modal";
import { UploadAssetError, UploadSuccess } from "@storyteller/ui-upload-modal";
import { initialUploaderState, UploaderState } from "../../../models";
import {
  FilterEngineCategories,
  UploaderStates,
  MediaFileAnimationType,
  SPLAT_FILE_TYPE,
} from "../../../enums";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  galleryModalVisibleViewMode,
  galleryModalVisibleDuringDrag,
} from "@storyteller/ui-gallery-modal";
import { UploadFilesSplat } from "./UploadFilesSplat";

interface Props {
  onClose: () => void;
  onSuccess: (splatArrayBuffer: ArrayBuffer, shouldFlip: boolean) => void;
  isOpen: boolean;
  title: string;
  titleIcon: IconDefinition;
  initialFile?: File;
  options?: {
    fileSubtypes?: { [key: string]: string }[];
    hasLength?: boolean;
    hasThumbnailUpload?: boolean;
  };
}

const splatFileTypes = Object.values(SPLAT_FILE_TYPE);

export function UploadModalSplat(props: Props) {
  const selectedCategory = FilterEngineCategories.SPLAT;
  const { isOpen, onClose, onSuccess, title, titleIcon, initialFile, options } = props;
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

  useEffect(() => {
    if (uploaderState.status === UploaderStates.success) {
      // Automatically open the global Gallery modal after a successful upload
      // galleryModalVisibleViewMode.value = true;
      // galleryModalVisibleDuringDrag.value = true;

      // onSuccess(selectedCategory);
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploaderState.status]);

  const UploaderModalContent = () => {
    switch (uploaderState.status) {
      case UploaderStates.ready:
        return (
          <div className="space-y-4">
            <UploadFilesSplat
              title={title}
              engineCategory={selectedCategory}
              fileTypes={splatFileTypes}
              initialFile={initialFile}
              options={{
                ...(options ?? {}),
              }}
              onClose={onClose}
              onUploadProgress={updateUploaderState}
              onLocalBytes={(buffer, shouldFlip) => { onSuccess(buffer, shouldFlip); }}
            />
          </div>
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
      case UploaderStates.success: {
        return (
          <UploadSuccess
            title="Splat"
            onOk={() => {
              onClose();
              // onSuccess(selectedCategory);
            }}
          />
        );
      }
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
      <UploaderModalContent />
    </Modal>
  );
}
