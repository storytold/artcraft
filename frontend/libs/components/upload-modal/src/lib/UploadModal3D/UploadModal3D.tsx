import { useEffect, useMemo, useRef, useState } from "react";
import { Checkbox } from "@storyteller/ui-checkbox";
import { LoadingDots } from "@storyteller/ui-loading";
import { Modal } from "@storyteller/ui-modal";
import { UploadAssetError } from "../UploadAssetError";
import { UploadSuccess } from "../UploadSuccess";
import { UploadFiles3D } from "./UploadFiles3D";
import {
  FilterEngineCategories,
  MediaFileAnimationType,
  OBJECT_FILE_TYPE,
  UploaderState,
  UploaderStates,
  initialUploaderState,
} from "../Types";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  galleryModalVisibleViewMode,
  galleryModalVisibleDuringDrag,
} from "@storyteller/ui-gallery-modal";

interface Props {
  onClose: () => void;
  onSuccess: (category: FilterEngineCategories) => void;
  isOpen: boolean;
  title: string;
  titleIcon: IconDefinition;
  initialFiles?: File[];
  // Preselects the matching "Upload as ..." toggle on open (the user can
  // still change it) and, being a scoped open, skips auto-opening the
  // gallery on success — the scoped caller shows the result itself.
  // Literal strings so callers aren't coupled to this lib's
  // FilterEngineCategories declaration.
  initialCategory?: "animation" | "character";
  options?: {
    fileSubtypes?: { [key: string]: string }[];
    hasLength?: boolean;
    hasThumbnailUpload?: boolean;
  };
}

const objectFileTypes = Object.values(OBJECT_FILE_TYPE);

export function UploadModal3D(props: Props) {
  const {
    isOpen,
    onClose,
    onSuccess,
    title,
    titleIcon,
    initialFiles,
    initialCategory,
    options,
  } = props;
  const [uploaderState, setUploaderState] =
    useState<UploaderState>(initialUploaderState);
  const [isCharacter, setIsCharacter] = useState(false);
  const [isAnimation, setIsAnimation] = useState(false);
  // Once the user has touched either toggle, mesh-less auto-detection stops
  // overriding their choice.
  const userTouchedCategory = useRef(false);

  const selectedCategory = isAnimation
    ? FilterEngineCategories.ANIMATION
    : isCharacter
      ? FilterEngineCategories.CHARACTER
      : FilterEngineCategories.OBJECT;

  // Rig-type options for character AND animation uploads; the default
  // (first entry) differs — characters lead with Mixamo ArKit, plain
  // animation clips with Mixamo.
  const rigTypeOptions = useMemo(() => {
    if (!isCharacter && !isAnimation) return undefined;
    const preferred = isAnimation
      ? MediaFileAnimationType.Mixamo
      : MediaFileAnimationType.MixamoArKit;
    const values = Object.values(MediaFileAnimationType);
    const sorted = values.sort((a, b) =>
      a === preferred ? -1 : b === preferred ? 1 : a.localeCompare(b),
    );
    const toLabel = (v: string) =>
      v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return sorted.map((v) => ({ [toLabel(v)]: v }));
  }, [isCharacter, isAnimation]);

  const updateUploaderState = (newState: UploaderState) => {
    setUploaderState(newState);
  };

  const resetModalState = () => {
    setUploaderState(initialUploaderState);
  };

  useEffect(() => {
    if (isOpen) {
      resetModalState();
      setIsCharacter(initialCategory === "character");
      setIsAnimation(initialCategory === "animation");
      userTouchedCategory.current = false;
    }
  }, [isOpen, initialCategory]);


  const UploaderModalContent = () => {
    switch (uploaderState.status) {
      case UploaderStates.ready:
        return (
          <div className="space-y-4">
            {/* Mutually exclusive category toggles. Mesh-less skeleton files
                preselect Animation (onMeshlessDetected below), but the user
                stays in control once they've clicked either. */}
            <div className="flex items-center gap-6">
              <Checkbox
                id="upload-as-character"
                checked={isCharacter}
                onChange={(e) => {
                  userTouchedCategory.current = true;
                  setIsCharacter(e.target.checked);
                  if (e.target.checked) setIsAnimation(false);
                }}
                label="Upload as Character"
              />
              <Checkbox
                id="upload-as-animation"
                checked={isAnimation}
                onChange={(e) => {
                  userTouchedCategory.current = true;
                  setIsAnimation(e.target.checked);
                  if (e.target.checked) setIsCharacter(false);
                }}
                label="Upload as Animation"
              />
            </div>
            <UploadFiles3D
              title={title}
              engineCategory={selectedCategory}
              fileTypes={objectFileTypes}
              initialFiles={initialFiles}
              options={{
                ...(options ?? {}),
                fileSubtypes: rigTypeOptions,
              }}
              onClose={onClose}
              onUploadProgress={updateUploaderState}
              onMeshlessDetected={() => {
                if (userTouchedCategory.current) return;
                setIsAnimation(true);
                setIsCharacter(false);
              }}
            />
          </div>
        );
      case UploaderStates.uploadingAsset:
      case UploaderStates.uploadingCover:
      case UploaderStates.settingCover: {
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
      case UploaderStates.success: {
        return (
          <UploadSuccess
            title={isAnimation ? "Animation" : "3D model"}
            onOk={() => {
              // Category-scoped opens come from a library panel that shows
              // the upload itself — don't pop My Library over it.
              if (initialCategory == null) {
                galleryModalVisibleViewMode.value = true;
                galleryModalVisibleDuringDrag.value = true;
              }
              onSuccess(selectedCategory);
              onClose();
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
      {/* Inline call — `<Comp />` would be a fresh component reference each render, remounting the dropzone mid-click and breaking the file picker. */}
      {UploaderModalContent()}
    </Modal>
  );
}
