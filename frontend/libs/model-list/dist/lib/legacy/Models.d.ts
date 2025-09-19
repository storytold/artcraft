import { ModelConfig, ModelCapabilities, ModelCategory } from './ModelConfig.js';
import { Model } from '../classes/Model.js';
export declare const getAllModels: () => ModelConfig[];
export declare const getModelsByCategory: (category: ModelCategory) => ModelConfig[];
export declare const getInstructiveImageEditModels: () => ModelConfig[];
export declare const getMaskedInpaintModels: () => ModelConfig[];
export declare const lookupModelByTauriId: (tauriId: string) => ModelConfig | undefined;
export declare const getCapabilitiesForModel: (model?: Model) => ModelCapabilities;
//# sourceMappingURL=Models.d.ts.map