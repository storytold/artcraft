// Typed event protocol for the 3D engine.
//
// Architecture (Command/polymorphism — same shape as engine/editor/
// actions/UndoableAction): one class per event kind. Engine sites emit
// `bus.emit(new SelectionChangedEvent(...))`; EngineStoreBridge is the
// single subscriber that translates events to Zustand store mutations.
// Adding a new event kind = one new class file here + one new branch
// in EngineStoreBridge.handle. No other files change.
//
// Engine code never imports the Zustand store; emitting events is the
// only way for the engine to push state changes outward.

import type { CameraAspectRatio, EditorStates } from "../../enums";
import type {
  ObjectPanelObject,
  OutlinerItem,
  PoseMode,
  SceneObject,
  SelectedSceneObject,
  TransformMode,
  TransformSpace,
} from "../../PageSceneStore";
import type { Camera } from "@storyteller/common";

export abstract class EngineEvent {
  readonly timestamp: number = performance.now();
}

// ─── lifecycle ────────────────────────────────────────────────────────

export class EngineInitializedEvent extends EngineEvent {
  constructor(readonly initialized: boolean) {
    super();
  }
}

export class SceneLoadedEvent extends EngineEvent {
  constructor(readonly loaded: boolean) {
    super();
  }
}

export class SceneResetEvent extends EngineEvent {}

// ─── selection / inspector ─────────────────────────────────────────────

export class SelectionChangedEvent extends EngineEvent {
  constructor(readonly selection: SelectedSceneObject | null) {
    super();
  }
}

export class InspectorPanelChangedEvent extends EngineEvent {
  constructor(readonly panel: ObjectPanelObject | null) {
    super();
  }
}

// ─── scene tree ────────────────────────────────────────────────────────

export class ObjectAddedEvent extends EngineEvent {
  constructor(readonly object: SceneObject) {
    super();
  }
}

export class ObjectRemovedEvent extends EngineEvent {
  constructor(readonly uuid: string) {
    super();
  }
}

export class OutlinerRefreshedEvent extends EngineEvent {
  constructor(readonly items: OutlinerItem[]) {
    super();
  }
}

export class OutlinerSelectedItemChangedEvent extends EngineEvent {
  constructor(readonly item: OutlinerItem | null) {
    super();
  }
}

export class OutlinerItemLockToggledEvent extends EngineEvent {
  constructor(readonly uuid: string) {
    super();
  }
}

export class OutlinerItemVisibilityToggledEvent extends EngineEvent {
  constructor(readonly uuid: string) {
    super();
  }
}

// ─── mode / transform / overlays ──────────────────────────────────────

export class TransformModeChangedEvent extends EngineEvent {
  constructor(readonly mode: TransformMode) {
    super();
  }
}

export class TransformSpaceChangedEvent extends EngineEvent {
  constructor(readonly space: TransformSpace) {
    super();
  }
}

export class SelectedModeChangedEvent extends EngineEvent {
  constructor(readonly mode: string) {
    super();
  }
}

export class EditorStateChangedEvent extends EngineEvent {
  constructor(readonly state: EditorStates) {
    super();
  }
}

export class EditorLoaderEvent extends EngineEvent {
  constructor(readonly visible: boolean, readonly message?: string) {
    super();
  }
}

export class PoseControlsVisibilityChangedEvent extends EngineEvent {
  constructor(readonly visible: boolean) {
    super();
  }
}

export class PoseModeChangedEvent extends EngineEvent {
  constructor(readonly mode: PoseMode) {
    super();
  }
}

export class AssetModalVisibilityChangedEvent extends EngineEvent {
  constructor(
    readonly visible: boolean,
    readonly visibleDuringDrag: boolean,
  ) {
    super();
  }
}

export class GridVisibleChangedEvent extends EngineEvent {
  constructor(readonly visible: boolean) {
    super();
  }
}

// ─── camera ────────────────────────────────────────────────────────────

export class CameraAspectRatioChangedEvent extends EngineEvent {
  constructor(readonly ratio: CameraAspectRatio) {
    super();
  }
}

export class CamerasReplacedEvent extends EngineEvent {
  constructor(readonly cameras: Camera[]) {
    super();
  }
}

export class SelectedCameraChangedEvent extends EngineEvent {
  constructor(readonly cameraId: string) {
    super();
  }
}

export class CameraUpdatedEvent extends EngineEvent {
  constructor(
    readonly cameraId: string,
    readonly updates: Partial<Camera>,
  ) {
    super();
  }
}
