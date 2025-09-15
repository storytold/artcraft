import { create } from "zustand";
import { LineNode, generateId } from "~/pages/PageDraw/stores/SceneState";
import { Node } from "~/pages/PageDraw/Node";
import { BaseSelectorImage } from "../BaseImageSelector";
import { FetchProxy } from "libs/tauri-utils/src/lib/FetchProxy";
import { ImageBundle } from "../HistoryStack";

export type ActiveEditTool = "select" | "edit" | "expand";
export type EditOperation = "add" | "minus";

interface EditState {
  // Nodes
  nodes: Node[];
  selectedNodeIds: string[];
  lineNodes: LineNode[]; // Add lineNodes to state

  // Clipboard
  clipboard: (Node | LineNode)[]; // To store copied items

  // Toolbar state
  activeTool: ActiveEditTool;
  editOperation: EditOperation;
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  fillColor: string;

  // Cursor state
  cursorPosition: { x: number; y: number } | null;
  cursorVisible: boolean;

  // Base image state
  baseImageInfo: BaseSelectorImage | null;
  baseImageBitmap: HTMLImageElement | null;
  setBaseImageInfo: (image: BaseSelectorImage | null) => void;

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

  // History management
  history: { nodes: Node[]; lineNodes: LineNode[] }[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  saveState: () => void;

  // Add new actions for line nodes
  addLineNode: (lineNode: LineNode, shouldSaveState: boolean) => void;
  removeLineNode: (id: string, shouldSaveState?: boolean) => void;
  updateLineNode: (
    id: string,
    updates: Partial<LineNode>,
    shouldSaveState: boolean,
  ) => void;
  moveLineNode: (id: string, dx: number, dy: number) => void;
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

  // Clipboard actions
  copySelectedItems: () => void;
  pasteItems: () => void;

  // Toolbar actions
  setActiveTool: (tool: ActiveEditTool) => void;
  setEditOperation: (mode: EditOperation) => void;
  setBrushColor: (color: string) => void;
  setBrushOpacity: (opacity: number) => void;
  setBrushSize: (size: number) => void;
  setFillColor: (color: string) => void;

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

  // Add aspect ratio action
  getAspectRatioDimensions: () => { width: number; height: number };

  // History stack operations
  // pushHistory: () => void;
  // clearHistory: () => void;
  RESET: () => void;

  // For the history stack
  historyImageBundles: ImageBundle[];
  clearHistoryImages: () => void;
  addHistoryImageBundle: (bundle: ImageBundle) => void;
  removeHistoryImage: (image: BaseSelectorImage) => void;
}

// Add a flag to prevent saving state during restoration
let isRestoring = false;

// Add this helper function at the top of the store (before create<SceneState>)
const getNextZIndex = (nodes: Node[], lineNodes: LineNode[]): number => {
  const allZIndices = [
    ...nodes.map((n, index) => {
      //console.log(`Node: ${JSON.stringify(n)}, Index: ${index}`);
      return n.zIndex || 0;
    }),
    ...lineNodes.map((n, index) => {
      //console.log(`LineNode: ${JSON.stringify(n)}, Index: ${index}`);
      return n.zIndex || 0;
    }),
  ];

  return allZIndices.length > 0 ? Math.max(...allZIndices) + 1 : 0;
};

export const useEditStore = create<EditState>((set, get, store) => ({
  // Initial state
  nodes: [],
  lineNodes: [],
  selectedNodeIds: [],
  clipboard: [], // Initialize clipboard
  history: [],
  historyIndex: -1,

  // Toolbar initial state
  activeTool: "edit", // Default to 'edit' tool
  editOperation: "add", // Default to 'add' operation
  brushColor: "#000000",
  brushSize: 30,
  brushOpacity: 1,
  fillColor: "rgba(0, 0, 255, 0.5)",

  // Cursor initial state
  cursorPosition: null,
  cursorVisible: false,

  // Base image initial state
  baseImageInfo: null,
  baseImageBitmap: null,

  // History stack state
  historyImageBundles: [],

  // Actions
  addNode: (node: Node) => {
    set((state) => {
      const nextZ = getNextZIndex(state.nodes, state.lineNodes);
      console.log(`NextZ for node ID ${node.id}: ${nextZ}`);
      const newNode = new Node({
        ...node,
        zIndex: nextZ,
      });
      // console.log("New Node with ID:", newNode.id);
      const nodes = [...state.nodes, newNode];
      console.log("Nodes after update");
      console.log(nodes);
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

  undo: () => {
    set((state) => {
      if (state.historyIndex < 0) return state;

      const newIndex = state.historyIndex - 1;

      // If we're going back to before the first saved state, return to initial empty state
      if (newIndex < 0) {
        return {
          nodes: [],
          lineNodes: [],
          selectedNodeIds: [],
          historyIndex: newIndex,
        };
      }

      const previousState = state.history[newIndex];

      // Set the restoring flag
      isRestoring = true;

      // Recreate nodes and immediately start loading images
      const restoredNodes = previousState.nodes.map((nodeData) => {
        const node = new Node(nodeData as any);

        // If it's an image node, start loading the image immediately
        if (node.type === "image" && (node.imageUrl || node.imageFile)) {
          const loadImage = async () => {
            try {
              if (node.imageUrl) {
                await node.setImageFromUrl(node.imageUrl);
              } else if (node.imageFile) {
                await node.setImageFromFile(node.imageFile);
              }
              // Update the specific node without triggering state save
              get().updateNode(node.id, node, false);
            } catch (error) {
              console.error("Failed to restore image:", error);
            } finally {
              // Reset the flag after a delay to ensure all async operations complete
              setTimeout(() => {
                isRestoring = false;
              }, 100);
            }
          };

          loadImage();
        }

        return node;
      });

      // Reset the flag if no images to load
      const hasImages = restoredNodes.some((node) => node.type === "image");
      if (!hasImages) {
        isRestoring = false;
      }

      return {
        nodes: restoredNodes,
        lineNodes: previousState.lineNodes,
        selectedNodeIds: [], // Clear selection on undo
        historyIndex: newIndex,
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;

      const newIndex = state.historyIndex + 1;
      const nextState = state.history[newIndex];

      // Set the restoring flag
      isRestoring = true;

      // Recreate nodes and immediately start loading images
      const restoredNodes = nextState.nodes.map((nodeData) => {
        const node = new Node(nodeData as any);

        // If it's an image node, start loading the image immediately
        if (node.type === "image" && (node.imageUrl || node.imageFile)) {
          const loadImage = async () => {
            try {
              if (node.imageUrl) {
                await node.setImageFromUrl(node.imageUrl);
              } else if (node.imageFile) {
                await node.setImageFromFile(node.imageFile);
              }
              // Update the specific node without triggering state save
              get().updateNode(node.id, node, false);
            } catch (error) {
              console.error("Failed to restore image:", error);
            } finally {
              // Reset the flag after a delay to ensure all async operations complete
              setTimeout(() => {
                isRestoring = false;
              }, 100);
            }
          };

          loadImage();
        }

        return node;
      });

      // Reset the flag if no images to load
      const hasImages = restoredNodes.some((node) => node.type === "image");
      if (!hasImages) {
        isRestoring = false;
      }

      return {
        nodes: restoredNodes,
        lineNodes: nextState.lineNodes,
        selectedNodeIds: [], // Clear selection on redo
        historyIndex: newIndex,
      };
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

  clearLineNodes() {
    set({ lineNodes: [] });
  },

  moveLineNode: (id: string, dx: number, dy: number) => {
    set((state) => {
      const newLineNodes = state.lineNodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            points: node.points.map((point, index) => {
              // Even indices are x coordinates, odd are y
              return index % 2 === 0 ? point + dx : point + dy;
            }),
          };
        }
        return node;
      });
      return { lineNodes: newLineNodes };
    });
    get().saveState();
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
          console.log("Image loaded with dimensions:", {
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            finalWidth: finalWidth,
            finalHeight: finalHeight,
          });
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

  setBaseImageInfo: (image: BaseSelectorImage | null) => {
    set({ baseImageInfo: image });

    if (!image) {
      return;
    }

    // Load the image bitmap as well
    const imgBitmap = new Image();
    imgBitmap.onload = () => {
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
  setActiveTool: (tool: ActiveEditTool) => {
    // Avoid triggering state change if the tool is same
    if (tool === get().activeTool) {
      return;
    }

    set({ activeTool: tool });
  },
  setEditOperation: (mode: EditOperation) => set({ editOperation: mode }),
  setBrushColor: (color: string) => set({ brushColor: color }),
  setBrushSize: (size: number) => set({ brushSize: size }),
  setFillColor: (color: string) => set({ fillColor: color }),
  setBrushOpacity: (opacity: number) => set({ brushOpacity: opacity }),

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
      const restoredNodes = sceneData.nodes.map((nodeData: any) => {
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
      });

      set({
        nodes: restoredNodes,
        lineNodes: sceneData.lineNodes || [],
        selectedNodeIds: [],
        brushColor: sceneData.brushColor || "#000000",
        brushSize: sceneData.brushSize || 5,
        fillColor: sceneData.fillColor || "white",
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

  // Add aspect ratio actions
  getAspectRatioDimensions: () => {
    // First we check the base image info if it exists
    // Otherwise we use default landscape
    const baseImageInfo = get().baseImageBitmap;

    if (!baseImageInfo) {
      return { width: 1024, height: 683 }; // Default to landscape
    }

    // If base image exists, use its dimensions
    return { width: baseImageInfo.width, height: baseImageInfo.height };
  },

  RESET: () => {
    set(store.getInitialState());
  },

  clearHistoryImages: () => {
    set({ historyImageBundles: [] });
  },

  addHistoryImageBundle(bundle) {
    set((state) => ({
      historyImageBundles: [...state.historyImageBundles, bundle],
    }));
  },

  removeHistoryImage(image) {
    console.log("Removing history image:", image);
    set((state) => {
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
