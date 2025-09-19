import { ModelCreator } from 'src/index.js';
import { Model, ModelKind } from './Model.js';
import { ModelCategory } from '../legacy/ModelConfig.js';
import { ModelTag } from './metadata/ModelTag.js';
export declare class ImageModel extends Model {
    readonly kind: ModelKind;
    readonly maxGenerationCount: number;
    readonly defaultGenerationCount: number;
    readonly canEditImages: boolean;
    readonly usesInpaintingMask: boolean;
    readonly canUseImagePrompt: boolean;
    readonly maxImagePromptCount: number;
    constructor(args: {
        id: string;
        tauriId: string;
        fullName: string;
        category: ModelCategory;
        creator: ModelCreator;
        selectorName: string;
        selectorDescription: string;
        selectorBadges: string[];
        maxGenerationCount: number;
        defaultGenerationCount: number;
        canEditImages?: boolean;
        usesInpaintingMask?: boolean;
        canUseImagePrompt?: boolean;
        maxImagePromptCount?: number;
        tags?: ModelTag[];
    });
}
//# sourceMappingURL=ImageModel.d.ts.map