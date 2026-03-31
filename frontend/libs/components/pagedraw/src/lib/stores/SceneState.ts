import { create } from "zustand";
import { Node, NodeType } from "../Node";
import { ImageBundle, BaseSelectorImage } from "../types";
import { Model3DParams } from "../utilities/render3DModel";

// LineNode type — ordering in PageDraw is by position in drawNodes array (zIndex ignored there)
export type LineNode = {
  id: string;
  type: "line";
  points: number[];
  stroke: string;
  strokeWidth: number;
  draggable: boolean;
  opacity?: number;
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  offsetX?: number;
  offsetY?: number;
  locked?: boolean;
  globalCompositeOperation?: string;
  zIndex?: number; // Used by PageEdit for z-ordering; ignored in PageDraw
};

// Add this enum at the top of the file with other types
export enum AspectRatioType {
  PORTRAIT = "2:3", // 683 x 1024
  LANDSCAPE = "3:2", // 1024 x 683
  SQUARE = "1:1", // 1024 x 1024
  NONE = "none", // No aspect ratio constraint
}

// Logic to remove background from image nodes would go here
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error("Failed to convert file to base64."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file."));
    };

    reader.readAsDataURL(file);
  });
};

export type ActiveTool =
  | "select"
  | "draw"
  | "inpaint"
  | "eraser"
  | "backgroundColor"
  | "shape";

// Serialized shape node for history storage
type SerializedNodeData = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  type: NodeType;
  stroke: string;
  strokeWidth: number;
  draggable: boolean;
  imageUrl?: string;
  imageFile?: File;
  backgroundColor?: string;
  rotation: number;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  locked: boolean;
  modelUrl?: string;
  model3dParams?: Model3DParams;
};

// A history draw node is either a serialized shape or an inline LineNode
type SerializedDrawNode = SerializedNodeData | LineNode;

interface HistoryNodeData {
  drawNodes: SerializedDrawNode[];
  inpaintLineNodes: LineNode[];
}

export interface SceneState {
  /**
   * All draw-layer items in render order (index 0 = bottom, last = top).
   * Contains shapes (Node) interleaved with draw/eraser lines (LineNode).
   * Inpaint lines are kept separately in inpaintLineNodes.
   */
  drawNodes: (Node | LineNode)[];
  /**
   * Inpaint mask strokes — rendered in their own Konva layer, not z-ordered
   * against drawNodes.
   */
  inpaintLineNodes: LineNode[];
  selectedNodeIds: string[];
  historyImageNodeMap: Map<BaseSelectorImage, HistoryNodeData>;

  // Clipboard
  clipboard: (Node | LineNode)[];

  // Toolbar state
  activeTool: ActiveTool;
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  fillColor: string;
  currentShape: "rectangle" | "circle" | "triangle" | null;
  shapeColor: string;

  // Inpaint-specific state
  inpaintOperation: "add" | "minus";
  inpaintBrushSize: number;

  // Cursor state
  cursorPosition: { x: number; y: number } | null;
  cursorVisible: boolean;

  // Actions
  addNode: (node: Node) => void;
  removeNode: (id: string, shouldSaveState?: boolean) => void;
  updateNode: (
    id: string,
    updates: Partial<Node>,
    shouldSaveState: boolean,
  ) => void;
  selectNode: (id: string | null, isMultiSelect?: boolean) => void;

  moveNode: (
    id: string,
    x: number,
    y: number,
    dx?: number,
    dy?: number,
    shouldSaveState?: boolean,
  ) => void;

  // Batch operations
  setNodes: (nodes: Node[]) => void;

  // Node creation helpers
  createRectangle: (
    x: number,
    y: number,
    width?: number,
    height?: number,
    fill?: string,
  ) => void;
  createCircle: (x: number, y: number, radius?: number, fill?: string) => void;

  createTriangle: (
    x: number,
    y: number,
    width?: number,
    height?: number,
    fill?: string,
  ) => void;
  createImage: (
    x: number,
    y: number,
    source: string | File,
    width?: number,
    height?: number,
  ) => void;

  // History management
  history: { drawNodes: SerializedDrawNode[]; inpaintLineNodes: LineNode[] }[];
  historyIndex: number;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  saveState: () => void;

  // Line node actions
  addLineNode: (lineNode: LineNode, shouldSaveState: boolean) => void;
  removeLineNode: (id: string, shouldSaveState?: boolean) => void;
  updateLineNode: (
    id: string,
    updates: Partial<LineNode>,
    shouldSaveState: boolean,
  ) => void;
  moveLineNode: (
    id: string,
    dx: number,
    dy: number,
    shouldSaveState?: boolean,
  ) => void;
  clearLineNodes: () => void;

  // Add a specific method for file uploads
  createImageFromFile: (
    x: number,
    y: number,
    file: File,
    width?: number,
    height?: number,
  ) => void;

  // Add method for URL-based images
  createImageFromUrl: (
    x: number,
    y: number,
    url: string,
    width?: number,
    height?: number,
  ) => void;

  // Create an image node backed by a 3D model (dataUrl is the initial render)
  createImageFrom3DModel: (
    x: number,
    y: number,
    renderedDataUrl: string,
    modelUrl: string,
    params: Model3DParams,
    width?: number,
    height?: number,
  ) => void;

  // Action for deleting selected items
  deleteSelectedItems: () => void;
  RESET: () => void;

  // Clipboard actions
  copySelectedItems: () => void;
  pasteItems: () => void;

  // Toolbar actions
  setActiveTool: (tool: ActiveTool) => void;
  setBrushColor: (color: string) => void;
  setBrushOpacity: (opacity: number) => void;
  setBrushSize: (size: number) => void;
  setFillColor: (color: string) => void;

  // Inpaint actions
  setInpaintOperation: (op: "add" | "minus") => void;
  setInpaintBrushSize: (size: number) => void;

  // Shape tool actions
  setCurrentShape: (shape: "rectangle" | "circle" | "triangle") => void;
  setShapeColor: (color: string) => void;

  // Cursor actions
  setCursorPosition: (position: { x: number; y: number } | null) => void;
  setCursorVisible: (visible: boolean) => void;

  // Scene save/load actions
  exportSceneAsJson: () => Promise<string>;
  importSceneFromJson: (jsonString: string) => boolean;
  saveSceneToFile: () => Promise<void>;
  loadSceneFromFile: (file: File) => Promise<boolean>;

  serializeSceneToString: () => Promise<string>;
  loadSceneFromString: (jsonString: string) => boolean;

  // Layer management functions (no-op normalizeZIndices kept for API compat)
  normalizeZIndices: () => void;
  bringToFront: (nodeIds: string[]) => void;
  sendToBack: (nodeIds: string[]) => void;
  bringForward: (nodeIds: string[]) => void;
  sendBackward: (nodeIds: string[]) => void;

  // Start background removal — returns {base64, nodeId} for the caller to enqueue via adapter
  beginRemoveBackground: (nodeIds: string[]) => Promise<{ base64: string; nodeId: string } | null>;

  // Finish background removal (handoff back from the platform event)
  finishRemoveBackground: (
    nodeId: string,
    mediaToken: string,
    imageCdnUrl: string,
  ) => Promise<void>;

  // Pending AI generation placeholders (shown in HistoryStack)
  pendingGenerations: { id: string; count: number }[];
  addPendingGeneration: (id: string, count: number) => void;
  resolvePendingGeneration: (id: string) => void;
  clearPendingGenerations: () => void;

  toggleLock: (nodeIds: string[]) => void;

  aspectRatioType: AspectRatioType;
  setAspectRatioType: (type: AspectRatioType) => void;
  getAspectRatioDimensions: () => { width: number; height: number };

  historyImageBundles: ImageBundle[];
  clearHistoryImages: () => void;
  addHistoryImageBundle: (bundle: ImageBundle) => void;
  removeHistoryImage: (image: BaseSelectorImage) => void;

  // Base image state
  baseImageInfo: BaseSelectorImage | null;
  baseImageBitmap: HTMLImageElement | null;
  setBaseImageInfo: (image: BaseSelectorImage | null) => void;
}

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Add a flag to prevent saving state during restoration
let isRestoring = false;

export const useSceneStore = create<SceneState>((set, get, store) => ({
  // Initial state
  drawNodes: [],
  inpaintLineNodes: [],
  selectedNodeIds: [],
  historyImageNodeMap: new Map<BaseSelectorImage, HistoryNodeData>(),
  clipboard: [],
  history: [],
  historyIndex: -1,

  activeTool: "select",
  brushColor: "#000000",
  brushSize: 5,
  brushOpacity: 1,
  fillColor: "white",
  currentShape: null,
  shapeColor: "#4d79b3",

  inpaintOperation: "add",
  inpaintBrushSize: 30,

  // Cursor initial state
  cursorPosition: null,
  cursorVisible: false,

  // Base image initial state
  baseImageInfo: null,
  baseImageBitmap: null,

  // History stack state
  historyImageBundles: [],

  // Pending AI generations
  pendingGenerations: [],

  aspectRatioType: AspectRatioType.NONE,

  // Actions
  addNode: (node: Node) => {
    set((state) => ({
      drawNodes: [...state.drawNodes, node],
    }));
    get().saveState();
  },

  removeNode: (id: string, shouldSaveState: boolean = true) => {
    set((state) => ({
      drawNodes: state.drawNodes.filter((n) => n.id !== id),
      selectedNodeIds: state.selectedNodeIds.filter((nodeId) => nodeId !== id),
    }));
    if (shouldSaveState) {
      get().saveState();
    }
  },

  updateNode: (
    id: string,
    updates: Partial<Node>,
    shouldSaveState: boolean = true,
  ) => {
    set((state) => ({
      drawNodes: state.drawNodes.map((n) => {
        if (n.id === id && n instanceof Node) {
          return new Node({ ...n, ...updates });
        }
        return n;
      }),
    }));
    if (shouldSaveState && !isRestoring) {
      get().saveState();
    }
  },

  selectNode: (id: string | null, isMultiSelect = false) => {
    set((state) => {
      if (!id) {
        return { selectedNodeIds: [] };
      }

      if (isMultiSelect) {
        if (state.selectedNodeIds.includes(id)) {
          return {
            selectedNodeIds: state.selectedNodeIds.filter(
              (nodeId) => nodeId !== id,
            ),
          };
        }
        return {
          selectedNodeIds: [...state.selectedNodeIds, id],
        };
      }

      return { selectedNodeIds: [id] };
    });
  },

  moveNode: (
    id: string,
    x: number,
    y: number,
    dx?: number,
    dy?: number,
    shouldSaveState: boolean = false,
  ) => {
    set((state) => ({
      drawNodes: state.drawNodes.map((n) => {
        if (!(n instanceof Node)) return n;
        if (n.id === id) {
          n.setPosition(x, y);
          return n;
        }
        if (
          state.selectedNodeIds.includes(n.id) &&
          dx !== undefined &&
          dy !== undefined
        ) {
          n.setPosition(n.x + dx, n.y + dy);
          return n;
        }
        return n;
      }),
    }));
    if (shouldSaveState) {
      get().saveState();
    }
  },

  setNodes: (nodes: Node[]) => {
    set((state) => ({
      // Keep existing line nodes in place, replace all shape nodes
      drawNodes: [
        ...state.drawNodes.filter((n) => n.type === "line"),
        ...nodes,
      ],
    }));
    get().saveState();
  },

  // Node creation helpers
  createRectangle: (
    x: number,
    y: number,
    width = 100,
    height = 100,
    fill?: string,
  ) => {
    const finalFill = fill || get().shapeColor;
    const node = new Node({
      id: generateId(),
      type: "rectangle",
      x,
      y,
      width,
      height,
      fill: finalFill,
      stroke: "#444",
      strokeWidth: 2,
      draggable: true,
    });
    get().addNode(node);
    get().setActiveTool("select");
  },

  createCircle: (x: number, y: number, radius = 50, fill?: string) => {
    const finalFill = fill || get().shapeColor;
    const node = new Node({
      id: generateId(),
      type: "circle",
      x,
      y,
      width: radius * 2,
      height: radius * 2,
      fill: finalFill,
      stroke: "#333",
      strokeWidth: 2,
      draggable: true,
    });
    get().addNode(node);
    get().setActiveTool("select");
  },

  createTriangle: (
    x: number,
    y: number,
    width = 100,
    height = 100,
    fill?: string,
  ) => {
    const finalFill = fill || get().shapeColor;
    const node = new Node({
      id: generateId(),
      type: "triangle",
      x,
      y,
      width,
      height,
      fill: finalFill,
      stroke: "#555",
      strokeWidth: 2,
      draggable: true,
    });
    get().addNode(node);
    get().setActiveTool("select");
  },

  // History management
  saveState: () => {
    if (isRestoring) return;

    set((state) => {
      const serializableState: {
        drawNodes: SerializedDrawNode[];
        inpaintLineNodes: LineNode[];
      } = {
        drawNodes: state.drawNodes.map((n) => {
          if (n instanceof Node) {
            return {
              id: n.id,
              x: n.x,
              y: n.y,
              width: n.width,
              height: n.height,
              fill: n.fill,
              type: n.type,
              stroke: n.stroke,
              strokeWidth: n.strokeWidth,
              draggable: n.draggable,
              imageUrl: n.imageUrl,
              imageFile: n.imageFile,
              backgroundColor: n.backgroundColor,
              rotation: n.rotation || 0,
              scaleX: n.scaleX || 1,
              scaleY: n.scaleY || 1,
              offsetX: n.offsetX || 0,
              offsetY: n.offsetY || 0,
              locked: n.locked || false,
              modelUrl: n.modelUrl,
              model3dParams: n.model3dParams,
            } as SerializedNodeData;
          }
          // LineNode — plain object, deep copy
          return JSON.parse(JSON.stringify(n)) as LineNode;
        }),
        inpaintLineNodes: JSON.parse(JSON.stringify(state.inpaintLineNodes)),
      };

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(serializableState);

      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  undo: async () => {
    const state = get();
    if (state.historyIndex < 0) return;

    const newIndex = state.historyIndex - 1;

    if (newIndex < 0) {
      set({
        drawNodes: [],
        inpaintLineNodes: [],
        selectedNodeIds: [],
        historyIndex: newIndex,
      });
      return;
    }

    const previousState = state.history[newIndex];

    isRestoring = true;

    const restoredDrawNodes = await Promise.all(
      previousState.drawNodes.map(async (nodeData) => {
        // LineNode — plain object, no image loading needed
        if (nodeData.type === "line") {
          return nodeData as LineNode;
        }

        // Shape node
        const shapeData = nodeData as SerializedNodeData;
        const node = new Node(shapeData);

        if (node.type === "image" && (node.imageUrl || node.imageFile)) {
          try {
            if (node.imageUrl) {
              await node.setImageFromUrl(node.imageUrl);
            } else if (node.imageFile) {
              await node.setImageFromFile(node.imageFile);
            }
          } catch (error) {
            console.error("Failed to restore image:", error);
          }
        }

        return node;
      }),
    );

    isRestoring = false;

    set({
      drawNodes: restoredDrawNodes,
      inpaintLineNodes: previousState.inpaintLineNodes,
      selectedNodeIds: [],
      historyIndex: newIndex,
    });
  },

  redo: async () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;

    const newIndex = state.historyIndex + 1;
    const nextState = state.history[newIndex];

    isRestoring = true;

    const restoredDrawNodes = await Promise.all(
      nextState.drawNodes.map(async (nodeData) => {
        if (nodeData.type === "line") {
          return nodeData as LineNode;
        }

        const shapeData = nodeData as SerializedNodeData;
        const node = new Node(shapeData);

        if (node.type === "image" && (node.imageUrl || node.imageFile)) {
          try {
            if (node.imageUrl) {
              await node.setImageFromUrl(node.imageUrl);
            } else if (node.imageFile) {
              await node.setImageFromFile(node.imageFile);
            }
          } catch (error) {
            console.error("Failed to restore image:", error);
          }
        }

        return node;
      }),
    );

    isRestoring = false;

    set({
      drawNodes: restoredDrawNodes,
      inpaintLineNodes: nextState.inpaintLineNodes,
      selectedNodeIds: [],
      historyIndex: newIndex,
    });
  },

  // Line node actions — route by id prefix
  addLineNode: (lineNode: LineNode, shouldSaveState: boolean = true) => {
    if (lineNode.id.startsWith("line-inpaint")) {
      set((state) => ({
        inpaintLineNodes: [...state.inpaintLineNodes, lineNode],
      }));
    } else {
      set((state) => ({
        drawNodes: [...state.drawNodes, lineNode],
      }));
    }
    if (shouldSaveState) {
      get().saveState();
    }
  },

  removeLineNode: (id: string, shouldSaveState: boolean = true) => {
    if (id.startsWith("line-inpaint")) {
      set((state) => ({
        inpaintLineNodes: state.inpaintLineNodes.filter((n) => n.id !== id),
        selectedNodeIds: state.selectedNodeIds.filter(
          (nodeId) => nodeId !== id,
        ),
      }));
    } else {
      set((state) => ({
        drawNodes: state.drawNodes.filter((n) => n.id !== id),
        selectedNodeIds: state.selectedNodeIds.filter(
          (nodeId) => nodeId !== id,
        ),
      }));
    }
    if (shouldSaveState) {
      get().saveState();
    }
  },

  updateLineNode: (
    id: string,
    updates: Partial<LineNode>,
    shouldSaveState: boolean = true,
  ) => {
    if (id.startsWith("line-inpaint")) {
      set((state) => ({
        inpaintLineNodes: state.inpaintLineNodes.map((n) =>
          n.id === id ? { ...n, ...updates } : n,
        ),
      }));
    } else {
      set((state) => ({
        drawNodes: state.drawNodes.map((n) =>
          n.id === id ? ({ ...n, ...updates } as Node | LineNode) : n,
        ),
      }));
    }
    if (shouldSaveState) {
      get().saveState();
    }
  },

  moveLineNode: (
    id: string,
    dx: number,
    dy: number,
    shouldSaveState: boolean = false,
  ) => {
    if (id.startsWith("line-inpaint")) {
      set((state) => ({
        inpaintLineNodes: state.inpaintLineNodes.map((n) =>
          n.id === id ? { ...n, x: (n.x ?? 0) + dx, y: (n.y ?? 0) + dy } : n,
        ),
      }));
    } else {
      set((state) => ({
        drawNodes: state.drawNodes.map((n) => {
          if (n.id !== id || n.type !== "line") return n;
          const ln = n as LineNode;
          return { ...ln, x: (ln.x ?? 0) + dx, y: (ln.y ?? 0) + dy };
        }),
      }));
    }
    if (shouldSaveState) {
      get().saveState();
    }
  },

  // Add a specific method for file uploads
  createImageFromFile: (
    x: number,
    y: number,
    file: File,
    width?: number,
    height?: number,
  ) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          const finalWidth = width || Math.min(img.naturalWidth, 512);
          const finalHeight = height || finalWidth / aspectRatio;
          get().createImage(x, y, file, finalWidth, finalHeight);
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  },

  // Add method for URL-based images
  createImageFromUrl: async (
    x: number,
    y: number,
    url: string,
    width?: number,
    height?: number,
  ) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const filename = url.split("/").pop() || "image.png";
      const file = new File([blob], filename, { type: blob.type });
      get().createImageFromFile(x, y, file, width, height);
    } catch (error) {
      console.error("Error loading image from URL:", url, error);
    }
  },

  // Create an image node backed by a 3D model
  createImageFrom3DModel: (
    x: number,
    y: number,
    renderedDataUrl: string,
    modelUrl: string,
    params: Model3DParams,
    width = 512,
    height = 512,
  ) => {
    const nodeId = generateId();
    const node = new Node({
      id: nodeId,
      type: "image",
      x,
      y,
      width,
      height,
      fill: "transparent",
      stroke: "#333",
      strokeWidth: 2,
      draggable: true,
      imageUrl: renderedDataUrl,
      modelUrl,
      model3dParams: params,
    });
    node
      .setImageFromUrl(renderedDataUrl)
      .then(() => {
        get().addNode(node);
      })
      .catch((error) => console.error("Error loading 3D model render:", error));
  },

  createImage: (
    x: number,
    y: number,
    source: string | File,
    width = 200,
    height = 200,
  ) => {
    const nodeId = generateId();
    const node = new Node({
      id: nodeId,
      type: "image",
      x,
      y,
      width,
      height,
      fill: "transparent",
      stroke: "#333",
      strokeWidth: 2,
      draggable: true,
      imageUrl: typeof source === "string" ? source : undefined,
      imageFile: typeof source === "string" ? undefined : source,
    });

    node
      .setImage(source)
      .then(() => {
        get().addNode(node);
      })
      .catch((error) => console.error("Error loading image:", error));
  },

  // Action for deleting selected items
  deleteSelectedItems: () => {
    const initialSelectedIds = [...get().selectedNodeIds];

    if (initialSelectedIds.length > 0) {
      set((state) => ({
        drawNodes: state.drawNodes.filter(
          (n) => !initialSelectedIds.includes(n.id),
        ),
        inpaintLineNodes: state.inpaintLineNodes.filter(
          (n) => !initialSelectedIds.includes(n.id),
        ),
        selectedNodeIds: [],
      }));

      get().saveState();
    }
  },

  RESET: () => {
    set({ ...store.getInitialState(), pendingGenerations: [] });
  },

  // Clipboard actions
  copySelectedItems: () => {
    set((state) => {
      const selected = [
        ...state.drawNodes,
        ...state.inpaintLineNodes,
      ].filter((n) => state.selectedNodeIds.includes(n.id));

      const copied = selected.map((item) => {
        if (item instanceof Node) {
          return new Node({ ...item });
        }
        return JSON.parse(JSON.stringify(item)) as LineNode;
      });

      return { clipboard: copied };
    });
  },

  pasteItems: () => {
    const { clipboard } = get();
    if (clipboard.length === 0) return;

    const newPastedItemIds: string[] = [];
    const offset = 20;

    const nodesToAdd: Node[] = [];
    const lineNodesToAdd: LineNode[] = [];

    clipboard.forEach((item) => {
      const newId = generateId();
      newPastedItemIds.push(newId);

      if (item instanceof Node) {
        const pastedNodeData = {
          ...(item as Node),
          id: newId,
          x: (item as Node).x + offset,
          y: (item as Node).y + offset,
        };
        const newNodeInstance = new Node(pastedNodeData);

        if (
          newNodeInstance.type === "image" &&
          (newNodeInstance.imageUrl || newNodeInstance.imageFile)
        ) {
          const source = newNodeInstance.imageUrl || newNodeInstance.imageFile;
          if (source) {
            newNodeInstance
              .setImage(source)
              .then(() => {
                if (get().drawNodes.find((n) => n.id === newId)) {
                  const {
                    id,
                    x,
                    y,
                    width,
                    height,
                    fill,
                    stroke,
                    strokeWidth,
                    draggable,
                    imageUrl,
                    imageFile,
                    rotation,
                    scaleX,
                    scaleY,
                    offsetX,
                    offsetY,
                  } = newNodeInstance;
                  get().updateNode(
                    id,
                    {
                      x,
                      y,
                      width,
                      height,
                      fill,
                      stroke,
                      strokeWidth,
                      draggable,
                      imageUrl,
                      imageFile,
                      rotation,
                      scaleX,
                      scaleY,
                      offsetX,
                      offsetY,
                    },
                    false,
                  );
                }
              })
              .catch((error) => {
                console.error(
                  `Failed to load image for pasted node ${newId}:`,
                  error,
                );
              });
          }
        }
        nodesToAdd.push(newNodeInstance);
      } else if (item.type === "line") {
        const lineNode = item as LineNode;
        const pastedLineNode: LineNode = {
          ...lineNode,
          id: newId,
          points: lineNode.points.map((point, index) =>
            index % 2 === 0 ? point + offset : point + offset,
          ),
          x: lineNode.x !== undefined ? lineNode.x + offset : undefined,
          y: lineNode.y !== undefined ? lineNode.y + offset : undefined,
        };
        lineNodesToAdd.push(pastedLineNode);
      }
    });

    set((state) => ({
      drawNodes: [
        ...state.drawNodes,
        ...nodesToAdd,
        ...lineNodesToAdd,
      ],
      selectedNodeIds: newPastedItemIds,
    }));

    get().saveState();
  },

  // Toolbar actions
  setActiveTool: (tool: ActiveTool) => set({ activeTool: tool }),
  setBrushColor: (color: string) => set({ brushColor: color }),
  setBrushSize: (size: number) => set({ brushSize: size }),
  setFillColor: (color: string) => set({ fillColor: color }),
  setBrushOpacity: (opacity: number) => set({ brushOpacity: opacity }),

  // Inpaint actions
  setInpaintOperation: (op: "add" | "minus") => set({ inpaintOperation: op }),
  setInpaintBrushSize: (size: number) => set({ inpaintBrushSize: size }),

  // Shape tool actions
  setCurrentShape: (shape: "rectangle" | "circle" | "triangle") =>
    set({ currentShape: shape }),
  setShapeColor: (color: string) => set({ shapeColor: color }),

  // Cursor actions
  setCursorPosition: (position: { x: number; y: number } | null) =>
    set({ cursorPosition: position }),
  setCursorVisible: (visible: boolean) => set({ cursorVisible: visible }),

  // Scene save/load actions
  exportSceneAsJson: async () => {
    const state = get();

    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    const processedDrawNodes = await Promise.all(
      state.drawNodes.map(async (n) => {
        if (n.type === "line") {
          return JSON.parse(JSON.stringify(n));
        }

        const node = n as Node;
        const nodeData = {
          id: node.id,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          fill: node.fill,
          type: node.type,
          stroke: node.stroke,
          strokeWidth: node.strokeWidth,
          draggable: node.draggable,
          imageUrl: node.imageUrl,
          backgroundColor: node.backgroundColor,
          rotation: node.rotation || 0,
          scaleX: node.scaleX || 1,
          scaleY: node.scaleY || 1,
          offsetX: node.offsetX || 0,
          offsetY: node.offsetY || 0,
          locked: node.locked || false,
        };

        if (node.imageFile && node.imageFile instanceof File) {
          try {
            const base64 = await fileToBase64(node.imageFile);
            return { ...nodeData, imageDataUrl: base64 };
          } catch (error) {
            console.error("Failed to convert image file to base64:", error);
          }
        }

        return nodeData;
      }),
    );

    const sceneData = {
      drawNodes: processedDrawNodes,
      inpaintLineNodes: JSON.parse(JSON.stringify(state.inpaintLineNodes)),
      brushColor: state.brushColor,
      brushSize: state.brushSize,
      fillColor: state.fillColor,
      aspectRatioType: state.aspectRatioType,
      version: "2.0",
    };

    return JSON.stringify(sceneData, null, 2);
  },

  importSceneFromJson: (jsonString: string) => {
    try {
      const sceneData = JSON.parse(jsonString);

      isRestoring = true;

      const base64ToFile = (base64: string, filename: string): File => {
        const arr = base64.split(",");
        const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
      };

      const restoredDrawNodes = (sceneData.drawNodes || []).map(
        (nodeData: SerializedNodeData & { imageDataUrl?: string } | LineNode) => {
          if (nodeData.type === "line") {
            return nodeData as LineNode;
          }

          const shapeData = nodeData as SerializedNodeData & { imageDataUrl?: string };
          const node = new Node(shapeData);

          if (node.type === "image") {
            const loadImage = async () => {
              try {
                if (shapeData.imageDataUrl) {
                  const file = base64ToFile(
                    shapeData.imageDataUrl,
                    `restored-image-${node.id}.png`,
                  );
                  await node.setImageFromFile(file);
                } else if (node.imageUrl) {
                  await node.setImageFromUrl(node.imageUrl);
                }
                get().updateNode(node.id, node, false);
              } catch (error) {
                console.error("Failed to restore image:", error);
              }
            };
            loadImage();
          }

          return node;
        },
      );

      set({
        drawNodes: restoredDrawNodes,
        inpaintLineNodes: sceneData.inpaintLineNodes || [],
        selectedNodeIds: [],
        brushColor: sceneData.brushColor || "#000000",
        brushSize: sceneData.brushSize || 5,
        fillColor: sceneData.fillColor || "white",
        aspectRatioType: sceneData.aspectRatioType || AspectRatioType.NONE,
      });

      isRestoring = false;
      get().saveState();

      return true;
    } catch (error) {
      console.error("Failed to import scene:", error);
      isRestoring = false;
      return false;
    }
  },

  saveSceneToFile: async () => {
    const jsonString = await get().exportSceneAsJson();
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `mirai-scene-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  },

  loadSceneFromFile: async (file: File) => {
    try {
      const text = await file.text();
      return get().importSceneFromJson(text);
    } catch (error) {
      console.error("Failed to load scene from file:", error);
      return false;
    }
  },

  serializeSceneToString: async (): Promise<string> => {
    return get().exportSceneAsJson();
  },
  loadSceneFromString: (jsonString: string): boolean => {
    return get().importSceneFromJson(jsonString);
  },

  // No-op: ordering is now managed by position in drawNodes array
  normalizeZIndices: () => {},

  // Layer management — all O(n) operations on drawNodes array

  bringToFront: (nodeIds: string[]) => {
    set((state) => {
      if (nodeIds.length === 0) return state;
      const others = state.drawNodes.filter((n) => !nodeIds.includes(n.id));
      const selected = state.drawNodes.filter((n) => nodeIds.includes(n.id));
      return { drawNodes: [...others, ...selected] };
    });
    get().saveState();
  },

  sendToBack: (nodeIds: string[]) => {
    set((state) => {
      if (nodeIds.length === 0) return state;
      const others = state.drawNodes.filter((n) => !nodeIds.includes(n.id));
      const selected = state.drawNodes.filter((n) => nodeIds.includes(n.id));
      return { drawNodes: [...selected, ...others] };
    });
    get().saveState();
  },

  bringForward: (nodeIds: string[]) => {
    set((state) => {
      if (nodeIds.length === 0) return state;
      const order = [...state.drawNodes];
      // Iterate backward so higher-index selected items move first (avoids double-move)
      for (let i = order.length - 2; i >= 0; i--) {
        if (
          nodeIds.includes(order[i].id) &&
          !nodeIds.includes(order[i + 1].id)
        ) {
          [order[i], order[i + 1]] = [order[i + 1], order[i]];
        }
      }
      return { drawNodes: order };
    });
    get().saveState();
  },

  sendBackward: (nodeIds: string[]) => {
    set((state) => {
      if (nodeIds.length === 0) return state;
      const order = [...state.drawNodes];
      // Iterate forward so lower-index selected items move first (avoids double-move)
      for (let i = 1; i < order.length; i++) {
        if (
          nodeIds.includes(order[i].id) &&
          !nodeIds.includes(order[i - 1].id)
        ) {
          [order[i], order[i - 1]] = [order[i - 1], order[i]];
        }
      }
      return { drawNodes: order };
    });
    get().saveState();
  },

  beginRemoveBackground: async (nodeIds: string[]) => {
    const drawNodes = get().drawNodes;
    const firstNode = drawNodes.find(
      (n) => nodeIds.includes(n.id) && n instanceof Node && (n as Node).type === "image",
    ) as Node | undefined;

    if (!firstNode || !firstNode.imageFile) {
      return null;
    }
    try {
      const base64Image = await convertFileToBase64(firstNode.imageFile);
      return { base64: base64Image, nodeId: firstNode.id };
    } catch (error) {
      console.error("Error preparing background removal:", error);
      return null;
    }
  },

  finishRemoveBackground: async (
    nodeId: string,
    mediaToken: string,
    imageCdnUrl: string,
  ) => {
    if (!nodeId || !mediaToken || !imageCdnUrl) {
      return;
    }
    const firstNode = get().drawNodes.find(
      (n) => n.id === nodeId && n instanceof Node && (n as Node).type === "image",
    ) as Node | undefined;

    if (!firstNode || !firstNode.imageFile) {
      return;
    }
    try {
      const updatedNode = new Node({
        ...firstNode,
        imageUrl: imageCdnUrl,
      });
      await updatedNode.setImageFromUrl(imageCdnUrl);
      set((state) => ({
        drawNodes: state.drawNodes.map((n) => {
          if (n.id === firstNode.id) return updatedNode;
          return n;
        }),
      }));
      get().saveState();
    } catch (error) {
      console.error("Error completing background removal:", error);
    }
  },

  toggleLock: (nodeIds: string[]) => {
    set((state) => ({
      drawNodes: state.drawNodes.map((n) => {
        if (!nodeIds.includes(n.id)) return n;
        if (n instanceof Node) {
          return new Node({ ...n, locked: !n.locked });
        }
        // LineNode
        return { ...n, locked: !(n as LineNode).locked };
      }),
      inpaintLineNodes: state.inpaintLineNodes.map((n) => {
        if (!nodeIds.includes(n.id)) return n;
        return { ...n, locked: !n.locked };
      }),
    }));
    get().saveState();
  },

  setAspectRatioType: (type: AspectRatioType) => {
    set({ aspectRatioType: type });
    get().saveState();
  },

  getAspectRatioDimensions: () => {
    const bitmap = get().baseImageBitmap;

    if (bitmap) {
      return { width: bitmap.width, height: bitmap.height };
    }

    const info = get().baseImageInfo;
    if (info?.isBlankCanvas && info.blankCanvasWidth && info.blankCanvasHeight) {
      return { width: info.blankCanvasWidth, height: info.blankCanvasHeight };
    }

    const { aspectRatioType } = get();
    switch (aspectRatioType) {
      case AspectRatioType.PORTRAIT:
        return { width: 683, height: 1024 };
      case AspectRatioType.LANDSCAPE:
        return { width: 1024, height: 683 };
      case AspectRatioType.SQUARE:
        return { width: 1024, height: 1024 };
      default:
        return { width: 1024, height: 683 };
    }
  },

  setBaseImageInfo: (image: BaseSelectorImage | null) => {
    if (!image) {
      set({ baseImageInfo: null });
      return;
    }

    const currentBaseImage = get().baseImageInfo;
    if (currentBaseImage) {
      get().historyImageNodeMap.set(currentBaseImage, {
        drawNodes: get().drawNodes.map((n) => {
          if (n instanceof Node) {
            return {
              id: n.id,
              x: n.x,
              y: n.y,
              width: n.width,
              height: n.height,
              fill: n.fill,
              type: n.type,
              stroke: n.stroke,
              strokeWidth: n.strokeWidth,
              draggable: n.draggable,
              imageUrl: n.imageUrl,
              imageFile: n.imageFile,
              backgroundColor: n.backgroundColor,
              rotation: n.rotation || 0,
              scaleX: n.scaleX || 1,
              scaleY: n.scaleY || 1,
              offsetX: n.offsetX || 0,
              offsetY: n.offsetY || 0,
              locked: n.locked || false,
              modelUrl: n.modelUrl,
              model3dParams: n.model3dParams,
            } as SerializedNodeData;
          }
          return JSON.parse(JSON.stringify(n)) as LineNode;
        }),
        inpaintLineNodes: JSON.parse(JSON.stringify(get().inpaintLineNodes)),
      });
    }

    const applyImageNodes = (bitmap: HTMLImageElement | null) => {
      const previousNodeData = get().historyImageNodeMap.get(image);
      if (previousNodeData) {
        const restoredDrawNodes = previousNodeData.drawNodes.map((nodeData) => {
          if (nodeData.type === "line") return nodeData as LineNode;
          const node = new Node(nodeData as SerializedNodeData);
          if (node.type === "image" && (node.imageUrl || node.imageFile)) {
            const src = node.imageUrl || node.imageFile!;
            node.setImage(src).catch((e) =>
              console.error("Failed to restore image in base image switch:", e),
            );
          }
          return node;
        });
        set({ drawNodes: restoredDrawNodes, inpaintLineNodes: previousNodeData.inpaintLineNodes, baseImageBitmap: bitmap });
      } else {
        set({ drawNodes: [], inpaintLineNodes: [], baseImageBitmap: bitmap });
      }
    };

    if (image.isBlankCanvas) {
      set({ baseImageInfo: image });
      applyImageNodes(null);
      return;
    }

    set({ baseImageInfo: image });

    const imgBitmap = new Image();
    imgBitmap.onload = () => {
      applyImageNodes(imgBitmap);
    };
    imgBitmap.onerror = (event) => {
      console.error("Failed to load base image, discarding", event);
      set({ baseImageInfo: null, baseImageBitmap: null });
      imgBitmap.onload = null;
      imgBitmap.onerror = null;
    };
    imgBitmap.crossOrigin = "anonymous";
    const isDataUrl =
      typeof image.url === "string" && image.url.startsWith("data:");
    imgBitmap.src = isDataUrl ? image.url : image.url + "?basecanvasimg";
  },

  clearLineNodes() {
    set((state) => ({
      drawNodes: state.drawNodes.filter((n) => n.type !== "line"),
      inpaintLineNodes: [],
    }));
  },

  clearHistoryImages: () => {
    set({
      historyImageBundles: [],
      historyImageNodeMap: new Map<BaseSelectorImage, HistoryNodeData>(),
    });
  },

  addHistoryImageBundle(bundle) {
    set((state) => ({
      historyImageBundles: [...state.historyImageBundles, bundle],
    }));
  },

  removeHistoryImage(image) {
    console.log("Removing history image:", image);
    set((state) => {
      state.historyImageNodeMap.delete(image);

      const updatedBundles = state.historyImageBundles
        .map((bundle) => ({
          ...bundle,
          images: bundle.images.filter(
            (img) => img.mediaToken !== image.mediaToken,
          ),
        }))
        .filter((bundle) => bundle.images.length > 0);

      console.log("Updated history image bundles:", updatedBundles);
      return { historyImageBundles: updatedBundles };
    });
  },

  addPendingGeneration: (id: string, count: number) => {
    set((state) => ({
      pendingGenerations: [...state.pendingGenerations, { id, count }],
    }));
  },

  resolvePendingGeneration: (id: string) => {
    set((state) => ({
      pendingGenerations: state.pendingGenerations.filter((p) => p.id !== id),
    }));
  },

  clearPendingGenerations: () => {
    set({ pendingGenerations: [] });
  },
}));
