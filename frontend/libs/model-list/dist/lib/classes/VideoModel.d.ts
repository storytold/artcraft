import { ModelCreator } from 'src/index.js';
import { Model, ModelKind } from './Model.js';
import { ModelCategory } from '../legacy/ModelConfig.js';
import { ModelTag } from './metadata/ModelTag.js';
export declare class VideoModel extends Model {
    readonly kind: ModelKind;
    readonly startFrame: boolean;
    readonly endFrame: boolean;
    constructor(args: {
        id: string;
        tauriId: string;
        fullName: string;
        category: ModelCategory;
        creator: ModelCreator;
        selectorName: string;
        selectorDescription: string;
        selectorBadges: string[];
        startFrame: boolean;
        endFrame: boolean;
        tags?: ModelTag[];
    });
}
//# sourceMappingURL=VideoModel.d.ts.map