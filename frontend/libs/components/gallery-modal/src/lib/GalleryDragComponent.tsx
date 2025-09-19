import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import galleryDnd from "./galleryDnd";

export const GalleryDragComponent: React.FC = () => {
  const [dragState, setDragState] = useState(galleryDnd.getDragState());

  useEffect(() => {
    let frame: number;
    function update() {
      setDragState({ ...galleryDnd.getDragState() });
      frame = requestAnimationFrame(update);
    }
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!dragState.isDragging || !dragState.item) return null;

  const { currX, currY, item } = dragState;
  const size = 120;
  const style: React.CSSProperties = {
    left: currX + 1,
    top: currY - size / 2,
  };

  return ReactDOM.createPortal(
    <div
      style={style}
      className="fixed z-[1000] w-[120px] h-[120px] pointer-events-none aspect-square flex flex-col bg-black/70 rounded-xl overflow-hidden shadow-lg cursor-grabbing"
    >
      <img
        src={item.thumbnail || item.fullImage || ""}
        alt={item.label}
        className="pointer-events-none select-none w-full h-full object-cover rounded-xl"
      />
    </div>,
    document.body
  );
};
