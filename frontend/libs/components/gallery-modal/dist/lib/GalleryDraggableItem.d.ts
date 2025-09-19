import { default as React } from 'react';
import { GalleryItem } from './gallery-modal';
type ModalMode = "select" | "view";
interface GalleryDraggableItemProps {
    item: GalleryItem;
    mode: ModalMode;
    activeFilter: string;
    selected: boolean;
    onClick: () => void;
    onImageError: () => void;
    disableTooltipAndBadge?: boolean;
    imageFit?: "cover" | "contain";
}
export declare const GalleryDraggableItem: React.FC<GalleryDraggableItemProps>;
export {};
//# sourceMappingURL=GalleryDraggableItem.d.ts.map