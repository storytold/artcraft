import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import { GENERATE_APPS, EDIT_APPS } from "~/config/appMenu";
import { TabId, useTabStore } from "~/pages/Stores/TabState";

export const AppsQuickMenu = () => {
  const goToApp = (action?: string) => {
    if (action && ["IMAGE", "VIDEO", "EDIT", "2D", "3D"].includes(action)) {
      useTabStore.getState().setActiveTab(action as TabId);
    }
  };

  const getBadgeStyles = (badge?: string) => {
    switch (badge) {
      case "NEW":
        return "bg-[#9ef01a] text-black";
      case "BEST":
        return "bg-[#e7316d] text-white";
      case "SOON":
        return "bg-gray-600 text-white";
      default:
        return "";
    }
  };

  return (
    <div className="grid w-[680px] grid-cols-2 gap-3">
      <div>
        <h3 className="mb-2 px-2 text-xs font-semibold opacity-50">Generate</h3>
        <div className="space-y-0.5">
          {GENERATE_APPS.map((app) => (
            <button
              key={app.id}
              onClick={() => goToApp(app.action)}
              disabled={!app.action}
              className={twMerge(
                "group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
                app.action
                  ? "cursor-pointer hover:bg-base-fg/10"
                  : "cursor-default opacity-60",
              )}
            >
              <div
                className={twMerge(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
                  app.color || "bg-ui-panel",
                )}
              >
                <FontAwesomeIcon icon={app.icon} className="text-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="truncate text-[13px] font-medium">
                    {app.label}
                  </div>
                  {app.badge && (
                    <span
                      className={twMerge(
                        "shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider",
                        getBadgeStyles(app.badge),
                      )}
                    >
                      {app.badge}
                    </span>
                  )}
                </div>
                <div className="truncate text-[11px] opacity-60">
                  {app.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 px-2 text-xs font-semibold opacity-50">Edit</h3>
        <div className="space-y-0.5">
          {EDIT_APPS.map((app) => (
            <button
              key={app.id}
              onClick={() => goToApp(app.action)}
              disabled={!app.action}
              className={twMerge(
                "group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
                app.action
                  ? "cursor-pointer hover:bg-base-fg/10"
                  : "cursor-default opacity-60",
              )}
            >
              <div
                className={twMerge(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
                  app.color || "bg-ui-panel",
                )}
              >
                <FontAwesomeIcon icon={app.icon} className="text-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="truncate text-[13px] font-medium">
                    {app.label}
                  </div>
                  {app.badge && (
                    <span
                      className={twMerge(
                        "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        getBadgeStyles(app.badge),
                      )}
                    >
                      {app.badge}
                    </span>
                  )}
                </div>
                <div className="truncate text-[11px] opacity-60">
                  {app.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
