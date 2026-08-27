import React, { useRef, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Tooltip } from "@storyteller/ui-tooltip";
import { TabGroup, TabList, Tab } from "@headlessui/react";

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
  /** Extra classes for the pill container (the TabList), e.g. to make the
   *  whole selector fully rounded. */
  listClassName?: string;
}

export const TabSelector: React.FC<TabSelectorProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
  disabled,
  disabledMessage,
  tabClassName,
  indicatorClassName,
  selectedTabClassName,
  listClassName,
}) => {
  // Find the index of the active tab
  const selectedIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const tabsRef = useRef<(HTMLElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });

  // Handle tab change
  const handleTabChange = (index: number) => {
    onTabChange(tabs[index].id);
  };

  // Update the indicator position when the selected tab changes
  useEffect(() => {
    if (selectedIndex >= 0 && tabsRef.current[selectedIndex]) {
      const currentTab = tabsRef.current[selectedIndex];
      if (currentTab) {
        setIndicatorStyle({
          left: (currentTab as HTMLDivElement).offsetLeft,
          width: (currentTab as HTMLDivElement).offsetWidth,
        });
      }
    }
  }, [selectedIndex, tabs]);

  const TabGroupElement = (
    <div
      className={twMerge(
        "w-full",
        className,
        disabled ? "cursor-not-allowed opacity-60" : "",
      )}
    >
      <TabGroup selectedIndex={selectedIndex} onChange={handleTabChange}>
        <TabList
          className={twMerge(
            "glass glass-no-hover relative inline-flex min-w-fit overflow-x-auto rounded-[3px] p-0.5 py-1 !shadow-none",
            listClassName,
          )}
        >
          {/* Animated indicator */}
          <div
            className={twMerge(
              "absolute top-1 z-10 h-[calc(100%-8px)] rounded-[2px] bg-white transition-all duration-200 ease-in-out",
              indicatorClassName,
            )}
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
          />

          {tabs.map((tab, index) => (
            <Tab
              key={tab.id}
              ref={(el) => {
                if (el) {
                  tabsRef.current[index] = el;
                }
              }}
              disabled={disabled}
              className={({ selected }) =>
                twMerge(
                  "relative z-20 mx-0.5 min-w-max rounded-[2px] border-2 border-transparent px-4 py-0.5 text-center text-sm font-semibold transition-all duration-200 ease-in-out",
                  "focus-visible:outline-none focus-visible:ring-0",
                  selected
                    ? twMerge("text-black", selectedTabClassName)
                    : "text-base-fg/70 hover:text-base-fg",
                  disabled ? "cursor-not-allowed opacity-60" : "",
                  tabClassName,
                )
              }
            >
              {tab.label}
            </Tab>
          ))}
        </TabList>
      </TabGroup>
    </div>
  );

  return (
    <>
      {disabled && (
        <Tooltip
          content={
            disabledMessage ?? "Cannot change tab. Generation in progress."
          }
          position="bottom"
        >
          {TabGroupElement}
        </Tooltip>
      )}
      {!disabled && TabGroupElement}
    </>
  );
};

export default TabSelector;
