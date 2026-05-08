// EngineStoreBridge — single boundary between the 3D engine and the
// Zustand store. It is the ONLY file inside engine/ that imports
// usePageSceneStore. Engine subsystems emit typed EngineEvents on the
// bus; this bridge subscribes once per event class at construction and
// translates each event into a one-line store mutation.
//
// One handler per event class — no instanceof chains. The bus routes
// each emit to the matching handler set in O(1) (Map lookup), so the
// hot per-frame events (CameraUpdatedEvent, etc.) avoid the linear
// type-guard scan that the old switch-style had.

import { usePageSceneStore } from "../PageSceneStore";
import { EngineEventBus } from "./events/EngineEventBus";
import {
  AssetModalVisibilityChangedEvent,
  CameraAspectRatioChangedEvent,
  CameraUpdatedEvent,
  CamerasReplacedEvent,
  EditorLoaderEvent,
  EditorStateChangedEvent,
  EngineInitializedEvent,
  GridVisibleChangedEvent,
  InspectorPanelChangedEvent,
  ObjectAddedEvent,
  ObjectRemovedEvent,
  OutlinerItemLockToggledEvent,
  OutlinerItemVisibilityToggledEvent,
  OutlinerRefreshedEvent,
  OutlinerSelectedItemChangedEvent,
  PoseControlsVisibilityChangedEvent,
  PoseModeChangedEvent,
  SceneLoadedEvent,
  SceneResetEvent,
  SelectedCameraChangedEvent,
  SelectedModeChangedEvent,
  SelectionChangedEvent,
  TransformModeChangedEvent,
  TransformSpaceChangedEvent,
} from "./events/EngineEvent";

export type EngineStoreBridgeDeps = {
  bus: EngineEventBus;
};

export class EngineStoreBridge {
  private unsubscribeAll: () => void;

  constructor(deps: EngineStoreBridgeDeps) {
    const { bus } = deps;
    const unsubs: Array<() => void> = [
      // selection / inspector
      bus.subscribe(SelectionChangedEvent, (e) =>
        usePageSceneStore.getState().setSelectedObject(e.selection),
      ),
      bus.subscribe(InspectorPanelChangedEvent, (e) => {
        const store = usePageSceneStore.getState();
        if (e.panel) {
          store.updateObjectPanel(e.panel);
          store.showObjectPanel(e.panel);
        } else {
          store.hideObjectPanel();
        }
      }),

      // outliner
      bus.subscribe(OutlinerRefreshedEvent, (e) =>
        usePageSceneStore.getState().setOutlinerItems(e.items),
      ),
      bus.subscribe(OutlinerSelectedItemChangedEvent, (e) =>
        usePageSceneStore.getState().setOutlinerSelectedItem(e.item),
      ),
      bus.subscribe(OutlinerItemLockToggledEvent, (e) =>
        usePageSceneStore.getState().toggleOutlinerLock(e.uuid),
      ),
      bus.subscribe(OutlinerItemVisibilityToggledEvent, (e) =>
        usePageSceneStore.getState().toggleOutlinerVisibility(e.uuid),
      ),

      // scene tree
      bus.subscribe(ObjectAddedEvent, (e) => {
        const store = usePageSceneStore.getState();
        if (e.object.kind === "character") store.addCharacter(e.object);
        else if (e.object.kind === "shape") store.addShape(e.object);
        else store.addObject(e.object);
      }),
      bus.subscribe(ObjectRemovedEvent, (e) =>
        usePageSceneStore.getState().removeSceneObject(e.uuid),
      ),
      bus.subscribe(SceneResetEvent, () =>
        usePageSceneStore.getState().resetScene(),
      ),

      // mode / overlays
      bus.subscribe(TransformModeChangedEvent, (e) =>
        usePageSceneStore.getState().setTransformMode(e.mode),
      ),
      bus.subscribe(TransformSpaceChangedEvent, (e) =>
        usePageSceneStore.getState().setTransformSpace(e.space),
      ),
      bus.subscribe(SelectedModeChangedEvent, (e) =>
        usePageSceneStore.getState().setSelectedMode(e.mode),
      ),
      bus.subscribe(EditorStateChangedEvent, (e) =>
        usePageSceneStore.getState().setEditorState(e.state),
      ),
      bus.subscribe(EditorLoaderEvent, (e) => {
        const store = usePageSceneStore.getState();
        if (e.visible) store.showEditorLoader(e.message);
        else store.hideEditorLoader();
      }),
      bus.subscribe(PoseControlsVisibilityChangedEvent, (e) =>
        usePageSceneStore.getState().setShowPoseControls(e.visible),
      ),
      bus.subscribe(PoseModeChangedEvent, (e) =>
        usePageSceneStore.getState().setPoseMode(e.mode),
      ),
      bus.subscribe(AssetModalVisibilityChangedEvent, (e) => {
        const store = usePageSceneStore.getState();
        store.setAssetModalVisible(e.visible);
        store.setAssetModalVisibleDuringDrag(e.visibleDuringDrag);
      }),
      bus.subscribe(GridVisibleChangedEvent, (e) =>
        usePageSceneStore.getState().setGridVisible(e.visible),
      ),

      // camera
      bus.subscribe(CameraAspectRatioChangedEvent, (e) =>
        usePageSceneStore.getState().setCameraAspectRatio(e.ratio),
      ),
      bus.subscribe(CamerasReplacedEvent, (e) =>
        usePageSceneStore.setState({ cameras: e.cameras }),
      ),
      bus.subscribe(SelectedCameraChangedEvent, (e) =>
        usePageSceneStore.getState().setSelectedCameraId(e.cameraId),
      ),
      bus.subscribe(CameraUpdatedEvent, (e) =>
        usePageSceneStore.getState().updateCamera(e.cameraId, e.updates),
      ),

      // lifecycle
      bus.subscribe(EngineInitializedEvent, (e) =>
        usePageSceneStore.getState().setIs3DEditorInitialized(e.initialized),
      ),
      bus.subscribe(SceneLoadedEvent, (e) =>
        usePageSceneStore.getState().setIs3DSceneLoaded(e.loaded),
      ),
    ];

    this.unsubscribeAll = () => {
      for (const u of unsubs) u();
    };
  }

  dispose(): void {
    this.unsubscribeAll();
  }
}
