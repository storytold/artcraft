const FEATURED_VIDEO_URL =
  "https://frontend-cdn.fakeyou.com/videos/knight-video.mp4";

export const AuthShowcase = () => {
  return (
    <div className="absolute inset-2 overflow-hidden bg-black rounded-2xl">
      {/* Muted background video (no controls) cropped to cover the pane */}
      <video
        src={FEATURED_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />

      {/* Legibility gradient behind the caption */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/25"
      />

      {/* Caption */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-300">
          One of the cheapest
        </p>
        <h2 className="text-2xl font-bold leading-tight">
          Seedance 2.5 Video Generation
        </h2>
        <p className="mt-1 max-w-sm text-sm text-white/70">
          Generate jaw-dropping AI videos with Seedance 2.5.
        </p>
      </div>
    </div>
  );
};
