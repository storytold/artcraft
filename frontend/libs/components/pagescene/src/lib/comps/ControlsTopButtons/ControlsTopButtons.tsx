import React, { useCallback, useContext, useState } from "react";
import {
  faCheckSquare,
  faFile,
  faKeyboard,
  faSquare,
} from "@fortawesome/pro-solid-svg-icons";
import { ButtonDropdown } from "@storyteller/ui-button-dropdown";
import { Input } from "@storyteller/ui-input";
import { Button } from "@storyteller/ui-button";
import { Modal } from "@storyteller/ui-modal";
import { twMerge } from "tailwind-merge";

import { EngineContext } from "../../contexts/EngineContext/EngineContext";
import { usePageSceneStore } from "../../PageSceneStore";
import { CameraAspectRatio, ToastTypes } from "../../enums";
import { getSceneGenerationMetaData } from "../../sceneMetadata";
import { LoadUserScenes } from "./LoadUserScenes";
import { Help } from "./Help/Help";

const isNumberString = (s: string): boolean => /^\d+$/.test(s);

export const ControlsTopButtons = () => {
  const editor = useContext(EngineContext);
  const [shortcutsIsShowing, setShortcutsIsShowing] = useState(false);

  const sceneMeta = usePageSceneStore((s) => s.sceneMeta);
  const currentUserToken = usePageSceneStore((s) => s.currentUserToken);
  const outlinerShowing = usePageSceneStore((s) => s.outlinerShowing);

  const [sceneTitleInput, setSceneTitleInput] = useState<string>(
    sceneMeta.title || "",
  );
  const [sceneTokenSelected, setSceneTokenSelected] = useState<string>("");

  // Keep the scene-title input in sync with the loaded scene's title.
  // The host wrapper (PageScene.tsx) drives the URL ↔ token bookkeeping;
  // here we only mirror the title for the Save-as-copy dialog.
  React.useEffect(() => {
    if (!sceneMeta.isInitializing && sceneMeta.title !== undefined) {
      setSceneTitleInput(sceneMeta.title);
    }
  }, [sceneMeta.isInitializing, sceneMeta.title]);

  const handleChangeSceneTitleInput = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSceneTitleInput(e.target.value);
  };

  const handleResetScene = () => {
    editor?.cameraController.changeRenderCameraAspectRatio(
      CameraAspectRatio.HORIZONTAL_3_2,
    );
  };

  const handleButtonSave = async () => {
    if (!editor) {
      // No-op without an editor; the toast is informational only.
      return;
    }
    const sceneGenerationMetadata = getSceneGenerationMetaData(editor);

    const retSceneMediaToken = await editor.saveScene({
      sceneTitle: sceneMeta.title || "",
      sceneToken: sceneMeta.token,
      sceneGenerationMetadata,
    });

    if (retSceneMediaToken === "") {
      editor.adapter.showToast(
        ToastTypes.ERROR,
        "Failed to Save Scene Try again Later!",
      );
    }

    if (retSceneMediaToken) {
      editor.adapter.showToast(ToastTypes.SUCCESS, retSceneMediaToken);
      if (!sceneMeta.token) {
        editor.adapter.onSceneTitleChange?.({
          title: sceneMeta.title || "",
          token: retSceneMediaToken,
          ownerToken: sceneMeta.ownerToken,
          isModified: false,
        });
      }
    }
  };

  const handleButtonSaveAsCopy = useCallback(async () => {
    if (!editor) return;
    const sceneGenerationMetadata = getSceneGenerationMetaData(editor);
    const retSceneMediaToken = await editor.saveScene({
      sceneTitle: sceneTitleInput,
      sceneToken: undefined,
      sceneGenerationMetadata,
    });
    if (retSceneMediaToken) {
      editor.adapter.showToast(ToastTypes.SUCCESS, retSceneMediaToken);
      editor.adapter.onSceneTitleChange?.({
        title: sceneTitleInput,
        token: retSceneMediaToken,
        ownerToken: currentUserToken,
        isModified: false,
      });
    }
  }, [sceneTitleInput, editor, currentUserToken]);

  const handleButtonLoadScene = () => {
    handleResetScene();
    editor?.loadScene(sceneTokenSelected).catch((err) => {
      editor.adapter.showToast(ToastTypes.ERROR, err.message);
    });
  };

  const handleSceneSelection = (token: string) => {
    setSceneTokenSelected(token);
  };

  const handleShowOutliner = () => {
    usePageSceneStore.getState().setOutlinerShowing(!outlinerShowing);
  };

  const canSave =
    sceneMeta.isModified &&
    (sceneMeta.ownerToken === undefined ||
      sceneMeta.ownerToken === currentUserToken);

  return (
    <div className="flex flex-col gap-2 pl-2 pt-2">
      <div className="flex gap-1.5">
        <ButtonDropdown
          label="File"
          icon={faFile}
          className="shadow-xl"
          options={[
            {
              label: "New scene",
              description: "Ctrl+N",
              dialogProps: {
                title: "Create New Scene",
                content: (
                  <h4>
                    Make sure you&apos;ve saved your scene. Unsaved changes
                    will be lost. Continue?
                  </h4>
                ),
                confirmButtonProps: {
                  label: "Create new scene",
                  onClick: async () => {
                    handleResetScene();
                    const defaultTitle = "Untitled New Scene";
                    setSceneTitleInput(defaultTitle);
                    await editor?.newScene(defaultTitle);
                  },
                },
                closeButtonProps: { label: "Cancel" },
                showClose: true,
              },
            },
            {
              label: "Load my scene",
              description: "Ctrl+O",
              dialogProps: {
                title: "Load a Saved Scene",
                content: (
                  <LoadUserScenes onSceneSelect={handleSceneSelection} />
                ),
                confirmButtonProps: {
                  label: "Load",
                  disabled: sceneTokenSelected === "",
                  onClick: handleButtonLoadScene,
                },
                closeButtonProps: { label: "Cancel" },
                showClose: true,
                className: "max-w-5xl",
              },
            },
            {
              disabled: !canSave,
              label: "Save scene",
              description: "Ctrl+S",
              ...(sceneMeta.token
                ? { onClick: handleButtonSave }
                : {
                    dialogProps: {
                      title: "Save Scene",
                      content: (
                        <h4>
                          Save scene to <b>{sceneMeta.title}</b>?
                        </h4>
                      ),
                      confirmButtonProps: {
                        label: "Save",
                        onClick: handleButtonSave,
                      },
                      closeButtonProps: { label: "Cancel" },
                      showClose: true,
                    },
                  }),
              divider: true,
            },
            {
              disabled: !sceneMeta.isModified || !sceneMeta.token,
              label: "Save scene as copy",
              description: "Ctrl+Shift+S",
              onDialogOpen: () => {
                const copyCountStr = sceneTitleInput.substring(
                  sceneTitleInput.lastIndexOf("(") + 1,
                  sceneTitleInput.length - 1,
                );
                if (isNumberString(copyCountStr)) {
                  const newCopyCountStr = String(Number(copyCountStr) + 1);
                  setSceneTitleInput(
                    sceneTitleInput.replace(copyCountStr, newCopyCountStr),
                  );
                } else {
                  setSceneTitleInput(sceneTitleInput + " (1)");
                }
              },
              dialogProps: {
                title: "Save Scene as Copy",
                content: (
                  <Input
                    value={sceneTitleInput}
                    label="Please enter a name for your scene"
                    onChange={handleChangeSceneTitleInput}
                  />
                ),
                confirmButtonProps: {
                  label: "Save",
                  disabled: sceneTitleInput === "",
                  onClick: handleButtonSaveAsCopy,
                },
                closeButtonProps: { label: "Cancel" },
                showClose: true,
              },
            },
          ]}
        />

        <Button
          icon={outlinerShowing ? faCheckSquare : faSquare}
          className="shadow-xl"
          iconClassName={twMerge(
            "text-[16px]",
            outlinerShowing ? "text-white" : "text-white/20",
          )}
          variant="secondary"
          onClick={handleShowOutliner}
        >
          Outliner
        </Button>

        <Button
          icon={faKeyboard}
          variant="secondary"
          className="shadow-xl"
          onClick={() => setShortcutsIsShowing(true)}
        >
          Shortcuts
        </Button>
      </div>
      <Modal
        isOpen={shortcutsIsShowing}
        onClose={() => setShortcutsIsShowing(false)}
        title="Shortcuts"
        className="h-[500px] max-w-4xl"
      >
        <Help />
      </Modal>
    </div>
  );
};
