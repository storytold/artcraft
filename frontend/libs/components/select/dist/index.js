import { jsx as Ae, jsxs as Fn, Fragment as So } from "react/jsx-runtime";
import * as I from "react";
import V, { useRef as Q, useCallback as ae, useEffect as fe, useState as le, useMemo as ce, useLayoutEffect as Vr, useContext as ue, createContext as be, forwardRef as Us, Fragment as Re, isValidElement as Vs, cloneElement as Ys, createElement as Gs, useId as Ot, useReducer as qs, useSyncExternalStore as Ks } from "react";
import * as un from "react-dom";
import { createPortal as Wi, flushSync as st } from "react-dom";
const Bi = typeof document < "u" ? V.useLayoutEffect : () => {
};
function Xs(e) {
  const t = Q(null);
  return Bi(() => {
    t.current = e;
  }, [
    e
  ]), ae((...n) => {
    const r = t.current;
    return r == null ? void 0 : r(...n);
  }, []);
}
const rt = (e) => {
  var t;
  return (t = e == null ? void 0 : e.ownerDocument) !== null && t !== void 0 ? t : document;
}, ot = (e) => e && "window" in e && e.window === e ? e : rt(e).defaultView || window;
function Qs(e) {
  return e !== null && typeof e == "object" && "nodeType" in e && typeof e.nodeType == "number";
}
function Js(e) {
  return Qs(e) && e.nodeType === Node.DOCUMENT_FRAGMENT_NODE && "host" in e;
}
let Zs = !1;
function Yr() {
  return Zs;
}
function Ui(e, t) {
  if (!Yr()) return t && e ? e.contains(t) : !1;
  if (!e || !t) return !1;
  let n = t;
  for (; n !== null; ) {
    if (n === e) return !0;
    n.tagName === "SLOT" && n.assignedSlot ? n = n.assignedSlot.parentNode : Js(n) ? n = n.host : n = n.parentNode;
  }
  return !1;
}
const ur = (e = document) => {
  var t;
  if (!Yr()) return e.activeElement;
  let n = e.activeElement;
  for (; n && "shadowRoot" in n && (!((t = n.shadowRoot) === null || t === void 0) && t.activeElement); ) n = n.shadowRoot.activeElement;
  return n;
};
function Vi(e) {
  return Yr() && e.target.shadowRoot && e.composedPath ? e.composedPath()[0] : e.target;
}
function el(e) {
  var t;
  return typeof window > "u" || window.navigator == null ? !1 : ((t = window.navigator.userAgentData) === null || t === void 0 ? void 0 : t.brands.some((n) => e.test(n.brand))) || e.test(window.navigator.userAgent);
}
function tl(e) {
  var t;
  return typeof window < "u" && window.navigator != null ? e.test(((t = window.navigator.userAgentData) === null || t === void 0 ? void 0 : t.platform) || window.navigator.platform) : !1;
}
function Yi(e) {
  let t = null;
  return () => (t == null && (t = e()), t);
}
const nl = Yi(function() {
  return tl(/^Mac/i);
}), rl = Yi(function() {
  return el(/Android/i);
});
function Gi() {
  let e = Q(/* @__PURE__ */ new Map()), t = ae((o, i, a, s) => {
    let l = s != null && s.once ? (...c) => {
      e.current.delete(a), a(...c);
    } : a;
    e.current.set(a, {
      type: i,
      eventTarget: o,
      fn: l,
      options: s
    }), o.addEventListener(i, l, s);
  }, []), n = ae((o, i, a, s) => {
    var l;
    let c = ((l = e.current.get(a)) === null || l === void 0 ? void 0 : l.fn) || a;
    o.removeEventListener(i, c, s), e.current.delete(a);
  }, []), r = ae(() => {
    e.current.forEach((o, i) => {
      n(o.eventTarget, o.type, i, o.options);
    });
  }, [
    n
  ]);
  return fe(() => r, [
    r
  ]), {
    addGlobalListener: t,
    removeGlobalListener: n,
    removeAllGlobalListeners: r
  };
}
function ol(e) {
  return e.mozInputSource === 0 && e.isTrusted ? !0 : rl() && e.pointerType ? e.type === "click" && e.buttons === 1 : e.detail === 0 && !e.pointerType;
}
class qi {
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
function Ki(e) {
  let t = Q({
    isFocused: !1,
    observer: null
  });
  Bi(() => {
    const r = t.current;
    return () => {
      r.observer && (r.observer.disconnect(), r.observer = null);
    };
  }, []);
  let n = Xs((r) => {
    e == null || e(r);
  });
  return ae((r) => {
    if (r.target instanceof HTMLButtonElement || r.target instanceof HTMLInputElement || r.target instanceof HTMLTextAreaElement || r.target instanceof HTMLSelectElement) {
      t.current.isFocused = !0;
      let o = r.target, i = (a) => {
        t.current.isFocused = !1, o.disabled && n(new qi("blur", a)), t.current.observer && (t.current.observer.disconnect(), t.current.observer = null);
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
let il = !1, Vt = null, fr = /* @__PURE__ */ new Set(), _t = /* @__PURE__ */ new Map(), ct = !1, dr = !1;
const al = {
  Tab: !0,
  Escape: !0
};
function Gr(e, t) {
  for (let n of fr) n(e, t);
}
function sl(e) {
  return !(e.metaKey || !nl() && e.altKey || e.ctrlKey || e.key === "Control" || e.key === "Shift" || e.key === "Meta");
}
function fn(e) {
  ct = !0, sl(e) && (Vt = "keyboard", Gr("keyboard", e));
}
function Se(e) {
  Vt = "pointer", (e.type === "mousedown" || e.type === "pointerdown") && (ct = !0, Gr("pointer", e));
}
function Xi(e) {
  ol(e) && (ct = !0, Vt = "virtual");
}
function Qi(e) {
  e.target === window || e.target === document || il || !e.isTrusted || (!ct && !dr && (Vt = "virtual", Gr("virtual", e)), ct = !1, dr = !1);
}
function Ji() {
  ct = !1, dr = !0;
}
function pr(e) {
  if (typeof window > "u" || _t.get(ot(e))) return;
  const t = ot(e), n = rt(e);
  let r = t.HTMLElement.prototype.focus;
  t.HTMLElement.prototype.focus = function() {
    ct = !0, r.apply(this, arguments);
  }, n.addEventListener("keydown", fn, !0), n.addEventListener("keyup", fn, !0), n.addEventListener("click", Xi, !0), t.addEventListener("focus", Qi, !0), t.addEventListener("blur", Ji, !1), typeof PointerEvent < "u" ? (n.addEventListener("pointerdown", Se, !0), n.addEventListener("pointermove", Se, !0), n.addEventListener("pointerup", Se, !0)) : (n.addEventListener("mousedown", Se, !0), n.addEventListener("mousemove", Se, !0), n.addEventListener("mouseup", Se, !0)), t.addEventListener("beforeunload", () => {
    Zi(e);
  }, {
    once: !0
  }), _t.set(t, {
    focus: r
  });
}
const Zi = (e, t) => {
  const n = ot(e), r = rt(e);
  t && r.removeEventListener("DOMContentLoaded", t), _t.has(n) && (n.HTMLElement.prototype.focus = _t.get(n).focus, r.removeEventListener("keydown", fn, !0), r.removeEventListener("keyup", fn, !0), r.removeEventListener("click", Xi, !0), n.removeEventListener("focus", Qi, !0), n.removeEventListener("blur", Ji, !1), typeof PointerEvent < "u" ? (r.removeEventListener("pointerdown", Se, !0), r.removeEventListener("pointermove", Se, !0), r.removeEventListener("pointerup", Se, !0)) : (r.removeEventListener("mousedown", Se, !0), r.removeEventListener("mousemove", Se, !0), r.removeEventListener("mouseup", Se, !0)), _t.delete(n));
};
function ll(e) {
  const t = rt(e);
  let n;
  return t.readyState !== "loading" ? pr(e) : (n = () => {
    pr(e);
  }, t.addEventListener("DOMContentLoaded", n)), () => Zi(e, n);
}
typeof document < "u" && ll();
function ea() {
  return Vt !== "pointer";
}
const cl = /* @__PURE__ */ new Set([
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
function ul(e, t, n) {
  let r = rt(n == null ? void 0 : n.target);
  const o = typeof window < "u" ? ot(n == null ? void 0 : n.target).HTMLInputElement : HTMLInputElement, i = typeof window < "u" ? ot(n == null ? void 0 : n.target).HTMLTextAreaElement : HTMLTextAreaElement, a = typeof window < "u" ? ot(n == null ? void 0 : n.target).HTMLElement : HTMLElement, s = typeof window < "u" ? ot(n == null ? void 0 : n.target).KeyboardEvent : KeyboardEvent;
  return e = e || r.activeElement instanceof o && !cl.has(r.activeElement.type) || r.activeElement instanceof i || r.activeElement instanceof a && r.activeElement.isContentEditable, !(e && t === "keyboard" && n instanceof s && !al[n.key]);
}
function fl(e, t, n) {
  pr(), fe(() => {
    let r = (o, i) => {
      ul(!!(n != null && n.isTextInput), o, i) && e(ea());
    };
    return fr.add(r), () => {
      fr.delete(r);
    };
  }, t);
}
function dl(e) {
  let { isDisabled: t, onFocus: n, onBlur: r, onFocusChange: o } = e;
  const i = ae((l) => {
    if (l.target === l.currentTarget)
      return r && r(l), o && o(!1), !0;
  }, [
    r,
    o
  ]), a = Ki(i), s = ae((l) => {
    const c = rt(l.target), u = c ? ur(c) : ur();
    l.target === l.currentTarget && u === Vi(l.nativeEvent) && (n && n(l), o && o(!0), a(l));
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
function pl(e) {
  let { isDisabled: t, onBlurWithin: n, onFocusWithin: r, onFocusWithinChange: o } = e, i = Q({
    isFocusWithin: !1
  }), { addGlobalListener: a, removeAllGlobalListeners: s } = Gi(), l = ae((d) => {
    d.currentTarget.contains(d.target) && i.current.isFocusWithin && !d.currentTarget.contains(d.relatedTarget) && (i.current.isFocusWithin = !1, s(), n && n(d), o && o(!1));
  }, [
    n,
    o,
    i,
    s
  ]), c = Ki(l), u = ae((d) => {
    if (!d.currentTarget.contains(d.target)) return;
    const p = rt(d.target), f = ur(p);
    if (!i.current.isFocusWithin && f === Vi(d.nativeEvent)) {
      r && r(d), o && o(!0), i.current.isFocusWithin = !0, c(d);
      let m = d.currentTarget;
      a(p, "focus", (g) => {
        if (i.current.isFocusWithin && !Ui(m, g.target)) {
          let h = new qi("blur", new p.defaultView.FocusEvent("blur", {
            relatedTarget: g.target
          }));
          h.target = m, h.currentTarget = m, l(h);
        }
      }, {
        capture: !0
      });
    }
  }, [
    r,
    o,
    c,
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
      onFocus: u,
      onBlur: l
    }
  };
}
let dn = !1, _n = 0;
function mr() {
  dn = !0, setTimeout(() => {
    dn = !1;
  }, 50);
}
function To(e) {
  e.pointerType === "touch" && mr();
}
function ml() {
  if (!(typeof document > "u"))
    return typeof PointerEvent < "u" ? document.addEventListener("pointerup", To) : document.addEventListener("touchend", mr), _n++, () => {
      _n--, !(_n > 0) && (typeof PointerEvent < "u" ? document.removeEventListener("pointerup", To) : document.removeEventListener("touchend", mr));
    };
}
function gl(e) {
  let { onHoverStart: t, onHoverChange: n, onHoverEnd: r, isDisabled: o } = e, [i, a] = le(!1), s = Q({
    isHovered: !1,
    ignoreEmulatedMouseEvents: !1,
    pointerType: "",
    target: null
  }).current;
  fe(ml, []);
  let { addGlobalListener: l, removeAllGlobalListeners: c } = Gi(), { hoverProps: u, triggerHoverEnd: d } = ce(() => {
    let p = (g, h) => {
      if (s.pointerType = h, o || h === "touch" || s.isHovered || !g.currentTarget.contains(g.target)) return;
      s.isHovered = !0;
      let b = g.currentTarget;
      s.target = b, l(rt(g.target), "pointerover", (x) => {
        s.isHovered && s.target && !Ui(s.target, x.target) && f(x, x.pointerType);
      }, {
        capture: !0
      }), t && t({
        type: "hoverstart",
        target: b,
        pointerType: h
      }), n && n(!0), a(!0);
    }, f = (g, h) => {
      let b = s.target;
      s.pointerType = "", s.target = null, !(h === "touch" || !s.isHovered || !b) && (s.isHovered = !1, c(), r && r({
        type: "hoverend",
        target: b,
        pointerType: h
      }), n && n(!1), a(!1));
    }, m = {};
    return typeof PointerEvent < "u" ? (m.onPointerEnter = (g) => {
      dn && g.pointerType === "mouse" || p(g, g.pointerType);
    }, m.onPointerLeave = (g) => {
      !o && g.currentTarget.contains(g.target) && f(g, g.pointerType);
    }) : (m.onTouchStart = () => {
      s.ignoreEmulatedMouseEvents = !0;
    }, m.onMouseEnter = (g) => {
      !s.ignoreEmulatedMouseEvents && !dn && p(g, "mouse"), s.ignoreEmulatedMouseEvents = !1;
    }, m.onMouseLeave = (g) => {
      !o && g.currentTarget.contains(g.target) && f(g, "mouse");
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
    c
  ]);
  return fe(() => {
    o && d({
      currentTarget: s.target
    }, s.pointerType);
  }, [
    o
  ]), {
    hoverProps: u,
    isHovered: i
  };
}
function hl(e = {}) {
  let { autoFocus: t = !1, isTextInput: n, within: r } = e, o = Q({
    isFocused: !1,
    isFocusVisible: t || ea()
  }), [i, a] = le(!1), [s, l] = le(() => o.current.isFocused && o.current.isFocusVisible), c = ae(() => l(o.current.isFocused && o.current.isFocusVisible), []), u = ae((f) => {
    o.current.isFocused = f, a(f), c();
  }, [
    c
  ]);
  fl((f) => {
    o.current.isFocusVisible = f, c();
  }, [], {
    isTextInput: n
  });
  let { focusProps: d } = dl({
    isDisabled: r,
    onFocusChange: u
  }), { focusWithinProps: p } = pl({
    isDisabled: !r,
    onFocusWithinChange: u
  });
  return {
    isFocused: i,
    isFocusVisible: s,
    focusProps: r ? p : d
  };
}
var vl = Object.defineProperty, bl = (e, t, n) => t in e ? vl(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, Nn = (e, t, n) => (bl(e, typeof t != "symbol" ? t + "" : t, n), n);
let yl = class {
  constructor() {
    Nn(this, "current", this.detect()), Nn(this, "handoffState", "pending"), Nn(this, "currentId", 0);
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
}, lt = new yl();
function Yt(e) {
  var t, n;
  return lt.isServer ? null : e ? "ownerDocument" in e ? e.ownerDocument : "current" in e ? (n = (t = e.current) == null ? void 0 : t.ownerDocument) != null ? n : document : null : document;
}
function ta(e) {
  typeof queueMicrotask == "function" ? queueMicrotask(e) : Promise.resolve().then(e).catch((t) => setTimeout(() => {
    throw t;
  }));
}
function ze() {
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
    return ta(() => {
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
    let r = ze();
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
function St() {
  let [e] = le(ze);
  return fe(() => () => e.dispose(), [e]), e;
}
let se = (e, t) => {
  lt.isServer ? fe(e, t) : Vr(e, t);
};
function gt(e) {
  let t = Q(e);
  return se(() => {
    t.current = e;
  }, [e]), t;
}
let Z = function(e) {
  let t = gt(e);
  return V.useCallback((...n) => t.current(...n), [t]);
};
function xl(e) {
  let t = e.width / 2, n = e.height / 2;
  return { top: e.clientY - n, right: e.clientX + t, bottom: e.clientY + n, left: e.clientX - t };
}
function wl(e, t) {
  return !(!e || !t || e.right < t.left || e.left > t.right || e.bottom < t.top || e.top > t.bottom);
}
function El({ disabled: e = !1 } = {}) {
  let t = Q(null), [n, r] = le(!1), o = St(), i = Z(() => {
    t.current = null, r(!1), o.dispose();
  }), a = Z((s) => {
    if (o.dispose(), t.current === null) {
      t.current = s.currentTarget, r(!0);
      {
        let l = Yt(s.currentTarget);
        o.addEventListener(l, "pointerup", i, !1), o.addEventListener(l, "pointermove", (c) => {
          if (t.current) {
            let u = xl(c);
            r(wl(u, t.current.getBoundingClientRect()));
          }
        }, !1), o.addEventListener(l, "pointercancel", i, !1);
      }
    }
  });
  return { pressed: n, pressProps: e ? {} : { onPointerDown: a, onPointerUp: i, onClick: i } };
}
let Ol = be(void 0);
function qr() {
  return ue(Ol);
}
function gr(...e) {
  return Array.from(new Set(e.flatMap((t) => typeof t == "string" ? t.split(" ") : []))).filter(Boolean).join(" ");
}
function ke(e, t, ...n) {
  if (e in t) {
    let o = t[e];
    return typeof o == "function" ? o(...n) : o;
  }
  let r = new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map((o) => `"${o}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(r, ke), r;
}
var pn = ((e) => (e[e.None = 0] = "None", e[e.RenderStrategy = 1] = "RenderStrategy", e[e.Static = 2] = "Static", e))(pn || {}), Qe = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(Qe || {});
function Ee() {
  let e = Tl();
  return ae((t) => Sl({ mergeRefs: e, ...t }), [e]);
}
function Sl({ ourProps: e, theirProps: t, slot: n, defaultTag: r, features: o, visible: i = !0, name: a, mergeRefs: s }) {
  s = s ?? Al;
  let l = na(t, e);
  if (i) return Zt(l, n, r, a, s);
  let c = o ?? 0;
  if (c & 2) {
    let { static: u = !1, ...d } = l;
    if (u) return Zt(d, n, r, a, s);
  }
  if (c & 1) {
    let { unmount: u = !0, ...d } = l;
    return ke(u ? 0 : 1, { 0() {
      return null;
    }, 1() {
      return Zt({ ...d, hidden: !0, style: { display: "none" } }, n, r, a, s);
    } });
  }
  return Zt(l, n, r, a, s);
}
function Zt(e, t = {}, n, r, o) {
  let { as: i = n, children: a, refName: s = "ref", ...l } = Dn(e, ["unmount", "static"]), c = e.ref !== void 0 ? { [s]: e.ref } : {}, u = typeof a == "function" ? a(t) : a;
  "className" in l && l.className && typeof l.className == "function" && (l.className = l.className(t)), l["aria-labelledby"] && l["aria-labelledby"] === l.id && (l["aria-labelledby"] = void 0);
  let d = {};
  if (t) {
    let p = !1, f = [];
    for (let [m, g] of Object.entries(t)) typeof g == "boolean" && (p = !0), g === !0 && f.push(m.replace(/([A-Z])/g, (h) => `-${h.toLowerCase()}`));
    if (p) {
      d["data-headlessui-state"] = f.join(" ");
      for (let m of f) d[`data-${m}`] = "";
    }
  }
  if (i === Re && (Object.keys(Xe(l)).length > 0 || Object.keys(Xe(d)).length > 0)) if (!Vs(u) || Array.isArray(u) && u.length > 1) {
    if (Object.keys(Xe(l)).length > 0) throw new Error(['Passing props on "Fragment"!', "", `The current component <${r} /> is rendering a "Fragment".`, "However we need to passthrough the following props:", Object.keys(Xe(l)).concat(Object.keys(Xe(d))).map((p) => `  - ${p}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".', "Render a single element as the child so that we can forward the props onto that element."].map((p) => `  - ${p}`).join(`
`)].join(`
`));
  } else {
    let p = u.props, f = p == null ? void 0 : p.className, m = typeof f == "function" ? (...b) => gr(f(...b), l.className) : gr(f, l.className), g = m ? { className: m } : {}, h = na(u.props, Xe(Dn(l, ["ref"])));
    for (let b in d) b in h && delete d[b];
    return Ys(u, Object.assign({}, h, d, c, { ref: o(Pl(u), c.ref) }, g));
  }
  return Gs(i, Object.assign({}, Dn(l, ["ref"]), i !== Re && c, i !== Re && d), u);
}
function Tl() {
  let e = Q([]), t = ae((n) => {
    for (let r of e.current) r != null && (typeof r == "function" ? r(n) : r.current = n);
  }, []);
  return (...n) => {
    if (!n.every((r) => r == null)) return e.current = n, t;
  };
}
function Al(...e) {
  return e.every((t) => t == null) ? void 0 : (t) => {
    for (let n of e) n != null && (typeof n == "function" ? n(t) : n.current = t);
  };
}
function na(...e) {
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
function ra(...e) {
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
function xe(e) {
  var t;
  return Object.assign(Us(e), { displayName: (t = e.displayName) != null ? t : e.name });
}
function Xe(e) {
  let t = Object.assign({}, e);
  for (let n in t) t[n] === void 0 && delete t[n];
  return t;
}
function Dn(e, t = []) {
  let n = Object.assign({}, e);
  for (let r of t) r in n && delete n[r];
  return n;
}
function Pl(e) {
  return V.version.split(".")[0] >= "19" ? e.props.ref : e.ref;
}
function Cl(e, t, n) {
  let [r, o] = le(n), i = e !== void 0, a = Q(i), s = Q(!1), l = Q(!1);
  return i && !a.current && !s.current ? (s.current = !0, a.current = i, console.error("A component is changing from uncontrolled to controlled. This may be caused by the value changing from undefined to a defined value, which should not happen.")) : !i && a.current && !l.current && (l.current = !0, a.current = i, console.error("A component is changing from controlled to uncontrolled. This may be caused by the value changing from a defined value to undefined, which should not happen.")), [i ? e : r, Z((c) => (i || o(c), t == null ? void 0 : t(c)))];
}
function $l(e) {
  let [t] = le(e);
  return t;
}
function oa(e = {}, t = null, n = []) {
  for (let [r, o] of Object.entries(e)) aa(n, ia(t, r), o);
  return n;
}
function ia(e, t) {
  return e ? e + "[" + t + "]" : t;
}
function aa(e, t, n) {
  if (Array.isArray(n)) for (let [r, o] of n.entries()) aa(e, ia(t, r.toString()), o);
  else n instanceof Date ? e.push([t, n.toISOString()]) : typeof n == "boolean" ? e.push([t, n ? "1" : "0"]) : typeof n == "string" ? e.push([t, n]) : typeof n == "number" ? e.push([t, `${n}`]) : n == null ? e.push([t, ""]) : oa(n, t, e);
}
function Rl(e) {
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
let kl = "span";
var Kr = ((e) => (e[e.None = 1] = "None", e[e.Focusable = 2] = "Focusable", e[e.Hidden = 4] = "Hidden", e))(Kr || {});
function Il(e, t) {
  var n;
  let { features: r = 1, ...o } = e, i = { ref: t, "aria-hidden": (r & 2) === 2 ? !0 : (n = o["aria-hidden"]) != null ? n : void 0, hidden: (r & 4) === 4 ? !0 : void 0, style: { position: "fixed", top: 1, left: 1, width: 1, height: 0, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: "0", ...(r & 4) === 4 && (r & 2) !== 2 && { display: "none" } } };
  return Ee()({ ourProps: i, theirProps: o, slot: {}, defaultTag: kl, name: "Hidden" });
}
let sa = xe(Il), Ll = be(null);
function Ml({ children: e }) {
  let t = ue(Ll);
  if (!t) return V.createElement(V.Fragment, null, e);
  let { target: n } = t;
  return n ? Wi(V.createElement(V.Fragment, null, e), n) : null;
}
function Fl({ data: e, form: t, disabled: n, onReset: r, overrides: o }) {
  let [i, a] = le(null), s = St();
  return fe(() => {
    if (r && i) return s.addEventListener(i, "reset", r);
  }, [i, t, r]), V.createElement(Ml, null, V.createElement(_l, { setForm: a, formId: t }), oa(e).map(([l, c]) => V.createElement(sa, { features: Kr.Hidden, ...Xe({ key: l, as: "input", type: "hidden", hidden: !0, readOnly: !0, form: t, disabled: n, name: l, value: c, ...o }) })));
}
function _l({ setForm: e, formId: t }) {
  return fe(() => {
    if (t) {
      let n = document.getElementById(t);
      n && e(n);
    }
  }, [e, t]), t ? null : V.createElement(sa, { features: Kr.Hidden, as: "input", type: "hidden", hidden: !0, readOnly: !0, ref: (n) => {
    if (!n) return;
    let r = n.closest("form");
    r && e(r);
  } });
}
let Nl = be(void 0);
function la() {
  return ue(Nl);
}
function Dl(e) {
  let t = e.parentElement, n = null;
  for (; t && !(t instanceof HTMLFieldSetElement); ) t instanceof HTMLLegendElement && (n = t), t = t.parentElement;
  let r = (t == null ? void 0 : t.getAttribute("disabled")) === "";
  return r && jl(n) ? !1 : r;
}
function jl(e) {
  if (!e) return !1;
  let t = e.previousElementSibling;
  for (; t !== null; ) {
    if (t instanceof HTMLLegendElement) return !1;
    t = t.previousElementSibling;
  }
  return !0;
}
let ca = Symbol();
function zl(e, t = !0) {
  return Object.assign(e, { [ca]: t });
}
function Te(...e) {
  let t = Q(e);
  fe(() => {
    t.current = e;
  }, [e]);
  let n = Z((r) => {
    for (let o of t.current) o != null && (typeof o == "function" ? o(r) : o.current = r);
  });
  return e.every((r) => r == null || (r == null ? void 0 : r[ca])) ? void 0 : n;
}
let Xr = be(null);
Xr.displayName = "DescriptionContext";
function ua() {
  let e = ue(Xr);
  if (e === null) {
    let t = new Error("You used a <Description /> component, but it is not inside a relevant parent.");
    throw Error.captureStackTrace && Error.captureStackTrace(t, ua), t;
  }
  return e;
}
function Hl() {
  var e, t;
  return (t = (e = ue(Xr)) == null ? void 0 : e.value) != null ? t : void 0;
}
let Wl = "p";
function Bl(e, t) {
  let n = Ot(), r = qr(), { id: o = `headlessui-description-${n}`, ...i } = e, a = ua(), s = Te(t);
  se(() => a.register(o), [o, a.register]);
  let l = r || !1, c = ce(() => ({ ...a.slot, disabled: l }), [a.slot, l]), u = { ref: s, ...a.props, id: o };
  return Ee()({ ourProps: u, theirProps: i, slot: c, defaultTag: Wl, name: a.name || "Description" });
}
let Ul = xe(Bl);
Object.assign(Ul, {});
var de = ((e) => (e.Space = " ", e.Enter = "Enter", e.Escape = "Escape", e.Backspace = "Backspace", e.Delete = "Delete", e.ArrowLeft = "ArrowLeft", e.ArrowUp = "ArrowUp", e.ArrowRight = "ArrowRight", e.ArrowDown = "ArrowDown", e.Home = "Home", e.End = "End", e.PageUp = "PageUp", e.PageDown = "PageDown", e.Tab = "Tab", e))(de || {});
let wn = be(null);
wn.displayName = "LabelContext";
function fa() {
  let e = ue(wn);
  if (e === null) {
    let t = new Error("You used a <Label /> component, but it is not inside a relevant parent.");
    throw Error.captureStackTrace && Error.captureStackTrace(t, fa), t;
  }
  return e;
}
function da(e) {
  var t, n, r;
  let o = (n = (t = ue(wn)) == null ? void 0 : t.value) != null ? n : void 0;
  return ((r = e == null ? void 0 : e.length) != null ? r : 0) > 0 ? [o, ...e].filter(Boolean).join(" ") : o;
}
function Vl({ inherit: e = !1 } = {}) {
  let t = da(), [n, r] = le([]), o = e ? [t, ...n].filter(Boolean) : n;
  return [o.length > 0 ? o.join(" ") : void 0, ce(() => function(i) {
    let a = Z((l) => (r((c) => [...c, l]), () => r((c) => {
      let u = c.slice(), d = u.indexOf(l);
      return d !== -1 && u.splice(d, 1), u;
    }))), s = ce(() => ({ register: a, slot: i.slot, name: i.name, props: i.props, value: i.value }), [a, i.slot, i.name, i.props, i.value]);
    return V.createElement(wn.Provider, { value: s }, i.children);
  }, [r])];
}
let Yl = "label";
function Gl(e, t) {
  var n;
  let r = Ot(), o = fa(), i = la(), a = qr(), { id: s = `headlessui-label-${r}`, htmlFor: l = i ?? ((n = o.props) == null ? void 0 : n.htmlFor), passive: c = !1, ...u } = e, d = Te(t);
  se(() => o.register(s), [s, o.register]);
  let p = Z((h) => {
    let b = h.currentTarget;
    if (b instanceof HTMLLabelElement && h.preventDefault(), o.props && "onClick" in o.props && typeof o.props.onClick == "function" && o.props.onClick(h), b instanceof HTMLLabelElement) {
      let x = document.getElementById(b.htmlFor);
      if (x) {
        let y = x.getAttribute("disabled");
        if (y === "true" || y === "") return;
        let E = x.getAttribute("aria-disabled");
        if (E === "true" || E === "") return;
        (x instanceof HTMLInputElement && (x.type === "radio" || x.type === "checkbox") || x.role === "radio" || x.role === "checkbox" || x.role === "switch") && x.click(), x.focus({ preventScroll: !0 });
      }
    }
  }), f = a || !1, m = ce(() => ({ ...o.slot, disabled: f }), [o.slot, f]), g = { ref: d, ...o.props, id: s, htmlFor: l, onClick: p };
  return c && ("onClick" in g && (delete g.htmlFor, delete g.onClick), "onClick" in u && delete u.onClick), Ee()({ ourProps: g, theirProps: u, slot: m, defaultTag: l ? Yl : "div", name: o.name || "Label" });
}
let ql = xe(Gl), Kl = Object.assign(ql, {});
function Xl(e, t) {
  return e !== null && t !== null && typeof e == "object" && typeof t == "object" && "id" in e && "id" in t ? e.id === t.id : e === t;
}
function Ql(e = Xl) {
  return ae((t, n) => {
    if (typeof e == "string") {
      let r = e;
      return (t == null ? void 0 : t[r]) === (n == null ? void 0 : n[r]);
    }
    return e(t, n);
  }, [e]);
}
function Jl(e) {
  if (e === null) return { width: 0, height: 0 };
  let { width: t, height: n } = e.getBoundingClientRect();
  return { width: t, height: n };
}
function Zl(e, t = !1) {
  let [n, r] = qs(() => ({}), {}), o = ce(() => Jl(e), [e, n]);
  return se(() => {
    if (!e) return;
    let i = new ResizeObserver(r);
    return i.observe(e), () => {
      i.disconnect();
    };
  }, [e]), t ? { width: `${o.width}px`, height: `${o.height}px` } : o;
}
let pa = class extends Map {
  constructor(t) {
    super(), this.factory = t;
  }
  get(t) {
    let n = super.get(t);
    return n === void 0 && (n = this.factory(t), this.set(t, n)), n;
  }
};
function ma(e, t) {
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
function ga(e) {
  return Ks(e.subscribe, e.getSnapshot, e.getSnapshot);
}
let ec = new pa(() => ma(() => [], { ADD(e) {
  return this.includes(e) ? this : [...this, e];
}, REMOVE(e) {
  let t = this.indexOf(e);
  if (t === -1) return this;
  let n = this.slice();
  return n.splice(t, 1), n;
} }));
function Qr(e, t) {
  let n = ec.get(t), r = Ot(), o = ga(n);
  if (se(() => {
    if (e) return n.dispatch("ADD", r), () => n.dispatch("REMOVE", r);
  }, [n, e]), !e) return !1;
  let i = o.indexOf(r), a = o.length;
  return i === -1 && (i = a, a += 1), i === a - 1;
}
let hr = /* @__PURE__ */ new Map(), Nt = /* @__PURE__ */ new Map();
function Ao(e) {
  var t;
  let n = (t = Nt.get(e)) != null ? t : 0;
  return Nt.set(e, n + 1), n !== 0 ? () => Po(e) : (hr.set(e, { "aria-hidden": e.getAttribute("aria-hidden"), inert: e.inert }), e.setAttribute("aria-hidden", "true"), e.inert = !0, () => Po(e));
}
function Po(e) {
  var t;
  let n = (t = Nt.get(e)) != null ? t : 1;
  if (n === 1 ? Nt.delete(e) : Nt.set(e, n - 1), n !== 1) return;
  let r = hr.get(e);
  r && (r["aria-hidden"] === null ? e.removeAttribute("aria-hidden") : e.setAttribute("aria-hidden", r["aria-hidden"]), e.inert = r.inert, hr.delete(e));
}
function tc(e, { allowed: t, disallowed: n } = {}) {
  let r = Qr(e, "inert-others");
  se(() => {
    var o, i;
    if (!r) return;
    let a = ze();
    for (let l of (o = n == null ? void 0 : n()) != null ? o : []) l && a.add(Ao(l));
    let s = (i = t == null ? void 0 : t()) != null ? i : [];
    for (let l of s) {
      if (!l) continue;
      let c = Yt(l);
      if (!c) continue;
      let u = l.parentElement;
      for (; u && u !== c.body; ) {
        for (let d of u.children) s.some((p) => d.contains(p)) || a.add(Ao(d));
        u = u.parentElement;
      }
    }
    return a.dispose;
  }, [r, t, n]);
}
function nc(e, t, n) {
  let r = gt((o) => {
    let i = o.getBoundingClientRect();
    i.x === 0 && i.y === 0 && i.width === 0 && i.height === 0 && n();
  });
  fe(() => {
    if (!e) return;
    let o = t === null ? null : t instanceof HTMLElement ? t : t.current;
    if (!o) return;
    let i = ze();
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
let vr = ["[contentEditable=true]", "[tabindex]", "a[href]", "area[href]", "button:not([disabled])", "iframe", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])"].map((e) => `${e}:not([tabindex='-1'])`).join(","), rc = ["[data-autofocus]"].map((e) => `${e}:not([tabindex='-1'])`).join(",");
var br = ((e) => (e[e.First = 1] = "First", e[e.Previous = 2] = "Previous", e[e.Next = 4] = "Next", e[e.Last = 8] = "Last", e[e.WrapAround = 16] = "WrapAround", e[e.NoScroll = 32] = "NoScroll", e[e.AutoFocus = 64] = "AutoFocus", e))(br || {}), oc = ((e) => (e[e.Error = 0] = "Error", e[e.Overflow = 1] = "Overflow", e[e.Success = 2] = "Success", e[e.Underflow = 3] = "Underflow", e))(oc || {}), ic = ((e) => (e[e.Previous = -1] = "Previous", e[e.Next = 1] = "Next", e))(ic || {});
function ha(e = document.body) {
  return e == null ? [] : Array.from(e.querySelectorAll(vr)).sort((t, n) => Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (n.tabIndex || Number.MAX_SAFE_INTEGER)));
}
function ac(e = document.body) {
  return e == null ? [] : Array.from(e.querySelectorAll(rc)).sort((t, n) => Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (n.tabIndex || Number.MAX_SAFE_INTEGER)));
}
var Jr = ((e) => (e[e.Strict = 0] = "Strict", e[e.Loose = 1] = "Loose", e))(Jr || {});
function va(e, t = 0) {
  var n;
  return e === ((n = Yt(e)) == null ? void 0 : n.body) ? !1 : ke(t, { 0() {
    return e.matches(vr);
  }, 1() {
    let r = e;
    for (; r !== null; ) {
      if (r.matches(vr)) return !0;
      r = r.parentElement;
    }
    return !1;
  } });
}
var sc = ((e) => (e[e.Keyboard = 0] = "Keyboard", e[e.Mouse = 1] = "Mouse", e))(sc || {});
typeof window < "u" && typeof document < "u" && (document.addEventListener("keydown", (e) => {
  e.metaKey || e.altKey || e.ctrlKey || (document.documentElement.dataset.headlessuiFocusVisible = "");
}, !0), document.addEventListener("click", (e) => {
  e.detail === 1 ? delete document.documentElement.dataset.headlessuiFocusVisible : e.detail === 0 && (document.documentElement.dataset.headlessuiFocusVisible = "");
}, !0));
let lc = ["textarea", "input"].join(",");
function cc(e) {
  var t, n;
  return (n = (t = e == null ? void 0 : e.matches) == null ? void 0 : t.call(e, lc)) != null ? n : !1;
}
function ba(e, t = (n) => n) {
  return e.slice().sort((n, r) => {
    let o = t(n), i = t(r);
    if (o === null || i === null) return 0;
    let a = o.compareDocumentPosition(i);
    return a & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : a & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
  });
}
function uc(e, t) {
  return fc(ha(), t, { relativeTo: e });
}
function fc(e, t, { sorted: n = !0, relativeTo: r = null, skipElements: o = [] } = {}) {
  let i = Array.isArray(e) ? e.length > 0 ? e[0].ownerDocument : document : e.ownerDocument, a = Array.isArray(e) ? n ? ba(e) : e : t & 64 ? ac(e) : ha(e);
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
  })(), c = t & 32 ? { preventScroll: !0 } : {}, u = 0, d = a.length, p;
  do {
    if (u >= d || u + d <= 0) return 0;
    let f = l + u;
    if (t & 16) f = (f + d) % d;
    else {
      if (f < 0) return 3;
      if (f >= d) return 1;
    }
    p = a[f], p == null || p.focus(c), u += s;
  } while (p !== i.activeElement);
  return t & 6 && cc(p) && p.select(), 2;
}
function ya() {
  return /iPhone/gi.test(window.navigator.platform) || /Mac/gi.test(window.navigator.platform) && window.navigator.maxTouchPoints > 0;
}
function dc() {
  return /Android/gi.test(window.navigator.userAgent);
}
function pc() {
  return ya() || dc();
}
function Rt(e, t, n, r) {
  let o = gt(n);
  fe(() => {
    if (!e) return;
    function i(a) {
      o.current(a);
    }
    return document.addEventListener(t, i, r), () => document.removeEventListener(t, i, r);
  }, [e, t, r]);
}
function mc(e, t, n, r) {
  let o = gt(n);
  fe(() => {
    if (!e) return;
    function i(a) {
      o.current(a);
    }
    return window.addEventListener(t, i, r), () => window.removeEventListener(t, i, r);
  }, [e, t, r]);
}
const Co = 30;
function gc(e, t, n) {
  let r = Qr(e, "outside-click"), o = gt(n), i = ae(function(l, c) {
    if (l.defaultPrevented) return;
    let u = c(l);
    if (u === null || !u.getRootNode().contains(u) || !u.isConnected) return;
    let d = function p(f) {
      return typeof f == "function" ? p(f()) : Array.isArray(f) || f instanceof Set ? f : [f];
    }(t);
    for (let p of d) if (p !== null && (p.contains(u) || l.composed && l.composedPath().includes(p))) return;
    return !va(u, Jr.Loose) && u.tabIndex !== -1 && l.preventDefault(), o.current(l, u);
  }, [o, t]), a = Q(null);
  Rt(r, "pointerdown", (l) => {
    var c, u;
    a.current = ((u = (c = l.composedPath) == null ? void 0 : c.call(l)) == null ? void 0 : u[0]) || l.target;
  }, !0), Rt(r, "mousedown", (l) => {
    var c, u;
    a.current = ((u = (c = l.composedPath) == null ? void 0 : c.call(l)) == null ? void 0 : u[0]) || l.target;
  }, !0), Rt(r, "click", (l) => {
    pc() || a.current && (i(l, () => a.current), a.current = null);
  }, !0);
  let s = Q({ x: 0, y: 0 });
  Rt(r, "touchstart", (l) => {
    s.current.x = l.touches[0].clientX, s.current.y = l.touches[0].clientY;
  }, !0), Rt(r, "touchend", (l) => {
    let c = { x: l.changedTouches[0].clientX, y: l.changedTouches[0].clientY };
    if (!(Math.abs(c.x - s.current.x) >= Co || Math.abs(c.y - s.current.y) >= Co)) return i(l, () => l.target instanceof HTMLElement ? l.target : null);
  }, !0), mc(r, "blur", (l) => i(l, () => window.document.activeElement instanceof HTMLIFrameElement ? window.document.activeElement : null), !0);
}
function yr(...e) {
  return ce(() => Yt(...e), [...e]);
}
function hc(e, t) {
  return ce(() => {
    var n;
    if (e.type) return e.type;
    let r = (n = e.as) != null ? n : "button";
    if (typeof r == "string" && r.toLowerCase() === "button" || (t == null ? void 0 : t.tagName) === "BUTTON" && !t.hasAttribute("type")) return "button";
  }, [e.type, e.as, t]);
}
function vc() {
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
function bc() {
  return ya() ? { before({ doc: e, d: t, meta: n }) {
    function r(o) {
      return n.containers.flatMap((i) => i()).some((i) => i.contains(o));
    }
    t.microTask(() => {
      var o;
      if (window.getComputedStyle(e.documentElement).scrollBehavior !== "auto") {
        let s = ze();
        s.style(e.documentElement, "scrollBehavior", "auto"), t.add(() => t.microTask(() => s.dispose()));
      }
      let i = (o = window.scrollY) != null ? o : window.pageYOffset, a = null;
      t.addEventListener(e, "click", (s) => {
        if (s.target instanceof HTMLElement) try {
          let l = s.target.closest("a");
          if (!l) return;
          let { hash: c } = new URL(l.href), u = e.querySelector(c);
          u && !r(u) && (a = u);
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
function yc() {
  return { before({ doc: e, d: t }) {
    t.style(e.documentElement, "overflow", "hidden");
  } };
}
function xc(e) {
  let t = {};
  for (let n of e) Object.assign(t, n(t));
  return t;
}
let it = ma(() => /* @__PURE__ */ new Map(), { PUSH(e, t) {
  var n;
  let r = (n = this.get(e)) != null ? n : { doc: e, count: 0, d: ze(), meta: /* @__PURE__ */ new Set() };
  return r.count++, r.meta.add(t), this.set(e, r), this;
}, POP(e, t) {
  let n = this.get(e);
  return n && (n.count--, n.meta.delete(t)), this;
}, SCROLL_PREVENT({ doc: e, d: t, meta: n }) {
  let r = { doc: e, d: t, meta: xc(n) }, o = [bc(), vc(), yc()];
  o.forEach(({ before: i }) => i == null ? void 0 : i(r)), o.forEach(({ after: i }) => i == null ? void 0 : i(r));
}, SCROLL_ALLOW({ d: e }) {
  e.dispose();
}, TEARDOWN({ doc: e }) {
  this.delete(e);
} });
it.subscribe(() => {
  let e = it.getSnapshot(), t = /* @__PURE__ */ new Map();
  for (let [n] of e) t.set(n, n.documentElement.style.overflow);
  for (let n of e.values()) {
    let r = t.get(n.doc) === "hidden", o = n.count !== 0;
    (o && !r || !o && r) && it.dispatch(n.count > 0 ? "SCROLL_PREVENT" : "SCROLL_ALLOW", n), n.count === 0 && it.dispatch("TEARDOWN", n);
  }
});
function wc(e, t, n = () => ({ containers: [] })) {
  let r = ga(it), o = t ? r.get(t) : void 0, i = o ? o.count > 0 : !1;
  return se(() => {
    if (!(!t || !e)) return it.dispatch("PUSH", t, n), () => it.dispatch("POP", t, n);
  }, [e, t]), i;
}
function Ec(e, t, n = () => [document.body]) {
  let r = Qr(e, "scroll-lock");
  wc(r, t, (o) => {
    var i;
    return { containers: [...(i = o.containers) != null ? i : [], n] };
  });
}
function $o(e) {
  return [e.screenX, e.screenY];
}
function Oc() {
  let e = Q([-1, -1]);
  return { wasMoved(t) {
    let n = $o(t);
    return e.current[0] === n[0] && e.current[1] === n[1] ? !1 : (e.current = n, !0);
  }, update(t) {
    e.current = $o(t);
  } };
}
function Sc(e = 0) {
  let [t, n] = le(e), r = ae((l) => n(l), [t]), o = ae((l) => n((c) => c | l), [t]), i = ae((l) => (t & l) === l, [t]), a = ae((l) => n((c) => c & ~l), [n]), s = ae((l) => n((c) => c ^ l), [n]);
  return { flags: t, setFlag: r, addFlag: o, hasFlag: i, removeFlag: a, toggleFlag: s };
}
var Ro, ko;
typeof process < "u" && typeof globalThis < "u" && typeof Element < "u" && ((Ro = process == null ? void 0 : process.env) == null ? void 0 : Ro.NODE_ENV) === "test" && typeof ((ko = Element == null ? void 0 : Element.prototype) == null ? void 0 : ko.getAnimations) > "u" && (Element.prototype.getAnimations = function() {
  return console.warn(["Headless UI has polyfilled `Element.prototype.getAnimations` for your tests.", "Please install a proper polyfill e.g. `jsdom-testing-mocks`, to silence these warnings.", "", "Example usage:", "```js", "import { mockAnimationsApi } from 'jsdom-testing-mocks'", "mockAnimationsApi()", "```"].join(`
`)), [];
});
var Tc = ((e) => (e[e.None = 0] = "None", e[e.Closed = 1] = "Closed", e[e.Enter = 2] = "Enter", e[e.Leave = 4] = "Leave", e))(Tc || {});
function xa(e) {
  let t = {};
  for (let n in e) e[n] === !0 && (t[`data-${n}`] = "");
  return t;
}
function wa(e, t, n, r) {
  let [o, i] = le(n), { hasFlag: a, addFlag: s, removeFlag: l } = Sc(e && o ? 3 : 0), c = Q(!1), u = Q(!1), d = St();
  return se(() => {
    var p;
    if (e) {
      if (n && i(!0), !t) {
        n && s(3);
        return;
      }
      return (p = r == null ? void 0 : r.start) == null || p.call(r, n), Ac(t, { inFlight: c, prepare() {
        u.current ? u.current = !1 : u.current = c.current, c.current = !0, !u.current && (n ? (s(3), l(4)) : (s(4), l(2)));
      }, run() {
        u.current ? n ? (l(3), s(4)) : (l(4), s(3)) : n ? l(1) : s(1);
      }, done() {
        var f;
        u.current && typeof t.getAnimations == "function" && t.getAnimations().length > 0 || (c.current = !1, l(7), n || i(!1), (f = r == null ? void 0 : r.end) == null || f.call(r, n));
      } });
    }
  }, [e, n, t, d]), e ? [o, { closed: a(1), enter: a(2), leave: a(4), transition: a(2) || a(4) }] : [n, { closed: void 0, enter: void 0, leave: void 0, transition: void 0 }];
}
function Ac(e, { prepare: t, run: n, done: r, inFlight: o }) {
  let i = ze();
  return Cc(e, { prepare: t, inFlight: o }), i.nextFrame(() => {
    n(), i.requestAnimationFrame(() => {
      i.add(Pc(e, r));
    });
  }), i.dispose;
}
function Pc(e, t) {
  var n, r;
  let o = ze();
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
function Cc(e, { inFlight: t, prepare: n }) {
  if (t != null && t.current) {
    n();
    return;
  }
  let r = e.style.transition;
  e.style.transition = "none", n(), e.offsetHeight, e.style.transition = r;
}
function En() {
  return typeof window < "u";
}
function Tt(e) {
  return Ea(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function we(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function He(e) {
  var t;
  return (t = (Ea(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function Ea(e) {
  return En() ? e instanceof Node || e instanceof we(e).Node : !1;
}
function he(e) {
  return En() ? e instanceof Element || e instanceof we(e).Element : !1;
}
function je(e) {
  return En() ? e instanceof HTMLElement || e instanceof we(e).HTMLElement : !1;
}
function Io(e) {
  return !En() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof we(e).ShadowRoot;
}
function Gt(e) {
  const {
    overflow: t,
    overflowX: n,
    overflowY: r,
    display: o
  } = Ie(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !["inline", "contents"].includes(o);
}
function $c(e) {
  return ["table", "td", "th"].includes(Tt(e));
}
function On(e) {
  return [":popover-open", ":modal"].some((t) => {
    try {
      return e.matches(t);
    } catch {
      return !1;
    }
  });
}
function Zr(e) {
  const t = eo(), n = he(e) ? Ie(e) : e;
  return ["transform", "translate", "scale", "rotate", "perspective"].some((r) => n[r] ? n[r] !== "none" : !1) || (n.containerType ? n.containerType !== "normal" : !1) || !t && (n.backdropFilter ? n.backdropFilter !== "none" : !1) || !t && (n.filter ? n.filter !== "none" : !1) || ["transform", "translate", "scale", "rotate", "perspective", "filter"].some((r) => (n.willChange || "").includes(r)) || ["paint", "layout", "strict", "content"].some((r) => (n.contain || "").includes(r));
}
function Rc(e) {
  let t = Je(e);
  for (; je(t) && !wt(t); ) {
    if (Zr(t))
      return t;
    if (On(t))
      return null;
    t = Je(t);
  }
  return null;
}
function eo() {
  return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
function wt(e) {
  return ["html", "body", "#document"].includes(Tt(e));
}
function Ie(e) {
  return we(e).getComputedStyle(e);
}
function Sn(e) {
  return he(e) ? {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  } : {
    scrollLeft: e.scrollX,
    scrollTop: e.scrollY
  };
}
function Je(e) {
  if (Tt(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    Io(e) && e.host || // Fallback.
    He(e)
  );
  return Io(t) ? t.host : t;
}
function Oa(e) {
  const t = Je(e);
  return wt(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : je(t) && Gt(t) ? t : Oa(t);
}
function zt(e, t, n) {
  var r;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const o = Oa(e), i = o === ((r = e.ownerDocument) == null ? void 0 : r.body), a = we(o);
  if (i) {
    const s = xr(a);
    return t.concat(a, a.visualViewport || [], Gt(o) ? o : [], s && n ? zt(s) : []);
  }
  return t.concat(o, zt(o, [], n));
}
function xr(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function kc() {
  const e = navigator.userAgentData;
  return e && Array.isArray(e.brands) ? e.brands.map((t) => {
    let {
      brand: n,
      version: r
    } = t;
    return n + "/" + r;
  }).join(" ") : navigator.userAgent;
}
const ut = Math.min, ge = Math.max, Ht = Math.round, en = Math.floor, De = (e) => ({
  x: e,
  y: e
}), Ic = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, Lc = {
  start: "end",
  end: "start"
};
function Lo(e, t, n) {
  return ge(e, ut(t, n));
}
function At(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Ze(e) {
  return e.split("-")[0];
}
function qt(e) {
  return e.split("-")[1];
}
function Sa(e) {
  return e === "x" ? "y" : "x";
}
function Ta(e) {
  return e === "y" ? "height" : "width";
}
function ft(e) {
  return ["top", "bottom"].includes(Ze(e)) ? "y" : "x";
}
function Aa(e) {
  return Sa(ft(e));
}
function Mc(e, t, n) {
  n === void 0 && (n = !1);
  const r = qt(e), o = Aa(e), i = Ta(o);
  let a = o === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return t.reference[i] > t.floating[i] && (a = mn(a)), [a, mn(a)];
}
function Fc(e) {
  const t = mn(e);
  return [wr(e), t, wr(t)];
}
function wr(e) {
  return e.replace(/start|end/g, (t) => Lc[t]);
}
function _c(e, t, n) {
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
function Nc(e, t, n, r) {
  const o = qt(e);
  let i = _c(Ze(e), n === "start", r);
  return o && (i = i.map((a) => a + "-" + o), t && (i = i.concat(i.map(wr)))), i;
}
function mn(e) {
  return e.replace(/left|right|bottom|top/g, (t) => Ic[t]);
}
function Dc(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function jc(e) {
  return typeof e != "number" ? Dc(e) : {
    top: e,
    right: e,
    bottom: e,
    left: e
  };
}
function gn(e) {
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
function Mo(e, t, n) {
  let {
    reference: r,
    floating: o
  } = e;
  const i = ft(t), a = Aa(t), s = Ta(a), l = Ze(t), c = i === "y", u = r.x + r.width / 2 - o.width / 2, d = r.y + r.height / 2 - o.height / 2, p = r[s] / 2 - o[s] / 2;
  let f;
  switch (l) {
    case "top":
      f = {
        x: u,
        y: r.y - o.height
      };
      break;
    case "bottom":
      f = {
        x: u,
        y: r.y + r.height
      };
      break;
    case "right":
      f = {
        x: r.x + r.width,
        y: d
      };
      break;
    case "left":
      f = {
        x: r.x - o.width,
        y: d
      };
      break;
    default:
      f = {
        x: r.x,
        y: r.y
      };
  }
  switch (qt(t)) {
    case "start":
      f[a] -= p * (n && c ? -1 : 1);
      break;
    case "end":
      f[a] += p * (n && c ? -1 : 1);
      break;
  }
  return f;
}
const zc = async (e, t, n) => {
  const {
    placement: r = "bottom",
    strategy: o = "absolute",
    middleware: i = [],
    platform: a
  } = n, s = i.filter(Boolean), l = await (a.isRTL == null ? void 0 : a.isRTL(t));
  let c = await a.getElementRects({
    reference: e,
    floating: t,
    strategy: o
  }), {
    x: u,
    y: d
  } = Mo(c, r, l), p = r, f = {}, m = 0;
  for (let g = 0; g < s.length; g++) {
    const {
      name: h,
      fn: b
    } = s[g], {
      x,
      y,
      data: E,
      reset: v
    } = await b({
      x: u,
      y: d,
      initialPlacement: r,
      placement: p,
      strategy: o,
      middlewareData: f,
      rects: c,
      platform: a,
      elements: {
        reference: e,
        floating: t
      }
    });
    u = x ?? u, d = y ?? d, f = {
      ...f,
      [h]: {
        ...f[h],
        ...E
      }
    }, v && m <= 50 && (m++, typeof v == "object" && (v.placement && (p = v.placement), v.rects && (c = v.rects === !0 ? await a.getElementRects({
      reference: e,
      floating: t,
      strategy: o
    }) : v.rects), {
      x: u,
      y: d
    } = Mo(c, p, l)), g = -1);
  }
  return {
    x: u,
    y: d,
    placement: p,
    strategy: o,
    middlewareData: f
  };
};
async function Tn(e, t) {
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
    boundary: c = "clippingAncestors",
    rootBoundary: u = "viewport",
    elementContext: d = "floating",
    altBoundary: p = !1,
    padding: f = 0
  } = At(t, e), m = jc(f), h = s[p ? d === "floating" ? "reference" : "floating" : d], b = gn(await i.getClippingRect({
    element: (n = await (i.isElement == null ? void 0 : i.isElement(h))) == null || n ? h : h.contextElement || await (i.getDocumentElement == null ? void 0 : i.getDocumentElement(s.floating)),
    boundary: c,
    rootBoundary: u,
    strategy: l
  })), x = d === "floating" ? {
    x: r,
    y: o,
    width: a.floating.width,
    height: a.floating.height
  } : a.reference, y = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(s.floating)), E = await (i.isElement == null ? void 0 : i.isElement(y)) ? await (i.getScale == null ? void 0 : i.getScale(y)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, v = gn(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements: s,
    rect: x,
    offsetParent: y,
    strategy: l
  }) : x);
  return {
    top: (b.top - v.top + m.top) / E.y,
    bottom: (v.bottom - b.bottom + m.bottom) / E.y,
    left: (b.left - v.left + m.left) / E.x,
    right: (v.right - b.right + m.right) / E.x
  };
}
const Hc = function(e) {
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
        elements: c
      } = t, {
        mainAxis: u = !0,
        crossAxis: d = !0,
        fallbackPlacements: p,
        fallbackStrategy: f = "bestFit",
        fallbackAxisSideDirection: m = "none",
        flipAlignment: g = !0,
        ...h
      } = At(e, t);
      if ((n = i.arrow) != null && n.alignmentOffset)
        return {};
      const b = Ze(o), x = ft(s), y = Ze(s) === s, E = await (l.isRTL == null ? void 0 : l.isRTL(c.floating)), v = p || (y || !g ? [mn(s)] : Fc(s)), C = m !== "none";
      !p && C && v.push(...Nc(s, g, m, E));
      const $ = [s, ...v], G = await Tn(t, h), J = [];
      let P = ((r = i.flip) == null ? void 0 : r.overflows) || [];
      if (u && J.push(G[b]), d) {
        const R = Mc(o, a, E);
        J.push(G[R[0]], G[R[1]]);
      }
      if (P = [...P, {
        placement: o,
        overflows: J
      }], !J.every((R) => R <= 0)) {
        var _, L;
        const R = (((_ = i.flip) == null ? void 0 : _.index) || 0) + 1, re = $[R];
        if (re)
          return {
            data: {
              index: R,
              overflows: P
            },
            reset: {
              placement: re
            }
          };
        let Y = (L = P.filter((ee) => ee.overflows[0] <= 0).sort((ee, N) => ee.overflows[1] - N.overflows[1])[0]) == null ? void 0 : L.placement;
        if (!Y)
          switch (f) {
            case "bestFit": {
              var K;
              const ee = (K = P.filter((N) => {
                if (C) {
                  const B = ft(N.placement);
                  return B === x || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  B === "y";
                }
                return !0;
              }).map((N) => [N.placement, N.overflows.filter((B) => B > 0).reduce((B, w) => B + w, 0)]).sort((N, B) => N[1] - B[1])[0]) == null ? void 0 : K[0];
              ee && (Y = ee);
              break;
            }
            case "initialPlacement":
              Y = s;
              break;
          }
        if (o !== Y)
          return {
            reset: {
              placement: Y
            }
          };
      }
      return {};
    }
  };
};
async function Wc(e, t) {
  const {
    placement: n,
    platform: r,
    elements: o
  } = e, i = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)), a = Ze(n), s = qt(n), l = ft(n) === "y", c = ["left", "top"].includes(a) ? -1 : 1, u = i && l ? -1 : 1, d = At(t, e);
  let {
    mainAxis: p,
    crossAxis: f,
    alignmentAxis: m
  } = typeof d == "number" ? {
    mainAxis: d,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: d.mainAxis || 0,
    crossAxis: d.crossAxis || 0,
    alignmentAxis: d.alignmentAxis
  };
  return s && typeof m == "number" && (f = s === "end" ? m * -1 : m), l ? {
    x: f * u,
    y: p * c
  } : {
    x: p * c,
    y: f * u
  };
}
const Bc = function(e) {
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
      } = t, l = await Wc(t, e);
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
}, Uc = function(e) {
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
          fn: (h) => {
            let {
              x: b,
              y: x
            } = h;
            return {
              x: b,
              y: x
            };
          }
        },
        ...l
      } = At(e, t), c = {
        x: n,
        y: r
      }, u = await Tn(t, l), d = ft(Ze(o)), p = Sa(d);
      let f = c[p], m = c[d];
      if (i) {
        const h = p === "y" ? "top" : "left", b = p === "y" ? "bottom" : "right", x = f + u[h], y = f - u[b];
        f = Lo(x, f, y);
      }
      if (a) {
        const h = d === "y" ? "top" : "left", b = d === "y" ? "bottom" : "right", x = m + u[h], y = m - u[b];
        m = Lo(x, m, y);
      }
      const g = s.fn({
        ...t,
        [p]: f,
        [d]: m
      });
      return {
        ...g,
        data: {
          x: g.x - n,
          y: g.y - r,
          enabled: {
            [p]: i,
            [d]: a
          }
        }
      };
    }
  };
}, Vc = function(e) {
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
        ...c
      } = At(e, t), u = await Tn(t, c), d = Ze(o), p = qt(o), f = ft(o) === "y", {
        width: m,
        height: g
      } = i.floating;
      let h, b;
      d === "top" || d === "bottom" ? (h = d, b = p === (await (a.isRTL == null ? void 0 : a.isRTL(s.floating)) ? "start" : "end") ? "left" : "right") : (b = d, h = p === "end" ? "top" : "bottom");
      const x = g - u.top - u.bottom, y = m - u.left - u.right, E = ut(g - u[h], x), v = ut(m - u[b], y), C = !t.middlewareData.shift;
      let $ = E, G = v;
      if ((n = t.middlewareData.shift) != null && n.enabled.x && (G = y), (r = t.middlewareData.shift) != null && r.enabled.y && ($ = x), C && !p) {
        const P = ge(u.left, 0), _ = ge(u.right, 0), L = ge(u.top, 0), K = ge(u.bottom, 0);
        f ? G = m - 2 * (P !== 0 || _ !== 0 ? P + _ : ge(u.left, u.right)) : $ = g - 2 * (L !== 0 || K !== 0 ? L + K : ge(u.top, u.bottom));
      }
      await l({
        ...t,
        availableWidth: G,
        availableHeight: $
      });
      const J = await a.getDimensions(s.floating);
      return m !== J.width || g !== J.height ? {
        reset: {
          rects: !0
        }
      } : {};
    }
  };
};
function Pa(e) {
  const t = Ie(e);
  let n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0;
  const o = je(e), i = o ? e.offsetWidth : n, a = o ? e.offsetHeight : r, s = Ht(n) !== i || Ht(r) !== a;
  return s && (n = i, r = a), {
    width: n,
    height: r,
    $: s
  };
}
function to(e) {
  return he(e) ? e : e.contextElement;
}
function bt(e) {
  const t = to(e);
  if (!je(t))
    return De(1);
  const n = t.getBoundingClientRect(), {
    width: r,
    height: o,
    $: i
  } = Pa(t);
  let a = (i ? Ht(n.width) : n.width) / r, s = (i ? Ht(n.height) : n.height) / o;
  return (!a || !Number.isFinite(a)) && (a = 1), (!s || !Number.isFinite(s)) && (s = 1), {
    x: a,
    y: s
  };
}
const Yc = /* @__PURE__ */ De(0);
function Ca(e) {
  const t = we(e);
  return !eo() || !t.visualViewport ? Yc : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function Gc(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== we(e) ? !1 : t;
}
function dt(e, t, n, r) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const o = e.getBoundingClientRect(), i = to(e);
  let a = De(1);
  t && (r ? he(r) && (a = bt(r)) : a = bt(e));
  const s = Gc(i, n, r) ? Ca(i) : De(0);
  let l = (o.left + s.x) / a.x, c = (o.top + s.y) / a.y, u = o.width / a.x, d = o.height / a.y;
  if (i) {
    const p = we(i), f = r && he(r) ? we(r) : r;
    let m = p, g = xr(m);
    for (; g && r && f !== m; ) {
      const h = bt(g), b = g.getBoundingClientRect(), x = Ie(g), y = b.left + (g.clientLeft + parseFloat(x.paddingLeft)) * h.x, E = b.top + (g.clientTop + parseFloat(x.paddingTop)) * h.y;
      l *= h.x, c *= h.y, u *= h.x, d *= h.y, l += y, c += E, m = we(g), g = xr(m);
    }
  }
  return gn({
    width: u,
    height: d,
    x: l,
    y: c
  });
}
function no(e, t) {
  const n = Sn(e).scrollLeft;
  return t ? t.left + n : dt(He(e)).left + n;
}
function $a(e, t, n) {
  n === void 0 && (n = !1);
  const r = e.getBoundingClientRect(), o = r.left + t.scrollLeft - (n ? 0 : (
    // RTL <body> scrollbar.
    no(e, r)
  )), i = r.top + t.scrollTop;
  return {
    x: o,
    y: i
  };
}
function qc(e) {
  let {
    elements: t,
    rect: n,
    offsetParent: r,
    strategy: o
  } = e;
  const i = o === "fixed", a = He(r), s = t ? On(t.floating) : !1;
  if (r === a || s && i)
    return n;
  let l = {
    scrollLeft: 0,
    scrollTop: 0
  }, c = De(1);
  const u = De(0), d = je(r);
  if ((d || !d && !i) && ((Tt(r) !== "body" || Gt(a)) && (l = Sn(r)), je(r))) {
    const f = dt(r);
    c = bt(r), u.x = f.x + r.clientLeft, u.y = f.y + r.clientTop;
  }
  const p = a && !d && !i ? $a(a, l, !0) : De(0);
  return {
    width: n.width * c.x,
    height: n.height * c.y,
    x: n.x * c.x - l.scrollLeft * c.x + u.x + p.x,
    y: n.y * c.y - l.scrollTop * c.y + u.y + p.y
  };
}
function Kc(e) {
  return Array.from(e.getClientRects());
}
function Xc(e) {
  const t = He(e), n = Sn(e), r = e.ownerDocument.body, o = ge(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth), i = ge(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let a = -n.scrollLeft + no(e);
  const s = -n.scrollTop;
  return Ie(r).direction === "rtl" && (a += ge(t.clientWidth, r.clientWidth) - o), {
    width: o,
    height: i,
    x: a,
    y: s
  };
}
function Qc(e, t) {
  const n = we(e), r = He(e), o = n.visualViewport;
  let i = r.clientWidth, a = r.clientHeight, s = 0, l = 0;
  if (o) {
    i = o.width, a = o.height;
    const c = eo();
    (!c || c && t === "fixed") && (s = o.offsetLeft, l = o.offsetTop);
  }
  return {
    width: i,
    height: a,
    x: s,
    y: l
  };
}
function Jc(e, t) {
  const n = dt(e, !0, t === "fixed"), r = n.top + e.clientTop, o = n.left + e.clientLeft, i = je(e) ? bt(e) : De(1), a = e.clientWidth * i.x, s = e.clientHeight * i.y, l = o * i.x, c = r * i.y;
  return {
    width: a,
    height: s,
    x: l,
    y: c
  };
}
function Fo(e, t, n) {
  let r;
  if (t === "viewport")
    r = Qc(e, n);
  else if (t === "document")
    r = Xc(He(e));
  else if (he(t))
    r = Jc(t, n);
  else {
    const o = Ca(e);
    r = {
      x: t.x - o.x,
      y: t.y - o.y,
      width: t.width,
      height: t.height
    };
  }
  return gn(r);
}
function Ra(e, t) {
  const n = Je(e);
  return n === t || !he(n) || wt(n) ? !1 : Ie(n).position === "fixed" || Ra(n, t);
}
function Zc(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let r = zt(e, [], !1).filter((s) => he(s) && Tt(s) !== "body"), o = null;
  const i = Ie(e).position === "fixed";
  let a = i ? Je(e) : e;
  for (; he(a) && !wt(a); ) {
    const s = Ie(a), l = Zr(a);
    !l && s.position === "fixed" && (o = null), (i ? !l && !o : !l && s.position === "static" && !!o && ["absolute", "fixed"].includes(o.position) || Gt(a) && !l && Ra(e, a)) ? r = r.filter((u) => u !== a) : o = s, a = Je(a);
  }
  return t.set(e, r), r;
}
function eu(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: r,
    strategy: o
  } = e;
  const a = [...n === "clippingAncestors" ? On(t) ? [] : Zc(t, this._c) : [].concat(n), r], s = a[0], l = a.reduce((c, u) => {
    const d = Fo(t, u, o);
    return c.top = ge(d.top, c.top), c.right = ut(d.right, c.right), c.bottom = ut(d.bottom, c.bottom), c.left = ge(d.left, c.left), c;
  }, Fo(t, s, o));
  return {
    width: l.right - l.left,
    height: l.bottom - l.top,
    x: l.left,
    y: l.top
  };
}
function tu(e) {
  const {
    width: t,
    height: n
  } = Pa(e);
  return {
    width: t,
    height: n
  };
}
function nu(e, t, n) {
  const r = je(t), o = He(t), i = n === "fixed", a = dt(e, !0, i, t);
  let s = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const l = De(0);
  if (r || !r && !i)
    if ((Tt(t) !== "body" || Gt(o)) && (s = Sn(t)), r) {
      const p = dt(t, !0, i, t);
      l.x = p.x + t.clientLeft, l.y = p.y + t.clientTop;
    } else o && (l.x = no(o));
  const c = o && !r && !i ? $a(o, s) : De(0), u = a.left + s.scrollLeft - l.x - c.x, d = a.top + s.scrollTop - l.y - c.y;
  return {
    x: u,
    y: d,
    width: a.width,
    height: a.height
  };
}
function jn(e) {
  return Ie(e).position === "static";
}
function _o(e, t) {
  if (!je(e) || Ie(e).position === "fixed")
    return null;
  if (t)
    return t(e);
  let n = e.offsetParent;
  return He(e) === n && (n = n.ownerDocument.body), n;
}
function ka(e, t) {
  const n = we(e);
  if (On(e))
    return n;
  if (!je(e)) {
    let o = Je(e);
    for (; o && !wt(o); ) {
      if (he(o) && !jn(o))
        return o;
      o = Je(o);
    }
    return n;
  }
  let r = _o(e, t);
  for (; r && $c(r) && jn(r); )
    r = _o(r, t);
  return r && wt(r) && jn(r) && !Zr(r) ? n : r || Rc(e) || n;
}
const ru = async function(e) {
  const t = this.getOffsetParent || ka, n = this.getDimensions, r = await n(e.floating);
  return {
    reference: nu(e.reference, await t(e.floating), e.strategy),
    floating: {
      x: 0,
      y: 0,
      width: r.width,
      height: r.height
    }
  };
};
function ou(e) {
  return Ie(e).direction === "rtl";
}
const iu = {
  convertOffsetParentRelativeRectToViewportRelativeRect: qc,
  getDocumentElement: He,
  getClippingRect: eu,
  getOffsetParent: ka,
  getElementRects: ru,
  getClientRects: Kc,
  getDimensions: tu,
  getScale: bt,
  isElement: he,
  isRTL: ou
};
function Ia(e, t) {
  return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function au(e, t) {
  let n = null, r;
  const o = He(e);
  function i() {
    var s;
    clearTimeout(r), (s = n) == null || s.disconnect(), n = null;
  }
  function a(s, l) {
    s === void 0 && (s = !1), l === void 0 && (l = 1), i();
    const c = e.getBoundingClientRect(), {
      left: u,
      top: d,
      width: p,
      height: f
    } = c;
    if (s || t(), !p || !f)
      return;
    const m = en(d), g = en(o.clientWidth - (u + p)), h = en(o.clientHeight - (d + f)), b = en(u), y = {
      rootMargin: -m + "px " + -g + "px " + -h + "px " + -b + "px",
      threshold: ge(0, ut(1, l)) || 1
    };
    let E = !0;
    function v(C) {
      const $ = C[0].intersectionRatio;
      if ($ !== l) {
        if (!E)
          return a();
        $ ? a(!1, $) : r = setTimeout(() => {
          a(!1, 1e-7);
        }, 1e3);
      }
      $ === 1 && !Ia(c, e.getBoundingClientRect()) && a(), E = !1;
    }
    try {
      n = new IntersectionObserver(v, {
        ...y,
        // Handle <iframe>s
        root: o.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(v, y);
    }
    n.observe(e);
  }
  return a(!0), i;
}
function su(e, t, n, r) {
  r === void 0 && (r = {});
  const {
    ancestorScroll: o = !0,
    ancestorResize: i = !0,
    elementResize: a = typeof ResizeObserver == "function",
    layoutShift: s = typeof IntersectionObserver == "function",
    animationFrame: l = !1
  } = r, c = to(e), u = o || i ? [...c ? zt(c) : [], ...zt(t)] : [];
  u.forEach((b) => {
    o && b.addEventListener("scroll", n, {
      passive: !0
    }), i && b.addEventListener("resize", n);
  });
  const d = c && s ? au(c, n) : null;
  let p = -1, f = null;
  a && (f = new ResizeObserver((b) => {
    let [x] = b;
    x && x.target === c && f && (f.unobserve(t), cancelAnimationFrame(p), p = requestAnimationFrame(() => {
      var y;
      (y = f) == null || y.observe(t);
    })), n();
  }), c && !l && f.observe(c), f.observe(t));
  let m, g = l ? dt(e) : null;
  l && h();
  function h() {
    const b = dt(e);
    g && !Ia(g, b) && n(), g = b, m = requestAnimationFrame(h);
  }
  return n(), () => {
    var b;
    u.forEach((x) => {
      o && x.removeEventListener("scroll", n), i && x.removeEventListener("resize", n);
    }), d == null || d(), (b = f) == null || b.disconnect(), f = null, l && cancelAnimationFrame(m);
  };
}
const zn = Tn, lu = Bc, cu = Uc, uu = Hc, fu = Vc, du = (e, t, n) => {
  const r = /* @__PURE__ */ new Map(), o = {
    platform: iu,
    ...n
  }, i = {
    ...o.platform,
    _c: r
  };
  return zc(e, t, {
    ...o,
    platform: i
  });
};
var sn = typeof document < "u" ? Vr : fe;
function hn(e, t) {
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
        if (!hn(e[r], t[r]))
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
      if (!(i === "_owner" && e.$$typeof) && !hn(e[i], t[i]))
        return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function La(e) {
  return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function No(e, t) {
  const n = La(e);
  return Math.round(t * n) / n;
}
function Hn(e) {
  const t = I.useRef(e);
  return sn(() => {
    t.current = e;
  }), t;
}
function pu(e) {
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
    open: c
  } = e, [u, d] = I.useState({
    x: 0,
    y: 0,
    strategy: n,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [p, f] = I.useState(r);
  hn(p, r) || f(r);
  const [m, g] = I.useState(null), [h, b] = I.useState(null), x = I.useCallback((N) => {
    N !== C.current && (C.current = N, g(N));
  }, []), y = I.useCallback((N) => {
    N !== $.current && ($.current = N, b(N));
  }, []), E = i || m, v = a || h, C = I.useRef(null), $ = I.useRef(null), G = I.useRef(u), J = l != null, P = Hn(l), _ = Hn(o), L = Hn(c), K = I.useCallback(() => {
    if (!C.current || !$.current)
      return;
    const N = {
      placement: t,
      strategy: n,
      middleware: p
    };
    _.current && (N.platform = _.current), du(C.current, $.current, N).then((B) => {
      const w = {
        ...B,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: L.current !== !1
      };
      R.current && !hn(G.current, w) && (G.current = w, un.flushSync(() => {
        d(w);
      }));
    });
  }, [p, t, n, _, L]);
  sn(() => {
    c === !1 && G.current.isPositioned && (G.current.isPositioned = !1, d((N) => ({
      ...N,
      isPositioned: !1
    })));
  }, [c]);
  const R = I.useRef(!1);
  sn(() => (R.current = !0, () => {
    R.current = !1;
  }), []), sn(() => {
    if (E && (C.current = E), v && ($.current = v), E && v) {
      if (P.current)
        return P.current(E, v, K);
      K();
    }
  }, [E, v, K, P, J]);
  const re = I.useMemo(() => ({
    reference: C,
    floating: $,
    setReference: x,
    setFloating: y
  }), [x, y]), Y = I.useMemo(() => ({
    reference: E,
    floating: v
  }), [E, v]), ee = I.useMemo(() => {
    const N = {
      position: n,
      left: 0,
      top: 0
    };
    if (!Y.floating)
      return N;
    const B = No(Y.floating, u.x), w = No(Y.floating, u.y);
    return s ? {
      ...N,
      transform: "translate(" + B + "px, " + w + "px)",
      ...La(Y.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: n,
      left: B,
      top: w
    };
  }, [n, s, Y.floating, u.x, u.y]);
  return I.useMemo(() => ({
    ...u,
    update: K,
    refs: re,
    elements: Y,
    floatingStyles: ee
  }), [u, K, re, Y, ee]);
}
const Ma = (e, t) => ({
  ...lu(e),
  options: [e, t]
}), mu = (e, t) => ({
  ...cu(e),
  options: [e, t]
}), gu = (e, t) => ({
  ...uu(e),
  options: [e, t]
}), hu = (e, t) => ({
  ...fu(e),
  options: [e, t]
}), Fa = {
  ...I
}, vu = Fa.useInsertionEffect, bu = vu || ((e) => e());
function _a(e) {
  const t = I.useRef(() => {
    if (process.env.NODE_ENV !== "production")
      throw new Error("Cannot call an event handler while rendering.");
  });
  return bu(() => {
    t.current = e;
  }), I.useCallback(function() {
    for (var n = arguments.length, r = new Array(n), o = 0; o < n; o++)
      r[o] = arguments[o];
    return t.current == null ? void 0 : t.current(...r);
  }, []);
}
var Er = typeof document < "u" ? Vr : fe;
let Do = !1, yu = 0;
const jo = () => (
  // Ensure the id is unique with multiple independent versions of Floating UI
  // on <React 18
  "floating-ui-" + Math.random().toString(36).slice(2, 6) + yu++
);
function xu() {
  const [e, t] = I.useState(() => Do ? jo() : void 0);
  return Er(() => {
    e == null && t(jo());
  }, []), I.useEffect(() => {
    Do = !0;
  }, []), e;
}
const wu = Fa.useId, Eu = wu || xu;
let Wt;
process.env.NODE_ENV !== "production" && (Wt = /* @__PURE__ */ new Set());
function Ou() {
  for (var e, t = arguments.length, n = new Array(t), r = 0; r < t; r++)
    n[r] = arguments[r];
  const o = "Floating UI: " + n.join(" ");
  if (!((e = Wt) != null && e.has(o))) {
    var i;
    (i = Wt) == null || i.add(o), console.warn(o);
  }
}
function Su() {
  for (var e, t = arguments.length, n = new Array(t), r = 0; r < t; r++)
    n[r] = arguments[r];
  const o = "Floating UI: " + n.join(" ");
  if (!((e = Wt) != null && e.has(o))) {
    var i;
    (i = Wt) == null || i.add(o), console.error(o);
  }
}
function Tu() {
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
const Au = /* @__PURE__ */ I.createContext(null), Pu = /* @__PURE__ */ I.createContext(null), Cu = () => {
  var e;
  return ((e = I.useContext(Au)) == null ? void 0 : e.id) || null;
}, $u = () => I.useContext(Pu), Ru = "data-floating-ui-focusable";
function ku(e) {
  const {
    open: t = !1,
    onOpenChange: n,
    elements: r
  } = e, o = Eu(), i = I.useRef({}), [a] = I.useState(() => Tu()), s = Cu() != null;
  if (process.env.NODE_ENV !== "production") {
    const f = r.reference;
    f && !he(f) && Su("Cannot pass a virtual element to the `elements.reference` option,", "as it must be a real DOM element. Use `refs.setPositionReference()`", "instead.");
  }
  const [l, c] = I.useState(r.reference), u = _a((f, m, g) => {
    i.current.openEvent = f ? m : void 0, a.emit("openchange", {
      open: f,
      event: m,
      reason: g,
      nested: s
    }), n == null || n(f, m, g);
  }), d = I.useMemo(() => ({
    setPositionReference: c
  }), []), p = I.useMemo(() => ({
    reference: l || r.reference || null,
    floating: r.floating || null,
    domReference: r.reference
  }), [l, r.reference, r.floating]);
  return I.useMemo(() => ({
    dataRef: i,
    open: t,
    onOpenChange: u,
    elements: p,
    events: a,
    floatingId: o,
    refs: d
  }), [t, u, p, a, o, d]);
}
function Iu(e) {
  e === void 0 && (e = {});
  const {
    nodeId: t
  } = e, n = ku({
    ...e,
    elements: {
      reference: null,
      floating: null,
      ...e.elements
    }
  }), r = e.rootContext || n, o = r.elements, [i, a] = I.useState(null), [s, l] = I.useState(null), u = (o == null ? void 0 : o.domReference) || i, d = I.useRef(null), p = $u();
  Er(() => {
    u && (d.current = u);
  }, [u]);
  const f = pu({
    ...e,
    elements: {
      ...o,
      ...s && {
        reference: s
      }
    }
  }), m = I.useCallback((y) => {
    const E = he(y) ? {
      getBoundingClientRect: () => y.getBoundingClientRect(),
      contextElement: y
    } : y;
    l(E), f.refs.setReference(E);
  }, [f.refs]), g = I.useCallback((y) => {
    (he(y) || y === null) && (d.current = y, a(y)), (he(f.refs.reference.current) || f.refs.reference.current === null || // Don't allow setting virtual elements using the old technique back to
    // `null` to support `positionReference` + an unstable `reference`
    // callback ref.
    y !== null && !he(y)) && f.refs.setReference(y);
  }, [f.refs]), h = I.useMemo(() => ({
    ...f.refs,
    setReference: g,
    setPositionReference: m,
    domReference: d
  }), [f.refs, g, m]), b = I.useMemo(() => ({
    ...f.elements,
    domReference: u
  }), [f.elements, u]), x = I.useMemo(() => ({
    ...f,
    ...r,
    refs: h,
    elements: b,
    nodeId: t
  }), [f, h, b, t, r]);
  return Er(() => {
    r.dataRef.current.floatingContext = x;
    const y = p == null ? void 0 : p.nodesRef.current.find((E) => E.id === t);
    y && (y.context = x);
  }), I.useMemo(() => ({
    ...f,
    context: x,
    refs: h,
    elements: b
  }), [f, h, b, x]);
}
const zo = "active", Ho = "selected";
function Wn(e, t, n) {
  const r = /* @__PURE__ */ new Map(), o = n === "item";
  let i = e;
  if (o && e) {
    const {
      [zo]: a,
      [Ho]: s,
      ...l
    } = e;
    i = l;
  }
  return {
    ...n === "floating" && {
      tabIndex: -1,
      [Ru]: ""
    },
    ...i,
    ...t.map((a) => {
      const s = a ? a[n] : null;
      return typeof s == "function" ? e ? s(e) : null : s;
    }).concat(e).reduce((a, s) => (s && Object.entries(s).forEach((l) => {
      let [c, u] = l;
      if (!(o && [zo, Ho].includes(c)))
        if (c.indexOf("on") === 0) {
          if (r.has(c) || r.set(c, []), typeof u == "function") {
            var d;
            (d = r.get(c)) == null || d.push(u), a[c] = function() {
              for (var p, f = arguments.length, m = new Array(f), g = 0; g < f; g++)
                m[g] = arguments[g];
              return (p = r.get(c)) == null ? void 0 : p.map((h) => h(...m)).find((h) => h !== void 0);
            };
          }
        } else
          a[c] = u;
    }), a), {})
  };
}
function Lu(e) {
  e === void 0 && (e = []);
  const t = e.map((s) => s == null ? void 0 : s.reference), n = e.map((s) => s == null ? void 0 : s.floating), r = e.map((s) => s == null ? void 0 : s.item), o = I.useCallback(
    (s) => Wn(s, e, "reference"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    t
  ), i = I.useCallback(
    (s) => Wn(s, e, "floating"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    n
  ), a = I.useCallback(
    (s) => Wn(s, e, "item"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    r
  );
  return I.useMemo(() => ({
    getReferenceProps: o,
    getFloatingProps: i,
    getItemProps: a
  }), [o, i, a]);
}
function Wo(e, t) {
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
const Mu = (e) => ({
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
      scrollRef: c,
      ...u
    } = At(e, t), {
      rects: d,
      elements: {
        floating: p
      }
    } = t, f = n.current[a], m = (c == null ? void 0 : c.current) || p, g = p.clientTop || m.clientTop, h = p.clientTop !== 0, b = m.clientTop !== 0, x = p === m;
    if (process.env.NODE_ENV !== "production" && (t.placement.startsWith("bottom") || Ou('`placement` side must be "bottom" when using the `inner`', "middleware.")), !f)
      return {};
    const y = {
      ...t,
      ...await Ma(-f.offsetTop - p.clientTop - d.reference.height / 2 - f.offsetHeight / 2 - i).fn(t)
    }, E = await zn(Wo(y, m.scrollHeight + g + p.clientTop), u), v = await zn(y, {
      ...u,
      elementContext: "reference"
    }), C = ge(0, E.top), $ = y.y + C, P = (m.scrollHeight > m.clientHeight ? (_) => _ : Ht)(ge(0, m.scrollHeight + (h && x || b ? g * 2 : 0) - C - ge(0, E.bottom)));
    if (m.style.maxHeight = P + "px", m.scrollTop = C, o) {
      const _ = m.offsetHeight < f.offsetHeight * ut(s, n.current.length) - 1 || v.top >= -l || v.bottom >= -l;
      un.flushSync(() => o(_));
    }
    return r && (r.current = await zn(Wo({
      ...y,
      y: $
    }, m.offsetHeight + g + p.clientTop), u)), {
      y: $
    };
  }
});
function Fu(e, t) {
  const {
    open: n,
    elements: r
  } = e, {
    enabled: o = !0,
    overflowRef: i,
    scrollRef: a,
    onChange: s
  } = t, l = _a(s), c = I.useRef(!1), u = I.useRef(null), d = I.useRef(null);
  I.useEffect(() => {
    if (!o) return;
    function f(g) {
      if (g.ctrlKey || !m || i.current == null)
        return;
      const h = g.deltaY, b = i.current.top >= -0.5, x = i.current.bottom >= -0.5, y = m.scrollHeight - m.clientHeight, E = h < 0 ? -1 : 1, v = h < 0 ? "max" : "min";
      m.scrollHeight <= m.clientHeight || (!b && h > 0 || !x && h < 0 ? (g.preventDefault(), un.flushSync(() => {
        l((C) => C + Math[v](h, y * E));
      })) : /firefox/i.test(kc()) && (m.scrollTop += h));
    }
    const m = (a == null ? void 0 : a.current) || r.floating;
    if (n && m)
      return m.addEventListener("wheel", f), requestAnimationFrame(() => {
        u.current = m.scrollTop, i.current != null && (d.current = {
          ...i.current
        });
      }), () => {
        u.current = null, d.current = null, m.removeEventListener("wheel", f);
      };
  }, [o, n, r.floating, i, a, l]);
  const p = I.useMemo(() => ({
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
      const f = (a == null ? void 0 : a.current) || r.floating;
      if (!(!i.current || !f || !c.current)) {
        if (u.current !== null) {
          const m = f.scrollTop - u.current;
          (i.current.bottom < -0.5 && m < -1 || i.current.top < -0.5 && m > 1) && un.flushSync(() => l((g) => g + m));
        }
        requestAnimationFrame(() => {
          u.current = f.scrollTop;
        });
      }
    }
  }), [r.floating, l, i, a]);
  return I.useMemo(() => o ? {
    floating: p
  } : {}, [o, p]);
}
let Pt = be({ styles: void 0, setReference: () => {
}, setFloating: () => {
}, getReferenceProps: () => ({}), getFloatingProps: () => ({}), slot: {} });
Pt.displayName = "FloatingContext";
let ro = be(null);
ro.displayName = "PlacementContext";
function _u(e) {
  return ce(() => e ? typeof e == "string" ? { to: e } : e : null, [e]);
}
function Nu() {
  return ue(Pt).setReference;
}
function Du() {
  return ue(Pt).getReferenceProps;
}
function ju() {
  let { getFloatingProps: e, slot: t } = ue(Pt);
  return ae((...n) => Object.assign({}, e(...n), { "data-anchor": t.anchor }), [e, t]);
}
function zu(e = null) {
  e === !1 && (e = null), typeof e == "string" && (e = { to: e });
  let t = ue(ro), n = ce(() => e, [JSON.stringify(e, (o, i) => {
    var a;
    return (a = i == null ? void 0 : i.outerHTML) != null ? a : i;
  })]);
  se(() => {
    t == null || t(n ?? null);
  }, [t, n]);
  let r = ue(Pt);
  return ce(() => [r.setFloating, e ? r.styles : {}], [r.setFloating, e, r.styles]);
}
let Bo = 4;
function Hu({ children: e, enabled: t = !0 }) {
  let [n, r] = le(null), [o, i] = le(0), a = Q(null), [s, l] = le(null);
  Wu(s);
  let c = t && n !== null && s !== null, { to: u = "bottom", gap: d = 0, offset: p = 0, padding: f = 0, inner: m } = Bu(n, s), [g, h = "center"] = u.split(" ");
  se(() => {
    c && i(0);
  }, [c]);
  let { refs: b, floatingStyles: x, context: y } = Iu({ open: c, placement: g === "selection" ? h === "center" ? "bottom" : `bottom-${h}` : h === "center" ? `${g}` : `${g}-${h}`, strategy: "absolute", transform: !1, middleware: [Ma({ mainAxis: g === "selection" ? 0 : d, crossAxis: p }), mu({ padding: f }), g !== "selection" && gu({ padding: f }), g === "selection" && m ? Mu({ ...m, padding: f, overflowRef: a, offset: o, minItemsVisible: Bo, referenceOverflowThreshold: f, onFallbackChange(_) {
    var L, K;
    if (!_) return;
    let R = y.elements.floating;
    if (!R) return;
    let re = parseFloat(getComputedStyle(R).scrollPaddingBottom) || 0, Y = Math.min(Bo, R.childElementCount), ee = 0, N = 0;
    for (let B of (K = (L = y.elements.floating) == null ? void 0 : L.childNodes) != null ? K : []) if (B instanceof HTMLElement) {
      let w = B.offsetTop, S = w + B.clientHeight + re, j = R.scrollTop, M = j + R.clientHeight;
      if (w >= j && S <= M) Y--;
      else {
        N = Math.max(0, Math.min(S, M) - Math.max(w, j)), ee = B.clientHeight;
        break;
      }
    }
    Y >= 1 && i((B) => {
      let w = ee * Y - N + re;
      return B >= w ? B : w;
    });
  } }) : null, hu({ padding: f, apply({ availableWidth: _, availableHeight: L, elements: K }) {
    Object.assign(K.floating.style, { overflow: "auto", maxWidth: `${_}px`, maxHeight: `min(var(--anchor-max-height, 100vh), ${L}px)` });
  } })].filter(Boolean), whileElementsMounted: su }), [E = g, v = h] = y.placement.split("-");
  g === "selection" && (E = "selection");
  let C = ce(() => ({ anchor: [E, v].filter(Boolean).join(" ") }), [E, v]), $ = Fu(y, { overflowRef: a, onChange: i }), { getReferenceProps: G, getFloatingProps: J } = Lu([$]), P = Z((_) => {
    l(_), b.setFloating(_);
  });
  return I.createElement(ro.Provider, { value: r }, I.createElement(Pt.Provider, { value: { setFloating: P, setReference: b.setReference, styles: x, getReferenceProps: G, getFloatingProps: J, slot: C } }, e));
}
function Wu(e) {
  se(() => {
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
function Bu(e, t) {
  var n, r, o;
  let i = Bn((n = e == null ? void 0 : e.gap) != null ? n : "var(--anchor-gap, 0)", t), a = Bn((r = e == null ? void 0 : e.offset) != null ? r : "var(--anchor-offset, 0)", t), s = Bn((o = e == null ? void 0 : e.padding) != null ? o : "var(--anchor-padding, 0)", t);
  return { ...e, gap: i, offset: a, padding: s };
}
function Bn(e, t, n = void 0) {
  let r = St(), o = Z((l, c) => {
    if (l == null) return [n, null];
    if (typeof l == "number") return [l, null];
    if (typeof l == "string") {
      if (!c) return [n, null];
      let u = Uo(l, c);
      return [u, (d) => {
        let p = Na(l);
        {
          let f = p.map((m) => window.getComputedStyle(c).getPropertyValue(m));
          r.requestAnimationFrame(function m() {
            r.nextFrame(m);
            let g = !1;
            for (let [b, x] of p.entries()) {
              let y = window.getComputedStyle(c).getPropertyValue(x);
              if (f[b] !== y) {
                f[b] = y, g = !0;
                break;
              }
            }
            if (!g) return;
            let h = Uo(l, c);
            u !== h && (d(h), u = h);
          });
        }
        return r.dispose;
      }];
    }
    return [n, null];
  }), i = ce(() => o(e, t)[0], [e, t]), [a = i, s] = le();
  return se(() => {
    let [l, c] = o(e, t);
    if (s(l), !!c) return c(s);
  }, [e, t]), a;
}
function Na(e) {
  let t = /var\((.*)\)/.exec(e);
  if (t) {
    let n = t[1].indexOf(",");
    if (n === -1) return [t[1]];
    let r = t[1].slice(0, n).trim(), o = t[1].slice(n + 1).trim();
    return o ? [r, ...Na(o)] : [r];
  }
  return [];
}
function Uo(e, t) {
  let n = document.createElement("div");
  t.appendChild(n), n.style.setProperty("margin-top", "0px", "important"), n.style.setProperty("margin-top", e, "important");
  let r = parseFloat(window.getComputedStyle(n).marginTop) || 0;
  return t.removeChild(n), r;
}
function Uu(e, t) {
  let [n, r] = le(t);
  return !e && n !== t && r(t), e ? n : t;
}
let oo = be(null);
oo.displayName = "OpenClosedContext";
var Ce = ((e) => (e[e.Open = 1] = "Open", e[e.Closed = 2] = "Closed", e[e.Closing = 4] = "Closing", e[e.Opening = 8] = "Opening", e))(Ce || {});
function io() {
  return ue(oo);
}
function Da({ value: e, children: t }) {
  return V.createElement(oo.Provider, { value: e }, t);
}
function Vu(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var tn = { exports: {} }, Un = {};
/**
 * @license React
 * use-sync-external-store-with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Vo;
function Yu() {
  if (Vo) return Un;
  Vo = 1;
  var e = V;
  function t(l, c) {
    return l === c && (l !== 0 || 1 / l === 1 / c) || l !== l && c !== c;
  }
  var n = typeof Object.is == "function" ? Object.is : t, r = e.useSyncExternalStore, o = e.useRef, i = e.useEffect, a = e.useMemo, s = e.useDebugValue;
  return Un.useSyncExternalStoreWithSelector = function(l, c, u, d, p) {
    var f = o(null);
    if (f.current === null) {
      var m = { hasValue: !1, value: null };
      f.current = m;
    } else m = f.current;
    f = a(
      function() {
        function h(v) {
          if (!b) {
            if (b = !0, x = v, v = d(v), p !== void 0 && m.hasValue) {
              var C = m.value;
              if (p(C, v))
                return y = C;
            }
            return y = v;
          }
          if (C = y, n(x, v)) return C;
          var $ = d(v);
          return p !== void 0 && p(C, $) ? (x = v, C) : (x = v, y = $);
        }
        var b = !1, x, y, E = u === void 0 ? null : u;
        return [
          function() {
            return h(c());
          },
          E === null ? void 0 : function() {
            return h(E());
          }
        ];
      },
      [c, u, d, p]
    );
    var g = r(l, f[0], f[1]);
    return i(
      function() {
        m.hasValue = !0, m.value = g;
      },
      [g]
    ), s(g), g;
  }, Un;
}
var Vn = {};
/**
 * @license React
 * use-sync-external-store-with-selector.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Yo;
function Gu() {
  return Yo || (Yo = 1, process.env.NODE_ENV !== "production" && function() {
    function e(l, c) {
      return l === c && (l !== 0 || 1 / l === 1 / c) || l !== l && c !== c;
    }
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
    var t = V, n = typeof Object.is == "function" ? Object.is : e, r = t.useSyncExternalStore, o = t.useRef, i = t.useEffect, a = t.useMemo, s = t.useDebugValue;
    Vn.useSyncExternalStoreWithSelector = function(l, c, u, d, p) {
      var f = o(null);
      if (f.current === null) {
        var m = { hasValue: !1, value: null };
        f.current = m;
      } else m = f.current;
      f = a(
        function() {
          function h(v) {
            if (!b) {
              if (b = !0, x = v, v = d(v), p !== void 0 && m.hasValue) {
                var C = m.value;
                if (p(C, v))
                  return y = C;
              }
              return y = v;
            }
            if (C = y, n(x, v))
              return C;
            var $ = d(v);
            return p !== void 0 && p(C, $) ? (x = v, C) : (x = v, y = $);
          }
          var b = !1, x, y, E = u === void 0 ? null : u;
          return [
            function() {
              return h(c());
            },
            E === null ? void 0 : function() {
              return h(E());
            }
          ];
        },
        [c, u, d, p]
      );
      var g = r(l, f[0], f[1]);
      return i(
        function() {
          m.hasValue = !0, m.value = g;
        },
        [g]
      ), s(g), g;
    }, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
  }()), Vn;
}
var Go;
function qu() {
  return Go || (Go = 1, process.env.NODE_ENV === "production" ? tn.exports = Yu() : tn.exports = Gu()), tn.exports;
}
var Ku = qu(), ja = (e, t, n) => {
  if (!t.has(e)) throw TypeError("Cannot " + n);
}, Pe = (e, t, n) => (ja(e, t, "read from private field"), n ? n.call(e) : t.get(e)), Yn = (e, t, n) => {
  if (t.has(e)) throw TypeError("Cannot add the same private member more than once");
  t instanceof WeakSet ? t.add(e) : t.set(e, n);
}, qo = (e, t, n, r) => (ja(e, t, "write to private field"), t.set(e, n), n), Be, Lt, Mt;
let Xu = class {
  constructor(t) {
    Yn(this, Be, {}), Yn(this, Lt, new pa(() => /* @__PURE__ */ new Set())), Yn(this, Mt, /* @__PURE__ */ new Set()), qo(this, Be, t);
  }
  get state() {
    return Pe(this, Be);
  }
  subscribe(t, n) {
    let r = { selector: t, callback: n, current: t(Pe(this, Be)) };
    return Pe(this, Mt).add(r), () => {
      Pe(this, Mt).delete(r);
    };
  }
  on(t, n) {
    return Pe(this, Lt).get(t).add(n), () => {
      Pe(this, Lt).get(t).delete(n);
    };
  }
  send(t) {
    qo(this, Be, this.reduce(Pe(this, Be), t));
    for (let n of Pe(this, Mt)) {
      let r = n.selector(Pe(this, Be));
      za(n.current, r) || (n.current = r, n.callback(r));
    }
    for (let n of Pe(this, Lt).get(t.type)) n(Pe(this, Be), t);
  }
};
Be = /* @__PURE__ */ new WeakMap(), Lt = /* @__PURE__ */ new WeakMap(), Mt = /* @__PURE__ */ new WeakMap();
function za(e, t) {
  return Object.is(e, t) ? !0 : typeof e != "object" || e === null || typeof t != "object" || t === null ? !1 : Array.isArray(e) && Array.isArray(t) ? e.length !== t.length ? !1 : Gn(e[Symbol.iterator](), t[Symbol.iterator]()) : e instanceof Map && t instanceof Map || e instanceof Set && t instanceof Set ? e.size !== t.size ? !1 : Gn(e.entries(), t.entries()) : Ko(e) && Ko(t) ? Gn(Object.entries(e)[Symbol.iterator](), Object.entries(t)[Symbol.iterator]()) : !1;
}
function Gn(e, t) {
  do {
    let n = e.next(), r = t.next();
    if (n.done && r.done) return !0;
    if (n.done || r.done || !Object.is(n.value, r.value)) return !1;
  } while (!0);
}
function Ko(e) {
  if (Object.prototype.toString.call(e) !== "[object Object]") return !1;
  let t = Object.getPrototypeOf(e);
  return t === null || Object.getPrototypeOf(t) === null;
}
function qn(e) {
  let [t, n] = e(), r = ze();
  return (...o) => {
    t(...o), r.dispose(), r.microTask(n);
  };
}
function $e(e, t, n = za) {
  return Ku.useSyncExternalStoreWithSelector(Z((r) => e.subscribe(Qu, r)), Z(() => e.state), Z(() => e.state), Z(t), n);
}
function Qu(e) {
  return e;
}
function Ju(e) {
  throw new Error("Unexpected object: " + e);
}
var me = ((e) => (e[e.First = 0] = "First", e[e.Previous = 1] = "Previous", e[e.Next = 2] = "Next", e[e.Last = 3] = "Last", e[e.Specific = 4] = "Specific", e[e.Nothing = 5] = "Nothing", e))(me || {});
function Kn(e, t) {
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
      Ju(e);
  }
}
function Zu(e) {
  let t = Z(e), n = Q(!1);
  fe(() => (n.current = !1, () => {
    n.current = !0, ta(() => {
      n.current && t();
    });
  }), [t]);
}
function ef() {
  let e = typeof document > "u";
  return "useSyncExternalStore" in I ? ((t) => t.useSyncExternalStore)(I)(() => () => {
  }, () => !1, () => !e) : !1;
}
function ao() {
  let e = ef(), [t, n] = I.useState(lt.isHandoffComplete);
  return t && lt.isHandoffComplete === !1 && n(!1), I.useEffect(() => {
    t !== !0 && n(!0);
  }, [t]), I.useEffect(() => lt.handoff(), []), e ? !1 : t;
}
let tf = be(!1);
function nf() {
  return ue(tf);
}
function rf(e) {
  let t = nf(), n = ue(Wa), [r, o] = le(() => {
    var i;
    if (!t && n !== null) return (i = n.current) != null ? i : null;
    if (lt.isServer) return null;
    let a = e == null ? void 0 : e.getElementById("headlessui-portal-root");
    if (a) return a;
    if (e === null) return null;
    let s = e.createElement("div");
    return s.setAttribute("id", "headlessui-portal-root"), e.body.appendChild(s);
  });
  return fe(() => {
    r !== null && (e != null && e.body.contains(r) || e == null || e.body.appendChild(r));
  }, [r, e]), fe(() => {
    t || n !== null && o(n.current);
  }, [n, o, t]), r;
}
let Ha = Re, of = xe(function(e, t) {
  let { ownerDocument: n = null, ...r } = e, o = Q(null), i = Te(zl((f) => {
    o.current = f;
  }), t), a = yr(o), s = n ?? a, l = rf(s), [c] = le(() => {
    var f;
    return lt.isServer ? null : (f = s == null ? void 0 : s.createElement("div")) != null ? f : null;
  }), u = ue(cf), d = ao();
  se(() => {
    !l || !c || l.contains(c) || (c.setAttribute("data-headlessui-portal", ""), l.appendChild(c));
  }, [l, c]), se(() => {
    if (c && u) return u.register(c);
  }, [u, c]), Zu(() => {
    var f;
    !l || !c || (c instanceof Node && l.contains(c) && l.removeChild(c), l.childNodes.length <= 0 && ((f = l.parentElement) == null || f.removeChild(l)));
  });
  let p = Ee();
  return d ? !l || !c ? null : Wi(p({ ourProps: { ref: i }, theirProps: r, slot: {}, defaultTag: Ha, name: "Portal" }), c) : null;
});
function af(e, t) {
  let n = Te(t), { enabled: r = !0, ownerDocument: o, ...i } = e, a = Ee();
  return r ? V.createElement(of, { ...i, ownerDocument: o, ref: n }) : a({ ourProps: { ref: n }, theirProps: i, slot: {}, defaultTag: Ha, name: "Portal" });
}
let sf = Re, Wa = be(null);
function lf(e, t) {
  let { target: n, ...r } = e, o = { ref: Te(t) }, i = Ee();
  return V.createElement(Wa.Provider, { value: n }, i({ ourProps: o, theirProps: r, defaultTag: sf, name: "Popover.Group" }));
}
let cf = be(null), uf = xe(af), ff = xe(lf), df = Object.assign(uf, { Group: ff });
function pf() {
  let e = Q(!1);
  return se(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
}
function Ba(e) {
  var t;
  return !!(e.enter || e.enterFrom || e.enterTo || e.leave || e.leaveFrom || e.leaveTo) || ((t = e.as) != null ? t : Va) !== Re || V.Children.count(e.children) === 1;
}
let An = be(null);
An.displayName = "TransitionContext";
var mf = ((e) => (e.Visible = "visible", e.Hidden = "hidden", e))(mf || {});
function gf() {
  let e = ue(An);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
function hf() {
  let e = ue(Pn);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
let Pn = be(null);
Pn.displayName = "NestingContext";
function Cn(e) {
  return "children" in e ? Cn(e.children) : e.current.filter(({ el: t }) => t.current !== null).filter(({ state: t }) => t === "visible").length > 0;
}
function Ua(e, t) {
  let n = gt(e), r = Q([]), o = pf(), i = St(), a = Z((f, m = Qe.Hidden) => {
    let g = r.current.findIndex(({ el: h }) => h === f);
    g !== -1 && (ke(m, { [Qe.Unmount]() {
      r.current.splice(g, 1);
    }, [Qe.Hidden]() {
      r.current[g].state = "hidden";
    } }), i.microTask(() => {
      var h;
      !Cn(r) && o.current && ((h = n.current) == null || h.call(n));
    }));
  }), s = Z((f) => {
    let m = r.current.find(({ el: g }) => g === f);
    return m ? m.state !== "visible" && (m.state = "visible") : r.current.push({ el: f, state: "visible" }), () => a(f, Qe.Unmount);
  }), l = Q([]), c = Q(Promise.resolve()), u = Q({ enter: [], leave: [] }), d = Z((f, m, g) => {
    l.current.splice(0), t && (t.chains.current[m] = t.chains.current[m].filter(([h]) => h !== f)), t == null || t.chains.current[m].push([f, new Promise((h) => {
      l.current.push(h);
    })]), t == null || t.chains.current[m].push([f, new Promise((h) => {
      Promise.all(u.current[m].map(([b, x]) => x)).then(() => h());
    })]), m === "enter" ? c.current = c.current.then(() => t == null ? void 0 : t.wait.current).then(() => g(m)) : g(m);
  }), p = Z((f, m, g) => {
    Promise.all(u.current[m].splice(0).map(([h, b]) => b)).then(() => {
      var h;
      (h = l.current.shift()) == null || h();
    }).then(() => g(m));
  });
  return ce(() => ({ children: r, register: s, unregister: a, onStart: d, onStop: p, wait: c, chains: u }), [s, a, r, d, p, u, c]);
}
let Va = Re, Ya = pn.RenderStrategy;
function vf(e, t) {
  var n, r;
  let { transition: o = !0, beforeEnter: i, afterEnter: a, beforeLeave: s, afterLeave: l, enter: c, enterFrom: u, enterTo: d, entered: p, leave: f, leaveFrom: m, leaveTo: g, ...h } = e, [b, x] = le(null), y = Q(null), E = Ba(e), v = Te(...E ? [y, t, x] : t === null ? [] : [t]), C = (n = h.unmount) == null || n ? Qe.Unmount : Qe.Hidden, { show: $, appear: G, initial: J } = gf(), [P, _] = le($ ? "visible" : "hidden"), L = hf(), { register: K, unregister: R } = L;
  se(() => K(y), [K, y]), se(() => {
    if (C === Qe.Hidden && y.current) {
      if ($ && P !== "visible") {
        _("visible");
        return;
      }
      return ke(P, { hidden: () => R(y), visible: () => K(y) });
    }
  }, [P, y, K, R, $, C]);
  let re = ao();
  se(() => {
    if (E && re && P === "visible" && y.current === null) throw new Error("Did you forget to passthrough the `ref` to the actual DOM node?");
  }, [y, P, re, E]);
  let Y = J && !G, ee = G && $ && J, N = Q(!1), B = Ua(() => {
    N.current || (_("hidden"), R(y));
  }, L), w = Z((T) => {
    N.current = !0;
    let F = T ? "enter" : "leave";
    B.onStart(y, F, (z) => {
      z === "enter" ? i == null || i() : z === "leave" && (s == null || s());
    });
  }), S = Z((T) => {
    let F = T ? "enter" : "leave";
    N.current = !1, B.onStop(y, F, (z) => {
      z === "enter" ? a == null || a() : z === "leave" && (l == null || l());
    }), F === "leave" && !Cn(B) && (_("hidden"), R(y));
  });
  fe(() => {
    E && o || (w($), S($));
  }, [$, E, o]);
  let j = !(!o || !E || !re || Y), [, M] = wa(j, b, $, { start: w, end: S }), D = Xe({ ref: v, className: ((r = gr(h.className, ee && c, ee && u, M.enter && c, M.enter && M.closed && u, M.enter && !M.closed && d, M.leave && f, M.leave && !M.closed && m, M.leave && M.closed && g, !M.transition && $ && p)) == null ? void 0 : r.trim()) || void 0, ...xa(M) }), U = 0;
  P === "visible" && (U |= Ce.Open), P === "hidden" && (U |= Ce.Closed), $ && P === "hidden" && (U |= Ce.Opening), !$ && P === "visible" && (U |= Ce.Closing);
  let H = Ee();
  return V.createElement(Pn.Provider, { value: B }, V.createElement(Da, { value: U }, H({ ourProps: D, theirProps: h, defaultTag: Va, features: Ya, visible: P === "visible", name: "Transition.Child" })));
}
function bf(e, t) {
  let { show: n, appear: r = !1, unmount: o = !0, ...i } = e, a = Q(null), s = Ba(e), l = Te(...s ? [a, t] : t === null ? [] : [t]);
  ao();
  let c = io();
  if (n === void 0 && c !== null && (n = (c & Ce.Open) === Ce.Open), n === void 0) throw new Error("A <Transition /> is used but it is missing a `show={true | false}` prop.");
  let [u, d] = le(n ? "visible" : "hidden"), p = Ua(() => {
    n || d("hidden");
  }), [f, m] = le(!0), g = Q([n]);
  se(() => {
    f !== !1 && g.current[g.current.length - 1] !== n && (g.current.push(n), m(!1));
  }, [g, n]);
  let h = ce(() => ({ show: n, appear: r, initial: f }), [n, r, f]);
  se(() => {
    n ? d("visible") : !Cn(p) && a.current !== null && d("hidden");
  }, [n, p]);
  let b = { unmount: o }, x = Z(() => {
    var v;
    f && m(!1), (v = e.beforeEnter) == null || v.call(e);
  }), y = Z(() => {
    var v;
    f && m(!1), (v = e.beforeLeave) == null || v.call(e);
  }), E = Ee();
  return V.createElement(Pn.Provider, { value: p }, V.createElement(An.Provider, { value: h }, E({ ourProps: { ...b, as: Re, children: V.createElement(Ga, { ref: l, ...b, ...i, beforeEnter: x, beforeLeave: y }) }, theirProps: {}, defaultTag: Re, features: Ya, visible: u === "visible", name: "Transition" })));
}
function yf(e, t) {
  let n = ue(An) !== null, r = io() !== null;
  return V.createElement(V.Fragment, null, !n && r ? V.createElement(Or, { ref: t, ...e }) : V.createElement(Ga, { ref: t, ...e }));
}
let Or = xe(bf), Ga = xe(vf), xf = xe(yf), wf = Object.assign(Or, { Child: xf, Root: Or });
function Ef(e, t) {
  let n = Q({ left: 0, top: 0 });
  if (se(() => {
    if (!t) return;
    let o = t.getBoundingClientRect();
    o && (n.current = o);
  }, [e, t]), t == null || !e || t === document.activeElement) return !1;
  let r = t.getBoundingClientRect();
  return r.top !== n.current.top || r.left !== n.current.left;
}
let Xo = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;
function Qo(e) {
  var t, n;
  let r = (t = e.innerText) != null ? t : "", o = e.cloneNode(!0);
  if (!(o instanceof HTMLElement)) return r;
  let i = !1;
  for (let s of o.querySelectorAll('[hidden],[aria-hidden],[role="img"]')) s.remove(), i = !0;
  let a = i ? (n = o.innerText) != null ? n : "" : r;
  return Xo.test(a) && (a = a.replace(Xo, "")), a;
}
function Of(e) {
  let t = e.getAttribute("aria-label");
  if (typeof t == "string") return t.trim();
  let n = e.getAttribute("aria-labelledby");
  if (n) {
    let r = n.split(" ").map((o) => {
      let i = document.getElementById(o);
      if (i) {
        let a = i.getAttribute("aria-label");
        return typeof a == "string" ? a.trim() : Qo(i).trim();
      }
      return null;
    }).filter(Boolean);
    if (r.length > 0) return r.join(", ");
  }
  return Qo(e).trim();
}
function Sf(e) {
  let t = Q(""), n = Q("");
  return Z(() => {
    let r = e.current;
    if (!r) return "";
    let o = r.innerText;
    if (t.current === o) return n.current;
    let i = Of(r).trim().toLowerCase();
    return t.current = o, n.current = i, i;
  });
}
var Tf = Object.defineProperty, Af = (e, t, n) => t in e ? Tf(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, Jo = (e, t, n) => (Af(e, typeof t != "symbol" ? t + "" : t, n), n), pe = ((e) => (e[e.Open = 0] = "Open", e[e.Closed = 1] = "Closed", e))(pe || {}), Fe = ((e) => (e[e.Single = 0] = "Single", e[e.Multi = 1] = "Multi", e))(Fe || {}), Sr = ((e) => (e[e.Pointer = 0] = "Pointer", e[e.Other = 1] = "Other", e))(Sr || {}), qa = ((e) => (e[e.OpenListbox = 0] = "OpenListbox", e[e.CloseListbox = 1] = "CloseListbox", e[e.GoToOption = 2] = "GoToOption", e[e.Search = 3] = "Search", e[e.ClearSearch = 4] = "ClearSearch", e[e.RegisterOptions = 5] = "RegisterOptions", e[e.UnregisterOptions = 6] = "UnregisterOptions", e[e.SetButtonElement = 7] = "SetButtonElement", e[e.SetOptionsElement = 8] = "SetOptionsElement", e[e.SortOptions = 9] = "SortOptions", e))(qa || {});
function Zo(e, t = (n) => n) {
  let n = e.activeOptionIndex !== null ? e.options[e.activeOptionIndex] : null, r = ba(t(e.options.slice()), (i) => i.dataRef.current.domRef.current), o = n ? r.indexOf(n) : null;
  return o === -1 && (o = null), { options: r, activeOptionIndex: o };
}
let Pf = { 1(e) {
  return e.dataRef.current.disabled || e.listboxState === 1 ? e : { ...e, activeOptionIndex: null, listboxState: 1, __demoMode: !1 };
}, 0(e) {
  if (e.dataRef.current.disabled || e.listboxState === 0) return e;
  let t = e.activeOptionIndex, { isSelected: n } = e.dataRef.current, r = e.options.findIndex((o) => n(o.dataRef.current.value));
  return r !== -1 && (t = r), { ...e, listboxState: 0, activeOptionIndex: t, __demoMode: !1 };
}, 2(e, t) {
  var n, r, o, i, a;
  if (e.dataRef.current.disabled || e.listboxState === 1) return e;
  let s = { ...e, searchQuery: "", activationTrigger: (n = t.trigger) != null ? n : 1, __demoMode: !1 };
  if (t.focus === me.Nothing) return { ...s, activeOptionIndex: null };
  if (t.focus === me.Specific) return { ...s, activeOptionIndex: e.options.findIndex((u) => u.id === t.id) };
  if (t.focus === me.Previous) {
    let u = e.activeOptionIndex;
    if (u !== null) {
      let d = e.options[u].dataRef.current.domRef, p = Kn(t, { resolveItems: () => e.options, resolveActiveIndex: () => e.activeOptionIndex, resolveId: (f) => f.id, resolveDisabled: (f) => f.dataRef.current.disabled });
      if (p !== null) {
        let f = e.options[p].dataRef.current.domRef;
        if (((r = d.current) == null ? void 0 : r.previousElementSibling) === f.current || ((o = f.current) == null ? void 0 : o.previousElementSibling) === null) return { ...s, activeOptionIndex: p };
      }
    }
  } else if (t.focus === me.Next) {
    let u = e.activeOptionIndex;
    if (u !== null) {
      let d = e.options[u].dataRef.current.domRef, p = Kn(t, { resolveItems: () => e.options, resolveActiveIndex: () => e.activeOptionIndex, resolveId: (f) => f.id, resolveDisabled: (f) => f.dataRef.current.disabled });
      if (p !== null) {
        let f = e.options[p].dataRef.current.domRef;
        if (((i = d.current) == null ? void 0 : i.nextElementSibling) === f.current || ((a = f.current) == null ? void 0 : a.nextElementSibling) === null) return { ...s, activeOptionIndex: p };
      }
    }
  }
  let l = Zo(e), c = Kn(t, { resolveItems: () => l.options, resolveActiveIndex: () => l.activeOptionIndex, resolveId: (u) => u.id, resolveDisabled: (u) => u.dataRef.current.disabled });
  return { ...s, ...l, activeOptionIndex: c };
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
}, 7: (e, t) => e.buttonElement === t.element ? e : { ...e, buttonElement: t.element }, 8: (e, t) => e.optionsElement === t.element ? e : { ...e, optionsElement: t.element }, 9: (e) => e.pendingShouldSort ? { ...e, ...Zo(e), pendingShouldSort: !1 } : e };
class so extends Xu {
  constructor(t) {
    super(t), Jo(this, "actions", { onChange: (n) => {
      let { onChange: r, compare: o, mode: i, value: a } = this.state.dataRef.current;
      return ke(i, { 0: () => r == null ? void 0 : r(n), 1: () => {
        let s = a.slice(), l = s.findIndex((c) => o(c, n));
        return l === -1 ? s.push(n) : s.splice(l, 1), r == null ? void 0 : r(s);
      } });
    }, registerOption: qn(() => {
      let n = [], r = /* @__PURE__ */ new Set();
      return [(o, i) => {
        r.has(i) || (r.add(i), n.push({ id: o, dataRef: i }));
      }, () => (r.clear(), this.send({ type: 5, options: n.splice(0) }))];
    }), unregisterOption: qn(() => {
      let n = [];
      return [(r) => n.push(r), () => {
        this.send({ type: 6, options: n.splice(0) });
      }];
    }), goToOption: qn(() => {
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
        this.actions.onChange(n.current.value), this.send({ type: 2, focus: me.Specific, id: r });
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
    } }), Jo(this, "selectors", { activeDescendantId(n) {
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
    return new so({ dataRef: { current: {} }, listboxState: t ? 0 : 1, options: [], searchQuery: "", activeOptionIndex: null, activationTrigger: 1, buttonElement: null, optionsElement: null, __demoMode: t });
  }
  reduce(t, n) {
    return ke(n.type, Pf, t, n);
  }
}
const Ka = be(null);
function lo(e) {
  let t = ue(Ka);
  if (t === null) {
    let n = new Error(`<${e} /> is missing a parent <Listbox /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(n, Xa), n;
  }
  return t;
}
function Xa({ __demoMode: e = !1 } = {}) {
  return ce(() => so.new({ __demoMode: e }), []);
}
let $n = be(null);
$n.displayName = "ListboxDataContext";
function Kt(e) {
  let t = ue($n);
  if (t === null) {
    let n = new Error(`<${e} /> is missing a parent <Listbox /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(n, Kt), n;
  }
  return t;
}
let Cf = Re;
function $f(e, t) {
  let n = qr(), { value: r, defaultValue: o, form: i, name: a, onChange: s, by: l, invalid: c = !1, disabled: u = n || !1, horizontal: d = !1, multiple: p = !1, __demoMode: f = !1, ...m } = e;
  const g = d ? "horizontal" : "vertical";
  let h = Te(t), b = $l(o), [x = p ? [] : void 0, y] = Cl(r, s, b), E = Xa({ __demoMode: f }), v = Q({ static: !1, hold: !1 }), C = Q(/* @__PURE__ */ new Map()), $ = Ql(l), G = ae((w) => ke(J.mode, { [Fe.Multi]: () => x.some((S) => $(S, w)), [Fe.Single]: () => $(x, w) }), [x]), J = ce(() => ({ value: x, disabled: u, invalid: c, mode: p ? Fe.Multi : Fe.Single, orientation: g, onChange: y, compare: $, isSelected: G, optionsPropsRef: v, listRef: C }), [x, u, c, p, g, y, $, G, v, C]);
  se(() => {
    E.state.dataRef.current = J;
  }, [J]);
  let P = $e(E, (w) => w.listboxState), _ = P === pe.Open, [L, K] = $e(E, (w) => [w.buttonElement, w.optionsElement]);
  gc(_, [L, K], (w, S) => {
    E.send({ type: qa.CloseListbox }), va(S, Jr.Loose) || (w.preventDefault(), L == null || L.focus());
  });
  let R = ce(() => ({ open: P === pe.Open, disabled: u, invalid: c, value: x }), [P, u, c, x]), [re, Y] = Vl({ inherit: !0 }), ee = { ref: h }, N = ae(() => {
    if (b !== void 0) return y == null ? void 0 : y(b);
  }, [y, b]), B = Ee();
  return V.createElement(Y, { value: re, props: { htmlFor: L == null ? void 0 : L.id }, slot: { open: P === pe.Open, disabled: u } }, V.createElement(Hu, null, V.createElement(Ka.Provider, { value: E }, V.createElement($n.Provider, { value: J }, V.createElement(Da, { value: ke(P, { [pe.Open]: Ce.Open, [pe.Closed]: Ce.Closed }) }, a != null && x != null && V.createElement(Fl, { disabled: u, data: { [a]: x }, form: i, onReset: N }), B({ ourProps: ee, theirProps: m, slot: R, defaultTag: Cf, name: "Listbox" }))))));
}
let Rf = "button";
function kf(e, t) {
  let n = Ot(), r = la(), o = Kt("Listbox.Button"), i = lo("Listbox.Button"), { id: a = r || `headlessui-listbox-button-${n}`, disabled: s = o.disabled || !1, autoFocus: l = !1, ...c } = e, u = Te(t, Nu(), i.actions.setButtonElement), d = Du(), p = Z((R) => {
    switch (R.key) {
      case de.Enter:
        Rl(R.currentTarget);
        break;
      case de.Space:
      case de.ArrowDown:
        R.preventDefault(), st(() => i.actions.openListbox()), o.value || i.actions.goToOption({ focus: me.First });
        break;
      case de.ArrowUp:
        R.preventDefault(), st(() => i.actions.openListbox()), o.value || i.actions.goToOption({ focus: me.Last });
        break;
    }
  }), f = Z((R) => {
    switch (R.key) {
      case de.Space:
        R.preventDefault();
        break;
    }
  }), m = Z((R) => {
    var re;
    if (R.button === 0) {
      if (Dl(R.currentTarget)) return R.preventDefault();
      i.state.listboxState === pe.Open ? (st(() => i.actions.closeListbox()), (re = i.state.buttonElement) == null || re.focus({ preventScroll: !0 })) : (R.preventDefault(), i.actions.openListbox());
    }
  }), g = Z((R) => R.preventDefault()), h = da([a]), b = Hl(), { isFocusVisible: x, focusProps: y } = hl({ autoFocus: l }), { isHovered: E, hoverProps: v } = gl({ isDisabled: s }), { pressed: C, pressProps: $ } = El({ disabled: s }), G = $e(i, (R) => R.listboxState), J = ce(() => ({ open: G === pe.Open, active: C || G === pe.Open, disabled: s, invalid: o.invalid, value: o.value, hover: E, focus: x, autofocus: l }), [G, o.value, s, E, x, C, o.invalid, l]), P = $e(i, (R) => R.listboxState === pe.Open), [_, L] = $e(i, (R) => [R.buttonElement, R.optionsElement]), K = ra(d(), { ref: u, id: a, type: hc(e, _), "aria-haspopup": "listbox", "aria-controls": L == null ? void 0 : L.id, "aria-expanded": P, "aria-labelledby": h, "aria-describedby": b, disabled: s || void 0, autoFocus: l, onKeyDown: p, onKeyUp: f, onKeyPress: g, onMouseDown: m }, y, v, $);
  return Ee()({ ourProps: K, theirProps: c, slot: J, defaultTag: Rf, name: "Listbox.Button" });
}
let Qa = be(!1), If = "div", Lf = pn.RenderStrategy | pn.Static;
function Mf(e, t) {
  let n = Ot(), { id: r = `headlessui-listbox-options-${n}`, anchor: o, portal: i = !1, modal: a = !0, transition: s = !1, ...l } = e, c = _u(o), [u, d] = le(null);
  c && (i = !0);
  let p = Kt("Listbox.Options"), f = lo("Listbox.Options"), [m, g, h, b] = $e(f, (T) => [T.listboxState, T.buttonElement, T.optionsElement, T.__demoMode]), x = yr(g), y = yr(h), E = io(), [v, C] = wa(s, u, E !== null ? (E & Ce.Open) === Ce.Open : m === pe.Open);
  nc(v, g, f.actions.closeListbox);
  let $ = b ? !1 : a && m === pe.Open;
  Ec($, y);
  let G = b ? !1 : a && m === pe.Open;
  tc(G, { allowed: ae(() => [g, h], [g, h]) });
  let J = m !== pe.Open, P = Ef(J, g) ? !1 : v, _ = v && m === pe.Closed, L = Uu(_, p.value), K = Z((T) => p.compare(L, T)), R = $e(f, (T) => {
    var F;
    if (c == null || !((F = c == null ? void 0 : c.to) != null && F.includes("selection"))) return null;
    let z = T.options.findIndex((X) => K(X.dataRef.current.value));
    return z === -1 && (z = 0), z;
  }), re = (() => {
    if (c == null) return;
    if (R === null) return { ...c, inner: void 0 };
    let T = Array.from(p.listRef.current.values());
    return { ...c, inner: { listRef: { current: T }, index: R } };
  })(), [Y, ee] = zu(re), N = ju(), B = Te(t, c ? Y : null, f.actions.setOptionsElement, d), w = St();
  fe(() => {
    var T;
    let F = h;
    F && m === pe.Open && F !== ((T = Yt(F)) == null ? void 0 : T.activeElement) && (F == null || F.focus({ preventScroll: !0 }));
  }, [m, h]);
  let S = Z((T) => {
    var F, z;
    switch (w.dispose(), T.key) {
      case de.Space:
        if (f.state.searchQuery !== "") return T.preventDefault(), T.stopPropagation(), f.actions.search(T.key);
      case de.Enter:
        if (T.preventDefault(), T.stopPropagation(), f.state.activeOptionIndex !== null) {
          let { dataRef: X } = f.state.options[f.state.activeOptionIndex];
          f.actions.onChange(X.current.value);
        }
        p.mode === Fe.Single && (st(() => f.actions.closeListbox()), (F = f.state.buttonElement) == null || F.focus({ preventScroll: !0 }));
        break;
      case ke(p.orientation, { vertical: de.ArrowDown, horizontal: de.ArrowRight }):
        return T.preventDefault(), T.stopPropagation(), f.actions.goToOption({ focus: me.Next });
      case ke(p.orientation, { vertical: de.ArrowUp, horizontal: de.ArrowLeft }):
        return T.preventDefault(), T.stopPropagation(), f.actions.goToOption({ focus: me.Previous });
      case de.Home:
      case de.PageUp:
        return T.preventDefault(), T.stopPropagation(), f.actions.goToOption({ focus: me.First });
      case de.End:
      case de.PageDown:
        return T.preventDefault(), T.stopPropagation(), f.actions.goToOption({ focus: me.Last });
      case de.Escape:
        T.preventDefault(), T.stopPropagation(), st(() => f.actions.closeListbox()), (z = f.state.buttonElement) == null || z.focus({ preventScroll: !0 });
        return;
      case de.Tab:
        T.preventDefault(), T.stopPropagation(), st(() => f.actions.closeListbox()), uc(f.state.buttonElement, T.shiftKey ? br.Previous : br.Next);
        break;
      default:
        T.key.length === 1 && (f.actions.search(T.key), w.setTimeout(() => f.actions.clearSearch(), 350));
        break;
    }
  }), j = $e(f, (T) => {
    var F;
    return (F = T.buttonElement) == null ? void 0 : F.id;
  }), M = ce(() => ({ open: m === pe.Open }), [m]), D = ra(c ? N() : {}, { id: r, ref: B, "aria-activedescendant": $e(f, f.selectors.activeDescendantId), "aria-multiselectable": p.mode === Fe.Multi ? !0 : void 0, "aria-labelledby": j, "aria-orientation": p.orientation, onKeyDown: S, role: "listbox", tabIndex: m === pe.Open ? 0 : void 0, style: { ...l.style, ...ee, "--button-width": Zl(g, !0).width }, ...xa(C) }), U = Ee(), H = ce(() => p.mode === Fe.Multi ? p : { ...p, isSelected: K }, [p, K]);
  return V.createElement(df, { enabled: i ? e.static || v : !1, ownerDocument: x }, V.createElement($n.Provider, { value: H }, U({ ourProps: D, theirProps: l, slot: M, defaultTag: If, features: Lf, visible: P, name: "Listbox.Options" })));
}
let Ff = "div";
function _f(e, t) {
  let n = Ot(), { id: r = `headlessui-listbox-option-${n}`, disabled: o = !1, value: i, ...a } = e, s = ue(Qa) === !0, l = Kt("Listbox.Option"), c = lo("Listbox.Option"), u = $e(c, (P) => c.selectors.isActive(P, r)), d = l.isSelected(i), p = Q(null), f = Sf(p), m = gt({ disabled: o, value: i, domRef: p, get textValue() {
    return f();
  } }), g = Te(t, p, (P) => {
    P ? l.listRef.current.set(r, P) : l.listRef.current.delete(r);
  }), h = $e(c, (P) => c.selectors.shouldScrollIntoView(P, r));
  se(() => {
    if (h) return ze().requestAnimationFrame(() => {
      var P, _;
      (_ = (P = p.current) == null ? void 0 : P.scrollIntoView) == null || _.call(P, { block: "nearest" });
    });
  }, [h, p]), se(() => {
    if (!s) return c.actions.registerOption(r, m), () => c.actions.unregisterOption(r);
  }, [m, r, s]);
  let b = Z((P) => {
    var _;
    if (o) return P.preventDefault();
    c.actions.onChange(i), l.mode === Fe.Single && (st(() => c.actions.closeListbox()), (_ = c.state.buttonElement) == null || _.focus({ preventScroll: !0 }));
  }), x = Z(() => {
    if (o) return c.actions.goToOption({ focus: me.Nothing });
    c.actions.goToOption({ focus: me.Specific, id: r });
  }), y = Oc(), E = Z((P) => {
    y.update(P), !o && (u || c.actions.goToOption({ focus: me.Specific, id: r }, Sr.Pointer));
  }), v = Z((P) => {
    y.wasMoved(P) && (o || u || c.actions.goToOption({ focus: me.Specific, id: r }, Sr.Pointer));
  }), C = Z((P) => {
    y.wasMoved(P) && (o || u && c.actions.goToOption({ focus: me.Nothing }));
  }), $ = ce(() => ({ active: u, focus: u, selected: d, disabled: o, selectedOption: d && s }), [u, d, o, s]), G = s ? {} : { id: r, ref: g, role: "option", tabIndex: o === !0 ? void 0 : -1, "aria-disabled": o === !0 ? !0 : void 0, "aria-selected": d, disabled: void 0, onClick: b, onFocus: x, onPointerEnter: E, onMouseEnter: E, onPointerMove: v, onMouseMove: v, onPointerLeave: C, onMouseLeave: C }, J = Ee();
  return !d && s ? null : J({ ourProps: G, theirProps: a, slot: $, defaultTag: Ff, name: "Listbox.Option" });
}
let Nf = Re;
function Df(e, t) {
  let { options: n, placeholder: r, ...o } = e, i = { ref: Te(t) }, a = Kt("ListboxSelectedOption"), s = ce(() => ({}), []), l = a.value === void 0 || a.value === null || a.mode === Fe.Multi && Array.isArray(a.value) && a.value.length === 0, c = Ee();
  return V.createElement(Qa.Provider, { value: !0 }, c({ ourProps: i, theirProps: { ...o, children: V.createElement(V.Fragment, null, r && l ? r : n) }, slot: s, defaultTag: Nf, name: "ListboxSelectedOption" }));
}
let jf = xe($f), Ja = xe(kf), zf = Kl, Za = xe(Mf), es = xe(_f), Hf = xe(Df), Wf = Object.assign(jf, { Button: Ja, Label: zf, Options: Za, Option: es, SelectedOption: Hf });
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Bf = {
  prefix: "fas",
  iconName: "chevron-down",
  icon: [512, 512, [], "f078", "M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"]
}, Uf = {
  prefix: "fas",
  iconName: "check",
  icon: [448, 512, [10003, 10004], "f00c", "M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"]
};
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function Vf(e, t, n) {
  return (t = Gf(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function ei(e, t) {
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
    t % 2 ? ei(Object(n), !0).forEach(function(r) {
      Vf(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : ei(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Yf(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Gf(e) {
  var t = Yf(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const ti = () => {
};
let co = {}, ts = {}, ns = null, rs = {
  mark: ti,
  measure: ti
};
try {
  typeof window < "u" && (co = window), typeof document < "u" && (ts = document), typeof MutationObserver < "u" && (ns = MutationObserver), typeof performance < "u" && (rs = performance);
} catch {
}
const {
  userAgent: ni = ""
} = co.navigator || {}, et = co, ie = ts, ri = ns, nn = rs;
et.document;
const Ye = !!ie.documentElement && !!ie.head && typeof ie.addEventListener == "function" && typeof ie.createElement == "function", os = ~ni.indexOf("MSIE") || ~ni.indexOf("Trident/");
var qf = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, Kf = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, is = {
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
}, Xf = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, as = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], ve = "classic", Rn = "duotone", Qf = "sharp", Jf = "sharp-duotone", ss = [ve, Rn, Qf, Jf], Zf = {
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
}, ed = {
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
}, td = /* @__PURE__ */ new Map([["classic", {
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
}]]), nd = {
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
}, rd = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], oi = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, od = ["kit"], id = {
  kit: {
    "fa-kit": "fak"
  }
}, ad = ["fak", "fakd"], sd = {
  kit: {
    fak: "fa-kit"
  }
}, ii = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, rn = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, ld = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], cd = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], ud = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, fd = {
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
}, dd = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Tr = {
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
}, pd = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], Ar = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...ld, ...pd], md = ["solid", "regular", "light", "thin", "duotone", "brands"], ls = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], gd = ls.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), hd = [...Object.keys(dd), ...md, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", rn.GROUP, rn.SWAP_OPACITY, rn.PRIMARY, rn.SECONDARY].concat(ls.map((e) => "".concat(e, "x"))).concat(gd.map((e) => "w-".concat(e))), vd = {
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
const Ue = "___FONT_AWESOME___", Pr = 16, cs = "fa", us = "svg-inline--fa", pt = "data-fa-i2svg", Cr = "data-fa-pseudo-element", bd = "data-fa-pseudo-element-pending", uo = "data-prefix", fo = "data-icon", ai = "fontawesome-i2svg", yd = "async", xd = ["HTML", "HEAD", "STYLE", "SCRIPT"], fs = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Xt(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[ve];
    }
  });
}
const ds = O({}, is);
ds[ve] = O(O(O(O({}, {
  "fa-duotone": "duotone"
}), is[ve]), oi.kit), oi["kit-duotone"]);
const wd = Xt(ds), $r = O({}, nd);
$r[ve] = O(O(O(O({}, {
  duotone: "fad"
}), $r[ve]), ii.kit), ii["kit-duotone"]);
const si = Xt($r), Rr = O({}, Tr);
Rr[ve] = O(O({}, Rr[ve]), sd.kit);
const po = Xt(Rr), kr = O({}, fd);
kr[ve] = O(O({}, kr[ve]), id.kit);
Xt(kr);
const Ed = qf, ps = "fa-layers-text", Od = Kf, Sd = O({}, Zf);
Xt(Sd);
const Td = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Xn = Xf, Ad = [...od, ...hd], Dt = et.FontAwesomeConfig || {};
function Pd(e) {
  var t = ie.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function Cd(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
ie && typeof ie.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [n, r] = t;
  const o = Cd(Pd(n));
  o != null && (Dt[r] = o);
});
const ms = {
  styleDefault: "solid",
  familyDefault: ve,
  cssPrefix: cs,
  replacementClass: us,
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
Dt.familyPrefix && (Dt.cssPrefix = Dt.familyPrefix);
const Et = O(O({}, ms), Dt);
Et.autoReplaceSvg || (Et.observeMutations = !1);
const k = {};
Object.keys(ms).forEach((e) => {
  Object.defineProperty(k, e, {
    enumerable: !0,
    set: function(t) {
      Et[e] = t, jt.forEach((n) => n(k));
    },
    get: function() {
      return Et[e];
    }
  });
});
Object.defineProperty(k, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    Et.cssPrefix = e, jt.forEach((t) => t(k));
  },
  get: function() {
    return Et.cssPrefix;
  }
});
et.FontAwesomeConfig = k;
const jt = [];
function $d(e) {
  return jt.push(e), () => {
    jt.splice(jt.indexOf(e), 1);
  };
}
const Ge = Pr, _e = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function Rd(e) {
  if (!e || !Ye)
    return;
  const t = ie.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = ie.head.childNodes;
  let r = null;
  for (let o = n.length - 1; o > -1; o--) {
    const i = n[o], a = (i.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(a) > -1 && (r = i);
  }
  return ie.head.insertBefore(t, r), e;
}
const kd = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Bt() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += kd[Math.random() * 62 | 0];
  return t;
}
function Ct(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function mo(e) {
  return e.classList ? Ct(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function gs(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Id(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(gs(e[n]), '" '), "").trim();
}
function kn(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function go(e) {
  return e.size !== _e.size || e.x !== _e.x || e.y !== _e.y || e.rotate !== _e.rotate || e.flipX || e.flipY;
}
function Ld(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const o = {
    transform: "translate(".concat(n / 2, " 256)")
  }, i = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), a = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), l = {
    transform: "".concat(i, " ").concat(a, " ").concat(s)
  }, c = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: l,
    path: c
  };
}
function Md(e) {
  let {
    transform: t,
    width: n = Pr,
    height: r = Pr,
    startCentered: o = !1
  } = e, i = "";
  return o && os ? i += "translate(".concat(t.x / Ge - n / 2, "em, ").concat(t.y / Ge - r / 2, "em) ") : o ? i += "translate(calc(-50% + ".concat(t.x / Ge, "em), calc(-50% + ").concat(t.y / Ge, "em)) ") : i += "translate(".concat(t.x / Ge, "em, ").concat(t.y / Ge, "em) "), i += "scale(".concat(t.size / Ge * (t.flipX ? -1 : 1), ", ").concat(t.size / Ge * (t.flipY ? -1 : 1), ") "), i += "rotate(".concat(t.rotate, "deg) "), i;
}
var Fd = `:root, :host {
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
function hs() {
  const e = cs, t = us, n = k.cssPrefix, r = k.replacementClass;
  let o = Fd;
  if (n !== e || r !== t) {
    const i = new RegExp("\\.".concat(e, "\\-"), "g"), a = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(i, ".".concat(n, "-")).replace(a, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return o;
}
let li = !1;
function Qn() {
  k.autoAddCss && !li && (Rd(hs()), li = !0);
}
var _d = {
  mixout() {
    return {
      dom: {
        css: hs,
        insertCss: Qn
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Qn();
      },
      beforeI2svg() {
        Qn();
      }
    };
  }
};
const Ve = et || {};
Ve[Ue] || (Ve[Ue] = {});
Ve[Ue].styles || (Ve[Ue].styles = {});
Ve[Ue].hooks || (Ve[Ue].hooks = {});
Ve[Ue].shims || (Ve[Ue].shims = []);
var Ne = Ve[Ue];
const vs = [], bs = function() {
  ie.removeEventListener("DOMContentLoaded", bs), vn = 1, vs.map((e) => e());
};
let vn = !1;
Ye && (vn = (ie.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(ie.readyState), vn || ie.addEventListener("DOMContentLoaded", bs));
function Nd(e) {
  Ye && (vn ? setTimeout(e, 0) : vs.push(e));
}
function Qt(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? gs(e) : "<".concat(t, " ").concat(Id(n), ">").concat(r.map(Qt).join(""), "</").concat(t, ">");
}
function ci(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var Jn = function(t, n, r, o) {
  var i = Object.keys(t), a = i.length, s = n, l, c, u;
  for (r === void 0 ? (l = 1, u = t[i[0]]) : (l = 0, u = r); l < a; l++)
    c = i[l], u = s(u, t[c], c, t);
  return u;
};
function Dd(e) {
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
function Ir(e) {
  const t = Dd(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function jd(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), o;
  return r >= 55296 && r <= 56319 && n > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (r - 55296) * 1024 + o - 56320 + 65536 : r;
}
function ui(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return !!r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function Lr(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, o = ui(t);
  typeof Ne.hooks.addPack == "function" && !r ? Ne.hooks.addPack(e, ui(t)) : Ne.styles[e] = O(O({}, Ne.styles[e] || {}), o), e === "fas" && Lr("fa", t);
}
const {
  styles: Ut,
  shims: zd
} = Ne, ys = Object.keys(po), Hd = ys.reduce((e, t) => (e[t] = Object.keys(po[t]), e), {});
let ho = null, xs = {}, ws = {}, Es = {}, Os = {}, Ss = {};
function Wd(e) {
  return ~Ad.indexOf(e);
}
function Bd(e, t) {
  const n = t.split("-"), r = n[0], o = n.slice(1).join("-");
  return r === e && o !== "" && !Wd(o) ? o : null;
}
const Ts = () => {
  const e = (r) => Jn(Ut, (o, i, a) => (o[a] = Jn(i, r, {}), o), {});
  xs = e((r, o, i) => (o[3] && (r[o[3]] = i), o[2] && o[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = i;
  }), r)), ws = e((r, o, i) => (r[i] = i, o[2] && o[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = i;
  }), r)), Ss = e((r, o, i) => {
    const a = o[2];
    return r[i] = i, a.forEach((s) => {
      r[s] = i;
    }), r;
  });
  const t = "far" in Ut || k.autoFetchSvg, n = Jn(zd, (r, o) => {
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
  Es = n.names, Os = n.unicodes, ho = In(k.styleDefault, {
    family: k.familyDefault
  });
};
$d((e) => {
  ho = In(e.styleDefault, {
    family: k.familyDefault
  });
});
Ts();
function vo(e, t) {
  return (xs[e] || {})[t];
}
function Ud(e, t) {
  return (ws[e] || {})[t];
}
function at(e, t) {
  return (Ss[e] || {})[t];
}
function As(e) {
  return Es[e] || {
    prefix: null,
    iconName: null
  };
}
function Vd(e) {
  const t = Os[e], n = vo("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function tt() {
  return ho;
}
const Ps = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function Yd(e) {
  let t = ve;
  const n = ys.reduce((r, o) => (r[o] = "".concat(k.cssPrefix, "-").concat(o), r), {});
  return ss.forEach((r) => {
    (e.includes(n[r]) || e.some((o) => Hd[r].includes(o))) && (t = r);
  }), t;
}
function In(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = ve
  } = t, r = wd[n][e];
  if (n === Rn && !e)
    return "fad";
  const o = si[n][e] || si[n][r], i = e in Ne.styles ? e : null;
  return o || i || null;
}
function Gd(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const o = Bd(k.cssPrefix, r);
    o ? n = o : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function fi(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function Ln(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const o = Ar.concat(cd), i = fi(e.filter((d) => o.includes(d))), a = fi(e.filter((d) => !Ar.includes(d))), s = i.filter((d) => (r = d, !as.includes(d))), [l = null] = s, c = Yd(i), u = O(O({}, Gd(a)), {}, {
    prefix: In(l, {
      family: c
    })
  });
  return O(O(O({}, u), Qd({
    values: e,
    family: c,
    styles: Ut,
    config: k,
    canonical: u,
    givenPrefix: r
  })), qd(n, r, u));
}
function qd(e, t, n) {
  let {
    prefix: r,
    iconName: o
  } = n;
  if (e || !r || !o)
    return {
      prefix: r,
      iconName: o
    };
  const i = t === "fa" ? As(o) : {}, a = at(r, o);
  return o = i.iconName || a || o, r = i.prefix || r, r === "far" && !Ut.far && Ut.fas && !k.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: o
  };
}
const Kd = ss.filter((e) => e !== ve || e !== Rn), Xd = Object.keys(Tr).filter((e) => e !== ve).map((e) => Object.keys(Tr[e])).flat();
function Qd(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: o = "",
    styles: i = {},
    config: a = {}
  } = e, s = n === Rn, l = t.includes("fa-duotone") || t.includes("fad"), c = a.familyDefault === "duotone", u = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (l || c || u) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && Kd.includes(n) && (Object.keys(i).find((p) => Xd.includes(p)) || a.autoFetchSvg)) {
    const p = td.get(n).defaultShortPrefixId;
    r.prefix = p, r.iconName = at(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || o === "fa") && (r.prefix = tt() || "fas"), r;
}
class Jd {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const o = n.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((i) => {
      this.definitions[i] = O(O({}, this.definitions[i] || {}), o[i]), Lr(i, o[i]);
      const a = po[ve][i];
      a && Lr(a, o[i]), Ts();
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
      t[i] || (t[i] = {}), l.length > 0 && l.forEach((c) => {
        typeof c == "string" && (t[i][c] = s);
      }), t[i][a] = s;
    }), t;
  }
}
let di = [], ht = {};
const yt = {}, Zd = Object.keys(yt);
function ep(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return di = e, ht = {}, Object.keys(yt).forEach((r) => {
    Zd.indexOf(r) === -1 && delete yt[r];
  }), di.forEach((r) => {
    const o = r.mixout ? r.mixout() : {};
    if (Object.keys(o).forEach((i) => {
      typeof o[i] == "function" && (n[i] = o[i]), typeof o[i] == "object" && Object.keys(o[i]).forEach((a) => {
        n[i] || (n[i] = {}), n[i][a] = o[i][a];
      });
    }), r.hooks) {
      const i = r.hooks();
      Object.keys(i).forEach((a) => {
        ht[a] || (ht[a] = []), ht[a].push(i[a]);
      });
    }
    r.provides && r.provides(yt);
  }), n;
}
function Mr(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), o = 2; o < n; o++)
    r[o - 2] = arguments[o];
  return (ht[e] || []).forEach((a) => {
    t = a.apply(null, [t, ...r]);
  }), t;
}
function mt(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (ht[e] || []).forEach((i) => {
    i.apply(null, n);
  });
}
function nt() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return yt[e] ? yt[e].apply(null, t) : void 0;
}
function Fr(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || tt();
  if (t)
    return t = at(n, t) || t, ci(Cs.definitions, n, t) || ci(Ne.styles, n, t);
}
const Cs = new Jd(), tp = () => {
  k.autoReplaceSvg = !1, k.observeMutations = !1, mt("noAuto");
}, np = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return Ye ? (mt("beforeI2svg", e), nt("pseudoElements2svg", e), nt("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    k.autoReplaceSvg === !1 && (k.autoReplaceSvg = !0), k.observeMutations = !0, Nd(() => {
      op({
        autoReplaceSvgRoot: t
      }), mt("watch", e);
    });
  }
}, rp = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: at(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = In(e[0]);
      return {
        prefix: n,
        iconName: at(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(k.cssPrefix, "-")) > -1 || e.match(Ed))) {
      const t = Ln(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || tt(),
        iconName: at(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = tt();
      return {
        prefix: t,
        iconName: at(t, e) || e
      };
    }
  }
}, Oe = {
  noAuto: tp,
  config: k,
  dom: np,
  parse: rp,
  library: Cs,
  findIconDefinition: Fr,
  toHtml: Qt
}, op = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = ie
  } = e;
  (Object.keys(Ne.styles).length > 0 || k.autoFetchSvg) && Ye && k.autoReplaceSvg && Oe.dom.i2svg({
    node: t
  });
};
function Mn(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => Qt(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!Ye) return;
      const n = ie.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function ip(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: o,
    styles: i,
    transform: a
  } = e;
  if (go(a) && n.found && !r.found) {
    const {
      width: s,
      height: l
    } = n, c = {
      x: s / l / 2,
      y: 0.5
    };
    o.style = kn(O(O({}, i), {}, {
      "transform-origin": "".concat(c.x + a.x / 16, "em ").concat(c.y + a.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function ap(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: o,
    symbol: i
  } = e;
  const a = i === !0 ? "".concat(t, "-").concat(k.cssPrefix, "-").concat(n) : i;
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
function bo(e) {
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
    titleId: c,
    extra: u,
    watchable: d = !1
  } = e, {
    width: p,
    height: f
  } = n.found ? n : t, m = ad.includes(r), g = [k.replacementClass, o ? "".concat(k.cssPrefix, "-").concat(o) : ""].filter((v) => u.classes.indexOf(v) === -1).filter((v) => v !== "" || !!v).concat(u.classes).join(" ");
  let h = {
    children: [],
    attributes: O(O({}, u.attributes), {}, {
      "data-prefix": r,
      "data-icon": o,
      class: g,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(p, " ").concat(f)
    })
  };
  const b = m && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(p / f * 16 * 0.0625, "em")
  } : {};
  d && (h.attributes[pt] = ""), s && (h.children.push({
    tag: "title",
    attributes: {
      id: h.attributes["aria-labelledby"] || "title-".concat(c || Bt())
    },
    children: [s]
  }), delete h.attributes.title);
  const x = O(O({}, h), {}, {
    prefix: r,
    iconName: o,
    main: t,
    mask: n,
    maskId: l,
    transform: i,
    symbol: a,
    styles: O(O({}, b), u.styles)
  }), {
    children: y,
    attributes: E
  } = n.found && t.found ? nt("generateAbstractMask", x) || {
    children: [],
    attributes: {}
  } : nt("generateAbstractIcon", x) || {
    children: [],
    attributes: {}
  };
  return x.children = y, x.attributes = E, a ? ap(x) : ip(x);
}
function pi(e) {
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
  s && (l[pt] = "");
  const c = O({}, a.styles);
  go(o) && (c.transform = Md({
    transform: o,
    startCentered: !0,
    width: n,
    height: r
  }), c["-webkit-transform"] = c.transform);
  const u = kn(c);
  u.length > 0 && (l.style = u);
  const d = [];
  return d.push({
    tag: "span",
    attributes: l,
    children: [t]
  }), i && d.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [i]
  }), d;
}
function sp(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, o = O(O(O({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), i = kn(r.styles);
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
  styles: Zn
} = Ne;
function _r(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let o = null;
  return Array.isArray(r) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(k.cssPrefix, "-").concat(Xn.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(k.cssPrefix, "-").concat(Xn.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(k.cssPrefix, "-").concat(Xn.PRIMARY),
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
const lp = {
  found: !1,
  width: 512,
  height: 512
};
function cp(e, t) {
  !fs && !k.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Nr(e, t) {
  let n = t;
  return t === "fa" && k.styleDefault !== null && (t = tt()), new Promise((r, o) => {
    if (n === "fa") {
      const i = As(e) || {};
      e = i.iconName || e, t = i.prefix || t;
    }
    if (e && t && Zn[t] && Zn[t][e]) {
      const i = Zn[t][e];
      return r(_r(i));
    }
    cp(e, t), r(O(O({}, lp), {}, {
      icon: k.showMissingIcons && e ? nt("missingIconAbstract") || {} : {}
    }));
  });
}
const mi = () => {
}, Dr = k.measurePerformance && nn && nn.mark && nn.measure ? nn : {
  mark: mi,
  measure: mi
}, Ft = 'FA "6.7.2"', up = (e) => (Dr.mark("".concat(Ft, " ").concat(e, " begins")), () => $s(e)), $s = (e) => {
  Dr.mark("".concat(Ft, " ").concat(e, " ends")), Dr.measure("".concat(Ft, " ").concat(e), "".concat(Ft, " ").concat(e, " begins"), "".concat(Ft, " ").concat(e, " ends"));
};
var yo = {
  begin: up,
  end: $s
};
const ln = () => {
};
function gi(e) {
  return typeof (e.getAttribute ? e.getAttribute(pt) : null) == "string";
}
function fp(e) {
  const t = e.getAttribute ? e.getAttribute(uo) : null, n = e.getAttribute ? e.getAttribute(fo) : null;
  return t && n;
}
function dp(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(k.replacementClass);
}
function pp() {
  return k.autoReplaceSvg === !0 ? cn.replace : cn[k.autoReplaceSvg] || cn.replace;
}
function mp(e) {
  return ie.createElementNS("http://www.w3.org/2000/svg", e);
}
function gp(e) {
  return ie.createElement(e);
}
function Rs(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? mp : gp
  } = t;
  if (typeof e == "string")
    return ie.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(i) {
    r.setAttribute(i, e.attributes[i]);
  }), (e.children || []).forEach(function(i) {
    r.appendChild(Rs(i, {
      ceFn: n
    }));
  }), r;
}
function hp(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const cn = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(Rs(n), t);
      }), t.getAttribute(pt) === null && k.keepOriginalSource) {
        let n = ie.createComment(hp(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~mo(t).indexOf(k.replacementClass))
      return cn.replace(e);
    const r = new RegExp("".concat(k.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const i = n[0].attributes.class.split(" ").reduce((a, s) => (s === k.replacementClass || s.match(r) ? a.toSvg.push(s) : a.toNode.push(s), a), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = i.toSvg.join(" "), i.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", i.toNode.join(" "));
    }
    const o = n.map((i) => Qt(i)).join(`
`);
    t.setAttribute(pt, ""), t.innerHTML = o;
  }
};
function hi(e) {
  e();
}
function ks(e, t) {
  const n = typeof t == "function" ? t : ln;
  if (e.length === 0)
    n();
  else {
    let r = hi;
    k.mutateApproach === yd && (r = et.requestAnimationFrame || hi), r(() => {
      const o = pp(), i = yo.begin("mutate");
      e.map(o), i(), n();
    });
  }
}
let xo = !1;
function Is() {
  xo = !0;
}
function jr() {
  xo = !1;
}
let bn = null;
function vi(e) {
  if (!ri || !k.observeMutations)
    return;
  const {
    treeCallback: t = ln,
    nodeCallback: n = ln,
    pseudoElementsCallback: r = ln,
    observeMutationsRoot: o = ie
  } = e;
  bn = new ri((i) => {
    if (xo) return;
    const a = tt();
    Ct(i).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !gi(s.addedNodes[0]) && (k.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && k.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && gi(s.target) && ~Td.indexOf(s.attributeName))
        if (s.attributeName === "class" && fp(s.target)) {
          const {
            prefix: l,
            iconName: c
          } = Ln(mo(s.target));
          s.target.setAttribute(uo, l || a), c && s.target.setAttribute(fo, c);
        } else dp(s.target) && n(s.target);
    });
  }), Ye && bn.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function vp() {
  bn && bn.disconnect();
}
function bp(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, o) => {
    const i = o.split(":"), a = i[0], s = i.slice(1);
    return a && s.length > 0 && (r[a] = s.join(":").trim()), r;
  }, {})), n;
}
function yp(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = Ln(mo(e));
  return o.prefix || (o.prefix = tt()), t && n && (o.prefix = t, o.iconName = n), o.iconName && o.prefix || (o.prefix && r.length > 0 && (o.iconName = Ud(o.prefix, e.innerText) || vo(o.prefix, Ir(e.innerText))), !o.iconName && k.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function xp(e) {
  const t = Ct(e.attributes).reduce((o, i) => (o.name !== "class" && o.name !== "style" && (o[i.name] = i.value), o), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return k.autoA11y && (n ? t["aria-labelledby"] = "".concat(k.replacementClass, "-title-").concat(r || Bt()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function wp() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: _e,
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
function bi(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: o
  } = yp(e), i = xp(e), a = Mr("parseNodeAttributes", {}, e);
  let s = t.styleParser ? bp(e) : [];
  return O({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: _e,
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
  styles: Ep
} = Ne;
function Ls(e) {
  const t = k.autoReplaceSvg === "nest" ? bi(e, {
    styleParser: !1
  }) : bi(e);
  return ~t.extra.classes.indexOf(ps) ? nt("generateLayersText", e, t) : nt("generateSvgReplacementMutation", e, t);
}
function Op() {
  return [...rd, ...Ar];
}
function yi(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!Ye) return Promise.resolve();
  const n = ie.documentElement.classList, r = (u) => n.add("".concat(ai, "-").concat(u)), o = (u) => n.remove("".concat(ai, "-").concat(u)), i = k.autoFetchSvg ? Op() : as.concat(Object.keys(Ep));
  i.includes("fa") || i.push("fa");
  const a = [".".concat(ps, ":not([").concat(pt, "])")].concat(i.map((u) => ".".concat(u, ":not([").concat(pt, "])"))).join(", ");
  if (a.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = Ct(e.querySelectorAll(a));
  } catch {
  }
  if (s.length > 0)
    r("pending"), o("complete");
  else
    return Promise.resolve();
  const l = yo.begin("onTree"), c = s.reduce((u, d) => {
    try {
      const p = Ls(d);
      p && u.push(p);
    } catch (p) {
      fs || p.name === "MissingIcon" && console.error(p);
    }
    return u;
  }, []);
  return new Promise((u, d) => {
    Promise.all(c).then((p) => {
      ks(p, () => {
        r("active"), r("complete"), o("pending"), typeof t == "function" && t(), l(), u();
      });
    }).catch((p) => {
      l(), d(p);
    });
  });
}
function Sp(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  Ls(e).then((n) => {
    n && ks([n], t);
  });
}
function Tp(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : Fr(t || {});
    let {
      mask: o
    } = n;
    return o && (o = (o || {}).icon ? o : Fr(o || {})), e(r, O(O({}, n), {}, {
      mask: o
    }));
  };
}
const Ap = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = _e,
    symbol: r = !1,
    mask: o = null,
    maskId: i = null,
    title: a = null,
    titleId: s = null,
    classes: l = [],
    attributes: c = {},
    styles: u = {}
  } = t;
  if (!e) return;
  const {
    prefix: d,
    iconName: p,
    icon: f
  } = e;
  return Mn(O({
    type: "icon"
  }, e), () => (mt("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), k.autoA11y && (a ? c["aria-labelledby"] = "".concat(k.replacementClass, "-title-").concat(s || Bt()) : (c["aria-hidden"] = "true", c.focusable = "false")), bo({
    icons: {
      main: _r(f),
      mask: o ? _r(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: d,
    iconName: p,
    transform: O(O({}, _e), n),
    symbol: r,
    title: a,
    maskId: i,
    titleId: s,
    extra: {
      attributes: c,
      styles: u,
      classes: l
    }
  })));
};
var Pp = {
  mixout() {
    return {
      icon: Tp(Ap)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = yi, e.nodeCallback = Sp, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = ie,
        callback: r = () => {
        }
      } = t;
      return yi(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: o,
        titleId: i,
        prefix: a,
        transform: s,
        symbol: l,
        mask: c,
        maskId: u,
        extra: d
      } = n;
      return new Promise((p, f) => {
        Promise.all([Nr(r, a), c.iconName ? Nr(c.iconName, c.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((m) => {
          let [g, h] = m;
          p([t, bo({
            icons: {
              main: g,
              mask: h
            },
            prefix: a,
            iconName: r,
            transform: s,
            symbol: l,
            maskId: u,
            title: o,
            titleId: i,
            extra: d,
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
      const s = kn(a);
      s.length > 0 && (r.style = s);
      let l;
      return go(i) && (l = nt("generateAbstractTransformGrouping", {
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
}, Cp = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return Mn({
          type: "layer"
        }, () => {
          mt("beforeDOMElementCreation", {
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
              class: ["".concat(k.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, $p = {
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
        return Mn({
          type: "counter",
          content: e
        }, () => (mt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), sp({
          content: e.toString(),
          title: n,
          extra: {
            attributes: o,
            styles: i,
            classes: ["".concat(k.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, Rp = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = _e,
          title: r = null,
          classes: o = [],
          attributes: i = {},
          styles: a = {}
        } = t;
        return Mn({
          type: "text",
          content: e
        }, () => (mt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), pi({
          content: e,
          transform: O(O({}, _e), n),
          title: r,
          extra: {
            attributes: i,
            styles: a,
            classes: ["".concat(k.cssPrefix, "-layers-text"), ...o]
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
      if (os) {
        const l = parseInt(getComputedStyle(t).fontSize, 10), c = t.getBoundingClientRect();
        a = c.width / l, s = c.height / l;
      }
      return k.autoA11y && !r && (i.attributes["aria-hidden"] = "true"), Promise.resolve([t, pi({
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
const kp = new RegExp('"', "ug"), xi = [1105920, 1112319], wi = O(O(O(O({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), ed), vd), ud), zr = Object.keys(wi).reduce((e, t) => (e[t.toLowerCase()] = wi[t], e), {}), Ip = Object.keys(zr).reduce((e, t) => {
  const n = zr[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function Lp(e) {
  const t = e.replace(kp, ""), n = jd(t, 0), r = n >= xi[0] && n <= xi[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: Ir(o ? t[0] : t),
    isSecondary: r || o
  };
}
function Mp(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), o = isNaN(r) ? "normal" : r;
  return (zr[n] || {})[o] || Ip[n];
}
function Ei(e, t) {
  const n = "".concat(bd).concat(t.replace(":", "-"));
  return new Promise((r, o) => {
    if (e.getAttribute(n) !== null)
      return r();
    const a = Ct(e.children).filter((p) => p.getAttribute(Cr) === t)[0], s = et.getComputedStyle(e, t), l = s.getPropertyValue("font-family"), c = l.match(Od), u = s.getPropertyValue("font-weight"), d = s.getPropertyValue("content");
    if (a && !c)
      return e.removeChild(a), r();
    if (c && d !== "none" && d !== "") {
      const p = s.getPropertyValue("content");
      let f = Mp(l, u);
      const {
        value: m,
        isSecondary: g
      } = Lp(p), h = c[0].startsWith("FontAwesome");
      let b = vo(f, m), x = b;
      if (h) {
        const y = Vd(m);
        y.iconName && y.prefix && (b = y.iconName, f = y.prefix);
      }
      if (b && !g && (!a || a.getAttribute(uo) !== f || a.getAttribute(fo) !== x)) {
        e.setAttribute(n, x), a && e.removeChild(a);
        const y = wp(), {
          extra: E
        } = y;
        E.attributes[Cr] = t, Nr(b, f).then((v) => {
          const C = bo(O(O({}, y), {}, {
            icons: {
              main: v,
              mask: Ps()
            },
            prefix: f,
            iconName: x,
            extra: E,
            watchable: !0
          })), $ = ie.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore($, e.firstChild) : e.appendChild($), $.outerHTML = C.map((G) => Qt(G)).join(`
`), e.removeAttribute(n), r();
        }).catch(o);
      } else
        r();
    } else
      r();
  });
}
function Fp(e) {
  return Promise.all([Ei(e, "::before"), Ei(e, "::after")]);
}
function _p(e) {
  return e.parentNode !== document.head && !~xd.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Cr) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Oi(e) {
  if (Ye)
    return new Promise((t, n) => {
      const r = Ct(e.querySelectorAll("*")).filter(_p).map(Fp), o = yo.begin("searchPseudoElements");
      Is(), Promise.all(r).then(() => {
        o(), jr(), t();
      }).catch(() => {
        o(), jr(), n();
      });
    });
}
var Np = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Oi, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = ie
      } = t;
      k.searchPseudoElements && Oi(n);
    };
  }
};
let Si = !1;
var Dp = {
  mixout() {
    return {
      dom: {
        unwatch() {
          Is(), Si = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        vi(Mr("mutationObserverCallbacks", {}));
      },
      noAuto() {
        vp();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Si ? jr() : vi(Mr("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Ti = (e) => {
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
var jp = {
  mixout() {
    return {
      parse: {
        transform: (e) => Ti(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = Ti(n)), e;
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
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), l = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), c = "rotate(".concat(r.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(l, " ").concat(c)
      }, d = {
        transform: "translate(".concat(i / 2 * -1, " -256)")
      }, p = {
        outer: a,
        inner: u,
        path: d
      };
      return {
        tag: "g",
        attributes: O({}, p.outer),
        children: [{
          tag: "g",
          attributes: O({}, p.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: O(O({}, n.icon.attributes), p.path)
          }]
        }]
      };
    };
  }
};
const er = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Ai(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function zp(e) {
  return e.tag === "g" ? e.children : [e];
}
var Hp = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? Ln(n.split(" ").map((o) => o.trim())) : Ps();
        return r.prefix || (r.prefix = tt()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        icon: c
      } = o, {
        width: u,
        icon: d
      } = i, p = Ld({
        transform: s,
        containerWidth: u,
        iconWidth: l
      }), f = {
        tag: "rect",
        attributes: O(O({}, er), {}, {
          fill: "white"
        })
      }, m = c.children ? {
        children: c.children.map(Ai)
      } : {}, g = {
        tag: "g",
        attributes: O({}, p.inner),
        children: [Ai(O({
          tag: c.tag,
          attributes: O(O({}, c.attributes), p.path)
        }, m))]
      }, h = {
        tag: "g",
        attributes: O({}, p.outer),
        children: [g]
      }, b = "mask-".concat(a || Bt()), x = "clip-".concat(a || Bt()), y = {
        tag: "mask",
        attributes: O(O({}, er), {}, {
          id: b,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [f, h]
      }, E = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: x
          },
          children: zp(d)
        }, y]
      };
      return n.push(E, {
        tag: "rect",
        attributes: O({
          fill: "currentColor",
          "clip-path": "url(#".concat(x, ")"),
          mask: "url(#".concat(b, ")")
        }, er)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, Wp = {
  provides(e) {
    let t = !1;
    et.matchMedia && (t = et.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
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
}, Bp = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, Up = [_d, Pp, Cp, $p, Rp, Np, Dp, jp, Hp, Wp, Bp];
ep(Up, {
  mixoutsTo: Oe
});
Oe.noAuto;
Oe.config;
Oe.library;
Oe.dom;
const Hr = Oe.parse;
Oe.findIconDefinition;
Oe.toHtml;
const Vp = Oe.icon;
Oe.layer;
Oe.text;
Oe.counter;
var on = { exports: {} }, an = { exports: {} }, te = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Pi;
function Yp() {
  if (Pi) return te;
  Pi = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, i = e ? Symbol.for("react.profiler") : 60114, a = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, d = e ? Symbol.for("react.suspense") : 60113, p = e ? Symbol.for("react.suspense_list") : 60120, f = e ? Symbol.for("react.memo") : 60115, m = e ? Symbol.for("react.lazy") : 60116, g = e ? Symbol.for("react.block") : 60121, h = e ? Symbol.for("react.fundamental") : 60117, b = e ? Symbol.for("react.responder") : 60118, x = e ? Symbol.for("react.scope") : 60119;
  function y(v) {
    if (typeof v == "object" && v !== null) {
      var C = v.$$typeof;
      switch (C) {
        case t:
          switch (v = v.type, v) {
            case l:
            case c:
            case r:
            case i:
            case o:
            case d:
              return v;
            default:
              switch (v = v && v.$$typeof, v) {
                case s:
                case u:
                case m:
                case f:
                case a:
                  return v;
                default:
                  return C;
              }
          }
        case n:
          return C;
      }
    }
  }
  function E(v) {
    return y(v) === c;
  }
  return te.AsyncMode = l, te.ConcurrentMode = c, te.ContextConsumer = s, te.ContextProvider = a, te.Element = t, te.ForwardRef = u, te.Fragment = r, te.Lazy = m, te.Memo = f, te.Portal = n, te.Profiler = i, te.StrictMode = o, te.Suspense = d, te.isAsyncMode = function(v) {
    return E(v) || y(v) === l;
  }, te.isConcurrentMode = E, te.isContextConsumer = function(v) {
    return y(v) === s;
  }, te.isContextProvider = function(v) {
    return y(v) === a;
  }, te.isElement = function(v) {
    return typeof v == "object" && v !== null && v.$$typeof === t;
  }, te.isForwardRef = function(v) {
    return y(v) === u;
  }, te.isFragment = function(v) {
    return y(v) === r;
  }, te.isLazy = function(v) {
    return y(v) === m;
  }, te.isMemo = function(v) {
    return y(v) === f;
  }, te.isPortal = function(v) {
    return y(v) === n;
  }, te.isProfiler = function(v) {
    return y(v) === i;
  }, te.isStrictMode = function(v) {
    return y(v) === o;
  }, te.isSuspense = function(v) {
    return y(v) === d;
  }, te.isValidElementType = function(v) {
    return typeof v == "string" || typeof v == "function" || v === r || v === c || v === i || v === o || v === d || v === p || typeof v == "object" && v !== null && (v.$$typeof === m || v.$$typeof === f || v.$$typeof === a || v.$$typeof === s || v.$$typeof === u || v.$$typeof === h || v.$$typeof === b || v.$$typeof === x || v.$$typeof === g);
  }, te.typeOf = y, te;
}
var ne = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ci;
function Gp() {
  return Ci || (Ci = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, i = e ? Symbol.for("react.profiler") : 60114, a = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, d = e ? Symbol.for("react.suspense") : 60113, p = e ? Symbol.for("react.suspense_list") : 60120, f = e ? Symbol.for("react.memo") : 60115, m = e ? Symbol.for("react.lazy") : 60116, g = e ? Symbol.for("react.block") : 60121, h = e ? Symbol.for("react.fundamental") : 60117, b = e ? Symbol.for("react.responder") : 60118, x = e ? Symbol.for("react.scope") : 60119;
    function y(A) {
      return typeof A == "string" || typeof A == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      A === r || A === c || A === i || A === o || A === d || A === p || typeof A == "object" && A !== null && (A.$$typeof === m || A.$$typeof === f || A.$$typeof === a || A.$$typeof === s || A.$$typeof === u || A.$$typeof === h || A.$$typeof === b || A.$$typeof === x || A.$$typeof === g);
    }
    function E(A) {
      if (typeof A == "object" && A !== null) {
        var Le = A.$$typeof;
        switch (Le) {
          case t:
            var Jt = A.type;
            switch (Jt) {
              case l:
              case c:
              case r:
              case i:
              case o:
              case d:
                return Jt;
              default:
                var Oo = Jt && Jt.$$typeof;
                switch (Oo) {
                  case s:
                  case u:
                  case m:
                  case f:
                  case a:
                    return Oo;
                  default:
                    return Le;
                }
            }
          case n:
            return Le;
        }
      }
    }
    var v = l, C = c, $ = s, G = a, J = t, P = u, _ = r, L = m, K = f, R = n, re = i, Y = o, ee = d, N = !1;
    function B(A) {
      return N || (N = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), w(A) || E(A) === l;
    }
    function w(A) {
      return E(A) === c;
    }
    function S(A) {
      return E(A) === s;
    }
    function j(A) {
      return E(A) === a;
    }
    function M(A) {
      return typeof A == "object" && A !== null && A.$$typeof === t;
    }
    function D(A) {
      return E(A) === u;
    }
    function U(A) {
      return E(A) === r;
    }
    function H(A) {
      return E(A) === m;
    }
    function T(A) {
      return E(A) === f;
    }
    function F(A) {
      return E(A) === n;
    }
    function z(A) {
      return E(A) === i;
    }
    function X(A) {
      return E(A) === o;
    }
    function ye(A) {
      return E(A) === d;
    }
    ne.AsyncMode = v, ne.ConcurrentMode = C, ne.ContextConsumer = $, ne.ContextProvider = G, ne.Element = J, ne.ForwardRef = P, ne.Fragment = _, ne.Lazy = L, ne.Memo = K, ne.Portal = R, ne.Profiler = re, ne.StrictMode = Y, ne.Suspense = ee, ne.isAsyncMode = B, ne.isConcurrentMode = w, ne.isContextConsumer = S, ne.isContextProvider = j, ne.isElement = M, ne.isForwardRef = D, ne.isFragment = U, ne.isLazy = H, ne.isMemo = T, ne.isPortal = F, ne.isProfiler = z, ne.isStrictMode = X, ne.isSuspense = ye, ne.isValidElementType = y, ne.typeOf = E;
  }()), ne;
}
var $i;
function Ms() {
  return $i || ($i = 1, process.env.NODE_ENV === "production" ? an.exports = Yp() : an.exports = Gp()), an.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var tr, Ri;
function qp() {
  if (Ri) return tr;
  Ri = 1;
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
      var l = Object.getOwnPropertyNames(a).map(function(u) {
        return a[u];
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
  return tr = o() ? Object.assign : function(i, a) {
    for (var s, l = r(i), c, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var d in s)
        t.call(s, d) && (l[d] = s[d]);
      if (e) {
        c = e(s);
        for (var p = 0; p < c.length; p++)
          n.call(s, c[p]) && (l[c[p]] = s[c[p]]);
      }
    }
    return l;
  }, tr;
}
var nr, ki;
function wo() {
  if (ki) return nr;
  ki = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return nr = e, nr;
}
var rr, Ii;
function Fs() {
  return Ii || (Ii = 1, rr = Function.call.bind(Object.prototype.hasOwnProperty)), rr;
}
var or, Li;
function Kp() {
  if (Li) return or;
  Li = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ wo(), n = {}, r = /* @__PURE__ */ Fs();
    e = function(i) {
      var a = "Warning: " + i;
      typeof console < "u" && console.error(a);
      try {
        throw new Error(a);
      } catch {
      }
    };
  }
  function o(i, a, s, l, c) {
    if (process.env.NODE_ENV !== "production") {
      for (var u in i)
        if (r(i, u)) {
          var d;
          try {
            if (typeof i[u] != "function") {
              var p = Error(
                (l || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof i[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw p.name = "Invariant Violation", p;
            }
            d = i[u](a, u, l, s, null, t);
          } catch (m) {
            d = m;
          }
          if (d && !(d instanceof Error) && e(
            (l || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof d + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), d instanceof Error && !(d.message in n)) {
            n[d.message] = !0;
            var f = c ? c() : "";
            e(
              "Failed " + s + " type: " + d.message + (f ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, or = o, or;
}
var ir, Mi;
function Xp() {
  if (Mi) return ir;
  Mi = 1;
  var e = Ms(), t = qp(), n = /* @__PURE__ */ wo(), r = /* @__PURE__ */ Fs(), o = /* @__PURE__ */ Kp(), i = function() {
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
  return ir = function(s, l) {
    var c = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function d(w) {
      var S = w && (c && w[c] || w[u]);
      if (typeof S == "function")
        return S;
    }
    var p = "<<anonymous>>", f = {
      array: b("array"),
      bigint: b("bigint"),
      bool: b("boolean"),
      func: b("function"),
      number: b("number"),
      object: b("object"),
      string: b("string"),
      symbol: b("symbol"),
      any: x(),
      arrayOf: y,
      element: E(),
      elementType: v(),
      instanceOf: C,
      node: P(),
      objectOf: G,
      oneOf: $,
      oneOfType: J,
      shape: L,
      exact: K
    };
    function m(w, S) {
      return w === S ? w !== 0 || 1 / w === 1 / S : w !== w && S !== S;
    }
    function g(w, S) {
      this.message = w, this.data = S && typeof S == "object" ? S : {}, this.stack = "";
    }
    g.prototype = Error.prototype;
    function h(w) {
      if (process.env.NODE_ENV !== "production")
        var S = {}, j = 0;
      function M(U, H, T, F, z, X, ye) {
        if (F = F || p, X = X || T, ye !== n) {
          if (l) {
            var A = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw A.name = "Invariant Violation", A;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var Le = F + ":" + T;
            !S[Le] && // Avoid spamming the console because they are often not actionable except for lib authors
            j < 3 && (i(
              "You are manually calling a React.PropTypes validation function for the `" + X + "` prop on `" + F + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), S[Le] = !0, j++);
          }
        }
        return H[T] == null ? U ? H[T] === null ? new g("The " + z + " `" + X + "` is marked as required " + ("in `" + F + "`, but its value is `null`.")) : new g("The " + z + " `" + X + "` is marked as required in " + ("`" + F + "`, but its value is `undefined`.")) : null : w(H, T, F, z, X);
      }
      var D = M.bind(null, !1);
      return D.isRequired = M.bind(null, !0), D;
    }
    function b(w) {
      function S(j, M, D, U, H, T) {
        var F = j[M], z = Y(F);
        if (z !== w) {
          var X = ee(F);
          return new g(
            "Invalid " + U + " `" + H + "` of type " + ("`" + X + "` supplied to `" + D + "`, expected ") + ("`" + w + "`."),
            { expectedType: w }
          );
        }
        return null;
      }
      return h(S);
    }
    function x() {
      return h(a);
    }
    function y(w) {
      function S(j, M, D, U, H) {
        if (typeof w != "function")
          return new g("Property `" + H + "` of component `" + D + "` has invalid PropType notation inside arrayOf.");
        var T = j[M];
        if (!Array.isArray(T)) {
          var F = Y(T);
          return new g("Invalid " + U + " `" + H + "` of type " + ("`" + F + "` supplied to `" + D + "`, expected an array."));
        }
        for (var z = 0; z < T.length; z++) {
          var X = w(T, z, D, U, H + "[" + z + "]", n);
          if (X instanceof Error)
            return X;
        }
        return null;
      }
      return h(S);
    }
    function E() {
      function w(S, j, M, D, U) {
        var H = S[j];
        if (!s(H)) {
          var T = Y(H);
          return new g("Invalid " + D + " `" + U + "` of type " + ("`" + T + "` supplied to `" + M + "`, expected a single ReactElement."));
        }
        return null;
      }
      return h(w);
    }
    function v() {
      function w(S, j, M, D, U) {
        var H = S[j];
        if (!e.isValidElementType(H)) {
          var T = Y(H);
          return new g("Invalid " + D + " `" + U + "` of type " + ("`" + T + "` supplied to `" + M + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return h(w);
    }
    function C(w) {
      function S(j, M, D, U, H) {
        if (!(j[M] instanceof w)) {
          var T = w.name || p, F = B(j[M]);
          return new g("Invalid " + U + " `" + H + "` of type " + ("`" + F + "` supplied to `" + D + "`, expected ") + ("instance of `" + T + "`."));
        }
        return null;
      }
      return h(S);
    }
    function $(w) {
      if (!Array.isArray(w))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? i(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : i("Invalid argument supplied to oneOf, expected an array.")), a;
      function S(j, M, D, U, H) {
        for (var T = j[M], F = 0; F < w.length; F++)
          if (m(T, w[F]))
            return null;
        var z = JSON.stringify(w, function(ye, A) {
          var Le = ee(A);
          return Le === "symbol" ? String(A) : A;
        });
        return new g("Invalid " + U + " `" + H + "` of value `" + String(T) + "` " + ("supplied to `" + D + "`, expected one of " + z + "."));
      }
      return h(S);
    }
    function G(w) {
      function S(j, M, D, U, H) {
        if (typeof w != "function")
          return new g("Property `" + H + "` of component `" + D + "` has invalid PropType notation inside objectOf.");
        var T = j[M], F = Y(T);
        if (F !== "object")
          return new g("Invalid " + U + " `" + H + "` of type " + ("`" + F + "` supplied to `" + D + "`, expected an object."));
        for (var z in T)
          if (r(T, z)) {
            var X = w(T, z, D, U, H + "." + z, n);
            if (X instanceof Error)
              return X;
          }
        return null;
      }
      return h(S);
    }
    function J(w) {
      if (!Array.isArray(w))
        return process.env.NODE_ENV !== "production" && i("Invalid argument supplied to oneOfType, expected an instance of array."), a;
      for (var S = 0; S < w.length; S++) {
        var j = w[S];
        if (typeof j != "function")
          return i(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + N(j) + " at index " + S + "."
          ), a;
      }
      function M(D, U, H, T, F) {
        for (var z = [], X = 0; X < w.length; X++) {
          var ye = w[X], A = ye(D, U, H, T, F, n);
          if (A == null)
            return null;
          A.data && r(A.data, "expectedType") && z.push(A.data.expectedType);
        }
        var Le = z.length > 0 ? ", expected one of type [" + z.join(", ") + "]" : "";
        return new g("Invalid " + T + " `" + F + "` supplied to " + ("`" + H + "`" + Le + "."));
      }
      return h(M);
    }
    function P() {
      function w(S, j, M, D, U) {
        return R(S[j]) ? null : new g("Invalid " + D + " `" + U + "` supplied to " + ("`" + M + "`, expected a ReactNode."));
      }
      return h(w);
    }
    function _(w, S, j, M, D) {
      return new g(
        (w || "React class") + ": " + S + " type `" + j + "." + M + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + D + "`."
      );
    }
    function L(w) {
      function S(j, M, D, U, H) {
        var T = j[M], F = Y(T);
        if (F !== "object")
          return new g("Invalid " + U + " `" + H + "` of type `" + F + "` " + ("supplied to `" + D + "`, expected `object`."));
        for (var z in w) {
          var X = w[z];
          if (typeof X != "function")
            return _(D, U, H, z, ee(X));
          var ye = X(T, z, D, U, H + "." + z, n);
          if (ye)
            return ye;
        }
        return null;
      }
      return h(S);
    }
    function K(w) {
      function S(j, M, D, U, H) {
        var T = j[M], F = Y(T);
        if (F !== "object")
          return new g("Invalid " + U + " `" + H + "` of type `" + F + "` " + ("supplied to `" + D + "`, expected `object`."));
        var z = t({}, j[M], w);
        for (var X in z) {
          var ye = w[X];
          if (r(w, X) && typeof ye != "function")
            return _(D, U, H, X, ee(ye));
          if (!ye)
            return new g(
              "Invalid " + U + " `" + H + "` key `" + X + "` supplied to `" + D + "`.\nBad object: " + JSON.stringify(j[M], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(w), null, "  ")
            );
          var A = ye(T, X, D, U, H + "." + X, n);
          if (A)
            return A;
        }
        return null;
      }
      return h(S);
    }
    function R(w) {
      switch (typeof w) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !w;
        case "object":
          if (Array.isArray(w))
            return w.every(R);
          if (w === null || s(w))
            return !0;
          var S = d(w);
          if (S) {
            var j = S.call(w), M;
            if (S !== w.entries) {
              for (; !(M = j.next()).done; )
                if (!R(M.value))
                  return !1;
            } else
              for (; !(M = j.next()).done; ) {
                var D = M.value;
                if (D && !R(D[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function re(w, S) {
      return w === "symbol" ? !0 : S ? S["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && S instanceof Symbol : !1;
    }
    function Y(w) {
      var S = typeof w;
      return Array.isArray(w) ? "array" : w instanceof RegExp ? "object" : re(S, w) ? "symbol" : S;
    }
    function ee(w) {
      if (typeof w > "u" || w === null)
        return "" + w;
      var S = Y(w);
      if (S === "object") {
        if (w instanceof Date)
          return "date";
        if (w instanceof RegExp)
          return "regexp";
      }
      return S;
    }
    function N(w) {
      var S = ee(w);
      switch (S) {
        case "array":
        case "object":
          return "an " + S;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + S;
        default:
          return S;
      }
    }
    function B(w) {
      return !w.constructor || !w.constructor.name ? p : w.constructor.name;
    }
    return f.checkPropTypes = o, f.resetWarningCache = o.resetWarningCache, f.PropTypes = f, f;
  }, ir;
}
var ar, Fi;
function Qp() {
  if (Fi) return ar;
  Fi = 1;
  var e = /* @__PURE__ */ wo();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, ar = function() {
    function r(a, s, l, c, u, d) {
      if (d !== e) {
        var p = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw p.name = "Invariant Violation", p;
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
  }, ar;
}
var _i;
function Jp() {
  if (_i) return on.exports;
  if (_i = 1, process.env.NODE_ENV !== "production") {
    var e = Ms(), t = !0;
    on.exports = /* @__PURE__ */ Xp()(e.isElement, t);
  } else
    on.exports = /* @__PURE__ */ Qp()();
  return on.exports;
}
var Zp = /* @__PURE__ */ Jp();
const q = /* @__PURE__ */ Vu(Zp);
function Ni(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function Me(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Ni(Object(n), !0).forEach(function(r) {
      vt(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Ni(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function yn(e) {
  "@babel/helpers - typeof";
  return yn = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, yn(e);
}
function vt(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function em(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), o, i;
  for (i = 0; i < r.length; i++)
    o = r[i], !(t.indexOf(o) >= 0) && (n[o] = e[o]);
  return n;
}
function tm(e, t) {
  if (e == null) return {};
  var n = em(e, t), r, o;
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(e);
    for (o = 0; o < i.length; o++)
      r = i[o], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Wr(e) {
  return nm(e) || rm(e) || om(e) || im();
}
function nm(e) {
  if (Array.isArray(e)) return Br(e);
}
function rm(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function om(e, t) {
  if (e) {
    if (typeof e == "string") return Br(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return Br(e, t);
  }
}
function Br(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function im() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function am(e) {
  var t, n = e.beat, r = e.fade, o = e.beatFade, i = e.bounce, a = e.shake, s = e.flash, l = e.spin, c = e.spinPulse, u = e.spinReverse, d = e.pulse, p = e.fixedWidth, f = e.inverse, m = e.border, g = e.listItem, h = e.flip, b = e.size, x = e.rotation, y = e.pull, E = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": o,
    "fa-bounce": i,
    "fa-shake": a,
    "fa-flash": s,
    "fa-spin": l,
    "fa-spin-reverse": u,
    "fa-spin-pulse": c,
    "fa-pulse": d,
    "fa-fw": p,
    "fa-inverse": f,
    "fa-border": m,
    "fa-li": g,
    "fa-flip": h === !0,
    "fa-flip-horizontal": h === "horizontal" || h === "both",
    "fa-flip-vertical": h === "vertical" || h === "both"
  }, vt(t, "fa-".concat(b), typeof b < "u" && b !== null), vt(t, "fa-rotate-".concat(x), typeof x < "u" && x !== null && x !== 0), vt(t, "fa-pull-".concat(y), typeof y < "u" && y !== null), vt(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(E).map(function(v) {
    return E[v] ? v : null;
  }).filter(function(v) {
    return v;
  });
}
function sm(e) {
  return e = e - 0, e === e;
}
function _s(e) {
  return sm(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var lm = ["style"];
function cm(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function um(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), o = _s(n.slice(0, r)), i = n.slice(r + 1).trim();
    return o.startsWith("webkit") ? t[cm(o)] = i : t[o] = i, t;
  }, {});
}
function Ns(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(l) {
    return Ns(e, l);
  }), o = Object.keys(t.attributes || {}).reduce(function(l, c) {
    var u = t.attributes[c];
    switch (c) {
      case "class":
        l.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        l.attrs.style = um(u);
        break;
      default:
        c.indexOf("aria-") === 0 || c.indexOf("data-") === 0 ? l.attrs[c.toLowerCase()] = u : l.attrs[_s(c)] = u;
    }
    return l;
  }, {
    attrs: {}
  }), i = n.style, a = i === void 0 ? {} : i, s = tm(n, lm);
  return o.attrs.style = Me(Me({}, o.attrs.style), a), e.apply(void 0, [t.tag, Me(Me({}, o.attrs), s)].concat(Wr(r)));
}
var Ds = !1;
try {
  Ds = process.env.NODE_ENV === "production";
} catch {
}
function fm() {
  if (!Ds && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Di(e) {
  if (e && yn(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Hr.icon)
    return Hr.icon(e);
  if (e === null)
    return null;
  if (e && yn(e) === "object" && e.prefix && e.iconName)
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
function sr(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? vt({}, e, t) : {};
}
var ji = {
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
}, xn = /* @__PURE__ */ V.forwardRef(function(e, t) {
  var n = Me(Me({}, ji), e), r = n.icon, o = n.mask, i = n.symbol, a = n.className, s = n.title, l = n.titleId, c = n.maskId, u = Di(r), d = sr("classes", [].concat(Wr(am(n)), Wr((a || "").split(" ")))), p = sr("transform", typeof n.transform == "string" ? Hr.transform(n.transform) : n.transform), f = sr("mask", Di(o)), m = Vp(u, Me(Me(Me(Me({}, d), p), f), {}, {
    symbol: i,
    title: s,
    titleId: l,
    maskId: c
  }));
  if (!m)
    return fm("Could not find icon", u), null;
  var g = m.abstract, h = {
    ref: t
  };
  return Object.keys(n).forEach(function(b) {
    ji.hasOwnProperty(b) || (h[b] = n[b]);
  }), dm(g[0], h);
});
xn.displayName = "FontAwesomeIcon";
xn.propTypes = {
  beat: q.bool,
  border: q.bool,
  beatFade: q.bool,
  bounce: q.bool,
  className: q.string,
  fade: q.bool,
  flash: q.bool,
  mask: q.oneOfType([q.object, q.array, q.string]),
  maskId: q.string,
  fixedWidth: q.bool,
  inverse: q.bool,
  flip: q.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: q.oneOfType([q.object, q.array, q.string]),
  listItem: q.bool,
  pull: q.oneOf(["right", "left"]),
  pulse: q.bool,
  rotation: q.oneOf([0, 90, 180, 270]),
  shake: q.bool,
  size: q.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: q.bool,
  spinPulse: q.bool,
  spinReverse: q.bool,
  symbol: q.oneOfType([q.bool, q.string]),
  title: q.string,
  titleId: q.string,
  transform: q.oneOfType([q.string, q.object]),
  swapOpacity: q.bool
};
var dm = Ns.bind(null, V.createElement);
const Eo = "-", pm = (e) => {
  const t = gm(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (a) => {
      const s = a.split(Eo);
      return s[0] === "" && s.length !== 1 && s.shift(), js(s, t) || mm(a);
    },
    getConflictingClassGroupIds: (a, s) => {
      const l = n[a] || [];
      return s && r[a] ? [...l, ...r[a]] : l;
    }
  };
}, js = (e, t) => {
  var a;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], r = t.nextPart.get(n), o = r ? js(e.slice(1), r) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const i = e.join(Eo);
  return (a = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : a.classGroupId;
}, zi = /^\[(.+)\]$/, mm = (e) => {
  if (zi.test(e)) {
    const t = zi.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, gm = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return vm(Object.entries(e.classGroups), n).forEach(([i, a]) => {
    Ur(a, r, i, t);
  }), r;
}, Ur = (e, t, n, r) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const i = o === "" ? t : Hi(t, o);
      i.classGroupId = n;
      return;
    }
    if (typeof o == "function") {
      if (hm(o)) {
        Ur(o(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: n
      });
      return;
    }
    Object.entries(o).forEach(([i, a]) => {
      Ur(a, Hi(t, i), n, r);
    });
  });
}, Hi = (e, t) => {
  let n = e;
  return t.split(Eo).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, hm = (e) => e.isThemeGetter, vm = (e, t) => t ? e.map(([n, r]) => {
  const o = r.map((i) => typeof i == "string" ? t + i : typeof i == "object" ? Object.fromEntries(Object.entries(i).map(([a, s]) => [t + a, s])) : i);
  return [n, o];
}) : e, bm = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const o = (i, a) => {
    n.set(i, a), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(i) {
      let a = n.get(i);
      if (a !== void 0)
        return a;
      if ((a = r.get(i)) !== void 0)
        return o(i, a), a;
    },
    set(i, a) {
      n.has(i) ? n.set(i, a) : o(i, a);
    }
  };
}, zs = "!", ym = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, o = t[0], i = t.length, a = (s) => {
    const l = [];
    let c = 0, u = 0, d;
    for (let h = 0; h < s.length; h++) {
      let b = s[h];
      if (c === 0) {
        if (b === o && (r || s.slice(h, h + i) === t)) {
          l.push(s.slice(u, h)), u = h + i;
          continue;
        }
        if (b === "/") {
          d = h;
          continue;
        }
      }
      b === "[" ? c++ : b === "]" && c--;
    }
    const p = l.length === 0 ? s : s.substring(u), f = p.startsWith(zs), m = f ? p.substring(1) : p, g = d && d > u ? d - u : void 0;
    return {
      modifiers: l,
      hasImportantModifier: f,
      baseClassName: m,
      maybePostfixModifierPosition: g
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: a
  }) : a;
}, xm = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, wm = (e) => ({
  cache: bm(e.cacheSize),
  parseClassName: ym(e),
  ...pm(e)
}), Em = /\s+/, Om = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: o
  } = t, i = [], a = e.trim().split(Em);
  let s = "";
  for (let l = a.length - 1; l >= 0; l -= 1) {
    const c = a[l], {
      modifiers: u,
      hasImportantModifier: d,
      baseClassName: p,
      maybePostfixModifierPosition: f
    } = n(c);
    let m = !!f, g = r(m ? p.substring(0, f) : p);
    if (!g) {
      if (!m) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (g = r(p), !g) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      m = !1;
    }
    const h = xm(u).join(":"), b = d ? h + zs : h, x = b + g;
    if (i.includes(x))
      continue;
    i.push(x);
    const y = o(g, m);
    for (let E = 0; E < y.length; ++E) {
      const v = y[E];
      i.push(b + v);
    }
    s = c + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function Sm() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = Hs(t)) && (r && (r += " "), r += n);
  return r;
}
const Hs = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = Hs(e[r])) && (n && (n += " "), n += t);
  return n;
};
function Tm(e, ...t) {
  let n, r, o, i = a;
  function a(l) {
    const c = t.reduce((u, d) => d(u), e());
    return n = wm(c), r = n.cache.get, o = n.cache.set, i = s, s(l);
  }
  function s(l) {
    const c = r(l);
    if (c)
      return c;
    const u = Om(l, n);
    return o(l, u), u;
  }
  return function() {
    return i(Sm.apply(null, arguments));
  };
}
const oe = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, Ws = /^\[(?:([a-z-]+):)?(.+)\]$/i, Am = /^\d+\/\d+$/, Pm = /* @__PURE__ */ new Set(["px", "full", "screen"]), Cm = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, $m = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Rm = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, km = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Im = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, We = (e) => xt(e) || Pm.has(e) || Am.test(e), qe = (e) => $t(e, "length", zm), xt = (e) => !!e && !Number.isNaN(Number(e)), lr = (e) => $t(e, "number", xt), kt = (e) => !!e && Number.isInteger(Number(e)), Lm = (e) => e.endsWith("%") && xt(e.slice(0, -1)), W = (e) => Ws.test(e), Ke = (e) => Cm.test(e), Mm = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Fm = (e) => $t(e, Mm, Bs), _m = (e) => $t(e, "position", Bs), Nm = /* @__PURE__ */ new Set(["image", "url"]), Dm = (e) => $t(e, Nm, Wm), jm = (e) => $t(e, "", Hm), It = () => !0, $t = (e, t, n) => {
  const r = Ws.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, zm = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  $m.test(e) && !Rm.test(e)
), Bs = () => !1, Hm = (e) => km.test(e), Wm = (e) => Im.test(e), Bm = () => {
  const e = oe("colors"), t = oe("spacing"), n = oe("blur"), r = oe("brightness"), o = oe("borderColor"), i = oe("borderRadius"), a = oe("borderSpacing"), s = oe("borderWidth"), l = oe("contrast"), c = oe("grayscale"), u = oe("hueRotate"), d = oe("invert"), p = oe("gap"), f = oe("gradientColorStops"), m = oe("gradientColorStopPositions"), g = oe("inset"), h = oe("margin"), b = oe("opacity"), x = oe("padding"), y = oe("saturate"), E = oe("scale"), v = oe("sepia"), C = oe("skew"), $ = oe("space"), G = oe("translate"), J = () => ["auto", "contain", "none"], P = () => ["auto", "hidden", "clip", "visible", "scroll"], _ = () => ["auto", W, t], L = () => [W, t], K = () => ["", We, qe], R = () => ["auto", xt, W], re = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], Y = () => ["solid", "dashed", "dotted", "double", "none"], ee = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], N = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], B = () => ["", "0", W], w = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], S = () => [xt, W];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [It],
      spacing: [We, qe],
      blur: ["none", "", Ke, W],
      brightness: S(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Ke, W],
      borderSpacing: L(),
      borderWidth: K(),
      contrast: S(),
      grayscale: B(),
      hueRotate: S(),
      invert: B(),
      gap: L(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Lm, qe],
      inset: _(),
      margin: _(),
      opacity: S(),
      padding: L(),
      saturate: S(),
      scale: S(),
      sepia: B(),
      skew: S(),
      space: L(),
      translate: L()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", W]
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
        columns: [Ke]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": w()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": w()
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
        object: [...re(), W]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: P()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": P()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": P()
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
        inset: [g]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [g]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [g]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [g]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [g]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [g]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [g]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [g]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [g]
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
        z: ["auto", kt, W]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: _()
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
        flex: ["1", "auto", "initial", "none", W]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: B()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: B()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", kt, W]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [It]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", kt, W]
        }, W]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": R()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": R()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [It]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [kt, W]
        }, W]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": R()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": R()
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
        "auto-cols": ["auto", "min", "max", "fr", W]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", W]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [p]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [p]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [p]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...N()]
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
        content: ["normal", ...N(), "baseline"]
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
        "place-content": [...N(), "baseline"]
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
        p: [x]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [x]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [x]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [x]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [x]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [x]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [x]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [x]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [x]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [h]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [h]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [h]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [h]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [h]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [h]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [h]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [h]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [h]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [$]
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
        "space-y": [$]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", W, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [W, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [W, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Ke]
        }, Ke]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [W, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [W, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [W, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [W, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Ke, qe]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", lr]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [It]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", W]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", xt, lr]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", We, W]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", W]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", W]
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
        "placeholder-opacity": [b]
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
        "text-opacity": [b]
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
        decoration: [...Y(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", We, qe]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", We, W]
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
        indent: L()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", W]
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
        content: ["none", W]
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
        "bg-opacity": [b]
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
        bg: [...re(), _m]
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
        bg: ["auto", "cover", "contain", Fm]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, Dm]
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
        from: [m]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [m]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [m]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [f]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [f]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [f]
      }],
      // Borders
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: [i]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [i]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [i]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [i]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [i]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [i]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [i]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [i]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [i]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [i]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [i]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [i]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [i]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [i]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [i]
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
        "border-opacity": [b]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...Y(), "hidden"]
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
        "divide-opacity": [b]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: Y()
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
        outline: ["", ...Y()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [We, W]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [We, qe]
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
        ring: K()
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
        "ring-opacity": [b]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [We, qe]
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
        shadow: ["", "inner", "none", Ke, jm]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [It]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [b]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...ee(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": ee()
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
        "drop-shadow": ["", "none", Ke, W]
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
        invert: [d]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [y]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [v]
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
        "backdrop-invert": [d]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [b]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [y]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [v]
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
        "border-spacing": [a]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [a]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [a]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", W]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: S()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", W]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: S()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", W]
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
        scale: [E]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [E]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [E]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [kt, W]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [G]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [G]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [C]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [C]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", W]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", W]
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
        "scroll-m": L()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": L()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": L()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": L()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": L()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": L()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": L()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": L()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": L()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": L()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": L()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": L()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": L()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": L()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": L()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": L()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": L()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": L()
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
        "will-change": ["auto", "scroll", "contents", "transform", W]
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
        stroke: [We, qe, lr]
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
}, cr = /* @__PURE__ */ Tm(Bm), Xm = ({
  onChange: e,
  options: t,
  placeholder: n,
  value: r,
  id: o,
  className: i
}) => {
  const a = t.find(
    (s) => s.value === r
  ) || { label: n || "" };
  return /* @__PURE__ */ Ae("div", { className: cr("relative", i), children: /* @__PURE__ */ Ae(Wf, { value: r || "", onChange: e, children: ({ open: s }) => /* @__PURE__ */ Fn(So, { children: [
    /* @__PURE__ */ Fn(
      Ja,
      {
        id: o,
        className: "relative h-10 w-full cursor-pointer rounded-md bg-ui-controls text-base-fg border border-ui-controls-border py-2 pl-3 pr-10 text-left outline-none outline-offset-0 transition-all duration-150 ease-in-out sm:text-sm focus:!outline-none hover:bg-ui-controls/80",
        children: [
          /* @__PURE__ */ Ae(
            "span",
            {
              className: cr("block truncate", !r && "opacity-50"),
              children: a.label
            }
          ),
          /* @__PURE__ */ Ae("span", { className: "pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5", children: /* @__PURE__ */ Ae(xn, { icon: Bf, "aria-hidden": "true" }) })
        ]
      }
    ),
    /* @__PURE__ */ Ae(
      wf,
      {
        as: "div",
        show: s,
        leave: "transition ease-in duration-[50ms]",
        leaveFrom: "opacity-100",
        leaveTo: "opacity-0",
        children: /* @__PURE__ */ Ae(Za, { className: "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-ui-panel border border-ui-panel-border py-1.5 text-base shadow-xl focus:outline-none sm:text-sm", children: t.map((l, c) => /* @__PURE__ */ Ae(
          es,
          {
            className: ({ focus: u, selected: d }) => cr(
              "relative cursor-pointer select-none py-2 pl-7 pr-2 transition-all duration-150 ease-in-out",
              u && "bg-ui-controls/50",
              d && "bg-primary/20",
              d ? "text-base-fg" : "text-base-fg/90"
            ),
            value: l.value,
            children: ({ selected: u }) => /* @__PURE__ */ Fn(So, { children: [
              /* @__PURE__ */ Ae(
                "span",
                {
                  className: `block truncate ${u ? "font-medium" : "font-normal"}`,
                  children: l.label
                }
              ),
              u ? /* @__PURE__ */ Ae("span", { className: "absolute inset-y-0 left-0 flex items-center pl-2.5", children: /* @__PURE__ */ Ae(
                xn,
                {
                  icon: Uf,
                  "aria-hidden": "true",
                  className: "text-xs"
                }
              ) }) : null
            ] })
          },
          c
        )) })
      }
    )
  ] }) }) });
};
export {
  Xm as Select
};
