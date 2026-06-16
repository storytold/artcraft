import { ChangeEvent, useContext, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleXmark,
  faEye,
  faEyeSlash,
  faListTree,
  faLock,
  faLockOpen,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { Input } from "@storyteller/ui-input";
import { Button } from "@storyteller/ui-button";
import { Transition } from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { useSignals } from "@preact/signals-react/runtime";
import { EngineContext } from "../../contexts/EngineContext";
import { OutlinerItem, usePageSceneStore } from "../../PageSceneStore";
import { useViewportSize } from "../../hooks/useViewportSize";
import { CameraAspectRatio } from "../../enums";
import { toggleObjectLock } from "../../actions/toggleObjectLock";
import { toggleObjectVisibility } from "../../actions/toggleObjectVisibility";

const OutlinerRow = ({ item }: { item: OutlinerItem }) => {
  const [hovered, setHovered] = useState(false);
  const isSelected = usePageSceneStore(
    (s) => s.outlinerSelectedItem?.id === item.id,
  );

  const editorEngine = useContext(EngineContext);

  // Delete object logic here
  const handleDeleteKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Delete") {
      //console.log("Delete key pressed for item:", item.id);
    }
  };

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

  return (
    <div
      role="button"
      className={twMerge(
        "flex cursor-pointer justify-between px-4 py-[7px] text-[13px] font-normal text-white/80 outline-none transition-all duration-100 hover:bg-action-900/35 focus:outline-none",
        isSelected &&
          "bg-brand-primary/80 font-medium text-white hover:bg-brand-primary/80",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleDeleteKeyPress}
      onClick={handleSelect}
      tabIndex={0}
    >
      <span className="flex items-center gap-2.5">
        <div className="flex w-4 items-center justify-center">
          <FontAwesomeIcon icon={item.icon} />
        </div>
        {item.name}
      </span>
      <div className="flex gap-3">
        <button
          onClick={handleToggleLock}
          style={{
            opacity: hovered || item.locked ? 1 : 0,
          }}
        >
          <div className="w-3">
            <FontAwesomeIcon
              icon={item.locked ? faLock : faLockOpen}
              className="opacity-80 transition-opacity duration-100 hover:opacity-100"
            />
          </div>
        </button>
        <button
          onClick={handleToggleVisibility}
          style={{
            opacity: hovered || !item.visible ? 1 : 0,
          }}
        >
          <div className="w-4">
            <FontAwesomeIcon
              icon={item.visible ? faEye : faEyeSlash}
              className={twMerge(
                "opacity-80 transition-opacity duration-100 hover:opacity-100",
                item.locked && "text-white/90",
              )}
            />
          </div>
        </button>
      </div>
    </div>
  );
};

export const Outliner = () => {
  useSignals();
  const camAspect = usePageSceneStore((s) => s.cameraAspectRatio);
  const items = usePageSceneStore((s) => s.outlinerItems);
  const showing = usePageSceneStore((s) => s.outlinerShowing);
  const [searchTerm, setSearchTerm] = useState("");
  const [editorHeight, setEditorHeight] = useState(0);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Filter items based on search term
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const viewport = useViewportSize();
  useEffect(() => {
    setEditorHeight(viewport.height - 56);
  }, [viewport.height]);

  const getOutlinerHeightClass = () => {
    if (viewport.width >= 2000) {
      if (camAspect === CameraAspectRatio.VERTICAL_9_16) {
        return `${editorHeight * 0.5 - 120}px`;
      } else if (camAspect === CameraAspectRatio.SQUARE_1_1) {
        return `${editorHeight * 0.42}px`;
      } else {
        return `${editorHeight * 0.54}px`;
      }
    }

    if (camAspect === CameraAspectRatio.VERTICAL_9_16) {
      return `${editorHeight * 0.7 - 10}px`;
    } else if (camAspect === CameraAspectRatio.SQUARE_1_1) {
      return `${editorHeight * 0.7}px`;
    } else {
      return `${editorHeight * 0.7}px`;
    }
  };

  return (
    <Transition
      as="div"
      show={showing}
      className={twMerge(
        "glass flex max-h-[34vh] w-[240px] origin-bottom-left flex-col overflow-hidden rounded-lg shadow-lg",
      )}
      style={{ height: getOutlinerHeightClass() }}
      enter="transition-opacity duration-150"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="flex items-center px-4 pt-3">
        <h1 className="grow text-base font-semibold">
          <FontAwesomeIcon icon={faListTree} className="mb-0 mr-2" />
          Outliner
        </h1>
        <Button
          icon={faXmark}
          className="h-5 bg-transparent p-0 text-xl opacity-50 hover:bg-transparent hover:opacity-90"
          onClick={() => {
            usePageSceneStore.getState().setOutlinerShowing(false);
          }}
        />
      </div>

      <div className="relative mx-4 my-2.5">
        <Input
          inputClassName="h-8 rounded-lg text-sm pr-8"
          placeholder="Search..."
          value={searchTerm}
          onInput={handleSearchChange}
        />
        {searchTerm && (
          <FontAwesomeIcon
            icon={faCircleXmark}
            className="absolute right-2 top-1/2 -translate-y-1/2 transform cursor-pointer opacity-50 transition-all duration-100 hover:opacity-100"
            onClick={clearSearch}
          />
        )}
      </div>

      <div className="grow overflow-auto">
        {filteredItems.map((item) => (
          <OutlinerRow key={item.id} item={item} />
        ))}
      </div>
    </Transition>
  );
};
