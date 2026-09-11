import { ImageModel } from "@storyteller/model-list";
import { ModelInfo } from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";

export interface PromptEditorProps {
  initialPrompt?: string;
  onPromptChange?: (prompt: string) => void;
  onRandomize?: () => void;
  onVary?: () => void;
  onAIStrengthChange?: (strength: number) => void;
  onAspectRatioChange?: (ratio: AspectRatio) => void;
  onImageStyleChange?: (images: ImageStyle[]) => void;
  onEnqueuePressed?: () => void;
  onFitPressed?: () => void;
  selectedModelInfo?: ModelInfo;
  selectedImageModel?: ImageModel;
  selectedProvider?: GenerationProvider;
}

export type AspectRatio = "1:1" | "3:2" | "2:3";

export interface ImageStyle {
  id: string;
  url: string;
  weight: number;
}

export interface PromptTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  images: ImageStyle[];
  onImageUpdate: (id: string, updates: Partial<ImageStyle>) => void;
  onImageRemove: (id: string) => void;
}

export interface AIStrengthSliderProps {
  value: number;
  onChange: (value: number) => void;
  width?: string | number;
  height?: string | number;
  inset?: boolean;
  className?: string;
}

export interface ControlButtonsProps {
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onStyleClick: () => void;
  onImageStyleClick: () => void;
  onRandomizeClick: () => void;
  onVaryClick: () => void;
}

export interface ImageStyleSelectorProps {
  onImageSelect: (image: File) => void;
}

export interface ImagePreviewProps {
  image: ImageStyle;
  onUpdate: (id: string, updates: Partial<ImageStyle>) => void;
  onRemove: (id: string) => void;
}
