import { IconSettings } from "@tabler/icons-react";
import { useTheme } from "next-themes";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none sm:max-w-[800px] w-full p-0 gap-0 overflow-hidden h-dvh sm:h-[600px] flex flex-col sm:flex-row rounded-none sm:rounded-[12px] border-border bg-background shadow-lg">
        <DialogTitle className="sr-only">Settings</DialogTitle>

        {/* Left Sidebar / Top Nav on mobile */}
        <div className="w-full sm:w-[240px] border-b sm:border-b-0 sm:border-r border-border bg-muted/20 p-2 sm:p-4 flex flex-row sm:flex-col shrink-0 overflow-x-auto sm:overflow-x-visible sm:overflow-y-auto hide-scrollbar sm:show-scrollbar">
          <div className="flex flex-row sm:flex-col gap-1 w-full">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1 tracking-wider mb-1 hidden sm:block">
              Settings
            </div>
            <button
              className={cn(
                "flex items-center whitespace-nowrap gap-2 px-3 sm:px-2 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer shrink-0",
                "bg-accent/50 text-accent-foreground", // Currently active tab
              )}
            >
              <IconSettings className="size-4 shrink-0" />
              General
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-background relative">
          <div className="max-w-xl flex flex-col gap-6">
            <div className="flex flex-col gap-1 border-b border-border pb-6">
              <h2 className="text-xl font-bold tracking-tight">General</h2>
              <p className="text-muted-foreground text-sm">
                Choose how you want your dashboard to look and behave.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Appearance
                </h3>

                <div className="flex items-center justify-between py-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="dark-mode" className="text-sm font-medium">
                      Dark Mode
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enable dark theme for the dashboard
                    </p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={theme === "dark"}
                    onCheckedChange={(checked) =>
                      setTheme(checked ? "dark" : "light")
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
