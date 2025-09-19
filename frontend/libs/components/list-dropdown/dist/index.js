import { jsx as Le, jsxs as Pn, Fragment as ws } from "react/jsx-runtime";
import * as L from "react";
import z, { useRef as V, useCallback as re, useEffect as ue, useState as oe, useMemo as se, useLayoutEffect as kr, useContext as le, createContext as ge, forwardRef as Es, Fragment as Oe, isValidElement as Os, cloneElement as Ss, createElement as Ts, useId as vt, useReducer as As, useSyncExternalStore as Ps } from "react";
import * as tn from "react-dom";
import { createPortal as Pi, flushSync as nt } from "react-dom";
const Ci = typeof document < "u" ? z.useLayoutEffect : () => {
};
function Cs(e) {
  const t = V(null);
  return Ci(() => {
    t.current = e;
  }, [
    e
  ]), re((...n) => {
    const r = t.current;
    return r == null ? void 0 : r(...n);
  }, []);
}
const Je = (e) => {
  var t;
  return (t = e == null ? void 0 : e.ownerDocument) !== null && t !== void 0 ? t : document;
}, Ze = (e) => e && "window" in e && e.window === e ? e : Je(e).defaultView || window;
function $s(e) {
  return e !== null && typeof e == "object" && "nodeType" in e && typeof e.nodeType == "number";
}
function Rs(e) {
  return $s(e) && e.nodeType === Node.DOCUMENT_FRAGMENT_NODE && "host" in e;
}
let Ls = !1;
function Mr() {
  return Ls;
}
function $i(e, t) {
  if (!Mr()) return t && e ? e.contains(t) : !1;
  if (!e || !t) return !1;
  let n = t;
  for (; n !== null; ) {
    if (n === e) return !0;
    n.tagName === "SLOT" && n.assignedSlot ? n = n.assignedSlot.parentNode : Rs(n) ? n = n.host : n = n.parentNode;
  }
  return !1;
}
const er = (e = document) => {
  var t;
  if (!Mr()) return e.activeElement;
  let n = e.activeElement;
  for (; n && "shadowRoot" in n && (!((t = n.shadowRoot) === null || t === void 0) && t.activeElement); ) n = n.shadowRoot.activeElement;
  return n;
};
function Ri(e) {
  return Mr() && e.target.shadowRoot && e.composedPath ? e.composedPath()[0] : e.target;
}
function Fs(e) {
  var t;
  return typeof window > "u" || window.navigator == null ? !1 : ((t = window.navigator.userAgentData) === null || t === void 0 ? void 0 : t.brands.some((n) => e.test(n.brand))) || e.test(window.navigator.userAgent);
}
function Is(e) {
  var t;
  return typeof window < "u" && window.navigator != null ? e.test(((t = window.navigator.userAgentData) === null || t === void 0 ? void 0 : t.platform) || window.navigator.platform) : !1;
}
function Li(e) {
  let t = null;
  return () => (t == null && (t = e()), t);
}
const ks = Li(function() {
  return Is(/^Mac/i);
}), Ms = Li(function() {
  return Fs(/Android/i);
});
function Fi() {
  let e = V(/* @__PURE__ */ new Map()), t = re((o, i, a, s) => {
    let l = s != null && s.once ? (...u) => {
      e.current.delete(a), a(...u);
    } : a;
    e.current.set(a, {
      type: i,
      eventTarget: o,
      fn: l,
      options: s
    }), o.addEventListener(i, l, s);
  }, []), n = re((o, i, a, s) => {
    var l;
    let u = ((l = e.current.get(a)) === null || l === void 0 ? void 0 : l.fn) || a;
    o.removeEventListener(i, u, s), e.current.delete(a);
  }, []), r = re(() => {
    e.current.forEach((o, i) => {
      n(o.eventTarget, o.type, i, o.options);
    });
  }, [
    n
  ]);
  return ue(() => r, [
    r
  ]), {
    addGlobalListener: t,
    removeGlobalListener: n,
    removeAllGlobalListeners: r
  };
}
function _s(e) {
  return e.mozInputSource === 0 && e.isTrusted ? !0 : Ms() && e.pointerType ? e.type === "click" && e.buttons === 1 : e.detail === 0 && !e.pointerType;
}
class Ii {
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
function ki(e) {
  let t = V({
    isFocused: !1,
    observer: null
  });
  Ci(() => {
    const r = t.current;
    return () => {
      r.observer && (r.observer.disconnect(), r.observer = null);
    };
  }, []);
  let n = Cs((r) => {
    e == null || e(r);
  });
  return re((r) => {
    if (r.target instanceof HTMLButtonElement || r.target instanceof HTMLInputElement || r.target instanceof HTMLTextAreaElement || r.target instanceof HTMLSelectElement) {
      t.current.isFocused = !0;
      let o = r.target, i = (a) => {
        t.current.isFocused = !1, o.disabled && n(new Ii("blur", a)), t.current.observer && (t.current.observer.disconnect(), t.current.observer = null);
      };
      o.addEventListener("focusout", i, {
        once: !0
      }), t.current.observer = new MutationObserver(() => {
        if (t.current.isFocused && o.disabled) {
          var a;
          (a = t.current.observer) === null || a === void 0 || a.disconnect();
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
let Ds = !1, _t = null, tr = /* @__PURE__ */ new Set(), Pt = /* @__PURE__ */ new Map(), ot = !1, nr = !1;
const Ns = {
  Tab: !0,
  Escape: !0
};
function _r(e, t) {
  for (let n of tr) n(e, t);
}
function js(e) {
  return !(e.metaKey || !ks() && e.altKey || e.ctrlKey || e.key === "Control" || e.key === "Shift" || e.key === "Meta");
}
function nn(e) {
  ot = !0, js(e) && (_t = "keyboard", _r("keyboard", e));
}
function Ee(e) {
  _t = "pointer", (e.type === "mousedown" || e.type === "pointerdown") && (ot = !0, _r("pointer", e));
}
function Mi(e) {
  _s(e) && (ot = !0, _t = "virtual");
}
function _i(e) {
  e.target === window || e.target === document || Ds || !e.isTrusted || (!ot && !nr && (_t = "virtual", _r("virtual", e)), ot = !1, nr = !1);
}
function Di() {
  ot = !1, nr = !0;
}
function rr(e) {
  if (typeof window > "u" || Pt.get(Ze(e))) return;
  const t = Ze(e), n = Je(e);
  let r = t.HTMLElement.prototype.focus;
  t.HTMLElement.prototype.focus = function() {
    ot = !0, r.apply(this, arguments);
  }, n.addEventListener("keydown", nn, !0), n.addEventListener("keyup", nn, !0), n.addEventListener("click", Mi, !0), t.addEventListener("focus", _i, !0), t.addEventListener("blur", Di, !1), typeof PointerEvent < "u" ? (n.addEventListener("pointerdown", Ee, !0), n.addEventListener("pointermove", Ee, !0), n.addEventListener("pointerup", Ee, !0)) : (n.addEventListener("mousedown", Ee, !0), n.addEventListener("mousemove", Ee, !0), n.addEventListener("mouseup", Ee, !0)), t.addEventListener("beforeunload", () => {
    Ni(e);
  }, {
    once: !0
  }), Pt.set(t, {
    focus: r
  });
}
const Ni = (e, t) => {
  const n = Ze(e), r = Je(e);
  t && r.removeEventListener("DOMContentLoaded", t), Pt.has(n) && (n.HTMLElement.prototype.focus = Pt.get(n).focus, r.removeEventListener("keydown", nn, !0), r.removeEventListener("keyup", nn, !0), r.removeEventListener("click", Mi, !0), n.removeEventListener("focus", _i, !0), n.removeEventListener("blur", Di, !1), typeof PointerEvent < "u" ? (r.removeEventListener("pointerdown", Ee, !0), r.removeEventListener("pointermove", Ee, !0), r.removeEventListener("pointerup", Ee, !0)) : (r.removeEventListener("mousedown", Ee, !0), r.removeEventListener("mousemove", Ee, !0), r.removeEventListener("mouseup", Ee, !0)), Pt.delete(n));
};
function Hs(e) {
  const t = Je(e);
  let n;
  return t.readyState !== "loading" ? rr(e) : (n = () => {
    rr(e);
  }, t.addEventListener("DOMContentLoaded", n)), () => Ni(e, n);
}
typeof document < "u" && Hs();
function ji() {
  return _t !== "pointer";
}
const Ws = /* @__PURE__ */ new Set([
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
function zs(e, t, n) {
  let r = Je(n == null ? void 0 : n.target);
  const o = typeof window < "u" ? Ze(n == null ? void 0 : n.target).HTMLInputElement : HTMLInputElement, i = typeof window < "u" ? Ze(n == null ? void 0 : n.target).HTMLTextAreaElement : HTMLTextAreaElement, a = typeof window < "u" ? Ze(n == null ? void 0 : n.target).HTMLElement : HTMLElement, s = typeof window < "u" ? Ze(n == null ? void 0 : n.target).KeyboardEvent : KeyboardEvent;
  return e = e || r.activeElement instanceof o && !Ws.has(r.activeElement.type) || r.activeElement instanceof i || r.activeElement instanceof a && r.activeElement.isContentEditable, !(e && t === "keyboard" && n instanceof s && !Ns[n.key]);
}
function Bs(e, t, n) {
  rr(), ue(() => {
    let r = (o, i) => {
      zs(!!(n != null && n.isTextInput), o, i) && e(ji());
    };
    return tr.add(r), () => {
      tr.delete(r);
    };
  }, t);
}
function Us(e) {
  let { isDisabled: t, onFocus: n, onBlur: r, onFocusChange: o } = e;
  const i = re((l) => {
    if (l.target === l.currentTarget)
      return r && r(l), o && o(!1), !0;
  }, [
    r,
    o
  ]), a = ki(i), s = re((l) => {
    const u = Je(l.target), c = u ? er(u) : er();
    l.target === l.currentTarget && c === Ri(l.nativeEvent) && (n && n(l), o && o(!0), a(l));
  }, [
    o,
    n,
    a
  ]);
  return {
    focusProps: {
      onFocus: !t && (n || o || r) ? s : void 0,
      onBlur: !t && (r || o) ? i : void 0
    }
  };
}
function Vs(e) {
  let { isDisabled: t, onBlurWithin: n, onFocusWithin: r, onFocusWithinChange: o } = e, i = V({
    isFocusWithin: !1
  }), { addGlobalListener: a, removeAllGlobalListeners: s } = Fi(), l = re((p) => {
    p.currentTarget.contains(p.target) && i.current.isFocusWithin && !p.currentTarget.contains(p.relatedTarget) && (i.current.isFocusWithin = !1, s(), n && n(p), o && o(!1));
  }, [
    n,
    o,
    i,
    s
  ]), u = ki(l), c = re((p) => {
    if (!p.currentTarget.contains(p.target)) return;
    const d = Je(p.target), f = er(d);
    if (!i.current.isFocusWithin && f === Ri(p.nativeEvent)) {
      r && r(p), o && o(!0), i.current.isFocusWithin = !0, u(p);
      let m = p.currentTarget;
      a(d, "focus", (h) => {
        if (i.current.isFocusWithin && !$i(m, h.target)) {
          let g = new Ii("blur", new d.defaultView.FocusEvent("blur", {
            relatedTarget: h.target
          }));
          g.target = m, g.currentTarget = m, l(g);
        }
      }, {
        capture: !0
      });
    }
  }, [
    r,
    o,
    u,
    a,
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
      onFocus: c,
      onBlur: l
    }
  };
}
let rn = !1, Cn = 0;
function or() {
  rn = !0, setTimeout(() => {
    rn = !1;
  }, 50);
}
function fo(e) {
  e.pointerType === "touch" && or();
}
function Ys() {
  if (!(typeof document > "u"))
    return typeof PointerEvent < "u" ? document.addEventListener("pointerup", fo) : document.addEventListener("touchend", or), Cn++, () => {
      Cn--, !(Cn > 0) && (typeof PointerEvent < "u" ? document.removeEventListener("pointerup", fo) : document.removeEventListener("touchend", or));
    };
}
function Gs(e) {
  let { onHoverStart: t, onHoverChange: n, onHoverEnd: r, isDisabled: o } = e, [i, a] = oe(!1), s = V({
    isHovered: !1,
    ignoreEmulatedMouseEvents: !1,
    pointerType: "",
    target: null
  }).current;
  ue(Ys, []);
  let { addGlobalListener: l, removeAllGlobalListeners: u } = Fi(), { hoverProps: c, triggerHoverEnd: p } = se(() => {
    let d = (h, g) => {
      if (s.pointerType = g, o || g === "touch" || s.isHovered || !h.currentTarget.contains(h.target)) return;
      s.isHovered = !0;
      let y = h.currentTarget;
      s.target = y, l(Je(h.target), "pointerover", (w) => {
        s.isHovered && s.target && !$i(s.target, w.target) && f(w, w.pointerType);
      }, {
        capture: !0
      }), t && t({
        type: "hoverstart",
        target: y,
        pointerType: g
      }), n && n(!0), a(!0);
    }, f = (h, g) => {
      let y = s.target;
      s.pointerType = "", s.target = null, !(g === "touch" || !s.isHovered || !y) && (s.isHovered = !1, u(), r && r({
        type: "hoverend",
        target: y,
        pointerType: g
      }), n && n(!1), a(!1));
    }, m = {};
    return typeof PointerEvent < "u" ? (m.onPointerEnter = (h) => {
      rn && h.pointerType === "mouse" || d(h, h.pointerType);
    }, m.onPointerLeave = (h) => {
      !o && h.currentTarget.contains(h.target) && f(h, h.pointerType);
    }) : (m.onTouchStart = () => {
      s.ignoreEmulatedMouseEvents = !0;
    }, m.onMouseEnter = (h) => {
      !s.ignoreEmulatedMouseEvents && !rn && d(h, "mouse"), s.ignoreEmulatedMouseEvents = !1;
    }, m.onMouseLeave = (h) => {
      !o && h.currentTarget.contains(h.target) && f(h, "mouse");
    }), {
      hoverProps: m,
      triggerHoverEnd: f
    };
  }, [
    t,
    n,
    r,
    o,
    s,
    l,
    u
  ]);
  return ue(() => {
    o && p({
      currentTarget: s.target
    }, s.pointerType);
  }, [
    o
  ]), {
    hoverProps: c,
    isHovered: i
  };
}
function qs(e = {}) {
  let { autoFocus: t = !1, isTextInput: n, within: r } = e, o = V({
    isFocused: !1,
    isFocusVisible: t || ji()
  }), [i, a] = oe(!1), [s, l] = oe(() => o.current.isFocused && o.current.isFocusVisible), u = re(() => l(o.current.isFocused && o.current.isFocusVisible), []), c = re((f) => {
    o.current.isFocused = f, a(f), u();
  }, [
    u
  ]);
  Bs((f) => {
    o.current.isFocusVisible = f, u();
  }, [], {
    isTextInput: n
  });
  let { focusProps: p } = Us({
    isDisabled: r,
    onFocusChange: c
  }), { focusWithinProps: d } = Vs({
    isDisabled: !r,
    onFocusWithinChange: c
  });
  return {
    isFocused: i,
    isFocusVisible: s,
    focusProps: r ? d : p
  };
}
var Ks = Object.defineProperty, Xs = (e, t, n) => t in e ? Ks(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, $n = (e, t, n) => (Xs(e, typeof t != "symbol" ? t + "" : t, n), n);
let Qs = class {
  constructor() {
    $n(this, "current", this.detect()), $n(this, "handoffState", "pending"), $n(this, "currentId", 0);
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
}, rt = new Qs();
function Dt(e) {
  var t, n;
  return rt.isServer ? null : e ? "ownerDocument" in e ? e.ownerDocument : "current" in e ? (n = (t = e.current) == null ? void 0 : t.ownerDocument) != null ? n : document : null : document;
}
function Hi(e) {
  typeof queueMicrotask == "function" ? queueMicrotask(e) : Promise.resolve().then(e).catch((t) => setTimeout(() => {
    throw t;
  }));
}
function Ne() {
  let e = [], t = { addEventListener(n, r, o, i) {
    return n.addEventListener(r, o, i), t.add(() => n.removeEventListener(r, o, i));
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
    return Hi(() => {
      r.current && n[0]();
    }), t.add(() => {
      r.current = !1;
    });
  }, style(n, r, o) {
    let i = n.style.getPropertyValue(r);
    return Object.assign(n.style, { [r]: o }), this.add(() => {
      Object.assign(n.style, { [r]: i });
    });
  }, group(n) {
    let r = Ne();
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
function bt() {
  let [e] = oe(Ne);
  return ue(() => () => e.dispose(), [e]), e;
}
let ie = (e, t) => {
  rt.isServer ? ue(e, t) : kr(e, t);
};
function ct(e) {
  let t = V(e);
  return ie(() => {
    t.current = e;
  }, [e]), t;
}
let X = function(e) {
  let t = ct(e);
  return z.useCallback((...n) => t.current(...n), [t]);
};
function Js(e) {
  let t = e.width / 2, n = e.height / 2;
  return { top: e.clientY - n, right: e.clientX + t, bottom: e.clientY + n, left: e.clientX - t };
}
function Zs(e, t) {
  return !(!e || !t || e.right < t.left || e.left > t.right || e.bottom < t.top || e.top > t.bottom);
}
function el({ disabled: e = !1 } = {}) {
  let t = V(null), [n, r] = oe(!1), o = bt(), i = X(() => {
    t.current = null, r(!1), o.dispose();
  }), a = X((s) => {
    if (o.dispose(), t.current === null) {
      t.current = s.currentTarget, r(!0);
      {
        let l = Dt(s.currentTarget);
        o.addEventListener(l, "pointerup", i, !1), o.addEventListener(l, "pointermove", (u) => {
          if (t.current) {
            let c = Js(u);
            r(Zs(c, t.current.getBoundingClientRect()));
          }
        }, !1), o.addEventListener(l, "pointercancel", i, !1);
      }
    }
  });
  return { pressed: n, pressProps: e ? {} : { onPointerDown: a, onPointerUp: i, onClick: i } };
}
let tl = ge(void 0);
function Dr() {
  return le(tl);
}
function ir(...e) {
  return Array.from(new Set(e.flatMap((t) => typeof t == "string" ? t.split(" ") : []))).filter(Boolean).join(" ");
}
function Ce(e, t, ...n) {
  if (e in t) {
    let o = t[e];
    return typeof o == "function" ? o(...n) : o;
  }
  let r = new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map((o) => `"${o}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(r, Ce), r;
}
var on = ((e) => (e[e.None = 0] = "None", e[e.RenderStrategy = 1] = "RenderStrategy", e[e.Static = 2] = "Static", e))(on || {}), Ye = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(Ye || {});
function xe() {
  let e = rl();
  return re((t) => nl({ mergeRefs: e, ...t }), [e]);
}
function nl({ ourProps: e, theirProps: t, slot: n, defaultTag: r, features: o, visible: i = !0, name: a, mergeRefs: s }) {
  s = s ?? ol;
  let l = Wi(t, e);
  if (i) return Ut(l, n, r, a, s);
  let u = o ?? 0;
  if (u & 2) {
    let { static: c = !1, ...p } = l;
    if (c) return Ut(p, n, r, a, s);
  }
  if (u & 1) {
    let { unmount: c = !0, ...p } = l;
    return Ce(c ? 0 : 1, { 0() {
      return null;
    }, 1() {
      return Ut({ ...p, hidden: !0, style: { display: "none" } }, n, r, a, s);
    } });
  }
  return Ut(l, n, r, a, s);
}
function Ut(e, t = {}, n, r, o) {
  let { as: i = n, children: a, refName: s = "ref", ...l } = Rn(e, ["unmount", "static"]), u = e.ref !== void 0 ? { [s]: e.ref } : {}, c = typeof a == "function" ? a(t) : a;
  "className" in l && l.className && typeof l.className == "function" && (l.className = l.className(t)), l["aria-labelledby"] && l["aria-labelledby"] === l.id && (l["aria-labelledby"] = void 0);
  let p = {};
  if (t) {
    let d = !1, f = [];
    for (let [m, h] of Object.entries(t)) typeof h == "boolean" && (d = !0), h === !0 && f.push(m.replace(/([A-Z])/g, (g) => `-${g.toLowerCase()}`));
    if (d) {
      p["data-headlessui-state"] = f.join(" ");
      for (let m of f) p[`data-${m}`] = "";
    }
  }
  if (i === Oe && (Object.keys(Ve(l)).length > 0 || Object.keys(Ve(p)).length > 0)) if (!Os(c) || Array.isArray(c) && c.length > 1) {
    if (Object.keys(Ve(l)).length > 0) throw new Error(['Passing props on "Fragment"!', "", `The current component <${r} /> is rendering a "Fragment".`, "However we need to passthrough the following props:", Object.keys(Ve(l)).concat(Object.keys(Ve(p))).map((d) => `  - ${d}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".', "Render a single element as the child so that we can forward the props onto that element."].map((d) => `  - ${d}`).join(`
`)].join(`
`));
  } else {
    let d = c.props, f = d == null ? void 0 : d.className, m = typeof f == "function" ? (...y) => ir(f(...y), l.className) : ir(f, l.className), h = m ? { className: m } : {}, g = Wi(c.props, Ve(Rn(l, ["ref"])));
    for (let y in p) y in g && delete p[y];
    return Ss(c, Object.assign({}, g, p, u, { ref: o(il(c), u.ref) }, h));
  }
  return Ts(i, Object.assign({}, Rn(l, ["ref"]), i !== Oe && u, i !== Oe && p), c);
}
function rl() {
  let e = V([]), t = re((n) => {
    for (let r of e.current) r != null && (typeof r == "function" ? r(n) : r.current = n);
  }, []);
  return (...n) => {
    if (!n.every((r) => r == null)) return e.current = n, t;
  };
}
function ol(...e) {
  return e.every((t) => t == null) ? void 0 : (t) => {
    for (let n of e) n != null && (typeof n == "function" ? n(t) : n.current = t);
  };
}
function Wi(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let t = {}, n = {};
  for (let r of e) for (let o in r) o.startsWith("on") && typeof r[o] == "function" ? (n[o] != null || (n[o] = []), n[o].push(r[o])) : t[o] = r[o];
  if (t.disabled || t["aria-disabled"]) for (let r in n) /^(on(?:Click|Pointer|Mouse|Key)(?:Down|Up|Press)?)$/.test(r) && (n[r] = [(o) => {
    var i;
    return (i = o == null ? void 0 : o.preventDefault) == null ? void 0 : i.call(o);
  }]);
  for (let r in n) Object.assign(t, { [r](o, ...i) {
    let a = n[r];
    for (let s of a) {
      if ((o instanceof Event || (o == null ? void 0 : o.nativeEvent) instanceof Event) && o.defaultPrevented) return;
      s(o, ...i);
    }
  } });
  return t;
}
function zi(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let t = {}, n = {};
  for (let r of e) for (let o in r) o.startsWith("on") && typeof r[o] == "function" ? (n[o] != null || (n[o] = []), n[o].push(r[o])) : t[o] = r[o];
  for (let r in n) Object.assign(t, { [r](...o) {
    let i = n[r];
    for (let a of i) a == null || a(...o);
  } });
  return t;
}
function be(e) {
  var t;
  return Object.assign(Es(e), { displayName: (t = e.displayName) != null ? t : e.name });
}
function Ve(e) {
  let t = Object.assign({}, e);
  for (let n in t) t[n] === void 0 && delete t[n];
  return t;
}
function Rn(e, t = []) {
  let n = Object.assign({}, e);
  for (let r of t) r in n && delete n[r];
  return n;
}
function il(e) {
  return z.version.split(".")[0] >= "19" ? e.props.ref : e.ref;
}
function al(e, t, n) {
  let [r, o] = oe(n), i = e !== void 0, a = V(i), s = V(!1), l = V(!1);
  return i && !a.current && !s.current ? (s.current = !0, a.current = i, console.error("A component is changing from uncontrolled to controlled. This may be caused by the value changing from undefined to a defined value, which should not happen.")) : !i && a.current && !l.current && (l.current = !0, a.current = i, console.error("A component is changing from controlled to uncontrolled. This may be caused by the value changing from a defined value to undefined, which should not happen.")), [i ? e : r, X((u) => (i || o(u), t == null ? void 0 : t(u)))];
}
function sl(e) {
  let [t] = oe(e);
  return t;
}
function Bi(e = {}, t = null, n = []) {
  for (let [r, o] of Object.entries(e)) Vi(n, Ui(t, r), o);
  return n;
}
function Ui(e, t) {
  return e ? e + "[" + t + "]" : t;
}
function Vi(e, t, n) {
  if (Array.isArray(n)) for (let [r, o] of n.entries()) Vi(e, Ui(t, r.toString()), o);
  else n instanceof Date ? e.push([t, n.toISOString()]) : typeof n == "boolean" ? e.push([t, n ? "1" : "0"]) : typeof n == "string" ? e.push([t, n]) : typeof n == "number" ? e.push([t, `${n}`]) : n == null ? e.push([t, ""]) : Bi(n, t, e);
}
function ll(e) {
  var t, n;
  let r = (t = e == null ? void 0 : e.form) != null ? t : e.closest("form");
  if (r) {
    for (let o of r.elements) if (o !== e && (o.tagName === "INPUT" && o.type === "submit" || o.tagName === "BUTTON" && o.type === "submit" || o.nodeName === "INPUT" && o.type === "image")) {
      o.click();
      return;
    }
    (n = r.requestSubmit) == null || n.call(r);
  }
}
let ul = "span";
var Nr = ((e) => (e[e.None = 1] = "None", e[e.Focusable = 2] = "Focusable", e[e.Hidden = 4] = "Hidden", e))(Nr || {});
function cl(e, t) {
  var n;
  let { features: r = 1, ...o } = e, i = { ref: t, "aria-hidden": (r & 2) === 2 ? !0 : (n = o["aria-hidden"]) != null ? n : void 0, hidden: (r & 4) === 4 ? !0 : void 0, style: { position: "fixed", top: 1, left: 1, width: 1, height: 0, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: "0", ...(r & 4) === 4 && (r & 2) !== 2 && { display: "none" } } };
  return xe()({ ourProps: i, theirProps: o, slot: {}, defaultTag: ul, name: "Hidden" });
}
let Yi = be(cl), fl = ge(null);
function dl({ children: e }) {
  let t = le(fl);
  if (!t) return z.createElement(z.Fragment, null, e);
  let { target: n } = t;
  return n ? Pi(z.createElement(z.Fragment, null, e), n) : null;
}
function pl({ data: e, form: t, disabled: n, onReset: r, overrides: o }) {
  let [i, a] = oe(null), s = bt();
  return ue(() => {
    if (r && i) return s.addEventListener(i, "reset", r);
  }, [i, t, r]), z.createElement(dl, null, z.createElement(ml, { setForm: a, formId: t }), Bi(e).map(([l, u]) => z.createElement(Yi, { features: Nr.Hidden, ...Ve({ key: l, as: "input", type: "hidden", hidden: !0, readOnly: !0, form: t, disabled: n, name: l, value: u, ...o }) })));
}
function ml({ setForm: e, formId: t }) {
  return ue(() => {
    if (t) {
      let n = document.getElementById(t);
      n && e(n);
    }
  }, [e, t]), t ? null : z.createElement(Yi, { features: Nr.Hidden, as: "input", type: "hidden", hidden: !0, readOnly: !0, ref: (n) => {
    if (!n) return;
    let r = n.closest("form");
    r && e(r);
  } });
}
let hl = ge(void 0);
function Gi() {
  return le(hl);
}
function gl(e) {
  let t = e.parentElement, n = null;
  for (; t && !(t instanceof HTMLFieldSetElement); ) t instanceof HTMLLegendElement && (n = t), t = t.parentElement;
  let r = (t == null ? void 0 : t.getAttribute("disabled")) === "";
  return r && vl(n) ? !1 : r;
}
function vl(e) {
  if (!e) return !1;
  let t = e.previousElementSibling;
  for (; t !== null; ) {
    if (t instanceof HTMLLegendElement) return !1;
    t = t.previousElementSibling;
  }
  return !0;
}
let qi = Symbol();
function bl(e, t = !0) {
  return Object.assign(e, { [qi]: t });
}
function Se(...e) {
  let t = V(e);
  ue(() => {
    t.current = e;
  }, [e]);
  let n = X((r) => {
    for (let o of t.current) o != null && (typeof o == "function" ? o(r) : o.current = r);
  });
  return e.every((r) => r == null || (r == null ? void 0 : r[qi])) ? void 0 : n;
}
let jr = ge(null);
jr.displayName = "DescriptionContext";
function Ki() {
  let e = le(jr);
  if (e === null) {
    let t = new Error("You used a <Description /> component, but it is not inside a relevant parent.");
    throw Error.captureStackTrace && Error.captureStackTrace(t, Ki), t;
  }
  return e;
}
function yl() {
  var e, t;
  return (t = (e = le(jr)) == null ? void 0 : e.value) != null ? t : void 0;
}
let xl = "p";
function wl(e, t) {
  let n = vt(), r = Dr(), { id: o = `headlessui-description-${n}`, ...i } = e, a = Ki(), s = Se(t);
  ie(() => a.register(o), [o, a.register]);
  let l = r || !1, u = se(() => ({ ...a.slot, disabled: l }), [a.slot, l]), c = { ref: s, ...a.props, id: o };
  return xe()({ ourProps: c, theirProps: i, slot: u, defaultTag: xl, name: a.name || "Description" });
}
let El = be(wl);
Object.assign(El, {});
var ce = ((e) => (e.Space = " ", e.Enter = "Enter", e.Escape = "Escape", e.Backspace = "Backspace", e.Delete = "Delete", e.ArrowLeft = "ArrowLeft", e.ArrowUp = "ArrowUp", e.ArrowRight = "ArrowRight", e.ArrowDown = "ArrowDown", e.Home = "Home", e.End = "End", e.PageUp = "PageUp", e.PageDown = "PageDown", e.Tab = "Tab", e))(ce || {});
let pn = ge(null);
pn.displayName = "LabelContext";
function Xi() {
  let e = le(pn);
  if (e === null) {
    let t = new Error("You used a <Label /> component, but it is not inside a relevant parent.");
    throw Error.captureStackTrace && Error.captureStackTrace(t, Xi), t;
  }
  return e;
}
function Qi(e) {
  var t, n, r;
  let o = (n = (t = le(pn)) == null ? void 0 : t.value) != null ? n : void 0;
  return ((r = e == null ? void 0 : e.length) != null ? r : 0) > 0 ? [o, ...e].filter(Boolean).join(" ") : o;
}
function Ol({ inherit: e = !1 } = {}) {
  let t = Qi(), [n, r] = oe([]), o = e ? [t, ...n].filter(Boolean) : n;
  return [o.length > 0 ? o.join(" ") : void 0, se(() => function(i) {
    let a = X((l) => (r((u) => [...u, l]), () => r((u) => {
      let c = u.slice(), p = c.indexOf(l);
      return p !== -1 && c.splice(p, 1), c;
    }))), s = se(() => ({ register: a, slot: i.slot, name: i.name, props: i.props, value: i.value }), [a, i.slot, i.name, i.props, i.value]);
    return z.createElement(pn.Provider, { value: s }, i.children);
  }, [r])];
}
let Sl = "label";
function Tl(e, t) {
  var n;
  let r = vt(), o = Xi(), i = Gi(), a = Dr(), { id: s = `headlessui-label-${r}`, htmlFor: l = i ?? ((n = o.props) == null ? void 0 : n.htmlFor), passive: u = !1, ...c } = e, p = Se(t);
  ie(() => o.register(s), [s, o.register]);
  let d = X((g) => {
    let y = g.currentTarget;
    if (y instanceof HTMLLabelElement && g.preventDefault(), o.props && "onClick" in o.props && typeof o.props.onClick == "function" && o.props.onClick(g), y instanceof HTMLLabelElement) {
      let w = document.getElementById(y.htmlFor);
      if (w) {
        let b = w.getAttribute("disabled");
        if (b === "true" || b === "") return;
        let E = w.getAttribute("aria-disabled");
        if (E === "true" || E === "") return;
        (w instanceof HTMLInputElement && (w.type === "radio" || w.type === "checkbox") || w.role === "radio" || w.role === "checkbox" || w.role === "switch") && w.click(), w.focus({ preventScroll: !0 });
      }
    }
  }), f = a || !1, m = se(() => ({ ...o.slot, disabled: f }), [o.slot, f]), h = { ref: p, ...o.props, id: s, htmlFor: l, onClick: d };
  return u && ("onClick" in h && (delete h.htmlFor, delete h.onClick), "onClick" in c && delete c.onClick), xe()({ ourProps: h, theirProps: c, slot: m, defaultTag: l ? Sl : "div", name: o.name || "Label" });
}
let Al = be(Tl), Pl = Object.assign(Al, {});
function Cl(e, t) {
  return e !== null && t !== null && typeof e == "object" && typeof t == "object" && "id" in e && "id" in t ? e.id === t.id : e === t;
}
function $l(e = Cl) {
  return re((t, n) => {
    if (typeof e == "string") {
      let r = e;
      return (t == null ? void 0 : t[r]) === (n == null ? void 0 : n[r]);
    }
    return e(t, n);
  }, [e]);
}
function Rl(e) {
  if (e === null) return { width: 0, height: 0 };
  let { width: t, height: n } = e.getBoundingClientRect();
  return { width: t, height: n };
}
function Ll(e, t = !1) {
  let [n, r] = As(() => ({}), {}), o = se(() => Rl(e), [e, n]);
  return ie(() => {
    if (!e) return;
    let i = new ResizeObserver(r);
    return i.observe(e), () => {
      i.disconnect();
    };
  }, [e]), t ? { width: `${o.width}px`, height: `${o.height}px` } : o;
}
let Ji = class extends Map {
  constructor(t) {
    super(), this.factory = t;
  }
  get(t) {
    let n = super.get(t);
    return n === void 0 && (n = this.factory(t), this.set(t, n)), n;
  }
};
function Zi(e, t) {
  let n = e(), r = /* @__PURE__ */ new Set();
  return { getSnapshot() {
    return n;
  }, subscribe(o) {
    return r.add(o), () => r.delete(o);
  }, dispatch(o, ...i) {
    let a = t[o].call(n, ...i);
    a && (n = a, r.forEach((s) => s()));
  } };
}
function ea(e) {
  return Ps(e.subscribe, e.getSnapshot, e.getSnapshot);
}
let Fl = new Ji(() => Zi(() => [], { ADD(e) {
  return this.includes(e) ? this : [...this, e];
}, REMOVE(e) {
  let t = this.indexOf(e);
  if (t === -1) return this;
  let n = this.slice();
  return n.splice(t, 1), n;
} }));
function Hr(e, t) {
  let n = Fl.get(t), r = vt(), o = ea(n);
  if (ie(() => {
    if (e) return n.dispatch("ADD", r), () => n.dispatch("REMOVE", r);
  }, [n, e]), !e) return !1;
  let i = o.indexOf(r), a = o.length;
  return i === -1 && (i = a, a += 1), i === a - 1;
}
let ar = /* @__PURE__ */ new Map(), Ct = /* @__PURE__ */ new Map();
function po(e) {
  var t;
  let n = (t = Ct.get(e)) != null ? t : 0;
  return Ct.set(e, n + 1), n !== 0 ? () => mo(e) : (ar.set(e, { "aria-hidden": e.getAttribute("aria-hidden"), inert: e.inert }), e.setAttribute("aria-hidden", "true"), e.inert = !0, () => mo(e));
}
function mo(e) {
  var t;
  let n = (t = Ct.get(e)) != null ? t : 1;
  if (n === 1 ? Ct.delete(e) : Ct.set(e, n - 1), n !== 1) return;
  let r = ar.get(e);
  r && (r["aria-hidden"] === null ? e.removeAttribute("aria-hidden") : e.setAttribute("aria-hidden", r["aria-hidden"]), e.inert = r.inert, ar.delete(e));
}
function Il(e, { allowed: t, disallowed: n } = {}) {
  let r = Hr(e, "inert-others");
  ie(() => {
    var o, i;
    if (!r) return;
    let a = Ne();
    for (let l of (o = n == null ? void 0 : n()) != null ? o : []) l && a.add(po(l));
    let s = (i = t == null ? void 0 : t()) != null ? i : [];
    for (let l of s) {
      if (!l) continue;
      let u = Dt(l);
      if (!u) continue;
      let c = l.parentElement;
      for (; c && c !== u.body; ) {
        for (let p of c.children) s.some((d) => p.contains(d)) || a.add(po(p));
        c = c.parentElement;
      }
    }
    return a.dispose;
  }, [r, t, n]);
}
function kl(e, t, n) {
  let r = ct((o) => {
    let i = o.getBoundingClientRect();
    i.x === 0 && i.y === 0 && i.width === 0 && i.height === 0 && n();
  });
  ue(() => {
    if (!e) return;
    let o = t === null ? null : t instanceof HTMLElement ? t : t.current;
    if (!o) return;
    let i = Ne();
    if (typeof ResizeObserver < "u") {
      let a = new ResizeObserver(() => r.current(o));
      a.observe(o), i.add(() => a.disconnect());
    }
    if (typeof IntersectionObserver < "u") {
      let a = new IntersectionObserver(() => r.current(o));
      a.observe(o), i.add(() => a.disconnect());
    }
    return () => i.dispose();
  }, [t, r, e]);
}
let sr = ["[contentEditable=true]", "[tabindex]", "a[href]", "area[href]", "button:not([disabled])", "iframe", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])"].map((e) => `${e}:not([tabindex='-1'])`).join(","), Ml = ["[data-autofocus]"].map((e) => `${e}:not([tabindex='-1'])`).join(",");
var lr = ((e) => (e[e.First = 1] = "First", e[e.Previous = 2] = "Previous", e[e.Next = 4] = "Next", e[e.Last = 8] = "Last", e[e.WrapAround = 16] = "WrapAround", e[e.NoScroll = 32] = "NoScroll", e[e.AutoFocus = 64] = "AutoFocus", e))(lr || {}), _l = ((e) => (e[e.Error = 0] = "Error", e[e.Overflow = 1] = "Overflow", e[e.Success = 2] = "Success", e[e.Underflow = 3] = "Underflow", e))(_l || {}), Dl = ((e) => (e[e.Previous = -1] = "Previous", e[e.Next = 1] = "Next", e))(Dl || {});
function ta(e = document.body) {
  return e == null ? [] : Array.from(e.querySelectorAll(sr)).sort((t, n) => Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (n.tabIndex || Number.MAX_SAFE_INTEGER)));
}
function Nl(e = document.body) {
  return e == null ? [] : Array.from(e.querySelectorAll(Ml)).sort((t, n) => Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (n.tabIndex || Number.MAX_SAFE_INTEGER)));
}
var Wr = ((e) => (e[e.Strict = 0] = "Strict", e[e.Loose = 1] = "Loose", e))(Wr || {});
function na(e, t = 0) {
  var n;
  return e === ((n = Dt(e)) == null ? void 0 : n.body) ? !1 : Ce(t, { 0() {
    return e.matches(sr);
  }, 1() {
    let r = e;
    for (; r !== null; ) {
      if (r.matches(sr)) return !0;
      r = r.parentElement;
    }
    return !1;
  } });
}
var jl = ((e) => (e[e.Keyboard = 0] = "Keyboard", e[e.Mouse = 1] = "Mouse", e))(jl || {});
typeof window < "u" && typeof document < "u" && (document.addEventListener("keydown", (e) => {
  e.metaKey || e.altKey || e.ctrlKey || (document.documentElement.dataset.headlessuiFocusVisible = "");
}, !0), document.addEventListener("click", (e) => {
  e.detail === 1 ? delete document.documentElement.dataset.headlessuiFocusVisible : e.detail === 0 && (document.documentElement.dataset.headlessuiFocusVisible = "");
}, !0));
let Hl = ["textarea", "input"].join(",");
function Wl(e) {
  var t, n;
  return (n = (t = e == null ? void 0 : e.matches) == null ? void 0 : t.call(e, Hl)) != null ? n : !1;
}
function ra(e, t = (n) => n) {
  return e.slice().sort((n, r) => {
    let o = t(n), i = t(r);
    if (o === null || i === null) return 0;
    let a = o.compareDocumentPosition(i);
    return a & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : a & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
  });
}
function zl(e, t) {
  return Bl(ta(), t, { relativeTo: e });
}
function Bl(e, t, { sorted: n = !0, relativeTo: r = null, skipElements: o = [] } = {}) {
  let i = Array.isArray(e) ? e.length > 0 ? e[0].ownerDocument : document : e.ownerDocument, a = Array.isArray(e) ? n ? ra(e) : e : t & 64 ? Nl(e) : ta(e);
  o.length > 0 && a.length > 1 && (a = a.filter((f) => !o.some((m) => m != null && "current" in m ? (m == null ? void 0 : m.current) === f : m === f))), r = r ?? i.activeElement;
  let s = (() => {
    if (t & 5) return 1;
    if (t & 10) return -1;
    throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last");
  })(), l = (() => {
    if (t & 1) return 0;
    if (t & 2) return Math.max(0, a.indexOf(r)) - 1;
    if (t & 4) return Math.max(0, a.indexOf(r)) + 1;
    if (t & 8) return a.length - 1;
    throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last");
  })(), u = t & 32 ? { preventScroll: !0 } : {}, c = 0, p = a.length, d;
  do {
    if (c >= p || c + p <= 0) return 0;
    let f = l + c;
    if (t & 16) f = (f + p) % p;
    else {
      if (f < 0) return 3;
      if (f >= p) return 1;
    }
    d = a[f], d == null || d.focus(u), c += s;
  } while (d !== i.activeElement);
  return t & 6 && Wl(d) && d.select(), 2;
}
function oa() {
  return /iPhone/gi.test(window.navigator.platform) || /Mac/gi.test(window.navigator.platform) && window.navigator.maxTouchPoints > 0;
}
function Ul() {
  return /Android/gi.test(window.navigator.userAgent);
}
function Vl() {
  return oa() || Ul();
}
function Ot(e, t, n, r) {
  let o = ct(n);
  ue(() => {
    if (!e) return;
    function i(a) {
      o.current(a);
    }
    return document.addEventListener(t, i, r), () => document.removeEventListener(t, i, r);
  }, [e, t, r]);
}
function Yl(e, t, n, r) {
  let o = ct(n);
  ue(() => {
    if (!e) return;
    function i(a) {
      o.current(a);
    }
    return window.addEventListener(t, i, r), () => window.removeEventListener(t, i, r);
  }, [e, t, r]);
}
const ho = 30;
function Gl(e, t, n) {
  let r = Hr(e, "outside-click"), o = ct(n), i = re(function(l, u) {
    if (l.defaultPrevented) return;
    let c = u(l);
    if (c === null || !c.getRootNode().contains(c) || !c.isConnected) return;
    let p = function d(f) {
      return typeof f == "function" ? d(f()) : Array.isArray(f) || f instanceof Set ? f : [f];
    }(t);
    for (let d of p) if (d !== null && (d.contains(c) || l.composed && l.composedPath().includes(d))) return;
    return !na(c, Wr.Loose) && c.tabIndex !== -1 && l.preventDefault(), o.current(l, c);
  }, [o, t]), a = V(null);
  Ot(r, "pointerdown", (l) => {
    var u, c;
    a.current = ((c = (u = l.composedPath) == null ? void 0 : u.call(l)) == null ? void 0 : c[0]) || l.target;
  }, !0), Ot(r, "mousedown", (l) => {
    var u, c;
    a.current = ((c = (u = l.composedPath) == null ? void 0 : u.call(l)) == null ? void 0 : c[0]) || l.target;
  }, !0), Ot(r, "click", (l) => {
    Vl() || a.current && (i(l, () => a.current), a.current = null);
  }, !0);
  let s = V({ x: 0, y: 0 });
  Ot(r, "touchstart", (l) => {
    s.current.x = l.touches[0].clientX, s.current.y = l.touches[0].clientY;
  }, !0), Ot(r, "touchend", (l) => {
    let u = { x: l.changedTouches[0].clientX, y: l.changedTouches[0].clientY };
    if (!(Math.abs(u.x - s.current.x) >= ho || Math.abs(u.y - s.current.y) >= ho)) return i(l, () => l.target instanceof HTMLElement ? l.target : null);
  }, !0), Yl(r, "blur", (l) => i(l, () => window.document.activeElement instanceof HTMLIFrameElement ? window.document.activeElement : null), !0);
}
function ur(...e) {
  return se(() => Dt(...e), [...e]);
}
function ql(e, t) {
  return se(() => {
    var n;
    if (e.type) return e.type;
    let r = (n = e.as) != null ? n : "button";
    if (typeof r == "string" && r.toLowerCase() === "button" || (t == null ? void 0 : t.tagName) === "BUTTON" && !t.hasAttribute("type")) return "button";
  }, [e.type, e.as, t]);
}
function Kl() {
  let e;
  return { before({ doc: t }) {
    var n;
    let r = t.documentElement, o = (n = t.defaultView) != null ? n : window;
    e = Math.max(0, o.innerWidth - r.clientWidth);
  }, after({ doc: t, d: n }) {
    let r = t.documentElement, o = Math.max(0, r.clientWidth - r.offsetWidth), i = Math.max(0, e - o);
    n.style(r, "paddingRight", `${i}px`);
  } };
}
function Xl() {
  return oa() ? { before({ doc: e, d: t, meta: n }) {
    function r(o) {
      return n.containers.flatMap((i) => i()).some((i) => i.contains(o));
    }
    t.microTask(() => {
      var o;
      if (window.getComputedStyle(e.documentElement).scrollBehavior !== "auto") {
        let s = Ne();
        s.style(e.documentElement, "scrollBehavior", "auto"), t.add(() => t.microTask(() => s.dispose()));
      }
      let i = (o = window.scrollY) != null ? o : window.pageYOffset, a = null;
      t.addEventListener(e, "click", (s) => {
        if (s.target instanceof HTMLElement) try {
          let l = s.target.closest("a");
          if (!l) return;
          let { hash: u } = new URL(l.href), c = e.querySelector(u);
          c && !r(c) && (a = c);
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
        i !== l && window.scrollTo(0, i), a && a.isConnected && (a.scrollIntoView({ block: "nearest" }), a = null);
      });
    });
  } } : {};
}
function Ql() {
  return { before({ doc: e, d: t }) {
    t.style(e.documentElement, "overflow", "hidden");
  } };
}
function Jl(e) {
  let t = {};
  for (let n of e) Object.assign(t, n(t));
  return t;
}
let et = Zi(() => /* @__PURE__ */ new Map(), { PUSH(e, t) {
  var n;
  let r = (n = this.get(e)) != null ? n : { doc: e, count: 0, d: Ne(), meta: /* @__PURE__ */ new Set() };
  return r.count++, r.meta.add(t), this.set(e, r), this;
}, POP(e, t) {
  let n = this.get(e);
  return n && (n.count--, n.meta.delete(t)), this;
}, SCROLL_PREVENT({ doc: e, d: t, meta: n }) {
  let r = { doc: e, d: t, meta: Jl(n) }, o = [Xl(), Kl(), Ql()];
  o.forEach(({ before: i }) => i == null ? void 0 : i(r)), o.forEach(({ after: i }) => i == null ? void 0 : i(r));
}, SCROLL_ALLOW({ d: e }) {
  e.dispose();
}, TEARDOWN({ doc: e }) {
  this.delete(e);
} });
et.subscribe(() => {
  let e = et.getSnapshot(), t = /* @__PURE__ */ new Map();
  for (let [n] of e) t.set(n, n.documentElement.style.overflow);
  for (let n of e.values()) {
    let r = t.get(n.doc) === "hidden", o = n.count !== 0;
    (o && !r || !o && r) && et.dispatch(n.count > 0 ? "SCROLL_PREVENT" : "SCROLL_ALLOW", n), n.count === 0 && et.dispatch("TEARDOWN", n);
  }
});
function Zl(e, t, n = () => ({ containers: [] })) {
  let r = ea(et), o = t ? r.get(t) : void 0, i = o ? o.count > 0 : !1;
  return ie(() => {
    if (!(!t || !e)) return et.dispatch("PUSH", t, n), () => et.dispatch("POP", t, n);
  }, [e, t]), i;
}
function eu(e, t, n = () => [document.body]) {
  let r = Hr(e, "scroll-lock");
  Zl(r, t, (o) => {
    var i;
    return { containers: [...(i = o.containers) != null ? i : [], n] };
  });
}
function go(e) {
  return [e.screenX, e.screenY];
}
function tu() {
  let e = V([-1, -1]);
  return { wasMoved(t) {
    let n = go(t);
    return e.current[0] === n[0] && e.current[1] === n[1] ? !1 : (e.current = n, !0);
  }, update(t) {
    e.current = go(t);
  } };
}
function nu(e = 0) {
  let [t, n] = oe(e), r = re((l) => n(l), [t]), o = re((l) => n((u) => u | l), [t]), i = re((l) => (t & l) === l, [t]), a = re((l) => n((u) => u & ~l), [n]), s = re((l) => n((u) => u ^ l), [n]);
  return { flags: t, setFlag: r, addFlag: o, hasFlag: i, removeFlag: a, toggleFlag: s };
}
var vo, bo;
typeof process < "u" && typeof globalThis < "u" && typeof Element < "u" && ((vo = process == null ? void 0 : process.env) == null ? void 0 : vo.NODE_ENV) === "test" && typeof ((bo = Element == null ? void 0 : Element.prototype) == null ? void 0 : bo.getAnimations) > "u" && (Element.prototype.getAnimations = function() {
  return console.warn(["Headless UI has polyfilled `Element.prototype.getAnimations` for your tests.", "Please install a proper polyfill e.g. `jsdom-testing-mocks`, to silence these warnings.", "", "Example usage:", "```js", "import { mockAnimationsApi } from 'jsdom-testing-mocks'", "mockAnimationsApi()", "```"].join(`
`)), [];
});
var ru = ((e) => (e[e.None = 0] = "None", e[e.Closed = 1] = "Closed", e[e.Enter = 2] = "Enter", e[e.Leave = 4] = "Leave", e))(ru || {});
function ia(e) {
  let t = {};
  for (let n in e) e[n] === !0 && (t[`data-${n}`] = "");
  return t;
}
function aa(e, t, n, r) {
  let [o, i] = oe(n), { hasFlag: a, addFlag: s, removeFlag: l } = nu(e && o ? 3 : 0), u = V(!1), c = V(!1), p = bt();
  return ie(() => {
    var d;
    if (e) {
      if (n && i(!0), !t) {
        n && s(3);
        return;
      }
      return (d = r == null ? void 0 : r.start) == null || d.call(r, n), ou(t, { inFlight: u, prepare() {
        c.current ? c.current = !1 : c.current = u.current, u.current = !0, !c.current && (n ? (s(3), l(4)) : (s(4), l(2)));
      }, run() {
        c.current ? n ? (l(3), s(4)) : (l(4), s(3)) : n ? l(1) : s(1);
      }, done() {
        var f;
        c.current && typeof t.getAnimations == "function" && t.getAnimations().length > 0 || (u.current = !1, l(7), n || i(!1), (f = r == null ? void 0 : r.end) == null || f.call(r, n));
      } });
    }
  }, [e, n, t, p]), e ? [o, { closed: a(1), enter: a(2), leave: a(4), transition: a(2) || a(4) }] : [n, { closed: void 0, enter: void 0, leave: void 0, transition: void 0 }];
}
function ou(e, { prepare: t, run: n, done: r, inFlight: o }) {
  let i = Ne();
  return au(e, { prepare: t, inFlight: o }), i.nextFrame(() => {
    n(), i.requestAnimationFrame(() => {
      i.add(iu(e, r));
    });
  }), i.dispose;
}
function iu(e, t) {
  var n, r;
  let o = Ne();
  if (!e) return o.dispose;
  let i = !1;
  o.add(() => {
    i = !0;
  });
  let a = (r = (n = e.getAnimations) == null ? void 0 : n.call(e).filter((s) => s instanceof CSSTransition)) != null ? r : [];
  return a.length === 0 ? (t(), o.dispose) : (Promise.allSettled(a.map((s) => s.finished)).then(() => {
    i || t();
  }), o.dispose);
}
function au(e, { inFlight: t, prepare: n }) {
  if (t != null && t.current) {
    n();
    return;
  }
  let r = e.style.transition;
  e.style.transition = "none", n(), e.offsetHeight, e.style.transition = r;
}
function mn() {
  return typeof window < "u";
}
function yt(e) {
  return sa(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function ye(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function je(e) {
  var t;
  return (t = (sa(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function sa(e) {
  return mn() ? e instanceof Node || e instanceof ye(e).Node : !1;
}
function me(e) {
  return mn() ? e instanceof Element || e instanceof ye(e).Element : !1;
}
function De(e) {
  return mn() ? e instanceof HTMLElement || e instanceof ye(e).HTMLElement : !1;
}
function yo(e) {
  return !mn() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof ye(e).ShadowRoot;
}
function Nt(e) {
  const {
    overflow: t,
    overflowX: n,
    overflowY: r,
    display: o
  } = $e(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !["inline", "contents"].includes(o);
}
function su(e) {
  return ["table", "td", "th"].includes(yt(e));
}
function hn(e) {
  return [":popover-open", ":modal"].some((t) => {
    try {
      return e.matches(t);
    } catch {
      return !1;
    }
  });
}
function zr(e) {
  const t = Br(), n = me(e) ? $e(e) : e;
  return ["transform", "translate", "scale", "rotate", "perspective"].some((r) => n[r] ? n[r] !== "none" : !1) || (n.containerType ? n.containerType !== "normal" : !1) || !t && (n.backdropFilter ? n.backdropFilter !== "none" : !1) || !t && (n.filter ? n.filter !== "none" : !1) || ["transform", "translate", "scale", "rotate", "perspective", "filter"].some((r) => (n.willChange || "").includes(r)) || ["paint", "layout", "strict", "content"].some((r) => (n.contain || "").includes(r));
}
function lu(e) {
  let t = Ge(e);
  for (; De(t) && !ht(t); ) {
    if (zr(t))
      return t;
    if (hn(t))
      return null;
    t = Ge(t);
  }
  return null;
}
function Br() {
  return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
function ht(e) {
  return ["html", "body", "#document"].includes(yt(e));
}
function $e(e) {
  return ye(e).getComputedStyle(e);
}
function gn(e) {
  return me(e) ? {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  } : {
    scrollLeft: e.scrollX,
    scrollTop: e.scrollY
  };
}
function Ge(e) {
  if (yt(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    yo(e) && e.host || // Fallback.
    je(e)
  );
  return yo(t) ? t.host : t;
}
function la(e) {
  const t = Ge(e);
  return ht(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : De(t) && Nt(t) ? t : la(t);
}
function Lt(e, t, n) {
  var r;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const o = la(e), i = o === ((r = e.ownerDocument) == null ? void 0 : r.body), a = ye(o);
  if (i) {
    const s = cr(a);
    return t.concat(a, a.visualViewport || [], Nt(o) ? o : [], s && n ? Lt(s) : []);
  }
  return t.concat(o, Lt(o, [], n));
}
function cr(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function uu() {
  const e = navigator.userAgentData;
  return e && Array.isArray(e.brands) ? e.brands.map((t) => {
    let {
      brand: n,
      version: r
    } = t;
    return n + "/" + r;
  }).join(" ") : navigator.userAgent;
}
const it = Math.min, pe = Math.max, Ft = Math.round, Vt = Math.floor, _e = (e) => ({
  x: e,
  y: e
}), cu = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, fu = {
  start: "end",
  end: "start"
};
function xo(e, t, n) {
  return pe(e, it(t, n));
}
function xt(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function qe(e) {
  return e.split("-")[0];
}
function jt(e) {
  return e.split("-")[1];
}
function ua(e) {
  return e === "x" ? "y" : "x";
}
function ca(e) {
  return e === "y" ? "height" : "width";
}
function at(e) {
  return ["top", "bottom"].includes(qe(e)) ? "y" : "x";
}
function fa(e) {
  return ua(at(e));
}
function du(e, t, n) {
  n === void 0 && (n = !1);
  const r = jt(e), o = fa(e), i = ca(o);
  let a = o === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return t.reference[i] > t.floating[i] && (a = an(a)), [a, an(a)];
}
function pu(e) {
  const t = an(e);
  return [fr(e), t, fr(t)];
}
function fr(e) {
  return e.replace(/start|end/g, (t) => fu[t]);
}
function mu(e, t, n) {
  const r = ["left", "right"], o = ["right", "left"], i = ["top", "bottom"], a = ["bottom", "top"];
  switch (e) {
    case "top":
    case "bottom":
      return n ? t ? o : r : t ? r : o;
    case "left":
    case "right":
      return t ? i : a;
    default:
      return [];
  }
}
function hu(e, t, n, r) {
  const o = jt(e);
  let i = mu(qe(e), n === "start", r);
  return o && (i = i.map((a) => a + "-" + o), t && (i = i.concat(i.map(fr)))), i;
}
function an(e) {
  return e.replace(/left|right|bottom|top/g, (t) => cu[t]);
}
function gu(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function vu(e) {
  return typeof e != "number" ? gu(e) : {
    top: e,
    right: e,
    bottom: e,
    left: e
  };
}
function sn(e) {
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
function wo(e, t, n) {
  let {
    reference: r,
    floating: o
  } = e;
  const i = at(t), a = fa(t), s = ca(a), l = qe(t), u = i === "y", c = r.x + r.width / 2 - o.width / 2, p = r.y + r.height / 2 - o.height / 2, d = r[s] / 2 - o[s] / 2;
  let f;
  switch (l) {
    case "top":
      f = {
        x: c,
        y: r.y - o.height
      };
      break;
    case "bottom":
      f = {
        x: c,
        y: r.y + r.height
      };
      break;
    case "right":
      f = {
        x: r.x + r.width,
        y: p
      };
      break;
    case "left":
      f = {
        x: r.x - o.width,
        y: p
      };
      break;
    default:
      f = {
        x: r.x,
        y: r.y
      };
  }
  switch (jt(t)) {
    case "start":
      f[a] -= d * (n && u ? -1 : 1);
      break;
    case "end":
      f[a] += d * (n && u ? -1 : 1);
      break;
  }
  return f;
}
const bu = async (e, t, n) => {
  const {
    placement: r = "bottom",
    strategy: o = "absolute",
    middleware: i = [],
    platform: a
  } = n, s = i.filter(Boolean), l = await (a.isRTL == null ? void 0 : a.isRTL(t));
  let u = await a.getElementRects({
    reference: e,
    floating: t,
    strategy: o
  }), {
    x: c,
    y: p
  } = wo(u, r, l), d = r, f = {}, m = 0;
  for (let h = 0; h < s.length; h++) {
    const {
      name: g,
      fn: y
    } = s[h], {
      x: w,
      y: b,
      data: E,
      reset: v
    } = await y({
      x: c,
      y: p,
      initialPlacement: r,
      placement: d,
      strategy: o,
      middlewareData: f,
      rects: u,
      platform: a,
      elements: {
        reference: e,
        floating: t
      }
    });
    c = w ?? c, p = b ?? p, f = {
      ...f,
      [g]: {
        ...f[g],
        ...E
      }
    }, v && m <= 50 && (m++, typeof v == "object" && (v.placement && (d = v.placement), v.rects && (u = v.rects === !0 ? await a.getElementRects({
      reference: e,
      floating: t,
      strategy: o
    }) : v.rects), {
      x: c,
      y: p
    } = wo(u, d, l)), h = -1);
  }
  return {
    x: c,
    y: p,
    placement: d,
    strategy: o,
    middlewareData: f
  };
};
async function vn(e, t) {
  var n;
  t === void 0 && (t = {});
  const {
    x: r,
    y: o,
    platform: i,
    rects: a,
    elements: s,
    strategy: l
  } = e, {
    boundary: u = "clippingAncestors",
    rootBoundary: c = "viewport",
    elementContext: p = "floating",
    altBoundary: d = !1,
    padding: f = 0
  } = xt(t, e), m = vu(f), g = s[d ? p === "floating" ? "reference" : "floating" : p], y = sn(await i.getClippingRect({
    element: (n = await (i.isElement == null ? void 0 : i.isElement(g))) == null || n ? g : g.contextElement || await (i.getDocumentElement == null ? void 0 : i.getDocumentElement(s.floating)),
    boundary: u,
    rootBoundary: c,
    strategy: l
  })), w = p === "floating" ? {
    x: r,
    y: o,
    width: a.floating.width,
    height: a.floating.height
  } : a.reference, b = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(s.floating)), E = await (i.isElement == null ? void 0 : i.isElement(b)) ? await (i.getScale == null ? void 0 : i.getScale(b)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, v = sn(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements: s,
    rect: w,
    offsetParent: b,
    strategy: l
  }) : w);
  return {
    top: (y.top - v.top + m.top) / E.y,
    bottom: (v.bottom - y.bottom + m.bottom) / E.y,
    left: (y.left - v.left + m.left) / E.x,
    right: (v.right - y.right + m.right) / E.x
  };
}
const yu = function(e) {
  return e === void 0 && (e = {}), {
    name: "flip",
    options: e,
    async fn(t) {
      var n, r;
      const {
        placement: o,
        middlewareData: i,
        rects: a,
        initialPlacement: s,
        platform: l,
        elements: u
      } = t, {
        mainAxis: c = !0,
        crossAxis: p = !0,
        fallbackPlacements: d,
        fallbackStrategy: f = "bestFit",
        fallbackAxisSideDirection: m = "none",
        flipAlignment: h = !0,
        ...g
      } = xt(e, t);
      if ((n = i.arrow) != null && n.alignmentOffset)
        return {};
      const y = qe(o), w = at(s), b = qe(s) === s, E = await (l.isRTL == null ? void 0 : l.isRTL(u.floating)), v = d || (b || !h ? [an(s)] : pu(s)), P = m !== "none";
      !d && P && v.push(...hu(s, h, m, E));
      const $ = [s, ...v], Y = await vn(t, g), J = [];
      let C = ((r = i.flip) == null ? void 0 : r.overflows) || [];
      if (c && J.push(Y[y]), p) {
        const F = du(o, a, E);
        J.push(Y[F[0]], Y[F[1]]);
      }
      if (C = [...C, {
        placement: o,
        overflows: J
      }], !J.every((F) => F <= 0)) {
        var N, Q;
        const F = (((N = i.flip) == null ? void 0 : N.index) || 0) + 1, ae = $[F];
        if (ae)
          return {
            data: {
              index: F,
              overflows: C
            },
            reset: {
              placement: ae
            }
          };
        let G = (Q = C.filter((te) => te.overflows[0] <= 0).sort((te, H) => te.overflows[1] - H.overflows[1])[0]) == null ? void 0 : Q.placement;
        if (!G)
          switch (f) {
            case "bestFit": {
              var K;
              const te = (K = C.filter((H) => {
                if (P) {
                  const q = at(H.placement);
                  return q === w || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  q === "y";
                }
                return !0;
              }).map((H) => [H.placement, H.overflows.filter((q) => q > 0).reduce((q, x) => q + x, 0)]).sort((H, q) => H[1] - q[1])[0]) == null ? void 0 : K[0];
              te && (G = te);
              break;
            }
            case "initialPlacement":
              G = s;
              break;
          }
        if (o !== G)
          return {
            reset: {
              placement: G
            }
          };
      }
      return {};
    }
  };
};
async function xu(e, t) {
  const {
    placement: n,
    platform: r,
    elements: o
  } = e, i = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)), a = qe(n), s = jt(n), l = at(n) === "y", u = ["left", "top"].includes(a) ? -1 : 1, c = i && l ? -1 : 1, p = xt(t, e);
  let {
    mainAxis: d,
    crossAxis: f,
    alignmentAxis: m
  } = typeof p == "number" ? {
    mainAxis: p,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: p.mainAxis || 0,
    crossAxis: p.crossAxis || 0,
    alignmentAxis: p.alignmentAxis
  };
  return s && typeof m == "number" && (f = s === "end" ? m * -1 : m), l ? {
    x: f * c,
    y: d * u
  } : {
    x: d * u,
    y: f * c
  };
}
const wu = function(e) {
  return e === void 0 && (e = 0), {
    name: "offset",
    options: e,
    async fn(t) {
      var n, r;
      const {
        x: o,
        y: i,
        placement: a,
        middlewareData: s
      } = t, l = await xu(t, e);
      return a === ((n = s.offset) == null ? void 0 : n.placement) && (r = s.arrow) != null && r.alignmentOffset ? {} : {
        x: o + l.x,
        y: i + l.y,
        data: {
          ...l,
          placement: a
        }
      };
    }
  };
}, Eu = function(e) {
  return e === void 0 && (e = {}), {
    name: "shift",
    options: e,
    async fn(t) {
      const {
        x: n,
        y: r,
        placement: o
      } = t, {
        mainAxis: i = !0,
        crossAxis: a = !1,
        limiter: s = {
          fn: (g) => {
            let {
              x: y,
              y: w
            } = g;
            return {
              x: y,
              y: w
            };
          }
        },
        ...l
      } = xt(e, t), u = {
        x: n,
        y: r
      }, c = await vn(t, l), p = at(qe(o)), d = ua(p);
      let f = u[d], m = u[p];
      if (i) {
        const g = d === "y" ? "top" : "left", y = d === "y" ? "bottom" : "right", w = f + c[g], b = f - c[y];
        f = xo(w, f, b);
      }
      if (a) {
        const g = p === "y" ? "top" : "left", y = p === "y" ? "bottom" : "right", w = m + c[g], b = m - c[y];
        m = xo(w, m, b);
      }
      const h = s.fn({
        ...t,
        [d]: f,
        [p]: m
      });
      return {
        ...h,
        data: {
          x: h.x - n,
          y: h.y - r,
          enabled: {
            [d]: i,
            [p]: a
          }
        }
      };
    }
  };
}, Ou = function(e) {
  return e === void 0 && (e = {}), {
    name: "size",
    options: e,
    async fn(t) {
      var n, r;
      const {
        placement: o,
        rects: i,
        platform: a,
        elements: s
      } = t, {
        apply: l = () => {
        },
        ...u
      } = xt(e, t), c = await vn(t, u), p = qe(o), d = jt(o), f = at(o) === "y", {
        width: m,
        height: h
      } = i.floating;
      let g, y;
      p === "top" || p === "bottom" ? (g = p, y = d === (await (a.isRTL == null ? void 0 : a.isRTL(s.floating)) ? "start" : "end") ? "left" : "right") : (y = p, g = d === "end" ? "top" : "bottom");
      const w = h - c.top - c.bottom, b = m - c.left - c.right, E = it(h - c[g], w), v = it(m - c[y], b), P = !t.middlewareData.shift;
      let $ = E, Y = v;
      if ((n = t.middlewareData.shift) != null && n.enabled.x && (Y = b), (r = t.middlewareData.shift) != null && r.enabled.y && ($ = w), P && !d) {
        const C = pe(c.left, 0), N = pe(c.right, 0), Q = pe(c.top, 0), K = pe(c.bottom, 0);
        f ? Y = m - 2 * (C !== 0 || N !== 0 ? C + N : pe(c.left, c.right)) : $ = h - 2 * (Q !== 0 || K !== 0 ? Q + K : pe(c.top, c.bottom));
      }
      await l({
        ...t,
        availableWidth: Y,
        availableHeight: $
      });
      const J = await a.getDimensions(s.floating);
      return m !== J.width || h !== J.height ? {
        reset: {
          rects: !0
        }
      } : {};
    }
  };
};
function da(e) {
  const t = $e(e);
  let n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0;
  const o = De(e), i = o ? e.offsetWidth : n, a = o ? e.offsetHeight : r, s = Ft(n) !== i || Ft(r) !== a;
  return s && (n = i, r = a), {
    width: n,
    height: r,
    $: s
  };
}
function Ur(e) {
  return me(e) ? e : e.contextElement;
}
function pt(e) {
  const t = Ur(e);
  if (!De(t))
    return _e(1);
  const n = t.getBoundingClientRect(), {
    width: r,
    height: o,
    $: i
  } = da(t);
  let a = (i ? Ft(n.width) : n.width) / r, s = (i ? Ft(n.height) : n.height) / o;
  return (!a || !Number.isFinite(a)) && (a = 1), (!s || !Number.isFinite(s)) && (s = 1), {
    x: a,
    y: s
  };
}
const Su = /* @__PURE__ */ _e(0);
function pa(e) {
  const t = ye(e);
  return !Br() || !t.visualViewport ? Su : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function Tu(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== ye(e) ? !1 : t;
}
function st(e, t, n, r) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const o = e.getBoundingClientRect(), i = Ur(e);
  let a = _e(1);
  t && (r ? me(r) && (a = pt(r)) : a = pt(e));
  const s = Tu(i, n, r) ? pa(i) : _e(0);
  let l = (o.left + s.x) / a.x, u = (o.top + s.y) / a.y, c = o.width / a.x, p = o.height / a.y;
  if (i) {
    const d = ye(i), f = r && me(r) ? ye(r) : r;
    let m = d, h = cr(m);
    for (; h && r && f !== m; ) {
      const g = pt(h), y = h.getBoundingClientRect(), w = $e(h), b = y.left + (h.clientLeft + parseFloat(w.paddingLeft)) * g.x, E = y.top + (h.clientTop + parseFloat(w.paddingTop)) * g.y;
      l *= g.x, u *= g.y, c *= g.x, p *= g.y, l += b, u += E, m = ye(h), h = cr(m);
    }
  }
  return sn({
    width: c,
    height: p,
    x: l,
    y: u
  });
}
function Vr(e, t) {
  const n = gn(e).scrollLeft;
  return t ? t.left + n : st(je(e)).left + n;
}
function ma(e, t, n) {
  n === void 0 && (n = !1);
  const r = e.getBoundingClientRect(), o = r.left + t.scrollLeft - (n ? 0 : (
    // RTL <body> scrollbar.
    Vr(e, r)
  )), i = r.top + t.scrollTop;
  return {
    x: o,
    y: i
  };
}
function Au(e) {
  let {
    elements: t,
    rect: n,
    offsetParent: r,
    strategy: o
  } = e;
  const i = o === "fixed", a = je(r), s = t ? hn(t.floating) : !1;
  if (r === a || s && i)
    return n;
  let l = {
    scrollLeft: 0,
    scrollTop: 0
  }, u = _e(1);
  const c = _e(0), p = De(r);
  if ((p || !p && !i) && ((yt(r) !== "body" || Nt(a)) && (l = gn(r)), De(r))) {
    const f = st(r);
    u = pt(r), c.x = f.x + r.clientLeft, c.y = f.y + r.clientTop;
  }
  const d = a && !p && !i ? ma(a, l, !0) : _e(0);
  return {
    width: n.width * u.x,
    height: n.height * u.y,
    x: n.x * u.x - l.scrollLeft * u.x + c.x + d.x,
    y: n.y * u.y - l.scrollTop * u.y + c.y + d.y
  };
}
function Pu(e) {
  return Array.from(e.getClientRects());
}
function Cu(e) {
  const t = je(e), n = gn(e), r = e.ownerDocument.body, o = pe(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth), i = pe(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let a = -n.scrollLeft + Vr(e);
  const s = -n.scrollTop;
  return $e(r).direction === "rtl" && (a += pe(t.clientWidth, r.clientWidth) - o), {
    width: o,
    height: i,
    x: a,
    y: s
  };
}
function $u(e, t) {
  const n = ye(e), r = je(e), o = n.visualViewport;
  let i = r.clientWidth, a = r.clientHeight, s = 0, l = 0;
  if (o) {
    i = o.width, a = o.height;
    const u = Br();
    (!u || u && t === "fixed") && (s = o.offsetLeft, l = o.offsetTop);
  }
  return {
    width: i,
    height: a,
    x: s,
    y: l
  };
}
function Ru(e, t) {
  const n = st(e, !0, t === "fixed"), r = n.top + e.clientTop, o = n.left + e.clientLeft, i = De(e) ? pt(e) : _e(1), a = e.clientWidth * i.x, s = e.clientHeight * i.y, l = o * i.x, u = r * i.y;
  return {
    width: a,
    height: s,
    x: l,
    y: u
  };
}
function Eo(e, t, n) {
  let r;
  if (t === "viewport")
    r = $u(e, n);
  else if (t === "document")
    r = Cu(je(e));
  else if (me(t))
    r = Ru(t, n);
  else {
    const o = pa(e);
    r = {
      x: t.x - o.x,
      y: t.y - o.y,
      width: t.width,
      height: t.height
    };
  }
  return sn(r);
}
function ha(e, t) {
  const n = Ge(e);
  return n === t || !me(n) || ht(n) ? !1 : $e(n).position === "fixed" || ha(n, t);
}
function Lu(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let r = Lt(e, [], !1).filter((s) => me(s) && yt(s) !== "body"), o = null;
  const i = $e(e).position === "fixed";
  let a = i ? Ge(e) : e;
  for (; me(a) && !ht(a); ) {
    const s = $e(a), l = zr(a);
    !l && s.position === "fixed" && (o = null), (i ? !l && !o : !l && s.position === "static" && !!o && ["absolute", "fixed"].includes(o.position) || Nt(a) && !l && ha(e, a)) ? r = r.filter((c) => c !== a) : o = s, a = Ge(a);
  }
  return t.set(e, r), r;
}
function Fu(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: r,
    strategy: o
  } = e;
  const a = [...n === "clippingAncestors" ? hn(t) ? [] : Lu(t, this._c) : [].concat(n), r], s = a[0], l = a.reduce((u, c) => {
    const p = Eo(t, c, o);
    return u.top = pe(p.top, u.top), u.right = it(p.right, u.right), u.bottom = it(p.bottom, u.bottom), u.left = pe(p.left, u.left), u;
  }, Eo(t, s, o));
  return {
    width: l.right - l.left,
    height: l.bottom - l.top,
    x: l.left,
    y: l.top
  };
}
function Iu(e) {
  const {
    width: t,
    height: n
  } = da(e);
  return {
    width: t,
    height: n
  };
}
function ku(e, t, n) {
  const r = De(t), o = je(t), i = n === "fixed", a = st(e, !0, i, t);
  let s = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const l = _e(0);
  if (r || !r && !i)
    if ((yt(t) !== "body" || Nt(o)) && (s = gn(t)), r) {
      const d = st(t, !0, i, t);
      l.x = d.x + t.clientLeft, l.y = d.y + t.clientTop;
    } else o && (l.x = Vr(o));
  const u = o && !r && !i ? ma(o, s) : _e(0), c = a.left + s.scrollLeft - l.x - u.x, p = a.top + s.scrollTop - l.y - u.y;
  return {
    x: c,
    y: p,
    width: a.width,
    height: a.height
  };
}
function Ln(e) {
  return $e(e).position === "static";
}
function Oo(e, t) {
  if (!De(e) || $e(e).position === "fixed")
    return null;
  if (t)
    return t(e);
  let n = e.offsetParent;
  return je(e) === n && (n = n.ownerDocument.body), n;
}
function ga(e, t) {
  const n = ye(e);
  if (hn(e))
    return n;
  if (!De(e)) {
    let o = Ge(e);
    for (; o && !ht(o); ) {
      if (me(o) && !Ln(o))
        return o;
      o = Ge(o);
    }
    return n;
  }
  let r = Oo(e, t);
  for (; r && su(r) && Ln(r); )
    r = Oo(r, t);
  return r && ht(r) && Ln(r) && !zr(r) ? n : r || lu(e) || n;
}
const Mu = async function(e) {
  const t = this.getOffsetParent || ga, n = this.getDimensions, r = await n(e.floating);
  return {
    reference: ku(e.reference, await t(e.floating), e.strategy),
    floating: {
      x: 0,
      y: 0,
      width: r.width,
      height: r.height
    }
  };
};
function _u(e) {
  return $e(e).direction === "rtl";
}
const Du = {
  convertOffsetParentRelativeRectToViewportRelativeRect: Au,
  getDocumentElement: je,
  getClippingRect: Fu,
  getOffsetParent: ga,
  getElementRects: Mu,
  getClientRects: Pu,
  getDimensions: Iu,
  getScale: pt,
  isElement: me,
  isRTL: _u
};
function va(e, t) {
  return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function Nu(e, t) {
  let n = null, r;
  const o = je(e);
  function i() {
    var s;
    clearTimeout(r), (s = n) == null || s.disconnect(), n = null;
  }
  function a(s, l) {
    s === void 0 && (s = !1), l === void 0 && (l = 1), i();
    const u = e.getBoundingClientRect(), {
      left: c,
      top: p,
      width: d,
      height: f
    } = u;
    if (s || t(), !d || !f)
      return;
    const m = Vt(p), h = Vt(o.clientWidth - (c + d)), g = Vt(o.clientHeight - (p + f)), y = Vt(c), b = {
      rootMargin: -m + "px " + -h + "px " + -g + "px " + -y + "px",
      threshold: pe(0, it(1, l)) || 1
    };
    let E = !0;
    function v(P) {
      const $ = P[0].intersectionRatio;
      if ($ !== l) {
        if (!E)
          return a();
        $ ? a(!1, $) : r = setTimeout(() => {
          a(!1, 1e-7);
        }, 1e3);
      }
      $ === 1 && !va(u, e.getBoundingClientRect()) && a(), E = !1;
    }
    try {
      n = new IntersectionObserver(v, {
        ...b,
        // Handle <iframe>s
        root: o.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(v, b);
    }
    n.observe(e);
  }
  return a(!0), i;
}
function ju(e, t, n, r) {
  r === void 0 && (r = {});
  const {
    ancestorScroll: o = !0,
    ancestorResize: i = !0,
    elementResize: a = typeof ResizeObserver == "function",
    layoutShift: s = typeof IntersectionObserver == "function",
    animationFrame: l = !1
  } = r, u = Ur(e), c = o || i ? [...u ? Lt(u) : [], ...Lt(t)] : [];
  c.forEach((y) => {
    o && y.addEventListener("scroll", n, {
      passive: !0
    }), i && y.addEventListener("resize", n);
  });
  const p = u && s ? Nu(u, n) : null;
  let d = -1, f = null;
  a && (f = new ResizeObserver((y) => {
    let [w] = y;
    w && w.target === u && f && (f.unobserve(t), cancelAnimationFrame(d), d = requestAnimationFrame(() => {
      var b;
      (b = f) == null || b.observe(t);
    })), n();
  }), u && !l && f.observe(u), f.observe(t));
  let m, h = l ? st(e) : null;
  l && g();
  function g() {
    const y = st(e);
    h && !va(h, y) && n(), h = y, m = requestAnimationFrame(g);
  }
  return n(), () => {
    var y;
    c.forEach((w) => {
      o && w.removeEventListener("scroll", n), i && w.removeEventListener("resize", n);
    }), p == null || p(), (y = f) == null || y.disconnect(), f = null, l && cancelAnimationFrame(m);
  };
}
const Fn = vn, Hu = wu, Wu = Eu, zu = yu, Bu = Ou, Uu = (e, t, n) => {
  const r = /* @__PURE__ */ new Map(), o = {
    platform: Du,
    ...n
  }, i = {
    ...o.platform,
    _c: r
  };
  return bu(e, t, {
    ...o,
    platform: i
  });
};
var Jt = typeof document < "u" ? kr : ue;
function ln(e, t) {
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
        if (!ln(e[r], t[r]))
          return !1;
      return !0;
    }
    if (o = Object.keys(e), n = o.length, n !== Object.keys(t).length)
      return !1;
    for (r = n; r-- !== 0; )
      if (!{}.hasOwnProperty.call(t, o[r]))
        return !1;
    for (r = n; r-- !== 0; ) {
      const i = o[r];
      if (!(i === "_owner" && e.$$typeof) && !ln(e[i], t[i]))
        return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function ba(e) {
  return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function So(e, t) {
  const n = ba(e);
  return Math.round(t * n) / n;
}
function In(e) {
  const t = L.useRef(e);
  return Jt(() => {
    t.current = e;
  }), t;
}
function Vu(e) {
  e === void 0 && (e = {});
  const {
    placement: t = "bottom",
    strategy: n = "absolute",
    middleware: r = [],
    platform: o,
    elements: {
      reference: i,
      floating: a
    } = {},
    transform: s = !0,
    whileElementsMounted: l,
    open: u
  } = e, [c, p] = L.useState({
    x: 0,
    y: 0,
    strategy: n,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [d, f] = L.useState(r);
  ln(d, r) || f(r);
  const [m, h] = L.useState(null), [g, y] = L.useState(null), w = L.useCallback((H) => {
    H !== P.current && (P.current = H, h(H));
  }, []), b = L.useCallback((H) => {
    H !== $.current && ($.current = H, y(H));
  }, []), E = i || m, v = a || g, P = L.useRef(null), $ = L.useRef(null), Y = L.useRef(c), J = l != null, C = In(l), N = In(o), Q = In(u), K = L.useCallback(() => {
    if (!P.current || !$.current)
      return;
    const H = {
      placement: t,
      strategy: n,
      middleware: d
    };
    N.current && (H.platform = N.current), Uu(P.current, $.current, H).then((q) => {
      const x = {
        ...q,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: Q.current !== !1
      };
      F.current && !ln(Y.current, x) && (Y.current = x, tn.flushSync(() => {
        p(x);
      }));
    });
  }, [d, t, n, N, Q]);
  Jt(() => {
    u === !1 && Y.current.isPositioned && (Y.current.isPositioned = !1, p((H) => ({
      ...H,
      isPositioned: !1
    })));
  }, [u]);
  const F = L.useRef(!1);
  Jt(() => (F.current = !0, () => {
    F.current = !1;
  }), []), Jt(() => {
    if (E && (P.current = E), v && ($.current = v), E && v) {
      if (C.current)
        return C.current(E, v, K);
      K();
    }
  }, [E, v, K, C, J]);
  const ae = L.useMemo(() => ({
    reference: P,
    floating: $,
    setReference: w,
    setFloating: b
  }), [w, b]), G = L.useMemo(() => ({
    reference: E,
    floating: v
  }), [E, v]), te = L.useMemo(() => {
    const H = {
      position: n,
      left: 0,
      top: 0
    };
    if (!G.floating)
      return H;
    const q = So(G.floating, c.x), x = So(G.floating, c.y);
    return s ? {
      ...H,
      transform: "translate(" + q + "px, " + x + "px)",
      ...ba(G.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: n,
      left: q,
      top: x
    };
  }, [n, s, G.floating, c.x, c.y]);
  return L.useMemo(() => ({
    ...c,
    update: K,
    refs: ae,
    elements: G,
    floatingStyles: te
  }), [c, K, ae, G, te]);
}
const ya = (e, t) => ({
  ...Hu(e),
  options: [e, t]
}), Yu = (e, t) => ({
  ...Wu(e),
  options: [e, t]
}), Gu = (e, t) => ({
  ...zu(e),
  options: [e, t]
}), qu = (e, t) => ({
  ...Bu(e),
  options: [e, t]
}), xa = {
  ...L
}, Ku = xa.useInsertionEffect, Xu = Ku || ((e) => e());
function wa(e) {
  const t = L.useRef(() => {
    if (process.env.NODE_ENV !== "production")
      throw new Error("Cannot call an event handler while rendering.");
  });
  return Xu(() => {
    t.current = e;
  }), L.useCallback(function() {
    for (var n = arguments.length, r = new Array(n), o = 0; o < n; o++)
      r[o] = arguments[o];
    return t.current == null ? void 0 : t.current(...r);
  }, []);
}
var dr = typeof document < "u" ? kr : ue;
let To = !1, Qu = 0;
const Ao = () => (
  // Ensure the id is unique with multiple independent versions of Floating UI
  // on <React 18
  "floating-ui-" + Math.random().toString(36).slice(2, 6) + Qu++
);
function Ju() {
  const [e, t] = L.useState(() => To ? Ao() : void 0);
  return dr(() => {
    e == null && t(Ao());
  }, []), L.useEffect(() => {
    To = !0;
  }, []), e;
}
const Zu = xa.useId, ec = Zu || Ju;
let It;
process.env.NODE_ENV !== "production" && (It = /* @__PURE__ */ new Set());
function tc() {
  for (var e, t = arguments.length, n = new Array(t), r = 0; r < t; r++)
    n[r] = arguments[r];
  const o = "Floating UI: " + n.join(" ");
  if (!((e = It) != null && e.has(o))) {
    var i;
    (i = It) == null || i.add(o), console.warn(o);
  }
}
function nc() {
  for (var e, t = arguments.length, n = new Array(t), r = 0; r < t; r++)
    n[r] = arguments[r];
  const o = "Floating UI: " + n.join(" ");
  if (!((e = It) != null && e.has(o))) {
    var i;
    (i = It) == null || i.add(o), console.error(o);
  }
}
function rc() {
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
const oc = /* @__PURE__ */ L.createContext(null), ic = /* @__PURE__ */ L.createContext(null), ac = () => {
  var e;
  return ((e = L.useContext(oc)) == null ? void 0 : e.id) || null;
}, sc = () => L.useContext(ic), lc = "data-floating-ui-focusable";
function uc(e) {
  const {
    open: t = !1,
    onOpenChange: n,
    elements: r
  } = e, o = ec(), i = L.useRef({}), [a] = L.useState(() => rc()), s = ac() != null;
  if (process.env.NODE_ENV !== "production") {
    const f = r.reference;
    f && !me(f) && nc("Cannot pass a virtual element to the `elements.reference` option,", "as it must be a real DOM element. Use `refs.setPositionReference()`", "instead.");
  }
  const [l, u] = L.useState(r.reference), c = wa((f, m, h) => {
    i.current.openEvent = f ? m : void 0, a.emit("openchange", {
      open: f,
      event: m,
      reason: h,
      nested: s
    }), n == null || n(f, m, h);
  }), p = L.useMemo(() => ({
    setPositionReference: u
  }), []), d = L.useMemo(() => ({
    reference: l || r.reference || null,
    floating: r.floating || null,
    domReference: r.reference
  }), [l, r.reference, r.floating]);
  return L.useMemo(() => ({
    dataRef: i,
    open: t,
    onOpenChange: c,
    elements: d,
    events: a,
    floatingId: o,
    refs: p
  }), [t, c, d, a, o, p]);
}
function cc(e) {
  e === void 0 && (e = {});
  const {
    nodeId: t
  } = e, n = uc({
    ...e,
    elements: {
      reference: null,
      floating: null,
      ...e.elements
    }
  }), r = e.rootContext || n, o = r.elements, [i, a] = L.useState(null), [s, l] = L.useState(null), c = (o == null ? void 0 : o.domReference) || i, p = L.useRef(null), d = sc();
  dr(() => {
    c && (p.current = c);
  }, [c]);
  const f = Vu({
    ...e,
    elements: {
      ...o,
      ...s && {
        reference: s
      }
    }
  }), m = L.useCallback((b) => {
    const E = me(b) ? {
      getBoundingClientRect: () => b.getBoundingClientRect(),
      contextElement: b
    } : b;
    l(E), f.refs.setReference(E);
  }, [f.refs]), h = L.useCallback((b) => {
    (me(b) || b === null) && (p.current = b, a(b)), (me(f.refs.reference.current) || f.refs.reference.current === null || // Don't allow setting virtual elements using the old technique back to
    // `null` to support `positionReference` + an unstable `reference`
    // callback ref.
    b !== null && !me(b)) && f.refs.setReference(b);
  }, [f.refs]), g = L.useMemo(() => ({
    ...f.refs,
    setReference: h,
    setPositionReference: m,
    domReference: p
  }), [f.refs, h, m]), y = L.useMemo(() => ({
    ...f.elements,
    domReference: c
  }), [f.elements, c]), w = L.useMemo(() => ({
    ...f,
    ...r,
    refs: g,
    elements: y,
    nodeId: t
  }), [f, g, y, t, r]);
  return dr(() => {
    r.dataRef.current.floatingContext = w;
    const b = d == null ? void 0 : d.nodesRef.current.find((E) => E.id === t);
    b && (b.context = w);
  }), L.useMemo(() => ({
    ...f,
    context: w,
    refs: g,
    elements: y
  }), [f, g, y, w]);
}
const Po = "active", Co = "selected";
function kn(e, t, n) {
  const r = /* @__PURE__ */ new Map(), o = n === "item";
  let i = e;
  if (o && e) {
    const {
      [Po]: a,
      [Co]: s,
      ...l
    } = e;
    i = l;
  }
  return {
    ...n === "floating" && {
      tabIndex: -1,
      [lc]: ""
    },
    ...i,
    ...t.map((a) => {
      const s = a ? a[n] : null;
      return typeof s == "function" ? e ? s(e) : null : s;
    }).concat(e).reduce((a, s) => (s && Object.entries(s).forEach((l) => {
      let [u, c] = l;
      if (!(o && [Po, Co].includes(u)))
        if (u.indexOf("on") === 0) {
          if (r.has(u) || r.set(u, []), typeof c == "function") {
            var p;
            (p = r.get(u)) == null || p.push(c), a[u] = function() {
              for (var d, f = arguments.length, m = new Array(f), h = 0; h < f; h++)
                m[h] = arguments[h];
              return (d = r.get(u)) == null ? void 0 : d.map((g) => g(...m)).find((g) => g !== void 0);
            };
          }
        } else
          a[u] = c;
    }), a), {})
  };
}
function fc(e) {
  e === void 0 && (e = []);
  const t = e.map((s) => s == null ? void 0 : s.reference), n = e.map((s) => s == null ? void 0 : s.floating), r = e.map((s) => s == null ? void 0 : s.item), o = L.useCallback(
    (s) => kn(s, e, "reference"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    t
  ), i = L.useCallback(
    (s) => kn(s, e, "floating"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    n
  ), a = L.useCallback(
    (s) => kn(s, e, "item"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    r
  );
  return L.useMemo(() => ({
    getReferenceProps: o,
    getFloatingProps: i,
    getItemProps: a
  }), [o, i, a]);
}
function $o(e, t) {
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
const dc = (e) => ({
  name: "inner",
  options: e,
  async fn(t) {
    const {
      listRef: n,
      overflowRef: r,
      onFallbackChange: o,
      offset: i = 0,
      index: a = 0,
      minItemsVisible: s = 4,
      referenceOverflowThreshold: l = 0,
      scrollRef: u,
      ...c
    } = xt(e, t), {
      rects: p,
      elements: {
        floating: d
      }
    } = t, f = n.current[a], m = (u == null ? void 0 : u.current) || d, h = d.clientTop || m.clientTop, g = d.clientTop !== 0, y = m.clientTop !== 0, w = d === m;
    if (process.env.NODE_ENV !== "production" && (t.placement.startsWith("bottom") || tc('`placement` side must be "bottom" when using the `inner`', "middleware.")), !f)
      return {};
    const b = {
      ...t,
      ...await ya(-f.offsetTop - d.clientTop - p.reference.height / 2 - f.offsetHeight / 2 - i).fn(t)
    }, E = await Fn($o(b, m.scrollHeight + h + d.clientTop), c), v = await Fn(b, {
      ...c,
      elementContext: "reference"
    }), P = pe(0, E.top), $ = b.y + P, C = (m.scrollHeight > m.clientHeight ? (N) => N : Ft)(pe(0, m.scrollHeight + (g && w || y ? h * 2 : 0) - P - pe(0, E.bottom)));
    if (m.style.maxHeight = C + "px", m.scrollTop = P, o) {
      const N = m.offsetHeight < f.offsetHeight * it(s, n.current.length) - 1 || v.top >= -l || v.bottom >= -l;
      tn.flushSync(() => o(N));
    }
    return r && (r.current = await Fn($o({
      ...b,
      y: $
    }, m.offsetHeight + h + d.clientTop), c)), {
      y: $
    };
  }
});
function pc(e, t) {
  const {
    open: n,
    elements: r
  } = e, {
    enabled: o = !0,
    overflowRef: i,
    scrollRef: a,
    onChange: s
  } = t, l = wa(s), u = L.useRef(!1), c = L.useRef(null), p = L.useRef(null);
  L.useEffect(() => {
    if (!o) return;
    function f(h) {
      if (h.ctrlKey || !m || i.current == null)
        return;
      const g = h.deltaY, y = i.current.top >= -0.5, w = i.current.bottom >= -0.5, b = m.scrollHeight - m.clientHeight, E = g < 0 ? -1 : 1, v = g < 0 ? "max" : "min";
      m.scrollHeight <= m.clientHeight || (!y && g > 0 || !w && g < 0 ? (h.preventDefault(), tn.flushSync(() => {
        l((P) => P + Math[v](g, b * E));
      })) : /firefox/i.test(uu()) && (m.scrollTop += g));
    }
    const m = (a == null ? void 0 : a.current) || r.floating;
    if (n && m)
      return m.addEventListener("wheel", f), requestAnimationFrame(() => {
        c.current = m.scrollTop, i.current != null && (p.current = {
          ...i.current
        });
      }), () => {
        c.current = null, p.current = null, m.removeEventListener("wheel", f);
      };
  }, [o, n, r.floating, i, a, l]);
  const d = L.useMemo(() => ({
    onKeyDown() {
      u.current = !0;
    },
    onWheel() {
      u.current = !1;
    },
    onPointerMove() {
      u.current = !1;
    },
    onScroll() {
      const f = (a == null ? void 0 : a.current) || r.floating;
      if (!(!i.current || !f || !u.current)) {
        if (c.current !== null) {
          const m = f.scrollTop - c.current;
          (i.current.bottom < -0.5 && m < -1 || i.current.top < -0.5 && m > 1) && tn.flushSync(() => l((h) => h + m));
        }
        requestAnimationFrame(() => {
          c.current = f.scrollTop;
        });
      }
    }
  }), [r.floating, l, i, a]);
  return L.useMemo(() => o ? {
    floating: d
  } : {}, [o, d]);
}
let wt = ge({ styles: void 0, setReference: () => {
}, setFloating: () => {
}, getReferenceProps: () => ({}), getFloatingProps: () => ({}), slot: {} });
wt.displayName = "FloatingContext";
let Yr = ge(null);
Yr.displayName = "PlacementContext";
function mc(e) {
  return se(() => e ? typeof e == "string" ? { to: e } : e : null, [e]);
}
function hc() {
  return le(wt).setReference;
}
function gc() {
  return le(wt).getReferenceProps;
}
function vc() {
  let { getFloatingProps: e, slot: t } = le(wt);
  return re((...n) => Object.assign({}, e(...n), { "data-anchor": t.anchor }), [e, t]);
}
function bc(e = null) {
  e === !1 && (e = null), typeof e == "string" && (e = { to: e });
  let t = le(Yr), n = se(() => e, [JSON.stringify(e, (o, i) => {
    var a;
    return (a = i == null ? void 0 : i.outerHTML) != null ? a : i;
  })]);
  ie(() => {
    t == null || t(n ?? null);
  }, [t, n]);
  let r = le(wt);
  return se(() => [r.setFloating, e ? r.styles : {}], [r.setFloating, e, r.styles]);
}
let Ro = 4;
function yc({ children: e, enabled: t = !0 }) {
  let [n, r] = oe(null), [o, i] = oe(0), a = V(null), [s, l] = oe(null);
  xc(s);
  let u = t && n !== null && s !== null, { to: c = "bottom", gap: p = 0, offset: d = 0, padding: f = 0, inner: m } = wc(n, s), [h, g = "center"] = c.split(" ");
  ie(() => {
    u && i(0);
  }, [u]);
  let { refs: y, floatingStyles: w, context: b } = cc({ open: u, placement: h === "selection" ? g === "center" ? "bottom" : `bottom-${g}` : g === "center" ? `${h}` : `${h}-${g}`, strategy: "absolute", transform: !1, middleware: [ya({ mainAxis: h === "selection" ? 0 : p, crossAxis: d }), Yu({ padding: f }), h !== "selection" && Gu({ padding: f }), h === "selection" && m ? dc({ ...m, padding: f, overflowRef: a, offset: o, minItemsVisible: Ro, referenceOverflowThreshold: f, onFallbackChange(N) {
    var Q, K;
    if (!N) return;
    let F = b.elements.floating;
    if (!F) return;
    let ae = parseFloat(getComputedStyle(F).scrollPaddingBottom) || 0, G = Math.min(Ro, F.childElementCount), te = 0, H = 0;
    for (let q of (K = (Q = b.elements.floating) == null ? void 0 : Q.childNodes) != null ? K : []) if (q instanceof HTMLElement) {
      let x = q.offsetTop, T = x + q.clientHeight + ae, _ = F.scrollTop, I = _ + F.clientHeight;
      if (x >= _ && T <= I) G--;
      else {
        H = Math.max(0, Math.min(T, I) - Math.max(x, _)), te = q.clientHeight;
        break;
      }
    }
    G >= 1 && i((q) => {
      let x = te * G - H + ae;
      return q >= x ? q : x;
    });
  } }) : null, qu({ padding: f, apply({ availableWidth: N, availableHeight: Q, elements: K }) {
    Object.assign(K.floating.style, { overflow: "auto", maxWidth: `${N}px`, maxHeight: `min(var(--anchor-max-height, 100vh), ${Q}px)` });
  } })].filter(Boolean), whileElementsMounted: ju }), [E = h, v = g] = b.placement.split("-");
  h === "selection" && (E = "selection");
  let P = se(() => ({ anchor: [E, v].filter(Boolean).join(" ") }), [E, v]), $ = pc(b, { overflowRef: a, onChange: i }), { getReferenceProps: Y, getFloatingProps: J } = fc([$]), C = X((N) => {
    l(N), y.setFloating(N);
  });
  return L.createElement(Yr.Provider, { value: r }, L.createElement(wt.Provider, { value: { setFloating: C, setReference: y.setReference, styles: w, getReferenceProps: Y, getFloatingProps: J, slot: P } }, e));
}
function xc(e) {
  ie(() => {
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
function wc(e, t) {
  var n, r, o;
  let i = Mn((n = e == null ? void 0 : e.gap) != null ? n : "var(--anchor-gap, 0)", t), a = Mn((r = e == null ? void 0 : e.offset) != null ? r : "var(--anchor-offset, 0)", t), s = Mn((o = e == null ? void 0 : e.padding) != null ? o : "var(--anchor-padding, 0)", t);
  return { ...e, gap: i, offset: a, padding: s };
}
function Mn(e, t, n = void 0) {
  let r = bt(), o = X((l, u) => {
    if (l == null) return [n, null];
    if (typeof l == "number") return [l, null];
    if (typeof l == "string") {
      if (!u) return [n, null];
      let c = Lo(l, u);
      return [c, (p) => {
        let d = Ea(l);
        {
          let f = d.map((m) => window.getComputedStyle(u).getPropertyValue(m));
          r.requestAnimationFrame(function m() {
            r.nextFrame(m);
            let h = !1;
            for (let [y, w] of d.entries()) {
              let b = window.getComputedStyle(u).getPropertyValue(w);
              if (f[y] !== b) {
                f[y] = b, h = !0;
                break;
              }
            }
            if (!h) return;
            let g = Lo(l, u);
            c !== g && (p(g), c = g);
          });
        }
        return r.dispose;
      }];
    }
    return [n, null];
  }), i = se(() => o(e, t)[0], [e, t]), [a = i, s] = oe();
  return ie(() => {
    let [l, u] = o(e, t);
    if (s(l), !!u) return u(s);
  }, [e, t]), a;
}
function Ea(e) {
  let t = /var\((.*)\)/.exec(e);
  if (t) {
    let n = t[1].indexOf(",");
    if (n === -1) return [t[1]];
    let r = t[1].slice(0, n).trim(), o = t[1].slice(n + 1).trim();
    return o ? [r, ...Ea(o)] : [r];
  }
  return [];
}
function Lo(e, t) {
  let n = document.createElement("div");
  t.appendChild(n), n.style.setProperty("margin-top", "0px", "important"), n.style.setProperty("margin-top", e, "important");
  let r = parseFloat(window.getComputedStyle(n).marginTop) || 0;
  return t.removeChild(n), r;
}
function Ec(e, t) {
  let [n, r] = oe(t);
  return !e && n !== t && r(t), e ? n : t;
}
let Gr = ge(null);
Gr.displayName = "OpenClosedContext";
var Ae = ((e) => (e[e.Open = 1] = "Open", e[e.Closed = 2] = "Closed", e[e.Closing = 4] = "Closing", e[e.Opening = 8] = "Opening", e))(Ae || {});
function qr() {
  return le(Gr);
}
function Oa({ value: e, children: t }) {
  return z.createElement(Gr.Provider, { value: e }, t);
}
function Oc(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Yt = { exports: {} }, _n = {};
/**
 * @license React
 * use-sync-external-store-with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Fo;
function Sc() {
  if (Fo) return _n;
  Fo = 1;
  var e = z;
  function t(l, u) {
    return l === u && (l !== 0 || 1 / l === 1 / u) || l !== l && u !== u;
  }
  var n = typeof Object.is == "function" ? Object.is : t, r = e.useSyncExternalStore, o = e.useRef, i = e.useEffect, a = e.useMemo, s = e.useDebugValue;
  return _n.useSyncExternalStoreWithSelector = function(l, u, c, p, d) {
    var f = o(null);
    if (f.current === null) {
      var m = { hasValue: !1, value: null };
      f.current = m;
    } else m = f.current;
    f = a(
      function() {
        function g(v) {
          if (!y) {
            if (y = !0, w = v, v = p(v), d !== void 0 && m.hasValue) {
              var P = m.value;
              if (d(P, v))
                return b = P;
            }
            return b = v;
          }
          if (P = b, n(w, v)) return P;
          var $ = p(v);
          return d !== void 0 && d(P, $) ? (w = v, P) : (w = v, b = $);
        }
        var y = !1, w, b, E = c === void 0 ? null : c;
        return [
          function() {
            return g(u());
          },
          E === null ? void 0 : function() {
            return g(E());
          }
        ];
      },
      [u, c, p, d]
    );
    var h = r(l, f[0], f[1]);
    return i(
      function() {
        m.hasValue = !0, m.value = h;
      },
      [h]
    ), s(h), h;
  }, _n;
}
var Dn = {};
/**
 * @license React
 * use-sync-external-store-with-selector.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Io;
function Tc() {
  return Io || (Io = 1, process.env.NODE_ENV !== "production" && function() {
    function e(l, u) {
      return l === u && (l !== 0 || 1 / l === 1 / u) || l !== l && u !== u;
    }
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
    var t = z, n = typeof Object.is == "function" ? Object.is : e, r = t.useSyncExternalStore, o = t.useRef, i = t.useEffect, a = t.useMemo, s = t.useDebugValue;
    Dn.useSyncExternalStoreWithSelector = function(l, u, c, p, d) {
      var f = o(null);
      if (f.current === null) {
        var m = { hasValue: !1, value: null };
        f.current = m;
      } else m = f.current;
      f = a(
        function() {
          function g(v) {
            if (!y) {
              if (y = !0, w = v, v = p(v), d !== void 0 && m.hasValue) {
                var P = m.value;
                if (d(P, v))
                  return b = P;
              }
              return b = v;
            }
            if (P = b, n(w, v))
              return P;
            var $ = p(v);
            return d !== void 0 && d(P, $) ? (w = v, P) : (w = v, b = $);
          }
          var y = !1, w, b, E = c === void 0 ? null : c;
          return [
            function() {
              return g(u());
            },
            E === null ? void 0 : function() {
              return g(E());
            }
          ];
        },
        [u, c, p, d]
      );
      var h = r(l, f[0], f[1]);
      return i(
        function() {
          m.hasValue = !0, m.value = h;
        },
        [h]
      ), s(h), h;
    }, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
  }()), Dn;
}
var ko;
function Ac() {
  return ko || (ko = 1, process.env.NODE_ENV === "production" ? Yt.exports = Sc() : Yt.exports = Tc()), Yt.exports;
}
var Pc = Ac(), Sa = (e, t, n) => {
  if (!t.has(e)) throw TypeError("Cannot " + n);
}, Te = (e, t, n) => (Sa(e, t, "read from private field"), n ? n.call(e) : t.get(e)), Nn = (e, t, n) => {
  if (t.has(e)) throw TypeError("Cannot add the same private member more than once");
  t instanceof WeakSet ? t.add(e) : t.set(e, n);
}, Mo = (e, t, n, r) => (Sa(e, t, "write to private field"), t.set(e, n), n), He, St, Tt;
let Cc = class {
  constructor(t) {
    Nn(this, He, {}), Nn(this, St, new Ji(() => /* @__PURE__ */ new Set())), Nn(this, Tt, /* @__PURE__ */ new Set()), Mo(this, He, t);
  }
  get state() {
    return Te(this, He);
  }
  subscribe(t, n) {
    let r = { selector: t, callback: n, current: t(Te(this, He)) };
    return Te(this, Tt).add(r), () => {
      Te(this, Tt).delete(r);
    };
  }
  on(t, n) {
    return Te(this, St).get(t).add(n), () => {
      Te(this, St).get(t).delete(n);
    };
  }
  send(t) {
    Mo(this, He, this.reduce(Te(this, He), t));
    for (let n of Te(this, Tt)) {
      let r = n.selector(Te(this, He));
      Ta(n.current, r) || (n.current = r, n.callback(r));
    }
    for (let n of Te(this, St).get(t.type)) n(Te(this, He), t);
  }
};
He = /* @__PURE__ */ new WeakMap(), St = /* @__PURE__ */ new WeakMap(), Tt = /* @__PURE__ */ new WeakMap();
function Ta(e, t) {
  return Object.is(e, t) ? !0 : typeof e != "object" || e === null || typeof t != "object" || t === null ? !1 : Array.isArray(e) && Array.isArray(t) ? e.length !== t.length ? !1 : jn(e[Symbol.iterator](), t[Symbol.iterator]()) : e instanceof Map && t instanceof Map || e instanceof Set && t instanceof Set ? e.size !== t.size ? !1 : jn(e.entries(), t.entries()) : _o(e) && _o(t) ? jn(Object.entries(e)[Symbol.iterator](), Object.entries(t)[Symbol.iterator]()) : !1;
}
function jn(e, t) {
  do {
    let n = e.next(), r = t.next();
    if (n.done && r.done) return !0;
    if (n.done || r.done || !Object.is(n.value, r.value)) return !1;
  } while (!0);
}
function _o(e) {
  if (Object.prototype.toString.call(e) !== "[object Object]") return !1;
  let t = Object.getPrototypeOf(e);
  return t === null || Object.getPrototypeOf(t) === null;
}
function Hn(e) {
  let [t, n] = e(), r = Ne();
  return (...o) => {
    t(...o), r.dispose(), r.microTask(n);
  };
}
function Pe(e, t, n = Ta) {
  return Pc.useSyncExternalStoreWithSelector(X((r) => e.subscribe($c, r)), X(() => e.state), X(() => e.state), X(t), n);
}
function $c(e) {
  return e;
}
function Rc(e) {
  throw new Error("Unexpected object: " + e);
}
var de = ((e) => (e[e.First = 0] = "First", e[e.Previous = 1] = "Previous", e[e.Next = 2] = "Next", e[e.Last = 3] = "Last", e[e.Specific = 4] = "Specific", e[e.Nothing = 5] = "Nothing", e))(de || {});
function Wn(e, t) {
  let n = t.resolveItems();
  if (n.length <= 0) return null;
  let r = t.resolveActiveIndex(), o = r ?? -1;
  switch (e.focus) {
    case 0: {
      for (let i = 0; i < n.length; ++i) if (!t.resolveDisabled(n[i], i, n)) return i;
      return r;
    }
    case 1: {
      o === -1 && (o = n.length);
      for (let i = o - 1; i >= 0; --i) if (!t.resolveDisabled(n[i], i, n)) return i;
      return r;
    }
    case 2: {
      for (let i = o + 1; i < n.length; ++i) if (!t.resolveDisabled(n[i], i, n)) return i;
      return r;
    }
    case 3: {
      for (let i = n.length - 1; i >= 0; --i) if (!t.resolveDisabled(n[i], i, n)) return i;
      return r;
    }
    case 4: {
      for (let i = 0; i < n.length; ++i) if (t.resolveId(n[i], i, n) === e.id) return i;
      return r;
    }
    case 5:
      return null;
    default:
      Rc(e);
  }
}
function Lc(e) {
  let t = X(e), n = V(!1);
  ue(() => (n.current = !1, () => {
    n.current = !0, Hi(() => {
      n.current && t();
    });
  }), [t]);
}
function Fc() {
  let e = typeof document > "u";
  return "useSyncExternalStore" in L ? ((t) => t.useSyncExternalStore)(L)(() => () => {
  }, () => !1, () => !e) : !1;
}
function Kr() {
  let e = Fc(), [t, n] = L.useState(rt.isHandoffComplete);
  return t && rt.isHandoffComplete === !1 && n(!1), L.useEffect(() => {
    t !== !0 && n(!0);
  }, [t]), L.useEffect(() => rt.handoff(), []), e ? !1 : t;
}
let Ic = ge(!1);
function kc() {
  return le(Ic);
}
function Mc(e) {
  let t = kc(), n = le(Pa), [r, o] = oe(() => {
    var i;
    if (!t && n !== null) return (i = n.current) != null ? i : null;
    if (rt.isServer) return null;
    let a = e == null ? void 0 : e.getElementById("headlessui-portal-root");
    if (a) return a;
    if (e === null) return null;
    let s = e.createElement("div");
    return s.setAttribute("id", "headlessui-portal-root"), e.body.appendChild(s);
  });
  return ue(() => {
    r !== null && (e != null && e.body.contains(r) || e == null || e.body.appendChild(r));
  }, [r, e]), ue(() => {
    t || n !== null && o(n.current);
  }, [n, o, t]), r;
}
let Aa = Oe, _c = be(function(e, t) {
  let { ownerDocument: n = null, ...r } = e, o = V(null), i = Se(bl((f) => {
    o.current = f;
  }), t), a = ur(o), s = n ?? a, l = Mc(s), [u] = oe(() => {
    var f;
    return rt.isServer ? null : (f = s == null ? void 0 : s.createElement("div")) != null ? f : null;
  }), c = le(Hc), p = Kr();
  ie(() => {
    !l || !u || l.contains(u) || (u.setAttribute("data-headlessui-portal", ""), l.appendChild(u));
  }, [l, u]), ie(() => {
    if (u && c) return c.register(u);
  }, [c, u]), Lc(() => {
    var f;
    !l || !u || (u instanceof Node && l.contains(u) && l.removeChild(u), l.childNodes.length <= 0 && ((f = l.parentElement) == null || f.removeChild(l)));
  });
  let d = xe();
  return p ? !l || !u ? null : Pi(d({ ourProps: { ref: i }, theirProps: r, slot: {}, defaultTag: Aa, name: "Portal" }), u) : null;
});
function Dc(e, t) {
  let n = Se(t), { enabled: r = !0, ownerDocument: o, ...i } = e, a = xe();
  return r ? z.createElement(_c, { ...i, ownerDocument: o, ref: n }) : a({ ourProps: { ref: n }, theirProps: i, slot: {}, defaultTag: Aa, name: "Portal" });
}
let Nc = Oe, Pa = ge(null);
function jc(e, t) {
  let { target: n, ...r } = e, o = { ref: Se(t) }, i = xe();
  return z.createElement(Pa.Provider, { value: n }, i({ ourProps: o, theirProps: r, defaultTag: Nc, name: "Popover.Group" }));
}
let Hc = ge(null), Wc = be(Dc), zc = be(jc), Bc = Object.assign(Wc, { Group: zc });
function Uc() {
  let e = V(!1);
  return ie(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
}
function Ca(e) {
  var t;
  return !!(e.enter || e.enterFrom || e.enterTo || e.leave || e.leaveFrom || e.leaveTo) || ((t = e.as) != null ? t : Ra) !== Oe || z.Children.count(e.children) === 1;
}
let bn = ge(null);
bn.displayName = "TransitionContext";
var Vc = ((e) => (e.Visible = "visible", e.Hidden = "hidden", e))(Vc || {});
function Yc() {
  let e = le(bn);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
function Gc() {
  let e = le(yn);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
let yn = ge(null);
yn.displayName = "NestingContext";
function xn(e) {
  return "children" in e ? xn(e.children) : e.current.filter(({ el: t }) => t.current !== null).filter(({ state: t }) => t === "visible").length > 0;
}
function $a(e, t) {
  let n = ct(e), r = V([]), o = Uc(), i = bt(), a = X((f, m = Ye.Hidden) => {
    let h = r.current.findIndex(({ el: g }) => g === f);
    h !== -1 && (Ce(m, { [Ye.Unmount]() {
      r.current.splice(h, 1);
    }, [Ye.Hidden]() {
      r.current[h].state = "hidden";
    } }), i.microTask(() => {
      var g;
      !xn(r) && o.current && ((g = n.current) == null || g.call(n));
    }));
  }), s = X((f) => {
    let m = r.current.find(({ el: h }) => h === f);
    return m ? m.state !== "visible" && (m.state = "visible") : r.current.push({ el: f, state: "visible" }), () => a(f, Ye.Unmount);
  }), l = V([]), u = V(Promise.resolve()), c = V({ enter: [], leave: [] }), p = X((f, m, h) => {
    l.current.splice(0), t && (t.chains.current[m] = t.chains.current[m].filter(([g]) => g !== f)), t == null || t.chains.current[m].push([f, new Promise((g) => {
      l.current.push(g);
    })]), t == null || t.chains.current[m].push([f, new Promise((g) => {
      Promise.all(c.current[m].map(([y, w]) => w)).then(() => g());
    })]), m === "enter" ? u.current = u.current.then(() => t == null ? void 0 : t.wait.current).then(() => h(m)) : h(m);
  }), d = X((f, m, h) => {
    Promise.all(c.current[m].splice(0).map(([g, y]) => y)).then(() => {
      var g;
      (g = l.current.shift()) == null || g();
    }).then(() => h(m));
  });
  return se(() => ({ children: r, register: s, unregister: a, onStart: p, onStop: d, wait: u, chains: c }), [s, a, r, p, d, c, u]);
}
let Ra = Oe, La = on.RenderStrategy;
function qc(e, t) {
  var n, r;
  let { transition: o = !0, beforeEnter: i, afterEnter: a, beforeLeave: s, afterLeave: l, enter: u, enterFrom: c, enterTo: p, entered: d, leave: f, leaveFrom: m, leaveTo: h, ...g } = e, [y, w] = oe(null), b = V(null), E = Ca(e), v = Se(...E ? [b, t, w] : t === null ? [] : [t]), P = (n = g.unmount) == null || n ? Ye.Unmount : Ye.Hidden, { show: $, appear: Y, initial: J } = Yc(), [C, N] = oe($ ? "visible" : "hidden"), Q = Gc(), { register: K, unregister: F } = Q;
  ie(() => K(b), [K, b]), ie(() => {
    if (P === Ye.Hidden && b.current) {
      if ($ && C !== "visible") {
        N("visible");
        return;
      }
      return Ce(C, { hidden: () => F(b), visible: () => K(b) });
    }
  }, [C, b, K, F, $, P]);
  let ae = Kr();
  ie(() => {
    if (E && ae && C === "visible" && b.current === null) throw new Error("Did you forget to passthrough the `ref` to the actual DOM node?");
  }, [b, C, ae, E]);
  let G = J && !Y, te = Y && $ && J, H = V(!1), q = $a(() => {
    H.current || (N("hidden"), F(b));
  }, Q), x = X((S) => {
    H.current = !0;
    let k = S ? "enter" : "leave";
    q.onStart(b, k, (D) => {
      D === "enter" ? i == null || i() : D === "leave" && (s == null || s());
    });
  }), T = X((S) => {
    let k = S ? "enter" : "leave";
    H.current = !1, q.onStop(b, k, (D) => {
      D === "enter" ? a == null || a() : D === "leave" && (l == null || l());
    }), k === "leave" && !xn(q) && (N("hidden"), F(b));
  });
  ue(() => {
    E && o || (x($), T($));
  }, [$, E, o]);
  let _ = !(!o || !E || !ae || G), [, I] = aa(_, y, $, { start: x, end: T }), M = Ve({ ref: v, className: ((r = ir(g.className, te && u, te && c, I.enter && u, I.enter && I.closed && c, I.enter && !I.closed && p, I.leave && f, I.leave && !I.closed && m, I.leave && I.closed && h, !I.transition && $ && d)) == null ? void 0 : r.trim()) || void 0, ...ia(I) }), W = 0;
  C === "visible" && (W |= Ae.Open), C === "hidden" && (W |= Ae.Closed), $ && C === "hidden" && (W |= Ae.Opening), !$ && C === "visible" && (W |= Ae.Closing);
  let j = xe();
  return z.createElement(yn.Provider, { value: q }, z.createElement(Oa, { value: W }, j({ ourProps: M, theirProps: g, defaultTag: Ra, features: La, visible: C === "visible", name: "Transition.Child" })));
}
function Kc(e, t) {
  let { show: n, appear: r = !1, unmount: o = !0, ...i } = e, a = V(null), s = Ca(e), l = Se(...s ? [a, t] : t === null ? [] : [t]);
  Kr();
  let u = qr();
  if (n === void 0 && u !== null && (n = (u & Ae.Open) === Ae.Open), n === void 0) throw new Error("A <Transition /> is used but it is missing a `show={true | false}` prop.");
  let [c, p] = oe(n ? "visible" : "hidden"), d = $a(() => {
    n || p("hidden");
  }), [f, m] = oe(!0), h = V([n]);
  ie(() => {
    f !== !1 && h.current[h.current.length - 1] !== n && (h.current.push(n), m(!1));
  }, [h, n]);
  let g = se(() => ({ show: n, appear: r, initial: f }), [n, r, f]);
  ie(() => {
    n ? p("visible") : !xn(d) && a.current !== null && p("hidden");
  }, [n, d]);
  let y = { unmount: o }, w = X(() => {
    var v;
    f && m(!1), (v = e.beforeEnter) == null || v.call(e);
  }), b = X(() => {
    var v;
    f && m(!1), (v = e.beforeLeave) == null || v.call(e);
  }), E = xe();
  return z.createElement(yn.Provider, { value: d }, z.createElement(bn.Provider, { value: g }, E({ ourProps: { ...y, as: Oe, children: z.createElement(Fa, { ref: l, ...y, ...i, beforeEnter: w, beforeLeave: b }) }, theirProps: {}, defaultTag: Oe, features: La, visible: c === "visible", name: "Transition" })));
}
function Xc(e, t) {
  let n = le(bn) !== null, r = qr() !== null;
  return z.createElement(z.Fragment, null, !n && r ? z.createElement(pr, { ref: t, ...e }) : z.createElement(Fa, { ref: t, ...e }));
}
let pr = be(Kc), Fa = be(qc), Qc = be(Xc), Jc = Object.assign(pr, { Child: Qc, Root: pr });
function Zc(e, t) {
  let n = V({ left: 0, top: 0 });
  if (ie(() => {
    if (!t) return;
    let o = t.getBoundingClientRect();
    o && (n.current = o);
  }, [e, t]), t == null || !e || t === document.activeElement) return !1;
  let r = t.getBoundingClientRect();
  return r.top !== n.current.top || r.left !== n.current.left;
}
let Do = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;
function No(e) {
  var t, n;
  let r = (t = e.innerText) != null ? t : "", o = e.cloneNode(!0);
  if (!(o instanceof HTMLElement)) return r;
  let i = !1;
  for (let s of o.querySelectorAll('[hidden],[aria-hidden],[role="img"]')) s.remove(), i = !0;
  let a = i ? (n = o.innerText) != null ? n : "" : r;
  return Do.test(a) && (a = a.replace(Do, "")), a;
}
function ef(e) {
  let t = e.getAttribute("aria-label");
  if (typeof t == "string") return t.trim();
  let n = e.getAttribute("aria-labelledby");
  if (n) {
    let r = n.split(" ").map((o) => {
      let i = document.getElementById(o);
      if (i) {
        let a = i.getAttribute("aria-label");
        return typeof a == "string" ? a.trim() : No(i).trim();
      }
      return null;
    }).filter(Boolean);
    if (r.length > 0) return r.join(", ");
  }
  return No(e).trim();
}
function tf(e) {
  let t = V(""), n = V("");
  return X(() => {
    let r = e.current;
    if (!r) return "";
    let o = r.innerText;
    if (t.current === o) return n.current;
    let i = ef(r).trim().toLowerCase();
    return t.current = o, n.current = i, i;
  });
}
var nf = Object.defineProperty, rf = (e, t, n) => t in e ? nf(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, jo = (e, t, n) => (rf(e, typeof t != "symbol" ? t + "" : t, n), n), fe = ((e) => (e[e.Open = 0] = "Open", e[e.Closed = 1] = "Closed", e))(fe || {}), Ie = ((e) => (e[e.Single = 0] = "Single", e[e.Multi = 1] = "Multi", e))(Ie || {}), mr = ((e) => (e[e.Pointer = 0] = "Pointer", e[e.Other = 1] = "Other", e))(mr || {}), Ia = ((e) => (e[e.OpenListbox = 0] = "OpenListbox", e[e.CloseListbox = 1] = "CloseListbox", e[e.GoToOption = 2] = "GoToOption", e[e.Search = 3] = "Search", e[e.ClearSearch = 4] = "ClearSearch", e[e.RegisterOptions = 5] = "RegisterOptions", e[e.UnregisterOptions = 6] = "UnregisterOptions", e[e.SetButtonElement = 7] = "SetButtonElement", e[e.SetOptionsElement = 8] = "SetOptionsElement", e[e.SortOptions = 9] = "SortOptions", e))(Ia || {});
function Ho(e, t = (n) => n) {
  let n = e.activeOptionIndex !== null ? e.options[e.activeOptionIndex] : null, r = ra(t(e.options.slice()), (i) => i.dataRef.current.domRef.current), o = n ? r.indexOf(n) : null;
  return o === -1 && (o = null), { options: r, activeOptionIndex: o };
}
let of = { 1(e) {
  return e.dataRef.current.disabled || e.listboxState === 1 ? e : { ...e, activeOptionIndex: null, listboxState: 1, __demoMode: !1 };
}, 0(e) {
  if (e.dataRef.current.disabled || e.listboxState === 0) return e;
  let t = e.activeOptionIndex, { isSelected: n } = e.dataRef.current, r = e.options.findIndex((o) => n(o.dataRef.current.value));
  return r !== -1 && (t = r), { ...e, listboxState: 0, activeOptionIndex: t, __demoMode: !1 };
}, 2(e, t) {
  var n, r, o, i, a;
  if (e.dataRef.current.disabled || e.listboxState === 1) return e;
  let s = { ...e, searchQuery: "", activationTrigger: (n = t.trigger) != null ? n : 1, __demoMode: !1 };
  if (t.focus === de.Nothing) return { ...s, activeOptionIndex: null };
  if (t.focus === de.Specific) return { ...s, activeOptionIndex: e.options.findIndex((c) => c.id === t.id) };
  if (t.focus === de.Previous) {
    let c = e.activeOptionIndex;
    if (c !== null) {
      let p = e.options[c].dataRef.current.domRef, d = Wn(t, { resolveItems: () => e.options, resolveActiveIndex: () => e.activeOptionIndex, resolveId: (f) => f.id, resolveDisabled: (f) => f.dataRef.current.disabled });
      if (d !== null) {
        let f = e.options[d].dataRef.current.domRef;
        if (((r = p.current) == null ? void 0 : r.previousElementSibling) === f.current || ((o = f.current) == null ? void 0 : o.previousElementSibling) === null) return { ...s, activeOptionIndex: d };
      }
    }
  } else if (t.focus === de.Next) {
    let c = e.activeOptionIndex;
    if (c !== null) {
      let p = e.options[c].dataRef.current.domRef, d = Wn(t, { resolveItems: () => e.options, resolveActiveIndex: () => e.activeOptionIndex, resolveId: (f) => f.id, resolveDisabled: (f) => f.dataRef.current.disabled });
      if (d !== null) {
        let f = e.options[d].dataRef.current.domRef;
        if (((i = p.current) == null ? void 0 : i.nextElementSibling) === f.current || ((a = f.current) == null ? void 0 : a.nextElementSibling) === null) return { ...s, activeOptionIndex: d };
      }
    }
  }
  let l = Ho(e), u = Wn(t, { resolveItems: () => l.options, resolveActiveIndex: () => l.activeOptionIndex, resolveId: (c) => c.id, resolveDisabled: (c) => c.dataRef.current.disabled });
  return { ...s, ...l, activeOptionIndex: u };
}, 3: (e, t) => {
  if (e.dataRef.current.disabled || e.listboxState === 1) return e;
  let n = e.searchQuery !== "" ? 0 : 1, r = e.searchQuery + t.value.toLowerCase(), o = (e.activeOptionIndex !== null ? e.options.slice(e.activeOptionIndex + n).concat(e.options.slice(0, e.activeOptionIndex + n)) : e.options).find((a) => {
    var s;
    return !a.dataRef.current.disabled && ((s = a.dataRef.current.textValue) == null ? void 0 : s.startsWith(r));
  }), i = o ? e.options.indexOf(o) : -1;
  return i === -1 || i === e.activeOptionIndex ? { ...e, searchQuery: r } : { ...e, searchQuery: r, activeOptionIndex: i, activationTrigger: 1 };
}, 4(e) {
  return e.dataRef.current.disabled || e.listboxState === 1 || e.searchQuery === "" ? e : { ...e, searchQuery: "" };
}, 5: (e, t) => {
  let n = e.options.concat(t.options), r = e.activeOptionIndex;
  if (e.activeOptionIndex === null) {
    let { isSelected: o } = e.dataRef.current;
    if (o) {
      let i = n.findIndex((a) => o == null ? void 0 : o(a.dataRef.current.value));
      i !== -1 && (r = i);
    }
  }
  return { ...e, options: n, activeOptionIndex: r, pendingShouldSort: !0 };
}, 6: (e, t) => {
  let n = e.options, r = [], o = new Set(t.options);
  for (let [i, a] of n.entries()) if (o.has(a.id) && (r.push(i), o.delete(a.id), o.size === 0)) break;
  if (r.length > 0) {
    n = n.slice();
    for (let i of r.reverse()) n.splice(i, 1);
  }
  return { ...e, options: n, activationTrigger: 1 };
}, 7: (e, t) => e.buttonElement === t.element ? e : { ...e, buttonElement: t.element }, 8: (e, t) => e.optionsElement === t.element ? e : { ...e, optionsElement: t.element }, 9: (e) => e.pendingShouldSort ? { ...e, ...Ho(e), pendingShouldSort: !1 } : e };
class Xr extends Cc {
  constructor(t) {
    super(t), jo(this, "actions", { onChange: (n) => {
      let { onChange: r, compare: o, mode: i, value: a } = this.state.dataRef.current;
      return Ce(i, { 0: () => r == null ? void 0 : r(n), 1: () => {
        let s = a.slice(), l = s.findIndex((u) => o(u, n));
        return l === -1 ? s.push(n) : s.splice(l, 1), r == null ? void 0 : r(s);
      } });
    }, registerOption: Hn(() => {
      let n = [], r = /* @__PURE__ */ new Set();
      return [(o, i) => {
        r.has(i) || (r.add(i), n.push({ id: o, dataRef: i }));
      }, () => (r.clear(), this.send({ type: 5, options: n.splice(0) }))];
    }), unregisterOption: Hn(() => {
      let n = [];
      return [(r) => n.push(r), () => {
        this.send({ type: 6, options: n.splice(0) });
      }];
    }), goToOption: Hn(() => {
      let n = null;
      return [(r, o) => {
        n = { type: 2, ...r, trigger: o };
      }, () => n && this.send(n)];
    }), closeListbox: () => {
      this.send({ type: 1 });
    }, openListbox: () => {
      this.send({ type: 0 });
    }, selectActiveOption: () => {
      if (this.state.activeOptionIndex !== null) {
        let { dataRef: n, id: r } = this.state.options[this.state.activeOptionIndex];
        this.actions.onChange(n.current.value), this.send({ type: 2, focus: de.Specific, id: r });
      }
    }, selectOption: (n) => {
      let r = this.state.options.find((o) => o.id === n);
      r && this.actions.onChange(r.dataRef.current.value);
    }, search: (n) => {
      this.send({ type: 3, value: n });
    }, clearSearch: () => {
      this.send({ type: 4 });
    }, setButtonElement: (n) => {
      this.send({ type: 7, element: n });
    }, setOptionsElement: (n) => {
      this.send({ type: 8, element: n });
    } }), jo(this, "selectors", { activeDescendantId(n) {
      var r;
      let o = n.activeOptionIndex, i = n.options;
      return o === null || (r = i[o]) == null ? void 0 : r.id;
    }, isActive(n, r) {
      var o;
      let i = n.activeOptionIndex, a = n.options;
      return i !== null ? ((o = a[i]) == null ? void 0 : o.id) === r : !1;
    }, shouldScrollIntoView(n, r) {
      return n.__demoMode || n.listboxState !== 0 || n.activationTrigger === 0 ? !1 : this.isActive(n, r);
    } }), this.on(5, () => {
      requestAnimationFrame(() => {
        this.send({ type: 9 });
      });
    });
  }
  static new({ __demoMode: t = !1 } = {}) {
    return new Xr({ dataRef: { current: {} }, listboxState: t ? 0 : 1, options: [], searchQuery: "", activeOptionIndex: null, activationTrigger: 1, buttonElement: null, optionsElement: null, __demoMode: t });
  }
  reduce(t, n) {
    return Ce(n.type, of, t, n);
  }
}
const ka = ge(null);
function Qr(e) {
  let t = le(ka);
  if (t === null) {
    let n = new Error(`<${e} /> is missing a parent <Listbox /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(n, Ma), n;
  }
  return t;
}
function Ma({ __demoMode: e = !1 } = {}) {
  return se(() => Xr.new({ __demoMode: e }), []);
}
let wn = ge(null);
wn.displayName = "ListboxDataContext";
function Ht(e) {
  let t = le(wn);
  if (t === null) {
    let n = new Error(`<${e} /> is missing a parent <Listbox /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(n, Ht), n;
  }
  return t;
}
let af = Oe;
function sf(e, t) {
  let n = Dr(), { value: r, defaultValue: o, form: i, name: a, onChange: s, by: l, invalid: u = !1, disabled: c = n || !1, horizontal: p = !1, multiple: d = !1, __demoMode: f = !1, ...m } = e;
  const h = p ? "horizontal" : "vertical";
  let g = Se(t), y = sl(o), [w = d ? [] : void 0, b] = al(r, s, y), E = Ma({ __demoMode: f }), v = V({ static: !1, hold: !1 }), P = V(/* @__PURE__ */ new Map()), $ = $l(l), Y = re((x) => Ce(J.mode, { [Ie.Multi]: () => w.some((T) => $(T, x)), [Ie.Single]: () => $(w, x) }), [w]), J = se(() => ({ value: w, disabled: c, invalid: u, mode: d ? Ie.Multi : Ie.Single, orientation: h, onChange: b, compare: $, isSelected: Y, optionsPropsRef: v, listRef: P }), [w, c, u, d, h, b, $, Y, v, P]);
  ie(() => {
    E.state.dataRef.current = J;
  }, [J]);
  let C = Pe(E, (x) => x.listboxState), N = C === fe.Open, [Q, K] = Pe(E, (x) => [x.buttonElement, x.optionsElement]);
  Gl(N, [Q, K], (x, T) => {
    E.send({ type: Ia.CloseListbox }), na(T, Wr.Loose) || (x.preventDefault(), Q == null || Q.focus());
  });
  let F = se(() => ({ open: C === fe.Open, disabled: c, invalid: u, value: w }), [C, c, u, w]), [ae, G] = Ol({ inherit: !0 }), te = { ref: g }, H = re(() => {
    if (y !== void 0) return b == null ? void 0 : b(y);
  }, [b, y]), q = xe();
  return z.createElement(G, { value: ae, props: { htmlFor: Q == null ? void 0 : Q.id }, slot: { open: C === fe.Open, disabled: c } }, z.createElement(yc, null, z.createElement(ka.Provider, { value: E }, z.createElement(wn.Provider, { value: J }, z.createElement(Oa, { value: Ce(C, { [fe.Open]: Ae.Open, [fe.Closed]: Ae.Closed }) }, a != null && w != null && z.createElement(pl, { disabled: c, data: { [a]: w }, form: i, onReset: H }), q({ ourProps: te, theirProps: m, slot: F, defaultTag: af, name: "Listbox" }))))));
}
let lf = "button";
function uf(e, t) {
  let n = vt(), r = Gi(), o = Ht("Listbox.Button"), i = Qr("Listbox.Button"), { id: a = r || `headlessui-listbox-button-${n}`, disabled: s = o.disabled || !1, autoFocus: l = !1, ...u } = e, c = Se(t, hc(), i.actions.setButtonElement), p = gc(), d = X((F) => {
    switch (F.key) {
      case ce.Enter:
        ll(F.currentTarget);
        break;
      case ce.Space:
      case ce.ArrowDown:
        F.preventDefault(), nt(() => i.actions.openListbox()), o.value || i.actions.goToOption({ focus: de.First });
        break;
      case ce.ArrowUp:
        F.preventDefault(), nt(() => i.actions.openListbox()), o.value || i.actions.goToOption({ focus: de.Last });
        break;
    }
  }), f = X((F) => {
    switch (F.key) {
      case ce.Space:
        F.preventDefault();
        break;
    }
  }), m = X((F) => {
    var ae;
    if (F.button === 0) {
      if (gl(F.currentTarget)) return F.preventDefault();
      i.state.listboxState === fe.Open ? (nt(() => i.actions.closeListbox()), (ae = i.state.buttonElement) == null || ae.focus({ preventScroll: !0 })) : (F.preventDefault(), i.actions.openListbox());
    }
  }), h = X((F) => F.preventDefault()), g = Qi([a]), y = yl(), { isFocusVisible: w, focusProps: b } = qs({ autoFocus: l }), { isHovered: E, hoverProps: v } = Gs({ isDisabled: s }), { pressed: P, pressProps: $ } = el({ disabled: s }), Y = Pe(i, (F) => F.listboxState), J = se(() => ({ open: Y === fe.Open, active: P || Y === fe.Open, disabled: s, invalid: o.invalid, value: o.value, hover: E, focus: w, autofocus: l }), [Y, o.value, s, E, w, P, o.invalid, l]), C = Pe(i, (F) => F.listboxState === fe.Open), [N, Q] = Pe(i, (F) => [F.buttonElement, F.optionsElement]), K = zi(p(), { ref: c, id: a, type: ql(e, N), "aria-haspopup": "listbox", "aria-controls": Q == null ? void 0 : Q.id, "aria-expanded": C, "aria-labelledby": g, "aria-describedby": y, disabled: s || void 0, autoFocus: l, onKeyDown: d, onKeyUp: f, onKeyPress: h, onMouseDown: m }, b, v, $);
  return xe()({ ourProps: K, theirProps: u, slot: J, defaultTag: lf, name: "Listbox.Button" });
}
let _a = ge(!1), cf = "div", ff = on.RenderStrategy | on.Static;
function df(e, t) {
  let n = vt(), { id: r = `headlessui-listbox-options-${n}`, anchor: o, portal: i = !1, modal: a = !0, transition: s = !1, ...l } = e, u = mc(o), [c, p] = oe(null);
  u && (i = !0);
  let d = Ht("Listbox.Options"), f = Qr("Listbox.Options"), [m, h, g, y] = Pe(f, (S) => [S.listboxState, S.buttonElement, S.optionsElement, S.__demoMode]), w = ur(h), b = ur(g), E = qr(), [v, P] = aa(s, c, E !== null ? (E & Ae.Open) === Ae.Open : m === fe.Open);
  kl(v, h, f.actions.closeListbox);
  let $ = y ? !1 : a && m === fe.Open;
  eu($, b);
  let Y = y ? !1 : a && m === fe.Open;
  Il(Y, { allowed: re(() => [h, g], [h, g]) });
  let J = m !== fe.Open, C = Zc(J, h) ? !1 : v, N = v && m === fe.Closed, Q = Ec(N, d.value), K = X((S) => d.compare(Q, S)), F = Pe(f, (S) => {
    var k;
    if (u == null || !((k = u == null ? void 0 : u.to) != null && k.includes("selection"))) return null;
    let D = S.options.findIndex((U) => K(U.dataRef.current.value));
    return D === -1 && (D = 0), D;
  }), ae = (() => {
    if (u == null) return;
    if (F === null) return { ...u, inner: void 0 };
    let S = Array.from(d.listRef.current.values());
    return { ...u, inner: { listRef: { current: S }, index: F } };
  })(), [G, te] = bc(ae), H = vc(), q = Se(t, u ? G : null, f.actions.setOptionsElement, p), x = bt();
  ue(() => {
    var S;
    let k = g;
    k && m === fe.Open && k !== ((S = Dt(k)) == null ? void 0 : S.activeElement) && (k == null || k.focus({ preventScroll: !0 }));
  }, [m, g]);
  let T = X((S) => {
    var k, D;
    switch (x.dispose(), S.key) {
      case ce.Space:
        if (f.state.searchQuery !== "") return S.preventDefault(), S.stopPropagation(), f.actions.search(S.key);
      case ce.Enter:
        if (S.preventDefault(), S.stopPropagation(), f.state.activeOptionIndex !== null) {
          let { dataRef: U } = f.state.options[f.state.activeOptionIndex];
          f.actions.onChange(U.current.value);
        }
        d.mode === Ie.Single && (nt(() => f.actions.closeListbox()), (k = f.state.buttonElement) == null || k.focus({ preventScroll: !0 }));
        break;
      case Ce(d.orientation, { vertical: ce.ArrowDown, horizontal: ce.ArrowRight }):
        return S.preventDefault(), S.stopPropagation(), f.actions.goToOption({ focus: de.Next });
      case Ce(d.orientation, { vertical: ce.ArrowUp, horizontal: ce.ArrowLeft }):
        return S.preventDefault(), S.stopPropagation(), f.actions.goToOption({ focus: de.Previous });
      case ce.Home:
      case ce.PageUp:
        return S.preventDefault(), S.stopPropagation(), f.actions.goToOption({ focus: de.First });
      case ce.End:
      case ce.PageDown:
        return S.preventDefault(), S.stopPropagation(), f.actions.goToOption({ focus: de.Last });
      case ce.Escape:
        S.preventDefault(), S.stopPropagation(), nt(() => f.actions.closeListbox()), (D = f.state.buttonElement) == null || D.focus({ preventScroll: !0 });
        return;
      case ce.Tab:
        S.preventDefault(), S.stopPropagation(), nt(() => f.actions.closeListbox()), zl(f.state.buttonElement, S.shiftKey ? lr.Previous : lr.Next);
        break;
      default:
        S.key.length === 1 && (f.actions.search(S.key), x.setTimeout(() => f.actions.clearSearch(), 350));
        break;
    }
  }), _ = Pe(f, (S) => {
    var k;
    return (k = S.buttonElement) == null ? void 0 : k.id;
  }), I = se(() => ({ open: m === fe.Open }), [m]), M = zi(u ? H() : {}, { id: r, ref: q, "aria-activedescendant": Pe(f, f.selectors.activeDescendantId), "aria-multiselectable": d.mode === Ie.Multi ? !0 : void 0, "aria-labelledby": _, "aria-orientation": d.orientation, onKeyDown: T, role: "listbox", tabIndex: m === fe.Open ? 0 : void 0, style: { ...l.style, ...te, "--button-width": Ll(h, !0).width }, ...ia(P) }), W = xe(), j = se(() => d.mode === Ie.Multi ? d : { ...d, isSelected: K }, [d, K]);
  return z.createElement(Bc, { enabled: i ? e.static || v : !1, ownerDocument: w }, z.createElement(wn.Provider, { value: j }, W({ ourProps: M, theirProps: l, slot: I, defaultTag: cf, features: ff, visible: C, name: "Listbox.Options" })));
}
let pf = "div";
function mf(e, t) {
  let n = vt(), { id: r = `headlessui-listbox-option-${n}`, disabled: o = !1, value: i, ...a } = e, s = le(_a) === !0, l = Ht("Listbox.Option"), u = Qr("Listbox.Option"), c = Pe(u, (C) => u.selectors.isActive(C, r)), p = l.isSelected(i), d = V(null), f = tf(d), m = ct({ disabled: o, value: i, domRef: d, get textValue() {
    return f();
  } }), h = Se(t, d, (C) => {
    C ? l.listRef.current.set(r, C) : l.listRef.current.delete(r);
  }), g = Pe(u, (C) => u.selectors.shouldScrollIntoView(C, r));
  ie(() => {
    if (g) return Ne().requestAnimationFrame(() => {
      var C, N;
      (N = (C = d.current) == null ? void 0 : C.scrollIntoView) == null || N.call(C, { block: "nearest" });
    });
  }, [g, d]), ie(() => {
    if (!s) return u.actions.registerOption(r, m), () => u.actions.unregisterOption(r);
  }, [m, r, s]);
  let y = X((C) => {
    var N;
    if (o) return C.preventDefault();
    u.actions.onChange(i), l.mode === Ie.Single && (nt(() => u.actions.closeListbox()), (N = u.state.buttonElement) == null || N.focus({ preventScroll: !0 }));
  }), w = X(() => {
    if (o) return u.actions.goToOption({ focus: de.Nothing });
    u.actions.goToOption({ focus: de.Specific, id: r });
  }), b = tu(), E = X((C) => {
    b.update(C), !o && (c || u.actions.goToOption({ focus: de.Specific, id: r }, mr.Pointer));
  }), v = X((C) => {
    b.wasMoved(C) && (o || c || u.actions.goToOption({ focus: de.Specific, id: r }, mr.Pointer));
  }), P = X((C) => {
    b.wasMoved(C) && (o || c && u.actions.goToOption({ focus: de.Nothing }));
  }), $ = se(() => ({ active: c, focus: c, selected: p, disabled: o, selectedOption: p && s }), [c, p, o, s]), Y = s ? {} : { id: r, ref: h, role: "option", tabIndex: o === !0 ? void 0 : -1, "aria-disabled": o === !0 ? !0 : void 0, "aria-selected": p, disabled: void 0, onClick: y, onFocus: w, onPointerEnter: E, onMouseEnter: E, onPointerMove: v, onMouseMove: v, onPointerLeave: P, onMouseLeave: P }, J = xe();
  return !p && s ? null : J({ ourProps: Y, theirProps: a, slot: $, defaultTag: pf, name: "Listbox.Option" });
}
let hf = Oe;
function gf(e, t) {
  let { options: n, placeholder: r, ...o } = e, i = { ref: Se(t) }, a = Ht("ListboxSelectedOption"), s = se(() => ({}), []), l = a.value === void 0 || a.value === null || a.mode === Ie.Multi && Array.isArray(a.value) && a.value.length === 0, u = xe();
  return z.createElement(_a.Provider, { value: !0 }, u({ ourProps: i, theirProps: { ...o, children: z.createElement(z.Fragment, null, r && l ? r : n) }, slot: s, defaultTag: hf, name: "ListboxSelectedOption" }));
}
let vf = be(sf), bf = be(uf), yf = Pl, xf = be(df), wf = be(mf), Ef = be(gf), Gt = Object.assign(vf, { Button: bf, Label: yf, Options: xf, Option: wf, SelectedOption: Ef });
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Of = {
  prefix: "fas",
  iconName: "chevron-down",
  icon: [512, 512, [], "f078", "M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"]
}, Sf = {
  prefix: "fas",
  iconName: "check",
  icon: [448, 512, [10003, 10004], "f00c", "M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"]
};
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function Tf(e, t, n) {
  return (t = Pf(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Wo(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function O(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Wo(Object(n), !0).forEach(function(r) {
      Tf(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Wo(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Af(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Pf(e) {
  var t = Af(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const zo = () => {
};
let Jr = {}, Da = {}, Na = null, ja = {
  mark: zo,
  measure: zo
};
try {
  typeof window < "u" && (Jr = window), typeof document < "u" && (Da = document), typeof MutationObserver < "u" && (Na = MutationObserver), typeof performance < "u" && (ja = performance);
} catch {
}
const {
  userAgent: Bo = ""
} = Jr.navigator || {}, Ke = Jr, ne = Da, Uo = Na, qt = ja;
Ke.document;
const Be = !!ne.documentElement && !!ne.head && typeof ne.addEventListener == "function" && typeof ne.createElement == "function", Ha = ~Bo.indexOf("MSIE") || ~Bo.indexOf("Trident/");
var Cf = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, $f = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Wa = {
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
}, Rf = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, za = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], he = "classic", En = "duotone", Lf = "sharp", Ff = "sharp-duotone", Ba = [he, En, Lf, Ff], If = {
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
}, kf = {
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
}, Mf = /* @__PURE__ */ new Map([["classic", {
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
}]]), _f = {
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
}, Df = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Vo = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, Nf = ["kit"], jf = {
  kit: {
    "fa-kit": "fak"
  }
}, Hf = ["fak", "fakd"], Wf = {
  kit: {
    fak: "fa-kit"
  }
}, Yo = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Kt = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, zf = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Bf = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Uf = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, Vf = {
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
}, Yf = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, hr = {
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
}, Gf = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], gr = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...zf, ...Gf], qf = ["solid", "regular", "light", "thin", "duotone", "brands"], Ua = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], Kf = Ua.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), Xf = [...Object.keys(Yf), ...qf, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Kt.GROUP, Kt.SWAP_OPACITY, Kt.PRIMARY, Kt.SECONDARY].concat(Ua.map((e) => "".concat(e, "x"))).concat(Kf.map((e) => "w-".concat(e))), Qf = {
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
const We = "___FONT_AWESOME___", vr = 16, Va = "fa", Ya = "svg-inline--fa", lt = "data-fa-i2svg", br = "data-fa-pseudo-element", Jf = "data-fa-pseudo-element-pending", Zr = "data-prefix", eo = "data-icon", Go = "fontawesome-i2svg", Zf = "async", ed = ["HTML", "HEAD", "STYLE", "SCRIPT"], Ga = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Wt(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[he];
    }
  });
}
const qa = O({}, Wa);
qa[he] = O(O(O(O({}, {
  "fa-duotone": "duotone"
}), Wa[he]), Vo.kit), Vo["kit-duotone"]);
const td = Wt(qa), yr = O({}, _f);
yr[he] = O(O(O(O({}, {
  duotone: "fad"
}), yr[he]), Yo.kit), Yo["kit-duotone"]);
const qo = Wt(yr), xr = O({}, hr);
xr[he] = O(O({}, xr[he]), Wf.kit);
const to = Wt(xr), wr = O({}, Vf);
wr[he] = O(O({}, wr[he]), jf.kit);
Wt(wr);
const nd = Cf, Ka = "fa-layers-text", rd = $f, od = O({}, If);
Wt(od);
const id = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], zn = Rf, ad = [...Nf, ...Xf], $t = Ke.FontAwesomeConfig || {};
function sd(e) {
  var t = ne.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function ld(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
ne && typeof ne.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [n, r] = t;
  const o = ld(sd(n));
  o != null && ($t[r] = o);
});
const Xa = {
  styleDefault: "solid",
  familyDefault: he,
  cssPrefix: Va,
  replacementClass: Ya,
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
$t.familyPrefix && ($t.cssPrefix = $t.familyPrefix);
const gt = O(O({}, Xa), $t);
gt.autoReplaceSvg || (gt.observeMutations = !1);
const R = {};
Object.keys(Xa).forEach((e) => {
  Object.defineProperty(R, e, {
    enumerable: !0,
    set: function(t) {
      gt[e] = t, Rt.forEach((n) => n(R));
    },
    get: function() {
      return gt[e];
    }
  });
});
Object.defineProperty(R, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    gt.cssPrefix = e, Rt.forEach((t) => t(R));
  },
  get: function() {
    return gt.cssPrefix;
  }
});
Ke.FontAwesomeConfig = R;
const Rt = [];
function ud(e) {
  return Rt.push(e), () => {
    Rt.splice(Rt.indexOf(e), 1);
  };
}
const Ue = vr, ke = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function cd(e) {
  if (!e || !Be)
    return;
  const t = ne.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = ne.head.childNodes;
  let r = null;
  for (let o = n.length - 1; o > -1; o--) {
    const i = n[o], a = (i.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(a) > -1 && (r = i);
  }
  return ne.head.insertBefore(t, r), e;
}
const fd = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function kt() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += fd[Math.random() * 62 | 0];
  return t;
}
function Et(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function no(e) {
  return e.classList ? Et(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function Qa(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function dd(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(Qa(e[n]), '" '), "").trim();
}
function On(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function ro(e) {
  return e.size !== ke.size || e.x !== ke.x || e.y !== ke.y || e.rotate !== ke.rotate || e.flipX || e.flipY;
}
function pd(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const o = {
    transform: "translate(".concat(n / 2, " 256)")
  }, i = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), a = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), l = {
    transform: "".concat(i, " ").concat(a, " ").concat(s)
  }, u = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: l,
    path: u
  };
}
function md(e) {
  let {
    transform: t,
    width: n = vr,
    height: r = vr,
    startCentered: o = !1
  } = e, i = "";
  return o && Ha ? i += "translate(".concat(t.x / Ue - n / 2, "em, ").concat(t.y / Ue - r / 2, "em) ") : o ? i += "translate(calc(-50% + ".concat(t.x / Ue, "em), calc(-50% + ").concat(t.y / Ue, "em)) ") : i += "translate(".concat(t.x / Ue, "em, ").concat(t.y / Ue, "em) "), i += "scale(".concat(t.size / Ue * (t.flipX ? -1 : 1), ", ").concat(t.size / Ue * (t.flipY ? -1 : 1), ") "), i += "rotate(".concat(t.rotate, "deg) "), i;
}
var hd = `:root, :host {
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
function Ja() {
  const e = Va, t = Ya, n = R.cssPrefix, r = R.replacementClass;
  let o = hd;
  if (n !== e || r !== t) {
    const i = new RegExp("\\.".concat(e, "\\-"), "g"), a = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(i, ".".concat(n, "-")).replace(a, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return o;
}
let Ko = !1;
function Bn() {
  R.autoAddCss && !Ko && (cd(Ja()), Ko = !0);
}
var gd = {
  mixout() {
    return {
      dom: {
        css: Ja,
        insertCss: Bn
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Bn();
      },
      beforeI2svg() {
        Bn();
      }
    };
  }
};
const ze = Ke || {};
ze[We] || (ze[We] = {});
ze[We].styles || (ze[We].styles = {});
ze[We].hooks || (ze[We].hooks = {});
ze[We].shims || (ze[We].shims = []);
var Me = ze[We];
const Za = [], es = function() {
  ne.removeEventListener("DOMContentLoaded", es), un = 1, Za.map((e) => e());
};
let un = !1;
Be && (un = (ne.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(ne.readyState), un || ne.addEventListener("DOMContentLoaded", es));
function vd(e) {
  Be && (un ? setTimeout(e, 0) : Za.push(e));
}
function zt(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? Qa(e) : "<".concat(t, " ").concat(dd(n), ">").concat(r.map(zt).join(""), "</").concat(t, ">");
}
function Xo(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var Un = function(t, n, r, o) {
  var i = Object.keys(t), a = i.length, s = n, l, u, c;
  for (r === void 0 ? (l = 1, c = t[i[0]]) : (l = 0, c = r); l < a; l++)
    u = i[l], c = s(c, t[u], u, t);
  return c;
};
function bd(e) {
  const t = [];
  let n = 0;
  const r = e.length;
  for (; n < r; ) {
    const o = e.charCodeAt(n++);
    if (o >= 55296 && o <= 56319 && n < r) {
      const i = e.charCodeAt(n++);
      (i & 64512) == 56320 ? t.push(((o & 1023) << 10) + (i & 1023) + 65536) : (t.push(o), n--);
    } else
      t.push(o);
  }
  return t;
}
function Er(e) {
  const t = bd(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function yd(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), o;
  return r >= 55296 && r <= 56319 && n > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (r - 55296) * 1024 + o - 56320 + 65536 : r;
}
function Qo(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return !!r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function Or(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, o = Qo(t);
  typeof Me.hooks.addPack == "function" && !r ? Me.hooks.addPack(e, Qo(t)) : Me.styles[e] = O(O({}, Me.styles[e] || {}), o), e === "fas" && Or("fa", t);
}
const {
  styles: Mt,
  shims: xd
} = Me, ts = Object.keys(to), wd = ts.reduce((e, t) => (e[t] = Object.keys(to[t]), e), {});
let oo = null, ns = {}, rs = {}, os = {}, is = {}, as = {};
function Ed(e) {
  return ~ad.indexOf(e);
}
function Od(e, t) {
  const n = t.split("-"), r = n[0], o = n.slice(1).join("-");
  return r === e && o !== "" && !Ed(o) ? o : null;
}
const ss = () => {
  const e = (r) => Un(Mt, (o, i, a) => (o[a] = Un(i, r, {}), o), {});
  ns = e((r, o, i) => (o[3] && (r[o[3]] = i), o[2] && o[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = i;
  }), r)), rs = e((r, o, i) => (r[i] = i, o[2] && o[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = i;
  }), r)), as = e((r, o, i) => {
    const a = o[2];
    return r[i] = i, a.forEach((s) => {
      r[s] = i;
    }), r;
  });
  const t = "far" in Mt || R.autoFetchSvg, n = Un(xd, (r, o) => {
    const i = o[0];
    let a = o[1];
    const s = o[2];
    return a === "far" && !t && (a = "fas"), typeof i == "string" && (r.names[i] = {
      prefix: a,
      iconName: s
    }), typeof i == "number" && (r.unicodes[i.toString(16)] = {
      prefix: a,
      iconName: s
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  os = n.names, is = n.unicodes, oo = Sn(R.styleDefault, {
    family: R.familyDefault
  });
};
ud((e) => {
  oo = Sn(e.styleDefault, {
    family: R.familyDefault
  });
});
ss();
function io(e, t) {
  return (ns[e] || {})[t];
}
function Sd(e, t) {
  return (rs[e] || {})[t];
}
function tt(e, t) {
  return (as[e] || {})[t];
}
function ls(e) {
  return os[e] || {
    prefix: null,
    iconName: null
  };
}
function Td(e) {
  const t = is[e], n = io("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Xe() {
  return oo;
}
const us = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function Ad(e) {
  let t = he;
  const n = ts.reduce((r, o) => (r[o] = "".concat(R.cssPrefix, "-").concat(o), r), {});
  return Ba.forEach((r) => {
    (e.includes(n[r]) || e.some((o) => wd[r].includes(o))) && (t = r);
  }), t;
}
function Sn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = he
  } = t, r = td[n][e];
  if (n === En && !e)
    return "fad";
  const o = qo[n][e] || qo[n][r], i = e in Me.styles ? e : null;
  return o || i || null;
}
function Pd(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const o = Od(R.cssPrefix, r);
    o ? n = o : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function Jo(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function Tn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const o = gr.concat(Bf), i = Jo(e.filter((p) => o.includes(p))), a = Jo(e.filter((p) => !gr.includes(p))), s = i.filter((p) => (r = p, !za.includes(p))), [l = null] = s, u = Ad(i), c = O(O({}, Pd(a)), {}, {
    prefix: Sn(l, {
      family: u
    })
  });
  return O(O(O({}, c), Ld({
    values: e,
    family: u,
    styles: Mt,
    config: R,
    canonical: c,
    givenPrefix: r
  })), Cd(n, r, c));
}
function Cd(e, t, n) {
  let {
    prefix: r,
    iconName: o
  } = n;
  if (e || !r || !o)
    return {
      prefix: r,
      iconName: o
    };
  const i = t === "fa" ? ls(o) : {}, a = tt(r, o);
  return o = i.iconName || a || o, r = i.prefix || r, r === "far" && !Mt.far && Mt.fas && !R.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: o
  };
}
const $d = Ba.filter((e) => e !== he || e !== En), Rd = Object.keys(hr).filter((e) => e !== he).map((e) => Object.keys(hr[e])).flat();
function Ld(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: o = "",
    styles: i = {},
    config: a = {}
  } = e, s = n === En, l = t.includes("fa-duotone") || t.includes("fad"), u = a.familyDefault === "duotone", c = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (l || u || c) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && $d.includes(n) && (Object.keys(i).find((d) => Rd.includes(d)) || a.autoFetchSvg)) {
    const d = Mf.get(n).defaultShortPrefixId;
    r.prefix = d, r.iconName = tt(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || o === "fa") && (r.prefix = Xe() || "fas"), r;
}
class Fd {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const o = n.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((i) => {
      this.definitions[i] = O(O({}, this.definitions[i] || {}), o[i]), Or(i, o[i]);
      const a = to[he][i];
      a && Or(a, o[i]), ss();
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
        prefix: i,
        iconName: a,
        icon: s
      } = r[o], l = s[2];
      t[i] || (t[i] = {}), l.length > 0 && l.forEach((u) => {
        typeof u == "string" && (t[i][u] = s);
      }), t[i][a] = s;
    }), t;
  }
}
let Zo = [], ft = {};
const mt = {}, Id = Object.keys(mt);
function kd(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return Zo = e, ft = {}, Object.keys(mt).forEach((r) => {
    Id.indexOf(r) === -1 && delete mt[r];
  }), Zo.forEach((r) => {
    const o = r.mixout ? r.mixout() : {};
    if (Object.keys(o).forEach((i) => {
      typeof o[i] == "function" && (n[i] = o[i]), typeof o[i] == "object" && Object.keys(o[i]).forEach((a) => {
        n[i] || (n[i] = {}), n[i][a] = o[i][a];
      });
    }), r.hooks) {
      const i = r.hooks();
      Object.keys(i).forEach((a) => {
        ft[a] || (ft[a] = []), ft[a].push(i[a]);
      });
    }
    r.provides && r.provides(mt);
  }), n;
}
function Sr(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), o = 2; o < n; o++)
    r[o - 2] = arguments[o];
  return (ft[e] || []).forEach((a) => {
    t = a.apply(null, [t, ...r]);
  }), t;
}
function ut(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (ft[e] || []).forEach((i) => {
    i.apply(null, n);
  });
}
function Qe() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return mt[e] ? mt[e].apply(null, t) : void 0;
}
function Tr(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || Xe();
  if (t)
    return t = tt(n, t) || t, Xo(cs.definitions, n, t) || Xo(Me.styles, n, t);
}
const cs = new Fd(), Md = () => {
  R.autoReplaceSvg = !1, R.observeMutations = !1, ut("noAuto");
}, _d = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return Be ? (ut("beforeI2svg", e), Qe("pseudoElements2svg", e), Qe("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    R.autoReplaceSvg === !1 && (R.autoReplaceSvg = !0), R.observeMutations = !0, vd(() => {
      Nd({
        autoReplaceSvgRoot: t
      }), ut("watch", e);
    });
  }
}, Dd = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: tt(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = Sn(e[0]);
      return {
        prefix: n,
        iconName: tt(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(R.cssPrefix, "-")) > -1 || e.match(nd))) {
      const t = Tn(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Xe(),
        iconName: tt(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Xe();
      return {
        prefix: t,
        iconName: tt(t, e) || e
      };
    }
  }
}, we = {
  noAuto: Md,
  config: R,
  dom: _d,
  parse: Dd,
  library: cs,
  findIconDefinition: Tr,
  toHtml: zt
}, Nd = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = ne
  } = e;
  (Object.keys(Me.styles).length > 0 || R.autoFetchSvg) && Be && R.autoReplaceSvg && we.dom.i2svg({
    node: t
  });
};
function An(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => zt(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!Be) return;
      const n = ne.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function jd(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: o,
    styles: i,
    transform: a
  } = e;
  if (ro(a) && n.found && !r.found) {
    const {
      width: s,
      height: l
    } = n, u = {
      x: s / l / 2,
      y: 0.5
    };
    o.style = On(O(O({}, i), {}, {
      "transform-origin": "".concat(u.x + a.x / 16, "em ").concat(u.y + a.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function Hd(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: o,
    symbol: i
  } = e;
  const a = i === !0 ? "".concat(t, "-").concat(R.cssPrefix, "-").concat(n) : i;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: O(O({}, o), {}, {
        id: a
      }),
      children: r
    }]
  }];
}
function ao(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: o,
    transform: i,
    symbol: a,
    title: s,
    maskId: l,
    titleId: u,
    extra: c,
    watchable: p = !1
  } = e, {
    width: d,
    height: f
  } = n.found ? n : t, m = Hf.includes(r), h = [R.replacementClass, o ? "".concat(R.cssPrefix, "-").concat(o) : ""].filter((v) => c.classes.indexOf(v) === -1).filter((v) => v !== "" || !!v).concat(c.classes).join(" ");
  let g = {
    children: [],
    attributes: O(O({}, c.attributes), {}, {
      "data-prefix": r,
      "data-icon": o,
      class: h,
      role: c.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(d, " ").concat(f)
    })
  };
  const y = m && !~c.classes.indexOf("fa-fw") ? {
    width: "".concat(d / f * 16 * 0.0625, "em")
  } : {};
  p && (g.attributes[lt] = ""), s && (g.children.push({
    tag: "title",
    attributes: {
      id: g.attributes["aria-labelledby"] || "title-".concat(u || kt())
    },
    children: [s]
  }), delete g.attributes.title);
  const w = O(O({}, g), {}, {
    prefix: r,
    iconName: o,
    main: t,
    mask: n,
    maskId: l,
    transform: i,
    symbol: a,
    styles: O(O({}, y), c.styles)
  }), {
    children: b,
    attributes: E
  } = n.found && t.found ? Qe("generateAbstractMask", w) || {
    children: [],
    attributes: {}
  } : Qe("generateAbstractIcon", w) || {
    children: [],
    attributes: {}
  };
  return w.children = b, w.attributes = E, a ? Hd(w) : jd(w);
}
function ei(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: o,
    title: i,
    extra: a,
    watchable: s = !1
  } = e, l = O(O(O({}, a.attributes), i ? {
    title: i
  } : {}), {}, {
    class: a.classes.join(" ")
  });
  s && (l[lt] = "");
  const u = O({}, a.styles);
  ro(o) && (u.transform = md({
    transform: o,
    startCentered: !0,
    width: n,
    height: r
  }), u["-webkit-transform"] = u.transform);
  const c = On(u);
  c.length > 0 && (l.style = c);
  const p = [];
  return p.push({
    tag: "span",
    attributes: l,
    children: [t]
  }), i && p.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [i]
  }), p;
}
function Wd(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, o = O(O(O({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), i = On(r.styles);
  i.length > 0 && (o.style = i);
  const a = [];
  return a.push({
    tag: "span",
    attributes: o,
    children: [t]
  }), n && a.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [n]
  }), a;
}
const {
  styles: Vn
} = Me;
function Ar(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let o = null;
  return Array.isArray(r) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(R.cssPrefix, "-").concat(zn.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(R.cssPrefix, "-").concat(zn.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(R.cssPrefix, "-").concat(zn.PRIMARY),
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
const zd = {
  found: !1,
  width: 512,
  height: 512
};
function Bd(e, t) {
  !Ga && !R.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Pr(e, t) {
  let n = t;
  return t === "fa" && R.styleDefault !== null && (t = Xe()), new Promise((r, o) => {
    if (n === "fa") {
      const i = ls(e) || {};
      e = i.iconName || e, t = i.prefix || t;
    }
    if (e && t && Vn[t] && Vn[t][e]) {
      const i = Vn[t][e];
      return r(Ar(i));
    }
    Bd(e, t), r(O(O({}, zd), {}, {
      icon: R.showMissingIcons && e ? Qe("missingIconAbstract") || {} : {}
    }));
  });
}
const ti = () => {
}, Cr = R.measurePerformance && qt && qt.mark && qt.measure ? qt : {
  mark: ti,
  measure: ti
}, At = 'FA "6.7.2"', Ud = (e) => (Cr.mark("".concat(At, " ").concat(e, " begins")), () => fs(e)), fs = (e) => {
  Cr.mark("".concat(At, " ").concat(e, " ends")), Cr.measure("".concat(At, " ").concat(e), "".concat(At, " ").concat(e, " begins"), "".concat(At, " ").concat(e, " ends"));
};
var so = {
  begin: Ud,
  end: fs
};
const Zt = () => {
};
function ni(e) {
  return typeof (e.getAttribute ? e.getAttribute(lt) : null) == "string";
}
function Vd(e) {
  const t = e.getAttribute ? e.getAttribute(Zr) : null, n = e.getAttribute ? e.getAttribute(eo) : null;
  return t && n;
}
function Yd(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(R.replacementClass);
}
function Gd() {
  return R.autoReplaceSvg === !0 ? en.replace : en[R.autoReplaceSvg] || en.replace;
}
function qd(e) {
  return ne.createElementNS("http://www.w3.org/2000/svg", e);
}
function Kd(e) {
  return ne.createElement(e);
}
function ds(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? qd : Kd
  } = t;
  if (typeof e == "string")
    return ne.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(i) {
    r.setAttribute(i, e.attributes[i]);
  }), (e.children || []).forEach(function(i) {
    r.appendChild(ds(i, {
      ceFn: n
    }));
  }), r;
}
function Xd(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const en = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(ds(n), t);
      }), t.getAttribute(lt) === null && R.keepOriginalSource) {
        let n = ne.createComment(Xd(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~no(t).indexOf(R.replacementClass))
      return en.replace(e);
    const r = new RegExp("".concat(R.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const i = n[0].attributes.class.split(" ").reduce((a, s) => (s === R.replacementClass || s.match(r) ? a.toSvg.push(s) : a.toNode.push(s), a), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = i.toSvg.join(" "), i.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", i.toNode.join(" "));
    }
    const o = n.map((i) => zt(i)).join(`
`);
    t.setAttribute(lt, ""), t.innerHTML = o;
  }
};
function ri(e) {
  e();
}
function ps(e, t) {
  const n = typeof t == "function" ? t : Zt;
  if (e.length === 0)
    n();
  else {
    let r = ri;
    R.mutateApproach === Zf && (r = Ke.requestAnimationFrame || ri), r(() => {
      const o = Gd(), i = so.begin("mutate");
      e.map(o), i(), n();
    });
  }
}
let lo = !1;
function ms() {
  lo = !0;
}
function $r() {
  lo = !1;
}
let cn = null;
function oi(e) {
  if (!Uo || !R.observeMutations)
    return;
  const {
    treeCallback: t = Zt,
    nodeCallback: n = Zt,
    pseudoElementsCallback: r = Zt,
    observeMutationsRoot: o = ne
  } = e;
  cn = new Uo((i) => {
    if (lo) return;
    const a = Xe();
    Et(i).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !ni(s.addedNodes[0]) && (R.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && R.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && ni(s.target) && ~id.indexOf(s.attributeName))
        if (s.attributeName === "class" && Vd(s.target)) {
          const {
            prefix: l,
            iconName: u
          } = Tn(no(s.target));
          s.target.setAttribute(Zr, l || a), u && s.target.setAttribute(eo, u);
        } else Yd(s.target) && n(s.target);
    });
  }), Be && cn.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function Qd() {
  cn && cn.disconnect();
}
function Jd(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, o) => {
    const i = o.split(":"), a = i[0], s = i.slice(1);
    return a && s.length > 0 && (r[a] = s.join(":").trim()), r;
  }, {})), n;
}
function Zd(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = Tn(no(e));
  return o.prefix || (o.prefix = Xe()), t && n && (o.prefix = t, o.iconName = n), o.iconName && o.prefix || (o.prefix && r.length > 0 && (o.iconName = Sd(o.prefix, e.innerText) || io(o.prefix, Er(e.innerText))), !o.iconName && R.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function ep(e) {
  const t = Et(e.attributes).reduce((o, i) => (o.name !== "class" && o.name !== "style" && (o[i.name] = i.value), o), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return R.autoA11y && (n ? t["aria-labelledby"] = "".concat(R.replacementClass, "-title-").concat(r || kt()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function tp() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: ke,
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
function ii(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: o
  } = Zd(e), i = ep(e), a = Sr("parseNodeAttributes", {}, e);
  let s = t.styleParser ? Jd(e) : [];
  return O({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: ke,
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
      attributes: i
    }
  }, a);
}
const {
  styles: np
} = Me;
function hs(e) {
  const t = R.autoReplaceSvg === "nest" ? ii(e, {
    styleParser: !1
  }) : ii(e);
  return ~t.extra.classes.indexOf(Ka) ? Qe("generateLayersText", e, t) : Qe("generateSvgReplacementMutation", e, t);
}
function rp() {
  return [...Df, ...gr];
}
function ai(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!Be) return Promise.resolve();
  const n = ne.documentElement.classList, r = (c) => n.add("".concat(Go, "-").concat(c)), o = (c) => n.remove("".concat(Go, "-").concat(c)), i = R.autoFetchSvg ? rp() : za.concat(Object.keys(np));
  i.includes("fa") || i.push("fa");
  const a = [".".concat(Ka, ":not([").concat(lt, "])")].concat(i.map((c) => ".".concat(c, ":not([").concat(lt, "])"))).join(", ");
  if (a.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = Et(e.querySelectorAll(a));
  } catch {
  }
  if (s.length > 0)
    r("pending"), o("complete");
  else
    return Promise.resolve();
  const l = so.begin("onTree"), u = s.reduce((c, p) => {
    try {
      const d = hs(p);
      d && c.push(d);
    } catch (d) {
      Ga || d.name === "MissingIcon" && console.error(d);
    }
    return c;
  }, []);
  return new Promise((c, p) => {
    Promise.all(u).then((d) => {
      ps(d, () => {
        r("active"), r("complete"), o("pending"), typeof t == "function" && t(), l(), c();
      });
    }).catch((d) => {
      l(), p(d);
    });
  });
}
function op(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  hs(e).then((n) => {
    n && ps([n], t);
  });
}
function ip(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : Tr(t || {});
    let {
      mask: o
    } = n;
    return o && (o = (o || {}).icon ? o : Tr(o || {})), e(r, O(O({}, n), {}, {
      mask: o
    }));
  };
}
const ap = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = ke,
    symbol: r = !1,
    mask: o = null,
    maskId: i = null,
    title: a = null,
    titleId: s = null,
    classes: l = [],
    attributes: u = {},
    styles: c = {}
  } = t;
  if (!e) return;
  const {
    prefix: p,
    iconName: d,
    icon: f
  } = e;
  return An(O({
    type: "icon"
  }, e), () => (ut("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), R.autoA11y && (a ? u["aria-labelledby"] = "".concat(R.replacementClass, "-title-").concat(s || kt()) : (u["aria-hidden"] = "true", u.focusable = "false")), ao({
    icons: {
      main: Ar(f),
      mask: o ? Ar(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: p,
    iconName: d,
    transform: O(O({}, ke), n),
    symbol: r,
    title: a,
    maskId: i,
    titleId: s,
    extra: {
      attributes: u,
      styles: c,
      classes: l
    }
  })));
};
var sp = {
  mixout() {
    return {
      icon: ip(ap)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = ai, e.nodeCallback = op, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = ne,
        callback: r = () => {
        }
      } = t;
      return ai(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: o,
        titleId: i,
        prefix: a,
        transform: s,
        symbol: l,
        mask: u,
        maskId: c,
        extra: p
      } = n;
      return new Promise((d, f) => {
        Promise.all([Pr(r, a), u.iconName ? Pr(u.iconName, u.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((m) => {
          let [h, g] = m;
          d([t, ao({
            icons: {
              main: h,
              mask: g
            },
            prefix: a,
            iconName: r,
            transform: s,
            symbol: l,
            maskId: c,
            title: o,
            titleId: i,
            extra: p,
            watchable: !0
          })]);
        }).catch(f);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: o,
        transform: i,
        styles: a
      } = t;
      const s = On(a);
      s.length > 0 && (r.style = s);
      let l;
      return ro(i) && (l = Qe("generateAbstractTransformGrouping", {
        main: o,
        transform: i,
        containerWidth: o.width,
        iconWidth: o.width
      })), n.push(l || o.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, lp = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return An({
          type: "layer"
        }, () => {
          ut("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let r = [];
          return e((o) => {
            Array.isArray(o) ? o.map((i) => {
              r = r.concat(i.abstract);
            }) : r = r.concat(o.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(R.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, up = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: n = null,
          classes: r = [],
          attributes: o = {},
          styles: i = {}
        } = t;
        return An({
          type: "counter",
          content: e
        }, () => (ut("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Wd({
          content: e.toString(),
          title: n,
          extra: {
            attributes: o,
            styles: i,
            classes: ["".concat(R.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, cp = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = ke,
          title: r = null,
          classes: o = [],
          attributes: i = {},
          styles: a = {}
        } = t;
        return An({
          type: "text",
          content: e
        }, () => (ut("beforeDOMElementCreation", {
          content: e,
          params: t
        }), ei({
          content: e,
          transform: O(O({}, ke), n),
          title: r,
          extra: {
            attributes: i,
            styles: a,
            classes: ["".concat(R.cssPrefix, "-layers-text"), ...o]
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
        extra: i
      } = n;
      let a = null, s = null;
      if (Ha) {
        const l = parseInt(getComputedStyle(t).fontSize, 10), u = t.getBoundingClientRect();
        a = u.width / l, s = u.height / l;
      }
      return R.autoA11y && !r && (i.attributes["aria-hidden"] = "true"), Promise.resolve([t, ei({
        content: t.innerHTML,
        width: a,
        height: s,
        transform: o,
        title: r,
        extra: i,
        watchable: !0
      })]);
    };
  }
};
const fp = new RegExp('"', "ug"), si = [1105920, 1112319], li = O(O(O(O({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), kf), Qf), Uf), Rr = Object.keys(li).reduce((e, t) => (e[t.toLowerCase()] = li[t], e), {}), dp = Object.keys(Rr).reduce((e, t) => {
  const n = Rr[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function pp(e) {
  const t = e.replace(fp, ""), n = yd(t, 0), r = n >= si[0] && n <= si[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: Er(o ? t[0] : t),
    isSecondary: r || o
  };
}
function mp(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), o = isNaN(r) ? "normal" : r;
  return (Rr[n] || {})[o] || dp[n];
}
function ui(e, t) {
  const n = "".concat(Jf).concat(t.replace(":", "-"));
  return new Promise((r, o) => {
    if (e.getAttribute(n) !== null)
      return r();
    const a = Et(e.children).filter((d) => d.getAttribute(br) === t)[0], s = Ke.getComputedStyle(e, t), l = s.getPropertyValue("font-family"), u = l.match(rd), c = s.getPropertyValue("font-weight"), p = s.getPropertyValue("content");
    if (a && !u)
      return e.removeChild(a), r();
    if (u && p !== "none" && p !== "") {
      const d = s.getPropertyValue("content");
      let f = mp(l, c);
      const {
        value: m,
        isSecondary: h
      } = pp(d), g = u[0].startsWith("FontAwesome");
      let y = io(f, m), w = y;
      if (g) {
        const b = Td(m);
        b.iconName && b.prefix && (y = b.iconName, f = b.prefix);
      }
      if (y && !h && (!a || a.getAttribute(Zr) !== f || a.getAttribute(eo) !== w)) {
        e.setAttribute(n, w), a && e.removeChild(a);
        const b = tp(), {
          extra: E
        } = b;
        E.attributes[br] = t, Pr(y, f).then((v) => {
          const P = ao(O(O({}, b), {}, {
            icons: {
              main: v,
              mask: us()
            },
            prefix: f,
            iconName: w,
            extra: E,
            watchable: !0
          })), $ = ne.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore($, e.firstChild) : e.appendChild($), $.outerHTML = P.map((Y) => zt(Y)).join(`
`), e.removeAttribute(n), r();
        }).catch(o);
      } else
        r();
    } else
      r();
  });
}
function hp(e) {
  return Promise.all([ui(e, "::before"), ui(e, "::after")]);
}
function gp(e) {
  return e.parentNode !== document.head && !~ed.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(br) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function ci(e) {
  if (Be)
    return new Promise((t, n) => {
      const r = Et(e.querySelectorAll("*")).filter(gp).map(hp), o = so.begin("searchPseudoElements");
      ms(), Promise.all(r).then(() => {
        o(), $r(), t();
      }).catch(() => {
        o(), $r(), n();
      });
    });
}
var vp = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = ci, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = ne
      } = t;
      R.searchPseudoElements && ci(n);
    };
  }
};
let fi = !1;
var bp = {
  mixout() {
    return {
      dom: {
        unwatch() {
          ms(), fi = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        oi(Sr("mutationObserverCallbacks", {}));
      },
      noAuto() {
        Qd();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        fi ? $r() : oi(Sr("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const di = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((n, r) => {
    const o = r.toLowerCase().split("-"), i = o[0];
    let a = o.slice(1).join("-");
    if (i && a === "h")
      return n.flipX = !0, n;
    if (i && a === "v")
      return n.flipY = !0, n;
    if (a = parseFloat(a), isNaN(a))
      return n;
    switch (i) {
      case "grow":
        n.size = n.size + a;
        break;
      case "shrink":
        n.size = n.size - a;
        break;
      case "left":
        n.x = n.x - a;
        break;
      case "right":
        n.x = n.x + a;
        break;
      case "up":
        n.y = n.y - a;
        break;
      case "down":
        n.y = n.y + a;
        break;
      case "rotate":
        n.rotate = n.rotate + a;
        break;
    }
    return n;
  }, t);
};
var yp = {
  mixout() {
    return {
      parse: {
        transform: (e) => di(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = di(n)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: n,
        transform: r,
        containerWidth: o,
        iconWidth: i
      } = t;
      const a = {
        transform: "translate(".concat(o / 2, " 256)")
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), l = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), u = "rotate(".concat(r.rotate, " 0 0)"), c = {
        transform: "".concat(s, " ").concat(l, " ").concat(u)
      }, p = {
        transform: "translate(".concat(i / 2 * -1, " -256)")
      }, d = {
        outer: a,
        inner: c,
        path: p
      };
      return {
        tag: "g",
        attributes: O({}, d.outer),
        children: [{
          tag: "g",
          attributes: O({}, d.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: O(O({}, n.icon.attributes), d.path)
          }]
        }]
      };
    };
  }
};
const Yn = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function pi(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function xp(e) {
  return e.tag === "g" ? e.children : [e];
}
var wp = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? Tn(n.split(" ").map((o) => o.trim())) : us();
        return r.prefix || (r.prefix = Xe()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: n,
        attributes: r,
        main: o,
        mask: i,
        maskId: a,
        transform: s
      } = t;
      const {
        width: l,
        icon: u
      } = o, {
        width: c,
        icon: p
      } = i, d = pd({
        transform: s,
        containerWidth: c,
        iconWidth: l
      }), f = {
        tag: "rect",
        attributes: O(O({}, Yn), {}, {
          fill: "white"
        })
      }, m = u.children ? {
        children: u.children.map(pi)
      } : {}, h = {
        tag: "g",
        attributes: O({}, d.inner),
        children: [pi(O({
          tag: u.tag,
          attributes: O(O({}, u.attributes), d.path)
        }, m))]
      }, g = {
        tag: "g",
        attributes: O({}, d.outer),
        children: [h]
      }, y = "mask-".concat(a || kt()), w = "clip-".concat(a || kt()), b = {
        tag: "mask",
        attributes: O(O({}, Yn), {}, {
          id: y,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [f, g]
      }, E = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: w
          },
          children: xp(p)
        }, b]
      };
      return n.push(E, {
        tag: "rect",
        attributes: O({
          fill: "currentColor",
          "clip-path": "url(#".concat(w, ")"),
          mask: "url(#".concat(y, ")")
        }, Yn)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, Ep = {
  provides(e) {
    let t = !1;
    Ke.matchMedia && (t = Ke.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: O(O({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const i = O(O({}, o), {}, {
        attributeName: "opacity"
      }), a = {
        tag: "circle",
        attributes: O(O({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || a.children.push({
        tag: "animate",
        attributes: O(O({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: O(O({}, i), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(a), n.push({
        tag: "path",
        attributes: O(O({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: O(O({}, i), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: O(O({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: O(O({}, i), {}, {
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
}, Op = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, Sp = [gd, sp, lp, up, cp, vp, bp, yp, wp, Ep, Op];
kd(Sp, {
  mixoutsTo: we
});
we.noAuto;
we.config;
we.library;
we.dom;
const Lr = we.parse;
we.findIconDefinition;
we.toHtml;
const Tp = we.icon;
we.layer;
we.text;
we.counter;
var Xt = { exports: {} }, Qt = { exports: {} }, Z = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var mi;
function Ap() {
  if (mi) return Z;
  mi = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, i = e ? Symbol.for("react.profiler") : 60114, a = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, c = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, f = e ? Symbol.for("react.memo") : 60115, m = e ? Symbol.for("react.lazy") : 60116, h = e ? Symbol.for("react.block") : 60121, g = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, w = e ? Symbol.for("react.scope") : 60119;
  function b(v) {
    if (typeof v == "object" && v !== null) {
      var P = v.$$typeof;
      switch (P) {
        case t:
          switch (v = v.type, v) {
            case l:
            case u:
            case r:
            case i:
            case o:
            case p:
              return v;
            default:
              switch (v = v && v.$$typeof, v) {
                case s:
                case c:
                case m:
                case f:
                case a:
                  return v;
                default:
                  return P;
              }
          }
        case n:
          return P;
      }
    }
  }
  function E(v) {
    return b(v) === u;
  }
  return Z.AsyncMode = l, Z.ConcurrentMode = u, Z.ContextConsumer = s, Z.ContextProvider = a, Z.Element = t, Z.ForwardRef = c, Z.Fragment = r, Z.Lazy = m, Z.Memo = f, Z.Portal = n, Z.Profiler = i, Z.StrictMode = o, Z.Suspense = p, Z.isAsyncMode = function(v) {
    return E(v) || b(v) === l;
  }, Z.isConcurrentMode = E, Z.isContextConsumer = function(v) {
    return b(v) === s;
  }, Z.isContextProvider = function(v) {
    return b(v) === a;
  }, Z.isElement = function(v) {
    return typeof v == "object" && v !== null && v.$$typeof === t;
  }, Z.isForwardRef = function(v) {
    return b(v) === c;
  }, Z.isFragment = function(v) {
    return b(v) === r;
  }, Z.isLazy = function(v) {
    return b(v) === m;
  }, Z.isMemo = function(v) {
    return b(v) === f;
  }, Z.isPortal = function(v) {
    return b(v) === n;
  }, Z.isProfiler = function(v) {
    return b(v) === i;
  }, Z.isStrictMode = function(v) {
    return b(v) === o;
  }, Z.isSuspense = function(v) {
    return b(v) === p;
  }, Z.isValidElementType = function(v) {
    return typeof v == "string" || typeof v == "function" || v === r || v === u || v === i || v === o || v === p || v === d || typeof v == "object" && v !== null && (v.$$typeof === m || v.$$typeof === f || v.$$typeof === a || v.$$typeof === s || v.$$typeof === c || v.$$typeof === g || v.$$typeof === y || v.$$typeof === w || v.$$typeof === h);
  }, Z.typeOf = b, Z;
}
var ee = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var hi;
function Pp() {
  return hi || (hi = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, i = e ? Symbol.for("react.profiler") : 60114, a = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, c = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, f = e ? Symbol.for("react.memo") : 60115, m = e ? Symbol.for("react.lazy") : 60116, h = e ? Symbol.for("react.block") : 60121, g = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, w = e ? Symbol.for("react.scope") : 60119;
    function b(A) {
      return typeof A == "string" || typeof A == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      A === r || A === u || A === i || A === o || A === p || A === d || typeof A == "object" && A !== null && (A.$$typeof === m || A.$$typeof === f || A.$$typeof === a || A.$$typeof === s || A.$$typeof === c || A.$$typeof === g || A.$$typeof === y || A.$$typeof === w || A.$$typeof === h);
    }
    function E(A) {
      if (typeof A == "object" && A !== null) {
        var Re = A.$$typeof;
        switch (Re) {
          case t:
            var Bt = A.type;
            switch (Bt) {
              case l:
              case u:
              case r:
              case i:
              case o:
              case p:
                return Bt;
              default:
                var co = Bt && Bt.$$typeof;
                switch (co) {
                  case s:
                  case c:
                  case m:
                  case f:
                  case a:
                    return co;
                  default:
                    return Re;
                }
            }
          case n:
            return Re;
        }
      }
    }
    var v = l, P = u, $ = s, Y = a, J = t, C = c, N = r, Q = m, K = f, F = n, ae = i, G = o, te = p, H = !1;
    function q(A) {
      return H || (H = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), x(A) || E(A) === l;
    }
    function x(A) {
      return E(A) === u;
    }
    function T(A) {
      return E(A) === s;
    }
    function _(A) {
      return E(A) === a;
    }
    function I(A) {
      return typeof A == "object" && A !== null && A.$$typeof === t;
    }
    function M(A) {
      return E(A) === c;
    }
    function W(A) {
      return E(A) === r;
    }
    function j(A) {
      return E(A) === m;
    }
    function S(A) {
      return E(A) === f;
    }
    function k(A) {
      return E(A) === n;
    }
    function D(A) {
      return E(A) === i;
    }
    function U(A) {
      return E(A) === o;
    }
    function ve(A) {
      return E(A) === p;
    }
    ee.AsyncMode = v, ee.ConcurrentMode = P, ee.ContextConsumer = $, ee.ContextProvider = Y, ee.Element = J, ee.ForwardRef = C, ee.Fragment = N, ee.Lazy = Q, ee.Memo = K, ee.Portal = F, ee.Profiler = ae, ee.StrictMode = G, ee.Suspense = te, ee.isAsyncMode = q, ee.isConcurrentMode = x, ee.isContextConsumer = T, ee.isContextProvider = _, ee.isElement = I, ee.isForwardRef = M, ee.isFragment = W, ee.isLazy = j, ee.isMemo = S, ee.isPortal = k, ee.isProfiler = D, ee.isStrictMode = U, ee.isSuspense = ve, ee.isValidElementType = b, ee.typeOf = E;
  }()), ee;
}
var gi;
function gs() {
  return gi || (gi = 1, process.env.NODE_ENV === "production" ? Qt.exports = Ap() : Qt.exports = Pp()), Qt.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Gn, vi;
function Cp() {
  if (vi) return Gn;
  vi = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, n = Object.prototype.propertyIsEnumerable;
  function r(i) {
    if (i == null)
      throw new TypeError("Object.assign cannot be called with null or undefined");
    return Object(i);
  }
  function o() {
    try {
      if (!Object.assign)
        return !1;
      var i = new String("abc");
      if (i[5] = "de", Object.getOwnPropertyNames(i)[0] === "5")
        return !1;
      for (var a = {}, s = 0; s < 10; s++)
        a["_" + String.fromCharCode(s)] = s;
      var l = Object.getOwnPropertyNames(a).map(function(c) {
        return a[c];
      });
      if (l.join("") !== "0123456789")
        return !1;
      var u = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(c) {
        u[c] = c;
      }), Object.keys(Object.assign({}, u)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Gn = o() ? Object.assign : function(i, a) {
    for (var s, l = r(i), u, c = 1; c < arguments.length; c++) {
      s = Object(arguments[c]);
      for (var p in s)
        t.call(s, p) && (l[p] = s[p]);
      if (e) {
        u = e(s);
        for (var d = 0; d < u.length; d++)
          n.call(s, u[d]) && (l[u[d]] = s[u[d]]);
      }
    }
    return l;
  }, Gn;
}
var qn, bi;
function uo() {
  if (bi) return qn;
  bi = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return qn = e, qn;
}
var Kn, yi;
function vs() {
  return yi || (yi = 1, Kn = Function.call.bind(Object.prototype.hasOwnProperty)), Kn;
}
var Xn, xi;
function $p() {
  if (xi) return Xn;
  xi = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ uo(), n = {}, r = /* @__PURE__ */ vs();
    e = function(i) {
      var a = "Warning: " + i;
      typeof console < "u" && console.error(a);
      try {
        throw new Error(a);
      } catch {
      }
    };
  }
  function o(i, a, s, l, u) {
    if (process.env.NODE_ENV !== "production") {
      for (var c in i)
        if (r(i, c)) {
          var p;
          try {
            if (typeof i[c] != "function") {
              var d = Error(
                (l || "React class") + ": " + s + " type `" + c + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof i[c] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw d.name = "Invariant Violation", d;
            }
            p = i[c](a, c, l, s, null, t);
          } catch (m) {
            p = m;
          }
          if (p && !(p instanceof Error) && e(
            (l || "React class") + ": type specification of " + s + " `" + c + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof p + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), p instanceof Error && !(p.message in n)) {
            n[p.message] = !0;
            var f = u ? u() : "";
            e(
              "Failed " + s + " type: " + p.message + (f ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, Xn = o, Xn;
}
var Qn, wi;
function Rp() {
  if (wi) return Qn;
  wi = 1;
  var e = gs(), t = Cp(), n = /* @__PURE__ */ uo(), r = /* @__PURE__ */ vs(), o = /* @__PURE__ */ $p(), i = function() {
  };
  process.env.NODE_ENV !== "production" && (i = function(s) {
    var l = "Warning: " + s;
    typeof console < "u" && console.error(l);
    try {
      throw new Error(l);
    } catch {
    }
  });
  function a() {
    return null;
  }
  return Qn = function(s, l) {
    var u = typeof Symbol == "function" && Symbol.iterator, c = "@@iterator";
    function p(x) {
      var T = x && (u && x[u] || x[c]);
      if (typeof T == "function")
        return T;
    }
    var d = "<<anonymous>>", f = {
      array: y("array"),
      bigint: y("bigint"),
      bool: y("boolean"),
      func: y("function"),
      number: y("number"),
      object: y("object"),
      string: y("string"),
      symbol: y("symbol"),
      any: w(),
      arrayOf: b,
      element: E(),
      elementType: v(),
      instanceOf: P,
      node: C(),
      objectOf: Y,
      oneOf: $,
      oneOfType: J,
      shape: Q,
      exact: K
    };
    function m(x, T) {
      return x === T ? x !== 0 || 1 / x === 1 / T : x !== x && T !== T;
    }
    function h(x, T) {
      this.message = x, this.data = T && typeof T == "object" ? T : {}, this.stack = "";
    }
    h.prototype = Error.prototype;
    function g(x) {
      if (process.env.NODE_ENV !== "production")
        var T = {}, _ = 0;
      function I(W, j, S, k, D, U, ve) {
        if (k = k || d, U = U || S, ve !== n) {
          if (l) {
            var A = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw A.name = "Invariant Violation", A;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var Re = k + ":" + S;
            !T[Re] && // Avoid spamming the console because they are often not actionable except for lib authors
            _ < 3 && (i(
              "You are manually calling a React.PropTypes validation function for the `" + U + "` prop on `" + k + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), T[Re] = !0, _++);
          }
        }
        return j[S] == null ? W ? j[S] === null ? new h("The " + D + " `" + U + "` is marked as required " + ("in `" + k + "`, but its value is `null`.")) : new h("The " + D + " `" + U + "` is marked as required in " + ("`" + k + "`, but its value is `undefined`.")) : null : x(j, S, k, D, U);
      }
      var M = I.bind(null, !1);
      return M.isRequired = I.bind(null, !0), M;
    }
    function y(x) {
      function T(_, I, M, W, j, S) {
        var k = _[I], D = G(k);
        if (D !== x) {
          var U = te(k);
          return new h(
            "Invalid " + W + " `" + j + "` of type " + ("`" + U + "` supplied to `" + M + "`, expected ") + ("`" + x + "`."),
            { expectedType: x }
          );
        }
        return null;
      }
      return g(T);
    }
    function w() {
      return g(a);
    }
    function b(x) {
      function T(_, I, M, W, j) {
        if (typeof x != "function")
          return new h("Property `" + j + "` of component `" + M + "` has invalid PropType notation inside arrayOf.");
        var S = _[I];
        if (!Array.isArray(S)) {
          var k = G(S);
          return new h("Invalid " + W + " `" + j + "` of type " + ("`" + k + "` supplied to `" + M + "`, expected an array."));
        }
        for (var D = 0; D < S.length; D++) {
          var U = x(S, D, M, W, j + "[" + D + "]", n);
          if (U instanceof Error)
            return U;
        }
        return null;
      }
      return g(T);
    }
    function E() {
      function x(T, _, I, M, W) {
        var j = T[_];
        if (!s(j)) {
          var S = G(j);
          return new h("Invalid " + M + " `" + W + "` of type " + ("`" + S + "` supplied to `" + I + "`, expected a single ReactElement."));
        }
        return null;
      }
      return g(x);
    }
    function v() {
      function x(T, _, I, M, W) {
        var j = T[_];
        if (!e.isValidElementType(j)) {
          var S = G(j);
          return new h("Invalid " + M + " `" + W + "` of type " + ("`" + S + "` supplied to `" + I + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return g(x);
    }
    function P(x) {
      function T(_, I, M, W, j) {
        if (!(_[I] instanceof x)) {
          var S = x.name || d, k = q(_[I]);
          return new h("Invalid " + W + " `" + j + "` of type " + ("`" + k + "` supplied to `" + M + "`, expected ") + ("instance of `" + S + "`."));
        }
        return null;
      }
      return g(T);
    }
    function $(x) {
      if (!Array.isArray(x))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? i(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : i("Invalid argument supplied to oneOf, expected an array.")), a;
      function T(_, I, M, W, j) {
        for (var S = _[I], k = 0; k < x.length; k++)
          if (m(S, x[k]))
            return null;
        var D = JSON.stringify(x, function(ve, A) {
          var Re = te(A);
          return Re === "symbol" ? String(A) : A;
        });
        return new h("Invalid " + W + " `" + j + "` of value `" + String(S) + "` " + ("supplied to `" + M + "`, expected one of " + D + "."));
      }
      return g(T);
    }
    function Y(x) {
      function T(_, I, M, W, j) {
        if (typeof x != "function")
          return new h("Property `" + j + "` of component `" + M + "` has invalid PropType notation inside objectOf.");
        var S = _[I], k = G(S);
        if (k !== "object")
          return new h("Invalid " + W + " `" + j + "` of type " + ("`" + k + "` supplied to `" + M + "`, expected an object."));
        for (var D in S)
          if (r(S, D)) {
            var U = x(S, D, M, W, j + "." + D, n);
            if (U instanceof Error)
              return U;
          }
        return null;
      }
      return g(T);
    }
    function J(x) {
      if (!Array.isArray(x))
        return process.env.NODE_ENV !== "production" && i("Invalid argument supplied to oneOfType, expected an instance of array."), a;
      for (var T = 0; T < x.length; T++) {
        var _ = x[T];
        if (typeof _ != "function")
          return i(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + H(_) + " at index " + T + "."
          ), a;
      }
      function I(M, W, j, S, k) {
        for (var D = [], U = 0; U < x.length; U++) {
          var ve = x[U], A = ve(M, W, j, S, k, n);
          if (A == null)
            return null;
          A.data && r(A.data, "expectedType") && D.push(A.data.expectedType);
        }
        var Re = D.length > 0 ? ", expected one of type [" + D.join(", ") + "]" : "";
        return new h("Invalid " + S + " `" + k + "` supplied to " + ("`" + j + "`" + Re + "."));
      }
      return g(I);
    }
    function C() {
      function x(T, _, I, M, W) {
        return F(T[_]) ? null : new h("Invalid " + M + " `" + W + "` supplied to " + ("`" + I + "`, expected a ReactNode."));
      }
      return g(x);
    }
    function N(x, T, _, I, M) {
      return new h(
        (x || "React class") + ": " + T + " type `" + _ + "." + I + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + M + "`."
      );
    }
    function Q(x) {
      function T(_, I, M, W, j) {
        var S = _[I], k = G(S);
        if (k !== "object")
          return new h("Invalid " + W + " `" + j + "` of type `" + k + "` " + ("supplied to `" + M + "`, expected `object`."));
        for (var D in x) {
          var U = x[D];
          if (typeof U != "function")
            return N(M, W, j, D, te(U));
          var ve = U(S, D, M, W, j + "." + D, n);
          if (ve)
            return ve;
        }
        return null;
      }
      return g(T);
    }
    function K(x) {
      function T(_, I, M, W, j) {
        var S = _[I], k = G(S);
        if (k !== "object")
          return new h("Invalid " + W + " `" + j + "` of type `" + k + "` " + ("supplied to `" + M + "`, expected `object`."));
        var D = t({}, _[I], x);
        for (var U in D) {
          var ve = x[U];
          if (r(x, U) && typeof ve != "function")
            return N(M, W, j, U, te(ve));
          if (!ve)
            return new h(
              "Invalid " + W + " `" + j + "` key `" + U + "` supplied to `" + M + "`.\nBad object: " + JSON.stringify(_[I], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(x), null, "  ")
            );
          var A = ve(S, U, M, W, j + "." + U, n);
          if (A)
            return A;
        }
        return null;
      }
      return g(T);
    }
    function F(x) {
      switch (typeof x) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !x;
        case "object":
          if (Array.isArray(x))
            return x.every(F);
          if (x === null || s(x))
            return !0;
          var T = p(x);
          if (T) {
            var _ = T.call(x), I;
            if (T !== x.entries) {
              for (; !(I = _.next()).done; )
                if (!F(I.value))
                  return !1;
            } else
              for (; !(I = _.next()).done; ) {
                var M = I.value;
                if (M && !F(M[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function ae(x, T) {
      return x === "symbol" ? !0 : T ? T["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && T instanceof Symbol : !1;
    }
    function G(x) {
      var T = typeof x;
      return Array.isArray(x) ? "array" : x instanceof RegExp ? "object" : ae(T, x) ? "symbol" : T;
    }
    function te(x) {
      if (typeof x > "u" || x === null)
        return "" + x;
      var T = G(x);
      if (T === "object") {
        if (x instanceof Date)
          return "date";
        if (x instanceof RegExp)
          return "regexp";
      }
      return T;
    }
    function H(x) {
      var T = te(x);
      switch (T) {
        case "array":
        case "object":
          return "an " + T;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + T;
        default:
          return T;
      }
    }
    function q(x) {
      return !x.constructor || !x.constructor.name ? d : x.constructor.name;
    }
    return f.checkPropTypes = o, f.resetWarningCache = o.resetWarningCache, f.PropTypes = f, f;
  }, Qn;
}
var Jn, Ei;
function Lp() {
  if (Ei) return Jn;
  Ei = 1;
  var e = /* @__PURE__ */ uo();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, Jn = function() {
    function r(a, s, l, u, c, p) {
      if (p !== e) {
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
    var i = {
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
    return i.PropTypes = i, i;
  }, Jn;
}
var Oi;
function Fp() {
  if (Oi) return Xt.exports;
  if (Oi = 1, process.env.NODE_ENV !== "production") {
    var e = gs(), t = !0;
    Xt.exports = /* @__PURE__ */ Rp()(e.isElement, t);
  } else
    Xt.exports = /* @__PURE__ */ Lp()();
  return Xt.exports;
}
var Ip = /* @__PURE__ */ Fp();
const B = /* @__PURE__ */ Oc(Ip);
function Si(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function Fe(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Si(Object(n), !0).forEach(function(r) {
      dt(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Si(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function fn(e) {
  "@babel/helpers - typeof";
  return fn = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, fn(e);
}
function dt(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function kp(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), o, i;
  for (i = 0; i < r.length; i++)
    o = r[i], !(t.indexOf(o) >= 0) && (n[o] = e[o]);
  return n;
}
function Mp(e, t) {
  if (e == null) return {};
  var n = kp(e, t), r, o;
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(e);
    for (o = 0; o < i.length; o++)
      r = i[o], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Fr(e) {
  return _p(e) || Dp(e) || Np(e) || jp();
}
function _p(e) {
  if (Array.isArray(e)) return Ir(e);
}
function Dp(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Np(e, t) {
  if (e) {
    if (typeof e == "string") return Ir(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return Ir(e, t);
  }
}
function Ir(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function jp() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Hp(e) {
  var t, n = e.beat, r = e.fade, o = e.beatFade, i = e.bounce, a = e.shake, s = e.flash, l = e.spin, u = e.spinPulse, c = e.spinReverse, p = e.pulse, d = e.fixedWidth, f = e.inverse, m = e.border, h = e.listItem, g = e.flip, y = e.size, w = e.rotation, b = e.pull, E = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": o,
    "fa-bounce": i,
    "fa-shake": a,
    "fa-flash": s,
    "fa-spin": l,
    "fa-spin-reverse": c,
    "fa-spin-pulse": u,
    "fa-pulse": p,
    "fa-fw": d,
    "fa-inverse": f,
    "fa-border": m,
    "fa-li": h,
    "fa-flip": g === !0,
    "fa-flip-horizontal": g === "horizontal" || g === "both",
    "fa-flip-vertical": g === "vertical" || g === "both"
  }, dt(t, "fa-".concat(y), typeof y < "u" && y !== null), dt(t, "fa-rotate-".concat(w), typeof w < "u" && w !== null && w !== 0), dt(t, "fa-pull-".concat(b), typeof b < "u" && b !== null), dt(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(E).map(function(v) {
    return E[v] ? v : null;
  }).filter(function(v) {
    return v;
  });
}
function Wp(e) {
  return e = e - 0, e === e;
}
function bs(e) {
  return Wp(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var zp = ["style"];
function Bp(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function Up(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), o = bs(n.slice(0, r)), i = n.slice(r + 1).trim();
    return o.startsWith("webkit") ? t[Bp(o)] = i : t[o] = i, t;
  }, {});
}
function ys(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(l) {
    return ys(e, l);
  }), o = Object.keys(t.attributes || {}).reduce(function(l, u) {
    var c = t.attributes[u];
    switch (u) {
      case "class":
        l.attrs.className = c, delete t.attributes.class;
        break;
      case "style":
        l.attrs.style = Up(c);
        break;
      default:
        u.indexOf("aria-") === 0 || u.indexOf("data-") === 0 ? l.attrs[u.toLowerCase()] = c : l.attrs[bs(u)] = c;
    }
    return l;
  }, {
    attrs: {}
  }), i = n.style, a = i === void 0 ? {} : i, s = Mp(n, zp);
  return o.attrs.style = Fe(Fe({}, o.attrs.style), a), e.apply(void 0, [t.tag, Fe(Fe({}, o.attrs), s)].concat(Fr(r)));
}
var xs = !1;
try {
  xs = process.env.NODE_ENV === "production";
} catch {
}
function Vp() {
  if (!xs && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Ti(e) {
  if (e && fn(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Lr.icon)
    return Lr.icon(e);
  if (e === null)
    return null;
  if (e && fn(e) === "object" && e.prefix && e.iconName)
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
function Zn(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? dt({}, e, t) : {};
}
var Ai = {
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
}, dn = /* @__PURE__ */ z.forwardRef(function(e, t) {
  var n = Fe(Fe({}, Ai), e), r = n.icon, o = n.mask, i = n.symbol, a = n.className, s = n.title, l = n.titleId, u = n.maskId, c = Ti(r), p = Zn("classes", [].concat(Fr(Hp(n)), Fr((a || "").split(" ")))), d = Zn("transform", typeof n.transform == "string" ? Lr.transform(n.transform) : n.transform), f = Zn("mask", Ti(o)), m = Tp(c, Fe(Fe(Fe(Fe({}, p), d), f), {}, {
    symbol: i,
    title: s,
    titleId: l,
    maskId: u
  }));
  if (!m)
    return Vp("Could not find icon", c), null;
  var h = m.abstract, g = {
    ref: t
  };
  return Object.keys(n).forEach(function(y) {
    Ai.hasOwnProperty(y) || (g[y] = n[y]);
  }), Yp(h[0], g);
});
dn.displayName = "FontAwesomeIcon";
dn.propTypes = {
  beat: B.bool,
  border: B.bool,
  beatFade: B.bool,
  bounce: B.bool,
  className: B.string,
  fade: B.bool,
  flash: B.bool,
  mask: B.oneOfType([B.object, B.array, B.string]),
  maskId: B.string,
  fixedWidth: B.bool,
  inverse: B.bool,
  flip: B.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: B.oneOfType([B.object, B.array, B.string]),
  listItem: B.bool,
  pull: B.oneOf(["right", "left"]),
  pulse: B.bool,
  rotation: B.oneOf([0, 90, 180, 270]),
  shake: B.bool,
  size: B.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: B.bool,
  spinPulse: B.bool,
  spinReverse: B.bool,
  symbol: B.oneOfType([B.bool, B.string]),
  title: B.string,
  titleId: B.string,
  transform: B.oneOfType([B.string, B.object]),
  swapOpacity: B.bool
};
var Yp = ys.bind(null, z.createElement);
const Zp = ({ list: e, onSelect: t }) => {
  const [n, r] = oe(e[0]);
  return ue(() => {
    t(Object.values(n)[0]);
  }, [n]), /* @__PURE__ */ Le(Gt, { value: n, onChange: r, children: /* @__PURE__ */ Pn("div", { className: "relative mt-1", children: [
    /* @__PURE__ */ Pn(Gt.Button, { className: "relative h-10 w-full cursor-pointer rounded-md bg-brand-secondary py-2 pl-3 pr-10 text-left outline-none outline-offset-0 transition-all duration-150 ease-in-out focus:outline-brand-primary sm:text-sm", children: [
      /* @__PURE__ */ Le("span", { className: "block truncate", children: Object.keys(n)[0] }),
      /* @__PURE__ */ Le("span", { className: "pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2", children: /* @__PURE__ */ Le(dn, { icon: Of, "aria-hidden": "true" }) })
    ] }),
    /* @__PURE__ */ Le(
      Jc,
      {
        as: Oe,
        leave: "transition ease-in duration-100",
        leaveFrom: "opacity-100",
        leaveTo: "opacity-0",
        children: /* @__PURE__ */ Le(Gt.Options, { className: "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-brand-secondary py-1 text-base shadow-lg focus:outline-none sm:text-sm", children: e.map((o, i) => /* @__PURE__ */ Le(
          Gt.Option,
          {
            className: ({ active: a }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 text-white ${a ? "text-white" : "text-gray-400"}`,
            value: o,
            children: ({ selected: a }) => /* @__PURE__ */ Pn(ws, { children: [
              /* @__PURE__ */ Le(
                "span",
                {
                  className: `block truncate ${a ? "font-medium" : "font-normal"}`,
                  children: Object.values(o)[0]
                }
              ),
              a ? /* @__PURE__ */ Le("span", { className: "absolute inset-y-0 left-0 flex items-center pl-3", children: /* @__PURE__ */ Le(dn, { icon: Sf, "aria-hidden": "true" }) }) : null
            ] })
          },
          i
        )) })
      }
    )
  ] }) });
};
export {
  Zp as ListDropdown
};
