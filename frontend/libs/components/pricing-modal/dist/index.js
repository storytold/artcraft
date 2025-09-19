import { jsx as L, jsxs as Ee, Fragment as vt } from "react/jsx-runtime";
import * as T from "react";
import Oe, { createContext as Zn, useState as Me, useRef as le, useEffect as Ne, isValidElement as di, cloneElement as pi, useContext as Vr, useMemo as ht, useLayoutEffect as $u, forwardRef as Nu, useCallback as Be, Fragment as Lt, useId as dh, useReducer as Y1, createElement as ph } from "react";
import * as V1 from "react-dom";
import G1, { unstable_batchedUpdates as q1 } from "react-dom";
function $r(e, t, { checkForDefaultPrevented: r = !0 } = {}) {
  return function(n) {
    if (e == null || e(n), r === !1 || !n.defaultPrevented)
      return t == null ? void 0 : t(n);
  };
}
function id(e, t) {
  if (typeof e == "function")
    return e(t);
  e != null && (e.current = t);
}
function mh(...e) {
  return (t) => {
    let r = !1;
    const n = e.map((o) => {
      const a = id(o, t);
      return !r && typeof a == "function" && (r = !0), a;
    });
    if (r)
      return () => {
        for (let o = 0; o < n.length; o++) {
          const a = n[o];
          typeof a == "function" ? a() : id(e[o], null);
        }
      };
  };
}
function pn(...e) {
  return T.useCallback(mh(...e), e);
}
function H1(e, t) {
  const r = T.createContext(t), n = (a) => {
    const { children: i, ...s } = a, c = T.useMemo(() => s, Object.values(s));
    return /* @__PURE__ */ L(r.Provider, { value: c, children: i });
  };
  n.displayName = e + "Provider";
  function o(a) {
    const i = T.useContext(r);
    if (i) return i;
    if (t !== void 0) return t;
    throw new Error(`\`${a}\` must be used within \`${e}\``);
  }
  return [n, o];
}
function B1(e, t = []) {
  let r = [];
  function n(a, i) {
    const s = T.createContext(i), c = r.length;
    r = [...r, i];
    const l = (f) => {
      var d;
      const { scope: b, children: y, ...p } = f, m = ((d = b == null ? void 0 : b[e]) == null ? void 0 : d[c]) || s, x = T.useMemo(() => p, Object.values(p));
      return /* @__PURE__ */ L(m.Provider, { value: x, children: y });
    };
    l.displayName = a + "Provider";
    function u(f, d) {
      var b;
      const y = ((b = d == null ? void 0 : d[e]) == null ? void 0 : b[c]) || s, p = T.useContext(y);
      if (p) return p;
      if (i !== void 0) return i;
      throw new Error(`\`${f}\` must be used within \`${a}\``);
    }
    return [l, u];
  }
  const o = () => {
    const a = r.map((i) => T.createContext(i));
    return function(i) {
      const s = (i == null ? void 0 : i[e]) || a;
      return T.useMemo(
        () => ({ [`__scope${e}`]: { ...i, [e]: s } }),
        [i, s]
      );
    };
  };
  return o.scopeName = e, [n, X1(o, ...t)];
}
function X1(...e) {
  const t = e[0];
  if (e.length === 1) return t;
  const r = () => {
    const n = e.map((o) => ({
      useScope: o(),
      scopeName: o.scopeName
    }));
    return function(o) {
      const a = n.reduce((i, { useScope: s, scopeName: c }) => {
        const l = s(o)[`__scope${c}`];
        return { ...i, ...l };
      }, {});
      return T.useMemo(() => ({ [`__scope${t.scopeName}`]: a }), [a]);
    };
  };
  return r.scopeName = t.scopeName, r;
}
var Qo = globalThis != null && globalThis.document ? T.useLayoutEffect : () => {
}, K1 = T[" useId ".trim().toString()] || (() => {
}), J1 = 0;
function ys(e) {
  const [t, r] = T.useState(K1());
  return Qo(() => {
    r((n) => n ?? String(J1++));
  }, [e]), e || (t ? `radix-${t}` : "");
}
var Q1 = T[" useInsertionEffect ".trim().toString()] || Qo;
function Z1({
  prop: e,
  defaultProp: t,
  onChange: r = () => {
  },
  caller: n
}) {
  const [o, a, i] = ex({
    defaultProp: t,
    onChange: r
  }), s = e !== void 0, c = s ? e : o;
  {
    const u = T.useRef(e !== void 0);
    T.useEffect(() => {
      const f = u.current;
      f !== s && console.warn(
        `${n} is changing from ${f ? "controlled" : "uncontrolled"} to ${s ? "controlled" : "uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
      ), u.current = s;
    }, [s, n]);
  }
  const l = T.useCallback(
    (u) => {
      var f;
      if (s) {
        const d = tx(u) ? u(e) : u;
        d !== e && ((f = i.current) == null || f.call(i, d));
      } else
        a(u);
    },
    [s, e, a, i]
  );
  return [c, l];
}
function ex({
  defaultProp: e,
  onChange: t
}) {
  const [r, n] = T.useState(e), o = T.useRef(r), a = T.useRef(t);
  return Q1(() => {
    a.current = t;
  }, [t]), T.useEffect(() => {
    var i;
    o.current !== r && ((i = a.current) == null || i.call(a, r), o.current = r);
  }, [r, o]), [r, n, a];
}
function tx(e) {
  return typeof e == "function";
}
// @__NO_SIDE_EFFECTS__
function gh(e) {
  const t = /* @__PURE__ */ rx(e), r = T.forwardRef((n, o) => {
    const { children: a, ...i } = n, s = T.Children.toArray(a), c = s.find(ox);
    if (c) {
      const l = c.props.children, u = s.map((f) => f === c ? T.Children.count(l) > 1 ? T.Children.only(null) : T.isValidElement(l) ? l.props.children : null : f);
      return /* @__PURE__ */ L(t, { ...i, ref: o, children: T.isValidElement(l) ? T.cloneElement(l, void 0, u) : null });
    }
    return /* @__PURE__ */ L(t, { ...i, ref: o, children: a });
  });
  return r.displayName = `${e}.Slot`, r;
}
// @__NO_SIDE_EFFECTS__
function rx(e) {
  const t = T.forwardRef((r, n) => {
    const { children: o, ...a } = r;
    if (T.isValidElement(o)) {
      const i = ix(o), s = ax(a, o.props);
      return o.type !== T.Fragment && (s.ref = n ? mh(n, i) : i), T.cloneElement(o, s);
    }
    return T.Children.count(o) > 1 ? T.Children.only(null) : null;
  });
  return t.displayName = `${e}.SlotClone`, t;
}
var nx = Symbol("radix.slottable");
function ox(e) {
  return T.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === nx;
}
function ax(e, t) {
  const r = { ...t };
  for (const n in t) {
    const o = e[n], a = t[n];
    /^on[A-Z]/.test(n) ? o && a ? r[n] = (...i) => {
      const s = a(...i);
      return o(...i), s;
    } : o && (r[n] = o) : n === "style" ? r[n] = { ...o, ...a } : n === "className" && (r[n] = [o, a].filter(Boolean).join(" "));
  }
  return { ...e, ...r };
}
function ix(e) {
  var t, r;
  let n = (t = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : t.get, o = n && "isReactWarning" in n && n.isReactWarning;
  return o ? e.ref : (n = (r = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : r.get, o = n && "isReactWarning" in n && n.isReactWarning, o ? e.props.ref : e.props.ref || e.ref);
}
var sx = [
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
], Wt = sx.reduce((e, t) => {
  const r = /* @__PURE__ */ gh(`Primitive.${t}`), n = T.forwardRef((o, a) => {
    const { asChild: i, ...s } = o, c = i ? r : t;
    return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ L(c, { ...s, ref: a });
  });
  return n.displayName = `Primitive.${t}`, { ...e, [t]: n };
}, {});
function lx(e, t) {
  e && V1.flushSync(() => e.dispatchEvent(t));
}
function Zo(e) {
  const t = T.useRef(e);
  return T.useEffect(() => {
    t.current = e;
  }), T.useMemo(() => (...r) => {
    var n;
    return (n = t.current) == null ? void 0 : n.call(t, ...r);
  }, []);
}
function cx(e, t = globalThis == null ? void 0 : globalThis.document) {
  const r = Zo(e);
  T.useEffect(() => {
    const n = (o) => {
      o.key === "Escape" && r(o);
    };
    return t.addEventListener("keydown", n, { capture: !0 }), () => t.removeEventListener("keydown", n, { capture: !0 });
  }, [r, t]);
}
var ux = "DismissableLayer", Fl = "dismissableLayer.update", fx = "dismissableLayer.pointerDownOutside", dx = "dismissableLayer.focusOutside", sd, hh = T.createContext({
  layers: /* @__PURE__ */ new Set(),
  layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
  branches: /* @__PURE__ */ new Set()
}), bh = T.forwardRef(
  (e, t) => {
    const {
      disableOutsidePointerEvents: r = !1,
      onEscapeKeyDown: n,
      onPointerDownOutside: o,
      onFocusOutside: a,
      onInteractOutside: i,
      onDismiss: s,
      ...c
    } = e, l = T.useContext(hh), [u, f] = T.useState(null), d = (u == null ? void 0 : u.ownerDocument) ?? (globalThis == null ? void 0 : globalThis.document), [, b] = T.useState({}), y = pn(t, (F) => f(F)), p = Array.from(l.layers), [m] = [...l.layersWithOutsidePointerEventsDisabled].slice(-1), x = p.indexOf(m), w = u ? p.indexOf(u) : -1, O = l.layersWithOutsidePointerEventsDisabled.size > 0, E = w >= x, h = gx((F) => {
      const Z = F.target, K = [...l.branches].some((H) => H.contains(Z));
      !E || K || (o == null || o(F), i == null || i(F), F.defaultPrevented || s == null || s());
    }, d), W = hx((F) => {
      const Z = F.target;
      [...l.branches].some((K) => K.contains(Z)) || (a == null || a(F), i == null || i(F), F.defaultPrevented || s == null || s());
    }, d);
    return cx((F) => {
      w === l.layers.size - 1 && (n == null || n(F), !F.defaultPrevented && s && (F.preventDefault(), s()));
    }, d), T.useEffect(() => {
      if (u)
        return r && (l.layersWithOutsidePointerEventsDisabled.size === 0 && (sd = d.body.style.pointerEvents, d.body.style.pointerEvents = "none"), l.layersWithOutsidePointerEventsDisabled.add(u)), l.layers.add(u), ld(), () => {
          r && l.layersWithOutsidePointerEventsDisabled.size === 1 && (d.body.style.pointerEvents = sd);
        };
    }, [u, d, r, l]), T.useEffect(() => () => {
      u && (l.layers.delete(u), l.layersWithOutsidePointerEventsDisabled.delete(u), ld());
    }, [u, l]), T.useEffect(() => {
      const F = () => b({});
      return document.addEventListener(Fl, F), () => document.removeEventListener(Fl, F);
    }, []), /* @__PURE__ */ L(
      Wt.div,
      {
        ...c,
        ref: y,
        style: {
          pointerEvents: O ? E ? "auto" : "none" : void 0,
          ...e.style
        },
        onFocusCapture: $r(e.onFocusCapture, W.onFocusCapture),
        onBlurCapture: $r(e.onBlurCapture, W.onBlurCapture),
        onPointerDownCapture: $r(
          e.onPointerDownCapture,
          h.onPointerDownCapture
        )
      }
    );
  }
);
bh.displayName = ux;
var px = "DismissableLayerBranch", mx = T.forwardRef((e, t) => {
  const r = T.useContext(hh), n = T.useRef(null), o = pn(t, n);
  return T.useEffect(() => {
    const a = n.current;
    if (a)
      return r.branches.add(a), () => {
        r.branches.delete(a);
      };
  }, [r.branches]), /* @__PURE__ */ L(Wt.div, { ...e, ref: o });
});
mx.displayName = px;
function gx(e, t = globalThis == null ? void 0 : globalThis.document) {
  const r = Zo(e), n = T.useRef(!1), o = T.useRef(() => {
  });
  return T.useEffect(() => {
    const a = (s) => {
      if (s.target && !n.current) {
        let c = function() {
          yh(
            fx,
            r,
            l,
            { discrete: !0 }
          );
        };
        const l = { originalEvent: s };
        s.pointerType === "touch" ? (t.removeEventListener("click", o.current), o.current = c, t.addEventListener("click", o.current, { once: !0 })) : c();
      } else
        t.removeEventListener("click", o.current);
      n.current = !1;
    }, i = window.setTimeout(() => {
      t.addEventListener("pointerdown", a);
    }, 0);
    return () => {
      window.clearTimeout(i), t.removeEventListener("pointerdown", a), t.removeEventListener("click", o.current);
    };
  }, [t, r]), {
    // ensures we check React component tree (not just DOM tree)
    onPointerDownCapture: () => n.current = !0
  };
}
function hx(e, t = globalThis == null ? void 0 : globalThis.document) {
  const r = Zo(e), n = T.useRef(!1);
  return T.useEffect(() => {
    const o = (a) => {
      a.target && !n.current && yh(dx, r, { originalEvent: a }, {
        discrete: !1
      });
    };
    return t.addEventListener("focusin", o), () => t.removeEventListener("focusin", o);
  }, [t, r]), {
    onFocusCapture: () => n.current = !0,
    onBlurCapture: () => n.current = !1
  };
}
function ld() {
  const e = new CustomEvent(Fl);
  document.dispatchEvent(e);
}
function yh(e, t, r, { discrete: n }) {
  const o = r.originalEvent.target, a = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: r });
  t && o.addEventListener(e, t, { once: !0 }), n ? lx(o, a) : o.dispatchEvent(a);
}
var vs = "focusScope.autoFocusOnMount", xs = "focusScope.autoFocusOnUnmount", cd = { bubbles: !1, cancelable: !0 }, bx = "FocusScope", vh = T.forwardRef((e, t) => {
  const {
    loop: r = !1,
    trapped: n = !1,
    onMountAutoFocus: o,
    onUnmountAutoFocus: a,
    ...i
  } = e, [s, c] = T.useState(null), l = Zo(o), u = Zo(a), f = T.useRef(null), d = pn(t, (p) => c(p)), b = T.useRef({
    paused: !1,
    pause() {
      this.paused = !0;
    },
    resume() {
      this.paused = !1;
    }
  }).current;
  T.useEffect(() => {
    if (n) {
      let p = function(O) {
        if (b.paused || !s) return;
        const E = O.target;
        s.contains(E) ? f.current = E : Pr(f.current, { select: !0 });
      }, m = function(O) {
        if (b.paused || !s) return;
        const E = O.relatedTarget;
        E !== null && (s.contains(E) || Pr(f.current, { select: !0 }));
      }, x = function(O) {
        if (document.activeElement === document.body)
          for (const E of O)
            E.removedNodes.length > 0 && Pr(s);
      };
      document.addEventListener("focusin", p), document.addEventListener("focusout", m);
      const w = new MutationObserver(x);
      return s && w.observe(s, { childList: !0, subtree: !0 }), () => {
        document.removeEventListener("focusin", p), document.removeEventListener("focusout", m), w.disconnect();
      };
    }
  }, [n, s, b.paused]), T.useEffect(() => {
    if (s) {
      fd.add(b);
      const p = document.activeElement;
      if (!s.contains(p)) {
        const m = new CustomEvent(vs, cd);
        s.addEventListener(vs, l), s.dispatchEvent(m), m.defaultPrevented || (yx(Ox(xh(s)), { select: !0 }), document.activeElement === p && Pr(s));
      }
      return () => {
        s.removeEventListener(vs, l), setTimeout(() => {
          const m = new CustomEvent(xs, cd);
          s.addEventListener(xs, u), s.dispatchEvent(m), m.defaultPrevented || Pr(p ?? document.body, { select: !0 }), s.removeEventListener(xs, u), fd.remove(b);
        }, 0);
      };
    }
  }, [s, l, u, b]);
  const y = T.useCallback(
    (p) => {
      if (!r && !n || b.paused) return;
      const m = p.key === "Tab" && !p.altKey && !p.ctrlKey && !p.metaKey, x = document.activeElement;
      if (m && x) {
        const w = p.currentTarget, [O, E] = vx(w);
        O && E ? !p.shiftKey && x === E ? (p.preventDefault(), r && Pr(O, { select: !0 })) : p.shiftKey && x === O && (p.preventDefault(), r && Pr(E, { select: !0 })) : x === w && p.preventDefault();
      }
    },
    [r, n, b.paused]
  );
  return /* @__PURE__ */ L(Wt.div, { tabIndex: -1, ...i, ref: d, onKeyDown: y });
});
vh.displayName = bx;
function yx(e, { select: t = !1 } = {}) {
  const r = document.activeElement;
  for (const n of e)
    if (Pr(n, { select: t }), document.activeElement !== r) return;
}
function vx(e) {
  const t = xh(e), r = ud(t, e), n = ud(t.reverse(), e);
  return [r, n];
}
function xh(e) {
  const t = [], r = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (n) => {
      const o = n.tagName === "INPUT" && n.type === "hidden";
      return n.disabled || n.hidden || o ? NodeFilter.FILTER_SKIP : n.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  for (; r.nextNode(); ) t.push(r.currentNode);
  return t;
}
function ud(e, t) {
  for (const r of e)
    if (!xx(r, { upTo: t })) return r;
}
function xx(e, { upTo: t }) {
  if (getComputedStyle(e).visibility === "hidden") return !0;
  for (; e; ) {
    if (t !== void 0 && e === t) return !1;
    if (getComputedStyle(e).display === "none") return !0;
    e = e.parentElement;
  }
  return !1;
}
function wx(e) {
  return e instanceof HTMLInputElement && "select" in e;
}
function Pr(e, { select: t = !1 } = {}) {
  if (e && e.focus) {
    const r = document.activeElement;
    e.focus({ preventScroll: !0 }), e !== r && wx(e) && t && e.select();
  }
}
var fd = kx();
function kx() {
  let e = [];
  return {
    add(t) {
      const r = e[0];
      t !== r && (r == null || r.pause()), e = dd(e, t), e.unshift(t);
    },
    remove(t) {
      var r;
      e = dd(e, t), (r = e[0]) == null || r.resume();
    }
  };
}
function dd(e, t) {
  const r = [...e], n = r.indexOf(t);
  return n !== -1 && r.splice(n, 1), r;
}
function Ox(e) {
  return e.filter((t) => t.tagName !== "A");
}
var Ex = "Portal", wh = T.forwardRef((e, t) => {
  var r;
  const { container: n, ...o } = e, [a, i] = T.useState(!1);
  Qo(() => i(!0), []);
  const s = n || a && ((r = globalThis == null ? void 0 : globalThis.document) == null ? void 0 : r.body);
  return s ? G1.createPortal(/* @__PURE__ */ L(Wt.div, { ...o, ref: t }), s) : null;
});
wh.displayName = Ex;
function Px(e, t) {
  return T.useReducer((r, n) => t[r][n] ?? r, e);
}
var _i = (e) => {
  const { present: t, children: r } = e, n = Sx(t), o = typeof r == "function" ? r({ present: n.isPresent }) : T.Children.only(r), a = pn(n.ref, Ax(o));
  return typeof r == "function" || n.isPresent ? T.cloneElement(o, { ref: a }) : null;
};
_i.displayName = "Presence";
function Sx(e) {
  const [t, r] = T.useState(), n = T.useRef(null), o = T.useRef(e), a = T.useRef("none"), i = e ? "mounted" : "unmounted", [s, c] = Px(i, {
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
  return T.useEffect(() => {
    const l = $a(n.current);
    a.current = s === "mounted" ? l : "none";
  }, [s]), Qo(() => {
    const l = n.current, u = o.current;
    if (u !== e) {
      const f = a.current, d = $a(l);
      e ? c("MOUNT") : d === "none" || (l == null ? void 0 : l.display) === "none" ? c("UNMOUNT") : c(u && f !== d ? "ANIMATION_OUT" : "UNMOUNT"), o.current = e;
    }
  }, [e, c]), Qo(() => {
    if (t) {
      let l;
      const u = t.ownerDocument.defaultView ?? window, f = (b) => {
        const y = $a(n.current).includes(b.animationName);
        if (b.target === t && y && (c("ANIMATION_END"), !o.current)) {
          const p = t.style.animationFillMode;
          t.style.animationFillMode = "forwards", l = u.setTimeout(() => {
            t.style.animationFillMode === "forwards" && (t.style.animationFillMode = p);
          });
        }
      }, d = (b) => {
        b.target === t && (a.current = $a(n.current));
      };
      return t.addEventListener("animationstart", d), t.addEventListener("animationcancel", f), t.addEventListener("animationend", f), () => {
        u.clearTimeout(l), t.removeEventListener("animationstart", d), t.removeEventListener("animationcancel", f), t.removeEventListener("animationend", f);
      };
    } else
      c("ANIMATION_END");
  }, [t, c]), {
    isPresent: ["mounted", "unmountSuspended"].includes(s),
    ref: T.useCallback((l) => {
      n.current = l ? getComputedStyle(l) : null, r(l);
    }, [])
  };
}
function $a(e) {
  return (e == null ? void 0 : e.animationName) || "none";
}
function Ax(e) {
  var t, r;
  let n = (t = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : t.get, o = n && "isReactWarning" in n && n.isReactWarning;
  return o ? e.ref : (n = (r = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : r.get, o = n && "isReactWarning" in n && n.isReactWarning, o ? e.props.ref : e.props.ref || e.ref);
}
var ws = 0;
function Cx() {
  T.useEffect(() => {
    const e = document.querySelectorAll("[data-radix-focus-guard]");
    return document.body.insertAdjacentElement("afterbegin", e[0] ?? pd()), document.body.insertAdjacentElement("beforeend", e[1] ?? pd()), ws++, () => {
      ws === 1 && document.querySelectorAll("[data-radix-focus-guard]").forEach((t) => t.remove()), ws--;
    };
  }, []);
}
function pd() {
  const e = document.createElement("span");
  return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
var $t = function() {
  return $t = Object.assign || function(e) {
    for (var t, r = 1, n = arguments.length; r < n; r++) {
      t = arguments[r];
      for (var o in t) Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o]);
    }
    return e;
  }, $t.apply(this, arguments);
};
function kh(e, t) {
  var r = {};
  for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && t.indexOf(n) < 0 && (r[n] = e[n]);
  if (e != null && typeof Object.getOwnPropertySymbols == "function")
    for (var o = 0, n = Object.getOwnPropertySymbols(e); o < n.length; o++)
      t.indexOf(n[o]) < 0 && Object.prototype.propertyIsEnumerable.call(e, n[o]) && (r[n[o]] = e[n[o]]);
  return r;
}
function $x(e, t, r) {
  for (var n = 0, o = t.length, a; n < o; n++)
    (a || !(n in t)) && (a || (a = Array.prototype.slice.call(t, 0, n)), a[n] = t[n]);
  return e.concat(a || Array.prototype.slice.call(t));
}
var Ja = "right-scroll-bar-position", Qa = "width-before-scroll-bar", Nx = "with-scroll-bars-hidden", Ix = "--removed-body-scroll-bar-size";
function ks(e, t) {
  return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
function Tx(e, t) {
  var r = Me(function() {
    return {
      // value
      value: e,
      // last callback
      callback: t,
      // "memoized" public interface
      facade: {
        get current() {
          return r.value;
        },
        set current(n) {
          var o = r.value;
          o !== n && (r.value = n, r.callback(n, o));
        }
      }
    };
  })[0];
  return r.callback = t, r.facade;
}
var jx = typeof window < "u" ? T.useLayoutEffect : T.useEffect, md = /* @__PURE__ */ new WeakMap();
function _x(e, t) {
  var r = Tx(null, function(n) {
    return e.forEach(function(o) {
      return ks(o, n);
    });
  });
  return jx(function() {
    var n = md.get(r);
    if (n) {
      var o = new Set(n), a = new Set(e), i = r.current;
      o.forEach(function(s) {
        a.has(s) || ks(s, null);
      }), a.forEach(function(s) {
        o.has(s) || ks(s, i);
      });
    }
    md.set(r, e);
  }, [e]), r;
}
function Mx(e) {
  return e;
}
function zx(e, t) {
  t === void 0 && (t = Mx);
  var r = [], n = !1, o = {
    read: function() {
      if (n)
        throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
      return r.length ? r[r.length - 1] : e;
    },
    useMedium: function(a) {
      var i = t(a, n);
      return r.push(i), function() {
        r = r.filter(function(s) {
          return s !== i;
        });
      };
    },
    assignSyncMedium: function(a) {
      for (n = !0; r.length; ) {
        var i = r;
        r = [], i.forEach(a);
      }
      r = {
        push: function(s) {
          return a(s);
        },
        filter: function() {
          return r;
        }
      };
    },
    assignMedium: function(a) {
      n = !0;
      var i = [];
      if (r.length) {
        var s = r;
        r = [], s.forEach(a), i = r;
      }
      var c = function() {
        var u = i;
        i = [], u.forEach(a);
      }, l = function() {
        return Promise.resolve().then(c);
      };
      l(), r = {
        push: function(u) {
          i.push(u), l();
        },
        filter: function(u) {
          return i = i.filter(u), r;
        }
      };
    }
  };
  return o;
}
function Rx(e) {
  e === void 0 && (e = {});
  var t = zx(null);
  return t.options = $t({ async: !0, ssr: !1 }, e), t;
}
var Oh = function(e) {
  var t = e.sideCar, r = kh(e, ["sideCar"]);
  if (!t)
    throw new Error("Sidecar: please provide `sideCar` property to import the right car");
  var n = t.read();
  if (!n)
    throw new Error("Sidecar medium not found");
  return T.createElement(n, $t({}, r));
};
Oh.isSideCarExport = !0;
function Fx(e, t) {
  return e.useMedium(t), Oh;
}
var Eh = Rx(), Os = function() {
}, Mi = T.forwardRef(function(e, t) {
  var r = T.useRef(null), n = T.useState({
    onScrollCapture: Os,
    onWheelCapture: Os,
    onTouchMoveCapture: Os
  }), o = n[0], a = n[1], i = e.forwardProps, s = e.children, c = e.className, l = e.removeScrollBar, u = e.enabled, f = e.shards, d = e.sideCar, b = e.noRelative, y = e.noIsolation, p = e.inert, m = e.allowPinchZoom, x = e.as, w = x === void 0 ? "div" : x, O = e.gapMode, E = kh(e, ["forwardProps", "children", "className", "removeScrollBar", "enabled", "shards", "sideCar", "noRelative", "noIsolation", "inert", "allowPinchZoom", "as", "gapMode"]), h = d, W = _x([r, t]), F = $t($t({}, E), o);
  return T.createElement(
    T.Fragment,
    null,
    u && T.createElement(h, { sideCar: Eh, removeScrollBar: l, shards: f, noRelative: b, noIsolation: y, inert: p, setCallbacks: a, allowPinchZoom: !!m, lockRef: r, gapMode: O }),
    i ? T.cloneElement(T.Children.only(s), $t($t({}, F), { ref: W })) : T.createElement(w, $t({}, F, { className: c, ref: W }), s)
  );
});
Mi.defaultProps = {
  enabled: !0,
  removeScrollBar: !0,
  inert: !1
};
Mi.classNames = {
  fullWidth: Qa,
  zeroRight: Ja
};
var Lx = function() {
  if (typeof __webpack_nonce__ < "u")
    return __webpack_nonce__;
};
function Dx() {
  if (!document)
    return null;
  var e = document.createElement("style");
  e.type = "text/css";
  var t = Lx();
  return t && e.setAttribute("nonce", t), e;
}
function Wx(e, t) {
  e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function Ux(e) {
  var t = document.head || document.getElementsByTagName("head")[0];
  t.appendChild(e);
}
var Yx = function() {
  var e = 0, t = null;
  return {
    add: function(r) {
      e == 0 && (t = Dx()) && (Wx(t, r), Ux(t)), e++;
    },
    remove: function() {
      e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
    }
  };
}, Vx = function() {
  var e = Yx();
  return function(t, r) {
    T.useEffect(function() {
      return e.add(t), function() {
        e.remove();
      };
    }, [t && r]);
  };
}, Ph = function() {
  var e = Vx(), t = function(r) {
    var n = r.styles, o = r.dynamic;
    return e(n, o), null;
  };
  return t;
}, Gx = {
  left: 0,
  top: 0,
  right: 0,
  gap: 0
}, Es = function(e) {
  return parseInt(e || "", 10) || 0;
}, qx = function(e) {
  var t = window.getComputedStyle(document.body), r = t[e === "padding" ? "paddingLeft" : "marginLeft"], n = t[e === "padding" ? "paddingTop" : "marginTop"], o = t[e === "padding" ? "paddingRight" : "marginRight"];
  return [Es(r), Es(n), Es(o)];
}, Hx = function(e) {
  if (e === void 0 && (e = "margin"), typeof window > "u")
    return Gx;
  var t = qx(e), r = document.documentElement.clientWidth, n = window.innerWidth;
  return {
    left: t[0],
    top: t[1],
    right: t[2],
    gap: Math.max(0, n - r + t[2] - t[0])
  };
}, Bx = Ph(), jn = "data-scroll-locked", Xx = function(e, t, r, n) {
  var o = e.left, a = e.top, i = e.right, s = e.gap;
  return r === void 0 && (r = "margin"), `
  .`.concat(Nx, ` {
   overflow: hidden `).concat(n, `;
   padding-right: `).concat(s, "px ").concat(n, `;
  }
  body[`).concat(jn, `] {
    overflow: hidden `).concat(n, `;
    overscroll-behavior: contain;
    `).concat([
    t && "position: relative ".concat(n, ";"),
    r === "margin" && `
    padding-left: `.concat(o, `px;
    padding-top: `).concat(a, `px;
    padding-right: `).concat(i, `px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(s, "px ").concat(n, `;
    `),
    r === "padding" && "padding-right: ".concat(s, "px ").concat(n, ";")
  ].filter(Boolean).join(""), `
  }
  
  .`).concat(Ja, ` {
    right: `).concat(s, "px ").concat(n, `;
  }
  
  .`).concat(Qa, ` {
    margin-right: `).concat(s, "px ").concat(n, `;
  }
  
  .`).concat(Ja, " .").concat(Ja, ` {
    right: 0 `).concat(n, `;
  }
  
  .`).concat(Qa, " .").concat(Qa, ` {
    margin-right: 0 `).concat(n, `;
  }
  
  body[`).concat(jn, `] {
    `).concat(Ix, ": ").concat(s, `px;
  }
`);
}, gd = function() {
  var e = parseInt(document.body.getAttribute(jn) || "0", 10);
  return isFinite(e) ? e : 0;
}, Kx = function() {
  T.useEffect(function() {
    return document.body.setAttribute(jn, (gd() + 1).toString()), function() {
      var e = gd() - 1;
      e <= 0 ? document.body.removeAttribute(jn) : document.body.setAttribute(jn, e.toString());
    };
  }, []);
}, Jx = function(e) {
  var t = e.noRelative, r = e.noImportant, n = e.gapMode, o = n === void 0 ? "margin" : n;
  Kx();
  var a = T.useMemo(function() {
    return Hx(o);
  }, [o]);
  return T.createElement(Bx, { styles: Xx(a, !t, o, r ? "" : "!important") });
}, Ll = !1;
if (typeof window < "u")
  try {
    var Na = Object.defineProperty({}, "passive", {
      get: function() {
        return Ll = !0, !0;
      }
    });
    window.addEventListener("test", Na, Na), window.removeEventListener("test", Na, Na);
  } catch {
    Ll = !1;
  }
var gn = Ll ? { passive: !1 } : !1, Qx = function(e) {
  return e.tagName === "TEXTAREA";
}, Sh = function(e, t) {
  if (!(e instanceof Element))
    return !1;
  var r = window.getComputedStyle(e);
  return (
    // not-not-scrollable
    r[t] !== "hidden" && // contains scroll inside self
    !(r.overflowY === r.overflowX && !Qx(e) && r[t] === "visible")
  );
}, Zx = function(e) {
  return Sh(e, "overflowY");
}, ew = function(e) {
  return Sh(e, "overflowX");
}, hd = function(e, t) {
  var r = t.ownerDocument, n = t;
  do {
    typeof ShadowRoot < "u" && n instanceof ShadowRoot && (n = n.host);
    var o = Ah(e, n);
    if (o) {
      var a = Ch(e, n), i = a[1], s = a[2];
      if (i > s)
        return !0;
    }
    n = n.parentNode;
  } while (n && n !== r.body);
  return !1;
}, tw = function(e) {
  var t = e.scrollTop, r = e.scrollHeight, n = e.clientHeight;
  return [
    t,
    r,
    n
  ];
}, rw = function(e) {
  var t = e.scrollLeft, r = e.scrollWidth, n = e.clientWidth;
  return [
    t,
    r,
    n
  ];
}, Ah = function(e, t) {
  return e === "v" ? Zx(t) : ew(t);
}, Ch = function(e, t) {
  return e === "v" ? tw(t) : rw(t);
}, nw = function(e, t) {
  return e === "h" && t === "rtl" ? -1 : 1;
}, ow = function(e, t, r, n, o) {
  var a = nw(e, window.getComputedStyle(t).direction), i = a * n, s = r.target, c = t.contains(s), l = !1, u = i > 0, f = 0, d = 0;
  do {
    if (!s)
      break;
    var b = Ch(e, s), y = b[0], p = b[1], m = b[2], x = p - m - a * y;
    (y || x) && Ah(e, s) && (f += x, d += y);
    var w = s.parentNode;
    s = w && w.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? w.host : w;
  } while (
    // portaled content
    !c && s !== document.body || // self content
    c && (t.contains(s) || t === s)
  );
  return (u && Math.abs(f) < 1 || !u && Math.abs(d) < 1) && (l = !0), l;
}, Ia = function(e) {
  return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, bd = function(e) {
  return [e.deltaX, e.deltaY];
}, yd = function(e) {
  return e && "current" in e ? e.current : e;
}, aw = function(e, t) {
  return e[0] === t[0] && e[1] === t[1];
}, iw = function(e) {
  return `
  .block-interactivity-`.concat(e, ` {pointer-events: none;}
  .allow-interactivity-`).concat(e, ` {pointer-events: all;}
`);
}, sw = 0, hn = [];
function lw(e) {
  var t = T.useRef([]), r = T.useRef([0, 0]), n = T.useRef(), o = T.useState(sw++)[0], a = T.useState(Ph)[0], i = T.useRef(e);
  T.useEffect(function() {
    i.current = e;
  }, [e]), T.useEffect(function() {
    if (e.inert) {
      document.body.classList.add("block-interactivity-".concat(o));
      var p = $x([e.lockRef.current], (e.shards || []).map(yd)).filter(Boolean);
      return p.forEach(function(m) {
        return m.classList.add("allow-interactivity-".concat(o));
      }), function() {
        document.body.classList.remove("block-interactivity-".concat(o)), p.forEach(function(m) {
          return m.classList.remove("allow-interactivity-".concat(o));
        });
      };
    }
  }, [e.inert, e.lockRef.current, e.shards]);
  var s = T.useCallback(function(p, m) {
    if ("touches" in p && p.touches.length === 2 || p.type === "wheel" && p.ctrlKey)
      return !i.current.allowPinchZoom;
    var x = Ia(p), w = r.current, O = "deltaX" in p ? p.deltaX : w[0] - x[0], E = "deltaY" in p ? p.deltaY : w[1] - x[1], h, W = p.target, F = Math.abs(O) > Math.abs(E) ? "h" : "v";
    if ("touches" in p && F === "h" && W.type === "range")
      return !1;
    var Z = hd(F, W);
    if (!Z)
      return !0;
    if (Z ? h = F : (h = F === "v" ? "h" : "v", Z = hd(F, W)), !Z)
      return !1;
    if (!n.current && "changedTouches" in p && (O || E) && (n.current = h), !h)
      return !0;
    var K = n.current || h;
    return ow(K, m, p, K === "h" ? O : E);
  }, []), c = T.useCallback(function(p) {
    var m = p;
    if (!(!hn.length || hn[hn.length - 1] !== a)) {
      var x = "deltaY" in m ? bd(m) : Ia(m), w = t.current.filter(function(h) {
        return h.name === m.type && (h.target === m.target || m.target === h.shadowParent) && aw(h.delta, x);
      })[0];
      if (w && w.should) {
        m.cancelable && m.preventDefault();
        return;
      }
      if (!w) {
        var O = (i.current.shards || []).map(yd).filter(Boolean).filter(function(h) {
          return h.contains(m.target);
        }), E = O.length > 0 ? s(m, O[0]) : !i.current.noIsolation;
        E && m.cancelable && m.preventDefault();
      }
    }
  }, []), l = T.useCallback(function(p, m, x, w) {
    var O = { name: p, delta: m, target: x, should: w, shadowParent: cw(x) };
    t.current.push(O), setTimeout(function() {
      t.current = t.current.filter(function(E) {
        return E !== O;
      });
    }, 1);
  }, []), u = T.useCallback(function(p) {
    r.current = Ia(p), n.current = void 0;
  }, []), f = T.useCallback(function(p) {
    l(p.type, bd(p), p.target, s(p, e.lockRef.current));
  }, []), d = T.useCallback(function(p) {
    l(p.type, Ia(p), p.target, s(p, e.lockRef.current));
  }, []);
  T.useEffect(function() {
    return hn.push(a), e.setCallbacks({
      onScrollCapture: f,
      onWheelCapture: f,
      onTouchMoveCapture: d
    }), document.addEventListener("wheel", c, gn), document.addEventListener("touchmove", c, gn), document.addEventListener("touchstart", u, gn), function() {
      hn = hn.filter(function(p) {
        return p !== a;
      }), document.removeEventListener("wheel", c, gn), document.removeEventListener("touchmove", c, gn), document.removeEventListener("touchstart", u, gn);
    };
  }, []);
  var b = e.removeScrollBar, y = e.inert;
  return T.createElement(
    T.Fragment,
    null,
    y ? T.createElement(a, { styles: iw(o) }) : null,
    b ? T.createElement(Jx, { noRelative: e.noRelative, gapMode: e.gapMode }) : null
  );
}
function cw(e) {
  for (var t = null; e !== null; )
    e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
  return t;
}
const uw = Fx(Eh, lw);
var $h = T.forwardRef(function(e, t) {
  return T.createElement(Mi, $t({}, e, { ref: t, sideCar: uw }));
});
$h.classNames = Mi.classNames;
var fw = function(e) {
  if (typeof document > "u")
    return null;
  var t = Array.isArray(e) ? e[0] : e;
  return t.ownerDocument.body;
}, bn = /* @__PURE__ */ new WeakMap(), Ta = /* @__PURE__ */ new WeakMap(), ja = {}, Ps = 0, Nh = function(e) {
  return e && (e.host || Nh(e.parentNode));
}, dw = function(e, t) {
  return t.map(function(r) {
    if (e.contains(r))
      return r;
    var n = Nh(r);
    return n && e.contains(n) ? n : (console.error("aria-hidden", r, "in not contained inside", e, ". Doing nothing"), null);
  }).filter(function(r) {
    return !!r;
  });
}, pw = function(e, t, r, n) {
  var o = dw(t, Array.isArray(e) ? e : [e]);
  ja[r] || (ja[r] = /* @__PURE__ */ new WeakMap());
  var a = ja[r], i = [], s = /* @__PURE__ */ new Set(), c = new Set(o), l = function(f) {
    !f || s.has(f) || (s.add(f), l(f.parentNode));
  };
  o.forEach(l);
  var u = function(f) {
    !f || c.has(f) || Array.prototype.forEach.call(f.children, function(d) {
      if (s.has(d))
        u(d);
      else
        try {
          var b = d.getAttribute(n), y = b !== null && b !== "false", p = (bn.get(d) || 0) + 1, m = (a.get(d) || 0) + 1;
          bn.set(d, p), a.set(d, m), i.push(d), p === 1 && y && Ta.set(d, !0), m === 1 && d.setAttribute(r, "true"), y || d.setAttribute(n, "true");
        } catch (x) {
          console.error("aria-hidden: cannot operate on ", d, x);
        }
    });
  };
  return u(t), s.clear(), Ps++, function() {
    i.forEach(function(f) {
      var d = bn.get(f) - 1, b = a.get(f) - 1;
      bn.set(f, d), a.set(f, b), d || (Ta.has(f) || f.removeAttribute(n), Ta.delete(f)), b || f.removeAttribute(r);
    }), Ps--, Ps || (bn = /* @__PURE__ */ new WeakMap(), bn = /* @__PURE__ */ new WeakMap(), Ta = /* @__PURE__ */ new WeakMap(), ja = {});
  };
}, mw = function(e, t, r) {
  r === void 0 && (r = "data-aria-hidden");
  var n = Array.from(Array.isArray(e) ? e : [e]), o = fw(e);
  return o ? (n.push.apply(n, Array.from(o.querySelectorAll("[aria-live], script"))), pw(n, o, r, "aria-hidden")) : function() {
    return null;
  };
}, zi = "Dialog", [Ih, A9] = B1(zi), [gw, Ot] = Ih(zi), Th = (e) => {
  const {
    __scopeDialog: t,
    children: r,
    open: n,
    defaultOpen: o,
    onOpenChange: a,
    modal: i = !0
  } = e, s = T.useRef(null), c = T.useRef(null), [l, u] = Z1({
    prop: n,
    defaultProp: o ?? !1,
    onChange: a,
    caller: zi
  });
  return /* @__PURE__ */ L(
    gw,
    {
      scope: t,
      triggerRef: s,
      contentRef: c,
      contentId: ys(),
      titleId: ys(),
      descriptionId: ys(),
      open: l,
      onOpenChange: u,
      onOpenToggle: T.useCallback(() => u((f) => !f), [u]),
      modal: i,
      children: r
    }
  );
};
Th.displayName = zi;
var jh = "DialogTrigger", hw = T.forwardRef(
  (e, t) => {
    const { __scopeDialog: r, ...n } = e, o = Ot(jh, r), a = pn(t, o.triggerRef);
    return /* @__PURE__ */ L(
      Wt.button,
      {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": o.open,
        "aria-controls": o.contentId,
        "data-state": ju(o.open),
        ...n,
        ref: a,
        onClick: $r(e.onClick, o.onOpenToggle)
      }
    );
  }
);
hw.displayName = jh;
var Iu = "DialogPortal", [bw, _h] = Ih(Iu, {
  forceMount: void 0
}), Mh = (e) => {
  const { __scopeDialog: t, forceMount: r, children: n, container: o } = e, a = Ot(Iu, t);
  return /* @__PURE__ */ L(bw, { scope: t, forceMount: r, children: T.Children.map(n, (i) => /* @__PURE__ */ L(_i, { present: r || a.open, children: /* @__PURE__ */ L(wh, { asChild: !0, container: o, children: i }) })) });
};
Mh.displayName = Iu;
var mi = "DialogOverlay", zh = T.forwardRef(
  (e, t) => {
    const r = _h(mi, e.__scopeDialog), { forceMount: n = r.forceMount, ...o } = e, a = Ot(mi, e.__scopeDialog);
    return a.modal ? /* @__PURE__ */ L(_i, { present: n || a.open, children: /* @__PURE__ */ L(vw, { ...o, ref: t }) }) : null;
  }
);
zh.displayName = mi;
var yw = /* @__PURE__ */ gh("DialogOverlay.RemoveScroll"), vw = T.forwardRef(
  (e, t) => {
    const { __scopeDialog: r, ...n } = e, o = Ot(mi, r);
    return (
      // Make sure `Content` is scrollable even when it doesn't live inside `RemoveScroll`
      // ie. when `Overlay` and `Content` are siblings
      /* @__PURE__ */ L($h, { as: yw, allowPinchZoom: !0, shards: [o.contentRef], children: /* @__PURE__ */ L(
        Wt.div,
        {
          "data-state": ju(o.open),
          ...n,
          ref: t,
          style: { pointerEvents: "auto", ...n.style }
        }
      ) })
    );
  }
), tn = "DialogContent", Rh = T.forwardRef(
  (e, t) => {
    const r = _h(tn, e.__scopeDialog), { forceMount: n = r.forceMount, ...o } = e, a = Ot(tn, e.__scopeDialog);
    return /* @__PURE__ */ L(_i, { present: n || a.open, children: a.modal ? /* @__PURE__ */ L(xw, { ...o, ref: t }) : /* @__PURE__ */ L(ww, { ...o, ref: t }) });
  }
);
Rh.displayName = tn;
var xw = T.forwardRef(
  (e, t) => {
    const r = Ot(tn, e.__scopeDialog), n = T.useRef(null), o = pn(t, r.contentRef, n);
    return T.useEffect(() => {
      const a = n.current;
      if (a) return mw(a);
    }, []), /* @__PURE__ */ L(
      Fh,
      {
        ...e,
        ref: o,
        trapFocus: r.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: $r(e.onCloseAutoFocus, (a) => {
          var i;
          a.preventDefault(), (i = r.triggerRef.current) == null || i.focus();
        }),
        onPointerDownOutside: $r(e.onPointerDownOutside, (a) => {
          const i = a.detail.originalEvent, s = i.button === 0 && i.ctrlKey === !0;
          (i.button === 2 || s) && a.preventDefault();
        }),
        onFocusOutside: $r(
          e.onFocusOutside,
          (a) => a.preventDefault()
        )
      }
    );
  }
), ww = T.forwardRef(
  (e, t) => {
    const r = Ot(tn, e.__scopeDialog), n = T.useRef(!1), o = T.useRef(!1);
    return /* @__PURE__ */ L(
      Fh,
      {
        ...e,
        ref: t,
        trapFocus: !1,
        disableOutsidePointerEvents: !1,
        onCloseAutoFocus: (a) => {
          var i, s;
          (i = e.onCloseAutoFocus) == null || i.call(e, a), a.defaultPrevented || (n.current || (s = r.triggerRef.current) == null || s.focus(), a.preventDefault()), n.current = !1, o.current = !1;
        },
        onInteractOutside: (a) => {
          var i, s;
          (i = e.onInteractOutside) == null || i.call(e, a), a.defaultPrevented || (n.current = !0, a.detail.originalEvent.type === "pointerdown" && (o.current = !0));
          const c = a.target;
          (s = r.triggerRef.current) != null && s.contains(c) && a.preventDefault(), a.detail.originalEvent.type === "focusin" && o.current && a.preventDefault();
        }
      }
    );
  }
), Fh = T.forwardRef(
  (e, t) => {
    const { __scopeDialog: r, trapFocus: n, onOpenAutoFocus: o, onCloseAutoFocus: a, ...i } = e, s = Ot(tn, r), c = T.useRef(null), l = pn(t, c);
    return Cx(), /* @__PURE__ */ Ee(vt, { children: [
      /* @__PURE__ */ L(
        vh,
        {
          asChild: !0,
          loop: !0,
          trapped: n,
          onMountAutoFocus: o,
          onUnmountAutoFocus: a,
          children: /* @__PURE__ */ L(
            bh,
            {
              role: "dialog",
              id: s.contentId,
              "aria-describedby": s.descriptionId,
              "aria-labelledby": s.titleId,
              "data-state": ju(s.open),
              ...i,
              ref: l,
              onDismiss: () => s.onOpenChange(!1)
            }
          )
        }
      ),
      /* @__PURE__ */ Ee(vt, { children: [
        /* @__PURE__ */ L(Ow, { titleId: s.titleId }),
        /* @__PURE__ */ L(Pw, { contentRef: c, descriptionId: s.descriptionId })
      ] })
    ] });
  }
), Tu = "DialogTitle", Lh = T.forwardRef(
  (e, t) => {
    const { __scopeDialog: r, ...n } = e, o = Ot(Tu, r);
    return /* @__PURE__ */ L(Wt.h2, { id: o.titleId, ...n, ref: t });
  }
);
Lh.displayName = Tu;
var Dh = "DialogDescription", Wh = T.forwardRef(
  (e, t) => {
    const { __scopeDialog: r, ...n } = e, o = Ot(Dh, r);
    return /* @__PURE__ */ L(Wt.p, { id: o.descriptionId, ...n, ref: t });
  }
);
Wh.displayName = Dh;
var Uh = "DialogClose", kw = T.forwardRef(
  (e, t) => {
    const { __scopeDialog: r, ...n } = e, o = Ot(Uh, r);
    return /* @__PURE__ */ L(
      Wt.button,
      {
        type: "button",
        ...n,
        ref: t,
        onClick: $r(e.onClick, () => o.onOpenChange(!1))
      }
    );
  }
);
kw.displayName = Uh;
function ju(e) {
  return e ? "open" : "closed";
}
var Yh = "DialogTitleWarning", [C9, Vh] = H1(Yh, {
  contentName: tn,
  titleName: Tu,
  docsSlug: "dialog"
}), Ow = ({ titleId: e }) => {
  const t = Vh(Yh), r = `\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;
  return T.useEffect(() => {
    e && (document.getElementById(e) || console.error(r));
  }, [r, e]), null;
}, Ew = "DialogDescriptionWarning", Pw = ({ contentRef: e, descriptionId: t }) => {
  const r = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${Vh(Ew).contentName}}.`;
  return T.useEffect(() => {
    var n;
    const o = (n = e.current) == null ? void 0 : n.getAttribute("aria-describedby");
    t && o && (document.getElementById(t) || console.warn(r));
  }, [r, e, t]), null;
}, Sw = Th, Aw = Mh, Cw = zh, $w = Rh, vd = Lh, Nw = Wh;
const _u = "-", Iw = (e) => {
  const t = jw(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(_u);
      return a[0] === "" && a.length !== 1 && a.shift(), Gh(a, t) || Tw(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const i = r[o] || [];
      return a && n[o] ? [...i, ...n[o]] : i;
    }
  };
}, Gh = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], o = t.nextPart.get(n), a = o ? Gh(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const i = e.join(_u);
  return (r = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : r.classGroupId;
}, xd = /^\[(.+)\]$/, Tw = (e) => {
  if (xd.test(e)) {
    const t = xd.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, jw = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return Mw(Object.entries(e.classGroups), r).forEach(([o, a]) => {
    Dl(a, n, o, t);
  }), n;
}, Dl = (e, t, r, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : wd(t, o);
      a.classGroupId = r;
      return;
    }
    if (typeof o == "function") {
      if (_w(o)) {
        Dl(o(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: r
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      Dl(i, wd(t, a), r, n);
    });
  });
}, wd = (e, t) => {
  let r = e;
  return t.split(_u).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, _w = (e) => e.isThemeGetter, Mw = (e, t) => t ? e.map(([r, n]) => {
  const o = n.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [r, o];
}) : e, zw = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const o = (a, i) => {
    r.set(a, i), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = r.get(a);
      if (i !== void 0)
        return i;
      if ((i = n.get(a)) !== void 0)
        return o(a, i), i;
    },
    set(a, i) {
      r.has(a) ? r.set(a, i) : o(a, i);
    }
  };
}, qh = "!", Rw = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const c = [];
    let l = 0, u = 0, f;
    for (let m = 0; m < s.length; m++) {
      let x = s[m];
      if (l === 0) {
        if (x === o && (n || s.slice(m, m + a) === t)) {
          c.push(s.slice(u, m)), u = m + a;
          continue;
        }
        if (x === "/") {
          f = m;
          continue;
        }
      }
      x === "[" ? l++ : x === "]" && l--;
    }
    const d = c.length === 0 ? s : s.substring(u), b = d.startsWith(qh), y = b ? d.substring(1) : d, p = f && f > u ? f - u : void 0;
    return {
      modifiers: c,
      hasImportantModifier: b,
      baseClassName: y,
      maybePostfixModifierPosition: p
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, Fw = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, Lw = (e) => ({
  cache: zw(e.cacheSize),
  parseClassName: Rw(e),
  ...Iw(e)
}), Dw = /\s+/, Ww = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(Dw);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: b
    } = r(l);
    let y = !!b, p = n(y ? d.substring(0, b) : d);
    if (!p) {
      if (!y) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (p = n(d), !p) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      y = !1;
    }
    const m = Fw(u).join(":"), x = f ? m + qh : m, w = x + p;
    if (a.includes(w))
      continue;
    a.push(w);
    const O = o(p, y);
    for (let E = 0; E < O.length; ++E) {
      const h = O[E];
      a.push(x + h);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function Uw() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = Hh(t)) && (n && (n += " "), n += r);
  return n;
}
const Hh = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = Hh(e[n])) && (r && (r += " "), r += t);
  return r;
};
function Yw(e, ...t) {
  let r, n, o, a = i;
  function i(c) {
    const l = t.reduce((u, f) => f(u), e());
    return r = Lw(l), n = r.cache.get, o = r.cache.set, a = s, s(c);
  }
  function s(c) {
    const l = n(c);
    if (l)
      return l;
    const u = Ww(c, r);
    return o(c, u), u;
  }
  return function() {
    return a(Uw.apply(null, arguments));
  };
}
const Re = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, Bh = /^\[(?:([a-z-]+):)?(.+)\]$/i, Vw = /^\d+\/\d+$/, Gw = /* @__PURE__ */ new Set(["px", "full", "screen"]), qw = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Hw = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Bw = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Xw = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Kw = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Ut = (e) => _n(e) || Gw.has(e) || Vw.test(e), lr = (e) => eo(e, "length", o2), _n = (e) => !!e && !Number.isNaN(Number(e)), Ss = (e) => eo(e, "number", _n), go = (e) => !!e && Number.isInteger(Number(e)), Jw = (e) => e.endsWith("%") && _n(e.slice(0, -1)), fe = (e) => Bh.test(e), cr = (e) => qw.test(e), Qw = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Zw = (e) => eo(e, Qw, Xh), e2 = (e) => eo(e, "position", Xh), t2 = /* @__PURE__ */ new Set(["image", "url"]), r2 = (e) => eo(e, t2, i2), n2 = (e) => eo(e, "", a2), ho = () => !0, eo = (e, t, r) => {
  const n = Bh.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, o2 = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  Hw.test(e) && !Bw.test(e)
), Xh = () => !1, a2 = (e) => Xw.test(e), i2 = (e) => Kw.test(e), s2 = () => {
  const e = Re("colors"), t = Re("spacing"), r = Re("blur"), n = Re("brightness"), o = Re("borderColor"), a = Re("borderRadius"), i = Re("borderSpacing"), s = Re("borderWidth"), c = Re("contrast"), l = Re("grayscale"), u = Re("hueRotate"), f = Re("invert"), d = Re("gap"), b = Re("gradientColorStops"), y = Re("gradientColorStopPositions"), p = Re("inset"), m = Re("margin"), x = Re("opacity"), w = Re("padding"), O = Re("saturate"), E = Re("scale"), h = Re("sepia"), W = Re("skew"), F = Re("space"), Z = Re("translate"), K = () => ["auto", "contain", "none"], H = () => ["auto", "hidden", "clip", "visible", "scroll"], Q = () => ["auto", fe, t], P = () => [fe, t], ae = () => ["", Ut, lr], D = () => ["auto", _n, fe], M = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], R = () => ["solid", "dashed", "dotted", "double", "none"], X = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], B = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], J = () => ["", "0", fe], g = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], v = () => [_n, fe];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [ho],
      spacing: [Ut, lr],
      blur: ["none", "", cr, fe],
      brightness: v(),
      borderColor: [e],
      borderRadius: ["none", "", "full", cr, fe],
      borderSpacing: P(),
      borderWidth: ae(),
      contrast: v(),
      grayscale: J(),
      hueRotate: v(),
      invert: J(),
      gap: P(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Jw, lr],
      inset: Q(),
      margin: Q(),
      opacity: v(),
      padding: P(),
      saturate: v(),
      scale: v(),
      sepia: J(),
      skew: v(),
      space: P(),
      translate: P()
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
        columns: [cr]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": g()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": g()
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
        object: [...M(), fe]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: H()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": H()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": H()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: K()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": K()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": K()
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
        inset: [p]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [p]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [p]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [p]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [p]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [p]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [p]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [p]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [p]
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
        z: ["auto", go, fe]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: Q()
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
        grow: J()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: J()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", go, fe]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [ho]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", go, fe]
        }, fe]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": D()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": D()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [ho]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [go, fe]
        }, fe]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": D()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": D()
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
        p: [w]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [w]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [w]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [w]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [w]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [w]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [w]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [w]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [w]
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
        "space-x": [F]
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
        "space-y": [F]
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
          screen: [cr]
        }, cr]
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
        text: ["base", cr, lr]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Ss]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [ho]
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
        "line-clamp": ["none", _n, Ss]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Ut, fe]
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
        "placeholder-opacity": [x]
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
        "text-opacity": [x]
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
        decoration: [...R(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", Ut, lr]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Ut, fe]
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
        indent: P()
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
        "bg-opacity": [x]
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
        bg: [...M(), e2]
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
        bg: ["auto", "cover", "contain", Zw]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, r2]
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
        from: [y]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [y]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [y]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [b]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [b]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [b]
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
        "border-opacity": [x]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...R(), "hidden"]
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
        "divide-opacity": [x]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: R()
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
        outline: ["", ...R()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Ut, fe]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Ut, lr]
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
        ring: ae()
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
        "ring-opacity": [x]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [Ut, lr]
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
        shadow: ["", "inner", "none", cr, n2]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [ho]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [x]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...X(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": X()
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
        blur: [r]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [n]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [c]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", cr, fe]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [l]
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
        saturate: [O]
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
        "backdrop-blur": [r]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [n]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [c]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [l]
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
        "backdrop-opacity": [x]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [O]
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
        duration: v()
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
        delay: v()
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
        rotate: [go, fe]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [Z]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [Z]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [W]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [W]
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
        "scroll-m": P()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": P()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": P()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": P()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": P()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": P()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": P()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": P()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": P()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": P()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": P()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": P()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": P()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": P()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": P()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": P()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": P()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": P()
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
        stroke: [Ut, lr, Ss]
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
}, Fo = /* @__PURE__ */ Yw(s2);
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function l2(e, t, r) {
  return (t = u2(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function kd(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function U(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? kd(Object(r), !0).forEach(function(n) {
      l2(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : kd(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function c2(e, t) {
  if (typeof e != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(e, t);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function u2(e) {
  var t = c2(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Od = () => {
};
let Mu = {}, Kh = {}, Jh = null, Qh = {
  mark: Od,
  measure: Od
};
try {
  typeof window < "u" && (Mu = window), typeof document < "u" && (Kh = document), typeof MutationObserver < "u" && (Jh = MutationObserver), typeof performance < "u" && (Qh = performance);
} catch {
}
const {
  userAgent: Ed = ""
} = Mu.navigator || {}, Tr = Mu, Ye = Kh, Pd = Jh, _a = Qh;
Tr.document;
const or = !!Ye.documentElement && !!Ye.head && typeof Ye.addEventListener == "function" && typeof Ye.createElement == "function", Zh = ~Ed.indexOf("MSIE") || ~Ed.indexOf("Trident/");
var f2 = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, d2 = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, eb = {
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
}, p2 = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, tb = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Ke = "classic", Ri = "duotone", m2 = "sharp", g2 = "sharp-duotone", rb = [Ke, Ri, m2, g2], h2 = {
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
}, b2 = {
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
}, y2 = /* @__PURE__ */ new Map([["classic", {
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
}]]), v2 = {
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
}, x2 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Sd = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, w2 = ["kit"], k2 = {
  kit: {
    "fa-kit": "fak"
  }
}, O2 = ["fak", "fakd"], E2 = {
  kit: {
    fak: "fa-kit"
  }
}, Ad = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Ma = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, P2 = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], S2 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], A2 = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, C2 = {
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
}, $2 = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Wl = {
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
}, N2 = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], Ul = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...P2, ...N2], I2 = ["solid", "regular", "light", "thin", "duotone", "brands"], nb = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], T2 = nb.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), j2 = [...Object.keys($2), ...I2, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Ma.GROUP, Ma.SWAP_OPACITY, Ma.PRIMARY, Ma.SECONDARY].concat(nb.map((e) => "".concat(e, "x"))).concat(T2.map((e) => "w-".concat(e))), _2 = {
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
const Kt = "___FONT_AWESOME___", Yl = 16, ob = "fa", ab = "svg-inline--fa", rn = "data-fa-i2svg", Vl = "data-fa-pseudo-element", M2 = "data-fa-pseudo-element-pending", zu = "data-prefix", Ru = "data-icon", Cd = "fontawesome-i2svg", z2 = "async", R2 = ["HTML", "HEAD", "STYLE", "SCRIPT"], ib = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function ba(e) {
  return new Proxy(e, {
    get(t, r) {
      return r in t ? t[r] : t[Ke];
    }
  });
}
const sb = U({}, eb);
sb[Ke] = U(U(U(U({}, {
  "fa-duotone": "duotone"
}), eb[Ke]), Sd.kit), Sd["kit-duotone"]);
const F2 = ba(sb), Gl = U({}, v2);
Gl[Ke] = U(U(U(U({}, {
  duotone: "fad"
}), Gl[Ke]), Ad.kit), Ad["kit-duotone"]);
const $d = ba(Gl), ql = U({}, Wl);
ql[Ke] = U(U({}, ql[Ke]), E2.kit);
const Fu = ba(ql), Hl = U({}, C2);
Hl[Ke] = U(U({}, Hl[Ke]), k2.kit);
ba(Hl);
const L2 = f2, lb = "fa-layers-text", D2 = d2, W2 = U({}, h2);
ba(W2);
const U2 = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], As = p2, Y2 = [...w2, ...j2], Lo = Tr.FontAwesomeConfig || {};
function V2(e) {
  var t = Ye.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function G2(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
Ye && typeof Ye.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, r] = e;
  const n = G2(V2(t));
  n != null && (Lo[r] = n);
});
const cb = {
  styleDefault: "solid",
  familyDefault: Ke,
  cssPrefix: ob,
  replacementClass: ab,
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
Lo.familyPrefix && (Lo.cssPrefix = Lo.familyPrefix);
const qn = U(U({}, cb), Lo);
qn.autoReplaceSvg || (qn.observeMutations = !1);
const te = {};
Object.keys(cb).forEach((e) => {
  Object.defineProperty(te, e, {
    enumerable: !0,
    set: function(t) {
      qn[e] = t, Do.forEach((r) => r(te));
    },
    get: function() {
      return qn[e];
    }
  });
});
Object.defineProperty(te, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    qn.cssPrefix = e, Do.forEach((t) => t(te));
  },
  get: function() {
    return qn.cssPrefix;
  }
});
Tr.FontAwesomeConfig = te;
const Do = [];
function q2(e) {
  return Do.push(e), () => {
    Do.splice(Do.indexOf(e), 1);
  };
}
const ur = Yl, Nt = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function H2(e) {
  if (!e || !or)
    return;
  const t = Ye.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const r = Ye.head.childNodes;
  let n = null;
  for (let o = r.length - 1; o > -1; o--) {
    const a = r[o], i = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (n = a);
  }
  return Ye.head.insertBefore(t, n), e;
}
const B2 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function ea() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += B2[Math.random() * 62 | 0];
  return t;
}
function to(e) {
  const t = [];
  for (let r = (e || []).length >>> 0; r--; )
    t[r] = e[r];
  return t;
}
function Lu(e) {
  return e.classList ? to(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function ub(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function X2(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, '="').concat(ub(e[r]), '" '), "").trim();
}
function Fi(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, ": ").concat(e[r].trim(), ";"), "");
}
function Du(e) {
  return e.size !== Nt.size || e.x !== Nt.x || e.y !== Nt.y || e.rotate !== Nt.rotate || e.flipX || e.flipY;
}
function K2(e) {
  let {
    transform: t,
    containerWidth: r,
    iconWidth: n
  } = e;
  const o = {
    transform: "translate(".concat(r / 2, " 256)")
  }, a = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), c = {
    transform: "".concat(a, " ").concat(i, " ").concat(s)
  }, l = {
    transform: "translate(".concat(n / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: c,
    path: l
  };
}
function J2(e) {
  let {
    transform: t,
    width: r = Yl,
    height: n = Yl,
    startCentered: o = !1
  } = e, a = "";
  return o && Zh ? a += "translate(".concat(t.x / ur - r / 2, "em, ").concat(t.y / ur - n / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / ur, "em), calc(-50% + ").concat(t.y / ur, "em)) ") : a += "translate(".concat(t.x / ur, "em, ").concat(t.y / ur, "em) "), a += "scale(".concat(t.size / ur * (t.flipX ? -1 : 1), ", ").concat(t.size / ur * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var Q2 = `:root, :host {
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
function fb() {
  const e = ob, t = ab, r = te.cssPrefix, n = te.replacementClass;
  let o = Q2;
  if (r !== e || n !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(r, "-")).replace(i, "--".concat(r, "-")).replace(s, ".".concat(n));
  }
  return o;
}
let Nd = !1;
function Cs() {
  te.autoAddCss && !Nd && (H2(fb()), Nd = !0);
}
var Z2 = {
  mixout() {
    return {
      dom: {
        css: fb,
        insertCss: Cs
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Cs();
      },
      beforeI2svg() {
        Cs();
      }
    };
  }
};
const Jt = Tr || {};
Jt[Kt] || (Jt[Kt] = {});
Jt[Kt].styles || (Jt[Kt].styles = {});
Jt[Kt].hooks || (Jt[Kt].hooks = {});
Jt[Kt].shims || (Jt[Kt].shims = []);
var It = Jt[Kt];
const db = [], pb = function() {
  Ye.removeEventListener("DOMContentLoaded", pb), gi = 1, db.map((e) => e());
};
let gi = !1;
or && (gi = (Ye.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(Ye.readyState), gi || Ye.addEventListener("DOMContentLoaded", pb));
function ek(e) {
  or && (gi ? setTimeout(e, 0) : db.push(e));
}
function ya(e) {
  const {
    tag: t,
    attributes: r = {},
    children: n = []
  } = e;
  return typeof e == "string" ? ub(e) : "<".concat(t, " ").concat(X2(r), ">").concat(n.map(ya).join(""), "</").concat(t, ">");
}
function Id(e, t, r) {
  if (e && e[t] && e[t][r])
    return {
      prefix: t,
      iconName: r,
      icon: e[t][r]
    };
}
var $s = function(e, t, r, n) {
  var o = Object.keys(e), a = o.length, i = t, s, c, l;
  for (r === void 0 ? (s = 1, l = e[o[0]]) : (s = 0, l = r); s < a; s++)
    c = o[s], l = i(l, e[c], c, e);
  return l;
};
function tk(e) {
  const t = [];
  let r = 0;
  const n = e.length;
  for (; r < n; ) {
    const o = e.charCodeAt(r++);
    if (o >= 55296 && o <= 56319 && r < n) {
      const a = e.charCodeAt(r++);
      (a & 64512) == 56320 ? t.push(((o & 1023) << 10) + (a & 1023) + 65536) : (t.push(o), r--);
    } else
      t.push(o);
  }
  return t;
}
function mb(e) {
  const t = tk(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function rk(e, t) {
  const r = e.length;
  let n = e.charCodeAt(t), o;
  return n >= 55296 && n <= 56319 && r > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (n - 55296) * 1024 + o - 56320 + 65536 : n;
}
function Td(e) {
  return Object.keys(e).reduce((t, r) => {
    const n = e[r];
    return n.icon ? t[n.iconName] = n.icon : t[r] = n, t;
  }, {});
}
function Bl(e, t) {
  let r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: n = !1
  } = r, o = Td(t);
  typeof It.hooks.addPack == "function" && !n ? It.hooks.addPack(e, Td(t)) : It.styles[e] = U(U({}, It.styles[e] || {}), o), e === "fas" && Bl("fa", t);
}
const {
  styles: ta,
  shims: nk
} = It, gb = Object.keys(Fu), ok = gb.reduce((e, t) => (e[t] = Object.keys(Fu[t]), e), {});
let Wu = null, hb = {}, bb = {}, yb = {}, vb = {}, xb = {};
function ak(e) {
  return ~Y2.indexOf(e);
}
function ik(e, t) {
  const r = t.split("-"), n = r[0], o = r.slice(1).join("-");
  return n === e && o !== "" && !ak(o) ? o : null;
}
const wb = () => {
  const e = (n) => $s(ta, (o, a, i) => (o[i] = $s(a, n, {}), o), {});
  hb = e((n, o, a) => (o[3] && (n[o[3]] = a), o[2] && o[2].filter((i) => typeof i == "number").forEach((i) => {
    n[i.toString(16)] = a;
  }), n)), bb = e((n, o, a) => (n[a] = a, o[2] && o[2].filter((i) => typeof i == "string").forEach((i) => {
    n[i] = a;
  }), n)), xb = e((n, o, a) => {
    const i = o[2];
    return n[a] = a, i.forEach((s) => {
      n[s] = a;
    }), n;
  });
  const t = "far" in ta || te.autoFetchSvg, r = $s(nk, (n, o) => {
    const a = o[0];
    let i = o[1];
    const s = o[2];
    return i === "far" && !t && (i = "fas"), typeof a == "string" && (n.names[a] = {
      prefix: i,
      iconName: s
    }), typeof a == "number" && (n.unicodes[a.toString(16)] = {
      prefix: i,
      iconName: s
    }), n;
  }, {
    names: {},
    unicodes: {}
  });
  yb = r.names, vb = r.unicodes, Wu = Li(te.styleDefault, {
    family: te.familyDefault
  });
};
q2((e) => {
  Wu = Li(e.styleDefault, {
    family: te.familyDefault
  });
});
wb();
function Uu(e, t) {
  return (hb[e] || {})[t];
}
function sk(e, t) {
  return (bb[e] || {})[t];
}
function Br(e, t) {
  return (xb[e] || {})[t];
}
function kb(e) {
  return yb[e] || {
    prefix: null,
    iconName: null
  };
}
function lk(e) {
  const t = vb[e], r = Uu("fas", e);
  return t || (r ? {
    prefix: "fas",
    iconName: r
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function jr() {
  return Wu;
}
const Ob = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function ck(e) {
  let t = Ke;
  const r = gb.reduce((n, o) => (n[o] = "".concat(te.cssPrefix, "-").concat(o), n), {});
  return rb.forEach((n) => {
    (e.includes(r[n]) || e.some((o) => ok[n].includes(o))) && (t = n);
  }), t;
}
function Li(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: r = Ke
  } = t, n = F2[r][e];
  if (r === Ri && !e)
    return "fad";
  const o = $d[r][e] || $d[r][n], a = e in It.styles ? e : null;
  return o || a || null;
}
function uk(e) {
  let t = [], r = null;
  return e.forEach((n) => {
    const o = ik(te.cssPrefix, n);
    o ? r = o : n && t.push(n);
  }), {
    iconName: r,
    rest: t
  };
}
function jd(e) {
  return e.sort().filter((t, r, n) => n.indexOf(t) === r);
}
function Di(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: r = !1
  } = t;
  let n = null;
  const o = Ul.concat(S2), a = jd(e.filter((f) => o.includes(f))), i = jd(e.filter((f) => !Ul.includes(f))), s = a.filter((f) => (n = f, !tb.includes(f))), [c = null] = s, l = ck(a), u = U(U({}, uk(i)), {}, {
    prefix: Li(c, {
      family: l
    })
  });
  return U(U(U({}, u), mk({
    values: e,
    family: l,
    styles: ta,
    config: te,
    canonical: u,
    givenPrefix: n
  })), fk(r, n, u));
}
function fk(e, t, r) {
  let {
    prefix: n,
    iconName: o
  } = r;
  if (e || !n || !o)
    return {
      prefix: n,
      iconName: o
    };
  const a = t === "fa" ? kb(o) : {}, i = Br(n, o);
  return o = a.iconName || i || o, n = a.prefix || n, n === "far" && !ta.far && ta.fas && !te.autoFetchSvg && (n = "fas"), {
    prefix: n,
    iconName: o
  };
}
const dk = rb.filter((e) => e !== Ke || e !== Ri), pk = Object.keys(Wl).filter((e) => e !== Ke).map((e) => Object.keys(Wl[e])).flat();
function mk(e) {
  const {
    values: t,
    family: r,
    canonical: n,
    givenPrefix: o = "",
    styles: a = {},
    config: i = {}
  } = e, s = r === Ri, c = t.includes("fa-duotone") || t.includes("fad"), l = i.familyDefault === "duotone", u = n.prefix === "fad" || n.prefix === "fa-duotone";
  if (!s && (c || l || u) && (n.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (n.prefix = "fab"), !n.prefix && dk.includes(r) && (Object.keys(a).find((f) => pk.includes(f)) || i.autoFetchSvg)) {
    const f = y2.get(r).defaultShortPrefixId;
    n.prefix = f, n.iconName = Br(n.prefix, n.iconName) || n.iconName;
  }
  return (n.prefix === "fa" || o === "fa") && (n.prefix = jr() || "fas"), n;
}
class gk {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
      r[n] = arguments[n];
    const o = r.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = U(U({}, this.definitions[a] || {}), o[a]), Bl(a, o[a]);
      const i = Fu[Ke][a];
      i && Bl(i, o[a]), wb();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, r) {
    const n = r.prefix && r.iconName && r.icon ? {
      0: r
    } : r;
    return Object.keys(n).map((o) => {
      const {
        prefix: a,
        iconName: i,
        icon: s
      } = n[o], c = s[2];
      t[a] || (t[a] = {}), c.length > 0 && c.forEach((l) => {
        typeof l == "string" && (t[a][l] = s);
      }), t[a][i] = s;
    }), t;
  }
}
let _d = [], On = {};
const Mn = {}, hk = Object.keys(Mn);
function bk(e, t) {
  let {
    mixoutsTo: r
  } = t;
  return _d = e, On = {}, Object.keys(Mn).forEach((n) => {
    hk.indexOf(n) === -1 && delete Mn[n];
  }), _d.forEach((n) => {
    const o = n.mixout ? n.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (r[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((i) => {
        r[a] || (r[a] = {}), r[a][i] = o[a][i];
      });
    }), n.hooks) {
      const a = n.hooks();
      Object.keys(a).forEach((i) => {
        On[i] || (On[i] = []), On[i].push(a[i]);
      });
    }
    n.provides && n.provides(Mn);
  }), r;
}
function Xl(e, t) {
  for (var r = arguments.length, n = new Array(r > 2 ? r - 2 : 0), o = 2; o < r; o++)
    n[o - 2] = arguments[o];
  return (On[e] || []).forEach((a) => {
    t = a.apply(null, [t, ...n]);
  }), t;
}
function nn(e) {
  for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++)
    r[n - 1] = arguments[n];
  (On[e] || []).forEach((o) => {
    o.apply(null, r);
  });
}
function _r() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Mn[e] ? Mn[e].apply(null, t) : void 0;
}
function Kl(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const r = e.prefix || jr();
  if (t)
    return t = Br(r, t) || t, Id(Eb.definitions, r, t) || Id(It.styles, r, t);
}
const Eb = new gk(), yk = () => {
  te.autoReplaceSvg = !1, te.observeMutations = !1, nn("noAuto");
}, vk = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return or ? (nn("beforeI2svg", e), _r("pseudoElements2svg", e), _r("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    te.autoReplaceSvg === !1 && (te.autoReplaceSvg = !0), te.observeMutations = !0, ek(() => {
      wk({
        autoReplaceSvgRoot: t
      }), nn("watch", e);
    });
  }
}, xk = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Br(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], r = Li(e[0]);
      return {
        prefix: r,
        iconName: Br(r, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(te.cssPrefix, "-")) > -1 || e.match(L2))) {
      const t = Di(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || jr(),
        iconName: Br(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = jr();
      return {
        prefix: t,
        iconName: Br(t, e) || e
      };
    }
  }
}, at = {
  noAuto: yk,
  config: te,
  dom: vk,
  parse: xk,
  library: Eb,
  findIconDefinition: Kl,
  toHtml: ya
}, wk = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = Ye
  } = e;
  (Object.keys(It.styles).length > 0 || te.autoFetchSvg) && or && te.autoReplaceSvg && at.dom.i2svg({
    node: t
  });
};
function Wi(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((r) => ya(r));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!or) return;
      const r = Ye.createElement("div");
      return r.innerHTML = e.html, r.children;
    }
  }), e;
}
function kk(e) {
  let {
    children: t,
    main: r,
    mask: n,
    attributes: o,
    styles: a,
    transform: i
  } = e;
  if (Du(i) && r.found && !n.found) {
    const {
      width: s,
      height: c
    } = r, l = {
      x: s / c / 2,
      y: 0.5
    };
    o.style = Fi(U(U({}, a), {}, {
      "transform-origin": "".concat(l.x + i.x / 16, "em ").concat(l.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function Ok(e) {
  let {
    prefix: t,
    iconName: r,
    children: n,
    attributes: o,
    symbol: a
  } = e;
  const i = a === !0 ? "".concat(t, "-").concat(te.cssPrefix, "-").concat(r) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: U(U({}, o), {}, {
        id: i
      }),
      children: n
    }]
  }];
}
function Yu(e) {
  const {
    icons: {
      main: t,
      mask: r
    },
    prefix: n,
    iconName: o,
    transform: a,
    symbol: i,
    title: s,
    maskId: c,
    titleId: l,
    extra: u,
    watchable: f = !1
  } = e, {
    width: d,
    height: b
  } = r.found ? r : t, y = O2.includes(n), p = [te.replacementClass, o ? "".concat(te.cssPrefix, "-").concat(o) : ""].filter((h) => u.classes.indexOf(h) === -1).filter((h) => h !== "" || !!h).concat(u.classes).join(" ");
  let m = {
    children: [],
    attributes: U(U({}, u.attributes), {}, {
      "data-prefix": n,
      "data-icon": o,
      class: p,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(d, " ").concat(b)
    })
  };
  const x = y && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(d / b * 16 * 0.0625, "em")
  } : {};
  f && (m.attributes[rn] = ""), s && (m.children.push({
    tag: "title",
    attributes: {
      id: m.attributes["aria-labelledby"] || "title-".concat(l || ea())
    },
    children: [s]
  }), delete m.attributes.title);
  const w = U(U({}, m), {}, {
    prefix: n,
    iconName: o,
    main: t,
    mask: r,
    maskId: c,
    transform: a,
    symbol: i,
    styles: U(U({}, x), u.styles)
  }), {
    children: O,
    attributes: E
  } = r.found && t.found ? _r("generateAbstractMask", w) || {
    children: [],
    attributes: {}
  } : _r("generateAbstractIcon", w) || {
    children: [],
    attributes: {}
  };
  return w.children = O, w.attributes = E, i ? Ok(w) : kk(w);
}
function Md(e) {
  const {
    content: t,
    width: r,
    height: n,
    transform: o,
    title: a,
    extra: i,
    watchable: s = !1
  } = e, c = U(U(U({}, i.attributes), a ? {
    title: a
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[rn] = "");
  const l = U({}, i.styles);
  Du(o) && (l.transform = J2({
    transform: o,
    startCentered: !0,
    width: r,
    height: n
  }), l["-webkit-transform"] = l.transform);
  const u = Fi(l);
  u.length > 0 && (c.style = u);
  const f = [];
  return f.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), a && f.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [a]
  }), f;
}
function Ek(e) {
  const {
    content: t,
    title: r,
    extra: n
  } = e, o = U(U(U({}, n.attributes), r ? {
    title: r
  } : {}), {}, {
    class: n.classes.join(" ")
  }), a = Fi(n.styles);
  a.length > 0 && (o.style = a);
  const i = [];
  return i.push({
    tag: "span",
    attributes: o,
    children: [t]
  }), r && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [r]
  }), i;
}
const {
  styles: Ns
} = It;
function Jl(e) {
  const t = e[0], r = e[1], [n] = e.slice(4);
  let o = null;
  return Array.isArray(n) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(te.cssPrefix, "-").concat(As.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(te.cssPrefix, "-").concat(As.SECONDARY),
        fill: "currentColor",
        d: n[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(te.cssPrefix, "-").concat(As.PRIMARY),
        fill: "currentColor",
        d: n[1]
      }
    }]
  } : o = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: n
    }
  }, {
    found: !0,
    width: t,
    height: r,
    icon: o
  };
}
const Pk = {
  found: !1,
  width: 512,
  height: 512
};
function Sk(e, t) {
  !ib && !te.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Ql(e, t) {
  let r = t;
  return t === "fa" && te.styleDefault !== null && (t = jr()), new Promise((n, o) => {
    if (r === "fa") {
      const a = kb(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && Ns[t] && Ns[t][e]) {
      const a = Ns[t][e];
      return n(Jl(a));
    }
    Sk(e, t), n(U(U({}, Pk), {}, {
      icon: te.showMissingIcons && e ? _r("missingIconAbstract") || {} : {}
    }));
  });
}
const zd = () => {
}, Zl = te.measurePerformance && _a && _a.mark && _a.measure ? _a : {
  mark: zd,
  measure: zd
}, Io = 'FA "6.7.2"', Ak = (e) => (Zl.mark("".concat(Io, " ").concat(e, " begins")), () => Pb(e)), Pb = (e) => {
  Zl.mark("".concat(Io, " ").concat(e, " ends")), Zl.measure("".concat(Io, " ").concat(e), "".concat(Io, " ").concat(e, " begins"), "".concat(Io, " ").concat(e, " ends"));
};
var Vu = {
  begin: Ak,
  end: Pb
};
const Za = () => {
};
function Rd(e) {
  return typeof (e.getAttribute ? e.getAttribute(rn) : null) == "string";
}
function Ck(e) {
  const t = e.getAttribute ? e.getAttribute(zu) : null, r = e.getAttribute ? e.getAttribute(Ru) : null;
  return t && r;
}
function $k(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(te.replacementClass);
}
function Nk() {
  return te.autoReplaceSvg === !0 ? ei.replace : ei[te.autoReplaceSvg] || ei.replace;
}
function Ik(e) {
  return Ye.createElementNS("http://www.w3.org/2000/svg", e);
}
function Tk(e) {
  return Ye.createElement(e);
}
function Sb(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: r = e.tag === "svg" ? Ik : Tk
  } = t;
  if (typeof e == "string")
    return Ye.createTextNode(e);
  const n = r(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    n.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    n.appendChild(Sb(o, {
      ceFn: r
    }));
  }), n;
}
function jk(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const ei = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((r) => {
        t.parentNode.insertBefore(Sb(r), t);
      }), t.getAttribute(rn) === null && te.keepOriginalSource) {
        let r = Ye.createComment(jk(t));
        t.parentNode.replaceChild(r, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], r = e[1];
    if (~Lu(t).indexOf(te.replacementClass))
      return ei.replace(e);
    const n = new RegExp("".concat(te.cssPrefix, "-.*"));
    if (delete r[0].attributes.id, r[0].attributes.class) {
      const a = r[0].attributes.class.split(" ").reduce((i, s) => (s === te.replacementClass || s.match(n) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      r[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = r.map((a) => ya(a)).join(`
`);
    t.setAttribute(rn, ""), t.innerHTML = o;
  }
};
function Fd(e) {
  e();
}
function Ab(e, t) {
  const r = typeof t == "function" ? t : Za;
  if (e.length === 0)
    r();
  else {
    let n = Fd;
    te.mutateApproach === z2 && (n = Tr.requestAnimationFrame || Fd), n(() => {
      const o = Nk(), a = Vu.begin("mutate");
      e.map(o), a(), r();
    });
  }
}
let Gu = !1;
function Cb() {
  Gu = !0;
}
function ec() {
  Gu = !1;
}
let hi = null;
function Ld(e) {
  if (!Pd || !te.observeMutations)
    return;
  const {
    treeCallback: t = Za,
    nodeCallback: r = Za,
    pseudoElementsCallback: n = Za,
    observeMutationsRoot: o = Ye
  } = e;
  hi = new Pd((a) => {
    if (Gu) return;
    const i = jr();
    to(a).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Rd(s.addedNodes[0]) && (te.searchPseudoElements && n(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && te.searchPseudoElements && n(s.target.parentNode), s.type === "attributes" && Rd(s.target) && ~U2.indexOf(s.attributeName))
        if (s.attributeName === "class" && Ck(s.target)) {
          const {
            prefix: c,
            iconName: l
          } = Di(Lu(s.target));
          s.target.setAttribute(zu, c || i), l && s.target.setAttribute(Ru, l);
        } else $k(s.target) && r(s.target);
    });
  }), or && hi.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function _k() {
  hi && hi.disconnect();
}
function Mk(e) {
  const t = e.getAttribute("style");
  let r = [];
  return t && (r = t.split(";").reduce((n, o) => {
    const a = o.split(":"), i = a[0], s = a.slice(1);
    return i && s.length > 0 && (n[i] = s.join(":").trim()), n;
  }, {})), r;
}
function zk(e) {
  const t = e.getAttribute("data-prefix"), r = e.getAttribute("data-icon"), n = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = Di(Lu(e));
  return o.prefix || (o.prefix = jr()), t && r && (o.prefix = t, o.iconName = r), o.iconName && o.prefix || (o.prefix && n.length > 0 && (o.iconName = sk(o.prefix, e.innerText) || Uu(o.prefix, mb(e.innerText))), !o.iconName && te.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function Rk(e) {
  const t = to(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), r = e.getAttribute("title"), n = e.getAttribute("data-fa-title-id");
  return te.autoA11y && (r ? t["aria-labelledby"] = "".concat(te.replacementClass, "-title-").concat(n || ea()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function Fk() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: Nt,
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
function Dd(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: r,
    prefix: n,
    rest: o
  } = zk(e), a = Rk(e), i = Xl("parseNodeAttributes", {}, e);
  let s = t.styleParser ? Mk(e) : [];
  return U({
    iconName: r,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: n,
    transform: Nt,
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
  styles: Lk
} = It;
function $b(e) {
  const t = te.autoReplaceSvg === "nest" ? Dd(e, {
    styleParser: !1
  }) : Dd(e);
  return ~t.extra.classes.indexOf(lb) ? _r("generateLayersText", e, t) : _r("generateSvgReplacementMutation", e, t);
}
function Dk() {
  return [...x2, ...Ul];
}
function Wd(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!or) return Promise.resolve();
  const r = Ye.documentElement.classList, n = (u) => r.add("".concat(Cd, "-").concat(u)), o = (u) => r.remove("".concat(Cd, "-").concat(u)), a = te.autoFetchSvg ? Dk() : tb.concat(Object.keys(Lk));
  a.includes("fa") || a.push("fa");
  const i = [".".concat(lb, ":not([").concat(rn, "])")].concat(a.map((u) => ".".concat(u, ":not([").concat(rn, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = to(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    n("pending"), o("complete");
  else
    return Promise.resolve();
  const c = Vu.begin("onTree"), l = s.reduce((u, f) => {
    try {
      const d = $b(f);
      d && u.push(d);
    } catch (d) {
      ib || d.name === "MissingIcon" && console.error(d);
    }
    return u;
  }, []);
  return new Promise((u, f) => {
    Promise.all(l).then((d) => {
      Ab(d, () => {
        n("active"), n("complete"), o("pending"), typeof t == "function" && t(), c(), u();
      });
    }).catch((d) => {
      c(), f(d);
    });
  });
}
function Wk(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  $b(e).then((r) => {
    r && Ab([r], t);
  });
}
function Uk(e) {
  return function(t) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const n = (t || {}).icon ? t : Kl(t || {});
    let {
      mask: o
    } = r;
    return o && (o = (o || {}).icon ? o : Kl(o || {})), e(n, U(U({}, r), {}, {
      mask: o
    }));
  };
}
const Yk = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: r = Nt,
    symbol: n = !1,
    mask: o = null,
    maskId: a = null,
    title: i = null,
    titleId: s = null,
    classes: c = [],
    attributes: l = {},
    styles: u = {}
  } = t;
  if (!e) return;
  const {
    prefix: f,
    iconName: d,
    icon: b
  } = e;
  return Wi(U({
    type: "icon"
  }, e), () => (nn("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), te.autoA11y && (i ? l["aria-labelledby"] = "".concat(te.replacementClass, "-title-").concat(s || ea()) : (l["aria-hidden"] = "true", l.focusable = "false")), Yu({
    icons: {
      main: Jl(b),
      mask: o ? Jl(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: f,
    iconName: d,
    transform: U(U({}, Nt), r),
    symbol: n,
    title: i,
    maskId: a,
    titleId: s,
    extra: {
      attributes: l,
      styles: u,
      classes: c
    }
  })));
};
var Vk = {
  mixout() {
    return {
      icon: Uk(Yk)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Wd, e.nodeCallback = Wk, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: r = Ye,
        callback: n = () => {
        }
      } = t;
      return Wd(r, n);
    }, e.generateSvgReplacementMutation = function(t, r) {
      const {
        iconName: n,
        title: o,
        titleId: a,
        prefix: i,
        transform: s,
        symbol: c,
        mask: l,
        maskId: u,
        extra: f
      } = r;
      return new Promise((d, b) => {
        Promise.all([Ql(n, i), l.iconName ? Ql(l.iconName, l.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((y) => {
          let [p, m] = y;
          d([t, Yu({
            icons: {
              main: p,
              mask: m
            },
            prefix: i,
            iconName: n,
            transform: s,
            symbol: c,
            maskId: u,
            title: o,
            titleId: a,
            extra: f,
            watchable: !0
          })]);
        }).catch(b);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: r,
        attributes: n,
        main: o,
        transform: a,
        styles: i
      } = t;
      const s = Fi(i);
      s.length > 0 && (n.style = s);
      let c;
      return Du(a) && (c = _r("generateAbstractTransformGrouping", {
        main: o,
        transform: a,
        containerWidth: o.width,
        iconWidth: o.width
      })), r.push(c || o.icon), {
        children: r,
        attributes: n
      };
    };
  }
}, Gk = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: r = []
        } = t;
        return Wi({
          type: "layer"
        }, () => {
          nn("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let n = [];
          return e((o) => {
            Array.isArray(o) ? o.map((a) => {
              n = n.concat(a.abstract);
            }) : n = n.concat(o.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(te.cssPrefix, "-layers"), ...r].join(" ")
            },
            children: n
          }];
        });
      }
    };
  }
}, qk = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: r = null,
          classes: n = [],
          attributes: o = {},
          styles: a = {}
        } = t;
        return Wi({
          type: "counter",
          content: e
        }, () => (nn("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Ek({
          content: e.toString(),
          title: r,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(te.cssPrefix, "-layers-counter"), ...n]
          }
        })));
      }
    };
  }
}, Hk = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: r = Nt,
          title: n = null,
          classes: o = [],
          attributes: a = {},
          styles: i = {}
        } = t;
        return Wi({
          type: "text",
          content: e
        }, () => (nn("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Md({
          content: e,
          transform: U(U({}, Nt), r),
          title: n,
          extra: {
            attributes: a,
            styles: i,
            classes: ["".concat(te.cssPrefix, "-layers-text"), ...o]
          }
        })));
      }
    };
  },
  provides(e) {
    e.generateLayersText = function(t, r) {
      const {
        title: n,
        transform: o,
        extra: a
      } = r;
      let i = null, s = null;
      if (Zh) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), l = t.getBoundingClientRect();
        i = l.width / c, s = l.height / c;
      }
      return te.autoA11y && !n && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, Md({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: o,
        title: n,
        extra: a,
        watchable: !0
      })]);
    };
  }
};
const Bk = new RegExp('"', "ug"), Ud = [1105920, 1112319], Yd = U(U(U(U({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), b2), _2), A2), tc = Object.keys(Yd).reduce((e, t) => (e[t.toLowerCase()] = Yd[t], e), {}), Xk = Object.keys(tc).reduce((e, t) => {
  const r = tc[t];
  return e[t] = r[900] || [...Object.entries(r)][0][1], e;
}, {});
function Kk(e) {
  const t = e.replace(Bk, ""), r = rk(t, 0), n = r >= Ud[0] && r <= Ud[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: mb(o ? t[0] : t),
    isSecondary: n || o
  };
}
function Jk(e, t) {
  const r = e.replace(/^['"]|['"]$/g, "").toLowerCase(), n = parseInt(t), o = isNaN(n) ? "normal" : n;
  return (tc[r] || {})[o] || Xk[r];
}
function Vd(e, t) {
  const r = "".concat(M2).concat(t.replace(":", "-"));
  return new Promise((n, o) => {
    if (e.getAttribute(r) !== null)
      return n();
    const a = to(e.children).filter((f) => f.getAttribute(Vl) === t)[0], i = Tr.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), c = s.match(D2), l = i.getPropertyValue("font-weight"), u = i.getPropertyValue("content");
    if (a && !c)
      return e.removeChild(a), n();
    if (c && u !== "none" && u !== "") {
      const f = i.getPropertyValue("content");
      let d = Jk(s, l);
      const {
        value: b,
        isSecondary: y
      } = Kk(f), p = c[0].startsWith("FontAwesome");
      let m = Uu(d, b), x = m;
      if (p) {
        const w = lk(b);
        w.iconName && w.prefix && (m = w.iconName, d = w.prefix);
      }
      if (m && !y && (!a || a.getAttribute(zu) !== d || a.getAttribute(Ru) !== x)) {
        e.setAttribute(r, x), a && e.removeChild(a);
        const w = Fk(), {
          extra: O
        } = w;
        O.attributes[Vl] = t, Ql(m, d).then((E) => {
          const h = Yu(U(U({}, w), {}, {
            icons: {
              main: E,
              mask: Ob()
            },
            prefix: d,
            iconName: x,
            extra: O,
            watchable: !0
          })), W = Ye.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(W, e.firstChild) : e.appendChild(W), W.outerHTML = h.map((F) => ya(F)).join(`
`), e.removeAttribute(r), n();
        }).catch(o);
      } else
        n();
    } else
      n();
  });
}
function Qk(e) {
  return Promise.all([Vd(e, "::before"), Vd(e, "::after")]);
}
function Zk(e) {
  return e.parentNode !== document.head && !~R2.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Vl) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Gd(e) {
  if (or)
    return new Promise((t, r) => {
      const n = to(e.querySelectorAll("*")).filter(Zk).map(Qk), o = Vu.begin("searchPseudoElements");
      Cb(), Promise.all(n).then(() => {
        o(), ec(), t();
      }).catch(() => {
        o(), ec(), r();
      });
    });
}
var eO = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Gd, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: r = Ye
      } = t;
      te.searchPseudoElements && Gd(r);
    };
  }
};
let qd = !1;
var tO = {
  mixout() {
    return {
      dom: {
        unwatch() {
          Cb(), qd = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Ld(Xl("mutationObserverCallbacks", {}));
      },
      noAuto() {
        _k();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        qd ? ec() : Ld(Xl("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Hd = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((r, n) => {
    const o = n.toLowerCase().split("-"), a = o[0];
    let i = o.slice(1).join("-");
    if (a && i === "h")
      return r.flipX = !0, r;
    if (a && i === "v")
      return r.flipY = !0, r;
    if (i = parseFloat(i), isNaN(i))
      return r;
    switch (a) {
      case "grow":
        r.size = r.size + i;
        break;
      case "shrink":
        r.size = r.size - i;
        break;
      case "left":
        r.x = r.x - i;
        break;
      case "right":
        r.x = r.x + i;
        break;
      case "up":
        r.y = r.y - i;
        break;
      case "down":
        r.y = r.y + i;
        break;
      case "rotate":
        r.rotate = r.rotate + i;
        break;
    }
    return r;
  }, t);
};
var rO = {
  mixout() {
    return {
      parse: {
        transform: (e) => Hd(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-transform");
        return r && (e.transform = Hd(r)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: r,
        transform: n,
        containerWidth: o,
        iconWidth: a
      } = t;
      const i = {
        transform: "translate(".concat(o / 2, " 256)")
      }, s = "translate(".concat(n.x * 32, ", ").concat(n.y * 32, ") "), c = "scale(".concat(n.size / 16 * (n.flipX ? -1 : 1), ", ").concat(n.size / 16 * (n.flipY ? -1 : 1), ") "), l = "rotate(".concat(n.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(c, " ").concat(l)
      }, f = {
        transform: "translate(".concat(a / 2 * -1, " -256)")
      }, d = {
        outer: i,
        inner: u,
        path: f
      };
      return {
        tag: "g",
        attributes: U({}, d.outer),
        children: [{
          tag: "g",
          attributes: U({}, d.inner),
          children: [{
            tag: r.icon.tag,
            children: r.icon.children,
            attributes: U(U({}, r.icon.attributes), d.path)
          }]
        }]
      };
    };
  }
};
const Is = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Bd(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function nO(e) {
  return e.tag === "g" ? e.children : [e];
}
var oO = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-mask"), n = r ? Di(r.split(" ").map((o) => o.trim())) : Ob();
        return n.prefix || (n.prefix = jr()), e.mask = n, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: r,
        attributes: n,
        main: o,
        mask: a,
        maskId: i,
        transform: s
      } = t;
      const {
        width: c,
        icon: l
      } = o, {
        width: u,
        icon: f
      } = a, d = K2({
        transform: s,
        containerWidth: u,
        iconWidth: c
      }), b = {
        tag: "rect",
        attributes: U(U({}, Is), {}, {
          fill: "white"
        })
      }, y = l.children ? {
        children: l.children.map(Bd)
      } : {}, p = {
        tag: "g",
        attributes: U({}, d.inner),
        children: [Bd(U({
          tag: l.tag,
          attributes: U(U({}, l.attributes), d.path)
        }, y))]
      }, m = {
        tag: "g",
        attributes: U({}, d.outer),
        children: [p]
      }, x = "mask-".concat(i || ea()), w = "clip-".concat(i || ea()), O = {
        tag: "mask",
        attributes: U(U({}, Is), {}, {
          id: x,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [b, m]
      }, E = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: w
          },
          children: nO(f)
        }, O]
      };
      return r.push(E, {
        tag: "rect",
        attributes: U({
          fill: "currentColor",
          "clip-path": "url(#".concat(w, ")"),
          mask: "url(#".concat(x, ")")
        }, Is)
      }), {
        children: r,
        attributes: n
      };
    };
  }
}, aO = {
  provides(e) {
    let t = !1;
    Tr.matchMedia && (t = Tr.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const r = [], n = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      r.push({
        tag: "path",
        attributes: U(U({}, n), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = U(U({}, o), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: U(U({}, n), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: U(U({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: U(U({}, a), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), r.push(i), r.push({
        tag: "path",
        attributes: U(U({}, n), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: U(U({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || r.push({
        tag: "path",
        attributes: U(U({}, n), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: U(U({}, a), {}, {
            values: "0;0;1;1;0;0;"
          })
        }]
      }), {
        tag: "g",
        attributes: {
          class: "missing"
        },
        children: r
      };
    };
  }
}, iO = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-symbol"), n = r === null ? !1 : r === "" ? !0 : r;
        return e.symbol = n, e;
      }
    };
  }
}, sO = [Z2, Vk, Gk, qk, Hk, eO, tO, rO, oO, aO, iO];
bk(sO, {
  mixoutsTo: at
});
at.noAuto;
at.config;
at.library;
at.dom;
const rc = at.parse;
at.findIconDefinition;
at.toHtml;
const lO = at.icon;
at.layer;
at.text;
at.counter;
function cO(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var za = { exports: {} }, Ts = { exports: {} }, Pe = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Xd;
function uO() {
  if (Xd) return Pe;
  Xd = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, y = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, x = e ? Symbol.for("react.responder") : 60118, w = e ? Symbol.for("react.scope") : 60119;
  function O(h) {
    if (typeof h == "object" && h !== null) {
      var W = h.$$typeof;
      switch (W) {
        case t:
          switch (h = h.type, h) {
            case c:
            case l:
            case n:
            case a:
            case o:
            case f:
              return h;
            default:
              switch (h = h && h.$$typeof, h) {
                case s:
                case u:
                case y:
                case b:
                case i:
                  return h;
                default:
                  return W;
              }
          }
        case r:
          return W;
      }
    }
  }
  function E(h) {
    return O(h) === l;
  }
  return Pe.AsyncMode = c, Pe.ConcurrentMode = l, Pe.ContextConsumer = s, Pe.ContextProvider = i, Pe.Element = t, Pe.ForwardRef = u, Pe.Fragment = n, Pe.Lazy = y, Pe.Memo = b, Pe.Portal = r, Pe.Profiler = a, Pe.StrictMode = o, Pe.Suspense = f, Pe.isAsyncMode = function(h) {
    return E(h) || O(h) === c;
  }, Pe.isConcurrentMode = E, Pe.isContextConsumer = function(h) {
    return O(h) === s;
  }, Pe.isContextProvider = function(h) {
    return O(h) === i;
  }, Pe.isElement = function(h) {
    return typeof h == "object" && h !== null && h.$$typeof === t;
  }, Pe.isForwardRef = function(h) {
    return O(h) === u;
  }, Pe.isFragment = function(h) {
    return O(h) === n;
  }, Pe.isLazy = function(h) {
    return O(h) === y;
  }, Pe.isMemo = function(h) {
    return O(h) === b;
  }, Pe.isPortal = function(h) {
    return O(h) === r;
  }, Pe.isProfiler = function(h) {
    return O(h) === a;
  }, Pe.isStrictMode = function(h) {
    return O(h) === o;
  }, Pe.isSuspense = function(h) {
    return O(h) === f;
  }, Pe.isValidElementType = function(h) {
    return typeof h == "string" || typeof h == "function" || h === n || h === l || h === a || h === o || h === f || h === d || typeof h == "object" && h !== null && (h.$$typeof === y || h.$$typeof === b || h.$$typeof === i || h.$$typeof === s || h.$$typeof === u || h.$$typeof === m || h.$$typeof === x || h.$$typeof === w || h.$$typeof === p);
  }, Pe.typeOf = O, Pe;
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
var Kd;
function fO() {
  return Kd || (Kd = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, y = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, x = e ? Symbol.for("react.responder") : 60118, w = e ? Symbol.for("react.scope") : 60119;
    function O(k) {
      return typeof k == "string" || typeof k == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      k === n || k === l || k === a || k === o || k === f || k === d || typeof k == "object" && k !== null && (k.$$typeof === y || k.$$typeof === b || k.$$typeof === i || k.$$typeof === s || k.$$typeof === u || k.$$typeof === m || k.$$typeof === x || k.$$typeof === w || k.$$typeof === p);
    }
    function E(k) {
      if (typeof k == "object" && k !== null) {
        var ue = k.$$typeof;
        switch (ue) {
          case t:
            var _e = k.type;
            switch (_e) {
              case c:
              case l:
              case n:
              case a:
              case o:
              case f:
                return _e;
              default:
                var et = _e && _e.$$typeof;
                switch (et) {
                  case s:
                  case u:
                  case y:
                  case b:
                  case i:
                    return et;
                  default:
                    return ue;
                }
            }
          case r:
            return ue;
        }
      }
    }
    var h = c, W = l, F = s, Z = i, K = t, H = u, Q = n, P = y, ae = b, D = r, M = a, R = o, X = f, B = !1;
    function J(k) {
      return B || (B = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), g(k) || E(k) === c;
    }
    function g(k) {
      return E(k) === l;
    }
    function v(k) {
      return E(k) === s;
    }
    function C(k) {
      return E(k) === i;
    }
    function A(k) {
      return typeof k == "object" && k !== null && k.$$typeof === t;
    }
    function S(k) {
      return E(k) === u;
    }
    function I(k) {
      return E(k) === n;
    }
    function N(k) {
      return E(k) === y;
    }
    function $(k) {
      return E(k) === b;
    }
    function _(k) {
      return E(k) === r;
    }
    function j(k) {
      return E(k) === a;
    }
    function z(k) {
      return E(k) === o;
    }
    function ee(k) {
      return E(k) === f;
    }
    Ie.AsyncMode = h, Ie.ConcurrentMode = W, Ie.ContextConsumer = F, Ie.ContextProvider = Z, Ie.Element = K, Ie.ForwardRef = H, Ie.Fragment = Q, Ie.Lazy = P, Ie.Memo = ae, Ie.Portal = D, Ie.Profiler = M, Ie.StrictMode = R, Ie.Suspense = X, Ie.isAsyncMode = J, Ie.isConcurrentMode = g, Ie.isContextConsumer = v, Ie.isContextProvider = C, Ie.isElement = A, Ie.isForwardRef = S, Ie.isFragment = I, Ie.isLazy = N, Ie.isMemo = $, Ie.isPortal = _, Ie.isProfiler = j, Ie.isStrictMode = z, Ie.isSuspense = ee, Ie.isValidElementType = O, Ie.typeOf = E;
  }()), Ie;
}
var Jd;
function Nb() {
  return Jd || (Jd = 1, process.env.NODE_ENV === "production" ? Ts.exports = uO() : Ts.exports = fO()), Ts.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var js, Qd;
function dO() {
  if (Qd) return js;
  Qd = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, r = Object.prototype.propertyIsEnumerable;
  function n(a) {
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
      var c = Object.getOwnPropertyNames(i).map(function(u) {
        return i[u];
      });
      if (c.join("") !== "0123456789")
        return !1;
      var l = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(u) {
        l[u] = u;
      }), Object.keys(Object.assign({}, l)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return js = o() ? Object.assign : function(a, i) {
    for (var s, c = n(a), l, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var f in s)
        t.call(s, f) && (c[f] = s[f]);
      if (e) {
        l = e(s);
        for (var d = 0; d < l.length; d++)
          r.call(s, l[d]) && (c[l[d]] = s[l[d]]);
      }
    }
    return c;
  }, js;
}
var _s, Zd;
function qu() {
  if (Zd) return _s;
  Zd = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return _s = e, _s;
}
var ep, tp;
function Ib() {
  return tp || (tp = 1, ep = Function.call.bind(Object.prototype.hasOwnProperty)), ep;
}
var Ms, rp;
function pO() {
  if (rp) return Ms;
  rp = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ qu(), r = {}, n = /* @__PURE__ */ Ib();
    e = function(a) {
      var i = "Warning: " + a;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function o(a, i, s, c, l) {
    if (process.env.NODE_ENV !== "production") {
      for (var u in a)
        if (n(a, u)) {
          var f;
          try {
            if (typeof a[u] != "function") {
              var d = Error(
                (c || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw d.name = "Invariant Violation", d;
            }
            f = a[u](i, u, c, s, null, t);
          } catch (y) {
            f = y;
          }
          if (f && !(f instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof f + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), f instanceof Error && !(f.message in r)) {
            r[f.message] = !0;
            var b = l ? l() : "";
            e(
              "Failed " + s + " type: " + f.message + (b ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (r = {});
  }, Ms = o, Ms;
}
var zs, np;
function mO() {
  if (np) return zs;
  np = 1;
  var e = Nb(), t = dO(), r = /* @__PURE__ */ qu(), n = /* @__PURE__ */ Ib(), o = /* @__PURE__ */ pO(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(s) {
    var c = "Warning: " + s;
    typeof console < "u" && console.error(c);
    try {
      throw new Error(c);
    } catch {
    }
  });
  function i() {
    return null;
  }
  return zs = function(s, c) {
    var l = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function f(g) {
      var v = g && (l && g[l] || g[u]);
      if (typeof v == "function")
        return v;
    }
    var d = "<<anonymous>>", b = {
      array: x("array"),
      bigint: x("bigint"),
      bool: x("boolean"),
      func: x("function"),
      number: x("number"),
      object: x("object"),
      string: x("string"),
      symbol: x("symbol"),
      any: w(),
      arrayOf: O,
      element: E(),
      elementType: h(),
      instanceOf: W,
      node: H(),
      objectOf: Z,
      oneOf: F,
      oneOfType: K,
      shape: P,
      exact: ae
    };
    function y(g, v) {
      return g === v ? g !== 0 || 1 / g === 1 / v : g !== g && v !== v;
    }
    function p(g, v) {
      this.message = g, this.data = v && typeof v == "object" ? v : {}, this.stack = "";
    }
    p.prototype = Error.prototype;
    function m(g) {
      if (process.env.NODE_ENV !== "production")
        var v = {}, C = 0;
      function A(I, N, $, _, j, z, ee) {
        if (_ = _ || d, z = z || $, ee !== r) {
          if (c) {
            var k = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw k.name = "Invariant Violation", k;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ue = _ + ":" + $;
            !v[ue] && // Avoid spamming the console because they are often not actionable except for lib authors
            C < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + z + "` prop on `" + _ + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), v[ue] = !0, C++);
          }
        }
        return N[$] == null ? I ? N[$] === null ? new p("The " + j + " `" + z + "` is marked as required " + ("in `" + _ + "`, but its value is `null`.")) : new p("The " + j + " `" + z + "` is marked as required in " + ("`" + _ + "`, but its value is `undefined`.")) : null : g(N, $, _, j, z);
      }
      var S = A.bind(null, !1);
      return S.isRequired = A.bind(null, !0), S;
    }
    function x(g) {
      function v(C, A, S, I, N, $) {
        var _ = C[A], j = R(_);
        if (j !== g) {
          var z = X(_);
          return new p(
            "Invalid " + I + " `" + N + "` of type " + ("`" + z + "` supplied to `" + S + "`, expected ") + ("`" + g + "`."),
            { expectedType: g }
          );
        }
        return null;
      }
      return m(v);
    }
    function w() {
      return m(i);
    }
    function O(g) {
      function v(C, A, S, I, N) {
        if (typeof g != "function")
          return new p("Property `" + N + "` of component `" + S + "` has invalid PropType notation inside arrayOf.");
        var $ = C[A];
        if (!Array.isArray($)) {
          var _ = R($);
          return new p("Invalid " + I + " `" + N + "` of type " + ("`" + _ + "` supplied to `" + S + "`, expected an array."));
        }
        for (var j = 0; j < $.length; j++) {
          var z = g($, j, S, I, N + "[" + j + "]", r);
          if (z instanceof Error)
            return z;
        }
        return null;
      }
      return m(v);
    }
    function E() {
      function g(v, C, A, S, I) {
        var N = v[C];
        if (!s(N)) {
          var $ = R(N);
          return new p("Invalid " + S + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return m(g);
    }
    function h() {
      function g(v, C, A, S, I) {
        var N = v[C];
        if (!e.isValidElementType(N)) {
          var $ = R(N);
          return new p("Invalid " + S + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return m(g);
    }
    function W(g) {
      function v(C, A, S, I, N) {
        if (!(C[A] instanceof g)) {
          var $ = g.name || d, _ = J(C[A]);
          return new p("Invalid " + I + " `" + N + "` of type " + ("`" + _ + "` supplied to `" + S + "`, expected ") + ("instance of `" + $ + "`."));
        }
        return null;
      }
      return m(v);
    }
    function F(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), i;
      function v(C, A, S, I, N) {
        for (var $ = C[A], _ = 0; _ < g.length; _++)
          if (y($, g[_]))
            return null;
        var j = JSON.stringify(g, function(z, ee) {
          var k = X(ee);
          return k === "symbol" ? String(ee) : ee;
        });
        return new p("Invalid " + I + " `" + N + "` of value `" + String($) + "` " + ("supplied to `" + S + "`, expected one of " + j + "."));
      }
      return m(v);
    }
    function Z(g) {
      function v(C, A, S, I, N) {
        if (typeof g != "function")
          return new p("Property `" + N + "` of component `" + S + "` has invalid PropType notation inside objectOf.");
        var $ = C[A], _ = R($);
        if (_ !== "object")
          return new p("Invalid " + I + " `" + N + "` of type " + ("`" + _ + "` supplied to `" + S + "`, expected an object."));
        for (var j in $)
          if (n($, j)) {
            var z = g($, j, S, I, N + "." + j, r);
            if (z instanceof Error)
              return z;
          }
        return null;
      }
      return m(v);
    }
    function K(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var v = 0; v < g.length; v++) {
        var C = g[v];
        if (typeof C != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + B(C) + " at index " + v + "."
          ), i;
      }
      function A(S, I, N, $, _) {
        for (var j = [], z = 0; z < g.length; z++) {
          var ee = g[z], k = ee(S, I, N, $, _, r);
          if (k == null)
            return null;
          k.data && n(k.data, "expectedType") && j.push(k.data.expectedType);
        }
        var ue = j.length > 0 ? ", expected one of type [" + j.join(", ") + "]" : "";
        return new p("Invalid " + $ + " `" + _ + "` supplied to " + ("`" + N + "`" + ue + "."));
      }
      return m(A);
    }
    function H() {
      function g(v, C, A, S, I) {
        return D(v[C]) ? null : new p("Invalid " + S + " `" + I + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return m(g);
    }
    function Q(g, v, C, A, S) {
      return new p(
        (g || "React class") + ": " + v + " type `" + C + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + S + "`."
      );
    }
    function P(g) {
      function v(C, A, S, I, N) {
        var $ = C[A], _ = R($);
        if (_ !== "object")
          return new p("Invalid " + I + " `" + N + "` of type `" + _ + "` " + ("supplied to `" + S + "`, expected `object`."));
        for (var j in g) {
          var z = g[j];
          if (typeof z != "function")
            return Q(S, I, N, j, X(z));
          var ee = z($, j, S, I, N + "." + j, r);
          if (ee)
            return ee;
        }
        return null;
      }
      return m(v);
    }
    function ae(g) {
      function v(C, A, S, I, N) {
        var $ = C[A], _ = R($);
        if (_ !== "object")
          return new p("Invalid " + I + " `" + N + "` of type `" + _ + "` " + ("supplied to `" + S + "`, expected `object`."));
        var j = t({}, C[A], g);
        for (var z in j) {
          var ee = g[z];
          if (n(g, z) && typeof ee != "function")
            return Q(S, I, N, z, X(ee));
          if (!ee)
            return new p(
              "Invalid " + I + " `" + N + "` key `" + z + "` supplied to `" + S + "`.\nBad object: " + JSON.stringify(C[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(g), null, "  ")
            );
          var k = ee($, z, S, I, N + "." + z, r);
          if (k)
            return k;
        }
        return null;
      }
      return m(v);
    }
    function D(g) {
      switch (typeof g) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !g;
        case "object":
          if (Array.isArray(g))
            return g.every(D);
          if (g === null || s(g))
            return !0;
          var v = f(g);
          if (v) {
            var C = v.call(g), A;
            if (v !== g.entries) {
              for (; !(A = C.next()).done; )
                if (!D(A.value))
                  return !1;
            } else
              for (; !(A = C.next()).done; ) {
                var S = A.value;
                if (S && !D(S[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function M(g, v) {
      return g === "symbol" ? !0 : v ? v["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && v instanceof Symbol : !1;
    }
    function R(g) {
      var v = typeof g;
      return Array.isArray(g) ? "array" : g instanceof RegExp ? "object" : M(v, g) ? "symbol" : v;
    }
    function X(g) {
      if (typeof g > "u" || g === null)
        return "" + g;
      var v = R(g);
      if (v === "object") {
        if (g instanceof Date)
          return "date";
        if (g instanceof RegExp)
          return "regexp";
      }
      return v;
    }
    function B(g) {
      var v = X(g);
      switch (v) {
        case "array":
        case "object":
          return "an " + v;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + v;
        default:
          return v;
      }
    }
    function J(g) {
      return !g.constructor || !g.constructor.name ? d : g.constructor.name;
    }
    return b.checkPropTypes = o, b.resetWarningCache = o.resetWarningCache, b.PropTypes = b, b;
  }, zs;
}
var Rs, op;
function gO() {
  if (op) return Rs;
  op = 1;
  var e = /* @__PURE__ */ qu();
  function t() {
  }
  function r() {
  }
  return r.resetWarningCache = t, Rs = function() {
    function n(i, s, c, l, u, f) {
      if (f !== e) {
        var d = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw d.name = "Invariant Violation", d;
      }
    }
    n.isRequired = n;
    function o() {
      return n;
    }
    var a = {
      array: n,
      bigint: n,
      bool: n,
      func: n,
      number: n,
      object: n,
      string: n,
      symbol: n,
      any: n,
      arrayOf: o,
      element: n,
      elementType: n,
      instanceOf: o,
      node: n,
      objectOf: o,
      oneOf: o,
      oneOfType: o,
      shape: o,
      exact: o,
      checkPropTypes: r,
      resetWarningCache: t
    };
    return a.PropTypes = a, a;
  }, Rs;
}
var ap;
function hO() {
  if (ap) return za.exports;
  if (ap = 1, process.env.NODE_ENV !== "production") {
    var e = Nb(), t = !0;
    za.exports = /* @__PURE__ */ mO()(e.isElement, t);
  } else
    za.exports = /* @__PURE__ */ gO()();
  return za.exports;
}
var bO = /* @__PURE__ */ hO();
const ye = /* @__PURE__ */ cO(bO);
function ip(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function Pt(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? ip(Object(r), !0).forEach(function(n) {
      En(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : ip(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function bi(e) {
  "@babel/helpers - typeof";
  return bi = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, bi(e);
}
function En(e, t, r) {
  return t in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function yO(e, t) {
  if (e == null) return {};
  var r = {}, n = Object.keys(e), o, a;
  for (a = 0; a < n.length; a++)
    o = n[a], !(t.indexOf(o) >= 0) && (r[o] = e[o]);
  return r;
}
function vO(e, t) {
  if (e == null) return {};
  var r = yO(e, t), n, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      n = a[o], !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n]);
  }
  return r;
}
function nc(e) {
  return xO(e) || wO(e) || kO(e) || OO();
}
function xO(e) {
  if (Array.isArray(e)) return oc(e);
}
function wO(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function kO(e, t) {
  if (e) {
    if (typeof e == "string") return oc(e, t);
    var r = Object.prototype.toString.call(e).slice(8, -1);
    if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return oc(e, t);
  }
}
function oc(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
  return n;
}
function OO() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function EO(e) {
  var t, r = e.beat, n = e.fade, o = e.beatFade, a = e.bounce, i = e.shake, s = e.flash, c = e.spin, l = e.spinPulse, u = e.spinReverse, f = e.pulse, d = e.fixedWidth, b = e.inverse, y = e.border, p = e.listItem, m = e.flip, x = e.size, w = e.rotation, O = e.pull, E = (t = {
    "fa-beat": r,
    "fa-fade": n,
    "fa-beat-fade": o,
    "fa-bounce": a,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": u,
    "fa-spin-pulse": l,
    "fa-pulse": f,
    "fa-fw": d,
    "fa-inverse": b,
    "fa-border": y,
    "fa-li": p,
    "fa-flip": m === !0,
    "fa-flip-horizontal": m === "horizontal" || m === "both",
    "fa-flip-vertical": m === "vertical" || m === "both"
  }, En(t, "fa-".concat(x), typeof x < "u" && x !== null), En(t, "fa-rotate-".concat(w), typeof w < "u" && w !== null && w !== 0), En(t, "fa-pull-".concat(O), typeof O < "u" && O !== null), En(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(E).map(function(h) {
    return E[h] ? h : null;
  }).filter(function(h) {
    return h;
  });
}
function PO(e) {
  return e = e - 0, e === e;
}
function Tb(e) {
  return PO(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, r) {
    return r ? r.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var SO = ["style"];
function AO(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function CO(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, r) {
    var n = r.indexOf(":"), o = Tb(r.slice(0, n)), a = r.slice(n + 1).trim();
    return o.startsWith("webkit") ? t[AO(o)] = a : t[o] = a, t;
  }, {});
}
function jb(e, t) {
  var r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var n = (t.children || []).map(function(c) {
    return jb(e, c);
  }), o = Object.keys(t.attributes || {}).reduce(function(c, l) {
    var u = t.attributes[l];
    switch (l) {
      case "class":
        c.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = CO(u);
        break;
      default:
        l.indexOf("aria-") === 0 || l.indexOf("data-") === 0 ? c.attrs[l.toLowerCase()] = u : c.attrs[Tb(l)] = u;
    }
    return c;
  }, {
    attrs: {}
  }), a = r.style, i = a === void 0 ? {} : a, s = vO(r, SO);
  return o.attrs.style = Pt(Pt({}, o.attrs.style), i), e.apply(void 0, [t.tag, Pt(Pt({}, o.attrs), s)].concat(nc(n)));
}
var _b = !1;
try {
  _b = process.env.NODE_ENV === "production";
} catch {
}
function $O() {
  if (!_b && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function sp(e) {
  if (e && bi(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (rc.icon)
    return rc.icon(e);
  if (e === null)
    return null;
  if (e && bi(e) === "object" && e.prefix && e.iconName)
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
function Fs(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? En({}, e, t) : {};
}
var lp = {
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
}, ra = /* @__PURE__ */ Oe.forwardRef(function(e, t) {
  var r = Pt(Pt({}, lp), e), n = r.icon, o = r.mask, a = r.symbol, i = r.className, s = r.title, c = r.titleId, l = r.maskId, u = sp(n), f = Fs("classes", [].concat(nc(EO(r)), nc((i || "").split(" ")))), d = Fs("transform", typeof r.transform == "string" ? rc.transform(r.transform) : r.transform), b = Fs("mask", sp(o)), y = lO(u, Pt(Pt(Pt(Pt({}, f), d), b), {}, {
    symbol: a,
    title: s,
    titleId: c,
    maskId: l
  }));
  if (!y)
    return $O("Could not find icon", u), null;
  var p = y.abstract, m = {
    ref: t
  };
  return Object.keys(r).forEach(function(x) {
    lp.hasOwnProperty(x) || (m[x] = r[x]);
  }), NO(p[0], m);
});
ra.displayName = "FontAwesomeIcon";
ra.propTypes = {
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
var NO = jb.bind(null, Oe.createElement);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const IO = {
  prefix: "fas",
  iconName: "xmark",
  icon: [384, 512, [128473, 10005, 10006, 10060, 215, "close", "multiply", "remove", "times"], "f00d", "M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"]
};
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function TO(e, t, r) {
  return (t = _O(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function cp(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function Y(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? cp(Object(r), !0).forEach(function(n) {
      TO(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : cp(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function jO(e, t) {
  if (typeof e != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(e, t);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function _O(e) {
  var t = jO(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const up = () => {
};
let Hu = {}, Mb = {}, zb = null, Rb = {
  mark: up,
  measure: up
};
try {
  typeof window < "u" && (Hu = window), typeof document < "u" && (Mb = document), typeof MutationObserver < "u" && (zb = MutationObserver), typeof performance < "u" && (Rb = performance);
} catch {
}
const {
  userAgent: fp = ""
} = Hu.navigator || {}, Mr = Hu, Ve = Mb, dp = zb, Ra = Rb;
Mr.document;
const ar = !!Ve.documentElement && !!Ve.head && typeof Ve.addEventListener == "function" && typeof Ve.createElement == "function", Fb = ~fp.indexOf("MSIE") || ~fp.indexOf("Trident/");
var MO = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, zO = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Lb = {
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
}, RO = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Db = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Je = "classic", Ui = "duotone", FO = "sharp", LO = "sharp-duotone", Wb = [Je, Ui, FO, LO], DO = {
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
}, WO = {
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
}, UO = /* @__PURE__ */ new Map([["classic", {
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
}]]), YO = {
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
}, VO = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], pp = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, GO = ["kit"], qO = {
  kit: {
    "fa-kit": "fak"
  }
}, HO = ["fak", "fakd"], BO = {
  kit: {
    fak: "fa-kit"
  }
}, mp = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Fa = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, XO = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], KO = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], JO = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, QO = {
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
}, ZO = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, ac = {
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
}, eE = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], ic = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...XO, ...eE], tE = ["solid", "regular", "light", "thin", "duotone", "brands"], Ub = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], rE = Ub.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), nE = [...Object.keys(ZO), ...tE, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Fa.GROUP, Fa.SWAP_OPACITY, Fa.PRIMARY, Fa.SECONDARY].concat(Ub.map((e) => "".concat(e, "x"))).concat(rE.map((e) => "w-".concat(e))), oE = {
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
const Qt = "___FONT_AWESOME___", sc = 16, Yb = "fa", Vb = "svg-inline--fa", on = "data-fa-i2svg", lc = "data-fa-pseudo-element", aE = "data-fa-pseudo-element-pending", Bu = "data-prefix", Xu = "data-icon", gp = "fontawesome-i2svg", iE = "async", sE = ["HTML", "HEAD", "STYLE", "SCRIPT"], Gb = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function va(e) {
  return new Proxy(e, {
    get(t, r) {
      return r in t ? t[r] : t[Je];
    }
  });
}
const qb = Y({}, Lb);
qb[Je] = Y(Y(Y(Y({}, {
  "fa-duotone": "duotone"
}), Lb[Je]), pp.kit), pp["kit-duotone"]);
const lE = va(qb), cc = Y({}, YO);
cc[Je] = Y(Y(Y(Y({}, {
  duotone: "fad"
}), cc[Je]), mp.kit), mp["kit-duotone"]);
const hp = va(cc), uc = Y({}, ac);
uc[Je] = Y(Y({}, uc[Je]), BO.kit);
const Ku = va(uc), fc = Y({}, QO);
fc[Je] = Y(Y({}, fc[Je]), qO.kit);
va(fc);
const cE = MO, Hb = "fa-layers-text", uE = zO, fE = Y({}, DO);
va(fE);
const dE = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Ls = RO, pE = [...GO, ...nE], Wo = Mr.FontAwesomeConfig || {};
function mE(e) {
  var t = Ve.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function gE(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
Ve && typeof Ve.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, r] = e;
  const n = gE(mE(t));
  n != null && (Wo[r] = n);
});
const Bb = {
  styleDefault: "solid",
  familyDefault: Je,
  cssPrefix: Yb,
  replacementClass: Vb,
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
Wo.familyPrefix && (Wo.cssPrefix = Wo.familyPrefix);
const Hn = Y(Y({}, Bb), Wo);
Hn.autoReplaceSvg || (Hn.observeMutations = !1);
const re = {};
Object.keys(Bb).forEach((e) => {
  Object.defineProperty(re, e, {
    enumerable: !0,
    set: function(t) {
      Hn[e] = t, Uo.forEach((r) => r(re));
    },
    get: function() {
      return Hn[e];
    }
  });
});
Object.defineProperty(re, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    Hn.cssPrefix = e, Uo.forEach((t) => t(re));
  },
  get: function() {
    return Hn.cssPrefix;
  }
});
Mr.FontAwesomeConfig = re;
const Uo = [];
function hE(e) {
  return Uo.push(e), () => {
    Uo.splice(Uo.indexOf(e), 1);
  };
}
const fr = sc, Tt = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function bE(e) {
  if (!e || !ar)
    return;
  const t = Ve.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const r = Ve.head.childNodes;
  let n = null;
  for (let o = r.length - 1; o > -1; o--) {
    const a = r[o], i = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (n = a);
  }
  return Ve.head.insertBefore(t, n), e;
}
const yE = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function na() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += yE[Math.random() * 62 | 0];
  return t;
}
function ro(e) {
  const t = [];
  for (let r = (e || []).length >>> 0; r--; )
    t[r] = e[r];
  return t;
}
function Ju(e) {
  return e.classList ? ro(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function Xb(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function vE(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, '="').concat(Xb(e[r]), '" '), "").trim();
}
function Yi(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, ": ").concat(e[r].trim(), ";"), "");
}
function Qu(e) {
  return e.size !== Tt.size || e.x !== Tt.x || e.y !== Tt.y || e.rotate !== Tt.rotate || e.flipX || e.flipY;
}
function xE(e) {
  let {
    transform: t,
    containerWidth: r,
    iconWidth: n
  } = e;
  const o = {
    transform: "translate(".concat(r / 2, " 256)")
  }, a = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), c = {
    transform: "".concat(a, " ").concat(i, " ").concat(s)
  }, l = {
    transform: "translate(".concat(n / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: c,
    path: l
  };
}
function wE(e) {
  let {
    transform: t,
    width: r = sc,
    height: n = sc,
    startCentered: o = !1
  } = e, a = "";
  return o && Fb ? a += "translate(".concat(t.x / fr - r / 2, "em, ").concat(t.y / fr - n / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / fr, "em), calc(-50% + ").concat(t.y / fr, "em)) ") : a += "translate(".concat(t.x / fr, "em, ").concat(t.y / fr, "em) "), a += "scale(".concat(t.size / fr * (t.flipX ? -1 : 1), ", ").concat(t.size / fr * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var kE = `:root, :host {
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
function Kb() {
  const e = Yb, t = Vb, r = re.cssPrefix, n = re.replacementClass;
  let o = kE;
  if (r !== e || n !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(r, "-")).replace(i, "--".concat(r, "-")).replace(s, ".".concat(n));
  }
  return o;
}
let bp = !1;
function Ds() {
  re.autoAddCss && !bp && (bE(Kb()), bp = !0);
}
var OE = {
  mixout() {
    return {
      dom: {
        css: Kb,
        insertCss: Ds
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Ds();
      },
      beforeI2svg() {
        Ds();
      }
    };
  }
};
const Zt = Mr || {};
Zt[Qt] || (Zt[Qt] = {});
Zt[Qt].styles || (Zt[Qt].styles = {});
Zt[Qt].hooks || (Zt[Qt].hooks = {});
Zt[Qt].shims || (Zt[Qt].shims = []);
var jt = Zt[Qt];
const Jb = [], Qb = function() {
  Ve.removeEventListener("DOMContentLoaded", Qb), yi = 1, Jb.map((e) => e());
};
let yi = !1;
ar && (yi = (Ve.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(Ve.readyState), yi || Ve.addEventListener("DOMContentLoaded", Qb));
function EE(e) {
  ar && (yi ? setTimeout(e, 0) : Jb.push(e));
}
function xa(e) {
  const {
    tag: t,
    attributes: r = {},
    children: n = []
  } = e;
  return typeof e == "string" ? Xb(e) : "<".concat(t, " ").concat(vE(r), ">").concat(n.map(xa).join(""), "</").concat(t, ">");
}
function yp(e, t, r) {
  if (e && e[t] && e[t][r])
    return {
      prefix: t,
      iconName: r,
      icon: e[t][r]
    };
}
var Ws = function(e, t, r, n) {
  var o = Object.keys(e), a = o.length, i = t, s, c, l;
  for (r === void 0 ? (s = 1, l = e[o[0]]) : (s = 0, l = r); s < a; s++)
    c = o[s], l = i(l, e[c], c, e);
  return l;
};
function PE(e) {
  const t = [];
  let r = 0;
  const n = e.length;
  for (; r < n; ) {
    const o = e.charCodeAt(r++);
    if (o >= 55296 && o <= 56319 && r < n) {
      const a = e.charCodeAt(r++);
      (a & 64512) == 56320 ? t.push(((o & 1023) << 10) + (a & 1023) + 65536) : (t.push(o), r--);
    } else
      t.push(o);
  }
  return t;
}
function Zb(e) {
  const t = PE(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function SE(e, t) {
  const r = e.length;
  let n = e.charCodeAt(t), o;
  return n >= 55296 && n <= 56319 && r > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (n - 55296) * 1024 + o - 56320 + 65536 : n;
}
function vp(e) {
  return Object.keys(e).reduce((t, r) => {
    const n = e[r];
    return n.icon ? t[n.iconName] = n.icon : t[r] = n, t;
  }, {});
}
function dc(e, t) {
  let r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: n = !1
  } = r, o = vp(t);
  typeof jt.hooks.addPack == "function" && !n ? jt.hooks.addPack(e, vp(t)) : jt.styles[e] = Y(Y({}, jt.styles[e] || {}), o), e === "fas" && dc("fa", t);
}
const {
  styles: oa,
  shims: AE
} = jt, ey = Object.keys(Ku), CE = ey.reduce((e, t) => (e[t] = Object.keys(Ku[t]), e), {});
let Zu = null, ty = {}, ry = {}, ny = {}, oy = {}, ay = {};
function $E(e) {
  return ~pE.indexOf(e);
}
function NE(e, t) {
  const r = t.split("-"), n = r[0], o = r.slice(1).join("-");
  return n === e && o !== "" && !$E(o) ? o : null;
}
const iy = () => {
  const e = (n) => Ws(oa, (o, a, i) => (o[i] = Ws(a, n, {}), o), {});
  ty = e((n, o, a) => (o[3] && (n[o[3]] = a), o[2] && o[2].filter((i) => typeof i == "number").forEach((i) => {
    n[i.toString(16)] = a;
  }), n)), ry = e((n, o, a) => (n[a] = a, o[2] && o[2].filter((i) => typeof i == "string").forEach((i) => {
    n[i] = a;
  }), n)), ay = e((n, o, a) => {
    const i = o[2];
    return n[a] = a, i.forEach((s) => {
      n[s] = a;
    }), n;
  });
  const t = "far" in oa || re.autoFetchSvg, r = Ws(AE, (n, o) => {
    const a = o[0];
    let i = o[1];
    const s = o[2];
    return i === "far" && !t && (i = "fas"), typeof a == "string" && (n.names[a] = {
      prefix: i,
      iconName: s
    }), typeof a == "number" && (n.unicodes[a.toString(16)] = {
      prefix: i,
      iconName: s
    }), n;
  }, {
    names: {},
    unicodes: {}
  });
  ny = r.names, oy = r.unicodes, Zu = Vi(re.styleDefault, {
    family: re.familyDefault
  });
};
hE((e) => {
  Zu = Vi(e.styleDefault, {
    family: re.familyDefault
  });
});
iy();
function ef(e, t) {
  return (ty[e] || {})[t];
}
function IE(e, t) {
  return (ry[e] || {})[t];
}
function Xr(e, t) {
  return (ay[e] || {})[t];
}
function sy(e) {
  return ny[e] || {
    prefix: null,
    iconName: null
  };
}
function TE(e) {
  const t = oy[e], r = ef("fas", e);
  return t || (r ? {
    prefix: "fas",
    iconName: r
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function zr() {
  return Zu;
}
const ly = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function jE(e) {
  let t = Je;
  const r = ey.reduce((n, o) => (n[o] = "".concat(re.cssPrefix, "-").concat(o), n), {});
  return Wb.forEach((n) => {
    (e.includes(r[n]) || e.some((o) => CE[n].includes(o))) && (t = n);
  }), t;
}
function Vi(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: r = Je
  } = t, n = lE[r][e];
  if (r === Ui && !e)
    return "fad";
  const o = hp[r][e] || hp[r][n], a = e in jt.styles ? e : null;
  return o || a || null;
}
function _E(e) {
  let t = [], r = null;
  return e.forEach((n) => {
    const o = NE(re.cssPrefix, n);
    o ? r = o : n && t.push(n);
  }), {
    iconName: r,
    rest: t
  };
}
function xp(e) {
  return e.sort().filter((t, r, n) => n.indexOf(t) === r);
}
function Gi(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: r = !1
  } = t;
  let n = null;
  const o = ic.concat(KO), a = xp(e.filter((f) => o.includes(f))), i = xp(e.filter((f) => !ic.includes(f))), s = a.filter((f) => (n = f, !Db.includes(f))), [c = null] = s, l = jE(a), u = Y(Y({}, _E(i)), {}, {
    prefix: Vi(c, {
      family: l
    })
  });
  return Y(Y(Y({}, u), FE({
    values: e,
    family: l,
    styles: oa,
    config: re,
    canonical: u,
    givenPrefix: n
  })), ME(r, n, u));
}
function ME(e, t, r) {
  let {
    prefix: n,
    iconName: o
  } = r;
  if (e || !n || !o)
    return {
      prefix: n,
      iconName: o
    };
  const a = t === "fa" ? sy(o) : {}, i = Xr(n, o);
  return o = a.iconName || i || o, n = a.prefix || n, n === "far" && !oa.far && oa.fas && !re.autoFetchSvg && (n = "fas"), {
    prefix: n,
    iconName: o
  };
}
const zE = Wb.filter((e) => e !== Je || e !== Ui), RE = Object.keys(ac).filter((e) => e !== Je).map((e) => Object.keys(ac[e])).flat();
function FE(e) {
  const {
    values: t,
    family: r,
    canonical: n,
    givenPrefix: o = "",
    styles: a = {},
    config: i = {}
  } = e, s = r === Ui, c = t.includes("fa-duotone") || t.includes("fad"), l = i.familyDefault === "duotone", u = n.prefix === "fad" || n.prefix === "fa-duotone";
  if (!s && (c || l || u) && (n.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (n.prefix = "fab"), !n.prefix && zE.includes(r) && (Object.keys(a).find((f) => RE.includes(f)) || i.autoFetchSvg)) {
    const f = UO.get(r).defaultShortPrefixId;
    n.prefix = f, n.iconName = Xr(n.prefix, n.iconName) || n.iconName;
  }
  return (n.prefix === "fa" || o === "fa") && (n.prefix = zr() || "fas"), n;
}
class LE {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
      r[n] = arguments[n];
    const o = r.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = Y(Y({}, this.definitions[a] || {}), o[a]), dc(a, o[a]);
      const i = Ku[Je][a];
      i && dc(i, o[a]), iy();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, r) {
    const n = r.prefix && r.iconName && r.icon ? {
      0: r
    } : r;
    return Object.keys(n).map((o) => {
      const {
        prefix: a,
        iconName: i,
        icon: s
      } = n[o], c = s[2];
      t[a] || (t[a] = {}), c.length > 0 && c.forEach((l) => {
        typeof l == "string" && (t[a][l] = s);
      }), t[a][i] = s;
    }), t;
  }
}
let wp = [], Pn = {};
const zn = {}, DE = Object.keys(zn);
function WE(e, t) {
  let {
    mixoutsTo: r
  } = t;
  return wp = e, Pn = {}, Object.keys(zn).forEach((n) => {
    DE.indexOf(n) === -1 && delete zn[n];
  }), wp.forEach((n) => {
    const o = n.mixout ? n.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (r[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((i) => {
        r[a] || (r[a] = {}), r[a][i] = o[a][i];
      });
    }), n.hooks) {
      const a = n.hooks();
      Object.keys(a).forEach((i) => {
        Pn[i] || (Pn[i] = []), Pn[i].push(a[i]);
      });
    }
    n.provides && n.provides(zn);
  }), r;
}
function pc(e, t) {
  for (var r = arguments.length, n = new Array(r > 2 ? r - 2 : 0), o = 2; o < r; o++)
    n[o - 2] = arguments[o];
  return (Pn[e] || []).forEach((a) => {
    t = a.apply(null, [t, ...n]);
  }), t;
}
function an(e) {
  for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++)
    r[n - 1] = arguments[n];
  (Pn[e] || []).forEach((o) => {
    o.apply(null, r);
  });
}
function Rr() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return zn[e] ? zn[e].apply(null, t) : void 0;
}
function mc(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const r = e.prefix || zr();
  if (t)
    return t = Xr(r, t) || t, yp(cy.definitions, r, t) || yp(jt.styles, r, t);
}
const cy = new LE(), UE = () => {
  re.autoReplaceSvg = !1, re.observeMutations = !1, an("noAuto");
}, YE = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return ar ? (an("beforeI2svg", e), Rr("pseudoElements2svg", e), Rr("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    re.autoReplaceSvg === !1 && (re.autoReplaceSvg = !0), re.observeMutations = !0, EE(() => {
      GE({
        autoReplaceSvgRoot: t
      }), an("watch", e);
    });
  }
}, VE = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Xr(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], r = Vi(e[0]);
      return {
        prefix: r,
        iconName: Xr(r, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(re.cssPrefix, "-")) > -1 || e.match(cE))) {
      const t = Gi(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || zr(),
        iconName: Xr(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = zr();
      return {
        prefix: t,
        iconName: Xr(t, e) || e
      };
    }
  }
}, it = {
  noAuto: UE,
  config: re,
  dom: YE,
  parse: VE,
  library: cy,
  findIconDefinition: mc,
  toHtml: xa
}, GE = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = Ve
  } = e;
  (Object.keys(jt.styles).length > 0 || re.autoFetchSvg) && ar && re.autoReplaceSvg && it.dom.i2svg({
    node: t
  });
};
function qi(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((r) => xa(r));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!ar) return;
      const r = Ve.createElement("div");
      return r.innerHTML = e.html, r.children;
    }
  }), e;
}
function qE(e) {
  let {
    children: t,
    main: r,
    mask: n,
    attributes: o,
    styles: a,
    transform: i
  } = e;
  if (Qu(i) && r.found && !n.found) {
    const {
      width: s,
      height: c
    } = r, l = {
      x: s / c / 2,
      y: 0.5
    };
    o.style = Yi(Y(Y({}, a), {}, {
      "transform-origin": "".concat(l.x + i.x / 16, "em ").concat(l.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function HE(e) {
  let {
    prefix: t,
    iconName: r,
    children: n,
    attributes: o,
    symbol: a
  } = e;
  const i = a === !0 ? "".concat(t, "-").concat(re.cssPrefix, "-").concat(r) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: Y(Y({}, o), {}, {
        id: i
      }),
      children: n
    }]
  }];
}
function tf(e) {
  const {
    icons: {
      main: t,
      mask: r
    },
    prefix: n,
    iconName: o,
    transform: a,
    symbol: i,
    title: s,
    maskId: c,
    titleId: l,
    extra: u,
    watchable: f = !1
  } = e, {
    width: d,
    height: b
  } = r.found ? r : t, y = HO.includes(n), p = [re.replacementClass, o ? "".concat(re.cssPrefix, "-").concat(o) : ""].filter((h) => u.classes.indexOf(h) === -1).filter((h) => h !== "" || !!h).concat(u.classes).join(" ");
  let m = {
    children: [],
    attributes: Y(Y({}, u.attributes), {}, {
      "data-prefix": n,
      "data-icon": o,
      class: p,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(d, " ").concat(b)
    })
  };
  const x = y && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(d / b * 16 * 0.0625, "em")
  } : {};
  f && (m.attributes[on] = ""), s && (m.children.push({
    tag: "title",
    attributes: {
      id: m.attributes["aria-labelledby"] || "title-".concat(l || na())
    },
    children: [s]
  }), delete m.attributes.title);
  const w = Y(Y({}, m), {}, {
    prefix: n,
    iconName: o,
    main: t,
    mask: r,
    maskId: c,
    transform: a,
    symbol: i,
    styles: Y(Y({}, x), u.styles)
  }), {
    children: O,
    attributes: E
  } = r.found && t.found ? Rr("generateAbstractMask", w) || {
    children: [],
    attributes: {}
  } : Rr("generateAbstractIcon", w) || {
    children: [],
    attributes: {}
  };
  return w.children = O, w.attributes = E, i ? HE(w) : qE(w);
}
function kp(e) {
  const {
    content: t,
    width: r,
    height: n,
    transform: o,
    title: a,
    extra: i,
    watchable: s = !1
  } = e, c = Y(Y(Y({}, i.attributes), a ? {
    title: a
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[on] = "");
  const l = Y({}, i.styles);
  Qu(o) && (l.transform = wE({
    transform: o,
    startCentered: !0,
    width: r,
    height: n
  }), l["-webkit-transform"] = l.transform);
  const u = Yi(l);
  u.length > 0 && (c.style = u);
  const f = [];
  return f.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), a && f.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [a]
  }), f;
}
function BE(e) {
  const {
    content: t,
    title: r,
    extra: n
  } = e, o = Y(Y(Y({}, n.attributes), r ? {
    title: r
  } : {}), {}, {
    class: n.classes.join(" ")
  }), a = Yi(n.styles);
  a.length > 0 && (o.style = a);
  const i = [];
  return i.push({
    tag: "span",
    attributes: o,
    children: [t]
  }), r && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [r]
  }), i;
}
const {
  styles: Us
} = jt;
function gc(e) {
  const t = e[0], r = e[1], [n] = e.slice(4);
  let o = null;
  return Array.isArray(n) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(re.cssPrefix, "-").concat(Ls.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(re.cssPrefix, "-").concat(Ls.SECONDARY),
        fill: "currentColor",
        d: n[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(re.cssPrefix, "-").concat(Ls.PRIMARY),
        fill: "currentColor",
        d: n[1]
      }
    }]
  } : o = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: n
    }
  }, {
    found: !0,
    width: t,
    height: r,
    icon: o
  };
}
const XE = {
  found: !1,
  width: 512,
  height: 512
};
function KE(e, t) {
  !Gb && !re.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function hc(e, t) {
  let r = t;
  return t === "fa" && re.styleDefault !== null && (t = zr()), new Promise((n, o) => {
    if (r === "fa") {
      const a = sy(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && Us[t] && Us[t][e]) {
      const a = Us[t][e];
      return n(gc(a));
    }
    KE(e, t), n(Y(Y({}, XE), {}, {
      icon: re.showMissingIcons && e ? Rr("missingIconAbstract") || {} : {}
    }));
  });
}
const Op = () => {
}, bc = re.measurePerformance && Ra && Ra.mark && Ra.measure ? Ra : {
  mark: Op,
  measure: Op
}, To = 'FA "6.7.2"', JE = (e) => (bc.mark("".concat(To, " ").concat(e, " begins")), () => uy(e)), uy = (e) => {
  bc.mark("".concat(To, " ").concat(e, " ends")), bc.measure("".concat(To, " ").concat(e), "".concat(To, " ").concat(e, " begins"), "".concat(To, " ").concat(e, " ends"));
};
var rf = {
  begin: JE,
  end: uy
};
const ti = () => {
};
function Ep(e) {
  return typeof (e.getAttribute ? e.getAttribute(on) : null) == "string";
}
function QE(e) {
  const t = e.getAttribute ? e.getAttribute(Bu) : null, r = e.getAttribute ? e.getAttribute(Xu) : null;
  return t && r;
}
function ZE(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(re.replacementClass);
}
function e5() {
  return re.autoReplaceSvg === !0 ? ri.replace : ri[re.autoReplaceSvg] || ri.replace;
}
function t5(e) {
  return Ve.createElementNS("http://www.w3.org/2000/svg", e);
}
function r5(e) {
  return Ve.createElement(e);
}
function fy(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: r = e.tag === "svg" ? t5 : r5
  } = t;
  if (typeof e == "string")
    return Ve.createTextNode(e);
  const n = r(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    n.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    n.appendChild(fy(o, {
      ceFn: r
    }));
  }), n;
}
function n5(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const ri = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((r) => {
        t.parentNode.insertBefore(fy(r), t);
      }), t.getAttribute(on) === null && re.keepOriginalSource) {
        let r = Ve.createComment(n5(t));
        t.parentNode.replaceChild(r, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], r = e[1];
    if (~Ju(t).indexOf(re.replacementClass))
      return ri.replace(e);
    const n = new RegExp("".concat(re.cssPrefix, "-.*"));
    if (delete r[0].attributes.id, r[0].attributes.class) {
      const a = r[0].attributes.class.split(" ").reduce((i, s) => (s === re.replacementClass || s.match(n) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      r[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = r.map((a) => xa(a)).join(`
`);
    t.setAttribute(on, ""), t.innerHTML = o;
  }
};
function Pp(e) {
  e();
}
function dy(e, t) {
  const r = typeof t == "function" ? t : ti;
  if (e.length === 0)
    r();
  else {
    let n = Pp;
    re.mutateApproach === iE && (n = Mr.requestAnimationFrame || Pp), n(() => {
      const o = e5(), a = rf.begin("mutate");
      e.map(o), a(), r();
    });
  }
}
let nf = !1;
function py() {
  nf = !0;
}
function yc() {
  nf = !1;
}
let vi = null;
function Sp(e) {
  if (!dp || !re.observeMutations)
    return;
  const {
    treeCallback: t = ti,
    nodeCallback: r = ti,
    pseudoElementsCallback: n = ti,
    observeMutationsRoot: o = Ve
  } = e;
  vi = new dp((a) => {
    if (nf) return;
    const i = zr();
    ro(a).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Ep(s.addedNodes[0]) && (re.searchPseudoElements && n(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && re.searchPseudoElements && n(s.target.parentNode), s.type === "attributes" && Ep(s.target) && ~dE.indexOf(s.attributeName))
        if (s.attributeName === "class" && QE(s.target)) {
          const {
            prefix: c,
            iconName: l
          } = Gi(Ju(s.target));
          s.target.setAttribute(Bu, c || i), l && s.target.setAttribute(Xu, l);
        } else ZE(s.target) && r(s.target);
    });
  }), ar && vi.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function o5() {
  vi && vi.disconnect();
}
function a5(e) {
  const t = e.getAttribute("style");
  let r = [];
  return t && (r = t.split(";").reduce((n, o) => {
    const a = o.split(":"), i = a[0], s = a.slice(1);
    return i && s.length > 0 && (n[i] = s.join(":").trim()), n;
  }, {})), r;
}
function i5(e) {
  const t = e.getAttribute("data-prefix"), r = e.getAttribute("data-icon"), n = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = Gi(Ju(e));
  return o.prefix || (o.prefix = zr()), t && r && (o.prefix = t, o.iconName = r), o.iconName && o.prefix || (o.prefix && n.length > 0 && (o.iconName = IE(o.prefix, e.innerText) || ef(o.prefix, Zb(e.innerText))), !o.iconName && re.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function s5(e) {
  const t = ro(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), r = e.getAttribute("title"), n = e.getAttribute("data-fa-title-id");
  return re.autoA11y && (r ? t["aria-labelledby"] = "".concat(re.replacementClass, "-title-").concat(n || na()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function l5() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: Tt,
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
function Ap(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: r,
    prefix: n,
    rest: o
  } = i5(e), a = s5(e), i = pc("parseNodeAttributes", {}, e);
  let s = t.styleParser ? a5(e) : [];
  return Y({
    iconName: r,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: n,
    transform: Tt,
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
  styles: c5
} = jt;
function my(e) {
  const t = re.autoReplaceSvg === "nest" ? Ap(e, {
    styleParser: !1
  }) : Ap(e);
  return ~t.extra.classes.indexOf(Hb) ? Rr("generateLayersText", e, t) : Rr("generateSvgReplacementMutation", e, t);
}
function u5() {
  return [...VO, ...ic];
}
function Cp(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!ar) return Promise.resolve();
  const r = Ve.documentElement.classList, n = (u) => r.add("".concat(gp, "-").concat(u)), o = (u) => r.remove("".concat(gp, "-").concat(u)), a = re.autoFetchSvg ? u5() : Db.concat(Object.keys(c5));
  a.includes("fa") || a.push("fa");
  const i = [".".concat(Hb, ":not([").concat(on, "])")].concat(a.map((u) => ".".concat(u, ":not([").concat(on, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = ro(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    n("pending"), o("complete");
  else
    return Promise.resolve();
  const c = rf.begin("onTree"), l = s.reduce((u, f) => {
    try {
      const d = my(f);
      d && u.push(d);
    } catch (d) {
      Gb || d.name === "MissingIcon" && console.error(d);
    }
    return u;
  }, []);
  return new Promise((u, f) => {
    Promise.all(l).then((d) => {
      dy(d, () => {
        n("active"), n("complete"), o("pending"), typeof t == "function" && t(), c(), u();
      });
    }).catch((d) => {
      c(), f(d);
    });
  });
}
function f5(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  my(e).then((r) => {
    r && dy([r], t);
  });
}
function d5(e) {
  return function(t) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const n = (t || {}).icon ? t : mc(t || {});
    let {
      mask: o
    } = r;
    return o && (o = (o || {}).icon ? o : mc(o || {})), e(n, Y(Y({}, r), {}, {
      mask: o
    }));
  };
}
const p5 = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: r = Tt,
    symbol: n = !1,
    mask: o = null,
    maskId: a = null,
    title: i = null,
    titleId: s = null,
    classes: c = [],
    attributes: l = {},
    styles: u = {}
  } = t;
  if (!e) return;
  const {
    prefix: f,
    iconName: d,
    icon: b
  } = e;
  return qi(Y({
    type: "icon"
  }, e), () => (an("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), re.autoA11y && (i ? l["aria-labelledby"] = "".concat(re.replacementClass, "-title-").concat(s || na()) : (l["aria-hidden"] = "true", l.focusable = "false")), tf({
    icons: {
      main: gc(b),
      mask: o ? gc(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: f,
    iconName: d,
    transform: Y(Y({}, Tt), r),
    symbol: n,
    title: i,
    maskId: a,
    titleId: s,
    extra: {
      attributes: l,
      styles: u,
      classes: c
    }
  })));
};
var m5 = {
  mixout() {
    return {
      icon: d5(p5)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Cp, e.nodeCallback = f5, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: r = Ve,
        callback: n = () => {
        }
      } = t;
      return Cp(r, n);
    }, e.generateSvgReplacementMutation = function(t, r) {
      const {
        iconName: n,
        title: o,
        titleId: a,
        prefix: i,
        transform: s,
        symbol: c,
        mask: l,
        maskId: u,
        extra: f
      } = r;
      return new Promise((d, b) => {
        Promise.all([hc(n, i), l.iconName ? hc(l.iconName, l.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((y) => {
          let [p, m] = y;
          d([t, tf({
            icons: {
              main: p,
              mask: m
            },
            prefix: i,
            iconName: n,
            transform: s,
            symbol: c,
            maskId: u,
            title: o,
            titleId: a,
            extra: f,
            watchable: !0
          })]);
        }).catch(b);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: r,
        attributes: n,
        main: o,
        transform: a,
        styles: i
      } = t;
      const s = Yi(i);
      s.length > 0 && (n.style = s);
      let c;
      return Qu(a) && (c = Rr("generateAbstractTransformGrouping", {
        main: o,
        transform: a,
        containerWidth: o.width,
        iconWidth: o.width
      })), r.push(c || o.icon), {
        children: r,
        attributes: n
      };
    };
  }
}, g5 = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: r = []
        } = t;
        return qi({
          type: "layer"
        }, () => {
          an("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let n = [];
          return e((o) => {
            Array.isArray(o) ? o.map((a) => {
              n = n.concat(a.abstract);
            }) : n = n.concat(o.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(re.cssPrefix, "-layers"), ...r].join(" ")
            },
            children: n
          }];
        });
      }
    };
  }
}, h5 = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: r = null,
          classes: n = [],
          attributes: o = {},
          styles: a = {}
        } = t;
        return qi({
          type: "counter",
          content: e
        }, () => (an("beforeDOMElementCreation", {
          content: e,
          params: t
        }), BE({
          content: e.toString(),
          title: r,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(re.cssPrefix, "-layers-counter"), ...n]
          }
        })));
      }
    };
  }
}, b5 = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: r = Tt,
          title: n = null,
          classes: o = [],
          attributes: a = {},
          styles: i = {}
        } = t;
        return qi({
          type: "text",
          content: e
        }, () => (an("beforeDOMElementCreation", {
          content: e,
          params: t
        }), kp({
          content: e,
          transform: Y(Y({}, Tt), r),
          title: n,
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
    e.generateLayersText = function(t, r) {
      const {
        title: n,
        transform: o,
        extra: a
      } = r;
      let i = null, s = null;
      if (Fb) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), l = t.getBoundingClientRect();
        i = l.width / c, s = l.height / c;
      }
      return re.autoA11y && !n && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, kp({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: o,
        title: n,
        extra: a,
        watchable: !0
      })]);
    };
  }
};
const y5 = new RegExp('"', "ug"), $p = [1105920, 1112319], Np = Y(Y(Y(Y({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), WO), oE), JO), vc = Object.keys(Np).reduce((e, t) => (e[t.toLowerCase()] = Np[t], e), {}), v5 = Object.keys(vc).reduce((e, t) => {
  const r = vc[t];
  return e[t] = r[900] || [...Object.entries(r)][0][1], e;
}, {});
function x5(e) {
  const t = e.replace(y5, ""), r = SE(t, 0), n = r >= $p[0] && r <= $p[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: Zb(o ? t[0] : t),
    isSecondary: n || o
  };
}
function w5(e, t) {
  const r = e.replace(/^['"]|['"]$/g, "").toLowerCase(), n = parseInt(t), o = isNaN(n) ? "normal" : n;
  return (vc[r] || {})[o] || v5[r];
}
function Ip(e, t) {
  const r = "".concat(aE).concat(t.replace(":", "-"));
  return new Promise((n, o) => {
    if (e.getAttribute(r) !== null)
      return n();
    const a = ro(e.children).filter((f) => f.getAttribute(lc) === t)[0], i = Mr.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), c = s.match(uE), l = i.getPropertyValue("font-weight"), u = i.getPropertyValue("content");
    if (a && !c)
      return e.removeChild(a), n();
    if (c && u !== "none" && u !== "") {
      const f = i.getPropertyValue("content");
      let d = w5(s, l);
      const {
        value: b,
        isSecondary: y
      } = x5(f), p = c[0].startsWith("FontAwesome");
      let m = ef(d, b), x = m;
      if (p) {
        const w = TE(b);
        w.iconName && w.prefix && (m = w.iconName, d = w.prefix);
      }
      if (m && !y && (!a || a.getAttribute(Bu) !== d || a.getAttribute(Xu) !== x)) {
        e.setAttribute(r, x), a && e.removeChild(a);
        const w = l5(), {
          extra: O
        } = w;
        O.attributes[lc] = t, hc(m, d).then((E) => {
          const h = tf(Y(Y({}, w), {}, {
            icons: {
              main: E,
              mask: ly()
            },
            prefix: d,
            iconName: x,
            extra: O,
            watchable: !0
          })), W = Ve.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(W, e.firstChild) : e.appendChild(W), W.outerHTML = h.map((F) => xa(F)).join(`
`), e.removeAttribute(r), n();
        }).catch(o);
      } else
        n();
    } else
      n();
  });
}
function k5(e) {
  return Promise.all([Ip(e, "::before"), Ip(e, "::after")]);
}
function O5(e) {
  return e.parentNode !== document.head && !~sE.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(lc) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Tp(e) {
  if (ar)
    return new Promise((t, r) => {
      const n = ro(e.querySelectorAll("*")).filter(O5).map(k5), o = rf.begin("searchPseudoElements");
      py(), Promise.all(n).then(() => {
        o(), yc(), t();
      }).catch(() => {
        o(), yc(), r();
      });
    });
}
var E5 = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Tp, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: r = Ve
      } = t;
      re.searchPseudoElements && Tp(r);
    };
  }
};
let jp = !1;
var P5 = {
  mixout() {
    return {
      dom: {
        unwatch() {
          py(), jp = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Sp(pc("mutationObserverCallbacks", {}));
      },
      noAuto() {
        o5();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        jp ? yc() : Sp(pc("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const _p = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((r, n) => {
    const o = n.toLowerCase().split("-"), a = o[0];
    let i = o.slice(1).join("-");
    if (a && i === "h")
      return r.flipX = !0, r;
    if (a && i === "v")
      return r.flipY = !0, r;
    if (i = parseFloat(i), isNaN(i))
      return r;
    switch (a) {
      case "grow":
        r.size = r.size + i;
        break;
      case "shrink":
        r.size = r.size - i;
        break;
      case "left":
        r.x = r.x - i;
        break;
      case "right":
        r.x = r.x + i;
        break;
      case "up":
        r.y = r.y - i;
        break;
      case "down":
        r.y = r.y + i;
        break;
      case "rotate":
        r.rotate = r.rotate + i;
        break;
    }
    return r;
  }, t);
};
var S5 = {
  mixout() {
    return {
      parse: {
        transform: (e) => _p(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-transform");
        return r && (e.transform = _p(r)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: r,
        transform: n,
        containerWidth: o,
        iconWidth: a
      } = t;
      const i = {
        transform: "translate(".concat(o / 2, " 256)")
      }, s = "translate(".concat(n.x * 32, ", ").concat(n.y * 32, ") "), c = "scale(".concat(n.size / 16 * (n.flipX ? -1 : 1), ", ").concat(n.size / 16 * (n.flipY ? -1 : 1), ") "), l = "rotate(".concat(n.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(c, " ").concat(l)
      }, f = {
        transform: "translate(".concat(a / 2 * -1, " -256)")
      }, d = {
        outer: i,
        inner: u,
        path: f
      };
      return {
        tag: "g",
        attributes: Y({}, d.outer),
        children: [{
          tag: "g",
          attributes: Y({}, d.inner),
          children: [{
            tag: r.icon.tag,
            children: r.icon.children,
            attributes: Y(Y({}, r.icon.attributes), d.path)
          }]
        }]
      };
    };
  }
};
const Ys = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Mp(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function A5(e) {
  return e.tag === "g" ? e.children : [e];
}
var C5 = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-mask"), n = r ? Gi(r.split(" ").map((o) => o.trim())) : ly();
        return n.prefix || (n.prefix = zr()), e.mask = n, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: r,
        attributes: n,
        main: o,
        mask: a,
        maskId: i,
        transform: s
      } = t;
      const {
        width: c,
        icon: l
      } = o, {
        width: u,
        icon: f
      } = a, d = xE({
        transform: s,
        containerWidth: u,
        iconWidth: c
      }), b = {
        tag: "rect",
        attributes: Y(Y({}, Ys), {}, {
          fill: "white"
        })
      }, y = l.children ? {
        children: l.children.map(Mp)
      } : {}, p = {
        tag: "g",
        attributes: Y({}, d.inner),
        children: [Mp(Y({
          tag: l.tag,
          attributes: Y(Y({}, l.attributes), d.path)
        }, y))]
      }, m = {
        tag: "g",
        attributes: Y({}, d.outer),
        children: [p]
      }, x = "mask-".concat(i || na()), w = "clip-".concat(i || na()), O = {
        tag: "mask",
        attributes: Y(Y({}, Ys), {}, {
          id: x,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [b, m]
      }, E = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: w
          },
          children: A5(f)
        }, O]
      };
      return r.push(E, {
        tag: "rect",
        attributes: Y({
          fill: "currentColor",
          "clip-path": "url(#".concat(w, ")"),
          mask: "url(#".concat(x, ")")
        }, Ys)
      }), {
        children: r,
        attributes: n
      };
    };
  }
}, $5 = {
  provides(e) {
    let t = !1;
    Mr.matchMedia && (t = Mr.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const r = [], n = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      r.push({
        tag: "path",
        attributes: Y(Y({}, n), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = Y(Y({}, o), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: Y(Y({}, n), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: Y(Y({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: Y(Y({}, a), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), r.push(i), r.push({
        tag: "path",
        attributes: Y(Y({}, n), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: Y(Y({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || r.push({
        tag: "path",
        attributes: Y(Y({}, n), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: Y(Y({}, a), {}, {
            values: "0;0;1;1;0;0;"
          })
        }]
      }), {
        tag: "g",
        attributes: {
          class: "missing"
        },
        children: r
      };
    };
  }
}, N5 = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-symbol"), n = r === null ? !1 : r === "" ? !0 : r;
        return e.symbol = n, e;
      }
    };
  }
}, I5 = [OE, m5, g5, h5, b5, E5, P5, S5, C5, $5, N5];
WE(I5, {
  mixoutsTo: it
});
it.noAuto;
it.config;
it.library;
it.dom;
const xc = it.parse;
it.findIconDefinition;
it.toHtml;
const T5 = it.icon;
it.layer;
it.text;
it.counter;
function j5(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var La = { exports: {} }, Vs = { exports: {} }, Se = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var zp;
function _5() {
  if (zp) return Se;
  zp = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, y = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, x = e ? Symbol.for("react.responder") : 60118, w = e ? Symbol.for("react.scope") : 60119;
  function O(h) {
    if (typeof h == "object" && h !== null) {
      var W = h.$$typeof;
      switch (W) {
        case t:
          switch (h = h.type, h) {
            case c:
            case l:
            case n:
            case a:
            case o:
            case f:
              return h;
            default:
              switch (h = h && h.$$typeof, h) {
                case s:
                case u:
                case y:
                case b:
                case i:
                  return h;
                default:
                  return W;
              }
          }
        case r:
          return W;
      }
    }
  }
  function E(h) {
    return O(h) === l;
  }
  return Se.AsyncMode = c, Se.ConcurrentMode = l, Se.ContextConsumer = s, Se.ContextProvider = i, Se.Element = t, Se.ForwardRef = u, Se.Fragment = n, Se.Lazy = y, Se.Memo = b, Se.Portal = r, Se.Profiler = a, Se.StrictMode = o, Se.Suspense = f, Se.isAsyncMode = function(h) {
    return E(h) || O(h) === c;
  }, Se.isConcurrentMode = E, Se.isContextConsumer = function(h) {
    return O(h) === s;
  }, Se.isContextProvider = function(h) {
    return O(h) === i;
  }, Se.isElement = function(h) {
    return typeof h == "object" && h !== null && h.$$typeof === t;
  }, Se.isForwardRef = function(h) {
    return O(h) === u;
  }, Se.isFragment = function(h) {
    return O(h) === n;
  }, Se.isLazy = function(h) {
    return O(h) === y;
  }, Se.isMemo = function(h) {
    return O(h) === b;
  }, Se.isPortal = function(h) {
    return O(h) === r;
  }, Se.isProfiler = function(h) {
    return O(h) === a;
  }, Se.isStrictMode = function(h) {
    return O(h) === o;
  }, Se.isSuspense = function(h) {
    return O(h) === f;
  }, Se.isValidElementType = function(h) {
    return typeof h == "string" || typeof h == "function" || h === n || h === l || h === a || h === o || h === f || h === d || typeof h == "object" && h !== null && (h.$$typeof === y || h.$$typeof === b || h.$$typeof === i || h.$$typeof === s || h.$$typeof === u || h.$$typeof === m || h.$$typeof === x || h.$$typeof === w || h.$$typeof === p);
  }, Se.typeOf = O, Se;
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
var Rp;
function M5() {
  return Rp || (Rp = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, y = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, x = e ? Symbol.for("react.responder") : 60118, w = e ? Symbol.for("react.scope") : 60119;
    function O(k) {
      return typeof k == "string" || typeof k == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      k === n || k === l || k === a || k === o || k === f || k === d || typeof k == "object" && k !== null && (k.$$typeof === y || k.$$typeof === b || k.$$typeof === i || k.$$typeof === s || k.$$typeof === u || k.$$typeof === m || k.$$typeof === x || k.$$typeof === w || k.$$typeof === p);
    }
    function E(k) {
      if (typeof k == "object" && k !== null) {
        var ue = k.$$typeof;
        switch (ue) {
          case t:
            var _e = k.type;
            switch (_e) {
              case c:
              case l:
              case n:
              case a:
              case o:
              case f:
                return _e;
              default:
                var et = _e && _e.$$typeof;
                switch (et) {
                  case s:
                  case u:
                  case y:
                  case b:
                  case i:
                    return et;
                  default:
                    return ue;
                }
            }
          case r:
            return ue;
        }
      }
    }
    var h = c, W = l, F = s, Z = i, K = t, H = u, Q = n, P = y, ae = b, D = r, M = a, R = o, X = f, B = !1;
    function J(k) {
      return B || (B = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), g(k) || E(k) === c;
    }
    function g(k) {
      return E(k) === l;
    }
    function v(k) {
      return E(k) === s;
    }
    function C(k) {
      return E(k) === i;
    }
    function A(k) {
      return typeof k == "object" && k !== null && k.$$typeof === t;
    }
    function S(k) {
      return E(k) === u;
    }
    function I(k) {
      return E(k) === n;
    }
    function N(k) {
      return E(k) === y;
    }
    function $(k) {
      return E(k) === b;
    }
    function _(k) {
      return E(k) === r;
    }
    function j(k) {
      return E(k) === a;
    }
    function z(k) {
      return E(k) === o;
    }
    function ee(k) {
      return E(k) === f;
    }
    Te.AsyncMode = h, Te.ConcurrentMode = W, Te.ContextConsumer = F, Te.ContextProvider = Z, Te.Element = K, Te.ForwardRef = H, Te.Fragment = Q, Te.Lazy = P, Te.Memo = ae, Te.Portal = D, Te.Profiler = M, Te.StrictMode = R, Te.Suspense = X, Te.isAsyncMode = J, Te.isConcurrentMode = g, Te.isContextConsumer = v, Te.isContextProvider = C, Te.isElement = A, Te.isForwardRef = S, Te.isFragment = I, Te.isLazy = N, Te.isMemo = $, Te.isPortal = _, Te.isProfiler = j, Te.isStrictMode = z, Te.isSuspense = ee, Te.isValidElementType = O, Te.typeOf = E;
  }()), Te;
}
var Fp;
function gy() {
  return Fp || (Fp = 1, process.env.NODE_ENV === "production" ? Vs.exports = _5() : Vs.exports = M5()), Vs.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Gs, Lp;
function z5() {
  if (Lp) return Gs;
  Lp = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, r = Object.prototype.propertyIsEnumerable;
  function n(a) {
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
      var c = Object.getOwnPropertyNames(i).map(function(u) {
        return i[u];
      });
      if (c.join("") !== "0123456789")
        return !1;
      var l = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(u) {
        l[u] = u;
      }), Object.keys(Object.assign({}, l)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Gs = o() ? Object.assign : function(a, i) {
    for (var s, c = n(a), l, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var f in s)
        t.call(s, f) && (c[f] = s[f]);
      if (e) {
        l = e(s);
        for (var d = 0; d < l.length; d++)
          r.call(s, l[d]) && (c[l[d]] = s[l[d]]);
      }
    }
    return c;
  }, Gs;
}
var qs, Dp;
function of() {
  if (Dp) return qs;
  Dp = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return qs = e, qs;
}
var Wp, Up;
function hy() {
  return Up || (Up = 1, Wp = Function.call.bind(Object.prototype.hasOwnProperty)), Wp;
}
var Hs, Yp;
function R5() {
  if (Yp) return Hs;
  Yp = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ of(), r = {}, n = /* @__PURE__ */ hy();
    e = function(a) {
      var i = "Warning: " + a;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function o(a, i, s, c, l) {
    if (process.env.NODE_ENV !== "production") {
      for (var u in a)
        if (n(a, u)) {
          var f;
          try {
            if (typeof a[u] != "function") {
              var d = Error(
                (c || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw d.name = "Invariant Violation", d;
            }
            f = a[u](i, u, c, s, null, t);
          } catch (y) {
            f = y;
          }
          if (f && !(f instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof f + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), f instanceof Error && !(f.message in r)) {
            r[f.message] = !0;
            var b = l ? l() : "";
            e(
              "Failed " + s + " type: " + f.message + (b ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (r = {});
  }, Hs = o, Hs;
}
var Bs, Vp;
function F5() {
  if (Vp) return Bs;
  Vp = 1;
  var e = gy(), t = z5(), r = /* @__PURE__ */ of(), n = /* @__PURE__ */ hy(), o = /* @__PURE__ */ R5(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(s) {
    var c = "Warning: " + s;
    typeof console < "u" && console.error(c);
    try {
      throw new Error(c);
    } catch {
    }
  });
  function i() {
    return null;
  }
  return Bs = function(s, c) {
    var l = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function f(g) {
      var v = g && (l && g[l] || g[u]);
      if (typeof v == "function")
        return v;
    }
    var d = "<<anonymous>>", b = {
      array: x("array"),
      bigint: x("bigint"),
      bool: x("boolean"),
      func: x("function"),
      number: x("number"),
      object: x("object"),
      string: x("string"),
      symbol: x("symbol"),
      any: w(),
      arrayOf: O,
      element: E(),
      elementType: h(),
      instanceOf: W,
      node: H(),
      objectOf: Z,
      oneOf: F,
      oneOfType: K,
      shape: P,
      exact: ae
    };
    function y(g, v) {
      return g === v ? g !== 0 || 1 / g === 1 / v : g !== g && v !== v;
    }
    function p(g, v) {
      this.message = g, this.data = v && typeof v == "object" ? v : {}, this.stack = "";
    }
    p.prototype = Error.prototype;
    function m(g) {
      if (process.env.NODE_ENV !== "production")
        var v = {}, C = 0;
      function A(I, N, $, _, j, z, ee) {
        if (_ = _ || d, z = z || $, ee !== r) {
          if (c) {
            var k = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw k.name = "Invariant Violation", k;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ue = _ + ":" + $;
            !v[ue] && // Avoid spamming the console because they are often not actionable except for lib authors
            C < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + z + "` prop on `" + _ + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), v[ue] = !0, C++);
          }
        }
        return N[$] == null ? I ? N[$] === null ? new p("The " + j + " `" + z + "` is marked as required " + ("in `" + _ + "`, but its value is `null`.")) : new p("The " + j + " `" + z + "` is marked as required in " + ("`" + _ + "`, but its value is `undefined`.")) : null : g(N, $, _, j, z);
      }
      var S = A.bind(null, !1);
      return S.isRequired = A.bind(null, !0), S;
    }
    function x(g) {
      function v(C, A, S, I, N, $) {
        var _ = C[A], j = R(_);
        if (j !== g) {
          var z = X(_);
          return new p(
            "Invalid " + I + " `" + N + "` of type " + ("`" + z + "` supplied to `" + S + "`, expected ") + ("`" + g + "`."),
            { expectedType: g }
          );
        }
        return null;
      }
      return m(v);
    }
    function w() {
      return m(i);
    }
    function O(g) {
      function v(C, A, S, I, N) {
        if (typeof g != "function")
          return new p("Property `" + N + "` of component `" + S + "` has invalid PropType notation inside arrayOf.");
        var $ = C[A];
        if (!Array.isArray($)) {
          var _ = R($);
          return new p("Invalid " + I + " `" + N + "` of type " + ("`" + _ + "` supplied to `" + S + "`, expected an array."));
        }
        for (var j = 0; j < $.length; j++) {
          var z = g($, j, S, I, N + "[" + j + "]", r);
          if (z instanceof Error)
            return z;
        }
        return null;
      }
      return m(v);
    }
    function E() {
      function g(v, C, A, S, I) {
        var N = v[C];
        if (!s(N)) {
          var $ = R(N);
          return new p("Invalid " + S + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return m(g);
    }
    function h() {
      function g(v, C, A, S, I) {
        var N = v[C];
        if (!e.isValidElementType(N)) {
          var $ = R(N);
          return new p("Invalid " + S + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return m(g);
    }
    function W(g) {
      function v(C, A, S, I, N) {
        if (!(C[A] instanceof g)) {
          var $ = g.name || d, _ = J(C[A]);
          return new p("Invalid " + I + " `" + N + "` of type " + ("`" + _ + "` supplied to `" + S + "`, expected ") + ("instance of `" + $ + "`."));
        }
        return null;
      }
      return m(v);
    }
    function F(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), i;
      function v(C, A, S, I, N) {
        for (var $ = C[A], _ = 0; _ < g.length; _++)
          if (y($, g[_]))
            return null;
        var j = JSON.stringify(g, function(z, ee) {
          var k = X(ee);
          return k === "symbol" ? String(ee) : ee;
        });
        return new p("Invalid " + I + " `" + N + "` of value `" + String($) + "` " + ("supplied to `" + S + "`, expected one of " + j + "."));
      }
      return m(v);
    }
    function Z(g) {
      function v(C, A, S, I, N) {
        if (typeof g != "function")
          return new p("Property `" + N + "` of component `" + S + "` has invalid PropType notation inside objectOf.");
        var $ = C[A], _ = R($);
        if (_ !== "object")
          return new p("Invalid " + I + " `" + N + "` of type " + ("`" + _ + "` supplied to `" + S + "`, expected an object."));
        for (var j in $)
          if (n($, j)) {
            var z = g($, j, S, I, N + "." + j, r);
            if (z instanceof Error)
              return z;
          }
        return null;
      }
      return m(v);
    }
    function K(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var v = 0; v < g.length; v++) {
        var C = g[v];
        if (typeof C != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + B(C) + " at index " + v + "."
          ), i;
      }
      function A(S, I, N, $, _) {
        for (var j = [], z = 0; z < g.length; z++) {
          var ee = g[z], k = ee(S, I, N, $, _, r);
          if (k == null)
            return null;
          k.data && n(k.data, "expectedType") && j.push(k.data.expectedType);
        }
        var ue = j.length > 0 ? ", expected one of type [" + j.join(", ") + "]" : "";
        return new p("Invalid " + $ + " `" + _ + "` supplied to " + ("`" + N + "`" + ue + "."));
      }
      return m(A);
    }
    function H() {
      function g(v, C, A, S, I) {
        return D(v[C]) ? null : new p("Invalid " + S + " `" + I + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return m(g);
    }
    function Q(g, v, C, A, S) {
      return new p(
        (g || "React class") + ": " + v + " type `" + C + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + S + "`."
      );
    }
    function P(g) {
      function v(C, A, S, I, N) {
        var $ = C[A], _ = R($);
        if (_ !== "object")
          return new p("Invalid " + I + " `" + N + "` of type `" + _ + "` " + ("supplied to `" + S + "`, expected `object`."));
        for (var j in g) {
          var z = g[j];
          if (typeof z != "function")
            return Q(S, I, N, j, X(z));
          var ee = z($, j, S, I, N + "." + j, r);
          if (ee)
            return ee;
        }
        return null;
      }
      return m(v);
    }
    function ae(g) {
      function v(C, A, S, I, N) {
        var $ = C[A], _ = R($);
        if (_ !== "object")
          return new p("Invalid " + I + " `" + N + "` of type `" + _ + "` " + ("supplied to `" + S + "`, expected `object`."));
        var j = t({}, C[A], g);
        for (var z in j) {
          var ee = g[z];
          if (n(g, z) && typeof ee != "function")
            return Q(S, I, N, z, X(ee));
          if (!ee)
            return new p(
              "Invalid " + I + " `" + N + "` key `" + z + "` supplied to `" + S + "`.\nBad object: " + JSON.stringify(C[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(g), null, "  ")
            );
          var k = ee($, z, S, I, N + "." + z, r);
          if (k)
            return k;
        }
        return null;
      }
      return m(v);
    }
    function D(g) {
      switch (typeof g) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !g;
        case "object":
          if (Array.isArray(g))
            return g.every(D);
          if (g === null || s(g))
            return !0;
          var v = f(g);
          if (v) {
            var C = v.call(g), A;
            if (v !== g.entries) {
              for (; !(A = C.next()).done; )
                if (!D(A.value))
                  return !1;
            } else
              for (; !(A = C.next()).done; ) {
                var S = A.value;
                if (S && !D(S[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function M(g, v) {
      return g === "symbol" ? !0 : v ? v["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && v instanceof Symbol : !1;
    }
    function R(g) {
      var v = typeof g;
      return Array.isArray(g) ? "array" : g instanceof RegExp ? "object" : M(v, g) ? "symbol" : v;
    }
    function X(g) {
      if (typeof g > "u" || g === null)
        return "" + g;
      var v = R(g);
      if (v === "object") {
        if (g instanceof Date)
          return "date";
        if (g instanceof RegExp)
          return "regexp";
      }
      return v;
    }
    function B(g) {
      var v = X(g);
      switch (v) {
        case "array":
        case "object":
          return "an " + v;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + v;
        default:
          return v;
      }
    }
    function J(g) {
      return !g.constructor || !g.constructor.name ? d : g.constructor.name;
    }
    return b.checkPropTypes = o, b.resetWarningCache = o.resetWarningCache, b.PropTypes = b, b;
  }, Bs;
}
var Xs, Gp;
function L5() {
  if (Gp) return Xs;
  Gp = 1;
  var e = /* @__PURE__ */ of();
  function t() {
  }
  function r() {
  }
  return r.resetWarningCache = t, Xs = function() {
    function n(i, s, c, l, u, f) {
      if (f !== e) {
        var d = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw d.name = "Invariant Violation", d;
      }
    }
    n.isRequired = n;
    function o() {
      return n;
    }
    var a = {
      array: n,
      bigint: n,
      bool: n,
      func: n,
      number: n,
      object: n,
      string: n,
      symbol: n,
      any: n,
      arrayOf: o,
      element: n,
      elementType: n,
      instanceOf: o,
      node: n,
      objectOf: o,
      oneOf: o,
      oneOfType: o,
      shape: o,
      exact: o,
      checkPropTypes: r,
      resetWarningCache: t
    };
    return a.PropTypes = a, a;
  }, Xs;
}
var qp;
function D5() {
  if (qp) return La.exports;
  if (qp = 1, process.env.NODE_ENV !== "production") {
    var e = gy(), t = !0;
    La.exports = /* @__PURE__ */ F5()(e.isElement, t);
  } else
    La.exports = /* @__PURE__ */ L5()();
  return La.exports;
}
var W5 = /* @__PURE__ */ D5();
const ve = /* @__PURE__ */ j5(W5);
function Hp(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function St(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Hp(Object(r), !0).forEach(function(n) {
      Sn(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : Hp(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function xi(e) {
  "@babel/helpers - typeof";
  return xi = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, xi(e);
}
function Sn(e, t, r) {
  return t in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function U5(e, t) {
  if (e == null) return {};
  var r = {}, n = Object.keys(e), o, a;
  for (a = 0; a < n.length; a++)
    o = n[a], !(t.indexOf(o) >= 0) && (r[o] = e[o]);
  return r;
}
function Y5(e, t) {
  if (e == null) return {};
  var r = U5(e, t), n, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      n = a[o], !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n]);
  }
  return r;
}
function wc(e) {
  return V5(e) || G5(e) || q5(e) || H5();
}
function V5(e) {
  if (Array.isArray(e)) return kc(e);
}
function G5(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function q5(e, t) {
  if (e) {
    if (typeof e == "string") return kc(e, t);
    var r = Object.prototype.toString.call(e).slice(8, -1);
    if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return kc(e, t);
  }
}
function kc(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
  return n;
}
function H5() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function B5(e) {
  var t, r = e.beat, n = e.fade, o = e.beatFade, a = e.bounce, i = e.shake, s = e.flash, c = e.spin, l = e.spinPulse, u = e.spinReverse, f = e.pulse, d = e.fixedWidth, b = e.inverse, y = e.border, p = e.listItem, m = e.flip, x = e.size, w = e.rotation, O = e.pull, E = (t = {
    "fa-beat": r,
    "fa-fade": n,
    "fa-beat-fade": o,
    "fa-bounce": a,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": u,
    "fa-spin-pulse": l,
    "fa-pulse": f,
    "fa-fw": d,
    "fa-inverse": b,
    "fa-border": y,
    "fa-li": p,
    "fa-flip": m === !0,
    "fa-flip-horizontal": m === "horizontal" || m === "both",
    "fa-flip-vertical": m === "vertical" || m === "both"
  }, Sn(t, "fa-".concat(x), typeof x < "u" && x !== null), Sn(t, "fa-rotate-".concat(w), typeof w < "u" && w !== null && w !== 0), Sn(t, "fa-pull-".concat(O), typeof O < "u" && O !== null), Sn(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(E).map(function(h) {
    return E[h] ? h : null;
  }).filter(function(h) {
    return h;
  });
}
function X5(e) {
  return e = e - 0, e === e;
}
function by(e) {
  return X5(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, r) {
    return r ? r.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var K5 = ["style"];
function J5(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function Q5(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, r) {
    var n = r.indexOf(":"), o = by(r.slice(0, n)), a = r.slice(n + 1).trim();
    return o.startsWith("webkit") ? t[J5(o)] = a : t[o] = a, t;
  }, {});
}
function yy(e, t) {
  var r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var n = (t.children || []).map(function(c) {
    return yy(e, c);
  }), o = Object.keys(t.attributes || {}).reduce(function(c, l) {
    var u = t.attributes[l];
    switch (l) {
      case "class":
        c.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = Q5(u);
        break;
      default:
        l.indexOf("aria-") === 0 || l.indexOf("data-") === 0 ? c.attrs[l.toLowerCase()] = u : c.attrs[by(l)] = u;
    }
    return c;
  }, {
    attrs: {}
  }), a = r.style, i = a === void 0 ? {} : a, s = Y5(r, K5);
  return o.attrs.style = St(St({}, o.attrs.style), i), e.apply(void 0, [t.tag, St(St({}, o.attrs), s)].concat(wc(n)));
}
var vy = !1;
try {
  vy = process.env.NODE_ENV === "production";
} catch {
}
function Z5() {
  if (!vy && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Bp(e) {
  if (e && xi(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (xc.icon)
    return xc.icon(e);
  if (e === null)
    return null;
  if (e && xi(e) === "object" && e.prefix && e.iconName)
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
function Ks(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Sn({}, e, t) : {};
}
var Xp = {
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
}, af = /* @__PURE__ */ Oe.forwardRef(function(e, t) {
  var r = St(St({}, Xp), e), n = r.icon, o = r.mask, a = r.symbol, i = r.className, s = r.title, c = r.titleId, l = r.maskId, u = Bp(n), f = Ks("classes", [].concat(wc(B5(r)), wc((i || "").split(" ")))), d = Ks("transform", typeof r.transform == "string" ? xc.transform(r.transform) : r.transform), b = Ks("mask", Bp(o)), y = T5(u, St(St(St(St({}, f), d), b), {}, {
    symbol: a,
    title: s,
    titleId: c,
    maskId: l
  }));
  if (!y)
    return Z5("Could not find icon", u), null;
  var p = y.abstract, m = {
    ref: t
  };
  return Object.keys(r).forEach(function(x) {
    Xp.hasOwnProperty(x) || (m[x] = r[x]);
  }), eP(p[0], m);
});
af.displayName = "FontAwesomeIcon";
af.propTypes = {
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
var eP = yy.bind(null, Oe.createElement);
const sf = "-", tP = (e) => {
  const t = nP(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(sf);
      return a[0] === "" && a.length !== 1 && a.shift(), xy(a, t) || rP(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const i = r[o] || [];
      return a && n[o] ? [...i, ...n[o]] : i;
    }
  };
}, xy = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], o = t.nextPart.get(n), a = o ? xy(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const i = e.join(sf);
  return (r = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : r.classGroupId;
}, Kp = /^\[(.+)\]$/, rP = (e) => {
  if (Kp.test(e)) {
    const t = Kp.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, nP = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return aP(Object.entries(e.classGroups), r).forEach(([o, a]) => {
    Oc(a, n, o, t);
  }), n;
}, Oc = (e, t, r, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : Jp(t, o);
      a.classGroupId = r;
      return;
    }
    if (typeof o == "function") {
      if (oP(o)) {
        Oc(o(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: r
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      Oc(i, Jp(t, a), r, n);
    });
  });
}, Jp = (e, t) => {
  let r = e;
  return t.split(sf).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, oP = (e) => e.isThemeGetter, aP = (e, t) => t ? e.map(([r, n]) => {
  const o = n.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [r, o];
}) : e, iP = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const o = (a, i) => {
    r.set(a, i), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = r.get(a);
      if (i !== void 0)
        return i;
      if ((i = n.get(a)) !== void 0)
        return o(a, i), i;
    },
    set(a, i) {
      r.has(a) ? r.set(a, i) : o(a, i);
    }
  };
}, wy = "!", sP = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const c = [];
    let l = 0, u = 0, f;
    for (let m = 0; m < s.length; m++) {
      let x = s[m];
      if (l === 0) {
        if (x === o && (n || s.slice(m, m + a) === t)) {
          c.push(s.slice(u, m)), u = m + a;
          continue;
        }
        if (x === "/") {
          f = m;
          continue;
        }
      }
      x === "[" ? l++ : x === "]" && l--;
    }
    const d = c.length === 0 ? s : s.substring(u), b = d.startsWith(wy), y = b ? d.substring(1) : d, p = f && f > u ? f - u : void 0;
    return {
      modifiers: c,
      hasImportantModifier: b,
      baseClassName: y,
      maybePostfixModifierPosition: p
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, lP = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, cP = (e) => ({
  cache: iP(e.cacheSize),
  parseClassName: sP(e),
  ...tP(e)
}), uP = /\s+/, fP = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(uP);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: b
    } = r(l);
    let y = !!b, p = n(y ? d.substring(0, b) : d);
    if (!p) {
      if (!y) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (p = n(d), !p) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      y = !1;
    }
    const m = lP(u).join(":"), x = f ? m + wy : m, w = x + p;
    if (a.includes(w))
      continue;
    a.push(w);
    const O = o(p, y);
    for (let E = 0; E < O.length; ++E) {
      const h = O[E];
      a.push(x + h);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function dP() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = ky(t)) && (n && (n += " "), n += r);
  return n;
}
const ky = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = ky(e[n])) && (r && (r += " "), r += t);
  return r;
};
function pP(e, ...t) {
  let r, n, o, a = i;
  function i(c) {
    const l = t.reduce((u, f) => f(u), e());
    return r = cP(l), n = r.cache.get, o = r.cache.set, a = s, s(c);
  }
  function s(c) {
    const l = n(c);
    if (l)
      return l;
    const u = fP(c, r);
    return o(c, u), u;
  }
  return function() {
    return a(dP.apply(null, arguments));
  };
}
const Fe = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, Oy = /^\[(?:([a-z-]+):)?(.+)\]$/i, mP = /^\d+\/\d+$/, gP = /* @__PURE__ */ new Set(["px", "full", "screen"]), hP = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, bP = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, yP = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, vP = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, xP = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Yt = (e) => Rn(e) || gP.has(e) || mP.test(e), dr = (e) => no(e, "length", CP), Rn = (e) => !!e && !Number.isNaN(Number(e)), Js = (e) => no(e, "number", Rn), bo = (e) => !!e && Number.isInteger(Number(e)), wP = (e) => e.endsWith("%") && Rn(e.slice(0, -1)), de = (e) => Oy.test(e), pr = (e) => hP.test(e), kP = /* @__PURE__ */ new Set(["length", "size", "percentage"]), OP = (e) => no(e, kP, Ey), EP = (e) => no(e, "position", Ey), PP = /* @__PURE__ */ new Set(["image", "url"]), SP = (e) => no(e, PP, NP), AP = (e) => no(e, "", $P), yo = () => !0, no = (e, t, r) => {
  const n = Oy.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, CP = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  bP.test(e) && !yP.test(e)
), Ey = () => !1, $P = (e) => vP.test(e), NP = (e) => xP.test(e), IP = () => {
  const e = Fe("colors"), t = Fe("spacing"), r = Fe("blur"), n = Fe("brightness"), o = Fe("borderColor"), a = Fe("borderRadius"), i = Fe("borderSpacing"), s = Fe("borderWidth"), c = Fe("contrast"), l = Fe("grayscale"), u = Fe("hueRotate"), f = Fe("invert"), d = Fe("gap"), b = Fe("gradientColorStops"), y = Fe("gradientColorStopPositions"), p = Fe("inset"), m = Fe("margin"), x = Fe("opacity"), w = Fe("padding"), O = Fe("saturate"), E = Fe("scale"), h = Fe("sepia"), W = Fe("skew"), F = Fe("space"), Z = Fe("translate"), K = () => ["auto", "contain", "none"], H = () => ["auto", "hidden", "clip", "visible", "scroll"], Q = () => ["auto", de, t], P = () => [de, t], ae = () => ["", Yt, dr], D = () => ["auto", Rn, de], M = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], R = () => ["solid", "dashed", "dotted", "double", "none"], X = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], B = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], J = () => ["", "0", de], g = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], v = () => [Rn, de];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [yo],
      spacing: [Yt, dr],
      blur: ["none", "", pr, de],
      brightness: v(),
      borderColor: [e],
      borderRadius: ["none", "", "full", pr, de],
      borderSpacing: P(),
      borderWidth: ae(),
      contrast: v(),
      grayscale: J(),
      hueRotate: v(),
      invert: J(),
      gap: P(),
      gradientColorStops: [e],
      gradientColorStopPositions: [wP, dr],
      inset: Q(),
      margin: Q(),
      opacity: v(),
      padding: P(),
      saturate: v(),
      scale: v(),
      sepia: J(),
      skew: v(),
      space: P(),
      translate: P()
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
        columns: [pr]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": g()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": g()
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
        object: [...M(), de]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: H()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": H()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": H()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: K()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": K()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": K()
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
        inset: [p]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [p]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [p]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [p]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [p]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [p]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [p]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [p]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [p]
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
        z: ["auto", bo, de]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: Q()
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
        grow: J()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: J()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", bo, de]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [yo]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", bo, de]
        }, de]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": D()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": D()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [yo]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [bo, de]
        }, de]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": D()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": D()
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
        p: [w]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [w]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [w]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [w]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [w]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [w]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [w]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [w]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [w]
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
        "space-x": [F]
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
        "space-y": [F]
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
          screen: [pr]
        }, pr]
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
        text: ["base", pr, dr]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Js]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [yo]
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
        "line-clamp": ["none", Rn, Js]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Yt, de]
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
        "placeholder-opacity": [x]
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
        "text-opacity": [x]
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
        decoration: [...R(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", Yt, dr]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Yt, de]
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
        indent: P()
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
        "bg-opacity": [x]
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
        bg: [...M(), EP]
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
        bg: ["auto", "cover", "contain", OP]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, SP]
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
        from: [y]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [y]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [y]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [b]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [b]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [b]
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
        "border-opacity": [x]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...R(), "hidden"]
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
        "divide-opacity": [x]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: R()
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
        outline: ["", ...R()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Yt, de]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Yt, dr]
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
        ring: ae()
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
        "ring-opacity": [x]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [Yt, dr]
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
        shadow: ["", "inner", "none", pr, AP]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [yo]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [x]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...X(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": X()
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
        blur: [r]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [n]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [c]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", pr, de]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [l]
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
        saturate: [O]
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
        "backdrop-blur": [r]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [n]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [c]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [l]
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
        "backdrop-opacity": [x]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [O]
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
        duration: v()
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
        delay: v()
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
        rotate: [bo, de]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [Z]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [Z]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [W]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [W]
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
        "scroll-m": P()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": P()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": P()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": P()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": P()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": P()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": P()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": P()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": P()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": P()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": P()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": P()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": P()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": P()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": P()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": P()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": P()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": P()
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
        stroke: [Yt, dr, Js]
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
}, TP = /* @__PURE__ */ pP(IP), jP = ({
  onClick: e,
  className: t,
  size: r = "md"
}) => /* @__PURE__ */ L(
  "button",
  {
    onClick: e,
    className: TP(
      "flex items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white",
      {
        sm: "h-5 w-5 text-sm",
        md: "h-7 w-7 text-md",
        lg: "h-9 w-9 text-xl"
      }[r],
      t
    ),
    children: /* @__PURE__ */ L(af, { icon: IO })
  }
);
var lf = ka(), ce = (e) => wa(e, lf), cf = ka();
ce.write = (e) => wa(e, cf);
var Hi = ka();
ce.onStart = (e) => wa(e, Hi);
var uf = ka();
ce.onFrame = (e) => wa(e, uf);
var ff = ka();
ce.onFinish = (e) => wa(e, ff);
var Fn = [];
ce.setTimeout = (e, t) => {
  const r = ce.now() + t, n = () => {
    const a = Fn.findIndex((i) => i.cancel == n);
    ~a && Fn.splice(a, 1), Ar -= ~a ? 1 : 0;
  }, o = { time: r, handler: e, cancel: n };
  return Fn.splice(Py(r), 0, o), Ar += 1, Sy(), o;
};
var Py = (e) => ~(~Fn.findIndex((t) => t.time > e) || ~Fn.length);
ce.cancel = (e) => {
  Hi.delete(e), uf.delete(e), ff.delete(e), lf.delete(e), cf.delete(e);
};
ce.sync = (e) => {
  Ec = !0, ce.batchedUpdates(e), Ec = !1;
};
ce.throttle = (e) => {
  let t;
  function r() {
    try {
      e(...t);
    } finally {
      t = null;
    }
  }
  function n(...o) {
    t = o, ce.onStart(r);
  }
  return n.handler = e, n.cancel = () => {
    Hi.delete(r), t = null;
  }, n;
};
var df = typeof window < "u" ? window.requestAnimationFrame : (
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  () => {
  }
);
ce.use = (e) => df = e;
ce.now = typeof performance < "u" ? () => performance.now() : Date.now;
ce.batchedUpdates = (e) => e();
ce.catch = console.error;
ce.frameLoop = "always";
ce.advance = () => {
  ce.frameLoop !== "demand" ? console.warn(
    "Cannot call the manual advancement of rafz whilst frameLoop is not set as demand"
  ) : Cy();
};
var Sr = -1, Ar = 0, Ec = !1;
function wa(e, t) {
  Ec ? (t.delete(e), e(0)) : (t.add(e), Sy());
}
function Sy() {
  Sr < 0 && (Sr = 0, ce.frameLoop !== "demand" && df(Ay));
}
function _P() {
  Sr = -1;
}
function Ay() {
  ~Sr && (df(Ay), ce.batchedUpdates(Cy));
}
function Cy() {
  const e = Sr;
  Sr = ce.now();
  const t = Py(Sr);
  if (t && ($y(Fn.splice(0, t), (r) => r.handler()), Ar -= t), !Ar) {
    _P();
    return;
  }
  Hi.flush(), lf.flush(e ? Math.min(64, Sr - e) : 16.667), uf.flush(), cf.flush(), ff.flush();
}
function ka() {
  let e = /* @__PURE__ */ new Set(), t = e;
  return {
    add(r) {
      Ar += t == e && !e.has(r) ? 1 : 0, e.add(r);
    },
    delete(r) {
      return Ar -= t == e && e.has(r) ? 1 : 0, e.delete(r);
    },
    flush(r) {
      t.size && (e = /* @__PURE__ */ new Set(), Ar -= t.size, $y(t, (n) => n(r) && e.add(n)), Ar += e.size, t = e);
    }
  };
}
function $y(e, t) {
  e.forEach((r) => {
    try {
      t(r);
    } catch (n) {
      ce.catch(n);
    }
  });
}
var MP = Object.defineProperty, zP = (e, t) => {
  for (var r in t)
    MP(e, r, { get: t[r], enumerable: !0 });
}, kt = {};
zP(kt, {
  assign: () => FP,
  colors: () => Nr,
  createStringInterpolator: () => mf,
  skipAnimation: () => Iy,
  to: () => Ny,
  willAdvance: () => gf
});
function Pc() {
}
var RP = (e, t, r) => Object.defineProperty(e, t, { value: r, writable: !0, configurable: !0 }), q = {
  arr: Array.isArray,
  obj: (e) => !!e && e.constructor.name === "Object",
  fun: (e) => typeof e == "function",
  str: (e) => typeof e == "string",
  num: (e) => typeof e == "number",
  und: (e) => e === void 0
};
function Bt(e, t) {
  if (q.arr(e)) {
    if (!q.arr(t) || e.length !== t.length) return !1;
    for (let r = 0; r < e.length; r++)
      if (e[r] !== t[r]) return !1;
    return !0;
  }
  return e === t;
}
var be = (e, t) => e.forEach(t);
function Dt(e, t, r) {
  if (q.arr(e)) {
    for (let n = 0; n < e.length; n++)
      t.call(r, e[n], `${n}`);
    return;
  }
  for (const n in e)
    e.hasOwnProperty(n) && t.call(r, e[n], n);
}
var tt = (e) => q.und(e) ? [] : q.arr(e) ? e : [e];
function Yo(e, t) {
  if (e.size) {
    const r = Array.from(e);
    e.clear(), be(r, t);
  }
}
var jo = (e, ...t) => Yo(e, (r) => r(...t)), pf = () => typeof window > "u" || !window.navigator || /ServerSideRendering|^Deno\//.test(window.navigator.userAgent), mf, Ny, Nr = null, Iy = !1, gf = Pc, FP = (e) => {
  e.to && (Ny = e.to), e.now && (ce.now = e.now), e.colors !== void 0 && (Nr = e.colors), e.skipAnimation != null && (Iy = e.skipAnimation), e.createStringInterpolator && (mf = e.createStringInterpolator), e.requestAnimationFrame && ce.use(e.requestAnimationFrame), e.batchedUpdates && (ce.batchedUpdates = e.batchedUpdates), e.willAdvance && (gf = e.willAdvance), e.frameLoop && (ce.frameLoop = e.frameLoop);
}, Vo = /* @__PURE__ */ new Set(), gt = [], Qs = [], wi = 0, Bi = {
  get idle() {
    return !Vo.size && !gt.length;
  },
  /** Advance the given animation on every frame until idle. */
  start(e) {
    wi > e.priority ? (Vo.add(e), ce.onStart(LP)) : (Ty(e), ce(Sc));
  },
  /** Advance all animations by the given time. */
  advance: Sc,
  /** Call this when an animation's priority changes. */
  sort(e) {
    if (wi)
      ce.onFrame(() => Bi.sort(e));
    else {
      const t = gt.indexOf(e);
      ~t && (gt.splice(t, 1), jy(e));
    }
  },
  /**
   * Clear all animations. For testing purposes.
   *
   * ☠️ Never call this from within the frameloop.
   */
  clear() {
    gt = [], Vo.clear();
  }
};
function LP() {
  Vo.forEach(Ty), Vo.clear(), ce(Sc);
}
function Ty(e) {
  gt.includes(e) || jy(e);
}
function jy(e) {
  gt.splice(
    DP(gt, (t) => t.priority > e.priority),
    0,
    e
  );
}
function Sc(e) {
  const t = Qs;
  for (let r = 0; r < gt.length; r++) {
    const n = gt[r];
    wi = n.priority, n.idle || (gf(n), n.advance(e), n.idle || t.push(n));
  }
  return wi = 0, Qs = gt, Qs.length = 0, gt = t, gt.length > 0;
}
function DP(e, t) {
  const r = e.findIndex(t);
  return r < 0 ? e.length : r;
}
var WP = {
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
}, wt = "[-+]?\\d*\\.?\\d+", ki = wt + "%";
function Xi(...e) {
  return "\\(\\s*(" + e.join(")\\s*,\\s*(") + ")\\s*\\)";
}
var UP = new RegExp("rgb" + Xi(wt, wt, wt)), YP = new RegExp("rgba" + Xi(wt, wt, wt, wt)), VP = new RegExp("hsl" + Xi(wt, ki, ki)), GP = new RegExp(
  "hsla" + Xi(wt, ki, ki, wt)
), qP = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/, HP = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/, BP = /^#([0-9a-fA-F]{6})$/, XP = /^#([0-9a-fA-F]{8})$/;
function KP(e) {
  let t;
  return typeof e == "number" ? e >>> 0 === e && e >= 0 && e <= 4294967295 ? e : null : (t = BP.exec(e)) ? parseInt(t[1] + "ff", 16) >>> 0 : Nr && Nr[e] !== void 0 ? Nr[e] : (t = UP.exec(e)) ? (yn(t[1]) << 24 | // r
  yn(t[2]) << 16 | // g
  yn(t[3]) << 8 | // b
  255) >>> // a
  0 : (t = YP.exec(e)) ? (yn(t[1]) << 24 | // r
  yn(t[2]) << 16 | // g
  yn(t[3]) << 8 | // b
  em(t[4])) >>> // a
  0 : (t = qP.exec(e)) ? parseInt(
    t[1] + t[1] + // r
    t[2] + t[2] + // g
    t[3] + t[3] + // b
    "ff",
    // a
    16
  ) >>> 0 : (t = XP.exec(e)) ? parseInt(t[1], 16) >>> 0 : (t = HP.exec(e)) ? parseInt(
    t[1] + t[1] + // r
    t[2] + t[2] + // g
    t[3] + t[3] + // b
    t[4] + t[4],
    // a
    16
  ) >>> 0 : (t = VP.exec(e)) ? (Qp(
    Zp(t[1]),
    // h
    Da(t[2]),
    // s
    Da(t[3])
    // l
  ) | 255) >>> // a
  0 : (t = GP.exec(e)) ? (Qp(
    Zp(t[1]),
    // h
    Da(t[2]),
    // s
    Da(t[3])
    // l
  ) | em(t[4])) >>> // a
  0 : null;
}
function Zs(e, t, r) {
  return r < 0 && (r += 1), r > 1 && (r -= 1), r < 1 / 6 ? e + (t - e) * 6 * r : r < 1 / 2 ? t : r < 2 / 3 ? e + (t - e) * (2 / 3 - r) * 6 : e;
}
function Qp(e, t, r) {
  const n = r < 0.5 ? r * (1 + t) : r + t - r * t, o = 2 * r - n, a = Zs(o, n, e + 1 / 3), i = Zs(o, n, e), s = Zs(o, n, e - 1 / 3);
  return Math.round(a * 255) << 24 | Math.round(i * 255) << 16 | Math.round(s * 255) << 8;
}
function yn(e) {
  const t = parseInt(e, 10);
  return t < 0 ? 0 : t > 255 ? 255 : t;
}
function Zp(e) {
  return (parseFloat(e) % 360 + 360) % 360 / 360;
}
function em(e) {
  const t = parseFloat(e);
  return t < 0 ? 0 : t > 1 ? 255 : Math.round(t * 255);
}
function Da(e) {
  const t = parseFloat(e);
  return t < 0 ? 0 : t > 100 ? 1 : t / 100;
}
function tm(e) {
  let t = KP(e);
  if (t === null) return e;
  t = t || 0;
  const r = (t & 4278190080) >>> 24, n = (t & 16711680) >>> 16, o = (t & 65280) >>> 8, a = (t & 255) / 255;
  return `rgba(${r}, ${n}, ${o}, ${a})`;
}
var aa = (e, t, r) => {
  if (q.fun(e))
    return e;
  if (q.arr(e))
    return aa({
      range: e,
      output: t,
      extrapolate: r
    });
  if (q.str(e.output[0]))
    return mf(e);
  const n = e, o = n.output, a = n.range || [0, 1], i = n.extrapolateLeft || n.extrapolate || "extend", s = n.extrapolateRight || n.extrapolate || "extend", c = n.easing || ((l) => l);
  return (l) => {
    const u = QP(l, a);
    return JP(
      l,
      a[u],
      a[u + 1],
      o[u],
      o[u + 1],
      c,
      i,
      s,
      n.map
    );
  };
};
function JP(e, t, r, n, o, a, i, s, c) {
  let l = c ? c(e) : e;
  if (l < t) {
    if (i === "identity") return l;
    i === "clamp" && (l = t);
  }
  if (l > r) {
    if (s === "identity") return l;
    s === "clamp" && (l = r);
  }
  return n === o ? n : t === r ? e <= t ? n : o : (t === -1 / 0 ? l = -l : r === 1 / 0 ? l = l - t : l = (l - t) / (r - t), l = a(l), n === -1 / 0 ? l = -l : o === 1 / 0 ? l = l + n : l = l * (o - n) + n, l);
}
function QP(e, t) {
  for (var r = 1; r < t.length - 1 && !(t[r] >= e); ++r)
    ;
  return r - 1;
}
var ZP = {
  linear: (e) => e
}, ia = Symbol.for("FluidValue.get"), Bn = Symbol.for("FluidValue.observers"), pt = (e) => !!(e && e[ia]), nt = (e) => e && e[ia] ? e[ia]() : e, rm = (e) => e[Bn] || null;
function eS(e, t) {
  e.eventObserved ? e.eventObserved(t) : e(t);
}
function sa(e, t) {
  const r = e[Bn];
  r && r.forEach((n) => {
    eS(n, t);
  });
}
var _y = class {
  constructor(e) {
    if (!e && !(e = this.get))
      throw Error("Unknown getter");
    tS(this, e);
  }
}, tS = (e, t) => My(e, ia, t);
function oo(e, t) {
  if (e[ia]) {
    let r = e[Bn];
    r || My(e, Bn, r = /* @__PURE__ */ new Set()), r.has(t) || (r.add(t), e.observerAdded && e.observerAdded(r.size, t));
  }
  return t;
}
function la(e, t) {
  const r = e[Bn];
  if (r && r.has(t)) {
    const n = r.size - 1;
    n ? r.delete(t) : e[Bn] = null, e.observerRemoved && e.observerRemoved(n, t);
  }
}
var My = (e, t, r) => Object.defineProperty(e, t, {
  value: r,
  writable: !0,
  configurable: !0
}), ni = /[+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, rS = /(#(?:[0-9a-f]{2}){2,4}|(#[0-9a-f]{3})|(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\))/gi, nm = new RegExp(`(${ni.source})(%|[a-z]+)`, "i"), nS = /rgba\(([0-9\.-]+), ([0-9\.-]+), ([0-9\.-]+), ([0-9\.-]+)\)/gi, Ki = /var\((--[a-zA-Z0-9-_]+),? ?([a-zA-Z0-9 ()%#.,-]+)?\)/, zy = (e) => {
  const [t, r] = oS(e);
  if (!t || pf())
    return e;
  const n = window.getComputedStyle(document.documentElement).getPropertyValue(t);
  return n ? n.trim() : r && r.startsWith("--") ? window.getComputedStyle(document.documentElement).getPropertyValue(r) || e : r && Ki.test(r) ? zy(r) : r || e;
}, oS = (e) => {
  const t = Ki.exec(e);
  if (!t) return [,];
  const [, r, n] = t;
  return [r, n];
}, el, aS = (e, t, r, n, o) => `rgba(${Math.round(t)}, ${Math.round(r)}, ${Math.round(n)}, ${o})`, Ry = (e) => {
  el || (el = Nr ? (
    // match color names, ignore partial matches
    new RegExp(`(${Object.keys(Nr).join("|")})(?!\\w)`, "g")
  ) : (
    // never match
    /^\b$/
  ));
  const t = e.output.map((o) => nt(o).replace(Ki, zy).replace(rS, tm).replace(el, tm)), r = t.map((o) => o.match(ni).map(Number)), n = r[0].map(
    (o, a) => r.map((i) => {
      if (!(a in i))
        throw Error('The arity of each "output" value must be equal');
      return i[a];
    })
  ).map(
    (o) => aa({ ...e, output: o })
  );
  return (o) => {
    var a;
    const i = !nm.test(t[0]) && ((a = t.find((c) => nm.test(c))) == null ? void 0 : a.replace(ni, ""));
    let s = 0;
    return t[0].replace(
      ni,
      () => `${n[s++](o)}${i || ""}`
    ).replace(nS, aS);
  };
}, hf = "react-spring: ", Fy = (e) => {
  const t = e;
  let r = !1;
  if (typeof t != "function")
    throw new TypeError(`${hf}once requires a function parameter`);
  return (...n) => {
    r || (t(...n), r = !0);
  };
}, iS = Fy(console.warn);
function sS() {
  iS(
    `${hf}The "interpolate" function is deprecated in v9 (use "to" instead)`
  );
}
var lS = Fy(console.warn);
function cS() {
  lS(
    `${hf}Directly calling start instead of using the api object is deprecated in v9 (use ".start" instead), this will be removed in later 0.X.0 versions`
  );
}
function Ji(e) {
  return q.str(e) && (e[0] == "#" || /\d/.test(e) || // Do not identify a CSS variable as an AnimatedString if its SSR
  !pf() && Ki.test(e) || e in (Nr || {}));
}
var An = pf() ? Ne : $u, uS = () => {
  const e = le(!1);
  return An(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
};
function Ly() {
  const e = Me()[1], t = uS();
  return () => {
    t.current && e(Math.random());
  };
}
var Dy = (e) => Ne(e, fS), fS = [];
function dS(e) {
  const t = le(void 0);
  return Ne(() => {
    t.current = e;
  }), t.current;
}
var ca = Symbol.for("Animated:node"), pS = (e) => !!e && e[ca] === e, Et = (e) => e && e[ca], bf = (e, t) => RP(e, ca, t), Qi = (e) => e && e[ca] && e[ca].getPayload(), Wy = class {
  constructor() {
    bf(this, this);
  }
  /** Get every `AnimatedValue` used by this node. */
  getPayload() {
    return this.payload || [];
  }
}, Zi = class Uy extends Wy {
  constructor(t) {
    super(), this._value = t, this.done = !0, this.durationProgress = 0, q.num(this._value) && (this.lastPosition = this._value);
  }
  /** @internal */
  static create(t) {
    return new Uy(t);
  }
  getPayload() {
    return [this];
  }
  getValue() {
    return this._value;
  }
  setValue(t, r) {
    return q.num(t) && (this.lastPosition = t, r && (t = Math.round(t / r) * r, this.done && (this.lastPosition = t))), this._value === t ? !1 : (this._value = t, !0);
  }
  reset() {
    const { done: t } = this;
    this.done = !1, q.num(this._value) && (this.elapsedTime = 0, this.durationProgress = 0, this.lastPosition = this._value, t && (this.lastVelocity = null), this.v0 = null);
  }
}, Oi = class Yy extends Zi {
  constructor(t) {
    super(0), this._string = null, this._toString = aa({
      output: [t, t]
    });
  }
  /** @internal */
  static create(t) {
    return new Yy(t);
  }
  getValue() {
    return this._string ?? (this._string = this._toString(this._value));
  }
  setValue(t) {
    if (q.str(t)) {
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
    t && (this._toString = aa({
      output: [this.getValue(), t]
    })), this._value = 0, super.reset();
  }
}, Ei = { dependencies: null }, es = class extends Wy {
  constructor(t) {
    super(), this.source = t, this.setValue(t);
  }
  getValue(t) {
    const r = {};
    return Dt(this.source, (n, o) => {
      pS(n) ? r[o] = n.getValue(t) : pt(n) ? r[o] = nt(n) : t || (r[o] = n);
    }), r;
  }
  /** Replace the raw object data */
  setValue(t) {
    this.source = t, this.payload = this._makePayload(t);
  }
  reset() {
    this.payload && be(this.payload, (t) => t.reset());
  }
  /** Create a payload set. */
  _makePayload(t) {
    if (t) {
      const r = /* @__PURE__ */ new Set();
      return Dt(t, this._addToPayload, r), Array.from(r);
    }
  }
  /** Add to a payload set. */
  _addToPayload(t) {
    Ei.dependencies && pt(t) && Ei.dependencies.add(t);
    const r = Qi(t);
    r && be(r, (n) => this.add(n));
  }
}, mS = class Vy extends es {
  constructor(t) {
    super(t);
  }
  /** @internal */
  static create(t) {
    return new Vy(t);
  }
  getValue() {
    return this.source.map((t) => t.getValue());
  }
  setValue(t) {
    const r = this.getPayload();
    return t.length == r.length ? r.map((n, o) => n.setValue(t[o])).some(Boolean) : (super.setValue(t.map(gS)), !0);
  }
};
function gS(e) {
  return (Ji(e) ? Oi : Zi).create(e);
}
function Ac(e) {
  const t = Et(e);
  return t ? t.constructor : q.arr(e) ? mS : Ji(e) ? Oi : Zi;
}
var om = (e, t) => {
  const r = (
    // Function components must use "forwardRef" to avoid being
    // re-rendered on every animation frame.
    !q.fun(e) || e.prototype && e.prototype.isReactComponent
  );
  return Nu((n, o) => {
    const a = le(null), i = r && // eslint-disable-next-line react-hooks/rules-of-hooks
    Be(
      (y) => {
        a.current = yS(o, y);
      },
      [o]
    ), [s, c] = bS(n, t), l = Ly(), u = () => {
      const y = a.current;
      r && !y || (y ? t.applyAnimatedValues(y, s.getValue(!0)) : !1) === !1 && l();
    }, f = new hS(u, c), d = le(void 0);
    An(() => (d.current = f, be(c, (y) => oo(y, f)), () => {
      d.current && (be(
        d.current.deps,
        (y) => la(y, d.current)
      ), ce.cancel(d.current.update));
    })), Ne(u, []), Dy(() => () => {
      const y = d.current;
      be(y.deps, (p) => la(p, y));
    });
    const b = t.getComponentProps(s.getValue());
    return /* @__PURE__ */ T.createElement(e, { ...b, ref: i });
  });
}, hS = class {
  constructor(e, t) {
    this.update = e, this.deps = t;
  }
  eventObserved(e) {
    e.type == "change" && ce.write(this.update);
  }
};
function bS(e, t) {
  const r = /* @__PURE__ */ new Set();
  return Ei.dependencies = r, e.style && (e = {
    ...e,
    style: t.createAnimatedStyle(e.style)
  }), e = new es(e), Ei.dependencies = null, [e, r];
}
function yS(e, t) {
  return e && (q.fun(e) ? e(t) : e.current = t), t;
}
var am = Symbol.for("AnimatedComponent"), vS = (e, {
  applyAnimatedValues: t = () => !1,
  createAnimatedStyle: r = (o) => new es(o),
  getComponentProps: n = (o) => o
} = {}) => {
  const o = {
    applyAnimatedValues: t,
    createAnimatedStyle: r,
    getComponentProps: n
  }, a = (i) => {
    const s = im(i) || "Anonymous";
    return q.str(i) ? i = a[i] || (a[i] = om(i, o)) : i = i[am] || (i[am] = om(i, o)), i.displayName = `Animated(${s})`, i;
  };
  return Dt(e, (i, s) => {
    q.arr(e) && (s = im(i)), a[s] = a(i);
  }), {
    animated: a
  };
}, im = (e) => q.str(e) ? e : e && q.str(e.displayName) ? e.displayName : q.fun(e) && e.name || null;
function ot(e, ...t) {
  return q.fun(e) ? e(...t) : e;
}
var Go = (e, t) => e === !0 || !!(t && e && (q.fun(e) ? e(t) : tt(e).includes(t))), Gy = (e, t) => q.obj(e) ? t && e[t] : e, qy = (e, t) => e.default === !0 ? e[t] : e.default ? e.default[t] : void 0, xS = (e) => e, yf = (e, t = xS) => {
  let r = wS;
  e.default && e.default !== !0 && (e = e.default, r = Object.keys(e));
  const n = {};
  for (const o of r) {
    const a = t(e[o], o);
    q.und(a) || (n[o] = a);
  }
  return n;
}, wS = [
  "config",
  "onProps",
  "onStart",
  "onChange",
  "onPause",
  "onResume",
  "onRest"
], kS = {
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
function OS(e) {
  const t = {};
  let r = 0;
  if (Dt(e, (n, o) => {
    kS[o] || (t[o] = n, r++);
  }), r)
    return t;
}
function vf(e) {
  const t = OS(e);
  if (t) {
    const r = { to: t };
    return Dt(e, (n, o) => o in t || (r[o] = n)), r;
  }
  return { ...e };
}
function ua(e) {
  return e = nt(e), q.arr(e) ? e.map(ua) : Ji(e) ? kt.createStringInterpolator({
    range: [0, 1],
    output: [e, e]
  })(1) : e;
}
function ES(e) {
  for (const t in e) return !0;
  return !1;
}
function Cc(e) {
  return q.fun(e) || q.arr(e) && q.obj(e[0]);
}
function sm(e, t) {
  var r;
  (r = e.ref) == null || r.delete(e), t == null || t.delete(e);
}
function PS(e, t) {
  var r;
  t && e.ref !== t && ((r = e.ref) == null || r.delete(e), t.add(e), e.ref = t);
}
var SS = {
  default: { tension: 170, friction: 26 }
}, $c = {
  ...SS.default,
  mass: 1,
  damping: 1,
  easing: ZP.linear,
  clamp: !1
}, AS = class {
  constructor() {
    this.velocity = 0, Object.assign(this, $c);
  }
};
function CS(e, t, r) {
  r && (r = { ...r }, lm(r, t), t = { ...r, ...t }), lm(e, t), Object.assign(e, t);
  for (const i in $c)
    e[i] == null && (e[i] = $c[i]);
  let { frequency: n, damping: o } = e;
  const { mass: a } = e;
  return q.und(n) || (n < 0.01 && (n = 0.01), o < 0 && (o = 0), e.tension = Math.pow(2 * Math.PI / n, 2) * a, e.friction = 4 * Math.PI * o * a / n), e;
}
function lm(e, t) {
  if (!q.und(t.decay))
    e.duration = void 0;
  else {
    const r = !q.und(t.tension) || !q.und(t.friction);
    (r || !q.und(t.frequency) || !q.und(t.damping) || !q.und(t.mass)) && (e.duration = void 0, e.decay = void 0), r && (e.frequency = void 0);
  }
}
var cm = [], $S = class {
  constructor() {
    this.changed = !1, this.values = cm, this.toValues = null, this.fromValues = cm, this.config = new AS(), this.immediate = !1;
  }
};
function Hy(e, { key: t, props: r, defaultProps: n, state: o, actions: a }) {
  return new Promise((i, s) => {
    let c, l, u = Go(r.cancel ?? (n == null ? void 0 : n.cancel), t);
    if (u)
      b();
    else {
      q.und(r.pause) || (o.paused = Go(r.pause, t));
      let y = n == null ? void 0 : n.pause;
      y !== !0 && (y = o.paused || Go(y, t)), c = ot(r.delay || 0, t), y ? (o.resumeQueue.add(d), a.pause()) : (a.resume(), d());
    }
    function f() {
      o.resumeQueue.add(d), o.timeouts.delete(l), l.cancel(), c = l.time - ce.now();
    }
    function d() {
      c > 0 && !kt.skipAnimation ? (o.delayed = !0, l = ce.setTimeout(b, c), o.pauseQueue.add(f), o.timeouts.add(l)) : b();
    }
    function b() {
      o.delayed && (o.delayed = !1), o.pauseQueue.delete(f), o.timeouts.delete(l), e <= (o.cancelId || 0) && (u = !0);
      try {
        a.start({ ...r, callId: e, cancel: u }, i);
      } catch (y) {
        s(y);
      }
    }
  });
}
var xf = (e, t) => t.length == 1 ? t[0] : t.some((r) => r.cancelled) ? Ln(e.get()) : t.every((r) => r.noop) ? By(e.get()) : xt(
  e.get(),
  t.every((r) => r.finished)
), By = (e) => ({
  value: e,
  noop: !0,
  finished: !0,
  cancelled: !1
}), xt = (e, t, r = !1) => ({
  value: e,
  finished: t,
  cancelled: r
}), Ln = (e) => ({
  value: e,
  cancelled: !0,
  finished: !1
});
function Xy(e, t, r, n) {
  const { callId: o, parentId: a, onRest: i } = t, { asyncTo: s, promise: c } = r;
  return !a && e === s && !t.reset ? c : r.promise = (async () => {
    r.asyncId = o, r.asyncTo = e;
    const l = yf(
      t,
      (m, x) => (
        // The `onRest` prop is only called when the `runAsync` promise is resolved.
        x === "onRest" ? void 0 : m
      )
    );
    let u, f;
    const d = new Promise(
      (m, x) => (u = m, f = x)
    ), b = (m) => {
      const x = (
        // The `cancel` prop or `stop` method was used.
        o <= (r.cancelId || 0) && Ln(n) || // The async `to` prop was replaced.
        o !== r.asyncId && xt(n, !1)
      );
      if (x)
        throw m.result = x, f(m), m;
    }, y = (m, x) => {
      const w = new um(), O = new fm();
      return (async () => {
        if (kt.skipAnimation)
          throw fa(r), O.result = xt(n, !1), f(O), O;
        b(w);
        const E = q.obj(m) ? { ...m } : { ...x, to: m };
        E.parentId = o, Dt(l, (W, F) => {
          q.und(E[F]) && (E[F] = W);
        });
        const h = await n.start(E);
        return b(w), r.paused && await new Promise((W) => {
          r.resumeQueue.add(W);
        }), h;
      })();
    };
    let p;
    if (kt.skipAnimation)
      return fa(r), xt(n, !1);
    try {
      let m;
      q.arr(e) ? m = (async (x) => {
        for (const w of x)
          await y(w);
      })(e) : m = Promise.resolve(e(y, n.stop.bind(n))), await Promise.all([m.then(u), d]), p = xt(n.get(), !0, !1);
    } catch (m) {
      if (m instanceof um)
        p = m.result;
      else if (m instanceof fm)
        p = m.result;
      else
        throw m;
    } finally {
      o == r.asyncId && (r.asyncId = a, r.asyncTo = a ? s : void 0, r.promise = a ? c : void 0);
    }
    return q.fun(i) && ce.batchedUpdates(() => {
      i(p, n, n.item);
    }), p;
  })();
}
function fa(e, t) {
  Yo(e.timeouts, (r) => r.cancel()), e.pauseQueue.clear(), e.resumeQueue.clear(), e.asyncId = e.asyncTo = e.promise = void 0, t && (e.cancelId = t);
}
var um = class extends Error {
  constructor() {
    super(
      "An async animation has been interrupted. You see this error because you forgot to use `await` or `.catch(...)` on its returned promise."
    );
  }
}, fm = class extends Error {
  constructor() {
    super("SkipAnimationSignal");
  }
}, Nc = (e) => e instanceof wf, NS = 1, wf = class extends _y {
  constructor() {
    super(...arguments), this.id = NS++, this._priority = 0;
  }
  get priority() {
    return this._priority;
  }
  set priority(t) {
    this._priority != t && (this._priority = t, this._onPriorityChange(t));
  }
  /** Get the current value */
  get() {
    const t = Et(this);
    return t && t.getValue();
  }
  /** Create a spring that maps our value to another value */
  to(...t) {
    return kt.to(this, t);
  }
  /** @deprecated Use the `to` method instead. */
  interpolate(...t) {
    return sS(), kt.to(this, t);
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
  _onChange(t, r = !1) {
    sa(this, {
      type: "change",
      parent: this,
      value: t,
      idle: r
    });
  }
  /** Tell our children about our new priority */
  _onPriorityChange(t) {
    this.idle || Bi.sort(this), sa(this, {
      type: "priority",
      parent: this,
      priority: t
    });
  }
}, sn = Symbol.for("SpringPhase"), Ky = 1, Jy = 2, Qy = 4, tl = (e) => (e[sn] & Ky) > 0, mr = (e) => (e[sn] & Jy) > 0, vo = (e) => (e[sn] & Qy) > 0, dm = (e, t) => t ? e[sn] |= Jy | Ky : e[sn] &= -3, pm = (e, t) => t ? e[sn] |= Qy : e[sn] &= -5, IS = class extends wf {
  constructor(e, t) {
    if (super(), this.animation = new $S(), this.defaultProps = {}, this._state = {
      paused: !1,
      delayed: !1,
      pauseQueue: /* @__PURE__ */ new Set(),
      resumeQueue: /* @__PURE__ */ new Set(),
      timeouts: /* @__PURE__ */ new Set()
    }, this._pendingCalls = /* @__PURE__ */ new Set(), this._lastCallId = 0, this._lastToId = 0, this._memoizedDuration = 0, !q.und(e) || !q.und(t)) {
      const r = q.obj(e) ? { ...e } : { ...t, from: e };
      q.und(r.default) && (r.default = !0), this.start(r);
    }
  }
  /** Equals true when not advancing on each frame. */
  get idle() {
    return !(mr(this) || this._state.asyncTo) || vo(this);
  }
  get goal() {
    return nt(this.animation.to);
  }
  get velocity() {
    const e = Et(this);
    return e instanceof Zi ? e.lastVelocity || 0 : e.getPayload().map((t) => t.lastVelocity || 0);
  }
  /**
   * When true, this value has been animated at least once.
   */
  get hasAnimated() {
    return tl(this);
  }
  /**
   * When true, this value has an unfinished animation,
   * which is either active or paused.
   */
  get isAnimating() {
    return mr(this);
  }
  /**
   * When true, all current and future animations are paused.
   */
  get isPaused() {
    return vo(this);
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
    let t = !0, r = !1;
    const n = this.animation;
    let { toValues: o } = n;
    const { config: a } = n, i = Qi(n.to);
    !i && pt(n.to) && (o = tt(nt(n.to))), n.values.forEach((l, u) => {
      if (l.done) return;
      const f = (
        // Animated strings always go from 0 to 1.
        l.constructor == Oi ? 1 : i ? i[u].lastPosition : o[u]
      );
      let d = n.immediate, b = f;
      if (!d) {
        if (b = l.lastPosition, a.tension <= 0) {
          l.done = !0;
          return;
        }
        let y = l.elapsedTime += e;
        const p = n.fromValues[u], m = l.v0 != null ? l.v0 : l.v0 = q.arr(a.velocity) ? a.velocity[u] : a.velocity;
        let x;
        const w = a.precision || (p == f ? 5e-3 : Math.min(1, Math.abs(f - p) * 1e-3));
        if (q.und(a.duration))
          if (a.decay) {
            const O = a.decay === !0 ? 0.998 : a.decay, E = Math.exp(-(1 - O) * y);
            b = p + m / (1 - O) * (1 - E), d = Math.abs(l.lastPosition - b) <= w, x = m * E;
          } else {
            x = l.lastVelocity == null ? m : l.lastVelocity;
            const O = a.restVelocity || w / 10, E = a.clamp ? 0 : a.bounce, h = !q.und(E), W = p == f ? l.v0 > 0 : p < f;
            let F, Z = !1;
            const K = 1, H = Math.ceil(e / K);
            for (let Q = 0; Q < H && (F = Math.abs(x) > O, !(!F && (d = Math.abs(f - b) <= w, d))); ++Q) {
              h && (Z = b == f || b > f == W, Z && (x = -x * E, b = f));
              const P = -a.tension * 1e-6 * (b - f), ae = -a.friction * 1e-3 * x, D = (P + ae) / a.mass;
              x = x + D * K, b = b + x * K;
            }
          }
        else {
          let O = 1;
          a.duration > 0 && (this._memoizedDuration !== a.duration && (this._memoizedDuration = a.duration, l.durationProgress > 0 && (l.elapsedTime = a.duration * l.durationProgress, y = l.elapsedTime += e)), O = (a.progress || 0) + y / this._memoizedDuration, O = O > 1 ? 1 : O < 0 ? 0 : O, l.durationProgress = O), b = p + a.easing(O) * (f - p), x = (b - l.lastPosition) / e, d = O == 1;
        }
        l.lastVelocity = x, Number.isNaN(b) && (console.warn("Got NaN while animating:", this), d = !0);
      }
      i && !i[u].done && (d = !1), d ? l.done = !0 : t = !1, l.setValue(b, a.round) && (r = !0);
    });
    const s = Et(this), c = s.getValue();
    if (t) {
      const l = nt(n.to);
      (c !== l || r) && !a.decay ? (s.setValue(l), this._onChange(l)) : r && a.decay && this._onChange(c), this._stop();
    } else r && this._onChange(c);
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
    if (mr(this)) {
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
    let r;
    return q.und(e) ? (r = this.queue || [], this.queue = []) : r = [q.obj(e) ? e : { ...t, to: e }], Promise.all(
      r.map((n) => this._update(n))
    ).then((n) => xf(this, n));
  }
  /**
   * Stop the current animation, and cancel any delayed updates.
   *
   * Pass `true` to call `onRest` with `cancelled: true`.
   */
  stop(e) {
    const { to: t } = this.animation;
    return this._focus(this.get()), fa(this._state, e && this._lastCallId), ce.batchedUpdates(() => this._stop(t, e)), this;
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
    let { to: r, from: n } = e;
    r = q.obj(r) ? r[t] : r, (r == null || Cc(r)) && (r = void 0), n = q.obj(n) ? n[t] : n, n == null && (n = void 0);
    const o = { to: r, from: n };
    return tl(this) || (e.reverse && ([r, n] = [n, r]), n = nt(n), q.und(n) ? Et(this) || this._set(r) : this._set(n)), o;
  }
  /** Every update is processed by this method before merging. */
  _update({ ...e }, t) {
    const { key: r, defaultProps: n } = this;
    e.default && Object.assign(
      n,
      yf(
        e,
        (i, s) => /^on/.test(s) ? Gy(i, r) : i
      )
    ), gm(this, e, "onProps"), wo(this, "onProps", e, this);
    const o = this._prepareNode(e);
    if (Object.isFrozen(this))
      throw Error(
        "Cannot animate a `SpringValue` object that is frozen. Did you forget to pass your component to `animated(...)` before animating its props?"
      );
    const a = this._state;
    return Hy(++this._lastCallId, {
      key: r,
      props: e,
      defaultProps: n,
      state: a,
      actions: {
        pause: () => {
          vo(this) || (pm(this, !0), jo(a.pauseQueue), wo(
            this,
            "onPause",
            xt(this, xo(this, this.animation.to)),
            this
          ));
        },
        resume: () => {
          vo(this) && (pm(this, !1), mr(this) && this._resume(), jo(a.resumeQueue), wo(
            this,
            "onResume",
            xt(this, xo(this, this.animation.to)),
            this
          ));
        },
        start: this._merge.bind(this, o)
      }
    }).then((i) => {
      if (e.loop && i.finished && !(t && i.noop)) {
        const s = Zy(e);
        if (s)
          return this._update(s, !0);
      }
      return i;
    });
  }
  /** Merge props into the current animation */
  _merge(e, t, r) {
    if (t.cancel)
      return this.stop(!0), r(Ln(this));
    const n = !q.und(e.to), o = !q.und(e.from);
    if (n || o)
      if (t.callId > this._lastToId)
        this._lastToId = t.callId;
      else
        return r(Ln(this));
    const { key: a, defaultProps: i, animation: s } = this, { to: c, from: l } = s;
    let { to: u = c, from: f = l } = e;
    o && !n && (!t.default || q.und(u)) && (u = f), t.reverse && ([u, f] = [f, u]);
    const d = !Bt(f, l);
    d && (s.from = f), f = nt(f);
    const b = !Bt(u, c);
    b && this._focus(u);
    const y = Cc(t.to), { config: p } = s, { decay: m, velocity: x } = p;
    (n || o) && (p.velocity = 0), t.config && !y && CS(
      p,
      ot(t.config, a),
      // Avoid calling the same "config" prop twice.
      t.config !== i.config ? ot(i.config, a) : void 0
    );
    let w = Et(this);
    if (!w || q.und(u))
      return r(xt(this, !0));
    const O = (
      // When `reset` is undefined, the `from` prop implies `reset: true`,
      // except for declarative updates. When `reset` is defined, there
      // must exist a value to animate from.
      q.und(t.reset) ? o && !t.default : !q.und(f) && Go(t.reset, a)
    ), E = O ? f : this.get(), h = ua(u), W = q.num(h) || q.arr(h) || Ji(h), F = !y && (!W || Go(i.immediate || t.immediate, a));
    if (b) {
      const Q = Ac(u);
      if (Q !== w.constructor)
        if (F)
          w = this._set(h);
        else
          throw Error(
            `Cannot animate between ${w.constructor.name} and ${Q.name}, as the "to" prop suggests`
          );
    }
    const Z = w.constructor;
    let K = pt(u), H = !1;
    if (!K) {
      const Q = O || !tl(this) && d;
      (b || Q) && (H = Bt(ua(E), h), K = !H), (!Bt(s.immediate, F) && !F || !Bt(p.decay, m) || !Bt(p.velocity, x)) && (K = !0);
    }
    if (H && mr(this) && (s.changed && !O ? K = !0 : K || this._stop(c)), !y && ((K || pt(c)) && (s.values = w.getPayload(), s.toValues = pt(u) ? null : Z == Oi ? [1] : tt(h)), s.immediate != F && (s.immediate = F, !F && !O && this._set(c)), K)) {
      const { onRest: Q } = s;
      be(TS, (ae) => gm(this, t, ae));
      const P = xt(this, xo(this, c));
      jo(this._pendingCalls, P), this._pendingCalls.add(r), s.changed && ce.batchedUpdates(() => {
        var ae;
        s.changed = !O, Q == null || Q(P, this), O ? ot(i.onRest, P) : (ae = s.onStart) == null || ae.call(s, P, this);
      });
    }
    O && this._set(E), y ? r(Xy(t.to, t, this._state, this)) : K ? this._start() : mr(this) && !b ? this._pendingCalls.add(r) : r(By(E));
  }
  /** Update the `animation.to` value, which might be a `FluidValue` */
  _focus(e) {
    const t = this.animation;
    e !== t.to && (rm(this) && this._detach(), t.to = e, rm(this) && this._attach());
  }
  _attach() {
    let e = 0;
    const { to: t } = this.animation;
    pt(t) && (oo(t, this), Nc(t) && (e = t.priority + 1)), this.priority = e;
  }
  _detach() {
    const { to: e } = this.animation;
    pt(e) && la(e, this);
  }
  /**
   * Update the current value from outside the frameloop,
   * and return the `Animated` node.
   */
  _set(e, t = !0) {
    const r = nt(e);
    if (!q.und(r)) {
      const n = Et(this);
      if (!n || !Bt(r, n.getValue())) {
        const o = Ac(r);
        !n || n.constructor != o ? bf(this, o.create(r)) : n.setValue(r), n && ce.batchedUpdates(() => {
          this._onChange(r, t);
        });
      }
    }
    return Et(this);
  }
  _onStart() {
    const e = this.animation;
    e.changed || (e.changed = !0, wo(
      this,
      "onStart",
      xt(this, xo(this, e.to)),
      this
    ));
  }
  _onChange(e, t) {
    t || (this._onStart(), ot(this.animation.onChange, e, this)), ot(this.defaultProps.onChange, e, this), super._onChange(e, t);
  }
  // This method resets the animation state (even if already animating) to
  // ensure the latest from/to range is used, and it also ensures this spring
  // is added to the frameloop.
  _start() {
    const e = this.animation;
    Et(this).reset(nt(e.to)), e.immediate || (e.fromValues = e.values.map((t) => t.lastPosition)), mr(this) || (dm(this, !0), vo(this) || this._resume());
  }
  _resume() {
    kt.skipAnimation ? this.finish() : Bi.start(this);
  }
  /**
   * Exit the frameloop and notify `onRest` listeners.
   *
   * Always wrap `_stop` calls with `batchedUpdates`.
   */
  _stop(e, t) {
    if (mr(this)) {
      dm(this, !1);
      const r = this.animation;
      be(r.values, (o) => {
        o.done = !0;
      }), r.toValues && (r.onChange = r.onPause = r.onResume = void 0), sa(this, {
        type: "idle",
        parent: this
      });
      const n = t ? Ln(this.get()) : xt(this.get(), xo(this, e ?? r.to));
      jo(this._pendingCalls, n), r.changed && (r.changed = !1, wo(this, "onRest", n, this));
    }
  }
};
function xo(e, t) {
  const r = ua(t), n = ua(e.get());
  return Bt(n, r);
}
function Zy(e, t = e.loop, r = e.to) {
  const n = ot(t);
  if (n) {
    const o = n !== !0 && vf(n), a = (o || e).reverse, i = !o || o.reset;
    return Pi({
      ...e,
      loop: t,
      // Avoid updating default props when looping.
      default: !1,
      // Never loop the `pause` prop.
      pause: void 0,
      // For the "reverse" prop to loop as expected, the "to" prop
      // must be undefined. The "reverse" prop is ignored when the
      // "to" prop is an array or function.
      to: !a || Cc(r) ? r : void 0,
      // Ignore the "from" prop except on reset.
      from: i ? e.from : void 0,
      reset: i,
      // The "loop" prop can return a "useSpring" props object to
      // override any of the original props.
      ...o
    });
  }
}
function Pi(e) {
  const { to: t, from: r } = e = vf(e), n = /* @__PURE__ */ new Set();
  return q.obj(t) && mm(t, n), q.obj(r) && mm(r, n), e.keys = n.size ? Array.from(n) : null, e;
}
function mm(e, t) {
  Dt(e, (r, n) => r != null && t.add(n));
}
var TS = [
  "onStart",
  "onRest",
  "onChange",
  "onPause",
  "onResume"
];
function gm(e, t, r) {
  e.animation[r] = t[r] !== qy(t, r) ? Gy(t[r], e.key) : void 0;
}
function wo(e, t, ...r) {
  var n, o, a, i;
  (o = (n = e.animation)[t]) == null || o.call(n, ...r), (i = (a = e.defaultProps)[t]) == null || i.call(a, ...r);
}
var jS = ["onStart", "onChange", "onRest"], _S = 1, MS = class {
  constructor(e, t) {
    this.id = _S++, this.springs = {}, this.queue = [], this._lastAsyncId = 0, this._active = /* @__PURE__ */ new Set(), this._changed = /* @__PURE__ */ new Set(), this._started = !1, this._state = {
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
    return this.each((t, r) => e[r] = t.get()), e;
  }
  /** Set the current values without animating. */
  set(e) {
    for (const t in e) {
      const r = e[t];
      q.und(r) || this.springs[t].set(r);
    }
  }
  /** Push an update onto the queue of each value. */
  update(e) {
    return e && this.queue.push(Pi(e)), this;
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
    return e ? t = tt(e).map(Pi) : this.queue = [], this._flush ? this._flush(this, t) : (nv(this, t), zS(this, t));
  }
  /** @internal */
  stop(e, t) {
    if (e !== !!e && (t = e), t) {
      const r = this.springs;
      be(tt(t), (n) => r[n].stop(!!e));
    } else
      fa(this._state, this._lastAsyncId), this.each((r) => r.stop(!!e));
    return this;
  }
  /** Freeze the active animation in time */
  pause(e) {
    if (q.und(e))
      this.start({ pause: !0 });
    else {
      const t = this.springs;
      be(tt(e), (r) => t[r].pause());
    }
    return this;
  }
  /** Resume the animation if paused. */
  resume(e) {
    if (q.und(e))
      this.start({ pause: !1 });
    else {
      const t = this.springs;
      be(tt(e), (r) => t[r].resume());
    }
    return this;
  }
  /** Call a function once per spring value */
  each(e) {
    Dt(this.springs, e);
  }
  /** @internal Called at the end of every animation frame */
  _onFrame() {
    const { onStart: e, onChange: t, onRest: r } = this._events, n = this._active.size > 0, o = this._changed.size > 0;
    (n && !this._started || o && !this._started) && (this._started = !0, Yo(e, ([s, c]) => {
      c.value = this.get(), s(c, this, this._item);
    }));
    const a = !n && this._started, i = o || a && r.size ? this.get() : null;
    o && t.size && Yo(t, ([s, c]) => {
      c.value = i, s(c, this, this._item);
    }), a && (this._started = !1, Yo(r, ([s, c]) => {
      c.value = i, s(c, this, this._item);
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
function zS(e, t) {
  return Promise.all(t.map((r) => ev(e, r))).then(
    (r) => xf(e, r)
  );
}
async function ev(e, t, r) {
  const { keys: n, to: o, from: a, loop: i, onRest: s, onResolve: c } = t, l = q.obj(t.default) && t.default;
  i && (t.loop = !1), o === !1 && (t.to = null), a === !1 && (t.from = null);
  const u = q.arr(o) || q.fun(o) ? o : void 0;
  u ? (t.to = void 0, t.onRest = void 0, l && (l.onRest = void 0)) : be(jS, (p) => {
    const m = t[p];
    if (q.fun(m)) {
      const x = e._events[p];
      t[p] = ({ finished: w, cancelled: O }) => {
        const E = x.get(m);
        E ? (w || (E.finished = !1), O && (E.cancelled = !0)) : x.set(m, {
          value: null,
          finished: w || !1,
          cancelled: O || !1
        });
      }, l && (l[p] = t[p]);
    }
  });
  const f = e._state;
  t.pause === !f.paused ? (f.paused = t.pause, jo(t.pause ? f.pauseQueue : f.resumeQueue)) : f.paused && (t.pause = !0);
  const d = (n || Object.keys(e.springs)).map(
    (p) => e.springs[p].start(t)
  ), b = t.cancel === !0 || qy(t, "cancel") === !0;
  (u || b && f.asyncId) && d.push(
    Hy(++e._lastAsyncId, {
      props: t,
      state: f,
      actions: {
        pause: Pc,
        resume: Pc,
        start(p, m) {
          b ? (fa(f, e._lastAsyncId), m(Ln(e))) : (p.onRest = s, m(
            Xy(
              u,
              p,
              f,
              e
            )
          ));
        }
      }
    })
  ), f.paused && await new Promise((p) => {
    f.resumeQueue.add(p);
  });
  const y = xf(e, await Promise.all(d));
  if (i && y.finished && !(r && y.noop)) {
    const p = Zy(t, i, o);
    if (p)
      return nv(e, [p]), ev(e, p, !0);
  }
  return c && ce.batchedUpdates(() => c(y, e, e.item)), y;
}
function RS(e, t) {
  const r = { ...e.springs };
  return t && be(tt(t), (n) => {
    q.und(n.keys) && (n = Pi(n)), q.obj(n.to) || (n = { ...n, to: void 0 }), rv(r, n, (o) => tv(o));
  }), FS(e, r), r;
}
function FS(e, t) {
  Dt(t, (r, n) => {
    e.springs[n] || (e.springs[n] = r, oo(r, e));
  });
}
function tv(e, t) {
  const r = new IS();
  return r.key = e, t && oo(r, t), r;
}
function rv(e, t, r) {
  t.keys && be(t.keys, (n) => {
    (e[n] || (e[n] = r(n)))._prepareNode(t);
  });
}
function nv(e, t) {
  be(t, (r) => {
    rv(e.springs, r, (n) => tv(n, e));
  });
}
var LS = T.createContext({
  pause: !1,
  immediate: !1
}), DS = () => {
  const e = [], t = function(n) {
    cS();
    const o = [];
    return be(e, (a, i) => {
      if (q.und(n))
        o.push(a.start());
      else {
        const s = r(n, a, i);
        s && o.push(a.start(s));
      }
    }), o;
  };
  t.current = e, t.add = function(n) {
    e.includes(n) || e.push(n);
  }, t.delete = function(n) {
    const o = e.indexOf(n);
    ~o && e.splice(o, 1);
  }, t.pause = function() {
    return be(e, (n) => n.pause(...arguments)), this;
  }, t.resume = function() {
    return be(e, (n) => n.resume(...arguments)), this;
  }, t.set = function(n) {
    be(e, (o, a) => {
      const i = q.fun(n) ? n(a, o) : n;
      i && o.set(i);
    });
  }, t.start = function(n) {
    const o = [];
    return be(e, (a, i) => {
      if (q.und(n))
        o.push(a.start());
      else {
        const s = this._getProps(n, a, i);
        s && o.push(a.start(s));
      }
    }), o;
  }, t.stop = function() {
    return be(e, (n) => n.stop(...arguments)), this;
  }, t.update = function(n) {
    return be(e, (o, a) => o.update(this._getProps(n, o, a))), this;
  };
  const r = function(n, o, a) {
    return q.fun(n) ? n(a, o) : n;
  };
  return t._getProps = r, t;
};
function hm(e, t, r) {
  const n = q.fun(t) && t, {
    reset: o,
    sort: a,
    trail: i = 0,
    expires: s = !0,
    exitBeforeEnter: c = !1,
    onDestroyed: l,
    ref: u,
    config: f
  } = n ? n() : t, d = ht(
    () => n || arguments.length == 3 ? DS() : void 0,
    []
  ), b = tt(e), y = [], p = le(null), m = o ? null : p.current;
  An(() => {
    p.current = y;
  }), Dy(() => (be(y, (D) => {
    d == null || d.add(D.ctrl), D.ctrl.ref = d;
  }), () => {
    be(p.current, (D) => {
      D.expired && clearTimeout(D.expirationId), sm(D.ctrl, d), D.ctrl.stop(!0);
    });
  }));
  const x = US(b, n ? n() : t, m), w = o && p.current || [];
  An(
    () => be(w, ({ ctrl: D, item: M, key: R }) => {
      sm(D, d), ot(l, M, R);
    })
  );
  const O = [];
  if (m && be(m, (D, M) => {
    D.expired ? (clearTimeout(D.expirationId), w.push(D)) : (M = O[M] = x.indexOf(D.key), ~M && (y[M] = D));
  }), be(b, (D, M) => {
    y[M] || (y[M] = {
      key: x[M],
      item: D,
      phase: "mount",
      ctrl: new MS()
    }, y[M].ctrl.item = D);
  }), O.length) {
    let D = -1;
    const { leave: M } = n ? n() : t;
    be(O, (R, X) => {
      const B = m[X];
      ~R ? (D = y.indexOf(B), y[D] = { ...B, item: b[R] }) : M && y.splice(++D, 0, B);
    });
  }
  q.fun(a) && y.sort((D, M) => a(D.item, M.item));
  let E = -i;
  const h = Ly(), W = yf(t), F = /* @__PURE__ */ new Map(), Z = le(/* @__PURE__ */ new Map()), K = le(!1);
  be(y, (D, M) => {
    const R = D.key, X = D.phase, B = n ? n() : t;
    let J, g;
    const v = ot(B.delay || 0, R);
    if (X == "mount")
      J = B.enter, g = "enter";
    else {
      const I = x.indexOf(R) < 0;
      if (X != "leave")
        if (I)
          J = B.leave, g = "leave";
        else if (J = B.update)
          g = "update";
        else return;
      else if (!I)
        J = B.enter, g = "enter";
      else return;
    }
    if (J = ot(J, D.item, M), J = q.obj(J) ? vf(J) : { to: J }, !J.config) {
      const I = f || W.config;
      J.config = ot(I, D.item, M, g);
    }
    E += i;
    const C = {
      ...W,
      // we need to add our props.delay value you here.
      delay: v + E,
      ref: u,
      immediate: B.immediate,
      // This prevents implied resets.
      reset: !1,
      // Merge any phase-specific props.
      ...J
    };
    if (g == "enter" && q.und(C.from)) {
      const I = n ? n() : t, N = q.und(I.initial) || m ? I.from : I.initial;
      C.from = ot(N, D.item, M);
    }
    const { onResolve: A } = C;
    C.onResolve = (I) => {
      ot(A, I);
      const N = p.current, $ = N.find((_) => _.key === R);
      if ($ && !(I.cancelled && $.phase != "update") && $.ctrl.idle) {
        const _ = N.every((j) => j.ctrl.idle);
        if ($.phase == "leave") {
          const j = ot(s, $.item);
          if (j !== !1) {
            const z = j === !0 ? 0 : j;
            if ($.expired = !0, !_ && z > 0) {
              z <= 2147483647 && ($.expirationId = setTimeout(h, z));
              return;
            }
          }
        }
        _ && N.some((j) => j.expired) && (Z.current.delete($), c && (K.current = !0), h());
      }
    };
    const S = RS(D.ctrl, C);
    g === "leave" && c ? Z.current.set(D, { phase: g, springs: S, payload: C }) : F.set(D, { phase: g, springs: S, payload: C });
  });
  const H = Vr(LS), Q = dS(H), P = H !== Q && ES(H);
  An(() => {
    P && be(y, (D) => {
      D.ctrl.start({ default: H });
    });
  }, [H]), be(F, (D, M) => {
    if (Z.current.size) {
      const R = y.findIndex((X) => X.key === M.key);
      y.splice(R, 1);
    }
  }), An(
    () => {
      be(
        Z.current.size ? Z.current : F,
        ({ phase: D, payload: M }, R) => {
          const { ctrl: X } = R;
          R.phase = D, d == null || d.add(X), P && D == "enter" && X.start({ default: H }), M && (PS(X, M.ref), (X.ref || d) && !K.current ? X.update(M) : (X.start(M), K.current && (K.current = !1)));
        }
      );
    },
    o ? void 0 : r
  );
  const ae = (D) => /* @__PURE__ */ T.createElement(T.Fragment, null, y.map((M, R) => {
    const { springs: X } = F.get(M) || M.ctrl, B = D({ ...X }, M.item, M, R);
    return B && B.type ? /* @__PURE__ */ T.createElement(
      B.type,
      {
        ...B.props,
        key: q.str(M.key) || q.num(M.key) ? M.key : M.ctrl.id,
        ref: B.ref
      }
    ) : B;
  }));
  return d ? [ae, d] : ae;
}
var WS = 1;
function US(e, { key: t, keys: r = t }, n) {
  if (r === null) {
    const o = /* @__PURE__ */ new Set();
    return e.map((a) => {
      const i = n && n.find(
        (s) => s.item === a && s.phase !== "leave" && !o.has(s)
      );
      return i ? (o.add(i), i.key) : WS++;
    });
  }
  return q.und(r) ? e : q.fun(r) ? e.map(r) : tt(r);
}
var YS = class extends wf {
  constructor(e, t) {
    super(), this.source = e, this.idle = !0, this._active = /* @__PURE__ */ new Set(), this.calc = aa(...t);
    const r = this._get(), n = Ac(r);
    bf(this, n.create(r));
  }
  advance(e) {
    const t = this._get(), r = this.get();
    Bt(t, r) || (Et(this).setValue(t), this._onChange(t, this.idle)), !this.idle && bm(this._active) && rl(this);
  }
  _get() {
    const e = q.arr(this.source) ? this.source.map(nt) : tt(nt(this.source));
    return this.calc(...e);
  }
  _start() {
    this.idle && !bm(this._active) && (this.idle = !1, be(Qi(this), (e) => {
      e.done = !1;
    }), kt.skipAnimation ? (ce.batchedUpdates(() => this.advance()), rl(this)) : Bi.start(this));
  }
  // Observe our sources only when we're observed.
  _attach() {
    let e = 1;
    be(tt(this.source), (t) => {
      pt(t) && oo(t, this), Nc(t) && (t.idle || this._active.add(t), e = Math.max(e, t.priority + 1));
    }), this.priority = e, this._start();
  }
  // Stop observing our sources once we have no observers.
  _detach() {
    be(tt(this.source), (e) => {
      pt(e) && la(e, this);
    }), this._active.clear(), rl(this);
  }
  /** @internal */
  eventObserved(e) {
    e.type == "change" ? e.idle ? this.advance() : (this._active.add(e.parent), this._start()) : e.type == "idle" ? this._active.delete(e.parent) : e.type == "priority" && (this.priority = tt(this.source).reduce(
      (t, r) => Math.max(t, (Nc(r) ? r.priority : 0) + 1),
      0
    ));
  }
};
function VS(e) {
  return e.idle !== !1;
}
function bm(e) {
  return !e.size || Array.from(e).every(VS);
}
function rl(e) {
  e.idle || (e.idle = !0, be(Qi(e), (t) => {
    t.done = !0;
  }), sa(e, {
    type: "idle",
    parent: e
  }));
}
kt.assign({
  createStringInterpolator: Ry,
  to: (e, t) => new YS(e, t)
});
var ov = /^--/;
function GS(e, t) {
  return t == null || typeof t == "boolean" || t === "" ? "" : typeof t == "number" && t !== 0 && !ov.test(e) && !(qo.hasOwnProperty(e) && qo[e]) ? t + "px" : ("" + t).trim();
}
var ym = {};
function qS(e, t) {
  if (!e.nodeType || !e.setAttribute)
    return !1;
  const r = e.nodeName === "filter" || e.parentNode && e.parentNode.nodeName === "filter", {
    className: n,
    style: o,
    children: a,
    scrollTop: i,
    scrollLeft: s,
    viewBox: c,
    ...l
  } = t, u = Object.values(l), f = Object.keys(l).map(
    (d) => r || e.hasAttribute(d) ? d : ym[d] || (ym[d] = d.replace(
      /([A-Z])/g,
      // Attributes are written in dash case
      (b) => "-" + b.toLowerCase()
    ))
  );
  a !== void 0 && (e.textContent = a);
  for (const d in o)
    if (o.hasOwnProperty(d)) {
      const b = GS(d, o[d]);
      ov.test(d) ? e.style.setProperty(d, b) : e.style[d] = b;
    }
  f.forEach((d, b) => {
    e.setAttribute(d, u[b]);
  }), n !== void 0 && (e.className = n), i !== void 0 && (e.scrollTop = i), s !== void 0 && (e.scrollLeft = s), c !== void 0 && e.setAttribute("viewBox", c);
}
var qo = {
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
}, HS = (e, t) => e + t.charAt(0).toUpperCase() + t.substring(1), BS = ["Webkit", "Ms", "Moz", "O"];
qo = Object.keys(qo).reduce((e, t) => (BS.forEach((r) => e[HS(r, t)] = e[t]), e), qo);
var XS = /^(matrix|translate|scale|rotate|skew)/, KS = /^(translate)/, JS = /^(rotate|skew)/, nl = (e, t) => q.num(e) && e !== 0 ? e + t : e, oi = (e, t) => q.arr(e) ? e.every((r) => oi(r, t)) : q.num(e) ? e === t : parseFloat(e) === t, QS = class extends es {
  constructor({ x: e, y: t, z: r, ...n }) {
    const o = [], a = [];
    (e || t || r) && (o.push([e || 0, t || 0, r || 0]), a.push((i) => [
      `translate3d(${i.map((s) => nl(s, "px")).join(",")})`,
      // prettier-ignore
      oi(i, 0)
    ])), Dt(n, (i, s) => {
      if (s === "transform")
        o.push([i || ""]), a.push((c) => [c, c === ""]);
      else if (XS.test(s)) {
        if (delete n[s], q.und(i)) return;
        const c = KS.test(s) ? "px" : JS.test(s) ? "deg" : "";
        o.push(tt(i)), a.push(
          s === "rotate3d" ? ([l, u, f, d]) => [
            `rotate3d(${l},${u},${f},${nl(d, c)})`,
            oi(d, 0)
          ] : (l) => [
            `${s}(${l.map((u) => nl(u, c)).join(",")})`,
            oi(l, s.startsWith("scale") ? 1 : 0)
          ]
        );
      }
    }), o.length && (n.transform = new ZS(o, a)), super(n);
  }
}, ZS = class extends _y {
  constructor(e, t) {
    super(), this.inputs = e, this.transforms = t, this._value = null;
  }
  get() {
    return this._value || (this._value = this._get());
  }
  _get() {
    let e = "", t = !0;
    return be(this.inputs, (r, n) => {
      const o = nt(r[0]), [a, i] = this.transforms[n](
        q.arr(o) ? o : r.map(nt)
      );
      e += " " + a, t = t && i;
    }), t ? "none" : e;
  }
  // Start observing our inputs once we have an observer.
  observerAdded(e) {
    e == 1 && be(
      this.inputs,
      (t) => be(
        t,
        (r) => pt(r) && oo(r, this)
      )
    );
  }
  // Stop observing our inputs once we have no observers.
  observerRemoved(e) {
    e == 0 && be(
      this.inputs,
      (t) => be(
        t,
        (r) => pt(r) && la(r, this)
      )
    );
  }
  eventObserved(e) {
    e.type == "change" && (this._value = null), sa(this, e);
  }
}, eA = [
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
kt.assign({
  batchedUpdates: q1,
  createStringInterpolator: Ry,
  colors: WP
});
var tA = vS(eA, {
  applyAnimatedValues: qS,
  createAnimatedStyle: (e) => new QS(e),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getComponentProps: ({ scrollTop: e, scrollLeft: t, ...r }) => r
}), av = tA.animated;
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const rA = {
  prefix: "fas",
  iconName: "down-left-and-up-right-to-center",
  icon: [512, 512, ["compress-alt"], "f422", "M439 7c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8l-144 0c-13.3 0-24-10.7-24-24l0-144c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39L439 7zM72 272l144 0c13.3 0 24 10.7 24 24l0 144c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39L73 505c-9.4 9.4-24.6 9.4-33.9 0L7 473c-9.4-9.4-9.4-24.6 0-33.9l87-87L55 313c-6.9-6.9-8.9-17.2-5.2-26.2s12.5-14.8 22.2-14.8z"]
}, nA = {
  prefix: "fas",
  iconName: "up-right-and-down-left-from-center",
  icon: [512, 512, ["expand-alt"], "f424", "M344 0L488 0c13.3 0 24 10.7 24 24l0 144c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87L327 41c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512L24 512c-13.3 0-24-10.7-24-24L0 344c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39 87-87c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8z"]
};
var Ic = /* @__PURE__ */ ((e) => (e[e.NONE = 0] = "NONE", e[e.INPUT = 1] = "INPUT", e[e.PANEL = 2] = "PANEL", e[e.DIALOGUE = 3] = "DIALOGUE", e))(Ic || {}), oA = Object.freeze({
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
}), aA = "VisuallyHidden", iv = T.forwardRef(
  (e, t) => /* @__PURE__ */ L(
    Wt.span,
    {
      ...e,
      ref: t,
      style: { ...oA, ...e.style }
    }
  )
);
iv.displayName = aA;
var vm = iv;
const da = [], iA = (e) => {
  da.push(e);
}, sA = (e) => {
  const t = da.findIndex((r) => r.id === e);
  t !== -1 && da.splice(t, 1);
}, lA = (e, t) => {
  const r = da.find((n) => n.id === e);
  r && Object.assign(r, t);
}, cA = () => da.filter((e) => e.closeOnEsc).sort((e, t) => t.zIndex - e.zIndex)[0];
typeof window < "u" && !window.__modalEscListenerInstalled && (window.__modalEscListenerInstalled = !0, window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" && e.key !== "Esc") return;
  const t = cA();
  t && (e.preventDefault(), t.onClose());
}));
let ko = 70;
const uA = ({
  styles: e,
  backdropClassName: t,
  disableHotkeyInput: r,
  enableHotkeyInput: n
}) => (Ne(() => (r(Ic.DIALOGUE), () => {
  n(Ic.DIALOGUE);
}), [r, n]), /* @__PURE__ */ L(Cw, { forceMount: !0, asChild: !0, children: /* @__PURE__ */ L(
  av.div,
  {
    className: Fo("fixed inset-0 z-[69]", t),
    style: {
      opacity: e.opacity,
      pointerEvents: "none",
      background: "radial-gradient(800px 400px at 10% -10%, rgba(45,129,255,0.10), transparent), radial-gradient(600px 320px at 110% 110%, rgba(28,182,190,0.10), transparent), rgba(0,0,0,0.60)"
    }
  }
) })), Tc = ({ children: e }) => /* @__PURE__ */ L(vt, { children: e }), sv = Zn(
  void 0
), kf = ({ className: e, size: t = "md" }) => {
  const r = Vr(sv);
  if (!r) return null;
  const { expanded: n, toggleExpanded: o } = r;
  return /* @__PURE__ */ L(
    "button",
    {
      type: "button",
      "aria-label": n ? "Restore modal size" : "Expand modal",
      onClick: o,
      className: Fo(
        "flex items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white",
        {
          sm: "h-5 w-5 text-sm",
          md: "h-7 w-7 text-md",
          lg: "h-9 w-9 text-xl"
        }[t],
        "relative z-[70]",
        e
      ),
      children: /* @__PURE__ */ L(
        ra,
        {
          icon: n ? rA : nA
        }
      )
    }
  );
};
kf.displayName = "ModalExpandButton";
const ao = ({
  isOpen: e,
  title: t,
  titleIcon: r,
  onTitleIconClick: n,
  onClose: o,
  enableHotkeyInput: a = () => {
  },
  disableHotkeyInput: i = () => {
  },
  className: s,
  backdropClassName: c,
  width: l,
  children: u,
  childPadding: f = !0,
  titleIconClassName: d,
  showClose: b = !0,
  draggable: y = !1,
  resizable: p = !1,
  initialPosition: m,
  closeOnOutsideClick: x = !0,
  closeOnEsc: w = !0,
  allowBackgroundInteraction: O = !1,
  expandable: E = !1,
  accessibleTitle: h,
  accessibleDescription: W
}) => {
  const [F, Z] = Me(
    null
  ), [K, H] = Me(!1), [Q, P] = Me(!1), ae = le({ x: 0, y: 0 }), D = le({ x: 0, y: 0 }), M = le(null), R = le(null), X = le(null), [B, J] = Me(() => ++ko), [g, v] = Me(!1), C = le(null), A = hm(e, {
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
  }), S = hm(e, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: {
      tension: 280,
      friction: 25
    }
  });
  Ne(() => {
    g ? (R.current && (C.current = { ...R.current }), Z({ x: 0, y: 0 }), R.current = { x: 0, y: 0 }, M.current && (M.current.style.left = "0px", M.current.style.top = "0px", M.current.style.margin = "0", M.current.style.position = "fixed", M.current.style.zIndex = String(B))) : C.current && (Z({ ...C.current }), R.current = { ...C.current }, M.current && (M.current.style.left = C.current.x + "px", M.current.style.top = C.current.y + "px", M.current.style.margin = "0", M.current.style.position = "fixed", M.current.style.zIndex = String(B)));
  }, [g, B]);
  const I = () => v((ie) => !ie);
  Ne(() => {
    e ? X.current ? (Z({ ...X.current }), R.current = { ...X.current }, M.current && (M.current.style.left = X.current.x + "px", M.current.style.top = X.current.y + "px", M.current.style.margin = "0", M.current.style.position = "fixed", M.current.style.zIndex = String(B))) : m && (Z({ ...m }), R.current = { ...m }, M.current && (M.current.style.left = m.x + "px", M.current.style.top = m.y + "px", M.current.style.margin = "0", M.current.style.position = "fixed", M.current.style.zIndex = String(B))) : R.current && (X.current = { ...R.current });
  }, [e, B]), Ne(() => {
    if (!K) return;
    let ie = null;
    const se = (ct) => {
      if (!M.current) return;
      const ut = ct.clientX - D.current.x, ze = ct.clientY - D.current.y, He = ae.current.x + ut, Xe = ae.current.y + ze, ft = M.current, { width: dt, height: mn } = ft.getBoundingClientRect(), nd = window.innerWidth, od = window.innerHeight, ad = 450, R1 = -450, F1 = 0, L1 = nd - dt + ad, D1 = od - mn + ad, W1 = Math.max(R1, Math.min(He, L1)), U1 = Math.max(F1, Math.min(Xe, D1));
      R.current = { x: W1, y: U1 }, M.current && (ie && cancelAnimationFrame(ie), ie = requestAnimationFrame(() => {
        M.current && R.current && (M.current.style.left = R.current.x + "px", M.current.style.top = R.current.y + "px", M.current.style.margin = "0", M.current.style.position = "fixed", M.current.style.zIndex = String(B));
      }));
    }, ke = () => {
      H(!1), R.current && Z({ ...R.current });
    };
    return window.addEventListener("mousemove", se), window.addEventListener("mouseup", ke), () => {
      window.removeEventListener("mousemove", se), window.removeEventListener("mouseup", ke), ie && cancelAnimationFrame(ie);
    };
  }, [K, B]);
  const N = (ie) => {
    var se, ke;
    if (!M.current) return;
    g && v(!1), ie.preventDefault(), ie.stopPropagation();
    const ct = M.current, { width: ut, height: ze } = ct.getBoundingClientRect(), He = window.innerWidth, Xe = window.innerHeight;
    let ft = ((se = R.current) == null ? void 0 : se.x) ?? (F == null ? void 0 : F.x), dt = ((ke = R.current) == null ? void 0 : ke.y) ?? (F == null ? void 0 : F.y);
    (ft === void 0 || dt === void 0) && (m ? (ft = m.x, dt = m.y) : (ft = (He - ut) / 2, dt = (Xe - ze) / 2)), ae.current = { x: ft, y: dt }, D.current = { x: ie.clientX, y: ie.clientY }, H(!0), !F && !R.current && (Z({ x: ft, y: dt }), R.current = { x: ft, y: dt }, M.current && (M.current.style.left = ft + "px", M.current.style.top = dt + "px", M.current.style.margin = "0", M.current.style.position = "fixed", M.current.style.zIndex = String(B)));
  };
  let $ = u;
  if (y) {
    let ie = !1;
    $ = Array.isArray(u) ? u.map((se) => {
      if (!ie && di(se) && (se.type === Tc || se.type.displayName === "ModalDragHandle")) {
        ie = !0;
        const ke = se;
        return pi(ke, {
          children: /* @__PURE__ */ L(
            "div",
            {
              style: { cursor: "move", userSelect: "none" },
              onMouseDown: N,
              children: ke.props.children
            }
          )
        });
      }
      return se;
    }) : di(u) && (u.type === Tc || u.type.displayName === "ModalDragHandle") ? (() => {
      const se = u;
      return pi(se, {
        children: /* @__PURE__ */ L(
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
  const _ = le(null), j = le(null), z = (ie, se) => {
    if (!M.current || (ie.preventDefault(), ie.stopPropagation(), g)) return;
    const ke = M.current.getBoundingClientRect();
    _.current = se, j.current = {
      mouseX: ie.clientX,
      mouseY: ie.clientY,
      width: ke.width,
      height: ke.height,
      x: ke.left,
      y: ke.top
    }, P(!0);
  };
  Ne(() => {
    if (!Q) return;
    let ie = null;
    const se = (ct) => {
      if (!M.current || !j.current || !_.current)
        return;
      const ut = ct.clientX - j.current.mouseX, ze = ct.clientY - j.current.mouseY;
      let He = j.current.width, Xe = j.current.height, ft = j.current.x, dt = j.current.y;
      const mn = _.current;
      mn.includes("right") && (He = j.current.width + ut), mn.includes("left") && (He = j.current.width - ut, ft = j.current.x + ut), mn.includes("bottom") && (Xe = j.current.height + ze), mn.includes("top") && (Xe = j.current.height - ze, dt = j.current.y + ze), He = Math.max(320, He), Xe = Math.max(240, Xe), R.current = { x: ft, y: dt }, _e.current = { width: He, height: Xe }, ie && cancelAnimationFrame(ie), ie = requestAnimationFrame(() => {
        M.current && R.current && (M.current.style.width = He + "px", M.current.style.height = Xe + "px", M.current.style.left = R.current.x + "px", M.current.style.top = R.current.y + "px", M.current.style.margin = "0", M.current.style.position = "fixed", M.current.style.zIndex = String(B));
      });
    }, ke = () => {
      P(!1), R.current && Z({ ...R.current }), _e.current && ue({ ..._e.current });
    };
    return window.addEventListener("mousemove", se), window.addEventListener("mouseup", ke), () => {
      window.removeEventListener("mousemove", se), window.removeEventListener("mouseup", ke), ie && cancelAnimationFrame(ie);
    };
  }, [Q, B]);
  const ee = () => {
    if (!p || g) return null;
    const ie = "absolute z-[75] bg-transparent select-none", se = 5, ke = 2, ct = [
      { dir: "top", className: `top-0 left-0 w-full h-${ke}` },
      { dir: "bottom", className: `bottom-0 left-0 w-full h-${ke}` },
      { dir: "left", className: `left-0 top-0 h-full w-${ke}` },
      { dir: "right", className: `right-0 top-0 h-full w-${ke}` },
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
    ], ut = {
      top: "n-resize",
      bottom: "s-resize",
      left: "w-resize",
      right: "e-resize",
      "top-left": "nw-resize",
      "top-right": "ne-resize",
      "bottom-left": "sw-resize",
      "bottom-right": "se-resize"
    };
    return ct.map((ze) => /* @__PURE__ */ L(
      "div",
      {
        className: `${ie} ${ze.className}`,
        style: { cursor: ut[ze.dir] },
        onMouseDown: (He) => z(He, ze.dir)
      },
      ze.dir
    ));
  }, [k, ue] = Me(
    null
  ), _e = le(null), et = le(null);
  Ne(() => {
    if (e && !k && M.current && p) {
      const { width: ie, height: se } = M.current.getBoundingClientRect();
      ue({ width: ie, height: se }), _e.current = { width: ie, height: se };
    }
  }, [e, k, p]), Ne(() => {
    if (p) {
      if (!e)
        _e.current && (et.current = { ..._e.current });
      else if (et.current && M.current) {
        const { width: ie, height: se } = et.current;
        M.current.style.width = ie + "px", M.current.style.height = se + "px", ue({ width: ie, height: se }), _e.current = { width: ie, height: se };
      }
    }
  }, [e, p]), Ne(() => {
    const ie = () => {
      M.current && B < ko && (ko += 1, J(ko), M.current.style.zIndex = String(ko));
    }, se = M.current;
    return se && se.addEventListener("mousedown", ie), () => {
      se && se.removeEventListener("mousedown", ie);
    };
  }, [B]), Ne(() => {
    if (!e || O) return;
    const ie = (se) => {
      if (se.key === "Escape" || se.key === "Esc") return;
      const ke = se.target;
      ke && (ke.closest(
        '[role="dialog"], [role="menu"], [role="listbox"], [data-headlessui-portal]'
      ) || ke.matches("input, textarea, select, button, [contenteditable]")) || se.stopPropagation();
    };
    return window.addEventListener("keydown", ie, !0), () => {
      window.removeEventListener("keydown", ie, !0);
    };
  }, [e, O]), Ne(() => {
    if (!O) return;
    const ie = M.current;
    if (!ie) return;
    const se = (ze) => {
      ze && (ze.hasAttribute("inert") && ze.removeAttribute("inert"), ze.inert && (ze.inert = !1), ze.getAttribute("aria-hidden") === "true" && ze.removeAttribute("aria-hidden"));
    };
    let ke = ie;
    for (; ke; )
      se(ke), ke = ke.parentElement;
    const ct = new MutationObserver((ze) => {
      ze.forEach((He) => {
        if (He.type === "attributes" && He.attributeName === "inert" && He.target instanceof HTMLElement) {
          const Xe = He.target;
          (Xe === ie || ie.contains(Xe)) && se(Xe);
        }
      });
    });
    ct.observe(ie, {
      attributes: !0,
      subtree: !1,
      attributeFilter: ["inert"]
    }), document.querySelectorAll(
      "[data-radix-portal][inert], [data-headlessui-portal][inert]"
    ).forEach((ze) => ze.removeAttribute("inert"));
    const ut = new MutationObserver((ze) => {
      ze.forEach((He) => {
        if (He.type === "attributes" && He.attributeName === "inert" && He.target.hasAttribute("inert")) {
          const Xe = He.target;
          (Xe.hasAttribute("data-radix-portal") || Xe.hasAttribute("data-headlessui-portal")) && se(Xe);
        }
      });
    });
    return ut.observe(document.body, {
      attributes: !0,
      subtree: !0,
      attributeFilter: ["inert"]
    }), () => {
      ct.disconnect(), ut.disconnect();
    };
  }, [O]);
  const bs = le(Math.floor(Math.random() * 1e9));
  Ne(() => {
    if (e)
      return iA({
        id: bs.current,
        zIndex: B,
        onClose: o,
        closeOnEsc: w
      }), () => {
        sA(bs.current);
      };
  }, [e]), Ne(() => {
    e && lA(bs.current, { zIndex: B, onClose: o, closeOnEsc: w });
  }, [e, B, o, w]);
  const z1 = () => g ? {
    position: "fixed",
    left: 0,
    top: 0,
    margin: 0,
    zIndex: B,
    width: "100vw",
    height: "100vh",
    ...O ? { pointerEvents: "auto" } : {}
  } : !y || !F ? {
    ...p && k ? { width: k.width, height: k.height } : {},
    ...O ? { pointerEvents: "auto" } : {}
  } : {
    position: "fixed",
    left: F.x,
    top: F.y,
    margin: 0,
    zIndex: B,
    ...p && k ? { width: k.width, height: k.height } : {},
    ...O ? { pointerEvents: "auto" } : {}
  };
  return /* @__PURE__ */ L(
    Sw,
    {
      open: e,
      onOpenChange: (ie) => !ie && x && o(),
      modal: !O,
      children: /* @__PURE__ */ L(Aw, { children: /* @__PURE__ */ Ee(
        "div",
        {
          className: "fixed inset-0 z-[70]",
          style: O ? { pointerEvents: "none" } : void 0,
          children: [
            !O && S(
              (ie, se) => se ? /* @__PURE__ */ L(
                uA,
                {
                  styles: ie,
                  backdropClassName: c,
                  disableHotkeyInput: i,
                  enableHotkeyInput: a
                },
                "backdrop"
              ) : null
            ),
            O && /* @__PURE__ */ L(
              "div",
              {
                className: Fo("fixed inset-0 z-[69]", c),
                style: { pointerEvents: "none" }
              }
            ),
            /* @__PURE__ */ L(sv.Provider, { value: { expanded: g, toggleExpanded: I }, children: /* @__PURE__ */ L(
              "div",
              {
                className: "flex min-h-full items-center justify-center p-4 text-center",
                style: O ? { pointerEvents: "none" } : void 0,
                children: A((ie, se) => se ? /* @__PURE__ */ L(
                  $w,
                  {
                    forceMount: !0,
                    asChild: !0,
                    ...W ? {} : { "aria-describedby": void 0 },
                    onPointerDownOutside: (ke) => {
                      (!x || O) && ke.preventDefault();
                    },
                    onEscapeKeyDown: (ke) => {
                      w || ke.preventDefault();
                    },
                    onInteractOutside: (ke) => {
                      O && ke.preventDefault();
                    },
                    children: /* @__PURE__ */ Ee(
                      av.div,
                      {
                        className: Fo(
                          "w-full max-w-lg rounded-xl relative border border-ui-panel-border bg-ui-modal text-left align-middle shadow-2xl z-[70]",
                          f && !g ? "p-4" : "",
                          s,
                          "!transition-none",
                          // Always disable CSS transitions for spring animations
                          g && "w-screen h-screen max-w-screen max-h-screen rounded-none"
                        ),
                        ref: M,
                        style: {
                          ...z1(),
                          opacity: ie.opacity,
                          transform: ie.transform,
                          transformOrigin: "center center",
                          willChange: "transform, opacity"
                          // Optimize for animations
                        },
                        children: [
                          /* @__PURE__ */ Ee("div", { className: "w-full h-full", children: [
                            W && /* @__PURE__ */ L(vm, { asChild: !0, children: /* @__PURE__ */ L(Nw, { children: W }) }),
                            t ? /* @__PURE__ */ L(
                              vd,
                              {
                                className: Fo(
                                  "mb-4 flex justify-between pb-0 text-xl font-bold text-base-fg"
                                ),
                                children: /* @__PURE__ */ L(vt, { children: n ? /* @__PURE__ */ Ee(
                                  "button",
                                  {
                                    className: "flex items-center gap-3",
                                    onClick: n,
                                    children: [
                                      r && /* @__PURE__ */ L(
                                        ra,
                                        {
                                          icon: r,
                                          className: d
                                        }
                                      ),
                                      t
                                    ]
                                  }
                                ) : /* @__PURE__ */ Ee("div", { className: "flex items-center gap-3", children: [
                                  r && /* @__PURE__ */ L(
                                    ra,
                                    {
                                      icon: r,
                                      className: d
                                    }
                                  ),
                                  t
                                ] }) })
                              }
                            ) : /* @__PURE__ */ L(vm, { asChild: !0, children: /* @__PURE__ */ L(vd, { children: h ?? "Dialog" }) }),
                            /* @__PURE__ */ L("div", { className: "h-full".trim(), children: $ }),
                            ee()
                          ] }),
                          (b || E) && /* @__PURE__ */ Ee("div", { className: "absolute top-0 right-0 m-2.5 z-[80] flex items-center gap-2", children: [
                            E && /* @__PURE__ */ L(ao.ExpandButton, {}),
                            b && /* @__PURE__ */ L(jP, { onClick: o })
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
ao.DragHandle = Tc;
ao.DragHandle.displayName = "ModalDragHandle";
ao.ExpandButton = kf;
kf.displayName = "ModalExpandButton";
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function fA(e, t, r) {
  return (t = pA(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function xm(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function V(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? xm(Object(r), !0).forEach(function(n) {
      fA(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : xm(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function dA(e, t) {
  if (typeof e != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(e, t);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function pA(e) {
  var t = dA(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const wm = () => {
};
let Of = {}, lv = {}, cv = null, uv = {
  mark: wm,
  measure: wm
};
try {
  typeof window < "u" && (Of = window), typeof document < "u" && (lv = document), typeof MutationObserver < "u" && (cv = MutationObserver), typeof performance < "u" && (uv = performance);
} catch {
}
const {
  userAgent: km = ""
} = Of.navigator || {}, Fr = Of, Ge = lv, Om = cv, Wa = uv;
Fr.document;
const ir = !!Ge.documentElement && !!Ge.head && typeof Ge.addEventListener == "function" && typeof Ge.createElement == "function", fv = ~km.indexOf("MSIE") || ~km.indexOf("Trident/");
var mA = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, gA = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, dv = {
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
}, hA = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, pv = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Qe = "classic", ts = "duotone", bA = "sharp", yA = "sharp-duotone", mv = [Qe, ts, bA, yA], vA = {
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
}, xA = {
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
}, wA = /* @__PURE__ */ new Map([["classic", {
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
}]]), kA = {
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
}, OA = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Em = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, EA = ["kit"], PA = {
  kit: {
    "fa-kit": "fak"
  }
}, SA = ["fak", "fakd"], AA = {
  kit: {
    fak: "fa-kit"
  }
}, Pm = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Ua = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, CA = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], $A = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], NA = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, IA = {
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
}, TA = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, jc = {
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
}, jA = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], _c = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...CA, ...jA], _A = ["solid", "regular", "light", "thin", "duotone", "brands"], gv = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], MA = gv.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), zA = [...Object.keys(TA), ..._A, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Ua.GROUP, Ua.SWAP_OPACITY, Ua.PRIMARY, Ua.SECONDARY].concat(gv.map((e) => "".concat(e, "x"))).concat(MA.map((e) => "w-".concat(e))), RA = {
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
const er = "___FONT_AWESOME___", Mc = 16, hv = "fa", bv = "svg-inline--fa", ln = "data-fa-i2svg", zc = "data-fa-pseudo-element", FA = "data-fa-pseudo-element-pending", Ef = "data-prefix", Pf = "data-icon", Sm = "fontawesome-i2svg", LA = "async", DA = ["HTML", "HEAD", "STYLE", "SCRIPT"], yv = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Oa(e) {
  return new Proxy(e, {
    get(t, r) {
      return r in t ? t[r] : t[Qe];
    }
  });
}
const vv = V({}, dv);
vv[Qe] = V(V(V(V({}, {
  "fa-duotone": "duotone"
}), dv[Qe]), Em.kit), Em["kit-duotone"]);
const WA = Oa(vv), Rc = V({}, kA);
Rc[Qe] = V(V(V(V({}, {
  duotone: "fad"
}), Rc[Qe]), Pm.kit), Pm["kit-duotone"]);
const Am = Oa(Rc), Fc = V({}, jc);
Fc[Qe] = V(V({}, Fc[Qe]), AA.kit);
const Sf = Oa(Fc), Lc = V({}, IA);
Lc[Qe] = V(V({}, Lc[Qe]), PA.kit);
Oa(Lc);
const UA = mA, xv = "fa-layers-text", YA = gA, VA = V({}, vA);
Oa(VA);
const GA = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], ol = hA, qA = [...EA, ...zA], Ho = Fr.FontAwesomeConfig || {};
function HA(e) {
  var t = Ge.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function BA(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
Ge && typeof Ge.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, r] = e;
  const n = BA(HA(t));
  n != null && (Ho[r] = n);
});
const wv = {
  styleDefault: "solid",
  familyDefault: Qe,
  cssPrefix: hv,
  replacementClass: bv,
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
const Xn = V(V({}, wv), Ho);
Xn.autoReplaceSvg || (Xn.observeMutations = !1);
const ne = {};
Object.keys(wv).forEach((e) => {
  Object.defineProperty(ne, e, {
    enumerable: !0,
    set: function(t) {
      Xn[e] = t, Bo.forEach((r) => r(ne));
    },
    get: function() {
      return Xn[e];
    }
  });
});
Object.defineProperty(ne, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    Xn.cssPrefix = e, Bo.forEach((t) => t(ne));
  },
  get: function() {
    return Xn.cssPrefix;
  }
});
Fr.FontAwesomeConfig = ne;
const Bo = [];
function XA(e) {
  return Bo.push(e), () => {
    Bo.splice(Bo.indexOf(e), 1);
  };
}
const gr = Mc, _t = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function KA(e) {
  if (!e || !ir)
    return;
  const t = Ge.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const r = Ge.head.childNodes;
  let n = null;
  for (let o = r.length - 1; o > -1; o--) {
    const a = r[o], i = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (n = a);
  }
  return Ge.head.insertBefore(t, n), e;
}
const JA = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function pa() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += JA[Math.random() * 62 | 0];
  return t;
}
function io(e) {
  const t = [];
  for (let r = (e || []).length >>> 0; r--; )
    t[r] = e[r];
  return t;
}
function Af(e) {
  return e.classList ? io(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function kv(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function QA(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, '="').concat(kv(e[r]), '" '), "").trim();
}
function rs(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, ": ").concat(e[r].trim(), ";"), "");
}
function Cf(e) {
  return e.size !== _t.size || e.x !== _t.x || e.y !== _t.y || e.rotate !== _t.rotate || e.flipX || e.flipY;
}
function ZA(e) {
  let {
    transform: t,
    containerWidth: r,
    iconWidth: n
  } = e;
  const o = {
    transform: "translate(".concat(r / 2, " 256)")
  }, a = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), c = {
    transform: "".concat(a, " ").concat(i, " ").concat(s)
  }, l = {
    transform: "translate(".concat(n / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: c,
    path: l
  };
}
function e4(e) {
  let {
    transform: t,
    width: r = Mc,
    height: n = Mc,
    startCentered: o = !1
  } = e, a = "";
  return o && fv ? a += "translate(".concat(t.x / gr - r / 2, "em, ").concat(t.y / gr - n / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / gr, "em), calc(-50% + ").concat(t.y / gr, "em)) ") : a += "translate(".concat(t.x / gr, "em, ").concat(t.y / gr, "em) "), a += "scale(".concat(t.size / gr * (t.flipX ? -1 : 1), ", ").concat(t.size / gr * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var t4 = `:root, :host {
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
function Ov() {
  const e = hv, t = bv, r = ne.cssPrefix, n = ne.replacementClass;
  let o = t4;
  if (r !== e || n !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(r, "-")).replace(i, "--".concat(r, "-")).replace(s, ".".concat(n));
  }
  return o;
}
let Cm = !1;
function al() {
  ne.autoAddCss && !Cm && (KA(Ov()), Cm = !0);
}
var r4 = {
  mixout() {
    return {
      dom: {
        css: Ov,
        insertCss: al
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        al();
      },
      beforeI2svg() {
        al();
      }
    };
  }
};
const tr = Fr || {};
tr[er] || (tr[er] = {});
tr[er].styles || (tr[er].styles = {});
tr[er].hooks || (tr[er].hooks = {});
tr[er].shims || (tr[er].shims = []);
var Mt = tr[er];
const Ev = [], Pv = function() {
  Ge.removeEventListener("DOMContentLoaded", Pv), Si = 1, Ev.map((e) => e());
};
let Si = !1;
ir && (Si = (Ge.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(Ge.readyState), Si || Ge.addEventListener("DOMContentLoaded", Pv));
function n4(e) {
  ir && (Si ? setTimeout(e, 0) : Ev.push(e));
}
function Ea(e) {
  const {
    tag: t,
    attributes: r = {},
    children: n = []
  } = e;
  return typeof e == "string" ? kv(e) : "<".concat(t, " ").concat(QA(r), ">").concat(n.map(Ea).join(""), "</").concat(t, ">");
}
function $m(e, t, r) {
  if (e && e[t] && e[t][r])
    return {
      prefix: t,
      iconName: r,
      icon: e[t][r]
    };
}
var il = function(e, t, r, n) {
  var o = Object.keys(e), a = o.length, i = t, s, c, l;
  for (r === void 0 ? (s = 1, l = e[o[0]]) : (s = 0, l = r); s < a; s++)
    c = o[s], l = i(l, e[c], c, e);
  return l;
};
function o4(e) {
  const t = [];
  let r = 0;
  const n = e.length;
  for (; r < n; ) {
    const o = e.charCodeAt(r++);
    if (o >= 55296 && o <= 56319 && r < n) {
      const a = e.charCodeAt(r++);
      (a & 64512) == 56320 ? t.push(((o & 1023) << 10) + (a & 1023) + 65536) : (t.push(o), r--);
    } else
      t.push(o);
  }
  return t;
}
function Sv(e) {
  const t = o4(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function a4(e, t) {
  const r = e.length;
  let n = e.charCodeAt(t), o;
  return n >= 55296 && n <= 56319 && r > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (n - 55296) * 1024 + o - 56320 + 65536 : n;
}
function Nm(e) {
  return Object.keys(e).reduce((t, r) => {
    const n = e[r];
    return n.icon ? t[n.iconName] = n.icon : t[r] = n, t;
  }, {});
}
function Dc(e, t) {
  let r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: n = !1
  } = r, o = Nm(t);
  typeof Mt.hooks.addPack == "function" && !n ? Mt.hooks.addPack(e, Nm(t)) : Mt.styles[e] = V(V({}, Mt.styles[e] || {}), o), e === "fas" && Dc("fa", t);
}
const {
  styles: ma,
  shims: i4
} = Mt, Av = Object.keys(Sf), s4 = Av.reduce((e, t) => (e[t] = Object.keys(Sf[t]), e), {});
let $f = null, Cv = {}, $v = {}, Nv = {}, Iv = {}, Tv = {};
function l4(e) {
  return ~qA.indexOf(e);
}
function c4(e, t) {
  const r = t.split("-"), n = r[0], o = r.slice(1).join("-");
  return n === e && o !== "" && !l4(o) ? o : null;
}
const jv = () => {
  const e = (n) => il(ma, (o, a, i) => (o[i] = il(a, n, {}), o), {});
  Cv = e((n, o, a) => (o[3] && (n[o[3]] = a), o[2] && o[2].filter((i) => typeof i == "number").forEach((i) => {
    n[i.toString(16)] = a;
  }), n)), $v = e((n, o, a) => (n[a] = a, o[2] && o[2].filter((i) => typeof i == "string").forEach((i) => {
    n[i] = a;
  }), n)), Tv = e((n, o, a) => {
    const i = o[2];
    return n[a] = a, i.forEach((s) => {
      n[s] = a;
    }), n;
  });
  const t = "far" in ma || ne.autoFetchSvg, r = il(i4, (n, o) => {
    const a = o[0];
    let i = o[1];
    const s = o[2];
    return i === "far" && !t && (i = "fas"), typeof a == "string" && (n.names[a] = {
      prefix: i,
      iconName: s
    }), typeof a == "number" && (n.unicodes[a.toString(16)] = {
      prefix: i,
      iconName: s
    }), n;
  }, {
    names: {},
    unicodes: {}
  });
  Nv = r.names, Iv = r.unicodes, $f = ns(ne.styleDefault, {
    family: ne.familyDefault
  });
};
XA((e) => {
  $f = ns(e.styleDefault, {
    family: ne.familyDefault
  });
});
jv();
function Nf(e, t) {
  return (Cv[e] || {})[t];
}
function u4(e, t) {
  return ($v[e] || {})[t];
}
function Kr(e, t) {
  return (Tv[e] || {})[t];
}
function _v(e) {
  return Nv[e] || {
    prefix: null,
    iconName: null
  };
}
function f4(e) {
  const t = Iv[e], r = Nf("fas", e);
  return t || (r ? {
    prefix: "fas",
    iconName: r
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Lr() {
  return $f;
}
const Mv = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function d4(e) {
  let t = Qe;
  const r = Av.reduce((n, o) => (n[o] = "".concat(ne.cssPrefix, "-").concat(o), n), {});
  return mv.forEach((n) => {
    (e.includes(r[n]) || e.some((o) => s4[n].includes(o))) && (t = n);
  }), t;
}
function ns(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: r = Qe
  } = t, n = WA[r][e];
  if (r === ts && !e)
    return "fad";
  const o = Am[r][e] || Am[r][n], a = e in Mt.styles ? e : null;
  return o || a || null;
}
function p4(e) {
  let t = [], r = null;
  return e.forEach((n) => {
    const o = c4(ne.cssPrefix, n);
    o ? r = o : n && t.push(n);
  }), {
    iconName: r,
    rest: t
  };
}
function Im(e) {
  return e.sort().filter((t, r, n) => n.indexOf(t) === r);
}
function os(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: r = !1
  } = t;
  let n = null;
  const o = _c.concat($A), a = Im(e.filter((f) => o.includes(f))), i = Im(e.filter((f) => !_c.includes(f))), s = a.filter((f) => (n = f, !pv.includes(f))), [c = null] = s, l = d4(a), u = V(V({}, p4(i)), {}, {
    prefix: ns(c, {
      family: l
    })
  });
  return V(V(V({}, u), b4({
    values: e,
    family: l,
    styles: ma,
    config: ne,
    canonical: u,
    givenPrefix: n
  })), m4(r, n, u));
}
function m4(e, t, r) {
  let {
    prefix: n,
    iconName: o
  } = r;
  if (e || !n || !o)
    return {
      prefix: n,
      iconName: o
    };
  const a = t === "fa" ? _v(o) : {}, i = Kr(n, o);
  return o = a.iconName || i || o, n = a.prefix || n, n === "far" && !ma.far && ma.fas && !ne.autoFetchSvg && (n = "fas"), {
    prefix: n,
    iconName: o
  };
}
const g4 = mv.filter((e) => e !== Qe || e !== ts), h4 = Object.keys(jc).filter((e) => e !== Qe).map((e) => Object.keys(jc[e])).flat();
function b4(e) {
  const {
    values: t,
    family: r,
    canonical: n,
    givenPrefix: o = "",
    styles: a = {},
    config: i = {}
  } = e, s = r === ts, c = t.includes("fa-duotone") || t.includes("fad"), l = i.familyDefault === "duotone", u = n.prefix === "fad" || n.prefix === "fa-duotone";
  if (!s && (c || l || u) && (n.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (n.prefix = "fab"), !n.prefix && g4.includes(r) && (Object.keys(a).find((f) => h4.includes(f)) || i.autoFetchSvg)) {
    const f = wA.get(r).defaultShortPrefixId;
    n.prefix = f, n.iconName = Kr(n.prefix, n.iconName) || n.iconName;
  }
  return (n.prefix === "fa" || o === "fa") && (n.prefix = Lr() || "fas"), n;
}
class y4 {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
      r[n] = arguments[n];
    const o = r.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = V(V({}, this.definitions[a] || {}), o[a]), Dc(a, o[a]);
      const i = Sf[Qe][a];
      i && Dc(i, o[a]), jv();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, r) {
    const n = r.prefix && r.iconName && r.icon ? {
      0: r
    } : r;
    return Object.keys(n).map((o) => {
      const {
        prefix: a,
        iconName: i,
        icon: s
      } = n[o], c = s[2];
      t[a] || (t[a] = {}), c.length > 0 && c.forEach((l) => {
        typeof l == "string" && (t[a][l] = s);
      }), t[a][i] = s;
    }), t;
  }
}
let Tm = [], Cn = {};
const Dn = {}, v4 = Object.keys(Dn);
function x4(e, t) {
  let {
    mixoutsTo: r
  } = t;
  return Tm = e, Cn = {}, Object.keys(Dn).forEach((n) => {
    v4.indexOf(n) === -1 && delete Dn[n];
  }), Tm.forEach((n) => {
    const o = n.mixout ? n.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (r[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((i) => {
        r[a] || (r[a] = {}), r[a][i] = o[a][i];
      });
    }), n.hooks) {
      const a = n.hooks();
      Object.keys(a).forEach((i) => {
        Cn[i] || (Cn[i] = []), Cn[i].push(a[i]);
      });
    }
    n.provides && n.provides(Dn);
  }), r;
}
function Wc(e, t) {
  for (var r = arguments.length, n = new Array(r > 2 ? r - 2 : 0), o = 2; o < r; o++)
    n[o - 2] = arguments[o];
  return (Cn[e] || []).forEach((a) => {
    t = a.apply(null, [t, ...n]);
  }), t;
}
function cn(e) {
  for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++)
    r[n - 1] = arguments[n];
  (Cn[e] || []).forEach((o) => {
    o.apply(null, r);
  });
}
function Dr() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Dn[e] ? Dn[e].apply(null, t) : void 0;
}
function Uc(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const r = e.prefix || Lr();
  if (t)
    return t = Kr(r, t) || t, $m(zv.definitions, r, t) || $m(Mt.styles, r, t);
}
const zv = new y4(), w4 = () => {
  ne.autoReplaceSvg = !1, ne.observeMutations = !1, cn("noAuto");
}, k4 = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return ir ? (cn("beforeI2svg", e), Dr("pseudoElements2svg", e), Dr("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    ne.autoReplaceSvg === !1 && (ne.autoReplaceSvg = !0), ne.observeMutations = !0, n4(() => {
      E4({
        autoReplaceSvgRoot: t
      }), cn("watch", e);
    });
  }
}, O4 = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Kr(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], r = ns(e[0]);
      return {
        prefix: r,
        iconName: Kr(r, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(ne.cssPrefix, "-")) > -1 || e.match(UA))) {
      const t = os(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Lr(),
        iconName: Kr(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Lr();
      return {
        prefix: t,
        iconName: Kr(t, e) || e
      };
    }
  }
}, st = {
  noAuto: w4,
  config: ne,
  dom: k4,
  parse: O4,
  library: zv,
  findIconDefinition: Uc,
  toHtml: Ea
}, E4 = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = Ge
  } = e;
  (Object.keys(Mt.styles).length > 0 || ne.autoFetchSvg) && ir && ne.autoReplaceSvg && st.dom.i2svg({
    node: t
  });
};
function as(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((r) => Ea(r));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!ir) return;
      const r = Ge.createElement("div");
      return r.innerHTML = e.html, r.children;
    }
  }), e;
}
function P4(e) {
  let {
    children: t,
    main: r,
    mask: n,
    attributes: o,
    styles: a,
    transform: i
  } = e;
  if (Cf(i) && r.found && !n.found) {
    const {
      width: s,
      height: c
    } = r, l = {
      x: s / c / 2,
      y: 0.5
    };
    o.style = rs(V(V({}, a), {}, {
      "transform-origin": "".concat(l.x + i.x / 16, "em ").concat(l.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function S4(e) {
  let {
    prefix: t,
    iconName: r,
    children: n,
    attributes: o,
    symbol: a
  } = e;
  const i = a === !0 ? "".concat(t, "-").concat(ne.cssPrefix, "-").concat(r) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: V(V({}, o), {}, {
        id: i
      }),
      children: n
    }]
  }];
}
function If(e) {
  const {
    icons: {
      main: t,
      mask: r
    },
    prefix: n,
    iconName: o,
    transform: a,
    symbol: i,
    title: s,
    maskId: c,
    titleId: l,
    extra: u,
    watchable: f = !1
  } = e, {
    width: d,
    height: b
  } = r.found ? r : t, y = SA.includes(n), p = [ne.replacementClass, o ? "".concat(ne.cssPrefix, "-").concat(o) : ""].filter((h) => u.classes.indexOf(h) === -1).filter((h) => h !== "" || !!h).concat(u.classes).join(" ");
  let m = {
    children: [],
    attributes: V(V({}, u.attributes), {}, {
      "data-prefix": n,
      "data-icon": o,
      class: p,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(d, " ").concat(b)
    })
  };
  const x = y && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(d / b * 16 * 0.0625, "em")
  } : {};
  f && (m.attributes[ln] = ""), s && (m.children.push({
    tag: "title",
    attributes: {
      id: m.attributes["aria-labelledby"] || "title-".concat(l || pa())
    },
    children: [s]
  }), delete m.attributes.title);
  const w = V(V({}, m), {}, {
    prefix: n,
    iconName: o,
    main: t,
    mask: r,
    maskId: c,
    transform: a,
    symbol: i,
    styles: V(V({}, x), u.styles)
  }), {
    children: O,
    attributes: E
  } = r.found && t.found ? Dr("generateAbstractMask", w) || {
    children: [],
    attributes: {}
  } : Dr("generateAbstractIcon", w) || {
    children: [],
    attributes: {}
  };
  return w.children = O, w.attributes = E, i ? S4(w) : P4(w);
}
function jm(e) {
  const {
    content: t,
    width: r,
    height: n,
    transform: o,
    title: a,
    extra: i,
    watchable: s = !1
  } = e, c = V(V(V({}, i.attributes), a ? {
    title: a
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[ln] = "");
  const l = V({}, i.styles);
  Cf(o) && (l.transform = e4({
    transform: o,
    startCentered: !0,
    width: r,
    height: n
  }), l["-webkit-transform"] = l.transform);
  const u = rs(l);
  u.length > 0 && (c.style = u);
  const f = [];
  return f.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), a && f.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [a]
  }), f;
}
function A4(e) {
  const {
    content: t,
    title: r,
    extra: n
  } = e, o = V(V(V({}, n.attributes), r ? {
    title: r
  } : {}), {}, {
    class: n.classes.join(" ")
  }), a = rs(n.styles);
  a.length > 0 && (o.style = a);
  const i = [];
  return i.push({
    tag: "span",
    attributes: o,
    children: [t]
  }), r && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [r]
  }), i;
}
const {
  styles: sl
} = Mt;
function Yc(e) {
  const t = e[0], r = e[1], [n] = e.slice(4);
  let o = null;
  return Array.isArray(n) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(ne.cssPrefix, "-").concat(ol.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(ne.cssPrefix, "-").concat(ol.SECONDARY),
        fill: "currentColor",
        d: n[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(ne.cssPrefix, "-").concat(ol.PRIMARY),
        fill: "currentColor",
        d: n[1]
      }
    }]
  } : o = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: n
    }
  }, {
    found: !0,
    width: t,
    height: r,
    icon: o
  };
}
const C4 = {
  found: !1,
  width: 512,
  height: 512
};
function $4(e, t) {
  !yv && !ne.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Vc(e, t) {
  let r = t;
  return t === "fa" && ne.styleDefault !== null && (t = Lr()), new Promise((n, o) => {
    if (r === "fa") {
      const a = _v(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && sl[t] && sl[t][e]) {
      const a = sl[t][e];
      return n(Yc(a));
    }
    $4(e, t), n(V(V({}, C4), {}, {
      icon: ne.showMissingIcons && e ? Dr("missingIconAbstract") || {} : {}
    }));
  });
}
const _m = () => {
}, Gc = ne.measurePerformance && Wa && Wa.mark && Wa.measure ? Wa : {
  mark: _m,
  measure: _m
}, _o = 'FA "6.7.2"', N4 = (e) => (Gc.mark("".concat(_o, " ").concat(e, " begins")), () => Rv(e)), Rv = (e) => {
  Gc.mark("".concat(_o, " ").concat(e, " ends")), Gc.measure("".concat(_o, " ").concat(e), "".concat(_o, " ").concat(e, " begins"), "".concat(_o, " ").concat(e, " ends"));
};
var Tf = {
  begin: N4,
  end: Rv
};
const ai = () => {
};
function Mm(e) {
  return typeof (e.getAttribute ? e.getAttribute(ln) : null) == "string";
}
function I4(e) {
  const t = e.getAttribute ? e.getAttribute(Ef) : null, r = e.getAttribute ? e.getAttribute(Pf) : null;
  return t && r;
}
function T4(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(ne.replacementClass);
}
function j4() {
  return ne.autoReplaceSvg === !0 ? ii.replace : ii[ne.autoReplaceSvg] || ii.replace;
}
function _4(e) {
  return Ge.createElementNS("http://www.w3.org/2000/svg", e);
}
function M4(e) {
  return Ge.createElement(e);
}
function Fv(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: r = e.tag === "svg" ? _4 : M4
  } = t;
  if (typeof e == "string")
    return Ge.createTextNode(e);
  const n = r(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    n.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    n.appendChild(Fv(o, {
      ceFn: r
    }));
  }), n;
}
function z4(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const ii = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((r) => {
        t.parentNode.insertBefore(Fv(r), t);
      }), t.getAttribute(ln) === null && ne.keepOriginalSource) {
        let r = Ge.createComment(z4(t));
        t.parentNode.replaceChild(r, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], r = e[1];
    if (~Af(t).indexOf(ne.replacementClass))
      return ii.replace(e);
    const n = new RegExp("".concat(ne.cssPrefix, "-.*"));
    if (delete r[0].attributes.id, r[0].attributes.class) {
      const a = r[0].attributes.class.split(" ").reduce((i, s) => (s === ne.replacementClass || s.match(n) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      r[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = r.map((a) => Ea(a)).join(`
`);
    t.setAttribute(ln, ""), t.innerHTML = o;
  }
};
function zm(e) {
  e();
}
function Lv(e, t) {
  const r = typeof t == "function" ? t : ai;
  if (e.length === 0)
    r();
  else {
    let n = zm;
    ne.mutateApproach === LA && (n = Fr.requestAnimationFrame || zm), n(() => {
      const o = j4(), a = Tf.begin("mutate");
      e.map(o), a(), r();
    });
  }
}
let jf = !1;
function Dv() {
  jf = !0;
}
function qc() {
  jf = !1;
}
let Ai = null;
function Rm(e) {
  if (!Om || !ne.observeMutations)
    return;
  const {
    treeCallback: t = ai,
    nodeCallback: r = ai,
    pseudoElementsCallback: n = ai,
    observeMutationsRoot: o = Ge
  } = e;
  Ai = new Om((a) => {
    if (jf) return;
    const i = Lr();
    io(a).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Mm(s.addedNodes[0]) && (ne.searchPseudoElements && n(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && ne.searchPseudoElements && n(s.target.parentNode), s.type === "attributes" && Mm(s.target) && ~GA.indexOf(s.attributeName))
        if (s.attributeName === "class" && I4(s.target)) {
          const {
            prefix: c,
            iconName: l
          } = os(Af(s.target));
          s.target.setAttribute(Ef, c || i), l && s.target.setAttribute(Pf, l);
        } else T4(s.target) && r(s.target);
    });
  }), ir && Ai.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function R4() {
  Ai && Ai.disconnect();
}
function F4(e) {
  const t = e.getAttribute("style");
  let r = [];
  return t && (r = t.split(";").reduce((n, o) => {
    const a = o.split(":"), i = a[0], s = a.slice(1);
    return i && s.length > 0 && (n[i] = s.join(":").trim()), n;
  }, {})), r;
}
function L4(e) {
  const t = e.getAttribute("data-prefix"), r = e.getAttribute("data-icon"), n = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = os(Af(e));
  return o.prefix || (o.prefix = Lr()), t && r && (o.prefix = t, o.iconName = r), o.iconName && o.prefix || (o.prefix && n.length > 0 && (o.iconName = u4(o.prefix, e.innerText) || Nf(o.prefix, Sv(e.innerText))), !o.iconName && ne.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function D4(e) {
  const t = io(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), r = e.getAttribute("title"), n = e.getAttribute("data-fa-title-id");
  return ne.autoA11y && (r ? t["aria-labelledby"] = "".concat(ne.replacementClass, "-title-").concat(n || pa()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function W4() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: _t,
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
function Fm(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: r,
    prefix: n,
    rest: o
  } = L4(e), a = D4(e), i = Wc("parseNodeAttributes", {}, e);
  let s = t.styleParser ? F4(e) : [];
  return V({
    iconName: r,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: n,
    transform: _t,
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
  styles: U4
} = Mt;
function Wv(e) {
  const t = ne.autoReplaceSvg === "nest" ? Fm(e, {
    styleParser: !1
  }) : Fm(e);
  return ~t.extra.classes.indexOf(xv) ? Dr("generateLayersText", e, t) : Dr("generateSvgReplacementMutation", e, t);
}
function Y4() {
  return [...OA, ..._c];
}
function Lm(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!ir) return Promise.resolve();
  const r = Ge.documentElement.classList, n = (u) => r.add("".concat(Sm, "-").concat(u)), o = (u) => r.remove("".concat(Sm, "-").concat(u)), a = ne.autoFetchSvg ? Y4() : pv.concat(Object.keys(U4));
  a.includes("fa") || a.push("fa");
  const i = [".".concat(xv, ":not([").concat(ln, "])")].concat(a.map((u) => ".".concat(u, ":not([").concat(ln, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = io(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    n("pending"), o("complete");
  else
    return Promise.resolve();
  const c = Tf.begin("onTree"), l = s.reduce((u, f) => {
    try {
      const d = Wv(f);
      d && u.push(d);
    } catch (d) {
      yv || d.name === "MissingIcon" && console.error(d);
    }
    return u;
  }, []);
  return new Promise((u, f) => {
    Promise.all(l).then((d) => {
      Lv(d, () => {
        n("active"), n("complete"), o("pending"), typeof t == "function" && t(), c(), u();
      });
    }).catch((d) => {
      c(), f(d);
    });
  });
}
function V4(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  Wv(e).then((r) => {
    r && Lv([r], t);
  });
}
function G4(e) {
  return function(t) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const n = (t || {}).icon ? t : Uc(t || {});
    let {
      mask: o
    } = r;
    return o && (o = (o || {}).icon ? o : Uc(o || {})), e(n, V(V({}, r), {}, {
      mask: o
    }));
  };
}
const q4 = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: r = _t,
    symbol: n = !1,
    mask: o = null,
    maskId: a = null,
    title: i = null,
    titleId: s = null,
    classes: c = [],
    attributes: l = {},
    styles: u = {}
  } = t;
  if (!e) return;
  const {
    prefix: f,
    iconName: d,
    icon: b
  } = e;
  return as(V({
    type: "icon"
  }, e), () => (cn("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), ne.autoA11y && (i ? l["aria-labelledby"] = "".concat(ne.replacementClass, "-title-").concat(s || pa()) : (l["aria-hidden"] = "true", l.focusable = "false")), If({
    icons: {
      main: Yc(b),
      mask: o ? Yc(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: f,
    iconName: d,
    transform: V(V({}, _t), r),
    symbol: n,
    title: i,
    maskId: a,
    titleId: s,
    extra: {
      attributes: l,
      styles: u,
      classes: c
    }
  })));
};
var H4 = {
  mixout() {
    return {
      icon: G4(q4)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Lm, e.nodeCallback = V4, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: r = Ge,
        callback: n = () => {
        }
      } = t;
      return Lm(r, n);
    }, e.generateSvgReplacementMutation = function(t, r) {
      const {
        iconName: n,
        title: o,
        titleId: a,
        prefix: i,
        transform: s,
        symbol: c,
        mask: l,
        maskId: u,
        extra: f
      } = r;
      return new Promise((d, b) => {
        Promise.all([Vc(n, i), l.iconName ? Vc(l.iconName, l.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((y) => {
          let [p, m] = y;
          d([t, If({
            icons: {
              main: p,
              mask: m
            },
            prefix: i,
            iconName: n,
            transform: s,
            symbol: c,
            maskId: u,
            title: o,
            titleId: a,
            extra: f,
            watchable: !0
          })]);
        }).catch(b);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: r,
        attributes: n,
        main: o,
        transform: a,
        styles: i
      } = t;
      const s = rs(i);
      s.length > 0 && (n.style = s);
      let c;
      return Cf(a) && (c = Dr("generateAbstractTransformGrouping", {
        main: o,
        transform: a,
        containerWidth: o.width,
        iconWidth: o.width
      })), r.push(c || o.icon), {
        children: r,
        attributes: n
      };
    };
  }
}, B4 = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: r = []
        } = t;
        return as({
          type: "layer"
        }, () => {
          cn("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let n = [];
          return e((o) => {
            Array.isArray(o) ? o.map((a) => {
              n = n.concat(a.abstract);
            }) : n = n.concat(o.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(ne.cssPrefix, "-layers"), ...r].join(" ")
            },
            children: n
          }];
        });
      }
    };
  }
}, X4 = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: r = null,
          classes: n = [],
          attributes: o = {},
          styles: a = {}
        } = t;
        return as({
          type: "counter",
          content: e
        }, () => (cn("beforeDOMElementCreation", {
          content: e,
          params: t
        }), A4({
          content: e.toString(),
          title: r,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(ne.cssPrefix, "-layers-counter"), ...n]
          }
        })));
      }
    };
  }
}, K4 = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: r = _t,
          title: n = null,
          classes: o = [],
          attributes: a = {},
          styles: i = {}
        } = t;
        return as({
          type: "text",
          content: e
        }, () => (cn("beforeDOMElementCreation", {
          content: e,
          params: t
        }), jm({
          content: e,
          transform: V(V({}, _t), r),
          title: n,
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
    e.generateLayersText = function(t, r) {
      const {
        title: n,
        transform: o,
        extra: a
      } = r;
      let i = null, s = null;
      if (fv) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), l = t.getBoundingClientRect();
        i = l.width / c, s = l.height / c;
      }
      return ne.autoA11y && !n && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, jm({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: o,
        title: n,
        extra: a,
        watchable: !0
      })]);
    };
  }
};
const J4 = new RegExp('"', "ug"), Dm = [1105920, 1112319], Wm = V(V(V(V({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), xA), RA), NA), Hc = Object.keys(Wm).reduce((e, t) => (e[t.toLowerCase()] = Wm[t], e), {}), Q4 = Object.keys(Hc).reduce((e, t) => {
  const r = Hc[t];
  return e[t] = r[900] || [...Object.entries(r)][0][1], e;
}, {});
function Z4(e) {
  const t = e.replace(J4, ""), r = a4(t, 0), n = r >= Dm[0] && r <= Dm[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: Sv(o ? t[0] : t),
    isSecondary: n || o
  };
}
function eC(e, t) {
  const r = e.replace(/^['"]|['"]$/g, "").toLowerCase(), n = parseInt(t), o = isNaN(n) ? "normal" : n;
  return (Hc[r] || {})[o] || Q4[r];
}
function Um(e, t) {
  const r = "".concat(FA).concat(t.replace(":", "-"));
  return new Promise((n, o) => {
    if (e.getAttribute(r) !== null)
      return n();
    const a = io(e.children).filter((f) => f.getAttribute(zc) === t)[0], i = Fr.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), c = s.match(YA), l = i.getPropertyValue("font-weight"), u = i.getPropertyValue("content");
    if (a && !c)
      return e.removeChild(a), n();
    if (c && u !== "none" && u !== "") {
      const f = i.getPropertyValue("content");
      let d = eC(s, l);
      const {
        value: b,
        isSecondary: y
      } = Z4(f), p = c[0].startsWith("FontAwesome");
      let m = Nf(d, b), x = m;
      if (p) {
        const w = f4(b);
        w.iconName && w.prefix && (m = w.iconName, d = w.prefix);
      }
      if (m && !y && (!a || a.getAttribute(Ef) !== d || a.getAttribute(Pf) !== x)) {
        e.setAttribute(r, x), a && e.removeChild(a);
        const w = W4(), {
          extra: O
        } = w;
        O.attributes[zc] = t, Vc(m, d).then((E) => {
          const h = If(V(V({}, w), {}, {
            icons: {
              main: E,
              mask: Mv()
            },
            prefix: d,
            iconName: x,
            extra: O,
            watchable: !0
          })), W = Ge.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(W, e.firstChild) : e.appendChild(W), W.outerHTML = h.map((F) => Ea(F)).join(`
`), e.removeAttribute(r), n();
        }).catch(o);
      } else
        n();
    } else
      n();
  });
}
function tC(e) {
  return Promise.all([Um(e, "::before"), Um(e, "::after")]);
}
function rC(e) {
  return e.parentNode !== document.head && !~DA.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(zc) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Ym(e) {
  if (ir)
    return new Promise((t, r) => {
      const n = io(e.querySelectorAll("*")).filter(rC).map(tC), o = Tf.begin("searchPseudoElements");
      Dv(), Promise.all(n).then(() => {
        o(), qc(), t();
      }).catch(() => {
        o(), qc(), r();
      });
    });
}
var nC = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Ym, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: r = Ge
      } = t;
      ne.searchPseudoElements && Ym(r);
    };
  }
};
let Vm = !1;
var oC = {
  mixout() {
    return {
      dom: {
        unwatch() {
          Dv(), Vm = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Rm(Wc("mutationObserverCallbacks", {}));
      },
      noAuto() {
        R4();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Vm ? qc() : Rm(Wc("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Gm = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((r, n) => {
    const o = n.toLowerCase().split("-"), a = o[0];
    let i = o.slice(1).join("-");
    if (a && i === "h")
      return r.flipX = !0, r;
    if (a && i === "v")
      return r.flipY = !0, r;
    if (i = parseFloat(i), isNaN(i))
      return r;
    switch (a) {
      case "grow":
        r.size = r.size + i;
        break;
      case "shrink":
        r.size = r.size - i;
        break;
      case "left":
        r.x = r.x - i;
        break;
      case "right":
        r.x = r.x + i;
        break;
      case "up":
        r.y = r.y - i;
        break;
      case "down":
        r.y = r.y + i;
        break;
      case "rotate":
        r.rotate = r.rotate + i;
        break;
    }
    return r;
  }, t);
};
var aC = {
  mixout() {
    return {
      parse: {
        transform: (e) => Gm(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-transform");
        return r && (e.transform = Gm(r)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: r,
        transform: n,
        containerWidth: o,
        iconWidth: a
      } = t;
      const i = {
        transform: "translate(".concat(o / 2, " 256)")
      }, s = "translate(".concat(n.x * 32, ", ").concat(n.y * 32, ") "), c = "scale(".concat(n.size / 16 * (n.flipX ? -1 : 1), ", ").concat(n.size / 16 * (n.flipY ? -1 : 1), ") "), l = "rotate(".concat(n.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(c, " ").concat(l)
      }, f = {
        transform: "translate(".concat(a / 2 * -1, " -256)")
      }, d = {
        outer: i,
        inner: u,
        path: f
      };
      return {
        tag: "g",
        attributes: V({}, d.outer),
        children: [{
          tag: "g",
          attributes: V({}, d.inner),
          children: [{
            tag: r.icon.tag,
            children: r.icon.children,
            attributes: V(V({}, r.icon.attributes), d.path)
          }]
        }]
      };
    };
  }
};
const ll = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function qm(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function iC(e) {
  return e.tag === "g" ? e.children : [e];
}
var sC = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-mask"), n = r ? os(r.split(" ").map((o) => o.trim())) : Mv();
        return n.prefix || (n.prefix = Lr()), e.mask = n, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: r,
        attributes: n,
        main: o,
        mask: a,
        maskId: i,
        transform: s
      } = t;
      const {
        width: c,
        icon: l
      } = o, {
        width: u,
        icon: f
      } = a, d = ZA({
        transform: s,
        containerWidth: u,
        iconWidth: c
      }), b = {
        tag: "rect",
        attributes: V(V({}, ll), {}, {
          fill: "white"
        })
      }, y = l.children ? {
        children: l.children.map(qm)
      } : {}, p = {
        tag: "g",
        attributes: V({}, d.inner),
        children: [qm(V({
          tag: l.tag,
          attributes: V(V({}, l.attributes), d.path)
        }, y))]
      }, m = {
        tag: "g",
        attributes: V({}, d.outer),
        children: [p]
      }, x = "mask-".concat(i || pa()), w = "clip-".concat(i || pa()), O = {
        tag: "mask",
        attributes: V(V({}, ll), {}, {
          id: x,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [b, m]
      }, E = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: w
          },
          children: iC(f)
        }, O]
      };
      return r.push(E, {
        tag: "rect",
        attributes: V({
          fill: "currentColor",
          "clip-path": "url(#".concat(w, ")"),
          mask: "url(#".concat(x, ")")
        }, ll)
      }), {
        children: r,
        attributes: n
      };
    };
  }
}, lC = {
  provides(e) {
    let t = !1;
    Fr.matchMedia && (t = Fr.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const r = [], n = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      r.push({
        tag: "path",
        attributes: V(V({}, n), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = V(V({}, o), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: V(V({}, n), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: V(V({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: V(V({}, a), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), r.push(i), r.push({
        tag: "path",
        attributes: V(V({}, n), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: V(V({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || r.push({
        tag: "path",
        attributes: V(V({}, n), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: V(V({}, a), {}, {
            values: "0;0;1;1;0;0;"
          })
        }]
      }), {
        tag: "g",
        attributes: {
          class: "missing"
        },
        children: r
      };
    };
  }
}, cC = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-symbol"), n = r === null ? !1 : r === "" ? !0 : r;
        return e.symbol = n, e;
      }
    };
  }
}, uC = [r4, H4, B4, X4, K4, nC, oC, aC, sC, lC, cC];
x4(uC, {
  mixoutsTo: st
});
st.noAuto;
st.config;
st.library;
st.dom;
const Bc = st.parse;
st.findIconDefinition;
st.toHtml;
const fC = st.icon;
st.layer;
st.text;
st.counter;
function dC(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Ya = { exports: {} }, cl = { exports: {} }, Ae = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Hm;
function pC() {
  if (Hm) return Ae;
  Hm = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, y = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, x = e ? Symbol.for("react.responder") : 60118, w = e ? Symbol.for("react.scope") : 60119;
  function O(h) {
    if (typeof h == "object" && h !== null) {
      var W = h.$$typeof;
      switch (W) {
        case t:
          switch (h = h.type, h) {
            case c:
            case l:
            case n:
            case a:
            case o:
            case f:
              return h;
            default:
              switch (h = h && h.$$typeof, h) {
                case s:
                case u:
                case y:
                case b:
                case i:
                  return h;
                default:
                  return W;
              }
          }
        case r:
          return W;
      }
    }
  }
  function E(h) {
    return O(h) === l;
  }
  return Ae.AsyncMode = c, Ae.ConcurrentMode = l, Ae.ContextConsumer = s, Ae.ContextProvider = i, Ae.Element = t, Ae.ForwardRef = u, Ae.Fragment = n, Ae.Lazy = y, Ae.Memo = b, Ae.Portal = r, Ae.Profiler = a, Ae.StrictMode = o, Ae.Suspense = f, Ae.isAsyncMode = function(h) {
    return E(h) || O(h) === c;
  }, Ae.isConcurrentMode = E, Ae.isContextConsumer = function(h) {
    return O(h) === s;
  }, Ae.isContextProvider = function(h) {
    return O(h) === i;
  }, Ae.isElement = function(h) {
    return typeof h == "object" && h !== null && h.$$typeof === t;
  }, Ae.isForwardRef = function(h) {
    return O(h) === u;
  }, Ae.isFragment = function(h) {
    return O(h) === n;
  }, Ae.isLazy = function(h) {
    return O(h) === y;
  }, Ae.isMemo = function(h) {
    return O(h) === b;
  }, Ae.isPortal = function(h) {
    return O(h) === r;
  }, Ae.isProfiler = function(h) {
    return O(h) === a;
  }, Ae.isStrictMode = function(h) {
    return O(h) === o;
  }, Ae.isSuspense = function(h) {
    return O(h) === f;
  }, Ae.isValidElementType = function(h) {
    return typeof h == "string" || typeof h == "function" || h === n || h === l || h === a || h === o || h === f || h === d || typeof h == "object" && h !== null && (h.$$typeof === y || h.$$typeof === b || h.$$typeof === i || h.$$typeof === s || h.$$typeof === u || h.$$typeof === m || h.$$typeof === x || h.$$typeof === w || h.$$typeof === p);
  }, Ae.typeOf = O, Ae;
}
var je = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Bm;
function mC() {
  return Bm || (Bm = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, y = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, x = e ? Symbol.for("react.responder") : 60118, w = e ? Symbol.for("react.scope") : 60119;
    function O(k) {
      return typeof k == "string" || typeof k == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      k === n || k === l || k === a || k === o || k === f || k === d || typeof k == "object" && k !== null && (k.$$typeof === y || k.$$typeof === b || k.$$typeof === i || k.$$typeof === s || k.$$typeof === u || k.$$typeof === m || k.$$typeof === x || k.$$typeof === w || k.$$typeof === p);
    }
    function E(k) {
      if (typeof k == "object" && k !== null) {
        var ue = k.$$typeof;
        switch (ue) {
          case t:
            var _e = k.type;
            switch (_e) {
              case c:
              case l:
              case n:
              case a:
              case o:
              case f:
                return _e;
              default:
                var et = _e && _e.$$typeof;
                switch (et) {
                  case s:
                  case u:
                  case y:
                  case b:
                  case i:
                    return et;
                  default:
                    return ue;
                }
            }
          case r:
            return ue;
        }
      }
    }
    var h = c, W = l, F = s, Z = i, K = t, H = u, Q = n, P = y, ae = b, D = r, M = a, R = o, X = f, B = !1;
    function J(k) {
      return B || (B = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), g(k) || E(k) === c;
    }
    function g(k) {
      return E(k) === l;
    }
    function v(k) {
      return E(k) === s;
    }
    function C(k) {
      return E(k) === i;
    }
    function A(k) {
      return typeof k == "object" && k !== null && k.$$typeof === t;
    }
    function S(k) {
      return E(k) === u;
    }
    function I(k) {
      return E(k) === n;
    }
    function N(k) {
      return E(k) === y;
    }
    function $(k) {
      return E(k) === b;
    }
    function _(k) {
      return E(k) === r;
    }
    function j(k) {
      return E(k) === a;
    }
    function z(k) {
      return E(k) === o;
    }
    function ee(k) {
      return E(k) === f;
    }
    je.AsyncMode = h, je.ConcurrentMode = W, je.ContextConsumer = F, je.ContextProvider = Z, je.Element = K, je.ForwardRef = H, je.Fragment = Q, je.Lazy = P, je.Memo = ae, je.Portal = D, je.Profiler = M, je.StrictMode = R, je.Suspense = X, je.isAsyncMode = J, je.isConcurrentMode = g, je.isContextConsumer = v, je.isContextProvider = C, je.isElement = A, je.isForwardRef = S, je.isFragment = I, je.isLazy = N, je.isMemo = $, je.isPortal = _, je.isProfiler = j, je.isStrictMode = z, je.isSuspense = ee, je.isValidElementType = O, je.typeOf = E;
  }()), je;
}
var Xm;
function Uv() {
  return Xm || (Xm = 1, process.env.NODE_ENV === "production" ? cl.exports = pC() : cl.exports = mC()), cl.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var ul, Km;
function gC() {
  if (Km) return ul;
  Km = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, r = Object.prototype.propertyIsEnumerable;
  function n(a) {
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
      var c = Object.getOwnPropertyNames(i).map(function(u) {
        return i[u];
      });
      if (c.join("") !== "0123456789")
        return !1;
      var l = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(u) {
        l[u] = u;
      }), Object.keys(Object.assign({}, l)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return ul = o() ? Object.assign : function(a, i) {
    for (var s, c = n(a), l, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var f in s)
        t.call(s, f) && (c[f] = s[f]);
      if (e) {
        l = e(s);
        for (var d = 0; d < l.length; d++)
          r.call(s, l[d]) && (c[l[d]] = s[l[d]]);
      }
    }
    return c;
  }, ul;
}
var fl, Jm;
function _f() {
  if (Jm) return fl;
  Jm = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return fl = e, fl;
}
var Qm, Zm;
function Yv() {
  return Zm || (Zm = 1, Qm = Function.call.bind(Object.prototype.hasOwnProperty)), Qm;
}
var dl, eg;
function hC() {
  if (eg) return dl;
  eg = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ _f(), r = {}, n = /* @__PURE__ */ Yv();
    e = function(a) {
      var i = "Warning: " + a;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function o(a, i, s, c, l) {
    if (process.env.NODE_ENV !== "production") {
      for (var u in a)
        if (n(a, u)) {
          var f;
          try {
            if (typeof a[u] != "function") {
              var d = Error(
                (c || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw d.name = "Invariant Violation", d;
            }
            f = a[u](i, u, c, s, null, t);
          } catch (y) {
            f = y;
          }
          if (f && !(f instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof f + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), f instanceof Error && !(f.message in r)) {
            r[f.message] = !0;
            var b = l ? l() : "";
            e(
              "Failed " + s + " type: " + f.message + (b ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (r = {});
  }, dl = o, dl;
}
var pl, tg;
function bC() {
  if (tg) return pl;
  tg = 1;
  var e = Uv(), t = gC(), r = /* @__PURE__ */ _f(), n = /* @__PURE__ */ Yv(), o = /* @__PURE__ */ hC(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(s) {
    var c = "Warning: " + s;
    typeof console < "u" && console.error(c);
    try {
      throw new Error(c);
    } catch {
    }
  });
  function i() {
    return null;
  }
  return pl = function(s, c) {
    var l = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function f(g) {
      var v = g && (l && g[l] || g[u]);
      if (typeof v == "function")
        return v;
    }
    var d = "<<anonymous>>", b = {
      array: x("array"),
      bigint: x("bigint"),
      bool: x("boolean"),
      func: x("function"),
      number: x("number"),
      object: x("object"),
      string: x("string"),
      symbol: x("symbol"),
      any: w(),
      arrayOf: O,
      element: E(),
      elementType: h(),
      instanceOf: W,
      node: H(),
      objectOf: Z,
      oneOf: F,
      oneOfType: K,
      shape: P,
      exact: ae
    };
    function y(g, v) {
      return g === v ? g !== 0 || 1 / g === 1 / v : g !== g && v !== v;
    }
    function p(g, v) {
      this.message = g, this.data = v && typeof v == "object" ? v : {}, this.stack = "";
    }
    p.prototype = Error.prototype;
    function m(g) {
      if (process.env.NODE_ENV !== "production")
        var v = {}, C = 0;
      function A(I, N, $, _, j, z, ee) {
        if (_ = _ || d, z = z || $, ee !== r) {
          if (c) {
            var k = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw k.name = "Invariant Violation", k;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ue = _ + ":" + $;
            !v[ue] && // Avoid spamming the console because they are often not actionable except for lib authors
            C < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + z + "` prop on `" + _ + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), v[ue] = !0, C++);
          }
        }
        return N[$] == null ? I ? N[$] === null ? new p("The " + j + " `" + z + "` is marked as required " + ("in `" + _ + "`, but its value is `null`.")) : new p("The " + j + " `" + z + "` is marked as required in " + ("`" + _ + "`, but its value is `undefined`.")) : null : g(N, $, _, j, z);
      }
      var S = A.bind(null, !1);
      return S.isRequired = A.bind(null, !0), S;
    }
    function x(g) {
      function v(C, A, S, I, N, $) {
        var _ = C[A], j = R(_);
        if (j !== g) {
          var z = X(_);
          return new p(
            "Invalid " + I + " `" + N + "` of type " + ("`" + z + "` supplied to `" + S + "`, expected ") + ("`" + g + "`."),
            { expectedType: g }
          );
        }
        return null;
      }
      return m(v);
    }
    function w() {
      return m(i);
    }
    function O(g) {
      function v(C, A, S, I, N) {
        if (typeof g != "function")
          return new p("Property `" + N + "` of component `" + S + "` has invalid PropType notation inside arrayOf.");
        var $ = C[A];
        if (!Array.isArray($)) {
          var _ = R($);
          return new p("Invalid " + I + " `" + N + "` of type " + ("`" + _ + "` supplied to `" + S + "`, expected an array."));
        }
        for (var j = 0; j < $.length; j++) {
          var z = g($, j, S, I, N + "[" + j + "]", r);
          if (z instanceof Error)
            return z;
        }
        return null;
      }
      return m(v);
    }
    function E() {
      function g(v, C, A, S, I) {
        var N = v[C];
        if (!s(N)) {
          var $ = R(N);
          return new p("Invalid " + S + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return m(g);
    }
    function h() {
      function g(v, C, A, S, I) {
        var N = v[C];
        if (!e.isValidElementType(N)) {
          var $ = R(N);
          return new p("Invalid " + S + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return m(g);
    }
    function W(g) {
      function v(C, A, S, I, N) {
        if (!(C[A] instanceof g)) {
          var $ = g.name || d, _ = J(C[A]);
          return new p("Invalid " + I + " `" + N + "` of type " + ("`" + _ + "` supplied to `" + S + "`, expected ") + ("instance of `" + $ + "`."));
        }
        return null;
      }
      return m(v);
    }
    function F(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), i;
      function v(C, A, S, I, N) {
        for (var $ = C[A], _ = 0; _ < g.length; _++)
          if (y($, g[_]))
            return null;
        var j = JSON.stringify(g, function(z, ee) {
          var k = X(ee);
          return k === "symbol" ? String(ee) : ee;
        });
        return new p("Invalid " + I + " `" + N + "` of value `" + String($) + "` " + ("supplied to `" + S + "`, expected one of " + j + "."));
      }
      return m(v);
    }
    function Z(g) {
      function v(C, A, S, I, N) {
        if (typeof g != "function")
          return new p("Property `" + N + "` of component `" + S + "` has invalid PropType notation inside objectOf.");
        var $ = C[A], _ = R($);
        if (_ !== "object")
          return new p("Invalid " + I + " `" + N + "` of type " + ("`" + _ + "` supplied to `" + S + "`, expected an object."));
        for (var j in $)
          if (n($, j)) {
            var z = g($, j, S, I, N + "." + j, r);
            if (z instanceof Error)
              return z;
          }
        return null;
      }
      return m(v);
    }
    function K(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var v = 0; v < g.length; v++) {
        var C = g[v];
        if (typeof C != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + B(C) + " at index " + v + "."
          ), i;
      }
      function A(S, I, N, $, _) {
        for (var j = [], z = 0; z < g.length; z++) {
          var ee = g[z], k = ee(S, I, N, $, _, r);
          if (k == null)
            return null;
          k.data && n(k.data, "expectedType") && j.push(k.data.expectedType);
        }
        var ue = j.length > 0 ? ", expected one of type [" + j.join(", ") + "]" : "";
        return new p("Invalid " + $ + " `" + _ + "` supplied to " + ("`" + N + "`" + ue + "."));
      }
      return m(A);
    }
    function H() {
      function g(v, C, A, S, I) {
        return D(v[C]) ? null : new p("Invalid " + S + " `" + I + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return m(g);
    }
    function Q(g, v, C, A, S) {
      return new p(
        (g || "React class") + ": " + v + " type `" + C + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + S + "`."
      );
    }
    function P(g) {
      function v(C, A, S, I, N) {
        var $ = C[A], _ = R($);
        if (_ !== "object")
          return new p("Invalid " + I + " `" + N + "` of type `" + _ + "` " + ("supplied to `" + S + "`, expected `object`."));
        for (var j in g) {
          var z = g[j];
          if (typeof z != "function")
            return Q(S, I, N, j, X(z));
          var ee = z($, j, S, I, N + "." + j, r);
          if (ee)
            return ee;
        }
        return null;
      }
      return m(v);
    }
    function ae(g) {
      function v(C, A, S, I, N) {
        var $ = C[A], _ = R($);
        if (_ !== "object")
          return new p("Invalid " + I + " `" + N + "` of type `" + _ + "` " + ("supplied to `" + S + "`, expected `object`."));
        var j = t({}, C[A], g);
        for (var z in j) {
          var ee = g[z];
          if (n(g, z) && typeof ee != "function")
            return Q(S, I, N, z, X(ee));
          if (!ee)
            return new p(
              "Invalid " + I + " `" + N + "` key `" + z + "` supplied to `" + S + "`.\nBad object: " + JSON.stringify(C[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(g), null, "  ")
            );
          var k = ee($, z, S, I, N + "." + z, r);
          if (k)
            return k;
        }
        return null;
      }
      return m(v);
    }
    function D(g) {
      switch (typeof g) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !g;
        case "object":
          if (Array.isArray(g))
            return g.every(D);
          if (g === null || s(g))
            return !0;
          var v = f(g);
          if (v) {
            var C = v.call(g), A;
            if (v !== g.entries) {
              for (; !(A = C.next()).done; )
                if (!D(A.value))
                  return !1;
            } else
              for (; !(A = C.next()).done; ) {
                var S = A.value;
                if (S && !D(S[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function M(g, v) {
      return g === "symbol" ? !0 : v ? v["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && v instanceof Symbol : !1;
    }
    function R(g) {
      var v = typeof g;
      return Array.isArray(g) ? "array" : g instanceof RegExp ? "object" : M(v, g) ? "symbol" : v;
    }
    function X(g) {
      if (typeof g > "u" || g === null)
        return "" + g;
      var v = R(g);
      if (v === "object") {
        if (g instanceof Date)
          return "date";
        if (g instanceof RegExp)
          return "regexp";
      }
      return v;
    }
    function B(g) {
      var v = X(g);
      switch (v) {
        case "array":
        case "object":
          return "an " + v;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + v;
        default:
          return v;
      }
    }
    function J(g) {
      return !g.constructor || !g.constructor.name ? d : g.constructor.name;
    }
    return b.checkPropTypes = o, b.resetWarningCache = o.resetWarningCache, b.PropTypes = b, b;
  }, pl;
}
var ml, rg;
function yC() {
  if (rg) return ml;
  rg = 1;
  var e = /* @__PURE__ */ _f();
  function t() {
  }
  function r() {
  }
  return r.resetWarningCache = t, ml = function() {
    function n(i, s, c, l, u, f) {
      if (f !== e) {
        var d = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw d.name = "Invariant Violation", d;
      }
    }
    n.isRequired = n;
    function o() {
      return n;
    }
    var a = {
      array: n,
      bigint: n,
      bool: n,
      func: n,
      number: n,
      object: n,
      string: n,
      symbol: n,
      any: n,
      arrayOf: o,
      element: n,
      elementType: n,
      instanceOf: o,
      node: n,
      objectOf: o,
      oneOf: o,
      oneOfType: o,
      shape: o,
      exact: o,
      checkPropTypes: r,
      resetWarningCache: t
    };
    return a.PropTypes = a, a;
  }, ml;
}
var ng;
function vC() {
  if (ng) return Ya.exports;
  if (ng = 1, process.env.NODE_ENV !== "production") {
    var e = Uv(), t = !0;
    Ya.exports = /* @__PURE__ */ bC()(e.isElement, t);
  } else
    Ya.exports = /* @__PURE__ */ yC()();
  return Ya.exports;
}
var xC = /* @__PURE__ */ vC();
const xe = /* @__PURE__ */ dC(xC);
function og(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function At(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? og(Object(r), !0).forEach(function(n) {
      $n(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : og(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function Ci(e) {
  "@babel/helpers - typeof";
  return Ci = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Ci(e);
}
function $n(e, t, r) {
  return t in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function wC(e, t) {
  if (e == null) return {};
  var r = {}, n = Object.keys(e), o, a;
  for (a = 0; a < n.length; a++)
    o = n[a], !(t.indexOf(o) >= 0) && (r[o] = e[o]);
  return r;
}
function kC(e, t) {
  if (e == null) return {};
  var r = wC(e, t), n, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      n = a[o], !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n]);
  }
  return r;
}
function Xc(e) {
  return OC(e) || EC(e) || PC(e) || SC();
}
function OC(e) {
  if (Array.isArray(e)) return Kc(e);
}
function EC(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function PC(e, t) {
  if (e) {
    if (typeof e == "string") return Kc(e, t);
    var r = Object.prototype.toString.call(e).slice(8, -1);
    if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return Kc(e, t);
  }
}
function Kc(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
  return n;
}
function SC() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function AC(e) {
  var t, r = e.beat, n = e.fade, o = e.beatFade, a = e.bounce, i = e.shake, s = e.flash, c = e.spin, l = e.spinPulse, u = e.spinReverse, f = e.pulse, d = e.fixedWidth, b = e.inverse, y = e.border, p = e.listItem, m = e.flip, x = e.size, w = e.rotation, O = e.pull, E = (t = {
    "fa-beat": r,
    "fa-fade": n,
    "fa-beat-fade": o,
    "fa-bounce": a,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": u,
    "fa-spin-pulse": l,
    "fa-pulse": f,
    "fa-fw": d,
    "fa-inverse": b,
    "fa-border": y,
    "fa-li": p,
    "fa-flip": m === !0,
    "fa-flip-horizontal": m === "horizontal" || m === "both",
    "fa-flip-vertical": m === "vertical" || m === "both"
  }, $n(t, "fa-".concat(x), typeof x < "u" && x !== null), $n(t, "fa-rotate-".concat(w), typeof w < "u" && w !== null && w !== 0), $n(t, "fa-pull-".concat(O), typeof O < "u" && O !== null), $n(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(E).map(function(h) {
    return E[h] ? h : null;
  }).filter(function(h) {
    return h;
  });
}
function CC(e) {
  return e = e - 0, e === e;
}
function Vv(e) {
  return CC(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, r) {
    return r ? r.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var $C = ["style"];
function NC(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function IC(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, r) {
    var n = r.indexOf(":"), o = Vv(r.slice(0, n)), a = r.slice(n + 1).trim();
    return o.startsWith("webkit") ? t[NC(o)] = a : t[o] = a, t;
  }, {});
}
function Gv(e, t) {
  var r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var n = (t.children || []).map(function(c) {
    return Gv(e, c);
  }), o = Object.keys(t.attributes || {}).reduce(function(c, l) {
    var u = t.attributes[l];
    switch (l) {
      case "class":
        c.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = IC(u);
        break;
      default:
        l.indexOf("aria-") === 0 || l.indexOf("data-") === 0 ? c.attrs[l.toLowerCase()] = u : c.attrs[Vv(l)] = u;
    }
    return c;
  }, {
    attrs: {}
  }), a = r.style, i = a === void 0 ? {} : a, s = kC(r, $C);
  return o.attrs.style = At(At({}, o.attrs.style), i), e.apply(void 0, [t.tag, At(At({}, o.attrs), s)].concat(Xc(n)));
}
var qv = !1;
try {
  qv = process.env.NODE_ENV === "production";
} catch {
}
function TC() {
  if (!qv && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function ag(e) {
  if (e && Ci(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Bc.icon)
    return Bc.icon(e);
  if (e === null)
    return null;
  if (e && Ci(e) === "object" && e.prefix && e.iconName)
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
function gl(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? $n({}, e, t) : {};
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
}, rt = /* @__PURE__ */ Oe.forwardRef(function(e, t) {
  var r = At(At({}, ig), e), n = r.icon, o = r.mask, a = r.symbol, i = r.className, s = r.title, c = r.titleId, l = r.maskId, u = ag(n), f = gl("classes", [].concat(Xc(AC(r)), Xc((i || "").split(" ")))), d = gl("transform", typeof r.transform == "string" ? Bc.transform(r.transform) : r.transform), b = gl("mask", ag(o)), y = fC(u, At(At(At(At({}, f), d), b), {}, {
    symbol: a,
    title: s,
    titleId: c,
    maskId: l
  }));
  if (!y)
    return TC("Could not find icon", u), null;
  var p = y.abstract, m = {
    ref: t
  };
  return Object.keys(r).forEach(function(x) {
    ig.hasOwnProperty(x) || (m[x] = r[x]);
  }), jC(p[0], m);
});
rt.displayName = "FontAwesomeIcon";
rt.propTypes = {
  beat: xe.bool,
  border: xe.bool,
  beatFade: xe.bool,
  bounce: xe.bool,
  className: xe.string,
  fade: xe.bool,
  flash: xe.bool,
  mask: xe.oneOfType([xe.object, xe.array, xe.string]),
  maskId: xe.string,
  fixedWidth: xe.bool,
  inverse: xe.bool,
  flip: xe.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: xe.oneOfType([xe.object, xe.array, xe.string]),
  listItem: xe.bool,
  pull: xe.oneOf(["right", "left"]),
  pulse: xe.bool,
  rotation: xe.oneOf([0, 90, 180, 270]),
  shake: xe.bool,
  size: xe.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: xe.bool,
  spinPulse: xe.bool,
  spinReverse: xe.bool,
  symbol: xe.oneOfType([xe.bool, xe.string]),
  title: xe.string,
  titleId: xe.string,
  transform: xe.oneOfType([xe.string, xe.object]),
  swapOpacity: xe.bool
};
var jC = Gv.bind(null, Oe.createElement);
const Mf = "-", _C = (e) => {
  const t = zC(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(Mf);
      return a[0] === "" && a.length !== 1 && a.shift(), Hv(a, t) || MC(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const i = r[o] || [];
      return a && n[o] ? [...i, ...n[o]] : i;
    }
  };
}, Hv = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], o = t.nextPart.get(n), a = o ? Hv(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const i = e.join(Mf);
  return (r = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : r.classGroupId;
}, sg = /^\[(.+)\]$/, MC = (e) => {
  if (sg.test(e)) {
    const t = sg.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, zC = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return FC(Object.entries(e.classGroups), r).forEach(([o, a]) => {
    Jc(a, n, o, t);
  }), n;
}, Jc = (e, t, r, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : lg(t, o);
      a.classGroupId = r;
      return;
    }
    if (typeof o == "function") {
      if (RC(o)) {
        Jc(o(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: r
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      Jc(i, lg(t, a), r, n);
    });
  });
}, lg = (e, t) => {
  let r = e;
  return t.split(Mf).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, RC = (e) => e.isThemeGetter, FC = (e, t) => t ? e.map(([r, n]) => {
  const o = n.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [r, o];
}) : e, LC = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const o = (a, i) => {
    r.set(a, i), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = r.get(a);
      if (i !== void 0)
        return i;
      if ((i = n.get(a)) !== void 0)
        return o(a, i), i;
    },
    set(a, i) {
      r.has(a) ? r.set(a, i) : o(a, i);
    }
  };
}, Bv = "!", DC = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const c = [];
    let l = 0, u = 0, f;
    for (let m = 0; m < s.length; m++) {
      let x = s[m];
      if (l === 0) {
        if (x === o && (n || s.slice(m, m + a) === t)) {
          c.push(s.slice(u, m)), u = m + a;
          continue;
        }
        if (x === "/") {
          f = m;
          continue;
        }
      }
      x === "[" ? l++ : x === "]" && l--;
    }
    const d = c.length === 0 ? s : s.substring(u), b = d.startsWith(Bv), y = b ? d.substring(1) : d, p = f && f > u ? f - u : void 0;
    return {
      modifiers: c,
      hasImportantModifier: b,
      baseClassName: y,
      maybePostfixModifierPosition: p
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, WC = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, UC = (e) => ({
  cache: LC(e.cacheSize),
  parseClassName: DC(e),
  ..._C(e)
}), YC = /\s+/, VC = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(YC);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: b
    } = r(l);
    let y = !!b, p = n(y ? d.substring(0, b) : d);
    if (!p) {
      if (!y) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (p = n(d), !p) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      y = !1;
    }
    const m = WC(u).join(":"), x = f ? m + Bv : m, w = x + p;
    if (a.includes(w))
      continue;
    a.push(w);
    const O = o(p, y);
    for (let E = 0; E < O.length; ++E) {
      const h = O[E];
      a.push(x + h);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function GC() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = Xv(t)) && (n && (n += " "), n += r);
  return n;
}
const Xv = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = Xv(e[n])) && (r && (r += " "), r += t);
  return r;
};
function qC(e, ...t) {
  let r, n, o, a = i;
  function i(c) {
    const l = t.reduce((u, f) => f(u), e());
    return r = UC(l), n = r.cache.get, o = r.cache.set, a = s, s(c);
  }
  function s(c) {
    const l = n(c);
    if (l)
      return l;
    const u = VC(c, r);
    return o(c, u), u;
  }
  return function() {
    return a(GC.apply(null, arguments));
  };
}
const Le = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, Kv = /^\[(?:([a-z-]+):)?(.+)\]$/i, HC = /^\d+\/\d+$/, BC = /* @__PURE__ */ new Set(["px", "full", "screen"]), XC = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, KC = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, JC = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, QC = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, ZC = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Vt = (e) => Wn(e) || BC.has(e) || HC.test(e), hr = (e) => so(e, "length", s3), Wn = (e) => !!e && !Number.isNaN(Number(e)), hl = (e) => so(e, "number", Wn), Oo = (e) => !!e && Number.isInteger(Number(e)), e3 = (e) => e.endsWith("%") && Wn(e.slice(0, -1)), pe = (e) => Kv.test(e), br = (e) => XC.test(e), t3 = /* @__PURE__ */ new Set(["length", "size", "percentage"]), r3 = (e) => so(e, t3, Jv), n3 = (e) => so(e, "position", Jv), o3 = /* @__PURE__ */ new Set(["image", "url"]), a3 = (e) => so(e, o3, c3), i3 = (e) => so(e, "", l3), Eo = () => !0, so = (e, t, r) => {
  const n = Kv.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, s3 = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  KC.test(e) && !JC.test(e)
), Jv = () => !1, l3 = (e) => QC.test(e), c3 = (e) => ZC.test(e), u3 = () => {
  const e = Le("colors"), t = Le("spacing"), r = Le("blur"), n = Le("brightness"), o = Le("borderColor"), a = Le("borderRadius"), i = Le("borderSpacing"), s = Le("borderWidth"), c = Le("contrast"), l = Le("grayscale"), u = Le("hueRotate"), f = Le("invert"), d = Le("gap"), b = Le("gradientColorStops"), y = Le("gradientColorStopPositions"), p = Le("inset"), m = Le("margin"), x = Le("opacity"), w = Le("padding"), O = Le("saturate"), E = Le("scale"), h = Le("sepia"), W = Le("skew"), F = Le("space"), Z = Le("translate"), K = () => ["auto", "contain", "none"], H = () => ["auto", "hidden", "clip", "visible", "scroll"], Q = () => ["auto", pe, t], P = () => [pe, t], ae = () => ["", Vt, hr], D = () => ["auto", Wn, pe], M = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], R = () => ["solid", "dashed", "dotted", "double", "none"], X = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], B = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], J = () => ["", "0", pe], g = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], v = () => [Wn, pe];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Eo],
      spacing: [Vt, hr],
      blur: ["none", "", br, pe],
      brightness: v(),
      borderColor: [e],
      borderRadius: ["none", "", "full", br, pe],
      borderSpacing: P(),
      borderWidth: ae(),
      contrast: v(),
      grayscale: J(),
      hueRotate: v(),
      invert: J(),
      gap: P(),
      gradientColorStops: [e],
      gradientColorStopPositions: [e3, hr],
      inset: Q(),
      margin: Q(),
      opacity: v(),
      padding: P(),
      saturate: v(),
      scale: v(),
      sepia: J(),
      skew: v(),
      space: P(),
      translate: P()
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
        columns: [br]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": g()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": g()
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
        object: [...M(), pe]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: H()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": H()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": H()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: K()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": K()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": K()
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
        inset: [p]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [p]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [p]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [p]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [p]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [p]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [p]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [p]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [p]
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
        z: ["auto", Oo, pe]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: Q()
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
        grow: J()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: J()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Oo, pe]
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
          span: ["full", Oo, pe]
        }, pe]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": D()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": D()
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
          span: [Oo, pe]
        }, pe]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": D()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": D()
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
        p: [w]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [w]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [w]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [w]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [w]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [w]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [w]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [w]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [w]
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
        "space-x": [F]
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
        "space-y": [F]
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
          screen: [br]
        }, br]
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
        text: ["base", br, hr]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", hl]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", pe]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Wn, hl]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Vt, pe]
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
        "placeholder-opacity": [x]
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
        "text-opacity": [x]
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
        decoration: [...R(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", Vt, hr]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Vt, pe]
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
        indent: P()
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
        "bg-opacity": [x]
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
        bg: [...M(), n3]
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
        bg: ["auto", "cover", "contain", r3]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, a3]
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
        from: [y]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [y]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [y]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [b]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [b]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [b]
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
        "border-opacity": [x]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...R(), "hidden"]
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
        "divide-opacity": [x]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: R()
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
        outline: ["", ...R()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Vt, pe]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Vt, hr]
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
        ring: ae()
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
        "ring-opacity": [x]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [Vt, hr]
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
        shadow: ["", "inner", "none", br, i3]
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
        opacity: [x]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...X(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": X()
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
        blur: [r]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [n]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [c]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", br, pe]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [l]
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
        saturate: [O]
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
        "backdrop-blur": [r]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [n]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [c]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [l]
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
        "backdrop-opacity": [x]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [O]
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
        duration: v()
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
        delay: v()
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
        rotate: [Oo, pe]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [Z]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [Z]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [W]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [W]
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
        "scroll-m": P()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": P()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": P()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": P()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": P()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": P()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": P()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": P()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": P()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": P()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": P()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": P()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": P()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": P()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": P()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": P()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": P()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": P()
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
        stroke: [Vt, hr, hl]
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
}, cg = /* @__PURE__ */ qC(u3);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const vn = {
  prefix: "fas",
  iconName: "spinner-third",
  icon: [512, 512, [], "f3f4", "M224 32c0-17.7 14.3-32 32-32C397.4 0 512 114.6 512 256c0 46.6-12.5 90.4-34.3 128c-8.8 15.3-28.4 20.5-43.7 11.7s-20.5-28.4-11.7-43.7c16.3-28.2 25.7-61 25.7-96c0-106-86-192-192-192c-17.7 0-32-14.3-32-32z"]
}, si = ({
  icon: e,
  iconClassName: t,
  children: r,
  className: n,
  htmlFor: o,
  variant: a = "primary",
  disabled: i,
  iconFlip: s = !1,
  loading: c,
  as: l = "button",
  href: u,
  target: f,
  ...d
}) => {
  function b(m) {
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
  const y = cg(
    i || c ? "opacity-50 pointer-events-none" : ""
  ), p = cg(
    "w-fit text-sm font-medium rounded-lg px-3 py-2 border border-transparent shadow-sm focus-visible:outline focus-visible:outline-0 focus-visible:outline-offset-0 transition-all duration-150 flex gap-2 items-center justify-center active:scale-95 transform",
    b(a),
    n,
    y
  );
  return o ? /* @__PURE__ */ Ee("label", { className: p, htmlFor: o, style: d.style, children: [
    c && !s ? /* @__PURE__ */ L(rt, { icon: vn, className: "animate-spin" }) : /* @__PURE__ */ L(vt, { children: e && !s ? /* @__PURE__ */ L(rt, { icon: e, className: t }) : null }),
    r,
    c && s ? /* @__PURE__ */ L(rt, { icon: vn, className: "animate-spin" }) : /* @__PURE__ */ L(vt, { children: e && s ? /* @__PURE__ */ L(rt, { icon: e, className: t }) : null })
  ] }) : l === "link" && u ? /* @__PURE__ */ Ee(
    "a",
    {
      href: u,
      className: p,
      style: d.style,
      ...d,
      target: f,
      children: [
        c && !s ? /* @__PURE__ */ L(rt, { icon: vn, className: "animate-spin" }) : /* @__PURE__ */ L(vt, { children: e && !s ? /* @__PURE__ */ L(rt, { icon: e, className: t }) : null }),
        r,
        c && s ? /* @__PURE__ */ L(rt, { icon: vn, className: "animate-spin" }) : /* @__PURE__ */ L(vt, { children: e && s ? /* @__PURE__ */ L(rt, { icon: e, className: t }) : null })
      ]
    }
  ) : /* @__PURE__ */ Ee(
    "button",
    {
      className: p,
      disabled: i || c,
      ...d,
      htmlFor: o,
      children: [
        c && !s ? /* @__PURE__ */ L(rt, { icon: vn, className: "animate-spin" }) : /* @__PURE__ */ L(vt, { children: e && !s ? /* @__PURE__ */ L(rt, { icon: e, className: t }) : null }),
        r,
        c && s ? /* @__PURE__ */ L(rt, { icon: vn, className: "animate-spin" }) : /* @__PURE__ */ L(vt, { children: e && s ? /* @__PURE__ */ L(rt, { icon: e, className: t }) : null })
      ]
    }
  );
};
var li = /* @__PURE__ */ ((e) => (e[e.ALL = 0] = "ALL", e[e.FEATURED = 1] = "FEATURED", e[e.MINE = 2] = "MINE", e[e.BOOKMARKED = 3] = "BOOKMARKED", e))(li || {});
li.FEATURED, li.MINE, li.BOOKMARKED;
const zf = "-", f3 = (e) => {
  const t = p3(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (i) => {
      const s = i.split(zf);
      return s[0] === "" && s.length !== 1 && s.shift(), Qv(s, t) || d3(i);
    },
    getConflictingClassGroupIds: (i, s) => {
      const c = r[i] || [];
      return s && n[i] ? [...c, ...n[i]] : c;
    }
  };
}, Qv = (e, t) => {
  var i;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], n = t.nextPart.get(r), o = n ? Qv(e.slice(1), n) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const a = e.join(zf);
  return (i = t.validators.find(({
    validator: s
  }) => s(a))) == null ? void 0 : i.classGroupId;
}, ug = /^\[(.+)\]$/, d3 = (e) => {
  if (ug.test(e)) {
    const t = ug.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, p3 = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return g3(Object.entries(e.classGroups), r).forEach(([a, i]) => {
    Qc(i, n, a, t);
  }), n;
}, Qc = (e, t, r, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : fg(t, o);
      a.classGroupId = r;
      return;
    }
    if (typeof o == "function") {
      if (m3(o)) {
        Qc(o(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: r
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      Qc(i, fg(t, a), r, n);
    });
  });
}, fg = (e, t) => {
  let r = e;
  return t.split(zf).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, m3 = (e) => e.isThemeGetter, g3 = (e, t) => t ? e.map(([r, n]) => {
  const o = n.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [r, o];
}) : e, h3 = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const o = (a, i) => {
    r.set(a, i), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = r.get(a);
      if (i !== void 0)
        return i;
      if ((i = n.get(a)) !== void 0)
        return o(a, i), i;
    },
    set(a, i) {
      r.has(a) ? r.set(a, i) : o(a, i);
    }
  };
}, Zv = "!", b3 = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const c = [];
    let l = 0, u = 0, f;
    for (let m = 0; m < s.length; m++) {
      let x = s[m];
      if (l === 0) {
        if (x === o && (n || s.slice(m, m + a) === t)) {
          c.push(s.slice(u, m)), u = m + a;
          continue;
        }
        if (x === "/") {
          f = m;
          continue;
        }
      }
      x === "[" ? l++ : x === "]" && l--;
    }
    const d = c.length === 0 ? s : s.substring(u), b = d.startsWith(Zv), y = b ? d.substring(1) : d, p = f && f > u ? f - u : void 0;
    return {
      modifiers: c,
      hasImportantModifier: b,
      baseClassName: y,
      maybePostfixModifierPosition: p
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, y3 = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, v3 = (e) => ({
  cache: h3(e.cacheSize),
  parseClassName: b3(e),
  ...f3(e)
}), x3 = /\s+/, w3 = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(x3);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: b
    } = r(l);
    let y = !!b, p = n(y ? d.substring(0, b) : d);
    if (!p) {
      if (!y) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (p = n(d), !p) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      y = !1;
    }
    const m = y3(u).join(":"), x = f ? m + Zv : m, w = x + p;
    if (a.includes(w))
      continue;
    a.push(w);
    const O = o(p, y);
    for (let E = 0; E < O.length; ++E) {
      const h = O[E];
      a.push(x + h);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function k3() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = e0(t)) && (n && (n += " "), n += r);
  return n;
}
const e0 = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = e0(e[n])) && (r && (r += " "), r += t);
  return r;
};
function O3(e, ...t) {
  let r, n, o, a = i;
  function i(c) {
    const l = t.reduce((u, f) => f(u), e());
    return r = v3(l), n = r.cache.get, o = r.cache.set, a = s, s(c);
  }
  function s(c) {
    const l = n(c);
    if (l)
      return l;
    const u = w3(c, r);
    return o(c, u), u;
  }
  return function() {
    return a(k3.apply(null, arguments));
  };
}
const De = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, t0 = /^\[(?:([a-z-]+):)?(.+)\]$/i, E3 = /^\d+\/\d+$/, P3 = /* @__PURE__ */ new Set(["px", "full", "screen"]), S3 = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, A3 = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, C3 = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, $3 = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, N3 = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Gt = (e) => Un(e) || P3.has(e) || E3.test(e), yr = (e) => lo(e, "length", F3), Un = (e) => !!e && !Number.isNaN(Number(e)), bl = (e) => lo(e, "number", Un), Po = (e) => !!e && Number.isInteger(Number(e)), I3 = (e) => e.endsWith("%") && Un(e.slice(0, -1)), me = (e) => t0.test(e), vr = (e) => S3.test(e), T3 = /* @__PURE__ */ new Set(["length", "size", "percentage"]), j3 = (e) => lo(e, T3, r0), _3 = (e) => lo(e, "position", r0), M3 = /* @__PURE__ */ new Set(["image", "url"]), z3 = (e) => lo(e, M3, D3), R3 = (e) => lo(e, "", L3), So = () => !0, lo = (e, t, r) => {
  const n = t0.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, F3 = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  A3.test(e) && !C3.test(e)
), r0 = () => !1, L3 = (e) => $3.test(e), D3 = (e) => N3.test(e), W3 = () => {
  const e = De("colors"), t = De("spacing"), r = De("blur"), n = De("brightness"), o = De("borderColor"), a = De("borderRadius"), i = De("borderSpacing"), s = De("borderWidth"), c = De("contrast"), l = De("grayscale"), u = De("hueRotate"), f = De("invert"), d = De("gap"), b = De("gradientColorStops"), y = De("gradientColorStopPositions"), p = De("inset"), m = De("margin"), x = De("opacity"), w = De("padding"), O = De("saturate"), E = De("scale"), h = De("sepia"), W = De("skew"), F = De("space"), Z = De("translate"), K = () => ["auto", "contain", "none"], H = () => ["auto", "hidden", "clip", "visible", "scroll"], Q = () => ["auto", me, t], P = () => [me, t], ae = () => ["", Gt, yr], D = () => ["auto", Un, me], M = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], R = () => ["solid", "dashed", "dotted", "double", "none"], X = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], B = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], J = () => ["", "0", me], g = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], v = () => [Un, me];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [So],
      spacing: [Gt, yr],
      blur: ["none", "", vr, me],
      brightness: v(),
      borderColor: [e],
      borderRadius: ["none", "", "full", vr, me],
      borderSpacing: P(),
      borderWidth: ae(),
      contrast: v(),
      grayscale: J(),
      hueRotate: v(),
      invert: J(),
      gap: P(),
      gradientColorStops: [e],
      gradientColorStopPositions: [I3, yr],
      inset: Q(),
      margin: Q(),
      opacity: v(),
      padding: P(),
      saturate: v(),
      scale: v(),
      sepia: J(),
      skew: v(),
      space: P(),
      translate: P()
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
        columns: [vr]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": g()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": g()
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
        object: [...M(), me]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: H()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": H()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": H()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: K()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": K()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": K()
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
        inset: [p]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [p]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [p]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [p]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [p]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [p]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [p]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [p]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [p]
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
        z: ["auto", Po, me]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: Q()
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
        grow: J()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: J()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Po, me]
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
          span: ["full", Po, me]
        }, me]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": D()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": D()
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
          span: [Po, me]
        }, me]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": D()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": D()
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
        p: [w]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [w]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [w]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [w]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [w]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [w]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [w]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [w]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [w]
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
        "space-x": [F]
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
        "space-y": [F]
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
          screen: [vr]
        }, vr]
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
        text: ["base", vr, yr]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", bl]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", me]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Un, bl]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Gt, me]
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
        "placeholder-opacity": [x]
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
        "text-opacity": [x]
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
        decoration: [...R(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", Gt, yr]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Gt, me]
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
        indent: P()
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
        "bg-opacity": [x]
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
        bg: [...M(), _3]
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
        bg: ["auto", "cover", "contain", j3]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, z3]
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
        from: [y]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [y]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [y]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [b]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [b]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [b]
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
        "border-opacity": [x]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...R(), "hidden"]
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
        "divide-opacity": [x]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: R()
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
        outline: ["", ...R()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Gt, me]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Gt, yr]
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
        ring: ae()
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
        "ring-opacity": [x]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [Gt, yr]
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
        shadow: ["", "inner", "none", vr, R3]
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
        opacity: [x]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...X(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": X()
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
        blur: [r]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [n]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [c]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", vr, me]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [l]
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
        saturate: [O]
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
        "backdrop-blur": [r]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [n]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [c]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [l]
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
        "backdrop-opacity": [x]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [O]
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
        duration: v()
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
        delay: v()
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
        rotate: [Po, me]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [Z]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [Z]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [W]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [W]
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
        "scroll-m": P()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": P()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": P()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": P()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": P()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": P()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": P()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": P()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": P()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": P()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": P()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": P()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": P()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": P()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": P()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": P()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": P()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": P()
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
        stroke: [Gt, yr, bl]
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
}, qr = /* @__PURE__ */ O3(W3), dg = (e) => {
  let t;
  const r = /* @__PURE__ */ new Set(), n = (l, u) => {
    const f = typeof l == "function" ? l(t) : l;
    if (!Object.is(f, t)) {
      const d = t;
      t = u ?? (typeof f != "object" || f === null) ? f : Object.assign({}, t, f), r.forEach((b) => b(t, d));
    }
  }, o = () => t, s = { setState: n, getState: o, getInitialState: () => c, subscribe: (l) => (r.add(l), () => r.delete(l)) }, c = t = e(n, o, s);
  return s;
}, U3 = (e) => e ? dg(e) : dg, Y3 = (e) => e;
function V3(e, t = Y3) {
  const r = Oe.useSyncExternalStore(
    e.subscribe,
    () => t(e.getState()),
    () => t(e.getInitialState())
  );
  return Oe.useDebugValue(r), r;
}
const pg = (e) => {
  const t = U3(e), r = (n) => V3(t, n);
  return Object.assign(r, t), r;
}, n0 = (e) => e ? pg(e) : pg, G3 = n0((e) => ({
  isOpen: !1,
  subscription: {
    currentPlanId: "free",
    hasActiveSubscription: !1
  },
  openModal: () => e({ isOpen: !0 }),
  closeModal: () => e({ isOpen: !1 }),
  toggleModal: () => e((t) => ({ isOpen: !t.isOpen })),
  setSubscription: (t) => e((r) => ({
    subscription: { ...r.subscription, ...t }
  })),
  updateCurrentPlan: (t, r) => e((n) => ({
    subscription: {
      ...n.subscription,
      currentPlanId: t,
      hasActiveSubscription: r
    }
  }))
})), Rf = "-", q3 = (e) => {
  const t = B3(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(Rf);
      return a[0] === "" && a.length !== 1 && a.shift(), o0(a, t) || H3(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const i = r[o] || [];
      return a && n[o] ? [...i, ...n[o]] : i;
    }
  };
}, o0 = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], o = t.nextPart.get(n), a = o ? o0(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const i = e.join(Rf);
  return (r = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : r.classGroupId;
}, mg = /^\[(.+)\]$/, H3 = (e) => {
  if (mg.test(e)) {
    const t = mg.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, B3 = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return K3(Object.entries(e.classGroups), r).forEach(([o, a]) => {
    Zc(a, n, o, t);
  }), n;
}, Zc = (e, t, r, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : gg(t, o);
      a.classGroupId = r;
      return;
    }
    if (typeof o == "function") {
      if (X3(o)) {
        Zc(o(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: r
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      Zc(i, gg(t, a), r, n);
    });
  });
}, gg = (e, t) => {
  let r = e;
  return t.split(Rf).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, X3 = (e) => e.isThemeGetter, K3 = (e, t) => t ? e.map(([r, n]) => {
  const o = n.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [r, o];
}) : e, J3 = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const o = (a, i) => {
    r.set(a, i), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = r.get(a);
      if (i !== void 0)
        return i;
      if ((i = n.get(a)) !== void 0)
        return o(a, i), i;
    },
    set(a, i) {
      r.has(a) ? r.set(a, i) : o(a, i);
    }
  };
}, a0 = "!", Q3 = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const c = [];
    let l = 0, u = 0, f;
    for (let m = 0; m < s.length; m++) {
      let x = s[m];
      if (l === 0) {
        if (x === o && (n || s.slice(m, m + a) === t)) {
          c.push(s.slice(u, m)), u = m + a;
          continue;
        }
        if (x === "/") {
          f = m;
          continue;
        }
      }
      x === "[" ? l++ : x === "]" && l--;
    }
    const d = c.length === 0 ? s : s.substring(u), b = d.startsWith(a0), y = b ? d.substring(1) : d, p = f && f > u ? f - u : void 0;
    return {
      modifiers: c,
      hasImportantModifier: b,
      baseClassName: y,
      maybePostfixModifierPosition: p
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, Z3 = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, e$ = (e) => ({
  cache: J3(e.cacheSize),
  parseClassName: Q3(e),
  ...q3(e)
}), t$ = /\s+/, r$ = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(t$);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: b
    } = r(l);
    let y = !!b, p = n(y ? d.substring(0, b) : d);
    if (!p) {
      if (!y) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (p = n(d), !p) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      y = !1;
    }
    const m = Z3(u).join(":"), x = f ? m + a0 : m, w = x + p;
    if (a.includes(w))
      continue;
    a.push(w);
    const O = o(p, y);
    for (let E = 0; E < O.length; ++E) {
      const h = O[E];
      a.push(x + h);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function n$() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = i0(t)) && (n && (n += " "), n += r);
  return n;
}
const i0 = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = i0(e[n])) && (r && (r += " "), r += t);
  return r;
};
function o$(e, ...t) {
  let r, n, o, a = i;
  function i(c) {
    const l = t.reduce((u, f) => f(u), e());
    return r = e$(l), n = r.cache.get, o = r.cache.set, a = s, s(c);
  }
  function s(c) {
    const l = n(c);
    if (l)
      return l;
    const u = r$(c, r);
    return o(c, u), u;
  }
  return function() {
    return a(n$.apply(null, arguments));
  };
}
const We = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, s0 = /^\[(?:([a-z-]+):)?(.+)\]$/i, a$ = /^\d+\/\d+$/, i$ = /* @__PURE__ */ new Set(["px", "full", "screen"]), s$ = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, l$ = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, c$ = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, u$ = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, f$ = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, qt = (e) => Yn(e) || i$.has(e) || a$.test(e), xr = (e) => co(e, "length", v$), Yn = (e) => !!e && !Number.isNaN(Number(e)), yl = (e) => co(e, "number", Yn), Ao = (e) => !!e && Number.isInteger(Number(e)), d$ = (e) => e.endsWith("%") && Yn(e.slice(0, -1)), ge = (e) => s0.test(e), wr = (e) => s$.test(e), p$ = /* @__PURE__ */ new Set(["length", "size", "percentage"]), m$ = (e) => co(e, p$, l0), g$ = (e) => co(e, "position", l0), h$ = /* @__PURE__ */ new Set(["image", "url"]), b$ = (e) => co(e, h$, w$), y$ = (e) => co(e, "", x$), Co = () => !0, co = (e, t, r) => {
  const n = s0.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, v$ = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  l$.test(e) && !c$.test(e)
), l0 = () => !1, x$ = (e) => u$.test(e), w$ = (e) => f$.test(e), k$ = () => {
  const e = We("colors"), t = We("spacing"), r = We("blur"), n = We("brightness"), o = We("borderColor"), a = We("borderRadius"), i = We("borderSpacing"), s = We("borderWidth"), c = We("contrast"), l = We("grayscale"), u = We("hueRotate"), f = We("invert"), d = We("gap"), b = We("gradientColorStops"), y = We("gradientColorStopPositions"), p = We("inset"), m = We("margin"), x = We("opacity"), w = We("padding"), O = We("saturate"), E = We("scale"), h = We("sepia"), W = We("skew"), F = We("space"), Z = We("translate"), K = () => ["auto", "contain", "none"], H = () => ["auto", "hidden", "clip", "visible", "scroll"], Q = () => ["auto", ge, t], P = () => [ge, t], ae = () => ["", qt, xr], D = () => ["auto", Yn, ge], M = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], R = () => ["solid", "dashed", "dotted", "double", "none"], X = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], B = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], J = () => ["", "0", ge], g = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], v = () => [Yn, ge];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Co],
      spacing: [qt, xr],
      blur: ["none", "", wr, ge],
      brightness: v(),
      borderColor: [e],
      borderRadius: ["none", "", "full", wr, ge],
      borderSpacing: P(),
      borderWidth: ae(),
      contrast: v(),
      grayscale: J(),
      hueRotate: v(),
      invert: J(),
      gap: P(),
      gradientColorStops: [e],
      gradientColorStopPositions: [d$, xr],
      inset: Q(),
      margin: Q(),
      opacity: v(),
      padding: P(),
      saturate: v(),
      scale: v(),
      sepia: J(),
      skew: v(),
      space: P(),
      translate: P()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", ge]
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
        columns: [wr]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": g()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": g()
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
        object: [...M(), ge]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: H()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": H()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": H()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: K()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": K()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": K()
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
        inset: [p]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [p]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [p]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [p]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [p]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [p]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [p]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [p]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [p]
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
        z: ["auto", Ao, ge]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: Q()
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
        flex: ["1", "auto", "initial", "none", ge]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: J()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: J()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Ao, ge]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Co]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Ao, ge]
        }, ge]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": D()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": D()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Co]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Ao, ge]
        }, ge]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": D()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": D()
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
        "auto-cols": ["auto", "min", "max", "fr", ge]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", ge]
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
        p: [w]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [w]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [w]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [w]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [w]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [w]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [w]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [w]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [w]
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
        "space-x": [F]
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
        "space-y": [F]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", ge, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [ge, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [ge, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [wr]
        }, wr]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [ge, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [ge, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [ge, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [ge, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", wr, xr]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", yl]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Co]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", ge]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Yn, yl]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", qt, ge]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", ge]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", ge]
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
        "placeholder-opacity": [x]
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
        "text-opacity": [x]
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
        decoration: [...R(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", qt, xr]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", qt, ge]
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
        indent: P()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", ge]
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
        content: ["none", ge]
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
        "bg-opacity": [x]
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
        bg: [...M(), g$]
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
        bg: ["auto", "cover", "contain", m$]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, b$]
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
        from: [y]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [y]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [y]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [b]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [b]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [b]
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
        "border-opacity": [x]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...R(), "hidden"]
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
        "divide-opacity": [x]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: R()
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
        outline: ["", ...R()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [qt, ge]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [qt, xr]
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
        ring: ae()
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
        "ring-opacity": [x]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [qt, xr]
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
        shadow: ["", "inner", "none", wr, y$]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Co]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [x]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...X(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": X()
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
        blur: [r]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [n]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [c]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", wr, ge]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [l]
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
        saturate: [O]
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
        "backdrop-blur": [r]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [n]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [c]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [l]
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
        "backdrop-opacity": [x]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [O]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", ge]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: v()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", ge]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: v()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", ge]
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
        rotate: [Ao, ge]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [Z]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [Z]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [W]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [W]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", ge]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", ge]
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
        "scroll-m": P()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": P()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": P()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": P()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": P()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": P()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": P()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": P()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": P()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": P()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": P()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": P()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": P()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": P()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": P()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": P()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": P()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": P()
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
        "will-change": ["auto", "scroll", "contents", "transform", ge]
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
        stroke: [qt, xr, yl]
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
}, Va = /* @__PURE__ */ o$(k$);
var O$ = Object.defineProperty, E$ = (e, t, r) => t in e ? O$(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r, vl = (e, t, r) => (E$(e, typeof t != "symbol" ? t + "" : t, r), r);
let P$ = class {
  constructor() {
    vl(this, "current", this.detect()), vl(this, "handoffState", "pending"), vl(this, "currentId", 0);
  }
  set(e) {
    this.current !== e && (this.handoffState = "pending", this.currentId = 0, this.current = e);
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
}, ci = new P$();
function S$(e) {
  typeof queueMicrotask == "function" ? queueMicrotask(e) : Promise.resolve().then(e).catch((t) => setTimeout(() => {
    throw t;
  }));
}
function is() {
  let e = [], t = { addEventListener(r, n, o, a) {
    return r.addEventListener(n, o, a), t.add(() => r.removeEventListener(n, o, a));
  }, requestAnimationFrame(...r) {
    let n = requestAnimationFrame(...r);
    return t.add(() => cancelAnimationFrame(n));
  }, nextFrame(...r) {
    return t.requestAnimationFrame(() => t.requestAnimationFrame(...r));
  }, setTimeout(...r) {
    let n = setTimeout(...r);
    return t.add(() => clearTimeout(n));
  }, microTask(...r) {
    let n = { current: !0 };
    return S$(() => {
      n.current && r[0]();
    }), t.add(() => {
      n.current = !1;
    });
  }, style(r, n, o) {
    let a = r.style.getPropertyValue(n);
    return Object.assign(r.style, { [n]: o }), this.add(() => {
      Object.assign(r.style, { [n]: a });
    });
  }, group(r) {
    let n = is();
    return r(n), this.add(() => n.dispose());
  }, add(r) {
    return e.includes(r) || e.push(r), () => {
      let n = e.indexOf(r);
      if (n >= 0) for (let o of e.splice(n, 1)) o();
    };
  }, dispose() {
    for (let r of e.splice(0)) r();
  } };
  return t;
}
function c0() {
  let [e] = Me(is);
  return Ne(() => () => e.dispose(), [e]), e;
}
let Ir = (e, t) => {
  ci.isServer ? Ne(e, t) : $u(e, t);
};
function u0(e) {
  let t = le(e);
  return Ir(() => {
    t.current = e;
  }, [e]), t;
}
let Xt = function(e) {
  let t = u0(e);
  return Oe.useCallback((...r) => t.current(...r), [t]);
};
function eu(...e) {
  return Array.from(new Set(e.flatMap((t) => typeof t == "string" ? t.split(" ") : []))).filter(Boolean).join(" ");
}
function ss(e, t, ...r) {
  if (e in t) {
    let o = t[e];
    return typeof o == "function" ? o(...r) : o;
  }
  let n = new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map((o) => `"${o}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(n, ss), n;
}
var f0 = ((e) => (e[e.None = 0] = "None", e[e.RenderStrategy = 1] = "RenderStrategy", e[e.Static = 2] = "Static", e))(f0 || {}), Cr = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(Cr || {});
function d0() {
  let e = C$();
  return Be((t) => A$({ mergeRefs: e, ...t }), [e]);
}
function A$({ ourProps: e, theirProps: t, slot: r, defaultTag: n, features: o, visible: a = !0, name: i, mergeRefs: s }) {
  s = s ?? $$;
  let c = p0(t, e);
  if (a) return Ga(c, r, n, i, s);
  let l = o ?? 0;
  if (l & 2) {
    let { static: u = !1, ...f } = c;
    if (u) return Ga(f, r, n, i, s);
  }
  if (l & 1) {
    let { unmount: u = !0, ...f } = c;
    return ss(u ? 0 : 1, { 0() {
      return null;
    }, 1() {
      return Ga({ ...f, hidden: !0, style: { display: "none" } }, r, n, i, s);
    } });
  }
  return Ga(c, r, n, i, s);
}
function Ga(e, t = {}, r, n, o) {
  let { as: a = r, children: i, refName: s = "ref", ...c } = xl(e, ["unmount", "static"]), l = e.ref !== void 0 ? { [s]: e.ref } : {}, u = typeof i == "function" ? i(t) : i;
  "className" in c && c.className && typeof c.className == "function" && (c.className = c.className(t)), c["aria-labelledby"] && c["aria-labelledby"] === c.id && (c["aria-labelledby"] = void 0);
  let f = {};
  if (t) {
    let d = !1, b = [];
    for (let [y, p] of Object.entries(t)) typeof p == "boolean" && (d = !0), p === !0 && b.push(y.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`));
    if (d) {
      f["data-headlessui-state"] = b.join(" ");
      for (let y of b) f[`data-${y}`] = "";
    }
  }
  if (a === Lt && (Object.keys(Hr(c)).length > 0 || Object.keys(Hr(f)).length > 0)) if (!di(u) || Array.isArray(u) && u.length > 1) {
    if (Object.keys(Hr(c)).length > 0) throw new Error(['Passing props on "Fragment"!', "", `The current component <${n} /> is rendering a "Fragment".`, "However we need to passthrough the following props:", Object.keys(Hr(c)).concat(Object.keys(Hr(f))).map((d) => `  - ${d}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".', "Render a single element as the child so that we can forward the props onto that element."].map((d) => `  - ${d}`).join(`
`)].join(`
`));
  } else {
    let d = u.props, b = d == null ? void 0 : d.className, y = typeof b == "function" ? (...x) => eu(b(...x), c.className) : eu(b, c.className), p = y ? { className: y } : {}, m = p0(u.props, Hr(xl(c, ["ref"])));
    for (let x in f) x in m && delete f[x];
    return pi(u, Object.assign({}, m, f, l, { ref: o(N$(u), l.ref) }, p));
  }
  return ph(a, Object.assign({}, xl(c, ["ref"]), a !== Lt && l, a !== Lt && f), u);
}
function C$() {
  let e = le([]), t = Be((r) => {
    for (let n of e.current) n != null && (typeof n == "function" ? n(r) : n.current = r);
  }, []);
  return (...r) => {
    if (!r.every((n) => n == null)) return e.current = r, t;
  };
}
function $$(...e) {
  return e.every((t) => t == null) ? void 0 : (t) => {
    for (let r of e) r != null && (typeof r == "function" ? r(t) : r.current = t);
  };
}
function p0(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let t = {}, r = {};
  for (let n of e) for (let o in n) o.startsWith("on") && typeof n[o] == "function" ? (r[o] != null || (r[o] = []), r[o].push(n[o])) : t[o] = n[o];
  if (t.disabled || t["aria-disabled"]) for (let n in r) /^(on(?:Click|Pointer|Mouse|Key)(?:Down|Up|Press)?)$/.test(n) && (r[n] = [(o) => {
    var a;
    return (a = o == null ? void 0 : o.preventDefault) == null ? void 0 : a.call(o);
  }]);
  for (let n in r) Object.assign(t, { [n](o, ...a) {
    let i = r[n];
    for (let s of i) {
      if ((o instanceof Event || (o == null ? void 0 : o.nativeEvent) instanceof Event) && o.defaultPrevented) return;
      s(o, ...a);
    }
  } });
  return t;
}
function Ff(e) {
  var t;
  return Object.assign(Nu(e), { displayName: (t = e.displayName) != null ? t : e.name });
}
function Hr(e) {
  let t = Object.assign({}, e);
  for (let r in t) t[r] === void 0 && delete t[r];
  return t;
}
function xl(e, t = []) {
  let r = Object.assign({}, e);
  for (let n of t) n in r && delete r[n];
  return r;
}
function N$(e) {
  return Oe.version.split(".")[0] >= "19" ? e.props.ref : e.ref;
}
let I$ = Symbol();
function m0(...e) {
  let t = le(e);
  Ne(() => {
    t.current = e;
  }, [e]);
  let r = Xt((n) => {
    for (let o of t.current) o != null && (typeof o == "function" ? o(n) : o.current = n);
  });
  return e.every((n) => n == null || (n == null ? void 0 : n[I$])) ? void 0 : r;
}
function T$(e = 0) {
  let [t, r] = Me(e), n = Be((c) => r(c), [t]), o = Be((c) => r((l) => l | c), [t]), a = Be((c) => (t & c) === c, [t]), i = Be((c) => r((l) => l & ~c), [r]), s = Be((c) => r((l) => l ^ c), [r]);
  return { flags: t, setFlag: n, addFlag: o, hasFlag: a, removeFlag: i, toggleFlag: s };
}
var hg, bg;
typeof process < "u" && typeof globalThis < "u" && typeof Element < "u" && ((hg = process == null ? void 0 : process.env) == null ? void 0 : hg.NODE_ENV) === "test" && typeof ((bg = Element == null ? void 0 : Element.prototype) == null ? void 0 : bg.getAnimations) > "u" && (Element.prototype.getAnimations = function() {
  return console.warn(["Headless UI has polyfilled `Element.prototype.getAnimations` for your tests.", "Please install a proper polyfill e.g. `jsdom-testing-mocks`, to silence these warnings.", "", "Example usage:", "```js", "import { mockAnimationsApi } from 'jsdom-testing-mocks'", "mockAnimationsApi()", "```"].join(`
`)), [];
});
var j$ = ((e) => (e[e.None = 0] = "None", e[e.Closed = 1] = "Closed", e[e.Enter = 2] = "Enter", e[e.Leave = 4] = "Leave", e))(j$ || {});
function _$(e) {
  let t = {};
  for (let r in e) e[r] === !0 && (t[`data-${r}`] = "");
  return t;
}
function M$(e, t, r, n) {
  let [o, a] = Me(r), { hasFlag: i, addFlag: s, removeFlag: c } = T$(e && o ? 3 : 0), l = le(!1), u = le(!1), f = c0();
  return Ir(() => {
    var d;
    if (e) {
      if (r && a(!0), !t) {
        r && s(3);
        return;
      }
      return (d = n == null ? void 0 : n.start) == null || d.call(n, r), z$(t, { inFlight: l, prepare() {
        u.current ? u.current = !1 : u.current = l.current, l.current = !0, !u.current && (r ? (s(3), c(4)) : (s(4), c(2)));
      }, run() {
        u.current ? r ? (c(3), s(4)) : (c(4), s(3)) : r ? c(1) : s(1);
      }, done() {
        var b;
        u.current && typeof t.getAnimations == "function" && t.getAnimations().length > 0 || (l.current = !1, c(7), r || a(!1), (b = n == null ? void 0 : n.end) == null || b.call(n, r));
      } });
    }
  }, [e, r, t, f]), e ? [o, { closed: i(1), enter: i(2), leave: i(4), transition: i(2) || i(4) }] : [r, { closed: void 0, enter: void 0, leave: void 0, transition: void 0 }];
}
function z$(e, { prepare: t, run: r, done: n, inFlight: o }) {
  let a = is();
  return F$(e, { prepare: t, inFlight: o }), a.nextFrame(() => {
    r(), a.requestAnimationFrame(() => {
      a.add(R$(e, n));
    });
  }), a.dispose;
}
function R$(e, t) {
  var r, n;
  let o = is();
  if (!e) return o.dispose;
  let a = !1;
  o.add(() => {
    a = !0;
  });
  let i = (n = (r = e.getAnimations) == null ? void 0 : r.call(e).filter((s) => s instanceof CSSTransition)) != null ? n : [];
  return i.length === 0 ? (t(), o.dispose) : (Promise.allSettled(i.map((s) => s.finished)).then(() => {
    a || t();
  }), o.dispose);
}
function F$(e, { inFlight: t, prepare: r }) {
  if (t != null && t.current) {
    r();
    return;
  }
  let n = e.style.transition;
  e.style.transition = "none", r(), e.offsetHeight, e.style.transition = n;
}
let Lf = Zn(null);
Lf.displayName = "OpenClosedContext";
var Jr = ((e) => (e[e.Open = 1] = "Open", e[e.Closed = 2] = "Closed", e[e.Closing = 4] = "Closing", e[e.Opening = 8] = "Opening", e))(Jr || {});
function g0() {
  return Vr(Lf);
}
function L$({ value: e, children: t }) {
  return Oe.createElement(Lf.Provider, { value: e }, t);
}
function D$() {
  let e = typeof document > "u";
  return "useSyncExternalStore" in T ? ((t) => t.useSyncExternalStore)(T)(() => () => {
  }, () => !1, () => !e) : !1;
}
function h0() {
  let e = D$(), [t, r] = T.useState(ci.isHandoffComplete);
  return t && ci.isHandoffComplete === !1 && r(!1), T.useEffect(() => {
    t !== !0 && r(!0);
  }, [t]), T.useEffect(() => ci.handoff(), []), e ? !1 : t;
}
function W$() {
  let e = le(!1);
  return Ir(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
}
function b0(e) {
  var t;
  return !!(e.enter || e.enterFrom || e.enterTo || e.leave || e.leaveFrom || e.leaveTo) || ((t = e.as) != null ? t : v0) !== Lt || Oe.Children.count(e.children) === 1;
}
let ls = Zn(null);
ls.displayName = "TransitionContext";
var U$ = ((e) => (e.Visible = "visible", e.Hidden = "hidden", e))(U$ || {});
function Y$() {
  let e = Vr(ls);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
function V$() {
  let e = Vr(cs);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
let cs = Zn(null);
cs.displayName = "NestingContext";
function us(e) {
  return "children" in e ? us(e.children) : e.current.filter(({ el: t }) => t.current !== null).filter(({ state: t }) => t === "visible").length > 0;
}
function y0(e, t) {
  let r = u0(e), n = le([]), o = W$(), a = c0(), i = Xt((b, y = Cr.Hidden) => {
    let p = n.current.findIndex(({ el: m }) => m === b);
    p !== -1 && (ss(y, { [Cr.Unmount]() {
      n.current.splice(p, 1);
    }, [Cr.Hidden]() {
      n.current[p].state = "hidden";
    } }), a.microTask(() => {
      var m;
      !us(n) && o.current && ((m = r.current) == null || m.call(r));
    }));
  }), s = Xt((b) => {
    let y = n.current.find(({ el: p }) => p === b);
    return y ? y.state !== "visible" && (y.state = "visible") : n.current.push({ el: b, state: "visible" }), () => i(b, Cr.Unmount);
  }), c = le([]), l = le(Promise.resolve()), u = le({ enter: [], leave: [] }), f = Xt((b, y, p) => {
    c.current.splice(0), t && (t.chains.current[y] = t.chains.current[y].filter(([m]) => m !== b)), t == null || t.chains.current[y].push([b, new Promise((m) => {
      c.current.push(m);
    })]), t == null || t.chains.current[y].push([b, new Promise((m) => {
      Promise.all(u.current[y].map(([x, w]) => w)).then(() => m());
    })]), y === "enter" ? l.current = l.current.then(() => t == null ? void 0 : t.wait.current).then(() => p(y)) : p(y);
  }), d = Xt((b, y, p) => {
    Promise.all(u.current[y].splice(0).map(([m, x]) => x)).then(() => {
      var m;
      (m = c.current.shift()) == null || m();
    }).then(() => p(y));
  });
  return ht(() => ({ children: n, register: s, unregister: i, onStart: f, onStop: d, wait: l, chains: u }), [s, i, n, f, d, u, l]);
}
let v0 = Lt, x0 = f0.RenderStrategy;
function G$(e, t) {
  var r, n;
  let { transition: o = !0, beforeEnter: a, afterEnter: i, beforeLeave: s, afterLeave: c, enter: l, enterFrom: u, enterTo: f, entered: d, leave: b, leaveFrom: y, leaveTo: p, ...m } = e, [x, w] = Me(null), O = le(null), E = b0(e), h = m0(...E ? [O, t, w] : t === null ? [] : [t]), W = (r = m.unmount) == null || r ? Cr.Unmount : Cr.Hidden, { show: F, appear: Z, initial: K } = Y$(), [H, Q] = Me(F ? "visible" : "hidden"), P = V$(), { register: ae, unregister: D } = P;
  Ir(() => ae(O), [ae, O]), Ir(() => {
    if (W === Cr.Hidden && O.current) {
      if (F && H !== "visible") {
        Q("visible");
        return;
      }
      return ss(H, { hidden: () => D(O), visible: () => ae(O) });
    }
  }, [H, O, ae, D, F, W]);
  let M = h0();
  Ir(() => {
    if (E && M && H === "visible" && O.current === null) throw new Error("Did you forget to passthrough the `ref` to the actual DOM node?");
  }, [O, H, M, E]);
  let R = K && !Z, X = Z && F && K, B = le(!1), J = y0(() => {
    B.current || (Q("hidden"), D(O));
  }, P), g = Xt(($) => {
    B.current = !0;
    let _ = $ ? "enter" : "leave";
    J.onStart(O, _, (j) => {
      j === "enter" ? a == null || a() : j === "leave" && (s == null || s());
    });
  }), v = Xt(($) => {
    let _ = $ ? "enter" : "leave";
    B.current = !1, J.onStop(O, _, (j) => {
      j === "enter" ? i == null || i() : j === "leave" && (c == null || c());
    }), _ === "leave" && !us(J) && (Q("hidden"), D(O));
  });
  Ne(() => {
    E && o || (g(F), v(F));
  }, [F, E, o]);
  let C = !(!o || !E || !M || R), [, A] = M$(C, x, F, { start: g, end: v }), S = Hr({ ref: h, className: ((n = eu(m.className, X && l, X && u, A.enter && l, A.enter && A.closed && u, A.enter && !A.closed && f, A.leave && b, A.leave && !A.closed && y, A.leave && A.closed && p, !A.transition && F && d)) == null ? void 0 : n.trim()) || void 0, ..._$(A) }), I = 0;
  H === "visible" && (I |= Jr.Open), H === "hidden" && (I |= Jr.Closed), F && H === "hidden" && (I |= Jr.Opening), !F && H === "visible" && (I |= Jr.Closing);
  let N = d0();
  return Oe.createElement(cs.Provider, { value: J }, Oe.createElement(L$, { value: I }, N({ ourProps: S, theirProps: m, defaultTag: v0, features: x0, visible: H === "visible", name: "Transition.Child" })));
}
function q$(e, t) {
  let { show: r, appear: n = !1, unmount: o = !0, ...a } = e, i = le(null), s = b0(e), c = m0(...s ? [i, t] : t === null ? [] : [t]);
  h0();
  let l = g0();
  if (r === void 0 && l !== null && (r = (l & Jr.Open) === Jr.Open), r === void 0) throw new Error("A <Transition /> is used but it is missing a `show={true | false}` prop.");
  let [u, f] = Me(r ? "visible" : "hidden"), d = y0(() => {
    r || f("hidden");
  }), [b, y] = Me(!0), p = le([r]);
  Ir(() => {
    b !== !1 && p.current[p.current.length - 1] !== r && (p.current.push(r), y(!1));
  }, [p, r]);
  let m = ht(() => ({ show: r, appear: n, initial: b }), [r, n, b]);
  Ir(() => {
    r ? f("visible") : !us(d) && i.current !== null && f("hidden");
  }, [r, d]);
  let x = { unmount: o }, w = Xt(() => {
    var h;
    b && y(!1), (h = e.beforeEnter) == null || h.call(e);
  }), O = Xt(() => {
    var h;
    b && y(!1), (h = e.beforeLeave) == null || h.call(e);
  }), E = d0();
  return Oe.createElement(cs.Provider, { value: d }, Oe.createElement(ls.Provider, { value: m }, E({ ourProps: { ...x, as: Lt, children: Oe.createElement(w0, { ref: c, ...x, ...a, beforeEnter: w, beforeLeave: O }) }, theirProps: {}, defaultTag: Lt, features: x0, visible: u === "visible", name: "Transition" })));
}
function H$(e, t) {
  let r = Vr(ls) !== null, n = g0() !== null;
  return Oe.createElement(Oe.Fragment, null, !r && n ? Oe.createElement(tu, { ref: t, ...e }) : Oe.createElement(w0, { ref: t, ...e }));
}
let tu = Ff(q$), w0 = Ff(G$), B$ = Ff(H$), X$ = Object.assign(tu, { Child: B$, Root: tu });
const Df = "-", K$ = (e) => {
  const t = Q$(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(Df);
      return a[0] === "" && a.length !== 1 && a.shift(), k0(a, t) || J$(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const i = r[o] || [];
      return a && n[o] ? [...i, ...n[o]] : i;
    }
  };
}, k0 = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], o = t.nextPart.get(n), a = o ? k0(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const i = e.join(Df);
  return (r = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : r.classGroupId;
}, yg = /^\[(.+)\]$/, J$ = (e) => {
  if (yg.test(e)) {
    const t = yg.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, Q$ = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return eN(Object.entries(e.classGroups), r).forEach(([o, a]) => {
    ru(a, n, o, t);
  }), n;
}, ru = (e, t, r, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : vg(t, o);
      a.classGroupId = r;
      return;
    }
    if (typeof o == "function") {
      if (Z$(o)) {
        ru(o(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: r
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      ru(i, vg(t, a), r, n);
    });
  });
}, vg = (e, t) => {
  let r = e;
  return t.split(Df).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, Z$ = (e) => e.isThemeGetter, eN = (e, t) => t ? e.map(([r, n]) => {
  const o = n.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [r, o];
}) : e, tN = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const o = (a, i) => {
    r.set(a, i), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = r.get(a);
      if (i !== void 0)
        return i;
      if ((i = n.get(a)) !== void 0)
        return o(a, i), i;
    },
    set(a, i) {
      r.has(a) ? r.set(a, i) : o(a, i);
    }
  };
}, O0 = "!", rN = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const c = [];
    let l = 0, u = 0, f;
    for (let m = 0; m < s.length; m++) {
      let x = s[m];
      if (l === 0) {
        if (x === o && (n || s.slice(m, m + a) === t)) {
          c.push(s.slice(u, m)), u = m + a;
          continue;
        }
        if (x === "/") {
          f = m;
          continue;
        }
      }
      x === "[" ? l++ : x === "]" && l--;
    }
    const d = c.length === 0 ? s : s.substring(u), b = d.startsWith(O0), y = b ? d.substring(1) : d, p = f && f > u ? f - u : void 0;
    return {
      modifiers: c,
      hasImportantModifier: b,
      baseClassName: y,
      maybePostfixModifierPosition: p
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, nN = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, oN = (e) => ({
  cache: tN(e.cacheSize),
  parseClassName: rN(e),
  ...K$(e)
}), aN = /\s+/, iN = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(aN);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: b
    } = r(l);
    let y = !!b, p = n(y ? d.substring(0, b) : d);
    if (!p) {
      if (!y) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (p = n(d), !p) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      y = !1;
    }
    const m = nN(u).join(":"), x = f ? m + O0 : m, w = x + p;
    if (a.includes(w))
      continue;
    a.push(w);
    const O = o(p, y);
    for (let E = 0; E < O.length; ++E) {
      const h = O[E];
      a.push(x + h);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function sN() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = E0(t)) && (n && (n += " "), n += r);
  return n;
}
const E0 = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = E0(e[n])) && (r && (r += " "), r += t);
  return r;
};
function lN(e, ...t) {
  let r, n, o, a = i;
  function i(c) {
    const l = t.reduce((u, f) => f(u), e());
    return r = oN(l), n = r.cache.get, o = r.cache.set, a = s, s(c);
  }
  function s(c) {
    const l = n(c);
    if (l)
      return l;
    const u = iN(c, r);
    return o(c, u), u;
  }
  return function() {
    return a(sN.apply(null, arguments));
  };
}
const Ue = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, P0 = /^\[(?:([a-z-]+):)?(.+)\]$/i, cN = /^\d+\/\d+$/, uN = /* @__PURE__ */ new Set(["px", "full", "screen"]), fN = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, dN = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, pN = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, mN = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, gN = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Ht = (e) => Vn(e) || uN.has(e) || cN.test(e), kr = (e) => uo(e, "length", ON), Vn = (e) => !!e && !Number.isNaN(Number(e)), wl = (e) => uo(e, "number", Vn), $o = (e) => !!e && Number.isInteger(Number(e)), hN = (e) => e.endsWith("%") && Vn(e.slice(0, -1)), he = (e) => P0.test(e), Or = (e) => fN.test(e), bN = /* @__PURE__ */ new Set(["length", "size", "percentage"]), yN = (e) => uo(e, bN, S0), vN = (e) => uo(e, "position", S0), xN = /* @__PURE__ */ new Set(["image", "url"]), wN = (e) => uo(e, xN, PN), kN = (e) => uo(e, "", EN), No = () => !0, uo = (e, t, r) => {
  const n = P0.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, ON = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  dN.test(e) && !pN.test(e)
), S0 = () => !1, EN = (e) => mN.test(e), PN = (e) => gN.test(e), SN = () => {
  const e = Ue("colors"), t = Ue("spacing"), r = Ue("blur"), n = Ue("brightness"), o = Ue("borderColor"), a = Ue("borderRadius"), i = Ue("borderSpacing"), s = Ue("borderWidth"), c = Ue("contrast"), l = Ue("grayscale"), u = Ue("hueRotate"), f = Ue("invert"), d = Ue("gap"), b = Ue("gradientColorStops"), y = Ue("gradientColorStopPositions"), p = Ue("inset"), m = Ue("margin"), x = Ue("opacity"), w = Ue("padding"), O = Ue("saturate"), E = Ue("scale"), h = Ue("sepia"), W = Ue("skew"), F = Ue("space"), Z = Ue("translate"), K = () => ["auto", "contain", "none"], H = () => ["auto", "hidden", "clip", "visible", "scroll"], Q = () => ["auto", he, t], P = () => [he, t], ae = () => ["", Ht, kr], D = () => ["auto", Vn, he], M = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], R = () => ["solid", "dashed", "dotted", "double", "none"], X = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], B = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], J = () => ["", "0", he], g = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], v = () => [Vn, he];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [No],
      spacing: [Ht, kr],
      blur: ["none", "", Or, he],
      brightness: v(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Or, he],
      borderSpacing: P(),
      borderWidth: ae(),
      contrast: v(),
      grayscale: J(),
      hueRotate: v(),
      invert: J(),
      gap: P(),
      gradientColorStops: [e],
      gradientColorStopPositions: [hN, kr],
      inset: Q(),
      margin: Q(),
      opacity: v(),
      padding: P(),
      saturate: v(),
      scale: v(),
      sepia: J(),
      skew: v(),
      space: P(),
      translate: P()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", he]
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
        columns: [Or]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": g()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": g()
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
        object: [...M(), he]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: H()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": H()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": H()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: K()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": K()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": K()
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
        inset: [p]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [p]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [p]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [p]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [p]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [p]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [p]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [p]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [p]
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
        z: ["auto", $o, he]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: Q()
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
        flex: ["1", "auto", "initial", "none", he]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: J()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: J()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", $o, he]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [No]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", $o, he]
        }, he]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": D()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": D()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [No]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [$o, he]
        }, he]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": D()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": D()
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
        "auto-cols": ["auto", "min", "max", "fr", he]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", he]
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
        p: [w]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [w]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [w]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [w]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [w]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [w]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [w]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [w]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [w]
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
        "space-x": [F]
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
        "space-y": [F]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", he, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [he, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [he, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Or]
        }, Or]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [he, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [he, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [he, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [he, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Or, kr]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", wl]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [No]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", he]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Vn, wl]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Ht, he]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", he]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", he]
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
        "placeholder-opacity": [x]
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
        "text-opacity": [x]
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
        decoration: [...R(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", Ht, kr]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Ht, he]
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
        indent: P()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", he]
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
        content: ["none", he]
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
        "bg-opacity": [x]
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
        bg: [...M(), vN]
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
        bg: ["auto", "cover", "contain", yN]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, wN]
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
        from: [y]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [y]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [y]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [b]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [b]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [b]
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
        "border-opacity": [x]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...R(), "hidden"]
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
        "divide-opacity": [x]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: R()
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
        outline: ["", ...R()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Ht, he]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Ht, kr]
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
        ring: ae()
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
        "ring-opacity": [x]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [Ht, kr]
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
        shadow: ["", "inner", "none", Or, kN]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [No]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [x]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...X(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": X()
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
        blur: [r]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [n]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [c]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", Or, he]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [l]
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
        saturate: [O]
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
        "backdrop-blur": [r]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [n]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [c]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [l]
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
        "backdrop-opacity": [x]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [O]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", he]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: v()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", he]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: v()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", he]
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
        rotate: [$o, he]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [Z]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [Z]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [W]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [W]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", he]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", he]
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
        "scroll-m": P()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": P()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": P()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": P()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": P()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": P()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": P()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": P()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": P()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": P()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": P()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": P()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": P()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": P()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": P()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": P()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": P()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": P()
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
        "will-change": ["auto", "scroll", "contents", "transform", he]
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
        stroke: [Ht, kr, wl]
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
}, xg = /* @__PURE__ */ lN(SN), AN = ({
  children: e,
  content: t,
  position: r,
  className: n,
  delay: o = 300,
  closeOnClick: a = !1,
  imageSrc: i,
  description: s,
  interactive: c = !1
}) => {
  const [l, u] = Me(!1), f = le(null), d = le(null), [b, y] = Me(!1), [p, m] = Me(!1), x = () => f.current ? f.current.querySelectorAll('[data-headlessui-state="open"]').length > 0 : !1;
  Ne(() => {
    const E = new MutationObserver((h) => {
      h.forEach((W) => {
        W.type === "attributes" && W.attributeName === "data-headlessui-state" && W.target.getAttribute("data-headlessui-state") === "open" && u(!1);
      });
    });
    return f.current && E.observe(f.current, {
      attributes: !0,
      subtree: !0,
      attributeFilter: ["data-headlessui-state"]
    }), () => {
      E.disconnect();
    };
  }, []);
  const w = () => {
    if (f.current) {
      const E = f.current.getBoundingClientRect();
      switch (r) {
        case "top":
          return {
            bottom: E.height + 10,
            left: "50%",
            transform: "translateX(-50%)"
          };
        case "bottom":
          return {
            top: E.height + 10,
            left: "50%",
            transform: "translateX(-50%)"
          };
        case "left":
          return {
            right: E.width + 10,
            top: "50%",
            transform: "translateY(-50%)"
          };
        case "right":
          return {
            left: E.width + 10,
            top: "50%",
            transform: "translateY(-50%)"
          };
        default:
          return {};
      }
    }
    return {};
  }, O = (E) => {
    a && (u(!1), E.stopPropagation());
  };
  return Ne(() => {
    x() || u(b || c && p);
  }, [b, p, c]), /* @__PURE__ */ Ee(
    "div",
    {
      ref: f,
      onMouseEnter: () => {
        y(!0), x() || u(!0);
      },
      onMouseLeave: () => {
        y(!1), c || u(!1);
      },
      onClick: O,
      className: "relative",
      children: [
        e,
        /* @__PURE__ */ L(
          X$,
          {
            show: l,
            enter: xg(
              "transition ease-out duration-200",
              o ? `delay-[${o}ms]` : "delay-[300ms]"
            ),
            enterFrom: "opacity-0",
            enterTo: "opacity-100",
            leave: "transition ease-in duration-150",
            leaveFrom: "opacity-100",
            leaveTo: "opacity-0",
            children: /* @__PURE__ */ L(
              "div",
              {
                ref: d,
                onMouseEnter: () => c && m(!0),
                onMouseLeave: () => c && m(!1),
                style: {
                  ...w(),
                  transitionDelay: `${o}ms`,
                  transitionProperty: "opacity",
                  transitionDuration: "200ms",
                  transitionTimingFunction: "ease-out"
                },
                className: xg(
                  "absolute z-10 w-max rounded-lg bg-ui-controls px-2.5 py-1.5 text-[13px] font-medium text-base-fg shadow-xl border border-ui-panel-border",
                  c ? "pointer-events-auto" : "pointer-events-none",
                  n || ""
                ),
                children: /* @__PURE__ */ Ee("div", { className: "flex flex-col gap-1", children: [
                  t,
                  i && /* @__PURE__ */ L(
                    "img",
                    {
                      src: i,
                      alt: "tooltip",
                      className: "mb-1 aspect-square w-56 rounded-md"
                    }
                  ),
                  s && /* @__PURE__ */ L("p", { className: "text-sm text-base-fg font-normal", children: s })
                ] })
              }
            )
          }
        )
      ]
    }
  );
}, A0 = typeof document < "u" ? Oe.useLayoutEffect : () => {
};
function CN(e) {
  const t = le(null);
  return A0(() => {
    t.current = e;
  }, [
    e
  ]), Be((...r) => {
    const n = t.current;
    return n == null ? void 0 : n(...r);
  }, []);
}
const Gr = (e) => {
  var t;
  return (t = e == null ? void 0 : e.ownerDocument) !== null && t !== void 0 ? t : document;
}, Qr = (e) => e && "window" in e && e.window === e ? e : Gr(e).defaultView || window;
function C0(e, t) {
  return t && e ? e.contains(t) : !1;
}
const nu = (e = document) => e.activeElement;
function $0(e) {
  return e.target;
}
function $N(e) {
  var t;
  return typeof window > "u" || window.navigator == null ? !1 : ((t = window.navigator.userAgentData) === null || t === void 0 ? void 0 : t.brands.some((r) => e.test(r.brand))) || e.test(window.navigator.userAgent);
}
function NN(e) {
  var t;
  return typeof window < "u" && window.navigator != null ? e.test(((t = window.navigator.userAgentData) === null || t === void 0 ? void 0 : t.platform) || window.navigator.platform) : !1;
}
function N0(e) {
  let t = null;
  return () => (t == null && (t = e()), t);
}
const IN = N0(function() {
  return NN(/^Mac/i);
}), TN = N0(function() {
  return $N(/Android/i);
});
function I0() {
  let e = le(/* @__PURE__ */ new Map()), t = Be((o, a, i, s) => {
    let c = s != null && s.once ? (...l) => {
      e.current.delete(i), i(...l);
    } : i;
    e.current.set(i, {
      type: a,
      eventTarget: o,
      fn: c,
      options: s
    }), o.addEventListener(a, c, s);
  }, []), r = Be((o, a, i, s) => {
    var c;
    let l = ((c = e.current.get(i)) === null || c === void 0 ? void 0 : c.fn) || i;
    o.removeEventListener(a, l, s), e.current.delete(i);
  }, []), n = Be(() => {
    e.current.forEach((o, a) => {
      r(o.eventTarget, o.type, a, o.options);
    });
  }, [
    r
  ]);
  return Ne(() => n, [
    n
  ]), {
    addGlobalListener: t,
    removeGlobalListener: r,
    removeAllGlobalListeners: n
  };
}
function jN(e) {
  return e.mozInputSource === 0 && e.isTrusted ? !0 : TN() && e.pointerType ? e.type === "click" && e.buttons === 1 : e.detail === 0 && !e.pointerType;
}
class T0 {
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
  constructor(t, r) {
    this.nativeEvent = r, this.target = r.target, this.currentTarget = r.currentTarget, this.relatedTarget = r.relatedTarget, this.bubbles = r.bubbles, this.cancelable = r.cancelable, this.defaultPrevented = r.defaultPrevented, this.eventPhase = r.eventPhase, this.isTrusted = r.isTrusted, this.timeStamp = r.timeStamp, this.type = t;
  }
}
function j0(e) {
  let t = le({
    isFocused: !1,
    observer: null
  });
  A0(() => {
    const n = t.current;
    return () => {
      n.observer && (n.observer.disconnect(), n.observer = null);
    };
  }, []);
  let r = CN((n) => {
    e == null || e(n);
  });
  return Be((n) => {
    if (n.target instanceof HTMLButtonElement || n.target instanceof HTMLInputElement || n.target instanceof HTMLTextAreaElement || n.target instanceof HTMLSelectElement) {
      t.current.isFocused = !0;
      let o = n.target, a = (i) => {
        t.current.isFocused = !1, o.disabled && r(new T0("blur", i)), t.current.observer && (t.current.observer.disconnect(), t.current.observer = null);
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
    r
  ]);
}
let _N = !1, Pa = null, ou = /* @__PURE__ */ new Set(), Xo = /* @__PURE__ */ new Map(), un = !1, au = !1;
const MN = {
  Tab: !0,
  Escape: !0
};
function Wf(e, t) {
  for (let r of ou) r(e, t);
}
function zN(e) {
  return !(e.metaKey || !IN() && e.altKey || e.ctrlKey || e.key === "Control" || e.key === "Shift" || e.key === "Meta");
}
function $i(e) {
  un = !0, zN(e) && (Pa = "keyboard", Wf("keyboard", e));
}
function mt(e) {
  Pa = "pointer", (e.type === "mousedown" || e.type === "pointerdown") && (un = !0, Wf("pointer", e));
}
function _0(e) {
  jN(e) && (un = !0, Pa = "virtual");
}
function M0(e) {
  e.target === window || e.target === document || _N || !e.isTrusted || (!un && !au && (Pa = "virtual", Wf("virtual", e)), un = !1, au = !1);
}
function z0() {
  un = !1, au = !0;
}
function iu(e) {
  if (typeof window > "u" || Xo.get(Qr(e))) return;
  const t = Qr(e), r = Gr(e);
  let n = t.HTMLElement.prototype.focus;
  t.HTMLElement.prototype.focus = function() {
    un = !0, n.apply(this, arguments);
  }, r.addEventListener("keydown", $i, !0), r.addEventListener("keyup", $i, !0), r.addEventListener("click", _0, !0), t.addEventListener("focus", M0, !0), t.addEventListener("blur", z0, !1), typeof PointerEvent < "u" ? (r.addEventListener("pointerdown", mt, !0), r.addEventListener("pointermove", mt, !0), r.addEventListener("pointerup", mt, !0)) : (r.addEventListener("mousedown", mt, !0), r.addEventListener("mousemove", mt, !0), r.addEventListener("mouseup", mt, !0)), t.addEventListener("beforeunload", () => {
    R0(e);
  }, {
    once: !0
  }), Xo.set(t, {
    focus: n
  });
}
const R0 = (e, t) => {
  const r = Qr(e), n = Gr(e);
  t && n.removeEventListener("DOMContentLoaded", t), Xo.has(r) && (r.HTMLElement.prototype.focus = Xo.get(r).focus, n.removeEventListener("keydown", $i, !0), n.removeEventListener("keyup", $i, !0), n.removeEventListener("click", _0, !0), r.removeEventListener("focus", M0, !0), r.removeEventListener("blur", z0, !1), typeof PointerEvent < "u" ? (n.removeEventListener("pointerdown", mt, !0), n.removeEventListener("pointermove", mt, !0), n.removeEventListener("pointerup", mt, !0)) : (n.removeEventListener("mousedown", mt, !0), n.removeEventListener("mousemove", mt, !0), n.removeEventListener("mouseup", mt, !0)), Xo.delete(r));
};
function RN(e) {
  const t = Gr(e);
  let r;
  return t.readyState !== "loading" ? iu(e) : (r = () => {
    iu(e);
  }, t.addEventListener("DOMContentLoaded", r)), () => R0(e, r);
}
typeof document < "u" && RN();
function F0() {
  return Pa !== "pointer";
}
const FN = /* @__PURE__ */ new Set([
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
function LN(e, t, r) {
  let n = Gr(r == null ? void 0 : r.target);
  const o = typeof window < "u" ? Qr(r == null ? void 0 : r.target).HTMLInputElement : HTMLInputElement, a = typeof window < "u" ? Qr(r == null ? void 0 : r.target).HTMLTextAreaElement : HTMLTextAreaElement, i = typeof window < "u" ? Qr(r == null ? void 0 : r.target).HTMLElement : HTMLElement, s = typeof window < "u" ? Qr(r == null ? void 0 : r.target).KeyboardEvent : KeyboardEvent;
  return e = e || n.activeElement instanceof o && !FN.has(n.activeElement.type) || n.activeElement instanceof a || n.activeElement instanceof i && n.activeElement.isContentEditable, !(e && t === "keyboard" && r instanceof s && !MN[r.key]);
}
function DN(e, t, r) {
  iu(), Ne(() => {
    let n = (o, a) => {
      LN(!!(r != null && r.isTextInput), o, a) && e(F0());
    };
    return ou.add(n), () => {
      ou.delete(n);
    };
  }, t);
}
function WN(e) {
  let { isDisabled: t, onFocus: r, onBlur: n, onFocusChange: o } = e;
  const a = Be((c) => {
    if (c.target === c.currentTarget)
      return n && n(c), o && o(!1), !0;
  }, [
    n,
    o
  ]), i = j0(a), s = Be((c) => {
    const l = Gr(c.target), u = l ? nu(l) : nu();
    c.target === c.currentTarget && u === $0(c.nativeEvent) && (r && r(c), o && o(!0), i(c));
  }, [
    o,
    r,
    i
  ]);
  return {
    focusProps: {
      onFocus: !t && (r || o || n) ? s : void 0,
      onBlur: !t && (n || o) ? a : void 0
    }
  };
}
function UN(e) {
  let { isDisabled: t, onBlurWithin: r, onFocusWithin: n, onFocusWithinChange: o } = e, a = le({
    isFocusWithin: !1
  }), { addGlobalListener: i, removeAllGlobalListeners: s } = I0(), c = Be((f) => {
    f.currentTarget.contains(f.target) && a.current.isFocusWithin && !f.currentTarget.contains(f.relatedTarget) && (a.current.isFocusWithin = !1, s(), r && r(f), o && o(!1));
  }, [
    r,
    o,
    a,
    s
  ]), l = j0(c), u = Be((f) => {
    if (!f.currentTarget.contains(f.target)) return;
    const d = Gr(f.target), b = nu(d);
    if (!a.current.isFocusWithin && b === $0(f.nativeEvent)) {
      n && n(f), o && o(!0), a.current.isFocusWithin = !0, l(f);
      let y = f.currentTarget;
      i(d, "focus", (p) => {
        if (a.current.isFocusWithin && !C0(y, p.target)) {
          let m = new T0("blur", new d.defaultView.FocusEvent("blur", {
            relatedTarget: p.target
          }));
          m.target = y, m.currentTarget = y, c(m);
        }
      }, {
        capture: !0
      });
    }
  }, [
    n,
    o,
    l,
    i,
    c
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
      onBlur: c
    }
  };
}
let Ni = !1, kl = 0;
function su() {
  Ni = !0, setTimeout(() => {
    Ni = !1;
  }, 50);
}
function wg(e) {
  e.pointerType === "touch" && su();
}
function YN() {
  if (!(typeof document > "u"))
    return typeof PointerEvent < "u" ? document.addEventListener("pointerup", wg) : document.addEventListener("touchend", su), kl++, () => {
      kl--, !(kl > 0) && (typeof PointerEvent < "u" ? document.removeEventListener("pointerup", wg) : document.removeEventListener("touchend", su));
    };
}
function VN(e) {
  let { onHoverStart: t, onHoverChange: r, onHoverEnd: n, isDisabled: o } = e, [a, i] = Me(!1), s = le({
    isHovered: !1,
    ignoreEmulatedMouseEvents: !1,
    pointerType: "",
    target: null
  }).current;
  Ne(YN, []);
  let { addGlobalListener: c, removeAllGlobalListeners: l } = I0(), { hoverProps: u, triggerHoverEnd: f } = ht(() => {
    let d = (p, m) => {
      if (s.pointerType = m, o || m === "touch" || s.isHovered || !p.currentTarget.contains(p.target)) return;
      s.isHovered = !0;
      let x = p.currentTarget;
      s.target = x, c(Gr(p.target), "pointerover", (w) => {
        s.isHovered && s.target && !C0(s.target, w.target) && b(w, w.pointerType);
      }, {
        capture: !0
      }), t && t({
        type: "hoverstart",
        target: x,
        pointerType: m
      }), r && r(!0), i(!0);
    }, b = (p, m) => {
      let x = s.target;
      s.pointerType = "", s.target = null, !(m === "touch" || !s.isHovered || !x) && (s.isHovered = !1, l(), n && n({
        type: "hoverend",
        target: x,
        pointerType: m
      }), r && r(!1), i(!1));
    }, y = {};
    return typeof PointerEvent < "u" ? (y.onPointerEnter = (p) => {
      Ni && p.pointerType === "mouse" || d(p, p.pointerType);
    }, y.onPointerLeave = (p) => {
      !o && p.currentTarget.contains(p.target) && b(p, p.pointerType);
    }) : (y.onTouchStart = () => {
      s.ignoreEmulatedMouseEvents = !0;
    }, y.onMouseEnter = (p) => {
      !s.ignoreEmulatedMouseEvents && !Ni && d(p, "mouse"), s.ignoreEmulatedMouseEvents = !1;
    }, y.onMouseLeave = (p) => {
      !o && p.currentTarget.contains(p.target) && b(p, "mouse");
    }), {
      hoverProps: y,
      triggerHoverEnd: b
    };
  }, [
    t,
    r,
    n,
    o,
    s,
    c,
    l
  ]);
  return Ne(() => {
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
function L0(e = {}) {
  let { autoFocus: t = !1, isTextInput: r, within: n } = e, o = le({
    isFocused: !1,
    isFocusVisible: t || F0()
  }), [a, i] = Me(!1), [s, c] = Me(() => o.current.isFocused && o.current.isFocusVisible), l = Be(() => c(o.current.isFocused && o.current.isFocusVisible), []), u = Be((b) => {
    o.current.isFocused = b, i(b), l();
  }, [
    l
  ]);
  DN((b) => {
    o.current.isFocusVisible = b, l();
  }, [], {
    isTextInput: r
  });
  let { focusProps: f } = WN({
    isDisabled: n,
    onFocusChange: u
  }), { focusWithinProps: d } = UN({
    isDisabled: !n,
    onFocusWithinChange: u
  });
  return {
    isFocused: a,
    isFocusVisible: s,
    focusProps: n ? d : f
  };
}
var GN = Object.defineProperty, qN = (e, t, r) => t in e ? GN(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r, Ol = (e, t, r) => (qN(e, typeof t != "symbol" ? t + "" : t, r), r);
let HN = class {
  constructor() {
    Ol(this, "current", this.detect()), Ol(this, "handoffState", "pending"), Ol(this, "currentId", 0);
  }
  set(e) {
    this.current !== e && (this.handoffState = "pending", this.currentId = 0, this.current = e);
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
}, D0 = new HN();
function W0(e) {
  var t, r;
  return D0.isServer ? null : e ? "ownerDocument" in e ? e.ownerDocument : "current" in e ? (r = (t = e.current) == null ? void 0 : t.ownerDocument) != null ? r : document : null : document;
}
function U0(e) {
  typeof queueMicrotask == "function" ? queueMicrotask(e) : Promise.resolve().then(e).catch((t) => setTimeout(() => {
    throw t;
  }));
}
function Y0() {
  let e = [], t = { addEventListener(r, n, o, a) {
    return r.addEventListener(n, o, a), t.add(() => r.removeEventListener(n, o, a));
  }, requestAnimationFrame(...r) {
    let n = requestAnimationFrame(...r);
    return t.add(() => cancelAnimationFrame(n));
  }, nextFrame(...r) {
    return t.requestAnimationFrame(() => t.requestAnimationFrame(...r));
  }, setTimeout(...r) {
    let n = setTimeout(...r);
    return t.add(() => clearTimeout(n));
  }, microTask(...r) {
    let n = { current: !0 };
    return U0(() => {
      n.current && r[0]();
    }), t.add(() => {
      n.current = !1;
    });
  }, style(r, n, o) {
    let a = r.style.getPropertyValue(n);
    return Object.assign(r.style, { [n]: o }), this.add(() => {
      Object.assign(r.style, { [n]: a });
    });
  }, group(r) {
    let n = Y0();
    return r(n), this.add(() => n.dispose());
  }, add(r) {
    return e.includes(r) || e.push(r), () => {
      let n = e.indexOf(r);
      if (n >= 0) for (let o of e.splice(n, 1)) o();
    };
  }, dispose() {
    for (let r of e.splice(0)) r();
  } };
  return t;
}
function BN() {
  let [e] = Me(Y0);
  return Ne(() => () => e.dispose(), [e]), e;
}
let Kn = (e, t) => {
  D0.isServer ? Ne(e, t) : $u(e, t);
};
function Mo(e) {
  let t = le(e);
  return Kn(() => {
    t.current = e;
  }, [e]), t;
}
let zt = function(e) {
  let t = Mo(e);
  return Oe.useCallback((...r) => t.current(...r), [t]);
};
function XN(e) {
  let t = e.width / 2, r = e.height / 2;
  return { top: e.clientY - r, right: e.clientX + t, bottom: e.clientY + r, left: e.clientX - t };
}
function KN(e, t) {
  return !(!e || !t || e.right < t.left || e.left > t.right || e.bottom < t.top || e.top > t.bottom);
}
function JN({ disabled: e = !1 } = {}) {
  let t = le(null), [r, n] = Me(!1), o = BN(), a = zt(() => {
    t.current = null, n(!1), o.dispose();
  }), i = zt((s) => {
    if (o.dispose(), t.current === null) {
      t.current = s.currentTarget, n(!0);
      {
        let c = W0(s.currentTarget);
        o.addEventListener(c, "pointerup", a, !1), o.addEventListener(c, "pointermove", (l) => {
          if (t.current) {
            let u = XN(l);
            n(KN(u, t.current.getBoundingClientRect()));
          }
        }, !1), o.addEventListener(c, "pointercancel", a, !1);
      }
    }
  });
  return { pressed: r, pressProps: e ? {} : { onPointerDown: i, onPointerUp: a, onClick: a } };
}
function kg(...e) {
  return Array.from(new Set(e.flatMap((t) => typeof t == "string" ? t.split(" ") : []))).filter(Boolean).join(" ");
}
function en(e, t, ...r) {
  if (e in t) {
    let o = t[e];
    return typeof o == "function" ? o(...r) : o;
  }
  let n = new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map((o) => `"${o}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(n, en), n;
}
var lu = ((e) => (e[e.None = 0] = "None", e[e.RenderStrategy = 1] = "RenderStrategy", e[e.Static = 2] = "Static", e))(lu || {}), QN = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(QN || {});
function fo() {
  let e = e6();
  return Be((t) => ZN({ mergeRefs: e, ...t }), [e]);
}
function ZN({ ourProps: e, theirProps: t, slot: r, defaultTag: n, features: o, visible: a = !0, name: i, mergeRefs: s }) {
  s = s ?? t6;
  let c = V0(t, e);
  if (a) return qa(c, r, n, i, s);
  let l = o ?? 0;
  if (l & 2) {
    let { static: u = !1, ...f } = c;
    if (u) return qa(f, r, n, i, s);
  }
  if (l & 1) {
    let { unmount: u = !0, ...f } = c;
    return en(u ? 0 : 1, { 0() {
      return null;
    }, 1() {
      return qa({ ...f, hidden: !0, style: { display: "none" } }, r, n, i, s);
    } });
  }
  return qa(c, r, n, i, s);
}
function qa(e, t = {}, r, n, o) {
  let { as: a = r, children: i, refName: s = "ref", ...c } = El(e, ["unmount", "static"]), l = e.ref !== void 0 ? { [s]: e.ref } : {}, u = typeof i == "function" ? i(t) : i;
  "className" in c && c.className && typeof c.className == "function" && (c.className = c.className(t)), c["aria-labelledby"] && c["aria-labelledby"] === c.id && (c["aria-labelledby"] = void 0);
  let f = {};
  if (t) {
    let d = !1, b = [];
    for (let [y, p] of Object.entries(t)) typeof p == "boolean" && (d = !0), p === !0 && b.push(y.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`));
    if (d) {
      f["data-headlessui-state"] = b.join(" ");
      for (let y of b) f[`data-${y}`] = "";
    }
  }
  if (a === Lt && (Object.keys(xn(c)).length > 0 || Object.keys(xn(f)).length > 0)) if (!di(u) || Array.isArray(u) && u.length > 1) {
    if (Object.keys(xn(c)).length > 0) throw new Error(['Passing props on "Fragment"!', "", `The current component <${n} /> is rendering a "Fragment".`, "However we need to passthrough the following props:", Object.keys(xn(c)).concat(Object.keys(xn(f))).map((d) => `  - ${d}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".', "Render a single element as the child so that we can forward the props onto that element."].map((d) => `  - ${d}`).join(`
`)].join(`
`));
  } else {
    let d = u.props, b = d == null ? void 0 : d.className, y = typeof b == "function" ? (...x) => kg(b(...x), c.className) : kg(b, c.className), p = y ? { className: y } : {}, m = V0(u.props, xn(El(c, ["ref"])));
    for (let x in f) x in m && delete f[x];
    return pi(u, Object.assign({}, m, f, l, { ref: o(r6(u), l.ref) }, p));
  }
  return ph(a, Object.assign({}, El(c, ["ref"]), a !== Lt && l, a !== Lt && f), u);
}
function e6() {
  let e = le([]), t = Be((r) => {
    for (let n of e.current) n != null && (typeof n == "function" ? n(r) : n.current = r);
  }, []);
  return (...r) => {
    if (!r.every((n) => n == null)) return e.current = r, t;
  };
}
function t6(...e) {
  return e.every((t) => t == null) ? void 0 : (t) => {
    for (let r of e) r != null && (typeof r == "function" ? r(t) : r.current = t);
  };
}
function V0(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let t = {}, r = {};
  for (let n of e) for (let o in n) o.startsWith("on") && typeof n[o] == "function" ? (r[o] != null || (r[o] = []), r[o].push(n[o])) : t[o] = n[o];
  if (t.disabled || t["aria-disabled"]) for (let n in r) /^(on(?:Click|Pointer|Mouse|Key)(?:Down|Up|Press)?)$/.test(n) && (r[n] = [(o) => {
    var a;
    return (a = o == null ? void 0 : o.preventDefault) == null ? void 0 : a.call(o);
  }]);
  for (let n in r) Object.assign(t, { [n](o, ...a) {
    let i = r[n];
    for (let s of i) {
      if ((o instanceof Event || (o == null ? void 0 : o.nativeEvent) instanceof Event) && o.defaultPrevented) return;
      s(o, ...a);
    }
  } });
  return t;
}
function G0(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let t = {}, r = {};
  for (let n of e) for (let o in n) o.startsWith("on") && typeof n[o] == "function" ? (r[o] != null || (r[o] = []), r[o].push(n[o])) : t[o] = n[o];
  for (let n in r) Object.assign(t, { [n](...o) {
    let a = r[n];
    for (let i of a) i == null || i(...o);
  } });
  return t;
}
function po(e) {
  var t;
  return Object.assign(Nu(e), { displayName: (t = e.displayName) != null ? t : e.name });
}
function xn(e) {
  let t = Object.assign({}, e);
  for (let r in t) t[r] === void 0 && delete t[r];
  return t;
}
function El(e, t = []) {
  let r = Object.assign({}, e);
  for (let n of t) n in r && delete r[n];
  return r;
}
function r6(e) {
  return Oe.version.split(".")[0] >= "19" ? e.props.ref : e.ref;
}
let n6 = "span";
var q0 = ((e) => (e[e.None = 1] = "None", e[e.Focusable = 2] = "Focusable", e[e.Hidden = 4] = "Hidden", e))(q0 || {});
function o6(e, t) {
  var r;
  let { features: n = 1, ...o } = e, a = { ref: t, "aria-hidden": (n & 2) === 2 ? !0 : (r = o["aria-hidden"]) != null ? r : void 0, hidden: (n & 4) === 4 ? !0 : void 0, style: { position: "fixed", top: 1, left: 1, width: 1, height: 0, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: "0", ...(n & 4) === 4 && (n & 2) !== 2 && { display: "none" } } };
  return fo()({ ourProps: a, theirProps: o, slot: {}, defaultTag: n6, name: "Hidden" });
}
let H0 = po(o6), a6 = Symbol();
function Sa(...e) {
  let t = le(e);
  Ne(() => {
    t.current = e;
  }, [e]);
  let r = zt((n) => {
    for (let o of t.current) o != null && (typeof o == "function" ? o(n) : o.current = n);
  });
  return e.every((n) => n == null || (n == null ? void 0 : n[a6])) ? void 0 : r;
}
var bt = ((e) => (e.Space = " ", e.Enter = "Enter", e.Escape = "Escape", e.Backspace = "Backspace", e.Delete = "Delete", e.ArrowLeft = "ArrowLeft", e.ArrowUp = "ArrowUp", e.ArrowRight = "ArrowRight", e.ArrowDown = "ArrowDown", e.Home = "Home", e.End = "End", e.PageUp = "PageUp", e.PageDown = "PageDown", e.Tab = "Tab", e))(bt || {});
let i6 = ["[contentEditable=true]", "[tabindex]", "a[href]", "area[href]", "button:not([disabled])", "iframe", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])"].map((e) => `${e}:not([tabindex='-1'])`).join(","), s6 = ["[data-autofocus]"].map((e) => `${e}:not([tabindex='-1'])`).join(",");
var yt = ((e) => (e[e.First = 1] = "First", e[e.Previous = 2] = "Previous", e[e.Next = 4] = "Next", e[e.Last = 8] = "Last", e[e.WrapAround = 16] = "WrapAround", e[e.NoScroll = 32] = "NoScroll", e[e.AutoFocus = 64] = "AutoFocus", e))(yt || {}), zo = ((e) => (e[e.Error = 0] = "Error", e[e.Overflow = 1] = "Overflow", e[e.Success = 2] = "Success", e[e.Underflow = 3] = "Underflow", e))(zo || {}), l6 = ((e) => (e[e.Previous = -1] = "Previous", e[e.Next = 1] = "Next", e))(l6 || {});
function c6(e = document.body) {
  return e == null ? [] : Array.from(e.querySelectorAll(i6)).sort((t, r) => Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (r.tabIndex || Number.MAX_SAFE_INTEGER)));
}
function u6(e = document.body) {
  return e == null ? [] : Array.from(e.querySelectorAll(s6)).sort((t, r) => Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (r.tabIndex || Number.MAX_SAFE_INTEGER)));
}
var f6 = ((e) => (e[e.Strict = 0] = "Strict", e[e.Loose = 1] = "Loose", e))(f6 || {}), d6 = ((e) => (e[e.Keyboard = 0] = "Keyboard", e[e.Mouse = 1] = "Mouse", e))(d6 || {});
typeof window < "u" && typeof document < "u" && (document.addEventListener("keydown", (e) => {
  e.metaKey || e.altKey || e.ctrlKey || (document.documentElement.dataset.headlessuiFocusVisible = "");
}, !0), document.addEventListener("click", (e) => {
  e.detail === 1 ? delete document.documentElement.dataset.headlessuiFocusVisible : e.detail === 0 && (document.documentElement.dataset.headlessuiFocusVisible = "");
}, !0));
let p6 = ["textarea", "input"].join(",");
function m6(e) {
  var t, r;
  return (r = (t = e == null ? void 0 : e.matches) == null ? void 0 : t.call(e, p6)) != null ? r : !1;
}
function Nn(e, t = (r) => r) {
  return e.slice().sort((r, n) => {
    let o = t(r), a = t(n);
    if (o === null || a === null) return 0;
    let i = o.compareDocumentPosition(a);
    return i & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : i & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
  });
}
function wn(e, t, { sorted: r = !0, relativeTo: n = null, skipElements: o = [] } = {}) {
  let a = Array.isArray(e) ? e.length > 0 ? e[0].ownerDocument : document : e.ownerDocument, i = Array.isArray(e) ? r ? Nn(e) : e : t & 64 ? u6(e) : c6(e);
  o.length > 0 && i.length > 1 && (i = i.filter((b) => !o.some((y) => y != null && "current" in y ? (y == null ? void 0 : y.current) === b : y === b))), n = n ?? a.activeElement;
  let s = (() => {
    if (t & 5) return 1;
    if (t & 10) return -1;
    throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last");
  })(), c = (() => {
    if (t & 1) return 0;
    if (t & 2) return Math.max(0, i.indexOf(n)) - 1;
    if (t & 4) return Math.max(0, i.indexOf(n)) + 1;
    if (t & 8) return i.length - 1;
    throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last");
  })(), l = t & 32 ? { preventScroll: !0 } : {}, u = 0, f = i.length, d;
  do {
    if (u >= f || u + f <= 0) return 0;
    let b = c + u;
    if (t & 16) b = (b + f) % f;
    else {
      if (b < 0) return 3;
      if (b >= f) return 1;
    }
    d = i[b], d == null || d.focus(l), u += s;
  } while (d !== a.activeElement);
  return t & 6 && m6(d) && d.select(), 2;
}
function g6(e, t) {
  return ht(() => {
    var r;
    if (e.type) return e.type;
    let n = (r = e.as) != null ? r : "button";
    if (typeof n == "string" && n.toLowerCase() === "button" || (t == null ? void 0 : t.tagName) === "BUTTON" && !t.hasAttribute("type")) return "button";
  }, [e.type, e.as, t]);
}
function h6() {
  let e = le(!1);
  return Kn(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
}
function b6({ onFocus: e }) {
  let [t, r] = Me(!0), n = h6();
  return t ? Oe.createElement(H0, { as: "button", type: "button", features: q0.Focusable, onFocus: (o) => {
    o.preventDefault();
    let a, i = 50;
    function s() {
      if (i-- <= 0) {
        a && cancelAnimationFrame(a);
        return;
      }
      if (e()) {
        if (cancelAnimationFrame(a), !n.current) return;
        r(!1);
        return;
      }
      a = requestAnimationFrame(s);
    }
    a = requestAnimationFrame(s);
  } }) : null;
}
const B0 = T.createContext(null);
function y6() {
  return { groups: /* @__PURE__ */ new Map(), get(e, t) {
    var r;
    let n = this.groups.get(e);
    n || (n = /* @__PURE__ */ new Map(), this.groups.set(e, n));
    let o = (r = n.get(t)) != null ? r : 0;
    n.set(t, o + 1);
    let a = Array.from(n.keys()).indexOf(t);
    function i() {
      let s = n.get(t);
      s > 1 ? n.set(t, s - 1) : n.delete(t);
    }
    return [a, i];
  } };
}
function v6({ children: e }) {
  let t = T.useRef(y6());
  return T.createElement(B0.Provider, { value: t }, e);
}
function X0(e) {
  let t = T.useContext(B0);
  if (!t) throw new Error("You must wrap your component in a <StableCollection>");
  let r = T.useId(), [n, o] = t.current.get(e, r);
  return T.useEffect(() => o, []), n;
}
var x6 = ((e) => (e[e.Forwards = 0] = "Forwards", e[e.Backwards = 1] = "Backwards", e))(x6 || {}), w6 = ((e) => (e[e.Less = -1] = "Less", e[e.Equal = 0] = "Equal", e[e.Greater = 1] = "Greater", e))(w6 || {}), k6 = ((e) => (e[e.SetSelectedIndex = 0] = "SetSelectedIndex", e[e.RegisterTab = 1] = "RegisterTab", e[e.UnregisterTab = 2] = "UnregisterTab", e[e.RegisterPanel = 3] = "RegisterPanel", e[e.UnregisterPanel = 4] = "UnregisterPanel", e))(k6 || {});
let O6 = { 0(e, t) {
  var r;
  let n = Nn(e.tabs, (u) => u.current), o = Nn(e.panels, (u) => u.current), a = n.filter((u) => {
    var f;
    return !((f = u.current) != null && f.hasAttribute("disabled"));
  }), i = { ...e, tabs: n, panels: o };
  if (t.index < 0 || t.index > n.length - 1) {
    let u = en(Math.sign(t.index - e.selectedIndex), { [-1]: () => 1, 0: () => en(Math.sign(t.index), { [-1]: () => 0, 0: () => 0, 1: () => 1 }), 1: () => 0 });
    if (a.length === 0) return i;
    let f = en(u, { 0: () => n.indexOf(a[0]), 1: () => n.indexOf(a[a.length - 1]) });
    return { ...i, selectedIndex: f === -1 ? e.selectedIndex : f };
  }
  let s = n.slice(0, t.index), c = [...n.slice(t.index), ...s].find((u) => a.includes(u));
  if (!c) return i;
  let l = (r = n.indexOf(c)) != null ? r : e.selectedIndex;
  return l === -1 && (l = e.selectedIndex), { ...i, selectedIndex: l };
}, 1(e, t) {
  if (e.tabs.includes(t.tab)) return e;
  let r = e.tabs[e.selectedIndex], n = Nn([...e.tabs, t.tab], (a) => a.current), o = e.selectedIndex;
  return e.info.current.isControlled || (o = n.indexOf(r), o === -1 && (o = e.selectedIndex)), { ...e, tabs: n, selectedIndex: o };
}, 2(e, t) {
  return { ...e, tabs: e.tabs.filter((r) => r !== t.tab) };
}, 3(e, t) {
  return e.panels.includes(t.panel) ? e : { ...e, panels: Nn([...e.panels, t.panel], (r) => r.current) };
}, 4(e, t) {
  return { ...e, panels: e.panels.filter((r) => r !== t.panel) };
} }, Uf = Zn(null);
Uf.displayName = "TabsDataContext";
function Jn(e) {
  let t = Vr(Uf);
  if (t === null) {
    let r = new Error(`<${e} /> is missing a parent <Tab.Group /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(r, Jn), r;
  }
  return t;
}
let Yf = Zn(null);
Yf.displayName = "TabsActionsContext";
function Vf(e) {
  let t = Vr(Yf);
  if (t === null) {
    let r = new Error(`<${e} /> is missing a parent <Tab.Group /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(r, Vf), r;
  }
  return t;
}
function E6(e, t) {
  return en(t.type, O6, e, t);
}
let P6 = "div";
function S6(e, t) {
  let { defaultIndex: r = 0, vertical: n = !1, manual: o = !1, onChange: a, selectedIndex: i = null, ...s } = e;
  const c = n ? "vertical" : "horizontal", l = o ? "manual" : "auto";
  let u = i !== null, f = Mo({ isControlled: u }), d = Sa(t), [b, y] = Y1(E6, { info: f, selectedIndex: i ?? r, tabs: [], panels: [] }), p = ht(() => ({ selectedIndex: b.selectedIndex }), [b.selectedIndex]), m = Mo(a || (() => {
  })), x = Mo(b.tabs), w = ht(() => ({ orientation: c, activation: l, ...b }), [c, l, b]), O = zt((H) => (y({ type: 1, tab: H }), () => y({ type: 2, tab: H }))), E = zt((H) => (y({ type: 3, panel: H }), () => y({ type: 4, panel: H }))), h = zt((H) => {
    W.current !== H && m.current(H), u || y({ type: 0, index: H });
  }), W = Mo(u ? e.selectedIndex : b.selectedIndex), F = ht(() => ({ registerTab: O, registerPanel: E, change: h }), []);
  Kn(() => {
    y({ type: 0, index: i ?? r });
  }, [i]), Kn(() => {
    if (W.current === void 0 || b.tabs.length <= 0) return;
    let H = Nn(b.tabs, (Q) => Q.current);
    H.some((Q, P) => b.tabs[P] !== Q) && h(H.indexOf(b.tabs[W.current]));
  });
  let Z = { ref: d }, K = fo();
  return Oe.createElement(v6, null, Oe.createElement(Yf.Provider, { value: F }, Oe.createElement(Uf.Provider, { value: w }, w.tabs.length <= 0 && Oe.createElement(b6, { onFocus: () => {
    var H, Q;
    for (let P of x.current) if (((H = P.current) == null ? void 0 : H.tabIndex) === 0) return (Q = P.current) == null || Q.focus(), !0;
    return !1;
  } }), K({ ourProps: Z, theirProps: s, slot: p, defaultTag: P6, name: "Tabs" }))));
}
let A6 = "div";
function C6(e, t) {
  let { orientation: r, selectedIndex: n } = Jn("Tab.List"), o = Sa(t), a = ht(() => ({ selectedIndex: n }), [n]), i = e, s = { ref: o, role: "tablist", "aria-orientation": r };
  return fo()({ ourProps: s, theirProps: i, slot: a, defaultTag: A6, name: "Tabs.List" });
}
let $6 = "button";
function N6(e, t) {
  var r, n;
  let o = dh(), { id: a = `headlessui-tabs-tab-${o}`, disabled: i = !1, autoFocus: s = !1, ...c } = e, { orientation: l, activation: u, selectedIndex: f, tabs: d, panels: b } = Jn("Tab"), y = Vf("Tab"), p = Jn("Tab"), [m, x] = Me(null), w = le(null), O = Sa(w, t, x);
  Kn(() => y.registerTab(w), [y, w]);
  let E = X0("tabs"), h = d.indexOf(w);
  h === -1 && (h = E);
  let W = h === f, F = zt((g) => {
    var v;
    let C = g();
    if (C === zo.Success && u === "auto") {
      let A = (v = W0(w)) == null ? void 0 : v.activeElement, S = p.tabs.findIndex((I) => I.current === A);
      S !== -1 && y.change(S);
    }
    return C;
  }), Z = zt((g) => {
    let v = d.map((C) => C.current).filter(Boolean);
    if (g.key === bt.Space || g.key === bt.Enter) {
      g.preventDefault(), g.stopPropagation(), y.change(h);
      return;
    }
    switch (g.key) {
      case bt.Home:
      case bt.PageUp:
        return g.preventDefault(), g.stopPropagation(), F(() => wn(v, yt.First));
      case bt.End:
      case bt.PageDown:
        return g.preventDefault(), g.stopPropagation(), F(() => wn(v, yt.Last));
    }
    if (F(() => en(l, { vertical() {
      return g.key === bt.ArrowUp ? wn(v, yt.Previous | yt.WrapAround) : g.key === bt.ArrowDown ? wn(v, yt.Next | yt.WrapAround) : zo.Error;
    }, horizontal() {
      return g.key === bt.ArrowLeft ? wn(v, yt.Previous | yt.WrapAround) : g.key === bt.ArrowRight ? wn(v, yt.Next | yt.WrapAround) : zo.Error;
    } })) === zo.Success) return g.preventDefault();
  }), K = le(!1), H = zt(() => {
    var g;
    K.current || (K.current = !0, (g = w.current) == null || g.focus({ preventScroll: !0 }), y.change(h), U0(() => {
      K.current = !1;
    }));
  }), Q = zt((g) => {
    g.preventDefault();
  }), { isFocusVisible: P, focusProps: ae } = L0({ autoFocus: s }), { isHovered: D, hoverProps: M } = VN({ isDisabled: i }), { pressed: R, pressProps: X } = JN({ disabled: i }), B = ht(() => ({ selected: W, hover: D, active: R, focus: P, autofocus: s, disabled: i }), [W, D, P, R, s, i]), J = G0({ ref: O, onKeyDown: Z, onMouseDown: Q, onClick: H, id: a, role: "tab", type: g6(e, m), "aria-controls": (n = (r = b[h]) == null ? void 0 : r.current) == null ? void 0 : n.id, "aria-selected": W, tabIndex: W ? 0 : -1, disabled: i || void 0, autoFocus: s }, ae, M, X);
  return fo()({ ourProps: J, theirProps: c, slot: B, defaultTag: $6, name: "Tabs.Tab" });
}
let I6 = "div";
function T6(e, t) {
  let { selectedIndex: r } = Jn("Tab.Panels"), n = Sa(t), o = ht(() => ({ selectedIndex: r }), [r]), a = e, i = { ref: n };
  return fo()({ ourProps: i, theirProps: a, slot: o, defaultTag: I6, name: "Tabs.Panels" });
}
let j6 = "div", _6 = lu.RenderStrategy | lu.Static;
function M6(e, t) {
  var r, n, o, a;
  let i = dh(), { id: s = `headlessui-tabs-panel-${i}`, tabIndex: c = 0, ...l } = e, { selectedIndex: u, tabs: f, panels: d } = Jn("Tab.Panel"), b = Vf("Tab.Panel"), y = le(null), p = Sa(y, t);
  Kn(() => b.registerPanel(y), [b, y]);
  let m = X0("panels"), x = d.indexOf(y);
  x === -1 && (x = m);
  let w = x === u, { isFocusVisible: O, focusProps: E } = L0(), h = ht(() => ({ selected: w, focus: O }), [w, O]), W = G0({ ref: p, id: s, role: "tabpanel", "aria-labelledby": (n = (r = f[x]) == null ? void 0 : r.current) == null ? void 0 : n.id, tabIndex: w ? c : -1 }, E), F = fo();
  return !w && ((o = l.unmount) == null || o) && !((a = l.static) != null && a) ? Oe.createElement(H0, { "aria-hidden": "true", ...W }) : F({ ourProps: W, theirProps: l, slot: h, defaultTag: j6, features: _6, visible: w, name: "Tabs.Panel" });
}
let z6 = po(N6), K0 = po(S6), J0 = po(C6), R6 = po(T6), F6 = po(M6), L6 = Object.assign(z6, { Group: K0, List: J0, Panels: R6, Panel: F6 });
const D6 = ({
  tabs: e,
  activeTab: t,
  onTabChange: r,
  className: n,
  disabled: o,
  disabledMessage: a,
  tabClassName: i,
  indicatorClassName: s,
  selectedTabClassName: c
}) => {
  const l = e.findIndex((p) => p.id === t), u = le([]), [f, d] = Me({
    left: 0,
    width: 0
  }), b = (p) => {
    r(e[p].id);
  };
  Ne(() => {
    if (l >= 0 && u.current[l]) {
      const p = u.current[l];
      p && d({
        left: p.offsetLeft,
        width: p.offsetWidth
      });
    }
  }, [l, e]);
  const y = /* @__PURE__ */ L(
    "div",
    {
      className: Va(
        "w-full",
        n,
        o ? "cursor-not-allowed opacity-60" : ""
      ),
      children: /* @__PURE__ */ L(K0, { selectedIndex: l, onChange: b, children: /* @__PURE__ */ Ee(J0, { className: "glass glass-no-hover relative inline-flex min-w-fit overflow-x-auto rounded-lg p-0.5 py-1 !shadow-none", children: [
        /* @__PURE__ */ L(
          "div",
          {
            className: Va(
              "absolute top-1 z-10 h-[calc(100%-8px)] rounded-md bg-primary/30 transition-all duration-200 ease-in-out",
              s
            ),
            style: {
              left: f.left,
              width: f.width
            }
          }
        ),
        e.map((p, m) => /* @__PURE__ */ L(
          L6,
          {
            ref: (x) => {
              x && (u.current[m] = x);
            },
            disabled: o,
            className: ({ selected: x }) => Va(
              "relative z-20 mx-0.5 min-w-max rounded-md border-2 border-transparent px-4 py-0.5 text-center text-sm font-semibold transition-all duration-200 ease-in-out",
              "focus-visible:outline-none focus-visible:ring-0",
              x ? Va("text-base-fg", c) : "text-base-fg/70 hover:text-base-fg",
              o ? "cursor-not-allowed opacity-60" : "",
              i
            ),
            children: p.label
          },
          p.id
        ))
      ] }) })
    }
  );
  return /* @__PURE__ */ Ee(vt, { children: [
    o && /* @__PURE__ */ L(
      AN,
      {
        content: a ?? "Cannot change tab. Generation in progress.",
        position: "bottom",
        children: y
      }
    ),
    !o && y
  ] });
};
async function kn(e, t = {}, r) {
  return window.__TAURI_INTERNALS__.invoke(e, t, r);
}
const W6 = {
  slug: "free",
  name: "Free",
  isPaidPlan: !1,
  monthlyPrice: 0,
  yearlyPrice: 0,
  features: [
    { text: "Free daily generations", included: !0 },
    { text: "Limited access to ArtCraft tools", included: !0 }
  ],
  colorScheme: "dark"
}, cu = [
  W6,
  {
    slug: "artcraft_basic",
    name: "Basic",
    isPaidPlan: !0,
    monthlyPrice: 8,
    yearlyPrice: 96,
    originalMonthlyPrice: 10,
    originalYearlyPrice: 120,
    features: [
      { text: "~1,010 Flux images", included: !0 },
      { text: "~36,000 real-time images", included: !0 },
      { text: "~180 enhanced images", included: !0 },
      { text: "~6 training jobs", included: !0 },
      { text: "Commercial license", included: !0 }
    ],
    colorScheme: "green"
  },
  {
    slug: "artcraft_pro",
    name: "Pro",
    isPaidPlan: !0,
    monthlyPrice: 28,
    yearlyPrice: 336,
    originalMonthlyPrice: 35,
    originalYearlyPrice: 420,
    features: [
      { text: "~5,048 Flux images", included: !0 },
      { text: "~180,000 real-time images", included: !0 },
      { text: "~900 enhanced images", included: !0 },
      { text: "~30 training jobs", included: !0 },
      { text: "Commercial license", included: !0 }
    ],
    colorScheme: "purple"
  },
  {
    slug: "artcraft_max",
    name: "Max",
    isPaidPlan: !0,
    monthlyPrice: 48,
    yearlyPrice: 576,
    originalMonthlyPrice: 60,
    originalYearlyPrice: 720,
    features: [
      { text: "~15,142 Flux images", included: !0 },
      { text: "~540,000 real-time images", included: !0 },
      { text: "~2,700 enhanced images", included: !0 },
      { text: "~90 training jobs", included: !0 },
      { text: "Commercial license", included: !0 }
    ],
    colorScheme: "orange"
  }
];
new Map(
  cu.map((e) => [e.slug, e])
);
const Og = (e) => {
  let t;
  const r = /* @__PURE__ */ new Set(), n = (s, c) => {
    const l = typeof s == "function" ? s(t) : s;
    if (!Object.is(l, t)) {
      const u = t;
      t = c ?? (typeof l != "object" || l === null) ? l : Object.assign({}, t, l), r.forEach((f) => f(t, u));
    }
  }, o = () => t, a = { setState: n, getState: o, getInitialState: () => i, subscribe: (s) => (r.add(s), () => r.delete(s)) }, i = t = e(n, o, a);
  return a;
}, U6 = (e) => e ? Og(e) : Og, Y6 = (e) => e;
function V6(e, t = Y6) {
  const r = Oe.useSyncExternalStore(
    e.subscribe,
    () => t(e.getState()),
    () => t(e.getInitialState())
  );
  return Oe.useDebugValue(r), r;
}
const Eg = (e) => {
  const t = U6(e), r = (n) => V6(t, n);
  return Object.assign(r, t), r;
}, G6 = (e) => e ? Eg(e) : Eg;
async function q6(e, t = {}, r) {
  return window.__TAURI_INTERNALS__.invoke(e, t, r);
}
const H6 = async () => {
  try {
    return await q6("storyteller_get_subscription_command");
  } catch (e) {
    throw e;
  }
};
var Pg;
(function(e) {
  e.WINDOW_RESIZED = "tauri://resize", e.WINDOW_MOVED = "tauri://move", e.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", e.WINDOW_DESTROYED = "tauri://destroyed", e.WINDOW_FOCUS = "tauri://focus", e.WINDOW_BLUR = "tauri://blur", e.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", e.WINDOW_THEME_CHANGED = "tauri://theme-changed", e.WINDOW_CREATED = "tauri://window-created", e.WEBVIEW_CREATED = "tauri://webview-created", e.DRAG_ENTER = "tauri://drag-enter", e.DRAG_OVER = "tauri://drag-over", e.DRAG_DROP = "tauri://drag-drop", e.DRAG_LEAVE = "tauri://drag-leave";
})(Pg || (Pg = {}));
const B6 = G6((e, t) => ({
  subscriptionInfo: void 0,
  // Returns true if the user has a paid plan.
  // (We do not store "free" as a plan.)
  hasPaidPlan: () => {
    var r;
    return ((r = t().subscriptionInfo) == null ? void 0 : r.subscriptionToken) !== void 0;
  },
  // Returns true if the user can cancel their plan.
  // (The user can't cancel an already set to cancel/expire plan again)
  canCancelPlan: () => {
    const r = t().subscriptionInfo;
    return (r == null ? void 0 : r.subscriptionToken) !== void 0 && (r == null ? void 0 : r.subscriptionEndAt) === void 0;
  },
  // Call to fetch credits from the server
  fetchFromServer: async () => {
    let r;
    try {
      r = await H6();
    } catch (n) {
      console.error("Error fetching subscription", n);
      return;
    }
    if (console.log("Fetched subscription from server: ", r), r.payload) {
      let n;
      r.payload.active_subscription && (n = {
        subscriptionToken: r.payload.active_subscription.subscription_token,
        productSlug: r.payload.active_subscription.product_slug,
        namespace: r.payload.active_subscription.namespace,
        nextBillAt: r.payload.active_subscription.next_bill_at ? new Date(r.payload.active_subscription.next_bill_at) : void 0,
        subscriptionEndAt: r.payload.active_subscription.subscription_end_at ? new Date(r.payload.active_subscription.subscription_end_at) : void 0
      }), e((o) => ({
        subscriptionInfo: n
      }));
    }
  }
})), X6 = [
  { id: "yearly", label: "Yearly" },
  { id: "monthly", label: "Monthly" }
], Pl = {
  header: {
    title: "Purchase a subscription",
    subtitle: "Upgrade to gain access to Pro features and generate more, faster."
  },
  yearlyDiscount: 20
};
function I9({} = {}) {
  var x;
  const { isOpen: e, closeModal: t } = G3(), r = B6(), n = r.hasPaidPlan(), o = (x = r.subscriptionInfo) == null ? void 0 : x.productSlug, [a, i] = Me("yearly"), s = a === "yearly", c = async () => {
    await kn("storyteller_open_customer_portal_cancel_plan_command");
  }, l = async () => {
    await kn("storyteller_open_customer_portal_manage_plan_command");
  }, u = async () => {
    await kn(
      "storyteller_open_customer_portal_update_payment_method_command"
    );
  }, f = async (w) => {
    const O = cu.find((W) => W.slug === w), E = O == null ? void 0 : O.slug, h = s ? "yearly" : "monthly";
    if (E === "free")
      if (n) {
        await c();
        return;
      } else
        return;
    n ? await kn("storyteller_open_customer_portal_switch_plan_command", {
      request: {
        plan: E,
        cadence: h
      }
    }) : await kn("storyteller_open_subscription_purchase_command", {
      request: {
        plan: E,
        cadence: h
      }
    });
  }, d = {
    free: 0,
    artcraft_basic: 1,
    artcraft_pro: 2,
    artcraft_max: 3
  }, b = (w) => w === o, y = (w) => {
    if (b(w.slug))
      return "Current Plan";
    if (o && o !== "free") {
      const O = d[o];
      if (d[w.slug] < O)
        return w.slug === "free" ? "Cancel Plan" : "Switch Plan";
    }
    return "Upgrade Plan";
  }, p = (w, O) => {
    const E = "relative rounded-xl border p-8 h-full flex flex-col transition-all duration-300 ring-[6px] ring-transparent";
    switch (w) {
      case "dark":
        return qr(
          E,
          "bg-[#2C2C2C] border-gray-600",
          O && "ring-white/70"
        );
      case "green":
        return qr(
          E,
          "bg-gradient-to-b from-[#002D23] via-[#006B54] to-[#00D28B] border-[#00a873]",
          "hover:shadow-[0_0_30px_rgba(0,210,139,0.4)]",
          O && "ring-[#00D28B] shadow-[0_0_30px_rgba(0,210,139,0.4)]"
        );
      case "purple":
        return qr(
          E,
          "bg-gradient-to-b from-[#2D004D] via-[#6400A8] to-[#C03FFF] border-[#9D4CFF]",
          "hover:shadow-[0_0_30px_rgba(192,63,255,0.4)]",
          O && "ring-[#C03FFF] shadow-[0_0_30px_rgba(192,63,255,0.4)]"
        );
      case "orange":
        return qr(
          E,
          "bg-gradient-to-b from-[#332100] via-[#B35C00] to-[#FFB347] border-[#FF8C00]",
          "hover:shadow-[0_0_30px_rgba(255,179,71,0.4)]",
          O && "ring-[#FFB347] shadow-[0_0_30px_rgba(255,179,71,0.4)]"
        );
      default:
        return qr(
          E,
          "bg-[#2C2C2C] border-gray-600",
          "hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]",
          O && "ring-white/70"
        );
    }
  }, m = (w) => {
    if (w.monthlyPrice === 0)
      return {
        current: "$0",
        original: null
      };
    if (s) {
      const O = Math.round(w.yearlyPrice / 12), E = w.originalYearlyPrice ? Math.round(w.originalYearlyPrice / 12) : null;
      return {
        current: `$${O}`,
        original: E ? `$${E}` : null
      };
    } else
      return {
        current: `$${w.originalMonthlyPrice || w.monthlyPrice}`,
        original: null
      };
  };
  return /* @__PURE__ */ L(
    ao,
    {
      isOpen: e,
      onClose: t,
      className: "rounded-xl bg-ui-panel max-h-[90vh] max-w-screen-2xl overflow-y-auto flex flex-col border border-ui-panel-border",
      allowBackgroundInteraction: !1,
      showClose: !0,
      closeOnOutsideClick: !0,
      resizable: !1,
      backdropClassName: "",
      children: /* @__PURE__ */ Ee("div", { className: "p-16 py-24 flex-1 overflow-y-auto min-h-0 text-base-fg", children: [
        /* @__PURE__ */ Ee("div", { className: "text-center mb-10", children: [
          /* @__PURE__ */ L("h1", { className: "text-5xl font-bold text-base-fg mb-4", children: Pl.header.title }),
          /* @__PURE__ */ L("p", { className: "text-base-fg/60 text-lg mb-6", children: Pl.header.subtitle }),
          /* @__PURE__ */ Ee("div", { className: "flex items-center justify-center gap-4 mb-8 relative w-fit mx-auto", children: [
            /* @__PURE__ */ L(
              D6,
              {
                tabs: X6,
                activeTab: a,
                onTabChange: i,
                className: "w-fit border border-base-fg/20 rounded-lg",
                tabClassName: "w-24 text-md",
                indicatorClassName: "bg-primary/30 border border-primary",
                selectedTabClassName: "text-base-fg"
              }
            ),
            /* @__PURE__ */ Ee("span", { className: "bg-primary text-white px-3 py-0.5 rounded-full text-sm font-medium -top-3 -left-6 absolute pointer-events-none", children: [
              "-",
              Pl.yearlyDiscount,
              "%"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ L("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10", children: cu.map((w) => {
          const O = m(w);
          return /* @__PURE__ */ Ee(
            "div",
            {
              className: p(
                w.colorScheme,
                b(w.slug)
              ),
              children: [
                b(w.slug) && /* @__PURE__ */ L("div", { className: "absolute -top-4 right-5 bg-white text-black px-3 py-1 rounded-full text-md font-semibold shadow-xl", children: "Active" }),
                /* @__PURE__ */ Ee("div", { className: "text-center mb-8", children: [
                  /* @__PURE__ */ L("h3", { className: "text-4xl font-bold text-white mb-4", children: w.name }),
                  /* @__PURE__ */ Ee("div", { className: "flex items-baseline justify-center gap-2", children: [
                    O.original && /* @__PURE__ */ L("span", { className: "text-white/60 line-through text-2xl", children: O.original }),
                    /* @__PURE__ */ L("span", { className: "text-4xl font-bold text-white", children: O.current }),
                    /* @__PURE__ */ L("span", { className: "text-white/60 text-sm", children: "/month" })
                  ] }),
                  /* @__PURE__ */ L("p", { className: "text-white/60 text-xs mt-1", children: s ? "billed yearly" : "billed monthly" })
                ] }),
                /* @__PURE__ */ L("div", { className: "flex-1 space-y-3 mb-6", children: w.features.map((E, h) => /* @__PURE__ */ Ee("div", { className: "flex items-start gap-3", children: [
                  /* @__PURE__ */ L(
                    "div",
                    {
                      className: qr(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        E.included ? "bg-white text-black" : "bg-transparent border border-gray-400"
                      ),
                      children: E.included && /* @__PURE__ */ L(
                        "svg",
                        {
                          className: "w-3 h-3",
                          fill: "currentColor",
                          viewBox: "0 0 20 20",
                          children: /* @__PURE__ */ L(
                            "path",
                            {
                              fillRule: "evenodd",
                              d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
                              clipRule: "evenodd"
                            }
                          )
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ L(
                    "span",
                    {
                      className: qr(
                        "text-sm mt-0.5",
                        E.included ? "text-white" : "text-white/60"
                      ),
                      children: E.text
                    }
                  )
                ] }, h)) }),
                /* @__PURE__ */ L(
                  si,
                  {
                    onClick: () => f(w.slug),
                    disabled: b(w.slug),
                    className: "w-full h-12 rounded-xl bg-white text-black border hover:bg-white/90",
                    children: y(w)
                  }
                )
              ]
            },
            w.slug
          );
        }) }),
        n && o !== "free" && /* @__PURE__ */ Ee("div", { className: "flex justify-center mt-8", children: [
          /* @__PURE__ */ L(
            si,
            {
              onClick: u,
              className: "bg-transparent border border-white/25 text-white hover:bg-white/10 px-8 py-3 mx-3 rounded-xl",
              children: "Update your payment method"
            }
          ),
          /* @__PURE__ */ L(
            si,
            {
              onClick: l,
              className: "bg-transparent border border-white/25 text-white hover:bg-white/10 px-8 py-3 mx-3 rounded-xl",
              children: "Manage your subscription"
            }
          )
        ] })
      ] })
    }
  );
}
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const K6 = {
  prefix: "far",
  iconName: "coin-front",
  icon: [512, 512, [], "e3fc", "M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384a128 128 0 1 1 0 256 128 128 0 1 1 0-256zm0 304a176 176 0 1 0 0-352 176 176 0 1 0 0 352zm24-248c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 144c0 13.3 10.7 24 24 24s24-10.7 24-24l0-144z"]
};
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const J6 = {
  prefix: "fas",
  iconName: "coin-front",
  icon: [512, 512, [], "e3fc", "M0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM256 96a160 160 0 1 1 0 320 160 160 0 1 1 0-320zm0 352a192 192 0 1 0 0-384 192 192 0 1 0 0 384zm24-264c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 144c0 13.3 10.7 24 24 24s24-10.7 24-24l0-144z"]
};
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function Q6(e, t, r) {
  return (t = eI(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function Sg(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function G(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Sg(Object(r), !0).forEach(function(n) {
      Q6(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : Sg(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function Z6(e, t) {
  if (typeof e != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(e, t);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function eI(e) {
  var t = Z6(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Ag = () => {
};
let Gf = {}, Q0 = {}, Z0 = null, e1 = {
  mark: Ag,
  measure: Ag
};
try {
  typeof window < "u" && (Gf = window), typeof document < "u" && (Q0 = document), typeof MutationObserver < "u" && (Z0 = MutationObserver), typeof performance < "u" && (e1 = performance);
} catch {
}
const {
  userAgent: Cg = ""
} = Gf.navigator || {}, Wr = Gf, qe = Q0, $g = Z0, Ha = e1;
Wr.document;
const sr = !!qe.documentElement && !!qe.head && typeof qe.addEventListener == "function" && typeof qe.createElement == "function", t1 = ~Cg.indexOf("MSIE") || ~Cg.indexOf("Trident/");
var tI = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, rI = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, r1 = {
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
}, nI = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, n1 = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Ze = "classic", fs = "duotone", oI = "sharp", aI = "sharp-duotone", o1 = [Ze, fs, oI, aI], iI = {
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
}, sI = {
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
}, lI = /* @__PURE__ */ new Map([["classic", {
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
}]]), cI = {
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
}, uI = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Ng = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, fI = ["kit"], dI = {
  kit: {
    "fa-kit": "fak"
  }
}, pI = ["fak", "fakd"], mI = {
  kit: {
    fak: "fa-kit"
  }
}, Ig = {
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
}, gI = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], hI = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], bI = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, yI = {
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
}, vI = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, uu = {
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
}, xI = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], fu = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...gI, ...xI], wI = ["solid", "regular", "light", "thin", "duotone", "brands"], a1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], kI = a1.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), OI = [...Object.keys(vI), ...wI, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Ba.GROUP, Ba.SWAP_OPACITY, Ba.PRIMARY, Ba.SECONDARY].concat(a1.map((e) => "".concat(e, "x"))).concat(kI.map((e) => "w-".concat(e))), EI = {
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
const rr = "___FONT_AWESOME___", du = 16, i1 = "fa", s1 = "svg-inline--fa", fn = "data-fa-i2svg", pu = "data-fa-pseudo-element", PI = "data-fa-pseudo-element-pending", qf = "data-prefix", Hf = "data-icon", Tg = "fontawesome-i2svg", SI = "async", AI = ["HTML", "HEAD", "STYLE", "SCRIPT"], l1 = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Aa(e) {
  return new Proxy(e, {
    get(t, r) {
      return r in t ? t[r] : t[Ze];
    }
  });
}
const c1 = G({}, r1);
c1[Ze] = G(G(G(G({}, {
  "fa-duotone": "duotone"
}), r1[Ze]), Ng.kit), Ng["kit-duotone"]);
const CI = Aa(c1), mu = G({}, cI);
mu[Ze] = G(G(G(G({}, {
  duotone: "fad"
}), mu[Ze]), Ig.kit), Ig["kit-duotone"]);
const jg = Aa(mu), gu = G({}, uu);
gu[Ze] = G(G({}, gu[Ze]), mI.kit);
const Bf = Aa(gu), hu = G({}, yI);
hu[Ze] = G(G({}, hu[Ze]), dI.kit);
Aa(hu);
const $I = tI, u1 = "fa-layers-text", NI = rI, II = G({}, iI);
Aa(II);
const TI = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Sl = nI, jI = [...fI, ...OI], Ko = Wr.FontAwesomeConfig || {};
function _I(e) {
  var t = qe.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function MI(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
qe && typeof qe.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [r, n] = t;
  const o = MI(_I(r));
  o != null && (Ko[n] = o);
});
const f1 = {
  styleDefault: "solid",
  familyDefault: Ze,
  cssPrefix: i1,
  replacementClass: s1,
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
Ko.familyPrefix && (Ko.cssPrefix = Ko.familyPrefix);
const Qn = G(G({}, f1), Ko);
Qn.autoReplaceSvg || (Qn.observeMutations = !1);
const oe = {};
Object.keys(f1).forEach((e) => {
  Object.defineProperty(oe, e, {
    enumerable: !0,
    set: function(t) {
      Qn[e] = t, Jo.forEach((r) => r(oe));
    },
    get: function() {
      return Qn[e];
    }
  });
});
Object.defineProperty(oe, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    Qn.cssPrefix = e, Jo.forEach((t) => t(oe));
  },
  get: function() {
    return Qn.cssPrefix;
  }
});
Wr.FontAwesomeConfig = oe;
const Jo = [];
function zI(e) {
  return Jo.push(e), () => {
    Jo.splice(Jo.indexOf(e), 1);
  };
}
const Er = du, Rt = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function RI(e) {
  if (!e || !sr)
    return;
  const t = qe.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const r = qe.head.childNodes;
  let n = null;
  for (let o = r.length - 1; o > -1; o--) {
    const a = r[o], i = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (n = a);
  }
  return qe.head.insertBefore(t, n), e;
}
const FI = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function ga() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += FI[Math.random() * 62 | 0];
  return t;
}
function mo(e) {
  const t = [];
  for (let r = (e || []).length >>> 0; r--; )
    t[r] = e[r];
  return t;
}
function Xf(e) {
  return e.classList ? mo(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function d1(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function LI(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, '="').concat(d1(e[r]), '" '), "").trim();
}
function ds(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, ": ").concat(e[r].trim(), ";"), "");
}
function Kf(e) {
  return e.size !== Rt.size || e.x !== Rt.x || e.y !== Rt.y || e.rotate !== Rt.rotate || e.flipX || e.flipY;
}
function DI(e) {
  let {
    transform: t,
    containerWidth: r,
    iconWidth: n
  } = e;
  const o = {
    transform: "translate(".concat(r / 2, " 256)")
  }, a = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), c = {
    transform: "".concat(a, " ").concat(i, " ").concat(s)
  }, l = {
    transform: "translate(".concat(n / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: c,
    path: l
  };
}
function WI(e) {
  let {
    transform: t,
    width: r = du,
    height: n = du,
    startCentered: o = !1
  } = e, a = "";
  return o && t1 ? a += "translate(".concat(t.x / Er - r / 2, "em, ").concat(t.y / Er - n / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / Er, "em), calc(-50% + ").concat(t.y / Er, "em)) ") : a += "translate(".concat(t.x / Er, "em, ").concat(t.y / Er, "em) "), a += "scale(".concat(t.size / Er * (t.flipX ? -1 : 1), ", ").concat(t.size / Er * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var UI = `:root, :host {
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
function p1() {
  const e = i1, t = s1, r = oe.cssPrefix, n = oe.replacementClass;
  let o = UI;
  if (r !== e || n !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(r, "-")).replace(i, "--".concat(r, "-")).replace(s, ".".concat(n));
  }
  return o;
}
let _g = !1;
function Al() {
  oe.autoAddCss && !_g && (RI(p1()), _g = !0);
}
var YI = {
  mixout() {
    return {
      dom: {
        css: p1,
        insertCss: Al
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Al();
      },
      beforeI2svg() {
        Al();
      }
    };
  }
};
const nr = Wr || {};
nr[rr] || (nr[rr] = {});
nr[rr].styles || (nr[rr].styles = {});
nr[rr].hooks || (nr[rr].hooks = {});
nr[rr].shims || (nr[rr].shims = []);
var Ft = nr[rr];
const m1 = [], g1 = function() {
  qe.removeEventListener("DOMContentLoaded", g1), Ii = 1, m1.map((e) => e());
};
let Ii = !1;
sr && (Ii = (qe.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(qe.readyState), Ii || qe.addEventListener("DOMContentLoaded", g1));
function VI(e) {
  sr && (Ii ? setTimeout(e, 0) : m1.push(e));
}
function Ca(e) {
  const {
    tag: t,
    attributes: r = {},
    children: n = []
  } = e;
  return typeof e == "string" ? d1(e) : "<".concat(t, " ").concat(LI(r), ">").concat(n.map(Ca).join(""), "</").concat(t, ">");
}
function Mg(e, t, r) {
  if (e && e[t] && e[t][r])
    return {
      prefix: t,
      iconName: r,
      icon: e[t][r]
    };
}
var Cl = function(t, r, n, o) {
  var a = Object.keys(t), i = a.length, s = r, c, l, u;
  for (n === void 0 ? (c = 1, u = t[a[0]]) : (c = 0, u = n); c < i; c++)
    l = a[c], u = s(u, t[l], l, t);
  return u;
};
function GI(e) {
  const t = [];
  let r = 0;
  const n = e.length;
  for (; r < n; ) {
    const o = e.charCodeAt(r++);
    if (o >= 55296 && o <= 56319 && r < n) {
      const a = e.charCodeAt(r++);
      (a & 64512) == 56320 ? t.push(((o & 1023) << 10) + (a & 1023) + 65536) : (t.push(o), r--);
    } else
      t.push(o);
  }
  return t;
}
function bu(e) {
  const t = GI(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function qI(e, t) {
  const r = e.length;
  let n = e.charCodeAt(t), o;
  return n >= 55296 && n <= 56319 && r > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (n - 55296) * 1024 + o - 56320 + 65536 : n;
}
function zg(e) {
  return Object.keys(e).reduce((t, r) => {
    const n = e[r];
    return !!n.icon ? t[n.iconName] = n.icon : t[r] = n, t;
  }, {});
}
function yu(e, t) {
  let r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: n = !1
  } = r, o = zg(t);
  typeof Ft.hooks.addPack == "function" && !n ? Ft.hooks.addPack(e, zg(t)) : Ft.styles[e] = G(G({}, Ft.styles[e] || {}), o), e === "fas" && yu("fa", t);
}
const {
  styles: ha,
  shims: HI
} = Ft, h1 = Object.keys(Bf), BI = h1.reduce((e, t) => (e[t] = Object.keys(Bf[t]), e), {});
let Jf = null, b1 = {}, y1 = {}, v1 = {}, x1 = {}, w1 = {};
function XI(e) {
  return ~jI.indexOf(e);
}
function KI(e, t) {
  const r = t.split("-"), n = r[0], o = r.slice(1).join("-");
  return n === e && o !== "" && !XI(o) ? o : null;
}
const k1 = () => {
  const e = (n) => Cl(ha, (o, a, i) => (o[i] = Cl(a, n, {}), o), {});
  b1 = e((n, o, a) => (o[3] && (n[o[3]] = a), o[2] && o[2].filter((s) => typeof s == "number").forEach((s) => {
    n[s.toString(16)] = a;
  }), n)), y1 = e((n, o, a) => (n[a] = a, o[2] && o[2].filter((s) => typeof s == "string").forEach((s) => {
    n[s] = a;
  }), n)), w1 = e((n, o, a) => {
    const i = o[2];
    return n[a] = a, i.forEach((s) => {
      n[s] = a;
    }), n;
  });
  const t = "far" in ha || oe.autoFetchSvg, r = Cl(HI, (n, o) => {
    const a = o[0];
    let i = o[1];
    const s = o[2];
    return i === "far" && !t && (i = "fas"), typeof a == "string" && (n.names[a] = {
      prefix: i,
      iconName: s
    }), typeof a == "number" && (n.unicodes[a.toString(16)] = {
      prefix: i,
      iconName: s
    }), n;
  }, {
    names: {},
    unicodes: {}
  });
  v1 = r.names, x1 = r.unicodes, Jf = ps(oe.styleDefault, {
    family: oe.familyDefault
  });
};
zI((e) => {
  Jf = ps(e.styleDefault, {
    family: oe.familyDefault
  });
});
k1();
function Qf(e, t) {
  return (b1[e] || {})[t];
}
function JI(e, t) {
  return (y1[e] || {})[t];
}
function Zr(e, t) {
  return (w1[e] || {})[t];
}
function O1(e) {
  return v1[e] || {
    prefix: null,
    iconName: null
  };
}
function QI(e) {
  const t = x1[e], r = Qf("fas", e);
  return t || (r ? {
    prefix: "fas",
    iconName: r
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Ur() {
  return Jf;
}
const E1 = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function ZI(e) {
  let t = Ze;
  const r = h1.reduce((n, o) => (n[o] = "".concat(oe.cssPrefix, "-").concat(o), n), {});
  return o1.forEach((n) => {
    (e.includes(r[n]) || e.some((o) => BI[n].includes(o))) && (t = n);
  }), t;
}
function ps(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: r = Ze
  } = t, n = CI[r][e];
  if (r === fs && !e)
    return "fad";
  const o = jg[r][e] || jg[r][n], a = e in Ft.styles ? e : null;
  return o || a || null;
}
function eT(e) {
  let t = [], r = null;
  return e.forEach((n) => {
    const o = KI(oe.cssPrefix, n);
    o ? r = o : n && t.push(n);
  }), {
    iconName: r,
    rest: t
  };
}
function Rg(e) {
  return e.sort().filter((t, r, n) => n.indexOf(t) === r);
}
function ms(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: r = !1
  } = t;
  let n = null;
  const o = fu.concat(hI), a = Rg(e.filter((f) => o.includes(f))), i = Rg(e.filter((f) => !fu.includes(f))), s = a.filter((f) => (n = f, !n1.includes(f))), [c = null] = s, l = ZI(a), u = G(G({}, eT(i)), {}, {
    prefix: ps(c, {
      family: l
    })
  });
  return G(G(G({}, u), oT({
    values: e,
    family: l,
    styles: ha,
    config: oe,
    canonical: u,
    givenPrefix: n
  })), tT(r, n, u));
}
function tT(e, t, r) {
  let {
    prefix: n,
    iconName: o
  } = r;
  if (e || !n || !o)
    return {
      prefix: n,
      iconName: o
    };
  const a = t === "fa" ? O1(o) : {}, i = Zr(n, o);
  return o = a.iconName || i || o, n = a.prefix || n, n === "far" && !ha.far && ha.fas && !oe.autoFetchSvg && (n = "fas"), {
    prefix: n,
    iconName: o
  };
}
const rT = o1.filter((e) => e !== Ze || e !== fs), nT = Object.keys(uu).filter((e) => e !== Ze).map((e) => Object.keys(uu[e])).flat();
function oT(e) {
  const {
    values: t,
    family: r,
    canonical: n,
    givenPrefix: o = "",
    styles: a = {},
    config: i = {}
  } = e, s = r === fs, c = t.includes("fa-duotone") || t.includes("fad"), l = i.familyDefault === "duotone", u = n.prefix === "fad" || n.prefix === "fa-duotone";
  if (!s && (c || l || u) && (n.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (n.prefix = "fab"), !n.prefix && rT.includes(r) && (Object.keys(a).find((d) => nT.includes(d)) || i.autoFetchSvg)) {
    const d = lI.get(r).defaultShortPrefixId;
    n.prefix = d, n.iconName = Zr(n.prefix, n.iconName) || n.iconName;
  }
  return (n.prefix === "fa" || o === "fa") && (n.prefix = Ur() || "fas"), n;
}
class aT {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
      r[n] = arguments[n];
    const o = r.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = G(G({}, this.definitions[a] || {}), o[a]), yu(a, o[a]);
      const i = Bf[Ze][a];
      i && yu(i, o[a]), k1();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, r) {
    const n = r.prefix && r.iconName && r.icon ? {
      0: r
    } : r;
    return Object.keys(n).map((o) => {
      const {
        prefix: a,
        iconName: i,
        icon: s
      } = n[o], c = s[2];
      t[a] || (t[a] = {}), c.length > 0 && c.forEach((l) => {
        typeof l == "string" && (t[a][l] = s);
      }), t[a][i] = s;
    }), t;
  }
}
let Fg = [], In = {};
const Gn = {}, iT = Object.keys(Gn);
function sT(e, t) {
  let {
    mixoutsTo: r
  } = t;
  return Fg = e, In = {}, Object.keys(Gn).forEach((n) => {
    iT.indexOf(n) === -1 && delete Gn[n];
  }), Fg.forEach((n) => {
    const o = n.mixout ? n.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (r[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((i) => {
        r[a] || (r[a] = {}), r[a][i] = o[a][i];
      });
    }), n.hooks) {
      const a = n.hooks();
      Object.keys(a).forEach((i) => {
        In[i] || (In[i] = []), In[i].push(a[i]);
      });
    }
    n.provides && n.provides(Gn);
  }), r;
}
function vu(e, t) {
  for (var r = arguments.length, n = new Array(r > 2 ? r - 2 : 0), o = 2; o < r; o++)
    n[o - 2] = arguments[o];
  return (In[e] || []).forEach((i) => {
    t = i.apply(null, [t, ...n]);
  }), t;
}
function dn(e) {
  for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++)
    r[n - 1] = arguments[n];
  (In[e] || []).forEach((a) => {
    a.apply(null, r);
  });
}
function Yr() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Gn[e] ? Gn[e].apply(null, t) : void 0;
}
function xu(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const r = e.prefix || Ur();
  if (t)
    return t = Zr(r, t) || t, Mg(P1.definitions, r, t) || Mg(Ft.styles, r, t);
}
const P1 = new aT(), lT = () => {
  oe.autoReplaceSvg = !1, oe.observeMutations = !1, dn("noAuto");
}, cT = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return sr ? (dn("beforeI2svg", e), Yr("pseudoElements2svg", e), Yr("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    oe.autoReplaceSvg === !1 && (oe.autoReplaceSvg = !0), oe.observeMutations = !0, VI(() => {
      fT({
        autoReplaceSvgRoot: t
      }), dn("watch", e);
    });
  }
}, uT = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Zr(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], r = ps(e[0]);
      return {
        prefix: r,
        iconName: Zr(r, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(oe.cssPrefix, "-")) > -1 || e.match($I))) {
      const t = ms(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Ur(),
        iconName: Zr(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Ur();
      return {
        prefix: t,
        iconName: Zr(t, e) || e
      };
    }
  }
}, lt = {
  noAuto: lT,
  config: oe,
  dom: cT,
  parse: uT,
  library: P1,
  findIconDefinition: xu,
  toHtml: Ca
}, fT = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = qe
  } = e;
  (Object.keys(Ft.styles).length > 0 || oe.autoFetchSvg) && sr && oe.autoReplaceSvg && lt.dom.i2svg({
    node: t
  });
};
function gs(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((r) => Ca(r));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!sr) return;
      const r = qe.createElement("div");
      return r.innerHTML = e.html, r.children;
    }
  }), e;
}
function dT(e) {
  let {
    children: t,
    main: r,
    mask: n,
    attributes: o,
    styles: a,
    transform: i
  } = e;
  if (Kf(i) && r.found && !n.found) {
    const {
      width: s,
      height: c
    } = r, l = {
      x: s / c / 2,
      y: 0.5
    };
    o.style = ds(G(G({}, a), {}, {
      "transform-origin": "".concat(l.x + i.x / 16, "em ").concat(l.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function pT(e) {
  let {
    prefix: t,
    iconName: r,
    children: n,
    attributes: o,
    symbol: a
  } = e;
  const i = a === !0 ? "".concat(t, "-").concat(oe.cssPrefix, "-").concat(r) : a;
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
      children: n
    }]
  }];
}
function Zf(e) {
  const {
    icons: {
      main: t,
      mask: r
    },
    prefix: n,
    iconName: o,
    transform: a,
    symbol: i,
    title: s,
    maskId: c,
    titleId: l,
    extra: u,
    watchable: f = !1
  } = e, {
    width: d,
    height: b
  } = r.found ? r : t, y = pI.includes(n), p = [oe.replacementClass, o ? "".concat(oe.cssPrefix, "-").concat(o) : ""].filter((h) => u.classes.indexOf(h) === -1).filter((h) => h !== "" || !!h).concat(u.classes).join(" ");
  let m = {
    children: [],
    attributes: G(G({}, u.attributes), {}, {
      "data-prefix": n,
      "data-icon": o,
      class: p,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(d, " ").concat(b)
    })
  };
  const x = y && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(d / b * 16 * 0.0625, "em")
  } : {};
  f && (m.attributes[fn] = ""), s && (m.children.push({
    tag: "title",
    attributes: {
      id: m.attributes["aria-labelledby"] || "title-".concat(l || ga())
    },
    children: [s]
  }), delete m.attributes.title);
  const w = G(G({}, m), {}, {
    prefix: n,
    iconName: o,
    main: t,
    mask: r,
    maskId: c,
    transform: a,
    symbol: i,
    styles: G(G({}, x), u.styles)
  }), {
    children: O,
    attributes: E
  } = r.found && t.found ? Yr("generateAbstractMask", w) || {
    children: [],
    attributes: {}
  } : Yr("generateAbstractIcon", w) || {
    children: [],
    attributes: {}
  };
  return w.children = O, w.attributes = E, i ? pT(w) : dT(w);
}
function Lg(e) {
  const {
    content: t,
    width: r,
    height: n,
    transform: o,
    title: a,
    extra: i,
    watchable: s = !1
  } = e, c = G(G(G({}, i.attributes), a ? {
    title: a
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[fn] = "");
  const l = G({}, i.styles);
  Kf(o) && (l.transform = WI({
    transform: o,
    startCentered: !0,
    width: r,
    height: n
  }), l["-webkit-transform"] = l.transform);
  const u = ds(l);
  u.length > 0 && (c.style = u);
  const f = [];
  return f.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), a && f.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [a]
  }), f;
}
function mT(e) {
  const {
    content: t,
    title: r,
    extra: n
  } = e, o = G(G(G({}, n.attributes), r ? {
    title: r
  } : {}), {}, {
    class: n.classes.join(" ")
  }), a = ds(n.styles);
  a.length > 0 && (o.style = a);
  const i = [];
  return i.push({
    tag: "span",
    attributes: o,
    children: [t]
  }), r && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [r]
  }), i;
}
const {
  styles: $l
} = Ft;
function wu(e) {
  const t = e[0], r = e[1], [n] = e.slice(4);
  let o = null;
  return Array.isArray(n) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(oe.cssPrefix, "-").concat(Sl.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(oe.cssPrefix, "-").concat(Sl.SECONDARY),
        fill: "currentColor",
        d: n[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(oe.cssPrefix, "-").concat(Sl.PRIMARY),
        fill: "currentColor",
        d: n[1]
      }
    }]
  } : o = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: n
    }
  }, {
    found: !0,
    width: t,
    height: r,
    icon: o
  };
}
const gT = {
  found: !1,
  width: 512,
  height: 512
};
function hT(e, t) {
  !l1 && !oe.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function ku(e, t) {
  let r = t;
  return t === "fa" && oe.styleDefault !== null && (t = Ur()), new Promise((n, o) => {
    if (r === "fa") {
      const a = O1(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && $l[t] && $l[t][e]) {
      const a = $l[t][e];
      return n(wu(a));
    }
    hT(e, t), n(G(G({}, gT), {}, {
      icon: oe.showMissingIcons && e ? Yr("missingIconAbstract") || {} : {}
    }));
  });
}
const Dg = () => {
}, Ou = oe.measurePerformance && Ha && Ha.mark && Ha.measure ? Ha : {
  mark: Dg,
  measure: Dg
}, Ro = 'FA "6.7.2"', bT = (e) => (Ou.mark("".concat(Ro, " ").concat(e, " begins")), () => S1(e)), S1 = (e) => {
  Ou.mark("".concat(Ro, " ").concat(e, " ends")), Ou.measure("".concat(Ro, " ").concat(e), "".concat(Ro, " ").concat(e, " begins"), "".concat(Ro, " ").concat(e, " ends"));
};
var ed = {
  begin: bT,
  end: S1
};
const ui = () => {
};
function Wg(e) {
  return typeof (e.getAttribute ? e.getAttribute(fn) : null) == "string";
}
function yT(e) {
  const t = e.getAttribute ? e.getAttribute(qf) : null, r = e.getAttribute ? e.getAttribute(Hf) : null;
  return t && r;
}
function vT(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(oe.replacementClass);
}
function xT() {
  return oe.autoReplaceSvg === !0 ? fi.replace : fi[oe.autoReplaceSvg] || fi.replace;
}
function wT(e) {
  return qe.createElementNS("http://www.w3.org/2000/svg", e);
}
function kT(e) {
  return qe.createElement(e);
}
function A1(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: r = e.tag === "svg" ? wT : kT
  } = t;
  if (typeof e == "string")
    return qe.createTextNode(e);
  const n = r(e.tag);
  return Object.keys(e.attributes || []).forEach(function(a) {
    n.setAttribute(a, e.attributes[a]);
  }), (e.children || []).forEach(function(a) {
    n.appendChild(A1(a, {
      ceFn: r
    }));
  }), n;
}
function OT(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const fi = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((r) => {
        t.parentNode.insertBefore(A1(r), t);
      }), t.getAttribute(fn) === null && oe.keepOriginalSource) {
        let r = qe.createComment(OT(t));
        t.parentNode.replaceChild(r, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], r = e[1];
    if (~Xf(t).indexOf(oe.replacementClass))
      return fi.replace(e);
    const n = new RegExp("".concat(oe.cssPrefix, "-.*"));
    if (delete r[0].attributes.id, r[0].attributes.class) {
      const a = r[0].attributes.class.split(" ").reduce((i, s) => (s === oe.replacementClass || s.match(n) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      r[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = r.map((a) => Ca(a)).join(`
`);
    t.setAttribute(fn, ""), t.innerHTML = o;
  }
};
function Ug(e) {
  e();
}
function C1(e, t) {
  const r = typeof t == "function" ? t : ui;
  if (e.length === 0)
    r();
  else {
    let n = Ug;
    oe.mutateApproach === SI && (n = Wr.requestAnimationFrame || Ug), n(() => {
      const o = xT(), a = ed.begin("mutate");
      e.map(o), a(), r();
    });
  }
}
let td = !1;
function $1() {
  td = !0;
}
function Eu() {
  td = !1;
}
let Ti = null;
function Yg(e) {
  if (!$g || !oe.observeMutations)
    return;
  const {
    treeCallback: t = ui,
    nodeCallback: r = ui,
    pseudoElementsCallback: n = ui,
    observeMutationsRoot: o = qe
  } = e;
  Ti = new $g((a) => {
    if (td) return;
    const i = Ur();
    mo(a).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Wg(s.addedNodes[0]) && (oe.searchPseudoElements && n(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && oe.searchPseudoElements && n(s.target.parentNode), s.type === "attributes" && Wg(s.target) && ~TI.indexOf(s.attributeName))
        if (s.attributeName === "class" && yT(s.target)) {
          const {
            prefix: c,
            iconName: l
          } = ms(Xf(s.target));
          s.target.setAttribute(qf, c || i), l && s.target.setAttribute(Hf, l);
        } else vT(s.target) && r(s.target);
    });
  }), sr && Ti.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function ET() {
  Ti && Ti.disconnect();
}
function PT(e) {
  const t = e.getAttribute("style");
  let r = [];
  return t && (r = t.split(";").reduce((n, o) => {
    const a = o.split(":"), i = a[0], s = a.slice(1);
    return i && s.length > 0 && (n[i] = s.join(":").trim()), n;
  }, {})), r;
}
function ST(e) {
  const t = e.getAttribute("data-prefix"), r = e.getAttribute("data-icon"), n = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = ms(Xf(e));
  return o.prefix || (o.prefix = Ur()), t && r && (o.prefix = t, o.iconName = r), o.iconName && o.prefix || (o.prefix && n.length > 0 && (o.iconName = JI(o.prefix, e.innerText) || Qf(o.prefix, bu(e.innerText))), !o.iconName && oe.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function AT(e) {
  const t = mo(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), r = e.getAttribute("title"), n = e.getAttribute("data-fa-title-id");
  return oe.autoA11y && (r ? t["aria-labelledby"] = "".concat(oe.replacementClass, "-title-").concat(n || ga()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function CT() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: Rt,
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
function Vg(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: r,
    prefix: n,
    rest: o
  } = ST(e), a = AT(e), i = vu("parseNodeAttributes", {}, e);
  let s = t.styleParser ? PT(e) : [];
  return G({
    iconName: r,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: n,
    transform: Rt,
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
  styles: $T
} = Ft;
function N1(e) {
  const t = oe.autoReplaceSvg === "nest" ? Vg(e, {
    styleParser: !1
  }) : Vg(e);
  return ~t.extra.classes.indexOf(u1) ? Yr("generateLayersText", e, t) : Yr("generateSvgReplacementMutation", e, t);
}
function NT() {
  return [...uI, ...fu];
}
function Gg(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!sr) return Promise.resolve();
  const r = qe.documentElement.classList, n = (u) => r.add("".concat(Tg, "-").concat(u)), o = (u) => r.remove("".concat(Tg, "-").concat(u)), a = oe.autoFetchSvg ? NT() : n1.concat(Object.keys($T));
  a.includes("fa") || a.push("fa");
  const i = [".".concat(u1, ":not([").concat(fn, "])")].concat(a.map((u) => ".".concat(u, ":not([").concat(fn, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = mo(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    n("pending"), o("complete");
  else
    return Promise.resolve();
  const c = ed.begin("onTree"), l = s.reduce((u, f) => {
    try {
      const d = N1(f);
      d && u.push(d);
    } catch (d) {
      l1 || d.name === "MissingIcon" && console.error(d);
    }
    return u;
  }, []);
  return new Promise((u, f) => {
    Promise.all(l).then((d) => {
      C1(d, () => {
        n("active"), n("complete"), o("pending"), typeof t == "function" && t(), c(), u();
      });
    }).catch((d) => {
      c(), f(d);
    });
  });
}
function IT(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  N1(e).then((r) => {
    r && C1([r], t);
  });
}
function TT(e) {
  return function(t) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const n = (t || {}).icon ? t : xu(t || {});
    let {
      mask: o
    } = r;
    return o && (o = (o || {}).icon ? o : xu(o || {})), e(n, G(G({}, r), {}, {
      mask: o
    }));
  };
}
const jT = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: r = Rt,
    symbol: n = !1,
    mask: o = null,
    maskId: a = null,
    title: i = null,
    titleId: s = null,
    classes: c = [],
    attributes: l = {},
    styles: u = {}
  } = t;
  if (!e) return;
  const {
    prefix: f,
    iconName: d,
    icon: b
  } = e;
  return gs(G({
    type: "icon"
  }, e), () => (dn("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), oe.autoA11y && (i ? l["aria-labelledby"] = "".concat(oe.replacementClass, "-title-").concat(s || ga()) : (l["aria-hidden"] = "true", l.focusable = "false")), Zf({
    icons: {
      main: wu(b),
      mask: o ? wu(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: f,
    iconName: d,
    transform: G(G({}, Rt), r),
    symbol: n,
    title: i,
    maskId: a,
    titleId: s,
    extra: {
      attributes: l,
      styles: u,
      classes: c
    }
  })));
};
var _T = {
  mixout() {
    return {
      icon: TT(jT)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Gg, e.nodeCallback = IT, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: r = qe,
        callback: n = () => {
        }
      } = t;
      return Gg(r, n);
    }, e.generateSvgReplacementMutation = function(t, r) {
      const {
        iconName: n,
        title: o,
        titleId: a,
        prefix: i,
        transform: s,
        symbol: c,
        mask: l,
        maskId: u,
        extra: f
      } = r;
      return new Promise((d, b) => {
        Promise.all([ku(n, i), l.iconName ? ku(l.iconName, l.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((y) => {
          let [p, m] = y;
          d([t, Zf({
            icons: {
              main: p,
              mask: m
            },
            prefix: i,
            iconName: n,
            transform: s,
            symbol: c,
            maskId: u,
            title: o,
            titleId: a,
            extra: f,
            watchable: !0
          })]);
        }).catch(b);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: r,
        attributes: n,
        main: o,
        transform: a,
        styles: i
      } = t;
      const s = ds(i);
      s.length > 0 && (n.style = s);
      let c;
      return Kf(a) && (c = Yr("generateAbstractTransformGrouping", {
        main: o,
        transform: a,
        containerWidth: o.width,
        iconWidth: o.width
      })), r.push(c || o.icon), {
        children: r,
        attributes: n
      };
    };
  }
}, MT = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: r = []
        } = t;
        return gs({
          type: "layer"
        }, () => {
          dn("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let n = [];
          return e((o) => {
            Array.isArray(o) ? o.map((a) => {
              n = n.concat(a.abstract);
            }) : n = n.concat(o.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(oe.cssPrefix, "-layers"), ...r].join(" ")
            },
            children: n
          }];
        });
      }
    };
  }
}, zT = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: r = null,
          classes: n = [],
          attributes: o = {},
          styles: a = {}
        } = t;
        return gs({
          type: "counter",
          content: e
        }, () => (dn("beforeDOMElementCreation", {
          content: e,
          params: t
        }), mT({
          content: e.toString(),
          title: r,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(oe.cssPrefix, "-layers-counter"), ...n]
          }
        })));
      }
    };
  }
}, RT = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: r = Rt,
          title: n = null,
          classes: o = [],
          attributes: a = {},
          styles: i = {}
        } = t;
        return gs({
          type: "text",
          content: e
        }, () => (dn("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Lg({
          content: e,
          transform: G(G({}, Rt), r),
          title: n,
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
    e.generateLayersText = function(t, r) {
      const {
        title: n,
        transform: o,
        extra: a
      } = r;
      let i = null, s = null;
      if (t1) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), l = t.getBoundingClientRect();
        i = l.width / c, s = l.height / c;
      }
      return oe.autoA11y && !n && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, Lg({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: o,
        title: n,
        extra: a,
        watchable: !0
      })]);
    };
  }
};
const FT = new RegExp('"', "ug"), qg = [1105920, 1112319], Hg = G(G(G(G({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), sI), EI), bI), Pu = Object.keys(Hg).reduce((e, t) => (e[t.toLowerCase()] = Hg[t], e), {}), LT = Object.keys(Pu).reduce((e, t) => {
  const r = Pu[t];
  return e[t] = r[900] || [...Object.entries(r)][0][1], e;
}, {});
function DT(e) {
  const t = e.replace(FT, ""), r = qI(t, 0), n = r >= qg[0] && r <= qg[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: bu(o ? t[0] : t),
    isSecondary: n || o
  };
}
function WT(e, t) {
  const r = e.replace(/^['"]|['"]$/g, "").toLowerCase(), n = parseInt(t), o = isNaN(n) ? "normal" : n;
  return (Pu[r] || {})[o] || LT[r];
}
function Bg(e, t) {
  const r = "".concat(PI).concat(t.replace(":", "-"));
  return new Promise((n, o) => {
    if (e.getAttribute(r) !== null)
      return n();
    const i = mo(e.children).filter((d) => d.getAttribute(pu) === t)[0], s = Wr.getComputedStyle(e, t), c = s.getPropertyValue("font-family"), l = c.match(NI), u = s.getPropertyValue("font-weight"), f = s.getPropertyValue("content");
    if (i && !l)
      return e.removeChild(i), n();
    if (l && f !== "none" && f !== "") {
      const d = s.getPropertyValue("content");
      let b = WT(c, u);
      const {
        value: y,
        isSecondary: p
      } = DT(d), m = l[0].startsWith("FontAwesome");
      let x = Qf(b, y), w = x;
      if (m) {
        const O = QI(y);
        O.iconName && O.prefix && (x = O.iconName, b = O.prefix);
      }
      if (x && !p && (!i || i.getAttribute(qf) !== b || i.getAttribute(Hf) !== w)) {
        e.setAttribute(r, w), i && e.removeChild(i);
        const O = CT(), {
          extra: E
        } = O;
        E.attributes[pu] = t, ku(x, b).then((h) => {
          const W = Zf(G(G({}, O), {}, {
            icons: {
              main: h,
              mask: E1()
            },
            prefix: b,
            iconName: w,
            extra: E,
            watchable: !0
          })), F = qe.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(F, e.firstChild) : e.appendChild(F), F.outerHTML = W.map((Z) => Ca(Z)).join(`
`), e.removeAttribute(r), n();
        }).catch(o);
      } else
        n();
    } else
      n();
  });
}
function UT(e) {
  return Promise.all([Bg(e, "::before"), Bg(e, "::after")]);
}
function YT(e) {
  return e.parentNode !== document.head && !~AI.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(pu) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Xg(e) {
  if (sr)
    return new Promise((t, r) => {
      const n = mo(e.querySelectorAll("*")).filter(YT).map(UT), o = ed.begin("searchPseudoElements");
      $1(), Promise.all(n).then(() => {
        o(), Eu(), t();
      }).catch(() => {
        o(), Eu(), r();
      });
    });
}
var VT = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Xg, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: r = qe
      } = t;
      oe.searchPseudoElements && Xg(r);
    };
  }
};
let Kg = !1;
var GT = {
  mixout() {
    return {
      dom: {
        unwatch() {
          $1(), Kg = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Yg(vu("mutationObserverCallbacks", {}));
      },
      noAuto() {
        ET();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Kg ? Eu() : Yg(vu("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Jg = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((r, n) => {
    const o = n.toLowerCase().split("-"), a = o[0];
    let i = o.slice(1).join("-");
    if (a && i === "h")
      return r.flipX = !0, r;
    if (a && i === "v")
      return r.flipY = !0, r;
    if (i = parseFloat(i), isNaN(i))
      return r;
    switch (a) {
      case "grow":
        r.size = r.size + i;
        break;
      case "shrink":
        r.size = r.size - i;
        break;
      case "left":
        r.x = r.x - i;
        break;
      case "right":
        r.x = r.x + i;
        break;
      case "up":
        r.y = r.y - i;
        break;
      case "down":
        r.y = r.y + i;
        break;
      case "rotate":
        r.rotate = r.rotate + i;
        break;
    }
    return r;
  }, t);
};
var qT = {
  mixout() {
    return {
      parse: {
        transform: (e) => Jg(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-transform");
        return r && (e.transform = Jg(r)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: r,
        transform: n,
        containerWidth: o,
        iconWidth: a
      } = t;
      const i = {
        transform: "translate(".concat(o / 2, " 256)")
      }, s = "translate(".concat(n.x * 32, ", ").concat(n.y * 32, ") "), c = "scale(".concat(n.size / 16 * (n.flipX ? -1 : 1), ", ").concat(n.size / 16 * (n.flipY ? -1 : 1), ") "), l = "rotate(".concat(n.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(c, " ").concat(l)
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
            tag: r.icon.tag,
            children: r.icon.children,
            attributes: G(G({}, r.icon.attributes), d.path)
          }]
        }]
      };
    };
  }
};
const Nl = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Qg(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function HT(e) {
  return e.tag === "g" ? e.children : [e];
}
var BT = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-mask"), n = r ? ms(r.split(" ").map((o) => o.trim())) : E1();
        return n.prefix || (n.prefix = Ur()), e.mask = n, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: r,
        attributes: n,
        main: o,
        mask: a,
        maskId: i,
        transform: s
      } = t;
      const {
        width: c,
        icon: l
      } = o, {
        width: u,
        icon: f
      } = a, d = DI({
        transform: s,
        containerWidth: u,
        iconWidth: c
      }), b = {
        tag: "rect",
        attributes: G(G({}, Nl), {}, {
          fill: "white"
        })
      }, y = l.children ? {
        children: l.children.map(Qg)
      } : {}, p = {
        tag: "g",
        attributes: G({}, d.inner),
        children: [Qg(G({
          tag: l.tag,
          attributes: G(G({}, l.attributes), d.path)
        }, y))]
      }, m = {
        tag: "g",
        attributes: G({}, d.outer),
        children: [p]
      }, x = "mask-".concat(i || ga()), w = "clip-".concat(i || ga()), O = {
        tag: "mask",
        attributes: G(G({}, Nl), {}, {
          id: x,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [b, m]
      }, E = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: w
          },
          children: HT(f)
        }, O]
      };
      return r.push(E, {
        tag: "rect",
        attributes: G({
          fill: "currentColor",
          "clip-path": "url(#".concat(w, ")"),
          mask: "url(#".concat(x, ")")
        }, Nl)
      }), {
        children: r,
        attributes: n
      };
    };
  }
}, XT = {
  provides(e) {
    let t = !1;
    Wr.matchMedia && (t = Wr.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const r = [], n = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      r.push({
        tag: "path",
        attributes: G(G({}, n), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = G(G({}, o), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: G(G({}, n), {}, {
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
      }), r.push(i), r.push({
        tag: "path",
        attributes: G(G({}, n), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: G(G({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || r.push({
        tag: "path",
        attributes: G(G({}, n), {}, {
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
        children: r
      };
    };
  }
}, KT = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-symbol"), n = r === null ? !1 : r === "" ? !0 : r;
        return e.symbol = n, e;
      }
    };
  }
}, JT = [YI, _T, MT, zT, RT, VT, GT, qT, BT, XT, KT];
sT(JT, {
  mixoutsTo: lt
});
lt.noAuto;
lt.config;
lt.library;
lt.dom;
const Su = lt.parse;
lt.findIconDefinition;
lt.toHtml;
const QT = lt.icon;
lt.layer;
lt.text;
lt.counter;
function ZT(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Xa = { exports: {} }, Ka = { exports: {} }, Ce = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Zg;
function e9() {
  if (Zg) return Ce;
  Zg = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, y = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, x = e ? Symbol.for("react.responder") : 60118, w = e ? Symbol.for("react.scope") : 60119;
  function O(h) {
    if (typeof h == "object" && h !== null) {
      var W = h.$$typeof;
      switch (W) {
        case t:
          switch (h = h.type, h) {
            case c:
            case l:
            case n:
            case a:
            case o:
            case f:
              return h;
            default:
              switch (h = h && h.$$typeof, h) {
                case s:
                case u:
                case y:
                case b:
                case i:
                  return h;
                default:
                  return W;
              }
          }
        case r:
          return W;
      }
    }
  }
  function E(h) {
    return O(h) === l;
  }
  return Ce.AsyncMode = c, Ce.ConcurrentMode = l, Ce.ContextConsumer = s, Ce.ContextProvider = i, Ce.Element = t, Ce.ForwardRef = u, Ce.Fragment = n, Ce.Lazy = y, Ce.Memo = b, Ce.Portal = r, Ce.Profiler = a, Ce.StrictMode = o, Ce.Suspense = f, Ce.isAsyncMode = function(h) {
    return E(h) || O(h) === c;
  }, Ce.isConcurrentMode = E, Ce.isContextConsumer = function(h) {
    return O(h) === s;
  }, Ce.isContextProvider = function(h) {
    return O(h) === i;
  }, Ce.isElement = function(h) {
    return typeof h == "object" && h !== null && h.$$typeof === t;
  }, Ce.isForwardRef = function(h) {
    return O(h) === u;
  }, Ce.isFragment = function(h) {
    return O(h) === n;
  }, Ce.isLazy = function(h) {
    return O(h) === y;
  }, Ce.isMemo = function(h) {
    return O(h) === b;
  }, Ce.isPortal = function(h) {
    return O(h) === r;
  }, Ce.isProfiler = function(h) {
    return O(h) === a;
  }, Ce.isStrictMode = function(h) {
    return O(h) === o;
  }, Ce.isSuspense = function(h) {
    return O(h) === f;
  }, Ce.isValidElementType = function(h) {
    return typeof h == "string" || typeof h == "function" || h === n || h === l || h === a || h === o || h === f || h === d || typeof h == "object" && h !== null && (h.$$typeof === y || h.$$typeof === b || h.$$typeof === i || h.$$typeof === s || h.$$typeof === u || h.$$typeof === m || h.$$typeof === x || h.$$typeof === w || h.$$typeof === p);
  }, Ce.typeOf = O, Ce;
}
var $e = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var eh;
function t9() {
  return eh || (eh = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, y = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, x = e ? Symbol.for("react.responder") : 60118, w = e ? Symbol.for("react.scope") : 60119;
    function O(k) {
      return typeof k == "string" || typeof k == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      k === n || k === l || k === a || k === o || k === f || k === d || typeof k == "object" && k !== null && (k.$$typeof === y || k.$$typeof === b || k.$$typeof === i || k.$$typeof === s || k.$$typeof === u || k.$$typeof === m || k.$$typeof === x || k.$$typeof === w || k.$$typeof === p);
    }
    function E(k) {
      if (typeof k == "object" && k !== null) {
        var ue = k.$$typeof;
        switch (ue) {
          case t:
            var _e = k.type;
            switch (_e) {
              case c:
              case l:
              case n:
              case a:
              case o:
              case f:
                return _e;
              default:
                var et = _e && _e.$$typeof;
                switch (et) {
                  case s:
                  case u:
                  case y:
                  case b:
                  case i:
                    return et;
                  default:
                    return ue;
                }
            }
          case r:
            return ue;
        }
      }
    }
    var h = c, W = l, F = s, Z = i, K = t, H = u, Q = n, P = y, ae = b, D = r, M = a, R = o, X = f, B = !1;
    function J(k) {
      return B || (B = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), g(k) || E(k) === c;
    }
    function g(k) {
      return E(k) === l;
    }
    function v(k) {
      return E(k) === s;
    }
    function C(k) {
      return E(k) === i;
    }
    function A(k) {
      return typeof k == "object" && k !== null && k.$$typeof === t;
    }
    function S(k) {
      return E(k) === u;
    }
    function I(k) {
      return E(k) === n;
    }
    function N(k) {
      return E(k) === y;
    }
    function $(k) {
      return E(k) === b;
    }
    function _(k) {
      return E(k) === r;
    }
    function j(k) {
      return E(k) === a;
    }
    function z(k) {
      return E(k) === o;
    }
    function ee(k) {
      return E(k) === f;
    }
    $e.AsyncMode = h, $e.ConcurrentMode = W, $e.ContextConsumer = F, $e.ContextProvider = Z, $e.Element = K, $e.ForwardRef = H, $e.Fragment = Q, $e.Lazy = P, $e.Memo = ae, $e.Portal = D, $e.Profiler = M, $e.StrictMode = R, $e.Suspense = X, $e.isAsyncMode = J, $e.isConcurrentMode = g, $e.isContextConsumer = v, $e.isContextProvider = C, $e.isElement = A, $e.isForwardRef = S, $e.isFragment = I, $e.isLazy = N, $e.isMemo = $, $e.isPortal = _, $e.isProfiler = j, $e.isStrictMode = z, $e.isSuspense = ee, $e.isValidElementType = O, $e.typeOf = E;
  }()), $e;
}
var th;
function I1() {
  return th || (th = 1, process.env.NODE_ENV === "production" ? Ka.exports = e9() : Ka.exports = t9()), Ka.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Il, rh;
function r9() {
  if (rh) return Il;
  rh = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, r = Object.prototype.propertyIsEnumerable;
  function n(a) {
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
      var c = Object.getOwnPropertyNames(i).map(function(u) {
        return i[u];
      });
      if (c.join("") !== "0123456789")
        return !1;
      var l = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(u) {
        l[u] = u;
      }), Object.keys(Object.assign({}, l)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Il = o() ? Object.assign : function(a, i) {
    for (var s, c = n(a), l, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var f in s)
        t.call(s, f) && (c[f] = s[f]);
      if (e) {
        l = e(s);
        for (var d = 0; d < l.length; d++)
          r.call(s, l[d]) && (c[l[d]] = s[l[d]]);
      }
    }
    return c;
  }, Il;
}
var Tl, nh;
function rd() {
  if (nh) return Tl;
  nh = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return Tl = e, Tl;
}
var jl, oh;
function T1() {
  return oh || (oh = 1, jl = Function.call.bind(Object.prototype.hasOwnProperty)), jl;
}
var _l, ah;
function n9() {
  if (ah) return _l;
  ah = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ rd(), r = {}, n = /* @__PURE__ */ T1();
    e = function(a) {
      var i = "Warning: " + a;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function o(a, i, s, c, l) {
    if (process.env.NODE_ENV !== "production") {
      for (var u in a)
        if (n(a, u)) {
          var f;
          try {
            if (typeof a[u] != "function") {
              var d = Error(
                (c || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw d.name = "Invariant Violation", d;
            }
            f = a[u](i, u, c, s, null, t);
          } catch (y) {
            f = y;
          }
          if (f && !(f instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof f + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), f instanceof Error && !(f.message in r)) {
            r[f.message] = !0;
            var b = l ? l() : "";
            e(
              "Failed " + s + " type: " + f.message + (b ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (r = {});
  }, _l = o, _l;
}
var Ml, ih;
function o9() {
  if (ih) return Ml;
  ih = 1;
  var e = I1(), t = r9(), r = /* @__PURE__ */ rd(), n = /* @__PURE__ */ T1(), o = /* @__PURE__ */ n9(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(s) {
    var c = "Warning: " + s;
    typeof console < "u" && console.error(c);
    try {
      throw new Error(c);
    } catch {
    }
  });
  function i() {
    return null;
  }
  return Ml = function(s, c) {
    var l = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function f(g) {
      var v = g && (l && g[l] || g[u]);
      if (typeof v == "function")
        return v;
    }
    var d = "<<anonymous>>", b = {
      array: x("array"),
      bigint: x("bigint"),
      bool: x("boolean"),
      func: x("function"),
      number: x("number"),
      object: x("object"),
      string: x("string"),
      symbol: x("symbol"),
      any: w(),
      arrayOf: O,
      element: E(),
      elementType: h(),
      instanceOf: W,
      node: H(),
      objectOf: Z,
      oneOf: F,
      oneOfType: K,
      shape: P,
      exact: ae
    };
    function y(g, v) {
      return g === v ? g !== 0 || 1 / g === 1 / v : g !== g && v !== v;
    }
    function p(g, v) {
      this.message = g, this.data = v && typeof v == "object" ? v : {}, this.stack = "";
    }
    p.prototype = Error.prototype;
    function m(g) {
      if (process.env.NODE_ENV !== "production")
        var v = {}, C = 0;
      function A(I, N, $, _, j, z, ee) {
        if (_ = _ || d, z = z || $, ee !== r) {
          if (c) {
            var k = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw k.name = "Invariant Violation", k;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ue = _ + ":" + $;
            !v[ue] && // Avoid spamming the console because they are often not actionable except for lib authors
            C < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + z + "` prop on `" + _ + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), v[ue] = !0, C++);
          }
        }
        return N[$] == null ? I ? N[$] === null ? new p("The " + j + " `" + z + "` is marked as required " + ("in `" + _ + "`, but its value is `null`.")) : new p("The " + j + " `" + z + "` is marked as required in " + ("`" + _ + "`, but its value is `undefined`.")) : null : g(N, $, _, j, z);
      }
      var S = A.bind(null, !1);
      return S.isRequired = A.bind(null, !0), S;
    }
    function x(g) {
      function v(C, A, S, I, N, $) {
        var _ = C[A], j = R(_);
        if (j !== g) {
          var z = X(_);
          return new p(
            "Invalid " + I + " `" + N + "` of type " + ("`" + z + "` supplied to `" + S + "`, expected ") + ("`" + g + "`."),
            { expectedType: g }
          );
        }
        return null;
      }
      return m(v);
    }
    function w() {
      return m(i);
    }
    function O(g) {
      function v(C, A, S, I, N) {
        if (typeof g != "function")
          return new p("Property `" + N + "` of component `" + S + "` has invalid PropType notation inside arrayOf.");
        var $ = C[A];
        if (!Array.isArray($)) {
          var _ = R($);
          return new p("Invalid " + I + " `" + N + "` of type " + ("`" + _ + "` supplied to `" + S + "`, expected an array."));
        }
        for (var j = 0; j < $.length; j++) {
          var z = g($, j, S, I, N + "[" + j + "]", r);
          if (z instanceof Error)
            return z;
        }
        return null;
      }
      return m(v);
    }
    function E() {
      function g(v, C, A, S, I) {
        var N = v[C];
        if (!s(N)) {
          var $ = R(N);
          return new p("Invalid " + S + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return m(g);
    }
    function h() {
      function g(v, C, A, S, I) {
        var N = v[C];
        if (!e.isValidElementType(N)) {
          var $ = R(N);
          return new p("Invalid " + S + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return m(g);
    }
    function W(g) {
      function v(C, A, S, I, N) {
        if (!(C[A] instanceof g)) {
          var $ = g.name || d, _ = J(C[A]);
          return new p("Invalid " + I + " `" + N + "` of type " + ("`" + _ + "` supplied to `" + S + "`, expected ") + ("instance of `" + $ + "`."));
        }
        return null;
      }
      return m(v);
    }
    function F(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), i;
      function v(C, A, S, I, N) {
        for (var $ = C[A], _ = 0; _ < g.length; _++)
          if (y($, g[_]))
            return null;
        var j = JSON.stringify(g, function(ee, k) {
          var ue = X(k);
          return ue === "symbol" ? String(k) : k;
        });
        return new p("Invalid " + I + " `" + N + "` of value `" + String($) + "` " + ("supplied to `" + S + "`, expected one of " + j + "."));
      }
      return m(v);
    }
    function Z(g) {
      function v(C, A, S, I, N) {
        if (typeof g != "function")
          return new p("Property `" + N + "` of component `" + S + "` has invalid PropType notation inside objectOf.");
        var $ = C[A], _ = R($);
        if (_ !== "object")
          return new p("Invalid " + I + " `" + N + "` of type " + ("`" + _ + "` supplied to `" + S + "`, expected an object."));
        for (var j in $)
          if (n($, j)) {
            var z = g($, j, S, I, N + "." + j, r);
            if (z instanceof Error)
              return z;
          }
        return null;
      }
      return m(v);
    }
    function K(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var v = 0; v < g.length; v++) {
        var C = g[v];
        if (typeof C != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + B(C) + " at index " + v + "."
          ), i;
      }
      function A(S, I, N, $, _) {
        for (var j = [], z = 0; z < g.length; z++) {
          var ee = g[z], k = ee(S, I, N, $, _, r);
          if (k == null)
            return null;
          k.data && n(k.data, "expectedType") && j.push(k.data.expectedType);
        }
        var ue = j.length > 0 ? ", expected one of type [" + j.join(", ") + "]" : "";
        return new p("Invalid " + $ + " `" + _ + "` supplied to " + ("`" + N + "`" + ue + "."));
      }
      return m(A);
    }
    function H() {
      function g(v, C, A, S, I) {
        return D(v[C]) ? null : new p("Invalid " + S + " `" + I + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return m(g);
    }
    function Q(g, v, C, A, S) {
      return new p(
        (g || "React class") + ": " + v + " type `" + C + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + S + "`."
      );
    }
    function P(g) {
      function v(C, A, S, I, N) {
        var $ = C[A], _ = R($);
        if (_ !== "object")
          return new p("Invalid " + I + " `" + N + "` of type `" + _ + "` " + ("supplied to `" + S + "`, expected `object`."));
        for (var j in g) {
          var z = g[j];
          if (typeof z != "function")
            return Q(S, I, N, j, X(z));
          var ee = z($, j, S, I, N + "." + j, r);
          if (ee)
            return ee;
        }
        return null;
      }
      return m(v);
    }
    function ae(g) {
      function v(C, A, S, I, N) {
        var $ = C[A], _ = R($);
        if (_ !== "object")
          return new p("Invalid " + I + " `" + N + "` of type `" + _ + "` " + ("supplied to `" + S + "`, expected `object`."));
        var j = t({}, C[A], g);
        for (var z in j) {
          var ee = g[z];
          if (n(g, z) && typeof ee != "function")
            return Q(S, I, N, z, X(ee));
          if (!ee)
            return new p(
              "Invalid " + I + " `" + N + "` key `" + z + "` supplied to `" + S + "`.\nBad object: " + JSON.stringify(C[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(g), null, "  ")
            );
          var k = ee($, z, S, I, N + "." + z, r);
          if (k)
            return k;
        }
        return null;
      }
      return m(v);
    }
    function D(g) {
      switch (typeof g) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !g;
        case "object":
          if (Array.isArray(g))
            return g.every(D);
          if (g === null || s(g))
            return !0;
          var v = f(g);
          if (v) {
            var C = v.call(g), A;
            if (v !== g.entries) {
              for (; !(A = C.next()).done; )
                if (!D(A.value))
                  return !1;
            } else
              for (; !(A = C.next()).done; ) {
                var S = A.value;
                if (S && !D(S[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function M(g, v) {
      return g === "symbol" ? !0 : v ? v["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && v instanceof Symbol : !1;
    }
    function R(g) {
      var v = typeof g;
      return Array.isArray(g) ? "array" : g instanceof RegExp ? "object" : M(v, g) ? "symbol" : v;
    }
    function X(g) {
      if (typeof g > "u" || g === null)
        return "" + g;
      var v = R(g);
      if (v === "object") {
        if (g instanceof Date)
          return "date";
        if (g instanceof RegExp)
          return "regexp";
      }
      return v;
    }
    function B(g) {
      var v = X(g);
      switch (v) {
        case "array":
        case "object":
          return "an " + v;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + v;
        default:
          return v;
      }
    }
    function J(g) {
      return !g.constructor || !g.constructor.name ? d : g.constructor.name;
    }
    return b.checkPropTypes = o, b.resetWarningCache = o.resetWarningCache, b.PropTypes = b, b;
  }, Ml;
}
var zl, sh;
function a9() {
  if (sh) return zl;
  sh = 1;
  var e = /* @__PURE__ */ rd();
  function t() {
  }
  function r() {
  }
  return r.resetWarningCache = t, zl = function() {
    function n(i, s, c, l, u, f) {
      if (f !== e) {
        var d = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw d.name = "Invariant Violation", d;
      }
    }
    n.isRequired = n;
    function o() {
      return n;
    }
    var a = {
      array: n,
      bigint: n,
      bool: n,
      func: n,
      number: n,
      object: n,
      string: n,
      symbol: n,
      any: n,
      arrayOf: o,
      element: n,
      elementType: n,
      instanceOf: o,
      node: n,
      objectOf: o,
      oneOf: o,
      oneOfType: o,
      shape: o,
      exact: o,
      checkPropTypes: r,
      resetWarningCache: t
    };
    return a.PropTypes = a, a;
  }, zl;
}
var lh;
function i9() {
  if (lh) return Xa.exports;
  if (lh = 1, process.env.NODE_ENV !== "production") {
    var e = I1(), t = !0;
    Xa.exports = /* @__PURE__ */ o9()(e.isElement, t);
  } else
    Xa.exports = /* @__PURE__ */ a9()();
  return Xa.exports;
}
var s9 = /* @__PURE__ */ i9();
const we = /* @__PURE__ */ ZT(s9);
function ch(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function Ct(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? ch(Object(r), !0).forEach(function(n) {
      Tn(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : ch(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function ji(e) {
  "@babel/helpers - typeof";
  return ji = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, ji(e);
}
function Tn(e, t, r) {
  return t in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function l9(e, t) {
  if (e == null) return {};
  var r = {}, n = Object.keys(e), o, a;
  for (a = 0; a < n.length; a++)
    o = n[a], !(t.indexOf(o) >= 0) && (r[o] = e[o]);
  return r;
}
function c9(e, t) {
  if (e == null) return {};
  var r = l9(e, t), n, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      n = a[o], !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n]);
  }
  return r;
}
function Au(e) {
  return u9(e) || f9(e) || d9(e) || p9();
}
function u9(e) {
  if (Array.isArray(e)) return Cu(e);
}
function f9(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function d9(e, t) {
  if (e) {
    if (typeof e == "string") return Cu(e, t);
    var r = Object.prototype.toString.call(e).slice(8, -1);
    if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return Cu(e, t);
  }
}
function Cu(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
  return n;
}
function p9() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function m9(e) {
  var t, r = e.beat, n = e.fade, o = e.beatFade, a = e.bounce, i = e.shake, s = e.flash, c = e.spin, l = e.spinPulse, u = e.spinReverse, f = e.pulse, d = e.fixedWidth, b = e.inverse, y = e.border, p = e.listItem, m = e.flip, x = e.size, w = e.rotation, O = e.pull, E = (t = {
    "fa-beat": r,
    "fa-fade": n,
    "fa-beat-fade": o,
    "fa-bounce": a,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": u,
    "fa-spin-pulse": l,
    "fa-pulse": f,
    "fa-fw": d,
    "fa-inverse": b,
    "fa-border": y,
    "fa-li": p,
    "fa-flip": m === !0,
    "fa-flip-horizontal": m === "horizontal" || m === "both",
    "fa-flip-vertical": m === "vertical" || m === "both"
  }, Tn(t, "fa-".concat(x), typeof x < "u" && x !== null), Tn(t, "fa-rotate-".concat(w), typeof w < "u" && w !== null && w !== 0), Tn(t, "fa-pull-".concat(O), typeof O < "u" && O !== null), Tn(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(E).map(function(h) {
    return E[h] ? h : null;
  }).filter(function(h) {
    return h;
  });
}
function g9(e) {
  return e = e - 0, e === e;
}
function j1(e) {
  return g9(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, r) {
    return r ? r.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var h9 = ["style"];
function b9(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function y9(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, r) {
    var n = r.indexOf(":"), o = j1(r.slice(0, n)), a = r.slice(n + 1).trim();
    return o.startsWith("webkit") ? t[b9(o)] = a : t[o] = a, t;
  }, {});
}
function _1(e, t) {
  var r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var n = (t.children || []).map(function(c) {
    return _1(e, c);
  }), o = Object.keys(t.attributes || {}).reduce(function(c, l) {
    var u = t.attributes[l];
    switch (l) {
      case "class":
        c.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = y9(u);
        break;
      default:
        l.indexOf("aria-") === 0 || l.indexOf("data-") === 0 ? c.attrs[l.toLowerCase()] = u : c.attrs[j1(l)] = u;
    }
    return c;
  }, {
    attrs: {}
  }), a = r.style, i = a === void 0 ? {} : a, s = c9(r, h9);
  return o.attrs.style = Ct(Ct({}, o.attrs.style), i), e.apply(void 0, [t.tag, Ct(Ct({}, o.attrs), s)].concat(Au(n)));
}
var M1 = !1;
try {
  M1 = process.env.NODE_ENV === "production";
} catch {
}
function v9() {
  if (!M1 && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function uh(e) {
  if (e && ji(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Su.icon)
    return Su.icon(e);
  if (e === null)
    return null;
  if (e && ji(e) === "object" && e.prefix && e.iconName)
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
function Rl(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Tn({}, e, t) : {};
}
var fh = {
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
}, hs = /* @__PURE__ */ Oe.forwardRef(function(e, t) {
  var r = Ct(Ct({}, fh), e), n = r.icon, o = r.mask, a = r.symbol, i = r.className, s = r.title, c = r.titleId, l = r.maskId, u = uh(n), f = Rl("classes", [].concat(Au(m9(r)), Au((i || "").split(" ")))), d = Rl("transform", typeof r.transform == "string" ? Su.transform(r.transform) : r.transform), b = Rl("mask", uh(o)), y = QT(u, Ct(Ct(Ct(Ct({}, f), d), b), {}, {
    symbol: a,
    title: s,
    titleId: c,
    maskId: l
  }));
  if (!y)
    return v9("Could not find icon", u), null;
  var p = y.abstract, m = {
    ref: t
  };
  return Object.keys(r).forEach(function(x) {
    fh.hasOwnProperty(x) || (m[x] = r[x]);
  }), x9(p[0], m);
});
hs.displayName = "FontAwesomeIcon";
hs.propTypes = {
  beat: we.bool,
  border: we.bool,
  beatFade: we.bool,
  bounce: we.bool,
  className: we.string,
  fade: we.bool,
  flash: we.bool,
  mask: we.oneOfType([we.object, we.array, we.string]),
  maskId: we.string,
  fixedWidth: we.bool,
  inverse: we.bool,
  flip: we.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: we.oneOfType([we.object, we.array, we.string]),
  listItem: we.bool,
  pull: we.oneOf(["right", "left"]),
  pulse: we.bool,
  rotation: we.oneOf([0, 90, 180, 270]),
  shake: we.bool,
  size: we.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: we.bool,
  spinPulse: we.bool,
  spinReverse: we.bool,
  symbol: we.oneOfType([we.bool, we.string]),
  title: we.string,
  titleId: we.string,
  transform: we.oneOfType([we.string, we.object]),
  swapOpacity: we.bool
};
var x9 = _1.bind(null, Oe.createElement);
const w9 = [
  { id: "artcraft_1000", total: 1e3, base: 1e3, bonus: 0, priceUsd: 5 },
  { id: "artcraft_2500", total: 2500, base: 2500, bonus: 0, priceUsd: 10 },
  { id: "c_020", total: 1320, base: 1320, bonus: 0, priceUsd: 20 },
  {
    id: "c_050",
    total: 3500,
    base: 3300,
    bonus: 200,
    priceUsd: 50
  },
  {
    id: "c_100",
    total: 7500,
    base: 6600,
    bonus: 900,
    priceUsd: 100
  },
  {
    id: "c_200",
    total: 16e3,
    base: 13200,
    bonus: 2800,
    priceUsd: 200
  },
  {
    id: "c_600",
    total: 48e3,
    base: 39600,
    bonus: 8400,
    priceUsd: 600
  },
  {
    id: "c_1200",
    total: 96e3,
    base: 79200,
    bonus: 16800,
    priceUsd: 1200
  }
];
function k9() {
  return /* @__PURE__ */ L(
    hs,
    {
      icon: K6,
      className: " absolute text-[100px] right-[20px] top-[70px] text-primary/5"
    }
  );
}
function T9({
  isOpen: e = !1,
  onClose: t,
  onPurchase: r
}) {
  const n = async (a) => {
    if (r) {
      r(a);
      return;
    }
    await kn("storyteller_open_credits_purchase_command", {
      request: {
        credits_pack: a.id
      }
    }), console.log("Purchasing credits pack", a);
  }, o = "relative rounded-xl border p-6 h-full flex flex-col justify-between bg-[#1F1F1F] border-white/10 hover:border-white/20 transition-all";
  return /* @__PURE__ */ L(
    ao,
    {
      isOpen: e,
      onClose: t ?? (() => {
      }),
      className: "rounded-xl bg-[#1A1A1A] max-h-[90vh] max-w-screen-2xl overflow-y-auto flex flex-col",
      allowBackgroundInteraction: !1,
      showClose: !0,
      closeOnOutsideClick: !0,
      resizable: !1,
      backdropClassName: "bg-black/80",
      children: /* @__PURE__ */ Ee("div", { className: "p-16 py-24 flex-1 overflow-y-auto min-h-0", children: [
        /* @__PURE__ */ Ee("div", { className: "text-center mb-10", children: [
          /* @__PURE__ */ L("h1", { className: "text-5xl font-bold text-white mb-4", children: "Buy credits" }),
          /* @__PURE__ */ L("p", { className: "text-gray-400 text-lg", children: "Choose a one-time credits package. No subscription required." })
        ] }),
        /* @__PURE__ */ L("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8", children: w9.map((a) => /* @__PURE__ */ Ee("div", { className: o, children: [
          a.badge && /* @__PURE__ */ L("div", { className: "absolute -top-3 right-4 bg-white text-black px-3 py-1 rounded-full text-xs font-semibold shadow-xl", children: a.badge }),
          /* @__PURE__ */ L(k9, {}),
          /* @__PURE__ */ Ee("div", { children: [
            /* @__PURE__ */ Ee("div", { className: "text-white text-5xl font-bold tracking-tight flex items-center gap-2.5", children: [
              /* @__PURE__ */ L(
                hs,
                {
                  icon: J6,
                  className: "text-primary text-3xl"
                }
              ),
              a.total.toLocaleString()
            ] }),
            a.bonus > 0 && /* @__PURE__ */ Ee("div", { className: "text-gray-400 text-sm mt-2", children: [
              "Total: ",
              a.base.toLocaleString(),
              " ",
              " + ",
              /* @__PURE__ */ Ee("span", { className: "text-[#faca5a]", children: [
                a.bonus.toLocaleString(),
                " Bonus"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ Ee("div", { className: "flex items-center justify-between pt-6", children: [
            /* @__PURE__ */ Ee("div", { className: "text-white text-xl font-semibold", children: [
              "$",
              a.priceUsd
            ] }),
            /* @__PURE__ */ L(
              si,
              {
                onClick: () => n(a),
                className: "bg-white text-black hover:bg-white/90 px-5 h-10 rounded-xl",
                children: "Purchase"
              }
            )
          ] })
        ] }, a.id)) })
      ] })
    }
  );
}
const O9 = "grep_for_single_inclusion_12345", j9 = n0((e) => ({
  isOpen: !1,
  openModal: () => e({ isOpen: !0 }),
  closeModal: () => e({ isOpen: !1 }),
  toggleModal: () => {
    console.log(O9), e((t) => ({ isOpen: !t.isOpen }));
  }
}));
export {
  T9 as CreditsModal,
  I9 as PricingModal,
  j9 as useCreditsModalStore,
  G3 as usePricingModalStore
};
