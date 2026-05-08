import React, { useContext, useEffect, useRef } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { TopBar } from "~/components";
import { Controls3D } from "./comps/Controls3D";
import { ControlsTopButtons } from "./comps/ControlsTopButtons";
import { ControlPanelSceneObject } from "./comps/ControlPanelSceneObject";
import { PreviewEngineCamera } from "./comps/PreviewEngineCamera";
import { authentication, pageHeight, pageWidth } from "~/signals";
import { PoseModeSelector } from "./comps/PoseModeSelector";
import { TabbedPages } from "./TabbedPages";

import { DomLevels } from "~/pages/PageScene/PageSceneStore";
import { setCameraAspect } from "~/pages/PageScene/actions";
import { GridVisibleChangedEvent } from "~/pages/PageScene/engine/events/EngineEvent";
import { EditorCanvas } from "./comps/EngineCanvases";
import { SceneContainer } from "./comps/SceneContainer";
import { useEditorCanvas } from "./hooks/useEditorCanvas";
import { useFreeCam } from "./hooks/useFreeCam";
import { useViewportPointer } from "./hooks/useViewportPointer";
import { useViewportKeyboard } from "./hooks/useViewportKeyboard";
import { Outliner } from "./comps/Outliner";
import { CameraAspectRatio } from "./enums";
import { PromptBox3D, commonToCameraAspect } from "@storyteller/ui-promptbox";
import { PopoverItem } from "@storyteller/ui-popover";
import { LoadingDots } from "@storyteller/ui-loading";
import { OnboardingHelper } from "./comps/OnboardingHelper";
import { FocalLengthDisplay } from "./comps/FocalLengthDisplay/FocalLengthDisplay";

import { uploadImage } from "~/components/reusable/UploadModalMedia/uploadImage";
import { EngineContext } from "./contexts/EngineContext";

import { uploadPlaneFromMediaToken } from "~/components/reusable/UploadModalMedia/uploadPlane";
import { addObject, addCharacter } from "./actions";
import { usePageSceneStore } from "./PageSceneStore";
import { AssetType, AUTH_STATUS } from "~/enums";
import { v4 as uuidv4 } from "uuid";
import { MediaItem } from "~/pages/PageScene/models";
import { UploaderState } from "~/models";
import { pickDropPosition } from "./engine/pickDropPosition";
import {
  GalleryItem,
  onImageDrop,
  removeImageDropListener,
} from "@storyteller/ui-gallery-modal";
import {
  STAGE_3D_PAGE_MODEL_LIST,
  ModelPage,
  useSelectedImageModel,
  useSelectedProviderForModel,
  ClassyModelSelector,
  //ProviderSelector,
  //PROVIDER_LOOKUP_BY_PAGE,
} from "@storyteller/ui-model-selector";
import { LoginModal, useLoginModalStore } from "@storyteller/ui-login-modal";
import { useTabStore } from "../Stores/TabState";
import { ImageModel } from "@storyteller/model-list";
import { HelpMenuButton } from "@storyteller/ui-help-menu";
import {
  CostCalculatorButton,
  useCostBreakdownModalStore,
} from "@storyteller/ui-pricing-modal";
import { GenerationProvider } from "@storyteller/api-enums";

const PAGE_ID: ModelPage = ModelPage.Stage3D;

export const PageEditor = () => {
  useSignals();
  const { triggerRecheck } = useLoginModalStore();
  const { status } = authentication;

  useEffect(() => {
    if (status.value === AUTH_STATUS.LOGGED_OUT) {
      triggerRecheck();
    }
  }, [status.value, triggerRecheck]);

  const tabStore = useTabStore();
  const camAspect = usePageSceneStore((s) => s.cameraAspectRatio);
  const outlinerShowing = usePageSceneStore((s) => s.outlinerShowing);
  const editorLoader = usePageSceneStore((s) => s.editorLoader);
  const disableHotkeyInput = usePageSceneStore((s) => s.disableHotkeyInput);
  const enableHotkeyInput = usePageSceneStore((s) => s.enableHotkeyInput);
  const cameras = usePageSceneStore((s) => s.cameras);
  const selectedCameraId = usePageSceneStore((s) => s.selectedCameraId);
  const focalLengthDragging = usePageSceneStore((s) => s.focalLengthDragging);
  const setFocalLengthDragging = usePageSceneStore(
    (s) => s.setFocalLengthDragging,
  );
  const isPromptBoxFocused = usePageSceneStore((s) => s.isPromptBoxFocused);
  const setIsPromptBoxFocused = usePageSceneStore(
    (s) => s.setIsPromptBoxFocused,
  );
  const gridVisible = usePageSceneStore((s) => s.gridVisible);
  const addCamera = usePageSceneStore((s) => s.addCamera);
  const updateCamera = usePageSceneStore((s) => s.updateCamera);
  const deleteCamera = usePageSceneStore((s) => s.deleteCamera);
  const setSelectedCameraId = usePageSceneStore((s) => s.setSelectedCameraId);
  // Only stops propagation for clicks on the overlay div itself (the
  // transparent gaps between control buttons). Clicks that bubbled up
  // from child controls pass through untouched, so React-tree-portal'd
  // modals further down the JSX (the upload modals inside Controls3D)
  // aren't silenced when the user clicks inside them.
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      event.stopPropagation();
    }
  };

  useEffect(() => {
    window.onbeforeunload = () => {
      return "You may have unsaved changes.";
    };
  }, []);

  const selectedImageModel: ImageModel | undefined =
    useSelectedImageModel(PAGE_ID);

  const selectedProvider: GenerationProvider | undefined =
    useSelectedProviderForModel(PAGE_ID, selectedImageModel?.id);

  const imageCredits = useCostBreakdownModalStore(
    (s) => s.estimatedCreditsByPage[PAGE_ID],
  );

  const height = pageHeight.value - 56;

  const getScale = () => {
    const height = pageHeight.value - 56;
    const scaleHeight = height < 610 ? height / 610 : 1;

    if (
      camAspect === CameraAspectRatio.VERTICAL_9_16 &&
      outlinerShowing &&
      height < 900
    ) {
      if (pageWidth.value > 2000) {
        return scaleHeight;
      }
      return scaleHeight * 0.78;
    }

    if (
      camAspect === CameraAspectRatio.SQUARE_1_1 &&
      pageWidth.value < 2000
    ) {
      return scaleHeight * 0.85;
    }

    return scaleHeight;
  };

  // These are callbacks required by promptbox
  const editorEngine = useContext(EngineContext);
  const editorCanvas = useEditorCanvas();
  useFreeCam(editorCanvas, editorEngine);
  useViewportPointer(editorCanvas, editorEngine);
  useViewportKeyboard(editorEngine);
  const handleCameraSelect = (selectedItem: PopoverItem) => {
    const selectedCamera = cameras.find(
      (cam) => cam.label === selectedItem.label,
    );
    if (selectedCamera && editorEngine) {
      setSelectedCameraId(selectedCamera.id);

      // Show focal length display temporarily
      // TODO: Rename dragging to visible - BFlat
      setFocalLengthDragging({
        isDragging: true,
        focalLength: selectedCamera.focalLength,
      });
      setTimeout(() => {
        setFocalLengthDragging({
          isDragging: false,
          focalLength: selectedCamera.focalLength,
        });
      }, 1500);

      // Update the main camera to match the selected camera's properties
      const cam = editorEngine.cameraController.camera;
      if (cam) {
        cam.position.set(
          selectedCamera.position.x,
          selectedCamera.position.y,
          selectedCamera.position.z,
        );
        cam.lookAt(
          selectedCamera.lookAt.x,
          selectedCamera.lookAt.y,
          selectedCamera.lookAt.z,
        );

        cam.fov = editorEngine.cameraController.focalLengthToFov(
          selectedCamera.focalLength,
        );
        cam.updateProjectionMatrix();

        // Reset free-cam motion so a switch doesn't carry over a
        // half-applied drag from the previous camera.
        if (editorEngine.cameraController.freeCamState) {
          editorEngine.cameraController.freeCamState.velocity.set(0, 0, 0);
        }

        editorEngine.renderScene();
      }

      // Force update camera properties in the state
      updateCamera(selectedCamera.id, {
        focalLength: selectedCamera.focalLength,
        position: selectedCamera.position,
        rotation: selectedCamera.rotation,
        lookAt: selectedCamera.lookAt,
      });
    }
  };

  const handleAddCamera = () => {
    // Check if we've reached the maximum number of cameras
    if (cameras.length >= 6) {
      console.warn("Maximum number of cameras (6) reached");
      return;
    }

    const newIndex = cameras.length + 1;
    const newId = `cam${newIndex}`;

    // This is for generating random orbital position for the new camera using spherical coordinates
    const radius = Math.random() * 5 + 7; // Distance from center: 7 to 12 units
    const theta = Math.random() * Math.PI * 2; // Azimuthal angle: 0 to 2π
    const phi = Math.PI / 3 + (Math.random() * Math.PI) / 6; // Polar angle: π/3 to π/2 (60° to 90° from horizontal)

    // Convert spherical coordinates to Cartesian coordinates
    const randomX = radius * Math.sin(phi) * Math.cos(theta);
    const randomY = Math.abs(radius * Math.cos(phi)) + 2; // Ensure Y is positive and at least 2 units up
    const randomZ = radius * Math.sin(phi) * Math.sin(theta);

    addCamera({
      id: newId,
      label: `Camera ${newIndex}`,
      focalLength: 24,
      position: {
        x: randomX,
        y: randomY,
        z: randomZ,
      },
      rotation: { x: 0, y: 0, z: 0 },
      lookAt: { x: 0, y: 0, z: 0 },
    });

    // Switch to the newly created camera
    setSelectedCameraId(newId);

    // Update the engine camera to match the new camera's properties
    const cam = editorEngine?.cameraController.camera;
    if (editorEngine && cam) {
      cam.position.set(randomX, randomY, randomZ);
      cam.lookAt(0, 0, 0);
      cam.fov = editorEngine.cameraController.focalLengthToFov(24);
      cam.updateProjectionMatrix();

      // Reset free-cam motion so the camera doesn't drift after
      // teleport.
      if (editorEngine.cameraController.freeCamState) {
        editorEngine.cameraController.freeCamState.velocity.set(0, 0, 0);
      }

      editorEngine.renderScene();
    }
  };

  const handleCameraNameChange = (id: string, newName: string) => {
    updateCamera(id, { label: newName });
  };

  const handleCameraFocalLengthChange = (id: string, value: number) => {
    const camera = cameras.find((cam) => cam.id === id);
    if (camera) {
      updateCamera(id, { focalLength: value });
    }
  };

  const onAspectRatioSelect = (newRatio: CameraAspectRatio) => {
    if (!editorEngine) return;
    setCameraAspect(editorEngine, newRatio);
  };

  // Cold-load sync: align the editor letterbox with the picker's
  // initial display (which falls back to `model.defaultAspectRatio`).
  // Fires once when the engine and a `supportsNewAspectRatio()` model
  // are both ready, then never again — every later change goes through
  // user picks. We can't sync per-model-switch because almost every
  // model declares `defaultAspectRatio: Square`, which would force the
  // letterbox to Square on every swap and override the user's pick.
  const didColdSyncRef = useRef(false);
  useEffect(() => {
    if (didColdSyncRef.current) return;
    if (!editorEngine || !selectedImageModel?.supportsNewAspectRatio()) return;
    const def = selectedImageModel.defaultAspectRatio;
    if (!def) return;
    const mapped = commonToCameraAspect(def);
    if (!mapped) return;
    setCameraAspect(editorEngine, mapped);
    didColdSyncRef.current = true;
  }, [editorEngine, selectedImageModel]);

  // MOVE THIS don't throw this in here
  // Image drop from gallery/library modal logic
  useEffect(() => {
    let handler: unknown;
    // 3D Drag and Drop Logic

    if (tabStore.activeTabId === "3D") {
      handler = onImageDrop(
        (item: GalleryItem, position: { x: number; y: number }) => {
          (async () => {
            if (!editorEngine) {
              console.warn("Cannot drop asset: editor engine not ready");
              return;
            }
            const worldPosition = pickDropPosition(
              {
                getCamera: () => editorEngine.cameraController.camera,
                getCanvas: () => editorEngine.renderer?.domElement,
                getRaycastTargets: () =>
                  editorEngine.activeScene.scene.children,
                removeTransformControls: () =>
                  editorEngine.utils.removeTransformControls(true),
              },
              position.x,
              position.y,
            );
            try {
              if (item.mediaClass === "dimensional") {
                const isCharacter = item.assetType === "character";
                const mediaItem: MediaItem = {
                  version: 1,
                  type: isCharacter ? AssetType.CHARACTER : AssetType.OBJECT,
                  media_id: item.id || uuidv4(),
                  name: item.label || (isCharacter ? "Character" : "3D Object"),
                };
                if (isCharacter) {
                  await addCharacter(editorEngine, mediaItem, worldPosition);
                } else {
                  await addObject(editorEngine, mediaItem, worldPosition);
                }
              } else {
                const mediaItem: MediaItem = {
                  version: 1,
                  type: AssetType.OBJECT,
                  media_id: item.id || uuidv4(),
                  name: item.label || "Image Plane",
                };
                await addObject(editorEngine, mediaItem, worldPosition);

                await uploadPlaneFromMediaToken({
                  title: item.label || "Image Plane",
                  mediaToken: item.id,
                  progressCallback: (state: UploaderState) => {
                    if (state.status)
                      console.log("Upload status:", state.status);
                  },
                });
              }
            } catch (err) {
              console.error("Failed to add object to scene:", err);
            }
          })();
        },
      );

      // 2D Drag and Drop Logic
    } else if (tabStore.activeTabId === "2D") {
      handler = onImageDrop(
        (item: GalleryItem, position: { x: number; y: number }) => {
          console.log("2D Drop debug (event):", {
            item,
            position,
          });

          // Find the main Konva canvas element - get the first canvas (left panel)
          const canvasElements = document.querySelectorAll("canvas");
          const canvasElement = canvasElements[0]; // Get the main drawing canvas (left panel)
          if (!canvasElement) {
            console.error("Could not find canvas element for 2D drop");
            return;
          }

          const rect = canvasElement.getBoundingClientRect();

          // Convert screen coordinates to canvas coordinates
          const canvasX = position.x - rect.left;
          const canvasY = position.y - rect.top;

          // Ensure the drop position is within canvas bounds
          if (
            canvasX < 0 ||
            canvasY < 0 ||
            canvasX > rect.width ||
            canvasY > rect.height
          ) {
            console.log("Drop position outside canvas bounds");
            return;
          }

          console.log("Canvas drop position:", { canvasX, canvasY });

          (async () => {
            try {
              // event that PageDraw listens for
              const dropEvent = new CustomEvent("gallery-2d-drop", {
                detail: {
                  item,
                  canvasPosition: { x: canvasX, y: canvasY },
                },
              });
              window.dispatchEvent(dropEvent);
            } catch (err) {
              console.error("Failed to add image to 2D canvas:", err);
            }
          })();
        },
      );
    }

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (handler) removeImageDropListener(handler as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabStore.activeTabId, editorEngine]);

  return (
    <div className="w-screen">
      <TopBar
        loginSignUpPressed={() => {
          console.log("PRESSED");
          triggerRecheck();
        }}
        pageName="Edit Scene"
      />
      <LoginModal
        videoSrc2D="/resources/videos/artcraft-canvas-demo.mp4"
        videoSrc3D="/resources/videos/artcraft-3d-demo.mp4"
        onOpenChange={(isOpen: boolean) => {
          if (isOpen) {
            disableHotkeyInput(DomLevels.DIALOGUE);
          } else {
            enableHotkeyInput(DomLevels.DIALOGUE);
          }
        }}
        onArtCraftAuthSuccess={(userInfo: any) => {
          authentication.status.value = AUTH_STATUS.LOGGED_IN;
          authentication.userInfo.value = userInfo;
        }}
      />
      {tabStore.activeTabId == "3D" && (
        <div>
          <OnboardingHelper />

          <div
            className="relative flex w-screen"
            style={{ height: "calc(100vh - 68px)" }}
          >
            {/* Engine section/side panel */}
            <div
              id="engine-n-panels-wrapper"
              className="flex"
              style={{
                height,
              }}
            >
              <div className="relative w-full overflow-hidden bg-transparent">
                <SceneContainer>
                  <EditorCanvas />
                </SceneContainer>

                {/* Focal Length Display */}
                <FocalLengthDisplay />

                {/* Pose Mode Selector */}
                <PoseModeSelector />

                {/* Top controls */}
                <div
                  className="absolute left-0 top-0 w-full"
                  onClick={handleOverlayClick}
                >
                  <div className="grid grid-cols-3 gap-4">
                    <ControlsTopButtons />
                    <Controls3D />
                  </div>
                </div>

                {/* Bottom controls */}
                <div
                  className="absolute bottom-0 left-0"
                  style={{
                    width: pageWidth.value,
                  }}
                  onClick={handleOverlayClick}
                >
                  <div
                    className="absolute bottom-20 mb-4 ml-4 flex origin-bottom-left flex-col gap-2"
                    style={{ transform: `scale(${getScale()})` }}
                  >
                    <Outliner />
                    <PreviewEngineCamera />
                  </div>

                  <ControlPanelSceneObject />
                </div>

                <PromptBox3D
                  cameras={cameras}
                  cameraAspectRatio={camAspect}
                  disableHotkeyInput={disableHotkeyInput}
                  enableHotkeyInput={enableHotkeyInput}
                  gridVisibility={gridVisible}
                  setGridVisibility={(visible: boolean) =>
                    editorEngine?.bus.emit(
                      new GridVisibleChangedEvent(visible),
                    )
                  }
                  selectedCameraId={selectedCameraId}
                  deleteCamera={deleteCamera}
                  focalLengthDragging={focalLengthDragging}
                  setFocalLengthDragging={setFocalLengthDragging}
                  isPromptBoxFocused={isPromptBoxFocused}
                  setIsPromptBoxFocused={setIsPromptBoxFocused}
                  uploadImage={uploadImage}
                  handleCameraSelect={handleCameraSelect}
                  handleAddCamera={handleAddCamera}
                  handleCameraNameChange={handleCameraNameChange}
                  handleCameraFocalLengthChange={handleCameraFocalLengthChange}
                  onAspectRatioSelect={onAspectRatioSelect}
                  selectedImageModel={selectedImageModel}
                  selectedProvider={selectedProvider}
                  credits={imageCredits}
                  setEnginePrompt={(prompt) => {
                    console.log("setEnginePrompt", prompt);
                    if (!editorEngine) {
                      console.log("editorEngine is not available");
                      return;
                    }
                    editorEngine!.positive_prompt = prompt;
                  }}
                  snapshotCurrentFrame={editorEngine?.snapShotOfCurrentFrame.bind(
                    editorEngine,
                  )}
                />

                <LoadingDots
                  className="absolute left-0 top-0 z-50"
                  isShowing={editorLoader.isShowing}
                  type="bricks"
                  message={editorLoader.message}
                />

                <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
                  <ClassyModelSelector
                    items={STAGE_3D_PAGE_MODEL_LIST}
                    page={PAGE_ID}
                    panelTitle="Select Model"
                    panelClassName="min-w-[300px]"
                    buttonClassName="bg-transparent p-0 text-lg hover:bg-transparent text-white/80 hover:text-white"
                    showIconsInList
                    triggerLabel="Model"
                  />
                </div>
                <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
                  <CostCalculatorButton modelPage={PAGE_ID} />
                  <HelpMenuButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <TabbedPages />
    </div>
  );
};
