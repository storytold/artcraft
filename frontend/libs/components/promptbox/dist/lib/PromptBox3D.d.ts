import { PopoverItem } from '@storyteller/ui-popover';
import { CameraAspectRatio, Camera, FocalLengthDragging, UploadImageArgs } from '@storyteller/common';
import { Signal } from '@preact/signals-react';
import { ImageModel } from '@storyteller/model-list';
interface PromptBox3DProps {
    cameras: Signal<Camera[]>;
    cameraAspectRatio: Signal<CameraAspectRatio>;
    disableHotkeyInput: (level: number) => void;
    enableHotkeyInput: (level: number) => void;
    gridVisibility: Signal<boolean>;
    setGridVisibility: (isVisible: boolean) => void;
    selectedCameraId: Signal<string>;
    deleteCamera: (id: string) => void;
    focalLengthDragging: Signal<FocalLengthDragging>;
    isPromptBoxFocused: Signal<boolean>;
    uploadImage: (arg: UploadImageArgs) => Promise<void>;
    handleCameraSelect: (item: PopoverItem) => void;
    handleAddCamera: () => void;
    handleCameraNameChange: (id: string, newName: string) => void;
    handleCameraFocalLengthChange: (id: string, value: number) => void;
    onAspectRatioSelect: (newRatio: CameraAspectRatio) => void;
    setEnginePrompt: (prompt: string) => void;
    selectedImageModel?: ImageModel;
    snapshotCurrentFrame: ((shouldDownload?: boolean) => {
        base64Snapshot: string;
        file: File;
    } | null) | undefined;
}
export declare const PromptBox3D: ({ cameras, cameraAspectRatio, disableHotkeyInput, enableHotkeyInput, gridVisibility, setGridVisibility, selectedCameraId, deleteCamera, focalLengthDragging, isPromptBoxFocused, uploadImage, handleCameraSelect, handleAddCamera, handleCameraNameChange, handleCameraFocalLengthChange, onAspectRatioSelect, setEnginePrompt, selectedImageModel, snapshotCurrentFrame, }: PromptBox3DProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=PromptBox3D.d.ts.map