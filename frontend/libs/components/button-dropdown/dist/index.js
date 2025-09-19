import { jsx as Y, jsxs as Xe, Fragment as Ct } from "react/jsx-runtime";
import * as S from "react";
import ke, { useRef as le, useCallback as Ge, useEffect as Ee, useState as $e, useMemo as Ye, useLayoutEffect as Xi, useContext as Ke, createContext as dt, forwardRef as fb, Fragment as mt, isValidElement as lc, cloneElement as cc, createElement as Kx, useId as Or, useReducer as Xx, useSyncExternalStore as Qx } from "react";
import * as na from "react-dom";
import Jx, { createPortal as Zx, flushSync as uc, unstable_batchedUpdates as ew } from "react-dom";
const db = typeof document < "u" ? ke.useLayoutEffect : () => {
};
function tw(e) {
  const t = le(null);
  return db(() => {
    t.current = e;
  }, [
    e
  ]), Ge((...n) => {
    const r = t.current;
    return r == null ? void 0 : r(...n);
  }, []);
}
const tr = (e) => {
  var t;
  return (t = e == null ? void 0 : e.ownerDocument) !== null && t !== void 0 ? t : document;
}, rr = (e) => e && "window" in e && e.window === e ? e : tr(e).defaultView || window;
function nw(e) {
  return e !== null && typeof e == "object" && "nodeType" in e && typeof e.nodeType == "number";
}
function rw(e) {
  return nw(e) && e.nodeType === Node.DOCUMENT_FRAGMENT_NODE && "host" in e;
}
let ow = !1;
function af() {
  return ow;
}
function pb(e, t) {
  if (!af()) return t && e ? e.contains(t) : !1;
  if (!e || !t) return !1;
  let n = t;
  for (; n !== null; ) {
    if (n === e) return !0;
    n.tagName === "SLOT" && n.assignedSlot ? n = n.assignedSlot.parentNode : rw(n) ? n = n.host : n = n.parentNode;
  }
  return !1;
}
const fc = (e = document) => {
  var t;
  if (!af()) return e.activeElement;
  let n = e.activeElement;
  for (; n && "shadowRoot" in n && (!((t = n.shadowRoot) === null || t === void 0) && t.activeElement); ) n = n.shadowRoot.activeElement;
  return n;
};
function mb(e) {
  return af() && e.target.shadowRoot && e.composedPath ? e.composedPath()[0] : e.target;
}
function aw(e) {
  var t;
  return typeof window > "u" || window.navigator == null ? !1 : ((t = window.navigator.userAgentData) === null || t === void 0 ? void 0 : t.brands.some((n) => e.test(n.brand))) || e.test(window.navigator.userAgent);
}
function iw(e) {
  var t;
  return typeof window < "u" && window.navigator != null ? e.test(((t = window.navigator.userAgentData) === null || t === void 0 ? void 0 : t.platform) || window.navigator.platform) : !1;
}
function gb(e) {
  let t = null;
  return () => (t == null && (t = e()), t);
}
const sw = gb(function() {
  return iw(/^Mac/i);
}), lw = gb(function() {
  return aw(/Android/i);
});
function hb() {
  let e = le(/* @__PURE__ */ new Map()), t = Ge((o, a, i, s) => {
    let l = s != null && s.once ? (...c) => {
      e.current.delete(i), i(...c);
    } : i;
    e.current.set(i, {
      type: a,
      eventTarget: o,
      fn: l,
      options: s
    }), o.addEventListener(a, l, s);
  }, []), n = Ge((o, a, i, s) => {
    var l;
    let c = ((l = e.current.get(i)) === null || l === void 0 ? void 0 : l.fn) || i;
    o.removeEventListener(a, c, s), e.current.delete(i);
  }, []), r = Ge(() => {
    e.current.forEach((o, a) => {
      n(o.eventTarget, o.type, a, o.options);
    });
  }, [
    n
  ]);
  return Ee(() => r, [
    r
  ]), {
    addGlobalListener: t,
    removeGlobalListener: n,
    removeAllGlobalListeners: r
  };
}
function cw(e) {
  return e.mozInputSource === 0 && e.isTrusted ? !0 : lw() && e.pointerType ? e.type === "click" && e.buttons === 1 : e.detail === 0 && !e.pointerType;
}
class bb {
  isDefaultPrevented() {
    return this.nativeEvent.defaultPrevented;
  }
  preventDefault() {
    this.defaultPrevented = !0, this.nativeEvent.preventDefault();
  }
  stopPropagation() {
    this.nativeEvent.stopPropagation(), this.isPropagationStopped = () => !0;
  }
  isPropagationStopped() {
    return !1;
  }
  persist() {
  }
  constructor(t, n) {
    this.nativeEvent = n, this.target = n.target, this.currentTarget = n.currentTarget, this.relatedTarget = n.relatedTarget, this.bubbles = n.bubbles, this.cancelable = n.cancelable, this.defaultPrevented = n.defaultPrevented, this.eventPhase = n.eventPhase, this.isTrusted = n.isTrusted, this.timeStamp = n.timeStamp, this.type = t;
  }
}
function yb(e) {
  let t = le({
    isFocused: !1,
    observer: null
  });
  db(() => {
    const r = t.current;
    return () => {
      r.observer && (r.observer.disconnect(), r.observer = null);
    };
  }, []);
  let n = tw((r) => {
    e == null || e(r);
  });
  return Ge((r) => {
    if (r.target instanceof HTMLButtonElement || r.target instanceof HTMLInputElement || r.target instanceof HTMLTextAreaElement || r.target instanceof HTMLSelectElement) {
      t.current.isFocused = !0;
      let o = r.target, a = (i) => {
        t.current.isFocused = !1, o.disabled && n(new bb("blur", i)), t.current.observer && (t.current.observer.disconnect(), t.current.observer = null);
      };
      o.addEventListener("focusout", a, {
        once: !0
      }), t.current.observer = new MutationObserver(() => {
        if (t.current.isFocused && o.disabled) {
          var i;
          (i = t.current.observer) === null || i === void 0 || i.disconnect();
          let s = o === document.activeElement ? null : document.activeElement;
          o.dispatchEvent(new FocusEvent("blur", {
            relatedTarget: s
          })), o.dispatchEvent(new FocusEvent("focusout", {
            bubbles: !0,
            relatedTarget: s
          }));
        }
      }), t.current.observer.observe(o, {
        attributes: !0,
        attributeFilter: [
          "disabled"
        ]
      });
    }
  }, [
    n
  ]);
}
let uw = !1, Sa = null, dc = /* @__PURE__ */ new Set(), Wo = /* @__PURE__ */ new Map(), ur = !1, pc = !1;
const fw = {
  Tab: !0,
  Escape: !0
};
function sf(e, t) {
  for (let n of dc) n(e, t);
}
function dw(e) {
  return !(e.metaKey || !sw() && e.altKey || e.ctrlKey || e.key === "Control" || e.key === "Shift" || e.key === "Meta");
}
function Oi(e) {
  ur = !0, dw(e) && (Sa = "keyboard", sf("keyboard", e));
}
function Ot(e) {
  Sa = "pointer", (e.type === "mousedown" || e.type === "pointerdown") && (ur = !0, sf("pointer", e));
}
function vb(e) {
  cw(e) && (ur = !0, Sa = "virtual");
}
function xb(e) {
  e.target === window || e.target === document || uw || !e.isTrusted || (!ur && !pc && (Sa = "virtual", sf("virtual", e)), ur = !1, pc = !1);
}
function wb() {
  ur = !1, pc = !0;
}
function mc(e) {
  if (typeof window > "u" || Wo.get(rr(e))) return;
  const t = rr(e), n = tr(e);
  let r = t.HTMLElement.prototype.focus;
  t.HTMLElement.prototype.focus = function() {
    ur = !0, r.apply(this, arguments);
  }, n.addEventListener("keydown", Oi, !0), n.addEventListener("keyup", Oi, !0), n.addEventListener("click", vb, !0), t.addEventListener("focus", xb, !0), t.addEventListener("blur", wb, !1), typeof PointerEvent < "u" ? (n.addEventListener("pointerdown", Ot, !0), n.addEventListener("pointermove", Ot, !0), n.addEventListener("pointerup", Ot, !0)) : (n.addEventListener("mousedown", Ot, !0), n.addEventListener("mousemove", Ot, !0), n.addEventListener("mouseup", Ot, !0)), t.addEventListener("beforeunload", () => {
    kb(e);
  }, {
    once: !0
  }), Wo.set(t, {
    focus: r
  });
}
const kb = (e, t) => {
  const n = rr(e), r = tr(e);
  t && r.removeEventListener("DOMContentLoaded", t), Wo.has(n) && (n.HTMLElement.prototype.focus = Wo.get(n).focus, r.removeEventListener("keydown", Oi, !0), r.removeEventListener("keyup", Oi, !0), r.removeEventListener("click", vb, !0), n.removeEventListener("focus", xb, !0), n.removeEventListener("blur", wb, !1), typeof PointerEvent < "u" ? (r.removeEventListener("pointerdown", Ot, !0), r.removeEventListener("pointermove", Ot, !0), r.removeEventListener("pointerup", Ot, !0)) : (r.removeEventListener("mousedown", Ot, !0), r.removeEventListener("mousemove", Ot, !0), r.removeEventListener("mouseup", Ot, !0)), Wo.delete(n));
};
function pw(e) {
  const t = tr(e);
  let n;
  return t.readyState !== "loading" ? mc(e) : (n = () => {
    mc(e);
  }, t.addEventListener("DOMContentLoaded", n)), () => kb(e, n);
}
typeof document < "u" && pw();
function Eb() {
  return Sa !== "pointer";
}
const mw = /* @__PURE__ */ new Set([
  "checkbox",
  "radio",
  "range",
  "color",
  "file",
  "image",
  "button",
  "submit",
  "reset"
]);
function gw(e, t, n) {
  let r = tr(n == null ? void 0 : n.target);
  const o = typeof window < "u" ? rr(n == null ? void 0 : n.target).HTMLInputElement : HTMLInputElement, a = typeof window < "u" ? rr(n == null ? void 0 : n.target).HTMLTextAreaElement : HTMLTextAreaElement, i = typeof window < "u" ? rr(n == null ? void 0 : n.target).HTMLElement : HTMLElement, s = typeof window < "u" ? rr(n == null ? void 0 : n.target).KeyboardEvent : KeyboardEvent;
  return e = e || r.activeElement instanceof o && !mw.has(r.activeElement.type) || r.activeElement instanceof a || r.activeElement instanceof i && r.activeElement.isContentEditable, !(e && t === "keyboard" && n instanceof s && !fw[n.key]);
}
function hw(e, t, n) {
  mc(), Ee(() => {
    let r = (o, a) => {
      gw(!!(n != null && n.isTextInput), o, a) && e(Eb());
    };
    return dc.add(r), () => {
      dc.delete(r);
    };
  }, t);
}
function bw(e) {
  let { isDisabled: t, onFocus: n, onBlur: r, onFocusChange: o } = e;
  const a = Ge((l) => {
    if (l.target === l.currentTarget)
      return r && r(l), o && o(!1), !0;
  }, [
    r,
    o
  ]), i = yb(a), s = Ge((l) => {
    const c = tr(l.target), u = c ? fc(c) : fc();
    l.target === l.currentTarget && u === mb(l.nativeEvent) && (n && n(l), o && o(!0), i(l));
  }, [
    o,
    n,
    i
  ]);
  return {
    focusProps: {
      onFocus: !t && (n || o || r) ? s : void 0,
      onBlur: !t && (r || o) ? a : void 0
    }
  };
}
function yw(e) {
  let { isDisabled: t, onBlurWithin: n, onFocusWithin: r, onFocusWithinChange: o } = e, a = le({
    isFocusWithin: !1
  }), { addGlobalListener: i, removeAllGlobalListeners: s } = hb(), l = Ge((f) => {
    f.currentTarget.contains(f.target) && a.current.isFocusWithin && !f.currentTarget.contains(f.relatedTarget) && (a.current.isFocusWithin = !1, s(), n && n(f), o && o(!1));
  }, [
    n,
    o,
    a,
    s
  ]), c = yb(l), u = Ge((f) => {
    if (!f.currentTarget.contains(f.target)) return;
    const d = tr(f.target), p = fc(d);
    if (!a.current.isFocusWithin && p === mb(f.nativeEvent)) {
      r && r(f), o && o(!0), a.current.isFocusWithin = !0, c(f);
      let b = f.currentTarget;
      i(d, "focus", (m) => {
        if (a.current.isFocusWithin && !pb(b, m.target)) {
          let g = new bb("blur", new d.defaultView.FocusEvent("blur", {
            relatedTarget: m.target
          }));
          g.target = b, g.currentTarget = b, l(g);
        }
      }, {
        capture: !0
      });
    }
  }, [
    r,
    o,
    c,
    i,
    l
  ]);
  return t ? {
    focusWithinProps: {
      // These cannot be null, that would conflict in mergeProps
      onFocus: void 0,
      onBlur: void 0
    }
  } : {
    focusWithinProps: {
      onFocus: u,
      onBlur: l
    }
  };
}
let Si = !1, Fs = 0;
function gc() {
  Si = !0, setTimeout(() => {
    Si = !1;
  }, 50);
}
function Vd(e) {
  e.pointerType === "touch" && gc();
}
function vw() {
  if (!(typeof document > "u"))
    return typeof PointerEvent < "u" ? document.addEventListener("pointerup", Vd) : document.addEventListener("touchend", gc), Fs++, () => {
      Fs--, !(Fs > 0) && (typeof PointerEvent < "u" ? document.removeEventListener("pointerup", Vd) : document.removeEventListener("touchend", gc));
    };
}
function xw(e) {
  let { onHoverStart: t, onHoverChange: n, onHoverEnd: r, isDisabled: o } = e, [a, i] = $e(!1), s = le({
    isHovered: !1,
    ignoreEmulatedMouseEvents: !1,
    pointerType: "",
    target: null
  }).current;
  Ee(vw, []);
  let { addGlobalListener: l, removeAllGlobalListeners: c } = hb(), { hoverProps: u, triggerHoverEnd: f } = Ye(() => {
    let d = (m, g) => {
      if (s.pointerType = g, o || g === "touch" || s.isHovered || !m.currentTarget.contains(m.target)) return;
      s.isHovered = !0;
      let v = m.currentTarget;
      s.target = v, l(tr(m.target), "pointerover", (k) => {
        s.isHovered && s.target && !pb(s.target, k.target) && p(k, k.pointerType);
      }, {
        capture: !0
      }), t && t({
        type: "hoverstart",
        target: v,
        pointerType: g
      }), n && n(!0), i(!0);
    }, p = (m, g) => {
      let v = s.target;
      s.pointerType = "", s.target = null, !(g === "touch" || !s.isHovered || !v) && (s.isHovered = !1, c(), r && r({
        type: "hoverend",
        target: v,
        pointerType: g
      }), n && n(!1), i(!1));
    }, b = {};
    return typeof PointerEvent < "u" ? (b.onPointerEnter = (m) => {
      Si && m.pointerType === "mouse" || d(m, m.pointerType);
    }, b.onPointerLeave = (m) => {
      !o && m.currentTarget.contains(m.target) && p(m, m.pointerType);
    }) : (b.onTouchStart = () => {
      s.ignoreEmulatedMouseEvents = !0;
    }, b.onMouseEnter = (m) => {
      !s.ignoreEmulatedMouseEvents && !Si && d(m, "mouse"), s.ignoreEmulatedMouseEvents = !1;
    }, b.onMouseLeave = (m) => {
      !o && m.currentTarget.contains(m.target) && p(m, "mouse");
    }), {
      hoverProps: b,
      triggerHoverEnd: p
    };
  }, [
    t,
    n,
    r,
    o,
    s,
    l,
    c
  ]);
  return Ee(() => {
    o && f({
      currentTarget: s.target
    }, s.pointerType);
  }, [
    o
  ]), {
    hoverProps: u,
    isHovered: a
  };
}
function ww(e = {}) {
  let { autoFocus: t = !1, isTextInput: n, within: r } = e, o = le({
    isFocused: !1,
    isFocusVisible: t || Eb()
  }), [a, i] = $e(!1), [s, l] = $e(() => o.current.isFocused && o.current.isFocusVisible), c = Ge(() => l(o.current.isFocused && o.current.isFocusVisible), []), u = Ge((p) => {
    o.current.isFocused = p, i(p), c();
  }, [
    c
  ]);
  hw((p) => {
    o.current.isFocusVisible = p, c();
  }, [], {
    isTextInput: n
  });
  let { focusProps: f } = bw({
    isDisabled: r,
    onFocusChange: u
  }), { focusWithinProps: d } = yw({
    isDisabled: !r,
    onFocusWithinChange: u
  });
  return {
    isFocused: a,
    isFocusVisible: s,
    focusProps: r ? d : f
  };
}
var kw = Object.defineProperty, Ew = (e, t, n) => t in e ? kw(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, Ls = (e, t, n) => (Ew(e, typeof t != "symbol" ? t + "" : t, n), n);
let Ow = class {
  constructor() {
    Ls(this, "current", this.detect()), Ls(this, "handoffState", "pending"), Ls(this, "currentId", 0);
  }
  set(t) {
    this.current !== t && (this.handoffState = "pending", this.currentId = 0, this.current = t);
  }
  reset() {
    this.set(this.detect());
  }
  nextId() {
    return ++this.currentId;
  }
  get isServer() {
    return this.current === "server";
  }
  get isClient() {
    return this.current === "client";
  }
  detect() {
    return typeof window > "u" || typeof document > "u" ? "server" : "client";
  }
  handoff() {
    this.handoffState === "pending" && (this.handoffState = "complete");
  }
  get isHandoffComplete() {
    return this.handoffState === "complete";
  }
}, cr = new Ow();
function io(e) {
  var t, n;
  return cr.isServer ? null : e ? "ownerDocument" in e ? e.ownerDocument : "current" in e ? (n = (t = e.current) == null ? void 0 : t.ownerDocument) != null ? n : document : null : document;
}
function Ob(e) {
  typeof queueMicrotask == "function" ? queueMicrotask(e) : Promise.resolve().then(e).catch((t) => setTimeout(() => {
    throw t;
  }));
}
function Rt() {
  let e = [], t = { addEventListener(n, r, o, a) {
    return n.addEventListener(r, o, a), t.add(() => n.removeEventListener(r, o, a));
  }, requestAnimationFrame(...n) {
    let r = requestAnimationFrame(...n);
    return t.add(() => cancelAnimationFrame(r));
  }, nextFrame(...n) {
    return t.requestAnimationFrame(() => t.requestAnimationFrame(...n));
  }, setTimeout(...n) {
    let r = setTimeout(...n);
    return t.add(() => clearTimeout(r));
  }, microTask(...n) {
    let r = { current: !0 };
    return Ob(() => {
      r.current && n[0]();
    }), t.add(() => {
      r.current = !1;
    });
  }, style(n, r, o) {
    let a = n.style.getPropertyValue(r);
    return Object.assign(n.style, { [r]: o }), this.add(() => {
      Object.assign(n.style, { [r]: a });
    });
  }, group(n) {
    let r = Rt();
    return n(r), this.add(() => r.dispose());
  }, add(n) {
    return e.includes(n) || e.push(n), () => {
      let r = e.indexOf(n);
      if (r >= 0) for (let o of e.splice(r, 1)) o();
    };
  }, dispose() {
    for (let n of e.splice(0)) n();
  } };
  return t;
}
function Pa() {
  let [e] = $e(Rt);
  return Ee(() => () => e.dispose(), [e]), e;
}
let _e = (e, t) => {
  cr.isServer ? Ee(e, t) : Xi(e, t);
};
function so(e) {
  let t = le(e);
  return _e(() => {
    t.current = e;
  }, [e]), t;
}
let we = function(e) {
  let t = so(e);
  return ke.useCallback((...n) => t.current(...n), [t]);
};
function Sw(e) {
  let t = e.width / 2, n = e.height / 2;
  return { top: e.clientY - n, right: e.clientX + t, bottom: e.clientY + n, left: e.clientX - t };
}
function Pw(e, t) {
  return !(!e || !t || e.right < t.left || e.left > t.right || e.bottom < t.top || e.top > t.bottom);
}
function Aw({ disabled: e = !1 } = {}) {
  let t = le(null), [n, r] = $e(!1), o = Pa(), a = we(() => {
    t.current = null, r(!1), o.dispose();
  }), i = we((s) => {
    if (o.dispose(), t.current === null) {
      t.current = s.currentTarget, r(!0);
      {
        let l = io(s.currentTarget);
        o.addEventListener(l, "pointerup", a, !1), o.addEventListener(l, "pointermove", (c) => {
          if (t.current) {
            let u = Sw(c);
            r(Pw(u, t.current.getBoundingClientRect()));
          }
        }, !1), o.addEventListener(l, "pointercancel", a, !1);
      }
    }
  });
  return { pressed: n, pressProps: e ? {} : { onPointerDown: i, onPointerUp: a, onClick: a } };
}
let Cw = dt(void 0);
function Sb() {
  return Ke(Cw);
}
function hc(...e) {
  return Array.from(new Set(e.flatMap((t) => typeof t == "string" ? t.split(" ") : []))).filter(Boolean).join(" ");
}
function Sr(e, t, ...n) {
  if (e in t) {
    let o = t[e];
    return typeof o == "function" ? o(...n) : o;
  }
  let r = new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map((o) => `"${o}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(r, Sr), r;
}
var Pi = ((e) => (e[e.None = 0] = "None", e[e.RenderStrategy = 1] = "RenderStrategy", e[e.Static = 2] = "Static", e))(Pi || {}), jn = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(jn || {});
function pt() {
  let e = Nw();
  return Ge((t) => $w({ mergeRefs: e, ...t }), [e]);
}
function $w({ ourProps: e, theirProps: t, slot: n, defaultTag: r, features: o, visible: a = !0, name: i, mergeRefs: s }) {
  s = s ?? Iw;
  let l = Pb(t, e);
  if (a) return za(l, n, r, i, s);
  let c = o ?? 0;
  if (c & 2) {
    let { static: u = !1, ...f } = l;
    if (u) return za(f, n, r, i, s);
  }
  if (c & 1) {
    let { unmount: u = !0, ...f } = l;
    return Sr(u ? 0 : 1, { 0() {
      return null;
    }, 1() {
      return za({ ...f, hidden: !0, style: { display: "none" } }, n, r, i, s);
    } });
  }
  return za(l, n, r, i, s);
}
function za(e, t = {}, n, r, o) {
  let { as: a = n, children: i, refName: s = "ref", ...l } = Ds(e, ["unmount", "static"]), c = e.ref !== void 0 ? { [s]: e.ref } : {}, u = typeof i == "function" ? i(t) : i;
  "className" in l && l.className && typeof l.className == "function" && (l.className = l.className(t)), l["aria-labelledby"] && l["aria-labelledby"] === l.id && (l["aria-labelledby"] = void 0);
  let f = {};
  if (t) {
    let d = !1, p = [];
    for (let [b, m] of Object.entries(t)) typeof m == "boolean" && (d = !0), m === !0 && p.push(b.replace(/([A-Z])/g, (g) => `-${g.toLowerCase()}`));
    if (d) {
      f["data-headlessui-state"] = p.join(" ");
      for (let b of p) f[`data-${b}`] = "";
    }
  }
  if (a === mt && (Object.keys(nr(l)).length > 0 || Object.keys(nr(f)).length > 0)) if (!lc(u) || Array.isArray(u) && u.length > 1) {
    if (Object.keys(nr(l)).length > 0) throw new Error(['Passing props on "Fragment"!', "", `The current component <${r} /> is rendering a "Fragment".`, "However we need to passthrough the following props:", Object.keys(nr(l)).concat(Object.keys(nr(f))).map((d) => `  - ${d}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".', "Render a single element as the child so that we can forward the props onto that element."].map((d) => `  - ${d}`).join(`
`)].join(`
`));
  } else {
    let d = u.props, p = d == null ? void 0 : d.className, b = typeof p == "function" ? (...v) => hc(p(...v), l.className) : hc(p, l.className), m = b ? { className: b } : {}, g = Pb(u.props, nr(Ds(l, ["ref"])));
    for (let v in f) v in g && delete f[v];
    return cc(u, Object.assign({}, g, f, c, { ref: o(Tw(u), c.ref) }, m));
  }
  return Kx(a, Object.assign({}, Ds(l, ["ref"]), a !== mt && c, a !== mt && f), u);
}
function Nw() {
  let e = le([]), t = Ge((n) => {
    for (let r of e.current) r != null && (typeof r == "function" ? r(n) : r.current = n);
  }, []);
  return (...n) => {
    if (!n.every((r) => r == null)) return e.current = n, t;
  };
}
function Iw(...e) {
  return e.every((t) => t == null) ? void 0 : (t) => {
    for (let n of e) n != null && (typeof n == "function" ? n(t) : n.current = t);
  };
}
function Pb(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let t = {}, n = {};
  for (let r of e) for (let o in r) o.startsWith("on") && typeof r[o] == "function" ? (n[o] != null || (n[o] = []), n[o].push(r[o])) : t[o] = r[o];
  if (t.disabled || t["aria-disabled"]) for (let r in n) /^(on(?:Click|Pointer|Mouse|Key)(?:Down|Up|Press)?)$/.test(r) && (n[r] = [(o) => {
    var a;
    return (a = o == null ? void 0 : o.preventDefault) == null ? void 0 : a.call(o);
  }]);
  for (let r in n) Object.assign(t, { [r](o, ...a) {
    let i = n[r];
    for (let s of i) {
      if ((o instanceof Event || (o == null ? void 0 : o.nativeEvent) instanceof Event) && o.defaultPrevented) return;
      s(o, ...a);
    }
  } });
  return t;
}
function Ab(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let t = {}, n = {};
  for (let r of e) for (let o in r) o.startsWith("on") && typeof r[o] == "function" ? (n[o] != null || (n[o] = []), n[o].push(r[o])) : t[o] = r[o];
  for (let r in n) Object.assign(t, { [r](...o) {
    let a = n[r];
    for (let i of a) i == null || i(...o);
  } });
  return t;
}
function lt(e) {
  var t;
  return Object.assign(fb(e), { displayName: (t = e.displayName) != null ? t : e.name });
}
function nr(e) {
  let t = Object.assign({}, e);
  for (let n in t) t[n] === void 0 && delete t[n];
  return t;
}
function Ds(e, t = []) {
  let n = Object.assign({}, e);
  for (let r of t) r in n && delete n[r];
  return n;
}
function Tw(e) {
  return ke.version.split(".")[0] >= "19" ? e.props.ref : e.ref;
}
let Mw = dt(void 0);
function Rw() {
  return Ke(Mw);
}
function jw(e) {
  let t = e.parentElement, n = null;
  for (; t && !(t instanceof HTMLFieldSetElement); ) t instanceof HTMLLegendElement && (n = t), t = t.parentElement;
  let r = (t == null ? void 0 : t.getAttribute("disabled")) === "";
  return r && _w(n) ? !1 : r;
}
function _w(e) {
  if (!e) return !1;
  let t = e.previousElementSibling;
  for (; t !== null; ) {
    if (t instanceof HTMLLegendElement) return !1;
    t = t.previousElementSibling;
  }
  return !0;
}
let Cb = Symbol();
function Fw(e, t = !0) {
  return Object.assign(e, { [Cb]: t });
}
function jt(...e) {
  let t = le(e);
  Ee(() => {
    t.current = e;
  }, [e]);
  let n = we((r) => {
    for (let o of t.current) o != null && (typeof o == "function" ? o(r) : o.current = r);
  });
  return e.every((r) => r == null || (r == null ? void 0 : r[Cb])) ? void 0 : n;
}
let lf = dt(null);
lf.displayName = "DescriptionContext";
function $b() {
  let e = Ke(lf);
  if (e === null) {
    let t = new Error("You used a <Description /> component, but it is not inside a relevant parent.");
    throw Error.captureStackTrace && Error.captureStackTrace(t, $b), t;
  }
  return e;
}
function Lw() {
  let [e, t] = $e([]);
  return [e.length > 0 ? e.join(" ") : void 0, Ye(() => function(n) {
    let r = we((a) => (t((i) => [...i, a]), () => t((i) => {
      let s = i.slice(), l = s.indexOf(a);
      return l !== -1 && s.splice(l, 1), s;
    }))), o = Ye(() => ({ register: r, slot: n.slot, name: n.name, props: n.props, value: n.value }), [r, n.slot, n.name, n.props, n.value]);
    return ke.createElement(lf.Provider, { value: o }, n.children);
  }, [t])];
}
let Dw = "p";
function zw(e, t) {
  let n = Or(), r = Sb(), { id: o = `headlessui-description-${n}`, ...a } = e, i = $b(), s = jt(t);
  _e(() => i.register(o), [o, i.register]);
  let l = r || !1, c = Ye(() => ({ ...i.slot, disabled: l }), [i.slot, l]), u = { ref: s, ...i.props, id: o };
  return pt()({ ourProps: u, theirProps: a, slot: c, defaultTag: Dw, name: i.name || "Description" });
}
let Ww = lt(zw);
Object.assign(Ww, {});
var Je = ((e) => (e.Space = " ", e.Enter = "Enter", e.Escape = "Escape", e.Backspace = "Backspace", e.Delete = "Delete", e.ArrowLeft = "ArrowLeft", e.ArrowUp = "ArrowUp", e.ArrowRight = "ArrowRight", e.ArrowDown = "ArrowDown", e.Home = "Home", e.End = "End", e.PageUp = "PageUp", e.PageDown = "PageDown", e.Tab = "Tab", e))(Je || {});
let Qi = dt(null);
Qi.displayName = "LabelContext";
function cf() {
  let e = Ke(Qi);
  if (e === null) {
    let t = new Error("You used a <Label /> component, but it is not inside a relevant parent.");
    throw Error.captureStackTrace && Error.captureStackTrace(t, cf), t;
  }
  return e;
}
function Vw(e) {
  var t, n, r;
  let o = (n = (t = Ke(Qi)) == null ? void 0 : t.value) != null ? n : void 0;
  return ((r = void 0) != null ? r : 0) > 0 ? [o, ...e].filter(Boolean).join(" ") : o;
}
function Nb({ inherit: e = !1 } = {}) {
  let t = Vw(), [n, r] = $e([]), o = e ? [t, ...n].filter(Boolean) : n;
  return [o.length > 0 ? o.join(" ") : void 0, Ye(() => function(a) {
    let i = we((l) => (r((c) => [...c, l]), () => r((c) => {
      let u = c.slice(), f = u.indexOf(l);
      return f !== -1 && u.splice(f, 1), u;
    }))), s = Ye(() => ({ register: i, slot: a.slot, name: a.name, props: a.props, value: a.value }), [i, a.slot, a.name, a.props, a.value]);
    return ke.createElement(Qi.Provider, { value: s }, a.children);
  }, [r])];
}
let Hw = "label";
function Uw(e, t) {
  var n;
  let r = Or(), o = cf(), a = Rw(), i = Sb(), { id: s = `headlessui-label-${r}`, htmlFor: l = a ?? ((n = o.props) == null ? void 0 : n.htmlFor), passive: c = !1, ...u } = e, f = jt(t);
  _e(() => o.register(s), [s, o.register]);
  let d = we((g) => {
    let v = g.currentTarget;
    if (v instanceof HTMLLabelElement && g.preventDefault(), o.props && "onClick" in o.props && typeof o.props.onClick == "function" && o.props.onClick(g), v instanceof HTMLLabelElement) {
      let k = document.getElementById(v.htmlFor);
      if (k) {
        let x = k.getAttribute("disabled");
        if (x === "true" || x === "") return;
        let O = k.getAttribute("aria-disabled");
        if (O === "true" || O === "") return;
        (k instanceof HTMLInputElement && (k.type === "radio" || k.type === "checkbox") || k.role === "radio" || k.role === "checkbox" || k.role === "switch") && k.click(), k.focus({ preventScroll: !0 });
      }
    }
  }), p = i || !1, b = Ye(() => ({ ...o.slot, disabled: p }), [o.slot, p]), m = { ref: f, ...o.props, id: s, htmlFor: l, onClick: d };
  return c && ("onClick" in m && (delete m.htmlFor, delete m.onClick), "onClick" in u && delete u.onClick), pt()({ ourProps: m, theirProps: u, slot: b, defaultTag: l ? Hw : "div", name: o.name || "Label" });
}
let Yw = lt(Uw);
Object.assign(Yw, {});
function Bw(e) {
  if (e === null) return { width: 0, height: 0 };
  let { width: t, height: n } = e.getBoundingClientRect();
  return { width: t, height: n };
}
function Gw(e, t = !1) {
  let [n, r] = Xx(() => ({}), {}), o = Ye(() => Bw(e), [e, n]);
  return _e(() => {
    if (!e) return;
    let a = new ResizeObserver(r);
    return a.observe(e), () => {
      a.disconnect();
    };
  }, [e]), t ? { width: `${o.width}px`, height: `${o.height}px` } : o;
}
let Ib = class extends Map {
  constructor(t) {
    super(), this.factory = t;
  }
  get(t) {
    let n = super.get(t);
    return n === void 0 && (n = this.factory(t), this.set(t, n)), n;
  }
};
function Tb(e, t) {
  let n = e(), r = /* @__PURE__ */ new Set();
  return { getSnapshot() {
    return n;
  }, subscribe(o) {
    return r.add(o), () => r.delete(o);
  }, dispatch(o, ...a) {
    let i = t[o].call(n, ...a);
    i && (n = i, r.forEach((s) => s()));
  } };
}
function Mb(e) {
  return Qx(e.subscribe, e.getSnapshot, e.getSnapshot);
}
let qw = new Ib(() => Tb(() => [], { ADD(e) {
  return this.includes(e) ? this : [...this, e];
}, REMOVE(e) {
  let t = this.indexOf(e);
  if (t === -1) return this;
  let n = this.slice();
  return n.splice(t, 1), n;
} }));
function uf(e, t) {
  let n = qw.get(t), r = Or(), o = Mb(n);
  if (_e(() => {
    if (e) return n.dispatch("ADD", r), () => n.dispatch("REMOVE", r);
  }, [n, e]), !e) return !1;
  let a = o.indexOf(r), i = o.length;
  return a === -1 && (a = i, i += 1), a === i - 1;
}
let bc = /* @__PURE__ */ new Map(), Vo = /* @__PURE__ */ new Map();
function Hd(e) {
  var t;
  let n = (t = Vo.get(e)) != null ? t : 0;
  return Vo.set(e, n + 1), n !== 0 ? () => Ud(e) : (bc.set(e, { "aria-hidden": e.getAttribute("aria-hidden"), inert: e.inert }), e.setAttribute("aria-hidden", "true"), e.inert = !0, () => Ud(e));
}
function Ud(e) {
  var t;
  let n = (t = Vo.get(e)) != null ? t : 1;
  if (n === 1 ? Vo.delete(e) : Vo.set(e, n - 1), n !== 1) return;
  let r = bc.get(e);
  r && (r["aria-hidden"] === null ? e.removeAttribute("aria-hidden") : e.setAttribute("aria-hidden", r["aria-hidden"]), e.inert = r.inert, bc.delete(e));
}
function Kw(e, { allowed: t, disallowed: n } = {}) {
  let r = uf(e, "inert-others");
  _e(() => {
    var o, a;
    if (!r) return;
    let i = Rt();
    for (let l of (o = n == null ? void 0 : n()) != null ? o : []) l && i.add(Hd(l));
    let s = (a = t == null ? void 0 : t()) != null ? a : [];
    for (let l of s) {
      if (!l) continue;
      let c = io(l);
      if (!c) continue;
      let u = l.parentElement;
      for (; u && u !== c.body; ) {
        for (let f of u.children) s.some((d) => f.contains(d)) || i.add(Hd(f));
        u = u.parentElement;
      }
    }
    return i.dispose;
  }, [r, t, n]);
}
function Xw(e, t, n) {
  let r = so((o) => {
    let a = o.getBoundingClientRect();
    a.x === 0 && a.y === 0 && a.width === 0 && a.height === 0 && n();
  });
  Ee(() => {
    if (!e) return;
    let o = t === null ? null : t instanceof HTMLElement ? t : t.current;
    if (!o) return;
    let a = Rt();
    if (typeof ResizeObserver < "u") {
      let i = new ResizeObserver(() => r.current(o));
      i.observe(o), a.add(() => i.disconnect());
    }
    if (typeof IntersectionObserver < "u") {
      let i = new IntersectionObserver(() => r.current(o));
      i.observe(o), a.add(() => i.disconnect());
    }
    return () => a.dispose();
  }, [t, r, e]);
}
let yc = ["[contentEditable=true]", "[tabindex]", "a[href]", "area[href]", "button:not([disabled])", "iframe", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])"].map((e) => `${e}:not([tabindex='-1'])`).join(","), Qw = ["[data-autofocus]"].map((e) => `${e}:not([tabindex='-1'])`).join(",");
var vc = ((e) => (e[e.First = 1] = "First", e[e.Previous = 2] = "Previous", e[e.Next = 4] = "Next", e[e.Last = 8] = "Last", e[e.WrapAround = 16] = "WrapAround", e[e.NoScroll = 32] = "NoScroll", e[e.AutoFocus = 64] = "AutoFocus", e))(vc || {}), Jw = ((e) => (e[e.Error = 0] = "Error", e[e.Overflow = 1] = "Overflow", e[e.Success = 2] = "Success", e[e.Underflow = 3] = "Underflow", e))(Jw || {}), Zw = ((e) => (e[e.Previous = -1] = "Previous", e[e.Next = 1] = "Next", e))(Zw || {});
function Rb(e = document.body) {
  return e == null ? [] : Array.from(e.querySelectorAll(yc)).sort((t, n) => Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (n.tabIndex || Number.MAX_SAFE_INTEGER)));
}
function e2(e = document.body) {
  return e == null ? [] : Array.from(e.querySelectorAll(Qw)).sort((t, n) => Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (n.tabIndex || Number.MAX_SAFE_INTEGER)));
}
var ff = ((e) => (e[e.Strict = 0] = "Strict", e[e.Loose = 1] = "Loose", e))(ff || {});
function df(e, t = 0) {
  var n;
  return e === ((n = io(e)) == null ? void 0 : n.body) ? !1 : Sr(t, { 0() {
    return e.matches(yc);
  }, 1() {
    let r = e;
    for (; r !== null; ) {
      if (r.matches(yc)) return !0;
      r = r.parentElement;
    }
    return !1;
  } });
}
function jb(e) {
  let t = io(e);
  Rt().nextFrame(() => {
    t && !df(t.activeElement, 0) && n2(e);
  });
}
var t2 = ((e) => (e[e.Keyboard = 0] = "Keyboard", e[e.Mouse = 1] = "Mouse", e))(t2 || {});
typeof window < "u" && typeof document < "u" && (document.addEventListener("keydown", (e) => {
  e.metaKey || e.altKey || e.ctrlKey || (document.documentElement.dataset.headlessuiFocusVisible = "");
}, !0), document.addEventListener("click", (e) => {
  e.detail === 1 ? delete document.documentElement.dataset.headlessuiFocusVisible : e.detail === 0 && (document.documentElement.dataset.headlessuiFocusVisible = "");
}, !0));
function n2(e) {
  e == null || e.focus({ preventScroll: !0 });
}
let r2 = ["textarea", "input"].join(",");
function o2(e) {
  var t, n;
  return (n = (t = e == null ? void 0 : e.matches) == null ? void 0 : t.call(e, r2)) != null ? n : !1;
}
function _b(e, t = (n) => n) {
  return e.slice().sort((n, r) => {
    let o = t(n), a = t(r);
    if (o === null || a === null) return 0;
    let i = o.compareDocumentPosition(a);
    return i & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : i & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
  });
}
function a2(e, t) {
  return i2(Rb(), t, { relativeTo: e });
}
function i2(e, t, { sorted: n = !0, relativeTo: r = null, skipElements: o = [] } = {}) {
  let a = Array.isArray(e) ? e.length > 0 ? e[0].ownerDocument : document : e.ownerDocument, i = Array.isArray(e) ? n ? _b(e) : e : t & 64 ? e2(e) : Rb(e);
  o.length > 0 && i.length > 1 && (i = i.filter((p) => !o.some((b) => b != null && "current" in b ? (b == null ? void 0 : b.current) === p : b === p))), r = r ?? a.activeElement;
  let s = (() => {
    if (t & 5) return 1;
    if (t & 10) return -1;
    throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last");
  })(), l = (() => {
    if (t & 1) return 0;
    if (t & 2) return Math.max(0, i.indexOf(r)) - 1;
    if (t & 4) return Math.max(0, i.indexOf(r)) + 1;
    if (t & 8) return i.length - 1;
    throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last");
  })(), c = t & 32 ? { preventScroll: !0 } : {}, u = 0, f = i.length, d;
  do {
    if (u >= f || u + f <= 0) return 0;
    let p = l + u;
    if (t & 16) p = (p + f) % f;
    else {
      if (p < 0) return 3;
      if (p >= f) return 1;
    }
    d = i[p], d == null || d.focus(c), u += s;
  } while (d !== a.activeElement);
  return t & 6 && o2(d) && d.select(), 2;
}
function Fb() {
  return /iPhone/gi.test(window.navigator.platform) || /Mac/gi.test(window.navigator.platform) && window.navigator.maxTouchPoints > 0;
}
function s2() {
  return /Android/gi.test(window.navigator.userAgent);
}
function l2() {
  return Fb() || s2();
}
function wo(e, t, n, r) {
  let o = so(n);
  Ee(() => {
    if (!e) return;
    function a(i) {
      o.current(i);
    }
    return document.addEventListener(t, a, r), () => document.removeEventListener(t, a, r);
  }, [e, t, r]);
}
function c2(e, t, n, r) {
  let o = so(n);
  Ee(() => {
    if (!e) return;
    function a(i) {
      o.current(i);
    }
    return window.addEventListener(t, a, r), () => window.removeEventListener(t, a, r);
  }, [e, t, r]);
}
const Yd = 30;
function u2(e, t, n) {
  let r = uf(e, "outside-click"), o = so(n), a = Ge(function(l, c) {
    if (l.defaultPrevented) return;
    let u = c(l);
    if (u === null || !u.getRootNode().contains(u) || !u.isConnected) return;
    let f = function d(p) {
      return typeof p == "function" ? d(p()) : Array.isArray(p) || p instanceof Set ? p : [p];
    }(t);
    for (let d of f) if (d !== null && (d.contains(u) || l.composed && l.composedPath().includes(d))) return;
    return !df(u, ff.Loose) && u.tabIndex !== -1 && l.preventDefault(), o.current(l, u);
  }, [o, t]), i = le(null);
  wo(r, "pointerdown", (l) => {
    var c, u;
    i.current = ((u = (c = l.composedPath) == null ? void 0 : c.call(l)) == null ? void 0 : u[0]) || l.target;
  }, !0), wo(r, "mousedown", (l) => {
    var c, u;
    i.current = ((u = (c = l.composedPath) == null ? void 0 : c.call(l)) == null ? void 0 : u[0]) || l.target;
  }, !0), wo(r, "click", (l) => {
    l2() || i.current && (a(l, () => i.current), i.current = null);
  }, !0);
  let s = le({ x: 0, y: 0 });
  wo(r, "touchstart", (l) => {
    s.current.x = l.touches[0].clientX, s.current.y = l.touches[0].clientY;
  }, !0), wo(r, "touchend", (l) => {
    let c = { x: l.changedTouches[0].clientX, y: l.changedTouches[0].clientY };
    if (!(Math.abs(c.x - s.current.x) >= Yd || Math.abs(c.y - s.current.y) >= Yd)) return a(l, () => l.target instanceof HTMLElement ? l.target : null);
  }, !0), c2(r, "blur", (l) => a(l, () => window.document.activeElement instanceof HTMLIFrameElement ? window.document.activeElement : null), !0);
}
function xc(...e) {
  return Ye(() => io(...e), [...e]);
}
function f2(e, t) {
  return Ye(() => {
    var n;
    if (e.type) return e.type;
    let r = (n = e.as) != null ? n : "button";
    if (typeof r == "string" && r.toLowerCase() === "button" || (t == null ? void 0 : t.tagName) === "BUTTON" && !t.hasAttribute("type")) return "button";
  }, [e.type, e.as, t]);
}
function d2() {
  let e;
  return { before({ doc: t }) {
    var n;
    let r = t.documentElement, o = (n = t.defaultView) != null ? n : window;
    e = Math.max(0, o.innerWidth - r.clientWidth);
  }, after({ doc: t, d: n }) {
    let r = t.documentElement, o = Math.max(0, r.clientWidth - r.offsetWidth), a = Math.max(0, e - o);
    n.style(r, "paddingRight", `${a}px`);
  } };
}
function p2() {
  return Fb() ? { before({ doc: e, d: t, meta: n }) {
    function r(o) {
      return n.containers.flatMap((a) => a()).some((a) => a.contains(o));
    }
    t.microTask(() => {
      var o;
      if (window.getComputedStyle(e.documentElement).scrollBehavior !== "auto") {
        let s = Rt();
        s.style(e.documentElement, "scrollBehavior", "auto"), t.add(() => t.microTask(() => s.dispose()));
      }
      let a = (o = window.scrollY) != null ? o : window.pageYOffset, i = null;
      t.addEventListener(e, "click", (s) => {
        if (s.target instanceof HTMLElement) try {
          let l = s.target.closest("a");
          if (!l) return;
          let { hash: c } = new URL(l.href), u = e.querySelector(c);
          u && !r(u) && (i = u);
        } catch {
        }
      }, !0), t.addEventListener(e, "touchstart", (s) => {
        if (s.target instanceof HTMLElement) if (r(s.target)) {
          let l = s.target;
          for (; l.parentElement && r(l.parentElement); ) l = l.parentElement;
          t.style(l, "overscrollBehavior", "contain");
        } else t.style(s.target, "touchAction", "none");
      }), t.addEventListener(e, "touchmove", (s) => {
        if (s.target instanceof HTMLElement) {
          if (s.target.tagName === "INPUT") return;
          if (r(s.target)) {
            let l = s.target;
            for (; l.parentElement && l.dataset.headlessuiPortal !== "" && !(l.scrollHeight > l.clientHeight || l.scrollWidth > l.clientWidth); ) l = l.parentElement;
            l.dataset.headlessuiPortal === "" && s.preventDefault();
          } else s.preventDefault();
        }
      }, { passive: !1 }), t.add(() => {
        var s;
        let l = (s = window.scrollY) != null ? s : window.pageYOffset;
        a !== l && window.scrollTo(0, a), i && i.isConnected && (i.scrollIntoView({ block: "nearest" }), i = null);
      });
    });
  } } : {};
}
function m2() {
  return { before({ doc: e, d: t }) {
    t.style(e.documentElement, "overflow", "hidden");
  } };
}
function g2(e) {
  let t = {};
  for (let n of e) Object.assign(t, n(t));
  return t;
}
let or = Tb(() => /* @__PURE__ */ new Map(), { PUSH(e, t) {
  var n;
  let r = (n = this.get(e)) != null ? n : { doc: e, count: 0, d: Rt(), meta: /* @__PURE__ */ new Set() };
  return r.count++, r.meta.add(t), this.set(e, r), this;
}, POP(e, t) {
  let n = this.get(e);
  return n && (n.count--, n.meta.delete(t)), this;
}, SCROLL_PREVENT({ doc: e, d: t, meta: n }) {
  let r = { doc: e, d: t, meta: g2(n) }, o = [p2(), d2(), m2()];
  o.forEach(({ before: a }) => a == null ? void 0 : a(r)), o.forEach(({ after: a }) => a == null ? void 0 : a(r));
}, SCROLL_ALLOW({ d: e }) {
  e.dispose();
}, TEARDOWN({ doc: e }) {
  this.delete(e);
} });
or.subscribe(() => {
  let e = or.getSnapshot(), t = /* @__PURE__ */ new Map();
  for (let [n] of e) t.set(n, n.documentElement.style.overflow);
  for (let n of e.values()) {
    let r = t.get(n.doc) === "hidden", o = n.count !== 0;
    (o && !r || !o && r) && or.dispatch(n.count > 0 ? "SCROLL_PREVENT" : "SCROLL_ALLOW", n), n.count === 0 && or.dispatch("TEARDOWN", n);
  }
});
function h2(e, t, n = () => ({ containers: [] })) {
  let r = Mb(or), o = t ? r.get(t) : void 0, a = o ? o.count > 0 : !1;
  return _e(() => {
    if (!(!t || !e)) return or.dispatch("PUSH", t, n), () => or.dispatch("POP", t, n);
  }, [e, t]), a;
}
function b2(e, t, n = () => [document.body]) {
  let r = uf(e, "scroll-lock");
  h2(r, t, (o) => {
    var a;
    return { containers: [...(a = o.containers) != null ? a : [], n] };
  });
}
function Bd(e) {
  return [e.screenX, e.screenY];
}
function y2() {
  let e = le([-1, -1]);
  return { wasMoved(t) {
    let n = Bd(t);
    return e.current[0] === n[0] && e.current[1] === n[1] ? !1 : (e.current = n, !0);
  }, update(t) {
    e.current = Bd(t);
  } };
}
function v2(e = 0) {
  let [t, n] = $e(e), r = Ge((l) => n(l), [t]), o = Ge((l) => n((c) => c | l), [t]), a = Ge((l) => (t & l) === l, [t]), i = Ge((l) => n((c) => c & ~l), [n]), s = Ge((l) => n((c) => c ^ l), [n]);
  return { flags: t, setFlag: r, addFlag: o, hasFlag: a, removeFlag: i, toggleFlag: s };
}
var Gd, qd;
typeof process < "u" && typeof globalThis < "u" && typeof Element < "u" && ((Gd = process == null ? void 0 : process.env) == null ? void 0 : Gd.NODE_ENV) === "test" && typeof ((qd = Element == null ? void 0 : Element.prototype) == null ? void 0 : qd.getAnimations) > "u" && (Element.prototype.getAnimations = function() {
  return console.warn(["Headless UI has polyfilled `Element.prototype.getAnimations` for your tests.", "Please install a proper polyfill e.g. `jsdom-testing-mocks`, to silence these warnings.", "", "Example usage:", "```js", "import { mockAnimationsApi } from 'jsdom-testing-mocks'", "mockAnimationsApi()", "```"].join(`
`)), [];
});
var x2 = ((e) => (e[e.None = 0] = "None", e[e.Closed = 1] = "Closed", e[e.Enter = 2] = "Enter", e[e.Leave = 4] = "Leave", e))(x2 || {});
function Lb(e) {
  let t = {};
  for (let n in e) e[n] === !0 && (t[`data-${n}`] = "");
  return t;
}
function Db(e, t, n, r) {
  let [o, a] = $e(n), { hasFlag: i, addFlag: s, removeFlag: l } = v2(e && o ? 3 : 0), c = le(!1), u = le(!1), f = Pa();
  return _e(() => {
    var d;
    if (e) {
      if (n && a(!0), !t) {
        n && s(3);
        return;
      }
      return (d = r == null ? void 0 : r.start) == null || d.call(r, n), w2(t, { inFlight: c, prepare() {
        u.current ? u.current = !1 : u.current = c.current, c.current = !0, !u.current && (n ? (s(3), l(4)) : (s(4), l(2)));
      }, run() {
        u.current ? n ? (l(3), s(4)) : (l(4), s(3)) : n ? l(1) : s(1);
      }, done() {
        var p;
        u.current && typeof t.getAnimations == "function" && t.getAnimations().length > 0 || (c.current = !1, l(7), n || a(!1), (p = r == null ? void 0 : r.end) == null || p.call(r, n));
      } });
    }
  }, [e, n, t, f]), e ? [o, { closed: i(1), enter: i(2), leave: i(4), transition: i(2) || i(4) }] : [n, { closed: void 0, enter: void 0, leave: void 0, transition: void 0 }];
}
function w2(e, { prepare: t, run: n, done: r, inFlight: o }) {
  let a = Rt();
  return E2(e, { prepare: t, inFlight: o }), a.nextFrame(() => {
    n(), a.requestAnimationFrame(() => {
      a.add(k2(e, r));
    });
  }), a.dispose;
}
function k2(e, t) {
  var n, r;
  let o = Rt();
  if (!e) return o.dispose;
  let a = !1;
  o.add(() => {
    a = !0;
  });
  let i = (r = (n = e.getAnimations) == null ? void 0 : n.call(e).filter((s) => s instanceof CSSTransition)) != null ? r : [];
  return i.length === 0 ? (t(), o.dispose) : (Promise.allSettled(i.map((s) => s.finished)).then(() => {
    a || t();
  }), o.dispose);
}
function E2(e, { inFlight: t, prepare: n }) {
  if (t != null && t.current) {
    n();
    return;
  }
  let r = e.style.transition;
  e.style.transition = "none", n(), e.offsetHeight, e.style.transition = r;
}
function O2(e, { container: t, accept: n, walk: r }) {
  let o = le(n), a = le(r);
  Ee(() => {
    o.current = n, a.current = r;
  }, [n, r]), _e(() => {
    if (!t || !e) return;
    let i = io(t);
    if (!i) return;
    let s = o.current, l = a.current, c = Object.assign((f) => s(f), { acceptNode: s }), u = i.createTreeWalker(t, NodeFilter.SHOW_ELEMENT, c, !1);
    for (; u.nextNode(); ) l(u.currentNode);
  }, [t, e, o, a]);
}
function Ji() {
  return typeof window < "u";
}
function lo(e) {
  return zb(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function gt(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function en(e) {
  var t;
  return (t = (zb(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function zb(e) {
  return Ji() ? e instanceof Node || e instanceof gt(e).Node : !1;
}
function tt(e) {
  return Ji() ? e instanceof Element || e instanceof gt(e).Element : !1;
}
function Jt(e) {
  return Ji() ? e instanceof HTMLElement || e instanceof gt(e).HTMLElement : !1;
}
function Kd(e) {
  return !Ji() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof gt(e).ShadowRoot;
}
function Aa(e) {
  const {
    overflow: t,
    overflowX: n,
    overflowY: r,
    display: o
  } = Tt(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !["inline", "contents"].includes(o);
}
function S2(e) {
  return ["table", "td", "th"].includes(lo(e));
}
function Zi(e) {
  return [":popover-open", ":modal"].some((t) => {
    try {
      return e.matches(t);
    } catch {
      return !1;
    }
  });
}
function pf(e) {
  const t = mf(), n = tt(e) ? Tt(e) : e;
  return ["transform", "translate", "scale", "rotate", "perspective"].some((r) => n[r] ? n[r] !== "none" : !1) || (n.containerType ? n.containerType !== "normal" : !1) || !t && (n.backdropFilter ? n.backdropFilter !== "none" : !1) || !t && (n.filter ? n.filter !== "none" : !1) || ["transform", "translate", "scale", "rotate", "perspective", "filter"].some((r) => (n.willChange || "").includes(r)) || ["paint", "layout", "strict", "content"].some((r) => (n.contain || "").includes(r));
}
function P2(e) {
  let t = Wn(e);
  for (; Jt(t) && !eo(t); ) {
    if (pf(t))
      return t;
    if (Zi(t))
      return null;
    t = Wn(t);
  }
  return null;
}
function mf() {
  return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
function eo(e) {
  return ["html", "body", "#document"].includes(lo(e));
}
function Tt(e) {
  return gt(e).getComputedStyle(e);
}
function es(e) {
  return tt(e) ? {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  } : {
    scrollLeft: e.scrollX,
    scrollTop: e.scrollY
  };
}
function Wn(e) {
  if (lo(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    Kd(e) && e.host || // Fallback.
    en(e)
  );
  return Kd(t) ? t.host : t;
}
function Wb(e) {
  const t = Wn(e);
  return eo(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : Jt(t) && Aa(t) ? t : Wb(t);
}
function ra(e, t, n) {
  var r;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const o = Wb(e), a = o === ((r = e.ownerDocument) == null ? void 0 : r.body), i = gt(o);
  if (a) {
    const s = wc(i);
    return t.concat(i, i.visualViewport || [], Aa(o) ? o : [], s && n ? ra(s) : []);
  }
  return t.concat(o, ra(o, [], n));
}
function wc(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function A2() {
  const e = navigator.userAgentData;
  return e && Array.isArray(e.brands) ? e.brands.map((t) => {
    let {
      brand: n,
      version: r
    } = t;
    return n + "/" + r;
  }).join(" ") : navigator.userAgent;
}
const fr = Math.min, et = Math.max, oa = Math.round, Wa = Math.floor, Qt = (e) => ({
  x: e,
  y: e
}), C2 = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, $2 = {
  start: "end",
  end: "start"
};
function Xd(e, t, n) {
  return et(e, fr(t, n));
}
function co(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Vn(e) {
  return e.split("-")[0];
}
function Ca(e) {
  return e.split("-")[1];
}
function Vb(e) {
  return e === "x" ? "y" : "x";
}
function Hb(e) {
  return e === "y" ? "height" : "width";
}
function dr(e) {
  return ["top", "bottom"].includes(Vn(e)) ? "y" : "x";
}
function Ub(e) {
  return Vb(dr(e));
}
function N2(e, t, n) {
  n === void 0 && (n = !1);
  const r = Ca(e), o = Ub(e), a = Hb(o);
  let i = o === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return t.reference[a] > t.floating[a] && (i = Ai(i)), [i, Ai(i)];
}
function I2(e) {
  const t = Ai(e);
  return [kc(e), t, kc(t)];
}
function kc(e) {
  return e.replace(/start|end/g, (t) => $2[t]);
}
function T2(e, t, n) {
  const r = ["left", "right"], o = ["right", "left"], a = ["top", "bottom"], i = ["bottom", "top"];
  switch (e) {
    case "top":
    case "bottom":
      return n ? t ? o : r : t ? r : o;
    case "left":
    case "right":
      return t ? a : i;
    default:
      return [];
  }
}
function M2(e, t, n, r) {
  const o = Ca(e);
  let a = T2(Vn(e), n === "start", r);
  return o && (a = a.map((i) => i + "-" + o), t && (a = a.concat(a.map(kc)))), a;
}
function Ai(e) {
  return e.replace(/left|right|bottom|top/g, (t) => C2[t]);
}
function R2(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function j2(e) {
  return typeof e != "number" ? R2(e) : {
    top: e,
    right: e,
    bottom: e,
    left: e
  };
}
function Ci(e) {
  const {
    x: t,
    y: n,
    width: r,
    height: o
  } = e;
  return {
    width: r,
    height: o,
    top: n,
    left: t,
    right: t + r,
    bottom: n + o,
    x: t,
    y: n
  };
}
function Qd(e, t, n) {
  let {
    reference: r,
    floating: o
  } = e;
  const a = dr(t), i = Ub(t), s = Hb(i), l = Vn(t), c = a === "y", u = r.x + r.width / 2 - o.width / 2, f = r.y + r.height / 2 - o.height / 2, d = r[s] / 2 - o[s] / 2;
  let p;
  switch (l) {
    case "top":
      p = {
        x: u,
        y: r.y - o.height
      };
      break;
    case "bottom":
      p = {
        x: u,
        y: r.y + r.height
      };
      break;
    case "right":
      p = {
        x: r.x + r.width,
        y: f
      };
      break;
    case "left":
      p = {
        x: r.x - o.width,
        y: f
      };
      break;
    default:
      p = {
        x: r.x,
        y: r.y
      };
  }
  switch (Ca(t)) {
    case "start":
      p[i] -= d * (n && c ? -1 : 1);
      break;
    case "end":
      p[i] += d * (n && c ? -1 : 1);
      break;
  }
  return p;
}
const _2 = async (e, t, n) => {
  const {
    placement: r = "bottom",
    strategy: o = "absolute",
    middleware: a = [],
    platform: i
  } = n, s = a.filter(Boolean), l = await (i.isRTL == null ? void 0 : i.isRTL(t));
  let c = await i.getElementRects({
    reference: e,
    floating: t,
    strategy: o
  }), {
    x: u,
    y: f
  } = Qd(c, r, l), d = r, p = {}, b = 0;
  for (let m = 0; m < s.length; m++) {
    const {
      name: g,
      fn: v
    } = s[m], {
      x: k,
      y: x,
      data: O,
      reset: h
    } = await v({
      x: u,
      y: f,
      initialPlacement: r,
      placement: d,
      strategy: o,
      middlewareData: p,
      rects: c,
      platform: i,
      elements: {
        reference: e,
        floating: t
      }
    });
    u = k ?? u, f = x ?? f, p = {
      ...p,
      [g]: {
        ...p[g],
        ...O
      }
    }, h && b <= 50 && (b++, typeof h == "object" && (h.placement && (d = h.placement), h.rects && (c = h.rects === !0 ? await i.getElementRects({
      reference: e,
      floating: t,
      strategy: o
    }) : h.rects), {
      x: u,
      y: f
    } = Qd(c, d, l)), m = -1);
  }
  return {
    x: u,
    y: f,
    placement: d,
    strategy: o,
    middlewareData: p
  };
};
async function ts(e, t) {
  var n;
  t === void 0 && (t = {});
  const {
    x: r,
    y: o,
    platform: a,
    rects: i,
    elements: s,
    strategy: l
  } = e, {
    boundary: c = "clippingAncestors",
    rootBoundary: u = "viewport",
    elementContext: f = "floating",
    altBoundary: d = !1,
    padding: p = 0
  } = co(t, e), b = j2(p), g = s[d ? f === "floating" ? "reference" : "floating" : f], v = Ci(await a.getClippingRect({
    element: (n = await (a.isElement == null ? void 0 : a.isElement(g))) == null || n ? g : g.contextElement || await (a.getDocumentElement == null ? void 0 : a.getDocumentElement(s.floating)),
    boundary: c,
    rootBoundary: u,
    strategy: l
  })), k = f === "floating" ? {
    x: r,
    y: o,
    width: i.floating.width,
    height: i.floating.height
  } : i.reference, x = await (a.getOffsetParent == null ? void 0 : a.getOffsetParent(s.floating)), O = await (a.isElement == null ? void 0 : a.isElement(x)) ? await (a.getScale == null ? void 0 : a.getScale(x)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, h = Ci(a.convertOffsetParentRelativeRectToViewportRelativeRect ? await a.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements: s,
    rect: k,
    offsetParent: x,
    strategy: l
  }) : k);
  return {
    top: (v.top - h.top + b.top) / O.y,
    bottom: (h.bottom - v.bottom + b.bottom) / O.y,
    left: (v.left - h.left + b.left) / O.x,
    right: (h.right - v.right + b.right) / O.x
  };
}
const F2 = function(e) {
  return e === void 0 && (e = {}), {
    name: "flip",
    options: e,
    async fn(t) {
      var n, r;
      const {
        placement: o,
        middlewareData: a,
        rects: i,
        initialPlacement: s,
        platform: l,
        elements: c
      } = t, {
        mainAxis: u = !0,
        crossAxis: f = !0,
        fallbackPlacements: d,
        fallbackStrategy: p = "bestFit",
        fallbackAxisSideDirection: b = "none",
        flipAlignment: m = !0,
        ...g
      } = co(e, t);
      if ((n = a.arrow) != null && n.alignmentOffset)
        return {};
      const v = Vn(o), k = dr(s), x = Vn(s) === s, O = await (l.isRTL == null ? void 0 : l.isRTL(c.floating)), h = d || (x || !m ? [Ai(s)] : I2(s)), L = b !== "none";
      !d && L && h.push(...M2(s, m, b, O));
      const _ = [s, ...h], H = await ts(t, g), J = [];
      let Z = ((r = a.flip) == null ? void 0 : r.overflows) || [];
      if (u && J.push(H[v]), f) {
        const W = N2(o, i, O);
        J.push(H[W[0]], H[W[1]]);
      }
      if (Z = [...Z, {
        placement: o,
        overflows: J
      }], !J.every((W) => W <= 0)) {
        var U, T;
        const W = (((U = a.flip) == null ? void 0 : U.index) || 0) + 1, j = _[W];
        if (j)
          return {
            data: {
              index: W,
              overflows: Z
            },
            reset: {
              placement: j
            }
          };
        let D = (T = Z.filter((Q) => Q.overflows[0] <= 0).sort((Q, V) => Q.overflows[1] - V.overflows[1])[0]) == null ? void 0 : T.placement;
        if (!D)
          switch (p) {
            case "bestFit": {
              var te;
              const Q = (te = Z.filter((V) => {
                if (L) {
                  const z = dr(V.placement);
                  return z === k || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  z === "y";
                }
                return !0;
              }).map((V) => [V.placement, V.overflows.filter((z) => z > 0).reduce((z, y) => z + y, 0)]).sort((V, z) => V[1] - z[1])[0]) == null ? void 0 : te[0];
              Q && (D = Q);
              break;
            }
            case "initialPlacement":
              D = s;
              break;
          }
        if (o !== D)
          return {
            reset: {
              placement: D
            }
          };
      }
      return {};
    }
  };
};
async function L2(e, t) {
  const {
    placement: n,
    platform: r,
    elements: o
  } = e, a = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)), i = Vn(n), s = Ca(n), l = dr(n) === "y", c = ["left", "top"].includes(i) ? -1 : 1, u = a && l ? -1 : 1, f = co(t, e);
  let {
    mainAxis: d,
    crossAxis: p,
    alignmentAxis: b
  } = typeof f == "number" ? {
    mainAxis: f,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: f.mainAxis || 0,
    crossAxis: f.crossAxis || 0,
    alignmentAxis: f.alignmentAxis
  };
  return s && typeof b == "number" && (p = s === "end" ? b * -1 : b), l ? {
    x: p * u,
    y: d * c
  } : {
    x: d * c,
    y: p * u
  };
}
const D2 = function(e) {
  return e === void 0 && (e = 0), {
    name: "offset",
    options: e,
    async fn(t) {
      var n, r;
      const {
        x: o,
        y: a,
        placement: i,
        middlewareData: s
      } = t, l = await L2(t, e);
      return i === ((n = s.offset) == null ? void 0 : n.placement) && (r = s.arrow) != null && r.alignmentOffset ? {} : {
        x: o + l.x,
        y: a + l.y,
        data: {
          ...l,
          placement: i
        }
      };
    }
  };
}, z2 = function(e) {
  return e === void 0 && (e = {}), {
    name: "shift",
    options: e,
    async fn(t) {
      const {
        x: n,
        y: r,
        placement: o
      } = t, {
        mainAxis: a = !0,
        crossAxis: i = !1,
        limiter: s = {
          fn: (g) => {
            let {
              x: v,
              y: k
            } = g;
            return {
              x: v,
              y: k
            };
          }
        },
        ...l
      } = co(e, t), c = {
        x: n,
        y: r
      }, u = await ts(t, l), f = dr(Vn(o)), d = Vb(f);
      let p = c[d], b = c[f];
      if (a) {
        const g = d === "y" ? "top" : "left", v = d === "y" ? "bottom" : "right", k = p + u[g], x = p - u[v];
        p = Xd(k, p, x);
      }
      if (i) {
        const g = f === "y" ? "top" : "left", v = f === "y" ? "bottom" : "right", k = b + u[g], x = b - u[v];
        b = Xd(k, b, x);
      }
      const m = s.fn({
        ...t,
        [d]: p,
        [f]: b
      });
      return {
        ...m,
        data: {
          x: m.x - n,
          y: m.y - r,
          enabled: {
            [d]: a,
            [f]: i
          }
        }
      };
    }
  };
}, W2 = function(e) {
  return e === void 0 && (e = {}), {
    name: "size",
    options: e,
    async fn(t) {
      var n, r;
      const {
        placement: o,
        rects: a,
        platform: i,
        elements: s
      } = t, {
        apply: l = () => {
        },
        ...c
      } = co(e, t), u = await ts(t, c), f = Vn(o), d = Ca(o), p = dr(o) === "y", {
        width: b,
        height: m
      } = a.floating;
      let g, v;
      f === "top" || f === "bottom" ? (g = f, v = d === (await (i.isRTL == null ? void 0 : i.isRTL(s.floating)) ? "start" : "end") ? "left" : "right") : (v = f, g = d === "end" ? "top" : "bottom");
      const k = m - u.top - u.bottom, x = b - u.left - u.right, O = fr(m - u[g], k), h = fr(b - u[v], x), L = !t.middlewareData.shift;
      let _ = O, H = h;
      if ((n = t.middlewareData.shift) != null && n.enabled.x && (H = x), (r = t.middlewareData.shift) != null && r.enabled.y && (_ = k), L && !d) {
        const Z = et(u.left, 0), U = et(u.right, 0), T = et(u.top, 0), te = et(u.bottom, 0);
        p ? H = b - 2 * (Z !== 0 || U !== 0 ? Z + U : et(u.left, u.right)) : _ = m - 2 * (T !== 0 || te !== 0 ? T + te : et(u.top, u.bottom));
      }
      await l({
        ...t,
        availableWidth: H,
        availableHeight: _
      });
      const J = await i.getDimensions(s.floating);
      return b !== J.width || m !== J.height ? {
        reset: {
          rects: !0
        }
      } : {};
    }
  };
};
function Yb(e) {
  const t = Tt(e);
  let n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0;
  const o = Jt(e), a = o ? e.offsetWidth : n, i = o ? e.offsetHeight : r, s = oa(n) !== a || oa(r) !== i;
  return s && (n = a, r = i), {
    width: n,
    height: r,
    $: s
  };
}
function gf(e) {
  return tt(e) ? e : e.contextElement;
}
function Vr(e) {
  const t = gf(e);
  if (!Jt(t))
    return Qt(1);
  const n = t.getBoundingClientRect(), {
    width: r,
    height: o,
    $: a
  } = Yb(t);
  let i = (a ? oa(n.width) : n.width) / r, s = (a ? oa(n.height) : n.height) / o;
  return (!i || !Number.isFinite(i)) && (i = 1), (!s || !Number.isFinite(s)) && (s = 1), {
    x: i,
    y: s
  };
}
const V2 = /* @__PURE__ */ Qt(0);
function Bb(e) {
  const t = gt(e);
  return !mf() || !t.visualViewport ? V2 : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function H2(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== gt(e) ? !1 : t;
}
function pr(e, t, n, r) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const o = e.getBoundingClientRect(), a = gf(e);
  let i = Qt(1);
  t && (r ? tt(r) && (i = Vr(r)) : i = Vr(e));
  const s = H2(a, n, r) ? Bb(a) : Qt(0);
  let l = (o.left + s.x) / i.x, c = (o.top + s.y) / i.y, u = o.width / i.x, f = o.height / i.y;
  if (a) {
    const d = gt(a), p = r && tt(r) ? gt(r) : r;
    let b = d, m = wc(b);
    for (; m && r && p !== b; ) {
      const g = Vr(m), v = m.getBoundingClientRect(), k = Tt(m), x = v.left + (m.clientLeft + parseFloat(k.paddingLeft)) * g.x, O = v.top + (m.clientTop + parseFloat(k.paddingTop)) * g.y;
      l *= g.x, c *= g.y, u *= g.x, f *= g.y, l += x, c += O, b = gt(m), m = wc(b);
    }
  }
  return Ci({
    width: u,
    height: f,
    x: l,
    y: c
  });
}
function hf(e, t) {
  const n = es(e).scrollLeft;
  return t ? t.left + n : pr(en(e)).left + n;
}
function Gb(e, t, n) {
  n === void 0 && (n = !1);
  const r = e.getBoundingClientRect(), o = r.left + t.scrollLeft - (n ? 0 : (
    // RTL <body> scrollbar.
    hf(e, r)
  )), a = r.top + t.scrollTop;
  return {
    x: o,
    y: a
  };
}
function U2(e) {
  let {
    elements: t,
    rect: n,
    offsetParent: r,
    strategy: o
  } = e;
  const a = o === "fixed", i = en(r), s = t ? Zi(t.floating) : !1;
  if (r === i || s && a)
    return n;
  let l = {
    scrollLeft: 0,
    scrollTop: 0
  }, c = Qt(1);
  const u = Qt(0), f = Jt(r);
  if ((f || !f && !a) && ((lo(r) !== "body" || Aa(i)) && (l = es(r)), Jt(r))) {
    const p = pr(r);
    c = Vr(r), u.x = p.x + r.clientLeft, u.y = p.y + r.clientTop;
  }
  const d = i && !f && !a ? Gb(i, l, !0) : Qt(0);
  return {
    width: n.width * c.x,
    height: n.height * c.y,
    x: n.x * c.x - l.scrollLeft * c.x + u.x + d.x,
    y: n.y * c.y - l.scrollTop * c.y + u.y + d.y
  };
}
function Y2(e) {
  return Array.from(e.getClientRects());
}
function B2(e) {
  const t = en(e), n = es(e), r = e.ownerDocument.body, o = et(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth), a = et(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let i = -n.scrollLeft + hf(e);
  const s = -n.scrollTop;
  return Tt(r).direction === "rtl" && (i += et(t.clientWidth, r.clientWidth) - o), {
    width: o,
    height: a,
    x: i,
    y: s
  };
}
function G2(e, t) {
  const n = gt(e), r = en(e), o = n.visualViewport;
  let a = r.clientWidth, i = r.clientHeight, s = 0, l = 0;
  if (o) {
    a = o.width, i = o.height;
    const c = mf();
    (!c || c && t === "fixed") && (s = o.offsetLeft, l = o.offsetTop);
  }
  return {
    width: a,
    height: i,
    x: s,
    y: l
  };
}
function q2(e, t) {
  const n = pr(e, !0, t === "fixed"), r = n.top + e.clientTop, o = n.left + e.clientLeft, a = Jt(e) ? Vr(e) : Qt(1), i = e.clientWidth * a.x, s = e.clientHeight * a.y, l = o * a.x, c = r * a.y;
  return {
    width: i,
    height: s,
    x: l,
    y: c
  };
}
function Jd(e, t, n) {
  let r;
  if (t === "viewport")
    r = G2(e, n);
  else if (t === "document")
    r = B2(en(e));
  else if (tt(t))
    r = q2(t, n);
  else {
    const o = Bb(e);
    r = {
      x: t.x - o.x,
      y: t.y - o.y,
      width: t.width,
      height: t.height
    };
  }
  return Ci(r);
}
function qb(e, t) {
  const n = Wn(e);
  return n === t || !tt(n) || eo(n) ? !1 : Tt(n).position === "fixed" || qb(n, t);
}
function K2(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let r = ra(e, [], !1).filter((s) => tt(s) && lo(s) !== "body"), o = null;
  const a = Tt(e).position === "fixed";
  let i = a ? Wn(e) : e;
  for (; tt(i) && !eo(i); ) {
    const s = Tt(i), l = pf(i);
    !l && s.position === "fixed" && (o = null), (a ? !l && !o : !l && s.position === "static" && !!o && ["absolute", "fixed"].includes(o.position) || Aa(i) && !l && qb(e, i)) ? r = r.filter((u) => u !== i) : o = s, i = Wn(i);
  }
  return t.set(e, r), r;
}
function X2(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: r,
    strategy: o
  } = e;
  const i = [...n === "clippingAncestors" ? Zi(t) ? [] : K2(t, this._c) : [].concat(n), r], s = i[0], l = i.reduce((c, u) => {
    const f = Jd(t, u, o);
    return c.top = et(f.top, c.top), c.right = fr(f.right, c.right), c.bottom = fr(f.bottom, c.bottom), c.left = et(f.left, c.left), c;
  }, Jd(t, s, o));
  return {
    width: l.right - l.left,
    height: l.bottom - l.top,
    x: l.left,
    y: l.top
  };
}
function Q2(e) {
  const {
    width: t,
    height: n
  } = Yb(e);
  return {
    width: t,
    height: n
  };
}
function J2(e, t, n) {
  const r = Jt(t), o = en(t), a = n === "fixed", i = pr(e, !0, a, t);
  let s = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const l = Qt(0);
  if (r || !r && !a)
    if ((lo(t) !== "body" || Aa(o)) && (s = es(t)), r) {
      const d = pr(t, !0, a, t);
      l.x = d.x + t.clientLeft, l.y = d.y + t.clientTop;
    } else o && (l.x = hf(o));
  const c = o && !r && !a ? Gb(o, s) : Qt(0), u = i.left + s.scrollLeft - l.x - c.x, f = i.top + s.scrollTop - l.y - c.y;
  return {
    x: u,
    y: f,
    width: i.width,
    height: i.height
  };
}
function zs(e) {
  return Tt(e).position === "static";
}
function Zd(e, t) {
  if (!Jt(e) || Tt(e).position === "fixed")
    return null;
  if (t)
    return t(e);
  let n = e.offsetParent;
  return en(e) === n && (n = n.ownerDocument.body), n;
}
function Kb(e, t) {
  const n = gt(e);
  if (Zi(e))
    return n;
  if (!Jt(e)) {
    let o = Wn(e);
    for (; o && !eo(o); ) {
      if (tt(o) && !zs(o))
        return o;
      o = Wn(o);
    }
    return n;
  }
  let r = Zd(e, t);
  for (; r && S2(r) && zs(r); )
    r = Zd(r, t);
  return r && eo(r) && zs(r) && !pf(r) ? n : r || P2(e) || n;
}
const Z2 = async function(e) {
  const t = this.getOffsetParent || Kb, n = this.getDimensions, r = await n(e.floating);
  return {
    reference: J2(e.reference, await t(e.floating), e.strategy),
    floating: {
      x: 0,
      y: 0,
      width: r.width,
      height: r.height
    }
  };
};
function ek(e) {
  return Tt(e).direction === "rtl";
}
const tk = {
  convertOffsetParentRelativeRectToViewportRelativeRect: U2,
  getDocumentElement: en,
  getClippingRect: X2,
  getOffsetParent: Kb,
  getElementRects: Z2,
  getClientRects: Y2,
  getDimensions: Q2,
  getScale: Vr,
  isElement: tt,
  isRTL: ek
};
function Xb(e, t) {
  return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function nk(e, t) {
  let n = null, r;
  const o = en(e);
  function a() {
    var s;
    clearTimeout(r), (s = n) == null || s.disconnect(), n = null;
  }
  function i(s, l) {
    s === void 0 && (s = !1), l === void 0 && (l = 1), a();
    const c = e.getBoundingClientRect(), {
      left: u,
      top: f,
      width: d,
      height: p
    } = c;
    if (s || t(), !d || !p)
      return;
    const b = Wa(f), m = Wa(o.clientWidth - (u + d)), g = Wa(o.clientHeight - (f + p)), v = Wa(u), x = {
      rootMargin: -b + "px " + -m + "px " + -g + "px " + -v + "px",
      threshold: et(0, fr(1, l)) || 1
    };
    let O = !0;
    function h(L) {
      const _ = L[0].intersectionRatio;
      if (_ !== l) {
        if (!O)
          return i();
        _ ? i(!1, _) : r = setTimeout(() => {
          i(!1, 1e-7);
        }, 1e3);
      }
      _ === 1 && !Xb(c, e.getBoundingClientRect()) && i(), O = !1;
    }
    try {
      n = new IntersectionObserver(h, {
        ...x,
        // Handle <iframe>s
        root: o.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(h, x);
    }
    n.observe(e);
  }
  return i(!0), a;
}
function rk(e, t, n, r) {
  r === void 0 && (r = {});
  const {
    ancestorScroll: o = !0,
    ancestorResize: a = !0,
    elementResize: i = typeof ResizeObserver == "function",
    layoutShift: s = typeof IntersectionObserver == "function",
    animationFrame: l = !1
  } = r, c = gf(e), u = o || a ? [...c ? ra(c) : [], ...ra(t)] : [];
  u.forEach((v) => {
    o && v.addEventListener("scroll", n, {
      passive: !0
    }), a && v.addEventListener("resize", n);
  });
  const f = c && s ? nk(c, n) : null;
  let d = -1, p = null;
  i && (p = new ResizeObserver((v) => {
    let [k] = v;
    k && k.target === c && p && (p.unobserve(t), cancelAnimationFrame(d), d = requestAnimationFrame(() => {
      var x;
      (x = p) == null || x.observe(t);
    })), n();
  }), c && !l && p.observe(c), p.observe(t));
  let b, m = l ? pr(e) : null;
  l && g();
  function g() {
    const v = pr(e);
    m && !Xb(m, v) && n(), m = v, b = requestAnimationFrame(g);
  }
  return n(), () => {
    var v;
    u.forEach((k) => {
      o && k.removeEventListener("scroll", n), a && k.removeEventListener("resize", n);
    }), f == null || f(), (v = p) == null || v.disconnect(), p = null, l && cancelAnimationFrame(b);
  };
}
const Ws = ts, ok = D2, ak = z2, ik = F2, sk = W2, lk = (e, t, n) => {
  const r = /* @__PURE__ */ new Map(), o = {
    platform: tk,
    ...n
  }, a = {
    ...o.platform,
    _c: r
  };
  return _2(e, t, {
    ...o,
    platform: a
  });
};
var ui = typeof document < "u" ? Xi : Ee;
function $i(e, t) {
  if (e === t)
    return !0;
  if (typeof e != typeof t)
    return !1;
  if (typeof e == "function" && e.toString() === t.toString())
    return !0;
  let n, r, o;
  if (e && t && typeof e == "object") {
    if (Array.isArray(e)) {
      if (n = e.length, n !== t.length) return !1;
      for (r = n; r-- !== 0; )
        if (!$i(e[r], t[r]))
          return !1;
      return !0;
    }
    if (o = Object.keys(e), n = o.length, n !== Object.keys(t).length)
      return !1;
    for (r = n; r-- !== 0; )
      if (!{}.hasOwnProperty.call(t, o[r]))
        return !1;
    for (r = n; r-- !== 0; ) {
      const a = o[r];
      if (!(a === "_owner" && e.$$typeof) && !$i(e[a], t[a]))
        return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function Qb(e) {
  return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function ep(e, t) {
  const n = Qb(e);
  return Math.round(t * n) / n;
}
function Vs(e) {
  const t = S.useRef(e);
  return ui(() => {
    t.current = e;
  }), t;
}
function ck(e) {
  e === void 0 && (e = {});
  const {
    placement: t = "bottom",
    strategy: n = "absolute",
    middleware: r = [],
    platform: o,
    elements: {
      reference: a,
      floating: i
    } = {},
    transform: s = !0,
    whileElementsMounted: l,
    open: c
  } = e, [u, f] = S.useState({
    x: 0,
    y: 0,
    strategy: n,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [d, p] = S.useState(r);
  $i(d, r) || p(r);
  const [b, m] = S.useState(null), [g, v] = S.useState(null), k = S.useCallback((V) => {
    V !== L.current && (L.current = V, m(V));
  }, []), x = S.useCallback((V) => {
    V !== _.current && (_.current = V, v(V));
  }, []), O = a || b, h = i || g, L = S.useRef(null), _ = S.useRef(null), H = S.useRef(u), J = l != null, Z = Vs(l), U = Vs(o), T = Vs(c), te = S.useCallback(() => {
    if (!L.current || !_.current)
      return;
    const V = {
      placement: t,
      strategy: n,
      middleware: d
    };
    U.current && (V.platform = U.current), lk(L.current, _.current, V).then((z) => {
      const y = {
        ...z,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: T.current !== !1
      };
      W.current && !$i(H.current, y) && (H.current = y, na.flushSync(() => {
        f(y);
      }));
    });
  }, [d, t, n, U, T]);
  ui(() => {
    c === !1 && H.current.isPositioned && (H.current.isPositioned = !1, f((V) => ({
      ...V,
      isPositioned: !1
    })));
  }, [c]);
  const W = S.useRef(!1);
  ui(() => (W.current = !0, () => {
    W.current = !1;
  }), []), ui(() => {
    if (O && (L.current = O), h && (_.current = h), O && h) {
      if (Z.current)
        return Z.current(O, h, te);
      te();
    }
  }, [O, h, te, Z, J]);
  const j = S.useMemo(() => ({
    reference: L,
    floating: _,
    setReference: k,
    setFloating: x
  }), [k, x]), D = S.useMemo(() => ({
    reference: O,
    floating: h
  }), [O, h]), Q = S.useMemo(() => {
    const V = {
      position: n,
      left: 0,
      top: 0
    };
    if (!D.floating)
      return V;
    const z = ep(D.floating, u.x), y = ep(D.floating, u.y);
    return s ? {
      ...V,
      transform: "translate(" + z + "px, " + y + "px)",
      ...Qb(D.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: n,
      left: z,
      top: y
    };
  }, [n, s, D.floating, u.x, u.y]);
  return S.useMemo(() => ({
    ...u,
    update: te,
    refs: j,
    elements: D,
    floatingStyles: Q
  }), [u, te, j, D, Q]);
}
const Jb = (e, t) => ({
  ...ok(e),
  options: [e, t]
}), uk = (e, t) => ({
  ...ak(e),
  options: [e, t]
}), fk = (e, t) => ({
  ...ik(e),
  options: [e, t]
}), dk = (e, t) => ({
  ...sk(e),
  options: [e, t]
}), Zb = {
  ...S
}, pk = Zb.useInsertionEffect, mk = pk || ((e) => e());
function ey(e) {
  const t = S.useRef(() => {
    if (process.env.NODE_ENV !== "production")
      throw new Error("Cannot call an event handler while rendering.");
  });
  return mk(() => {
    t.current = e;
  }), S.useCallback(function() {
    for (var n = arguments.length, r = new Array(n), o = 0; o < n; o++)
      r[o] = arguments[o];
    return t.current == null ? void 0 : t.current(...r);
  }, []);
}
var Ec = typeof document < "u" ? Xi : Ee;
let tp = !1, gk = 0;
const np = () => (
  // Ensure the id is unique with multiple independent versions of Floating UI
  // on <React 18
  "floating-ui-" + Math.random().toString(36).slice(2, 6) + gk++
);
function hk() {
  const [e, t] = S.useState(() => tp ? np() : void 0);
  return Ec(() => {
    e == null && t(np());
  }, []), S.useEffect(() => {
    tp = !0;
  }, []), e;
}
const bk = Zb.useId, yk = bk || hk;
let aa;
process.env.NODE_ENV !== "production" && (aa = /* @__PURE__ */ new Set());
function vk() {
  for (var e, t = arguments.length, n = new Array(t), r = 0; r < t; r++)
    n[r] = arguments[r];
  const o = "Floating UI: " + n.join(" ");
  if (!((e = aa) != null && e.has(o))) {
    var a;
    (a = aa) == null || a.add(o), console.warn(o);
  }
}
function xk() {
  for (var e, t = arguments.length, n = new Array(t), r = 0; r < t; r++)
    n[r] = arguments[r];
  const o = "Floating UI: " + n.join(" ");
  if (!((e = aa) != null && e.has(o))) {
    var a;
    (a = aa) == null || a.add(o), console.error(o);
  }
}
function wk() {
  const e = /* @__PURE__ */ new Map();
  return {
    emit(t, n) {
      var r;
      (r = e.get(t)) == null || r.forEach((o) => o(n));
    },
    on(t, n) {
      e.set(t, [...e.get(t) || [], n]);
    },
    off(t, n) {
      var r;
      e.set(t, ((r = e.get(t)) == null ? void 0 : r.filter((o) => o !== n)) || []);
    }
  };
}
const kk = /* @__PURE__ */ S.createContext(null), Ek = /* @__PURE__ */ S.createContext(null), Ok = () => {
  var e;
  return ((e = S.useContext(kk)) == null ? void 0 : e.id) || null;
}, Sk = () => S.useContext(Ek), Pk = "data-floating-ui-focusable";
function Ak(e) {
  const {
    open: t = !1,
    onOpenChange: n,
    elements: r
  } = e, o = yk(), a = S.useRef({}), [i] = S.useState(() => wk()), s = Ok() != null;
  if (process.env.NODE_ENV !== "production") {
    const p = r.reference;
    p && !tt(p) && xk("Cannot pass a virtual element to the `elements.reference` option,", "as it must be a real DOM element. Use `refs.setPositionReference()`", "instead.");
  }
  const [l, c] = S.useState(r.reference), u = ey((p, b, m) => {
    a.current.openEvent = p ? b : void 0, i.emit("openchange", {
      open: p,
      event: b,
      reason: m,
      nested: s
    }), n == null || n(p, b, m);
  }), f = S.useMemo(() => ({
    setPositionReference: c
  }), []), d = S.useMemo(() => ({
    reference: l || r.reference || null,
    floating: r.floating || null,
    domReference: r.reference
  }), [l, r.reference, r.floating]);
  return S.useMemo(() => ({
    dataRef: a,
    open: t,
    onOpenChange: u,
    elements: d,
    events: i,
    floatingId: o,
    refs: f
  }), [t, u, d, i, o, f]);
}
function Ck(e) {
  e === void 0 && (e = {});
  const {
    nodeId: t
  } = e, n = Ak({
    ...e,
    elements: {
      reference: null,
      floating: null,
      ...e.elements
    }
  }), r = e.rootContext || n, o = r.elements, [a, i] = S.useState(null), [s, l] = S.useState(null), u = (o == null ? void 0 : o.domReference) || a, f = S.useRef(null), d = Sk();
  Ec(() => {
    u && (f.current = u);
  }, [u]);
  const p = ck({
    ...e,
    elements: {
      ...o,
      ...s && {
        reference: s
      }
    }
  }), b = S.useCallback((x) => {
    const O = tt(x) ? {
      getBoundingClientRect: () => x.getBoundingClientRect(),
      contextElement: x
    } : x;
    l(O), p.refs.setReference(O);
  }, [p.refs]), m = S.useCallback((x) => {
    (tt(x) || x === null) && (f.current = x, i(x)), (tt(p.refs.reference.current) || p.refs.reference.current === null || // Don't allow setting virtual elements using the old technique back to
    // `null` to support `positionReference` + an unstable `reference`
    // callback ref.
    x !== null && !tt(x)) && p.refs.setReference(x);
  }, [p.refs]), g = S.useMemo(() => ({
    ...p.refs,
    setReference: m,
    setPositionReference: b,
    domReference: f
  }), [p.refs, m, b]), v = S.useMemo(() => ({
    ...p.elements,
    domReference: u
  }), [p.elements, u]), k = S.useMemo(() => ({
    ...p,
    ...r,
    refs: g,
    elements: v,
    nodeId: t
  }), [p, g, v, t, r]);
  return Ec(() => {
    r.dataRef.current.floatingContext = k;
    const x = d == null ? void 0 : d.nodesRef.current.find((O) => O.id === t);
    x && (x.context = k);
  }), S.useMemo(() => ({
    ...p,
    context: k,
    refs: g,
    elements: v
  }), [p, g, v, k]);
}
const rp = "active", op = "selected";
function Hs(e, t, n) {
  const r = /* @__PURE__ */ new Map(), o = n === "item";
  let a = e;
  if (o && e) {
    const {
      [rp]: i,
      [op]: s,
      ...l
    } = e;
    a = l;
  }
  return {
    ...n === "floating" && {
      tabIndex: -1,
      [Pk]: ""
    },
    ...a,
    ...t.map((i) => {
      const s = i ? i[n] : null;
      return typeof s == "function" ? e ? s(e) : null : s;
    }).concat(e).reduce((i, s) => (s && Object.entries(s).forEach((l) => {
      let [c, u] = l;
      if (!(o && [rp, op].includes(c)))
        if (c.indexOf("on") === 0) {
          if (r.has(c) || r.set(c, []), typeof u == "function") {
            var f;
            (f = r.get(c)) == null || f.push(u), i[c] = function() {
              for (var d, p = arguments.length, b = new Array(p), m = 0; m < p; m++)
                b[m] = arguments[m];
              return (d = r.get(c)) == null ? void 0 : d.map((g) => g(...b)).find((g) => g !== void 0);
            };
          }
        } else
          i[c] = u;
    }), i), {})
  };
}
function $k(e) {
  e === void 0 && (e = []);
  const t = e.map((s) => s == null ? void 0 : s.reference), n = e.map((s) => s == null ? void 0 : s.floating), r = e.map((s) => s == null ? void 0 : s.item), o = S.useCallback(
    (s) => Hs(s, e, "reference"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    t
  ), a = S.useCallback(
    (s) => Hs(s, e, "floating"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    n
  ), i = S.useCallback(
    (s) => Hs(s, e, "item"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    r
  );
  return S.useMemo(() => ({
    getReferenceProps: o,
    getFloatingProps: a,
    getItemProps: i
  }), [o, a, i]);
}
function ap(e, t) {
  return {
    ...e,
    rects: {
      ...e.rects,
      floating: {
        ...e.rects.floating,
        height: t
      }
    }
  };
}
const Nk = (e) => ({
  name: "inner",
  options: e,
  async fn(t) {
    const {
      listRef: n,
      overflowRef: r,
      onFallbackChange: o,
      offset: a = 0,
      index: i = 0,
      minItemsVisible: s = 4,
      referenceOverflowThreshold: l = 0,
      scrollRef: c,
      ...u
    } = co(e, t), {
      rects: f,
      elements: {
        floating: d
      }
    } = t, p = n.current[i], b = (c == null ? void 0 : c.current) || d, m = d.clientTop || b.clientTop, g = d.clientTop !== 0, v = b.clientTop !== 0, k = d === b;
    if (process.env.NODE_ENV !== "production" && (t.placement.startsWith("bottom") || vk('`placement` side must be "bottom" when using the `inner`', "middleware.")), !p)
      return {};
    const x = {
      ...t,
      ...await Jb(-p.offsetTop - d.clientTop - f.reference.height / 2 - p.offsetHeight / 2 - a).fn(t)
    }, O = await Ws(ap(x, b.scrollHeight + m + d.clientTop), u), h = await Ws(x, {
      ...u,
      elementContext: "reference"
    }), L = et(0, O.top), _ = x.y + L, Z = (b.scrollHeight > b.clientHeight ? (U) => U : oa)(et(0, b.scrollHeight + (g && k || v ? m * 2 : 0) - L - et(0, O.bottom)));
    if (b.style.maxHeight = Z + "px", b.scrollTop = L, o) {
      const U = b.offsetHeight < p.offsetHeight * fr(s, n.current.length) - 1 || h.top >= -l || h.bottom >= -l;
      na.flushSync(() => o(U));
    }
    return r && (r.current = await Ws(ap({
      ...x,
      y: _
    }, b.offsetHeight + m + d.clientTop), u)), {
      y: _
    };
  }
});
function Ik(e, t) {
  const {
    open: n,
    elements: r
  } = e, {
    enabled: o = !0,
    overflowRef: a,
    scrollRef: i,
    onChange: s
  } = t, l = ey(s), c = S.useRef(!1), u = S.useRef(null), f = S.useRef(null);
  S.useEffect(() => {
    if (!o) return;
    function p(m) {
      if (m.ctrlKey || !b || a.current == null)
        return;
      const g = m.deltaY, v = a.current.top >= -0.5, k = a.current.bottom >= -0.5, x = b.scrollHeight - b.clientHeight, O = g < 0 ? -1 : 1, h = g < 0 ? "max" : "min";
      b.scrollHeight <= b.clientHeight || (!v && g > 0 || !k && g < 0 ? (m.preventDefault(), na.flushSync(() => {
        l((L) => L + Math[h](g, x * O));
      })) : /firefox/i.test(A2()) && (b.scrollTop += g));
    }
    const b = (i == null ? void 0 : i.current) || r.floating;
    if (n && b)
      return b.addEventListener("wheel", p), requestAnimationFrame(() => {
        u.current = b.scrollTop, a.current != null && (f.current = {
          ...a.current
        });
      }), () => {
        u.current = null, f.current = null, b.removeEventListener("wheel", p);
      };
  }, [o, n, r.floating, a, i, l]);
  const d = S.useMemo(() => ({
    onKeyDown() {
      c.current = !0;
    },
    onWheel() {
      c.current = !1;
    },
    onPointerMove() {
      c.current = !1;
    },
    onScroll() {
      const p = (i == null ? void 0 : i.current) || r.floating;
      if (!(!a.current || !p || !c.current)) {
        if (u.current !== null) {
          const b = p.scrollTop - u.current;
          (a.current.bottom < -0.5 && b < -1 || a.current.top < -0.5 && b > 1) && na.flushSync(() => l((m) => m + b));
        }
        requestAnimationFrame(() => {
          u.current = p.scrollTop;
        });
      }
    }
  }), [r.floating, l, a, i]);
  return S.useMemo(() => o ? {
    floating: d
  } : {}, [o, d]);
}
let uo = dt({ styles: void 0, setReference: () => {
}, setFloating: () => {
}, getReferenceProps: () => ({}), getFloatingProps: () => ({}), slot: {} });
uo.displayName = "FloatingContext";
let bf = dt(null);
bf.displayName = "PlacementContext";
function Tk(e) {
  return Ye(() => e ? typeof e == "string" ? { to: e } : e : null, [e]);
}
function Mk() {
  return Ke(uo).setReference;
}
function Rk() {
  return Ke(uo).getReferenceProps;
}
function jk() {
  let { getFloatingProps: e, slot: t } = Ke(uo);
  return Ge((...n) => Object.assign({}, e(...n), { "data-anchor": t.anchor }), [e, t]);
}
function _k(e = null) {
  e === !1 && (e = null), typeof e == "string" && (e = { to: e });
  let t = Ke(bf), n = Ye(() => e, [JSON.stringify(e, (o, a) => {
    var i;
    return (i = a == null ? void 0 : a.outerHTML) != null ? i : a;
  })]);
  _e(() => {
    t == null || t(n ?? null);
  }, [t, n]);
  let r = Ke(uo);
  return Ye(() => [r.setFloating, e ? r.styles : {}], [r.setFloating, e, r.styles]);
}
let ip = 4;
function Fk({ children: e, enabled: t = !0 }) {
  let [n, r] = $e(null), [o, a] = $e(0), i = le(null), [s, l] = $e(null);
  Lk(s);
  let c = t && n !== null && s !== null, { to: u = "bottom", gap: f = 0, offset: d = 0, padding: p = 0, inner: b } = Dk(n, s), [m, g = "center"] = u.split(" ");
  _e(() => {
    c && a(0);
  }, [c]);
  let { refs: v, floatingStyles: k, context: x } = Ck({ open: c, placement: m === "selection" ? g === "center" ? "bottom" : `bottom-${g}` : g === "center" ? `${m}` : `${m}-${g}`, strategy: "absolute", transform: !1, middleware: [Jb({ mainAxis: m === "selection" ? 0 : f, crossAxis: d }), uk({ padding: p }), m !== "selection" && fk({ padding: p }), m === "selection" && b ? Nk({ ...b, padding: p, overflowRef: i, offset: o, minItemsVisible: ip, referenceOverflowThreshold: p, onFallbackChange(U) {
    var T, te;
    if (!U) return;
    let W = x.elements.floating;
    if (!W) return;
    let j = parseFloat(getComputedStyle(W).scrollPaddingBottom) || 0, D = Math.min(ip, W.childElementCount), Q = 0, V = 0;
    for (let z of (te = (T = x.elements.floating) == null ? void 0 : T.childNodes) != null ? te : []) if (z instanceof HTMLElement) {
      let y = z.offsetTop, w = y + z.clientHeight + j, C = W.scrollTop, A = C + W.clientHeight;
      if (y >= C && w <= A) D--;
      else {
        V = Math.max(0, Math.min(w, A) - Math.max(y, C)), Q = z.clientHeight;
        break;
      }
    }
    D >= 1 && a((z) => {
      let y = Q * D - V + j;
      return z >= y ? z : y;
    });
  } }) : null, dk({ padding: p, apply({ availableWidth: U, availableHeight: T, elements: te }) {
    Object.assign(te.floating.style, { overflow: "auto", maxWidth: `${U}px`, maxHeight: `min(var(--anchor-max-height, 100vh), ${T}px)` });
  } })].filter(Boolean), whileElementsMounted: rk }), [O = m, h = g] = x.placement.split("-");
  m === "selection" && (O = "selection");
  let L = Ye(() => ({ anchor: [O, h].filter(Boolean).join(" ") }), [O, h]), _ = Ik(x, { overflowRef: i, onChange: a }), { getReferenceProps: H, getFloatingProps: J } = $k([_]), Z = we((U) => {
    l(U), v.setFloating(U);
  });
  return S.createElement(bf.Provider, { value: r }, S.createElement(uo.Provider, { value: { setFloating: Z, setReference: v.setReference, styles: k, getReferenceProps: H, getFloatingProps: J, slot: L } }, e));
}
function Lk(e) {
  _e(() => {
    if (!e) return;
    let t = new MutationObserver(() => {
      let n = window.getComputedStyle(e).maxHeight, r = parseFloat(n);
      if (isNaN(r)) return;
      let o = parseInt(n);
      isNaN(o) || r !== o && (e.style.maxHeight = `${Math.ceil(r)}px`);
    });
    return t.observe(e, { attributes: !0, attributeFilter: ["style"] }), () => {
      t.disconnect();
    };
  }, [e]);
}
function Dk(e, t) {
  var n, r, o;
  let a = Us((n = e == null ? void 0 : e.gap) != null ? n : "var(--anchor-gap, 0)", t), i = Us((r = e == null ? void 0 : e.offset) != null ? r : "var(--anchor-offset, 0)", t), s = Us((o = e == null ? void 0 : e.padding) != null ? o : "var(--anchor-padding, 0)", t);
  return { ...e, gap: a, offset: i, padding: s };
}
function Us(e, t, n = void 0) {
  let r = Pa(), o = we((l, c) => {
    if (l == null) return [n, null];
    if (typeof l == "number") return [l, null];
    if (typeof l == "string") {
      if (!c) return [n, null];
      let u = sp(l, c);
      return [u, (f) => {
        let d = ty(l);
        {
          let p = d.map((b) => window.getComputedStyle(c).getPropertyValue(b));
          r.requestAnimationFrame(function b() {
            r.nextFrame(b);
            let m = !1;
            for (let [v, k] of d.entries()) {
              let x = window.getComputedStyle(c).getPropertyValue(k);
              if (p[v] !== x) {
                p[v] = x, m = !0;
                break;
              }
            }
            if (!m) return;
            let g = sp(l, c);
            u !== g && (f(g), u = g);
          });
        }
        return r.dispose;
      }];
    }
    return [n, null];
  }), a = Ye(() => o(e, t)[0], [e, t]), [i = a, s] = $e();
  return _e(() => {
    let [l, c] = o(e, t);
    if (s(l), !!c) return c(s);
  }, [e, t]), i;
}
function ty(e) {
  let t = /var\((.*)\)/.exec(e);
  if (t) {
    let n = t[1].indexOf(",");
    if (n === -1) return [t[1]];
    let r = t[1].slice(0, n).trim(), o = t[1].slice(n + 1).trim();
    return o ? [r, ...ty(o)] : [r];
  }
  return [];
}
function sp(e, t) {
  let n = document.createElement("div");
  t.appendChild(n), n.style.setProperty("margin-top", "0px", "important"), n.style.setProperty("margin-top", e, "important");
  let r = parseFloat(window.getComputedStyle(n).marginTop) || 0;
  return t.removeChild(n), r;
}
let yf = dt(null);
yf.displayName = "OpenClosedContext";
var Nt = ((e) => (e[e.Open = 1] = "Open", e[e.Closed = 2] = "Closed", e[e.Closing = 4] = "Closing", e[e.Opening = 8] = "Opening", e))(Nt || {});
function vf() {
  return Ke(yf);
}
function ny({ value: e, children: t }) {
  return ke.createElement(yf.Provider, { value: e }, t);
}
function zk(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Va = { exports: {} }, Ys = {};
/**
 * @license React
 * use-sync-external-store-with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var lp;
function Wk() {
  if (lp) return Ys;
  lp = 1;
  var e = ke;
  function t(l, c) {
    return l === c && (l !== 0 || 1 / l === 1 / c) || l !== l && c !== c;
  }
  var n = typeof Object.is == "function" ? Object.is : t, r = e.useSyncExternalStore, o = e.useRef, a = e.useEffect, i = e.useMemo, s = e.useDebugValue;
  return Ys.useSyncExternalStoreWithSelector = function(l, c, u, f, d) {
    var p = o(null);
    if (p.current === null) {
      var b = { hasValue: !1, value: null };
      p.current = b;
    } else b = p.current;
    p = i(
      function() {
        function g(h) {
          if (!v) {
            if (v = !0, k = h, h = f(h), d !== void 0 && b.hasValue) {
              var L = b.value;
              if (d(L, h))
                return x = L;
            }
            return x = h;
          }
          if (L = x, n(k, h)) return L;
          var _ = f(h);
          return d !== void 0 && d(L, _) ? (k = h, L) : (k = h, x = _);
        }
        var v = !1, k, x, O = u === void 0 ? null : u;
        return [
          function() {
            return g(c());
          },
          O === null ? void 0 : function() {
            return g(O());
          }
        ];
      },
      [c, u, f, d]
    );
    var m = r(l, p[0], p[1]);
    return a(
      function() {
        b.hasValue = !0, b.value = m;
      },
      [m]
    ), s(m), m;
  }, Ys;
}
var Bs = {};
/**
 * @license React
 * use-sync-external-store-with-selector.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var cp;
function Vk() {
  return cp || (cp = 1, process.env.NODE_ENV !== "production" && function() {
    function e(l, c) {
      return l === c && (l !== 0 || 1 / l === 1 / c) || l !== l && c !== c;
    }
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
    var t = ke, n = typeof Object.is == "function" ? Object.is : e, r = t.useSyncExternalStore, o = t.useRef, a = t.useEffect, i = t.useMemo, s = t.useDebugValue;
    Bs.useSyncExternalStoreWithSelector = function(l, c, u, f, d) {
      var p = o(null);
      if (p.current === null) {
        var b = { hasValue: !1, value: null };
        p.current = b;
      } else b = p.current;
      p = i(
        function() {
          function g(h) {
            if (!v) {
              if (v = !0, k = h, h = f(h), d !== void 0 && b.hasValue) {
                var L = b.value;
                if (d(L, h))
                  return x = L;
              }
              return x = h;
            }
            if (L = x, n(k, h))
              return L;
            var _ = f(h);
            return d !== void 0 && d(L, _) ? (k = h, L) : (k = h, x = _);
          }
          var v = !1, k, x, O = u === void 0 ? null : u;
          return [
            function() {
              return g(c());
            },
            O === null ? void 0 : function() {
              return g(O());
            }
          ];
        },
        [c, u, f, d]
      );
      var m = r(l, p[0], p[1]);
      return a(
        function() {
          b.hasValue = !0, b.value = m;
        },
        [m]
      ), s(m), m;
    }, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
  }()), Bs;
}
var up;
function Hk() {
  return up || (up = 1, process.env.NODE_ENV === "production" ? Va.exports = Wk() : Va.exports = Vk()), Va.exports;
}
var Uk = Hk(), ry = (e, t, n) => {
  if (!t.has(e)) throw TypeError("Cannot " + n);
}, At = (e, t, n) => (ry(e, t, "read from private field"), n ? n.call(e) : t.get(e)), Gs = (e, t, n) => {
  if (t.has(e)) throw TypeError("Cannot add the same private member more than once");
  t instanceof WeakSet ? t.add(e) : t.set(e, n);
}, fp = (e, t, n, r) => (ry(e, t, "write to private field"), t.set(e, n), n), sn, Ro, jo;
class Yk {
  constructor(t) {
    Gs(this, sn, {}), Gs(this, Ro, new Ib(() => /* @__PURE__ */ new Set())), Gs(this, jo, /* @__PURE__ */ new Set()), fp(this, sn, t);
  }
  get state() {
    return At(this, sn);
  }
  subscribe(t, n) {
    let r = { selector: t, callback: n, current: t(At(this, sn)) };
    return At(this, jo).add(r), () => {
      At(this, jo).delete(r);
    };
  }
  on(t, n) {
    return At(this, Ro).get(t).add(n), () => {
      At(this, Ro).get(t).delete(n);
    };
  }
  send(t) {
    fp(this, sn, this.reduce(At(this, sn), t));
    for (let n of At(this, jo)) {
      let r = n.selector(At(this, sn));
      oy(n.current, r) || (n.current = r, n.callback(r));
    }
    for (let n of At(this, Ro).get(t.type)) n(At(this, sn), t);
  }
}
sn = /* @__PURE__ */ new WeakMap(), Ro = /* @__PURE__ */ new WeakMap(), jo = /* @__PURE__ */ new WeakMap();
function oy(e, t) {
  return Object.is(e, t) ? !0 : typeof e != "object" || e === null || typeof t != "object" || t === null ? !1 : Array.isArray(e) && Array.isArray(t) ? e.length !== t.length ? !1 : qs(e[Symbol.iterator](), t[Symbol.iterator]()) : e instanceof Map && t instanceof Map || e instanceof Set && t instanceof Set ? e.size !== t.size ? !1 : qs(e.entries(), t.entries()) : dp(e) && dp(t) ? qs(Object.entries(e)[Symbol.iterator](), Object.entries(t)[Symbol.iterator]()) : !1;
}
function qs(e, t) {
  do {
    let n = e.next(), r = t.next();
    if (n.done && r.done) return !0;
    if (n.done || r.done || !Object.is(n.value, r.value)) return !1;
  } while (!0);
}
function dp(e) {
  if (Object.prototype.toString.call(e) !== "[object Object]") return !1;
  let t = Object.getPrototypeOf(e);
  return t === null || Object.getPrototypeOf(t) === null;
}
function pp(e) {
  let [t, n] = e(), r = Rt();
  return (...o) => {
    t(...o), r.dispose(), r.microTask(n);
  };
}
function _n(e, t, n = oy) {
  return Uk.useSyncExternalStoreWithSelector(we((r) => e.subscribe(Bk, r)), we(() => e.state), we(() => e.state), we(t), n);
}
function Bk(e) {
  return e;
}
function Gk(e) {
  throw new Error("Unexpected object: " + e);
}
var qe = ((e) => (e[e.First = 0] = "First", e[e.Previous = 1] = "Previous", e[e.Next = 2] = "Next", e[e.Last = 3] = "Last", e[e.Specific = 4] = "Specific", e[e.Nothing = 5] = "Nothing", e))(qe || {});
function Ha(e, t) {
  let n = t.resolveItems();
  if (n.length <= 0) return null;
  let r = t.resolveActiveIndex(), o = r ?? -1;
  switch (e.focus) {
    case 0: {
      for (let a = 0; a < n.length; ++a) if (!t.resolveDisabled(n[a], a, n)) return a;
      return r;
    }
    case 1: {
      o === -1 && (o = n.length);
      for (let a = o - 1; a >= 0; --a) if (!t.resolveDisabled(n[a], a, n)) return a;
      return r;
    }
    case 2: {
      for (let a = o + 1; a < n.length; ++a) if (!t.resolveDisabled(n[a], a, n)) return a;
      return r;
    }
    case 3: {
      for (let a = n.length - 1; a >= 0; --a) if (!t.resolveDisabled(n[a], a, n)) return a;
      return r;
    }
    case 4: {
      for (let a = 0; a < n.length; ++a) if (t.resolveId(n[a], a, n) === e.id) return a;
      return r;
    }
    case 5:
      return null;
    default:
      Gk(e);
  }
}
function qk(e) {
  let t = we(e), n = le(!1);
  Ee(() => (n.current = !1, () => {
    n.current = !0, Ob(() => {
      n.current && t();
    });
  }), [t]);
}
function Kk() {
  let e = typeof document > "u";
  return "useSyncExternalStore" in S ? ((t) => t.useSyncExternalStore)(S)(() => () => {
  }, () => !1, () => !e) : !1;
}
function xf() {
  let e = Kk(), [t, n] = S.useState(cr.isHandoffComplete);
  return t && cr.isHandoffComplete === !1 && n(!1), S.useEffect(() => {
    t !== !0 && n(!0);
  }, [t]), S.useEffect(() => cr.handoff(), []), e ? !1 : t;
}
let Xk = dt(!1);
function Qk() {
  return Ke(Xk);
}
function Jk(e) {
  let t = Qk(), n = Ke(iy), [r, o] = $e(() => {
    var a;
    if (!t && n !== null) return (a = n.current) != null ? a : null;
    if (cr.isServer) return null;
    let i = e == null ? void 0 : e.getElementById("headlessui-portal-root");
    if (i) return i;
    if (e === null) return null;
    let s = e.createElement("div");
    return s.setAttribute("id", "headlessui-portal-root"), e.body.appendChild(s);
  });
  return Ee(() => {
    r !== null && (e != null && e.body.contains(r) || e == null || e.body.appendChild(r));
  }, [r, e]), Ee(() => {
    t || n !== null && o(n.current);
  }, [n, o, t]), r;
}
let ay = mt, Zk = lt(function(e, t) {
  let { ownerDocument: n = null, ...r } = e, o = le(null), a = jt(Fw((p) => {
    o.current = p;
  }), t), i = xc(o), s = n ?? i, l = Jk(s), [c] = $e(() => {
    var p;
    return cr.isServer ? null : (p = s == null ? void 0 : s.createElement("div")) != null ? p : null;
  }), u = Ke(rE), f = xf();
  _e(() => {
    !l || !c || l.contains(c) || (c.setAttribute("data-headlessui-portal", ""), l.appendChild(c));
  }, [l, c]), _e(() => {
    if (c && u) return u.register(c);
  }, [u, c]), qk(() => {
    var p;
    !l || !c || (c instanceof Node && l.contains(c) && l.removeChild(c), l.childNodes.length <= 0 && ((p = l.parentElement) == null || p.removeChild(l)));
  });
  let d = pt();
  return f ? !l || !c ? null : Zx(d({ ourProps: { ref: a }, theirProps: r, slot: {}, defaultTag: ay, name: "Portal" }), c) : null;
});
function eE(e, t) {
  let n = jt(t), { enabled: r = !0, ownerDocument: o, ...a } = e, i = pt();
  return r ? ke.createElement(Zk, { ...a, ownerDocument: o, ref: n }) : i({ ourProps: { ref: n }, theirProps: a, slot: {}, defaultTag: ay, name: "Portal" });
}
let tE = mt, iy = dt(null);
function nE(e, t) {
  let { target: n, ...r } = e, o = { ref: jt(t) }, a = pt();
  return ke.createElement(iy.Provider, { value: n }, a({ ourProps: o, theirProps: r, defaultTag: tE, name: "Popover.Group" }));
}
let rE = dt(null), oE = lt(eE), aE = lt(nE), iE = Object.assign(oE, { Group: aE });
function sE() {
  let e = le(!1);
  return _e(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
}
function sy(e) {
  var t;
  return !!(e.enter || e.enterFrom || e.enterTo || e.leave || e.leaveFrom || e.leaveTo) || ((t = e.as) != null ? t : cy) !== mt || ke.Children.count(e.children) === 1;
}
let ns = dt(null);
ns.displayName = "TransitionContext";
var lE = ((e) => (e.Visible = "visible", e.Hidden = "hidden", e))(lE || {});
function cE() {
  let e = Ke(ns);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
function uE() {
  let e = Ke(rs);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
let rs = dt(null);
rs.displayName = "NestingContext";
function os(e) {
  return "children" in e ? os(e.children) : e.current.filter(({ el: t }) => t.current !== null).filter(({ state: t }) => t === "visible").length > 0;
}
function ly(e, t) {
  let n = so(e), r = le([]), o = sE(), a = Pa(), i = we((p, b = jn.Hidden) => {
    let m = r.current.findIndex(({ el: g }) => g === p);
    m !== -1 && (Sr(b, { [jn.Unmount]() {
      r.current.splice(m, 1);
    }, [jn.Hidden]() {
      r.current[m].state = "hidden";
    } }), a.microTask(() => {
      var g;
      !os(r) && o.current && ((g = n.current) == null || g.call(n));
    }));
  }), s = we((p) => {
    let b = r.current.find(({ el: m }) => m === p);
    return b ? b.state !== "visible" && (b.state = "visible") : r.current.push({ el: p, state: "visible" }), () => i(p, jn.Unmount);
  }), l = le([]), c = le(Promise.resolve()), u = le({ enter: [], leave: [] }), f = we((p, b, m) => {
    l.current.splice(0), t && (t.chains.current[b] = t.chains.current[b].filter(([g]) => g !== p)), t == null || t.chains.current[b].push([p, new Promise((g) => {
      l.current.push(g);
    })]), t == null || t.chains.current[b].push([p, new Promise((g) => {
      Promise.all(u.current[b].map(([v, k]) => k)).then(() => g());
    })]), b === "enter" ? c.current = c.current.then(() => t == null ? void 0 : t.wait.current).then(() => m(b)) : m(b);
  }), d = we((p, b, m) => {
    Promise.all(u.current[b].splice(0).map(([g, v]) => v)).then(() => {
      var g;
      (g = l.current.shift()) == null || g();
    }).then(() => m(b));
  });
  return Ye(() => ({ children: r, register: s, unregister: i, onStart: f, onStop: d, wait: c, chains: u }), [s, i, r, f, d, u, c]);
}
let cy = mt, uy = Pi.RenderStrategy;
function fE(e, t) {
  var n, r;
  let { transition: o = !0, beforeEnter: a, afterEnter: i, beforeLeave: s, afterLeave: l, enter: c, enterFrom: u, enterTo: f, entered: d, leave: p, leaveFrom: b, leaveTo: m, ...g } = e, [v, k] = $e(null), x = le(null), O = sy(e), h = jt(...O ? [x, t, k] : t === null ? [] : [t]), L = (n = g.unmount) == null || n ? jn.Unmount : jn.Hidden, { show: _, appear: H, initial: J } = cE(), [Z, U] = $e(_ ? "visible" : "hidden"), T = uE(), { register: te, unregister: W } = T;
  _e(() => te(x), [te, x]), _e(() => {
    if (L === jn.Hidden && x.current) {
      if (_ && Z !== "visible") {
        U("visible");
        return;
      }
      return Sr(Z, { hidden: () => W(x), visible: () => te(x) });
    }
  }, [Z, x, te, W, _, L]);
  let j = xf();
  _e(() => {
    if (O && j && Z === "visible" && x.current === null) throw new Error("Did you forget to passthrough the `ref` to the actual DOM node?");
  }, [x, Z, j, O]);
  let D = J && !H, Q = H && _ && J, V = le(!1), z = ly(() => {
    V.current || (U("hidden"), W(x));
  }, T), y = we(($) => {
    V.current = !0;
    let R = $ ? "enter" : "leave";
    z.onStart(x, R, (M) => {
      M === "enter" ? a == null || a() : M === "leave" && (s == null || s());
    });
  }), w = we(($) => {
    let R = $ ? "enter" : "leave";
    V.current = !1, z.onStop(x, R, (M) => {
      M === "enter" ? i == null || i() : M === "leave" && (l == null || l());
    }), R === "leave" && !os(z) && (U("hidden"), W(x));
  });
  Ee(() => {
    O && o || (y(_), w(_));
  }, [_, O, o]);
  let C = !(!o || !O || !j || D), [, A] = Db(C, v, _, { start: y, end: w }), P = nr({ ref: h, className: ((r = hc(g.className, Q && c, Q && u, A.enter && c, A.enter && A.closed && u, A.enter && !A.closed && f, A.leave && p, A.leave && !A.closed && b, A.leave && A.closed && m, !A.transition && _ && d)) == null ? void 0 : r.trim()) || void 0, ...Lb(A) }), I = 0;
  Z === "visible" && (I |= Nt.Open), Z === "hidden" && (I |= Nt.Closed), _ && Z === "hidden" && (I |= Nt.Opening), !_ && Z === "visible" && (I |= Nt.Closing);
  let N = pt();
  return ke.createElement(rs.Provider, { value: z }, ke.createElement(ny, { value: I }, N({ ourProps: P, theirProps: g, defaultTag: cy, features: uy, visible: Z === "visible", name: "Transition.Child" })));
}
function dE(e, t) {
  let { show: n, appear: r = !1, unmount: o = !0, ...a } = e, i = le(null), s = sy(e), l = jt(...s ? [i, t] : t === null ? [] : [t]);
  xf();
  let c = vf();
  if (n === void 0 && c !== null && (n = (c & Nt.Open) === Nt.Open), n === void 0) throw new Error("A <Transition /> is used but it is missing a `show={true | false}` prop.");
  let [u, f] = $e(n ? "visible" : "hidden"), d = ly(() => {
    n || f("hidden");
  }), [p, b] = $e(!0), m = le([n]);
  _e(() => {
    p !== !1 && m.current[m.current.length - 1] !== n && (m.current.push(n), b(!1));
  }, [m, n]);
  let g = Ye(() => ({ show: n, appear: r, initial: p }), [n, r, p]);
  _e(() => {
    n ? f("visible") : !os(d) && i.current !== null && f("hidden");
  }, [n, d]);
  let v = { unmount: o }, k = we(() => {
    var h;
    p && b(!1), (h = e.beforeEnter) == null || h.call(e);
  }), x = we(() => {
    var h;
    p && b(!1), (h = e.beforeLeave) == null || h.call(e);
  }), O = pt();
  return ke.createElement(rs.Provider, { value: d }, ke.createElement(ns.Provider, { value: g }, O({ ourProps: { ...v, as: mt, children: ke.createElement(fy, { ref: l, ...v, ...a, beforeEnter: k, beforeLeave: x }) }, theirProps: {}, defaultTag: mt, features: uy, visible: u === "visible", name: "Transition" })));
}
function pE(e, t) {
  let n = Ke(ns) !== null, r = vf() !== null;
  return ke.createElement(ke.Fragment, null, !n && r ? ke.createElement(Oc, { ref: t, ...e }) : ke.createElement(fy, { ref: t, ...e }));
}
let Oc = lt(dE), fy = lt(fE), mE = lt(pE), gE = Object.assign(Oc, { Child: mE, Root: Oc });
function hE(e, t) {
  let n = le({ left: 0, top: 0 });
  if (_e(() => {
    if (!t) return;
    let o = t.getBoundingClientRect();
    o && (n.current = o);
  }, [e, t]), t == null || !e || t === document.activeElement) return !1;
  let r = t.getBoundingClientRect();
  return r.top !== n.current.top || r.left !== n.current.left;
}
let mp = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;
function gp(e) {
  var t, n;
  let r = (t = e.innerText) != null ? t : "", o = e.cloneNode(!0);
  if (!(o instanceof HTMLElement)) return r;
  let a = !1;
  for (let s of o.querySelectorAll('[hidden],[aria-hidden],[role="img"]')) s.remove(), a = !0;
  let i = a ? (n = o.innerText) != null ? n : "" : r;
  return mp.test(i) && (i = i.replace(mp, "")), i;
}
function bE(e) {
  let t = e.getAttribute("aria-label");
  if (typeof t == "string") return t.trim();
  let n = e.getAttribute("aria-labelledby");
  if (n) {
    let r = n.split(" ").map((o) => {
      let a = document.getElementById(o);
      if (a) {
        let i = a.getAttribute("aria-label");
        return typeof i == "string" ? i.trim() : gp(a).trim();
      }
      return null;
    }).filter(Boolean);
    if (r.length > 0) return r.join(", ");
  }
  return gp(e).trim();
}
function yE(e) {
  let t = le(""), n = le("");
  return we(() => {
    let r = e.current;
    if (!r) return "";
    let o = r.innerText;
    if (t.current === o) return n.current;
    let a = bE(r).trim().toLowerCase();
    return t.current = o, n.current = a, a;
  });
}
var vE = Object.defineProperty, xE = (e, t, n) => t in e ? vE(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, hp = (e, t, n) => (xE(e, typeof t != "symbol" ? t + "" : t, n), n), Ze = ((e) => (e[e.Open = 0] = "Open", e[e.Closed = 1] = "Closed", e))(Ze || {}), Ni = ((e) => (e[e.Pointer = 0] = "Pointer", e[e.Other = 1] = "Other", e))(Ni || {}), Re = ((e) => (e[e.OpenMenu = 0] = "OpenMenu", e[e.CloseMenu = 1] = "CloseMenu", e[e.GoToItem = 2] = "GoToItem", e[e.Search = 3] = "Search", e[e.ClearSearch = 4] = "ClearSearch", e[e.RegisterItems = 5] = "RegisterItems", e[e.UnregisterItems = 6] = "UnregisterItems", e[e.SetButtonElement = 7] = "SetButtonElement", e[e.SetItemsElement = 8] = "SetItemsElement", e[e.SortItems = 9] = "SortItems", e))(Re || {});
function bp(e, t = (n) => n) {
  let n = e.activeItemIndex !== null ? e.items[e.activeItemIndex] : null, r = _b(t(e.items.slice()), (a) => a.dataRef.current.domRef.current), o = n ? r.indexOf(n) : null;
  return o === -1 && (o = null), { items: r, activeItemIndex: o };
}
let wE = { 1(e) {
  return e.menuState === 1 ? e : { ...e, activeItemIndex: null, pendingFocus: { focus: qe.Nothing }, menuState: 1 };
}, 0(e, t) {
  return e.menuState === 0 ? e : { ...e, __demoMode: !1, pendingFocus: t.focus, menuState: 0 };
}, 2: (e, t) => {
  var n, r, o, a, i;
  if (e.menuState === 1) return e;
  let s = { ...e, searchQuery: "", activationTrigger: (n = t.trigger) != null ? n : 1, __demoMode: !1 };
  if (t.focus === qe.Nothing) return { ...s, activeItemIndex: null };
  if (t.focus === qe.Specific) return { ...s, activeItemIndex: e.items.findIndex((u) => u.id === t.id) };
  if (t.focus === qe.Previous) {
    let u = e.activeItemIndex;
    if (u !== null) {
      let f = e.items[u].dataRef.current.domRef, d = Ha(t, { resolveItems: () => e.items, resolveActiveIndex: () => e.activeItemIndex, resolveId: (p) => p.id, resolveDisabled: (p) => p.dataRef.current.disabled });
      if (d !== null) {
        let p = e.items[d].dataRef.current.domRef;
        if (((r = f.current) == null ? void 0 : r.previousElementSibling) === p.current || ((o = p.current) == null ? void 0 : o.previousElementSibling) === null) return { ...s, activeItemIndex: d };
      }
    }
  } else if (t.focus === qe.Next) {
    let u = e.activeItemIndex;
    if (u !== null) {
      let f = e.items[u].dataRef.current.domRef, d = Ha(t, { resolveItems: () => e.items, resolveActiveIndex: () => e.activeItemIndex, resolveId: (p) => p.id, resolveDisabled: (p) => p.dataRef.current.disabled });
      if (d !== null) {
        let p = e.items[d].dataRef.current.domRef;
        if (((a = f.current) == null ? void 0 : a.nextElementSibling) === p.current || ((i = p.current) == null ? void 0 : i.nextElementSibling) === null) return { ...s, activeItemIndex: d };
      }
    }
  }
  let l = bp(e), c = Ha(t, { resolveItems: () => l.items, resolveActiveIndex: () => l.activeItemIndex, resolveId: (u) => u.id, resolveDisabled: (u) => u.dataRef.current.disabled });
  return { ...s, ...l, activeItemIndex: c };
}, 3: (e, t) => {
  let n = e.searchQuery !== "" ? 0 : 1, r = e.searchQuery + t.value.toLowerCase(), o = (e.activeItemIndex !== null ? e.items.slice(e.activeItemIndex + n).concat(e.items.slice(0, e.activeItemIndex + n)) : e.items).find((i) => {
    var s;
    return ((s = i.dataRef.current.textValue) == null ? void 0 : s.startsWith(r)) && !i.dataRef.current.disabled;
  }), a = o ? e.items.indexOf(o) : -1;
  return a === -1 || a === e.activeItemIndex ? { ...e, searchQuery: r } : { ...e, searchQuery: r, activeItemIndex: a, activationTrigger: 1 };
}, 4(e) {
  return e.searchQuery === "" ? e : { ...e, searchQuery: "", searchActiveItemIndex: null };
}, 5: (e, t) => {
  let n = e.items.concat(t.items.map((o) => o)), r = e.activeItemIndex;
  return e.pendingFocus.focus !== qe.Nothing && (r = Ha(e.pendingFocus, { resolveItems: () => n, resolveActiveIndex: () => e.activeItemIndex, resolveId: (o) => o.id, resolveDisabled: (o) => o.dataRef.current.disabled })), { ...e, items: n, activeItemIndex: r, pendingFocus: { focus: qe.Nothing }, pendingShouldSort: !0 };
}, 6: (e, t) => {
  let n = e.items, r = [], o = new Set(t.items);
  for (let [a, i] of n.entries()) if (o.has(i.id) && (r.push(a), o.delete(i.id), o.size === 0)) break;
  if (r.length > 0) {
    n = n.slice();
    for (let a of r.reverse()) n.splice(a, 1);
  }
  return { ...e, items: n, activationTrigger: 1 };
}, 7: (e, t) => e.buttonElement === t.element ? e : { ...e, buttonElement: t.element }, 8: (e, t) => e.itemsElement === t.element ? e : { ...e, itemsElement: t.element }, 9: (e) => e.pendingShouldSort ? { ...e, ...bp(e), pendingShouldSort: !1 } : e }, kE = class dy extends Yk {
  constructor(t) {
    super(t), hp(this, "actions", { registerItem: pp(() => {
      let n = [], r = /* @__PURE__ */ new Set();
      return [(o, a) => {
        r.has(a) || (r.add(a), n.push({ id: o, dataRef: a }));
      }, () => (r.clear(), this.send({ type: 5, items: n.splice(0) }))];
    }), unregisterItem: pp(() => {
      let n = [];
      return [(r) => n.push(r), () => this.send({ type: 6, items: n.splice(0) })];
    }) }), hp(this, "selectors", { activeDescendantId(n) {
      var r;
      let o = n.activeItemIndex, a = n.items;
      return o === null || (r = a[o]) == null ? void 0 : r.id;
    }, isActive(n, r) {
      var o;
      let a = n.activeItemIndex, i = n.items;
      return a !== null ? ((o = i[a]) == null ? void 0 : o.id) === r : !1;
    }, shouldScrollIntoView(n, r) {
      return n.__demoMode || n.menuState !== 0 || n.activationTrigger === 0 ? !1 : this.isActive(n, r);
    } }), this.on(5, () => {
      requestAnimationFrame(() => {
        this.send({ type: 9 });
      });
    });
  }
  static new({ __demoMode: t = !1 } = {}) {
    return new dy({ __demoMode: t, menuState: t ? 0 : 1, buttonElement: null, itemsElement: null, items: [], searchQuery: "", activeItemIndex: null, activationTrigger: 1, pendingShouldSort: !1, pendingFocus: { focus: qe.Nothing } });
  }
  reduce(t, n) {
    return Sr(n.type, wE, t, n);
  }
};
const py = dt(null);
function wf(e) {
  let t = Ke(py);
  if (t === null) {
    let n = new Error(`<${e} /> is missing a parent <Menu /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(n, my), n;
  }
  return t;
}
function my({ __demoMode: e = !1 } = {}) {
  return Ye(() => kE.new({ __demoMode: e }), []);
}
let EE = mt;
function OE(e, t) {
  let { __demoMode: n = !1, ...r } = e, o = my({ __demoMode: n }), [a, i, s] = _n(o, (b) => [b.menuState, b.itemsElement, b.buttonElement]), l = jt(t), c = a === Ze.Open;
  u2(c, [s, i], (b, m) => {
    var g;
    o.send({ type: Re.CloseMenu }), df(m, ff.Loose) || (b.preventDefault(), (g = o.state.buttonElement) == null || g.focus());
  });
  let u = we(() => {
    o.send({ type: Re.CloseMenu });
  }), f = Ye(() => ({ open: a === Ze.Open, close: u }), [a, u]), d = { ref: l }, p = pt();
  return ke.createElement(Fk, null, ke.createElement(py.Provider, { value: o }, ke.createElement(ny, { value: Sr(a, { [Ze.Open]: Nt.Open, [Ze.Closed]: Nt.Closed }) }, p({ ourProps: d, theirProps: r, slot: f, defaultTag: EE, name: "Menu" }))));
}
let SE = "button";
function PE(e, t) {
  let n = wf("Menu.Button"), r = Or(), { id: o = `headlessui-menu-button-${r}`, disabled: a = !1, autoFocus: i = !1, ...s } = e, l = le(null), c = Rk(), u = jt(t, l, Mk(), we((H) => n.send({ type: Re.SetButtonElement, element: H }))), f = we((H) => {
    switch (H.key) {
      case Je.Space:
      case Je.Enter:
      case Je.ArrowDown:
        H.preventDefault(), H.stopPropagation(), n.send({ type: Re.OpenMenu, focus: { focus: qe.First } });
        break;
      case Je.ArrowUp:
        H.preventDefault(), H.stopPropagation(), n.send({ type: Re.OpenMenu, focus: { focus: qe.Last } });
        break;
    }
  }), d = we((H) => {
    switch (H.key) {
      case Je.Space:
        H.preventDefault();
        break;
    }
  }), [p, b] = _n(n, (H) => [H.menuState, H.itemsElement]), m = we((H) => {
    var J;
    if (H.button === 0) {
      if (jw(H.currentTarget)) return H.preventDefault();
      a || (p === Ze.Open ? (uc(() => n.send({ type: Re.CloseMenu })), (J = l.current) == null || J.focus({ preventScroll: !0 })) : (H.preventDefault(), n.send({ type: Re.OpenMenu, focus: { focus: qe.Nothing }, trigger: Ni.Pointer })));
    }
  }), { isFocusVisible: g, focusProps: v } = ww({ autoFocus: i }), { isHovered: k, hoverProps: x } = xw({ isDisabled: a }), { pressed: O, pressProps: h } = Aw({ disabled: a }), L = Ye(() => ({ open: p === Ze.Open, active: O || p === Ze.Open, disabled: a, hover: k, focus: g, autofocus: i }), [p, k, g, O, a, i]), _ = Ab(c(), { ref: u, id: o, type: f2(e, l.current), "aria-haspopup": "menu", "aria-controls": b == null ? void 0 : b.id, "aria-expanded": p === Ze.Open, disabled: a || void 0, autoFocus: i, onKeyDown: f, onKeyUp: d, onMouseDown: m }, v, x, h);
  return pt()({ ourProps: _, theirProps: s, slot: L, defaultTag: SE, name: "Menu.Button" });
}
let AE = "div", CE = Pi.RenderStrategy | Pi.Static;
function $E(e, t) {
  let n = Or(), { id: r = `headlessui-menu-items-${n}`, anchor: o, portal: a = !1, modal: i = !0, transition: s = !1, ...l } = e, c = Tk(o), u = wf("Menu.Items"), [f, d] = _k(c), p = jk(), [b, m] = $e(null), g = jt(t, c ? f : null, we((z) => u.send({ type: Re.SetItemsElement, element: z })), m), [v, k] = _n(u, (z) => [z.menuState, z.buttonElement]), x = xc(k), O = xc(b);
  c && (a = !0);
  let h = vf(), [L, _] = Db(s, b, h !== null ? (h & Nt.Open) === Nt.Open : v === Ze.Open);
  Xw(L, k, () => {
    u.send({ type: Re.CloseMenu });
  });
  let H = _n(u, (z) => z.__demoMode), J = H ? !1 : i && v === Ze.Open;
  b2(J, O);
  let Z = H ? !1 : i && v === Ze.Open;
  Kw(Z, { allowed: Ge(() => [k, b], [k, b]) });
  let U = v !== Ze.Open, T = hE(U, k) ? !1 : L;
  Ee(() => {
    let z = b;
    z && v === Ze.Open && z !== (O == null ? void 0 : O.activeElement) && z.focus({ preventScroll: !0 });
  }, [v, b, O]), O2(v === Ze.Open, { container: b, accept(z) {
    return z.getAttribute("role") === "menuitem" ? NodeFilter.FILTER_REJECT : z.hasAttribute("role") ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
  }, walk(z) {
    z.setAttribute("role", "none");
  } });
  let te = Pa(), W = we((z) => {
    var y, w, C;
    switch (te.dispose(), z.key) {
      case Je.Space:
        if (u.state.searchQuery !== "") return z.preventDefault(), z.stopPropagation(), u.send({ type: Re.Search, value: z.key });
      case Je.Enter:
        if (z.preventDefault(), z.stopPropagation(), u.state.activeItemIndex !== null) {
          let { dataRef: A } = u.state.items[u.state.activeItemIndex];
          (w = (y = A.current) == null ? void 0 : y.domRef.current) == null || w.click();
        }
        u.send({ type: Re.CloseMenu }), jb(u.state.buttonElement);
        break;
      case Je.ArrowDown:
        return z.preventDefault(), z.stopPropagation(), u.send({ type: Re.GoToItem, focus: qe.Next });
      case Je.ArrowUp:
        return z.preventDefault(), z.stopPropagation(), u.send({ type: Re.GoToItem, focus: qe.Previous });
      case Je.Home:
      case Je.PageUp:
        return z.preventDefault(), z.stopPropagation(), u.send({ type: Re.GoToItem, focus: qe.First });
      case Je.End:
      case Je.PageDown:
        return z.preventDefault(), z.stopPropagation(), u.send({ type: Re.GoToItem, focus: qe.Last });
      case Je.Escape:
        z.preventDefault(), z.stopPropagation(), uc(() => u.send({ type: Re.CloseMenu })), (C = u.state.buttonElement) == null || C.focus({ preventScroll: !0 });
        break;
      case Je.Tab:
        z.preventDefault(), z.stopPropagation(), uc(() => u.send({ type: Re.CloseMenu })), a2(u.state.buttonElement, z.shiftKey ? vc.Previous : vc.Next);
        break;
      default:
        z.key.length === 1 && (u.send({ type: Re.Search, value: z.key }), te.setTimeout(() => u.send({ type: Re.ClearSearch }), 350));
        break;
    }
  }), j = we((z) => {
    switch (z.key) {
      case Je.Space:
        z.preventDefault();
        break;
    }
  }), D = Ye(() => ({ open: v === Ze.Open }), [v]), Q = Ab(c ? p() : {}, { "aria-activedescendant": _n(u, u.selectors.activeDescendantId), "aria-labelledby": _n(u, (z) => {
    var y;
    return (y = z.buttonElement) == null ? void 0 : y.id;
  }), id: r, onKeyDown: W, onKeyUp: j, role: "menu", tabIndex: v === Ze.Open ? 0 : void 0, ref: g, style: { ...l.style, ...d, "--button-width": Gw(k, !0).width }, ...Lb(_) }), V = pt();
  return ke.createElement(iE, { enabled: a ? e.static || L : !1, ownerDocument: x }, V({ ourProps: Q, theirProps: l, slot: D, defaultTag: AE, features: CE, visible: T, name: "Menu.Items" }));
}
let NE = mt;
function IE(e, t) {
  let n = Or(), { id: r = `headlessui-menu-item-${n}`, disabled: o = !1, ...a } = e, i = wf("Menu.Item"), s = _n(i, (U) => i.selectors.isActive(U, r)), l = le(null), c = jt(t, l), u = _n(i, (U) => i.selectors.shouldScrollIntoView(U, r));
  _e(() => {
    if (u) return Rt().requestAnimationFrame(() => {
      var U, T;
      (T = (U = l.current) == null ? void 0 : U.scrollIntoView) == null || T.call(U, { block: "nearest" });
    });
  }, [u, l]);
  let f = yE(l), d = le({ disabled: o, domRef: l, get textValue() {
    return f();
  } });
  _e(() => {
    d.current.disabled = o;
  }, [d, o]), _e(() => (i.actions.registerItem(r, d), () => i.actions.unregisterItem(r)), [d, r]);
  let p = we(() => {
    i.send({ type: Re.CloseMenu });
  }), b = we((U) => {
    if (o) return U.preventDefault();
    i.send({ type: Re.CloseMenu }), jb(i.state.buttonElement);
  }), m = we(() => {
    if (o) return i.send({ type: Re.GoToItem, focus: qe.Nothing });
    i.send({ type: Re.GoToItem, focus: qe.Specific, id: r });
  }), g = y2(), v = we((U) => {
    g.update(U), !o && (s || i.send({ type: Re.GoToItem, focus: qe.Specific, id: r, trigger: Ni.Pointer }));
  }), k = we((U) => {
    g.wasMoved(U) && (o || s || i.send({ type: Re.GoToItem, focus: qe.Specific, id: r, trigger: Ni.Pointer }));
  }), x = we((U) => {
    g.wasMoved(U) && (o || s && i.send({ type: Re.GoToItem, focus: qe.Nothing }));
  }), [O, h] = Nb(), [L, _] = Lw(), H = Ye(() => ({ active: s, focus: s, disabled: o, close: p }), [s, o, p]), J = { id: r, ref: c, role: "menuitem", tabIndex: o === !0 ? void 0 : -1, "aria-disabled": o === !0 ? !0 : void 0, "aria-labelledby": O, "aria-describedby": L, disabled: void 0, onClick: b, onFocus: m, onPointerEnter: v, onMouseEnter: v, onPointerMove: k, onMouseMove: k, onPointerLeave: x, onMouseLeave: x }, Z = pt();
  return ke.createElement(h, null, ke.createElement(_, null, Z({ ourProps: J, theirProps: a, slot: H, defaultTag: NE, name: "Menu.Item" })));
}
let TE = "div";
function ME(e, t) {
  let [n, r] = Nb(), o = e, a = { ref: t, "aria-labelledby": n, role: "group" }, i = pt();
  return ke.createElement(r, null, i({ ourProps: a, theirProps: o, slot: {}, defaultTag: TE, name: "Menu.Section" }));
}
let RE = "header";
function jE(e, t) {
  let n = Or(), { id: r = `headlessui-menu-heading-${n}`, ...o } = e, a = cf();
  _e(() => a.register(r), [r, a.register]);
  let i = { id: r, ref: t, role: "presentation", ...a.props };
  return pt()({ ourProps: i, theirProps: o, slot: {}, defaultTag: RE, name: "Menu.Heading" });
}
let _E = "div";
function FE(e, t) {
  let n = e, r = { ref: t, role: "separator" };
  return pt()({ ourProps: r, theirProps: n, slot: {}, defaultTag: _E, name: "Menu.Separator" });
}
let LE = lt(OE), DE = lt(PE), zE = lt($E), WE = lt(IE), VE = lt(ME), HE = lt(jE), UE = lt(FE), Ua = Object.assign(LE, { Button: DE, Items: zE, Item: WE, Section: VE, Heading: HE, Separator: UE });
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const YE = {
  prefix: "fas",
  iconName: "chevron-down",
  icon: [512, 512, [], "f078", "M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"]
};
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function BE(e, t, n) {
  return (t = qE(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function yp(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function B(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? yp(Object(n), !0).forEach(function(r) {
      BE(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : yp(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function GE(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function qE(e) {
  var t = GE(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const vp = () => {
};
let kf = {}, gy = {}, hy = null, by = {
  mark: vp,
  measure: vp
};
try {
  typeof window < "u" && (kf = window), typeof document < "u" && (gy = document), typeof MutationObserver < "u" && (hy = MutationObserver), typeof performance < "u" && (by = performance);
} catch {
}
const {
  userAgent: xp = ""
} = kf.navigator || {}, Hn = kf, We = gy, wp = hy, Ya = by;
Hn.document;
const bn = !!We.documentElement && !!We.head && typeof We.addEventListener == "function" && typeof We.createElement == "function", yy = ~xp.indexOf("MSIE") || ~xp.indexOf("Trident/");
var KE = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, XE = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, vy = {
  classic: {
    fa: "solid",
    fas: "solid",
    "fa-solid": "solid",
    far: "regular",
    "fa-regular": "regular",
    fal: "light",
    "fa-light": "light",
    fat: "thin",
    "fa-thin": "thin",
    fab: "brands",
    "fa-brands": "brands"
  },
  duotone: {
    fa: "solid",
    fad: "solid",
    "fa-solid": "solid",
    "fa-duotone": "solid",
    fadr: "regular",
    "fa-regular": "regular",
    fadl: "light",
    "fa-light": "light",
    fadt: "thin",
    "fa-thin": "thin"
  },
  sharp: {
    fa: "solid",
    fass: "solid",
    "fa-solid": "solid",
    fasr: "regular",
    "fa-regular": "regular",
    fasl: "light",
    "fa-light": "light",
    fast: "thin",
    "fa-thin": "thin"
  },
  "sharp-duotone": {
    fa: "solid",
    fasds: "solid",
    "fa-solid": "solid",
    fasdr: "regular",
    "fa-regular": "regular",
    fasdl: "light",
    "fa-light": "light",
    fasdt: "thin",
    "fa-thin": "thin"
  }
}, QE = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, xy = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], nt = "classic", as = "duotone", JE = "sharp", ZE = "sharp-duotone", wy = [nt, as, JE, ZE], eO = {
  classic: {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  duotone: {
    900: "fad",
    400: "fadr",
    300: "fadl",
    100: "fadt"
  },
  sharp: {
    900: "fass",
    400: "fasr",
    300: "fasl",
    100: "fast"
  },
  "sharp-duotone": {
    900: "fasds",
    400: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
}, tO = {
  "Font Awesome 6 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 6 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  "Font Awesome 6 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 6 Duotone": {
    900: "fad",
    400: "fadr",
    normal: "fadr",
    300: "fadl",
    100: "fadt"
  },
  "Font Awesome 6 Sharp": {
    900: "fass",
    400: "fasr",
    normal: "fasr",
    300: "fasl",
    100: "fast"
  },
  "Font Awesome 6 Sharp Duotone": {
    900: "fasds",
    400: "fasdr",
    normal: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
}, nO = /* @__PURE__ */ new Map([["classic", {
  defaultShortPrefixId: "fas",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin", "brands"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp", {
  defaultShortPrefixId: "fass",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["duotone", {
  defaultShortPrefixId: "fad",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp-duotone", {
  defaultShortPrefixId: "fasds",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}]]), rO = {
  classic: {
    solid: "fas",
    regular: "far",
    light: "fal",
    thin: "fat",
    brands: "fab"
  },
  duotone: {
    solid: "fad",
    regular: "fadr",
    light: "fadl",
    thin: "fadt"
  },
  sharp: {
    solid: "fass",
    regular: "fasr",
    light: "fasl",
    thin: "fast"
  },
  "sharp-duotone": {
    solid: "fasds",
    regular: "fasdr",
    light: "fasdl",
    thin: "fasdt"
  }
}, oO = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], kp = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, aO = ["kit"], iO = {
  kit: {
    "fa-kit": "fak"
  }
}, sO = ["fak", "fakd"], lO = {
  kit: {
    fak: "fa-kit"
  }
}, Ep = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Ba = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, cO = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], uO = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], fO = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, dO = {
  classic: {
    "fa-brands": "fab",
    "fa-duotone": "fad",
    "fa-light": "fal",
    "fa-regular": "far",
    "fa-solid": "fas",
    "fa-thin": "fat"
  },
  duotone: {
    "fa-regular": "fadr",
    "fa-light": "fadl",
    "fa-thin": "fadt"
  },
  sharp: {
    "fa-solid": "fass",
    "fa-regular": "fasr",
    "fa-light": "fasl",
    "fa-thin": "fast"
  },
  "sharp-duotone": {
    "fa-solid": "fasds",
    "fa-regular": "fasdr",
    "fa-light": "fasdl",
    "fa-thin": "fasdt"
  }
}, pO = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Sc = {
  classic: {
    fab: "fa-brands",
    fad: "fa-duotone",
    fal: "fa-light",
    far: "fa-regular",
    fas: "fa-solid",
    fat: "fa-thin"
  },
  duotone: {
    fadr: "fa-regular",
    fadl: "fa-light",
    fadt: "fa-thin"
  },
  sharp: {
    fass: "fa-solid",
    fasr: "fa-regular",
    fasl: "fa-light",
    fast: "fa-thin"
  },
  "sharp-duotone": {
    fasds: "fa-solid",
    fasdr: "fa-regular",
    fasdl: "fa-light",
    fasdt: "fa-thin"
  }
}, mO = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], Pc = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...cO, ...mO], gO = ["solid", "regular", "light", "thin", "duotone", "brands"], ky = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], hO = ky.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), bO = [...Object.keys(pO), ...gO, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Ba.GROUP, Ba.SWAP_OPACITY, Ba.PRIMARY, Ba.SECONDARY].concat(ky.map((e) => "".concat(e, "x"))).concat(hO.map((e) => "w-".concat(e))), yO = {
  "Font Awesome 5 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 5 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal"
  },
  "Font Awesome 5 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 5 Duotone": {
    900: "fad"
  }
};
const cn = "___FONT_AWESOME___", Ac = 16, Ey = "fa", Oy = "svg-inline--fa", mr = "data-fa-i2svg", Cc = "data-fa-pseudo-element", vO = "data-fa-pseudo-element-pending", Ef = "data-prefix", Of = "data-icon", Op = "fontawesome-i2svg", xO = "async", wO = ["HTML", "HEAD", "STYLE", "SCRIPT"], Sy = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function $a(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[nt];
    }
  });
}
const Py = B({}, vy);
Py[nt] = B(B(B(B({}, {
  "fa-duotone": "duotone"
}), vy[nt]), kp.kit), kp["kit-duotone"]);
const kO = $a(Py), $c = B({}, rO);
$c[nt] = B(B(B(B({}, {
  duotone: "fad"
}), $c[nt]), Ep.kit), Ep["kit-duotone"]);
const Sp = $a($c), Nc = B({}, Sc);
Nc[nt] = B(B({}, Nc[nt]), lO.kit);
const Sf = $a(Nc), Ic = B({}, dO);
Ic[nt] = B(B({}, Ic[nt]), iO.kit);
$a(Ic);
const EO = KE, Ay = "fa-layers-text", OO = XE, SO = B({}, eO);
$a(SO);
const PO = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Ks = QE, AO = [...aO, ...bO], Ho = Hn.FontAwesomeConfig || {};
function CO(e) {
  var t = We.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function $O(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
We && typeof We.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [n, r] = t;
  const o = $O(CO(n));
  o != null && (Ho[r] = o);
});
const Cy = {
  styleDefault: "solid",
  familyDefault: nt,
  cssPrefix: Ey,
  replacementClass: Oy,
  autoReplaceSvg: !0,
  autoAddCss: !0,
  autoA11y: !0,
  searchPseudoElements: !1,
  observeMutations: !0,
  mutateApproach: "async",
  keepOriginalSource: !0,
  measurePerformance: !1,
  showMissingIcons: !0
};
Ho.familyPrefix && (Ho.cssPrefix = Ho.familyPrefix);
const to = B(B({}, Cy), Ho);
to.autoReplaceSvg || (to.observeMutations = !1);
const ne = {};
Object.keys(Cy).forEach((e) => {
  Object.defineProperty(ne, e, {
    enumerable: !0,
    set: function(t) {
      to[e] = t, Uo.forEach((n) => n(ne));
    },
    get: function() {
      return to[e];
    }
  });
});
Object.defineProperty(ne, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    to.cssPrefix = e, Uo.forEach((t) => t(ne));
  },
  get: function() {
    return to.cssPrefix;
  }
});
Hn.FontAwesomeConfig = ne;
const Uo = [];
function NO(e) {
  return Uo.push(e), () => {
    Uo.splice(Uo.indexOf(e), 1);
  };
}
const wn = Ac, Ht = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function IO(e) {
  if (!e || !bn)
    return;
  const t = We.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = We.head.childNodes;
  let r = null;
  for (let o = n.length - 1; o > -1; o--) {
    const a = n[o], i = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = a);
  }
  return We.head.insertBefore(t, r), e;
}
const TO = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function ia() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += TO[Math.random() * 62 | 0];
  return t;
}
function fo(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function Pf(e) {
  return e.classList ? fo(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function $y(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function MO(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat($y(e[n]), '" '), "").trim();
}
function is(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function Af(e) {
  return e.size !== Ht.size || e.x !== Ht.x || e.y !== Ht.y || e.rotate !== Ht.rotate || e.flipX || e.flipY;
}
function RO(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const o = {
    transform: "translate(".concat(n / 2, " 256)")
  }, a = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), l = {
    transform: "".concat(a, " ").concat(i, " ").concat(s)
  }, c = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: l,
    path: c
  };
}
function jO(e) {
  let {
    transform: t,
    width: n = Ac,
    height: r = Ac,
    startCentered: o = !1
  } = e, a = "";
  return o && yy ? a += "translate(".concat(t.x / wn - n / 2, "em, ").concat(t.y / wn - r / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / wn, "em), calc(-50% + ").concat(t.y / wn, "em)) ") : a += "translate(".concat(t.x / wn, "em, ").concat(t.y / wn, "em) "), a += "scale(".concat(t.size / wn * (t.flipX ? -1 : 1), ", ").concat(t.size / wn * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var _O = `:root, :host {
  --fa-font-solid: normal 900 1em/1 "Font Awesome 6 Free";
  --fa-font-regular: normal 400 1em/1 "Font Awesome 6 Free";
  --fa-font-light: normal 300 1em/1 "Font Awesome 6 Pro";
  --fa-font-thin: normal 100 1em/1 "Font Awesome 6 Pro";
  --fa-font-duotone: normal 900 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-regular: normal 400 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-light: normal 300 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-thin: normal 100 1em/1 "Font Awesome 6 Duotone";
  --fa-font-brands: normal 400 1em/1 "Font Awesome 6 Brands";
  --fa-font-sharp-solid: normal 900 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-regular: normal 400 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-light: normal 300 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-thin: normal 100 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-duotone-solid: normal 900 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-regular: normal 400 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-light: normal 300 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-thin: normal 100 1em/1 "Font Awesome 6 Sharp Duotone";
}

svg:not(:root).svg-inline--fa, svg:not(:host).svg-inline--fa {
  overflow: visible;
  box-sizing: content-box;
}

.svg-inline--fa {
  display: var(--fa-display, inline-block);
  height: 1em;
  overflow: visible;
  vertical-align: -0.125em;
}
.svg-inline--fa.fa-2xs {
  vertical-align: 0.1em;
}
.svg-inline--fa.fa-xs {
  vertical-align: 0em;
}
.svg-inline--fa.fa-sm {
  vertical-align: -0.0714285705em;
}
.svg-inline--fa.fa-lg {
  vertical-align: -0.2em;
}
.svg-inline--fa.fa-xl {
  vertical-align: -0.25em;
}
.svg-inline--fa.fa-2xl {
  vertical-align: -0.3125em;
}
.svg-inline--fa.fa-pull-left {
  margin-right: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-pull-right {
  margin-left: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-li {
  width: var(--fa-li-width, 2em);
  top: 0.25em;
}
.svg-inline--fa.fa-fw {
  width: var(--fa-fw-width, 1.25em);
}

.fa-layers svg.svg-inline--fa {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
}

.fa-layers-counter, .fa-layers-text {
  display: inline-block;
  position: absolute;
  text-align: center;
}

.fa-layers {
  display: inline-block;
  height: 1em;
  position: relative;
  text-align: center;
  vertical-align: -0.125em;
  width: 1em;
}
.fa-layers svg.svg-inline--fa {
  transform-origin: center center;
}

.fa-layers-text {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center center;
}

.fa-layers-counter {
  background-color: var(--fa-counter-background-color, #ff253a);
  border-radius: var(--fa-counter-border-radius, 1em);
  box-sizing: border-box;
  color: var(--fa-inverse, #fff);
  line-height: var(--fa-counter-line-height, 1);
  max-width: var(--fa-counter-max-width, 5em);
  min-width: var(--fa-counter-min-width, 1.5em);
  overflow: hidden;
  padding: var(--fa-counter-padding, 0.25em 0.5em);
  right: var(--fa-right, 0);
  text-overflow: ellipsis;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-counter-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-bottom-right {
  bottom: var(--fa-bottom, 0);
  right: var(--fa-right, 0);
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom right;
}

.fa-layers-bottom-left {
  bottom: var(--fa-bottom, 0);
  left: var(--fa-left, 0);
  right: auto;
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom left;
}

.fa-layers-top-right {
  top: var(--fa-top, 0);
  right: var(--fa-right, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-top-left {
  left: var(--fa-left, 0);
  right: auto;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top left;
}

.fa-1x {
  font-size: 1em;
}

.fa-2x {
  font-size: 2em;
}

.fa-3x {
  font-size: 3em;
}

.fa-4x {
  font-size: 4em;
}

.fa-5x {
  font-size: 5em;
}

.fa-6x {
  font-size: 6em;
}

.fa-7x {
  font-size: 7em;
}

.fa-8x {
  font-size: 8em;
}

.fa-9x {
  font-size: 9em;
}

.fa-10x {
  font-size: 10em;
}

.fa-2xs {
  font-size: 0.625em;
  line-height: 0.1em;
  vertical-align: 0.225em;
}

.fa-xs {
  font-size: 0.75em;
  line-height: 0.0833333337em;
  vertical-align: 0.125em;
}

.fa-sm {
  font-size: 0.875em;
  line-height: 0.0714285718em;
  vertical-align: 0.0535714295em;
}

.fa-lg {
  font-size: 1.25em;
  line-height: 0.05em;
  vertical-align: -0.075em;
}

.fa-xl {
  font-size: 1.5em;
  line-height: 0.0416666682em;
  vertical-align: -0.125em;
}

.fa-2xl {
  font-size: 2em;
  line-height: 0.03125em;
  vertical-align: -0.1875em;
}

.fa-fw {
  text-align: center;
  width: 1.25em;
}

.fa-ul {
  list-style-type: none;
  margin-left: var(--fa-li-margin, 2.5em);
  padding-left: 0;
}
.fa-ul > li {
  position: relative;
}

.fa-li {
  left: calc(-1 * var(--fa-li-width, 2em));
  position: absolute;
  text-align: center;
  width: var(--fa-li-width, 2em);
  line-height: inherit;
}

.fa-border {
  border-color: var(--fa-border-color, #eee);
  border-radius: var(--fa-border-radius, 0.1em);
  border-style: var(--fa-border-style, solid);
  border-width: var(--fa-border-width, 0.08em);
  padding: var(--fa-border-padding, 0.2em 0.25em 0.15em);
}

.fa-pull-left {
  float: left;
  margin-right: var(--fa-pull-margin, 0.3em);
}

.fa-pull-right {
  float: right;
  margin-left: var(--fa-pull-margin, 0.3em);
}

.fa-beat {
  animation-name: fa-beat;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-bounce {
  animation-name: fa-bounce;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.28, 0.84, 0.42, 1));
}

.fa-fade {
  animation-name: fa-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-beat-fade {
  animation-name: fa-beat-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-flip {
  animation-name: fa-flip;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-shake {
  animation-name: fa-shake;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin {
  animation-name: fa-spin;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 2s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin-reverse {
  --fa-animation-direction: reverse;
}

.fa-pulse,
.fa-spin-pulse {
  animation-name: fa-spin;
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, steps(8));
}

@media (prefers-reduced-motion: reduce) {
  .fa-beat,
.fa-bounce,
.fa-fade,
.fa-beat-fade,
.fa-flip,
.fa-pulse,
.fa-shake,
.fa-spin,
.fa-spin-pulse {
    animation-delay: -1ms;
    animation-duration: 1ms;
    animation-iteration-count: 1;
    transition-delay: 0s;
    transition-duration: 0s;
  }
}
@keyframes fa-beat {
  0%, 90% {
    transform: scale(1);
  }
  45% {
    transform: scale(var(--fa-beat-scale, 1.25));
  }
}
@keyframes fa-bounce {
  0% {
    transform: scale(1, 1) translateY(0);
  }
  10% {
    transform: scale(var(--fa-bounce-start-scale-x, 1.1), var(--fa-bounce-start-scale-y, 0.9)) translateY(0);
  }
  30% {
    transform: scale(var(--fa-bounce-jump-scale-x, 0.9), var(--fa-bounce-jump-scale-y, 1.1)) translateY(var(--fa-bounce-height, -0.5em));
  }
  50% {
    transform: scale(var(--fa-bounce-land-scale-x, 1.05), var(--fa-bounce-land-scale-y, 0.95)) translateY(0);
  }
  57% {
    transform: scale(1, 1) translateY(var(--fa-bounce-rebound, -0.125em));
  }
  64% {
    transform: scale(1, 1) translateY(0);
  }
  100% {
    transform: scale(1, 1) translateY(0);
  }
}
@keyframes fa-fade {
  50% {
    opacity: var(--fa-fade-opacity, 0.4);
  }
}
@keyframes fa-beat-fade {
  0%, 100% {
    opacity: var(--fa-beat-fade-opacity, 0.4);
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(var(--fa-beat-fade-scale, 1.125));
  }
}
@keyframes fa-flip {
  50% {
    transform: rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), var(--fa-flip-angle, -180deg));
  }
}
@keyframes fa-shake {
  0% {
    transform: rotate(-15deg);
  }
  4% {
    transform: rotate(15deg);
  }
  8%, 24% {
    transform: rotate(-18deg);
  }
  12%, 28% {
    transform: rotate(18deg);
  }
  16% {
    transform: rotate(-22deg);
  }
  20% {
    transform: rotate(22deg);
  }
  32% {
    transform: rotate(-12deg);
  }
  36% {
    transform: rotate(12deg);
  }
  40%, 100% {
    transform: rotate(0deg);
  }
}
@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.fa-rotate-90 {
  transform: rotate(90deg);
}

.fa-rotate-180 {
  transform: rotate(180deg);
}

.fa-rotate-270 {
  transform: rotate(270deg);
}

.fa-flip-horizontal {
  transform: scale(-1, 1);
}

.fa-flip-vertical {
  transform: scale(1, -1);
}

.fa-flip-both,
.fa-flip-horizontal.fa-flip-vertical {
  transform: scale(-1, -1);
}

.fa-rotate-by {
  transform: rotate(var(--fa-rotate-angle, 0));
}

.fa-stack {
  display: inline-block;
  vertical-align: middle;
  height: 2em;
  position: relative;
  width: 2.5em;
}

.fa-stack-1x,
.fa-stack-2x {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
  z-index: var(--fa-stack-z-index, auto);
}

.svg-inline--fa.fa-stack-1x {
  height: 1em;
  width: 1.25em;
}
.svg-inline--fa.fa-stack-2x {
  height: 2em;
  width: 2.5em;
}

.fa-inverse {
  color: var(--fa-inverse, #fff);
}

.sr-only,
.fa-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:not(:focus),
.fa-sr-only-focusable:not(:focus) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.svg-inline--fa .fa-primary {
  fill: var(--fa-primary-color, currentColor);
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa .fa-secondary {
  fill: var(--fa-secondary-color, currentColor);
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-primary {
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-secondary {
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa mask .fa-primary,
.svg-inline--fa mask .fa-secondary {
  fill: black;
}`;
function Ny() {
  const e = Ey, t = Oy, n = ne.cssPrefix, r = ne.replacementClass;
  let o = _O;
  if (n !== e || r !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return o;
}
let Pp = !1;
function Xs() {
  ne.autoAddCss && !Pp && (IO(Ny()), Pp = !0);
}
var FO = {
  mixout() {
    return {
      dom: {
        css: Ny,
        insertCss: Xs
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Xs();
      },
      beforeI2svg() {
        Xs();
      }
    };
  }
};
const un = Hn || {};
un[cn] || (un[cn] = {});
un[cn].styles || (un[cn].styles = {});
un[cn].hooks || (un[cn].hooks = {});
un[cn].shims || (un[cn].shims = []);
var Ut = un[cn];
const Iy = [], Ty = function() {
  We.removeEventListener("DOMContentLoaded", Ty), Ii = 1, Iy.map((e) => e());
};
let Ii = !1;
bn && (Ii = (We.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(We.readyState), Ii || We.addEventListener("DOMContentLoaded", Ty));
function LO(e) {
  bn && (Ii ? setTimeout(e, 0) : Iy.push(e));
}
function Na(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? $y(e) : "<".concat(t, " ").concat(MO(n), ">").concat(r.map(Na).join(""), "</").concat(t, ">");
}
function Ap(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var Qs = function(t, n, r, o) {
  var a = Object.keys(t), i = a.length, s = n, l, c, u;
  for (r === void 0 ? (l = 1, u = t[a[0]]) : (l = 0, u = r); l < i; l++)
    c = a[l], u = s(u, t[c], c, t);
  return u;
};
function DO(e) {
  const t = [];
  let n = 0;
  const r = e.length;
  for (; n < r; ) {
    const o = e.charCodeAt(n++);
    if (o >= 55296 && o <= 56319 && n < r) {
      const a = e.charCodeAt(n++);
      (a & 64512) == 56320 ? t.push(((o & 1023) << 10) + (a & 1023) + 65536) : (t.push(o), n--);
    } else
      t.push(o);
  }
  return t;
}
function Tc(e) {
  const t = DO(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function zO(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), o;
  return r >= 55296 && r <= 56319 && n > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (r - 55296) * 1024 + o - 56320 + 65536 : r;
}
function Cp(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return !!r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function Mc(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, o = Cp(t);
  typeof Ut.hooks.addPack == "function" && !r ? Ut.hooks.addPack(e, Cp(t)) : Ut.styles[e] = B(B({}, Ut.styles[e] || {}), o), e === "fas" && Mc("fa", t);
}
const {
  styles: sa,
  shims: WO
} = Ut, My = Object.keys(Sf), VO = My.reduce((e, t) => (e[t] = Object.keys(Sf[t]), e), {});
let Cf = null, Ry = {}, jy = {}, _y = {}, Fy = {}, Ly = {};
function HO(e) {
  return ~AO.indexOf(e);
}
function UO(e, t) {
  const n = t.split("-"), r = n[0], o = n.slice(1).join("-");
  return r === e && o !== "" && !HO(o) ? o : null;
}
const Dy = () => {
  const e = (r) => Qs(sa, (o, a, i) => (o[i] = Qs(a, r, {}), o), {});
  Ry = e((r, o, a) => (o[3] && (r[o[3]] = a), o[2] && o[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = a;
  }), r)), jy = e((r, o, a) => (r[a] = a, o[2] && o[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = a;
  }), r)), Ly = e((r, o, a) => {
    const i = o[2];
    return r[a] = a, i.forEach((s) => {
      r[s] = a;
    }), r;
  });
  const t = "far" in sa || ne.autoFetchSvg, n = Qs(WO, (r, o) => {
    const a = o[0];
    let i = o[1];
    const s = o[2];
    return i === "far" && !t && (i = "fas"), typeof a == "string" && (r.names[a] = {
      prefix: i,
      iconName: s
    }), typeof a == "number" && (r.unicodes[a.toString(16)] = {
      prefix: i,
      iconName: s
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  _y = n.names, Fy = n.unicodes, Cf = ss(ne.styleDefault, {
    family: ne.familyDefault
  });
};
NO((e) => {
  Cf = ss(e.styleDefault, {
    family: ne.familyDefault
  });
});
Dy();
function $f(e, t) {
  return (Ry[e] || {})[t];
}
function YO(e, t) {
  return (jy[e] || {})[t];
}
function ar(e, t) {
  return (Ly[e] || {})[t];
}
function zy(e) {
  return _y[e] || {
    prefix: null,
    iconName: null
  };
}
function BO(e) {
  const t = Fy[e], n = $f("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Un() {
  return Cf;
}
const Wy = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function GO(e) {
  let t = nt;
  const n = My.reduce((r, o) => (r[o] = "".concat(ne.cssPrefix, "-").concat(o), r), {});
  return wy.forEach((r) => {
    (e.includes(n[r]) || e.some((o) => VO[r].includes(o))) && (t = r);
  }), t;
}
function ss(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = nt
  } = t, r = kO[n][e];
  if (n === as && !e)
    return "fad";
  const o = Sp[n][e] || Sp[n][r], a = e in Ut.styles ? e : null;
  return o || a || null;
}
function qO(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const o = UO(ne.cssPrefix, r);
    o ? n = o : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function $p(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function ls(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const o = Pc.concat(uO), a = $p(e.filter((f) => o.includes(f))), i = $p(e.filter((f) => !Pc.includes(f))), s = a.filter((f) => (r = f, !xy.includes(f))), [l = null] = s, c = GO(a), u = B(B({}, qO(i)), {}, {
    prefix: ss(l, {
      family: c
    })
  });
  return B(B(B({}, u), JO({
    values: e,
    family: c,
    styles: sa,
    config: ne,
    canonical: u,
    givenPrefix: r
  })), KO(n, r, u));
}
function KO(e, t, n) {
  let {
    prefix: r,
    iconName: o
  } = n;
  if (e || !r || !o)
    return {
      prefix: r,
      iconName: o
    };
  const a = t === "fa" ? zy(o) : {}, i = ar(r, o);
  return o = a.iconName || i || o, r = a.prefix || r, r === "far" && !sa.far && sa.fas && !ne.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: o
  };
}
const XO = wy.filter((e) => e !== nt || e !== as), QO = Object.keys(Sc).filter((e) => e !== nt).map((e) => Object.keys(Sc[e])).flat();
function JO(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: o = "",
    styles: a = {},
    config: i = {}
  } = e, s = n === as, l = t.includes("fa-duotone") || t.includes("fad"), c = i.familyDefault === "duotone", u = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (l || c || u) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && XO.includes(n) && (Object.keys(a).find((d) => QO.includes(d)) || i.autoFetchSvg)) {
    const d = nO.get(n).defaultShortPrefixId;
    r.prefix = d, r.iconName = ar(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || o === "fa") && (r.prefix = Un() || "fas"), r;
}
class ZO {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const o = n.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = B(B({}, this.definitions[a] || {}), o[a]), Mc(a, o[a]);
      const i = Sf[nt][a];
      i && Mc(i, o[a]), Dy();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, n) {
    const r = n.prefix && n.iconName && n.icon ? {
      0: n
    } : n;
    return Object.keys(r).map((o) => {
      const {
        prefix: a,
        iconName: i,
        icon: s
      } = r[o], l = s[2];
      t[a] || (t[a] = {}), l.length > 0 && l.forEach((c) => {
        typeof c == "string" && (t[a][c] = s);
      }), t[a][i] = s;
    }), t;
  }
}
let Np = [], Mr = {};
const Hr = {}, eS = Object.keys(Hr);
function tS(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return Np = e, Mr = {}, Object.keys(Hr).forEach((r) => {
    eS.indexOf(r) === -1 && delete Hr[r];
  }), Np.forEach((r) => {
    const o = r.mixout ? r.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (n[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((i) => {
        n[a] || (n[a] = {}), n[a][i] = o[a][i];
      });
    }), r.hooks) {
      const a = r.hooks();
      Object.keys(a).forEach((i) => {
        Mr[i] || (Mr[i] = []), Mr[i].push(a[i]);
      });
    }
    r.provides && r.provides(Hr);
  }), n;
}
function Rc(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), o = 2; o < n; o++)
    r[o - 2] = arguments[o];
  return (Mr[e] || []).forEach((i) => {
    t = i.apply(null, [t, ...r]);
  }), t;
}
function gr(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (Mr[e] || []).forEach((a) => {
    a.apply(null, n);
  });
}
function Yn() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Hr[e] ? Hr[e].apply(null, t) : void 0;
}
function jc(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || Un();
  if (t)
    return t = ar(n, t) || t, Ap(Vy.definitions, n, t) || Ap(Ut.styles, n, t);
}
const Vy = new ZO(), nS = () => {
  ne.autoReplaceSvg = !1, ne.observeMutations = !1, gr("noAuto");
}, rS = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return bn ? (gr("beforeI2svg", e), Yn("pseudoElements2svg", e), Yn("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    ne.autoReplaceSvg === !1 && (ne.autoReplaceSvg = !0), ne.observeMutations = !0, LO(() => {
      aS({
        autoReplaceSvgRoot: t
      }), gr("watch", e);
    });
  }
}, oS = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: ar(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = ss(e[0]);
      return {
        prefix: n,
        iconName: ar(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(ne.cssPrefix, "-")) > -1 || e.match(EO))) {
      const t = ls(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Un(),
        iconName: ar(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Un();
      return {
        prefix: t,
        iconName: ar(t, e) || e
      };
    }
  }
}, ht = {
  noAuto: nS,
  config: ne,
  dom: rS,
  parse: oS,
  library: Vy,
  findIconDefinition: jc,
  toHtml: Na
}, aS = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = We
  } = e;
  (Object.keys(Ut.styles).length > 0 || ne.autoFetchSvg) && bn && ne.autoReplaceSvg && ht.dom.i2svg({
    node: t
  });
};
function cs(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => Na(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!bn) return;
      const n = We.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function iS(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: o,
    styles: a,
    transform: i
  } = e;
  if (Af(i) && n.found && !r.found) {
    const {
      width: s,
      height: l
    } = n, c = {
      x: s / l / 2,
      y: 0.5
    };
    o.style = is(B(B({}, a), {}, {
      "transform-origin": "".concat(c.x + i.x / 16, "em ").concat(c.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function sS(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: o,
    symbol: a
  } = e;
  const i = a === !0 ? "".concat(t, "-").concat(ne.cssPrefix, "-").concat(n) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: B(B({}, o), {}, {
        id: i
      }),
      children: r
    }]
  }];
}
function Nf(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: o,
    transform: a,
    symbol: i,
    title: s,
    maskId: l,
    titleId: c,
    extra: u,
    watchable: f = !1
  } = e, {
    width: d,
    height: p
  } = n.found ? n : t, b = sO.includes(r), m = [ne.replacementClass, o ? "".concat(ne.cssPrefix, "-").concat(o) : ""].filter((h) => u.classes.indexOf(h) === -1).filter((h) => h !== "" || !!h).concat(u.classes).join(" ");
  let g = {
    children: [],
    attributes: B(B({}, u.attributes), {}, {
      "data-prefix": r,
      "data-icon": o,
      class: m,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(d, " ").concat(p)
    })
  };
  const v = b && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(d / p * 16 * 0.0625, "em")
  } : {};
  f && (g.attributes[mr] = ""), s && (g.children.push({
    tag: "title",
    attributes: {
      id: g.attributes["aria-labelledby"] || "title-".concat(c || ia())
    },
    children: [s]
  }), delete g.attributes.title);
  const k = B(B({}, g), {}, {
    prefix: r,
    iconName: o,
    main: t,
    mask: n,
    maskId: l,
    transform: a,
    symbol: i,
    styles: B(B({}, v), u.styles)
  }), {
    children: x,
    attributes: O
  } = n.found && t.found ? Yn("generateAbstractMask", k) || {
    children: [],
    attributes: {}
  } : Yn("generateAbstractIcon", k) || {
    children: [],
    attributes: {}
  };
  return k.children = x, k.attributes = O, i ? sS(k) : iS(k);
}
function Ip(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: o,
    title: a,
    extra: i,
    watchable: s = !1
  } = e, l = B(B(B({}, i.attributes), a ? {
    title: a
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (l[mr] = "");
  const c = B({}, i.styles);
  Af(o) && (c.transform = jO({
    transform: o,
    startCentered: !0,
    width: n,
    height: r
  }), c["-webkit-transform"] = c.transform);
  const u = is(c);
  u.length > 0 && (l.style = u);
  const f = [];
  return f.push({
    tag: "span",
    attributes: l,
    children: [t]
  }), a && f.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [a]
  }), f;
}
function lS(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, o = B(B(B({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), a = is(r.styles);
  a.length > 0 && (o.style = a);
  const i = [];
  return i.push({
    tag: "span",
    attributes: o,
    children: [t]
  }), n && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [n]
  }), i;
}
const {
  styles: Js
} = Ut;
function _c(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let o = null;
  return Array.isArray(r) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(ne.cssPrefix, "-").concat(Ks.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(ne.cssPrefix, "-").concat(Ks.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(ne.cssPrefix, "-").concat(Ks.PRIMARY),
        fill: "currentColor",
        d: r[1]
      }
    }]
  } : o = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: r
    }
  }, {
    found: !0,
    width: t,
    height: n,
    icon: o
  };
}
const cS = {
  found: !1,
  width: 512,
  height: 512
};
function uS(e, t) {
  !Sy && !ne.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Fc(e, t) {
  let n = t;
  return t === "fa" && ne.styleDefault !== null && (t = Un()), new Promise((r, o) => {
    if (n === "fa") {
      const a = zy(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && Js[t] && Js[t][e]) {
      const a = Js[t][e];
      return r(_c(a));
    }
    uS(e, t), r(B(B({}, cS), {}, {
      icon: ne.showMissingIcons && e ? Yn("missingIconAbstract") || {} : {}
    }));
  });
}
const Tp = () => {
}, Lc = ne.measurePerformance && Ya && Ya.mark && Ya.measure ? Ya : {
  mark: Tp,
  measure: Tp
}, _o = 'FA "6.7.2"', fS = (e) => (Lc.mark("".concat(_o, " ").concat(e, " begins")), () => Hy(e)), Hy = (e) => {
  Lc.mark("".concat(_o, " ").concat(e, " ends")), Lc.measure("".concat(_o, " ").concat(e), "".concat(_o, " ").concat(e, " begins"), "".concat(_o, " ").concat(e, " ends"));
};
var If = {
  begin: fS,
  end: Hy
};
const fi = () => {
};
function Mp(e) {
  return typeof (e.getAttribute ? e.getAttribute(mr) : null) == "string";
}
function dS(e) {
  const t = e.getAttribute ? e.getAttribute(Ef) : null, n = e.getAttribute ? e.getAttribute(Of) : null;
  return t && n;
}
function pS(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(ne.replacementClass);
}
function mS() {
  return ne.autoReplaceSvg === !0 ? di.replace : di[ne.autoReplaceSvg] || di.replace;
}
function gS(e) {
  return We.createElementNS("http://www.w3.org/2000/svg", e);
}
function hS(e) {
  return We.createElement(e);
}
function Uy(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? gS : hS
  } = t;
  if (typeof e == "string")
    return We.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(a) {
    r.setAttribute(a, e.attributes[a]);
  }), (e.children || []).forEach(function(a) {
    r.appendChild(Uy(a, {
      ceFn: n
    }));
  }), r;
}
function bS(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const di = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(Uy(n), t);
      }), t.getAttribute(mr) === null && ne.keepOriginalSource) {
        let n = We.createComment(bS(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~Pf(t).indexOf(ne.replacementClass))
      return di.replace(e);
    const r = new RegExp("".concat(ne.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const a = n[0].attributes.class.split(" ").reduce((i, s) => (s === ne.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = n.map((a) => Na(a)).join(`
`);
    t.setAttribute(mr, ""), t.innerHTML = o;
  }
};
function Rp(e) {
  e();
}
function Yy(e, t) {
  const n = typeof t == "function" ? t : fi;
  if (e.length === 0)
    n();
  else {
    let r = Rp;
    ne.mutateApproach === xO && (r = Hn.requestAnimationFrame || Rp), r(() => {
      const o = mS(), a = If.begin("mutate");
      e.map(o), a(), n();
    });
  }
}
let Tf = !1;
function By() {
  Tf = !0;
}
function Dc() {
  Tf = !1;
}
let Ti = null;
function jp(e) {
  if (!wp || !ne.observeMutations)
    return;
  const {
    treeCallback: t = fi,
    nodeCallback: n = fi,
    pseudoElementsCallback: r = fi,
    observeMutationsRoot: o = We
  } = e;
  Ti = new wp((a) => {
    if (Tf) return;
    const i = Un();
    fo(a).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Mp(s.addedNodes[0]) && (ne.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && ne.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && Mp(s.target) && ~PO.indexOf(s.attributeName))
        if (s.attributeName === "class" && dS(s.target)) {
          const {
            prefix: l,
            iconName: c
          } = ls(Pf(s.target));
          s.target.setAttribute(Ef, l || i), c && s.target.setAttribute(Of, c);
        } else pS(s.target) && n(s.target);
    });
  }), bn && Ti.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function yS() {
  Ti && Ti.disconnect();
}
function vS(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, o) => {
    const a = o.split(":"), i = a[0], s = a.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function xS(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = ls(Pf(e));
  return o.prefix || (o.prefix = Un()), t && n && (o.prefix = t, o.iconName = n), o.iconName && o.prefix || (o.prefix && r.length > 0 && (o.iconName = YO(o.prefix, e.innerText) || $f(o.prefix, Tc(e.innerText))), !o.iconName && ne.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function wS(e) {
  const t = fo(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return ne.autoA11y && (n ? t["aria-labelledby"] = "".concat(ne.replacementClass, "-title-").concat(r || ia()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function kS() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: Ht,
    symbol: !1,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    extra: {
      classes: [],
      styles: {},
      attributes: {}
    }
  };
}
function _p(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: o
  } = xS(e), a = wS(e), i = Rc("parseNodeAttributes", {}, e);
  let s = t.styleParser ? vS(e) : [];
  return B({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: Ht,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: o,
      styles: s,
      attributes: a
    }
  }, i);
}
const {
  styles: ES
} = Ut;
function Gy(e) {
  const t = ne.autoReplaceSvg === "nest" ? _p(e, {
    styleParser: !1
  }) : _p(e);
  return ~t.extra.classes.indexOf(Ay) ? Yn("generateLayersText", e, t) : Yn("generateSvgReplacementMutation", e, t);
}
function OS() {
  return [...oO, ...Pc];
}
function Fp(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!bn) return Promise.resolve();
  const n = We.documentElement.classList, r = (u) => n.add("".concat(Op, "-").concat(u)), o = (u) => n.remove("".concat(Op, "-").concat(u)), a = ne.autoFetchSvg ? OS() : xy.concat(Object.keys(ES));
  a.includes("fa") || a.push("fa");
  const i = [".".concat(Ay, ":not([").concat(mr, "])")].concat(a.map((u) => ".".concat(u, ":not([").concat(mr, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = fo(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), o("complete");
  else
    return Promise.resolve();
  const l = If.begin("onTree"), c = s.reduce((u, f) => {
    try {
      const d = Gy(f);
      d && u.push(d);
    } catch (d) {
      Sy || d.name === "MissingIcon" && console.error(d);
    }
    return u;
  }, []);
  return new Promise((u, f) => {
    Promise.all(c).then((d) => {
      Yy(d, () => {
        r("active"), r("complete"), o("pending"), typeof t == "function" && t(), l(), u();
      });
    }).catch((d) => {
      l(), f(d);
    });
  });
}
function SS(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  Gy(e).then((n) => {
    n && Yy([n], t);
  });
}
function PS(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : jc(t || {});
    let {
      mask: o
    } = n;
    return o && (o = (o || {}).icon ? o : jc(o || {})), e(r, B(B({}, n), {}, {
      mask: o
    }));
  };
}
const AS = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = Ht,
    symbol: r = !1,
    mask: o = null,
    maskId: a = null,
    title: i = null,
    titleId: s = null,
    classes: l = [],
    attributes: c = {},
    styles: u = {}
  } = t;
  if (!e) return;
  const {
    prefix: f,
    iconName: d,
    icon: p
  } = e;
  return cs(B({
    type: "icon"
  }, e), () => (gr("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), ne.autoA11y && (i ? c["aria-labelledby"] = "".concat(ne.replacementClass, "-title-").concat(s || ia()) : (c["aria-hidden"] = "true", c.focusable = "false")), Nf({
    icons: {
      main: _c(p),
      mask: o ? _c(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: f,
    iconName: d,
    transform: B(B({}, Ht), n),
    symbol: r,
    title: i,
    maskId: a,
    titleId: s,
    extra: {
      attributes: c,
      styles: u,
      classes: l
    }
  })));
};
var CS = {
  mixout() {
    return {
      icon: PS(AS)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Fp, e.nodeCallback = SS, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = We,
        callback: r = () => {
        }
      } = t;
      return Fp(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: o,
        titleId: a,
        prefix: i,
        transform: s,
        symbol: l,
        mask: c,
        maskId: u,
        extra: f
      } = n;
      return new Promise((d, p) => {
        Promise.all([Fc(r, i), c.iconName ? Fc(c.iconName, c.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((b) => {
          let [m, g] = b;
          d([t, Nf({
            icons: {
              main: m,
              mask: g
            },
            prefix: i,
            iconName: r,
            transform: s,
            symbol: l,
            maskId: u,
            title: o,
            titleId: a,
            extra: f,
            watchable: !0
          })]);
        }).catch(p);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: o,
        transform: a,
        styles: i
      } = t;
      const s = is(i);
      s.length > 0 && (r.style = s);
      let l;
      return Af(a) && (l = Yn("generateAbstractTransformGrouping", {
        main: o,
        transform: a,
        containerWidth: o.width,
        iconWidth: o.width
      })), n.push(l || o.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, $S = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return cs({
          type: "layer"
        }, () => {
          gr("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let r = [];
          return e((o) => {
            Array.isArray(o) ? o.map((a) => {
              r = r.concat(a.abstract);
            }) : r = r.concat(o.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(ne.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, NS = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: n = null,
          classes: r = [],
          attributes: o = {},
          styles: a = {}
        } = t;
        return cs({
          type: "counter",
          content: e
        }, () => (gr("beforeDOMElementCreation", {
          content: e,
          params: t
        }), lS({
          content: e.toString(),
          title: n,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(ne.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, IS = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = Ht,
          title: r = null,
          classes: o = [],
          attributes: a = {},
          styles: i = {}
        } = t;
        return cs({
          type: "text",
          content: e
        }, () => (gr("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Ip({
          content: e,
          transform: B(B({}, Ht), n),
          title: r,
          extra: {
            attributes: a,
            styles: i,
            classes: ["".concat(ne.cssPrefix, "-layers-text"), ...o]
          }
        })));
      }
    };
  },
  provides(e) {
    e.generateLayersText = function(t, n) {
      const {
        title: r,
        transform: o,
        extra: a
      } = n;
      let i = null, s = null;
      if (yy) {
        const l = parseInt(getComputedStyle(t).fontSize, 10), c = t.getBoundingClientRect();
        i = c.width / l, s = c.height / l;
      }
      return ne.autoA11y && !r && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, Ip({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: o,
        title: r,
        extra: a,
        watchable: !0
      })]);
    };
  }
};
const TS = new RegExp('"', "ug"), Lp = [1105920, 1112319], Dp = B(B(B(B({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), tO), yO), fO), zc = Object.keys(Dp).reduce((e, t) => (e[t.toLowerCase()] = Dp[t], e), {}), MS = Object.keys(zc).reduce((e, t) => {
  const n = zc[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function RS(e) {
  const t = e.replace(TS, ""), n = zO(t, 0), r = n >= Lp[0] && n <= Lp[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: Tc(o ? t[0] : t),
    isSecondary: r || o
  };
}
function jS(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), o = isNaN(r) ? "normal" : r;
  return (zc[n] || {})[o] || MS[n];
}
function zp(e, t) {
  const n = "".concat(vO).concat(t.replace(":", "-"));
  return new Promise((r, o) => {
    if (e.getAttribute(n) !== null)
      return r();
    const i = fo(e.children).filter((d) => d.getAttribute(Cc) === t)[0], s = Hn.getComputedStyle(e, t), l = s.getPropertyValue("font-family"), c = l.match(OO), u = s.getPropertyValue("font-weight"), f = s.getPropertyValue("content");
    if (i && !c)
      return e.removeChild(i), r();
    if (c && f !== "none" && f !== "") {
      const d = s.getPropertyValue("content");
      let p = jS(l, u);
      const {
        value: b,
        isSecondary: m
      } = RS(d), g = c[0].startsWith("FontAwesome");
      let v = $f(p, b), k = v;
      if (g) {
        const x = BO(b);
        x.iconName && x.prefix && (v = x.iconName, p = x.prefix);
      }
      if (v && !m && (!i || i.getAttribute(Ef) !== p || i.getAttribute(Of) !== k)) {
        e.setAttribute(n, k), i && e.removeChild(i);
        const x = kS(), {
          extra: O
        } = x;
        O.attributes[Cc] = t, Fc(v, p).then((h) => {
          const L = Nf(B(B({}, x), {}, {
            icons: {
              main: h,
              mask: Wy()
            },
            prefix: p,
            iconName: k,
            extra: O,
            watchable: !0
          })), _ = We.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(_, e.firstChild) : e.appendChild(_), _.outerHTML = L.map((H) => Na(H)).join(`
`), e.removeAttribute(n), r();
        }).catch(o);
      } else
        r();
    } else
      r();
  });
}
function _S(e) {
  return Promise.all([zp(e, "::before"), zp(e, "::after")]);
}
function FS(e) {
  return e.parentNode !== document.head && !~wO.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Cc) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Wp(e) {
  if (bn)
    return new Promise((t, n) => {
      const r = fo(e.querySelectorAll("*")).filter(FS).map(_S), o = If.begin("searchPseudoElements");
      By(), Promise.all(r).then(() => {
        o(), Dc(), t();
      }).catch(() => {
        o(), Dc(), n();
      });
    });
}
var LS = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Wp, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = We
      } = t;
      ne.searchPseudoElements && Wp(n);
    };
  }
};
let Vp = !1;
var DS = {
  mixout() {
    return {
      dom: {
        unwatch() {
          By(), Vp = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        jp(Rc("mutationObserverCallbacks", {}));
      },
      noAuto() {
        yS();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Vp ? Dc() : jp(Rc("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Hp = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((n, r) => {
    const o = r.toLowerCase().split("-"), a = o[0];
    let i = o.slice(1).join("-");
    if (a && i === "h")
      return n.flipX = !0, n;
    if (a && i === "v")
      return n.flipY = !0, n;
    if (i = parseFloat(i), isNaN(i))
      return n;
    switch (a) {
      case "grow":
        n.size = n.size + i;
        break;
      case "shrink":
        n.size = n.size - i;
        break;
      case "left":
        n.x = n.x - i;
        break;
      case "right":
        n.x = n.x + i;
        break;
      case "up":
        n.y = n.y - i;
        break;
      case "down":
        n.y = n.y + i;
        break;
      case "rotate":
        n.rotate = n.rotate + i;
        break;
    }
    return n;
  }, t);
};
var zS = {
  mixout() {
    return {
      parse: {
        transform: (e) => Hp(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = Hp(n)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: n,
        transform: r,
        containerWidth: o,
        iconWidth: a
      } = t;
      const i = {
        transform: "translate(".concat(o / 2, " 256)")
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), l = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), c = "rotate(".concat(r.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(l, " ").concat(c)
      }, f = {
        transform: "translate(".concat(a / 2 * -1, " -256)")
      }, d = {
        outer: i,
        inner: u,
        path: f
      };
      return {
        tag: "g",
        attributes: B({}, d.outer),
        children: [{
          tag: "g",
          attributes: B({}, d.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: B(B({}, n.icon.attributes), d.path)
          }]
        }]
      };
    };
  }
};
const Zs = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Up(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function WS(e) {
  return e.tag === "g" ? e.children : [e];
}
var VS = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? ls(n.split(" ").map((o) => o.trim())) : Wy();
        return r.prefix || (r.prefix = Un()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: n,
        attributes: r,
        main: o,
        mask: a,
        maskId: i,
        transform: s
      } = t;
      const {
        width: l,
        icon: c
      } = o, {
        width: u,
        icon: f
      } = a, d = RO({
        transform: s,
        containerWidth: u,
        iconWidth: l
      }), p = {
        tag: "rect",
        attributes: B(B({}, Zs), {}, {
          fill: "white"
        })
      }, b = c.children ? {
        children: c.children.map(Up)
      } : {}, m = {
        tag: "g",
        attributes: B({}, d.inner),
        children: [Up(B({
          tag: c.tag,
          attributes: B(B({}, c.attributes), d.path)
        }, b))]
      }, g = {
        tag: "g",
        attributes: B({}, d.outer),
        children: [m]
      }, v = "mask-".concat(i || ia()), k = "clip-".concat(i || ia()), x = {
        tag: "mask",
        attributes: B(B({}, Zs), {}, {
          id: v,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [p, g]
      }, O = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: k
          },
          children: WS(f)
        }, x]
      };
      return n.push(O, {
        tag: "rect",
        attributes: B({
          fill: "currentColor",
          "clip-path": "url(#".concat(k, ")"),
          mask: "url(#".concat(v, ")")
        }, Zs)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, HS = {
  provides(e) {
    let t = !1;
    Hn.matchMedia && (t = Hn.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: B(B({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = B(B({}, o), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: B(B({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: B(B({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: B(B({}, a), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(i), n.push({
        tag: "path",
        attributes: B(B({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: B(B({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: B(B({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: B(B({}, a), {}, {
            values: "0;0;1;1;0;0;"
          })
        }]
      }), {
        tag: "g",
        attributes: {
          class: "missing"
        },
        children: n
      };
    };
  }
}, US = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, YS = [FO, CS, $S, NS, IS, LS, DS, zS, VS, HS, US];
tS(YS, {
  mixoutsTo: ht
});
ht.noAuto;
ht.config;
ht.library;
ht.dom;
const Wc = ht.parse;
ht.findIconDefinition;
ht.toHtml;
const BS = ht.icon;
ht.layer;
ht.text;
ht.counter;
var Ga = { exports: {} }, qa = { exports: {} }, Oe = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Yp;
function GS() {
  if (Yp) return Oe;
  Yp = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, b = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, g = e ? Symbol.for("react.fundamental") : 60117, v = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
  function x(h) {
    if (typeof h == "object" && h !== null) {
      var L = h.$$typeof;
      switch (L) {
        case t:
          switch (h = h.type, h) {
            case l:
            case c:
            case r:
            case a:
            case o:
            case f:
              return h;
            default:
              switch (h = h && h.$$typeof, h) {
                case s:
                case u:
                case b:
                case p:
                case i:
                  return h;
                default:
                  return L;
              }
          }
        case n:
          return L;
      }
    }
  }
  function O(h) {
    return x(h) === c;
  }
  return Oe.AsyncMode = l, Oe.ConcurrentMode = c, Oe.ContextConsumer = s, Oe.ContextProvider = i, Oe.Element = t, Oe.ForwardRef = u, Oe.Fragment = r, Oe.Lazy = b, Oe.Memo = p, Oe.Portal = n, Oe.Profiler = a, Oe.StrictMode = o, Oe.Suspense = f, Oe.isAsyncMode = function(h) {
    return O(h) || x(h) === l;
  }, Oe.isConcurrentMode = O, Oe.isContextConsumer = function(h) {
    return x(h) === s;
  }, Oe.isContextProvider = function(h) {
    return x(h) === i;
  }, Oe.isElement = function(h) {
    return typeof h == "object" && h !== null && h.$$typeof === t;
  }, Oe.isForwardRef = function(h) {
    return x(h) === u;
  }, Oe.isFragment = function(h) {
    return x(h) === r;
  }, Oe.isLazy = function(h) {
    return x(h) === b;
  }, Oe.isMemo = function(h) {
    return x(h) === p;
  }, Oe.isPortal = function(h) {
    return x(h) === n;
  }, Oe.isProfiler = function(h) {
    return x(h) === a;
  }, Oe.isStrictMode = function(h) {
    return x(h) === o;
  }, Oe.isSuspense = function(h) {
    return x(h) === f;
  }, Oe.isValidElementType = function(h) {
    return typeof h == "string" || typeof h == "function" || h === r || h === c || h === a || h === o || h === f || h === d || typeof h == "object" && h !== null && (h.$$typeof === b || h.$$typeof === p || h.$$typeof === i || h.$$typeof === s || h.$$typeof === u || h.$$typeof === g || h.$$typeof === v || h.$$typeof === k || h.$$typeof === m);
  }, Oe.typeOf = x, Oe;
}
var Se = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Bp;
function qS() {
  return Bp || (Bp = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, b = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, g = e ? Symbol.for("react.fundamental") : 60117, v = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
    function x(E) {
      return typeof E == "string" || typeof E == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      E === r || E === c || E === a || E === o || E === f || E === d || typeof E == "object" && E !== null && (E.$$typeof === b || E.$$typeof === p || E.$$typeof === i || E.$$typeof === s || E.$$typeof === u || E.$$typeof === g || E.$$typeof === v || E.$$typeof === k || E.$$typeof === m);
    }
    function O(E) {
      if (typeof E == "object" && E !== null) {
        var ue = E.$$typeof;
        switch (ue) {
          case t:
            var Me = E.type;
            switch (Me) {
              case l:
              case c:
              case r:
              case a:
              case o:
              case f:
                return Me;
              default:
                var it = Me && Me.$$typeof;
                switch (it) {
                  case s:
                  case u:
                  case b:
                  case p:
                  case i:
                    return it;
                  default:
                    return ue;
                }
            }
          case n:
            return ue;
        }
      }
    }
    var h = l, L = c, _ = s, H = i, J = t, Z = u, U = r, T = b, te = p, W = n, j = a, D = o, Q = f, V = !1;
    function z(E) {
      return V || (V = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), y(E) || O(E) === l;
    }
    function y(E) {
      return O(E) === c;
    }
    function w(E) {
      return O(E) === s;
    }
    function C(E) {
      return O(E) === i;
    }
    function A(E) {
      return typeof E == "object" && E !== null && E.$$typeof === t;
    }
    function P(E) {
      return O(E) === u;
    }
    function I(E) {
      return O(E) === r;
    }
    function N(E) {
      return O(E) === b;
    }
    function $(E) {
      return O(E) === p;
    }
    function R(E) {
      return O(E) === n;
    }
    function M(E) {
      return O(E) === a;
    }
    function F(E) {
      return O(E) === o;
    }
    function ee(E) {
      return O(E) === f;
    }
    Se.AsyncMode = h, Se.ConcurrentMode = L, Se.ContextConsumer = _, Se.ContextProvider = H, Se.Element = J, Se.ForwardRef = Z, Se.Fragment = U, Se.Lazy = T, Se.Memo = te, Se.Portal = W, Se.Profiler = j, Se.StrictMode = D, Se.Suspense = Q, Se.isAsyncMode = z, Se.isConcurrentMode = y, Se.isContextConsumer = w, Se.isContextProvider = C, Se.isElement = A, Se.isForwardRef = P, Se.isFragment = I, Se.isLazy = N, Se.isMemo = $, Se.isPortal = R, Se.isProfiler = M, Se.isStrictMode = F, Se.isSuspense = ee, Se.isValidElementType = x, Se.typeOf = O;
  }()), Se;
}
var Gp;
function qy() {
  return Gp || (Gp = 1, process.env.NODE_ENV === "production" ? qa.exports = GS() : qa.exports = qS()), qa.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var el, qp;
function KS() {
  if (qp) return el;
  qp = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, n = Object.prototype.propertyIsEnumerable;
  function r(a) {
    if (a == null)
      throw new TypeError("Object.assign cannot be called with null or undefined");
    return Object(a);
  }
  function o() {
    try {
      if (!Object.assign)
        return !1;
      var a = new String("abc");
      if (a[5] = "de", Object.getOwnPropertyNames(a)[0] === "5")
        return !1;
      for (var i = {}, s = 0; s < 10; s++)
        i["_" + String.fromCharCode(s)] = s;
      var l = Object.getOwnPropertyNames(i).map(function(u) {
        return i[u];
      });
      if (l.join("") !== "0123456789")
        return !1;
      var c = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(u) {
        c[u] = u;
      }), Object.keys(Object.assign({}, c)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return el = o() ? Object.assign : function(a, i) {
    for (var s, l = r(a), c, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var f in s)
        t.call(s, f) && (l[f] = s[f]);
      if (e) {
        c = e(s);
        for (var d = 0; d < c.length; d++)
          n.call(s, c[d]) && (l[c[d]] = s[c[d]]);
      }
    }
    return l;
  }, el;
}
var tl, Kp;
function Mf() {
  if (Kp) return tl;
  Kp = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return tl = e, tl;
}
var nl, Xp;
function Ky() {
  return Xp || (Xp = 1, nl = Function.call.bind(Object.prototype.hasOwnProperty)), nl;
}
var rl, Qp;
function XS() {
  if (Qp) return rl;
  Qp = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ Mf(), n = {}, r = /* @__PURE__ */ Ky();
    e = function(a) {
      var i = "Warning: " + a;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function o(a, i, s, l, c) {
    if (process.env.NODE_ENV !== "production") {
      for (var u in a)
        if (r(a, u)) {
          var f;
          try {
            if (typeof a[u] != "function") {
              var d = Error(
                (l || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw d.name = "Invariant Violation", d;
            }
            f = a[u](i, u, l, s, null, t);
          } catch (b) {
            f = b;
          }
          if (f && !(f instanceof Error) && e(
            (l || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof f + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), f instanceof Error && !(f.message in n)) {
            n[f.message] = !0;
            var p = c ? c() : "";
            e(
              "Failed " + s + " type: " + f.message + (p ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, rl = o, rl;
}
var ol, Jp;
function QS() {
  if (Jp) return ol;
  Jp = 1;
  var e = qy(), t = KS(), n = /* @__PURE__ */ Mf(), r = /* @__PURE__ */ Ky(), o = /* @__PURE__ */ XS(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(s) {
    var l = "Warning: " + s;
    typeof console < "u" && console.error(l);
    try {
      throw new Error(l);
    } catch {
    }
  });
  function i() {
    return null;
  }
  return ol = function(s, l) {
    var c = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function f(y) {
      var w = y && (c && y[c] || y[u]);
      if (typeof w == "function")
        return w;
    }
    var d = "<<anonymous>>", p = {
      array: v("array"),
      bigint: v("bigint"),
      bool: v("boolean"),
      func: v("function"),
      number: v("number"),
      object: v("object"),
      string: v("string"),
      symbol: v("symbol"),
      any: k(),
      arrayOf: x,
      element: O(),
      elementType: h(),
      instanceOf: L,
      node: Z(),
      objectOf: H,
      oneOf: _,
      oneOfType: J,
      shape: T,
      exact: te
    };
    function b(y, w) {
      return y === w ? y !== 0 || 1 / y === 1 / w : y !== y && w !== w;
    }
    function m(y, w) {
      this.message = y, this.data = w && typeof w == "object" ? w : {}, this.stack = "";
    }
    m.prototype = Error.prototype;
    function g(y) {
      if (process.env.NODE_ENV !== "production")
        var w = {}, C = 0;
      function A(I, N, $, R, M, F, ee) {
        if (R = R || d, F = F || $, ee !== n) {
          if (l) {
            var E = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw E.name = "Invariant Violation", E;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ue = R + ":" + $;
            !w[ue] && // Avoid spamming the console because they are often not actionable except for lib authors
            C < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + F + "` prop on `" + R + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), w[ue] = !0, C++);
          }
        }
        return N[$] == null ? I ? N[$] === null ? new m("The " + M + " `" + F + "` is marked as required " + ("in `" + R + "`, but its value is `null`.")) : new m("The " + M + " `" + F + "` is marked as required in " + ("`" + R + "`, but its value is `undefined`.")) : null : y(N, $, R, M, F);
      }
      var P = A.bind(null, !1);
      return P.isRequired = A.bind(null, !0), P;
    }
    function v(y) {
      function w(C, A, P, I, N, $) {
        var R = C[A], M = D(R);
        if (M !== y) {
          var F = Q(R);
          return new m(
            "Invalid " + I + " `" + N + "` of type " + ("`" + F + "` supplied to `" + P + "`, expected ") + ("`" + y + "`."),
            { expectedType: y }
          );
        }
        return null;
      }
      return g(w);
    }
    function k() {
      return g(i);
    }
    function x(y) {
      function w(C, A, P, I, N) {
        if (typeof y != "function")
          return new m("Property `" + N + "` of component `" + P + "` has invalid PropType notation inside arrayOf.");
        var $ = C[A];
        if (!Array.isArray($)) {
          var R = D($);
          return new m("Invalid " + I + " `" + N + "` of type " + ("`" + R + "` supplied to `" + P + "`, expected an array."));
        }
        for (var M = 0; M < $.length; M++) {
          var F = y($, M, P, I, N + "[" + M + "]", n);
          if (F instanceof Error)
            return F;
        }
        return null;
      }
      return g(w);
    }
    function O() {
      function y(w, C, A, P, I) {
        var N = w[C];
        if (!s(N)) {
          var $ = D(N);
          return new m("Invalid " + P + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return g(y);
    }
    function h() {
      function y(w, C, A, P, I) {
        var N = w[C];
        if (!e.isValidElementType(N)) {
          var $ = D(N);
          return new m("Invalid " + P + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return g(y);
    }
    function L(y) {
      function w(C, A, P, I, N) {
        if (!(C[A] instanceof y)) {
          var $ = y.name || d, R = z(C[A]);
          return new m("Invalid " + I + " `" + N + "` of type " + ("`" + R + "` supplied to `" + P + "`, expected ") + ("instance of `" + $ + "`."));
        }
        return null;
      }
      return g(w);
    }
    function _(y) {
      if (!Array.isArray(y))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), i;
      function w(C, A, P, I, N) {
        for (var $ = C[A], R = 0; R < y.length; R++)
          if (b($, y[R]))
            return null;
        var M = JSON.stringify(y, function(ee, E) {
          var ue = Q(E);
          return ue === "symbol" ? String(E) : E;
        });
        return new m("Invalid " + I + " `" + N + "` of value `" + String($) + "` " + ("supplied to `" + P + "`, expected one of " + M + "."));
      }
      return g(w);
    }
    function H(y) {
      function w(C, A, P, I, N) {
        if (typeof y != "function")
          return new m("Property `" + N + "` of component `" + P + "` has invalid PropType notation inside objectOf.");
        var $ = C[A], R = D($);
        if (R !== "object")
          return new m("Invalid " + I + " `" + N + "` of type " + ("`" + R + "` supplied to `" + P + "`, expected an object."));
        for (var M in $)
          if (r($, M)) {
            var F = y($, M, P, I, N + "." + M, n);
            if (F instanceof Error)
              return F;
          }
        return null;
      }
      return g(w);
    }
    function J(y) {
      if (!Array.isArray(y))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var w = 0; w < y.length; w++) {
        var C = y[w];
        if (typeof C != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + V(C) + " at index " + w + "."
          ), i;
      }
      function A(P, I, N, $, R) {
        for (var M = [], F = 0; F < y.length; F++) {
          var ee = y[F], E = ee(P, I, N, $, R, n);
          if (E == null)
            return null;
          E.data && r(E.data, "expectedType") && M.push(E.data.expectedType);
        }
        var ue = M.length > 0 ? ", expected one of type [" + M.join(", ") + "]" : "";
        return new m("Invalid " + $ + " `" + R + "` supplied to " + ("`" + N + "`" + ue + "."));
      }
      return g(A);
    }
    function Z() {
      function y(w, C, A, P, I) {
        return W(w[C]) ? null : new m("Invalid " + P + " `" + I + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return g(y);
    }
    function U(y, w, C, A, P) {
      return new m(
        (y || "React class") + ": " + w + " type `" + C + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + P + "`."
      );
    }
    function T(y) {
      function w(C, A, P, I, N) {
        var $ = C[A], R = D($);
        if (R !== "object")
          return new m("Invalid " + I + " `" + N + "` of type `" + R + "` " + ("supplied to `" + P + "`, expected `object`."));
        for (var M in y) {
          var F = y[M];
          if (typeof F != "function")
            return U(P, I, N, M, Q(F));
          var ee = F($, M, P, I, N + "." + M, n);
          if (ee)
            return ee;
        }
        return null;
      }
      return g(w);
    }
    function te(y) {
      function w(C, A, P, I, N) {
        var $ = C[A], R = D($);
        if (R !== "object")
          return new m("Invalid " + I + " `" + N + "` of type `" + R + "` " + ("supplied to `" + P + "`, expected `object`."));
        var M = t({}, C[A], y);
        for (var F in M) {
          var ee = y[F];
          if (r(y, F) && typeof ee != "function")
            return U(P, I, N, F, Q(ee));
          if (!ee)
            return new m(
              "Invalid " + I + " `" + N + "` key `" + F + "` supplied to `" + P + "`.\nBad object: " + JSON.stringify(C[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(y), null, "  ")
            );
          var E = ee($, F, P, I, N + "." + F, n);
          if (E)
            return E;
        }
        return null;
      }
      return g(w);
    }
    function W(y) {
      switch (typeof y) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !y;
        case "object":
          if (Array.isArray(y))
            return y.every(W);
          if (y === null || s(y))
            return !0;
          var w = f(y);
          if (w) {
            var C = w.call(y), A;
            if (w !== y.entries) {
              for (; !(A = C.next()).done; )
                if (!W(A.value))
                  return !1;
            } else
              for (; !(A = C.next()).done; ) {
                var P = A.value;
                if (P && !W(P[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function j(y, w) {
      return y === "symbol" ? !0 : w ? w["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && w instanceof Symbol : !1;
    }
    function D(y) {
      var w = typeof y;
      return Array.isArray(y) ? "array" : y instanceof RegExp ? "object" : j(w, y) ? "symbol" : w;
    }
    function Q(y) {
      if (typeof y > "u" || y === null)
        return "" + y;
      var w = D(y);
      if (w === "object") {
        if (y instanceof Date)
          return "date";
        if (y instanceof RegExp)
          return "regexp";
      }
      return w;
    }
    function V(y) {
      var w = Q(y);
      switch (w) {
        case "array":
        case "object":
          return "an " + w;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + w;
        default:
          return w;
      }
    }
    function z(y) {
      return !y.constructor || !y.constructor.name ? d : y.constructor.name;
    }
    return p.checkPropTypes = o, p.resetWarningCache = o.resetWarningCache, p.PropTypes = p, p;
  }, ol;
}
var al, Zp;
function JS() {
  if (Zp) return al;
  Zp = 1;
  var e = /* @__PURE__ */ Mf();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, al = function() {
    function r(i, s, l, c, u, f) {
      if (f !== e) {
        var d = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw d.name = "Invariant Violation", d;
      }
    }
    r.isRequired = r;
    function o() {
      return r;
    }
    var a = {
      array: r,
      bigint: r,
      bool: r,
      func: r,
      number: r,
      object: r,
      string: r,
      symbol: r,
      any: r,
      arrayOf: o,
      element: r,
      elementType: r,
      instanceOf: o,
      node: r,
      objectOf: o,
      oneOf: o,
      oneOfType: o,
      shape: o,
      exact: o,
      checkPropTypes: n,
      resetWarningCache: t
    };
    return a.PropTypes = a, a;
  }, al;
}
var em;
function ZS() {
  if (em) return Ga.exports;
  if (em = 1, process.env.NODE_ENV !== "production") {
    var e = qy(), t = !0;
    Ga.exports = /* @__PURE__ */ QS()(e.isElement, t);
  } else
    Ga.exports = /* @__PURE__ */ JS()();
  return Ga.exports;
}
var e5 = /* @__PURE__ */ ZS();
const he = /* @__PURE__ */ zk(e5);
function tm(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function Lt(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? tm(Object(n), !0).forEach(function(r) {
      Rr(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : tm(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Mi(e) {
  "@babel/helpers - typeof";
  return Mi = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Mi(e);
}
function Rr(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function t5(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), o, a;
  for (a = 0; a < r.length; a++)
    o = r[a], !(t.indexOf(o) >= 0) && (n[o] = e[o]);
  return n;
}
function n5(e, t) {
  if (e == null) return {};
  var n = t5(e, t), r, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      r = a[o], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Vc(e) {
  return r5(e) || o5(e) || a5(e) || i5();
}
function r5(e) {
  if (Array.isArray(e)) return Hc(e);
}
function o5(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function a5(e, t) {
  if (e) {
    if (typeof e == "string") return Hc(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return Hc(e, t);
  }
}
function Hc(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function i5() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function s5(e) {
  var t, n = e.beat, r = e.fade, o = e.beatFade, a = e.bounce, i = e.shake, s = e.flash, l = e.spin, c = e.spinPulse, u = e.spinReverse, f = e.pulse, d = e.fixedWidth, p = e.inverse, b = e.border, m = e.listItem, g = e.flip, v = e.size, k = e.rotation, x = e.pull, O = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": o,
    "fa-bounce": a,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": l,
    "fa-spin-reverse": u,
    "fa-spin-pulse": c,
    "fa-pulse": f,
    "fa-fw": d,
    "fa-inverse": p,
    "fa-border": b,
    "fa-li": m,
    "fa-flip": g === !0,
    "fa-flip-horizontal": g === "horizontal" || g === "both",
    "fa-flip-vertical": g === "vertical" || g === "both"
  }, Rr(t, "fa-".concat(v), typeof v < "u" && v !== null), Rr(t, "fa-rotate-".concat(k), typeof k < "u" && k !== null && k !== 0), Rr(t, "fa-pull-".concat(x), typeof x < "u" && x !== null), Rr(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(O).map(function(h) {
    return O[h] ? h : null;
  }).filter(function(h) {
    return h;
  });
}
function l5(e) {
  return e = e - 0, e === e;
}
function Xy(e) {
  return l5(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var c5 = ["style"];
function u5(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function f5(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), o = Xy(n.slice(0, r)), a = n.slice(r + 1).trim();
    return o.startsWith("webkit") ? t[u5(o)] = a : t[o] = a, t;
  }, {});
}
function Qy(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(l) {
    return Qy(e, l);
  }), o = Object.keys(t.attributes || {}).reduce(function(l, c) {
    var u = t.attributes[c];
    switch (c) {
      case "class":
        l.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        l.attrs.style = f5(u);
        break;
      default:
        c.indexOf("aria-") === 0 || c.indexOf("data-") === 0 ? l.attrs[c.toLowerCase()] = u : l.attrs[Xy(c)] = u;
    }
    return l;
  }, {
    attrs: {}
  }), a = n.style, i = a === void 0 ? {} : a, s = n5(n, c5);
  return o.attrs.style = Lt(Lt({}, o.attrs.style), i), e.apply(void 0, [t.tag, Lt(Lt({}, o.attrs), s)].concat(Vc(r)));
}
var Jy = !1;
try {
  Jy = process.env.NODE_ENV === "production";
} catch {
}
function d5() {
  if (!Jy && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function nm(e) {
  if (e && Mi(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Wc.icon)
    return Wc.icon(e);
  if (e === null)
    return null;
  if (e && Mi(e) === "object" && e.prefix && e.iconName)
    return e;
  if (Array.isArray(e) && e.length === 2)
    return {
      prefix: e[0],
      iconName: e[1]
    };
  if (typeof e == "string")
    return {
      prefix: "fas",
      iconName: e
    };
}
function il(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Rr({}, e, t) : {};
}
var rm = {
  border: !1,
  className: "",
  mask: null,
  maskId: null,
  fixedWidth: !1,
  inverse: !1,
  flip: !1,
  icon: null,
  listItem: !1,
  pull: null,
  pulse: !1,
  rotation: null,
  size: null,
  spin: !1,
  spinPulse: !1,
  spinReverse: !1,
  beat: !1,
  fade: !1,
  beatFade: !1,
  bounce: !1,
  shake: !1,
  symbol: !1,
  title: "",
  titleId: null,
  transform: null,
  swapOpacity: !1
}, Ri = /* @__PURE__ */ ke.forwardRef(function(e, t) {
  var n = Lt(Lt({}, rm), e), r = n.icon, o = n.mask, a = n.symbol, i = n.className, s = n.title, l = n.titleId, c = n.maskId, u = nm(r), f = il("classes", [].concat(Vc(s5(n)), Vc((i || "").split(" ")))), d = il("transform", typeof n.transform == "string" ? Wc.transform(n.transform) : n.transform), p = il("mask", nm(o)), b = BS(u, Lt(Lt(Lt(Lt({}, f), d), p), {}, {
    symbol: a,
    title: s,
    titleId: l,
    maskId: c
  }));
  if (!b)
    return d5("Could not find icon", u), null;
  var m = b.abstract, g = {
    ref: t
  };
  return Object.keys(n).forEach(function(v) {
    rm.hasOwnProperty(v) || (g[v] = n[v]);
  }), p5(m[0], g);
});
Ri.displayName = "FontAwesomeIcon";
Ri.propTypes = {
  beat: he.bool,
  border: he.bool,
  beatFade: he.bool,
  bounce: he.bool,
  className: he.string,
  fade: he.bool,
  flash: he.bool,
  mask: he.oneOfType([he.object, he.array, he.string]),
  maskId: he.string,
  fixedWidth: he.bool,
  inverse: he.bool,
  flip: he.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: he.oneOfType([he.object, he.array, he.string]),
  listItem: he.bool,
  pull: he.oneOf(["right", "left"]),
  pulse: he.bool,
  rotation: he.oneOf([0, 90, 180, 270]),
  shake: he.bool,
  size: he.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: he.bool,
  spinPulse: he.bool,
  spinReverse: he.bool,
  symbol: he.oneOfType([he.bool, he.string]),
  title: he.string,
  titleId: he.string,
  transform: he.oneOfType([he.string, he.object]),
  swapOpacity: he.bool
};
var p5 = Qy.bind(null, ke.createElement);
function Dn(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
  return function(r) {
    if (e == null || e(r), n === !1 || !r.defaultPrevented)
      return t == null ? void 0 : t(r);
  };
}
function om(e, t) {
  if (typeof e == "function")
    return e(t);
  e != null && (e.current = t);
}
function Zy(...e) {
  return (t) => {
    let n = !1;
    const r = e.map((o) => {
      const a = om(o, t);
      return !n && typeof a == "function" && (n = !0), a;
    });
    if (n)
      return () => {
        for (let o = 0; o < r.length; o++) {
          const a = r[o];
          typeof a == "function" ? a() : om(e[o], null);
        }
      };
  };
}
function Pr(...e) {
  return S.useCallback(Zy(...e), e);
}
function m5(e, t) {
  const n = S.createContext(t), r = (a) => {
    const { children: i, ...s } = a, l = S.useMemo(() => s, Object.values(s));
    return /* @__PURE__ */ Y(n.Provider, { value: l, children: i });
  };
  r.displayName = e + "Provider";
  function o(a) {
    const i = S.useContext(n);
    if (i) return i;
    if (t !== void 0) return t;
    throw new Error(`\`${a}\` must be used within \`${e}\``);
  }
  return [r, o];
}
function g5(e, t = []) {
  let n = [];
  function r(a, i) {
    const s = S.createContext(i), l = n.length;
    n = [...n, i];
    const c = (f) => {
      var d;
      const { scope: p, children: b, ...m } = f, g = ((d = p == null ? void 0 : p[e]) == null ? void 0 : d[l]) || s, v = S.useMemo(() => m, Object.values(m));
      return /* @__PURE__ */ Y(g.Provider, { value: v, children: b });
    };
    c.displayName = a + "Provider";
    function u(f, d) {
      var p;
      const b = ((p = d == null ? void 0 : d[e]) == null ? void 0 : p[l]) || s, m = S.useContext(b);
      if (m) return m;
      if (i !== void 0) return i;
      throw new Error(`\`${f}\` must be used within \`${a}\``);
    }
    return [c, u];
  }
  const o = () => {
    const a = n.map((i) => S.createContext(i));
    return function(i) {
      const s = (i == null ? void 0 : i[e]) || a;
      return S.useMemo(
        () => ({ [`__scope${e}`]: { ...i, [e]: s } }),
        [i, s]
      );
    };
  };
  return o.scopeName = e, [r, h5(o, ...t)];
}
function h5(...e) {
  const t = e[0];
  if (e.length === 1) return t;
  const n = () => {
    const r = e.map((o) => ({
      useScope: o(),
      scopeName: o.scopeName
    }));
    return function(o) {
      const a = r.reduce((i, { useScope: s, scopeName: l }) => {
        const c = s(o)[`__scope${l}`];
        return { ...i, ...c };
      }, {});
      return S.useMemo(() => ({ [`__scope${t.scopeName}`]: a }), [a]);
    };
  };
  return n.scopeName = t.scopeName, n;
}
var la = globalThis != null && globalThis.document ? S.useLayoutEffect : () => {
}, b5 = S[" useId ".trim().toString()] || (() => {
}), y5 = 0;
function sl(e) {
  const [t, n] = S.useState(b5());
  return la(() => {
    n((r) => r ?? String(y5++));
  }, [e]), e || (t ? `radix-${t}` : "");
}
var v5 = S[" useInsertionEffect ".trim().toString()] || la;
function x5({
  prop: e,
  defaultProp: t,
  onChange: n = () => {
  },
  caller: r
}) {
  const [o, a, i] = w5({
    defaultProp: t,
    onChange: n
  }), s = e !== void 0, l = s ? e : o;
  {
    const u = S.useRef(e !== void 0);
    S.useEffect(() => {
      const f = u.current;
      f !== s && console.warn(
        `${r} is changing from ${f ? "controlled" : "uncontrolled"} to ${s ? "controlled" : "uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
      ), u.current = s;
    }, [s, r]);
  }
  const c = S.useCallback(
    (u) => {
      var f;
      if (s) {
        const d = k5(u) ? u(e) : u;
        d !== e && ((f = i.current) == null || f.call(i, d));
      } else
        a(u);
    },
    [s, e, a, i]
  );
  return [l, c];
}
function w5({
  defaultProp: e,
  onChange: t
}) {
  const [n, r] = S.useState(e), o = S.useRef(n), a = S.useRef(t);
  return v5(() => {
    a.current = t;
  }, [t]), S.useEffect(() => {
    var i;
    o.current !== n && ((i = a.current) == null || i.call(a, n), o.current = n);
  }, [n, o]), [n, r, a];
}
function k5(e) {
  return typeof e == "function";
}
// @__NO_SIDE_EFFECTS__
function ev(e) {
  const t = /* @__PURE__ */ E5(e), n = S.forwardRef((r, o) => {
    const { children: a, ...i } = r, s = S.Children.toArray(a), l = s.find(S5);
    if (l) {
      const c = l.props.children, u = s.map((f) => f === l ? S.Children.count(c) > 1 ? S.Children.only(null) : S.isValidElement(c) ? c.props.children : null : f);
      return /* @__PURE__ */ Y(t, { ...i, ref: o, children: S.isValidElement(c) ? S.cloneElement(c, void 0, u) : null });
    }
    return /* @__PURE__ */ Y(t, { ...i, ref: o, children: a });
  });
  return n.displayName = `${e}.Slot`, n;
}
// @__NO_SIDE_EFFECTS__
function E5(e) {
  const t = S.forwardRef((n, r) => {
    const { children: o, ...a } = n;
    if (S.isValidElement(o)) {
      const i = A5(o), s = P5(a, o.props);
      return o.type !== S.Fragment && (s.ref = r ? Zy(r, i) : i), S.cloneElement(o, s);
    }
    return S.Children.count(o) > 1 ? S.Children.only(null) : null;
  });
  return t.displayName = `${e}.SlotClone`, t;
}
var O5 = Symbol("radix.slottable");
function S5(e) {
  return S.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === O5;
}
function P5(e, t) {
  const n = { ...t };
  for (const r in t) {
    const o = e[r], a = t[r];
    /^on[A-Z]/.test(r) ? o && a ? n[r] = (...i) => {
      const s = a(...i);
      return o(...i), s;
    } : o && (n[r] = o) : r === "style" ? n[r] = { ...o, ...a } : r === "className" && (n[r] = [o, a].filter(Boolean).join(" "));
  }
  return { ...e, ...n };
}
function A5(e) {
  var t, n;
  let r = (t = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : t.get, o = r && "isReactWarning" in r && r.isReactWarning;
  return o ? e.ref : (r = (n = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : n.get, o = r && "isReactWarning" in r && r.isReactWarning, o ? e.props.ref : e.props.ref || e.ref);
}
var C5 = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
], tn = C5.reduce((e, t) => {
  const n = /* @__PURE__ */ ev(`Primitive.${t}`), r = S.forwardRef((o, a) => {
    const { asChild: i, ...s } = o, l = i ? n : t;
    return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ Y(l, { ...s, ref: a });
  });
  return r.displayName = `Primitive.${t}`, { ...e, [t]: r };
}, {});
function $5(e, t) {
  e && na.flushSync(() => e.dispatchEvent(t));
}
function ca(e) {
  const t = S.useRef(e);
  return S.useEffect(() => {
    t.current = e;
  }), S.useMemo(() => (...n) => {
    var r;
    return (r = t.current) == null ? void 0 : r.call(t, ...n);
  }, []);
}
function N5(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = ca(e);
  S.useEffect(() => {
    const r = (o) => {
      o.key === "Escape" && n(o);
    };
    return t.addEventListener("keydown", r, { capture: !0 }), () => t.removeEventListener("keydown", r, { capture: !0 });
  }, [n, t]);
}
var I5 = "DismissableLayer", Uc = "dismissableLayer.update", T5 = "dismissableLayer.pointerDownOutside", M5 = "dismissableLayer.focusOutside", am, tv = S.createContext({
  layers: /* @__PURE__ */ new Set(),
  layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
  branches: /* @__PURE__ */ new Set()
}), nv = S.forwardRef(
  (e, t) => {
    const {
      disableOutsidePointerEvents: n = !1,
      onEscapeKeyDown: r,
      onPointerDownOutside: o,
      onFocusOutside: a,
      onInteractOutside: i,
      onDismiss: s,
      ...l
    } = e, c = S.useContext(tv), [u, f] = S.useState(null), d = (u == null ? void 0 : u.ownerDocument) ?? (globalThis == null ? void 0 : globalThis.document), [, p] = S.useState({}), b = Pr(t, (_) => f(_)), m = Array.from(c.layers), [g] = [...c.layersWithOutsidePointerEventsDisabled].slice(-1), v = m.indexOf(g), k = u ? m.indexOf(u) : -1, x = c.layersWithOutsidePointerEventsDisabled.size > 0, O = k >= v, h = _5((_) => {
      const H = _.target, J = [...c.branches].some((Z) => Z.contains(H));
      !O || J || (o == null || o(_), i == null || i(_), _.defaultPrevented || s == null || s());
    }, d), L = F5((_) => {
      const H = _.target;
      [...c.branches].some((J) => J.contains(H)) || (a == null || a(_), i == null || i(_), _.defaultPrevented || s == null || s());
    }, d);
    return N5((_) => {
      k === c.layers.size - 1 && (r == null || r(_), !_.defaultPrevented && s && (_.preventDefault(), s()));
    }, d), S.useEffect(() => {
      if (u)
        return n && (c.layersWithOutsidePointerEventsDisabled.size === 0 && (am = d.body.style.pointerEvents, d.body.style.pointerEvents = "none"), c.layersWithOutsidePointerEventsDisabled.add(u)), c.layers.add(u), im(), () => {
          n && c.layersWithOutsidePointerEventsDisabled.size === 1 && (d.body.style.pointerEvents = am);
        };
    }, [u, d, n, c]), S.useEffect(() => () => {
      u && (c.layers.delete(u), c.layersWithOutsidePointerEventsDisabled.delete(u), im());
    }, [u, c]), S.useEffect(() => {
      const _ = () => p({});
      return document.addEventListener(Uc, _), () => document.removeEventListener(Uc, _);
    }, []), /* @__PURE__ */ Y(
      tn.div,
      {
        ...l,
        ref: b,
        style: {
          pointerEvents: x ? O ? "auto" : "none" : void 0,
          ...e.style
        },
        onFocusCapture: Dn(e.onFocusCapture, L.onFocusCapture),
        onBlurCapture: Dn(e.onBlurCapture, L.onBlurCapture),
        onPointerDownCapture: Dn(
          e.onPointerDownCapture,
          h.onPointerDownCapture
        )
      }
    );
  }
);
nv.displayName = I5;
var R5 = "DismissableLayerBranch", j5 = S.forwardRef((e, t) => {
  const n = S.useContext(tv), r = S.useRef(null), o = Pr(t, r);
  return S.useEffect(() => {
    const a = r.current;
    if (a)
      return n.branches.add(a), () => {
        n.branches.delete(a);
      };
  }, [n.branches]), /* @__PURE__ */ Y(tn.div, { ...e, ref: o });
});
j5.displayName = R5;
function _5(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = ca(e), r = S.useRef(!1), o = S.useRef(() => {
  });
  return S.useEffect(() => {
    const a = (s) => {
      if (s.target && !r.current) {
        let l = function() {
          rv(
            T5,
            n,
            c,
            { discrete: !0 }
          );
        };
        const c = { originalEvent: s };
        s.pointerType === "touch" ? (t.removeEventListener("click", o.current), o.current = l, t.addEventListener("click", o.current, { once: !0 })) : l();
      } else
        t.removeEventListener("click", o.current);
      r.current = !1;
    }, i = window.setTimeout(() => {
      t.addEventListener("pointerdown", a);
    }, 0);
    return () => {
      window.clearTimeout(i), t.removeEventListener("pointerdown", a), t.removeEventListener("click", o.current);
    };
  }, [t, n]), {
    // ensures we check React component tree (not just DOM tree)
    onPointerDownCapture: () => r.current = !0
  };
}
function F5(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = ca(e), r = S.useRef(!1);
  return S.useEffect(() => {
    const o = (a) => {
      a.target && !r.current && rv(M5, n, { originalEvent: a }, {
        discrete: !1
      });
    };
    return t.addEventListener("focusin", o), () => t.removeEventListener("focusin", o);
  }, [t, n]), {
    onFocusCapture: () => r.current = !0,
    onBlurCapture: () => r.current = !1
  };
}
function im() {
  const e = new CustomEvent(Uc);
  document.dispatchEvent(e);
}
function rv(e, t, n, { discrete: r }) {
  const o = n.originalEvent.target, a = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: n });
  t && o.addEventListener(e, t, { once: !0 }), r ? $5(o, a) : o.dispatchEvent(a);
}
var ll = "focusScope.autoFocusOnMount", cl = "focusScope.autoFocusOnUnmount", sm = { bubbles: !1, cancelable: !0 }, L5 = "FocusScope", ov = S.forwardRef((e, t) => {
  const {
    loop: n = !1,
    trapped: r = !1,
    onMountAutoFocus: o,
    onUnmountAutoFocus: a,
    ...i
  } = e, [s, l] = S.useState(null), c = ca(o), u = ca(a), f = S.useRef(null), d = Pr(t, (m) => l(m)), p = S.useRef({
    paused: !1,
    pause() {
      this.paused = !0;
    },
    resume() {
      this.paused = !1;
    }
  }).current;
  S.useEffect(() => {
    if (r) {
      let m = function(x) {
        if (p.paused || !s) return;
        const O = x.target;
        s.contains(O) ? f.current = O : Rn(f.current, { select: !0 });
      }, g = function(x) {
        if (p.paused || !s) return;
        const O = x.relatedTarget;
        O !== null && (s.contains(O) || Rn(f.current, { select: !0 }));
      }, v = function(x) {
        if (document.activeElement === document.body)
          for (const O of x)
            O.removedNodes.length > 0 && Rn(s);
      };
      document.addEventListener("focusin", m), document.addEventListener("focusout", g);
      const k = new MutationObserver(v);
      return s && k.observe(s, { childList: !0, subtree: !0 }), () => {
        document.removeEventListener("focusin", m), document.removeEventListener("focusout", g), k.disconnect();
      };
    }
  }, [r, s, p.paused]), S.useEffect(() => {
    if (s) {
      cm.add(p);
      const m = document.activeElement;
      if (!s.contains(m)) {
        const g = new CustomEvent(ll, sm);
        s.addEventListener(ll, c), s.dispatchEvent(g), g.defaultPrevented || (D5(U5(av(s)), { select: !0 }), document.activeElement === m && Rn(s));
      }
      return () => {
        s.removeEventListener(ll, c), setTimeout(() => {
          const g = new CustomEvent(cl, sm);
          s.addEventListener(cl, u), s.dispatchEvent(g), g.defaultPrevented || Rn(m ?? document.body, { select: !0 }), s.removeEventListener(cl, u), cm.remove(p);
        }, 0);
      };
    }
  }, [s, c, u, p]);
  const b = S.useCallback(
    (m) => {
      if (!n && !r || p.paused) return;
      const g = m.key === "Tab" && !m.altKey && !m.ctrlKey && !m.metaKey, v = document.activeElement;
      if (g && v) {
        const k = m.currentTarget, [x, O] = z5(k);
        x && O ? !m.shiftKey && v === O ? (m.preventDefault(), n && Rn(x, { select: !0 })) : m.shiftKey && v === x && (m.preventDefault(), n && Rn(O, { select: !0 })) : v === k && m.preventDefault();
      }
    },
    [n, r, p.paused]
  );
  return /* @__PURE__ */ Y(tn.div, { tabIndex: -1, ...i, ref: d, onKeyDown: b });
});
ov.displayName = L5;
function D5(e, { select: t = !1 } = {}) {
  const n = document.activeElement;
  for (const r of e)
    if (Rn(r, { select: t }), document.activeElement !== n) return;
}
function z5(e) {
  const t = av(e), n = lm(t, e), r = lm(t.reverse(), e);
  return [n, r];
}
function av(e) {
  const t = [], n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (r) => {
      const o = r.tagName === "INPUT" && r.type === "hidden";
      return r.disabled || r.hidden || o ? NodeFilter.FILTER_SKIP : r.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  for (; n.nextNode(); ) t.push(n.currentNode);
  return t;
}
function lm(e, t) {
  for (const n of e)
    if (!W5(n, { upTo: t })) return n;
}
function W5(e, { upTo: t }) {
  if (getComputedStyle(e).visibility === "hidden") return !0;
  for (; e; ) {
    if (t !== void 0 && e === t) return !1;
    if (getComputedStyle(e).display === "none") return !0;
    e = e.parentElement;
  }
  return !1;
}
function V5(e) {
  return e instanceof HTMLInputElement && "select" in e;
}
function Rn(e, { select: t = !1 } = {}) {
  if (e && e.focus) {
    const n = document.activeElement;
    e.focus({ preventScroll: !0 }), e !== n && V5(e) && t && e.select();
  }
}
var cm = H5();
function H5() {
  let e = [];
  return {
    add(t) {
      const n = e[0];
      t !== n && (n == null || n.pause()), e = um(e, t), e.unshift(t);
    },
    remove(t) {
      var n;
      e = um(e, t), (n = e[0]) == null || n.resume();
    }
  };
}
function um(e, t) {
  const n = [...e], r = n.indexOf(t);
  return r !== -1 && n.splice(r, 1), n;
}
function U5(e) {
  return e.filter((t) => t.tagName !== "A");
}
var Y5 = "Portal", iv = S.forwardRef((e, t) => {
  var n;
  const { container: r, ...o } = e, [a, i] = S.useState(!1);
  la(() => i(!0), []);
  const s = r || a && ((n = globalThis == null ? void 0 : globalThis.document) == null ? void 0 : n.body);
  return s ? Jx.createPortal(/* @__PURE__ */ Y(tn.div, { ...o, ref: t }), s) : null;
});
iv.displayName = Y5;
function B5(e, t) {
  return S.useReducer((n, r) => t[n][r] ?? n, e);
}
var us = (e) => {
  const { present: t, children: n } = e, r = G5(t), o = typeof n == "function" ? n({ present: r.isPresent }) : S.Children.only(n), a = Pr(r.ref, q5(o));
  return typeof n == "function" || r.isPresent ? S.cloneElement(o, { ref: a }) : null;
};
us.displayName = "Presence";
function G5(e) {
  const [t, n] = S.useState(), r = S.useRef(null), o = S.useRef(e), a = S.useRef("none"), i = e ? "mounted" : "unmounted", [s, l] = B5(i, {
    mounted: {
      UNMOUNT: "unmounted",
      ANIMATION_OUT: "unmountSuspended"
    },
    unmountSuspended: {
      MOUNT: "mounted",
      ANIMATION_END: "unmounted"
    },
    unmounted: {
      MOUNT: "mounted"
    }
  });
  return S.useEffect(() => {
    const c = Ka(r.current);
    a.current = s === "mounted" ? c : "none";
  }, [s]), la(() => {
    const c = r.current, u = o.current;
    if (u !== e) {
      const f = a.current, d = Ka(c);
      e ? l("MOUNT") : d === "none" || (c == null ? void 0 : c.display) === "none" ? l("UNMOUNT") : l(u && f !== d ? "ANIMATION_OUT" : "UNMOUNT"), o.current = e;
    }
  }, [e, l]), la(() => {
    if (t) {
      let c;
      const u = t.ownerDocument.defaultView ?? window, f = (p) => {
        const b = Ka(r.current).includes(p.animationName);
        if (p.target === t && b && (l("ANIMATION_END"), !o.current)) {
          const m = t.style.animationFillMode;
          t.style.animationFillMode = "forwards", c = u.setTimeout(() => {
            t.style.animationFillMode === "forwards" && (t.style.animationFillMode = m);
          });
        }
      }, d = (p) => {
        p.target === t && (a.current = Ka(r.current));
      };
      return t.addEventListener("animationstart", d), t.addEventListener("animationcancel", f), t.addEventListener("animationend", f), () => {
        u.clearTimeout(c), t.removeEventListener("animationstart", d), t.removeEventListener("animationcancel", f), t.removeEventListener("animationend", f);
      };
    } else
      l("ANIMATION_END");
  }, [t, l]), {
    isPresent: ["mounted", "unmountSuspended"].includes(s),
    ref: S.useCallback((c) => {
      r.current = c ? getComputedStyle(c) : null, n(c);
    }, [])
  };
}
function Ka(e) {
  return (e == null ? void 0 : e.animationName) || "none";
}
function q5(e) {
  var t, n;
  let r = (t = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : t.get, o = r && "isReactWarning" in r && r.isReactWarning;
  return o ? e.ref : (r = (n = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : n.get, o = r && "isReactWarning" in r && r.isReactWarning, o ? e.props.ref : e.props.ref || e.ref);
}
var ul = 0;
function K5() {
  S.useEffect(() => {
    const e = document.querySelectorAll("[data-radix-focus-guard]");
    return document.body.insertAdjacentElement("afterbegin", e[0] ?? fm()), document.body.insertAdjacentElement("beforeend", e[1] ?? fm()), ul++, () => {
      ul === 1 && document.querySelectorAll("[data-radix-focus-guard]").forEach((t) => t.remove()), ul--;
    };
  }, []);
}
function fm() {
  const e = document.createElement("span");
  return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
var Vt = function() {
  return Vt = Object.assign || function(e) {
    for (var t, n = 1, r = arguments.length; n < r; n++) {
      t = arguments[n];
      for (var o in t) Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o]);
    }
    return e;
  }, Vt.apply(this, arguments);
};
function sv(e, t) {
  var n = {};
  for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
  if (e != null && typeof Object.getOwnPropertySymbols == "function")
    for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
      t.indexOf(r[o]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[o]) && (n[r[o]] = e[r[o]]);
  return n;
}
function X5(e, t, n) {
  for (var r = 0, o = t.length, a; r < o; r++)
    (a || !(r in t)) && (a || (a = Array.prototype.slice.call(t, 0, r)), a[r] = t[r]);
  return e.concat(a || Array.prototype.slice.call(t));
}
var pi = "right-scroll-bar-position", mi = "width-before-scroll-bar", Q5 = "with-scroll-bars-hidden", J5 = "--removed-body-scroll-bar-size";
function fl(e, t) {
  return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
function Z5(e, t) {
  var n = $e(function() {
    return {
      // value
      value: e,
      // last callback
      callback: t,
      // "memoized" public interface
      facade: {
        get current() {
          return n.value;
        },
        set current(r) {
          var o = n.value;
          o !== r && (n.value = r, n.callback(r, o));
        }
      }
    };
  })[0];
  return n.callback = t, n.facade;
}
var eP = typeof window < "u" ? S.useLayoutEffect : S.useEffect, dm = /* @__PURE__ */ new WeakMap();
function tP(e, t) {
  var n = Z5(null, function(r) {
    return e.forEach(function(o) {
      return fl(o, r);
    });
  });
  return eP(function() {
    var r = dm.get(n);
    if (r) {
      var o = new Set(r), a = new Set(e), i = n.current;
      o.forEach(function(s) {
        a.has(s) || fl(s, null);
      }), a.forEach(function(s) {
        o.has(s) || fl(s, i);
      });
    }
    dm.set(n, e);
  }, [e]), n;
}
function nP(e) {
  return e;
}
function rP(e, t) {
  t === void 0 && (t = nP);
  var n = [], r = !1, o = {
    read: function() {
      if (r)
        throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
      return n.length ? n[n.length - 1] : e;
    },
    useMedium: function(a) {
      var i = t(a, r);
      return n.push(i), function() {
        n = n.filter(function(s) {
          return s !== i;
        });
      };
    },
    assignSyncMedium: function(a) {
      for (r = !0; n.length; ) {
        var i = n;
        n = [], i.forEach(a);
      }
      n = {
        push: function(s) {
          return a(s);
        },
        filter: function() {
          return n;
        }
      };
    },
    assignMedium: function(a) {
      r = !0;
      var i = [];
      if (n.length) {
        var s = n;
        n = [], s.forEach(a), i = n;
      }
      var l = function() {
        var u = i;
        i = [], u.forEach(a);
      }, c = function() {
        return Promise.resolve().then(l);
      };
      c(), n = {
        push: function(u) {
          i.push(u), c();
        },
        filter: function(u) {
          return i = i.filter(u), n;
        }
      };
    }
  };
  return o;
}
function oP(e) {
  e === void 0 && (e = {});
  var t = rP(null);
  return t.options = Vt({ async: !0, ssr: !1 }, e), t;
}
var lv = function(e) {
  var t = e.sideCar, n = sv(e, ["sideCar"]);
  if (!t)
    throw new Error("Sidecar: please provide `sideCar` property to import the right car");
  var r = t.read();
  if (!r)
    throw new Error("Sidecar medium not found");
  return S.createElement(r, Vt({}, n));
};
lv.isSideCarExport = !0;
function aP(e, t) {
  return e.useMedium(t), lv;
}
var cv = oP(), dl = function() {
}, fs = S.forwardRef(function(e, t) {
  var n = S.useRef(null), r = S.useState({
    onScrollCapture: dl,
    onWheelCapture: dl,
    onTouchMoveCapture: dl
  }), o = r[0], a = r[1], i = e.forwardProps, s = e.children, l = e.className, c = e.removeScrollBar, u = e.enabled, f = e.shards, d = e.sideCar, p = e.noRelative, b = e.noIsolation, m = e.inert, g = e.allowPinchZoom, v = e.as, k = v === void 0 ? "div" : v, x = e.gapMode, O = sv(e, ["forwardProps", "children", "className", "removeScrollBar", "enabled", "shards", "sideCar", "noRelative", "noIsolation", "inert", "allowPinchZoom", "as", "gapMode"]), h = d, L = tP([n, t]), _ = Vt(Vt({}, O), o);
  return S.createElement(
    S.Fragment,
    null,
    u && S.createElement(h, { sideCar: cv, removeScrollBar: c, shards: f, noRelative: p, noIsolation: b, inert: m, setCallbacks: a, allowPinchZoom: !!g, lockRef: n, gapMode: x }),
    i ? S.cloneElement(S.Children.only(s), Vt(Vt({}, _), { ref: L })) : S.createElement(k, Vt({}, _, { className: l, ref: L }), s)
  );
});
fs.defaultProps = {
  enabled: !0,
  removeScrollBar: !0,
  inert: !1
};
fs.classNames = {
  fullWidth: mi,
  zeroRight: pi
};
var iP = function() {
  if (typeof __webpack_nonce__ < "u")
    return __webpack_nonce__;
};
function sP() {
  if (!document)
    return null;
  var e = document.createElement("style");
  e.type = "text/css";
  var t = iP();
  return t && e.setAttribute("nonce", t), e;
}
function lP(e, t) {
  e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function cP(e) {
  var t = document.head || document.getElementsByTagName("head")[0];
  t.appendChild(e);
}
var uP = function() {
  var e = 0, t = null;
  return {
    add: function(n) {
      e == 0 && (t = sP()) && (lP(t, n), cP(t)), e++;
    },
    remove: function() {
      e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
    }
  };
}, fP = function() {
  var e = uP();
  return function(t, n) {
    S.useEffect(function() {
      return e.add(t), function() {
        e.remove();
      };
    }, [t && n]);
  };
}, uv = function() {
  var e = fP(), t = function(n) {
    var r = n.styles, o = n.dynamic;
    return e(r, o), null;
  };
  return t;
}, dP = {
  left: 0,
  top: 0,
  right: 0,
  gap: 0
}, pl = function(e) {
  return parseInt(e || "", 10) || 0;
}, pP = function(e) {
  var t = window.getComputedStyle(document.body), n = t[e === "padding" ? "paddingLeft" : "marginLeft"], r = t[e === "padding" ? "paddingTop" : "marginTop"], o = t[e === "padding" ? "paddingRight" : "marginRight"];
  return [pl(n), pl(r), pl(o)];
}, mP = function(e) {
  if (e === void 0 && (e = "margin"), typeof window > "u")
    return dP;
  var t = pP(e), n = document.documentElement.clientWidth, r = window.innerWidth;
  return {
    left: t[0],
    top: t[1],
    right: t[2],
    gap: Math.max(0, r - n + t[2] - t[0])
  };
}, gP = uv(), Ur = "data-scroll-locked", hP = function(e, t, n, r) {
  var o = e.left, a = e.top, i = e.right, s = e.gap;
  return n === void 0 && (n = "margin"), `
  .`.concat(Q5, ` {
   overflow: hidden `).concat(r, `;
   padding-right: `).concat(s, "px ").concat(r, `;
  }
  body[`).concat(Ur, `] {
    overflow: hidden `).concat(r, `;
    overscroll-behavior: contain;
    `).concat([
    t && "position: relative ".concat(r, ";"),
    n === "margin" && `
    padding-left: `.concat(o, `px;
    padding-top: `).concat(a, `px;
    padding-right: `).concat(i, `px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(s, "px ").concat(r, `;
    `),
    n === "padding" && "padding-right: ".concat(s, "px ").concat(r, ";")
  ].filter(Boolean).join(""), `
  }
  
  .`).concat(pi, ` {
    right: `).concat(s, "px ").concat(r, `;
  }
  
  .`).concat(mi, ` {
    margin-right: `).concat(s, "px ").concat(r, `;
  }
  
  .`).concat(pi, " .").concat(pi, ` {
    right: 0 `).concat(r, `;
  }
  
  .`).concat(mi, " .").concat(mi, ` {
    margin-right: 0 `).concat(r, `;
  }
  
  body[`).concat(Ur, `] {
    `).concat(J5, ": ").concat(s, `px;
  }
`);
}, pm = function() {
  var e = parseInt(document.body.getAttribute(Ur) || "0", 10);
  return isFinite(e) ? e : 0;
}, bP = function() {
  S.useEffect(function() {
    return document.body.setAttribute(Ur, (pm() + 1).toString()), function() {
      var e = pm() - 1;
      e <= 0 ? document.body.removeAttribute(Ur) : document.body.setAttribute(Ur, e.toString());
    };
  }, []);
}, yP = function(e) {
  var t = e.noRelative, n = e.noImportant, r = e.gapMode, o = r === void 0 ? "margin" : r;
  bP();
  var a = S.useMemo(function() {
    return mP(o);
  }, [o]);
  return S.createElement(gP, { styles: hP(a, !t, o, n ? "" : "!important") });
}, Yc = !1;
if (typeof window < "u")
  try {
    var Xa = Object.defineProperty({}, "passive", {
      get: function() {
        return Yc = !0, !0;
      }
    });
    window.addEventListener("test", Xa, Xa), window.removeEventListener("test", Xa, Xa);
  } catch {
    Yc = !1;
  }
var Cr = Yc ? { passive: !1 } : !1, vP = function(e) {
  return e.tagName === "TEXTAREA";
}, fv = function(e, t) {
  if (!(e instanceof Element))
    return !1;
  var n = window.getComputedStyle(e);
  return (
    // not-not-scrollable
    n[t] !== "hidden" && // contains scroll inside self
    !(n.overflowY === n.overflowX && !vP(e) && n[t] === "visible")
  );
}, xP = function(e) {
  return fv(e, "overflowY");
}, wP = function(e) {
  return fv(e, "overflowX");
}, mm = function(e, t) {
  var n = t.ownerDocument, r = t;
  do {
    typeof ShadowRoot < "u" && r instanceof ShadowRoot && (r = r.host);
    var o = dv(e, r);
    if (o) {
      var a = pv(e, r), i = a[1], s = a[2];
      if (i > s)
        return !0;
    }
    r = r.parentNode;
  } while (r && r !== n.body);
  return !1;
}, kP = function(e) {
  var t = e.scrollTop, n = e.scrollHeight, r = e.clientHeight;
  return [
    t,
    n,
    r
  ];
}, EP = function(e) {
  var t = e.scrollLeft, n = e.scrollWidth, r = e.clientWidth;
  return [
    t,
    n,
    r
  ];
}, dv = function(e, t) {
  return e === "v" ? xP(t) : wP(t);
}, pv = function(e, t) {
  return e === "v" ? kP(t) : EP(t);
}, OP = function(e, t) {
  return e === "h" && t === "rtl" ? -1 : 1;
}, SP = function(e, t, n, r, o) {
  var a = OP(e, window.getComputedStyle(t).direction), i = a * r, s = n.target, l = t.contains(s), c = !1, u = i > 0, f = 0, d = 0;
  do {
    if (!s)
      break;
    var p = pv(e, s), b = p[0], m = p[1], g = p[2], v = m - g - a * b;
    (b || v) && dv(e, s) && (f += v, d += b);
    var k = s.parentNode;
    s = k && k.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? k.host : k;
  } while (
    // portaled content
    !l && s !== document.body || // self content
    l && (t.contains(s) || t === s)
  );
  return (u && Math.abs(f) < 1 || !u && Math.abs(d) < 1) && (c = !0), c;
}, Qa = function(e) {
  return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, gm = function(e) {
  return [e.deltaX, e.deltaY];
}, hm = function(e) {
  return e && "current" in e ? e.current : e;
}, PP = function(e, t) {
  return e[0] === t[0] && e[1] === t[1];
}, AP = function(e) {
  return `
  .block-interactivity-`.concat(e, ` {pointer-events: none;}
  .allow-interactivity-`).concat(e, ` {pointer-events: all;}
`);
}, CP = 0, $r = [];
function $P(e) {
  var t = S.useRef([]), n = S.useRef([0, 0]), r = S.useRef(), o = S.useState(CP++)[0], a = S.useState(uv)[0], i = S.useRef(e);
  S.useEffect(function() {
    i.current = e;
  }, [e]), S.useEffect(function() {
    if (e.inert) {
      document.body.classList.add("block-interactivity-".concat(o));
      var m = X5([e.lockRef.current], (e.shards || []).map(hm)).filter(Boolean);
      return m.forEach(function(g) {
        return g.classList.add("allow-interactivity-".concat(o));
      }), function() {
        document.body.classList.remove("block-interactivity-".concat(o)), m.forEach(function(g) {
          return g.classList.remove("allow-interactivity-".concat(o));
        });
      };
    }
  }, [e.inert, e.lockRef.current, e.shards]);
  var s = S.useCallback(function(m, g) {
    if ("touches" in m && m.touches.length === 2 || m.type === "wheel" && m.ctrlKey)
      return !i.current.allowPinchZoom;
    var v = Qa(m), k = n.current, x = "deltaX" in m ? m.deltaX : k[0] - v[0], O = "deltaY" in m ? m.deltaY : k[1] - v[1], h, L = m.target, _ = Math.abs(x) > Math.abs(O) ? "h" : "v";
    if ("touches" in m && _ === "h" && L.type === "range")
      return !1;
    var H = mm(_, L);
    if (!H)
      return !0;
    if (H ? h = _ : (h = _ === "v" ? "h" : "v", H = mm(_, L)), !H)
      return !1;
    if (!r.current && "changedTouches" in m && (x || O) && (r.current = h), !h)
      return !0;
    var J = r.current || h;
    return SP(J, g, m, J === "h" ? x : O);
  }, []), l = S.useCallback(function(m) {
    var g = m;
    if (!(!$r.length || $r[$r.length - 1] !== a)) {
      var v = "deltaY" in g ? gm(g) : Qa(g), k = t.current.filter(function(h) {
        return h.name === g.type && (h.target === g.target || g.target === h.shadowParent) && PP(h.delta, v);
      })[0];
      if (k && k.should) {
        g.cancelable && g.preventDefault();
        return;
      }
      if (!k) {
        var x = (i.current.shards || []).map(hm).filter(Boolean).filter(function(h) {
          return h.contains(g.target);
        }), O = x.length > 0 ? s(g, x[0]) : !i.current.noIsolation;
        O && g.cancelable && g.preventDefault();
      }
    }
  }, []), c = S.useCallback(function(m, g, v, k) {
    var x = { name: m, delta: g, target: v, should: k, shadowParent: NP(v) };
    t.current.push(x), setTimeout(function() {
      t.current = t.current.filter(function(O) {
        return O !== x;
      });
    }, 1);
  }, []), u = S.useCallback(function(m) {
    n.current = Qa(m), r.current = void 0;
  }, []), f = S.useCallback(function(m) {
    c(m.type, gm(m), m.target, s(m, e.lockRef.current));
  }, []), d = S.useCallback(function(m) {
    c(m.type, Qa(m), m.target, s(m, e.lockRef.current));
  }, []);
  S.useEffect(function() {
    return $r.push(a), e.setCallbacks({
      onScrollCapture: f,
      onWheelCapture: f,
      onTouchMoveCapture: d
    }), document.addEventListener("wheel", l, Cr), document.addEventListener("touchmove", l, Cr), document.addEventListener("touchstart", u, Cr), function() {
      $r = $r.filter(function(m) {
        return m !== a;
      }), document.removeEventListener("wheel", l, Cr), document.removeEventListener("touchmove", l, Cr), document.removeEventListener("touchstart", u, Cr);
    };
  }, []);
  var p = e.removeScrollBar, b = e.inert;
  return S.createElement(
    S.Fragment,
    null,
    b ? S.createElement(a, { styles: AP(o) }) : null,
    p ? S.createElement(yP, { noRelative: e.noRelative, gapMode: e.gapMode }) : null
  );
}
function NP(e) {
  for (var t = null; e !== null; )
    e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
  return t;
}
const IP = aP(cv, $P);
var mv = S.forwardRef(function(e, t) {
  return S.createElement(fs, Vt({}, e, { ref: t, sideCar: IP }));
});
mv.classNames = fs.classNames;
var TP = function(e) {
  if (typeof document > "u")
    return null;
  var t = Array.isArray(e) ? e[0] : e;
  return t.ownerDocument.body;
}, Nr = /* @__PURE__ */ new WeakMap(), Ja = /* @__PURE__ */ new WeakMap(), Za = {}, ml = 0, gv = function(e) {
  return e && (e.host || gv(e.parentNode));
}, MP = function(e, t) {
  return t.map(function(n) {
    if (e.contains(n))
      return n;
    var r = gv(n);
    return r && e.contains(r) ? r : (console.error("aria-hidden", n, "in not contained inside", e, ". Doing nothing"), null);
  }).filter(function(n) {
    return !!n;
  });
}, RP = function(e, t, n, r) {
  var o = MP(t, Array.isArray(e) ? e : [e]);
  Za[n] || (Za[n] = /* @__PURE__ */ new WeakMap());
  var a = Za[n], i = [], s = /* @__PURE__ */ new Set(), l = new Set(o), c = function(f) {
    !f || s.has(f) || (s.add(f), c(f.parentNode));
  };
  o.forEach(c);
  var u = function(f) {
    !f || l.has(f) || Array.prototype.forEach.call(f.children, function(d) {
      if (s.has(d))
        u(d);
      else
        try {
          var p = d.getAttribute(r), b = p !== null && p !== "false", m = (Nr.get(d) || 0) + 1, g = (a.get(d) || 0) + 1;
          Nr.set(d, m), a.set(d, g), i.push(d), m === 1 && b && Ja.set(d, !0), g === 1 && d.setAttribute(n, "true"), b || d.setAttribute(r, "true");
        } catch (v) {
          console.error("aria-hidden: cannot operate on ", d, v);
        }
    });
  };
  return u(t), s.clear(), ml++, function() {
    i.forEach(function(f) {
      var d = Nr.get(f) - 1, p = a.get(f) - 1;
      Nr.set(f, d), a.set(f, p), d || (Ja.has(f) || f.removeAttribute(r), Ja.delete(f)), p || f.removeAttribute(n);
    }), ml--, ml || (Nr = /* @__PURE__ */ new WeakMap(), Nr = /* @__PURE__ */ new WeakMap(), Ja = /* @__PURE__ */ new WeakMap(), Za = {});
  };
}, jP = function(e, t, n) {
  n === void 0 && (n = "data-aria-hidden");
  var r = Array.from(Array.isArray(e) ? e : [e]), o = TP(e);
  return o ? (r.push.apply(r, Array.from(o.querySelectorAll("[aria-live], script"))), RP(r, o, n, "aria-hidden")) : function() {
    return null;
  };
}, ds = "Dialog", [hv, mM] = g5(ds), [_P, _t] = hv(ds), bv = (e) => {
  const {
    __scopeDialog: t,
    children: n,
    open: r,
    defaultOpen: o,
    onOpenChange: a,
    modal: i = !0
  } = e, s = S.useRef(null), l = S.useRef(null), [c, u] = x5({
    prop: r,
    defaultProp: o ?? !1,
    onChange: a,
    caller: ds
  });
  return /* @__PURE__ */ Y(
    _P,
    {
      scope: t,
      triggerRef: s,
      contentRef: l,
      contentId: sl(),
      titleId: sl(),
      descriptionId: sl(),
      open: c,
      onOpenChange: u,
      onOpenToggle: S.useCallback(() => u((f) => !f), [u]),
      modal: i,
      children: n
    }
  );
};
bv.displayName = ds;
var yv = "DialogTrigger", FP = S.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, o = _t(yv, n), a = Pr(t, o.triggerRef);
    return /* @__PURE__ */ Y(
      tn.button,
      {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": o.open,
        "aria-controls": o.contentId,
        "data-state": _f(o.open),
        ...r,
        ref: a,
        onClick: Dn(e.onClick, o.onOpenToggle)
      }
    );
  }
);
FP.displayName = yv;
var Rf = "DialogPortal", [LP, vv] = hv(Rf, {
  forceMount: void 0
}), xv = (e) => {
  const { __scopeDialog: t, forceMount: n, children: r, container: o } = e, a = _t(Rf, t);
  return /* @__PURE__ */ Y(LP, { scope: t, forceMount: n, children: S.Children.map(r, (i) => /* @__PURE__ */ Y(us, { present: n || a.open, children: /* @__PURE__ */ Y(iv, { asChild: !0, container: o, children: i }) })) });
};
xv.displayName = Rf;
var ji = "DialogOverlay", wv = S.forwardRef(
  (e, t) => {
    const n = vv(ji, e.__scopeDialog), { forceMount: r = n.forceMount, ...o } = e, a = _t(ji, e.__scopeDialog);
    return a.modal ? /* @__PURE__ */ Y(us, { present: r || a.open, children: /* @__PURE__ */ Y(zP, { ...o, ref: t }) }) : null;
  }
);
wv.displayName = ji;
var DP = /* @__PURE__ */ ev("DialogOverlay.RemoveScroll"), zP = S.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, o = _t(ji, n);
    return (
      // Make sure `Content` is scrollable even when it doesn't live inside `RemoveScroll`
      // ie. when `Overlay` and `Content` are siblings
      /* @__PURE__ */ Y(mv, { as: DP, allowPinchZoom: !0, shards: [o.contentRef], children: /* @__PURE__ */ Y(
        tn.div,
        {
          "data-state": _f(o.open),
          ...r,
          ref: t,
          style: { pointerEvents: "auto", ...r.style }
        }
      ) })
    );
  }
), hr = "DialogContent", kv = S.forwardRef(
  (e, t) => {
    const n = vv(hr, e.__scopeDialog), { forceMount: r = n.forceMount, ...o } = e, a = _t(hr, e.__scopeDialog);
    return /* @__PURE__ */ Y(us, { present: r || a.open, children: a.modal ? /* @__PURE__ */ Y(WP, { ...o, ref: t }) : /* @__PURE__ */ Y(VP, { ...o, ref: t }) });
  }
);
kv.displayName = hr;
var WP = S.forwardRef(
  (e, t) => {
    const n = _t(hr, e.__scopeDialog), r = S.useRef(null), o = Pr(t, n.contentRef, r);
    return S.useEffect(() => {
      const a = r.current;
      if (a) return jP(a);
    }, []), /* @__PURE__ */ Y(
      Ev,
      {
        ...e,
        ref: o,
        trapFocus: n.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: Dn(e.onCloseAutoFocus, (a) => {
          var i;
          a.preventDefault(), (i = n.triggerRef.current) == null || i.focus();
        }),
        onPointerDownOutside: Dn(e.onPointerDownOutside, (a) => {
          const i = a.detail.originalEvent, s = i.button === 0 && i.ctrlKey === !0;
          (i.button === 2 || s) && a.preventDefault();
        }),
        onFocusOutside: Dn(
          e.onFocusOutside,
          (a) => a.preventDefault()
        )
      }
    );
  }
), VP = S.forwardRef(
  (e, t) => {
    const n = _t(hr, e.__scopeDialog), r = S.useRef(!1), o = S.useRef(!1);
    return /* @__PURE__ */ Y(
      Ev,
      {
        ...e,
        ref: t,
        trapFocus: !1,
        disableOutsidePointerEvents: !1,
        onCloseAutoFocus: (a) => {
          var i, s;
          (i = e.onCloseAutoFocus) == null || i.call(e, a), a.defaultPrevented || (r.current || (s = n.triggerRef.current) == null || s.focus(), a.preventDefault()), r.current = !1, o.current = !1;
        },
        onInteractOutside: (a) => {
          var i, s;
          (i = e.onInteractOutside) == null || i.call(e, a), a.defaultPrevented || (r.current = !0, a.detail.originalEvent.type === "pointerdown" && (o.current = !0));
          const l = a.target;
          (s = n.triggerRef.current) != null && s.contains(l) && a.preventDefault(), a.detail.originalEvent.type === "focusin" && o.current && a.preventDefault();
        }
      }
    );
  }
), Ev = S.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, trapFocus: r, onOpenAutoFocus: o, onCloseAutoFocus: a, ...i } = e, s = _t(hr, n), l = S.useRef(null), c = Pr(t, l);
    return K5(), /* @__PURE__ */ Xe(Ct, { children: [
      /* @__PURE__ */ Y(
        ov,
        {
          asChild: !0,
          loop: !0,
          trapped: r,
          onMountAutoFocus: o,
          onUnmountAutoFocus: a,
          children: /* @__PURE__ */ Y(
            nv,
            {
              role: "dialog",
              id: s.contentId,
              "aria-describedby": s.descriptionId,
              "aria-labelledby": s.titleId,
              "data-state": _f(s.open),
              ...i,
              ref: c,
              onDismiss: () => s.onOpenChange(!1)
            }
          )
        }
      ),
      /* @__PURE__ */ Xe(Ct, { children: [
        /* @__PURE__ */ Y(UP, { titleId: s.titleId }),
        /* @__PURE__ */ Y(BP, { contentRef: l, descriptionId: s.descriptionId })
      ] })
    ] });
  }
), jf = "DialogTitle", Ov = S.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, o = _t(jf, n);
    return /* @__PURE__ */ Y(tn.h2, { id: o.titleId, ...r, ref: t });
  }
);
Ov.displayName = jf;
var Sv = "DialogDescription", Pv = S.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, o = _t(Sv, n);
    return /* @__PURE__ */ Y(tn.p, { id: o.descriptionId, ...r, ref: t });
  }
);
Pv.displayName = Sv;
var Av = "DialogClose", HP = S.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, o = _t(Av, n);
    return /* @__PURE__ */ Y(
      tn.button,
      {
        type: "button",
        ...r,
        ref: t,
        onClick: Dn(e.onClick, () => o.onOpenChange(!1))
      }
    );
  }
);
HP.displayName = Av;
function _f(e) {
  return e ? "open" : "closed";
}
var Cv = "DialogTitleWarning", [gM, $v] = m5(Cv, {
  contentName: hr,
  titleName: jf,
  docsSlug: "dialog"
}), UP = ({ titleId: e }) => {
  const t = $v(Cv), n = `\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;
  return S.useEffect(() => {
    e && (document.getElementById(e) || console.error(n));
  }, [n, e]), null;
}, YP = "DialogDescriptionWarning", BP = ({ contentRef: e, descriptionId: t }) => {
  const n = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${$v(YP).contentName}}.`;
  return S.useEffect(() => {
    var r;
    const o = (r = e.current) == null ? void 0 : r.getAttribute("aria-describedby");
    t && o && (document.getElementById(t) || console.warn(n));
  }, [n, e, t]), null;
}, GP = bv, qP = xv, KP = wv, XP = kv, bm = Ov, QP = Pv;
const Ff = "-", JP = (e) => {
  const t = eA(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(Ff);
      return a[0] === "" && a.length !== 1 && a.shift(), Nv(a, t) || ZP(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const i = n[o] || [];
      return a && r[o] ? [...i, ...r[o]] : i;
    }
  };
}, Nv = (e, t) => {
  var n;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], o = t.nextPart.get(r), a = o ? Nv(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const i = e.join(Ff);
  return (n = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : n.classGroupId;
}, ym = /^\[(.+)\]$/, ZP = (e) => {
  if (ym.test(e)) {
    const t = ym.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, eA = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return nA(Object.entries(e.classGroups), n).forEach(([o, a]) => {
    Bc(a, r, o, t);
  }), r;
}, Bc = (e, t, n, r) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : vm(t, o);
      a.classGroupId = n;
      return;
    }
    if (typeof o == "function") {
      if (tA(o)) {
        Bc(o(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: n
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      Bc(i, vm(t, a), n, r);
    });
  });
}, vm = (e, t) => {
  let n = e;
  return t.split(Ff).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, tA = (e) => e.isThemeGetter, nA = (e, t) => t ? e.map(([n, r]) => {
  const o = r.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [n, o];
}) : e, rA = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const o = (a, i) => {
    n.set(a, i), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = n.get(a);
      if (i !== void 0)
        return i;
      if ((i = r.get(a)) !== void 0)
        return o(a, i), i;
    },
    set(a, i) {
      n.has(a) ? n.set(a, i) : o(a, i);
    }
  };
}, Iv = "!", oA = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const l = [];
    let c = 0, u = 0, f;
    for (let g = 0; g < s.length; g++) {
      let v = s[g];
      if (c === 0) {
        if (v === o && (r || s.slice(g, g + a) === t)) {
          l.push(s.slice(u, g)), u = g + a;
          continue;
        }
        if (v === "/") {
          f = g;
          continue;
        }
      }
      v === "[" ? c++ : v === "]" && c--;
    }
    const d = l.length === 0 ? s : s.substring(u), p = d.startsWith(Iv), b = p ? d.substring(1) : d, m = f && f > u ? f - u : void 0;
    return {
      modifiers: l,
      hasImportantModifier: p,
      baseClassName: b,
      maybePostfixModifierPosition: m
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, aA = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, iA = (e) => ({
  cache: rA(e.cacheSize),
  parseClassName: oA(e),
  ...JP(e)
}), sA = /\s+/, lA = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(sA);
  let s = "";
  for (let l = i.length - 1; l >= 0; l -= 1) {
    const c = i[l], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: p
    } = n(c);
    let b = !!p, m = r(b ? d.substring(0, p) : d);
    if (!m) {
      if (!b) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (m = r(d), !m) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      b = !1;
    }
    const g = aA(u).join(":"), v = f ? g + Iv : g, k = v + m;
    if (a.includes(k))
      continue;
    a.push(k);
    const x = o(m, b);
    for (let O = 0; O < x.length; ++O) {
      const h = x[O];
      a.push(v + h);
    }
    s = c + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function cA() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = Tv(t)) && (r && (r += " "), r += n);
  return r;
}
const Tv = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = Tv(e[r])) && (n && (n += " "), n += t);
  return n;
};
function uA(e, ...t) {
  let n, r, o, a = i;
  function i(l) {
    const c = t.reduce((u, f) => f(u), e());
    return n = iA(c), r = n.cache.get, o = n.cache.set, a = s, s(l);
  }
  function s(l) {
    const c = r(l);
    if (c)
      return c;
    const u = lA(l, n);
    return o(l, u), u;
  }
  return function() {
    return a(cA.apply(null, arguments));
  };
}
const Fe = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, Mv = /^\[(?:([a-z-]+):)?(.+)\]$/i, fA = /^\d+\/\d+$/, dA = /* @__PURE__ */ new Set(["px", "full", "screen"]), pA = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, mA = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, gA = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, hA = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, bA = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, nn = (e) => Yr(e) || dA.has(e) || fA.test(e), kn = (e) => po(e, "length", SA), Yr = (e) => !!e && !Number.isNaN(Number(e)), gl = (e) => po(e, "number", Yr), ko = (e) => !!e && Number.isInteger(Number(e)), yA = (e) => e.endsWith("%") && Yr(e.slice(0, -1)), fe = (e) => Mv.test(e), En = (e) => pA.test(e), vA = /* @__PURE__ */ new Set(["length", "size", "percentage"]), xA = (e) => po(e, vA, Rv), wA = (e) => po(e, "position", Rv), kA = /* @__PURE__ */ new Set(["image", "url"]), EA = (e) => po(e, kA, AA), OA = (e) => po(e, "", PA), Eo = () => !0, po = (e, t, n) => {
  const r = Mv.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, SA = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  mA.test(e) && !gA.test(e)
), Rv = () => !1, PA = (e) => hA.test(e), AA = (e) => bA.test(e), CA = () => {
  const e = Fe("colors"), t = Fe("spacing"), n = Fe("blur"), r = Fe("brightness"), o = Fe("borderColor"), a = Fe("borderRadius"), i = Fe("borderSpacing"), s = Fe("borderWidth"), l = Fe("contrast"), c = Fe("grayscale"), u = Fe("hueRotate"), f = Fe("invert"), d = Fe("gap"), p = Fe("gradientColorStops"), b = Fe("gradientColorStopPositions"), m = Fe("inset"), g = Fe("margin"), v = Fe("opacity"), k = Fe("padding"), x = Fe("saturate"), O = Fe("scale"), h = Fe("sepia"), L = Fe("skew"), _ = Fe("space"), H = Fe("translate"), J = () => ["auto", "contain", "none"], Z = () => ["auto", "hidden", "clip", "visible", "scroll"], U = () => ["auto", fe, t], T = () => [fe, t], te = () => ["", nn, kn], W = () => ["auto", Yr, fe], j = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], D = () => ["solid", "dashed", "dotted", "double", "none"], Q = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], V = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], z = () => ["", "0", fe], y = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], w = () => [Yr, fe];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Eo],
      spacing: [nn, kn],
      blur: ["none", "", En, fe],
      brightness: w(),
      borderColor: [e],
      borderRadius: ["none", "", "full", En, fe],
      borderSpacing: T(),
      borderWidth: te(),
      contrast: w(),
      grayscale: z(),
      hueRotate: w(),
      invert: z(),
      gap: T(),
      gradientColorStops: [e],
      gradientColorStopPositions: [yA, kn],
      inset: U(),
      margin: U(),
      opacity: w(),
      padding: T(),
      saturate: w(),
      scale: w(),
      sepia: z(),
      skew: w(),
      space: T(),
      translate: T()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", fe]
      }],
      /**
       * Container
       * @see https://tailwindcss.com/docs/container
       */
      container: ["container"],
      /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */
      columns: [{
        columns: [En]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": y()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": y()
      }],
      /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */
      box: [{
        box: ["border", "content"]
      }],
      /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */
      isolation: ["isolate", "isolation-auto"],
      /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */
      "object-position": [{
        object: [...j(), fe]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: Z()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": Z()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": Z()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: J()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": J()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": J()
      }],
      /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      /**
       * Top / Right / Bottom / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      inset: [{
        inset: [m]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [m]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [m]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [m]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [m]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [m]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [m]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [m]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [m]
      }],
      /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */
      visibility: ["visible", "invisible", "collapse"],
      /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */
      z: [{
        z: ["auto", ko, fe]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: U()
      }],
      /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */
      "flex-wrap": [{
        flex: ["wrap", "wrap-reverse", "nowrap"]
      }],
      /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */
      flex: [{
        flex: ["1", "auto", "initial", "none", fe]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: z()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: z()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", ko, fe]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Eo]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", ko, fe]
        }, fe]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": W()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": W()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Eo]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [ko, fe]
        }, fe]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": W()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": W()
      }],
      /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */
      "auto-cols": [{
        "auto-cols": ["auto", "min", "max", "fr", fe]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", fe]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [d]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [d]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [d]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...V()]
      }],
      /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */
      "justify-items": [{
        "justify-items": ["start", "end", "center", "stretch"]
      }],
      /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */
      "justify-self": [{
        "justify-self": ["auto", "start", "end", "center", "stretch"]
      }],
      /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */
      "align-content": [{
        content: ["normal", ...V(), "baseline"]
      }],
      /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */
      "align-items": [{
        items: ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */
      "align-self": [{
        self: ["auto", "start", "end", "center", "stretch", "baseline"]
      }],
      /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */
      "place-content": [{
        "place-content": [...V(), "baseline"]
      }],
      /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */
      "place-items": [{
        "place-items": ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */
      "place-self": [{
        "place-self": ["auto", "start", "end", "center", "stretch"]
      }],
      // Spacing
      /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */
      p: [{
        p: [k]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [k]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [k]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [k]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [k]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [k]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [k]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [k]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [k]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [g]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [g]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [g]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [g]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [g]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [g]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [g]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [g]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [g]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [_]
      }],
      /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-x-reverse": ["space-x-reverse"],
      /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/space
       */
      "space-y": [{
        "space-y": [_]
      }],
      /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-y-reverse": ["space-y-reverse"],
      // Sizing
      /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */
      w: [{
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", fe, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [fe, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [fe, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [En]
        }, En]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [fe, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [fe, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [fe, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [fe, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", En, kn]
      }],
      /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */
      "font-style": ["italic", "not-italic"],
      /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */
      "font-weight": [{
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", gl]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Eo]
      }],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-normal": ["normal-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-ordinal": ["ordinal"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-slashed-zero": ["slashed-zero"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */
      tracking: [{
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", fe]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Yr, gl]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", nn, fe]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", fe]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", fe]
      }],
      /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/placeholder-color
       */
      "placeholder-color": [{
        placeholder: [e]
      }],
      /**
       * Placeholder Opacity
       * @see https://tailwindcss.com/docs/placeholder-opacity
       */
      "placeholder-opacity": [{
        "placeholder-opacity": [v]
      }],
      /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */
      "text-color": [{
        text: [e]
      }],
      /**
       * Text Opacity
       * @see https://tailwindcss.com/docs/text-opacity
       */
      "text-opacity": [{
        "text-opacity": [v]
      }],
      /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */
      "text-decoration-style": [{
        decoration: [...D(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", nn, kn]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", nn, fe]
      }],
      /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */
      "text-decoration-color": [{
        decoration: [e]
      }],
      /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      /**
       * Text Wrap
       * @see https://tailwindcss.com/docs/text-wrap
       */
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */
      indent: [{
        indent: T()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", fe]
      }],
      /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */
      content: [{
        content: ["none", fe]
      }],
      // Backgrounds
      /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      /**
       * Background Opacity
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/background-opacity
       */
      "bg-opacity": [{
        "bg-opacity": [v]
      }],
      /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */
      "bg-position": [{
        bg: [...j(), wA]
      }],
      /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */
      "bg-repeat": [{
        bg: ["no-repeat", {
          repeat: ["", "x", "y", "round", "space"]
        }]
      }],
      /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */
      "bg-size": [{
        bg: ["auto", "cover", "contain", xA]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, EA]
      }],
      /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */
      "bg-color": [{
        bg: [e]
      }],
      /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from-pos": [{
        from: [b]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [b]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [b]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [p]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [p]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [p]
      }],
      // Borders
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: [a]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [a]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [a]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [a]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [a]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [a]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [a]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [a]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [a]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [a]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [a]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [a]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [a]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [a]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [a]
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: [s]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [s]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [s]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [s]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [s]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [s]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [s]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [s]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [s]
      }],
      /**
       * Border Opacity
       * @see https://tailwindcss.com/docs/border-opacity
       */
      "border-opacity": [{
        "border-opacity": [v]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...D(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [s]
      }],
      /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x-reverse": ["divide-x-reverse"],
      /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y": [{
        "divide-y": [s]
      }],
      /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y-reverse": ["divide-y-reverse"],
      /**
       * Divide Opacity
       * @see https://tailwindcss.com/docs/divide-opacity
       */
      "divide-opacity": [{
        "divide-opacity": [v]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: D()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [o]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [o]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [o]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [o]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [o]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [o]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [o]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [o]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [o]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [o]
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: ["", ...D()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [nn, fe]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [nn, kn]
      }],
      /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */
      "outline-color": [{
        outline: [e]
      }],
      /**
       * Ring Width
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w": [{
        ring: te()
      }],
      /**
       * Ring Width Inset
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w-inset": ["ring-inset"],
      /**
       * Ring Color
       * @see https://tailwindcss.com/docs/ring-color
       */
      "ring-color": [{
        ring: [e]
      }],
      /**
       * Ring Opacity
       * @see https://tailwindcss.com/docs/ring-opacity
       */
      "ring-opacity": [{
        "ring-opacity": [v]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [nn, kn]
      }],
      /**
       * Ring Offset Color
       * @see https://tailwindcss.com/docs/ring-offset-color
       */
      "ring-offset-color": [{
        "ring-offset": [e]
      }],
      // Effects
      /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */
      shadow: [{
        shadow: ["", "inner", "none", En, OA]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Eo]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [v]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...Q(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": Q()
      }],
      // Filters
      /**
       * Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/filter
       */
      filter: [{
        filter: ["", "none"]
      }],
      /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */
      blur: [{
        blur: [n]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [r]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [l]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", En, fe]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [c]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [u]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [f]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [x]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [h]
      }],
      /**
       * Backdrop Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/backdrop-filter
       */
      "backdrop-filter": [{
        "backdrop-filter": ["", "none"]
      }],
      /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */
      "backdrop-blur": [{
        "backdrop-blur": [n]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [r]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [l]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [c]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [u]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [f]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [v]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [x]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [h]
      }],
      // Tables
      /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing": [{
        "border-spacing": [i]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [i]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [i]
      }],
      /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */
      caption: [{
        caption: ["top", "bottom"]
      }],
      // Transitions and Animation
      /**
       * Tranisition Property
       * @see https://tailwindcss.com/docs/transition-property
       */
      transition: [{
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", fe]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: w()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", fe]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: w()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", fe]
      }],
      // Transforms
      /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */
      transform: [{
        transform: ["", "gpu", "none"]
      }],
      /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */
      scale: [{
        scale: [O]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [O]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [O]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [ko, fe]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [H]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [H]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [L]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [L]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", fe]
      }],
      // Interactivity
      /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */
      accent: [{
        accent: ["auto", e]
      }],
      /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */
      appearance: [{
        appearance: ["none", "auto"]
      }],
      /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", fe]
      }],
      /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */
      "caret-color": [{
        caret: [e]
      }],
      /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */
      "pointer-events": [{
        "pointer-events": ["none", "auto"]
      }],
      /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */
      resize: [{
        resize: ["none", "y", "x", ""]
      }],
      /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-m": [{
        "scroll-m": T()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": T()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": T()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": T()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": T()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": T()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": T()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": T()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": T()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": T()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": T()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": T()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": T()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": T()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": T()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": T()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": T()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": T()
      }],
      /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-pz": ["touch-pinch-zoom"],
      /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", fe]
      }],
      // SVG
      /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */
      fill: [{
        fill: [e, "none"]
      }],
      /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */
      "stroke-w": [{
        stroke: [nn, kn, gl]
      }],
      /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */
      stroke: [{
        stroke: [e, "none"]
      }],
      // Accessibility
      /**
       * Screen Readers
       * @see https://tailwindcss.com/docs/screen-readers
       */
      sr: ["sr-only", "not-sr-only"],
      /**
       * Forced Color Adjust
       * @see https://tailwindcss.com/docs/forced-color-adjust
       */
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    }
  };
}, Yo = /* @__PURE__ */ uA(CA);
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function $A(e, t, n) {
  return (t = IA(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function xm(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function G(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? xm(Object(n), !0).forEach(function(r) {
      $A(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : xm(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function NA(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function IA(e) {
  var t = NA(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const wm = () => {
};
let Lf = {}, jv = {}, _v = null, Fv = {
  mark: wm,
  measure: wm
};
try {
  typeof window < "u" && (Lf = window), typeof document < "u" && (jv = document), typeof MutationObserver < "u" && (_v = MutationObserver), typeof performance < "u" && (Fv = performance);
} catch {
}
const {
  userAgent: km = ""
} = Lf.navigator || {}, Bn = Lf, Ve = jv, Em = _v, ei = Fv;
Bn.document;
const yn = !!Ve.documentElement && !!Ve.head && typeof Ve.addEventListener == "function" && typeof Ve.createElement == "function", Lv = ~km.indexOf("MSIE") || ~km.indexOf("Trident/");
var TA = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, MA = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Dv = {
  classic: {
    fa: "solid",
    fas: "solid",
    "fa-solid": "solid",
    far: "regular",
    "fa-regular": "regular",
    fal: "light",
    "fa-light": "light",
    fat: "thin",
    "fa-thin": "thin",
    fab: "brands",
    "fa-brands": "brands"
  },
  duotone: {
    fa: "solid",
    fad: "solid",
    "fa-solid": "solid",
    "fa-duotone": "solid",
    fadr: "regular",
    "fa-regular": "regular",
    fadl: "light",
    "fa-light": "light",
    fadt: "thin",
    "fa-thin": "thin"
  },
  sharp: {
    fa: "solid",
    fass: "solid",
    "fa-solid": "solid",
    fasr: "regular",
    "fa-regular": "regular",
    fasl: "light",
    "fa-light": "light",
    fast: "thin",
    "fa-thin": "thin"
  },
  "sharp-duotone": {
    fa: "solid",
    fasds: "solid",
    "fa-solid": "solid",
    fasdr: "regular",
    "fa-regular": "regular",
    fasdl: "light",
    "fa-light": "light",
    fasdt: "thin",
    "fa-thin": "thin"
  }
}, RA = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, zv = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], rt = "classic", ps = "duotone", jA = "sharp", _A = "sharp-duotone", Wv = [rt, ps, jA, _A], FA = {
  classic: {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  duotone: {
    900: "fad",
    400: "fadr",
    300: "fadl",
    100: "fadt"
  },
  sharp: {
    900: "fass",
    400: "fasr",
    300: "fasl",
    100: "fast"
  },
  "sharp-duotone": {
    900: "fasds",
    400: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
}, LA = {
  "Font Awesome 6 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 6 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  "Font Awesome 6 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 6 Duotone": {
    900: "fad",
    400: "fadr",
    normal: "fadr",
    300: "fadl",
    100: "fadt"
  },
  "Font Awesome 6 Sharp": {
    900: "fass",
    400: "fasr",
    normal: "fasr",
    300: "fasl",
    100: "fast"
  },
  "Font Awesome 6 Sharp Duotone": {
    900: "fasds",
    400: "fasdr",
    normal: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
}, DA = /* @__PURE__ */ new Map([["classic", {
  defaultShortPrefixId: "fas",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin", "brands"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp", {
  defaultShortPrefixId: "fass",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["duotone", {
  defaultShortPrefixId: "fad",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp-duotone", {
  defaultShortPrefixId: "fasds",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}]]), zA = {
  classic: {
    solid: "fas",
    regular: "far",
    light: "fal",
    thin: "fat",
    brands: "fab"
  },
  duotone: {
    solid: "fad",
    regular: "fadr",
    light: "fadl",
    thin: "fadt"
  },
  sharp: {
    solid: "fass",
    regular: "fasr",
    light: "fasl",
    thin: "fast"
  },
  "sharp-duotone": {
    solid: "fasds",
    regular: "fasdr",
    light: "fasdl",
    thin: "fasdt"
  }
}, WA = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Om = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, VA = ["kit"], HA = {
  kit: {
    "fa-kit": "fak"
  }
}, UA = ["fak", "fakd"], YA = {
  kit: {
    fak: "fa-kit"
  }
}, Sm = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, ti = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, BA = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], GA = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], qA = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, KA = {
  classic: {
    "fa-brands": "fab",
    "fa-duotone": "fad",
    "fa-light": "fal",
    "fa-regular": "far",
    "fa-solid": "fas",
    "fa-thin": "fat"
  },
  duotone: {
    "fa-regular": "fadr",
    "fa-light": "fadl",
    "fa-thin": "fadt"
  },
  sharp: {
    "fa-solid": "fass",
    "fa-regular": "fasr",
    "fa-light": "fasl",
    "fa-thin": "fast"
  },
  "sharp-duotone": {
    "fa-solid": "fasds",
    "fa-regular": "fasdr",
    "fa-light": "fasdl",
    "fa-thin": "fasdt"
  }
}, XA = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Gc = {
  classic: {
    fab: "fa-brands",
    fad: "fa-duotone",
    fal: "fa-light",
    far: "fa-regular",
    fas: "fa-solid",
    fat: "fa-thin"
  },
  duotone: {
    fadr: "fa-regular",
    fadl: "fa-light",
    fadt: "fa-thin"
  },
  sharp: {
    fass: "fa-solid",
    fasr: "fa-regular",
    fasl: "fa-light",
    fast: "fa-thin"
  },
  "sharp-duotone": {
    fasds: "fa-solid",
    fasdr: "fa-regular",
    fasdl: "fa-light",
    fasdt: "fa-thin"
  }
}, QA = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], qc = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...BA, ...QA], JA = ["solid", "regular", "light", "thin", "duotone", "brands"], Vv = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ZA = Vv.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), e4 = [...Object.keys(XA), ...JA, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", ti.GROUP, ti.SWAP_OPACITY, ti.PRIMARY, ti.SECONDARY].concat(Vv.map((e) => "".concat(e, "x"))).concat(ZA.map((e) => "w-".concat(e))), t4 = {
  "Font Awesome 5 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 5 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal"
  },
  "Font Awesome 5 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 5 Duotone": {
    900: "fad"
  }
};
const fn = "___FONT_AWESOME___", Kc = 16, Hv = "fa", Uv = "svg-inline--fa", br = "data-fa-i2svg", Xc = "data-fa-pseudo-element", n4 = "data-fa-pseudo-element-pending", Df = "data-prefix", zf = "data-icon", Pm = "fontawesome-i2svg", r4 = "async", o4 = ["HTML", "HEAD", "STYLE", "SCRIPT"], Yv = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Ia(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[rt];
    }
  });
}
const Bv = G({}, Dv);
Bv[rt] = G(G(G(G({}, {
  "fa-duotone": "duotone"
}), Dv[rt]), Om.kit), Om["kit-duotone"]);
const a4 = Ia(Bv), Qc = G({}, zA);
Qc[rt] = G(G(G(G({}, {
  duotone: "fad"
}), Qc[rt]), Sm.kit), Sm["kit-duotone"]);
const Am = Ia(Qc), Jc = G({}, Gc);
Jc[rt] = G(G({}, Jc[rt]), YA.kit);
const Wf = Ia(Jc), Zc = G({}, KA);
Zc[rt] = G(G({}, Zc[rt]), HA.kit);
Ia(Zc);
const i4 = TA, Gv = "fa-layers-text", s4 = MA, l4 = G({}, FA);
Ia(l4);
const c4 = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], hl = RA, u4 = [...VA, ...e4], Bo = Bn.FontAwesomeConfig || {};
function f4(e) {
  var t = Ve.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function d4(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
Ve && typeof Ve.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, n] = e;
  const r = d4(f4(t));
  r != null && (Bo[n] = r);
});
const qv = {
  styleDefault: "solid",
  familyDefault: rt,
  cssPrefix: Hv,
  replacementClass: Uv,
  autoReplaceSvg: !0,
  autoAddCss: !0,
  autoA11y: !0,
  searchPseudoElements: !1,
  observeMutations: !0,
  mutateApproach: "async",
  keepOriginalSource: !0,
  measurePerformance: !1,
  showMissingIcons: !0
};
Bo.familyPrefix && (Bo.cssPrefix = Bo.familyPrefix);
const no = G(G({}, qv), Bo);
no.autoReplaceSvg || (no.observeMutations = !1);
const re = {};
Object.keys(qv).forEach((e) => {
  Object.defineProperty(re, e, {
    enumerable: !0,
    set: function(t) {
      no[e] = t, Go.forEach((n) => n(re));
    },
    get: function() {
      return no[e];
    }
  });
});
Object.defineProperty(re, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    no.cssPrefix = e, Go.forEach((t) => t(re));
  },
  get: function() {
    return no.cssPrefix;
  }
});
Bn.FontAwesomeConfig = re;
const Go = [];
function p4(e) {
  return Go.push(e), () => {
    Go.splice(Go.indexOf(e), 1);
  };
}
const On = Kc, Yt = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function m4(e) {
  if (!e || !yn)
    return;
  const t = Ve.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = Ve.head.childNodes;
  let r = null;
  for (let o = n.length - 1; o > -1; o--) {
    const a = n[o], i = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = a);
  }
  return Ve.head.insertBefore(t, r), e;
}
const g4 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function ua() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += g4[Math.random() * 62 | 0];
  return t;
}
function mo(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function Vf(e) {
  return e.classList ? mo(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function Kv(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function h4(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(Kv(e[n]), '" '), "").trim();
}
function ms(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function Hf(e) {
  return e.size !== Yt.size || e.x !== Yt.x || e.y !== Yt.y || e.rotate !== Yt.rotate || e.flipX || e.flipY;
}
function b4(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const o = {
    transform: "translate(".concat(n / 2, " 256)")
  }, a = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), l = {
    transform: "".concat(a, " ").concat(i, " ").concat(s)
  }, c = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: l,
    path: c
  };
}
function y4(e) {
  let {
    transform: t,
    width: n = Kc,
    height: r = Kc,
    startCentered: o = !1
  } = e, a = "";
  return o && Lv ? a += "translate(".concat(t.x / On - n / 2, "em, ").concat(t.y / On - r / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / On, "em), calc(-50% + ").concat(t.y / On, "em)) ") : a += "translate(".concat(t.x / On, "em, ").concat(t.y / On, "em) "), a += "scale(".concat(t.size / On * (t.flipX ? -1 : 1), ", ").concat(t.size / On * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var v4 = `:root, :host {
  --fa-font-solid: normal 900 1em/1 "Font Awesome 6 Free";
  --fa-font-regular: normal 400 1em/1 "Font Awesome 6 Free";
  --fa-font-light: normal 300 1em/1 "Font Awesome 6 Pro";
  --fa-font-thin: normal 100 1em/1 "Font Awesome 6 Pro";
  --fa-font-duotone: normal 900 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-regular: normal 400 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-light: normal 300 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-thin: normal 100 1em/1 "Font Awesome 6 Duotone";
  --fa-font-brands: normal 400 1em/1 "Font Awesome 6 Brands";
  --fa-font-sharp-solid: normal 900 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-regular: normal 400 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-light: normal 300 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-thin: normal 100 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-duotone-solid: normal 900 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-regular: normal 400 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-light: normal 300 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-thin: normal 100 1em/1 "Font Awesome 6 Sharp Duotone";
}

svg:not(:root).svg-inline--fa, svg:not(:host).svg-inline--fa {
  overflow: visible;
  box-sizing: content-box;
}

.svg-inline--fa {
  display: var(--fa-display, inline-block);
  height: 1em;
  overflow: visible;
  vertical-align: -0.125em;
}
.svg-inline--fa.fa-2xs {
  vertical-align: 0.1em;
}
.svg-inline--fa.fa-xs {
  vertical-align: 0em;
}
.svg-inline--fa.fa-sm {
  vertical-align: -0.0714285705em;
}
.svg-inline--fa.fa-lg {
  vertical-align: -0.2em;
}
.svg-inline--fa.fa-xl {
  vertical-align: -0.25em;
}
.svg-inline--fa.fa-2xl {
  vertical-align: -0.3125em;
}
.svg-inline--fa.fa-pull-left {
  margin-right: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-pull-right {
  margin-left: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-li {
  width: var(--fa-li-width, 2em);
  top: 0.25em;
}
.svg-inline--fa.fa-fw {
  width: var(--fa-fw-width, 1.25em);
}

.fa-layers svg.svg-inline--fa {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
}

.fa-layers-counter, .fa-layers-text {
  display: inline-block;
  position: absolute;
  text-align: center;
}

.fa-layers {
  display: inline-block;
  height: 1em;
  position: relative;
  text-align: center;
  vertical-align: -0.125em;
  width: 1em;
}
.fa-layers svg.svg-inline--fa {
  transform-origin: center center;
}

.fa-layers-text {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center center;
}

.fa-layers-counter {
  background-color: var(--fa-counter-background-color, #ff253a);
  border-radius: var(--fa-counter-border-radius, 1em);
  box-sizing: border-box;
  color: var(--fa-inverse, #fff);
  line-height: var(--fa-counter-line-height, 1);
  max-width: var(--fa-counter-max-width, 5em);
  min-width: var(--fa-counter-min-width, 1.5em);
  overflow: hidden;
  padding: var(--fa-counter-padding, 0.25em 0.5em);
  right: var(--fa-right, 0);
  text-overflow: ellipsis;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-counter-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-bottom-right {
  bottom: var(--fa-bottom, 0);
  right: var(--fa-right, 0);
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom right;
}

.fa-layers-bottom-left {
  bottom: var(--fa-bottom, 0);
  left: var(--fa-left, 0);
  right: auto;
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom left;
}

.fa-layers-top-right {
  top: var(--fa-top, 0);
  right: var(--fa-right, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-top-left {
  left: var(--fa-left, 0);
  right: auto;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top left;
}

.fa-1x {
  font-size: 1em;
}

.fa-2x {
  font-size: 2em;
}

.fa-3x {
  font-size: 3em;
}

.fa-4x {
  font-size: 4em;
}

.fa-5x {
  font-size: 5em;
}

.fa-6x {
  font-size: 6em;
}

.fa-7x {
  font-size: 7em;
}

.fa-8x {
  font-size: 8em;
}

.fa-9x {
  font-size: 9em;
}

.fa-10x {
  font-size: 10em;
}

.fa-2xs {
  font-size: 0.625em;
  line-height: 0.1em;
  vertical-align: 0.225em;
}

.fa-xs {
  font-size: 0.75em;
  line-height: 0.0833333337em;
  vertical-align: 0.125em;
}

.fa-sm {
  font-size: 0.875em;
  line-height: 0.0714285718em;
  vertical-align: 0.0535714295em;
}

.fa-lg {
  font-size: 1.25em;
  line-height: 0.05em;
  vertical-align: -0.075em;
}

.fa-xl {
  font-size: 1.5em;
  line-height: 0.0416666682em;
  vertical-align: -0.125em;
}

.fa-2xl {
  font-size: 2em;
  line-height: 0.03125em;
  vertical-align: -0.1875em;
}

.fa-fw {
  text-align: center;
  width: 1.25em;
}

.fa-ul {
  list-style-type: none;
  margin-left: var(--fa-li-margin, 2.5em);
  padding-left: 0;
}
.fa-ul > li {
  position: relative;
}

.fa-li {
  left: calc(-1 * var(--fa-li-width, 2em));
  position: absolute;
  text-align: center;
  width: var(--fa-li-width, 2em);
  line-height: inherit;
}

.fa-border {
  border-color: var(--fa-border-color, #eee);
  border-radius: var(--fa-border-radius, 0.1em);
  border-style: var(--fa-border-style, solid);
  border-width: var(--fa-border-width, 0.08em);
  padding: var(--fa-border-padding, 0.2em 0.25em 0.15em);
}

.fa-pull-left {
  float: left;
  margin-right: var(--fa-pull-margin, 0.3em);
}

.fa-pull-right {
  float: right;
  margin-left: var(--fa-pull-margin, 0.3em);
}

.fa-beat {
  animation-name: fa-beat;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-bounce {
  animation-name: fa-bounce;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.28, 0.84, 0.42, 1));
}

.fa-fade {
  animation-name: fa-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-beat-fade {
  animation-name: fa-beat-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-flip {
  animation-name: fa-flip;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-shake {
  animation-name: fa-shake;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin {
  animation-name: fa-spin;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 2s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin-reverse {
  --fa-animation-direction: reverse;
}

.fa-pulse,
.fa-spin-pulse {
  animation-name: fa-spin;
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, steps(8));
}

@media (prefers-reduced-motion: reduce) {
  .fa-beat,
.fa-bounce,
.fa-fade,
.fa-beat-fade,
.fa-flip,
.fa-pulse,
.fa-shake,
.fa-spin,
.fa-spin-pulse {
    animation-delay: -1ms;
    animation-duration: 1ms;
    animation-iteration-count: 1;
    transition-delay: 0s;
    transition-duration: 0s;
  }
}
@keyframes fa-beat {
  0%, 90% {
    transform: scale(1);
  }
  45% {
    transform: scale(var(--fa-beat-scale, 1.25));
  }
}
@keyframes fa-bounce {
  0% {
    transform: scale(1, 1) translateY(0);
  }
  10% {
    transform: scale(var(--fa-bounce-start-scale-x, 1.1), var(--fa-bounce-start-scale-y, 0.9)) translateY(0);
  }
  30% {
    transform: scale(var(--fa-bounce-jump-scale-x, 0.9), var(--fa-bounce-jump-scale-y, 1.1)) translateY(var(--fa-bounce-height, -0.5em));
  }
  50% {
    transform: scale(var(--fa-bounce-land-scale-x, 1.05), var(--fa-bounce-land-scale-y, 0.95)) translateY(0);
  }
  57% {
    transform: scale(1, 1) translateY(var(--fa-bounce-rebound, -0.125em));
  }
  64% {
    transform: scale(1, 1) translateY(0);
  }
  100% {
    transform: scale(1, 1) translateY(0);
  }
}
@keyframes fa-fade {
  50% {
    opacity: var(--fa-fade-opacity, 0.4);
  }
}
@keyframes fa-beat-fade {
  0%, 100% {
    opacity: var(--fa-beat-fade-opacity, 0.4);
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(var(--fa-beat-fade-scale, 1.125));
  }
}
@keyframes fa-flip {
  50% {
    transform: rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), var(--fa-flip-angle, -180deg));
  }
}
@keyframes fa-shake {
  0% {
    transform: rotate(-15deg);
  }
  4% {
    transform: rotate(15deg);
  }
  8%, 24% {
    transform: rotate(-18deg);
  }
  12%, 28% {
    transform: rotate(18deg);
  }
  16% {
    transform: rotate(-22deg);
  }
  20% {
    transform: rotate(22deg);
  }
  32% {
    transform: rotate(-12deg);
  }
  36% {
    transform: rotate(12deg);
  }
  40%, 100% {
    transform: rotate(0deg);
  }
}
@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.fa-rotate-90 {
  transform: rotate(90deg);
}

.fa-rotate-180 {
  transform: rotate(180deg);
}

.fa-rotate-270 {
  transform: rotate(270deg);
}

.fa-flip-horizontal {
  transform: scale(-1, 1);
}

.fa-flip-vertical {
  transform: scale(1, -1);
}

.fa-flip-both,
.fa-flip-horizontal.fa-flip-vertical {
  transform: scale(-1, -1);
}

.fa-rotate-by {
  transform: rotate(var(--fa-rotate-angle, 0));
}

.fa-stack {
  display: inline-block;
  vertical-align: middle;
  height: 2em;
  position: relative;
  width: 2.5em;
}

.fa-stack-1x,
.fa-stack-2x {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
  z-index: var(--fa-stack-z-index, auto);
}

.svg-inline--fa.fa-stack-1x {
  height: 1em;
  width: 1.25em;
}
.svg-inline--fa.fa-stack-2x {
  height: 2em;
  width: 2.5em;
}

.fa-inverse {
  color: var(--fa-inverse, #fff);
}

.sr-only,
.fa-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:not(:focus),
.fa-sr-only-focusable:not(:focus) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.svg-inline--fa .fa-primary {
  fill: var(--fa-primary-color, currentColor);
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa .fa-secondary {
  fill: var(--fa-secondary-color, currentColor);
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-primary {
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-secondary {
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa mask .fa-primary,
.svg-inline--fa mask .fa-secondary {
  fill: black;
}`;
function Xv() {
  const e = Hv, t = Uv, n = re.cssPrefix, r = re.replacementClass;
  let o = v4;
  if (n !== e || r !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return o;
}
let Cm = !1;
function bl() {
  re.autoAddCss && !Cm && (m4(Xv()), Cm = !0);
}
var x4 = {
  mixout() {
    return {
      dom: {
        css: Xv,
        insertCss: bl
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        bl();
      },
      beforeI2svg() {
        bl();
      }
    };
  }
};
const dn = Bn || {};
dn[fn] || (dn[fn] = {});
dn[fn].styles || (dn[fn].styles = {});
dn[fn].hooks || (dn[fn].hooks = {});
dn[fn].shims || (dn[fn].shims = []);
var Bt = dn[fn];
const Qv = [], Jv = function() {
  Ve.removeEventListener("DOMContentLoaded", Jv), _i = 1, Qv.map((e) => e());
};
let _i = !1;
yn && (_i = (Ve.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(Ve.readyState), _i || Ve.addEventListener("DOMContentLoaded", Jv));
function w4(e) {
  yn && (_i ? setTimeout(e, 0) : Qv.push(e));
}
function Ta(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? Kv(e) : "<".concat(t, " ").concat(h4(n), ">").concat(r.map(Ta).join(""), "</").concat(t, ">");
}
function $m(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var yl = function(e, t, n, r) {
  var o = Object.keys(e), a = o.length, i = t, s, l, c;
  for (n === void 0 ? (s = 1, c = e[o[0]]) : (s = 0, c = n); s < a; s++)
    l = o[s], c = i(c, e[l], l, e);
  return c;
};
function k4(e) {
  const t = [];
  let n = 0;
  const r = e.length;
  for (; n < r; ) {
    const o = e.charCodeAt(n++);
    if (o >= 55296 && o <= 56319 && n < r) {
      const a = e.charCodeAt(n++);
      (a & 64512) == 56320 ? t.push(((o & 1023) << 10) + (a & 1023) + 65536) : (t.push(o), n--);
    } else
      t.push(o);
  }
  return t;
}
function Zv(e) {
  const t = k4(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function E4(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), o;
  return r >= 55296 && r <= 56319 && n > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (r - 55296) * 1024 + o - 56320 + 65536 : r;
}
function Nm(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function eu(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, o = Nm(t);
  typeof Bt.hooks.addPack == "function" && !r ? Bt.hooks.addPack(e, Nm(t)) : Bt.styles[e] = G(G({}, Bt.styles[e] || {}), o), e === "fas" && eu("fa", t);
}
const {
  styles: fa,
  shims: O4
} = Bt, e1 = Object.keys(Wf), S4 = e1.reduce((e, t) => (e[t] = Object.keys(Wf[t]), e), {});
let Uf = null, t1 = {}, n1 = {}, r1 = {}, o1 = {}, a1 = {};
function P4(e) {
  return ~u4.indexOf(e);
}
function A4(e, t) {
  const n = t.split("-"), r = n[0], o = n.slice(1).join("-");
  return r === e && o !== "" && !P4(o) ? o : null;
}
const i1 = () => {
  const e = (r) => yl(fa, (o, a, i) => (o[i] = yl(a, r, {}), o), {});
  t1 = e((r, o, a) => (o[3] && (r[o[3]] = a), o[2] && o[2].filter((i) => typeof i == "number").forEach((i) => {
    r[i.toString(16)] = a;
  }), r)), n1 = e((r, o, a) => (r[a] = a, o[2] && o[2].filter((i) => typeof i == "string").forEach((i) => {
    r[i] = a;
  }), r)), a1 = e((r, o, a) => {
    const i = o[2];
    return r[a] = a, i.forEach((s) => {
      r[s] = a;
    }), r;
  });
  const t = "far" in fa || re.autoFetchSvg, n = yl(O4, (r, o) => {
    const a = o[0];
    let i = o[1];
    const s = o[2];
    return i === "far" && !t && (i = "fas"), typeof a == "string" && (r.names[a] = {
      prefix: i,
      iconName: s
    }), typeof a == "number" && (r.unicodes[a.toString(16)] = {
      prefix: i,
      iconName: s
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  r1 = n.names, o1 = n.unicodes, Uf = gs(re.styleDefault, {
    family: re.familyDefault
  });
};
p4((e) => {
  Uf = gs(e.styleDefault, {
    family: re.familyDefault
  });
});
i1();
function Yf(e, t) {
  return (t1[e] || {})[t];
}
function C4(e, t) {
  return (n1[e] || {})[t];
}
function ir(e, t) {
  return (a1[e] || {})[t];
}
function s1(e) {
  return r1[e] || {
    prefix: null,
    iconName: null
  };
}
function $4(e) {
  const t = o1[e], n = Yf("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Gn() {
  return Uf;
}
const l1 = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function N4(e) {
  let t = rt;
  const n = e1.reduce((r, o) => (r[o] = "".concat(re.cssPrefix, "-").concat(o), r), {});
  return Wv.forEach((r) => {
    (e.includes(n[r]) || e.some((o) => S4[r].includes(o))) && (t = r);
  }), t;
}
function gs(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = rt
  } = t, r = a4[n][e];
  if (n === ps && !e)
    return "fad";
  const o = Am[n][e] || Am[n][r], a = e in Bt.styles ? e : null;
  return o || a || null;
}
function I4(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const o = A4(re.cssPrefix, r);
    o ? n = o : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function Im(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function hs(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const o = qc.concat(GA), a = Im(e.filter((f) => o.includes(f))), i = Im(e.filter((f) => !qc.includes(f))), s = a.filter((f) => (r = f, !zv.includes(f))), [l = null] = s, c = N4(a), u = G(G({}, I4(i)), {}, {
    prefix: gs(l, {
      family: c
    })
  });
  return G(G(G({}, u), j4({
    values: e,
    family: c,
    styles: fa,
    config: re,
    canonical: u,
    givenPrefix: r
  })), T4(n, r, u));
}
function T4(e, t, n) {
  let {
    prefix: r,
    iconName: o
  } = n;
  if (e || !r || !o)
    return {
      prefix: r,
      iconName: o
    };
  const a = t === "fa" ? s1(o) : {}, i = ir(r, o);
  return o = a.iconName || i || o, r = a.prefix || r, r === "far" && !fa.far && fa.fas && !re.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: o
  };
}
const M4 = Wv.filter((e) => e !== rt || e !== ps), R4 = Object.keys(Gc).filter((e) => e !== rt).map((e) => Object.keys(Gc[e])).flat();
function j4(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: o = "",
    styles: a = {},
    config: i = {}
  } = e, s = n === ps, l = t.includes("fa-duotone") || t.includes("fad"), c = i.familyDefault === "duotone", u = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (l || c || u) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && M4.includes(n) && (Object.keys(a).find((f) => R4.includes(f)) || i.autoFetchSvg)) {
    const f = DA.get(n).defaultShortPrefixId;
    r.prefix = f, r.iconName = ir(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || o === "fa") && (r.prefix = Gn() || "fas"), r;
}
class _4 {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const o = n.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = G(G({}, this.definitions[a] || {}), o[a]), eu(a, o[a]);
      const i = Wf[rt][a];
      i && eu(i, o[a]), i1();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, n) {
    const r = n.prefix && n.iconName && n.icon ? {
      0: n
    } : n;
    return Object.keys(r).map((o) => {
      const {
        prefix: a,
        iconName: i,
        icon: s
      } = r[o], l = s[2];
      t[a] || (t[a] = {}), l.length > 0 && l.forEach((c) => {
        typeof c == "string" && (t[a][c] = s);
      }), t[a][i] = s;
    }), t;
  }
}
let Tm = [], jr = {};
const Br = {}, F4 = Object.keys(Br);
function L4(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return Tm = e, jr = {}, Object.keys(Br).forEach((r) => {
    F4.indexOf(r) === -1 && delete Br[r];
  }), Tm.forEach((r) => {
    const o = r.mixout ? r.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (n[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((i) => {
        n[a] || (n[a] = {}), n[a][i] = o[a][i];
      });
    }), r.hooks) {
      const a = r.hooks();
      Object.keys(a).forEach((i) => {
        jr[i] || (jr[i] = []), jr[i].push(a[i]);
      });
    }
    r.provides && r.provides(Br);
  }), n;
}
function tu(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), o = 2; o < n; o++)
    r[o - 2] = arguments[o];
  return (jr[e] || []).forEach((a) => {
    t = a.apply(null, [t, ...r]);
  }), t;
}
function yr(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (jr[e] || []).forEach((o) => {
    o.apply(null, n);
  });
}
function qn() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Br[e] ? Br[e].apply(null, t) : void 0;
}
function nu(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || Gn();
  if (t)
    return t = ir(n, t) || t, $m(c1.definitions, n, t) || $m(Bt.styles, n, t);
}
const c1 = new _4(), D4 = () => {
  re.autoReplaceSvg = !1, re.observeMutations = !1, yr("noAuto");
}, z4 = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return yn ? (yr("beforeI2svg", e), qn("pseudoElements2svg", e), qn("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    re.autoReplaceSvg === !1 && (re.autoReplaceSvg = !0), re.observeMutations = !0, w4(() => {
      V4({
        autoReplaceSvgRoot: t
      }), yr("watch", e);
    });
  }
}, W4 = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: ir(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = gs(e[0]);
      return {
        prefix: n,
        iconName: ir(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(re.cssPrefix, "-")) > -1 || e.match(i4))) {
      const t = hs(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Gn(),
        iconName: ir(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Gn();
      return {
        prefix: t,
        iconName: ir(t, e) || e
      };
    }
  }
}, bt = {
  noAuto: D4,
  config: re,
  dom: z4,
  parse: W4,
  library: c1,
  findIconDefinition: nu,
  toHtml: Ta
}, V4 = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = Ve
  } = e;
  (Object.keys(Bt.styles).length > 0 || re.autoFetchSvg) && yn && re.autoReplaceSvg && bt.dom.i2svg({
    node: t
  });
};
function bs(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => Ta(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!yn) return;
      const n = Ve.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function H4(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: o,
    styles: a,
    transform: i
  } = e;
  if (Hf(i) && n.found && !r.found) {
    const {
      width: s,
      height: l
    } = n, c = {
      x: s / l / 2,
      y: 0.5
    };
    o.style = ms(G(G({}, a), {}, {
      "transform-origin": "".concat(c.x + i.x / 16, "em ").concat(c.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function U4(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: o,
    symbol: a
  } = e;
  const i = a === !0 ? "".concat(t, "-").concat(re.cssPrefix, "-").concat(n) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: G(G({}, o), {}, {
        id: i
      }),
      children: r
    }]
  }];
}
function Bf(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: o,
    transform: a,
    symbol: i,
    title: s,
    maskId: l,
    titleId: c,
    extra: u,
    watchable: f = !1
  } = e, {
    width: d,
    height: p
  } = n.found ? n : t, b = UA.includes(r), m = [re.replacementClass, o ? "".concat(re.cssPrefix, "-").concat(o) : ""].filter((h) => u.classes.indexOf(h) === -1).filter((h) => h !== "" || !!h).concat(u.classes).join(" ");
  let g = {
    children: [],
    attributes: G(G({}, u.attributes), {}, {
      "data-prefix": r,
      "data-icon": o,
      class: m,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(d, " ").concat(p)
    })
  };
  const v = b && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(d / p * 16 * 0.0625, "em")
  } : {};
  f && (g.attributes[br] = ""), s && (g.children.push({
    tag: "title",
    attributes: {
      id: g.attributes["aria-labelledby"] || "title-".concat(c || ua())
    },
    children: [s]
  }), delete g.attributes.title);
  const k = G(G({}, g), {}, {
    prefix: r,
    iconName: o,
    main: t,
    mask: n,
    maskId: l,
    transform: a,
    symbol: i,
    styles: G(G({}, v), u.styles)
  }), {
    children: x,
    attributes: O
  } = n.found && t.found ? qn("generateAbstractMask", k) || {
    children: [],
    attributes: {}
  } : qn("generateAbstractIcon", k) || {
    children: [],
    attributes: {}
  };
  return k.children = x, k.attributes = O, i ? U4(k) : H4(k);
}
function Mm(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: o,
    title: a,
    extra: i,
    watchable: s = !1
  } = e, l = G(G(G({}, i.attributes), a ? {
    title: a
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (l[br] = "");
  const c = G({}, i.styles);
  Hf(o) && (c.transform = y4({
    transform: o,
    startCentered: !0,
    width: n,
    height: r
  }), c["-webkit-transform"] = c.transform);
  const u = ms(c);
  u.length > 0 && (l.style = u);
  const f = [];
  return f.push({
    tag: "span",
    attributes: l,
    children: [t]
  }), a && f.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [a]
  }), f;
}
function Y4(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, o = G(G(G({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), a = ms(r.styles);
  a.length > 0 && (o.style = a);
  const i = [];
  return i.push({
    tag: "span",
    attributes: o,
    children: [t]
  }), n && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [n]
  }), i;
}
const {
  styles: vl
} = Bt;
function ru(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let o = null;
  return Array.isArray(r) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(re.cssPrefix, "-").concat(hl.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(re.cssPrefix, "-").concat(hl.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(re.cssPrefix, "-").concat(hl.PRIMARY),
        fill: "currentColor",
        d: r[1]
      }
    }]
  } : o = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: r
    }
  }, {
    found: !0,
    width: t,
    height: n,
    icon: o
  };
}
const B4 = {
  found: !1,
  width: 512,
  height: 512
};
function G4(e, t) {
  !Yv && !re.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function ou(e, t) {
  let n = t;
  return t === "fa" && re.styleDefault !== null && (t = Gn()), new Promise((r, o) => {
    if (n === "fa") {
      const a = s1(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && vl[t] && vl[t][e]) {
      const a = vl[t][e];
      return r(ru(a));
    }
    G4(e, t), r(G(G({}, B4), {}, {
      icon: re.showMissingIcons && e ? qn("missingIconAbstract") || {} : {}
    }));
  });
}
const Rm = () => {
}, au = re.measurePerformance && ei && ei.mark && ei.measure ? ei : {
  mark: Rm,
  measure: Rm
}, Fo = 'FA "6.7.2"', q4 = (e) => (au.mark("".concat(Fo, " ").concat(e, " begins")), () => u1(e)), u1 = (e) => {
  au.mark("".concat(Fo, " ").concat(e, " ends")), au.measure("".concat(Fo, " ").concat(e), "".concat(Fo, " ").concat(e, " begins"), "".concat(Fo, " ").concat(e, " ends"));
};
var Gf = {
  begin: q4,
  end: u1
};
const gi = () => {
};
function jm(e) {
  return typeof (e.getAttribute ? e.getAttribute(br) : null) == "string";
}
function K4(e) {
  const t = e.getAttribute ? e.getAttribute(Df) : null, n = e.getAttribute ? e.getAttribute(zf) : null;
  return t && n;
}
function X4(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(re.replacementClass);
}
function Q4() {
  return re.autoReplaceSvg === !0 ? hi.replace : hi[re.autoReplaceSvg] || hi.replace;
}
function J4(e) {
  return Ve.createElementNS("http://www.w3.org/2000/svg", e);
}
function Z4(e) {
  return Ve.createElement(e);
}
function f1(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? J4 : Z4
  } = t;
  if (typeof e == "string")
    return Ve.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    r.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    r.appendChild(f1(o, {
      ceFn: n
    }));
  }), r;
}
function eC(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const hi = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(f1(n), t);
      }), t.getAttribute(br) === null && re.keepOriginalSource) {
        let n = Ve.createComment(eC(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~Vf(t).indexOf(re.replacementClass))
      return hi.replace(e);
    const r = new RegExp("".concat(re.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const a = n[0].attributes.class.split(" ").reduce((i, s) => (s === re.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = n.map((a) => Ta(a)).join(`
`);
    t.setAttribute(br, ""), t.innerHTML = o;
  }
};
function _m(e) {
  e();
}
function d1(e, t) {
  const n = typeof t == "function" ? t : gi;
  if (e.length === 0)
    n();
  else {
    let r = _m;
    re.mutateApproach === r4 && (r = Bn.requestAnimationFrame || _m), r(() => {
      const o = Q4(), a = Gf.begin("mutate");
      e.map(o), a(), n();
    });
  }
}
let qf = !1;
function p1() {
  qf = !0;
}
function iu() {
  qf = !1;
}
let Fi = null;
function Fm(e) {
  if (!Em || !re.observeMutations)
    return;
  const {
    treeCallback: t = gi,
    nodeCallback: n = gi,
    pseudoElementsCallback: r = gi,
    observeMutationsRoot: o = Ve
  } = e;
  Fi = new Em((a) => {
    if (qf) return;
    const i = Gn();
    mo(a).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !jm(s.addedNodes[0]) && (re.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && re.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && jm(s.target) && ~c4.indexOf(s.attributeName))
        if (s.attributeName === "class" && K4(s.target)) {
          const {
            prefix: l,
            iconName: c
          } = hs(Vf(s.target));
          s.target.setAttribute(Df, l || i), c && s.target.setAttribute(zf, c);
        } else X4(s.target) && n(s.target);
    });
  }), yn && Fi.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function tC() {
  Fi && Fi.disconnect();
}
function nC(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, o) => {
    const a = o.split(":"), i = a[0], s = a.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function rC(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = hs(Vf(e));
  return o.prefix || (o.prefix = Gn()), t && n && (o.prefix = t, o.iconName = n), o.iconName && o.prefix || (o.prefix && r.length > 0 && (o.iconName = C4(o.prefix, e.innerText) || Yf(o.prefix, Zv(e.innerText))), !o.iconName && re.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function oC(e) {
  const t = mo(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return re.autoA11y && (n ? t["aria-labelledby"] = "".concat(re.replacementClass, "-title-").concat(r || ua()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function aC() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: Yt,
    symbol: !1,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    extra: {
      classes: [],
      styles: {},
      attributes: {}
    }
  };
}
function Lm(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: o
  } = rC(e), a = oC(e), i = tu("parseNodeAttributes", {}, e);
  let s = t.styleParser ? nC(e) : [];
  return G({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: Yt,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: o,
      styles: s,
      attributes: a
    }
  }, i);
}
const {
  styles: iC
} = Bt;
function m1(e) {
  const t = re.autoReplaceSvg === "nest" ? Lm(e, {
    styleParser: !1
  }) : Lm(e);
  return ~t.extra.classes.indexOf(Gv) ? qn("generateLayersText", e, t) : qn("generateSvgReplacementMutation", e, t);
}
function sC() {
  return [...WA, ...qc];
}
function Dm(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!yn) return Promise.resolve();
  const n = Ve.documentElement.classList, r = (u) => n.add("".concat(Pm, "-").concat(u)), o = (u) => n.remove("".concat(Pm, "-").concat(u)), a = re.autoFetchSvg ? sC() : zv.concat(Object.keys(iC));
  a.includes("fa") || a.push("fa");
  const i = [".".concat(Gv, ":not([").concat(br, "])")].concat(a.map((u) => ".".concat(u, ":not([").concat(br, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = mo(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), o("complete");
  else
    return Promise.resolve();
  const l = Gf.begin("onTree"), c = s.reduce((u, f) => {
    try {
      const d = m1(f);
      d && u.push(d);
    } catch (d) {
      Yv || d.name === "MissingIcon" && console.error(d);
    }
    return u;
  }, []);
  return new Promise((u, f) => {
    Promise.all(c).then((d) => {
      d1(d, () => {
        r("active"), r("complete"), o("pending"), typeof t == "function" && t(), l(), u();
      });
    }).catch((d) => {
      l(), f(d);
    });
  });
}
function lC(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  m1(e).then((n) => {
    n && d1([n], t);
  });
}
function cC(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : nu(t || {});
    let {
      mask: o
    } = n;
    return o && (o = (o || {}).icon ? o : nu(o || {})), e(r, G(G({}, n), {}, {
      mask: o
    }));
  };
}
const uC = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = Yt,
    symbol: r = !1,
    mask: o = null,
    maskId: a = null,
    title: i = null,
    titleId: s = null,
    classes: l = [],
    attributes: c = {},
    styles: u = {}
  } = t;
  if (!e) return;
  const {
    prefix: f,
    iconName: d,
    icon: p
  } = e;
  return bs(G({
    type: "icon"
  }, e), () => (yr("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), re.autoA11y && (i ? c["aria-labelledby"] = "".concat(re.replacementClass, "-title-").concat(s || ua()) : (c["aria-hidden"] = "true", c.focusable = "false")), Bf({
    icons: {
      main: ru(p),
      mask: o ? ru(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: f,
    iconName: d,
    transform: G(G({}, Yt), n),
    symbol: r,
    title: i,
    maskId: a,
    titleId: s,
    extra: {
      attributes: c,
      styles: u,
      classes: l
    }
  })));
};
var fC = {
  mixout() {
    return {
      icon: cC(uC)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Dm, e.nodeCallback = lC, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = Ve,
        callback: r = () => {
        }
      } = t;
      return Dm(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: o,
        titleId: a,
        prefix: i,
        transform: s,
        symbol: l,
        mask: c,
        maskId: u,
        extra: f
      } = n;
      return new Promise((d, p) => {
        Promise.all([ou(r, i), c.iconName ? ou(c.iconName, c.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((b) => {
          let [m, g] = b;
          d([t, Bf({
            icons: {
              main: m,
              mask: g
            },
            prefix: i,
            iconName: r,
            transform: s,
            symbol: l,
            maskId: u,
            title: o,
            titleId: a,
            extra: f,
            watchable: !0
          })]);
        }).catch(p);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: o,
        transform: a,
        styles: i
      } = t;
      const s = ms(i);
      s.length > 0 && (r.style = s);
      let l;
      return Hf(a) && (l = qn("generateAbstractTransformGrouping", {
        main: o,
        transform: a,
        containerWidth: o.width,
        iconWidth: o.width
      })), n.push(l || o.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, dC = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return bs({
          type: "layer"
        }, () => {
          yr("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let r = [];
          return e((o) => {
            Array.isArray(o) ? o.map((a) => {
              r = r.concat(a.abstract);
            }) : r = r.concat(o.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(re.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, pC = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: n = null,
          classes: r = [],
          attributes: o = {},
          styles: a = {}
        } = t;
        return bs({
          type: "counter",
          content: e
        }, () => (yr("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Y4({
          content: e.toString(),
          title: n,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(re.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, mC = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = Yt,
          title: r = null,
          classes: o = [],
          attributes: a = {},
          styles: i = {}
        } = t;
        return bs({
          type: "text",
          content: e
        }, () => (yr("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Mm({
          content: e,
          transform: G(G({}, Yt), n),
          title: r,
          extra: {
            attributes: a,
            styles: i,
            classes: ["".concat(re.cssPrefix, "-layers-text"), ...o]
          }
        })));
      }
    };
  },
  provides(e) {
    e.generateLayersText = function(t, n) {
      const {
        title: r,
        transform: o,
        extra: a
      } = n;
      let i = null, s = null;
      if (Lv) {
        const l = parseInt(getComputedStyle(t).fontSize, 10), c = t.getBoundingClientRect();
        i = c.width / l, s = c.height / l;
      }
      return re.autoA11y && !r && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, Mm({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: o,
        title: r,
        extra: a,
        watchable: !0
      })]);
    };
  }
};
const gC = new RegExp('"', "ug"), zm = [1105920, 1112319], Wm = G(G(G(G({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), LA), t4), qA), su = Object.keys(Wm).reduce((e, t) => (e[t.toLowerCase()] = Wm[t], e), {}), hC = Object.keys(su).reduce((e, t) => {
  const n = su[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function bC(e) {
  const t = e.replace(gC, ""), n = E4(t, 0), r = n >= zm[0] && n <= zm[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: Zv(o ? t[0] : t),
    isSecondary: r || o
  };
}
function yC(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), o = isNaN(r) ? "normal" : r;
  return (su[n] || {})[o] || hC[n];
}
function Vm(e, t) {
  const n = "".concat(n4).concat(t.replace(":", "-"));
  return new Promise((r, o) => {
    if (e.getAttribute(n) !== null)
      return r();
    const a = mo(e.children).filter((f) => f.getAttribute(Xc) === t)[0], i = Bn.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), l = s.match(s4), c = i.getPropertyValue("font-weight"), u = i.getPropertyValue("content");
    if (a && !l)
      return e.removeChild(a), r();
    if (l && u !== "none" && u !== "") {
      const f = i.getPropertyValue("content");
      let d = yC(s, c);
      const {
        value: p,
        isSecondary: b
      } = bC(f), m = l[0].startsWith("FontAwesome");
      let g = Yf(d, p), v = g;
      if (m) {
        const k = $4(p);
        k.iconName && k.prefix && (g = k.iconName, d = k.prefix);
      }
      if (g && !b && (!a || a.getAttribute(Df) !== d || a.getAttribute(zf) !== v)) {
        e.setAttribute(n, v), a && e.removeChild(a);
        const k = aC(), {
          extra: x
        } = k;
        x.attributes[Xc] = t, ou(g, d).then((O) => {
          const h = Bf(G(G({}, k), {}, {
            icons: {
              main: O,
              mask: l1()
            },
            prefix: d,
            iconName: v,
            extra: x,
            watchable: !0
          })), L = Ve.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(L, e.firstChild) : e.appendChild(L), L.outerHTML = h.map((_) => Ta(_)).join(`
`), e.removeAttribute(n), r();
        }).catch(o);
      } else
        r();
    } else
      r();
  });
}
function vC(e) {
  return Promise.all([Vm(e, "::before"), Vm(e, "::after")]);
}
function xC(e) {
  return e.parentNode !== document.head && !~o4.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Xc) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Hm(e) {
  if (yn)
    return new Promise((t, n) => {
      const r = mo(e.querySelectorAll("*")).filter(xC).map(vC), o = Gf.begin("searchPseudoElements");
      p1(), Promise.all(r).then(() => {
        o(), iu(), t();
      }).catch(() => {
        o(), iu(), n();
      });
    });
}
var wC = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Hm, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = Ve
      } = t;
      re.searchPseudoElements && Hm(n);
    };
  }
};
let Um = !1;
var kC = {
  mixout() {
    return {
      dom: {
        unwatch() {
          p1(), Um = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Fm(tu("mutationObserverCallbacks", {}));
      },
      noAuto() {
        tC();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Um ? iu() : Fm(tu("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Ym = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((n, r) => {
    const o = r.toLowerCase().split("-"), a = o[0];
    let i = o.slice(1).join("-");
    if (a && i === "h")
      return n.flipX = !0, n;
    if (a && i === "v")
      return n.flipY = !0, n;
    if (i = parseFloat(i), isNaN(i))
      return n;
    switch (a) {
      case "grow":
        n.size = n.size + i;
        break;
      case "shrink":
        n.size = n.size - i;
        break;
      case "left":
        n.x = n.x - i;
        break;
      case "right":
        n.x = n.x + i;
        break;
      case "up":
        n.y = n.y - i;
        break;
      case "down":
        n.y = n.y + i;
        break;
      case "rotate":
        n.rotate = n.rotate + i;
        break;
    }
    return n;
  }, t);
};
var EC = {
  mixout() {
    return {
      parse: {
        transform: (e) => Ym(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = Ym(n)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: n,
        transform: r,
        containerWidth: o,
        iconWidth: a
      } = t;
      const i = {
        transform: "translate(".concat(o / 2, " 256)")
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), l = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), c = "rotate(".concat(r.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(l, " ").concat(c)
      }, f = {
        transform: "translate(".concat(a / 2 * -1, " -256)")
      }, d = {
        outer: i,
        inner: u,
        path: f
      };
      return {
        tag: "g",
        attributes: G({}, d.outer),
        children: [{
          tag: "g",
          attributes: G({}, d.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: G(G({}, n.icon.attributes), d.path)
          }]
        }]
      };
    };
  }
};
const xl = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Bm(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function OC(e) {
  return e.tag === "g" ? e.children : [e];
}
var SC = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? hs(n.split(" ").map((o) => o.trim())) : l1();
        return r.prefix || (r.prefix = Gn()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: n,
        attributes: r,
        main: o,
        mask: a,
        maskId: i,
        transform: s
      } = t;
      const {
        width: l,
        icon: c
      } = o, {
        width: u,
        icon: f
      } = a, d = b4({
        transform: s,
        containerWidth: u,
        iconWidth: l
      }), p = {
        tag: "rect",
        attributes: G(G({}, xl), {}, {
          fill: "white"
        })
      }, b = c.children ? {
        children: c.children.map(Bm)
      } : {}, m = {
        tag: "g",
        attributes: G({}, d.inner),
        children: [Bm(G({
          tag: c.tag,
          attributes: G(G({}, c.attributes), d.path)
        }, b))]
      }, g = {
        tag: "g",
        attributes: G({}, d.outer),
        children: [m]
      }, v = "mask-".concat(i || ua()), k = "clip-".concat(i || ua()), x = {
        tag: "mask",
        attributes: G(G({}, xl), {}, {
          id: v,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [p, g]
      }, O = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: k
          },
          children: OC(f)
        }, x]
      };
      return n.push(O, {
        tag: "rect",
        attributes: G({
          fill: "currentColor",
          "clip-path": "url(#".concat(k, ")"),
          mask: "url(#".concat(v, ")")
        }, xl)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, PC = {
  provides(e) {
    let t = !1;
    Bn.matchMedia && (t = Bn.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: G(G({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = G(G({}, o), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: G(G({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: G(G({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: G(G({}, a), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(i), n.push({
        tag: "path",
        attributes: G(G({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: G(G({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: G(G({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: G(G({}, a), {}, {
            values: "0;0;1;1;0;0;"
          })
        }]
      }), {
        tag: "g",
        attributes: {
          class: "missing"
        },
        children: n
      };
    };
  }
}, AC = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, CC = [x4, fC, dC, pC, mC, wC, kC, EC, SC, PC, AC];
L4(CC, {
  mixoutsTo: bt
});
bt.noAuto;
bt.config;
bt.library;
bt.dom;
const lu = bt.parse;
bt.findIconDefinition;
bt.toHtml;
const $C = bt.icon;
bt.layer;
bt.text;
bt.counter;
function NC(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var ni = { exports: {} }, wl = { exports: {} }, Pe = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Gm;
function IC() {
  if (Gm) return Pe;
  Gm = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, b = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, g = e ? Symbol.for("react.fundamental") : 60117, v = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
  function x(h) {
    if (typeof h == "object" && h !== null) {
      var L = h.$$typeof;
      switch (L) {
        case t:
          switch (h = h.type, h) {
            case l:
            case c:
            case r:
            case a:
            case o:
            case f:
              return h;
            default:
              switch (h = h && h.$$typeof, h) {
                case s:
                case u:
                case b:
                case p:
                case i:
                  return h;
                default:
                  return L;
              }
          }
        case n:
          return L;
      }
    }
  }
  function O(h) {
    return x(h) === c;
  }
  return Pe.AsyncMode = l, Pe.ConcurrentMode = c, Pe.ContextConsumer = s, Pe.ContextProvider = i, Pe.Element = t, Pe.ForwardRef = u, Pe.Fragment = r, Pe.Lazy = b, Pe.Memo = p, Pe.Portal = n, Pe.Profiler = a, Pe.StrictMode = o, Pe.Suspense = f, Pe.isAsyncMode = function(h) {
    return O(h) || x(h) === l;
  }, Pe.isConcurrentMode = O, Pe.isContextConsumer = function(h) {
    return x(h) === s;
  }, Pe.isContextProvider = function(h) {
    return x(h) === i;
  }, Pe.isElement = function(h) {
    return typeof h == "object" && h !== null && h.$$typeof === t;
  }, Pe.isForwardRef = function(h) {
    return x(h) === u;
  }, Pe.isFragment = function(h) {
    return x(h) === r;
  }, Pe.isLazy = function(h) {
    return x(h) === b;
  }, Pe.isMemo = function(h) {
    return x(h) === p;
  }, Pe.isPortal = function(h) {
    return x(h) === n;
  }, Pe.isProfiler = function(h) {
    return x(h) === a;
  }, Pe.isStrictMode = function(h) {
    return x(h) === o;
  }, Pe.isSuspense = function(h) {
    return x(h) === f;
  }, Pe.isValidElementType = function(h) {
    return typeof h == "string" || typeof h == "function" || h === r || h === c || h === a || h === o || h === f || h === d || typeof h == "object" && h !== null && (h.$$typeof === b || h.$$typeof === p || h.$$typeof === i || h.$$typeof === s || h.$$typeof === u || h.$$typeof === g || h.$$typeof === v || h.$$typeof === k || h.$$typeof === m);
  }, Pe.typeOf = x, Pe;
}
var Ne = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var qm;
function TC() {
  return qm || (qm = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, b = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, g = e ? Symbol.for("react.fundamental") : 60117, v = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
    function x(E) {
      return typeof E == "string" || typeof E == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      E === r || E === c || E === a || E === o || E === f || E === d || typeof E == "object" && E !== null && (E.$$typeof === b || E.$$typeof === p || E.$$typeof === i || E.$$typeof === s || E.$$typeof === u || E.$$typeof === g || E.$$typeof === v || E.$$typeof === k || E.$$typeof === m);
    }
    function O(E) {
      if (typeof E == "object" && E !== null) {
        var ue = E.$$typeof;
        switch (ue) {
          case t:
            var Me = E.type;
            switch (Me) {
              case l:
              case c:
              case r:
              case a:
              case o:
              case f:
                return Me;
              default:
                var it = Me && Me.$$typeof;
                switch (it) {
                  case s:
                  case u:
                  case b:
                  case p:
                  case i:
                    return it;
                  default:
                    return ue;
                }
            }
          case n:
            return ue;
        }
      }
    }
    var h = l, L = c, _ = s, H = i, J = t, Z = u, U = r, T = b, te = p, W = n, j = a, D = o, Q = f, V = !1;
    function z(E) {
      return V || (V = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), y(E) || O(E) === l;
    }
    function y(E) {
      return O(E) === c;
    }
    function w(E) {
      return O(E) === s;
    }
    function C(E) {
      return O(E) === i;
    }
    function A(E) {
      return typeof E == "object" && E !== null && E.$$typeof === t;
    }
    function P(E) {
      return O(E) === u;
    }
    function I(E) {
      return O(E) === r;
    }
    function N(E) {
      return O(E) === b;
    }
    function $(E) {
      return O(E) === p;
    }
    function R(E) {
      return O(E) === n;
    }
    function M(E) {
      return O(E) === a;
    }
    function F(E) {
      return O(E) === o;
    }
    function ee(E) {
      return O(E) === f;
    }
    Ne.AsyncMode = h, Ne.ConcurrentMode = L, Ne.ContextConsumer = _, Ne.ContextProvider = H, Ne.Element = J, Ne.ForwardRef = Z, Ne.Fragment = U, Ne.Lazy = T, Ne.Memo = te, Ne.Portal = W, Ne.Profiler = j, Ne.StrictMode = D, Ne.Suspense = Q, Ne.isAsyncMode = z, Ne.isConcurrentMode = y, Ne.isContextConsumer = w, Ne.isContextProvider = C, Ne.isElement = A, Ne.isForwardRef = P, Ne.isFragment = I, Ne.isLazy = N, Ne.isMemo = $, Ne.isPortal = R, Ne.isProfiler = M, Ne.isStrictMode = F, Ne.isSuspense = ee, Ne.isValidElementType = x, Ne.typeOf = O;
  }()), Ne;
}
var Km;
function g1() {
  return Km || (Km = 1, process.env.NODE_ENV === "production" ? wl.exports = IC() : wl.exports = TC()), wl.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var kl, Xm;
function MC() {
  if (Xm) return kl;
  Xm = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, n = Object.prototype.propertyIsEnumerable;
  function r(a) {
    if (a == null)
      throw new TypeError("Object.assign cannot be called with null or undefined");
    return Object(a);
  }
  function o() {
    try {
      if (!Object.assign)
        return !1;
      var a = new String("abc");
      if (a[5] = "de", Object.getOwnPropertyNames(a)[0] === "5")
        return !1;
      for (var i = {}, s = 0; s < 10; s++)
        i["_" + String.fromCharCode(s)] = s;
      var l = Object.getOwnPropertyNames(i).map(function(u) {
        return i[u];
      });
      if (l.join("") !== "0123456789")
        return !1;
      var c = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(u) {
        c[u] = u;
      }), Object.keys(Object.assign({}, c)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return kl = o() ? Object.assign : function(a, i) {
    for (var s, l = r(a), c, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var f in s)
        t.call(s, f) && (l[f] = s[f]);
      if (e) {
        c = e(s);
        for (var d = 0; d < c.length; d++)
          n.call(s, c[d]) && (l[c[d]] = s[c[d]]);
      }
    }
    return l;
  }, kl;
}
var El, Qm;
function Kf() {
  if (Qm) return El;
  Qm = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return El = e, El;
}
var Jm, Zm;
function h1() {
  return Zm || (Zm = 1, Jm = Function.call.bind(Object.prototype.hasOwnProperty)), Jm;
}
var Ol, eg;
function RC() {
  if (eg) return Ol;
  eg = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ Kf(), n = {}, r = /* @__PURE__ */ h1();
    e = function(a) {
      var i = "Warning: " + a;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function o(a, i, s, l, c) {
    if (process.env.NODE_ENV !== "production") {
      for (var u in a)
        if (r(a, u)) {
          var f;
          try {
            if (typeof a[u] != "function") {
              var d = Error(
                (l || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw d.name = "Invariant Violation", d;
            }
            f = a[u](i, u, l, s, null, t);
          } catch (b) {
            f = b;
          }
          if (f && !(f instanceof Error) && e(
            (l || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof f + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), f instanceof Error && !(f.message in n)) {
            n[f.message] = !0;
            var p = c ? c() : "";
            e(
              "Failed " + s + " type: " + f.message + (p ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, Ol = o, Ol;
}
var Sl, tg;
function jC() {
  if (tg) return Sl;
  tg = 1;
  var e = g1(), t = MC(), n = /* @__PURE__ */ Kf(), r = /* @__PURE__ */ h1(), o = /* @__PURE__ */ RC(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(s) {
    var l = "Warning: " + s;
    typeof console < "u" && console.error(l);
    try {
      throw new Error(l);
    } catch {
    }
  });
  function i() {
    return null;
  }
  return Sl = function(s, l) {
    var c = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function f(y) {
      var w = y && (c && y[c] || y[u]);
      if (typeof w == "function")
        return w;
    }
    var d = "<<anonymous>>", p = {
      array: v("array"),
      bigint: v("bigint"),
      bool: v("boolean"),
      func: v("function"),
      number: v("number"),
      object: v("object"),
      string: v("string"),
      symbol: v("symbol"),
      any: k(),
      arrayOf: x,
      element: O(),
      elementType: h(),
      instanceOf: L,
      node: Z(),
      objectOf: H,
      oneOf: _,
      oneOfType: J,
      shape: T,
      exact: te
    };
    function b(y, w) {
      return y === w ? y !== 0 || 1 / y === 1 / w : y !== y && w !== w;
    }
    function m(y, w) {
      this.message = y, this.data = w && typeof w == "object" ? w : {}, this.stack = "";
    }
    m.prototype = Error.prototype;
    function g(y) {
      if (process.env.NODE_ENV !== "production")
        var w = {}, C = 0;
      function A(I, N, $, R, M, F, ee) {
        if (R = R || d, F = F || $, ee !== n) {
          if (l) {
            var E = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw E.name = "Invariant Violation", E;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ue = R + ":" + $;
            !w[ue] && // Avoid spamming the console because they are often not actionable except for lib authors
            C < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + F + "` prop on `" + R + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), w[ue] = !0, C++);
          }
        }
        return N[$] == null ? I ? N[$] === null ? new m("The " + M + " `" + F + "` is marked as required " + ("in `" + R + "`, but its value is `null`.")) : new m("The " + M + " `" + F + "` is marked as required in " + ("`" + R + "`, but its value is `undefined`.")) : null : y(N, $, R, M, F);
      }
      var P = A.bind(null, !1);
      return P.isRequired = A.bind(null, !0), P;
    }
    function v(y) {
      function w(C, A, P, I, N, $) {
        var R = C[A], M = D(R);
        if (M !== y) {
          var F = Q(R);
          return new m(
            "Invalid " + I + " `" + N + "` of type " + ("`" + F + "` supplied to `" + P + "`, expected ") + ("`" + y + "`."),
            { expectedType: y }
          );
        }
        return null;
      }
      return g(w);
    }
    function k() {
      return g(i);
    }
    function x(y) {
      function w(C, A, P, I, N) {
        if (typeof y != "function")
          return new m("Property `" + N + "` of component `" + P + "` has invalid PropType notation inside arrayOf.");
        var $ = C[A];
        if (!Array.isArray($)) {
          var R = D($);
          return new m("Invalid " + I + " `" + N + "` of type " + ("`" + R + "` supplied to `" + P + "`, expected an array."));
        }
        for (var M = 0; M < $.length; M++) {
          var F = y($, M, P, I, N + "[" + M + "]", n);
          if (F instanceof Error)
            return F;
        }
        return null;
      }
      return g(w);
    }
    function O() {
      function y(w, C, A, P, I) {
        var N = w[C];
        if (!s(N)) {
          var $ = D(N);
          return new m("Invalid " + P + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return g(y);
    }
    function h() {
      function y(w, C, A, P, I) {
        var N = w[C];
        if (!e.isValidElementType(N)) {
          var $ = D(N);
          return new m("Invalid " + P + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return g(y);
    }
    function L(y) {
      function w(C, A, P, I, N) {
        if (!(C[A] instanceof y)) {
          var $ = y.name || d, R = z(C[A]);
          return new m("Invalid " + I + " `" + N + "` of type " + ("`" + R + "` supplied to `" + P + "`, expected ") + ("instance of `" + $ + "`."));
        }
        return null;
      }
      return g(w);
    }
    function _(y) {
      if (!Array.isArray(y))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), i;
      function w(C, A, P, I, N) {
        for (var $ = C[A], R = 0; R < y.length; R++)
          if (b($, y[R]))
            return null;
        var M = JSON.stringify(y, function(F, ee) {
          var E = Q(ee);
          return E === "symbol" ? String(ee) : ee;
        });
        return new m("Invalid " + I + " `" + N + "` of value `" + String($) + "` " + ("supplied to `" + P + "`, expected one of " + M + "."));
      }
      return g(w);
    }
    function H(y) {
      function w(C, A, P, I, N) {
        if (typeof y != "function")
          return new m("Property `" + N + "` of component `" + P + "` has invalid PropType notation inside objectOf.");
        var $ = C[A], R = D($);
        if (R !== "object")
          return new m("Invalid " + I + " `" + N + "` of type " + ("`" + R + "` supplied to `" + P + "`, expected an object."));
        for (var M in $)
          if (r($, M)) {
            var F = y($, M, P, I, N + "." + M, n);
            if (F instanceof Error)
              return F;
          }
        return null;
      }
      return g(w);
    }
    function J(y) {
      if (!Array.isArray(y))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var w = 0; w < y.length; w++) {
        var C = y[w];
        if (typeof C != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + V(C) + " at index " + w + "."
          ), i;
      }
      function A(P, I, N, $, R) {
        for (var M = [], F = 0; F < y.length; F++) {
          var ee = y[F], E = ee(P, I, N, $, R, n);
          if (E == null)
            return null;
          E.data && r(E.data, "expectedType") && M.push(E.data.expectedType);
        }
        var ue = M.length > 0 ? ", expected one of type [" + M.join(", ") + "]" : "";
        return new m("Invalid " + $ + " `" + R + "` supplied to " + ("`" + N + "`" + ue + "."));
      }
      return g(A);
    }
    function Z() {
      function y(w, C, A, P, I) {
        return W(w[C]) ? null : new m("Invalid " + P + " `" + I + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return g(y);
    }
    function U(y, w, C, A, P) {
      return new m(
        (y || "React class") + ": " + w + " type `" + C + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + P + "`."
      );
    }
    function T(y) {
      function w(C, A, P, I, N) {
        var $ = C[A], R = D($);
        if (R !== "object")
          return new m("Invalid " + I + " `" + N + "` of type `" + R + "` " + ("supplied to `" + P + "`, expected `object`."));
        for (var M in y) {
          var F = y[M];
          if (typeof F != "function")
            return U(P, I, N, M, Q(F));
          var ee = F($, M, P, I, N + "." + M, n);
          if (ee)
            return ee;
        }
        return null;
      }
      return g(w);
    }
    function te(y) {
      function w(C, A, P, I, N) {
        var $ = C[A], R = D($);
        if (R !== "object")
          return new m("Invalid " + I + " `" + N + "` of type `" + R + "` " + ("supplied to `" + P + "`, expected `object`."));
        var M = t({}, C[A], y);
        for (var F in M) {
          var ee = y[F];
          if (r(y, F) && typeof ee != "function")
            return U(P, I, N, F, Q(ee));
          if (!ee)
            return new m(
              "Invalid " + I + " `" + N + "` key `" + F + "` supplied to `" + P + "`.\nBad object: " + JSON.stringify(C[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(y), null, "  ")
            );
          var E = ee($, F, P, I, N + "." + F, n);
          if (E)
            return E;
        }
        return null;
      }
      return g(w);
    }
    function W(y) {
      switch (typeof y) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !y;
        case "object":
          if (Array.isArray(y))
            return y.every(W);
          if (y === null || s(y))
            return !0;
          var w = f(y);
          if (w) {
            var C = w.call(y), A;
            if (w !== y.entries) {
              for (; !(A = C.next()).done; )
                if (!W(A.value))
                  return !1;
            } else
              for (; !(A = C.next()).done; ) {
                var P = A.value;
                if (P && !W(P[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function j(y, w) {
      return y === "symbol" ? !0 : w ? w["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && w instanceof Symbol : !1;
    }
    function D(y) {
      var w = typeof y;
      return Array.isArray(y) ? "array" : y instanceof RegExp ? "object" : j(w, y) ? "symbol" : w;
    }
    function Q(y) {
      if (typeof y > "u" || y === null)
        return "" + y;
      var w = D(y);
      if (w === "object") {
        if (y instanceof Date)
          return "date";
        if (y instanceof RegExp)
          return "regexp";
      }
      return w;
    }
    function V(y) {
      var w = Q(y);
      switch (w) {
        case "array":
        case "object":
          return "an " + w;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + w;
        default:
          return w;
      }
    }
    function z(y) {
      return !y.constructor || !y.constructor.name ? d : y.constructor.name;
    }
    return p.checkPropTypes = o, p.resetWarningCache = o.resetWarningCache, p.PropTypes = p, p;
  }, Sl;
}
var Pl, ng;
function _C() {
  if (ng) return Pl;
  ng = 1;
  var e = /* @__PURE__ */ Kf();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, Pl = function() {
    function r(i, s, l, c, u, f) {
      if (f !== e) {
        var d = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw d.name = "Invariant Violation", d;
      }
    }
    r.isRequired = r;
    function o() {
      return r;
    }
    var a = {
      array: r,
      bigint: r,
      bool: r,
      func: r,
      number: r,
      object: r,
      string: r,
      symbol: r,
      any: r,
      arrayOf: o,
      element: r,
      elementType: r,
      instanceOf: o,
      node: r,
      objectOf: o,
      oneOf: o,
      oneOfType: o,
      shape: o,
      exact: o,
      checkPropTypes: n,
      resetWarningCache: t
    };
    return a.PropTypes = a, a;
  }, Pl;
}
var rg;
function FC() {
  if (rg) return ni.exports;
  if (rg = 1, process.env.NODE_ENV !== "production") {
    var e = g1(), t = !0;
    ni.exports = /* @__PURE__ */ jC()(e.isElement, t);
  } else
    ni.exports = /* @__PURE__ */ _C()();
  return ni.exports;
}
var LC = /* @__PURE__ */ FC();
const be = /* @__PURE__ */ NC(LC);
function og(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function Dt(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? og(Object(n), !0).forEach(function(r) {
      _r(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : og(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Li(e) {
  "@babel/helpers - typeof";
  return Li = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Li(e);
}
function _r(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function DC(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), o, a;
  for (a = 0; a < r.length; a++)
    o = r[a], !(t.indexOf(o) >= 0) && (n[o] = e[o]);
  return n;
}
function zC(e, t) {
  if (e == null) return {};
  var n = DC(e, t), r, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      r = a[o], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function cu(e) {
  return WC(e) || VC(e) || HC(e) || UC();
}
function WC(e) {
  if (Array.isArray(e)) return uu(e);
}
function VC(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function HC(e, t) {
  if (e) {
    if (typeof e == "string") return uu(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return uu(e, t);
  }
}
function uu(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function UC() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function YC(e) {
  var t, n = e.beat, r = e.fade, o = e.beatFade, a = e.bounce, i = e.shake, s = e.flash, l = e.spin, c = e.spinPulse, u = e.spinReverse, f = e.pulse, d = e.fixedWidth, p = e.inverse, b = e.border, m = e.listItem, g = e.flip, v = e.size, k = e.rotation, x = e.pull, O = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": o,
    "fa-bounce": a,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": l,
    "fa-spin-reverse": u,
    "fa-spin-pulse": c,
    "fa-pulse": f,
    "fa-fw": d,
    "fa-inverse": p,
    "fa-border": b,
    "fa-li": m,
    "fa-flip": g === !0,
    "fa-flip-horizontal": g === "horizontal" || g === "both",
    "fa-flip-vertical": g === "vertical" || g === "both"
  }, _r(t, "fa-".concat(v), typeof v < "u" && v !== null), _r(t, "fa-rotate-".concat(k), typeof k < "u" && k !== null && k !== 0), _r(t, "fa-pull-".concat(x), typeof x < "u" && x !== null), _r(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(O).map(function(h) {
    return O[h] ? h : null;
  }).filter(function(h) {
    return h;
  });
}
function BC(e) {
  return e = e - 0, e === e;
}
function b1(e) {
  return BC(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var GC = ["style"];
function qC(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function KC(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), o = b1(n.slice(0, r)), a = n.slice(r + 1).trim();
    return o.startsWith("webkit") ? t[qC(o)] = a : t[o] = a, t;
  }, {});
}
function y1(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(l) {
    return y1(e, l);
  }), o = Object.keys(t.attributes || {}).reduce(function(l, c) {
    var u = t.attributes[c];
    switch (c) {
      case "class":
        l.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        l.attrs.style = KC(u);
        break;
      default:
        c.indexOf("aria-") === 0 || c.indexOf("data-") === 0 ? l.attrs[c.toLowerCase()] = u : l.attrs[b1(c)] = u;
    }
    return l;
  }, {
    attrs: {}
  }), a = n.style, i = a === void 0 ? {} : a, s = zC(n, GC);
  return o.attrs.style = Dt(Dt({}, o.attrs.style), i), e.apply(void 0, [t.tag, Dt(Dt({}, o.attrs), s)].concat(cu(r)));
}
var v1 = !1;
try {
  v1 = process.env.NODE_ENV === "production";
} catch {
}
function XC() {
  if (!v1 && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function ag(e) {
  if (e && Li(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (lu.icon)
    return lu.icon(e);
  if (e === null)
    return null;
  if (e && Li(e) === "object" && e.prefix && e.iconName)
    return e;
  if (Array.isArray(e) && e.length === 2)
    return {
      prefix: e[0],
      iconName: e[1]
    };
  if (typeof e == "string")
    return {
      prefix: "fas",
      iconName: e
    };
}
function Al(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? _r({}, e, t) : {};
}
var ig = {
  border: !1,
  className: "",
  mask: null,
  maskId: null,
  fixedWidth: !1,
  inverse: !1,
  flip: !1,
  icon: null,
  listItem: !1,
  pull: null,
  pulse: !1,
  rotation: null,
  size: null,
  spin: !1,
  spinPulse: !1,
  spinReverse: !1,
  beat: !1,
  fade: !1,
  beatFade: !1,
  bounce: !1,
  shake: !1,
  symbol: !1,
  title: "",
  titleId: null,
  transform: null,
  swapOpacity: !1
}, da = /* @__PURE__ */ ke.forwardRef(function(e, t) {
  var n = Dt(Dt({}, ig), e), r = n.icon, o = n.mask, a = n.symbol, i = n.className, s = n.title, l = n.titleId, c = n.maskId, u = ag(r), f = Al("classes", [].concat(cu(YC(n)), cu((i || "").split(" ")))), d = Al("transform", typeof n.transform == "string" ? lu.transform(n.transform) : n.transform), p = Al("mask", ag(o)), b = $C(u, Dt(Dt(Dt(Dt({}, f), d), p), {}, {
    symbol: a,
    title: s,
    titleId: l,
    maskId: c
  }));
  if (!b)
    return XC("Could not find icon", u), null;
  var m = b.abstract, g = {
    ref: t
  };
  return Object.keys(n).forEach(function(v) {
    ig.hasOwnProperty(v) || (g[v] = n[v]);
  }), QC(m[0], g);
});
da.displayName = "FontAwesomeIcon";
da.propTypes = {
  beat: be.bool,
  border: be.bool,
  beatFade: be.bool,
  bounce: be.bool,
  className: be.string,
  fade: be.bool,
  flash: be.bool,
  mask: be.oneOfType([be.object, be.array, be.string]),
  maskId: be.string,
  fixedWidth: be.bool,
  inverse: be.bool,
  flip: be.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: be.oneOfType([be.object, be.array, be.string]),
  listItem: be.bool,
  pull: be.oneOf(["right", "left"]),
  pulse: be.bool,
  rotation: be.oneOf([0, 90, 180, 270]),
  shake: be.bool,
  size: be.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: be.bool,
  spinPulse: be.bool,
  spinReverse: be.bool,
  symbol: be.oneOfType([be.bool, be.string]),
  title: be.string,
  titleId: be.string,
  transform: be.oneOfType([be.string, be.object]),
  swapOpacity: be.bool
};
var QC = y1.bind(null, ke.createElement);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const JC = {
  prefix: "fas",
  iconName: "xmark",
  icon: [384, 512, [128473, 10005, 10006, 10060, 215, "close", "multiply", "remove", "times"], "f00d", "M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"]
};
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function ZC(e, t, n) {
  return (t = t3(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function sg(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function q(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? sg(Object(n), !0).forEach(function(r) {
      ZC(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : sg(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function e3(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function t3(e) {
  var t = e3(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const lg = () => {
};
let Xf = {}, x1 = {}, w1 = null, k1 = {
  mark: lg,
  measure: lg
};
try {
  typeof window < "u" && (Xf = window), typeof document < "u" && (x1 = document), typeof MutationObserver < "u" && (w1 = MutationObserver), typeof performance < "u" && (k1 = performance);
} catch {
}
const {
  userAgent: cg = ""
} = Xf.navigator || {}, Kn = Xf, He = x1, ug = w1, ri = k1;
Kn.document;
const vn = !!He.documentElement && !!He.head && typeof He.addEventListener == "function" && typeof He.createElement == "function", E1 = ~cg.indexOf("MSIE") || ~cg.indexOf("Trident/");
var n3 = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, r3 = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, O1 = {
  classic: {
    fa: "solid",
    fas: "solid",
    "fa-solid": "solid",
    far: "regular",
    "fa-regular": "regular",
    fal: "light",
    "fa-light": "light",
    fat: "thin",
    "fa-thin": "thin",
    fab: "brands",
    "fa-brands": "brands"
  },
  duotone: {
    fa: "solid",
    fad: "solid",
    "fa-solid": "solid",
    "fa-duotone": "solid",
    fadr: "regular",
    "fa-regular": "regular",
    fadl: "light",
    "fa-light": "light",
    fadt: "thin",
    "fa-thin": "thin"
  },
  sharp: {
    fa: "solid",
    fass: "solid",
    "fa-solid": "solid",
    fasr: "regular",
    "fa-regular": "regular",
    fasl: "light",
    "fa-light": "light",
    fast: "thin",
    "fa-thin": "thin"
  },
  "sharp-duotone": {
    fa: "solid",
    fasds: "solid",
    "fa-solid": "solid",
    fasdr: "regular",
    "fa-regular": "regular",
    fasdl: "light",
    "fa-light": "light",
    fasdt: "thin",
    "fa-thin": "thin"
  }
}, o3 = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, S1 = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], ot = "classic", ys = "duotone", a3 = "sharp", i3 = "sharp-duotone", P1 = [ot, ys, a3, i3], s3 = {
  classic: {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  duotone: {
    900: "fad",
    400: "fadr",
    300: "fadl",
    100: "fadt"
  },
  sharp: {
    900: "fass",
    400: "fasr",
    300: "fasl",
    100: "fast"
  },
  "sharp-duotone": {
    900: "fasds",
    400: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
}, l3 = {
  "Font Awesome 6 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 6 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  "Font Awesome 6 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 6 Duotone": {
    900: "fad",
    400: "fadr",
    normal: "fadr",
    300: "fadl",
    100: "fadt"
  },
  "Font Awesome 6 Sharp": {
    900: "fass",
    400: "fasr",
    normal: "fasr",
    300: "fasl",
    100: "fast"
  },
  "Font Awesome 6 Sharp Duotone": {
    900: "fasds",
    400: "fasdr",
    normal: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
}, c3 = /* @__PURE__ */ new Map([["classic", {
  defaultShortPrefixId: "fas",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin", "brands"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp", {
  defaultShortPrefixId: "fass",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["duotone", {
  defaultShortPrefixId: "fad",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp-duotone", {
  defaultShortPrefixId: "fasds",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}]]), u3 = {
  classic: {
    solid: "fas",
    regular: "far",
    light: "fal",
    thin: "fat",
    brands: "fab"
  },
  duotone: {
    solid: "fad",
    regular: "fadr",
    light: "fadl",
    thin: "fadt"
  },
  sharp: {
    solid: "fass",
    regular: "fasr",
    light: "fasl",
    thin: "fast"
  },
  "sharp-duotone": {
    solid: "fasds",
    regular: "fasdr",
    light: "fasdl",
    thin: "fasdt"
  }
}, f3 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], fg = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, d3 = ["kit"], p3 = {
  kit: {
    "fa-kit": "fak"
  }
}, m3 = ["fak", "fakd"], g3 = {
  kit: {
    fak: "fa-kit"
  }
}, dg = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, oi = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, h3 = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], b3 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], y3 = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, v3 = {
  classic: {
    "fa-brands": "fab",
    "fa-duotone": "fad",
    "fa-light": "fal",
    "fa-regular": "far",
    "fa-solid": "fas",
    "fa-thin": "fat"
  },
  duotone: {
    "fa-regular": "fadr",
    "fa-light": "fadl",
    "fa-thin": "fadt"
  },
  sharp: {
    "fa-solid": "fass",
    "fa-regular": "fasr",
    "fa-light": "fasl",
    "fa-thin": "fast"
  },
  "sharp-duotone": {
    "fa-solid": "fasds",
    "fa-regular": "fasdr",
    "fa-light": "fasdl",
    "fa-thin": "fasdt"
  }
}, x3 = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, fu = {
  classic: {
    fab: "fa-brands",
    fad: "fa-duotone",
    fal: "fa-light",
    far: "fa-regular",
    fas: "fa-solid",
    fat: "fa-thin"
  },
  duotone: {
    fadr: "fa-regular",
    fadl: "fa-light",
    fadt: "fa-thin"
  },
  sharp: {
    fass: "fa-solid",
    fasr: "fa-regular",
    fasl: "fa-light",
    fast: "fa-thin"
  },
  "sharp-duotone": {
    fasds: "fa-solid",
    fasdr: "fa-regular",
    fasdl: "fa-light",
    fasdt: "fa-thin"
  }
}, w3 = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], du = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...h3, ...w3], k3 = ["solid", "regular", "light", "thin", "duotone", "brands"], A1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], E3 = A1.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), O3 = [...Object.keys(x3), ...k3, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", oi.GROUP, oi.SWAP_OPACITY, oi.PRIMARY, oi.SECONDARY].concat(A1.map((e) => "".concat(e, "x"))).concat(E3.map((e) => "w-".concat(e))), S3 = {
  "Font Awesome 5 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 5 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal"
  },
  "Font Awesome 5 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 5 Duotone": {
    900: "fad"
  }
};
const pn = "___FONT_AWESOME___", pu = 16, C1 = "fa", $1 = "svg-inline--fa", vr = "data-fa-i2svg", mu = "data-fa-pseudo-element", P3 = "data-fa-pseudo-element-pending", Qf = "data-prefix", Jf = "data-icon", pg = "fontawesome-i2svg", A3 = "async", C3 = ["HTML", "HEAD", "STYLE", "SCRIPT"], N1 = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Ma(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[ot];
    }
  });
}
const I1 = q({}, O1);
I1[ot] = q(q(q(q({}, {
  "fa-duotone": "duotone"
}), O1[ot]), fg.kit), fg["kit-duotone"]);
const $3 = Ma(I1), gu = q({}, u3);
gu[ot] = q(q(q(q({}, {
  duotone: "fad"
}), gu[ot]), dg.kit), dg["kit-duotone"]);
const mg = Ma(gu), hu = q({}, fu);
hu[ot] = q(q({}, hu[ot]), g3.kit);
const Zf = Ma(hu), bu = q({}, v3);
bu[ot] = q(q({}, bu[ot]), p3.kit);
Ma(bu);
const N3 = n3, T1 = "fa-layers-text", I3 = r3, T3 = q({}, s3);
Ma(T3);
const M3 = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Cl = o3, R3 = [...d3, ...O3], qo = Kn.FontAwesomeConfig || {};
function j3(e) {
  var t = He.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function _3(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
He && typeof He.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, n] = e;
  const r = _3(j3(t));
  r != null && (qo[n] = r);
});
const M1 = {
  styleDefault: "solid",
  familyDefault: ot,
  cssPrefix: C1,
  replacementClass: $1,
  autoReplaceSvg: !0,
  autoAddCss: !0,
  autoA11y: !0,
  searchPseudoElements: !1,
  observeMutations: !0,
  mutateApproach: "async",
  keepOriginalSource: !0,
  measurePerformance: !1,
  showMissingIcons: !0
};
qo.familyPrefix && (qo.cssPrefix = qo.familyPrefix);
const ro = q(q({}, M1), qo);
ro.autoReplaceSvg || (ro.observeMutations = !1);
const oe = {};
Object.keys(M1).forEach((e) => {
  Object.defineProperty(oe, e, {
    enumerable: !0,
    set: function(t) {
      ro[e] = t, Ko.forEach((n) => n(oe));
    },
    get: function() {
      return ro[e];
    }
  });
});
Object.defineProperty(oe, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    ro.cssPrefix = e, Ko.forEach((t) => t(oe));
  },
  get: function() {
    return ro.cssPrefix;
  }
});
Kn.FontAwesomeConfig = oe;
const Ko = [];
function F3(e) {
  return Ko.push(e), () => {
    Ko.splice(Ko.indexOf(e), 1);
  };
}
const Sn = pu, Gt = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function L3(e) {
  if (!e || !vn)
    return;
  const t = He.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = He.head.childNodes;
  let r = null;
  for (let o = n.length - 1; o > -1; o--) {
    const a = n[o], i = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = a);
  }
  return He.head.insertBefore(t, r), e;
}
const D3 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function pa() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += D3[Math.random() * 62 | 0];
  return t;
}
function go(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function ed(e) {
  return e.classList ? go(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function R1(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function z3(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(R1(e[n]), '" '), "").trim();
}
function vs(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function td(e) {
  return e.size !== Gt.size || e.x !== Gt.x || e.y !== Gt.y || e.rotate !== Gt.rotate || e.flipX || e.flipY;
}
function W3(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const o = {
    transform: "translate(".concat(n / 2, " 256)")
  }, a = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), l = {
    transform: "".concat(a, " ").concat(i, " ").concat(s)
  }, c = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: l,
    path: c
  };
}
function V3(e) {
  let {
    transform: t,
    width: n = pu,
    height: r = pu,
    startCentered: o = !1
  } = e, a = "";
  return o && E1 ? a += "translate(".concat(t.x / Sn - n / 2, "em, ").concat(t.y / Sn - r / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / Sn, "em), calc(-50% + ").concat(t.y / Sn, "em)) ") : a += "translate(".concat(t.x / Sn, "em, ").concat(t.y / Sn, "em) "), a += "scale(".concat(t.size / Sn * (t.flipX ? -1 : 1), ", ").concat(t.size / Sn * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var H3 = `:root, :host {
  --fa-font-solid: normal 900 1em/1 "Font Awesome 6 Free";
  --fa-font-regular: normal 400 1em/1 "Font Awesome 6 Free";
  --fa-font-light: normal 300 1em/1 "Font Awesome 6 Pro";
  --fa-font-thin: normal 100 1em/1 "Font Awesome 6 Pro";
  --fa-font-duotone: normal 900 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-regular: normal 400 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-light: normal 300 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-thin: normal 100 1em/1 "Font Awesome 6 Duotone";
  --fa-font-brands: normal 400 1em/1 "Font Awesome 6 Brands";
  --fa-font-sharp-solid: normal 900 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-regular: normal 400 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-light: normal 300 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-thin: normal 100 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-duotone-solid: normal 900 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-regular: normal 400 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-light: normal 300 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-thin: normal 100 1em/1 "Font Awesome 6 Sharp Duotone";
}

svg:not(:root).svg-inline--fa, svg:not(:host).svg-inline--fa {
  overflow: visible;
  box-sizing: content-box;
}

.svg-inline--fa {
  display: var(--fa-display, inline-block);
  height: 1em;
  overflow: visible;
  vertical-align: -0.125em;
}
.svg-inline--fa.fa-2xs {
  vertical-align: 0.1em;
}
.svg-inline--fa.fa-xs {
  vertical-align: 0em;
}
.svg-inline--fa.fa-sm {
  vertical-align: -0.0714285705em;
}
.svg-inline--fa.fa-lg {
  vertical-align: -0.2em;
}
.svg-inline--fa.fa-xl {
  vertical-align: -0.25em;
}
.svg-inline--fa.fa-2xl {
  vertical-align: -0.3125em;
}
.svg-inline--fa.fa-pull-left {
  margin-right: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-pull-right {
  margin-left: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-li {
  width: var(--fa-li-width, 2em);
  top: 0.25em;
}
.svg-inline--fa.fa-fw {
  width: var(--fa-fw-width, 1.25em);
}

.fa-layers svg.svg-inline--fa {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
}

.fa-layers-counter, .fa-layers-text {
  display: inline-block;
  position: absolute;
  text-align: center;
}

.fa-layers {
  display: inline-block;
  height: 1em;
  position: relative;
  text-align: center;
  vertical-align: -0.125em;
  width: 1em;
}
.fa-layers svg.svg-inline--fa {
  transform-origin: center center;
}

.fa-layers-text {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center center;
}

.fa-layers-counter {
  background-color: var(--fa-counter-background-color, #ff253a);
  border-radius: var(--fa-counter-border-radius, 1em);
  box-sizing: border-box;
  color: var(--fa-inverse, #fff);
  line-height: var(--fa-counter-line-height, 1);
  max-width: var(--fa-counter-max-width, 5em);
  min-width: var(--fa-counter-min-width, 1.5em);
  overflow: hidden;
  padding: var(--fa-counter-padding, 0.25em 0.5em);
  right: var(--fa-right, 0);
  text-overflow: ellipsis;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-counter-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-bottom-right {
  bottom: var(--fa-bottom, 0);
  right: var(--fa-right, 0);
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom right;
}

.fa-layers-bottom-left {
  bottom: var(--fa-bottom, 0);
  left: var(--fa-left, 0);
  right: auto;
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom left;
}

.fa-layers-top-right {
  top: var(--fa-top, 0);
  right: var(--fa-right, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-top-left {
  left: var(--fa-left, 0);
  right: auto;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top left;
}

.fa-1x {
  font-size: 1em;
}

.fa-2x {
  font-size: 2em;
}

.fa-3x {
  font-size: 3em;
}

.fa-4x {
  font-size: 4em;
}

.fa-5x {
  font-size: 5em;
}

.fa-6x {
  font-size: 6em;
}

.fa-7x {
  font-size: 7em;
}

.fa-8x {
  font-size: 8em;
}

.fa-9x {
  font-size: 9em;
}

.fa-10x {
  font-size: 10em;
}

.fa-2xs {
  font-size: 0.625em;
  line-height: 0.1em;
  vertical-align: 0.225em;
}

.fa-xs {
  font-size: 0.75em;
  line-height: 0.0833333337em;
  vertical-align: 0.125em;
}

.fa-sm {
  font-size: 0.875em;
  line-height: 0.0714285718em;
  vertical-align: 0.0535714295em;
}

.fa-lg {
  font-size: 1.25em;
  line-height: 0.05em;
  vertical-align: -0.075em;
}

.fa-xl {
  font-size: 1.5em;
  line-height: 0.0416666682em;
  vertical-align: -0.125em;
}

.fa-2xl {
  font-size: 2em;
  line-height: 0.03125em;
  vertical-align: -0.1875em;
}

.fa-fw {
  text-align: center;
  width: 1.25em;
}

.fa-ul {
  list-style-type: none;
  margin-left: var(--fa-li-margin, 2.5em);
  padding-left: 0;
}
.fa-ul > li {
  position: relative;
}

.fa-li {
  left: calc(-1 * var(--fa-li-width, 2em));
  position: absolute;
  text-align: center;
  width: var(--fa-li-width, 2em);
  line-height: inherit;
}

.fa-border {
  border-color: var(--fa-border-color, #eee);
  border-radius: var(--fa-border-radius, 0.1em);
  border-style: var(--fa-border-style, solid);
  border-width: var(--fa-border-width, 0.08em);
  padding: var(--fa-border-padding, 0.2em 0.25em 0.15em);
}

.fa-pull-left {
  float: left;
  margin-right: var(--fa-pull-margin, 0.3em);
}

.fa-pull-right {
  float: right;
  margin-left: var(--fa-pull-margin, 0.3em);
}

.fa-beat {
  animation-name: fa-beat;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-bounce {
  animation-name: fa-bounce;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.28, 0.84, 0.42, 1));
}

.fa-fade {
  animation-name: fa-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-beat-fade {
  animation-name: fa-beat-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-flip {
  animation-name: fa-flip;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-shake {
  animation-name: fa-shake;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin {
  animation-name: fa-spin;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 2s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin-reverse {
  --fa-animation-direction: reverse;
}

.fa-pulse,
.fa-spin-pulse {
  animation-name: fa-spin;
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, steps(8));
}

@media (prefers-reduced-motion: reduce) {
  .fa-beat,
.fa-bounce,
.fa-fade,
.fa-beat-fade,
.fa-flip,
.fa-pulse,
.fa-shake,
.fa-spin,
.fa-spin-pulse {
    animation-delay: -1ms;
    animation-duration: 1ms;
    animation-iteration-count: 1;
    transition-delay: 0s;
    transition-duration: 0s;
  }
}
@keyframes fa-beat {
  0%, 90% {
    transform: scale(1);
  }
  45% {
    transform: scale(var(--fa-beat-scale, 1.25));
  }
}
@keyframes fa-bounce {
  0% {
    transform: scale(1, 1) translateY(0);
  }
  10% {
    transform: scale(var(--fa-bounce-start-scale-x, 1.1), var(--fa-bounce-start-scale-y, 0.9)) translateY(0);
  }
  30% {
    transform: scale(var(--fa-bounce-jump-scale-x, 0.9), var(--fa-bounce-jump-scale-y, 1.1)) translateY(var(--fa-bounce-height, -0.5em));
  }
  50% {
    transform: scale(var(--fa-bounce-land-scale-x, 1.05), var(--fa-bounce-land-scale-y, 0.95)) translateY(0);
  }
  57% {
    transform: scale(1, 1) translateY(var(--fa-bounce-rebound, -0.125em));
  }
  64% {
    transform: scale(1, 1) translateY(0);
  }
  100% {
    transform: scale(1, 1) translateY(0);
  }
}
@keyframes fa-fade {
  50% {
    opacity: var(--fa-fade-opacity, 0.4);
  }
}
@keyframes fa-beat-fade {
  0%, 100% {
    opacity: var(--fa-beat-fade-opacity, 0.4);
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(var(--fa-beat-fade-scale, 1.125));
  }
}
@keyframes fa-flip {
  50% {
    transform: rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), var(--fa-flip-angle, -180deg));
  }
}
@keyframes fa-shake {
  0% {
    transform: rotate(-15deg);
  }
  4% {
    transform: rotate(15deg);
  }
  8%, 24% {
    transform: rotate(-18deg);
  }
  12%, 28% {
    transform: rotate(18deg);
  }
  16% {
    transform: rotate(-22deg);
  }
  20% {
    transform: rotate(22deg);
  }
  32% {
    transform: rotate(-12deg);
  }
  36% {
    transform: rotate(12deg);
  }
  40%, 100% {
    transform: rotate(0deg);
  }
}
@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.fa-rotate-90 {
  transform: rotate(90deg);
}

.fa-rotate-180 {
  transform: rotate(180deg);
}

.fa-rotate-270 {
  transform: rotate(270deg);
}

.fa-flip-horizontal {
  transform: scale(-1, 1);
}

.fa-flip-vertical {
  transform: scale(1, -1);
}

.fa-flip-both,
.fa-flip-horizontal.fa-flip-vertical {
  transform: scale(-1, -1);
}

.fa-rotate-by {
  transform: rotate(var(--fa-rotate-angle, 0));
}

.fa-stack {
  display: inline-block;
  vertical-align: middle;
  height: 2em;
  position: relative;
  width: 2.5em;
}

.fa-stack-1x,
.fa-stack-2x {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
  z-index: var(--fa-stack-z-index, auto);
}

.svg-inline--fa.fa-stack-1x {
  height: 1em;
  width: 1.25em;
}
.svg-inline--fa.fa-stack-2x {
  height: 2em;
  width: 2.5em;
}

.fa-inverse {
  color: var(--fa-inverse, #fff);
}

.sr-only,
.fa-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:not(:focus),
.fa-sr-only-focusable:not(:focus) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.svg-inline--fa .fa-primary {
  fill: var(--fa-primary-color, currentColor);
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa .fa-secondary {
  fill: var(--fa-secondary-color, currentColor);
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-primary {
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-secondary {
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa mask .fa-primary,
.svg-inline--fa mask .fa-secondary {
  fill: black;
}`;
function j1() {
  const e = C1, t = $1, n = oe.cssPrefix, r = oe.replacementClass;
  let o = H3;
  if (n !== e || r !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return o;
}
let gg = !1;
function $l() {
  oe.autoAddCss && !gg && (L3(j1()), gg = !0);
}
var U3 = {
  mixout() {
    return {
      dom: {
        css: j1,
        insertCss: $l
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        $l();
      },
      beforeI2svg() {
        $l();
      }
    };
  }
};
const mn = Kn || {};
mn[pn] || (mn[pn] = {});
mn[pn].styles || (mn[pn].styles = {});
mn[pn].hooks || (mn[pn].hooks = {});
mn[pn].shims || (mn[pn].shims = []);
var qt = mn[pn];
const _1 = [], F1 = function() {
  He.removeEventListener("DOMContentLoaded", F1), Di = 1, _1.map((e) => e());
};
let Di = !1;
vn && (Di = (He.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(He.readyState), Di || He.addEventListener("DOMContentLoaded", F1));
function Y3(e) {
  vn && (Di ? setTimeout(e, 0) : _1.push(e));
}
function Ra(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? R1(e) : "<".concat(t, " ").concat(z3(n), ">").concat(r.map(Ra).join(""), "</").concat(t, ">");
}
function hg(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var Nl = function(e, t, n, r) {
  var o = Object.keys(e), a = o.length, i = t, s, l, c;
  for (n === void 0 ? (s = 1, c = e[o[0]]) : (s = 0, c = n); s < a; s++)
    l = o[s], c = i(c, e[l], l, e);
  return c;
};
function B3(e) {
  const t = [];
  let n = 0;
  const r = e.length;
  for (; n < r; ) {
    const o = e.charCodeAt(n++);
    if (o >= 55296 && o <= 56319 && n < r) {
      const a = e.charCodeAt(n++);
      (a & 64512) == 56320 ? t.push(((o & 1023) << 10) + (a & 1023) + 65536) : (t.push(o), n--);
    } else
      t.push(o);
  }
  return t;
}
function L1(e) {
  const t = B3(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function G3(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), o;
  return r >= 55296 && r <= 56319 && n > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (r - 55296) * 1024 + o - 56320 + 65536 : r;
}
function bg(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function yu(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, o = bg(t);
  typeof qt.hooks.addPack == "function" && !r ? qt.hooks.addPack(e, bg(t)) : qt.styles[e] = q(q({}, qt.styles[e] || {}), o), e === "fas" && yu("fa", t);
}
const {
  styles: ma,
  shims: q3
} = qt, D1 = Object.keys(Zf), K3 = D1.reduce((e, t) => (e[t] = Object.keys(Zf[t]), e), {});
let nd = null, z1 = {}, W1 = {}, V1 = {}, H1 = {}, U1 = {};
function X3(e) {
  return ~R3.indexOf(e);
}
function Q3(e, t) {
  const n = t.split("-"), r = n[0], o = n.slice(1).join("-");
  return r === e && o !== "" && !X3(o) ? o : null;
}
const Y1 = () => {
  const e = (r) => Nl(ma, (o, a, i) => (o[i] = Nl(a, r, {}), o), {});
  z1 = e((r, o, a) => (o[3] && (r[o[3]] = a), o[2] && o[2].filter((i) => typeof i == "number").forEach((i) => {
    r[i.toString(16)] = a;
  }), r)), W1 = e((r, o, a) => (r[a] = a, o[2] && o[2].filter((i) => typeof i == "string").forEach((i) => {
    r[i] = a;
  }), r)), U1 = e((r, o, a) => {
    const i = o[2];
    return r[a] = a, i.forEach((s) => {
      r[s] = a;
    }), r;
  });
  const t = "far" in ma || oe.autoFetchSvg, n = Nl(q3, (r, o) => {
    const a = o[0];
    let i = o[1];
    const s = o[2];
    return i === "far" && !t && (i = "fas"), typeof a == "string" && (r.names[a] = {
      prefix: i,
      iconName: s
    }), typeof a == "number" && (r.unicodes[a.toString(16)] = {
      prefix: i,
      iconName: s
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  V1 = n.names, H1 = n.unicodes, nd = xs(oe.styleDefault, {
    family: oe.familyDefault
  });
};
F3((e) => {
  nd = xs(e.styleDefault, {
    family: oe.familyDefault
  });
});
Y1();
function rd(e, t) {
  return (z1[e] || {})[t];
}
function J3(e, t) {
  return (W1[e] || {})[t];
}
function sr(e, t) {
  return (U1[e] || {})[t];
}
function B1(e) {
  return V1[e] || {
    prefix: null,
    iconName: null
  };
}
function Z3(e) {
  const t = H1[e], n = rd("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Xn() {
  return nd;
}
const G1 = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function e$(e) {
  let t = ot;
  const n = D1.reduce((r, o) => (r[o] = "".concat(oe.cssPrefix, "-").concat(o), r), {});
  return P1.forEach((r) => {
    (e.includes(n[r]) || e.some((o) => K3[r].includes(o))) && (t = r);
  }), t;
}
function xs(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = ot
  } = t, r = $3[n][e];
  if (n === ys && !e)
    return "fad";
  const o = mg[n][e] || mg[n][r], a = e in qt.styles ? e : null;
  return o || a || null;
}
function t$(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const o = Q3(oe.cssPrefix, r);
    o ? n = o : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function yg(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function ws(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const o = du.concat(b3), a = yg(e.filter((f) => o.includes(f))), i = yg(e.filter((f) => !du.includes(f))), s = a.filter((f) => (r = f, !S1.includes(f))), [l = null] = s, c = e$(a), u = q(q({}, t$(i)), {}, {
    prefix: xs(l, {
      family: c
    })
  });
  return q(q(q({}, u), a$({
    values: e,
    family: c,
    styles: ma,
    config: oe,
    canonical: u,
    givenPrefix: r
  })), n$(n, r, u));
}
function n$(e, t, n) {
  let {
    prefix: r,
    iconName: o
  } = n;
  if (e || !r || !o)
    return {
      prefix: r,
      iconName: o
    };
  const a = t === "fa" ? B1(o) : {}, i = sr(r, o);
  return o = a.iconName || i || o, r = a.prefix || r, r === "far" && !ma.far && ma.fas && !oe.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: o
  };
}
const r$ = P1.filter((e) => e !== ot || e !== ys), o$ = Object.keys(fu).filter((e) => e !== ot).map((e) => Object.keys(fu[e])).flat();
function a$(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: o = "",
    styles: a = {},
    config: i = {}
  } = e, s = n === ys, l = t.includes("fa-duotone") || t.includes("fad"), c = i.familyDefault === "duotone", u = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (l || c || u) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && r$.includes(n) && (Object.keys(a).find((f) => o$.includes(f)) || i.autoFetchSvg)) {
    const f = c3.get(n).defaultShortPrefixId;
    r.prefix = f, r.iconName = sr(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || o === "fa") && (r.prefix = Xn() || "fas"), r;
}
class i$ {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const o = n.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = q(q({}, this.definitions[a] || {}), o[a]), yu(a, o[a]);
      const i = Zf[ot][a];
      i && yu(i, o[a]), Y1();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, n) {
    const r = n.prefix && n.iconName && n.icon ? {
      0: n
    } : n;
    return Object.keys(r).map((o) => {
      const {
        prefix: a,
        iconName: i,
        icon: s
      } = r[o], l = s[2];
      t[a] || (t[a] = {}), l.length > 0 && l.forEach((c) => {
        typeof c == "string" && (t[a][c] = s);
      }), t[a][i] = s;
    }), t;
  }
}
let vg = [], Fr = {};
const Gr = {}, s$ = Object.keys(Gr);
function l$(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return vg = e, Fr = {}, Object.keys(Gr).forEach((r) => {
    s$.indexOf(r) === -1 && delete Gr[r];
  }), vg.forEach((r) => {
    const o = r.mixout ? r.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (n[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((i) => {
        n[a] || (n[a] = {}), n[a][i] = o[a][i];
      });
    }), r.hooks) {
      const a = r.hooks();
      Object.keys(a).forEach((i) => {
        Fr[i] || (Fr[i] = []), Fr[i].push(a[i]);
      });
    }
    r.provides && r.provides(Gr);
  }), n;
}
function vu(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), o = 2; o < n; o++)
    r[o - 2] = arguments[o];
  return (Fr[e] || []).forEach((a) => {
    t = a.apply(null, [t, ...r]);
  }), t;
}
function xr(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (Fr[e] || []).forEach((o) => {
    o.apply(null, n);
  });
}
function Qn() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Gr[e] ? Gr[e].apply(null, t) : void 0;
}
function xu(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || Xn();
  if (t)
    return t = sr(n, t) || t, hg(q1.definitions, n, t) || hg(qt.styles, n, t);
}
const q1 = new i$(), c$ = () => {
  oe.autoReplaceSvg = !1, oe.observeMutations = !1, xr("noAuto");
}, u$ = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return vn ? (xr("beforeI2svg", e), Qn("pseudoElements2svg", e), Qn("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    oe.autoReplaceSvg === !1 && (oe.autoReplaceSvg = !0), oe.observeMutations = !0, Y3(() => {
      d$({
        autoReplaceSvgRoot: t
      }), xr("watch", e);
    });
  }
}, f$ = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: sr(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = xs(e[0]);
      return {
        prefix: n,
        iconName: sr(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(oe.cssPrefix, "-")) > -1 || e.match(N3))) {
      const t = ws(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Xn(),
        iconName: sr(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Xn();
      return {
        prefix: t,
        iconName: sr(t, e) || e
      };
    }
  }
}, yt = {
  noAuto: c$,
  config: oe,
  dom: u$,
  parse: f$,
  library: q1,
  findIconDefinition: xu,
  toHtml: Ra
}, d$ = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = He
  } = e;
  (Object.keys(qt.styles).length > 0 || oe.autoFetchSvg) && vn && oe.autoReplaceSvg && yt.dom.i2svg({
    node: t
  });
};
function ks(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => Ra(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!vn) return;
      const n = He.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function p$(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: o,
    styles: a,
    transform: i
  } = e;
  if (td(i) && n.found && !r.found) {
    const {
      width: s,
      height: l
    } = n, c = {
      x: s / l / 2,
      y: 0.5
    };
    o.style = vs(q(q({}, a), {}, {
      "transform-origin": "".concat(c.x + i.x / 16, "em ").concat(c.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function m$(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: o,
    symbol: a
  } = e;
  const i = a === !0 ? "".concat(t, "-").concat(oe.cssPrefix, "-").concat(n) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: q(q({}, o), {}, {
        id: i
      }),
      children: r
    }]
  }];
}
function od(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: o,
    transform: a,
    symbol: i,
    title: s,
    maskId: l,
    titleId: c,
    extra: u,
    watchable: f = !1
  } = e, {
    width: d,
    height: p
  } = n.found ? n : t, b = m3.includes(r), m = [oe.replacementClass, o ? "".concat(oe.cssPrefix, "-").concat(o) : ""].filter((h) => u.classes.indexOf(h) === -1).filter((h) => h !== "" || !!h).concat(u.classes).join(" ");
  let g = {
    children: [],
    attributes: q(q({}, u.attributes), {}, {
      "data-prefix": r,
      "data-icon": o,
      class: m,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(d, " ").concat(p)
    })
  };
  const v = b && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(d / p * 16 * 0.0625, "em")
  } : {};
  f && (g.attributes[vr] = ""), s && (g.children.push({
    tag: "title",
    attributes: {
      id: g.attributes["aria-labelledby"] || "title-".concat(c || pa())
    },
    children: [s]
  }), delete g.attributes.title);
  const k = q(q({}, g), {}, {
    prefix: r,
    iconName: o,
    main: t,
    mask: n,
    maskId: l,
    transform: a,
    symbol: i,
    styles: q(q({}, v), u.styles)
  }), {
    children: x,
    attributes: O
  } = n.found && t.found ? Qn("generateAbstractMask", k) || {
    children: [],
    attributes: {}
  } : Qn("generateAbstractIcon", k) || {
    children: [],
    attributes: {}
  };
  return k.children = x, k.attributes = O, i ? m$(k) : p$(k);
}
function xg(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: o,
    title: a,
    extra: i,
    watchable: s = !1
  } = e, l = q(q(q({}, i.attributes), a ? {
    title: a
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (l[vr] = "");
  const c = q({}, i.styles);
  td(o) && (c.transform = V3({
    transform: o,
    startCentered: !0,
    width: n,
    height: r
  }), c["-webkit-transform"] = c.transform);
  const u = vs(c);
  u.length > 0 && (l.style = u);
  const f = [];
  return f.push({
    tag: "span",
    attributes: l,
    children: [t]
  }), a && f.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [a]
  }), f;
}
function g$(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, o = q(q(q({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), a = vs(r.styles);
  a.length > 0 && (o.style = a);
  const i = [];
  return i.push({
    tag: "span",
    attributes: o,
    children: [t]
  }), n && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [n]
  }), i;
}
const {
  styles: Il
} = qt;
function wu(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let o = null;
  return Array.isArray(r) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(oe.cssPrefix, "-").concat(Cl.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(oe.cssPrefix, "-").concat(Cl.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(oe.cssPrefix, "-").concat(Cl.PRIMARY),
        fill: "currentColor",
        d: r[1]
      }
    }]
  } : o = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: r
    }
  }, {
    found: !0,
    width: t,
    height: n,
    icon: o
  };
}
const h$ = {
  found: !1,
  width: 512,
  height: 512
};
function b$(e, t) {
  !N1 && !oe.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function ku(e, t) {
  let n = t;
  return t === "fa" && oe.styleDefault !== null && (t = Xn()), new Promise((r, o) => {
    if (n === "fa") {
      const a = B1(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && Il[t] && Il[t][e]) {
      const a = Il[t][e];
      return r(wu(a));
    }
    b$(e, t), r(q(q({}, h$), {}, {
      icon: oe.showMissingIcons && e ? Qn("missingIconAbstract") || {} : {}
    }));
  });
}
const wg = () => {
}, Eu = oe.measurePerformance && ri && ri.mark && ri.measure ? ri : {
  mark: wg,
  measure: wg
}, Lo = 'FA "6.7.2"', y$ = (e) => (Eu.mark("".concat(Lo, " ").concat(e, " begins")), () => K1(e)), K1 = (e) => {
  Eu.mark("".concat(Lo, " ").concat(e, " ends")), Eu.measure("".concat(Lo, " ").concat(e), "".concat(Lo, " ").concat(e, " begins"), "".concat(Lo, " ").concat(e, " ends"));
};
var ad = {
  begin: y$,
  end: K1
};
const bi = () => {
};
function kg(e) {
  return typeof (e.getAttribute ? e.getAttribute(vr) : null) == "string";
}
function v$(e) {
  const t = e.getAttribute ? e.getAttribute(Qf) : null, n = e.getAttribute ? e.getAttribute(Jf) : null;
  return t && n;
}
function x$(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(oe.replacementClass);
}
function w$() {
  return oe.autoReplaceSvg === !0 ? yi.replace : yi[oe.autoReplaceSvg] || yi.replace;
}
function k$(e) {
  return He.createElementNS("http://www.w3.org/2000/svg", e);
}
function E$(e) {
  return He.createElement(e);
}
function X1(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? k$ : E$
  } = t;
  if (typeof e == "string")
    return He.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    r.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    r.appendChild(X1(o, {
      ceFn: n
    }));
  }), r;
}
function O$(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const yi = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(X1(n), t);
      }), t.getAttribute(vr) === null && oe.keepOriginalSource) {
        let n = He.createComment(O$(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~ed(t).indexOf(oe.replacementClass))
      return yi.replace(e);
    const r = new RegExp("".concat(oe.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const a = n[0].attributes.class.split(" ").reduce((i, s) => (s === oe.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = n.map((a) => Ra(a)).join(`
`);
    t.setAttribute(vr, ""), t.innerHTML = o;
  }
};
function Eg(e) {
  e();
}
function Q1(e, t) {
  const n = typeof t == "function" ? t : bi;
  if (e.length === 0)
    n();
  else {
    let r = Eg;
    oe.mutateApproach === A3 && (r = Kn.requestAnimationFrame || Eg), r(() => {
      const o = w$(), a = ad.begin("mutate");
      e.map(o), a(), n();
    });
  }
}
let id = !1;
function J1() {
  id = !0;
}
function Ou() {
  id = !1;
}
let zi = null;
function Og(e) {
  if (!ug || !oe.observeMutations)
    return;
  const {
    treeCallback: t = bi,
    nodeCallback: n = bi,
    pseudoElementsCallback: r = bi,
    observeMutationsRoot: o = He
  } = e;
  zi = new ug((a) => {
    if (id) return;
    const i = Xn();
    go(a).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !kg(s.addedNodes[0]) && (oe.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && oe.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && kg(s.target) && ~M3.indexOf(s.attributeName))
        if (s.attributeName === "class" && v$(s.target)) {
          const {
            prefix: l,
            iconName: c
          } = ws(ed(s.target));
          s.target.setAttribute(Qf, l || i), c && s.target.setAttribute(Jf, c);
        } else x$(s.target) && n(s.target);
    });
  }), vn && zi.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function S$() {
  zi && zi.disconnect();
}
function P$(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, o) => {
    const a = o.split(":"), i = a[0], s = a.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function A$(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = ws(ed(e));
  return o.prefix || (o.prefix = Xn()), t && n && (o.prefix = t, o.iconName = n), o.iconName && o.prefix || (o.prefix && r.length > 0 && (o.iconName = J3(o.prefix, e.innerText) || rd(o.prefix, L1(e.innerText))), !o.iconName && oe.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function C$(e) {
  const t = go(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return oe.autoA11y && (n ? t["aria-labelledby"] = "".concat(oe.replacementClass, "-title-").concat(r || pa()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function $$() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: Gt,
    symbol: !1,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    extra: {
      classes: [],
      styles: {},
      attributes: {}
    }
  };
}
function Sg(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: o
  } = A$(e), a = C$(e), i = vu("parseNodeAttributes", {}, e);
  let s = t.styleParser ? P$(e) : [];
  return q({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: Gt,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: o,
      styles: s,
      attributes: a
    }
  }, i);
}
const {
  styles: N$
} = qt;
function Z1(e) {
  const t = oe.autoReplaceSvg === "nest" ? Sg(e, {
    styleParser: !1
  }) : Sg(e);
  return ~t.extra.classes.indexOf(T1) ? Qn("generateLayersText", e, t) : Qn("generateSvgReplacementMutation", e, t);
}
function I$() {
  return [...f3, ...du];
}
function Pg(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!vn) return Promise.resolve();
  const n = He.documentElement.classList, r = (u) => n.add("".concat(pg, "-").concat(u)), o = (u) => n.remove("".concat(pg, "-").concat(u)), a = oe.autoFetchSvg ? I$() : S1.concat(Object.keys(N$));
  a.includes("fa") || a.push("fa");
  const i = [".".concat(T1, ":not([").concat(vr, "])")].concat(a.map((u) => ".".concat(u, ":not([").concat(vr, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = go(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), o("complete");
  else
    return Promise.resolve();
  const l = ad.begin("onTree"), c = s.reduce((u, f) => {
    try {
      const d = Z1(f);
      d && u.push(d);
    } catch (d) {
      N1 || d.name === "MissingIcon" && console.error(d);
    }
    return u;
  }, []);
  return new Promise((u, f) => {
    Promise.all(c).then((d) => {
      Q1(d, () => {
        r("active"), r("complete"), o("pending"), typeof t == "function" && t(), l(), u();
      });
    }).catch((d) => {
      l(), f(d);
    });
  });
}
function T$(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  Z1(e).then((n) => {
    n && Q1([n], t);
  });
}
function M$(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : xu(t || {});
    let {
      mask: o
    } = n;
    return o && (o = (o || {}).icon ? o : xu(o || {})), e(r, q(q({}, n), {}, {
      mask: o
    }));
  };
}
const R$ = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = Gt,
    symbol: r = !1,
    mask: o = null,
    maskId: a = null,
    title: i = null,
    titleId: s = null,
    classes: l = [],
    attributes: c = {},
    styles: u = {}
  } = t;
  if (!e) return;
  const {
    prefix: f,
    iconName: d,
    icon: p
  } = e;
  return ks(q({
    type: "icon"
  }, e), () => (xr("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), oe.autoA11y && (i ? c["aria-labelledby"] = "".concat(oe.replacementClass, "-title-").concat(s || pa()) : (c["aria-hidden"] = "true", c.focusable = "false")), od({
    icons: {
      main: wu(p),
      mask: o ? wu(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: f,
    iconName: d,
    transform: q(q({}, Gt), n),
    symbol: r,
    title: i,
    maskId: a,
    titleId: s,
    extra: {
      attributes: c,
      styles: u,
      classes: l
    }
  })));
};
var j$ = {
  mixout() {
    return {
      icon: M$(R$)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Pg, e.nodeCallback = T$, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = He,
        callback: r = () => {
        }
      } = t;
      return Pg(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: o,
        titleId: a,
        prefix: i,
        transform: s,
        symbol: l,
        mask: c,
        maskId: u,
        extra: f
      } = n;
      return new Promise((d, p) => {
        Promise.all([ku(r, i), c.iconName ? ku(c.iconName, c.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((b) => {
          let [m, g] = b;
          d([t, od({
            icons: {
              main: m,
              mask: g
            },
            prefix: i,
            iconName: r,
            transform: s,
            symbol: l,
            maskId: u,
            title: o,
            titleId: a,
            extra: f,
            watchable: !0
          })]);
        }).catch(p);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: o,
        transform: a,
        styles: i
      } = t;
      const s = vs(i);
      s.length > 0 && (r.style = s);
      let l;
      return td(a) && (l = Qn("generateAbstractTransformGrouping", {
        main: o,
        transform: a,
        containerWidth: o.width,
        iconWidth: o.width
      })), n.push(l || o.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, _$ = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return ks({
          type: "layer"
        }, () => {
          xr("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let r = [];
          return e((o) => {
            Array.isArray(o) ? o.map((a) => {
              r = r.concat(a.abstract);
            }) : r = r.concat(o.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(oe.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, F$ = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: n = null,
          classes: r = [],
          attributes: o = {},
          styles: a = {}
        } = t;
        return ks({
          type: "counter",
          content: e
        }, () => (xr("beforeDOMElementCreation", {
          content: e,
          params: t
        }), g$({
          content: e.toString(),
          title: n,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(oe.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, L$ = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = Gt,
          title: r = null,
          classes: o = [],
          attributes: a = {},
          styles: i = {}
        } = t;
        return ks({
          type: "text",
          content: e
        }, () => (xr("beforeDOMElementCreation", {
          content: e,
          params: t
        }), xg({
          content: e,
          transform: q(q({}, Gt), n),
          title: r,
          extra: {
            attributes: a,
            styles: i,
            classes: ["".concat(oe.cssPrefix, "-layers-text"), ...o]
          }
        })));
      }
    };
  },
  provides(e) {
    e.generateLayersText = function(t, n) {
      const {
        title: r,
        transform: o,
        extra: a
      } = n;
      let i = null, s = null;
      if (E1) {
        const l = parseInt(getComputedStyle(t).fontSize, 10), c = t.getBoundingClientRect();
        i = c.width / l, s = c.height / l;
      }
      return oe.autoA11y && !r && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, xg({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: o,
        title: r,
        extra: a,
        watchable: !0
      })]);
    };
  }
};
const D$ = new RegExp('"', "ug"), Ag = [1105920, 1112319], Cg = q(q(q(q({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), l3), S3), y3), Su = Object.keys(Cg).reduce((e, t) => (e[t.toLowerCase()] = Cg[t], e), {}), z$ = Object.keys(Su).reduce((e, t) => {
  const n = Su[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function W$(e) {
  const t = e.replace(D$, ""), n = G3(t, 0), r = n >= Ag[0] && n <= Ag[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: L1(o ? t[0] : t),
    isSecondary: r || o
  };
}
function V$(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), o = isNaN(r) ? "normal" : r;
  return (Su[n] || {})[o] || z$[n];
}
function $g(e, t) {
  const n = "".concat(P3).concat(t.replace(":", "-"));
  return new Promise((r, o) => {
    if (e.getAttribute(n) !== null)
      return r();
    const a = go(e.children).filter((f) => f.getAttribute(mu) === t)[0], i = Kn.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), l = s.match(I3), c = i.getPropertyValue("font-weight"), u = i.getPropertyValue("content");
    if (a && !l)
      return e.removeChild(a), r();
    if (l && u !== "none" && u !== "") {
      const f = i.getPropertyValue("content");
      let d = V$(s, c);
      const {
        value: p,
        isSecondary: b
      } = W$(f), m = l[0].startsWith("FontAwesome");
      let g = rd(d, p), v = g;
      if (m) {
        const k = Z3(p);
        k.iconName && k.prefix && (g = k.iconName, d = k.prefix);
      }
      if (g && !b && (!a || a.getAttribute(Qf) !== d || a.getAttribute(Jf) !== v)) {
        e.setAttribute(n, v), a && e.removeChild(a);
        const k = $$(), {
          extra: x
        } = k;
        x.attributes[mu] = t, ku(g, d).then((O) => {
          const h = od(q(q({}, k), {}, {
            icons: {
              main: O,
              mask: G1()
            },
            prefix: d,
            iconName: v,
            extra: x,
            watchable: !0
          })), L = He.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(L, e.firstChild) : e.appendChild(L), L.outerHTML = h.map((_) => Ra(_)).join(`
`), e.removeAttribute(n), r();
        }).catch(o);
      } else
        r();
    } else
      r();
  });
}
function H$(e) {
  return Promise.all([$g(e, "::before"), $g(e, "::after")]);
}
function U$(e) {
  return e.parentNode !== document.head && !~C3.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(mu) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Ng(e) {
  if (vn)
    return new Promise((t, n) => {
      const r = go(e.querySelectorAll("*")).filter(U$).map(H$), o = ad.begin("searchPseudoElements");
      J1(), Promise.all(r).then(() => {
        o(), Ou(), t();
      }).catch(() => {
        o(), Ou(), n();
      });
    });
}
var Y$ = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Ng, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = He
      } = t;
      oe.searchPseudoElements && Ng(n);
    };
  }
};
let Ig = !1;
var B$ = {
  mixout() {
    return {
      dom: {
        unwatch() {
          J1(), Ig = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Og(vu("mutationObserverCallbacks", {}));
      },
      noAuto() {
        S$();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Ig ? Ou() : Og(vu("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Tg = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((n, r) => {
    const o = r.toLowerCase().split("-"), a = o[0];
    let i = o.slice(1).join("-");
    if (a && i === "h")
      return n.flipX = !0, n;
    if (a && i === "v")
      return n.flipY = !0, n;
    if (i = parseFloat(i), isNaN(i))
      return n;
    switch (a) {
      case "grow":
        n.size = n.size + i;
        break;
      case "shrink":
        n.size = n.size - i;
        break;
      case "left":
        n.x = n.x - i;
        break;
      case "right":
        n.x = n.x + i;
        break;
      case "up":
        n.y = n.y - i;
        break;
      case "down":
        n.y = n.y + i;
        break;
      case "rotate":
        n.rotate = n.rotate + i;
        break;
    }
    return n;
  }, t);
};
var G$ = {
  mixout() {
    return {
      parse: {
        transform: (e) => Tg(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = Tg(n)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: n,
        transform: r,
        containerWidth: o,
        iconWidth: a
      } = t;
      const i = {
        transform: "translate(".concat(o / 2, " 256)")
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), l = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), c = "rotate(".concat(r.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(l, " ").concat(c)
      }, f = {
        transform: "translate(".concat(a / 2 * -1, " -256)")
      }, d = {
        outer: i,
        inner: u,
        path: f
      };
      return {
        tag: "g",
        attributes: q({}, d.outer),
        children: [{
          tag: "g",
          attributes: q({}, d.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: q(q({}, n.icon.attributes), d.path)
          }]
        }]
      };
    };
  }
};
const Tl = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Mg(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function q$(e) {
  return e.tag === "g" ? e.children : [e];
}
var K$ = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? ws(n.split(" ").map((o) => o.trim())) : G1();
        return r.prefix || (r.prefix = Xn()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: n,
        attributes: r,
        main: o,
        mask: a,
        maskId: i,
        transform: s
      } = t;
      const {
        width: l,
        icon: c
      } = o, {
        width: u,
        icon: f
      } = a, d = W3({
        transform: s,
        containerWidth: u,
        iconWidth: l
      }), p = {
        tag: "rect",
        attributes: q(q({}, Tl), {}, {
          fill: "white"
        })
      }, b = c.children ? {
        children: c.children.map(Mg)
      } : {}, m = {
        tag: "g",
        attributes: q({}, d.inner),
        children: [Mg(q({
          tag: c.tag,
          attributes: q(q({}, c.attributes), d.path)
        }, b))]
      }, g = {
        tag: "g",
        attributes: q({}, d.outer),
        children: [m]
      }, v = "mask-".concat(i || pa()), k = "clip-".concat(i || pa()), x = {
        tag: "mask",
        attributes: q(q({}, Tl), {}, {
          id: v,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [p, g]
      }, O = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: k
          },
          children: q$(f)
        }, x]
      };
      return n.push(O, {
        tag: "rect",
        attributes: q({
          fill: "currentColor",
          "clip-path": "url(#".concat(k, ")"),
          mask: "url(#".concat(v, ")")
        }, Tl)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, X$ = {
  provides(e) {
    let t = !1;
    Kn.matchMedia && (t = Kn.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: q(q({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = q(q({}, o), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: q(q({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: q(q({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: q(q({}, a), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(i), n.push({
        tag: "path",
        attributes: q(q({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: q(q({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: q(q({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: q(q({}, a), {}, {
            values: "0;0;1;1;0;0;"
          })
        }]
      }), {
        tag: "g",
        attributes: {
          class: "missing"
        },
        children: n
      };
    };
  }
}, Q$ = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, J$ = [U3, j$, _$, F$, L$, Y$, B$, G$, K$, X$, Q$];
l$(J$, {
  mixoutsTo: yt
});
yt.noAuto;
yt.config;
yt.library;
yt.dom;
const Pu = yt.parse;
yt.findIconDefinition;
yt.toHtml;
const Z$ = yt.icon;
yt.layer;
yt.text;
yt.counter;
function e6(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var ai = { exports: {} }, Ml = { exports: {} }, Ae = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Rg;
function t6() {
  if (Rg) return Ae;
  Rg = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, b = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, g = e ? Symbol.for("react.fundamental") : 60117, v = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
  function x(h) {
    if (typeof h == "object" && h !== null) {
      var L = h.$$typeof;
      switch (L) {
        case t:
          switch (h = h.type, h) {
            case l:
            case c:
            case r:
            case a:
            case o:
            case f:
              return h;
            default:
              switch (h = h && h.$$typeof, h) {
                case s:
                case u:
                case b:
                case p:
                case i:
                  return h;
                default:
                  return L;
              }
          }
        case n:
          return L;
      }
    }
  }
  function O(h) {
    return x(h) === c;
  }
  return Ae.AsyncMode = l, Ae.ConcurrentMode = c, Ae.ContextConsumer = s, Ae.ContextProvider = i, Ae.Element = t, Ae.ForwardRef = u, Ae.Fragment = r, Ae.Lazy = b, Ae.Memo = p, Ae.Portal = n, Ae.Profiler = a, Ae.StrictMode = o, Ae.Suspense = f, Ae.isAsyncMode = function(h) {
    return O(h) || x(h) === l;
  }, Ae.isConcurrentMode = O, Ae.isContextConsumer = function(h) {
    return x(h) === s;
  }, Ae.isContextProvider = function(h) {
    return x(h) === i;
  }, Ae.isElement = function(h) {
    return typeof h == "object" && h !== null && h.$$typeof === t;
  }, Ae.isForwardRef = function(h) {
    return x(h) === u;
  }, Ae.isFragment = function(h) {
    return x(h) === r;
  }, Ae.isLazy = function(h) {
    return x(h) === b;
  }, Ae.isMemo = function(h) {
    return x(h) === p;
  }, Ae.isPortal = function(h) {
    return x(h) === n;
  }, Ae.isProfiler = function(h) {
    return x(h) === a;
  }, Ae.isStrictMode = function(h) {
    return x(h) === o;
  }, Ae.isSuspense = function(h) {
    return x(h) === f;
  }, Ae.isValidElementType = function(h) {
    return typeof h == "string" || typeof h == "function" || h === r || h === c || h === a || h === o || h === f || h === d || typeof h == "object" && h !== null && (h.$$typeof === b || h.$$typeof === p || h.$$typeof === i || h.$$typeof === s || h.$$typeof === u || h.$$typeof === g || h.$$typeof === v || h.$$typeof === k || h.$$typeof === m);
  }, Ae.typeOf = x, Ae;
}
var Ie = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var jg;
function n6() {
  return jg || (jg = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, b = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, g = e ? Symbol.for("react.fundamental") : 60117, v = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
    function x(E) {
      return typeof E == "string" || typeof E == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      E === r || E === c || E === a || E === o || E === f || E === d || typeof E == "object" && E !== null && (E.$$typeof === b || E.$$typeof === p || E.$$typeof === i || E.$$typeof === s || E.$$typeof === u || E.$$typeof === g || E.$$typeof === v || E.$$typeof === k || E.$$typeof === m);
    }
    function O(E) {
      if (typeof E == "object" && E !== null) {
        var ue = E.$$typeof;
        switch (ue) {
          case t:
            var Me = E.type;
            switch (Me) {
              case l:
              case c:
              case r:
              case a:
              case o:
              case f:
                return Me;
              default:
                var it = Me && Me.$$typeof;
                switch (it) {
                  case s:
                  case u:
                  case b:
                  case p:
                  case i:
                    return it;
                  default:
                    return ue;
                }
            }
          case n:
            return ue;
        }
      }
    }
    var h = l, L = c, _ = s, H = i, J = t, Z = u, U = r, T = b, te = p, W = n, j = a, D = o, Q = f, V = !1;
    function z(E) {
      return V || (V = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), y(E) || O(E) === l;
    }
    function y(E) {
      return O(E) === c;
    }
    function w(E) {
      return O(E) === s;
    }
    function C(E) {
      return O(E) === i;
    }
    function A(E) {
      return typeof E == "object" && E !== null && E.$$typeof === t;
    }
    function P(E) {
      return O(E) === u;
    }
    function I(E) {
      return O(E) === r;
    }
    function N(E) {
      return O(E) === b;
    }
    function $(E) {
      return O(E) === p;
    }
    function R(E) {
      return O(E) === n;
    }
    function M(E) {
      return O(E) === a;
    }
    function F(E) {
      return O(E) === o;
    }
    function ee(E) {
      return O(E) === f;
    }
    Ie.AsyncMode = h, Ie.ConcurrentMode = L, Ie.ContextConsumer = _, Ie.ContextProvider = H, Ie.Element = J, Ie.ForwardRef = Z, Ie.Fragment = U, Ie.Lazy = T, Ie.Memo = te, Ie.Portal = W, Ie.Profiler = j, Ie.StrictMode = D, Ie.Suspense = Q, Ie.isAsyncMode = z, Ie.isConcurrentMode = y, Ie.isContextConsumer = w, Ie.isContextProvider = C, Ie.isElement = A, Ie.isForwardRef = P, Ie.isFragment = I, Ie.isLazy = N, Ie.isMemo = $, Ie.isPortal = R, Ie.isProfiler = M, Ie.isStrictMode = F, Ie.isSuspense = ee, Ie.isValidElementType = x, Ie.typeOf = O;
  }()), Ie;
}
var _g;
function e0() {
  return _g || (_g = 1, process.env.NODE_ENV === "production" ? Ml.exports = t6() : Ml.exports = n6()), Ml.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Rl, Fg;
function r6() {
  if (Fg) return Rl;
  Fg = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, n = Object.prototype.propertyIsEnumerable;
  function r(a) {
    if (a == null)
      throw new TypeError("Object.assign cannot be called with null or undefined");
    return Object(a);
  }
  function o() {
    try {
      if (!Object.assign)
        return !1;
      var a = new String("abc");
      if (a[5] = "de", Object.getOwnPropertyNames(a)[0] === "5")
        return !1;
      for (var i = {}, s = 0; s < 10; s++)
        i["_" + String.fromCharCode(s)] = s;
      var l = Object.getOwnPropertyNames(i).map(function(u) {
        return i[u];
      });
      if (l.join("") !== "0123456789")
        return !1;
      var c = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(u) {
        c[u] = u;
      }), Object.keys(Object.assign({}, c)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Rl = o() ? Object.assign : function(a, i) {
    for (var s, l = r(a), c, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var f in s)
        t.call(s, f) && (l[f] = s[f]);
      if (e) {
        c = e(s);
        for (var d = 0; d < c.length; d++)
          n.call(s, c[d]) && (l[c[d]] = s[c[d]]);
      }
    }
    return l;
  }, Rl;
}
var jl, Lg;
function sd() {
  if (Lg) return jl;
  Lg = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return jl = e, jl;
}
var Dg, zg;
function t0() {
  return zg || (zg = 1, Dg = Function.call.bind(Object.prototype.hasOwnProperty)), Dg;
}
var _l, Wg;
function o6() {
  if (Wg) return _l;
  Wg = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ sd(), n = {}, r = /* @__PURE__ */ t0();
    e = function(a) {
      var i = "Warning: " + a;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function o(a, i, s, l, c) {
    if (process.env.NODE_ENV !== "production") {
      for (var u in a)
        if (r(a, u)) {
          var f;
          try {
            if (typeof a[u] != "function") {
              var d = Error(
                (l || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw d.name = "Invariant Violation", d;
            }
            f = a[u](i, u, l, s, null, t);
          } catch (b) {
            f = b;
          }
          if (f && !(f instanceof Error) && e(
            (l || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof f + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), f instanceof Error && !(f.message in n)) {
            n[f.message] = !0;
            var p = c ? c() : "";
            e(
              "Failed " + s + " type: " + f.message + (p ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, _l = o, _l;
}
var Fl, Vg;
function a6() {
  if (Vg) return Fl;
  Vg = 1;
  var e = e0(), t = r6(), n = /* @__PURE__ */ sd(), r = /* @__PURE__ */ t0(), o = /* @__PURE__ */ o6(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(s) {
    var l = "Warning: " + s;
    typeof console < "u" && console.error(l);
    try {
      throw new Error(l);
    } catch {
    }
  });
  function i() {
    return null;
  }
  return Fl = function(s, l) {
    var c = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function f(y) {
      var w = y && (c && y[c] || y[u]);
      if (typeof w == "function")
        return w;
    }
    var d = "<<anonymous>>", p = {
      array: v("array"),
      bigint: v("bigint"),
      bool: v("boolean"),
      func: v("function"),
      number: v("number"),
      object: v("object"),
      string: v("string"),
      symbol: v("symbol"),
      any: k(),
      arrayOf: x,
      element: O(),
      elementType: h(),
      instanceOf: L,
      node: Z(),
      objectOf: H,
      oneOf: _,
      oneOfType: J,
      shape: T,
      exact: te
    };
    function b(y, w) {
      return y === w ? y !== 0 || 1 / y === 1 / w : y !== y && w !== w;
    }
    function m(y, w) {
      this.message = y, this.data = w && typeof w == "object" ? w : {}, this.stack = "";
    }
    m.prototype = Error.prototype;
    function g(y) {
      if (process.env.NODE_ENV !== "production")
        var w = {}, C = 0;
      function A(I, N, $, R, M, F, ee) {
        if (R = R || d, F = F || $, ee !== n) {
          if (l) {
            var E = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw E.name = "Invariant Violation", E;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ue = R + ":" + $;
            !w[ue] && // Avoid spamming the console because they are often not actionable except for lib authors
            C < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + F + "` prop on `" + R + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), w[ue] = !0, C++);
          }
        }
        return N[$] == null ? I ? N[$] === null ? new m("The " + M + " `" + F + "` is marked as required " + ("in `" + R + "`, but its value is `null`.")) : new m("The " + M + " `" + F + "` is marked as required in " + ("`" + R + "`, but its value is `undefined`.")) : null : y(N, $, R, M, F);
      }
      var P = A.bind(null, !1);
      return P.isRequired = A.bind(null, !0), P;
    }
    function v(y) {
      function w(C, A, P, I, N, $) {
        var R = C[A], M = D(R);
        if (M !== y) {
          var F = Q(R);
          return new m(
            "Invalid " + I + " `" + N + "` of type " + ("`" + F + "` supplied to `" + P + "`, expected ") + ("`" + y + "`."),
            { expectedType: y }
          );
        }
        return null;
      }
      return g(w);
    }
    function k() {
      return g(i);
    }
    function x(y) {
      function w(C, A, P, I, N) {
        if (typeof y != "function")
          return new m("Property `" + N + "` of component `" + P + "` has invalid PropType notation inside arrayOf.");
        var $ = C[A];
        if (!Array.isArray($)) {
          var R = D($);
          return new m("Invalid " + I + " `" + N + "` of type " + ("`" + R + "` supplied to `" + P + "`, expected an array."));
        }
        for (var M = 0; M < $.length; M++) {
          var F = y($, M, P, I, N + "[" + M + "]", n);
          if (F instanceof Error)
            return F;
        }
        return null;
      }
      return g(w);
    }
    function O() {
      function y(w, C, A, P, I) {
        var N = w[C];
        if (!s(N)) {
          var $ = D(N);
          return new m("Invalid " + P + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return g(y);
    }
    function h() {
      function y(w, C, A, P, I) {
        var N = w[C];
        if (!e.isValidElementType(N)) {
          var $ = D(N);
          return new m("Invalid " + P + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return g(y);
    }
    function L(y) {
      function w(C, A, P, I, N) {
        if (!(C[A] instanceof y)) {
          var $ = y.name || d, R = z(C[A]);
          return new m("Invalid " + I + " `" + N + "` of type " + ("`" + R + "` supplied to `" + P + "`, expected ") + ("instance of `" + $ + "`."));
        }
        return null;
      }
      return g(w);
    }
    function _(y) {
      if (!Array.isArray(y))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), i;
      function w(C, A, P, I, N) {
        for (var $ = C[A], R = 0; R < y.length; R++)
          if (b($, y[R]))
            return null;
        var M = JSON.stringify(y, function(F, ee) {
          var E = Q(ee);
          return E === "symbol" ? String(ee) : ee;
        });
        return new m("Invalid " + I + " `" + N + "` of value `" + String($) + "` " + ("supplied to `" + P + "`, expected one of " + M + "."));
      }
      return g(w);
    }
    function H(y) {
      function w(C, A, P, I, N) {
        if (typeof y != "function")
          return new m("Property `" + N + "` of component `" + P + "` has invalid PropType notation inside objectOf.");
        var $ = C[A], R = D($);
        if (R !== "object")
          return new m("Invalid " + I + " `" + N + "` of type " + ("`" + R + "` supplied to `" + P + "`, expected an object."));
        for (var M in $)
          if (r($, M)) {
            var F = y($, M, P, I, N + "." + M, n);
            if (F instanceof Error)
              return F;
          }
        return null;
      }
      return g(w);
    }
    function J(y) {
      if (!Array.isArray(y))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var w = 0; w < y.length; w++) {
        var C = y[w];
        if (typeof C != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + V(C) + " at index " + w + "."
          ), i;
      }
      function A(P, I, N, $, R) {
        for (var M = [], F = 0; F < y.length; F++) {
          var ee = y[F], E = ee(P, I, N, $, R, n);
          if (E == null)
            return null;
          E.data && r(E.data, "expectedType") && M.push(E.data.expectedType);
        }
        var ue = M.length > 0 ? ", expected one of type [" + M.join(", ") + "]" : "";
        return new m("Invalid " + $ + " `" + R + "` supplied to " + ("`" + N + "`" + ue + "."));
      }
      return g(A);
    }
    function Z() {
      function y(w, C, A, P, I) {
        return W(w[C]) ? null : new m("Invalid " + P + " `" + I + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return g(y);
    }
    function U(y, w, C, A, P) {
      return new m(
        (y || "React class") + ": " + w + " type `" + C + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + P + "`."
      );
    }
    function T(y) {
      function w(C, A, P, I, N) {
        var $ = C[A], R = D($);
        if (R !== "object")
          return new m("Invalid " + I + " `" + N + "` of type `" + R + "` " + ("supplied to `" + P + "`, expected `object`."));
        for (var M in y) {
          var F = y[M];
          if (typeof F != "function")
            return U(P, I, N, M, Q(F));
          var ee = F($, M, P, I, N + "." + M, n);
          if (ee)
            return ee;
        }
        return null;
      }
      return g(w);
    }
    function te(y) {
      function w(C, A, P, I, N) {
        var $ = C[A], R = D($);
        if (R !== "object")
          return new m("Invalid " + I + " `" + N + "` of type `" + R + "` " + ("supplied to `" + P + "`, expected `object`."));
        var M = t({}, C[A], y);
        for (var F in M) {
          var ee = y[F];
          if (r(y, F) && typeof ee != "function")
            return U(P, I, N, F, Q(ee));
          if (!ee)
            return new m(
              "Invalid " + I + " `" + N + "` key `" + F + "` supplied to `" + P + "`.\nBad object: " + JSON.stringify(C[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(y), null, "  ")
            );
          var E = ee($, F, P, I, N + "." + F, n);
          if (E)
            return E;
        }
        return null;
      }
      return g(w);
    }
    function W(y) {
      switch (typeof y) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !y;
        case "object":
          if (Array.isArray(y))
            return y.every(W);
          if (y === null || s(y))
            return !0;
          var w = f(y);
          if (w) {
            var C = w.call(y), A;
            if (w !== y.entries) {
              for (; !(A = C.next()).done; )
                if (!W(A.value))
                  return !1;
            } else
              for (; !(A = C.next()).done; ) {
                var P = A.value;
                if (P && !W(P[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function j(y, w) {
      return y === "symbol" ? !0 : w ? w["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && w instanceof Symbol : !1;
    }
    function D(y) {
      var w = typeof y;
      return Array.isArray(y) ? "array" : y instanceof RegExp ? "object" : j(w, y) ? "symbol" : w;
    }
    function Q(y) {
      if (typeof y > "u" || y === null)
        return "" + y;
      var w = D(y);
      if (w === "object") {
        if (y instanceof Date)
          return "date";
        if (y instanceof RegExp)
          return "regexp";
      }
      return w;
    }
    function V(y) {
      var w = Q(y);
      switch (w) {
        case "array":
        case "object":
          return "an " + w;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + w;
        default:
          return w;
      }
    }
    function z(y) {
      return !y.constructor || !y.constructor.name ? d : y.constructor.name;
    }
    return p.checkPropTypes = o, p.resetWarningCache = o.resetWarningCache, p.PropTypes = p, p;
  }, Fl;
}
var Ll, Hg;
function i6() {
  if (Hg) return Ll;
  Hg = 1;
  var e = /* @__PURE__ */ sd();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, Ll = function() {
    function r(i, s, l, c, u, f) {
      if (f !== e) {
        var d = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw d.name = "Invariant Violation", d;
      }
    }
    r.isRequired = r;
    function o() {
      return r;
    }
    var a = {
      array: r,
      bigint: r,
      bool: r,
      func: r,
      number: r,
      object: r,
      string: r,
      symbol: r,
      any: r,
      arrayOf: o,
      element: r,
      elementType: r,
      instanceOf: o,
      node: r,
      objectOf: o,
      oneOf: o,
      oneOfType: o,
      shape: o,
      exact: o,
      checkPropTypes: n,
      resetWarningCache: t
    };
    return a.PropTypes = a, a;
  }, Ll;
}
var Ug;
function s6() {
  if (Ug) return ai.exports;
  if (Ug = 1, process.env.NODE_ENV !== "production") {
    var e = e0(), t = !0;
    ai.exports = /* @__PURE__ */ a6()(e.isElement, t);
  } else
    ai.exports = /* @__PURE__ */ i6()();
  return ai.exports;
}
var l6 = /* @__PURE__ */ s6();
const ye = /* @__PURE__ */ e6(l6);
function Yg(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function zt(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Yg(Object(n), !0).forEach(function(r) {
      Lr(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Yg(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Wi(e) {
  "@babel/helpers - typeof";
  return Wi = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Wi(e);
}
function Lr(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function c6(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), o, a;
  for (a = 0; a < r.length; a++)
    o = r[a], !(t.indexOf(o) >= 0) && (n[o] = e[o]);
  return n;
}
function u6(e, t) {
  if (e == null) return {};
  var n = c6(e, t), r, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      r = a[o], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Au(e) {
  return f6(e) || d6(e) || p6(e) || m6();
}
function f6(e) {
  if (Array.isArray(e)) return Cu(e);
}
function d6(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function p6(e, t) {
  if (e) {
    if (typeof e == "string") return Cu(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return Cu(e, t);
  }
}
function Cu(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function m6() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function g6(e) {
  var t, n = e.beat, r = e.fade, o = e.beatFade, a = e.bounce, i = e.shake, s = e.flash, l = e.spin, c = e.spinPulse, u = e.spinReverse, f = e.pulse, d = e.fixedWidth, p = e.inverse, b = e.border, m = e.listItem, g = e.flip, v = e.size, k = e.rotation, x = e.pull, O = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": o,
    "fa-bounce": a,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": l,
    "fa-spin-reverse": u,
    "fa-spin-pulse": c,
    "fa-pulse": f,
    "fa-fw": d,
    "fa-inverse": p,
    "fa-border": b,
    "fa-li": m,
    "fa-flip": g === !0,
    "fa-flip-horizontal": g === "horizontal" || g === "both",
    "fa-flip-vertical": g === "vertical" || g === "both"
  }, Lr(t, "fa-".concat(v), typeof v < "u" && v !== null), Lr(t, "fa-rotate-".concat(k), typeof k < "u" && k !== null && k !== 0), Lr(t, "fa-pull-".concat(x), typeof x < "u" && x !== null), Lr(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(O).map(function(h) {
    return O[h] ? h : null;
  }).filter(function(h) {
    return h;
  });
}
function h6(e) {
  return e = e - 0, e === e;
}
function n0(e) {
  return h6(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var b6 = ["style"];
function y6(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function v6(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), o = n0(n.slice(0, r)), a = n.slice(r + 1).trim();
    return o.startsWith("webkit") ? t[y6(o)] = a : t[o] = a, t;
  }, {});
}
function r0(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(l) {
    return r0(e, l);
  }), o = Object.keys(t.attributes || {}).reduce(function(l, c) {
    var u = t.attributes[c];
    switch (c) {
      case "class":
        l.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        l.attrs.style = v6(u);
        break;
      default:
        c.indexOf("aria-") === 0 || c.indexOf("data-") === 0 ? l.attrs[c.toLowerCase()] = u : l.attrs[n0(c)] = u;
    }
    return l;
  }, {
    attrs: {}
  }), a = n.style, i = a === void 0 ? {} : a, s = u6(n, b6);
  return o.attrs.style = zt(zt({}, o.attrs.style), i), e.apply(void 0, [t.tag, zt(zt({}, o.attrs), s)].concat(Au(r)));
}
var o0 = !1;
try {
  o0 = process.env.NODE_ENV === "production";
} catch {
}
function x6() {
  if (!o0 && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Bg(e) {
  if (e && Wi(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Pu.icon)
    return Pu.icon(e);
  if (e === null)
    return null;
  if (e && Wi(e) === "object" && e.prefix && e.iconName)
    return e;
  if (Array.isArray(e) && e.length === 2)
    return {
      prefix: e[0],
      iconName: e[1]
    };
  if (typeof e == "string")
    return {
      prefix: "fas",
      iconName: e
    };
}
function Dl(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Lr({}, e, t) : {};
}
var Gg = {
  border: !1,
  className: "",
  mask: null,
  maskId: null,
  fixedWidth: !1,
  inverse: !1,
  flip: !1,
  icon: null,
  listItem: !1,
  pull: null,
  pulse: !1,
  rotation: null,
  size: null,
  spin: !1,
  spinPulse: !1,
  spinReverse: !1,
  beat: !1,
  fade: !1,
  beatFade: !1,
  bounce: !1,
  shake: !1,
  symbol: !1,
  title: "",
  titleId: null,
  transform: null,
  swapOpacity: !1
}, ld = /* @__PURE__ */ ke.forwardRef(function(e, t) {
  var n = zt(zt({}, Gg), e), r = n.icon, o = n.mask, a = n.symbol, i = n.className, s = n.title, l = n.titleId, c = n.maskId, u = Bg(r), f = Dl("classes", [].concat(Au(g6(n)), Au((i || "").split(" ")))), d = Dl("transform", typeof n.transform == "string" ? Pu.transform(n.transform) : n.transform), p = Dl("mask", Bg(o)), b = Z$(u, zt(zt(zt(zt({}, f), d), p), {}, {
    symbol: a,
    title: s,
    titleId: l,
    maskId: c
  }));
  if (!b)
    return x6("Could not find icon", u), null;
  var m = b.abstract, g = {
    ref: t
  };
  return Object.keys(n).forEach(function(v) {
    Gg.hasOwnProperty(v) || (g[v] = n[v]);
  }), w6(m[0], g);
});
ld.displayName = "FontAwesomeIcon";
ld.propTypes = {
  beat: ye.bool,
  border: ye.bool,
  beatFade: ye.bool,
  bounce: ye.bool,
  className: ye.string,
  fade: ye.bool,
  flash: ye.bool,
  mask: ye.oneOfType([ye.object, ye.array, ye.string]),
  maskId: ye.string,
  fixedWidth: ye.bool,
  inverse: ye.bool,
  flip: ye.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: ye.oneOfType([ye.object, ye.array, ye.string]),
  listItem: ye.bool,
  pull: ye.oneOf(["right", "left"]),
  pulse: ye.bool,
  rotation: ye.oneOf([0, 90, 180, 270]),
  shake: ye.bool,
  size: ye.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: ye.bool,
  spinPulse: ye.bool,
  spinReverse: ye.bool,
  symbol: ye.oneOfType([ye.bool, ye.string]),
  title: ye.string,
  titleId: ye.string,
  transform: ye.oneOfType([ye.string, ye.object]),
  swapOpacity: ye.bool
};
var w6 = r0.bind(null, ke.createElement);
const cd = "-", k6 = (e) => {
  const t = O6(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(cd);
      return a[0] === "" && a.length !== 1 && a.shift(), a0(a, t) || E6(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const i = n[o] || [];
      return a && r[o] ? [...i, ...r[o]] : i;
    }
  };
}, a0 = (e, t) => {
  var n;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], o = t.nextPart.get(r), a = o ? a0(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const i = e.join(cd);
  return (n = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : n.classGroupId;
}, qg = /^\[(.+)\]$/, E6 = (e) => {
  if (qg.test(e)) {
    const t = qg.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, O6 = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return P6(Object.entries(e.classGroups), n).forEach(([o, a]) => {
    $u(a, r, o, t);
  }), r;
}, $u = (e, t, n, r) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : Kg(t, o);
      a.classGroupId = n;
      return;
    }
    if (typeof o == "function") {
      if (S6(o)) {
        $u(o(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: n
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      $u(i, Kg(t, a), n, r);
    });
  });
}, Kg = (e, t) => {
  let n = e;
  return t.split(cd).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, S6 = (e) => e.isThemeGetter, P6 = (e, t) => t ? e.map(([n, r]) => {
  const o = r.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [n, o];
}) : e, A6 = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const o = (a, i) => {
    n.set(a, i), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = n.get(a);
      if (i !== void 0)
        return i;
      if ((i = r.get(a)) !== void 0)
        return o(a, i), i;
    },
    set(a, i) {
      n.has(a) ? n.set(a, i) : o(a, i);
    }
  };
}, i0 = "!", C6 = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const l = [];
    let c = 0, u = 0, f;
    for (let g = 0; g < s.length; g++) {
      let v = s[g];
      if (c === 0) {
        if (v === o && (r || s.slice(g, g + a) === t)) {
          l.push(s.slice(u, g)), u = g + a;
          continue;
        }
        if (v === "/") {
          f = g;
          continue;
        }
      }
      v === "[" ? c++ : v === "]" && c--;
    }
    const d = l.length === 0 ? s : s.substring(u), p = d.startsWith(i0), b = p ? d.substring(1) : d, m = f && f > u ? f - u : void 0;
    return {
      modifiers: l,
      hasImportantModifier: p,
      baseClassName: b,
      maybePostfixModifierPosition: m
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, $6 = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, N6 = (e) => ({
  cache: A6(e.cacheSize),
  parseClassName: C6(e),
  ...k6(e)
}), I6 = /\s+/, T6 = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(I6);
  let s = "";
  for (let l = i.length - 1; l >= 0; l -= 1) {
    const c = i[l], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: p
    } = n(c);
    let b = !!p, m = r(b ? d.substring(0, p) : d);
    if (!m) {
      if (!b) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (m = r(d), !m) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      b = !1;
    }
    const g = $6(u).join(":"), v = f ? g + i0 : g, k = v + m;
    if (a.includes(k))
      continue;
    a.push(k);
    const x = o(m, b);
    for (let O = 0; O < x.length; ++O) {
      const h = x[O];
      a.push(v + h);
    }
    s = c + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function M6() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = s0(t)) && (r && (r += " "), r += n);
  return r;
}
const s0 = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = s0(e[r])) && (n && (n += " "), n += t);
  return n;
};
function R6(e, ...t) {
  let n, r, o, a = i;
  function i(l) {
    const c = t.reduce((u, f) => f(u), e());
    return n = N6(c), r = n.cache.get, o = n.cache.set, a = s, s(l);
  }
  function s(l) {
    const c = r(l);
    if (c)
      return c;
    const u = T6(l, n);
    return o(l, u), u;
  }
  return function() {
    return a(M6.apply(null, arguments));
  };
}
const Le = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, l0 = /^\[(?:([a-z-]+):)?(.+)\]$/i, j6 = /^\d+\/\d+$/, _6 = /* @__PURE__ */ new Set(["px", "full", "screen"]), F6 = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, L6 = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, D6 = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, z6 = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, W6 = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, rn = (e) => qr(e) || _6.has(e) || j6.test(e), Pn = (e) => ho(e, "length", K6), qr = (e) => !!e && !Number.isNaN(Number(e)), zl = (e) => ho(e, "number", qr), Oo = (e) => !!e && Number.isInteger(Number(e)), V6 = (e) => e.endsWith("%") && qr(e.slice(0, -1)), de = (e) => l0.test(e), An = (e) => F6.test(e), H6 = /* @__PURE__ */ new Set(["length", "size", "percentage"]), U6 = (e) => ho(e, H6, c0), Y6 = (e) => ho(e, "position", c0), B6 = /* @__PURE__ */ new Set(["image", "url"]), G6 = (e) => ho(e, B6, Q6), q6 = (e) => ho(e, "", X6), So = () => !0, ho = (e, t, n) => {
  const r = l0.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, K6 = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  L6.test(e) && !D6.test(e)
), c0 = () => !1, X6 = (e) => z6.test(e), Q6 = (e) => W6.test(e), J6 = () => {
  const e = Le("colors"), t = Le("spacing"), n = Le("blur"), r = Le("brightness"), o = Le("borderColor"), a = Le("borderRadius"), i = Le("borderSpacing"), s = Le("borderWidth"), l = Le("contrast"), c = Le("grayscale"), u = Le("hueRotate"), f = Le("invert"), d = Le("gap"), p = Le("gradientColorStops"), b = Le("gradientColorStopPositions"), m = Le("inset"), g = Le("margin"), v = Le("opacity"), k = Le("padding"), x = Le("saturate"), O = Le("scale"), h = Le("sepia"), L = Le("skew"), _ = Le("space"), H = Le("translate"), J = () => ["auto", "contain", "none"], Z = () => ["auto", "hidden", "clip", "visible", "scroll"], U = () => ["auto", de, t], T = () => [de, t], te = () => ["", rn, Pn], W = () => ["auto", qr, de], j = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], D = () => ["solid", "dashed", "dotted", "double", "none"], Q = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], V = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], z = () => ["", "0", de], y = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], w = () => [qr, de];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [So],
      spacing: [rn, Pn],
      blur: ["none", "", An, de],
      brightness: w(),
      borderColor: [e],
      borderRadius: ["none", "", "full", An, de],
      borderSpacing: T(),
      borderWidth: te(),
      contrast: w(),
      grayscale: z(),
      hueRotate: w(),
      invert: z(),
      gap: T(),
      gradientColorStops: [e],
      gradientColorStopPositions: [V6, Pn],
      inset: U(),
      margin: U(),
      opacity: w(),
      padding: T(),
      saturate: w(),
      scale: w(),
      sepia: z(),
      skew: w(),
      space: T(),
      translate: T()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", de]
      }],
      /**
       * Container
       * @see https://tailwindcss.com/docs/container
       */
      container: ["container"],
      /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */
      columns: [{
        columns: [An]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": y()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": y()
      }],
      /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */
      box: [{
        box: ["border", "content"]
      }],
      /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */
      isolation: ["isolate", "isolation-auto"],
      /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */
      "object-position": [{
        object: [...j(), de]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: Z()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": Z()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": Z()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: J()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": J()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": J()
      }],
      /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      /**
       * Top / Right / Bottom / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      inset: [{
        inset: [m]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [m]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [m]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [m]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [m]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [m]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [m]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [m]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [m]
      }],
      /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */
      visibility: ["visible", "invisible", "collapse"],
      /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */
      z: [{
        z: ["auto", Oo, de]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: U()
      }],
      /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */
      "flex-wrap": [{
        flex: ["wrap", "wrap-reverse", "nowrap"]
      }],
      /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */
      flex: [{
        flex: ["1", "auto", "initial", "none", de]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: z()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: z()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Oo, de]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [So]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Oo, de]
        }, de]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": W()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": W()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [So]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Oo, de]
        }, de]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": W()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": W()
      }],
      /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */
      "auto-cols": [{
        "auto-cols": ["auto", "min", "max", "fr", de]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", de]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [d]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [d]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [d]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...V()]
      }],
      /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */
      "justify-items": [{
        "justify-items": ["start", "end", "center", "stretch"]
      }],
      /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */
      "justify-self": [{
        "justify-self": ["auto", "start", "end", "center", "stretch"]
      }],
      /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */
      "align-content": [{
        content: ["normal", ...V(), "baseline"]
      }],
      /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */
      "align-items": [{
        items: ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */
      "align-self": [{
        self: ["auto", "start", "end", "center", "stretch", "baseline"]
      }],
      /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */
      "place-content": [{
        "place-content": [...V(), "baseline"]
      }],
      /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */
      "place-items": [{
        "place-items": ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */
      "place-self": [{
        "place-self": ["auto", "start", "end", "center", "stretch"]
      }],
      // Spacing
      /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */
      p: [{
        p: [k]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [k]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [k]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [k]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [k]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [k]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [k]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [k]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [k]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [g]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [g]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [g]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [g]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [g]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [g]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [g]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [g]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [g]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [_]
      }],
      /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-x-reverse": ["space-x-reverse"],
      /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/space
       */
      "space-y": [{
        "space-y": [_]
      }],
      /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-y-reverse": ["space-y-reverse"],
      // Sizing
      /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */
      w: [{
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", de, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [de, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [de, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [An]
        }, An]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [de, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [de, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [de, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [de, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", An, Pn]
      }],
      /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */
      "font-style": ["italic", "not-italic"],
      /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */
      "font-weight": [{
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", zl]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [So]
      }],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-normal": ["normal-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-ordinal": ["ordinal"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-slashed-zero": ["slashed-zero"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */
      tracking: [{
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", de]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", qr, zl]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", rn, de]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", de]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", de]
      }],
      /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/placeholder-color
       */
      "placeholder-color": [{
        placeholder: [e]
      }],
      /**
       * Placeholder Opacity
       * @see https://tailwindcss.com/docs/placeholder-opacity
       */
      "placeholder-opacity": [{
        "placeholder-opacity": [v]
      }],
      /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */
      "text-color": [{
        text: [e]
      }],
      /**
       * Text Opacity
       * @see https://tailwindcss.com/docs/text-opacity
       */
      "text-opacity": [{
        "text-opacity": [v]
      }],
      /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */
      "text-decoration-style": [{
        decoration: [...D(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", rn, Pn]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", rn, de]
      }],
      /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */
      "text-decoration-color": [{
        decoration: [e]
      }],
      /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      /**
       * Text Wrap
       * @see https://tailwindcss.com/docs/text-wrap
       */
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */
      indent: [{
        indent: T()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", de]
      }],
      /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */
      content: [{
        content: ["none", de]
      }],
      // Backgrounds
      /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      /**
       * Background Opacity
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/background-opacity
       */
      "bg-opacity": [{
        "bg-opacity": [v]
      }],
      /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */
      "bg-position": [{
        bg: [...j(), Y6]
      }],
      /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */
      "bg-repeat": [{
        bg: ["no-repeat", {
          repeat: ["", "x", "y", "round", "space"]
        }]
      }],
      /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */
      "bg-size": [{
        bg: ["auto", "cover", "contain", U6]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, G6]
      }],
      /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */
      "bg-color": [{
        bg: [e]
      }],
      /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from-pos": [{
        from: [b]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [b]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [b]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [p]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [p]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [p]
      }],
      // Borders
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: [a]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [a]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [a]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [a]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [a]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [a]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [a]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [a]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [a]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [a]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [a]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [a]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [a]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [a]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [a]
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: [s]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [s]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [s]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [s]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [s]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [s]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [s]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [s]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [s]
      }],
      /**
       * Border Opacity
       * @see https://tailwindcss.com/docs/border-opacity
       */
      "border-opacity": [{
        "border-opacity": [v]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...D(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [s]
      }],
      /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x-reverse": ["divide-x-reverse"],
      /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y": [{
        "divide-y": [s]
      }],
      /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y-reverse": ["divide-y-reverse"],
      /**
       * Divide Opacity
       * @see https://tailwindcss.com/docs/divide-opacity
       */
      "divide-opacity": [{
        "divide-opacity": [v]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: D()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [o]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [o]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [o]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [o]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [o]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [o]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [o]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [o]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [o]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [o]
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: ["", ...D()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [rn, de]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [rn, Pn]
      }],
      /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */
      "outline-color": [{
        outline: [e]
      }],
      /**
       * Ring Width
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w": [{
        ring: te()
      }],
      /**
       * Ring Width Inset
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w-inset": ["ring-inset"],
      /**
       * Ring Color
       * @see https://tailwindcss.com/docs/ring-color
       */
      "ring-color": [{
        ring: [e]
      }],
      /**
       * Ring Opacity
       * @see https://tailwindcss.com/docs/ring-opacity
       */
      "ring-opacity": [{
        "ring-opacity": [v]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [rn, Pn]
      }],
      /**
       * Ring Offset Color
       * @see https://tailwindcss.com/docs/ring-offset-color
       */
      "ring-offset-color": [{
        "ring-offset": [e]
      }],
      // Effects
      /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */
      shadow: [{
        shadow: ["", "inner", "none", An, q6]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [So]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [v]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...Q(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": Q()
      }],
      // Filters
      /**
       * Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/filter
       */
      filter: [{
        filter: ["", "none"]
      }],
      /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */
      blur: [{
        blur: [n]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [r]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [l]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", An, de]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [c]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [u]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [f]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [x]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [h]
      }],
      /**
       * Backdrop Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/backdrop-filter
       */
      "backdrop-filter": [{
        "backdrop-filter": ["", "none"]
      }],
      /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */
      "backdrop-blur": [{
        "backdrop-blur": [n]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [r]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [l]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [c]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [u]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [f]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [v]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [x]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [h]
      }],
      // Tables
      /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing": [{
        "border-spacing": [i]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [i]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [i]
      }],
      /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */
      caption: [{
        caption: ["top", "bottom"]
      }],
      // Transitions and Animation
      /**
       * Tranisition Property
       * @see https://tailwindcss.com/docs/transition-property
       */
      transition: [{
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", de]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: w()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", de]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: w()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", de]
      }],
      // Transforms
      /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */
      transform: [{
        transform: ["", "gpu", "none"]
      }],
      /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */
      scale: [{
        scale: [O]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [O]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [O]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [Oo, de]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [H]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [H]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [L]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [L]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", de]
      }],
      // Interactivity
      /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */
      accent: [{
        accent: ["auto", e]
      }],
      /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */
      appearance: [{
        appearance: ["none", "auto"]
      }],
      /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", de]
      }],
      /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */
      "caret-color": [{
        caret: [e]
      }],
      /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */
      "pointer-events": [{
        "pointer-events": ["none", "auto"]
      }],
      /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */
      resize: [{
        resize: ["none", "y", "x", ""]
      }],
      /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-m": [{
        "scroll-m": T()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": T()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": T()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": T()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": T()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": T()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": T()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": T()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": T()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": T()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": T()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": T()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": T()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": T()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": T()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": T()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": T()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": T()
      }],
      /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-pz": ["touch-pinch-zoom"],
      /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", de]
      }],
      // SVG
      /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */
      fill: [{
        fill: [e, "none"]
      }],
      /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */
      "stroke-w": [{
        stroke: [rn, Pn, zl]
      }],
      /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */
      stroke: [{
        stroke: [e, "none"]
      }],
      // Accessibility
      /**
       * Screen Readers
       * @see https://tailwindcss.com/docs/screen-readers
       */
      sr: ["sr-only", "not-sr-only"],
      /**
       * Forced Color Adjust
       * @see https://tailwindcss.com/docs/forced-color-adjust
       */
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    }
  };
}, Z6 = /* @__PURE__ */ R6(J6), eN = ({
  onClick: e,
  className: t,
  size: n = "md"
}) => /* @__PURE__ */ Y(
  "button",
  {
    onClick: e,
    className: Z6(
      "flex items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white",
      {
        sm: "h-5 w-5 text-sm",
        md: "h-7 w-7 text-md",
        lg: "h-9 w-9 text-xl"
      }[n],
      t
    ),
    children: /* @__PURE__ */ Y(ld, { icon: JC })
  }
);
var ud = _a(), ce = (e) => ja(e, ud), fd = _a();
ce.write = (e) => ja(e, fd);
var Es = _a();
ce.onStart = (e) => ja(e, Es);
var dd = _a();
ce.onFrame = (e) => ja(e, dd);
var pd = _a();
ce.onFinish = (e) => ja(e, pd);
var Kr = [];
ce.setTimeout = (e, t) => {
  const n = ce.now() + t, r = () => {
    const a = Kr.findIndex((i) => i.cancel == r);
    ~a && Kr.splice(a, 1), Ln -= ~a ? 1 : 0;
  }, o = { time: n, handler: e, cancel: r };
  return Kr.splice(u0(n), 0, o), Ln += 1, f0(), o;
};
var u0 = (e) => ~(~Kr.findIndex((t) => t.time > e) || ~Kr.length);
ce.cancel = (e) => {
  Es.delete(e), dd.delete(e), pd.delete(e), ud.delete(e), fd.delete(e);
};
ce.sync = (e) => {
  Nu = !0, ce.batchedUpdates(e), Nu = !1;
};
ce.throttle = (e) => {
  let t;
  function n() {
    try {
      e(...t);
    } finally {
      t = null;
    }
  }
  function r(...o) {
    t = o, ce.onStart(n);
  }
  return r.handler = e, r.cancel = () => {
    Es.delete(n), t = null;
  }, r;
};
var md = typeof window < "u" ? window.requestAnimationFrame : (
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  () => {
  }
);
ce.use = (e) => md = e;
ce.now = typeof performance < "u" ? () => performance.now() : Date.now;
ce.batchedUpdates = (e) => e();
ce.catch = console.error;
ce.frameLoop = "always";
ce.advance = () => {
  ce.frameLoop !== "demand" ? console.warn(
    "Cannot call the manual advancement of rafz whilst frameLoop is not set as demand"
  ) : p0();
};
var Fn = -1, Ln = 0, Nu = !1;
function ja(e, t) {
  Nu ? (t.delete(e), e(0)) : (t.add(e), f0());
}
function f0() {
  Fn < 0 && (Fn = 0, ce.frameLoop !== "demand" && md(d0));
}
function tN() {
  Fn = -1;
}
function d0() {
  ~Fn && (md(d0), ce.batchedUpdates(p0));
}
function p0() {
  const e = Fn;
  Fn = ce.now();
  const t = u0(Fn);
  if (t && (m0(Kr.splice(0, t), (n) => n.handler()), Ln -= t), !Ln) {
    tN();
    return;
  }
  Es.flush(), ud.flush(e ? Math.min(64, Fn - e) : 16.667), dd.flush(), fd.flush(), pd.flush();
}
function _a() {
  let e = /* @__PURE__ */ new Set(), t = e;
  return {
    add(n) {
      Ln += t == e && !e.has(n) ? 1 : 0, e.add(n);
    },
    delete(n) {
      return Ln -= t == e && e.has(n) ? 1 : 0, e.delete(n);
    },
    flush(n) {
      t.size && (e = /* @__PURE__ */ new Set(), Ln -= t.size, m0(t, (r) => r(n) && e.add(r)), Ln += e.size, t = e);
    }
  };
}
function m0(e, t) {
  e.forEach((n) => {
    try {
      t(n);
    } catch (r) {
      ce.catch(r);
    }
  });
}
var nN = Object.defineProperty, rN = (e, t) => {
  for (var n in t)
    nN(e, n, { get: t[n], enumerable: !0 });
}, Mt = {};
rN(Mt, {
  assign: () => aN,
  colors: () => zn,
  createStringInterpolator: () => hd,
  skipAnimation: () => h0,
  to: () => g0,
  willAdvance: () => bd
});
function Iu() {
}
var oN = (e, t, n) => Object.defineProperty(e, t, { value: n, writable: !0, configurable: !0 }), X = {
  arr: Array.isArray,
  obj: (e) => !!e && e.constructor.name === "Object",
  fun: (e) => typeof e == "function",
  str: (e) => typeof e == "string",
  num: (e) => typeof e == "number",
  und: (e) => e === void 0
};
function ln(e, t) {
  if (X.arr(e)) {
    if (!X.arr(t) || e.length !== t.length) return !1;
    for (let n = 0; n < e.length; n++)
      if (e[n] !== t[n]) return !1;
    return !0;
  }
  return e === t;
}
var ge = (e, t) => e.forEach(t);
function Zt(e, t, n) {
  if (X.arr(e)) {
    for (let r = 0; r < e.length; r++)
      t.call(n, e[r], `${r}`);
    return;
  }
  for (const r in e)
    e.hasOwnProperty(r) && t.call(n, e[r], r);
}
var st = (e) => X.und(e) ? [] : X.arr(e) ? e : [e];
function Xo(e, t) {
  if (e.size) {
    const n = Array.from(e);
    e.clear(), ge(n, t);
  }
}
var Do = (e, ...t) => Xo(e, (n) => n(...t)), gd = () => typeof window > "u" || !window.navigator || /ServerSideRendering|^Deno\//.test(window.navigator.userAgent), hd, g0, zn = null, h0 = !1, bd = Iu, aN = (e) => {
  e.to && (g0 = e.to), e.now && (ce.now = e.now), e.colors !== void 0 && (zn = e.colors), e.skipAnimation != null && (h0 = e.skipAnimation), e.createStringInterpolator && (hd = e.createStringInterpolator), e.requestAnimationFrame && ce.use(e.requestAnimationFrame), e.batchedUpdates && (ce.batchedUpdates = e.batchedUpdates), e.willAdvance && (bd = e.willAdvance), e.frameLoop && (ce.frameLoop = e.frameLoop);
}, Qo = /* @__PURE__ */ new Set(), Pt = [], Wl = [], Vi = 0, Os = {
  get idle() {
    return !Qo.size && !Pt.length;
  },
  /** Advance the given animation on every frame until idle. */
  start(e) {
    Vi > e.priority ? (Qo.add(e), ce.onStart(iN)) : (b0(e), ce(Tu));
  },
  /** Advance all animations by the given time. */
  advance: Tu,
  /** Call this when an animation's priority changes. */
  sort(e) {
    if (Vi)
      ce.onFrame(() => Os.sort(e));
    else {
      const t = Pt.indexOf(e);
      ~t && (Pt.splice(t, 1), y0(e));
    }
  },
  /**
   * Clear all animations. For testing purposes.
   *
   * ☠️ Never call this from within the frameloop.
   */
  clear() {
    Pt = [], Qo.clear();
  }
};
function iN() {
  Qo.forEach(b0), Qo.clear(), ce(Tu);
}
function b0(e) {
  Pt.includes(e) || y0(e);
}
function y0(e) {
  Pt.splice(
    sN(Pt, (t) => t.priority > e.priority),
    0,
    e
  );
}
function Tu(e) {
  const t = Wl;
  for (let n = 0; n < Pt.length; n++) {
    const r = Pt[n];
    Vi = r.priority, r.idle || (bd(r), r.advance(e), r.idle || t.push(r));
  }
  return Vi = 0, Wl = Pt, Wl.length = 0, Pt = t, Pt.length > 0;
}
function sN(e, t) {
  const n = e.findIndex(t);
  return n < 0 ? e.length : n;
}
var lN = {
  transparent: 0,
  aliceblue: 4042850303,
  antiquewhite: 4209760255,
  aqua: 16777215,
  aquamarine: 2147472639,
  azure: 4043309055,
  beige: 4126530815,
  bisque: 4293182719,
  black: 255,
  blanchedalmond: 4293643775,
  blue: 65535,
  blueviolet: 2318131967,
  brown: 2771004159,
  burlywood: 3736635391,
  burntsienna: 3934150143,
  cadetblue: 1604231423,
  chartreuse: 2147418367,
  chocolate: 3530104575,
  coral: 4286533887,
  cornflowerblue: 1687547391,
  cornsilk: 4294499583,
  crimson: 3692313855,
  cyan: 16777215,
  darkblue: 35839,
  darkcyan: 9145343,
  darkgoldenrod: 3095792639,
  darkgray: 2846468607,
  darkgreen: 6553855,
  darkgrey: 2846468607,
  darkkhaki: 3182914559,
  darkmagenta: 2332068863,
  darkolivegreen: 1433087999,
  darkorange: 4287365375,
  darkorchid: 2570243327,
  darkred: 2332033279,
  darksalmon: 3918953215,
  darkseagreen: 2411499519,
  darkslateblue: 1211993087,
  darkslategray: 793726975,
  darkslategrey: 793726975,
  darkturquoise: 13554175,
  darkviolet: 2483082239,
  deeppink: 4279538687,
  deepskyblue: 12582911,
  dimgray: 1768516095,
  dimgrey: 1768516095,
  dodgerblue: 512819199,
  firebrick: 2988581631,
  floralwhite: 4294635775,
  forestgreen: 579543807,
  fuchsia: 4278255615,
  gainsboro: 3705462015,
  ghostwhite: 4177068031,
  gold: 4292280575,
  goldenrod: 3668254975,
  gray: 2155905279,
  green: 8388863,
  greenyellow: 2919182335,
  grey: 2155905279,
  honeydew: 4043305215,
  hotpink: 4285117695,
  indianred: 3445382399,
  indigo: 1258324735,
  ivory: 4294963455,
  khaki: 4041641215,
  lavender: 3873897215,
  lavenderblush: 4293981695,
  lawngreen: 2096890111,
  lemonchiffon: 4294626815,
  lightblue: 2916673279,
  lightcoral: 4034953471,
  lightcyan: 3774873599,
  lightgoldenrodyellow: 4210742015,
  lightgray: 3553874943,
  lightgreen: 2431553791,
  lightgrey: 3553874943,
  lightpink: 4290167295,
  lightsalmon: 4288707327,
  lightseagreen: 548580095,
  lightskyblue: 2278488831,
  lightslategray: 2005441023,
  lightslategrey: 2005441023,
  lightsteelblue: 2965692159,
  lightyellow: 4294959359,
  lime: 16711935,
  limegreen: 852308735,
  linen: 4210091775,
  magenta: 4278255615,
  maroon: 2147483903,
  mediumaquamarine: 1724754687,
  mediumblue: 52735,
  mediumorchid: 3126187007,
  mediumpurple: 2473647103,
  mediumseagreen: 1018393087,
  mediumslateblue: 2070474495,
  mediumspringgreen: 16423679,
  mediumturquoise: 1221709055,
  mediumvioletred: 3340076543,
  midnightblue: 421097727,
  mintcream: 4127193855,
  mistyrose: 4293190143,
  moccasin: 4293178879,
  navajowhite: 4292783615,
  navy: 33023,
  oldlace: 4260751103,
  olive: 2155872511,
  olivedrab: 1804477439,
  orange: 4289003775,
  orangered: 4282712319,
  orchid: 3664828159,
  palegoldenrod: 4008225535,
  palegreen: 2566625535,
  paleturquoise: 2951671551,
  palevioletred: 3681588223,
  papayawhip: 4293907967,
  peachpuff: 4292524543,
  peru: 3448061951,
  pink: 4290825215,
  plum: 3718307327,
  powderblue: 2967529215,
  purple: 2147516671,
  rebeccapurple: 1714657791,
  red: 4278190335,
  rosybrown: 3163525119,
  royalblue: 1097458175,
  saddlebrown: 2336560127,
  salmon: 4202722047,
  sandybrown: 4104413439,
  seagreen: 780883967,
  seashell: 4294307583,
  sienna: 2689740287,
  silver: 3233857791,
  skyblue: 2278484991,
  slateblue: 1784335871,
  slategray: 1887473919,
  slategrey: 1887473919,
  snow: 4294638335,
  springgreen: 16744447,
  steelblue: 1182971135,
  tan: 3535047935,
  teal: 8421631,
  thistle: 3636451583,
  tomato: 4284696575,
  turquoise: 1088475391,
  violet: 4001558271,
  wheat: 4125012991,
  white: 4294967295,
  whitesmoke: 4126537215,
  yellow: 4294902015,
  yellowgreen: 2597139199
}, It = "[-+]?\\d*\\.?\\d+", Hi = It + "%";
function Ss(...e) {
  return "\\(\\s*(" + e.join(")\\s*,\\s*(") + ")\\s*\\)";
}
var cN = new RegExp("rgb" + Ss(It, It, It)), uN = new RegExp("rgba" + Ss(It, It, It, It)), fN = new RegExp("hsl" + Ss(It, Hi, Hi)), dN = new RegExp(
  "hsla" + Ss(It, Hi, Hi, It)
), pN = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/, mN = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/, gN = /^#([0-9a-fA-F]{6})$/, hN = /^#([0-9a-fA-F]{8})$/;
function bN(e) {
  let t;
  return typeof e == "number" ? e >>> 0 === e && e >= 0 && e <= 4294967295 ? e : null : (t = gN.exec(e)) ? parseInt(t[1] + "ff", 16) >>> 0 : zn && zn[e] !== void 0 ? zn[e] : (t = cN.exec(e)) ? (Ir(t[1]) << 24 | // r
  Ir(t[2]) << 16 | // g
  Ir(t[3]) << 8 | // b
  255) >>> // a
  0 : (t = uN.exec(e)) ? (Ir(t[1]) << 24 | // r
  Ir(t[2]) << 16 | // g
  Ir(t[3]) << 8 | // b
  Jg(t[4])) >>> // a
  0 : (t = pN.exec(e)) ? parseInt(
    t[1] + t[1] + // r
    t[2] + t[2] + // g
    t[3] + t[3] + // b
    "ff",
    // a
    16
  ) >>> 0 : (t = hN.exec(e)) ? parseInt(t[1], 16) >>> 0 : (t = mN.exec(e)) ? parseInt(
    t[1] + t[1] + // r
    t[2] + t[2] + // g
    t[3] + t[3] + // b
    t[4] + t[4],
    // a
    16
  ) >>> 0 : (t = fN.exec(e)) ? (Xg(
    Qg(t[1]),
    // h
    ii(t[2]),
    // s
    ii(t[3])
    // l
  ) | 255) >>> // a
  0 : (t = dN.exec(e)) ? (Xg(
    Qg(t[1]),
    // h
    ii(t[2]),
    // s
    ii(t[3])
    // l
  ) | Jg(t[4])) >>> // a
  0 : null;
}
function Vl(e, t, n) {
  return n < 0 && (n += 1), n > 1 && (n -= 1), n < 1 / 6 ? e + (t - e) * 6 * n : n < 1 / 2 ? t : n < 2 / 3 ? e + (t - e) * (2 / 3 - n) * 6 : e;
}
function Xg(e, t, n) {
  const r = n < 0.5 ? n * (1 + t) : n + t - n * t, o = 2 * n - r, a = Vl(o, r, e + 1 / 3), i = Vl(o, r, e), s = Vl(o, r, e - 1 / 3);
  return Math.round(a * 255) << 24 | Math.round(i * 255) << 16 | Math.round(s * 255) << 8;
}
function Ir(e) {
  const t = parseInt(e, 10);
  return t < 0 ? 0 : t > 255 ? 255 : t;
}
function Qg(e) {
  return (parseFloat(e) % 360 + 360) % 360 / 360;
}
function Jg(e) {
  const t = parseFloat(e);
  return t < 0 ? 0 : t > 1 ? 255 : Math.round(t * 255);
}
function ii(e) {
  const t = parseFloat(e);
  return t < 0 ? 0 : t > 100 ? 1 : t / 100;
}
function Zg(e) {
  let t = bN(e);
  if (t === null) return e;
  t = t || 0;
  const n = (t & 4278190080) >>> 24, r = (t & 16711680) >>> 16, o = (t & 65280) >>> 8, a = (t & 255) / 255;
  return `rgba(${n}, ${r}, ${o}, ${a})`;
}
var ga = (e, t, n) => {
  if (X.fun(e))
    return e;
  if (X.arr(e))
    return ga({
      range: e,
      output: t,
      extrapolate: n
    });
  if (X.str(e.output[0]))
    return hd(e);
  const r = e, o = r.output, a = r.range || [0, 1], i = r.extrapolateLeft || r.extrapolate || "extend", s = r.extrapolateRight || r.extrapolate || "extend", l = r.easing || ((c) => c);
  return (c) => {
    const u = vN(c, a);
    return yN(
      c,
      a[u],
      a[u + 1],
      o[u],
      o[u + 1],
      l,
      i,
      s,
      r.map
    );
  };
};
function yN(e, t, n, r, o, a, i, s, l) {
  let c = l ? l(e) : e;
  if (c < t) {
    if (i === "identity") return c;
    i === "clamp" && (c = t);
  }
  if (c > n) {
    if (s === "identity") return c;
    s === "clamp" && (c = n);
  }
  return r === o ? r : t === n ? e <= t ? r : o : (t === -1 / 0 ? c = -c : n === 1 / 0 ? c = c - t : c = (c - t) / (n - t), c = a(c), r === -1 / 0 ? c = -c : o === 1 / 0 ? c = c + r : c = c * (o - r) + r, c);
}
function vN(e, t) {
  for (var n = 1; n < t.length - 1 && !(t[n] >= e); ++n)
    ;
  return n - 1;
}
var xN = {
  linear: (e) => e
}, ha = Symbol.for("FluidValue.get"), oo = Symbol.for("FluidValue.observers"), St = (e) => !!(e && e[ha]), ut = (e) => e && e[ha] ? e[ha]() : e, eh = (e) => e[oo] || null;
function wN(e, t) {
  e.eventObserved ? e.eventObserved(t) : e(t);
}
function ba(e, t) {
  const n = e[oo];
  n && n.forEach((r) => {
    wN(r, t);
  });
}
var v0 = class {
  constructor(e) {
    if (!e && !(e = this.get))
      throw Error("Unknown getter");
    kN(this, e);
  }
}, kN = (e, t) => x0(e, ha, t);
function bo(e, t) {
  if (e[ha]) {
    let n = e[oo];
    n || x0(e, oo, n = /* @__PURE__ */ new Set()), n.has(t) || (n.add(t), e.observerAdded && e.observerAdded(n.size, t));
  }
  return t;
}
function ya(e, t) {
  const n = e[oo];
  if (n && n.has(t)) {
    const r = n.size - 1;
    r ? n.delete(t) : e[oo] = null, e.observerRemoved && e.observerRemoved(r, t);
  }
}
var x0 = (e, t, n) => Object.defineProperty(e, t, {
  value: n,
  writable: !0,
  configurable: !0
}), vi = /[+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, EN = /(#(?:[0-9a-f]{2}){2,4}|(#[0-9a-f]{3})|(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\))/gi, th = new RegExp(`(${vi.source})(%|[a-z]+)`, "i"), ON = /rgba\(([0-9\.-]+), ([0-9\.-]+), ([0-9\.-]+), ([0-9\.-]+)\)/gi, Ps = /var\((--[a-zA-Z0-9-_]+),? ?([a-zA-Z0-9 ()%#.,-]+)?\)/, w0 = (e) => {
  const [t, n] = SN(e);
  if (!t || gd())
    return e;
  const r = window.getComputedStyle(document.documentElement).getPropertyValue(t);
  return r ? r.trim() : n && n.startsWith("--") ? window.getComputedStyle(document.documentElement).getPropertyValue(n) || e : n && Ps.test(n) ? w0(n) : n || e;
}, SN = (e) => {
  const t = Ps.exec(e);
  if (!t) return [,];
  const [, n, r] = t;
  return [n, r];
}, Hl, PN = (e, t, n, r, o) => `rgba(${Math.round(t)}, ${Math.round(n)}, ${Math.round(r)}, ${o})`, k0 = (e) => {
  Hl || (Hl = zn ? (
    // match color names, ignore partial matches
    new RegExp(`(${Object.keys(zn).join("|")})(?!\\w)`, "g")
  ) : (
    // never match
    /^\b$/
  ));
  const t = e.output.map((o) => ut(o).replace(Ps, w0).replace(EN, Zg).replace(Hl, Zg)), n = t.map((o) => o.match(vi).map(Number)), r = n[0].map(
    (o, a) => n.map((i) => {
      if (!(a in i))
        throw Error('The arity of each "output" value must be equal');
      return i[a];
    })
  ).map(
    (o) => ga({ ...e, output: o })
  );
  return (o) => {
    var a;
    const i = !th.test(t[0]) && ((a = t.find((l) => th.test(l))) == null ? void 0 : a.replace(vi, ""));
    let s = 0;
    return t[0].replace(
      vi,
      () => `${r[s++](o)}${i || ""}`
    ).replace(ON, PN);
  };
}, yd = "react-spring: ", E0 = (e) => {
  const t = e;
  let n = !1;
  if (typeof t != "function")
    throw new TypeError(`${yd}once requires a function parameter`);
  return (...r) => {
    n || (t(...r), n = !0);
  };
}, AN = E0(console.warn);
function CN() {
  AN(
    `${yd}The "interpolate" function is deprecated in v9 (use "to" instead)`
  );
}
var $N = E0(console.warn);
function NN() {
  $N(
    `${yd}Directly calling start instead of using the api object is deprecated in v9 (use ".start" instead), this will be removed in later 0.X.0 versions`
  );
}
function As(e) {
  return X.str(e) && (e[0] == "#" || /\d/.test(e) || // Do not identify a CSS variable as an AnimatedString if its SSR
  !gd() && Ps.test(e) || e in (zn || {}));
}
var Dr = gd() ? Ee : Xi, IN = () => {
  const e = le(!1);
  return Dr(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
};
function O0() {
  const e = $e()[1], t = IN();
  return () => {
    t.current && e(Math.random());
  };
}
var S0 = (e) => Ee(e, TN), TN = [];
function MN(e) {
  const t = le(void 0);
  return Ee(() => {
    t.current = e;
  }), t.current;
}
var va = Symbol.for("Animated:node"), RN = (e) => !!e && e[va] === e, Ft = (e) => e && e[va], vd = (e, t) => oN(e, va, t), Cs = (e) => e && e[va] && e[va].getPayload(), P0 = class {
  constructor() {
    vd(this, this);
  }
  /** Get every `AnimatedValue` used by this node. */
  getPayload() {
    return this.payload || [];
  }
}, $s = class A0 extends P0 {
  constructor(t) {
    super(), this._value = t, this.done = !0, this.durationProgress = 0, X.num(this._value) && (this.lastPosition = this._value);
  }
  /** @internal */
  static create(t) {
    return new A0(t);
  }
  getPayload() {
    return [this];
  }
  getValue() {
    return this._value;
  }
  setValue(t, n) {
    return X.num(t) && (this.lastPosition = t, n && (t = Math.round(t / n) * n, this.done && (this.lastPosition = t))), this._value === t ? !1 : (this._value = t, !0);
  }
  reset() {
    const { done: t } = this;
    this.done = !1, X.num(this._value) && (this.elapsedTime = 0, this.durationProgress = 0, this.lastPosition = this._value, t && (this.lastVelocity = null), this.v0 = null);
  }
}, Ui = class C0 extends $s {
  constructor(t) {
    super(0), this._string = null, this._toString = ga({
      output: [t, t]
    });
  }
  /** @internal */
  static create(t) {
    return new C0(t);
  }
  getValue() {
    return this._string ?? (this._string = this._toString(this._value));
  }
  setValue(t) {
    if (X.str(t)) {
      if (t == this._string)
        return !1;
      this._string = t, this._value = 1;
    } else if (super.setValue(t))
      this._string = null;
    else
      return !1;
    return !0;
  }
  reset(t) {
    t && (this._toString = ga({
      output: [this.getValue(), t]
    })), this._value = 0, super.reset();
  }
}, Yi = { dependencies: null }, Ns = class extends P0 {
  constructor(t) {
    super(), this.source = t, this.setValue(t);
  }
  getValue(t) {
    const n = {};
    return Zt(this.source, (r, o) => {
      RN(r) ? n[o] = r.getValue(t) : St(r) ? n[o] = ut(r) : t || (n[o] = r);
    }), n;
  }
  /** Replace the raw object data */
  setValue(t) {
    this.source = t, this.payload = this._makePayload(t);
  }
  reset() {
    this.payload && ge(this.payload, (t) => t.reset());
  }
  /** Create a payload set. */
  _makePayload(t) {
    if (t) {
      const n = /* @__PURE__ */ new Set();
      return Zt(t, this._addToPayload, n), Array.from(n);
    }
  }
  /** Add to a payload set. */
  _addToPayload(t) {
    Yi.dependencies && St(t) && Yi.dependencies.add(t);
    const n = Cs(t);
    n && ge(n, (r) => this.add(r));
  }
}, jN = class $0 extends Ns {
  constructor(t) {
    super(t);
  }
  /** @internal */
  static create(t) {
    return new $0(t);
  }
  getValue() {
    return this.source.map((t) => t.getValue());
  }
  setValue(t) {
    const n = this.getPayload();
    return t.length == n.length ? n.map((r, o) => r.setValue(t[o])).some(Boolean) : (super.setValue(t.map(_N)), !0);
  }
};
function _N(e) {
  return (As(e) ? Ui : $s).create(e);
}
function Mu(e) {
  const t = Ft(e);
  return t ? t.constructor : X.arr(e) ? jN : As(e) ? Ui : $s;
}
var nh = (e, t) => {
  const n = (
    // Function components must use "forwardRef" to avoid being
    // re-rendered on every animation frame.
    !X.fun(e) || e.prototype && e.prototype.isReactComponent
  );
  return fb((r, o) => {
    const a = le(null), i = n && // eslint-disable-next-line react-hooks/rules-of-hooks
    Ge(
      (b) => {
        a.current = DN(o, b);
      },
      [o]
    ), [s, l] = LN(r, t), c = O0(), u = () => {
      const b = a.current;
      n && !b || (b ? t.applyAnimatedValues(b, s.getValue(!0)) : !1) === !1 && c();
    }, f = new FN(u, l), d = le(void 0);
    Dr(() => (d.current = f, ge(l, (b) => bo(b, f)), () => {
      d.current && (ge(
        d.current.deps,
        (b) => ya(b, d.current)
      ), ce.cancel(d.current.update));
    })), Ee(u, []), S0(() => () => {
      const b = d.current;
      ge(b.deps, (m) => ya(m, b));
    });
    const p = t.getComponentProps(s.getValue());
    return /* @__PURE__ */ S.createElement(e, { ...p, ref: i });
  });
}, FN = class {
  constructor(e, t) {
    this.update = e, this.deps = t;
  }
  eventObserved(e) {
    e.type == "change" && ce.write(this.update);
  }
};
function LN(e, t) {
  const n = /* @__PURE__ */ new Set();
  return Yi.dependencies = n, e.style && (e = {
    ...e,
    style: t.createAnimatedStyle(e.style)
  }), e = new Ns(e), Yi.dependencies = null, [e, n];
}
function DN(e, t) {
  return e && (X.fun(e) ? e(t) : e.current = t), t;
}
var rh = Symbol.for("AnimatedComponent"), zN = (e, {
  applyAnimatedValues: t = () => !1,
  createAnimatedStyle: n = (o) => new Ns(o),
  getComponentProps: r = (o) => o
} = {}) => {
  const o = {
    applyAnimatedValues: t,
    createAnimatedStyle: n,
    getComponentProps: r
  }, a = (i) => {
    const s = oh(i) || "Anonymous";
    return X.str(i) ? i = a[i] || (a[i] = nh(i, o)) : i = i[rh] || (i[rh] = nh(i, o)), i.displayName = `Animated(${s})`, i;
  };
  return Zt(e, (i, s) => {
    X.arr(e) && (s = oh(i)), a[s] = a(i);
  }), {
    animated: a
  };
}, oh = (e) => X.str(e) ? e : e && X.str(e.displayName) ? e.displayName : X.fun(e) && e.name || null;
function ft(e, ...t) {
  return X.fun(e) ? e(...t) : e;
}
var Jo = (e, t) => e === !0 || !!(t && e && (X.fun(e) ? e(t) : st(e).includes(t))), N0 = (e, t) => X.obj(e) ? t && e[t] : e, I0 = (e, t) => e.default === !0 ? e[t] : e.default ? e.default[t] : void 0, WN = (e) => e, xd = (e, t = WN) => {
  let n = VN;
  e.default && e.default !== !0 && (e = e.default, n = Object.keys(e));
  const r = {};
  for (const o of n) {
    const a = t(e[o], o);
    X.und(a) || (r[o] = a);
  }
  return r;
}, VN = [
  "config",
  "onProps",
  "onStart",
  "onChange",
  "onPause",
  "onResume",
  "onRest"
], HN = {
  config: 1,
  from: 1,
  to: 1,
  ref: 1,
  loop: 1,
  reset: 1,
  pause: 1,
  cancel: 1,
  reverse: 1,
  immediate: 1,
  default: 1,
  delay: 1,
  onProps: 1,
  onStart: 1,
  onChange: 1,
  onPause: 1,
  onResume: 1,
  onRest: 1,
  onResolve: 1,
  // Transition props
  items: 1,
  trail: 1,
  sort: 1,
  expires: 1,
  initial: 1,
  enter: 1,
  update: 1,
  leave: 1,
  children: 1,
  onDestroyed: 1,
  // Internal props
  keys: 1,
  callId: 1,
  parentId: 1
};
function UN(e) {
  const t = {};
  let n = 0;
  if (Zt(e, (r, o) => {
    HN[o] || (t[o] = r, n++);
  }), n)
    return t;
}
function wd(e) {
  const t = UN(e);
  if (t) {
    const n = { to: t };
    return Zt(e, (r, o) => o in t || (n[o] = r)), n;
  }
  return { ...e };
}
function xa(e) {
  return e = ut(e), X.arr(e) ? e.map(xa) : As(e) ? Mt.createStringInterpolator({
    range: [0, 1],
    output: [e, e]
  })(1) : e;
}
function YN(e) {
  for (const t in e) return !0;
  return !1;
}
function Ru(e) {
  return X.fun(e) || X.arr(e) && X.obj(e[0]);
}
function ah(e, t) {
  var n;
  (n = e.ref) == null || n.delete(e), t == null || t.delete(e);
}
function BN(e, t) {
  var n;
  t && e.ref !== t && ((n = e.ref) == null || n.delete(e), t.add(e), e.ref = t);
}
var GN = {
  default: { tension: 170, friction: 26 }
}, ju = {
  ...GN.default,
  mass: 1,
  damping: 1,
  easing: xN.linear,
  clamp: !1
}, qN = class {
  constructor() {
    this.velocity = 0, Object.assign(this, ju);
  }
};
function KN(e, t, n) {
  n && (n = { ...n }, ih(n, t), t = { ...n, ...t }), ih(e, t), Object.assign(e, t);
  for (const i in ju)
    e[i] == null && (e[i] = ju[i]);
  let { frequency: r, damping: o } = e;
  const { mass: a } = e;
  return X.und(r) || (r < 0.01 && (r = 0.01), o < 0 && (o = 0), e.tension = Math.pow(2 * Math.PI / r, 2) * a, e.friction = 4 * Math.PI * o * a / r), e;
}
function ih(e, t) {
  if (!X.und(t.decay))
    e.duration = void 0;
  else {
    const n = !X.und(t.tension) || !X.und(t.friction);
    (n || !X.und(t.frequency) || !X.und(t.damping) || !X.und(t.mass)) && (e.duration = void 0, e.decay = void 0), n && (e.frequency = void 0);
  }
}
var sh = [], XN = class {
  constructor() {
    this.changed = !1, this.values = sh, this.toValues = null, this.fromValues = sh, this.config = new qN(), this.immediate = !1;
  }
};
function T0(e, { key: t, props: n, defaultProps: r, state: o, actions: a }) {
  return new Promise((i, s) => {
    let l, c, u = Jo(n.cancel ?? (r == null ? void 0 : r.cancel), t);
    if (u)
      p();
    else {
      X.und(n.pause) || (o.paused = Jo(n.pause, t));
      let b = r == null ? void 0 : r.pause;
      b !== !0 && (b = o.paused || Jo(b, t)), l = ft(n.delay || 0, t), b ? (o.resumeQueue.add(d), a.pause()) : (a.resume(), d());
    }
    function f() {
      o.resumeQueue.add(d), o.timeouts.delete(c), c.cancel(), l = c.time - ce.now();
    }
    function d() {
      l > 0 && !Mt.skipAnimation ? (o.delayed = !0, c = ce.setTimeout(p, l), o.pauseQueue.add(f), o.timeouts.add(c)) : p();
    }
    function p() {
      o.delayed && (o.delayed = !1), o.pauseQueue.delete(f), o.timeouts.delete(c), e <= (o.cancelId || 0) && (u = !0);
      try {
        a.start({ ...n, callId: e, cancel: u }, i);
      } catch (b) {
        s(b);
      }
    }
  });
}
var kd = (e, t) => t.length == 1 ? t[0] : t.some((n) => n.cancelled) ? Xr(e.get()) : t.every((n) => n.noop) ? M0(e.get()) : $t(
  e.get(),
  t.every((n) => n.finished)
), M0 = (e) => ({
  value: e,
  noop: !0,
  finished: !0,
  cancelled: !1
}), $t = (e, t, n = !1) => ({
  value: e,
  finished: t,
  cancelled: n
}), Xr = (e) => ({
  value: e,
  cancelled: !0,
  finished: !1
});
function R0(e, t, n, r) {
  const { callId: o, parentId: a, onRest: i } = t, { asyncTo: s, promise: l } = n;
  return !a && e === s && !t.reset ? l : n.promise = (async () => {
    n.asyncId = o, n.asyncTo = e;
    const c = xd(
      t,
      (g, v) => (
        // The `onRest` prop is only called when the `runAsync` promise is resolved.
        v === "onRest" ? void 0 : g
      )
    );
    let u, f;
    const d = new Promise(
      (g, v) => (u = g, f = v)
    ), p = (g) => {
      const v = (
        // The `cancel` prop or `stop` method was used.
        o <= (n.cancelId || 0) && Xr(r) || // The async `to` prop was replaced.
        o !== n.asyncId && $t(r, !1)
      );
      if (v)
        throw g.result = v, f(g), g;
    }, b = (g, v) => {
      const k = new lh(), x = new ch();
      return (async () => {
        if (Mt.skipAnimation)
          throw wa(n), x.result = $t(r, !1), f(x), x;
        p(k);
        const O = X.obj(g) ? { ...g } : { ...v, to: g };
        O.parentId = o, Zt(c, (L, _) => {
          X.und(O[_]) && (O[_] = L);
        });
        const h = await r.start(O);
        return p(k), n.paused && await new Promise((L) => {
          n.resumeQueue.add(L);
        }), h;
      })();
    };
    let m;
    if (Mt.skipAnimation)
      return wa(n), $t(r, !1);
    try {
      let g;
      X.arr(e) ? g = (async (v) => {
        for (const k of v)
          await b(k);
      })(e) : g = Promise.resolve(e(b, r.stop.bind(r))), await Promise.all([g.then(u), d]), m = $t(r.get(), !0, !1);
    } catch (g) {
      if (g instanceof lh)
        m = g.result;
      else if (g instanceof ch)
        m = g.result;
      else
        throw g;
    } finally {
      o == n.asyncId && (n.asyncId = a, n.asyncTo = a ? s : void 0, n.promise = a ? l : void 0);
    }
    return X.fun(i) && ce.batchedUpdates(() => {
      i(m, r, r.item);
    }), m;
  })();
}
function wa(e, t) {
  Xo(e.timeouts, (n) => n.cancel()), e.pauseQueue.clear(), e.resumeQueue.clear(), e.asyncId = e.asyncTo = e.promise = void 0, t && (e.cancelId = t);
}
var lh = class extends Error {
  constructor() {
    super(
      "An async animation has been interrupted. You see this error because you forgot to use `await` or `.catch(...)` on its returned promise."
    );
  }
}, ch = class extends Error {
  constructor() {
    super("SkipAnimationSignal");
  }
}, _u = (e) => e instanceof Ed, QN = 1, Ed = class extends v0 {
  constructor() {
    super(...arguments), this.id = QN++, this._priority = 0;
  }
  get priority() {
    return this._priority;
  }
  set priority(t) {
    this._priority != t && (this._priority = t, this._onPriorityChange(t));
  }
  /** Get the current value */
  get() {
    const t = Ft(this);
    return t && t.getValue();
  }
  /** Create a spring that maps our value to another value */
  to(...t) {
    return Mt.to(this, t);
  }
  /** @deprecated Use the `to` method instead. */
  interpolate(...t) {
    return CN(), Mt.to(this, t);
  }
  toJSON() {
    return this.get();
  }
  observerAdded(t) {
    t == 1 && this._attach();
  }
  observerRemoved(t) {
    t == 0 && this._detach();
  }
  /** Called when the first child is added. */
  _attach() {
  }
  /** Called when the last child is removed. */
  _detach() {
  }
  /** Tell our children about our new value */
  _onChange(t, n = !1) {
    ba(this, {
      type: "change",
      parent: this,
      value: t,
      idle: n
    });
  }
  /** Tell our children about our new priority */
  _onPriorityChange(t) {
    this.idle || Os.sort(this), ba(this, {
      type: "priority",
      parent: this,
      priority: t
    });
  }
}, wr = Symbol.for("SpringPhase"), j0 = 1, _0 = 2, F0 = 4, Ul = (e) => (e[wr] & j0) > 0, Cn = (e) => (e[wr] & _0) > 0, Po = (e) => (e[wr] & F0) > 0, uh = (e, t) => t ? e[wr] |= _0 | j0 : e[wr] &= -3, fh = (e, t) => t ? e[wr] |= F0 : e[wr] &= -5, JN = class extends Ed {
  constructor(e, t) {
    if (super(), this.animation = new XN(), this.defaultProps = {}, this._state = {
      paused: !1,
      delayed: !1,
      pauseQueue: /* @__PURE__ */ new Set(),
      resumeQueue: /* @__PURE__ */ new Set(),
      timeouts: /* @__PURE__ */ new Set()
    }, this._pendingCalls = /* @__PURE__ */ new Set(), this._lastCallId = 0, this._lastToId = 0, this._memoizedDuration = 0, !X.und(e) || !X.und(t)) {
      const n = X.obj(e) ? { ...e } : { ...t, from: e };
      X.und(n.default) && (n.default = !0), this.start(n);
    }
  }
  /** Equals true when not advancing on each frame. */
  get idle() {
    return !(Cn(this) || this._state.asyncTo) || Po(this);
  }
  get goal() {
    return ut(this.animation.to);
  }
  get velocity() {
    const e = Ft(this);
    return e instanceof $s ? e.lastVelocity || 0 : e.getPayload().map((t) => t.lastVelocity || 0);
  }
  /**
   * When true, this value has been animated at least once.
   */
  get hasAnimated() {
    return Ul(this);
  }
  /**
   * When true, this value has an unfinished animation,
   * which is either active or paused.
   */
  get isAnimating() {
    return Cn(this);
  }
  /**
   * When true, all current and future animations are paused.
   */
  get isPaused() {
    return Po(this);
  }
  /**
   *
   *
   */
  get isDelayed() {
    return this._state.delayed;
  }
  /** Advance the current animation by a number of milliseconds */
  advance(e) {
    let t = !0, n = !1;
    const r = this.animation;
    let { toValues: o } = r;
    const { config: a } = r, i = Cs(r.to);
    !i && St(r.to) && (o = st(ut(r.to))), r.values.forEach((c, u) => {
      if (c.done) return;
      const f = (
        // Animated strings always go from 0 to 1.
        c.constructor == Ui ? 1 : i ? i[u].lastPosition : o[u]
      );
      let d = r.immediate, p = f;
      if (!d) {
        if (p = c.lastPosition, a.tension <= 0) {
          c.done = !0;
          return;
        }
        let b = c.elapsedTime += e;
        const m = r.fromValues[u], g = c.v0 != null ? c.v0 : c.v0 = X.arr(a.velocity) ? a.velocity[u] : a.velocity;
        let v;
        const k = a.precision || (m == f ? 5e-3 : Math.min(1, Math.abs(f - m) * 1e-3));
        if (X.und(a.duration))
          if (a.decay) {
            const x = a.decay === !0 ? 0.998 : a.decay, O = Math.exp(-(1 - x) * b);
            p = m + g / (1 - x) * (1 - O), d = Math.abs(c.lastPosition - p) <= k, v = g * O;
          } else {
            v = c.lastVelocity == null ? g : c.lastVelocity;
            const x = a.restVelocity || k / 10, O = a.clamp ? 0 : a.bounce, h = !X.und(O), L = m == f ? c.v0 > 0 : m < f;
            let _, H = !1;
            const J = 1, Z = Math.ceil(e / J);
            for (let U = 0; U < Z && (_ = Math.abs(v) > x, !(!_ && (d = Math.abs(f - p) <= k, d))); ++U) {
              h && (H = p == f || p > f == L, H && (v = -v * O, p = f));
              const T = -a.tension * 1e-6 * (p - f), te = -a.friction * 1e-3 * v, W = (T + te) / a.mass;
              v = v + W * J, p = p + v * J;
            }
          }
        else {
          let x = 1;
          a.duration > 0 && (this._memoizedDuration !== a.duration && (this._memoizedDuration = a.duration, c.durationProgress > 0 && (c.elapsedTime = a.duration * c.durationProgress, b = c.elapsedTime += e)), x = (a.progress || 0) + b / this._memoizedDuration, x = x > 1 ? 1 : x < 0 ? 0 : x, c.durationProgress = x), p = m + a.easing(x) * (f - m), v = (p - c.lastPosition) / e, d = x == 1;
        }
        c.lastVelocity = v, Number.isNaN(p) && (console.warn("Got NaN while animating:", this), d = !0);
      }
      i && !i[u].done && (d = !1), d ? c.done = !0 : t = !1, c.setValue(p, a.round) && (n = !0);
    });
    const s = Ft(this), l = s.getValue();
    if (t) {
      const c = ut(r.to);
      (l !== c || n) && !a.decay ? (s.setValue(c), this._onChange(c)) : n && a.decay && this._onChange(l), this._stop();
    } else n && this._onChange(l);
  }
  /** Set the current value, while stopping the current animation */
  set(e) {
    return ce.batchedUpdates(() => {
      this._stop(), this._focus(e), this._set(e);
    }), this;
  }
  /**
   * Freeze the active animation in time, as well as any updates merged
   * before `resume` is called.
   */
  pause() {
    this._update({ pause: !0 });
  }
  /** Resume the animation if paused. */
  resume() {
    this._update({ pause: !1 });
  }
  /** Skip to the end of the current animation. */
  finish() {
    if (Cn(this)) {
      const { to: e, config: t } = this.animation;
      ce.batchedUpdates(() => {
        this._onStart(), t.decay || this._set(e, !1), this._stop();
      });
    }
    return this;
  }
  /** Push props into the pending queue. */
  update(e) {
    return (this.queue || (this.queue = [])).push(e), this;
  }
  start(e, t) {
    let n;
    return X.und(e) ? (n = this.queue || [], this.queue = []) : n = [X.obj(e) ? e : { ...t, to: e }], Promise.all(
      n.map((r) => this._update(r))
    ).then((r) => kd(this, r));
  }
  /**
   * Stop the current animation, and cancel any delayed updates.
   *
   * Pass `true` to call `onRest` with `cancelled: true`.
   */
  stop(e) {
    const { to: t } = this.animation;
    return this._focus(this.get()), wa(this._state, e && this._lastCallId), ce.batchedUpdates(() => this._stop(t, e)), this;
  }
  /** Restart the animation. */
  reset() {
    this._update({ reset: !0 });
  }
  /** @internal */
  eventObserved(e) {
    e.type == "change" ? this._start() : e.type == "priority" && (this.priority = e.priority + 1);
  }
  /**
   * Parse the `to` and `from` range from the given `props` object.
   *
   * This also ensures the initial value is available to animated components
   * during the render phase.
   */
  _prepareNode(e) {
    const t = this.key || "";
    let { to: n, from: r } = e;
    n = X.obj(n) ? n[t] : n, (n == null || Ru(n)) && (n = void 0), r = X.obj(r) ? r[t] : r, r == null && (r = void 0);
    const o = { to: n, from: r };
    return Ul(this) || (e.reverse && ([n, r] = [r, n]), r = ut(r), X.und(r) ? Ft(this) || this._set(n) : this._set(r)), o;
  }
  /** Every update is processed by this method before merging. */
  _update({ ...e }, t) {
    const { key: n, defaultProps: r } = this;
    e.default && Object.assign(
      r,
      xd(
        e,
        (i, s) => /^on/.test(s) ? N0(i, n) : i
      )
    ), ph(this, e, "onProps"), Co(this, "onProps", e, this);
    const o = this._prepareNode(e);
    if (Object.isFrozen(this))
      throw Error(
        "Cannot animate a `SpringValue` object that is frozen. Did you forget to pass your component to `animated(...)` before animating its props?"
      );
    const a = this._state;
    return T0(++this._lastCallId, {
      key: n,
      props: e,
      defaultProps: r,
      state: a,
      actions: {
        pause: () => {
          Po(this) || (fh(this, !0), Do(a.pauseQueue), Co(
            this,
            "onPause",
            $t(this, Ao(this, this.animation.to)),
            this
          ));
        },
        resume: () => {
          Po(this) && (fh(this, !1), Cn(this) && this._resume(), Do(a.resumeQueue), Co(
            this,
            "onResume",
            $t(this, Ao(this, this.animation.to)),
            this
          ));
        },
        start: this._merge.bind(this, o)
      }
    }).then((i) => {
      if (e.loop && i.finished && !(t && i.noop)) {
        const s = L0(e);
        if (s)
          return this._update(s, !0);
      }
      return i;
    });
  }
  /** Merge props into the current animation */
  _merge(e, t, n) {
    if (t.cancel)
      return this.stop(!0), n(Xr(this));
    const r = !X.und(e.to), o = !X.und(e.from);
    if (r || o)
      if (t.callId > this._lastToId)
        this._lastToId = t.callId;
      else
        return n(Xr(this));
    const { key: a, defaultProps: i, animation: s } = this, { to: l, from: c } = s;
    let { to: u = l, from: f = c } = e;
    o && !r && (!t.default || X.und(u)) && (u = f), t.reverse && ([u, f] = [f, u]);
    const d = !ln(f, c);
    d && (s.from = f), f = ut(f);
    const p = !ln(u, l);
    p && this._focus(u);
    const b = Ru(t.to), { config: m } = s, { decay: g, velocity: v } = m;
    (r || o) && (m.velocity = 0), t.config && !b && KN(
      m,
      ft(t.config, a),
      // Avoid calling the same "config" prop twice.
      t.config !== i.config ? ft(i.config, a) : void 0
    );
    let k = Ft(this);
    if (!k || X.und(u))
      return n($t(this, !0));
    const x = (
      // When `reset` is undefined, the `from` prop implies `reset: true`,
      // except for declarative updates. When `reset` is defined, there
      // must exist a value to animate from.
      X.und(t.reset) ? o && !t.default : !X.und(f) && Jo(t.reset, a)
    ), O = x ? f : this.get(), h = xa(u), L = X.num(h) || X.arr(h) || As(h), _ = !b && (!L || Jo(i.immediate || t.immediate, a));
    if (p) {
      const U = Mu(u);
      if (U !== k.constructor)
        if (_)
          k = this._set(h);
        else
          throw Error(
            `Cannot animate between ${k.constructor.name} and ${U.name}, as the "to" prop suggests`
          );
    }
    const H = k.constructor;
    let J = St(u), Z = !1;
    if (!J) {
      const U = x || !Ul(this) && d;
      (p || U) && (Z = ln(xa(O), h), J = !Z), (!ln(s.immediate, _) && !_ || !ln(m.decay, g) || !ln(m.velocity, v)) && (J = !0);
    }
    if (Z && Cn(this) && (s.changed && !x ? J = !0 : J || this._stop(l)), !b && ((J || St(l)) && (s.values = k.getPayload(), s.toValues = St(u) ? null : H == Ui ? [1] : st(h)), s.immediate != _ && (s.immediate = _, !_ && !x && this._set(l)), J)) {
      const { onRest: U } = s;
      ge(ZN, (te) => ph(this, t, te));
      const T = $t(this, Ao(this, l));
      Do(this._pendingCalls, T), this._pendingCalls.add(n), s.changed && ce.batchedUpdates(() => {
        var te;
        s.changed = !x, U == null || U(T, this), x ? ft(i.onRest, T) : (te = s.onStart) == null || te.call(s, T, this);
      });
    }
    x && this._set(O), b ? n(R0(t.to, t, this._state, this)) : J ? this._start() : Cn(this) && !p ? this._pendingCalls.add(n) : n(M0(O));
  }
  /** Update the `animation.to` value, which might be a `FluidValue` */
  _focus(e) {
    const t = this.animation;
    e !== t.to && (eh(this) && this._detach(), t.to = e, eh(this) && this._attach());
  }
  _attach() {
    let e = 0;
    const { to: t } = this.animation;
    St(t) && (bo(t, this), _u(t) && (e = t.priority + 1)), this.priority = e;
  }
  _detach() {
    const { to: e } = this.animation;
    St(e) && ya(e, this);
  }
  /**
   * Update the current value from outside the frameloop,
   * and return the `Animated` node.
   */
  _set(e, t = !0) {
    const n = ut(e);
    if (!X.und(n)) {
      const r = Ft(this);
      if (!r || !ln(n, r.getValue())) {
        const o = Mu(n);
        !r || r.constructor != o ? vd(this, o.create(n)) : r.setValue(n), r && ce.batchedUpdates(() => {
          this._onChange(n, t);
        });
      }
    }
    return Ft(this);
  }
  _onStart() {
    const e = this.animation;
    e.changed || (e.changed = !0, Co(
      this,
      "onStart",
      $t(this, Ao(this, e.to)),
      this
    ));
  }
  _onChange(e, t) {
    t || (this._onStart(), ft(this.animation.onChange, e, this)), ft(this.defaultProps.onChange, e, this), super._onChange(e, t);
  }
  // This method resets the animation state (even if already animating) to
  // ensure the latest from/to range is used, and it also ensures this spring
  // is added to the frameloop.
  _start() {
    const e = this.animation;
    Ft(this).reset(ut(e.to)), e.immediate || (e.fromValues = e.values.map((t) => t.lastPosition)), Cn(this) || (uh(this, !0), Po(this) || this._resume());
  }
  _resume() {
    Mt.skipAnimation ? this.finish() : Os.start(this);
  }
  /**
   * Exit the frameloop and notify `onRest` listeners.
   *
   * Always wrap `_stop` calls with `batchedUpdates`.
   */
  _stop(e, t) {
    if (Cn(this)) {
      uh(this, !1);
      const n = this.animation;
      ge(n.values, (o) => {
        o.done = !0;
      }), n.toValues && (n.onChange = n.onPause = n.onResume = void 0), ba(this, {
        type: "idle",
        parent: this
      });
      const r = t ? Xr(this.get()) : $t(this.get(), Ao(this, e ?? n.to));
      Do(this._pendingCalls, r), n.changed && (n.changed = !1, Co(this, "onRest", r, this));
    }
  }
};
function Ao(e, t) {
  const n = xa(t), r = xa(e.get());
  return ln(r, n);
}
function L0(e, t = e.loop, n = e.to) {
  const r = ft(t);
  if (r) {
    const o = r !== !0 && wd(r), a = (o || e).reverse, i = !o || o.reset;
    return Bi({
      ...e,
      loop: t,
      // Avoid updating default props when looping.
      default: !1,
      // Never loop the `pause` prop.
      pause: void 0,
      // For the "reverse" prop to loop as expected, the "to" prop
      // must be undefined. The "reverse" prop is ignored when the
      // "to" prop is an array or function.
      to: !a || Ru(n) ? n : void 0,
      // Ignore the "from" prop except on reset.
      from: i ? e.from : void 0,
      reset: i,
      // The "loop" prop can return a "useSpring" props object to
      // override any of the original props.
      ...o
    });
  }
}
function Bi(e) {
  const { to: t, from: n } = e = wd(e), r = /* @__PURE__ */ new Set();
  return X.obj(t) && dh(t, r), X.obj(n) && dh(n, r), e.keys = r.size ? Array.from(r) : null, e;
}
function dh(e, t) {
  Zt(e, (n, r) => n != null && t.add(r));
}
var ZN = [
  "onStart",
  "onRest",
  "onChange",
  "onPause",
  "onResume"
];
function ph(e, t, n) {
  e.animation[n] = t[n] !== I0(t, n) ? N0(t[n], e.key) : void 0;
}
function Co(e, t, ...n) {
  var r, o, a, i;
  (o = (r = e.animation)[t]) == null || o.call(r, ...n), (i = (a = e.defaultProps)[t]) == null || i.call(a, ...n);
}
var eI = ["onStart", "onChange", "onRest"], tI = 1, nI = class {
  constructor(e, t) {
    this.id = tI++, this.springs = {}, this.queue = [], this._lastAsyncId = 0, this._active = /* @__PURE__ */ new Set(), this._changed = /* @__PURE__ */ new Set(), this._started = !1, this._state = {
      paused: !1,
      pauseQueue: /* @__PURE__ */ new Set(),
      resumeQueue: /* @__PURE__ */ new Set(),
      timeouts: /* @__PURE__ */ new Set()
    }, this._events = {
      onStart: /* @__PURE__ */ new Map(),
      onChange: /* @__PURE__ */ new Map(),
      onRest: /* @__PURE__ */ new Map()
    }, this._onFrame = this._onFrame.bind(this), t && (this._flush = t), e && this.start({ default: !0, ...e });
  }
  /**
   * Equals `true` when no spring values are in the frameloop, and
   * no async animation is currently active.
   */
  get idle() {
    return !this._state.asyncTo && Object.values(this.springs).every((e) => e.idle && !e.isDelayed && !e.isPaused);
  }
  get item() {
    return this._item;
  }
  set item(e) {
    this._item = e;
  }
  /** Get the current values of our springs */
  get() {
    const e = {};
    return this.each((t, n) => e[n] = t.get()), e;
  }
  /** Set the current values without animating. */
  set(e) {
    for (const t in e) {
      const n = e[t];
      X.und(n) || this.springs[t].set(n);
    }
  }
  /** Push an update onto the queue of each value. */
  update(e) {
    return e && this.queue.push(Bi(e)), this;
  }
  /**
   * Start the queued animations for every spring, and resolve the returned
   * promise once all queued animations have finished or been cancelled.
   *
   * When you pass a queue (instead of nothing), that queue is used instead of
   * the queued animations added with the `update` method, which are left alone.
   */
  start(e) {
    let { queue: t } = this;
    return e ? t = st(e).map(Bi) : this.queue = [], this._flush ? this._flush(this, t) : (V0(this, t), rI(this, t));
  }
  /** @internal */
  stop(e, t) {
    if (e !== !!e && (t = e), t) {
      const n = this.springs;
      ge(st(t), (r) => n[r].stop(!!e));
    } else
      wa(this._state, this._lastAsyncId), this.each((n) => n.stop(!!e));
    return this;
  }
  /** Freeze the active animation in time */
  pause(e) {
    if (X.und(e))
      this.start({ pause: !0 });
    else {
      const t = this.springs;
      ge(st(e), (n) => t[n].pause());
    }
    return this;
  }
  /** Resume the animation if paused. */
  resume(e) {
    if (X.und(e))
      this.start({ pause: !1 });
    else {
      const t = this.springs;
      ge(st(e), (n) => t[n].resume());
    }
    return this;
  }
  /** Call a function once per spring value */
  each(e) {
    Zt(this.springs, e);
  }
  /** @internal Called at the end of every animation frame */
  _onFrame() {
    const { onStart: e, onChange: t, onRest: n } = this._events, r = this._active.size > 0, o = this._changed.size > 0;
    (r && !this._started || o && !this._started) && (this._started = !0, Xo(e, ([s, l]) => {
      l.value = this.get(), s(l, this, this._item);
    }));
    const a = !r && this._started, i = o || a && n.size ? this.get() : null;
    o && t.size && Xo(t, ([s, l]) => {
      l.value = i, s(l, this, this._item);
    }), a && (this._started = !1, Xo(n, ([s, l]) => {
      l.value = i, s(l, this, this._item);
    }));
  }
  /** @internal */
  eventObserved(e) {
    if (e.type == "change")
      this._changed.add(e.parent), e.idle || this._active.add(e.parent);
    else if (e.type == "idle")
      this._active.delete(e.parent);
    else return;
    ce.onFrame(this._onFrame);
  }
};
function rI(e, t) {
  return Promise.all(t.map((n) => D0(e, n))).then(
    (n) => kd(e, n)
  );
}
async function D0(e, t, n) {
  const { keys: r, to: o, from: a, loop: i, onRest: s, onResolve: l } = t, c = X.obj(t.default) && t.default;
  i && (t.loop = !1), o === !1 && (t.to = null), a === !1 && (t.from = null);
  const u = X.arr(o) || X.fun(o) ? o : void 0;
  u ? (t.to = void 0, t.onRest = void 0, c && (c.onRest = void 0)) : ge(eI, (m) => {
    const g = t[m];
    if (X.fun(g)) {
      const v = e._events[m];
      t[m] = ({ finished: k, cancelled: x }) => {
        const O = v.get(g);
        O ? (k || (O.finished = !1), x && (O.cancelled = !0)) : v.set(g, {
          value: null,
          finished: k || !1,
          cancelled: x || !1
        });
      }, c && (c[m] = t[m]);
    }
  });
  const f = e._state;
  t.pause === !f.paused ? (f.paused = t.pause, Do(t.pause ? f.pauseQueue : f.resumeQueue)) : f.paused && (t.pause = !0);
  const d = (r || Object.keys(e.springs)).map(
    (m) => e.springs[m].start(t)
  ), p = t.cancel === !0 || I0(t, "cancel") === !0;
  (u || p && f.asyncId) && d.push(
    T0(++e._lastAsyncId, {
      props: t,
      state: f,
      actions: {
        pause: Iu,
        resume: Iu,
        start(m, g) {
          p ? (wa(f, e._lastAsyncId), g(Xr(e))) : (m.onRest = s, g(
            R0(
              u,
              m,
              f,
              e
            )
          ));
        }
      }
    })
  ), f.paused && await new Promise((m) => {
    f.resumeQueue.add(m);
  });
  const b = kd(e, await Promise.all(d));
  if (i && b.finished && !(n && b.noop)) {
    const m = L0(t, i, o);
    if (m)
      return V0(e, [m]), D0(e, m, !0);
  }
  return l && ce.batchedUpdates(() => l(b, e, e.item)), b;
}
function oI(e, t) {
  const n = { ...e.springs };
  return t && ge(st(t), (r) => {
    X.und(r.keys) && (r = Bi(r)), X.obj(r.to) || (r = { ...r, to: void 0 }), W0(n, r, (o) => z0(o));
  }), aI(e, n), n;
}
function aI(e, t) {
  Zt(t, (n, r) => {
    e.springs[r] || (e.springs[r] = n, bo(n, e));
  });
}
function z0(e, t) {
  const n = new JN();
  return n.key = e, t && bo(n, t), n;
}
function W0(e, t, n) {
  t.keys && ge(t.keys, (r) => {
    (e[r] || (e[r] = n(r)))._prepareNode(t);
  });
}
function V0(e, t) {
  ge(t, (n) => {
    W0(e.springs, n, (r) => z0(r, e));
  });
}
var iI = S.createContext({
  pause: !1,
  immediate: !1
}), sI = () => {
  const e = [], t = function(r) {
    NN();
    const o = [];
    return ge(e, (a, i) => {
      if (X.und(r))
        o.push(a.start());
      else {
        const s = n(r, a, i);
        s && o.push(a.start(s));
      }
    }), o;
  };
  t.current = e, t.add = function(r) {
    e.includes(r) || e.push(r);
  }, t.delete = function(r) {
    const o = e.indexOf(r);
    ~o && e.splice(o, 1);
  }, t.pause = function() {
    return ge(e, (r) => r.pause(...arguments)), this;
  }, t.resume = function() {
    return ge(e, (r) => r.resume(...arguments)), this;
  }, t.set = function(r) {
    ge(e, (o, a) => {
      const i = X.fun(r) ? r(a, o) : r;
      i && o.set(i);
    });
  }, t.start = function(r) {
    const o = [];
    return ge(e, (a, i) => {
      if (X.und(r))
        o.push(a.start());
      else {
        const s = this._getProps(r, a, i);
        s && o.push(a.start(s));
      }
    }), o;
  }, t.stop = function() {
    return ge(e, (r) => r.stop(...arguments)), this;
  }, t.update = function(r) {
    return ge(e, (o, a) => o.update(this._getProps(r, o, a))), this;
  };
  const n = function(r, o, a) {
    return X.fun(r) ? r(a, o) : r;
  };
  return t._getProps = n, t;
};
function mh(e, t, n) {
  const r = X.fun(t) && t, {
    reset: o,
    sort: a,
    trail: i = 0,
    expires: s = !0,
    exitBeforeEnter: l = !1,
    onDestroyed: c,
    ref: u,
    config: f
  } = r ? r() : t, d = Ye(
    () => r || arguments.length == 3 ? sI() : void 0,
    []
  ), p = st(e), b = [], m = le(null), g = o ? null : m.current;
  Dr(() => {
    m.current = b;
  }), S0(() => (ge(b, (W) => {
    d == null || d.add(W.ctrl), W.ctrl.ref = d;
  }), () => {
    ge(m.current, (W) => {
      W.expired && clearTimeout(W.expirationId), ah(W.ctrl, d), W.ctrl.stop(!0);
    });
  }));
  const v = cI(p, r ? r() : t, g), k = o && m.current || [];
  Dr(
    () => ge(k, ({ ctrl: W, item: j, key: D }) => {
      ah(W, d), ft(c, j, D);
    })
  );
  const x = [];
  if (g && ge(g, (W, j) => {
    W.expired ? (clearTimeout(W.expirationId), k.push(W)) : (j = x[j] = v.indexOf(W.key), ~j && (b[j] = W));
  }), ge(p, (W, j) => {
    b[j] || (b[j] = {
      key: v[j],
      item: W,
      phase: "mount",
      ctrl: new nI()
    }, b[j].ctrl.item = W);
  }), x.length) {
    let W = -1;
    const { leave: j } = r ? r() : t;
    ge(x, (D, Q) => {
      const V = g[Q];
      ~D ? (W = b.indexOf(V), b[W] = { ...V, item: p[D] }) : j && b.splice(++W, 0, V);
    });
  }
  X.fun(a) && b.sort((W, j) => a(W.item, j.item));
  let O = -i;
  const h = O0(), L = xd(t), _ = /* @__PURE__ */ new Map(), H = le(/* @__PURE__ */ new Map()), J = le(!1);
  ge(b, (W, j) => {
    const D = W.key, Q = W.phase, V = r ? r() : t;
    let z, y;
    const w = ft(V.delay || 0, D);
    if (Q == "mount")
      z = V.enter, y = "enter";
    else {
      const I = v.indexOf(D) < 0;
      if (Q != "leave")
        if (I)
          z = V.leave, y = "leave";
        else if (z = V.update)
          y = "update";
        else return;
      else if (!I)
        z = V.enter, y = "enter";
      else return;
    }
    if (z = ft(z, W.item, j), z = X.obj(z) ? wd(z) : { to: z }, !z.config) {
      const I = f || L.config;
      z.config = ft(I, W.item, j, y);
    }
    O += i;
    const C = {
      ...L,
      // we need to add our props.delay value you here.
      delay: w + O,
      ref: u,
      immediate: V.immediate,
      // This prevents implied resets.
      reset: !1,
      // Merge any phase-specific props.
      ...z
    };
    if (y == "enter" && X.und(C.from)) {
      const I = r ? r() : t, N = X.und(I.initial) || g ? I.from : I.initial;
      C.from = ft(N, W.item, j);
    }
    const { onResolve: A } = C;
    C.onResolve = (I) => {
      ft(A, I);
      const N = m.current, $ = N.find((R) => R.key === D);
      if ($ && !(I.cancelled && $.phase != "update") && $.ctrl.idle) {
        const R = N.every((M) => M.ctrl.idle);
        if ($.phase == "leave") {
          const M = ft(s, $.item);
          if (M !== !1) {
            const F = M === !0 ? 0 : M;
            if ($.expired = !0, !R && F > 0) {
              F <= 2147483647 && ($.expirationId = setTimeout(h, F));
              return;
            }
          }
        }
        R && N.some((M) => M.expired) && (H.current.delete($), l && (J.current = !0), h());
      }
    };
    const P = oI(W.ctrl, C);
    y === "leave" && l ? H.current.set(W, { phase: y, springs: P, payload: C }) : _.set(W, { phase: y, springs: P, payload: C });
  });
  const Z = Ke(iI), U = MN(Z), T = Z !== U && YN(Z);
  Dr(() => {
    T && ge(b, (W) => {
      W.ctrl.start({ default: Z });
    });
  }, [Z]), ge(_, (W, j) => {
    if (H.current.size) {
      const D = b.findIndex((Q) => Q.key === j.key);
      b.splice(D, 1);
    }
  }), Dr(
    () => {
      ge(
        H.current.size ? H.current : _,
        ({ phase: W, payload: j }, D) => {
          const { ctrl: Q } = D;
          D.phase = W, d == null || d.add(Q), T && W == "enter" && Q.start({ default: Z }), j && (BN(Q, j.ref), (Q.ref || d) && !J.current ? Q.update(j) : (Q.start(j), J.current && (J.current = !1)));
        }
      );
    },
    o ? void 0 : n
  );
  const te = (W) => /* @__PURE__ */ S.createElement(S.Fragment, null, b.map((j, D) => {
    const { springs: Q } = _.get(j) || j.ctrl, V = W({ ...Q }, j.item, j, D);
    return V && V.type ? /* @__PURE__ */ S.createElement(
      V.type,
      {
        ...V.props,
        key: X.str(j.key) || X.num(j.key) ? j.key : j.ctrl.id,
        ref: V.ref
      }
    ) : V;
  }));
  return d ? [te, d] : te;
}
var lI = 1;
function cI(e, { key: t, keys: n = t }, r) {
  if (n === null) {
    const o = /* @__PURE__ */ new Set();
    return e.map((a) => {
      const i = r && r.find(
        (s) => s.item === a && s.phase !== "leave" && !o.has(s)
      );
      return i ? (o.add(i), i.key) : lI++;
    });
  }
  return X.und(n) ? e : X.fun(n) ? e.map(n) : st(n);
}
var uI = class extends Ed {
  constructor(e, t) {
    super(), this.source = e, this.idle = !0, this._active = /* @__PURE__ */ new Set(), this.calc = ga(...t);
    const n = this._get(), r = Mu(n);
    vd(this, r.create(n));
  }
  advance(e) {
    const t = this._get(), n = this.get();
    ln(t, n) || (Ft(this).setValue(t), this._onChange(t, this.idle)), !this.idle && gh(this._active) && Yl(this);
  }
  _get() {
    const e = X.arr(this.source) ? this.source.map(ut) : st(ut(this.source));
    return this.calc(...e);
  }
  _start() {
    this.idle && !gh(this._active) && (this.idle = !1, ge(Cs(this), (e) => {
      e.done = !1;
    }), Mt.skipAnimation ? (ce.batchedUpdates(() => this.advance()), Yl(this)) : Os.start(this));
  }
  // Observe our sources only when we're observed.
  _attach() {
    let e = 1;
    ge(st(this.source), (t) => {
      St(t) && bo(t, this), _u(t) && (t.idle || this._active.add(t), e = Math.max(e, t.priority + 1));
    }), this.priority = e, this._start();
  }
  // Stop observing our sources once we have no observers.
  _detach() {
    ge(st(this.source), (e) => {
      St(e) && ya(e, this);
    }), this._active.clear(), Yl(this);
  }
  /** @internal */
  eventObserved(e) {
    e.type == "change" ? e.idle ? this.advance() : (this._active.add(e.parent), this._start()) : e.type == "idle" ? this._active.delete(e.parent) : e.type == "priority" && (this.priority = st(this.source).reduce(
      (t, n) => Math.max(t, (_u(n) ? n.priority : 0) + 1),
      0
    ));
  }
};
function fI(e) {
  return e.idle !== !1;
}
function gh(e) {
  return !e.size || Array.from(e).every(fI);
}
function Yl(e) {
  e.idle || (e.idle = !0, ge(Cs(e), (t) => {
    t.done = !0;
  }), ba(e, {
    type: "idle",
    parent: e
  }));
}
Mt.assign({
  createStringInterpolator: k0,
  to: (e, t) => new uI(e, t)
});
var H0 = /^--/;
function dI(e, t) {
  return t == null || typeof t == "boolean" || t === "" ? "" : typeof t == "number" && t !== 0 && !H0.test(e) && !(Zo.hasOwnProperty(e) && Zo[e]) ? t + "px" : ("" + t).trim();
}
var hh = {};
function pI(e, t) {
  if (!e.nodeType || !e.setAttribute)
    return !1;
  const n = e.nodeName === "filter" || e.parentNode && e.parentNode.nodeName === "filter", {
    className: r,
    style: o,
    children: a,
    scrollTop: i,
    scrollLeft: s,
    viewBox: l,
    ...c
  } = t, u = Object.values(c), f = Object.keys(c).map(
    (d) => n || e.hasAttribute(d) ? d : hh[d] || (hh[d] = d.replace(
      /([A-Z])/g,
      // Attributes are written in dash case
      (p) => "-" + p.toLowerCase()
    ))
  );
  a !== void 0 && (e.textContent = a);
  for (const d in o)
    if (o.hasOwnProperty(d)) {
      const p = dI(d, o[d]);
      H0.test(d) ? e.style.setProperty(d, p) : e.style[d] = p;
    }
  f.forEach((d, p) => {
    e.setAttribute(d, u[p]);
  }), r !== void 0 && (e.className = r), i !== void 0 && (e.scrollTop = i), s !== void 0 && (e.scrollLeft = s), l !== void 0 && e.setAttribute("viewBox", l);
}
var Zo = {
  animationIterationCount: !0,
  borderImageOutset: !0,
  borderImageSlice: !0,
  borderImageWidth: !0,
  boxFlex: !0,
  boxFlexGroup: !0,
  boxOrdinalGroup: !0,
  columnCount: !0,
  columns: !0,
  flex: !0,
  flexGrow: !0,
  flexPositive: !0,
  flexShrink: !0,
  flexNegative: !0,
  flexOrder: !0,
  gridRow: !0,
  gridRowEnd: !0,
  gridRowSpan: !0,
  gridRowStart: !0,
  gridColumn: !0,
  gridColumnEnd: !0,
  gridColumnSpan: !0,
  gridColumnStart: !0,
  fontWeight: !0,
  lineClamp: !0,
  lineHeight: !0,
  opacity: !0,
  order: !0,
  orphans: !0,
  tabSize: !0,
  widows: !0,
  zIndex: !0,
  zoom: !0,
  // SVG-related properties
  fillOpacity: !0,
  floodOpacity: !0,
  stopOpacity: !0,
  strokeDasharray: !0,
  strokeDashoffset: !0,
  strokeMiterlimit: !0,
  strokeOpacity: !0,
  strokeWidth: !0
}, mI = (e, t) => e + t.charAt(0).toUpperCase() + t.substring(1), gI = ["Webkit", "Ms", "Moz", "O"];
Zo = Object.keys(Zo).reduce((e, t) => (gI.forEach((n) => e[mI(n, t)] = e[t]), e), Zo);
var hI = /^(matrix|translate|scale|rotate|skew)/, bI = /^(translate)/, yI = /^(rotate|skew)/, Bl = (e, t) => X.num(e) && e !== 0 ? e + t : e, xi = (e, t) => X.arr(e) ? e.every((n) => xi(n, t)) : X.num(e) ? e === t : parseFloat(e) === t, vI = class extends Ns {
  constructor({ x: e, y: t, z: n, ...r }) {
    const o = [], a = [];
    (e || t || n) && (o.push([e || 0, t || 0, n || 0]), a.push((i) => [
      `translate3d(${i.map((s) => Bl(s, "px")).join(",")})`,
      // prettier-ignore
      xi(i, 0)
    ])), Zt(r, (i, s) => {
      if (s === "transform")
        o.push([i || ""]), a.push((l) => [l, l === ""]);
      else if (hI.test(s)) {
        if (delete r[s], X.und(i)) return;
        const l = bI.test(s) ? "px" : yI.test(s) ? "deg" : "";
        o.push(st(i)), a.push(
          s === "rotate3d" ? ([c, u, f, d]) => [
            `rotate3d(${c},${u},${f},${Bl(d, l)})`,
            xi(d, 0)
          ] : (c) => [
            `${s}(${c.map((u) => Bl(u, l)).join(",")})`,
            xi(c, s.startsWith("scale") ? 1 : 0)
          ]
        );
      }
    }), o.length && (r.transform = new xI(o, a)), super(r);
  }
}, xI = class extends v0 {
  constructor(e, t) {
    super(), this.inputs = e, this.transforms = t, this._value = null;
  }
  get() {
    return this._value || (this._value = this._get());
  }
  _get() {
    let e = "", t = !0;
    return ge(this.inputs, (n, r) => {
      const o = ut(n[0]), [a, i] = this.transforms[r](
        X.arr(o) ? o : n.map(ut)
      );
      e += " " + a, t = t && i;
    }), t ? "none" : e;
  }
  // Start observing our inputs once we have an observer.
  observerAdded(e) {
    e == 1 && ge(
      this.inputs,
      (t) => ge(
        t,
        (n) => St(n) && bo(n, this)
      )
    );
  }
  // Stop observing our inputs once we have no observers.
  observerRemoved(e) {
    e == 0 && ge(
      this.inputs,
      (t) => ge(
        t,
        (n) => St(n) && ya(n, this)
      )
    );
  }
  eventObserved(e) {
    e.type == "change" && (this._value = null), ba(this, e);
  }
}, wI = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdi",
  "bdo",
  "big",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "keygen",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "menu",
  "menuitem",
  "meta",
  "meter",
  "nav",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "script",
  "section",
  "select",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
  // SVG
  "circle",
  "clipPath",
  "defs",
  "ellipse",
  "foreignObject",
  "g",
  "image",
  "line",
  "linearGradient",
  "mask",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "stop",
  "svg",
  "text",
  "tspan"
];
Mt.assign({
  batchedUpdates: ew,
  createStringInterpolator: k0,
  colors: lN
});
var kI = zN(wI, {
  applyAnimatedValues: pI,
  createAnimatedStyle: (e) => new vI(e),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getComponentProps: ({ scrollTop: e, scrollLeft: t, ...n }) => n
}), U0 = kI.animated;
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const EI = {
  prefix: "fas",
  iconName: "down-left-and-up-right-to-center",
  icon: [512, 512, ["compress-alt"], "f422", "M439 7c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8l-144 0c-13.3 0-24-10.7-24-24l0-144c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39L439 7zM72 272l144 0c13.3 0 24 10.7 24 24l0 144c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39L73 505c-9.4 9.4-24.6 9.4-33.9 0L7 473c-9.4-9.4-9.4-24.6 0-33.9l87-87L55 313c-6.9-6.9-8.9-17.2-5.2-26.2s12.5-14.8 22.2-14.8z"]
}, OI = {
  prefix: "fas",
  iconName: "up-right-and-down-left-from-center",
  icon: [512, 512, ["expand-alt"], "f424", "M344 0L488 0c13.3 0 24 10.7 24 24l0 144c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87L327 41c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512L24 512c-13.3 0-24-10.7-24-24L0 344c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39 87-87c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8z"]
};
var Fu = /* @__PURE__ */ ((e) => (e[e.NONE = 0] = "NONE", e[e.INPUT = 1] = "INPUT", e[e.PANEL = 2] = "PANEL", e[e.DIALOGUE = 3] = "DIALOGUE", e))(Fu || {}), SI = Object.freeze({
  // See: https://github.com/twbs/bootstrap/blob/main/scss/mixins/_visually-hidden.scss
  position: "absolute",
  border: 0,
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  wordWrap: "normal"
}), PI = "VisuallyHidden", Y0 = S.forwardRef(
  (e, t) => /* @__PURE__ */ Y(
    tn.span,
    {
      ...e,
      ref: t,
      style: { ...SI, ...e.style }
    }
  )
);
Y0.displayName = PI;
var bh = Y0;
const ka = [], AI = (e) => {
  ka.push(e);
}, CI = (e) => {
  const t = ka.findIndex((n) => n.id === e);
  t !== -1 && ka.splice(t, 1);
}, $I = (e, t) => {
  const n = ka.find((r) => r.id === e);
  n && Object.assign(n, t);
}, NI = () => ka.filter((e) => e.closeOnEsc).sort((e, t) => t.zIndex - e.zIndex)[0];
typeof window < "u" && !window.__modalEscListenerInstalled && (window.__modalEscListenerInstalled = !0, window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" && e.key !== "Esc") return;
  const t = NI();
  t && (e.preventDefault(), t.onClose());
}));
let $o = 70;
const II = ({
  styles: e,
  backdropClassName: t,
  disableHotkeyInput: n,
  enableHotkeyInput: r
}) => (Ee(() => (n(Fu.DIALOGUE), () => {
  r(Fu.DIALOGUE);
}), [n, r]), /* @__PURE__ */ Y(KP, { forceMount: !0, asChild: !0, children: /* @__PURE__ */ Y(
  U0.div,
  {
    className: Yo("fixed inset-0 z-[69]", t),
    style: {
      opacity: e.opacity,
      pointerEvents: "none",
      background: "radial-gradient(800px 400px at 10% -10%, rgba(45,129,255,0.10), transparent), radial-gradient(600px 320px at 110% 110%, rgba(28,182,190,0.10), transparent), rgba(0,0,0,0.60)"
    }
  }
) })), Lu = ({ children: e }) => /* @__PURE__ */ Y(Ct, { children: e }), B0 = dt(
  void 0
), Od = ({ className: e, size: t = "md" }) => {
  const n = Ke(B0);
  if (!n) return null;
  const { expanded: r, toggleExpanded: o } = n;
  return /* @__PURE__ */ Y(
    "button",
    {
      type: "button",
      "aria-label": r ? "Restore modal size" : "Expand modal",
      onClick: o,
      className: Yo(
        "flex items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white",
        {
          sm: "h-5 w-5 text-sm",
          md: "h-7 w-7 text-md",
          lg: "h-9 w-9 text-xl"
        }[t],
        "relative z-[70]",
        e
      ),
      children: /* @__PURE__ */ Y(
        da,
        {
          icon: r ? EI : OI
        }
      )
    }
  );
};
Od.displayName = "ModalExpandButton";
const Fa = ({
  isOpen: e,
  title: t,
  titleIcon: n,
  onTitleIconClick: r,
  onClose: o,
  enableHotkeyInput: a = () => {
  },
  disableHotkeyInput: i = () => {
  },
  className: s,
  backdropClassName: l,
  width: c,
  children: u,
  childPadding: f = !0,
  titleIconClassName: d,
  showClose: p = !0,
  draggable: b = !1,
  resizable: m = !1,
  initialPosition: g,
  closeOnOutsideClick: v = !0,
  closeOnEsc: k = !0,
  allowBackgroundInteraction: x = !1,
  expandable: O = !1,
  accessibleTitle: h,
  accessibleDescription: L
}) => {
  const [_, H] = $e(
    null
  ), [J, Z] = $e(!1), [U, T] = $e(!1), te = le({ x: 0, y: 0 }), W = le({ x: 0, y: 0 }), j = le(null), D = le(null), Q = le(null), [V, z] = $e(() => ++$o), [y, w] = $e(!1), C = le(null), A = mh(e, {
    from: {
      opacity: 0,
      transform: "scale(0.95) translateY(-10px)"
    },
    enter: {
      opacity: 1,
      transform: "scale(1) translateY(0px)"
    },
    leave: {
      opacity: 0,
      transform: "scale(0.95) translateY(10px)"
    },
    config: {
      tension: 300,
      friction: 30,
      mass: 0.8
    }
  }), P = mh(e, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: {
      tension: 280,
      friction: 25
    }
  });
  Ee(() => {
    y ? (D.current && (C.current = { ...D.current }), H({ x: 0, y: 0 }), D.current = { x: 0, y: 0 }, j.current && (j.current.style.left = "0px", j.current.style.top = "0px", j.current.style.margin = "0", j.current.style.position = "fixed", j.current.style.zIndex = String(V))) : C.current && (H({ ...C.current }), D.current = { ...C.current }, j.current && (j.current.style.left = C.current.x + "px", j.current.style.top = C.current.y + "px", j.current.style.margin = "0", j.current.style.position = "fixed", j.current.style.zIndex = String(V)));
  }, [y, V]);
  const I = () => w((ie) => !ie);
  Ee(() => {
    e ? Q.current ? (H({ ...Q.current }), D.current = { ...Q.current }, j.current && (j.current.style.left = Q.current.x + "px", j.current.style.top = Q.current.y + "px", j.current.style.margin = "0", j.current.style.position = "fixed", j.current.style.zIndex = String(V))) : g && (H({ ...g }), D.current = { ...g }, j.current && (j.current.style.left = g.x + "px", j.current.style.top = g.y + "px", j.current.style.margin = "0", j.current.style.position = "fixed", j.current.style.zIndex = String(V))) : D.current && (Q.current = { ...D.current });
  }, [e, V]), Ee(() => {
    if (!J) return;
    let ie = null;
    const se = (xt) => {
      if (!j.current) return;
      const wt = xt.clientX - W.current.x, je = xt.clientY - W.current.y, Be = te.current.x + wt, Qe = te.current.y + je, kt = j.current, { width: Et, height: Ar } = kt.getBoundingClientRect(), Dd = window.innerWidth, zd = window.innerHeight, Wd = 450, Hx = -450, Ux = 0, Yx = Dd - Et + Wd, Bx = zd - Ar + Wd, Gx = Math.max(Hx, Math.min(Be, Yx)), qx = Math.max(Ux, Math.min(Qe, Bx));
      D.current = { x: Gx, y: qx }, j.current && (ie && cancelAnimationFrame(ie), ie = requestAnimationFrame(() => {
        j.current && D.current && (j.current.style.left = D.current.x + "px", j.current.style.top = D.current.y + "px", j.current.style.margin = "0", j.current.style.position = "fixed", j.current.style.zIndex = String(V));
      }));
    }, xe = () => {
      Z(!1), D.current && H({ ...D.current });
    };
    return window.addEventListener("mousemove", se), window.addEventListener("mouseup", xe), () => {
      window.removeEventListener("mousemove", se), window.removeEventListener("mouseup", xe), ie && cancelAnimationFrame(ie);
    };
  }, [J, V]);
  const N = (ie) => {
    var se, xe;
    if (!j.current) return;
    y && w(!1), ie.preventDefault(), ie.stopPropagation();
    const xt = j.current, { width: wt, height: je } = xt.getBoundingClientRect(), Be = window.innerWidth, Qe = window.innerHeight;
    let kt = ((se = D.current) == null ? void 0 : se.x) ?? (_ == null ? void 0 : _.x), Et = ((xe = D.current) == null ? void 0 : xe.y) ?? (_ == null ? void 0 : _.y);
    (kt === void 0 || Et === void 0) && (g ? (kt = g.x, Et = g.y) : (kt = (Be - wt) / 2, Et = (Qe - je) / 2)), te.current = { x: kt, y: Et }, W.current = { x: ie.clientX, y: ie.clientY }, Z(!0), !_ && !D.current && (H({ x: kt, y: Et }), D.current = { x: kt, y: Et }, j.current && (j.current.style.left = kt + "px", j.current.style.top = Et + "px", j.current.style.margin = "0", j.current.style.position = "fixed", j.current.style.zIndex = String(V)));
  };
  let $ = u;
  if (b) {
    let ie = !1;
    $ = Array.isArray(u) ? u.map((se) => {
      if (!ie && lc(se) && (se.type === Lu || se.type.displayName === "ModalDragHandle")) {
        ie = !0;
        const xe = se;
        return cc(xe, {
          children: /* @__PURE__ */ Y(
            "div",
            {
              style: { cursor: "move", userSelect: "none" },
              onMouseDown: N,
              children: xe.props.children
            }
          )
        });
      }
      return se;
    }) : lc(u) && (u.type === Lu || u.type.displayName === "ModalDragHandle") ? (() => {
      const se = u;
      return cc(se, {
        children: /* @__PURE__ */ Y(
          "div",
          {
            style: { cursor: "move", userSelect: "none" },
            onMouseDown: N,
            children: se.props.children
          }
        )
      });
    })() : u;
  }
  const R = le(null), M = le(null), F = (ie, se) => {
    if (!j.current || (ie.preventDefault(), ie.stopPropagation(), y)) return;
    const xe = j.current.getBoundingClientRect();
    R.current = se, M.current = {
      mouseX: ie.clientX,
      mouseY: ie.clientY,
      width: xe.width,
      height: xe.height,
      x: xe.left,
      y: xe.top
    }, T(!0);
  };
  Ee(() => {
    if (!U) return;
    let ie = null;
    const se = (xt) => {
      if (!j.current || !M.current || !R.current)
        return;
      const wt = xt.clientX - M.current.mouseX, je = xt.clientY - M.current.mouseY;
      let Be = M.current.width, Qe = M.current.height, kt = M.current.x, Et = M.current.y;
      const Ar = R.current;
      Ar.includes("right") && (Be = M.current.width + wt), Ar.includes("left") && (Be = M.current.width - wt, kt = M.current.x + wt), Ar.includes("bottom") && (Qe = M.current.height + je), Ar.includes("top") && (Qe = M.current.height - je, Et = M.current.y + je), Be = Math.max(320, Be), Qe = Math.max(240, Qe), D.current = { x: kt, y: Et }, Me.current = { width: Be, height: Qe }, ie && cancelAnimationFrame(ie), ie = requestAnimationFrame(() => {
        j.current && D.current && (j.current.style.width = Be + "px", j.current.style.height = Qe + "px", j.current.style.left = D.current.x + "px", j.current.style.top = D.current.y + "px", j.current.style.margin = "0", j.current.style.position = "fixed", j.current.style.zIndex = String(V));
      });
    }, xe = () => {
      T(!1), D.current && H({ ...D.current }), Me.current && ue({ ...Me.current });
    };
    return window.addEventListener("mousemove", se), window.addEventListener("mouseup", xe), () => {
      window.removeEventListener("mousemove", se), window.removeEventListener("mouseup", xe), ie && cancelAnimationFrame(ie);
    };
  }, [U, V]);
  const ee = () => {
    if (!m || y) return null;
    const ie = "absolute z-[75] bg-transparent select-none", se = 5, xe = 2, xt = [
      { dir: "top", className: `top-0 left-0 w-full h-${xe}` },
      { dir: "bottom", className: `bottom-0 left-0 w-full h-${xe}` },
      { dir: "left", className: `left-0 top-0 h-full w-${xe}` },
      { dir: "right", className: `right-0 top-0 h-full w-${xe}` },
      {
        dir: "top-left",
        className: `top-0 left-0 w-${se} h-${se}`
      },
      {
        dir: "top-right",
        className: `top-0 right-0 w-${se} h-${se}`
      },
      {
        dir: "bottom-left",
        className: `bottom-0 left-0 w-${se} h-${se}`
      },
      {
        dir: "bottom-right",
        className: `bottom-0 right-0 w-${se} h-${se}`
      }
    ], wt = {
      top: "n-resize",
      bottom: "s-resize",
      left: "w-resize",
      right: "e-resize",
      "top-left": "nw-resize",
      "top-right": "ne-resize",
      "bottom-left": "sw-resize",
      "bottom-right": "se-resize"
    };
    return xt.map((je) => /* @__PURE__ */ Y(
      "div",
      {
        className: `${ie} ${je.className}`,
        style: { cursor: wt[je.dir] },
        onMouseDown: (Be) => F(Be, je.dir)
      },
      je.dir
    ));
  }, [E, ue] = $e(
    null
  ), Me = le(null), it = le(null);
  Ee(() => {
    if (e && !E && j.current && m) {
      const { width: ie, height: se } = j.current.getBoundingClientRect();
      ue({ width: ie, height: se }), Me.current = { width: ie, height: se };
    }
  }, [e, E, m]), Ee(() => {
    if (m) {
      if (!e)
        Me.current && (it.current = { ...Me.current });
      else if (it.current && j.current) {
        const { width: ie, height: se } = it.current;
        j.current.style.width = ie + "px", j.current.style.height = se + "px", ue({ width: ie, height: se }), Me.current = { width: ie, height: se };
      }
    }
  }, [e, m]), Ee(() => {
    const ie = () => {
      j.current && V < $o && ($o += 1, z($o), j.current.style.zIndex = String($o));
    }, se = j.current;
    return se && se.addEventListener("mousedown", ie), () => {
      se && se.removeEventListener("mousedown", ie);
    };
  }, [V]), Ee(() => {
    if (!e || x) return;
    const ie = (se) => {
      if (se.key === "Escape" || se.key === "Esc") return;
      const xe = se.target;
      xe && (xe.closest(
        '[role="dialog"], [role="menu"], [role="listbox"], [data-headlessui-portal]'
      ) || xe.matches("input, textarea, select, button, [contenteditable]")) || se.stopPropagation();
    };
    return window.addEventListener("keydown", ie, !0), () => {
      window.removeEventListener("keydown", ie, !0);
    };
  }, [e, x]), Ee(() => {
    if (!x) return;
    const ie = j.current;
    if (!ie) return;
    const se = (je) => {
      je && (je.hasAttribute("inert") && je.removeAttribute("inert"), je.inert && (je.inert = !1), je.getAttribute("aria-hidden") === "true" && je.removeAttribute("aria-hidden"));
    };
    let xe = ie;
    for (; xe; )
      se(xe), xe = xe.parentElement;
    const xt = new MutationObserver((je) => {
      je.forEach((Be) => {
        if (Be.type === "attributes" && Be.attributeName === "inert" && Be.target instanceof HTMLElement) {
          const Qe = Be.target;
          (Qe === ie || ie.contains(Qe)) && se(Qe);
        }
      });
    });
    xt.observe(ie, {
      attributes: !0,
      subtree: !1,
      attributeFilter: ["inert"]
    }), document.querySelectorAll(
      "[data-radix-portal][inert], [data-headlessui-portal][inert]"
    ).forEach((je) => je.removeAttribute("inert"));
    const wt = new MutationObserver((je) => {
      je.forEach((Be) => {
        if (Be.type === "attributes" && Be.attributeName === "inert" && Be.target.hasAttribute("inert")) {
          const Qe = Be.target;
          (Qe.hasAttribute("data-radix-portal") || Qe.hasAttribute("data-headlessui-portal")) && se(Qe);
        }
      });
    });
    return wt.observe(document.body, {
      attributes: !0,
      subtree: !0,
      attributeFilter: ["inert"]
    }), () => {
      xt.disconnect(), wt.disconnect();
    };
  }, [x]);
  const _s = le(Math.floor(Math.random() * 1e9));
  Ee(() => {
    if (e)
      return AI({
        id: _s.current,
        zIndex: V,
        onClose: o,
        closeOnEsc: k
      }), () => {
        CI(_s.current);
      };
  }, [e]), Ee(() => {
    e && $I(_s.current, { zIndex: V, onClose: o, closeOnEsc: k });
  }, [e, V, o, k]);
  const Vx = () => y ? {
    position: "fixed",
    left: 0,
    top: 0,
    margin: 0,
    zIndex: V,
    width: "100vw",
    height: "100vh",
    ...x ? { pointerEvents: "auto" } : {}
  } : !b || !_ ? {
    ...m && E ? { width: E.width, height: E.height } : {},
    ...x ? { pointerEvents: "auto" } : {}
  } : {
    position: "fixed",
    left: _.x,
    top: _.y,
    margin: 0,
    zIndex: V,
    ...m && E ? { width: E.width, height: E.height } : {},
    ...x ? { pointerEvents: "auto" } : {}
  };
  return /* @__PURE__ */ Y(
    GP,
    {
      open: e,
      onOpenChange: (ie) => !ie && v && o(),
      modal: !x,
      children: /* @__PURE__ */ Y(qP, { children: /* @__PURE__ */ Xe(
        "div",
        {
          className: "fixed inset-0 z-[70]",
          style: x ? { pointerEvents: "none" } : void 0,
          children: [
            !x && P(
              (ie, se) => se ? /* @__PURE__ */ Y(
                II,
                {
                  styles: ie,
                  backdropClassName: l,
                  disableHotkeyInput: i,
                  enableHotkeyInput: a
                },
                "backdrop"
              ) : null
            ),
            x && /* @__PURE__ */ Y(
              "div",
              {
                className: Yo("fixed inset-0 z-[69]", l),
                style: { pointerEvents: "none" }
              }
            ),
            /* @__PURE__ */ Y(B0.Provider, { value: { expanded: y, toggleExpanded: I }, children: /* @__PURE__ */ Y(
              "div",
              {
                className: "flex min-h-full items-center justify-center p-4 text-center",
                style: x ? { pointerEvents: "none" } : void 0,
                children: A((ie, se) => se ? /* @__PURE__ */ Y(
                  XP,
                  {
                    forceMount: !0,
                    asChild: !0,
                    ...L ? {} : { "aria-describedby": void 0 },
                    onPointerDownOutside: (xe) => {
                      (!v || x) && xe.preventDefault();
                    },
                    onEscapeKeyDown: (xe) => {
                      k || xe.preventDefault();
                    },
                    onInteractOutside: (xe) => {
                      x && xe.preventDefault();
                    },
                    children: /* @__PURE__ */ Xe(
                      U0.div,
                      {
                        className: Yo(
                          "w-full max-w-lg rounded-xl relative border border-ui-panel-border bg-ui-modal text-left align-middle shadow-2xl z-[70]",
                          f && !y ? "p-4" : "",
                          s,
                          "!transition-none",
                          // Always disable CSS transitions for spring animations
                          y && "w-screen h-screen max-w-screen max-h-screen rounded-none"
                        ),
                        ref: j,
                        style: {
                          ...Vx(),
                          opacity: ie.opacity,
                          transform: ie.transform,
                          transformOrigin: "center center",
                          willChange: "transform, opacity"
                          // Optimize for animations
                        },
                        children: [
                          /* @__PURE__ */ Xe("div", { className: "w-full h-full", children: [
                            L && /* @__PURE__ */ Y(bh, { asChild: !0, children: /* @__PURE__ */ Y(QP, { children: L }) }),
                            t ? /* @__PURE__ */ Y(
                              bm,
                              {
                                className: Yo(
                                  "mb-4 flex justify-between pb-0 text-xl font-bold text-base-fg"
                                ),
                                children: /* @__PURE__ */ Y(Ct, { children: r ? /* @__PURE__ */ Xe(
                                  "button",
                                  {
                                    className: "flex items-center gap-3",
                                    onClick: r,
                                    children: [
                                      n && /* @__PURE__ */ Y(
                                        da,
                                        {
                                          icon: n,
                                          className: d
                                        }
                                      ),
                                      t
                                    ]
                                  }
                                ) : /* @__PURE__ */ Xe("div", { className: "flex items-center gap-3", children: [
                                  n && /* @__PURE__ */ Y(
                                    da,
                                    {
                                      icon: n,
                                      className: d
                                    }
                                  ),
                                  t
                                ] }) })
                              }
                            ) : /* @__PURE__ */ Y(bh, { asChild: !0, children: /* @__PURE__ */ Y(bm, { children: h ?? "Dialog" }) }),
                            /* @__PURE__ */ Y("div", { className: "h-full".trim(), children: $ }),
                            ee()
                          ] }),
                          (p || O) && /* @__PURE__ */ Xe("div", { className: "absolute top-0 right-0 m-2.5 z-[80] flex items-center gap-2", children: [
                            O && /* @__PURE__ */ Y(Fa.ExpandButton, {}),
                            p && /* @__PURE__ */ Y(eN, { onClick: o })
                          ] })
                        ]
                      }
                    )
                  }
                ) : null)
              }
            ) })
          ]
        }
      ) })
    }
  );
};
Fa.DragHandle = Lu;
Fa.DragHandle.displayName = "ModalDragHandle";
Fa.ExpandButton = Od;
Od.displayName = "ModalExpandButton";
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function TI(e, t, n) {
  return (t = RI(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function yh(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function K(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? yh(Object(n), !0).forEach(function(r) {
      TI(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : yh(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function MI(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function RI(e) {
  var t = MI(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const vh = () => {
};
let Sd = {}, G0 = {}, q0 = null, K0 = {
  mark: vh,
  measure: vh
};
try {
  typeof window < "u" && (Sd = window), typeof document < "u" && (G0 = document), typeof MutationObserver < "u" && (q0 = MutationObserver), typeof performance < "u" && (K0 = performance);
} catch {
}
const {
  userAgent: xh = ""
} = Sd.navigator || {}, Jn = Sd, Ue = G0, wh = q0, si = K0;
Jn.document;
const xn = !!Ue.documentElement && !!Ue.head && typeof Ue.addEventListener == "function" && typeof Ue.createElement == "function", X0 = ~xh.indexOf("MSIE") || ~xh.indexOf("Trident/");
var jI = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, _I = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Q0 = {
  classic: {
    fa: "solid",
    fas: "solid",
    "fa-solid": "solid",
    far: "regular",
    "fa-regular": "regular",
    fal: "light",
    "fa-light": "light",
    fat: "thin",
    "fa-thin": "thin",
    fab: "brands",
    "fa-brands": "brands"
  },
  duotone: {
    fa: "solid",
    fad: "solid",
    "fa-solid": "solid",
    "fa-duotone": "solid",
    fadr: "regular",
    "fa-regular": "regular",
    fadl: "light",
    "fa-light": "light",
    fadt: "thin",
    "fa-thin": "thin"
  },
  sharp: {
    fa: "solid",
    fass: "solid",
    "fa-solid": "solid",
    fasr: "regular",
    "fa-regular": "regular",
    fasl: "light",
    "fa-light": "light",
    fast: "thin",
    "fa-thin": "thin"
  },
  "sharp-duotone": {
    fa: "solid",
    fasds: "solid",
    "fa-solid": "solid",
    fasdr: "regular",
    "fa-regular": "regular",
    fasdl: "light",
    "fa-light": "light",
    fasdt: "thin",
    "fa-thin": "thin"
  }
}, FI = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, J0 = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], at = "classic", Is = "duotone", LI = "sharp", DI = "sharp-duotone", Z0 = [at, Is, LI, DI], zI = {
  classic: {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  duotone: {
    900: "fad",
    400: "fadr",
    300: "fadl",
    100: "fadt"
  },
  sharp: {
    900: "fass",
    400: "fasr",
    300: "fasl",
    100: "fast"
  },
  "sharp-duotone": {
    900: "fasds",
    400: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
}, WI = {
  "Font Awesome 6 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 6 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  "Font Awesome 6 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 6 Duotone": {
    900: "fad",
    400: "fadr",
    normal: "fadr",
    300: "fadl",
    100: "fadt"
  },
  "Font Awesome 6 Sharp": {
    900: "fass",
    400: "fasr",
    normal: "fasr",
    300: "fasl",
    100: "fast"
  },
  "Font Awesome 6 Sharp Duotone": {
    900: "fasds",
    400: "fasdr",
    normal: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
}, VI = /* @__PURE__ */ new Map([["classic", {
  defaultShortPrefixId: "fas",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin", "brands"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp", {
  defaultShortPrefixId: "fass",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["duotone", {
  defaultShortPrefixId: "fad",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp-duotone", {
  defaultShortPrefixId: "fasds",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}]]), HI = {
  classic: {
    solid: "fas",
    regular: "far",
    light: "fal",
    thin: "fat",
    brands: "fab"
  },
  duotone: {
    solid: "fad",
    regular: "fadr",
    light: "fadl",
    thin: "fadt"
  },
  sharp: {
    solid: "fass",
    regular: "fasr",
    light: "fasl",
    thin: "fast"
  },
  "sharp-duotone": {
    solid: "fasds",
    regular: "fasdr",
    light: "fasdl",
    thin: "fasdt"
  }
}, UI = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], kh = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, YI = ["kit"], BI = {
  kit: {
    "fa-kit": "fak"
  }
}, GI = ["fak", "fakd"], qI = {
  kit: {
    fak: "fa-kit"
  }
}, Eh = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, li = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, KI = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], XI = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], QI = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, JI = {
  classic: {
    "fa-brands": "fab",
    "fa-duotone": "fad",
    "fa-light": "fal",
    "fa-regular": "far",
    "fa-solid": "fas",
    "fa-thin": "fat"
  },
  duotone: {
    "fa-regular": "fadr",
    "fa-light": "fadl",
    "fa-thin": "fadt"
  },
  sharp: {
    "fa-solid": "fass",
    "fa-regular": "fasr",
    "fa-light": "fasl",
    "fa-thin": "fast"
  },
  "sharp-duotone": {
    "fa-solid": "fasds",
    "fa-regular": "fasdr",
    "fa-light": "fasdl",
    "fa-thin": "fasdt"
  }
}, ZI = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Du = {
  classic: {
    fab: "fa-brands",
    fad: "fa-duotone",
    fal: "fa-light",
    far: "fa-regular",
    fas: "fa-solid",
    fat: "fa-thin"
  },
  duotone: {
    fadr: "fa-regular",
    fadl: "fa-light",
    fadt: "fa-thin"
  },
  sharp: {
    fass: "fa-solid",
    fasr: "fa-regular",
    fasl: "fa-light",
    fast: "fa-thin"
  },
  "sharp-duotone": {
    fasds: "fa-solid",
    fasdr: "fa-regular",
    fasdl: "fa-light",
    fasdt: "fa-thin"
  }
}, eT = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], zu = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...KI, ...eT], tT = ["solid", "regular", "light", "thin", "duotone", "brands"], ex = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], nT = ex.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), rT = [...Object.keys(ZI), ...tT, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", li.GROUP, li.SWAP_OPACITY, li.PRIMARY, li.SECONDARY].concat(ex.map((e) => "".concat(e, "x"))).concat(nT.map((e) => "w-".concat(e))), oT = {
  "Font Awesome 5 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 5 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal"
  },
  "Font Awesome 5 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 5 Duotone": {
    900: "fad"
  }
};
const gn = "___FONT_AWESOME___", Wu = 16, tx = "fa", nx = "svg-inline--fa", kr = "data-fa-i2svg", Vu = "data-fa-pseudo-element", aT = "data-fa-pseudo-element-pending", Pd = "data-prefix", Ad = "data-icon", Oh = "fontawesome-i2svg", iT = "async", sT = ["HTML", "HEAD", "STYLE", "SCRIPT"], rx = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function La(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[at];
    }
  });
}
const ox = K({}, Q0);
ox[at] = K(K(K(K({}, {
  "fa-duotone": "duotone"
}), Q0[at]), kh.kit), kh["kit-duotone"]);
const lT = La(ox), Hu = K({}, HI);
Hu[at] = K(K(K(K({}, {
  duotone: "fad"
}), Hu[at]), Eh.kit), Eh["kit-duotone"]);
const Sh = La(Hu), Uu = K({}, Du);
Uu[at] = K(K({}, Uu[at]), qI.kit);
const Cd = La(Uu), Yu = K({}, JI);
Yu[at] = K(K({}, Yu[at]), BI.kit);
La(Yu);
const cT = jI, ax = "fa-layers-text", uT = _I, fT = K({}, zI);
La(fT);
const dT = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Gl = FI, pT = [...YI, ...rT], ea = Jn.FontAwesomeConfig || {};
function mT(e) {
  var t = Ue.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function gT(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
Ue && typeof Ue.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, n] = e;
  const r = gT(mT(t));
  r != null && (ea[n] = r);
});
const ix = {
  styleDefault: "solid",
  familyDefault: at,
  cssPrefix: tx,
  replacementClass: nx,
  autoReplaceSvg: !0,
  autoAddCss: !0,
  autoA11y: !0,
  searchPseudoElements: !1,
  observeMutations: !0,
  mutateApproach: "async",
  keepOriginalSource: !0,
  measurePerformance: !1,
  showMissingIcons: !0
};
ea.familyPrefix && (ea.cssPrefix = ea.familyPrefix);
const ao = K(K({}, ix), ea);
ao.autoReplaceSvg || (ao.observeMutations = !1);
const ae = {};
Object.keys(ix).forEach((e) => {
  Object.defineProperty(ae, e, {
    enumerable: !0,
    set: function(t) {
      ao[e] = t, ta.forEach((n) => n(ae));
    },
    get: function() {
      return ao[e];
    }
  });
});
Object.defineProperty(ae, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    ao.cssPrefix = e, ta.forEach((t) => t(ae));
  },
  get: function() {
    return ao.cssPrefix;
  }
});
Jn.FontAwesomeConfig = ae;
const ta = [];
function hT(e) {
  return ta.push(e), () => {
    ta.splice(ta.indexOf(e), 1);
  };
}
const $n = Wu, Kt = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function bT(e) {
  if (!e || !xn)
    return;
  const t = Ue.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = Ue.head.childNodes;
  let r = null;
  for (let o = n.length - 1; o > -1; o--) {
    const a = n[o], i = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = a);
  }
  return Ue.head.insertBefore(t, r), e;
}
const yT = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Ea() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += yT[Math.random() * 62 | 0];
  return t;
}
function yo(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function $d(e) {
  return e.classList ? yo(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function sx(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function vT(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(sx(e[n]), '" '), "").trim();
}
function Ts(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function Nd(e) {
  return e.size !== Kt.size || e.x !== Kt.x || e.y !== Kt.y || e.rotate !== Kt.rotate || e.flipX || e.flipY;
}
function xT(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const o = {
    transform: "translate(".concat(n / 2, " 256)")
  }, a = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), l = {
    transform: "".concat(a, " ").concat(i, " ").concat(s)
  }, c = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: l,
    path: c
  };
}
function wT(e) {
  let {
    transform: t,
    width: n = Wu,
    height: r = Wu,
    startCentered: o = !1
  } = e, a = "";
  return o && X0 ? a += "translate(".concat(t.x / $n - n / 2, "em, ").concat(t.y / $n - r / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / $n, "em), calc(-50% + ").concat(t.y / $n, "em)) ") : a += "translate(".concat(t.x / $n, "em, ").concat(t.y / $n, "em) "), a += "scale(".concat(t.size / $n * (t.flipX ? -1 : 1), ", ").concat(t.size / $n * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var kT = `:root, :host {
  --fa-font-solid: normal 900 1em/1 "Font Awesome 6 Free";
  --fa-font-regular: normal 400 1em/1 "Font Awesome 6 Free";
  --fa-font-light: normal 300 1em/1 "Font Awesome 6 Pro";
  --fa-font-thin: normal 100 1em/1 "Font Awesome 6 Pro";
  --fa-font-duotone: normal 900 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-regular: normal 400 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-light: normal 300 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-thin: normal 100 1em/1 "Font Awesome 6 Duotone";
  --fa-font-brands: normal 400 1em/1 "Font Awesome 6 Brands";
  --fa-font-sharp-solid: normal 900 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-regular: normal 400 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-light: normal 300 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-thin: normal 100 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-duotone-solid: normal 900 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-regular: normal 400 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-light: normal 300 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-thin: normal 100 1em/1 "Font Awesome 6 Sharp Duotone";
}

svg:not(:root).svg-inline--fa, svg:not(:host).svg-inline--fa {
  overflow: visible;
  box-sizing: content-box;
}

.svg-inline--fa {
  display: var(--fa-display, inline-block);
  height: 1em;
  overflow: visible;
  vertical-align: -0.125em;
}
.svg-inline--fa.fa-2xs {
  vertical-align: 0.1em;
}
.svg-inline--fa.fa-xs {
  vertical-align: 0em;
}
.svg-inline--fa.fa-sm {
  vertical-align: -0.0714285705em;
}
.svg-inline--fa.fa-lg {
  vertical-align: -0.2em;
}
.svg-inline--fa.fa-xl {
  vertical-align: -0.25em;
}
.svg-inline--fa.fa-2xl {
  vertical-align: -0.3125em;
}
.svg-inline--fa.fa-pull-left {
  margin-right: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-pull-right {
  margin-left: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-li {
  width: var(--fa-li-width, 2em);
  top: 0.25em;
}
.svg-inline--fa.fa-fw {
  width: var(--fa-fw-width, 1.25em);
}

.fa-layers svg.svg-inline--fa {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
}

.fa-layers-counter, .fa-layers-text {
  display: inline-block;
  position: absolute;
  text-align: center;
}

.fa-layers {
  display: inline-block;
  height: 1em;
  position: relative;
  text-align: center;
  vertical-align: -0.125em;
  width: 1em;
}
.fa-layers svg.svg-inline--fa {
  transform-origin: center center;
}

.fa-layers-text {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center center;
}

.fa-layers-counter {
  background-color: var(--fa-counter-background-color, #ff253a);
  border-radius: var(--fa-counter-border-radius, 1em);
  box-sizing: border-box;
  color: var(--fa-inverse, #fff);
  line-height: var(--fa-counter-line-height, 1);
  max-width: var(--fa-counter-max-width, 5em);
  min-width: var(--fa-counter-min-width, 1.5em);
  overflow: hidden;
  padding: var(--fa-counter-padding, 0.25em 0.5em);
  right: var(--fa-right, 0);
  text-overflow: ellipsis;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-counter-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-bottom-right {
  bottom: var(--fa-bottom, 0);
  right: var(--fa-right, 0);
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom right;
}

.fa-layers-bottom-left {
  bottom: var(--fa-bottom, 0);
  left: var(--fa-left, 0);
  right: auto;
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom left;
}

.fa-layers-top-right {
  top: var(--fa-top, 0);
  right: var(--fa-right, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-top-left {
  left: var(--fa-left, 0);
  right: auto;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top left;
}

.fa-1x {
  font-size: 1em;
}

.fa-2x {
  font-size: 2em;
}

.fa-3x {
  font-size: 3em;
}

.fa-4x {
  font-size: 4em;
}

.fa-5x {
  font-size: 5em;
}

.fa-6x {
  font-size: 6em;
}

.fa-7x {
  font-size: 7em;
}

.fa-8x {
  font-size: 8em;
}

.fa-9x {
  font-size: 9em;
}

.fa-10x {
  font-size: 10em;
}

.fa-2xs {
  font-size: 0.625em;
  line-height: 0.1em;
  vertical-align: 0.225em;
}

.fa-xs {
  font-size: 0.75em;
  line-height: 0.0833333337em;
  vertical-align: 0.125em;
}

.fa-sm {
  font-size: 0.875em;
  line-height: 0.0714285718em;
  vertical-align: 0.0535714295em;
}

.fa-lg {
  font-size: 1.25em;
  line-height: 0.05em;
  vertical-align: -0.075em;
}

.fa-xl {
  font-size: 1.5em;
  line-height: 0.0416666682em;
  vertical-align: -0.125em;
}

.fa-2xl {
  font-size: 2em;
  line-height: 0.03125em;
  vertical-align: -0.1875em;
}

.fa-fw {
  text-align: center;
  width: 1.25em;
}

.fa-ul {
  list-style-type: none;
  margin-left: var(--fa-li-margin, 2.5em);
  padding-left: 0;
}
.fa-ul > li {
  position: relative;
}

.fa-li {
  left: calc(-1 * var(--fa-li-width, 2em));
  position: absolute;
  text-align: center;
  width: var(--fa-li-width, 2em);
  line-height: inherit;
}

.fa-border {
  border-color: var(--fa-border-color, #eee);
  border-radius: var(--fa-border-radius, 0.1em);
  border-style: var(--fa-border-style, solid);
  border-width: var(--fa-border-width, 0.08em);
  padding: var(--fa-border-padding, 0.2em 0.25em 0.15em);
}

.fa-pull-left {
  float: left;
  margin-right: var(--fa-pull-margin, 0.3em);
}

.fa-pull-right {
  float: right;
  margin-left: var(--fa-pull-margin, 0.3em);
}

.fa-beat {
  animation-name: fa-beat;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-bounce {
  animation-name: fa-bounce;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.28, 0.84, 0.42, 1));
}

.fa-fade {
  animation-name: fa-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-beat-fade {
  animation-name: fa-beat-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-flip {
  animation-name: fa-flip;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-shake {
  animation-name: fa-shake;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin {
  animation-name: fa-spin;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 2s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin-reverse {
  --fa-animation-direction: reverse;
}

.fa-pulse,
.fa-spin-pulse {
  animation-name: fa-spin;
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, steps(8));
}

@media (prefers-reduced-motion: reduce) {
  .fa-beat,
.fa-bounce,
.fa-fade,
.fa-beat-fade,
.fa-flip,
.fa-pulse,
.fa-shake,
.fa-spin,
.fa-spin-pulse {
    animation-delay: -1ms;
    animation-duration: 1ms;
    animation-iteration-count: 1;
    transition-delay: 0s;
    transition-duration: 0s;
  }
}
@keyframes fa-beat {
  0%, 90% {
    transform: scale(1);
  }
  45% {
    transform: scale(var(--fa-beat-scale, 1.25));
  }
}
@keyframes fa-bounce {
  0% {
    transform: scale(1, 1) translateY(0);
  }
  10% {
    transform: scale(var(--fa-bounce-start-scale-x, 1.1), var(--fa-bounce-start-scale-y, 0.9)) translateY(0);
  }
  30% {
    transform: scale(var(--fa-bounce-jump-scale-x, 0.9), var(--fa-bounce-jump-scale-y, 1.1)) translateY(var(--fa-bounce-height, -0.5em));
  }
  50% {
    transform: scale(var(--fa-bounce-land-scale-x, 1.05), var(--fa-bounce-land-scale-y, 0.95)) translateY(0);
  }
  57% {
    transform: scale(1, 1) translateY(var(--fa-bounce-rebound, -0.125em));
  }
  64% {
    transform: scale(1, 1) translateY(0);
  }
  100% {
    transform: scale(1, 1) translateY(0);
  }
}
@keyframes fa-fade {
  50% {
    opacity: var(--fa-fade-opacity, 0.4);
  }
}
@keyframes fa-beat-fade {
  0%, 100% {
    opacity: var(--fa-beat-fade-opacity, 0.4);
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(var(--fa-beat-fade-scale, 1.125));
  }
}
@keyframes fa-flip {
  50% {
    transform: rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), var(--fa-flip-angle, -180deg));
  }
}
@keyframes fa-shake {
  0% {
    transform: rotate(-15deg);
  }
  4% {
    transform: rotate(15deg);
  }
  8%, 24% {
    transform: rotate(-18deg);
  }
  12%, 28% {
    transform: rotate(18deg);
  }
  16% {
    transform: rotate(-22deg);
  }
  20% {
    transform: rotate(22deg);
  }
  32% {
    transform: rotate(-12deg);
  }
  36% {
    transform: rotate(12deg);
  }
  40%, 100% {
    transform: rotate(0deg);
  }
}
@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.fa-rotate-90 {
  transform: rotate(90deg);
}

.fa-rotate-180 {
  transform: rotate(180deg);
}

.fa-rotate-270 {
  transform: rotate(270deg);
}

.fa-flip-horizontal {
  transform: scale(-1, 1);
}

.fa-flip-vertical {
  transform: scale(1, -1);
}

.fa-flip-both,
.fa-flip-horizontal.fa-flip-vertical {
  transform: scale(-1, -1);
}

.fa-rotate-by {
  transform: rotate(var(--fa-rotate-angle, 0));
}

.fa-stack {
  display: inline-block;
  vertical-align: middle;
  height: 2em;
  position: relative;
  width: 2.5em;
}

.fa-stack-1x,
.fa-stack-2x {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
  z-index: var(--fa-stack-z-index, auto);
}

.svg-inline--fa.fa-stack-1x {
  height: 1em;
  width: 1.25em;
}
.svg-inline--fa.fa-stack-2x {
  height: 2em;
  width: 2.5em;
}

.fa-inverse {
  color: var(--fa-inverse, #fff);
}

.sr-only,
.fa-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:not(:focus),
.fa-sr-only-focusable:not(:focus) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.svg-inline--fa .fa-primary {
  fill: var(--fa-primary-color, currentColor);
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa .fa-secondary {
  fill: var(--fa-secondary-color, currentColor);
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-primary {
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-secondary {
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa mask .fa-primary,
.svg-inline--fa mask .fa-secondary {
  fill: black;
}`;
function lx() {
  const e = tx, t = nx, n = ae.cssPrefix, r = ae.replacementClass;
  let o = kT;
  if (n !== e || r !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return o;
}
let Ph = !1;
function ql() {
  ae.autoAddCss && !Ph && (bT(lx()), Ph = !0);
}
var ET = {
  mixout() {
    return {
      dom: {
        css: lx,
        insertCss: ql
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        ql();
      },
      beforeI2svg() {
        ql();
      }
    };
  }
};
const hn = Jn || {};
hn[gn] || (hn[gn] = {});
hn[gn].styles || (hn[gn].styles = {});
hn[gn].hooks || (hn[gn].hooks = {});
hn[gn].shims || (hn[gn].shims = []);
var Xt = hn[gn];
const cx = [], ux = function() {
  Ue.removeEventListener("DOMContentLoaded", ux), Gi = 1, cx.map((e) => e());
};
let Gi = !1;
xn && (Gi = (Ue.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(Ue.readyState), Gi || Ue.addEventListener("DOMContentLoaded", ux));
function OT(e) {
  xn && (Gi ? setTimeout(e, 0) : cx.push(e));
}
function Da(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? sx(e) : "<".concat(t, " ").concat(vT(n), ">").concat(r.map(Da).join(""), "</").concat(t, ">");
}
function Ah(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var Kl = function(e, t, n, r) {
  var o = Object.keys(e), a = o.length, i = t, s, l, c;
  for (n === void 0 ? (s = 1, c = e[o[0]]) : (s = 0, c = n); s < a; s++)
    l = o[s], c = i(c, e[l], l, e);
  return c;
};
function ST(e) {
  const t = [];
  let n = 0;
  const r = e.length;
  for (; n < r; ) {
    const o = e.charCodeAt(n++);
    if (o >= 55296 && o <= 56319 && n < r) {
      const a = e.charCodeAt(n++);
      (a & 64512) == 56320 ? t.push(((o & 1023) << 10) + (a & 1023) + 65536) : (t.push(o), n--);
    } else
      t.push(o);
  }
  return t;
}
function fx(e) {
  const t = ST(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function PT(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), o;
  return r >= 55296 && r <= 56319 && n > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (r - 55296) * 1024 + o - 56320 + 65536 : r;
}
function Ch(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function Bu(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, o = Ch(t);
  typeof Xt.hooks.addPack == "function" && !r ? Xt.hooks.addPack(e, Ch(t)) : Xt.styles[e] = K(K({}, Xt.styles[e] || {}), o), e === "fas" && Bu("fa", t);
}
const {
  styles: Oa,
  shims: AT
} = Xt, dx = Object.keys(Cd), CT = dx.reduce((e, t) => (e[t] = Object.keys(Cd[t]), e), {});
let Id = null, px = {}, mx = {}, gx = {}, hx = {}, bx = {};
function $T(e) {
  return ~pT.indexOf(e);
}
function NT(e, t) {
  const n = t.split("-"), r = n[0], o = n.slice(1).join("-");
  return r === e && o !== "" && !$T(o) ? o : null;
}
const yx = () => {
  const e = (r) => Kl(Oa, (o, a, i) => (o[i] = Kl(a, r, {}), o), {});
  px = e((r, o, a) => (o[3] && (r[o[3]] = a), o[2] && o[2].filter((i) => typeof i == "number").forEach((i) => {
    r[i.toString(16)] = a;
  }), r)), mx = e((r, o, a) => (r[a] = a, o[2] && o[2].filter((i) => typeof i == "string").forEach((i) => {
    r[i] = a;
  }), r)), bx = e((r, o, a) => {
    const i = o[2];
    return r[a] = a, i.forEach((s) => {
      r[s] = a;
    }), r;
  });
  const t = "far" in Oa || ae.autoFetchSvg, n = Kl(AT, (r, o) => {
    const a = o[0];
    let i = o[1];
    const s = o[2];
    return i === "far" && !t && (i = "fas"), typeof a == "string" && (r.names[a] = {
      prefix: i,
      iconName: s
    }), typeof a == "number" && (r.unicodes[a.toString(16)] = {
      prefix: i,
      iconName: s
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  gx = n.names, hx = n.unicodes, Id = Ms(ae.styleDefault, {
    family: ae.familyDefault
  });
};
hT((e) => {
  Id = Ms(e.styleDefault, {
    family: ae.familyDefault
  });
});
yx();
function Td(e, t) {
  return (px[e] || {})[t];
}
function IT(e, t) {
  return (mx[e] || {})[t];
}
function lr(e, t) {
  return (bx[e] || {})[t];
}
function vx(e) {
  return gx[e] || {
    prefix: null,
    iconName: null
  };
}
function TT(e) {
  const t = hx[e], n = Td("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Zn() {
  return Id;
}
const xx = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function MT(e) {
  let t = at;
  const n = dx.reduce((r, o) => (r[o] = "".concat(ae.cssPrefix, "-").concat(o), r), {});
  return Z0.forEach((r) => {
    (e.includes(n[r]) || e.some((o) => CT[r].includes(o))) && (t = r);
  }), t;
}
function Ms(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = at
  } = t, r = lT[n][e];
  if (n === Is && !e)
    return "fad";
  const o = Sh[n][e] || Sh[n][r], a = e in Xt.styles ? e : null;
  return o || a || null;
}
function RT(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const o = NT(ae.cssPrefix, r);
    o ? n = o : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function $h(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function Rs(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const o = zu.concat(XI), a = $h(e.filter((f) => o.includes(f))), i = $h(e.filter((f) => !zu.includes(f))), s = a.filter((f) => (r = f, !J0.includes(f))), [l = null] = s, c = MT(a), u = K(K({}, RT(i)), {}, {
    prefix: Ms(l, {
      family: c
    })
  });
  return K(K(K({}, u), LT({
    values: e,
    family: c,
    styles: Oa,
    config: ae,
    canonical: u,
    givenPrefix: r
  })), jT(n, r, u));
}
function jT(e, t, n) {
  let {
    prefix: r,
    iconName: o
  } = n;
  if (e || !r || !o)
    return {
      prefix: r,
      iconName: o
    };
  const a = t === "fa" ? vx(o) : {}, i = lr(r, o);
  return o = a.iconName || i || o, r = a.prefix || r, r === "far" && !Oa.far && Oa.fas && !ae.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: o
  };
}
const _T = Z0.filter((e) => e !== at || e !== Is), FT = Object.keys(Du).filter((e) => e !== at).map((e) => Object.keys(Du[e])).flat();
function LT(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: o = "",
    styles: a = {},
    config: i = {}
  } = e, s = n === Is, l = t.includes("fa-duotone") || t.includes("fad"), c = i.familyDefault === "duotone", u = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (l || c || u) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && _T.includes(n) && (Object.keys(a).find((f) => FT.includes(f)) || i.autoFetchSvg)) {
    const f = VI.get(n).defaultShortPrefixId;
    r.prefix = f, r.iconName = lr(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || o === "fa") && (r.prefix = Zn() || "fas"), r;
}
class DT {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const o = n.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = K(K({}, this.definitions[a] || {}), o[a]), Bu(a, o[a]);
      const i = Cd[at][a];
      i && Bu(i, o[a]), yx();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, n) {
    const r = n.prefix && n.iconName && n.icon ? {
      0: n
    } : n;
    return Object.keys(r).map((o) => {
      const {
        prefix: a,
        iconName: i,
        icon: s
      } = r[o], l = s[2];
      t[a] || (t[a] = {}), l.length > 0 && l.forEach((c) => {
        typeof c == "string" && (t[a][c] = s);
      }), t[a][i] = s;
    }), t;
  }
}
let Nh = [], zr = {};
const Qr = {}, zT = Object.keys(Qr);
function WT(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return Nh = e, zr = {}, Object.keys(Qr).forEach((r) => {
    zT.indexOf(r) === -1 && delete Qr[r];
  }), Nh.forEach((r) => {
    const o = r.mixout ? r.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (n[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((i) => {
        n[a] || (n[a] = {}), n[a][i] = o[a][i];
      });
    }), r.hooks) {
      const a = r.hooks();
      Object.keys(a).forEach((i) => {
        zr[i] || (zr[i] = []), zr[i].push(a[i]);
      });
    }
    r.provides && r.provides(Qr);
  }), n;
}
function Gu(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), o = 2; o < n; o++)
    r[o - 2] = arguments[o];
  return (zr[e] || []).forEach((a) => {
    t = a.apply(null, [t, ...r]);
  }), t;
}
function Er(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (zr[e] || []).forEach((o) => {
    o.apply(null, n);
  });
}
function er() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Qr[e] ? Qr[e].apply(null, t) : void 0;
}
function qu(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || Zn();
  if (t)
    return t = lr(n, t) || t, Ah(wx.definitions, n, t) || Ah(Xt.styles, n, t);
}
const wx = new DT(), VT = () => {
  ae.autoReplaceSvg = !1, ae.observeMutations = !1, Er("noAuto");
}, HT = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return xn ? (Er("beforeI2svg", e), er("pseudoElements2svg", e), er("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    ae.autoReplaceSvg === !1 && (ae.autoReplaceSvg = !0), ae.observeMutations = !0, OT(() => {
      YT({
        autoReplaceSvgRoot: t
      }), Er("watch", e);
    });
  }
}, UT = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: lr(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = Ms(e[0]);
      return {
        prefix: n,
        iconName: lr(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(ae.cssPrefix, "-")) > -1 || e.match(cT))) {
      const t = Rs(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Zn(),
        iconName: lr(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Zn();
      return {
        prefix: t,
        iconName: lr(t, e) || e
      };
    }
  }
}, vt = {
  noAuto: VT,
  config: ae,
  dom: HT,
  parse: UT,
  library: wx,
  findIconDefinition: qu,
  toHtml: Da
}, YT = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = Ue
  } = e;
  (Object.keys(Xt.styles).length > 0 || ae.autoFetchSvg) && xn && ae.autoReplaceSvg && vt.dom.i2svg({
    node: t
  });
};
function js(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => Da(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!xn) return;
      const n = Ue.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function BT(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: o,
    styles: a,
    transform: i
  } = e;
  if (Nd(i) && n.found && !r.found) {
    const {
      width: s,
      height: l
    } = n, c = {
      x: s / l / 2,
      y: 0.5
    };
    o.style = Ts(K(K({}, a), {}, {
      "transform-origin": "".concat(c.x + i.x / 16, "em ").concat(c.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function GT(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: o,
    symbol: a
  } = e;
  const i = a === !0 ? "".concat(t, "-").concat(ae.cssPrefix, "-").concat(n) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: K(K({}, o), {}, {
        id: i
      }),
      children: r
    }]
  }];
}
function Md(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: o,
    transform: a,
    symbol: i,
    title: s,
    maskId: l,
    titleId: c,
    extra: u,
    watchable: f = !1
  } = e, {
    width: d,
    height: p
  } = n.found ? n : t, b = GI.includes(r), m = [ae.replacementClass, o ? "".concat(ae.cssPrefix, "-").concat(o) : ""].filter((h) => u.classes.indexOf(h) === -1).filter((h) => h !== "" || !!h).concat(u.classes).join(" ");
  let g = {
    children: [],
    attributes: K(K({}, u.attributes), {}, {
      "data-prefix": r,
      "data-icon": o,
      class: m,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(d, " ").concat(p)
    })
  };
  const v = b && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(d / p * 16 * 0.0625, "em")
  } : {};
  f && (g.attributes[kr] = ""), s && (g.children.push({
    tag: "title",
    attributes: {
      id: g.attributes["aria-labelledby"] || "title-".concat(c || Ea())
    },
    children: [s]
  }), delete g.attributes.title);
  const k = K(K({}, g), {}, {
    prefix: r,
    iconName: o,
    main: t,
    mask: n,
    maskId: l,
    transform: a,
    symbol: i,
    styles: K(K({}, v), u.styles)
  }), {
    children: x,
    attributes: O
  } = n.found && t.found ? er("generateAbstractMask", k) || {
    children: [],
    attributes: {}
  } : er("generateAbstractIcon", k) || {
    children: [],
    attributes: {}
  };
  return k.children = x, k.attributes = O, i ? GT(k) : BT(k);
}
function Ih(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: o,
    title: a,
    extra: i,
    watchable: s = !1
  } = e, l = K(K(K({}, i.attributes), a ? {
    title: a
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (l[kr] = "");
  const c = K({}, i.styles);
  Nd(o) && (c.transform = wT({
    transform: o,
    startCentered: !0,
    width: n,
    height: r
  }), c["-webkit-transform"] = c.transform);
  const u = Ts(c);
  u.length > 0 && (l.style = u);
  const f = [];
  return f.push({
    tag: "span",
    attributes: l,
    children: [t]
  }), a && f.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [a]
  }), f;
}
function qT(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, o = K(K(K({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), a = Ts(r.styles);
  a.length > 0 && (o.style = a);
  const i = [];
  return i.push({
    tag: "span",
    attributes: o,
    children: [t]
  }), n && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [n]
  }), i;
}
const {
  styles: Xl
} = Xt;
function Ku(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let o = null;
  return Array.isArray(r) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(ae.cssPrefix, "-").concat(Gl.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(ae.cssPrefix, "-").concat(Gl.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(ae.cssPrefix, "-").concat(Gl.PRIMARY),
        fill: "currentColor",
        d: r[1]
      }
    }]
  } : o = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: r
    }
  }, {
    found: !0,
    width: t,
    height: n,
    icon: o
  };
}
const KT = {
  found: !1,
  width: 512,
  height: 512
};
function XT(e, t) {
  !rx && !ae.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Xu(e, t) {
  let n = t;
  return t === "fa" && ae.styleDefault !== null && (t = Zn()), new Promise((r, o) => {
    if (n === "fa") {
      const a = vx(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && Xl[t] && Xl[t][e]) {
      const a = Xl[t][e];
      return r(Ku(a));
    }
    XT(e, t), r(K(K({}, KT), {}, {
      icon: ae.showMissingIcons && e ? er("missingIconAbstract") || {} : {}
    }));
  });
}
const Th = () => {
}, Qu = ae.measurePerformance && si && si.mark && si.measure ? si : {
  mark: Th,
  measure: Th
}, zo = 'FA "6.7.2"', QT = (e) => (Qu.mark("".concat(zo, " ").concat(e, " begins")), () => kx(e)), kx = (e) => {
  Qu.mark("".concat(zo, " ").concat(e, " ends")), Qu.measure("".concat(zo, " ").concat(e), "".concat(zo, " ").concat(e, " begins"), "".concat(zo, " ").concat(e, " ends"));
};
var Rd = {
  begin: QT,
  end: kx
};
const wi = () => {
};
function Mh(e) {
  return typeof (e.getAttribute ? e.getAttribute(kr) : null) == "string";
}
function JT(e) {
  const t = e.getAttribute ? e.getAttribute(Pd) : null, n = e.getAttribute ? e.getAttribute(Ad) : null;
  return t && n;
}
function ZT(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(ae.replacementClass);
}
function e9() {
  return ae.autoReplaceSvg === !0 ? ki.replace : ki[ae.autoReplaceSvg] || ki.replace;
}
function t9(e) {
  return Ue.createElementNS("http://www.w3.org/2000/svg", e);
}
function n9(e) {
  return Ue.createElement(e);
}
function Ex(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? t9 : n9
  } = t;
  if (typeof e == "string")
    return Ue.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    r.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    r.appendChild(Ex(o, {
      ceFn: n
    }));
  }), r;
}
function r9(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const ki = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(Ex(n), t);
      }), t.getAttribute(kr) === null && ae.keepOriginalSource) {
        let n = Ue.createComment(r9(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~$d(t).indexOf(ae.replacementClass))
      return ki.replace(e);
    const r = new RegExp("".concat(ae.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const a = n[0].attributes.class.split(" ").reduce((i, s) => (s === ae.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = n.map((a) => Da(a)).join(`
`);
    t.setAttribute(kr, ""), t.innerHTML = o;
  }
};
function Rh(e) {
  e();
}
function Ox(e, t) {
  const n = typeof t == "function" ? t : wi;
  if (e.length === 0)
    n();
  else {
    let r = Rh;
    ae.mutateApproach === iT && (r = Jn.requestAnimationFrame || Rh), r(() => {
      const o = e9(), a = Rd.begin("mutate");
      e.map(o), a(), n();
    });
  }
}
let jd = !1;
function Sx() {
  jd = !0;
}
function Ju() {
  jd = !1;
}
let qi = null;
function jh(e) {
  if (!wh || !ae.observeMutations)
    return;
  const {
    treeCallback: t = wi,
    nodeCallback: n = wi,
    pseudoElementsCallback: r = wi,
    observeMutationsRoot: o = Ue
  } = e;
  qi = new wh((a) => {
    if (jd) return;
    const i = Zn();
    yo(a).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Mh(s.addedNodes[0]) && (ae.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && ae.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && Mh(s.target) && ~dT.indexOf(s.attributeName))
        if (s.attributeName === "class" && JT(s.target)) {
          const {
            prefix: l,
            iconName: c
          } = Rs($d(s.target));
          s.target.setAttribute(Pd, l || i), c && s.target.setAttribute(Ad, c);
        } else ZT(s.target) && n(s.target);
    });
  }), xn && qi.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function o9() {
  qi && qi.disconnect();
}
function a9(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, o) => {
    const a = o.split(":"), i = a[0], s = a.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function i9(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = Rs($d(e));
  return o.prefix || (o.prefix = Zn()), t && n && (o.prefix = t, o.iconName = n), o.iconName && o.prefix || (o.prefix && r.length > 0 && (o.iconName = IT(o.prefix, e.innerText) || Td(o.prefix, fx(e.innerText))), !o.iconName && ae.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function s9(e) {
  const t = yo(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return ae.autoA11y && (n ? t["aria-labelledby"] = "".concat(ae.replacementClass, "-title-").concat(r || Ea()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function l9() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: Kt,
    symbol: !1,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    extra: {
      classes: [],
      styles: {},
      attributes: {}
    }
  };
}
function _h(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: o
  } = i9(e), a = s9(e), i = Gu("parseNodeAttributes", {}, e);
  let s = t.styleParser ? a9(e) : [];
  return K({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: Kt,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: o,
      styles: s,
      attributes: a
    }
  }, i);
}
const {
  styles: c9
} = Xt;
function Px(e) {
  const t = ae.autoReplaceSvg === "nest" ? _h(e, {
    styleParser: !1
  }) : _h(e);
  return ~t.extra.classes.indexOf(ax) ? er("generateLayersText", e, t) : er("generateSvgReplacementMutation", e, t);
}
function u9() {
  return [...UI, ...zu];
}
function Fh(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!xn) return Promise.resolve();
  const n = Ue.documentElement.classList, r = (u) => n.add("".concat(Oh, "-").concat(u)), o = (u) => n.remove("".concat(Oh, "-").concat(u)), a = ae.autoFetchSvg ? u9() : J0.concat(Object.keys(c9));
  a.includes("fa") || a.push("fa");
  const i = [".".concat(ax, ":not([").concat(kr, "])")].concat(a.map((u) => ".".concat(u, ":not([").concat(kr, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = yo(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), o("complete");
  else
    return Promise.resolve();
  const l = Rd.begin("onTree"), c = s.reduce((u, f) => {
    try {
      const d = Px(f);
      d && u.push(d);
    } catch (d) {
      rx || d.name === "MissingIcon" && console.error(d);
    }
    return u;
  }, []);
  return new Promise((u, f) => {
    Promise.all(c).then((d) => {
      Ox(d, () => {
        r("active"), r("complete"), o("pending"), typeof t == "function" && t(), l(), u();
      });
    }).catch((d) => {
      l(), f(d);
    });
  });
}
function f9(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  Px(e).then((n) => {
    n && Ox([n], t);
  });
}
function d9(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : qu(t || {});
    let {
      mask: o
    } = n;
    return o && (o = (o || {}).icon ? o : qu(o || {})), e(r, K(K({}, n), {}, {
      mask: o
    }));
  };
}
const p9 = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = Kt,
    symbol: r = !1,
    mask: o = null,
    maskId: a = null,
    title: i = null,
    titleId: s = null,
    classes: l = [],
    attributes: c = {},
    styles: u = {}
  } = t;
  if (!e) return;
  const {
    prefix: f,
    iconName: d,
    icon: p
  } = e;
  return js(K({
    type: "icon"
  }, e), () => (Er("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), ae.autoA11y && (i ? c["aria-labelledby"] = "".concat(ae.replacementClass, "-title-").concat(s || Ea()) : (c["aria-hidden"] = "true", c.focusable = "false")), Md({
    icons: {
      main: Ku(p),
      mask: o ? Ku(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: f,
    iconName: d,
    transform: K(K({}, Kt), n),
    symbol: r,
    title: i,
    maskId: a,
    titleId: s,
    extra: {
      attributes: c,
      styles: u,
      classes: l
    }
  })));
};
var m9 = {
  mixout() {
    return {
      icon: d9(p9)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Fh, e.nodeCallback = f9, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = Ue,
        callback: r = () => {
        }
      } = t;
      return Fh(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: o,
        titleId: a,
        prefix: i,
        transform: s,
        symbol: l,
        mask: c,
        maskId: u,
        extra: f
      } = n;
      return new Promise((d, p) => {
        Promise.all([Xu(r, i), c.iconName ? Xu(c.iconName, c.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((b) => {
          let [m, g] = b;
          d([t, Md({
            icons: {
              main: m,
              mask: g
            },
            prefix: i,
            iconName: r,
            transform: s,
            symbol: l,
            maskId: u,
            title: o,
            titleId: a,
            extra: f,
            watchable: !0
          })]);
        }).catch(p);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: o,
        transform: a,
        styles: i
      } = t;
      const s = Ts(i);
      s.length > 0 && (r.style = s);
      let l;
      return Nd(a) && (l = er("generateAbstractTransformGrouping", {
        main: o,
        transform: a,
        containerWidth: o.width,
        iconWidth: o.width
      })), n.push(l || o.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, g9 = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return js({
          type: "layer"
        }, () => {
          Er("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let r = [];
          return e((o) => {
            Array.isArray(o) ? o.map((a) => {
              r = r.concat(a.abstract);
            }) : r = r.concat(o.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(ae.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, h9 = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: n = null,
          classes: r = [],
          attributes: o = {},
          styles: a = {}
        } = t;
        return js({
          type: "counter",
          content: e
        }, () => (Er("beforeDOMElementCreation", {
          content: e,
          params: t
        }), qT({
          content: e.toString(),
          title: n,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(ae.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, b9 = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = Kt,
          title: r = null,
          classes: o = [],
          attributes: a = {},
          styles: i = {}
        } = t;
        return js({
          type: "text",
          content: e
        }, () => (Er("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Ih({
          content: e,
          transform: K(K({}, Kt), n),
          title: r,
          extra: {
            attributes: a,
            styles: i,
            classes: ["".concat(ae.cssPrefix, "-layers-text"), ...o]
          }
        })));
      }
    };
  },
  provides(e) {
    e.generateLayersText = function(t, n) {
      const {
        title: r,
        transform: o,
        extra: a
      } = n;
      let i = null, s = null;
      if (X0) {
        const l = parseInt(getComputedStyle(t).fontSize, 10), c = t.getBoundingClientRect();
        i = c.width / l, s = c.height / l;
      }
      return ae.autoA11y && !r && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, Ih({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: o,
        title: r,
        extra: a,
        watchable: !0
      })]);
    };
  }
};
const y9 = new RegExp('"', "ug"), Lh = [1105920, 1112319], Dh = K(K(K(K({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), WI), oT), QI), Zu = Object.keys(Dh).reduce((e, t) => (e[t.toLowerCase()] = Dh[t], e), {}), v9 = Object.keys(Zu).reduce((e, t) => {
  const n = Zu[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function x9(e) {
  const t = e.replace(y9, ""), n = PT(t, 0), r = n >= Lh[0] && n <= Lh[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: fx(o ? t[0] : t),
    isSecondary: r || o
  };
}
function w9(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), o = isNaN(r) ? "normal" : r;
  return (Zu[n] || {})[o] || v9[n];
}
function zh(e, t) {
  const n = "".concat(aT).concat(t.replace(":", "-"));
  return new Promise((r, o) => {
    if (e.getAttribute(n) !== null)
      return r();
    const a = yo(e.children).filter((f) => f.getAttribute(Vu) === t)[0], i = Jn.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), l = s.match(uT), c = i.getPropertyValue("font-weight"), u = i.getPropertyValue("content");
    if (a && !l)
      return e.removeChild(a), r();
    if (l && u !== "none" && u !== "") {
      const f = i.getPropertyValue("content");
      let d = w9(s, c);
      const {
        value: p,
        isSecondary: b
      } = x9(f), m = l[0].startsWith("FontAwesome");
      let g = Td(d, p), v = g;
      if (m) {
        const k = TT(p);
        k.iconName && k.prefix && (g = k.iconName, d = k.prefix);
      }
      if (g && !b && (!a || a.getAttribute(Pd) !== d || a.getAttribute(Ad) !== v)) {
        e.setAttribute(n, v), a && e.removeChild(a);
        const k = l9(), {
          extra: x
        } = k;
        x.attributes[Vu] = t, Xu(g, d).then((O) => {
          const h = Md(K(K({}, k), {}, {
            icons: {
              main: O,
              mask: xx()
            },
            prefix: d,
            iconName: v,
            extra: x,
            watchable: !0
          })), L = Ue.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(L, e.firstChild) : e.appendChild(L), L.outerHTML = h.map((_) => Da(_)).join(`
`), e.removeAttribute(n), r();
        }).catch(o);
      } else
        r();
    } else
      r();
  });
}
function k9(e) {
  return Promise.all([zh(e, "::before"), zh(e, "::after")]);
}
function E9(e) {
  return e.parentNode !== document.head && !~sT.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Vu) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Wh(e) {
  if (xn)
    return new Promise((t, n) => {
      const r = yo(e.querySelectorAll("*")).filter(E9).map(k9), o = Rd.begin("searchPseudoElements");
      Sx(), Promise.all(r).then(() => {
        o(), Ju(), t();
      }).catch(() => {
        o(), Ju(), n();
      });
    });
}
var O9 = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Wh, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = Ue
      } = t;
      ae.searchPseudoElements && Wh(n);
    };
  }
};
let Vh = !1;
var S9 = {
  mixout() {
    return {
      dom: {
        unwatch() {
          Sx(), Vh = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        jh(Gu("mutationObserverCallbacks", {}));
      },
      noAuto() {
        o9();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Vh ? Ju() : jh(Gu("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Hh = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((n, r) => {
    const o = r.toLowerCase().split("-"), a = o[0];
    let i = o.slice(1).join("-");
    if (a && i === "h")
      return n.flipX = !0, n;
    if (a && i === "v")
      return n.flipY = !0, n;
    if (i = parseFloat(i), isNaN(i))
      return n;
    switch (a) {
      case "grow":
        n.size = n.size + i;
        break;
      case "shrink":
        n.size = n.size - i;
        break;
      case "left":
        n.x = n.x - i;
        break;
      case "right":
        n.x = n.x + i;
        break;
      case "up":
        n.y = n.y - i;
        break;
      case "down":
        n.y = n.y + i;
        break;
      case "rotate":
        n.rotate = n.rotate + i;
        break;
    }
    return n;
  }, t);
};
var P9 = {
  mixout() {
    return {
      parse: {
        transform: (e) => Hh(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = Hh(n)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: n,
        transform: r,
        containerWidth: o,
        iconWidth: a
      } = t;
      const i = {
        transform: "translate(".concat(o / 2, " 256)")
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), l = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), c = "rotate(".concat(r.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(l, " ").concat(c)
      }, f = {
        transform: "translate(".concat(a / 2 * -1, " -256)")
      }, d = {
        outer: i,
        inner: u,
        path: f
      };
      return {
        tag: "g",
        attributes: K({}, d.outer),
        children: [{
          tag: "g",
          attributes: K({}, d.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: K(K({}, n.icon.attributes), d.path)
          }]
        }]
      };
    };
  }
};
const Ql = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Uh(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function A9(e) {
  return e.tag === "g" ? e.children : [e];
}
var C9 = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? Rs(n.split(" ").map((o) => o.trim())) : xx();
        return r.prefix || (r.prefix = Zn()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: n,
        attributes: r,
        main: o,
        mask: a,
        maskId: i,
        transform: s
      } = t;
      const {
        width: l,
        icon: c
      } = o, {
        width: u,
        icon: f
      } = a, d = xT({
        transform: s,
        containerWidth: u,
        iconWidth: l
      }), p = {
        tag: "rect",
        attributes: K(K({}, Ql), {}, {
          fill: "white"
        })
      }, b = c.children ? {
        children: c.children.map(Uh)
      } : {}, m = {
        tag: "g",
        attributes: K({}, d.inner),
        children: [Uh(K({
          tag: c.tag,
          attributes: K(K({}, c.attributes), d.path)
        }, b))]
      }, g = {
        tag: "g",
        attributes: K({}, d.outer),
        children: [m]
      }, v = "mask-".concat(i || Ea()), k = "clip-".concat(i || Ea()), x = {
        tag: "mask",
        attributes: K(K({}, Ql), {}, {
          id: v,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [p, g]
      }, O = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: k
          },
          children: A9(f)
        }, x]
      };
      return n.push(O, {
        tag: "rect",
        attributes: K({
          fill: "currentColor",
          "clip-path": "url(#".concat(k, ")"),
          mask: "url(#".concat(v, ")")
        }, Ql)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, $9 = {
  provides(e) {
    let t = !1;
    Jn.matchMedia && (t = Jn.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: K(K({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = K(K({}, o), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: K(K({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: K(K({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: K(K({}, a), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(i), n.push({
        tag: "path",
        attributes: K(K({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: K(K({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: K(K({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: K(K({}, a), {}, {
            values: "0;0;1;1;0;0;"
          })
        }]
      }), {
        tag: "g",
        attributes: {
          class: "missing"
        },
        children: n
      };
    };
  }
}, N9 = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, I9 = [ET, m9, g9, h9, b9, O9, S9, P9, C9, $9, N9];
WT(I9, {
  mixoutsTo: vt
});
vt.noAuto;
vt.config;
vt.library;
vt.dom;
const ef = vt.parse;
vt.findIconDefinition;
vt.toHtml;
const T9 = vt.icon;
vt.layer;
vt.text;
vt.counter;
function M9(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var ci = { exports: {} }, Jl = { exports: {} }, Ce = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Yh;
function R9() {
  if (Yh) return Ce;
  Yh = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, b = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, g = e ? Symbol.for("react.fundamental") : 60117, v = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
  function x(h) {
    if (typeof h == "object" && h !== null) {
      var L = h.$$typeof;
      switch (L) {
        case t:
          switch (h = h.type, h) {
            case l:
            case c:
            case r:
            case a:
            case o:
            case f:
              return h;
            default:
              switch (h = h && h.$$typeof, h) {
                case s:
                case u:
                case b:
                case p:
                case i:
                  return h;
                default:
                  return L;
              }
          }
        case n:
          return L;
      }
    }
  }
  function O(h) {
    return x(h) === c;
  }
  return Ce.AsyncMode = l, Ce.ConcurrentMode = c, Ce.ContextConsumer = s, Ce.ContextProvider = i, Ce.Element = t, Ce.ForwardRef = u, Ce.Fragment = r, Ce.Lazy = b, Ce.Memo = p, Ce.Portal = n, Ce.Profiler = a, Ce.StrictMode = o, Ce.Suspense = f, Ce.isAsyncMode = function(h) {
    return O(h) || x(h) === l;
  }, Ce.isConcurrentMode = O, Ce.isContextConsumer = function(h) {
    return x(h) === s;
  }, Ce.isContextProvider = function(h) {
    return x(h) === i;
  }, Ce.isElement = function(h) {
    return typeof h == "object" && h !== null && h.$$typeof === t;
  }, Ce.isForwardRef = function(h) {
    return x(h) === u;
  }, Ce.isFragment = function(h) {
    return x(h) === r;
  }, Ce.isLazy = function(h) {
    return x(h) === b;
  }, Ce.isMemo = function(h) {
    return x(h) === p;
  }, Ce.isPortal = function(h) {
    return x(h) === n;
  }, Ce.isProfiler = function(h) {
    return x(h) === a;
  }, Ce.isStrictMode = function(h) {
    return x(h) === o;
  }, Ce.isSuspense = function(h) {
    return x(h) === f;
  }, Ce.isValidElementType = function(h) {
    return typeof h == "string" || typeof h == "function" || h === r || h === c || h === a || h === o || h === f || h === d || typeof h == "object" && h !== null && (h.$$typeof === b || h.$$typeof === p || h.$$typeof === i || h.$$typeof === s || h.$$typeof === u || h.$$typeof === g || h.$$typeof === v || h.$$typeof === k || h.$$typeof === m);
  }, Ce.typeOf = x, Ce;
}
var Te = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Bh;
function j9() {
  return Bh || (Bh = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, b = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, g = e ? Symbol.for("react.fundamental") : 60117, v = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
    function x(E) {
      return typeof E == "string" || typeof E == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      E === r || E === c || E === a || E === o || E === f || E === d || typeof E == "object" && E !== null && (E.$$typeof === b || E.$$typeof === p || E.$$typeof === i || E.$$typeof === s || E.$$typeof === u || E.$$typeof === g || E.$$typeof === v || E.$$typeof === k || E.$$typeof === m);
    }
    function O(E) {
      if (typeof E == "object" && E !== null) {
        var ue = E.$$typeof;
        switch (ue) {
          case t:
            var Me = E.type;
            switch (Me) {
              case l:
              case c:
              case r:
              case a:
              case o:
              case f:
                return Me;
              default:
                var it = Me && Me.$$typeof;
                switch (it) {
                  case s:
                  case u:
                  case b:
                  case p:
                  case i:
                    return it;
                  default:
                    return ue;
                }
            }
          case n:
            return ue;
        }
      }
    }
    var h = l, L = c, _ = s, H = i, J = t, Z = u, U = r, T = b, te = p, W = n, j = a, D = o, Q = f, V = !1;
    function z(E) {
      return V || (V = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), y(E) || O(E) === l;
    }
    function y(E) {
      return O(E) === c;
    }
    function w(E) {
      return O(E) === s;
    }
    function C(E) {
      return O(E) === i;
    }
    function A(E) {
      return typeof E == "object" && E !== null && E.$$typeof === t;
    }
    function P(E) {
      return O(E) === u;
    }
    function I(E) {
      return O(E) === r;
    }
    function N(E) {
      return O(E) === b;
    }
    function $(E) {
      return O(E) === p;
    }
    function R(E) {
      return O(E) === n;
    }
    function M(E) {
      return O(E) === a;
    }
    function F(E) {
      return O(E) === o;
    }
    function ee(E) {
      return O(E) === f;
    }
    Te.AsyncMode = h, Te.ConcurrentMode = L, Te.ContextConsumer = _, Te.ContextProvider = H, Te.Element = J, Te.ForwardRef = Z, Te.Fragment = U, Te.Lazy = T, Te.Memo = te, Te.Portal = W, Te.Profiler = j, Te.StrictMode = D, Te.Suspense = Q, Te.isAsyncMode = z, Te.isConcurrentMode = y, Te.isContextConsumer = w, Te.isContextProvider = C, Te.isElement = A, Te.isForwardRef = P, Te.isFragment = I, Te.isLazy = N, Te.isMemo = $, Te.isPortal = R, Te.isProfiler = M, Te.isStrictMode = F, Te.isSuspense = ee, Te.isValidElementType = x, Te.typeOf = O;
  }()), Te;
}
var Gh;
function Ax() {
  return Gh || (Gh = 1, process.env.NODE_ENV === "production" ? Jl.exports = R9() : Jl.exports = j9()), Jl.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Zl, qh;
function _9() {
  if (qh) return Zl;
  qh = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, n = Object.prototype.propertyIsEnumerable;
  function r(a) {
    if (a == null)
      throw new TypeError("Object.assign cannot be called with null or undefined");
    return Object(a);
  }
  function o() {
    try {
      if (!Object.assign)
        return !1;
      var a = new String("abc");
      if (a[5] = "de", Object.getOwnPropertyNames(a)[0] === "5")
        return !1;
      for (var i = {}, s = 0; s < 10; s++)
        i["_" + String.fromCharCode(s)] = s;
      var l = Object.getOwnPropertyNames(i).map(function(u) {
        return i[u];
      });
      if (l.join("") !== "0123456789")
        return !1;
      var c = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(u) {
        c[u] = u;
      }), Object.keys(Object.assign({}, c)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Zl = o() ? Object.assign : function(a, i) {
    for (var s, l = r(a), c, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var f in s)
        t.call(s, f) && (l[f] = s[f]);
      if (e) {
        c = e(s);
        for (var d = 0; d < c.length; d++)
          n.call(s, c[d]) && (l[c[d]] = s[c[d]]);
      }
    }
    return l;
  }, Zl;
}
var ec, Kh;
function _d() {
  if (Kh) return ec;
  Kh = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return ec = e, ec;
}
var Xh, Qh;
function Cx() {
  return Qh || (Qh = 1, Xh = Function.call.bind(Object.prototype.hasOwnProperty)), Xh;
}
var tc, Jh;
function F9() {
  if (Jh) return tc;
  Jh = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ _d(), n = {}, r = /* @__PURE__ */ Cx();
    e = function(a) {
      var i = "Warning: " + a;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function o(a, i, s, l, c) {
    if (process.env.NODE_ENV !== "production") {
      for (var u in a)
        if (r(a, u)) {
          var f;
          try {
            if (typeof a[u] != "function") {
              var d = Error(
                (l || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw d.name = "Invariant Violation", d;
            }
            f = a[u](i, u, l, s, null, t);
          } catch (b) {
            f = b;
          }
          if (f && !(f instanceof Error) && e(
            (l || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof f + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), f instanceof Error && !(f.message in n)) {
            n[f.message] = !0;
            var p = c ? c() : "";
            e(
              "Failed " + s + " type: " + f.message + (p ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, tc = o, tc;
}
var nc, Zh;
function L9() {
  if (Zh) return nc;
  Zh = 1;
  var e = Ax(), t = _9(), n = /* @__PURE__ */ _d(), r = /* @__PURE__ */ Cx(), o = /* @__PURE__ */ F9(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(s) {
    var l = "Warning: " + s;
    typeof console < "u" && console.error(l);
    try {
      throw new Error(l);
    } catch {
    }
  });
  function i() {
    return null;
  }
  return nc = function(s, l) {
    var c = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function f(y) {
      var w = y && (c && y[c] || y[u]);
      if (typeof w == "function")
        return w;
    }
    var d = "<<anonymous>>", p = {
      array: v("array"),
      bigint: v("bigint"),
      bool: v("boolean"),
      func: v("function"),
      number: v("number"),
      object: v("object"),
      string: v("string"),
      symbol: v("symbol"),
      any: k(),
      arrayOf: x,
      element: O(),
      elementType: h(),
      instanceOf: L,
      node: Z(),
      objectOf: H,
      oneOf: _,
      oneOfType: J,
      shape: T,
      exact: te
    };
    function b(y, w) {
      return y === w ? y !== 0 || 1 / y === 1 / w : y !== y && w !== w;
    }
    function m(y, w) {
      this.message = y, this.data = w && typeof w == "object" ? w : {}, this.stack = "";
    }
    m.prototype = Error.prototype;
    function g(y) {
      if (process.env.NODE_ENV !== "production")
        var w = {}, C = 0;
      function A(I, N, $, R, M, F, ee) {
        if (R = R || d, F = F || $, ee !== n) {
          if (l) {
            var E = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw E.name = "Invariant Violation", E;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ue = R + ":" + $;
            !w[ue] && // Avoid spamming the console because they are often not actionable except for lib authors
            C < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + F + "` prop on `" + R + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), w[ue] = !0, C++);
          }
        }
        return N[$] == null ? I ? N[$] === null ? new m("The " + M + " `" + F + "` is marked as required " + ("in `" + R + "`, but its value is `null`.")) : new m("The " + M + " `" + F + "` is marked as required in " + ("`" + R + "`, but its value is `undefined`.")) : null : y(N, $, R, M, F);
      }
      var P = A.bind(null, !1);
      return P.isRequired = A.bind(null, !0), P;
    }
    function v(y) {
      function w(C, A, P, I, N, $) {
        var R = C[A], M = D(R);
        if (M !== y) {
          var F = Q(R);
          return new m(
            "Invalid " + I + " `" + N + "` of type " + ("`" + F + "` supplied to `" + P + "`, expected ") + ("`" + y + "`."),
            { expectedType: y }
          );
        }
        return null;
      }
      return g(w);
    }
    function k() {
      return g(i);
    }
    function x(y) {
      function w(C, A, P, I, N) {
        if (typeof y != "function")
          return new m("Property `" + N + "` of component `" + P + "` has invalid PropType notation inside arrayOf.");
        var $ = C[A];
        if (!Array.isArray($)) {
          var R = D($);
          return new m("Invalid " + I + " `" + N + "` of type " + ("`" + R + "` supplied to `" + P + "`, expected an array."));
        }
        for (var M = 0; M < $.length; M++) {
          var F = y($, M, P, I, N + "[" + M + "]", n);
          if (F instanceof Error)
            return F;
        }
        return null;
      }
      return g(w);
    }
    function O() {
      function y(w, C, A, P, I) {
        var N = w[C];
        if (!s(N)) {
          var $ = D(N);
          return new m("Invalid " + P + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return g(y);
    }
    function h() {
      function y(w, C, A, P, I) {
        var N = w[C];
        if (!e.isValidElementType(N)) {
          var $ = D(N);
          return new m("Invalid " + P + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return g(y);
    }
    function L(y) {
      function w(C, A, P, I, N) {
        if (!(C[A] instanceof y)) {
          var $ = y.name || d, R = z(C[A]);
          return new m("Invalid " + I + " `" + N + "` of type " + ("`" + R + "` supplied to `" + P + "`, expected ") + ("instance of `" + $ + "`."));
        }
        return null;
      }
      return g(w);
    }
    function _(y) {
      if (!Array.isArray(y))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), i;
      function w(C, A, P, I, N) {
        for (var $ = C[A], R = 0; R < y.length; R++)
          if (b($, y[R]))
            return null;
        var M = JSON.stringify(y, function(F, ee) {
          var E = Q(ee);
          return E === "symbol" ? String(ee) : ee;
        });
        return new m("Invalid " + I + " `" + N + "` of value `" + String($) + "` " + ("supplied to `" + P + "`, expected one of " + M + "."));
      }
      return g(w);
    }
    function H(y) {
      function w(C, A, P, I, N) {
        if (typeof y != "function")
          return new m("Property `" + N + "` of component `" + P + "` has invalid PropType notation inside objectOf.");
        var $ = C[A], R = D($);
        if (R !== "object")
          return new m("Invalid " + I + " `" + N + "` of type " + ("`" + R + "` supplied to `" + P + "`, expected an object."));
        for (var M in $)
          if (r($, M)) {
            var F = y($, M, P, I, N + "." + M, n);
            if (F instanceof Error)
              return F;
          }
        return null;
      }
      return g(w);
    }
    function J(y) {
      if (!Array.isArray(y))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var w = 0; w < y.length; w++) {
        var C = y[w];
        if (typeof C != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + V(C) + " at index " + w + "."
          ), i;
      }
      function A(P, I, N, $, R) {
        for (var M = [], F = 0; F < y.length; F++) {
          var ee = y[F], E = ee(P, I, N, $, R, n);
          if (E == null)
            return null;
          E.data && r(E.data, "expectedType") && M.push(E.data.expectedType);
        }
        var ue = M.length > 0 ? ", expected one of type [" + M.join(", ") + "]" : "";
        return new m("Invalid " + $ + " `" + R + "` supplied to " + ("`" + N + "`" + ue + "."));
      }
      return g(A);
    }
    function Z() {
      function y(w, C, A, P, I) {
        return W(w[C]) ? null : new m("Invalid " + P + " `" + I + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return g(y);
    }
    function U(y, w, C, A, P) {
      return new m(
        (y || "React class") + ": " + w + " type `" + C + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + P + "`."
      );
    }
    function T(y) {
      function w(C, A, P, I, N) {
        var $ = C[A], R = D($);
        if (R !== "object")
          return new m("Invalid " + I + " `" + N + "` of type `" + R + "` " + ("supplied to `" + P + "`, expected `object`."));
        for (var M in y) {
          var F = y[M];
          if (typeof F != "function")
            return U(P, I, N, M, Q(F));
          var ee = F($, M, P, I, N + "." + M, n);
          if (ee)
            return ee;
        }
        return null;
      }
      return g(w);
    }
    function te(y) {
      function w(C, A, P, I, N) {
        var $ = C[A], R = D($);
        if (R !== "object")
          return new m("Invalid " + I + " `" + N + "` of type `" + R + "` " + ("supplied to `" + P + "`, expected `object`."));
        var M = t({}, C[A], y);
        for (var F in M) {
          var ee = y[F];
          if (r(y, F) && typeof ee != "function")
            return U(P, I, N, F, Q(ee));
          if (!ee)
            return new m(
              "Invalid " + I + " `" + N + "` key `" + F + "` supplied to `" + P + "`.\nBad object: " + JSON.stringify(C[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(y), null, "  ")
            );
          var E = ee($, F, P, I, N + "." + F, n);
          if (E)
            return E;
        }
        return null;
      }
      return g(w);
    }
    function W(y) {
      switch (typeof y) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !y;
        case "object":
          if (Array.isArray(y))
            return y.every(W);
          if (y === null || s(y))
            return !0;
          var w = f(y);
          if (w) {
            var C = w.call(y), A;
            if (w !== y.entries) {
              for (; !(A = C.next()).done; )
                if (!W(A.value))
                  return !1;
            } else
              for (; !(A = C.next()).done; ) {
                var P = A.value;
                if (P && !W(P[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function j(y, w) {
      return y === "symbol" ? !0 : w ? w["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && w instanceof Symbol : !1;
    }
    function D(y) {
      var w = typeof y;
      return Array.isArray(y) ? "array" : y instanceof RegExp ? "object" : j(w, y) ? "symbol" : w;
    }
    function Q(y) {
      if (typeof y > "u" || y === null)
        return "" + y;
      var w = D(y);
      if (w === "object") {
        if (y instanceof Date)
          return "date";
        if (y instanceof RegExp)
          return "regexp";
      }
      return w;
    }
    function V(y) {
      var w = Q(y);
      switch (w) {
        case "array":
        case "object":
          return "an " + w;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + w;
        default:
          return w;
      }
    }
    function z(y) {
      return !y.constructor || !y.constructor.name ? d : y.constructor.name;
    }
    return p.checkPropTypes = o, p.resetWarningCache = o.resetWarningCache, p.PropTypes = p, p;
  }, nc;
}
var rc, eb;
function D9() {
  if (eb) return rc;
  eb = 1;
  var e = /* @__PURE__ */ _d();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, rc = function() {
    function r(i, s, l, c, u, f) {
      if (f !== e) {
        var d = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw d.name = "Invariant Violation", d;
      }
    }
    r.isRequired = r;
    function o() {
      return r;
    }
    var a = {
      array: r,
      bigint: r,
      bool: r,
      func: r,
      number: r,
      object: r,
      string: r,
      symbol: r,
      any: r,
      arrayOf: o,
      element: r,
      elementType: r,
      instanceOf: o,
      node: r,
      objectOf: o,
      oneOf: o,
      oneOfType: o,
      shape: o,
      exact: o,
      checkPropTypes: n,
      resetWarningCache: t
    };
    return a.PropTypes = a, a;
  }, rc;
}
var tb;
function z9() {
  if (tb) return ci.exports;
  if (tb = 1, process.env.NODE_ENV !== "production") {
    var e = Ax(), t = !0;
    ci.exports = /* @__PURE__ */ L9()(e.isElement, t);
  } else
    ci.exports = /* @__PURE__ */ D9()();
  return ci.exports;
}
var W9 = /* @__PURE__ */ z9();
const ve = /* @__PURE__ */ M9(W9);
function nb(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function Wt(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? nb(Object(n), !0).forEach(function(r) {
      Wr(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : nb(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Ki(e) {
  "@babel/helpers - typeof";
  return Ki = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Ki(e);
}
function Wr(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function V9(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), o, a;
  for (a = 0; a < r.length; a++)
    o = r[a], !(t.indexOf(o) >= 0) && (n[o] = e[o]);
  return n;
}
function H9(e, t) {
  if (e == null) return {};
  var n = V9(e, t), r, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      r = a[o], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function tf(e) {
  return U9(e) || Y9(e) || B9(e) || G9();
}
function U9(e) {
  if (Array.isArray(e)) return nf(e);
}
function Y9(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function B9(e, t) {
  if (e) {
    if (typeof e == "string") return nf(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return nf(e, t);
  }
}
function nf(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function G9() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function q9(e) {
  var t, n = e.beat, r = e.fade, o = e.beatFade, a = e.bounce, i = e.shake, s = e.flash, l = e.spin, c = e.spinPulse, u = e.spinReverse, f = e.pulse, d = e.fixedWidth, p = e.inverse, b = e.border, m = e.listItem, g = e.flip, v = e.size, k = e.rotation, x = e.pull, O = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": o,
    "fa-bounce": a,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": l,
    "fa-spin-reverse": u,
    "fa-spin-pulse": c,
    "fa-pulse": f,
    "fa-fw": d,
    "fa-inverse": p,
    "fa-border": b,
    "fa-li": m,
    "fa-flip": g === !0,
    "fa-flip-horizontal": g === "horizontal" || g === "both",
    "fa-flip-vertical": g === "vertical" || g === "both"
  }, Wr(t, "fa-".concat(v), typeof v < "u" && v !== null), Wr(t, "fa-rotate-".concat(k), typeof k < "u" && k !== null && k !== 0), Wr(t, "fa-pull-".concat(x), typeof x < "u" && x !== null), Wr(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(O).map(function(h) {
    return O[h] ? h : null;
  }).filter(function(h) {
    return h;
  });
}
function K9(e) {
  return e = e - 0, e === e;
}
function $x(e) {
  return K9(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var X9 = ["style"];
function Q9(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function J9(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), o = $x(n.slice(0, r)), a = n.slice(r + 1).trim();
    return o.startsWith("webkit") ? t[Q9(o)] = a : t[o] = a, t;
  }, {});
}
function Nx(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(l) {
    return Nx(e, l);
  }), o = Object.keys(t.attributes || {}).reduce(function(l, c) {
    var u = t.attributes[c];
    switch (c) {
      case "class":
        l.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        l.attrs.style = J9(u);
        break;
      default:
        c.indexOf("aria-") === 0 || c.indexOf("data-") === 0 ? l.attrs[c.toLowerCase()] = u : l.attrs[$x(c)] = u;
    }
    return l;
  }, {
    attrs: {}
  }), a = n.style, i = a === void 0 ? {} : a, s = H9(n, X9);
  return o.attrs.style = Wt(Wt({}, o.attrs.style), i), e.apply(void 0, [t.tag, Wt(Wt({}, o.attrs), s)].concat(tf(r)));
}
var Ix = !1;
try {
  Ix = process.env.NODE_ENV === "production";
} catch {
}
function Z9() {
  if (!Ix && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function rb(e) {
  if (e && Ki(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (ef.icon)
    return ef.icon(e);
  if (e === null)
    return null;
  if (e && Ki(e) === "object" && e.prefix && e.iconName)
    return e;
  if (Array.isArray(e) && e.length === 2)
    return {
      prefix: e[0],
      iconName: e[1]
    };
  if (typeof e == "string")
    return {
      prefix: "fas",
      iconName: e
    };
}
function oc(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Wr({}, e, t) : {};
}
var ob = {
  border: !1,
  className: "",
  mask: null,
  maskId: null,
  fixedWidth: !1,
  inverse: !1,
  flip: !1,
  icon: null,
  listItem: !1,
  pull: null,
  pulse: !1,
  rotation: null,
  size: null,
  spin: !1,
  spinPulse: !1,
  spinReverse: !1,
  beat: !1,
  fade: !1,
  beatFade: !1,
  bounce: !1,
  shake: !1,
  symbol: !1,
  title: "",
  titleId: null,
  transform: null,
  swapOpacity: !1
}, ct = /* @__PURE__ */ ke.forwardRef(function(e, t) {
  var n = Wt(Wt({}, ob), e), r = n.icon, o = n.mask, a = n.symbol, i = n.className, s = n.title, l = n.titleId, c = n.maskId, u = rb(r), f = oc("classes", [].concat(tf(q9(n)), tf((i || "").split(" ")))), d = oc("transform", typeof n.transform == "string" ? ef.transform(n.transform) : n.transform), p = oc("mask", rb(o)), b = T9(u, Wt(Wt(Wt(Wt({}, f), d), p), {}, {
    symbol: a,
    title: s,
    titleId: l,
    maskId: c
  }));
  if (!b)
    return Z9("Could not find icon", u), null;
  var m = b.abstract, g = {
    ref: t
  };
  return Object.keys(n).forEach(function(v) {
    ob.hasOwnProperty(v) || (g[v] = n[v]);
  }), e7(m[0], g);
});
ct.displayName = "FontAwesomeIcon";
ct.propTypes = {
  beat: ve.bool,
  border: ve.bool,
  beatFade: ve.bool,
  bounce: ve.bool,
  className: ve.string,
  fade: ve.bool,
  flash: ve.bool,
  mask: ve.oneOfType([ve.object, ve.array, ve.string]),
  maskId: ve.string,
  fixedWidth: ve.bool,
  inverse: ve.bool,
  flip: ve.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: ve.oneOfType([ve.object, ve.array, ve.string]),
  listItem: ve.bool,
  pull: ve.oneOf(["right", "left"]),
  pulse: ve.bool,
  rotation: ve.oneOf([0, 90, 180, 270]),
  shake: ve.bool,
  size: ve.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: ve.bool,
  spinPulse: ve.bool,
  spinReverse: ve.bool,
  symbol: ve.oneOfType([ve.bool, ve.string]),
  title: ve.string,
  titleId: ve.string,
  transform: ve.oneOfType([ve.string, ve.object]),
  swapOpacity: ve.bool
};
var e7 = Nx.bind(null, ke.createElement);
const Fd = "-", t7 = (e) => {
  const t = r7(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(Fd);
      return a[0] === "" && a.length !== 1 && a.shift(), Tx(a, t) || n7(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const i = n[o] || [];
      return a && r[o] ? [...i, ...r[o]] : i;
    }
  };
}, Tx = (e, t) => {
  var n;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], o = t.nextPart.get(r), a = o ? Tx(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const i = e.join(Fd);
  return (n = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : n.classGroupId;
}, ab = /^\[(.+)\]$/, n7 = (e) => {
  if (ab.test(e)) {
    const t = ab.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, r7 = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return a7(Object.entries(e.classGroups), n).forEach(([o, a]) => {
    rf(a, r, o, t);
  }), r;
}, rf = (e, t, n, r) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : ib(t, o);
      a.classGroupId = n;
      return;
    }
    if (typeof o == "function") {
      if (o7(o)) {
        rf(o(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: n
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      rf(i, ib(t, a), n, r);
    });
  });
}, ib = (e, t) => {
  let n = e;
  return t.split(Fd).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, o7 = (e) => e.isThemeGetter, a7 = (e, t) => t ? e.map(([n, r]) => {
  const o = r.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [n, o];
}) : e, i7 = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const o = (a, i) => {
    n.set(a, i), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = n.get(a);
      if (i !== void 0)
        return i;
      if ((i = r.get(a)) !== void 0)
        return o(a, i), i;
    },
    set(a, i) {
      n.has(a) ? n.set(a, i) : o(a, i);
    }
  };
}, Mx = "!", s7 = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const l = [];
    let c = 0, u = 0, f;
    for (let g = 0; g < s.length; g++) {
      let v = s[g];
      if (c === 0) {
        if (v === o && (r || s.slice(g, g + a) === t)) {
          l.push(s.slice(u, g)), u = g + a;
          continue;
        }
        if (v === "/") {
          f = g;
          continue;
        }
      }
      v === "[" ? c++ : v === "]" && c--;
    }
    const d = l.length === 0 ? s : s.substring(u), p = d.startsWith(Mx), b = p ? d.substring(1) : d, m = f && f > u ? f - u : void 0;
    return {
      modifiers: l,
      hasImportantModifier: p,
      baseClassName: b,
      maybePostfixModifierPosition: m
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, l7 = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, c7 = (e) => ({
  cache: i7(e.cacheSize),
  parseClassName: s7(e),
  ...t7(e)
}), u7 = /\s+/, f7 = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(u7);
  let s = "";
  for (let l = i.length - 1; l >= 0; l -= 1) {
    const c = i[l], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: p
    } = n(c);
    let b = !!p, m = r(b ? d.substring(0, p) : d);
    if (!m) {
      if (!b) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (m = r(d), !m) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      b = !1;
    }
    const g = l7(u).join(":"), v = f ? g + Mx : g, k = v + m;
    if (a.includes(k))
      continue;
    a.push(k);
    const x = o(m, b);
    for (let O = 0; O < x.length; ++O) {
      const h = x[O];
      a.push(v + h);
    }
    s = c + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function d7() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = Rx(t)) && (r && (r += " "), r += n);
  return r;
}
const Rx = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = Rx(e[r])) && (n && (n += " "), n += t);
  return n;
};
function p7(e, ...t) {
  let n, r, o, a = i;
  function i(l) {
    const c = t.reduce((u, f) => f(u), e());
    return n = c7(c), r = n.cache.get, o = n.cache.set, a = s, s(l);
  }
  function s(l) {
    const c = r(l);
    if (c)
      return c;
    const u = f7(l, n);
    return o(l, u), u;
  }
  return function() {
    return a(d7.apply(null, arguments));
  };
}
const De = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, jx = /^\[(?:([a-z-]+):)?(.+)\]$/i, m7 = /^\d+\/\d+$/, g7 = /* @__PURE__ */ new Set(["px", "full", "screen"]), h7 = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, b7 = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, y7 = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, v7 = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, x7 = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, on = (e) => Jr(e) || g7.has(e) || m7.test(e), Nn = (e) => vo(e, "length", C7), Jr = (e) => !!e && !Number.isNaN(Number(e)), ac = (e) => vo(e, "number", Jr), No = (e) => !!e && Number.isInteger(Number(e)), w7 = (e) => e.endsWith("%") && Jr(e.slice(0, -1)), pe = (e) => jx.test(e), In = (e) => h7.test(e), k7 = /* @__PURE__ */ new Set(["length", "size", "percentage"]), E7 = (e) => vo(e, k7, _x), O7 = (e) => vo(e, "position", _x), S7 = /* @__PURE__ */ new Set(["image", "url"]), P7 = (e) => vo(e, S7, N7), A7 = (e) => vo(e, "", $7), Io = () => !0, vo = (e, t, n) => {
  const r = jx.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, C7 = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  b7.test(e) && !y7.test(e)
), _x = () => !1, $7 = (e) => v7.test(e), N7 = (e) => x7.test(e), I7 = () => {
  const e = De("colors"), t = De("spacing"), n = De("blur"), r = De("brightness"), o = De("borderColor"), a = De("borderRadius"), i = De("borderSpacing"), s = De("borderWidth"), l = De("contrast"), c = De("grayscale"), u = De("hueRotate"), f = De("invert"), d = De("gap"), p = De("gradientColorStops"), b = De("gradientColorStopPositions"), m = De("inset"), g = De("margin"), v = De("opacity"), k = De("padding"), x = De("saturate"), O = De("scale"), h = De("sepia"), L = De("skew"), _ = De("space"), H = De("translate"), J = () => ["auto", "contain", "none"], Z = () => ["auto", "hidden", "clip", "visible", "scroll"], U = () => ["auto", pe, t], T = () => [pe, t], te = () => ["", on, Nn], W = () => ["auto", Jr, pe], j = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], D = () => ["solid", "dashed", "dotted", "double", "none"], Q = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], V = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], z = () => ["", "0", pe], y = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], w = () => [Jr, pe];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Io],
      spacing: [on, Nn],
      blur: ["none", "", In, pe],
      brightness: w(),
      borderColor: [e],
      borderRadius: ["none", "", "full", In, pe],
      borderSpacing: T(),
      borderWidth: te(),
      contrast: w(),
      grayscale: z(),
      hueRotate: w(),
      invert: z(),
      gap: T(),
      gradientColorStops: [e],
      gradientColorStopPositions: [w7, Nn],
      inset: U(),
      margin: U(),
      opacity: w(),
      padding: T(),
      saturate: w(),
      scale: w(),
      sepia: z(),
      skew: w(),
      space: T(),
      translate: T()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", pe]
      }],
      /**
       * Container
       * @see https://tailwindcss.com/docs/container
       */
      container: ["container"],
      /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */
      columns: [{
        columns: [In]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": y()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": y()
      }],
      /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */
      box: [{
        box: ["border", "content"]
      }],
      /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */
      isolation: ["isolate", "isolation-auto"],
      /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */
      "object-position": [{
        object: [...j(), pe]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: Z()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": Z()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": Z()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: J()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": J()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": J()
      }],
      /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      /**
       * Top / Right / Bottom / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      inset: [{
        inset: [m]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [m]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [m]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [m]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [m]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [m]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [m]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [m]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [m]
      }],
      /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */
      visibility: ["visible", "invisible", "collapse"],
      /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */
      z: [{
        z: ["auto", No, pe]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: U()
      }],
      /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */
      "flex-wrap": [{
        flex: ["wrap", "wrap-reverse", "nowrap"]
      }],
      /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */
      flex: [{
        flex: ["1", "auto", "initial", "none", pe]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: z()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: z()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", No, pe]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Io]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", No, pe]
        }, pe]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": W()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": W()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Io]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [No, pe]
        }, pe]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": W()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": W()
      }],
      /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */
      "auto-cols": [{
        "auto-cols": ["auto", "min", "max", "fr", pe]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", pe]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [d]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [d]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [d]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...V()]
      }],
      /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */
      "justify-items": [{
        "justify-items": ["start", "end", "center", "stretch"]
      }],
      /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */
      "justify-self": [{
        "justify-self": ["auto", "start", "end", "center", "stretch"]
      }],
      /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */
      "align-content": [{
        content: ["normal", ...V(), "baseline"]
      }],
      /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */
      "align-items": [{
        items: ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */
      "align-self": [{
        self: ["auto", "start", "end", "center", "stretch", "baseline"]
      }],
      /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */
      "place-content": [{
        "place-content": [...V(), "baseline"]
      }],
      /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */
      "place-items": [{
        "place-items": ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */
      "place-self": [{
        "place-self": ["auto", "start", "end", "center", "stretch"]
      }],
      // Spacing
      /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */
      p: [{
        p: [k]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [k]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [k]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [k]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [k]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [k]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [k]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [k]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [k]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [g]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [g]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [g]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [g]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [g]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [g]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [g]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [g]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [g]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [_]
      }],
      /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-x-reverse": ["space-x-reverse"],
      /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/space
       */
      "space-y": [{
        "space-y": [_]
      }],
      /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-y-reverse": ["space-y-reverse"],
      // Sizing
      /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */
      w: [{
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", pe, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [pe, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [pe, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [In]
        }, In]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [pe, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [pe, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [pe, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [pe, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", In, Nn]
      }],
      /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */
      "font-style": ["italic", "not-italic"],
      /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */
      "font-weight": [{
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", ac]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Io]
      }],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-normal": ["normal-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-ordinal": ["ordinal"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-slashed-zero": ["slashed-zero"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */
      tracking: [{
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", pe]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Jr, ac]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", on, pe]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", pe]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", pe]
      }],
      /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/placeholder-color
       */
      "placeholder-color": [{
        placeholder: [e]
      }],
      /**
       * Placeholder Opacity
       * @see https://tailwindcss.com/docs/placeholder-opacity
       */
      "placeholder-opacity": [{
        "placeholder-opacity": [v]
      }],
      /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */
      "text-color": [{
        text: [e]
      }],
      /**
       * Text Opacity
       * @see https://tailwindcss.com/docs/text-opacity
       */
      "text-opacity": [{
        "text-opacity": [v]
      }],
      /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */
      "text-decoration-style": [{
        decoration: [...D(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", on, Nn]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", on, pe]
      }],
      /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */
      "text-decoration-color": [{
        decoration: [e]
      }],
      /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      /**
       * Text Wrap
       * @see https://tailwindcss.com/docs/text-wrap
       */
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */
      indent: [{
        indent: T()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", pe]
      }],
      /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */
      content: [{
        content: ["none", pe]
      }],
      // Backgrounds
      /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      /**
       * Background Opacity
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/background-opacity
       */
      "bg-opacity": [{
        "bg-opacity": [v]
      }],
      /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */
      "bg-position": [{
        bg: [...j(), O7]
      }],
      /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */
      "bg-repeat": [{
        bg: ["no-repeat", {
          repeat: ["", "x", "y", "round", "space"]
        }]
      }],
      /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */
      "bg-size": [{
        bg: ["auto", "cover", "contain", E7]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, P7]
      }],
      /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */
      "bg-color": [{
        bg: [e]
      }],
      /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from-pos": [{
        from: [b]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [b]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [b]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [p]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [p]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [p]
      }],
      // Borders
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: [a]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [a]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [a]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [a]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [a]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [a]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [a]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [a]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [a]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [a]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [a]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [a]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [a]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [a]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [a]
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: [s]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [s]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [s]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [s]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [s]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [s]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [s]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [s]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [s]
      }],
      /**
       * Border Opacity
       * @see https://tailwindcss.com/docs/border-opacity
       */
      "border-opacity": [{
        "border-opacity": [v]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...D(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [s]
      }],
      /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x-reverse": ["divide-x-reverse"],
      /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y": [{
        "divide-y": [s]
      }],
      /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y-reverse": ["divide-y-reverse"],
      /**
       * Divide Opacity
       * @see https://tailwindcss.com/docs/divide-opacity
       */
      "divide-opacity": [{
        "divide-opacity": [v]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: D()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [o]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [o]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [o]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [o]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [o]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [o]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [o]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [o]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [o]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [o]
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: ["", ...D()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [on, pe]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [on, Nn]
      }],
      /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */
      "outline-color": [{
        outline: [e]
      }],
      /**
       * Ring Width
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w": [{
        ring: te()
      }],
      /**
       * Ring Width Inset
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w-inset": ["ring-inset"],
      /**
       * Ring Color
       * @see https://tailwindcss.com/docs/ring-color
       */
      "ring-color": [{
        ring: [e]
      }],
      /**
       * Ring Opacity
       * @see https://tailwindcss.com/docs/ring-opacity
       */
      "ring-opacity": [{
        "ring-opacity": [v]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [on, Nn]
      }],
      /**
       * Ring Offset Color
       * @see https://tailwindcss.com/docs/ring-offset-color
       */
      "ring-offset-color": [{
        "ring-offset": [e]
      }],
      // Effects
      /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */
      shadow: [{
        shadow: ["", "inner", "none", In, A7]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Io]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [v]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...Q(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": Q()
      }],
      // Filters
      /**
       * Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/filter
       */
      filter: [{
        filter: ["", "none"]
      }],
      /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */
      blur: [{
        blur: [n]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [r]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [l]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", In, pe]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [c]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [u]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [f]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [x]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [h]
      }],
      /**
       * Backdrop Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/backdrop-filter
       */
      "backdrop-filter": [{
        "backdrop-filter": ["", "none"]
      }],
      /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */
      "backdrop-blur": [{
        "backdrop-blur": [n]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [r]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [l]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [c]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [u]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [f]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [v]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [x]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [h]
      }],
      // Tables
      /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing": [{
        "border-spacing": [i]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [i]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [i]
      }],
      /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */
      caption: [{
        caption: ["top", "bottom"]
      }],
      // Transitions and Animation
      /**
       * Tranisition Property
       * @see https://tailwindcss.com/docs/transition-property
       */
      transition: [{
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", pe]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: w()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", pe]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: w()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", pe]
      }],
      // Transforms
      /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */
      transform: [{
        transform: ["", "gpu", "none"]
      }],
      /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */
      scale: [{
        scale: [O]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [O]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [O]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [No, pe]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [H]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [H]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [L]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [L]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", pe]
      }],
      // Interactivity
      /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */
      accent: [{
        accent: ["auto", e]
      }],
      /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */
      appearance: [{
        appearance: ["none", "auto"]
      }],
      /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", pe]
      }],
      /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */
      "caret-color": [{
        caret: [e]
      }],
      /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */
      "pointer-events": [{
        "pointer-events": ["none", "auto"]
      }],
      /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */
      resize: [{
        resize: ["none", "y", "x", ""]
      }],
      /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-m": [{
        "scroll-m": T()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": T()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": T()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": T()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": T()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": T()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": T()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": T()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": T()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": T()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": T()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": T()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": T()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": T()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": T()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": T()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": T()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": T()
      }],
      /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-pz": ["touch-pinch-zoom"],
      /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", pe]
      }],
      // SVG
      /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */
      fill: [{
        fill: [e, "none"]
      }],
      /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */
      "stroke-w": [{
        stroke: [on, Nn, ac]
      }],
      /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */
      stroke: [{
        stroke: [e, "none"]
      }],
      // Accessibility
      /**
       * Screen Readers
       * @see https://tailwindcss.com/docs/screen-readers
       */
      sr: ["sr-only", "not-sr-only"],
      /**
       * Forced Color Adjust
       * @see https://tailwindcss.com/docs/forced-color-adjust
       */
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    }
  };
}, sb = /* @__PURE__ */ p7(I7);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Tr = {
  prefix: "fas",
  iconName: "spinner-third",
  icon: [512, 512, [], "f3f4", "M224 32c0-17.7 14.3-32 32-32C397.4 0 512 114.6 512 256c0 46.6-12.5 90.4-34.3 128c-8.8 15.3-28.4 20.5-43.7 11.7s-20.5-28.4-11.7-43.7c16.3-28.2 25.7-61 25.7-96c0-106-86-192-192-192c-17.7 0-32-14.3-32-32z"]
}, ic = ({
  icon: e,
  iconClassName: t,
  children: n,
  className: r,
  htmlFor: o,
  variant: a = "primary",
  disabled: i,
  iconFlip: s = !1,
  loading: l,
  as: c = "button",
  href: u,
  target: f,
  ...d
}) => {
  function p(g) {
    switch (g) {
      case "secondary":
        return "i-am-a-unique-string bg-ui-controls text-base-fg border border-ui-controls-border hover:bg-ui-controls/80 focus-visible:outline-secondary";
      case "action":
        return "bg-ui-controls text-base-fg border border-ui-controls-border hover:bg-ui-controls/80 focus-visible:outline-action";
      case "destructive":
        return "bg-red hover:bg-red/90 text-white focus-visible:outline-red";
      case "ghost":
        return "bg-transparent text-base-fg border border-ui-controls-border/70 hover:bg-ui-controls/30 focus-visible:outline-primary-600";
      case "primary":
      default:
        return "bg-primary hover:bg-primary-400 text-white focus-visible:outline-primary-600";
    }
  }
  const b = sb(
    i || l ? "opacity-50 pointer-events-none" : ""
  ), m = sb(
    "w-fit text-sm font-medium rounded-lg px-3 py-2 border border-transparent shadow-sm focus-visible:outline focus-visible:outline-0 focus-visible:outline-offset-0 transition-all duration-150 flex gap-2 items-center justify-center active:scale-95 transform",
    p(a),
    r,
    b
  );
  return o ? /* @__PURE__ */ Xe("label", { className: m, htmlFor: o, style: d.style, children: [
    l && !s ? /* @__PURE__ */ Y(ct, { icon: Tr, className: "animate-spin" }) : /* @__PURE__ */ Y(Ct, { children: e && !s ? /* @__PURE__ */ Y(ct, { icon: e, className: t }) : null }),
    n,
    l && s ? /* @__PURE__ */ Y(ct, { icon: Tr, className: "animate-spin" }) : /* @__PURE__ */ Y(Ct, { children: e && s ? /* @__PURE__ */ Y(ct, { icon: e, className: t }) : null })
  ] }) : c === "link" && u ? /* @__PURE__ */ Xe(
    "a",
    {
      href: u,
      className: m,
      style: d.style,
      ...d,
      target: f,
      children: [
        l && !s ? /* @__PURE__ */ Y(ct, { icon: Tr, className: "animate-spin" }) : /* @__PURE__ */ Y(Ct, { children: e && !s ? /* @__PURE__ */ Y(ct, { icon: e, className: t }) : null }),
        n,
        l && s ? /* @__PURE__ */ Y(ct, { icon: Tr, className: "animate-spin" }) : /* @__PURE__ */ Y(Ct, { children: e && s ? /* @__PURE__ */ Y(ct, { icon: e, className: t }) : null })
      ]
    }
  ) : /* @__PURE__ */ Xe(
    "button",
    {
      className: m,
      disabled: i || l,
      ...d,
      htmlFor: o,
      children: [
        l && !s ? /* @__PURE__ */ Y(ct, { icon: Tr, className: "animate-spin" }) : /* @__PURE__ */ Y(Ct, { children: e && !s ? /* @__PURE__ */ Y(ct, { icon: e, className: t }) : null }),
        n,
        l && s ? /* @__PURE__ */ Y(ct, { icon: Tr, className: "animate-spin" }) : /* @__PURE__ */ Y(Ct, { children: e && s ? /* @__PURE__ */ Y(ct, { icon: e, className: t }) : null })
      ]
    }
  );
};
var Ei = /* @__PURE__ */ ((e) => (e[e.ALL = 0] = "ALL", e[e.FEATURED = 1] = "FEATURED", e[e.MINE = 2] = "MINE", e[e.BOOKMARKED = 3] = "BOOKMARKED", e))(Ei || {});
Ei.FEATURED, Ei.MINE, Ei.BOOKMARKED;
const Ld = "-", T7 = (e) => {
  const t = R7(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (i) => {
      const s = i.split(Ld);
      return s[0] === "" && s.length !== 1 && s.shift(), Fx(s, t) || M7(i);
    },
    getConflictingClassGroupIds: (i, s) => {
      const l = n[i] || [];
      return s && r[i] ? [...l, ...r[i]] : l;
    }
  };
}, Fx = (e, t) => {
  var i;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], r = t.nextPart.get(n), o = r ? Fx(e.slice(1), r) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const a = e.join(Ld);
  return (i = t.validators.find(({
    validator: s
  }) => s(a))) == null ? void 0 : i.classGroupId;
}, lb = /^\[(.+)\]$/, M7 = (e) => {
  if (lb.test(e)) {
    const t = lb.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, R7 = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return _7(Object.entries(e.classGroups), n).forEach(([a, i]) => {
    of(i, r, a, t);
  }), r;
}, of = (e, t, n, r) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : cb(t, o);
      a.classGroupId = n;
      return;
    }
    if (typeof o == "function") {
      if (j7(o)) {
        of(o(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: n
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      of(i, cb(t, a), n, r);
    });
  });
}, cb = (e, t) => {
  let n = e;
  return t.split(Ld).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, j7 = (e) => e.isThemeGetter, _7 = (e, t) => t ? e.map(([n, r]) => {
  const o = r.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [n, o];
}) : e, F7 = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const o = (a, i) => {
    n.set(a, i), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = n.get(a);
      if (i !== void 0)
        return i;
      if ((i = r.get(a)) !== void 0)
        return o(a, i), i;
    },
    set(a, i) {
      n.has(a) ? n.set(a, i) : o(a, i);
    }
  };
}, Lx = "!", L7 = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const l = [];
    let c = 0, u = 0, f;
    for (let g = 0; g < s.length; g++) {
      let v = s[g];
      if (c === 0) {
        if (v === o && (r || s.slice(g, g + a) === t)) {
          l.push(s.slice(u, g)), u = g + a;
          continue;
        }
        if (v === "/") {
          f = g;
          continue;
        }
      }
      v === "[" ? c++ : v === "]" && c--;
    }
    const d = l.length === 0 ? s : s.substring(u), p = d.startsWith(Lx), b = p ? d.substring(1) : d, m = f && f > u ? f - u : void 0;
    return {
      modifiers: l,
      hasImportantModifier: p,
      baseClassName: b,
      maybePostfixModifierPosition: m
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, D7 = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, z7 = (e) => ({
  cache: F7(e.cacheSize),
  parseClassName: L7(e),
  ...T7(e)
}), W7 = /\s+/, V7 = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(W7);
  let s = "";
  for (let l = i.length - 1; l >= 0; l -= 1) {
    const c = i[l], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: p
    } = n(c);
    let b = !!p, m = r(b ? d.substring(0, p) : d);
    if (!m) {
      if (!b) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (m = r(d), !m) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      b = !1;
    }
    const g = D7(u).join(":"), v = f ? g + Lx : g, k = v + m;
    if (a.includes(k))
      continue;
    a.push(k);
    const x = o(m, b);
    for (let O = 0; O < x.length; ++O) {
      const h = x[O];
      a.push(v + h);
    }
    s = c + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function H7() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = Dx(t)) && (r && (r += " "), r += n);
  return r;
}
const Dx = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = Dx(e[r])) && (n && (n += " "), n += t);
  return n;
};
function U7(e, ...t) {
  let n, r, o, a = i;
  function i(l) {
    const c = t.reduce((u, f) => f(u), e());
    return n = z7(c), r = n.cache.get, o = n.cache.set, a = s, s(l);
  }
  function s(l) {
    const c = r(l);
    if (c)
      return c;
    const u = V7(l, n);
    return o(l, u), u;
  }
  return function() {
    return a(H7.apply(null, arguments));
  };
}
const ze = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, zx = /^\[(?:([a-z-]+):)?(.+)\]$/i, Y7 = /^\d+\/\d+$/, B7 = /* @__PURE__ */ new Set(["px", "full", "screen"]), G7 = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, q7 = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, K7 = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, X7 = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Q7 = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, an = (e) => Zr(e) || B7.has(e) || Y7.test(e), Tn = (e) => xo(e, "length", aM), Zr = (e) => !!e && !Number.isNaN(Number(e)), sc = (e) => xo(e, "number", Zr), To = (e) => !!e && Number.isInteger(Number(e)), J7 = (e) => e.endsWith("%") && Zr(e.slice(0, -1)), me = (e) => zx.test(e), Mn = (e) => G7.test(e), Z7 = /* @__PURE__ */ new Set(["length", "size", "percentage"]), eM = (e) => xo(e, Z7, Wx), tM = (e) => xo(e, "position", Wx), nM = /* @__PURE__ */ new Set(["image", "url"]), rM = (e) => xo(e, nM, sM), oM = (e) => xo(e, "", iM), Mo = () => !0, xo = (e, t, n) => {
  const r = zx.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, aM = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  q7.test(e) && !K7.test(e)
), Wx = () => !1, iM = (e) => X7.test(e), sM = (e) => Q7.test(e), lM = () => {
  const e = ze("colors"), t = ze("spacing"), n = ze("blur"), r = ze("brightness"), o = ze("borderColor"), a = ze("borderRadius"), i = ze("borderSpacing"), s = ze("borderWidth"), l = ze("contrast"), c = ze("grayscale"), u = ze("hueRotate"), f = ze("invert"), d = ze("gap"), p = ze("gradientColorStops"), b = ze("gradientColorStopPositions"), m = ze("inset"), g = ze("margin"), v = ze("opacity"), k = ze("padding"), x = ze("saturate"), O = ze("scale"), h = ze("sepia"), L = ze("skew"), _ = ze("space"), H = ze("translate"), J = () => ["auto", "contain", "none"], Z = () => ["auto", "hidden", "clip", "visible", "scroll"], U = () => ["auto", me, t], T = () => [me, t], te = () => ["", an, Tn], W = () => ["auto", Zr, me], j = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], D = () => ["solid", "dashed", "dotted", "double", "none"], Q = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], V = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], z = () => ["", "0", me], y = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], w = () => [Zr, me];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Mo],
      spacing: [an, Tn],
      blur: ["none", "", Mn, me],
      brightness: w(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Mn, me],
      borderSpacing: T(),
      borderWidth: te(),
      contrast: w(),
      grayscale: z(),
      hueRotate: w(),
      invert: z(),
      gap: T(),
      gradientColorStops: [e],
      gradientColorStopPositions: [J7, Tn],
      inset: U(),
      margin: U(),
      opacity: w(),
      padding: T(),
      saturate: w(),
      scale: w(),
      sepia: z(),
      skew: w(),
      space: T(),
      translate: T()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", me]
      }],
      /**
       * Container
       * @see https://tailwindcss.com/docs/container
       */
      container: ["container"],
      /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */
      columns: [{
        columns: [Mn]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": y()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": y()
      }],
      /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */
      box: [{
        box: ["border", "content"]
      }],
      /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */
      isolation: ["isolate", "isolation-auto"],
      /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */
      "object-position": [{
        object: [...j(), me]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: Z()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": Z()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": Z()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: J()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": J()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": J()
      }],
      /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      /**
       * Top / Right / Bottom / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      inset: [{
        inset: [m]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [m]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [m]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [m]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [m]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [m]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [m]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [m]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [m]
      }],
      /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */
      visibility: ["visible", "invisible", "collapse"],
      /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */
      z: [{
        z: ["auto", To, me]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: U()
      }],
      /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */
      "flex-wrap": [{
        flex: ["wrap", "wrap-reverse", "nowrap"]
      }],
      /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */
      flex: [{
        flex: ["1", "auto", "initial", "none", me]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: z()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: z()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", To, me]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Mo]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", To, me]
        }, me]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": W()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": W()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Mo]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [To, me]
        }, me]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": W()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": W()
      }],
      /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */
      "auto-cols": [{
        "auto-cols": ["auto", "min", "max", "fr", me]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", me]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [d]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [d]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [d]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...V()]
      }],
      /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */
      "justify-items": [{
        "justify-items": ["start", "end", "center", "stretch"]
      }],
      /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */
      "justify-self": [{
        "justify-self": ["auto", "start", "end", "center", "stretch"]
      }],
      /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */
      "align-content": [{
        content: ["normal", ...V(), "baseline"]
      }],
      /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */
      "align-items": [{
        items: ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */
      "align-self": [{
        self: ["auto", "start", "end", "center", "stretch", "baseline"]
      }],
      /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */
      "place-content": [{
        "place-content": [...V(), "baseline"]
      }],
      /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */
      "place-items": [{
        "place-items": ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */
      "place-self": [{
        "place-self": ["auto", "start", "end", "center", "stretch"]
      }],
      // Spacing
      /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */
      p: [{
        p: [k]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [k]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [k]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [k]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [k]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [k]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [k]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [k]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [k]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [g]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [g]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [g]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [g]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [g]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [g]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [g]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [g]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [g]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [_]
      }],
      /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-x-reverse": ["space-x-reverse"],
      /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/space
       */
      "space-y": [{
        "space-y": [_]
      }],
      /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-y-reverse": ["space-y-reverse"],
      // Sizing
      /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */
      w: [{
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", me, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [me, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [me, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Mn]
        }, Mn]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [me, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [me, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [me, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [me, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Mn, Tn]
      }],
      /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */
      "font-style": ["italic", "not-italic"],
      /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */
      "font-weight": [{
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", sc]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Mo]
      }],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-normal": ["normal-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-ordinal": ["ordinal"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-slashed-zero": ["slashed-zero"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */
      tracking: [{
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", me]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Zr, sc]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", an, me]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", me]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", me]
      }],
      /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/placeholder-color
       */
      "placeholder-color": [{
        placeholder: [e]
      }],
      /**
       * Placeholder Opacity
       * @see https://tailwindcss.com/docs/placeholder-opacity
       */
      "placeholder-opacity": [{
        "placeholder-opacity": [v]
      }],
      /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */
      "text-color": [{
        text: [e]
      }],
      /**
       * Text Opacity
       * @see https://tailwindcss.com/docs/text-opacity
       */
      "text-opacity": [{
        "text-opacity": [v]
      }],
      /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */
      "text-decoration-style": [{
        decoration: [...D(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", an, Tn]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", an, me]
      }],
      /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */
      "text-decoration-color": [{
        decoration: [e]
      }],
      /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      /**
       * Text Wrap
       * @see https://tailwindcss.com/docs/text-wrap
       */
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */
      indent: [{
        indent: T()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", me]
      }],
      /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */
      content: [{
        content: ["none", me]
      }],
      // Backgrounds
      /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      /**
       * Background Opacity
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/background-opacity
       */
      "bg-opacity": [{
        "bg-opacity": [v]
      }],
      /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */
      "bg-position": [{
        bg: [...j(), tM]
      }],
      /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */
      "bg-repeat": [{
        bg: ["no-repeat", {
          repeat: ["", "x", "y", "round", "space"]
        }]
      }],
      /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */
      "bg-size": [{
        bg: ["auto", "cover", "contain", eM]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, rM]
      }],
      /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */
      "bg-color": [{
        bg: [e]
      }],
      /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from-pos": [{
        from: [b]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [b]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [b]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [p]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [p]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [p]
      }],
      // Borders
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: [a]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [a]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [a]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [a]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [a]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [a]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [a]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [a]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [a]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [a]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [a]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [a]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [a]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [a]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [a]
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: [s]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [s]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [s]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [s]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [s]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [s]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [s]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [s]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [s]
      }],
      /**
       * Border Opacity
       * @see https://tailwindcss.com/docs/border-opacity
       */
      "border-opacity": [{
        "border-opacity": [v]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...D(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [s]
      }],
      /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x-reverse": ["divide-x-reverse"],
      /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y": [{
        "divide-y": [s]
      }],
      /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y-reverse": ["divide-y-reverse"],
      /**
       * Divide Opacity
       * @see https://tailwindcss.com/docs/divide-opacity
       */
      "divide-opacity": [{
        "divide-opacity": [v]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: D()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [o]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [o]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [o]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [o]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [o]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [o]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [o]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [o]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [o]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [o]
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: ["", ...D()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [an, me]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [an, Tn]
      }],
      /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */
      "outline-color": [{
        outline: [e]
      }],
      /**
       * Ring Width
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w": [{
        ring: te()
      }],
      /**
       * Ring Width Inset
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w-inset": ["ring-inset"],
      /**
       * Ring Color
       * @see https://tailwindcss.com/docs/ring-color
       */
      "ring-color": [{
        ring: [e]
      }],
      /**
       * Ring Opacity
       * @see https://tailwindcss.com/docs/ring-opacity
       */
      "ring-opacity": [{
        "ring-opacity": [v]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [an, Tn]
      }],
      /**
       * Ring Offset Color
       * @see https://tailwindcss.com/docs/ring-offset-color
       */
      "ring-offset-color": [{
        "ring-offset": [e]
      }],
      // Effects
      /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */
      shadow: [{
        shadow: ["", "inner", "none", Mn, oM]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Mo]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [v]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...Q(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": Q()
      }],
      // Filters
      /**
       * Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/filter
       */
      filter: [{
        filter: ["", "none"]
      }],
      /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */
      blur: [{
        blur: [n]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [r]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [l]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", Mn, me]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [c]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [u]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [f]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [x]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [h]
      }],
      /**
       * Backdrop Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/backdrop-filter
       */
      "backdrop-filter": [{
        "backdrop-filter": ["", "none"]
      }],
      /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */
      "backdrop-blur": [{
        "backdrop-blur": [n]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [r]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [l]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [c]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [u]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [f]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [v]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [x]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [h]
      }],
      // Tables
      /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing": [{
        "border-spacing": [i]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [i]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [i]
      }],
      /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */
      caption: [{
        caption: ["top", "bottom"]
      }],
      // Transitions and Animation
      /**
       * Tranisition Property
       * @see https://tailwindcss.com/docs/transition-property
       */
      transition: [{
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", me]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: w()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", me]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: w()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", me]
      }],
      // Transforms
      /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */
      transform: [{
        transform: ["", "gpu", "none"]
      }],
      /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */
      scale: [{
        scale: [O]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [O]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [O]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [To, me]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [H]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [H]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [L]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [L]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", me]
      }],
      // Interactivity
      /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */
      accent: [{
        accent: ["auto", e]
      }],
      /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */
      appearance: [{
        appearance: ["none", "auto"]
      }],
      /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", me]
      }],
      /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */
      "caret-color": [{
        caret: [e]
      }],
      /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */
      "pointer-events": [{
        "pointer-events": ["none", "auto"]
      }],
      /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */
      resize: [{
        resize: ["none", "y", "x", ""]
      }],
      /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-m": [{
        "scroll-m": T()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": T()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": T()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": T()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": T()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": T()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": T()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": T()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": T()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": T()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": T()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": T()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": T()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": T()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": T()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": T()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": T()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": T()
      }],
      /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-pz": ["touch-pinch-zoom"],
      /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", me]
      }],
      // SVG
      /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */
      fill: [{
        fill: [e, "none"]
      }],
      /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */
      "stroke-w": [{
        stroke: [an, Tn, sc]
      }],
      /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */
      stroke: [{
        stroke: [e, "none"]
      }],
      // Accessibility
      /**
       * Screen Readers
       * @see https://tailwindcss.com/docs/screen-readers
       */
      sr: ["sr-only", "not-sr-only"],
      /**
       * Forced Color Adjust
       * @see https://tailwindcss.com/docs/forced-color-adjust
       */
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    }
  };
}, ub = /* @__PURE__ */ U7(lM), yM = ({
  className: e,
  label: t,
  options: n,
  icon: r,
  align: o = "left",
  showSelected: a
}) => {
  const [i, s] = $e(!1), [l, c] = $e(
    null
  ), u = () => {
    var p, b;
    s(!1), (b = (p = n[l].dialogProps) == null ? void 0 : p.onClose) == null || b.call(p);
  }, f = (p) => {
    const b = n[p];
    b.onClick && b.onClick(), b.onDialogOpen && b.onDialogOpen(), b.dialogProps && (c(p), s(!0));
  }, d = l !== null ? n[l].dialogProps : null;
  return /* @__PURE__ */ Xe("div", { className: "relative", children: [
    /* @__PURE__ */ Xe(Ua, { as: "div", className: "inline-block text-left", children: [
      /* @__PURE__ */ Y(Ua.Button, { as: "div", children: /* @__PURE__ */ Xe(
        ic,
        {
          className: e,
          icon: YE,
          iconFlip: !0,
          variant: "secondary",
          children: [
            r ? /* @__PURE__ */ Y(Ri, { icon: r }) : null,
            t
          ]
        }
      ) }),
      /* @__PURE__ */ Y(
        gE,
        {
          as: mt,
          enter: "transition ease-out duration-100",
          enterFrom: "transform opacity-0 scale-95",
          enterTo: "transform opacity-100 scale-100",
          leave: "transition ease-in duration-75",
          leaveFrom: "transform opacity-100 scale-100",
          leaveTo: "transform opacity-0 scale-95",
          children: /* @__PURE__ */ Y(
            Ua.Items,
            {
              static: !0,
              className: ub(
                "absolute z-20 mt-1 w-max divide-y divide-gray-100 overflow-hidden rounded-lg bg-brand-secondary py-1.5 shadow-xl focus:outline-none",
                o === "left" ? "left-0" : "right-0"
              ),
              children: /* @__PURE__ */ Y("div", { children: n.map((p, b) => /* @__PURE__ */ Xe(mt, { children: [
                p.divider && /* @__PURE__ */ Y("div", { className: "my-1.5 border-t border-ui-divider" }),
                /* @__PURE__ */ Y(Ua.Item, { children: ({ active: m }) => /* @__PURE__ */ Y(
                  "button",
                  {
                    disabled: p.disabled,
                    className: ub(
                      "duration-50 bg-brand-secondary font-medium text-white transition-all",
                      m ? "bg-brand-secondary-800" : "",
                      p.disabled ? "pointer-events-none opacity-40" : "",
                      "group flex w-full items-center py-1.5 pl-7 pr-4 text-sm",
                      p.className
                    ),
                    onClick: () => f(b),
                    children: /* @__PURE__ */ Xe("div", { className: "flex w-full items-center", children: [
                      p.icon && /* @__PURE__ */ Y(
                        Ri,
                        {
                          icon: p.icon,
                          className: "mr-2"
                        }
                      ),
                      /* @__PURE__ */ Y("div", { className: "grow text-start", children: p.label }),
                      /* @__PURE__ */ Y("div", { className: "ml-10 font-normal text-white/75", children: p.description && p.description }),
                      a && /* @__PURE__ */ Y(Ct, { children: p.selected ? /* @__PURE__ */ Xe(
                        "svg",
                        {
                          xmlns: "http://www.w3.org/2000/svg",
                          viewBox: "0 0 512 512",
                          className: "ml-3 flex h-5",
                          children: [
                            /* @__PURE__ */ Y(
                              "path",
                              {
                                opacity: "1",
                                d: "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z",
                                fill: "#FC6B68"
                              }
                            ),
                            /* @__PURE__ */ Y(
                              "path",
                              {
                                d: "M369 175c-9.4 9.4-9.4 24.6 0 33.9L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0z",
                                fill: "#FFFFFF"
                              }
                            )
                          ]
                        }
                      ) : /* @__PURE__ */ Y("div", { className: "w-8" }) })
                    ] })
                  }
                ) })
              ] }, b)) })
            }
          )
        }
      )
    ] }),
    d && /* @__PURE__ */ Xe(
      Fa,
      {
        title: d.title,
        isOpen: i,
        onClose: u,
        className: d.className,
        children: [
          d.content,
          /* @__PURE__ */ Xe("div", { className: "mt-6 flex justify-end gap-2", children: [
            d.showClose !== !1 && d.closeButtonProps && /* @__PURE__ */ Y(
              ic,
              {
                variant: "secondary",
                ...d.closeButtonProps,
                onClick: u,
                children: d.closeButtonProps.label
              }
            ),
            d.confirmButtonProps && /* @__PURE__ */ Y(
              ic,
              {
                ...d.confirmButtonProps,
                onClick: (p) => {
                  var b, m;
                  (b = d.confirmButtonProps) != null && b.onClick && ((m = d.confirmButtonProps) == null || m.onClick(p)), u();
                },
                children: d.confirmButtonProps.label || "Confirm"
              }
            )
          ] })
        ]
      }
    )
  ] });
};
export {
  yM as ButtonDropdown
};
