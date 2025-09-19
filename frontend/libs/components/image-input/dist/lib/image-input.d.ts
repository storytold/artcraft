export interface ImageFile {
    id: string;
    url: string;
    file: File;
    mediaToken?: string;
}
export interface ImageInputProps {
    /** Selected image */
    value?: ImageFile | null;
    /** Callback when image is selected or removed */
    onChange: (image: ImageFile | null) => void;
    /** Handler for opening gallery modal */
    onGalleryOpen?: () => void;
    /** Show gallery button */
    showGalleryButton?: boolean;
    /** Custom placeholder text */
    placeholderText?: string;
    /** Additional class names */
    className?: string;
}
export declare function ImageInput({ value, onChange, onGalleryOpen, showGalleryButton, placeholderText, className, }: ImageInputProps): import("react/jsx-runtime").JSX.Element;
export default ImageInput;
//# sourceMappingURL=image-input.d.ts.map