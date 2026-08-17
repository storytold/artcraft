import { TICKER_ITEMS } from "@/lib/landing-data";

function Track({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="marquee-track items-center"
    >
      {TICKER_ITEMS.map((item) => (
        <li
          key={item}
          className="hud-label flex items-center whitespace-nowrap px-6 py-3 text-muted"
        >
          <span aria-hidden className="mr-6 text-accent-ink">
            ▪
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

// Full-bleed mono marquee of models and capabilities. The duplicate track
// exists purely for the seamless loop and is hidden from assistive tech.
export default function CapabilityTicker() {
  return (
    <div className="marquee border-t border-line">
      <Track />
      <Track hidden />
    </div>
  );
}
