"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { lenisRef } from "@/lib/lenis-ref";
import {
  NAV_H,
  clamp01,
  easeInOutCubic,
  easeOutExpo,
  type MeasuredSection,
  type RulerMode,
  type RulerSide,
} from "./ruler-shared";
import {
  rulerLayoutTuner,
  rulerLookTuner,
  rulerMotionTuner,
} from "./ruler-tunables";

// The ruler's heading lifecycle. Each section's heading is a word with
// three homes, all in the ruler gutter:
//
//   queued  — compact horizontal link stacked at the bottom (the navbar:
//             where you're going),
//   riding  — vertical (reading upward) on the tick rail, 1:1 with the
//             document, annotating its section as it scrolls,
//   stacked — horizontal at the top (where you've been): passed sections
//             pin under the nav as a compact pile mirroring the bottom
//             queue, and the current section's heading sits just below the
//             pile at full size. When the next word flips in, the current
//             one demotes up into the pile — the two edges read as one
//             symmetric sectional navbar.
//
// Transitions between homes are scrub-bound letter-by-letter curves. Every
// word's pose is a pure function of scroll position, so everything is
// reversible; when scroll rests with a top flip half-done, a damped snap
// resolves it to the nearest side.
//
// The hero is special: its queued home doesn't exist (the hero wordmark IS
// its heading), so it fades into the riding phase as the visitor leaves the
// landing area. `HERO_ENTRY_INWARD_PX` is the slot the future hero-morph
// will fly the real wordmark into — the entrance is already expressed as a
// progress-driven pose, so the morph only has to replace the "from" pose.
const HERO_ENTRY_INWARD_PX = 48;

const SECTION_TICK_LEN = 12;

// A letter's pose on screen. x/y are the letter center in viewport px.
type Pose = {
  x: number;
  y: number;
  rot: number;
  scale: number;
  alpha: number;
};

// Per-label advance metrics, normalized to a 1px font so any size is a
// multiply. cum[i] is the advance before letter i; total is the word width.
type WordMetrics = {
  adv: number[];
  cum: number[];
  total: number;
};

type WordRefs = {
  letters: (HTMLSpanElement | null)[];
  hit: HTMLAnchorElement | null;
  tickEl: HTMLSpanElement | null;
  idxEl: HTMLSpanElement | null;
};

export default function HeadingFlow({
  mode,
  side,
  sections,
  geom,
  layoutVersion,
}: {
  mode: RulerMode;
  side: RulerSide;
  sections: MeasuredSection[];
  geom: { docH: number; vh: number; vw: number };
  layoutVersion: number;
}) {
  const [metrics, setMetrics] = useState<Record<string, WordMetrics> | null>(
    null,
  );
  const wordRefs = useRef<WordRefs[]>([]);
  const fs = useRef({
    lastY: 0,
    vel: 0,
    snapSince: null as number | null,
    snapping: false,
  });

  const layout = useMemo(
    () => rulerLayoutTuner.read(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layoutVersion],
  );

  const labelsKey = sections.map((s) => s.label).join("|");

  // Letter advances need the real display face — measure after fonts load.
  useEffect(() => {
    if (mode !== "full" || !sections.length) return;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      setMetrics(measureLabels(sections.map((s) => s.label)));
    };
    const ready = document.fonts?.ready;
    if (ready) ready.then(run).catch(run);
    else run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, labelsKey]);

  // Frame loop: pose every letter from the current scroll position.
  useEffect(() => {
    if (mode !== "full" || !metrics || !sections.length || !geom.docH) return;

    const tick = (_time: number, deltaMs: number) => {
      const st = fs.current;
      const lay = rulerLayoutTuner.read();
      const mt = rulerMotionTuner.read();
      const lk = rulerLookTuner.read();
      const { docH, vh, vw } = geom;
      const dt = Math.min(deltaMs / 1000, 0.1) || 0.016;

      const scrollY = window.scrollY;
      const maxScroll = Math.max(1, docH - vh);
      const progress = clamp01(scrollY / maxScroll);
      const drift = NAV_H * (1 - progress);

      const raw = (scrollY - st.lastY) / dt;
      st.lastY = scrollY;
      st.vel += (raw - st.vel) * (1 - Math.exp(-6 * dt));

      const T = (lay.thresholdPct / 100) * vh;
      const yTopLine = NAV_H + lay.topPad;
      const yQueueLine = vh - lay.queuePad;
      const hp = lay.headingPx;
      const rs = lay.ridingPx / hp;
      const qs = lay.queuePx / hp;
      const inwardSign = side === "right" ? -1 : 1;
      const railCenterX =
        side === "right" ? vw - lay.railW / 2 : lay.railW / 2;

      // Phase pass: flip/detach progress per word. Anchors increase with
      // index, so stacked words are always a prefix and at most one word is
      // mid-flip at a time.
      const phases = sections.map((s) => {
        const m = metrics[s.label];
        const rideLen = (m?.total ?? 0) * hp * rs;
        const v = s.anchor - scrollY + drift;
        const flipP = clamp01((T + mt.flipZone - v) / mt.flipZone);
        return { v, rideLen, flipP, detachP: 0, yq: yQueueLine };
      });

      // Backward pass: a word's queue slot depends on the occupancy of the
      // words below it, and its detach completes when its riding column's
      // TOP reaches that very slot — the tail letter (which leads the
      // mirrored stagger) lands at queue-heading height, so the peel stays
      // local to the queue entry; the rest of the column hangs below and is
      // revealed as the word rides up. yq is stable during the word's own
      // morph because later words detach much later.
      {
        let below = 0;
        for (let wi = sections.length - 1; wi >= 0; wi--) {
          const ph = phases[wi];
          const isHero = sections[wi].isHero;
          ph.yq = yQueueLine - lay.queueSlot * below;
          const formTop = isHero ? yQueueLine : ph.yq;
          ph.detachP = clamp01(
            (formTop + mt.detachZone - ph.v) / mt.detachZone,
          );
          if (!isHero) below += 1 - ph.detachP;
        }
      }

      let stackedCount = 0;
      let flipShift = 0;
      for (const p of phases) {
        if (p.flipP >= 1) stackedCount++;
        else if (p.flipP > 0) flipShift += p.flipP;
      }

      // Horizontal home for a word: letters run inward from the rail, with
      // the reading direction arranged so the word's tail sits nearest the
      // rail on a right-side ruler (and its head nearest on the left).
      const horizPose = (
        m: WordMetrics,
        i: number,
        yLine: number,
        s: number,
        alpha: number,
      ): Pose => {
        const along = (m.cum[i] + m.adv[i] / 2) * hp * s;
        const inward =
          lay.railW +
          lay.textPad +
          (side === "right" ? m.total * hp * s - along : along);
        return {
          x: side === "right" ? vw - inward : inward,
          y: yLine,
          rot: 0,
          scale: s,
          alpha,
        };
      };

      const ridePose = (
        m: WordMetrics,
        i: number,
        v: number,
        rideLen: number,
      ): Pose => ({
        x: railCenterX,
        y: v + rideLen - (m.cum[i] + m.adv[i] / 2) * hp * rs,
        rot: -90,
        scale: rs,
        alpha: 1,
      });

      for (let wi = 0; wi < sections.length; wi++) {
        const s = sections[wi];
        const m = metrics[s.label];
        const refs = wordRefs.current[wi];
        if (!m || !refs) continue;
        const { v, rideLen, flipP, detachP, yq } = phases[wi];
        const n = m.adv.length;

        // Word-level from/to homes for the active transition.
        let p: number;
        let from: (i: number) => Pose;
        let to: (i: number) => Pose;
        let reverseStagger = false;
        if (flipP > 0) {
          p = flipP;
          from = (i) => ridePose(m, i, v, rideLen);
          // Stacked words keep their document-order slot in the top pile
          // (wi is the index from the top, since stacked words are always
          // a prefix). The newest fully-stacked word holds the "current"
          // pose — full size, offset below the pile — and demotes into a
          // compact pile entry as the next word flips in.
          if (flipP >= 1) {
            const demote = wi === stackedCount - 1 ? flipShift : 1;
            const y =
              yTopLine + wi * lay.queueSlot + lay.currentGap * (1 - demote);
            const scale = 1 - (1 - qs) * demote;
            const alpha = 1 - (1 - lk.queueAlpha) * demote;
            to = (i) => horizPose(m, i, y, scale, alpha);
          } else {
            to = (i) =>
              horizPose(
                m,
                i,
                yTopLine + wi * lay.queueSlot + lay.currentGap,
                1,
                1,
              );
          }
        } else if (detachP < 1) {
          p = detachP;
          // Mirrored stagger: the rail-adjacent tail letter peels first, so
          // letters lift off in sequence from the rail side instead of the
          // lead letter sweeping across the ones still resting in the queue.
          reverseStagger = true;
          // The morph target is STATIONARY: the riding pose the word will
          // hold the instant detach completes (column TOP at its queue
          // slot, so the tail letter finishes at queue-heading height and
          // the head letters hang below — partly past the viewport edge is
          // fine, riding reveals them immediately). At p=1 this equals the
          // true riding pose, which then takes over seamlessly.
          const vForm = s.isHero ? yQueueLine : yq;
          to = (i) => ridePose(m, i, vForm, rideLen);
          if (s.isHero) {
            // Hero entrance: fade in from slightly inward of the rail —
            // the slot the future hero-morph will land the wordmark in.
            from = (i) => {
              const pose = ridePose(m, i, vForm, rideLen);
              return {
                ...pose,
                x: pose.x + inwardSign * HERO_ENTRY_INWARD_PX,
                alpha: 0,
              };
            };
          } else {
            from = (i) => horizPose(m, i, yq, qs, lk.queueAlpha);
          }
        } else {
          p = 1;
          from = to = (i) => ridePose(m, i, v, rideLen);
        }

        // Letter pass: staggered eased progress along an inward-bowed
        // quadratic curve between the two homes.
        const sf = mt.stagger;
        const span = 1 + (n - 1) * sf;
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        let maxAlpha = 0;
        for (let i = 0; i < n; i++) {
          const el = refs.letters[i];
          if (!el) continue;
          const si = reverseStagger ? n - 1 - i : i;
          const pi = clamp01(p * span - si * sf);
          const e = easeInOutCubic(pi);
          const a = from(i);
          const b = to(i);
          const cx = (a.x + b.x) / 2 + inwardSign * mt.arc;
          const cy = (a.y + b.y) / 2;
          const u = 1 - e;
          const x = u * u * a.x + 2 * u * e * cx + e * e * b.x;
          const y = u * u * a.y + 2 * u * e * cy + e * e * b.y;
          const rot = a.rot + (b.rot - a.rot) * e;
          const scale = a.scale + (b.scale - a.scale) * e;
          const alpha = a.alpha + (b.alpha - a.alpha) * e;
          el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`;
          el.style.opacity = String(alpha);
          if (alpha > maxAlpha) maxAlpha = alpha;
          // Per-axis extents (swapped when the glyph is rotated toward
          // vertical) so hit boxes stay tight: a shared radius made
          // neighboring queue links overlap, and the topmost sibling ate
          // clicks meant for the one above it.
          const wHalf = (m.adv[i] * hp * scale) / 2 + 2;
          const hHalf = (hp * scale) / 2 + 2;
          const vertical = Math.abs(rot) > 45;
          const xHalf = vertical ? hHalf : wHalf;
          const yHalf = vertical ? wHalf : hHalf;
          if (x - xHalf < minX) minX = x - xHalf;
          if (x + xHalf > maxX) maxX = x + xHalf;
          if (y - yHalf < minY) minY = y - yHalf;
          if (y + yHalf > maxY) maxY = y + yHalf;
        }

        // Hit box hugs the word wherever it is; a fully invisible word
        // (the hero before its entrance) must not capture clicks.
        if (refs.hit && isFinite(minX)) {
          refs.hit.style.left = `${minX - 2}px`;
          refs.hit.style.top = `${minY - 2}px`;
          refs.hit.style.width = `${maxX - minX + 4}px`;
          refs.hit.style.height = `${maxY - minY + 4}px`;
          refs.hit.style.pointerEvents = maxAlpha > 0.05 ? "auto" : "none";
        }

        // Section tick + index on the rail's inner edge, riding at the
        // word's anchor while the word rides.
        const presence =
          detachP * (1 - flipP) * (v > -80 && v < vh + 80 ? 1 : 0);
        if (refs.tickEl) {
          const x =
            side === "right" ? vw - lay.railW - SECTION_TICK_LEN : lay.railW;
          refs.tickEl.style.transform = `translate3d(${x}px, ${v}px, 0)`;
          refs.tickEl.style.opacity = String(presence * lk.majorAlpha);
        }
        if (refs.idxEl) {
          const x =
            side === "right"
              ? vw - lay.railW - SECTION_TICK_LEN - 4
              : lay.railW + SECTION_TICK_LEN + 4;
          refs.idxEl.style.transform = `translate3d(${x}px, ${v}px, 0) translate(${
            side === "right" ? "-100%" : "0"
          }, -50%)`;
          refs.idxEl.style.opacity = String(presence * lk.labelAlpha);
        }
      }

      // Snap: scroll resting with a top flip half-done resolves to the
      // nearest side after a beat, damped through Lenis.
      const lenis = lenisRef.current;
      const now = performance.now();
      const midIdx = phases.findIndex(
        (ph) => ph.flipP > 0.04 && ph.flipP < 0.96,
      );
      if (st.snapping) {
        if (midIdx < 0) st.snapping = false;
      } else if (midIdx >= 0 && Math.abs(st.vel) < 30 && lenis) {
        if (st.snapSince === null) {
          st.snapSince = now;
        } else if (now - st.snapSince > mt.snapDelay) {
          const ph = phases[midIdx];
          const vTarget =
            ph.flipP >= 0.5 ? T - 4 : T + mt.flipZone + 4;
          const target = Math.max(
            0,
            Math.min(maxScroll, sections[midIdx].anchor + drift - vTarget),
          );
          st.snapping = true;
          st.snapSince = null;
          lenis.scrollTo(target, {
            duration: mt.snapDur,
            easing: easeInOutCubic,
            onComplete: () => {
              st.snapping = false;
            },
          });
        }
      } else {
        st.snapSince = null;
      }
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [mode, metrics, sections, geom, side, layoutVersion]);

  if (!sections.length) return null;

  // Reduced motion: the headings become a plain fixed section index by the
  // rail's bottom — same destinations, no choreography.
  if (mode === "static") {
    const sideStyle =
      side === "right"
        ? { right: layout.railW + layout.textPad, textAlign: "right" as const }
        : { left: layout.railW + layout.textPad };
    return (
      <nav
        aria-label="Sections"
        className="fixed z-40"
        style={{ bottom: layout.queuePad, ...sideStyle }}
      >
        <ul className="flex flex-col gap-1.5">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="font-display text-ink hover:text-ink-strong"
                style={{ fontSize: layout.queuePx + 2 }}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  if (!metrics) return null;

  const jump = (s: MeasuredSection) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const lenis = lenisRef.current;
    const el = document.getElementById(s.id);
    const target = s.isHero
      ? 0
      : el
        ? el.getBoundingClientRect().top + window.scrollY - NAV_H
        : s.anchor - NAV_H;
    if (lenis) {
      lenis.scrollTo(target, {
        duration: rulerMotionTuner.read().jumpDur,
        easing: easeOutExpo,
      });
    } else {
      window.scrollTo({ top: target });
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {sections.map((s, wi) => {
        const refs = (wordRefs.current[wi] ??= {
          letters: [],
          hit: null,
          tickEl: null,
          idxEl: null,
        });
        return (
          <Fragment key={s.id}>
            <a
              href={`#${s.id}`}
              ref={(el) => {
                refs.hit = el;
              }}
              onClick={jump(s)}
              aria-label={`Jump to ${s.label}`}
              className="pointer-events-auto absolute cursor-pointer"
            />
            <span
              ref={(el) => {
                refs.tickEl = el;
              }}
              aria-hidden
              className="absolute top-0 left-0 block bg-ink"
              style={{ width: SECTION_TICK_LEN, height: 1, opacity: 0 }}
            />
            <span
              ref={(el) => {
                refs.idxEl = el;
              }}
              aria-hidden
              className="absolute top-0 left-0 font-mono text-ink"
              style={{ fontSize: 9, letterSpacing: "0.08em", opacity: 0 }}
            />
            {s.label.split("").map((ch, li) => (
              <span
                key={li}
                ref={(el) => {
                  refs.letters[li] = el;
                }}
                aria-hidden
                className="font-display absolute top-0 left-0 whitespace-pre text-ink-strong"
                style={{
                  fontSize: layout.headingPx,
                  lineHeight: 1,
                  opacity: 0,
                  willChange: "transform, opacity",
                  textShadow: "0 0 4px var(--bg), 0 0 10px var(--bg)",
                }}
              >
                {ch}
              </span>
            ))}
          </Fragment>
        );
      })}
    </div>
  );
}

// Measures per-letter advances for each label by laying the letters out as
// spans in a hidden probe styled like the real headings. Normalized to a
// 1px font (measured at 100px for integer-rounding headroom).
function measureLabels(labels: string[]): Record<string, WordMetrics> {
  const probe = document.createElement("div");
  probe.className = "font-display";
  probe.style.cssText =
    "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;font-size:100px;line-height:1;";
  document.body.appendChild(probe);

  const out: Record<string, WordMetrics> = {};
  for (const label of labels) {
    probe.textContent = "";
    const spans = label.split("").map((ch) => {
      const span = document.createElement("span");
      span.textContent = ch;
      probe.appendChild(span);
      return span;
    });
    const adv = spans.map((sp) => sp.getBoundingClientRect().width / 100);
    const cum: number[] = [];
    let total = 0;
    for (const a of adv) {
      cum.push(total);
      total += a;
    }
    out[label] = { adv, cum, total };
  }

  probe.remove();
  return out;
}
