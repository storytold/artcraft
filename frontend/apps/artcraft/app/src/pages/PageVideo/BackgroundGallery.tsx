import "./Background.css";

export default function GalleryBackground() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden bg-[radial-gradient(50%_50%_at_50%_50%,_transparent_49%,_rgb(var(--st-controls-rgb)_/_var(--st-gallery-vignette-alpha))_100%)]" />
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div
          className={`video-background-image h-full w-full opacity-30 transition-opacity duration-1000`}
        >
          <div className="absolute inset-0 grid grid-cols-5 gap-6 px-6 opacity-35" />
        </div>
      </div>
    </>
  );
}
