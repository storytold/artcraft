import { faGrid2 } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import { TopBar } from "~/components";
import {
  GENERATE_APPS,
  EDIT_APPS,
  getBadgeStyles,
  goToApp,
} from "~/config/appMenu";

export const AppsIndexPage = () => {
  const categories = [
    { title: "Generate", apps: GENERATE_APPS },
    { title: "Edit", apps: EDIT_APPS },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden bg-ui-background text-base-fg">
      <TopBar pageName="Apps" loginSignUpPressed={() => {}} />
      <main className="mx-auto h-full max-w-6xl overflow-y-auto px-5 pb-12 pt-[120px]">
        <div className="flex w-full flex-col items-start gap-2 pb-4">
          <div className="mb-6 flex items-center gap-4">
            <FontAwesomeIcon icon={faGrid2} className="text-2xl opacity-70" />
            <h1 className="text-4xl font-bold">
              Explore <span className="text-primary-400">ArtCraft Apps</span>
            </h1>
          </div>
          <hr className="mb-3.5 w-full border-ui-panel-border" />
        </div>
        <div className="grid grid-cols-2 gap-8">
          {categories.map((category) => (
            <section key={category.title}>
              <h2 className="mb-3 text-sm font-semibold opacity-50">
                {category.title}
              </h2>
              <div className="space-y-1">
                {category.apps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => goToApp(app.action)}
                    disabled={!app.action}
                    className={twMerge(
                      "group flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left transition-colors",
                      app.action
                        ? "cursor-pointer hover:bg-ui-controls/60"
                        : "cursor-default opacity-60",
                    )}
                  >
                    <div
                      className={twMerge(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors",
                        app.color || "bg-ui-controls",
                      )}
                    >
                      <FontAwesomeIcon icon={app.icon} className="text-base" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-[15px] font-medium">
                          {app.label}
                        </div>
                        {app.badge && (
                          <span
                            className={twMerge(
                              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              getBadgeStyles(app.badge),
                            )}
                          >
                            {app.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] opacity-60">
                        {app.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
};
