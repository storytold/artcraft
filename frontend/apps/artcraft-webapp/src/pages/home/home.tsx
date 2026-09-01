import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  BoxIcon,
  FilmIcon,
  GlobeIcon,
  GroupIcon,
  ImageIcon,
  ImagesIcon,
  MusicIcon,
  VideoIcon,
  WandSparklesIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import Seo from "../../components/seo";
import { Reveal, RevealGroup } from "../../components/motion/reveal";

type AppCard = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconTile: string;
  hoverBorder: string;
  badge?: string;
};

const APPS: AppCard[] = [
  {
    label: "Image",
    description: "Generate images from prompts and references.",
    href: "/create-image",
    icon: ImageIcon,
    iconTile: "border-blue-400/40 bg-blue-500/20 text-blue-300",
    hoverBorder: "hover:border-blue-400/60",
  },
  {
    label: "Video",
    description: "Generate cinematic clips from text or images.",
    href: "/create-video",
    icon: VideoIcon,
    iconTile: "border-purple-400/40 bg-purple-500/20 text-purple-300",
    hoverBorder: "hover:border-purple-400/60",
  },
  {
    label: "Audio",
    description: "Generate songs and sound effects from prompts.",
    href: "/create-audio",
    icon: MusicIcon,
    iconTile: "border-pink-400/40 bg-pink-500/20 text-pink-300",
    hoverBorder: "hover:border-pink-400/60",
  },
  {
    label: "3D Object",
    description: "Turn a prompt or image into a 3D model.",
    href: "/create-object",
    icon: BoxIcon,
    iconTile: "border-cyan-400/40 bg-cyan-500/20 text-cyan-300",
    hoverBorder: "hover:border-cyan-400/60",
  },
  {
    label: "3D World",
    description: "Turn a prompt or image into an explorable world.",
    href: "/create-world",
    icon: GlobeIcon,
    iconTile: "border-teal-400/40 bg-teal-500/20 text-teal-300",
    hoverBorder: "hover:border-teal-400/60",
  },
  {
    label: "Edit 3D",
    description: "Compose 3D scenes and render with AI cameras.",
    href: "/edit-3d",
    icon: BoxIcon,
    iconTile: "border-amber-400/40 bg-amber-500/20 text-amber-300",
    hoverBorder: "hover:border-amber-400/60",
  },
  {
    label: "Background Change",
    description: "Swap or remove backgrounds with AI VFX.",
    href: "/background-change",
    icon: WandSparklesIcon,
    iconTile: "border-emerald-400/40 bg-emerald-500/20 text-emerald-300",
    hoverBorder: "hover:border-emerald-400/60",
  },
  {
    label: "Edit Video",
    description: "Trim, arrange, and edit clips on a timeline.",
    href: "/video-editor",
    icon: FilmIcon,
    iconTile: "border-rose-400/40 bg-rose-500/20 text-rose-300",
    hoverBorder: "hover:border-rose-400/60",
    badge: "BETA",
  },
  {
    label: "Moodboard",
    description: "Collect references and ideas to steer a generation.",
    href: "/moodboard",
    icon: GroupIcon,
    iconTile: "border-indigo-400/40 bg-indigo-500/20 text-indigo-300",
    hoverBorder: "hover:border-indigo-400/60",
    badge: "BETA",
  },
  {
    label: "Frame Extractor",
    description: "Grab a still frame from any video.",
    href: "/frame-extractor",
    icon: ImagesIcon,
    iconTile: "border-orange-400/40 bg-orange-500/20 text-orange-300",
    hoverBorder: "hover:border-orange-400/60",
    badge: "NEW",
  },
];

export function Home() {
  return (
    <div className="min-h-full px-6 sm:px-10 py-10 sm:py-16 max-w-6xl mx-auto w-full">
      <Seo
        title="ArtCraft - Create AI Images and Video"
        description="Generate AI images and video with ArtCraft."
      />
      <Reveal
        as="h1"
        inView={false}
        y={20}
        className="text-center font-display text-4xl sm:text-6xl mx-auto font-semibold tracking-tight"
      >
        What will you <span className="text-primary">craft</span> today?
      </Reveal>

      <section className="py-12">
        <Reveal
          as="h2"
          inView={false}
          delay={0.08}
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60 mb-4"
        >
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
              <Link
                to={app.href}
                className={`group relative flex h-full border rounded-[3px] border-white/10 bg-white/5 p-5 transition-colors duration-150 ${app.hoverBorder}`}
              >
                <div className="relative flex w-full items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center border ${app.iconTile}`}
                  >
                    <DynamicIcon icon={app.icon} className="text-base" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className=" text-sm font-bold uppercase tracking-[0.08em] text-white truncate">
                          {app.label}
                        </h3>
                        {app.badge && (
                          <span
                            className={`shrink-0 border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] leading-none ${
                              app.badge === "NEW"
                                ? "border-purple-400/40 text-purple-300"
                                : "border-amber-400/40 text-amber-300"
                            }`}
                          >
                            {app.badge}
                          </span>
                        )}
                      </div>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] border border-white/15 text-white/40 transition-colors duration-150 group-hover:border-white/40 group-hover:text-white">
                        <ArrowRightIcon className="text-xs" />
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-white/55 leading-snug">
                      {app.description}
                    </p>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </RevealGroup>
      </section>
    </div>
  );
}

export default Home;
