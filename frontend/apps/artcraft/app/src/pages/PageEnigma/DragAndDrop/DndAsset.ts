import React from "react";
import { MediaItem } from "~/pages/PageEnigma/models";
import {
  canDrop,
  currPosition,
  dragItem,
} from "~/pages/PageEnigma/signals";
import { usePageEnigmaStore } from "~/pages/PageEnigma/PageEnigmaStore";
import { pageHeight, pageWidth } from "~/signals";
import { AssetType } from "~/enums";
import type Editor from "~/pages/PageEnigma/Editor/editor";
import {
  addCharacter,
  addObject,
  addShape,
} from "~/pages/PageEnigma/actions";

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
      dragItem.value = item;
      currPosition.value = {
        currX: event.pageX,
        currY: event.pageY,
      };
      this.initX = event.pageX;
      this.initY = event.pageY;
      this.isDragging = false;
      canDrop.value = false;
      this.notDropText = "";
      usePageEnigmaStore.getState().setAssetModalVisibleDuringDrag(false);
      window.addEventListener("pointerup", this.onPointerUp);
      window.addEventListener("pointermove", this.onPointerMove);
    }
  }

  endDrag() {
    if (dragItem.value) {
      dragItem.value = null;
      canDrop.value = false;
      this.overElement = null;
      this.notDropText = "";
      const store = usePageEnigmaStore.getState();
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

    if (!this.isDragging) {
      usePageEnigmaStore.getState().setAssetModalVisibleDuringDrag(true);
      dragItem.value = null;
      currPosition.value = { currX: 0, currY: 0 };
      this.editor = null;
      return;
    }

    const editor = this.editor;
    if (dragItem.value && editor) {
      const positionX = event.pageX;
      const positionY = event.pageY;
      if (this.overCanvas(positionX, positionY)) {
        const mediaItem = dragItem.value;
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
    if (dragItem.value) {
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
      currPosition.value = {
        currX: this.initX + deltaX,
        currY: this.initY + deltaY,
      };
      if (this.overElement) {
        const pos = this.overElement;
        const eventY = event.pageY;
        const inHeight = eventY >= pos.top && eventY <= pos.top + pos.height;
        const eventX = event.pageX;
        const inWidth = eventX >= pos.left && eventX <= pos.left + pos.width;

        if (inHeight && inWidth) {
          return;
        }
        canDrop.value = false;
        this.dropId = "";
        this.overElement = null;
        this.notDropText = "";
      }
    }
  }
}

const dragAndDrop = new DndAsset();

export default dragAndDrop;
