import { jsxs as xe, jsx as G, Fragment as at } from "react/jsx-runtime";
import * as he from "react";
import ln, { useState as Ps, useRef as Cs, useCallback as Wt } from "react";
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function Ts(e, t, n) {
  return (t = Ns(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function ca(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function k(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? ca(Object(n), !0).forEach(function(r) {
      Ts(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : ca(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Is(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Ns(e) {
  var t = Is(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const fa = () => {
};
let zr = {}, Vo = {}, qo = null, Ho = {
  mark: fa,
  measure: fa
};
try {
  typeof window < "u" && (zr = window), typeof document < "u" && (Vo = document), typeof MutationObserver < "u" && (qo = MutationObserver), typeof performance < "u" && (Ho = performance);
} catch {
}
const {
  userAgent: ua = ""
} = zr.navigator || {}, Ve = zr, Q = Vo, da = qo, Ut = Ho;
Ve.document;
const ze = !!Q.documentElement && !!Q.head && typeof Q.addEventListener == "function" && typeof Q.createElement == "function", Bo = ~ua.indexOf("MSIE") || ~ua.indexOf("Trident/");
var js = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, Ms = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Xo = {
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
}, Rs = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Ko = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], le = "classic", cn = "duotone", _s = "sharp", zs = "sharp-duotone", Jo = [le, cn, _s, zs], Fs = {
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
}, Ds = {
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
}, Ls = /* @__PURE__ */ new Map([["classic", {
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
}]]), $s = {
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
}, Ys = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], pa = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, Ws = ["kit"], Us = {
  kit: {
    "fa-kit": "fak"
  }
}, Gs = ["fak", "fakd"], Vs = {
  kit: {
    fak: "fa-kit"
  }
}, ma = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Gt = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, qs = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Hs = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Bs = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, Xs = {
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
}, Ks = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Bn = {
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
}, Js = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], Xn = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...qs, ...Js], Zs = ["solid", "regular", "light", "thin", "duotone", "brands"], Zo = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], Qs = Zo.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), el = [...Object.keys(Ks), ...Zs, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Gt.GROUP, Gt.SWAP_OPACITY, Gt.PRIMARY, Gt.SECONDARY].concat(Zo.map((e) => "".concat(e, "x"))).concat(Qs.map((e) => "w-".concat(e))), tl = {
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
const Ne = "___FONT_AWESOME___", Kn = 16, Qo = "fa", ei = "svg-inline--fa", et = "data-fa-i2svg", Jn = "data-fa-pseudo-element", nl = "data-fa-pseudo-element-pending", Fr = "data-prefix", Dr = "data-icon", ga = "fontawesome-i2svg", rl = "async", al = ["HTML", "HEAD", "STYLE", "SCRIPT"], ti = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Ft(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[le];
    }
  });
}
const ni = k({}, Xo);
ni[le] = k(k(k(k({}, {
  "fa-duotone": "duotone"
}), Xo[le]), pa.kit), pa["kit-duotone"]);
const ol = Ft(ni), Zn = k({}, $s);
Zn[le] = k(k(k(k({}, {
  duotone: "fad"
}), Zn[le]), ma.kit), ma["kit-duotone"]);
const ba = Ft(Zn), Qn = k({}, Bn);
Qn[le] = k(k({}, Qn[le]), Vs.kit);
const Lr = Ft(Qn), er = k({}, Xs);
er[le] = k(k({}, er[le]), Us.kit);
Ft(er);
const il = js, ri = "fa-layers-text", sl = Ms, ll = k({}, Fs);
Ft(ll);
const cl = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], xn = Rs, fl = [...Ws, ...el], Ct = Ve.FontAwesomeConfig || {};
function ul(e) {
  var t = Q.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function dl(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
Q && typeof Q.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, n] = e;
  const r = dl(ul(t));
  r != null && (Ct[n] = r);
});
const ai = {
  styleDefault: "solid",
  familyDefault: le,
  cssPrefix: Qo,
  replacementClass: ei,
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
Ct.familyPrefix && (Ct.cssPrefix = Ct.familyPrefix);
const mt = k(k({}, ai), Ct);
mt.autoReplaceSvg || (mt.observeMutations = !1);
const z = {};
Object.keys(ai).forEach((e) => {
  Object.defineProperty(z, e, {
    enumerable: !0,
    set: function(t) {
      mt[e] = t, Tt.forEach((n) => n(z));
    },
    get: function() {
      return mt[e];
    }
  });
});
Object.defineProperty(z, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    mt.cssPrefix = e, Tt.forEach((t) => t(z));
  },
  get: function() {
    return mt.cssPrefix;
  }
});
Ve.FontAwesomeConfig = z;
const Tt = [];
function pl(e) {
  return Tt.push(e), () => {
    Tt.splice(Tt.indexOf(e), 1);
  };
}
const De = Kn, Oe = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function ml(e) {
  if (!e || !ze)
    return;
  const t = Q.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = Q.head.childNodes;
  let r = null;
  for (let a = n.length - 1; a > -1; a--) {
    const o = n[a], i = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = o);
  }
  return Q.head.insertBefore(t, r), e;
}
const gl = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Mt() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += gl[Math.random() * 62 | 0];
  return t;
}
function bt(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function $r(e) {
  return e.classList ? bt(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function oi(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function bl(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(oi(e[n]), '" '), "").trim();
}
function fn(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function Yr(e) {
  return e.size !== Oe.size || e.x !== Oe.x || e.y !== Oe.y || e.rotate !== Oe.rotate || e.flipX || e.flipY;
}
function hl(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const a = {
    transform: "translate(".concat(n / 2, " 256)")
  }, o = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), l = {
    transform: "".concat(o, " ").concat(i, " ").concat(s)
  }, c = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: a,
    inner: l,
    path: c
  };
}
function yl(e) {
  let {
    transform: t,
    width: n = Kn,
    height: r = Kn,
    startCentered: a = !1
  } = e, o = "";
  return a && Bo ? o += "translate(".concat(t.x / De - n / 2, "em, ").concat(t.y / De - r / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / De, "em), calc(-50% + ").concat(t.y / De, "em)) ") : o += "translate(".concat(t.x / De, "em, ").concat(t.y / De, "em) "), o += "scale(".concat(t.size / De * (t.flipX ? -1 : 1), ", ").concat(t.size / De * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var vl = `:root, :host {
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
function ii() {
  const e = Qo, t = ei, n = z.cssPrefix, r = z.replacementClass;
  let a = vl;
  if (n !== e || r !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return a;
}
let ha = !1;
function wn() {
  z.autoAddCss && !ha && (ml(ii()), ha = !0);
}
var xl = {
  mixout() {
    return {
      dom: {
        css: ii,
        insertCss: wn
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        wn();
      },
      beforeI2svg() {
        wn();
      }
    };
  }
};
const je = Ve || {};
je[Ne] || (je[Ne] = {});
je[Ne].styles || (je[Ne].styles = {});
je[Ne].hooks || (je[Ne].hooks = {});
je[Ne].shims || (je[Ne].shims = []);
var Ae = je[Ne];
const si = [], li = function() {
  Q.removeEventListener("DOMContentLoaded", li), tn = 1, si.map((e) => e());
};
let tn = !1;
ze && (tn = (Q.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(Q.readyState), tn || Q.addEventListener("DOMContentLoaded", li));
function wl(e) {
  ze && (tn ? setTimeout(e, 0) : si.push(e));
}
function Dt(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? oi(e) : "<".concat(t, " ").concat(bl(n), ">").concat(r.map(Dt).join(""), "</").concat(t, ">");
}
function ya(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var kn = function(e, t, n, r) {
  var a = Object.keys(e), o = a.length, i = t, s, l, c;
  for (n === void 0 ? (s = 1, c = e[a[0]]) : (s = 0, c = n); s < o; s++)
    l = a[s], c = i(c, e[l], l, e);
  return c;
};
function kl(e) {
  const t = [];
  let n = 0;
  const r = e.length;
  for (; n < r; ) {
    const a = e.charCodeAt(n++);
    if (a >= 55296 && a <= 56319 && n < r) {
      const o = e.charCodeAt(n++);
      (o & 64512) == 56320 ? t.push(((a & 1023) << 10) + (o & 1023) + 65536) : (t.push(a), n--);
    } else
      t.push(a);
  }
  return t;
}
function ci(e) {
  const t = kl(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function Ol(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), a;
  return r >= 55296 && r <= 56319 && n > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (r - 55296) * 1024 + a - 56320 + 65536 : r;
}
function va(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function tr(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, a = va(t);
  typeof Ae.hooks.addPack == "function" && !r ? Ae.hooks.addPack(e, va(t)) : Ae.styles[e] = k(k({}, Ae.styles[e] || {}), a), e === "fas" && tr("fa", t);
}
const {
  styles: Rt,
  shims: Al
} = Ae, fi = Object.keys(Lr), Sl = fi.reduce((e, t) => (e[t] = Object.keys(Lr[t]), e), {});
let Wr = null, ui = {}, di = {}, pi = {}, mi = {}, gi = {};
function El(e) {
  return ~fl.indexOf(e);
}
function Pl(e, t) {
  const n = t.split("-"), r = n[0], a = n.slice(1).join("-");
  return r === e && a !== "" && !El(a) ? a : null;
}
const bi = () => {
  const e = (r) => kn(Rt, (a, o, i) => (a[i] = kn(o, r, {}), a), {});
  ui = e((r, a, o) => (a[3] && (r[a[3]] = o), a[2] && a[2].filter((i) => typeof i == "number").forEach((i) => {
    r[i.toString(16)] = o;
  }), r)), di = e((r, a, o) => (r[o] = o, a[2] && a[2].filter((i) => typeof i == "string").forEach((i) => {
    r[i] = o;
  }), r)), gi = e((r, a, o) => {
    const i = a[2];
    return r[o] = o, i.forEach((s) => {
      r[s] = o;
    }), r;
  });
  const t = "far" in Rt || z.autoFetchSvg, n = kn(Al, (r, a) => {
    const o = a[0];
    let i = a[1];
    const s = a[2];
    return i === "far" && !t && (i = "fas"), typeof o == "string" && (r.names[o] = {
      prefix: i,
      iconName: s
    }), typeof o == "number" && (r.unicodes[o.toString(16)] = {
      prefix: i,
      iconName: s
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  pi = n.names, mi = n.unicodes, Wr = un(z.styleDefault, {
    family: z.familyDefault
  });
};
pl((e) => {
  Wr = un(e.styleDefault, {
    family: z.familyDefault
  });
});
bi();
function Ur(e, t) {
  return (ui[e] || {})[t];
}
function Cl(e, t) {
  return (di[e] || {})[t];
}
function Ze(e, t) {
  return (gi[e] || {})[t];
}
function hi(e) {
  return pi[e] || {
    prefix: null,
    iconName: null
  };
}
function Tl(e) {
  const t = mi[e], n = Ur("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function qe() {
  return Wr;
}
const yi = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function Il(e) {
  let t = le;
  const n = fi.reduce((r, a) => (r[a] = "".concat(z.cssPrefix, "-").concat(a), r), {});
  return Jo.forEach((r) => {
    (e.includes(n[r]) || e.some((a) => Sl[r].includes(a))) && (t = r);
  }), t;
}
function un(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = le
  } = t, r = ol[n][e];
  if (n === cn && !e)
    return "fad";
  const a = ba[n][e] || ba[n][r], o = e in Ae.styles ? e : null;
  return a || o || null;
}
function Nl(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const a = Pl(z.cssPrefix, r);
    a ? n = a : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function xa(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function dn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const a = Xn.concat(Hs), o = xa(e.filter((p) => a.includes(p))), i = xa(e.filter((p) => !Xn.includes(p))), s = o.filter((p) => (r = p, !Ko.includes(p))), [l = null] = s, c = Il(o), f = k(k({}, Nl(i)), {}, {
    prefix: un(l, {
      family: c
    })
  });
  return k(k(k({}, f), _l({
    values: e,
    family: c,
    styles: Rt,
    config: z,
    canonical: f,
    givenPrefix: r
  })), jl(n, r, f));
}
function jl(e, t, n) {
  let {
    prefix: r,
    iconName: a
  } = n;
  if (e || !r || !a)
    return {
      prefix: r,
      iconName: a
    };
  const o = t === "fa" ? hi(a) : {}, i = Ze(r, a);
  return a = o.iconName || i || a, r = o.prefix || r, r === "far" && !Rt.far && Rt.fas && !z.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: a
  };
}
const Ml = Jo.filter((e) => e !== le || e !== cn), Rl = Object.keys(Bn).filter((e) => e !== le).map((e) => Object.keys(Bn[e])).flat();
function _l(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: a = "",
    styles: o = {},
    config: i = {}
  } = e, s = n === cn, l = t.includes("fa-duotone") || t.includes("fad"), c = i.familyDefault === "duotone", f = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (l || c || f) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && Ml.includes(n) && (Object.keys(o).find((p) => Rl.includes(p)) || i.autoFetchSvg)) {
    const p = Ls.get(n).defaultShortPrefixId;
    r.prefix = p, r.iconName = Ze(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || a === "fa") && (r.prefix = qe() || "fas"), r;
}
class zl {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const a = n.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = k(k({}, this.definitions[o] || {}), a[o]), tr(o, a[o]);
      const i = Lr[le][o];
      i && tr(i, a[o]), bi();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, n) {
    const r = n.prefix && n.iconName && n.icon ? {
      0: n
    } : n;
    return Object.keys(r).map((a) => {
      const {
        prefix: o,
        iconName: i,
        icon: s
      } = r[a], l = s[2];
      t[o] || (t[o] = {}), l.length > 0 && l.forEach((c) => {
        typeof c == "string" && (t[o][c] = s);
      }), t[o][i] = s;
    }), t;
  }
}
let wa = [], it = {};
const ft = {}, Fl = Object.keys(ft);
function Dl(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return wa = e, it = {}, Object.keys(ft).forEach((r) => {
    Fl.indexOf(r) === -1 && delete ft[r];
  }), wa.forEach((r) => {
    const a = r.mixout ? r.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (n[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((i) => {
        n[o] || (n[o] = {}), n[o][i] = a[o][i];
      });
    }), r.hooks) {
      const o = r.hooks();
      Object.keys(o).forEach((i) => {
        it[i] || (it[i] = []), it[i].push(o[i]);
      });
    }
    r.provides && r.provides(ft);
  }), n;
}
function nr(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), a = 2; a < n; a++)
    r[a - 2] = arguments[a];
  return (it[e] || []).forEach((o) => {
    t = o.apply(null, [t, ...r]);
  }), t;
}
function tt(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (it[e] || []).forEach((a) => {
    a.apply(null, n);
  });
}
function He() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return ft[e] ? ft[e].apply(null, t) : void 0;
}
function rr(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || qe();
  if (t)
    return t = Ze(n, t) || t, ya(vi.definitions, n, t) || ya(Ae.styles, n, t);
}
const vi = new zl(), Ll = () => {
  z.autoReplaceSvg = !1, z.observeMutations = !1, tt("noAuto");
}, $l = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return ze ? (tt("beforeI2svg", e), He("pseudoElements2svg", e), He("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    z.autoReplaceSvg === !1 && (z.autoReplaceSvg = !0), z.observeMutations = !0, wl(() => {
      Wl({
        autoReplaceSvgRoot: t
      }), tt("watch", e);
    });
  }
}, Yl = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Ze(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = un(e[0]);
      return {
        prefix: n,
        iconName: Ze(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(z.cssPrefix, "-")) > -1 || e.match(il))) {
      const t = dn(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || qe(),
        iconName: Ze(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = qe();
      return {
        prefix: t,
        iconName: Ze(t, e) || e
      };
    }
  }
}, ye = {
  noAuto: Ll,
  config: z,
  dom: $l,
  parse: Yl,
  library: vi,
  findIconDefinition: rr,
  toHtml: Dt
}, Wl = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = Q
  } = e;
  (Object.keys(Ae.styles).length > 0 || z.autoFetchSvg) && ze && z.autoReplaceSvg && ye.dom.i2svg({
    node: t
  });
};
function pn(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => Dt(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!ze) return;
      const n = Q.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function Ul(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: a,
    styles: o,
    transform: i
  } = e;
  if (Yr(i) && n.found && !r.found) {
    const {
      width: s,
      height: l
    } = n, c = {
      x: s / l / 2,
      y: 0.5
    };
    a.style = fn(k(k({}, o), {}, {
      "transform-origin": "".concat(c.x + i.x / 16, "em ").concat(c.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function Gl(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: a,
    symbol: o
  } = e;
  const i = o === !0 ? "".concat(t, "-").concat(z.cssPrefix, "-").concat(n) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: k(k({}, a), {}, {
        id: i
      }),
      children: r
    }]
  }];
}
function Gr(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: a,
    transform: o,
    symbol: i,
    title: s,
    maskId: l,
    titleId: c,
    extra: f,
    watchable: p = !1
  } = e, {
    width: g,
    height: w
  } = n.found ? n : t, E = Gs.includes(r), v = [z.replacementClass, a ? "".concat(z.cssPrefix, "-").concat(a) : ""].filter((d) => f.classes.indexOf(d) === -1).filter((d) => d !== "" || !!d).concat(f.classes).join(" ");
  let m = {
    children: [],
    attributes: k(k({}, f.attributes), {}, {
      "data-prefix": r,
      "data-icon": a,
      class: v,
      role: f.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(g, " ").concat(w)
    })
  };
  const y = E && !~f.classes.indexOf("fa-fw") ? {
    width: "".concat(g / w * 16 * 0.0625, "em")
  } : {};
  p && (m.attributes[et] = ""), s && (m.children.push({
    tag: "title",
    attributes: {
      id: m.attributes["aria-labelledby"] || "title-".concat(c || Mt())
    },
    children: [s]
  }), delete m.attributes.title);
  const x = k(k({}, m), {}, {
    prefix: r,
    iconName: a,
    main: t,
    mask: n,
    maskId: l,
    transform: o,
    symbol: i,
    styles: k(k({}, y), f.styles)
  }), {
    children: A,
    attributes: I
  } = n.found && t.found ? He("generateAbstractMask", x) || {
    children: [],
    attributes: {}
  } : He("generateAbstractIcon", x) || {
    children: [],
    attributes: {}
  };
  return x.children = A, x.attributes = I, i ? Gl(x) : Ul(x);
}
function ka(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: a,
    title: o,
    extra: i,
    watchable: s = !1
  } = e, l = k(k(k({}, i.attributes), o ? {
    title: o
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (l[et] = "");
  const c = k({}, i.styles);
  Yr(a) && (c.transform = yl({
    transform: a,
    startCentered: !0,
    width: n,
    height: r
  }), c["-webkit-transform"] = c.transform);
  const f = fn(c);
  f.length > 0 && (l.style = f);
  const p = [];
  return p.push({
    tag: "span",
    attributes: l,
    children: [t]
  }), o && p.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), p;
}
function Vl(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, a = k(k(k({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), o = fn(r.styles);
  o.length > 0 && (a.style = o);
  const i = [];
  return i.push({
    tag: "span",
    attributes: a,
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
  styles: On
} = Ae;
function ar(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let a = null;
  return Array.isArray(r) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(z.cssPrefix, "-").concat(xn.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(z.cssPrefix, "-").concat(xn.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(z.cssPrefix, "-").concat(xn.PRIMARY),
        fill: "currentColor",
        d: r[1]
      }
    }]
  } : a = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: r
    }
  }, {
    found: !0,
    width: t,
    height: n,
    icon: a
  };
}
const ql = {
  found: !1,
  width: 512,
  height: 512
};
function Hl(e, t) {
  !ti && !z.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function or(e, t) {
  let n = t;
  return t === "fa" && z.styleDefault !== null && (t = qe()), new Promise((r, a) => {
    if (n === "fa") {
      const o = hi(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && On[t] && On[t][e]) {
      const o = On[t][e];
      return r(ar(o));
    }
    Hl(e, t), r(k(k({}, ql), {}, {
      icon: z.showMissingIcons && e ? He("missingIconAbstract") || {} : {}
    }));
  });
}
const Oa = () => {
}, ir = z.measurePerformance && Ut && Ut.mark && Ut.measure ? Ut : {
  mark: Oa,
  measure: Oa
}, Et = 'FA "6.7.2"', Bl = (e) => (ir.mark("".concat(Et, " ").concat(e, " begins")), () => xi(e)), xi = (e) => {
  ir.mark("".concat(Et, " ").concat(e, " ends")), ir.measure("".concat(Et, " ").concat(e), "".concat(Et, " ").concat(e, " begins"), "".concat(Et, " ").concat(e, " ends"));
};
var Vr = {
  begin: Bl,
  end: xi
};
const Kt = () => {
};
function Aa(e) {
  return typeof (e.getAttribute ? e.getAttribute(et) : null) == "string";
}
function Xl(e) {
  const t = e.getAttribute ? e.getAttribute(Fr) : null, n = e.getAttribute ? e.getAttribute(Dr) : null;
  return t && n;
}
function Kl(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(z.replacementClass);
}
function Jl() {
  return z.autoReplaceSvg === !0 ? Jt.replace : Jt[z.autoReplaceSvg] || Jt.replace;
}
function Zl(e) {
  return Q.createElementNS("http://www.w3.org/2000/svg", e);
}
function Ql(e) {
  return Q.createElement(e);
}
function wi(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? Zl : Ql
  } = t;
  if (typeof e == "string")
    return Q.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(a) {
    r.setAttribute(a, e.attributes[a]);
  }), (e.children || []).forEach(function(a) {
    r.appendChild(wi(a, {
      ceFn: n
    }));
  }), r;
}
function ec(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const Jt = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(wi(n), t);
      }), t.getAttribute(et) === null && z.keepOriginalSource) {
        let n = Q.createComment(ec(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~$r(t).indexOf(z.replacementClass))
      return Jt.replace(e);
    const r = new RegExp("".concat(z.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const o = n[0].attributes.class.split(" ").reduce((i, s) => (s === z.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = n.map((o) => Dt(o)).join(`
`);
    t.setAttribute(et, ""), t.innerHTML = a;
  }
};
function Sa(e) {
  e();
}
function ki(e, t) {
  const n = typeof t == "function" ? t : Kt;
  if (e.length === 0)
    n();
  else {
    let r = Sa;
    z.mutateApproach === rl && (r = Ve.requestAnimationFrame || Sa), r(() => {
      const a = Jl(), o = Vr.begin("mutate");
      e.map(a), o(), n();
    });
  }
}
let qr = !1;
function Oi() {
  qr = !0;
}
function sr() {
  qr = !1;
}
let nn = null;
function Ea(e) {
  if (!da || !z.observeMutations)
    return;
  const {
    treeCallback: t = Kt,
    nodeCallback: n = Kt,
    pseudoElementsCallback: r = Kt,
    observeMutationsRoot: a = Q
  } = e;
  nn = new da((o) => {
    if (qr) return;
    const i = qe();
    bt(o).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Aa(s.addedNodes[0]) && (z.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && z.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && Aa(s.target) && ~cl.indexOf(s.attributeName))
        if (s.attributeName === "class" && Xl(s.target)) {
          const {
            prefix: l,
            iconName: c
          } = dn($r(s.target));
          s.target.setAttribute(Fr, l || i), c && s.target.setAttribute(Dr, c);
        } else Kl(s.target) && n(s.target);
    });
  }), ze && nn.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function tc() {
  nn && nn.disconnect();
}
function nc(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, a) => {
    const o = a.split(":"), i = o[0], s = o.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function rc(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = dn($r(e));
  return a.prefix || (a.prefix = qe()), t && n && (a.prefix = t, a.iconName = n), a.iconName && a.prefix || (a.prefix && r.length > 0 && (a.iconName = Cl(a.prefix, e.innerText) || Ur(a.prefix, ci(e.innerText))), !a.iconName && z.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function ac(e) {
  const t = bt(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return z.autoA11y && (n ? t["aria-labelledby"] = "".concat(z.replacementClass, "-title-").concat(r || Mt()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function oc() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: Oe,
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
function Pa(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: a
  } = rc(e), o = ac(e), i = nr("parseNodeAttributes", {}, e);
  let s = t.styleParser ? nc(e) : [];
  return k({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: Oe,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: a,
      styles: s,
      attributes: o
    }
  }, i);
}
const {
  styles: ic
} = Ae;
function Ai(e) {
  const t = z.autoReplaceSvg === "nest" ? Pa(e, {
    styleParser: !1
  }) : Pa(e);
  return ~t.extra.classes.indexOf(ri) ? He("generateLayersText", e, t) : He("generateSvgReplacementMutation", e, t);
}
function sc() {
  return [...Ys, ...Xn];
}
function Ca(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!ze) return Promise.resolve();
  const n = Q.documentElement.classList, r = (f) => n.add("".concat(ga, "-").concat(f)), a = (f) => n.remove("".concat(ga, "-").concat(f)), o = z.autoFetchSvg ? sc() : Ko.concat(Object.keys(ic));
  o.includes("fa") || o.push("fa");
  const i = [".".concat(ri, ":not([").concat(et, "])")].concat(o.map((f) => ".".concat(f, ":not([").concat(et, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = bt(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), a("complete");
  else
    return Promise.resolve();
  const l = Vr.begin("onTree"), c = s.reduce((f, p) => {
    try {
      const g = Ai(p);
      g && f.push(g);
    } catch (g) {
      ti || g.name === "MissingIcon" && console.error(g);
    }
    return f;
  }, []);
  return new Promise((f, p) => {
    Promise.all(c).then((g) => {
      ki(g, () => {
        r("active"), r("complete"), a("pending"), typeof t == "function" && t(), l(), f();
      });
    }).catch((g) => {
      l(), p(g);
    });
  });
}
function lc(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  Ai(e).then((n) => {
    n && ki([n], t);
  });
}
function cc(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : rr(t || {});
    let {
      mask: a
    } = n;
    return a && (a = (a || {}).icon ? a : rr(a || {})), e(r, k(k({}, n), {}, {
      mask: a
    }));
  };
}
const fc = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = Oe,
    symbol: r = !1,
    mask: a = null,
    maskId: o = null,
    title: i = null,
    titleId: s = null,
    classes: l = [],
    attributes: c = {},
    styles: f = {}
  } = t;
  if (!e) return;
  const {
    prefix: p,
    iconName: g,
    icon: w
  } = e;
  return pn(k({
    type: "icon"
  }, e), () => (tt("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), z.autoA11y && (i ? c["aria-labelledby"] = "".concat(z.replacementClass, "-title-").concat(s || Mt()) : (c["aria-hidden"] = "true", c.focusable = "false")), Gr({
    icons: {
      main: ar(w),
      mask: a ? ar(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: p,
    iconName: g,
    transform: k(k({}, Oe), n),
    symbol: r,
    title: i,
    maskId: o,
    titleId: s,
    extra: {
      attributes: c,
      styles: f,
      classes: l
    }
  })));
};
var uc = {
  mixout() {
    return {
      icon: cc(fc)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Ca, e.nodeCallback = lc, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = Q,
        callback: r = () => {
        }
      } = t;
      return Ca(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: a,
        titleId: o,
        prefix: i,
        transform: s,
        symbol: l,
        mask: c,
        maskId: f,
        extra: p
      } = n;
      return new Promise((g, w) => {
        Promise.all([or(r, i), c.iconName ? or(c.iconName, c.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((E) => {
          let [v, m] = E;
          g([t, Gr({
            icons: {
              main: v,
              mask: m
            },
            prefix: i,
            iconName: r,
            transform: s,
            symbol: l,
            maskId: f,
            title: a,
            titleId: o,
            extra: p,
            watchable: !0
          })]);
        }).catch(w);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        transform: o,
        styles: i
      } = t;
      const s = fn(i);
      s.length > 0 && (r.style = s);
      let l;
      return Yr(o) && (l = He("generateAbstractTransformGrouping", {
        main: a,
        transform: o,
        containerWidth: a.width,
        iconWidth: a.width
      })), n.push(l || a.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, dc = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return pn({
          type: "layer"
        }, () => {
          tt("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let r = [];
          return e((a) => {
            Array.isArray(a) ? a.map((o) => {
              r = r.concat(o.abstract);
            }) : r = r.concat(a.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(z.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, pc = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: n = null,
          classes: r = [],
          attributes: a = {},
          styles: o = {}
        } = t;
        return pn({
          type: "counter",
          content: e
        }, () => (tt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Vl({
          content: e.toString(),
          title: n,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(z.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, mc = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = Oe,
          title: r = null,
          classes: a = [],
          attributes: o = {},
          styles: i = {}
        } = t;
        return pn({
          type: "text",
          content: e
        }, () => (tt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), ka({
          content: e,
          transform: k(k({}, Oe), n),
          title: r,
          extra: {
            attributes: o,
            styles: i,
            classes: ["".concat(z.cssPrefix, "-layers-text"), ...a]
          }
        })));
      }
    };
  },
  provides(e) {
    e.generateLayersText = function(t, n) {
      const {
        title: r,
        transform: a,
        extra: o
      } = n;
      let i = null, s = null;
      if (Bo) {
        const l = parseInt(getComputedStyle(t).fontSize, 10), c = t.getBoundingClientRect();
        i = c.width / l, s = c.height / l;
      }
      return z.autoA11y && !r && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, ka({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: a,
        title: r,
        extra: o,
        watchable: !0
      })]);
    };
  }
};
const gc = new RegExp('"', "ug"), Ta = [1105920, 1112319], Ia = k(k(k(k({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), Ds), tl), Bs), lr = Object.keys(Ia).reduce((e, t) => (e[t.toLowerCase()] = Ia[t], e), {}), bc = Object.keys(lr).reduce((e, t) => {
  const n = lr[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function hc(e) {
  const t = e.replace(gc, ""), n = Ol(t, 0), r = n >= Ta[0] && n <= Ta[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: ci(a ? t[0] : t),
    isSecondary: r || a
  };
}
function yc(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), a = isNaN(r) ? "normal" : r;
  return (lr[n] || {})[a] || bc[n];
}
function Na(e, t) {
  const n = "".concat(nl).concat(t.replace(":", "-"));
  return new Promise((r, a) => {
    if (e.getAttribute(n) !== null)
      return r();
    const o = bt(e.children).filter((p) => p.getAttribute(Jn) === t)[0], i = Ve.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), l = s.match(sl), c = i.getPropertyValue("font-weight"), f = i.getPropertyValue("content");
    if (o && !l)
      return e.removeChild(o), r();
    if (l && f !== "none" && f !== "") {
      const p = i.getPropertyValue("content");
      let g = yc(s, c);
      const {
        value: w,
        isSecondary: E
      } = hc(p), v = l[0].startsWith("FontAwesome");
      let m = Ur(g, w), y = m;
      if (v) {
        const x = Tl(w);
        x.iconName && x.prefix && (m = x.iconName, g = x.prefix);
      }
      if (m && !E && (!o || o.getAttribute(Fr) !== g || o.getAttribute(Dr) !== y)) {
        e.setAttribute(n, y), o && e.removeChild(o);
        const x = oc(), {
          extra: A
        } = x;
        A.attributes[Jn] = t, or(m, g).then((I) => {
          const d = Gr(k(k({}, x), {}, {
            icons: {
              main: I,
              mask: yi()
            },
            prefix: g,
            iconName: y,
            extra: A,
            watchable: !0
          })), K = Q.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(K, e.firstChild) : e.appendChild(K), K.outerHTML = d.map((re) => Dt(re)).join(`
`), e.removeAttribute(n), r();
        }).catch(a);
      } else
        r();
    } else
      r();
  });
}
function vc(e) {
  return Promise.all([Na(e, "::before"), Na(e, "::after")]);
}
function xc(e) {
  return e.parentNode !== document.head && !~al.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Jn) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function ja(e) {
  if (ze)
    return new Promise((t, n) => {
      const r = bt(e.querySelectorAll("*")).filter(xc).map(vc), a = Vr.begin("searchPseudoElements");
      Oi(), Promise.all(r).then(() => {
        a(), sr(), t();
      }).catch(() => {
        a(), sr(), n();
      });
    });
}
var wc = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = ja, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = Q
      } = t;
      z.searchPseudoElements && ja(n);
    };
  }
};
let Ma = !1;
var kc = {
  mixout() {
    return {
      dom: {
        unwatch() {
          Oi(), Ma = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Ea(nr("mutationObserverCallbacks", {}));
      },
      noAuto() {
        tc();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Ma ? sr() : Ea(nr("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Ra = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((n, r) => {
    const a = r.toLowerCase().split("-"), o = a[0];
    let i = a.slice(1).join("-");
    if (o && i === "h")
      return n.flipX = !0, n;
    if (o && i === "v")
      return n.flipY = !0, n;
    if (i = parseFloat(i), isNaN(i))
      return n;
    switch (o) {
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
var Oc = {
  mixout() {
    return {
      parse: {
        transform: (e) => Ra(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = Ra(n)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: n,
        transform: r,
        containerWidth: a,
        iconWidth: o
      } = t;
      const i = {
        transform: "translate(".concat(a / 2, " 256)")
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), l = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), c = "rotate(".concat(r.rotate, " 0 0)"), f = {
        transform: "".concat(s, " ").concat(l, " ").concat(c)
      }, p = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, g = {
        outer: i,
        inner: f,
        path: p
      };
      return {
        tag: "g",
        attributes: k({}, g.outer),
        children: [{
          tag: "g",
          attributes: k({}, g.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: k(k({}, n.icon.attributes), g.path)
          }]
        }]
      };
    };
  }
};
const An = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function _a(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function Ac(e) {
  return e.tag === "g" ? e.children : [e];
}
var Sc = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? dn(n.split(" ").map((a) => a.trim())) : yi();
        return r.prefix || (r.prefix = qe()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        mask: o,
        maskId: i,
        transform: s
      } = t;
      const {
        width: l,
        icon: c
      } = a, {
        width: f,
        icon: p
      } = o, g = hl({
        transform: s,
        containerWidth: f,
        iconWidth: l
      }), w = {
        tag: "rect",
        attributes: k(k({}, An), {}, {
          fill: "white"
        })
      }, E = c.children ? {
        children: c.children.map(_a)
      } : {}, v = {
        tag: "g",
        attributes: k({}, g.inner),
        children: [_a(k({
          tag: c.tag,
          attributes: k(k({}, c.attributes), g.path)
        }, E))]
      }, m = {
        tag: "g",
        attributes: k({}, g.outer),
        children: [v]
      }, y = "mask-".concat(i || Mt()), x = "clip-".concat(i || Mt()), A = {
        tag: "mask",
        attributes: k(k({}, An), {}, {
          id: y,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [w, m]
      }, I = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: x
          },
          children: Ac(p)
        }, A]
      };
      return n.push(I, {
        tag: "rect",
        attributes: k({
          fill: "currentColor",
          "clip-path": "url(#".concat(x, ")"),
          mask: "url(#".concat(y, ")")
        }, An)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, Ec = {
  provides(e) {
    let t = !1;
    Ve.matchMedia && (t = Ve.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: k(k({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = k(k({}, a), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: k(k({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: k(k({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: k(k({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(i), n.push({
        tag: "path",
        attributes: k(k({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: k(k({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: k(k({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: k(k({}, o), {}, {
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
}, Pc = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, Cc = [xl, uc, dc, pc, mc, wc, kc, Oc, Sc, Ec, Pc];
Dl(Cc, {
  mixoutsTo: ye
});
ye.noAuto;
ye.config;
ye.library;
ye.dom;
const cr = ye.parse;
ye.findIconDefinition;
ye.toHtml;
const Tc = ye.icon;
ye.layer;
ye.text;
ye.counter;
function Ic(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Vt = { exports: {} }, Sn = { exports: {} }, q = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var za;
function Nc() {
  if (za) return q;
  za = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, g = e ? Symbol.for("react.suspense_list") : 60120, w = e ? Symbol.for("react.memo") : 60115, E = e ? Symbol.for("react.lazy") : 60116, v = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, x = e ? Symbol.for("react.scope") : 60119;
  function A(d) {
    if (typeof d == "object" && d !== null) {
      var K = d.$$typeof;
      switch (K) {
        case t:
          switch (d = d.type, d) {
            case l:
            case c:
            case r:
            case o:
            case a:
            case p:
              return d;
            default:
              switch (d = d && d.$$typeof, d) {
                case s:
                case f:
                case E:
                case w:
                case i:
                  return d;
                default:
                  return K;
              }
          }
        case n:
          return K;
      }
    }
  }
  function I(d) {
    return A(d) === c;
  }
  return q.AsyncMode = l, q.ConcurrentMode = c, q.ContextConsumer = s, q.ContextProvider = i, q.Element = t, q.ForwardRef = f, q.Fragment = r, q.Lazy = E, q.Memo = w, q.Portal = n, q.Profiler = o, q.StrictMode = a, q.Suspense = p, q.isAsyncMode = function(d) {
    return I(d) || A(d) === l;
  }, q.isConcurrentMode = I, q.isContextConsumer = function(d) {
    return A(d) === s;
  }, q.isContextProvider = function(d) {
    return A(d) === i;
  }, q.isElement = function(d) {
    return typeof d == "object" && d !== null && d.$$typeof === t;
  }, q.isForwardRef = function(d) {
    return A(d) === f;
  }, q.isFragment = function(d) {
    return A(d) === r;
  }, q.isLazy = function(d) {
    return A(d) === E;
  }, q.isMemo = function(d) {
    return A(d) === w;
  }, q.isPortal = function(d) {
    return A(d) === n;
  }, q.isProfiler = function(d) {
    return A(d) === o;
  }, q.isStrictMode = function(d) {
    return A(d) === a;
  }, q.isSuspense = function(d) {
    return A(d) === p;
  }, q.isValidElementType = function(d) {
    return typeof d == "string" || typeof d == "function" || d === r || d === c || d === o || d === a || d === p || d === g || typeof d == "object" && d !== null && (d.$$typeof === E || d.$$typeof === w || d.$$typeof === i || d.$$typeof === s || d.$$typeof === f || d.$$typeof === m || d.$$typeof === y || d.$$typeof === x || d.$$typeof === v);
  }, q.typeOf = A, q;
}
var X = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Fa;
function jc() {
  return Fa || (Fa = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, g = e ? Symbol.for("react.suspense_list") : 60120, w = e ? Symbol.for("react.memo") : 60115, E = e ? Symbol.for("react.lazy") : 60116, v = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, x = e ? Symbol.for("react.scope") : 60119;
    function A(h) {
      return typeof h == "string" || typeof h == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      h === r || h === c || h === o || h === a || h === p || h === g || typeof h == "object" && h !== null && (h.$$typeof === E || h.$$typeof === w || h.$$typeof === i || h.$$typeof === s || h.$$typeof === f || h.$$typeof === m || h.$$typeof === y || h.$$typeof === x || h.$$typeof === v);
    }
    function I(h) {
      if (typeof h == "object" && h !== null) {
        var oe = h.$$typeof;
        switch (oe) {
          case t:
            var Pe = h.type;
            switch (Pe) {
              case l:
              case c:
              case r:
              case o:
              case a:
              case p:
                return Pe;
              default:
                var xt = Pe && Pe.$$typeof;
                switch (xt) {
                  case s:
                  case f:
                  case E:
                  case w:
                  case i:
                    return xt;
                  default:
                    return oe;
                }
            }
          case n:
            return oe;
        }
      }
    }
    var d = l, K = c, re = s, fe = i, ue = t, de = f, ie = r, D = E, ge = w, te = n, be = o, V = a, ne = p, se = !1;
    function ae(h) {
      return se || (se = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), u(h) || I(h) === l;
    }
    function u(h) {
      return I(h) === c;
    }
    function b(h) {
      return I(h) === s;
    }
    function N(h) {
      return I(h) === i;
    }
    function C(h) {
      return typeof h == "object" && h !== null && h.$$typeof === t;
    }
    function S(h) {
      return I(h) === f;
    }
    function j(h) {
      return I(h) === r;
    }
    function P(h) {
      return I(h) === E;
    }
    function T(h) {
      return I(h) === w;
    }
    function M(h) {
      return I(h) === n;
    }
    function _(h) {
      return I(h) === o;
    }
    function R(h) {
      return I(h) === a;
    }
    function U(h) {
      return I(h) === p;
    }
    X.AsyncMode = d, X.ConcurrentMode = K, X.ContextConsumer = re, X.ContextProvider = fe, X.Element = ue, X.ForwardRef = de, X.Fragment = ie, X.Lazy = D, X.Memo = ge, X.Portal = te, X.Profiler = be, X.StrictMode = V, X.Suspense = ne, X.isAsyncMode = ae, X.isConcurrentMode = u, X.isContextConsumer = b, X.isContextProvider = N, X.isElement = C, X.isForwardRef = S, X.isFragment = j, X.isLazy = P, X.isMemo = T, X.isPortal = M, X.isProfiler = _, X.isStrictMode = R, X.isSuspense = U, X.isValidElementType = A, X.typeOf = I;
  }()), X;
}
var Da;
function Si() {
  return Da || (Da = 1, process.env.NODE_ENV === "production" ? Sn.exports = Nc() : Sn.exports = jc()), Sn.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var En, La;
function Mc() {
  if (La) return En;
  La = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, n = Object.prototype.propertyIsEnumerable;
  function r(o) {
    if (o == null)
      throw new TypeError("Object.assign cannot be called with null or undefined");
    return Object(o);
  }
  function a() {
    try {
      if (!Object.assign)
        return !1;
      var o = new String("abc");
      if (o[5] = "de", Object.getOwnPropertyNames(o)[0] === "5")
        return !1;
      for (var i = {}, s = 0; s < 10; s++)
        i["_" + String.fromCharCode(s)] = s;
      var l = Object.getOwnPropertyNames(i).map(function(f) {
        return i[f];
      });
      if (l.join("") !== "0123456789")
        return !1;
      var c = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(f) {
        c[f] = f;
      }), Object.keys(Object.assign({}, c)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return En = a() ? Object.assign : function(o, i) {
    for (var s, l = r(o), c, f = 1; f < arguments.length; f++) {
      s = Object(arguments[f]);
      for (var p in s)
        t.call(s, p) && (l[p] = s[p]);
      if (e) {
        c = e(s);
        for (var g = 0; g < c.length; g++)
          n.call(s, c[g]) && (l[c[g]] = s[c[g]]);
      }
    }
    return l;
  }, En;
}
var Pn, $a;
function Hr() {
  if ($a) return Pn;
  $a = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return Pn = e, Pn;
}
var Ya, Wa;
function Ei() {
  return Wa || (Wa = 1, Ya = Function.call.bind(Object.prototype.hasOwnProperty)), Ya;
}
var Cn, Ua;
function Rc() {
  if (Ua) return Cn;
  Ua = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ Hr(), n = {}, r = /* @__PURE__ */ Ei();
    e = function(o) {
      var i = "Warning: " + o;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function a(o, i, s, l, c) {
    if (process.env.NODE_ENV !== "production") {
      for (var f in o)
        if (r(o, f)) {
          var p;
          try {
            if (typeof o[f] != "function") {
              var g = Error(
                (l || "React class") + ": " + s + " type `" + f + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[f] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw g.name = "Invariant Violation", g;
            }
            p = o[f](i, f, l, s, null, t);
          } catch (E) {
            p = E;
          }
          if (p && !(p instanceof Error) && e(
            (l || "React class") + ": type specification of " + s + " `" + f + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof p + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), p instanceof Error && !(p.message in n)) {
            n[p.message] = !0;
            var w = c ? c() : "";
            e(
              "Failed " + s + " type: " + p.message + (w ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, Cn = a, Cn;
}
var Tn, Ga;
function _c() {
  if (Ga) return Tn;
  Ga = 1;
  var e = Si(), t = Mc(), n = /* @__PURE__ */ Hr(), r = /* @__PURE__ */ Ei(), a = /* @__PURE__ */ Rc(), o = function() {
  };
  process.env.NODE_ENV !== "production" && (o = function(s) {
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
  return Tn = function(s, l) {
    var c = typeof Symbol == "function" && Symbol.iterator, f = "@@iterator";
    function p(u) {
      var b = u && (c && u[c] || u[f]);
      if (typeof b == "function")
        return b;
    }
    var g = "<<anonymous>>", w = {
      array: y("array"),
      bigint: y("bigint"),
      bool: y("boolean"),
      func: y("function"),
      number: y("number"),
      object: y("object"),
      string: y("string"),
      symbol: y("symbol"),
      any: x(),
      arrayOf: A,
      element: I(),
      elementType: d(),
      instanceOf: K,
      node: de(),
      objectOf: fe,
      oneOf: re,
      oneOfType: ue,
      shape: D,
      exact: ge
    };
    function E(u, b) {
      return u === b ? u !== 0 || 1 / u === 1 / b : u !== u && b !== b;
    }
    function v(u, b) {
      this.message = u, this.data = b && typeof b == "object" ? b : {}, this.stack = "";
    }
    v.prototype = Error.prototype;
    function m(u) {
      if (process.env.NODE_ENV !== "production")
        var b = {}, N = 0;
      function C(j, P, T, M, _, R, U) {
        if (M = M || g, R = R || T, U !== n) {
          if (l) {
            var h = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw h.name = "Invariant Violation", h;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var oe = M + ":" + T;
            !b[oe] && // Avoid spamming the console because they are often not actionable except for lib authors
            N < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + R + "` prop on `" + M + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), b[oe] = !0, N++);
          }
        }
        return P[T] == null ? j ? P[T] === null ? new v("The " + _ + " `" + R + "` is marked as required " + ("in `" + M + "`, but its value is `null`.")) : new v("The " + _ + " `" + R + "` is marked as required in " + ("`" + M + "`, but its value is `undefined`.")) : null : u(P, T, M, _, R);
      }
      var S = C.bind(null, !1);
      return S.isRequired = C.bind(null, !0), S;
    }
    function y(u) {
      function b(N, C, S, j, P, T) {
        var M = N[C], _ = V(M);
        if (_ !== u) {
          var R = ne(M);
          return new v(
            "Invalid " + j + " `" + P + "` of type " + ("`" + R + "` supplied to `" + S + "`, expected ") + ("`" + u + "`."),
            { expectedType: u }
          );
        }
        return null;
      }
      return m(b);
    }
    function x() {
      return m(i);
    }
    function A(u) {
      function b(N, C, S, j, P) {
        if (typeof u != "function")
          return new v("Property `" + P + "` of component `" + S + "` has invalid PropType notation inside arrayOf.");
        var T = N[C];
        if (!Array.isArray(T)) {
          var M = V(T);
          return new v("Invalid " + j + " `" + P + "` of type " + ("`" + M + "` supplied to `" + S + "`, expected an array."));
        }
        for (var _ = 0; _ < T.length; _++) {
          var R = u(T, _, S, j, P + "[" + _ + "]", n);
          if (R instanceof Error)
            return R;
        }
        return null;
      }
      return m(b);
    }
    function I() {
      function u(b, N, C, S, j) {
        var P = b[N];
        if (!s(P)) {
          var T = V(P);
          return new v("Invalid " + S + " `" + j + "` of type " + ("`" + T + "` supplied to `" + C + "`, expected a single ReactElement."));
        }
        return null;
      }
      return m(u);
    }
    function d() {
      function u(b, N, C, S, j) {
        var P = b[N];
        if (!e.isValidElementType(P)) {
          var T = V(P);
          return new v("Invalid " + S + " `" + j + "` of type " + ("`" + T + "` supplied to `" + C + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return m(u);
    }
    function K(u) {
      function b(N, C, S, j, P) {
        if (!(N[C] instanceof u)) {
          var T = u.name || g, M = ae(N[C]);
          return new v("Invalid " + j + " `" + P + "` of type " + ("`" + M + "` supplied to `" + S + "`, expected ") + ("instance of `" + T + "`."));
        }
        return null;
      }
      return m(b);
    }
    function re(u) {
      if (!Array.isArray(u))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), i;
      function b(N, C, S, j, P) {
        for (var T = N[C], M = 0; M < u.length; M++)
          if (E(T, u[M]))
            return null;
        var _ = JSON.stringify(u, function(R, U) {
          var h = ne(U);
          return h === "symbol" ? String(U) : U;
        });
        return new v("Invalid " + j + " `" + P + "` of value `" + String(T) + "` " + ("supplied to `" + S + "`, expected one of " + _ + "."));
      }
      return m(b);
    }
    function fe(u) {
      function b(N, C, S, j, P) {
        if (typeof u != "function")
          return new v("Property `" + P + "` of component `" + S + "` has invalid PropType notation inside objectOf.");
        var T = N[C], M = V(T);
        if (M !== "object")
          return new v("Invalid " + j + " `" + P + "` of type " + ("`" + M + "` supplied to `" + S + "`, expected an object."));
        for (var _ in T)
          if (r(T, _)) {
            var R = u(T, _, S, j, P + "." + _, n);
            if (R instanceof Error)
              return R;
          }
        return null;
      }
      return m(b);
    }
    function ue(u) {
      if (!Array.isArray(u))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var b = 0; b < u.length; b++) {
        var N = u[b];
        if (typeof N != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + se(N) + " at index " + b + "."
          ), i;
      }
      function C(S, j, P, T, M) {
        for (var _ = [], R = 0; R < u.length; R++) {
          var U = u[R], h = U(S, j, P, T, M, n);
          if (h == null)
            return null;
          h.data && r(h.data, "expectedType") && _.push(h.data.expectedType);
        }
        var oe = _.length > 0 ? ", expected one of type [" + _.join(", ") + "]" : "";
        return new v("Invalid " + T + " `" + M + "` supplied to " + ("`" + P + "`" + oe + "."));
      }
      return m(C);
    }
    function de() {
      function u(b, N, C, S, j) {
        return te(b[N]) ? null : new v("Invalid " + S + " `" + j + "` supplied to " + ("`" + C + "`, expected a ReactNode."));
      }
      return m(u);
    }
    function ie(u, b, N, C, S) {
      return new v(
        (u || "React class") + ": " + b + " type `" + N + "." + C + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + S + "`."
      );
    }
    function D(u) {
      function b(N, C, S, j, P) {
        var T = N[C], M = V(T);
        if (M !== "object")
          return new v("Invalid " + j + " `" + P + "` of type `" + M + "` " + ("supplied to `" + S + "`, expected `object`."));
        for (var _ in u) {
          var R = u[_];
          if (typeof R != "function")
            return ie(S, j, P, _, ne(R));
          var U = R(T, _, S, j, P + "." + _, n);
          if (U)
            return U;
        }
        return null;
      }
      return m(b);
    }
    function ge(u) {
      function b(N, C, S, j, P) {
        var T = N[C], M = V(T);
        if (M !== "object")
          return new v("Invalid " + j + " `" + P + "` of type `" + M + "` " + ("supplied to `" + S + "`, expected `object`."));
        var _ = t({}, N[C], u);
        for (var R in _) {
          var U = u[R];
          if (r(u, R) && typeof U != "function")
            return ie(S, j, P, R, ne(U));
          if (!U)
            return new v(
              "Invalid " + j + " `" + P + "` key `" + R + "` supplied to `" + S + "`.\nBad object: " + JSON.stringify(N[C], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(u), null, "  ")
            );
          var h = U(T, R, S, j, P + "." + R, n);
          if (h)
            return h;
        }
        return null;
      }
      return m(b);
    }
    function te(u) {
      switch (typeof u) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !u;
        case "object":
          if (Array.isArray(u))
            return u.every(te);
          if (u === null || s(u))
            return !0;
          var b = p(u);
          if (b) {
            var N = b.call(u), C;
            if (b !== u.entries) {
              for (; !(C = N.next()).done; )
                if (!te(C.value))
                  return !1;
            } else
              for (; !(C = N.next()).done; ) {
                var S = C.value;
                if (S && !te(S[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function be(u, b) {
      return u === "symbol" ? !0 : b ? b["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && b instanceof Symbol : !1;
    }
    function V(u) {
      var b = typeof u;
      return Array.isArray(u) ? "array" : u instanceof RegExp ? "object" : be(b, u) ? "symbol" : b;
    }
    function ne(u) {
      if (typeof u > "u" || u === null)
        return "" + u;
      var b = V(u);
      if (b === "object") {
        if (u instanceof Date)
          return "date";
        if (u instanceof RegExp)
          return "regexp";
      }
      return b;
    }
    function se(u) {
      var b = ne(u);
      switch (b) {
        case "array":
        case "object":
          return "an " + b;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + b;
        default:
          return b;
      }
    }
    function ae(u) {
      return !u.constructor || !u.constructor.name ? g : u.constructor.name;
    }
    return w.checkPropTypes = a, w.resetWarningCache = a.resetWarningCache, w.PropTypes = w, w;
  }, Tn;
}
var In, Va;
function zc() {
  if (Va) return In;
  Va = 1;
  var e = /* @__PURE__ */ Hr();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, In = function() {
    function r(i, s, l, c, f, p) {
      if (p !== e) {
        var g = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw g.name = "Invariant Violation", g;
      }
    }
    r.isRequired = r;
    function a() {
      return r;
    }
    var o = {
      array: r,
      bigint: r,
      bool: r,
      func: r,
      number: r,
      object: r,
      string: r,
      symbol: r,
      any: r,
      arrayOf: a,
      element: r,
      elementType: r,
      instanceOf: a,
      node: r,
      objectOf: a,
      oneOf: a,
      oneOfType: a,
      shape: a,
      exact: a,
      checkPropTypes: n,
      resetWarningCache: t
    };
    return o.PropTypes = o, o;
  }, In;
}
var qa;
function Fc() {
  if (qa) return Vt.exports;
  if (qa = 1, process.env.NODE_ENV !== "production") {
    var e = Si(), t = !0;
    Vt.exports = /* @__PURE__ */ _c()(e.isElement, t);
  } else
    Vt.exports = /* @__PURE__ */ zc()();
  return Vt.exports;
}
var Dc = /* @__PURE__ */ Fc();
const Y = /* @__PURE__ */ Ic(Dc);
function Ha(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function we(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Ha(Object(n), !0).forEach(function(r) {
      st(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Ha(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function rn(e) {
  "@babel/helpers - typeof";
  return rn = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, rn(e);
}
function st(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Lc(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), a, o;
  for (o = 0; o < r.length; o++)
    a = r[o], !(t.indexOf(a) >= 0) && (n[a] = e[a]);
  return n;
}
function $c(e, t) {
  if (e == null) return {};
  var n = Lc(e, t), r, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      r = o[a], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function fr(e) {
  return Yc(e) || Wc(e) || Uc(e) || Gc();
}
function Yc(e) {
  if (Array.isArray(e)) return ur(e);
}
function Wc(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Uc(e, t) {
  if (e) {
    if (typeof e == "string") return ur(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return ur(e, t);
  }
}
function ur(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function Gc() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Vc(e) {
  var t, n = e.beat, r = e.fade, a = e.beatFade, o = e.bounce, i = e.shake, s = e.flash, l = e.spin, c = e.spinPulse, f = e.spinReverse, p = e.pulse, g = e.fixedWidth, w = e.inverse, E = e.border, v = e.listItem, m = e.flip, y = e.size, x = e.rotation, A = e.pull, I = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": l,
    "fa-spin-reverse": f,
    "fa-spin-pulse": c,
    "fa-pulse": p,
    "fa-fw": g,
    "fa-inverse": w,
    "fa-border": E,
    "fa-li": v,
    "fa-flip": m === !0,
    "fa-flip-horizontal": m === "horizontal" || m === "both",
    "fa-flip-vertical": m === "vertical" || m === "both"
  }, st(t, "fa-".concat(y), typeof y < "u" && y !== null), st(t, "fa-rotate-".concat(x), typeof x < "u" && x !== null && x !== 0), st(t, "fa-pull-".concat(A), typeof A < "u" && A !== null), st(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(I).map(function(d) {
    return I[d] ? d : null;
  }).filter(function(d) {
    return d;
  });
}
function qc(e) {
  return e = e - 0, e === e;
}
function Pi(e) {
  return qc(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var Hc = ["style"];
function Bc(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function Xc(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), a = Pi(n.slice(0, r)), o = n.slice(r + 1).trim();
    return a.startsWith("webkit") ? t[Bc(a)] = o : t[a] = o, t;
  }, {});
}
function Ci(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(l) {
    return Ci(e, l);
  }), a = Object.keys(t.attributes || {}).reduce(function(l, c) {
    var f = t.attributes[c];
    switch (c) {
      case "class":
        l.attrs.className = f, delete t.attributes.class;
        break;
      case "style":
        l.attrs.style = Xc(f);
        break;
      default:
        c.indexOf("aria-") === 0 || c.indexOf("data-") === 0 ? l.attrs[c.toLowerCase()] = f : l.attrs[Pi(c)] = f;
    }
    return l;
  }, {
    attrs: {}
  }), o = n.style, i = o === void 0 ? {} : o, s = $c(n, Hc);
  return a.attrs.style = we(we({}, a.attrs.style), i), e.apply(void 0, [t.tag, we(we({}, a.attrs), s)].concat(fr(r)));
}
var Ti = !1;
try {
  Ti = process.env.NODE_ENV === "production";
} catch {
}
function Kc() {
  if (!Ti && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Ba(e) {
  if (e && rn(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (cr.icon)
    return cr.icon(e);
  if (e === null)
    return null;
  if (e && rn(e) === "object" && e.prefix && e.iconName)
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
function Nn(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? st({}, e, t) : {};
}
var Xa = {
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
}, me = /* @__PURE__ */ ln.forwardRef(function(e, t) {
  var n = we(we({}, Xa), e), r = n.icon, a = n.mask, o = n.symbol, i = n.className, s = n.title, l = n.titleId, c = n.maskId, f = Ba(r), p = Nn("classes", [].concat(fr(Vc(n)), fr((i || "").split(" ")))), g = Nn("transform", typeof n.transform == "string" ? cr.transform(n.transform) : n.transform), w = Nn("mask", Ba(a)), E = Tc(f, we(we(we(we({}, p), g), w), {}, {
    symbol: o,
    title: s,
    titleId: l,
    maskId: c
  }));
  if (!E)
    return Kc("Could not find icon", f), null;
  var v = E.abstract, m = {
    ref: t
  };
  return Object.keys(n).forEach(function(y) {
    Xa.hasOwnProperty(y) || (m[y] = n[y]);
  }), Jc(v[0], m);
});
me.displayName = "FontAwesomeIcon";
me.propTypes = {
  beat: Y.bool,
  border: Y.bool,
  beatFade: Y.bool,
  bounce: Y.bool,
  className: Y.string,
  fade: Y.bool,
  flash: Y.bool,
  mask: Y.oneOfType([Y.object, Y.array, Y.string]),
  maskId: Y.string,
  fixedWidth: Y.bool,
  inverse: Y.bool,
  flip: Y.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: Y.oneOfType([Y.object, Y.array, Y.string]),
  listItem: Y.bool,
  pull: Y.oneOf(["right", "left"]),
  pulse: Y.bool,
  rotation: Y.oneOf([0, 90, 180, 270]),
  shake: Y.bool,
  size: Y.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: Y.bool,
  spinPulse: Y.bool,
  spinReverse: Y.bool,
  symbol: Y.oneOfType([Y.bool, Y.string]),
  title: Y.string,
  titleId: Y.string,
  transform: Y.oneOfType([Y.string, Y.object]),
  swapOpacity: Y.bool
};
var Jc = Ci.bind(null, ln.createElement);
const Br = "-", Zc = (e) => {
  const t = ef(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (a) => {
      const o = a.split(Br);
      return o[0] === "" && o.length !== 1 && o.shift(), Ii(o, t) || Qc(a);
    },
    getConflictingClassGroupIds: (a, o) => {
      const i = n[a] || [];
      return o && r[a] ? [...i, ...r[a]] : i;
    }
  };
}, Ii = (e, t) => {
  var n;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], a = t.nextPart.get(r), o = a ? Ii(e.slice(1), a) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const i = e.join(Br);
  return (n = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : n.classGroupId;
}, Ka = /^\[(.+)\]$/, Qc = (e) => {
  if (Ka.test(e)) {
    const t = Ka.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, ef = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return nf(Object.entries(e.classGroups), n).forEach(([a, o]) => {
    dr(o, r, a, t);
  }), r;
}, dr = (e, t, n, r) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : Ja(t, a);
      o.classGroupId = n;
      return;
    }
    if (typeof a == "function") {
      if (tf(a)) {
        dr(a(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: n
      });
      return;
    }
    Object.entries(a).forEach(([o, i]) => {
      dr(i, Ja(t, o), n, r);
    });
  });
}, Ja = (e, t) => {
  let n = e;
  return t.split(Br).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, tf = (e) => e.isThemeGetter, nf = (e, t) => t ? e.map(([n, r]) => {
  const a = r.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([i, s]) => [t + i, s])) : o);
  return [n, a];
}) : e, rf = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const a = (o, i) => {
    n.set(o, i), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(o) {
      let i = n.get(o);
      if (i !== void 0)
        return i;
      if ((i = r.get(o)) !== void 0)
        return a(o, i), i;
    },
    set(o, i) {
      n.has(o) ? n.set(o, i) : a(o, i);
    }
  };
}, Ni = "!", af = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, a = t[0], o = t.length, i = (s) => {
    const l = [];
    let c = 0, f = 0, p;
    for (let m = 0; m < s.length; m++) {
      let y = s[m];
      if (c === 0) {
        if (y === a && (r || s.slice(m, m + o) === t)) {
          l.push(s.slice(f, m)), f = m + o;
          continue;
        }
        if (y === "/") {
          p = m;
          continue;
        }
      }
      y === "[" ? c++ : y === "]" && c--;
    }
    const g = l.length === 0 ? s : s.substring(f), w = g.startsWith(Ni), E = w ? g.substring(1) : g, v = p && p > f ? p - f : void 0;
    return {
      modifiers: l,
      hasImportantModifier: w,
      baseClassName: E,
      maybePostfixModifierPosition: v
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, of = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, sf = (e) => ({
  cache: rf(e.cacheSize),
  parseClassName: af(e),
  ...Zc(e)
}), lf = /\s+/, cf = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: a
  } = t, o = [], i = e.trim().split(lf);
  let s = "";
  for (let l = i.length - 1; l >= 0; l -= 1) {
    const c = i[l], {
      modifiers: f,
      hasImportantModifier: p,
      baseClassName: g,
      maybePostfixModifierPosition: w
    } = n(c);
    let E = !!w, v = r(E ? g.substring(0, w) : g);
    if (!v) {
      if (!E) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (v = r(g), !v) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      E = !1;
    }
    const m = of(f).join(":"), y = p ? m + Ni : m, x = y + v;
    if (o.includes(x))
      continue;
    o.push(x);
    const A = a(v, E);
    for (let I = 0; I < A.length; ++I) {
      const d = A[I];
      o.push(y + d);
    }
    s = c + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function ff() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = ji(t)) && (r && (r += " "), r += n);
  return r;
}
const ji = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = ji(e[r])) && (n && (n += " "), n += t);
  return n;
};
function uf(e, ...t) {
  let n, r, a, o = i;
  function i(l) {
    const c = t.reduce((f, p) => p(f), e());
    return n = sf(c), r = n.cache.get, a = n.cache.set, o = s, s(l);
  }
  function s(l) {
    const c = r(l);
    if (c)
      return c;
    const f = cf(l, n);
    return a(l, f), f;
  }
  return function() {
    return o(ff.apply(null, arguments));
  };
}
const J = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, Mi = /^\[(?:([a-z-]+):)?(.+)\]$/i, df = /^\d+\/\d+$/, pf = /* @__PURE__ */ new Set(["px", "full", "screen"]), mf = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, gf = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, bf = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, hf = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, yf = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Ce = (e) => ut(e) || pf.has(e) || df.test(e), Le = (e) => ht(e, "length", Ef), ut = (e) => !!e && !Number.isNaN(Number(e)), jn = (e) => ht(e, "number", ut), wt = (e) => !!e && Number.isInteger(Number(e)), vf = (e) => e.endsWith("%") && ut(e.slice(0, -1)), L = (e) => Mi.test(e), $e = (e) => mf.test(e), xf = /* @__PURE__ */ new Set(["length", "size", "percentage"]), wf = (e) => ht(e, xf, Ri), kf = (e) => ht(e, "position", Ri), Of = /* @__PURE__ */ new Set(["image", "url"]), Af = (e) => ht(e, Of, Cf), Sf = (e) => ht(e, "", Pf), kt = () => !0, ht = (e, t, n) => {
  const r = Mi.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, Ef = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  gf.test(e) && !bf.test(e)
), Ri = () => !1, Pf = (e) => hf.test(e), Cf = (e) => yf.test(e), Tf = () => {
  const e = J("colors"), t = J("spacing"), n = J("blur"), r = J("brightness"), a = J("borderColor"), o = J("borderRadius"), i = J("borderSpacing"), s = J("borderWidth"), l = J("contrast"), c = J("grayscale"), f = J("hueRotate"), p = J("invert"), g = J("gap"), w = J("gradientColorStops"), E = J("gradientColorStopPositions"), v = J("inset"), m = J("margin"), y = J("opacity"), x = J("padding"), A = J("saturate"), I = J("scale"), d = J("sepia"), K = J("skew"), re = J("space"), fe = J("translate"), ue = () => ["auto", "contain", "none"], de = () => ["auto", "hidden", "clip", "visible", "scroll"], ie = () => ["auto", L, t], D = () => [L, t], ge = () => ["", Ce, Le], te = () => ["auto", ut, L], be = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], V = () => ["solid", "dashed", "dotted", "double", "none"], ne = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], se = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], ae = () => ["", "0", L], u = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], b = () => [ut, L];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [kt],
      spacing: [Ce, Le],
      blur: ["none", "", $e, L],
      brightness: b(),
      borderColor: [e],
      borderRadius: ["none", "", "full", $e, L],
      borderSpacing: D(),
      borderWidth: ge(),
      contrast: b(),
      grayscale: ae(),
      hueRotate: b(),
      invert: ae(),
      gap: D(),
      gradientColorStops: [e],
      gradientColorStopPositions: [vf, Le],
      inset: ie(),
      margin: ie(),
      opacity: b(),
      padding: D(),
      saturate: b(),
      scale: b(),
      sepia: ae(),
      skew: b(),
      space: D(),
      translate: D()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", L]
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
        columns: [$e]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": u()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": u()
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
        object: [...be(), L]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: de()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": de()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": de()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: ue()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": ue()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": ue()
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
        inset: [v]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [v]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [v]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [v]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [v]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [v]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [v]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [v]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [v]
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
        z: ["auto", wt, L]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ie()
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
        flex: ["1", "auto", "initial", "none", L]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: ae()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: ae()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", wt, L]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [kt]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", wt, L]
        }, L]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": te()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": te()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [kt]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [wt, L]
        }, L]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": te()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": te()
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
        "auto-cols": ["auto", "min", "max", "fr", L]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", L]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [g]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [g]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [g]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...se()]
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
        content: ["normal", ...se(), "baseline"]
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
        "place-content": [...se(), "baseline"]
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
        "space-x": [re]
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
        "space-y": [re]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", L, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [L, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [L, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [$e]
        }, $e]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [L, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [L, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [L, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [L, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", $e, Le]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", jn]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [kt]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", L]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", ut, jn]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Ce, L]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", L]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", L]
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
        decoration: ["auto", "from-font", Ce, Le]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Ce, L]
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
        indent: D()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", L]
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
        content: ["none", L]
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
        bg: [...be(), kf]
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
        bg: ["auto", "cover", "contain", wf]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, Af]
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
        from: [E]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [E]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [E]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [w]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [w]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [w]
      }],
      // Borders
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: [o]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [o]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [o]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [o]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [o]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [o]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [o]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [o]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [o]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [o]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [o]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [o]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [o]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [o]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [o]
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
        border: [...V(), "hidden"]
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
        divide: V()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [a]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [a]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [a]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [a]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [a]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [a]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [a]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [a]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [a]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [a]
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
        "outline-offset": [Ce, L]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Ce, Le]
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
        ring: ge()
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
        "ring-offset": [Ce, Le]
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
        shadow: ["", "inner", "none", $e, Sf]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [kt]
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
        "mix-blend": [...ne(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": ne()
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
        "drop-shadow": ["", "none", $e, L]
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
        "hue-rotate": [f]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [p]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [A]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [d]
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
        "backdrop-hue-rotate": [f]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [p]
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
        "backdrop-saturate": [A]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [d]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", L]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: b()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", L]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: b()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", L]
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
        scale: [I]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [I]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [I]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [wt, L]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [fe]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [fe]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [K]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [K]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", L]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", L]
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
        "scroll-m": D()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": D()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": D()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": D()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": D()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": D()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": D()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": D()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": D()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": D()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": D()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": D()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": D()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": D()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": D()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": D()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": D()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": D()
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
        "will-change": ["auto", "scroll", "contents", "transform", L]
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
        stroke: [Ce, Le, jn]
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
}, Za = /* @__PURE__ */ uf(Tf);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const ot = {
  prefix: "fas",
  iconName: "spinner-third",
  icon: [512, 512, [], "f3f4", "M224 32c0-17.7 14.3-32 32-32C397.4 0 512 114.6 512 256c0 46.6-12.5 90.4-34.3 128c-8.8 15.3-28.4 20.5-43.7 11.7s-20.5-28.4-11.7-43.7c16.3-28.2 25.7-61 25.7-96c0-106-86-192-192-192c-17.7 0-32-14.3-32-32z"]
}, Ot = ({
  icon: e,
  iconClassName: t,
  children: n,
  className: r,
  htmlFor: a,
  variant: o = "primary",
  disabled: i,
  iconFlip: s = !1,
  loading: l,
  as: c = "button",
  href: f,
  target: p,
  ...g
}) => {
  function w(m) {
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
  const E = Za(
    i || l ? "opacity-50 pointer-events-none" : ""
  ), v = Za(
    "w-fit text-sm font-medium rounded-lg px-3 py-2 border border-transparent shadow-sm focus-visible:outline focus-visible:outline-0 focus-visible:outline-offset-0 transition-all duration-150 flex gap-2 items-center justify-center active:scale-95 transform",
    w(o),
    r,
    E
  );
  return a ? /* @__PURE__ */ xe("label", { className: v, htmlFor: a, style: g.style, children: [
    l && !s ? /* @__PURE__ */ G(me, { icon: ot, className: "animate-spin" }) : /* @__PURE__ */ G(at, { children: e && !s ? /* @__PURE__ */ G(me, { icon: e, className: t }) : null }),
    n,
    l && s ? /* @__PURE__ */ G(me, { icon: ot, className: "animate-spin" }) : /* @__PURE__ */ G(at, { children: e && s ? /* @__PURE__ */ G(me, { icon: e, className: t }) : null })
  ] }) : c === "link" && f ? /* @__PURE__ */ xe(
    "a",
    {
      href: f,
      className: v,
      style: g.style,
      ...g,
      target: p,
      children: [
        l && !s ? /* @__PURE__ */ G(me, { icon: ot, className: "animate-spin" }) : /* @__PURE__ */ G(at, { children: e && !s ? /* @__PURE__ */ G(me, { icon: e, className: t }) : null }),
        n,
        l && s ? /* @__PURE__ */ G(me, { icon: ot, className: "animate-spin" }) : /* @__PURE__ */ G(at, { children: e && s ? /* @__PURE__ */ G(me, { icon: e, className: t }) : null })
      ]
    }
  ) : /* @__PURE__ */ xe(
    "button",
    {
      className: v,
      disabled: i || l,
      ...g,
      htmlFor: a,
      children: [
        l && !s ? /* @__PURE__ */ G(me, { icon: ot, className: "animate-spin" }) : /* @__PURE__ */ G(at, { children: e && !s ? /* @__PURE__ */ G(me, { icon: e, className: t }) : null }),
        n,
        l && s ? /* @__PURE__ */ G(me, { icon: ot, className: "animate-spin" }) : /* @__PURE__ */ G(at, { children: e && s ? /* @__PURE__ */ G(me, { icon: e, className: t }) : null })
      ]
    }
  );
};
var Zt = /* @__PURE__ */ ((e) => (e[e.ALL = 0] = "ALL", e[e.FEATURED = 1] = "FEATURED", e[e.MINE = 2] = "MINE", e[e.BOOKMARKED = 3] = "BOOKMARKED", e))(Zt || {});
Zt.FEATURED, Zt.MINE, Zt.BOOKMARKED;
const Xr = "-", If = (e) => {
  const t = jf(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (i) => {
      const s = i.split(Xr);
      return s[0] === "" && s.length !== 1 && s.shift(), _i(s, t) || Nf(i);
    },
    getConflictingClassGroupIds: (i, s) => {
      const l = n[i] || [];
      return s && r[i] ? [...l, ...r[i]] : l;
    }
  };
}, _i = (e, t) => {
  var i;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], r = t.nextPart.get(n), a = r ? _i(e.slice(1), r) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const o = e.join(Xr);
  return (i = t.validators.find(({
    validator: s
  }) => s(o))) == null ? void 0 : i.classGroupId;
}, Qa = /^\[(.+)\]$/, Nf = (e) => {
  if (Qa.test(e)) {
    const t = Qa.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, jf = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return Rf(Object.entries(e.classGroups), n).forEach(([o, i]) => {
    pr(i, r, o, t);
  }), r;
}, pr = (e, t, n, r) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : eo(t, a);
      o.classGroupId = n;
      return;
    }
    if (typeof a == "function") {
      if (Mf(a)) {
        pr(a(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: n
      });
      return;
    }
    Object.entries(a).forEach(([o, i]) => {
      pr(i, eo(t, o), n, r);
    });
  });
}, eo = (e, t) => {
  let n = e;
  return t.split(Xr).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, Mf = (e) => e.isThemeGetter, Rf = (e, t) => t ? e.map(([n, r]) => {
  const a = r.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([i, s]) => [t + i, s])) : o);
  return [n, a];
}) : e, _f = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const a = (o, i) => {
    n.set(o, i), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(o) {
      let i = n.get(o);
      if (i !== void 0)
        return i;
      if ((i = r.get(o)) !== void 0)
        return a(o, i), i;
    },
    set(o, i) {
      n.has(o) ? n.set(o, i) : a(o, i);
    }
  };
}, zi = "!", zf = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, a = t[0], o = t.length, i = (s) => {
    const l = [];
    let c = 0, f = 0, p;
    for (let m = 0; m < s.length; m++) {
      let y = s[m];
      if (c === 0) {
        if (y === a && (r || s.slice(m, m + o) === t)) {
          l.push(s.slice(f, m)), f = m + o;
          continue;
        }
        if (y === "/") {
          p = m;
          continue;
        }
      }
      y === "[" ? c++ : y === "]" && c--;
    }
    const g = l.length === 0 ? s : s.substring(f), w = g.startsWith(zi), E = w ? g.substring(1) : g, v = p && p > f ? p - f : void 0;
    return {
      modifiers: l,
      hasImportantModifier: w,
      baseClassName: E,
      maybePostfixModifierPosition: v
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, Ff = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, Df = (e) => ({
  cache: _f(e.cacheSize),
  parseClassName: zf(e),
  ...If(e)
}), Lf = /\s+/, $f = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: a
  } = t, o = [], i = e.trim().split(Lf);
  let s = "";
  for (let l = i.length - 1; l >= 0; l -= 1) {
    const c = i[l], {
      modifiers: f,
      hasImportantModifier: p,
      baseClassName: g,
      maybePostfixModifierPosition: w
    } = n(c);
    let E = !!w, v = r(E ? g.substring(0, w) : g);
    if (!v) {
      if (!E) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (v = r(g), !v) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      E = !1;
    }
    const m = Ff(f).join(":"), y = p ? m + zi : m, x = y + v;
    if (o.includes(x))
      continue;
    o.push(x);
    const A = a(v, E);
    for (let I = 0; I < A.length; ++I) {
      const d = A[I];
      o.push(y + d);
    }
    s = c + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function Yf() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = Fi(t)) && (r && (r += " "), r += n);
  return r;
}
const Fi = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = Fi(e[r])) && (n && (n += " "), n += t);
  return n;
};
function Wf(e, ...t) {
  let n, r, a, o = i;
  function i(l) {
    const c = t.reduce((f, p) => p(f), e());
    return n = Df(c), r = n.cache.get, a = n.cache.set, o = s, s(l);
  }
  function s(l) {
    const c = r(l);
    if (c)
      return c;
    const f = $f(l, n);
    return a(l, f), f;
  }
  return function() {
    return o(Yf.apply(null, arguments));
  };
}
const Z = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, Di = /^\[(?:([a-z-]+):)?(.+)\]$/i, Uf = /^\d+\/\d+$/, Gf = /* @__PURE__ */ new Set(["px", "full", "screen"]), Vf = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, qf = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Hf = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Bf = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Xf = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Te = (e) => dt(e) || Gf.has(e) || Uf.test(e), Ye = (e) => yt(e, "length", ru), dt = (e) => !!e && !Number.isNaN(Number(e)), Mn = (e) => yt(e, "number", dt), At = (e) => !!e && Number.isInteger(Number(e)), Kf = (e) => e.endsWith("%") && dt(e.slice(0, -1)), $ = (e) => Di.test(e), We = (e) => Vf.test(e), Jf = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Zf = (e) => yt(e, Jf, Li), Qf = (e) => yt(e, "position", Li), eu = /* @__PURE__ */ new Set(["image", "url"]), tu = (e) => yt(e, eu, ou), nu = (e) => yt(e, "", au), St = () => !0, yt = (e, t, n) => {
  const r = Di.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, ru = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  qf.test(e) && !Hf.test(e)
), Li = () => !1, au = (e) => Bf.test(e), ou = (e) => Xf.test(e), iu = () => {
  const e = Z("colors"), t = Z("spacing"), n = Z("blur"), r = Z("brightness"), a = Z("borderColor"), o = Z("borderRadius"), i = Z("borderSpacing"), s = Z("borderWidth"), l = Z("contrast"), c = Z("grayscale"), f = Z("hueRotate"), p = Z("invert"), g = Z("gap"), w = Z("gradientColorStops"), E = Z("gradientColorStopPositions"), v = Z("inset"), m = Z("margin"), y = Z("opacity"), x = Z("padding"), A = Z("saturate"), I = Z("scale"), d = Z("sepia"), K = Z("skew"), re = Z("space"), fe = Z("translate"), ue = () => ["auto", "contain", "none"], de = () => ["auto", "hidden", "clip", "visible", "scroll"], ie = () => ["auto", $, t], D = () => [$, t], ge = () => ["", Te, Ye], te = () => ["auto", dt, $], be = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], V = () => ["solid", "dashed", "dotted", "double", "none"], ne = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], se = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], ae = () => ["", "0", $], u = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], b = () => [dt, $];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [St],
      spacing: [Te, Ye],
      blur: ["none", "", We, $],
      brightness: b(),
      borderColor: [e],
      borderRadius: ["none", "", "full", We, $],
      borderSpacing: D(),
      borderWidth: ge(),
      contrast: b(),
      grayscale: ae(),
      hueRotate: b(),
      invert: ae(),
      gap: D(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Kf, Ye],
      inset: ie(),
      margin: ie(),
      opacity: b(),
      padding: D(),
      saturate: b(),
      scale: b(),
      sepia: ae(),
      skew: b(),
      space: D(),
      translate: D()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", $]
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
        columns: [We]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": u()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": u()
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
        object: [...be(), $]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: de()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": de()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": de()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: ue()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": ue()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": ue()
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
        inset: [v]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [v]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [v]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [v]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [v]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [v]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [v]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [v]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [v]
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
        z: ["auto", At, $]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ie()
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
        flex: ["1", "auto", "initial", "none", $]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: ae()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: ae()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", At, $]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [St]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", At, $]
        }, $]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": te()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": te()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [St]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [At, $]
        }, $]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": te()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": te()
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
        "auto-cols": ["auto", "min", "max", "fr", $]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", $]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [g]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [g]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [g]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...se()]
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
        content: ["normal", ...se(), "baseline"]
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
        "place-content": [...se(), "baseline"]
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
        "space-x": [re]
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
        "space-y": [re]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", $, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [$, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [$, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [We]
        }, We]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [$, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [$, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [$, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [$, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", We, Ye]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Mn]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [St]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", $]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", dt, Mn]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Te, $]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", $]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", $]
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
        decoration: ["auto", "from-font", Te, Ye]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Te, $]
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
        indent: D()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", $]
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
        content: ["none", $]
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
        bg: [...be(), Qf]
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
        bg: ["auto", "cover", "contain", Zf]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, tu]
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
        from: [E]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [E]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [E]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [w]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [w]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [w]
      }],
      // Borders
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: [o]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [o]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [o]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [o]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [o]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [o]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [o]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [o]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [o]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [o]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [o]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [o]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [o]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [o]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [o]
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
        border: [...V(), "hidden"]
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
        divide: V()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [a]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [a]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [a]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [a]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [a]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [a]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [a]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [a]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [a]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [a]
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
        "outline-offset": [Te, $]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Te, Ye]
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
        ring: ge()
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
        "ring-offset": [Te, Ye]
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
        shadow: ["", "inner", "none", We, nu]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [St]
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
        "mix-blend": [...ne(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": ne()
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
        "drop-shadow": ["", "none", We, $]
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
        "hue-rotate": [f]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [p]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [A]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [d]
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
        "backdrop-hue-rotate": [f]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [p]
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
        "backdrop-saturate": [A]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [d]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", $]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: b()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", $]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: b()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", $]
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
        scale: [I]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [I]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [I]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [At, $]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [fe]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [fe]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [K]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [K]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", $]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", $]
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
        "scroll-m": D()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": D()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": D()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": D()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": D()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": D()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": D()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": D()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": D()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": D()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": D()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": D()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": D()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": D()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": D()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": D()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": D()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": D()
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
        "will-change": ["auto", "scroll", "contents", "transform", $]
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
        stroke: [Te, Ye, Mn]
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
}, to = /* @__PURE__ */ Wf(iu);
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function su(e, t, n) {
  return (t = cu(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function no(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function O(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? no(Object(n), !0).forEach(function(r) {
      su(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : no(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function lu(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function cu(e) {
  var t = lu(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const ro = () => {
};
let Kr = {}, $i = {}, Yi = null, Wi = {
  mark: ro,
  measure: ro
};
try {
  typeof window < "u" && (Kr = window), typeof document < "u" && ($i = document), typeof MutationObserver < "u" && (Yi = MutationObserver), typeof performance < "u" && (Wi = performance);
} catch {
}
const {
  userAgent: ao = ""
} = Kr.navigator || {}, Be = Kr, ee = $i, oo = Yi, qt = Wi;
Be.document;
const Fe = !!ee.documentElement && !!ee.head && typeof ee.addEventListener == "function" && typeof ee.createElement == "function", Ui = ~ao.indexOf("MSIE") || ~ao.indexOf("Trident/");
var fu = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, uu = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Gi = {
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
}, du = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Vi = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], ce = "classic", mn = "duotone", pu = "sharp", mu = "sharp-duotone", qi = [ce, mn, pu, mu], gu = {
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
}, bu = {
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
}, hu = /* @__PURE__ */ new Map([["classic", {
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
}]]), yu = {
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
}, vu = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], io = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, xu = ["kit"], wu = {
  kit: {
    "fa-kit": "fak"
  }
}, ku = ["fak", "fakd"], Ou = {
  kit: {
    fak: "fa-kit"
  }
}, so = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Ht = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Au = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Su = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Eu = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, Pu = {
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
}, Cu = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, mr = {
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
}, Tu = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], gr = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...Au, ...Tu], Iu = ["solid", "regular", "light", "thin", "duotone", "brands"], Hi = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], Nu = Hi.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), ju = [...Object.keys(Cu), ...Iu, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Ht.GROUP, Ht.SWAP_OPACITY, Ht.PRIMARY, Ht.SECONDARY].concat(Hi.map((e) => "".concat(e, "x"))).concat(Nu.map((e) => "w-".concat(e))), Mu = {
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
const Me = "___FONT_AWESOME___", br = 16, Bi = "fa", Xi = "svg-inline--fa", nt = "data-fa-i2svg", hr = "data-fa-pseudo-element", Ru = "data-fa-pseudo-element-pending", Jr = "data-prefix", Zr = "data-icon", lo = "fontawesome-i2svg", _u = "async", zu = ["HTML", "HEAD", "STYLE", "SCRIPT"], Ki = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Lt(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[ce];
    }
  });
}
const Ji = O({}, Gi);
Ji[ce] = O(O(O(O({}, {
  "fa-duotone": "duotone"
}), Gi[ce]), io.kit), io["kit-duotone"]);
const Fu = Lt(Ji), yr = O({}, yu);
yr[ce] = O(O(O(O({}, {
  duotone: "fad"
}), yr[ce]), so.kit), so["kit-duotone"]);
const co = Lt(yr), vr = O({}, mr);
vr[ce] = O(O({}, vr[ce]), Ou.kit);
const Qr = Lt(vr), xr = O({}, Pu);
xr[ce] = O(O({}, xr[ce]), wu.kit);
Lt(xr);
const Du = fu, Zi = "fa-layers-text", Lu = uu, $u = O({}, gu);
Lt($u);
const Yu = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Rn = du, Wu = [...xu, ...ju], It = Be.FontAwesomeConfig || {};
function Uu(e) {
  var t = ee.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function Gu(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
ee && typeof ee.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [n, r] = t;
  const a = Gu(Uu(n));
  a != null && (It[r] = a);
});
const Qi = {
  styleDefault: "solid",
  familyDefault: ce,
  cssPrefix: Bi,
  replacementClass: Xi,
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
It.familyPrefix && (It.cssPrefix = It.familyPrefix);
const gt = O(O({}, Qi), It);
gt.autoReplaceSvg || (gt.observeMutations = !1);
const F = {};
Object.keys(Qi).forEach((e) => {
  Object.defineProperty(F, e, {
    enumerable: !0,
    set: function(t) {
      gt[e] = t, Nt.forEach((n) => n(F));
    },
    get: function() {
      return gt[e];
    }
  });
});
Object.defineProperty(F, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    gt.cssPrefix = e, Nt.forEach((t) => t(F));
  },
  get: function() {
    return gt.cssPrefix;
  }
});
Be.FontAwesomeConfig = F;
const Nt = [];
function Vu(e) {
  return Nt.push(e), () => {
    Nt.splice(Nt.indexOf(e), 1);
  };
}
const Ue = br, Se = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function qu(e) {
  if (!e || !Fe)
    return;
  const t = ee.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = ee.head.childNodes;
  let r = null;
  for (let a = n.length - 1; a > -1; a--) {
    const o = n[a], i = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = o);
  }
  return ee.head.insertBefore(t, r), e;
}
const Hu = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function _t() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += Hu[Math.random() * 62 | 0];
  return t;
}
function vt(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function ea(e) {
  return e.classList ? vt(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function es(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Bu(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(es(e[n]), '" '), "").trim();
}
function gn(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function ta(e) {
  return e.size !== Se.size || e.x !== Se.x || e.y !== Se.y || e.rotate !== Se.rotate || e.flipX || e.flipY;
}
function Xu(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const a = {
    transform: "translate(".concat(n / 2, " 256)")
  }, o = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), l = {
    transform: "".concat(o, " ").concat(i, " ").concat(s)
  }, c = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: a,
    inner: l,
    path: c
  };
}
function Ku(e) {
  let {
    transform: t,
    width: n = br,
    height: r = br,
    startCentered: a = !1
  } = e, o = "";
  return a && Ui ? o += "translate(".concat(t.x / Ue - n / 2, "em, ").concat(t.y / Ue - r / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / Ue, "em), calc(-50% + ").concat(t.y / Ue, "em)) ") : o += "translate(".concat(t.x / Ue, "em, ").concat(t.y / Ue, "em) "), o += "scale(".concat(t.size / Ue * (t.flipX ? -1 : 1), ", ").concat(t.size / Ue * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var Ju = `:root, :host {
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
function ts() {
  const e = Bi, t = Xi, n = F.cssPrefix, r = F.replacementClass;
  let a = Ju;
  if (n !== e || r !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return a;
}
let fo = !1;
function _n() {
  F.autoAddCss && !fo && (qu(ts()), fo = !0);
}
var Zu = {
  mixout() {
    return {
      dom: {
        css: ts,
        insertCss: _n
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        _n();
      },
      beforeI2svg() {
        _n();
      }
    };
  }
};
const Re = Be || {};
Re[Me] || (Re[Me] = {});
Re[Me].styles || (Re[Me].styles = {});
Re[Me].hooks || (Re[Me].hooks = {});
Re[Me].shims || (Re[Me].shims = []);
var Ee = Re[Me];
const ns = [], rs = function() {
  ee.removeEventListener("DOMContentLoaded", rs), an = 1, ns.map((e) => e());
};
let an = !1;
Fe && (an = (ee.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(ee.readyState), an || ee.addEventListener("DOMContentLoaded", rs));
function Qu(e) {
  Fe && (an ? setTimeout(e, 0) : ns.push(e));
}
function $t(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? es(e) : "<".concat(t, " ").concat(Bu(n), ">").concat(r.map($t).join(""), "</").concat(t, ">");
}
function uo(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var zn = function(t, n, r, a) {
  var o = Object.keys(t), i = o.length, s = n, l, c, f;
  for (r === void 0 ? (l = 1, f = t[o[0]]) : (l = 0, f = r); l < i; l++)
    c = o[l], f = s(f, t[c], c, t);
  return f;
};
function ed(e) {
  const t = [];
  let n = 0;
  const r = e.length;
  for (; n < r; ) {
    const a = e.charCodeAt(n++);
    if (a >= 55296 && a <= 56319 && n < r) {
      const o = e.charCodeAt(n++);
      (o & 64512) == 56320 ? t.push(((a & 1023) << 10) + (o & 1023) + 65536) : (t.push(a), n--);
    } else
      t.push(a);
  }
  return t;
}
function wr(e) {
  const t = ed(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function td(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), a;
  return r >= 55296 && r <= 56319 && n > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (r - 55296) * 1024 + a - 56320 + 65536 : r;
}
function po(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return !!r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function kr(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, a = po(t);
  typeof Ee.hooks.addPack == "function" && !r ? Ee.hooks.addPack(e, po(t)) : Ee.styles[e] = O(O({}, Ee.styles[e] || {}), a), e === "fas" && kr("fa", t);
}
const {
  styles: zt,
  shims: nd
} = Ee, as = Object.keys(Qr), rd = as.reduce((e, t) => (e[t] = Object.keys(Qr[t]), e), {});
let na = null, os = {}, is = {}, ss = {}, ls = {}, cs = {};
function ad(e) {
  return ~Wu.indexOf(e);
}
function od(e, t) {
  const n = t.split("-"), r = n[0], a = n.slice(1).join("-");
  return r === e && a !== "" && !ad(a) ? a : null;
}
const fs = () => {
  const e = (r) => zn(zt, (a, o, i) => (a[i] = zn(o, r, {}), a), {});
  os = e((r, a, o) => (a[3] && (r[a[3]] = o), a[2] && a[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = o;
  }), r)), is = e((r, a, o) => (r[o] = o, a[2] && a[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = o;
  }), r)), cs = e((r, a, o) => {
    const i = a[2];
    return r[o] = o, i.forEach((s) => {
      r[s] = o;
    }), r;
  });
  const t = "far" in zt || F.autoFetchSvg, n = zn(nd, (r, a) => {
    const o = a[0];
    let i = a[1];
    const s = a[2];
    return i === "far" && !t && (i = "fas"), typeof o == "string" && (r.names[o] = {
      prefix: i,
      iconName: s
    }), typeof o == "number" && (r.unicodes[o.toString(16)] = {
      prefix: i,
      iconName: s
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  ss = n.names, ls = n.unicodes, na = bn(F.styleDefault, {
    family: F.familyDefault
  });
};
Vu((e) => {
  na = bn(e.styleDefault, {
    family: F.familyDefault
  });
});
fs();
function ra(e, t) {
  return (os[e] || {})[t];
}
function id(e, t) {
  return (is[e] || {})[t];
}
function Qe(e, t) {
  return (cs[e] || {})[t];
}
function us(e) {
  return ss[e] || {
    prefix: null,
    iconName: null
  };
}
function sd(e) {
  const t = ls[e], n = ra("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Xe() {
  return na;
}
const ds = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function ld(e) {
  let t = ce;
  const n = as.reduce((r, a) => (r[a] = "".concat(F.cssPrefix, "-").concat(a), r), {});
  return qi.forEach((r) => {
    (e.includes(n[r]) || e.some((a) => rd[r].includes(a))) && (t = r);
  }), t;
}
function bn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = ce
  } = t, r = Fu[n][e];
  if (n === mn && !e)
    return "fad";
  const a = co[n][e] || co[n][r], o = e in Ee.styles ? e : null;
  return a || o || null;
}
function cd(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const a = od(F.cssPrefix, r);
    a ? n = a : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function mo(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function hn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const a = gr.concat(Su), o = mo(e.filter((p) => a.includes(p))), i = mo(e.filter((p) => !gr.includes(p))), s = o.filter((p) => (r = p, !Vi.includes(p))), [l = null] = s, c = ld(o), f = O(O({}, cd(i)), {}, {
    prefix: bn(l, {
      family: c
    })
  });
  return O(O(O({}, f), pd({
    values: e,
    family: c,
    styles: zt,
    config: F,
    canonical: f,
    givenPrefix: r
  })), fd(n, r, f));
}
function fd(e, t, n) {
  let {
    prefix: r,
    iconName: a
  } = n;
  if (e || !r || !a)
    return {
      prefix: r,
      iconName: a
    };
  const o = t === "fa" ? us(a) : {}, i = Qe(r, a);
  return a = o.iconName || i || a, r = o.prefix || r, r === "far" && !zt.far && zt.fas && !F.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: a
  };
}
const ud = qi.filter((e) => e !== ce || e !== mn), dd = Object.keys(mr).filter((e) => e !== ce).map((e) => Object.keys(mr[e])).flat();
function pd(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: a = "",
    styles: o = {},
    config: i = {}
  } = e, s = n === mn, l = t.includes("fa-duotone") || t.includes("fad"), c = i.familyDefault === "duotone", f = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (l || c || f) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && ud.includes(n) && (Object.keys(o).find((g) => dd.includes(g)) || i.autoFetchSvg)) {
    const g = hu.get(n).defaultShortPrefixId;
    r.prefix = g, r.iconName = Qe(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || a === "fa") && (r.prefix = Xe() || "fas"), r;
}
class md {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const a = n.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = O(O({}, this.definitions[o] || {}), a[o]), kr(o, a[o]);
      const i = Qr[ce][o];
      i && kr(i, a[o]), fs();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, n) {
    const r = n.prefix && n.iconName && n.icon ? {
      0: n
    } : n;
    return Object.keys(r).map((a) => {
      const {
        prefix: o,
        iconName: i,
        icon: s
      } = r[a], l = s[2];
      t[o] || (t[o] = {}), l.length > 0 && l.forEach((c) => {
        typeof c == "string" && (t[o][c] = s);
      }), t[o][i] = s;
    }), t;
  }
}
let go = [], lt = {};
const pt = {}, gd = Object.keys(pt);
function bd(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return go = e, lt = {}, Object.keys(pt).forEach((r) => {
    gd.indexOf(r) === -1 && delete pt[r];
  }), go.forEach((r) => {
    const a = r.mixout ? r.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (n[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((i) => {
        n[o] || (n[o] = {}), n[o][i] = a[o][i];
      });
    }), r.hooks) {
      const o = r.hooks();
      Object.keys(o).forEach((i) => {
        lt[i] || (lt[i] = []), lt[i].push(o[i]);
      });
    }
    r.provides && r.provides(pt);
  }), n;
}
function Or(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), a = 2; a < n; a++)
    r[a - 2] = arguments[a];
  return (lt[e] || []).forEach((i) => {
    t = i.apply(null, [t, ...r]);
  }), t;
}
function rt(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (lt[e] || []).forEach((o) => {
    o.apply(null, n);
  });
}
function Ke() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return pt[e] ? pt[e].apply(null, t) : void 0;
}
function Ar(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || Xe();
  if (t)
    return t = Qe(n, t) || t, uo(ps.definitions, n, t) || uo(Ee.styles, n, t);
}
const ps = new md(), hd = () => {
  F.autoReplaceSvg = !1, F.observeMutations = !1, rt("noAuto");
}, yd = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return Fe ? (rt("beforeI2svg", e), Ke("pseudoElements2svg", e), Ke("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    F.autoReplaceSvg === !1 && (F.autoReplaceSvg = !0), F.observeMutations = !0, Qu(() => {
      xd({
        autoReplaceSvgRoot: t
      }), rt("watch", e);
    });
  }
}, vd = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Qe(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = bn(e[0]);
      return {
        prefix: n,
        iconName: Qe(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(F.cssPrefix, "-")) > -1 || e.match(Du))) {
      const t = hn(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Xe(),
        iconName: Qe(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Xe();
      return {
        prefix: t,
        iconName: Qe(t, e) || e
      };
    }
  }
}, ve = {
  noAuto: hd,
  config: F,
  dom: yd,
  parse: vd,
  library: ps,
  findIconDefinition: Ar,
  toHtml: $t
}, xd = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = ee
  } = e;
  (Object.keys(Ee.styles).length > 0 || F.autoFetchSvg) && Fe && F.autoReplaceSvg && ve.dom.i2svg({
    node: t
  });
};
function yn(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => $t(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!Fe) return;
      const n = ee.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function wd(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: a,
    styles: o,
    transform: i
  } = e;
  if (ta(i) && n.found && !r.found) {
    const {
      width: s,
      height: l
    } = n, c = {
      x: s / l / 2,
      y: 0.5
    };
    a.style = gn(O(O({}, o), {}, {
      "transform-origin": "".concat(c.x + i.x / 16, "em ").concat(c.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function kd(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: a,
    symbol: o
  } = e;
  const i = o === !0 ? "".concat(t, "-").concat(F.cssPrefix, "-").concat(n) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: O(O({}, a), {}, {
        id: i
      }),
      children: r
    }]
  }];
}
function aa(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: a,
    transform: o,
    symbol: i,
    title: s,
    maskId: l,
    titleId: c,
    extra: f,
    watchable: p = !1
  } = e, {
    width: g,
    height: w
  } = n.found ? n : t, E = ku.includes(r), v = [F.replacementClass, a ? "".concat(F.cssPrefix, "-").concat(a) : ""].filter((d) => f.classes.indexOf(d) === -1).filter((d) => d !== "" || !!d).concat(f.classes).join(" ");
  let m = {
    children: [],
    attributes: O(O({}, f.attributes), {}, {
      "data-prefix": r,
      "data-icon": a,
      class: v,
      role: f.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(g, " ").concat(w)
    })
  };
  const y = E && !~f.classes.indexOf("fa-fw") ? {
    width: "".concat(g / w * 16 * 0.0625, "em")
  } : {};
  p && (m.attributes[nt] = ""), s && (m.children.push({
    tag: "title",
    attributes: {
      id: m.attributes["aria-labelledby"] || "title-".concat(c || _t())
    },
    children: [s]
  }), delete m.attributes.title);
  const x = O(O({}, m), {}, {
    prefix: r,
    iconName: a,
    main: t,
    mask: n,
    maskId: l,
    transform: o,
    symbol: i,
    styles: O(O({}, y), f.styles)
  }), {
    children: A,
    attributes: I
  } = n.found && t.found ? Ke("generateAbstractMask", x) || {
    children: [],
    attributes: {}
  } : Ke("generateAbstractIcon", x) || {
    children: [],
    attributes: {}
  };
  return x.children = A, x.attributes = I, i ? kd(x) : wd(x);
}
function bo(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: a,
    title: o,
    extra: i,
    watchable: s = !1
  } = e, l = O(O(O({}, i.attributes), o ? {
    title: o
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (l[nt] = "");
  const c = O({}, i.styles);
  ta(a) && (c.transform = Ku({
    transform: a,
    startCentered: !0,
    width: n,
    height: r
  }), c["-webkit-transform"] = c.transform);
  const f = gn(c);
  f.length > 0 && (l.style = f);
  const p = [];
  return p.push({
    tag: "span",
    attributes: l,
    children: [t]
  }), o && p.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), p;
}
function Od(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, a = O(O(O({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), o = gn(r.styles);
  o.length > 0 && (a.style = o);
  const i = [];
  return i.push({
    tag: "span",
    attributes: a,
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
  styles: Fn
} = Ee;
function Sr(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let a = null;
  return Array.isArray(r) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(F.cssPrefix, "-").concat(Rn.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(F.cssPrefix, "-").concat(Rn.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(F.cssPrefix, "-").concat(Rn.PRIMARY),
        fill: "currentColor",
        d: r[1]
      }
    }]
  } : a = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: r
    }
  }, {
    found: !0,
    width: t,
    height: n,
    icon: a
  };
}
const Ad = {
  found: !1,
  width: 512,
  height: 512
};
function Sd(e, t) {
  !Ki && !F.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Er(e, t) {
  let n = t;
  return t === "fa" && F.styleDefault !== null && (t = Xe()), new Promise((r, a) => {
    if (n === "fa") {
      const o = us(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && Fn[t] && Fn[t][e]) {
      const o = Fn[t][e];
      return r(Sr(o));
    }
    Sd(e, t), r(O(O({}, Ad), {}, {
      icon: F.showMissingIcons && e ? Ke("missingIconAbstract") || {} : {}
    }));
  });
}
const ho = () => {
}, Pr = F.measurePerformance && qt && qt.mark && qt.measure ? qt : {
  mark: ho,
  measure: ho
}, Pt = 'FA "6.7.2"', Ed = (e) => (Pr.mark("".concat(Pt, " ").concat(e, " begins")), () => ms(e)), ms = (e) => {
  Pr.mark("".concat(Pt, " ").concat(e, " ends")), Pr.measure("".concat(Pt, " ").concat(e), "".concat(Pt, " ").concat(e, " begins"), "".concat(Pt, " ").concat(e, " ends"));
};
var oa = {
  begin: Ed,
  end: ms
};
const Qt = () => {
};
function yo(e) {
  return typeof (e.getAttribute ? e.getAttribute(nt) : null) == "string";
}
function Pd(e) {
  const t = e.getAttribute ? e.getAttribute(Jr) : null, n = e.getAttribute ? e.getAttribute(Zr) : null;
  return t && n;
}
function Cd(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(F.replacementClass);
}
function Td() {
  return F.autoReplaceSvg === !0 ? en.replace : en[F.autoReplaceSvg] || en.replace;
}
function Id(e) {
  return ee.createElementNS("http://www.w3.org/2000/svg", e);
}
function Nd(e) {
  return ee.createElement(e);
}
function gs(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? Id : Nd
  } = t;
  if (typeof e == "string")
    return ee.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    r.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    r.appendChild(gs(o, {
      ceFn: n
    }));
  }), r;
}
function jd(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const en = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(gs(n), t);
      }), t.getAttribute(nt) === null && F.keepOriginalSource) {
        let n = ee.createComment(jd(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~ea(t).indexOf(F.replacementClass))
      return en.replace(e);
    const r = new RegExp("".concat(F.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const o = n[0].attributes.class.split(" ").reduce((i, s) => (s === F.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = n.map((o) => $t(o)).join(`
`);
    t.setAttribute(nt, ""), t.innerHTML = a;
  }
};
function vo(e) {
  e();
}
function bs(e, t) {
  const n = typeof t == "function" ? t : Qt;
  if (e.length === 0)
    n();
  else {
    let r = vo;
    F.mutateApproach === _u && (r = Be.requestAnimationFrame || vo), r(() => {
      const a = Td(), o = oa.begin("mutate");
      e.map(a), o(), n();
    });
  }
}
let ia = !1;
function hs() {
  ia = !0;
}
function Cr() {
  ia = !1;
}
let on = null;
function xo(e) {
  if (!oo || !F.observeMutations)
    return;
  const {
    treeCallback: t = Qt,
    nodeCallback: n = Qt,
    pseudoElementsCallback: r = Qt,
    observeMutationsRoot: a = ee
  } = e;
  on = new oo((o) => {
    if (ia) return;
    const i = Xe();
    vt(o).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !yo(s.addedNodes[0]) && (F.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && F.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && yo(s.target) && ~Yu.indexOf(s.attributeName))
        if (s.attributeName === "class" && Pd(s.target)) {
          const {
            prefix: l,
            iconName: c
          } = hn(ea(s.target));
          s.target.setAttribute(Jr, l || i), c && s.target.setAttribute(Zr, c);
        } else Cd(s.target) && n(s.target);
    });
  }), Fe && on.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function Md() {
  on && on.disconnect();
}
function Rd(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, a) => {
    const o = a.split(":"), i = o[0], s = o.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function _d(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = hn(ea(e));
  return a.prefix || (a.prefix = Xe()), t && n && (a.prefix = t, a.iconName = n), a.iconName && a.prefix || (a.prefix && r.length > 0 && (a.iconName = id(a.prefix, e.innerText) || ra(a.prefix, wr(e.innerText))), !a.iconName && F.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function zd(e) {
  const t = vt(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return F.autoA11y && (n ? t["aria-labelledby"] = "".concat(F.replacementClass, "-title-").concat(r || _t()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function Fd() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: Se,
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
function wo(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: a
  } = _d(e), o = zd(e), i = Or("parseNodeAttributes", {}, e);
  let s = t.styleParser ? Rd(e) : [];
  return O({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: Se,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: a,
      styles: s,
      attributes: o
    }
  }, i);
}
const {
  styles: Dd
} = Ee;
function ys(e) {
  const t = F.autoReplaceSvg === "nest" ? wo(e, {
    styleParser: !1
  }) : wo(e);
  return ~t.extra.classes.indexOf(Zi) ? Ke("generateLayersText", e, t) : Ke("generateSvgReplacementMutation", e, t);
}
function Ld() {
  return [...vu, ...gr];
}
function ko(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!Fe) return Promise.resolve();
  const n = ee.documentElement.classList, r = (f) => n.add("".concat(lo, "-").concat(f)), a = (f) => n.remove("".concat(lo, "-").concat(f)), o = F.autoFetchSvg ? Ld() : Vi.concat(Object.keys(Dd));
  o.includes("fa") || o.push("fa");
  const i = [".".concat(Zi, ":not([").concat(nt, "])")].concat(o.map((f) => ".".concat(f, ":not([").concat(nt, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = vt(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), a("complete");
  else
    return Promise.resolve();
  const l = oa.begin("onTree"), c = s.reduce((f, p) => {
    try {
      const g = ys(p);
      g && f.push(g);
    } catch (g) {
      Ki || g.name === "MissingIcon" && console.error(g);
    }
    return f;
  }, []);
  return new Promise((f, p) => {
    Promise.all(c).then((g) => {
      bs(g, () => {
        r("active"), r("complete"), a("pending"), typeof t == "function" && t(), l(), f();
      });
    }).catch((g) => {
      l(), p(g);
    });
  });
}
function $d(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  ys(e).then((n) => {
    n && bs([n], t);
  });
}
function Yd(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : Ar(t || {});
    let {
      mask: a
    } = n;
    return a && (a = (a || {}).icon ? a : Ar(a || {})), e(r, O(O({}, n), {}, {
      mask: a
    }));
  };
}
const Wd = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = Se,
    symbol: r = !1,
    mask: a = null,
    maskId: o = null,
    title: i = null,
    titleId: s = null,
    classes: l = [],
    attributes: c = {},
    styles: f = {}
  } = t;
  if (!e) return;
  const {
    prefix: p,
    iconName: g,
    icon: w
  } = e;
  return yn(O({
    type: "icon"
  }, e), () => (rt("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), F.autoA11y && (i ? c["aria-labelledby"] = "".concat(F.replacementClass, "-title-").concat(s || _t()) : (c["aria-hidden"] = "true", c.focusable = "false")), aa({
    icons: {
      main: Sr(w),
      mask: a ? Sr(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: p,
    iconName: g,
    transform: O(O({}, Se), n),
    symbol: r,
    title: i,
    maskId: o,
    titleId: s,
    extra: {
      attributes: c,
      styles: f,
      classes: l
    }
  })));
};
var Ud = {
  mixout() {
    return {
      icon: Yd(Wd)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = ko, e.nodeCallback = $d, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = ee,
        callback: r = () => {
        }
      } = t;
      return ko(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: a,
        titleId: o,
        prefix: i,
        transform: s,
        symbol: l,
        mask: c,
        maskId: f,
        extra: p
      } = n;
      return new Promise((g, w) => {
        Promise.all([Er(r, i), c.iconName ? Er(c.iconName, c.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((E) => {
          let [v, m] = E;
          g([t, aa({
            icons: {
              main: v,
              mask: m
            },
            prefix: i,
            iconName: r,
            transform: s,
            symbol: l,
            maskId: f,
            title: a,
            titleId: o,
            extra: p,
            watchable: !0
          })]);
        }).catch(w);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        transform: o,
        styles: i
      } = t;
      const s = gn(i);
      s.length > 0 && (r.style = s);
      let l;
      return ta(o) && (l = Ke("generateAbstractTransformGrouping", {
        main: a,
        transform: o,
        containerWidth: a.width,
        iconWidth: a.width
      })), n.push(l || a.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, Gd = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return yn({
          type: "layer"
        }, () => {
          rt("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let r = [];
          return e((a) => {
            Array.isArray(a) ? a.map((o) => {
              r = r.concat(o.abstract);
            }) : r = r.concat(a.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(F.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, Vd = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: n = null,
          classes: r = [],
          attributes: a = {},
          styles: o = {}
        } = t;
        return yn({
          type: "counter",
          content: e
        }, () => (rt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Od({
          content: e.toString(),
          title: n,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(F.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, qd = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = Se,
          title: r = null,
          classes: a = [],
          attributes: o = {},
          styles: i = {}
        } = t;
        return yn({
          type: "text",
          content: e
        }, () => (rt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), bo({
          content: e,
          transform: O(O({}, Se), n),
          title: r,
          extra: {
            attributes: o,
            styles: i,
            classes: ["".concat(F.cssPrefix, "-layers-text"), ...a]
          }
        })));
      }
    };
  },
  provides(e) {
    e.generateLayersText = function(t, n) {
      const {
        title: r,
        transform: a,
        extra: o
      } = n;
      let i = null, s = null;
      if (Ui) {
        const l = parseInt(getComputedStyle(t).fontSize, 10), c = t.getBoundingClientRect();
        i = c.width / l, s = c.height / l;
      }
      return F.autoA11y && !r && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, bo({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: a,
        title: r,
        extra: o,
        watchable: !0
      })]);
    };
  }
};
const Hd = new RegExp('"', "ug"), Oo = [1105920, 1112319], Ao = O(O(O(O({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), bu), Mu), Eu), Tr = Object.keys(Ao).reduce((e, t) => (e[t.toLowerCase()] = Ao[t], e), {}), Bd = Object.keys(Tr).reduce((e, t) => {
  const n = Tr[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function Xd(e) {
  const t = e.replace(Hd, ""), n = td(t, 0), r = n >= Oo[0] && n <= Oo[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: wr(a ? t[0] : t),
    isSecondary: r || a
  };
}
function Kd(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), a = isNaN(r) ? "normal" : r;
  return (Tr[n] || {})[a] || Bd[n];
}
function So(e, t) {
  const n = "".concat(Ru).concat(t.replace(":", "-"));
  return new Promise((r, a) => {
    if (e.getAttribute(n) !== null)
      return r();
    const i = vt(e.children).filter((g) => g.getAttribute(hr) === t)[0], s = Be.getComputedStyle(e, t), l = s.getPropertyValue("font-family"), c = l.match(Lu), f = s.getPropertyValue("font-weight"), p = s.getPropertyValue("content");
    if (i && !c)
      return e.removeChild(i), r();
    if (c && p !== "none" && p !== "") {
      const g = s.getPropertyValue("content");
      let w = Kd(l, f);
      const {
        value: E,
        isSecondary: v
      } = Xd(g), m = c[0].startsWith("FontAwesome");
      let y = ra(w, E), x = y;
      if (m) {
        const A = sd(E);
        A.iconName && A.prefix && (y = A.iconName, w = A.prefix);
      }
      if (y && !v && (!i || i.getAttribute(Jr) !== w || i.getAttribute(Zr) !== x)) {
        e.setAttribute(n, x), i && e.removeChild(i);
        const A = Fd(), {
          extra: I
        } = A;
        I.attributes[hr] = t, Er(y, w).then((d) => {
          const K = aa(O(O({}, A), {}, {
            icons: {
              main: d,
              mask: ds()
            },
            prefix: w,
            iconName: x,
            extra: I,
            watchable: !0
          })), re = ee.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(re, e.firstChild) : e.appendChild(re), re.outerHTML = K.map((fe) => $t(fe)).join(`
`), e.removeAttribute(n), r();
        }).catch(a);
      } else
        r();
    } else
      r();
  });
}
function Jd(e) {
  return Promise.all([So(e, "::before"), So(e, "::after")]);
}
function Zd(e) {
  return e.parentNode !== document.head && !~zu.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(hr) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Eo(e) {
  if (Fe)
    return new Promise((t, n) => {
      const r = vt(e.querySelectorAll("*")).filter(Zd).map(Jd), a = oa.begin("searchPseudoElements");
      hs(), Promise.all(r).then(() => {
        a(), Cr(), t();
      }).catch(() => {
        a(), Cr(), n();
      });
    });
}
var Qd = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Eo, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = ee
      } = t;
      F.searchPseudoElements && Eo(n);
    };
  }
};
let Po = !1;
var ep = {
  mixout() {
    return {
      dom: {
        unwatch() {
          hs(), Po = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        xo(Or("mutationObserverCallbacks", {}));
      },
      noAuto() {
        Md();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Po ? Cr() : xo(Or("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Co = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((n, r) => {
    const a = r.toLowerCase().split("-"), o = a[0];
    let i = a.slice(1).join("-");
    if (o && i === "h")
      return n.flipX = !0, n;
    if (o && i === "v")
      return n.flipY = !0, n;
    if (i = parseFloat(i), isNaN(i))
      return n;
    switch (o) {
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
var tp = {
  mixout() {
    return {
      parse: {
        transform: (e) => Co(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = Co(n)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: n,
        transform: r,
        containerWidth: a,
        iconWidth: o
      } = t;
      const i = {
        transform: "translate(".concat(a / 2, " 256)")
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), l = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), c = "rotate(".concat(r.rotate, " 0 0)"), f = {
        transform: "".concat(s, " ").concat(l, " ").concat(c)
      }, p = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, g = {
        outer: i,
        inner: f,
        path: p
      };
      return {
        tag: "g",
        attributes: O({}, g.outer),
        children: [{
          tag: "g",
          attributes: O({}, g.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: O(O({}, n.icon.attributes), g.path)
          }]
        }]
      };
    };
  }
};
const Dn = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function To(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function np(e) {
  return e.tag === "g" ? e.children : [e];
}
var rp = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? hn(n.split(" ").map((a) => a.trim())) : ds();
        return r.prefix || (r.prefix = Xe()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        mask: o,
        maskId: i,
        transform: s
      } = t;
      const {
        width: l,
        icon: c
      } = a, {
        width: f,
        icon: p
      } = o, g = Xu({
        transform: s,
        containerWidth: f,
        iconWidth: l
      }), w = {
        tag: "rect",
        attributes: O(O({}, Dn), {}, {
          fill: "white"
        })
      }, E = c.children ? {
        children: c.children.map(To)
      } : {}, v = {
        tag: "g",
        attributes: O({}, g.inner),
        children: [To(O({
          tag: c.tag,
          attributes: O(O({}, c.attributes), g.path)
        }, E))]
      }, m = {
        tag: "g",
        attributes: O({}, g.outer),
        children: [v]
      }, y = "mask-".concat(i || _t()), x = "clip-".concat(i || _t()), A = {
        tag: "mask",
        attributes: O(O({}, Dn), {}, {
          id: y,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [w, m]
      }, I = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: x
          },
          children: np(p)
        }, A]
      };
      return n.push(I, {
        tag: "rect",
        attributes: O({
          fill: "currentColor",
          "clip-path": "url(#".concat(x, ")"),
          mask: "url(#".concat(y, ")")
        }, Dn)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, ap = {
  provides(e) {
    let t = !1;
    Be.matchMedia && (t = Be.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, a = {
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
      const o = O(O({}, a), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: O(O({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: O(O({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: O(O({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(i), n.push({
        tag: "path",
        attributes: O(O({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: O(O({}, o), {}, {
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
          attributes: O(O({}, o), {}, {
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
}, op = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, ip = [Zu, Ud, Gd, Vd, qd, Qd, ep, tp, rp, ap, op];
bd(ip, {
  mixoutsTo: ve
});
ve.noAuto;
ve.config;
ve.library;
ve.dom;
const Ir = ve.parse;
ve.findIconDefinition;
ve.toHtml;
const sp = ve.icon;
ve.layer;
ve.text;
ve.counter;
function lp(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Bt = { exports: {} }, Xt = { exports: {} }, H = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Io;
function cp() {
  if (Io) return H;
  Io = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, g = e ? Symbol.for("react.suspense_list") : 60120, w = e ? Symbol.for("react.memo") : 60115, E = e ? Symbol.for("react.lazy") : 60116, v = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, x = e ? Symbol.for("react.scope") : 60119;
  function A(d) {
    if (typeof d == "object" && d !== null) {
      var K = d.$$typeof;
      switch (K) {
        case t:
          switch (d = d.type, d) {
            case l:
            case c:
            case r:
            case o:
            case a:
            case p:
              return d;
            default:
              switch (d = d && d.$$typeof, d) {
                case s:
                case f:
                case E:
                case w:
                case i:
                  return d;
                default:
                  return K;
              }
          }
        case n:
          return K;
      }
    }
  }
  function I(d) {
    return A(d) === c;
  }
  return H.AsyncMode = l, H.ConcurrentMode = c, H.ContextConsumer = s, H.ContextProvider = i, H.Element = t, H.ForwardRef = f, H.Fragment = r, H.Lazy = E, H.Memo = w, H.Portal = n, H.Profiler = o, H.StrictMode = a, H.Suspense = p, H.isAsyncMode = function(d) {
    return I(d) || A(d) === l;
  }, H.isConcurrentMode = I, H.isContextConsumer = function(d) {
    return A(d) === s;
  }, H.isContextProvider = function(d) {
    return A(d) === i;
  }, H.isElement = function(d) {
    return typeof d == "object" && d !== null && d.$$typeof === t;
  }, H.isForwardRef = function(d) {
    return A(d) === f;
  }, H.isFragment = function(d) {
    return A(d) === r;
  }, H.isLazy = function(d) {
    return A(d) === E;
  }, H.isMemo = function(d) {
    return A(d) === w;
  }, H.isPortal = function(d) {
    return A(d) === n;
  }, H.isProfiler = function(d) {
    return A(d) === o;
  }, H.isStrictMode = function(d) {
    return A(d) === a;
  }, H.isSuspense = function(d) {
    return A(d) === p;
  }, H.isValidElementType = function(d) {
    return typeof d == "string" || typeof d == "function" || d === r || d === c || d === o || d === a || d === p || d === g || typeof d == "object" && d !== null && (d.$$typeof === E || d.$$typeof === w || d.$$typeof === i || d.$$typeof === s || d.$$typeof === f || d.$$typeof === m || d.$$typeof === y || d.$$typeof === x || d.$$typeof === v);
  }, H.typeOf = A, H;
}
var B = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var No;
function fp() {
  return No || (No = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, g = e ? Symbol.for("react.suspense_list") : 60120, w = e ? Symbol.for("react.memo") : 60115, E = e ? Symbol.for("react.lazy") : 60116, v = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, x = e ? Symbol.for("react.scope") : 60119;
    function A(h) {
      return typeof h == "string" || typeof h == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      h === r || h === c || h === o || h === a || h === p || h === g || typeof h == "object" && h !== null && (h.$$typeof === E || h.$$typeof === w || h.$$typeof === i || h.$$typeof === s || h.$$typeof === f || h.$$typeof === m || h.$$typeof === y || h.$$typeof === x || h.$$typeof === v);
    }
    function I(h) {
      if (typeof h == "object" && h !== null) {
        var oe = h.$$typeof;
        switch (oe) {
          case t:
            var Pe = h.type;
            switch (Pe) {
              case l:
              case c:
              case r:
              case o:
              case a:
              case p:
                return Pe;
              default:
                var xt = Pe && Pe.$$typeof;
                switch (xt) {
                  case s:
                  case f:
                  case E:
                  case w:
                  case i:
                    return xt;
                  default:
                    return oe;
                }
            }
          case n:
            return oe;
        }
      }
    }
    var d = l, K = c, re = s, fe = i, ue = t, de = f, ie = r, D = E, ge = w, te = n, be = o, V = a, ne = p, se = !1;
    function ae(h) {
      return se || (se = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), u(h) || I(h) === l;
    }
    function u(h) {
      return I(h) === c;
    }
    function b(h) {
      return I(h) === s;
    }
    function N(h) {
      return I(h) === i;
    }
    function C(h) {
      return typeof h == "object" && h !== null && h.$$typeof === t;
    }
    function S(h) {
      return I(h) === f;
    }
    function j(h) {
      return I(h) === r;
    }
    function P(h) {
      return I(h) === E;
    }
    function T(h) {
      return I(h) === w;
    }
    function M(h) {
      return I(h) === n;
    }
    function _(h) {
      return I(h) === o;
    }
    function R(h) {
      return I(h) === a;
    }
    function U(h) {
      return I(h) === p;
    }
    B.AsyncMode = d, B.ConcurrentMode = K, B.ContextConsumer = re, B.ContextProvider = fe, B.Element = ue, B.ForwardRef = de, B.Fragment = ie, B.Lazy = D, B.Memo = ge, B.Portal = te, B.Profiler = be, B.StrictMode = V, B.Suspense = ne, B.isAsyncMode = ae, B.isConcurrentMode = u, B.isContextConsumer = b, B.isContextProvider = N, B.isElement = C, B.isForwardRef = S, B.isFragment = j, B.isLazy = P, B.isMemo = T, B.isPortal = M, B.isProfiler = _, B.isStrictMode = R, B.isSuspense = U, B.isValidElementType = A, B.typeOf = I;
  }()), B;
}
var jo;
function vs() {
  return jo || (jo = 1, process.env.NODE_ENV === "production" ? Xt.exports = cp() : Xt.exports = fp()), Xt.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Ln, Mo;
function up() {
  if (Mo) return Ln;
  Mo = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, n = Object.prototype.propertyIsEnumerable;
  function r(o) {
    if (o == null)
      throw new TypeError("Object.assign cannot be called with null or undefined");
    return Object(o);
  }
  function a() {
    try {
      if (!Object.assign)
        return !1;
      var o = new String("abc");
      if (o[5] = "de", Object.getOwnPropertyNames(o)[0] === "5")
        return !1;
      for (var i = {}, s = 0; s < 10; s++)
        i["_" + String.fromCharCode(s)] = s;
      var l = Object.getOwnPropertyNames(i).map(function(f) {
        return i[f];
      });
      if (l.join("") !== "0123456789")
        return !1;
      var c = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(f) {
        c[f] = f;
      }), Object.keys(Object.assign({}, c)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Ln = a() ? Object.assign : function(o, i) {
    for (var s, l = r(o), c, f = 1; f < arguments.length; f++) {
      s = Object(arguments[f]);
      for (var p in s)
        t.call(s, p) && (l[p] = s[p]);
      if (e) {
        c = e(s);
        for (var g = 0; g < c.length; g++)
          n.call(s, c[g]) && (l[c[g]] = s[c[g]]);
      }
    }
    return l;
  }, Ln;
}
var $n, Ro;
function sa() {
  if (Ro) return $n;
  Ro = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return $n = e, $n;
}
var Yn, _o;
function xs() {
  return _o || (_o = 1, Yn = Function.call.bind(Object.prototype.hasOwnProperty)), Yn;
}
var Wn, zo;
function dp() {
  if (zo) return Wn;
  zo = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ sa(), n = {}, r = /* @__PURE__ */ xs();
    e = function(o) {
      var i = "Warning: " + o;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function a(o, i, s, l, c) {
    if (process.env.NODE_ENV !== "production") {
      for (var f in o)
        if (r(o, f)) {
          var p;
          try {
            if (typeof o[f] != "function") {
              var g = Error(
                (l || "React class") + ": " + s + " type `" + f + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[f] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw g.name = "Invariant Violation", g;
            }
            p = o[f](i, f, l, s, null, t);
          } catch (E) {
            p = E;
          }
          if (p && !(p instanceof Error) && e(
            (l || "React class") + ": type specification of " + s + " `" + f + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof p + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), p instanceof Error && !(p.message in n)) {
            n[p.message] = !0;
            var w = c ? c() : "";
            e(
              "Failed " + s + " type: " + p.message + (w ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, Wn = a, Wn;
}
var Un, Fo;
function pp() {
  if (Fo) return Un;
  Fo = 1;
  var e = vs(), t = up(), n = /* @__PURE__ */ sa(), r = /* @__PURE__ */ xs(), a = /* @__PURE__ */ dp(), o = function() {
  };
  process.env.NODE_ENV !== "production" && (o = function(s) {
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
  return Un = function(s, l) {
    var c = typeof Symbol == "function" && Symbol.iterator, f = "@@iterator";
    function p(u) {
      var b = u && (c && u[c] || u[f]);
      if (typeof b == "function")
        return b;
    }
    var g = "<<anonymous>>", w = {
      array: y("array"),
      bigint: y("bigint"),
      bool: y("boolean"),
      func: y("function"),
      number: y("number"),
      object: y("object"),
      string: y("string"),
      symbol: y("symbol"),
      any: x(),
      arrayOf: A,
      element: I(),
      elementType: d(),
      instanceOf: K,
      node: de(),
      objectOf: fe,
      oneOf: re,
      oneOfType: ue,
      shape: D,
      exact: ge
    };
    function E(u, b) {
      return u === b ? u !== 0 || 1 / u === 1 / b : u !== u && b !== b;
    }
    function v(u, b) {
      this.message = u, this.data = b && typeof b == "object" ? b : {}, this.stack = "";
    }
    v.prototype = Error.prototype;
    function m(u) {
      if (process.env.NODE_ENV !== "production")
        var b = {}, N = 0;
      function C(j, P, T, M, _, R, U) {
        if (M = M || g, R = R || T, U !== n) {
          if (l) {
            var h = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw h.name = "Invariant Violation", h;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var oe = M + ":" + T;
            !b[oe] && // Avoid spamming the console because they are often not actionable except for lib authors
            N < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + R + "` prop on `" + M + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), b[oe] = !0, N++);
          }
        }
        return P[T] == null ? j ? P[T] === null ? new v("The " + _ + " `" + R + "` is marked as required " + ("in `" + M + "`, but its value is `null`.")) : new v("The " + _ + " `" + R + "` is marked as required in " + ("`" + M + "`, but its value is `undefined`.")) : null : u(P, T, M, _, R);
      }
      var S = C.bind(null, !1);
      return S.isRequired = C.bind(null, !0), S;
    }
    function y(u) {
      function b(N, C, S, j, P, T) {
        var M = N[C], _ = V(M);
        if (_ !== u) {
          var R = ne(M);
          return new v(
            "Invalid " + j + " `" + P + "` of type " + ("`" + R + "` supplied to `" + S + "`, expected ") + ("`" + u + "`."),
            { expectedType: u }
          );
        }
        return null;
      }
      return m(b);
    }
    function x() {
      return m(i);
    }
    function A(u) {
      function b(N, C, S, j, P) {
        if (typeof u != "function")
          return new v("Property `" + P + "` of component `" + S + "` has invalid PropType notation inside arrayOf.");
        var T = N[C];
        if (!Array.isArray(T)) {
          var M = V(T);
          return new v("Invalid " + j + " `" + P + "` of type " + ("`" + M + "` supplied to `" + S + "`, expected an array."));
        }
        for (var _ = 0; _ < T.length; _++) {
          var R = u(T, _, S, j, P + "[" + _ + "]", n);
          if (R instanceof Error)
            return R;
        }
        return null;
      }
      return m(b);
    }
    function I() {
      function u(b, N, C, S, j) {
        var P = b[N];
        if (!s(P)) {
          var T = V(P);
          return new v("Invalid " + S + " `" + j + "` of type " + ("`" + T + "` supplied to `" + C + "`, expected a single ReactElement."));
        }
        return null;
      }
      return m(u);
    }
    function d() {
      function u(b, N, C, S, j) {
        var P = b[N];
        if (!e.isValidElementType(P)) {
          var T = V(P);
          return new v("Invalid " + S + " `" + j + "` of type " + ("`" + T + "` supplied to `" + C + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return m(u);
    }
    function K(u) {
      function b(N, C, S, j, P) {
        if (!(N[C] instanceof u)) {
          var T = u.name || g, M = ae(N[C]);
          return new v("Invalid " + j + " `" + P + "` of type " + ("`" + M + "` supplied to `" + S + "`, expected ") + ("instance of `" + T + "`."));
        }
        return null;
      }
      return m(b);
    }
    function re(u) {
      if (!Array.isArray(u))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), i;
      function b(N, C, S, j, P) {
        for (var T = N[C], M = 0; M < u.length; M++)
          if (E(T, u[M]))
            return null;
        var _ = JSON.stringify(u, function(U, h) {
          var oe = ne(h);
          return oe === "symbol" ? String(h) : h;
        });
        return new v("Invalid " + j + " `" + P + "` of value `" + String(T) + "` " + ("supplied to `" + S + "`, expected one of " + _ + "."));
      }
      return m(b);
    }
    function fe(u) {
      function b(N, C, S, j, P) {
        if (typeof u != "function")
          return new v("Property `" + P + "` of component `" + S + "` has invalid PropType notation inside objectOf.");
        var T = N[C], M = V(T);
        if (M !== "object")
          return new v("Invalid " + j + " `" + P + "` of type " + ("`" + M + "` supplied to `" + S + "`, expected an object."));
        for (var _ in T)
          if (r(T, _)) {
            var R = u(T, _, S, j, P + "." + _, n);
            if (R instanceof Error)
              return R;
          }
        return null;
      }
      return m(b);
    }
    function ue(u) {
      if (!Array.isArray(u))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var b = 0; b < u.length; b++) {
        var N = u[b];
        if (typeof N != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + se(N) + " at index " + b + "."
          ), i;
      }
      function C(S, j, P, T, M) {
        for (var _ = [], R = 0; R < u.length; R++) {
          var U = u[R], h = U(S, j, P, T, M, n);
          if (h == null)
            return null;
          h.data && r(h.data, "expectedType") && _.push(h.data.expectedType);
        }
        var oe = _.length > 0 ? ", expected one of type [" + _.join(", ") + "]" : "";
        return new v("Invalid " + T + " `" + M + "` supplied to " + ("`" + P + "`" + oe + "."));
      }
      return m(C);
    }
    function de() {
      function u(b, N, C, S, j) {
        return te(b[N]) ? null : new v("Invalid " + S + " `" + j + "` supplied to " + ("`" + C + "`, expected a ReactNode."));
      }
      return m(u);
    }
    function ie(u, b, N, C, S) {
      return new v(
        (u || "React class") + ": " + b + " type `" + N + "." + C + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + S + "`."
      );
    }
    function D(u) {
      function b(N, C, S, j, P) {
        var T = N[C], M = V(T);
        if (M !== "object")
          return new v("Invalid " + j + " `" + P + "` of type `" + M + "` " + ("supplied to `" + S + "`, expected `object`."));
        for (var _ in u) {
          var R = u[_];
          if (typeof R != "function")
            return ie(S, j, P, _, ne(R));
          var U = R(T, _, S, j, P + "." + _, n);
          if (U)
            return U;
        }
        return null;
      }
      return m(b);
    }
    function ge(u) {
      function b(N, C, S, j, P) {
        var T = N[C], M = V(T);
        if (M !== "object")
          return new v("Invalid " + j + " `" + P + "` of type `" + M + "` " + ("supplied to `" + S + "`, expected `object`."));
        var _ = t({}, N[C], u);
        for (var R in _) {
          var U = u[R];
          if (r(u, R) && typeof U != "function")
            return ie(S, j, P, R, ne(U));
          if (!U)
            return new v(
              "Invalid " + j + " `" + P + "` key `" + R + "` supplied to `" + S + "`.\nBad object: " + JSON.stringify(N[C], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(u), null, "  ")
            );
          var h = U(T, R, S, j, P + "." + R, n);
          if (h)
            return h;
        }
        return null;
      }
      return m(b);
    }
    function te(u) {
      switch (typeof u) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !u;
        case "object":
          if (Array.isArray(u))
            return u.every(te);
          if (u === null || s(u))
            return !0;
          var b = p(u);
          if (b) {
            var N = b.call(u), C;
            if (b !== u.entries) {
              for (; !(C = N.next()).done; )
                if (!te(C.value))
                  return !1;
            } else
              for (; !(C = N.next()).done; ) {
                var S = C.value;
                if (S && !te(S[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function be(u, b) {
      return u === "symbol" ? !0 : b ? b["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && b instanceof Symbol : !1;
    }
    function V(u) {
      var b = typeof u;
      return Array.isArray(u) ? "array" : u instanceof RegExp ? "object" : be(b, u) ? "symbol" : b;
    }
    function ne(u) {
      if (typeof u > "u" || u === null)
        return "" + u;
      var b = V(u);
      if (b === "object") {
        if (u instanceof Date)
          return "date";
        if (u instanceof RegExp)
          return "regexp";
      }
      return b;
    }
    function se(u) {
      var b = ne(u);
      switch (b) {
        case "array":
        case "object":
          return "an " + b;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + b;
        default:
          return b;
      }
    }
    function ae(u) {
      return !u.constructor || !u.constructor.name ? g : u.constructor.name;
    }
    return w.checkPropTypes = a, w.resetWarningCache = a.resetWarningCache, w.PropTypes = w, w;
  }, Un;
}
var Gn, Do;
function mp() {
  if (Do) return Gn;
  Do = 1;
  var e = /* @__PURE__ */ sa();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, Gn = function() {
    function r(i, s, l, c, f, p) {
      if (p !== e) {
        var g = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw g.name = "Invariant Violation", g;
      }
    }
    r.isRequired = r;
    function a() {
      return r;
    }
    var o = {
      array: r,
      bigint: r,
      bool: r,
      func: r,
      number: r,
      object: r,
      string: r,
      symbol: r,
      any: r,
      arrayOf: a,
      element: r,
      elementType: r,
      instanceOf: a,
      node: r,
      objectOf: a,
      oneOf: a,
      oneOfType: a,
      shape: a,
      exact: a,
      checkPropTypes: n,
      resetWarningCache: t
    };
    return o.PropTypes = o, o;
  }, Gn;
}
var Lo;
function gp() {
  if (Lo) return Bt.exports;
  if (Lo = 1, process.env.NODE_ENV !== "production") {
    var e = vs(), t = !0;
    Bt.exports = /* @__PURE__ */ pp()(e.isElement, t);
  } else
    Bt.exports = /* @__PURE__ */ mp()();
  return Bt.exports;
}
var bp = /* @__PURE__ */ gp();
const W = /* @__PURE__ */ lp(bp);
function $o(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function ke(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? $o(Object(n), !0).forEach(function(r) {
      ct(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : $o(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function sn(e) {
  "@babel/helpers - typeof";
  return sn = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, sn(e);
}
function ct(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function hp(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), a, o;
  for (o = 0; o < r.length; o++)
    a = r[o], !(t.indexOf(a) >= 0) && (n[a] = e[a]);
  return n;
}
function yp(e, t) {
  if (e == null) return {};
  var n = hp(e, t), r, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      r = o[a], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Nr(e) {
  return vp(e) || xp(e) || wp(e) || kp();
}
function vp(e) {
  if (Array.isArray(e)) return jr(e);
}
function xp(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function wp(e, t) {
  if (e) {
    if (typeof e == "string") return jr(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return jr(e, t);
  }
}
function jr(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function kp() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Op(e) {
  var t, n = e.beat, r = e.fade, a = e.beatFade, o = e.bounce, i = e.shake, s = e.flash, l = e.spin, c = e.spinPulse, f = e.spinReverse, p = e.pulse, g = e.fixedWidth, w = e.inverse, E = e.border, v = e.listItem, m = e.flip, y = e.size, x = e.rotation, A = e.pull, I = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": l,
    "fa-spin-reverse": f,
    "fa-spin-pulse": c,
    "fa-pulse": p,
    "fa-fw": g,
    "fa-inverse": w,
    "fa-border": E,
    "fa-li": v,
    "fa-flip": m === !0,
    "fa-flip-horizontal": m === "horizontal" || m === "both",
    "fa-flip-vertical": m === "vertical" || m === "both"
  }, ct(t, "fa-".concat(y), typeof y < "u" && y !== null), ct(t, "fa-rotate-".concat(x), typeof x < "u" && x !== null && x !== 0), ct(t, "fa-pull-".concat(A), typeof A < "u" && A !== null), ct(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(I).map(function(d) {
    return I[d] ? d : null;
  }).filter(function(d) {
    return d;
  });
}
function Ap(e) {
  return e = e - 0, e === e;
}
function ws(e) {
  return Ap(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var Sp = ["style"];
function Ep(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function Pp(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), a = ws(n.slice(0, r)), o = n.slice(r + 1).trim();
    return a.startsWith("webkit") ? t[Ep(a)] = o : t[a] = o, t;
  }, {});
}
function ks(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(l) {
    return ks(e, l);
  }), a = Object.keys(t.attributes || {}).reduce(function(l, c) {
    var f = t.attributes[c];
    switch (c) {
      case "class":
        l.attrs.className = f, delete t.attributes.class;
        break;
      case "style":
        l.attrs.style = Pp(f);
        break;
      default:
        c.indexOf("aria-") === 0 || c.indexOf("data-") === 0 ? l.attrs[c.toLowerCase()] = f : l.attrs[ws(c)] = f;
    }
    return l;
  }, {
    attrs: {}
  }), o = n.style, i = o === void 0 ? {} : o, s = yp(n, Sp);
  return a.attrs.style = ke(ke({}, a.attrs.style), i), e.apply(void 0, [t.tag, ke(ke({}, a.attrs), s)].concat(Nr(r)));
}
var Os = !1;
try {
  Os = process.env.NODE_ENV === "production";
} catch {
}
function Cp() {
  if (!Os && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Yo(e) {
  if (e && sn(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Ir.icon)
    return Ir.icon(e);
  if (e === null)
    return null;
  if (e && sn(e) === "object" && e.prefix && e.iconName)
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
function Vn(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? ct({}, e, t) : {};
}
var Wo = {
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
}, jt = /* @__PURE__ */ ln.forwardRef(function(e, t) {
  var n = ke(ke({}, Wo), e), r = n.icon, a = n.mask, o = n.symbol, i = n.className, s = n.title, l = n.titleId, c = n.maskId, f = Yo(r), p = Vn("classes", [].concat(Nr(Op(n)), Nr((i || "").split(" ")))), g = Vn("transform", typeof n.transform == "string" ? Ir.transform(n.transform) : n.transform), w = Vn("mask", Yo(a)), E = sp(f, ke(ke(ke(ke({}, p), g), w), {}, {
    symbol: o,
    title: s,
    titleId: l,
    maskId: c
  }));
  if (!E)
    return Cp("Could not find icon", f), null;
  var v = E.abstract, m = {
    ref: t
  };
  return Object.keys(n).forEach(function(y) {
    Wo.hasOwnProperty(y) || (m[y] = n[y]);
  }), Tp(v[0], m);
});
jt.displayName = "FontAwesomeIcon";
jt.propTypes = {
  beat: W.bool,
  border: W.bool,
  beatFade: W.bool,
  bounce: W.bool,
  className: W.string,
  fade: W.bool,
  flash: W.bool,
  mask: W.oneOfType([W.object, W.array, W.string]),
  maskId: W.string,
  fixedWidth: W.bool,
  inverse: W.bool,
  flip: W.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: W.oneOfType([W.object, W.array, W.string]),
  listItem: W.bool,
  pull: W.oneOf(["right", "left"]),
  pulse: W.bool,
  rotation: W.oneOf([0, 90, 180, 270]),
  shake: W.bool,
  size: W.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: W.bool,
  spinPulse: W.bool,
  spinReverse: W.bool,
  symbol: W.oneOfType([W.bool, W.string]),
  title: W.string,
  titleId: W.string,
  transform: W.oneOfType([W.string, W.object]),
  swapOpacity: W.bool
};
var Tp = ks.bind(null, ln.createElement);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Ip = {
  prefix: "fas",
  iconName: "trash",
  icon: [448, 512, [], "f1f8", "M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"]
}, qn = {
  prefix: "fas",
  iconName: "images",
  icon: [576, 512, [], "f302", "M160 32c-35.3 0-64 28.7-64 64l0 224c0 35.3 28.7 64 64 64l352 0c35.3 0 64-28.7 64-64l0-224c0-35.3-28.7-64-64-64L160 32zM396 138.7l96 144c4.9 7.4 5.4 16.8 1.2 24.6S480.9 320 472 320l-144 0-48 0-80 0c-9.2 0-17.6-5.3-21.6-13.6s-2.9-18.2 2.9-25.4l64-80c4.6-5.7 11.4-9 18.7-9s14.2 3.3 18.7 9l17.3 21.6 56-84C360.5 132 368 128 376 128s15.5 4 20 10.7zM192 128a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM48 120c0-13.3-10.7-24-24-24S0 106.7 0 120L0 344c0 75.1 60.9 136 136 136l320 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-320 0c-48.6 0-88-39.4-88-88l0-224z"]
}, Uo = {
  prefix: "fas",
  iconName: "upload",
  icon: [512, 512, [], "f093", "M288 109.3L288 352c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-242.7-73.4 73.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l128-128c12.5-12.5 32.8-12.5 45.3 0l128 128c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L288 109.3zM64 352l128 0c0 35.3 28.7 64 64 64s64-28.7 64-64l128 0c35.3 0 64 28.7 64 64l0 32c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64l0-32c0-35.3 28.7-64 64-64zM432 456a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"]
};
let Np = { data: "" }, jp = (e) => typeof window == "object" ? ((e ? e.querySelector("#_goober") : window._goober) || Object.assign((e || document.head).appendChild(document.createElement("style")), { innerHTML: " ", id: "_goober" })).firstChild : e || Np, Mp = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g, Rp = /\/\*[^]*?\*\/|  +/g, Go = /\n+/g, Ge = (e, t) => {
  let n = "", r = "", a = "";
  for (let o in e) {
    let i = e[o];
    o[0] == "@" ? o[1] == "i" ? n = o + " " + i + ";" : r += o[1] == "f" ? Ge(i, o) : o + "{" + Ge(i, o[1] == "k" ? "" : t) + "}" : typeof i == "object" ? r += Ge(i, t ? t.replace(/([^,])+/g, (s) => o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g, (l) => /&/.test(l) ? l.replace(/&/g, s) : s ? s + " " + l : l)) : o) : i != null && (o = /^--/.test(o) ? o : o.replace(/[A-Z]/g, "-$&").toLowerCase(), a += Ge.p ? Ge.p(o, i) : o + ":" + i + ";");
  }
  return n + (t && a ? t + "{" + a + "}" : a) + r;
}, Ie = {}, As = (e) => {
  if (typeof e == "object") {
    let t = "";
    for (let n in e) t += n + As(e[n]);
    return t;
  }
  return e;
}, _p = (e, t, n, r, a) => {
  let o = As(e), i = Ie[o] || (Ie[o] = ((l) => {
    let c = 0, f = 11;
    for (; c < l.length; ) f = 101 * f + l.charCodeAt(c++) >>> 0;
    return "go" + f;
  })(o));
  if (!Ie[i]) {
    let l = o !== e ? e : ((c) => {
      let f, p, g = [{}];
      for (; f = Mp.exec(c.replace(Rp, "")); ) f[4] ? g.shift() : f[3] ? (p = f[3].replace(Go, " ").trim(), g.unshift(g[0][p] = g[0][p] || {})) : g[0][f[1]] = f[2].replace(Go, " ").trim();
      return g[0];
    })(e);
    Ie[i] = Ge(a ? { ["@keyframes " + i]: l } : l, n ? "" : "." + i);
  }
  let s = n && Ie.g ? Ie.g : null;
  return n && (Ie.g = Ie[i]), ((l, c, f, p) => {
    p ? c.data = c.data.replace(p, l) : c.data.indexOf(l) === -1 && (c.data = f ? l + c.data : c.data + l);
  })(Ie[i], t, r, s), i;
}, zp = (e, t, n) => e.reduce((r, a, o) => {
  let i = t[o];
  if (i && i.call) {
    let s = i(n), l = s && s.props && s.props.className || /^go/.test(s) && s;
    i = l ? "." + l : s && typeof s == "object" ? s.props ? "" : Ge(s, "") : s === !1 ? "" : s;
  }
  return r + a + (i ?? "");
}, "");
function vn(e) {
  let t = this || {}, n = e.call ? e(t.p) : e;
  return _p(n.unshift ? n.raw ? zp(n, [].slice.call(arguments, 1), t.p) : n.reduce((r, a) => Object.assign(r, a && a.call ? a(t.p) : a), {}) : n, jp(t.target), t.g, t.o, t.k);
}
let Ss, Mr, Rr;
vn.bind({ g: 1 });
let _e = vn.bind({ k: 1 });
function Fp(e, t, n, r) {
  Ge.p = t, Ss = e, Mr = n, Rr = r;
}
function Je(e, t) {
  let n = this || {};
  return function() {
    let r = arguments;
    function a(o, i) {
      let s = Object.assign({}, o), l = s.className || a.className;
      n.p = Object.assign({ theme: Mr && Mr() }, s), n.o = / *go\d+/.test(l), s.className = vn.apply(n, r) + (l ? " " + l : "");
      let c = e;
      return e[0] && (c = s.as || e, delete s.as), Rr && c[0] && Rr(s), Ss(c, s);
    }
    return a;
  };
}
var Dp = (e) => typeof e == "function", _r = (e, t) => Dp(e) ? e(t) : e, Lp = /* @__PURE__ */ (() => {
  let e = 0;
  return () => (++e).toString();
})(), $p = /* @__PURE__ */ (() => {
  let e;
  return () => {
    if (e === void 0 && typeof window < "u") {
      let t = matchMedia("(prefers-reduced-motion: reduce)");
      e = !t || t.matches;
    }
    return e;
  };
})(), Yp = 20, Es = (e, t) => {
  switch (t.type) {
    case 0:
      return { ...e, toasts: [t.toast, ...e.toasts].slice(0, Yp) };
    case 1:
      return { ...e, toasts: e.toasts.map((o) => o.id === t.toast.id ? { ...o, ...t.toast } : o) };
    case 2:
      let { toast: n } = t;
      return Es(e, { type: e.toasts.find((o) => o.id === n.id) ? 1 : 0, toast: n });
    case 3:
      let { toastId: r } = t;
      return { ...e, toasts: e.toasts.map((o) => o.id === r || r === void 0 ? { ...o, dismissed: !0, visible: !1 } : o) };
    case 4:
      return t.toastId === void 0 ? { ...e, toasts: [] } : { ...e, toasts: e.toasts.filter((o) => o.id !== t.toastId) };
    case 5:
      return { ...e, pausedAt: t.time };
    case 6:
      let a = t.time - (e.pausedAt || 0);
      return { ...e, pausedAt: void 0, toasts: e.toasts.map((o) => ({ ...o, pauseDuration: o.pauseDuration + a })) };
  }
}, Wp = [], Hn = { toasts: [], pausedAt: void 0 }, la = (e) => {
  Hn = Es(Hn, e), Wp.forEach((t) => {
    t(Hn);
  });
}, Up = (e, t = "blank", n) => ({ createdAt: Date.now(), visible: !0, dismissed: !1, type: t, ariaProps: { role: "status", "aria-live": "polite" }, message: e, pauseDuration: 0, ...n, id: (n == null ? void 0 : n.id) || Lp() }), Yt = (e) => (t, n) => {
  let r = Up(t, e, n);
  return la({ type: 2, toast: r }), r.id;
}, pe = (e, t) => Yt("blank")(e, t);
pe.error = Yt("error");
pe.success = Yt("success");
pe.loading = Yt("loading");
pe.custom = Yt("custom");
pe.dismiss = (e) => {
  la({ type: 3, toastId: e });
};
pe.remove = (e) => la({ type: 4, toastId: e });
pe.promise = (e, t, n) => {
  let r = pe.loading(t.loading, { ...n, ...n == null ? void 0 : n.loading });
  return typeof e == "function" && (e = e()), e.then((a) => {
    let o = t.success ? _r(t.success, a) : void 0;
    return o ? pe.success(o, { id: r, ...n, ...n == null ? void 0 : n.success }) : pe.dismiss(r), a;
  }).catch((a) => {
    let o = t.error ? _r(t.error, a) : void 0;
    o ? pe.error(o, { id: r, ...n, ...n == null ? void 0 : n.error }) : pe.dismiss(r);
  }), e;
};
var Gp = _e`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`, Vp = _e`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`, qp = _e`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`, Hp = Je("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(e) => e.primary || "#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Gp} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${Vp} 0.15s ease-out forwards;
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
    animation: ${qp} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`, Bp = _e`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`, Xp = Je("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${(e) => e.secondary || "#e0e0e0"};
  border-right-color: ${(e) => e.primary || "#616161"};
  animation: ${Bp} 1s linear infinite;
`, Kp = _e`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`, Jp = _e`
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
}`, Zp = Je("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(e) => e.primary || "#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Kp} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${Jp} 0.2s ease-out forwards;
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
`, Qp = Je("div")`
  position: absolute;
`, em = Je("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`, tm = _e`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`, nm = Je("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${tm} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`, rm = ({ toast: e }) => {
  let { icon: t, type: n, iconTheme: r } = e;
  return t !== void 0 ? typeof t == "string" ? he.createElement(nm, null, t) : t : n === "blank" ? null : he.createElement(em, null, he.createElement(Xp, { ...r }), n !== "loading" && he.createElement(Qp, null, n === "error" ? he.createElement(Hp, { ...r }) : he.createElement(Zp, { ...r })));
}, am = (e) => `
0% {transform: translate3d(0,${e * -200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`, om = (e) => `
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e * -150}%,-1px) scale(.6); opacity:0;}
`, im = "0%{opacity:0;} 100%{opacity:1;}", sm = "0%{opacity:1;} 100%{opacity:0;}", lm = Je("div")`
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
`, cm = Je("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`, fm = (e, t) => {
  let n = e.includes("top") ? 1 : -1, [r, a] = $p() ? [im, sm] : [am(n), om(n)];
  return { animation: t ? `${_e(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards` : `${_e(a)} 0.4s forwards cubic-bezier(.06,.71,.55,1)` };
};
he.memo(({ toast: e, position: t, style: n, children: r }) => {
  let a = e.height ? fm(e.position || t || "top-center", e.visible) : { opacity: 0 }, o = he.createElement(rm, { toast: e }), i = he.createElement(cm, { ...e.ariaProps }, _r(e.message, e));
  return he.createElement(lm, { className: e.className, style: { ...a, ...n, ...e.style } }, typeof r == "function" ? r({ icon: o, message: i }) : he.createElement(he.Fragment, null, o, i));
});
Fp(he.createElement);
vn`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;
function pm({
  value: e,
  onChange: t,
  onGalleryOpen: n,
  showGalleryButton: r = !0,
  placeholderText: a = "Drag and drop an image here",
  className: o
}) {
  const [i, s] = Ps(!1), l = Cs(null), c = (m) => {
    if (!m.type.startsWith("image/")) {
      pe.error("Please upload an image file");
      return;
    }
    const y = new FileReader();
    y.onloadend = () => {
      const x = {
        id: Math.random().toString(36).substring(7),
        url: y.result,
        file: m
      };
      t(x);
    }, y.readAsDataURL(m);
  }, f = (m) => {
    const y = m.target.files;
    if (y && y[0]) {
      const x = y[0];
      c(x);
    }
  }, p = () => {
    var m;
    (m = l.current) == null || m.click();
  }, g = Wt((m) => {
    m.preventDefault(), m.stopPropagation(), s(!0);
  }, []), w = Wt(
    (m) => {
      m.preventDefault(), m.stopPropagation(), i || s(!0), m.dataTransfer && (m.dataTransfer.dropEffect = "copy");
    },
    [i]
  ), E = Wt((m) => {
    m.preventDefault(), m.stopPropagation();
    const y = m.currentTarget.getBoundingClientRect(), x = m.clientX, A = m.clientY;
    (x < y.left || x >= y.right || A < y.top || A >= y.bottom) && s(!1);
  }, []), v = Wt((m) => {
    m.preventDefault(), m.stopPropagation(), s(!1), console.log("Files dropped:", m.dataTransfer.files), console.log("DataTransfer types:", m.dataTransfer.types);
    try {
      if (m.dataTransfer.files && m.dataTransfer.files.length > 0) {
        const x = m.dataTransfer.files[0];
        console.log("Processing file:", x.name, x.type, x.size), c(x);
        return;
      }
      const y = m.dataTransfer.items;
      if (y && y.length > 0) {
        for (let x = 0; x < y.length; x++)
          if (y[x].kind === "file") {
            const A = y[x].getAsFile();
            if (A) {
              console.log("Processing item as file:", A.name), c(A);
              return;
            }
          }
      }
      console.log("Could not process dropped content"), pe.error(
        "Could not process the dropped file. Please try uploading instead."
      );
    } catch (y) {
      console.error("Error processing drop:", y), pe.error(
        "Error processing the dropped file. Please try uploading instead."
      );
    }
  }, []);
  return /* @__PURE__ */ xe("div", { className: to("relative", o), children: [
    /* @__PURE__ */ G(
      "div",
      {
        className: to(
          "mx-auto flex h-60 w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5 p-4 transition-colors",
          i && "border-blue-400 bg-blue-500/10"
        ),
        onDragEnter: g,
        onDragOver: w,
        onDragLeave: E,
        onDrop: v,
        onDragStart: (m) => m.preventDefault(),
        children: e ? /* @__PURE__ */ G("div", { className: "h-full w-full overflow-hidden", children: /* @__PURE__ */ G(
          "img",
          {
            src: e.url,
            alt: "Selected image",
            className: "h-full w-full object-contain"
          }
        ) }) : /* @__PURE__ */ xe("div", { className: "flex h-full w-full flex-col items-center justify-center text-white/60", children: [
          /* @__PURE__ */ G(jt, { icon: qn, className: "text-2xl mb-2" }),
          /* @__PURE__ */ G("p", { children: a }),
          /* @__PURE__ */ xe("div", { className: "flex items-center justify-center gap-2 my-4 w-full", children: [
            /* @__PURE__ */ G("div", { className: "h-[1px] w-12 bg-white/10" }),
            /* @__PURE__ */ G("p", { className: "text-sm px-3", children: "or" }),
            /* @__PURE__ */ G("div", { className: "h-[1px] w-12 bg-white/10" })
          ] }),
          /* @__PURE__ */ xe("div", { className: "flex flex-col items-center justify-center gap-3 sm:flex-row", children: [
            r && n && /* @__PURE__ */ xe(
              Ot,
              {
                onClick: n,
                variant: "secondary",
                className: "flex items-center gap-2 px-2.5 py-1.5 text-sm bg-white/15",
                children: [
                  /* @__PURE__ */ G(jt, { icon: qn }),
                  "Choose from Library"
                ]
              }
            ),
            /* @__PURE__ */ xe(
              Ot,
              {
                onClick: p,
                variant: "secondary",
                className: "flex items-center gap-2 px-2.5 py-1.5 text-sm bg-white/15",
                children: [
                  /* @__PURE__ */ G(jt, { icon: Uo }),
                  "Upload Image"
                ]
              }
            )
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ G(
      "input",
      {
        ref: l,
        type: "file",
        accept: "image/*",
        onChange: f,
        className: "hidden"
      }
    ),
    e && /* @__PURE__ */ xe("div", { className: "mt-4 flex flex-wrap items-center justify-center gap-3", children: [
      r && n && /* @__PURE__ */ G(
        Ot,
        {
          onClick: n,
          variant: "secondary",
          className: "flex items-center gap-2 px-2.5 py-1.5 text-sm",
          icon: qn,
          children: "Choose Different Image"
        }
      ),
      /* @__PURE__ */ G(
        Ot,
        {
          onClick: p,
          variant: "secondary",
          className: "flex items-center gap-2 px-2.5 py-1.5 text-sm",
          icon: Uo,
          children: "Upload Different Image"
        }
      ),
      /* @__PURE__ */ G(
        Ot,
        {
          onClick: () => {
            t(null), l.current && (l.current.value = "");
          },
          variant: "destructive",
          className: "flex items-center gap-2 px-2.5 py-1.5 text-sm",
          icon: Ip,
          children: "Remove Image"
        }
      )
    ] })
  ] });
}
export {
  pm as ImageInput
};
