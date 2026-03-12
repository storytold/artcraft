import { create } from "zustand";
import { Node, NodeType } from "../Node";
import { EnqueueImageBgRemoval } from "libs/tauri-api/src/lib/enqueue/EnqueueImageBgRemovalCommand";
import { ImageBundle } from "~/pages/PageEdit/HistoryStack";
import { BaseSelectorImage } from "~/pages/PageEdit/BaseImageSelector";

// Add LineNode type
export type LineNode = {
  id: string;
  type: "line";
  points: number[];
  stroke: string;
  strokeWidth: number;
  draggable: boolean;
  opacity?: number; // Add opacity property
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  offsetX?: number;
  offsetY?: number;
  zIndex: number;
  locked?: boolean; // Add locked property
  globalCompositeOperation?: string; // Add globalCompositeOperation property
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

// Type for serialized node data stored in history
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
  zIndex: number;
  locked: boolean;
};

interface HistoryNodeData {
  nodes: Node[];
  lineNodes: LineNode[];
}

export interface SceneState {
  // Nodes
  nodes: Node[];
  selectedNodeIds: string[];
  lineNodes: LineNode[]; // Add lineNodes to state
  historyImageNodeMap: Map<BaseSelectorImage, HistoryNodeData>;

  // Clipboard
  clipboard: (Node | LineNode)[]; // To store copied items

  // Toolbar state
  activeTool: ActiveTool;
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  fillColor: string;
  // Currently selected shape when shape tool is active
  currentShape: "rectangle" | "circle" | "triangle" | null;
  // Default color for new shapes
  shapeColor: string;

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
  history: { nodes: SerializedNodeData[]; lineNodes: LineNode[] }[];
  historyIndex: number;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  saveState: () => void;

  // Add new actions for line nodes
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

  // Add these two properties
  serializeSceneToString: () => Promise<string>;
  loadSceneFromString: (jsonString: string) => boolean;

  // Layer management functions
  normalizeZIndices: () => void;
  bringToFront: (nodeIds: string[]) => void;
  sendToBack: (nodeIds: string[]) => void;
  bringForward: (nodeIds: string[]) => void;
  sendBackward: (nodeIds: string[]) => void;

  // Start background removal (enqueues task with Tauri)
  beginRemoveBackground: (nodeIds: string[]) => Promise<void>;

  // Finish background removal (handoff back from a Tauri-sent event)
  finishRemoveBackground: (
    nodeId: string,
    mediaToken: string,
    imageCdnUrl: string,
  ) => Promise<void>;

  // Add new lock action
  toggleLock: (nodeIds: string[]) => void;

  // Add minimal aspect ratio property
  aspectRatioType: AspectRatioType;

  // Add aspect ratio action
  setAspectRatioType: (type: AspectRatioType) => void;
  getAspectRatioDimensions: () => { width: number; height: number };

  // For the history stack
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

// Add this helper function at the top of the store (before create<SceneState>)
const getNextZIndex = (nodes: Node[], lineNodes: LineNode[]): number => {
  const allZIndices = [
    ...nodes.map((n) => n.zIndex || 0),
    ...lineNodes.map((n) => n.zIndex || 0),
  ];

  return allZIndices.length > 0 ? Math.max(...allZIndices) + 1 : 1;
};

export const useSceneStore = create<SceneState>((set, get, store) => ({
  // Initial state
  nodes: [],
  lineNodes: [],
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

  // Cursor initial state
  cursorPosition: null,
  cursorVisible: false,

  // Base image initial state
  baseImageInfo: null,
  baseImageBitmap: null,

  // History stack state
  historyImageBundles: [],

  // Add initial aspect ratio state
  aspectRatioType: AspectRatioType.NONE,

  // Actions
  addNode: (node: Node) => {
    set((state) => {
      const nextZ = getNextZIndex(state.nodes, state.lineNodes);
      // console.log(`NextZ for node ID ${node.id}: ${nextZ}`);
      const newNode = new Node({
        ...node,
        zIndex: nextZ,
      });
      // console.log("New Node with ID:", newNode.id);

      const nodes = [...state.nodes, newNode];
      // console.log("Nodes after update");
      // console.log(nodes);
      return { nodes: nodes };
    });
    get().saveState();
  },

  removeNode: (id: string, shouldSaveState: boolean = true) => {
    set((state) => {
      // Remove the node

      const newNodes = state.nodes.filter((node) => node.id !== id);

      // Update selection state
      const newSelectedIds = state.selectedNodeIds.filter(
        (nodeId) => nodeId !== id,
      );

      return {
        nodes: newNodes,
        selectedNodeIds: newSelectedIds,
      };
    });
    if (shouldSaveState) {
      get().saveState();
    }
  },

  updateNode: (
    id: string,
    updates: Partial<Node>,
    shouldSaveState: boolean = true,
  ) => {
    set((state) => {
      const newNodes = state.nodes.map((node) => {
        const newZIndex =
          updates.zIndex !== undefined ? updates.zIndex : node.zIndex;

        if (node.id === id) {
          return new Node({
            ...node,
            ...updates,
            zIndex: newZIndex,
          });
        }
        return node;
      });
      return { nodes: newNodes };
    });
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
        // Toggle selection if already selected
        if (state.selectedNodeIds.includes(id)) {
          return {
            selectedNodeIds: state.selectedNodeIds.filter(
              (nodeId) => nodeId !== id,
            ),
          };
        }
        // Add to selection
        return {
          selectedNodeIds: [...state.selectedNodeIds, id],
        };
      }

      // Single select
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
    set((state) => {
      // Handle regular nodes
      const newNodes = state.nodes.map((node) => {
        if (node.id === id) {
          node.setPosition(x, y);
          return node;
        }
        if (
          state.selectedNodeIds.includes(node.id) &&
          dx !== undefined &&
          dy !== undefined
        ) {
          node.setPosition(node.x + dx, node.y + dy);
          return node;
        }
        return node;
      });

      const newState = {
        nodes: newNodes,
      };

      // Only save state if explicitly requested
      if (shouldSaveState) {
        get().saveState();
      }

      return newState;
    });
  },

  setNodes: (nodes: Node[]) => {
    set({ nodes });
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
    get().setActiveTool("select"); // Switch to select tool after creating
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
    get().setActiveTool("select"); // Switch to select tool after creating
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
    get().setActiveTool("select"); // Switch to select tool after creating
  },

  // History management
  saveState: () => {
    // Don't save state if we're in the middle of restoring
    if (isRestoring) return;

    set((state) => {
      // Create a deep copy but exclude non-serializable properties
      const serializableState = {
        nodes: state.nodes.map((node) => ({
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
          imageFile: node.imageFile,
          backgroundColor: node.backgroundColor,
          rotation: node.rotation || 0,
          scaleX: node.scaleX || 1,
          scaleY: node.scaleY || 1,
          offsetX: node.offsetX || 0, // Include offset in history
          offsetY: node.offsetY || 0, // Include offset in history
          zIndex: node.zIndex || 0,
          locked: node.locked || false,
        })),
        lineNodes: JSON.parse(JSON.stringify(state.lineNodes)),
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

    // If we're going back to before the first saved state, return to initial empty state
    if (newIndex < 0) {
      set({
        nodes: [],
        lineNodes: [],
        selectedNodeIds: [],
        historyIndex: newIndex,
      });
      return;
    }

    const previousState = state.history[newIndex];

    // Set the restoring flag
    isRestoring = true;

    // Recreate nodes and load images BEFORE setting state
    const restoredNodes = await Promise.all(
      previousState.nodes.map(async (nodeData: SerializedNodeData) => {
        const node = new Node(nodeData);

        // If it's an image node, load the image before returning the node
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

    // Reset the flag
    isRestoring = false;

    // Set the state with fully loaded nodes
    set({
      nodes: restoredNodes,
      lineNodes: previousState.lineNodes,
      selectedNodeIds: [], // Clear selection on undo
      historyIndex: newIndex,
    });
  },

  redo: async () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;

    const newIndex = state.historyIndex + 1;
    const nextState = state.history[newIndex];

    // Set the restoring flag
    isRestoring = true;

    // Recreate nodes and load images BEFORE setting state
    const restoredNodes = await Promise.all(
      nextState.nodes.map(async (nodeData: SerializedNodeData) => {
        const node = new Node(nodeData);

        // If it's an image node, load the image before returning the node
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

    // Reset the flag
    isRestoring = false;

    // Set the state with fully loaded nodes
    set({
      nodes: restoredNodes,
      lineNodes: nextState.lineNodes,
      selectedNodeIds: [], // Clear selection on redo
      historyIndex: newIndex,
    });
  },

  // Add new line node actions
  addLineNode: (lineNode: LineNode, shouldSaveState: boolean = true) => {
    set((state) => {
      const nextZ = getNextZIndex(state.nodes, state.lineNodes);
      const newLineNode = {
        ...lineNode,
        zIndex: nextZ,
      };
      return { lineNodes: [...state.lineNodes, newLineNode] };
    });
    if (shouldSaveState) {
      get().saveState();
    }
  },

  removeLineNode: (id: string, shouldSaveState: boolean = true) => {
    set((state) => {
      // Remove the line node
      const newLineNodes = state.lineNodes.filter((node) => node.id !== id);

      // Update selection state
      const newSelectedIds = state.selectedNodeIds.filter(
        (nodeId) => nodeId !== id,
      );

      return {
        lineNodes: newLineNodes,
        selectedNodeIds: newSelectedIds,
      };
    });
    if (shouldSaveState) {
      get().saveState();
    }
  },

  updateLineNode: (
    id: string,
    updates: Partial<LineNode>,
    shouldSaveState: boolean = true,
  ) => {
    set((state) => {
      const newLineNodes = state.lineNodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            ...updates,
            zIndex: updates.zIndex !== undefined ? updates.zIndex : node.zIndex,
          };
        }
        return node;
      });
      return { lineNodes: newLineNodes };
    });
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
    set((state) => {
      const newLineNodes = state.lineNodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            x: (node.x ?? 0) + dx,
            y: (node.y ?? 0) + dy,
          };
        }
        return node;
      });
      return { lineNodes: newLineNodes };
    });
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
    // Auto-detect dimensions from the image if not provided
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          // Increase default size to 512px width while maintaining aspect ratio
          const finalWidth = width || Math.min(img.naturalWidth, 512);
          const finalHeight = height || finalWidth / aspectRatio;
          // console.log("Image loaded with dimensions:", {
          //   naturalWidth: img.naturalWidth,
          //   naturalHeight: img.naturalHeight,
          //   finalWidth: finalWidth,
          //   finalHeight: finalHeight,
          // });
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
      // Fetch the image and convert to blob
      const response = await fetch(url);
      const blob = await response.blob();

      // Create a File from the blob
      const filename = url.split("/").pop() || "image.png";
      const file = new File([blob], filename, { type: blob.type });

      // Use existing createImage function
      get().createImageFromFile(x, y, file, width, height);
    } catch (error) {
      console.error("Error loading image from URL:", url, error);
    }
  },

  // Update the createImage method to handle both URLs and Files
  createImage: (
    x: number,
    y: number,
    source: string | File,
    width = 200,
    height = 200,
  ) => {
    const nodeId = generateId(); // Define nodeId here to use it in the catch block for logging
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

    // Load the image asynchronously
    node
      .setImage(source)
      .then(() => {
        // Update the node in the store after image loads
        get().addNode(node);
        //get().updateNode(node.id, node, false);
      })
      .catch((error) => console.error("Error loading image:", error));
  },

  // Action for deleting selected items
  deleteSelectedItems: () => {
    const initialSelectedIds = [...get().selectedNodeIds]; // Operate on a copy of the original selection

    if (initialSelectedIds.length > 0) {
      initialSelectedIds.forEach((id) => {
        get().removeNode(id, false); // Pass shouldSaveState = false
        get().removeLineNode(id, false); // Pass shouldSaveState = false
      });

      // After all deletions, ensure selectedNodeIds is empty in the state.
      set((state) => ({
        ...state, // Preserve other state properties
        selectedNodeIds: [],
      }));

      get().saveState(); // Save the final state once
    }
  },

  RESET: () => {
    set(store.getInitialState());
  },

  // Clipboard actions
  copySelectedItems: () => {
    set((state) => {
      const selectedNodes = state.nodes.filter((node) =>
        state.selectedNodeIds.includes(node.id),
      );
      const selectedLineNodes = state.lineNodes.filter((lineNode) =>
        state.selectedNodeIds.includes(lineNode.id),
      );

      // Deep copy nodes. For Node instances, we create new instances.
      const copiedNodes = selectedNodes.map((node) => {
        // Create a new Node instance with the properties of the old one.
        // This ensures methods are available if needed.
        // For imageFile (File object), the reference is copied. The new Node
        // instance will need to handle loading this File object again if necessary.
        const nodeData = { ...node }; // Shallow copy properties first
        // If Node class has complex internal state not covered by spread, adjust accordingly
        return new Node(nodeData);
      });

      // Deep copy line nodes (plain objects)
      const copiedLineNodes = JSON.parse(JSON.stringify(selectedLineNodes));

      return { clipboard: [...copiedNodes, ...copiedLineNodes] };
    });
  },

  pasteItems: () => {
    const { clipboard } = get();
    if (clipboard.length === 0) return;

    const newPastedItemIds: string[] = [];
    const offset = 20; // Offset for pasted items

    const nodesToAdd: Node[] = [];
    const lineNodesToAdd: LineNode[] = [];

    clipboard.forEach((item) => {
      const newId = generateId();
      newPastedItemIds.push(newId);

      if (item instanceof Node) {
        // It's a regular Node (shape or image)
        // Create a new Node instance for the pasted item
        const pastedNodeData = {
          ...(item as Node), // Spread existing properties
          id: newId,
          x: (item as Node).x + offset,
          y: (item as Node).y + offset,
          // imageFile and imageUrl are carried over from 'item'
          // The new Node instance's constructor or setImage method will handle loading
        };
        const newNodeInstance = new Node(pastedNodeData);

        // If it's an image, and its dimensions might change upon load,
        // we need to ensure the store is updated after the image is loaded.
        // The Node constructor itself might call setImage.
        // Similar to createImage, an updateNode call after image load is robust.
        if (
          newNodeInstance.type === "image" &&
          (newNodeInstance.imageUrl || newNodeInstance.imageFile)
        ) {
          const source = newNodeInstance.imageUrl || newNodeInstance.imageFile;
          if (source) {
            newNodeInstance
              .setImage(source)
              .then(() => {
                if (get().nodes.find((n) => n.id === newId)) {
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
      } else if (
        item &&
        typeof item === "object" &&
        "points" in item &&
        "type" in item &&
        item.type === "line"
      ) {
        // It's a LineNode (duck-typing for safety)
        const lineNode = item as LineNode;
        const pastedLineNode: LineNode = {
          ...lineNode,
          id: newId,
          points: lineNode.points.map((point, index) => {
            return index % 2 === 0 ? point + offset : point + offset; // Offset x and y
          }),
          // Ensure optional properties are handled:
          // If x,y were part of LineNode for positioning the whole line, offset them too.
          // The current LineNode type doesn't enforce top-level x,y for the line itself for dragging,
          // but if it did, they'd be offset here.
          // The points themselves define the line's position.
          x: lineNode.x !== undefined ? lineNode.x + offset : undefined,
          y: lineNode.y !== undefined ? lineNode.y + offset : undefined,
        };
        lineNodesToAdd.push(pastedLineNode);
      }
    });

    set((state) => {
      const newNodes = [...state.nodes, ...nodesToAdd];
      const newLineNodes = [...state.lineNodes, ...lineNodesToAdd];
      return {
        nodes: newNodes,
        lineNodes: newLineNodes,
        selectedNodeIds: newPastedItemIds, // Select the newly pasted items
      };
    });

    get().saveState();
  },

  // Toolbar actions
  setActiveTool: (tool: ActiveTool) => set({ activeTool: tool }),
  setBrushColor: (color: string) => set({ brushColor: color }),
  setBrushSize: (size: number) => set({ brushSize: size }),
  setFillColor: (color: string) => set({ fillColor: color }),
  setBrushOpacity: (opacity: number) => set({ brushOpacity: opacity }),

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

    // Helper function to convert File to base64
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    // Process nodes and convert File objects to base64
    const processedNodes = await Promise.all(
      state.nodes.map(async (node) => {
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
          zIndex: node.zIndex || 0,
          locked: node.locked || false,
        };

        // Convert imageFile to base64 if it exists
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
      nodes: processedNodes,
      lineNodes: JSON.parse(JSON.stringify(state.lineNodes)),
      brushColor: state.brushColor,
      brushSize: state.brushSize,
      fillColor: state.fillColor,
      aspectRatioType: state.aspectRatioType,
      version: "1.0",
    };

    return JSON.stringify(sceneData, null, 2);
  },

  importSceneFromJson: (jsonString: string) => {
    try {
      const sceneData = JSON.parse(jsonString);

      isRestoring = true;

      // Helper function to convert base64 to File
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

      // Recreate nodes
      const restoredNodes = sceneData.nodes.map(
        (nodeData: SerializedNodeData & { imageDataUrl?: string }) => {
          const node = new Node(nodeData);

          // Handle image restoration
          if (node.type === "image") {
            const loadImage = async () => {
              try {
                if (nodeData.imageDataUrl) {
                  // Restore from base64 data URL
                  const file = base64ToFile(
                    nodeData.imageDataUrl,
                    `restored-image-${node.id}.png`,
                  );
                  await node.setImageFromFile(file);
                } else if (node.imageUrl) {
                  // Restore from URL
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
        nodes: restoredNodes,
        lineNodes: sceneData.lineNodes || [],
        selectedNodeIds: [],
        brushColor: sceneData.brushColor || "#000000",
        brushSize: sceneData.brushSize || 5,
        fillColor: sceneData.fillColor || "white",
        aspectRatioType: sceneData.aspectRatioType || AspectRatioType.NONE,
      });

      isRestoring = false;
      get().saveState(); // Save the loaded state to history

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

  // Helper function to normalize all z-indices
  normalizeZIndices: () => {
    set((state) => {
      // Get all items and sort by current z-index
      const allItems = [
        ...state.nodes.map((n) => ({
          id: n.id,
          z: n.zIndex || 0,
          type: "node" as const,
        })),
        ...state.lineNodes.map((n) => ({
          id: n.id,
          z: n.zIndex || 0,
          type: "lineNode" as const,
        })),
      ].sort((a, b) => a.z - b.z);

      // Reassign z-indices starting from 1 (above canvas background at -1)
      const zIndexMap = new Map<string, number>();
      allItems.forEach((item, index) => {
        zIndexMap.set(item.id, index + 1);
      });

      return {
        nodes: state.nodes.map((node) => {
          const newZ = zIndexMap.get(node.id) || 1;
          return new Node({ ...node, zIndex: newZ });
        }),
        lineNodes: state.lineNodes.map((node) => {
          const newZ = zIndexMap.get(node.id) || 1;
          return { ...node, zIndex: newZ };
        }),
      };
    });
  },

  // Layer management functions
  bringToFront: (nodeIds: string[]) => {
    set((state) => {
      if (nodeIds.length === 0) return state;

      // First normalize all z-indices to ensure clean state
      const allItems = [
        ...state.nodes.map((n) => ({
          id: n.id,
          z: n.zIndex || 0,
          type: "node" as const,
        })),
        ...state.lineNodes.map((n) => ({
          id: n.id,
          z: n.zIndex || 0,
          type: "lineNode" as const,
        })),
      ].sort((a, b) => a.z - b.z);

      // Create normalized z-index mapping
      const zIndexMap = new Map<string, number>();
      let currentZ = 1; // Start from 1 to stay above canvas background

      // Assign z-indices: non-selected items first, then selected items on top
      allItems.forEach((item) => {
        if (!nodeIds.includes(item.id)) {
          zIndexMap.set(item.id, currentZ++);
        }
      });

      // Put selected items on top
      allItems.forEach((item) => {
        if (nodeIds.includes(item.id)) {
          zIndexMap.set(item.id, currentZ++);
        }
      });

      return {
        nodes: state.nodes.map((node) => {
          const newZ = zIndexMap.get(node.id) || 1;
          return new Node({ ...node, zIndex: newZ });
        }),
        lineNodes: state.lineNodes.map((node) => {
          const newZ = zIndexMap.get(node.id) || 1;
          return { ...node, zIndex: newZ };
        }),
      };
    });
    get().saveState();
  },

  sendToBack: (nodeIds: string[]) => {
    set((state) => {
      if (nodeIds.length === 0) return state;

      // Get all items sorted by current z-index
      const allItems = [
        ...state.nodes.map((n) => ({
          id: n.id,
          z: n.zIndex || 0,
          type: "node" as const,
        })),
        ...state.lineNodes.map((n) => ({
          id: n.id,
          z: n.zIndex || 0,
          type: "lineNode" as const,
        })),
      ].sort((a, b) => a.z - b.z);

      // Create normalized z-index mapping
      const zIndexMap = new Map<string, number>();
      let currentZ = 1; // Start from 1 to stay above canvas background

      // Get selected items and sort by current z-index (highest first)
      // This ensures the item that was on top goes to the very back
      const selectedItems = allItems
        .filter((item) => nodeIds.includes(item.id))
        .sort((a, b) => b.z - a.z); // Reverse order: highest z-index first

      // Assign z-indices: selected items first (in reverse order), then non-selected items
      selectedItems.forEach((item) => {
        zIndexMap.set(item.id, currentZ++);
      });

      allItems.forEach((item) => {
        if (!nodeIds.includes(item.id)) {
          zIndexMap.set(item.id, currentZ++);
        }
      });

      return {
        nodes: state.nodes.map((node) => {
          const newZ = zIndexMap.get(node.id) || 1;
          return new Node({ ...node, zIndex: newZ });
        }),
        lineNodes: state.lineNodes.map((node) => {
          const newZ = zIndexMap.get(node.id) || 1;
          return { ...node, zIndex: newZ };
        }),
      };
    });
    get().saveState();
  },

  bringForward: (nodeIds: string[]) => {
    set((state) => {
      if (nodeIds.length === 0) return state;

      // Get all items sorted by current z-index (this represents the layer stack)
      const allItems = [
        ...state.nodes.map((n) => ({
          id: n.id,
          z: n.zIndex || 0,
          type: "node" as const,
        })),
        ...state.lineNodes.map((n) => ({
          id: n.id,
          z: n.zIndex || 0,
          type: "lineNode" as const,
        })),
      ].sort((a, b) => a.z - b.z);

      // Create array to track new layer order
      const newOrder = [...allItems];

      // Process selected items from highest to lowest z-index to avoid conflicts
      const selectedIndices = allItems
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => nodeIds.includes(item.id))
        .sort((a, b) => b.index - a.index); // Sort by position in array (highest z-index first)

      // Move each selected item forward by one position if possible
      selectedIndices.forEach(({ index }) => {
        if (index < newOrder.length - 1) {
          // Swap with the item directly in front of it
          const temp = newOrder[index];
          newOrder[index] = newOrder[index + 1];
          newOrder[index + 1] = temp;
        }
      });

      // Reassign z-indices based on new order (starting from 1 to stay above canvas)
      const zIndexMap = new Map<string, number>();
      newOrder.forEach((item, index) => {
        zIndexMap.set(item.id, index + 1);
      });

      return {
        nodes: state.nodes.map((node) => {
          const newZ = zIndexMap.get(node.id) || 1;
          return new Node({ ...node, zIndex: newZ });
        }),
        lineNodes: state.lineNodes.map((node) => {
          const newZ = zIndexMap.get(node.id) || 1;
          return { ...node, zIndex: newZ };
        }),
      };
    });
    get().saveState();
  },

  sendBackward: (nodeIds: string[]) => {
    set((state) => {
      if (nodeIds.length === 0) return state;

      // Get all items sorted by current z-index (this represents the layer stack)
      const allItems = [
        ...state.nodes.map((n) => ({
          id: n.id,
          z: n.zIndex || 0,
          type: "node" as const,
        })),
        ...state.lineNodes.map((n) => ({
          id: n.id,
          z: n.zIndex || 0,
          type: "lineNode" as const,
        })),
      ].sort((a, b) => a.z - b.z);

      // Create array to track new layer order
      const newOrder = [...allItems];

      // Process selected items from lowest to highest z-index to avoid conflicts
      const selectedIndices = allItems
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => nodeIds.includes(item.id))
        .sort((a, b) => a.index - b.index); // Sort by position in array (lowest z-index first)

      // Move each selected item backward by one position if possible
      selectedIndices.forEach(({ index }) => {
        if (index > 0) {
          // Swap with the item directly behind it
          const temp = newOrder[index];
          newOrder[index] = newOrder[index - 1];
          newOrder[index - 1] = temp;
        }
      });

      // Reassign z-indices based on new order (starting from 1 to stay above canvas)
      const zIndexMap = new Map<string, number>();
      newOrder.forEach((item, index) => {
        zIndexMap.set(item.id, index + 1);
      });

      return {
        nodes: state.nodes.map((node) => {
          const newZ = zIndexMap.get(node.id) || 1;
          return new Node({ ...node, zIndex: newZ });
        }),
        lineNodes: state.lineNodes.map((node) => {
          const newZ = zIndexMap.get(node.id) || 1;
          return { ...node, zIndex: newZ };
        }),
      };
    });
    get().saveState();
  },
  beginRemoveBackground: async (nodeIds: string[]) => {
    const hasImageNodes = nodeIds.some((id) => {
      const node = get().nodes.find((n) => n.id === id);
      return node ? node.type === "image" : false;
    });
    if (!hasImageNodes) {
      return;
    }
    const firstNode = get().nodes.find(
      (node) => nodeIds.includes(node.id) && node.type === "image",
    );
    if (!firstNode || !firstNode.imageFile) {
      return;
    }
    try {
      const base64Image = await convertFileToBase64(firstNode.imageFile);
      // NB: This handler is async, so we subscribe (externally) and
      // wait for the bg removal to complete.
      const _response = await EnqueueImageBgRemoval({
        base64_image: base64Image,
        frontend_caller: "canvas",
        frontend_subscriber_id: firstNode.id,
      });
    } catch (error) {
      console.error("Error starting background removal:", error);
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
    const firstNode = get().nodes.find(
      (node) => node.id === nodeId && node.type === "image",
    );
    if (!firstNode || !firstNode.imageFile) {
      return;
    }
    try {
      // Create a new node instance from the old node
      const updatedNode = new Node({
        ...firstNode,
        imageUrl: imageCdnUrl,
      });
      // Load the new image
      await updatedNode.setImageFromUrl(imageCdnUrl);
      // Update the store with the fully loaded node
      set((state: SceneState) => ({
        nodes: state.nodes.map((node: Node) => {
          if (node.id === firstNode.id) {
            return updatedNode;
          }
          return node;
        }),
      }));
      get().saveState();
    } catch (error) {
      console.error("Error completing background removal:", error);
    }
  },
  // Add toggleLock action
  toggleLock: (nodeIds: string[]) => {
    set((state) => {
      // Update regular nodes
      const updatedNodes = state.nodes.map((node) => {
        if (nodeIds.includes(node.id)) {
          return new Node({
            ...node,
            locked: !node.locked,
          });
        }
        return node;
      });

      // Update line nodes
      const updatedLineNodes = state.lineNodes.map((node) => {
        if (nodeIds.includes(node.id)) {
          return {
            ...node,
            locked: !node.locked,
          };
        }
        return node;
      });

      return {
        nodes: updatedNodes,
        lineNodes: updatedLineNodes,
      };
    });
    get().saveState();
  },

  // Add aspect ratio actions
  setAspectRatioType: (type: AspectRatioType) => {
    set({ aspectRatioType: type });
    get().saveState();
  },

  getAspectRatioDimensions: () => {
    // First we check the base image info if it exists
    // Otherwise we use default landscape
    const baseImageInfo = get().baseImageBitmap;

    // If base image exists, use its dimensions
    if (baseImageInfo) {
      return { width: baseImageInfo.width, height: baseImageInfo.height };
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
        return { width: 1024, height: 683 }; // Default to landscape
    }
  },

  setBaseImageInfo: (image: BaseSelectorImage | null) => {
    // If the new base image is null, return early because nothing needs to be loaded.
    if (!image) {
      // Set the new base image info - setting null is allowed.
      set({ baseImageInfo: null });
      return;
    }

    // Save the current node data to the history image node map
    const currentBaseImage = get().baseImageInfo;
    if (currentBaseImage) {
      get().historyImageNodeMap.set(currentBaseImage, {
        nodes: get().nodes,
        lineNodes: get().lineNodes,
      });
    }

    // Set the new base image info
    set({ baseImageInfo: image });

    // Load the image bitmap now
    const imgBitmap = new Image();
    imgBitmap.onload = () => {
      // Once the base image is set, check previous node data - or create new empty one
      const previousNodeData = get().historyImageNodeMap.get(image);
      if (previousNodeData) {
        set({
          nodes: previousNodeData.nodes,
          lineNodes: previousNodeData.lineNodes,
        });
      } else {
        set({ nodes: [], lineNodes: [] });
      }

      // Finally, set the base image bitmap
      set({ baseImageBitmap: imgBitmap });
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
    set({ lineNodes: [] });
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
      // Remove the history image node data
      state.historyImageNodeMap.delete(image);

      // Remove the image from the history image bundles
      const updatedBundles = state.historyImageBundles
        .map((bundle) => {
          return {
            ...bundle,
            images: bundle.images.filter(
              (img) => img.mediaToken !== image.mediaToken,
            ),
          };
        })
        .filter((bundle) => bundle.images.length > 0); // Remove empty bundles
      console.log("Updated history image bundles:", updatedBundles);
      return { historyImageBundles: updatedBundles };
    });
  },
}));
