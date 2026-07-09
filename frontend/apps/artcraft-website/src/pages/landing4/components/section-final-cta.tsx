import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faApple,
  faWindows,
  faLinux,
} from "@fortawesome/free-brands-svg-icons";
import { LineMaskHeading, MonoLabel } from "./ui";

// /08 — Final CTA. Dark chapter, near-full-viewport, giant type with the last
// line clipped at the section edge.
export const SectionFinalCta = ({
  onDownloadClick,
}: {
  onDownloadClick: () => void;
}) => (
  <section className="relative flex min-h-[90svh] flex-col justify-between overflow-hidden">
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-8">
      <div className="l4-line flex items-center justify-between border-t py-3">
        <MonoLabel className="l4-muted">/08 — DOWNLOAD</MonoLabel>
        <MonoLabel className="l4-muted">
          V2.X — PUBLIC BUILD — {new Date().getFullYear()}
        </MonoLabel>
      </div>

      <div className="py-16 lg:py-24">
        <LineMaskHeading
          className="text-[clamp(4rem,14vw,15rem)]"
          lines={[
            <>OWN YOUR</>,
            <span className="text-flare">TOOLS.</span>,
          ]}
        />

        <div
          data-l4-reveal
          className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <button
            onClick={onDownloadClick}
            className="bg-flare text-ink hover:bg-paper inline-flex h-14 items-center justify-center gap-3 px-8 font-brut-mono text-[13px] font-bold uppercase tracking-[0.14em] transition-colors"
          >
            Download for Desktop <span aria-hidden>→</span>
          </button>
          <Link
            to="/pricing"
            className="l4-line hover:text-flare inline-flex h-14 items-center justify-center border px-8 font-brut-mono text-[13px] uppercase tracking-[0.14em] transition-colors"
            style={{ color: "var(--l4-ink)" }}
          >
            Or use on Web <span aria-hidden className="ml-2">→</span>
          </Link>
          <div className="l4-muted flex items-center gap-5 text-lg sm:ml-6">
            <FontAwesomeIcon icon={faApple} title="macOS" />
            <FontAwesomeIcon icon={faWindows} title="Windows" />
            <FontAwesomeIcon icon={faLinux} title="Linux" />
          </div>
        </div>
      </div>
    </div>
  </section>
);
