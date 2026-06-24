import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faVideo,
  faWandMagicSparkles,
  faCube,
  faFilm,
  faObjectGroup,
  faArrowRight,
} from "@fortawesome/pro-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Seo from "../../components/seo";
import { Reveal, RevealGroup } from "../../components/motion/reveal";
import { TRANSITION_SPRING } from "../../lib/motion";

const MotionLink = motion(Link);

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
  {
    label: "Moodboard",
    description: "Collect references and ideas to steer a generation.",
    href: "/moodboard",
    icon: faObjectGroup,
    accent: "from-indigo-500/20 to-indigo-500/0",
    iconBg: "bg-indigo-500/25 border-indigo-400/30",
    iconColor: "text-indigo-300",
    badge: "BETA",
  },
];

export function Home() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="min-h-full px-6 sm:px-10 py-10 sm:py-16 max-w-6xl mx-auto w-full">
      <Seo
        title="ArtCraft - Create AI Images and Video"
        description="Generate AI images and video with ArtCraft."
      />
      <Reveal as="h1" inView={false} y={20} className="text-center font-display text-4xl sm:text-6xl mx-auto font-semibold tracking-tight">
        What will you <span className="text-primary">craft</span> today?
      </Reveal>

      <section className="py-12">
        <Reveal as="h2" inView={false} delay={0.08} className="text-sm font-semibold text-white/85 mb-4">
          Create
        </Reveal>
        <RevealGroup
          inView={false}
          delayChildren={0.12}
          stagger={0.06}
          className="grid gap-3 auto-rows-fr sm:grid-cols-2 lg:grid-cols-3"
        >
          {APPS.map((app) => (
            <Reveal key={app.href} y={20}>
              <MotionLink
                to={app.href}
                className="bg-ui-controls/50 group relative flex h-full overflow-hidden rounded-2xl p-5 ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] hover:bg-ui-controls hover:ring-white/15"
                whileHover={reduceMotion ? undefined : { y: -4 }}
                whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                transition={TRANSITION_SPRING}
              >
                <div
                  className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${app.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                  aria-hidden
                />
                <div className="relative flex w-full items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${app.iconBg} ${app.iconColor} shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105`}
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
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-white/40 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-white/10 group-hover:text-white/80 group-hover:translate-x-0.5">
                        <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-white/55 leading-snug">
                      {app.description}
                    </p>
                  </div>
                </div>
              </MotionLink>
            </Reveal>
          ))}
        </RevealGroup>
      </section>
    </div>
  );
}

export default Home;
