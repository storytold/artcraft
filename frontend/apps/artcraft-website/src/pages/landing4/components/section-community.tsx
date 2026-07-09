import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord, faGithub } from "@fortawesome/free-brands-svg-icons";
import { SOCIAL_LINKS } from "../../../config/links";
import { LineMaskHeading, MonoLabel, SectionHeader } from "./ui";

// /07 — Community. Back to the dark chapter (the boundary sentinel before
// this section scrubs the root vars). Two 50/50 hairline cells; the whole
// cell is the anchor and inverts to flare on hover.
export const SectionCommunity = () => (
  <>
    {/* Chapter boundary: paper → dark */}
    <div data-l4-boundary="dark" aria-hidden className="h-[40vh]" />
    <section className="mx-auto w-full max-w-[1600px] px-4 py-24 sm:px-8 lg:py-32">
      <SectionHeader number="07" label="COMMUNITY" right="OPEN SOURCE" />
      <div className="py-10 lg:py-14">
        <LineMaskHeading
          className="text-[clamp(2.8rem,8vw,8.5rem)]"
          lines={[<>BUILT IN</>, <>THE OPEN.</>]}
        />
      </div>

      <div className="l4-line grid grid-cols-1 border sm:grid-cols-2">
        <a
          href={SOCIAL_LINKS.GITHUB}
          target="_blank"
          rel="noreferrer"
          className="l4-line hover:bg-flare hover:text-ink group flex flex-col gap-10 border-b p-8 transition-colors sm:border-b-0 sm:border-r sm:p-12"
        >
          <FontAwesomeIcon icon={faGithub} className="text-4xl" />
          <div>
            <span className="font-brut-display text-3xl font-bold uppercase sm:text-4xl">
              GitHub <span aria-hidden>↗</span>
            </span>
            <MonoLabel className="l4-muted mt-3 block group-hover:text-ink/70">
              STAR / FORK / CONTRIBUTE
            </MonoLabel>
          </div>
        </a>
        <a
          href={SOCIAL_LINKS.DISCORD}
          target="_blank"
          rel="noreferrer"
          className="hover:bg-flare hover:text-ink group flex flex-col gap-10 p-8 transition-colors sm:p-12"
        >
          <FontAwesomeIcon icon={faDiscord} className="text-4xl" />
          <div>
            <span className="font-brut-display text-3xl font-bold uppercase sm:text-4xl">
              Discord <span aria-hidden>↗</span>
            </span>
            <MonoLabel className="l4-muted mt-3 block group-hover:text-ink/70">
              SHARE / LEARN / SHIP
            </MonoLabel>
          </div>
        </a>
      </div>
    </section>
  </>
);
