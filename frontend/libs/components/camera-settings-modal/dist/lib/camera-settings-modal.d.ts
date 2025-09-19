import { PopoverItem } from '@storyteller/ui-popover';
import { Signal } from '@preact/signals-react';
interface ExtendedPopoverItem extends PopoverItem {
    id: string;
    focalLength: number;
    position: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    lookAt: {
        x: number;
        y: number;
        z: number;
    };
}
interface CameraSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    cameras: ExtendedPopoverItem[];
    onCameraNameChange: (id: string, newName: string) => void;
    onCameraFocalLengthChange: (id: string, value: number) => void;
    onAddCamera: () => void;
    selectedCameraId: string;
    handleCameraSelect: (selectedItem: PopoverItem) => void;
    onDeleteCamera: (id: string) => void;
    focalLengthDragging: Signal;
    disableHotkeyInput: (level: number) => void;
    enableHotkeyInput: (level: number) => void;
}
export declare const CameraSettingsModal: ({ isOpen, onClose, cameras, onCameraNameChange, onCameraFocalLengthChange, onAddCamera, selectedCameraId, handleCameraSelect, onDeleteCamera, focalLengthDragging, disableHotkeyInput, enableHotkeyInput, }: CameraSettingsModalProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=camera-settings-modal.d.ts.map