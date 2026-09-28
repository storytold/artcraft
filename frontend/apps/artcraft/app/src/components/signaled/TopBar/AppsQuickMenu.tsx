import { DynamicIcon } from "@storyteller/icons";
import { twMerge } from "tailwind-merge";
import {
  useGenerateApps,
  useEditApps,
  getAppCardPalette,
  getBadgeStyles,
  goToApp,
  type FullAppItem,
} from "~/config/appMenu";

export const AppsQuickMenu = () => {
  const generateApps = useGenerateApps();
  const editApps = useEditApps();
  return (
    <div className="grid w-[680px] grid-cols-2 gap-3">
      <AppsQuickMenuSection title="Create" apps={generateApps} />
      <AppsQuickMenuSection title="Edit" apps={editApps} />
    </div>
  );
};

const AppsQuickMenuSection = ({
  title,
  apps,
}: {
  title: string;
  apps: FullAppItem[];
}) => (
  <div>
    <h3 className="hud-label mb-2 px-2 text-base-fg/50">{title}</h3>
    <div className="space-y-0.5">
      {apps.map((app) => {
        const palette = getAppCardPalette(app.id);
        return (
          <button
            key={app.id}
            onClick={() => goToApp(app.action)}
            disabled={!app.action}
            className={twMerge(
              "group flex w-full items-center gap-3 rounded-[3px] px-2 py-2 text-left transition-colors",
              app.action
                ? "cursor-pointer hover:bg-white/[0.08]"
                : "cursor-default opacity-60",
            )}
          >
            <div
              className={twMerge(
                "flex h-8 w-8 shrink-0 items-center justify-center border transition-colors",
                palette.iconBg,
                palette.iconColor,
              )}
            >
              <DynamicIcon icon={app.icon} className="text-sm" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="truncate text-[13px] font-medium">
                  {app.label}
                </div>
                {app.badge && (
                  <span
                    className={twMerge(
                      "shrink-0 border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase leading-none tracking-[0.12em]",
                      getBadgeStyles(app.badge),
                    )}
                  >
                    {app.badge}
                  </span>
                )}
              </div>
              <div className="truncate text-[11px] text-base-fg/60">
                {app.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);
