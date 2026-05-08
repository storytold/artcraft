import { Transition } from "@headlessui/react";
import { usePageSceneStore } from "../../PageSceneStore";

export const FocalLengthDisplay = () => {
  const focalLengthDragging = usePageSceneStore((s) => s.focalLengthDragging);

  return (
    <Transition
      show={focalLengthDragging.isDragging}
      enter="transition-opacity duration-200"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2 transform">
        <div className="glass rounded-xl px-5 py-2.5 text-center text-2xl font-bold text-white">
          {focalLengthDragging.focalLength}mm
        </div>
      </div>
    </Transition>
  );
};
