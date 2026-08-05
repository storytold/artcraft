import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightToBracket,
  faBone,
  faEye,
  faEyeSlash,
  faLock,
  faLockOpen,
  faPlus,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { Transition } from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { useSignals } from "@preact/signals-react/runtime";
import { EngineContext } from "../../contexts/EngineContext";
import { OutlinerItem, usePageSceneStore } from "../../PageSceneStore";
import { openAssetModal } from "../../actions/openAssetModal";
import { toggleObjectLock } from "../../actions/toggleObjectLock";
import { toggleObjectVisibility } from "../../actions/toggleObjectVisibility";
import { toggleSkeletonHelper } from "../../actions/toggleSkeletonHelper";
import { toggleCameraView } from "../../actions/cameraView";

const OutlinerRow = ({ item }: { item: OutlinerItem }) => {
  const isSelected = usePageSceneStore(
    (s) => s.outlinerSelectedItem?.id === item.id,
  );

  const editorEngine = useContext(EngineContext);

  // Double click logic here
  const handleDoubleClick = () => {
    editorEngine?.sceneManager?.double_click();
  };

  const handleSelect = () => {
    usePageSceneStore.getState().selectOutlinerItem(item.id);
    editorEngine?.sceneManager?.select_object(item.id);
  };

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editorEngine) return;
    toggleObjectLock(editorEngine, item.id);
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editorEngine) return;
    toggleObjectVisibility(editorEngine, item.id);
  };

  const handleViewFromCamera = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editorEngine) return;
    toggleCameraView(editorEngine);
  };

  const handleToggleSkeleton = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editorEngine) return;
    toggleSkeletonHelper(editorEngine, item.id);
  };

  return (
    <div
      role="button"
      className={twMerge(
        "flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-transparent px-3 py-2 outline-none transition-colors duration-100 hover:bg-white/5 focus:outline-none",
        isSelected &&
          "border-brand-primary bg-brand-primary/15 hover:bg-brand-primary/15",
      )}
      onDoubleClick={handleDoubleClick}
      onClick={handleSelect}
      tabIndex={0}
    >
      <span className="flex min-w-0 items-center gap-3">
        <div className="flex w-5 shrink-0 items-center justify-center text-base text-white/85">
          <FontAwesomeIcon icon={item.icon} />
        </div>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-white">
            {item.name}
          </span>
          <span className="block truncate text-xs text-white/50">
            {item.type}
          </span>
        </span>
      </span>
      <div className="flex shrink-0 items-center gap-3">
        {item.isCamera && (
          <button
            onClick={handleViewFromCamera}
            title="View from camera"
            className="text-white/60 transition-colors duration-100 hover:text-white text-xs"
          >
            <div className="w-3">
              <FontAwesomeIcon icon={faArrowRightToBracket} />
            </div>
          </button>
        )}
        {item.hasSkeleton && (
          /* Editor-only skeleton overlay (never part of renders); state
             persists with the scene. */
          <button
            onClick={handleToggleSkeleton}
            title={item.skeletonVisible ? "Hide skeleton" : "Show skeleton"}
            className={twMerge(
              "text-white/60 transition-colors duration-100 hover:text-white text-xs",
              item.skeletonVisible && "text-white/90",
            )}
          >
            <div className="w-3">
              <FontAwesomeIcon icon={faBone} />
            </div>
          </button>
        )}
        <button
          onClick={handleToggleLock}
          title={item.locked ? "Unlock" : "Lock"}
          className={twMerge(
            "text-white/60 transition-colors duration-100 hover:text-white text-xs",
            item.locked && "text-white/90",
          )}
        >
          <div className="w-3">
            <FontAwesomeIcon icon={item.locked ? faLock : faLockOpen} />
          </div>
        </button>
        <button
          onClick={handleToggleVisibility}
          title={item.visible ? "Hide" : "Show"}
          className={twMerge(
            "text-white/60 transition-colors duration-100 hover:text-white text-xs",
            !item.visible && "text-white/90",
          )}
        >
          <div className="w-3">
            <FontAwesomeIcon icon={item.visible ? faEye : faEyeSlash} />
          </div>
        </button>
      </div>
    </div>
  );
};

export const Outliner = () => {
  useSignals();
  const items = usePageSceneStore((s) => s.outlinerItems);
  const showing = usePageSceneStore((s) => s.outlinerShowing);

  return (
    <Transition
      as="div"
      show={showing}
      className={twMerge(
        "flex h-[45vh] w-[260px] flex-col overflow-hidden rounded-xl border border-ui-panel-border bg-ui-panel shadow-lg",
      )}
      enter="transition-opacity duration-150"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="flex items-center px-4 pb-1 pt-3">
        <h1 className="grow text-base font-semibold">Scene</h1>
        <Button
          icon={faPlus}
          className="h-6 bg-transparent px-1.5 text-sm font-medium text-white/80 hover:bg-transparent hover:text-white"
          onClick={openAssetModal}
        >
          Add
        </Button>
        <Button
          icon={faXmark}
          className="h-5 bg-transparent p-0 text-xl opacity-50 hover:bg-transparent hover:opacity-90"
          onClick={() => {
            usePageSceneStore.getState().setOutlinerShowing(false);
          }}
        />
      </div>

      <div className="grow overflow-auto p-2">
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <OutlinerRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </Transition>
  );
};
