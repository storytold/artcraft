import React from "react";
import { MediaItem } from "~/pages/PageScene/models";
import { usePageSceneStore } from "~/pages/PageScene/PageSceneStore";
import { pageHeight, pageWidth } from "~/signals";
import { AssetType } from "~/enums";
import type Editor from "~/pages/PageScene/engine/editor";
import {
  addCharacter,
  addObject,
  addShape,
} from "~/pages/PageScene/actions";

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
      store.setAssetModalVisibleDuringDrag(false);
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
      store.setAssetModalVisibleDuringDrag(store.reopenAfterDrag);
    }
    this.editor = null;
  }

  overCanvas(positionX: number, positionY: number) {
    if (positionY < 69) {
      return false;
    }
    if (positionY > pageHeight.value) {
      return false;
    }
    return positionX <= pageWidth.value;
  }

  onPointerUp(event: PointerEvent) {
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointermove", this.onPointerMove);

    const store = usePageSceneStore.getState();
    if (!this.isDragging) {
      store.setAssetModalVisibleDuringDrag(true);
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
        if (mediaItem.type === AssetType.CHARACTER) {
          void addCharacter(editor, mediaItem);
        } else if (
          mediaItem.type === AssetType.OBJECT ||
          mediaItem.type === AssetType.SPLAT ||
          mediaItem.type === AssetType.SKYBOX
        ) {
          void addObject(editor, mediaItem);
        } else if (mediaItem.type === AssetType.SHAPE) {
          void addShape(editor, mediaItem);
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
        Math.abs(deltaX) > this.dragThreshold ||
        Math.abs(deltaY) > this.dragThreshold
      ) {
        this.isDragging = true;
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
