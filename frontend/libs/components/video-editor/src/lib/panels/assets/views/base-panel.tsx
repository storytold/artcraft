import { cn } from "../../../utils/ui";

interface PanelViewProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
  scrollClassName?: string;
  hideHeader?: boolean;
  ref?: React.Ref<HTMLDivElement>;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
  scrollRef?: React.Ref<HTMLDivElement>;
}

export function PanelView({
  title,
  actions,
  children,
  className,
  contentClassName,
  scrollClassName,
  hideHeader = false,
  ref,
  onScroll,
  scrollRef,
  ...rest
}: PanelViewProps) {
  return (
    <div
      className={cn("relative flex h-full flex-col", className)}
      ref={ref}
      {...rest}
    >
      {!hideHeader && (
        <div className="bg-background h-11 shrink-0 pl-3 pr-2 flex items-center justify-between border-b border-ui-panel-border">
          {title && (
            <span className="text-muted-foreground text-sm">{title}</span>
          )}
          {actions}
        </div>
      )}
      <div
        className={cn(
          "scrollbar-hidden size-full overflow-y-auto",
          hideHeader ? "pt-4" : "pt-2",
          scrollClassName,
        )}
        ref={scrollRef}
        onScroll={onScroll}
      >
        <div className={cn("w-full flex-1 px-2 pt-0", contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}
