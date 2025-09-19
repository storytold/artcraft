import { PopoverItem } from '@storyteller/ui-popover';
export type ModelList = Omit<PopoverItem, "selected">[];
/**
 * IN-PROGRESS MIGRATION (messy for now)
 * We're gradually going to phase out ModelList, ModelConfig, etc.
 * We won't index by name, but rather id, or simply will always have full
 * access to the object directly.
 */
export declare const TEXT_TO_IMAGE_PAGE_MODEL_LIST: ModelList;
export declare const CANVAS_2D_PAGE_MODEL_LIST: ModelList;
export declare const STAGE_3D_PAGE_MODEL_LIST: ModelList;
export declare const IMAGE_EDITOR_PAGE_MODEL_LIST: ModelList;
export declare const IMAGE_TO_VIDEO_PAGE_MODEL_LIST: ModelList;
//# sourceMappingURL=model-selectors-for-pages.d.ts.map