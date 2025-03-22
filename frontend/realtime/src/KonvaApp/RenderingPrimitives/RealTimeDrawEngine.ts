import Konva from "konva";
import { Container } from "konva/lib/Container";
import { Shape } from "konva/lib/Shape";
import { Group } from "konva/lib/Group";

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import { FileUtilities } from "../FileUtilities/FileUtilities";
import { ImageNode, VideoNode, TextNode, ShapeNode, ShapeType } from "../Nodes";
import { MediaNode } from "../types";

import { RenderTask } from "./RenderTask";
import { OffScreenSceneCanvas } from "./OffScreenSceneCanvas";


import { PaintNode } from "../Nodes/PaintNode";

import { WebSocketClient } from "../../PyServer/DrawServer";
import { PreviewCopyNode } from "../Nodes/PreviewCopy";

// https://www.aiseesoft.com/resource/phone-aspect-ratio-screen-resolution.html#:~:text=16%3A9%20Aspect%20Ratio

import {
  isLoadingVisible,
  loadingProgress,
} from "~/signals/uiEvents/loadingIndicator";
import { ensureBase64Prefix } from "../EngineUtitlities/Base64Helpers";
import { DecodeBase64ToImage } from "~/utilities/DecodeBase64ToImage.ts";

interface ServerSettings {
  model_path: string;
  lora_path?: string;
}

interface GenerateImageParams {
  image: string;
  prompt: string;
  strength?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
}

export class RealTimeDrawEngine {
  private videoNodes: VideoNode[];
  private imageNodes: (ImageNode | TextNode | ShapeNode | PaintNode)[];

  private offScreenCanvas: OffscreenCanvas;
  private outputBitmap: ImageBitmap | undefined;

  // private frames: ImageBitmap[];

  // capturing composite within window

  private mediaLayerRef: Konva.Layer;
  private drawingsLayer: Konva.Layer; // New Layer for Drawings

  private height: number;
  private width: number;
  private positionX: number;
  private positionY: number;
  private positionPreviewX: number;
  private positionPreviewY: number;

  private port: MessagePort | undefined;
  public captureCanvas: Konva.Rect;
  public backgroundRasterRect: Konva.Image;


  public previewCanvas: Konva.Image;



  public videoLoadingCanvas: VideoNode | undefined;

  public fps: number = 24;

  public currentPrompt: string;
  public currentStrength: number;

  // Paint Color
  // paint Brush Size
  // has to exit out of paint mode when shape or image are used.
  public paintColor: string = "#000000";
  private brushSize: number = 5; // Default brush size

  private onDrawCallback?: (
    canvas: HTMLCanvasElement,
    lineBounds: {
      width: number;
      height: number;
      x: number;
      y: number;
    },
  ) => void;
  private offscreenRenderDiv: HTMLDivElement;

  private onPreviewCopyCallback?: (previewCopy: Konva.Image) => void; // New Callback

  private client: WebSocketClient | null = null;
  private isConnected: boolean = false;



  public backgroundColor: string = "#d2d2d2";
  constructor({
    width,
    height,
    mediaLayerRef,
    offScreenCanvas,
    onDraw,
    onPreviewCopy, // New Parameter
  }: {
    width: number;
    height: number;
    mediaLayerRef: Konva.Layer;
    offScreenCanvas: OffscreenCanvas;
    onDraw?: (
      canvas: HTMLCanvasElement,
      lineBounds: {
        width: number;
        height: number;
        x: number;
        y: number;
      },
    ) => void;
    onPreviewCopy?: (previewCopy: Konva.Image) => void; // New Parameter
  }) {
    this.videoLoadingCanvas = undefined;
    this.videoNodes = [];
    this.imageNodes = [];
    this.onDrawCallback = onDraw;
    this.onPreviewCopyCallback = onPreviewCopy; // Assign Callback

    // TODO: Make this dynamic and update this on change of canvas.

    this.width = width;
    this.height = height;

    this.positionX = window.innerWidth / 2 - this.width / 2 - this.width;
    this.positionY = window.innerHeight / 2 - this.height / 2;

    this.positionPreviewX = window.innerWidth / 2 - this.width / 2 + this.width;
    this.positionPreviewY = window.innerHeight / 2 - this.height / 2;

    this.offScreenCanvas = offScreenCanvas;
    this.offScreenCanvas.width = this.width;
    this.offScreenCanvas.height = this.height;

    // this is the whole canvas
    this.mediaLayerRef = mediaLayerRef;

    // Create a separate layer for drawings
    this.drawingsLayer = new Konva.Layer({
      clearBeforeDraw: true, // Ensures transparent background
    });

    this.mediaLayerRef.getStage()?.add(this.drawingsLayer); // to od pass in stage

    // Set background layer to red and media layer to green for visibility

    this.port = undefined;

    this.fps = 24;

    this.currentPrompt = "";
    this.currentStrength = 1;
    // This is captures a subset of the medialayer ref
    this.captureCanvas = new Konva.Rect({
      name: "CaptureCanvas",
      x: this.positionX,
      y: this.positionY,
      width: this.width,
      height: this.height,
      fill: this.backgroundColor,
      stroke: "black",
      strokeWidth: 1,
      draggable: false,
    });

    this.previewCanvas = new Konva.Image({
      name: "PreviewCanvas",
      x: this.positionX,
      y: this.positionY,
      width: this.width,
      height: this.height,
      image: undefined,
      stroke: "black",
      strokeWidth: 1,
      draggable: false,
      fill: "white",
    });

    this.offscreenRenderDiv = document.createElement("div");

    this.backgroundRasterRect = new Konva.Image({
      name: "backgroundRasterRect",
      x: this.positionX,
      y: this.positionY,
      width: this.width,
      height: this.height,
      fill: this.backgroundColor,
      image: undefined,
      stroke: "black",
      strokeWidth: 1,
      draggable: false,
    });

    this.mediaLayerRef.add(this.captureCanvas);
    this.mediaLayerRef.add(this.backgroundRasterRect);
    this.mediaLayerRef.add(this.previewCanvas);
    // send back
    this.captureCanvas.setZIndex(0);
    this.backgroundRasterRect.setZIndex(0);
    this.previewCanvas.setZIndex(1);
    // Add mouse events for preview canvas copying
    this.previewCopyListener();

    this.listenToServerEvents();

  }

  public async listenToServerEvents() {
    listen("notification", (event) => {
      console.log(event);
      // Handle model download events
      const payload = event.payload as any;

      // Model download started
      if (payload.model_download_started) {
        const modelInfo = payload.model_download_started;
        console.log(
          `Model download started: ${modelInfo.model_name} (${modelInfo.model_type})`,
        );

        // Set up loading indicator
        isLoadingVisible.value = true;
        loadingProgress.value = 0;

        // Create fake progress updates
        const downloadTimer = setInterval(() => {
          loadingProgress.value += 2;
          // Cap at 95% until we get the completed event
          if (loadingProgress.value >= 95) {
            loadingProgress.value = 95;
            clearInterval(downloadTimer);
          }
        }, 500);
      }

      // Model download completed
      if (payload.model_download_complete) {
        const modelInfo = payload.model_download_complete;
        console.log(
          `Model download completed: ${modelInfo.model_name} (${modelInfo.model_type})`,
        );

        // Complete the loading progress
        loadingProgress.value = 100;

        // Hide loading indicator after a short delay
        setTimeout(() => {
          isLoadingVisible.value = false;
        }, 1000);
      }
    });
  }

  private isEnabled: boolean = false;
  private cleanupFunction: (() => void) | null = null;

  // this starts the python server
  public async startServer() {
    try {
      this.client = new WebSocketClient("ws://localhost:8765");

      // Set up message handlers
      this.client.onProgress((progress) => {
        console.log(
          `Progress: ${progress.message} (${progress.progress * 100}%)`,
        );
        if (progress.error) {
          console.error("Error:", progress.error);
        }
      });

      this.client.onResult(async (response) => {
        try {
          // Convert the base64 image to ImageBitmap and update the preview
          const bitmap = await DecodeBase64ToImage(response.image);
          this.outputBitmap = bitmap;
          this.previewCanvas.image(bitmap);
          this.mediaLayerRef.batchDraw();
        } catch (error) {
          console.error("Error processing result image:", error);
        } finally {
          this.isProcessing = false;
        }
      });

      // Wait for connection to be established
      await new Promise<void>((resolve, reject) => {
        if (!this.client) return reject("Client not initialized");

        this.client.ws.onopen = () => {
          this.isConnected = true;
          resolve();
        };
        this.client.ws.onerror = (error) => reject(error);
      });

      // Load initial model
      await this.loadModel({
        model_path: "C:/Users/Tensor/Downloads/animagineXL40_v4Opt.safetensors",
        lora_path: "C:/Users/Tensor/Downloads/anyu_all.safetensors",
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      this.isConnected = false;
    }
  }

  private async loadModel(settings: ServerSettings) {
    if (!this.client || !this.isConnected) {
      throw new Error("Server not connected");
    }
    await this.client.loadModel(settings);
  }

  private updateCursor(stage: Konva.Stage) {
    // Create cursor canvas
    const cursorCanvas = document.createElement("canvas");
    const size = this.brushSize * 5; // Match the brush size used in drawing
    cursorCanvas.width = size * 2; // Double size for padding
    cursorCanvas.height = size * 2;

    const ctx = cursorCanvas.getContext("2d");
    if (!ctx) return;

    // Draw the outer circle with a light stroke
    ctx.beginPath();
    ctx.arc(size, size, size / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw the inner circle with a dark stroke
    ctx.beginPath();
    ctx.arc(size, size, size / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Convert to data URL
    const cursorUrl = cursorCanvas.toDataURL();

    // Apply custom cursor
    stage.container().style.cursor = `url(${cursorUrl}) ${size} ${size}, auto`;
  }

  public paintMode() {
    let isDrawing = false;
    let currentLine: Konva.Line | null = null;

    const stage = this.mediaLayerRef.getStage();
    if (!stage) return;

    // Initialize cursor
    this.updateCursor(stage);

    const startDrawing = (pos: { x: number; y: number }) => {
      if (!this.isEnabled) return;
      const stage = this.mediaLayerRef.getStage();
      if (!stage) return;

      // Convert pointer position to relative position within capture canvas
      const captureBox = this.captureCanvas.getClientRect();
      const relativeX = pos.x - captureBox.x;
      const relativeY = pos.y - captureBox.y;

      currentLine = new Konva.Line({
        points: [relativeX, relativeY],
        stroke: this.paintColor,
        strokeWidth: this.brushSize * 5,
        lineCap: "round",
        lineJoin: "round",
        x: this.captureCanvas.x(),
        y: this.captureCanvas.y(),
        draggable: false,
      });
      this.drawingsLayer.moveToTop();
      this.drawingsLayer.add(currentLine); // Add to drawingsLayer
      isDrawing = true;
    };

    const draw = (pos: { x: number; y: number }) => {
      if (!this.isEnabled) return;
      if (!isDrawing || !currentLine) return;

      // Convert pointer position to relative position
      const captureBox = this.captureCanvas.getClientRect();
      const relativeX = pos.x - captureBox.x;
      const relativeY = pos.y - captureBox.y;

      const newPoints = currentLine.points().concat([relativeX, relativeY]);
      currentLine.points(newPoints);
      this.drawingsLayer.batchDraw();
    };

    const stopDrawing = () => {
      if (!this.isEnabled) return;
      if (!isDrawing || !currentLine) return;

      // Store current line before resetting state
      const lineToConvert = currentLine;

      // Reset drawing state immediately so we can start a new stroke
      isDrawing = false;
      currentLine = null;

      // Create a temporary layer to render the line
      const tempLayer = new Konva.Layer({
        clearBeforeDraw: true,
      });
      this.mediaLayerRef.getStage()?.add(tempLayer);
      tempLayer.add(lineToConvert);

      // Get the line canvas with transparent background
      // Get the bounding box of the line
      const lineBounds = lineToConvert.getClientRect();

      // Create canvas with just enough size to contain the line
      const lineCanvas = tempLayer.toCanvas({
        x: lineBounds.x,
        y: lineBounds.y,
        width: lineBounds.width,
        height: lineBounds.height,
        pixelRatio: 1,
      });

      if (this.onDrawCallback) {
        this.onDrawCallback(lineCanvas, lineBounds);
      }

      // Clean up
      lineToConvert.destroy();
      tempLayer.destroy();

      this.drawingsLayer.batchDraw();
    };

    // Check if point is within capture canvas bounds
    const isWithinCaptureCanvas = (pos: { x: number; y: number }) => {
      const captureBox = this.captureCanvas.getClientRect();
      return (
        pos.x >= captureBox.x &&
        pos.x <= captureBox.x + captureBox.width &&
        pos.y >= captureBox.y &&
        pos.y <= captureBox.y + captureBox.height
      );
    };

    // Add event listeners
    stage.on("mousedown touchstart", (e) => {
      const pos = stage.getPointerPosition();
      if (pos && isWithinCaptureCanvas(pos)) {
        startDrawing(pos);
      }
    });

    stage.on("mousemove touchmove", (e) => {
      const pos = stage.getPointerPosition();
      if (pos && isWithinCaptureCanvas(pos)) {
        draw(pos);
      }
    });

    stage.on("mouseup touchend", async () => {
      stopDrawing();
      await this.render();
    });

    // Store cleanup function
    this.cleanupFunction = () => {
      stage.off("mousedown touchstart");
      stage.off("mousemove touchmove");
      stage.off("mouseup touchend");
    };
  }

  public enablePaintMode() {
    this.isEnabled = true;
    this.disableDragging();
    if (!this.cleanupFunction) {
      this.paintMode();
    }
    // Update cursor when enabling paint mode
    const stage = this.mediaLayerRef.getStage();
    if (stage) {
      this.updateCursor(stage);
    }
  }

  public enableDragging() {
    // Enable dragging for all nodes in media layer
    this.imageNodes?.forEach((node) => {
      console.log("Image Nodes Enable");
      console.log(node);
      node.kNode.draggable(true);
      node.kNode.listening(true);
    });

    this.mediaLayerRef.batchDraw();
  }

  public disableDragging() {
    // Disable dragging for all nodes in media layer
    this.imageNodes?.forEach((node) => {
      node.kNode.draggable(false);
      node.kNode.listening(false);
    });
    this.mediaLayerRef.batchDraw();
  }

  public disablePaintMode() {
    this.isEnabled = false;
    this.enableDragging();
    if (this.cleanupFunction) {
      this.cleanupFunction();
      this.cleanupFunction = null;
    }
    // Reset cursor when disabling paint mode
    const stage = this.mediaLayerRef.getStage();
    if (stage) {
      stage.container().style.cursor = "default";
    }
  }

  public previewCopyListener() {
    // Start of Selection
    this.previewCanvas.on("mousedown touchstart", () => {
      if (!this.outputBitmap) {
        console.log("No preview image to copy");
        return;
      }

      // Create draggable preview copy
      const previewCopy = new Konva.Image({
        x: this.previewCanvas.x(),
        y: this.previewCanvas.y(),
        width: this.width,
        height: this.height,
        image: this.outputBitmap,
        draggable: true,
        listening: true,
      });

      if (this.onPreviewCopyCallback) {
        this.onPreviewCopyCallback(previewCopy);
      }
      previewCopy.startDrag();
      previewCopy.moveToTop();
      previewCopy.on("dragend", (e: Konva.KonvaEventObject<DragEvent>) => {
        const previewBox = previewCopy.getClientRect();
        const captureBox = this.captureCanvas.getClientRect();

        if (Konva.Util.haveIntersection(previewBox, captureBox)) {
          // Snap to capture canvas position
          previewCopy.position({
            x: this.captureCanvas.x(),
            y: this.captureCanvas.y(),
          });

          e.target.off("dragend");
        } else {
          // Start Generation Here
          previewCopy.destroy();
          this.mediaLayerRef.batchDraw();
        }
      });

      // Start Generation Here
      const stage = this.mediaLayerRef.getStage();
      const layer = this.mediaLayerRef; // Use the existing media layer

      // Create centered text
      // Start of Selection
      const centeredText = new Konva.Text({
        text: "Hold and Drag Over, To Copy",
        fontSize: 24,
        fontFamily: "Arial",
        fill: "black",
        x: this.captureCanvas.x() + this.captureCanvas.width() / 2,
        y: this.captureCanvas.y() + this.captureCanvas.height() / 2,
        id: "copyText",
        listening: false,
      });
      // Calculate and set offsets based on text size to center it
      centeredText.offsetX(centeredText.width() / 2);
      centeredText.offsetY(centeredText.height() / 2);

      layer.add(centeredText);
      centeredText.moveToTop();
      layer.batchDraw();

      // Remove text on mouseup/touchend
      const removeText = () => {
        const text = layer.findOne("#copyText");
        if (text) {
          text.destroy();
          layer.batchDraw();
        }
        stage.off("mouseup touchend", removeText);
      };
      stage.on("mouseup touchend", removeText);
    });
  }

  public findImageNodeById(
    id: string,
  ): ImageNode | TextNode | ShapeNode | PaintNode | undefined {
    return this.imageNodes.find((node) => {
      if (node.kNode) {
        return node.kNode.id() === id;
      }
      return false;
    });
  }
  async updateCaptureCanvas(
    width: number | undefined,
    height: number | undefined,
  ) {
    if (!this.captureCanvas || !this.previewCanvas) {
      return;
    }
    if (width) {
      this.width = width;
    }
    if (height) {
      this.height = height;
    }

    // Ensures that all the nodes stag in the same place should
    // there be a window resize.
    // recompute the position
    // to ensure that the position of this stays

    const oldPositionX = this.positionX;
    const oldPositionY = this.positionY;

    // recompute the position
    const padBetweenCaptureAndPreview = 2;
    this.positionX =
      window.innerWidth / 2 -
      this.width / 2 -
      this.width / 2 -
      padBetweenCaptureAndPreview;
    this.positionY = window.innerHeight / 2 - this.height / 2;

    this.positionPreviewX =
      window.innerWidth / 2 -
      this.width / 2 +
      this.width / 2 +
      padBetweenCaptureAndPreview;
    this.positionPreviewY = window.innerHeight / 2 - this.height / 2;

    this.captureCanvas.setPosition({
      x: this.positionX,
      y: this.positionY,
    });
    this.captureCanvas.size({ width: this.width, height: this.height });

    this.previewCanvas.setPosition({
      x: this.positionPreviewX,
      y: this.positionPreviewY,
    });
    this.previewCanvas.size({ width: this.width, height: this.height });

    // this is the change in positions
    const deltaX = this.positionX - oldPositionX;
    const deltaY = this.positionY - oldPositionY;

    var children = this.mediaLayerRef.getChildren();
    for (let i = 0; i < children.length; i++) {
      let node = children[i];

      // skip the capture canvas and preview canvas update.
      if (node.name() === "CaptureCanvas" || node.name() === "PreviewCanvas") {
        continue;
      }
      const pos = node.getPosition();
      node.setPosition({
        x: pos.x + deltaX,
        y: pos.y + deltaY,
      });
    }

    this.mediaLayerRef.batchDraw();
  }

  debug() {
    // DEBUG ONLY
    const rectangle = new Konva.Rect({
      x: this.positionX,
      y: this.positionY,
      width: 100,
      height: 100,
      fill: "green",
      stroke: "black",
      strokeWidth: 1,
      draggable: false,
    });
    this.mediaLayerRef.add(rectangle);
  }

  async sendCanvasPayload(renderTask: RenderTask) {
    if (!this.port) {
      return console.log("Undefined Worker");
    }
    this.port.postMessage(renderTask);
  }

  public placeDebugRect(
    x: number,
    y: number,
    width: number,
    height: number,
    layer: Konva.Layer,
  ): void {
    const rect = new Konva.Rect({
      x: x,
      y: y,
      width: width, // Default width
      height: height, // Default height
      fill: "green",
      draggable: false,
    });

    layer.add(rect);
    layer.draw();
  }

  // This function uses a portion of the video layer to capture just the capture canvas.
  // capture everything after seeking each video node.
  renderPortionOfLayer(
    layer: Konva.Layer,
    x: number,
    y: number,
    width: number,
    height: number,
  ): HTMLCanvasElement {
    const canvas = layer.toCanvas({
      x: x,
      y: y,
      width: width,
      height: height,
    });
    return canvas;
  }

  public isProcessing = false;
  private handleNodeDragEnd = async () => {
    // Clean up any existing state

    await this.render();
  };

  public async addNodes(node: MediaNode) {
    if (
      node instanceof ImageNode ||
      node instanceof TextNode ||
      node instanceof ShapeNode ||
      node instanceof PaintNode ||
      node instanceof PreviewCopyNode
    ) {
      console.debug("Adding node:", node);
      this.imageNodes.push(node);
      console.log(this.imageNodes);
    }

    // ensure the layer doesn't move if added while painting.
    if (this.isEnabled) {
      this.disableDragging();
    }
    // ensure this goes to the top.
    this.previewCanvas.moveToTop();
    await this.render();
  }

  public removeNodes(node: MediaNode) {
    if (node instanceof VideoNode) {
      const index = this.videoNodes.indexOf(node);
      if (index > -1) {
        node.kNode.off("dragend", this.handleNodeDragEnd);
        this.videoNodes.splice(index, 1);
      }
    } else if (
      node instanceof ImageNode ||
      node instanceof TextNode ||
      node instanceof ShapeNode ||
      node instanceof PaintNode ||
      node instanceof PreviewCopyNode
    ) {
      const index = this.imageNodes.indexOf(node);
      if (index > -1) {
        node.kNode.off("dragend", this.handleNodeDragEnd);
        this.imageNodes.splice(index, 1);
      }
    }
  }

  private cloneStageForRender(stage: Konva.Stage, layerOfInterest: Konva.Layer): Konva.Stage {
    const stageClone = new Konva.Stage({
      width: stage.width(),
      height: stage.height(),
      container: this.offscreenRenderDiv,
    });

    const renderLayer = new Konva.Layer();

    // Clone all the nodes then reset them to render right
    layerOfInterest.getChildren().forEach((node) => {
      const dupNode = node.clone();
      dupNode.strokeWidth(0);
      renderLayer.add(dupNode);
    });

    stageClone.add(renderLayer);

    return stageClone;
  }

  private async renderFrame(config: {
    layerOfInterest: Konva.Layer; // layer where the element that you want to clip lives.
    // XY and height of a captureCanvas ( region of interest )
    x?: number; // x position of the region of interest
    y?: number; // y position of the region of interest
    width?: number; // size of the region of interest
    height?: number; // size of the region of interest
    pixelRatio?: number; // higher means higher quality
    mimeType?: string; // image/jpeg or image/png
    quality?: number; // 1.0 is the best.
    test: boolean; // true == blob else Image Bitmap
  }): Promise<ImageBitmap | Blob> {
    try {
      const box = config.layerOfInterest.getClientRect();
      const stage = config.layerOfInterest.getStage();

      const x = config.x !== undefined ? config.x : Math.floor(box.x);
      const y = config.y !== undefined ? config.y : Math.floor(box.y);
      const pixelRatio = config.pixelRatio || 1;

      // Clone the required layer from the stage
      // Set the right details (like removing highlight stroke)
      // Then render the cloned stage to a bitmap
      const stageClone = this.cloneStageForRender(stage, config.layerOfInterest);
      const stageBlob = await stageClone.toBlob({
        x: x,
        y: y,
        width: config.width || Math.ceil(box.width),
        height: config.height || Math.ceil(box.height),
        pixelRatio: pixelRatio,
      }) as Blob;

      // if config.test is true, the result is downloaded to the local files
      // config.test = true;
      if (config.test) {
        await FileUtilities.blobToFileJpeg(stageBlob, "1");
      }

      const result = await createImageBitmap(stageBlob);
      return result;
    } catch (error) {
      throw error;
    }
  }

  private async imageBitmapToBase64(imageBitmap: ImageBitmap): Promise<string> {
    // Create a temporary canvas
    const canvas = document.createElement("canvas");
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    // Draw the ImageBitmap onto the canvas
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");

    ctx.drawImage(imageBitmap, 0, 0);

    // Convert to base64
    const base64String = canvas.toDataURL("image/png");

    // Clean up
    canvas.remove();

    // Remove the data:image/png;base64, prefix if you want just the base64 string
    return base64String.split(",")[1];
  }

  public async saveOutput() {
    if (!this.outputBitmap) {
      console.error("No output bitmap available to save");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = this.outputBitmap.width;
      canvas.height = this.outputBitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get 2D context");

      ctx.drawImage(this.outputBitmap, 0, 0);
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png");
      });

      await FileUtilities.blobToFileJpeg(blob, "output");
    } catch (error) {
      console.error("Error saving output:", error);
    }
  }

  public async render() {
    // only pick nodes that intersect wi th the canvas on screen bounds to freeze.
    if (this.isProcessing) {
      console.log("isProcessing Returning");
      return;
    }
    console.log("Calling Render");
    this.isProcessing = true;

    this.mediaLayerRef.draw();
    // Output all nodes in mediaLayerRef
    const nodes = this.mediaLayerRef.getChildren();
    console.log("All nodes in mediaLayer:", nodes);
    console.log(
      `context: x:${this.positionX} y:${this.positionY} ${this.width} x ${this.height}`,
    );

    const bitmap = (await this.renderFrame({
      layerOfInterest: this.mediaLayerRef,
      x: this.captureCanvas.x(),
      y: this.captureCanvas.y(),
      width: this.width,
      height: this.height,
      mimeType: "image/jpeg",
      pixelRatio: 1,
      quality: 1.0,
      test: false,
    })) as ImageBitmap;

    // Test code
    if (false) {
      this.outputBitmap = bitmap;
      this.previewCanvas.image(bitmap);
      const base64Bitmap = await this.imageBitmapToBase64(bitmap);
      console.log(this.currentStrength);
      await this.client?.generateImage({
        image: base64Bitmap,
        prompt: this.currentPrompt,
        strength: this.currentStrength,
        guidance_scale: 2,
        num_inference_steps: 4,
        height: 1024,
        width: 1024,
        lora_strength: 1.0,
      });
      this.isProcessing = false
      return;
    }

    try {
      const base64Bitmap = await this.imageBitmapToBase64(bitmap);

      const base64BitmapResponse = await invoke("infer_image", {
        image: base64Bitmap,
        prompt: this.currentPrompt,
        strength: this.currentStrength * 100,
      });

      //console.log(base64BitmapResponse);
      const decoded = await DecodeBase64ToImage(
        base64BitmapResponse as string,
      );

      this.outputBitmap = decoded;
      this.previewCanvas.image(decoded);
    } catch (error) {
      console.error("Error during image processing:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Add getter/setter for brush size
  public set paintBrushSize(size: number) {
    this.brushSize = size * 7.5;
    const stage = this.mediaLayerRef.getStage();
    if (stage && this.isEnabled) {
      this.updateCursor(stage);
    }
  }

  public get paintBrushSize(): number {
    return this.brushSize;
  }

  // Add method to check connection status
  public isServerConnected(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Add method to reconnect if needed
  public async reconnect() {
    if (this.client) {
      this.client.ws.close();
    }
    await this.startServer();
  }

  // Add method to create or update background
  public updateBackground(color: string) {
    this.captureCanvas.fill(color);

    const captureCanvasImage = this.captureCanvas.toDataURL();
    const imageSource = new Image();
    imageSource.src = captureCanvasImage;

    imageSource.onload = () => {
      this.backgroundRasterRect.fill(color);
      this.backgroundRasterRect.image(imageSource)

      this.mediaLayerRef.batchDraw();
      this.render();
    };


  }
}
