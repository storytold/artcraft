import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const ACCENT = "#00E5FF";

const PAPER_VARS = {
  "--l4-bg": "#F2F1EC",
  "--l4-ink": "#0A0A0B",
  "--l4-line": "rgba(10,10,11,0.18)",
  "--l4-muted": "rgba(10,10,11,0.55)",
};

const DARK_VARS = {
  "--l4-bg": "#0A0A0B",
  "--l4-ink": "#F2F1EC",
  "--l4-line": "rgba(242,241,236,0.16)",
  "--l4-muted": "rgba(242,241,236,0.55)",
};

// All ScrollTrigger wiring for landing4. Sections carry data-l4-* hooks;
// this module owns the motion. Runs inside a gsap.context created by the
// page component, so everything reverts on unmount.
//
// NOTE: entrance animations deliberately create their tweens inside onEnter
// callbacks (the landing3 pattern) instead of linking a pre-built tween to
// the trigger — pre-linked non-scrub tweens failed to fire on triggers that
// were already past their start position at mount.
export function initLanding4Animations(root: HTMLElement): void {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reducedMotion) {
    // Everything stays in its final, fully visible state (no initial hidden
    // states are ever applied). Accent words still get their color, and
    // chapter colors snap so paper sections stay legible.
    root.querySelectorAll<HTMLElement>("[data-l4-word]").forEach((word) => {
      word.style.opacity = "1";
      if (word.dataset.l4WordAccent !== undefined) {
        word.style.color = ACCENT;
      }
    });
    setupChapterSnaps(root, true);
    return;
  }

  setupLineMasks(root);
  setupReveals(root);
  setupWipes(root);
  setupCounters(root);
  setupOwnershipPanel(root);

  const mm = gsap.matchMedia();

  mm.add("(min-width: 1024px)", () => {
    setupManifestoScrub(root);
    setupChapterScrubs(root);
  });

  mm.add("(max-width: 1023px)", () => {
    setupManifestoFade(root);
    setupChapterSnaps(root, false);
  });
}

// Headline line reveals: each [data-l4-line-group] staggers its masked lines
// up into view when the group enters the viewport.
function setupLineMasks(root: HTMLElement) {
  const groups = root.querySelectorAll<HTMLElement>("[data-l4-line-group]");
  groups.forEach((group) => {
    const lines = group.querySelectorAll<HTMLElement>("[data-l4-line]");
    gsap.set(lines, { yPercent: 110 });
    ScrollTrigger.create({
      trigger: group,
      start: "top 85%",
      once: true,
      onEnter: () =>
        gsap.to(lines, {
          yPercent: 0,
          duration: 0.9,
          ease: "power4.out",
          stagger: 0.09,
        }),
    });
  });
}

// Generic fade-up entrances, batched like landing3 so ~30 elements share a
// handful of triggers instead of one each.
function setupReveals(root: HTMLElement) {
  const elements = gsap.utils.toArray<HTMLElement>("[data-l4-reveal]", root);
  if (!elements.length) return;
  gsap.set(elements, { autoAlpha: 0, y: 20 });
  ScrollTrigger.batch(elements, {
    start: "top 88%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.06,
      }),
  });
}

// Media frames open with a left→right clip wipe.
function setupWipes(root: HTMLElement) {
  const elements = gsap.utils.toArray<HTMLElement>("[data-l4-wipe]", root);
  elements.forEach((el) => {
    gsap.set(el, { clipPath: "inset(0 100% 0 0)" });
    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () =>
        gsap.to(el, {
          clipPath: "inset(0 0% 0 0)",
          duration: 1.1,
          ease: "power3.inOut",
        }),
    });
  });
}

// Model-wall counters tick from 0 to their data-l4-counter target once.
function setupCounters(root: HTMLElement) {
  const counters = root.querySelectorAll<HTMLElement>("[data-l4-counter]");
  counters.forEach((el) => {
    const target = Number(el.dataset.l4Counter);
    if (Number.isNaN(target)) return;
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => {
        const state = { value: 0 };
        gsap.to(state, {
          value: target,
          duration: 1.4,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = String(Math.round(state.value));
          },
        });
      },
    });
  });
}

// Ownership ink panel reveals with a top→bottom wipe.
function setupOwnershipPanel(root: HTMLElement) {
  const panel = root.querySelector<HTMLElement>("[data-l4-panel]");
  if (!panel) return;
  gsap.set(panel, { clipPath: "inset(0 0 100% 0)" });
  ScrollTrigger.create({
    trigger: panel,
    start: "top 82%",
    once: true,
    onEnter: () =>
      gsap.to(panel, {
        clipPath: "inset(0 0 0% 0)",
        duration: 1.1,
        ease: "power3.inOut",
      }),
  });
}

// Desktop manifesto: the tall section pins its inner viewport via CSS sticky;
// this scrub raises each word to full opacity in sequence and flips accent
// words to the accent color near their reveal.
function setupManifestoScrub(root: HTMLElement) {
  const section = root.querySelector<HTMLElement>("[data-l4-manifesto]");
  if (!section) return;
  const words = section.querySelectorAll<HTMLElement>("[data-l4-word]");
  if (!words.length) return;

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
    },
  });
  words.forEach((word) => {
    timeline.to(word, { opacity: 1, duration: 1, ease: "none" }, "<0.35");
    if (word.dataset.l4WordAccent !== undefined) {
      timeline.to(word, { color: ACCENT, duration: 0.5 }, "<");
    }
  });
}

// Mobile manifesto: no pin, just a staggered fade of the words.
function setupManifestoFade(root: HTMLElement) {
  const section = root.querySelector<HTMLElement>("[data-l4-manifesto]");
  if (!section) return;
  const words = section.querySelectorAll<HTMLElement>("[data-l4-word]");
  if (!words.length) return;
  ScrollTrigger.create({
    trigger: section,
    start: "top 70%",
    once: true,
    onEnter: () => {
      gsap.to(words, {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.03,
      });
      words.forEach((word) => {
        if (word.dataset.l4WordAccent !== undefined) {
          gsap.to(word, { color: ACCENT, duration: 0.5, delay: 0.4 });
        }
      });
    },
  });
}

// Desktop chapter transitions: scrubbing through each boundary spacer tweens
// the root CSS vars, recoloring everything chapter-aware (navbar, hairlines,
// type) as one system.
function setupChapterScrubs(root: HTMLElement) {
  root
    .querySelectorAll<HTMLElement>("[data-l4-boundary]")
    .forEach((boundary) => {
      const vars =
        boundary.dataset.l4Boundary === "paper" ? PAPER_VARS : DARK_VARS;
      gsap.to(root, {
        ...vars,
        ease: "none",
        scrollTrigger: {
          trigger: boundary,
          start: "top 75%",
          end: "bottom 25%",
          scrub: true,
        },
      });
    });
}

// Mobile / reduced-motion chapter transitions: tween (or snap) the vars when
// the boundary enters, and reverse when scrolling back up past it.
function setupChapterSnaps(root: HTMLElement, instant: boolean) {
  root
    .querySelectorAll<HTMLElement>("[data-l4-boundary]")
    .forEach((boundary) => {
      const isPaper = boundary.dataset.l4Boundary === "paper";
      const forward = isPaper ? PAPER_VARS : DARK_VARS;
      const backward = isPaper ? DARK_VARS : PAPER_VARS;
      const duration = instant ? 0 : 0.6;
      ScrollTrigger.create({
        trigger: boundary,
        start: "top 60%",
        onEnter: () => gsap.to(root, { ...forward, duration }),
        onLeaveBack: () => gsap.to(root, { ...backward, duration }),
      });
    });
}
