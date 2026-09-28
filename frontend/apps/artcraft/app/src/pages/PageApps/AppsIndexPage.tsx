import { ArrowRightIcon } from "lucide-react";
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

export const AppsIndexPage = () => {
  const generateApps = useGenerateApps();
  const editApps = useEditApps();
  const categories = [
    { title: "Create", apps: generateApps },
    { title: "Edit", apps: editApps },
  ];

  return (
    // The scroll container spans the full window width so its scrollbar sits
    // flush against the right edge; horizontal padding lives on the inner
    // wrapper instead.
    <div className="fixed inset-0 overflow-y-auto bg-ui-background pt-[56px] text-base-fg">
      <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <p className="hud-label mb-4 text-ui-accent-ink">
          Your creative workspace
        </p>
        <h1 className="max-w-3xl font-display text-3xl leading-tight tracking-tight sm:text-5xl">
          What will you <span className="text-ui-accent-ink">craft</span> today?
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-base-fg/70 sm:text-base">
          Start with an idea. Choose a tool to bring it to life.
        </p>

        {categories.map((category, index) => (
          <section
            key={category.title}
            className={twMerge(
              "border-t border-ui-border pt-6",
              index === 0 ? "mt-8 sm:mt-10" : "mt-10",
            )}
          >
            <h2 className="hud-label mb-4 text-base-fg/70">
              {category.title}
            </h2>
            <div className="grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-3">
              {category.apps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

function AppCard({ app }: { app: FullAppItem }) {
  const palette = getAppCardPalette(app.id);
  const enabled = !!app.action;

  return (
    <button
      onClick={() => goToApp(app.action)}
      disabled={!enabled}
      className={twMerge(
        "group relative flex h-full rounded-[3px] border border-ui-border bg-white/5 p-5 text-left transition-colors duration-150 focus-visible:border-primary",
        enabled ? twMerge("cursor-pointer", palette.hoverStyle) : "cursor-default opacity-60",
      )}
    >
      <div className="relative flex w-full items-start gap-4">
        <div
          className={twMerge(
            "flex h-10 w-10 shrink-0 items-center justify-center border",
            palette.iconBg,
            palette.iconColor,
          )}
        >
          <DynamicIcon icon={app.icon} className="text-base" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="text-base font-bold uppercase tracking-tight text-ui-ink">
                {app.label}
              </h3>
              {app.badge && (
                <span
                  className={twMerge(
                    "shrink-0 border px-1.5 py-1 font-mono text-[9px] font-medium leading-none tracking-wider",
                    app.badge === "SOON"
                      ? getBadgeStyles(app.badge)
                      : "border-primary/30 text-ui-accent-ink",
                  )}
                >
                  {app.badge}
                </span>
              )}
            </div>
            {enabled && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] border border-white/15 text-white/40 transition-colors duration-150 group-hover:border-white/40 group-hover:text-white">
                <ArrowRightIcon className="text-xs" />
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-base-fg/70">
            {app.description}
          </p>
        </div>
      </div>
    </button>
  );
}
