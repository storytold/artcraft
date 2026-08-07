// 3D editor body — the visual composition of canvas, controls,
// outliner, prompt box, model selector, etc. Mounted by <Stage3D />
// inside an EngineProvider; consumes the active editor via context
// and host plumbing via the adapter on `editor.adapter`.
//
// Lib-resident so artcraft Tauri and artcraft-website share the
// exact same 3D editor UX. Only the platform-specific PageSceneAdapter
// implementation differs between hosts.

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  GalleryItem,
  onImageDrop,
  removeImageDropListener,
} from "@storyteller/ui-gallery-modal";
import {
  useStage3dPageModelList,
  ModelPage,
  defaultModelForPage,
  useClassyModelSelectorStore,
  useSelectedImageModel,
  useSelectedProviderForModel,
  ClassyModelSelector,
} from "@storyteller/ui-model-selector";
import { PopoverMenu } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import type { ImageModel } from "@storyteller/model-list";
import type { GenerationProvider } from "@storyteller/api-enums";
import { HelpMenuButton } from "@storyteller/ui-help-menu";
import {
  CostCalculatorButton,
  useCostBreakdownModalStore,
} from "@storyteller/ui-pricing-modal";
import { LoadingDots } from "@storyteller/ui-loading";
import type { PopoverItem } from "@storyteller/ui-popover";
import { v4 as uuidv4 } from "uuid";

import { EngineContext } from "./contexts/EngineContext/EngineContext";
import { AnonHintChip } from "./comps/AnonHintChip";
import { AspectRatioMenu } from "./comps/AspectRatioMenu";
import { ControlPanelSceneObject } from "./comps/ControlPanelSceneObject";
import { Controls3D } from "./comps/Controls3D";
import { SceneModePill } from "./comps/SceneModePill";
import { ControlsTopButtons } from "./comps/ControlsTopButtons";
import { EditorCanvas } from "./comps/EngineCanvases";
import { FocalLengthDisplay } from "./comps/FocalLengthDisplay/FocalLengthDisplay";
import { OnboardingHelper } from "./comps/OnboardingHelper";
import { PerfStatsOverlay } from "./comps/PerfStatsOverlay";
import { EntranceDebugPanel } from "./comps/EntranceDebugPanel";
import { Outliner } from "./comps/Outliner";
import { PoseModeSelector } from "./comps/PoseModeSelector";
import { ExitCameraView } from "./comps/ExitCameraView";
import { RecordControls } from "./comps/RecordControls";
import { CameraStatusPill } from "./comps/CameraStatusPill";
import { RenderOverlay } from "./comps/RenderOverlay";
import { CompletionModal } from "./comps/CompletionModal";
import { PreviewBox } from "./comps/PreviewBox";
import { PreviewEngineCamera } from "./comps/PreviewEngineCamera";
import { SceneContainer } from "./comps/SceneContainer";
import { addCharacter, addObject } from "./actions";
import { TimelineBar, TimelineEditor } from "./comps/Timeline";
import { useEditorCanvas } from "./hooks/useEditorCanvas";
import { useFreeCam } from "./hooks/useFreeCam";
import { useViewportPointer } from "./hooks/useViewportPointer";
import { useViewportKeyboard } from "./hooks/useViewportKeyboard";
import { useViewportSize } from "./hooks/useViewportSize";
import { GridVisibleChangedEvent } from "./engine/events/EngineEvent";
import { pickDropPosition } from "./engine/pickDropPosition";
import { AssetType, CameraAspectRatio } from "./enums";
import { usePageSceneStore, useIsVisitingOthersScene } from "./PageSceneStore";
import type { MediaItem } from "./models/assets";

const PAGE_ID: ModelPage = ModelPage.Stage3D;

export interface Stage3DBodyProps {
  /** Show the bottom-right "Costs" cost-calculator button. */
  showCostCalculator?: boolean;
  /** Show the top-bar "Create 3D model from image" magic-wand button. */
  showImageTo3DButton?: boolean;
  /** Show the bottom-right help menu button. */
  showHelpMenu?: boolean;
  /** Where to render the model picker. `"bottom-left"` (default) keeps
   *  the existing ClassyModelSelector floating in the editor corner —
   *  used by Tauri. `"prompt-box"` hides the corner selector and
   *  renders a compact popover inside the prompt-box toolbar instead,
   *  matching the webapp's other prompt boxes. */
  modelSelectorPlacement?: "bottom-left" | "prompt-box";
  /** Optional content rendered just above the promptbox stack (image
   *  row + glass card + toolbar), inside the lib's `bottom-4` anchor.
   *  Tauri leaves this unset; the webapp uses it for the demo-mode
   *  "See other demo scenes" affordance so the button stacks above
   *  the prompt input instead of floating loose over the canvas. */
  promptboxAboveStackSlot?: React.ReactNode;
  /** Optional content rendered in the top toolbar's left cluster, right
   *  after the File/Outliner/Shortcuts buttons. Used by the webapp for
   *  the editable scene title; Tauri leaves it unset. */
  topBarStartSlot?: React.ReactNode;
  /** Optional content rendered in the top toolbar's right cluster, before
   *  the anonymous hint chip. Used by the webapp to host the relocated
   *  nav actions; Tauri leaves it unset. */
  topBarEndSlot?: React.ReactNode;
}

export const Stage3DBody = ({
  showCostCalculator = true,
  showImageTo3DButton = true,
  showHelpMenu = true,
  modelSelectorPlacement = "bottom-left",
  promptboxAboveStackSlot,
  topBarStartSlot,
  topBarEndSlot,
}: Stage3DBodyProps = {}) => {
  const stage3dModelList = useStage3dPageModelList();
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
  const timelineExists = usePageSceneStore((s) => s.timelineExists);
  const timelineExpanded = usePageSceneStore((s) => s.timelineExpanded);
  const setTimelineExpanded = usePageSceneStore((s) => s.setTimelineExpanded);
  const timelineTracks = usePageSceneStore((s) => s.timelineTracks);
  const is3DSceneLoaded = usePageSceneStore((s) => s.is3DSceneLoaded);
  const sceneMode = usePageSceneStore((s) => s.sceneMode);
  const isRecord = sceneMode === "record";
  const previewImageUrl = usePageSceneStore((s) => s.sceneMeta.previewImageUrl);
  const isVisitingOthersScene = useIsVisitingOthersScene();
  const addCamera = usePageSceneStore((s) => s.addCamera);
  const updateCamera = usePageSceneStore((s) => s.updateCamera);
  const deleteCamera = usePageSceneStore((s) => s.deleteCamera);
  const setSelectedCameraId = usePageSceneStore((s) => s.setSelectedCameraId);

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

  // Inline (prompt-box) model selector. Built here rather than in
  // PromptBox3D so the promptbox lib doesn't take a new dep on
  // model-selector; the selector is just plumbed in as a ReactNode slot.
  const setSelectedModel = useClassyModelSelectorStore(
    (s) => s.setSelectedModel,
  );

  // Seed the default model on mount when we're the only model picker
  // on the page. ClassyModelSelector does this itself on mount, but in
  // the prompt-box placement we don't render it — so without this
  // effect the store stays empty and the trigger has no icon until the
  // user opens the popover and picks a model manually.
  useEffect(() => {
    if (modelSelectorPlacement !== "prompt-box") return;
    if (selectedImageModel) return;
    const models = stage3dModelList.map((i) => i.model).filter(
      (m): m is NonNullable<typeof m> => m !== undefined,
    );
    const def = defaultModelForPage(models, PAGE_ID);
    if (def) setSelectedModel(PAGE_ID, def);
  }, [
    modelSelectorPlacement,
    selectedImageModel,
    setSelectedModel,
    stage3dModelList,
  ]);

  const inlineModelItems: PopoverItem[] = useMemo(
    () =>
      stage3dModelList.map((item) => ({
        ...item,
        selected: item.model === selectedImageModel,
      })),
    [selectedImageModel, stage3dModelList],
  );
  const handleInlineModelSelect = useCallback(
    (item: PopoverItem) => {
      if (item.model) setSelectedModel(PAGE_ID, item.model);
    },
    [setSelectedModel],
  );
  const selectedModelIcon = useMemo(
    () =>
      stage3dModelList.find((i) => i.model === selectedImageModel)
        ?.icon,
    [selectedImageModel, stage3dModelList],
  );
  const inlineModelSelector =
    modelSelectorPlacement === "prompt-box" ? (
      <Tooltip content="Model" position="top" className="z-50" closeOnClick>
        <PopoverMenu
          items={inlineModelItems}
          onSelect={handleInlineModelSelect}
          mode="toggle"
          panelTitle="Select Model"
          panelClassName="min-w-[260px]"
          showIconsInList
          triggerIcon={selectedModelIcon}
        />
      </Tooltip>
    ) : undefined;

  const imageCredits = useCostBreakdownModalStore(
    (s) => s.estimatedCreditsByPage[PAGE_ID],
  );

  const editor = useContext(EngineContext);

  // Record mode is read-only playback through the render camera: enter
  // camera view + lock the viewport on entry, restore on exit.
  useEffect(() => {
    if (!editor) return;
    if (isRecord) {
      editor.cameraController.enterCameraView();
      editor.cameraController.setLocked(true);
    } else {
      editor.cameraController.setLocked(false);
      editor.cameraController.exitCameraView();
    }
  }, [isRecord, editor]);

  // Auto-expand the timeline once when a loaded scene has keyframes or an
  // imported Three.js animation; otherwise it stays collapsed by default.
  const didAutoExpandTimelineRef = useRef(false);
  useEffect(() => {
    if (!editor || !is3DSceneLoaded || didAutoExpandTimelineRef.current) return;
    didAutoExpandTimelineRef.current = true;
    if (timelineTracks.length > 0 || editor.sceneHasAnimation()) {
      setTimelineExpanded(true);
    }
  }, [editor, is3DSceneLoaded, timelineTracks, setTimelineExpanded]);

  // Reactive viewport sizing. useViewportSize listens to window
  // resize and re-renders the component. Falls back to
  // window.innerWidth/innerHeight when the host adapter doesn't
  // supply getViewportSize, so the layout always has sane values.
  const viewport = useViewportSize();

  const getScale = () => {
    const h = viewport.height - 56;
    const scaleHeight = h < 610 ? h / 610 : 1;
    if (
      camAspect === CameraAspectRatio.VERTICAL_9_16 &&
      outlinerShowing &&
      h < 900
    ) {
      if (viewport.width > 2000) return scaleHeight;
      return scaleHeight * 0.78;
    }
    if (camAspect === CameraAspectRatio.SQUARE_1_1 && viewport.width < 2000) {
      return scaleHeight * 0.85;
    }
    return scaleHeight;
  };

  const editorCanvas = useEditorCanvas();
  useFreeCam(editorCanvas, editor);
  useViewportPointer(editorCanvas, editor);
  useViewportKeyboard(editor);

  const handleCameraSelect = (selectedItem: PopoverItem) => {
    const selectedCamera = cameras.find(
      (cam) => cam.label === selectedItem.label,
    );
    if (selectedCamera && editor) {
      setSelectedCameraId(selectedCamera.id);
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

      const cam = editor.cameraController.camera;
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
        cam.fov = editor.cameraController.focalLengthToFov(
          selectedCamera.focalLength,
        );
        cam.updateProjectionMatrix();
        if (editor.cameraController.freeCamState) {
          editor.cameraController.freeCamState.velocity.set(0, 0, 0);
        }
        editor.renderScene();
      }

      updateCamera(selectedCamera.id, {
        focalLength: selectedCamera.focalLength,
        position: selectedCamera.position,
        rotation: selectedCamera.rotation,
        lookAt: selectedCamera.lookAt,
      });
    }
  };

  const handleAddCamera = () => {
    if (cameras.length >= 6) {
      console.warn("Maximum number of cameras (6) reached");
      return;
    }
    const newIndex = cameras.length + 1;
    const newId = `cam${newIndex}`;
    const radius = Math.random() * 5 + 7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.PI / 3 + (Math.random() * Math.PI) / 6;
    const randomX = radius * Math.sin(phi) * Math.cos(theta);
    const randomY = Math.abs(radius * Math.cos(phi)) + 2;
    const randomZ = radius * Math.sin(phi) * Math.sin(theta);

    addCamera({
      id: newId,
      label: `Camera ${newIndex}`,
      focalLength: 24,
      position: { x: randomX, y: randomY, z: randomZ },
      rotation: { x: 0, y: 0, z: 0 },
      lookAt: { x: 0, y: 0, z: 0 },
    });
    setSelectedCameraId(newId);

    const cam = editor?.cameraController.camera;
    if (editor && cam) {
      cam.position.set(randomX, randomY, randomZ);
      cam.lookAt(0, 0, 0);
      cam.fov = editor.cameraController.focalLengthToFov(24);
      cam.updateProjectionMatrix();
      if (editor.cameraController.freeCamState) {
        editor.cameraController.freeCamState.velocity.set(0, 0, 0);
      }
      editor.renderScene();
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

  // Gallery → 3D scene drop handler. Stage3D mounts only when 3D is
  // active so this is implicitly 3D-only.
  useEffect(() => {
    const handler = onImageDrop(
      (item: GalleryItem, position: { x: number; y: number }) => {
        (async () => {
          if (!editor) {
            console.warn("Cannot drop asset: editor engine not ready");
            return;
          }
          const worldPosition = pickDropPosition(
            {
              getCamera: () => editor.cameraController.camera,
              getCanvas: () => editor.renderer?.domElement,
              getRaycastTargets: () => editor.activeScene.scene.children,
              removeTransformControls: () =>
                editor.utils.removeTransformControls(true),
            },
            position.x,
            position.y,
          );
          try {
            if (
              item.mediaClass === "dimensional" ||
              item.mediaClass === "mesh" ||
              item.mediaClass === "splat"
            ) {
              const isCharacter = item.assetType === "character";
              const isSplat = item.mediaClass === "splat";
              const mediaItem: MediaItem = {
                version: 1,
                type: isCharacter
                  ? AssetType.CHARACTER
                  : isSplat
                    ? AssetType.SPLAT
                    : AssetType.OBJECT,
                media_id: item.id || uuidv4(),
                name:
                  item.label ||
                  (isCharacter
                    ? "Character"
                    : isSplat
                      ? "3D World"
                      : "3D Object"),
              };
              if (isCharacter) {
                await addCharacter(editor, mediaItem, worldPosition);
              } else {
                // NB: Splats intentionally route through addObject too — the
                // engine's sceneManager resolves the media token to a splat
                // (same as the engine's own DnD in DndAsset.ts).
                await addObject(editor, mediaItem, worldPosition);
              }
            } else {
              const mediaItem: MediaItem = {
                version: 1,
                type: AssetType.OBJECT,
                media_id: item.id || uuidv4(),
                name: item.label || "Image Plane",
              };
              await addObject(editor, mediaItem, worldPosition);

              await editor.adapter.uploadPlaneFromMediaToken({
                title: item.label || "Image Plane",
                mediaToken: item.id,
                progressCallback: (state) => {
                  if (state.status) console.log("Upload status:", state.status);
                },
              });
            }
          } catch (err) {
            console.error("Failed to add object to scene:", err);
          }
        })();
      },
    );

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (handler) removeImageDropListener(handler as any);
    };
  }, [editor]);

  return (
    <div className="h-full w-full">
      <div className="relative flex h-full w-full">
        <div id="engine-n-panels-wrapper" className="flex h-full w-full">
          <div className="relative w-full overflow-hidden bg-transparent">
            <SceneContainer>
              <EditorCanvas />
            </SceneContainer>

            <PerfStatsOverlay />
            {import.meta.env.DEV && <EntranceDebugPanel />}
            <FocalLengthDisplay />
            <PoseModeSelector />
            <RenderOverlay />
            <CompletionModal />

            <div
              className="absolute left-0 top-0 w-full"
              onClick={handleOverlayClick}
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-start gap-2">
                  {!isRecord && <ControlsTopButtons />}
                  {!isRecord && topBarStartSlot && (
                    <div className="pl-3">{topBarStartSlot}</div>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <SceneModePill />
                  {!isRecord && (
                    <Controls3D showImageTo3DButton={showImageTo3DButton} />
                  )}
                </div>
                <div className="flex items-start justify-end gap-2 pr-3 pt-3">
                  {/* Camera cluster: which camera drives the viewport +
                      the render-frame aspect ratio. */}
                  {!isRecord && <CameraStatusPill />}
                  {!isRecord && <AspectRatioMenu />}
                  {!isRecord && topBarEndSlot}
                  {!isRecord && <AnonHintChip />}
                </div>
              </div>
            </div>

            {/* Outliner: vertically centered against the viewport. Sized in
                vh — deliberately independent of the camera aspect ratio. */}
            <div
              className={`absolute left-4 top-1/2 -translate-y-1/2${
                isRecord ? " hidden" : ""
              }`}
            >
              <Outliner />
            </div>

            <div
              className="absolute bottom-0 left-0 right-0"
              onClick={handleOverlayClick}
            >
              {/* Always mounted: PreviewEngineCamera owns the cam-view canvas
                  that EngineProvider depends on — unmounting it in record mode
                  tears down + recreates the whole engine (wiping the scene).
                  Hide with CSS in record instead. */}
              <div
                className={`absolute bottom-20 mb-4 ml-4 flex origin-bottom-left flex-col gap-2${
                  isRecord ? " hidden" : ""
                }`}
                style={{ transform: `scale(${getScale()})` }}
              >
                <PreviewEngineCamera />
              </div>

              {!isRecord && <ControlPanelSceneObject />}
            </div>

            {isVisitingOthersScene && <PreviewBox imageUrl={previewImageUrl} />}

            {/* Build mode: the animation timeline is the sole bottom UI —
                collapsed bar by default, expanded editor via the chevron.
                The exit-camera-view button docks to the bar's right edge. */}
            {!isRecord && !timelineExpanded && (
              <div className="absolute bottom-4 left-1/2 w-[90vw] max-w-3xl -translate-x-1/2">
                <TimelineBar />
                <ExitCameraView className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full" />
              </div>
            )}
            {!isRecord && timelineExpanded && (
              <>
                <TimelineEditor />
                <ExitCameraView className="absolute bottom-4 right-4" />
              </>
            )}

            {isRecord && <RecordControls />}

            <LoadingDots
              className="absolute left-0 top-0 z-50"
              isShowing={editorLoader.isShowing}
              type="bricks"
              message={editorLoader.message}
            />

            {modelSelectorPlacement === "bottom-left" && (
              <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
                <ClassyModelSelector
                  items={stage3dModelList}
                  page={PAGE_ID}
                  panelTitle="Select Model"
                  panelClassName="min-w-[300px]"
                  buttonClassName="bg-transparent p-0 text-lg hover:bg-transparent text-white/80 hover:text-white"
                  showIconsInList
                  triggerLabel="Model"
                />
              </div>
            )}
            {(showCostCalculator || showHelpMenu) && (
              <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                {showCostCalculator && (
                  <CostCalculatorButton modelPage={PAGE_ID} />
                )}
                {showHelpMenu && <HelpMenuButton />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
