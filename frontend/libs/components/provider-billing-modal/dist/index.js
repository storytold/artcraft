import { jsx as B, jsxs as st, Fragment as Er } from "react/jsx-runtime";
import * as _ from "react";
import Vr, { createContext as wd, useState as Be, useRef as ke, useEffect as Oe, isValidElement as Hi, cloneElement as Bi, useContext as fc, useMemo as xd, useLayoutEffect as _d, forwardRef as kd, useCallback as Ad } from "react";
import * as Od from "react-dom";
import Sd, { unstable_batchedUpdates as Pd } from "react-dom";
function Pt(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
  return function(r) {
    if (e == null || e(r), n === !1 || !r.defaultPrevented)
      return t == null ? void 0 : t(r);
  };
}
function Gi(e, t) {
  if (typeof e == "function")
    return e(t);
  e != null && (e.current = t);
}
function dc(...e) {
  return (t) => {
    let n = !1;
    const r = e.map((o) => {
      const a = Gi(o, t);
      return !n && typeof a == "function" && (n = !0), a;
    });
    if (n)
      return () => {
        for (let o = 0; o < r.length; o++) {
          const a = r[o];
          typeof a == "function" ? a() : Gi(e[o], null);
        }
      };
  };
}
function Bt(...e) {
  return _.useCallback(dc(...e), e);
}
function Ed(e, t) {
  const n = _.createContext(t), r = (a) => {
    const { children: s, ...c } = a, d = _.useMemo(() => c, Object.values(c));
    return /* @__PURE__ */ B(n.Provider, { value: d, children: s });
  };
  r.displayName = e + "Provider";
  function o(a) {
    const s = _.useContext(n);
    if (s) return s;
    if (t !== void 0) return t;
    throw new Error(`\`${a}\` must be used within \`${e}\``);
  }
  return [r, o];
}
function Nd(e, t = []) {
  let n = [];
  function r(a, s) {
    const c = _.createContext(s), d = n.length;
    n = [...n, s];
    const u = (i) => {
      var l;
      const { scope: f, children: g, ...p } = i, h = ((l = f == null ? void 0 : f[e]) == null ? void 0 : l[d]) || c, y = _.useMemo(() => p, Object.values(p));
      return /* @__PURE__ */ B(h.Provider, { value: y, children: g });
    };
    u.displayName = a + "Provider";
    function m(i, l) {
      var f;
      const g = ((f = l == null ? void 0 : l[e]) == null ? void 0 : f[d]) || c, p = _.useContext(g);
      if (p) return p;
      if (s !== void 0) return s;
      throw new Error(`\`${i}\` must be used within \`${a}\``);
    }
    return [u, m];
  }
  const o = () => {
    const a = n.map((s) => _.createContext(s));
    return function(s) {
      const c = (s == null ? void 0 : s[e]) || a;
      return _.useMemo(
        () => ({ [`__scope${e}`]: { ...s, [e]: c } }),
        [s, c]
      );
    };
  };
  return o.scopeName = e, [r, Cd(o, ...t)];
}
function Cd(...e) {
  const t = e[0];
  if (e.length === 1) return t;
  const n = () => {
    const r = e.map((o) => ({
      useScope: o(),
      scopeName: o.scopeName
    }));
    return function(o) {
      const a = r.reduce((s, { useScope: c, scopeName: d }) => {
        const u = c(o)[`__scope${d}`];
        return { ...s, ...u };
      }, {});
      return _.useMemo(() => ({ [`__scope${t.scopeName}`]: a }), [a]);
    };
  };
  return n.scopeName = t.scopeName, n;
}
var $n = globalThis != null && globalThis.document ? _.useLayoutEffect : () => {
}, Id = _[" useId ".trim().toString()] || (() => {
}), Td = 0;
function fo(e) {
  const [t, n] = _.useState(Id());
  return $n(() => {
    n((r) => r ?? String(Td++));
  }, [e]), e || (t ? `radix-${t}` : "");
}
var jd = _[" useInsertionEffect ".trim().toString()] || $n;
function Md({
  prop: e,
  defaultProp: t,
  onChange: n = () => {
  },
  caller: r
}) {
  const [o, a, s] = Dd({
    defaultProp: t,
    onChange: n
  }), c = e !== void 0, d = c ? e : o;
  {
    const m = _.useRef(e !== void 0);
    _.useEffect(() => {
      const i = m.current;
      i !== c && console.warn(
        `${r} is changing from ${i ? "controlled" : "uncontrolled"} to ${c ? "controlled" : "uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
      ), m.current = c;
    }, [c, r]);
  }
  const u = _.useCallback(
    (m) => {
      var i;
      if (c) {
        const l = Rd(m) ? m(e) : m;
        l !== e && ((i = s.current) == null || i.call(s, l));
      } else
        a(m);
    },
    [c, e, a, s]
  );
  return [d, u];
}
function Dd({
  defaultProp: e,
  onChange: t
}) {
  const [n, r] = _.useState(e), o = _.useRef(n), a = _.useRef(t);
  return jd(() => {
    a.current = t;
  }, [t]), _.useEffect(() => {
    var s;
    o.current !== n && ((s = a.current) == null || s.call(a, n), o.current = n);
  }, [n, o]), [n, r, a];
}
function Rd(e) {
  return typeof e == "function";
}
// @__NO_SIDE_EFFECTS__
function pc(e) {
  const t = /* @__PURE__ */ zd(e), n = _.forwardRef((r, o) => {
    const { children: a, ...s } = r, c = _.Children.toArray(a), d = c.find(Fd);
    if (d) {
      const u = d.props.children, m = c.map((i) => i === d ? _.Children.count(u) > 1 ? _.Children.only(null) : _.isValidElement(u) ? u.props.children : null : i);
      return /* @__PURE__ */ B(t, { ...s, ref: o, children: _.isValidElement(u) ? _.cloneElement(u, void 0, m) : null });
    }
    return /* @__PURE__ */ B(t, { ...s, ref: o, children: a });
  });
  return n.displayName = `${e}.Slot`, n;
}
// @__NO_SIDE_EFFECTS__
function zd(e) {
  const t = _.forwardRef((n, r) => {
    const { children: o, ...a } = n;
    if (_.isValidElement(o)) {
      const s = Vd(o), c = $d(a, o.props);
      return o.type !== _.Fragment && (c.ref = r ? dc(r, s) : s), _.cloneElement(o, c);
    }
    return _.Children.count(o) > 1 ? _.Children.only(null) : null;
  });
  return t.displayName = `${e}.SlotClone`, t;
}
var Ld = Symbol("radix.slottable");
function Fd(e) {
  return _.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === Ld;
}
function $d(e, t) {
  const n = { ...t };
  for (const r in t) {
    const o = e[r], a = t[r];
    /^on[A-Z]/.test(r) ? o && a ? n[r] = (...s) => {
      const c = a(...s);
      return o(...s), c;
    } : o && (n[r] = o) : r === "style" ? n[r] = { ...o, ...a } : r === "className" && (n[r] = [o, a].filter(Boolean).join(" "));
  }
  return { ...e, ...n };
}
function Vd(e) {
  var t, n;
  let r = (t = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : t.get, o = r && "isReactWarning" in r && r.isReactWarning;
  return o ? e.ref : (r = (n = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : n.get, o = r && "isReactWarning" in r && r.isReactWarning, o ? e.props.ref : e.props.ref || e.ref);
}
var Wd = [
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
], et = Wd.reduce((e, t) => {
  const n = /* @__PURE__ */ pc(`Primitive.${t}`), r = _.forwardRef((o, a) => {
    const { asChild: s, ...c } = o, d = s ? n : t;
    return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ B(d, { ...c, ref: a });
  });
  return r.displayName = `Primitive.${t}`, { ...e, [t]: r };
}, {});
function Hd(e, t) {
  e && Od.flushSync(() => e.dispatchEvent(t));
}
function Vn(e) {
  const t = _.useRef(e);
  return _.useEffect(() => {
    t.current = e;
  }), _.useMemo(() => (...n) => {
    var r;
    return (r = t.current) == null ? void 0 : r.call(t, ...n);
  }, []);
}
function Bd(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = Vn(e);
  _.useEffect(() => {
    const r = (o) => {
      o.key === "Escape" && n(o);
    };
    return t.addEventListener("keydown", r, { capture: !0 }), () => t.removeEventListener("keydown", r, { capture: !0 });
  }, [n, t]);
}
var Gd = "DismissableLayer", Zo = "dismissableLayer.update", Ud = "dismissableLayer.pointerDownOutside", Yd = "dismissableLayer.focusOutside", Ui, mc = _.createContext({
  layers: /* @__PURE__ */ new Set(),
  layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
  branches: /* @__PURE__ */ new Set()
}), hc = _.forwardRef(
  (e, t) => {
    const {
      disableOutsidePointerEvents: n = !1,
      onEscapeKeyDown: r,
      onPointerDownOutside: o,
      onFocusOutside: a,
      onInteractOutside: s,
      onDismiss: c,
      ...d
    } = e, u = _.useContext(mc), [m, i] = _.useState(null), l = (m == null ? void 0 : m.ownerDocument) ?? (globalThis == null ? void 0 : globalThis.document), [, f] = _.useState({}), g = Bt(t, (z) => i(z)), p = Array.from(u.layers), [h] = [...u.layersWithOutsidePointerEventsDisabled].slice(-1), y = p.indexOf(h), w = m ? p.indexOf(m) : -1, x = u.layersWithOutsidePointerEventsDisabled.size > 0, O = w >= y, b = Qd((z) => {
      const K = z.target, H = [...u.branches].some((ie) => ie.contains(K));
      !O || H || (o == null || o(z), s == null || s(z), z.defaultPrevented || c == null || c());
    }, l), G = Kd((z) => {
      const K = z.target;
      [...u.branches].some((H) => H.contains(K)) || (a == null || a(z), s == null || s(z), z.defaultPrevented || c == null || c());
    }, l);
    return Bd((z) => {
      w === u.layers.size - 1 && (r == null || r(z), !z.defaultPrevented && c && (z.preventDefault(), c()));
    }, l), _.useEffect(() => {
      if (m)
        return n && (u.layersWithOutsidePointerEventsDisabled.size === 0 && (Ui = l.body.style.pointerEvents, l.body.style.pointerEvents = "none"), u.layersWithOutsidePointerEventsDisabled.add(m)), u.layers.add(m), Yi(), () => {
          n && u.layersWithOutsidePointerEventsDisabled.size === 1 && (l.body.style.pointerEvents = Ui);
        };
    }, [m, l, n, u]), _.useEffect(() => () => {
      m && (u.layers.delete(m), u.layersWithOutsidePointerEventsDisabled.delete(m), Yi());
    }, [m, u]), _.useEffect(() => {
      const z = () => f({});
      return document.addEventListener(Zo, z), () => document.removeEventListener(Zo, z);
    }, []), /* @__PURE__ */ B(
      et.div,
      {
        ...d,
        ref: g,
        style: {
          pointerEvents: x ? O ? "auto" : "none" : void 0,
          ...e.style
        },
        onFocusCapture: Pt(e.onFocusCapture, G.onFocusCapture),
        onBlurCapture: Pt(e.onBlurCapture, G.onBlurCapture),
        onPointerDownCapture: Pt(
          e.onPointerDownCapture,
          b.onPointerDownCapture
        )
      }
    );
  }
);
hc.displayName = Gd;
var qd = "DismissableLayerBranch", Xd = _.forwardRef((e, t) => {
  const n = _.useContext(mc), r = _.useRef(null), o = Bt(t, r);
  return _.useEffect(() => {
    const a = r.current;
    if (a)
      return n.branches.add(a), () => {
        n.branches.delete(a);
      };
  }, [n.branches]), /* @__PURE__ */ B(et.div, { ...e, ref: o });
});
Xd.displayName = qd;
function Qd(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = Vn(e), r = _.useRef(!1), o = _.useRef(() => {
  });
  return _.useEffect(() => {
    const a = (c) => {
      if (c.target && !r.current) {
        let d = function() {
          gc(
            Ud,
            n,
            u,
            { discrete: !0 }
          );
        };
        const u = { originalEvent: c };
        c.pointerType === "touch" ? (t.removeEventListener("click", o.current), o.current = d, t.addEventListener("click", o.current, { once: !0 })) : d();
      } else
        t.removeEventListener("click", o.current);
      r.current = !1;
    }, s = window.setTimeout(() => {
      t.addEventListener("pointerdown", a);
    }, 0);
    return () => {
      window.clearTimeout(s), t.removeEventListener("pointerdown", a), t.removeEventListener("click", o.current);
    };
  }, [t, n]), {
    // ensures we check React component tree (not just DOM tree)
    onPointerDownCapture: () => r.current = !0
  };
}
function Kd(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = Vn(e), r = _.useRef(!1);
  return _.useEffect(() => {
    const o = (a) => {
      a.target && !r.current && gc(Yd, n, { originalEvent: a }, {
        discrete: !1
      });
    };
    return t.addEventListener("focusin", o), () => t.removeEventListener("focusin", o);
  }, [t, n]), {
    onFocusCapture: () => r.current = !0,
    onBlurCapture: () => r.current = !1
  };
}
function Yi() {
  const e = new CustomEvent(Zo);
  document.dispatchEvent(e);
}
function gc(e, t, n, { discrete: r }) {
  const o = n.originalEvent.target, a = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: n });
  t && o.addEventListener(e, t, { once: !0 }), r ? Hd(o, a) : o.dispatchEvent(a);
}
var po = "focusScope.autoFocusOnMount", mo = "focusScope.autoFocusOnUnmount", qi = { bubbles: !1, cancelable: !0 }, Zd = "FocusScope", yc = _.forwardRef((e, t) => {
  const {
    loop: n = !1,
    trapped: r = !1,
    onMountAutoFocus: o,
    onUnmountAutoFocus: a,
    ...s
  } = e, [c, d] = _.useState(null), u = Vn(o), m = Vn(a), i = _.useRef(null), l = Bt(t, (p) => d(p)), f = _.useRef({
    paused: !1,
    pause() {
      this.paused = !0;
    },
    resume() {
      this.paused = !1;
    }
  }).current;
  _.useEffect(() => {
    if (r) {
      let p = function(x) {
        if (f.paused || !c) return;
        const O = x.target;
        c.contains(O) ? i.current = O : kt(i.current, { select: !0 });
      }, h = function(x) {
        if (f.paused || !c) return;
        const O = x.relatedTarget;
        O !== null && (c.contains(O) || kt(i.current, { select: !0 }));
      }, y = function(x) {
        if (document.activeElement === document.body)
          for (const O of x)
            O.removedNodes.length > 0 && kt(c);
      };
      document.addEventListener("focusin", p), document.addEventListener("focusout", h);
      const w = new MutationObserver(y);
      return c && w.observe(c, { childList: !0, subtree: !0 }), () => {
        document.removeEventListener("focusin", p), document.removeEventListener("focusout", h), w.disconnect();
      };
    }
  }, [r, c, f.paused]), _.useEffect(() => {
    if (c) {
      Qi.add(f);
      const p = document.activeElement;
      if (!c.contains(p)) {
        const h = new CustomEvent(po, qi);
        c.addEventListener(po, u), c.dispatchEvent(h), h.defaultPrevented || (Jd(op(bc(c)), { select: !0 }), document.activeElement === p && kt(c));
      }
      return () => {
        c.removeEventListener(po, u), setTimeout(() => {
          const h = new CustomEvent(mo, qi);
          c.addEventListener(mo, m), c.dispatchEvent(h), h.defaultPrevented || kt(p ?? document.body, { select: !0 }), c.removeEventListener(mo, m), Qi.remove(f);
        }, 0);
      };
    }
  }, [c, u, m, f]);
  const g = _.useCallback(
    (p) => {
      if (!n && !r || f.paused) return;
      const h = p.key === "Tab" && !p.altKey && !p.ctrlKey && !p.metaKey, y = document.activeElement;
      if (h && y) {
        const w = p.currentTarget, [x, O] = ep(w);
        x && O ? !p.shiftKey && y === O ? (p.preventDefault(), n && kt(x, { select: !0 })) : p.shiftKey && y === x && (p.preventDefault(), n && kt(O, { select: !0 })) : y === w && p.preventDefault();
      }
    },
    [n, r, f.paused]
  );
  return /* @__PURE__ */ B(et.div, { tabIndex: -1, ...s, ref: l, onKeyDown: g });
});
yc.displayName = Zd;
function Jd(e, { select: t = !1 } = {}) {
  const n = document.activeElement;
  for (const r of e)
    if (kt(r, { select: t }), document.activeElement !== n) return;
}
function ep(e) {
  const t = bc(e), n = Xi(t, e), r = Xi(t.reverse(), e);
  return [n, r];
}
function bc(e) {
  const t = [], n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (r) => {
      const o = r.tagName === "INPUT" && r.type === "hidden";
      return r.disabled || r.hidden || o ? NodeFilter.FILTER_SKIP : r.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  for (; n.nextNode(); ) t.push(n.currentNode);
  return t;
}
function Xi(e, t) {
  for (const n of e)
    if (!tp(n, { upTo: t })) return n;
}
function tp(e, { upTo: t }) {
  if (getComputedStyle(e).visibility === "hidden") return !0;
  for (; e; ) {
    if (t !== void 0 && e === t) return !1;
    if (getComputedStyle(e).display === "none") return !0;
    e = e.parentElement;
  }
  return !1;
}
function np(e) {
  return e instanceof HTMLInputElement && "select" in e;
}
function kt(e, { select: t = !1 } = {}) {
  if (e && e.focus) {
    const n = document.activeElement;
    e.focus({ preventScroll: !0 }), e !== n && np(e) && t && e.select();
  }
}
var Qi = rp();
function rp() {
  let e = [];
  return {
    add(t) {
      const n = e[0];
      t !== n && (n == null || n.pause()), e = Ki(e, t), e.unshift(t);
    },
    remove(t) {
      var n;
      e = Ki(e, t), (n = e[0]) == null || n.resume();
    }
  };
}
function Ki(e, t) {
  const n = [...e], r = n.indexOf(t);
  return r !== -1 && n.splice(r, 1), n;
}
function op(e) {
  return e.filter((t) => t.tagName !== "A");
}
var ap = "Portal", vc = _.forwardRef((e, t) => {
  var n;
  const { container: r, ...o } = e, [a, s] = _.useState(!1);
  $n(() => s(!0), []);
  const c = r || a && ((n = globalThis == null ? void 0 : globalThis.document) == null ? void 0 : n.body);
  return c ? Sd.createPortal(/* @__PURE__ */ B(et.div, { ...o, ref: t }), c) : null;
});
vc.displayName = ap;
function ip(e, t) {
  return _.useReducer((n, r) => t[n][r] ?? n, e);
}
var Wr = (e) => {
  const { present: t, children: n } = e, r = sp(t), o = typeof n == "function" ? n({ present: r.isPresent }) : _.Children.only(n), a = Bt(r.ref, lp(o));
  return typeof n == "function" || r.isPresent ? _.cloneElement(o, { ref: a }) : null;
};
Wr.displayName = "Presence";
function sp(e) {
  const [t, n] = _.useState(), r = _.useRef(null), o = _.useRef(e), a = _.useRef("none"), s = e ? "mounted" : "unmounted", [c, d] = ip(s, {
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
  return _.useEffect(() => {
    const u = lr(r.current);
    a.current = c === "mounted" ? u : "none";
  }, [c]), $n(() => {
    const u = r.current, m = o.current;
    if (m !== e) {
      const i = a.current, l = lr(u);
      e ? d("MOUNT") : l === "none" || (u == null ? void 0 : u.display) === "none" ? d("UNMOUNT") : d(m && i !== l ? "ANIMATION_OUT" : "UNMOUNT"), o.current = e;
    }
  }, [e, d]), $n(() => {
    if (t) {
      let u;
      const m = t.ownerDocument.defaultView ?? window, i = (f) => {
        const g = lr(r.current).includes(f.animationName);
        if (f.target === t && g && (d("ANIMATION_END"), !o.current)) {
          const p = t.style.animationFillMode;
          t.style.animationFillMode = "forwards", u = m.setTimeout(() => {
            t.style.animationFillMode === "forwards" && (t.style.animationFillMode = p);
          });
        }
      }, l = (f) => {
        f.target === t && (a.current = lr(r.current));
      };
      return t.addEventListener("animationstart", l), t.addEventListener("animationcancel", i), t.addEventListener("animationend", i), () => {
        m.clearTimeout(u), t.removeEventListener("animationstart", l), t.removeEventListener("animationcancel", i), t.removeEventListener("animationend", i);
      };
    } else
      d("ANIMATION_END");
  }, [t, d]), {
    isPresent: ["mounted", "unmountSuspended"].includes(c),
    ref: _.useCallback((u) => {
      r.current = u ? getComputedStyle(u) : null, n(u);
    }, [])
  };
}
function lr(e) {
  return (e == null ? void 0 : e.animationName) || "none";
}
function lp(e) {
  var t, n;
  let r = (t = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : t.get, o = r && "isReactWarning" in r && r.isReactWarning;
  return o ? e.ref : (r = (n = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : n.get, o = r && "isReactWarning" in r && r.isReactWarning, o ? e.props.ref : e.props.ref || e.ref);
}
var ho = 0;
function cp() {
  _.useEffect(() => {
    const e = document.querySelectorAll("[data-radix-focus-guard]");
    return document.body.insertAdjacentElement("afterbegin", e[0] ?? Zi()), document.body.insertAdjacentElement("beforeend", e[1] ?? Zi()), ho++, () => {
      ho === 1 && document.querySelectorAll("[data-radix-focus-guard]").forEach((t) => t.remove()), ho--;
    };
  }, []);
}
function Zi() {
  const e = document.createElement("span");
  return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
var Ye = function() {
  return Ye = Object.assign || function(e) {
    for (var t, n = 1, r = arguments.length; n < r; n++) {
      t = arguments[n];
      for (var o in t) Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o]);
    }
    return e;
  }, Ye.apply(this, arguments);
};
function wc(e, t) {
  var n = {};
  for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
  if (e != null && typeof Object.getOwnPropertySymbols == "function")
    for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
      t.indexOf(r[o]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[o]) && (n[r[o]] = e[r[o]]);
  return n;
}
function up(e, t, n) {
  for (var r = 0, o = t.length, a; r < o; r++)
    (a || !(r in t)) && (a || (a = Array.prototype.slice.call(t, 0, r)), a[r] = t[r]);
  return e.concat(a || Array.prototype.slice.call(t));
}
var wr = "right-scroll-bar-position", xr = "width-before-scroll-bar", fp = "with-scroll-bars-hidden", dp = "--removed-body-scroll-bar-size";
function go(e, t) {
  return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
function pp(e, t) {
  var n = Be(function() {
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
var mp = typeof window < "u" ? _.useLayoutEffect : _.useEffect, Ji = /* @__PURE__ */ new WeakMap();
function hp(e, t) {
  var n = pp(null, function(r) {
    return e.forEach(function(o) {
      return go(o, r);
    });
  });
  return mp(function() {
    var r = Ji.get(n);
    if (r) {
      var o = new Set(r), a = new Set(e), s = n.current;
      o.forEach(function(c) {
        a.has(c) || go(c, null);
      }), a.forEach(function(c) {
        o.has(c) || go(c, s);
      });
    }
    Ji.set(n, e);
  }, [e]), n;
}
function gp(e) {
  return e;
}
function yp(e, t) {
  t === void 0 && (t = gp);
  var n = [], r = !1, o = {
    read: function() {
      if (r)
        throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
      return n.length ? n[n.length - 1] : e;
    },
    useMedium: function(a) {
      var s = t(a, r);
      return n.push(s), function() {
        n = n.filter(function(c) {
          return c !== s;
        });
      };
    },
    assignSyncMedium: function(a) {
      for (r = !0; n.length; ) {
        var s = n;
        n = [], s.forEach(a);
      }
      n = {
        push: function(c) {
          return a(c);
        },
        filter: function() {
          return n;
        }
      };
    },
    assignMedium: function(a) {
      r = !0;
      var s = [];
      if (n.length) {
        var c = n;
        n = [], c.forEach(a), s = n;
      }
      var d = function() {
        var m = s;
        s = [], m.forEach(a);
      }, u = function() {
        return Promise.resolve().then(d);
      };
      u(), n = {
        push: function(m) {
          s.push(m), u();
        },
        filter: function(m) {
          return s = s.filter(m), n;
        }
      };
    }
  };
  return o;
}
function bp(e) {
  e === void 0 && (e = {});
  var t = yp(null);
  return t.options = Ye({ async: !0, ssr: !1 }, e), t;
}
var xc = function(e) {
  var t = e.sideCar, n = wc(e, ["sideCar"]);
  if (!t)
    throw new Error("Sidecar: please provide `sideCar` property to import the right car");
  var r = t.read();
  if (!r)
    throw new Error("Sidecar medium not found");
  return _.createElement(r, Ye({}, n));
};
xc.isSideCarExport = !0;
function vp(e, t) {
  return e.useMedium(t), xc;
}
var _c = bp(), yo = function() {
}, Hr = _.forwardRef(function(e, t) {
  var n = _.useRef(null), r = _.useState({
    onScrollCapture: yo,
    onWheelCapture: yo,
    onTouchMoveCapture: yo
  }), o = r[0], a = r[1], s = e.forwardProps, c = e.children, d = e.className, u = e.removeScrollBar, m = e.enabled, i = e.shards, l = e.sideCar, f = e.noRelative, g = e.noIsolation, p = e.inert, h = e.allowPinchZoom, y = e.as, w = y === void 0 ? "div" : y, x = e.gapMode, O = wc(e, ["forwardProps", "children", "className", "removeScrollBar", "enabled", "shards", "sideCar", "noRelative", "noIsolation", "inert", "allowPinchZoom", "as", "gapMode"]), b = l, G = hp([n, t]), z = Ye(Ye({}, O), o);
  return _.createElement(
    _.Fragment,
    null,
    m && _.createElement(b, { sideCar: _c, removeScrollBar: u, shards: i, noRelative: f, noIsolation: g, inert: p, setCallbacks: a, allowPinchZoom: !!h, lockRef: n, gapMode: x }),
    s ? _.cloneElement(_.Children.only(c), Ye(Ye({}, z), { ref: G })) : _.createElement(w, Ye({}, z, { className: d, ref: G }), c)
  );
});
Hr.defaultProps = {
  enabled: !0,
  removeScrollBar: !0,
  inert: !1
};
Hr.classNames = {
  fullWidth: xr,
  zeroRight: wr
};
var wp = function() {
  if (typeof __webpack_nonce__ < "u")
    return __webpack_nonce__;
};
function xp() {
  if (!document)
    return null;
  var e = document.createElement("style");
  e.type = "text/css";
  var t = wp();
  return t && e.setAttribute("nonce", t), e;
}
function _p(e, t) {
  e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function kp(e) {
  var t = document.head || document.getElementsByTagName("head")[0];
  t.appendChild(e);
}
var Ap = function() {
  var e = 0, t = null;
  return {
    add: function(n) {
      e == 0 && (t = xp()) && (_p(t, n), kp(t)), e++;
    },
    remove: function() {
      e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
    }
  };
}, Op = function() {
  var e = Ap();
  return function(t, n) {
    _.useEffect(function() {
      return e.add(t), function() {
        e.remove();
      };
    }, [t && n]);
  };
}, kc = function() {
  var e = Op(), t = function(n) {
    var r = n.styles, o = n.dynamic;
    return e(r, o), null;
  };
  return t;
}, Sp = {
  left: 0,
  top: 0,
  right: 0,
  gap: 0
}, bo = function(e) {
  return parseInt(e || "", 10) || 0;
}, Pp = function(e) {
  var t = window.getComputedStyle(document.body), n = t[e === "padding" ? "paddingLeft" : "marginLeft"], r = t[e === "padding" ? "paddingTop" : "marginTop"], o = t[e === "padding" ? "paddingRight" : "marginRight"];
  return [bo(n), bo(r), bo(o)];
}, Ep = function(e) {
  if (e === void 0 && (e = "margin"), typeof window > "u")
    return Sp;
  var t = Pp(e), n = document.documentElement.clientWidth, r = window.innerWidth;
  return {
    left: t[0],
    top: t[1],
    right: t[2],
    gap: Math.max(0, r - n + t[2] - t[0])
  };
}, Np = kc(), tn = "data-scroll-locked", Cp = function(e, t, n, r) {
  var o = e.left, a = e.top, s = e.right, c = e.gap;
  return n === void 0 && (n = "margin"), `
  .`.concat(fp, ` {
   overflow: hidden `).concat(r, `;
   padding-right: `).concat(c, "px ").concat(r, `;
  }
  body[`).concat(tn, `] {
    overflow: hidden `).concat(r, `;
    overscroll-behavior: contain;
    `).concat([
    t && "position: relative ".concat(r, ";"),
    n === "margin" && `
    padding-left: `.concat(o, `px;
    padding-top: `).concat(a, `px;
    padding-right: `).concat(s, `px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(c, "px ").concat(r, `;
    `),
    n === "padding" && "padding-right: ".concat(c, "px ").concat(r, ";")
  ].filter(Boolean).join(""), `
  }
  
  .`).concat(wr, ` {
    right: `).concat(c, "px ").concat(r, `;
  }
  
  .`).concat(xr, ` {
    margin-right: `).concat(c, "px ").concat(r, `;
  }
  
  .`).concat(wr, " .").concat(wr, ` {
    right: 0 `).concat(r, `;
  }
  
  .`).concat(xr, " .").concat(xr, ` {
    margin-right: 0 `).concat(r, `;
  }
  
  body[`).concat(tn, `] {
    `).concat(dp, ": ").concat(c, `px;
  }
`);
}, es = function() {
  var e = parseInt(document.body.getAttribute(tn) || "0", 10);
  return isFinite(e) ? e : 0;
}, Ip = function() {
  _.useEffect(function() {
    return document.body.setAttribute(tn, (es() + 1).toString()), function() {
      var e = es() - 1;
      e <= 0 ? document.body.removeAttribute(tn) : document.body.setAttribute(tn, e.toString());
    };
  }, []);
}, Tp = function(e) {
  var t = e.noRelative, n = e.noImportant, r = e.gapMode, o = r === void 0 ? "margin" : r;
  Ip();
  var a = _.useMemo(function() {
    return Ep(o);
  }, [o]);
  return _.createElement(Np, { styles: Cp(a, !t, o, n ? "" : "!important") });
}, Jo = !1;
if (typeof window < "u")
  try {
    var cr = Object.defineProperty({}, "passive", {
      get: function() {
        return Jo = !0, !0;
      }
    });
    window.addEventListener("test", cr, cr), window.removeEventListener("test", cr, cr);
  } catch {
    Jo = !1;
  }
var Ut = Jo ? { passive: !1 } : !1, jp = function(e) {
  return e.tagName === "TEXTAREA";
}, Ac = function(e, t) {
  if (!(e instanceof Element))
    return !1;
  var n = window.getComputedStyle(e);
  return (
    // not-not-scrollable
    n[t] !== "hidden" && // contains scroll inside self
    !(n.overflowY === n.overflowX && !jp(e) && n[t] === "visible")
  );
}, Mp = function(e) {
  return Ac(e, "overflowY");
}, Dp = function(e) {
  return Ac(e, "overflowX");
}, ts = function(e, t) {
  var n = t.ownerDocument, r = t;
  do {
    typeof ShadowRoot < "u" && r instanceof ShadowRoot && (r = r.host);
    var o = Oc(e, r);
    if (o) {
      var a = Sc(e, r), s = a[1], c = a[2];
      if (s > c)
        return !0;
    }
    r = r.parentNode;
  } while (r && r !== n.body);
  return !1;
}, Rp = function(e) {
  var t = e.scrollTop, n = e.scrollHeight, r = e.clientHeight;
  return [
    t,
    n,
    r
  ];
}, zp = function(e) {
  var t = e.scrollLeft, n = e.scrollWidth, r = e.clientWidth;
  return [
    t,
    n,
    r
  ];
}, Oc = function(e, t) {
  return e === "v" ? Mp(t) : Dp(t);
}, Sc = function(e, t) {
  return e === "v" ? Rp(t) : zp(t);
}, Lp = function(e, t) {
  return e === "h" && t === "rtl" ? -1 : 1;
}, Fp = function(e, t, n, r, o) {
  var a = Lp(e, window.getComputedStyle(t).direction), s = a * r, c = n.target, d = t.contains(c), u = !1, m = s > 0, i = 0, l = 0;
  do {
    if (!c)
      break;
    var f = Sc(e, c), g = f[0], p = f[1], h = f[2], y = p - h - a * g;
    (g || y) && Oc(e, c) && (i += y, l += g);
    var w = c.parentNode;
    c = w && w.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? w.host : w;
  } while (
    // portaled content
    !d && c !== document.body || // self content
    d && (t.contains(c) || t === c)
  );
  return (m && Math.abs(i) < 1 || !m && Math.abs(l) < 1) && (u = !0), u;
}, ur = function(e) {
  return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, ns = function(e) {
  return [e.deltaX, e.deltaY];
}, rs = function(e) {
  return e && "current" in e ? e.current : e;
}, $p = function(e, t) {
  return e[0] === t[0] && e[1] === t[1];
}, Vp = function(e) {
  return `
  .block-interactivity-`.concat(e, ` {pointer-events: none;}
  .allow-interactivity-`).concat(e, ` {pointer-events: all;}
`);
}, Wp = 0, Yt = [];
function Hp(e) {
  var t = _.useRef([]), n = _.useRef([0, 0]), r = _.useRef(), o = _.useState(Wp++)[0], a = _.useState(kc)[0], s = _.useRef(e);
  _.useEffect(function() {
    s.current = e;
  }, [e]), _.useEffect(function() {
    if (e.inert) {
      document.body.classList.add("block-interactivity-".concat(o));
      var p = up([e.lockRef.current], (e.shards || []).map(rs)).filter(Boolean);
      return p.forEach(function(h) {
        return h.classList.add("allow-interactivity-".concat(o));
      }), function() {
        document.body.classList.remove("block-interactivity-".concat(o)), p.forEach(function(h) {
          return h.classList.remove("allow-interactivity-".concat(o));
        });
      };
    }
  }, [e.inert, e.lockRef.current, e.shards]);
  var c = _.useCallback(function(p, h) {
    if ("touches" in p && p.touches.length === 2 || p.type === "wheel" && p.ctrlKey)
      return !s.current.allowPinchZoom;
    var y = ur(p), w = n.current, x = "deltaX" in p ? p.deltaX : w[0] - y[0], O = "deltaY" in p ? p.deltaY : w[1] - y[1], b, G = p.target, z = Math.abs(x) > Math.abs(O) ? "h" : "v";
    if ("touches" in p && z === "h" && G.type === "range")
      return !1;
    var K = ts(z, G);
    if (!K)
      return !0;
    if (K ? b = z : (b = z === "v" ? "h" : "v", K = ts(z, G)), !K)
      return !1;
    if (!r.current && "changedTouches" in p && (x || O) && (r.current = b), !b)
      return !0;
    var H = r.current || b;
    return Fp(H, h, p, H === "h" ? x : O);
  }, []), d = _.useCallback(function(p) {
    var h = p;
    if (!(!Yt.length || Yt[Yt.length - 1] !== a)) {
      var y = "deltaY" in h ? ns(h) : ur(h), w = t.current.filter(function(b) {
        return b.name === h.type && (b.target === h.target || h.target === b.shadowParent) && $p(b.delta, y);
      })[0];
      if (w && w.should) {
        h.cancelable && h.preventDefault();
        return;
      }
      if (!w) {
        var x = (s.current.shards || []).map(rs).filter(Boolean).filter(function(b) {
          return b.contains(h.target);
        }), O = x.length > 0 ? c(h, x[0]) : !s.current.noIsolation;
        O && h.cancelable && h.preventDefault();
      }
    }
  }, []), u = _.useCallback(function(p, h, y, w) {
    var x = { name: p, delta: h, target: y, should: w, shadowParent: Bp(y) };
    t.current.push(x), setTimeout(function() {
      t.current = t.current.filter(function(O) {
        return O !== x;
      });
    }, 1);
  }, []), m = _.useCallback(function(p) {
    n.current = ur(p), r.current = void 0;
  }, []), i = _.useCallback(function(p) {
    u(p.type, ns(p), p.target, c(p, e.lockRef.current));
  }, []), l = _.useCallback(function(p) {
    u(p.type, ur(p), p.target, c(p, e.lockRef.current));
  }, []);
  _.useEffect(function() {
    return Yt.push(a), e.setCallbacks({
      onScrollCapture: i,
      onWheelCapture: i,
      onTouchMoveCapture: l
    }), document.addEventListener("wheel", d, Ut), document.addEventListener("touchmove", d, Ut), document.addEventListener("touchstart", m, Ut), function() {
      Yt = Yt.filter(function(p) {
        return p !== a;
      }), document.removeEventListener("wheel", d, Ut), document.removeEventListener("touchmove", d, Ut), document.removeEventListener("touchstart", m, Ut);
    };
  }, []);
  var f = e.removeScrollBar, g = e.inert;
  return _.createElement(
    _.Fragment,
    null,
    g ? _.createElement(a, { styles: Vp(o) }) : null,
    f ? _.createElement(Tp, { noRelative: e.noRelative, gapMode: e.gapMode }) : null
  );
}
function Bp(e) {
  for (var t = null; e !== null; )
    e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
  return t;
}
const Gp = vp(_c, Hp);
var Pc = _.forwardRef(function(e, t) {
  return _.createElement(Hr, Ye({}, e, { ref: t, sideCar: Gp }));
});
Pc.classNames = Hr.classNames;
var Up = function(e) {
  if (typeof document > "u")
    return null;
  var t = Array.isArray(e) ? e[0] : e;
  return t.ownerDocument.body;
}, qt = /* @__PURE__ */ new WeakMap(), fr = /* @__PURE__ */ new WeakMap(), dr = {}, vo = 0, Ec = function(e) {
  return e && (e.host || Ec(e.parentNode));
}, Yp = function(e, t) {
  return t.map(function(n) {
    if (e.contains(n))
      return n;
    var r = Ec(n);
    return r && e.contains(r) ? r : (console.error("aria-hidden", n, "in not contained inside", e, ". Doing nothing"), null);
  }).filter(function(n) {
    return !!n;
  });
}, qp = function(e, t, n, r) {
  var o = Yp(t, Array.isArray(e) ? e : [e]);
  dr[n] || (dr[n] = /* @__PURE__ */ new WeakMap());
  var a = dr[n], s = [], c = /* @__PURE__ */ new Set(), d = new Set(o), u = function(i) {
    !i || c.has(i) || (c.add(i), u(i.parentNode));
  };
  o.forEach(u);
  var m = function(i) {
    !i || d.has(i) || Array.prototype.forEach.call(i.children, function(l) {
      if (c.has(l))
        m(l);
      else
        try {
          var f = l.getAttribute(r), g = f !== null && f !== "false", p = (qt.get(l) || 0) + 1, h = (a.get(l) || 0) + 1;
          qt.set(l, p), a.set(l, h), s.push(l), p === 1 && g && fr.set(l, !0), h === 1 && l.setAttribute(n, "true"), g || l.setAttribute(r, "true");
        } catch (y) {
          console.error("aria-hidden: cannot operate on ", l, y);
        }
    });
  };
  return m(t), c.clear(), vo++, function() {
    s.forEach(function(i) {
      var l = qt.get(i) - 1, f = a.get(i) - 1;
      qt.set(i, l), a.set(i, f), l || (fr.has(i) || i.removeAttribute(r), fr.delete(i)), f || i.removeAttribute(n);
    }), vo--, vo || (qt = /* @__PURE__ */ new WeakMap(), qt = /* @__PURE__ */ new WeakMap(), fr = /* @__PURE__ */ new WeakMap(), dr = {});
  };
}, Xp = function(e, t, n) {
  n === void 0 && (n = "data-aria-hidden");
  var r = Array.from(Array.isArray(e) ? e : [e]), o = Up(e);
  return o ? (r.push.apply(r, Array.from(o.querySelectorAll("[aria-live], script"))), qp(r, o, n, "aria-hidden")) : function() {
    return null;
  };
}, Br = "Dialog", [Nc, Rw] = Nd(Br), [Qp, We] = Nc(Br), Cc = (e) => {
  const {
    __scopeDialog: t,
    children: n,
    open: r,
    defaultOpen: o,
    onOpenChange: a,
    modal: s = !0
  } = e, c = _.useRef(null), d = _.useRef(null), [u, m] = Md({
    prop: r,
    defaultProp: o ?? !1,
    onChange: a,
    caller: Br
  });
  return /* @__PURE__ */ B(
    Qp,
    {
      scope: t,
      triggerRef: c,
      contentRef: d,
      contentId: fo(),
      titleId: fo(),
      descriptionId: fo(),
      open: u,
      onOpenChange: m,
      onOpenToggle: _.useCallback(() => m((i) => !i), [m]),
      modal: s,
      children: n
    }
  );
};
Cc.displayName = Br;
var Ic = "DialogTrigger", Kp = _.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, o = We(Ic, n), a = Bt(t, o.triggerRef);
    return /* @__PURE__ */ B(
      et.button,
      {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": o.open,
        "aria-controls": o.contentId,
        "data-state": Ka(o.open),
        ...r,
        ref: a,
        onClick: Pt(e.onClick, o.onOpenToggle)
      }
    );
  }
);
Kp.displayName = Ic;
var Xa = "DialogPortal", [Zp, Tc] = Nc(Xa, {
  forceMount: void 0
}), jc = (e) => {
  const { __scopeDialog: t, forceMount: n, children: r, container: o } = e, a = We(Xa, t);
  return /* @__PURE__ */ B(Zp, { scope: t, forceMount: n, children: _.Children.map(r, (s) => /* @__PURE__ */ B(Wr, { present: n || a.open, children: /* @__PURE__ */ B(vc, { asChild: !0, container: o, children: s }) })) });
};
jc.displayName = Xa;
var Nr = "DialogOverlay", Mc = _.forwardRef(
  (e, t) => {
    const n = Tc(Nr, e.__scopeDialog), { forceMount: r = n.forceMount, ...o } = e, a = We(Nr, e.__scopeDialog);
    return a.modal ? /* @__PURE__ */ B(Wr, { present: r || a.open, children: /* @__PURE__ */ B(em, { ...o, ref: t }) }) : null;
  }
);
Mc.displayName = Nr;
var Jp = /* @__PURE__ */ pc("DialogOverlay.RemoveScroll"), em = _.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, o = We(Nr, n);
    return (
      // Make sure `Content` is scrollable even when it doesn't live inside `RemoveScroll`
      // ie. when `Overlay` and `Content` are siblings
      /* @__PURE__ */ B(Pc, { as: Jp, allowPinchZoom: !0, shards: [o.contentRef], children: /* @__PURE__ */ B(
        et.div,
        {
          "data-state": Ka(o.open),
          ...r,
          ref: t,
          style: { pointerEvents: "auto", ...r.style }
        }
      ) })
    );
  }
), Lt = "DialogContent", Dc = _.forwardRef(
  (e, t) => {
    const n = Tc(Lt, e.__scopeDialog), { forceMount: r = n.forceMount, ...o } = e, a = We(Lt, e.__scopeDialog);
    return /* @__PURE__ */ B(Wr, { present: r || a.open, children: a.modal ? /* @__PURE__ */ B(tm, { ...o, ref: t }) : /* @__PURE__ */ B(nm, { ...o, ref: t }) });
  }
);
Dc.displayName = Lt;
var tm = _.forwardRef(
  (e, t) => {
    const n = We(Lt, e.__scopeDialog), r = _.useRef(null), o = Bt(t, n.contentRef, r);
    return _.useEffect(() => {
      const a = r.current;
      if (a) return Xp(a);
    }, []), /* @__PURE__ */ B(
      Rc,
      {
        ...e,
        ref: o,
        trapFocus: n.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: Pt(e.onCloseAutoFocus, (a) => {
          var s;
          a.preventDefault(), (s = n.triggerRef.current) == null || s.focus();
        }),
        onPointerDownOutside: Pt(e.onPointerDownOutside, (a) => {
          const s = a.detail.originalEvent, c = s.button === 0 && s.ctrlKey === !0;
          (s.button === 2 || c) && a.preventDefault();
        }),
        onFocusOutside: Pt(
          e.onFocusOutside,
          (a) => a.preventDefault()
        )
      }
    );
  }
), nm = _.forwardRef(
  (e, t) => {
    const n = We(Lt, e.__scopeDialog), r = _.useRef(!1), o = _.useRef(!1);
    return /* @__PURE__ */ B(
      Rc,
      {
        ...e,
        ref: t,
        trapFocus: !1,
        disableOutsidePointerEvents: !1,
        onCloseAutoFocus: (a) => {
          var s, c;
          (s = e.onCloseAutoFocus) == null || s.call(e, a), a.defaultPrevented || (r.current || (c = n.triggerRef.current) == null || c.focus(), a.preventDefault()), r.current = !1, o.current = !1;
        },
        onInteractOutside: (a) => {
          var s, c;
          (s = e.onInteractOutside) == null || s.call(e, a), a.defaultPrevented || (r.current = !0, a.detail.originalEvent.type === "pointerdown" && (o.current = !0));
          const d = a.target;
          (c = n.triggerRef.current) != null && c.contains(d) && a.preventDefault(), a.detail.originalEvent.type === "focusin" && o.current && a.preventDefault();
        }
      }
    );
  }
), Rc = _.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, trapFocus: r, onOpenAutoFocus: o, onCloseAutoFocus: a, ...s } = e, c = We(Lt, n), d = _.useRef(null), u = Bt(t, d);
    return cp(), /* @__PURE__ */ st(Er, { children: [
      /* @__PURE__ */ B(
        yc,
        {
          asChild: !0,
          loop: !0,
          trapped: r,
          onMountAutoFocus: o,
          onUnmountAutoFocus: a,
          children: /* @__PURE__ */ B(
            hc,
            {
              role: "dialog",
              id: c.contentId,
              "aria-describedby": c.descriptionId,
              "aria-labelledby": c.titleId,
              "data-state": Ka(c.open),
              ...s,
              ref: u,
              onDismiss: () => c.onOpenChange(!1)
            }
          )
        }
      ),
      /* @__PURE__ */ st(Er, { children: [
        /* @__PURE__ */ B(om, { titleId: c.titleId }),
        /* @__PURE__ */ B(im, { contentRef: d, descriptionId: c.descriptionId })
      ] })
    ] });
  }
), Qa = "DialogTitle", zc = _.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, o = We(Qa, n);
    return /* @__PURE__ */ B(et.h2, { id: o.titleId, ...r, ref: t });
  }
);
zc.displayName = Qa;
var Lc = "DialogDescription", Fc = _.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, o = We(Lc, n);
    return /* @__PURE__ */ B(et.p, { id: o.descriptionId, ...r, ref: t });
  }
);
Fc.displayName = Lc;
var $c = "DialogClose", rm = _.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, o = We($c, n);
    return /* @__PURE__ */ B(
      et.button,
      {
        type: "button",
        ...r,
        ref: t,
        onClick: Pt(e.onClick, () => o.onOpenChange(!1))
      }
    );
  }
);
rm.displayName = $c;
function Ka(e) {
  return e ? "open" : "closed";
}
var Vc = "DialogTitleWarning", [zw, Wc] = Ed(Vc, {
  contentName: Lt,
  titleName: Qa,
  docsSlug: "dialog"
}), om = ({ titleId: e }) => {
  const t = Wc(Vc), n = `\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;
  return _.useEffect(() => {
    e && (document.getElementById(e) || console.error(n));
  }, [n, e]), null;
}, am = "DialogDescriptionWarning", im = ({ contentRef: e, descriptionId: t }) => {
  const n = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${Wc(am).contentName}}.`;
  return _.useEffect(() => {
    var r;
    const o = (r = e.current) == null ? void 0 : r.getAttribute("aria-describedby");
    t && o && (document.getElementById(t) || console.warn(n));
  }, [n, e, t]), null;
}, sm = Cc, lm = jc, cm = Mc, um = Dc, os = zc, fm = Fc;
const Za = "-", dm = (e) => {
  const t = mm(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(Za);
      return a[0] === "" && a.length !== 1 && a.shift(), Hc(a, t) || pm(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const s = n[o] || [];
      return a && r[o] ? [...s, ...r[o]] : s;
    }
  };
}, Hc = (e, t) => {
  var n;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], o = t.nextPart.get(r), a = o ? Hc(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const s = e.join(Za);
  return (n = t.validators.find(({
    validator: c
  }) => c(s))) == null ? void 0 : n.classGroupId;
}, as = /^\[(.+)\]$/, pm = (e) => {
  if (as.test(e)) {
    const t = as.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, mm = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return gm(Object.entries(e.classGroups), n).forEach(([o, a]) => {
    ea(a, r, o, t);
  }), r;
}, ea = (e, t, n, r) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : is(t, o);
      a.classGroupId = n;
      return;
    }
    if (typeof o == "function") {
      if (hm(o)) {
        ea(o(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: n
      });
      return;
    }
    Object.entries(o).forEach(([a, s]) => {
      ea(s, is(t, a), n, r);
    });
  });
}, is = (e, t) => {
  let n = e;
  return t.split(Za).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, hm = (e) => e.isThemeGetter, gm = (e, t) => t ? e.map(([n, r]) => {
  const o = r.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([s, c]) => [t + s, c])) : a);
  return [n, o];
}) : e, ym = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const o = (a, s) => {
    n.set(a, s), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let s = n.get(a);
      if (s !== void 0)
        return s;
      if ((s = r.get(a)) !== void 0)
        return o(a, s), s;
    },
    set(a, s) {
      n.has(a) ? n.set(a, s) : o(a, s);
    }
  };
}, Bc = "!", bm = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, o = t[0], a = t.length, s = (c) => {
    const d = [];
    let u = 0, m = 0, i;
    for (let h = 0; h < c.length; h++) {
      let y = c[h];
      if (u === 0) {
        if (y === o && (r || c.slice(h, h + a) === t)) {
          d.push(c.slice(m, h)), m = h + a;
          continue;
        }
        if (y === "/") {
          i = h;
          continue;
        }
      }
      y === "[" ? u++ : y === "]" && u--;
    }
    const l = d.length === 0 ? c : c.substring(m), f = l.startsWith(Bc), g = f ? l.substring(1) : l, p = i && i > m ? i - m : void 0;
    return {
      modifiers: d,
      hasImportantModifier: f,
      baseClassName: g,
      maybePostfixModifierPosition: p
    };
  };
  return n ? (c) => n({
    className: c,
    parseClassName: s
  }) : s;
}, vm = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, wm = (e) => ({
  cache: ym(e.cacheSize),
  parseClassName: bm(e),
  ...dm(e)
}), xm = /\s+/, _m = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: o
  } = t, a = [], s = e.trim().split(xm);
  let c = "";
  for (let d = s.length - 1; d >= 0; d -= 1) {
    const u = s[d], {
      modifiers: m,
      hasImportantModifier: i,
      baseClassName: l,
      maybePostfixModifierPosition: f
    } = n(u);
    let g = !!f, p = r(g ? l.substring(0, f) : l);
    if (!p) {
      if (!g) {
        c = u + (c.length > 0 ? " " + c : c);
        continue;
      }
      if (p = r(l), !p) {
        c = u + (c.length > 0 ? " " + c : c);
        continue;
      }
      g = !1;
    }
    const h = vm(m).join(":"), y = i ? h + Bc : h, w = y + p;
    if (a.includes(w))
      continue;
    a.push(w);
    const x = o(p, g);
    for (let O = 0; O < x.length; ++O) {
      const b = x[O];
      a.push(y + b);
    }
    c = u + (c.length > 0 ? " " + c : c);
  }
  return c;
};
function km() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = Gc(t)) && (r && (r += " "), r += n);
  return r;
}
const Gc = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = Gc(e[r])) && (n && (n += " "), n += t);
  return n;
};
function Am(e, ...t) {
  let n, r, o, a = s;
  function s(d) {
    const u = t.reduce((m, i) => i(m), e());
    return n = wm(u), r = n.cache.get, o = n.cache.set, a = c, c(d);
  }
  function c(d) {
    const u = r(d);
    if (u)
      return u;
    const m = _m(d, n);
    return o(d, m), m;
  }
  return function() {
    return a(km.apply(null, arguments));
  };
}
const ge = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, Uc = /^\[(?:([a-z-]+):)?(.+)\]$/i, Om = /^\d+\/\d+$/, Sm = /* @__PURE__ */ new Set(["px", "full", "screen"]), Pm = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Em = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Nm = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Cm = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Im = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, nt = (e) => nn(e) || Sm.has(e) || Om.test(e), ht = (e) => dn(e, "length", Fm), nn = (e) => !!e && !Number.isNaN(Number(e)), wo = (e) => dn(e, "number", nn), yn = (e) => !!e && Number.isInteger(Number(e)), Tm = (e) => e.endsWith("%") && nn(e.slice(0, -1)), ee = (e) => Uc.test(e), gt = (e) => Pm.test(e), jm = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Mm = (e) => dn(e, jm, Yc), Dm = (e) => dn(e, "position", Yc), Rm = /* @__PURE__ */ new Set(["image", "url"]), zm = (e) => dn(e, Rm, Vm), Lm = (e) => dn(e, "", $m), bn = () => !0, dn = (e, t, n) => {
  const r = Uc.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, Fm = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  Em.test(e) && !Nm.test(e)
), Yc = () => !1, $m = (e) => Cm.test(e), Vm = (e) => Im.test(e), Wm = () => {
  const e = ge("colors"), t = ge("spacing"), n = ge("blur"), r = ge("brightness"), o = ge("borderColor"), a = ge("borderRadius"), s = ge("borderSpacing"), c = ge("borderWidth"), d = ge("contrast"), u = ge("grayscale"), m = ge("hueRotate"), i = ge("invert"), l = ge("gap"), f = ge("gradientColorStops"), g = ge("gradientColorStopPositions"), p = ge("inset"), h = ge("margin"), y = ge("opacity"), w = ge("padding"), x = ge("saturate"), O = ge("scale"), b = ge("sepia"), G = ge("skew"), z = ge("space"), K = ge("translate"), H = () => ["auto", "contain", "none"], ie = () => ["auto", "hidden", "clip", "visible", "scroll"], se = () => ["auto", ee, t], $ = () => [ee, t], ue = () => ["", nt, ht], R = () => ["auto", nn, ee], S = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], V = () => ["solid", "dashed", "dotted", "double", "none"], Z = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], q = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], ce = () => ["", "0", ee], v = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], k = () => [nn, ee];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [bn],
      spacing: [nt, ht],
      blur: ["none", "", gt, ee],
      brightness: k(),
      borderColor: [e],
      borderRadius: ["none", "", "full", gt, ee],
      borderSpacing: $(),
      borderWidth: ue(),
      contrast: k(),
      grayscale: ce(),
      hueRotate: k(),
      invert: ce(),
      gap: $(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Tm, ht],
      inset: se(),
      margin: se(),
      opacity: k(),
      padding: $(),
      saturate: k(),
      scale: k(),
      sepia: ce(),
      skew: k(),
      space: $(),
      translate: $()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", ee]
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
        columns: [gt]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": v()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": v()
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
        object: [...S(), ee]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: ie()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": ie()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": ie()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: H()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": H()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": H()
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
        z: ["auto", yn, ee]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: se()
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
        flex: ["1", "auto", "initial", "none", ee]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: ce()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: ce()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", yn, ee]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [bn]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", yn, ee]
        }, ee]
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
        "grid-rows": [bn]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [yn, ee]
        }, ee]
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
        "auto-cols": ["auto", "min", "max", "fr", ee]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", ee]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [l]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [l]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [l]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...q()]
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
        content: ["normal", ...q(), "baseline"]
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
        "place-content": [...q(), "baseline"]
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
        "space-x": [z]
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
        "space-y": [z]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", ee, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [ee, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [ee, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [gt]
        }, gt]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [ee, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [ee, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [ee, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [ee, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", gt, ht]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", wo]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [bn]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", ee]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", nn, wo]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", nt, ee]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", ee]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", ee]
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
        decoration: [...V(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", nt, ht]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", nt, ee]
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
        indent: $()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", ee]
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
        content: ["none", ee]
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
        bg: [...S(), Dm]
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
        bg: ["auto", "cover", "contain", Mm]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, zm]
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
        from: [g]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [g]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [g]
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
        border: [c]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [c]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [c]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [c]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [c]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [c]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [c]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [c]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [c]
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
        border: [...V(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [c]
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
        "divide-y": [c]
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
        divide: V()
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
        outline: ["", ...V()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [nt, ee]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [nt, ht]
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
        ring: ue()
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
        "ring-offset": [nt, ht]
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
        shadow: ["", "inner", "none", gt, Lm]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [bn]
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
        "mix-blend": [...Z(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": Z()
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
        contrast: [d]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", gt, ee]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [u]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [m]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [i]
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
        sepia: [b]
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
        "backdrop-contrast": [d]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [u]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [m]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [i]
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
        "backdrop-saturate": [x]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [b]
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
        "border-spacing": [s]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [s]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [s]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", ee]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: k()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", ee]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: k()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", ee]
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
        rotate: [yn, ee]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [K]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [K]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [G]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [G]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", ee]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", ee]
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
        "scroll-m": $()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": $()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": $()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": $()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": $()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": $()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": $()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": $()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": $()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": $()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": $()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": $()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": $()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": $()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": $()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": $()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": $()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": $()
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
        "will-change": ["auto", "scroll", "contents", "transform", ee]
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
        stroke: [nt, ht, wo]
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
}, Cn = /* @__PURE__ */ Am(Wm);
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function Hm(e, t, n) {
  return (t = Gm(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function ss(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function P(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? ss(Object(n), !0).forEach(function(r) {
      Hm(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : ss(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Bm(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Gm(e) {
  var t = Bm(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const ls = () => {
};
let Ja = {}, qc = {}, Xc = null, Qc = {
  mark: ls,
  measure: ls
};
try {
  typeof window < "u" && (Ja = window), typeof document < "u" && (qc = document), typeof MutationObserver < "u" && (Xc = MutationObserver), typeof performance < "u" && (Qc = performance);
} catch {
}
const {
  userAgent: cs = ""
} = Ja.navigator || {}, Nt = Ja, be = qc, us = Xc, pr = Qc;
Nt.document;
const pt = !!be.documentElement && !!be.head && typeof be.addEventListener == "function" && typeof be.createElement == "function", Kc = ~cs.indexOf("MSIE") || ~cs.indexOf("Trident/");
var Um = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, Ym = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Zc = {
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
}, qm = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Jc = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Se = "classic", Gr = "duotone", Xm = "sharp", Qm = "sharp-duotone", eu = [Se, Gr, Xm, Qm], Km = {
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
}, Zm = {
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
}, Jm = /* @__PURE__ */ new Map([["classic", {
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
}]]), eh = {
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
}, th = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], fs = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, nh = ["kit"], rh = {
  kit: {
    "fa-kit": "fak"
  }
}, oh = ["fak", "fakd"], ah = {
  kit: {
    fak: "fa-kit"
  }
}, ds = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, mr = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, ih = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], sh = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], lh = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, ch = {
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
}, uh = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, ta = {
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
}, fh = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], na = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...ih, ...fh], dh = ["solid", "regular", "light", "thin", "duotone", "brands"], tu = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ph = tu.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), mh = [...Object.keys(uh), ...dh, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", mr.GROUP, mr.SWAP_OPACITY, mr.PRIMARY, mr.SECONDARY].concat(tu.map((e) => "".concat(e, "x"))).concat(ph.map((e) => "w-".concat(e))), hh = {
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
const lt = "___FONT_AWESOME___", ra = 16, nu = "fa", ru = "svg-inline--fa", Ft = "data-fa-i2svg", oa = "data-fa-pseudo-element", gh = "data-fa-pseudo-element-pending", ei = "data-prefix", ti = "data-icon", ps = "fontawesome-i2svg", yh = "async", bh = ["HTML", "HEAD", "STYLE", "SCRIPT"], ou = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function tr(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[Se];
    }
  });
}
const au = P({}, Zc);
au[Se] = P(P(P(P({}, {
  "fa-duotone": "duotone"
}), Zc[Se]), fs.kit), fs["kit-duotone"]);
const vh = tr(au), aa = P({}, eh);
aa[Se] = P(P(P(P({}, {
  duotone: "fad"
}), aa[Se]), ds.kit), ds["kit-duotone"]);
const ms = tr(aa), ia = P({}, ta);
ia[Se] = P(P({}, ia[Se]), ah.kit);
const ni = tr(ia), sa = P({}, ch);
sa[Se] = P(P({}, sa[Se]), rh.kit);
tr(sa);
const wh = Um, iu = "fa-layers-text", xh = Ym, _h = P({}, Km);
tr(_h);
const kh = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], xo = qm, Ah = [...nh, ...mh], In = Nt.FontAwesomeConfig || {};
function Oh(e) {
  var t = be.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function Sh(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
be && typeof be.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, n] = e;
  const r = Sh(Oh(t));
  r != null && (In[n] = r);
});
const su = {
  styleDefault: "solid",
  familyDefault: Se,
  cssPrefix: nu,
  replacementClass: ru,
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
In.familyPrefix && (In.cssPrefix = In.familyPrefix);
const cn = P(P({}, su), In);
cn.autoReplaceSvg || (cn.observeMutations = !1);
const U = {};
Object.keys(su).forEach((e) => {
  Object.defineProperty(U, e, {
    enumerable: !0,
    set: function(t) {
      cn[e] = t, Tn.forEach((n) => n(U));
    },
    get: function() {
      return cn[e];
    }
  });
});
Object.defineProperty(U, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    cn.cssPrefix = e, Tn.forEach((t) => t(U));
  },
  get: function() {
    return cn.cssPrefix;
  }
});
Nt.FontAwesomeConfig = U;
const Tn = [];
function Ph(e) {
  return Tn.push(e), () => {
    Tn.splice(Tn.indexOf(e), 1);
  };
}
const yt = ra, Xe = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function Eh(e) {
  if (!e || !pt)
    return;
  const t = be.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = be.head.childNodes;
  let r = null;
  for (let o = n.length - 1; o > -1; o--) {
    const a = n[o], s = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(s) > -1 && (r = a);
  }
  return be.head.insertBefore(t, r), e;
}
const Nh = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Wn() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += Nh[Math.random() * 62 | 0];
  return t;
}
function pn(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function ri(e) {
  return e.classList ? pn(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function lu(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Ch(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(lu(e[n]), '" '), "").trim();
}
function Ur(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function oi(e) {
  return e.size !== Xe.size || e.x !== Xe.x || e.y !== Xe.y || e.rotate !== Xe.rotate || e.flipX || e.flipY;
}
function Ih(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const o = {
    transform: "translate(".concat(n / 2, " 256)")
  }, a = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), s = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), c = "rotate(".concat(t.rotate, " 0 0)"), d = {
    transform: "".concat(a, " ").concat(s, " ").concat(c)
  }, u = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: d,
    path: u
  };
}
function Th(e) {
  let {
    transform: t,
    width: n = ra,
    height: r = ra,
    startCentered: o = !1
  } = e, a = "";
  return o && Kc ? a += "translate(".concat(t.x / yt - n / 2, "em, ").concat(t.y / yt - r / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / yt, "em), calc(-50% + ").concat(t.y / yt, "em)) ") : a += "translate(".concat(t.x / yt, "em, ").concat(t.y / yt, "em) "), a += "scale(".concat(t.size / yt * (t.flipX ? -1 : 1), ", ").concat(t.size / yt * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var jh = `:root, :host {
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
function cu() {
  const e = nu, t = ru, n = U.cssPrefix, r = U.replacementClass;
  let o = jh;
  if (n !== e || r !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), s = new RegExp("\\--".concat(e, "\\-"), "g"), c = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(n, "-")).replace(s, "--".concat(n, "-")).replace(c, ".".concat(r));
  }
  return o;
}
let hs = !1;
function _o() {
  U.autoAddCss && !hs && (Eh(cu()), hs = !0);
}
var Mh = {
  mixout() {
    return {
      dom: {
        css: cu,
        insertCss: _o
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        _o();
      },
      beforeI2svg() {
        _o();
      }
    };
  }
};
const ct = Nt || {};
ct[lt] || (ct[lt] = {});
ct[lt].styles || (ct[lt].styles = {});
ct[lt].hooks || (ct[lt].hooks = {});
ct[lt].shims || (ct[lt].shims = []);
var Qe = ct[lt];
const uu = [], fu = function() {
  be.removeEventListener("DOMContentLoaded", fu), Cr = 1, uu.map((e) => e());
};
let Cr = !1;
pt && (Cr = (be.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(be.readyState), Cr || be.addEventListener("DOMContentLoaded", fu));
function Dh(e) {
  pt && (Cr ? setTimeout(e, 0) : uu.push(e));
}
function nr(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? lu(e) : "<".concat(t, " ").concat(Ch(n), ">").concat(r.map(nr).join(""), "</").concat(t, ">");
}
function gs(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var ko = function(e, t, n, r) {
  var o = Object.keys(e), a = o.length, s = t, c, d, u;
  for (n === void 0 ? (c = 1, u = e[o[0]]) : (c = 0, u = n); c < a; c++)
    d = o[c], u = s(u, e[d], d, e);
  return u;
};
function Rh(e) {
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
function du(e) {
  const t = Rh(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function zh(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), o;
  return r >= 55296 && r <= 56319 && n > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (r - 55296) * 1024 + o - 56320 + 65536 : r;
}
function ys(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function la(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, o = ys(t);
  typeof Qe.hooks.addPack == "function" && !r ? Qe.hooks.addPack(e, ys(t)) : Qe.styles[e] = P(P({}, Qe.styles[e] || {}), o), e === "fas" && la("fa", t);
}
const {
  styles: Hn,
  shims: Lh
} = Qe, pu = Object.keys(ni), Fh = pu.reduce((e, t) => (e[t] = Object.keys(ni[t]), e), {});
let ai = null, mu = {}, hu = {}, gu = {}, yu = {}, bu = {};
function $h(e) {
  return ~Ah.indexOf(e);
}
function Vh(e, t) {
  const n = t.split("-"), r = n[0], o = n.slice(1).join("-");
  return r === e && o !== "" && !$h(o) ? o : null;
}
const vu = () => {
  const e = (r) => ko(Hn, (o, a, s) => (o[s] = ko(a, r, {}), o), {});
  mu = e((r, o, a) => (o[3] && (r[o[3]] = a), o[2] && o[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = a;
  }), r)), hu = e((r, o, a) => (r[a] = a, o[2] && o[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = a;
  }), r)), bu = e((r, o, a) => {
    const s = o[2];
    return r[a] = a, s.forEach((c) => {
      r[c] = a;
    }), r;
  });
  const t = "far" in Hn || U.autoFetchSvg, n = ko(Lh, (r, o) => {
    const a = o[0];
    let s = o[1];
    const c = o[2];
    return s === "far" && !t && (s = "fas"), typeof a == "string" && (r.names[a] = {
      prefix: s,
      iconName: c
    }), typeof a == "number" && (r.unicodes[a.toString(16)] = {
      prefix: s,
      iconName: c
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  gu = n.names, yu = n.unicodes, ai = Yr(U.styleDefault, {
    family: U.familyDefault
  });
};
Ph((e) => {
  ai = Yr(e.styleDefault, {
    family: U.familyDefault
  });
});
vu();
function ii(e, t) {
  return (mu[e] || {})[t];
}
function Wh(e, t) {
  return (hu[e] || {})[t];
}
function Rt(e, t) {
  return (bu[e] || {})[t];
}
function wu(e) {
  return gu[e] || {
    prefix: null,
    iconName: null
  };
}
function Hh(e) {
  const t = yu[e], n = ii("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Ct() {
  return ai;
}
const xu = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function Bh(e) {
  let t = Se;
  const n = pu.reduce((r, o) => (r[o] = "".concat(U.cssPrefix, "-").concat(o), r), {});
  return eu.forEach((r) => {
    (e.includes(n[r]) || e.some((o) => Fh[r].includes(o))) && (t = r);
  }), t;
}
function Yr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = Se
  } = t, r = vh[n][e];
  if (n === Gr && !e)
    return "fad";
  const o = ms[n][e] || ms[n][r], a = e in Qe.styles ? e : null;
  return o || a || null;
}
function Gh(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const o = Vh(U.cssPrefix, r);
    o ? n = o : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function bs(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function qr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const o = na.concat(sh), a = bs(e.filter((i) => o.includes(i))), s = bs(e.filter((i) => !na.includes(i))), c = a.filter((i) => (r = i, !Jc.includes(i))), [d = null] = c, u = Bh(a), m = P(P({}, Gh(s)), {}, {
    prefix: Yr(d, {
      family: u
    })
  });
  return P(P(P({}, m), Xh({
    values: e,
    family: u,
    styles: Hn,
    config: U,
    canonical: m,
    givenPrefix: r
  })), Uh(n, r, m));
}
function Uh(e, t, n) {
  let {
    prefix: r,
    iconName: o
  } = n;
  if (e || !r || !o)
    return {
      prefix: r,
      iconName: o
    };
  const a = t === "fa" ? wu(o) : {}, s = Rt(r, o);
  return o = a.iconName || s || o, r = a.prefix || r, r === "far" && !Hn.far && Hn.fas && !U.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: o
  };
}
const Yh = eu.filter((e) => e !== Se || e !== Gr), qh = Object.keys(ta).filter((e) => e !== Se).map((e) => Object.keys(ta[e])).flat();
function Xh(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: o = "",
    styles: a = {},
    config: s = {}
  } = e, c = n === Gr, d = t.includes("fa-duotone") || t.includes("fad"), u = s.familyDefault === "duotone", m = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!c && (d || u || m) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && Yh.includes(n) && (Object.keys(a).find((i) => qh.includes(i)) || s.autoFetchSvg)) {
    const i = Jm.get(n).defaultShortPrefixId;
    r.prefix = i, r.iconName = Rt(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || o === "fa") && (r.prefix = Ct() || "fas"), r;
}
class Qh {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const o = n.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = P(P({}, this.definitions[a] || {}), o[a]), la(a, o[a]);
      const s = ni[Se][a];
      s && la(s, o[a]), vu();
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
        iconName: s,
        icon: c
      } = r[o], d = c[2];
      t[a] || (t[a] = {}), d.length > 0 && d.forEach((u) => {
        typeof u == "string" && (t[a][u] = c);
      }), t[a][s] = c;
    }), t;
  }
}
let vs = [], Qt = {};
const rn = {}, Kh = Object.keys(rn);
function Zh(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return vs = e, Qt = {}, Object.keys(rn).forEach((r) => {
    Kh.indexOf(r) === -1 && delete rn[r];
  }), vs.forEach((r) => {
    const o = r.mixout ? r.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (n[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((s) => {
        n[a] || (n[a] = {}), n[a][s] = o[a][s];
      });
    }), r.hooks) {
      const a = r.hooks();
      Object.keys(a).forEach((s) => {
        Qt[s] || (Qt[s] = []), Qt[s].push(a[s]);
      });
    }
    r.provides && r.provides(rn);
  }), n;
}
function ca(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), o = 2; o < n; o++)
    r[o - 2] = arguments[o];
  return (Qt[e] || []).forEach((a) => {
    t = a.apply(null, [t, ...r]);
  }), t;
}
function $t(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (Qt[e] || []).forEach((o) => {
    o.apply(null, n);
  });
}
function It() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return rn[e] ? rn[e].apply(null, t) : void 0;
}
function ua(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || Ct();
  if (t)
    return t = Rt(n, t) || t, gs(_u.definitions, n, t) || gs(Qe.styles, n, t);
}
const _u = new Qh(), Jh = () => {
  U.autoReplaceSvg = !1, U.observeMutations = !1, $t("noAuto");
}, eg = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return pt ? ($t("beforeI2svg", e), It("pseudoElements2svg", e), It("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    U.autoReplaceSvg === !1 && (U.autoReplaceSvg = !0), U.observeMutations = !0, Dh(() => {
      ng({
        autoReplaceSvgRoot: t
      }), $t("watch", e);
    });
  }
}, tg = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Rt(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = Yr(e[0]);
      return {
        prefix: n,
        iconName: Rt(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(U.cssPrefix, "-")) > -1 || e.match(wh))) {
      const t = qr(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Ct(),
        iconName: Rt(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Ct();
      return {
        prefix: t,
        iconName: Rt(t, e) || e
      };
    }
  }
}, Ie = {
  noAuto: Jh,
  config: U,
  dom: eg,
  parse: tg,
  library: _u,
  findIconDefinition: ua,
  toHtml: nr
}, ng = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = be
  } = e;
  (Object.keys(Qe.styles).length > 0 || U.autoFetchSvg) && pt && U.autoReplaceSvg && Ie.dom.i2svg({
    node: t
  });
};
function Xr(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => nr(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!pt) return;
      const n = be.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function rg(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: o,
    styles: a,
    transform: s
  } = e;
  if (oi(s) && n.found && !r.found) {
    const {
      width: c,
      height: d
    } = n, u = {
      x: c / d / 2,
      y: 0.5
    };
    o.style = Ur(P(P({}, a), {}, {
      "transform-origin": "".concat(u.x + s.x / 16, "em ").concat(u.y + s.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function og(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: o,
    symbol: a
  } = e;
  const s = a === !0 ? "".concat(t, "-").concat(U.cssPrefix, "-").concat(n) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: P(P({}, o), {}, {
        id: s
      }),
      children: r
    }]
  }];
}
function si(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: o,
    transform: a,
    symbol: s,
    title: c,
    maskId: d,
    titleId: u,
    extra: m,
    watchable: i = !1
  } = e, {
    width: l,
    height: f
  } = n.found ? n : t, g = oh.includes(r), p = [U.replacementClass, o ? "".concat(U.cssPrefix, "-").concat(o) : ""].filter((b) => m.classes.indexOf(b) === -1).filter((b) => b !== "" || !!b).concat(m.classes).join(" ");
  let h = {
    children: [],
    attributes: P(P({}, m.attributes), {}, {
      "data-prefix": r,
      "data-icon": o,
      class: p,
      role: m.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(l, " ").concat(f)
    })
  };
  const y = g && !~m.classes.indexOf("fa-fw") ? {
    width: "".concat(l / f * 16 * 0.0625, "em")
  } : {};
  i && (h.attributes[Ft] = ""), c && (h.children.push({
    tag: "title",
    attributes: {
      id: h.attributes["aria-labelledby"] || "title-".concat(u || Wn())
    },
    children: [c]
  }), delete h.attributes.title);
  const w = P(P({}, h), {}, {
    prefix: r,
    iconName: o,
    main: t,
    mask: n,
    maskId: d,
    transform: a,
    symbol: s,
    styles: P(P({}, y), m.styles)
  }), {
    children: x,
    attributes: O
  } = n.found && t.found ? It("generateAbstractMask", w) || {
    children: [],
    attributes: {}
  } : It("generateAbstractIcon", w) || {
    children: [],
    attributes: {}
  };
  return w.children = x, w.attributes = O, s ? og(w) : rg(w);
}
function ws(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: o,
    title: a,
    extra: s,
    watchable: c = !1
  } = e, d = P(P(P({}, s.attributes), a ? {
    title: a
  } : {}), {}, {
    class: s.classes.join(" ")
  });
  c && (d[Ft] = "");
  const u = P({}, s.styles);
  oi(o) && (u.transform = Th({
    transform: o,
    startCentered: !0,
    width: n,
    height: r
  }), u["-webkit-transform"] = u.transform);
  const m = Ur(u);
  m.length > 0 && (d.style = m);
  const i = [];
  return i.push({
    tag: "span",
    attributes: d,
    children: [t]
  }), a && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [a]
  }), i;
}
function ag(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, o = P(P(P({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), a = Ur(r.styles);
  a.length > 0 && (o.style = a);
  const s = [];
  return s.push({
    tag: "span",
    attributes: o,
    children: [t]
  }), n && s.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [n]
  }), s;
}
const {
  styles: Ao
} = Qe;
function fa(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let o = null;
  return Array.isArray(r) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(U.cssPrefix, "-").concat(xo.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(U.cssPrefix, "-").concat(xo.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(U.cssPrefix, "-").concat(xo.PRIMARY),
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
const ig = {
  found: !1,
  width: 512,
  height: 512
};
function sg(e, t) {
  !ou && !U.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function da(e, t) {
  let n = t;
  return t === "fa" && U.styleDefault !== null && (t = Ct()), new Promise((r, o) => {
    if (n === "fa") {
      const a = wu(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && Ao[t] && Ao[t][e]) {
      const a = Ao[t][e];
      return r(fa(a));
    }
    sg(e, t), r(P(P({}, ig), {}, {
      icon: U.showMissingIcons && e ? It("missingIconAbstract") || {} : {}
    }));
  });
}
const xs = () => {
}, pa = U.measurePerformance && pr && pr.mark && pr.measure ? pr : {
  mark: xs,
  measure: xs
}, Sn = 'FA "6.7.2"', lg = (e) => (pa.mark("".concat(Sn, " ").concat(e, " begins")), () => ku(e)), ku = (e) => {
  pa.mark("".concat(Sn, " ").concat(e, " ends")), pa.measure("".concat(Sn, " ").concat(e), "".concat(Sn, " ").concat(e, " begins"), "".concat(Sn, " ").concat(e, " ends"));
};
var li = {
  begin: lg,
  end: ku
};
const _r = () => {
};
function _s(e) {
  return typeof (e.getAttribute ? e.getAttribute(Ft) : null) == "string";
}
function cg(e) {
  const t = e.getAttribute ? e.getAttribute(ei) : null, n = e.getAttribute ? e.getAttribute(ti) : null;
  return t && n;
}
function ug(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(U.replacementClass);
}
function fg() {
  return U.autoReplaceSvg === !0 ? kr.replace : kr[U.autoReplaceSvg] || kr.replace;
}
function dg(e) {
  return be.createElementNS("http://www.w3.org/2000/svg", e);
}
function pg(e) {
  return be.createElement(e);
}
function Au(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? dg : pg
  } = t;
  if (typeof e == "string")
    return be.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    r.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    r.appendChild(Au(o, {
      ceFn: n
    }));
  }), r;
}
function mg(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const kr = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(Au(n), t);
      }), t.getAttribute(Ft) === null && U.keepOriginalSource) {
        let n = be.createComment(mg(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~ri(t).indexOf(U.replacementClass))
      return kr.replace(e);
    const r = new RegExp("".concat(U.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const a = n[0].attributes.class.split(" ").reduce((s, c) => (c === U.replacementClass || c.match(r) ? s.toSvg.push(c) : s.toNode.push(c), s), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = n.map((a) => nr(a)).join(`
`);
    t.setAttribute(Ft, ""), t.innerHTML = o;
  }
};
function ks(e) {
  e();
}
function Ou(e, t) {
  const n = typeof t == "function" ? t : _r;
  if (e.length === 0)
    n();
  else {
    let r = ks;
    U.mutateApproach === yh && (r = Nt.requestAnimationFrame || ks), r(() => {
      const o = fg(), a = li.begin("mutate");
      e.map(o), a(), n();
    });
  }
}
let ci = !1;
function Su() {
  ci = !0;
}
function ma() {
  ci = !1;
}
let Ir = null;
function As(e) {
  if (!us || !U.observeMutations)
    return;
  const {
    treeCallback: t = _r,
    nodeCallback: n = _r,
    pseudoElementsCallback: r = _r,
    observeMutationsRoot: o = be
  } = e;
  Ir = new us((a) => {
    if (ci) return;
    const s = Ct();
    pn(a).forEach((c) => {
      if (c.type === "childList" && c.addedNodes.length > 0 && !_s(c.addedNodes[0]) && (U.searchPseudoElements && r(c.target), t(c.target)), c.type === "attributes" && c.target.parentNode && U.searchPseudoElements && r(c.target.parentNode), c.type === "attributes" && _s(c.target) && ~kh.indexOf(c.attributeName))
        if (c.attributeName === "class" && cg(c.target)) {
          const {
            prefix: d,
            iconName: u
          } = qr(ri(c.target));
          c.target.setAttribute(ei, d || s), u && c.target.setAttribute(ti, u);
        } else ug(c.target) && n(c.target);
    });
  }), pt && Ir.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function hg() {
  Ir && Ir.disconnect();
}
function gg(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, o) => {
    const a = o.split(":"), s = a[0], c = a.slice(1);
    return s && c.length > 0 && (r[s] = c.join(":").trim()), r;
  }, {})), n;
}
function yg(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = qr(ri(e));
  return o.prefix || (o.prefix = Ct()), t && n && (o.prefix = t, o.iconName = n), o.iconName && o.prefix || (o.prefix && r.length > 0 && (o.iconName = Wh(o.prefix, e.innerText) || ii(o.prefix, du(e.innerText))), !o.iconName && U.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function bg(e) {
  const t = pn(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return U.autoA11y && (n ? t["aria-labelledby"] = "".concat(U.replacementClass, "-title-").concat(r || Wn()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function vg() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: Xe,
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
function Os(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: o
  } = yg(e), a = bg(e), s = ca("parseNodeAttributes", {}, e);
  let c = t.styleParser ? gg(e) : [];
  return P({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: Xe,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: o,
      styles: c,
      attributes: a
    }
  }, s);
}
const {
  styles: wg
} = Qe;
function Pu(e) {
  const t = U.autoReplaceSvg === "nest" ? Os(e, {
    styleParser: !1
  }) : Os(e);
  return ~t.extra.classes.indexOf(iu) ? It("generateLayersText", e, t) : It("generateSvgReplacementMutation", e, t);
}
function xg() {
  return [...th, ...na];
}
function Ss(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!pt) return Promise.resolve();
  const n = be.documentElement.classList, r = (m) => n.add("".concat(ps, "-").concat(m)), o = (m) => n.remove("".concat(ps, "-").concat(m)), a = U.autoFetchSvg ? xg() : Jc.concat(Object.keys(wg));
  a.includes("fa") || a.push("fa");
  const s = [".".concat(iu, ":not([").concat(Ft, "])")].concat(a.map((m) => ".".concat(m, ":not([").concat(Ft, "])"))).join(", ");
  if (s.length === 0)
    return Promise.resolve();
  let c = [];
  try {
    c = pn(e.querySelectorAll(s));
  } catch {
  }
  if (c.length > 0)
    r("pending"), o("complete");
  else
    return Promise.resolve();
  const d = li.begin("onTree"), u = c.reduce((m, i) => {
    try {
      const l = Pu(i);
      l && m.push(l);
    } catch (l) {
      ou || l.name === "MissingIcon" && console.error(l);
    }
    return m;
  }, []);
  return new Promise((m, i) => {
    Promise.all(u).then((l) => {
      Ou(l, () => {
        r("active"), r("complete"), o("pending"), typeof t == "function" && t(), d(), m();
      });
    }).catch((l) => {
      d(), i(l);
    });
  });
}
function _g(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  Pu(e).then((n) => {
    n && Ou([n], t);
  });
}
function kg(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : ua(t || {});
    let {
      mask: o
    } = n;
    return o && (o = (o || {}).icon ? o : ua(o || {})), e(r, P(P({}, n), {}, {
      mask: o
    }));
  };
}
const Ag = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = Xe,
    symbol: r = !1,
    mask: o = null,
    maskId: a = null,
    title: s = null,
    titleId: c = null,
    classes: d = [],
    attributes: u = {},
    styles: m = {}
  } = t;
  if (!e) return;
  const {
    prefix: i,
    iconName: l,
    icon: f
  } = e;
  return Xr(P({
    type: "icon"
  }, e), () => ($t("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), U.autoA11y && (s ? u["aria-labelledby"] = "".concat(U.replacementClass, "-title-").concat(c || Wn()) : (u["aria-hidden"] = "true", u.focusable = "false")), si({
    icons: {
      main: fa(f),
      mask: o ? fa(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: i,
    iconName: l,
    transform: P(P({}, Xe), n),
    symbol: r,
    title: s,
    maskId: a,
    titleId: c,
    extra: {
      attributes: u,
      styles: m,
      classes: d
    }
  })));
};
var Og = {
  mixout() {
    return {
      icon: kg(Ag)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Ss, e.nodeCallback = _g, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = be,
        callback: r = () => {
        }
      } = t;
      return Ss(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: o,
        titleId: a,
        prefix: s,
        transform: c,
        symbol: d,
        mask: u,
        maskId: m,
        extra: i
      } = n;
      return new Promise((l, f) => {
        Promise.all([da(r, s), u.iconName ? da(u.iconName, u.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((g) => {
          let [p, h] = g;
          l([t, si({
            icons: {
              main: p,
              mask: h
            },
            prefix: s,
            iconName: r,
            transform: c,
            symbol: d,
            maskId: m,
            title: o,
            titleId: a,
            extra: i,
            watchable: !0
          })]);
        }).catch(f);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: o,
        transform: a,
        styles: s
      } = t;
      const c = Ur(s);
      c.length > 0 && (r.style = c);
      let d;
      return oi(a) && (d = It("generateAbstractTransformGrouping", {
        main: o,
        transform: a,
        containerWidth: o.width,
        iconWidth: o.width
      })), n.push(d || o.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, Sg = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return Xr({
          type: "layer"
        }, () => {
          $t("beforeDOMElementCreation", {
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
}, Pg = {
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
        return Xr({
          type: "counter",
          content: e
        }, () => ($t("beforeDOMElementCreation", {
          content: e,
          params: t
        }), ag({
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
}, Eg = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = Xe,
          title: r = null,
          classes: o = [],
          attributes: a = {},
          styles: s = {}
        } = t;
        return Xr({
          type: "text",
          content: e
        }, () => ($t("beforeDOMElementCreation", {
          content: e,
          params: t
        }), ws({
          content: e,
          transform: P(P({}, Xe), n),
          title: r,
          extra: {
            attributes: a,
            styles: s,
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
      let s = null, c = null;
      if (Kc) {
        const d = parseInt(getComputedStyle(t).fontSize, 10), u = t.getBoundingClientRect();
        s = u.width / d, c = u.height / d;
      }
      return U.autoA11y && !r && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, ws({
        content: t.innerHTML,
        width: s,
        height: c,
        transform: o,
        title: r,
        extra: a,
        watchable: !0
      })]);
    };
  }
};
const Ng = new RegExp('"', "ug"), Ps = [1105920, 1112319], Es = P(P(P(P({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), Zm), hh), lh), ha = Object.keys(Es).reduce((e, t) => (e[t.toLowerCase()] = Es[t], e), {}), Cg = Object.keys(ha).reduce((e, t) => {
  const n = ha[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function Ig(e) {
  const t = e.replace(Ng, ""), n = zh(t, 0), r = n >= Ps[0] && n <= Ps[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: du(o ? t[0] : t),
    isSecondary: r || o
  };
}
function Tg(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), o = isNaN(r) ? "normal" : r;
  return (ha[n] || {})[o] || Cg[n];
}
function Ns(e, t) {
  const n = "".concat(gh).concat(t.replace(":", "-"));
  return new Promise((r, o) => {
    if (e.getAttribute(n) !== null)
      return r();
    const a = pn(e.children).filter((i) => i.getAttribute(oa) === t)[0], s = Nt.getComputedStyle(e, t), c = s.getPropertyValue("font-family"), d = c.match(xh), u = s.getPropertyValue("font-weight"), m = s.getPropertyValue("content");
    if (a && !d)
      return e.removeChild(a), r();
    if (d && m !== "none" && m !== "") {
      const i = s.getPropertyValue("content");
      let l = Tg(c, u);
      const {
        value: f,
        isSecondary: g
      } = Ig(i), p = d[0].startsWith("FontAwesome");
      let h = ii(l, f), y = h;
      if (p) {
        const w = Hh(f);
        w.iconName && w.prefix && (h = w.iconName, l = w.prefix);
      }
      if (h && !g && (!a || a.getAttribute(ei) !== l || a.getAttribute(ti) !== y)) {
        e.setAttribute(n, y), a && e.removeChild(a);
        const w = vg(), {
          extra: x
        } = w;
        x.attributes[oa] = t, da(h, l).then((O) => {
          const b = si(P(P({}, w), {}, {
            icons: {
              main: O,
              mask: xu()
            },
            prefix: l,
            iconName: y,
            extra: x,
            watchable: !0
          })), G = be.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(G, e.firstChild) : e.appendChild(G), G.outerHTML = b.map((z) => nr(z)).join(`
`), e.removeAttribute(n), r();
        }).catch(o);
      } else
        r();
    } else
      r();
  });
}
function jg(e) {
  return Promise.all([Ns(e, "::before"), Ns(e, "::after")]);
}
function Mg(e) {
  return e.parentNode !== document.head && !~bh.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(oa) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Cs(e) {
  if (pt)
    return new Promise((t, n) => {
      const r = pn(e.querySelectorAll("*")).filter(Mg).map(jg), o = li.begin("searchPseudoElements");
      Su(), Promise.all(r).then(() => {
        o(), ma(), t();
      }).catch(() => {
        o(), ma(), n();
      });
    });
}
var Dg = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Cs, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = be
      } = t;
      U.searchPseudoElements && Cs(n);
    };
  }
};
let Is = !1;
var Rg = {
  mixout() {
    return {
      dom: {
        unwatch() {
          Su(), Is = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        As(ca("mutationObserverCallbacks", {}));
      },
      noAuto() {
        hg();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Is ? ma() : As(ca("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Ts = (e) => {
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
    let s = o.slice(1).join("-");
    if (a && s === "h")
      return n.flipX = !0, n;
    if (a && s === "v")
      return n.flipY = !0, n;
    if (s = parseFloat(s), isNaN(s))
      return n;
    switch (a) {
      case "grow":
        n.size = n.size + s;
        break;
      case "shrink":
        n.size = n.size - s;
        break;
      case "left":
        n.x = n.x - s;
        break;
      case "right":
        n.x = n.x + s;
        break;
      case "up":
        n.y = n.y - s;
        break;
      case "down":
        n.y = n.y + s;
        break;
      case "rotate":
        n.rotate = n.rotate + s;
        break;
    }
    return n;
  }, t);
};
var zg = {
  mixout() {
    return {
      parse: {
        transform: (e) => Ts(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = Ts(n)), e;
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
      const s = {
        transform: "translate(".concat(o / 2, " 256)")
      }, c = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), d = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), u = "rotate(".concat(r.rotate, " 0 0)"), m = {
        transform: "".concat(c, " ").concat(d, " ").concat(u)
      }, i = {
        transform: "translate(".concat(a / 2 * -1, " -256)")
      }, l = {
        outer: s,
        inner: m,
        path: i
      };
      return {
        tag: "g",
        attributes: P({}, l.outer),
        children: [{
          tag: "g",
          attributes: P({}, l.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: P(P({}, n.icon.attributes), l.path)
          }]
        }]
      };
    };
  }
};
const Oo = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function js(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function Lg(e) {
  return e.tag === "g" ? e.children : [e];
}
var Fg = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? qr(n.split(" ").map((o) => o.trim())) : xu();
        return r.prefix || (r.prefix = Ct()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        maskId: s,
        transform: c
      } = t;
      const {
        width: d,
        icon: u
      } = o, {
        width: m,
        icon: i
      } = a, l = Ih({
        transform: c,
        containerWidth: m,
        iconWidth: d
      }), f = {
        tag: "rect",
        attributes: P(P({}, Oo), {}, {
          fill: "white"
        })
      }, g = u.children ? {
        children: u.children.map(js)
      } : {}, p = {
        tag: "g",
        attributes: P({}, l.inner),
        children: [js(P({
          tag: u.tag,
          attributes: P(P({}, u.attributes), l.path)
        }, g))]
      }, h = {
        tag: "g",
        attributes: P({}, l.outer),
        children: [p]
      }, y = "mask-".concat(s || Wn()), w = "clip-".concat(s || Wn()), x = {
        tag: "mask",
        attributes: P(P({}, Oo), {}, {
          id: y,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [f, h]
      }, O = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: w
          },
          children: Lg(i)
        }, x]
      };
      return n.push(O, {
        tag: "rect",
        attributes: P({
          fill: "currentColor",
          "clip-path": "url(#".concat(w, ")"),
          mask: "url(#".concat(y, ")")
        }, Oo)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, $g = {
  provides(e) {
    let t = !1;
    Nt.matchMedia && (t = Nt.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: P(P({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = P(P({}, o), {}, {
        attributeName: "opacity"
      }), s = {
        tag: "circle",
        attributes: P(P({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || s.children.push({
        tag: "animate",
        attributes: P(P({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: P(P({}, a), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(s), n.push({
        tag: "path",
        attributes: P(P({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: P(P({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: P(P({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: P(P({}, a), {}, {
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
}, Vg = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, Wg = [Mh, Og, Sg, Pg, Eg, Dg, Rg, zg, Fg, $g, Vg];
Zh(Wg, {
  mixoutsTo: Ie
});
Ie.noAuto;
Ie.config;
Ie.library;
Ie.dom;
const ga = Ie.parse;
Ie.findIconDefinition;
Ie.toHtml;
const Hg = Ie.icon;
Ie.layer;
Ie.text;
Ie.counter;
function Bg(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var hr = { exports: {} }, So = { exports: {} }, fe = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ms;
function Gg() {
  if (Ms) return fe;
  Ms = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, s = e ? Symbol.for("react.provider") : 60109, c = e ? Symbol.for("react.context") : 60110, d = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, m = e ? Symbol.for("react.forward_ref") : 60112, i = e ? Symbol.for("react.suspense") : 60113, l = e ? Symbol.for("react.suspense_list") : 60120, f = e ? Symbol.for("react.memo") : 60115, g = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, h = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, w = e ? Symbol.for("react.scope") : 60119;
  function x(b) {
    if (typeof b == "object" && b !== null) {
      var G = b.$$typeof;
      switch (G) {
        case t:
          switch (b = b.type, b) {
            case d:
            case u:
            case r:
            case a:
            case o:
            case i:
              return b;
            default:
              switch (b = b && b.$$typeof, b) {
                case c:
                case m:
                case g:
                case f:
                case s:
                  return b;
                default:
                  return G;
              }
          }
        case n:
          return G;
      }
    }
  }
  function O(b) {
    return x(b) === u;
  }
  return fe.AsyncMode = d, fe.ConcurrentMode = u, fe.ContextConsumer = c, fe.ContextProvider = s, fe.Element = t, fe.ForwardRef = m, fe.Fragment = r, fe.Lazy = g, fe.Memo = f, fe.Portal = n, fe.Profiler = a, fe.StrictMode = o, fe.Suspense = i, fe.isAsyncMode = function(b) {
    return O(b) || x(b) === d;
  }, fe.isConcurrentMode = O, fe.isContextConsumer = function(b) {
    return x(b) === c;
  }, fe.isContextProvider = function(b) {
    return x(b) === s;
  }, fe.isElement = function(b) {
    return typeof b == "object" && b !== null && b.$$typeof === t;
  }, fe.isForwardRef = function(b) {
    return x(b) === m;
  }, fe.isFragment = function(b) {
    return x(b) === r;
  }, fe.isLazy = function(b) {
    return x(b) === g;
  }, fe.isMemo = function(b) {
    return x(b) === f;
  }, fe.isPortal = function(b) {
    return x(b) === n;
  }, fe.isProfiler = function(b) {
    return x(b) === a;
  }, fe.isStrictMode = function(b) {
    return x(b) === o;
  }, fe.isSuspense = function(b) {
    return x(b) === i;
  }, fe.isValidElementType = function(b) {
    return typeof b == "string" || typeof b == "function" || b === r || b === u || b === a || b === o || b === i || b === l || typeof b == "object" && b !== null && (b.$$typeof === g || b.$$typeof === f || b.$$typeof === s || b.$$typeof === c || b.$$typeof === m || b.$$typeof === h || b.$$typeof === y || b.$$typeof === w || b.$$typeof === p);
  }, fe.typeOf = x, fe;
}
var pe = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ds;
function Ug() {
  return Ds || (Ds = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, s = e ? Symbol.for("react.provider") : 60109, c = e ? Symbol.for("react.context") : 60110, d = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, m = e ? Symbol.for("react.forward_ref") : 60112, i = e ? Symbol.for("react.suspense") : 60113, l = e ? Symbol.for("react.suspense_list") : 60120, f = e ? Symbol.for("react.memo") : 60115, g = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, h = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, w = e ? Symbol.for("react.scope") : 60119;
    function x(A) {
      return typeof A == "string" || typeof A == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      A === r || A === u || A === a || A === o || A === i || A === l || typeof A == "object" && A !== null && (A.$$typeof === g || A.$$typeof === f || A.$$typeof === s || A.$$typeof === c || A.$$typeof === m || A.$$typeof === h || A.$$typeof === y || A.$$typeof === w || A.$$typeof === p);
    }
    function O(A) {
      if (typeof A == "object" && A !== null) {
        var xe = A.$$typeof;
        switch (xe) {
          case t:
            var Ae = A.type;
            switch (Ae) {
              case d:
              case u:
              case r:
              case a:
              case o:
              case i:
                return Ae;
              default:
                var tt = Ae && Ae.$$typeof;
                switch (tt) {
                  case c:
                  case m:
                  case g:
                  case f:
                  case s:
                    return tt;
                  default:
                    return xe;
                }
            }
          case n:
            return xe;
        }
      }
    }
    var b = d, G = u, z = c, K = s, H = t, ie = m, se = r, $ = g, ue = f, R = n, S = a, V = o, Z = i, q = !1;
    function ce(A) {
      return q || (q = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), v(A) || O(A) === d;
    }
    function v(A) {
      return O(A) === u;
    }
    function k(A) {
      return O(A) === c;
    }
    function C(A) {
      return O(A) === s;
    }
    function L(A) {
      return typeof A == "object" && A !== null && A.$$typeof === t;
    }
    function I(A) {
      return O(A) === m;
    }
    function D(A) {
      return O(A) === r;
    }
    function j(A) {
      return O(A) === g;
    }
    function T(A) {
      return O(A) === f;
    }
    function F(A) {
      return O(A) === n;
    }
    function M(A) {
      return O(A) === a;
    }
    function W(A) {
      return O(A) === o;
    }
    function re(A) {
      return O(A) === i;
    }
    pe.AsyncMode = b, pe.ConcurrentMode = G, pe.ContextConsumer = z, pe.ContextProvider = K, pe.Element = H, pe.ForwardRef = ie, pe.Fragment = se, pe.Lazy = $, pe.Memo = ue, pe.Portal = R, pe.Profiler = S, pe.StrictMode = V, pe.Suspense = Z, pe.isAsyncMode = ce, pe.isConcurrentMode = v, pe.isContextConsumer = k, pe.isContextProvider = C, pe.isElement = L, pe.isForwardRef = I, pe.isFragment = D, pe.isLazy = j, pe.isMemo = T, pe.isPortal = F, pe.isProfiler = M, pe.isStrictMode = W, pe.isSuspense = re, pe.isValidElementType = x, pe.typeOf = O;
  }()), pe;
}
var Rs;
function Eu() {
  return Rs || (Rs = 1, process.env.NODE_ENV === "production" ? So.exports = Gg() : So.exports = Ug()), So.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Po, zs;
function Yg() {
  if (zs) return Po;
  zs = 1;
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
      for (var s = {}, c = 0; c < 10; c++)
        s["_" + String.fromCharCode(c)] = c;
      var d = Object.getOwnPropertyNames(s).map(function(m) {
        return s[m];
      });
      if (d.join("") !== "0123456789")
        return !1;
      var u = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(m) {
        u[m] = m;
      }), Object.keys(Object.assign({}, u)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Po = o() ? Object.assign : function(a, s) {
    for (var c, d = r(a), u, m = 1; m < arguments.length; m++) {
      c = Object(arguments[m]);
      for (var i in c)
        t.call(c, i) && (d[i] = c[i]);
      if (e) {
        u = e(c);
        for (var l = 0; l < u.length; l++)
          n.call(c, u[l]) && (d[u[l]] = c[u[l]]);
      }
    }
    return d;
  }, Po;
}
var Eo, Ls;
function ui() {
  if (Ls) return Eo;
  Ls = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return Eo = e, Eo;
}
var Fs, $s;
function Nu() {
  return $s || ($s = 1, Fs = Function.call.bind(Object.prototype.hasOwnProperty)), Fs;
}
var No, Vs;
function qg() {
  if (Vs) return No;
  Vs = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ ui(), n = {}, r = /* @__PURE__ */ Nu();
    e = function(a) {
      var s = "Warning: " + a;
      typeof console < "u" && console.error(s);
      try {
        throw new Error(s);
      } catch {
      }
    };
  }
  function o(a, s, c, d, u) {
    if (process.env.NODE_ENV !== "production") {
      for (var m in a)
        if (r(a, m)) {
          var i;
          try {
            if (typeof a[m] != "function") {
              var l = Error(
                (d || "React class") + ": " + c + " type `" + m + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[m] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw l.name = "Invariant Violation", l;
            }
            i = a[m](s, m, d, c, null, t);
          } catch (g) {
            i = g;
          }
          if (i && !(i instanceof Error) && e(
            (d || "React class") + ": type specification of " + c + " `" + m + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof i + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), i instanceof Error && !(i.message in n)) {
            n[i.message] = !0;
            var f = u ? u() : "";
            e(
              "Failed " + c + " type: " + i.message + (f ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, No = o, No;
}
var Co, Ws;
function Xg() {
  if (Ws) return Co;
  Ws = 1;
  var e = Eu(), t = Yg(), n = /* @__PURE__ */ ui(), r = /* @__PURE__ */ Nu(), o = /* @__PURE__ */ qg(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(c) {
    var d = "Warning: " + c;
    typeof console < "u" && console.error(d);
    try {
      throw new Error(d);
    } catch {
    }
  });
  function s() {
    return null;
  }
  return Co = function(c, d) {
    var u = typeof Symbol == "function" && Symbol.iterator, m = "@@iterator";
    function i(v) {
      var k = v && (u && v[u] || v[m]);
      if (typeof k == "function")
        return k;
    }
    var l = "<<anonymous>>", f = {
      array: y("array"),
      bigint: y("bigint"),
      bool: y("boolean"),
      func: y("function"),
      number: y("number"),
      object: y("object"),
      string: y("string"),
      symbol: y("symbol"),
      any: w(),
      arrayOf: x,
      element: O(),
      elementType: b(),
      instanceOf: G,
      node: ie(),
      objectOf: K,
      oneOf: z,
      oneOfType: H,
      shape: $,
      exact: ue
    };
    function g(v, k) {
      return v === k ? v !== 0 || 1 / v === 1 / k : v !== v && k !== k;
    }
    function p(v, k) {
      this.message = v, this.data = k && typeof k == "object" ? k : {}, this.stack = "";
    }
    p.prototype = Error.prototype;
    function h(v) {
      if (process.env.NODE_ENV !== "production")
        var k = {}, C = 0;
      function L(D, j, T, F, M, W, re) {
        if (F = F || l, W = W || T, re !== n) {
          if (d) {
            var A = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw A.name = "Invariant Violation", A;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var xe = F + ":" + T;
            !k[xe] && // Avoid spamming the console because they are often not actionable except for lib authors
            C < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + W + "` prop on `" + F + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), k[xe] = !0, C++);
          }
        }
        return j[T] == null ? D ? j[T] === null ? new p("The " + M + " `" + W + "` is marked as required " + ("in `" + F + "`, but its value is `null`.")) : new p("The " + M + " `" + W + "` is marked as required in " + ("`" + F + "`, but its value is `undefined`.")) : null : v(j, T, F, M, W);
      }
      var I = L.bind(null, !1);
      return I.isRequired = L.bind(null, !0), I;
    }
    function y(v) {
      function k(C, L, I, D, j, T) {
        var F = C[L], M = V(F);
        if (M !== v) {
          var W = Z(F);
          return new p(
            "Invalid " + D + " `" + j + "` of type " + ("`" + W + "` supplied to `" + I + "`, expected ") + ("`" + v + "`."),
            { expectedType: v }
          );
        }
        return null;
      }
      return h(k);
    }
    function w() {
      return h(s);
    }
    function x(v) {
      function k(C, L, I, D, j) {
        if (typeof v != "function")
          return new p("Property `" + j + "` of component `" + I + "` has invalid PropType notation inside arrayOf.");
        var T = C[L];
        if (!Array.isArray(T)) {
          var F = V(T);
          return new p("Invalid " + D + " `" + j + "` of type " + ("`" + F + "` supplied to `" + I + "`, expected an array."));
        }
        for (var M = 0; M < T.length; M++) {
          var W = v(T, M, I, D, j + "[" + M + "]", n);
          if (W instanceof Error)
            return W;
        }
        return null;
      }
      return h(k);
    }
    function O() {
      function v(k, C, L, I, D) {
        var j = k[C];
        if (!c(j)) {
          var T = V(j);
          return new p("Invalid " + I + " `" + D + "` of type " + ("`" + T + "` supplied to `" + L + "`, expected a single ReactElement."));
        }
        return null;
      }
      return h(v);
    }
    function b() {
      function v(k, C, L, I, D) {
        var j = k[C];
        if (!e.isValidElementType(j)) {
          var T = V(j);
          return new p("Invalid " + I + " `" + D + "` of type " + ("`" + T + "` supplied to `" + L + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return h(v);
    }
    function G(v) {
      function k(C, L, I, D, j) {
        if (!(C[L] instanceof v)) {
          var T = v.name || l, F = ce(C[L]);
          return new p("Invalid " + D + " `" + j + "` of type " + ("`" + F + "` supplied to `" + I + "`, expected ") + ("instance of `" + T + "`."));
        }
        return null;
      }
      return h(k);
    }
    function z(v) {
      if (!Array.isArray(v))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), s;
      function k(C, L, I, D, j) {
        for (var T = C[L], F = 0; F < v.length; F++)
          if (g(T, v[F]))
            return null;
        var M = JSON.stringify(v, function(W, re) {
          var A = Z(re);
          return A === "symbol" ? String(re) : re;
        });
        return new p("Invalid " + D + " `" + j + "` of value `" + String(T) + "` " + ("supplied to `" + I + "`, expected one of " + M + "."));
      }
      return h(k);
    }
    function K(v) {
      function k(C, L, I, D, j) {
        if (typeof v != "function")
          return new p("Property `" + j + "` of component `" + I + "` has invalid PropType notation inside objectOf.");
        var T = C[L], F = V(T);
        if (F !== "object")
          return new p("Invalid " + D + " `" + j + "` of type " + ("`" + F + "` supplied to `" + I + "`, expected an object."));
        for (var M in T)
          if (r(T, M)) {
            var W = v(T, M, I, D, j + "." + M, n);
            if (W instanceof Error)
              return W;
          }
        return null;
      }
      return h(k);
    }
    function H(v) {
      if (!Array.isArray(v))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), s;
      for (var k = 0; k < v.length; k++) {
        var C = v[k];
        if (typeof C != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + q(C) + " at index " + k + "."
          ), s;
      }
      function L(I, D, j, T, F) {
        for (var M = [], W = 0; W < v.length; W++) {
          var re = v[W], A = re(I, D, j, T, F, n);
          if (A == null)
            return null;
          A.data && r(A.data, "expectedType") && M.push(A.data.expectedType);
        }
        var xe = M.length > 0 ? ", expected one of type [" + M.join(", ") + "]" : "";
        return new p("Invalid " + T + " `" + F + "` supplied to " + ("`" + j + "`" + xe + "."));
      }
      return h(L);
    }
    function ie() {
      function v(k, C, L, I, D) {
        return R(k[C]) ? null : new p("Invalid " + I + " `" + D + "` supplied to " + ("`" + L + "`, expected a ReactNode."));
      }
      return h(v);
    }
    function se(v, k, C, L, I) {
      return new p(
        (v || "React class") + ": " + k + " type `" + C + "." + L + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + I + "`."
      );
    }
    function $(v) {
      function k(C, L, I, D, j) {
        var T = C[L], F = V(T);
        if (F !== "object")
          return new p("Invalid " + D + " `" + j + "` of type `" + F + "` " + ("supplied to `" + I + "`, expected `object`."));
        for (var M in v) {
          var W = v[M];
          if (typeof W != "function")
            return se(I, D, j, M, Z(W));
          var re = W(T, M, I, D, j + "." + M, n);
          if (re)
            return re;
        }
        return null;
      }
      return h(k);
    }
    function ue(v) {
      function k(C, L, I, D, j) {
        var T = C[L], F = V(T);
        if (F !== "object")
          return new p("Invalid " + D + " `" + j + "` of type `" + F + "` " + ("supplied to `" + I + "`, expected `object`."));
        var M = t({}, C[L], v);
        for (var W in M) {
          var re = v[W];
          if (r(v, W) && typeof re != "function")
            return se(I, D, j, W, Z(re));
          if (!re)
            return new p(
              "Invalid " + D + " `" + j + "` key `" + W + "` supplied to `" + I + "`.\nBad object: " + JSON.stringify(C[L], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(v), null, "  ")
            );
          var A = re(T, W, I, D, j + "." + W, n);
          if (A)
            return A;
        }
        return null;
      }
      return h(k);
    }
    function R(v) {
      switch (typeof v) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !v;
        case "object":
          if (Array.isArray(v))
            return v.every(R);
          if (v === null || c(v))
            return !0;
          var k = i(v);
          if (k) {
            var C = k.call(v), L;
            if (k !== v.entries) {
              for (; !(L = C.next()).done; )
                if (!R(L.value))
                  return !1;
            } else
              for (; !(L = C.next()).done; ) {
                var I = L.value;
                if (I && !R(I[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function S(v, k) {
      return v === "symbol" ? !0 : k ? k["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && k instanceof Symbol : !1;
    }
    function V(v) {
      var k = typeof v;
      return Array.isArray(v) ? "array" : v instanceof RegExp ? "object" : S(k, v) ? "symbol" : k;
    }
    function Z(v) {
      if (typeof v > "u" || v === null)
        return "" + v;
      var k = V(v);
      if (k === "object") {
        if (v instanceof Date)
          return "date";
        if (v instanceof RegExp)
          return "regexp";
      }
      return k;
    }
    function q(v) {
      var k = Z(v);
      switch (k) {
        case "array":
        case "object":
          return "an " + k;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + k;
        default:
          return k;
      }
    }
    function ce(v) {
      return !v.constructor || !v.constructor.name ? l : v.constructor.name;
    }
    return f.checkPropTypes = o, f.resetWarningCache = o.resetWarningCache, f.PropTypes = f, f;
  }, Co;
}
var Io, Hs;
function Qg() {
  if (Hs) return Io;
  Hs = 1;
  var e = /* @__PURE__ */ ui();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, Io = function() {
    function r(s, c, d, u, m, i) {
      if (i !== e) {
        var l = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw l.name = "Invariant Violation", l;
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
  }, Io;
}
var Bs;
function Kg() {
  if (Bs) return hr.exports;
  if (Bs = 1, process.env.NODE_ENV !== "production") {
    var e = Eu(), t = !0;
    hr.exports = /* @__PURE__ */ Xg()(e.isElement, t);
  } else
    hr.exports = /* @__PURE__ */ Qg()();
  return hr.exports;
}
var Zg = /* @__PURE__ */ Kg();
const oe = /* @__PURE__ */ Bg(Zg);
function Gs(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function Ge(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Gs(Object(n), !0).forEach(function(r) {
      Kt(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Gs(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Tr(e) {
  "@babel/helpers - typeof";
  return Tr = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Tr(e);
}
function Kt(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Jg(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), o, a;
  for (a = 0; a < r.length; a++)
    o = r[a], !(t.indexOf(o) >= 0) && (n[o] = e[o]);
  return n;
}
function ey(e, t) {
  if (e == null) return {};
  var n = Jg(e, t), r, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      r = a[o], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function ya(e) {
  return ty(e) || ny(e) || ry(e) || oy();
}
function ty(e) {
  if (Array.isArray(e)) return ba(e);
}
function ny(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function ry(e, t) {
  if (e) {
    if (typeof e == "string") return ba(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return ba(e, t);
  }
}
function ba(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function oy() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function ay(e) {
  var t, n = e.beat, r = e.fade, o = e.beatFade, a = e.bounce, s = e.shake, c = e.flash, d = e.spin, u = e.spinPulse, m = e.spinReverse, i = e.pulse, l = e.fixedWidth, f = e.inverse, g = e.border, p = e.listItem, h = e.flip, y = e.size, w = e.rotation, x = e.pull, O = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": o,
    "fa-bounce": a,
    "fa-shake": s,
    "fa-flash": c,
    "fa-spin": d,
    "fa-spin-reverse": m,
    "fa-spin-pulse": u,
    "fa-pulse": i,
    "fa-fw": l,
    "fa-inverse": f,
    "fa-border": g,
    "fa-li": p,
    "fa-flip": h === !0,
    "fa-flip-horizontal": h === "horizontal" || h === "both",
    "fa-flip-vertical": h === "vertical" || h === "both"
  }, Kt(t, "fa-".concat(y), typeof y < "u" && y !== null), Kt(t, "fa-rotate-".concat(w), typeof w < "u" && w !== null && w !== 0), Kt(t, "fa-pull-".concat(x), typeof x < "u" && x !== null), Kt(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(O).map(function(b) {
    return O[b] ? b : null;
  }).filter(function(b) {
    return b;
  });
}
function iy(e) {
  return e = e - 0, e === e;
}
function Cu(e) {
  return iy(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var sy = ["style"];
function ly(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function cy(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), o = Cu(n.slice(0, r)), a = n.slice(r + 1).trim();
    return o.startsWith("webkit") ? t[ly(o)] = a : t[o] = a, t;
  }, {});
}
function Iu(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(d) {
    return Iu(e, d);
  }), o = Object.keys(t.attributes || {}).reduce(function(d, u) {
    var m = t.attributes[u];
    switch (u) {
      case "class":
        d.attrs.className = m, delete t.attributes.class;
        break;
      case "style":
        d.attrs.style = cy(m);
        break;
      default:
        u.indexOf("aria-") === 0 || u.indexOf("data-") === 0 ? d.attrs[u.toLowerCase()] = m : d.attrs[Cu(u)] = m;
    }
    return d;
  }, {
    attrs: {}
  }), a = n.style, s = a === void 0 ? {} : a, c = ey(n, sy);
  return o.attrs.style = Ge(Ge({}, o.attrs.style), s), e.apply(void 0, [t.tag, Ge(Ge({}, o.attrs), c)].concat(ya(r)));
}
var Tu = !1;
try {
  Tu = process.env.NODE_ENV === "production";
} catch {
}
function uy() {
  if (!Tu && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Us(e) {
  if (e && Tr(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (ga.icon)
    return ga.icon(e);
  if (e === null)
    return null;
  if (e && Tr(e) === "object" && e.prefix && e.iconName)
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
function To(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Kt({}, e, t) : {};
}
var Ys = {
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
}, Bn = /* @__PURE__ */ Vr.forwardRef(function(e, t) {
  var n = Ge(Ge({}, Ys), e), r = n.icon, o = n.mask, a = n.symbol, s = n.className, c = n.title, d = n.titleId, u = n.maskId, m = Us(r), i = To("classes", [].concat(ya(ay(n)), ya((s || "").split(" ")))), l = To("transform", typeof n.transform == "string" ? ga.transform(n.transform) : n.transform), f = To("mask", Us(o)), g = Hg(m, Ge(Ge(Ge(Ge({}, i), l), f), {}, {
    symbol: a,
    title: c,
    titleId: d,
    maskId: u
  }));
  if (!g)
    return uy("Could not find icon", m), null;
  var p = g.abstract, h = {
    ref: t
  };
  return Object.keys(n).forEach(function(y) {
    Ys.hasOwnProperty(y) || (h[y] = n[y]);
  }), fy(p[0], h);
});
Bn.displayName = "FontAwesomeIcon";
Bn.propTypes = {
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
var fy = Iu.bind(null, Vr.createElement);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const dy = {
  prefix: "fas",
  iconName: "xmark",
  icon: [384, 512, [128473, 10005, 10006, 10060, 215, "close", "multiply", "remove", "times"], "f00d", "M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"]
};
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function py(e, t, n) {
  return (t = hy(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function qs(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function E(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? qs(Object(n), !0).forEach(function(r) {
      py(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : qs(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function my(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function hy(e) {
  var t = my(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Xs = () => {
};
let fi = {}, ju = {}, Mu = null, Du = {
  mark: Xs,
  measure: Xs
};
try {
  typeof window < "u" && (fi = window), typeof document < "u" && (ju = document), typeof MutationObserver < "u" && (Mu = MutationObserver), typeof performance < "u" && (Du = performance);
} catch {
}
const {
  userAgent: Qs = ""
} = fi.navigator || {}, Tt = fi, ve = ju, Ks = Mu, gr = Du;
Tt.document;
const mt = !!ve.documentElement && !!ve.head && typeof ve.addEventListener == "function" && typeof ve.createElement == "function", Ru = ~Qs.indexOf("MSIE") || ~Qs.indexOf("Trident/");
var gy = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, yy = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, zu = {
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
}, by = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Lu = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Pe = "classic", Qr = "duotone", vy = "sharp", wy = "sharp-duotone", Fu = [Pe, Qr, vy, wy], xy = {
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
}, _y = {
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
}, ky = /* @__PURE__ */ new Map([["classic", {
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
}]]), Ay = {
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
}, Oy = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Zs = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, Sy = ["kit"], Py = {
  kit: {
    "fa-kit": "fak"
  }
}, Ey = ["fak", "fakd"], Ny = {
  kit: {
    fak: "fa-kit"
  }
}, Js = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, yr = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Cy = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Iy = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Ty = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, jy = {
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
}, My = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, va = {
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
}, Dy = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], wa = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...Cy, ...Dy], Ry = ["solid", "regular", "light", "thin", "duotone", "brands"], $u = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], zy = $u.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), Ly = [...Object.keys(My), ...Ry, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", yr.GROUP, yr.SWAP_OPACITY, yr.PRIMARY, yr.SECONDARY].concat($u.map((e) => "".concat(e, "x"))).concat(zy.map((e) => "w-".concat(e))), Fy = {
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
const ut = "___FONT_AWESOME___", xa = 16, Vu = "fa", Wu = "svg-inline--fa", Vt = "data-fa-i2svg", _a = "data-fa-pseudo-element", $y = "data-fa-pseudo-element-pending", di = "data-prefix", pi = "data-icon", el = "fontawesome-i2svg", Vy = "async", Wy = ["HTML", "HEAD", "STYLE", "SCRIPT"], Hu = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function rr(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[Pe];
    }
  });
}
const Bu = E({}, zu);
Bu[Pe] = E(E(E(E({}, {
  "fa-duotone": "duotone"
}), zu[Pe]), Zs.kit), Zs["kit-duotone"]);
const Hy = rr(Bu), ka = E({}, Ay);
ka[Pe] = E(E(E(E({}, {
  duotone: "fad"
}), ka[Pe]), Js.kit), Js["kit-duotone"]);
const tl = rr(ka), Aa = E({}, va);
Aa[Pe] = E(E({}, Aa[Pe]), Ny.kit);
const mi = rr(Aa), Oa = E({}, jy);
Oa[Pe] = E(E({}, Oa[Pe]), Py.kit);
rr(Oa);
const By = gy, Gu = "fa-layers-text", Gy = yy, Uy = E({}, xy);
rr(Uy);
const Yy = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], jo = by, qy = [...Sy, ...Ly], jn = Tt.FontAwesomeConfig || {};
function Xy(e) {
  var t = ve.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function Qy(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
ve && typeof ve.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, n] = e;
  const r = Qy(Xy(t));
  r != null && (jn[n] = r);
});
const Uu = {
  styleDefault: "solid",
  familyDefault: Pe,
  cssPrefix: Vu,
  replacementClass: Wu,
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
jn.familyPrefix && (jn.cssPrefix = jn.familyPrefix);
const un = E(E({}, Uu), jn);
un.autoReplaceSvg || (un.observeMutations = !1);
const Y = {};
Object.keys(Uu).forEach((e) => {
  Object.defineProperty(Y, e, {
    enumerable: !0,
    set: function(t) {
      un[e] = t, Mn.forEach((n) => n(Y));
    },
    get: function() {
      return un[e];
    }
  });
});
Object.defineProperty(Y, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    un.cssPrefix = e, Mn.forEach((t) => t(Y));
  },
  get: function() {
    return un.cssPrefix;
  }
});
Tt.FontAwesomeConfig = Y;
const Mn = [];
function Ky(e) {
  return Mn.push(e), () => {
    Mn.splice(Mn.indexOf(e), 1);
  };
}
const bt = xa, Ke = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function Zy(e) {
  if (!e || !mt)
    return;
  const t = ve.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = ve.head.childNodes;
  let r = null;
  for (let o = n.length - 1; o > -1; o--) {
    const a = n[o], s = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(s) > -1 && (r = a);
  }
  return ve.head.insertBefore(t, r), e;
}
const Jy = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Gn() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += Jy[Math.random() * 62 | 0];
  return t;
}
function mn(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function hi(e) {
  return e.classList ? mn(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function Yu(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function eb(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(Yu(e[n]), '" '), "").trim();
}
function Kr(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function gi(e) {
  return e.size !== Ke.size || e.x !== Ke.x || e.y !== Ke.y || e.rotate !== Ke.rotate || e.flipX || e.flipY;
}
function tb(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const o = {
    transform: "translate(".concat(n / 2, " 256)")
  }, a = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), s = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), c = "rotate(".concat(t.rotate, " 0 0)"), d = {
    transform: "".concat(a, " ").concat(s, " ").concat(c)
  }, u = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: d,
    path: u
  };
}
function nb(e) {
  let {
    transform: t,
    width: n = xa,
    height: r = xa,
    startCentered: o = !1
  } = e, a = "";
  return o && Ru ? a += "translate(".concat(t.x / bt - n / 2, "em, ").concat(t.y / bt - r / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / bt, "em), calc(-50% + ").concat(t.y / bt, "em)) ") : a += "translate(".concat(t.x / bt, "em, ").concat(t.y / bt, "em) "), a += "scale(".concat(t.size / bt * (t.flipX ? -1 : 1), ", ").concat(t.size / bt * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var rb = `:root, :host {
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
function qu() {
  const e = Vu, t = Wu, n = Y.cssPrefix, r = Y.replacementClass;
  let o = rb;
  if (n !== e || r !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), s = new RegExp("\\--".concat(e, "\\-"), "g"), c = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(n, "-")).replace(s, "--".concat(n, "-")).replace(c, ".".concat(r));
  }
  return o;
}
let nl = !1;
function Mo() {
  Y.autoAddCss && !nl && (Zy(qu()), nl = !0);
}
var ob = {
  mixout() {
    return {
      dom: {
        css: qu,
        insertCss: Mo
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Mo();
      },
      beforeI2svg() {
        Mo();
      }
    };
  }
};
const ft = Tt || {};
ft[ut] || (ft[ut] = {});
ft[ut].styles || (ft[ut].styles = {});
ft[ut].hooks || (ft[ut].hooks = {});
ft[ut].shims || (ft[ut].shims = []);
var Ze = ft[ut];
const Xu = [], Qu = function() {
  ve.removeEventListener("DOMContentLoaded", Qu), jr = 1, Xu.map((e) => e());
};
let jr = !1;
mt && (jr = (ve.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(ve.readyState), jr || ve.addEventListener("DOMContentLoaded", Qu));
function ab(e) {
  mt && (jr ? setTimeout(e, 0) : Xu.push(e));
}
function or(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? Yu(e) : "<".concat(t, " ").concat(eb(n), ">").concat(r.map(or).join(""), "</").concat(t, ">");
}
function rl(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var Do = function(e, t, n, r) {
  var o = Object.keys(e), a = o.length, s = t, c, d, u;
  for (n === void 0 ? (c = 1, u = e[o[0]]) : (c = 0, u = n); c < a; c++)
    d = o[c], u = s(u, e[d], d, e);
  return u;
};
function ib(e) {
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
function Ku(e) {
  const t = ib(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function sb(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), o;
  return r >= 55296 && r <= 56319 && n > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (r - 55296) * 1024 + o - 56320 + 65536 : r;
}
function ol(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function Sa(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, o = ol(t);
  typeof Ze.hooks.addPack == "function" && !r ? Ze.hooks.addPack(e, ol(t)) : Ze.styles[e] = E(E({}, Ze.styles[e] || {}), o), e === "fas" && Sa("fa", t);
}
const {
  styles: Un,
  shims: lb
} = Ze, Zu = Object.keys(mi), cb = Zu.reduce((e, t) => (e[t] = Object.keys(mi[t]), e), {});
let yi = null, Ju = {}, ef = {}, tf = {}, nf = {}, rf = {};
function ub(e) {
  return ~qy.indexOf(e);
}
function fb(e, t) {
  const n = t.split("-"), r = n[0], o = n.slice(1).join("-");
  return r === e && o !== "" && !ub(o) ? o : null;
}
const of = () => {
  const e = (r) => Do(Un, (o, a, s) => (o[s] = Do(a, r, {}), o), {});
  Ju = e((r, o, a) => (o[3] && (r[o[3]] = a), o[2] && o[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = a;
  }), r)), ef = e((r, o, a) => (r[a] = a, o[2] && o[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = a;
  }), r)), rf = e((r, o, a) => {
    const s = o[2];
    return r[a] = a, s.forEach((c) => {
      r[c] = a;
    }), r;
  });
  const t = "far" in Un || Y.autoFetchSvg, n = Do(lb, (r, o) => {
    const a = o[0];
    let s = o[1];
    const c = o[2];
    return s === "far" && !t && (s = "fas"), typeof a == "string" && (r.names[a] = {
      prefix: s,
      iconName: c
    }), typeof a == "number" && (r.unicodes[a.toString(16)] = {
      prefix: s,
      iconName: c
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  tf = n.names, nf = n.unicodes, yi = Zr(Y.styleDefault, {
    family: Y.familyDefault
  });
};
Ky((e) => {
  yi = Zr(e.styleDefault, {
    family: Y.familyDefault
  });
});
of();
function bi(e, t) {
  return (Ju[e] || {})[t];
}
function db(e, t) {
  return (ef[e] || {})[t];
}
function zt(e, t) {
  return (rf[e] || {})[t];
}
function af(e) {
  return tf[e] || {
    prefix: null,
    iconName: null
  };
}
function pb(e) {
  const t = nf[e], n = bi("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function jt() {
  return yi;
}
const sf = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function mb(e) {
  let t = Pe;
  const n = Zu.reduce((r, o) => (r[o] = "".concat(Y.cssPrefix, "-").concat(o), r), {});
  return Fu.forEach((r) => {
    (e.includes(n[r]) || e.some((o) => cb[r].includes(o))) && (t = r);
  }), t;
}
function Zr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = Pe
  } = t, r = Hy[n][e];
  if (n === Qr && !e)
    return "fad";
  const o = tl[n][e] || tl[n][r], a = e in Ze.styles ? e : null;
  return o || a || null;
}
function hb(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const o = fb(Y.cssPrefix, r);
    o ? n = o : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function al(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function Jr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const o = wa.concat(Iy), a = al(e.filter((i) => o.includes(i))), s = al(e.filter((i) => !wa.includes(i))), c = a.filter((i) => (r = i, !Lu.includes(i))), [d = null] = c, u = mb(a), m = E(E({}, hb(s)), {}, {
    prefix: Zr(d, {
      family: u
    })
  });
  return E(E(E({}, m), vb({
    values: e,
    family: u,
    styles: Un,
    config: Y,
    canonical: m,
    givenPrefix: r
  })), gb(n, r, m));
}
function gb(e, t, n) {
  let {
    prefix: r,
    iconName: o
  } = n;
  if (e || !r || !o)
    return {
      prefix: r,
      iconName: o
    };
  const a = t === "fa" ? af(o) : {}, s = zt(r, o);
  return o = a.iconName || s || o, r = a.prefix || r, r === "far" && !Un.far && Un.fas && !Y.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: o
  };
}
const yb = Fu.filter((e) => e !== Pe || e !== Qr), bb = Object.keys(va).filter((e) => e !== Pe).map((e) => Object.keys(va[e])).flat();
function vb(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: o = "",
    styles: a = {},
    config: s = {}
  } = e, c = n === Qr, d = t.includes("fa-duotone") || t.includes("fad"), u = s.familyDefault === "duotone", m = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!c && (d || u || m) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && yb.includes(n) && (Object.keys(a).find((i) => bb.includes(i)) || s.autoFetchSvg)) {
    const i = ky.get(n).defaultShortPrefixId;
    r.prefix = i, r.iconName = zt(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || o === "fa") && (r.prefix = jt() || "fas"), r;
}
class wb {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const o = n.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = E(E({}, this.definitions[a] || {}), o[a]), Sa(a, o[a]);
      const s = mi[Pe][a];
      s && Sa(s, o[a]), of();
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
        iconName: s,
        icon: c
      } = r[o], d = c[2];
      t[a] || (t[a] = {}), d.length > 0 && d.forEach((u) => {
        typeof u == "string" && (t[a][u] = c);
      }), t[a][s] = c;
    }), t;
  }
}
let il = [], Zt = {};
const on = {}, xb = Object.keys(on);
function _b(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return il = e, Zt = {}, Object.keys(on).forEach((r) => {
    xb.indexOf(r) === -1 && delete on[r];
  }), il.forEach((r) => {
    const o = r.mixout ? r.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (n[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((s) => {
        n[a] || (n[a] = {}), n[a][s] = o[a][s];
      });
    }), r.hooks) {
      const a = r.hooks();
      Object.keys(a).forEach((s) => {
        Zt[s] || (Zt[s] = []), Zt[s].push(a[s]);
      });
    }
    r.provides && r.provides(on);
  }), n;
}
function Pa(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), o = 2; o < n; o++)
    r[o - 2] = arguments[o];
  return (Zt[e] || []).forEach((a) => {
    t = a.apply(null, [t, ...r]);
  }), t;
}
function Wt(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (Zt[e] || []).forEach((o) => {
    o.apply(null, n);
  });
}
function Mt() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return on[e] ? on[e].apply(null, t) : void 0;
}
function Ea(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || jt();
  if (t)
    return t = zt(n, t) || t, rl(lf.definitions, n, t) || rl(Ze.styles, n, t);
}
const lf = new wb(), kb = () => {
  Y.autoReplaceSvg = !1, Y.observeMutations = !1, Wt("noAuto");
}, Ab = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return mt ? (Wt("beforeI2svg", e), Mt("pseudoElements2svg", e), Mt("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    Y.autoReplaceSvg === !1 && (Y.autoReplaceSvg = !0), Y.observeMutations = !0, ab(() => {
      Sb({
        autoReplaceSvgRoot: t
      }), Wt("watch", e);
    });
  }
}, Ob = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: zt(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = Zr(e[0]);
      return {
        prefix: n,
        iconName: zt(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(Y.cssPrefix, "-")) > -1 || e.match(By))) {
      const t = Jr(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || jt(),
        iconName: zt(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = jt();
      return {
        prefix: t,
        iconName: zt(t, e) || e
      };
    }
  }
}, Te = {
  noAuto: kb,
  config: Y,
  dom: Ab,
  parse: Ob,
  library: lf,
  findIconDefinition: Ea,
  toHtml: or
}, Sb = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = ve
  } = e;
  (Object.keys(Ze.styles).length > 0 || Y.autoFetchSvg) && mt && Y.autoReplaceSvg && Te.dom.i2svg({
    node: t
  });
};
function eo(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => or(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!mt) return;
      const n = ve.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function Pb(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: o,
    styles: a,
    transform: s
  } = e;
  if (gi(s) && n.found && !r.found) {
    const {
      width: c,
      height: d
    } = n, u = {
      x: c / d / 2,
      y: 0.5
    };
    o.style = Kr(E(E({}, a), {}, {
      "transform-origin": "".concat(u.x + s.x / 16, "em ").concat(u.y + s.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function Eb(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: o,
    symbol: a
  } = e;
  const s = a === !0 ? "".concat(t, "-").concat(Y.cssPrefix, "-").concat(n) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: E(E({}, o), {}, {
        id: s
      }),
      children: r
    }]
  }];
}
function vi(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: o,
    transform: a,
    symbol: s,
    title: c,
    maskId: d,
    titleId: u,
    extra: m,
    watchable: i = !1
  } = e, {
    width: l,
    height: f
  } = n.found ? n : t, g = Ey.includes(r), p = [Y.replacementClass, o ? "".concat(Y.cssPrefix, "-").concat(o) : ""].filter((b) => m.classes.indexOf(b) === -1).filter((b) => b !== "" || !!b).concat(m.classes).join(" ");
  let h = {
    children: [],
    attributes: E(E({}, m.attributes), {}, {
      "data-prefix": r,
      "data-icon": o,
      class: p,
      role: m.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(l, " ").concat(f)
    })
  };
  const y = g && !~m.classes.indexOf("fa-fw") ? {
    width: "".concat(l / f * 16 * 0.0625, "em")
  } : {};
  i && (h.attributes[Vt] = ""), c && (h.children.push({
    tag: "title",
    attributes: {
      id: h.attributes["aria-labelledby"] || "title-".concat(u || Gn())
    },
    children: [c]
  }), delete h.attributes.title);
  const w = E(E({}, h), {}, {
    prefix: r,
    iconName: o,
    main: t,
    mask: n,
    maskId: d,
    transform: a,
    symbol: s,
    styles: E(E({}, y), m.styles)
  }), {
    children: x,
    attributes: O
  } = n.found && t.found ? Mt("generateAbstractMask", w) || {
    children: [],
    attributes: {}
  } : Mt("generateAbstractIcon", w) || {
    children: [],
    attributes: {}
  };
  return w.children = x, w.attributes = O, s ? Eb(w) : Pb(w);
}
function sl(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: o,
    title: a,
    extra: s,
    watchable: c = !1
  } = e, d = E(E(E({}, s.attributes), a ? {
    title: a
  } : {}), {}, {
    class: s.classes.join(" ")
  });
  c && (d[Vt] = "");
  const u = E({}, s.styles);
  gi(o) && (u.transform = nb({
    transform: o,
    startCentered: !0,
    width: n,
    height: r
  }), u["-webkit-transform"] = u.transform);
  const m = Kr(u);
  m.length > 0 && (d.style = m);
  const i = [];
  return i.push({
    tag: "span",
    attributes: d,
    children: [t]
  }), a && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [a]
  }), i;
}
function Nb(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, o = E(E(E({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), a = Kr(r.styles);
  a.length > 0 && (o.style = a);
  const s = [];
  return s.push({
    tag: "span",
    attributes: o,
    children: [t]
  }), n && s.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [n]
  }), s;
}
const {
  styles: Ro
} = Ze;
function Na(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let o = null;
  return Array.isArray(r) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(Y.cssPrefix, "-").concat(jo.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(Y.cssPrefix, "-").concat(jo.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(Y.cssPrefix, "-").concat(jo.PRIMARY),
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
const Cb = {
  found: !1,
  width: 512,
  height: 512
};
function Ib(e, t) {
  !Hu && !Y.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Ca(e, t) {
  let n = t;
  return t === "fa" && Y.styleDefault !== null && (t = jt()), new Promise((r, o) => {
    if (n === "fa") {
      const a = af(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && Ro[t] && Ro[t][e]) {
      const a = Ro[t][e];
      return r(Na(a));
    }
    Ib(e, t), r(E(E({}, Cb), {}, {
      icon: Y.showMissingIcons && e ? Mt("missingIconAbstract") || {} : {}
    }));
  });
}
const ll = () => {
}, Ia = Y.measurePerformance && gr && gr.mark && gr.measure ? gr : {
  mark: ll,
  measure: ll
}, Pn = 'FA "6.7.2"', Tb = (e) => (Ia.mark("".concat(Pn, " ").concat(e, " begins")), () => cf(e)), cf = (e) => {
  Ia.mark("".concat(Pn, " ").concat(e, " ends")), Ia.measure("".concat(Pn, " ").concat(e), "".concat(Pn, " ").concat(e, " begins"), "".concat(Pn, " ").concat(e, " ends"));
};
var wi = {
  begin: Tb,
  end: cf
};
const Ar = () => {
};
function cl(e) {
  return typeof (e.getAttribute ? e.getAttribute(Vt) : null) == "string";
}
function jb(e) {
  const t = e.getAttribute ? e.getAttribute(di) : null, n = e.getAttribute ? e.getAttribute(pi) : null;
  return t && n;
}
function Mb(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(Y.replacementClass);
}
function Db() {
  return Y.autoReplaceSvg === !0 ? Or.replace : Or[Y.autoReplaceSvg] || Or.replace;
}
function Rb(e) {
  return ve.createElementNS("http://www.w3.org/2000/svg", e);
}
function zb(e) {
  return ve.createElement(e);
}
function uf(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? Rb : zb
  } = t;
  if (typeof e == "string")
    return ve.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    r.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    r.appendChild(uf(o, {
      ceFn: n
    }));
  }), r;
}
function Lb(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const Or = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(uf(n), t);
      }), t.getAttribute(Vt) === null && Y.keepOriginalSource) {
        let n = ve.createComment(Lb(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~hi(t).indexOf(Y.replacementClass))
      return Or.replace(e);
    const r = new RegExp("".concat(Y.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const a = n[0].attributes.class.split(" ").reduce((s, c) => (c === Y.replacementClass || c.match(r) ? s.toSvg.push(c) : s.toNode.push(c), s), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = n.map((a) => or(a)).join(`
`);
    t.setAttribute(Vt, ""), t.innerHTML = o;
  }
};
function ul(e) {
  e();
}
function ff(e, t) {
  const n = typeof t == "function" ? t : Ar;
  if (e.length === 0)
    n();
  else {
    let r = ul;
    Y.mutateApproach === Vy && (r = Tt.requestAnimationFrame || ul), r(() => {
      const o = Db(), a = wi.begin("mutate");
      e.map(o), a(), n();
    });
  }
}
let xi = !1;
function df() {
  xi = !0;
}
function Ta() {
  xi = !1;
}
let Mr = null;
function fl(e) {
  if (!Ks || !Y.observeMutations)
    return;
  const {
    treeCallback: t = Ar,
    nodeCallback: n = Ar,
    pseudoElementsCallback: r = Ar,
    observeMutationsRoot: o = ve
  } = e;
  Mr = new Ks((a) => {
    if (xi) return;
    const s = jt();
    mn(a).forEach((c) => {
      if (c.type === "childList" && c.addedNodes.length > 0 && !cl(c.addedNodes[0]) && (Y.searchPseudoElements && r(c.target), t(c.target)), c.type === "attributes" && c.target.parentNode && Y.searchPseudoElements && r(c.target.parentNode), c.type === "attributes" && cl(c.target) && ~Yy.indexOf(c.attributeName))
        if (c.attributeName === "class" && jb(c.target)) {
          const {
            prefix: d,
            iconName: u
          } = Jr(hi(c.target));
          c.target.setAttribute(di, d || s), u && c.target.setAttribute(pi, u);
        } else Mb(c.target) && n(c.target);
    });
  }), mt && Mr.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function Fb() {
  Mr && Mr.disconnect();
}
function $b(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, o) => {
    const a = o.split(":"), s = a[0], c = a.slice(1);
    return s && c.length > 0 && (r[s] = c.join(":").trim()), r;
  }, {})), n;
}
function Vb(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = Jr(hi(e));
  return o.prefix || (o.prefix = jt()), t && n && (o.prefix = t, o.iconName = n), o.iconName && o.prefix || (o.prefix && r.length > 0 && (o.iconName = db(o.prefix, e.innerText) || bi(o.prefix, Ku(e.innerText))), !o.iconName && Y.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function Wb(e) {
  const t = mn(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return Y.autoA11y && (n ? t["aria-labelledby"] = "".concat(Y.replacementClass, "-title-").concat(r || Gn()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function Hb() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: Ke,
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
function dl(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: o
  } = Vb(e), a = Wb(e), s = Pa("parseNodeAttributes", {}, e);
  let c = t.styleParser ? $b(e) : [];
  return E({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: Ke,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: o,
      styles: c,
      attributes: a
    }
  }, s);
}
const {
  styles: Bb
} = Ze;
function pf(e) {
  const t = Y.autoReplaceSvg === "nest" ? dl(e, {
    styleParser: !1
  }) : dl(e);
  return ~t.extra.classes.indexOf(Gu) ? Mt("generateLayersText", e, t) : Mt("generateSvgReplacementMutation", e, t);
}
function Gb() {
  return [...Oy, ...wa];
}
function pl(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!mt) return Promise.resolve();
  const n = ve.documentElement.classList, r = (m) => n.add("".concat(el, "-").concat(m)), o = (m) => n.remove("".concat(el, "-").concat(m)), a = Y.autoFetchSvg ? Gb() : Lu.concat(Object.keys(Bb));
  a.includes("fa") || a.push("fa");
  const s = [".".concat(Gu, ":not([").concat(Vt, "])")].concat(a.map((m) => ".".concat(m, ":not([").concat(Vt, "])"))).join(", ");
  if (s.length === 0)
    return Promise.resolve();
  let c = [];
  try {
    c = mn(e.querySelectorAll(s));
  } catch {
  }
  if (c.length > 0)
    r("pending"), o("complete");
  else
    return Promise.resolve();
  const d = wi.begin("onTree"), u = c.reduce((m, i) => {
    try {
      const l = pf(i);
      l && m.push(l);
    } catch (l) {
      Hu || l.name === "MissingIcon" && console.error(l);
    }
    return m;
  }, []);
  return new Promise((m, i) => {
    Promise.all(u).then((l) => {
      ff(l, () => {
        r("active"), r("complete"), o("pending"), typeof t == "function" && t(), d(), m();
      });
    }).catch((l) => {
      d(), i(l);
    });
  });
}
function Ub(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  pf(e).then((n) => {
    n && ff([n], t);
  });
}
function Yb(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : Ea(t || {});
    let {
      mask: o
    } = n;
    return o && (o = (o || {}).icon ? o : Ea(o || {})), e(r, E(E({}, n), {}, {
      mask: o
    }));
  };
}
const qb = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = Ke,
    symbol: r = !1,
    mask: o = null,
    maskId: a = null,
    title: s = null,
    titleId: c = null,
    classes: d = [],
    attributes: u = {},
    styles: m = {}
  } = t;
  if (!e) return;
  const {
    prefix: i,
    iconName: l,
    icon: f
  } = e;
  return eo(E({
    type: "icon"
  }, e), () => (Wt("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), Y.autoA11y && (s ? u["aria-labelledby"] = "".concat(Y.replacementClass, "-title-").concat(c || Gn()) : (u["aria-hidden"] = "true", u.focusable = "false")), vi({
    icons: {
      main: Na(f),
      mask: o ? Na(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: i,
    iconName: l,
    transform: E(E({}, Ke), n),
    symbol: r,
    title: s,
    maskId: a,
    titleId: c,
    extra: {
      attributes: u,
      styles: m,
      classes: d
    }
  })));
};
var Xb = {
  mixout() {
    return {
      icon: Yb(qb)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = pl, e.nodeCallback = Ub, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = ve,
        callback: r = () => {
        }
      } = t;
      return pl(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: o,
        titleId: a,
        prefix: s,
        transform: c,
        symbol: d,
        mask: u,
        maskId: m,
        extra: i
      } = n;
      return new Promise((l, f) => {
        Promise.all([Ca(r, s), u.iconName ? Ca(u.iconName, u.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((g) => {
          let [p, h] = g;
          l([t, vi({
            icons: {
              main: p,
              mask: h
            },
            prefix: s,
            iconName: r,
            transform: c,
            symbol: d,
            maskId: m,
            title: o,
            titleId: a,
            extra: i,
            watchable: !0
          })]);
        }).catch(f);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: o,
        transform: a,
        styles: s
      } = t;
      const c = Kr(s);
      c.length > 0 && (r.style = c);
      let d;
      return gi(a) && (d = Mt("generateAbstractTransformGrouping", {
        main: o,
        transform: a,
        containerWidth: o.width,
        iconWidth: o.width
      })), n.push(d || o.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, Qb = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return eo({
          type: "layer"
        }, () => {
          Wt("beforeDOMElementCreation", {
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
              class: ["".concat(Y.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, Kb = {
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
        return eo({
          type: "counter",
          content: e
        }, () => (Wt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Nb({
          content: e.toString(),
          title: n,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(Y.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, Zb = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = Ke,
          title: r = null,
          classes: o = [],
          attributes: a = {},
          styles: s = {}
        } = t;
        return eo({
          type: "text",
          content: e
        }, () => (Wt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), sl({
          content: e,
          transform: E(E({}, Ke), n),
          title: r,
          extra: {
            attributes: a,
            styles: s,
            classes: ["".concat(Y.cssPrefix, "-layers-text"), ...o]
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
      let s = null, c = null;
      if (Ru) {
        const d = parseInt(getComputedStyle(t).fontSize, 10), u = t.getBoundingClientRect();
        s = u.width / d, c = u.height / d;
      }
      return Y.autoA11y && !r && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, sl({
        content: t.innerHTML,
        width: s,
        height: c,
        transform: o,
        title: r,
        extra: a,
        watchable: !0
      })]);
    };
  }
};
const Jb = new RegExp('"', "ug"), ml = [1105920, 1112319], hl = E(E(E(E({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), _y), Fy), Ty), ja = Object.keys(hl).reduce((e, t) => (e[t.toLowerCase()] = hl[t], e), {}), ev = Object.keys(ja).reduce((e, t) => {
  const n = ja[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function tv(e) {
  const t = e.replace(Jb, ""), n = sb(t, 0), r = n >= ml[0] && n <= ml[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: Ku(o ? t[0] : t),
    isSecondary: r || o
  };
}
function nv(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), o = isNaN(r) ? "normal" : r;
  return (ja[n] || {})[o] || ev[n];
}
function gl(e, t) {
  const n = "".concat($y).concat(t.replace(":", "-"));
  return new Promise((r, o) => {
    if (e.getAttribute(n) !== null)
      return r();
    const a = mn(e.children).filter((i) => i.getAttribute(_a) === t)[0], s = Tt.getComputedStyle(e, t), c = s.getPropertyValue("font-family"), d = c.match(Gy), u = s.getPropertyValue("font-weight"), m = s.getPropertyValue("content");
    if (a && !d)
      return e.removeChild(a), r();
    if (d && m !== "none" && m !== "") {
      const i = s.getPropertyValue("content");
      let l = nv(c, u);
      const {
        value: f,
        isSecondary: g
      } = tv(i), p = d[0].startsWith("FontAwesome");
      let h = bi(l, f), y = h;
      if (p) {
        const w = pb(f);
        w.iconName && w.prefix && (h = w.iconName, l = w.prefix);
      }
      if (h && !g && (!a || a.getAttribute(di) !== l || a.getAttribute(pi) !== y)) {
        e.setAttribute(n, y), a && e.removeChild(a);
        const w = Hb(), {
          extra: x
        } = w;
        x.attributes[_a] = t, Ca(h, l).then((O) => {
          const b = vi(E(E({}, w), {}, {
            icons: {
              main: O,
              mask: sf()
            },
            prefix: l,
            iconName: y,
            extra: x,
            watchable: !0
          })), G = ve.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(G, e.firstChild) : e.appendChild(G), G.outerHTML = b.map((z) => or(z)).join(`
`), e.removeAttribute(n), r();
        }).catch(o);
      } else
        r();
    } else
      r();
  });
}
function rv(e) {
  return Promise.all([gl(e, "::before"), gl(e, "::after")]);
}
function ov(e) {
  return e.parentNode !== document.head && !~Wy.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(_a) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function yl(e) {
  if (mt)
    return new Promise((t, n) => {
      const r = mn(e.querySelectorAll("*")).filter(ov).map(rv), o = wi.begin("searchPseudoElements");
      df(), Promise.all(r).then(() => {
        o(), Ta(), t();
      }).catch(() => {
        o(), Ta(), n();
      });
    });
}
var av = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = yl, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = ve
      } = t;
      Y.searchPseudoElements && yl(n);
    };
  }
};
let bl = !1;
var iv = {
  mixout() {
    return {
      dom: {
        unwatch() {
          df(), bl = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        fl(Pa("mutationObserverCallbacks", {}));
      },
      noAuto() {
        Fb();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        bl ? Ta() : fl(Pa("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const vl = (e) => {
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
    let s = o.slice(1).join("-");
    if (a && s === "h")
      return n.flipX = !0, n;
    if (a && s === "v")
      return n.flipY = !0, n;
    if (s = parseFloat(s), isNaN(s))
      return n;
    switch (a) {
      case "grow":
        n.size = n.size + s;
        break;
      case "shrink":
        n.size = n.size - s;
        break;
      case "left":
        n.x = n.x - s;
        break;
      case "right":
        n.x = n.x + s;
        break;
      case "up":
        n.y = n.y - s;
        break;
      case "down":
        n.y = n.y + s;
        break;
      case "rotate":
        n.rotate = n.rotate + s;
        break;
    }
    return n;
  }, t);
};
var sv = {
  mixout() {
    return {
      parse: {
        transform: (e) => vl(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = vl(n)), e;
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
      const s = {
        transform: "translate(".concat(o / 2, " 256)")
      }, c = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), d = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), u = "rotate(".concat(r.rotate, " 0 0)"), m = {
        transform: "".concat(c, " ").concat(d, " ").concat(u)
      }, i = {
        transform: "translate(".concat(a / 2 * -1, " -256)")
      }, l = {
        outer: s,
        inner: m,
        path: i
      };
      return {
        tag: "g",
        attributes: E({}, l.outer),
        children: [{
          tag: "g",
          attributes: E({}, l.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: E(E({}, n.icon.attributes), l.path)
          }]
        }]
      };
    };
  }
};
const zo = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function wl(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function lv(e) {
  return e.tag === "g" ? e.children : [e];
}
var cv = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? Jr(n.split(" ").map((o) => o.trim())) : sf();
        return r.prefix || (r.prefix = jt()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        maskId: s,
        transform: c
      } = t;
      const {
        width: d,
        icon: u
      } = o, {
        width: m,
        icon: i
      } = a, l = tb({
        transform: c,
        containerWidth: m,
        iconWidth: d
      }), f = {
        tag: "rect",
        attributes: E(E({}, zo), {}, {
          fill: "white"
        })
      }, g = u.children ? {
        children: u.children.map(wl)
      } : {}, p = {
        tag: "g",
        attributes: E({}, l.inner),
        children: [wl(E({
          tag: u.tag,
          attributes: E(E({}, u.attributes), l.path)
        }, g))]
      }, h = {
        tag: "g",
        attributes: E({}, l.outer),
        children: [p]
      }, y = "mask-".concat(s || Gn()), w = "clip-".concat(s || Gn()), x = {
        tag: "mask",
        attributes: E(E({}, zo), {}, {
          id: y,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [f, h]
      }, O = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: w
          },
          children: lv(i)
        }, x]
      };
      return n.push(O, {
        tag: "rect",
        attributes: E({
          fill: "currentColor",
          "clip-path": "url(#".concat(w, ")"),
          mask: "url(#".concat(y, ")")
        }, zo)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, uv = {
  provides(e) {
    let t = !1;
    Tt.matchMedia && (t = Tt.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: E(E({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = E(E({}, o), {}, {
        attributeName: "opacity"
      }), s = {
        tag: "circle",
        attributes: E(E({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || s.children.push({
        tag: "animate",
        attributes: E(E({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: E(E({}, a), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(s), n.push({
        tag: "path",
        attributes: E(E({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: E(E({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: E(E({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: E(E({}, a), {}, {
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
}, fv = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, dv = [ob, Xb, Qb, Kb, Zb, av, iv, sv, cv, uv, fv];
_b(dv, {
  mixoutsTo: Te
});
Te.noAuto;
Te.config;
Te.library;
Te.dom;
const Ma = Te.parse;
Te.findIconDefinition;
Te.toHtml;
const pv = Te.icon;
Te.layer;
Te.text;
Te.counter;
function mv(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var br = { exports: {} }, Lo = { exports: {} }, de = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var xl;
function hv() {
  if (xl) return de;
  xl = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, s = e ? Symbol.for("react.provider") : 60109, c = e ? Symbol.for("react.context") : 60110, d = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, m = e ? Symbol.for("react.forward_ref") : 60112, i = e ? Symbol.for("react.suspense") : 60113, l = e ? Symbol.for("react.suspense_list") : 60120, f = e ? Symbol.for("react.memo") : 60115, g = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, h = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, w = e ? Symbol.for("react.scope") : 60119;
  function x(b) {
    if (typeof b == "object" && b !== null) {
      var G = b.$$typeof;
      switch (G) {
        case t:
          switch (b = b.type, b) {
            case d:
            case u:
            case r:
            case a:
            case o:
            case i:
              return b;
            default:
              switch (b = b && b.$$typeof, b) {
                case c:
                case m:
                case g:
                case f:
                case s:
                  return b;
                default:
                  return G;
              }
          }
        case n:
          return G;
      }
    }
  }
  function O(b) {
    return x(b) === u;
  }
  return de.AsyncMode = d, de.ConcurrentMode = u, de.ContextConsumer = c, de.ContextProvider = s, de.Element = t, de.ForwardRef = m, de.Fragment = r, de.Lazy = g, de.Memo = f, de.Portal = n, de.Profiler = a, de.StrictMode = o, de.Suspense = i, de.isAsyncMode = function(b) {
    return O(b) || x(b) === d;
  }, de.isConcurrentMode = O, de.isContextConsumer = function(b) {
    return x(b) === c;
  }, de.isContextProvider = function(b) {
    return x(b) === s;
  }, de.isElement = function(b) {
    return typeof b == "object" && b !== null && b.$$typeof === t;
  }, de.isForwardRef = function(b) {
    return x(b) === m;
  }, de.isFragment = function(b) {
    return x(b) === r;
  }, de.isLazy = function(b) {
    return x(b) === g;
  }, de.isMemo = function(b) {
    return x(b) === f;
  }, de.isPortal = function(b) {
    return x(b) === n;
  }, de.isProfiler = function(b) {
    return x(b) === a;
  }, de.isStrictMode = function(b) {
    return x(b) === o;
  }, de.isSuspense = function(b) {
    return x(b) === i;
  }, de.isValidElementType = function(b) {
    return typeof b == "string" || typeof b == "function" || b === r || b === u || b === a || b === o || b === i || b === l || typeof b == "object" && b !== null && (b.$$typeof === g || b.$$typeof === f || b.$$typeof === s || b.$$typeof === c || b.$$typeof === m || b.$$typeof === h || b.$$typeof === y || b.$$typeof === w || b.$$typeof === p);
  }, de.typeOf = x, de;
}
var me = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var _l;
function gv() {
  return _l || (_l = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, s = e ? Symbol.for("react.provider") : 60109, c = e ? Symbol.for("react.context") : 60110, d = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, m = e ? Symbol.for("react.forward_ref") : 60112, i = e ? Symbol.for("react.suspense") : 60113, l = e ? Symbol.for("react.suspense_list") : 60120, f = e ? Symbol.for("react.memo") : 60115, g = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, h = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, w = e ? Symbol.for("react.scope") : 60119;
    function x(A) {
      return typeof A == "string" || typeof A == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      A === r || A === u || A === a || A === o || A === i || A === l || typeof A == "object" && A !== null && (A.$$typeof === g || A.$$typeof === f || A.$$typeof === s || A.$$typeof === c || A.$$typeof === m || A.$$typeof === h || A.$$typeof === y || A.$$typeof === w || A.$$typeof === p);
    }
    function O(A) {
      if (typeof A == "object" && A !== null) {
        var xe = A.$$typeof;
        switch (xe) {
          case t:
            var Ae = A.type;
            switch (Ae) {
              case d:
              case u:
              case r:
              case a:
              case o:
              case i:
                return Ae;
              default:
                var tt = Ae && Ae.$$typeof;
                switch (tt) {
                  case c:
                  case m:
                  case g:
                  case f:
                  case s:
                    return tt;
                  default:
                    return xe;
                }
            }
          case n:
            return xe;
        }
      }
    }
    var b = d, G = u, z = c, K = s, H = t, ie = m, se = r, $ = g, ue = f, R = n, S = a, V = o, Z = i, q = !1;
    function ce(A) {
      return q || (q = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), v(A) || O(A) === d;
    }
    function v(A) {
      return O(A) === u;
    }
    function k(A) {
      return O(A) === c;
    }
    function C(A) {
      return O(A) === s;
    }
    function L(A) {
      return typeof A == "object" && A !== null && A.$$typeof === t;
    }
    function I(A) {
      return O(A) === m;
    }
    function D(A) {
      return O(A) === r;
    }
    function j(A) {
      return O(A) === g;
    }
    function T(A) {
      return O(A) === f;
    }
    function F(A) {
      return O(A) === n;
    }
    function M(A) {
      return O(A) === a;
    }
    function W(A) {
      return O(A) === o;
    }
    function re(A) {
      return O(A) === i;
    }
    me.AsyncMode = b, me.ConcurrentMode = G, me.ContextConsumer = z, me.ContextProvider = K, me.Element = H, me.ForwardRef = ie, me.Fragment = se, me.Lazy = $, me.Memo = ue, me.Portal = R, me.Profiler = S, me.StrictMode = V, me.Suspense = Z, me.isAsyncMode = ce, me.isConcurrentMode = v, me.isContextConsumer = k, me.isContextProvider = C, me.isElement = L, me.isForwardRef = I, me.isFragment = D, me.isLazy = j, me.isMemo = T, me.isPortal = F, me.isProfiler = M, me.isStrictMode = W, me.isSuspense = re, me.isValidElementType = x, me.typeOf = O;
  }()), me;
}
var kl;
function mf() {
  return kl || (kl = 1, process.env.NODE_ENV === "production" ? Lo.exports = hv() : Lo.exports = gv()), Lo.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Fo, Al;
function yv() {
  if (Al) return Fo;
  Al = 1;
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
      for (var s = {}, c = 0; c < 10; c++)
        s["_" + String.fromCharCode(c)] = c;
      var d = Object.getOwnPropertyNames(s).map(function(m) {
        return s[m];
      });
      if (d.join("") !== "0123456789")
        return !1;
      var u = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(m) {
        u[m] = m;
      }), Object.keys(Object.assign({}, u)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Fo = o() ? Object.assign : function(a, s) {
    for (var c, d = r(a), u, m = 1; m < arguments.length; m++) {
      c = Object(arguments[m]);
      for (var i in c)
        t.call(c, i) && (d[i] = c[i]);
      if (e) {
        u = e(c);
        for (var l = 0; l < u.length; l++)
          n.call(c, u[l]) && (d[u[l]] = c[u[l]]);
      }
    }
    return d;
  }, Fo;
}
var $o, Ol;
function _i() {
  if (Ol) return $o;
  Ol = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return $o = e, $o;
}
var Sl, Pl;
function hf() {
  return Pl || (Pl = 1, Sl = Function.call.bind(Object.prototype.hasOwnProperty)), Sl;
}
var Vo, El;
function bv() {
  if (El) return Vo;
  El = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ _i(), n = {}, r = /* @__PURE__ */ hf();
    e = function(a) {
      var s = "Warning: " + a;
      typeof console < "u" && console.error(s);
      try {
        throw new Error(s);
      } catch {
      }
    };
  }
  function o(a, s, c, d, u) {
    if (process.env.NODE_ENV !== "production") {
      for (var m in a)
        if (r(a, m)) {
          var i;
          try {
            if (typeof a[m] != "function") {
              var l = Error(
                (d || "React class") + ": " + c + " type `" + m + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[m] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw l.name = "Invariant Violation", l;
            }
            i = a[m](s, m, d, c, null, t);
          } catch (g) {
            i = g;
          }
          if (i && !(i instanceof Error) && e(
            (d || "React class") + ": type specification of " + c + " `" + m + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof i + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), i instanceof Error && !(i.message in n)) {
            n[i.message] = !0;
            var f = u ? u() : "";
            e(
              "Failed " + c + " type: " + i.message + (f ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, Vo = o, Vo;
}
var Wo, Nl;
function vv() {
  if (Nl) return Wo;
  Nl = 1;
  var e = mf(), t = yv(), n = /* @__PURE__ */ _i(), r = /* @__PURE__ */ hf(), o = /* @__PURE__ */ bv(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(c) {
    var d = "Warning: " + c;
    typeof console < "u" && console.error(d);
    try {
      throw new Error(d);
    } catch {
    }
  });
  function s() {
    return null;
  }
  return Wo = function(c, d) {
    var u = typeof Symbol == "function" && Symbol.iterator, m = "@@iterator";
    function i(v) {
      var k = v && (u && v[u] || v[m]);
      if (typeof k == "function")
        return k;
    }
    var l = "<<anonymous>>", f = {
      array: y("array"),
      bigint: y("bigint"),
      bool: y("boolean"),
      func: y("function"),
      number: y("number"),
      object: y("object"),
      string: y("string"),
      symbol: y("symbol"),
      any: w(),
      arrayOf: x,
      element: O(),
      elementType: b(),
      instanceOf: G,
      node: ie(),
      objectOf: K,
      oneOf: z,
      oneOfType: H,
      shape: $,
      exact: ue
    };
    function g(v, k) {
      return v === k ? v !== 0 || 1 / v === 1 / k : v !== v && k !== k;
    }
    function p(v, k) {
      this.message = v, this.data = k && typeof k == "object" ? k : {}, this.stack = "";
    }
    p.prototype = Error.prototype;
    function h(v) {
      if (process.env.NODE_ENV !== "production")
        var k = {}, C = 0;
      function L(D, j, T, F, M, W, re) {
        if (F = F || l, W = W || T, re !== n) {
          if (d) {
            var A = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw A.name = "Invariant Violation", A;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var xe = F + ":" + T;
            !k[xe] && // Avoid spamming the console because they are often not actionable except for lib authors
            C < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + W + "` prop on `" + F + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), k[xe] = !0, C++);
          }
        }
        return j[T] == null ? D ? j[T] === null ? new p("The " + M + " `" + W + "` is marked as required " + ("in `" + F + "`, but its value is `null`.")) : new p("The " + M + " `" + W + "` is marked as required in " + ("`" + F + "`, but its value is `undefined`.")) : null : v(j, T, F, M, W);
      }
      var I = L.bind(null, !1);
      return I.isRequired = L.bind(null, !0), I;
    }
    function y(v) {
      function k(C, L, I, D, j, T) {
        var F = C[L], M = V(F);
        if (M !== v) {
          var W = Z(F);
          return new p(
            "Invalid " + D + " `" + j + "` of type " + ("`" + W + "` supplied to `" + I + "`, expected ") + ("`" + v + "`."),
            { expectedType: v }
          );
        }
        return null;
      }
      return h(k);
    }
    function w() {
      return h(s);
    }
    function x(v) {
      function k(C, L, I, D, j) {
        if (typeof v != "function")
          return new p("Property `" + j + "` of component `" + I + "` has invalid PropType notation inside arrayOf.");
        var T = C[L];
        if (!Array.isArray(T)) {
          var F = V(T);
          return new p("Invalid " + D + " `" + j + "` of type " + ("`" + F + "` supplied to `" + I + "`, expected an array."));
        }
        for (var M = 0; M < T.length; M++) {
          var W = v(T, M, I, D, j + "[" + M + "]", n);
          if (W instanceof Error)
            return W;
        }
        return null;
      }
      return h(k);
    }
    function O() {
      function v(k, C, L, I, D) {
        var j = k[C];
        if (!c(j)) {
          var T = V(j);
          return new p("Invalid " + I + " `" + D + "` of type " + ("`" + T + "` supplied to `" + L + "`, expected a single ReactElement."));
        }
        return null;
      }
      return h(v);
    }
    function b() {
      function v(k, C, L, I, D) {
        var j = k[C];
        if (!e.isValidElementType(j)) {
          var T = V(j);
          return new p("Invalid " + I + " `" + D + "` of type " + ("`" + T + "` supplied to `" + L + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return h(v);
    }
    function G(v) {
      function k(C, L, I, D, j) {
        if (!(C[L] instanceof v)) {
          var T = v.name || l, F = ce(C[L]);
          return new p("Invalid " + D + " `" + j + "` of type " + ("`" + F + "` supplied to `" + I + "`, expected ") + ("instance of `" + T + "`."));
        }
        return null;
      }
      return h(k);
    }
    function z(v) {
      if (!Array.isArray(v))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), s;
      function k(C, L, I, D, j) {
        for (var T = C[L], F = 0; F < v.length; F++)
          if (g(T, v[F]))
            return null;
        var M = JSON.stringify(v, function(W, re) {
          var A = Z(re);
          return A === "symbol" ? String(re) : re;
        });
        return new p("Invalid " + D + " `" + j + "` of value `" + String(T) + "` " + ("supplied to `" + I + "`, expected one of " + M + "."));
      }
      return h(k);
    }
    function K(v) {
      function k(C, L, I, D, j) {
        if (typeof v != "function")
          return new p("Property `" + j + "` of component `" + I + "` has invalid PropType notation inside objectOf.");
        var T = C[L], F = V(T);
        if (F !== "object")
          return new p("Invalid " + D + " `" + j + "` of type " + ("`" + F + "` supplied to `" + I + "`, expected an object."));
        for (var M in T)
          if (r(T, M)) {
            var W = v(T, M, I, D, j + "." + M, n);
            if (W instanceof Error)
              return W;
          }
        return null;
      }
      return h(k);
    }
    function H(v) {
      if (!Array.isArray(v))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), s;
      for (var k = 0; k < v.length; k++) {
        var C = v[k];
        if (typeof C != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + q(C) + " at index " + k + "."
          ), s;
      }
      function L(I, D, j, T, F) {
        for (var M = [], W = 0; W < v.length; W++) {
          var re = v[W], A = re(I, D, j, T, F, n);
          if (A == null)
            return null;
          A.data && r(A.data, "expectedType") && M.push(A.data.expectedType);
        }
        var xe = M.length > 0 ? ", expected one of type [" + M.join(", ") + "]" : "";
        return new p("Invalid " + T + " `" + F + "` supplied to " + ("`" + j + "`" + xe + "."));
      }
      return h(L);
    }
    function ie() {
      function v(k, C, L, I, D) {
        return R(k[C]) ? null : new p("Invalid " + I + " `" + D + "` supplied to " + ("`" + L + "`, expected a ReactNode."));
      }
      return h(v);
    }
    function se(v, k, C, L, I) {
      return new p(
        (v || "React class") + ": " + k + " type `" + C + "." + L + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + I + "`."
      );
    }
    function $(v) {
      function k(C, L, I, D, j) {
        var T = C[L], F = V(T);
        if (F !== "object")
          return new p("Invalid " + D + " `" + j + "` of type `" + F + "` " + ("supplied to `" + I + "`, expected `object`."));
        for (var M in v) {
          var W = v[M];
          if (typeof W != "function")
            return se(I, D, j, M, Z(W));
          var re = W(T, M, I, D, j + "." + M, n);
          if (re)
            return re;
        }
        return null;
      }
      return h(k);
    }
    function ue(v) {
      function k(C, L, I, D, j) {
        var T = C[L], F = V(T);
        if (F !== "object")
          return new p("Invalid " + D + " `" + j + "` of type `" + F + "` " + ("supplied to `" + I + "`, expected `object`."));
        var M = t({}, C[L], v);
        for (var W in M) {
          var re = v[W];
          if (r(v, W) && typeof re != "function")
            return se(I, D, j, W, Z(re));
          if (!re)
            return new p(
              "Invalid " + D + " `" + j + "` key `" + W + "` supplied to `" + I + "`.\nBad object: " + JSON.stringify(C[L], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(v), null, "  ")
            );
          var A = re(T, W, I, D, j + "." + W, n);
          if (A)
            return A;
        }
        return null;
      }
      return h(k);
    }
    function R(v) {
      switch (typeof v) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !v;
        case "object":
          if (Array.isArray(v))
            return v.every(R);
          if (v === null || c(v))
            return !0;
          var k = i(v);
          if (k) {
            var C = k.call(v), L;
            if (k !== v.entries) {
              for (; !(L = C.next()).done; )
                if (!R(L.value))
                  return !1;
            } else
              for (; !(L = C.next()).done; ) {
                var I = L.value;
                if (I && !R(I[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function S(v, k) {
      return v === "symbol" ? !0 : k ? k["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && k instanceof Symbol : !1;
    }
    function V(v) {
      var k = typeof v;
      return Array.isArray(v) ? "array" : v instanceof RegExp ? "object" : S(k, v) ? "symbol" : k;
    }
    function Z(v) {
      if (typeof v > "u" || v === null)
        return "" + v;
      var k = V(v);
      if (k === "object") {
        if (v instanceof Date)
          return "date";
        if (v instanceof RegExp)
          return "regexp";
      }
      return k;
    }
    function q(v) {
      var k = Z(v);
      switch (k) {
        case "array":
        case "object":
          return "an " + k;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + k;
        default:
          return k;
      }
    }
    function ce(v) {
      return !v.constructor || !v.constructor.name ? l : v.constructor.name;
    }
    return f.checkPropTypes = o, f.resetWarningCache = o.resetWarningCache, f.PropTypes = f, f;
  }, Wo;
}
var Ho, Cl;
function wv() {
  if (Cl) return Ho;
  Cl = 1;
  var e = /* @__PURE__ */ _i();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, Ho = function() {
    function r(s, c, d, u, m, i) {
      if (i !== e) {
        var l = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw l.name = "Invariant Violation", l;
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
  }, Ho;
}
var Il;
function xv() {
  if (Il) return br.exports;
  if (Il = 1, process.env.NODE_ENV !== "production") {
    var e = mf(), t = !0;
    br.exports = /* @__PURE__ */ vv()(e.isElement, t);
  } else
    br.exports = /* @__PURE__ */ wv()();
  return br.exports;
}
var _v = /* @__PURE__ */ xv();
const ae = /* @__PURE__ */ mv(_v);
function Tl(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function Ue(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Tl(Object(n), !0).forEach(function(r) {
      Jt(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Tl(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Dr(e) {
  "@babel/helpers - typeof";
  return Dr = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Dr(e);
}
function Jt(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function kv(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), o, a;
  for (a = 0; a < r.length; a++)
    o = r[a], !(t.indexOf(o) >= 0) && (n[o] = e[o]);
  return n;
}
function Av(e, t) {
  if (e == null) return {};
  var n = kv(e, t), r, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      r = a[o], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Da(e) {
  return Ov(e) || Sv(e) || Pv(e) || Ev();
}
function Ov(e) {
  if (Array.isArray(e)) return Ra(e);
}
function Sv(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Pv(e, t) {
  if (e) {
    if (typeof e == "string") return Ra(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return Ra(e, t);
  }
}
function Ra(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function Ev() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Nv(e) {
  var t, n = e.beat, r = e.fade, o = e.beatFade, a = e.bounce, s = e.shake, c = e.flash, d = e.spin, u = e.spinPulse, m = e.spinReverse, i = e.pulse, l = e.fixedWidth, f = e.inverse, g = e.border, p = e.listItem, h = e.flip, y = e.size, w = e.rotation, x = e.pull, O = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": o,
    "fa-bounce": a,
    "fa-shake": s,
    "fa-flash": c,
    "fa-spin": d,
    "fa-spin-reverse": m,
    "fa-spin-pulse": u,
    "fa-pulse": i,
    "fa-fw": l,
    "fa-inverse": f,
    "fa-border": g,
    "fa-li": p,
    "fa-flip": h === !0,
    "fa-flip-horizontal": h === "horizontal" || h === "both",
    "fa-flip-vertical": h === "vertical" || h === "both"
  }, Jt(t, "fa-".concat(y), typeof y < "u" && y !== null), Jt(t, "fa-rotate-".concat(w), typeof w < "u" && w !== null && w !== 0), Jt(t, "fa-pull-".concat(x), typeof x < "u" && x !== null), Jt(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(O).map(function(b) {
    return O[b] ? b : null;
  }).filter(function(b) {
    return b;
  });
}
function Cv(e) {
  return e = e - 0, e === e;
}
function gf(e) {
  return Cv(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var Iv = ["style"];
function Tv(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function jv(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), o = gf(n.slice(0, r)), a = n.slice(r + 1).trim();
    return o.startsWith("webkit") ? t[Tv(o)] = a : t[o] = a, t;
  }, {});
}
function yf(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(d) {
    return yf(e, d);
  }), o = Object.keys(t.attributes || {}).reduce(function(d, u) {
    var m = t.attributes[u];
    switch (u) {
      case "class":
        d.attrs.className = m, delete t.attributes.class;
        break;
      case "style":
        d.attrs.style = jv(m);
        break;
      default:
        u.indexOf("aria-") === 0 || u.indexOf("data-") === 0 ? d.attrs[u.toLowerCase()] = m : d.attrs[gf(u)] = m;
    }
    return d;
  }, {
    attrs: {}
  }), a = n.style, s = a === void 0 ? {} : a, c = Av(n, Iv);
  return o.attrs.style = Ue(Ue({}, o.attrs.style), s), e.apply(void 0, [t.tag, Ue(Ue({}, o.attrs), c)].concat(Da(r)));
}
var bf = !1;
try {
  bf = process.env.NODE_ENV === "production";
} catch {
}
function Mv() {
  if (!bf && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function jl(e) {
  if (e && Dr(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Ma.icon)
    return Ma.icon(e);
  if (e === null)
    return null;
  if (e && Dr(e) === "object" && e.prefix && e.iconName)
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
function Bo(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Jt({}, e, t) : {};
}
var Ml = {
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
}, ki = /* @__PURE__ */ Vr.forwardRef(function(e, t) {
  var n = Ue(Ue({}, Ml), e), r = n.icon, o = n.mask, a = n.symbol, s = n.className, c = n.title, d = n.titleId, u = n.maskId, m = jl(r), i = Bo("classes", [].concat(Da(Nv(n)), Da((s || "").split(" ")))), l = Bo("transform", typeof n.transform == "string" ? Ma.transform(n.transform) : n.transform), f = Bo("mask", jl(o)), g = pv(m, Ue(Ue(Ue(Ue({}, i), l), f), {}, {
    symbol: a,
    title: c,
    titleId: d,
    maskId: u
  }));
  if (!g)
    return Mv("Could not find icon", m), null;
  var p = g.abstract, h = {
    ref: t
  };
  return Object.keys(n).forEach(function(y) {
    Ml.hasOwnProperty(y) || (h[y] = n[y]);
  }), Dv(p[0], h);
});
ki.displayName = "FontAwesomeIcon";
ki.propTypes = {
  beat: ae.bool,
  border: ae.bool,
  beatFade: ae.bool,
  bounce: ae.bool,
  className: ae.string,
  fade: ae.bool,
  flash: ae.bool,
  mask: ae.oneOfType([ae.object, ae.array, ae.string]),
  maskId: ae.string,
  fixedWidth: ae.bool,
  inverse: ae.bool,
  flip: ae.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: ae.oneOfType([ae.object, ae.array, ae.string]),
  listItem: ae.bool,
  pull: ae.oneOf(["right", "left"]),
  pulse: ae.bool,
  rotation: ae.oneOf([0, 90, 180, 270]),
  shake: ae.bool,
  size: ae.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: ae.bool,
  spinPulse: ae.bool,
  spinReverse: ae.bool,
  symbol: ae.oneOfType([ae.bool, ae.string]),
  title: ae.string,
  titleId: ae.string,
  transform: ae.oneOfType([ae.string, ae.object]),
  swapOpacity: ae.bool
};
var Dv = yf.bind(null, Vr.createElement);
const Ai = "-", Rv = (e) => {
  const t = Lv(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(Ai);
      return a[0] === "" && a.length !== 1 && a.shift(), vf(a, t) || zv(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const s = n[o] || [];
      return a && r[o] ? [...s, ...r[o]] : s;
    }
  };
}, vf = (e, t) => {
  var n;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], o = t.nextPart.get(r), a = o ? vf(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const s = e.join(Ai);
  return (n = t.validators.find(({
    validator: c
  }) => c(s))) == null ? void 0 : n.classGroupId;
}, Dl = /^\[(.+)\]$/, zv = (e) => {
  if (Dl.test(e)) {
    const t = Dl.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, Lv = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return $v(Object.entries(e.classGroups), n).forEach(([o, a]) => {
    za(a, r, o, t);
  }), r;
}, za = (e, t, n, r) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : Rl(t, o);
      a.classGroupId = n;
      return;
    }
    if (typeof o == "function") {
      if (Fv(o)) {
        za(o(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: n
      });
      return;
    }
    Object.entries(o).forEach(([a, s]) => {
      za(s, Rl(t, a), n, r);
    });
  });
}, Rl = (e, t) => {
  let n = e;
  return t.split(Ai).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, Fv = (e) => e.isThemeGetter, $v = (e, t) => t ? e.map(([n, r]) => {
  const o = r.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([s, c]) => [t + s, c])) : a);
  return [n, o];
}) : e, Vv = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const o = (a, s) => {
    n.set(a, s), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let s = n.get(a);
      if (s !== void 0)
        return s;
      if ((s = r.get(a)) !== void 0)
        return o(a, s), s;
    },
    set(a, s) {
      n.has(a) ? n.set(a, s) : o(a, s);
    }
  };
}, wf = "!", Wv = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, o = t[0], a = t.length, s = (c) => {
    const d = [];
    let u = 0, m = 0, i;
    for (let h = 0; h < c.length; h++) {
      let y = c[h];
      if (u === 0) {
        if (y === o && (r || c.slice(h, h + a) === t)) {
          d.push(c.slice(m, h)), m = h + a;
          continue;
        }
        if (y === "/") {
          i = h;
          continue;
        }
      }
      y === "[" ? u++ : y === "]" && u--;
    }
    const l = d.length === 0 ? c : c.substring(m), f = l.startsWith(wf), g = f ? l.substring(1) : l, p = i && i > m ? i - m : void 0;
    return {
      modifiers: d,
      hasImportantModifier: f,
      baseClassName: g,
      maybePostfixModifierPosition: p
    };
  };
  return n ? (c) => n({
    className: c,
    parseClassName: s
  }) : s;
}, Hv = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, Bv = (e) => ({
  cache: Vv(e.cacheSize),
  parseClassName: Wv(e),
  ...Rv(e)
}), Gv = /\s+/, Uv = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: o
  } = t, a = [], s = e.trim().split(Gv);
  let c = "";
  for (let d = s.length - 1; d >= 0; d -= 1) {
    const u = s[d], {
      modifiers: m,
      hasImportantModifier: i,
      baseClassName: l,
      maybePostfixModifierPosition: f
    } = n(u);
    let g = !!f, p = r(g ? l.substring(0, f) : l);
    if (!p) {
      if (!g) {
        c = u + (c.length > 0 ? " " + c : c);
        continue;
      }
      if (p = r(l), !p) {
        c = u + (c.length > 0 ? " " + c : c);
        continue;
      }
      g = !1;
    }
    const h = Hv(m).join(":"), y = i ? h + wf : h, w = y + p;
    if (a.includes(w))
      continue;
    a.push(w);
    const x = o(p, g);
    for (let O = 0; O < x.length; ++O) {
      const b = x[O];
      a.push(y + b);
    }
    c = u + (c.length > 0 ? " " + c : c);
  }
  return c;
};
function Yv() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = xf(t)) && (r && (r += " "), r += n);
  return r;
}
const xf = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = xf(e[r])) && (n && (n += " "), n += t);
  return n;
};
function qv(e, ...t) {
  let n, r, o, a = s;
  function s(d) {
    const u = t.reduce((m, i) => i(m), e());
    return n = Bv(u), r = n.cache.get, o = n.cache.set, a = c, c(d);
  }
  function c(d) {
    const u = r(d);
    if (u)
      return u;
    const m = Uv(d, n);
    return o(d, m), m;
  }
  return function() {
    return a(Yv.apply(null, arguments));
  };
}
const ye = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, _f = /^\[(?:([a-z-]+):)?(.+)\]$/i, Xv = /^\d+\/\d+$/, Qv = /* @__PURE__ */ new Set(["px", "full", "screen"]), Kv = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Zv = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Jv = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, e0 = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, t0 = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, rt = (e) => an(e) || Qv.has(e) || Xv.test(e), vt = (e) => hn(e, "length", c0), an = (e) => !!e && !Number.isNaN(Number(e)), Go = (e) => hn(e, "number", an), vn = (e) => !!e && Number.isInteger(Number(e)), n0 = (e) => e.endsWith("%") && an(e.slice(0, -1)), te = (e) => _f.test(e), wt = (e) => Kv.test(e), r0 = /* @__PURE__ */ new Set(["length", "size", "percentage"]), o0 = (e) => hn(e, r0, kf), a0 = (e) => hn(e, "position", kf), i0 = /* @__PURE__ */ new Set(["image", "url"]), s0 = (e) => hn(e, i0, f0), l0 = (e) => hn(e, "", u0), wn = () => !0, hn = (e, t, n) => {
  const r = _f.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, c0 = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  Zv.test(e) && !Jv.test(e)
), kf = () => !1, u0 = (e) => e0.test(e), f0 = (e) => t0.test(e), d0 = () => {
  const e = ye("colors"), t = ye("spacing"), n = ye("blur"), r = ye("brightness"), o = ye("borderColor"), a = ye("borderRadius"), s = ye("borderSpacing"), c = ye("borderWidth"), d = ye("contrast"), u = ye("grayscale"), m = ye("hueRotate"), i = ye("invert"), l = ye("gap"), f = ye("gradientColorStops"), g = ye("gradientColorStopPositions"), p = ye("inset"), h = ye("margin"), y = ye("opacity"), w = ye("padding"), x = ye("saturate"), O = ye("scale"), b = ye("sepia"), G = ye("skew"), z = ye("space"), K = ye("translate"), H = () => ["auto", "contain", "none"], ie = () => ["auto", "hidden", "clip", "visible", "scroll"], se = () => ["auto", te, t], $ = () => [te, t], ue = () => ["", rt, vt], R = () => ["auto", an, te], S = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], V = () => ["solid", "dashed", "dotted", "double", "none"], Z = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], q = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], ce = () => ["", "0", te], v = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], k = () => [an, te];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [wn],
      spacing: [rt, vt],
      blur: ["none", "", wt, te],
      brightness: k(),
      borderColor: [e],
      borderRadius: ["none", "", "full", wt, te],
      borderSpacing: $(),
      borderWidth: ue(),
      contrast: k(),
      grayscale: ce(),
      hueRotate: k(),
      invert: ce(),
      gap: $(),
      gradientColorStops: [e],
      gradientColorStopPositions: [n0, vt],
      inset: se(),
      margin: se(),
      opacity: k(),
      padding: $(),
      saturate: k(),
      scale: k(),
      sepia: ce(),
      skew: k(),
      space: $(),
      translate: $()
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
        columns: [wt]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": v()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": v()
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
        object: [...S(), te]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: ie()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": ie()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": ie()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: H()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": H()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": H()
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
        z: ["auto", vn, te]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: se()
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
        grow: ce()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: ce()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", vn, te]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [wn]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", vn, te]
        }, te]
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
        "grid-rows": [wn]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [vn, te]
        }, te]
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
        gap: [l]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [l]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [l]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...q()]
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
        content: ["normal", ...q(), "baseline"]
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
        "place-content": [...q(), "baseline"]
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
        "space-x": [z]
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
        "space-y": [z]
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
          screen: [wt]
        }, wt]
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
        text: ["base", wt, vt]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Go]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [wn]
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
        "line-clamp": ["none", an, Go]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", rt, te]
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
        decoration: [...V(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", rt, vt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", rt, te]
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
        indent: $()
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
        bg: [...S(), a0]
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
        bg: ["auto", "cover", "contain", o0]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, s0]
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
        from: [g]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [g]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [g]
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
        border: [c]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [c]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [c]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [c]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [c]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [c]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [c]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [c]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [c]
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
        border: [...V(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [c]
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
        "divide-y": [c]
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
        divide: V()
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
        outline: ["", ...V()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [rt, te]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [rt, vt]
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
        ring: ue()
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
        "ring-offset": [rt, vt]
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
        shadow: ["", "inner", "none", wt, l0]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [wn]
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
        "mix-blend": [...Z(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": Z()
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
        contrast: [d]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", wt, te]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [u]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [m]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [i]
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
        sepia: [b]
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
        "backdrop-contrast": [d]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [u]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [m]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [i]
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
        "backdrop-saturate": [x]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [b]
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
        "border-spacing": [s]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [s]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [s]
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
        duration: k()
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
        delay: k()
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
        rotate: [vn, te]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [K]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [K]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [G]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [G]
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
        "scroll-m": $()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": $()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": $()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": $()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": $()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": $()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": $()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": $()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": $()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": $()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": $()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": $()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": $()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": $()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": $()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": $()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": $()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": $()
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
        stroke: [rt, vt, Go]
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
}, p0 = /* @__PURE__ */ qv(d0), m0 = ({
  onClick: e,
  className: t,
  size: n = "md"
}) => /* @__PURE__ */ B(
  "button",
  {
    onClick: e,
    className: p0(
      "flex items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white",
      {
        sm: "h-5 w-5 text-sm",
        md: "h-7 w-7 text-md",
        lg: "h-9 w-9 text-xl"
      }[n],
      t
    ),
    children: /* @__PURE__ */ B(ki, { icon: dy })
  }
);
var Oi = ir(), J = (e) => ar(e, Oi), Si = ir();
J.write = (e) => ar(e, Si);
var to = ir();
J.onStart = (e) => ar(e, to);
var Pi = ir();
J.onFrame = (e) => ar(e, Pi);
var Ei = ir();
J.onFinish = (e) => ar(e, Ei);
var sn = [];
J.setTimeout = (e, t) => {
  const n = J.now() + t, r = () => {
    const a = sn.findIndex((s) => s.cancel == r);
    ~a && sn.splice(a, 1), St -= ~a ? 1 : 0;
  }, o = { time: n, handler: e, cancel: r };
  return sn.splice(Af(n), 0, o), St += 1, Of(), o;
};
var Af = (e) => ~(~sn.findIndex((t) => t.time > e) || ~sn.length);
J.cancel = (e) => {
  to.delete(e), Pi.delete(e), Ei.delete(e), Oi.delete(e), Si.delete(e);
};
J.sync = (e) => {
  La = !0, J.batchedUpdates(e), La = !1;
};
J.throttle = (e) => {
  let t;
  function n() {
    try {
      e(...t);
    } finally {
      t = null;
    }
  }
  function r(...o) {
    t = o, J.onStart(n);
  }
  return r.handler = e, r.cancel = () => {
    to.delete(n), t = null;
  }, r;
};
var Ni = typeof window < "u" ? window.requestAnimationFrame : (
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  () => {
  }
);
J.use = (e) => Ni = e;
J.now = typeof performance < "u" ? () => performance.now() : Date.now;
J.batchedUpdates = (e) => e();
J.catch = console.error;
J.frameLoop = "always";
J.advance = () => {
  J.frameLoop !== "demand" ? console.warn(
    "Cannot call the manual advancement of rafz whilst frameLoop is not set as demand"
  ) : Pf();
};
var Ot = -1, St = 0, La = !1;
function ar(e, t) {
  La ? (t.delete(e), e(0)) : (t.add(e), Of());
}
function Of() {
  Ot < 0 && (Ot = 0, J.frameLoop !== "demand" && Ni(Sf));
}
function h0() {
  Ot = -1;
}
function Sf() {
  ~Ot && (Ni(Sf), J.batchedUpdates(Pf));
}
function Pf() {
  const e = Ot;
  Ot = J.now();
  const t = Af(Ot);
  if (t && (Ef(sn.splice(0, t), (n) => n.handler()), St -= t), !St) {
    h0();
    return;
  }
  to.flush(), Oi.flush(e ? Math.min(64, Ot - e) : 16.667), Pi.flush(), Si.flush(), Ei.flush();
}
function ir() {
  let e = /* @__PURE__ */ new Set(), t = e;
  return {
    add(n) {
      St += t == e && !e.has(n) ? 1 : 0, e.add(n);
    },
    delete(n) {
      return St -= t == e && e.has(n) ? 1 : 0, e.delete(n);
    },
    flush(n) {
      t.size && (e = /* @__PURE__ */ new Set(), St -= t.size, Ef(t, (r) => r(n) && e.add(r)), St += e.size, t = e);
    }
  };
}
function Ef(e, t) {
  e.forEach((n) => {
    try {
      t(n);
    } catch (r) {
      J.catch(r);
    }
  });
}
var g0 = Object.defineProperty, y0 = (e, t) => {
  for (var n in t)
    g0(e, n, { get: t[n], enumerable: !0 });
}, Ve = {};
y0(Ve, {
  assign: () => v0,
  colors: () => Et,
  createStringInterpolator: () => Ii,
  skipAnimation: () => Cf,
  to: () => Nf,
  willAdvance: () => Ti
});
function Fa() {
}
var b0 = (e, t, n) => Object.defineProperty(e, t, { value: n, writable: !0, configurable: !0 }), N = {
  arr: Array.isArray,
  obj: (e) => !!e && e.constructor.name === "Object",
  fun: (e) => typeof e == "function",
  str: (e) => typeof e == "string",
  num: (e) => typeof e == "number",
  und: (e) => e === void 0
};
function it(e, t) {
  if (N.arr(e)) {
    if (!N.arr(t) || e.length !== t.length) return !1;
    for (let n = 0; n < e.length; n++)
      if (e[n] !== t[n]) return !1;
    return !0;
  }
  return e === t;
}
var ne = (e, t) => e.forEach(t);
function Je(e, t, n) {
  if (N.arr(e)) {
    for (let r = 0; r < e.length; r++)
      t.call(n, e[r], `${r}`);
    return;
  }
  for (const r in e)
    e.hasOwnProperty(r) && t.call(n, e[r], r);
}
var Ee = (e) => N.und(e) ? [] : N.arr(e) ? e : [e];
function Dn(e, t) {
  if (e.size) {
    const n = Array.from(e);
    e.clear(), ne(n, t);
  }
}
var En = (e, ...t) => Dn(e, (n) => n(...t)), Ci = () => typeof window > "u" || !window.navigator || /ServerSideRendering|^Deno\//.test(window.navigator.userAgent), Ii, Nf, Et = null, Cf = !1, Ti = Fa, v0 = (e) => {
  e.to && (Nf = e.to), e.now && (J.now = e.now), e.colors !== void 0 && (Et = e.colors), e.skipAnimation != null && (Cf = e.skipAnimation), e.createStringInterpolator && (Ii = e.createStringInterpolator), e.requestAnimationFrame && J.use(e.requestAnimationFrame), e.batchedUpdates && (J.batchedUpdates = e.batchedUpdates), e.willAdvance && (Ti = e.willAdvance), e.frameLoop && (J.frameLoop = e.frameLoop);
}, Rn = /* @__PURE__ */ new Set(), Le = [], Uo = [], Rr = 0, no = {
  get idle() {
    return !Rn.size && !Le.length;
  },
  /** Advance the given animation on every frame until idle. */
  start(e) {
    Rr > e.priority ? (Rn.add(e), J.onStart(w0)) : (If(e), J($a));
  },
  /** Advance all animations by the given time. */
  advance: $a,
  /** Call this when an animation's priority changes. */
  sort(e) {
    if (Rr)
      J.onFrame(() => no.sort(e));
    else {
      const t = Le.indexOf(e);
      ~t && (Le.splice(t, 1), Tf(e));
    }
  },
  /**
   * Clear all animations. For testing purposes.
   *
   * ☠️ Never call this from within the frameloop.
   */
  clear() {
    Le = [], Rn.clear();
  }
};
function w0() {
  Rn.forEach(If), Rn.clear(), J($a);
}
function If(e) {
  Le.includes(e) || Tf(e);
}
function Tf(e) {
  Le.splice(
    x0(Le, (t) => t.priority > e.priority),
    0,
    e
  );
}
function $a(e) {
  const t = Uo;
  for (let n = 0; n < Le.length; n++) {
    const r = Le[n];
    Rr = r.priority, r.idle || (Ti(r), r.advance(e), r.idle || t.push(r));
  }
  return Rr = 0, Uo = Le, Uo.length = 0, Le = t, Le.length > 0;
}
function x0(e, t) {
  const n = e.findIndex(t);
  return n < 0 ? e.length : n;
}
var _0 = {
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
}, $e = "[-+]?\\d*\\.?\\d+", zr = $e + "%";
function ro(...e) {
  return "\\(\\s*(" + e.join(")\\s*,\\s*(") + ")\\s*\\)";
}
var k0 = new RegExp("rgb" + ro($e, $e, $e)), A0 = new RegExp("rgba" + ro($e, $e, $e, $e)), O0 = new RegExp("hsl" + ro($e, zr, zr)), S0 = new RegExp(
  "hsla" + ro($e, zr, zr, $e)
), P0 = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/, E0 = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/, N0 = /^#([0-9a-fA-F]{6})$/, C0 = /^#([0-9a-fA-F]{8})$/;
function I0(e) {
  let t;
  return typeof e == "number" ? e >>> 0 === e && e >= 0 && e <= 4294967295 ? e : null : (t = N0.exec(e)) ? parseInt(t[1] + "ff", 16) >>> 0 : Et && Et[e] !== void 0 ? Et[e] : (t = k0.exec(e)) ? (Xt(t[1]) << 24 | // r
  Xt(t[2]) << 16 | // g
  Xt(t[3]) << 8 | // b
  255) >>> // a
  0 : (t = A0.exec(e)) ? (Xt(t[1]) << 24 | // r
  Xt(t[2]) << 16 | // g
  Xt(t[3]) << 8 | // b
  Fl(t[4])) >>> // a
  0 : (t = P0.exec(e)) ? parseInt(
    t[1] + t[1] + // r
    t[2] + t[2] + // g
    t[3] + t[3] + // b
    "ff",
    // a
    16
  ) >>> 0 : (t = C0.exec(e)) ? parseInt(t[1], 16) >>> 0 : (t = E0.exec(e)) ? parseInt(
    t[1] + t[1] + // r
    t[2] + t[2] + // g
    t[3] + t[3] + // b
    t[4] + t[4],
    // a
    16
  ) >>> 0 : (t = O0.exec(e)) ? (zl(
    Ll(t[1]),
    // h
    vr(t[2]),
    // s
    vr(t[3])
    // l
  ) | 255) >>> // a
  0 : (t = S0.exec(e)) ? (zl(
    Ll(t[1]),
    // h
    vr(t[2]),
    // s
    vr(t[3])
    // l
  ) | Fl(t[4])) >>> // a
  0 : null;
}
function Yo(e, t, n) {
  return n < 0 && (n += 1), n > 1 && (n -= 1), n < 1 / 6 ? e + (t - e) * 6 * n : n < 1 / 2 ? t : n < 2 / 3 ? e + (t - e) * (2 / 3 - n) * 6 : e;
}
function zl(e, t, n) {
  const r = n < 0.5 ? n * (1 + t) : n + t - n * t, o = 2 * n - r, a = Yo(o, r, e + 1 / 3), s = Yo(o, r, e), c = Yo(o, r, e - 1 / 3);
  return Math.round(a * 255) << 24 | Math.round(s * 255) << 16 | Math.round(c * 255) << 8;
}
function Xt(e) {
  const t = parseInt(e, 10);
  return t < 0 ? 0 : t > 255 ? 255 : t;
}
function Ll(e) {
  return (parseFloat(e) % 360 + 360) % 360 / 360;
}
function Fl(e) {
  const t = parseFloat(e);
  return t < 0 ? 0 : t > 1 ? 255 : Math.round(t * 255);
}
function vr(e) {
  const t = parseFloat(e);
  return t < 0 ? 0 : t > 100 ? 1 : t / 100;
}
function $l(e) {
  let t = I0(e);
  if (t === null) return e;
  t = t || 0;
  const n = (t & 4278190080) >>> 24, r = (t & 16711680) >>> 16, o = (t & 65280) >>> 8, a = (t & 255) / 255;
  return `rgba(${n}, ${r}, ${o}, ${a})`;
}
var Yn = (e, t, n) => {
  if (N.fun(e))
    return e;
  if (N.arr(e))
    return Yn({
      range: e,
      output: t,
      extrapolate: n
    });
  if (N.str(e.output[0]))
    return Ii(e);
  const r = e, o = r.output, a = r.range || [0, 1], s = r.extrapolateLeft || r.extrapolate || "extend", c = r.extrapolateRight || r.extrapolate || "extend", d = r.easing || ((u) => u);
  return (u) => {
    const m = j0(u, a);
    return T0(
      u,
      a[m],
      a[m + 1],
      o[m],
      o[m + 1],
      d,
      s,
      c,
      r.map
    );
  };
};
function T0(e, t, n, r, o, a, s, c, d) {
  let u = d ? d(e) : e;
  if (u < t) {
    if (s === "identity") return u;
    s === "clamp" && (u = t);
  }
  if (u > n) {
    if (c === "identity") return u;
    c === "clamp" && (u = n);
  }
  return r === o ? r : t === n ? e <= t ? r : o : (t === -1 / 0 ? u = -u : n === 1 / 0 ? u = u - t : u = (u - t) / (n - t), u = a(u), r === -1 / 0 ? u = -u : o === 1 / 0 ? u = u + r : u = u * (o - r) + r, u);
}
function j0(e, t) {
  for (var n = 1; n < t.length - 1 && !(t[n] >= e); ++n)
    ;
  return n - 1;
}
var M0 = {
  linear: (e) => e
}, qn = Symbol.for("FluidValue.get"), fn = Symbol.for("FluidValue.observers"), ze = (e) => !!(e && e[qn]), Ne = (e) => e && e[qn] ? e[qn]() : e, Vl = (e) => e[fn] || null;
function D0(e, t) {
  e.eventObserved ? e.eventObserved(t) : e(t);
}
function Xn(e, t) {
  const n = e[fn];
  n && n.forEach((r) => {
    D0(r, t);
  });
}
var jf = class {
  constructor(e) {
    if (!e && !(e = this.get))
      throw Error("Unknown getter");
    R0(this, e);
  }
}, R0 = (e, t) => Mf(e, qn, t);
function gn(e, t) {
  if (e[qn]) {
    let n = e[fn];
    n || Mf(e, fn, n = /* @__PURE__ */ new Set()), n.has(t) || (n.add(t), e.observerAdded && e.observerAdded(n.size, t));
  }
  return t;
}
function Qn(e, t) {
  const n = e[fn];
  if (n && n.has(t)) {
    const r = n.size - 1;
    r ? n.delete(t) : e[fn] = null, e.observerRemoved && e.observerRemoved(r, t);
  }
}
var Mf = (e, t, n) => Object.defineProperty(e, t, {
  value: n,
  writable: !0,
  configurable: !0
}), Sr = /[+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, z0 = /(#(?:[0-9a-f]{2}){2,4}|(#[0-9a-f]{3})|(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\))/gi, Wl = new RegExp(`(${Sr.source})(%|[a-z]+)`, "i"), L0 = /rgba\(([0-9\.-]+), ([0-9\.-]+), ([0-9\.-]+), ([0-9\.-]+)\)/gi, oo = /var\((--[a-zA-Z0-9-_]+),? ?([a-zA-Z0-9 ()%#.,-]+)?\)/, Df = (e) => {
  const [t, n] = F0(e);
  if (!t || Ci())
    return e;
  const r = window.getComputedStyle(document.documentElement).getPropertyValue(t);
  return r ? r.trim() : n && n.startsWith("--") ? window.getComputedStyle(document.documentElement).getPropertyValue(n) || e : n && oo.test(n) ? Df(n) : n || e;
}, F0 = (e) => {
  const t = oo.exec(e);
  if (!t) return [,];
  const [, n, r] = t;
  return [n, r];
}, qo, $0 = (e, t, n, r, o) => `rgba(${Math.round(t)}, ${Math.round(n)}, ${Math.round(r)}, ${o})`, Rf = (e) => {
  qo || (qo = Et ? (
    // match color names, ignore partial matches
    new RegExp(`(${Object.keys(Et).join("|")})(?!\\w)`, "g")
  ) : (
    // never match
    /^\b$/
  ));
  const t = e.output.map((o) => Ne(o).replace(oo, Df).replace(z0, $l).replace(qo, $l)), n = t.map((o) => o.match(Sr).map(Number)), r = n[0].map(
    (o, a) => n.map((s) => {
      if (!(a in s))
        throw Error('The arity of each "output" value must be equal');
      return s[a];
    })
  ).map(
    (o) => Yn({ ...e, output: o })
  );
  return (o) => {
    var a;
    const s = !Wl.test(t[0]) && ((a = t.find((d) => Wl.test(d))) == null ? void 0 : a.replace(Sr, ""));
    let c = 0;
    return t[0].replace(
      Sr,
      () => `${r[c++](o)}${s || ""}`
    ).replace(L0, $0);
  };
}, ji = "react-spring: ", zf = (e) => {
  const t = e;
  let n = !1;
  if (typeof t != "function")
    throw new TypeError(`${ji}once requires a function parameter`);
  return (...r) => {
    n || (t(...r), n = !0);
  };
}, V0 = zf(console.warn);
function W0() {
  V0(
    `${ji}The "interpolate" function is deprecated in v9 (use "to" instead)`
  );
}
var H0 = zf(console.warn);
function B0() {
  H0(
    `${ji}Directly calling start instead of using the api object is deprecated in v9 (use ".start" instead), this will be removed in later 0.X.0 versions`
  );
}
function ao(e) {
  return N.str(e) && (e[0] == "#" || /\d/.test(e) || // Do not identify a CSS variable as an AnimatedString if its SSR
  !Ci() && oo.test(e) || e in (Et || {}));
}
var en = Ci() ? Oe : _d, G0 = () => {
  const e = ke(!1);
  return en(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
};
function Lf() {
  const e = Be()[1], t = G0();
  return () => {
    t.current && e(Math.random());
  };
}
var Ff = (e) => Oe(e, U0), U0 = [];
function Y0(e) {
  const t = ke(void 0);
  return Oe(() => {
    t.current = e;
  }), t.current;
}
var Kn = Symbol.for("Animated:node"), q0 = (e) => !!e && e[Kn] === e, He = (e) => e && e[Kn], Mi = (e, t) => b0(e, Kn, t), io = (e) => e && e[Kn] && e[Kn].getPayload(), $f = class {
  constructor() {
    Mi(this, this);
  }
  /** Get every `AnimatedValue` used by this node. */
  getPayload() {
    return this.payload || [];
  }
}, so = class Vf extends $f {
  constructor(t) {
    super(), this._value = t, this.done = !0, this.durationProgress = 0, N.num(this._value) && (this.lastPosition = this._value);
  }
  /** @internal */
  static create(t) {
    return new Vf(t);
  }
  getPayload() {
    return [this];
  }
  getValue() {
    return this._value;
  }
  setValue(t, n) {
    return N.num(t) && (this.lastPosition = t, n && (t = Math.round(t / n) * n, this.done && (this.lastPosition = t))), this._value === t ? !1 : (this._value = t, !0);
  }
  reset() {
    const { done: t } = this;
    this.done = !1, N.num(this._value) && (this.elapsedTime = 0, this.durationProgress = 0, this.lastPosition = this._value, t && (this.lastVelocity = null), this.v0 = null);
  }
}, Lr = class Wf extends so {
  constructor(t) {
    super(0), this._string = null, this._toString = Yn({
      output: [t, t]
    });
  }
  /** @internal */
  static create(t) {
    return new Wf(t);
  }
  getValue() {
    return this._string ?? (this._string = this._toString(this._value));
  }
  setValue(t) {
    if (N.str(t)) {
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
    t && (this._toString = Yn({
      output: [this.getValue(), t]
    })), this._value = 0, super.reset();
  }
}, Fr = { dependencies: null }, lo = class extends $f {
  constructor(e) {
    super(), this.source = e, this.setValue(e);
  }
  getValue(e) {
    const t = {};
    return Je(this.source, (n, r) => {
      q0(n) ? t[r] = n.getValue(e) : ze(n) ? t[r] = Ne(n) : e || (t[r] = n);
    }), t;
  }
  /** Replace the raw object data */
  setValue(e) {
    this.source = e, this.payload = this._makePayload(e);
  }
  reset() {
    this.payload && ne(this.payload, (e) => e.reset());
  }
  /** Create a payload set. */
  _makePayload(e) {
    if (e) {
      const t = /* @__PURE__ */ new Set();
      return Je(e, this._addToPayload, t), Array.from(t);
    }
  }
  /** Add to a payload set. */
  _addToPayload(e) {
    Fr.dependencies && ze(e) && Fr.dependencies.add(e);
    const t = io(e);
    t && ne(t, (n) => this.add(n));
  }
}, X0 = class Hf extends lo {
  constructor(t) {
    super(t);
  }
  /** @internal */
  static create(t) {
    return new Hf(t);
  }
  getValue() {
    return this.source.map((t) => t.getValue());
  }
  setValue(t) {
    const n = this.getPayload();
    return t.length == n.length ? n.map((r, o) => r.setValue(t[o])).some(Boolean) : (super.setValue(t.map(Q0)), !0);
  }
};
function Q0(e) {
  return (ao(e) ? Lr : so).create(e);
}
function Va(e) {
  const t = He(e);
  return t ? t.constructor : N.arr(e) ? X0 : ao(e) ? Lr : so;
}
var Hl = (e, t) => {
  const n = (
    // Function components must use "forwardRef" to avoid being
    // re-rendered on every animation frame.
    !N.fun(e) || e.prototype && e.prototype.isReactComponent
  );
  return kd((r, o) => {
    const a = ke(null), s = n && // eslint-disable-next-line react-hooks/rules-of-hooks
    Ad(
      (g) => {
        a.current = J0(o, g);
      },
      [o]
    ), [c, d] = Z0(r, t), u = Lf(), m = () => {
      const g = a.current;
      n && !g || (g ? t.applyAnimatedValues(g, c.getValue(!0)) : !1) === !1 && u();
    }, i = new K0(m, d), l = ke(void 0);
    en(() => (l.current = i, ne(d, (g) => gn(g, i)), () => {
      l.current && (ne(
        l.current.deps,
        (g) => Qn(g, l.current)
      ), J.cancel(l.current.update));
    })), Oe(m, []), Ff(() => () => {
      const g = l.current;
      ne(g.deps, (p) => Qn(p, g));
    });
    const f = t.getComponentProps(c.getValue());
    return /* @__PURE__ */ _.createElement(e, { ...f, ref: s });
  });
}, K0 = class {
  constructor(e, t) {
    this.update = e, this.deps = t;
  }
  eventObserved(e) {
    e.type == "change" && J.write(this.update);
  }
};
function Z0(e, t) {
  const n = /* @__PURE__ */ new Set();
  return Fr.dependencies = n, e.style && (e = {
    ...e,
    style: t.createAnimatedStyle(e.style)
  }), e = new lo(e), Fr.dependencies = null, [e, n];
}
function J0(e, t) {
  return e && (N.fun(e) ? e(t) : e.current = t), t;
}
var Bl = Symbol.for("AnimatedComponent"), e1 = (e, {
  applyAnimatedValues: t = () => !1,
  createAnimatedStyle: n = (o) => new lo(o),
  getComponentProps: r = (o) => o
} = {}) => {
  const o = {
    applyAnimatedValues: t,
    createAnimatedStyle: n,
    getComponentProps: r
  }, a = (s) => {
    const c = Gl(s) || "Anonymous";
    return N.str(s) ? s = a[s] || (a[s] = Hl(s, o)) : s = s[Bl] || (s[Bl] = Hl(s, o)), s.displayName = `Animated(${c})`, s;
  };
  return Je(e, (s, c) => {
    N.arr(e) && (c = Gl(s)), a[c] = a(s);
  }), {
    animated: a
  };
}, Gl = (e) => N.str(e) ? e : e && N.str(e.displayName) ? e.displayName : N.fun(e) && e.name || null;
function Ce(e, ...t) {
  return N.fun(e) ? e(...t) : e;
}
var zn = (e, t) => e === !0 || !!(t && e && (N.fun(e) ? e(t) : Ee(e).includes(t))), Bf = (e, t) => N.obj(e) ? t && e[t] : e, Gf = (e, t) => e.default === !0 ? e[t] : e.default ? e.default[t] : void 0, t1 = (e) => e, Di = (e, t = t1) => {
  let n = n1;
  e.default && e.default !== !0 && (e = e.default, n = Object.keys(e));
  const r = {};
  for (const o of n) {
    const a = t(e[o], o);
    N.und(a) || (r[o] = a);
  }
  return r;
}, n1 = [
  "config",
  "onProps",
  "onStart",
  "onChange",
  "onPause",
  "onResume",
  "onRest"
], r1 = {
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
function o1(e) {
  const t = {};
  let n = 0;
  if (Je(e, (r, o) => {
    r1[o] || (t[o] = r, n++);
  }), n)
    return t;
}
function Ri(e) {
  const t = o1(e);
  if (t) {
    const n = { to: t };
    return Je(e, (r, o) => o in t || (n[o] = r)), n;
  }
  return { ...e };
}
function Zn(e) {
  return e = Ne(e), N.arr(e) ? e.map(Zn) : ao(e) ? Ve.createStringInterpolator({
    range: [0, 1],
    output: [e, e]
  })(1) : e;
}
function a1(e) {
  for (const t in e) return !0;
  return !1;
}
function Wa(e) {
  return N.fun(e) || N.arr(e) && N.obj(e[0]);
}
function Ul(e, t) {
  var n;
  (n = e.ref) == null || n.delete(e), t == null || t.delete(e);
}
function i1(e, t) {
  var n;
  t && e.ref !== t && ((n = e.ref) == null || n.delete(e), t.add(e), e.ref = t);
}
var s1 = {
  default: { tension: 170, friction: 26 }
}, Ha = {
  ...s1.default,
  mass: 1,
  damping: 1,
  easing: M0.linear,
  clamp: !1
}, l1 = class {
  constructor() {
    this.velocity = 0, Object.assign(this, Ha);
  }
};
function c1(e, t, n) {
  n && (n = { ...n }, Yl(n, t), t = { ...n, ...t }), Yl(e, t), Object.assign(e, t);
  for (const s in Ha)
    e[s] == null && (e[s] = Ha[s]);
  let { frequency: r, damping: o } = e;
  const { mass: a } = e;
  return N.und(r) || (r < 0.01 && (r = 0.01), o < 0 && (o = 0), e.tension = Math.pow(2 * Math.PI / r, 2) * a, e.friction = 4 * Math.PI * o * a / r), e;
}
function Yl(e, t) {
  if (!N.und(t.decay))
    e.duration = void 0;
  else {
    const n = !N.und(t.tension) || !N.und(t.friction);
    (n || !N.und(t.frequency) || !N.und(t.damping) || !N.und(t.mass)) && (e.duration = void 0, e.decay = void 0), n && (e.frequency = void 0);
  }
}
var ql = [], u1 = class {
  constructor() {
    this.changed = !1, this.values = ql, this.toValues = null, this.fromValues = ql, this.config = new l1(), this.immediate = !1;
  }
};
function Uf(e, { key: t, props: n, defaultProps: r, state: o, actions: a }) {
  return new Promise((s, c) => {
    let d, u, m = zn(n.cancel ?? (r == null ? void 0 : r.cancel), t);
    if (m)
      f();
    else {
      N.und(n.pause) || (o.paused = zn(n.pause, t));
      let g = r == null ? void 0 : r.pause;
      g !== !0 && (g = o.paused || zn(g, t)), d = Ce(n.delay || 0, t), g ? (o.resumeQueue.add(l), a.pause()) : (a.resume(), l());
    }
    function i() {
      o.resumeQueue.add(l), o.timeouts.delete(u), u.cancel(), d = u.time - J.now();
    }
    function l() {
      d > 0 && !Ve.skipAnimation ? (o.delayed = !0, u = J.setTimeout(f, d), o.pauseQueue.add(i), o.timeouts.add(u)) : f();
    }
    function f() {
      o.delayed && (o.delayed = !1), o.pauseQueue.delete(i), o.timeouts.delete(u), e <= (o.cancelId || 0) && (m = !0);
      try {
        a.start({ ...n, callId: e, cancel: m }, s);
      } catch (g) {
        c(g);
      }
    }
  });
}
var zi = (e, t) => t.length == 1 ? t[0] : t.some((n) => n.cancelled) ? ln(e.get()) : t.every((n) => n.noop) ? Yf(e.get()) : Fe(
  e.get(),
  t.every((n) => n.finished)
), Yf = (e) => ({
  value: e,
  noop: !0,
  finished: !0,
  cancelled: !1
}), Fe = (e, t, n = !1) => ({
  value: e,
  finished: t,
  cancelled: n
}), ln = (e) => ({
  value: e,
  cancelled: !0,
  finished: !1
});
function qf(e, t, n, r) {
  const { callId: o, parentId: a, onRest: s } = t, { asyncTo: c, promise: d } = n;
  return !a && e === c && !t.reset ? d : n.promise = (async () => {
    n.asyncId = o, n.asyncTo = e;
    const u = Di(
      t,
      (h, y) => (
        // The `onRest` prop is only called when the `runAsync` promise is resolved.
        y === "onRest" ? void 0 : h
      )
    );
    let m, i;
    const l = new Promise(
      (h, y) => (m = h, i = y)
    ), f = (h) => {
      const y = (
        // The `cancel` prop or `stop` method was used.
        o <= (n.cancelId || 0) && ln(r) || // The async `to` prop was replaced.
        o !== n.asyncId && Fe(r, !1)
      );
      if (y)
        throw h.result = y, i(h), h;
    }, g = (h, y) => {
      const w = new Xl(), x = new Ql();
      return (async () => {
        if (Ve.skipAnimation)
          throw Jn(n), x.result = Fe(r, !1), i(x), x;
        f(w);
        const O = N.obj(h) ? { ...h } : { ...y, to: h };
        O.parentId = o, Je(u, (G, z) => {
          N.und(O[z]) && (O[z] = G);
        });
        const b = await r.start(O);
        return f(w), n.paused && await new Promise((G) => {
          n.resumeQueue.add(G);
        }), b;
      })();
    };
    let p;
    if (Ve.skipAnimation)
      return Jn(n), Fe(r, !1);
    try {
      let h;
      N.arr(e) ? h = (async (y) => {
        for (const w of y)
          await g(w);
      })(e) : h = Promise.resolve(e(g, r.stop.bind(r))), await Promise.all([h.then(m), l]), p = Fe(r.get(), !0, !1);
    } catch (h) {
      if (h instanceof Xl)
        p = h.result;
      else if (h instanceof Ql)
        p = h.result;
      else
        throw h;
    } finally {
      o == n.asyncId && (n.asyncId = a, n.asyncTo = a ? c : void 0, n.promise = a ? d : void 0);
    }
    return N.fun(s) && J.batchedUpdates(() => {
      s(p, r, r.item);
    }), p;
  })();
}
function Jn(e, t) {
  Dn(e.timeouts, (n) => n.cancel()), e.pauseQueue.clear(), e.resumeQueue.clear(), e.asyncId = e.asyncTo = e.promise = void 0, t && (e.cancelId = t);
}
var Xl = class extends Error {
  constructor() {
    super(
      "An async animation has been interrupted. You see this error because you forgot to use `await` or `.catch(...)` on its returned promise."
    );
  }
}, Ql = class extends Error {
  constructor() {
    super("SkipAnimationSignal");
  }
}, Ba = (e) => e instanceof Li, f1 = 1, Li = class extends jf {
  constructor() {
    super(...arguments), this.id = f1++, this._priority = 0;
  }
  get priority() {
    return this._priority;
  }
  set priority(e) {
    this._priority != e && (this._priority = e, this._onPriorityChange(e));
  }
  /** Get the current value */
  get() {
    const e = He(this);
    return e && e.getValue();
  }
  /** Create a spring that maps our value to another value */
  to(...e) {
    return Ve.to(this, e);
  }
  /** @deprecated Use the `to` method instead. */
  interpolate(...e) {
    return W0(), Ve.to(this, e);
  }
  toJSON() {
    return this.get();
  }
  observerAdded(e) {
    e == 1 && this._attach();
  }
  observerRemoved(e) {
    e == 0 && this._detach();
  }
  /** Called when the first child is added. */
  _attach() {
  }
  /** Called when the last child is removed. */
  _detach() {
  }
  /** Tell our children about our new value */
  _onChange(e, t = !1) {
    Xn(this, {
      type: "change",
      parent: this,
      value: e,
      idle: t
    });
  }
  /** Tell our children about our new priority */
  _onPriorityChange(e) {
    this.idle || no.sort(this), Xn(this, {
      type: "priority",
      parent: this,
      priority: e
    });
  }
}, Ht = Symbol.for("SpringPhase"), Xf = 1, Qf = 2, Kf = 4, Xo = (e) => (e[Ht] & Xf) > 0, xt = (e) => (e[Ht] & Qf) > 0, xn = (e) => (e[Ht] & Kf) > 0, Kl = (e, t) => t ? e[Ht] |= Qf | Xf : e[Ht] &= -3, Zl = (e, t) => t ? e[Ht] |= Kf : e[Ht] &= -5, d1 = class extends Li {
  constructor(e, t) {
    if (super(), this.animation = new u1(), this.defaultProps = {}, this._state = {
      paused: !1,
      delayed: !1,
      pauseQueue: /* @__PURE__ */ new Set(),
      resumeQueue: /* @__PURE__ */ new Set(),
      timeouts: /* @__PURE__ */ new Set()
    }, this._pendingCalls = /* @__PURE__ */ new Set(), this._lastCallId = 0, this._lastToId = 0, this._memoizedDuration = 0, !N.und(e) || !N.und(t)) {
      const n = N.obj(e) ? { ...e } : { ...t, from: e };
      N.und(n.default) && (n.default = !0), this.start(n);
    }
  }
  /** Equals true when not advancing on each frame. */
  get idle() {
    return !(xt(this) || this._state.asyncTo) || xn(this);
  }
  get goal() {
    return Ne(this.animation.to);
  }
  get velocity() {
    const e = He(this);
    return e instanceof so ? e.lastVelocity || 0 : e.getPayload().map((t) => t.lastVelocity || 0);
  }
  /**
   * When true, this value has been animated at least once.
   */
  get hasAnimated() {
    return Xo(this);
  }
  /**
   * When true, this value has an unfinished animation,
   * which is either active or paused.
   */
  get isAnimating() {
    return xt(this);
  }
  /**
   * When true, all current and future animations are paused.
   */
  get isPaused() {
    return xn(this);
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
    const { config: a } = r, s = io(r.to);
    !s && ze(r.to) && (o = Ee(Ne(r.to))), r.values.forEach((u, m) => {
      if (u.done) return;
      const i = (
        // Animated strings always go from 0 to 1.
        u.constructor == Lr ? 1 : s ? s[m].lastPosition : o[m]
      );
      let l = r.immediate, f = i;
      if (!l) {
        if (f = u.lastPosition, a.tension <= 0) {
          u.done = !0;
          return;
        }
        let g = u.elapsedTime += e;
        const p = r.fromValues[m], h = u.v0 != null ? u.v0 : u.v0 = N.arr(a.velocity) ? a.velocity[m] : a.velocity;
        let y;
        const w = a.precision || (p == i ? 5e-3 : Math.min(1, Math.abs(i - p) * 1e-3));
        if (N.und(a.duration))
          if (a.decay) {
            const x = a.decay === !0 ? 0.998 : a.decay, O = Math.exp(-(1 - x) * g);
            f = p + h / (1 - x) * (1 - O), l = Math.abs(u.lastPosition - f) <= w, y = h * O;
          } else {
            y = u.lastVelocity == null ? h : u.lastVelocity;
            const x = a.restVelocity || w / 10, O = a.clamp ? 0 : a.bounce, b = !N.und(O), G = p == i ? u.v0 > 0 : p < i;
            let z, K = !1;
            const H = 1, ie = Math.ceil(e / H);
            for (let se = 0; se < ie && (z = Math.abs(y) > x, !(!z && (l = Math.abs(i - f) <= w, l))); ++se) {
              b && (K = f == i || f > i == G, K && (y = -y * O, f = i));
              const $ = -a.tension * 1e-6 * (f - i), ue = -a.friction * 1e-3 * y, R = ($ + ue) / a.mass;
              y = y + R * H, f = f + y * H;
            }
          }
        else {
          let x = 1;
          a.duration > 0 && (this._memoizedDuration !== a.duration && (this._memoizedDuration = a.duration, u.durationProgress > 0 && (u.elapsedTime = a.duration * u.durationProgress, g = u.elapsedTime += e)), x = (a.progress || 0) + g / this._memoizedDuration, x = x > 1 ? 1 : x < 0 ? 0 : x, u.durationProgress = x), f = p + a.easing(x) * (i - p), y = (f - u.lastPosition) / e, l = x == 1;
        }
        u.lastVelocity = y, Number.isNaN(f) && (console.warn("Got NaN while animating:", this), l = !0);
      }
      s && !s[m].done && (l = !1), l ? u.done = !0 : t = !1, u.setValue(f, a.round) && (n = !0);
    });
    const c = He(this), d = c.getValue();
    if (t) {
      const u = Ne(r.to);
      (d !== u || n) && !a.decay ? (c.setValue(u), this._onChange(u)) : n && a.decay && this._onChange(d), this._stop();
    } else n && this._onChange(d);
  }
  /** Set the current value, while stopping the current animation */
  set(e) {
    return J.batchedUpdates(() => {
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
    if (xt(this)) {
      const { to: e, config: t } = this.animation;
      J.batchedUpdates(() => {
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
    return N.und(e) ? (n = this.queue || [], this.queue = []) : n = [N.obj(e) ? e : { ...t, to: e }], Promise.all(
      n.map((r) => this._update(r))
    ).then((r) => zi(this, r));
  }
  /**
   * Stop the current animation, and cancel any delayed updates.
   *
   * Pass `true` to call `onRest` with `cancelled: true`.
   */
  stop(e) {
    const { to: t } = this.animation;
    return this._focus(this.get()), Jn(this._state, e && this._lastCallId), J.batchedUpdates(() => this._stop(t, e)), this;
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
    n = N.obj(n) ? n[t] : n, (n == null || Wa(n)) && (n = void 0), r = N.obj(r) ? r[t] : r, r == null && (r = void 0);
    const o = { to: n, from: r };
    return Xo(this) || (e.reverse && ([n, r] = [r, n]), r = Ne(r), N.und(r) ? He(this) || this._set(n) : this._set(r)), o;
  }
  /** Every update is processed by this method before merging. */
  _update({ ...e }, t) {
    const { key: n, defaultProps: r } = this;
    e.default && Object.assign(
      r,
      Di(
        e,
        (s, c) => /^on/.test(c) ? Bf(s, n) : s
      )
    ), ec(this, e, "onProps"), kn(this, "onProps", e, this);
    const o = this._prepareNode(e);
    if (Object.isFrozen(this))
      throw Error(
        "Cannot animate a `SpringValue` object that is frozen. Did you forget to pass your component to `animated(...)` before animating its props?"
      );
    const a = this._state;
    return Uf(++this._lastCallId, {
      key: n,
      props: e,
      defaultProps: r,
      state: a,
      actions: {
        pause: () => {
          xn(this) || (Zl(this, !0), En(a.pauseQueue), kn(
            this,
            "onPause",
            Fe(this, _n(this, this.animation.to)),
            this
          ));
        },
        resume: () => {
          xn(this) && (Zl(this, !1), xt(this) && this._resume(), En(a.resumeQueue), kn(
            this,
            "onResume",
            Fe(this, _n(this, this.animation.to)),
            this
          ));
        },
        start: this._merge.bind(this, o)
      }
    }).then((s) => {
      if (e.loop && s.finished && !(t && s.noop)) {
        const c = Zf(e);
        if (c)
          return this._update(c, !0);
      }
      return s;
    });
  }
  /** Merge props into the current animation */
  _merge(e, t, n) {
    if (t.cancel)
      return this.stop(!0), n(ln(this));
    const r = !N.und(e.to), o = !N.und(e.from);
    if (r || o)
      if (t.callId > this._lastToId)
        this._lastToId = t.callId;
      else
        return n(ln(this));
    const { key: a, defaultProps: s, animation: c } = this, { to: d, from: u } = c;
    let { to: m = d, from: i = u } = e;
    o && !r && (!t.default || N.und(m)) && (m = i), t.reverse && ([m, i] = [i, m]);
    const l = !it(i, u);
    l && (c.from = i), i = Ne(i);
    const f = !it(m, d);
    f && this._focus(m);
    const g = Wa(t.to), { config: p } = c, { decay: h, velocity: y } = p;
    (r || o) && (p.velocity = 0), t.config && !g && c1(
      p,
      Ce(t.config, a),
      // Avoid calling the same "config" prop twice.
      t.config !== s.config ? Ce(s.config, a) : void 0
    );
    let w = He(this);
    if (!w || N.und(m))
      return n(Fe(this, !0));
    const x = (
      // When `reset` is undefined, the `from` prop implies `reset: true`,
      // except for declarative updates. When `reset` is defined, there
      // must exist a value to animate from.
      N.und(t.reset) ? o && !t.default : !N.und(i) && zn(t.reset, a)
    ), O = x ? i : this.get(), b = Zn(m), G = N.num(b) || N.arr(b) || ao(b), z = !g && (!G || zn(s.immediate || t.immediate, a));
    if (f) {
      const se = Va(m);
      if (se !== w.constructor)
        if (z)
          w = this._set(b);
        else
          throw Error(
            `Cannot animate between ${w.constructor.name} and ${se.name}, as the "to" prop suggests`
          );
    }
    const K = w.constructor;
    let H = ze(m), ie = !1;
    if (!H) {
      const se = x || !Xo(this) && l;
      (f || se) && (ie = it(Zn(O), b), H = !ie), (!it(c.immediate, z) && !z || !it(p.decay, h) || !it(p.velocity, y)) && (H = !0);
    }
    if (ie && xt(this) && (c.changed && !x ? H = !0 : H || this._stop(d)), !g && ((H || ze(d)) && (c.values = w.getPayload(), c.toValues = ze(m) ? null : K == Lr ? [1] : Ee(b)), c.immediate != z && (c.immediate = z, !z && !x && this._set(d)), H)) {
      const { onRest: se } = c;
      ne(p1, (ue) => ec(this, t, ue));
      const $ = Fe(this, _n(this, d));
      En(this._pendingCalls, $), this._pendingCalls.add(n), c.changed && J.batchedUpdates(() => {
        var ue;
        c.changed = !x, se == null || se($, this), x ? Ce(s.onRest, $) : (ue = c.onStart) == null || ue.call(c, $, this);
      });
    }
    x && this._set(O), g ? n(qf(t.to, t, this._state, this)) : H ? this._start() : xt(this) && !f ? this._pendingCalls.add(n) : n(Yf(O));
  }
  /** Update the `animation.to` value, which might be a `FluidValue` */
  _focus(e) {
    const t = this.animation;
    e !== t.to && (Vl(this) && this._detach(), t.to = e, Vl(this) && this._attach());
  }
  _attach() {
    let e = 0;
    const { to: t } = this.animation;
    ze(t) && (gn(t, this), Ba(t) && (e = t.priority + 1)), this.priority = e;
  }
  _detach() {
    const { to: e } = this.animation;
    ze(e) && Qn(e, this);
  }
  /**
   * Update the current value from outside the frameloop,
   * and return the `Animated` node.
   */
  _set(e, t = !0) {
    const n = Ne(e);
    if (!N.und(n)) {
      const r = He(this);
      if (!r || !it(n, r.getValue())) {
        const o = Va(n);
        !r || r.constructor != o ? Mi(this, o.create(n)) : r.setValue(n), r && J.batchedUpdates(() => {
          this._onChange(n, t);
        });
      }
    }
    return He(this);
  }
  _onStart() {
    const e = this.animation;
    e.changed || (e.changed = !0, kn(
      this,
      "onStart",
      Fe(this, _n(this, e.to)),
      this
    ));
  }
  _onChange(e, t) {
    t || (this._onStart(), Ce(this.animation.onChange, e, this)), Ce(this.defaultProps.onChange, e, this), super._onChange(e, t);
  }
  // This method resets the animation state (even if already animating) to
  // ensure the latest from/to range is used, and it also ensures this spring
  // is added to the frameloop.
  _start() {
    const e = this.animation;
    He(this).reset(Ne(e.to)), e.immediate || (e.fromValues = e.values.map((t) => t.lastPosition)), xt(this) || (Kl(this, !0), xn(this) || this._resume());
  }
  _resume() {
    Ve.skipAnimation ? this.finish() : no.start(this);
  }
  /**
   * Exit the frameloop and notify `onRest` listeners.
   *
   * Always wrap `_stop` calls with `batchedUpdates`.
   */
  _stop(e, t) {
    if (xt(this)) {
      Kl(this, !1);
      const n = this.animation;
      ne(n.values, (o) => {
        o.done = !0;
      }), n.toValues && (n.onChange = n.onPause = n.onResume = void 0), Xn(this, {
        type: "idle",
        parent: this
      });
      const r = t ? ln(this.get()) : Fe(this.get(), _n(this, e ?? n.to));
      En(this._pendingCalls, r), n.changed && (n.changed = !1, kn(this, "onRest", r, this));
    }
  }
};
function _n(e, t) {
  const n = Zn(t), r = Zn(e.get());
  return it(r, n);
}
function Zf(e, t = e.loop, n = e.to) {
  const r = Ce(t);
  if (r) {
    const o = r !== !0 && Ri(r), a = (o || e).reverse, s = !o || o.reset;
    return $r({
      ...e,
      loop: t,
      // Avoid updating default props when looping.
      default: !1,
      // Never loop the `pause` prop.
      pause: void 0,
      // For the "reverse" prop to loop as expected, the "to" prop
      // must be undefined. The "reverse" prop is ignored when the
      // "to" prop is an array or function.
      to: !a || Wa(n) ? n : void 0,
      // Ignore the "from" prop except on reset.
      from: s ? e.from : void 0,
      reset: s,
      // The "loop" prop can return a "useSpring" props object to
      // override any of the original props.
      ...o
    });
  }
}
function $r(e) {
  const { to: t, from: n } = e = Ri(e), r = /* @__PURE__ */ new Set();
  return N.obj(t) && Jl(t, r), N.obj(n) && Jl(n, r), e.keys = r.size ? Array.from(r) : null, e;
}
function Jl(e, t) {
  Je(e, (n, r) => n != null && t.add(r));
}
var p1 = [
  "onStart",
  "onRest",
  "onChange",
  "onPause",
  "onResume"
];
function ec(e, t, n) {
  e.animation[n] = t[n] !== Gf(t, n) ? Bf(t[n], e.key) : void 0;
}
function kn(e, t, ...n) {
  var r, o, a, s;
  (o = (r = e.animation)[t]) == null || o.call(r, ...n), (s = (a = e.defaultProps)[t]) == null || s.call(a, ...n);
}
var m1 = ["onStart", "onChange", "onRest"], h1 = 1, g1 = class {
  constructor(e, t) {
    this.id = h1++, this.springs = {}, this.queue = [], this._lastAsyncId = 0, this._active = /* @__PURE__ */ new Set(), this._changed = /* @__PURE__ */ new Set(), this._started = !1, this._state = {
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
      N.und(n) || this.springs[t].set(n);
    }
  }
  /** Push an update onto the queue of each value. */
  update(e) {
    return e && this.queue.push($r(e)), this;
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
    return e ? t = Ee(e).map($r) : this.queue = [], this._flush ? this._flush(this, t) : (nd(this, t), y1(this, t));
  }
  /** @internal */
  stop(e, t) {
    if (e !== !!e && (t = e), t) {
      const n = this.springs;
      ne(Ee(t), (r) => n[r].stop(!!e));
    } else
      Jn(this._state, this._lastAsyncId), this.each((n) => n.stop(!!e));
    return this;
  }
  /** Freeze the active animation in time */
  pause(e) {
    if (N.und(e))
      this.start({ pause: !0 });
    else {
      const t = this.springs;
      ne(Ee(e), (n) => t[n].pause());
    }
    return this;
  }
  /** Resume the animation if paused. */
  resume(e) {
    if (N.und(e))
      this.start({ pause: !1 });
    else {
      const t = this.springs;
      ne(Ee(e), (n) => t[n].resume());
    }
    return this;
  }
  /** Call a function once per spring value */
  each(e) {
    Je(this.springs, e);
  }
  /** @internal Called at the end of every animation frame */
  _onFrame() {
    const { onStart: e, onChange: t, onRest: n } = this._events, r = this._active.size > 0, o = this._changed.size > 0;
    (r && !this._started || o && !this._started) && (this._started = !0, Dn(e, ([c, d]) => {
      d.value = this.get(), c(d, this, this._item);
    }));
    const a = !r && this._started, s = o || a && n.size ? this.get() : null;
    o && t.size && Dn(t, ([c, d]) => {
      d.value = s, c(d, this, this._item);
    }), a && (this._started = !1, Dn(n, ([c, d]) => {
      d.value = s, c(d, this, this._item);
    }));
  }
  /** @internal */
  eventObserved(e) {
    if (e.type == "change")
      this._changed.add(e.parent), e.idle || this._active.add(e.parent);
    else if (e.type == "idle")
      this._active.delete(e.parent);
    else return;
    J.onFrame(this._onFrame);
  }
};
function y1(e, t) {
  return Promise.all(t.map((n) => Jf(e, n))).then(
    (n) => zi(e, n)
  );
}
async function Jf(e, t, n) {
  const { keys: r, to: o, from: a, loop: s, onRest: c, onResolve: d } = t, u = N.obj(t.default) && t.default;
  s && (t.loop = !1), o === !1 && (t.to = null), a === !1 && (t.from = null);
  const m = N.arr(o) || N.fun(o) ? o : void 0;
  m ? (t.to = void 0, t.onRest = void 0, u && (u.onRest = void 0)) : ne(m1, (p) => {
    const h = t[p];
    if (N.fun(h)) {
      const y = e._events[p];
      t[p] = ({ finished: w, cancelled: x }) => {
        const O = y.get(h);
        O ? (w || (O.finished = !1), x && (O.cancelled = !0)) : y.set(h, {
          value: null,
          finished: w || !1,
          cancelled: x || !1
        });
      }, u && (u[p] = t[p]);
    }
  });
  const i = e._state;
  t.pause === !i.paused ? (i.paused = t.pause, En(t.pause ? i.pauseQueue : i.resumeQueue)) : i.paused && (t.pause = !0);
  const l = (r || Object.keys(e.springs)).map(
    (p) => e.springs[p].start(t)
  ), f = t.cancel === !0 || Gf(t, "cancel") === !0;
  (m || f && i.asyncId) && l.push(
    Uf(++e._lastAsyncId, {
      props: t,
      state: i,
      actions: {
        pause: Fa,
        resume: Fa,
        start(p, h) {
          f ? (Jn(i, e._lastAsyncId), h(ln(e))) : (p.onRest = c, h(
            qf(
              m,
              p,
              i,
              e
            )
          ));
        }
      }
    })
  ), i.paused && await new Promise((p) => {
    i.resumeQueue.add(p);
  });
  const g = zi(e, await Promise.all(l));
  if (s && g.finished && !(n && g.noop)) {
    const p = Zf(t, s, o);
    if (p)
      return nd(e, [p]), Jf(e, p, !0);
  }
  return d && J.batchedUpdates(() => d(g, e, e.item)), g;
}
function b1(e, t) {
  const n = { ...e.springs };
  return t && ne(Ee(t), (r) => {
    N.und(r.keys) && (r = $r(r)), N.obj(r.to) || (r = { ...r, to: void 0 }), td(n, r, (o) => ed(o));
  }), v1(e, n), n;
}
function v1(e, t) {
  Je(t, (n, r) => {
    e.springs[r] || (e.springs[r] = n, gn(n, e));
  });
}
function ed(e, t) {
  const n = new d1();
  return n.key = e, t && gn(n, t), n;
}
function td(e, t, n) {
  t.keys && ne(t.keys, (r) => {
    (e[r] || (e[r] = n(r)))._prepareNode(t);
  });
}
function nd(e, t) {
  ne(t, (n) => {
    td(e.springs, n, (r) => ed(r, e));
  });
}
var w1 = _.createContext({
  pause: !1,
  immediate: !1
}), x1 = () => {
  const e = [], t = function(r) {
    B0();
    const o = [];
    return ne(e, (a, s) => {
      if (N.und(r))
        o.push(a.start());
      else {
        const c = n(r, a, s);
        c && o.push(a.start(c));
      }
    }), o;
  };
  t.current = e, t.add = function(r) {
    e.includes(r) || e.push(r);
  }, t.delete = function(r) {
    const o = e.indexOf(r);
    ~o && e.splice(o, 1);
  }, t.pause = function() {
    return ne(e, (r) => r.pause(...arguments)), this;
  }, t.resume = function() {
    return ne(e, (r) => r.resume(...arguments)), this;
  }, t.set = function(r) {
    ne(e, (o, a) => {
      const s = N.fun(r) ? r(a, o) : r;
      s && o.set(s);
    });
  }, t.start = function(r) {
    const o = [];
    return ne(e, (a, s) => {
      if (N.und(r))
        o.push(a.start());
      else {
        const c = this._getProps(r, a, s);
        c && o.push(a.start(c));
      }
    }), o;
  }, t.stop = function() {
    return ne(e, (r) => r.stop(...arguments)), this;
  }, t.update = function(r) {
    return ne(e, (o, a) => o.update(this._getProps(r, o, a))), this;
  };
  const n = function(r, o, a) {
    return N.fun(r) ? r(a, o) : r;
  };
  return t._getProps = n, t;
};
function tc(e, t, n) {
  const r = N.fun(t) && t, {
    reset: o,
    sort: a,
    trail: s = 0,
    expires: c = !0,
    exitBeforeEnter: d = !1,
    onDestroyed: u,
    ref: m,
    config: i
  } = r ? r() : t, l = xd(
    () => r || arguments.length == 3 ? x1() : void 0,
    []
  ), f = Ee(e), g = [], p = ke(null), h = o ? null : p.current;
  en(() => {
    p.current = g;
  }), Ff(() => (ne(g, (R) => {
    l == null || l.add(R.ctrl), R.ctrl.ref = l;
  }), () => {
    ne(p.current, (R) => {
      R.expired && clearTimeout(R.expirationId), Ul(R.ctrl, l), R.ctrl.stop(!0);
    });
  }));
  const y = k1(f, r ? r() : t, h), w = o && p.current || [];
  en(
    () => ne(w, ({ ctrl: R, item: S, key: V }) => {
      Ul(R, l), Ce(u, S, V);
    })
  );
  const x = [];
  if (h && ne(h, (R, S) => {
    R.expired ? (clearTimeout(R.expirationId), w.push(R)) : (S = x[S] = y.indexOf(R.key), ~S && (g[S] = R));
  }), ne(f, (R, S) => {
    g[S] || (g[S] = {
      key: y[S],
      item: R,
      phase: "mount",
      ctrl: new g1()
    }, g[S].ctrl.item = R);
  }), x.length) {
    let R = -1;
    const { leave: S } = r ? r() : t;
    ne(x, (V, Z) => {
      const q = h[Z];
      ~V ? (R = g.indexOf(q), g[R] = { ...q, item: f[V] }) : S && g.splice(++R, 0, q);
    });
  }
  N.fun(a) && g.sort((R, S) => a(R.item, S.item));
  let O = -s;
  const b = Lf(), G = Di(t), z = /* @__PURE__ */ new Map(), K = ke(/* @__PURE__ */ new Map()), H = ke(!1);
  ne(g, (R, S) => {
    const V = R.key, Z = R.phase, q = r ? r() : t;
    let ce, v;
    const k = Ce(q.delay || 0, V);
    if (Z == "mount")
      ce = q.enter, v = "enter";
    else {
      const D = y.indexOf(V) < 0;
      if (Z != "leave")
        if (D)
          ce = q.leave, v = "leave";
        else if (ce = q.update)
          v = "update";
        else return;
      else if (!D)
        ce = q.enter, v = "enter";
      else return;
    }
    if (ce = Ce(ce, R.item, S), ce = N.obj(ce) ? Ri(ce) : { to: ce }, !ce.config) {
      const D = i || G.config;
      ce.config = Ce(D, R.item, S, v);
    }
    O += s;
    const C = {
      ...G,
      // we need to add our props.delay value you here.
      delay: k + O,
      ref: m,
      immediate: q.immediate,
      // This prevents implied resets.
      reset: !1,
      // Merge any phase-specific props.
      ...ce
    };
    if (v == "enter" && N.und(C.from)) {
      const D = r ? r() : t, j = N.und(D.initial) || h ? D.from : D.initial;
      C.from = Ce(j, R.item, S);
    }
    const { onResolve: L } = C;
    C.onResolve = (D) => {
      Ce(L, D);
      const j = p.current, T = j.find((F) => F.key === V);
      if (T && !(D.cancelled && T.phase != "update") && T.ctrl.idle) {
        const F = j.every((M) => M.ctrl.idle);
        if (T.phase == "leave") {
          const M = Ce(c, T.item);
          if (M !== !1) {
            const W = M === !0 ? 0 : M;
            if (T.expired = !0, !F && W > 0) {
              W <= 2147483647 && (T.expirationId = setTimeout(b, W));
              return;
            }
          }
        }
        F && j.some((M) => M.expired) && (K.current.delete(T), d && (H.current = !0), b());
      }
    };
    const I = b1(R.ctrl, C);
    v === "leave" && d ? K.current.set(R, { phase: v, springs: I, payload: C }) : z.set(R, { phase: v, springs: I, payload: C });
  });
  const ie = fc(w1), se = Y0(ie), $ = ie !== se && a1(ie);
  en(() => {
    $ && ne(g, (R) => {
      R.ctrl.start({ default: ie });
    });
  }, [ie]), ne(z, (R, S) => {
    if (K.current.size) {
      const V = g.findIndex((Z) => Z.key === S.key);
      g.splice(V, 1);
    }
  }), en(
    () => {
      ne(
        K.current.size ? K.current : z,
        ({ phase: R, payload: S }, V) => {
          const { ctrl: Z } = V;
          V.phase = R, l == null || l.add(Z), $ && R == "enter" && Z.start({ default: ie }), S && (i1(Z, S.ref), (Z.ref || l) && !H.current ? Z.update(S) : (Z.start(S), H.current && (H.current = !1)));
        }
      );
    },
    o ? void 0 : n
  );
  const ue = (R) => /* @__PURE__ */ _.createElement(_.Fragment, null, g.map((S, V) => {
    const { springs: Z } = z.get(S) || S.ctrl, q = R({ ...Z }, S.item, S, V);
    return q && q.type ? /* @__PURE__ */ _.createElement(
      q.type,
      {
        ...q.props,
        key: N.str(S.key) || N.num(S.key) ? S.key : S.ctrl.id,
        ref: q.ref
      }
    ) : q;
  }));
  return l ? [ue, l] : ue;
}
var _1 = 1;
function k1(e, { key: t, keys: n = t }, r) {
  if (n === null) {
    const o = /* @__PURE__ */ new Set();
    return e.map((a) => {
      const s = r && r.find(
        (c) => c.item === a && c.phase !== "leave" && !o.has(c)
      );
      return s ? (o.add(s), s.key) : _1++;
    });
  }
  return N.und(n) ? e : N.fun(n) ? e.map(n) : Ee(n);
}
var A1 = class extends Li {
  constructor(e, t) {
    super(), this.source = e, this.idle = !0, this._active = /* @__PURE__ */ new Set(), this.calc = Yn(...t);
    const n = this._get(), r = Va(n);
    Mi(this, r.create(n));
  }
  advance(e) {
    const t = this._get(), n = this.get();
    it(t, n) || (He(this).setValue(t), this._onChange(t, this.idle)), !this.idle && nc(this._active) && Qo(this);
  }
  _get() {
    const e = N.arr(this.source) ? this.source.map(Ne) : Ee(Ne(this.source));
    return this.calc(...e);
  }
  _start() {
    this.idle && !nc(this._active) && (this.idle = !1, ne(io(this), (e) => {
      e.done = !1;
    }), Ve.skipAnimation ? (J.batchedUpdates(() => this.advance()), Qo(this)) : no.start(this));
  }
  // Observe our sources only when we're observed.
  _attach() {
    let e = 1;
    ne(Ee(this.source), (t) => {
      ze(t) && gn(t, this), Ba(t) && (t.idle || this._active.add(t), e = Math.max(e, t.priority + 1));
    }), this.priority = e, this._start();
  }
  // Stop observing our sources once we have no observers.
  _detach() {
    ne(Ee(this.source), (e) => {
      ze(e) && Qn(e, this);
    }), this._active.clear(), Qo(this);
  }
  /** @internal */
  eventObserved(e) {
    e.type == "change" ? e.idle ? this.advance() : (this._active.add(e.parent), this._start()) : e.type == "idle" ? this._active.delete(e.parent) : e.type == "priority" && (this.priority = Ee(this.source).reduce(
      (t, n) => Math.max(t, (Ba(n) ? n.priority : 0) + 1),
      0
    ));
  }
};
function O1(e) {
  return e.idle !== !1;
}
function nc(e) {
  return !e.size || Array.from(e).every(O1);
}
function Qo(e) {
  e.idle || (e.idle = !0, ne(io(e), (t) => {
    t.done = !0;
  }), Xn(e, {
    type: "idle",
    parent: e
  }));
}
Ve.assign({
  createStringInterpolator: Rf,
  to: (e, t) => new A1(e, t)
});
var rd = /^--/;
function S1(e, t) {
  return t == null || typeof t == "boolean" || t === "" ? "" : typeof t == "number" && t !== 0 && !rd.test(e) && !(Ln.hasOwnProperty(e) && Ln[e]) ? t + "px" : ("" + t).trim();
}
var rc = {};
function P1(e, t) {
  if (!e.nodeType || !e.setAttribute)
    return !1;
  const n = e.nodeName === "filter" || e.parentNode && e.parentNode.nodeName === "filter", {
    className: r,
    style: o,
    children: a,
    scrollTop: s,
    scrollLeft: c,
    viewBox: d,
    ...u
  } = t, m = Object.values(u), i = Object.keys(u).map(
    (l) => n || e.hasAttribute(l) ? l : rc[l] || (rc[l] = l.replace(
      /([A-Z])/g,
      // Attributes are written in dash case
      (f) => "-" + f.toLowerCase()
    ))
  );
  a !== void 0 && (e.textContent = a);
  for (const l in o)
    if (o.hasOwnProperty(l)) {
      const f = S1(l, o[l]);
      rd.test(l) ? e.style.setProperty(l, f) : e.style[l] = f;
    }
  i.forEach((l, f) => {
    e.setAttribute(l, m[f]);
  }), r !== void 0 && (e.className = r), s !== void 0 && (e.scrollTop = s), c !== void 0 && (e.scrollLeft = c), d !== void 0 && e.setAttribute("viewBox", d);
}
var Ln = {
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
}, E1 = (e, t) => e + t.charAt(0).toUpperCase() + t.substring(1), N1 = ["Webkit", "Ms", "Moz", "O"];
Ln = Object.keys(Ln).reduce((e, t) => (N1.forEach((n) => e[E1(n, t)] = e[t]), e), Ln);
var C1 = /^(matrix|translate|scale|rotate|skew)/, I1 = /^(translate)/, T1 = /^(rotate|skew)/, Ko = (e, t) => N.num(e) && e !== 0 ? e + t : e, Pr = (e, t) => N.arr(e) ? e.every((n) => Pr(n, t)) : N.num(e) ? e === t : parseFloat(e) === t, j1 = class extends lo {
  constructor({ x: e, y: t, z: n, ...r }) {
    const o = [], a = [];
    (e || t || n) && (o.push([e || 0, t || 0, n || 0]), a.push((s) => [
      `translate3d(${s.map((c) => Ko(c, "px")).join(",")})`,
      // prettier-ignore
      Pr(s, 0)
    ])), Je(r, (s, c) => {
      if (c === "transform")
        o.push([s || ""]), a.push((d) => [d, d === ""]);
      else if (C1.test(c)) {
        if (delete r[c], N.und(s)) return;
        const d = I1.test(c) ? "px" : T1.test(c) ? "deg" : "";
        o.push(Ee(s)), a.push(
          c === "rotate3d" ? ([u, m, i, l]) => [
            `rotate3d(${u},${m},${i},${Ko(l, d)})`,
            Pr(l, 0)
          ] : (u) => [
            `${c}(${u.map((m) => Ko(m, d)).join(",")})`,
            Pr(u, c.startsWith("scale") ? 1 : 0)
          ]
        );
      }
    }), o.length && (r.transform = new M1(o, a)), super(r);
  }
}, M1 = class extends jf {
  constructor(e, t) {
    super(), this.inputs = e, this.transforms = t, this._value = null;
  }
  get() {
    return this._value || (this._value = this._get());
  }
  _get() {
    let e = "", t = !0;
    return ne(this.inputs, (n, r) => {
      const o = Ne(n[0]), [a, s] = this.transforms[r](
        N.arr(o) ? o : n.map(Ne)
      );
      e += " " + a, t = t && s;
    }), t ? "none" : e;
  }
  // Start observing our inputs once we have an observer.
  observerAdded(e) {
    e == 1 && ne(
      this.inputs,
      (t) => ne(
        t,
        (n) => ze(n) && gn(n, this)
      )
    );
  }
  // Stop observing our inputs once we have no observers.
  observerRemoved(e) {
    e == 0 && ne(
      this.inputs,
      (t) => ne(
        t,
        (n) => ze(n) && Qn(n, this)
      )
    );
  }
  eventObserved(e) {
    e.type == "change" && (this._value = null), Xn(this, e);
  }
}, D1 = [
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
Ve.assign({
  batchedUpdates: Pd,
  createStringInterpolator: Rf,
  colors: _0
});
var R1 = e1(D1, {
  applyAnimatedValues: P1,
  createAnimatedStyle: (e) => new j1(e),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getComponentProps: ({ scrollTop: e, scrollLeft: t, ...n }) => n
}), od = R1.animated;
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const z1 = {
  prefix: "fas",
  iconName: "down-left-and-up-right-to-center",
  icon: [512, 512, ["compress-alt"], "f422", "M439 7c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8l-144 0c-13.3 0-24-10.7-24-24l0-144c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39L439 7zM72 272l144 0c13.3 0 24 10.7 24 24l0 144c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39L73 505c-9.4 9.4-24.6 9.4-33.9 0L7 473c-9.4-9.4-9.4-24.6 0-33.9l87-87L55 313c-6.9-6.9-8.9-17.2-5.2-26.2s12.5-14.8 22.2-14.8z"]
}, L1 = {
  prefix: "fas",
  iconName: "up-right-and-down-left-from-center",
  icon: [512, 512, ["expand-alt"], "f424", "M344 0L488 0c13.3 0 24 10.7 24 24l0 144c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87L327 41c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512L24 512c-13.3 0-24-10.7-24-24L0 344c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39 87-87c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8z"]
};
var Ga = /* @__PURE__ */ ((e) => (e[e.NONE = 0] = "NONE", e[e.INPUT = 1] = "INPUT", e[e.PANEL = 2] = "PANEL", e[e.DIALOGUE = 3] = "DIALOGUE", e))(Ga || {}), F1 = Object.freeze({
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
}), $1 = "VisuallyHidden", ad = _.forwardRef(
  (e, t) => /* @__PURE__ */ B(
    et.span,
    {
      ...e,
      ref: t,
      style: { ...F1, ...e.style }
    }
  )
);
ad.displayName = $1;
var oc = ad;
const er = [], V1 = (e) => {
  er.push(e);
}, W1 = (e) => {
  const t = er.findIndex((n) => n.id === e);
  t !== -1 && er.splice(t, 1);
}, H1 = (e, t) => {
  const n = er.find((r) => r.id === e);
  n && Object.assign(n, t);
}, B1 = () => er.filter((e) => e.closeOnEsc).sort((e, t) => t.zIndex - e.zIndex)[0];
typeof window < "u" && !window.__modalEscListenerInstalled && (window.__modalEscListenerInstalled = !0, window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" && e.key !== "Esc") return;
  const t = B1();
  t && (e.preventDefault(), t.onClose());
}));
let An = 70;
const G1 = ({
  styles: e,
  backdropClassName: t,
  disableHotkeyInput: n,
  enableHotkeyInput: r
}) => (Oe(() => (n(Ga.DIALOGUE), () => {
  r(Ga.DIALOGUE);
}), [n, r]), /* @__PURE__ */ B(cm, { forceMount: !0, asChild: !0, children: /* @__PURE__ */ B(
  od.div,
  {
    className: Cn("fixed inset-0 z-[69]", t),
    style: {
      opacity: e.opacity,
      pointerEvents: "none",
      background: "radial-gradient(800px 400px at 10% -10%, rgba(45,129,255,0.10), transparent), radial-gradient(600px 320px at 110% 110%, rgba(28,182,190,0.10), transparent), rgba(0,0,0,0.60)"
    }
  }
) })), Ua = ({ children: e }) => /* @__PURE__ */ B(Er, { children: e }), id = wd(
  void 0
), Fi = ({ className: e, size: t = "md" }) => {
  const n = fc(id);
  if (!n) return null;
  const { expanded: r, toggleExpanded: o } = n;
  return /* @__PURE__ */ B(
    "button",
    {
      type: "button",
      "aria-label": r ? "Restore modal size" : "Expand modal",
      onClick: o,
      className: Cn(
        "flex items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white",
        {
          sm: "h-5 w-5 text-sm",
          md: "h-7 w-7 text-md",
          lg: "h-9 w-9 text-xl"
        }[t],
        "relative z-[70]",
        e
      ),
      children: /* @__PURE__ */ B(
        Bn,
        {
          icon: r ? z1 : L1
        }
      )
    }
  );
};
Fi.displayName = "ModalExpandButton";
const sr = ({
  isOpen: e,
  title: t,
  titleIcon: n,
  onTitleIconClick: r,
  onClose: o,
  enableHotkeyInput: a = () => {
  },
  disableHotkeyInput: s = () => {
  },
  className: c,
  backdropClassName: d,
  width: u,
  children: m,
  childPadding: i = !0,
  titleIconClassName: l,
  showClose: f = !0,
  draggable: g = !1,
  resizable: p = !1,
  initialPosition: h,
  closeOnOutsideClick: y = !0,
  closeOnEsc: w = !0,
  allowBackgroundInteraction: x = !1,
  expandable: O = !1,
  accessibleTitle: b,
  accessibleDescription: G
}) => {
  const [z, K] = Be(
    null
  ), [H, ie] = Be(!1), [se, $] = Be(!1), ue = ke({ x: 0, y: 0 }), R = ke({ x: 0, y: 0 }), S = ke(null), V = ke(null), Z = ke(null), [q, ce] = Be(() => ++An), [v, k] = Be(!1), C = ke(null), L = tc(e, {
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
  }), I = tc(e, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: {
      tension: 280,
      friction: 25
    }
  });
  Oe(() => {
    v ? (V.current && (C.current = { ...V.current }), K({ x: 0, y: 0 }), V.current = { x: 0, y: 0 }, S.current && (S.current.style.left = "0px", S.current.style.top = "0px", S.current.style.margin = "0", S.current.style.position = "fixed", S.current.style.zIndex = String(q))) : C.current && (K({ ...C.current }), V.current = { ...C.current }, S.current && (S.current.style.left = C.current.x + "px", S.current.style.top = C.current.y + "px", S.current.style.margin = "0", S.current.style.position = "fixed", S.current.style.zIndex = String(q)));
  }, [v, q]);
  const D = () => k((X) => !X);
  Oe(() => {
    e ? Z.current ? (K({ ...Z.current }), V.current = { ...Z.current }, S.current && (S.current.style.left = Z.current.x + "px", S.current.style.top = Z.current.y + "px", S.current.style.margin = "0", S.current.style.position = "fixed", S.current.style.zIndex = String(q))) : h && (K({ ...h }), V.current = { ...h }, S.current && (S.current.style.left = h.x + "px", S.current.style.top = h.y + "px", S.current.style.margin = "0", S.current.style.position = "fixed", S.current.style.zIndex = String(q))) : V.current && (Z.current = { ...V.current });
  }, [e, q]), Oe(() => {
    if (!H) return;
    let X = null;
    const Q = (je) => {
      if (!S.current) return;
      const Me = je.clientX - R.current.x, he = je.clientY - R.current.y, we = ue.current.x + Me, _e = ue.current.y + he, De = S.current, { width: Re, height: Gt } = De.getBoundingClientRect(), $i = window.innerWidth, Vi = window.innerHeight, Wi = 450, md = -450, hd = 0, gd = $i - Re + Wi, yd = Vi - Gt + Wi, bd = Math.max(md, Math.min(we, gd)), vd = Math.max(hd, Math.min(_e, yd));
      V.current = { x: bd, y: vd }, S.current && (X && cancelAnimationFrame(X), X = requestAnimationFrame(() => {
        S.current && V.current && (S.current.style.left = V.current.x + "px", S.current.style.top = V.current.y + "px", S.current.style.margin = "0", S.current.style.position = "fixed", S.current.style.zIndex = String(q));
      }));
    }, le = () => {
      ie(!1), V.current && K({ ...V.current });
    };
    return window.addEventListener("mousemove", Q), window.addEventListener("mouseup", le), () => {
      window.removeEventListener("mousemove", Q), window.removeEventListener("mouseup", le), X && cancelAnimationFrame(X);
    };
  }, [H, q]);
  const j = (X) => {
    var Q, le;
    if (!S.current) return;
    v && k(!1), X.preventDefault(), X.stopPropagation();
    const je = S.current, { width: Me, height: he } = je.getBoundingClientRect(), we = window.innerWidth, _e = window.innerHeight;
    let De = ((Q = V.current) == null ? void 0 : Q.x) ?? (z == null ? void 0 : z.x), Re = ((le = V.current) == null ? void 0 : le.y) ?? (z == null ? void 0 : z.y);
    (De === void 0 || Re === void 0) && (h ? (De = h.x, Re = h.y) : (De = (we - Me) / 2, Re = (_e - he) / 2)), ue.current = { x: De, y: Re }, R.current = { x: X.clientX, y: X.clientY }, ie(!0), !z && !V.current && (K({ x: De, y: Re }), V.current = { x: De, y: Re }, S.current && (S.current.style.left = De + "px", S.current.style.top = Re + "px", S.current.style.margin = "0", S.current.style.position = "fixed", S.current.style.zIndex = String(q)));
  };
  let T = m;
  if (g) {
    let X = !1;
    T = Array.isArray(m) ? m.map((Q) => {
      if (!X && Hi(Q) && (Q.type === Ua || Q.type.displayName === "ModalDragHandle")) {
        X = !0;
        const le = Q;
        return Bi(le, {
          children: /* @__PURE__ */ B(
            "div",
            {
              style: { cursor: "move", userSelect: "none" },
              onMouseDown: j,
              children: le.props.children
            }
          )
        });
      }
      return Q;
    }) : Hi(m) && (m.type === Ua || m.type.displayName === "ModalDragHandle") ? (() => {
      const Q = m;
      return Bi(Q, {
        children: /* @__PURE__ */ B(
          "div",
          {
            style: { cursor: "move", userSelect: "none" },
            onMouseDown: j,
            children: Q.props.children
          }
        )
      });
    })() : m;
  }
  const F = ke(null), M = ke(null), W = (X, Q) => {
    if (!S.current || (X.preventDefault(), X.stopPropagation(), v)) return;
    const le = S.current.getBoundingClientRect();
    F.current = Q, M.current = {
      mouseX: X.clientX,
      mouseY: X.clientY,
      width: le.width,
      height: le.height,
      x: le.left,
      y: le.top
    }, $(!0);
  };
  Oe(() => {
    if (!se) return;
    let X = null;
    const Q = (je) => {
      if (!S.current || !M.current || !F.current)
        return;
      const Me = je.clientX - M.current.mouseX, he = je.clientY - M.current.mouseY;
      let we = M.current.width, _e = M.current.height, De = M.current.x, Re = M.current.y;
      const Gt = F.current;
      Gt.includes("right") && (we = M.current.width + Me), Gt.includes("left") && (we = M.current.width - Me, De = M.current.x + Me), Gt.includes("bottom") && (_e = M.current.height + he), Gt.includes("top") && (_e = M.current.height - he, Re = M.current.y + he), we = Math.max(320, we), _e = Math.max(240, _e), V.current = { x: De, y: Re }, Ae.current = { width: we, height: _e }, X && cancelAnimationFrame(X), X = requestAnimationFrame(() => {
        S.current && V.current && (S.current.style.width = we + "px", S.current.style.height = _e + "px", S.current.style.left = V.current.x + "px", S.current.style.top = V.current.y + "px", S.current.style.margin = "0", S.current.style.position = "fixed", S.current.style.zIndex = String(q));
      });
    }, le = () => {
      $(!1), V.current && K({ ...V.current }), Ae.current && xe({ ...Ae.current });
    };
    return window.addEventListener("mousemove", Q), window.addEventListener("mouseup", le), () => {
      window.removeEventListener("mousemove", Q), window.removeEventListener("mouseup", le), X && cancelAnimationFrame(X);
    };
  }, [se, q]);
  const re = () => {
    if (!p || v) return null;
    const X = "absolute z-[75] bg-transparent select-none", Q = 5, le = 2, je = [
      { dir: "top", className: `top-0 left-0 w-full h-${le}` },
      { dir: "bottom", className: `bottom-0 left-0 w-full h-${le}` },
      { dir: "left", className: `left-0 top-0 h-full w-${le}` },
      { dir: "right", className: `right-0 top-0 h-full w-${le}` },
      {
        dir: "top-left",
        className: `top-0 left-0 w-${Q} h-${Q}`
      },
      {
        dir: "top-right",
        className: `top-0 right-0 w-${Q} h-${Q}`
      },
      {
        dir: "bottom-left",
        className: `bottom-0 left-0 w-${Q} h-${Q}`
      },
      {
        dir: "bottom-right",
        className: `bottom-0 right-0 w-${Q} h-${Q}`
      }
    ], Me = {
      top: "n-resize",
      bottom: "s-resize",
      left: "w-resize",
      right: "e-resize",
      "top-left": "nw-resize",
      "top-right": "ne-resize",
      "bottom-left": "sw-resize",
      "bottom-right": "se-resize"
    };
    return je.map((he) => /* @__PURE__ */ B(
      "div",
      {
        className: `${X} ${he.className}`,
        style: { cursor: Me[he.dir] },
        onMouseDown: (we) => W(we, he.dir)
      },
      he.dir
    ));
  }, [A, xe] = Be(
    null
  ), Ae = ke(null), tt = ke(null);
  Oe(() => {
    if (e && !A && S.current && p) {
      const { width: X, height: Q } = S.current.getBoundingClientRect();
      xe({ width: X, height: Q }), Ae.current = { width: X, height: Q };
    }
  }, [e, A, p]), Oe(() => {
    if (p) {
      if (!e)
        Ae.current && (tt.current = { ...Ae.current });
      else if (tt.current && S.current) {
        const { width: X, height: Q } = tt.current;
        S.current.style.width = X + "px", S.current.style.height = Q + "px", xe({ width: X, height: Q }), Ae.current = { width: X, height: Q };
      }
    }
  }, [e, p]), Oe(() => {
    const X = () => {
      S.current && q < An && (An += 1, ce(An), S.current.style.zIndex = String(An));
    }, Q = S.current;
    return Q && Q.addEventListener("mousedown", X), () => {
      Q && Q.removeEventListener("mousedown", X);
    };
  }, [q]), Oe(() => {
    if (!e || x) return;
    const X = (Q) => {
      if (Q.key === "Escape" || Q.key === "Esc") return;
      const le = Q.target;
      le && (le.closest(
        '[role="dialog"], [role="menu"], [role="listbox"], [data-headlessui-portal]'
      ) || le.matches("input, textarea, select, button, [contenteditable]")) || Q.stopPropagation();
    };
    return window.addEventListener("keydown", X, !0), () => {
      window.removeEventListener("keydown", X, !0);
    };
  }, [e, x]), Oe(() => {
    if (!x) return;
    const X = S.current;
    if (!X) return;
    const Q = (he) => {
      he && (he.hasAttribute("inert") && he.removeAttribute("inert"), he.inert && (he.inert = !1), he.getAttribute("aria-hidden") === "true" && he.removeAttribute("aria-hidden"));
    };
    let le = X;
    for (; le; )
      Q(le), le = le.parentElement;
    const je = new MutationObserver((he) => {
      he.forEach((we) => {
        if (we.type === "attributes" && we.attributeName === "inert" && we.target instanceof HTMLElement) {
          const _e = we.target;
          (_e === X || X.contains(_e)) && Q(_e);
        }
      });
    });
    je.observe(X, {
      attributes: !0,
      subtree: !1,
      attributeFilter: ["inert"]
    }), document.querySelectorAll(
      "[data-radix-portal][inert], [data-headlessui-portal][inert]"
    ).forEach((he) => he.removeAttribute("inert"));
    const Me = new MutationObserver((he) => {
      he.forEach((we) => {
        if (we.type === "attributes" && we.attributeName === "inert" && we.target.hasAttribute("inert")) {
          const _e = we.target;
          (_e.hasAttribute("data-radix-portal") || _e.hasAttribute("data-headlessui-portal")) && Q(_e);
        }
      });
    });
    return Me.observe(document.body, {
      attributes: !0,
      subtree: !0,
      attributeFilter: ["inert"]
    }), () => {
      je.disconnect(), Me.disconnect();
    };
  }, [x]);
  const uo = ke(Math.floor(Math.random() * 1e9));
  Oe(() => {
    if (e)
      return V1({
        id: uo.current,
        zIndex: q,
        onClose: o,
        closeOnEsc: w
      }), () => {
        W1(uo.current);
      };
  }, [e]), Oe(() => {
    e && H1(uo.current, { zIndex: q, onClose: o, closeOnEsc: w });
  }, [e, q, o, w]);
  const pd = () => v ? {
    position: "fixed",
    left: 0,
    top: 0,
    margin: 0,
    zIndex: q,
    width: "100vw",
    height: "100vh",
    ...x ? { pointerEvents: "auto" } : {}
  } : !g || !z ? {
    ...p && A ? { width: A.width, height: A.height } : {},
    ...x ? { pointerEvents: "auto" } : {}
  } : {
    position: "fixed",
    left: z.x,
    top: z.y,
    margin: 0,
    zIndex: q,
    ...p && A ? { width: A.width, height: A.height } : {},
    ...x ? { pointerEvents: "auto" } : {}
  };
  return /* @__PURE__ */ B(
    sm,
    {
      open: e,
      onOpenChange: (X) => !X && y && o(),
      modal: !x,
      children: /* @__PURE__ */ B(lm, { children: /* @__PURE__ */ st(
        "div",
        {
          className: "fixed inset-0 z-[70]",
          style: x ? { pointerEvents: "none" } : void 0,
          children: [
            !x && I(
              (X, Q) => Q ? /* @__PURE__ */ B(
                G1,
                {
                  styles: X,
                  backdropClassName: d,
                  disableHotkeyInput: s,
                  enableHotkeyInput: a
                },
                "backdrop"
              ) : null
            ),
            x && /* @__PURE__ */ B(
              "div",
              {
                className: Cn("fixed inset-0 z-[69]", d),
                style: { pointerEvents: "none" }
              }
            ),
            /* @__PURE__ */ B(id.Provider, { value: { expanded: v, toggleExpanded: D }, children: /* @__PURE__ */ B(
              "div",
              {
                className: "flex min-h-full items-center justify-center p-4 text-center",
                style: x ? { pointerEvents: "none" } : void 0,
                children: L((X, Q) => Q ? /* @__PURE__ */ B(
                  um,
                  {
                    forceMount: !0,
                    asChild: !0,
                    ...G ? {} : { "aria-describedby": void 0 },
                    onPointerDownOutside: (le) => {
                      (!y || x) && le.preventDefault();
                    },
                    onEscapeKeyDown: (le) => {
                      w || le.preventDefault();
                    },
                    onInteractOutside: (le) => {
                      x && le.preventDefault();
                    },
                    children: /* @__PURE__ */ st(
                      od.div,
                      {
                        className: Cn(
                          "w-full max-w-lg rounded-xl relative border border-ui-panel-border bg-ui-modal text-left align-middle shadow-2xl z-[70]",
                          i && !v ? "p-4" : "",
                          c,
                          "!transition-none",
                          // Always disable CSS transitions for spring animations
                          v && "w-screen h-screen max-w-screen max-h-screen rounded-none"
                        ),
                        ref: S,
                        style: {
                          ...pd(),
                          opacity: X.opacity,
                          transform: X.transform,
                          transformOrigin: "center center",
                          willChange: "transform, opacity"
                          // Optimize for animations
                        },
                        children: [
                          /* @__PURE__ */ st("div", { className: "w-full h-full", children: [
                            G && /* @__PURE__ */ B(oc, { asChild: !0, children: /* @__PURE__ */ B(fm, { children: G }) }),
                            t ? /* @__PURE__ */ B(
                              os,
                              {
                                className: Cn(
                                  "mb-4 flex justify-between pb-0 text-xl font-bold text-base-fg"
                                ),
                                children: /* @__PURE__ */ B(Er, { children: r ? /* @__PURE__ */ st(
                                  "button",
                                  {
                                    className: "flex items-center gap-3",
                                    onClick: r,
                                    children: [
                                      n && /* @__PURE__ */ B(
                                        Bn,
                                        {
                                          icon: n,
                                          className: l
                                        }
                                      ),
                                      t
                                    ]
                                  }
                                ) : /* @__PURE__ */ st("div", { className: "flex items-center gap-3", children: [
                                  n && /* @__PURE__ */ B(
                                    Bn,
                                    {
                                      icon: n,
                                      className: l
                                    }
                                  ),
                                  t
                                ] }) })
                              }
                            ) : /* @__PURE__ */ B(oc, { asChild: !0, children: /* @__PURE__ */ B(os, { children: b ?? "Dialog" }) }),
                            /* @__PURE__ */ B("div", { className: "h-full".trim(), children: T }),
                            re()
                          ] }),
                          (f || O) && /* @__PURE__ */ st("div", { className: "absolute top-0 right-0 m-2.5 z-[80] flex items-center gap-2", children: [
                            O && /* @__PURE__ */ B(sr.ExpandButton, {}),
                            f && /* @__PURE__ */ B(m0, { onClick: o })
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
sr.DragHandle = Ua;
sr.DragHandle.displayName = "ModalDragHandle";
sr.ExpandButton = Fi;
Fi.displayName = "ModalExpandButton";
function U1(e, t = !1) {
  return window.__TAURI_INTERNALS__.transformCallback(e, t);
}
async function sd(e, t = {}, n) {
  return window.__TAURI_INTERNALS__.invoke(e, t, n);
}
var ac;
(function(e) {
  e.WINDOW_RESIZED = "tauri://resize", e.WINDOW_MOVED = "tauri://move", e.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", e.WINDOW_DESTROYED = "tauri://destroyed", e.WINDOW_FOCUS = "tauri://focus", e.WINDOW_BLUR = "tauri://blur", e.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", e.WINDOW_THEME_CHANGED = "tauri://theme-changed", e.WINDOW_CREATED = "tauri://window-created", e.WEBVIEW_CREATED = "tauri://webview-created", e.DRAG_ENTER = "tauri://drag-enter", e.DRAG_OVER = "tauri://drag-over", e.DRAG_DROP = "tauri://drag-drop", e.DRAG_LEAVE = "tauri://drag-leave";
})(ac || (ac = {}));
async function Y1(e, t) {
  window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(e, t), await sd("plugin:event|unlisten", {
    event: e,
    eventId: t
  });
}
async function q1(e, t, n) {
  var r;
  const o = (r = void 0) !== null && r !== void 0 ? r : { kind: "Any" };
  return sd("plugin:event|listen", {
    event: e,
    target: o,
    handler: U1(t)
  }).then((a) => async () => Y1(e, a));
}
const X1 = "show_provider_billing_modal_event", Q1 = (e) => {
  Oe(() => {
    let t = !1, n;
    return (async () => (n = q1(X1, async (r) => {
      await e(r.payload.data);
    }), t && n.then((r) => r())))(), () => {
      t = !0, n.then((r) => r());
    };
  }, []);
};
var ld = (e) => {
  throw TypeError(e);
}, cd = (e, t, n) => t.has(e) || ld("Cannot " + n), _t = (e, t, n) => (cd(e, t, "read from private field"), n ? n.call(e) : t.get(e)), ud = (e, t, n) => t.has(e) ? ld("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), ic = (e, t, n, r) => (cd(e, t, "write to private field"), t.set(e, n), n), On = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, sc = {};
/*!
 *  howler.js v2.2.4
 *  howlerjs.com
 *
 *  (c) 2013-2020, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */
var lc;
function K1() {
  return lc || (lc = 1, function(e) {
    (function() {
      var t = function() {
        this.init();
      };
      t.prototype = {
        /**
         * Initialize the global Howler object.
         * @return {Howler}
         */
        init: function() {
          var i = this || n;
          return i._counter = 1e3, i._html5AudioPool = [], i.html5PoolSize = 10, i._codecs = {}, i._howls = [], i._muted = !1, i._volume = 1, i._canPlayEvent = "canplaythrough", i._navigator = typeof window < "u" && window.navigator ? window.navigator : null, i.masterGain = null, i.noAudio = !1, i.usingWebAudio = !0, i.autoSuspend = !0, i.ctx = null, i.autoUnlock = !0, i._setup(), i;
        },
        /**
         * Get/set the global volume for all sounds.
         * @param  {Float} vol Volume from 0.0 to 1.0.
         * @return {Howler/Float}     Returns self or current volume.
         */
        volume: function(i) {
          var l = this || n;
          if (i = parseFloat(i), l.ctx || m(), typeof i < "u" && i >= 0 && i <= 1) {
            if (l._volume = i, l._muted)
              return l;
            l.usingWebAudio && l.masterGain.gain.setValueAtTime(i, n.ctx.currentTime);
            for (var f = 0; f < l._howls.length; f++)
              if (!l._howls[f]._webAudio)
                for (var g = l._howls[f]._getSoundIds(), p = 0; p < g.length; p++) {
                  var h = l._howls[f]._soundById(g[p]);
                  h && h._node && (h._node.volume = h._volume * i);
                }
            return l;
          }
          return l._volume;
        },
        /**
         * Handle muting and unmuting globally.
         * @param  {Boolean} muted Is muted or not.
         */
        mute: function(i) {
          var l = this || n;
          l.ctx || m(), l._muted = i, l.usingWebAudio && l.masterGain.gain.setValueAtTime(i ? 0 : l._volume, n.ctx.currentTime);
          for (var f = 0; f < l._howls.length; f++)
            if (!l._howls[f]._webAudio)
              for (var g = l._howls[f]._getSoundIds(), p = 0; p < g.length; p++) {
                var h = l._howls[f]._soundById(g[p]);
                h && h._node && (h._node.muted = i ? !0 : h._muted);
              }
          return l;
        },
        /**
         * Handle stopping all sounds globally.
         */
        stop: function() {
          for (var i = this || n, l = 0; l < i._howls.length; l++)
            i._howls[l].stop();
          return i;
        },
        /**
         * Unload and destroy all currently loaded Howl objects.
         * @return {Howler}
         */
        unload: function() {
          for (var i = this || n, l = i._howls.length - 1; l >= 0; l--)
            i._howls[l].unload();
          return i.usingWebAudio && i.ctx && typeof i.ctx.close < "u" && (i.ctx.close(), i.ctx = null, m()), i;
        },
        /**
         * Check for codec support of specific extension.
         * @param  {String} ext Audio file extention.
         * @return {Boolean}
         */
        codecs: function(i) {
          return (this || n)._codecs[i.replace(/^x-/, "")];
        },
        /**
         * Setup various state values for global tracking.
         * @return {Howler}
         */
        _setup: function() {
          var i = this || n;
          if (i.state = i.ctx && i.ctx.state || "suspended", i._autoSuspend(), !i.usingWebAudio)
            if (typeof Audio < "u")
              try {
                var l = new Audio();
                typeof l.oncanplaythrough > "u" && (i._canPlayEvent = "canplay");
              } catch {
                i.noAudio = !0;
              }
            else
              i.noAudio = !0;
          try {
            var l = new Audio();
            l.muted && (i.noAudio = !0);
          } catch {
          }
          return i.noAudio || i._setupCodecs(), i;
        },
        /**
         * Check for browser support for various codecs and cache the results.
         * @return {Howler}
         */
        _setupCodecs: function() {
          var i = this || n, l = null;
          try {
            l = typeof Audio < "u" ? new Audio() : null;
          } catch {
            return i;
          }
          if (!l || typeof l.canPlayType != "function")
            return i;
          var f = l.canPlayType("audio/mpeg;").replace(/^no$/, ""), g = i._navigator ? i._navigator.userAgent : "", p = g.match(/OPR\/(\d+)/g), h = p && parseInt(p[0].split("/")[1], 10) < 33, y = g.indexOf("Safari") !== -1 && g.indexOf("Chrome") === -1, w = g.match(/Version\/(.*?) /), x = y && w && parseInt(w[1], 10) < 15;
          return i._codecs = {
            mp3: !!(!h && (f || l.canPlayType("audio/mp3;").replace(/^no$/, ""))),
            mpeg: !!f,
            opus: !!l.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ""),
            ogg: !!l.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
            oga: !!l.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
            wav: !!(l.canPlayType('audio/wav; codecs="1"') || l.canPlayType("audio/wav")).replace(/^no$/, ""),
            aac: !!l.canPlayType("audio/aac;").replace(/^no$/, ""),
            caf: !!l.canPlayType("audio/x-caf;").replace(/^no$/, ""),
            m4a: !!(l.canPlayType("audio/x-m4a;") || l.canPlayType("audio/m4a;") || l.canPlayType("audio/aac;")).replace(/^no$/, ""),
            m4b: !!(l.canPlayType("audio/x-m4b;") || l.canPlayType("audio/m4b;") || l.canPlayType("audio/aac;")).replace(/^no$/, ""),
            mp4: !!(l.canPlayType("audio/x-mp4;") || l.canPlayType("audio/mp4;") || l.canPlayType("audio/aac;")).replace(/^no$/, ""),
            weba: !!(!x && l.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, "")),
            webm: !!(!x && l.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, "")),
            dolby: !!l.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/, ""),
            flac: !!(l.canPlayType("audio/x-flac;") || l.canPlayType("audio/flac;")).replace(/^no$/, "")
          }, i;
        },
        /**
         * Some browsers/devices will only allow audio to be played after a user interaction.
         * Attempt to automatically unlock audio on the first user interaction.
         * Concept from: http://paulbakaus.com/tutorials/html5/web-audio-on-ios/
         * @return {Howler}
         */
        _unlockAudio: function() {
          var i = this || n;
          if (!(i._audioUnlocked || !i.ctx)) {
            i._audioUnlocked = !1, i.autoUnlock = !1, !i._mobileUnloaded && i.ctx.sampleRate !== 44100 && (i._mobileUnloaded = !0, i.unload()), i._scratchBuffer = i.ctx.createBuffer(1, 1, 22050);
            var l = function(f) {
              for (; i._html5AudioPool.length < i.html5PoolSize; )
                try {
                  var g = new Audio();
                  g._unlocked = !0, i._releaseHtml5Audio(g);
                } catch {
                  i.noAudio = !0;
                  break;
                }
              for (var p = 0; p < i._howls.length; p++)
                if (!i._howls[p]._webAudio)
                  for (var h = i._howls[p]._getSoundIds(), y = 0; y < h.length; y++) {
                    var w = i._howls[p]._soundById(h[y]);
                    w && w._node && !w._node._unlocked && (w._node._unlocked = !0, w._node.load());
                  }
              i._autoResume();
              var x = i.ctx.createBufferSource();
              x.buffer = i._scratchBuffer, x.connect(i.ctx.destination), typeof x.start > "u" ? x.noteOn(0) : x.start(0), typeof i.ctx.resume == "function" && i.ctx.resume(), x.onended = function() {
                x.disconnect(0), i._audioUnlocked = !0, document.removeEventListener("touchstart", l, !0), document.removeEventListener("touchend", l, !0), document.removeEventListener("click", l, !0), document.removeEventListener("keydown", l, !0);
                for (var O = 0; O < i._howls.length; O++)
                  i._howls[O]._emit("unlock");
              };
            };
            return document.addEventListener("touchstart", l, !0), document.addEventListener("touchend", l, !0), document.addEventListener("click", l, !0), document.addEventListener("keydown", l, !0), i;
          }
        },
        /**
         * Get an unlocked HTML5 Audio object from the pool. If none are left,
         * return a new Audio object and throw a warning.
         * @return {Audio} HTML5 Audio object.
         */
        _obtainHtml5Audio: function() {
          var i = this || n;
          if (i._html5AudioPool.length)
            return i._html5AudioPool.pop();
          var l = new Audio().play();
          return l && typeof Promise < "u" && (l instanceof Promise || typeof l.then == "function") && l.catch(function() {
            console.warn("HTML5 Audio pool exhausted, returning potentially locked audio object.");
          }), new Audio();
        },
        /**
         * Return an activated HTML5 Audio object to the pool.
         * @return {Howler}
         */
        _releaseHtml5Audio: function(i) {
          var l = this || n;
          return i._unlocked && l._html5AudioPool.push(i), l;
        },
        /**
         * Automatically suspend the Web Audio AudioContext after no sound has played for 30 seconds.
         * This saves processing/energy and fixes various browser-specific bugs with audio getting stuck.
         * @return {Howler}
         */
        _autoSuspend: function() {
          var i = this;
          if (!(!i.autoSuspend || !i.ctx || typeof i.ctx.suspend > "u" || !n.usingWebAudio)) {
            for (var l = 0; l < i._howls.length; l++)
              if (i._howls[l]._webAudio) {
                for (var f = 0; f < i._howls[l]._sounds.length; f++)
                  if (!i._howls[l]._sounds[f]._paused)
                    return i;
              }
            return i._suspendTimer && clearTimeout(i._suspendTimer), i._suspendTimer = setTimeout(function() {
              if (i.autoSuspend) {
                i._suspendTimer = null, i.state = "suspending";
                var g = function() {
                  i.state = "suspended", i._resumeAfterSuspend && (delete i._resumeAfterSuspend, i._autoResume());
                };
                i.ctx.suspend().then(g, g);
              }
            }, 3e4), i;
          }
        },
        /**
         * Automatically resume the Web Audio AudioContext when a new sound is played.
         * @return {Howler}
         */
        _autoResume: function() {
          var i = this;
          if (!(!i.ctx || typeof i.ctx.resume > "u" || !n.usingWebAudio))
            return i.state === "running" && i.ctx.state !== "interrupted" && i._suspendTimer ? (clearTimeout(i._suspendTimer), i._suspendTimer = null) : i.state === "suspended" || i.state === "running" && i.ctx.state === "interrupted" ? (i.ctx.resume().then(function() {
              i.state = "running";
              for (var l = 0; l < i._howls.length; l++)
                i._howls[l]._emit("resume");
            }), i._suspendTimer && (clearTimeout(i._suspendTimer), i._suspendTimer = null)) : i.state === "suspending" && (i._resumeAfterSuspend = !0), i;
        }
      };
      var n = new t(), r = function(i) {
        var l = this;
        if (!i.src || i.src.length === 0) {
          console.error("An array of source files must be passed with any new Howl.");
          return;
        }
        l.init(i);
      };
      r.prototype = {
        /**
         * Initialize a new Howl group object.
         * @param  {Object} o Passed in properties for this group.
         * @return {Howl}
         */
        init: function(i) {
          var l = this;
          return n.ctx || m(), l._autoplay = i.autoplay || !1, l._format = typeof i.format != "string" ? i.format : [i.format], l._html5 = i.html5 || !1, l._muted = i.mute || !1, l._loop = i.loop || !1, l._pool = i.pool || 5, l._preload = typeof i.preload == "boolean" || i.preload === "metadata" ? i.preload : !0, l._rate = i.rate || 1, l._sprite = i.sprite || {}, l._src = typeof i.src != "string" ? i.src : [i.src], l._volume = i.volume !== void 0 ? i.volume : 1, l._xhr = {
            method: i.xhr && i.xhr.method ? i.xhr.method : "GET",
            headers: i.xhr && i.xhr.headers ? i.xhr.headers : null,
            withCredentials: i.xhr && i.xhr.withCredentials ? i.xhr.withCredentials : !1
          }, l._duration = 0, l._state = "unloaded", l._sounds = [], l._endTimers = {}, l._queue = [], l._playLock = !1, l._onend = i.onend ? [{ fn: i.onend }] : [], l._onfade = i.onfade ? [{ fn: i.onfade }] : [], l._onload = i.onload ? [{ fn: i.onload }] : [], l._onloaderror = i.onloaderror ? [{ fn: i.onloaderror }] : [], l._onplayerror = i.onplayerror ? [{ fn: i.onplayerror }] : [], l._onpause = i.onpause ? [{ fn: i.onpause }] : [], l._onplay = i.onplay ? [{ fn: i.onplay }] : [], l._onstop = i.onstop ? [{ fn: i.onstop }] : [], l._onmute = i.onmute ? [{ fn: i.onmute }] : [], l._onvolume = i.onvolume ? [{ fn: i.onvolume }] : [], l._onrate = i.onrate ? [{ fn: i.onrate }] : [], l._onseek = i.onseek ? [{ fn: i.onseek }] : [], l._onunlock = i.onunlock ? [{ fn: i.onunlock }] : [], l._onresume = [], l._webAudio = n.usingWebAudio && !l._html5, typeof n.ctx < "u" && n.ctx && n.autoUnlock && n._unlockAudio(), n._howls.push(l), l._autoplay && l._queue.push({
            event: "play",
            action: function() {
              l.play();
            }
          }), l._preload && l._preload !== "none" && l.load(), l;
        },
        /**
         * Load the audio file.
         * @return {Howler}
         */
        load: function() {
          var i = this, l = null;
          if (n.noAudio) {
            i._emit("loaderror", null, "No audio support.");
            return;
          }
          typeof i._src == "string" && (i._src = [i._src]);
          for (var f = 0; f < i._src.length; f++) {
            var g, p;
            if (i._format && i._format[f])
              g = i._format[f];
            else {
              if (p = i._src[f], typeof p != "string") {
                i._emit("loaderror", null, "Non-string found in selected audio sources - ignoring.");
                continue;
              }
              g = /^data:audio\/([^;,]+);/i.exec(p), g || (g = /\.([^.]+)$/.exec(p.split("?", 1)[0])), g && (g = g[1].toLowerCase());
            }
            if (g || console.warn('No file extension was found. Consider using the "format" property or specify an extension.'), g && n.codecs(g)) {
              l = i._src[f];
              break;
            }
          }
          if (!l) {
            i._emit("loaderror", null, "No codec support for selected audio sources.");
            return;
          }
          return i._src = l, i._state = "loading", window.location.protocol === "https:" && l.slice(0, 5) === "http:" && (i._html5 = !0, i._webAudio = !1), new o(i), i._webAudio && s(i), i;
        },
        /**
         * Play a sound or resume previous playback.
         * @param  {String/Number} sprite   Sprite name for sprite playback or sound id to continue previous.
         * @param  {Boolean} internal Internal Use: true prevents event firing.
         * @return {Number}          Sound ID.
         */
        play: function(i, l) {
          var f = this, g = null;
          if (typeof i == "number")
            g = i, i = null;
          else {
            if (typeof i == "string" && f._state === "loaded" && !f._sprite[i])
              return null;
            if (typeof i > "u" && (i = "__default", !f._playLock)) {
              for (var p = 0, h = 0; h < f._sounds.length; h++)
                f._sounds[h]._paused && !f._sounds[h]._ended && (p++, g = f._sounds[h]._id);
              p === 1 ? i = null : g = null;
            }
          }
          var y = g ? f._soundById(g) : f._inactiveSound();
          if (!y)
            return null;
          if (g && !i && (i = y._sprite || "__default"), f._state !== "loaded") {
            y._sprite = i, y._ended = !1;
            var w = y._id;
            return f._queue.push({
              event: "play",
              action: function() {
                f.play(w);
              }
            }), w;
          }
          if (g && !y._paused)
            return l || f._loadQueue("play"), y._id;
          f._webAudio && n._autoResume();
          var x = Math.max(0, y._seek > 0 ? y._seek : f._sprite[i][0] / 1e3), O = Math.max(0, (f._sprite[i][0] + f._sprite[i][1]) / 1e3 - x), b = O * 1e3 / Math.abs(y._rate), G = f._sprite[i][0] / 1e3, z = (f._sprite[i][0] + f._sprite[i][1]) / 1e3;
          y._sprite = i, y._ended = !1;
          var K = function() {
            y._paused = !1, y._seek = x, y._start = G, y._stop = z, y._loop = !!(y._loop || f._sprite[i][2]);
          };
          if (x >= z) {
            f._ended(y);
            return;
          }
          var H = y._node;
          if (f._webAudio) {
            var ie = function() {
              f._playLock = !1, K(), f._refreshBuffer(y);
              var R = y._muted || f._muted ? 0 : y._volume;
              H.gain.setValueAtTime(R, n.ctx.currentTime), y._playStart = n.ctx.currentTime, typeof H.bufferSource.start > "u" ? y._loop ? H.bufferSource.noteGrainOn(0, x, 86400) : H.bufferSource.noteGrainOn(0, x, O) : y._loop ? H.bufferSource.start(0, x, 86400) : H.bufferSource.start(0, x, O), b !== 1 / 0 && (f._endTimers[y._id] = setTimeout(f._ended.bind(f, y), b)), l || setTimeout(function() {
                f._emit("play", y._id), f._loadQueue();
              }, 0);
            };
            n.state === "running" && n.ctx.state !== "interrupted" ? ie() : (f._playLock = !0, f.once("resume", ie), f._clearTimer(y._id));
          } else {
            var se = function() {
              H.currentTime = x, H.muted = y._muted || f._muted || n._muted || H.muted, H.volume = y._volume * n.volume(), H.playbackRate = y._rate;
              try {
                var R = H.play();
                if (R && typeof Promise < "u" && (R instanceof Promise || typeof R.then == "function") ? (f._playLock = !0, K(), R.then(function() {
                  f._playLock = !1, H._unlocked = !0, l ? f._loadQueue() : f._emit("play", y._id);
                }).catch(function() {
                  f._playLock = !1, f._emit("playerror", y._id, "Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction."), y._ended = !0, y._paused = !0;
                })) : l || (f._playLock = !1, K(), f._emit("play", y._id)), H.playbackRate = y._rate, H.paused) {
                  f._emit("playerror", y._id, "Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction.");
                  return;
                }
                i !== "__default" || y._loop ? f._endTimers[y._id] = setTimeout(f._ended.bind(f, y), b) : (f._endTimers[y._id] = function() {
                  f._ended(y), H.removeEventListener("ended", f._endTimers[y._id], !1);
                }, H.addEventListener("ended", f._endTimers[y._id], !1));
              } catch (S) {
                f._emit("playerror", y._id, S);
              }
            };
            H.src === "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA" && (H.src = f._src, H.load());
            var $ = window && window.ejecta || !H.readyState && n._navigator.isCocoonJS;
            if (H.readyState >= 3 || $)
              se();
            else {
              f._playLock = !0, f._state = "loading";
              var ue = function() {
                f._state = "loaded", se(), H.removeEventListener(n._canPlayEvent, ue, !1);
              };
              H.addEventListener(n._canPlayEvent, ue, !1), f._clearTimer(y._id);
            }
          }
          return y._id;
        },
        /**
         * Pause playback and save current position.
         * @param  {Number} id The sound ID (empty to pause all in group).
         * @return {Howl}
         */
        pause: function(i) {
          var l = this;
          if (l._state !== "loaded" || l._playLock)
            return l._queue.push({
              event: "pause",
              action: function() {
                l.pause(i);
              }
            }), l;
          for (var f = l._getSoundIds(i), g = 0; g < f.length; g++) {
            l._clearTimer(f[g]);
            var p = l._soundById(f[g]);
            if (p && !p._paused && (p._seek = l.seek(f[g]), p._rateSeek = 0, p._paused = !0, l._stopFade(f[g]), p._node))
              if (l._webAudio) {
                if (!p._node.bufferSource)
                  continue;
                typeof p._node.bufferSource.stop > "u" ? p._node.bufferSource.noteOff(0) : p._node.bufferSource.stop(0), l._cleanBuffer(p._node);
              } else (!isNaN(p._node.duration) || p._node.duration === 1 / 0) && p._node.pause();
            arguments[1] || l._emit("pause", p ? p._id : null);
          }
          return l;
        },
        /**
         * Stop playback and reset to start.
         * @param  {Number} id The sound ID (empty to stop all in group).
         * @param  {Boolean} internal Internal Use: true prevents event firing.
         * @return {Howl}
         */
        stop: function(i, l) {
          var f = this;
          if (f._state !== "loaded" || f._playLock)
            return f._queue.push({
              event: "stop",
              action: function() {
                f.stop(i);
              }
            }), f;
          for (var g = f._getSoundIds(i), p = 0; p < g.length; p++) {
            f._clearTimer(g[p]);
            var h = f._soundById(g[p]);
            h && (h._seek = h._start || 0, h._rateSeek = 0, h._paused = !0, h._ended = !0, f._stopFade(g[p]), h._node && (f._webAudio ? h._node.bufferSource && (typeof h._node.bufferSource.stop > "u" ? h._node.bufferSource.noteOff(0) : h._node.bufferSource.stop(0), f._cleanBuffer(h._node)) : (!isNaN(h._node.duration) || h._node.duration === 1 / 0) && (h._node.currentTime = h._start || 0, h._node.pause(), h._node.duration === 1 / 0 && f._clearSound(h._node))), l || f._emit("stop", h._id));
          }
          return f;
        },
        /**
         * Mute/unmute a single sound or all sounds in this Howl group.
         * @param  {Boolean} muted Set to true to mute and false to unmute.
         * @param  {Number} id    The sound ID to update (omit to mute/unmute all).
         * @return {Howl}
         */
        mute: function(i, l) {
          var f = this;
          if (f._state !== "loaded" || f._playLock)
            return f._queue.push({
              event: "mute",
              action: function() {
                f.mute(i, l);
              }
            }), f;
          if (typeof l > "u")
            if (typeof i == "boolean")
              f._muted = i;
            else
              return f._muted;
          for (var g = f._getSoundIds(l), p = 0; p < g.length; p++) {
            var h = f._soundById(g[p]);
            h && (h._muted = i, h._interval && f._stopFade(h._id), f._webAudio && h._node ? h._node.gain.setValueAtTime(i ? 0 : h._volume, n.ctx.currentTime) : h._node && (h._node.muted = n._muted ? !0 : i), f._emit("mute", h._id));
          }
          return f;
        },
        /**
         * Get/set the volume of this sound or of the Howl group. This method can optionally take 0, 1 or 2 arguments.
         *   volume() -> Returns the group's volume value.
         *   volume(id) -> Returns the sound id's current volume.
         *   volume(vol) -> Sets the volume of all sounds in this Howl group.
         *   volume(vol, id) -> Sets the volume of passed sound id.
         * @return {Howl/Number} Returns self or current volume.
         */
        volume: function() {
          var i = this, l = arguments, f, g;
          if (l.length === 0)
            return i._volume;
          if (l.length === 1 || l.length === 2 && typeof l[1] > "u") {
            var p = i._getSoundIds(), h = p.indexOf(l[0]);
            h >= 0 ? g = parseInt(l[0], 10) : f = parseFloat(l[0]);
          } else l.length >= 2 && (f = parseFloat(l[0]), g = parseInt(l[1], 10));
          var y;
          if (typeof f < "u" && f >= 0 && f <= 1) {
            if (i._state !== "loaded" || i._playLock)
              return i._queue.push({
                event: "volume",
                action: function() {
                  i.volume.apply(i, l);
                }
              }), i;
            typeof g > "u" && (i._volume = f), g = i._getSoundIds(g);
            for (var w = 0; w < g.length; w++)
              y = i._soundById(g[w]), y && (y._volume = f, l[2] || i._stopFade(g[w]), i._webAudio && y._node && !y._muted ? y._node.gain.setValueAtTime(f, n.ctx.currentTime) : y._node && !y._muted && (y._node.volume = f * n.volume()), i._emit("volume", y._id));
          } else
            return y = g ? i._soundById(g) : i._sounds[0], y ? y._volume : 0;
          return i;
        },
        /**
         * Fade a currently playing sound between two volumes (if no id is passed, all sounds will fade).
         * @param  {Number} from The value to fade from (0.0 to 1.0).
         * @param  {Number} to   The volume to fade to (0.0 to 1.0).
         * @param  {Number} len  Time in milliseconds to fade.
         * @param  {Number} id   The sound id (omit to fade all sounds).
         * @return {Howl}
         */
        fade: function(i, l, f, g) {
          var p = this;
          if (p._state !== "loaded" || p._playLock)
            return p._queue.push({
              event: "fade",
              action: function() {
                p.fade(i, l, f, g);
              }
            }), p;
          i = Math.min(Math.max(0, parseFloat(i)), 1), l = Math.min(Math.max(0, parseFloat(l)), 1), f = parseFloat(f), p.volume(i, g);
          for (var h = p._getSoundIds(g), y = 0; y < h.length; y++) {
            var w = p._soundById(h[y]);
            if (w) {
              if (g || p._stopFade(h[y]), p._webAudio && !w._muted) {
                var x = n.ctx.currentTime, O = x + f / 1e3;
                w._volume = i, w._node.gain.setValueAtTime(i, x), w._node.gain.linearRampToValueAtTime(l, O);
              }
              p._startFadeInterval(w, i, l, f, h[y], typeof g > "u");
            }
          }
          return p;
        },
        /**
         * Starts the internal interval to fade a sound.
         * @param  {Object} sound Reference to sound to fade.
         * @param  {Number} from The value to fade from (0.0 to 1.0).
         * @param  {Number} to   The volume to fade to (0.0 to 1.0).
         * @param  {Number} len  Time in milliseconds to fade.
         * @param  {Number} id   The sound id to fade.
         * @param  {Boolean} isGroup   If true, set the volume on the group.
         */
        _startFadeInterval: function(i, l, f, g, p, h) {
          var y = this, w = l, x = f - l, O = Math.abs(x / 0.01), b = Math.max(4, O > 0 ? g / O : g), G = Date.now();
          i._fadeTo = f, i._interval = setInterval(function() {
            var z = (Date.now() - G) / g;
            G = Date.now(), w += x * z, w = Math.round(w * 100) / 100, x < 0 ? w = Math.max(f, w) : w = Math.min(f, w), y._webAudio ? i._volume = w : y.volume(w, i._id, !0), h && (y._volume = w), (f < l && w <= f || f > l && w >= f) && (clearInterval(i._interval), i._interval = null, i._fadeTo = null, y.volume(f, i._id), y._emit("fade", i._id));
          }, b);
        },
        /**
         * Internal method that stops the currently playing fade when
         * a new fade starts, volume is changed or the sound is stopped.
         * @param  {Number} id The sound id.
         * @return {Howl}
         */
        _stopFade: function(i) {
          var l = this, f = l._soundById(i);
          return f && f._interval && (l._webAudio && f._node.gain.cancelScheduledValues(n.ctx.currentTime), clearInterval(f._interval), f._interval = null, l.volume(f._fadeTo, i), f._fadeTo = null, l._emit("fade", i)), l;
        },
        /**
         * Get/set the loop parameter on a sound. This method can optionally take 0, 1 or 2 arguments.
         *   loop() -> Returns the group's loop value.
         *   loop(id) -> Returns the sound id's loop value.
         *   loop(loop) -> Sets the loop value for all sounds in this Howl group.
         *   loop(loop, id) -> Sets the loop value of passed sound id.
         * @return {Howl/Boolean} Returns self or current loop value.
         */
        loop: function() {
          var i = this, l = arguments, f, g, p;
          if (l.length === 0)
            return i._loop;
          if (l.length === 1)
            if (typeof l[0] == "boolean")
              f = l[0], i._loop = f;
            else
              return p = i._soundById(parseInt(l[0], 10)), p ? p._loop : !1;
          else l.length === 2 && (f = l[0], g = parseInt(l[1], 10));
          for (var h = i._getSoundIds(g), y = 0; y < h.length; y++)
            p = i._soundById(h[y]), p && (p._loop = f, i._webAudio && p._node && p._node.bufferSource && (p._node.bufferSource.loop = f, f && (p._node.bufferSource.loopStart = p._start || 0, p._node.bufferSource.loopEnd = p._stop, i.playing(h[y]) && (i.pause(h[y], !0), i.play(h[y], !0)))));
          return i;
        },
        /**
         * Get/set the playback rate of a sound. This method can optionally take 0, 1 or 2 arguments.
         *   rate() -> Returns the first sound node's current playback rate.
         *   rate(id) -> Returns the sound id's current playback rate.
         *   rate(rate) -> Sets the playback rate of all sounds in this Howl group.
         *   rate(rate, id) -> Sets the playback rate of passed sound id.
         * @return {Howl/Number} Returns self or the current playback rate.
         */
        rate: function() {
          var i = this, l = arguments, f, g;
          if (l.length === 0)
            g = i._sounds[0]._id;
          else if (l.length === 1) {
            var p = i._getSoundIds(), h = p.indexOf(l[0]);
            h >= 0 ? g = parseInt(l[0], 10) : f = parseFloat(l[0]);
          } else l.length === 2 && (f = parseFloat(l[0]), g = parseInt(l[1], 10));
          var y;
          if (typeof f == "number") {
            if (i._state !== "loaded" || i._playLock)
              return i._queue.push({
                event: "rate",
                action: function() {
                  i.rate.apply(i, l);
                }
              }), i;
            typeof g > "u" && (i._rate = f), g = i._getSoundIds(g);
            for (var w = 0; w < g.length; w++)
              if (y = i._soundById(g[w]), y) {
                i.playing(g[w]) && (y._rateSeek = i.seek(g[w]), y._playStart = i._webAudio ? n.ctx.currentTime : y._playStart), y._rate = f, i._webAudio && y._node && y._node.bufferSource ? y._node.bufferSource.playbackRate.setValueAtTime(f, n.ctx.currentTime) : y._node && (y._node.playbackRate = f);
                var x = i.seek(g[w]), O = (i._sprite[y._sprite][0] + i._sprite[y._sprite][1]) / 1e3 - x, b = O * 1e3 / Math.abs(y._rate);
                (i._endTimers[g[w]] || !y._paused) && (i._clearTimer(g[w]), i._endTimers[g[w]] = setTimeout(i._ended.bind(i, y), b)), i._emit("rate", y._id);
              }
          } else
            return y = i._soundById(g), y ? y._rate : i._rate;
          return i;
        },
        /**
         * Get/set the seek position of a sound. This method can optionally take 0, 1 or 2 arguments.
         *   seek() -> Returns the first sound node's current seek position.
         *   seek(id) -> Returns the sound id's current seek position.
         *   seek(seek) -> Sets the seek position of the first sound node.
         *   seek(seek, id) -> Sets the seek position of passed sound id.
         * @return {Howl/Number} Returns self or the current seek position.
         */
        seek: function() {
          var i = this, l = arguments, f, g;
          if (l.length === 0)
            i._sounds.length && (g = i._sounds[0]._id);
          else if (l.length === 1) {
            var p = i._getSoundIds(), h = p.indexOf(l[0]);
            h >= 0 ? g = parseInt(l[0], 10) : i._sounds.length && (g = i._sounds[0]._id, f = parseFloat(l[0]));
          } else l.length === 2 && (f = parseFloat(l[0]), g = parseInt(l[1], 10));
          if (typeof g > "u")
            return 0;
          if (typeof f == "number" && (i._state !== "loaded" || i._playLock))
            return i._queue.push({
              event: "seek",
              action: function() {
                i.seek.apply(i, l);
              }
            }), i;
          var y = i._soundById(g);
          if (y)
            if (typeof f == "number" && f >= 0) {
              var w = i.playing(g);
              w && i.pause(g, !0), y._seek = f, y._ended = !1, i._clearTimer(g), !i._webAudio && y._node && !isNaN(y._node.duration) && (y._node.currentTime = f);
              var x = function() {
                w && i.play(g, !0), i._emit("seek", g);
              };
              if (w && !i._webAudio) {
                var O = function() {
                  i._playLock ? setTimeout(O, 0) : x();
                };
                setTimeout(O, 0);
              } else
                x();
            } else if (i._webAudio) {
              var b = i.playing(g) ? n.ctx.currentTime - y._playStart : 0, G = y._rateSeek ? y._rateSeek - y._seek : 0;
              return y._seek + (G + b * Math.abs(y._rate));
            } else
              return y._node.currentTime;
          return i;
        },
        /**
         * Check if a specific sound is currently playing or not (if id is provided), or check if at least one of the sounds in the group is playing or not.
         * @param  {Number}  id The sound id to check. If none is passed, the whole sound group is checked.
         * @return {Boolean} True if playing and false if not.
         */
        playing: function(i) {
          var l = this;
          if (typeof i == "number") {
            var f = l._soundById(i);
            return f ? !f._paused : !1;
          }
          for (var g = 0; g < l._sounds.length; g++)
            if (!l._sounds[g]._paused)
              return !0;
          return !1;
        },
        /**
         * Get the duration of this sound. Passing a sound id will return the sprite duration.
         * @param  {Number} id The sound id to check. If none is passed, return full source duration.
         * @return {Number} Audio duration in seconds.
         */
        duration: function(i) {
          var l = this, f = l._duration, g = l._soundById(i);
          return g && (f = l._sprite[g._sprite][1] / 1e3), f;
        },
        /**
         * Returns the current loaded state of this Howl.
         * @return {String} 'unloaded', 'loading', 'loaded'
         */
        state: function() {
          return this._state;
        },
        /**
         * Unload and destroy the current Howl object.
         * This will immediately stop all sound instances attached to this group.
         */
        unload: function() {
          for (var i = this, l = i._sounds, f = 0; f < l.length; f++)
            l[f]._paused || i.stop(l[f]._id), i._webAudio || (i._clearSound(l[f]._node), l[f]._node.removeEventListener("error", l[f]._errorFn, !1), l[f]._node.removeEventListener(n._canPlayEvent, l[f]._loadFn, !1), l[f]._node.removeEventListener("ended", l[f]._endFn, !1), n._releaseHtml5Audio(l[f]._node)), delete l[f]._node, i._clearTimer(l[f]._id);
          var g = n._howls.indexOf(i);
          g >= 0 && n._howls.splice(g, 1);
          var p = !0;
          for (f = 0; f < n._howls.length; f++)
            if (n._howls[f]._src === i._src || i._src.indexOf(n._howls[f]._src) >= 0) {
              p = !1;
              break;
            }
          return a && p && delete a[i._src], n.noAudio = !1, i._state = "unloaded", i._sounds = [], i = null, null;
        },
        /**
         * Listen to a custom event.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to call.
         * @param  {Number}   id    (optional) Only listen to events for this sound.
         * @param  {Number}   once  (INTERNAL) Marks event to fire only once.
         * @return {Howl}
         */
        on: function(i, l, f, g) {
          var p = this, h = p["_on" + i];
          return typeof l == "function" && h.push(g ? { id: f, fn: l, once: g } : { id: f, fn: l }), p;
        },
        /**
         * Remove a custom event. Call without parameters to remove all events.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to remove. Leave empty to remove all.
         * @param  {Number}   id    (optional) Only remove events for this sound.
         * @return {Howl}
         */
        off: function(i, l, f) {
          var g = this, p = g["_on" + i], h = 0;
          if (typeof l == "number" && (f = l, l = null), l || f)
            for (h = 0; h < p.length; h++) {
              var y = f === p[h].id;
              if (l === p[h].fn && y || !l && y) {
                p.splice(h, 1);
                break;
              }
            }
          else if (i)
            g["_on" + i] = [];
          else {
            var w = Object.keys(g);
            for (h = 0; h < w.length; h++)
              w[h].indexOf("_on") === 0 && Array.isArray(g[w[h]]) && (g[w[h]] = []);
          }
          return g;
        },
        /**
         * Listen to a custom event and remove it once fired.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to call.
         * @param  {Number}   id    (optional) Only listen to events for this sound.
         * @return {Howl}
         */
        once: function(i, l, f) {
          var g = this;
          return g.on(i, l, f, 1), g;
        },
        /**
         * Emit all events of a specific type and pass the sound id.
         * @param  {String} event Event name.
         * @param  {Number} id    Sound ID.
         * @param  {Number} msg   Message to go with event.
         * @return {Howl}
         */
        _emit: function(i, l, f) {
          for (var g = this, p = g["_on" + i], h = p.length - 1; h >= 0; h--)
            (!p[h].id || p[h].id === l || i === "load") && (setTimeout((function(y) {
              y.call(this, l, f);
            }).bind(g, p[h].fn), 0), p[h].once && g.off(i, p[h].fn, p[h].id));
          return g._loadQueue(i), g;
        },
        /**
         * Queue of actions initiated before the sound has loaded.
         * These will be called in sequence, with the next only firing
         * after the previous has finished executing (even if async like play).
         * @return {Howl}
         */
        _loadQueue: function(i) {
          var l = this;
          if (l._queue.length > 0) {
            var f = l._queue[0];
            f.event === i && (l._queue.shift(), l._loadQueue()), i || f.action();
          }
          return l;
        },
        /**
         * Fired when playback ends at the end of the duration.
         * @param  {Sound} sound The sound object to work with.
         * @return {Howl}
         */
        _ended: function(i) {
          var l = this, f = i._sprite;
          if (!l._webAudio && i._node && !i._node.paused && !i._node.ended && i._node.currentTime < i._stop)
            return setTimeout(l._ended.bind(l, i), 100), l;
          var g = !!(i._loop || l._sprite[f][2]);
          if (l._emit("end", i._id), !l._webAudio && g && l.stop(i._id, !0).play(i._id), l._webAudio && g) {
            l._emit("play", i._id), i._seek = i._start || 0, i._rateSeek = 0, i._playStart = n.ctx.currentTime;
            var p = (i._stop - i._start) * 1e3 / Math.abs(i._rate);
            l._endTimers[i._id] = setTimeout(l._ended.bind(l, i), p);
          }
          return l._webAudio && !g && (i._paused = !0, i._ended = !0, i._seek = i._start || 0, i._rateSeek = 0, l._clearTimer(i._id), l._cleanBuffer(i._node), n._autoSuspend()), !l._webAudio && !g && l.stop(i._id, !0), l;
        },
        /**
         * Clear the end timer for a sound playback.
         * @param  {Number} id The sound ID.
         * @return {Howl}
         */
        _clearTimer: function(i) {
          var l = this;
          if (l._endTimers[i]) {
            if (typeof l._endTimers[i] != "function")
              clearTimeout(l._endTimers[i]);
            else {
              var f = l._soundById(i);
              f && f._node && f._node.removeEventListener("ended", l._endTimers[i], !1);
            }
            delete l._endTimers[i];
          }
          return l;
        },
        /**
         * Return the sound identified by this ID, or return null.
         * @param  {Number} id Sound ID
         * @return {Object}    Sound object or null.
         */
        _soundById: function(i) {
          for (var l = this, f = 0; f < l._sounds.length; f++)
            if (i === l._sounds[f]._id)
              return l._sounds[f];
          return null;
        },
        /**
         * Return an inactive sound from the pool or create a new one.
         * @return {Sound} Sound playback object.
         */
        _inactiveSound: function() {
          var i = this;
          i._drain();
          for (var l = 0; l < i._sounds.length; l++)
            if (i._sounds[l]._ended)
              return i._sounds[l].reset();
          return new o(i);
        },
        /**
         * Drain excess inactive sounds from the pool.
         */
        _drain: function() {
          var i = this, l = i._pool, f = 0, g = 0;
          if (!(i._sounds.length < l)) {
            for (g = 0; g < i._sounds.length; g++)
              i._sounds[g]._ended && f++;
            for (g = i._sounds.length - 1; g >= 0; g--) {
              if (f <= l)
                return;
              i._sounds[g]._ended && (i._webAudio && i._sounds[g]._node && i._sounds[g]._node.disconnect(0), i._sounds.splice(g, 1), f--);
            }
          }
        },
        /**
         * Get all ID's from the sounds pool.
         * @param  {Number} id Only return one ID if one is passed.
         * @return {Array}    Array of IDs.
         */
        _getSoundIds: function(i) {
          var l = this;
          if (typeof i > "u") {
            for (var f = [], g = 0; g < l._sounds.length; g++)
              f.push(l._sounds[g]._id);
            return f;
          } else
            return [i];
        },
        /**
         * Load the sound back into the buffer source.
         * @param  {Sound} sound The sound object to work with.
         * @return {Howl}
         */
        _refreshBuffer: function(i) {
          var l = this;
          return i._node.bufferSource = n.ctx.createBufferSource(), i._node.bufferSource.buffer = a[l._src], i._panner ? i._node.bufferSource.connect(i._panner) : i._node.bufferSource.connect(i._node), i._node.bufferSource.loop = i._loop, i._loop && (i._node.bufferSource.loopStart = i._start || 0, i._node.bufferSource.loopEnd = i._stop || 0), i._node.bufferSource.playbackRate.setValueAtTime(i._rate, n.ctx.currentTime), l;
        },
        /**
         * Prevent memory leaks by cleaning up the buffer source after playback.
         * @param  {Object} node Sound's audio node containing the buffer source.
         * @return {Howl}
         */
        _cleanBuffer: function(i) {
          var l = this, f = n._navigator && n._navigator.vendor.indexOf("Apple") >= 0;
          if (!i.bufferSource)
            return l;
          if (n._scratchBuffer && i.bufferSource && (i.bufferSource.onended = null, i.bufferSource.disconnect(0), f))
            try {
              i.bufferSource.buffer = n._scratchBuffer;
            } catch {
            }
          return i.bufferSource = null, l;
        },
        /**
         * Set the source to a 0-second silence to stop any downloading (except in IE).
         * @param  {Object} node Audio node to clear.
         */
        _clearSound: function(i) {
          var l = /MSIE |Trident\//.test(n._navigator && n._navigator.userAgent);
          l || (i.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        }
      };
      var o = function(i) {
        this._parent = i, this.init();
      };
      o.prototype = {
        /**
         * Initialize a new Sound object.
         * @return {Sound}
         */
        init: function() {
          var i = this, l = i._parent;
          return i._muted = l._muted, i._loop = l._loop, i._volume = l._volume, i._rate = l._rate, i._seek = 0, i._paused = !0, i._ended = !0, i._sprite = "__default", i._id = ++n._counter, l._sounds.push(i), i.create(), i;
        },
        /**
         * Create and setup a new sound object, whether HTML5 Audio or Web Audio.
         * @return {Sound}
         */
        create: function() {
          var i = this, l = i._parent, f = n._muted || i._muted || i._parent._muted ? 0 : i._volume;
          return l._webAudio ? (i._node = typeof n.ctx.createGain > "u" ? n.ctx.createGainNode() : n.ctx.createGain(), i._node.gain.setValueAtTime(f, n.ctx.currentTime), i._node.paused = !0, i._node.connect(n.masterGain)) : n.noAudio || (i._node = n._obtainHtml5Audio(), i._errorFn = i._errorListener.bind(i), i._node.addEventListener("error", i._errorFn, !1), i._loadFn = i._loadListener.bind(i), i._node.addEventListener(n._canPlayEvent, i._loadFn, !1), i._endFn = i._endListener.bind(i), i._node.addEventListener("ended", i._endFn, !1), i._node.src = l._src, i._node.preload = l._preload === !0 ? "auto" : l._preload, i._node.volume = f * n.volume(), i._node.load()), i;
        },
        /**
         * Reset the parameters of this sound to the original state (for recycle).
         * @return {Sound}
         */
        reset: function() {
          var i = this, l = i._parent;
          return i._muted = l._muted, i._loop = l._loop, i._volume = l._volume, i._rate = l._rate, i._seek = 0, i._rateSeek = 0, i._paused = !0, i._ended = !0, i._sprite = "__default", i._id = ++n._counter, i;
        },
        /**
         * HTML5 Audio error listener callback.
         */
        _errorListener: function() {
          var i = this;
          i._parent._emit("loaderror", i._id, i._node.error ? i._node.error.code : 0), i._node.removeEventListener("error", i._errorFn, !1);
        },
        /**
         * HTML5 Audio canplaythrough listener callback.
         */
        _loadListener: function() {
          var i = this, l = i._parent;
          l._duration = Math.ceil(i._node.duration * 10) / 10, Object.keys(l._sprite).length === 0 && (l._sprite = { __default: [0, l._duration * 1e3] }), l._state !== "loaded" && (l._state = "loaded", l._emit("load"), l._loadQueue()), i._node.removeEventListener(n._canPlayEvent, i._loadFn, !1);
        },
        /**
         * HTML5 Audio ended listener callback.
         */
        _endListener: function() {
          var i = this, l = i._parent;
          l._duration === 1 / 0 && (l._duration = Math.ceil(i._node.duration * 10) / 10, l._sprite.__default[1] === 1 / 0 && (l._sprite.__default[1] = l._duration * 1e3), l._ended(i)), i._node.removeEventListener("ended", i._endFn, !1);
        }
      };
      var a = {}, s = function(i) {
        var l = i._src;
        if (a[l]) {
          i._duration = a[l].duration, u(i);
          return;
        }
        if (/^data:[^;]+;base64,/.test(l)) {
          for (var f = atob(l.split(",")[1]), g = new Uint8Array(f.length), p = 0; p < f.length; ++p)
            g[p] = f.charCodeAt(p);
          d(g.buffer, i);
        } else {
          var h = new XMLHttpRequest();
          h.open(i._xhr.method, l, !0), h.withCredentials = i._xhr.withCredentials, h.responseType = "arraybuffer", i._xhr.headers && Object.keys(i._xhr.headers).forEach(function(y) {
            h.setRequestHeader(y, i._xhr.headers[y]);
          }), h.onload = function() {
            var y = (h.status + "")[0];
            if (y !== "0" && y !== "2" && y !== "3") {
              i._emit("loaderror", null, "Failed loading audio file with status: " + h.status + ".");
              return;
            }
            d(h.response, i);
          }, h.onerror = function() {
            i._webAudio && (i._html5 = !0, i._webAudio = !1, i._sounds = [], delete a[l], i.load());
          }, c(h);
        }
      }, c = function(i) {
        try {
          i.send();
        } catch {
          i.onerror();
        }
      }, d = function(i, l) {
        var f = function() {
          l._emit("loaderror", null, "Decoding audio data failed.");
        }, g = function(p) {
          p && l._sounds.length > 0 ? (a[l._src] = p, u(l, p)) : f();
        };
        typeof Promise < "u" && n.ctx.decodeAudioData.length === 1 ? n.ctx.decodeAudioData(i).then(g).catch(f) : n.ctx.decodeAudioData(i, g, f);
      }, u = function(i, l) {
        l && !i._duration && (i._duration = l.duration), Object.keys(i._sprite).length === 0 && (i._sprite = { __default: [0, i._duration * 1e3] }), i._state !== "loaded" && (i._state = "loaded", i._emit("load"), i._loadQueue());
      }, m = function() {
        if (n.usingWebAudio) {
          try {
            typeof AudioContext < "u" ? n.ctx = new AudioContext() : typeof webkitAudioContext < "u" ? n.ctx = new webkitAudioContext() : n.usingWebAudio = !1;
          } catch {
            n.usingWebAudio = !1;
          }
          n.ctx || (n.usingWebAudio = !1);
          var i = /iP(hone|od|ad)/.test(n._navigator && n._navigator.platform), l = n._navigator && n._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/), f = l ? parseInt(l[1], 10) : null;
          if (i && f && f < 9) {
            var g = /safari/.test(n._navigator && n._navigator.userAgent.toLowerCase());
            n._navigator && !g && (n.usingWebAudio = !1);
          }
          n.usingWebAudio && (n.masterGain = typeof n.ctx.createGain > "u" ? n.ctx.createGainNode() : n.ctx.createGain(), n.masterGain.gain.setValueAtTime(n._muted ? 0 : n._volume, n.ctx.currentTime), n.masterGain.connect(n.ctx.destination)), n._setup();
        }
      };
      e.Howler = n, e.Howl = r, typeof On < "u" ? (On.HowlerGlobal = t, On.Howler = n, On.Howl = r, On.Sound = o) : typeof window < "u" && (window.HowlerGlobal = t, window.Howler = n, window.Howl = r, window.Sound = o);
    })();
    /*!
     *  Spatial Plugin - Adds support for stereo and 3D audio where Web Audio is supported.
     *  
     *  howler.js v2.2.4
     *  howlerjs.com
     *
     *  (c) 2013-2020, James Simpson of GoldFire Studios
     *  goldfirestudios.com
     *
     *  MIT License
     */
    (function() {
      HowlerGlobal.prototype._pos = [0, 0, 0], HowlerGlobal.prototype._orientation = [0, 0, -1, 0, 1, 0], HowlerGlobal.prototype.stereo = function(n) {
        var r = this;
        if (!r.ctx || !r.ctx.listener)
          return r;
        for (var o = r._howls.length - 1; o >= 0; o--)
          r._howls[o].stereo(n);
        return r;
      }, HowlerGlobal.prototype.pos = function(n, r, o) {
        var a = this;
        if (!a.ctx || !a.ctx.listener)
          return a;
        if (r = typeof r != "number" ? a._pos[1] : r, o = typeof o != "number" ? a._pos[2] : o, typeof n == "number")
          a._pos = [n, r, o], typeof a.ctx.listener.positionX < "u" ? (a.ctx.listener.positionX.setTargetAtTime(a._pos[0], Howler.ctx.currentTime, 0.1), a.ctx.listener.positionY.setTargetAtTime(a._pos[1], Howler.ctx.currentTime, 0.1), a.ctx.listener.positionZ.setTargetAtTime(a._pos[2], Howler.ctx.currentTime, 0.1)) : a.ctx.listener.setPosition(a._pos[0], a._pos[1], a._pos[2]);
        else
          return a._pos;
        return a;
      }, HowlerGlobal.prototype.orientation = function(n, r, o, a, s, c) {
        var d = this;
        if (!d.ctx || !d.ctx.listener)
          return d;
        var u = d._orientation;
        if (r = typeof r != "number" ? u[1] : r, o = typeof o != "number" ? u[2] : o, a = typeof a != "number" ? u[3] : a, s = typeof s != "number" ? u[4] : s, c = typeof c != "number" ? u[5] : c, typeof n == "number")
          d._orientation = [n, r, o, a, s, c], typeof d.ctx.listener.forwardX < "u" ? (d.ctx.listener.forwardX.setTargetAtTime(n, Howler.ctx.currentTime, 0.1), d.ctx.listener.forwardY.setTargetAtTime(r, Howler.ctx.currentTime, 0.1), d.ctx.listener.forwardZ.setTargetAtTime(o, Howler.ctx.currentTime, 0.1), d.ctx.listener.upX.setTargetAtTime(a, Howler.ctx.currentTime, 0.1), d.ctx.listener.upY.setTargetAtTime(s, Howler.ctx.currentTime, 0.1), d.ctx.listener.upZ.setTargetAtTime(c, Howler.ctx.currentTime, 0.1)) : d.ctx.listener.setOrientation(n, r, o, a, s, c);
        else
          return u;
        return d;
      }, Howl.prototype.init = /* @__PURE__ */ function(n) {
        return function(r) {
          var o = this;
          return o._orientation = r.orientation || [1, 0, 0], o._stereo = r.stereo || null, o._pos = r.pos || null, o._pannerAttr = {
            coneInnerAngle: typeof r.coneInnerAngle < "u" ? r.coneInnerAngle : 360,
            coneOuterAngle: typeof r.coneOuterAngle < "u" ? r.coneOuterAngle : 360,
            coneOuterGain: typeof r.coneOuterGain < "u" ? r.coneOuterGain : 0,
            distanceModel: typeof r.distanceModel < "u" ? r.distanceModel : "inverse",
            maxDistance: typeof r.maxDistance < "u" ? r.maxDistance : 1e4,
            panningModel: typeof r.panningModel < "u" ? r.panningModel : "HRTF",
            refDistance: typeof r.refDistance < "u" ? r.refDistance : 1,
            rolloffFactor: typeof r.rolloffFactor < "u" ? r.rolloffFactor : 1
          }, o._onstereo = r.onstereo ? [{ fn: r.onstereo }] : [], o._onpos = r.onpos ? [{ fn: r.onpos }] : [], o._onorientation = r.onorientation ? [{ fn: r.onorientation }] : [], n.call(this, r);
        };
      }(Howl.prototype.init), Howl.prototype.stereo = function(n, r) {
        var o = this;
        if (!o._webAudio)
          return o;
        if (o._state !== "loaded")
          return o._queue.push({
            event: "stereo",
            action: function() {
              o.stereo(n, r);
            }
          }), o;
        var a = typeof Howler.ctx.createStereoPanner > "u" ? "spatial" : "stereo";
        if (typeof r > "u")
          if (typeof n == "number")
            o._stereo = n, o._pos = [n, 0, 0];
          else
            return o._stereo;
        for (var s = o._getSoundIds(r), c = 0; c < s.length; c++) {
          var d = o._soundById(s[c]);
          if (d)
            if (typeof n == "number")
              d._stereo = n, d._pos = [n, 0, 0], d._node && (d._pannerAttr.panningModel = "equalpower", (!d._panner || !d._panner.pan) && t(d, a), a === "spatial" ? typeof d._panner.positionX < "u" ? (d._panner.positionX.setValueAtTime(n, Howler.ctx.currentTime), d._panner.positionY.setValueAtTime(0, Howler.ctx.currentTime), d._panner.positionZ.setValueAtTime(0, Howler.ctx.currentTime)) : d._panner.setPosition(n, 0, 0) : d._panner.pan.setValueAtTime(n, Howler.ctx.currentTime)), o._emit("stereo", d._id);
            else
              return d._stereo;
        }
        return o;
      }, Howl.prototype.pos = function(n, r, o, a) {
        var s = this;
        if (!s._webAudio)
          return s;
        if (s._state !== "loaded")
          return s._queue.push({
            event: "pos",
            action: function() {
              s.pos(n, r, o, a);
            }
          }), s;
        if (r = typeof r != "number" ? 0 : r, o = typeof o != "number" ? -0.5 : o, typeof a > "u")
          if (typeof n == "number")
            s._pos = [n, r, o];
          else
            return s._pos;
        for (var c = s._getSoundIds(a), d = 0; d < c.length; d++) {
          var u = s._soundById(c[d]);
          if (u)
            if (typeof n == "number")
              u._pos = [n, r, o], u._node && ((!u._panner || u._panner.pan) && t(u, "spatial"), typeof u._panner.positionX < "u" ? (u._panner.positionX.setValueAtTime(n, Howler.ctx.currentTime), u._panner.positionY.setValueAtTime(r, Howler.ctx.currentTime), u._panner.positionZ.setValueAtTime(o, Howler.ctx.currentTime)) : u._panner.setPosition(n, r, o)), s._emit("pos", u._id);
            else
              return u._pos;
        }
        return s;
      }, Howl.prototype.orientation = function(n, r, o, a) {
        var s = this;
        if (!s._webAudio)
          return s;
        if (s._state !== "loaded")
          return s._queue.push({
            event: "orientation",
            action: function() {
              s.orientation(n, r, o, a);
            }
          }), s;
        if (r = typeof r != "number" ? s._orientation[1] : r, o = typeof o != "number" ? s._orientation[2] : o, typeof a > "u")
          if (typeof n == "number")
            s._orientation = [n, r, o];
          else
            return s._orientation;
        for (var c = s._getSoundIds(a), d = 0; d < c.length; d++) {
          var u = s._soundById(c[d]);
          if (u)
            if (typeof n == "number")
              u._orientation = [n, r, o], u._node && (u._panner || (u._pos || (u._pos = s._pos || [0, 0, -0.5]), t(u, "spatial")), typeof u._panner.orientationX < "u" ? (u._panner.orientationX.setValueAtTime(n, Howler.ctx.currentTime), u._panner.orientationY.setValueAtTime(r, Howler.ctx.currentTime), u._panner.orientationZ.setValueAtTime(o, Howler.ctx.currentTime)) : u._panner.setOrientation(n, r, o)), s._emit("orientation", u._id);
            else
              return u._orientation;
        }
        return s;
      }, Howl.prototype.pannerAttr = function() {
        var n = this, r = arguments, o, a, s;
        if (!n._webAudio)
          return n;
        if (r.length === 0)
          return n._pannerAttr;
        if (r.length === 1)
          if (typeof r[0] == "object")
            o = r[0], typeof a > "u" && (o.pannerAttr || (o.pannerAttr = {
              coneInnerAngle: o.coneInnerAngle,
              coneOuterAngle: o.coneOuterAngle,
              coneOuterGain: o.coneOuterGain,
              distanceModel: o.distanceModel,
              maxDistance: o.maxDistance,
              refDistance: o.refDistance,
              rolloffFactor: o.rolloffFactor,
              panningModel: o.panningModel
            }), n._pannerAttr = {
              coneInnerAngle: typeof o.pannerAttr.coneInnerAngle < "u" ? o.pannerAttr.coneInnerAngle : n._coneInnerAngle,
              coneOuterAngle: typeof o.pannerAttr.coneOuterAngle < "u" ? o.pannerAttr.coneOuterAngle : n._coneOuterAngle,
              coneOuterGain: typeof o.pannerAttr.coneOuterGain < "u" ? o.pannerAttr.coneOuterGain : n._coneOuterGain,
              distanceModel: typeof o.pannerAttr.distanceModel < "u" ? o.pannerAttr.distanceModel : n._distanceModel,
              maxDistance: typeof o.pannerAttr.maxDistance < "u" ? o.pannerAttr.maxDistance : n._maxDistance,
              refDistance: typeof o.pannerAttr.refDistance < "u" ? o.pannerAttr.refDistance : n._refDistance,
              rolloffFactor: typeof o.pannerAttr.rolloffFactor < "u" ? o.pannerAttr.rolloffFactor : n._rolloffFactor,
              panningModel: typeof o.pannerAttr.panningModel < "u" ? o.pannerAttr.panningModel : n._panningModel
            });
          else
            return s = n._soundById(parseInt(r[0], 10)), s ? s._pannerAttr : n._pannerAttr;
        else r.length === 2 && (o = r[0], a = parseInt(r[1], 10));
        for (var c = n._getSoundIds(a), d = 0; d < c.length; d++)
          if (s = n._soundById(c[d]), s) {
            var u = s._pannerAttr;
            u = {
              coneInnerAngle: typeof o.coneInnerAngle < "u" ? o.coneInnerAngle : u.coneInnerAngle,
              coneOuterAngle: typeof o.coneOuterAngle < "u" ? o.coneOuterAngle : u.coneOuterAngle,
              coneOuterGain: typeof o.coneOuterGain < "u" ? o.coneOuterGain : u.coneOuterGain,
              distanceModel: typeof o.distanceModel < "u" ? o.distanceModel : u.distanceModel,
              maxDistance: typeof o.maxDistance < "u" ? o.maxDistance : u.maxDistance,
              refDistance: typeof o.refDistance < "u" ? o.refDistance : u.refDistance,
              rolloffFactor: typeof o.rolloffFactor < "u" ? o.rolloffFactor : u.rolloffFactor,
              panningModel: typeof o.panningModel < "u" ? o.panningModel : u.panningModel
            };
            var m = s._panner;
            m || (s._pos || (s._pos = n._pos || [0, 0, -0.5]), t(s, "spatial"), m = s._panner), m.coneInnerAngle = u.coneInnerAngle, m.coneOuterAngle = u.coneOuterAngle, m.coneOuterGain = u.coneOuterGain, m.distanceModel = u.distanceModel, m.maxDistance = u.maxDistance, m.refDistance = u.refDistance, m.rolloffFactor = u.rolloffFactor, m.panningModel = u.panningModel;
          }
        return n;
      }, Sound.prototype.init = /* @__PURE__ */ function(n) {
        return function() {
          var r = this, o = r._parent;
          r._orientation = o._orientation, r._stereo = o._stereo, r._pos = o._pos, r._pannerAttr = o._pannerAttr, n.call(this), r._stereo ? o.stereo(r._stereo) : r._pos && o.pos(r._pos[0], r._pos[1], r._pos[2], r._id);
        };
      }(Sound.prototype.init), Sound.prototype.reset = /* @__PURE__ */ function(n) {
        return function() {
          var r = this, o = r._parent;
          return r._orientation = o._orientation, r._stereo = o._stereo, r._pos = o._pos, r._pannerAttr = o._pannerAttr, r._stereo ? o.stereo(r._stereo) : r._pos ? o.pos(r._pos[0], r._pos[1], r._pos[2], r._id) : r._panner && (r._panner.disconnect(0), r._panner = void 0, o._refreshBuffer(r)), n.call(this);
        };
      }(Sound.prototype.reset);
      var t = function(n, r) {
        r = r || "spatial", r === "spatial" ? (n._panner = Howler.ctx.createPanner(), n._panner.coneInnerAngle = n._pannerAttr.coneInnerAngle, n._panner.coneOuterAngle = n._pannerAttr.coneOuterAngle, n._panner.coneOuterGain = n._pannerAttr.coneOuterGain, n._panner.distanceModel = n._pannerAttr.distanceModel, n._panner.maxDistance = n._pannerAttr.maxDistance, n._panner.refDistance = n._pannerAttr.refDistance, n._panner.rolloffFactor = n._pannerAttr.rolloffFactor, n._panner.panningModel = n._pannerAttr.panningModel, typeof n._panner.positionX < "u" ? (n._panner.positionX.setValueAtTime(n._pos[0], Howler.ctx.currentTime), n._panner.positionY.setValueAtTime(n._pos[1], Howler.ctx.currentTime), n._panner.positionZ.setValueAtTime(n._pos[2], Howler.ctx.currentTime)) : n._panner.setPosition(n._pos[0], n._pos[1], n._pos[2]), typeof n._panner.orientationX < "u" ? (n._panner.orientationX.setValueAtTime(n._orientation[0], Howler.ctx.currentTime), n._panner.orientationY.setValueAtTime(n._orientation[1], Howler.ctx.currentTime), n._panner.orientationZ.setValueAtTime(n._orientation[2], Howler.ctx.currentTime)) : n._panner.setOrientation(n._orientation[0], n._orientation[1], n._orientation[2])) : (n._panner = Howler.ctx.createStereoPanner(), n._panner.pan.setValueAtTime(n._stereo, Howler.ctx.currentTime)), n._panner.connect(n._node), n._paused || n._parent.pause(n._id, !0).play(n._id, !0);
      };
    })();
  }(sc)), sc;
}
K1();
var Fn, at;
const Z1 = class Nn {
  constructor() {
    ud(this, at), ic(this, at, /* @__PURE__ */ new Map());
  }
  static getInstance() {
    return _t(Nn, Fn) === void 0 && ic(Nn, Fn, new Nn()), _t(Nn, Fn);
  }
  hasSound(t) {
    return _t(this, at).has(t);
  }
  setSound(t, n) {
    _t(this, at).set(t, n);
  }
  setSoundOnce(t, n) {
    _t(this, at).has(t) || _t(this, at).set(t, n);
  }
  getSound(t) {
    return _t(this, at).get(t);
  }
  playSound(t) {
    var n;
    (n = _t(this, at).get(t)) == null || n.play();
  }
};
Fn = /* @__PURE__ */ new WeakMap(), at = /* @__PURE__ */ new WeakMap(), ud(Z1, Fn);
var cc;
(function(e) {
  e.WINDOW_RESIZED = "tauri://resize", e.WINDOW_MOVED = "tauri://move", e.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", e.WINDOW_DESTROYED = "tauri://destroyed", e.WINDOW_FOCUS = "tauri://focus", e.WINDOW_BLUR = "tauri://blur", e.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", e.WINDOW_THEME_CHANGED = "tauri://theme-changed", e.WINDOW_CREATED = "tauri://window-created", e.WEBVIEW_CREATED = "tauri://webview-created", e.DRAG_ENTER = "tauri://drag-enter", e.DRAG_OVER = "tauri://drag-over", e.DRAG_DROP = "tauri://drag-drop", e.DRAG_LEAVE = "tauri://drag-leave";
})(cc || (cc = {}));
let J1 = { data: "" }, ew = (e) => typeof window == "object" ? ((e ? e.querySelector("#_goober") : window._goober) || Object.assign((e || document.head).appendChild(document.createElement("style")), { innerHTML: " ", id: "_goober" })).firstChild : e || J1, tw = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g, nw = /\/\*[^]*?\*\/|  +/g, uc = /\n+/g, At = (e, t) => {
  let n = "", r = "", o = "";
  for (let a in e) {
    let s = e[a];
    a[0] == "@" ? a[1] == "i" ? n = a + " " + s + ";" : r += a[1] == "f" ? At(s, a) : a + "{" + At(s, a[1] == "k" ? "" : t) + "}" : typeof s == "object" ? r += At(s, t ? t.replace(/([^,])+/g, (c) => a.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g, (d) => /&/.test(d) ? d.replace(/&/g, c) : c ? c + " " + d : d)) : a) : s != null && (a = /^--/.test(a) ? a : a.replace(/[A-Z]/g, "-$&").toLowerCase(), o += At.p ? At.p(a, s) : a + ":" + s + ";");
  }
  return n + (t && o ? t + "{" + o + "}" : o) + r;
}, ot = {}, fd = (e) => {
  if (typeof e == "object") {
    let t = "";
    for (let n in e) t += n + fd(e[n]);
    return t;
  }
  return e;
}, rw = (e, t, n, r, o) => {
  let a = fd(e), s = ot[a] || (ot[a] = ((d) => {
    let u = 0, m = 11;
    for (; u < d.length; ) m = 101 * m + d.charCodeAt(u++) >>> 0;
    return "go" + m;
  })(a));
  if (!ot[s]) {
    let d = a !== e ? e : ((u) => {
      let m, i, l = [{}];
      for (; m = tw.exec(u.replace(nw, "")); ) m[4] ? l.shift() : m[3] ? (i = m[3].replace(uc, " ").trim(), l.unshift(l[0][i] = l[0][i] || {})) : l[0][m[1]] = m[2].replace(uc, " ").trim();
      return l[0];
    })(e);
    ot[s] = At(o ? { ["@keyframes " + s]: d } : d, n ? "" : "." + s);
  }
  let c = n && ot.g ? ot.g : null;
  return n && (ot.g = ot[s]), ((d, u, m, i) => {
    i ? u.data = u.data.replace(i, d) : u.data.indexOf(d) === -1 && (u.data = m ? d + u.data : u.data + d);
  })(ot[s], t, r, c), s;
}, ow = (e, t, n) => e.reduce((r, o, a) => {
  let s = t[a];
  if (s && s.call) {
    let c = s(n), d = c && c.props && c.props.className || /^go/.test(c) && c;
    s = d ? "." + d : c && typeof c == "object" ? c.props ? "" : At(c, "") : c === !1 ? "" : c;
  }
  return r + o + (s ?? "");
}, "");
function co(e) {
  let t = this || {}, n = e.call ? e(t.p) : e;
  return rw(n.unshift ? n.raw ? ow(n, [].slice.call(arguments, 1), t.p) : n.reduce((r, o) => Object.assign(r, o && o.call ? o(t.p) : o), {}) : n, ew(t.target), t.g, t.o, t.k);
}
let dd, Ya, qa;
co.bind({ g: 1 });
let dt = co.bind({ k: 1 });
function aw(e, t, n, r) {
  At.p = t, dd = e, Ya = n, qa = r;
}
function Dt(e, t) {
  let n = this || {};
  return function() {
    let r = arguments;
    function o(a, s) {
      let c = Object.assign({}, a), d = c.className || o.className;
      n.p = Object.assign({ theme: Ya && Ya() }, c), n.o = / *go\d+/.test(d), c.className = co.apply(n, r) + (d ? " " + d : "");
      let u = e;
      return e[0] && (u = c.as || e, delete c.as), qa && u[0] && qa(c), dd(u, c);
    }
    return o;
  };
}
var iw = (e) => typeof e == "function", sw = (e, t) => iw(e) ? e(t) : e, lw = /* @__PURE__ */ (() => {
  let e;
  return () => {
    if (e === void 0 && typeof window < "u") {
      let t = matchMedia("(prefers-reduced-motion: reduce)");
      e = !t || t.matches;
    }
    return e;
  };
})(), cw = dt`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`, uw = dt`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`, fw = dt`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`, dw = Dt("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(e) => e.primary || "#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${cw} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${uw} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${(e) => e.secondary || "#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${fw} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`, pw = dt`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`, mw = Dt("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${(e) => e.secondary || "#e0e0e0"};
  border-right-color: ${(e) => e.primary || "#616161"};
  animation: ${pw} 1s linear infinite;
`, hw = dt`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`, gw = dt`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`, yw = Dt("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(e) => e.primary || "#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${hw} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${gw} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${(e) => e.secondary || "#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`, bw = Dt("div")`
  position: absolute;
`, vw = Dt("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`, ww = dt`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`, xw = Dt("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${ww} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`, _w = ({ toast: e }) => {
  let { icon: t, type: n, iconTheme: r } = e;
  return t !== void 0 ? typeof t == "string" ? _.createElement(xw, null, t) : t : n === "blank" ? null : _.createElement(vw, null, _.createElement(mw, { ...r }), n !== "loading" && _.createElement(bw, null, n === "error" ? _.createElement(dw, { ...r }) : _.createElement(yw, { ...r })));
}, kw = (e) => `
0% {transform: translate3d(0,${e * -200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`, Aw = (e) => `
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e * -150}%,-1px) scale(.6); opacity:0;}
`, Ow = "0%{opacity:0;} 100%{opacity:1;}", Sw = "0%{opacity:1;} 100%{opacity:0;}", Pw = Dt("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`, Ew = Dt("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`, Nw = (e, t) => {
  let n = e.includes("top") ? 1 : -1, [r, o] = lw() ? [Ow, Sw] : [kw(n), Aw(n)];
  return { animation: t ? `${dt(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards` : `${dt(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)` };
};
_.memo(({ toast: e, position: t, style: n, children: r }) => {
  let o = e.height ? Nw(e.position || t || "top-center", e.visible) : { opacity: 0 }, a = _.createElement(_w, { toast: e }), s = _.createElement(Ew, { ...e.ariaProps }, sw(e.message, e));
  return _.createElement(Pw, { className: e.className, style: { ...o, ...n, ...e.style } }, typeof r == "function" ? r({ icon: a, message: s }) : _.createElement(_.Fragment, null, a, s));
});
aw(_.createElement);
co`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;
var qe = /* @__PURE__ */ ((e) => (e.Artcraft = "artcraft", e.Fal = "fal", e.Midjourney = "midjourney", e.Sora = "sora", e))(qe || {});
function Cw({
  provider: e
}) {
  const t = Iw(e);
  return /* @__PURE__ */ st("div", { children: [
    "Please set up ",
    t,
    " on their website to use it with Artcraft."
  ] });
}
function Iw(e) {
  switch (e) {
    case qe.Sora:
      return "Sora";
    case qe.Fal:
      return "Fal";
    case qe.Midjourney:
      return "Midjourney";
    case qe.Artcraft:
    default:
      return "Artcraft";
  }
}
function Tw({}) {
  return /* @__PURE__ */ B("div", { children: "Set up ArtCraft billing!" });
}
function Lw({}) {
  const [e, t] = Be(!1), [n, r] = Be(qe.Artcraft);
  Q1(async (a) => {
    console.log("Show provider billing modal event received from Tauri:", a), r(a.provider), t(!0);
  });
  let o;
  switch (n) {
    case qe.Midjourney:
    case qe.Sora:
    case qe.Fal:
      o = /* @__PURE__ */ B(Cw, { provider: n });
      break;
    case qe.Artcraft:
      o = /* @__PURE__ */ B(Tw, {});
      break;
  }
  return /* @__PURE__ */ B(
    sr,
    {
      isOpen: e,
      onClose: () => {
        t(!1);
      },
      className: "max-w-2xl max-h-[500px] p-6",
      showClose: !0,
      children: /* @__PURE__ */ B("div", { className: "flex flex-col items-center justify-center gap-6", children: o })
    }
  );
}
export {
  Lw as ProviderBillingModal
};
