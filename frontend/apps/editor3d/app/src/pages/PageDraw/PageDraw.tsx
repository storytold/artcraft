import { useState, useRef, useEffect } from "react";
import { PaintSurface } from "./PaintSurface";
import "./App.css";
import PromptEditor from "./PromptEditor/PromptEditor";
import SideToolbar from "./components/ui/SideToolbar";
import { AspectRatioType, useSceneStore } from "./stores/SceneState";
import { useUndoRedoHotkeys } from "./hooks/useUndoRedoHotkeys";
import { useDeleteHotkeys } from "./hooks/useDeleteHotkeys";
import { useCopyPasteHotkeys } from "./hooks/useCopyPasteHotkeys";
import Konva from "konva";
import { setCanvasRenderBitmap } from "../../signals/canvasRenderBitmap";
import { captureStageImageBitmap } from "./hooks/useUpdateSnapshot";
import { ContextMenuContainer } from "./components/ui/ContextMenu";
import { ImageModel } from "@storyteller/model-list";
import {
  CANVAS_2D_PAGE_MODEL_LIST,
  ClassyModelSelector,
  ModelPage,
  //ProviderSelector,
  //PROVIDER_LOOKUP_BY_PAGE,
  useSelectedImageModel,
} from "@storyteller/ui-model-selector";
import { useCanvasBgRemovedEvent } from "@storyteller/tauri-api";
import { TutorialModalButton } from "@storyteller/ui-tutorial-modal";

const PAGE_ID: ModelPage = ModelPage.Canvas2D;

export const DecodeBase64ToImage = async (
  base64String: string,
): Promise<ImageBitmap> => {
  const img = document.createElement("img");

  const dataUrl = base64String.startsWith("data:")
    ? base64String
    : `data:image/png;base64,${base64String}`;

  return new Promise((resolve, reject) => {
    img.onload = async () => {
      try {
        const bitmap = await createImageBitmap(img);
        resolve(bitmap);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));

    img.src = dataUrl;
  });
};

const PageDraw = () => {
  const canvasWidth = useRef<number>(1024);
  const canvasHeight = useRef<number>(1024);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const stageRef = useRef<Konva.Stage>({} as Konva.Stage);
  const transformerRefs = useRef<{ [key: string]: Konva.Transformer }>({});
  const store = useSceneStore();

  const selectedImageModel: ImageModel | undefined =
    useSelectedImageModel(PAGE_ID);

  useDeleteHotkeys({ onDelete: store.deleteSelectedItems });
  useUndoRedoHotkeys({ undo: store.undo, redo: store.redo });
  useCopyPasteHotkeys({
    onCopy: store.copySelectedItems,
    onPaste: store.pasteItems,
  });

  useCanvasBgRemovedEvent(async (event) => {
    console.log("Canvas bg removed event received:", event);
    const nodeId = event.maybe_frontend_subscriber_id;
    if (!nodeId) {
      console.error("No node ID received from background removal");
      return;
    }
    // const base64String = response.payload?.base64_bytes as string;
    // const binaryString = atob(base64String);
    // const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
    // const blob = new Blob([bytes], { type: "image/png" });
    // const file = new File([blob], "generated_image.png", {
    //   type: blob.type,
    // });
    store.finishRemoveBackground(
      nodeId,
      event.media_token,
      event.image_cdn_url,
    );
  });

  // Listen for gallery drag and drop events
  useEffect(() => {
    const handleGallery2DDrop = (event: CustomEvent) => {
      const { item, canvasPosition } = event.detail;
      console.log("Received 2D gallery drop:", { item, canvasPosition });

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

      const imageUrl = item.fullImage || item.thumbnail;
      if (!imageUrl) {
        console.error("No image URL available for dropped item");
        return;
      }

      console.log("Creating image from URL:", imageUrl);

      store.createImageFromUrl(stagePoint.x, stagePoint.y, imageUrl);

      console.log(
        `Created image "${item.label}" at stage position:`,
        stagePoint,
      );
    };

    window.addEventListener(
      "gallery-2d-drop",
      handleGallery2DDrop as EventListener,
    );

    return () => {
      window.removeEventListener(
        "gallery-2d-drop",
        handleGallery2DDrop as EventListener,
      );
    };
  }, [store]);

  const handleImageUpload = async (files: File[]): Promise<void> => {
    // Determine current canvas dimensions from the store (according to aspect-ratio)
    const { width: canvasW, height: canvasH } =
      store.getAspectRatioDimensions();

    // Target maximum size – 85 % of the canvas in each direction
    const maxW = canvasW * 0.85;
    const maxH = canvasH * 0.85;

    for (const file of files) {
      // Pre-load the image to get its intrinsic dimensions
      const img = new Image();
      img.onload = () => {
        const { naturalWidth, naturalHeight } = img;

        // Compute scale to fit within the frame while preserving aspect-ratio
        const scale = Math.min(maxW / naturalWidth, maxH / naturalHeight, 1);
        const finalW = naturalWidth * scale;
        const finalH = naturalHeight * scale;

        // Center the image in the canvas
        const x = (canvasW - finalW) / 2;
        const y = (canvasH - finalH) / 2;

        store.createImageFromFile(x, y, file, finalW, finalH);
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const onEnqueuedPressed = async () => {
    const { width, height } = store.getAspectRatioDimensions();

    // takes snap shot and then a global variable in the engine will invoke the inference.
    const image = await captureStageImageBitmap(
      stageRef,
      transformerRefs,
      width,
      height,
    );
    if (!image) {
      console.error("Failed to capture stage image");
      return;
    } else {
      setCanvasRenderBitmap(image);
    }
  };

  const onFitPressed = async () => {
    // Get the stage and its container dimensions
    const stage = stageRef.current;
    if (!stage) return;

    // Get container dimensions
    const containerWidth = stage.container().offsetWidth;
    const containerHeight = stage.container().offsetHeight;

    // Get canvas dimensions from store aspect ratio
    const canvasW = store.getAspectRatioDimensions().width;
    const canvasH = store.getAspectRatioDimensions().height;

    // Add padding to ensure canvas doesn't touch the edges
    const padding = 40;
    const availableWidth = containerWidth - padding * 2;
    const availableHeight = containerHeight - padding * 2;

    // Calculate scale to fit canvas within container while maintaining aspect ratio
    const scaleX = availableWidth / canvasW;
    const scaleY = availableHeight / canvasH;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%

    // Set the scale
    stage.scale({ x: scale, y: scale });

    // Calculate position to center the scaled canvas in container
    const scaledCanvasW = canvasW * scale;
    const scaledCanvasH = canvasH * scale;

    stage.position({
      x: (containerWidth - scaledCanvasW) / 2,
      y: (containerHeight - scaledCanvasH) / 2,
    });

    // Redraw the stage
    stage.batchDraw();
  };

  // Auto-fit canvas to screen on initial load
  useEffect(() => {
    const autoFitCanvas = async () => {
      let attempts = 0;
      const maxAttempts = 20;

      const tryFit = async () => {
        const stage = stageRef.current;
        if (stage && stage.container && stage.container().offsetWidth > 0) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          onFitPressed();
          return true;
        }

        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return tryFit();
        }
        return false;
      };

      await tryFit();
    };

    autoFitCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="fixed inset-0 -z-10 bg-ui-background" />
      <div
        className={`preserve-aspect-ratio fixed bottom-0 left-1/2 z-10 -translate-x-1/2 transform ${
          isSelecting ? "pointer-events-none" : "pointer-events-auto"
        }`}
      >
        <PromptEditor
          initialPrompt=""
          onPromptChange={(prompt: string) => {
            console.log("Prompt changed:", prompt);
          }}
          onRandomize={() => {
            console.log("Randomize clicked");
          }}
          onVary={() => {
            console.log("Vary clicked");
          }}
          onAspectRatioChange={async (ratio: string) => {
            const ratioToType = (ratio: string): AspectRatioType => {
              switch (ratio) {
                case "tall":
                  return AspectRatioType.PORTRAIT;
                case "wide":
                  return AspectRatioType.LANDSCAPE;
                case "square":
                  return AspectRatioType.SQUARE;
                default:
                  return AspectRatioType.NONE;
              }
            };

            const aspectRatioType = ratioToType(ratio);
            store.setAspectRatioType(aspectRatioType);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            onFitPressed();
          }}
          onEnqueuePressed={onEnqueuedPressed}
          onFitPressed={onFitPressed}
          //selectedModelInfo={selectedModelInfo}
          selectedImageModel={selectedImageModel}
        />
      </div>
      <SideToolbar
        className="fixed left-0 top-1/2 z-10 -translate-y-1/2 transform"
        onSelect={(): void => {
          store.setActiveTool("select");
        }}
        onActivateShapeTool={(
          shape: "rectangle" | "circle" | "triangle",
        ): void => {
          store.selectNode(null);
          store.setCurrentShape(shape);
          store.setActiveTool("shape");
          store.selectNode(null);
        }}
        onPaintBrush={(hex: string, size: number, opacity: number): void => {
          store.setActiveTool("draw");
          store.setBrushColor(hex);
          store.setBrushSize(size);
          store.setBrushOpacity(opacity);
        }}
        onCanvasBackground={(hex: string): void => {
          console.log("Canvas background activated", { color: hex });
          // Add background change logic here
          // TODO: minor bug needs to update the preview panel
          // Debounce also causes issues with real time color change.
          store.setFillColor(hex);
        }}
        onUploadImage={(): void => {
          // Create input element dynamically like in PromptEditor
          console.log("Upload image activated");
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.multiple = true;
          input.style.display = "none";
          document.body.appendChild(input);

          input.onchange = (e: Event) => {
            console.log("File change event triggered");
            const target = e.target as HTMLInputElement;
            if (target.files) {
              const files = Array.from(target.files);
              console.log("Selected files:", files);
              const imageFiles = files.filter((file) =>
                file.type.startsWith("image/"),
              );
              console.log("Filtered image files:", imageFiles);

              if (imageFiles.length > 0) {
                console.log("Uploading images:", imageFiles);
                handleImageUpload(imageFiles);
              } else {
                console.log("No valid image files selected");
              }
            } else {
              console.log("No files selected");
            }
            document.body.removeChild(input);
          };

          input.value = "";
          input.click();
        }}
        onDelete={(): void => {
          store.RESET();
        }}
        activeToolId={store.activeTool}
        currentShape={store.currentShape}
      />
      <div className="relative z-0">
        <ContextMenuContainer
          onAction={(e, action) => {
            if (action === "contextMenu") {
              const hasSelection = store.selectedNodeIds.length > 0;
              if (hasSelection) {
                console.log("An item is selected.");
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
              case "LOCK":
                store.toggleLock(store.selectedNodeIds);
                break;
              case "REMOVE_BACKGROUND":
                await store.beginRemoveBackground(store.selectedNodeIds);
                break;
              case "BRING_TO_FRONT":
                store.bringToFront(store.selectedNodeIds);
                break;
              case "BRING_FORWARD":
                store.bringForward(store.selectedNodeIds);
                break;
              case "SEND_BACKWARD":
                store.sendBackward(store.selectedNodeIds);
                break;
              case "SEND_TO_BACK":
                store.sendToBack(store.selectedNodeIds);
                break;
              case "DUPLICATE":
                store.copySelectedItems();
                store.pasteItems();
                break;
              case "DELETE":
                store.deleteSelectedItems();
                break;
              default:
              // No action
            }
          }}
          isLocked={store.selectedNodeIds.some((id) => {
            const node = store.nodes.find((n) => n.id === id);
            const lineNode = store.lineNodes.find((n) => n.id === id);
            return (node?.locked || lineNode?.locked) ?? false;
          })}
        >
          <PaintSurface
            nodes={store.nodes}
            selectedNodeIds={store.selectedNodeIds}
            onCanvasSizeChange={(width: number, height: number): void => {
              canvasWidth.current = width;
              canvasHeight.current = height;
            }}
            fillColor={store.fillColor}
            activeTool={store.activeTool}
            brushColor={store.brushColor}
            brushSize={store.brushSize}
            onSelectionChange={setIsSelecting}
            stageRef={stageRef}
            transformerRefs={transformerRefs}
          />
        </ContextMenuContainer>
      </div>
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-5">
        <ClassyModelSelector
          items={CANVAS_2D_PAGE_MODEL_LIST}
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
    </>
  );
};

export default PageDraw;
