import React from "react";
import * as THREE from "three";
import { MediaItem } from "../models";
import { usePageSceneStore } from "../PageSceneStore";
import { AssetType, ToastTypes } from "../enums";
import type Editor from "../engine/editor";
import { pickDropPosition } from "../engine/pickDropPosition";
import { DEFAULT_TIMELINE_FPS } from "../engine/timeline/types";
import {
  fractionToTime,
  quantizeToFrame,
} from "../comps/Timeline/timelineUtils";
import {
  addCharacter,
  addClipToCharacter,
  addObject,
  addShape,
} from "../actions";

// Top-of-page Y exclusion for the host's TopBar — drops above this
// pixel cutoff are rejected. Stable for the artcraft layout; if a
// future host needs a different value the dnd-asset would gain a
// dropTop deps callback. Today it's a constant.
const TOP_BAR_PX = 69;

// Timeline character rows tag themselves with this attribute so an animation
// drag can drop a clip at a precise time on a specific character's row.
const CLIP_DROP_ATTR = "data-clip-drop-uuid";
// The timeline ruler carries this tag; its rect maps pointer-x → time.
const TIMELINE_RULER_SELECTOR = "[data-timeline-ruler]";

// Hover-validation throttle for animation drags (raycast + DOM hit-test).
const HOVER_CHECK_MS = 33;

// Where an animation drag would land: a character row in the timeline (with a
// pointer-derived time) or a character in the 3D scene (time 0 → the clip
// snaps to the earliest free slot on the row).
interface AnimationDropTarget {
  characterUuid: string;
  time: number;
}

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

  // Animation-drag state. The node names a clip's tracks address are cached
  // across drags (they never change for a media id); compatibility verdicts
  // are cached per hovered character for the current drag only.
  private clipNodeNamesCache = new Map<string, Promise<string[] | null>>();
  // undefined = still loading; null = clip unreadable/has no animation.
  private activeClipNames: string[] | null | undefined = undefined;
  private compatByCharacter = new Map<string, boolean>();
  private lastHoverCheck = 0;

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
      store.setAnimationDropState("none");
      this.notDropText = "";
      if (item.type === AssetType.ANIMATION && editor) {
        this.beginClipInspection(editor, item.media_id);
      }
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
    store.setAnimationDropState("none");
    this.activeClipNames = undefined;
    this.compatByCharacter.clear();
    if (store.reopenAfterDrag) {
      // Refocus the library (un-dim, restore pointer events).
      store.setAssetDraggingUnder(false);
    } else {
      // Close whichever library panel sourced the drag (at most one is open;
      // see openAssetModal/openAnimationsModal). Keep `assetDraggingUnder`
      // true so the panel stays faded-out through the close instead of
      // flashing back up; it's reset when the library is reopened.
      if (store.assetModalVisible) store.setAssetModalVisible(false);
      if (store.animationsModalVisible) store.setAnimationsModalVisible(false);
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
    if (mediaItem && editor && mediaItem.type === AssetType.ANIMATION) {
      // Animations don't land at a world position — they land on a character
      // (scene hover) or on a character's timeline row. Validated against the
      // clip's bone names; a mismatch is rejected with a toast, mirroring the
      // red badge shown during the drag.
      this.dropAnimation(event, mediaItem, editor);
      this.endDrag();
      return;
    }
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
      if (this.isDragging && store.dragItem.type === AssetType.ANIMATION) {
        this.updateAnimationDropState(event);
      }
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

  // ─── animation-clip drags ─────────────────────────────────────────────

  // Per-clip monotonic tokens: a re-drop of the SAME clip while its
  // inspection is still loading supersedes the earlier queued drop (an
  // impatient retry must not double-add), while queued drops of OTHER
  // clips complete independently — a single global token silently
  // cancelled unrelated pending drops.
  private pendingDropTokens = new Map<string, number>();

  // Resolve + complete an animation drop. Silently cancels when nothing
  // droppable is under the cursor; toasts when the target is incompatible or
  // its clip row has no free slot (mirrors the ghost's red badge).
  //
  // If the clip's node names are still loading (a quick drag beats the
  // cold-cache GLB fetch that started on pointer-down), the drop is QUEUED
  // and completes — fully validated — when the inspection resolves. Punting
  // back to the user with a "try again" toast for losing that race was a
  // bug: click-to-add never waits, so drops shouldn't either.
  private dropAnimation(
    event: PointerEvent,
    item: MediaItem,
    editor: Editor,
  ): void {
    const target = this.findAnimationDropTarget(event);
    if (!target) return;
    // Bumped on every drop of this clip — including the synchronous path,
    // so a resolved re-drop also invalidates any stale queued one.
    const token = (this.pendingDropTokens.get(item.media_id) ?? 0) + 1;
    this.pendingDropTokens.set(item.media_id, token);
    if (this.activeClipNames !== undefined) {
      this.completeAnimationDrop(editor, item, target, this.activeClipNames);
      return;
    }
    const inspection = this.clipNodeNamesCache.get(item.media_id);
    if (!inspection) {
      // No inspection in flight (shouldn't happen — pointer-down starts
      // one): add unvalidated, matching the ungated click-to-add path.
      this.completeAnimationDrop(editor, item, target, undefined);
      return;
    }
    void inspection.then((names) => {
      // Superseded by a newer drop of this same clip.
      if (this.pendingDropTokens.get(item.media_id) !== token) return;
      this.completeAnimationDrop(editor, item, target, names);
    });
  }

  // Final validation + insert, decoupled from per-drag state so it can run
  // after endDrag() when the drop was queued. `names`: string[] = validate
  // the bind, null = clip unreadable, undefined = skip validation.
  private completeAnimationDrop(
    editor: Editor,
    item: MediaItem,
    target: AnimationDropTarget,
    names: string[] | null | undefined,
  ): void {
    // A queued drop can resolve after the EngineProvider teardown/recreate
    // footgun replaced the whole Editor: adding the lane to the dead
    // controller would silently lose the clip while the store writes
    // (timeline expand + reveal) fire on the NEW editor's UI.
    if (!editor.isLive) return;
    const root = editor.activeScene.scene.children.find(
      (child) => child.uuid === target.characterUuid,
    );
    if (!root) return; // target left the scene while the clip loaded
    if (names === null) {
      editor.adapter.showToast(
        ToastTypes.ERROR,
        `Couldn't read an animation from "${item.name ?? item.media_id}".`,
      );
      return;
    }
    if (names && !names.some((name) => root.getObjectByName(name))) {
      editor.adapter.showToast(
        ToastTypes.WARNING,
        "This animation doesn't match the character's skeleton.",
      );
      return;
    }
    const laneId = addClipToCharacter(
      editor,
      target.characterUuid,
      item,
      target.time,
    );
    if (!laneId) {
      editor.adapter.showToast(
        ToastTypes.WARNING,
        "No room left on the character's timeline for this clip.",
      );
    }
  }

  // Recompute the ghost's compatibility badge for the cursor position.
  // Throttled: it runs a DOM hit-test plus (over the canvas) a raycast.
  private updateAnimationDropState(event: MouseEvent): void {
    const now = performance.now();
    if (now - this.lastHoverCheck < HOVER_CHECK_MS) return;
    this.lastHoverCheck = now;
    const store = usePageSceneStore.getState();
    const target = this.findAnimationDropTarget(event);
    let state: "checking" | "ok" | "blocked";
    if (!target) {
      state = "blocked";
    } else if (this.activeClipNames === undefined) {
      state = "checking";
    } else if (
      this.activeClipNames !== null &&
      this.characterAcceptsClip(target.characterUuid)
    ) {
      state = "ok";
    } else {
      state = "blocked";
    }
    if (store.animationDropState !== state) {
      store.setAnimationDropState(state);
    }
  }

  // Timeline character row under the cursor first (precise time), then a
  // character hit in the 3D scene (time 0 → earliest free slot on the row).
  private findAnimationDropTarget(
    event: MouseEvent | PointerEvent,
  ): AnimationDropTarget | null {
    const rowTarget = this.timelineRowTarget(event.clientX, event.clientY);
    if (rowTarget) return rowTarget;
    const characterUuid = this.characterUnderPointer(
      event.clientX,
      event.clientY,
    );
    return characterUuid ? { characterUuid, time: 0 } : null;
  }

  private timelineRowTarget(
    clientX: number,
    clientY: number,
  ): AnimationDropTarget | null {
    const editor = this.editor;
    if (!editor) return null;
    const row = document
      .elementFromPoint(clientX, clientY)
      ?.closest?.(`[${CLIP_DROP_ATTR}]`);
    const characterUuid = row?.getAttribute(CLIP_DROP_ATTR);
    if (!characterUuid) return null;
    const timeline = editor.timelineController.getTimeline();
    const ruler = document.querySelector(TIMELINE_RULER_SELECTOR);
    if (!timeline || !ruler) return { characterUuid, time: 0 };
    const rect = ruler.getBoundingClientRect();
    const time = quantizeToFrame(
      fractionToTime((clientX - rect.left) / rect.width, timeline.duration),
      timeline.fps || DEFAULT_TIMELINE_FPS,
    );
    return { characterUuid, time };
  }

  // Find the clip-eligible object the pointer is REALLY on. Two honesty
  // rules the old roots-only raycast violated:
  // - Only raycast when the viewport canvas itself is the hit-tested element
  //   under the pointer — over UI chrome (outliner, timeline, top bar) the
  //   badge must not go green and a release must not land "through" the
  //   panel. (The drag ghost and the dragged-from modal are
  //   pointer-transparent during a drag, so they never mask the canvas.)
  // - Raycast against all CONTENT objects (anything with a media id or the
  //   shape marker — editor chrome like gizmos, skeleton helpers, grid and
  //   ground never participate), then accept only when the FIRST hit's root
  //   is clip-eligible: a character hidden behind a wall or prop is not a
  //   target, matching the regular drop path's front-most-surface semantics.
  private characterUnderPointer(
    clientX: number,
    clientY: number,
  ): string | null {
    const editor = this.editor;
    if (!editor) return null;
    const camera = editor.cameraController.camera;
    const canvas = editor.renderer?.domElement;
    if (!camera || !canvas) return null;
    if (document.elementFromPoint(clientX, clientY) !== canvas) return null;
    const store = usePageSceneStore.getState();
    const scene = editor.activeScene.scene;
    const candidateIds = new Set<string>();
    for (const character of store.characters) candidateIds.add(character.id);
    for (const item of store.outlinerItems) {
      if (item.hasSkeleton) candidateIds.add(item.id);
    }
    if (candidateIds.size === 0) return null;
    const contentRoots = scene.children.filter(
      (child) =>
        child.userData?.["media_id"] !== undefined ||
        child.userData?.["isShape"] === true,
    );
    if (contentRoots.length === 0) return null;
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.layers.enable(0);
    raycaster.layers.enable(1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(contentRoots, true);
    if (hits.length === 0) return null;
    // Ascend the first (closest) hit to its top-level root; eligibility of
    // THAT root decides — anything else in front means "occluded".
    let node: THREE.Object3D | null = hits[0].object;
    while (node) {
      if (node.parent === scene) {
        return candidateIds.has(node.uuid) ? node.uuid : null;
      }
      node = node.parent;
    }
    return null;
  }

  // Kick off (or reuse) the clip's node-name inspection for compatibility
  // checks. The loaded GLB itself is not kept — only the set of node names the
  // clip's tracks address; the drop path re-loads the GLB through the lane
  // runtime as before.
  private beginClipInspection(editor: Editor, mediaId: string): void {
    this.activeClipNames = undefined;
    this.compatByCharacter.clear();
    let promise = this.clipNodeNamesCache.get(mediaId);
    if (!promise) {
      promise = editor.activeScene.loadRawGlb(mediaId).then((glb) => {
        const clip = glb?.animations?.[0];
        if (!clip) {
          // Unreadable or animation-less: don't cache, so a transient load
          // failure can retry on the next drag.
          this.clipNodeNamesCache.delete(mediaId);
          return null;
        }
        const names = new Set<string>();
        for (const track of clip.tracks) {
          const nodeName = track.name.split(".")[0];
          if (nodeName) names.add(nodeName);
        }
        return [...names];
      });
      this.clipNodeNamesCache.set(mediaId, promise);
    }
    void promise.then((names) => {
      // Ignore if this drag ended or another item's drag superseded it.
      if (usePageSceneStore.getState().dragItem?.media_id !== mediaId) return;
      this.activeClipNames = names;
      this.compatByCharacter.clear();
    });
  }

  // True when at least one of the clip's tracks resolves to a node under the
  // character — the same direct-bind rule CharacterAnimationManager plays by.
  private characterAcceptsClip(characterUuid: string): boolean {
    const cached = this.compatByCharacter.get(characterUuid);
    if (cached !== undefined) return cached;
    const names = this.activeClipNames;
    if (!names || names.length === 0) return false;
    // Top-level lookup, matching every other target resolution in the
    // pipeline (completeAnimationDrop, the raycast ascent, the engine's
    // findObject): clip targets are always outliner-level roots. A deep
    // traverse here could validate a nested object the drop path can't
    // resolve — green badge, silently lost drop.
    const root = this.editor?.activeScene.scene.children.find(
      (child) => child.uuid === characterUuid,
    );
    const accepts =
      !!root && names.some((name) => root.getObjectByName(name) !== undefined);
    this.compatByCharacter.set(characterUuid, accepts);
    return accepts;
  }
}

const dragAndDrop = new DndAsset();

export default dragAndDrop;
