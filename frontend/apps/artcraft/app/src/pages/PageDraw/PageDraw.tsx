import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { DRAW_LAYER_ID, INPAINT_LAYER_ID, PaintSurface } from "./PaintSurface";
import "./App.css";
import PromptEditor from "./PromptEditor/PromptEditor";
import SideToolbar from "./components/ui/SideToolbar";
import {
  AspectRatioType,
  type SceneState,
  useSceneStore,
} from "./stores/SceneState";
import { useUndoRedoHotkeys } from "./hooks/useUndoRedoHotkeys";
import { useDeleteHotkeys } from "./hooks/useDeleteHotkeys";
import { useCopyPasteHotkeys } from "./hooks/useCopyPasteHotkeys";
import Konva from "konva";
import { captureStageEditsBitmap } from "./hooks/useUpdateSnapshot";
import { ContextMenuContainer } from "./components/ui/ContextMenu";
import { ImageModel } from "@storyteller/model-list";
import {
  CANVAS_2D_PAGE_MODEL_LIST,
  ClassyModelSelector,
  ModelPage,
  useSelectedImageModel,
  useSelectedProviderForModel,
} from "@storyteller/ui-model-selector";
import {
  EnqueueEditImage,
  EnqueueEditImageRequest,
  EnqueueEditImageResolution,
  EnqueueEditImageSize,
  EnqueueImageInpaint,
  EnqueueImageInpaintRequest,
  useCanvasBgRemovedEvent,
} from "@storyteller/tauri-api";
import { HelpMenuButton } from "@storyteller/ui-help-menu";
import { CostCalculatorButton } from "@storyteller/ui-pricing-modal";
import { GenerationProvider } from "@storyteller/api-enums";
import { HistoryStack, ImageBundle } from "../PageEdit/HistoryStack";
import {
  BaseImageSelector,
  BaseSelectorImage,
} from "../PageEdit/BaseImageSelector";
import { normalizeCanvas } from "~/Helpers/CanvasHelpers";
import { EncodeImageBitmapToBase64 } from "./utilities/EncodeImageBitmapToBase64";
import { RefImage, usePrompt2DStore } from "@storyteller/ui-promptbox";
import { PromptsApi } from "@storyteller/api";
import toast from "react-hot-toast";
import {
  render3DModelToDataUrl,
  DEFAULT_MODEL3D_PARAMS,
  type Model3DParams,
} from "./utilities/render3DModel";
import {
  Model3DOverlay,
  type Model3DOverlayHandle,
} from "./components/Model3DOverlay";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpRightAndDownLeftFromCenter,
  faArrowsRotate,
  faCamera,
} from "@fortawesome/pro-solid-svg-icons";

const PAGE_ID: ModelPage = ModelPage.Canvas2D;

// Pure helpers — module-level so they're not recreated on every render/call
const mapAspectRatio = (ratio?: string): EnqueueEditImageSize | undefined => {
  switch (ratio) {
    case "auto": return EnqueueEditImageSize.Auto;
    case "wide": return EnqueueEditImageSize.Wide;
    case "tall": return EnqueueEditImageSize.Tall;
    case "square": return EnqueueEditImageSize.Square;
    default: return undefined;
  }
};
const mapResolution = (res?: string): EnqueueEditImageResolution | undefined => {
  switch (res) {
    case "1k": return EnqueueEditImageResolution.OneK;
    case "2k": return EnqueueEditImageResolution.TwoK;
    case "4k": return EnqueueEditImageResolution.FourK;
    default: return undefined;
  }
};

// ─── Edit3DButton ─────────────────────────────────────────────────────────────
// Isolated memoized component so Konva-driven position updates (stage pan/zoom,
// transformer drag) only re-render this small button — not the entire PageDraw
// tree. It owns the forceUpdate state and Konva event listeners internally.
interface Edit3DButtonProps {
  nodeId: string;
  stageRef: { current: Konva.Stage };
  onEdit: (nodeId: string) => void;
}

const Edit3DButton = memo(function Edit3DButton({
  nodeId,
  stageRef,
  onEdit,
}: Edit3DButtonProps) {
  const [, forceUpdate] = useState(0);
  const bump = useCallback(() => forceUpdate((t) => t + 1), []);
  const [interacting, setInteracting] = useState(false);

  // Attach Konva event listeners:
  // - Stage pan/zoom → bump() to reposition
  // - Transformer start/end → hide/show button to avoid jitter
  // - Node drag start/end → hide/show button
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage?.on) return;

    const ns = ".edit3dbtn";
    stage.on(
      `dragmove${ns} xChange${ns} yChange${ns} scaleXChange${ns} scaleYChange${ns}`,
      bump,
    );

    const transformers = stage.find("Transformer");
    transformers.forEach((tr) => {
      tr.on(`transformstart${ns}`, () => setInteracting(true));
      // Defer one rAF so Konva finishes writing the node's new attributes
      // (scaleX/Y, width/height) before we read getClientRect() in the render.
      tr.on(`transformend${ns}`, () => requestAnimationFrame(() => { setInteracting(false); bump(); }));
    });

    const konvaNode = stage.findOne("#" + nodeId);
    if (konvaNode) {
      konvaNode.on(`dragstart${ns}`, () => setInteracting(true));
      konvaNode.on(`dragend${ns}`, () => requestAnimationFrame(() => { setInteracting(false); bump(); }));
    }

    return () => {
      stage.off(ns);
      transformers.forEach((tr) => tr.off(ns));
      konvaNode?.off(ns);
    };
  }, [stageRef, bump, nodeId]);

  if (interacting) return null;

  const stage = stageRef.current;
  if (!stage?.container) return null;

  const konvaNode = stage.findOne("#" + nodeId) as Konva.Shape | undefined;
  if (!konvaNode) return null;

  // getClientRect() returns the AABB in stage-container coords after all
  // transforms (rotation, scale, stage pan/zoom) — no manual math needed.
  const clientRect = konvaNode.getClientRect();
  const stageContainerRect = stage.container().getBoundingClientRect();
  const btnLeft = stageContainerRect.left + clientRect.x + clientRect.width / 2;
  const btnTop = stageContainerRect.top + clientRect.y + clientRect.height / 2;

  return (
    <button
      className="pointer-events-auto fixed z-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg hover:bg-blue-500"
      style={{ left: btnLeft, top: btnTop }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => onEdit(nodeId)}
    >
      Edit 3D
    </button>
  );
});

// ─── DragScrubButton ──────────────────────────────────────────────────────────
// Round button that scrubs a 3D parameter on horizontal+vertical drag.
// Uses pointer capture so the drag continues outside the button bounds.
function DragScrubButton({
  icon,
  title,
  onDrag,
}: {
  icon: React.ReactNode;
  title: string;
  onDrag: (dx: number, dy: number) => void;
}) {
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.buttons === 0) return;
    onDrag(e.movementX, e.movementY);
  };
  return (
    <button
      title={title}
      className="flex h-10 w-10 cursor-move items-center justify-center rounded-full bg-black/70 text-white shadow-lg hover:bg-black/90 active:bg-blue-600"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      {icon}
    </button>
  );
}

// ─── Edit3DScrubControls ──────────────────────────────────────────────────────
// Shown in place of Edit3DButton while the 3D overlay is open. Renders the
// scrub buttons (scale, rotate, FOV, apply) at the same node-center position,
// communicating with Model3DOverlay via an imperative handle ref.
interface Edit3DScrubControlsProps {
  nodeId: string;
  stageRef: { current: Konva.Stage };
  overlayHandle: React.RefObject<Model3DOverlayHandle>;
}

const Edit3DScrubControls = memo(function Edit3DScrubControls({
  nodeId,
  stageRef,
  overlayHandle,
}: Edit3DScrubControlsProps) {
  const [, forceUpdate] = useState(0);
  const bump = useCallback(() => forceUpdate((t) => t + 1), []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage?.on) return;
    const ns = ".edit3dcontrols";
    stage.on(
      `dragmove${ns} xChange${ns} yChange${ns} scaleXChange${ns} scaleYChange${ns}`,
      bump,
    );
    return () => {
      stage.off(ns);
    };
  }, [stageRef, bump, nodeId]);

  const stage = stageRef.current;
  if (!stage?.container) return null;
  const konvaNode = stage.findOne("#" + nodeId) as Konva.Shape | undefined;
  if (!konvaNode) return null;

  const clientRect = konvaNode.getClientRect();
  const stageContainerRect = stage.container().getBoundingClientRect();
  const cx = stageContainerRect.left + clientRect.x + clientRect.width / 2;
  const cy = stageContainerRect.top + clientRect.y + clientRect.height / 2;

  return (
    <div
      className="pointer-events-auto fixed z-[60] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
      style={{ left: cx, top: cy }}
    >
      <DragScrubButton
        icon={<FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />}
        title="Scale — drag"
        onDrag={(dx, dy) => overlayHandle.current?.onScaleDrag(dx, dy)}
      />
      <DragScrubButton
        icon={<FontAwesomeIcon icon={faArrowsRotate} />}
        title="Rotate — drag"
        onDrag={(dx, dy) => overlayHandle.current?.onRotateDrag(dx, dy)}
      />
      <DragScrubButton
        icon={<FontAwesomeIcon icon={faCamera} />}
        title="Field of view — drag"
        onDrag={(dx, dy) => overlayHandle.current?.onFovDrag(dx, dy)}
      />
      <button
        onClick={() => overlayHandle.current?.commit()}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-lg hover:bg-blue-500"
        onPointerDown={(e) => e.stopPropagation()}
      >
        ✓
      </button>
    </div>
  );
});

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
  const [editing3DNodeId, setEditing3DNodeId] = useState<string | null>(null);
  const overlayHandleRef = useRef<Model3DOverlayHandle>(null);
  const stageRef = useRef<Konva.Stage>({} as Konva.Stage);
  const transformerRefs = useRef<{ [key: string]: Konva.Transformer }>({});

  /*
   * Scene store: use a selector + useShallow to avoid re-rendering on every store change.
   * Without this, useSceneStore() subscribes to the whole store (e.g. moveNode during
   * drag updates state constantly) and PageDraw would re-render every frame.
   *
   * useShallow compares the selected object by top-level keys: we only re-render when
   * one of these values actually changes. Do NOT add:
   * - cursorPosition / cursorVisible: updated every mouse move → would re-render constantly.
   * - historyImageNodeMap: mutated in place in the store (reference never changes),
   *   so shallow would never see updates; fix the store to replace the Map if you need it.
   * When adding new store fields here, prefer primitive/array/object refs that the store
   * replaces (e.g. new array from .map()), not in-place mutations.
   *
   * IMPORTANT: The selector function is memoized to prevent infinite loops. If you modify
   * this selector, ensure the function reference stays stable (use useMemo if needed).
   */
  const selector = useMemo(
    () => (state: SceneState) => ({
      baseImageInfo: state.baseImageInfo,
      baseImageBitmap: state.baseImageBitmap,
      nodes: state.nodes,
      selectedNodeIds: state.selectedNodeIds,
      lineNodes: state.lineNodes,
      activeTool: state.activeTool,
      currentShape: state.currentShape,
      fillColor: state.fillColor,
      brushColor: state.brushColor,
      brushSize: state.brushSize,
      historyImageBundles: state.historyImageBundles,
      getAspectRatioDimensions: state.getAspectRatioDimensions,
      finishRemoveBackground: state.finishRemoveBackground,
      createImageFromUrl: state.createImageFromUrl,
      createImageFromFile: state.createImageFromFile,
      createImageFrom3DModel: state.createImageFrom3DModel,
      updateNode: state.updateNode,
      setBaseImageInfo: state.setBaseImageInfo,
      RESET: state.RESET,
      clearLineNodes: state.clearLineNodes,
      setNodes: state.setNodes,
      removeHistoryImage: state.removeHistoryImage,
      addHistoryImageBundle: state.addHistoryImageBundle,
      setAspectRatioType: state.setAspectRatioType,
      setActiveTool: state.setActiveTool,
      selectNode: state.selectNode,
      setCurrentShape: state.setCurrentShape,
      setBrushColor: state.setBrushColor,
      setBrushSize: state.setBrushSize,
      setBrushOpacity: state.setBrushOpacity,
      setFillColor: state.setFillColor,
      toggleLock: state.toggleLock,
      beginRemoveBackground: state.beginRemoveBackground,
      bringToFront: state.bringToFront,
      bringForward: state.bringForward,
      sendBackward: state.sendBackward,
      sendToBack: state.sendToBack,
      copySelectedItems: state.copySelectedItems,
      pasteItems: state.pasteItems,
      deleteSelectedItems: state.deleteSelectedItems,
      undo: state.undo,
      redo: state.redo,
    }),
    [],
  );

  const {
    baseImageInfo,
    baseImageBitmap,
    nodes,
    selectedNodeIds,
    lineNodes,
    activeTool,
    currentShape,
    fillColor,
    brushColor,
    brushSize,
    historyImageBundles,
    getAspectRatioDimensions,
    finishRemoveBackground,
    createImageFromUrl,
    createImageFromFile,
    createImageFrom3DModel,
    updateNode,
    setBaseImageInfo,
    RESET,
    clearLineNodes,
    setNodes,
    removeHistoryImage,
    addHistoryImageBundle,
    setAspectRatioType,
    setActiveTool,
    selectNode,
    setCurrentShape,
    setBrushColor,
    setBrushSize,
    setBrushOpacity,
    setFillColor,
    toggleLock,
    beginRemoveBackground,
    bringToFront,
    bringForward,
    sendBackward,
    sendToBack,
    copySelectedItems,
    pasteItems,
    deleteSelectedItems,
    undo,
    redo,
  } = useSceneStore(useShallow(selector));

  const promptStoreProvider = usePrompt2DStore;
  const generationCount = promptStoreProvider((state) => state.generationCount);
  const setGenerationCount = promptStoreProvider(
    (state) => state.setGenerationCount,
  );
  const useSystemPrompt = promptStoreProvider((state) => state.useSystemPrompt);
  const referenceImages = promptStoreProvider((state) => state.referenceImages);
  const prompt = promptStoreProvider((state) => state.prompt);

  const baseImageKonvaRef = useRef<Konva.Image>({} as Konva.Image);
  const baseImageUrl = baseImageInfo?.url;
  const [pendingGenerations, setPendingGenerations] = useState<
    { id: string; count: number }[]
  >([]);

  const selectedImageModel: ImageModel | undefined =
    useSelectedImageModel(PAGE_ID);

  const selectedProvider: GenerationProvider | undefined =
    useSelectedProviderForModel(PAGE_ID, selectedImageModel?.id);

  const supportsMaskedInpainting =
    selectedImageModel?.usesInpaintingMask ?? false;

  useDeleteHotkeys({ onDelete: deleteSelectedItems });
  useUndoRedoHotkeys({ undo, redo });
  useCopyPasteHotkeys({
    onCopy: copySelectedItems,
    onPaste: pasteItems,
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
    finishRemoveBackground(nodeId, event.media_token, event.image_cdn_url);
  });

  // Create a function to use the left layer ref and download the bitmap from it
  const getMaskArrayBuffer = async (): Promise<Uint8Array> => {
    if (!stageRef.current || !baseImageKonvaRef.current) {
      console.error("Stage or left panel ref is not available");
      throw new Error("Stage or left panel or base image ref is not available");
    }

    const layer = stageRef.current
      .getLayers()
      .find((l) => l.id() === INPAINT_LAYER_ID)!;

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

  // Listen for gallery drag and drop events
  useEffect(() => {
    const handleGallery2DDrop = async (event: CustomEvent) => {
      const { item, canvasPosition } = event.detail;

      const stage = stageRef.current;
      if (!stage) {
        console.error(
          "Stage reference not available for coordinate transformation",
        );
        return;
      }
      // Transform canvas coordinates to stage coordinates
      const stagePoint = {
        x: (canvasPosition.x - stage.x()) / stage.scaleX(),
        y: (canvasPosition.y - stage.y()) / stage.scaleY(),
      };

      if (item.mediaClass === "dimensional") {
        const modelUrl = item.fullImage;
        if (!modelUrl) {
          console.error("No model URL available for 3D item");
          return;
        }
        const toastId = toast.loading(`Loading 3D model "${item.label}"…`);
        try {
          const dataUrl = await render3DModelToDataUrl(
            modelUrl,
            DEFAULT_MODEL3D_PARAMS,
          );
          const img = new globalThis.Image();
          img.onload = () => {
            const canvasDims = getAspectRatioDimensions();
            const maxDim = Math.min(canvasDims.width, canvasDims.height) * 0.25;
            const aspect = img.width / img.height;
            const displayW = Math.min(img.width, maxDim * Math.max(1, aspect));
            const displayH = displayW / aspect;
            createImageFrom3DModel(
              stagePoint.x - displayW / 2,
              stagePoint.y - displayH / 2,
              dataUrl,
              modelUrl,
              { ...DEFAULT_MODEL3D_PARAMS, nativeWidth: img.width, nativeHeight: img.height },
              displayW,
              displayH,
            );
            toast.success(`Added "${item.label}" to canvas`, { id: toastId });
          };
          img.src = dataUrl;
        } catch (err) {
          console.error("Failed to render 3D model:", err);
          toast.error(`Failed to load 3D model "${item.label}"`, {
            id: toastId,
          });
        }
        return;
      }

      const imageUrl = item.fullImage || item.thumbnail;
      if (!imageUrl) {
        console.error("No image URL available for dropped item");
        return;
      }

      createImageFromUrl(stagePoint.x, stagePoint.y, imageUrl);
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
  }, [createImageFromUrl, createImageFrom3DModel]);

  // Auto-close the 3D overlay when the editing node is no longer selected
  // (e.g. user clicks the canvas background or selects a different node).
  // We do NOT auto-open here — opening is gated behind the "Edit 3D" button
  // so the Konva transformer can work normally on selection.
  useEffect(() => {
    if (editing3DNodeId && !selectedNodeIds.includes(editing3DNodeId)) {
      setEditing3DNodeId(null);
    }
  }, [selectedNodeIds, editing3DNodeId]);

  const handle3DOverlayCommit = useCallback(
    (dataUrl: string, params: Model3DParams) => {
      if (!editing3DNodeId) return;
      const img = new globalThis.Image();
      img.onload = () => {
        updateNode(
          editing3DNodeId,
          { imageUrl: dataUrl, imageElement: img, model3dParams: params },
          true,
        );
      };
      img.src = dataUrl;
      setEditing3DNodeId(null);
      // Deselect so the auto-open useEffect doesn't immediately re-trigger
      // the overlay when the updated node re-appears in the Konva canvas.
      selectNode(null);
    },
    [editing3DNodeId, updateNode, selectNode],
  );

  // Derive a display-only node list that hides the node currently open in the
  // 3D overlay. We filter here rather than in the store so the node's data
  // (position, modelUrl, model3dParams) is fully preserved and the overlay
  // can read it via `nodes.find(...)`. The Three.js canvas sits directly on
  // top of where the Konva image would be, so removing it from the render
  // list eliminates the double-image without any visual gap.
  const displayNodes = useMemo(
    () =>
      editing3DNodeId
        ? nodes.filter((n) => n.id !== editing3DNodeId)
        : nodes,
    [nodes, editing3DNodeId],
  );

  const handleImageUpload = useCallback(async (files: File[]): Promise<void> => {
    // Determine current canvas dimensions from the store (according to aspect-ratio)
    const { width: canvasW, height: canvasH } = getAspectRatioDimensions();

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

        createImageFromFile(x, y, file, finalW, finalH);
      };
      img.src = URL.createObjectURL(file);
    }
  }, [getAspectRatioDimensions, createImageFromFile]);

  const handleTauriEnqueue = async (
    image: ImageBitmap,
    aspectRatio: EnqueueEditImageSize | undefined,
    resolution: EnqueueEditImageResolution | undefined,
    subscriberId: string,
  ) => {
    if (image === undefined) {
      console.log("image is undefined");
      return;
    }

    const api = new PromptsApi();
    const base64Bitmap = await EncodeImageBitmapToBase64(image);

    const byteString = atob(base64Bitmap);
    const mimeString = "image/png";

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const uuid = crypto.randomUUID(); // Generate a new UUID
    const file = new File([ab], `${uuid}.png`, { type: mimeString });

    const snapshotMediaToken = await api.uploadSceneSnapshot({
      screenshot: file,
    });

    if (snapshotMediaToken.data === undefined) {
      toast.error("Error: Unable to upload scene snapshot Please try again.");
      return;
    }

    console.log("useSystemPrompt", useSystemPrompt);
    console.log("Snapshot media token:", snapshotMediaToken.data);

    const request: EnqueueEditImageRequest = {
      model: selectedImageModel,
      scene_image_media_token: snapshotMediaToken.data!,
      image_media_tokens: referenceImages
        .map((image) => image.mediaToken)
        .filter((t) => t.length > 0),
      disable_system_prompt: !useSystemPrompt,
      prompt: prompt,
      image_count: generationCount,
      aspect_ratio: aspectRatio,
      image_resolution: resolution,
      frontend_caller: "image_editor",
      frontend_subscriber_id: subscriberId,
    };

    if (selectedProvider) {
      request.provider = selectedProvider;
    }

    const generateResponse = await EnqueueEditImage(request);
    console.log("generateResponse", generateResponse);
    return generateResponse;
  };

  const getCompositeCanvasFile = useCallback(async (): Promise<File | null> => {
    if (!stageRef.current || !baseImageKonvaRef.current || !baseImageBitmap) {
      return null;
    }

    const editsLayer = stageRef.current
      .getLayers()
      .find((l) => l.id() === DRAW_LAYER_ID);

    if (!editsLayer) {
      console.error("Edits layer not found");
      return null;
    }

    const rect = baseImageKonvaRef.current;
    const width = rect.width();
    const height = rect.height();

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(baseImageBitmap, 0, 0, width, height);

    const markerLayerCanvas = editsLayer.toCanvas({
      x: stageRef.current.x(),
      y: stageRef.current.y(),
      width: rect.width() * stageRef.current.scaleX(),
      height: rect.height() * stageRef.current.scaleY(),
      pixelRatio: 1 / stageRef.current.scaleX(),
    });
    const fittedMarkerCanvas = normalizeCanvas(
      markerLayerCanvas,
      width,
      height,
    );
    ctx.drawImage(fittedMarkerCanvas, 0, 0, width, height);

    const blob = await canvas.convertToBlob({ type: "image/png" });
    const uuid = crypto.randomUUID();
    return new File([blob], `${uuid}.png`, { type: "image/png" });
  }, [baseImageBitmap]);

  const handleGenerate = useCallback(
    async (
      prompt: string,
      options?: {
        aspectRatio?: string;
        resolution?: string;
        images?: RefImage[];
        selectedProvider?: GenerationProvider;
      },
    ) => {
      const editedImageToken = baseImageInfo?.mediaToken;

      if (!editedImageToken) {
        console.error("Base image is not available");
        return;
      }

      const { width, height } = getAspectRatioDimensions();
      const subscriberId: string =
        crypto?.randomUUID?.() ??
        `inpaint-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // takes snap shot and then a global variable in the engine will invoke the inference.
      const image = await captureStageEditsBitmap(
        stageRef,
        transformerRefs,
        width,
        height,
      );

      if (!image) {
        console.error("Failed to capture stage edits image");
        return;
      }

      try {
        let result;

        if (selectedImageModel?.editingIsInpainting) {
          // CASE 1 - INPAINTING (Only a few models do this!)
          const arrayBuffer = await getMaskArrayBuffer();
          const request: EnqueueImageInpaintRequest = {
            model: selectedImageModel,
            image_media_token: editedImageToken,
            mask_image_raw_bytes: arrayBuffer,
            prompt: prompt,
            image_count: generationCount,
            frontend_caller: "image_editor",
            frontend_subscriber_id: subscriberId,
          };

          if (options?.selectedProvider) {
            request.provider = options.selectedProvider;
          }

          result = await EnqueueImageInpaint(request);
        } else if (selectedImageModel?.isNanoBananaModel()) {
          // CASE 2 - NANO BANANA
          const compositeFile = await getCompositeCanvasFile();

          if (!compositeFile) {
            console.error("Failed to create composite canvas");
            return;
          }

          const api = new PromptsApi();
          const snapshotResult = await api.uploadSceneSnapshot({
            screenshot: compositeFile,
          });

          if (!snapshotResult.data) {
            console.error("Failed to upload scene snapshot");
            return;
          }

          const imgs = options?.images || [];
          const request: EnqueueEditImageRequest = {
            model: selectedImageModel,
            scene_image_media_token: snapshotResult.data,
            image_media_tokens: imgs
              .map((img) => img.mediaToken)
              .filter((t) => t.length > 0),
            prompt: prompt,
            image_count: generationCount,
            frontend_caller: "image_editor",
            frontend_subscriber_id: subscriberId,
            aspect_ratio: mapAspectRatio(options?.aspectRatio),
            image_resolution: mapResolution(options?.resolution),
          };
          if (options?.selectedProvider) {
            request.provider = options.selectedProvider;
          }
          // if (selectedImageModel?.supportsNewAspectRatio()) {
          //   request.common_aspect_ratio = commonAspectRatio;
          // }
          result = await EnqueueEditImage(request);
        } else {
          // CASE 3 - DEFAULT
          const imgs = options?.images || [];
          const request: EnqueueEditImageRequest = {
            model: selectedImageModel,
            image_media_tokens: [
              editedImageToken,
              ...imgs
                .filter((img) => img.mediaToken !== editedImageToken)
                .map((img) => img.mediaToken),
            ].filter((t) => t.length > 0),
            disable_system_prompt: true,
            prompt: prompt,
            image_count: generationCount,
            frontend_caller: "image_editor",
            frontend_subscriber_id: subscriberId,
            aspect_ratio: mapAspectRatio(options?.aspectRatio),
            image_resolution: mapResolution(options?.resolution),
          };
          if (options?.selectedProvider) {
            request.provider = options.selectedProvider;
          }
          // if (selectedImageModel?.supportsNewAspectRatio()) {
          //   request.common_aspect_ratio = commonAspectRatio;
          // }
          result = await EnqueueEditImage(request);
        }
        if (result?.status === "success") {
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
    [generationCount, getCompositeCanvasFile, selectedImageModel],
  );

  const onFitPressed = useCallback(async () => {
    // Get the stage and its container dimensions
    const stage = stageRef.current;
    if (!stage) return;

    // Get container dimensions
    const containerWidth = stage.container().offsetWidth;
    const containerHeight = stage.container().offsetHeight;

    // Get canvas dimensions from store aspect ratio
    const { width: canvasW, height: canvasH } = getAspectRatioDimensions();

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
  }, [getAspectRatioDimensions]);

  // When the model inpainting support changes, we need to auto-change the tool so it's not set to inpainting
  // Note: setActiveTool is a stable Zustand action, so we don't need it in deps
  useEffect(() => {
    if (!supportsMaskedInpainting && activeTool === "inpaint") {
      setActiveTool("select");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool, supportsMaskedInpainting]);

  // Auto-fit canvas to screen on initial load
  useEffect(() => {
    if (!baseImageBitmap) {
      return;
    }

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
  }, [baseImageBitmap]);

  // ── Stable callbacks for child components ──────────────────────────────────
  const handleSelectTool = useCallback(() => setActiveTool("select"), [setActiveTool]);

  const handleActivateShapeTool = useCallback(
    (shape: "rectangle" | "circle" | "triangle") => {
      selectNode(null);
      setCurrentShape(shape);
      setActiveTool("shape");
      selectNode(null);
    },
    [selectNode, setCurrentShape, setActiveTool],
  );

  const handlePaintBrush = useCallback(
    (hex: string, size: number, opacity: number) => {
      setActiveTool("draw");
      setBrushColor(hex);
      setBrushSize(size);
      setBrushOpacity(opacity);
    },
    [setActiveTool, setBrushColor, setBrushSize, setBrushOpacity],
  );

  const handleCanvasBackground = useCallback(
    (hex: string) => { setFillColor(hex); },
    [setFillColor],
  );

  const handleUploadImageClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.style.display = "none";
    document.body.appendChild(input);
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const imageFiles = Array.from(target.files).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (imageFiles.length > 0) handleImageUpload(imageFiles);
      }
      document.body.removeChild(input);
    };
    input.value = "";
    input.click();
  }, [handleImageUpload]);

  const handleAspectRatioChange = useCallback(
    async (ratio: string) => {
      const ratioToType = (r: string): AspectRatioType => {
        switch (r) {
          case "tall":   return AspectRatioType.PORTRAIT;
          case "wide":   return AspectRatioType.LANDSCAPE;
          case "square": return AspectRatioType.SQUARE;
          default:       return AspectRatioType.NONE;
        }
      };
      setAspectRatioType(ratioToType(ratio));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      onFitPressed();
    },
    [setAspectRatioType, onFitPressed],
  );

  const handleMenuAction = useCallback(
    async (action: string) => {
      switch (action) {
        case "LOCK":              toggleLock(selectedNodeIds); break;
        case "REMOVE_BACKGROUND": await beginRemoveBackground(selectedNodeIds); break;
        case "BRING_TO_FRONT":    bringToFront(selectedNodeIds); break;
        case "BRING_FORWARD":     bringForward(selectedNodeIds); break;
        case "SEND_BACKWARD":     sendBackward(selectedNodeIds); break;
        case "SEND_TO_BACK":      sendToBack(selectedNodeIds); break;
        case "DUPLICATE":         copySelectedItems(); pasteItems(); break;
        case "DELETE":            deleteSelectedItems(); break;
        default: break;
      }
    },
    [
      selectedNodeIds, toggleLock, beginRemoveBackground, bringToFront,
      bringForward, sendBackward, sendToBack, copySelectedItems, pasteItems,
      deleteSelectedItems,
    ],
  );

  const handleCanvasSizeChange = useCallback((width: number, height: number) => {
    canvasWidth.current = width;
    canvasHeight.current = height;
  }, []);

  // ── Memoized derived values ─────────────────────────────────────────────────
  const isLocked = useMemo(
    () =>
      selectedNodeIds.some((id) => {
        const node = nodes.find((n) => n.id === id);
        const lineNode = lineNodes.find((n) => n.id === id);
        return (node?.locked || lineNode?.locked) ?? false;
      }),
    [selectedNodeIds, nodes, lineNodes],
  );

  const selectedNodeWithModel = useMemo(() => {
    if (selectedNodeIds.length !== 1) return null;
    return nodes.find((n) => n.id === selectedNodeIds[0]) ?? null;
  }, [selectedNodeIds, nodes]);

  const editingNode = useMemo(
    () => (editing3DNodeId ? (nodes.find((n) => n.id === editing3DNodeId) ?? null) : null),
    [editing3DNodeId, nodes],
  );

  // Display image selector on launch, otherwise hide it
  // Also show loading state if info is set but image is loading
  if (!baseImageInfo || !baseImageBitmap) {
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
                setBaseImageInfo(image);
              }}
              showLoading={baseImageInfo !== null && baseImageBitmap === null}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 -z-10 bg-ui-background" />
      <div
        className={`preserve-aspect-ratio fixed right-4 top-1/2 z-10 -translate-y-1/2 transform ${
          isSelecting ? "pointer-events-none" : "pointer-events-auto"
        }`}
      >
        <HistoryStack
          onClear={() => {
            RESET();
            setPendingGenerations([]);
          }}
          imageBundles={historyImageBundles}
          pendingPlaceholders={pendingGenerations}
          blurredBackgroundUrl={baseImageUrl}
          onImageSelect={(baseImage) => {
            setBaseImageInfo(baseImage);
          }}
          onImageRemove={(baseImage) => {
            if (
              pendingGenerations.length === 0 &&
              historyImageBundles.length === 1 &&
              historyImageBundles[0].images.length <= 1
            ) {
              RESET();
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
          selectedImageToken={baseImageInfo?.mediaToken}
        />
      </div>
      <div
        className={`preserve-aspect-ratio fixed bottom-0 left-1/2 z-10 -translate-x-1/2 transform ${
          isSelecting ? "pointer-events-none" : "pointer-events-auto"
        }`}
      >
        <PromptEditor
          onAspectRatioChange={handleAspectRatioChange}
          usePrompt2DStore={promptStoreProvider}
          EncodeImageBitmapToBase64={EncodeImageBitmapToBase64}
          onGenerateClick={handleGenerate}
          onFitPressed={onFitPressed}
          isDisabled={false}
          generationCount={generationCount}
          onGenerationCountChange={setGenerationCount}
          //selectedModelInfo={selectedModelInfo}
          selectedImageModel={selectedImageModel}
          selectedProvider={selectedProvider}
        />
      </div>
      <SideToolbar
        className="fixed left-0 top-1/2 z-10 -translate-y-1/2 transform"
        onSelect={handleSelectTool}
        onActivateShapeTool={handleActivateShapeTool}
        onPaintBrush={handlePaintBrush}
        onCanvasBackground={handleCanvasBackground}
        onUploadImage={handleUploadImageClick}
        supportsMaskTool={supportsMaskedInpainting}
        activeToolId={activeTool}
        currentShape={currentShape}
      />
      <div className="relative z-0">
        <ContextMenuContainer
          onAction={(e, action) => {
            if (action === "contextMenu") {
              const hasSelection = selectedNodeIds.length > 0;
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
          onMenuAction={handleMenuAction}
          isLocked={isLocked}
        >
          <PaintSurface
            nodes={displayNodes}
            lineNodes={lineNodes}
            selectedNodeIds={selectedNodeIds}
            onCanvasSizeChange={handleCanvasSizeChange}
            fillColor={fillColor}
            activeTool={activeTool}
            brushColor={brushColor}
            brushSize={brushSize}
            onSelectionChange={setIsSelecting}
            stageRef={stageRef}
            transformerRefs={transformerRefs}
            baseImageRef={baseImageKonvaRef}
            showMaskLayer={supportsMaskedInpainting}
          />
        </ContextMenuContainer>
      </div>
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-5">
        <ClassyModelSelector
          items={CANVAS_2D_PAGE_MODEL_LIST}
          page={PAGE_ID}
          panelTitle="Select Model"
          panelClassName="min-w-[300px]"
          buttonClassName="bg-transparent p-0 text-lg hover:bg-transparent text-base-fg opacity-80 hover:opacity-100"
          showIconsInList
          triggerLabel="Model"
        />
      </div>
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
        <CostCalculatorButton modelPage={PAGE_ID} />
        <HelpMenuButton />
      </div>
      {/* Floating "Edit 3D" button — shown above the selected 3D-model node
          when the overlay is not already open. Rendered as an isolated memoized
          component so Konva-driven position updates don't re-render PageDraw. */}
      {!editing3DNodeId && selectedNodeWithModel?.modelUrl && (
        <Edit3DButton
          nodeId={selectedNodeIds[0]}
          stageRef={stageRef}
          onEdit={setEditing3DNodeId}
        />
      )}
      {editingNode && (
        <>
          <Edit3DScrubControls
            nodeId={editing3DNodeId!}
            stageRef={stageRef}
            overlayHandle={overlayHandleRef}
          />
          <Model3DOverlay
            ref={overlayHandleRef}
            node={editingNode}
            stageRef={stageRef}
            onCommit={handle3DOverlayCommit}
            onDismiss={() => setEditing3DNodeId(null)}
          />
        </>
      )}
    </>
  );
};

export default PageDraw;
