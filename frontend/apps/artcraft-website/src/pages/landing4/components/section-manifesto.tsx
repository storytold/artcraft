import { Fragment } from "react";
import { MANIFESTO_ACCENT_WORDS, MANIFESTO_WORDS } from "../data";
import { MonoLabel } from "./ui";

// /02 — Statement. Dark chapter. On desktop the outer section is tall and the
// inner viewport sticks, while a scrubbed ScrollTrigger raises each word from
// 18% opacity to full as the user scrolls. Words tagged as accents also flip
// to flare. On mobile the section is static (no pin) and gets a simple fade.
// The [data-l4-boundary="paper"] spacer after the text drives the dark→paper
// chapter transition.
export const SectionManifesto = () => (
  <>
    <section data-l4-manifesto className="relative lg:h-[250vh]">
      <div className="flex min-h-[70svh] flex-col justify-center lg:sticky lg:top-0 lg:h-screen">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-8">
          <div className="l4-line grid grid-cols-1 gap-8 border-t pt-6 lg:grid-cols-12">
            <div className="lg:col-span-3" data-l4-reveal>
              <MonoLabel>
                /02 <span className="l4-muted ml-3">STATEMENT</span>
              </MonoLabel>
            </div>
            <p className="font-brut-display text-[clamp(1.8rem,4.5vw,4.2rem)] font-medium leading-[1.12] tracking-[-0.02em] lg:col-span-9">
              {MANIFESTO_WORDS.map((word, i) => (
                <Fragment key={i}>
                  <span
                    data-l4-word
                    data-l4-word-accent={
                      MANIFESTO_ACCENT_WORDS.has(word) ? "" : undefined
                    }
                    className="inline-block opacity-[0.18]"
                  >
                    {word}
                  </span>{" "}
                </Fragment>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
    {/* Chapter boundary: scrubbing through this spacer tweens the root CSS
        vars from the dark palette to paper. */}
    <div data-l4-boundary="paper" aria-hidden className="h-[60vh]" />
  </>
);
