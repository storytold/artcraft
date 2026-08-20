"use client";

import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Tooltip } from "./tooltip";

/*
 * Ported from @storyteller/ui-tab-selector, rebuilt on native buttons (no
 * headlessui). Squared segmented control: a sliding invert-block indicator
 * behind mono labels.
 */

export interface TabItem {
  id: string;
  label: string;
}

export interface TabSelectorProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  disabled?: boolean;
  disabledMessage?: string;
  tabClassName?: string;
  indicatorClassName?: string;
  selectedTabClassName?: string;
  listClassName?: string;
}

export function TabSelector({
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
}: TabSelectorProps) {
  const selectedIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const currentTab = selectedIndex >= 0 ? tabsRef.current[selectedIndex] : null;
    if (currentTab) {
      setIndicatorStyle({
        left: currentTab.offsetLeft,
        width: currentTab.offsetWidth,
      });
    }
  }, [selectedIndex, tabs]);

  const tabGroup = (
    <div
      className={twMerge(
        "w-fit",
        className,
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <div
        role="tablist"
        className={twMerge(
          "relative inline-flex min-w-fit overflow-x-auto rounded-none border border-line bg-bg-raised p-0.5 py-1",
          listClassName,
        )}
      >
        <div
          aria-hidden
          className={twMerge(
            "absolute top-1 z-10 h-[calc(100%-8px)] rounded-none bg-invert-bg transition-all duration-200 ease-in-out",
            indicatorClassName,
          )}
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />

        {tabs.map((tab, index) => {
          const selected = index === selectedIndex;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabsRef.current[index] = el;
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={disabled}
              onClick={() => onTabChange(tab.id)}
              className={twMerge(
                "relative z-20 mx-0.5 min-w-max rounded-none px-4 py-0.5 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors duration-200 ease-in-out",
                selected
                  ? twMerge("text-invert-fg", selectedTabClassName)
                  : "text-muted hover:text-ink",
                disabled && "cursor-not-allowed",
                tabClassName,
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (disabled) {
    return (
      <Tooltip
        content={disabledMessage ?? "Cannot change tab right now."}
        position="bottom"
      >
        {tabGroup}
      </Tooltip>
    );
  }
  return tabGroup;
}

export default TabSelector;
