const FEATURED_VIDEO_URL =
  "https://player.vimeo.com/video/1169289718?background=1&autoplay=1&loop=1&muted=1";

export const AuthShowcase = () => {
  return (
    <div
      className="absolute inset-2 overflow-hidden bg-black rounded-2xl"
      style={{ containerType: "size" }}
    >
      {/* Vimeo background embed (no controls) scaled to cover the pane. The
          iframe is forced to 16:9 and sized to the larger cover dimension via
          container-query units, then centered so the overflow crops evenly. */}
      <iframe
        src={FEATURED_VIDEO_URL}
        title="Cheap Seedance 2.0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "max(100cqw, calc(100cqh * 16 / 9))",
          height: "max(100cqh, calc(100cqw * 9 / 16))",
        }}
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
          Seedance 2.0 Video Generation
        </h2>
        <p className="mt-1 max-w-sm text-sm text-white/70">
          Generate jaw-dropping AI videos with Seedance 2.0.
        </p>
      </div>
    </div>
  );
};
