import { faArrowRight } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-12 sm:pt-20">
        <h1 className="mx-auto text-center text-4xl font-semibold tracking-tight sm:text-6xl">
          What will you <span className="text-primary">craft</span> today?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-lg text-base-fg/55">
          Every tool in your toolbox - pick one and start creating.
        </p>

        <div className="mt-12 space-y-10">
          {categories.map((category) => (
            <section key={category.title}>
              <h2 className="mb-4 text-sm font-semibold text-base-fg/85">
                {category.title}
              </h2>
              <div className="grid auto-rows-min gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {category.apps.map((app) => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
            </section>
          ))}
        </div>
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
        "group relative block overflow-hidden rounded-2xl bg-ui-controls/50 p-5 text-left transition-colors",
        enabled
          ? "cursor-pointer hover:bg-ui-controls"
          : "cursor-default opacity-60",
      )}
    >
      {/* Hover accent — gradient wash matching the app's hue. */}
      {enabled && (
        <div
          aria-hidden
          className={twMerge(
            "pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100",
            palette.accent,
          )}
        />
      )}

      <div className="relative flex items-start gap-4">
        <div
          className={twMerge(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
            palette.iconBg,
            palette.iconColor,
          )}
        >
          <FontAwesomeIcon icon={app.icon} className="text-base" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-base font-semibold text-base-fg">
                {app.label}
              </h3>
              {app.badge && (
                <span
                  className={twMerge(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wider",
                    getBadgeStyles(app.badge),
                  )}
                >
                  {app.badge}
                </span>
              )}
            </div>
            {enabled && (
              <FontAwesomeIcon
                icon={faArrowRight}
                className="text-sm text-base-fg/40 transition-all group-hover:translate-x-0.5 group-hover:text-base-fg/70"
              />
            )}
          </div>
          <p className="mt-1 text-sm leading-snug text-base-fg/55">
            {app.description}
          </p>
        </div>
      </div>
    </button>
  );
}
