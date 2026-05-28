"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "../../utils/ui";

type TabsVariant = "default" | "underline";

const TabsVariantContext = React.createContext<TabsVariant>("default");

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & {
    variant?: TabsVariant;
  }
>(({ variant = "default", ...props }, ref) => (
  <TabsVariantContext.Provider value={variant}>
    <TabsPrimitive.Root ref={ref} {...props} />
  </TabsVariantContext.Provider>
));
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "text-muted-foreground inline-flex h-auto items-center gap-0 bg-transparent p-0",
        variant === "default" && "rounded-lg",
        variant === "underline" && "border-b border-border w-full gap-0 px-2",
        className,
      )}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "ring-offset-background focus-visible:ring-ring inline-flex cursor-pointer items-center justify-center text-sm font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
        variant === "default" &&
          "border border-transparent data-[state=active]:bg-secondary data-[state=active]:border-secondary-border data-[state=active]:text-secondary-foreground rounded-md px-2.5 h-6.5",
        variant === "underline" &&
          "text-muted-foreground data-[state=active]:text-primary border-x-0 border-t-0 border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-3 py-2 -mb-px",
        className,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "ring-offset-background focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
        variant === "underline" && "px-4",
        className,
      )}
      {...props}
    />
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
