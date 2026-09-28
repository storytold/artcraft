import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { useSignals } from "@preact/signals-react/runtime";
import { ChevronRightIcon, LoaderCircleIcon, PencilIcon } from "lucide-react";
import { scene, signalScene, authentication } from "~/signals";
import { usePageSceneStore } from "@storyteller/ui-pagescene";
import { Input } from "@storyteller/ui-input";
import { MediaFilesApi } from "~/Classes/ApiManager/MediaFilesApi";

interface Props {
  pageName: string;
}

export const SceneTitleInput = ({ pageName }: Props) => {
  useSignals();
  const { userInfo } = authentication;
  const [showInput, setShowInput] = useState(false);
  const [previousTitle, setPreviousTitle] = useState(scene.value.title);
  const isSceneOwner = scene.value.ownerToken === userInfo.value?.user_token;

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

  const handleShowErrorDialog = (errorMessage: string) => {
    usePageSceneStore.getState().setErrorDialog("Error", errorMessage);
  };

  const handleChangeSceneTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    signalScene({
      ...scene.value,
      title: e.target.value,
    });
    if (scene.value.title !== "") {
      setIsValid(true);
    }
  };

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

  const resetPreviousTitle = () => {
    signalScene({
      ...scene.value,
      title: previousTitle,
    });
  };

  const handleShowInput = () => {
    setShowInput(true);
  };

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
