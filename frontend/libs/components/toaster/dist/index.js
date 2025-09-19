import { jsx as _ } from "react/jsx-runtime";
import * as p from "react";
import { useEffect as N, useCallback as P, useState as H, useRef as L } from "react";
let R = { data: "" }, U = (e) => typeof window == "object" ? ((e ? e.querySelector("#_goober") : window._goober) || Object.assign((e || document.head).appendChild(document.createElement("style")), { innerHTML: " ", id: "_goober" })).firstChild : e || R, q = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g, V = /\/\*[^]*?\*\/|  +/g, S = /\n+/g, b = (e, t) => {
  let a = "", o = "", n = "";
  for (let r in e) {
    let i = e[r];
    r[0] == "@" ? r[1] == "i" ? a = r + " " + i + ";" : o += r[1] == "f" ? b(i, r) : r + "{" + b(i, r[1] == "k" ? "" : t) + "}" : typeof i == "object" ? o += b(i, t ? t.replace(/([^,])+/g, (s) => r.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g, (l) => /&/.test(l) ? l.replace(/&/g, s) : s ? s + " " + l : l)) : r) : i != null && (r = /^--/.test(r) ? r : r.replace(/[A-Z]/g, "-$&").toLowerCase(), n += b.p ? b.p(r, i) : r + ":" + i + ";");
  }
  return a + (t && n ? t + "{" + n + "}" : n) + o;
}, y = {}, I = (e) => {
  if (typeof e == "object") {
    let t = "";
    for (let a in e) t += a + I(e[a]);
    return t;
  }
  return e;
}, Y = (e, t, a, o, n) => {
  let r = I(e), i = y[r] || (y[r] = ((l) => {
    let d = 0, c = 11;
    for (; d < l.length; ) c = 101 * c + l.charCodeAt(d++) >>> 0;
    return "go" + c;
  })(r));
  if (!y[i]) {
    let l = r !== e ? e : ((d) => {
      let c, m, f = [{}];
      for (; c = q.exec(d.replace(V, "")); ) c[4] ? f.shift() : c[3] ? (m = c[3].replace(S, " ").trim(), f.unshift(f[0][m] = f[0][m] || {})) : f[0][c[1]] = c[2].replace(S, " ").trim();
      return f[0];
    })(e);
    y[i] = b(n ? { ["@keyframes " + i]: l } : l, a ? "" : "." + i);
  }
  let s = a && y.g ? y.g : null;
  return a && (y.g = y[i]), ((l, d, c, m) => {
    m ? d.data = d.data.replace(m, l) : d.data.indexOf(l) === -1 && (d.data = c ? l + d.data : d.data + l);
  })(y[i], t, o, s), i;
}, Z = (e, t, a) => e.reduce((o, n, r) => {
  let i = t[r];
  if (i && i.call) {
    let s = i(a), l = s && s.props && s.props.className || /^go/.test(s) && s;
    i = l ? "." + l : s && typeof s == "object" ? s.props ? "" : b(s, "") : s === !1 ? "" : s;
  }
  return o + n + (i ?? "");
}, "");
function j(e) {
  let t = this || {}, a = e.call ? e(t.p) : e;
  return Y(a.unshift ? a.raw ? Z(a, [].slice.call(arguments, 1), t.p) : a.reduce((o, n) => Object.assign(o, n && n.call ? n(t.p) : n), {}) : a, U(t.target), t.g, t.o, t.k);
}
let T, A, z;
j.bind({ g: 1 });
let h = j.bind({ k: 1 });
function B(e, t, a, o) {
  b.p = t, T = e, A = a, z = o;
}
function v(e, t) {
  let a = this || {};
  return function() {
    let o = arguments;
    function n(r, i) {
      let s = Object.assign({}, r), l = s.className || n.className;
      a.p = Object.assign({ theme: A && A() }, s), a.o = / *go\d+/.test(l), s.className = j.apply(a, o) + (l ? " " + l : "");
      let d = e;
      return e[0] && (d = s.as || e, delete s.as), z && d[0] && z(s), T(d, s);
    }
    return n;
  };
}
var J = (e) => typeof e == "function", O = (e, t) => J(e) ? e(t) : e, K = /* @__PURE__ */ (() => {
  let e = 0;
  return () => (++e).toString();
})(), M = /* @__PURE__ */ (() => {
  let e;
  return () => {
    if (e === void 0 && typeof window < "u") {
      let t = matchMedia("(prefers-reduced-motion: reduce)");
      e = !t || t.matches;
    }
    return e;
  };
})(), W = 20, F = (e, t) => {
  switch (t.type) {
    case 0:
      return { ...e, toasts: [t.toast, ...e.toasts].slice(0, W) };
    case 1:
      return { ...e, toasts: e.toasts.map((r) => r.id === t.toast.id ? { ...r, ...t.toast } : r) };
    case 2:
      let { toast: a } = t;
      return F(e, { type: e.toasts.find((r) => r.id === a.id) ? 1 : 0, toast: a });
    case 3:
      let { toastId: o } = t;
      return { ...e, toasts: e.toasts.map((r) => r.id === o || o === void 0 ? { ...r, dismissed: !0, visible: !1 } : r) };
    case 4:
      return t.toastId === void 0 ? { ...e, toasts: [] } : { ...e, toasts: e.toasts.filter((r) => r.id !== t.toastId) };
    case 5:
      return { ...e, pausedAt: t.time };
    case 6:
      let n = t.time - (e.pausedAt || 0);
      return { ...e, pausedAt: void 0, toasts: e.toasts.map((r) => ({ ...r, pauseDuration: r.pauseDuration + n })) };
  }
}, D = [], x = { toasts: [], pausedAt: void 0 }, w = (e) => {
  x = F(x, e), D.forEach((t) => {
    t(x);
  });
}, X = { blank: 4e3, error: 4e3, success: 2e3, loading: 1 / 0, custom: 4e3 }, G = (e = {}) => {
  let [t, a] = H(x), o = L(x);
  N(() => (o.current !== x && a(x), D.push(a), () => {
    let r = D.indexOf(a);
    r > -1 && D.splice(r, 1);
  }), []);
  let n = t.toasts.map((r) => {
    var i, s, l;
    return { ...e, ...e[r.type], ...r, removeDelay: r.removeDelay || ((i = e[r.type]) == null ? void 0 : i.removeDelay) || (e == null ? void 0 : e.removeDelay), duration: r.duration || ((s = e[r.type]) == null ? void 0 : s.duration) || (e == null ? void 0 : e.duration) || X[r.type], style: { ...e.style, ...(l = e[r.type]) == null ? void 0 : l.style, ...r.style } };
  });
  return { ...t, toasts: n };
}, Q = (e, t = "blank", a) => ({ createdAt: Date.now(), visible: !0, dismissed: !1, type: t, ariaProps: { role: "status", "aria-live": "polite" }, message: e, pauseDuration: 0, ...a, id: (a == null ? void 0 : a.id) || K() }), $ = (e) => (t, a) => {
  let o = Q(t, e, a);
  return w({ type: 2, toast: o }), o.id;
}, u = (e, t) => $("blank")(e, t);
u.error = $("error");
u.success = $("success");
u.loading = $("loading");
u.custom = $("custom");
u.dismiss = (e) => {
  w({ type: 3, toastId: e });
};
u.remove = (e) => w({ type: 4, toastId: e });
u.promise = (e, t, a) => {
  let o = u.loading(t.loading, { ...a, ...a == null ? void 0 : a.loading });
  return typeof e == "function" && (e = e()), e.then((n) => {
    let r = t.success ? O(t.success, n) : void 0;
    return r ? u.success(r, { id: o, ...a, ...a == null ? void 0 : a.success }) : u.dismiss(o), n;
  }).catch((n) => {
    let r = t.error ? O(t.error, n) : void 0;
    r ? u.error(r, { id: o, ...a, ...a == null ? void 0 : a.error }) : u.dismiss(o);
  }), e;
};
var ee = (e, t) => {
  w({ type: 1, toast: { id: e, height: t } });
}, te = () => {
  w({ type: 5, time: Date.now() });
}, E = /* @__PURE__ */ new Map(), re = 1e3, ae = (e, t = re) => {
  if (E.has(e)) return;
  let a = setTimeout(() => {
    E.delete(e), w({ type: 4, toastId: e });
  }, t);
  E.set(e, a);
}, oe = (e) => {
  let { toasts: t, pausedAt: a } = G(e);
  N(() => {
    if (a) return;
    let r = Date.now(), i = t.map((s) => {
      if (s.duration === 1 / 0) return;
      let l = (s.duration || 0) + s.pauseDuration - (r - s.createdAt);
      if (l < 0) {
        s.visible && u.dismiss(s.id);
        return;
      }
      return setTimeout(() => u.dismiss(s.id), l);
    });
    return () => {
      i.forEach((s) => s && clearTimeout(s));
    };
  }, [t, a]);
  let o = P(() => {
    a && w({ type: 6, time: Date.now() });
  }, [a]), n = P((r, i) => {
    let { reverseOrder: s = !1, gutter: l = 8, defaultPosition: d } = i || {}, c = t.filter((g) => (g.position || d) === (r.position || d) && g.height), m = c.findIndex((g) => g.id === r.id), f = c.filter((g, C) => C < m && g.visible).length;
    return c.filter((g) => g.visible).slice(...s ? [f + 1] : [0, f]).reduce((g, C) => g + (C.height || 0) + l, 0);
  }, [t]);
  return N(() => {
    t.forEach((r) => {
      if (r.dismissed) ae(r.id, r.removeDelay);
      else {
        let i = E.get(r.id);
        i && (clearTimeout(i), E.delete(r.id));
      }
    });
  }, [t]), { toasts: t, handlers: { updateHeight: ee, startPause: te, endPause: o, calculateOffset: n } };
}, se = h`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`, ie = h`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`, ne = h`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`, le = v("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(e) => e.primary || "#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${se} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${ie} 0.15s ease-out forwards;
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
    animation: ${ne} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`, de = h`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`, ce = v("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${(e) => e.secondary || "#e0e0e0"};
  border-right-color: ${(e) => e.primary || "#616161"};
  animation: ${de} 1s linear infinite;
`, pe = h`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`, ue = h`
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
}`, fe = v("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(e) => e.primary || "#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${pe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${ue} 0.2s ease-out forwards;
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
`, me = v("div")`
  position: absolute;
`, ge = v("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`, ye = h`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`, he = v("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${ye} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`, be = ({ toast: e }) => {
  let { icon: t, type: a, iconTheme: o } = e;
  return t !== void 0 ? typeof t == "string" ? p.createElement(he, null, t) : t : a === "blank" ? null : p.createElement(ge, null, p.createElement(ce, { ...o }), a !== "loading" && p.createElement(me, null, a === "error" ? p.createElement(le, { ...o }) : p.createElement(fe, { ...o })));
}, ve = (e) => `
0% {transform: translate3d(0,${e * -200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`, xe = (e) => `
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e * -150}%,-1px) scale(.6); opacity:0;}
`, we = "0%{opacity:0;} 100%{opacity:1;}", Ee = "0%{opacity:1;} 100%{opacity:0;}", $e = v("div")`
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
`, ke = v("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`, De = (e, t) => {
  let a = e.includes("top") ? 1 : -1, [o, n] = M() ? [we, Ee] : [ve(a), xe(a)];
  return { animation: t ? `${h(o)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards` : `${h(n)} 0.4s forwards cubic-bezier(.06,.71,.55,1)` };
}, Oe = p.memo(({ toast: e, position: t, style: a, children: o }) => {
  let n = e.height ? De(e.position || t || "top-center", e.visible) : { opacity: 0 }, r = p.createElement(be, { toast: e }), i = p.createElement(ke, { ...e.ariaProps }, O(e.message, e));
  return p.createElement($e, { className: e.className, style: { ...n, ...a, ...e.style } }, typeof o == "function" ? o({ icon: r, message: i }) : p.createElement(p.Fragment, null, r, i));
});
B(p.createElement);
var je = ({ id: e, className: t, style: a, onHeightUpdate: o, children: n }) => {
  let r = p.useCallback((i) => {
    if (i) {
      let s = () => {
        let l = i.getBoundingClientRect().height;
        o(e, l);
      };
      s(), new MutationObserver(s).observe(i, { subtree: !0, childList: !0, characterData: !0 });
    }
  }, [e, o]);
  return p.createElement("div", { ref: r, className: t, style: a }, n);
}, Ce = (e, t) => {
  let a = e.includes("top"), o = a ? { top: 0 } : { bottom: 0 }, n = e.includes("center") ? { justifyContent: "center" } : e.includes("right") ? { justifyContent: "flex-end" } : {};
  return { left: 0, right: 0, display: "flex", position: "absolute", transition: M() ? void 0 : "all 230ms cubic-bezier(.21,1.02,.73,1)", transform: `translateY(${t * (a ? 1 : -1)}px)`, ...o, ...n };
}, Ne = j`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`, k = 16, Ae = ({ reverseOrder: e, position: t = "top-center", toastOptions: a, gutter: o, children: n, containerStyle: r, containerClassName: i }) => {
  let { toasts: s, handlers: l } = oe(a);
  return p.createElement("div", { id: "_rht_toaster", style: { position: "fixed", zIndex: 9999, top: k, left: k, right: k, bottom: k, pointerEvents: "none", ...r }, className: i, onMouseEnter: l.startPause, onMouseLeave: l.endPause }, s.map((d) => {
    let c = d.position || t, m = l.calculateOffset(d, { reverseOrder: e, gutter: o, defaultPosition: t }), f = Ce(c, m);
    return p.createElement(je, { id: d.id, key: d.id, onHeightUpdate: l.updateHeight, className: d.visible ? Ne : "", style: f }, d.type === "custom" ? O(d.message, d) : n ? n(d) : p.createElement(Oe, { toast: d, position: c }));
  }));
}, Se = u;
function Ie({
  position: e = "top-right",
  offsetTop: t = 12,
  offsetBottom: a = 12,
  offsetLeft: o = 12,
  offsetRight: n = 12,
  zIndex: r = 9
}) {
  return /* @__PURE__ */ _(
    Ae,
    {
      position: e,
      toastOptions: {
        success: {
          style: {
            background: "#ffffff"
          }
        },
        error: {
          style: {
            background: "#ffffff"
          }
        }
      },
      containerStyle: {
        top: t,
        left: o,
        bottom: a,
        right: n,
        zIndex: r
      },
      containerClassName: "text-[15px] font-medium"
    }
  );
}
export {
  Ie as Toaster,
  Se as toast
};
