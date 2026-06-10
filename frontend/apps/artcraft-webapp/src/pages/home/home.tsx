import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faVideo,
  faWandMagicSparkles,
  faCube,
  faFilm,
  faArrowRight,
} from "@fortawesome/pro-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Seo from "../../components/seo";

type AppCard = {
  label: string;
  description: string;
  href: string;
  icon: IconDefinition;
  accent: string;
  iconBg: string;
  iconColor: string;
  badge?: string;
};

const APPS: AppCard[] = [
  {
    label: "Image",
    description: "Generate images from prompts and references.",
    href: "/create-image",
    icon: faImage,
    accent: "from-blue-500/20 to-blue-500/0",
    iconBg: "bg-blue-500/25 border-blue-400/30",
    iconColor: "text-blue-300",
  },
  {
    label: "Video",
    description: "Generate cinematic clips from text or images.",
    href: "/create-video",
    icon: faVideo,
    accent: "from-purple-500/20 to-purple-500/0",
    iconBg: "bg-purple-500/25 border-purple-400/30",
    iconColor: "text-purple-300",
  },
  {
    label: "Edit 3D",
    description: "Compose 3D scenes and render with AI cameras.",
    href: "/edit-3d",
    icon: faCube,
    accent: "from-amber-500/20 to-amber-500/0",
    iconBg: "bg-amber-500/25 border-amber-400/30",
    iconColor: "text-amber-300",
  },
  {
    label: "Background Change",
    description: "Swap or remove backgrounds with AI VFX.",
    href: "/background-change",
    icon: faWandMagicSparkles,
    accent: "from-emerald-500/20 to-emerald-500/0",
    iconBg: "bg-emerald-500/25 border-emerald-400/30",
    iconColor: "text-emerald-300",
  },
  {
    label: "Edit Video",
    description: "Trim, arrange, and edit clips on a timeline.",
    href: "/video-editor",
    icon: faFilm,
    accent: "from-rose-500/20 to-rose-500/0",
    iconBg: "bg-rose-500/25 border-rose-400/30",
    iconColor: "text-rose-300",
    badge: "BETA",
  },
];

export function Home() {
  return (
    <div className="min-h-full px-6 sm:px-10 py-10 sm:py-16 max-w-6xl mx-auto w-full">
      <Seo
        title="ArtCraft - Create AI Images and Video"
        description="Generate AI images and video with ArtCraft."
      />
      <h1 className="text-center font-display text-4xl sm:text-6xl mx-auto font-semibold tracking-tight">
        What will you <span className="text-primary">craft</span> today?
      </h1>

      <section className="mt-12">
        <h2 className="text-sm font-semibold text-white/85 mb-4">Create</h2>
        <div className="grid gap-3 auto-rows-fr sm:grid-cols-2 lg:grid-cols-3">
          {APPS.map((app) => (
            <Link
              key={app.href}
              to={app.href}
              className="bg-ui-controls/50 group relative h-full overflow-hidden rounded-2xl p-5 hover:border-white/20 hover:bg-ui-controls"
            >
              <div
                className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${app.accent} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
                aria-hidden
              />
              <div className="relative flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${app.iconBg} ${app.iconColor}`}
                >
                  <FontAwesomeIcon icon={app.icon} className="text-base" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-base font-semibold text-white truncate">
                        {app.label}
                      </h3>
                      {app.badge && (
                        <span className="shrink-0 rounded-full bg-amber-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none text-white">
                          {app.badge}
                        </span>
                      )}
                    </div>
                    <FontAwesomeIcon
                      icon={faArrowRight}
                      className="text-sm text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all"
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
