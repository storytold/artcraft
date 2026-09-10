"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { lenisRef } from "@/lib/lenis-ref";
import {
  NAV_H,
  clamp01,
  easeInOutCubic,
  easeOutExpo,
  heroWordmark,
  railOccupancy,
  rulerMap,
  rulerZoom,
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
// The hero is special: it IS the current section from load, so its whole
// lifecycle is one flip — the wordmark's own letter spans (published via
// the shared heroWordmark channel) fly STRAIGHT from the resting title to
// the top current-heading slot as the wordmark is about to duck under the
// nav (title-condenses-into-header), no queue home and no rail ride. From
// the stack onward it behaves like any section (demotes when FEATURES
// flips in). The hero letters keep their Archivo Black wordmark face
// through the whole lifecycle — brand identity, and font families can't
// interpolate.

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
      const map = rulerMap(vh, lay.edgePad);
      const drift = map.drift(progress);

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
      // Zoomed map blend: every word converges on a horizontal label at
      // its section's true percent position while the rail compresses.
      const zoomE = easeInOutCubic(rulerZoom.p);

      // Phase pass: flip/detach progress per word. Anchors increase with
      // index, so stacked words are always a prefix and at most one word is
      // mid-flip at a time.
      const phases = sections.map((s) => {
        const m =
          s.isHero && heroWordmark.ready
            ? heroWordmark.metrics
            : metrics[s.label];
        const rideLen = (m?.total ?? 0) * hp * rs;
        const v = s.anchor - scrollY + drift;
        let flipP: number;
        let detachP = 0;
        // Some flips run in scroll space instead of anchor space; snap
        // resolves those against these bounds.
        let scrollFlip: { start: number; end: number } | null = null;
        if (s.isHero) {
          // The hero IS the current section from load — its heading goes
          // STRAIGHT to the top slot (no queue, no ride): the whole
          // lifecycle is one flip, driven by the wordmark about to duck
          // under the nav (title-condenses-into-header), begun heroLead px
          // early and spanning heroZone px of scroll.
          detachP = 1;
          const wordTop = heroWordmark.ready
            ? Math.min(...heroWordmark.baseDocY) - heroWordmark.fontPx * 0.5
            : 0;
          const start = Math.max(0, wordTop - NAV_H - mt.heroLead);
          const zone = Math.max(1, mt.heroZone);
          flipP = clamp01((scrollY - start) / zone);
          scrollFlip = { start, end: start + zone };
        } else {
          flipP = clamp01((T + mt.flipZone - v) / mt.flipZone);
          // End-of-page driver: a section too short to ever carry its
          // word up to the threshold (its best reachable v is still below
          // the flip line) flips from "section fully in view" to "no more
          // scroll". At page bottom the pile is complete.
          if (s.anchor - maxScroll > T) {
            const endStart = Math.min(s.bottom - vh, maxScroll - 24);
            const zone = Math.max(24, maxScroll - endStart);
            flipP = Math.max(flipP, clamp01((scrollY - endStart) / zone));
            scrollFlip = { start: endStart, end: maxScroll };
          }
        }
        return { v, rideLen, flipP, scrollFlip, detachP, yq: yQueueLine };
      });

      // Backward pass: a word's queue slot depends on the occupancy of the
      // words below it, and its detach completes when its riding column's
      // BOTTOM reaches that very slot — the whole column ends up above the
      // queue line, fully on-screen, and the tail-led letters sweep upward
      // in the ease-out arc. (Chosen deliberately over tail-at-the-line
      // variants: those either hung letters past the viewport or pinned
      // the word at the line until the morph finished.) yq is stable
      // during the word's own morph because later words detach much later.
      {
        let below = 0;
        for (let wi = sections.length - 1; wi >= 0; wi--) {
          if (sections[wi].isHero) continue; // no queue home, detachP = 1
          const ph = phases[wi];
          ph.yq = yQueueLine - lay.queueSlot * below;
          ph.detachP = clamp01(
            (ph.yq + mt.detachZone - (ph.v + ph.rideLen)) / mt.detachZone,
          );
          below += 1 - ph.detachP;
        }
      }

      railOccupancy.spans.length = 0;

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

      // Vertical column with its top at `top`. In transit it shares the
      // queue links' alpha — only the top heading is active-bright; the
      // flip lerps toward the stack pose, so a word brightens on arrival.
      const ridePose = (m: WordMetrics, i: number, top: number): Pose => ({
        x: railCenterX,
        y: top + (m.total - m.cum[i] - m.adv[i] / 2) * hp * rs,
        rot: -90,
        scale: rs,
        alpha: lk.queueAlpha,
      });

      for (let wi = 0; wi < sections.length; wi++) {
        const s = sections[wi];
        const heroDrive = s.isHero && heroWordmark.ready;
        const m = heroDrive ? heroWordmark.metrics : metrics[s.label];
        const refs = wordRefs.current[wi];
        if (!m || !refs || (s.isHero && !heroDrive)) continue;
        const { v, rideLen, flipP, detachP, yq } = phases[wi];
        const n = m.adv.length;

        // The hero's flip "from" home is the wordmark's own resting
        // layout — identity transform at rest, so it's pixel-perfect and
        // crisp, and the title flies STRAIGHT to the top heading slot.
        const heroBase = (i: number): Pose => ({
          x: heroWordmark.baseX[i],
          y: heroWordmark.baseDocY[i] - scrollY,
          rot: 0,
          scale: heroWordmark.fontPx / hp,
          alpha: 1,
        });

        // Word-level from/to homes for the active transition.
        let p: number;
        let from: (i: number) => Pose;
        let to: (i: number) => Pose;
        let reverseStagger = false;
        if (flipP > 0) {
          p = flipP;
          // Tail-first here too: the tail letter sits at the column's top
          // (or, for the hero, nearest the rail) and lands nearest the
          // rail — shortest flight leads the peel.
          reverseStagger = true;
          from = heroDrive ? heroBase : (i) => ridePose(m, i, v);
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
          // The morph target is STATIONARY: the riding pose the word holds
          // the instant detach completes — full column resting just above
          // its queue slot (bottom at the line). Letters sweep up in the
          // ease-out arc, fully on-screen; at p=1 this equals the true
          // riding pose, which takes over seamlessly.
          const vForm = yq - rideLen;
          to = (i) => ridePose(m, i, vForm);
          from = (i) => horizPose(m, i, yq, qs, lk.queueAlpha);
        } else {
          p = 1;
          from = to = heroDrive ? heroBase : (i) => ridePose(m, i, v);
        }

        // Letter pass: staggered eased progress along an inward-bowed
        // quadratic curve between the two homes.
        const sf = mt.stagger;
        const span = 1 + (n - 1) * sf;
        const mapY = map.base + ((s.isHero ? 0 : s.anchor) / docH) * map.span;
        // Hero letters are the wordmark's own spans (base-relative
        // transforms, rendered at fontPx so scale writes need the hp/fontPx
        // correction). Its zoom-map blend scales with detachP so hovering
        // the rail at page top never dismantles the resting wordmark.
        const letterEls = heroDrive ? heroWordmark.els : refs.letters;
        const scaleFix = heroDrive ? hp / heroWordmark.fontPx : 1;
        const wz = heroDrive ? zoomE * Math.min(1, flipP) : zoomE;
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        let maxAlpha = 0;
        for (let i = 0; i < n; i++) {
          const el = letterEls[i];
          if (!el) continue;
          const si = reverseStagger ? n - 1 - i : i;
          const pi = clamp01(p * span - si * sf);
          const e = easeInOutCubic(pi);
          const a = from(i);
          const b = to(i);
          const cx = (a.x + b.x) / 2 + inwardSign * mt.arc;
          const cy = (a.y + b.y) / 2;
          const u = 1 - e;
          let x = u * u * a.x + 2 * u * e * cx + e * e * b.x;
          let y = u * u * a.y + 2 * u * e * cy + e * e * b.y;
          let rot = a.rot + (b.rot - a.rot) * e;
          let scale = a.scale + (b.scale - a.scale) * e;
          let alpha = a.alpha + (b.alpha - a.alpha) * e;
          if (wz > 0) {
            const mp = horizPose(m, i, mapY, qs, lk.mapAlpha);
            x += (mp.x - x) * wz;
            y += (mp.y - y) * wz;
            rot *= 1 - wz;
            scale += (mp.scale - scale) * wz;
            alpha += (mp.alpha - alpha) * wz;
          }
          if (heroDrive) {
            el.style.transform = `translate3d(${
              x - heroWordmark.baseX[i]
            }px, ${
              y - (heroWordmark.baseDocY[i] - scrollY)
            }px, 0) rotate(${rot}deg) scale(${scale * scaleFix})`;
          } else {
            el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`;
          }
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

        // Publish the word's riding footprint — the settled column span,
        // NOT the in-flight letter bbox (that swept across labels during
        // detach/flip flights and made them flicker) — with a strength
        // that ramps smoothly with how on-rail the word is, so labels fade
        // in proportion instead of blinking.
        // (The hero never rides the rail — it flies straight to the top —
        // so it never occupies the tick lane.)
        const onRail = s.isHero ? 0 : detachP * (1 - flipP);
        if (onRail > 0.02) {
          railOccupancy.spans.push({ top: v, bottom: v + rideLen, k: onRail });
        }

        // Hit box hugs the word wherever it is; a fully invisible word
        // (the hero before its entrance) must not capture clicks.
        if (refs.hit && isFinite(minX)) {
          refs.hit.style.left = `${minX - 2}px`;
          refs.hit.style.top = `${minY - 2}px`;
          refs.hit.style.width = `${maxX - minX + 4}px`;
          refs.hit.style.height = `${maxY - minY + 4}px`;
          // The resting hero wordmark must stay click-transparent (the
          // wall's drag lives underneath it) — its link only arms once the
          // morph is underway.
          refs.hit.style.pointerEvents =
            maxAlpha > 0.05 && (!s.isHero || flipP > 0.05)
              ? "auto"
              : "none";
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
      } else if (
        midIdx >= 0 &&
        Math.abs(st.vel) < 30 &&
        lenis &&
        !rulerZoom.dragging &&
        rulerZoom.p < 0.3
      ) {
        if (st.snapSince === null) {
          st.snapSince = now;
        } else if (now - st.snapSince > mt.snapDelay) {
          const ph = phases[midIdx];
          const sMid = sections[midIdx];
          // Scroll-space flips (the hero's straight-to-header morph, and
          // end-of-page flips whose v never reaches the threshold) resolve
          // against their own bounds; threshold flips resolve in v space.
          let raw: number;
          if (ph.scrollFlip) {
            raw =
              ph.flipP >= 0.5 ? ph.scrollFlip.end + 4 : ph.scrollFlip.start - 4;
          } else {
            const vTarget = ph.flipP >= 0.5 ? T - 4 : T + mt.flipZone + 4;
            raw = sMid.anchor + drift - vTarget;
          }
          const target = Math.max(0, Math.min(maxScroll, raw));
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
        {/* Same contrast pool as the full instrument's queue. */}
        <div
          aria-hidden
          className="absolute -inset-x-16 -inset-y-10"
          style={{
            background: `radial-gradient(closest-side, color-mix(in srgb, var(--bg) 85%, transparent), transparent)`,
          }}
        />
        <ul className="relative flex flex-col gap-1.5">
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
      {/* Contrast pools: page-bg radial fades pinned to the rail's top and
          bottom corners, so the top stack and the bottom queue always read
          over whatever content scrolls beneath them. */}
      <div
        aria-hidden
        className="absolute top-0 h-[36vh] w-[clamp(220px,24vw,400px)]"
        style={{
          ...(side === "right" ? { right: 0 } : { left: 0 }),
          background: `radial-gradient(110% 100% at ${side === "right" ? "100%" : "0%"} 0%, color-mix(in srgb, var(--bg) 88%, transparent), color-mix(in srgb, var(--bg) 48%, transparent) 52%, transparent 78%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute bottom-0 h-[32vh] w-[clamp(220px,24vw,400px)]"
        style={{
          ...(side === "right" ? { right: 0 } : { left: 0 }),
          background: `radial-gradient(110% 100% at ${side === "right" ? "100%" : "0%"} 100%, color-mix(in srgb, var(--bg) 88%, transparent), color-mix(in srgb, var(--bg) 48%, transparent) 52%, transparent 78%)`,
        }}
      />
      {sections.map((s, wi) => {
        const refs = (wordRefs.current[wi] ??= {
          letters: [],
          hit: null,
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
            {/* Hero letters live in the hero wordmark itself and are
                driven via the shared channel — render none here. */}
            {!s.isHero &&
              s.label.split("").map((ch, li) => (
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
