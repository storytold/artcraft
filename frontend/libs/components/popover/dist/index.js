import { jsxs as we, jsx as Q, Fragment as kt } from "react/jsx-runtime";
import * as G from "react";
import ee, { useRef as ie, useCallback as ye, useEffect as be, useState as he, useMemo as ve, useLayoutEffect as Sa, forwardRef as zu, Fragment as tt, isValidElement as Hu, cloneElement as Wu, createElement as Bu, createContext as Ce, useReducer as al, useSyncExternalStore as Yu, useId as On, useContext as Se, createRef as Wr } from "react";
import * as or from "react-dom";
import { createPortal as Vu } from "react-dom";
const il = typeof document < "u" ? ee.useLayoutEffect : () => {
};
function Uu(e) {
  const t = ie(null);
  return il(() => {
    t.current = e;
  }, [
    e
  ]), ye((...n) => {
    const r = t.current;
    return r == null ? void 0 : r(...n);
  }, []);
}
const Ot = (e) => {
  var t;
  return (t = e == null ? void 0 : e.ownerDocument) !== null && t !== void 0 ? t : document;
}, Tt = (e) => e && "window" in e && e.window === e ? e : Ot(e).defaultView || window;
function Gu(e) {
  return e !== null && typeof e == "object" && "nodeType" in e && typeof e.nodeType == "number";
}
function qu(e) {
  return Gu(e) && e.nodeType === Node.DOCUMENT_FRAGMENT_NODE && "host" in e;
}
let Xu = !1;
function Pa() {
  return Xu;
}
function sl(e, t) {
  if (!Pa()) return t && e ? e.contains(t) : !1;
  if (!e || !t) return !1;
  let n = t;
  for (; n !== null; ) {
    if (n === e) return !0;
    n.tagName === "SLOT" && n.assignedSlot ? n = n.assignedSlot.parentNode : qu(n) ? n = n.host : n = n.parentNode;
  }
  return !1;
}
const Oo = (e = document) => {
  var t;
  if (!Pa()) return e.activeElement;
  let n = e.activeElement;
  for (; n && "shadowRoot" in n && (!((t = n.shadowRoot) === null || t === void 0) && t.activeElement); ) n = n.shadowRoot.activeElement;
  return n;
};
function ll(e) {
  return Pa() && e.target.shadowRoot && e.composedPath ? e.composedPath()[0] : e.target;
}
function Ku(e) {
  var t;
  return typeof window > "u" || window.navigator == null ? !1 : ((t = window.navigator.userAgentData) === null || t === void 0 ? void 0 : t.brands.some((n) => e.test(n.brand))) || e.test(window.navigator.userAgent);
}
function Ju(e) {
  var t;
  return typeof window < "u" && window.navigator != null ? e.test(((t = window.navigator.userAgentData) === null || t === void 0 ? void 0 : t.platform) || window.navigator.platform) : !1;
}
function cl(e) {
  let t = null;
  return () => (t == null && (t = e()), t);
}
const Zu = cl(function() {
  return Ju(/^Mac/i);
}), Qu = cl(function() {
  return Ku(/Android/i);
});
function ul() {
  let e = ie(/* @__PURE__ */ new Map()), t = ye((o, a, i, s) => {
    let l = s != null && s.once ? (...c) => {
      e.current.delete(i), i(...c);
    } : i;
    e.current.set(i, {
      type: a,
      eventTarget: o,
      fn: l,
      options: s
    }), o.addEventListener(a, l, s);
  }, []), n = ye((o, a, i, s) => {
    var l;
    let c = ((l = e.current.get(i)) === null || l === void 0 ? void 0 : l.fn) || i;
    o.removeEventListener(a, c, s), e.current.delete(i);
  }, []), r = ye(() => {
    e.current.forEach((o, a) => {
      n(o.eventTarget, o.type, a, o.options);
    });
  }, [
    n
  ]);
  return be(() => r, [
    r
  ]), {
    addGlobalListener: t,
    removeGlobalListener: n,
    removeAllGlobalListeners: r
  };
}
function ef(e) {
  return e.mozInputSource === 0 && e.isTrusted ? !0 : Qu() && e.pointerType ? e.type === "click" && e.buttons === 1 : e.detail === 0 && !e.pointerType;
}
class fl {
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
function dl(e) {
  let t = ie({
    isFocused: !1,
    observer: null
  });
  il(() => {
    const r = t.current;
    return () => {
      r.observer && (r.observer.disconnect(), r.observer = null);
    };
  }, []);
  let n = Uu((r) => {
    e == null || e(r);
  });
  return ye((r) => {
    if (r.target instanceof HTMLButtonElement || r.target instanceof HTMLInputElement || r.target instanceof HTMLTextAreaElement || r.target instanceof HTMLSelectElement) {
      t.current.isFocused = !0;
      let o = r.target, a = (i) => {
        t.current.isFocused = !1, o.disabled && n(new fl("blur", i)), t.current.observer && (t.current.observer.disconnect(), t.current.observer = null);
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
let tf = !1, Mn = null, ko = /* @__PURE__ */ new Set(), yn = /* @__PURE__ */ new Map(), Mt = !1, Ao = !1;
const nf = {
  Tab: !0,
  Escape: !0
};
function Oa(e, t) {
  for (let n of ko) n(e, t);
}
function rf(e) {
  return !(e.metaKey || !Zu() && e.altKey || e.ctrlKey || e.key === "Control" || e.key === "Shift" || e.key === "Meta");
}
function ar(e) {
  Mt = !0, rf(e) && (Mn = "keyboard", Oa("keyboard", e));
}
function Fe(e) {
  Mn = "pointer", (e.type === "mousedown" || e.type === "pointerdown") && (Mt = !0, Oa("pointer", e));
}
function pl(e) {
  ef(e) && (Mt = !0, Mn = "virtual");
}
function ml(e) {
  e.target === window || e.target === document || tf || !e.isTrusted || (!Mt && !Ao && (Mn = "virtual", Oa("virtual", e)), Mt = !1, Ao = !1);
}
function gl() {
  Mt = !1, Ao = !0;
}
function To(e) {
  if (typeof window > "u" || yn.get(Tt(e))) return;
  const t = Tt(e), n = Ot(e);
  let r = t.HTMLElement.prototype.focus;
  t.HTMLElement.prototype.focus = function() {
    Mt = !0, r.apply(this, arguments);
  }, n.addEventListener("keydown", ar, !0), n.addEventListener("keyup", ar, !0), n.addEventListener("click", pl, !0), t.addEventListener("focus", ml, !0), t.addEventListener("blur", gl, !1), typeof PointerEvent < "u" ? (n.addEventListener("pointerdown", Fe, !0), n.addEventListener("pointermove", Fe, !0), n.addEventListener("pointerup", Fe, !0)) : (n.addEventListener("mousedown", Fe, !0), n.addEventListener("mousemove", Fe, !0), n.addEventListener("mouseup", Fe, !0)), t.addEventListener("beforeunload", () => {
    hl(e);
  }, {
    once: !0
  }), yn.set(t, {
    focus: r
  });
}
const hl = (e, t) => {
  const n = Tt(e), r = Ot(e);
  t && r.removeEventListener("DOMContentLoaded", t), yn.has(n) && (n.HTMLElement.prototype.focus = yn.get(n).focus, r.removeEventListener("keydown", ar, !0), r.removeEventListener("keyup", ar, !0), r.removeEventListener("click", pl, !0), n.removeEventListener("focus", ml, !0), n.removeEventListener("blur", gl, !1), typeof PointerEvent < "u" ? (r.removeEventListener("pointerdown", Fe, !0), r.removeEventListener("pointermove", Fe, !0), r.removeEventListener("pointerup", Fe, !0)) : (r.removeEventListener("mousedown", Fe, !0), r.removeEventListener("mousemove", Fe, !0), r.removeEventListener("mouseup", Fe, !0)), yn.delete(n));
};
function of(e) {
  const t = Ot(e);
  let n;
  return t.readyState !== "loading" ? To(e) : (n = () => {
    To(e);
  }, t.addEventListener("DOMContentLoaded", n)), () => hl(e, n);
}
typeof document < "u" && of();
function bl() {
  return Mn !== "pointer";
}
const af = /* @__PURE__ */ new Set([
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
function sf(e, t, n) {
  let r = Ot(n == null ? void 0 : n.target);
  const o = typeof window < "u" ? Tt(n == null ? void 0 : n.target).HTMLInputElement : HTMLInputElement, a = typeof window < "u" ? Tt(n == null ? void 0 : n.target).HTMLTextAreaElement : HTMLTextAreaElement, i = typeof window < "u" ? Tt(n == null ? void 0 : n.target).HTMLElement : HTMLElement, s = typeof window < "u" ? Tt(n == null ? void 0 : n.target).KeyboardEvent : KeyboardEvent;
  return e = e || r.activeElement instanceof o && !af.has(r.activeElement.type) || r.activeElement instanceof a || r.activeElement instanceof i && r.activeElement.isContentEditable, !(e && t === "keyboard" && n instanceof s && !nf[n.key]);
}
function lf(e, t, n) {
  To(), be(() => {
    let r = (o, a) => {
      sf(!!(n != null && n.isTextInput), o, a) && e(bl());
    };
    return ko.add(r), () => {
      ko.delete(r);
    };
  }, t);
}
function cf(e) {
  let { isDisabled: t, onFocus: n, onBlur: r, onFocusChange: o } = e;
  const a = ye((l) => {
    if (l.target === l.currentTarget)
      return r && r(l), o && o(!1), !0;
  }, [
    r,
    o
  ]), i = dl(a), s = ye((l) => {
    const c = Ot(l.target), u = c ? Oo(c) : Oo();
    l.target === l.currentTarget && u === ll(l.nativeEvent) && (n && n(l), o && o(!0), i(l));
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
function uf(e) {
  let { isDisabled: t, onBlurWithin: n, onFocusWithin: r, onFocusWithinChange: o } = e, a = ie({
    isFocusWithin: !1
  }), { addGlobalListener: i, removeAllGlobalListeners: s } = ul(), l = ye((f) => {
    f.currentTarget.contains(f.target) && a.current.isFocusWithin && !f.currentTarget.contains(f.relatedTarget) && (a.current.isFocusWithin = !1, s(), n && n(f), o && o(!1));
  }, [
    n,
    o,
    a,
    s
  ]), c = dl(l), u = ye((f) => {
    if (!f.currentTarget.contains(f.target)) return;
    const d = Ot(f.target), p = Oo(d);
    if (!a.current.isFocusWithin && p === ll(f.nativeEvent)) {
      r && r(f), o && o(!0), a.current.isFocusWithin = !0, c(f);
      let b = f.currentTarget;
      i(d, "focus", (g) => {
        if (a.current.isFocusWithin && !sl(b, g.target)) {
          let m = new fl("blur", new d.defaultView.FocusEvent("blur", {
            relatedTarget: g.target
          }));
          m.target = b, m.currentTarget = b, l(m);
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
let ir = !1, Br = 0;
function Co() {
  ir = !0, setTimeout(() => {
    ir = !1;
  }, 50);
}
function ui(e) {
  e.pointerType === "touch" && Co();
}
function ff() {
  if (!(typeof document > "u"))
    return typeof PointerEvent < "u" ? document.addEventListener("pointerup", ui) : document.addEventListener("touchend", Co), Br++, () => {
      Br--, !(Br > 0) && (typeof PointerEvent < "u" ? document.removeEventListener("pointerup", ui) : document.removeEventListener("touchend", Co));
    };
}
function df(e) {
  let { onHoverStart: t, onHoverChange: n, onHoverEnd: r, isDisabled: o } = e, [a, i] = he(!1), s = ie({
    isHovered: !1,
    ignoreEmulatedMouseEvents: !1,
    pointerType: "",
    target: null
  }).current;
  be(ff, []);
  let { addGlobalListener: l, removeAllGlobalListeners: c } = ul(), { hoverProps: u, triggerHoverEnd: f } = ve(() => {
    let d = (g, m) => {
      if (s.pointerType = m, o || m === "touch" || s.isHovered || !g.currentTarget.contains(g.target)) return;
      s.isHovered = !0;
      let y = g.currentTarget;
      s.target = y, l(Ot(g.target), "pointerover", (E) => {
        s.isHovered && s.target && !sl(s.target, E.target) && p(E, E.pointerType);
      }, {
        capture: !0
      }), t && t({
        type: "hoverstart",
        target: y,
        pointerType: m
      }), n && n(!0), i(!0);
    }, p = (g, m) => {
      let y = s.target;
      s.pointerType = "", s.target = null, !(m === "touch" || !s.isHovered || !y) && (s.isHovered = !1, c(), r && r({
        type: "hoverend",
        target: y,
        pointerType: m
      }), n && n(!1), i(!1));
    }, b = {};
    return typeof PointerEvent < "u" ? (b.onPointerEnter = (g) => {
      ir && g.pointerType === "mouse" || d(g, g.pointerType);
    }, b.onPointerLeave = (g) => {
      !o && g.currentTarget.contains(g.target) && p(g, g.pointerType);
    }) : (b.onTouchStart = () => {
      s.ignoreEmulatedMouseEvents = !0;
    }, b.onMouseEnter = (g) => {
      !s.ignoreEmulatedMouseEvents && !ir && d(g, "mouse"), s.ignoreEmulatedMouseEvents = !1;
    }, b.onMouseLeave = (g) => {
      !o && g.currentTarget.contains(g.target) && p(g, "mouse");
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
  return be(() => {
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
function pf(e = {}) {
  let { autoFocus: t = !1, isTextInput: n, within: r } = e, o = ie({
    isFocused: !1,
    isFocusVisible: t || bl()
  }), [a, i] = he(!1), [s, l] = he(() => o.current.isFocused && o.current.isFocusVisible), c = ye(() => l(o.current.isFocused && o.current.isFocusVisible), []), u = ye((p) => {
    o.current.isFocused = p, i(p), c();
  }, [
    c
  ]);
  lf((p) => {
    o.current.isFocusVisible = p, c();
  }, [], {
    isTextInput: n
  });
  let { focusProps: f } = cf({
    isDisabled: r,
    onFocusChange: u
  }), { focusWithinProps: d } = uf({
    isDisabled: !r,
    onFocusWithinChange: u
  });
  return {
    isFocused: a,
    isFocusVisible: s,
    focusProps: r ? d : f
  };
}
var mf = Object.defineProperty, gf = (e, t, n) => t in e ? mf(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, Yr = (e, t, n) => (gf(e, typeof t != "symbol" ? t + "" : t, n), n);
let hf = class {
  constructor() {
    Yr(this, "current", this.detect()), Yr(this, "handoffState", "pending"), Yr(this, "currentId", 0);
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
}, Rt = new hf();
function Fn(e) {
  var t, n;
  return Rt.isServer ? null : e ? "ownerDocument" in e ? e.ownerDocument : "current" in e ? (n = (t = e.current) == null ? void 0 : t.ownerDocument) != null ? n : document : null : document;
}
function vl(e) {
  typeof queueMicrotask == "function" ? queueMicrotask(e) : Promise.resolve().then(e).catch((t) => setTimeout(() => {
    throw t;
  }));
}
function Wt() {
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
    return vl(() => {
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
    let r = Wt();
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
function vr() {
  let [e] = he(Wt);
  return be(() => () => e.dispose(), [e]), e;
}
let Ee = (e, t) => {
  Rt.isServer ? be(e, t) : Sa(e, t);
};
function nt(e) {
  let t = ie(e);
  return Ee(() => {
    t.current = e;
  }, [e]), t;
}
let ae = function(e) {
  let t = nt(e);
  return ee.useCallback((...n) => t.current(...n), [t]);
};
function bf(e) {
  let t = e.width / 2, n = e.height / 2;
  return { top: e.clientY - n, right: e.clientX + t, bottom: e.clientY + n, left: e.clientX - t };
}
function vf(e, t) {
  return !(!e || !t || e.right < t.left || e.left > t.right || e.bottom < t.top || e.top > t.bottom);
}
function yf({ disabled: e = !1 } = {}) {
  let t = ie(null), [n, r] = he(!1), o = vr(), a = ae(() => {
    t.current = null, r(!1), o.dispose();
  }), i = ae((s) => {
    if (o.dispose(), t.current === null) {
      t.current = s.currentTarget, r(!0);
      {
        let l = Fn(s.currentTarget);
        o.addEventListener(l, "pointerup", a, !1), o.addEventListener(l, "pointermove", (c) => {
          if (t.current) {
            let u = bf(c);
            r(vf(u, t.current.getBoundingClientRect()));
          }
        }, !1), o.addEventListener(l, "pointercancel", a, !1);
      }
    }
  });
  return { pressed: n, pressProps: e ? {} : { onPointerDown: i, onPointerUp: a, onClick: a } };
}
function $o(...e) {
  return Array.from(new Set(e.flatMap((t) => typeof t == "string" ? t.split(" ") : []))).filter(Boolean).join(" ");
}
function Le(e, t, ...n) {
  if (e in t) {
    let o = t[e];
    return typeof o == "function" ? o(...n) : o;
  }
  let r = new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map((o) => `"${o}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(r, Le), r;
}
var Qt = ((e) => (e[e.None = 0] = "None", e[e.RenderStrategy = 1] = "RenderStrategy", e[e.Static = 2] = "Static", e))(Qt || {}), ht = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(ht || {});
function De() {
  let e = wf();
  return ye((t) => xf({ mergeRefs: e, ...t }), [e]);
}
function xf({ ourProps: e, theirProps: t, slot: n, defaultTag: r, features: o, visible: a = !0, name: i, mergeRefs: s }) {
  s = s ?? Ef;
  let l = yl(t, e);
  if (a) return Bn(l, n, r, i, s);
  let c = o ?? 0;
  if (c & 2) {
    let { static: u = !1, ...f } = l;
    if (u) return Bn(f, n, r, i, s);
  }
  if (c & 1) {
    let { unmount: u = !0, ...f } = l;
    return Le(u ? 0 : 1, { 0() {
      return null;
    }, 1() {
      return Bn({ ...f, hidden: !0, style: { display: "none" } }, n, r, i, s);
    } });
  }
  return Bn(l, n, r, i, s);
}
function Bn(e, t = {}, n, r, o) {
  let { as: a = n, children: i, refName: s = "ref", ...l } = Vr(e, ["unmount", "static"]), c = e.ref !== void 0 ? { [s]: e.ref } : {}, u = typeof i == "function" ? i(t) : i;
  "className" in l && l.className && typeof l.className == "function" && (l.className = l.className(t)), l["aria-labelledby"] && l["aria-labelledby"] === l.id && (l["aria-labelledby"] = void 0);
  let f = {};
  if (t) {
    let d = !1, p = [];
    for (let [b, g] of Object.entries(t)) typeof g == "boolean" && (d = !0), g === !0 && p.push(b.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`));
    if (d) {
      f["data-headlessui-state"] = p.join(" ");
      for (let b of p) f[`data-${b}`] = "";
    }
  }
  if (a === tt && (Object.keys(At(l)).length > 0 || Object.keys(At(f)).length > 0)) if (!Hu(u) || Array.isArray(u) && u.length > 1) {
    if (Object.keys(At(l)).length > 0) throw new Error(['Passing props on "Fragment"!', "", `The current component <${r} /> is rendering a "Fragment".`, "However we need to passthrough the following props:", Object.keys(At(l)).concat(Object.keys(At(f))).map((d) => `  - ${d}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".', "Render a single element as the child so that we can forward the props onto that element."].map((d) => `  - ${d}`).join(`
`)].join(`
`));
  } else {
    let d = u.props, p = d == null ? void 0 : d.className, b = typeof p == "function" ? (...y) => $o(p(...y), l.className) : $o(p, l.className), g = b ? { className: b } : {}, m = yl(u.props, At(Vr(l, ["ref"])));
    for (let y in f) y in m && delete f[y];
    return Wu(u, Object.assign({}, m, f, c, { ref: o(Sf(u), c.ref) }, g));
  }
  return Bu(a, Object.assign({}, Vr(l, ["ref"]), a !== tt && c, a !== tt && f), u);
}
function wf() {
  let e = ie([]), t = ye((n) => {
    for (let r of e.current) r != null && (typeof r == "function" ? r(n) : r.current = n);
  }, []);
  return (...n) => {
    if (!n.every((r) => r == null)) return e.current = n, t;
  };
}
function Ef(...e) {
  return e.every((t) => t == null) ? void 0 : (t) => {
    for (let n of e) n != null && (typeof n == "function" ? n(t) : n.current = t);
  };
}
function yl(...e) {
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
function No(...e) {
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
function Ie(e) {
  var t;
  return Object.assign(zu(e), { displayName: (t = e.displayName) != null ? t : e.name });
}
function At(e) {
  let t = Object.assign({}, e);
  for (let n in t) t[n] === void 0 && delete t[n];
  return t;
}
function Vr(e, t = []) {
  let n = Object.assign({}, e);
  for (let r of t) r in n && delete n[r];
  return n;
}
function Sf(e) {
  return ee.version.split(".")[0] >= "19" ? e.props.ref : e.ref;
}
let Pf = "span";
var kn = ((e) => (e[e.None = 1] = "None", e[e.Focusable = 2] = "Focusable", e[e.Hidden = 4] = "Hidden", e))(kn || {});
function Of(e, t) {
  var n;
  let { features: r = 1, ...o } = e, a = { ref: t, "aria-hidden": (r & 2) === 2 ? !0 : (n = o["aria-hidden"]) != null ? n : void 0, hidden: (r & 4) === 4 ? !0 : void 0, style: { position: "fixed", top: 1, left: 1, width: 1, height: 0, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: "0", ...(r & 4) === 4 && (r & 2) !== 2 && { display: "none" } } };
  return De()({ ourProps: a, theirProps: o, slot: {}, defaultTag: Pf, name: "Hidden" });
}
let sr = Ie(Of);
function xl(e) {
  let t = e.parentElement, n = null;
  for (; t && !(t instanceof HTMLFieldSetElement); ) t instanceof HTMLLegendElement && (n = t), t = t.parentElement;
  let r = (t == null ? void 0 : t.getAttribute("disabled")) === "";
  return r && kf(n) ? !1 : r;
}
function kf(e) {
  if (!e) return !1;
  let t = e.previousElementSibling;
  for (; t !== null; ) {
    if (t instanceof HTMLLegendElement) return !1;
    t = t.previousElementSibling;
  }
  return !0;
}
let wl = Symbol();
function El(e, t = !0) {
  return Object.assign(e, { [wl]: t });
}
function je(...e) {
  let t = ie(e);
  be(() => {
    t.current = e;
  }, [e]);
  let n = ae((r) => {
    for (let o of t.current) o != null && (typeof o == "function" ? o(r) : o.current = r);
  });
  return e.every((r) => r == null || (r == null ? void 0 : r[wl])) ? void 0 : n;
}
var gt = ((e) => (e.Space = " ", e.Enter = "Enter", e.Escape = "Escape", e.Backspace = "Backspace", e.Delete = "Delete", e.ArrowLeft = "ArrowLeft", e.ArrowUp = "ArrowUp", e.ArrowRight = "ArrowRight", e.ArrowDown = "ArrowDown", e.Home = "Home", e.End = "End", e.PageUp = "PageUp", e.PageDown = "PageDown", e.Tab = "Tab", e))(gt || {});
let Af = Ce(() => {
});
function Tf({ value: e, children: t }) {
  return ee.createElement(Af.Provider, { value: e }, t);
}
function Cf(e) {
  if (e === null) return { width: 0, height: 0 };
  let { width: t, height: n } = e.getBoundingClientRect();
  return { width: t, height: n };
}
function $f(e, t = !1) {
  let [n, r] = al(() => ({}), {}), o = ve(() => Cf(e), [e, n]);
  return Ee(() => {
    if (!e) return;
    let a = new ResizeObserver(r);
    return a.observe(e), () => {
      a.disconnect();
    };
  }, [e]), t ? { width: `${o.width}px`, height: `${o.height}px` } : o;
}
let Nf = class extends Map {
  constructor(t) {
    super(), this.factory = t;
  }
  get(t) {
    let n = super.get(t);
    return n === void 0 && (n = this.factory(t), this.set(t, n)), n;
  }
};
function Sl(e, t) {
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
function Pl(e) {
  return Yu(e.subscribe, e.getSnapshot, e.getSnapshot);
}
let If = new Nf(() => Sl(() => [], { ADD(e) {
  return this.includes(e) ? this : [...this, e];
}, REMOVE(e) {
  let t = this.indexOf(e);
  if (t === -1) return this;
  let n = this.slice();
  return n.splice(t, 1), n;
} }));
function Ol(e, t) {
  let n = If.get(t), r = On(), o = Pl(n);
  if (Ee(() => {
    if (e) return n.dispatch("ADD", r), () => n.dispatch("REMOVE", r);
  }, [n, e]), !e) return !1;
  let a = o.indexOf(r), i = o.length;
  return a === -1 && (a = i, i += 1), a === i - 1;
}
function Rf(e, t, n) {
  let r = nt((o) => {
    let a = o.getBoundingClientRect();
    a.x === 0 && a.y === 0 && a.width === 0 && a.height === 0 && n();
  });
  be(() => {
    if (!e) return;
    let o = t === null ? null : t instanceof HTMLElement ? t : t.current;
    if (!o) return;
    let a = Wt();
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
let Io = ["[contentEditable=true]", "[tabindex]", "a[href]", "area[href]", "button:not([disabled])", "iframe", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])"].map((e) => `${e}:not([tabindex='-1'])`).join(","), Mf = ["[data-autofocus]"].map((e) => `${e}:not([tabindex='-1'])`).join(",");
var Qe = ((e) => (e[e.First = 1] = "First", e[e.Previous = 2] = "Previous", e[e.Next = 4] = "Next", e[e.Last = 8] = "Last", e[e.WrapAround = 16] = "WrapAround", e[e.NoScroll = 32] = "NoScroll", e[e.AutoFocus = 64] = "AutoFocus", e))(Qe || {}), lr = ((e) => (e[e.Error = 0] = "Error", e[e.Overflow = 1] = "Overflow", e[e.Success = 2] = "Success", e[e.Underflow = 3] = "Underflow", e))(lr || {}), Ff = ((e) => (e[e.Previous = -1] = "Previous", e[e.Next = 1] = "Next", e))(Ff || {});
function yr(e = document.body) {
  return e == null ? [] : Array.from(e.querySelectorAll(Io)).sort((t, n) => Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (n.tabIndex || Number.MAX_SAFE_INTEGER)));
}
function Lf(e = document.body) {
  return e == null ? [] : Array.from(e.querySelectorAll(Mf)).sort((t, n) => Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (n.tabIndex || Number.MAX_SAFE_INTEGER)));
}
var ka = ((e) => (e[e.Strict = 0] = "Strict", e[e.Loose = 1] = "Loose", e))(ka || {});
function kl(e, t = 0) {
  var n;
  return e === ((n = Fn(e)) == null ? void 0 : n.body) ? !1 : Le(t, { 0() {
    return e.matches(Io);
  }, 1() {
    let r = e;
    for (; r !== null; ) {
      if (r.matches(Io)) return !0;
      r = r.parentElement;
    }
    return !1;
  } });
}
var jf = ((e) => (e[e.Keyboard = 0] = "Keyboard", e[e.Mouse = 1] = "Mouse", e))(jf || {});
typeof window < "u" && typeof document < "u" && (document.addEventListener("keydown", (e) => {
  e.metaKey || e.altKey || e.ctrlKey || (document.documentElement.dataset.headlessuiFocusVisible = "");
}, !0), document.addEventListener("click", (e) => {
  e.detail === 1 ? delete document.documentElement.dataset.headlessuiFocusVisible : e.detail === 0 && (document.documentElement.dataset.headlessuiFocusVisible = "");
}, !0));
let _f = ["textarea", "input"].join(",");
function Df(e) {
  var t, n;
  return (n = (t = e == null ? void 0 : e.matches) == null ? void 0 : t.call(e, _f)) != null ? n : !1;
}
function zf(e, t = (n) => n) {
  return e.slice().sort((n, r) => {
    let o = t(n), a = t(r);
    if (o === null || a === null) return 0;
    let i = o.compareDocumentPosition(a);
    return i & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : i & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
  });
}
function Ct(e, t, { sorted: n = !0, relativeTo: r = null, skipElements: o = [] } = {}) {
  let a = Array.isArray(e) ? e.length > 0 ? e[0].ownerDocument : document : e.ownerDocument, i = Array.isArray(e) ? n ? zf(e) : e : t & 64 ? Lf(e) : yr(e);
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
  return t & 6 && Df(d) && d.select(), 2;
}
function Al() {
  return /iPhone/gi.test(window.navigator.platform) || /Mac/gi.test(window.navigator.platform) && window.navigator.maxTouchPoints > 0;
}
function Hf() {
  return /Android/gi.test(window.navigator.userAgent);
}
function Wf() {
  return Al() || Hf();
}
function dn(e, t, n, r) {
  let o = nt(n);
  be(() => {
    if (!e) return;
    function a(i) {
      o.current(i);
    }
    return document.addEventListener(t, a, r), () => document.removeEventListener(t, a, r);
  }, [e, t, r]);
}
function Tl(e, t, n, r) {
  let o = nt(n);
  be(() => {
    if (!e) return;
    function a(i) {
      o.current(i);
    }
    return window.addEventListener(t, a, r), () => window.removeEventListener(t, a, r);
  }, [e, t, r]);
}
const fi = 30;
function Bf(e, t, n) {
  let r = Ol(e, "outside-click"), o = nt(n), a = ye(function(l, c) {
    if (l.defaultPrevented) return;
    let u = c(l);
    if (u === null || !u.getRootNode().contains(u) || !u.isConnected) return;
    let f = function d(p) {
      return typeof p == "function" ? d(p()) : Array.isArray(p) || p instanceof Set ? p : [p];
    }(t);
    for (let d of f) if (d !== null && (d.contains(u) || l.composed && l.composedPath().includes(d))) return;
    return !kl(u, ka.Loose) && u.tabIndex !== -1 && l.preventDefault(), o.current(l, u);
  }, [o, t]), i = ie(null);
  dn(r, "pointerdown", (l) => {
    var c, u;
    i.current = ((u = (c = l.composedPath) == null ? void 0 : c.call(l)) == null ? void 0 : u[0]) || l.target;
  }, !0), dn(r, "mousedown", (l) => {
    var c, u;
    i.current = ((u = (c = l.composedPath) == null ? void 0 : c.call(l)) == null ? void 0 : u[0]) || l.target;
  }, !0), dn(r, "click", (l) => {
    Wf() || i.current && (a(l, () => i.current), i.current = null);
  }, !0);
  let s = ie({ x: 0, y: 0 });
  dn(r, "touchstart", (l) => {
    s.current.x = l.touches[0].clientX, s.current.y = l.touches[0].clientY;
  }, !0), dn(r, "touchend", (l) => {
    let c = { x: l.changedTouches[0].clientX, y: l.changedTouches[0].clientY };
    if (!(Math.abs(c.x - s.current.x) >= fi || Math.abs(c.y - s.current.y) >= fi)) return a(l, () => l.target instanceof HTMLElement ? l.target : null);
  }, !0), Tl(r, "blur", (l) => a(l, () => window.document.activeElement instanceof HTMLIFrameElement ? window.document.activeElement : null), !0);
}
function en(...e) {
  return ve(() => Fn(...e), [...e]);
}
function Yf(e, t, n, r) {
  let o = nt(n);
  be(() => {
    e = e ?? window;
    function a(i) {
      o.current(i);
    }
    return e.addEventListener(t, a, r), () => e.removeEventListener(t, a, r);
  }, [e, t, r]);
}
function Vf(e, t) {
  return ve(() => {
    var n;
    if (e.type) return e.type;
    let r = (n = e.as) != null ? n : "button";
    if (typeof r == "string" && r.toLowerCase() === "button" || (t == null ? void 0 : t.tagName) === "BUTTON" && !t.hasAttribute("type")) return "button";
  }, [e.type, e.as, t]);
}
function Uf() {
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
function Gf() {
  return Al() ? { before({ doc: e, d: t, meta: n }) {
    function r(o) {
      return n.containers.flatMap((a) => a()).some((a) => a.contains(o));
    }
    t.microTask(() => {
      var o;
      if (window.getComputedStyle(e.documentElement).scrollBehavior !== "auto") {
        let s = Wt();
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
function qf() {
  return { before({ doc: e, d: t }) {
    t.style(e.documentElement, "overflow", "hidden");
  } };
}
function Xf(e) {
  let t = {};
  for (let n of e) Object.assign(t, n(t));
  return t;
}
let $t = Sl(() => /* @__PURE__ */ new Map(), { PUSH(e, t) {
  var n;
  let r = (n = this.get(e)) != null ? n : { doc: e, count: 0, d: Wt(), meta: /* @__PURE__ */ new Set() };
  return r.count++, r.meta.add(t), this.set(e, r), this;
}, POP(e, t) {
  let n = this.get(e);
  return n && (n.count--, n.meta.delete(t)), this;
}, SCROLL_PREVENT({ doc: e, d: t, meta: n }) {
  let r = { doc: e, d: t, meta: Xf(n) }, o = [Gf(), Uf(), qf()];
  o.forEach(({ before: a }) => a == null ? void 0 : a(r)), o.forEach(({ after: a }) => a == null ? void 0 : a(r));
}, SCROLL_ALLOW({ d: e }) {
  e.dispose();
}, TEARDOWN({ doc: e }) {
  this.delete(e);
} });
$t.subscribe(() => {
  let e = $t.getSnapshot(), t = /* @__PURE__ */ new Map();
  for (let [n] of e) t.set(n, n.documentElement.style.overflow);
  for (let n of e.values()) {
    let r = t.get(n.doc) === "hidden", o = n.count !== 0;
    (o && !r || !o && r) && $t.dispatch(n.count > 0 ? "SCROLL_PREVENT" : "SCROLL_ALLOW", n), n.count === 0 && $t.dispatch("TEARDOWN", n);
  }
});
function Kf(e, t, n = () => ({ containers: [] })) {
  let r = Pl($t), o = t ? r.get(t) : void 0, a = o ? o.count > 0 : !1;
  return Ee(() => {
    if (!(!t || !e)) return $t.dispatch("PUSH", t, n), () => $t.dispatch("POP", t, n);
  }, [e, t]), a;
}
function Jf(e, t, n = () => [document.body]) {
  let r = Ol(e, "scroll-lock");
  Kf(r, t, (o) => {
    var a;
    return { containers: [...(a = o.containers) != null ? a : [], n] };
  });
}
function Zf(e = 0) {
  let [t, n] = he(e), r = ye((l) => n(l), [t]), o = ye((l) => n((c) => c | l), [t]), a = ye((l) => (t & l) === l, [t]), i = ye((l) => n((c) => c & ~l), [n]), s = ye((l) => n((c) => c ^ l), [n]);
  return { flags: t, setFlag: r, addFlag: o, hasFlag: a, removeFlag: i, toggleFlag: s };
}
var di, pi;
typeof process < "u" && typeof globalThis < "u" && typeof Element < "u" && ((di = process == null ? void 0 : process.env) == null ? void 0 : di.NODE_ENV) === "test" && typeof ((pi = Element == null ? void 0 : Element.prototype) == null ? void 0 : pi.getAnimations) > "u" && (Element.prototype.getAnimations = function() {
  return console.warn(["Headless UI has polyfilled `Element.prototype.getAnimations` for your tests.", "Please install a proper polyfill e.g. `jsdom-testing-mocks`, to silence these warnings.", "", "Example usage:", "```js", "import { mockAnimationsApi } from 'jsdom-testing-mocks'", "mockAnimationsApi()", "```"].join(`
`)), [];
});
var Qf = ((e) => (e[e.None = 0] = "None", e[e.Closed = 1] = "Closed", e[e.Enter = 2] = "Enter", e[e.Leave = 4] = "Leave", e))(Qf || {});
function Aa(e) {
  let t = {};
  for (let n in e) e[n] === !0 && (t[`data-${n}`] = "");
  return t;
}
function Ta(e, t, n, r) {
  let [o, a] = he(n), { hasFlag: i, addFlag: s, removeFlag: l } = Zf(e && o ? 3 : 0), c = ie(!1), u = ie(!1), f = vr();
  return Ee(() => {
    var d;
    if (e) {
      if (n && a(!0), !t) {
        n && s(3);
        return;
      }
      return (d = r == null ? void 0 : r.start) == null || d.call(r, n), ed(t, { inFlight: c, prepare() {
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
function ed(e, { prepare: t, run: n, done: r, inFlight: o }) {
  let a = Wt();
  return nd(e, { prepare: t, inFlight: o }), a.nextFrame(() => {
    n(), a.requestAnimationFrame(() => {
      a.add(td(e, r));
    });
  }), a.dispose;
}
function td(e, t) {
  var n, r;
  let o = Wt();
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
function nd(e, { inFlight: t, prepare: n }) {
  if (t != null && t.current) {
    n();
    return;
  }
  let r = e.style.transition;
  e.style.transition = "none", n(), e.offsetHeight, e.style.transition = r;
}
function xr() {
  return typeof window < "u";
}
function on(e) {
  return Cl(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function Ne(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function qe(e) {
  var t;
  return (t = (Cl(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function Cl(e) {
  return xr() ? e instanceof Node || e instanceof Ne(e).Node : !1;
}
function Oe(e) {
  return xr() ? e instanceof Element || e instanceof Ne(e).Element : !1;
}
function Ge(e) {
  return xr() ? e instanceof HTMLElement || e instanceof Ne(e).HTMLElement : !1;
}
function mi(e) {
  return !xr() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof Ne(e).ShadowRoot;
}
function Ln(e) {
  const {
    overflow: t,
    overflowX: n,
    overflowY: r,
    display: o
  } = _e(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !["inline", "contents"].includes(o);
}
function rd(e) {
  return ["table", "td", "th"].includes(on(e));
}
function wr(e) {
  return [":popover-open", ":modal"].some((t) => {
    try {
      return e.matches(t);
    } catch {
      return !1;
    }
  });
}
function Ca(e) {
  const t = $a(), n = Oe(e) ? _e(e) : e;
  return ["transform", "translate", "scale", "rotate", "perspective"].some((r) => n[r] ? n[r] !== "none" : !1) || (n.containerType ? n.containerType !== "normal" : !1) || !t && (n.backdropFilter ? n.backdropFilter !== "none" : !1) || !t && (n.filter ? n.filter !== "none" : !1) || ["transform", "translate", "scale", "rotate", "perspective", "filter"].some((r) => (n.willChange || "").includes(r)) || ["paint", "layout", "strict", "content"].some((r) => (n.contain || "").includes(r));
}
function od(e) {
  let t = bt(e);
  for (; Ge(t) && !tn(t); ) {
    if (Ca(t))
      return t;
    if (wr(t))
      return null;
    t = bt(t);
  }
  return null;
}
function $a() {
  return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
function tn(e) {
  return ["html", "body", "#document"].includes(on(e));
}
function _e(e) {
  return Ne(e).getComputedStyle(e);
}
function Er(e) {
  return Oe(e) ? {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  } : {
    scrollLeft: e.scrollX,
    scrollTop: e.scrollY
  };
}
function bt(e) {
  if (on(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    mi(e) && e.host || // Fallback.
    qe(e)
  );
  return mi(t) ? t.host : t;
}
function $l(e) {
  const t = bt(e);
  return tn(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : Ge(t) && Ln(t) ? t : $l(t);
}
function An(e, t, n) {
  var r;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const o = $l(e), a = o === ((r = e.ownerDocument) == null ? void 0 : r.body), i = Ne(o);
  if (a) {
    const s = Ro(i);
    return t.concat(i, i.visualViewport || [], Ln(o) ? o : [], s && n ? An(s) : []);
  }
  return t.concat(o, An(o, [], n));
}
function Ro(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function ad() {
  const e = navigator.userAgentData;
  return e && Array.isArray(e.brands) ? e.brands.map((t) => {
    let {
      brand: n,
      version: r
    } = t;
    return n + "/" + r;
  }).join(" ") : navigator.userAgent;
}
const Ft = Math.min, Pe = Math.max, Tn = Math.round, Yn = Math.floor, Ue = (e) => ({
  x: e,
  y: e
}), id = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, sd = {
  start: "end",
  end: "start"
};
function gi(e, t, n) {
  return Pe(e, Ft(t, n));
}
function an(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function vt(e) {
  return e.split("-")[0];
}
function jn(e) {
  return e.split("-")[1];
}
function Nl(e) {
  return e === "x" ? "y" : "x";
}
function Il(e) {
  return e === "y" ? "height" : "width";
}
function Lt(e) {
  return ["top", "bottom"].includes(vt(e)) ? "y" : "x";
}
function Rl(e) {
  return Nl(Lt(e));
}
function ld(e, t, n) {
  n === void 0 && (n = !1);
  const r = jn(e), o = Rl(e), a = Il(o);
  let i = o === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return t.reference[a] > t.floating[a] && (i = cr(i)), [i, cr(i)];
}
function cd(e) {
  const t = cr(e);
  return [Mo(e), t, Mo(t)];
}
function Mo(e) {
  return e.replace(/start|end/g, (t) => sd[t]);
}
function ud(e, t, n) {
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
function fd(e, t, n, r) {
  const o = jn(e);
  let a = ud(vt(e), n === "start", r);
  return o && (a = a.map((i) => i + "-" + o), t && (a = a.concat(a.map(Mo)))), a;
}
function cr(e) {
  return e.replace(/left|right|bottom|top/g, (t) => id[t]);
}
function dd(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function pd(e) {
  return typeof e != "number" ? dd(e) : {
    top: e,
    right: e,
    bottom: e,
    left: e
  };
}
function ur(e) {
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
function hi(e, t, n) {
  let {
    reference: r,
    floating: o
  } = e;
  const a = Lt(t), i = Rl(t), s = Il(i), l = vt(t), c = a === "y", u = r.x + r.width / 2 - o.width / 2, f = r.y + r.height / 2 - o.height / 2, d = r[s] / 2 - o[s] / 2;
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
  switch (jn(t)) {
    case "start":
      p[i] -= d * (n && c ? -1 : 1);
      break;
    case "end":
      p[i] += d * (n && c ? -1 : 1);
      break;
  }
  return p;
}
const md = async (e, t, n) => {
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
  } = hi(c, r, l), d = r, p = {}, b = 0;
  for (let g = 0; g < s.length; g++) {
    const {
      name: m,
      fn: y
    } = s[g], {
      x: E,
      y: w,
      data: P,
      reset: v
    } = await y({
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
    u = E ?? u, f = w ?? f, p = {
      ...p,
      [m]: {
        ...p[m],
        ...P
      }
    }, v && b <= 50 && (b++, typeof v == "object" && (v.placement && (d = v.placement), v.rects && (c = v.rects === !0 ? await i.getElementRects({
      reference: e,
      floating: t,
      strategy: o
    }) : v.rects), {
      x: u,
      y: f
    } = hi(c, d, l)), g = -1);
  }
  return {
    x: u,
    y: f,
    placement: d,
    strategy: o,
    middlewareData: p
  };
};
async function Sr(e, t) {
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
  } = an(t, e), b = pd(p), m = s[d ? f === "floating" ? "reference" : "floating" : f], y = ur(await a.getClippingRect({
    element: (n = await (a.isElement == null ? void 0 : a.isElement(m))) == null || n ? m : m.contextElement || await (a.getDocumentElement == null ? void 0 : a.getDocumentElement(s.floating)),
    boundary: c,
    rootBoundary: u,
    strategy: l
  })), E = f === "floating" ? {
    x: r,
    y: o,
    width: i.floating.width,
    height: i.floating.height
  } : i.reference, w = await (a.getOffsetParent == null ? void 0 : a.getOffsetParent(s.floating)), P = await (a.isElement == null ? void 0 : a.isElement(w)) ? await (a.getScale == null ? void 0 : a.getScale(w)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, v = ur(a.convertOffsetParentRelativeRectToViewportRelativeRect ? await a.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements: s,
    rect: E,
    offsetParent: w,
    strategy: l
  }) : E);
  return {
    top: (y.top - v.top + b.top) / P.y,
    bottom: (v.bottom - y.bottom + b.bottom) / P.y,
    left: (y.left - v.left + b.left) / P.x,
    right: (v.right - y.right + b.right) / P.x
  };
}
const gd = function(e) {
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
        flipAlignment: g = !0,
        ...m
      } = an(e, t);
      if ((n = a.arrow) != null && n.alignmentOffset)
        return {};
      const y = vt(o), E = Lt(s), w = vt(s) === s, P = await (l.isRTL == null ? void 0 : l.isRTL(c.floating)), v = d || (w || !g ? [cr(s)] : cd(s)), H = b !== "none";
      !d && H && v.push(...fd(s, g, b, P));
      const _ = [s, ...v], J = await Sr(t, m), W = [];
      let X = ((r = a.flip) == null ? void 0 : r.overflows) || [];
      if (u && W.push(J[y]), f) {
        const Y = ld(o, i, P);
        W.push(J[Y[0]], J[Y[1]]);
      }
      if (X = [...X, {
        placement: o,
        overflows: W
      }], !W.every((Y) => Y <= 0)) {
        var q, M;
        const Y = (((q = a.flip) == null ? void 0 : q.index) || 0) + 1, K = _[Y];
        if (K)
          return {
            data: {
              index: Y,
              overflows: X
            },
            reset: {
              placement: K
            }
          };
        let j = (M = X.filter((F) => F.overflows[0] <= 0).sort((F, B) => F.overflows[1] - B.overflows[1])[0]) == null ? void 0 : M.placement;
        if (!j)
          switch (p) {
            case "bestFit": {
              var Z;
              const F = (Z = X.filter((B) => {
                if (H) {
                  const N = Lt(B.placement);
                  return N === E || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  N === "y";
                }
                return !0;
              }).map((B) => [B.placement, B.overflows.filter((N) => N > 0).reduce((N, h) => N + h, 0)]).sort((B, N) => B[1] - N[1])[0]) == null ? void 0 : Z[0];
              F && (j = F);
              break;
            }
            case "initialPlacement":
              j = s;
              break;
          }
        if (o !== j)
          return {
            reset: {
              placement: j
            }
          };
      }
      return {};
    }
  };
};
async function hd(e, t) {
  const {
    placement: n,
    platform: r,
    elements: o
  } = e, a = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)), i = vt(n), s = jn(n), l = Lt(n) === "y", c = ["left", "top"].includes(i) ? -1 : 1, u = a && l ? -1 : 1, f = an(t, e);
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
const bd = function(e) {
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
      } = t, l = await hd(t, e);
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
}, vd = function(e) {
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
          fn: (m) => {
            let {
              x: y,
              y: E
            } = m;
            return {
              x: y,
              y: E
            };
          }
        },
        ...l
      } = an(e, t), c = {
        x: n,
        y: r
      }, u = await Sr(t, l), f = Lt(vt(o)), d = Nl(f);
      let p = c[d], b = c[f];
      if (a) {
        const m = d === "y" ? "top" : "left", y = d === "y" ? "bottom" : "right", E = p + u[m], w = p - u[y];
        p = gi(E, p, w);
      }
      if (i) {
        const m = f === "y" ? "top" : "left", y = f === "y" ? "bottom" : "right", E = b + u[m], w = b - u[y];
        b = gi(E, b, w);
      }
      const g = s.fn({
        ...t,
        [d]: p,
        [f]: b
      });
      return {
        ...g,
        data: {
          x: g.x - n,
          y: g.y - r,
          enabled: {
            [d]: a,
            [f]: i
          }
        }
      };
    }
  };
}, yd = function(e) {
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
      } = an(e, t), u = await Sr(t, c), f = vt(o), d = jn(o), p = Lt(o) === "y", {
        width: b,
        height: g
      } = a.floating;
      let m, y;
      f === "top" || f === "bottom" ? (m = f, y = d === (await (i.isRTL == null ? void 0 : i.isRTL(s.floating)) ? "start" : "end") ? "left" : "right") : (y = f, m = d === "end" ? "top" : "bottom");
      const E = g - u.top - u.bottom, w = b - u.left - u.right, P = Ft(g - u[m], E), v = Ft(b - u[y], w), H = !t.middlewareData.shift;
      let _ = P, J = v;
      if ((n = t.middlewareData.shift) != null && n.enabled.x && (J = w), (r = t.middlewareData.shift) != null && r.enabled.y && (_ = E), H && !d) {
        const X = Pe(u.left, 0), q = Pe(u.right, 0), M = Pe(u.top, 0), Z = Pe(u.bottom, 0);
        p ? J = b - 2 * (X !== 0 || q !== 0 ? X + q : Pe(u.left, u.right)) : _ = g - 2 * (M !== 0 || Z !== 0 ? M + Z : Pe(u.top, u.bottom));
      }
      await l({
        ...t,
        availableWidth: J,
        availableHeight: _
      });
      const W = await i.getDimensions(s.floating);
      return b !== W.width || g !== W.height ? {
        reset: {
          rects: !0
        }
      } : {};
    }
  };
};
function Ml(e) {
  const t = _e(e);
  let n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0;
  const o = Ge(e), a = o ? e.offsetWidth : n, i = o ? e.offsetHeight : r, s = Tn(n) !== a || Tn(r) !== i;
  return s && (n = a, r = i), {
    width: n,
    height: r,
    $: s
  };
}
function Na(e) {
  return Oe(e) ? e : e.contextElement;
}
function qt(e) {
  const t = Na(e);
  if (!Ge(t))
    return Ue(1);
  const n = t.getBoundingClientRect(), {
    width: r,
    height: o,
    $: a
  } = Ml(t);
  let i = (a ? Tn(n.width) : n.width) / r, s = (a ? Tn(n.height) : n.height) / o;
  return (!i || !Number.isFinite(i)) && (i = 1), (!s || !Number.isFinite(s)) && (s = 1), {
    x: i,
    y: s
  };
}
const xd = /* @__PURE__ */ Ue(0);
function Fl(e) {
  const t = Ne(e);
  return !$a() || !t.visualViewport ? xd : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function wd(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== Ne(e) ? !1 : t;
}
function jt(e, t, n, r) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const o = e.getBoundingClientRect(), a = Na(e);
  let i = Ue(1);
  t && (r ? Oe(r) && (i = qt(r)) : i = qt(e));
  const s = wd(a, n, r) ? Fl(a) : Ue(0);
  let l = (o.left + s.x) / i.x, c = (o.top + s.y) / i.y, u = o.width / i.x, f = o.height / i.y;
  if (a) {
    const d = Ne(a), p = r && Oe(r) ? Ne(r) : r;
    let b = d, g = Ro(b);
    for (; g && r && p !== b; ) {
      const m = qt(g), y = g.getBoundingClientRect(), E = _e(g), w = y.left + (g.clientLeft + parseFloat(E.paddingLeft)) * m.x, P = y.top + (g.clientTop + parseFloat(E.paddingTop)) * m.y;
      l *= m.x, c *= m.y, u *= m.x, f *= m.y, l += w, c += P, b = Ne(g), g = Ro(b);
    }
  }
  return ur({
    width: u,
    height: f,
    x: l,
    y: c
  });
}
function Ia(e, t) {
  const n = Er(e).scrollLeft;
  return t ? t.left + n : jt(qe(e)).left + n;
}
function Ll(e, t, n) {
  n === void 0 && (n = !1);
  const r = e.getBoundingClientRect(), o = r.left + t.scrollLeft - (n ? 0 : (
    // RTL <body> scrollbar.
    Ia(e, r)
  )), a = r.top + t.scrollTop;
  return {
    x: o,
    y: a
  };
}
function Ed(e) {
  let {
    elements: t,
    rect: n,
    offsetParent: r,
    strategy: o
  } = e;
  const a = o === "fixed", i = qe(r), s = t ? wr(t.floating) : !1;
  if (r === i || s && a)
    return n;
  let l = {
    scrollLeft: 0,
    scrollTop: 0
  }, c = Ue(1);
  const u = Ue(0), f = Ge(r);
  if ((f || !f && !a) && ((on(r) !== "body" || Ln(i)) && (l = Er(r)), Ge(r))) {
    const p = jt(r);
    c = qt(r), u.x = p.x + r.clientLeft, u.y = p.y + r.clientTop;
  }
  const d = i && !f && !a ? Ll(i, l, !0) : Ue(0);
  return {
    width: n.width * c.x,
    height: n.height * c.y,
    x: n.x * c.x - l.scrollLeft * c.x + u.x + d.x,
    y: n.y * c.y - l.scrollTop * c.y + u.y + d.y
  };
}
function Sd(e) {
  return Array.from(e.getClientRects());
}
function Pd(e) {
  const t = qe(e), n = Er(e), r = e.ownerDocument.body, o = Pe(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth), a = Pe(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let i = -n.scrollLeft + Ia(e);
  const s = -n.scrollTop;
  return _e(r).direction === "rtl" && (i += Pe(t.clientWidth, r.clientWidth) - o), {
    width: o,
    height: a,
    x: i,
    y: s
  };
}
function Od(e, t) {
  const n = Ne(e), r = qe(e), o = n.visualViewport;
  let a = r.clientWidth, i = r.clientHeight, s = 0, l = 0;
  if (o) {
    a = o.width, i = o.height;
    const c = $a();
    (!c || c && t === "fixed") && (s = o.offsetLeft, l = o.offsetTop);
  }
  return {
    width: a,
    height: i,
    x: s,
    y: l
  };
}
function kd(e, t) {
  const n = jt(e, !0, t === "fixed"), r = n.top + e.clientTop, o = n.left + e.clientLeft, a = Ge(e) ? qt(e) : Ue(1), i = e.clientWidth * a.x, s = e.clientHeight * a.y, l = o * a.x, c = r * a.y;
  return {
    width: i,
    height: s,
    x: l,
    y: c
  };
}
function bi(e, t, n) {
  let r;
  if (t === "viewport")
    r = Od(e, n);
  else if (t === "document")
    r = Pd(qe(e));
  else if (Oe(t))
    r = kd(t, n);
  else {
    const o = Fl(e);
    r = {
      x: t.x - o.x,
      y: t.y - o.y,
      width: t.width,
      height: t.height
    };
  }
  return ur(r);
}
function jl(e, t) {
  const n = bt(e);
  return n === t || !Oe(n) || tn(n) ? !1 : _e(n).position === "fixed" || jl(n, t);
}
function Ad(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let r = An(e, [], !1).filter((s) => Oe(s) && on(s) !== "body"), o = null;
  const a = _e(e).position === "fixed";
  let i = a ? bt(e) : e;
  for (; Oe(i) && !tn(i); ) {
    const s = _e(i), l = Ca(i);
    !l && s.position === "fixed" && (o = null), (a ? !l && !o : !l && s.position === "static" && !!o && ["absolute", "fixed"].includes(o.position) || Ln(i) && !l && jl(e, i)) ? r = r.filter((u) => u !== i) : o = s, i = bt(i);
  }
  return t.set(e, r), r;
}
function Td(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: r,
    strategy: o
  } = e;
  const i = [...n === "clippingAncestors" ? wr(t) ? [] : Ad(t, this._c) : [].concat(n), r], s = i[0], l = i.reduce((c, u) => {
    const f = bi(t, u, o);
    return c.top = Pe(f.top, c.top), c.right = Ft(f.right, c.right), c.bottom = Ft(f.bottom, c.bottom), c.left = Pe(f.left, c.left), c;
  }, bi(t, s, o));
  return {
    width: l.right - l.left,
    height: l.bottom - l.top,
    x: l.left,
    y: l.top
  };
}
function Cd(e) {
  const {
    width: t,
    height: n
  } = Ml(e);
  return {
    width: t,
    height: n
  };
}
function $d(e, t, n) {
  const r = Ge(t), o = qe(t), a = n === "fixed", i = jt(e, !0, a, t);
  let s = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const l = Ue(0);
  if (r || !r && !a)
    if ((on(t) !== "body" || Ln(o)) && (s = Er(t)), r) {
      const d = jt(t, !0, a, t);
      l.x = d.x + t.clientLeft, l.y = d.y + t.clientTop;
    } else o && (l.x = Ia(o));
  const c = o && !r && !a ? Ll(o, s) : Ue(0), u = i.left + s.scrollLeft - l.x - c.x, f = i.top + s.scrollTop - l.y - c.y;
  return {
    x: u,
    y: f,
    width: i.width,
    height: i.height
  };
}
function Ur(e) {
  return _e(e).position === "static";
}
function vi(e, t) {
  if (!Ge(e) || _e(e).position === "fixed")
    return null;
  if (t)
    return t(e);
  let n = e.offsetParent;
  return qe(e) === n && (n = n.ownerDocument.body), n;
}
function _l(e, t) {
  const n = Ne(e);
  if (wr(e))
    return n;
  if (!Ge(e)) {
    let o = bt(e);
    for (; o && !tn(o); ) {
      if (Oe(o) && !Ur(o))
        return o;
      o = bt(o);
    }
    return n;
  }
  let r = vi(e, t);
  for (; r && rd(r) && Ur(r); )
    r = vi(r, t);
  return r && tn(r) && Ur(r) && !Ca(r) ? n : r || od(e) || n;
}
const Nd = async function(e) {
  const t = this.getOffsetParent || _l, n = this.getDimensions, r = await n(e.floating);
  return {
    reference: $d(e.reference, await t(e.floating), e.strategy),
    floating: {
      x: 0,
      y: 0,
      width: r.width,
      height: r.height
    }
  };
};
function Id(e) {
  return _e(e).direction === "rtl";
}
const Rd = {
  convertOffsetParentRelativeRectToViewportRelativeRect: Ed,
  getDocumentElement: qe,
  getClippingRect: Td,
  getOffsetParent: _l,
  getElementRects: Nd,
  getClientRects: Sd,
  getDimensions: Cd,
  getScale: qt,
  isElement: Oe,
  isRTL: Id
};
function Dl(e, t) {
  return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function Md(e, t) {
  let n = null, r;
  const o = qe(e);
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
    const b = Yn(f), g = Yn(o.clientWidth - (u + d)), m = Yn(o.clientHeight - (f + p)), y = Yn(u), w = {
      rootMargin: -b + "px " + -g + "px " + -m + "px " + -y + "px",
      threshold: Pe(0, Ft(1, l)) || 1
    };
    let P = !0;
    function v(H) {
      const _ = H[0].intersectionRatio;
      if (_ !== l) {
        if (!P)
          return i();
        _ ? i(!1, _) : r = setTimeout(() => {
          i(!1, 1e-7);
        }, 1e3);
      }
      _ === 1 && !Dl(c, e.getBoundingClientRect()) && i(), P = !1;
    }
    try {
      n = new IntersectionObserver(v, {
        ...w,
        // Handle <iframe>s
        root: o.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(v, w);
    }
    n.observe(e);
  }
  return i(!0), a;
}
function Fd(e, t, n, r) {
  r === void 0 && (r = {});
  const {
    ancestorScroll: o = !0,
    ancestorResize: a = !0,
    elementResize: i = typeof ResizeObserver == "function",
    layoutShift: s = typeof IntersectionObserver == "function",
    animationFrame: l = !1
  } = r, c = Na(e), u = o || a ? [...c ? An(c) : [], ...An(t)] : [];
  u.forEach((y) => {
    o && y.addEventListener("scroll", n, {
      passive: !0
    }), a && y.addEventListener("resize", n);
  });
  const f = c && s ? Md(c, n) : null;
  let d = -1, p = null;
  i && (p = new ResizeObserver((y) => {
    let [E] = y;
    E && E.target === c && p && (p.unobserve(t), cancelAnimationFrame(d), d = requestAnimationFrame(() => {
      var w;
      (w = p) == null || w.observe(t);
    })), n();
  }), c && !l && p.observe(c), p.observe(t));
  let b, g = l ? jt(e) : null;
  l && m();
  function m() {
    const y = jt(e);
    g && !Dl(g, y) && n(), g = y, b = requestAnimationFrame(m);
  }
  return n(), () => {
    var y;
    u.forEach((E) => {
      o && E.removeEventListener("scroll", n), a && E.removeEventListener("resize", n);
    }), f == null || f(), (y = p) == null || y.disconnect(), p = null, l && cancelAnimationFrame(b);
  };
}
const Gr = Sr, Ld = bd, jd = vd, _d = gd, Dd = yd, zd = (e, t, n) => {
  const r = /* @__PURE__ */ new Map(), o = {
    platform: Rd,
    ...n
  }, a = {
    ...o.platform,
    _c: r
  };
  return md(e, t, {
    ...o,
    platform: a
  });
};
var Zn = typeof document < "u" ? Sa : be;
function fr(e, t) {
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
        if (!fr(e[r], t[r]))
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
      if (!(a === "_owner" && e.$$typeof) && !fr(e[a], t[a]))
        return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function zl(e) {
  return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function yi(e, t) {
  const n = zl(e);
  return Math.round(t * n) / n;
}
function qr(e) {
  const t = G.useRef(e);
  return Zn(() => {
    t.current = e;
  }), t;
}
function Hd(e) {
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
  } = e, [u, f] = G.useState({
    x: 0,
    y: 0,
    strategy: n,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [d, p] = G.useState(r);
  fr(d, r) || p(r);
  const [b, g] = G.useState(null), [m, y] = G.useState(null), E = G.useCallback((B) => {
    B !== H.current && (H.current = B, g(B));
  }, []), w = G.useCallback((B) => {
    B !== _.current && (_.current = B, y(B));
  }, []), P = a || b, v = i || m, H = G.useRef(null), _ = G.useRef(null), J = G.useRef(u), W = l != null, X = qr(l), q = qr(o), M = qr(c), Z = G.useCallback(() => {
    if (!H.current || !_.current)
      return;
    const B = {
      placement: t,
      strategy: n,
      middleware: d
    };
    q.current && (B.platform = q.current), zd(H.current, _.current, B).then((N) => {
      const h = {
        ...N,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: M.current !== !1
      };
      Y.current && !fr(J.current, h) && (J.current = h, or.flushSync(() => {
        f(h);
      }));
    });
  }, [d, t, n, q, M]);
  Zn(() => {
    c === !1 && J.current.isPositioned && (J.current.isPositioned = !1, f((B) => ({
      ...B,
      isPositioned: !1
    })));
  }, [c]);
  const Y = G.useRef(!1);
  Zn(() => (Y.current = !0, () => {
    Y.current = !1;
  }), []), Zn(() => {
    if (P && (H.current = P), v && (_.current = v), P && v) {
      if (X.current)
        return X.current(P, v, Z);
      Z();
    }
  }, [P, v, Z, X, W]);
  const K = G.useMemo(() => ({
    reference: H,
    floating: _,
    setReference: E,
    setFloating: w
  }), [E, w]), j = G.useMemo(() => ({
    reference: P,
    floating: v
  }), [P, v]), F = G.useMemo(() => {
    const B = {
      position: n,
      left: 0,
      top: 0
    };
    if (!j.floating)
      return B;
    const N = yi(j.floating, u.x), h = yi(j.floating, u.y);
    return s ? {
      ...B,
      transform: "translate(" + N + "px, " + h + "px)",
      ...zl(j.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: n,
      left: N,
      top: h
    };
  }, [n, s, j.floating, u.x, u.y]);
  return G.useMemo(() => ({
    ...u,
    update: Z,
    refs: K,
    elements: j,
    floatingStyles: F
  }), [u, Z, K, j, F]);
}
const Hl = (e, t) => ({
  ...Ld(e),
  options: [e, t]
}), Wd = (e, t) => ({
  ...jd(e),
  options: [e, t]
}), Bd = (e, t) => ({
  ..._d(e),
  options: [e, t]
}), Yd = (e, t) => ({
  ...Dd(e),
  options: [e, t]
}), Wl = {
  ...G
}, Vd = Wl.useInsertionEffect, Ud = Vd || ((e) => e());
function Bl(e) {
  const t = G.useRef(() => {
    if (process.env.NODE_ENV !== "production")
      throw new Error("Cannot call an event handler while rendering.");
  });
  return Ud(() => {
    t.current = e;
  }), G.useCallback(function() {
    for (var n = arguments.length, r = new Array(n), o = 0; o < n; o++)
      r[o] = arguments[o];
    return t.current == null ? void 0 : t.current(...r);
  }, []);
}
var Fo = typeof document < "u" ? Sa : be;
let xi = !1, Gd = 0;
const wi = () => (
  // Ensure the id is unique with multiple independent versions of Floating UI
  // on <React 18
  "floating-ui-" + Math.random().toString(36).slice(2, 6) + Gd++
);
function qd() {
  const [e, t] = G.useState(() => xi ? wi() : void 0);
  return Fo(() => {
    e == null && t(wi());
  }, []), G.useEffect(() => {
    xi = !0;
  }, []), e;
}
const Xd = Wl.useId, Kd = Xd || qd;
let Cn;
process.env.NODE_ENV !== "production" && (Cn = /* @__PURE__ */ new Set());
function Jd() {
  for (var e, t = arguments.length, n = new Array(t), r = 0; r < t; r++)
    n[r] = arguments[r];
  const o = "Floating UI: " + n.join(" ");
  if (!((e = Cn) != null && e.has(o))) {
    var a;
    (a = Cn) == null || a.add(o), console.warn(o);
  }
}
function Zd() {
  for (var e, t = arguments.length, n = new Array(t), r = 0; r < t; r++)
    n[r] = arguments[r];
  const o = "Floating UI: " + n.join(" ");
  if (!((e = Cn) != null && e.has(o))) {
    var a;
    (a = Cn) == null || a.add(o), console.error(o);
  }
}
function Qd() {
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
const ep = /* @__PURE__ */ G.createContext(null), tp = /* @__PURE__ */ G.createContext(null), np = () => {
  var e;
  return ((e = G.useContext(ep)) == null ? void 0 : e.id) || null;
}, rp = () => G.useContext(tp), op = "data-floating-ui-focusable";
function ap(e) {
  const {
    open: t = !1,
    onOpenChange: n,
    elements: r
  } = e, o = Kd(), a = G.useRef({}), [i] = G.useState(() => Qd()), s = np() != null;
  if (process.env.NODE_ENV !== "production") {
    const p = r.reference;
    p && !Oe(p) && Zd("Cannot pass a virtual element to the `elements.reference` option,", "as it must be a real DOM element. Use `refs.setPositionReference()`", "instead.");
  }
  const [l, c] = G.useState(r.reference), u = Bl((p, b, g) => {
    a.current.openEvent = p ? b : void 0, i.emit("openchange", {
      open: p,
      event: b,
      reason: g,
      nested: s
    }), n == null || n(p, b, g);
  }), f = G.useMemo(() => ({
    setPositionReference: c
  }), []), d = G.useMemo(() => ({
    reference: l || r.reference || null,
    floating: r.floating || null,
    domReference: r.reference
  }), [l, r.reference, r.floating]);
  return G.useMemo(() => ({
    dataRef: a,
    open: t,
    onOpenChange: u,
    elements: d,
    events: i,
    floatingId: o,
    refs: f
  }), [t, u, d, i, o, f]);
}
function ip(e) {
  e === void 0 && (e = {});
  const {
    nodeId: t
  } = e, n = ap({
    ...e,
    elements: {
      reference: null,
      floating: null,
      ...e.elements
    }
  }), r = e.rootContext || n, o = r.elements, [a, i] = G.useState(null), [s, l] = G.useState(null), u = (o == null ? void 0 : o.domReference) || a, f = G.useRef(null), d = rp();
  Fo(() => {
    u && (f.current = u);
  }, [u]);
  const p = Hd({
    ...e,
    elements: {
      ...o,
      ...s && {
        reference: s
      }
    }
  }), b = G.useCallback((w) => {
    const P = Oe(w) ? {
      getBoundingClientRect: () => w.getBoundingClientRect(),
      contextElement: w
    } : w;
    l(P), p.refs.setReference(P);
  }, [p.refs]), g = G.useCallback((w) => {
    (Oe(w) || w === null) && (f.current = w, i(w)), (Oe(p.refs.reference.current) || p.refs.reference.current === null || // Don't allow setting virtual elements using the old technique back to
    // `null` to support `positionReference` + an unstable `reference`
    // callback ref.
    w !== null && !Oe(w)) && p.refs.setReference(w);
  }, [p.refs]), m = G.useMemo(() => ({
    ...p.refs,
    setReference: g,
    setPositionReference: b,
    domReference: f
  }), [p.refs, g, b]), y = G.useMemo(() => ({
    ...p.elements,
    domReference: u
  }), [p.elements, u]), E = G.useMemo(() => ({
    ...p,
    ...r,
    refs: m,
    elements: y,
    nodeId: t
  }), [p, m, y, t, r]);
  return Fo(() => {
    r.dataRef.current.floatingContext = E;
    const w = d == null ? void 0 : d.nodesRef.current.find((P) => P.id === t);
    w && (w.context = E);
  }), G.useMemo(() => ({
    ...p,
    context: E,
    refs: m,
    elements: y
  }), [p, m, y, E]);
}
const Ei = "active", Si = "selected";
function Xr(e, t, n) {
  const r = /* @__PURE__ */ new Map(), o = n === "item";
  let a = e;
  if (o && e) {
    const {
      [Ei]: i,
      [Si]: s,
      ...l
    } = e;
    a = l;
  }
  return {
    ...n === "floating" && {
      tabIndex: -1,
      [op]: ""
    },
    ...a,
    ...t.map((i) => {
      const s = i ? i[n] : null;
      return typeof s == "function" ? e ? s(e) : null : s;
    }).concat(e).reduce((i, s) => (s && Object.entries(s).forEach((l) => {
      let [c, u] = l;
      if (!(o && [Ei, Si].includes(c)))
        if (c.indexOf("on") === 0) {
          if (r.has(c) || r.set(c, []), typeof u == "function") {
            var f;
            (f = r.get(c)) == null || f.push(u), i[c] = function() {
              for (var d, p = arguments.length, b = new Array(p), g = 0; g < p; g++)
                b[g] = arguments[g];
              return (d = r.get(c)) == null ? void 0 : d.map((m) => m(...b)).find((m) => m !== void 0);
            };
          }
        } else
          i[c] = u;
    }), i), {})
  };
}
function sp(e) {
  e === void 0 && (e = []);
  const t = e.map((s) => s == null ? void 0 : s.reference), n = e.map((s) => s == null ? void 0 : s.floating), r = e.map((s) => s == null ? void 0 : s.item), o = G.useCallback(
    (s) => Xr(s, e, "reference"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    t
  ), a = G.useCallback(
    (s) => Xr(s, e, "floating"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    n
  ), i = G.useCallback(
    (s) => Xr(s, e, "item"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    r
  );
  return G.useMemo(() => ({
    getReferenceProps: o,
    getFloatingProps: a,
    getItemProps: i
  }), [o, a, i]);
}
function Pi(e, t) {
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
const lp = (e) => ({
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
    } = an(e, t), {
      rects: f,
      elements: {
        floating: d
      }
    } = t, p = n.current[i], b = (c == null ? void 0 : c.current) || d, g = d.clientTop || b.clientTop, m = d.clientTop !== 0, y = b.clientTop !== 0, E = d === b;
    if (process.env.NODE_ENV !== "production" && (t.placement.startsWith("bottom") || Jd('`placement` side must be "bottom" when using the `inner`', "middleware.")), !p)
      return {};
    const w = {
      ...t,
      ...await Hl(-p.offsetTop - d.clientTop - f.reference.height / 2 - p.offsetHeight / 2 - a).fn(t)
    }, P = await Gr(Pi(w, b.scrollHeight + g + d.clientTop), u), v = await Gr(w, {
      ...u,
      elementContext: "reference"
    }), H = Pe(0, P.top), _ = w.y + H, X = (b.scrollHeight > b.clientHeight ? (q) => q : Tn)(Pe(0, b.scrollHeight + (m && E || y ? g * 2 : 0) - H - Pe(0, P.bottom)));
    if (b.style.maxHeight = X + "px", b.scrollTop = H, o) {
      const q = b.offsetHeight < p.offsetHeight * Ft(s, n.current.length) - 1 || v.top >= -l || v.bottom >= -l;
      or.flushSync(() => o(q));
    }
    return r && (r.current = await Gr(Pi({
      ...w,
      y: _
    }, b.offsetHeight + g + d.clientTop), u)), {
      y: _
    };
  }
});
function cp(e, t) {
  const {
    open: n,
    elements: r
  } = e, {
    enabled: o = !0,
    overflowRef: a,
    scrollRef: i,
    onChange: s
  } = t, l = Bl(s), c = G.useRef(!1), u = G.useRef(null), f = G.useRef(null);
  G.useEffect(() => {
    if (!o) return;
    function p(g) {
      if (g.ctrlKey || !b || a.current == null)
        return;
      const m = g.deltaY, y = a.current.top >= -0.5, E = a.current.bottom >= -0.5, w = b.scrollHeight - b.clientHeight, P = m < 0 ? -1 : 1, v = m < 0 ? "max" : "min";
      b.scrollHeight <= b.clientHeight || (!y && m > 0 || !E && m < 0 ? (g.preventDefault(), or.flushSync(() => {
        l((H) => H + Math[v](m, w * P));
      })) : /firefox/i.test(ad()) && (b.scrollTop += m));
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
  const d = G.useMemo(() => ({
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
          (a.current.bottom < -0.5 && b < -1 || a.current.top < -0.5 && b > 1) && or.flushSync(() => l((g) => g + b));
        }
        requestAnimationFrame(() => {
          u.current = p.scrollTop;
        });
      }
    }
  }), [r.floating, l, a, i]);
  return G.useMemo(() => o ? {
    floating: d
  } : {}, [o, d]);
}
let _n = Ce({ styles: void 0, setReference: () => {
}, setFloating: () => {
}, getReferenceProps: () => ({}), getFloatingProps: () => ({}), slot: {} });
_n.displayName = "FloatingContext";
let Ra = Ce(null);
Ra.displayName = "PlacementContext";
function up(e) {
  return ve(() => e ? typeof e == "string" ? { to: e } : e : null, [e]);
}
function fp() {
  return Se(_n).setReference;
}
function dp() {
  let { getFloatingProps: e, slot: t } = Se(_n);
  return ye((...n) => Object.assign({}, e(...n), { "data-anchor": t.anchor }), [e, t]);
}
function pp(e = null) {
  e === !1 && (e = null), typeof e == "string" && (e = { to: e });
  let t = Se(Ra), n = ve(() => e, [JSON.stringify(e, (o, a) => {
    var i;
    return (i = a == null ? void 0 : a.outerHTML) != null ? i : a;
  })]);
  Ee(() => {
    t == null || t(n ?? null);
  }, [t, n]);
  let r = Se(_n);
  return ve(() => [r.setFloating, e ? r.styles : {}], [r.setFloating, e, r.styles]);
}
let Oi = 4;
function mp({ children: e, enabled: t = !0 }) {
  let [n, r] = he(null), [o, a] = he(0), i = ie(null), [s, l] = he(null);
  gp(s);
  let c = t && n !== null && s !== null, { to: u = "bottom", gap: f = 0, offset: d = 0, padding: p = 0, inner: b } = hp(n, s), [g, m = "center"] = u.split(" ");
  Ee(() => {
    c && a(0);
  }, [c]);
  let { refs: y, floatingStyles: E, context: w } = ip({ open: c, placement: g === "selection" ? m === "center" ? "bottom" : `bottom-${m}` : m === "center" ? `${g}` : `${g}-${m}`, strategy: "absolute", transform: !1, middleware: [Hl({ mainAxis: g === "selection" ? 0 : f, crossAxis: d }), Wd({ padding: p }), g !== "selection" && Bd({ padding: p }), g === "selection" && b ? lp({ ...b, padding: p, overflowRef: i, offset: o, minItemsVisible: Oi, referenceOverflowThreshold: p, onFallbackChange(q) {
    var M, Z;
    if (!q) return;
    let Y = w.elements.floating;
    if (!Y) return;
    let K = parseFloat(getComputedStyle(Y).scrollPaddingBottom) || 0, j = Math.min(Oi, Y.childElementCount), F = 0, B = 0;
    for (let N of (Z = (M = w.elements.floating) == null ? void 0 : M.childNodes) != null ? Z : []) if (N instanceof HTMLElement) {
      let h = N.offsetTop, x = h + N.clientHeight + K, k = Y.scrollTop, O = k + Y.clientHeight;
      if (h >= k && x <= O) j--;
      else {
        B = Math.max(0, Math.min(x, O) - Math.max(h, k)), F = N.clientHeight;
        break;
      }
    }
    j >= 1 && a((N) => {
      let h = F * j - B + K;
      return N >= h ? N : h;
    });
  } }) : null, Yd({ padding: p, apply({ availableWidth: q, availableHeight: M, elements: Z }) {
    Object.assign(Z.floating.style, { overflow: "auto", maxWidth: `${q}px`, maxHeight: `min(var(--anchor-max-height, 100vh), ${M}px)` });
  } })].filter(Boolean), whileElementsMounted: Fd }), [P = g, v = m] = w.placement.split("-");
  g === "selection" && (P = "selection");
  let H = ve(() => ({ anchor: [P, v].filter(Boolean).join(" ") }), [P, v]), _ = cp(w, { overflowRef: i, onChange: a }), { getReferenceProps: J, getFloatingProps: W } = sp([_]), X = ae((q) => {
    l(q), y.setFloating(q);
  });
  return G.createElement(Ra.Provider, { value: r }, G.createElement(_n.Provider, { value: { setFloating: X, setReference: y.setReference, styles: E, getReferenceProps: J, getFloatingProps: W, slot: H } }, e));
}
function gp(e) {
  Ee(() => {
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
function hp(e, t) {
  var n, r, o;
  let a = Kr((n = e == null ? void 0 : e.gap) != null ? n : "var(--anchor-gap, 0)", t), i = Kr((r = e == null ? void 0 : e.offset) != null ? r : "var(--anchor-offset, 0)", t), s = Kr((o = e == null ? void 0 : e.padding) != null ? o : "var(--anchor-padding, 0)", t);
  return { ...e, gap: a, offset: i, padding: s };
}
function Kr(e, t, n = void 0) {
  let r = vr(), o = ae((l, c) => {
    if (l == null) return [n, null];
    if (typeof l == "number") return [l, null];
    if (typeof l == "string") {
      if (!c) return [n, null];
      let u = ki(l, c);
      return [u, (f) => {
        let d = Yl(l);
        {
          let p = d.map((b) => window.getComputedStyle(c).getPropertyValue(b));
          r.requestAnimationFrame(function b() {
            r.nextFrame(b);
            let g = !1;
            for (let [y, E] of d.entries()) {
              let w = window.getComputedStyle(c).getPropertyValue(E);
              if (p[y] !== w) {
                p[y] = w, g = !0;
                break;
              }
            }
            if (!g) return;
            let m = ki(l, c);
            u !== m && (f(m), u = m);
          });
        }
        return r.dispose;
      }];
    }
    return [n, null];
  }), a = ve(() => o(e, t)[0], [e, t]), [i = a, s] = he();
  return Ee(() => {
    let [l, c] = o(e, t);
    if (s(l), !!c) return c(s);
  }, [e, t]), i;
}
function Yl(e) {
  let t = /var\((.*)\)/.exec(e);
  if (t) {
    let n = t[1].indexOf(",");
    if (n === -1) return [t[1]];
    let r = t[1].slice(0, n).trim(), o = t[1].slice(n + 1).trim();
    return o ? [r, ...Yl(o)] : [r];
  }
  return [];
}
function ki(e, t) {
  let n = document.createElement("div");
  t.appendChild(n), n.style.setProperty("margin-top", "0px", "important"), n.style.setProperty("margin-top", e, "important");
  let r = parseFloat(window.getComputedStyle(n).marginTop) || 0;
  return t.removeChild(n), r;
}
let Pr = Ce(null);
Pr.displayName = "OpenClosedContext";
var $e = ((e) => (e[e.Open = 1] = "Open", e[e.Closed = 2] = "Closed", e[e.Closing = 4] = "Closing", e[e.Opening = 8] = "Opening", e))($e || {});
function Or() {
  return Se(Pr);
}
function Vl({ value: e, children: t }) {
  return ee.createElement(Pr.Provider, { value: e }, t);
}
function bp({ children: e }) {
  return ee.createElement(Pr.Provider, { value: null }, e);
}
function vp(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
function yp(e) {
  let t = ae(e), n = ie(!1);
  be(() => (n.current = !1, () => {
    n.current = !0, vl(() => {
      n.current && t();
    });
  }), [t]);
}
function xp() {
  let e = typeof document > "u";
  return "useSyncExternalStore" in G ? ((t) => t.useSyncExternalStore)(G)(() => () => {
  }, () => !1, () => !e) : !1;
}
function Ma() {
  let e = xp(), [t, n] = G.useState(Rt.isHandoffComplete);
  return t && Rt.isHandoffComplete === !1 && n(!1), G.useEffect(() => {
    t !== !0 && n(!0);
  }, [t]), G.useEffect(() => Rt.handoff(), []), e ? !1 : t;
}
let wp = Ce(!1);
function Ep() {
  return Se(wp);
}
function Sp(e) {
  let t = Ep(), n = Se(Gl), [r, o] = he(() => {
    var a;
    if (!t && n !== null) return (a = n.current) != null ? a : null;
    if (Rt.isServer) return null;
    let i = e == null ? void 0 : e.getElementById("headlessui-portal-root");
    if (i) return i;
    if (e === null) return null;
    let s = e.createElement("div");
    return s.setAttribute("id", "headlessui-portal-root"), e.body.appendChild(s);
  });
  return be(() => {
    r !== null && (e != null && e.body.contains(r) || e == null || e.body.appendChild(r));
  }, [r, e]), be(() => {
    t || n !== null && o(n.current);
  }, [n, o, t]), r;
}
let Ul = tt, Pp = Ie(function(e, t) {
  let { ownerDocument: n = null, ...r } = e, o = ie(null), a = je(El((p) => {
    o.current = p;
  }), t), i = en(o), s = n ?? i, l = Sp(s), [c] = he(() => {
    var p;
    return Rt.isServer ? null : (p = s == null ? void 0 : s.createElement("div")) != null ? p : null;
  }), u = Se(Lo), f = Ma();
  Ee(() => {
    !l || !c || l.contains(c) || (c.setAttribute("data-headlessui-portal", ""), l.appendChild(c));
  }, [l, c]), Ee(() => {
    if (c && u) return u.register(c);
  }, [u, c]), yp(() => {
    var p;
    !l || !c || (c instanceof Node && l.contains(c) && l.removeChild(c), l.childNodes.length <= 0 && ((p = l.parentElement) == null || p.removeChild(l)));
  });
  let d = De();
  return f ? !l || !c ? null : Vu(d({ ourProps: { ref: a }, theirProps: r, slot: {}, defaultTag: Ul, name: "Portal" }), c) : null;
});
function Op(e, t) {
  let n = je(t), { enabled: r = !0, ownerDocument: o, ...a } = e, i = De();
  return r ? ee.createElement(Pp, { ...a, ownerDocument: o, ref: n }) : i({ ourProps: { ref: n }, theirProps: a, slot: {}, defaultTag: Ul, name: "Portal" });
}
let kp = tt, Gl = Ce(null);
function Ap(e, t) {
  let { target: n, ...r } = e, o = { ref: je(t) }, a = De();
  return ee.createElement(Gl.Provider, { value: n }, a({ ourProps: o, theirProps: r, defaultTag: kp, name: "Popover.Group" }));
}
let Lo = Ce(null);
function Tp() {
  let e = Se(Lo), t = ie([]), n = ae((a) => (t.current.push(a), e && e.register(a), () => r(a))), r = ae((a) => {
    let i = t.current.indexOf(a);
    i !== -1 && t.current.splice(i, 1), e && e.unregister(a);
  }), o = ve(() => ({ register: n, unregister: r, portals: t }), [n, r, t]);
  return [t, ve(() => function({ children: a }) {
    return ee.createElement(Lo.Provider, { value: o }, a);
  }, [o])];
}
let Cp = Ie(Op), $p = Ie(Ap), Np = Object.assign(Cp, { Group: $p });
function Ip({ defaultContainers: e = [], portals: t, mainTreeNode: n } = {}) {
  let r = en(n), o = ae(() => {
    var a, i;
    let s = [];
    for (let l of e) l !== null && (l instanceof HTMLElement ? s.push(l) : "current" in l && l.current instanceof HTMLElement && s.push(l.current));
    if (t != null && t.current) for (let l of t.current) s.push(l);
    for (let l of (a = r == null ? void 0 : r.querySelectorAll("html > *, body > *")) != null ? a : []) l !== document.body && l !== document.head && l instanceof HTMLElement && l.id !== "headlessui-portal-root" && (n && (l.contains(n) || l.contains((i = n == null ? void 0 : n.getRootNode()) == null ? void 0 : i.host)) || s.some((c) => l.contains(c)) || s.push(l));
    return s;
  });
  return { resolveContainers: o, contains: ae((a) => o().some((i) => i.contains(a))) };
}
let ql = Ce(null);
function Xl({ children: e, node: t }) {
  let [n, r] = he(null), o = Kl(t ?? n);
  return ee.createElement(ql.Provider, { value: o }, e, o === null && ee.createElement(sr, { features: kn.Hidden, ref: (a) => {
    var i, s;
    if (a) {
      for (let l of (s = (i = Fn(a)) == null ? void 0 : i.querySelectorAll("html > *, body > *")) != null ? s : []) if (l !== document.body && l !== document.head && l instanceof HTMLElement && l != null && l.contains(a)) {
        r(l);
        break;
      }
    }
  } }));
}
function Kl(e = null) {
  var t;
  return (t = Se(ql)) != null ? t : e;
}
function Rp() {
  let e = ie(!1);
  return Ee(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
}
var et = ((e) => (e[e.Forwards = 0] = "Forwards", e[e.Backwards = 1] = "Backwards", e))(et || {});
function Jl() {
  let e = ie(0);
  return Tl(!0, "keydown", (t) => {
    t.key === "Tab" && (e.current = t.shiftKey ? 1 : 0);
  }, !0), e;
}
function Zl(e) {
  var t;
  return !!(e.enter || e.enterFrom || e.enterTo || e.leave || e.leaveFrom || e.leaveTo) || ((t = e.as) != null ? t : ec) !== tt || ee.Children.count(e.children) === 1;
}
let kr = Ce(null);
kr.displayName = "TransitionContext";
var Mp = ((e) => (e.Visible = "visible", e.Hidden = "hidden", e))(Mp || {});
function Fp() {
  let e = Se(kr);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
function Lp() {
  let e = Se(Ar);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
let Ar = Ce(null);
Ar.displayName = "NestingContext";
function Tr(e) {
  return "children" in e ? Tr(e.children) : e.current.filter(({ el: t }) => t.current !== null).filter(({ state: t }) => t === "visible").length > 0;
}
function Ql(e, t) {
  let n = nt(e), r = ie([]), o = Rp(), a = vr(), i = ae((p, b = ht.Hidden) => {
    let g = r.current.findIndex(({ el: m }) => m === p);
    g !== -1 && (Le(b, { [ht.Unmount]() {
      r.current.splice(g, 1);
    }, [ht.Hidden]() {
      r.current[g].state = "hidden";
    } }), a.microTask(() => {
      var m;
      !Tr(r) && o.current && ((m = n.current) == null || m.call(n));
    }));
  }), s = ae((p) => {
    let b = r.current.find(({ el: g }) => g === p);
    return b ? b.state !== "visible" && (b.state = "visible") : r.current.push({ el: p, state: "visible" }), () => i(p, ht.Unmount);
  }), l = ie([]), c = ie(Promise.resolve()), u = ie({ enter: [], leave: [] }), f = ae((p, b, g) => {
    l.current.splice(0), t && (t.chains.current[b] = t.chains.current[b].filter(([m]) => m !== p)), t == null || t.chains.current[b].push([p, new Promise((m) => {
      l.current.push(m);
    })]), t == null || t.chains.current[b].push([p, new Promise((m) => {
      Promise.all(u.current[b].map(([y, E]) => E)).then(() => m());
    })]), b === "enter" ? c.current = c.current.then(() => t == null ? void 0 : t.wait.current).then(() => g(b)) : g(b);
  }), d = ae((p, b, g) => {
    Promise.all(u.current[b].splice(0).map(([m, y]) => y)).then(() => {
      var m;
      (m = l.current.shift()) == null || m();
    }).then(() => g(b));
  });
  return ve(() => ({ children: r, register: s, unregister: i, onStart: f, onStop: d, wait: c, chains: u }), [s, i, r, f, d, u, c]);
}
let ec = tt, tc = Qt.RenderStrategy;
function jp(e, t) {
  var n, r;
  let { transition: o = !0, beforeEnter: a, afterEnter: i, beforeLeave: s, afterLeave: l, enter: c, enterFrom: u, enterTo: f, entered: d, leave: p, leaveFrom: b, leaveTo: g, ...m } = e, [y, E] = he(null), w = ie(null), P = Zl(e), v = je(...P ? [w, t, E] : t === null ? [] : [t]), H = (n = m.unmount) == null || n ? ht.Unmount : ht.Hidden, { show: _, appear: J, initial: W } = Fp(), [X, q] = he(_ ? "visible" : "hidden"), M = Lp(), { register: Z, unregister: Y } = M;
  Ee(() => Z(w), [Z, w]), Ee(() => {
    if (H === ht.Hidden && w.current) {
      if (_ && X !== "visible") {
        q("visible");
        return;
      }
      return Le(X, { hidden: () => Y(w), visible: () => Z(w) });
    }
  }, [X, w, Z, Y, _, H]);
  let K = Ma();
  Ee(() => {
    if (P && K && X === "visible" && w.current === null) throw new Error("Did you forget to passthrough the `ref` to the actual DOM node?");
  }, [w, X, K, P]);
  let j = W && !J, F = J && _ && W, B = ie(!1), N = Ql(() => {
    B.current || (q("hidden"), Y(w));
  }, M), h = ae(($) => {
    B.current = !0;
    let L = $ ? "enter" : "leave";
    N.onStart(w, L, (D) => {
      D === "enter" ? a == null || a() : D === "leave" && (s == null || s());
    });
  }), x = ae(($) => {
    let L = $ ? "enter" : "leave";
    B.current = !1, N.onStop(w, L, (D) => {
      D === "enter" ? i == null || i() : D === "leave" && (l == null || l());
    }), L === "leave" && !Tr(N) && (q("hidden"), Y(w));
  });
  be(() => {
    P && o || (h(_), x(_));
  }, [_, P, o]);
  let k = !(!o || !P || !K || j), [, O] = Ta(k, y, _, { start: h, end: x }), A = At({ ref: v, className: ((r = $o(m.className, F && c, F && u, O.enter && c, O.enter && O.closed && u, O.enter && !O.closed && f, O.leave && p, O.leave && !O.closed && b, O.leave && O.closed && g, !O.transition && _ && d)) == null ? void 0 : r.trim()) || void 0, ...Aa(O) }), I = 0;
  X === "visible" && (I |= $e.Open), X === "hidden" && (I |= $e.Closed), _ && X === "hidden" && (I |= $e.Opening), !_ && X === "visible" && (I |= $e.Closing);
  let R = De();
  return ee.createElement(Ar.Provider, { value: N }, ee.createElement(Vl, { value: I }, R({ ourProps: A, theirProps: m, defaultTag: ec, features: tc, visible: X === "visible", name: "Transition.Child" })));
}
function _p(e, t) {
  let { show: n, appear: r = !1, unmount: o = !0, ...a } = e, i = ie(null), s = Zl(e), l = je(...s ? [i, t] : t === null ? [] : [t]);
  Ma();
  let c = Or();
  if (n === void 0 && c !== null && (n = (c & $e.Open) === $e.Open), n === void 0) throw new Error("A <Transition /> is used but it is missing a `show={true | false}` prop.");
  let [u, f] = he(n ? "visible" : "hidden"), d = Ql(() => {
    n || f("hidden");
  }), [p, b] = he(!0), g = ie([n]);
  Ee(() => {
    p !== !1 && g.current[g.current.length - 1] !== n && (g.current.push(n), b(!1));
  }, [g, n]);
  let m = ve(() => ({ show: n, appear: r, initial: p }), [n, r, p]);
  Ee(() => {
    n ? f("visible") : !Tr(d) && i.current !== null && f("hidden");
  }, [n, d]);
  let y = { unmount: o }, E = ae(() => {
    var v;
    p && b(!1), (v = e.beforeEnter) == null || v.call(e);
  }), w = ae(() => {
    var v;
    p && b(!1), (v = e.beforeLeave) == null || v.call(e);
  }), P = De();
  return ee.createElement(Ar.Provider, { value: d }, ee.createElement(kr.Provider, { value: m }, P({ ourProps: { ...y, as: tt, children: ee.createElement(nc, { ref: l, ...y, ...a, beforeEnter: E, beforeLeave: w }) }, theirProps: {}, defaultTag: tt, features: tc, visible: u === "visible", name: "Transition" })));
}
function Dp(e, t) {
  let n = Se(kr) !== null, r = Or() !== null;
  return ee.createElement(ee.Fragment, null, !n && r ? ee.createElement(jo, { ref: t, ...e }) : ee.createElement(nc, { ref: t, ...e }));
}
let jo = Ie(_p), nc = Ie(jp), zp = Ie(Dp), Hp = Object.assign(jo, { Child: zp, Root: jo });
var Wp = ((e) => (e[e.Open = 0] = "Open", e[e.Closed = 1] = "Closed", e))(Wp || {}), Bp = ((e) => (e[e.TogglePopover = 0] = "TogglePopover", e[e.ClosePopover = 1] = "ClosePopover", e[e.SetButton = 2] = "SetButton", e[e.SetButtonId = 3] = "SetButtonId", e[e.SetPanel = 4] = "SetPanel", e[e.SetPanelId = 5] = "SetPanelId", e))(Bp || {});
let Yp = { 0: (e) => ({ ...e, popoverState: Le(e.popoverState, { 0: 1, 1: 0 }), __demoMode: !1 }), 1(e) {
  return e.popoverState === 1 ? e : { ...e, popoverState: 1, __demoMode: !1 };
}, 2(e, t) {
  return e.button === t.button ? e : { ...e, button: t.button };
}, 3(e, t) {
  return e.buttonId === t.buttonId ? e : { ...e, buttonId: t.buttonId };
}, 4(e, t) {
  return e.panel === t.panel ? e : { ...e, panel: t.panel };
}, 5(e, t) {
  return e.panelId === t.panelId ? e : { ...e, panelId: t.panelId };
} }, Fa = Ce(null);
Fa.displayName = "PopoverContext";
function Cr(e) {
  let t = Se(Fa);
  if (t === null) {
    let n = new Error(`<${e} /> is missing a parent <Popover /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(n, Cr), n;
  }
  return t;
}
let $r = Ce(null);
$r.displayName = "PopoverAPIContext";
function La(e) {
  let t = Se($r);
  if (t === null) {
    let n = new Error(`<${e} /> is missing a parent <Popover /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(n, La), n;
  }
  return t;
}
let ja = Ce(null);
ja.displayName = "PopoverGroupContext";
function rc() {
  return Se(ja);
}
let Nr = Ce(null);
Nr.displayName = "PopoverPanelContext";
function Vp() {
  return Se(Nr);
}
function Up(e, t) {
  return Le(t.type, Yp, e, t);
}
let Gp = "div";
function qp(e, t) {
  var n;
  let { __demoMode: r = !1, ...o } = e, a = ie(null), i = je(t, El((N) => {
    a.current = N;
  })), s = ie([]), l = al(Up, { __demoMode: r, popoverState: r ? 0 : 1, buttons: s, button: null, buttonId: null, panel: null, panelId: null, beforePanelSentinel: Wr(), afterPanelSentinel: Wr(), afterButtonSentinel: Wr() }), [{ popoverState: c, button: u, buttonId: f, panel: d, panelId: p, beforePanelSentinel: b, afterPanelSentinel: g, afterButtonSentinel: m }, y] = l, E = en((n = a.current) != null ? n : u), w = ve(() => {
    if (!u || !d) return !1;
    for (let I of document.querySelectorAll("body > *")) if (Number(I == null ? void 0 : I.contains(u)) ^ Number(I == null ? void 0 : I.contains(d))) return !0;
    let N = yr(), h = N.indexOf(u), x = (h + N.length - 1) % N.length, k = (h + 1) % N.length, O = N[x], A = N[k];
    return !d.contains(O) && !d.contains(A);
  }, [u, d]), P = nt(f), v = nt(p), H = ve(() => ({ buttonId: P, panelId: v, close: () => y({ type: 1 }) }), [P, v, y]), _ = rc(), J = _ == null ? void 0 : _.registerPopover, W = ae(() => {
    var N;
    return (N = _ == null ? void 0 : _.isFocusWithinPopoverGroup()) != null ? N : (E == null ? void 0 : E.activeElement) && ((u == null ? void 0 : u.contains(E.activeElement)) || (d == null ? void 0 : d.contains(E.activeElement)));
  });
  be(() => J == null ? void 0 : J(H), [J, H]);
  let [X, q] = Tp(), M = Kl(u), Z = Ip({ mainTreeNode: M, portals: X, defaultContainers: [u, d] });
  Yf(E == null ? void 0 : E.defaultView, "focus", (N) => {
    var h, x, k, O, A, I;
    N.target !== window && N.target instanceof HTMLElement && c === 0 && (W() || u && d && (Z.contains(N.target) || (x = (h = b.current) == null ? void 0 : h.contains) != null && x.call(h, N.target) || (O = (k = g.current) == null ? void 0 : k.contains) != null && O.call(k, N.target) || (I = (A = m.current) == null ? void 0 : A.contains) != null && I.call(A, N.target) || y({ type: 1 })));
  }, !0), Bf(c === 0, Z.resolveContainers, (N, h) => {
    y({ type: 1 }), kl(h, ka.Loose) || (N.preventDefault(), u == null || u.focus());
  });
  let Y = ae((N) => {
    y({ type: 1 });
    let h = N ? N instanceof HTMLElement ? N : "current" in N && N.current instanceof HTMLElement ? N.current : u : u;
    h == null || h.focus();
  }), K = ve(() => ({ close: Y, isPortalled: w }), [Y, w]), j = ve(() => ({ open: c === 0, close: Y }), [c, Y]), F = { ref: i }, B = De();
  return ee.createElement(Xl, { node: M }, ee.createElement(mp, null, ee.createElement(Nr.Provider, { value: null }, ee.createElement(Fa.Provider, { value: l }, ee.createElement($r.Provider, { value: K }, ee.createElement(Tf, { value: Y }, ee.createElement(Vl, { value: Le(c, { 0: $e.Open, 1: $e.Closed }) }, ee.createElement(q, null, B({ ourProps: F, theirProps: o, slot: j, defaultTag: Gp, name: "Popover" })))))))));
}
let Xp = "button";
function Kp(e, t) {
  let n = On(), { id: r = `headlessui-popover-button-${n}`, disabled: o = !1, autoFocus: a = !1, ...i } = e, [s, l] = Cr("Popover.Button"), { isPortalled: c } = La("Popover.Button"), u = ie(null), f = `headlessui-focus-sentinel-${On()}`, d = rc(), p = d == null ? void 0 : d.closeOthers, b = Vp() !== null;
  be(() => {
    if (!b) return l({ type: 3, buttonId: r }), () => {
      l({ type: 3, buttonId: null });
    };
  }, [b, r, l]);
  let [g] = he(() => Symbol()), m = je(u, t, fp(), ae((h) => {
    if (!b) {
      if (h) s.buttons.current.push(g);
      else {
        let x = s.buttons.current.indexOf(g);
        x !== -1 && s.buttons.current.splice(x, 1);
      }
      s.buttons.current.length > 1 && console.warn("You are already using a <Popover.Button /> but only 1 <Popover.Button /> is supported."), h && l({ type: 2, button: h });
    }
  })), y = je(u, t), E = en(u), w = ae((h) => {
    var x, k, O;
    if (b) {
      if (s.popoverState === 1) return;
      switch (h.key) {
        case gt.Space:
        case gt.Enter:
          h.preventDefault(), (k = (x = h.target).click) == null || k.call(x), l({ type: 1 }), (O = s.button) == null || O.focus();
          break;
      }
    } else switch (h.key) {
      case gt.Space:
      case gt.Enter:
        h.preventDefault(), h.stopPropagation(), s.popoverState === 1 && (p == null || p(s.buttonId)), l({ type: 0 });
        break;
      case gt.Escape:
        if (s.popoverState !== 0) return p == null ? void 0 : p(s.buttonId);
        if (!u.current || E != null && E.activeElement && !u.current.contains(E.activeElement)) return;
        h.preventDefault(), h.stopPropagation(), l({ type: 1 });
        break;
    }
  }), P = ae((h) => {
    b || h.key === gt.Space && h.preventDefault();
  }), v = ae((h) => {
    var x, k;
    xl(h.currentTarget) || o || (b ? (l({ type: 1 }), (x = s.button) == null || x.focus()) : (h.preventDefault(), h.stopPropagation(), s.popoverState === 1 && (p == null || p(s.buttonId)), l({ type: 0 }), (k = s.button) == null || k.focus()));
  }), H = ae((h) => {
    h.preventDefault(), h.stopPropagation();
  }), { isFocusVisible: _, focusProps: J } = pf({ autoFocus: a }), { isHovered: W, hoverProps: X } = df({ isDisabled: o }), { pressed: q, pressProps: M } = yf({ disabled: o }), Z = s.popoverState === 0, Y = ve(() => ({ open: Z, active: q || Z, disabled: o, hover: W, focus: _, autofocus: a }), [Z, W, _, q, o, a]), K = Vf(e, s.button), j = No(b ? { ref: y, type: K, onKeyDown: w, onClick: v, disabled: o || void 0, autoFocus: a } : { ref: m, id: s.buttonId, type: K, "aria-expanded": s.popoverState === 0, "aria-controls": s.panel ? s.panelId : void 0, disabled: o || void 0, autoFocus: a, onKeyDown: w, onKeyUp: P, onClick: v, onMouseDown: H }, J, X, M), F = Jl(), B = ae(() => {
    let h = s.panel;
    if (!h) return;
    function x() {
      Le(F.current, { [et.Forwards]: () => Ct(h, Qe.First), [et.Backwards]: () => Ct(h, Qe.Last) }) === lr.Error && Ct(yr().filter((k) => k.dataset.headlessuiFocusGuard !== "true"), Le(F.current, { [et.Forwards]: Qe.Next, [et.Backwards]: Qe.Previous }), { relativeTo: s.button });
    }
    x();
  }), N = De();
  return ee.createElement(ee.Fragment, null, N({ ourProps: j, theirProps: i, slot: Y, defaultTag: Xp, name: "Popover.Button" }), Z && !b && c && ee.createElement(sr, { id: f, ref: s.afterButtonSentinel, features: kn.Focusable, "data-headlessui-focus-guard": !0, as: "button", type: "button", onFocus: B }));
}
let Jp = "div", Zp = Qt.RenderStrategy | Qt.Static;
function oc(e, t) {
  let n = On(), { id: r = `headlessui-popover-backdrop-${n}`, transition: o = !1, ...a } = e, [{ popoverState: i }, s] = Cr("Popover.Backdrop"), [l, c] = he(null), u = je(t, c), f = Or(), [d, p] = Ta(o, l, f !== null ? (f & $e.Open) === $e.Open : i === 0), b = ae((y) => {
    if (xl(y.currentTarget)) return y.preventDefault();
    s({ type: 1 });
  }), g = ve(() => ({ open: i === 0 }), [i]), m = { ref: u, id: r, "aria-hidden": !0, onClick: b, ...Aa(p) };
  return De()({ ourProps: m, theirProps: a, slot: g, defaultTag: Jp, features: Zp, visible: d, name: "Popover.Backdrop" });
}
let Qp = "div", em = Qt.RenderStrategy | Qt.Static;
function tm(e, t) {
  let n = On(), { id: r = `headlessui-popover-panel-${n}`, focus: o = !1, anchor: a, portal: i = !1, modal: s = !1, transition: l = !1, ...c } = e, [u, f] = Cr("Popover.Panel"), { close: d, isPortalled: p } = La("Popover.Panel"), b = `headlessui-focus-sentinel-before-${n}`, g = `headlessui-focus-sentinel-after-${n}`, m = ie(null), y = up(a), [E, w] = pp(y), P = dp();
  y && (i = !0);
  let [v, H] = he(null), _ = je(m, t, y ? E : null, ae((x) => f({ type: 4, panel: x })), H), J = en(u.button), W = en(m);
  Ee(() => (f({ type: 5, panelId: r }), () => {
    f({ type: 5, panelId: null });
  }), [r, f]);
  let X = Or(), [q, M] = Ta(l, v, X !== null ? (X & $e.Open) === $e.Open : u.popoverState === 0);
  Rf(q, u.button, () => {
    f({ type: 1 });
  });
  let Z = u.__demoMode ? !1 : s && q;
  Jf(Z, W);
  let Y = ae((x) => {
    var k;
    switch (x.key) {
      case gt.Escape:
        if (u.popoverState !== 0 || !m.current || W != null && W.activeElement && !m.current.contains(W.activeElement)) return;
        x.preventDefault(), x.stopPropagation(), f({ type: 1 }), (k = u.button) == null || k.focus();
        break;
    }
  });
  be(() => {
    var x;
    e.static || u.popoverState === 1 && ((x = e.unmount) == null || x) && f({ type: 4, panel: null });
  }, [u.popoverState, e.unmount, e.static, f]), be(() => {
    if (u.__demoMode || !o || u.popoverState !== 0 || !m.current) return;
    let x = W == null ? void 0 : W.activeElement;
    m.current.contains(x) || Ct(m.current, Qe.First);
  }, [u.__demoMode, o, m.current, u.popoverState]);
  let K = ve(() => ({ open: u.popoverState === 0, close: d }), [u.popoverState, d]), j = No(y ? P() : {}, { ref: _, id: r, onKeyDown: Y, onBlur: o && u.popoverState === 0 ? (x) => {
    var k, O, A, I, R;
    let $ = x.relatedTarget;
    $ && m.current && ((k = m.current) != null && k.contains($) || (f({ type: 1 }), ((A = (O = u.beforePanelSentinel.current) == null ? void 0 : O.contains) != null && A.call(O, $) || (R = (I = u.afterPanelSentinel.current) == null ? void 0 : I.contains) != null && R.call(I, $)) && $.focus({ preventScroll: !0 })));
  } : void 0, tabIndex: -1, style: { ...c.style, ...w, "--button-width": $f(u.button, !0).width }, ...Aa(M) }), F = Jl(), B = ae(() => {
    let x = m.current;
    if (!x) return;
    function k() {
      Le(F.current, { [et.Forwards]: () => {
        var O;
        Ct(x, Qe.First) === lr.Error && ((O = u.afterPanelSentinel.current) == null || O.focus());
      }, [et.Backwards]: () => {
        var O;
        (O = u.button) == null || O.focus({ preventScroll: !0 });
      } });
    }
    k();
  }), N = ae(() => {
    let x = m.current;
    if (!x) return;
    function k() {
      Le(F.current, { [et.Forwards]: () => {
        if (!u.button) return;
        let O = yr(), A = O.indexOf(u.button), I = O.slice(0, A + 1), R = [...O.slice(A + 1), ...I];
        for (let $ of R.slice()) if ($.dataset.headlessuiFocusGuard === "true" || v != null && v.contains($)) {
          let L = R.indexOf($);
          L !== -1 && R.splice(L, 1);
        }
        Ct(R, Qe.First, { sorted: !1 });
      }, [et.Backwards]: () => {
        var O;
        Ct(x, Qe.Previous) === lr.Error && ((O = u.button) == null || O.focus());
      } });
    }
    k();
  }), h = De();
  return ee.createElement(bp, null, ee.createElement(Nr.Provider, { value: r }, ee.createElement($r.Provider, { value: { close: d, isPortalled: p } }, ee.createElement(Np, { enabled: i ? e.static || q : !1, ownerDocument: J }, q && p && ee.createElement(sr, { id: b, ref: u.beforePanelSentinel, features: kn.Focusable, "data-headlessui-focus-guard": !0, as: "button", type: "button", onFocus: B }), h({ ourProps: j, theirProps: c, slot: K, defaultTag: Qp, features: em, visible: q, name: "Popover.Panel" }), q && p && ee.createElement(sr, { id: g, ref: u.afterPanelSentinel, features: kn.Focusable, "data-headlessui-focus-guard": !0, as: "button", type: "button", onFocus: N })))));
}
let nm = "div";
function rm(e, t) {
  let n = ie(null), r = je(n, t), [o, a] = he([]), i = ae((g) => {
    a((m) => {
      let y = m.indexOf(g);
      if (y !== -1) {
        let E = m.slice();
        return E.splice(y, 1), E;
      }
      return m;
    });
  }), s = ae((g) => (a((m) => [...m, g]), () => i(g))), l = ae(() => {
    var g;
    let m = Fn(n);
    if (!m) return !1;
    let y = m.activeElement;
    return (g = n.current) != null && g.contains(y) ? !0 : o.some((E) => {
      var w, P;
      return ((w = m.getElementById(E.buttonId.current)) == null ? void 0 : w.contains(y)) || ((P = m.getElementById(E.panelId.current)) == null ? void 0 : P.contains(y));
    });
  }), c = ae((g) => {
    for (let m of o) m.buttonId.current !== g && m.close();
  }), u = ve(() => ({ registerPopover: s, unregisterPopover: i, isFocusWithinPopoverGroup: l, closeOthers: c }), [s, i, l, c]), f = ve(() => ({}), []), d = e, p = { ref: r }, b = De();
  return ee.createElement(Xl, null, ee.createElement(ja.Provider, { value: u }, b({ ourProps: p, theirProps: d, slot: f, defaultTag: nm, name: "Popover.Group" })));
}
let om = Ie(qp), ac = Ie(Kp), am = Ie(oc), im = Ie(oc), ic = Ie(tm), sm = Ie(rm), lm = Object.assign(om, { Button: ac, Backdrop: im, Overlay: am, Panel: ic, Group: sm });
const _a = "-", cm = (e) => {
  const t = fm(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (i) => {
      const s = i.split(_a);
      return s[0] === "" && s.length !== 1 && s.shift(), sc(s, t) || um(i);
    },
    getConflictingClassGroupIds: (i, s) => {
      const l = n[i] || [];
      return s && r[i] ? [...l, ...r[i]] : l;
    }
  };
}, sc = (e, t) => {
  var i;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], r = t.nextPart.get(n), o = r ? sc(e.slice(1), r) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const a = e.join(_a);
  return (i = t.validators.find(({
    validator: s
  }) => s(a))) == null ? void 0 : i.classGroupId;
}, Ai = /^\[(.+)\]$/, um = (e) => {
  if (Ai.test(e)) {
    const t = Ai.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, fm = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return pm(Object.entries(e.classGroups), n).forEach(([a, i]) => {
    _o(i, r, a, t);
  }), r;
}, _o = (e, t, n, r) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : Ti(t, o);
      a.classGroupId = n;
      return;
    }
    if (typeof o == "function") {
      if (dm(o)) {
        _o(o(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: n
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      _o(i, Ti(t, a), n, r);
    });
  });
}, Ti = (e, t) => {
  let n = e;
  return t.split(_a).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, dm = (e) => e.isThemeGetter, pm = (e, t) => t ? e.map(([n, r]) => {
  const o = r.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [n, o];
}) : e, mm = (e) => {
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
}, lc = "!", gm = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const l = [];
    let c = 0, u = 0, f;
    for (let m = 0; m < s.length; m++) {
      let y = s[m];
      if (c === 0) {
        if (y === o && (r || s.slice(m, m + a) === t)) {
          l.push(s.slice(u, m)), u = m + a;
          continue;
        }
        if (y === "/") {
          f = m;
          continue;
        }
      }
      y === "[" ? c++ : y === "]" && c--;
    }
    const d = l.length === 0 ? s : s.substring(u), p = d.startsWith(lc), b = p ? d.substring(1) : d, g = f && f > u ? f - u : void 0;
    return {
      modifiers: l,
      hasImportantModifier: p,
      baseClassName: b,
      maybePostfixModifierPosition: g
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, hm = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, bm = (e) => ({
  cache: mm(e.cacheSize),
  parseClassName: gm(e),
  ...cm(e)
}), vm = /\s+/, ym = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(vm);
  let s = "";
  for (let l = i.length - 1; l >= 0; l -= 1) {
    const c = i[l], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: p
    } = n(c);
    let b = !!p, g = r(b ? d.substring(0, p) : d);
    if (!g) {
      if (!b) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (g = r(d), !g) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      b = !1;
    }
    const m = hm(u).join(":"), y = f ? m + lc : m, E = y + g;
    if (a.includes(E))
      continue;
    a.push(E);
    const w = o(g, b);
    for (let P = 0; P < w.length; ++P) {
      const v = w[P];
      a.push(y + v);
    }
    s = c + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function xm() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = cc(t)) && (r && (r += " "), r += n);
  return r;
}
const cc = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = cc(e[r])) && (n && (n += " "), n += t);
  return n;
};
function wm(e, ...t) {
  let n, r, o, a = i;
  function i(l) {
    const c = t.reduce((u, f) => f(u), e());
    return n = bm(c), r = n.cache.get, o = n.cache.set, a = s, s(l);
  }
  function s(l) {
    const c = r(l);
    if (c)
      return c;
    const u = ym(l, n);
    return o(l, u), u;
  }
  return function() {
    return a(xm.apply(null, arguments));
  };
}
const de = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, uc = /^\[(?:([a-z-]+):)?(.+)\]$/i, Em = /^\d+\/\d+$/, Sm = /* @__PURE__ */ new Set(["px", "full", "screen"]), Pm = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Om = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, km = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Am = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Tm = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Ke = (e) => Xt(e) || Sm.has(e) || Em.test(e), ct = (e) => sn(e, "length", Lm), Xt = (e) => !!e && !Number.isNaN(Number(e)), Jr = (e) => sn(e, "number", Xt), pn = (e) => !!e && Number.isInteger(Number(e)), Cm = (e) => e.endsWith("%") && Xt(e.slice(0, -1)), te = (e) => uc.test(e), ut = (e) => Pm.test(e), $m = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Nm = (e) => sn(e, $m, fc), Im = (e) => sn(e, "position", fc), Rm = /* @__PURE__ */ new Set(["image", "url"]), Mm = (e) => sn(e, Rm, _m), Fm = (e) => sn(e, "", jm), mn = () => !0, sn = (e, t, n) => {
  const r = uc.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, Lm = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  Om.test(e) && !km.test(e)
), fc = () => !1, jm = (e) => Am.test(e), _m = (e) => Tm.test(e), Dm = () => {
  const e = de("colors"), t = de("spacing"), n = de("blur"), r = de("brightness"), o = de("borderColor"), a = de("borderRadius"), i = de("borderSpacing"), s = de("borderWidth"), l = de("contrast"), c = de("grayscale"), u = de("hueRotate"), f = de("invert"), d = de("gap"), p = de("gradientColorStops"), b = de("gradientColorStopPositions"), g = de("inset"), m = de("margin"), y = de("opacity"), E = de("padding"), w = de("saturate"), P = de("scale"), v = de("sepia"), H = de("skew"), _ = de("space"), J = de("translate"), W = () => ["auto", "contain", "none"], X = () => ["auto", "hidden", "clip", "visible", "scroll"], q = () => ["auto", te, t], M = () => [te, t], Z = () => ["", Ke, ct], Y = () => ["auto", Xt, te], K = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], j = () => ["solid", "dashed", "dotted", "double", "none"], F = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], B = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], N = () => ["", "0", te], h = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], x = () => [Xt, te];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [mn],
      spacing: [Ke, ct],
      blur: ["none", "", ut, te],
      brightness: x(),
      borderColor: [e],
      borderRadius: ["none", "", "full", ut, te],
      borderSpacing: M(),
      borderWidth: Z(),
      contrast: x(),
      grayscale: N(),
      hueRotate: x(),
      invert: N(),
      gap: M(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Cm, ct],
      inset: q(),
      margin: q(),
      opacity: x(),
      padding: M(),
      saturate: x(),
      scale: x(),
      sepia: N(),
      skew: x(),
      space: M(),
      translate: M()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", te]
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
        columns: [ut]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": h()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": h()
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
        object: [...K(), te]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: X()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": X()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": X()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: W()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": W()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": W()
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
        z: ["auto", pn, te]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: q()
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
        flex: ["1", "auto", "initial", "none", te]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: N()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: N()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", pn, te]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [mn]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", pn, te]
        }, te]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": Y()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": Y()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [mn]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [pn, te]
        }, te]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": Y()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": Y()
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
        "auto-cols": ["auto", "min", "max", "fr", te]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", te]
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
        justify: ["normal", ...B()]
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
        content: ["normal", ...B(), "baseline"]
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
        "place-content": [...B(), "baseline"]
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
        p: [E]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [E]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [E]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [E]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [E]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [E]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [E]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [E]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [E]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [m]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [m]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [m]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [m]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [m]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [m]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [m]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [m]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [m]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", te, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [te, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [te, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [ut]
        }, ut]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [te, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [te, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [te, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [te, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", ut, ct]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Jr]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [mn]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", te]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Xt, Jr]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Ke, te]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", te]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", te]
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
        "placeholder-opacity": [y]
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
        "text-opacity": [y]
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
        decoration: [...j(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", Ke, ct]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Ke, te]
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
        indent: M()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", te]
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
        content: ["none", te]
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
        "bg-opacity": [y]
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
        bg: [...K(), Im]
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
        bg: ["auto", "cover", "contain", Nm]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, Mm]
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
        "border-opacity": [y]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...j(), "hidden"]
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
        "divide-opacity": [y]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: j()
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
        outline: ["", ...j()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Ke, te]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Ke, ct]
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
        ring: Z()
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
        "ring-opacity": [y]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [Ke, ct]
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
        shadow: ["", "inner", "none", ut, Fm]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [mn]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [y]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...F(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": F()
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
        "drop-shadow": ["", "none", ut, te]
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
        saturate: [w]
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
        "backdrop-invert": [f]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [y]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [w]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", te]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: x()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", te]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: x()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", te]
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
        scale: [P]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [P]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [P]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [pn, te]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [J]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [J]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [H]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [H]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", te]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", te]
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
        "scroll-m": M()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": M()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": M()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": M()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": M()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": M()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": M()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": M()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": M()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": M()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": M()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": M()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": M()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": M()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": M()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": M()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": M()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": M()
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
        "will-change": ["auto", "scroll", "contents", "transform", te]
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
        stroke: [Ke, ct, Jr]
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
}, Je = /* @__PURE__ */ wm(Dm);
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function zm(e, t, n) {
  return (t = Wm(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Ci(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function T(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Ci(Object(n), !0).forEach(function(r) {
      zm(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Ci(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Hm(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Wm(e) {
  var t = Hm(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const $i = () => {
};
let Da = {}, dc = {}, pc = null, mc = {
  mark: $i,
  measure: $i
};
try {
  typeof window < "u" && (Da = window), typeof document < "u" && (dc = document), typeof MutationObserver < "u" && (pc = MutationObserver), typeof performance < "u" && (mc = performance);
} catch {
}
const {
  userAgent: Ni = ""
} = Da.navigator || {}, yt = Da, me = dc, Ii = pc, Vn = mc;
yt.document;
const st = !!me.documentElement && !!me.head && typeof me.addEventListener == "function" && typeof me.createElement == "function", gc = ~Ni.indexOf("MSIE") || ~Ni.indexOf("Trident/");
var Bm = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, Ym = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, hc = {
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
}, Vm = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, bc = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], ke = "classic", Ir = "duotone", Um = "sharp", Gm = "sharp-duotone", vc = [ke, Ir, Um, Gm], qm = {
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
}, Xm = {
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
}, Km = /* @__PURE__ */ new Map([["classic", {
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
}]]), Jm = {
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
}, Zm = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Ri = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, Qm = ["kit"], eg = {
  kit: {
    "fa-kit": "fak"
  }
}, tg = ["fak", "fakd"], ng = {
  kit: {
    fak: "fa-kit"
  }
}, Mi = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Un = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, rg = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], og = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], ag = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, ig = {
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
}, sg = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Do = {
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
}, lg = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], zo = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...rg, ...lg], cg = ["solid", "regular", "light", "thin", "duotone", "brands"], yc = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ug = yc.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), fg = [...Object.keys(sg), ...cg, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Un.GROUP, Un.SWAP_OPACITY, Un.PRIMARY, Un.SECONDARY].concat(yc.map((e) => "".concat(e, "x"))).concat(ug.map((e) => "w-".concat(e))), dg = {
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
const rt = "___FONT_AWESOME___", Ho = 16, xc = "fa", wc = "svg-inline--fa", _t = "data-fa-i2svg", Wo = "data-fa-pseudo-element", pg = "data-fa-pseudo-element-pending", za = "data-prefix", Ha = "data-icon", Fi = "fontawesome-i2svg", mg = "async", gg = ["HTML", "HEAD", "STYLE", "SCRIPT"], Ec = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Dn(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[ke];
    }
  });
}
const Sc = T({}, hc);
Sc[ke] = T(T(T(T({}, {
  "fa-duotone": "duotone"
}), hc[ke]), Ri.kit), Ri["kit-duotone"]);
const hg = Dn(Sc), Bo = T({}, Jm);
Bo[ke] = T(T(T(T({}, {
  duotone: "fad"
}), Bo[ke]), Mi.kit), Mi["kit-duotone"]);
const Li = Dn(Bo), Yo = T({}, Do);
Yo[ke] = T(T({}, Yo[ke]), ng.kit);
const Wa = Dn(Yo), Vo = T({}, ig);
Vo[ke] = T(T({}, Vo[ke]), eg.kit);
Dn(Vo);
const bg = Bm, Pc = "fa-layers-text", vg = Ym, yg = T({}, qm);
Dn(yg);
const xg = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Zr = Vm, wg = [...Qm, ...fg], xn = yt.FontAwesomeConfig || {};
function Eg(e) {
  var t = me.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function Sg(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
me && typeof me.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, n] = e;
  const r = Sg(Eg(t));
  r != null && (xn[n] = r);
});
const Oc = {
  styleDefault: "solid",
  familyDefault: ke,
  cssPrefix: xc,
  replacementClass: wc,
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
xn.familyPrefix && (xn.cssPrefix = xn.familyPrefix);
const nn = T(T({}, Oc), xn);
nn.autoReplaceSvg || (nn.observeMutations = !1);
const V = {};
Object.keys(Oc).forEach((e) => {
  Object.defineProperty(V, e, {
    enumerable: !0,
    set: function(t) {
      nn[e] = t, wn.forEach((n) => n(V));
    },
    get: function() {
      return nn[e];
    }
  });
});
Object.defineProperty(V, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    nn.cssPrefix = e, wn.forEach((t) => t(V));
  },
  get: function() {
    return nn.cssPrefix;
  }
});
yt.FontAwesomeConfig = V;
const wn = [];
function Pg(e) {
  return wn.push(e), () => {
    wn.splice(wn.indexOf(e), 1);
  };
}
const ft = Ho, We = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function Og(e) {
  if (!e || !st)
    return;
  const t = me.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = me.head.childNodes;
  let r = null;
  for (let o = n.length - 1; o > -1; o--) {
    const a = n[o], i = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = a);
  }
  return me.head.insertBefore(t, r), e;
}
const kg = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function $n() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += kg[Math.random() * 62 | 0];
  return t;
}
function ln(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function Ba(e) {
  return e.classList ? ln(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function kc(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Ag(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(kc(e[n]), '" '), "").trim();
}
function Rr(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function Ya(e) {
  return e.size !== We.size || e.x !== We.x || e.y !== We.y || e.rotate !== We.rotate || e.flipX || e.flipY;
}
function Tg(e) {
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
function Cg(e) {
  let {
    transform: t,
    width: n = Ho,
    height: r = Ho,
    startCentered: o = !1
  } = e, a = "";
  return o && gc ? a += "translate(".concat(t.x / ft - n / 2, "em, ").concat(t.y / ft - r / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / ft, "em), calc(-50% + ").concat(t.y / ft, "em)) ") : a += "translate(".concat(t.x / ft, "em, ").concat(t.y / ft, "em) "), a += "scale(".concat(t.size / ft * (t.flipX ? -1 : 1), ", ").concat(t.size / ft * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var $g = `:root, :host {
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
function Ac() {
  const e = xc, t = wc, n = V.cssPrefix, r = V.replacementClass;
  let o = $g;
  if (n !== e || r !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return o;
}
let ji = !1;
function Qr() {
  V.autoAddCss && !ji && (Og(Ac()), ji = !0);
}
var Ng = {
  mixout() {
    return {
      dom: {
        css: Ac,
        insertCss: Qr
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Qr();
      },
      beforeI2svg() {
        Qr();
      }
    };
  }
};
const ot = yt || {};
ot[rt] || (ot[rt] = {});
ot[rt].styles || (ot[rt].styles = {});
ot[rt].hooks || (ot[rt].hooks = {});
ot[rt].shims || (ot[rt].shims = []);
var Be = ot[rt];
const Tc = [], Cc = function() {
  me.removeEventListener("DOMContentLoaded", Cc), dr = 1, Tc.map((e) => e());
};
let dr = !1;
st && (dr = (me.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(me.readyState), dr || me.addEventListener("DOMContentLoaded", Cc));
function Ig(e) {
  st && (dr ? setTimeout(e, 0) : Tc.push(e));
}
function zn(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? kc(e) : "<".concat(t, " ").concat(Ag(n), ">").concat(r.map(zn).join(""), "</").concat(t, ">");
}
function _i(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var eo = function(e, t, n, r) {
  var o = Object.keys(e), a = o.length, i = t, s, l, c;
  for (n === void 0 ? (s = 1, c = e[o[0]]) : (s = 0, c = n); s < a; s++)
    l = o[s], c = i(c, e[l], l, e);
  return c;
};
function Rg(e) {
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
function $c(e) {
  const t = Rg(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function Mg(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), o;
  return r >= 55296 && r <= 56319 && n > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (r - 55296) * 1024 + o - 56320 + 65536 : r;
}
function Di(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function Uo(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, o = Di(t);
  typeof Be.hooks.addPack == "function" && !r ? Be.hooks.addPack(e, Di(t)) : Be.styles[e] = T(T({}, Be.styles[e] || {}), o), e === "fas" && Uo("fa", t);
}
const {
  styles: Nn,
  shims: Fg
} = Be, Nc = Object.keys(Wa), Lg = Nc.reduce((e, t) => (e[t] = Object.keys(Wa[t]), e), {});
let Va = null, Ic = {}, Rc = {}, Mc = {}, Fc = {}, Lc = {};
function jg(e) {
  return ~wg.indexOf(e);
}
function _g(e, t) {
  const n = t.split("-"), r = n[0], o = n.slice(1).join("-");
  return r === e && o !== "" && !jg(o) ? o : null;
}
const jc = () => {
  const e = (r) => eo(Nn, (o, a, i) => (o[i] = eo(a, r, {}), o), {});
  Ic = e((r, o, a) => (o[3] && (r[o[3]] = a), o[2] && o[2].filter((i) => typeof i == "number").forEach((i) => {
    r[i.toString(16)] = a;
  }), r)), Rc = e((r, o, a) => (r[a] = a, o[2] && o[2].filter((i) => typeof i == "string").forEach((i) => {
    r[i] = a;
  }), r)), Lc = e((r, o, a) => {
    const i = o[2];
    return r[a] = a, i.forEach((s) => {
      r[s] = a;
    }), r;
  });
  const t = "far" in Nn || V.autoFetchSvg, n = eo(Fg, (r, o) => {
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
  Mc = n.names, Fc = n.unicodes, Va = Mr(V.styleDefault, {
    family: V.familyDefault
  });
};
Pg((e) => {
  Va = Mr(e.styleDefault, {
    family: V.familyDefault
  });
});
jc();
function Ua(e, t) {
  return (Ic[e] || {})[t];
}
function Dg(e, t) {
  return (Rc[e] || {})[t];
}
function Nt(e, t) {
  return (Lc[e] || {})[t];
}
function _c(e) {
  return Mc[e] || {
    prefix: null,
    iconName: null
  };
}
function zg(e) {
  const t = Fc[e], n = Ua("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function xt() {
  return Va;
}
const Dc = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function Hg(e) {
  let t = ke;
  const n = Nc.reduce((r, o) => (r[o] = "".concat(V.cssPrefix, "-").concat(o), r), {});
  return vc.forEach((r) => {
    (e.includes(n[r]) || e.some((o) => Lg[r].includes(o))) && (t = r);
  }), t;
}
function Mr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = ke
  } = t, r = hg[n][e];
  if (n === Ir && !e)
    return "fad";
  const o = Li[n][e] || Li[n][r], a = e in Be.styles ? e : null;
  return o || a || null;
}
function Wg(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const o = _g(V.cssPrefix, r);
    o ? n = o : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function zi(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function Fr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const o = zo.concat(og), a = zi(e.filter((f) => o.includes(f))), i = zi(e.filter((f) => !zo.includes(f))), s = a.filter((f) => (r = f, !bc.includes(f))), [l = null] = s, c = Hg(a), u = T(T({}, Wg(i)), {}, {
    prefix: Mr(l, {
      family: c
    })
  });
  return T(T(T({}, u), Ug({
    values: e,
    family: c,
    styles: Nn,
    config: V,
    canonical: u,
    givenPrefix: r
  })), Bg(n, r, u));
}
function Bg(e, t, n) {
  let {
    prefix: r,
    iconName: o
  } = n;
  if (e || !r || !o)
    return {
      prefix: r,
      iconName: o
    };
  const a = t === "fa" ? _c(o) : {}, i = Nt(r, o);
  return o = a.iconName || i || o, r = a.prefix || r, r === "far" && !Nn.far && Nn.fas && !V.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: o
  };
}
const Yg = vc.filter((e) => e !== ke || e !== Ir), Vg = Object.keys(Do).filter((e) => e !== ke).map((e) => Object.keys(Do[e])).flat();
function Ug(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: o = "",
    styles: a = {},
    config: i = {}
  } = e, s = n === Ir, l = t.includes("fa-duotone") || t.includes("fad"), c = i.familyDefault === "duotone", u = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (l || c || u) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && Yg.includes(n) && (Object.keys(a).find((f) => Vg.includes(f)) || i.autoFetchSvg)) {
    const f = Km.get(n).defaultShortPrefixId;
    r.prefix = f, r.iconName = Nt(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || o === "fa") && (r.prefix = xt() || "fas"), r;
}
class Gg {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const o = n.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = T(T({}, this.definitions[a] || {}), o[a]), Uo(a, o[a]);
      const i = Wa[ke][a];
      i && Uo(i, o[a]), jc();
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
let Hi = [], Yt = {};
const Kt = {}, qg = Object.keys(Kt);
function Xg(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return Hi = e, Yt = {}, Object.keys(Kt).forEach((r) => {
    qg.indexOf(r) === -1 && delete Kt[r];
  }), Hi.forEach((r) => {
    const o = r.mixout ? r.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (n[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((i) => {
        n[a] || (n[a] = {}), n[a][i] = o[a][i];
      });
    }), r.hooks) {
      const a = r.hooks();
      Object.keys(a).forEach((i) => {
        Yt[i] || (Yt[i] = []), Yt[i].push(a[i]);
      });
    }
    r.provides && r.provides(Kt);
  }), n;
}
function Go(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), o = 2; o < n; o++)
    r[o - 2] = arguments[o];
  return (Yt[e] || []).forEach((a) => {
    t = a.apply(null, [t, ...r]);
  }), t;
}
function Dt(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (Yt[e] || []).forEach((o) => {
    o.apply(null, n);
  });
}
function wt() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Kt[e] ? Kt[e].apply(null, t) : void 0;
}
function qo(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || xt();
  if (t)
    return t = Nt(n, t) || t, _i(zc.definitions, n, t) || _i(Be.styles, n, t);
}
const zc = new Gg(), Kg = () => {
  V.autoReplaceSvg = !1, V.observeMutations = !1, Dt("noAuto");
}, Jg = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return st ? (Dt("beforeI2svg", e), wt("pseudoElements2svg", e), wt("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    V.autoReplaceSvg === !1 && (V.autoReplaceSvg = !0), V.observeMutations = !0, Ig(() => {
      Qg({
        autoReplaceSvgRoot: t
      }), Dt("watch", e);
    });
  }
}, Zg = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Nt(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = Mr(e[0]);
      return {
        prefix: n,
        iconName: Nt(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(V.cssPrefix, "-")) > -1 || e.match(bg))) {
      const t = Fr(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || xt(),
        iconName: Nt(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = xt();
      return {
        prefix: t,
        iconName: Nt(t, e) || e
      };
    }
  }
}, Re = {
  noAuto: Kg,
  config: V,
  dom: Jg,
  parse: Zg,
  library: zc,
  findIconDefinition: qo,
  toHtml: zn
}, Qg = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = me
  } = e;
  (Object.keys(Be.styles).length > 0 || V.autoFetchSvg) && st && V.autoReplaceSvg && Re.dom.i2svg({
    node: t
  });
};
function Lr(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => zn(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!st) return;
      const n = me.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function eh(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: o,
    styles: a,
    transform: i
  } = e;
  if (Ya(i) && n.found && !r.found) {
    const {
      width: s,
      height: l
    } = n, c = {
      x: s / l / 2,
      y: 0.5
    };
    o.style = Rr(T(T({}, a), {}, {
      "transform-origin": "".concat(c.x + i.x / 16, "em ").concat(c.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function th(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: o,
    symbol: a
  } = e;
  const i = a === !0 ? "".concat(t, "-").concat(V.cssPrefix, "-").concat(n) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: T(T({}, o), {}, {
        id: i
      }),
      children: r
    }]
  }];
}
function Ga(e) {
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
  } = n.found ? n : t, b = tg.includes(r), g = [V.replacementClass, o ? "".concat(V.cssPrefix, "-").concat(o) : ""].filter((v) => u.classes.indexOf(v) === -1).filter((v) => v !== "" || !!v).concat(u.classes).join(" ");
  let m = {
    children: [],
    attributes: T(T({}, u.attributes), {}, {
      "data-prefix": r,
      "data-icon": o,
      class: g,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(d, " ").concat(p)
    })
  };
  const y = b && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(d / p * 16 * 0.0625, "em")
  } : {};
  f && (m.attributes[_t] = ""), s && (m.children.push({
    tag: "title",
    attributes: {
      id: m.attributes["aria-labelledby"] || "title-".concat(c || $n())
    },
    children: [s]
  }), delete m.attributes.title);
  const E = T(T({}, m), {}, {
    prefix: r,
    iconName: o,
    main: t,
    mask: n,
    maskId: l,
    transform: a,
    symbol: i,
    styles: T(T({}, y), u.styles)
  }), {
    children: w,
    attributes: P
  } = n.found && t.found ? wt("generateAbstractMask", E) || {
    children: [],
    attributes: {}
  } : wt("generateAbstractIcon", E) || {
    children: [],
    attributes: {}
  };
  return E.children = w, E.attributes = P, i ? th(E) : eh(E);
}
function Wi(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: o,
    title: a,
    extra: i,
    watchable: s = !1
  } = e, l = T(T(T({}, i.attributes), a ? {
    title: a
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (l[_t] = "");
  const c = T({}, i.styles);
  Ya(o) && (c.transform = Cg({
    transform: o,
    startCentered: !0,
    width: n,
    height: r
  }), c["-webkit-transform"] = c.transform);
  const u = Rr(c);
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
function nh(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, o = T(T(T({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), a = Rr(r.styles);
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
  styles: to
} = Be;
function Xo(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let o = null;
  return Array.isArray(r) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(V.cssPrefix, "-").concat(Zr.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(V.cssPrefix, "-").concat(Zr.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(V.cssPrefix, "-").concat(Zr.PRIMARY),
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
const rh = {
  found: !1,
  width: 512,
  height: 512
};
function oh(e, t) {
  !Ec && !V.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Ko(e, t) {
  let n = t;
  return t === "fa" && V.styleDefault !== null && (t = xt()), new Promise((r, o) => {
    if (n === "fa") {
      const a = _c(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && to[t] && to[t][e]) {
      const a = to[t][e];
      return r(Xo(a));
    }
    oh(e, t), r(T(T({}, rh), {}, {
      icon: V.showMissingIcons && e ? wt("missingIconAbstract") || {} : {}
    }));
  });
}
const Bi = () => {
}, Jo = V.measurePerformance && Vn && Vn.mark && Vn.measure ? Vn : {
  mark: Bi,
  measure: Bi
}, bn = 'FA "6.7.2"', ah = (e) => (Jo.mark("".concat(bn, " ").concat(e, " begins")), () => Hc(e)), Hc = (e) => {
  Jo.mark("".concat(bn, " ").concat(e, " ends")), Jo.measure("".concat(bn, " ").concat(e), "".concat(bn, " ").concat(e, " begins"), "".concat(bn, " ").concat(e, " ends"));
};
var qa = {
  begin: ah,
  end: Hc
};
const Qn = () => {
};
function Yi(e) {
  return typeof (e.getAttribute ? e.getAttribute(_t) : null) == "string";
}
function ih(e) {
  const t = e.getAttribute ? e.getAttribute(za) : null, n = e.getAttribute ? e.getAttribute(Ha) : null;
  return t && n;
}
function sh(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(V.replacementClass);
}
function lh() {
  return V.autoReplaceSvg === !0 ? er.replace : er[V.autoReplaceSvg] || er.replace;
}
function ch(e) {
  return me.createElementNS("http://www.w3.org/2000/svg", e);
}
function uh(e) {
  return me.createElement(e);
}
function Wc(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? ch : uh
  } = t;
  if (typeof e == "string")
    return me.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    r.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    r.appendChild(Wc(o, {
      ceFn: n
    }));
  }), r;
}
function fh(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const er = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(Wc(n), t);
      }), t.getAttribute(_t) === null && V.keepOriginalSource) {
        let n = me.createComment(fh(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~Ba(t).indexOf(V.replacementClass))
      return er.replace(e);
    const r = new RegExp("".concat(V.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const a = n[0].attributes.class.split(" ").reduce((i, s) => (s === V.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = n.map((a) => zn(a)).join(`
`);
    t.setAttribute(_t, ""), t.innerHTML = o;
  }
};
function Vi(e) {
  e();
}
function Bc(e, t) {
  const n = typeof t == "function" ? t : Qn;
  if (e.length === 0)
    n();
  else {
    let r = Vi;
    V.mutateApproach === mg && (r = yt.requestAnimationFrame || Vi), r(() => {
      const o = lh(), a = qa.begin("mutate");
      e.map(o), a(), n();
    });
  }
}
let Xa = !1;
function Yc() {
  Xa = !0;
}
function Zo() {
  Xa = !1;
}
let pr = null;
function Ui(e) {
  if (!Ii || !V.observeMutations)
    return;
  const {
    treeCallback: t = Qn,
    nodeCallback: n = Qn,
    pseudoElementsCallback: r = Qn,
    observeMutationsRoot: o = me
  } = e;
  pr = new Ii((a) => {
    if (Xa) return;
    const i = xt();
    ln(a).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Yi(s.addedNodes[0]) && (V.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && V.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && Yi(s.target) && ~xg.indexOf(s.attributeName))
        if (s.attributeName === "class" && ih(s.target)) {
          const {
            prefix: l,
            iconName: c
          } = Fr(Ba(s.target));
          s.target.setAttribute(za, l || i), c && s.target.setAttribute(Ha, c);
        } else sh(s.target) && n(s.target);
    });
  }), st && pr.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function dh() {
  pr && pr.disconnect();
}
function ph(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, o) => {
    const a = o.split(":"), i = a[0], s = a.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function mh(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = Fr(Ba(e));
  return o.prefix || (o.prefix = xt()), t && n && (o.prefix = t, o.iconName = n), o.iconName && o.prefix || (o.prefix && r.length > 0 && (o.iconName = Dg(o.prefix, e.innerText) || Ua(o.prefix, $c(e.innerText))), !o.iconName && V.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function gh(e) {
  const t = ln(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return V.autoA11y && (n ? t["aria-labelledby"] = "".concat(V.replacementClass, "-title-").concat(r || $n()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function hh() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: We,
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
function Gi(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: o
  } = mh(e), a = gh(e), i = Go("parseNodeAttributes", {}, e);
  let s = t.styleParser ? ph(e) : [];
  return T({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: We,
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
  styles: bh
} = Be;
function Vc(e) {
  const t = V.autoReplaceSvg === "nest" ? Gi(e, {
    styleParser: !1
  }) : Gi(e);
  return ~t.extra.classes.indexOf(Pc) ? wt("generateLayersText", e, t) : wt("generateSvgReplacementMutation", e, t);
}
function vh() {
  return [...Zm, ...zo];
}
function qi(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!st) return Promise.resolve();
  const n = me.documentElement.classList, r = (u) => n.add("".concat(Fi, "-").concat(u)), o = (u) => n.remove("".concat(Fi, "-").concat(u)), a = V.autoFetchSvg ? vh() : bc.concat(Object.keys(bh));
  a.includes("fa") || a.push("fa");
  const i = [".".concat(Pc, ":not([").concat(_t, "])")].concat(a.map((u) => ".".concat(u, ":not([").concat(_t, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = ln(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), o("complete");
  else
    return Promise.resolve();
  const l = qa.begin("onTree"), c = s.reduce((u, f) => {
    try {
      const d = Vc(f);
      d && u.push(d);
    } catch (d) {
      Ec || d.name === "MissingIcon" && console.error(d);
    }
    return u;
  }, []);
  return new Promise((u, f) => {
    Promise.all(c).then((d) => {
      Bc(d, () => {
        r("active"), r("complete"), o("pending"), typeof t == "function" && t(), l(), u();
      });
    }).catch((d) => {
      l(), f(d);
    });
  });
}
function yh(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  Vc(e).then((n) => {
    n && Bc([n], t);
  });
}
function xh(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : qo(t || {});
    let {
      mask: o
    } = n;
    return o && (o = (o || {}).icon ? o : qo(o || {})), e(r, T(T({}, n), {}, {
      mask: o
    }));
  };
}
const wh = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = We,
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
  return Lr(T({
    type: "icon"
  }, e), () => (Dt("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), V.autoA11y && (i ? c["aria-labelledby"] = "".concat(V.replacementClass, "-title-").concat(s || $n()) : (c["aria-hidden"] = "true", c.focusable = "false")), Ga({
    icons: {
      main: Xo(p),
      mask: o ? Xo(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: f,
    iconName: d,
    transform: T(T({}, We), n),
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
var Eh = {
  mixout() {
    return {
      icon: xh(wh)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = qi, e.nodeCallback = yh, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = me,
        callback: r = () => {
        }
      } = t;
      return qi(n, r);
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
        Promise.all([Ko(r, i), c.iconName ? Ko(c.iconName, c.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((b) => {
          let [g, m] = b;
          d([t, Ga({
            icons: {
              main: g,
              mask: m
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
      const s = Rr(i);
      s.length > 0 && (r.style = s);
      let l;
      return Ya(a) && (l = wt("generateAbstractTransformGrouping", {
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
}, Sh = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return Lr({
          type: "layer"
        }, () => {
          Dt("beforeDOMElementCreation", {
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
              class: ["".concat(V.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, Ph = {
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
        return Lr({
          type: "counter",
          content: e
        }, () => (Dt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), nh({
          content: e.toString(),
          title: n,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(V.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, Oh = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = We,
          title: r = null,
          classes: o = [],
          attributes: a = {},
          styles: i = {}
        } = t;
        return Lr({
          type: "text",
          content: e
        }, () => (Dt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Wi({
          content: e,
          transform: T(T({}, We), n),
          title: r,
          extra: {
            attributes: a,
            styles: i,
            classes: ["".concat(V.cssPrefix, "-layers-text"), ...o]
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
      if (gc) {
        const l = parseInt(getComputedStyle(t).fontSize, 10), c = t.getBoundingClientRect();
        i = c.width / l, s = c.height / l;
      }
      return V.autoA11y && !r && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, Wi({
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
const kh = new RegExp('"', "ug"), Xi = [1105920, 1112319], Ki = T(T(T(T({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), Xm), dg), ag), Qo = Object.keys(Ki).reduce((e, t) => (e[t.toLowerCase()] = Ki[t], e), {}), Ah = Object.keys(Qo).reduce((e, t) => {
  const n = Qo[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function Th(e) {
  const t = e.replace(kh, ""), n = Mg(t, 0), r = n >= Xi[0] && n <= Xi[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: $c(o ? t[0] : t),
    isSecondary: r || o
  };
}
function Ch(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), o = isNaN(r) ? "normal" : r;
  return (Qo[n] || {})[o] || Ah[n];
}
function Ji(e, t) {
  const n = "".concat(pg).concat(t.replace(":", "-"));
  return new Promise((r, o) => {
    if (e.getAttribute(n) !== null)
      return r();
    const a = ln(e.children).filter((f) => f.getAttribute(Wo) === t)[0], i = yt.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), l = s.match(vg), c = i.getPropertyValue("font-weight"), u = i.getPropertyValue("content");
    if (a && !l)
      return e.removeChild(a), r();
    if (l && u !== "none" && u !== "") {
      const f = i.getPropertyValue("content");
      let d = Ch(s, c);
      const {
        value: p,
        isSecondary: b
      } = Th(f), g = l[0].startsWith("FontAwesome");
      let m = Ua(d, p), y = m;
      if (g) {
        const E = zg(p);
        E.iconName && E.prefix && (m = E.iconName, d = E.prefix);
      }
      if (m && !b && (!a || a.getAttribute(za) !== d || a.getAttribute(Ha) !== y)) {
        e.setAttribute(n, y), a && e.removeChild(a);
        const E = hh(), {
          extra: w
        } = E;
        w.attributes[Wo] = t, Ko(m, d).then((P) => {
          const v = Ga(T(T({}, E), {}, {
            icons: {
              main: P,
              mask: Dc()
            },
            prefix: d,
            iconName: y,
            extra: w,
            watchable: !0
          })), H = me.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(H, e.firstChild) : e.appendChild(H), H.outerHTML = v.map((_) => zn(_)).join(`
`), e.removeAttribute(n), r();
        }).catch(o);
      } else
        r();
    } else
      r();
  });
}
function $h(e) {
  return Promise.all([Ji(e, "::before"), Ji(e, "::after")]);
}
function Nh(e) {
  return e.parentNode !== document.head && !~gg.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Wo) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Zi(e) {
  if (st)
    return new Promise((t, n) => {
      const r = ln(e.querySelectorAll("*")).filter(Nh).map($h), o = qa.begin("searchPseudoElements");
      Yc(), Promise.all(r).then(() => {
        o(), Zo(), t();
      }).catch(() => {
        o(), Zo(), n();
      });
    });
}
var Ih = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Zi, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = me
      } = t;
      V.searchPseudoElements && Zi(n);
    };
  }
};
let Qi = !1;
var Rh = {
  mixout() {
    return {
      dom: {
        unwatch() {
          Yc(), Qi = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Ui(Go("mutationObserverCallbacks", {}));
      },
      noAuto() {
        dh();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Qi ? Zo() : Ui(Go("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const es = (e) => {
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
var Mh = {
  mixout() {
    return {
      parse: {
        transform: (e) => es(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = es(n)), e;
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
        attributes: T({}, d.outer),
        children: [{
          tag: "g",
          attributes: T({}, d.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: T(T({}, n.icon.attributes), d.path)
          }]
        }]
      };
    };
  }
};
const no = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function ts(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function Fh(e) {
  return e.tag === "g" ? e.children : [e];
}
var Lh = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? Fr(n.split(" ").map((o) => o.trim())) : Dc();
        return r.prefix || (r.prefix = xt()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
      } = a, d = Tg({
        transform: s,
        containerWidth: u,
        iconWidth: l
      }), p = {
        tag: "rect",
        attributes: T(T({}, no), {}, {
          fill: "white"
        })
      }, b = c.children ? {
        children: c.children.map(ts)
      } : {}, g = {
        tag: "g",
        attributes: T({}, d.inner),
        children: [ts(T({
          tag: c.tag,
          attributes: T(T({}, c.attributes), d.path)
        }, b))]
      }, m = {
        tag: "g",
        attributes: T({}, d.outer),
        children: [g]
      }, y = "mask-".concat(i || $n()), E = "clip-".concat(i || $n()), w = {
        tag: "mask",
        attributes: T(T({}, no), {}, {
          id: y,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [p, m]
      }, P = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: E
          },
          children: Fh(f)
        }, w]
      };
      return n.push(P, {
        tag: "rect",
        attributes: T({
          fill: "currentColor",
          "clip-path": "url(#".concat(E, ")"),
          mask: "url(#".concat(y, ")")
        }, no)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, jh = {
  provides(e) {
    let t = !1;
    yt.matchMedia && (t = yt.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: T(T({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = T(T({}, o), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: T(T({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: T(T({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: T(T({}, a), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(i), n.push({
        tag: "path",
        attributes: T(T({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: T(T({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: T(T({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: T(T({}, a), {}, {
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
}, _h = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, Dh = [Ng, Eh, Sh, Ph, Oh, Ih, Rh, Mh, Lh, jh, _h];
Xg(Dh, {
  mixoutsTo: Re
});
Re.noAuto;
Re.config;
Re.library;
Re.dom;
const ea = Re.parse;
Re.findIconDefinition;
Re.toHtml;
const zh = Re.icon;
Re.layer;
Re.text;
Re.counter;
function Hh(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Gn = { exports: {} }, ro = { exports: {} }, le = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ns;
function Wh() {
  if (ns) return le;
  ns = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, b = e ? Symbol.for("react.lazy") : 60116, g = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, E = e ? Symbol.for("react.scope") : 60119;
  function w(v) {
    if (typeof v == "object" && v !== null) {
      var H = v.$$typeof;
      switch (H) {
        case t:
          switch (v = v.type, v) {
            case l:
            case c:
            case r:
            case a:
            case o:
            case f:
              return v;
            default:
              switch (v = v && v.$$typeof, v) {
                case s:
                case u:
                case b:
                case p:
                case i:
                  return v;
                default:
                  return H;
              }
          }
        case n:
          return H;
      }
    }
  }
  function P(v) {
    return w(v) === c;
  }
  return le.AsyncMode = l, le.ConcurrentMode = c, le.ContextConsumer = s, le.ContextProvider = i, le.Element = t, le.ForwardRef = u, le.Fragment = r, le.Lazy = b, le.Memo = p, le.Portal = n, le.Profiler = a, le.StrictMode = o, le.Suspense = f, le.isAsyncMode = function(v) {
    return P(v) || w(v) === l;
  }, le.isConcurrentMode = P, le.isContextConsumer = function(v) {
    return w(v) === s;
  }, le.isContextProvider = function(v) {
    return w(v) === i;
  }, le.isElement = function(v) {
    return typeof v == "object" && v !== null && v.$$typeof === t;
  }, le.isForwardRef = function(v) {
    return w(v) === u;
  }, le.isFragment = function(v) {
    return w(v) === r;
  }, le.isLazy = function(v) {
    return w(v) === b;
  }, le.isMemo = function(v) {
    return w(v) === p;
  }, le.isPortal = function(v) {
    return w(v) === n;
  }, le.isProfiler = function(v) {
    return w(v) === a;
  }, le.isStrictMode = function(v) {
    return w(v) === o;
  }, le.isSuspense = function(v) {
    return w(v) === f;
  }, le.isValidElementType = function(v) {
    return typeof v == "string" || typeof v == "function" || v === r || v === c || v === a || v === o || v === f || v === d || typeof v == "object" && v !== null && (v.$$typeof === b || v.$$typeof === p || v.$$typeof === i || v.$$typeof === s || v.$$typeof === u || v.$$typeof === m || v.$$typeof === y || v.$$typeof === E || v.$$typeof === g);
  }, le.typeOf = w, le;
}
var fe = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var rs;
function Bh() {
  return rs || (rs = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, b = e ? Symbol.for("react.lazy") : 60116, g = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, E = e ? Symbol.for("react.scope") : 60119;
    function w(S) {
      return typeof S == "string" || typeof S == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      S === r || S === c || S === a || S === o || S === f || S === d || typeof S == "object" && S !== null && (S.$$typeof === b || S.$$typeof === p || S.$$typeof === i || S.$$typeof === s || S.$$typeof === u || S.$$typeof === m || S.$$typeof === y || S.$$typeof === E || S.$$typeof === g);
    }
    function P(S) {
      if (typeof S == "object" && S !== null) {
        var xe = S.$$typeof;
        switch (xe) {
          case t:
            var Xe = S.type;
            switch (Xe) {
              case l:
              case c:
              case r:
              case a:
              case o:
              case f:
                return Xe;
              default:
                var fn = Xe && Xe.$$typeof;
                switch (fn) {
                  case s:
                  case u:
                  case b:
                  case p:
                  case i:
                    return fn;
                  default:
                    return xe;
                }
            }
          case n:
            return xe;
        }
      }
    }
    var v = l, H = c, _ = s, J = i, W = t, X = u, q = r, M = b, Z = p, Y = n, K = a, j = o, F = f, B = !1;
    function N(S) {
      return B || (B = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), h(S) || P(S) === l;
    }
    function h(S) {
      return P(S) === c;
    }
    function x(S) {
      return P(S) === s;
    }
    function k(S) {
      return P(S) === i;
    }
    function O(S) {
      return typeof S == "object" && S !== null && S.$$typeof === t;
    }
    function A(S) {
      return P(S) === u;
    }
    function I(S) {
      return P(S) === r;
    }
    function R(S) {
      return P(S) === b;
    }
    function $(S) {
      return P(S) === p;
    }
    function L(S) {
      return P(S) === n;
    }
    function D(S) {
      return P(S) === a;
    }
    function z(S) {
      return P(S) === o;
    }
    function se(S) {
      return P(S) === f;
    }
    fe.AsyncMode = v, fe.ConcurrentMode = H, fe.ContextConsumer = _, fe.ContextProvider = J, fe.Element = W, fe.ForwardRef = X, fe.Fragment = q, fe.Lazy = M, fe.Memo = Z, fe.Portal = Y, fe.Profiler = K, fe.StrictMode = j, fe.Suspense = F, fe.isAsyncMode = N, fe.isConcurrentMode = h, fe.isContextConsumer = x, fe.isContextProvider = k, fe.isElement = O, fe.isForwardRef = A, fe.isFragment = I, fe.isLazy = R, fe.isMemo = $, fe.isPortal = L, fe.isProfiler = D, fe.isStrictMode = z, fe.isSuspense = se, fe.isValidElementType = w, fe.typeOf = P;
  }()), fe;
}
var os;
function Uc() {
  return os || (os = 1, process.env.NODE_ENV === "production" ? ro.exports = Wh() : ro.exports = Bh()), ro.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var oo, as;
function Yh() {
  if (as) return oo;
  as = 1;
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
  return oo = o() ? Object.assign : function(a, i) {
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
  }, oo;
}
var ao, is;
function Ka() {
  if (is) return ao;
  is = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return ao = e, ao;
}
var ss, ls;
function Gc() {
  return ls || (ls = 1, ss = Function.call.bind(Object.prototype.hasOwnProperty)), ss;
}
var io, cs;
function Vh() {
  if (cs) return io;
  cs = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ Ka(), n = {}, r = /* @__PURE__ */ Gc();
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
  }, io = o, io;
}
var so, us;
function Uh() {
  if (us) return so;
  us = 1;
  var e = Uc(), t = Yh(), n = /* @__PURE__ */ Ka(), r = /* @__PURE__ */ Gc(), o = /* @__PURE__ */ Vh(), a = function() {
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
  return so = function(s, l) {
    var c = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function f(h) {
      var x = h && (c && h[c] || h[u]);
      if (typeof x == "function")
        return x;
    }
    var d = "<<anonymous>>", p = {
      array: y("array"),
      bigint: y("bigint"),
      bool: y("boolean"),
      func: y("function"),
      number: y("number"),
      object: y("object"),
      string: y("string"),
      symbol: y("symbol"),
      any: E(),
      arrayOf: w,
      element: P(),
      elementType: v(),
      instanceOf: H,
      node: X(),
      objectOf: J,
      oneOf: _,
      oneOfType: W,
      shape: M,
      exact: Z
    };
    function b(h, x) {
      return h === x ? h !== 0 || 1 / h === 1 / x : h !== h && x !== x;
    }
    function g(h, x) {
      this.message = h, this.data = x && typeof x == "object" ? x : {}, this.stack = "";
    }
    g.prototype = Error.prototype;
    function m(h) {
      if (process.env.NODE_ENV !== "production")
        var x = {}, k = 0;
      function O(I, R, $, L, D, z, se) {
        if (L = L || d, z = z || $, se !== n) {
          if (l) {
            var S = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw S.name = "Invariant Violation", S;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var xe = L + ":" + $;
            !x[xe] && // Avoid spamming the console because they are often not actionable except for lib authors
            k < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + z + "` prop on `" + L + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), x[xe] = !0, k++);
          }
        }
        return R[$] == null ? I ? R[$] === null ? new g("The " + D + " `" + z + "` is marked as required " + ("in `" + L + "`, but its value is `null`.")) : new g("The " + D + " `" + z + "` is marked as required in " + ("`" + L + "`, but its value is `undefined`.")) : null : h(R, $, L, D, z);
      }
      var A = O.bind(null, !1);
      return A.isRequired = O.bind(null, !0), A;
    }
    function y(h) {
      function x(k, O, A, I, R, $) {
        var L = k[O], D = j(L);
        if (D !== h) {
          var z = F(L);
          return new g(
            "Invalid " + I + " `" + R + "` of type " + ("`" + z + "` supplied to `" + A + "`, expected ") + ("`" + h + "`."),
            { expectedType: h }
          );
        }
        return null;
      }
      return m(x);
    }
    function E() {
      return m(i);
    }
    function w(h) {
      function x(k, O, A, I, R) {
        if (typeof h != "function")
          return new g("Property `" + R + "` of component `" + A + "` has invalid PropType notation inside arrayOf.");
        var $ = k[O];
        if (!Array.isArray($)) {
          var L = j($);
          return new g("Invalid " + I + " `" + R + "` of type " + ("`" + L + "` supplied to `" + A + "`, expected an array."));
        }
        for (var D = 0; D < $.length; D++) {
          var z = h($, D, A, I, R + "[" + D + "]", n);
          if (z instanceof Error)
            return z;
        }
        return null;
      }
      return m(x);
    }
    function P() {
      function h(x, k, O, A, I) {
        var R = x[k];
        if (!s(R)) {
          var $ = j(R);
          return new g("Invalid " + A + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + O + "`, expected a single ReactElement."));
        }
        return null;
      }
      return m(h);
    }
    function v() {
      function h(x, k, O, A, I) {
        var R = x[k];
        if (!e.isValidElementType(R)) {
          var $ = j(R);
          return new g("Invalid " + A + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + O + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return m(h);
    }
    function H(h) {
      function x(k, O, A, I, R) {
        if (!(k[O] instanceof h)) {
          var $ = h.name || d, L = N(k[O]);
          return new g("Invalid " + I + " `" + R + "` of type " + ("`" + L + "` supplied to `" + A + "`, expected ") + ("instance of `" + $ + "`."));
        }
        return null;
      }
      return m(x);
    }
    function _(h) {
      if (!Array.isArray(h))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), i;
      function x(k, O, A, I, R) {
        for (var $ = k[O], L = 0; L < h.length; L++)
          if (b($, h[L]))
            return null;
        var D = JSON.stringify(h, function(z, se) {
          var S = F(se);
          return S === "symbol" ? String(se) : se;
        });
        return new g("Invalid " + I + " `" + R + "` of value `" + String($) + "` " + ("supplied to `" + A + "`, expected one of " + D + "."));
      }
      return m(x);
    }
    function J(h) {
      function x(k, O, A, I, R) {
        if (typeof h != "function")
          return new g("Property `" + R + "` of component `" + A + "` has invalid PropType notation inside objectOf.");
        var $ = k[O], L = j($);
        if (L !== "object")
          return new g("Invalid " + I + " `" + R + "` of type " + ("`" + L + "` supplied to `" + A + "`, expected an object."));
        for (var D in $)
          if (r($, D)) {
            var z = h($, D, A, I, R + "." + D, n);
            if (z instanceof Error)
              return z;
          }
        return null;
      }
      return m(x);
    }
    function W(h) {
      if (!Array.isArray(h))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var x = 0; x < h.length; x++) {
        var k = h[x];
        if (typeof k != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + B(k) + " at index " + x + "."
          ), i;
      }
      function O(A, I, R, $, L) {
        for (var D = [], z = 0; z < h.length; z++) {
          var se = h[z], S = se(A, I, R, $, L, n);
          if (S == null)
            return null;
          S.data && r(S.data, "expectedType") && D.push(S.data.expectedType);
        }
        var xe = D.length > 0 ? ", expected one of type [" + D.join(", ") + "]" : "";
        return new g("Invalid " + $ + " `" + L + "` supplied to " + ("`" + R + "`" + xe + "."));
      }
      return m(O);
    }
    function X() {
      function h(x, k, O, A, I) {
        return Y(x[k]) ? null : new g("Invalid " + A + " `" + I + "` supplied to " + ("`" + O + "`, expected a ReactNode."));
      }
      return m(h);
    }
    function q(h, x, k, O, A) {
      return new g(
        (h || "React class") + ": " + x + " type `" + k + "." + O + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + A + "`."
      );
    }
    function M(h) {
      function x(k, O, A, I, R) {
        var $ = k[O], L = j($);
        if (L !== "object")
          return new g("Invalid " + I + " `" + R + "` of type `" + L + "` " + ("supplied to `" + A + "`, expected `object`."));
        for (var D in h) {
          var z = h[D];
          if (typeof z != "function")
            return q(A, I, R, D, F(z));
          var se = z($, D, A, I, R + "." + D, n);
          if (se)
            return se;
        }
        return null;
      }
      return m(x);
    }
    function Z(h) {
      function x(k, O, A, I, R) {
        var $ = k[O], L = j($);
        if (L !== "object")
          return new g("Invalid " + I + " `" + R + "` of type `" + L + "` " + ("supplied to `" + A + "`, expected `object`."));
        var D = t({}, k[O], h);
        for (var z in D) {
          var se = h[z];
          if (r(h, z) && typeof se != "function")
            return q(A, I, R, z, F(se));
          if (!se)
            return new g(
              "Invalid " + I + " `" + R + "` key `" + z + "` supplied to `" + A + "`.\nBad object: " + JSON.stringify(k[O], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(h), null, "  ")
            );
          var S = se($, z, A, I, R + "." + z, n);
          if (S)
            return S;
        }
        return null;
      }
      return m(x);
    }
    function Y(h) {
      switch (typeof h) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !h;
        case "object":
          if (Array.isArray(h))
            return h.every(Y);
          if (h === null || s(h))
            return !0;
          var x = f(h);
          if (x) {
            var k = x.call(h), O;
            if (x !== h.entries) {
              for (; !(O = k.next()).done; )
                if (!Y(O.value))
                  return !1;
            } else
              for (; !(O = k.next()).done; ) {
                var A = O.value;
                if (A && !Y(A[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function K(h, x) {
      return h === "symbol" ? !0 : x ? x["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && x instanceof Symbol : !1;
    }
    function j(h) {
      var x = typeof h;
      return Array.isArray(h) ? "array" : h instanceof RegExp ? "object" : K(x, h) ? "symbol" : x;
    }
    function F(h) {
      if (typeof h > "u" || h === null)
        return "" + h;
      var x = j(h);
      if (x === "object") {
        if (h instanceof Date)
          return "date";
        if (h instanceof RegExp)
          return "regexp";
      }
      return x;
    }
    function B(h) {
      var x = F(h);
      switch (x) {
        case "array":
        case "object":
          return "an " + x;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + x;
        default:
          return x;
      }
    }
    function N(h) {
      return !h.constructor || !h.constructor.name ? d : h.constructor.name;
    }
    return p.checkPropTypes = o, p.resetWarningCache = o.resetWarningCache, p.PropTypes = p, p;
  }, so;
}
var lo, fs;
function Gh() {
  if (fs) return lo;
  fs = 1;
  var e = /* @__PURE__ */ Ka();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, lo = function() {
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
  }, lo;
}
var ds;
function qh() {
  if (ds) return Gn.exports;
  if (ds = 1, process.env.NODE_ENV !== "production") {
    var e = Uc(), t = !0;
    Gn.exports = /* @__PURE__ */ Uh()(e.isElement, t);
  } else
    Gn.exports = /* @__PURE__ */ Gh()();
  return Gn.exports;
}
var Xh = /* @__PURE__ */ qh();
const re = /* @__PURE__ */ Hh(Xh);
function ps(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function ze(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? ps(Object(n), !0).forEach(function(r) {
      Vt(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : ps(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function mr(e) {
  "@babel/helpers - typeof";
  return mr = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, mr(e);
}
function Vt(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Kh(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), o, a;
  for (a = 0; a < r.length; a++)
    o = r[a], !(t.indexOf(o) >= 0) && (n[o] = e[o]);
  return n;
}
function Jh(e, t) {
  if (e == null) return {};
  var n = Kh(e, t), r, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      r = a[o], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function ta(e) {
  return Zh(e) || Qh(e) || eb(e) || tb();
}
function Zh(e) {
  if (Array.isArray(e)) return na(e);
}
function Qh(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function eb(e, t) {
  if (e) {
    if (typeof e == "string") return na(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return na(e, t);
  }
}
function na(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function tb() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function nb(e) {
  var t, n = e.beat, r = e.fade, o = e.beatFade, a = e.bounce, i = e.shake, s = e.flash, l = e.spin, c = e.spinPulse, u = e.spinReverse, f = e.pulse, d = e.fixedWidth, p = e.inverse, b = e.border, g = e.listItem, m = e.flip, y = e.size, E = e.rotation, w = e.pull, P = (t = {
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
    "fa-li": g,
    "fa-flip": m === !0,
    "fa-flip-horizontal": m === "horizontal" || m === "both",
    "fa-flip-vertical": m === "vertical" || m === "both"
  }, Vt(t, "fa-".concat(y), typeof y < "u" && y !== null), Vt(t, "fa-rotate-".concat(E), typeof E < "u" && E !== null && E !== 0), Vt(t, "fa-pull-".concat(w), typeof w < "u" && w !== null), Vt(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(P).map(function(v) {
    return P[v] ? v : null;
  }).filter(function(v) {
    return v;
  });
}
function rb(e) {
  return e = e - 0, e === e;
}
function qc(e) {
  return rb(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var ob = ["style"];
function ab(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function ib(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), o = qc(n.slice(0, r)), a = n.slice(r + 1).trim();
    return o.startsWith("webkit") ? t[ab(o)] = a : t[o] = a, t;
  }, {});
}
function Xc(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(l) {
    return Xc(e, l);
  }), o = Object.keys(t.attributes || {}).reduce(function(l, c) {
    var u = t.attributes[c];
    switch (c) {
      case "class":
        l.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        l.attrs.style = ib(u);
        break;
      default:
        c.indexOf("aria-") === 0 || c.indexOf("data-") === 0 ? l.attrs[c.toLowerCase()] = u : l.attrs[qc(c)] = u;
    }
    return l;
  }, {
    attrs: {}
  }), a = n.style, i = a === void 0 ? {} : a, s = Jh(n, ob);
  return o.attrs.style = ze(ze({}, o.attrs.style), i), e.apply(void 0, [t.tag, ze(ze({}, o.attrs), s)].concat(ta(r)));
}
var Kc = !1;
try {
  Kc = process.env.NODE_ENV === "production";
} catch {
}
function sb() {
  if (!Kc && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function ms(e) {
  if (e && mr(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (ea.icon)
    return ea.icon(e);
  if (e === null)
    return null;
  if (e && mr(e) === "object" && e.prefix && e.iconName)
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
function co(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Vt({}, e, t) : {};
}
var gs = {
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
}, Te = /* @__PURE__ */ ee.forwardRef(function(e, t) {
  var n = ze(ze({}, gs), e), r = n.icon, o = n.mask, a = n.symbol, i = n.className, s = n.title, l = n.titleId, c = n.maskId, u = ms(r), f = co("classes", [].concat(ta(nb(n)), ta((i || "").split(" ")))), d = co("transform", typeof n.transform == "string" ? ea.transform(n.transform) : n.transform), p = co("mask", ms(o)), b = zh(u, ze(ze(ze(ze({}, f), d), p), {}, {
    symbol: a,
    title: s,
    titleId: l,
    maskId: c
  }));
  if (!b)
    return sb("Could not find icon", u), null;
  var g = b.abstract, m = {
    ref: t
  };
  return Object.keys(n).forEach(function(y) {
    gs.hasOwnProperty(y) || (m[y] = n[y]);
  }), lb(g[0], m);
});
Te.displayName = "FontAwesomeIcon";
Te.propTypes = {
  beat: re.bool,
  border: re.bool,
  beatFade: re.bool,
  bounce: re.bool,
  className: re.string,
  fade: re.bool,
  flash: re.bool,
  mask: re.oneOfType([re.object, re.array, re.string]),
  maskId: re.string,
  fixedWidth: re.bool,
  inverse: re.bool,
  flip: re.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: re.oneOfType([re.object, re.array, re.string]),
  listItem: re.bool,
  pull: re.oneOf(["right", "left"]),
  pulse: re.bool,
  rotation: re.oneOf([0, 90, 180, 270]),
  shake: re.bool,
  size: re.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: re.bool,
  spinPulse: re.bool,
  spinReverse: re.bool,
  symbol: re.oneOfType([re.bool, re.string]),
  title: re.string,
  titleId: re.string,
  transform: re.oneOfType([re.string, re.object]),
  swapOpacity: re.bool
};
var lb = Xc.bind(null, ee.createElement);
const Ja = "-", cb = (e) => {
  const t = fb(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(Ja);
      return a[0] === "" && a.length !== 1 && a.shift(), Jc(a, t) || ub(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const i = n[o] || [];
      return a && r[o] ? [...i, ...r[o]] : i;
    }
  };
}, Jc = (e, t) => {
  var n;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], o = t.nextPart.get(r), a = o ? Jc(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const i = e.join(Ja);
  return (n = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : n.classGroupId;
}, hs = /^\[(.+)\]$/, ub = (e) => {
  if (hs.test(e)) {
    const t = hs.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, fb = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return pb(Object.entries(e.classGroups), n).forEach(([o, a]) => {
    ra(a, r, o, t);
  }), r;
}, ra = (e, t, n, r) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : bs(t, o);
      a.classGroupId = n;
      return;
    }
    if (typeof o == "function") {
      if (db(o)) {
        ra(o(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: n
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      ra(i, bs(t, a), n, r);
    });
  });
}, bs = (e, t) => {
  let n = e;
  return t.split(Ja).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, db = (e) => e.isThemeGetter, pb = (e, t) => t ? e.map(([n, r]) => {
  const o = r.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [n, o];
}) : e, mb = (e) => {
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
}, Zc = "!", gb = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const l = [];
    let c = 0, u = 0, f;
    for (let m = 0; m < s.length; m++) {
      let y = s[m];
      if (c === 0) {
        if (y === o && (r || s.slice(m, m + a) === t)) {
          l.push(s.slice(u, m)), u = m + a;
          continue;
        }
        if (y === "/") {
          f = m;
          continue;
        }
      }
      y === "[" ? c++ : y === "]" && c--;
    }
    const d = l.length === 0 ? s : s.substring(u), p = d.startsWith(Zc), b = p ? d.substring(1) : d, g = f && f > u ? f - u : void 0;
    return {
      modifiers: l,
      hasImportantModifier: p,
      baseClassName: b,
      maybePostfixModifierPosition: g
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, hb = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, bb = (e) => ({
  cache: mb(e.cacheSize),
  parseClassName: gb(e),
  ...cb(e)
}), vb = /\s+/, yb = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(vb);
  let s = "";
  for (let l = i.length - 1; l >= 0; l -= 1) {
    const c = i[l], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: p
    } = n(c);
    let b = !!p, g = r(b ? d.substring(0, p) : d);
    if (!g) {
      if (!b) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (g = r(d), !g) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      b = !1;
    }
    const m = hb(u).join(":"), y = f ? m + Zc : m, E = y + g;
    if (a.includes(E))
      continue;
    a.push(E);
    const w = o(g, b);
    for (let P = 0; P < w.length; ++P) {
      const v = w[P];
      a.push(y + v);
    }
    s = c + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function xb() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = Qc(t)) && (r && (r += " "), r += n);
  return r;
}
const Qc = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = Qc(e[r])) && (n && (n += " "), n += t);
  return n;
};
function wb(e, ...t) {
  let n, r, o, a = i;
  function i(l) {
    const c = t.reduce((u, f) => f(u), e());
    return n = bb(c), r = n.cache.get, o = n.cache.set, a = s, s(l);
  }
  function s(l) {
    const c = r(l);
    if (c)
      return c;
    const u = yb(l, n);
    return o(l, u), u;
  }
  return function() {
    return a(xb.apply(null, arguments));
  };
}
const pe = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, eu = /^\[(?:([a-z-]+):)?(.+)\]$/i, Eb = /^\d+\/\d+$/, Sb = /* @__PURE__ */ new Set(["px", "full", "screen"]), Pb = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Ob = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, kb = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Ab = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Tb = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Ze = (e) => Jt(e) || Sb.has(e) || Eb.test(e), dt = (e) => cn(e, "length", Lb), Jt = (e) => !!e && !Number.isNaN(Number(e)), uo = (e) => cn(e, "number", Jt), gn = (e) => !!e && Number.isInteger(Number(e)), Cb = (e) => e.endsWith("%") && Jt(e.slice(0, -1)), ne = (e) => eu.test(e), pt = (e) => Pb.test(e), $b = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Nb = (e) => cn(e, $b, tu), Ib = (e) => cn(e, "position", tu), Rb = /* @__PURE__ */ new Set(["image", "url"]), Mb = (e) => cn(e, Rb, _b), Fb = (e) => cn(e, "", jb), hn = () => !0, cn = (e, t, n) => {
  const r = eu.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, Lb = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  Ob.test(e) && !kb.test(e)
), tu = () => !1, jb = (e) => Ab.test(e), _b = (e) => Tb.test(e), Db = () => {
  const e = pe("colors"), t = pe("spacing"), n = pe("blur"), r = pe("brightness"), o = pe("borderColor"), a = pe("borderRadius"), i = pe("borderSpacing"), s = pe("borderWidth"), l = pe("contrast"), c = pe("grayscale"), u = pe("hueRotate"), f = pe("invert"), d = pe("gap"), p = pe("gradientColorStops"), b = pe("gradientColorStopPositions"), g = pe("inset"), m = pe("margin"), y = pe("opacity"), E = pe("padding"), w = pe("saturate"), P = pe("scale"), v = pe("sepia"), H = pe("skew"), _ = pe("space"), J = pe("translate"), W = () => ["auto", "contain", "none"], X = () => ["auto", "hidden", "clip", "visible", "scroll"], q = () => ["auto", ne, t], M = () => [ne, t], Z = () => ["", Ze, dt], Y = () => ["auto", Jt, ne], K = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], j = () => ["solid", "dashed", "dotted", "double", "none"], F = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], B = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], N = () => ["", "0", ne], h = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], x = () => [Jt, ne];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [hn],
      spacing: [Ze, dt],
      blur: ["none", "", pt, ne],
      brightness: x(),
      borderColor: [e],
      borderRadius: ["none", "", "full", pt, ne],
      borderSpacing: M(),
      borderWidth: Z(),
      contrast: x(),
      grayscale: N(),
      hueRotate: x(),
      invert: N(),
      gap: M(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Cb, dt],
      inset: q(),
      margin: q(),
      opacity: x(),
      padding: M(),
      saturate: x(),
      scale: x(),
      sepia: N(),
      skew: x(),
      space: M(),
      translate: M()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", ne]
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
        columns: [pt]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": h()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": h()
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
        object: [...K(), ne]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: X()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": X()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": X()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: W()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": W()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": W()
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
        z: ["auto", gn, ne]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: q()
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
        flex: ["1", "auto", "initial", "none", ne]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: N()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: N()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", gn, ne]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [hn]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", gn, ne]
        }, ne]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": Y()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": Y()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [hn]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [gn, ne]
        }, ne]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": Y()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": Y()
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
        "auto-cols": ["auto", "min", "max", "fr", ne]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", ne]
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
        justify: ["normal", ...B()]
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
        content: ["normal", ...B(), "baseline"]
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
        "place-content": [...B(), "baseline"]
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
        p: [E]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [E]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [E]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [E]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [E]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [E]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [E]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [E]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [E]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [m]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [m]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [m]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [m]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [m]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [m]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [m]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [m]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [m]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", ne, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [ne, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [ne, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [pt]
        }, pt]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [ne, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [ne, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [ne, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [ne, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", pt, dt]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", uo]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [hn]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", ne]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Jt, uo]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Ze, ne]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", ne]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", ne]
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
        "placeholder-opacity": [y]
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
        "text-opacity": [y]
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
        decoration: [...j(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", Ze, dt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Ze, ne]
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
        indent: M()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", ne]
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
        content: ["none", ne]
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
        "bg-opacity": [y]
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
        bg: [...K(), Ib]
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
        bg: ["auto", "cover", "contain", Nb]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, Mb]
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
        "border-opacity": [y]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...j(), "hidden"]
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
        "divide-opacity": [y]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: j()
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
        outline: ["", ...j()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Ze, ne]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Ze, dt]
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
        ring: Z()
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
        "ring-opacity": [y]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [Ze, dt]
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
        shadow: ["", "inner", "none", pt, Fb]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [hn]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [y]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...F(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": F()
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
        "drop-shadow": ["", "none", pt, ne]
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
        saturate: [w]
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
        "backdrop-invert": [f]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [y]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [w]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", ne]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: x()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", ne]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: x()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", ne]
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
        scale: [P]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [P]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [P]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [gn, ne]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [J]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [J]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [H]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [H]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", ne]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", ne]
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
        "scroll-m": M()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": M()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": M()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": M()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": M()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": M()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": M()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": M()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": M()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": M()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": M()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": M()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": M()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": M()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": M()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": M()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": M()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": M()
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
        "will-change": ["auto", "scroll", "contents", "transform", ne]
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
        stroke: [Ze, dt, uo]
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
}, vs = /* @__PURE__ */ wb(Db);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Bt = {
  prefix: "fas",
  iconName: "spinner-third",
  icon: [512, 512, [], "f3f4", "M224 32c0-17.7 14.3-32 32-32C397.4 0 512 114.6 512 256c0 46.6-12.5 90.4-34.3 128c-8.8 15.3-28.4 20.5-43.7 11.7s-20.5-28.4-11.7-43.7c16.3-28.2 25.7-61 25.7-96c0-106-86-192-192-192c-17.7 0-32-14.3-32-32z"]
}, fo = ({
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
  function p(m) {
    switch (m) {
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
  const b = vs(
    i || l ? "opacity-50 pointer-events-none" : ""
  ), g = vs(
    "w-fit text-sm font-medium rounded-lg px-3 py-2 border border-transparent shadow-sm focus-visible:outline focus-visible:outline-0 focus-visible:outline-offset-0 transition-all duration-150 flex gap-2 items-center justify-center active:scale-95 transform",
    p(a),
    r,
    b
  );
  return o ? /* @__PURE__ */ we("label", { className: g, htmlFor: o, style: d.style, children: [
    l && !s ? /* @__PURE__ */ Q(Te, { icon: Bt, className: "animate-spin" }) : /* @__PURE__ */ Q(kt, { children: e && !s ? /* @__PURE__ */ Q(Te, { icon: e, className: t }) : null }),
    n,
    l && s ? /* @__PURE__ */ Q(Te, { icon: Bt, className: "animate-spin" }) : /* @__PURE__ */ Q(kt, { children: e && s ? /* @__PURE__ */ Q(Te, { icon: e, className: t }) : null })
  ] }) : c === "link" && u ? /* @__PURE__ */ we(
    "a",
    {
      href: u,
      className: g,
      style: d.style,
      ...d,
      target: f,
      children: [
        l && !s ? /* @__PURE__ */ Q(Te, { icon: Bt, className: "animate-spin" }) : /* @__PURE__ */ Q(kt, { children: e && !s ? /* @__PURE__ */ Q(Te, { icon: e, className: t }) : null }),
        n,
        l && s ? /* @__PURE__ */ Q(Te, { icon: Bt, className: "animate-spin" }) : /* @__PURE__ */ Q(kt, { children: e && s ? /* @__PURE__ */ Q(Te, { icon: e, className: t }) : null })
      ]
    }
  ) : /* @__PURE__ */ we(
    "button",
    {
      className: g,
      disabled: i || l,
      ...d,
      htmlFor: o,
      children: [
        l && !s ? /* @__PURE__ */ Q(Te, { icon: Bt, className: "animate-spin" }) : /* @__PURE__ */ Q(kt, { children: e && !s ? /* @__PURE__ */ Q(Te, { icon: e, className: t }) : null }),
        n,
        l && s ? /* @__PURE__ */ Q(Te, { icon: Bt, className: "animate-spin" }) : /* @__PURE__ */ Q(kt, { children: e && s ? /* @__PURE__ */ Q(Te, { icon: e, className: t }) : null })
      ]
    }
  );
};
var tr = /* @__PURE__ */ ((e) => (e[e.ALL = 0] = "ALL", e[e.FEATURED = 1] = "FEATURED", e[e.MINE = 2] = "MINE", e[e.BOOKMARKED = 3] = "BOOKMARKED", e))(tr || {});
tr.FEATURED, tr.MINE, tr.BOOKMARKED;
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function zb(e, t, n) {
  return (t = Wb(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function ys(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function C(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? ys(Object(n), !0).forEach(function(r) {
      zb(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : ys(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Hb(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Wb(e) {
  var t = Hb(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const xs = () => {
};
let Za = {}, nu = {}, ru = null, ou = {
  mark: xs,
  measure: xs
};
try {
  typeof window < "u" && (Za = window), typeof document < "u" && (nu = document), typeof MutationObserver < "u" && (ru = MutationObserver), typeof performance < "u" && (ou = performance);
} catch {
}
const {
  userAgent: ws = ""
} = Za.navigator || {}, Et = Za, ge = nu, Es = ru, qn = ou;
Et.document;
const lt = !!ge.documentElement && !!ge.head && typeof ge.addEventListener == "function" && typeof ge.createElement == "function", au = ~ws.indexOf("MSIE") || ~ws.indexOf("Trident/");
var Bb = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, Yb = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, iu = {
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
}, Vb = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, su = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Ae = "classic", jr = "duotone", Ub = "sharp", Gb = "sharp-duotone", lu = [Ae, jr, Ub, Gb], qb = {
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
}, Xb = {
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
}, Kb = /* @__PURE__ */ new Map([["classic", {
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
}]]), Jb = {
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
}, Zb = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Ss = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, Qb = ["kit"], ev = {
  kit: {
    "fa-kit": "fak"
  }
}, tv = ["fak", "fakd"], nv = {
  kit: {
    fak: "fa-kit"
  }
}, Ps = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Xn = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, rv = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], ov = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], av = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, iv = {
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
}, sv = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, oa = {
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
}, lv = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], aa = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...rv, ...lv], cv = ["solid", "regular", "light", "thin", "duotone", "brands"], cu = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], uv = cu.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), fv = [...Object.keys(sv), ...cv, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Xn.GROUP, Xn.SWAP_OPACITY, Xn.PRIMARY, Xn.SECONDARY].concat(cu.map((e) => "".concat(e, "x"))).concat(uv.map((e) => "w-".concat(e))), dv = {
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
const at = "___FONT_AWESOME___", ia = 16, uu = "fa", fu = "svg-inline--fa", zt = "data-fa-i2svg", sa = "data-fa-pseudo-element", pv = "data-fa-pseudo-element-pending", Qa = "data-prefix", ei = "data-icon", Os = "fontawesome-i2svg", mv = "async", gv = ["HTML", "HEAD", "STYLE", "SCRIPT"], du = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Hn(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[Ae];
    }
  });
}
const pu = C({}, iu);
pu[Ae] = C(C(C(C({}, {
  "fa-duotone": "duotone"
}), iu[Ae]), Ss.kit), Ss["kit-duotone"]);
const hv = Hn(pu), la = C({}, Jb);
la[Ae] = C(C(C(C({}, {
  duotone: "fad"
}), la[Ae]), Ps.kit), Ps["kit-duotone"]);
const ks = Hn(la), ca = C({}, oa);
ca[Ae] = C(C({}, ca[Ae]), nv.kit);
const ti = Hn(ca), ua = C({}, iv);
ua[Ae] = C(C({}, ua[Ae]), ev.kit);
Hn(ua);
const bv = Bb, mu = "fa-layers-text", vv = Yb, yv = C({}, qb);
Hn(yv);
const xv = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], po = Vb, wv = [...Qb, ...fv], En = Et.FontAwesomeConfig || {};
function Ev(e) {
  var t = ge.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function Sv(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
ge && typeof ge.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [n, r] = t;
  const o = Sv(Ev(n));
  o != null && (En[r] = o);
});
const gu = {
  styleDefault: "solid",
  familyDefault: Ae,
  cssPrefix: uu,
  replacementClass: fu,
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
En.familyPrefix && (En.cssPrefix = En.familyPrefix);
const rn = C(C({}, gu), En);
rn.autoReplaceSvg || (rn.observeMutations = !1);
const U = {};
Object.keys(gu).forEach((e) => {
  Object.defineProperty(U, e, {
    enumerable: !0,
    set: function(t) {
      rn[e] = t, Sn.forEach((n) => n(U));
    },
    get: function() {
      return rn[e];
    }
  });
});
Object.defineProperty(U, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    rn.cssPrefix = e, Sn.forEach((t) => t(U));
  },
  get: function() {
    return rn.cssPrefix;
  }
});
Et.FontAwesomeConfig = U;
const Sn = [];
function Pv(e) {
  return Sn.push(e), () => {
    Sn.splice(Sn.indexOf(e), 1);
  };
}
const mt = ia, Ye = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function Ov(e) {
  if (!e || !lt)
    return;
  const t = ge.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = ge.head.childNodes;
  let r = null;
  for (let o = n.length - 1; o > -1; o--) {
    const a = n[o], i = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = a);
  }
  return ge.head.insertBefore(t, r), e;
}
const kv = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function In() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += kv[Math.random() * 62 | 0];
  return t;
}
function un(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function ni(e) {
  return e.classList ? un(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function hu(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Av(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(hu(e[n]), '" '), "").trim();
}
function _r(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function ri(e) {
  return e.size !== Ye.size || e.x !== Ye.x || e.y !== Ye.y || e.rotate !== Ye.rotate || e.flipX || e.flipY;
}
function Tv(e) {
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
function Cv(e) {
  let {
    transform: t,
    width: n = ia,
    height: r = ia,
    startCentered: o = !1
  } = e, a = "";
  return o && au ? a += "translate(".concat(t.x / mt - n / 2, "em, ").concat(t.y / mt - r / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / mt, "em), calc(-50% + ").concat(t.y / mt, "em)) ") : a += "translate(".concat(t.x / mt, "em, ").concat(t.y / mt, "em) "), a += "scale(".concat(t.size / mt * (t.flipX ? -1 : 1), ", ").concat(t.size / mt * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var $v = `:root, :host {
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
function bu() {
  const e = uu, t = fu, n = U.cssPrefix, r = U.replacementClass;
  let o = $v;
  if (n !== e || r !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return o;
}
let As = !1;
function mo() {
  U.autoAddCss && !As && (Ov(bu()), As = !0);
}
var Nv = {
  mixout() {
    return {
      dom: {
        css: bu,
        insertCss: mo
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        mo();
      },
      beforeI2svg() {
        mo();
      }
    };
  }
};
const it = Et || {};
it[at] || (it[at] = {});
it[at].styles || (it[at].styles = {});
it[at].hooks || (it[at].hooks = {});
it[at].shims || (it[at].shims = []);
var Ve = it[at];
const vu = [], yu = function() {
  ge.removeEventListener("DOMContentLoaded", yu), gr = 1, vu.map((e) => e());
};
let gr = !1;
lt && (gr = (ge.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(ge.readyState), gr || ge.addEventListener("DOMContentLoaded", yu));
function Iv(e) {
  lt && (gr ? setTimeout(e, 0) : vu.push(e));
}
function Wn(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? hu(e) : "<".concat(t, " ").concat(Av(n), ">").concat(r.map(Wn).join(""), "</").concat(t, ">");
}
function Ts(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var go = function(t, n, r, o) {
  var a = Object.keys(t), i = a.length, s = n, l, c, u;
  for (r === void 0 ? (l = 1, u = t[a[0]]) : (l = 0, u = r); l < i; l++)
    c = a[l], u = s(u, t[c], c, t);
  return u;
};
function Rv(e) {
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
function fa(e) {
  const t = Rv(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function Mv(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), o;
  return r >= 55296 && r <= 56319 && n > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (r - 55296) * 1024 + o - 56320 + 65536 : r;
}
function Cs(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return !!r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function da(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, o = Cs(t);
  typeof Ve.hooks.addPack == "function" && !r ? Ve.hooks.addPack(e, Cs(t)) : Ve.styles[e] = C(C({}, Ve.styles[e] || {}), o), e === "fas" && da("fa", t);
}
const {
  styles: Rn,
  shims: Fv
} = Ve, xu = Object.keys(ti), Lv = xu.reduce((e, t) => (e[t] = Object.keys(ti[t]), e), {});
let oi = null, wu = {}, Eu = {}, Su = {}, Pu = {}, Ou = {};
function jv(e) {
  return ~wv.indexOf(e);
}
function _v(e, t) {
  const n = t.split("-"), r = n[0], o = n.slice(1).join("-");
  return r === e && o !== "" && !jv(o) ? o : null;
}
const ku = () => {
  const e = (r) => go(Rn, (o, a, i) => (o[i] = go(a, r, {}), o), {});
  wu = e((r, o, a) => (o[3] && (r[o[3]] = a), o[2] && o[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = a;
  }), r)), Eu = e((r, o, a) => (r[a] = a, o[2] && o[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = a;
  }), r)), Ou = e((r, o, a) => {
    const i = o[2];
    return r[a] = a, i.forEach((s) => {
      r[s] = a;
    }), r;
  });
  const t = "far" in Rn || U.autoFetchSvg, n = go(Fv, (r, o) => {
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
  Su = n.names, Pu = n.unicodes, oi = Dr(U.styleDefault, {
    family: U.familyDefault
  });
};
Pv((e) => {
  oi = Dr(e.styleDefault, {
    family: U.familyDefault
  });
});
ku();
function ai(e, t) {
  return (wu[e] || {})[t];
}
function Dv(e, t) {
  return (Eu[e] || {})[t];
}
function It(e, t) {
  return (Ou[e] || {})[t];
}
function Au(e) {
  return Su[e] || {
    prefix: null,
    iconName: null
  };
}
function zv(e) {
  const t = Pu[e], n = ai("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function St() {
  return oi;
}
const Tu = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function Hv(e) {
  let t = Ae;
  const n = xu.reduce((r, o) => (r[o] = "".concat(U.cssPrefix, "-").concat(o), r), {});
  return lu.forEach((r) => {
    (e.includes(n[r]) || e.some((o) => Lv[r].includes(o))) && (t = r);
  }), t;
}
function Dr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = Ae
  } = t, r = hv[n][e];
  if (n === jr && !e)
    return "fad";
  const o = ks[n][e] || ks[n][r], a = e in Ve.styles ? e : null;
  return o || a || null;
}
function Wv(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const o = _v(U.cssPrefix, r);
    o ? n = o : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function $s(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function zr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const o = aa.concat(ov), a = $s(e.filter((f) => o.includes(f))), i = $s(e.filter((f) => !aa.includes(f))), s = a.filter((f) => (r = f, !su.includes(f))), [l = null] = s, c = Hv(a), u = C(C({}, Wv(i)), {}, {
    prefix: Dr(l, {
      family: c
    })
  });
  return C(C(C({}, u), Uv({
    values: e,
    family: c,
    styles: Rn,
    config: U,
    canonical: u,
    givenPrefix: r
  })), Bv(n, r, u));
}
function Bv(e, t, n) {
  let {
    prefix: r,
    iconName: o
  } = n;
  if (e || !r || !o)
    return {
      prefix: r,
      iconName: o
    };
  const a = t === "fa" ? Au(o) : {}, i = It(r, o);
  return o = a.iconName || i || o, r = a.prefix || r, r === "far" && !Rn.far && Rn.fas && !U.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: o
  };
}
const Yv = lu.filter((e) => e !== Ae || e !== jr), Vv = Object.keys(oa).filter((e) => e !== Ae).map((e) => Object.keys(oa[e])).flat();
function Uv(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: o = "",
    styles: a = {},
    config: i = {}
  } = e, s = n === jr, l = t.includes("fa-duotone") || t.includes("fad"), c = i.familyDefault === "duotone", u = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (l || c || u) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && Yv.includes(n) && (Object.keys(a).find((d) => Vv.includes(d)) || i.autoFetchSvg)) {
    const d = Kb.get(n).defaultShortPrefixId;
    r.prefix = d, r.iconName = It(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || o === "fa") && (r.prefix = St() || "fas"), r;
}
class Gv {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const o = n.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = C(C({}, this.definitions[a] || {}), o[a]), da(a, o[a]);
      const i = ti[Ae][a];
      i && da(i, o[a]), ku();
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
let Ns = [], Ut = {};
const Zt = {}, qv = Object.keys(Zt);
function Xv(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return Ns = e, Ut = {}, Object.keys(Zt).forEach((r) => {
    qv.indexOf(r) === -1 && delete Zt[r];
  }), Ns.forEach((r) => {
    const o = r.mixout ? r.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (n[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((i) => {
        n[a] || (n[a] = {}), n[a][i] = o[a][i];
      });
    }), r.hooks) {
      const a = r.hooks();
      Object.keys(a).forEach((i) => {
        Ut[i] || (Ut[i] = []), Ut[i].push(a[i]);
      });
    }
    r.provides && r.provides(Zt);
  }), n;
}
function pa(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), o = 2; o < n; o++)
    r[o - 2] = arguments[o];
  return (Ut[e] || []).forEach((i) => {
    t = i.apply(null, [t, ...r]);
  }), t;
}
function Ht(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (Ut[e] || []).forEach((a) => {
    a.apply(null, n);
  });
}
function Pt() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Zt[e] ? Zt[e].apply(null, t) : void 0;
}
function ma(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || St();
  if (t)
    return t = It(n, t) || t, Ts(Cu.definitions, n, t) || Ts(Ve.styles, n, t);
}
const Cu = new Gv(), Kv = () => {
  U.autoReplaceSvg = !1, U.observeMutations = !1, Ht("noAuto");
}, Jv = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return lt ? (Ht("beforeI2svg", e), Pt("pseudoElements2svg", e), Pt("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    U.autoReplaceSvg === !1 && (U.autoReplaceSvg = !0), U.observeMutations = !0, Iv(() => {
      Qv({
        autoReplaceSvgRoot: t
      }), Ht("watch", e);
    });
  }
}, Zv = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: It(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = Dr(e[0]);
      return {
        prefix: n,
        iconName: It(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(U.cssPrefix, "-")) > -1 || e.match(bv))) {
      const t = zr(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || St(),
        iconName: It(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = St();
      return {
        prefix: t,
        iconName: It(t, e) || e
      };
    }
  }
}, Me = {
  noAuto: Kv,
  config: U,
  dom: Jv,
  parse: Zv,
  library: Cu,
  findIconDefinition: ma,
  toHtml: Wn
}, Qv = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = ge
  } = e;
  (Object.keys(Ve.styles).length > 0 || U.autoFetchSvg) && lt && U.autoReplaceSvg && Me.dom.i2svg({
    node: t
  });
};
function Hr(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => Wn(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!lt) return;
      const n = ge.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function ey(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: o,
    styles: a,
    transform: i
  } = e;
  if (ri(i) && n.found && !r.found) {
    const {
      width: s,
      height: l
    } = n, c = {
      x: s / l / 2,
      y: 0.5
    };
    o.style = _r(C(C({}, a), {}, {
      "transform-origin": "".concat(c.x + i.x / 16, "em ").concat(c.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function ty(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: o,
    symbol: a
  } = e;
  const i = a === !0 ? "".concat(t, "-").concat(U.cssPrefix, "-").concat(n) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: C(C({}, o), {}, {
        id: i
      }),
      children: r
    }]
  }];
}
function ii(e) {
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
  } = n.found ? n : t, b = tv.includes(r), g = [U.replacementClass, o ? "".concat(U.cssPrefix, "-").concat(o) : ""].filter((v) => u.classes.indexOf(v) === -1).filter((v) => v !== "" || !!v).concat(u.classes).join(" ");
  let m = {
    children: [],
    attributes: C(C({}, u.attributes), {}, {
      "data-prefix": r,
      "data-icon": o,
      class: g,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(d, " ").concat(p)
    })
  };
  const y = b && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(d / p * 16 * 0.0625, "em")
  } : {};
  f && (m.attributes[zt] = ""), s && (m.children.push({
    tag: "title",
    attributes: {
      id: m.attributes["aria-labelledby"] || "title-".concat(c || In())
    },
    children: [s]
  }), delete m.attributes.title);
  const E = C(C({}, m), {}, {
    prefix: r,
    iconName: o,
    main: t,
    mask: n,
    maskId: l,
    transform: a,
    symbol: i,
    styles: C(C({}, y), u.styles)
  }), {
    children: w,
    attributes: P
  } = n.found && t.found ? Pt("generateAbstractMask", E) || {
    children: [],
    attributes: {}
  } : Pt("generateAbstractIcon", E) || {
    children: [],
    attributes: {}
  };
  return E.children = w, E.attributes = P, i ? ty(E) : ey(E);
}
function Is(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: o,
    title: a,
    extra: i,
    watchable: s = !1
  } = e, l = C(C(C({}, i.attributes), a ? {
    title: a
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (l[zt] = "");
  const c = C({}, i.styles);
  ri(o) && (c.transform = Cv({
    transform: o,
    startCentered: !0,
    width: n,
    height: r
  }), c["-webkit-transform"] = c.transform);
  const u = _r(c);
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
function ny(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, o = C(C(C({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), a = _r(r.styles);
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
  styles: ho
} = Ve;
function ga(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let o = null;
  return Array.isArray(r) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(U.cssPrefix, "-").concat(po.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(U.cssPrefix, "-").concat(po.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(U.cssPrefix, "-").concat(po.PRIMARY),
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
const ry = {
  found: !1,
  width: 512,
  height: 512
};
function oy(e, t) {
  !du && !U.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function ha(e, t) {
  let n = t;
  return t === "fa" && U.styleDefault !== null && (t = St()), new Promise((r, o) => {
    if (n === "fa") {
      const a = Au(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && ho[t] && ho[t][e]) {
      const a = ho[t][e];
      return r(ga(a));
    }
    oy(e, t), r(C(C({}, ry), {}, {
      icon: U.showMissingIcons && e ? Pt("missingIconAbstract") || {} : {}
    }));
  });
}
const Rs = () => {
}, ba = U.measurePerformance && qn && qn.mark && qn.measure ? qn : {
  mark: Rs,
  measure: Rs
}, vn = 'FA "6.7.2"', ay = (e) => (ba.mark("".concat(vn, " ").concat(e, " begins")), () => $u(e)), $u = (e) => {
  ba.mark("".concat(vn, " ").concat(e, " ends")), ba.measure("".concat(vn, " ").concat(e), "".concat(vn, " ").concat(e, " begins"), "".concat(vn, " ").concat(e, " ends"));
};
var si = {
  begin: ay,
  end: $u
};
const nr = () => {
};
function Ms(e) {
  return typeof (e.getAttribute ? e.getAttribute(zt) : null) == "string";
}
function iy(e) {
  const t = e.getAttribute ? e.getAttribute(Qa) : null, n = e.getAttribute ? e.getAttribute(ei) : null;
  return t && n;
}
function sy(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(U.replacementClass);
}
function ly() {
  return U.autoReplaceSvg === !0 ? rr.replace : rr[U.autoReplaceSvg] || rr.replace;
}
function cy(e) {
  return ge.createElementNS("http://www.w3.org/2000/svg", e);
}
function uy(e) {
  return ge.createElement(e);
}
function Nu(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? cy : uy
  } = t;
  if (typeof e == "string")
    return ge.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(a) {
    r.setAttribute(a, e.attributes[a]);
  }), (e.children || []).forEach(function(a) {
    r.appendChild(Nu(a, {
      ceFn: n
    }));
  }), r;
}
function fy(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const rr = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(Nu(n), t);
      }), t.getAttribute(zt) === null && U.keepOriginalSource) {
        let n = ge.createComment(fy(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~ni(t).indexOf(U.replacementClass))
      return rr.replace(e);
    const r = new RegExp("".concat(U.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const a = n[0].attributes.class.split(" ").reduce((i, s) => (s === U.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = n.map((a) => Wn(a)).join(`
`);
    t.setAttribute(zt, ""), t.innerHTML = o;
  }
};
function Fs(e) {
  e();
}
function Iu(e, t) {
  const n = typeof t == "function" ? t : nr;
  if (e.length === 0)
    n();
  else {
    let r = Fs;
    U.mutateApproach === mv && (r = Et.requestAnimationFrame || Fs), r(() => {
      const o = ly(), a = si.begin("mutate");
      e.map(o), a(), n();
    });
  }
}
let li = !1;
function Ru() {
  li = !0;
}
function va() {
  li = !1;
}
let hr = null;
function Ls(e) {
  if (!Es || !U.observeMutations)
    return;
  const {
    treeCallback: t = nr,
    nodeCallback: n = nr,
    pseudoElementsCallback: r = nr,
    observeMutationsRoot: o = ge
  } = e;
  hr = new Es((a) => {
    if (li) return;
    const i = St();
    un(a).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Ms(s.addedNodes[0]) && (U.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && U.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && Ms(s.target) && ~xv.indexOf(s.attributeName))
        if (s.attributeName === "class" && iy(s.target)) {
          const {
            prefix: l,
            iconName: c
          } = zr(ni(s.target));
          s.target.setAttribute(Qa, l || i), c && s.target.setAttribute(ei, c);
        } else sy(s.target) && n(s.target);
    });
  }), lt && hr.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function dy() {
  hr && hr.disconnect();
}
function py(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, o) => {
    const a = o.split(":"), i = a[0], s = a.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function my(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = zr(ni(e));
  return o.prefix || (o.prefix = St()), t && n && (o.prefix = t, o.iconName = n), o.iconName && o.prefix || (o.prefix && r.length > 0 && (o.iconName = Dv(o.prefix, e.innerText) || ai(o.prefix, fa(e.innerText))), !o.iconName && U.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function gy(e) {
  const t = un(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return U.autoA11y && (n ? t["aria-labelledby"] = "".concat(U.replacementClass, "-title-").concat(r || In()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function hy() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: Ye,
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
function js(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: o
  } = my(e), a = gy(e), i = pa("parseNodeAttributes", {}, e);
  let s = t.styleParser ? py(e) : [];
  return C({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: Ye,
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
  styles: by
} = Ve;
function Mu(e) {
  const t = U.autoReplaceSvg === "nest" ? js(e, {
    styleParser: !1
  }) : js(e);
  return ~t.extra.classes.indexOf(mu) ? Pt("generateLayersText", e, t) : Pt("generateSvgReplacementMutation", e, t);
}
function vy() {
  return [...Zb, ...aa];
}
function _s(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!lt) return Promise.resolve();
  const n = ge.documentElement.classList, r = (u) => n.add("".concat(Os, "-").concat(u)), o = (u) => n.remove("".concat(Os, "-").concat(u)), a = U.autoFetchSvg ? vy() : su.concat(Object.keys(by));
  a.includes("fa") || a.push("fa");
  const i = [".".concat(mu, ":not([").concat(zt, "])")].concat(a.map((u) => ".".concat(u, ":not([").concat(zt, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = un(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), o("complete");
  else
    return Promise.resolve();
  const l = si.begin("onTree"), c = s.reduce((u, f) => {
    try {
      const d = Mu(f);
      d && u.push(d);
    } catch (d) {
      du || d.name === "MissingIcon" && console.error(d);
    }
    return u;
  }, []);
  return new Promise((u, f) => {
    Promise.all(c).then((d) => {
      Iu(d, () => {
        r("active"), r("complete"), o("pending"), typeof t == "function" && t(), l(), u();
      });
    }).catch((d) => {
      l(), f(d);
    });
  });
}
function yy(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  Mu(e).then((n) => {
    n && Iu([n], t);
  });
}
function xy(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : ma(t || {});
    let {
      mask: o
    } = n;
    return o && (o = (o || {}).icon ? o : ma(o || {})), e(r, C(C({}, n), {}, {
      mask: o
    }));
  };
}
const wy = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = Ye,
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
  return Hr(C({
    type: "icon"
  }, e), () => (Ht("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), U.autoA11y && (i ? c["aria-labelledby"] = "".concat(U.replacementClass, "-title-").concat(s || In()) : (c["aria-hidden"] = "true", c.focusable = "false")), ii({
    icons: {
      main: ga(p),
      mask: o ? ga(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: f,
    iconName: d,
    transform: C(C({}, Ye), n),
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
var Ey = {
  mixout() {
    return {
      icon: xy(wy)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = _s, e.nodeCallback = yy, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = ge,
        callback: r = () => {
        }
      } = t;
      return _s(n, r);
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
        Promise.all([ha(r, i), c.iconName ? ha(c.iconName, c.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((b) => {
          let [g, m] = b;
          d([t, ii({
            icons: {
              main: g,
              mask: m
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
      const s = _r(i);
      s.length > 0 && (r.style = s);
      let l;
      return ri(a) && (l = Pt("generateAbstractTransformGrouping", {
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
}, Sy = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return Hr({
          type: "layer"
        }, () => {
          Ht("beforeDOMElementCreation", {
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
              class: ["".concat(U.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, Py = {
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
        return Hr({
          type: "counter",
          content: e
        }, () => (Ht("beforeDOMElementCreation", {
          content: e,
          params: t
        }), ny({
          content: e.toString(),
          title: n,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(U.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, Oy = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = Ye,
          title: r = null,
          classes: o = [],
          attributes: a = {},
          styles: i = {}
        } = t;
        return Hr({
          type: "text",
          content: e
        }, () => (Ht("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Is({
          content: e,
          transform: C(C({}, Ye), n),
          title: r,
          extra: {
            attributes: a,
            styles: i,
            classes: ["".concat(U.cssPrefix, "-layers-text"), ...o]
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
      if (au) {
        const l = parseInt(getComputedStyle(t).fontSize, 10), c = t.getBoundingClientRect();
        i = c.width / l, s = c.height / l;
      }
      return U.autoA11y && !r && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, Is({
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
const ky = new RegExp('"', "ug"), Ds = [1105920, 1112319], zs = C(C(C(C({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), Xb), dv), av), ya = Object.keys(zs).reduce((e, t) => (e[t.toLowerCase()] = zs[t], e), {}), Ay = Object.keys(ya).reduce((e, t) => {
  const n = ya[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function Ty(e) {
  const t = e.replace(ky, ""), n = Mv(t, 0), r = n >= Ds[0] && n <= Ds[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: fa(o ? t[0] : t),
    isSecondary: r || o
  };
}
function Cy(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), o = isNaN(r) ? "normal" : r;
  return (ya[n] || {})[o] || Ay[n];
}
function Hs(e, t) {
  const n = "".concat(pv).concat(t.replace(":", "-"));
  return new Promise((r, o) => {
    if (e.getAttribute(n) !== null)
      return r();
    const i = un(e.children).filter((d) => d.getAttribute(sa) === t)[0], s = Et.getComputedStyle(e, t), l = s.getPropertyValue("font-family"), c = l.match(vv), u = s.getPropertyValue("font-weight"), f = s.getPropertyValue("content");
    if (i && !c)
      return e.removeChild(i), r();
    if (c && f !== "none" && f !== "") {
      const d = s.getPropertyValue("content");
      let p = Cy(l, u);
      const {
        value: b,
        isSecondary: g
      } = Ty(d), m = c[0].startsWith("FontAwesome");
      let y = ai(p, b), E = y;
      if (m) {
        const w = zv(b);
        w.iconName && w.prefix && (y = w.iconName, p = w.prefix);
      }
      if (y && !g && (!i || i.getAttribute(Qa) !== p || i.getAttribute(ei) !== E)) {
        e.setAttribute(n, E), i && e.removeChild(i);
        const w = hy(), {
          extra: P
        } = w;
        P.attributes[sa] = t, ha(y, p).then((v) => {
          const H = ii(C(C({}, w), {}, {
            icons: {
              main: v,
              mask: Tu()
            },
            prefix: p,
            iconName: E,
            extra: P,
            watchable: !0
          })), _ = ge.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(_, e.firstChild) : e.appendChild(_), _.outerHTML = H.map((J) => Wn(J)).join(`
`), e.removeAttribute(n), r();
        }).catch(o);
      } else
        r();
    } else
      r();
  });
}
function $y(e) {
  return Promise.all([Hs(e, "::before"), Hs(e, "::after")]);
}
function Ny(e) {
  return e.parentNode !== document.head && !~gv.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(sa) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Ws(e) {
  if (lt)
    return new Promise((t, n) => {
      const r = un(e.querySelectorAll("*")).filter(Ny).map($y), o = si.begin("searchPseudoElements");
      Ru(), Promise.all(r).then(() => {
        o(), va(), t();
      }).catch(() => {
        o(), va(), n();
      });
    });
}
var Iy = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Ws, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = ge
      } = t;
      U.searchPseudoElements && Ws(n);
    };
  }
};
let Bs = !1;
var Ry = {
  mixout() {
    return {
      dom: {
        unwatch() {
          Ru(), Bs = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Ls(pa("mutationObserverCallbacks", {}));
      },
      noAuto() {
        dy();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Bs ? va() : Ls(pa("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Ys = (e) => {
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
var My = {
  mixout() {
    return {
      parse: {
        transform: (e) => Ys(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = Ys(n)), e;
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
        attributes: C({}, d.outer),
        children: [{
          tag: "g",
          attributes: C({}, d.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: C(C({}, n.icon.attributes), d.path)
          }]
        }]
      };
    };
  }
};
const bo = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Vs(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function Fy(e) {
  return e.tag === "g" ? e.children : [e];
}
var Ly = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? zr(n.split(" ").map((o) => o.trim())) : Tu();
        return r.prefix || (r.prefix = St()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
      } = a, d = Tv({
        transform: s,
        containerWidth: u,
        iconWidth: l
      }), p = {
        tag: "rect",
        attributes: C(C({}, bo), {}, {
          fill: "white"
        })
      }, b = c.children ? {
        children: c.children.map(Vs)
      } : {}, g = {
        tag: "g",
        attributes: C({}, d.inner),
        children: [Vs(C({
          tag: c.tag,
          attributes: C(C({}, c.attributes), d.path)
        }, b))]
      }, m = {
        tag: "g",
        attributes: C({}, d.outer),
        children: [g]
      }, y = "mask-".concat(i || In()), E = "clip-".concat(i || In()), w = {
        tag: "mask",
        attributes: C(C({}, bo), {}, {
          id: y,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [p, m]
      }, P = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: E
          },
          children: Fy(f)
        }, w]
      };
      return n.push(P, {
        tag: "rect",
        attributes: C({
          fill: "currentColor",
          "clip-path": "url(#".concat(E, ")"),
          mask: "url(#".concat(y, ")")
        }, bo)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, jy = {
  provides(e) {
    let t = !1;
    Et.matchMedia && (t = Et.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: C(C({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = C(C({}, o), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: C(C({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: C(C({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: C(C({}, a), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(i), n.push({
        tag: "path",
        attributes: C(C({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: C(C({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: C(C({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: C(C({}, a), {}, {
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
}, _y = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, Dy = [Nv, Ey, Sy, Py, Oy, Iy, Ry, My, Ly, jy, _y];
Xv(Dy, {
  mixoutsTo: Me
});
Me.noAuto;
Me.config;
Me.library;
Me.dom;
const xa = Me.parse;
Me.findIconDefinition;
Me.toHtml;
const zy = Me.icon;
Me.layer;
Me.text;
Me.counter;
var Kn = { exports: {} }, Jn = { exports: {} }, ce = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Us;
function Hy() {
  if (Us) return ce;
  Us = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, b = e ? Symbol.for("react.lazy") : 60116, g = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, E = e ? Symbol.for("react.scope") : 60119;
  function w(v) {
    if (typeof v == "object" && v !== null) {
      var H = v.$$typeof;
      switch (H) {
        case t:
          switch (v = v.type, v) {
            case l:
            case c:
            case r:
            case a:
            case o:
            case f:
              return v;
            default:
              switch (v = v && v.$$typeof, v) {
                case s:
                case u:
                case b:
                case p:
                case i:
                  return v;
                default:
                  return H;
              }
          }
        case n:
          return H;
      }
    }
  }
  function P(v) {
    return w(v) === c;
  }
  return ce.AsyncMode = l, ce.ConcurrentMode = c, ce.ContextConsumer = s, ce.ContextProvider = i, ce.Element = t, ce.ForwardRef = u, ce.Fragment = r, ce.Lazy = b, ce.Memo = p, ce.Portal = n, ce.Profiler = a, ce.StrictMode = o, ce.Suspense = f, ce.isAsyncMode = function(v) {
    return P(v) || w(v) === l;
  }, ce.isConcurrentMode = P, ce.isContextConsumer = function(v) {
    return w(v) === s;
  }, ce.isContextProvider = function(v) {
    return w(v) === i;
  }, ce.isElement = function(v) {
    return typeof v == "object" && v !== null && v.$$typeof === t;
  }, ce.isForwardRef = function(v) {
    return w(v) === u;
  }, ce.isFragment = function(v) {
    return w(v) === r;
  }, ce.isLazy = function(v) {
    return w(v) === b;
  }, ce.isMemo = function(v) {
    return w(v) === p;
  }, ce.isPortal = function(v) {
    return w(v) === n;
  }, ce.isProfiler = function(v) {
    return w(v) === a;
  }, ce.isStrictMode = function(v) {
    return w(v) === o;
  }, ce.isSuspense = function(v) {
    return w(v) === f;
  }, ce.isValidElementType = function(v) {
    return typeof v == "string" || typeof v == "function" || v === r || v === c || v === a || v === o || v === f || v === d || typeof v == "object" && v !== null && (v.$$typeof === b || v.$$typeof === p || v.$$typeof === i || v.$$typeof === s || v.$$typeof === u || v.$$typeof === m || v.$$typeof === y || v.$$typeof === E || v.$$typeof === g);
  }, ce.typeOf = w, ce;
}
var ue = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Gs;
function Wy() {
  return Gs || (Gs = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, b = e ? Symbol.for("react.lazy") : 60116, g = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, E = e ? Symbol.for("react.scope") : 60119;
    function w(S) {
      return typeof S == "string" || typeof S == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      S === r || S === c || S === a || S === o || S === f || S === d || typeof S == "object" && S !== null && (S.$$typeof === b || S.$$typeof === p || S.$$typeof === i || S.$$typeof === s || S.$$typeof === u || S.$$typeof === m || S.$$typeof === y || S.$$typeof === E || S.$$typeof === g);
    }
    function P(S) {
      if (typeof S == "object" && S !== null) {
        var xe = S.$$typeof;
        switch (xe) {
          case t:
            var Xe = S.type;
            switch (Xe) {
              case l:
              case c:
              case r:
              case a:
              case o:
              case f:
                return Xe;
              default:
                var fn = Xe && Xe.$$typeof;
                switch (fn) {
                  case s:
                  case u:
                  case b:
                  case p:
                  case i:
                    return fn;
                  default:
                    return xe;
                }
            }
          case n:
            return xe;
        }
      }
    }
    var v = l, H = c, _ = s, J = i, W = t, X = u, q = r, M = b, Z = p, Y = n, K = a, j = o, F = f, B = !1;
    function N(S) {
      return B || (B = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), h(S) || P(S) === l;
    }
    function h(S) {
      return P(S) === c;
    }
    function x(S) {
      return P(S) === s;
    }
    function k(S) {
      return P(S) === i;
    }
    function O(S) {
      return typeof S == "object" && S !== null && S.$$typeof === t;
    }
    function A(S) {
      return P(S) === u;
    }
    function I(S) {
      return P(S) === r;
    }
    function R(S) {
      return P(S) === b;
    }
    function $(S) {
      return P(S) === p;
    }
    function L(S) {
      return P(S) === n;
    }
    function D(S) {
      return P(S) === a;
    }
    function z(S) {
      return P(S) === o;
    }
    function se(S) {
      return P(S) === f;
    }
    ue.AsyncMode = v, ue.ConcurrentMode = H, ue.ContextConsumer = _, ue.ContextProvider = J, ue.Element = W, ue.ForwardRef = X, ue.Fragment = q, ue.Lazy = M, ue.Memo = Z, ue.Portal = Y, ue.Profiler = K, ue.StrictMode = j, ue.Suspense = F, ue.isAsyncMode = N, ue.isConcurrentMode = h, ue.isContextConsumer = x, ue.isContextProvider = k, ue.isElement = O, ue.isForwardRef = A, ue.isFragment = I, ue.isLazy = R, ue.isMemo = $, ue.isPortal = L, ue.isProfiler = D, ue.isStrictMode = z, ue.isSuspense = se, ue.isValidElementType = w, ue.typeOf = P;
  }()), ue;
}
var qs;
function Fu() {
  return qs || (qs = 1, process.env.NODE_ENV === "production" ? Jn.exports = Hy() : Jn.exports = Wy()), Jn.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var vo, Xs;
function By() {
  if (Xs) return vo;
  Xs = 1;
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
  return vo = o() ? Object.assign : function(a, i) {
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
  }, vo;
}
var yo, Ks;
function ci() {
  if (Ks) return yo;
  Ks = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return yo = e, yo;
}
var xo, Js;
function Lu() {
  return Js || (Js = 1, xo = Function.call.bind(Object.prototype.hasOwnProperty)), xo;
}
var wo, Zs;
function Yy() {
  if (Zs) return wo;
  Zs = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ ci(), n = {}, r = /* @__PURE__ */ Lu();
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
  }, wo = o, wo;
}
var Eo, Qs;
function Vy() {
  if (Qs) return Eo;
  Qs = 1;
  var e = Fu(), t = By(), n = /* @__PURE__ */ ci(), r = /* @__PURE__ */ Lu(), o = /* @__PURE__ */ Yy(), a = function() {
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
  return Eo = function(s, l) {
    var c = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function f(h) {
      var x = h && (c && h[c] || h[u]);
      if (typeof x == "function")
        return x;
    }
    var d = "<<anonymous>>", p = {
      array: y("array"),
      bigint: y("bigint"),
      bool: y("boolean"),
      func: y("function"),
      number: y("number"),
      object: y("object"),
      string: y("string"),
      symbol: y("symbol"),
      any: E(),
      arrayOf: w,
      element: P(),
      elementType: v(),
      instanceOf: H,
      node: X(),
      objectOf: J,
      oneOf: _,
      oneOfType: W,
      shape: M,
      exact: Z
    };
    function b(h, x) {
      return h === x ? h !== 0 || 1 / h === 1 / x : h !== h && x !== x;
    }
    function g(h, x) {
      this.message = h, this.data = x && typeof x == "object" ? x : {}, this.stack = "";
    }
    g.prototype = Error.prototype;
    function m(h) {
      if (process.env.NODE_ENV !== "production")
        var x = {}, k = 0;
      function O(I, R, $, L, D, z, se) {
        if (L = L || d, z = z || $, se !== n) {
          if (l) {
            var S = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw S.name = "Invariant Violation", S;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var xe = L + ":" + $;
            !x[xe] && // Avoid spamming the console because they are often not actionable except for lib authors
            k < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + z + "` prop on `" + L + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), x[xe] = !0, k++);
          }
        }
        return R[$] == null ? I ? R[$] === null ? new g("The " + D + " `" + z + "` is marked as required " + ("in `" + L + "`, but its value is `null`.")) : new g("The " + D + " `" + z + "` is marked as required in " + ("`" + L + "`, but its value is `undefined`.")) : null : h(R, $, L, D, z);
      }
      var A = O.bind(null, !1);
      return A.isRequired = O.bind(null, !0), A;
    }
    function y(h) {
      function x(k, O, A, I, R, $) {
        var L = k[O], D = j(L);
        if (D !== h) {
          var z = F(L);
          return new g(
            "Invalid " + I + " `" + R + "` of type " + ("`" + z + "` supplied to `" + A + "`, expected ") + ("`" + h + "`."),
            { expectedType: h }
          );
        }
        return null;
      }
      return m(x);
    }
    function E() {
      return m(i);
    }
    function w(h) {
      function x(k, O, A, I, R) {
        if (typeof h != "function")
          return new g("Property `" + R + "` of component `" + A + "` has invalid PropType notation inside arrayOf.");
        var $ = k[O];
        if (!Array.isArray($)) {
          var L = j($);
          return new g("Invalid " + I + " `" + R + "` of type " + ("`" + L + "` supplied to `" + A + "`, expected an array."));
        }
        for (var D = 0; D < $.length; D++) {
          var z = h($, D, A, I, R + "[" + D + "]", n);
          if (z instanceof Error)
            return z;
        }
        return null;
      }
      return m(x);
    }
    function P() {
      function h(x, k, O, A, I) {
        var R = x[k];
        if (!s(R)) {
          var $ = j(R);
          return new g("Invalid " + A + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + O + "`, expected a single ReactElement."));
        }
        return null;
      }
      return m(h);
    }
    function v() {
      function h(x, k, O, A, I) {
        var R = x[k];
        if (!e.isValidElementType(R)) {
          var $ = j(R);
          return new g("Invalid " + A + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + O + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return m(h);
    }
    function H(h) {
      function x(k, O, A, I, R) {
        if (!(k[O] instanceof h)) {
          var $ = h.name || d, L = N(k[O]);
          return new g("Invalid " + I + " `" + R + "` of type " + ("`" + L + "` supplied to `" + A + "`, expected ") + ("instance of `" + $ + "`."));
        }
        return null;
      }
      return m(x);
    }
    function _(h) {
      if (!Array.isArray(h))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), i;
      function x(k, O, A, I, R) {
        for (var $ = k[O], L = 0; L < h.length; L++)
          if (b($, h[L]))
            return null;
        var D = JSON.stringify(h, function(se, S) {
          var xe = F(S);
          return xe === "symbol" ? String(S) : S;
        });
        return new g("Invalid " + I + " `" + R + "` of value `" + String($) + "` " + ("supplied to `" + A + "`, expected one of " + D + "."));
      }
      return m(x);
    }
    function J(h) {
      function x(k, O, A, I, R) {
        if (typeof h != "function")
          return new g("Property `" + R + "` of component `" + A + "` has invalid PropType notation inside objectOf.");
        var $ = k[O], L = j($);
        if (L !== "object")
          return new g("Invalid " + I + " `" + R + "` of type " + ("`" + L + "` supplied to `" + A + "`, expected an object."));
        for (var D in $)
          if (r($, D)) {
            var z = h($, D, A, I, R + "." + D, n);
            if (z instanceof Error)
              return z;
          }
        return null;
      }
      return m(x);
    }
    function W(h) {
      if (!Array.isArray(h))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var x = 0; x < h.length; x++) {
        var k = h[x];
        if (typeof k != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + B(k) + " at index " + x + "."
          ), i;
      }
      function O(A, I, R, $, L) {
        for (var D = [], z = 0; z < h.length; z++) {
          var se = h[z], S = se(A, I, R, $, L, n);
          if (S == null)
            return null;
          S.data && r(S.data, "expectedType") && D.push(S.data.expectedType);
        }
        var xe = D.length > 0 ? ", expected one of type [" + D.join(", ") + "]" : "";
        return new g("Invalid " + $ + " `" + L + "` supplied to " + ("`" + R + "`" + xe + "."));
      }
      return m(O);
    }
    function X() {
      function h(x, k, O, A, I) {
        return Y(x[k]) ? null : new g("Invalid " + A + " `" + I + "` supplied to " + ("`" + O + "`, expected a ReactNode."));
      }
      return m(h);
    }
    function q(h, x, k, O, A) {
      return new g(
        (h || "React class") + ": " + x + " type `" + k + "." + O + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + A + "`."
      );
    }
    function M(h) {
      function x(k, O, A, I, R) {
        var $ = k[O], L = j($);
        if (L !== "object")
          return new g("Invalid " + I + " `" + R + "` of type `" + L + "` " + ("supplied to `" + A + "`, expected `object`."));
        for (var D in h) {
          var z = h[D];
          if (typeof z != "function")
            return q(A, I, R, D, F(z));
          var se = z($, D, A, I, R + "." + D, n);
          if (se)
            return se;
        }
        return null;
      }
      return m(x);
    }
    function Z(h) {
      function x(k, O, A, I, R) {
        var $ = k[O], L = j($);
        if (L !== "object")
          return new g("Invalid " + I + " `" + R + "` of type `" + L + "` " + ("supplied to `" + A + "`, expected `object`."));
        var D = t({}, k[O], h);
        for (var z in D) {
          var se = h[z];
          if (r(h, z) && typeof se != "function")
            return q(A, I, R, z, F(se));
          if (!se)
            return new g(
              "Invalid " + I + " `" + R + "` key `" + z + "` supplied to `" + A + "`.\nBad object: " + JSON.stringify(k[O], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(h), null, "  ")
            );
          var S = se($, z, A, I, R + "." + z, n);
          if (S)
            return S;
        }
        return null;
      }
      return m(x);
    }
    function Y(h) {
      switch (typeof h) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !h;
        case "object":
          if (Array.isArray(h))
            return h.every(Y);
          if (h === null || s(h))
            return !0;
          var x = f(h);
          if (x) {
            var k = x.call(h), O;
            if (x !== h.entries) {
              for (; !(O = k.next()).done; )
                if (!Y(O.value))
                  return !1;
            } else
              for (; !(O = k.next()).done; ) {
                var A = O.value;
                if (A && !Y(A[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function K(h, x) {
      return h === "symbol" ? !0 : x ? x["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && x instanceof Symbol : !1;
    }
    function j(h) {
      var x = typeof h;
      return Array.isArray(h) ? "array" : h instanceof RegExp ? "object" : K(x, h) ? "symbol" : x;
    }
    function F(h) {
      if (typeof h > "u" || h === null)
        return "" + h;
      var x = j(h);
      if (x === "object") {
        if (h instanceof Date)
          return "date";
        if (h instanceof RegExp)
          return "regexp";
      }
      return x;
    }
    function B(h) {
      var x = F(h);
      switch (x) {
        case "array":
        case "object":
          return "an " + x;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + x;
        default:
          return x;
      }
    }
    function N(h) {
      return !h.constructor || !h.constructor.name ? d : h.constructor.name;
    }
    return p.checkPropTypes = o, p.resetWarningCache = o.resetWarningCache, p.PropTypes = p, p;
  }, Eo;
}
var So, el;
function Uy() {
  if (el) return So;
  el = 1;
  var e = /* @__PURE__ */ ci();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, So = function() {
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
  }, So;
}
var tl;
function Gy() {
  if (tl) return Kn.exports;
  if (tl = 1, process.env.NODE_ENV !== "production") {
    var e = Fu(), t = !0;
    Kn.exports = /* @__PURE__ */ Vy()(e.isElement, t);
  } else
    Kn.exports = /* @__PURE__ */ Uy()();
  return Kn.exports;
}
var qy = /* @__PURE__ */ Gy();
const oe = /* @__PURE__ */ vp(qy);
function nl(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function He(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? nl(Object(n), !0).forEach(function(r) {
      Gt(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : nl(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function br(e) {
  "@babel/helpers - typeof";
  return br = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, br(e);
}
function Gt(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Xy(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), o, a;
  for (a = 0; a < r.length; a++)
    o = r[a], !(t.indexOf(o) >= 0) && (n[o] = e[o]);
  return n;
}
function Ky(e, t) {
  if (e == null) return {};
  var n = Xy(e, t), r, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      r = a[o], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function wa(e) {
  return Jy(e) || Zy(e) || Qy(e) || e0();
}
function Jy(e) {
  if (Array.isArray(e)) return Ea(e);
}
function Zy(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Qy(e, t) {
  if (e) {
    if (typeof e == "string") return Ea(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return Ea(e, t);
  }
}
function Ea(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function e0() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function t0(e) {
  var t, n = e.beat, r = e.fade, o = e.beatFade, a = e.bounce, i = e.shake, s = e.flash, l = e.spin, c = e.spinPulse, u = e.spinReverse, f = e.pulse, d = e.fixedWidth, p = e.inverse, b = e.border, g = e.listItem, m = e.flip, y = e.size, E = e.rotation, w = e.pull, P = (t = {
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
    "fa-li": g,
    "fa-flip": m === !0,
    "fa-flip-horizontal": m === "horizontal" || m === "both",
    "fa-flip-vertical": m === "vertical" || m === "both"
  }, Gt(t, "fa-".concat(y), typeof y < "u" && y !== null), Gt(t, "fa-rotate-".concat(E), typeof E < "u" && E !== null && E !== 0), Gt(t, "fa-pull-".concat(w), typeof w < "u" && w !== null), Gt(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(P).map(function(v) {
    return P[v] ? v : null;
  }).filter(function(v) {
    return v;
  });
}
function n0(e) {
  return e = e - 0, e === e;
}
function ju(e) {
  return n0(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var r0 = ["style"];
function o0(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function a0(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), o = ju(n.slice(0, r)), a = n.slice(r + 1).trim();
    return o.startsWith("webkit") ? t[o0(o)] = a : t[o] = a, t;
  }, {});
}
function _u(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(l) {
    return _u(e, l);
  }), o = Object.keys(t.attributes || {}).reduce(function(l, c) {
    var u = t.attributes[c];
    switch (c) {
      case "class":
        l.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        l.attrs.style = a0(u);
        break;
      default:
        c.indexOf("aria-") === 0 || c.indexOf("data-") === 0 ? l.attrs[c.toLowerCase()] = u : l.attrs[ju(c)] = u;
    }
    return l;
  }, {
    attrs: {}
  }), a = n.style, i = a === void 0 ? {} : a, s = Ky(n, r0);
  return o.attrs.style = He(He({}, o.attrs.style), i), e.apply(void 0, [t.tag, He(He({}, o.attrs), s)].concat(wa(r)));
}
var Du = !1;
try {
  Du = process.env.NODE_ENV === "production";
} catch {
}
function i0() {
  if (!Du && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function rl(e) {
  if (e && br(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (xa.icon)
    return xa.icon(e);
  if (e === null)
    return null;
  if (e && br(e) === "object" && e.prefix && e.iconName)
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
function Po(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Gt({}, e, t) : {};
}
var ol = {
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
}, Pn = /* @__PURE__ */ ee.forwardRef(function(e, t) {
  var n = He(He({}, ol), e), r = n.icon, o = n.mask, a = n.symbol, i = n.className, s = n.title, l = n.titleId, c = n.maskId, u = rl(r), f = Po("classes", [].concat(wa(t0(n)), wa((i || "").split(" ")))), d = Po("transform", typeof n.transform == "string" ? xa.transform(n.transform) : n.transform), p = Po("mask", rl(o)), b = zy(u, He(He(He(He({}, f), d), p), {}, {
    symbol: a,
    title: s,
    titleId: l,
    maskId: c
  }));
  if (!b)
    return i0("Could not find icon", u), null;
  var g = b.abstract, m = {
    ref: t
  };
  return Object.keys(n).forEach(function(y) {
    ol.hasOwnProperty(y) || (m[y] = n[y]);
  }), s0(g[0], m);
});
Pn.displayName = "FontAwesomeIcon";
Pn.propTypes = {
  beat: oe.bool,
  border: oe.bool,
  beatFade: oe.bool,
  bounce: oe.bool,
  className: oe.string,
  fade: oe.bool,
  flash: oe.bool,
  mask: oe.oneOfType([oe.object, oe.array, oe.string]),
  maskId: oe.string,
  fixedWidth: oe.bool,
  inverse: oe.bool,
  flip: oe.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: oe.oneOfType([oe.object, oe.array, oe.string]),
  listItem: oe.bool,
  pull: oe.oneOf(["right", "left"]),
  pulse: oe.bool,
  rotation: oe.oneOf([0, 90, 180, 270]),
  shake: oe.bool,
  size: oe.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: oe.bool,
  spinPulse: oe.bool,
  spinReverse: oe.bool,
  symbol: oe.oneOfType([oe.bool, oe.string]),
  title: oe.string,
  titleId: oe.string,
  transform: oe.oneOfType([oe.string, oe.object]),
  swapOpacity: oe.bool
};
var s0 = _u.bind(null, ee.createElement);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const l0 = {
  prefix: "fas",
  iconName: "chevron-up",
  icon: [512, 512, [], "f077", "M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"]
}, c0 = {
  prefix: "fas",
  iconName: "circle-check",
  icon: [512, 512, [61533, "check-circle"], "f058", "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"]
}, u0 = {
  prefix: "fas",
  iconName: "check",
  icon: [448, 512, [10003, 10004], "f00c", "M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"]
}, h0 = ({
  items: e = [],
  onSelect: t,
  onAdd: n,
  triggerIcon: r,
  showAddButton: o = !1,
  disableAddButton: a = !1,
  showIconsInList: i = !1,
  mode: s = "default",
  triggerLabel: l,
  children: c,
  buttonClassName: u,
  panelClassName: f,
  onPanelAction: d,
  panelTitle: p,
  position: b = "top",
  align: g = "start",
  panelActionLabel: m,
  onOpenChange: y
}) => {
  const E = e.find((K) => K.selected), w = (K, j) => {
    s === "button" && K.action && d ? (d(K.action), j()) : (t == null || t(K), j());
  }, P = Je(
    "text-sm font-medium rounded-lg px-3 py-2 shadow-sm",
    "flex gap-2 items-center justify-center outline-none",
    "transition-all duration-150",
    "bg-ui-controls/60 px-3 text-base-fg hover:bg-ui-controls/90 border border-ui-controls-border",
    "active:scale-95 transform",
    u
  ), v = {
    top: "bottom-full",
    bottom: "top-full"
  }, H = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0"
  }, [_, J] = he(!1), W = ie(null), X = ie(null);
  be(() => () => {
    W.current && clearTimeout(W.current);
  }, []);
  const q = (K, j) => {
    s === "hoverSelect" && (J(!0), W.current && (clearTimeout(W.current), W.current = null), K || (W.current = setTimeout(() => {
      j();
    }, 100)));
  }, M = (K) => {
    s === "hoverSelect" && (J(!1), W.current && clearTimeout(W.current), W.current = setTimeout(() => {
      _ || K();
    }, 300));
  }, Z = () => {
    s === "hoverSelect" && (J(!0), W.current && (clearTimeout(W.current), W.current = null));
  }, Y = (K) => {
    s === "hoverSelect" && (J(!1), W.current && clearTimeout(W.current), W.current = setTimeout(() => {
      K();
    }, 300));
  };
  return /* @__PURE__ */ Q("div", { className: "relative inline-block", children: /* @__PURE__ */ Q(lm, { children: ({ open: K, close: j }) => /* @__PURE__ */ we(kt, { children: [
    (be(() => {
      y == null || y(K);
    }, [K]), null),
    /* @__PURE__ */ we(
      ac,
      {
        className: P,
        onMouseEnter: () => q(K, () => {
          X.current && !K && X.current.click();
        }),
        onMouseLeave: () => M(j),
        onClick: (F) => {
          s === "hoverSelect" && K && (F.preventDefault(), F.stopPropagation());
        },
        ref: X,
        children: [
          r,
          s === "toggle" && E ? /* @__PURE__ */ Q("span", { className: "truncate", children: E.label }) : null,
          s === "default" && l ? /* @__PURE__ */ Q("span", { className: "truncate", children: l }) : null,
          s === "hoverSelect" && E ? /* @__PURE__ */ we("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ Q("span", { className: "opacity-70", children: l }),
            /* @__PURE__ */ we("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ Q("span", { className: "truncate", children: E.label }),
              /* @__PURE__ */ Q(Pn, { icon: l0, className: "text-sm" })
            ] })
          ] }) : null
        ]
      }
    ),
    /* @__PURE__ */ Q(
      Hp,
      {
        show: K,
        enter: "transition duration-100 ease-out",
        enterFrom: b === "bottom" ? "translate-y-2 opacity-0" : "-translate-y-2 opacity-0",
        enterTo: "translate-y-0 opacity-100",
        leave: "transition duration-100 ease-in",
        leaveFrom: "translate-y-0 opacity-100",
        leaveTo: b === "bottom" ? "translate-y-2 opacity-0" : "-translate-y-2 opacity-0",
        children: /* @__PURE__ */ Q(
          ic,
          {
            static: !0,
            className: Je(
              "absolute transform-gpu z-10",
              v[b],
              H[g],
              b === "bottom" ? "origin-top" : "origin-bottom"
            ),
            children: /* @__PURE__ */ we(
              "div",
              {
                className: Je(
                  "z-10 min-w-48 mt-2 rounded-lg bg-ui-panel p-1.5 shadow-lg border border-ui-panel-border",
                  b === "top" ? "mb-2" : "mt-2",
                  f
                ),
                onMouseEnter: Z,
                onMouseLeave: () => Y(j),
                children: [
                  p && /* @__PURE__ */ we("div", { className: "mb-2 mt-0.5 flex justify-between px-1.5 text-sm font-normal text-base-fg opacity-70", children: [
                    p,
                    m && /* @__PURE__ */ Q(
                      "button",
                      {
                        onClick: () => {
                          d == null || d(m), j();
                        },
                        className: "text-end text-sm text-base-fg/85 hover:underline",
                        children: m
                      }
                    )
                  ] }),
                  s === "default" && c ? /* @__PURE__ */ Q("div", { className: "text-sm text-base-fg", children: typeof c == "function" ? c(j) : c }) : s === "hoverSelect" ? /* @__PURE__ */ we("div", { className: "flex flex-col gap-0 text-sm text-base-fg", children: [
                    e.map((F, B) => /* @__PURE__ */ we("div", { children: [
                      /* @__PURE__ */ Q(
                        "div",
                        {
                          onClick: () => {
                            F.disabled || w(F, j);
                          },
                          className: Je(
                            "group flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 transition-all",
                            F.selected ? "bg-black/40 border-l-4 border-primary" : "hover:bg-black/20",
                            F.disabled ? "!cursor-not-allowed opacity-50" : ""
                          ),
                          style: { minHeight: 48 },
                          children: /* @__PURE__ */ we("div", { className: "flex items-center gap-2 w-full", children: [
                            /* @__PURE__ */ we("div", { className: "flex items-start gap-2 grow", children: [
                              i && /* @__PURE__ */ Q("span", { className: "mt-1 flex h-5 w-5 items-center justify-center text-lg text-base-fg/80", children: F.icon }),
                              /* @__PURE__ */ we("div", { className: "flex flex-1 flex-col min-w-0", children: [
                                /* @__PURE__ */ Q("div", { className: "flex items-center gap-2 min-w-0", children: /* @__PURE__ */ Q("span", { className: "truncate font-semibold text-base-fg text-base", children: F.label }) }),
                                F.description && /* @__PURE__ */ Q("div", { className: "truncate text-xs text-base-fg/60 mt-0.5", children: F.description }),
                                /* @__PURE__ */ Q("div", { className: "flex flex-row gap-1 flex-wrap mt-1.5", children: F.badges && Array.isArray(F.badges) && F.badges.map((N, h) => /* @__PURE__ */ Q(
                                  "div",
                                  {
                                    className: "flex items-center gap-1 min-w-0",
                                    children: /* @__PURE__ */ we("span", { className: "inline-flex items-center rounded bg-black/40 px-1.5 py-0.5 text-xs font-medium text-base-fg gap-1", children: [
                                      (N == null ? void 0 : N.icon) && /* @__PURE__ */ Q("span", { children: N.icon }),
                                      (N == null ? void 0 : N.label) || ""
                                    ] })
                                  },
                                  h
                                )) })
                              ] })
                            ] }),
                            F.selected && /* @__PURE__ */ Q("span", { className: "text-primary text-xl font-bold bg-white rounded-full p-0 h-4 w-4 flex items-center justify-center mr-1", children: /* @__PURE__ */ Q(Pn, { icon: c0 }) })
                          ] })
                        }
                      ),
                      F.divider && /* @__PURE__ */ Q("div", { className: "my-1 border-t border-white/10" })
                    ] }, B)),
                    o && n && /* @__PURE__ */ Q(
                      fo,
                      {
                        variant: "secondary",
                        className: Je(
                          "w-full mb-0.5 mt-2 border-none py-1",
                          a ? "cursor-not-allowed bg-[#7B7B84]/50 opacity-50" : "bg-[#7B7B84] hover:bg-[#8c8c96]"
                        ),
                        onClick: n,
                        disabled: a,
                        children: "+ Add"
                      }
                    )
                  ] }) : /* @__PURE__ */ we("div", { className: "flex flex-col gap-0 text-sm text-base-fg", children: [
                    e.map((F, B) => /* @__PURE__ */ we("div", { children: [
                      /* @__PURE__ */ we(
                        fo,
                        {
                          className: Je(
                            "flex w-full items-center shadow-none justify-between px-1.5",
                            "bg-transparent hover:bg-ui-controls/60",
                            s === "toggle" && F.selected ? "hover:bg-ui-controls/80" : "",
                            F.disabled ? "!cursor-not-allowed opacity-50" : "",
                            "border-0"
                          ),
                          onClick: () => !F.disabled && w(F, j),
                          variant: "secondary",
                          disabled: F.disabled,
                          children: [
                            /* @__PURE__ */ we("div", { className: "flex items-center gap-2 truncate", children: [
                              i && F.icon,
                              s === "toggle" ? /* @__PURE__ */ Q(
                                "span",
                                {
                                  className: Je(
                                    "truncate",
                                    F.selected ? "text-base-fg" : "text-base-fg/70"
                                  ),
                                  children: F.label
                                }
                              ) : /* @__PURE__ */ Q("span", { className: "truncate", children: F.label })
                            ] }),
                            s === "toggle" && /* @__PURE__ */ Q(
                              "span",
                              {
                                className: Je(
                                  "ml-2 h-5 w-5 rounded-full border flex items-center justify-center transition-colors",
                                  F.selected ? "border-primary bg-primary" : "border-transparent bg-transparent"
                                ),
                                children: F.selected && /* @__PURE__ */ Q(
                                  Pn,
                                  {
                                    icon: u0,
                                    className: "text-base-fg text-xs font-bold"
                                  }
                                )
                              }
                            )
                          ]
                        }
                      ),
                      F.divider && /* @__PURE__ */ Q("div", { className: "my-1 border-t border-white/10" })
                    ] }, B)),
                    o && n && /* @__PURE__ */ Q(
                      fo,
                      {
                        variant: "secondary",
                        className: Je(
                          "w-full mb-0.5 mt-2 py-1 border-0",
                          a ? "cursor-not-allowed opacity-50" : ""
                        ),
                        onClick: n,
                        disabled: a,
                        children: "+ Add"
                      }
                    )
                  ] })
                ]
              }
            )
          }
        )
      }
    )
  ] }) }) });
};
export {
  h0 as PopoverMenu
};
