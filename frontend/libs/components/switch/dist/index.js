import { jsx as z, jsxs as lt } from "react/jsx-runtime";
import h, { useRef as E, useCallback as y, useEffect as S, useState as w, useMemo as P, useLayoutEffect as ut, useContext as k, createContext as M, forwardRef as st, Fragment as N, isValidElement as ct, cloneElement as dt, createElement as ft, useId as ie } from "react";
import { createPortal as pt } from "react-dom";
const Te = typeof document < "u" ? h.useLayoutEffect : () => {
};
function vt(e) {
  const n = E(null);
  return Te(() => {
    n.current = e;
  }, [
    e
  ]), y((...t) => {
    const r = n.current;
    return r == null ? void 0 : r(...t);
  }, []);
}
const H = (e) => {
  var n;
  return (n = e == null ? void 0 : e.ownerDocument) !== null && n !== void 0 ? n : document;
}, D = (e) => e && "window" in e && e.window === e ? e : H(e).defaultView || window;
function mt(e) {
  return e !== null && typeof e == "object" && "nodeType" in e && typeof e.nodeType == "number";
}
function bt(e) {
  return mt(e) && e.nodeType === Node.DOCUMENT_FRAGMENT_NODE && "host" in e;
}
let ht = !1;
function ae() {
  return ht;
}
function Le(e, n) {
  if (!ae()) return n && e ? e.contains(n) : !1;
  if (!e || !n) return !1;
  let t = n;
  for (; t !== null; ) {
    if (t === e) return !0;
    t.tagName === "SLOT" && t.assignedSlot ? t = t.assignedSlot.parentNode : bt(t) ? t = t.host : t = t.parentNode;
  }
  return !1;
}
const Z = (e = document) => {
  var n;
  if (!ae()) return e.activeElement;
  let t = e.activeElement;
  for (; t && "shadowRoot" in t && (!((n = t.shadowRoot) === null || n === void 0) && n.activeElement); ) t = t.shadowRoot.activeElement;
  return t;
};
function Fe(e) {
  return ae() && e.target.shadowRoot && e.composedPath ? e.composedPath()[0] : e.target;
}
function gt(e) {
  var n;
  return typeof window > "u" || window.navigator == null ? !1 : ((n = window.navigator.userAgentData) === null || n === void 0 ? void 0 : n.brands.some((t) => e.test(t.brand))) || e.test(window.navigator.userAgent);
}
function $t(e) {
  var n;
  return typeof window < "u" && window.navigator != null ? e.test(((n = window.navigator.userAgentData) === null || n === void 0 ? void 0 : n.platform) || window.navigator.platform) : !1;
}
function Pe(e) {
  let n = null;
  return () => (n == null && (n = e()), n);
}
const Et = Pe(function() {
  return $t(/^Mac/i);
}), yt = Pe(function() {
  return gt(/Android/i);
});
function Se() {
  let e = E(/* @__PURE__ */ new Map()), n = y((o, i, u, a) => {
    let l = a != null && a.once ? (...s) => {
      e.current.delete(u), u(...s);
    } : u;
    e.current.set(u, {
      type: i,
      eventTarget: o,
      fn: l,
      options: a
    }), o.addEventListener(i, l, a);
  }, []), t = y((o, i, u, a) => {
    var l;
    let s = ((l = e.current.get(u)) === null || l === void 0 ? void 0 : l.fn) || u;
    o.removeEventListener(i, s, a), e.current.delete(u);
  }, []), r = y(() => {
    e.current.forEach((o, i) => {
      t(o.eventTarget, o.type, i, o.options);
    });
  }, [
    t
  ]);
  return S(() => r, [
    r
  ]), {
    addGlobalListener: n,
    removeGlobalListener: t,
    removeAllGlobalListeners: r
  };
}
function wt(e) {
  return e.mozInputSource === 0 && e.isTrusted ? !0 : yt() && e.pointerType ? e.type === "click" && e.buttons === 1 : e.detail === 0 && !e.pointerType;
}
class ke {
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
  constructor(n, t) {
    this.nativeEvent = t, this.target = t.target, this.currentTarget = t.currentTarget, this.relatedTarget = t.relatedTarget, this.bubbles = t.bubbles, this.cancelable = t.cancelable, this.defaultPrevented = t.defaultPrevented, this.eventPhase = t.eventPhase, this.isTrusted = t.isTrusted, this.timeStamp = t.timeStamp, this.type = n;
  }
}
function He(e) {
  let n = E({
    isFocused: !1,
    observer: null
  });
  Te(() => {
    const r = n.current;
    return () => {
      r.observer && (r.observer.disconnect(), r.observer = null);
    };
  }, []);
  let t = vt((r) => {
    e == null || e(r);
  });
  return y((r) => {
    if (r.target instanceof HTMLButtonElement || r.target instanceof HTMLInputElement || r.target instanceof HTMLTextAreaElement || r.target instanceof HTMLSelectElement) {
      n.current.isFocused = !0;
      let o = r.target, i = (u) => {
        n.current.isFocused = !1, o.disabled && t(new ke("blur", u)), n.current.observer && (n.current.observer.disconnect(), n.current.observer = null);
      };
      o.addEventListener("focusout", i, {
        once: !0
      }), n.current.observer = new MutationObserver(() => {
        if (n.current.isFocused && o.disabled) {
          var u;
          (u = n.current.observer) === null || u === void 0 || u.disconnect();
          let a = o === document.activeElement ? null : document.activeElement;
          o.dispatchEvent(new FocusEvent("blur", {
            relatedTarget: a
          })), o.dispatchEvent(new FocusEvent("focusout", {
            bubbles: !0,
            relatedTarget: a
          }));
        }
      }), n.current.observer.observe(o, {
        attributes: !0,
        attributeFilter: [
          "disabled"
        ]
      });
    }
  }, [
    t
  ]);
}
let Tt = !1, B = null, ee = /* @__PURE__ */ new Set(), I = /* @__PURE__ */ new Map(), C = !1, te = !1;
const Lt = {
  Tab: !0,
  Escape: !0
};
function le(e, n) {
  for (let t of ee) t(e, n);
}
function Ft(e) {
  return !(e.metaKey || !Et() && e.altKey || e.ctrlKey || e.key === "Control" || e.key === "Shift" || e.key === "Meta");
}
function K(e) {
  C = !0, Ft(e) && (B = "keyboard", le("keyboard", e));
}
function T(e) {
  B = "pointer", (e.type === "mousedown" || e.type === "pointerdown") && (C = !0, le("pointer", e));
}
function xe(e) {
  wt(e) && (C = !0, B = "virtual");
}
function De(e) {
  e.target === window || e.target === document || Tt || !e.isTrusted || (!C && !te && (B = "virtual", le("virtual", e)), C = !1, te = !1);
}
function Ce() {
  C = !1, te = !0;
}
function ne(e) {
  if (typeof window > "u" || I.get(D(e))) return;
  const n = D(e), t = H(e);
  let r = n.HTMLElement.prototype.focus;
  n.HTMLElement.prototype.focus = function() {
    C = !0, r.apply(this, arguments);
  }, t.addEventListener("keydown", K, !0), t.addEventListener("keyup", K, !0), t.addEventListener("click", xe, !0), n.addEventListener("focus", De, !0), n.addEventListener("blur", Ce, !1), typeof PointerEvent < "u" ? (t.addEventListener("pointerdown", T, !0), t.addEventListener("pointermove", T, !0), t.addEventListener("pointerup", T, !0)) : (t.addEventListener("mousedown", T, !0), t.addEventListener("mousemove", T, !0), t.addEventListener("mouseup", T, !0)), n.addEventListener("beforeunload", () => {
    Me(e);
  }, {
    once: !0
  }), I.set(n, {
    focus: r
  });
}
const Me = (e, n) => {
  const t = D(e), r = H(e);
  n && r.removeEventListener("DOMContentLoaded", n), I.has(t) && (t.HTMLElement.prototype.focus = I.get(t).focus, r.removeEventListener("keydown", K, !0), r.removeEventListener("keyup", K, !0), r.removeEventListener("click", xe, !0), t.removeEventListener("focus", De, !0), t.removeEventListener("blur", Ce, !1), typeof PointerEvent < "u" ? (r.removeEventListener("pointerdown", T, !0), r.removeEventListener("pointermove", T, !0), r.removeEventListener("pointerup", T, !0)) : (r.removeEventListener("mousedown", T, !0), r.removeEventListener("mousemove", T, !0), r.removeEventListener("mouseup", T, !0)), I.delete(t));
};
function Pt(e) {
  const n = H(e);
  let t;
  return n.readyState !== "loading" ? ne(e) : (t = () => {
    ne(e);
  }, n.addEventListener("DOMContentLoaded", t)), () => Me(e, t);
}
typeof document < "u" && Pt();
function Ae() {
  return B !== "pointer";
}
const St = /* @__PURE__ */ new Set([
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
function kt(e, n, t) {
  let r = H(t == null ? void 0 : t.target);
  const o = typeof window < "u" ? D(t == null ? void 0 : t.target).HTMLInputElement : HTMLInputElement, i = typeof window < "u" ? D(t == null ? void 0 : t.target).HTMLTextAreaElement : HTMLTextAreaElement, u = typeof window < "u" ? D(t == null ? void 0 : t.target).HTMLElement : HTMLElement, a = typeof window < "u" ? D(t == null ? void 0 : t.target).KeyboardEvent : KeyboardEvent;
  return e = e || r.activeElement instanceof o && !St.has(r.activeElement.type) || r.activeElement instanceof i || r.activeElement instanceof u && r.activeElement.isContentEditable, !(e && n === "keyboard" && t instanceof a && !Lt[t.key]);
}
function Ht(e, n, t) {
  ne(), S(() => {
    let r = (o, i) => {
      kt(!!(t != null && t.isTextInput), o, i) && e(Ae());
    };
    return ee.add(r), () => {
      ee.delete(r);
    };
  }, n);
}
function xt(e) {
  let { isDisabled: n, onFocus: t, onBlur: r, onFocusChange: o } = e;
  const i = y((l) => {
    if (l.target === l.currentTarget)
      return r && r(l), o && o(!1), !0;
  }, [
    r,
    o
  ]), u = He(i), a = y((l) => {
    const s = H(l.target), d = s ? Z(s) : Z();
    l.target === l.currentTarget && d === Fe(l.nativeEvent) && (t && t(l), o && o(!0), u(l));
  }, [
    o,
    t,
    u
  ]);
  return {
    focusProps: {
      onFocus: !n && (t || o || r) ? a : void 0,
      onBlur: !n && (r || o) ? i : void 0
    }
  };
}
function Dt(e) {
  let { isDisabled: n, onBlurWithin: t, onFocusWithin: r, onFocusWithinChange: o } = e, i = E({
    isFocusWithin: !1
  }), { addGlobalListener: u, removeAllGlobalListeners: a } = Se(), l = y((c) => {
    c.currentTarget.contains(c.target) && i.current.isFocusWithin && !c.currentTarget.contains(c.relatedTarget) && (i.current.isFocusWithin = !1, a(), t && t(c), o && o(!1));
  }, [
    t,
    o,
    i,
    a
  ]), s = He(l), d = y((c) => {
    if (!c.currentTarget.contains(c.target)) return;
    const p = H(c.target), v = Z(p);
    if (!i.current.isFocusWithin && v === Fe(c.nativeEvent)) {
      r && r(c), o && o(!0), i.current.isFocusWithin = !0, s(c);
      let m = c.currentTarget;
      u(p, "focus", (f) => {
        if (i.current.isFocusWithin && !Le(m, f.target)) {
          let b = new ke("blur", new p.defaultView.FocusEvent("blur", {
            relatedTarget: f.target
          }));
          b.target = m, b.currentTarget = m, l(b);
        }
      }, {
        capture: !0
      });
    }
  }, [
    r,
    o,
    s,
    u,
    l
  ]);
  return n ? {
    focusWithinProps: {
      // These cannot be null, that would conflict in mergeProps
      onFocus: void 0,
      onBlur: void 0
    }
  } : {
    focusWithinProps: {
      onFocus: d,
      onBlur: l
    }
  };
}
let _ = !1, X = 0;
function re() {
  _ = !0, setTimeout(() => {
    _ = !1;
  }, 50);
}
function Ee(e) {
  e.pointerType === "touch" && re();
}
function Ct() {
  if (!(typeof document > "u"))
    return typeof PointerEvent < "u" ? document.addEventListener("pointerup", Ee) : document.addEventListener("touchend", re), X++, () => {
      X--, !(X > 0) && (typeof PointerEvent < "u" ? document.removeEventListener("pointerup", Ee) : document.removeEventListener("touchend", re));
    };
}
function Mt(e) {
  let { onHoverStart: n, onHoverChange: t, onHoverEnd: r, isDisabled: o } = e, [i, u] = w(!1), a = E({
    isHovered: !1,
    ignoreEmulatedMouseEvents: !1,
    pointerType: "",
    target: null
  }).current;
  S(Ct, []);
  let { addGlobalListener: l, removeAllGlobalListeners: s } = Se(), { hoverProps: d, triggerHoverEnd: c } = P(() => {
    let p = (f, b) => {
      if (a.pointerType = b, o || b === "touch" || a.isHovered || !f.currentTarget.contains(f.target)) return;
      a.isHovered = !0;
      let $ = f.currentTarget;
      a.target = $, l(H(f.target), "pointerover", (g) => {
        a.isHovered && a.target && !Le(a.target, g.target) && v(g, g.pointerType);
      }, {
        capture: !0
      }), n && n({
        type: "hoverstart",
        target: $,
        pointerType: b
      }), t && t(!0), u(!0);
    }, v = (f, b) => {
      let $ = a.target;
      a.pointerType = "", a.target = null, !(b === "touch" || !a.isHovered || !$) && (a.isHovered = !1, s(), r && r({
        type: "hoverend",
        target: $,
        pointerType: b
      }), t && t(!1), u(!1));
    }, m = {};
    return typeof PointerEvent < "u" ? (m.onPointerEnter = (f) => {
      _ && f.pointerType === "mouse" || p(f, f.pointerType);
    }, m.onPointerLeave = (f) => {
      !o && f.currentTarget.contains(f.target) && v(f, f.pointerType);
    }) : (m.onTouchStart = () => {
      a.ignoreEmulatedMouseEvents = !0;
    }, m.onMouseEnter = (f) => {
      !a.ignoreEmulatedMouseEvents && !_ && p(f, "mouse"), a.ignoreEmulatedMouseEvents = !1;
    }, m.onMouseLeave = (f) => {
      !o && f.currentTarget.contains(f.target) && v(f, "mouse");
    }), {
      hoverProps: m,
      triggerHoverEnd: v
    };
  }, [
    n,
    t,
    r,
    o,
    a,
    l,
    s
  ]);
  return S(() => {
    o && c({
      currentTarget: a.target
    }, a.pointerType);
  }, [
    o
  ]), {
    hoverProps: d,
    isHovered: i
  };
}
function At(e = {}) {
  let { autoFocus: n = !1, isTextInput: t, within: r } = e, o = E({
    isFocused: !1,
    isFocusVisible: n || Ae()
  }), [i, u] = w(!1), [a, l] = w(() => o.current.isFocused && o.current.isFocusVisible), s = y(() => l(o.current.isFocused && o.current.isFocusVisible), []), d = y((v) => {
    o.current.isFocused = v, u(v), s();
  }, [
    s
  ]);
  Ht((v) => {
    o.current.isFocusVisible = v, s();
  }, [], {
    isTextInput: t
  });
  let { focusProps: c } = xt({
    isDisabled: r,
    onFocusChange: d
  }), { focusWithinProps: p } = Dt({
    isDisabled: !r,
    onFocusWithinChange: d
  });
  return {
    isFocused: i,
    isFocusVisible: a,
    focusProps: r ? p : c
  };
}
var Ot = Object.defineProperty, jt = (e, n, t) => n in e ? Ot(e, n, { enumerable: !0, configurable: !0, writable: !0, value: t }) : e[n] = t, J = (e, n, t) => (jt(e, typeof n != "symbol" ? n + "" : n, t), t);
let Nt = class {
  constructor() {
    J(this, "current", this.detect()), J(this, "handoffState", "pending"), J(this, "currentId", 0);
  }
  set(n) {
    this.current !== n && (this.handoffState = "pending", this.currentId = 0, this.current = n);
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
}, Oe = new Nt();
function It(e) {
  var n, t;
  return Oe.isServer ? null : e ? "ownerDocument" in e ? e.ownerDocument : "current" in e ? (t = (n = e.current) == null ? void 0 : n.ownerDocument) != null ? t : document : null : document;
}
function Bt(e) {
  typeof queueMicrotask == "function" ? queueMicrotask(e) : Promise.resolve().then(e).catch((n) => setTimeout(() => {
    throw n;
  }));
}
function je() {
  let e = [], n = { addEventListener(t, r, o, i) {
    return t.addEventListener(r, o, i), n.add(() => t.removeEventListener(r, o, i));
  }, requestAnimationFrame(...t) {
    let r = requestAnimationFrame(...t);
    return n.add(() => cancelAnimationFrame(r));
  }, nextFrame(...t) {
    return n.requestAnimationFrame(() => n.requestAnimationFrame(...t));
  }, setTimeout(...t) {
    let r = setTimeout(...t);
    return n.add(() => clearTimeout(r));
  }, microTask(...t) {
    let r = { current: !0 };
    return Bt(() => {
      r.current && t[0]();
    }), n.add(() => {
      r.current = !1;
    });
  }, style(t, r, o) {
    let i = t.style.getPropertyValue(r);
    return Object.assign(t.style, { [r]: o }), this.add(() => {
      Object.assign(t.style, { [r]: i });
    });
  }, group(t) {
    let r = je();
    return t(r), this.add(() => r.dispose());
  }, add(t) {
    return e.includes(t) || e.push(t), () => {
      let r = e.indexOf(t);
      if (r >= 0) for (let o of e.splice(r, 1)) o();
    };
  }, dispose() {
    for (let t of e.splice(0)) t();
  } };
  return n;
}
function ue() {
  let [e] = w(je);
  return S(() => () => e.dispose(), [e]), e;
}
let se = (e, n) => {
  Oe.isServer ? S(e, n) : ut(e, n);
};
function Gt(e) {
  let n = E(e);
  return se(() => {
    n.current = e;
  }, [e]), n;
}
let L = function(e) {
  let n = Gt(e);
  return h.useCallback((...t) => n.current(...t), [n]);
};
function Wt(e) {
  let n = e.width / 2, t = e.height / 2;
  return { top: e.clientY - t, right: e.clientX + n, bottom: e.clientY + t, left: e.clientX - n };
}
function Rt(e, n) {
  return !(!e || !n || e.right < n.left || e.left > n.right || e.bottom < n.top || e.top > n.bottom);
}
function Ut({ disabled: e = !1 } = {}) {
  let n = E(null), [t, r] = w(!1), o = ue(), i = L(() => {
    n.current = null, r(!1), o.dispose();
  }), u = L((a) => {
    if (o.dispose(), n.current === null) {
      n.current = a.currentTarget, r(!0);
      {
        let l = It(a.currentTarget);
        o.addEventListener(l, "pointerup", i, !1), o.addEventListener(l, "pointermove", (s) => {
          if (n.current) {
            let d = Wt(s);
            r(Rt(d, n.current.getBoundingClientRect()));
          }
        }, !1), o.addEventListener(l, "pointercancel", i, !1);
      }
    }
  });
  return { pressed: t, pressProps: e ? {} : { onPointerDown: u, onPointerUp: i, onClick: i } };
}
let Kt = M(void 0);
function ce() {
  return k(Kt);
}
function ye(...e) {
  return Array.from(new Set(e.flatMap((n) => typeof n == "string" ? n.split(" ") : []))).filter(Boolean).join(" ");
}
function Ne(e, n, ...t) {
  if (e in n) {
    let o = n[e];
    return typeof o == "function" ? o(...t) : o;
  }
  let r = new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(n).map((o) => `"${o}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(r, Ne), r;
}
var _t = ((e) => (e[e.None = 0] = "None", e[e.RenderStrategy = 1] = "RenderStrategy", e[e.Static = 2] = "Static", e))(_t || {}), Vt = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(Vt || {});
function G() {
  let e = Yt();
  return y((n) => qt({ mergeRefs: e, ...n }), [e]);
}
function qt({ ourProps: e, theirProps: n, slot: t, defaultTag: r, features: o, visible: i = !0, name: u, mergeRefs: a }) {
  a = a ?? zt;
  let l = Ie(n, e);
  if (i) return U(l, t, r, u, a);
  let s = o ?? 0;
  if (s & 2) {
    let { static: d = !1, ...c } = l;
    if (d) return U(c, t, r, u, a);
  }
  if (s & 1) {
    let { unmount: d = !0, ...c } = l;
    return Ne(d ? 0 : 1, { 0() {
      return null;
    }, 1() {
      return U({ ...c, hidden: !0, style: { display: "none" } }, t, r, u, a);
    } });
  }
  return U(l, t, r, u, a);
}
function U(e, n = {}, t, r, o) {
  let { as: i = t, children: u, refName: a = "ref", ...l } = Q(e, ["unmount", "static"]), s = e.ref !== void 0 ? { [a]: e.ref } : {}, d = typeof u == "function" ? u(n) : u;
  "className" in l && l.className && typeof l.className == "function" && (l.className = l.className(n)), l["aria-labelledby"] && l["aria-labelledby"] === l.id && (l["aria-labelledby"] = void 0);
  let c = {};
  if (n) {
    let p = !1, v = [];
    for (let [m, f] of Object.entries(n)) typeof f == "boolean" && (p = !0), f === !0 && v.push(m.replace(/([A-Z])/g, (b) => `-${b.toLowerCase()}`));
    if (p) {
      c["data-headlessui-state"] = v.join(" ");
      for (let m of v) c[`data-${m}`] = "";
    }
  }
  if (i === N && (Object.keys(x(l)).length > 0 || Object.keys(x(c)).length > 0)) if (!ct(d) || Array.isArray(d) && d.length > 1) {
    if (Object.keys(x(l)).length > 0) throw new Error(['Passing props on "Fragment"!', "", `The current component <${r} /> is rendering a "Fragment".`, "However we need to passthrough the following props:", Object.keys(x(l)).concat(Object.keys(x(c))).map((p) => `  - ${p}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".', "Render a single element as the child so that we can forward the props onto that element."].map((p) => `  - ${p}`).join(`
`)].join(`
`));
  } else {
    let p = d.props, v = p == null ? void 0 : p.className, m = typeof v == "function" ? (...$) => ye(v(...$), l.className) : ye(v, l.className), f = m ? { className: m } : {}, b = Ie(d.props, x(Q(l, ["ref"])));
    for (let $ in c) $ in b && delete c[$];
    return dt(d, Object.assign({}, b, c, s, { ref: o(Jt(d), s.ref) }, f));
  }
  return ft(i, Object.assign({}, Q(l, ["ref"]), i !== N && s, i !== N && c), d);
}
function Yt() {
  let e = E([]), n = y((t) => {
    for (let r of e.current) r != null && (typeof r == "function" ? r(t) : r.current = t);
  }, []);
  return (...t) => {
    if (!t.every((r) => r == null)) return e.current = t, n;
  };
}
function zt(...e) {
  return e.every((n) => n == null) ? void 0 : (n) => {
    for (let t of e) t != null && (typeof t == "function" ? t(n) : t.current = n);
  };
}
function Ie(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let n = {}, t = {};
  for (let r of e) for (let o in r) o.startsWith("on") && typeof r[o] == "function" ? (t[o] != null || (t[o] = []), t[o].push(r[o])) : n[o] = r[o];
  if (n.disabled || n["aria-disabled"]) for (let r in t) /^(on(?:Click|Pointer|Mouse|Key)(?:Down|Up|Press)?)$/.test(r) && (t[r] = [(o) => {
    var i;
    return (i = o == null ? void 0 : o.preventDefault) == null ? void 0 : i.call(o);
  }]);
  for (let r in t) Object.assign(n, { [r](o, ...i) {
    let u = t[r];
    for (let a of u) {
      if ((o instanceof Event || (o == null ? void 0 : o.nativeEvent) instanceof Event) && o.defaultPrevented) return;
      a(o, ...i);
    }
  } });
  return n;
}
function Xt(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let n = {}, t = {};
  for (let r of e) for (let o in r) o.startsWith("on") && typeof r[o] == "function" ? (t[o] != null || (t[o] = []), t[o].push(r[o])) : n[o] = r[o];
  for (let r in t) Object.assign(n, { [r](...o) {
    let i = t[r];
    for (let u of i) u == null || u(...o);
  } });
  return n;
}
function V(e) {
  var n;
  return Object.assign(st(e), { displayName: (n = e.displayName) != null ? n : e.name });
}
function x(e) {
  let n = Object.assign({}, e);
  for (let t in n) n[t] === void 0 && delete n[t];
  return n;
}
function Q(e, n = []) {
  let t = Object.assign({}, e);
  for (let r of n) r in t && delete t[r];
  return t;
}
function Jt(e) {
  return h.version.split(".")[0] >= "19" ? e.props.ref : e.ref;
}
function Qt(e, n, t) {
  let [r, o] = w(t), i = e !== void 0, u = E(i), a = E(!1), l = E(!1);
  return i && !u.current && !a.current ? (a.current = !0, u.current = i, console.error("A component is changing from uncontrolled to controlled. This may be caused by the value changing from undefined to a defined value, which should not happen.")) : !i && u.current && !l.current && (l.current = !0, u.current = i, console.error("A component is changing from controlled to uncontrolled. This may be caused by the value changing from a defined value to undefined, which should not happen.")), [i ? e : r, L((s) => (i || o(s), n == null ? void 0 : n(s)))];
}
function Zt(e) {
  let [n] = w(e);
  return n;
}
function Be(e = {}, n = null, t = []) {
  for (let [r, o] of Object.entries(e)) We(t, Ge(n, r), o);
  return t;
}
function Ge(e, n) {
  return e ? e + "[" + n + "]" : n;
}
function We(e, n, t) {
  if (Array.isArray(t)) for (let [r, o] of t.entries()) We(e, Ge(n, r.toString()), o);
  else t instanceof Date ? e.push([n, t.toISOString()]) : typeof t == "boolean" ? e.push([n, t ? "1" : "0"]) : typeof t == "string" ? e.push([n, t]) : typeof t == "number" ? e.push([n, `${t}`]) : t == null ? e.push([n, ""]) : Be(t, n, e);
}
function en(e) {
  var n, t;
  let r = (n = e == null ? void 0 : e.form) != null ? n : e.closest("form");
  if (r) {
    for (let o of r.elements) if (o !== e && (o.tagName === "INPUT" && o.type === "submit" || o.tagName === "BUTTON" && o.type === "submit" || o.nodeName === "INPUT" && o.type === "image")) {
      o.click();
      return;
    }
    (t = r.requestSubmit) == null || t.call(r);
  }
}
let tn = "span";
var de = ((e) => (e[e.None = 1] = "None", e[e.Focusable = 2] = "Focusable", e[e.Hidden = 4] = "Hidden", e))(de || {});
function nn(e, n) {
  var t;
  let { features: r = 1, ...o } = e, i = { ref: n, "aria-hidden": (r & 2) === 2 ? !0 : (t = o["aria-hidden"]) != null ? t : void 0, hidden: (r & 4) === 4 ? !0 : void 0, style: { position: "fixed", top: 1, left: 1, width: 1, height: 0, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: "0", ...(r & 4) === 4 && (r & 2) !== 2 && { display: "none" } } };
  return G()({ ourProps: i, theirProps: o, slot: {}, defaultTag: tn, name: "Hidden" });
}
let Re = V(nn), rn = M(null);
function on({ children: e }) {
  let n = k(rn);
  if (!n) return h.createElement(h.Fragment, null, e);
  let { target: t } = n;
  return t ? pt(h.createElement(h.Fragment, null, e), t) : null;
}
function an({ data: e, form: n, disabled: t, onReset: r, overrides: o }) {
  let [i, u] = w(null), a = ue();
  return S(() => {
    if (r && i) return a.addEventListener(i, "reset", r);
  }, [i, n, r]), h.createElement(on, null, h.createElement(ln, { setForm: u, formId: n }), Be(e).map(([l, s]) => h.createElement(Re, { features: de.Hidden, ...x({ key: l, as: "input", type: "hidden", hidden: !0, readOnly: !0, form: n, disabled: t, name: l, value: s, ...o }) })));
}
function ln({ setForm: e, formId: n }) {
  return S(() => {
    if (n) {
      let t = document.getElementById(n);
      t && e(t);
    }
  }, [e, n]), n ? null : h.createElement(Re, { features: de.Hidden, as: "input", type: "hidden", hidden: !0, readOnly: !0, ref: (t) => {
    if (!t) return;
    let r = t.closest("form");
    r && e(r);
  } });
}
let un = M(void 0);
function Ue() {
  return k(un);
}
function sn(e) {
  let n = e.parentElement, t = null;
  for (; n && !(n instanceof HTMLFieldSetElement); ) n instanceof HTMLLegendElement && (t = n), n = n.parentElement;
  let r = (n == null ? void 0 : n.getAttribute("disabled")) === "";
  return r && cn(t) ? !1 : r;
}
function cn(e) {
  if (!e) return !1;
  let n = e.previousElementSibling;
  for (; n !== null; ) {
    if (n instanceof HTMLLegendElement) return !1;
    n = n.previousElementSibling;
  }
  return !0;
}
let dn = Symbol();
function fe(...e) {
  let n = E(e);
  S(() => {
    n.current = e;
  }, [e]);
  let t = L((r) => {
    for (let o of n.current) o != null && (typeof o == "function" ? o(r) : o.current = r);
  });
  return e.every((r) => r == null || (r == null ? void 0 : r[dn])) ? void 0 : t;
}
let q = M(null);
q.displayName = "DescriptionContext";
function Ke() {
  let e = k(q);
  if (e === null) {
    let n = new Error("You used a <Description /> component, but it is not inside a relevant parent.");
    throw Error.captureStackTrace && Error.captureStackTrace(n, Ke), n;
  }
  return e;
}
function fn() {
  var e, n;
  return (n = (e = k(q)) == null ? void 0 : e.value) != null ? n : void 0;
}
function pn() {
  let [e, n] = w([]);
  return [e.length > 0 ? e.join(" ") : void 0, P(() => function(t) {
    let r = L((i) => (n((u) => [...u, i]), () => n((u) => {
      let a = u.slice(), l = a.indexOf(i);
      return l !== -1 && a.splice(l, 1), a;
    }))), o = P(() => ({ register: r, slot: t.slot, name: t.name, props: t.props, value: t.value }), [r, t.slot, t.name, t.props, t.value]);
    return h.createElement(q.Provider, { value: o }, t.children);
  }, [n])];
}
let vn = "p";
function mn(e, n) {
  let t = ie(), r = ce(), { id: o = `headlessui-description-${t}`, ...i } = e, u = Ke(), a = fe(n);
  se(() => u.register(o), [o, u.register]);
  let l = r || !1, s = P(() => ({ ...u.slot, disabled: l }), [u.slot, l]), d = { ref: a, ...u.props, id: o };
  return G()({ ourProps: d, theirProps: i, slot: s, defaultTag: vn, name: u.name || "Description" });
}
let bn = V(mn), hn = Object.assign(bn, {});
var oe = ((e) => (e.Space = " ", e.Enter = "Enter", e.Escape = "Escape", e.Backspace = "Backspace", e.Delete = "Delete", e.ArrowLeft = "ArrowLeft", e.ArrowUp = "ArrowUp", e.ArrowRight = "ArrowRight", e.ArrowDown = "ArrowDown", e.Home = "Home", e.End = "End", e.PageUp = "PageUp", e.PageDown = "PageDown", e.Tab = "Tab", e))(oe || {});
let Y = M(null);
Y.displayName = "LabelContext";
function _e() {
  let e = k(Y);
  if (e === null) {
    let n = new Error("You used a <Label /> component, but it is not inside a relevant parent.");
    throw Error.captureStackTrace && Error.captureStackTrace(n, _e), n;
  }
  return e;
}
function Ve(e) {
  var n, t, r;
  let o = (t = (n = k(Y)) == null ? void 0 : n.value) != null ? t : void 0;
  return ((r = void 0) != null ? r : 0) > 0 ? [o, ...e].filter(Boolean).join(" ") : o;
}
function gn({ inherit: e = !1 } = {}) {
  let n = Ve(), [t, r] = w([]), o = e ? [n, ...t].filter(Boolean) : t;
  return [o.length > 0 ? o.join(" ") : void 0, P(() => function(i) {
    let u = L((l) => (r((s) => [...s, l]), () => r((s) => {
      let d = s.slice(), c = d.indexOf(l);
      return c !== -1 && d.splice(c, 1), d;
    }))), a = P(() => ({ register: u, slot: i.slot, name: i.name, props: i.props, value: i.value }), [u, i.slot, i.name, i.props, i.value]);
    return h.createElement(Y.Provider, { value: a }, i.children);
  }, [r])];
}
let $n = "label";
function En(e, n) {
  var t;
  let r = ie(), o = _e(), i = Ue(), u = ce(), { id: a = `headlessui-label-${r}`, htmlFor: l = i ?? ((t = o.props) == null ? void 0 : t.htmlFor), passive: s = !1, ...d } = e, c = fe(n);
  se(() => o.register(a), [a, o.register]);
  let p = L((b) => {
    let $ = b.currentTarget;
    if ($ instanceof HTMLLabelElement && b.preventDefault(), o.props && "onClick" in o.props && typeof o.props.onClick == "function" && o.props.onClick(b), $ instanceof HTMLLabelElement) {
      let g = document.getElementById($.htmlFor);
      if (g) {
        let W = g.getAttribute("disabled");
        if (W === "true" || W === "") return;
        let R = g.getAttribute("aria-disabled");
        if (R === "true" || R === "") return;
        (g instanceof HTMLInputElement && (g.type === "radio" || g.type === "checkbox") || g.role === "radio" || g.role === "checkbox" || g.role === "switch") && g.click(), g.focus({ preventScroll: !0 });
      }
    }
  }), v = u || !1, m = P(() => ({ ...o.slot, disabled: v }), [o.slot, v]), f = { ref: c, ...o.props, id: a, htmlFor: l, onClick: p };
  return s && ("onClick" in f && (delete f.htmlFor, delete f.onClick), "onClick" in d && delete d.onClick), G()({ ourProps: f, theirProps: d, slot: m, defaultTag: l ? $n : "div", name: o.name || "Label" });
}
let yn = V(En), wn = Object.assign(yn, {});
function Tn(e, n) {
  return P(() => {
    var t;
    if (e.type) return e.type;
    let r = (t = e.as) != null ? t : "button";
    if (typeof r == "string" && r.toLowerCase() === "button" || (n == null ? void 0 : n.tagName) === "BUTTON" && !n.hasAttribute("type")) return "button";
  }, [e.type, e.as, n]);
}
let pe = M(null);
pe.displayName = "GroupContext";
let Ln = N;
function Fn(e) {
  var n;
  let [t, r] = w(null), [o, i] = gn(), [u, a] = pn(), l = P(() => ({ switch: t, setSwitch: r }), [t, r]), s = {}, d = e, c = G();
  return h.createElement(a, { name: "Switch.Description", value: u }, h.createElement(i, { name: "Switch.Label", value: o, props: { htmlFor: (n = l.switch) == null ? void 0 : n.id, onClick(p) {
    t && (p.currentTarget instanceof HTMLLabelElement && p.preventDefault(), t.click(), t.focus({ preventScroll: !0 }));
  } } }, h.createElement(pe.Provider, { value: l }, c({ ourProps: s, theirProps: d, slot: {}, defaultTag: Ln, name: "Switch.Group" }))));
}
let Pn = "button";
function Sn(e, n) {
  var t;
  let r = ie(), o = Ue(), i = ce(), { id: u = o || `headlessui-switch-${r}`, disabled: a = i || !1, checked: l, defaultChecked: s, onChange: d, name: c, value: p, form: v, autoFocus: m = !1, ...f } = e, b = k(pe), [$, g] = w(null), W = E(null), R = fe(W, n, b === null ? null : b.setSwitch, g), A = Zt(s), [O, j] = Qt(l, d, A ?? !1), Ye = ue(), [ve, me] = w(!1), be = L(() => {
    me(!0), j == null || j(!O), Ye.nextFrame(() => {
      me(!1);
    });
  }), ze = L((F) => {
    if (sn(F.currentTarget)) return F.preventDefault();
    F.preventDefault(), be();
  }), Xe = L((F) => {
    F.key === oe.Space ? (F.preventDefault(), be()) : F.key === oe.Enter && en(F.currentTarget);
  }), Je = L((F) => F.preventDefault()), Qe = Ve(), Ze = fn(), { isFocusVisible: he, focusProps: et } = At({ autoFocus: m }), { isHovered: ge, hoverProps: tt } = Mt({ isDisabled: a }), { pressed: $e, pressProps: nt } = Ut({ disabled: a }), rt = P(() => ({ checked: O, disabled: a, hover: ge, focus: he, active: $e, autofocus: m, changing: ve }), [O, ge, he, $e, a, ve, m]), ot = Xt({ id: u, ref: R, role: "switch", type: Tn(e, $), tabIndex: e.tabIndex === -1 ? 0 : (t = e.tabIndex) != null ? t : 0, "aria-checked": O, "aria-labelledby": Qe, "aria-describedby": Ze, disabled: a || void 0, autoFocus: m, onClick: ze, onKeyUp: Xe, onKeyPress: Je }, et, tt, nt), it = y(() => {
    if (A !== void 0) return j == null ? void 0 : j(A);
  }, [j, A]), at = G();
  return h.createElement(h.Fragment, null, c != null && h.createElement(an, { disabled: a, data: { [c]: p || "on" }, overrides: { type: "checkbox", checked: O }, form: v, onReset: it }), at({ ourProps: ot, theirProps: f, slot: rt, defaultTag: Pn, name: "Switch" }));
}
let kn = V(Sn), Hn = Fn, xn = wn, Dn = hn, Cn = Object.assign(kn, { Group: Hn, Label: xn, Description: Dn });
function qe(e) {
  var n, t, r = "";
  if (typeof e == "string" || typeof e == "number") r += e;
  else if (typeof e == "object") if (Array.isArray(e)) for (n = 0; n < e.length; n++) e[n] && (t = qe(e[n])) && (r && (r += " "), r += t);
  else for (n in e) e[n] && (r && (r += " "), r += n);
  return r;
}
function we() {
  for (var e, n, t = 0, r = ""; t < arguments.length; ) (e = arguments[t++]) && (n = qe(e)) && (r && (r += " "), r += n);
  return r;
}
function Nn({ enabled: e, setEnabled: n, className: t }) {
  return /* @__PURE__ */ z(Cn, { checked: e, onChange: n, as: N, children: ({ checked: r, disabled: o }) => /* @__PURE__ */ lt(
    "button",
    {
      className: we(
        "group inline-flex h-6 w-11 items-center rounded-full",
        r ? "bg-primary" : "bg-action",
        o && "cursor-not-allowed opacity-50",
        t
      ),
      children: [
        /* @__PURE__ */ z("span", { className: "sr-only", children: "Enable notifications" }),
        /* @__PURE__ */ z(
          "span",
          {
            className: we(
              "size-4 rounded-full bg-white transition",
              r ? "translate-x-6" : "translate-x-1"
            )
          }
        )
      ]
    }
  ) });
}
export {
  Nn as Switch
};
