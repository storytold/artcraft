import { PopoverItem } from '@storyteller/ui-popover';
import { ModelPage } from './model-pages';
interface ClassyModelSelectorProps {
    items: Omit<PopoverItem, "selected">[];
    page: ModelPage;
    mode?: "hoverSelect" | "default" | "toggle" | "button";
    panelTitle?: string;
    buttonClassName?: string;
    panelClassName?: string;
    showIconsInList?: boolean;
    triggerLabel?: string;
}
export declare function ClassyModelSelector({ items, page, ...popoverProps }: ClassyModelSelectorProps): import("react/jsx-runtime").JSX.Element;
export default ClassyModelSelector;
//# sourceMappingURL=classy-model-selector.d.ts.map