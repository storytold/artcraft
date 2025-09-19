import { ModelCreator } from './metadata/ModelCreator.js';
import { ModelCategory, ModelConfig } from '../legacy/ModelConfig.js';
import { ModelTag } from './metadata/ModelTag.js';
export type ModelKind = "model" | "image_model" | "video_model";
export declare class Model {
    readonly kind: ModelKind;
    readonly id: string;
    readonly tauriId: string;
    readonly fullName: string;
    readonly category: ModelCategory;
    readonly creator: ModelCreator;
    readonly selectorName: string;
    readonly selectorDescription: string;
    readonly selectorBadges: string[];
    readonly tags: ModelTag[];
    protected constructor(args: {
        id: string;
        tauriId: string;
        fullName: string;
        category: ModelCategory;
        creator: ModelCreator;
        selectorName: string;
        selectorDescription: string;
        selectorBadges: string[];
        tags?: ModelTag[];
    });
    toLegacyBadges(): {
        label: string;
    }[];
    toLegacyModelConfig(): ModelConfig;
}
//# sourceMappingURL=Model.d.ts.map