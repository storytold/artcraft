import { default as React } from 'react';
export interface TabItem {
    id: string;
    label: string;
}
interface TabSelectorProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    className?: string;
    disabled?: boolean;
    disabledMessage?: string;
    tabClassName?: string;
    indicatorClassName?: string;
    selectedTabClassName?: string;
}
export declare const TabSelector: React.FC<TabSelectorProps>;
export default TabSelector;
//# sourceMappingURL=tab-selector.d.ts.map