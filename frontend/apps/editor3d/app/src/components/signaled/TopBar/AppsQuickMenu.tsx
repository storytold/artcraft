import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
        return "bg-ui-panel-border/50 text-base-fg/70";
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
              className={`group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
                app.action
                  ? "cursor-pointer hover:bg-base-fg/10"
                  : "cursor-default opacity-60"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${app.color || "bg-ui-panel"}`}
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
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getBadgeStyles(app.badge)}`}
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
              className={`group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
                app.action
                  ? "cursor-pointer hover:bg-base-fg/10"
                  : "cursor-default opacity-60"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${app.color || "bg-ui-panel"}`}
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
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getBadgeStyles(app.badge)}`}
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
