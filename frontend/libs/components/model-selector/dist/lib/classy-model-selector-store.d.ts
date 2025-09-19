import { ModelPage } from './model-pages';
import { ImageModel, Model, VideoModel } from '@storyteller/model-list';
interface ClassyModelSelectorState {
    selectedModels: {
        [page in ModelPage]?: Model;
    };
    setSelectedModel: (page: ModelPage, model: Model) => void;
}
export declare const useClassyModelSelectorStore: import('zustand').UseBoundStore<import('zustand').StoreApi<ClassyModelSelectorState>>;
export declare const getSelectedImageModel: (page: ModelPage) => ImageModel | undefined;
export declare const getSelectedVideoModel: (page: ModelPage) => VideoModel | undefined;
export {};
//# sourceMappingURL=classy-model-selector-store.d.ts.map