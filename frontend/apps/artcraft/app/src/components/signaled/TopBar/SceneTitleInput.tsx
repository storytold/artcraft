import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { useSignals } from "@preact/signals-react/runtime";
import { faPencil, faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { scene, signalScene, authentication } from "~/signals";
import {
  showErrorDialog,
  errorDialogMessage,
  errorDialogTitle,
} from "~/pages/PageEnigma/signals";
import { Input } from "@storyteller/ui-input";
import { MediaFilesApi } from "~/Classes/ApiManager/MediaFilesApi";
import { getCreatorIcon, ModelCreator } from "@storyteller/model-list";

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
    errorDialogTitle.value = "Error";
    errorDialogMessage.value = errorMessage;
    showErrorDialog.value = true;
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
        <div className="flex items-center gap-2.5" data-tauri-drag-region>
          {getCreatorIcon(
            ModelCreator.ArtCraft,
            "h-5 w-5 icon-auto-contrast opacity-60",
          )}
          <span className="text-nowrap opacity-60">{pageName}</span>
          <span className="opacity-60">/</span>

          {isSceneOwner ? (
            <button
              className="ml-0.5 rounded-md px-2 py-1 transition-all hover:cursor-text hover:bg-white/[8%]"
              onClick={handleShowInput}
            >
              {scene.value.title || ""}
              <FontAwesomeIcon
                icon={faPencil}
                className="ml-2 text-sm opacity-50"
              />
            </button>
          ) : (
            <div className="ml-0.5 rounded-md px-2 py-1">
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
              "text-center h-8 focus:outline-brand-primary",
              isSaving && "outline-brand-secondary",
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

      {isSaving && <FontAwesomeIcon icon={faSpinnerThird} spin />}
    </div>
  );
};
