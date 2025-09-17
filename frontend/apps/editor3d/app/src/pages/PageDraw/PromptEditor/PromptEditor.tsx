import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import ImageStyleSelector from "./ImageStyleSelector";
import { PromptEditorProps, ImageStyle } from "./types";
import { PromptBox2D } from "@storyteller/ui-promptbox";
import { uploadImage } from "../../../components/reusable/UploadModalMedia/uploadImage";
import { EncodeImageBitmapToBase64 } from "../utilities/EncodeImageBitmapToBase64";
import { JobProvider, useJobContext } from "../JobContext";

// Set this value on when enqueue is pressed nasty global variable.
import { getCanvasRenderBitmap } from "../../../signals/canvasRenderBitmap";

const PromptEditor: React.FC<PromptEditorProps> = ({
  onImageStyleChange,
  onEnqueuePressed,
  onAspectRatioChange,
  onFitPressed,
  //selectedModelInfo,
  selectedImageModel,
}) => {
  const [images, setImages] = useState<ImageStyle[]>([]);

  const handleImageSelect = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    const newImage: ImageStyle = {
      id: uuidv4(),
      url: imageUrl,
      weight: 0.5,
    };

    const updatedImages = [...images, newImage];
    setImages(updatedImages);
    onImageStyleChange?.(updatedImages);
  };

  return (
    <div className="text-base-fg mx-auto flex w-full max-w-3xl flex-col space-y-2">
      <div className="flex w-full justify-center"></div>

      <JobProvider>
        <PromptBox2D
          uploadImage={uploadImage}
          getCanvasRenderBitmap={getCanvasRenderBitmap}
          EncodeImageBitmapToBase64={EncodeImageBitmapToBase64}
          useJobContext={useJobContext}
          onEnqueuePressed={onEnqueuePressed}
          onAspectRatioChange={onAspectRatioChange}
          onFitPressed={onFitPressed}
          //selectedModelInfo={selectedModelInfo}
          selectedImageModel={selectedImageModel}
        />
      </JobProvider>

      <ImageStyleSelector onImageSelect={handleImageSelect} />
    </div>
  );
};

export default PromptEditor;
