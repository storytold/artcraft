import { useState, useRef, useCallback } from "react";
import { Button } from "@storyteller/ui-button";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faImages, faTrash } from "@fortawesome/pro-solid-svg-icons";
import { toast } from "react-hot-toast";

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

export function ImageInput({
  value,
  onChange,
  onGalleryOpen,
  showGalleryButton = true,
  placeholderText = "Drag and drop an image here",
  className,
}: ImageInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = (file: File) => {
    // Only accept image files
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const newImage: ImageFile = {
        id: Math.random().toString(36).substring(7),
        url: reader.result as string,
        file: file,
      };
      onChange(newImage);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      const file = files[0];
      processImageFile(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  // Enhanced drag and drop handlers for better desktop compatibility
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);

      // Explicitly set effectAllowed to make sure the browser shows the correct drop effect
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    },
    [isDragging]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set isDragging to false if we're leaving the drop target
    // and not entering a child element
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // Debug logging
    console.log("Files dropped:", e.dataTransfer.files);
    console.log("DataTransfer types:", e.dataTransfer.types);

    try {
      // First try the files collection
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0]; // Just take the first file
        console.log("Processing file:", file.name, file.type, file.size);
        processImageFile(file);
        return;
      }

      // Then try the items collection
      const items = e.dataTransfer.items;
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].kind === "file") {
            const file = items[i].getAsFile();
            if (file) {
              console.log("Processing item as file:", file.name);
              processImageFile(file);
              return;
            }
          }
        }
      }

      // If we got here, we couldn't process the drop
      console.log("Could not process dropped content");
      toast.error(
        "Could not process the dropped file. Please try uploading instead."
      );
    } catch (error) {
      console.error("Error processing drop:", error);
      toast.error(
        "Error processing the dropped file. Please try uploading instead."
      );
    }
  }, []);

  return (
    <div className={twMerge("relative", className)}>
      {/* Drag & drop area or image preview */}
      <div
        className={twMerge(
          "mx-auto flex h-60 w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5 p-4 transition-colors",
          isDragging && "border-blue-400 bg-blue-500/10"
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragStart={(e) => e.preventDefault()}
      >
        {value ? (
          <div className="h-full w-full overflow-hidden">
            <img
              src={value.url}
              alt="Selected image"
              className="h-full w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-white/60">
            <FontAwesomeIcon icon={faImages} className="text-2xl mb-2" />
            <p>{placeholderText}</p>

            <div className="flex items-center justify-center gap-2 my-4 w-full">
              <div className="h-[1px] w-12 bg-white/10" />
              <p className="text-sm px-3">or</p>
              <div className="h-[1px] w-12 bg-white/10" />
            </div>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              {showGalleryButton && onGalleryOpen && (
                <Button
                  onClick={onGalleryOpen}
                  variant="secondary"
                  className="flex items-center gap-2 px-2.5 py-1.5 text-sm bg-white/15"
                >
                  <FontAwesomeIcon icon={faImages} />
                  Choose from Library
                </Button>
              )}

              <Button
                onClick={handleUploadClick}
                variant="secondary"
                className="flex items-center gap-2 px-2.5 py-1.5 text-sm bg-white/15"
              >
                <FontAwesomeIcon icon={faUpload} />
                Upload Image
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Action buttons when image is selected */}
      {value && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {showGalleryButton && onGalleryOpen && (
            <Button
              onClick={onGalleryOpen}
              variant="secondary"
              className="flex items-center gap-2 px-2.5 py-1.5 text-sm"
              icon={faImages}
            >
              Choose Different Image
            </Button>
          )}

          <Button
            onClick={handleUploadClick}
            variant="secondary"
            className="flex items-center gap-2 px-2.5 py-1.5 text-sm"
            icon={faUpload}
          >
            Upload Different Image
          </Button>

          <Button
            onClick={() => {
              onChange(null);
              // Reset file input value to allow selecting the same file again
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            variant="destructive"
            className="flex items-center gap-2 px-2.5 py-1.5 text-sm"
            icon={faTrash}
          >
            Remove Image
          </Button>
        </div>
      )}
    </div>
  );
}

export default ImageInput;
