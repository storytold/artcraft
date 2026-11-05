// React hooks: state for the upload step and the category toggles, memo for the rig-type list, ref for the
// "user touched a toggle" flag, effect to reset each time the dialog opens.
import { useEffect, useMemo, useRef, useState } from "react";
// The labelled tick box used for the "Upload as ..." toggles.
import { Checkbox } from "@storyteller/ui-checkbox";
// Animated "..." spinner shown while an upload is running.
import { LoadingDots } from "@storyteller/ui-loading";
// The shared dialog shell (title bar, close button, centered panel).
import { Modal } from "@storyteller/ui-modal";
// The error screen (heading, reason, Cancel / Try again).
import { UploadAssetError } from "../UploadAssetError";
// The success screen ("Added <title> to your library" and Ok).
import { UploadSuccess } from "../UploadSuccess";
// The file picker + 3D preview + file list + Upload button; it does the uploading and reports progress back up.
import { UploadFiles3D } from "./UploadFiles3D";
import {
  FilterEngineCategories,
  // The rig types a character or animation can be tagged with (the "fileSubtypes" choices).
  MediaFileAnimationType,
  // The 3D-model extensions the picker accepts.
  OBJECT_FILE_TYPE,
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
  // Preselects the matching "Upload as ..." toggle on open (the user can
  // still change it) and, being a scoped open, skips auto-opening the
  // gallery on success — the scoped caller shows the result itself.
  // Literal strings so callers aren't coupled to this lib's
  // FilterEngineCategories declaration.
  // (Today the scene page's Animations panel passes the constant "animation" and the Assets panel passes none.)
  initialCategory?: "animation" | "character";
  // Extra settings passed straight through to the picker component. NOTE: `fileSubtypes` below is always
  // replaced by the rig-type list, so a caller-supplied `fileSubtypes` would be ignored (nobody passes one).
  options?: {
    fileSubtypes?: { [key: string]: string }[];
    hasLength?: boolean;
    hasThumbnailUpload?: boolean;
  };
}

// The list of accepted 3D-model extensions, built once at load time instead of on every render.
const objectFileTypes = Object.values(OBJECT_FILE_TYPE);

// The "Upload a 3D Model" dialog. Like the Image and Splat dialogs it is a small state machine over
// `uploaderState` (picker, "Uploading...", success, error), plus two mutually exclusive toggles that decide
// whether the files are saved as a plain object, a character or an animation.
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
  // Which screen to show: `ready`, an uploading step, `success` or an error step.
  const [uploaderState, setUploaderState] =
    useState<UploaderState>(initialUploaderState);
  // State of the "Upload as Character" toggle.
  const [isCharacter, setIsCharacter] = useState(false);
  // State of the "Upload as Animation" toggle.
  const [isAnimation, setIsAnimation] = useState(false);
  // Once the user has touched either toggle, mesh-less auto-detection stops
  // overriding their choice.
  const userTouchedCategory = useRef(false);

  // The category the files will be saved under: Animation wins, then Character, otherwise a plain Object.
  const selectedCategory = isAnimation
    ? FilterEngineCategories.ANIMATION
    : isCharacter
      ? FilterEngineCategories.CHARACTER
      : FilterEngineCategories.OBJECT;

  // Rig-type options for character AND animation uploads; the default
  // (first entry) differs — characters lead with Mixamo ArKit, plain
  // animation clips with Mixamo.
  const rigTypeOptions = useMemo(() => {
    // A plain object has no rig type: pass nothing down.
    if (!isCharacter && !isAnimation) return undefined;
    // The entry that should come first in the list.
    const preferred = isAnimation
      ? MediaFileAnimationType.Mixamo
      : MediaFileAnimationType.MixamoArKit;
    // Every rig type. Object.values returns a fresh array, so sorting it in place does not touch the enum.
    const values = Object.values(MediaFileAnimationType);
    // Preferred first, the rest alphabetical.
    const sorted = values.sort((a, b) =>
      a === preferred ? -1 : b === preferred ? 1 : a.localeCompare(b),
    );
    // Turn a snake_case value into a display label: underscores become spaces, each word is capitalised.
    const toLabel = (v: string) =>
      v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    // The picker's "fileSubtypes" shape: a list of { label: value } pairs.
    return sorted.map((v) => ({ [toLabel(v)]: v }));
  }, [isCharacter, isAnimation]);

  // The callback handed to the picker; whatever state it reports becomes the screen shown.
  const updateUploaderState = (newState: UploaderState) => {
    setUploaderState(newState);
  };

  // Back to the picker (used by "Try again" and by the reopen effect below).
  const resetModalState = () => {
    setUploaderState(initialUploaderState);
  };

  // Each time the dialog is opened, start from the picker again, preselect the toggles from `initialCategory`
  // and forget any earlier toggle click. Needed because GlobalFileDropHandler keeps this component mounted and only
  // toggles `isOpen`. It also re-runs if `initialCategory` changes while open (no caller does that today).
  useEffect(() => {
    if (isOpen) {
      resetModalState();
      setIsCharacter(initialCategory === "character");
      setIsAnimation(initialCategory === "animation");
      userTouchedCategory.current = false;
    }
  }, [isOpen, initialCategory]);


  // Chooses what goes inside the dialog for the current step.
  const UploaderModalContent = () => {
    switch (uploaderState.status) {
      // Waiting for files: show the two toggles and the picker.
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
                  // Remember the user chose, so auto-detection stops overriding them.
                  userTouchedCategory.current = true;
                  setIsCharacter(e.target.checked);
                  // Ticking Character unticks Animation.
                  if (e.target.checked) setIsAnimation(false);
                }}
                label="Upload as Character"
              />
              <Checkbox
                id="upload-as-animation"
                checked={isAnimation}
                onChange={(e) => {
                  // Remember the user chose, so auto-detection stops overriding them.
                  userTouchedCategory.current = true;
                  setIsAnimation(e.target.checked);
                  // Ticking Animation unticks Character.
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
              // The picker calls this when the file it is previewing has no mesh (a skeleton / animation file).
              onMeshlessDetected={() => {
                // The user already chose: leave their toggles alone.
                if (userTouchedCategory.current) return;
                // A scoped open's explicit category is the CALLER's intent —
                // auto-detect only fills in when nobody chose anything.
                if (initialCategory) return;
                // Nobody chose: treat the file as an animation.
                setIsAnimation(true);
                setIsCharacter(false);
              }}
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
      // Everything uploaded: confirm, and on Ok maybe open the gallery, tell the host, and close the dialog.
      case UploaderStates.success: {
        return (
          <UploadSuccess
            // The message reads "Added Animation ..." for animations and "Added 3D model ..." for everything else
            // (characters included).
            title={isAnimation ? "Animation" : "3D model"}
            onOk={() => {
              // Category-scoped opens come from a library panel that shows
              // the upload itself — don't pop My Library over it.
              if (initialCategory == null) {
                // Open the gallery's view mode (it shows while ViewMode is true). As of this annotation nothing
                // outside tests reads DuringDrag, so setting it has no visible effect.
                galleryModalVisibleViewMode.value = true;
                galleryModalVisibleDuringDrag.value = true;
              }
              // Tell the host which category was added, then close.
              onSuccess(selectedCategory);
              onClose();
            }}
          />
        );
      }
      // The model itself failed to upload: heading names the category; "Try again" returns to the picker.
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
      // The model was saved but its cover image failed (uploading it, or attaching it). The heading says
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
