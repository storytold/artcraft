import React, { useRef, useLayoutEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Tooltip } from "@storyteller/ui-tooltip";

export interface MenuIconItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  imageSrc?: string;
  description?: string;
  large?: boolean;
}

interface MenuIconSelectorProps {
  menuItems: MenuIconItem[];
  activeMenu: string;
  onMenuChange: (menuId: string) => void;
  className?: string;
  disabled?: boolean;
  disabledMessage?: string;
}

export const MenuIconSelector: React.FC<MenuIconSelectorProps> = ({
  menuItems,
  activeMenu,
  onMenuChange,
  className,
  disabled,
  disabledMessage,
}) => {
  const selectedIndex = menuItems.findIndex((item) => item.id === activeMenu);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeStyle, setActiveStyle] = useState({ left: 0, width: 0 });
  const [hoverStyle, setHoverStyle] = useState({ left: 0, width: 0 });

  // Animate active background
  useLayoutEffect(() => {
    if (
      selectedIndex >= 0 &&
      itemsRef.current[selectedIndex] &&
      containerRef.current
    ) {
      const current = itemsRef.current[selectedIndex];
      const containerRect = containerRef.current.getBoundingClientRect();
      const currentRect = current!.getBoundingClientRect();
      setActiveStyle({
        left: currentRect.left - containerRect.left,
        width: currentRect.width,
      });
    }
  }, [selectedIndex, menuItems]);

  // Animate hover background
  useLayoutEffect(() => {
    if (
      hoveredIndex >= 0 &&
      itemsRef.current[hoveredIndex] &&
      containerRef.current
    ) {
      const current = itemsRef.current[hoveredIndex];
      const containerRect = containerRef.current.getBoundingClientRect();
      const currentRect = current!.getBoundingClientRect();
      setHoverStyle({
        left: currentRect.left - containerRect.left,
        width: currentRect.width,
      });
    }
  }, [hoveredIndex, menuItems]);

  // On activeMenu change, reset hoveredIndex if it matches
  React.useEffect(() => {
    setHoveredIndex(-1);
  }, [selectedIndex]);

  const MenuGroupElement = (
    <div
      className={twMerge(
        "w-full flex items-center justify-center relative",
        className,
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div
        ref={containerRef}
        className="relative flex gap-1 rounded-xl px-1 py-0.5 min-w-max bg-ui-panel border border-ui-panel-border"
        style={{ minWidth: 0 }}
        onMouseLeave={() => setHoveredIndex(-1)}
      >
        {/* Active tab background */}
        <div
          className="absolute z-10 rounded-lg bg-primary/25 border-2 border-primary shadow-md transition-all duration-150 ease-in-out -ml-[1px]"
          style={{
            left: activeStyle.left,
            width: activeStyle.width,
            top: 4,
            bottom: 4,
          }}
        />
        {/* Hover background (only if hovering a different tab) */}
        {hoveredIndex !== -1 && hoveredIndex !== selectedIndex && (
          <div
            className="absolute z-20 rounded-lg bg-primary/10 transition-all duration-150 ease-in-out pointer-events-none -ml-[1px]"
            style={{
              left: hoverStyle.left,
              width: hoverStyle.width,
              top: 4,
              bottom: 4,
            }}
          />
        )}
        {menuItems.map((item, idx) => (
          <Tooltip
            key={item.id}
            content={item.label}
            position="bottom"
            delay={100}
            closeOnClick={true}
            className={twMerge(
              "text-sm font-semibold",
              item.large && "text-md"
            )}
            imageSrc={item.imageSrc || undefined}
            description={item.description || undefined}
          >
            <button
              ref={(el) => {
                itemsRef.current[idx] = el;
              }}
              disabled={disabled}
              onClick={() => !disabled && onMenuChange(item.id)}
              onMouseEnter={() => setHoveredIndex(idx)}
              className={twMerge(
                "relative z-30 flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-150 text-base-fg",
                disabled ? "cursor-not-allowed opacity-60" : ""
              )}
              tabIndex={0}
              type="button"
            >
              {item.icon}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {disabled && (
        <Tooltip
          content={disabledMessage ?? "Cannot change menu. Action in progress."}
          position="bottom"
        >
          {MenuGroupElement}
        </Tooltip>
      )}
      {!disabled && MenuGroupElement}
    </>
  );
};

export default MenuIconSelector;
