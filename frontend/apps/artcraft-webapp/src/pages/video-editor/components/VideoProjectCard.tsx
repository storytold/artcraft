import { useState } from "react";
import { ClapperboardIcon, EllipsisIcon, PenIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { PopoverMenu } from "@storyteller/ui-popover";
import type { ProjectMeta } from "@storyteller/ui-video-editor";
import { formatTimeAgo } from "../../../lib/format-time-ago";

// Card, skeleton, and "new project" tile for the video projects landing.
// Visual language follows the library/create-page cards: ui-controls
// surface, primary hover ring, hover-revealed kebab menu, and the house
// dashed recipe for the new-item tile.

// Deterministic per-project placeholder art so thumbnail-less cards don't
// all look identical (blue/teal/purple/pink families, matching the
// create-page glow orbs).
const PLACEHOLDER_GRADIENTS = [
  "from-blue-600/30 via-blue-500/15 to-[#00AABA]/20",
  "from-purple-600/30 via-blue-500/15 to-pink-500/20",
  "from-[#00AABA]/30 via-blue-600/15 to-purple-500/20",
  "from-pink-500/25 via-purple-500/15 to-blue-600/20",
  "from-indigo-500/30 via-blue-500/15 to-teal-500/20",
  "from-sky-500/25 via-indigo-500/15 to-purple-600/20",
];

const STAGGER_STEP_MS = 30;
const STAGGER_MAX_STEPS = 8;

interface VideoProjectCardProps {
  project: ProjectMeta;
  index: number;
  isDeleting: boolean;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function VideoProjectCard({
  project,
  index,
  isDeleting,
  onOpen,
  onRename,
  onDelete,
}: VideoProjectCardProps) {
  const [thumbnailError, setThumbnailError] = useState(false);
  const showThumbnail = !!project.thumbnailUrl && !thumbnailError;

  return (
    <div
      className={twMerge(
        "animate-fade-in-up group relative flex flex-col overflow-hidden rounded-xl bg-ui-controls/40 ring-1 ring-white/5 transition-all duration-200 hover:ring-2 hover:ring-primary-400/60",
        isDeleting && "pointer-events-none opacity-50",
      )}
      style={{
        animationDelay: `${Math.min(index, STAGGER_MAX_STEPS) * STAGGER_STEP_MS}ms`,
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${project.name}`}
        className="relative block aspect-video w-full cursor-pointer overflow-hidden text-start"
      >
        {showThumbnail ? (
          <img
            src={project.thumbnailUrl}
            alt={project.name}
            crossOrigin="anonymous"
            loading="lazy"
            onError={() => setThumbnailError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className={twMerge(
              "flex h-full w-full items-center justify-center bg-gradient-to-br",
              gradientForProject(project.id),
            )}
          >
            <ClapperboardIcon
              
              className="text-3xl text-white/25 transition-colors group-hover:text-white/40" />
          </div>
        )}
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            Open project
          </span>
        </div>
      </button>

      <div className="min-w-0 px-3 py-2.5">
        <div className="truncate text-sm font-medium text-white">
          {project.name}
        </div>
        <div className="text-xs text-white/45">
          Edited {formatTimeAgo(project.updatedAt)}
        </div>
      </div>

      <div
        className="absolute right-2 top-2 z-10 opacity-0 transition-opacity duration-75 focus-within:opacity-100 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <PopoverMenu
          position="bottom"
          align="end"
          mode="default"
          triggerIcon={
            <EllipsisIcon  className="text-base-fg" />
          }
          buttonClassName="h-7 w-7 p-0 rounded-full bg-ui-controls/60 hover:bg-ui-controls/90 text-base-fg border border-ui-controls-border"
          panelClassName="w-max min-w-44 p-1"
          closeOnUnhover
        >
          {(close) => (
            <div className="flex flex-col">
              <button
                type="button"
                className="flex w-full items-center gap-2 whitespace-nowrap rounded-md px-2 py-2 text-sm text-base-fg hover:bg-ui-controls/60"
                onClick={(e) => {
                  e.stopPropagation();
                  close();
                  onRename();
                }}
              >
                <PenIcon  className="w-3.5" />
                Rename
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 whitespace-nowrap rounded-md px-2 py-2 text-sm text-red hover:bg-red/10"
                onClick={(e) => {
                  e.stopPropagation();
                  close();
                  onDelete();
                }}
              >
                <Trash2Icon  className="w-3.5" />
                Delete
              </button>
            </div>
          )}
        </PopoverMenu>
      </div>
    </div>
  );
}

export function VideoProjectCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl ring-1 ring-white/5">
      <div className="animate-shimmer aspect-video w-full bg-white/[0.04]" />
      <div className="space-y-2 px-3 py-3">
        <div className="animate-shimmer h-3.5 w-2/3 rounded bg-white/[0.06]" />
        <div className="animate-shimmer h-3 w-1/3 rounded bg-white/[0.05]" />
      </div>
    </div>
  );
}

export function NewProjectTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-white/20 bg-white/[0.02] py-10 transition-colors hover:border-white/40 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/55 transition-colors group-hover:bg-primary/15 group-hover:text-primary">
        <PlusIcon />
      </span>
      <span className="text-sm font-medium text-white/70">New project</span>
    </button>
  );
}

function gradientForProject(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PLACEHOLDER_GRADIENTS[hash % PLACEHOLDER_GRADIENTS.length];
}
