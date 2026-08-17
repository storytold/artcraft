"use client";

import { useEffect, useRef } from "react";

// Muted looping footage that only downloads and plays while near the viewport.
// Reduced-motion visitors get a paused first frame (metadata only) instead of
// ambient motion.
export default function LazyVideo({
  src,
  className,
  label,
}: {
  src: string;
  className?: string;
  label?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    if (reduced) {
      video.preload = "metadata";
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "160px 0px" },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      className={className}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
    />
  );
}
