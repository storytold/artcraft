import { ModelInfo } from './ModelInfo.js';
import { ModelTag } from '../classes/metadata/ModelTag.js';
export type ModelCategory = "image" | "video";
export interface ModelCapabilities {
    maxGenerationCount: number;
    defaultGenerationCount?: number;
}
export interface ModelConfig {
    id: string;
    label: string;
    description?: string;
    badges?: {
        label: string;
    }[];
    category: ModelCategory;
    info: ModelInfo;
    capabilities: ModelCapabilities;
    tags?: (ModelTag | string)[];
}
//# sourceMappingURL=ModelConfig.d.ts.map