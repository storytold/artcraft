"use client";

import { forwardRef, useCallback } from "react";
import { useSelectionContext } from "./context";
import { SELECTABLE_ITEM_ATTRIBUTE } from "./attributes";
import type { SelectableItemProps } from "./types";
import { cn } from "../utils/ui";

function setForwardedRef<T>({
  ref,
  value,
}: {
  ref: React.ForwardedRef<T>;
  value: T | null;
}) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
}

export const SelectableItem = forwardRef<HTMLDivElement, SelectableItemProps>(
  function SelectableItem(
    {
      id,
      children,
      className,
      onClick,
      onKeyDown,
      onMouseDown,
      onContextMenu,
      tabIndex,
      ...rest
    }: SelectableItemProps,
    forwardedRef,
  ) {
    const {
      highlightedId,
      isBoxSelecting,
      isSelected,
      handleItemClick,
      handleItemMouseDown,
      registerItem,
    } = useSelectionContext();
    const isItemSelected = isSelected(id);
    const isItemHighlighted = highlightedId === id;
    const stateClassName = cn(
      "relative",
      isBoxSelecting && "pointer-events-none",
      isItemSelected && "ring-1 ring-primary rounded-sm bg-primary/10",
      isItemHighlighted &&
        (isItemSelected
          ? "rounded-sm shadow-[0_0_0_1px_hsl(var(--primary))]"
          : "ring-1 ring-primary/60 rounded-sm bg-primary/5"),
    );

    const handleRef = useCallback(
      (element: HTMLDivElement | null) => {
        registerItem(id, element);
        setForwardedRef({ ref: forwardedRef, value: element });
      },
      [forwardedRef, id, registerItem],
    );

    return (
      <div
        ref={handleRef}
        className={cn(stateClassName, className)}
        {...{ [SELECTABLE_ITEM_ATTRIBUTE]: "true" }}
        role="option"
        aria-selected={isItemSelected}
        tabIndex={tabIndex ?? 0}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) {
            return;
          }

          handleItemClick({ event, id });
        }}
        onMouseDown={(event) => {
          onMouseDown?.(event);
          if (event.defaultPrevented) {
            return;
          }

          handleItemMouseDown({ event, id });
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.target !== event.currentTarget) {
            return;
          }

          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }

          event.preventDefault();
          handleItemClick({ event, id });
        }}
        onContextMenu={onContextMenu}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
