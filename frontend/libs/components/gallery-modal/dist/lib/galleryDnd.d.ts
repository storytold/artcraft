import { GalleryItem } from './gallery-modal';
interface DragState {
    item: GalleryItem | null;
    isDragging: boolean;
    startX: number;
    startY: number;
    currX: number;
    currY: number;
}
declare function onPointerDown(event: React.PointerEvent, item: GalleryItem): void;
export declare const IMAGE_DROP_EVENT = "gallery-image-drop";
export declare function emitImageDrop(item: GalleryItem, position: {
    x: number;
    y: number;
}): void;
export declare function onImageDrop(callback: (item: GalleryItem, position: {
    x: number;
    y: number;
}) => void): (e: any) => void;
export declare function removeImageDropListener(handler: (e: any) => void): void;
declare function getDragState(): DragState;
declare const galleryDnd: {
    onPointerDown: typeof onPointerDown;
    getDragState: typeof getDragState;
};
export default galleryDnd;
//# sourceMappingURL=galleryDnd.d.ts.map