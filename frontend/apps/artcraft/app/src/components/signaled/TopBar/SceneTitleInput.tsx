// SceneTitleInput: the breadcrumb in the middle of the top bar ("Page name > Scene title"). If the user owns the
// scene, clicking the title turns it into a text box; leaving the box saves the new name to the backend.
// Rendered by TopBar.tsx. Reads/writes the scene signal in ~/signals, renames through MediaFilesApi
// (~/Classes/ApiManager) and shows failures with the page-scene store's error dialog.

import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { useSignals } from "@preact/signals-react/runtime";
import { ChevronRightIcon, LoaderCircleIcon, PencilIcon } from "lucide-react";
import { scene, signalScene, authentication } from "~/signals";
import { usePageSceneStore } from "@storyteller/ui-pagescene";
import { Input } from "@storyteller/ui-input";
import { MediaFilesApi } from "~/Classes/ApiManager/MediaFilesApi";

// pageName: the name of the current page, shown before the scene title.
interface Props {
  pageName: string;
}

/**
 * Breadcrumb with an inline title editor. Enter or clicking away saves, Escape cancels.
 */
export const SceneTitleInput = ({ pageName }: Props) => {
  // Subscribes this component to the signals read below (scene, authentication).
  useSignals();
  const { userInfo } = authentication;
  // false = show the title as a button; true = show the editable text box.
  const [showInput, setShowInput] = useState(false);
  // Title before editing began, so an empty or failed rename can be rolled back.
  const [previousTitle, setPreviousTitle] = useState(scene.value.title);
  // Only the creator of the scene may rename it.
  const isSceneOwner = scene.value.ownerToken === userInfo.value?.user_token;

  // isValid: false after an empty title was rejected (red outline). isSaving: rename request in flight (spinner).
  const [{ isValid, isSaving }, setState] = useState<{
    isValid: boolean;
    isSaving: boolean;
  }>({ isValid: true, isSaving: false });
  const setIsValid = (val: boolean) => {
    setState((curr) => ({ ...curr, isValid: val }));
  };
  const setIsSaving = (val: boolean) => {
    setState((curr) => ({ ...curr, isSaving: val }));
  };

  // Show the app-wide ErrorDialog with this message.
  const handleShowErrorDialog = (errorMessage: string) => {
    usePageSceneStore.getState().setErrorDialog("Error", errorMessage);
  };

  // Every keystroke updates the shared scene signal immediately (no save yet).
  const handleChangeSceneTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    signalScene({
      ...scene.value,
      title: e.target.value,
    });
    if (scene.value.title !== "") {
      setIsValid(true);
    }
  };

  // Send the new title to the backend; on failure show an error and restore the previous title.
  const renameScene = async (sceneTitle: string, sceneToken: string) => {
    const mediaFileApi = new MediaFilesApi();
    const response = await mediaFileApi.RenameMediaFileByToken({
      mediaToken: sceneToken,
      name: sceneTitle,
    });
    if (!response.success) {
      handleShowErrorDialog(
        response.errorMessage || "Unknown Error in Renaming Scene",
      );
      resetPreviousTitle();
    }
    setIsSaving(false);
  };

  // Runs on blur: reject an empty title (and refocus the box), otherwise save it if the scene already exists on the server.
  const validateSceneTitle = (e: React.FocusEvent<HTMLInputElement>) => {
    setShowInput(false);
    if (scene.value.title === "") {
      setIsValid(false);
      handleShowErrorDialog("Scene name can not be empty.");
      resetPreviousTitle();
      e.currentTarget.focus();
    } else if (scene.value.token) {
      setIsSaving(true);
      renameScene(
        scene.value.title!, //guarunteed by input
        scene.value.token,
      );
    }
  };

  // Put the title back to what it was before editing.
  const resetPreviousTitle = () => {
    signalScene({
      ...scene.value,
      title: previousTitle,
    });
  };

  const handleShowInput = () => {
    setShowInput(true);
  };

  // data-tauri-drag-region lets the user drag the desktop window by this bar (the title button opts out so it stays clickable).
  return (
    <div
      className={twMerge(
        "flex w-full items-center justify-center gap-1.5",
        isSaving && "ml-3",
      )}
      data-tauri-drag-region
    >
      {!showInput && (
        <div className="flex items-center gap-1.5" data-tauri-drag-region>
          <span
            className="hud-label text-nowrap text-base-fg/70"
            data-tauri-drag-region
          >
            {pageName}
          </span>
          <ChevronRightIcon
            aria-hidden="true"
            className="h-3 w-3 shrink-0 text-base-fg/50"
          />

          {isSceneOwner ? (
            <button
              className="flex max-w-[280px] items-center border border-transparent px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:cursor-text hover:bg-white/10"
              onClick={handleShowInput}
              data-tauri-drag-region="false"
            >
              <span className="truncate">{scene.value.title || ""}</span>
              <PencilIcon className="ml-2 shrink-0 text-sm opacity-50" />
            </button>
          ) : (
            <div className="max-w-[280px] truncate border border-transparent px-3 py-1.5 text-sm font-semibold text-white/80">
              {scene.value.title || ""}
            </div>
          )}
        </div>
      )}

      {showInput && (
        <div className="relative">
          <Input
            disabled={scene.value.ownerToken !== userInfo.value?.user_token}
            className="w-[420px]"
            inputClassName={twMerge(
              "text-center h-[34px] text-sm font-semibold focus:outline-white/60",
              isSaving && "outline-white/30",
            )}
            isError={!isValid}
            value={scene.value.title || ""}
            onChange={handleChangeSceneTitle}
            onBlur={validateSceneTitle}
            onFocus={(e) => {
              setPreviousTitle(scene.value.title);
              e.target.select();
            }}
            autoFocus={true}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
              } else if (e.key === "Escape") {
                resetPreviousTitle();
                setShowInput(false);
              }
            }}
          />
        </div>
      )}

      {isSaving && (
        <LoaderCircleIcon className="shrink-0 animate-spin text-sm opacity-70" />
      )}
    </div>
  );
};
