import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import ImageStyleSelector from "./ImageStyleSelector";
import { ImageStyle } from "./types";
import { PromptBox2D, PromptBox2DProps } from "@storyteller/ui-promptbox";
import { JobProvider } from "../JobContext";

const PromptEditor: React.FC<PromptBox2DProps> = ({
  uploadImage,
  selectedImageModel,
  selectedProvider,
  EncodeImageBitmapToBase64,
  onGenerateClick,
  isDisabled = false,
  isEnqueueing = false,
  generationCount = 1,
  onGenerationCountChange,
  onAspectRatioChange,
  onFitPressed,
  usePrompt2DStore
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
    // onImageStyleChange?.(updatedImages);
  };

  return (
    <div className="text-base-fg mx-auto flex w-full max-w-3xl flex-col space-y-2">
      <div className="flex w-full justify-center"></div>

      <JobProvider>
        <PromptBox2D
          usePrompt2DStore={usePrompt2DStore}
          uploadImage={uploadImage}
          //selectedModelInfo={selectedModelInfo}
          selectedImageModel={selectedImageModel}
          selectedProvider={selectedProvider}
          EncodeImageBitmapToBase64={EncodeImageBitmapToBase64}
          onGenerateClick={onGenerateClick}
          isDisabled={isDisabled}
          isEnqueueing={isEnqueueing}
          generationCount={generationCount}
          onGenerationCountChange={onGenerationCountChange}
          onAspectRatioChange={onAspectRatioChange}
          onFitPressed={onFitPressed}
        />
      </JobProvider>

      <ImageStyleSelector onImageSelect={handleImageSelect} />
    </div>
  );
};

export default PromptEditor;
