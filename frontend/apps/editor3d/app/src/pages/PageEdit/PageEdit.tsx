import { useState, useRef, useEffect, useCallback } from "react";
import Konva from "konva"; // just for types
import { EnqueueImageInpaint } from "@storyteller/tauri-api";
import { ContextMenuContainer } from "../PageDraw/components/ui/ContextMenu";
import { useCopyPasteHotkeys } from "../PageDraw/hooks/useCopyPasteHotkeys";
import { useDeleteHotkeys } from "../PageDraw/hooks/useDeleteHotkeys";
import { useUndoRedoHotkeys } from "../PageDraw/hooks/useUndoRedoHotkeys";
import PromptEditor from "./PromptEditor/PromptEditor";
import { ActiveEditTool, useEditStore } from "./stores/EditState";
import { EditPaintSurface } from "./EditPaintSurface";
import { normalizeCanvas } from "../../Helpers/CanvasHelpers";
import { BaseImageSelector, BaseSelectorImage } from "./BaseImageSelector";
import MarkerToolControlBar from "./MarkerToolControlBar";
import {
  ClassyModelSelector,
  useSelectedImageModel,
  IMAGE_EDITOR_PAGE_MODEL_LIST,
  ModelPage,
  //ProviderSelector,
  //PROVIDER_LOOKUP_BY_PAGE,
} from "@storyteller/ui-model-selector";
import { ImageModel } from "@storyteller/model-list";
import { HistoryStack, ImageBundle } from "./HistoryStack";
import { TutorialModalButton } from "@storyteller/ui-tutorial-modal";

const PAGE_ID: ModelPage = ModelPage.ImageEditor;

const PageEdit = () => {
  //useStateSceneLoader();

  const selectedImageModel: ImageModel | undefined =
    useSelectedImageModel(PAGE_ID);

  // State for canvas dimensions
  const canvasWidth = useRef<number>(1024);
  const canvasHeight = useRef<number>(1024);

  // Add new state to track if user is selecting
  const [isSelecting, setIsSelecting] = useState<boolean>(false);

  // Create refs for stage and image
  const stageRef = useRef<Konva.Stage>({} as Konva.Stage);
  const leftPanelRef = useRef<Konva.Layer>({} as Konva.Layer);
  const baseImageKonvaRef = useRef<Konva.Image>({} as Konva.Image);
  const transformerRefs = useRef<{ [key: string]: Konva.Transformer }>({});
  const [pendingGenerations, setPendingGenerations] = useState<
    { id: string; count: number }[]
  >([]);
  const [generationCount, setGenerationCount] = useState<number>(1);

  // Use the Zustand store
  const store = useEditStore();
  const baseImageUrl = store.baseImageInfo?.url;
  const addHistoryImageBundle = useEditStore(
    (state) => state.addHistoryImageBundle,
  );
  const removeHistoryImage = useEditStore((state) => state.removeHistoryImage);
  const historyImageBundles = useEditStore(
    (state) => state.historyImageBundles,
  );

  // Pass store actions directly as callbacks
  useDeleteHotkeys({ onDelete: store.deleteSelectedItems });
  useUndoRedoHotkeys({ undo: store.undo, redo: store.redo });
  useCopyPasteHotkeys({
    onCopy: store.copySelectedItems,
    onPaste: store.pasteItems,
  });

  // Listen for gallery drag and drop events
  useEffect(() => {
    const handleGallery2DDrop = (event: CustomEvent) => {
      const { item, canvasPosition } = event.detail;
      console.log("Received 2D gallery drop:", { item, canvasPosition });

      // Get the stage to transform coordinates properly
      const stage = stageRef.current;
      if (!stage) {
        console.error(
          "Stage reference not available for coordinate transformation",
        );
        return;
      }

      // Transform canvas coordinates to stage coordinates
      // Account for stage position, scale, and transformations
      const stageX = stage.x();
      const stageY = stage.y();
      const scaleX = stage.scaleX();
      const scaleY = stage.scaleY();

      const stagePoint = {
        x: (canvasPosition.x - stageX) / scaleX,
        y: (canvasPosition.y - stageY) / scaleY,
      };

      console.log("Transformed stage coordinates:", stagePoint);

      // Use the direct URL for the image
      const imageUrl = item.fullImage || item.thumbnail;
      if (!imageUrl) {
        console.error("No image URL available for dropped item");
        return;
      }

      console.log("Creating image from URL:", imageUrl);

      // Use the store's createImageFromUrl method directly
      store.createImageFromUrl(stagePoint.x, stagePoint.y, imageUrl);

      console.log(
        `Created image "${item.label}" at stage position:`,
        stagePoint,
      );
    };

    // Add event listener
    window.addEventListener(
      "gallery-2d-drop",
      handleGallery2DDrop as EventListener,
    );

    // Cleanup
    return () => {
      window.removeEventListener(
        "gallery-2d-drop",
        handleGallery2DDrop as EventListener,
      );
    };
  }, [store]);

  const onFitPressed = useCallback(async () => {
    // Get the stage and its container dimensions
    const stage = stageRef.current;
    if (!stage) return;

    // Get container dimensions
    const containerWidth = stage.container().offsetWidth;
    const containerHeight = stage.container().offsetHeight;

    // Get canvas dimensions from store aspect ratio
    const canvasW = store.getAspectRatioDimensions().width;
    const canvasH = store.getAspectRatioDimensions().height;

    // Account for top toolbar and bottom prompt box
    // Top toolbar (MarkerToolControlBar): ~140px from top (toolbar + padding)
    // Bottom prompt box: ~200px from bottom (can vary with reference images)
    // Mode selector above prompt: ~60px
    const topToolbarHeight =
      store.activeTool === "marker" ||
      store.activeTool === "eraser" ||
      store.activeTool === "edit"
        ? 140
        : 0;

    // Check if model supports masking or is nano banana (has mode selector)
    const hasModeSelectorUI =
      selectedImageModel?.usesInpaintingMask ||
      selectedImageModel?.id === "gemini_25_flash";
    const bottomUIHeight = hasModeSelectorUI ? 260 : 200;
    const totalVerticalReserved = topToolbarHeight + bottomUIHeight;

    // Calculate optimal scale to fit the canvas in the container
    const paddingFactor = 0.95; // horizontal padding (left/right)
    const scaleX = (containerWidth * paddingFactor) / canvasW;
    const availableHeight = Math.max(
      0,
      containerHeight - totalVerticalReserved,
    );
    const scaleY = availableHeight / canvasH;

    // Use the smaller scale to ensure the canvas fits in both dimensions
    const scale = Math.min(scaleX, scaleY);

    // Limit the scale between reasonable bounds (0.1 to 3.0)
    const boundedScale = Math.max(0.1, Math.min(3.0, scale));

    // Apply the calculated scale
    stage.scale({ x: boundedScale, y: boundedScale });

    // Calculate position to center canvas in available space (between toolbars)
    const verticalOffset = (topToolbarHeight - bottomUIHeight) / 2;
    stage.position({
      x: (containerWidth - canvasW * boundedScale) / 2,
      y: (containerHeight - canvasH * boundedScale) / 2 + verticalOffset,
    });
  }, [selectedImageModel, store]);

  // Auto-fit when the base image becomes available and stage is ready
  // Also re-fit when active tool or model changes (as UI layout changes)
  useEffect(() => {
    if (!store.baseImageBitmap) return;
    if (!stageRef.current) return;
    // Defer to ensure container has laid out with correct size and toolbars have rendered
    const id = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => {
        void onFitPressed();
      });
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    store.baseImageBitmap,
    stageRef.current,
    store.activeTool,
    selectedImageModel,
  ]);

  // Re-center on window resize when an image is loaded
  useEffect(() => {
    let timeoutId: number | undefined;
    const handleResize = () => {
      if (!store.baseImageBitmap) return;
      if (!stageRef.current) return;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        requestAnimationFrame(() => {
          void onFitPressed();
        });
      }, 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.baseImageBitmap, stageRef.current, onFitPressed]);

  // Create a function to use the left layer ref and download the bitmap from it
  const getMaskArrayBuffer = async (): Promise<Uint8Array> => {
    if (
      !stageRef.current ||
      !leftPanelRef.current ||
      !baseImageKonvaRef.current
    ) {
      console.error("Stage or left panel ref is not available");
      throw new Error("Stage or left panel or base image ref is not available");
    }

    const layer = leftPanelRef.current;

    // Get the canvas area that's covered by the image/rectangle
    const rect = baseImageKonvaRef.current;
    const layerCrop = layer.toCanvas({
      x: stageRef.current.x(),
      y: stageRef.current.y(),
      width: rect.width() * stageRef.current.scaleX(),
      height: rect.height() * stageRef.current.scaleY(),
      pixelRatio: 1 / stageRef.current.scaleX(),
    });

    // Using the pixelRatio scaling may result in off-by-one rounding errors,
    // So we re-fit the image to a canvas of precise size.
    const fittedCanvas = normalizeCanvas(
      layerCrop,
      rect.width(),
      rect.height(),
    );

    // Convert colored canvas to alpha mask
    // NOTE: This isn't needed because the tauri backend uses the alpha channel anyway
    // drawAlphaMask(fittedCanvas, rect.width(), rect.height());

    const blob = await fittedCanvas.convertToBlob({ type: "image/png" });
    const arrayBuffer = await blob.arrayBuffer();

    return new Uint8Array(arrayBuffer);
  };

  const handleGenerate = useCallback(
    async (prompt: string) => {
      const editedImageToken = store.baseImageInfo?.mediaToken;

      if (!editedImageToken) {
        console.error("Base image is not available");
        return;
      }

      const arrayBuffer = await getMaskArrayBuffer();

      const subscriberId: string =
        crypto?.randomUUID?.() ??
        `inpaint-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      try {
        const result = await EnqueueImageInpaint({
          model: selectedImageModel,
          image_media_token: editedImageToken,
          mask_image_raw_bytes: arrayBuffer,
          prompt: prompt,
          image_count: generationCount,
          frontend_caller: "image_editor",
          frontend_subscriber_id: subscriberId,
        });
        if (result.status === "success") {
          setPendingGenerations((prev) => [
            ...prev,
            { id: subscriberId as string, count: generationCount },
          ]);
        }
      } catch (error) {
        setPendingGenerations((prev) =>
          prev.filter((p) => p.id !== subscriberId),
        );
        throw error;
      }
    },
    [generationCount, selectedImageModel, store.baseImageInfo?.mediaToken],
  );

  const isNanoBananaModel = selectedImageModel?.id === "gemini_25_flash";
  const supportsMaskedInpainting =
    selectedImageModel?.usesInpaintingMask ?? false;

  useEffect(() => {
    if (isNanoBananaModel) {
      if (store.activeTool !== "marker" && store.activeTool !== "eraser") {
        store.setActiveTool("marker");
      }
    } else if (
      !supportsMaskedInpainting &&
      (store.activeTool !== "select" || store.lineNodes.length > 0)
    ) {
      store.setActiveTool("select");
      store.clearLineNodes();
    } else if (
      supportsMaskedInpainting &&
      (store.activeTool === "select" || store.activeTool === "marker")
    ) {
      store.setActiveTool("edit");
    }
  }, [store, supportsMaskedInpainting, isNanoBananaModel]);

  /*
   *
   * Only component logic below this
   *
   *
   *
   *
   */

  // Display image selector on launch, otherwise hide it
  // Also show loading state if info is set but image is loading
  if (!store.baseImageInfo || !store.baseImageBitmap) {
    return (
      <div
        className={
          "bg-ui-panel-gradient flex h-[calc(100vh-56px)] w-full items-center justify-center p-8"
        }
      >
        <div className="w-full max-w-5xl">
          <div className="aspect-video overflow-hidden rounded-2xl border border-ui-panel-border bg-ui-background shadow-lg">
            <BaseImageSelector
              onImageSelect={(image: BaseSelectorImage) => {
                addHistoryImageBundle({ images: [image] });
                store.setBaseImageInfo(image);
              }}
              showLoading={
                store.baseImageInfo !== null && store.baseImageInfo === null
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 -z-10 bg-ui-background" />
      {(store.activeTool === "marker" || store.activeTool === "eraser") &&
        isNanoBananaModel && (
          <div
            className={`preserve-aspect-ratio fixed left-1/2 top-0 z-10 -translate-x-1/2 transform ${
              isSelecting ? "pointer-events-none" : "pointer-events-auto"
            }`}
          >
            <MarkerToolControlBar
              currentSize={
                store.activeTool === "eraser"
                  ? store.eraserBrushSize
                  : store.markerBrushSize
              }
              currentColor={store.markerColor}
              activeTool={store.activeTool}
              showColorPicker={true}
              onSizeChange={
                store.activeTool === "eraser"
                  ? store.setEraserBrushSize
                  : store.setMarkerBrushSize
              }
              onColorChange={store.setMarkerColor}
            />
          </div>
        )}
      {(store.activeTool === "edit" || store.activeTool === "eraser") &&
        supportsMaskedInpainting && (
          <div
            className={`preserve-aspect-ratio fixed left-1/2 top-0 z-10 -translate-x-1/2 transform ${
              isSelecting ? "pointer-events-none" : "pointer-events-auto"
            }`}
          >
            <MarkerToolControlBar
              currentSize={
                store.activeTool === "eraser"
                  ? store.eraserBrushSize
                  : store.brushSize
              }
              currentColor={store.brushColor}
              activeTool={store.activeTool}
              showColorPicker={false}
              onSizeChange={
                store.activeTool === "eraser"
                  ? store.setEraserBrushSize
                  : store.setBrushSize
              }
              onColorChange={store.setBrushColor}
            />
          </div>
        )}
      <div
        className={`preserve-aspect-ratio fixed right-4 top-1/2 z-10 -translate-y-1/2 transform ${
          isSelecting ? "pointer-events-none" : "pointer-events-auto"
        }`}
      >
        <HistoryStack
          onClear={() => {
            store.RESET();
            setPendingGenerations([]);
          }}
          imageBundles={historyImageBundles}
          pendingPlaceholders={pendingGenerations}
          blurredBackgroundUrl={baseImageUrl}
          onImageSelect={(baseImage) => {
            store.clearLineNodes();
            store.setBaseImageInfo(baseImage);
          }}
          onImageRemove={(baseImage) => {
            if (
              pendingGenerations.length === 0 &&
              store.historyImageBundles.length === 1 &&
              store.historyImageBundles[0].images.length <= 1
            ) {
              store.RESET();
            } else {
              removeHistoryImage(baseImage);
            }
          }}
          onNewImageBundle={(newBundle: ImageBundle) => {
            addHistoryImageBundle(newBundle);
          }}
          onResolvePending={(id: string) =>
            setPendingGenerations((prev) => prev.filter((p) => p.id !== id))
          }
          selectedImageToken={store.baseImageInfo?.mediaToken}
        />
      </div>
      <div
        className={`preserve-aspect-ratio fixed bottom-0 left-1/2 z-10 -translate-x-1/2 transform ${
          isSelecting ? "pointer-events-none" : "pointer-events-auto"
        }`}
      >
        <PromptEditor
          selectedImageModel={selectedImageModel}
          onModeChange={(mode: string) => {
            store.setActiveTool(mode as ActiveEditTool);
          }}
          selectedMode={store.activeTool}
          onGenerateClick={handleGenerate}
          onFitPressed={onFitPressed}
          isDisabled={false}
          generationCount={generationCount}
          onGenerationCountChange={setGenerationCount}
          supportsMaskedInpainting={supportsMaskedInpainting}
          isNanoBananaModel={isNanoBananaModel}
          onUndo={store.undo}
          onRedo={store.redo}
        />
      </div>
      <div className="relative z-0">
        <ContextMenuContainer
          onAction={(e, action) => {
            if (action === "contextMenu") {
              const hasSelection = store.selectedNodeIds.length > 0;
              if (hasSelection) {
                console.log("An item is selected.");
                // You can add additional actions here based on the selection
                return true;
              } else {
                console.log("No item is selected.");
                return false;
              }
            }
            return false;
          }}
          onMenuAction={async (action) => {
            switch (action) {
              case "DUPLICATE":
                store.copySelectedItems();
                store.pasteItems();
                break;
              case "DELETE":
                store.deleteSelectedItems();
                break;
              default:
              // No action needed for unhandled cases
            }
          }}
          isLocked={store.selectedNodeIds.some((id) => {
            const node = store.nodes.find((n) => n.id === id);
            const lineNode = store.lineNodes.find((n) => n.id === id);
            return (node?.locked || lineNode?.locked) ?? false;
          })}
        >
          <EditPaintSurface
            nodes={store.nodes}
            selectedNodeIds={store.selectedNodeIds}
            onCanvasSizeChange={(width: number, height: number): void => {
              canvasWidth.current = width;
              canvasHeight.current = height;
            }}
            //fillColor={store.fillColor}
            activeTool={store.activeTool}
            brushColor={"rgba(39, 187, 245, 0.54)"}
            brushSize={store.brushSize}
            markerBrushSize={store.markerBrushSize}
            eraserBrushSize={store.eraserBrushSize}
            markerColor={store.markerColor}
            onSelectionChange={setIsSelecting}
            stageRef={stageRef}
            transformerRefs={transformerRefs}
            leftPanelRef={leftPanelRef}
            baseImageRef={baseImageKonvaRef}
          />
        </ContextMenuContainer>
      </div>
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-5">
        <ClassyModelSelector
          items={IMAGE_EDITOR_PAGE_MODEL_LIST}
          page={PAGE_ID}
          panelTitle="Select Model"
          panelClassName="min-w-[300px]"
          buttonClassName="bg-transparent p-0 text-lg hover:bg-transparent text-base-fg opacity-80 hover:opacity-100"
          showIconsInList
          triggerLabel="Model"
        />
      </div>
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
        <TutorialModalButton />
      </div>
    </>
  );
};

export default PageEdit;
