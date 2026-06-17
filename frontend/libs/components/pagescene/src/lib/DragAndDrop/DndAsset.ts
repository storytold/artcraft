import React from "react";
import { MediaItem } from "../models";
import { usePageSceneStore } from "../PageSceneStore";
import { AssetType } from "../enums";
import type Editor from "../engine/editor";
import { pickDropPosition } from "../engine/pickDropPosition";
import {
  addCharacter,
  addObject,
  addShape,
} from "../actions";

// Top-of-page Y exclusion for the host's TopBar — drops above this
// pixel cutoff are rejected. Stable for the artcraft layout; if a
// future host needs a different value the dnd-asset would gain a
// dropTop deps callback. Today it's a constant.
const TOP_BAR_PX = 69;

class DndAsset {
  public dropId: string = "";
  public overElement: DOMRect | null = null;
  public dropOffset = 0;
  public initX = 0;
  public initY = 0;
  public notDropText = "";
  public isDragging: boolean = false;
  public dragThreshold: number = 5;
  private editor: Editor | null = null;

  constructor() {
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
  }

  onPointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    item: MediaItem,
    editor: Editor | null,
  ) {
    if (event.button === 0) {
      this.editor = editor;
      const store = usePageSceneStore.getState();
      store.setDragItem(item);
      store.setDragPosition({ currX: event.pageX, currY: event.pageY });
      this.initX = event.pageX;
      this.initY = event.pageY;
      this.isDragging = false;
      store.setCanDrop(false);
      this.notDropText = "";
      window.addEventListener("pointerup", this.onPointerUp);
      window.addEventListener("pointermove", this.onPointerMove);
    }
  }

  endDrag() {
    const store = usePageSceneStore.getState();
    if (store.dragItem) {
      store.setDragItem(null);
      store.setCanDrop(false);
      this.overElement = null;
      this.notDropText = "";
    }
    if (store.reopenAfterDrag) {
      // Refocus the library (un-dim, restore pointer events).
      store.setAssetDraggingUnder(false);
    } else {
      // Close it after adding. Keep `assetDraggingUnder` true so the panel stays
      // faded-out through the close instead of flashing back up; it's reset when
      // the library is reopened.
      store.setAssetModalVisible(false);
    }
    this.isDragging = false;
    this.editor = null;
  }

  overCanvas(positionX: number, positionY: number) {
    // Page dimensions come from the host adapter when supplied;
    // fall back to window so the lib remains usable in plain web
    // hosts that don't drive a `pageWidth`/`pageHeight` signal.
    const size = this.editor?.adapter.getViewportSize?.() ?? {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    if (positionY < TOP_BAR_PX) {
      return false;
    }
    if (positionY > size.height) {
      return false;
    }
    return positionX <= size.width;
  }

  onPointerUp(event: PointerEvent) {
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointermove", this.onPointerMove);

    const store = usePageSceneStore.getState();
    if (!this.isDragging) {
      // A click, not a drag — leave the library as-is, just clear drag state.
      store.setDragItem(null);
      store.setDragPosition({ currX: 0, currY: 0 });
      this.editor = null;
      return;
    }

    const editor = this.editor;
    const mediaItem = store.dragItem;
    if (mediaItem && editor) {
      const positionX = event.pageX;
      const positionY = event.pageY;
      if (this.overCanvas(positionX, positionY)) {
        const worldPosition = pickDropPosition(
          {
            getCamera: () => editor.cameraController.camera,
            getCanvas: () => editor.renderer?.domElement,
            getRaycastTargets: () => editor.activeScene.scene.children,
            removeTransformControls: () =>
              editor.utils.removeTransformControls(true),
          },
          positionX,
          positionY,
        );
        if (mediaItem.type === AssetType.CHARACTER) {
          void addCharacter(editor, mediaItem, worldPosition);
        } else if (
          mediaItem.type === AssetType.OBJECT ||
          mediaItem.type === AssetType.SPLAT ||
          mediaItem.type === AssetType.SKYBOX
        ) {
          void addObject(editor, mediaItem, worldPosition);
        } else if (mediaItem.type === AssetType.SHAPE) {
          void addShape(editor, mediaItem, worldPosition);
        }
      }
    }

    this.endDrag();
  }

  onPointerMove(event: MouseEvent) {
    const store = usePageSceneStore.getState();
    if (store.dragItem) {
      event.stopPropagation();
      event.preventDefault();
      const deltaX = event.pageX - this.initX;
      const deltaY = event.pageY - this.initY;
      if (
        !this.isDragging &&
        (Math.abs(deltaX) > this.dragThreshold ||
          Math.abs(deltaY) > this.dragThreshold)
      ) {
        this.isDragging = true;
        // Let pointer events pass through the library the moment the drag begins.
        // The panel eases to translucent (reopen on) or all the way out (reopen
        // off) via AssetModal's contentDimmed/contentHidden — never abrupt.
        store.setAssetDraggingUnder(true);
      }
      store.setDragPosition({
        currX: this.initX + deltaX,
        currY: this.initY + deltaY,
      });
      if (this.overElement) {
        const pos = this.overElement;
        const eventY = event.pageY;
        const inHeight = eventY >= pos.top && eventY <= pos.top + pos.height;
        const eventX = event.pageX;
        const inWidth = eventX >= pos.left && eventX <= pos.left + pos.width;

        if (inHeight && inWidth) {
          return;
        }
        store.setCanDrop(false);
        this.dropId = "";
        this.overElement = null;
        this.notDropText = "";
      }
    }
  }
}

const dragAndDrop = new DndAsset();

export default dragAndDrop;
