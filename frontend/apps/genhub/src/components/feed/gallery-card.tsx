import { Image } from "lucide-react";
import { memo, useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import type { GalleryItem } from "~/data/mock-gallery";

interface GalleryCardProps {
  item: GalleryItem;
}

export const GalleryCard = memo(function GalleryCard({
  item,
}: GalleryCardProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <article className="group relative mb-4 cursor-pointer overflow-hidden rounded-xl bg-muted">
      {/* Image always in flow — width/height reserves space, opacity handles fade */}
      <img
        src={item.imageUrl}
        alt={item.title}
        width={item.imageWidth}
        height={item.imageHeight}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`w-full object-cover transition-all duration-700 ease-out group-hover:scale-110 ${loaded ? "opacity-100" : "opacity-0"}`}
      />

      {/* Skeleton overlay — sits on top until image fades in, then unmounts */}
      {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}

      {/* Hover dark overlay */}
      <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/20" />

      {/* Icon badge */}
      <div className="absolute right-2.5 top-2.5 rounded-lg bg-black/40 p-1.5 text-white/80 backdrop-blur-sm transition-opacity duration-500 group-hover:opacity-100 sm:opacity-0">
        <Image className="size-3.5" />
      </div>

      {/* Bottom overlay — fades in with image */}
      <div
        className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/30 to-transparent px-3 pb-3 pt-10 transition-opacity duration-500"
        style={{ opacity: loaded ? 1 : 0 }}
      >
        <h3 className="text-sm font-semibold leading-tight text-white">
          {item.title}
        </h3>
        <p className="mt-0.5 text-xs text-white/70">{item.creator}</p>
      </div>
    </article>
  );
});
