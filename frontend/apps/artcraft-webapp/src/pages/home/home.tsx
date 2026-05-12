import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faVideo,
  faWandMagicSparkles,
  faArrowRight,
} from "@fortawesome/pro-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

type AppCard = {
  label: string;
  description: string;
  href: string;
  icon: IconDefinition;
  accent: string;
};

const APPS: AppCard[] = [
  {
    label: "Image",
    description: "Generate images from prompts and references.",
    href: "/create-image",
    icon: faImage,
    accent: "from-blue-500/20 to-blue-500/0",
  },
  {
    label: "Video",
    description: "Generate cinematic clips from text or images.",
    href: "/create-video",
    icon: faVideo,
    accent: "from-purple-500/20 to-purple-500/0",
  },
  {
    label: "Background Change",
    description: "Swap or remove backgrounds with AI VFX.",
    href: "/background-change",
    icon: faWandMagicSparkles,
    accent: "from-emerald-500/20 to-emerald-500/0",
  },
];

export function Home() {
  return (
    <div className="min-h-full px-6 sm:px-10 py-10 sm:py-16 max-w-6xl mx-auto w-full">
      <h1 className="text-center font-display text-4xl sm:text-6xl mx-auto font-semibold tracking-tight">
        What will you <span className="text-primary">craft</span> today?
      </h1>

      <section className="mt-12">
        <h2 className="text-sm font-semibold text-white/85 mb-4">Create</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {APPS.map((app) => (
            <Link
              key={app.href}
              to={app.href}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all p-5"
            >
              <div
                className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${app.accent} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
                aria-hidden
              />
              <div className="relative flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.06] text-white/85">
                  <FontAwesomeIcon icon={app.icon} className="text-base" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-white">
                      {app.label}
                    </h3>
                    <FontAwesomeIcon
                      icon={faArrowRight}
                      className="text-[11px] text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                  <p className="mt-1 text-sm text-white/55 leading-snug">
                    {app.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
