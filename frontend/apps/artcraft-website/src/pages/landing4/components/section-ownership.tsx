import { OWNERSHIP_ROWS, RENTAL_ROWS } from "../data";
import { LineMaskHeading, MonoLabel, SectionHeader } from "./ui";

// /05 — Ownership. Paper chapter with the page's strongest hit: a full ink
// panel for the ArtCraft column against a paper ledger of rental grievances.
export const SectionOwnership = () => (
  <section className="mx-auto w-full max-w-[1600px] px-4 py-24 sm:px-8 lg:py-32">
    <SectionHeader number="05" label="OWNERSHIP" right="NO RENT PAYMENTS" />
    <div className="py-10 lg:py-14">
      <LineMaskHeading
        className="text-[clamp(2.8rem,8vw,8.5rem)]"
        lines={[<>STOP RENTING</>, <span className="l4-stroke">YOUR TOOLS</span>]}
      />
      <p className="l4-muted mt-8 max-w-md font-brut-body text-base leading-relaxed">
        ArtCraft is yours to own and keep, forever. No subscriptions needed, no
        aggregator middleman, no rent payments.
      </p>
    </div>

    <div className="l4-line grid grid-cols-1 border-t lg:grid-cols-2">
      {/* The subscription web — ledger of grievances */}
      <div className="l4-line py-8 lg:border-r lg:pr-12">
        <MonoLabel className="l4-muted">✕ THE SUBSCRIPTION WEB</MonoLabel>
        <ul className="mt-8">
          {RENTAL_ROWS.map((row) => (
            <li
              key={row}
              data-l4-reveal
              className="l4-line flex items-baseline gap-4 border-b py-4"
            >
              <span
                aria-hidden
                className="l4-muted font-brut-mono text-sm font-bold"
              >
                ✕
              </span>
              <span className="l4-muted font-brut-body text-base">{row}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ArtCraft — ink block panel */}
      <div
        data-l4-panel
        className="bg-ink text-paper my-8 flex flex-col justify-between p-8 sm:p-10 lg:my-0 lg:ml-12"
      >
        <div>
          <MonoLabel className="text-flare">✓ ARTCRAFT</MonoLabel>
          <ul className="mt-8">
            {OWNERSHIP_ROWS.map((row) => (
              <li
                key={row}
                className="flex items-baseline gap-4 border-b border-paper/15 py-4"
              >
                <span
                  aria-hidden
                  className="text-flare font-brut-mono text-sm font-bold"
                >
                  ✓
                </span>
                <span className="font-brut-body text-base text-paper/85">
                  {row}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <MonoLabel className="mt-10 text-paper/40">
          LICENSE — YOURS / SERVERS — OPTIONAL
        </MonoLabel>
      </div>
    </div>
  </section>
);
