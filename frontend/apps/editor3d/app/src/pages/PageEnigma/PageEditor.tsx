import React, { useContext, useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { TopBar } from "~/components";
import { Controls3D } from "./comps/Controls3D";
import { ControlsTopButtons } from "./comps/ControlsTopButtons";
import { ControlPanelSceneObject } from "./comps/ControlPanelSceneObject";
import { PreviewEngineCamera } from "./comps/PreviewEngineCamera";
import { PreviewFrameImage } from "./comps/PreviewFrameImage";
import { authentication, pageHeight, pageWidth } from "~/signals";
import { PoseModeSelector } from "./comps/PoseModeSelector";
import ImageToVideo from "../PageVideo/ImageToVideo";
import TextToImage from "../PageImage/TextToImage";
import { AppsIndexPage } from "../PageApps/AppsIndexPage";
import { VideoFrameExtractor } from "../PageVideoFrameExtractor";

import {
  timelineHeight,
  sidePanelWidth,
  dndTimelineHeight,
  editorLoader,
  cameraAspectRatio,
  outlinerIsShowing,
  disableHotkeyInput,
  enableHotkeyInput,
  gridVisibility,
  setGridVisibility,
  DomLevels,
} from "~/pages/PageEnigma/signals";
import { EditorCanvas } from "./comps/EngineCanvases";
import { SceneContainer } from "./comps/SceneContainer";
import { Outliner } from "./comps/Outliner";
import { CameraAspectRatio } from "./enums";
import { PromptBox3D } from "@storyteller/ui-promptbox";
import { PopoverItem } from "@storyteller/ui-popover";
import { LoadingDots } from "@storyteller/ui-loading";
import { OnboardingHelper } from "./comps/OnboardingHelper";
import { FocalLengthDisplay } from "./comps/FocalLengthDisplay/FocalLengthDisplay";

import {
  addCamera,
  cameras,
  deleteCamera,
  focalLengthDragging,
  selectedCameraId,
  updateCamera,
} from "./signals/camera";
import { isPromptBoxFocused } from "./signals/promptBox";
import { uploadImage } from "~/components/reusable/UploadModalMedia/uploadImage";
import { EngineContext } from "./contexts/EngineContext";
import Queue, { QueueNames } from "./Queue";
import { toEngineActions } from "./Queue/toEngineActions";
import { UnionedDataTypes } from "./Queue/Queue";

import {
  topNavMediaId,
  topNavMediaUrl,
} from "~/components/signaled/TopBar/TopBar";
import { uploadPlaneFromMediaToken } from "~/components/reusable/UploadModalMedia/uploadPlane";
import { addObject } from "./signals/objectGroup/addObject";
import { addCharacter } from "./signals/characterGroups/addCharacter";
import { AssetType, AUTH_STATUS } from "~/enums";
import { v4 as uuidv4 } from "uuid";
import { MediaItem } from "~/pages/PageEnigma/models";
import { UploaderState } from "~/models";
import * as THREE from "three";
import {
  GalleryItem,
  onImageDrop,
  removeImageDropListener,
} from "@storyteller/ui-gallery-modal";
import {
  STAGE_3D_PAGE_MODEL_LIST,
  ModelPage,
  useSelectedImageModel,
  ClassyModelSelector,
  //ProviderSelector,
  //PROVIDER_LOOKUP_BY_PAGE,
} from "@storyteller/ui-model-selector";
import { LoginModal, useLoginModalStore } from "@storyteller/ui-login-modal";
import PageDraw from "../PageDraw/PageDraw";
import { useTabStore } from "../Stores/TabState";
import PageEdit from "../PageEdit/PageEdit";
import { ImageModel } from "@storyteller/model-list";
import { TutorialModalButton } from "@storyteller/ui-tutorial-modal";

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
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  useEffect(() => {
    timelineHeight.value = 0; //timelineHeight.value = 208;
    sidePanelWidth.value = 340;
    window.onbeforeunload = () => {
      return "You may have unsaved changes.";
    };
  }, []);

  const selectedImageModel: ImageModel | undefined =
    useSelectedImageModel(PAGE_ID);

  const height =
    dndTimelineHeight.value > -1
      ? pageHeight.value - dndTimelineHeight.value - 56
      : pageHeight.value - timelineHeight.value - 56;

  const getScale = () => {
    const height = pageHeight.value - timelineHeight.value - 56;
    const scaleHeight = height < 610 ? height / 610 : 1;

    if (
      cameraAspectRatio.value === CameraAspectRatio.VERTICAL_9_16 &&
      outlinerIsShowing.value &&
      height < 900
    ) {
      if (pageWidth.value > 2000) {
        return scaleHeight;
      }
      return scaleHeight * 0.78;
    }

    if (
      cameraAspectRatio.value === CameraAspectRatio.SQUARE_1_1 &&
      pageWidth.value < 2000
    ) {
      return scaleHeight * 0.85;
    }

    return scaleHeight;
  };

  // These are callbacks required by promptbox
  const editorEngine = useContext(EngineContext);
  const handleCameraSelect = (selectedItem: PopoverItem) => {
    const selectedCamera = cameras.value.find(
      (cam) => cam.label === selectedItem.label,
    );
    if (selectedCamera && editorEngine) {
      selectedCameraId.value = selectedCamera.id;

      // Show focal length display temporarily
      // TODO: Rename dragging to visible - BFlat
      focalLengthDragging.value = {
        isDragging: true,
        focalLength: selectedCamera.focalLength,
      };
      setTimeout(() => {
        focalLengthDragging.value = {
          isDragging: false,
          focalLength: selectedCamera.focalLength,
        };
      }, 1500);

      // Update the main camera to match the selected camera's properties
      if (editorEngine.camera) {
        // First update position and lookAt
        editorEngine.camera.position.set(
          selectedCamera.position.x,
          selectedCamera.position.y,
          selectedCamera.position.z,
        );
        editorEngine.camera.lookAt(
          selectedCamera.lookAt.x,
          selectedCamera.lookAt.y,
          selectedCamera.lookAt.z,
        );

        // Update FOV
        editorEngine.camera.fov = editorEngine.focalLengthToFov(
          selectedCamera.focalLength,
        );
        editorEngine.camera.updateProjectionMatrix();

        // Reset and update camera controls
        if (editorEngine.cameraViewControls) {
          editorEngine.cameraViewControls.reset();
          editorEngine.cameraViewControls.update(0);
        }

        // Force a render to update the view
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
    if (cameras.value.length >= 6) {
      console.warn("Maximum number of cameras (6) reached");
      return;
    }

    const newIndex = cameras.value.length + 1;
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
    selectedCameraId.value = newId;

    // Update the engine camera to match the new camera's properties
    if (editorEngine && editorEngine.camera) {
      editorEngine.camera.position.set(randomX, randomY, randomZ);
      editorEngine.camera.lookAt(0, 0, 0);
      editorEngine.camera.fov = editorEngine.focalLengthToFov(24);
      editorEngine.camera.updateProjectionMatrix();

      // Reset and update camera controls
      if (editorEngine.cameraViewControls) {
        editorEngine.cameraViewControls.reset();
        editorEngine.cameraViewControls.update(0);
      }

      // Force a render to update the view
      editorEngine.renderScene();
    }
  };

  const handleCameraNameChange = (id: string, newName: string) => {
    updateCamera(id, { label: newName });
  };

  const handleCameraFocalLengthChange = (id: string, value: number) => {
    const camera = cameras.value.find((cam) => cam.id === id);
    if (camera) {
      updateCamera(id, { focalLength: value });
    }
  };

  const onAspectRatioSelect = (newRatio: UnionedDataTypes) => {
    // Publish the change to the engine
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.CHANGE_CAMERA_ASPECT_RATIO,
      data: newRatio,
    });
  };
  // MOVE THIS don't throw this in here
  // Image drop from gallery/library modal logic
  useEffect(() => {
    let handler: unknown;
    // 3D Drag and Drop Logic

    if (tabStore.activeTabId === "3D") {
      handler = onImageDrop(
        (item: GalleryItem, position: { x: number; y: number }) => {
          console.log("3D Drop debug (event):", {
            editorEngine,
            camera: editorEngine?.camera,
            renderer: editorEngine?.renderer,
            position,
          });

          // Calculate world position from cursor immediately on drop
          let worldPosition = undefined;
          if (editorEngine?.camera && editorEngine?.renderer && position) {
            const rect =
              editorEngine.renderer.domElement.getBoundingClientRect();
            // Convert client coordinates to canvas coordinates
            const canvasX = position.x - rect.left;
            const canvasY = position.y - rect.top;
            const ndcX = (canvasX / rect.width) * 2 - 1;
            const ndcY = -(canvasY / rect.height) * 2 + 1;
            const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
            vector.unproject(editorEngine.camera);
            worldPosition = vector;
          }

          (async () => {
            try {
              if (item.mediaClass === "dimensional") {
                // Handle 3D models
                const isCharacter = item.assetType === "character";
                const mediaItem: MediaItem = {
                  version: 1,
                  type: isCharacter ? AssetType.CHARACTER : AssetType.OBJECT,
                  media_id: item.id || uuidv4(),
                  name: item.label || (isCharacter ? "Character" : "3D Object"),
                  ...(worldPosition && {
                    position: {
                      x: worldPosition.x,
                      y: worldPosition.y,
                      z: worldPosition.z,
                    },
                  }),
                };
                if (isCharacter) {
                  addCharacter(mediaItem);
                } else {
                  addObject(mediaItem);
                }
              } else {
                // Handle images (create image planes)
                const mediaItem: MediaItem = {
                  version: 1,
                  type: AssetType.OBJECT,
                  media_id: item.id || uuidv4(),
                  name: item.label || "Image Plane",
                  ...(worldPosition && {
                    position: {
                      x: worldPosition.x,
                      y: worldPosition.y,
                      z: worldPosition.z,
                    },
                  }),
                };
                addObject(mediaItem);

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
                  <PreviewFrameImage />
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
                    className="absolute bottom-14 mb-4 ml-4 flex origin-bottom-left flex-col gap-2"
                    style={{ transform: `scale(${getScale()})` }}
                  >
                    <Outliner />
                    <PreviewEngineCamera />
                  </div>

                  <ControlPanelSceneObject />
                </div>

                <PromptBox3D
                  cameras={cameras}
                  cameraAspectRatio={cameraAspectRatio}
                  disableHotkeyInput={disableHotkeyInput}
                  enableHotkeyInput={enableHotkeyInput}
                  gridVisibility={gridVisibility}
                  setGridVisibility={setGridVisibility}
                  selectedCameraId={selectedCameraId}
                  deleteCamera={deleteCamera}
                  focalLengthDragging={focalLengthDragging}
                  isPromptBoxFocused={isPromptBoxFocused}
                  uploadImage={uploadImage}
                  handleCameraSelect={handleCameraSelect}
                  handleAddCamera={handleAddCamera}
                  handleCameraNameChange={handleCameraNameChange}
                  handleCameraFocalLengthChange={handleCameraFocalLengthChange}
                  onAspectRatioSelect={onAspectRatioSelect}
                  selectedImageModel={selectedImageModel}
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
                  isShowing={editorLoader.value.isShowing}
                  type="bricks"
                  message={editorLoader.value.message}
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
                  <TutorialModalButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {tabStore.activeTabId == "APPS" && (
        <div>
          <AppsIndexPage />
        </div>
      )}
      {tabStore.activeTabId == "2D" && (
        <div>
          <PageDraw />
        </div>
      )}
      {tabStore.activeTabId == "IMAGE" && (
        <div>
          <TextToImage
            imageMediaId={topNavMediaId.value}
            imageUrl={topNavMediaUrl.value}
          />
        </div>
      )}
      {tabStore.activeTabId == "VIDEO" && (
        <div>
          <ImageToVideo />
        </div>
      )}
      {tabStore.activeTabId == "EDIT" && (
        <div>
          <PageEdit />
        </div>
      )}
      {tabStore.activeTabId == "VIDEO_FRAME_EXTRACTOR" && (
        <div>
          <VideoFrameExtractor />
        </div>
      )}
    </div>
  );
};
