import { jsxs as $e, jsx as q, Fragment as _t } from "react/jsx-runtime";
import * as qr from "react";
import Me, { useState as He, useEffect as It, useLayoutEffect as _m, useRef as qe, forwardRef as Tm, useCallback as qt, Fragment as Jt, isValidElement as jm, cloneElement as Im, createElement as Rm, useContext as ta, createContext as Ti, useMemo as Uu } from "react";
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function Mm(e, t, r) {
  return (t = Fm(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function il(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function D(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? il(Object(r), !0).forEach(function(n) {
      Mm(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : il(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function zm(e, t) {
  if (typeof e != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(e, t);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Fm(e) {
  var t = zm(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const sl = () => {
};
let ji = {}, Yu = {}, Vu = null, Hu = {
  mark: sl,
  measure: sl
};
try {
  typeof window < "u" && (ji = window), typeof document < "u" && (Yu = document), typeof MutationObserver < "u" && (Vu = MutationObserver), typeof performance < "u" && (Hu = performance);
} catch {
}
const {
  userAgent: ll = ""
} = ji.navigator || {}, Rt = ji, Ne = Yu, cl = Vu, kn = Hu;
Rt.document;
const yt = !!Ne.documentElement && !!Ne.head && typeof Ne.addEventListener == "function" && typeof Ne.createElement == "function", qu = ~ll.indexOf("MSIE") || ~ll.indexOf("Trident/");
var Dm = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, Lm = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Gu = {
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
}, Wm = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Bu = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], We = "classic", ra = "duotone", Um = "sharp", Ym = "sharp-duotone", Xu = [We, ra, Um, Ym], Vm = {
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
}, Hm = {
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
}, qm = /* @__PURE__ */ new Map([["classic", {
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
}]]), Gm = {
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
}, Bm = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], ul = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, Xm = ["kit"], Km = {
  kit: {
    "fa-kit": "fak"
  }
}, Jm = ["fak", "fakd"], Zm = {
  kit: {
    fak: "fa-kit"
  }
}, fl = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, On = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Qm = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], eg = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], tg = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, rg = {
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
}, ng = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, So = {
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
}, ag = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], Eo = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...Qm, ...ag], og = ["solid", "regular", "light", "thin", "duotone", "brands"], Ku = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ig = Ku.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), sg = [...Object.keys(ng), ...og, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", On.GROUP, On.SWAP_OPACITY, On.PRIMARY, On.SECONDARY].concat(Ku.map((e) => "".concat(e, "x"))).concat(ig.map((e) => "w-".concat(e))), lg = {
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
const dt = "___FONT_AWESOME___", Ao = 16, Ju = "fa", Zu = "svg-inline--fa", Zt = "data-fa-i2svg", Po = "data-fa-pseudo-element", cg = "data-fa-pseudo-element-pending", Ii = "data-prefix", Ri = "data-icon", dl = "fontawesome-i2svg", ug = "async", fg = ["HTML", "HEAD", "STYLE", "SCRIPT"], Qu = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function on(e) {
  return new Proxy(e, {
    get(t, r) {
      return r in t ? t[r] : t[We];
    }
  });
}
const ef = D({}, Gu);
ef[We] = D(D(D(D({}, {
  "fa-duotone": "duotone"
}), Gu[We]), ul.kit), ul["kit-duotone"]);
const dg = on(ef), Co = D({}, Gm);
Co[We] = D(D(D(D({}, {
  duotone: "fad"
}), Co[We]), fl.kit), fl["kit-duotone"]);
const pl = on(Co), $o = D({}, So);
$o[We] = D(D({}, $o[We]), Zm.kit);
const Mi = on($o), No = D({}, rg);
No[We] = D(D({}, No[We]), Km.kit);
on(No);
const pg = Dm, tf = "fa-layers-text", mg = Lm, gg = D({}, Vm);
on(gg);
const hg = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Ia = Wm, bg = [...Xm, ...sg], Gr = Rt.FontAwesomeConfig || {};
function yg(e) {
  var t = Ne.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function vg(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
Ne && typeof Ne.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, r] = e;
  const n = vg(yg(t));
  n != null && (Gr[r] = n);
});
const rf = {
  styleDefault: "solid",
  familyDefault: We,
  cssPrefix: Ju,
  replacementClass: Zu,
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
Gr.familyPrefix && (Gr.cssPrefix = Gr.familyPrefix);
const Or = D(D({}, rf), Gr);
Or.autoReplaceSvg || (Or.observeMutations = !1);
const B = {};
Object.keys(rf).forEach((e) => {
  Object.defineProperty(B, e, {
    enumerable: !0,
    set: function(t) {
      Or[e] = t, Br.forEach((r) => r(B));
    },
    get: function() {
      return Or[e];
    }
  });
});
Object.defineProperty(B, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    Or.cssPrefix = e, Br.forEach((t) => t(B));
  },
  get: function() {
    return Or.cssPrefix;
  }
});
Rt.FontAwesomeConfig = B;
const Br = [];
function xg(e) {
  return Br.push(e), () => {
    Br.splice(Br.indexOf(e), 1);
  };
}
const kt = Ao, rt = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function wg(e) {
  if (!e || !yt)
    return;
  const t = Ne.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const r = Ne.head.childNodes;
  let n = null;
  for (let a = r.length - 1; a > -1; a--) {
    const o = r[a], i = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (n = o);
  }
  return Ne.head.insertBefore(t, n), e;
}
const kg = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Qr() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += kg[Math.random() * 62 | 0];
  return t;
}
function Ar(e) {
  const t = [];
  for (let r = (e || []).length >>> 0; r--; )
    t[r] = e[r];
  return t;
}
function zi(e) {
  return e.classList ? Ar(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function nf(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Og(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, '="').concat(nf(e[r]), '" '), "").trim();
}
function na(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, ": ").concat(e[r].trim(), ";"), "");
}
function Fi(e) {
  return e.size !== rt.size || e.x !== rt.x || e.y !== rt.y || e.rotate !== rt.rotate || e.flipX || e.flipY;
}
function Sg(e) {
  let {
    transform: t,
    containerWidth: r,
    iconWidth: n
  } = e;
  const a = {
    transform: "translate(".concat(r / 2, " 256)")
  }, o = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), c = {
    transform: "".concat(o, " ").concat(i, " ").concat(s)
  }, u = {
    transform: "translate(".concat(n / 2 * -1, " -256)")
  };
  return {
    outer: a,
    inner: c,
    path: u
  };
}
function Eg(e) {
  let {
    transform: t,
    width: r = Ao,
    height: n = Ao,
    startCentered: a = !1
  } = e, o = "";
  return a && qu ? o += "translate(".concat(t.x / kt - r / 2, "em, ").concat(t.y / kt - n / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / kt, "em), calc(-50% + ").concat(t.y / kt, "em)) ") : o += "translate(".concat(t.x / kt, "em, ").concat(t.y / kt, "em) "), o += "scale(".concat(t.size / kt * (t.flipX ? -1 : 1), ", ").concat(t.size / kt * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var Ag = `:root, :host {
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
function af() {
  const e = Ju, t = Zu, r = B.cssPrefix, n = B.replacementClass;
  let a = Ag;
  if (r !== e || n !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(r, "-")).replace(i, "--".concat(r, "-")).replace(s, ".".concat(n));
  }
  return a;
}
let ml = !1;
function Ra() {
  B.autoAddCss && !ml && (wg(af()), ml = !0);
}
var Pg = {
  mixout() {
    return {
      dom: {
        css: af,
        insertCss: Ra
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Ra();
      },
      beforeI2svg() {
        Ra();
      }
    };
  }
};
const pt = Rt || {};
pt[dt] || (pt[dt] = {});
pt[dt].styles || (pt[dt].styles = {});
pt[dt].hooks || (pt[dt].hooks = {});
pt[dt].shims || (pt[dt].shims = []);
var nt = pt[dt];
const of = [], sf = function() {
  Ne.removeEventListener("DOMContentLoaded", sf), Hn = 1, of.map((e) => e());
};
let Hn = !1;
yt && (Hn = (Ne.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(Ne.readyState), Hn || Ne.addEventListener("DOMContentLoaded", sf));
function Cg(e) {
  yt && (Hn ? setTimeout(e, 0) : of.push(e));
}
function sn(e) {
  const {
    tag: t,
    attributes: r = {},
    children: n = []
  } = e;
  return typeof e == "string" ? nf(e) : "<".concat(t, " ").concat(Og(r), ">").concat(n.map(sn).join(""), "</").concat(t, ">");
}
function gl(e, t, r) {
  if (e && e[t] && e[t][r])
    return {
      prefix: t,
      iconName: r,
      icon: e[t][r]
    };
}
var Ma = function(e, t, r, n) {
  var a = Object.keys(e), o = a.length, i = t, s, c, u;
  for (r === void 0 ? (s = 1, u = e[a[0]]) : (s = 0, u = r); s < o; s++)
    c = a[s], u = i(u, e[c], c, e);
  return u;
};
function $g(e) {
  const t = [];
  let r = 0;
  const n = e.length;
  for (; r < n; ) {
    const a = e.charCodeAt(r++);
    if (a >= 55296 && a <= 56319 && r < n) {
      const o = e.charCodeAt(r++);
      (o & 64512) == 56320 ? t.push(((a & 1023) << 10) + (o & 1023) + 65536) : (t.push(a), r--);
    } else
      t.push(a);
  }
  return t;
}
function lf(e) {
  const t = $g(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function Ng(e, t) {
  const r = e.length;
  let n = e.charCodeAt(t), a;
  return n >= 55296 && n <= 56319 && r > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (n - 55296) * 1024 + a - 56320 + 65536 : n;
}
function hl(e) {
  return Object.keys(e).reduce((t, r) => {
    const n = e[r];
    return n.icon ? t[n.iconName] = n.icon : t[r] = n, t;
  }, {});
}
function _o(e, t) {
  let r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: n = !1
  } = r, a = hl(t);
  typeof nt.hooks.addPack == "function" && !n ? nt.hooks.addPack(e, hl(t)) : nt.styles[e] = D(D({}, nt.styles[e] || {}), a), e === "fas" && _o("fa", t);
}
const {
  styles: en,
  shims: _g
} = nt, cf = Object.keys(Mi), Tg = cf.reduce((e, t) => (e[t] = Object.keys(Mi[t]), e), {});
let Di = null, uf = {}, ff = {}, df = {}, pf = {}, mf = {};
function jg(e) {
  return ~bg.indexOf(e);
}
function Ig(e, t) {
  const r = t.split("-"), n = r[0], a = r.slice(1).join("-");
  return n === e && a !== "" && !jg(a) ? a : null;
}
const gf = () => {
  const e = (n) => Ma(en, (a, o, i) => (a[i] = Ma(o, n, {}), a), {});
  uf = e((n, a, o) => (a[3] && (n[a[3]] = o), a[2] && a[2].filter((i) => typeof i == "number").forEach((i) => {
    n[i.toString(16)] = o;
  }), n)), ff = e((n, a, o) => (n[o] = o, a[2] && a[2].filter((i) => typeof i == "string").forEach((i) => {
    n[i] = o;
  }), n)), mf = e((n, a, o) => {
    const i = a[2];
    return n[o] = o, i.forEach((s) => {
      n[s] = o;
    }), n;
  });
  const t = "far" in en || B.autoFetchSvg, r = Ma(_g, (n, a) => {
    const o = a[0];
    let i = a[1];
    const s = a[2];
    return i === "far" && !t && (i = "fas"), typeof o == "string" && (n.names[o] = {
      prefix: i,
      iconName: s
    }), typeof o == "number" && (n.unicodes[o.toString(16)] = {
      prefix: i,
      iconName: s
    }), n;
  }, {
    names: {},
    unicodes: {}
  });
  df = r.names, pf = r.unicodes, Di = aa(B.styleDefault, {
    family: B.familyDefault
  });
};
xg((e) => {
  Di = aa(e.styleDefault, {
    family: B.familyDefault
  });
});
gf();
function Li(e, t) {
  return (uf[e] || {})[t];
}
function Rg(e, t) {
  return (ff[e] || {})[t];
}
function Gt(e, t) {
  return (mf[e] || {})[t];
}
function hf(e) {
  return df[e] || {
    prefix: null,
    iconName: null
  };
}
function Mg(e) {
  const t = pf[e], r = Li("fas", e);
  return t || (r ? {
    prefix: "fas",
    iconName: r
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Mt() {
  return Di;
}
const bf = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function zg(e) {
  let t = We;
  const r = cf.reduce((n, a) => (n[a] = "".concat(B.cssPrefix, "-").concat(a), n), {});
  return Xu.forEach((n) => {
    (e.includes(r[n]) || e.some((a) => Tg[n].includes(a))) && (t = n);
  }), t;
}
function aa(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: r = We
  } = t, n = dg[r][e];
  if (r === ra && !e)
    return "fad";
  const a = pl[r][e] || pl[r][n], o = e in nt.styles ? e : null;
  return a || o || null;
}
function Fg(e) {
  let t = [], r = null;
  return e.forEach((n) => {
    const a = Ig(B.cssPrefix, n);
    a ? r = a : n && t.push(n);
  }), {
    iconName: r,
    rest: t
  };
}
function bl(e) {
  return e.sort().filter((t, r, n) => n.indexOf(t) === r);
}
function oa(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: r = !1
  } = t;
  let n = null;
  const a = Eo.concat(eg), o = bl(e.filter((m) => a.includes(m))), i = bl(e.filter((m) => !Eo.includes(m))), s = o.filter((m) => (n = m, !Bu.includes(m))), [c = null] = s, u = zg(o), d = D(D({}, Fg(i)), {}, {
    prefix: aa(c, {
      family: u
    })
  });
  return D(D(D({}, d), Ug({
    values: e,
    family: u,
    styles: en,
    config: B,
    canonical: d,
    givenPrefix: n
  })), Dg(r, n, d));
}
function Dg(e, t, r) {
  let {
    prefix: n,
    iconName: a
  } = r;
  if (e || !n || !a)
    return {
      prefix: n,
      iconName: a
    };
  const o = t === "fa" ? hf(a) : {}, i = Gt(n, a);
  return a = o.iconName || i || a, n = o.prefix || n, n === "far" && !en.far && en.fas && !B.autoFetchSvg && (n = "fas"), {
    prefix: n,
    iconName: a
  };
}
const Lg = Xu.filter((e) => e !== We || e !== ra), Wg = Object.keys(So).filter((e) => e !== We).map((e) => Object.keys(So[e])).flat();
function Ug(e) {
  const {
    values: t,
    family: r,
    canonical: n,
    givenPrefix: a = "",
    styles: o = {},
    config: i = {}
  } = e, s = r === ra, c = t.includes("fa-duotone") || t.includes("fad"), u = i.familyDefault === "duotone", d = n.prefix === "fad" || n.prefix === "fa-duotone";
  if (!s && (c || u || d) && (n.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (n.prefix = "fab"), !n.prefix && Lg.includes(r) && (Object.keys(o).find((m) => Wg.includes(m)) || i.autoFetchSvg)) {
    const m = qm.get(r).defaultShortPrefixId;
    n.prefix = m, n.iconName = Gt(n.prefix, n.iconName) || n.iconName;
  }
  return (n.prefix === "fa" || a === "fa") && (n.prefix = Mt() || "fas"), n;
}
let Yg = class {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
      r[n] = arguments[n];
    const a = r.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = D(D({}, this.definitions[o] || {}), a[o]), _o(o, a[o]);
      const i = Mi[We][o];
      i && _o(i, a[o]), gf();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, r) {
    const n = r.prefix && r.iconName && r.icon ? {
      0: r
    } : r;
    return Object.keys(n).map((a) => {
      const {
        prefix: o,
        iconName: i,
        icon: s
      } = n[a], c = s[2];
      t[o] || (t[o] = {}), c.length > 0 && c.forEach((u) => {
        typeof u == "string" && (t[o][u] = s);
      }), t[o][i] = s;
    }), t;
  }
}, yl = [], fr = {};
const br = {}, Vg = Object.keys(br);
function Hg(e, t) {
  let {
    mixoutsTo: r
  } = t;
  return yl = e, fr = {}, Object.keys(br).forEach((n) => {
    Vg.indexOf(n) === -1 && delete br[n];
  }), yl.forEach((n) => {
    const a = n.mixout ? n.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (r[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((i) => {
        r[o] || (r[o] = {}), r[o][i] = a[o][i];
      });
    }), n.hooks) {
      const o = n.hooks();
      Object.keys(o).forEach((i) => {
        fr[i] || (fr[i] = []), fr[i].push(o[i]);
      });
    }
    n.provides && n.provides(br);
  }), r;
}
function To(e, t) {
  for (var r = arguments.length, n = new Array(r > 2 ? r - 2 : 0), a = 2; a < r; a++)
    n[a - 2] = arguments[a];
  return (fr[e] || []).forEach((o) => {
    t = o.apply(null, [t, ...n]);
  }), t;
}
function Qt(e) {
  for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++)
    r[n - 1] = arguments[n];
  (fr[e] || []).forEach((a) => {
    a.apply(null, r);
  });
}
function zt() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return br[e] ? br[e].apply(null, t) : void 0;
}
function jo(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const r = e.prefix || Mt();
  if (t)
    return t = Gt(r, t) || t, gl(yf.definitions, r, t) || gl(nt.styles, r, t);
}
const yf = new Yg(), qg = () => {
  B.autoReplaceSvg = !1, B.observeMutations = !1, Qt("noAuto");
}, Gg = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return yt ? (Qt("beforeI2svg", e), zt("pseudoElements2svg", e), zt("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    B.autoReplaceSvg === !1 && (B.autoReplaceSvg = !0), B.observeMutations = !0, Cg(() => {
      Xg({
        autoReplaceSvgRoot: t
      }), Qt("watch", e);
    });
  }
}, Bg = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Gt(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], r = aa(e[0]);
      return {
        prefix: r,
        iconName: Gt(r, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(B.cssPrefix, "-")) > -1 || e.match(pg))) {
      const t = oa(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Mt(),
        iconName: Gt(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Mt();
      return {
        prefix: t,
        iconName: Gt(t, e) || e
      };
    }
  }
}, Be = {
  noAuto: qg,
  config: B,
  dom: Gg,
  parse: Bg,
  library: yf,
  findIconDefinition: jo,
  toHtml: sn
}, Xg = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = Ne
  } = e;
  (Object.keys(nt.styles).length > 0 || B.autoFetchSvg) && yt && B.autoReplaceSvg && Be.dom.i2svg({
    node: t
  });
};
function ia(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((r) => sn(r));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!yt) return;
      const r = Ne.createElement("div");
      return r.innerHTML = e.html, r.children;
    }
  }), e;
}
function Kg(e) {
  let {
    children: t,
    main: r,
    mask: n,
    attributes: a,
    styles: o,
    transform: i
  } = e;
  if (Fi(i) && r.found && !n.found) {
    const {
      width: s,
      height: c
    } = r, u = {
      x: s / c / 2,
      y: 0.5
    };
    a.style = na(D(D({}, o), {}, {
      "transform-origin": "".concat(u.x + i.x / 16, "em ").concat(u.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function Jg(e) {
  let {
    prefix: t,
    iconName: r,
    children: n,
    attributes: a,
    symbol: o
  } = e;
  const i = o === !0 ? "".concat(t, "-").concat(B.cssPrefix, "-").concat(r) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: D(D({}, a), {}, {
        id: i
      }),
      children: n
    }]
  }];
}
function Wi(e) {
  const {
    icons: {
      main: t,
      mask: r
    },
    prefix: n,
    iconName: a,
    transform: o,
    symbol: i,
    title: s,
    maskId: c,
    titleId: u,
    extra: d,
    watchable: m = !1
  } = e, {
    width: h,
    height: k
  } = r.found ? r : t, O = Jm.includes(n), w = [B.replacementClass, a ? "".concat(B.cssPrefix, "-").concat(a) : ""].filter((p) => d.classes.indexOf(p) === -1).filter((p) => p !== "" || !!p).concat(d.classes).join(" ");
  let b = {
    children: [],
    attributes: D(D({}, d.attributes), {}, {
      "data-prefix": n,
      "data-icon": a,
      class: w,
      role: d.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(h, " ").concat(k)
    })
  };
  const E = O && !~d.classes.indexOf("fa-fw") ? {
    width: "".concat(h / k * 16 * 0.0625, "em")
  } : {};
  m && (b.attributes[Zt] = ""), s && (b.children.push({
    tag: "title",
    attributes: {
      id: b.attributes["aria-labelledby"] || "title-".concat(u || Qr())
    },
    children: [s]
  }), delete b.attributes.title);
  const N = D(D({}, b), {}, {
    prefix: n,
    iconName: a,
    main: t,
    mask: r,
    maskId: c,
    transform: o,
    symbol: i,
    styles: D(D({}, E), d.styles)
  }), {
    children: T,
    attributes: j
  } = r.found && t.found ? zt("generateAbstractMask", N) || {
    children: [],
    attributes: {}
  } : zt("generateAbstractIcon", N) || {
    children: [],
    attributes: {}
  };
  return N.children = T, N.attributes = j, i ? Jg(N) : Kg(N);
}
function vl(e) {
  const {
    content: t,
    width: r,
    height: n,
    transform: a,
    title: o,
    extra: i,
    watchable: s = !1
  } = e, c = D(D(D({}, i.attributes), o ? {
    title: o
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[Zt] = "");
  const u = D({}, i.styles);
  Fi(a) && (u.transform = Eg({
    transform: a,
    startCentered: !0,
    width: r,
    height: n
  }), u["-webkit-transform"] = u.transform);
  const d = na(u);
  d.length > 0 && (c.style = d);
  const m = [];
  return m.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), o && m.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), m;
}
function Zg(e) {
  const {
    content: t,
    title: r,
    extra: n
  } = e, a = D(D(D({}, n.attributes), r ? {
    title: r
  } : {}), {}, {
    class: n.classes.join(" ")
  }), o = na(n.styles);
  o.length > 0 && (a.style = o);
  const i = [];
  return i.push({
    tag: "span",
    attributes: a,
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
  styles: za
} = nt;
function Io(e) {
  const t = e[0], r = e[1], [n] = e.slice(4);
  let a = null;
  return Array.isArray(n) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(B.cssPrefix, "-").concat(Ia.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(B.cssPrefix, "-").concat(Ia.SECONDARY),
        fill: "currentColor",
        d: n[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(B.cssPrefix, "-").concat(Ia.PRIMARY),
        fill: "currentColor",
        d: n[1]
      }
    }]
  } : a = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: n
    }
  }, {
    found: !0,
    width: t,
    height: r,
    icon: a
  };
}
const Qg = {
  found: !1,
  width: 512,
  height: 512
};
function eh(e, t) {
  !Qu && !B.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Ro(e, t) {
  let r = t;
  return t === "fa" && B.styleDefault !== null && (t = Mt()), new Promise((n, a) => {
    if (r === "fa") {
      const o = hf(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && za[t] && za[t][e]) {
      const o = za[t][e];
      return n(Io(o));
    }
    eh(e, t), n(D(D({}, Qg), {}, {
      icon: B.showMissingIcons && e ? zt("missingIconAbstract") || {} : {}
    }));
  });
}
const xl = () => {
}, Mo = B.measurePerformance && kn && kn.mark && kn.measure ? kn : {
  mark: xl,
  measure: xl
}, Ur = 'FA "6.7.2"', th = (e) => (Mo.mark("".concat(Ur, " ").concat(e, " begins")), () => vf(e)), vf = (e) => {
  Mo.mark("".concat(Ur, " ").concat(e, " ends")), Mo.measure("".concat(Ur, " ").concat(e), "".concat(Ur, " ").concat(e, " begins"), "".concat(Ur, " ").concat(e, " ends"));
};
var Ui = {
  begin: th,
  end: vf
};
const Mn = () => {
};
function wl(e) {
  return typeof (e.getAttribute ? e.getAttribute(Zt) : null) == "string";
}
function rh(e) {
  const t = e.getAttribute ? e.getAttribute(Ii) : null, r = e.getAttribute ? e.getAttribute(Ri) : null;
  return t && r;
}
function nh(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(B.replacementClass);
}
function ah() {
  return B.autoReplaceSvg === !0 ? zn.replace : zn[B.autoReplaceSvg] || zn.replace;
}
function oh(e) {
  return Ne.createElementNS("http://www.w3.org/2000/svg", e);
}
function ih(e) {
  return Ne.createElement(e);
}
function xf(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: r = e.tag === "svg" ? oh : ih
  } = t;
  if (typeof e == "string")
    return Ne.createTextNode(e);
  const n = r(e.tag);
  return Object.keys(e.attributes || []).forEach(function(a) {
    n.setAttribute(a, e.attributes[a]);
  }), (e.children || []).forEach(function(a) {
    n.appendChild(xf(a, {
      ceFn: r
    }));
  }), n;
}
function sh(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const zn = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((r) => {
        t.parentNode.insertBefore(xf(r), t);
      }), t.getAttribute(Zt) === null && B.keepOriginalSource) {
        let r = Ne.createComment(sh(t));
        t.parentNode.replaceChild(r, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], r = e[1];
    if (~zi(t).indexOf(B.replacementClass))
      return zn.replace(e);
    const n = new RegExp("".concat(B.cssPrefix, "-.*"));
    if (delete r[0].attributes.id, r[0].attributes.class) {
      const o = r[0].attributes.class.split(" ").reduce((i, s) => (s === B.replacementClass || s.match(n) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      r[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = r.map((o) => sn(o)).join(`
`);
    t.setAttribute(Zt, ""), t.innerHTML = a;
  }
};
function kl(e) {
  e();
}
function wf(e, t) {
  const r = typeof t == "function" ? t : Mn;
  if (e.length === 0)
    r();
  else {
    let n = kl;
    B.mutateApproach === ug && (n = Rt.requestAnimationFrame || kl), n(() => {
      const a = ah(), o = Ui.begin("mutate");
      e.map(a), o(), r();
    });
  }
}
let Yi = !1;
function kf() {
  Yi = !0;
}
function zo() {
  Yi = !1;
}
let qn = null;
function Ol(e) {
  if (!cl || !B.observeMutations)
    return;
  const {
    treeCallback: t = Mn,
    nodeCallback: r = Mn,
    pseudoElementsCallback: n = Mn,
    observeMutationsRoot: a = Ne
  } = e;
  qn = new cl((o) => {
    if (Yi) return;
    const i = Mt();
    Ar(o).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !wl(s.addedNodes[0]) && (B.searchPseudoElements && n(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && B.searchPseudoElements && n(s.target.parentNode), s.type === "attributes" && wl(s.target) && ~hg.indexOf(s.attributeName))
        if (s.attributeName === "class" && rh(s.target)) {
          const {
            prefix: c,
            iconName: u
          } = oa(zi(s.target));
          s.target.setAttribute(Ii, c || i), u && s.target.setAttribute(Ri, u);
        } else nh(s.target) && r(s.target);
    });
  }), yt && qn.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function lh() {
  qn && qn.disconnect();
}
function ch(e) {
  const t = e.getAttribute("style");
  let r = [];
  return t && (r = t.split(";").reduce((n, a) => {
    const o = a.split(":"), i = o[0], s = o.slice(1);
    return i && s.length > 0 && (n[i] = s.join(":").trim()), n;
  }, {})), r;
}
function uh(e) {
  const t = e.getAttribute("data-prefix"), r = e.getAttribute("data-icon"), n = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = oa(zi(e));
  return a.prefix || (a.prefix = Mt()), t && r && (a.prefix = t, a.iconName = r), a.iconName && a.prefix || (a.prefix && n.length > 0 && (a.iconName = Rg(a.prefix, e.innerText) || Li(a.prefix, lf(e.innerText))), !a.iconName && B.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function fh(e) {
  const t = Ar(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), r = e.getAttribute("title"), n = e.getAttribute("data-fa-title-id");
  return B.autoA11y && (r ? t["aria-labelledby"] = "".concat(B.replacementClass, "-title-").concat(n || Qr()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function dh() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: rt,
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
function Sl(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: r,
    prefix: n,
    rest: a
  } = uh(e), o = fh(e), i = To("parseNodeAttributes", {}, e);
  let s = t.styleParser ? ch(e) : [];
  return D({
    iconName: r,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: n,
    transform: rt,
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
  styles: ph
} = nt;
function Of(e) {
  const t = B.autoReplaceSvg === "nest" ? Sl(e, {
    styleParser: !1
  }) : Sl(e);
  return ~t.extra.classes.indexOf(tf) ? zt("generateLayersText", e, t) : zt("generateSvgReplacementMutation", e, t);
}
function mh() {
  return [...Bm, ...Eo];
}
function El(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!yt) return Promise.resolve();
  const r = Ne.documentElement.classList, n = (d) => r.add("".concat(dl, "-").concat(d)), a = (d) => r.remove("".concat(dl, "-").concat(d)), o = B.autoFetchSvg ? mh() : Bu.concat(Object.keys(ph));
  o.includes("fa") || o.push("fa");
  const i = [".".concat(tf, ":not([").concat(Zt, "])")].concat(o.map((d) => ".".concat(d, ":not([").concat(Zt, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = Ar(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    n("pending"), a("complete");
  else
    return Promise.resolve();
  const c = Ui.begin("onTree"), u = s.reduce((d, m) => {
    try {
      const h = Of(m);
      h && d.push(h);
    } catch (h) {
      Qu || h.name === "MissingIcon" && console.error(h);
    }
    return d;
  }, []);
  return new Promise((d, m) => {
    Promise.all(u).then((h) => {
      wf(h, () => {
        n("active"), n("complete"), a("pending"), typeof t == "function" && t(), c(), d();
      });
    }).catch((h) => {
      c(), m(h);
    });
  });
}
function gh(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  Of(e).then((r) => {
    r && wf([r], t);
  });
}
function hh(e) {
  return function(t) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const n = (t || {}).icon ? t : jo(t || {});
    let {
      mask: a
    } = r;
    return a && (a = (a || {}).icon ? a : jo(a || {})), e(n, D(D({}, r), {}, {
      mask: a
    }));
  };
}
const bh = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: r = rt,
    symbol: n = !1,
    mask: a = null,
    maskId: o = null,
    title: i = null,
    titleId: s = null,
    classes: c = [],
    attributes: u = {},
    styles: d = {}
  } = t;
  if (!e) return;
  const {
    prefix: m,
    iconName: h,
    icon: k
  } = e;
  return ia(D({
    type: "icon"
  }, e), () => (Qt("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), B.autoA11y && (i ? u["aria-labelledby"] = "".concat(B.replacementClass, "-title-").concat(s || Qr()) : (u["aria-hidden"] = "true", u.focusable = "false")), Wi({
    icons: {
      main: Io(k),
      mask: a ? Io(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: m,
    iconName: h,
    transform: D(D({}, rt), r),
    symbol: n,
    title: i,
    maskId: o,
    titleId: s,
    extra: {
      attributes: u,
      styles: d,
      classes: c
    }
  })));
};
var yh = {
  mixout() {
    return {
      icon: hh(bh)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = El, e.nodeCallback = gh, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: r = Ne,
        callback: n = () => {
        }
      } = t;
      return El(r, n);
    }, e.generateSvgReplacementMutation = function(t, r) {
      const {
        iconName: n,
        title: a,
        titleId: o,
        prefix: i,
        transform: s,
        symbol: c,
        mask: u,
        maskId: d,
        extra: m
      } = r;
      return new Promise((h, k) => {
        Promise.all([Ro(n, i), u.iconName ? Ro(u.iconName, u.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((O) => {
          let [w, b] = O;
          h([t, Wi({
            icons: {
              main: w,
              mask: b
            },
            prefix: i,
            iconName: n,
            transform: s,
            symbol: c,
            maskId: d,
            title: a,
            titleId: o,
            extra: m,
            watchable: !0
          })]);
        }).catch(k);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: r,
        attributes: n,
        main: a,
        transform: o,
        styles: i
      } = t;
      const s = na(i);
      s.length > 0 && (n.style = s);
      let c;
      return Fi(o) && (c = zt("generateAbstractTransformGrouping", {
        main: a,
        transform: o,
        containerWidth: a.width,
        iconWidth: a.width
      })), r.push(c || a.icon), {
        children: r,
        attributes: n
      };
    };
  }
}, vh = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: r = []
        } = t;
        return ia({
          type: "layer"
        }, () => {
          Qt("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let n = [];
          return e((a) => {
            Array.isArray(a) ? a.map((o) => {
              n = n.concat(o.abstract);
            }) : n = n.concat(a.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(B.cssPrefix, "-layers"), ...r].join(" ")
            },
            children: n
          }];
        });
      }
    };
  }
}, xh = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: r = null,
          classes: n = [],
          attributes: a = {},
          styles: o = {}
        } = t;
        return ia({
          type: "counter",
          content: e
        }, () => (Qt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Zg({
          content: e.toString(),
          title: r,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(B.cssPrefix, "-layers-counter"), ...n]
          }
        })));
      }
    };
  }
}, wh = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: r = rt,
          title: n = null,
          classes: a = [],
          attributes: o = {},
          styles: i = {}
        } = t;
        return ia({
          type: "text",
          content: e
        }, () => (Qt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), vl({
          content: e,
          transform: D(D({}, rt), r),
          title: n,
          extra: {
            attributes: o,
            styles: i,
            classes: ["".concat(B.cssPrefix, "-layers-text"), ...a]
          }
        })));
      }
    };
  },
  provides(e) {
    e.generateLayersText = function(t, r) {
      const {
        title: n,
        transform: a,
        extra: o
      } = r;
      let i = null, s = null;
      if (qu) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), u = t.getBoundingClientRect();
        i = u.width / c, s = u.height / c;
      }
      return B.autoA11y && !n && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, vl({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: a,
        title: n,
        extra: o,
        watchable: !0
      })]);
    };
  }
};
const kh = new RegExp('"', "ug"), Al = [1105920, 1112319], Pl = D(D(D(D({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), Hm), lg), tg), Fo = Object.keys(Pl).reduce((e, t) => (e[t.toLowerCase()] = Pl[t], e), {}), Oh = Object.keys(Fo).reduce((e, t) => {
  const r = Fo[t];
  return e[t] = r[900] || [...Object.entries(r)][0][1], e;
}, {});
function Sh(e) {
  const t = e.replace(kh, ""), r = Ng(t, 0), n = r >= Al[0] && r <= Al[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: lf(a ? t[0] : t),
    isSecondary: n || a
  };
}
function Eh(e, t) {
  const r = e.replace(/^['"]|['"]$/g, "").toLowerCase(), n = parseInt(t), a = isNaN(n) ? "normal" : n;
  return (Fo[r] || {})[a] || Oh[r];
}
function Cl(e, t) {
  const r = "".concat(cg).concat(t.replace(":", "-"));
  return new Promise((n, a) => {
    if (e.getAttribute(r) !== null)
      return n();
    const o = Ar(e.children).filter((m) => m.getAttribute(Po) === t)[0], i = Rt.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), c = s.match(mg), u = i.getPropertyValue("font-weight"), d = i.getPropertyValue("content");
    if (o && !c)
      return e.removeChild(o), n();
    if (c && d !== "none" && d !== "") {
      const m = i.getPropertyValue("content");
      let h = Eh(s, u);
      const {
        value: k,
        isSecondary: O
      } = Sh(m), w = c[0].startsWith("FontAwesome");
      let b = Li(h, k), E = b;
      if (w) {
        const N = Mg(k);
        N.iconName && N.prefix && (b = N.iconName, h = N.prefix);
      }
      if (b && !O && (!o || o.getAttribute(Ii) !== h || o.getAttribute(Ri) !== E)) {
        e.setAttribute(r, E), o && e.removeChild(o);
        const N = dh(), {
          extra: T
        } = N;
        T.attributes[Po] = t, Ro(b, h).then((j) => {
          const p = Wi(D(D({}, N), {}, {
            icons: {
              main: j,
              mask: bf()
            },
            prefix: h,
            iconName: E,
            extra: T,
            watchable: !0
          })), V = Ne.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(V, e.firstChild) : e.appendChild(V), V.outerHTML = p.map((J) => sn(J)).join(`
`), e.removeAttribute(r), n();
        }).catch(a);
      } else
        n();
    } else
      n();
  });
}
function Ah(e) {
  return Promise.all([Cl(e, "::before"), Cl(e, "::after")]);
}
function Ph(e) {
  return e.parentNode !== document.head && !~fg.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Po) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function $l(e) {
  if (yt)
    return new Promise((t, r) => {
      const n = Ar(e.querySelectorAll("*")).filter(Ph).map(Ah), a = Ui.begin("searchPseudoElements");
      kf(), Promise.all(n).then(() => {
        a(), zo(), t();
      }).catch(() => {
        a(), zo(), r();
      });
    });
}
var Ch = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = $l, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: r = Ne
      } = t;
      B.searchPseudoElements && $l(r);
    };
  }
};
let Nl = !1;
var $h = {
  mixout() {
    return {
      dom: {
        unwatch() {
          kf(), Nl = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Ol(To("mutationObserverCallbacks", {}));
      },
      noAuto() {
        lh();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Nl ? zo() : Ol(To("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const _l = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((r, n) => {
    const a = n.toLowerCase().split("-"), o = a[0];
    let i = a.slice(1).join("-");
    if (o && i === "h")
      return r.flipX = !0, r;
    if (o && i === "v")
      return r.flipY = !0, r;
    if (i = parseFloat(i), isNaN(i))
      return r;
    switch (o) {
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
var Nh = {
  mixout() {
    return {
      parse: {
        transform: (e) => _l(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-transform");
        return r && (e.transform = _l(r)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: r,
        transform: n,
        containerWidth: a,
        iconWidth: o
      } = t;
      const i = {
        transform: "translate(".concat(a / 2, " 256)")
      }, s = "translate(".concat(n.x * 32, ", ").concat(n.y * 32, ") "), c = "scale(".concat(n.size / 16 * (n.flipX ? -1 : 1), ", ").concat(n.size / 16 * (n.flipY ? -1 : 1), ") "), u = "rotate(".concat(n.rotate, " 0 0)"), d = {
        transform: "".concat(s, " ").concat(c, " ").concat(u)
      }, m = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, h = {
        outer: i,
        inner: d,
        path: m
      };
      return {
        tag: "g",
        attributes: D({}, h.outer),
        children: [{
          tag: "g",
          attributes: D({}, h.inner),
          children: [{
            tag: r.icon.tag,
            children: r.icon.children,
            attributes: D(D({}, r.icon.attributes), h.path)
          }]
        }]
      };
    };
  }
};
const Fa = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Tl(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function _h(e) {
  return e.tag === "g" ? e.children : [e];
}
var Th = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-mask"), n = r ? oa(r.split(" ").map((a) => a.trim())) : bf();
        return n.prefix || (n.prefix = Mt()), e.mask = n, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: r,
        attributes: n,
        main: a,
        mask: o,
        maskId: i,
        transform: s
      } = t;
      const {
        width: c,
        icon: u
      } = a, {
        width: d,
        icon: m
      } = o, h = Sg({
        transform: s,
        containerWidth: d,
        iconWidth: c
      }), k = {
        tag: "rect",
        attributes: D(D({}, Fa), {}, {
          fill: "white"
        })
      }, O = u.children ? {
        children: u.children.map(Tl)
      } : {}, w = {
        tag: "g",
        attributes: D({}, h.inner),
        children: [Tl(D({
          tag: u.tag,
          attributes: D(D({}, u.attributes), h.path)
        }, O))]
      }, b = {
        tag: "g",
        attributes: D({}, h.outer),
        children: [w]
      }, E = "mask-".concat(i || Qr()), N = "clip-".concat(i || Qr()), T = {
        tag: "mask",
        attributes: D(D({}, Fa), {}, {
          id: E,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [k, b]
      }, j = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: N
          },
          children: _h(m)
        }, T]
      };
      return r.push(j, {
        tag: "rect",
        attributes: D({
          fill: "currentColor",
          "clip-path": "url(#".concat(N, ")"),
          mask: "url(#".concat(E, ")")
        }, Fa)
      }), {
        children: r,
        attributes: n
      };
    };
  }
}, jh = {
  provides(e) {
    let t = !1;
    Rt.matchMedia && (t = Rt.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const r = [], n = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      r.push({
        tag: "path",
        attributes: D(D({}, n), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = D(D({}, a), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: D(D({}, n), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: D(D({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: D(D({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), r.push(i), r.push({
        tag: "path",
        attributes: D(D({}, n), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: D(D({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || r.push({
        tag: "path",
        attributes: D(D({}, n), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: D(D({}, o), {}, {
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
}, Ih = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-symbol"), n = r === null ? !1 : r === "" ? !0 : r;
        return e.symbol = n, e;
      }
    };
  }
}, Rh = [Pg, yh, vh, xh, wh, Ch, $h, Nh, Th, jh, Ih];
Hg(Rh, {
  mixoutsTo: Be
});
Be.noAuto;
Be.config;
Be.library;
Be.dom;
const Do = Be.parse;
Be.findIconDefinition;
Be.toHtml;
const Mh = Be.icon;
Be.layer;
Be.text;
Be.counter;
function zh(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Sn = { exports: {} }, Da = { exports: {} }, ve = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var jl;
function Fh() {
  if (jl) return ve;
  jl = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, d = e ? Symbol.for("react.forward_ref") : 60112, m = e ? Symbol.for("react.suspense") : 60113, h = e ? Symbol.for("react.suspense_list") : 60120, k = e ? Symbol.for("react.memo") : 60115, O = e ? Symbol.for("react.lazy") : 60116, w = e ? Symbol.for("react.block") : 60121, b = e ? Symbol.for("react.fundamental") : 60117, E = e ? Symbol.for("react.responder") : 60118, N = e ? Symbol.for("react.scope") : 60119;
  function T(p) {
    if (typeof p == "object" && p !== null) {
      var V = p.$$typeof;
      switch (V) {
        case t:
          switch (p = p.type, p) {
            case c:
            case u:
            case n:
            case o:
            case a:
            case m:
              return p;
            default:
              switch (p = p && p.$$typeof, p) {
                case s:
                case d:
                case O:
                case k:
                case i:
                  return p;
                default:
                  return V;
              }
          }
        case r:
          return V;
      }
    }
  }
  function j(p) {
    return T(p) === u;
  }
  return ve.AsyncMode = c, ve.ConcurrentMode = u, ve.ContextConsumer = s, ve.ContextProvider = i, ve.Element = t, ve.ForwardRef = d, ve.Fragment = n, ve.Lazy = O, ve.Memo = k, ve.Portal = r, ve.Profiler = o, ve.StrictMode = a, ve.Suspense = m, ve.isAsyncMode = function(p) {
    return j(p) || T(p) === c;
  }, ve.isConcurrentMode = j, ve.isContextConsumer = function(p) {
    return T(p) === s;
  }, ve.isContextProvider = function(p) {
    return T(p) === i;
  }, ve.isElement = function(p) {
    return typeof p == "object" && p !== null && p.$$typeof === t;
  }, ve.isForwardRef = function(p) {
    return T(p) === d;
  }, ve.isFragment = function(p) {
    return T(p) === n;
  }, ve.isLazy = function(p) {
    return T(p) === O;
  }, ve.isMemo = function(p) {
    return T(p) === k;
  }, ve.isPortal = function(p) {
    return T(p) === r;
  }, ve.isProfiler = function(p) {
    return T(p) === o;
  }, ve.isStrictMode = function(p) {
    return T(p) === a;
  }, ve.isSuspense = function(p) {
    return T(p) === m;
  }, ve.isValidElementType = function(p) {
    return typeof p == "string" || typeof p == "function" || p === n || p === u || p === o || p === a || p === m || p === h || typeof p == "object" && p !== null && (p.$$typeof === O || p.$$typeof === k || p.$$typeof === i || p.$$typeof === s || p.$$typeof === d || p.$$typeof === b || p.$$typeof === E || p.$$typeof === N || p.$$typeof === w);
  }, ve.typeOf = T, ve;
}
var Oe = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Il;
function Dh() {
  return Il || (Il = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, d = e ? Symbol.for("react.forward_ref") : 60112, m = e ? Symbol.for("react.suspense") : 60113, h = e ? Symbol.for("react.suspense_list") : 60120, k = e ? Symbol.for("react.memo") : 60115, O = e ? Symbol.for("react.lazy") : 60116, w = e ? Symbol.for("react.block") : 60121, b = e ? Symbol.for("react.fundamental") : 60117, E = e ? Symbol.for("react.responder") : 60118, N = e ? Symbol.for("react.scope") : 60119;
    function T(v) {
      return typeof v == "string" || typeof v == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      v === n || v === u || v === o || v === a || v === m || v === h || typeof v == "object" && v !== null && (v.$$typeof === O || v.$$typeof === k || v.$$typeof === i || v.$$typeof === s || v.$$typeof === d || v.$$typeof === b || v.$$typeof === E || v.$$typeof === N || v.$$typeof === w);
    }
    function j(v) {
      if (typeof v == "object" && v !== null) {
        var ye = v.$$typeof;
        switch (ye) {
          case t:
            var De = v.type;
            switch (De) {
              case c:
              case u:
              case n:
              case o:
              case a:
              case m:
                return De;
              default:
                var Ze = De && De.$$typeof;
                switch (Ze) {
                  case s:
                  case d:
                  case O:
                  case k:
                  case i:
                    return Ze;
                  default:
                    return ye;
                }
            }
          case r:
            return ye;
        }
      }
    }
    var p = c, V = u, J = s, oe = i, me = t, ne = d, ge = n, F = O, be = k, ee = r, ce = o, G = a, U = m, Z = !1;
    function te(v) {
      return Z || (Z = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), g(v) || j(v) === c;
    }
    function g(v) {
      return j(v) === u;
    }
    function f(v) {
      return j(v) === s;
    }
    function x(v) {
      return j(v) === i;
    }
    function A(v) {
      return typeof v == "object" && v !== null && v.$$typeof === t;
    }
    function S(v) {
      return j(v) === d;
    }
    function C(v) {
      return j(v) === n;
    }
    function _(v) {
      return j(v) === O;
    }
    function $(v) {
      return j(v) === k;
    }
    function R(v) {
      return j(v) === r;
    }
    function M(v) {
      return j(v) === o;
    }
    function z(v) {
      return j(v) === a;
    }
    function Q(v) {
      return j(v) === m;
    }
    Oe.AsyncMode = p, Oe.ConcurrentMode = V, Oe.ContextConsumer = J, Oe.ContextProvider = oe, Oe.Element = me, Oe.ForwardRef = ne, Oe.Fragment = ge, Oe.Lazy = F, Oe.Memo = be, Oe.Portal = ee, Oe.Profiler = ce, Oe.StrictMode = G, Oe.Suspense = U, Oe.isAsyncMode = te, Oe.isConcurrentMode = g, Oe.isContextConsumer = f, Oe.isContextProvider = x, Oe.isElement = A, Oe.isForwardRef = S, Oe.isFragment = C, Oe.isLazy = _, Oe.isMemo = $, Oe.isPortal = R, Oe.isProfiler = M, Oe.isStrictMode = z, Oe.isSuspense = Q, Oe.isValidElementType = T, Oe.typeOf = j;
  }()), Oe;
}
var Rl;
function Sf() {
  return Rl || (Rl = 1, process.env.NODE_ENV === "production" ? Da.exports = Fh() : Da.exports = Dh()), Da.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var La, Ml;
function Lh() {
  if (Ml) return La;
  Ml = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, r = Object.prototype.propertyIsEnumerable;
  function n(o) {
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
      var c = Object.getOwnPropertyNames(i).map(function(d) {
        return i[d];
      });
      if (c.join("") !== "0123456789")
        return !1;
      var u = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(d) {
        u[d] = d;
      }), Object.keys(Object.assign({}, u)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return La = a() ? Object.assign : function(o, i) {
    for (var s, c = n(o), u, d = 1; d < arguments.length; d++) {
      s = Object(arguments[d]);
      for (var m in s)
        t.call(s, m) && (c[m] = s[m]);
      if (e) {
        u = e(s);
        for (var h = 0; h < u.length; h++)
          r.call(s, u[h]) && (c[u[h]] = s[u[h]]);
      }
    }
    return c;
  }, La;
}
var Wa, zl;
function Vi() {
  if (zl) return Wa;
  zl = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return Wa = e, Wa;
}
var Fl, Dl;
function Ef() {
  return Dl || (Dl = 1, Fl = Function.call.bind(Object.prototype.hasOwnProperty)), Fl;
}
var Ua, Ll;
function Wh() {
  if (Ll) return Ua;
  Ll = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ Vi(), r = {}, n = /* @__PURE__ */ Ef();
    e = function(o) {
      var i = "Warning: " + o;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function a(o, i, s, c, u) {
    if (process.env.NODE_ENV !== "production") {
      for (var d in o)
        if (n(o, d)) {
          var m;
          try {
            if (typeof o[d] != "function") {
              var h = Error(
                (c || "React class") + ": " + s + " type `" + d + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[d] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw h.name = "Invariant Violation", h;
            }
            m = o[d](i, d, c, s, null, t);
          } catch (O) {
            m = O;
          }
          if (m && !(m instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + d + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof m + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), m instanceof Error && !(m.message in r)) {
            r[m.message] = !0;
            var k = u ? u() : "";
            e(
              "Failed " + s + " type: " + m.message + (k ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (r = {});
  }, Ua = a, Ua;
}
var Ya, Wl;
function Uh() {
  if (Wl) return Ya;
  Wl = 1;
  var e = Sf(), t = Lh(), r = /* @__PURE__ */ Vi(), n = /* @__PURE__ */ Ef(), a = /* @__PURE__ */ Wh(), o = function() {
  };
  process.env.NODE_ENV !== "production" && (o = function(s) {
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
  return Ya = function(s, c) {
    var u = typeof Symbol == "function" && Symbol.iterator, d = "@@iterator";
    function m(g) {
      var f = g && (u && g[u] || g[d]);
      if (typeof f == "function")
        return f;
    }
    var h = "<<anonymous>>", k = {
      array: E("array"),
      bigint: E("bigint"),
      bool: E("boolean"),
      func: E("function"),
      number: E("number"),
      object: E("object"),
      string: E("string"),
      symbol: E("symbol"),
      any: N(),
      arrayOf: T,
      element: j(),
      elementType: p(),
      instanceOf: V,
      node: ne(),
      objectOf: oe,
      oneOf: J,
      oneOfType: me,
      shape: F,
      exact: be
    };
    function O(g, f) {
      return g === f ? g !== 0 || 1 / g === 1 / f : g !== g && f !== f;
    }
    function w(g, f) {
      this.message = g, this.data = f && typeof f == "object" ? f : {}, this.stack = "";
    }
    w.prototype = Error.prototype;
    function b(g) {
      if (process.env.NODE_ENV !== "production")
        var f = {}, x = 0;
      function A(C, _, $, R, M, z, Q) {
        if (R = R || h, z = z || $, Q !== r) {
          if (c) {
            var v = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw v.name = "Invariant Violation", v;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ye = R + ":" + $;
            !f[ye] && // Avoid spamming the console because they are often not actionable except for lib authors
            x < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + z + "` prop on `" + R + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), f[ye] = !0, x++);
          }
        }
        return _[$] == null ? C ? _[$] === null ? new w("The " + M + " `" + z + "` is marked as required " + ("in `" + R + "`, but its value is `null`.")) : new w("The " + M + " `" + z + "` is marked as required in " + ("`" + R + "`, but its value is `undefined`.")) : null : g(_, $, R, M, z);
      }
      var S = A.bind(null, !1);
      return S.isRequired = A.bind(null, !0), S;
    }
    function E(g) {
      function f(x, A, S, C, _, $) {
        var R = x[A], M = G(R);
        if (M !== g) {
          var z = U(R);
          return new w(
            "Invalid " + C + " `" + _ + "` of type " + ("`" + z + "` supplied to `" + S + "`, expected ") + ("`" + g + "`."),
            { expectedType: g }
          );
        }
        return null;
      }
      return b(f);
    }
    function N() {
      return b(i);
    }
    function T(g) {
      function f(x, A, S, C, _) {
        if (typeof g != "function")
          return new w("Property `" + _ + "` of component `" + S + "` has invalid PropType notation inside arrayOf.");
        var $ = x[A];
        if (!Array.isArray($)) {
          var R = G($);
          return new w("Invalid " + C + " `" + _ + "` of type " + ("`" + R + "` supplied to `" + S + "`, expected an array."));
        }
        for (var M = 0; M < $.length; M++) {
          var z = g($, M, S, C, _ + "[" + M + "]", r);
          if (z instanceof Error)
            return z;
        }
        return null;
      }
      return b(f);
    }
    function j() {
      function g(f, x, A, S, C) {
        var _ = f[x];
        if (!s(_)) {
          var $ = G(_);
          return new w("Invalid " + S + " `" + C + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return b(g);
    }
    function p() {
      function g(f, x, A, S, C) {
        var _ = f[x];
        if (!e.isValidElementType(_)) {
          var $ = G(_);
          return new w("Invalid " + S + " `" + C + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return b(g);
    }
    function V(g) {
      function f(x, A, S, C, _) {
        if (!(x[A] instanceof g)) {
          var $ = g.name || h, R = te(x[A]);
          return new w("Invalid " + C + " `" + _ + "` of type " + ("`" + R + "` supplied to `" + S + "`, expected ") + ("instance of `" + $ + "`."));
        }
        return null;
      }
      return b(f);
    }
    function J(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), i;
      function f(x, A, S, C, _) {
        for (var $ = x[A], R = 0; R < g.length; R++)
          if (O($, g[R]))
            return null;
        var M = JSON.stringify(g, function(z, Q) {
          var v = U(Q);
          return v === "symbol" ? String(Q) : Q;
        });
        return new w("Invalid " + C + " `" + _ + "` of value `" + String($) + "` " + ("supplied to `" + S + "`, expected one of " + M + "."));
      }
      return b(f);
    }
    function oe(g) {
      function f(x, A, S, C, _) {
        if (typeof g != "function")
          return new w("Property `" + _ + "` of component `" + S + "` has invalid PropType notation inside objectOf.");
        var $ = x[A], R = G($);
        if (R !== "object")
          return new w("Invalid " + C + " `" + _ + "` of type " + ("`" + R + "` supplied to `" + S + "`, expected an object."));
        for (var M in $)
          if (n($, M)) {
            var z = g($, M, S, C, _ + "." + M, r);
            if (z instanceof Error)
              return z;
          }
        return null;
      }
      return b(f);
    }
    function me(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var f = 0; f < g.length; f++) {
        var x = g[f];
        if (typeof x != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + Z(x) + " at index " + f + "."
          ), i;
      }
      function A(S, C, _, $, R) {
        for (var M = [], z = 0; z < g.length; z++) {
          var Q = g[z], v = Q(S, C, _, $, R, r);
          if (v == null)
            return null;
          v.data && n(v.data, "expectedType") && M.push(v.data.expectedType);
        }
        var ye = M.length > 0 ? ", expected one of type [" + M.join(", ") + "]" : "";
        return new w("Invalid " + $ + " `" + R + "` supplied to " + ("`" + _ + "`" + ye + "."));
      }
      return b(A);
    }
    function ne() {
      function g(f, x, A, S, C) {
        return ee(f[x]) ? null : new w("Invalid " + S + " `" + C + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return b(g);
    }
    function ge(g, f, x, A, S) {
      return new w(
        (g || "React class") + ": " + f + " type `" + x + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + S + "`."
      );
    }
    function F(g) {
      function f(x, A, S, C, _) {
        var $ = x[A], R = G($);
        if (R !== "object")
          return new w("Invalid " + C + " `" + _ + "` of type `" + R + "` " + ("supplied to `" + S + "`, expected `object`."));
        for (var M in g) {
          var z = g[M];
          if (typeof z != "function")
            return ge(S, C, _, M, U(z));
          var Q = z($, M, S, C, _ + "." + M, r);
          if (Q)
            return Q;
        }
        return null;
      }
      return b(f);
    }
    function be(g) {
      function f(x, A, S, C, _) {
        var $ = x[A], R = G($);
        if (R !== "object")
          return new w("Invalid " + C + " `" + _ + "` of type `" + R + "` " + ("supplied to `" + S + "`, expected `object`."));
        var M = t({}, x[A], g);
        for (var z in M) {
          var Q = g[z];
          if (n(g, z) && typeof Q != "function")
            return ge(S, C, _, z, U(Q));
          if (!Q)
            return new w(
              "Invalid " + C + " `" + _ + "` key `" + z + "` supplied to `" + S + "`.\nBad object: " + JSON.stringify(x[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(g), null, "  ")
            );
          var v = Q($, z, S, C, _ + "." + z, r);
          if (v)
            return v;
        }
        return null;
      }
      return b(f);
    }
    function ee(g) {
      switch (typeof g) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !g;
        case "object":
          if (Array.isArray(g))
            return g.every(ee);
          if (g === null || s(g))
            return !0;
          var f = m(g);
          if (f) {
            var x = f.call(g), A;
            if (f !== g.entries) {
              for (; !(A = x.next()).done; )
                if (!ee(A.value))
                  return !1;
            } else
              for (; !(A = x.next()).done; ) {
                var S = A.value;
                if (S && !ee(S[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function ce(g, f) {
      return g === "symbol" ? !0 : f ? f["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && f instanceof Symbol : !1;
    }
    function G(g) {
      var f = typeof g;
      return Array.isArray(g) ? "array" : g instanceof RegExp ? "object" : ce(f, g) ? "symbol" : f;
    }
    function U(g) {
      if (typeof g > "u" || g === null)
        return "" + g;
      var f = G(g);
      if (f === "object") {
        if (g instanceof Date)
          return "date";
        if (g instanceof RegExp)
          return "regexp";
      }
      return f;
    }
    function Z(g) {
      var f = U(g);
      switch (f) {
        case "array":
        case "object":
          return "an " + f;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + f;
        default:
          return f;
      }
    }
    function te(g) {
      return !g.constructor || !g.constructor.name ? h : g.constructor.name;
    }
    return k.checkPropTypes = a, k.resetWarningCache = a.resetWarningCache, k.PropTypes = k, k;
  }, Ya;
}
var Va, Ul;
function Yh() {
  if (Ul) return Va;
  Ul = 1;
  var e = /* @__PURE__ */ Vi();
  function t() {
  }
  function r() {
  }
  return r.resetWarningCache = t, Va = function() {
    function n(i, s, c, u, d, m) {
      if (m !== e) {
        var h = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw h.name = "Invariant Violation", h;
      }
    }
    n.isRequired = n;
    function a() {
      return n;
    }
    var o = {
      array: n,
      bigint: n,
      bool: n,
      func: n,
      number: n,
      object: n,
      string: n,
      symbol: n,
      any: n,
      arrayOf: a,
      element: n,
      elementType: n,
      instanceOf: a,
      node: n,
      objectOf: a,
      oneOf: a,
      oneOfType: a,
      shape: a,
      exact: a,
      checkPropTypes: r,
      resetWarningCache: t
    };
    return o.PropTypes = o, o;
  }, Va;
}
var Yl;
function Vh() {
  if (Yl) return Sn.exports;
  if (Yl = 1, process.env.NODE_ENV !== "production") {
    var e = Sf(), t = !0;
    Sn.exports = /* @__PURE__ */ Uh()(e.isElement, t);
  } else
    Sn.exports = /* @__PURE__ */ Yh()();
  return Sn.exports;
}
var Hh = /* @__PURE__ */ Vh();
const fe = /* @__PURE__ */ zh(Hh);
function Vl(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function Qe(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Vl(Object(r), !0).forEach(function(n) {
      dr(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : Vl(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function Gn(e) {
  "@babel/helpers - typeof";
  return Gn = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Gn(e);
}
function dr(e, t, r) {
  return t in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function qh(e, t) {
  if (e == null) return {};
  var r = {}, n = Object.keys(e), a, o;
  for (o = 0; o < n.length; o++)
    a = n[o], !(t.indexOf(a) >= 0) && (r[a] = e[a]);
  return r;
}
function Gh(e, t) {
  if (e == null) return {};
  var r = qh(e, t), n, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      n = o[a], !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n]);
  }
  return r;
}
function Lo(e) {
  return Bh(e) || Xh(e) || Kh(e) || Jh();
}
function Bh(e) {
  if (Array.isArray(e)) return Wo(e);
}
function Xh(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Kh(e, t) {
  if (e) {
    if (typeof e == "string") return Wo(e, t);
    var r = Object.prototype.toString.call(e).slice(8, -1);
    if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return Wo(e, t);
  }
}
function Wo(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
  return n;
}
function Jh() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Zh(e) {
  var t, r = e.beat, n = e.fade, a = e.beatFade, o = e.bounce, i = e.shake, s = e.flash, c = e.spin, u = e.spinPulse, d = e.spinReverse, m = e.pulse, h = e.fixedWidth, k = e.inverse, O = e.border, w = e.listItem, b = e.flip, E = e.size, N = e.rotation, T = e.pull, j = (t = {
    "fa-beat": r,
    "fa-fade": n,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": d,
    "fa-spin-pulse": u,
    "fa-pulse": m,
    "fa-fw": h,
    "fa-inverse": k,
    "fa-border": O,
    "fa-li": w,
    "fa-flip": b === !0,
    "fa-flip-horizontal": b === "horizontal" || b === "both",
    "fa-flip-vertical": b === "vertical" || b === "both"
  }, dr(t, "fa-".concat(E), typeof E < "u" && E !== null), dr(t, "fa-rotate-".concat(N), typeof N < "u" && N !== null && N !== 0), dr(t, "fa-pull-".concat(T), typeof T < "u" && T !== null), dr(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(j).map(function(p) {
    return j[p] ? p : null;
  }).filter(function(p) {
    return p;
  });
}
function Qh(e) {
  return e = e - 0, e === e;
}
function Af(e) {
  return Qh(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, r) {
    return r ? r.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var eb = ["style"];
function tb(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function rb(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, r) {
    var n = r.indexOf(":"), a = Af(r.slice(0, n)), o = r.slice(n + 1).trim();
    return a.startsWith("webkit") ? t[tb(a)] = o : t[a] = o, t;
  }, {});
}
function Pf(e, t) {
  var r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var n = (t.children || []).map(function(c) {
    return Pf(e, c);
  }), a = Object.keys(t.attributes || {}).reduce(function(c, u) {
    var d = t.attributes[u];
    switch (u) {
      case "class":
        c.attrs.className = d, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = rb(d);
        break;
      default:
        u.indexOf("aria-") === 0 || u.indexOf("data-") === 0 ? c.attrs[u.toLowerCase()] = d : c.attrs[Af(u)] = d;
    }
    return c;
  }, {
    attrs: {}
  }), o = r.style, i = o === void 0 ? {} : o, s = Gh(r, eb);
  return a.attrs.style = Qe(Qe({}, a.attrs.style), i), e.apply(void 0, [t.tag, Qe(Qe({}, a.attrs), s)].concat(Lo(n)));
}
var Cf = !1;
try {
  Cf = process.env.NODE_ENV === "production";
} catch {
}
function nb() {
  if (!Cf && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Hl(e) {
  if (e && Gn(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Do.icon)
    return Do.icon(e);
  if (e === null)
    return null;
  if (e && Gn(e) === "object" && e.prefix && e.iconName)
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
function Ha(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? dr({}, e, t) : {};
}
var ql = {
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
}, Ge = /* @__PURE__ */ Me.forwardRef(function(e, t) {
  var r = Qe(Qe({}, ql), e), n = r.icon, a = r.mask, o = r.symbol, i = r.className, s = r.title, c = r.titleId, u = r.maskId, d = Hl(n), m = Ha("classes", [].concat(Lo(Zh(r)), Lo((i || "").split(" ")))), h = Ha("transform", typeof r.transform == "string" ? Do.transform(r.transform) : r.transform), k = Ha("mask", Hl(a)), O = Mh(d, Qe(Qe(Qe(Qe({}, m), h), k), {}, {
    symbol: o,
    title: s,
    titleId: c,
    maskId: u
  }));
  if (!O)
    return nb("Could not find icon", d), null;
  var w = O.abstract, b = {
    ref: t
  };
  return Object.keys(r).forEach(function(E) {
    ql.hasOwnProperty(E) || (b[E] = r[E]);
  }), ab(w[0], b);
});
Ge.displayName = "FontAwesomeIcon";
Ge.propTypes = {
  beat: fe.bool,
  border: fe.bool,
  beatFade: fe.bool,
  bounce: fe.bool,
  className: fe.string,
  fade: fe.bool,
  flash: fe.bool,
  mask: fe.oneOfType([fe.object, fe.array, fe.string]),
  maskId: fe.string,
  fixedWidth: fe.bool,
  inverse: fe.bool,
  flip: fe.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: fe.oneOfType([fe.object, fe.array, fe.string]),
  listItem: fe.bool,
  pull: fe.oneOf(["right", "left"]),
  pulse: fe.bool,
  rotation: fe.oneOf([0, 90, 180, 270]),
  shake: fe.bool,
  size: fe.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: fe.bool,
  spinPulse: fe.bool,
  spinReverse: fe.bool,
  symbol: fe.oneOfType([fe.bool, fe.string]),
  title: fe.string,
  titleId: fe.string,
  transform: fe.oneOfType([fe.string, fe.object]),
  swapOpacity: fe.bool
};
var ab = Pf.bind(null, Me.createElement);
const Hi = "-", ob = (e) => {
  const t = sb(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (a) => {
      const o = a.split(Hi);
      return o[0] === "" && o.length !== 1 && o.shift(), $f(o, t) || ib(a);
    },
    getConflictingClassGroupIds: (a, o) => {
      const i = r[a] || [];
      return o && n[a] ? [...i, ...n[a]] : i;
    }
  };
}, $f = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], a = t.nextPart.get(n), o = a ? $f(e.slice(1), a) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const i = e.join(Hi);
  return (r = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : r.classGroupId;
}, Gl = /^\[(.+)\]$/, ib = (e) => {
  if (Gl.test(e)) {
    const t = Gl.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, sb = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return cb(Object.entries(e.classGroups), r).forEach(([a, o]) => {
    Uo(o, n, a, t);
  }), n;
}, Uo = (e, t, r, n) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : Bl(t, a);
      o.classGroupId = r;
      return;
    }
    if (typeof a == "function") {
      if (lb(a)) {
        Uo(a(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: r
      });
      return;
    }
    Object.entries(a).forEach(([o, i]) => {
      Uo(i, Bl(t, o), r, n);
    });
  });
}, Bl = (e, t) => {
  let r = e;
  return t.split(Hi).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, lb = (e) => e.isThemeGetter, cb = (e, t) => t ? e.map(([r, n]) => {
  const a = n.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([i, s]) => [t + i, s])) : o);
  return [r, a];
}) : e, ub = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const a = (o, i) => {
    r.set(o, i), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(o) {
      let i = r.get(o);
      if (i !== void 0)
        return i;
      if ((i = n.get(o)) !== void 0)
        return a(o, i), i;
    },
    set(o, i) {
      r.has(o) ? r.set(o, i) : a(o, i);
    }
  };
}, Nf = "!", fb = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, a = t[0], o = t.length, i = (s) => {
    const c = [];
    let u = 0, d = 0, m;
    for (let b = 0; b < s.length; b++) {
      let E = s[b];
      if (u === 0) {
        if (E === a && (n || s.slice(b, b + o) === t)) {
          c.push(s.slice(d, b)), d = b + o;
          continue;
        }
        if (E === "/") {
          m = b;
          continue;
        }
      }
      E === "[" ? u++ : E === "]" && u--;
    }
    const h = c.length === 0 ? s : s.substring(d), k = h.startsWith(Nf), O = k ? h.substring(1) : h, w = m && m > d ? m - d : void 0;
    return {
      modifiers: c,
      hasImportantModifier: k,
      baseClassName: O,
      maybePostfixModifierPosition: w
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, db = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, pb = (e) => ({
  cache: ub(e.cacheSize),
  parseClassName: fb(e),
  ...ob(e)
}), mb = /\s+/, gb = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: a
  } = t, o = [], i = e.trim().split(mb);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const u = i[c], {
      modifiers: d,
      hasImportantModifier: m,
      baseClassName: h,
      maybePostfixModifierPosition: k
    } = r(u);
    let O = !!k, w = n(O ? h.substring(0, k) : h);
    if (!w) {
      if (!O) {
        s = u + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (w = n(h), !w) {
        s = u + (s.length > 0 ? " " + s : s);
        continue;
      }
      O = !1;
    }
    const b = db(d).join(":"), E = m ? b + Nf : b, N = E + w;
    if (o.includes(N))
      continue;
    o.push(N);
    const T = a(w, O);
    for (let j = 0; j < T.length; ++j) {
      const p = T[j];
      o.push(E + p);
    }
    s = u + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function hb() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = _f(t)) && (n && (n += " "), n += r);
  return n;
}
const _f = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = _f(e[n])) && (r && (r += " "), r += t);
  return r;
};
function bb(e, ...t) {
  let r, n, a, o = i;
  function i(c) {
    const u = t.reduce((d, m) => m(d), e());
    return r = pb(u), n = r.cache.get, a = r.cache.set, o = s, s(c);
  }
  function s(c) {
    const u = n(c);
    if (u)
      return u;
    const d = gb(c, r);
    return a(c, d), d;
  }
  return function() {
    return o(hb.apply(null, arguments));
  };
}
const Ae = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, Tf = /^\[(?:([a-z-]+):)?(.+)\]$/i, yb = /^\d+\/\d+$/, vb = /* @__PURE__ */ new Set(["px", "full", "screen"]), xb = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, wb = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, kb = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Ob = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Sb = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, lt = (e) => yr(e) || vb.has(e) || yb.test(e), Ot = (e) => Pr(e, "length", Tb), yr = (e) => !!e && !Number.isNaN(Number(e)), qa = (e) => Pr(e, "number", yr), Rr = (e) => !!e && Number.isInteger(Number(e)), Eb = (e) => e.endsWith("%") && yr(e.slice(0, -1)), ie = (e) => Tf.test(e), St = (e) => xb.test(e), Ab = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Pb = (e) => Pr(e, Ab, jf), Cb = (e) => Pr(e, "position", jf), $b = /* @__PURE__ */ new Set(["image", "url"]), Nb = (e) => Pr(e, $b, Ib), _b = (e) => Pr(e, "", jb), Mr = () => !0, Pr = (e, t, r) => {
  const n = Tf.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, Tb = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  wb.test(e) && !kb.test(e)
), jf = () => !1, jb = (e) => Ob.test(e), Ib = (e) => Sb.test(e), Rb = () => {
  const e = Ae("colors"), t = Ae("spacing"), r = Ae("blur"), n = Ae("brightness"), a = Ae("borderColor"), o = Ae("borderRadius"), i = Ae("borderSpacing"), s = Ae("borderWidth"), c = Ae("contrast"), u = Ae("grayscale"), d = Ae("hueRotate"), m = Ae("invert"), h = Ae("gap"), k = Ae("gradientColorStops"), O = Ae("gradientColorStopPositions"), w = Ae("inset"), b = Ae("margin"), E = Ae("opacity"), N = Ae("padding"), T = Ae("saturate"), j = Ae("scale"), p = Ae("sepia"), V = Ae("skew"), J = Ae("space"), oe = Ae("translate"), me = () => ["auto", "contain", "none"], ne = () => ["auto", "hidden", "clip", "visible", "scroll"], ge = () => ["auto", ie, t], F = () => [ie, t], be = () => ["", lt, Ot], ee = () => ["auto", yr, ie], ce = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], G = () => ["solid", "dashed", "dotted", "double", "none"], U = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], Z = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], te = () => ["", "0", ie], g = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], f = () => [yr, ie];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Mr],
      spacing: [lt, Ot],
      blur: ["none", "", St, ie],
      brightness: f(),
      borderColor: [e],
      borderRadius: ["none", "", "full", St, ie],
      borderSpacing: F(),
      borderWidth: be(),
      contrast: f(),
      grayscale: te(),
      hueRotate: f(),
      invert: te(),
      gap: F(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Eb, Ot],
      inset: ge(),
      margin: ge(),
      opacity: f(),
      padding: F(),
      saturate: f(),
      scale: f(),
      sepia: te(),
      skew: f(),
      space: F(),
      translate: F()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", ie]
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
        columns: [St]
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
        object: [...ce(), ie]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: ne()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": ne()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": ne()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: me()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": me()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": me()
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
        inset: [w]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [w]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [w]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [w]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [w]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [w]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [w]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [w]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [w]
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
        z: ["auto", Rr, ie]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ge()
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
        flex: ["1", "auto", "initial", "none", ie]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: te()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: te()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Rr, ie]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Mr]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Rr, ie]
        }, ie]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": ee()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": ee()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Mr]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Rr, ie]
        }, ie]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": ee()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": ee()
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
        "auto-cols": ["auto", "min", "max", "fr", ie]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", ie]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [h]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [h]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [h]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...Z()]
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
        content: ["normal", ...Z(), "baseline"]
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
        "place-content": [...Z(), "baseline"]
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
        p: [N]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [N]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [N]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [N]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [N]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [N]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [N]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [N]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [N]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [b]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [b]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [b]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [b]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [b]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [b]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [b]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [b]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [b]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [J]
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
        "space-y": [J]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", ie, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [ie, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [ie, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [St]
        }, St]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [ie, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [ie, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [ie, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [ie, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", St, Ot]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", qa]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Mr]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", ie]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", yr, qa]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", lt, ie]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", ie]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", ie]
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
        "placeholder-opacity": [E]
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
        "text-opacity": [E]
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
        decoration: [...G(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", lt, Ot]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", lt, ie]
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
        indent: F()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", ie]
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
        content: ["none", ie]
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
        "bg-opacity": [E]
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
        bg: [...ce(), Cb]
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
        bg: ["auto", "cover", "contain", Pb]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, Nb]
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
        from: [O]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [O]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [O]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [k]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [k]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [k]
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
        "border-opacity": [E]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...G(), "hidden"]
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
        "divide-opacity": [E]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: G()
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
        outline: ["", ...G()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [lt, ie]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [lt, Ot]
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
        ring: be()
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
        "ring-opacity": [E]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [lt, Ot]
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
        shadow: ["", "inner", "none", St, _b]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Mr]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [E]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...U(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": U()
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
        "drop-shadow": ["", "none", St, ie]
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
        "hue-rotate": [d]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [m]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [T]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [p]
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
        "backdrop-grayscale": [u]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [d]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [m]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [E]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [T]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [p]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", ie]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: f()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", ie]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: f()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", ie]
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
        scale: [j]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [j]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [j]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [Rr, ie]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [oe]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [oe]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [V]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [V]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", ie]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", ie]
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
        "scroll-m": F()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": F()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": F()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": F()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": F()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": F()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": F()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": F()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": F()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": F()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": F()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": F()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": F()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": F()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": F()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": F()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": F()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": F()
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
        "will-change": ["auto", "scroll", "contents", "transform", ie]
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
        stroke: [lt, Ot, qa]
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
}, Xl = /* @__PURE__ */ bb(Rb);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const sr = {
  prefix: "fas",
  iconName: "spinner-third",
  icon: [512, 512, [], "f3f4", "M224 32c0-17.7 14.3-32 32-32C397.4 0 512 114.6 512 256c0 46.6-12.5 90.4-34.3 128c-8.8 15.3-28.4 20.5-43.7 11.7s-20.5-28.4-11.7-43.7c16.3-28.2 25.7-61 25.7-96c0-106-86-192-192-192c-17.7 0-32-14.3-32-32z"]
}, cr = ({
  icon: e,
  iconClassName: t,
  children: r,
  className: n,
  htmlFor: a,
  variant: o = "primary",
  disabled: i,
  iconFlip: s = !1,
  loading: c,
  as: u = "button",
  href: d,
  target: m,
  ...h
}) => {
  function k(b) {
    switch (b) {
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
  const O = Xl(
    i || c ? "opacity-50 pointer-events-none" : ""
  ), w = Xl(
    "w-fit text-sm font-medium rounded-lg px-3 py-2 border border-transparent shadow-sm focus-visible:outline focus-visible:outline-0 focus-visible:outline-offset-0 transition-all duration-150 flex gap-2 items-center justify-center active:scale-95 transform",
    k(o),
    n,
    O
  );
  return a ? /* @__PURE__ */ $e("label", { className: w, htmlFor: a, style: h.style, children: [
    c && !s ? /* @__PURE__ */ q(Ge, { icon: sr, className: "animate-spin" }) : /* @__PURE__ */ q(_t, { children: e && !s ? /* @__PURE__ */ q(Ge, { icon: e, className: t }) : null }),
    r,
    c && s ? /* @__PURE__ */ q(Ge, { icon: sr, className: "animate-spin" }) : /* @__PURE__ */ q(_t, { children: e && s ? /* @__PURE__ */ q(Ge, { icon: e, className: t }) : null })
  ] }) : u === "link" && d ? /* @__PURE__ */ $e(
    "a",
    {
      href: d,
      className: w,
      style: h.style,
      ...h,
      target: m,
      children: [
        c && !s ? /* @__PURE__ */ q(Ge, { icon: sr, className: "animate-spin" }) : /* @__PURE__ */ q(_t, { children: e && !s ? /* @__PURE__ */ q(Ge, { icon: e, className: t }) : null }),
        r,
        c && s ? /* @__PURE__ */ q(Ge, { icon: sr, className: "animate-spin" }) : /* @__PURE__ */ q(_t, { children: e && s ? /* @__PURE__ */ q(Ge, { icon: e, className: t }) : null })
      ]
    }
  ) : /* @__PURE__ */ $e(
    "button",
    {
      className: w,
      disabled: i || c,
      ...h,
      htmlFor: a,
      children: [
        c && !s ? /* @__PURE__ */ q(Ge, { icon: sr, className: "animate-spin" }) : /* @__PURE__ */ q(_t, { children: e && !s ? /* @__PURE__ */ q(Ge, { icon: e, className: t }) : null }),
        r,
        c && s ? /* @__PURE__ */ q(Ge, { icon: sr, className: "animate-spin" }) : /* @__PURE__ */ q(_t, { children: e && s ? /* @__PURE__ */ q(Ge, { icon: e, className: t }) : null })
      ]
    }
  );
};
var Fn = /* @__PURE__ */ ((e) => (e[e.ALL = 0] = "ALL", e[e.FEATURED = 1] = "FEATURED", e[e.MINE = 2] = "MINE", e[e.BOOKMARKED = 3] = "BOOKMARKED", e))(Fn || {});
Fn.FEATURED, Fn.MINE, Fn.BOOKMARKED;
var Mb = Object.defineProperty, zb = (e, t, r) => t in e ? Mb(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r, Ga = (e, t, r) => (zb(e, typeof t != "symbol" ? t + "" : t, r), r);
let Fb = class {
  constructor() {
    Ga(this, "current", this.detect()), Ga(this, "handoffState", "pending"), Ga(this, "currentId", 0);
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
}, Dn = new Fb();
function Db(e) {
  typeof queueMicrotask == "function" ? queueMicrotask(e) : Promise.resolve().then(e).catch((t) => setTimeout(() => {
    throw t;
  }));
}
function sa() {
  let e = [], t = { addEventListener(r, n, a, o) {
    return r.addEventListener(n, a, o), t.add(() => r.removeEventListener(n, a, o));
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
    return Db(() => {
      n.current && r[0]();
    }), t.add(() => {
      n.current = !1;
    });
  }, style(r, n, a) {
    let o = r.style.getPropertyValue(n);
    return Object.assign(r.style, { [n]: a }), this.add(() => {
      Object.assign(r.style, { [n]: o });
    });
  }, group(r) {
    let n = sa();
    return r(n), this.add(() => n.dispose());
  }, add(r) {
    return e.includes(r) || e.push(r), () => {
      let n = e.indexOf(r);
      if (n >= 0) for (let a of e.splice(n, 1)) a();
    };
  }, dispose() {
    for (let r of e.splice(0)) r();
  } };
  return t;
}
function If() {
  let [e] = He(sa);
  return It(() => () => e.dispose(), [e]), e;
}
let jt = (e, t) => {
  Dn.isServer ? It(e, t) : _m(e, t);
};
function Rf(e) {
  let t = qe(e);
  return jt(() => {
    t.current = e;
  }, [e]), t;
}
let ft = function(e) {
  let t = Rf(e);
  return Me.useCallback((...r) => t.current(...r), [t]);
};
function Yo(...e) {
  return Array.from(new Set(e.flatMap((t) => typeof t == "string" ? t.split(" ") : []))).filter(Boolean).join(" ");
}
function la(e, t, ...r) {
  if (e in t) {
    let a = t[e];
    return typeof a == "function" ? a(...r) : a;
  }
  let n = new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map((a) => `"${a}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(n, la), n;
}
var Mf = ((e) => (e[e.None = 0] = "None", e[e.RenderStrategy = 1] = "RenderStrategy", e[e.Static = 2] = "Static", e))(Mf || {}), Tt = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(Tt || {});
function zf() {
  let e = Wb();
  return qt((t) => Lb({ mergeRefs: e, ...t }), [e]);
}
function Lb({ ourProps: e, theirProps: t, slot: r, defaultTag: n, features: a, visible: o = !0, name: i, mergeRefs: s }) {
  s = s ?? Ub;
  let c = Ff(t, e);
  if (o) return En(c, r, n, i, s);
  let u = a ?? 0;
  if (u & 2) {
    let { static: d = !1, ...m } = c;
    if (d) return En(m, r, n, i, s);
  }
  if (u & 1) {
    let { unmount: d = !0, ...m } = c;
    return la(d ? 0 : 1, { 0() {
      return null;
    }, 1() {
      return En({ ...m, hidden: !0, style: { display: "none" } }, r, n, i, s);
    } });
  }
  return En(c, r, n, i, s);
}
function En(e, t = {}, r, n, a) {
  let { as: o = r, children: i, refName: s = "ref", ...c } = Ba(e, ["unmount", "static"]), u = e.ref !== void 0 ? { [s]: e.ref } : {}, d = typeof i == "function" ? i(t) : i;
  "className" in c && c.className && typeof c.className == "function" && (c.className = c.className(t)), c["aria-labelledby"] && c["aria-labelledby"] === c.id && (c["aria-labelledby"] = void 0);
  let m = {};
  if (t) {
    let h = !1, k = [];
    for (let [O, w] of Object.entries(t)) typeof w == "boolean" && (h = !0), w === !0 && k.push(O.replace(/([A-Z])/g, (b) => `-${b.toLowerCase()}`));
    if (h) {
      m["data-headlessui-state"] = k.join(" ");
      for (let O of k) m[`data-${O}`] = "";
    }
  }
  if (o === Jt && (Object.keys(Ht(c)).length > 0 || Object.keys(Ht(m)).length > 0)) if (!jm(d) || Array.isArray(d) && d.length > 1) {
    if (Object.keys(Ht(c)).length > 0) throw new Error(['Passing props on "Fragment"!', "", `The current component <${n} /> is rendering a "Fragment".`, "However we need to passthrough the following props:", Object.keys(Ht(c)).concat(Object.keys(Ht(m))).map((h) => `  - ${h}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".', "Render a single element as the child so that we can forward the props onto that element."].map((h) => `  - ${h}`).join(`
`)].join(`
`));
  } else {
    let h = d.props, k = h == null ? void 0 : h.className, O = typeof k == "function" ? (...E) => Yo(k(...E), c.className) : Yo(k, c.className), w = O ? { className: O } : {}, b = Ff(d.props, Ht(Ba(c, ["ref"])));
    for (let E in m) E in b && delete m[E];
    return Im(d, Object.assign({}, b, m, u, { ref: a(Yb(d), u.ref) }, w));
  }
  return Rm(o, Object.assign({}, Ba(c, ["ref"]), o !== Jt && u, o !== Jt && m), d);
}
function Wb() {
  let e = qe([]), t = qt((r) => {
    for (let n of e.current) n != null && (typeof n == "function" ? n(r) : n.current = r);
  }, []);
  return (...r) => {
    if (!r.every((n) => n == null)) return e.current = r, t;
  };
}
function Ub(...e) {
  return e.every((t) => t == null) ? void 0 : (t) => {
    for (let r of e) r != null && (typeof r == "function" ? r(t) : r.current = t);
  };
}
function Ff(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let t = {}, r = {};
  for (let n of e) for (let a in n) a.startsWith("on") && typeof n[a] == "function" ? (r[a] != null || (r[a] = []), r[a].push(n[a])) : t[a] = n[a];
  if (t.disabled || t["aria-disabled"]) for (let n in r) /^(on(?:Click|Pointer|Mouse|Key)(?:Down|Up|Press)?)$/.test(n) && (r[n] = [(a) => {
    var o;
    return (o = a == null ? void 0 : a.preventDefault) == null ? void 0 : o.call(a);
  }]);
  for (let n in r) Object.assign(t, { [n](a, ...o) {
    let i = r[n];
    for (let s of i) {
      if ((a instanceof Event || (a == null ? void 0 : a.nativeEvent) instanceof Event) && a.defaultPrevented) return;
      s(a, ...o);
    }
  } });
  return t;
}
function qi(e) {
  var t;
  return Object.assign(Tm(e), { displayName: (t = e.displayName) != null ? t : e.name });
}
function Ht(e) {
  let t = Object.assign({}, e);
  for (let r in t) t[r] === void 0 && delete t[r];
  return t;
}
function Ba(e, t = []) {
  let r = Object.assign({}, e);
  for (let n of t) n in r && delete r[n];
  return r;
}
function Yb(e) {
  return Me.version.split(".")[0] >= "19" ? e.props.ref : e.ref;
}
let Vb = Symbol();
function Df(...e) {
  let t = qe(e);
  It(() => {
    t.current = e;
  }, [e]);
  let r = ft((n) => {
    for (let a of t.current) a != null && (typeof a == "function" ? a(n) : a.current = n);
  });
  return e.every((n) => n == null || (n == null ? void 0 : n[Vb])) ? void 0 : r;
}
function Hb(e = 0) {
  let [t, r] = He(e), n = qt((c) => r(c), [t]), a = qt((c) => r((u) => u | c), [t]), o = qt((c) => (t & c) === c, [t]), i = qt((c) => r((u) => u & ~c), [r]), s = qt((c) => r((u) => u ^ c), [r]);
  return { flags: t, setFlag: n, addFlag: a, hasFlag: o, removeFlag: i, toggleFlag: s };
}
var Kl, Jl;
typeof process < "u" && typeof globalThis < "u" && typeof Element < "u" && ((Kl = process == null ? void 0 : process.env) == null ? void 0 : Kl.NODE_ENV) === "test" && typeof ((Jl = Element == null ? void 0 : Element.prototype) == null ? void 0 : Jl.getAnimations) > "u" && (Element.prototype.getAnimations = function() {
  return console.warn(["Headless UI has polyfilled `Element.prototype.getAnimations` for your tests.", "Please install a proper polyfill e.g. `jsdom-testing-mocks`, to silence these warnings.", "", "Example usage:", "```js", "import { mockAnimationsApi } from 'jsdom-testing-mocks'", "mockAnimationsApi()", "```"].join(`
`)), [];
});
var qb = ((e) => (e[e.None = 0] = "None", e[e.Closed = 1] = "Closed", e[e.Enter = 2] = "Enter", e[e.Leave = 4] = "Leave", e))(qb || {});
function Gb(e) {
  let t = {};
  for (let r in e) e[r] === !0 && (t[`data-${r}`] = "");
  return t;
}
function Bb(e, t, r, n) {
  let [a, o] = He(r), { hasFlag: i, addFlag: s, removeFlag: c } = Hb(e && a ? 3 : 0), u = qe(!1), d = qe(!1), m = If();
  return jt(() => {
    var h;
    if (e) {
      if (r && o(!0), !t) {
        r && s(3);
        return;
      }
      return (h = n == null ? void 0 : n.start) == null || h.call(n, r), Xb(t, { inFlight: u, prepare() {
        d.current ? d.current = !1 : d.current = u.current, u.current = !0, !d.current && (r ? (s(3), c(4)) : (s(4), c(2)));
      }, run() {
        d.current ? r ? (c(3), s(4)) : (c(4), s(3)) : r ? c(1) : s(1);
      }, done() {
        var k;
        d.current && typeof t.getAnimations == "function" && t.getAnimations().length > 0 || (u.current = !1, c(7), r || o(!1), (k = n == null ? void 0 : n.end) == null || k.call(n, r));
      } });
    }
  }, [e, r, t, m]), e ? [a, { closed: i(1), enter: i(2), leave: i(4), transition: i(2) || i(4) }] : [r, { closed: void 0, enter: void 0, leave: void 0, transition: void 0 }];
}
function Xb(e, { prepare: t, run: r, done: n, inFlight: a }) {
  let o = sa();
  return Jb(e, { prepare: t, inFlight: a }), o.nextFrame(() => {
    r(), o.requestAnimationFrame(() => {
      o.add(Kb(e, n));
    });
  }), o.dispose;
}
function Kb(e, t) {
  var r, n;
  let a = sa();
  if (!e) return a.dispose;
  let o = !1;
  a.add(() => {
    o = !0;
  });
  let i = (n = (r = e.getAnimations) == null ? void 0 : r.call(e).filter((s) => s instanceof CSSTransition)) != null ? n : [];
  return i.length === 0 ? (t(), a.dispose) : (Promise.allSettled(i.map((s) => s.finished)).then(() => {
    o || t();
  }), a.dispose);
}
function Jb(e, { inFlight: t, prepare: r }) {
  if (t != null && t.current) {
    r();
    return;
  }
  let n = e.style.transition;
  e.style.transition = "none", r(), e.offsetHeight, e.style.transition = n;
}
let Gi = Ti(null);
Gi.displayName = "OpenClosedContext";
var Bt = ((e) => (e[e.Open = 1] = "Open", e[e.Closed = 2] = "Closed", e[e.Closing = 4] = "Closing", e[e.Opening = 8] = "Opening", e))(Bt || {});
function Lf() {
  return ta(Gi);
}
function Zb({ value: e, children: t }) {
  return Me.createElement(Gi.Provider, { value: e }, t);
}
function Qb(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
function ey() {
  let e = typeof document > "u";
  return "useSyncExternalStore" in qr ? ((t) => t.useSyncExternalStore)(qr)(() => () => {
  }, () => !1, () => !e) : !1;
}
function Wf() {
  let e = ey(), [t, r] = qr.useState(Dn.isHandoffComplete);
  return t && Dn.isHandoffComplete === !1 && r(!1), qr.useEffect(() => {
    t !== !0 && r(!0);
  }, [t]), qr.useEffect(() => Dn.handoff(), []), e ? !1 : t;
}
function ty() {
  let e = qe(!1);
  return jt(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
}
function Uf(e) {
  var t;
  return !!(e.enter || e.enterFrom || e.enterTo || e.leave || e.leaveFrom || e.leaveTo) || ((t = e.as) != null ? t : Vf) !== Jt || Me.Children.count(e.children) === 1;
}
let ca = Ti(null);
ca.displayName = "TransitionContext";
var ry = ((e) => (e.Visible = "visible", e.Hidden = "hidden", e))(ry || {});
function ny() {
  let e = ta(ca);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
function ay() {
  let e = ta(ua);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
let ua = Ti(null);
ua.displayName = "NestingContext";
function fa(e) {
  return "children" in e ? fa(e.children) : e.current.filter(({ el: t }) => t.current !== null).filter(({ state: t }) => t === "visible").length > 0;
}
function Yf(e, t) {
  let r = Rf(e), n = qe([]), a = ty(), o = If(), i = ft((k, O = Tt.Hidden) => {
    let w = n.current.findIndex(({ el: b }) => b === k);
    w !== -1 && (la(O, { [Tt.Unmount]() {
      n.current.splice(w, 1);
    }, [Tt.Hidden]() {
      n.current[w].state = "hidden";
    } }), o.microTask(() => {
      var b;
      !fa(n) && a.current && ((b = r.current) == null || b.call(r));
    }));
  }), s = ft((k) => {
    let O = n.current.find(({ el: w }) => w === k);
    return O ? O.state !== "visible" && (O.state = "visible") : n.current.push({ el: k, state: "visible" }), () => i(k, Tt.Unmount);
  }), c = qe([]), u = qe(Promise.resolve()), d = qe({ enter: [], leave: [] }), m = ft((k, O, w) => {
    c.current.splice(0), t && (t.chains.current[O] = t.chains.current[O].filter(([b]) => b !== k)), t == null || t.chains.current[O].push([k, new Promise((b) => {
      c.current.push(b);
    })]), t == null || t.chains.current[O].push([k, new Promise((b) => {
      Promise.all(d.current[O].map(([E, N]) => N)).then(() => b());
    })]), O === "enter" ? u.current = u.current.then(() => t == null ? void 0 : t.wait.current).then(() => w(O)) : w(O);
  }), h = ft((k, O, w) => {
    Promise.all(d.current[O].splice(0).map(([b, E]) => E)).then(() => {
      var b;
      (b = c.current.shift()) == null || b();
    }).then(() => w(O));
  });
  return Uu(() => ({ children: n, register: s, unregister: i, onStart: m, onStop: h, wait: u, chains: d }), [s, i, n, m, h, d, u]);
}
let Vf = Jt, Hf = Mf.RenderStrategy;
function oy(e, t) {
  var r, n;
  let { transition: a = !0, beforeEnter: o, afterEnter: i, beforeLeave: s, afterLeave: c, enter: u, enterFrom: d, enterTo: m, entered: h, leave: k, leaveFrom: O, leaveTo: w, ...b } = e, [E, N] = He(null), T = qe(null), j = Uf(e), p = Df(...j ? [T, t, N] : t === null ? [] : [t]), V = (r = b.unmount) == null || r ? Tt.Unmount : Tt.Hidden, { show: J, appear: oe, initial: me } = ny(), [ne, ge] = He(J ? "visible" : "hidden"), F = ay(), { register: be, unregister: ee } = F;
  jt(() => be(T), [be, T]), jt(() => {
    if (V === Tt.Hidden && T.current) {
      if (J && ne !== "visible") {
        ge("visible");
        return;
      }
      return la(ne, { hidden: () => ee(T), visible: () => be(T) });
    }
  }, [ne, T, be, ee, J, V]);
  let ce = Wf();
  jt(() => {
    if (j && ce && ne === "visible" && T.current === null) throw new Error("Did you forget to passthrough the `ref` to the actual DOM node?");
  }, [T, ne, ce, j]);
  let G = me && !oe, U = oe && J && me, Z = qe(!1), te = Yf(() => {
    Z.current || (ge("hidden"), ee(T));
  }, F), g = ft(($) => {
    Z.current = !0;
    let R = $ ? "enter" : "leave";
    te.onStart(T, R, (M) => {
      M === "enter" ? o == null || o() : M === "leave" && (s == null || s());
    });
  }), f = ft(($) => {
    let R = $ ? "enter" : "leave";
    Z.current = !1, te.onStop(T, R, (M) => {
      M === "enter" ? i == null || i() : M === "leave" && (c == null || c());
    }), R === "leave" && !fa(te) && (ge("hidden"), ee(T));
  });
  It(() => {
    j && a || (g(J), f(J));
  }, [J, j, a]);
  let x = !(!a || !j || !ce || G), [, A] = Bb(x, E, J, { start: g, end: f }), S = Ht({ ref: p, className: ((n = Yo(b.className, U && u, U && d, A.enter && u, A.enter && A.closed && d, A.enter && !A.closed && m, A.leave && k, A.leave && !A.closed && O, A.leave && A.closed && w, !A.transition && J && h)) == null ? void 0 : n.trim()) || void 0, ...Gb(A) }), C = 0;
  ne === "visible" && (C |= Bt.Open), ne === "hidden" && (C |= Bt.Closed), J && ne === "hidden" && (C |= Bt.Opening), !J && ne === "visible" && (C |= Bt.Closing);
  let _ = zf();
  return Me.createElement(ua.Provider, { value: te }, Me.createElement(Zb, { value: C }, _({ ourProps: S, theirProps: b, defaultTag: Vf, features: Hf, visible: ne === "visible", name: "Transition.Child" })));
}
function iy(e, t) {
  let { show: r, appear: n = !1, unmount: a = !0, ...o } = e, i = qe(null), s = Uf(e), c = Df(...s ? [i, t] : t === null ? [] : [t]);
  Wf();
  let u = Lf();
  if (r === void 0 && u !== null && (r = (u & Bt.Open) === Bt.Open), r === void 0) throw new Error("A <Transition /> is used but it is missing a `show={true | false}` prop.");
  let [d, m] = He(r ? "visible" : "hidden"), h = Yf(() => {
    r || m("hidden");
  }), [k, O] = He(!0), w = qe([r]);
  jt(() => {
    k !== !1 && w.current[w.current.length - 1] !== r && (w.current.push(r), O(!1));
  }, [w, r]);
  let b = Uu(() => ({ show: r, appear: n, initial: k }), [r, n, k]);
  jt(() => {
    r ? m("visible") : !fa(h) && i.current !== null && m("hidden");
  }, [r, h]);
  let E = { unmount: a }, N = ft(() => {
    var p;
    k && O(!1), (p = e.beforeEnter) == null || p.call(e);
  }), T = ft(() => {
    var p;
    k && O(!1), (p = e.beforeLeave) == null || p.call(e);
  }), j = zf();
  return Me.createElement(ua.Provider, { value: h }, Me.createElement(ca.Provider, { value: b }, j({ ourProps: { ...E, as: Jt, children: Me.createElement(qf, { ref: c, ...E, ...o, beforeEnter: N, beforeLeave: T }) }, theirProps: {}, defaultTag: Jt, features: Hf, visible: d === "visible", name: "Transition" })));
}
function sy(e, t) {
  let r = ta(ca) !== null, n = Lf() !== null;
  return Me.createElement(Me.Fragment, null, !r && n ? Me.createElement(Vo, { ref: t, ...e }) : Me.createElement(qf, { ref: t, ...e }));
}
let Vo = qi(iy), qf = qi(oy), Ho = qi(sy), ly = Object.assign(Vo, { Child: Ho, Root: Vo });
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Zl = {
  prefix: "fas",
  iconName: "user",
  icon: [448, 512, [128100, 62144], "f007", "M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"]
}, Ql = {
  prefix: "fas",
  iconName: "key",
  icon: [512, 512, [128273], "f084", "M336 352c97.2 0 176-78.8 176-176S433.2 0 336 0S160 78.8 160 176c0 18.7 2.9 36.8 8.3 53.7L7 391c-4.5 4.5-7 10.6-7 17l0 80c0 13.3 10.7 24 24 24l80 0c13.3 0 24-10.7 24-24l0-40 40 0c13.3 0 24-10.7 24-24l0-40 40 0c6.4 0 12.5-2.5 17-7l33.3-33.3c16.9 5.4 35 8.3 53.7 8.3zM376 96a40 40 0 1 1 0 80 40 40 0 1 1 0-80z"]
}, ec = {
  prefix: "fas",
  iconName: "arrow-right",
  icon: [448, 512, [8594], "f061", "M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"]
}, cy = {
  prefix: "fas",
  iconName: "envelope",
  icon: [512, 512, [128386, 9993, 61443], "f0e0", "M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48L48 64zM0 176L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-208L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"]
}, uy = {
  prefix: "fas",
  iconName: "triangle-exclamation",
  icon: [512, 512, [9888, "exclamation-triangle", "warning"], "f071", "M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"]
}, fy = uy;
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
const dy = {
  prefix: "fab",
  iconName: "discord",
  icon: [640, 512, [], "f392", "M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z"]
};
function py(e, t = !1) {
  return window.__TAURI_INTERNALS__.transformCallback(e, t);
}
async function Gf(e, t = {}, r) {
  return window.__TAURI_INTERNALS__.invoke(e, t, r);
}
var tc;
(function(e) {
  e.WINDOW_RESIZED = "tauri://resize", e.WINDOW_MOVED = "tauri://move", e.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", e.WINDOW_DESTROYED = "tauri://destroyed", e.WINDOW_FOCUS = "tauri://focus", e.WINDOW_BLUR = "tauri://blur", e.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", e.WINDOW_THEME_CHANGED = "tauri://theme-changed", e.WINDOW_CREATED = "tauri://window-created", e.WEBVIEW_CREATED = "tauri://webview-created", e.DRAG_ENTER = "tauri://drag-enter", e.DRAG_OVER = "tauri://drag-over", e.DRAG_DROP = "tauri://drag-drop", e.DRAG_LEAVE = "tauri://drag-leave";
})(tc || (tc = {}));
async function my(e, t) {
  window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(e, t), await Gf("plugin:event|unlisten", {
    event: e,
    eventId: t
  });
}
async function gy(e, t, r) {
  var n;
  const a = (n = void 0) !== null && n !== void 0 ? n : { kind: "Any" };
  return Gf("plugin:event|listen", {
    event: e,
    target: a,
    handler: py(t)
  }).then((o) => async () => my(e, o));
}
function hy(e) {
  It(() => {
    let t;
    return (async () => t = await gy(
      "sora-login-success",
      (r) => {
        e(r.payload);
      }
    ))(), () => {
      t && t();
    };
  }, [e]);
}
const Bi = "-", by = (e) => {
  const t = vy(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (a) => {
      const o = a.split(Bi);
      return o[0] === "" && o.length !== 1 && o.shift(), Bf(o, t) || yy(a);
    },
    getConflictingClassGroupIds: (a, o) => {
      const i = r[a] || [];
      return o && n[a] ? [...i, ...n[a]] : i;
    }
  };
}, Bf = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], a = t.nextPart.get(n), o = a ? Bf(e.slice(1), a) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const i = e.join(Bi);
  return (r = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : r.classGroupId;
}, rc = /^\[(.+)\]$/, yy = (e) => {
  if (rc.test(e)) {
    const t = rc.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, vy = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return wy(Object.entries(e.classGroups), r).forEach(([a, o]) => {
    qo(o, n, a, t);
  }), n;
}, qo = (e, t, r, n) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : nc(t, a);
      o.classGroupId = r;
      return;
    }
    if (typeof a == "function") {
      if (xy(a)) {
        qo(a(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: r
      });
      return;
    }
    Object.entries(a).forEach(([o, i]) => {
      qo(i, nc(t, o), r, n);
    });
  });
}, nc = (e, t) => {
  let r = e;
  return t.split(Bi).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, xy = (e) => e.isThemeGetter, wy = (e, t) => t ? e.map(([r, n]) => {
  const a = n.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([i, s]) => [t + i, s])) : o);
  return [r, a];
}) : e, ky = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const a = (o, i) => {
    r.set(o, i), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(o) {
      let i = r.get(o);
      if (i !== void 0)
        return i;
      if ((i = n.get(o)) !== void 0)
        return a(o, i), i;
    },
    set(o, i) {
      r.has(o) ? r.set(o, i) : a(o, i);
    }
  };
}, Xf = "!", Oy = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, a = t[0], o = t.length, i = (s) => {
    const c = [];
    let u = 0, d = 0, m;
    for (let b = 0; b < s.length; b++) {
      let E = s[b];
      if (u === 0) {
        if (E === a && (n || s.slice(b, b + o) === t)) {
          c.push(s.slice(d, b)), d = b + o;
          continue;
        }
        if (E === "/") {
          m = b;
          continue;
        }
      }
      E === "[" ? u++ : E === "]" && u--;
    }
    const h = c.length === 0 ? s : s.substring(d), k = h.startsWith(Xf), O = k ? h.substring(1) : h, w = m && m > d ? m - d : void 0;
    return {
      modifiers: c,
      hasImportantModifier: k,
      baseClassName: O,
      maybePostfixModifierPosition: w
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, Sy = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, Ey = (e) => ({
  cache: ky(e.cacheSize),
  parseClassName: Oy(e),
  ...by(e)
}), Ay = /\s+/, Py = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: a
  } = t, o = [], i = e.trim().split(Ay);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const u = i[c], {
      modifiers: d,
      hasImportantModifier: m,
      baseClassName: h,
      maybePostfixModifierPosition: k
    } = r(u);
    let O = !!k, w = n(O ? h.substring(0, k) : h);
    if (!w) {
      if (!O) {
        s = u + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (w = n(h), !w) {
        s = u + (s.length > 0 ? " " + s : s);
        continue;
      }
      O = !1;
    }
    const b = Sy(d).join(":"), E = m ? b + Xf : b, N = E + w;
    if (o.includes(N))
      continue;
    o.push(N);
    const T = a(w, O);
    for (let j = 0; j < T.length; ++j) {
      const p = T[j];
      o.push(E + p);
    }
    s = u + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function Cy() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = Kf(t)) && (n && (n += " "), n += r);
  return n;
}
const Kf = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = Kf(e[n])) && (r && (r += " "), r += t);
  return r;
};
function $y(e, ...t) {
  let r, n, a, o = i;
  function i(c) {
    const u = t.reduce((d, m) => m(d), e());
    return r = Ey(u), n = r.cache.get, a = r.cache.set, o = s, s(c);
  }
  function s(c) {
    const u = n(c);
    if (u)
      return u;
    const d = Py(c, r);
    return a(c, d), d;
  }
  return function() {
    return o(Cy.apply(null, arguments));
  };
}
const Pe = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, Jf = /^\[(?:([a-z-]+):)?(.+)\]$/i, Ny = /^\d+\/\d+$/, _y = /* @__PURE__ */ new Set(["px", "full", "screen"]), Ty = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, jy = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Iy = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Ry = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, My = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, ct = (e) => vr(e) || _y.has(e) || Ny.test(e), Et = (e) => Cr(e, "length", Vy), vr = (e) => !!e && !Number.isNaN(Number(e)), Xa = (e) => Cr(e, "number", vr), zr = (e) => !!e && Number.isInteger(Number(e)), zy = (e) => e.endsWith("%") && vr(e.slice(0, -1)), se = (e) => Jf.test(e), At = (e) => Ty.test(e), Fy = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Dy = (e) => Cr(e, Fy, Zf), Ly = (e) => Cr(e, "position", Zf), Wy = /* @__PURE__ */ new Set(["image", "url"]), Uy = (e) => Cr(e, Wy, qy), Yy = (e) => Cr(e, "", Hy), Fr = () => !0, Cr = (e, t, r) => {
  const n = Jf.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, Vy = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  jy.test(e) && !Iy.test(e)
), Zf = () => !1, Hy = (e) => Ry.test(e), qy = (e) => My.test(e), Gy = () => {
  const e = Pe("colors"), t = Pe("spacing"), r = Pe("blur"), n = Pe("brightness"), a = Pe("borderColor"), o = Pe("borderRadius"), i = Pe("borderSpacing"), s = Pe("borderWidth"), c = Pe("contrast"), u = Pe("grayscale"), d = Pe("hueRotate"), m = Pe("invert"), h = Pe("gap"), k = Pe("gradientColorStops"), O = Pe("gradientColorStopPositions"), w = Pe("inset"), b = Pe("margin"), E = Pe("opacity"), N = Pe("padding"), T = Pe("saturate"), j = Pe("scale"), p = Pe("sepia"), V = Pe("skew"), J = Pe("space"), oe = Pe("translate"), me = () => ["auto", "contain", "none"], ne = () => ["auto", "hidden", "clip", "visible", "scroll"], ge = () => ["auto", se, t], F = () => [se, t], be = () => ["", ct, Et], ee = () => ["auto", vr, se], ce = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], G = () => ["solid", "dashed", "dotted", "double", "none"], U = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], Z = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], te = () => ["", "0", se], g = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], f = () => [vr, se];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Fr],
      spacing: [ct, Et],
      blur: ["none", "", At, se],
      brightness: f(),
      borderColor: [e],
      borderRadius: ["none", "", "full", At, se],
      borderSpacing: F(),
      borderWidth: be(),
      contrast: f(),
      grayscale: te(),
      hueRotate: f(),
      invert: te(),
      gap: F(),
      gradientColorStops: [e],
      gradientColorStopPositions: [zy, Et],
      inset: ge(),
      margin: ge(),
      opacity: f(),
      padding: F(),
      saturate: f(),
      scale: f(),
      sepia: te(),
      skew: f(),
      space: F(),
      translate: F()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", se]
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
        columns: [At]
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
        object: [...ce(), se]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: ne()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": ne()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": ne()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: me()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": me()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": me()
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
        inset: [w]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [w]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [w]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [w]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [w]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [w]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [w]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [w]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [w]
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
        z: ["auto", zr, se]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ge()
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
        flex: ["1", "auto", "initial", "none", se]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: te()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: te()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", zr, se]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Fr]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", zr, se]
        }, se]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": ee()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": ee()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Fr]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [zr, se]
        }, se]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": ee()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": ee()
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
        "auto-cols": ["auto", "min", "max", "fr", se]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", se]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [h]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [h]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [h]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...Z()]
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
        content: ["normal", ...Z(), "baseline"]
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
        "place-content": [...Z(), "baseline"]
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
        p: [N]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [N]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [N]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [N]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [N]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [N]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [N]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [N]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [N]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [b]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [b]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [b]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [b]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [b]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [b]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [b]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [b]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [b]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [J]
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
        "space-y": [J]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", se, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [se, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [se, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [At]
        }, At]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [se, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [se, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [se, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [se, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", At, Et]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Xa]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Fr]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", se]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", vr, Xa]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", ct, se]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", se]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", se]
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
        "placeholder-opacity": [E]
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
        "text-opacity": [E]
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
        decoration: [...G(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", ct, Et]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", ct, se]
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
        indent: F()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", se]
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
        content: ["none", se]
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
        "bg-opacity": [E]
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
        bg: [...ce(), Ly]
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
        bg: ["auto", "cover", "contain", Dy]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, Uy]
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
        from: [O]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [O]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [O]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [k]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [k]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [k]
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
        "border-opacity": [E]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...G(), "hidden"]
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
        "divide-opacity": [E]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: G()
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
        outline: ["", ...G()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [ct, se]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [ct, Et]
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
        ring: be()
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
        "ring-opacity": [E]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [ct, Et]
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
        shadow: ["", "inner", "none", At, Yy]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Fr]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [E]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...U(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": U()
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
        "drop-shadow": ["", "none", At, se]
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
        "hue-rotate": [d]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [m]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [T]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [p]
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
        "backdrop-grayscale": [u]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [d]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [m]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [E]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [T]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [p]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", se]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: f()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", se]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: f()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", se]
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
        scale: [j]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [j]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [j]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [zr, se]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [oe]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [oe]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [V]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [V]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", se]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", se]
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
        "scroll-m": F()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": F()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": F()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": F()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": F()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": F()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": F()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": F()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": F()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": F()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": F()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": F()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": F()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": F()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": F()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": F()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": F()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": F()
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
        "will-change": ["auto", "scroll", "contents", "transform", se]
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
        stroke: [ct, Et, Xa]
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
}, Ka = /* @__PURE__ */ $y(Gy);
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function By(e, t, r) {
  return (t = Ky(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function ac(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function L(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? ac(Object(r), !0).forEach(function(n) {
      By(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : ac(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function Xy(e, t) {
  if (typeof e != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(e, t);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Ky(e) {
  var t = Xy(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const oc = () => {
};
let Xi = {}, Qf = {}, ed = null, td = {
  mark: oc,
  measure: oc
};
try {
  typeof window < "u" && (Xi = window), typeof document < "u" && (Qf = document), typeof MutationObserver < "u" && (ed = MutationObserver), typeof performance < "u" && (td = performance);
} catch {
}
const {
  userAgent: ic = ""
} = Xi.navigator || {}, Ft = Xi, _e = Qf, sc = ed, An = td;
Ft.document;
const vt = !!_e.documentElement && !!_e.head && typeof _e.addEventListener == "function" && typeof _e.createElement == "function", rd = ~ic.indexOf("MSIE") || ~ic.indexOf("Trident/");
var Jy = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, Zy = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, nd = {
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
}, Qy = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, ad = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Ue = "classic", da = "duotone", ev = "sharp", tv = "sharp-duotone", od = [Ue, da, ev, tv], rv = {
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
}, nv = {
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
}, av = /* @__PURE__ */ new Map([["classic", {
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
}]]), ov = {
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
}, iv = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], lc = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, sv = ["kit"], lv = {
  kit: {
    "fa-kit": "fak"
  }
}, cv = ["fak", "fakd"], uv = {
  kit: {
    fak: "fa-kit"
  }
}, cc = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Pn = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, fv = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], dv = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], pv = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, mv = {
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
}, gv = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Go = {
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
}, hv = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], Bo = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...fv, ...hv], bv = ["solid", "regular", "light", "thin", "duotone", "brands"], id = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], yv = id.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), vv = [...Object.keys(gv), ...bv, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Pn.GROUP, Pn.SWAP_OPACITY, Pn.PRIMARY, Pn.SECONDARY].concat(id.map((e) => "".concat(e, "x"))).concat(yv.map((e) => "w-".concat(e))), xv = {
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
const mt = "___FONT_AWESOME___", Xo = 16, sd = "fa", ld = "svg-inline--fa", er = "data-fa-i2svg", Ko = "data-fa-pseudo-element", wv = "data-fa-pseudo-element-pending", Ki = "data-prefix", Ji = "data-icon", uc = "fontawesome-i2svg", kv = "async", Ov = ["HTML", "HEAD", "STYLE", "SCRIPT"], cd = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function ln(e) {
  return new Proxy(e, {
    get(t, r) {
      return r in t ? t[r] : t[Ue];
    }
  });
}
const ud = L({}, nd);
ud[Ue] = L(L(L(L({}, {
  "fa-duotone": "duotone"
}), nd[Ue]), lc.kit), lc["kit-duotone"]);
const Sv = ln(ud), Jo = L({}, ov);
Jo[Ue] = L(L(L(L({}, {
  duotone: "fad"
}), Jo[Ue]), cc.kit), cc["kit-duotone"]);
const fc = ln(Jo), Zo = L({}, Go);
Zo[Ue] = L(L({}, Zo[Ue]), uv.kit);
const Zi = ln(Zo), Qo = L({}, mv);
Qo[Ue] = L(L({}, Qo[Ue]), lv.kit);
ln(Qo);
const Ev = Jy, fd = "fa-layers-text", Av = Zy, Pv = L({}, rv);
ln(Pv);
const Cv = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Ja = Qy, $v = [...sv, ...vv], Xr = Ft.FontAwesomeConfig || {};
function Nv(e) {
  var t = _e.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function _v(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
_e && typeof _e.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, r] = e;
  const n = _v(Nv(t));
  n != null && (Xr[r] = n);
});
const dd = {
  styleDefault: "solid",
  familyDefault: Ue,
  cssPrefix: sd,
  replacementClass: ld,
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
Xr.familyPrefix && (Xr.cssPrefix = Xr.familyPrefix);
const Sr = L(L({}, dd), Xr);
Sr.autoReplaceSvg || (Sr.observeMutations = !1);
const X = {};
Object.keys(dd).forEach((e) => {
  Object.defineProperty(X, e, {
    enumerable: !0,
    set: function(t) {
      Sr[e] = t, Kr.forEach((r) => r(X));
    },
    get: function() {
      return Sr[e];
    }
  });
});
Object.defineProperty(X, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    Sr.cssPrefix = e, Kr.forEach((t) => t(X));
  },
  get: function() {
    return Sr.cssPrefix;
  }
});
Ft.FontAwesomeConfig = X;
const Kr = [];
function Tv(e) {
  return Kr.push(e), () => {
    Kr.splice(Kr.indexOf(e), 1);
  };
}
const Pt = Xo, at = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function jv(e) {
  if (!e || !vt)
    return;
  const t = _e.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const r = _e.head.childNodes;
  let n = null;
  for (let a = r.length - 1; a > -1; a--) {
    const o = r[a], i = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (n = o);
  }
  return _e.head.insertBefore(t, n), e;
}
const Iv = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function tn() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += Iv[Math.random() * 62 | 0];
  return t;
}
function $r(e) {
  const t = [];
  for (let r = (e || []).length >>> 0; r--; )
    t[r] = e[r];
  return t;
}
function Qi(e) {
  return e.classList ? $r(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function pd(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Rv(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, '="').concat(pd(e[r]), '" '), "").trim();
}
function pa(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, ": ").concat(e[r].trim(), ";"), "");
}
function es(e) {
  return e.size !== at.size || e.x !== at.x || e.y !== at.y || e.rotate !== at.rotate || e.flipX || e.flipY;
}
function Mv(e) {
  let {
    transform: t,
    containerWidth: r,
    iconWidth: n
  } = e;
  const a = {
    transform: "translate(".concat(r / 2, " 256)")
  }, o = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), c = {
    transform: "".concat(o, " ").concat(i, " ").concat(s)
  }, u = {
    transform: "translate(".concat(n / 2 * -1, " -256)")
  };
  return {
    outer: a,
    inner: c,
    path: u
  };
}
function zv(e) {
  let {
    transform: t,
    width: r = Xo,
    height: n = Xo,
    startCentered: a = !1
  } = e, o = "";
  return a && rd ? o += "translate(".concat(t.x / Pt - r / 2, "em, ").concat(t.y / Pt - n / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / Pt, "em), calc(-50% + ").concat(t.y / Pt, "em)) ") : o += "translate(".concat(t.x / Pt, "em, ").concat(t.y / Pt, "em) "), o += "scale(".concat(t.size / Pt * (t.flipX ? -1 : 1), ", ").concat(t.size / Pt * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var Fv = `:root, :host {
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
function md() {
  const e = sd, t = ld, r = X.cssPrefix, n = X.replacementClass;
  let a = Fv;
  if (r !== e || n !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(r, "-")).replace(i, "--".concat(r, "-")).replace(s, ".".concat(n));
  }
  return a;
}
let dc = !1;
function Za() {
  X.autoAddCss && !dc && (jv(md()), dc = !0);
}
var Dv = {
  mixout() {
    return {
      dom: {
        css: md,
        insertCss: Za
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Za();
      },
      beforeI2svg() {
        Za();
      }
    };
  }
};
const gt = Ft || {};
gt[mt] || (gt[mt] = {});
gt[mt].styles || (gt[mt].styles = {});
gt[mt].hooks || (gt[mt].hooks = {});
gt[mt].shims || (gt[mt].shims = []);
var ot = gt[mt];
const gd = [], hd = function() {
  _e.removeEventListener("DOMContentLoaded", hd), Bn = 1, gd.map((e) => e());
};
let Bn = !1;
vt && (Bn = (_e.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(_e.readyState), Bn || _e.addEventListener("DOMContentLoaded", hd));
function Lv(e) {
  vt && (Bn ? setTimeout(e, 0) : gd.push(e));
}
function cn(e) {
  const {
    tag: t,
    attributes: r = {},
    children: n = []
  } = e;
  return typeof e == "string" ? pd(e) : "<".concat(t, " ").concat(Rv(r), ">").concat(n.map(cn).join(""), "</").concat(t, ">");
}
function pc(e, t, r) {
  if (e && e[t] && e[t][r])
    return {
      prefix: t,
      iconName: r,
      icon: e[t][r]
    };
}
var Qa = function(e, t, r, n) {
  var a = Object.keys(e), o = a.length, i = t, s, c, u;
  for (r === void 0 ? (s = 1, u = e[a[0]]) : (s = 0, u = r); s < o; s++)
    c = a[s], u = i(u, e[c], c, e);
  return u;
};
function Wv(e) {
  const t = [];
  let r = 0;
  const n = e.length;
  for (; r < n; ) {
    const a = e.charCodeAt(r++);
    if (a >= 55296 && a <= 56319 && r < n) {
      const o = e.charCodeAt(r++);
      (o & 64512) == 56320 ? t.push(((a & 1023) << 10) + (o & 1023) + 65536) : (t.push(a), r--);
    } else
      t.push(a);
  }
  return t;
}
function bd(e) {
  const t = Wv(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function Uv(e, t) {
  const r = e.length;
  let n = e.charCodeAt(t), a;
  return n >= 55296 && n <= 56319 && r > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (n - 55296) * 1024 + a - 56320 + 65536 : n;
}
function mc(e) {
  return Object.keys(e).reduce((t, r) => {
    const n = e[r];
    return n.icon ? t[n.iconName] = n.icon : t[r] = n, t;
  }, {});
}
function ei(e, t) {
  let r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: n = !1
  } = r, a = mc(t);
  typeof ot.hooks.addPack == "function" && !n ? ot.hooks.addPack(e, mc(t)) : ot.styles[e] = L(L({}, ot.styles[e] || {}), a), e === "fas" && ei("fa", t);
}
const {
  styles: rn,
  shims: Yv
} = ot, yd = Object.keys(Zi), Vv = yd.reduce((e, t) => (e[t] = Object.keys(Zi[t]), e), {});
let ts = null, vd = {}, xd = {}, wd = {}, kd = {}, Od = {};
function Hv(e) {
  return ~$v.indexOf(e);
}
function qv(e, t) {
  const r = t.split("-"), n = r[0], a = r.slice(1).join("-");
  return n === e && a !== "" && !Hv(a) ? a : null;
}
const Sd = () => {
  const e = (n) => Qa(rn, (a, o, i) => (a[i] = Qa(o, n, {}), a), {});
  vd = e((n, a, o) => (a[3] && (n[a[3]] = o), a[2] && a[2].filter((i) => typeof i == "number").forEach((i) => {
    n[i.toString(16)] = o;
  }), n)), xd = e((n, a, o) => (n[o] = o, a[2] && a[2].filter((i) => typeof i == "string").forEach((i) => {
    n[i] = o;
  }), n)), Od = e((n, a, o) => {
    const i = a[2];
    return n[o] = o, i.forEach((s) => {
      n[s] = o;
    }), n;
  });
  const t = "far" in rn || X.autoFetchSvg, r = Qa(Yv, (n, a) => {
    const o = a[0];
    let i = a[1];
    const s = a[2];
    return i === "far" && !t && (i = "fas"), typeof o == "string" && (n.names[o] = {
      prefix: i,
      iconName: s
    }), typeof o == "number" && (n.unicodes[o.toString(16)] = {
      prefix: i,
      iconName: s
    }), n;
  }, {
    names: {},
    unicodes: {}
  });
  wd = r.names, kd = r.unicodes, ts = ma(X.styleDefault, {
    family: X.familyDefault
  });
};
Tv((e) => {
  ts = ma(e.styleDefault, {
    family: X.familyDefault
  });
});
Sd();
function rs(e, t) {
  return (vd[e] || {})[t];
}
function Gv(e, t) {
  return (xd[e] || {})[t];
}
function Xt(e, t) {
  return (Od[e] || {})[t];
}
function Ed(e) {
  return wd[e] || {
    prefix: null,
    iconName: null
  };
}
function Bv(e) {
  const t = kd[e], r = rs("fas", e);
  return t || (r ? {
    prefix: "fas",
    iconName: r
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Dt() {
  return ts;
}
const Ad = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function Xv(e) {
  let t = Ue;
  const r = yd.reduce((n, a) => (n[a] = "".concat(X.cssPrefix, "-").concat(a), n), {});
  return od.forEach((n) => {
    (e.includes(r[n]) || e.some((a) => Vv[n].includes(a))) && (t = n);
  }), t;
}
function ma(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: r = Ue
  } = t, n = Sv[r][e];
  if (r === da && !e)
    return "fad";
  const a = fc[r][e] || fc[r][n], o = e in ot.styles ? e : null;
  return a || o || null;
}
function Kv(e) {
  let t = [], r = null;
  return e.forEach((n) => {
    const a = qv(X.cssPrefix, n);
    a ? r = a : n && t.push(n);
  }), {
    iconName: r,
    rest: t
  };
}
function gc(e) {
  return e.sort().filter((t, r, n) => n.indexOf(t) === r);
}
function ga(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: r = !1
  } = t;
  let n = null;
  const a = Bo.concat(dv), o = gc(e.filter((m) => a.includes(m))), i = gc(e.filter((m) => !Bo.includes(m))), s = o.filter((m) => (n = m, !ad.includes(m))), [c = null] = s, u = Xv(o), d = L(L({}, Kv(i)), {}, {
    prefix: ma(c, {
      family: u
    })
  });
  return L(L(L({}, d), e1({
    values: e,
    family: u,
    styles: rn,
    config: X,
    canonical: d,
    givenPrefix: n
  })), Jv(r, n, d));
}
function Jv(e, t, r) {
  let {
    prefix: n,
    iconName: a
  } = r;
  if (e || !n || !a)
    return {
      prefix: n,
      iconName: a
    };
  const o = t === "fa" ? Ed(a) : {}, i = Xt(n, a);
  return a = o.iconName || i || a, n = o.prefix || n, n === "far" && !rn.far && rn.fas && !X.autoFetchSvg && (n = "fas"), {
    prefix: n,
    iconName: a
  };
}
const Zv = od.filter((e) => e !== Ue || e !== da), Qv = Object.keys(Go).filter((e) => e !== Ue).map((e) => Object.keys(Go[e])).flat();
function e1(e) {
  const {
    values: t,
    family: r,
    canonical: n,
    givenPrefix: a = "",
    styles: o = {},
    config: i = {}
  } = e, s = r === da, c = t.includes("fa-duotone") || t.includes("fad"), u = i.familyDefault === "duotone", d = n.prefix === "fad" || n.prefix === "fa-duotone";
  if (!s && (c || u || d) && (n.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (n.prefix = "fab"), !n.prefix && Zv.includes(r) && (Object.keys(o).find((m) => Qv.includes(m)) || i.autoFetchSvg)) {
    const m = av.get(r).defaultShortPrefixId;
    n.prefix = m, n.iconName = Xt(n.prefix, n.iconName) || n.iconName;
  }
  return (n.prefix === "fa" || a === "fa") && (n.prefix = Dt() || "fas"), n;
}
class t1 {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
      r[n] = arguments[n];
    const a = r.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = L(L({}, this.definitions[o] || {}), a[o]), ei(o, a[o]);
      const i = Zi[Ue][o];
      i && ei(i, a[o]), Sd();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, r) {
    const n = r.prefix && r.iconName && r.icon ? {
      0: r
    } : r;
    return Object.keys(n).map((a) => {
      const {
        prefix: o,
        iconName: i,
        icon: s
      } = n[a], c = s[2];
      t[o] || (t[o] = {}), c.length > 0 && c.forEach((u) => {
        typeof u == "string" && (t[o][u] = s);
      }), t[o][i] = s;
    }), t;
  }
}
let hc = [], pr = {};
const xr = {}, r1 = Object.keys(xr);
function n1(e, t) {
  let {
    mixoutsTo: r
  } = t;
  return hc = e, pr = {}, Object.keys(xr).forEach((n) => {
    r1.indexOf(n) === -1 && delete xr[n];
  }), hc.forEach((n) => {
    const a = n.mixout ? n.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (r[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((i) => {
        r[o] || (r[o] = {}), r[o][i] = a[o][i];
      });
    }), n.hooks) {
      const o = n.hooks();
      Object.keys(o).forEach((i) => {
        pr[i] || (pr[i] = []), pr[i].push(o[i]);
      });
    }
    n.provides && n.provides(xr);
  }), r;
}
function ti(e, t) {
  for (var r = arguments.length, n = new Array(r > 2 ? r - 2 : 0), a = 2; a < r; a++)
    n[a - 2] = arguments[a];
  return (pr[e] || []).forEach((o) => {
    t = o.apply(null, [t, ...n]);
  }), t;
}
function tr(e) {
  for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++)
    r[n - 1] = arguments[n];
  (pr[e] || []).forEach((a) => {
    a.apply(null, r);
  });
}
function Lt() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return xr[e] ? xr[e].apply(null, t) : void 0;
}
function ri(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const r = e.prefix || Dt();
  if (t)
    return t = Xt(r, t) || t, pc(Pd.definitions, r, t) || pc(ot.styles, r, t);
}
const Pd = new t1(), a1 = () => {
  X.autoReplaceSvg = !1, X.observeMutations = !1, tr("noAuto");
}, o1 = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return vt ? (tr("beforeI2svg", e), Lt("pseudoElements2svg", e), Lt("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    X.autoReplaceSvg === !1 && (X.autoReplaceSvg = !0), X.observeMutations = !0, Lv(() => {
      s1({
        autoReplaceSvgRoot: t
      }), tr("watch", e);
    });
  }
}, i1 = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Xt(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], r = ma(e[0]);
      return {
        prefix: r,
        iconName: Xt(r, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(X.cssPrefix, "-")) > -1 || e.match(Ev))) {
      const t = ga(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Dt(),
        iconName: Xt(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Dt();
      return {
        prefix: t,
        iconName: Xt(t, e) || e
      };
    }
  }
}, Xe = {
  noAuto: a1,
  config: X,
  dom: o1,
  parse: i1,
  library: Pd,
  findIconDefinition: ri,
  toHtml: cn
}, s1 = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = _e
  } = e;
  (Object.keys(ot.styles).length > 0 || X.autoFetchSvg) && vt && X.autoReplaceSvg && Xe.dom.i2svg({
    node: t
  });
};
function ha(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((r) => cn(r));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!vt) return;
      const r = _e.createElement("div");
      return r.innerHTML = e.html, r.children;
    }
  }), e;
}
function l1(e) {
  let {
    children: t,
    main: r,
    mask: n,
    attributes: a,
    styles: o,
    transform: i
  } = e;
  if (es(i) && r.found && !n.found) {
    const {
      width: s,
      height: c
    } = r, u = {
      x: s / c / 2,
      y: 0.5
    };
    a.style = pa(L(L({}, o), {}, {
      "transform-origin": "".concat(u.x + i.x / 16, "em ").concat(u.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function c1(e) {
  let {
    prefix: t,
    iconName: r,
    children: n,
    attributes: a,
    symbol: o
  } = e;
  const i = o === !0 ? "".concat(t, "-").concat(X.cssPrefix, "-").concat(r) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: L(L({}, a), {}, {
        id: i
      }),
      children: n
    }]
  }];
}
function ns(e) {
  const {
    icons: {
      main: t,
      mask: r
    },
    prefix: n,
    iconName: a,
    transform: o,
    symbol: i,
    title: s,
    maskId: c,
    titleId: u,
    extra: d,
    watchable: m = !1
  } = e, {
    width: h,
    height: k
  } = r.found ? r : t, O = cv.includes(n), w = [X.replacementClass, a ? "".concat(X.cssPrefix, "-").concat(a) : ""].filter((p) => d.classes.indexOf(p) === -1).filter((p) => p !== "" || !!p).concat(d.classes).join(" ");
  let b = {
    children: [],
    attributes: L(L({}, d.attributes), {}, {
      "data-prefix": n,
      "data-icon": a,
      class: w,
      role: d.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(h, " ").concat(k)
    })
  };
  const E = O && !~d.classes.indexOf("fa-fw") ? {
    width: "".concat(h / k * 16 * 0.0625, "em")
  } : {};
  m && (b.attributes[er] = ""), s && (b.children.push({
    tag: "title",
    attributes: {
      id: b.attributes["aria-labelledby"] || "title-".concat(u || tn())
    },
    children: [s]
  }), delete b.attributes.title);
  const N = L(L({}, b), {}, {
    prefix: n,
    iconName: a,
    main: t,
    mask: r,
    maskId: c,
    transform: o,
    symbol: i,
    styles: L(L({}, E), d.styles)
  }), {
    children: T,
    attributes: j
  } = r.found && t.found ? Lt("generateAbstractMask", N) || {
    children: [],
    attributes: {}
  } : Lt("generateAbstractIcon", N) || {
    children: [],
    attributes: {}
  };
  return N.children = T, N.attributes = j, i ? c1(N) : l1(N);
}
function bc(e) {
  const {
    content: t,
    width: r,
    height: n,
    transform: a,
    title: o,
    extra: i,
    watchable: s = !1
  } = e, c = L(L(L({}, i.attributes), o ? {
    title: o
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[er] = "");
  const u = L({}, i.styles);
  es(a) && (u.transform = zv({
    transform: a,
    startCentered: !0,
    width: r,
    height: n
  }), u["-webkit-transform"] = u.transform);
  const d = pa(u);
  d.length > 0 && (c.style = d);
  const m = [];
  return m.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), o && m.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), m;
}
function u1(e) {
  const {
    content: t,
    title: r,
    extra: n
  } = e, a = L(L(L({}, n.attributes), r ? {
    title: r
  } : {}), {}, {
    class: n.classes.join(" ")
  }), o = pa(n.styles);
  o.length > 0 && (a.style = o);
  const i = [];
  return i.push({
    tag: "span",
    attributes: a,
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
  styles: eo
} = ot;
function ni(e) {
  const t = e[0], r = e[1], [n] = e.slice(4);
  let a = null;
  return Array.isArray(n) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(X.cssPrefix, "-").concat(Ja.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(X.cssPrefix, "-").concat(Ja.SECONDARY),
        fill: "currentColor",
        d: n[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(X.cssPrefix, "-").concat(Ja.PRIMARY),
        fill: "currentColor",
        d: n[1]
      }
    }]
  } : a = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: n
    }
  }, {
    found: !0,
    width: t,
    height: r,
    icon: a
  };
}
const f1 = {
  found: !1,
  width: 512,
  height: 512
};
function d1(e, t) {
  !cd && !X.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function ai(e, t) {
  let r = t;
  return t === "fa" && X.styleDefault !== null && (t = Dt()), new Promise((n, a) => {
    if (r === "fa") {
      const o = Ed(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && eo[t] && eo[t][e]) {
      const o = eo[t][e];
      return n(ni(o));
    }
    d1(e, t), n(L(L({}, f1), {}, {
      icon: X.showMissingIcons && e ? Lt("missingIconAbstract") || {} : {}
    }));
  });
}
const yc = () => {
}, oi = X.measurePerformance && An && An.mark && An.measure ? An : {
  mark: yc,
  measure: yc
}, Yr = 'FA "6.7.2"', p1 = (e) => (oi.mark("".concat(Yr, " ").concat(e, " begins")), () => Cd(e)), Cd = (e) => {
  oi.mark("".concat(Yr, " ").concat(e, " ends")), oi.measure("".concat(Yr, " ").concat(e), "".concat(Yr, " ").concat(e, " begins"), "".concat(Yr, " ").concat(e, " ends"));
};
var as = {
  begin: p1,
  end: Cd
};
const Ln = () => {
};
function vc(e) {
  return typeof (e.getAttribute ? e.getAttribute(er) : null) == "string";
}
function m1(e) {
  const t = e.getAttribute ? e.getAttribute(Ki) : null, r = e.getAttribute ? e.getAttribute(Ji) : null;
  return t && r;
}
function g1(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(X.replacementClass);
}
function h1() {
  return X.autoReplaceSvg === !0 ? Wn.replace : Wn[X.autoReplaceSvg] || Wn.replace;
}
function b1(e) {
  return _e.createElementNS("http://www.w3.org/2000/svg", e);
}
function y1(e) {
  return _e.createElement(e);
}
function $d(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: r = e.tag === "svg" ? b1 : y1
  } = t;
  if (typeof e == "string")
    return _e.createTextNode(e);
  const n = r(e.tag);
  return Object.keys(e.attributes || []).forEach(function(a) {
    n.setAttribute(a, e.attributes[a]);
  }), (e.children || []).forEach(function(a) {
    n.appendChild($d(a, {
      ceFn: r
    }));
  }), n;
}
function v1(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const Wn = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((r) => {
        t.parentNode.insertBefore($d(r), t);
      }), t.getAttribute(er) === null && X.keepOriginalSource) {
        let r = _e.createComment(v1(t));
        t.parentNode.replaceChild(r, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], r = e[1];
    if (~Qi(t).indexOf(X.replacementClass))
      return Wn.replace(e);
    const n = new RegExp("".concat(X.cssPrefix, "-.*"));
    if (delete r[0].attributes.id, r[0].attributes.class) {
      const o = r[0].attributes.class.split(" ").reduce((i, s) => (s === X.replacementClass || s.match(n) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      r[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = r.map((o) => cn(o)).join(`
`);
    t.setAttribute(er, ""), t.innerHTML = a;
  }
};
function xc(e) {
  e();
}
function Nd(e, t) {
  const r = typeof t == "function" ? t : Ln;
  if (e.length === 0)
    r();
  else {
    let n = xc;
    X.mutateApproach === kv && (n = Ft.requestAnimationFrame || xc), n(() => {
      const a = h1(), o = as.begin("mutate");
      e.map(a), o(), r();
    });
  }
}
let os = !1;
function _d() {
  os = !0;
}
function ii() {
  os = !1;
}
let Xn = null;
function wc(e) {
  if (!sc || !X.observeMutations)
    return;
  const {
    treeCallback: t = Ln,
    nodeCallback: r = Ln,
    pseudoElementsCallback: n = Ln,
    observeMutationsRoot: a = _e
  } = e;
  Xn = new sc((o) => {
    if (os) return;
    const i = Dt();
    $r(o).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !vc(s.addedNodes[0]) && (X.searchPseudoElements && n(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && X.searchPseudoElements && n(s.target.parentNode), s.type === "attributes" && vc(s.target) && ~Cv.indexOf(s.attributeName))
        if (s.attributeName === "class" && m1(s.target)) {
          const {
            prefix: c,
            iconName: u
          } = ga(Qi(s.target));
          s.target.setAttribute(Ki, c || i), u && s.target.setAttribute(Ji, u);
        } else g1(s.target) && r(s.target);
    });
  }), vt && Xn.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function x1() {
  Xn && Xn.disconnect();
}
function w1(e) {
  const t = e.getAttribute("style");
  let r = [];
  return t && (r = t.split(";").reduce((n, a) => {
    const o = a.split(":"), i = o[0], s = o.slice(1);
    return i && s.length > 0 && (n[i] = s.join(":").trim()), n;
  }, {})), r;
}
function k1(e) {
  const t = e.getAttribute("data-prefix"), r = e.getAttribute("data-icon"), n = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = ga(Qi(e));
  return a.prefix || (a.prefix = Dt()), t && r && (a.prefix = t, a.iconName = r), a.iconName && a.prefix || (a.prefix && n.length > 0 && (a.iconName = Gv(a.prefix, e.innerText) || rs(a.prefix, bd(e.innerText))), !a.iconName && X.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function O1(e) {
  const t = $r(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), r = e.getAttribute("title"), n = e.getAttribute("data-fa-title-id");
  return X.autoA11y && (r ? t["aria-labelledby"] = "".concat(X.replacementClass, "-title-").concat(n || tn()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function S1() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: at,
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
function kc(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: r,
    prefix: n,
    rest: a
  } = k1(e), o = O1(e), i = ti("parseNodeAttributes", {}, e);
  let s = t.styleParser ? w1(e) : [];
  return L({
    iconName: r,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: n,
    transform: at,
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
  styles: E1
} = ot;
function Td(e) {
  const t = X.autoReplaceSvg === "nest" ? kc(e, {
    styleParser: !1
  }) : kc(e);
  return ~t.extra.classes.indexOf(fd) ? Lt("generateLayersText", e, t) : Lt("generateSvgReplacementMutation", e, t);
}
function A1() {
  return [...iv, ...Bo];
}
function Oc(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!vt) return Promise.resolve();
  const r = _e.documentElement.classList, n = (d) => r.add("".concat(uc, "-").concat(d)), a = (d) => r.remove("".concat(uc, "-").concat(d)), o = X.autoFetchSvg ? A1() : ad.concat(Object.keys(E1));
  o.includes("fa") || o.push("fa");
  const i = [".".concat(fd, ":not([").concat(er, "])")].concat(o.map((d) => ".".concat(d, ":not([").concat(er, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = $r(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    n("pending"), a("complete");
  else
    return Promise.resolve();
  const c = as.begin("onTree"), u = s.reduce((d, m) => {
    try {
      const h = Td(m);
      h && d.push(h);
    } catch (h) {
      cd || h.name === "MissingIcon" && console.error(h);
    }
    return d;
  }, []);
  return new Promise((d, m) => {
    Promise.all(u).then((h) => {
      Nd(h, () => {
        n("active"), n("complete"), a("pending"), typeof t == "function" && t(), c(), d();
      });
    }).catch((h) => {
      c(), m(h);
    });
  });
}
function P1(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  Td(e).then((r) => {
    r && Nd([r], t);
  });
}
function C1(e) {
  return function(t) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const n = (t || {}).icon ? t : ri(t || {});
    let {
      mask: a
    } = r;
    return a && (a = (a || {}).icon ? a : ri(a || {})), e(n, L(L({}, r), {}, {
      mask: a
    }));
  };
}
const $1 = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: r = at,
    symbol: n = !1,
    mask: a = null,
    maskId: o = null,
    title: i = null,
    titleId: s = null,
    classes: c = [],
    attributes: u = {},
    styles: d = {}
  } = t;
  if (!e) return;
  const {
    prefix: m,
    iconName: h,
    icon: k
  } = e;
  return ha(L({
    type: "icon"
  }, e), () => (tr("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), X.autoA11y && (i ? u["aria-labelledby"] = "".concat(X.replacementClass, "-title-").concat(s || tn()) : (u["aria-hidden"] = "true", u.focusable = "false")), ns({
    icons: {
      main: ni(k),
      mask: a ? ni(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: m,
    iconName: h,
    transform: L(L({}, at), r),
    symbol: n,
    title: i,
    maskId: o,
    titleId: s,
    extra: {
      attributes: u,
      styles: d,
      classes: c
    }
  })));
};
var N1 = {
  mixout() {
    return {
      icon: C1($1)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Oc, e.nodeCallback = P1, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: r = _e,
        callback: n = () => {
        }
      } = t;
      return Oc(r, n);
    }, e.generateSvgReplacementMutation = function(t, r) {
      const {
        iconName: n,
        title: a,
        titleId: o,
        prefix: i,
        transform: s,
        symbol: c,
        mask: u,
        maskId: d,
        extra: m
      } = r;
      return new Promise((h, k) => {
        Promise.all([ai(n, i), u.iconName ? ai(u.iconName, u.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((O) => {
          let [w, b] = O;
          h([t, ns({
            icons: {
              main: w,
              mask: b
            },
            prefix: i,
            iconName: n,
            transform: s,
            symbol: c,
            maskId: d,
            title: a,
            titleId: o,
            extra: m,
            watchable: !0
          })]);
        }).catch(k);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: r,
        attributes: n,
        main: a,
        transform: o,
        styles: i
      } = t;
      const s = pa(i);
      s.length > 0 && (n.style = s);
      let c;
      return es(o) && (c = Lt("generateAbstractTransformGrouping", {
        main: a,
        transform: o,
        containerWidth: a.width,
        iconWidth: a.width
      })), r.push(c || a.icon), {
        children: r,
        attributes: n
      };
    };
  }
}, _1 = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: r = []
        } = t;
        return ha({
          type: "layer"
        }, () => {
          tr("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let n = [];
          return e((a) => {
            Array.isArray(a) ? a.map((o) => {
              n = n.concat(o.abstract);
            }) : n = n.concat(a.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(X.cssPrefix, "-layers"), ...r].join(" ")
            },
            children: n
          }];
        });
      }
    };
  }
}, T1 = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: r = null,
          classes: n = [],
          attributes: a = {},
          styles: o = {}
        } = t;
        return ha({
          type: "counter",
          content: e
        }, () => (tr("beforeDOMElementCreation", {
          content: e,
          params: t
        }), u1({
          content: e.toString(),
          title: r,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(X.cssPrefix, "-layers-counter"), ...n]
          }
        })));
      }
    };
  }
}, j1 = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: r = at,
          title: n = null,
          classes: a = [],
          attributes: o = {},
          styles: i = {}
        } = t;
        return ha({
          type: "text",
          content: e
        }, () => (tr("beforeDOMElementCreation", {
          content: e,
          params: t
        }), bc({
          content: e,
          transform: L(L({}, at), r),
          title: n,
          extra: {
            attributes: o,
            styles: i,
            classes: ["".concat(X.cssPrefix, "-layers-text"), ...a]
          }
        })));
      }
    };
  },
  provides(e) {
    e.generateLayersText = function(t, r) {
      const {
        title: n,
        transform: a,
        extra: o
      } = r;
      let i = null, s = null;
      if (rd) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), u = t.getBoundingClientRect();
        i = u.width / c, s = u.height / c;
      }
      return X.autoA11y && !n && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, bc({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: a,
        title: n,
        extra: o,
        watchable: !0
      })]);
    };
  }
};
const I1 = new RegExp('"', "ug"), Sc = [1105920, 1112319], Ec = L(L(L(L({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), nv), xv), pv), si = Object.keys(Ec).reduce((e, t) => (e[t.toLowerCase()] = Ec[t], e), {}), R1 = Object.keys(si).reduce((e, t) => {
  const r = si[t];
  return e[t] = r[900] || [...Object.entries(r)][0][1], e;
}, {});
function M1(e) {
  const t = e.replace(I1, ""), r = Uv(t, 0), n = r >= Sc[0] && r <= Sc[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: bd(a ? t[0] : t),
    isSecondary: n || a
  };
}
function z1(e, t) {
  const r = e.replace(/^['"]|['"]$/g, "").toLowerCase(), n = parseInt(t), a = isNaN(n) ? "normal" : n;
  return (si[r] || {})[a] || R1[r];
}
function Ac(e, t) {
  const r = "".concat(wv).concat(t.replace(":", "-"));
  return new Promise((n, a) => {
    if (e.getAttribute(r) !== null)
      return n();
    const o = $r(e.children).filter((m) => m.getAttribute(Ko) === t)[0], i = Ft.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), c = s.match(Av), u = i.getPropertyValue("font-weight"), d = i.getPropertyValue("content");
    if (o && !c)
      return e.removeChild(o), n();
    if (c && d !== "none" && d !== "") {
      const m = i.getPropertyValue("content");
      let h = z1(s, u);
      const {
        value: k,
        isSecondary: O
      } = M1(m), w = c[0].startsWith("FontAwesome");
      let b = rs(h, k), E = b;
      if (w) {
        const N = Bv(k);
        N.iconName && N.prefix && (b = N.iconName, h = N.prefix);
      }
      if (b && !O && (!o || o.getAttribute(Ki) !== h || o.getAttribute(Ji) !== E)) {
        e.setAttribute(r, E), o && e.removeChild(o);
        const N = S1(), {
          extra: T
        } = N;
        T.attributes[Ko] = t, ai(b, h).then((j) => {
          const p = ns(L(L({}, N), {}, {
            icons: {
              main: j,
              mask: Ad()
            },
            prefix: h,
            iconName: E,
            extra: T,
            watchable: !0
          })), V = _e.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(V, e.firstChild) : e.appendChild(V), V.outerHTML = p.map((J) => cn(J)).join(`
`), e.removeAttribute(r), n();
        }).catch(a);
      } else
        n();
    } else
      n();
  });
}
function F1(e) {
  return Promise.all([Ac(e, "::before"), Ac(e, "::after")]);
}
function D1(e) {
  return e.parentNode !== document.head && !~Ov.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Ko) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Pc(e) {
  if (vt)
    return new Promise((t, r) => {
      const n = $r(e.querySelectorAll("*")).filter(D1).map(F1), a = as.begin("searchPseudoElements");
      _d(), Promise.all(n).then(() => {
        a(), ii(), t();
      }).catch(() => {
        a(), ii(), r();
      });
    });
}
var L1 = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Pc, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: r = _e
      } = t;
      X.searchPseudoElements && Pc(r);
    };
  }
};
let Cc = !1;
var W1 = {
  mixout() {
    return {
      dom: {
        unwatch() {
          _d(), Cc = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        wc(ti("mutationObserverCallbacks", {}));
      },
      noAuto() {
        x1();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Cc ? ii() : wc(ti("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const $c = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((r, n) => {
    const a = n.toLowerCase().split("-"), o = a[0];
    let i = a.slice(1).join("-");
    if (o && i === "h")
      return r.flipX = !0, r;
    if (o && i === "v")
      return r.flipY = !0, r;
    if (i = parseFloat(i), isNaN(i))
      return r;
    switch (o) {
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
var U1 = {
  mixout() {
    return {
      parse: {
        transform: (e) => $c(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-transform");
        return r && (e.transform = $c(r)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: r,
        transform: n,
        containerWidth: a,
        iconWidth: o
      } = t;
      const i = {
        transform: "translate(".concat(a / 2, " 256)")
      }, s = "translate(".concat(n.x * 32, ", ").concat(n.y * 32, ") "), c = "scale(".concat(n.size / 16 * (n.flipX ? -1 : 1), ", ").concat(n.size / 16 * (n.flipY ? -1 : 1), ") "), u = "rotate(".concat(n.rotate, " 0 0)"), d = {
        transform: "".concat(s, " ").concat(c, " ").concat(u)
      }, m = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, h = {
        outer: i,
        inner: d,
        path: m
      };
      return {
        tag: "g",
        attributes: L({}, h.outer),
        children: [{
          tag: "g",
          attributes: L({}, h.inner),
          children: [{
            tag: r.icon.tag,
            children: r.icon.children,
            attributes: L(L({}, r.icon.attributes), h.path)
          }]
        }]
      };
    };
  }
};
const to = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Nc(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function Y1(e) {
  return e.tag === "g" ? e.children : [e];
}
var V1 = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-mask"), n = r ? ga(r.split(" ").map((a) => a.trim())) : Ad();
        return n.prefix || (n.prefix = Dt()), e.mask = n, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: r,
        attributes: n,
        main: a,
        mask: o,
        maskId: i,
        transform: s
      } = t;
      const {
        width: c,
        icon: u
      } = a, {
        width: d,
        icon: m
      } = o, h = Mv({
        transform: s,
        containerWidth: d,
        iconWidth: c
      }), k = {
        tag: "rect",
        attributes: L(L({}, to), {}, {
          fill: "white"
        })
      }, O = u.children ? {
        children: u.children.map(Nc)
      } : {}, w = {
        tag: "g",
        attributes: L({}, h.inner),
        children: [Nc(L({
          tag: u.tag,
          attributes: L(L({}, u.attributes), h.path)
        }, O))]
      }, b = {
        tag: "g",
        attributes: L({}, h.outer),
        children: [w]
      }, E = "mask-".concat(i || tn()), N = "clip-".concat(i || tn()), T = {
        tag: "mask",
        attributes: L(L({}, to), {}, {
          id: E,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [k, b]
      }, j = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: N
          },
          children: Y1(m)
        }, T]
      };
      return r.push(j, {
        tag: "rect",
        attributes: L({
          fill: "currentColor",
          "clip-path": "url(#".concat(N, ")"),
          mask: "url(#".concat(E, ")")
        }, to)
      }), {
        children: r,
        attributes: n
      };
    };
  }
}, H1 = {
  provides(e) {
    let t = !1;
    Ft.matchMedia && (t = Ft.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const r = [], n = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      r.push({
        tag: "path",
        attributes: L(L({}, n), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = L(L({}, a), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: L(L({}, n), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: L(L({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: L(L({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), r.push(i), r.push({
        tag: "path",
        attributes: L(L({}, n), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: L(L({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || r.push({
        tag: "path",
        attributes: L(L({}, n), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: L(L({}, o), {}, {
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
}, q1 = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-symbol"), n = r === null ? !1 : r === "" ? !0 : r;
        return e.symbol = n, e;
      }
    };
  }
}, G1 = [Dv, N1, _1, T1, j1, L1, W1, U1, V1, H1, q1];
n1(G1, {
  mixoutsTo: Xe
});
Xe.noAuto;
Xe.config;
Xe.library;
Xe.dom;
const li = Xe.parse;
Xe.findIconDefinition;
Xe.toHtml;
const B1 = Xe.icon;
Xe.layer;
Xe.text;
Xe.counter;
function X1(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Cn = { exports: {} }, ro = { exports: {} }, xe = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var _c;
function K1() {
  if (_c) return xe;
  _c = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, d = e ? Symbol.for("react.forward_ref") : 60112, m = e ? Symbol.for("react.suspense") : 60113, h = e ? Symbol.for("react.suspense_list") : 60120, k = e ? Symbol.for("react.memo") : 60115, O = e ? Symbol.for("react.lazy") : 60116, w = e ? Symbol.for("react.block") : 60121, b = e ? Symbol.for("react.fundamental") : 60117, E = e ? Symbol.for("react.responder") : 60118, N = e ? Symbol.for("react.scope") : 60119;
  function T(p) {
    if (typeof p == "object" && p !== null) {
      var V = p.$$typeof;
      switch (V) {
        case t:
          switch (p = p.type, p) {
            case c:
            case u:
            case n:
            case o:
            case a:
            case m:
              return p;
            default:
              switch (p = p && p.$$typeof, p) {
                case s:
                case d:
                case O:
                case k:
                case i:
                  return p;
                default:
                  return V;
              }
          }
        case r:
          return V;
      }
    }
  }
  function j(p) {
    return T(p) === u;
  }
  return xe.AsyncMode = c, xe.ConcurrentMode = u, xe.ContextConsumer = s, xe.ContextProvider = i, xe.Element = t, xe.ForwardRef = d, xe.Fragment = n, xe.Lazy = O, xe.Memo = k, xe.Portal = r, xe.Profiler = o, xe.StrictMode = a, xe.Suspense = m, xe.isAsyncMode = function(p) {
    return j(p) || T(p) === c;
  }, xe.isConcurrentMode = j, xe.isContextConsumer = function(p) {
    return T(p) === s;
  }, xe.isContextProvider = function(p) {
    return T(p) === i;
  }, xe.isElement = function(p) {
    return typeof p == "object" && p !== null && p.$$typeof === t;
  }, xe.isForwardRef = function(p) {
    return T(p) === d;
  }, xe.isFragment = function(p) {
    return T(p) === n;
  }, xe.isLazy = function(p) {
    return T(p) === O;
  }, xe.isMemo = function(p) {
    return T(p) === k;
  }, xe.isPortal = function(p) {
    return T(p) === r;
  }, xe.isProfiler = function(p) {
    return T(p) === o;
  }, xe.isStrictMode = function(p) {
    return T(p) === a;
  }, xe.isSuspense = function(p) {
    return T(p) === m;
  }, xe.isValidElementType = function(p) {
    return typeof p == "string" || typeof p == "function" || p === n || p === u || p === o || p === a || p === m || p === h || typeof p == "object" && p !== null && (p.$$typeof === O || p.$$typeof === k || p.$$typeof === i || p.$$typeof === s || p.$$typeof === d || p.$$typeof === b || p.$$typeof === E || p.$$typeof === N || p.$$typeof === w);
  }, xe.typeOf = T, xe;
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
var Tc;
function J1() {
  return Tc || (Tc = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, d = e ? Symbol.for("react.forward_ref") : 60112, m = e ? Symbol.for("react.suspense") : 60113, h = e ? Symbol.for("react.suspense_list") : 60120, k = e ? Symbol.for("react.memo") : 60115, O = e ? Symbol.for("react.lazy") : 60116, w = e ? Symbol.for("react.block") : 60121, b = e ? Symbol.for("react.fundamental") : 60117, E = e ? Symbol.for("react.responder") : 60118, N = e ? Symbol.for("react.scope") : 60119;
    function T(v) {
      return typeof v == "string" || typeof v == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      v === n || v === u || v === o || v === a || v === m || v === h || typeof v == "object" && v !== null && (v.$$typeof === O || v.$$typeof === k || v.$$typeof === i || v.$$typeof === s || v.$$typeof === d || v.$$typeof === b || v.$$typeof === E || v.$$typeof === N || v.$$typeof === w);
    }
    function j(v) {
      if (typeof v == "object" && v !== null) {
        var ye = v.$$typeof;
        switch (ye) {
          case t:
            var De = v.type;
            switch (De) {
              case c:
              case u:
              case n:
              case o:
              case a:
              case m:
                return De;
              default:
                var Ze = De && De.$$typeof;
                switch (Ze) {
                  case s:
                  case d:
                  case O:
                  case k:
                  case i:
                    return Ze;
                  default:
                    return ye;
                }
            }
          case r:
            return ye;
        }
      }
    }
    var p = c, V = u, J = s, oe = i, me = t, ne = d, ge = n, F = O, be = k, ee = r, ce = o, G = a, U = m, Z = !1;
    function te(v) {
      return Z || (Z = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), g(v) || j(v) === c;
    }
    function g(v) {
      return j(v) === u;
    }
    function f(v) {
      return j(v) === s;
    }
    function x(v) {
      return j(v) === i;
    }
    function A(v) {
      return typeof v == "object" && v !== null && v.$$typeof === t;
    }
    function S(v) {
      return j(v) === d;
    }
    function C(v) {
      return j(v) === n;
    }
    function _(v) {
      return j(v) === O;
    }
    function $(v) {
      return j(v) === k;
    }
    function R(v) {
      return j(v) === r;
    }
    function M(v) {
      return j(v) === o;
    }
    function z(v) {
      return j(v) === a;
    }
    function Q(v) {
      return j(v) === m;
    }
    Se.AsyncMode = p, Se.ConcurrentMode = V, Se.ContextConsumer = J, Se.ContextProvider = oe, Se.Element = me, Se.ForwardRef = ne, Se.Fragment = ge, Se.Lazy = F, Se.Memo = be, Se.Portal = ee, Se.Profiler = ce, Se.StrictMode = G, Se.Suspense = U, Se.isAsyncMode = te, Se.isConcurrentMode = g, Se.isContextConsumer = f, Se.isContextProvider = x, Se.isElement = A, Se.isForwardRef = S, Se.isFragment = C, Se.isLazy = _, Se.isMemo = $, Se.isPortal = R, Se.isProfiler = M, Se.isStrictMode = z, Se.isSuspense = Q, Se.isValidElementType = T, Se.typeOf = j;
  }()), Se;
}
var jc;
function jd() {
  return jc || (jc = 1, process.env.NODE_ENV === "production" ? ro.exports = K1() : ro.exports = J1()), ro.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var no, Ic;
function Z1() {
  if (Ic) return no;
  Ic = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, r = Object.prototype.propertyIsEnumerable;
  function n(o) {
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
      var c = Object.getOwnPropertyNames(i).map(function(d) {
        return i[d];
      });
      if (c.join("") !== "0123456789")
        return !1;
      var u = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(d) {
        u[d] = d;
      }), Object.keys(Object.assign({}, u)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return no = a() ? Object.assign : function(o, i) {
    for (var s, c = n(o), u, d = 1; d < arguments.length; d++) {
      s = Object(arguments[d]);
      for (var m in s)
        t.call(s, m) && (c[m] = s[m]);
      if (e) {
        u = e(s);
        for (var h = 0; h < u.length; h++)
          r.call(s, u[h]) && (c[u[h]] = s[u[h]]);
      }
    }
    return c;
  }, no;
}
var ao, Rc;
function is() {
  if (Rc) return ao;
  Rc = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return ao = e, ao;
}
var Mc, zc;
function Id() {
  return zc || (zc = 1, Mc = Function.call.bind(Object.prototype.hasOwnProperty)), Mc;
}
var oo, Fc;
function Q1() {
  if (Fc) return oo;
  Fc = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ is(), r = {}, n = /* @__PURE__ */ Id();
    e = function(o) {
      var i = "Warning: " + o;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function a(o, i, s, c, u) {
    if (process.env.NODE_ENV !== "production") {
      for (var d in o)
        if (n(o, d)) {
          var m;
          try {
            if (typeof o[d] != "function") {
              var h = Error(
                (c || "React class") + ": " + s + " type `" + d + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[d] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw h.name = "Invariant Violation", h;
            }
            m = o[d](i, d, c, s, null, t);
          } catch (O) {
            m = O;
          }
          if (m && !(m instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + d + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof m + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), m instanceof Error && !(m.message in r)) {
            r[m.message] = !0;
            var k = u ? u() : "";
            e(
              "Failed " + s + " type: " + m.message + (k ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (r = {});
  }, oo = a, oo;
}
var io, Dc;
function e0() {
  if (Dc) return io;
  Dc = 1;
  var e = jd(), t = Z1(), r = /* @__PURE__ */ is(), n = /* @__PURE__ */ Id(), a = /* @__PURE__ */ Q1(), o = function() {
  };
  process.env.NODE_ENV !== "production" && (o = function(s) {
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
  return io = function(s, c) {
    var u = typeof Symbol == "function" && Symbol.iterator, d = "@@iterator";
    function m(g) {
      var f = g && (u && g[u] || g[d]);
      if (typeof f == "function")
        return f;
    }
    var h = "<<anonymous>>", k = {
      array: E("array"),
      bigint: E("bigint"),
      bool: E("boolean"),
      func: E("function"),
      number: E("number"),
      object: E("object"),
      string: E("string"),
      symbol: E("symbol"),
      any: N(),
      arrayOf: T,
      element: j(),
      elementType: p(),
      instanceOf: V,
      node: ne(),
      objectOf: oe,
      oneOf: J,
      oneOfType: me,
      shape: F,
      exact: be
    };
    function O(g, f) {
      return g === f ? g !== 0 || 1 / g === 1 / f : g !== g && f !== f;
    }
    function w(g, f) {
      this.message = g, this.data = f && typeof f == "object" ? f : {}, this.stack = "";
    }
    w.prototype = Error.prototype;
    function b(g) {
      if (process.env.NODE_ENV !== "production")
        var f = {}, x = 0;
      function A(C, _, $, R, M, z, Q) {
        if (R = R || h, z = z || $, Q !== r) {
          if (c) {
            var v = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw v.name = "Invariant Violation", v;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ye = R + ":" + $;
            !f[ye] && // Avoid spamming the console because they are often not actionable except for lib authors
            x < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + z + "` prop on `" + R + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), f[ye] = !0, x++);
          }
        }
        return _[$] == null ? C ? _[$] === null ? new w("The " + M + " `" + z + "` is marked as required " + ("in `" + R + "`, but its value is `null`.")) : new w("The " + M + " `" + z + "` is marked as required in " + ("`" + R + "`, but its value is `undefined`.")) : null : g(_, $, R, M, z);
      }
      var S = A.bind(null, !1);
      return S.isRequired = A.bind(null, !0), S;
    }
    function E(g) {
      function f(x, A, S, C, _, $) {
        var R = x[A], M = G(R);
        if (M !== g) {
          var z = U(R);
          return new w(
            "Invalid " + C + " `" + _ + "` of type " + ("`" + z + "` supplied to `" + S + "`, expected ") + ("`" + g + "`."),
            { expectedType: g }
          );
        }
        return null;
      }
      return b(f);
    }
    function N() {
      return b(i);
    }
    function T(g) {
      function f(x, A, S, C, _) {
        if (typeof g != "function")
          return new w("Property `" + _ + "` of component `" + S + "` has invalid PropType notation inside arrayOf.");
        var $ = x[A];
        if (!Array.isArray($)) {
          var R = G($);
          return new w("Invalid " + C + " `" + _ + "` of type " + ("`" + R + "` supplied to `" + S + "`, expected an array."));
        }
        for (var M = 0; M < $.length; M++) {
          var z = g($, M, S, C, _ + "[" + M + "]", r);
          if (z instanceof Error)
            return z;
        }
        return null;
      }
      return b(f);
    }
    function j() {
      function g(f, x, A, S, C) {
        var _ = f[x];
        if (!s(_)) {
          var $ = G(_);
          return new w("Invalid " + S + " `" + C + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return b(g);
    }
    function p() {
      function g(f, x, A, S, C) {
        var _ = f[x];
        if (!e.isValidElementType(_)) {
          var $ = G(_);
          return new w("Invalid " + S + " `" + C + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return b(g);
    }
    function V(g) {
      function f(x, A, S, C, _) {
        if (!(x[A] instanceof g)) {
          var $ = g.name || h, R = te(x[A]);
          return new w("Invalid " + C + " `" + _ + "` of type " + ("`" + R + "` supplied to `" + S + "`, expected ") + ("instance of `" + $ + "`."));
        }
        return null;
      }
      return b(f);
    }
    function J(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), i;
      function f(x, A, S, C, _) {
        for (var $ = x[A], R = 0; R < g.length; R++)
          if (O($, g[R]))
            return null;
        var M = JSON.stringify(g, function(z, Q) {
          var v = U(Q);
          return v === "symbol" ? String(Q) : Q;
        });
        return new w("Invalid " + C + " `" + _ + "` of value `" + String($) + "` " + ("supplied to `" + S + "`, expected one of " + M + "."));
      }
      return b(f);
    }
    function oe(g) {
      function f(x, A, S, C, _) {
        if (typeof g != "function")
          return new w("Property `" + _ + "` of component `" + S + "` has invalid PropType notation inside objectOf.");
        var $ = x[A], R = G($);
        if (R !== "object")
          return new w("Invalid " + C + " `" + _ + "` of type " + ("`" + R + "` supplied to `" + S + "`, expected an object."));
        for (var M in $)
          if (n($, M)) {
            var z = g($, M, S, C, _ + "." + M, r);
            if (z instanceof Error)
              return z;
          }
        return null;
      }
      return b(f);
    }
    function me(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var f = 0; f < g.length; f++) {
        var x = g[f];
        if (typeof x != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + Z(x) + " at index " + f + "."
          ), i;
      }
      function A(S, C, _, $, R) {
        for (var M = [], z = 0; z < g.length; z++) {
          var Q = g[z], v = Q(S, C, _, $, R, r);
          if (v == null)
            return null;
          v.data && n(v.data, "expectedType") && M.push(v.data.expectedType);
        }
        var ye = M.length > 0 ? ", expected one of type [" + M.join(", ") + "]" : "";
        return new w("Invalid " + $ + " `" + R + "` supplied to " + ("`" + _ + "`" + ye + "."));
      }
      return b(A);
    }
    function ne() {
      function g(f, x, A, S, C) {
        return ee(f[x]) ? null : new w("Invalid " + S + " `" + C + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return b(g);
    }
    function ge(g, f, x, A, S) {
      return new w(
        (g || "React class") + ": " + f + " type `" + x + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + S + "`."
      );
    }
    function F(g) {
      function f(x, A, S, C, _) {
        var $ = x[A], R = G($);
        if (R !== "object")
          return new w("Invalid " + C + " `" + _ + "` of type `" + R + "` " + ("supplied to `" + S + "`, expected `object`."));
        for (var M in g) {
          var z = g[M];
          if (typeof z != "function")
            return ge(S, C, _, M, U(z));
          var Q = z($, M, S, C, _ + "." + M, r);
          if (Q)
            return Q;
        }
        return null;
      }
      return b(f);
    }
    function be(g) {
      function f(x, A, S, C, _) {
        var $ = x[A], R = G($);
        if (R !== "object")
          return new w("Invalid " + C + " `" + _ + "` of type `" + R + "` " + ("supplied to `" + S + "`, expected `object`."));
        var M = t({}, x[A], g);
        for (var z in M) {
          var Q = g[z];
          if (n(g, z) && typeof Q != "function")
            return ge(S, C, _, z, U(Q));
          if (!Q)
            return new w(
              "Invalid " + C + " `" + _ + "` key `" + z + "` supplied to `" + S + "`.\nBad object: " + JSON.stringify(x[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(g), null, "  ")
            );
          var v = Q($, z, S, C, _ + "." + z, r);
          if (v)
            return v;
        }
        return null;
      }
      return b(f);
    }
    function ee(g) {
      switch (typeof g) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !g;
        case "object":
          if (Array.isArray(g))
            return g.every(ee);
          if (g === null || s(g))
            return !0;
          var f = m(g);
          if (f) {
            var x = f.call(g), A;
            if (f !== g.entries) {
              for (; !(A = x.next()).done; )
                if (!ee(A.value))
                  return !1;
            } else
              for (; !(A = x.next()).done; ) {
                var S = A.value;
                if (S && !ee(S[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function ce(g, f) {
      return g === "symbol" ? !0 : f ? f["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && f instanceof Symbol : !1;
    }
    function G(g) {
      var f = typeof g;
      return Array.isArray(g) ? "array" : g instanceof RegExp ? "object" : ce(f, g) ? "symbol" : f;
    }
    function U(g) {
      if (typeof g > "u" || g === null)
        return "" + g;
      var f = G(g);
      if (f === "object") {
        if (g instanceof Date)
          return "date";
        if (g instanceof RegExp)
          return "regexp";
      }
      return f;
    }
    function Z(g) {
      var f = U(g);
      switch (f) {
        case "array":
        case "object":
          return "an " + f;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + f;
        default:
          return f;
      }
    }
    function te(g) {
      return !g.constructor || !g.constructor.name ? h : g.constructor.name;
    }
    return k.checkPropTypes = a, k.resetWarningCache = a.resetWarningCache, k.PropTypes = k, k;
  }, io;
}
var so, Lc;
function t0() {
  if (Lc) return so;
  Lc = 1;
  var e = /* @__PURE__ */ is();
  function t() {
  }
  function r() {
  }
  return r.resetWarningCache = t, so = function() {
    function n(i, s, c, u, d, m) {
      if (m !== e) {
        var h = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw h.name = "Invariant Violation", h;
      }
    }
    n.isRequired = n;
    function a() {
      return n;
    }
    var o = {
      array: n,
      bigint: n,
      bool: n,
      func: n,
      number: n,
      object: n,
      string: n,
      symbol: n,
      any: n,
      arrayOf: a,
      element: n,
      elementType: n,
      instanceOf: a,
      node: n,
      objectOf: a,
      oneOf: a,
      oneOfType: a,
      shape: a,
      exact: a,
      checkPropTypes: r,
      resetWarningCache: t
    };
    return o.PropTypes = o, o;
  }, so;
}
var Wc;
function r0() {
  if (Wc) return Cn.exports;
  if (Wc = 1, process.env.NODE_ENV !== "production") {
    var e = jd(), t = !0;
    Cn.exports = /* @__PURE__ */ e0()(e.isElement, t);
  } else
    Cn.exports = /* @__PURE__ */ t0()();
  return Cn.exports;
}
var n0 = /* @__PURE__ */ r0();
const de = /* @__PURE__ */ X1(n0);
function Uc(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function et(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Uc(Object(r), !0).forEach(function(n) {
      mr(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : Uc(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function Kn(e) {
  "@babel/helpers - typeof";
  return Kn = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Kn(e);
}
function mr(e, t, r) {
  return t in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function a0(e, t) {
  if (e == null) return {};
  var r = {}, n = Object.keys(e), a, o;
  for (o = 0; o < n.length; o++)
    a = n[o], !(t.indexOf(a) >= 0) && (r[a] = e[a]);
  return r;
}
function o0(e, t) {
  if (e == null) return {};
  var r = a0(e, t), n, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      n = o[a], !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n]);
  }
  return r;
}
function ci(e) {
  return i0(e) || s0(e) || l0(e) || c0();
}
function i0(e) {
  if (Array.isArray(e)) return ui(e);
}
function s0(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function l0(e, t) {
  if (e) {
    if (typeof e == "string") return ui(e, t);
    var r = Object.prototype.toString.call(e).slice(8, -1);
    if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return ui(e, t);
  }
}
function ui(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
  return n;
}
function c0() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function u0(e) {
  var t, r = e.beat, n = e.fade, a = e.beatFade, o = e.bounce, i = e.shake, s = e.flash, c = e.spin, u = e.spinPulse, d = e.spinReverse, m = e.pulse, h = e.fixedWidth, k = e.inverse, O = e.border, w = e.listItem, b = e.flip, E = e.size, N = e.rotation, T = e.pull, j = (t = {
    "fa-beat": r,
    "fa-fade": n,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": d,
    "fa-spin-pulse": u,
    "fa-pulse": m,
    "fa-fw": h,
    "fa-inverse": k,
    "fa-border": O,
    "fa-li": w,
    "fa-flip": b === !0,
    "fa-flip-horizontal": b === "horizontal" || b === "both",
    "fa-flip-vertical": b === "vertical" || b === "both"
  }, mr(t, "fa-".concat(E), typeof E < "u" && E !== null), mr(t, "fa-rotate-".concat(N), typeof N < "u" && N !== null && N !== 0), mr(t, "fa-pull-".concat(T), typeof T < "u" && T !== null), mr(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(j).map(function(p) {
    return j[p] ? p : null;
  }).filter(function(p) {
    return p;
  });
}
function f0(e) {
  return e = e - 0, e === e;
}
function Rd(e) {
  return f0(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, r) {
    return r ? r.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var d0 = ["style"];
function p0(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function m0(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, r) {
    var n = r.indexOf(":"), a = Rd(r.slice(0, n)), o = r.slice(n + 1).trim();
    return a.startsWith("webkit") ? t[p0(a)] = o : t[a] = o, t;
  }, {});
}
function Md(e, t) {
  var r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var n = (t.children || []).map(function(c) {
    return Md(e, c);
  }), a = Object.keys(t.attributes || {}).reduce(function(c, u) {
    var d = t.attributes[u];
    switch (u) {
      case "class":
        c.attrs.className = d, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = m0(d);
        break;
      default:
        u.indexOf("aria-") === 0 || u.indexOf("data-") === 0 ? c.attrs[u.toLowerCase()] = d : c.attrs[Rd(u)] = d;
    }
    return c;
  }, {
    attrs: {}
  }), o = r.style, i = o === void 0 ? {} : o, s = o0(r, d0);
  return a.attrs.style = et(et({}, a.attrs.style), i), e.apply(void 0, [t.tag, et(et({}, a.attrs), s)].concat(ci(n)));
}
var zd = !1;
try {
  zd = process.env.NODE_ENV === "production";
} catch {
}
function g0() {
  if (!zd && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Yc(e) {
  if (e && Kn(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (li.icon)
    return li.icon(e);
  if (e === null)
    return null;
  if (e && Kn(e) === "object" && e.prefix && e.iconName)
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
function lo(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? mr({}, e, t) : {};
}
var Vc = {
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
}, ss = /* @__PURE__ */ Me.forwardRef(function(e, t) {
  var r = et(et({}, Vc), e), n = r.icon, a = r.mask, o = r.symbol, i = r.className, s = r.title, c = r.titleId, u = r.maskId, d = Yc(n), m = lo("classes", [].concat(ci(u0(r)), ci((i || "").split(" ")))), h = lo("transform", typeof r.transform == "string" ? li.transform(r.transform) : r.transform), k = lo("mask", Yc(a)), O = B1(d, et(et(et(et({}, m), h), k), {}, {
    symbol: o,
    title: s,
    titleId: c,
    maskId: u
  }));
  if (!O)
    return g0("Could not find icon", d), null;
  var w = O.abstract, b = {
    ref: t
  };
  return Object.keys(r).forEach(function(E) {
    Vc.hasOwnProperty(E) || (b[E] = r[E]);
  }), h0(w[0], b);
});
ss.displayName = "FontAwesomeIcon";
ss.propTypes = {
  beat: de.bool,
  border: de.bool,
  beatFade: de.bool,
  bounce: de.bool,
  className: de.string,
  fade: de.bool,
  flash: de.bool,
  mask: de.oneOfType([de.object, de.array, de.string]),
  maskId: de.string,
  fixedWidth: de.bool,
  inverse: de.bool,
  flip: de.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: de.oneOfType([de.object, de.array, de.string]),
  listItem: de.bool,
  pull: de.oneOf(["right", "left"]),
  pulse: de.bool,
  rotation: de.oneOf([0, 90, 180, 270]),
  shake: de.bool,
  size: de.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: de.bool,
  spinPulse: de.bool,
  spinReverse: de.bool,
  symbol: de.oneOfType([de.bool, de.string]),
  title: de.string,
  titleId: de.string,
  transform: de.oneOfType([de.string, de.object]),
  swapOpacity: de.bool
};
var h0 = Md.bind(null, Me.createElement);
const ls = "-", b0 = (e) => {
  const t = v0(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (a) => {
      const o = a.split(ls);
      return o[0] === "" && o.length !== 1 && o.shift(), Fd(o, t) || y0(a);
    },
    getConflictingClassGroupIds: (a, o) => {
      const i = r[a] || [];
      return o && n[a] ? [...i, ...n[a]] : i;
    }
  };
}, Fd = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], a = t.nextPart.get(n), o = a ? Fd(e.slice(1), a) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const i = e.join(ls);
  return (r = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : r.classGroupId;
}, Hc = /^\[(.+)\]$/, y0 = (e) => {
  if (Hc.test(e)) {
    const t = Hc.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, v0 = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return w0(Object.entries(e.classGroups), r).forEach(([a, o]) => {
    fi(o, n, a, t);
  }), n;
}, fi = (e, t, r, n) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : qc(t, a);
      o.classGroupId = r;
      return;
    }
    if (typeof a == "function") {
      if (x0(a)) {
        fi(a(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: r
      });
      return;
    }
    Object.entries(a).forEach(([o, i]) => {
      fi(i, qc(t, o), r, n);
    });
  });
}, qc = (e, t) => {
  let r = e;
  return t.split(ls).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, x0 = (e) => e.isThemeGetter, w0 = (e, t) => t ? e.map(([r, n]) => {
  const a = n.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([i, s]) => [t + i, s])) : o);
  return [r, a];
}) : e, k0 = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const a = (o, i) => {
    r.set(o, i), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(o) {
      let i = r.get(o);
      if (i !== void 0)
        return i;
      if ((i = n.get(o)) !== void 0)
        return a(o, i), i;
    },
    set(o, i) {
      r.has(o) ? r.set(o, i) : a(o, i);
    }
  };
}, Dd = "!", O0 = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, a = t[0], o = t.length, i = (s) => {
    const c = [];
    let u = 0, d = 0, m;
    for (let b = 0; b < s.length; b++) {
      let E = s[b];
      if (u === 0) {
        if (E === a && (n || s.slice(b, b + o) === t)) {
          c.push(s.slice(d, b)), d = b + o;
          continue;
        }
        if (E === "/") {
          m = b;
          continue;
        }
      }
      E === "[" ? u++ : E === "]" && u--;
    }
    const h = c.length === 0 ? s : s.substring(d), k = h.startsWith(Dd), O = k ? h.substring(1) : h, w = m && m > d ? m - d : void 0;
    return {
      modifiers: c,
      hasImportantModifier: k,
      baseClassName: O,
      maybePostfixModifierPosition: w
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, S0 = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, E0 = (e) => ({
  cache: k0(e.cacheSize),
  parseClassName: O0(e),
  ...b0(e)
}), A0 = /\s+/, P0 = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: a
  } = t, o = [], i = e.trim().split(A0);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const u = i[c], {
      modifiers: d,
      hasImportantModifier: m,
      baseClassName: h,
      maybePostfixModifierPosition: k
    } = r(u);
    let O = !!k, w = n(O ? h.substring(0, k) : h);
    if (!w) {
      if (!O) {
        s = u + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (w = n(h), !w) {
        s = u + (s.length > 0 ? " " + s : s);
        continue;
      }
      O = !1;
    }
    const b = S0(d).join(":"), E = m ? b + Dd : b, N = E + w;
    if (o.includes(N))
      continue;
    o.push(N);
    const T = a(w, O);
    for (let j = 0; j < T.length; ++j) {
      const p = T[j];
      o.push(E + p);
    }
    s = u + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function C0() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = Ld(t)) && (n && (n += " "), n += r);
  return n;
}
const Ld = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = Ld(e[n])) && (r && (r += " "), r += t);
  return r;
};
function $0(e, ...t) {
  let r, n, a, o = i;
  function i(c) {
    const u = t.reduce((d, m) => m(d), e());
    return r = E0(u), n = r.cache.get, a = r.cache.set, o = s, s(c);
  }
  function s(c) {
    const u = n(c);
    if (u)
      return u;
    const d = P0(c, r);
    return a(c, d), d;
  }
  return function() {
    return o(C0.apply(null, arguments));
  };
}
const Ce = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, Wd = /^\[(?:([a-z-]+):)?(.+)\]$/i, N0 = /^\d+\/\d+$/, _0 = /* @__PURE__ */ new Set(["px", "full", "screen"]), T0 = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, j0 = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, I0 = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, R0 = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, M0 = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, ut = (e) => wr(e) || _0.has(e) || N0.test(e), Ct = (e) => Nr(e, "length", V0), wr = (e) => !!e && !Number.isNaN(Number(e)), co = (e) => Nr(e, "number", wr), Dr = (e) => !!e && Number.isInteger(Number(e)), z0 = (e) => e.endsWith("%") && wr(e.slice(0, -1)), le = (e) => Wd.test(e), $t = (e) => T0.test(e), F0 = /* @__PURE__ */ new Set(["length", "size", "percentage"]), D0 = (e) => Nr(e, F0, Ud), L0 = (e) => Nr(e, "position", Ud), W0 = /* @__PURE__ */ new Set(["image", "url"]), U0 = (e) => Nr(e, W0, q0), Y0 = (e) => Nr(e, "", H0), Lr = () => !0, Nr = (e, t, r) => {
  const n = Wd.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, V0 = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  j0.test(e) && !I0.test(e)
), Ud = () => !1, H0 = (e) => R0.test(e), q0 = (e) => M0.test(e), G0 = () => {
  const e = Ce("colors"), t = Ce("spacing"), r = Ce("blur"), n = Ce("brightness"), a = Ce("borderColor"), o = Ce("borderRadius"), i = Ce("borderSpacing"), s = Ce("borderWidth"), c = Ce("contrast"), u = Ce("grayscale"), d = Ce("hueRotate"), m = Ce("invert"), h = Ce("gap"), k = Ce("gradientColorStops"), O = Ce("gradientColorStopPositions"), w = Ce("inset"), b = Ce("margin"), E = Ce("opacity"), N = Ce("padding"), T = Ce("saturate"), j = Ce("scale"), p = Ce("sepia"), V = Ce("skew"), J = Ce("space"), oe = Ce("translate"), me = () => ["auto", "contain", "none"], ne = () => ["auto", "hidden", "clip", "visible", "scroll"], ge = () => ["auto", le, t], F = () => [le, t], be = () => ["", ut, Ct], ee = () => ["auto", wr, le], ce = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], G = () => ["solid", "dashed", "dotted", "double", "none"], U = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], Z = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], te = () => ["", "0", le], g = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], f = () => [wr, le];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Lr],
      spacing: [ut, Ct],
      blur: ["none", "", $t, le],
      brightness: f(),
      borderColor: [e],
      borderRadius: ["none", "", "full", $t, le],
      borderSpacing: F(),
      borderWidth: be(),
      contrast: f(),
      grayscale: te(),
      hueRotate: f(),
      invert: te(),
      gap: F(),
      gradientColorStops: [e],
      gradientColorStopPositions: [z0, Ct],
      inset: ge(),
      margin: ge(),
      opacity: f(),
      padding: F(),
      saturate: f(),
      scale: f(),
      sepia: te(),
      skew: f(),
      space: F(),
      translate: F()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", le]
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
        columns: [$t]
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
        object: [...ce(), le]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: ne()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": ne()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": ne()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: me()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": me()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": me()
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
        inset: [w]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [w]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [w]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [w]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [w]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [w]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [w]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [w]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [w]
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
        z: ["auto", Dr, le]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ge()
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
        flex: ["1", "auto", "initial", "none", le]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: te()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: te()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Dr, le]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Lr]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Dr, le]
        }, le]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": ee()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": ee()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Lr]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Dr, le]
        }, le]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": ee()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": ee()
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
        "auto-cols": ["auto", "min", "max", "fr", le]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", le]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [h]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [h]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [h]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...Z()]
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
        content: ["normal", ...Z(), "baseline"]
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
        "place-content": [...Z(), "baseline"]
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
        p: [N]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [N]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [N]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [N]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [N]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [N]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [N]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [N]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [N]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [b]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [b]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [b]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [b]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [b]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [b]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [b]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [b]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [b]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [J]
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
        "space-y": [J]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", le, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [le, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [le, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [$t]
        }, $t]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [le, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [le, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [le, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [le, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", $t, Ct]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", co]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Lr]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", le]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", wr, co]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", ut, le]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", le]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", le]
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
        "placeholder-opacity": [E]
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
        "text-opacity": [E]
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
        decoration: [...G(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", ut, Ct]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", ut, le]
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
        indent: F()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", le]
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
        content: ["none", le]
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
        "bg-opacity": [E]
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
        bg: [...ce(), L0]
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
        bg: ["auto", "cover", "contain", D0]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, U0]
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
        from: [O]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [O]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [O]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [k]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [k]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [k]
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
        "border-opacity": [E]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...G(), "hidden"]
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
        "divide-opacity": [E]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: G()
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
        outline: ["", ...G()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [ut, le]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [ut, Ct]
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
        ring: be()
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
        "ring-opacity": [E]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [ut, Ct]
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
        shadow: ["", "inner", "none", $t, Y0]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Lr]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [E]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...U(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": U()
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
        "drop-shadow": ["", "none", $t, le]
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
        "hue-rotate": [d]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [m]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [T]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [p]
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
        "backdrop-grayscale": [u]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [d]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [m]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [E]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [T]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [p]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", le]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: f()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", le]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: f()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", le]
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
        scale: [j]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [j]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [j]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [Dr, le]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [oe]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [oe]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [V]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [V]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", le]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", le]
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
        "scroll-m": F()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": F()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": F()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": F()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": F()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": F()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": F()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": F()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": F()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": F()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": F()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": F()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": F()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": F()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": F()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": F()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": F()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": F()
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
        "will-change": ["auto", "scroll", "contents", "transform", le]
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
        stroke: [ut, Ct, co]
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
}, B0 = /* @__PURE__ */ $0(G0), X0 = ({
  className: e,
  children: t,
  required: r,
  ...n
}) => /* @__PURE__ */ $e(
  "label",
  {
    className: B0("text-base-fg mb-2 text-[15px] font-medium", e),
    ...n,
    children: [
      t,
      r && /* @__PURE__ */ q("span", { className: "ml-0.5 text-[#ff6467]", children: "*" })
    ]
  }
), ur = Me.forwardRef(
  ({
    label: e,
    icon: t,
    inputClassName: r,
    iconClassName: n,
    className: a,
    id: o,
    isError: i,
    onBlur: s,
    onFocus: c,
    errorMessage: u,
    ...d
  }, m) => /* @__PURE__ */ $e("div", { className: Ka("flex flex-col", a), children: [
    e && /* @__PURE__ */ q(X0, { htmlFor: o || e, children: e }),
    /* @__PURE__ */ $e("div", { className: "relative w-full", children: [
      t && /* @__PURE__ */ q(
        ss,
        {
          icon: t,
          className: Ka("text-md absolute pl-3 pt-3", n)
        }
      ),
      /* @__PURE__ */ q(
        "input",
        {
          ref: m,
          id: o || e || void 0,
          className: Ka(
            "h-10 w-full rounded-lg px-3 py-2.5 outline-none",
            "bg-ui-panel text-base-fg placeholder-base-fg/50",
            "border border-ui-panel-border transition-all duration-150 ease-in-out hover:border-primary/60 focus:border-primary focus:!outline-none",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-ui-panel-border",
            t && "pl-10",
            i && "outline-red focus:outline-red",
            r
          ),
          onFocus: (h) => {
            c && c(h);
          },
          onBlur: (h) => {
            s && s(h);
          },
          ...d
        }
      ),
      u && /* @__PURE__ */ q("h6", { className: "absolute z-10 text-red", children: u })
    ] })
  ] })
);
ur.displayName = "Input";
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function K0(e, t, r) {
  return (t = Z0(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function Gc(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function W(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Gc(Object(r), !0).forEach(function(n) {
      K0(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : Gc(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function J0(e, t) {
  if (typeof e != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(e, t);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Z0(e) {
  var t = J0(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Bc = () => {
};
let cs = {}, Yd = {}, Vd = null, Hd = {
  mark: Bc,
  measure: Bc
};
try {
  typeof window < "u" && (cs = window), typeof document < "u" && (Yd = document), typeof MutationObserver < "u" && (Vd = MutationObserver), typeof performance < "u" && (Hd = performance);
} catch {
}
const {
  userAgent: Xc = ""
} = cs.navigator || {}, Wt = cs, Te = Yd, Kc = Vd, $n = Hd;
Wt.document;
const xt = !!Te.documentElement && !!Te.head && typeof Te.addEventListener == "function" && typeof Te.createElement == "function", qd = ~Xc.indexOf("MSIE") || ~Xc.indexOf("Trident/");
var Q0 = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, ex = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Gd = {
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
}, tx = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Bd = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Ye = "classic", ba = "duotone", rx = "sharp", nx = "sharp-duotone", Xd = [Ye, ba, rx, nx], ax = {
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
}, ox = {
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
}, ix = /* @__PURE__ */ new Map([["classic", {
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
}]]), sx = {
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
}, lx = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Jc = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, cx = ["kit"], ux = {
  kit: {
    "fa-kit": "fak"
  }
}, fx = ["fak", "fakd"], dx = {
  kit: {
    fak: "fa-kit"
  }
}, Zc = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Nn = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, px = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], mx = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], gx = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, hx = {
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
}, bx = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, di = {
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
}, yx = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], pi = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...px, ...yx], vx = ["solid", "regular", "light", "thin", "duotone", "brands"], Kd = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], xx = Kd.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), wx = [...Object.keys(bx), ...vx, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Nn.GROUP, Nn.SWAP_OPACITY, Nn.PRIMARY, Nn.SECONDARY].concat(Kd.map((e) => "".concat(e, "x"))).concat(xx.map((e) => "w-".concat(e))), kx = {
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
const ht = "___FONT_AWESOME___", mi = 16, Jd = "fa", Zd = "svg-inline--fa", rr = "data-fa-i2svg", gi = "data-fa-pseudo-element", Ox = "data-fa-pseudo-element-pending", us = "data-prefix", fs = "data-icon", Qc = "fontawesome-i2svg", Sx = "async", Ex = ["HTML", "HEAD", "STYLE", "SCRIPT"], Qd = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function un(e) {
  return new Proxy(e, {
    get(t, r) {
      return r in t ? t[r] : t[Ye];
    }
  });
}
const ep = W({}, Gd);
ep[Ye] = W(W(W(W({}, {
  "fa-duotone": "duotone"
}), Gd[Ye]), Jc.kit), Jc["kit-duotone"]);
const Ax = un(ep), hi = W({}, sx);
hi[Ye] = W(W(W(W({}, {
  duotone: "fad"
}), hi[Ye]), Zc.kit), Zc["kit-duotone"]);
const eu = un(hi), bi = W({}, di);
bi[Ye] = W(W({}, bi[Ye]), dx.kit);
const ds = un(bi), yi = W({}, hx);
yi[Ye] = W(W({}, yi[Ye]), ux.kit);
un(yi);
const Px = Q0, tp = "fa-layers-text", Cx = ex, $x = W({}, ax);
un($x);
const Nx = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], uo = tx, _x = [...cx, ...wx], Jr = Wt.FontAwesomeConfig || {};
function Tx(e) {
  var t = Te.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function jx(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
Te && typeof Te.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [r, n] = t;
  const a = jx(Tx(r));
  a != null && (Jr[n] = a);
});
const rp = {
  styleDefault: "solid",
  familyDefault: Ye,
  cssPrefix: Jd,
  replacementClass: Zd,
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
Jr.familyPrefix && (Jr.cssPrefix = Jr.familyPrefix);
const Er = W(W({}, rp), Jr);
Er.autoReplaceSvg || (Er.observeMutations = !1);
const K = {};
Object.keys(rp).forEach((e) => {
  Object.defineProperty(K, e, {
    enumerable: !0,
    set: function(t) {
      Er[e] = t, Zr.forEach((r) => r(K));
    },
    get: function() {
      return Er[e];
    }
  });
});
Object.defineProperty(K, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    Er.cssPrefix = e, Zr.forEach((t) => t(K));
  },
  get: function() {
    return Er.cssPrefix;
  }
});
Wt.FontAwesomeConfig = K;
const Zr = [];
function Ix(e) {
  return Zr.push(e), () => {
    Zr.splice(Zr.indexOf(e), 1);
  };
}
const Nt = mi, it = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function Rx(e) {
  if (!e || !xt)
    return;
  const t = Te.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const r = Te.head.childNodes;
  let n = null;
  for (let a = r.length - 1; a > -1; a--) {
    const o = r[a], i = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (n = o);
  }
  return Te.head.insertBefore(t, n), e;
}
const Mx = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function nn() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += Mx[Math.random() * 62 | 0];
  return t;
}
function _r(e) {
  const t = [];
  for (let r = (e || []).length >>> 0; r--; )
    t[r] = e[r];
  return t;
}
function ps(e) {
  return e.classList ? _r(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function np(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function zx(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, '="').concat(np(e[r]), '" '), "").trim();
}
function ya(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, ": ").concat(e[r].trim(), ";"), "");
}
function ms(e) {
  return e.size !== it.size || e.x !== it.x || e.y !== it.y || e.rotate !== it.rotate || e.flipX || e.flipY;
}
function Fx(e) {
  let {
    transform: t,
    containerWidth: r,
    iconWidth: n
  } = e;
  const a = {
    transform: "translate(".concat(r / 2, " 256)")
  }, o = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), c = {
    transform: "".concat(o, " ").concat(i, " ").concat(s)
  }, u = {
    transform: "translate(".concat(n / 2 * -1, " -256)")
  };
  return {
    outer: a,
    inner: c,
    path: u
  };
}
function Dx(e) {
  let {
    transform: t,
    width: r = mi,
    height: n = mi,
    startCentered: a = !1
  } = e, o = "";
  return a && qd ? o += "translate(".concat(t.x / Nt - r / 2, "em, ").concat(t.y / Nt - n / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / Nt, "em), calc(-50% + ").concat(t.y / Nt, "em)) ") : o += "translate(".concat(t.x / Nt, "em, ").concat(t.y / Nt, "em) "), o += "scale(".concat(t.size / Nt * (t.flipX ? -1 : 1), ", ").concat(t.size / Nt * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var Lx = `:root, :host {
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
function ap() {
  const e = Jd, t = Zd, r = K.cssPrefix, n = K.replacementClass;
  let a = Lx;
  if (r !== e || n !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(r, "-")).replace(i, "--".concat(r, "-")).replace(s, ".".concat(n));
  }
  return a;
}
let tu = !1;
function fo() {
  K.autoAddCss && !tu && (Rx(ap()), tu = !0);
}
var Wx = {
  mixout() {
    return {
      dom: {
        css: ap,
        insertCss: fo
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        fo();
      },
      beforeI2svg() {
        fo();
      }
    };
  }
};
const bt = Wt || {};
bt[ht] || (bt[ht] = {});
bt[ht].styles || (bt[ht].styles = {});
bt[ht].hooks || (bt[ht].hooks = {});
bt[ht].shims || (bt[ht].shims = []);
var st = bt[ht];
const op = [], ip = function() {
  Te.removeEventListener("DOMContentLoaded", ip), Jn = 1, op.map((e) => e());
};
let Jn = !1;
xt && (Jn = (Te.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(Te.readyState), Jn || Te.addEventListener("DOMContentLoaded", ip));
function Ux(e) {
  xt && (Jn ? setTimeout(e, 0) : op.push(e));
}
function fn(e) {
  const {
    tag: t,
    attributes: r = {},
    children: n = []
  } = e;
  return typeof e == "string" ? np(e) : "<".concat(t, " ").concat(zx(r), ">").concat(n.map(fn).join(""), "</").concat(t, ">");
}
function ru(e, t, r) {
  if (e && e[t] && e[t][r])
    return {
      prefix: t,
      iconName: r,
      icon: e[t][r]
    };
}
var po = function(t, r, n, a) {
  var o = Object.keys(t), i = o.length, s = r, c, u, d;
  for (n === void 0 ? (c = 1, d = t[o[0]]) : (c = 0, d = n); c < i; c++)
    u = o[c], d = s(d, t[u], u, t);
  return d;
};
function Yx(e) {
  const t = [];
  let r = 0;
  const n = e.length;
  for (; r < n; ) {
    const a = e.charCodeAt(r++);
    if (a >= 55296 && a <= 56319 && r < n) {
      const o = e.charCodeAt(r++);
      (o & 64512) == 56320 ? t.push(((a & 1023) << 10) + (o & 1023) + 65536) : (t.push(a), r--);
    } else
      t.push(a);
  }
  return t;
}
function vi(e) {
  const t = Yx(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function Vx(e, t) {
  const r = e.length;
  let n = e.charCodeAt(t), a;
  return n >= 55296 && n <= 56319 && r > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (n - 55296) * 1024 + a - 56320 + 65536 : n;
}
function nu(e) {
  return Object.keys(e).reduce((t, r) => {
    const n = e[r];
    return !!n.icon ? t[n.iconName] = n.icon : t[r] = n, t;
  }, {});
}
function xi(e, t) {
  let r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: n = !1
  } = r, a = nu(t);
  typeof st.hooks.addPack == "function" && !n ? st.hooks.addPack(e, nu(t)) : st.styles[e] = W(W({}, st.styles[e] || {}), a), e === "fas" && xi("fa", t);
}
const {
  styles: an,
  shims: Hx
} = st, sp = Object.keys(ds), qx = sp.reduce((e, t) => (e[t] = Object.keys(ds[t]), e), {});
let gs = null, lp = {}, cp = {}, up = {}, fp = {}, dp = {};
function Gx(e) {
  return ~_x.indexOf(e);
}
function Bx(e, t) {
  const r = t.split("-"), n = r[0], a = r.slice(1).join("-");
  return n === e && a !== "" && !Gx(a) ? a : null;
}
const pp = () => {
  const e = (n) => po(an, (a, o, i) => (a[i] = po(o, n, {}), a), {});
  lp = e((n, a, o) => (a[3] && (n[a[3]] = o), a[2] && a[2].filter((s) => typeof s == "number").forEach((s) => {
    n[s.toString(16)] = o;
  }), n)), cp = e((n, a, o) => (n[o] = o, a[2] && a[2].filter((s) => typeof s == "string").forEach((s) => {
    n[s] = o;
  }), n)), dp = e((n, a, o) => {
    const i = a[2];
    return n[o] = o, i.forEach((s) => {
      n[s] = o;
    }), n;
  });
  const t = "far" in an || K.autoFetchSvg, r = po(Hx, (n, a) => {
    const o = a[0];
    let i = a[1];
    const s = a[2];
    return i === "far" && !t && (i = "fas"), typeof o == "string" && (n.names[o] = {
      prefix: i,
      iconName: s
    }), typeof o == "number" && (n.unicodes[o.toString(16)] = {
      prefix: i,
      iconName: s
    }), n;
  }, {
    names: {},
    unicodes: {}
  });
  up = r.names, fp = r.unicodes, gs = va(K.styleDefault, {
    family: K.familyDefault
  });
};
Ix((e) => {
  gs = va(e.styleDefault, {
    family: K.familyDefault
  });
});
pp();
function hs(e, t) {
  return (lp[e] || {})[t];
}
function Xx(e, t) {
  return (cp[e] || {})[t];
}
function Kt(e, t) {
  return (dp[e] || {})[t];
}
function mp(e) {
  return up[e] || {
    prefix: null,
    iconName: null
  };
}
function Kx(e) {
  const t = fp[e], r = hs("fas", e);
  return t || (r ? {
    prefix: "fas",
    iconName: r
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Ut() {
  return gs;
}
const gp = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function Jx(e) {
  let t = Ye;
  const r = sp.reduce((n, a) => (n[a] = "".concat(K.cssPrefix, "-").concat(a), n), {});
  return Xd.forEach((n) => {
    (e.includes(r[n]) || e.some((a) => qx[n].includes(a))) && (t = n);
  }), t;
}
function va(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: r = Ye
  } = t, n = Ax[r][e];
  if (r === ba && !e)
    return "fad";
  const a = eu[r][e] || eu[r][n], o = e in st.styles ? e : null;
  return a || o || null;
}
function Zx(e) {
  let t = [], r = null;
  return e.forEach((n) => {
    const a = Bx(K.cssPrefix, n);
    a ? r = a : n && t.push(n);
  }), {
    iconName: r,
    rest: t
  };
}
function au(e) {
  return e.sort().filter((t, r, n) => n.indexOf(t) === r);
}
function xa(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: r = !1
  } = t;
  let n = null;
  const a = pi.concat(mx), o = au(e.filter((m) => a.includes(m))), i = au(e.filter((m) => !pi.includes(m))), s = o.filter((m) => (n = m, !Bd.includes(m))), [c = null] = s, u = Jx(o), d = W(W({}, Zx(i)), {}, {
    prefix: va(c, {
      family: u
    })
  });
  return W(W(W({}, d), rw({
    values: e,
    family: u,
    styles: an,
    config: K,
    canonical: d,
    givenPrefix: n
  })), Qx(r, n, d));
}
function Qx(e, t, r) {
  let {
    prefix: n,
    iconName: a
  } = r;
  if (e || !n || !a)
    return {
      prefix: n,
      iconName: a
    };
  const o = t === "fa" ? mp(a) : {}, i = Kt(n, a);
  return a = o.iconName || i || a, n = o.prefix || n, n === "far" && !an.far && an.fas && !K.autoFetchSvg && (n = "fas"), {
    prefix: n,
    iconName: a
  };
}
const ew = Xd.filter((e) => e !== Ye || e !== ba), tw = Object.keys(di).filter((e) => e !== Ye).map((e) => Object.keys(di[e])).flat();
function rw(e) {
  const {
    values: t,
    family: r,
    canonical: n,
    givenPrefix: a = "",
    styles: o = {},
    config: i = {}
  } = e, s = r === ba, c = t.includes("fa-duotone") || t.includes("fad"), u = i.familyDefault === "duotone", d = n.prefix === "fad" || n.prefix === "fa-duotone";
  if (!s && (c || u || d) && (n.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (n.prefix = "fab"), !n.prefix && ew.includes(r) && (Object.keys(o).find((h) => tw.includes(h)) || i.autoFetchSvg)) {
    const h = ix.get(r).defaultShortPrefixId;
    n.prefix = h, n.iconName = Kt(n.prefix, n.iconName) || n.iconName;
  }
  return (n.prefix === "fa" || a === "fa") && (n.prefix = Ut() || "fas"), n;
}
class nw {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
      r[n] = arguments[n];
    const a = r.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = W(W({}, this.definitions[o] || {}), a[o]), xi(o, a[o]);
      const i = ds[Ye][o];
      i && xi(i, a[o]), pp();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, r) {
    const n = r.prefix && r.iconName && r.icon ? {
      0: r
    } : r;
    return Object.keys(n).map((a) => {
      const {
        prefix: o,
        iconName: i,
        icon: s
      } = n[a], c = s[2];
      t[o] || (t[o] = {}), c.length > 0 && c.forEach((u) => {
        typeof u == "string" && (t[o][u] = s);
      }), t[o][i] = s;
    }), t;
  }
}
let ou = [], gr = {};
const kr = {}, aw = Object.keys(kr);
function ow(e, t) {
  let {
    mixoutsTo: r
  } = t;
  return ou = e, gr = {}, Object.keys(kr).forEach((n) => {
    aw.indexOf(n) === -1 && delete kr[n];
  }), ou.forEach((n) => {
    const a = n.mixout ? n.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (r[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((i) => {
        r[o] || (r[o] = {}), r[o][i] = a[o][i];
      });
    }), n.hooks) {
      const o = n.hooks();
      Object.keys(o).forEach((i) => {
        gr[i] || (gr[i] = []), gr[i].push(o[i]);
      });
    }
    n.provides && n.provides(kr);
  }), r;
}
function wi(e, t) {
  for (var r = arguments.length, n = new Array(r > 2 ? r - 2 : 0), a = 2; a < r; a++)
    n[a - 2] = arguments[a];
  return (gr[e] || []).forEach((i) => {
    t = i.apply(null, [t, ...n]);
  }), t;
}
function nr(e) {
  for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++)
    r[n - 1] = arguments[n];
  (gr[e] || []).forEach((o) => {
    o.apply(null, r);
  });
}
function Yt() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return kr[e] ? kr[e].apply(null, t) : void 0;
}
function ki(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const r = e.prefix || Ut();
  if (t)
    return t = Kt(r, t) || t, ru(hp.definitions, r, t) || ru(st.styles, r, t);
}
const hp = new nw(), iw = () => {
  K.autoReplaceSvg = !1, K.observeMutations = !1, nr("noAuto");
}, sw = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return xt ? (nr("beforeI2svg", e), Yt("pseudoElements2svg", e), Yt("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    K.autoReplaceSvg === !1 && (K.autoReplaceSvg = !0), K.observeMutations = !0, Ux(() => {
      cw({
        autoReplaceSvgRoot: t
      }), nr("watch", e);
    });
  }
}, lw = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Kt(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], r = va(e[0]);
      return {
        prefix: r,
        iconName: Kt(r, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(K.cssPrefix, "-")) > -1 || e.match(Px))) {
      const t = xa(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Ut(),
        iconName: Kt(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Ut();
      return {
        prefix: t,
        iconName: Kt(t, e) || e
      };
    }
  }
}, Ke = {
  noAuto: iw,
  config: K,
  dom: sw,
  parse: lw,
  library: hp,
  findIconDefinition: ki,
  toHtml: fn
}, cw = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = Te
  } = e;
  (Object.keys(st.styles).length > 0 || K.autoFetchSvg) && xt && K.autoReplaceSvg && Ke.dom.i2svg({
    node: t
  });
};
function wa(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((r) => fn(r));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!xt) return;
      const r = Te.createElement("div");
      return r.innerHTML = e.html, r.children;
    }
  }), e;
}
function uw(e) {
  let {
    children: t,
    main: r,
    mask: n,
    attributes: a,
    styles: o,
    transform: i
  } = e;
  if (ms(i) && r.found && !n.found) {
    const {
      width: s,
      height: c
    } = r, u = {
      x: s / c / 2,
      y: 0.5
    };
    a.style = ya(W(W({}, o), {}, {
      "transform-origin": "".concat(u.x + i.x / 16, "em ").concat(u.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function fw(e) {
  let {
    prefix: t,
    iconName: r,
    children: n,
    attributes: a,
    symbol: o
  } = e;
  const i = o === !0 ? "".concat(t, "-").concat(K.cssPrefix, "-").concat(r) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: W(W({}, a), {}, {
        id: i
      }),
      children: n
    }]
  }];
}
function bs(e) {
  const {
    icons: {
      main: t,
      mask: r
    },
    prefix: n,
    iconName: a,
    transform: o,
    symbol: i,
    title: s,
    maskId: c,
    titleId: u,
    extra: d,
    watchable: m = !1
  } = e, {
    width: h,
    height: k
  } = r.found ? r : t, O = fx.includes(n), w = [K.replacementClass, a ? "".concat(K.cssPrefix, "-").concat(a) : ""].filter((p) => d.classes.indexOf(p) === -1).filter((p) => p !== "" || !!p).concat(d.classes).join(" ");
  let b = {
    children: [],
    attributes: W(W({}, d.attributes), {}, {
      "data-prefix": n,
      "data-icon": a,
      class: w,
      role: d.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(h, " ").concat(k)
    })
  };
  const E = O && !~d.classes.indexOf("fa-fw") ? {
    width: "".concat(h / k * 16 * 0.0625, "em")
  } : {};
  m && (b.attributes[rr] = ""), s && (b.children.push({
    tag: "title",
    attributes: {
      id: b.attributes["aria-labelledby"] || "title-".concat(u || nn())
    },
    children: [s]
  }), delete b.attributes.title);
  const N = W(W({}, b), {}, {
    prefix: n,
    iconName: a,
    main: t,
    mask: r,
    maskId: c,
    transform: o,
    symbol: i,
    styles: W(W({}, E), d.styles)
  }), {
    children: T,
    attributes: j
  } = r.found && t.found ? Yt("generateAbstractMask", N) || {
    children: [],
    attributes: {}
  } : Yt("generateAbstractIcon", N) || {
    children: [],
    attributes: {}
  };
  return N.children = T, N.attributes = j, i ? fw(N) : uw(N);
}
function iu(e) {
  const {
    content: t,
    width: r,
    height: n,
    transform: a,
    title: o,
    extra: i,
    watchable: s = !1
  } = e, c = W(W(W({}, i.attributes), o ? {
    title: o
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[rr] = "");
  const u = W({}, i.styles);
  ms(a) && (u.transform = Dx({
    transform: a,
    startCentered: !0,
    width: r,
    height: n
  }), u["-webkit-transform"] = u.transform);
  const d = ya(u);
  d.length > 0 && (c.style = d);
  const m = [];
  return m.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), o && m.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), m;
}
function dw(e) {
  const {
    content: t,
    title: r,
    extra: n
  } = e, a = W(W(W({}, n.attributes), r ? {
    title: r
  } : {}), {}, {
    class: n.classes.join(" ")
  }), o = ya(n.styles);
  o.length > 0 && (a.style = o);
  const i = [];
  return i.push({
    tag: "span",
    attributes: a,
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
  styles: mo
} = st;
function Oi(e) {
  const t = e[0], r = e[1], [n] = e.slice(4);
  let a = null;
  return Array.isArray(n) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(K.cssPrefix, "-").concat(uo.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(K.cssPrefix, "-").concat(uo.SECONDARY),
        fill: "currentColor",
        d: n[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(K.cssPrefix, "-").concat(uo.PRIMARY),
        fill: "currentColor",
        d: n[1]
      }
    }]
  } : a = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: n
    }
  }, {
    found: !0,
    width: t,
    height: r,
    icon: a
  };
}
const pw = {
  found: !1,
  width: 512,
  height: 512
};
function mw(e, t) {
  !Qd && !K.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Si(e, t) {
  let r = t;
  return t === "fa" && K.styleDefault !== null && (t = Ut()), new Promise((n, a) => {
    if (r === "fa") {
      const o = mp(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && mo[t] && mo[t][e]) {
      const o = mo[t][e];
      return n(Oi(o));
    }
    mw(e, t), n(W(W({}, pw), {}, {
      icon: K.showMissingIcons && e ? Yt("missingIconAbstract") || {} : {}
    }));
  });
}
const su = () => {
}, Ei = K.measurePerformance && $n && $n.mark && $n.measure ? $n : {
  mark: su,
  measure: su
}, Vr = 'FA "6.7.2"', gw = (e) => (Ei.mark("".concat(Vr, " ").concat(e, " begins")), () => bp(e)), bp = (e) => {
  Ei.mark("".concat(Vr, " ").concat(e, " ends")), Ei.measure("".concat(Vr, " ").concat(e), "".concat(Vr, " ").concat(e, " begins"), "".concat(Vr, " ").concat(e, " ends"));
};
var ys = {
  begin: gw,
  end: bp
};
const Un = () => {
};
function lu(e) {
  return typeof (e.getAttribute ? e.getAttribute(rr) : null) == "string";
}
function hw(e) {
  const t = e.getAttribute ? e.getAttribute(us) : null, r = e.getAttribute ? e.getAttribute(fs) : null;
  return t && r;
}
function bw(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(K.replacementClass);
}
function yw() {
  return K.autoReplaceSvg === !0 ? Yn.replace : Yn[K.autoReplaceSvg] || Yn.replace;
}
function vw(e) {
  return Te.createElementNS("http://www.w3.org/2000/svg", e);
}
function xw(e) {
  return Te.createElement(e);
}
function yp(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: r = e.tag === "svg" ? vw : xw
  } = t;
  if (typeof e == "string")
    return Te.createTextNode(e);
  const n = r(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    n.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    n.appendChild(yp(o, {
      ceFn: r
    }));
  }), n;
}
function ww(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const Yn = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((r) => {
        t.parentNode.insertBefore(yp(r), t);
      }), t.getAttribute(rr) === null && K.keepOriginalSource) {
        let r = Te.createComment(ww(t));
        t.parentNode.replaceChild(r, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], r = e[1];
    if (~ps(t).indexOf(K.replacementClass))
      return Yn.replace(e);
    const n = new RegExp("".concat(K.cssPrefix, "-.*"));
    if (delete r[0].attributes.id, r[0].attributes.class) {
      const o = r[0].attributes.class.split(" ").reduce((i, s) => (s === K.replacementClass || s.match(n) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      r[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = r.map((o) => fn(o)).join(`
`);
    t.setAttribute(rr, ""), t.innerHTML = a;
  }
};
function cu(e) {
  e();
}
function vp(e, t) {
  const r = typeof t == "function" ? t : Un;
  if (e.length === 0)
    r();
  else {
    let n = cu;
    K.mutateApproach === Sx && (n = Wt.requestAnimationFrame || cu), n(() => {
      const a = yw(), o = ys.begin("mutate");
      e.map(a), o(), r();
    });
  }
}
let vs = !1;
function xp() {
  vs = !0;
}
function Ai() {
  vs = !1;
}
let Zn = null;
function uu(e) {
  if (!Kc || !K.observeMutations)
    return;
  const {
    treeCallback: t = Un,
    nodeCallback: r = Un,
    pseudoElementsCallback: n = Un,
    observeMutationsRoot: a = Te
  } = e;
  Zn = new Kc((o) => {
    if (vs) return;
    const i = Ut();
    _r(o).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !lu(s.addedNodes[0]) && (K.searchPseudoElements && n(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && K.searchPseudoElements && n(s.target.parentNode), s.type === "attributes" && lu(s.target) && ~Nx.indexOf(s.attributeName))
        if (s.attributeName === "class" && hw(s.target)) {
          const {
            prefix: c,
            iconName: u
          } = xa(ps(s.target));
          s.target.setAttribute(us, c || i), u && s.target.setAttribute(fs, u);
        } else bw(s.target) && r(s.target);
    });
  }), xt && Zn.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function kw() {
  Zn && Zn.disconnect();
}
function Ow(e) {
  const t = e.getAttribute("style");
  let r = [];
  return t && (r = t.split(";").reduce((n, a) => {
    const o = a.split(":"), i = o[0], s = o.slice(1);
    return i && s.length > 0 && (n[i] = s.join(":").trim()), n;
  }, {})), r;
}
function Sw(e) {
  const t = e.getAttribute("data-prefix"), r = e.getAttribute("data-icon"), n = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = xa(ps(e));
  return a.prefix || (a.prefix = Ut()), t && r && (a.prefix = t, a.iconName = r), a.iconName && a.prefix || (a.prefix && n.length > 0 && (a.iconName = Xx(a.prefix, e.innerText) || hs(a.prefix, vi(e.innerText))), !a.iconName && K.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function Ew(e) {
  const t = _r(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), r = e.getAttribute("title"), n = e.getAttribute("data-fa-title-id");
  return K.autoA11y && (r ? t["aria-labelledby"] = "".concat(K.replacementClass, "-title-").concat(n || nn()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function Aw() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: it,
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
function fu(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: r,
    prefix: n,
    rest: a
  } = Sw(e), o = Ew(e), i = wi("parseNodeAttributes", {}, e);
  let s = t.styleParser ? Ow(e) : [];
  return W({
    iconName: r,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: n,
    transform: it,
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
  styles: Pw
} = st;
function wp(e) {
  const t = K.autoReplaceSvg === "nest" ? fu(e, {
    styleParser: !1
  }) : fu(e);
  return ~t.extra.classes.indexOf(tp) ? Yt("generateLayersText", e, t) : Yt("generateSvgReplacementMutation", e, t);
}
function Cw() {
  return [...lx, ...pi];
}
function du(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!xt) return Promise.resolve();
  const r = Te.documentElement.classList, n = (d) => r.add("".concat(Qc, "-").concat(d)), a = (d) => r.remove("".concat(Qc, "-").concat(d)), o = K.autoFetchSvg ? Cw() : Bd.concat(Object.keys(Pw));
  o.includes("fa") || o.push("fa");
  const i = [".".concat(tp, ":not([").concat(rr, "])")].concat(o.map((d) => ".".concat(d, ":not([").concat(rr, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = _r(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    n("pending"), a("complete");
  else
    return Promise.resolve();
  const c = ys.begin("onTree"), u = s.reduce((d, m) => {
    try {
      const h = wp(m);
      h && d.push(h);
    } catch (h) {
      Qd || h.name === "MissingIcon" && console.error(h);
    }
    return d;
  }, []);
  return new Promise((d, m) => {
    Promise.all(u).then((h) => {
      vp(h, () => {
        n("active"), n("complete"), a("pending"), typeof t == "function" && t(), c(), d();
      });
    }).catch((h) => {
      c(), m(h);
    });
  });
}
function $w(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  wp(e).then((r) => {
    r && vp([r], t);
  });
}
function Nw(e) {
  return function(t) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const n = (t || {}).icon ? t : ki(t || {});
    let {
      mask: a
    } = r;
    return a && (a = (a || {}).icon ? a : ki(a || {})), e(n, W(W({}, r), {}, {
      mask: a
    }));
  };
}
const _w = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: r = it,
    symbol: n = !1,
    mask: a = null,
    maskId: o = null,
    title: i = null,
    titleId: s = null,
    classes: c = [],
    attributes: u = {},
    styles: d = {}
  } = t;
  if (!e) return;
  const {
    prefix: m,
    iconName: h,
    icon: k
  } = e;
  return wa(W({
    type: "icon"
  }, e), () => (nr("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), K.autoA11y && (i ? u["aria-labelledby"] = "".concat(K.replacementClass, "-title-").concat(s || nn()) : (u["aria-hidden"] = "true", u.focusable = "false")), bs({
    icons: {
      main: Oi(k),
      mask: a ? Oi(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: m,
    iconName: h,
    transform: W(W({}, it), r),
    symbol: n,
    title: i,
    maskId: o,
    titleId: s,
    extra: {
      attributes: u,
      styles: d,
      classes: c
    }
  })));
};
var Tw = {
  mixout() {
    return {
      icon: Nw(_w)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = du, e.nodeCallback = $w, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: r = Te,
        callback: n = () => {
        }
      } = t;
      return du(r, n);
    }, e.generateSvgReplacementMutation = function(t, r) {
      const {
        iconName: n,
        title: a,
        titleId: o,
        prefix: i,
        transform: s,
        symbol: c,
        mask: u,
        maskId: d,
        extra: m
      } = r;
      return new Promise((h, k) => {
        Promise.all([Si(n, i), u.iconName ? Si(u.iconName, u.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((O) => {
          let [w, b] = O;
          h([t, bs({
            icons: {
              main: w,
              mask: b
            },
            prefix: i,
            iconName: n,
            transform: s,
            symbol: c,
            maskId: d,
            title: a,
            titleId: o,
            extra: m,
            watchable: !0
          })]);
        }).catch(k);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: r,
        attributes: n,
        main: a,
        transform: o,
        styles: i
      } = t;
      const s = ya(i);
      s.length > 0 && (n.style = s);
      let c;
      return ms(o) && (c = Yt("generateAbstractTransformGrouping", {
        main: a,
        transform: o,
        containerWidth: a.width,
        iconWidth: a.width
      })), r.push(c || a.icon), {
        children: r,
        attributes: n
      };
    };
  }
}, jw = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: r = []
        } = t;
        return wa({
          type: "layer"
        }, () => {
          nr("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let n = [];
          return e((a) => {
            Array.isArray(a) ? a.map((o) => {
              n = n.concat(o.abstract);
            }) : n = n.concat(a.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(K.cssPrefix, "-layers"), ...r].join(" ")
            },
            children: n
          }];
        });
      }
    };
  }
}, Iw = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: r = null,
          classes: n = [],
          attributes: a = {},
          styles: o = {}
        } = t;
        return wa({
          type: "counter",
          content: e
        }, () => (nr("beforeDOMElementCreation", {
          content: e,
          params: t
        }), dw({
          content: e.toString(),
          title: r,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(K.cssPrefix, "-layers-counter"), ...n]
          }
        })));
      }
    };
  }
}, Rw = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: r = it,
          title: n = null,
          classes: a = [],
          attributes: o = {},
          styles: i = {}
        } = t;
        return wa({
          type: "text",
          content: e
        }, () => (nr("beforeDOMElementCreation", {
          content: e,
          params: t
        }), iu({
          content: e,
          transform: W(W({}, it), r),
          title: n,
          extra: {
            attributes: o,
            styles: i,
            classes: ["".concat(K.cssPrefix, "-layers-text"), ...a]
          }
        })));
      }
    };
  },
  provides(e) {
    e.generateLayersText = function(t, r) {
      const {
        title: n,
        transform: a,
        extra: o
      } = r;
      let i = null, s = null;
      if (qd) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), u = t.getBoundingClientRect();
        i = u.width / c, s = u.height / c;
      }
      return K.autoA11y && !n && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, iu({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: a,
        title: n,
        extra: o,
        watchable: !0
      })]);
    };
  }
};
const Mw = new RegExp('"', "ug"), pu = [1105920, 1112319], mu = W(W(W(W({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), ox), kx), gx), Pi = Object.keys(mu).reduce((e, t) => (e[t.toLowerCase()] = mu[t], e), {}), zw = Object.keys(Pi).reduce((e, t) => {
  const r = Pi[t];
  return e[t] = r[900] || [...Object.entries(r)][0][1], e;
}, {});
function Fw(e) {
  const t = e.replace(Mw, ""), r = Vx(t, 0), n = r >= pu[0] && r <= pu[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: vi(a ? t[0] : t),
    isSecondary: n || a
  };
}
function Dw(e, t) {
  const r = e.replace(/^['"]|['"]$/g, "").toLowerCase(), n = parseInt(t), a = isNaN(n) ? "normal" : n;
  return (Pi[r] || {})[a] || zw[r];
}
function gu(e, t) {
  const r = "".concat(Ox).concat(t.replace(":", "-"));
  return new Promise((n, a) => {
    if (e.getAttribute(r) !== null)
      return n();
    const i = _r(e.children).filter((h) => h.getAttribute(gi) === t)[0], s = Wt.getComputedStyle(e, t), c = s.getPropertyValue("font-family"), u = c.match(Cx), d = s.getPropertyValue("font-weight"), m = s.getPropertyValue("content");
    if (i && !u)
      return e.removeChild(i), n();
    if (u && m !== "none" && m !== "") {
      const h = s.getPropertyValue("content");
      let k = Dw(c, d);
      const {
        value: O,
        isSecondary: w
      } = Fw(h), b = u[0].startsWith("FontAwesome");
      let E = hs(k, O), N = E;
      if (b) {
        const T = Kx(O);
        T.iconName && T.prefix && (E = T.iconName, k = T.prefix);
      }
      if (E && !w && (!i || i.getAttribute(us) !== k || i.getAttribute(fs) !== N)) {
        e.setAttribute(r, N), i && e.removeChild(i);
        const T = Aw(), {
          extra: j
        } = T;
        j.attributes[gi] = t, Si(E, k).then((p) => {
          const V = bs(W(W({}, T), {}, {
            icons: {
              main: p,
              mask: gp()
            },
            prefix: k,
            iconName: N,
            extra: j,
            watchable: !0
          })), J = Te.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(J, e.firstChild) : e.appendChild(J), J.outerHTML = V.map((oe) => fn(oe)).join(`
`), e.removeAttribute(r), n();
        }).catch(a);
      } else
        n();
    } else
      n();
  });
}
function Lw(e) {
  return Promise.all([gu(e, "::before"), gu(e, "::after")]);
}
function Ww(e) {
  return e.parentNode !== document.head && !~Ex.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(gi) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function hu(e) {
  if (xt)
    return new Promise((t, r) => {
      const n = _r(e.querySelectorAll("*")).filter(Ww).map(Lw), a = ys.begin("searchPseudoElements");
      xp(), Promise.all(n).then(() => {
        a(), Ai(), t();
      }).catch(() => {
        a(), Ai(), r();
      });
    });
}
var Uw = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = hu, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: r = Te
      } = t;
      K.searchPseudoElements && hu(r);
    };
  }
};
let bu = !1;
var Yw = {
  mixout() {
    return {
      dom: {
        unwatch() {
          xp(), bu = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        uu(wi("mutationObserverCallbacks", {}));
      },
      noAuto() {
        kw();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        bu ? Ai() : uu(wi("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const yu = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((r, n) => {
    const a = n.toLowerCase().split("-"), o = a[0];
    let i = a.slice(1).join("-");
    if (o && i === "h")
      return r.flipX = !0, r;
    if (o && i === "v")
      return r.flipY = !0, r;
    if (i = parseFloat(i), isNaN(i))
      return r;
    switch (o) {
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
var Vw = {
  mixout() {
    return {
      parse: {
        transform: (e) => yu(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-transform");
        return r && (e.transform = yu(r)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: r,
        transform: n,
        containerWidth: a,
        iconWidth: o
      } = t;
      const i = {
        transform: "translate(".concat(a / 2, " 256)")
      }, s = "translate(".concat(n.x * 32, ", ").concat(n.y * 32, ") "), c = "scale(".concat(n.size / 16 * (n.flipX ? -1 : 1), ", ").concat(n.size / 16 * (n.flipY ? -1 : 1), ") "), u = "rotate(".concat(n.rotate, " 0 0)"), d = {
        transform: "".concat(s, " ").concat(c, " ").concat(u)
      }, m = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, h = {
        outer: i,
        inner: d,
        path: m
      };
      return {
        tag: "g",
        attributes: W({}, h.outer),
        children: [{
          tag: "g",
          attributes: W({}, h.inner),
          children: [{
            tag: r.icon.tag,
            children: r.icon.children,
            attributes: W(W({}, r.icon.attributes), h.path)
          }]
        }]
      };
    };
  }
};
const go = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function vu(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function Hw(e) {
  return e.tag === "g" ? e.children : [e];
}
var qw = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-mask"), n = r ? xa(r.split(" ").map((a) => a.trim())) : gp();
        return n.prefix || (n.prefix = Ut()), e.mask = n, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: r,
        attributes: n,
        main: a,
        mask: o,
        maskId: i,
        transform: s
      } = t;
      const {
        width: c,
        icon: u
      } = a, {
        width: d,
        icon: m
      } = o, h = Fx({
        transform: s,
        containerWidth: d,
        iconWidth: c
      }), k = {
        tag: "rect",
        attributes: W(W({}, go), {}, {
          fill: "white"
        })
      }, O = u.children ? {
        children: u.children.map(vu)
      } : {}, w = {
        tag: "g",
        attributes: W({}, h.inner),
        children: [vu(W({
          tag: u.tag,
          attributes: W(W({}, u.attributes), h.path)
        }, O))]
      }, b = {
        tag: "g",
        attributes: W({}, h.outer),
        children: [w]
      }, E = "mask-".concat(i || nn()), N = "clip-".concat(i || nn()), T = {
        tag: "mask",
        attributes: W(W({}, go), {}, {
          id: E,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [k, b]
      }, j = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: N
          },
          children: Hw(m)
        }, T]
      };
      return r.push(j, {
        tag: "rect",
        attributes: W({
          fill: "currentColor",
          "clip-path": "url(#".concat(N, ")"),
          mask: "url(#".concat(E, ")")
        }, go)
      }), {
        children: r,
        attributes: n
      };
    };
  }
}, Gw = {
  provides(e) {
    let t = !1;
    Wt.matchMedia && (t = Wt.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const r = [], n = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      r.push({
        tag: "path",
        attributes: W(W({}, n), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = W(W({}, a), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: W(W({}, n), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: W(W({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: W(W({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), r.push(i), r.push({
        tag: "path",
        attributes: W(W({}, n), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: W(W({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || r.push({
        tag: "path",
        attributes: W(W({}, n), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: W(W({}, o), {}, {
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
}, Bw = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-symbol"), n = r === null ? !1 : r === "" ? !0 : r;
        return e.symbol = n, e;
      }
    };
  }
}, Xw = [Wx, Tw, jw, Iw, Rw, Uw, Yw, Vw, qw, Gw, Bw];
ow(Xw, {
  mixoutsTo: Ke
});
Ke.noAuto;
Ke.config;
Ke.library;
Ke.dom;
const Ci = Ke.parse;
Ke.findIconDefinition;
Ke.toHtml;
const Kw = Ke.icon;
Ke.layer;
Ke.text;
Ke.counter;
var _n = { exports: {} }, Tn = { exports: {} }, we = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var xu;
function Jw() {
  if (xu) return we;
  xu = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, d = e ? Symbol.for("react.forward_ref") : 60112, m = e ? Symbol.for("react.suspense") : 60113, h = e ? Symbol.for("react.suspense_list") : 60120, k = e ? Symbol.for("react.memo") : 60115, O = e ? Symbol.for("react.lazy") : 60116, w = e ? Symbol.for("react.block") : 60121, b = e ? Symbol.for("react.fundamental") : 60117, E = e ? Symbol.for("react.responder") : 60118, N = e ? Symbol.for("react.scope") : 60119;
  function T(p) {
    if (typeof p == "object" && p !== null) {
      var V = p.$$typeof;
      switch (V) {
        case t:
          switch (p = p.type, p) {
            case c:
            case u:
            case n:
            case o:
            case a:
            case m:
              return p;
            default:
              switch (p = p && p.$$typeof, p) {
                case s:
                case d:
                case O:
                case k:
                case i:
                  return p;
                default:
                  return V;
              }
          }
        case r:
          return V;
      }
    }
  }
  function j(p) {
    return T(p) === u;
  }
  return we.AsyncMode = c, we.ConcurrentMode = u, we.ContextConsumer = s, we.ContextProvider = i, we.Element = t, we.ForwardRef = d, we.Fragment = n, we.Lazy = O, we.Memo = k, we.Portal = r, we.Profiler = o, we.StrictMode = a, we.Suspense = m, we.isAsyncMode = function(p) {
    return j(p) || T(p) === c;
  }, we.isConcurrentMode = j, we.isContextConsumer = function(p) {
    return T(p) === s;
  }, we.isContextProvider = function(p) {
    return T(p) === i;
  }, we.isElement = function(p) {
    return typeof p == "object" && p !== null && p.$$typeof === t;
  }, we.isForwardRef = function(p) {
    return T(p) === d;
  }, we.isFragment = function(p) {
    return T(p) === n;
  }, we.isLazy = function(p) {
    return T(p) === O;
  }, we.isMemo = function(p) {
    return T(p) === k;
  }, we.isPortal = function(p) {
    return T(p) === r;
  }, we.isProfiler = function(p) {
    return T(p) === o;
  }, we.isStrictMode = function(p) {
    return T(p) === a;
  }, we.isSuspense = function(p) {
    return T(p) === m;
  }, we.isValidElementType = function(p) {
    return typeof p == "string" || typeof p == "function" || p === n || p === u || p === o || p === a || p === m || p === h || typeof p == "object" && p !== null && (p.$$typeof === O || p.$$typeof === k || p.$$typeof === i || p.$$typeof === s || p.$$typeof === d || p.$$typeof === b || p.$$typeof === E || p.$$typeof === N || p.$$typeof === w);
  }, we.typeOf = T, we;
}
var ke = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var wu;
function Zw() {
  return wu || (wu = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, d = e ? Symbol.for("react.forward_ref") : 60112, m = e ? Symbol.for("react.suspense") : 60113, h = e ? Symbol.for("react.suspense_list") : 60120, k = e ? Symbol.for("react.memo") : 60115, O = e ? Symbol.for("react.lazy") : 60116, w = e ? Symbol.for("react.block") : 60121, b = e ? Symbol.for("react.fundamental") : 60117, E = e ? Symbol.for("react.responder") : 60118, N = e ? Symbol.for("react.scope") : 60119;
    function T(v) {
      return typeof v == "string" || typeof v == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      v === n || v === u || v === o || v === a || v === m || v === h || typeof v == "object" && v !== null && (v.$$typeof === O || v.$$typeof === k || v.$$typeof === i || v.$$typeof === s || v.$$typeof === d || v.$$typeof === b || v.$$typeof === E || v.$$typeof === N || v.$$typeof === w);
    }
    function j(v) {
      if (typeof v == "object" && v !== null) {
        var ye = v.$$typeof;
        switch (ye) {
          case t:
            var De = v.type;
            switch (De) {
              case c:
              case u:
              case n:
              case o:
              case a:
              case m:
                return De;
              default:
                var Ze = De && De.$$typeof;
                switch (Ze) {
                  case s:
                  case d:
                  case O:
                  case k:
                  case i:
                    return Ze;
                  default:
                    return ye;
                }
            }
          case r:
            return ye;
        }
      }
    }
    var p = c, V = u, J = s, oe = i, me = t, ne = d, ge = n, F = O, be = k, ee = r, ce = o, G = a, U = m, Z = !1;
    function te(v) {
      return Z || (Z = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), g(v) || j(v) === c;
    }
    function g(v) {
      return j(v) === u;
    }
    function f(v) {
      return j(v) === s;
    }
    function x(v) {
      return j(v) === i;
    }
    function A(v) {
      return typeof v == "object" && v !== null && v.$$typeof === t;
    }
    function S(v) {
      return j(v) === d;
    }
    function C(v) {
      return j(v) === n;
    }
    function _(v) {
      return j(v) === O;
    }
    function $(v) {
      return j(v) === k;
    }
    function R(v) {
      return j(v) === r;
    }
    function M(v) {
      return j(v) === o;
    }
    function z(v) {
      return j(v) === a;
    }
    function Q(v) {
      return j(v) === m;
    }
    ke.AsyncMode = p, ke.ConcurrentMode = V, ke.ContextConsumer = J, ke.ContextProvider = oe, ke.Element = me, ke.ForwardRef = ne, ke.Fragment = ge, ke.Lazy = F, ke.Memo = be, ke.Portal = ee, ke.Profiler = ce, ke.StrictMode = G, ke.Suspense = U, ke.isAsyncMode = te, ke.isConcurrentMode = g, ke.isContextConsumer = f, ke.isContextProvider = x, ke.isElement = A, ke.isForwardRef = S, ke.isFragment = C, ke.isLazy = _, ke.isMemo = $, ke.isPortal = R, ke.isProfiler = M, ke.isStrictMode = z, ke.isSuspense = Q, ke.isValidElementType = T, ke.typeOf = j;
  }()), ke;
}
var ku;
function kp() {
  return ku || (ku = 1, process.env.NODE_ENV === "production" ? Tn.exports = Jw() : Tn.exports = Zw()), Tn.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var ho, Ou;
function Qw() {
  if (Ou) return ho;
  Ou = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, r = Object.prototype.propertyIsEnumerable;
  function n(o) {
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
      var c = Object.getOwnPropertyNames(i).map(function(d) {
        return i[d];
      });
      if (c.join("") !== "0123456789")
        return !1;
      var u = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(d) {
        u[d] = d;
      }), Object.keys(Object.assign({}, u)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return ho = a() ? Object.assign : function(o, i) {
    for (var s, c = n(o), u, d = 1; d < arguments.length; d++) {
      s = Object(arguments[d]);
      for (var m in s)
        t.call(s, m) && (c[m] = s[m]);
      if (e) {
        u = e(s);
        for (var h = 0; h < u.length; h++)
          r.call(s, u[h]) && (c[u[h]] = s[u[h]]);
      }
    }
    return c;
  }, ho;
}
var bo, Su;
function xs() {
  if (Su) return bo;
  Su = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return bo = e, bo;
}
var yo, Eu;
function Op() {
  return Eu || (Eu = 1, yo = Function.call.bind(Object.prototype.hasOwnProperty)), yo;
}
var vo, Au;
function e2() {
  if (Au) return vo;
  Au = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ xs(), r = {}, n = /* @__PURE__ */ Op();
    e = function(o) {
      var i = "Warning: " + o;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function a(o, i, s, c, u) {
    if (process.env.NODE_ENV !== "production") {
      for (var d in o)
        if (n(o, d)) {
          var m;
          try {
            if (typeof o[d] != "function") {
              var h = Error(
                (c || "React class") + ": " + s + " type `" + d + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[d] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw h.name = "Invariant Violation", h;
            }
            m = o[d](i, d, c, s, null, t);
          } catch (O) {
            m = O;
          }
          if (m && !(m instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + d + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof m + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), m instanceof Error && !(m.message in r)) {
            r[m.message] = !0;
            var k = u ? u() : "";
            e(
              "Failed " + s + " type: " + m.message + (k ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (r = {});
  }, vo = a, vo;
}
var xo, Pu;
function t2() {
  if (Pu) return xo;
  Pu = 1;
  var e = kp(), t = Qw(), r = /* @__PURE__ */ xs(), n = /* @__PURE__ */ Op(), a = /* @__PURE__ */ e2(), o = function() {
  };
  process.env.NODE_ENV !== "production" && (o = function(s) {
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
  return xo = function(s, c) {
    var u = typeof Symbol == "function" && Symbol.iterator, d = "@@iterator";
    function m(g) {
      var f = g && (u && g[u] || g[d]);
      if (typeof f == "function")
        return f;
    }
    var h = "<<anonymous>>", k = {
      array: E("array"),
      bigint: E("bigint"),
      bool: E("boolean"),
      func: E("function"),
      number: E("number"),
      object: E("object"),
      string: E("string"),
      symbol: E("symbol"),
      any: N(),
      arrayOf: T,
      element: j(),
      elementType: p(),
      instanceOf: V,
      node: ne(),
      objectOf: oe,
      oneOf: J,
      oneOfType: me,
      shape: F,
      exact: be
    };
    function O(g, f) {
      return g === f ? g !== 0 || 1 / g === 1 / f : g !== g && f !== f;
    }
    function w(g, f) {
      this.message = g, this.data = f && typeof f == "object" ? f : {}, this.stack = "";
    }
    w.prototype = Error.prototype;
    function b(g) {
      if (process.env.NODE_ENV !== "production")
        var f = {}, x = 0;
      function A(C, _, $, R, M, z, Q) {
        if (R = R || h, z = z || $, Q !== r) {
          if (c) {
            var v = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw v.name = "Invariant Violation", v;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ye = R + ":" + $;
            !f[ye] && // Avoid spamming the console because they are often not actionable except for lib authors
            x < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + z + "` prop on `" + R + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), f[ye] = !0, x++);
          }
        }
        return _[$] == null ? C ? _[$] === null ? new w("The " + M + " `" + z + "` is marked as required " + ("in `" + R + "`, but its value is `null`.")) : new w("The " + M + " `" + z + "` is marked as required in " + ("`" + R + "`, but its value is `undefined`.")) : null : g(_, $, R, M, z);
      }
      var S = A.bind(null, !1);
      return S.isRequired = A.bind(null, !0), S;
    }
    function E(g) {
      function f(x, A, S, C, _, $) {
        var R = x[A], M = G(R);
        if (M !== g) {
          var z = U(R);
          return new w(
            "Invalid " + C + " `" + _ + "` of type " + ("`" + z + "` supplied to `" + S + "`, expected ") + ("`" + g + "`."),
            { expectedType: g }
          );
        }
        return null;
      }
      return b(f);
    }
    function N() {
      return b(i);
    }
    function T(g) {
      function f(x, A, S, C, _) {
        if (typeof g != "function")
          return new w("Property `" + _ + "` of component `" + S + "` has invalid PropType notation inside arrayOf.");
        var $ = x[A];
        if (!Array.isArray($)) {
          var R = G($);
          return new w("Invalid " + C + " `" + _ + "` of type " + ("`" + R + "` supplied to `" + S + "`, expected an array."));
        }
        for (var M = 0; M < $.length; M++) {
          var z = g($, M, S, C, _ + "[" + M + "]", r);
          if (z instanceof Error)
            return z;
        }
        return null;
      }
      return b(f);
    }
    function j() {
      function g(f, x, A, S, C) {
        var _ = f[x];
        if (!s(_)) {
          var $ = G(_);
          return new w("Invalid " + S + " `" + C + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return b(g);
    }
    function p() {
      function g(f, x, A, S, C) {
        var _ = f[x];
        if (!e.isValidElementType(_)) {
          var $ = G(_);
          return new w("Invalid " + S + " `" + C + "` of type " + ("`" + $ + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return b(g);
    }
    function V(g) {
      function f(x, A, S, C, _) {
        if (!(x[A] instanceof g)) {
          var $ = g.name || h, R = te(x[A]);
          return new w("Invalid " + C + " `" + _ + "` of type " + ("`" + R + "` supplied to `" + S + "`, expected ") + ("instance of `" + $ + "`."));
        }
        return null;
      }
      return b(f);
    }
    function J(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), i;
      function f(x, A, S, C, _) {
        for (var $ = x[A], R = 0; R < g.length; R++)
          if (O($, g[R]))
            return null;
        var M = JSON.stringify(g, function(Q, v) {
          var ye = U(v);
          return ye === "symbol" ? String(v) : v;
        });
        return new w("Invalid " + C + " `" + _ + "` of value `" + String($) + "` " + ("supplied to `" + S + "`, expected one of " + M + "."));
      }
      return b(f);
    }
    function oe(g) {
      function f(x, A, S, C, _) {
        if (typeof g != "function")
          return new w("Property `" + _ + "` of component `" + S + "` has invalid PropType notation inside objectOf.");
        var $ = x[A], R = G($);
        if (R !== "object")
          return new w("Invalid " + C + " `" + _ + "` of type " + ("`" + R + "` supplied to `" + S + "`, expected an object."));
        for (var M in $)
          if (n($, M)) {
            var z = g($, M, S, C, _ + "." + M, r);
            if (z instanceof Error)
              return z;
          }
        return null;
      }
      return b(f);
    }
    function me(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var f = 0; f < g.length; f++) {
        var x = g[f];
        if (typeof x != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + Z(x) + " at index " + f + "."
          ), i;
      }
      function A(S, C, _, $, R) {
        for (var M = [], z = 0; z < g.length; z++) {
          var Q = g[z], v = Q(S, C, _, $, R, r);
          if (v == null)
            return null;
          v.data && n(v.data, "expectedType") && M.push(v.data.expectedType);
        }
        var ye = M.length > 0 ? ", expected one of type [" + M.join(", ") + "]" : "";
        return new w("Invalid " + $ + " `" + R + "` supplied to " + ("`" + _ + "`" + ye + "."));
      }
      return b(A);
    }
    function ne() {
      function g(f, x, A, S, C) {
        return ee(f[x]) ? null : new w("Invalid " + S + " `" + C + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return b(g);
    }
    function ge(g, f, x, A, S) {
      return new w(
        (g || "React class") + ": " + f + " type `" + x + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + S + "`."
      );
    }
    function F(g) {
      function f(x, A, S, C, _) {
        var $ = x[A], R = G($);
        if (R !== "object")
          return new w("Invalid " + C + " `" + _ + "` of type `" + R + "` " + ("supplied to `" + S + "`, expected `object`."));
        for (var M in g) {
          var z = g[M];
          if (typeof z != "function")
            return ge(S, C, _, M, U(z));
          var Q = z($, M, S, C, _ + "." + M, r);
          if (Q)
            return Q;
        }
        return null;
      }
      return b(f);
    }
    function be(g) {
      function f(x, A, S, C, _) {
        var $ = x[A], R = G($);
        if (R !== "object")
          return new w("Invalid " + C + " `" + _ + "` of type `" + R + "` " + ("supplied to `" + S + "`, expected `object`."));
        var M = t({}, x[A], g);
        for (var z in M) {
          var Q = g[z];
          if (n(g, z) && typeof Q != "function")
            return ge(S, C, _, z, U(Q));
          if (!Q)
            return new w(
              "Invalid " + C + " `" + _ + "` key `" + z + "` supplied to `" + S + "`.\nBad object: " + JSON.stringify(x[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(g), null, "  ")
            );
          var v = Q($, z, S, C, _ + "." + z, r);
          if (v)
            return v;
        }
        return null;
      }
      return b(f);
    }
    function ee(g) {
      switch (typeof g) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !g;
        case "object":
          if (Array.isArray(g))
            return g.every(ee);
          if (g === null || s(g))
            return !0;
          var f = m(g);
          if (f) {
            var x = f.call(g), A;
            if (f !== g.entries) {
              for (; !(A = x.next()).done; )
                if (!ee(A.value))
                  return !1;
            } else
              for (; !(A = x.next()).done; ) {
                var S = A.value;
                if (S && !ee(S[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function ce(g, f) {
      return g === "symbol" ? !0 : f ? f["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && f instanceof Symbol : !1;
    }
    function G(g) {
      var f = typeof g;
      return Array.isArray(g) ? "array" : g instanceof RegExp ? "object" : ce(f, g) ? "symbol" : f;
    }
    function U(g) {
      if (typeof g > "u" || g === null)
        return "" + g;
      var f = G(g);
      if (f === "object") {
        if (g instanceof Date)
          return "date";
        if (g instanceof RegExp)
          return "regexp";
      }
      return f;
    }
    function Z(g) {
      var f = U(g);
      switch (f) {
        case "array":
        case "object":
          return "an " + f;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + f;
        default:
          return f;
      }
    }
    function te(g) {
      return !g.constructor || !g.constructor.name ? h : g.constructor.name;
    }
    return k.checkPropTypes = a, k.resetWarningCache = a.resetWarningCache, k.PropTypes = k, k;
  }, xo;
}
var wo, Cu;
function r2() {
  if (Cu) return wo;
  Cu = 1;
  var e = /* @__PURE__ */ xs();
  function t() {
  }
  function r() {
  }
  return r.resetWarningCache = t, wo = function() {
    function n(i, s, c, u, d, m) {
      if (m !== e) {
        var h = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw h.name = "Invariant Violation", h;
      }
    }
    n.isRequired = n;
    function a() {
      return n;
    }
    var o = {
      array: n,
      bigint: n,
      bool: n,
      func: n,
      number: n,
      object: n,
      string: n,
      symbol: n,
      any: n,
      arrayOf: a,
      element: n,
      elementType: n,
      instanceOf: a,
      node: n,
      objectOf: a,
      oneOf: a,
      oneOfType: a,
      shape: a,
      exact: a,
      checkPropTypes: r,
      resetWarningCache: t
    };
    return o.PropTypes = o, o;
  }, wo;
}
var $u;
function n2() {
  if ($u) return _n.exports;
  if ($u = 1, process.env.NODE_ENV !== "production") {
    var e = kp(), t = !0;
    _n.exports = /* @__PURE__ */ t2()(e.isElement, t);
  } else
    _n.exports = /* @__PURE__ */ r2()();
  return _n.exports;
}
var a2 = /* @__PURE__ */ n2();
const pe = /* @__PURE__ */ Qb(a2);
function Nu(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function tt(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Nu(Object(r), !0).forEach(function(n) {
      hr(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : Nu(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function Qn(e) {
  "@babel/helpers - typeof";
  return Qn = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Qn(e);
}
function hr(e, t, r) {
  return t in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function o2(e, t) {
  if (e == null) return {};
  var r = {}, n = Object.keys(e), a, o;
  for (o = 0; o < n.length; o++)
    a = n[o], !(t.indexOf(a) >= 0) && (r[a] = e[a]);
  return r;
}
function i2(e, t) {
  if (e == null) return {};
  var r = o2(e, t), n, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      n = o[a], !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n]);
  }
  return r;
}
function $i(e) {
  return s2(e) || l2(e) || c2(e) || u2();
}
function s2(e) {
  if (Array.isArray(e)) return Ni(e);
}
function l2(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function c2(e, t) {
  if (e) {
    if (typeof e == "string") return Ni(e, t);
    var r = Object.prototype.toString.call(e).slice(8, -1);
    if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return Ni(e, t);
  }
}
function Ni(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
  return n;
}
function u2() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function f2(e) {
  var t, r = e.beat, n = e.fade, a = e.beatFade, o = e.bounce, i = e.shake, s = e.flash, c = e.spin, u = e.spinPulse, d = e.spinReverse, m = e.pulse, h = e.fixedWidth, k = e.inverse, O = e.border, w = e.listItem, b = e.flip, E = e.size, N = e.rotation, T = e.pull, j = (t = {
    "fa-beat": r,
    "fa-fade": n,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": d,
    "fa-spin-pulse": u,
    "fa-pulse": m,
    "fa-fw": h,
    "fa-inverse": k,
    "fa-border": O,
    "fa-li": w,
    "fa-flip": b === !0,
    "fa-flip-horizontal": b === "horizontal" || b === "both",
    "fa-flip-vertical": b === "vertical" || b === "both"
  }, hr(t, "fa-".concat(E), typeof E < "u" && E !== null), hr(t, "fa-rotate-".concat(N), typeof N < "u" && N !== null && N !== 0), hr(t, "fa-pull-".concat(T), typeof T < "u" && T !== null), hr(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(j).map(function(p) {
    return j[p] ? p : null;
  }).filter(function(p) {
    return p;
  });
}
function d2(e) {
  return e = e - 0, e === e;
}
function Sp(e) {
  return d2(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, r) {
    return r ? r.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var p2 = ["style"];
function m2(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function g2(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, r) {
    var n = r.indexOf(":"), a = Sp(r.slice(0, n)), o = r.slice(n + 1).trim();
    return a.startsWith("webkit") ? t[m2(a)] = o : t[a] = o, t;
  }, {});
}
function Ep(e, t) {
  var r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var n = (t.children || []).map(function(c) {
    return Ep(e, c);
  }), a = Object.keys(t.attributes || {}).reduce(function(c, u) {
    var d = t.attributes[u];
    switch (u) {
      case "class":
        c.attrs.className = d, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = g2(d);
        break;
      default:
        u.indexOf("aria-") === 0 || u.indexOf("data-") === 0 ? c.attrs[u.toLowerCase()] = d : c.attrs[Sp(u)] = d;
    }
    return c;
  }, {
    attrs: {}
  }), o = r.style, i = o === void 0 ? {} : o, s = i2(r, p2);
  return a.attrs.style = tt(tt({}, a.attrs.style), i), e.apply(void 0, [t.tag, tt(tt({}, a.attrs), s)].concat($i(n)));
}
var Ap = !1;
try {
  Ap = process.env.NODE_ENV === "production";
} catch {
}
function h2() {
  if (!Ap && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function _u(e) {
  if (e && Qn(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Ci.icon)
    return Ci.icon(e);
  if (e === null)
    return null;
  if (e && Qn(e) === "object" && e.prefix && e.iconName)
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
function ko(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? hr({}, e, t) : {};
}
var Tu = {
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
}, ws = /* @__PURE__ */ Me.forwardRef(function(e, t) {
  var r = tt(tt({}, Tu), e), n = r.icon, a = r.mask, o = r.symbol, i = r.className, s = r.title, c = r.titleId, u = r.maskId, d = _u(n), m = ko("classes", [].concat($i(f2(r)), $i((i || "").split(" ")))), h = ko("transform", typeof r.transform == "string" ? Ci.transform(r.transform) : r.transform), k = ko("mask", _u(a)), O = Kw(d, tt(tt(tt(tt({}, m), h), k), {}, {
    symbol: o,
    title: s,
    titleId: c,
    maskId: u
  }));
  if (!O)
    return h2("Could not find icon", d), null;
  var w = O.abstract, b = {
    ref: t
  };
  return Object.keys(r).forEach(function(E) {
    Tu.hasOwnProperty(E) || (b[E] = r[E]);
  }), b2(w[0], b);
});
ws.displayName = "FontAwesomeIcon";
ws.propTypes = {
  beat: pe.bool,
  border: pe.bool,
  beatFade: pe.bool,
  bounce: pe.bool,
  className: pe.string,
  fade: pe.bool,
  flash: pe.bool,
  mask: pe.oneOfType([pe.object, pe.array, pe.string]),
  maskId: pe.string,
  fixedWidth: pe.bool,
  inverse: pe.bool,
  flip: pe.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: pe.oneOfType([pe.object, pe.array, pe.string]),
  listItem: pe.bool,
  pull: pe.oneOf(["right", "left"]),
  pulse: pe.bool,
  rotation: pe.oneOf([0, 90, 180, 270]),
  shake: pe.bool,
  size: pe.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: pe.bool,
  spinPulse: pe.bool,
  spinReverse: pe.bool,
  symbol: pe.oneOfType([pe.bool, pe.string]),
  title: pe.string,
  titleId: pe.string,
  transform: pe.oneOfType([pe.string, pe.object]),
  swapOpacity: pe.bool
};
var b2 = Ep.bind(null, Me.createElement);
const y2 = ({
  onSubmit: e,
  isSignUp: t,
  onToggleMode: r,
  formRef: n,
  errorMessage: a
}) => {
  const [o, i] = He(void 0);
  It(() => {
    i(
      a ? a.charAt(0).toUpperCase() + a.slice(1) : void 0
    );
  }, [a]);
  const s = (d) => {
    d.preventDefault();
    const m = d.currentTarget;
    if (t) {
      const h = m.elements.namedItem("username").value, k = m.elements.namedItem("email").value, O = m.elements.namedItem("password").value, w = m.elements.namedItem("confirmPassword").value;
      if (O !== w) {
        i("Passwords do not match.");
        return;
      }
      e(h, k, O, w);
    } else {
      const h = m.elements.namedItem("usernameOrEmail").value, k = m.elements.namedItem("password").value;
      e(h, "", k, "");
    }
  }, c = () => {
  }, u = () => {
  };
  return /* @__PURE__ */ $e("div", { className: "flex flex-col items-center justify-center h-full", children: [
    /* @__PURE__ */ q("h2", { className: "text-3xl font-bold mb-3 text-center", children: t ? "Sign up for ArtCraft" : "Log in to ArtCraft" }),
    /* @__PURE__ */ $e(
      "form",
      {
        className: "flex flex-col gap-3 w-full max-w-md",
        onSubmit: s,
        ref: n,
        children: [
          t ? /* @__PURE__ */ $e(_t, { children: [
            /* @__PURE__ */ q(
              ur,
              {
                label: "Username",
                icon: Zl,
                name: "username",
                placeholder: "Username",
                required: !0,
                autoComplete: "off",
                onFocus: c,
                onBlur: u
              }
            ),
            /* @__PURE__ */ q(
              ur,
              {
                label: "Email",
                icon: cy,
                name: "email",
                type: "email",
                placeholder: "Email",
                required: t,
                style: t ? {} : { display: "none" },
                autoComplete: "off",
                onFocus: c,
                onBlur: u
              }
            )
          ] }) : /* @__PURE__ */ q(
            ur,
            {
              label: "Email or Username",
              icon: Zl,
              name: "usernameOrEmail",
              placeholder: "Email or Username",
              required: !0,
              autoComplete: "off",
              onFocus: c,
              onBlur: u
            }
          ),
          /* @__PURE__ */ q(
            ur,
            {
              label: "Password",
              icon: Ql,
              type: "password",
              name: "password",
              placeholder: "Password",
              required: !0,
              autoComplete: "off",
              onFocus: c,
              onBlur: u
            }
          ),
          t && /* @__PURE__ */ q(
            ur,
            {
              label: "Confirm Password",
              icon: Ql,
              type: "password",
              name: "confirmPassword",
              placeholder: "Confirm Password",
              required: !0,
              autoComplete: "off",
              onFocus: c,
              onBlur: u
            }
          ),
          /* @__PURE__ */ q("button", { type: "submit", className: "hidden" }),
          /* @__PURE__ */ $e("div", { className: "relative mt-3 flex flex-col items-center justify-center", children: [
            /* @__PURE__ */ $e("div", { className: "flex gap-2 items-center justify-center p-2 px-3 bg-white/5 rounded-lg", children: [
              /* @__PURE__ */ $e("p", { className: "text-sm opacity-80", children: [
                t ? "Already have an account?" : "Don't have an account?",
                " "
              ] }),
              /* @__PURE__ */ q(
                cr,
                {
                  variant: "secondary",
                  className: "p-0 bg-transparent hover:bg-transparent",
                  type: "button",
                  onClick: r,
                  children: /* @__PURE__ */ q("span", { className: "text-sm text-primary-400 underline", children: t ? "Log in" : "Sign up" })
                }
              )
            ] }),
            o && /* @__PURE__ */ $e("div", { className: "absolute w-fit -bottom-12 left-1/2 -translate-x-1/2 text-red bg-red/10 border border-red/20 rounded-lg py-1 px-2 justify-center text-sm text-center mb-2 font-semibold flex items-center gap-2", children: [
              /* @__PURE__ */ q(ws, { icon: fy }),
              o
            ] })
          ] })
        ]
      }
    )
  ] });
};
var v2 = Object.defineProperty, x2 = (e, t, r) => t in e ? v2(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r, Pp = (e, t, r) => x2(e, typeof t != "symbol" ? t + "" : t, r);
const w2 = "https://api.storyteller.ai";
window.STORYTELLER_API_HOST_STORE = void 0;
class ks {
  constructor(t) {
    Pp(this, "apiSchemeAndHost"), this.apiSchemeAndHost = t;
  }
  // NB(bt,2025-09-25): 'nx' is creating multiple copies of the library with name 
  //   mangling, so the singleton pattern fails to resolve to a single instance.
  // public static getInstance(): StorytellerApiHostStore {
  //   if (StorytellerApiHostStore.instance !== undefined) {
  //     return StorytellerApiHostStore.instance;
  //   }
  //   const instance = new StorytellerApiHostStore(DEFAULT_API_HOST);
  //   StorytellerApiHostStore.instance = instance;
  //   return instance;
  // }
  static getInstance() {
    if (window.STORYTELLER_API_HOST_STORE !== void 0)
      return window.STORYTELLER_API_HOST_STORE;
    const t = new ks(w2);
    return window.STORYTELLER_API_HOST_STORE = t, t;
  }
  /** Get the API scheme and host. */
  getApiSchemeAndHost() {
    return console.debug("StorytellerApiHostStore.getApiSchemeAndHost()", this.apiSchemeAndHost, this.constructor.name), this.apiSchemeAndHost;
  }
  /** 
   * Externally update the API host. 
   * This is used to sync with Tauri for enabling easier development.
   */
  setApiSchemeAndHost(t) {
    if (console.debug("StorytellerApiHostStore.setApiSchemeAndHost()", t, this.constructor.name), !t.startsWith("http://") && !t.startsWith("https://"))
      throw new Error(`Scheme not included in URL: ${t}`);
    const r = "https://".lastIndexOf("/");
    if (t.lastIndexOf("/") > r)
      throw new Error(`Path components should not be included in URL: ${t}`);
    this.apiSchemeAndHost = t;
  }
}
var Hr = /* @__PURE__ */ ((e) => (e.GOOGLE_API = "https://storage.googleapis.com", e.FUNNEL_API = "https://style.storyteller.ai", e.CDN_API = "https://cdn.storyteller.ai", e.GRAVATAR_API = "https://www.gravatar.com", e))(Hr || {}), Oo = { exports: {} }, ue = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ju;
function k2() {
  if (ju) return ue;
  ju = 1;
  var e = Symbol.for("react.element"), t = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), n = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.provider"), i = Symbol.for("react.context"), s = Symbol.for("react.forward_ref"), c = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), m = Symbol.iterator;
  function h(f) {
    return f === null || typeof f != "object" ? null : (f = m && f[m] || f["@@iterator"], typeof f == "function" ? f : null);
  }
  var k = { isMounted: function() {
    return !1;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, O = Object.assign, w = {};
  function b(f, x, A) {
    this.props = f, this.context = x, this.refs = w, this.updater = A || k;
  }
  b.prototype.isReactComponent = {}, b.prototype.setState = function(f, x) {
    if (typeof f != "object" && typeof f != "function" && f != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, f, x, "setState");
  }, b.prototype.forceUpdate = function(f) {
    this.updater.enqueueForceUpdate(this, f, "forceUpdate");
  };
  function E() {
  }
  E.prototype = b.prototype;
  function N(f, x, A) {
    this.props = f, this.context = x, this.refs = w, this.updater = A || k;
  }
  var T = N.prototype = new E();
  T.constructor = N, O(T, b.prototype), T.isPureReactComponent = !0;
  var j = Array.isArray, p = Object.prototype.hasOwnProperty, V = { current: null }, J = { key: !0, ref: !0, __self: !0, __source: !0 };
  function oe(f, x, A) {
    var S, C = {}, _ = null, $ = null;
    if (x != null) for (S in x.ref !== void 0 && ($ = x.ref), x.key !== void 0 && (_ = "" + x.key), x) p.call(x, S) && !J.hasOwnProperty(S) && (C[S] = x[S]);
    var R = arguments.length - 2;
    if (R === 1) C.children = A;
    else if (1 < R) {
      for (var M = Array(R), z = 0; z < R; z++) M[z] = arguments[z + 2];
      C.children = M;
    }
    if (f && f.defaultProps) for (S in R = f.defaultProps, R) C[S] === void 0 && (C[S] = R[S]);
    return { $$typeof: e, type: f, key: _, ref: $, props: C, _owner: V.current };
  }
  function me(f, x) {
    return { $$typeof: e, type: f.type, key: x, ref: f.ref, props: f.props, _owner: f._owner };
  }
  function ne(f) {
    return typeof f == "object" && f !== null && f.$$typeof === e;
  }
  function ge(f) {
    var x = { "=": "=0", ":": "=2" };
    return "$" + f.replace(/[=:]/g, function(A) {
      return x[A];
    });
  }
  var F = /\/+/g;
  function be(f, x) {
    return typeof f == "object" && f !== null && f.key != null ? ge("" + f.key) : x.toString(36);
  }
  function ee(f, x, A, S, C) {
    var _ = typeof f;
    (_ === "undefined" || _ === "boolean") && (f = null);
    var $ = !1;
    if (f === null) $ = !0;
    else switch (_) {
      case "string":
      case "number":
        $ = !0;
        break;
      case "object":
        switch (f.$$typeof) {
          case e:
          case t:
            $ = !0;
        }
    }
    if ($) return $ = f, C = C($), f = S === "" ? "." + be($, 0) : S, j(C) ? (A = "", f != null && (A = f.replace(F, "$&/") + "/"), ee(C, x, A, "", function(z) {
      return z;
    })) : C != null && (ne(C) && (C = me(C, A + (!C.key || $ && $.key === C.key ? "" : ("" + C.key).replace(F, "$&/") + "/") + f)), x.push(C)), 1;
    if ($ = 0, S = S === "" ? "." : S + ":", j(f)) for (var R = 0; R < f.length; R++) {
      _ = f[R];
      var M = S + be(_, R);
      $ += ee(_, x, A, M, C);
    }
    else if (M = h(f), typeof M == "function") for (f = M.call(f), R = 0; !(_ = f.next()).done; ) _ = _.value, M = S + be(_, R++), $ += ee(_, x, A, M, C);
    else if (_ === "object") throw x = String(f), Error("Objects are not valid as a React child (found: " + (x === "[object Object]" ? "object with keys {" + Object.keys(f).join(", ") + "}" : x) + "). If you meant to render a collection of children, use an array instead.");
    return $;
  }
  function ce(f, x, A) {
    if (f == null) return f;
    var S = [], C = 0;
    return ee(f, S, "", "", function(_) {
      return x.call(A, _, C++);
    }), S;
  }
  function G(f) {
    if (f._status === -1) {
      var x = f._result;
      x = x(), x.then(function(A) {
        (f._status === 0 || f._status === -1) && (f._status = 1, f._result = A);
      }, function(A) {
        (f._status === 0 || f._status === -1) && (f._status = 2, f._result = A);
      }), f._status === -1 && (f._status = 0, f._result = x);
    }
    if (f._status === 1) return f._result.default;
    throw f._result;
  }
  var U = { current: null }, Z = { transition: null }, te = { ReactCurrentDispatcher: U, ReactCurrentBatchConfig: Z, ReactCurrentOwner: V };
  function g() {
    throw Error("act(...) is not supported in production builds of React.");
  }
  return ue.Children = { map: ce, forEach: function(f, x, A) {
    ce(f, function() {
      x.apply(this, arguments);
    }, A);
  }, count: function(f) {
    var x = 0;
    return ce(f, function() {
      x++;
    }), x;
  }, toArray: function(f) {
    return ce(f, function(x) {
      return x;
    }) || [];
  }, only: function(f) {
    if (!ne(f)) throw Error("React.Children.only expected to receive a single React element child.");
    return f;
  } }, ue.Component = b, ue.Fragment = r, ue.Profiler = a, ue.PureComponent = N, ue.StrictMode = n, ue.Suspense = c, ue.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = te, ue.act = g, ue.cloneElement = function(f, x, A) {
    if (f == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + f + ".");
    var S = O({}, f.props), C = f.key, _ = f.ref, $ = f._owner;
    if (x != null) {
      if (x.ref !== void 0 && (_ = x.ref, $ = V.current), x.key !== void 0 && (C = "" + x.key), f.type && f.type.defaultProps) var R = f.type.defaultProps;
      for (M in x) p.call(x, M) && !J.hasOwnProperty(M) && (S[M] = x[M] === void 0 && R !== void 0 ? R[M] : x[M]);
    }
    var M = arguments.length - 2;
    if (M === 1) S.children = A;
    else if (1 < M) {
      R = Array(M);
      for (var z = 0; z < M; z++) R[z] = arguments[z + 2];
      S.children = R;
    }
    return { $$typeof: e, type: f.type, key: C, ref: _, props: S, _owner: $ };
  }, ue.createContext = function(f) {
    return f = { $$typeof: i, _currentValue: f, _currentValue2: f, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, f.Provider = { $$typeof: o, _context: f }, f.Consumer = f;
  }, ue.createElement = oe, ue.createFactory = function(f) {
    var x = oe.bind(null, f);
    return x.type = f, x;
  }, ue.createRef = function() {
    return { current: null };
  }, ue.forwardRef = function(f) {
    return { $$typeof: s, render: f };
  }, ue.isValidElement = ne, ue.lazy = function(f) {
    return { $$typeof: d, _payload: { _status: -1, _result: f }, _init: G };
  }, ue.memo = function(f, x) {
    return { $$typeof: u, type: f, compare: x === void 0 ? null : x };
  }, ue.startTransition = function(f) {
    var x = Z.transition;
    Z.transition = {};
    try {
      f();
    } finally {
      Z.transition = x;
    }
  }, ue.unstable_act = g, ue.useCallback = function(f, x) {
    return U.current.useCallback(f, x);
  }, ue.useContext = function(f) {
    return U.current.useContext(f);
  }, ue.useDebugValue = function() {
  }, ue.useDeferredValue = function(f) {
    return U.current.useDeferredValue(f);
  }, ue.useEffect = function(f, x) {
    return U.current.useEffect(f, x);
  }, ue.useId = function() {
    return U.current.useId();
  }, ue.useImperativeHandle = function(f, x, A) {
    return U.current.useImperativeHandle(f, x, A);
  }, ue.useInsertionEffect = function(f, x) {
    return U.current.useInsertionEffect(f, x);
  }, ue.useLayoutEffect = function(f, x) {
    return U.current.useLayoutEffect(f, x);
  }, ue.useMemo = function(f, x) {
    return U.current.useMemo(f, x);
  }, ue.useReducer = function(f, x, A) {
    return U.current.useReducer(f, x, A);
  }, ue.useRef = function(f) {
    return U.current.useRef(f);
  }, ue.useState = function(f) {
    return U.current.useState(f);
  }, ue.useSyncExternalStore = function(f, x, A) {
    return U.current.useSyncExternalStore(f, x, A);
  }, ue.useTransition = function() {
    return U.current.useTransition();
  }, ue.version = "18.3.1", ue;
}
var Vn = { exports: {} };
/**
 * @license React
 * react.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Vn.exports;
var Iu;
function O2() {
  return Iu || (Iu = 1, function(e, t) {
    process.env.NODE_ENV !== "production" && function() {
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
      var r = "18.3.1", n = Symbol.for("react.element"), a = Symbol.for("react.portal"), o = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), s = Symbol.for("react.profiler"), c = Symbol.for("react.provider"), u = Symbol.for("react.context"), d = Symbol.for("react.forward_ref"), m = Symbol.for("react.suspense"), h = Symbol.for("react.suspense_list"), k = Symbol.for("react.memo"), O = Symbol.for("react.lazy"), w = Symbol.for("react.offscreen"), b = Symbol.iterator, E = "@@iterator";
      function N(l) {
        if (l === null || typeof l != "object")
          return null;
        var y = b && l[b] || l[E];
        return typeof y == "function" ? y : null;
      }
      var T = {
        /**
         * @internal
         * @type {ReactComponent}
         */
        current: null
      }, j = {
        transition: null
      }, p = {
        current: null,
        // Used to reproduce behavior of `batchedUpdates` in legacy mode.
        isBatchingLegacy: !1,
        didScheduleLegacyUpdate: !1
      }, V = {
        /**
         * @internal
         * @type {ReactComponent}
         */
        current: null
      }, J = {}, oe = null;
      function me(l) {
        oe = l;
      }
      J.setExtraStackFrame = function(l) {
        oe = l;
      }, J.getCurrentStack = null, J.getStackAddendum = function() {
        var l = "";
        oe && (l += oe);
        var y = J.getCurrentStack;
        return y && (l += y() || ""), l;
      };
      var ne = !1, ge = !1, F = !1, be = !1, ee = !1, ce = {
        ReactCurrentDispatcher: T,
        ReactCurrentBatchConfig: j,
        ReactCurrentOwner: V
      };
      ce.ReactDebugCurrentFrame = J, ce.ReactCurrentActQueue = p;
      function G(l) {
        {
          for (var y = arguments.length, P = new Array(y > 1 ? y - 1 : 0), I = 1; I < y; I++)
            P[I - 1] = arguments[I];
          Z("warn", l, P);
        }
      }
      function U(l) {
        {
          for (var y = arguments.length, P = new Array(y > 1 ? y - 1 : 0), I = 1; I < y; I++)
            P[I - 1] = arguments[I];
          Z("error", l, P);
        }
      }
      function Z(l, y, P) {
        {
          var I = ce.ReactDebugCurrentFrame, Y = I.getStackAddendum();
          Y !== "" && (y += "%s", P = P.concat([Y]));
          var re = P.map(function(H) {
            return String(H);
          });
          re.unshift("Warning: " + y), Function.prototype.apply.call(console[l], console, re);
        }
      }
      var te = {};
      function g(l, y) {
        {
          var P = l.constructor, I = P && (P.displayName || P.name) || "ReactClass", Y = I + "." + y;
          if (te[Y])
            return;
          U("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", y, I), te[Y] = !0;
        }
      }
      var f = {
        /**
         * Checks whether or not this composite component is mounted.
         * @param {ReactClass} publicInstance The instance we want to test.
         * @return {boolean} True if mounted, false otherwise.
         * @protected
         * @final
         */
        isMounted: function(l) {
          return !1;
        },
        /**
         * Forces an update. This should only be invoked when it is known with
         * certainty that we are **not** in a DOM transaction.
         *
         * You may want to call this when you know that some deeper aspect of the
         * component's state has changed but `setState` was not called.
         *
         * This will not invoke `shouldComponentUpdate`, but it will invoke
         * `componentWillUpdate` and `componentDidUpdate`.
         *
         * @param {ReactClass} publicInstance The instance that should rerender.
         * @param {?function} callback Called after component is updated.
         * @param {?string} callerName name of the calling function in the public API.
         * @internal
         */
        enqueueForceUpdate: function(l, y, P) {
          g(l, "forceUpdate");
        },
        /**
         * Replaces all of the state. Always use this or `setState` to mutate state.
         * You should treat `this.state` as immutable.
         *
         * There is no guarantee that `this.state` will be immediately updated, so
         * accessing `this.state` after calling this method may return the old value.
         *
         * @param {ReactClass} publicInstance The instance that should rerender.
         * @param {object} completeState Next state.
         * @param {?function} callback Called after component is updated.
         * @param {?string} callerName name of the calling function in the public API.
         * @internal
         */
        enqueueReplaceState: function(l, y, P, I) {
          g(l, "replaceState");
        },
        /**
         * Sets a subset of the state. This only exists because _pendingState is
         * internal. This provides a merging strategy that is not available to deep
         * properties which is confusing. TODO: Expose pendingState or don't use it
         * during the merge.
         *
         * @param {ReactClass} publicInstance The instance that should rerender.
         * @param {object} partialState Next partial state to be merged with state.
         * @param {?function} callback Called after component is updated.
         * @param {?string} Name of the calling function in the public API.
         * @internal
         */
        enqueueSetState: function(l, y, P, I) {
          g(l, "setState");
        }
      }, x = Object.assign, A = {};
      Object.freeze(A);
      function S(l, y, P) {
        this.props = l, this.context = y, this.refs = A, this.updater = P || f;
      }
      S.prototype.isReactComponent = {}, S.prototype.setState = function(l, y) {
        if (typeof l != "object" && typeof l != "function" && l != null)
          throw new Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, l, y, "setState");
      }, S.prototype.forceUpdate = function(l) {
        this.updater.enqueueForceUpdate(this, l, "forceUpdate");
      };
      {
        var C = {
          isMounted: ["isMounted", "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."],
          replaceState: ["replaceState", "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."]
        }, _ = function(l, y) {
          Object.defineProperty(S.prototype, l, {
            get: function() {
              G("%s(...) is deprecated in plain JavaScript React classes. %s", y[0], y[1]);
            }
          });
        };
        for (var $ in C)
          C.hasOwnProperty($) && _($, C[$]);
      }
      function R() {
      }
      R.prototype = S.prototype;
      function M(l, y, P) {
        this.props = l, this.context = y, this.refs = A, this.updater = P || f;
      }
      var z = M.prototype = new R();
      z.constructor = M, x(z, S.prototype), z.isPureReactComponent = !0;
      function Q() {
        var l = {
          current: null
        };
        return Object.seal(l), l;
      }
      var v = Array.isArray;
      function ye(l) {
        return v(l);
      }
      function De(l) {
        {
          var y = typeof Symbol == "function" && Symbol.toStringTag, P = y && l[Symbol.toStringTag] || l.constructor.name || "Object";
          return P;
        }
      }
      function Ze(l) {
        try {
          return Os(l), !1;
        } catch {
          return !0;
        }
      }
      function Os(l) {
        return "" + l;
      }
      function dn(l) {
        if (Ze(l))
          return U("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", De(l)), Os(l);
      }
      function $p(l, y, P) {
        var I = l.displayName;
        if (I)
          return I;
        var Y = y.displayName || y.name || "";
        return Y !== "" ? P + "(" + Y + ")" : P;
      }
      function Ss(l) {
        return l.displayName || "Context";
      }
      function wt(l) {
        if (l == null)
          return null;
        if (typeof l.tag == "number" && U("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof l == "function")
          return l.displayName || l.name || null;
        if (typeof l == "string")
          return l;
        switch (l) {
          case o:
            return "Fragment";
          case a:
            return "Portal";
          case s:
            return "Profiler";
          case i:
            return "StrictMode";
          case m:
            return "Suspense";
          case h:
            return "SuspenseList";
        }
        if (typeof l == "object")
          switch (l.$$typeof) {
            case u:
              var y = l;
              return Ss(y) + ".Consumer";
            case c:
              var P = l;
              return Ss(P._context) + ".Provider";
            case d:
              return $p(l, l.render, "ForwardRef");
            case k:
              var I = l.displayName || null;
              return I !== null ? I : wt(l.type) || "Memo";
            case O: {
              var Y = l, re = Y._payload, H = Y._init;
              try {
                return wt(H(re));
              } catch {
                return null;
              }
            }
          }
        return null;
      }
      var Tr = Object.prototype.hasOwnProperty, Es = {
        key: !0,
        ref: !0,
        __self: !0,
        __source: !0
      }, As, Ps, ka;
      ka = {};
      function Cs(l) {
        if (Tr.call(l, "ref")) {
          var y = Object.getOwnPropertyDescriptor(l, "ref").get;
          if (y && y.isReactWarning)
            return !1;
        }
        return l.ref !== void 0;
      }
      function $s(l) {
        if (Tr.call(l, "key")) {
          var y = Object.getOwnPropertyDescriptor(l, "key").get;
          if (y && y.isReactWarning)
            return !1;
        }
        return l.key !== void 0;
      }
      function Np(l, y) {
        var P = function() {
          As || (As = !0, U("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", y));
        };
        P.isReactWarning = !0, Object.defineProperty(l, "key", {
          get: P,
          configurable: !0
        });
      }
      function _p(l, y) {
        var P = function() {
          Ps || (Ps = !0, U("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", y));
        };
        P.isReactWarning = !0, Object.defineProperty(l, "ref", {
          get: P,
          configurable: !0
        });
      }
      function Tp(l) {
        if (typeof l.ref == "string" && V.current && l.__self && V.current.stateNode !== l.__self) {
          var y = wt(V.current.type);
          ka[y] || (U('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', y, l.ref), ka[y] = !0);
        }
      }
      var Oa = function(l, y, P, I, Y, re, H) {
        var ae = {
          // This tag allows us to uniquely identify this as a React Element
          $$typeof: n,
          // Built-in properties that belong on the element
          type: l,
          key: y,
          ref: P,
          props: H,
          // Record the component responsible for creating this element.
          _owner: re
        };
        return ae._store = {}, Object.defineProperty(ae._store, "validated", {
          configurable: !1,
          enumerable: !1,
          writable: !0,
          value: !1
        }), Object.defineProperty(ae, "_self", {
          configurable: !1,
          enumerable: !1,
          writable: !1,
          value: I
        }), Object.defineProperty(ae, "_source", {
          configurable: !1,
          enumerable: !1,
          writable: !1,
          value: Y
        }), Object.freeze && (Object.freeze(ae.props), Object.freeze(ae)), ae;
      };
      function jp(l, y, P) {
        var I, Y = {}, re = null, H = null, ae = null, he = null;
        if (y != null) {
          Cs(y) && (H = y.ref, Tp(y)), $s(y) && (dn(y.key), re = "" + y.key), ae = y.__self === void 0 ? null : y.__self, he = y.__source === void 0 ? null : y.__source;
          for (I in y)
            Tr.call(y, I) && !Es.hasOwnProperty(I) && (Y[I] = y[I]);
        }
        var Ee = arguments.length - 2;
        if (Ee === 1)
          Y.children = P;
        else if (Ee > 1) {
          for (var je = Array(Ee), Ie = 0; Ie < Ee; Ie++)
            je[Ie] = arguments[Ie + 2];
          Object.freeze && Object.freeze(je), Y.children = je;
        }
        if (l && l.defaultProps) {
          var Re = l.defaultProps;
          for (I in Re)
            Y[I] === void 0 && (Y[I] = Re[I]);
        }
        if (re || H) {
          var ze = typeof l == "function" ? l.displayName || l.name || "Unknown" : l;
          re && Np(Y, ze), H && _p(Y, ze);
        }
        return Oa(l, re, H, ae, he, V.current, Y);
      }
      function Ip(l, y) {
        var P = Oa(l.type, y, l.ref, l._self, l._source, l._owner, l.props);
        return P;
      }
      function Rp(l, y, P) {
        if (l == null)
          throw new Error("React.cloneElement(...): The argument must be a React element, but you passed " + l + ".");
        var I, Y = x({}, l.props), re = l.key, H = l.ref, ae = l._self, he = l._source, Ee = l._owner;
        if (y != null) {
          Cs(y) && (H = y.ref, Ee = V.current), $s(y) && (dn(y.key), re = "" + y.key);
          var je;
          l.type && l.type.defaultProps && (je = l.type.defaultProps);
          for (I in y)
            Tr.call(y, I) && !Es.hasOwnProperty(I) && (y[I] === void 0 && je !== void 0 ? Y[I] = je[I] : Y[I] = y[I]);
        }
        var Ie = arguments.length - 2;
        if (Ie === 1)
          Y.children = P;
        else if (Ie > 1) {
          for (var Re = Array(Ie), ze = 0; ze < Ie; ze++)
            Re[ze] = arguments[ze + 2];
          Y.children = Re;
        }
        return Oa(l.type, re, H, ae, he, Ee, Y);
      }
      function ar(l) {
        return typeof l == "object" && l !== null && l.$$typeof === n;
      }
      var Ns = ".", Mp = ":";
      function zp(l) {
        var y = /[=:]/g, P = {
          "=": "=0",
          ":": "=2"
        }, I = l.replace(y, function(Y) {
          return P[Y];
        });
        return "$" + I;
      }
      var _s = !1, Fp = /\/+/g;
      function Ts(l) {
        return l.replace(Fp, "$&/");
      }
      function Sa(l, y) {
        return typeof l == "object" && l !== null && l.key != null ? (dn(l.key), zp("" + l.key)) : y.toString(36);
      }
      function pn(l, y, P, I, Y) {
        var re = typeof l;
        (re === "undefined" || re === "boolean") && (l = null);
        var H = !1;
        if (l === null)
          H = !0;
        else
          switch (re) {
            case "string":
            case "number":
              H = !0;
              break;
            case "object":
              switch (l.$$typeof) {
                case n:
                case a:
                  H = !0;
              }
          }
        if (H) {
          var ae = l, he = Y(ae), Ee = I === "" ? Ns + Sa(ae, 0) : I;
          if (ye(he)) {
            var je = "";
            Ee != null && (je = Ts(Ee) + "/"), pn(he, y, je, "", function(Nm) {
              return Nm;
            });
          } else he != null && (ar(he) && (he.key && (!ae || ae.key !== he.key) && dn(he.key), he = Ip(
            he,
            // Keep both the (mapped) and old keys if they differ, just as
            // traverseAllChildren used to do for objects as children
            P + // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
            (he.key && (!ae || ae.key !== he.key) ? (
              // $FlowFixMe Flow incorrectly thinks existing element's key can be a number
              // eslint-disable-next-line react-internal/safe-string-coercion
              Ts("" + he.key) + "/"
            ) : "") + Ee
          )), y.push(he));
          return 1;
        }
        var Ie, Re, ze = 0, Fe = I === "" ? Ns : I + Mp;
        if (ye(l))
          for (var wn = 0; wn < l.length; wn++)
            Ie = l[wn], Re = Fe + Sa(Ie, wn), ze += pn(Ie, y, P, Re, Y);
        else {
          var ja = N(l);
          if (typeof ja == "function") {
            var nl = l;
            ja === nl.entries && (_s || G("Using Maps as children is not supported. Use an array of keyed ReactElements instead."), _s = !0);
            for (var Cm = ja.call(nl), al, $m = 0; !(al = Cm.next()).done; )
              Ie = al.value, Re = Fe + Sa(Ie, $m++), ze += pn(Ie, y, P, Re, Y);
          } else if (re === "object") {
            var ol = String(l);
            throw new Error("Objects are not valid as a React child (found: " + (ol === "[object Object]" ? "object with keys {" + Object.keys(l).join(", ") + "}" : ol) + "). If you meant to render a collection of children, use an array instead.");
          }
        }
        return ze;
      }
      function mn(l, y, P) {
        if (l == null)
          return l;
        var I = [], Y = 0;
        return pn(l, I, "", "", function(re) {
          return y.call(P, re, Y++);
        }), I;
      }
      function Dp(l) {
        var y = 0;
        return mn(l, function() {
          y++;
        }), y;
      }
      function Lp(l, y, P) {
        mn(l, function() {
          y.apply(this, arguments);
        }, P);
      }
      function Wp(l) {
        return mn(l, function(y) {
          return y;
        }) || [];
      }
      function Up(l) {
        if (!ar(l))
          throw new Error("React.Children.only expected to receive a single React element child.");
        return l;
      }
      function Yp(l) {
        var y = {
          $$typeof: u,
          // As a workaround to support multiple concurrent renderers, we categorize
          // some renderers as primary and others as secondary. We only expect
          // there to be two concurrent renderers at most: React Native (primary) and
          // Fabric (secondary); React DOM (primary) and React ART (secondary).
          // Secondary renderers store their context values on separate fields.
          _currentValue: l,
          _currentValue2: l,
          // Used to track how many concurrent renderers this context currently
          // supports within in a single renderer. Such as parallel server rendering.
          _threadCount: 0,
          // These are circular
          Provider: null,
          Consumer: null,
          // Add these to use same hidden class in VM as ServerContext
          _defaultValue: null,
          _globalName: null
        };
        y.Provider = {
          $$typeof: c,
          _context: y
        };
        var P = !1, I = !1, Y = !1;
        {
          var re = {
            $$typeof: u,
            _context: y
          };
          Object.defineProperties(re, {
            Provider: {
              get: function() {
                return I || (I = !0, U("Rendering <Context.Consumer.Provider> is not supported and will be removed in a future major release. Did you mean to render <Context.Provider> instead?")), y.Provider;
              },
              set: function(H) {
                y.Provider = H;
              }
            },
            _currentValue: {
              get: function() {
                return y._currentValue;
              },
              set: function(H) {
                y._currentValue = H;
              }
            },
            _currentValue2: {
              get: function() {
                return y._currentValue2;
              },
              set: function(H) {
                y._currentValue2 = H;
              }
            },
            _threadCount: {
              get: function() {
                return y._threadCount;
              },
              set: function(H) {
                y._threadCount = H;
              }
            },
            Consumer: {
              get: function() {
                return P || (P = !0, U("Rendering <Context.Consumer.Consumer> is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?")), y.Consumer;
              }
            },
            displayName: {
              get: function() {
                return y.displayName;
              },
              set: function(H) {
                Y || (G("Setting `displayName` on Context.Consumer has no effect. You should set it directly on the context with Context.displayName = '%s'.", H), Y = !0);
              }
            }
          }), y.Consumer = re;
        }
        return y._currentRenderer = null, y._currentRenderer2 = null, y;
      }
      var jr = -1, Ea = 0, js = 1, Vp = 2;
      function Hp(l) {
        if (l._status === jr) {
          var y = l._result, P = y();
          if (P.then(function(re) {
            if (l._status === Ea || l._status === jr) {
              var H = l;
              H._status = js, H._result = re;
            }
          }, function(re) {
            if (l._status === Ea || l._status === jr) {
              var H = l;
              H._status = Vp, H._result = re;
            }
          }), l._status === jr) {
            var I = l;
            I._status = Ea, I._result = P;
          }
        }
        if (l._status === js) {
          var Y = l._result;
          return Y === void 0 && U(`lazy: Expected the result of a dynamic import() call. Instead received: %s

Your code should look like: 
  const MyComponent = lazy(() => import('./MyComponent'))

Did you accidentally put curly braces around the import?`, Y), "default" in Y || U(`lazy: Expected the result of a dynamic import() call. Instead received: %s

Your code should look like: 
  const MyComponent = lazy(() => import('./MyComponent'))`, Y), Y.default;
        } else
          throw l._result;
      }
      function qp(l) {
        var y = {
          // We use these fields to store the result.
          _status: jr,
          _result: l
        }, P = {
          $$typeof: O,
          _payload: y,
          _init: Hp
        };
        {
          var I, Y;
          Object.defineProperties(P, {
            defaultProps: {
              configurable: !0,
              get: function() {
                return I;
              },
              set: function(re) {
                U("React.lazy(...): It is not supported to assign `defaultProps` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it."), I = re, Object.defineProperty(P, "defaultProps", {
                  enumerable: !0
                });
              }
            },
            propTypes: {
              configurable: !0,
              get: function() {
                return Y;
              },
              set: function(re) {
                U("React.lazy(...): It is not supported to assign `propTypes` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it."), Y = re, Object.defineProperty(P, "propTypes", {
                  enumerable: !0
                });
              }
            }
          });
        }
        return P;
      }
      function Gp(l) {
        l != null && l.$$typeof === k ? U("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).") : typeof l != "function" ? U("forwardRef requires a render function but was given %s.", l === null ? "null" : typeof l) : l.length !== 0 && l.length !== 2 && U("forwardRef render functions accept exactly two parameters: props and ref. %s", l.length === 1 ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."), l != null && (l.defaultProps != null || l.propTypes != null) && U("forwardRef render functions do not support propTypes or defaultProps. Did you accidentally pass a React component?");
        var y = {
          $$typeof: d,
          render: l
        };
        {
          var P;
          Object.defineProperty(y, "displayName", {
            enumerable: !1,
            configurable: !0,
            get: function() {
              return P;
            },
            set: function(I) {
              P = I, !l.name && !l.displayName && (l.displayName = I);
            }
          });
        }
        return y;
      }
      var Is;
      Is = Symbol.for("react.module.reference");
      function Rs(l) {
        return !!(typeof l == "string" || typeof l == "function" || l === o || l === s || ee || l === i || l === m || l === h || be || l === w || ne || ge || F || typeof l == "object" && l !== null && (l.$$typeof === O || l.$$typeof === k || l.$$typeof === c || l.$$typeof === u || l.$$typeof === d || // This needs to include all possible module reference object
        // types supported by any Flight configuration anywhere since
        // we don't know which Flight build this will end up being used
        // with.
        l.$$typeof === Is || l.getModuleId !== void 0));
      }
      function Bp(l, y) {
        Rs(l) || U("memo: The first argument must be a component. Instead received: %s", l === null ? "null" : typeof l);
        var P = {
          $$typeof: k,
          type: l,
          compare: y === void 0 ? null : y
        };
        {
          var I;
          Object.defineProperty(P, "displayName", {
            enumerable: !1,
            configurable: !0,
            get: function() {
              return I;
            },
            set: function(Y) {
              I = Y, !l.name && !l.displayName && (l.displayName = Y);
            }
          });
        }
        return P;
      }
      function Ve() {
        var l = T.current;
        return l === null && U(`Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.`), l;
      }
      function Xp(l) {
        var y = Ve();
        if (l._context !== void 0) {
          var P = l._context;
          P.Consumer === l ? U("Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be removed in a future major release. Did you mean to call useContext(Context) instead?") : P.Provider === l && U("Calling useContext(Context.Provider) is not supported. Did you mean to call useContext(Context) instead?");
        }
        return y.useContext(l);
      }
      function Kp(l) {
        var y = Ve();
        return y.useState(l);
      }
      function Jp(l, y, P) {
        var I = Ve();
        return I.useReducer(l, y, P);
      }
      function Zp(l) {
        var y = Ve();
        return y.useRef(l);
      }
      function Qp(l, y) {
        var P = Ve();
        return P.useEffect(l, y);
      }
      function em(l, y) {
        var P = Ve();
        return P.useInsertionEffect(l, y);
      }
      function tm(l, y) {
        var P = Ve();
        return P.useLayoutEffect(l, y);
      }
      function rm(l, y) {
        var P = Ve();
        return P.useCallback(l, y);
      }
      function nm(l, y) {
        var P = Ve();
        return P.useMemo(l, y);
      }
      function am(l, y, P) {
        var I = Ve();
        return I.useImperativeHandle(l, y, P);
      }
      function om(l, y) {
        {
          var P = Ve();
          return P.useDebugValue(l, y);
        }
      }
      function im() {
        var l = Ve();
        return l.useTransition();
      }
      function sm(l) {
        var y = Ve();
        return y.useDeferredValue(l);
      }
      function lm() {
        var l = Ve();
        return l.useId();
      }
      function cm(l, y, P) {
        var I = Ve();
        return I.useSyncExternalStore(l, y, P);
      }
      var Ir = 0, Ms, zs, Fs, Ds, Ls, Ws, Us;
      function Ys() {
      }
      Ys.__reactDisabledLog = !0;
      function um() {
        {
          if (Ir === 0) {
            Ms = console.log, zs = console.info, Fs = console.warn, Ds = console.error, Ls = console.group, Ws = console.groupCollapsed, Us = console.groupEnd;
            var l = {
              configurable: !0,
              enumerable: !0,
              value: Ys,
              writable: !0
            };
            Object.defineProperties(console, {
              info: l,
              log: l,
              warn: l,
              error: l,
              group: l,
              groupCollapsed: l,
              groupEnd: l
            });
          }
          Ir++;
        }
      }
      function fm() {
        {
          if (Ir--, Ir === 0) {
            var l = {
              configurable: !0,
              enumerable: !0,
              writable: !0
            };
            Object.defineProperties(console, {
              log: x({}, l, {
                value: Ms
              }),
              info: x({}, l, {
                value: zs
              }),
              warn: x({}, l, {
                value: Fs
              }),
              error: x({}, l, {
                value: Ds
              }),
              group: x({}, l, {
                value: Ls
              }),
              groupCollapsed: x({}, l, {
                value: Ws
              }),
              groupEnd: x({}, l, {
                value: Us
              })
            });
          }
          Ir < 0 && U("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
        }
      }
      var Aa = ce.ReactCurrentDispatcher, Pa;
      function gn(l, y, P) {
        {
          if (Pa === void 0)
            try {
              throw Error();
            } catch (Y) {
              var I = Y.stack.trim().match(/\n( *(at )?)/);
              Pa = I && I[1] || "";
            }
          return `
` + Pa + l;
        }
      }
      var Ca = !1, hn;
      {
        var dm = typeof WeakMap == "function" ? WeakMap : Map;
        hn = new dm();
      }
      function Vs(l, y) {
        if (!l || Ca)
          return "";
        {
          var P = hn.get(l);
          if (P !== void 0)
            return P;
        }
        var I;
        Ca = !0;
        var Y = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        var re;
        re = Aa.current, Aa.current = null, um();
        try {
          if (y) {
            var H = function() {
              throw Error();
            };
            if (Object.defineProperty(H.prototype, "props", {
              set: function() {
                throw Error();
              }
            }), typeof Reflect == "object" && Reflect.construct) {
              try {
                Reflect.construct(H, []);
              } catch (Fe) {
                I = Fe;
              }
              Reflect.construct(l, [], H);
            } else {
              try {
                H.call();
              } catch (Fe) {
                I = Fe;
              }
              l.call(H.prototype);
            }
          } else {
            try {
              throw Error();
            } catch (Fe) {
              I = Fe;
            }
            l();
          }
        } catch (Fe) {
          if (Fe && I && typeof Fe.stack == "string") {
            for (var ae = Fe.stack.split(`
`), he = I.stack.split(`
`), Ee = ae.length - 1, je = he.length - 1; Ee >= 1 && je >= 0 && ae[Ee] !== he[je]; )
              je--;
            for (; Ee >= 1 && je >= 0; Ee--, je--)
              if (ae[Ee] !== he[je]) {
                if (Ee !== 1 || je !== 1)
                  do
                    if (Ee--, je--, je < 0 || ae[Ee] !== he[je]) {
                      var Ie = `
` + ae[Ee].replace(" at new ", " at ");
                      return l.displayName && Ie.includes("<anonymous>") && (Ie = Ie.replace("<anonymous>", l.displayName)), typeof l == "function" && hn.set(l, Ie), Ie;
                    }
                  while (Ee >= 1 && je >= 0);
                break;
              }
          }
        } finally {
          Ca = !1, Aa.current = re, fm(), Error.prepareStackTrace = Y;
        }
        var Re = l ? l.displayName || l.name : "", ze = Re ? gn(Re) : "";
        return typeof l == "function" && hn.set(l, ze), ze;
      }
      function pm(l, y, P) {
        return Vs(l, !1);
      }
      function mm(l) {
        var y = l.prototype;
        return !!(y && y.isReactComponent);
      }
      function bn(l, y, P) {
        if (l == null)
          return "";
        if (typeof l == "function")
          return Vs(l, mm(l));
        if (typeof l == "string")
          return gn(l);
        switch (l) {
          case m:
            return gn("Suspense");
          case h:
            return gn("SuspenseList");
        }
        if (typeof l == "object")
          switch (l.$$typeof) {
            case d:
              return pm(l.render);
            case k:
              return bn(l.type, y, P);
            case O: {
              var I = l, Y = I._payload, re = I._init;
              try {
                return bn(re(Y), y, P);
              } catch {
              }
            }
          }
        return "";
      }
      var Hs = {}, qs = ce.ReactDebugCurrentFrame;
      function yn(l) {
        if (l) {
          var y = l._owner, P = bn(l.type, l._source, y ? y.type : null);
          qs.setExtraStackFrame(P);
        } else
          qs.setExtraStackFrame(null);
      }
      function gm(l, y, P, I, Y) {
        {
          var re = Function.call.bind(Tr);
          for (var H in l)
            if (re(l, H)) {
              var ae = void 0;
              try {
                if (typeof l[H] != "function") {
                  var he = Error((I || "React class") + ": " + P + " type `" + H + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof l[H] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                  throw he.name = "Invariant Violation", he;
                }
                ae = l[H](y, H, I, P, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
              } catch (Ee) {
                ae = Ee;
              }
              ae && !(ae instanceof Error) && (yn(Y), U("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", I || "React class", P, H, typeof ae), yn(null)), ae instanceof Error && !(ae.message in Hs) && (Hs[ae.message] = !0, yn(Y), U("Failed %s type: %s", P, ae.message), yn(null));
            }
        }
      }
      function or(l) {
        if (l) {
          var y = l._owner, P = bn(l.type, l._source, y ? y.type : null);
          me(P);
        } else
          me(null);
      }
      var $a;
      $a = !1;
      function Gs() {
        if (V.current) {
          var l = wt(V.current.type);
          if (l)
            return `

Check the render method of \`` + l + "`.";
        }
        return "";
      }
      function hm(l) {
        if (l !== void 0) {
          var y = l.fileName.replace(/^.*[\\\/]/, ""), P = l.lineNumber;
          return `

Check your code at ` + y + ":" + P + ".";
        }
        return "";
      }
      function bm(l) {
        return l != null ? hm(l.__source) : "";
      }
      var Bs = {};
      function ym(l) {
        var y = Gs();
        if (!y) {
          var P = typeof l == "string" ? l : l.displayName || l.name;
          P && (y = `

Check the top-level render call using <` + P + ">.");
        }
        return y;
      }
      function Xs(l, y) {
        if (!(!l._store || l._store.validated || l.key != null)) {
          l._store.validated = !0;
          var P = ym(y);
          if (!Bs[P]) {
            Bs[P] = !0;
            var I = "";
            l && l._owner && l._owner !== V.current && (I = " It was passed a child from " + wt(l._owner.type) + "."), or(l), U('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', P, I), or(null);
          }
        }
      }
      function Ks(l, y) {
        if (typeof l == "object") {
          if (ye(l))
            for (var P = 0; P < l.length; P++) {
              var I = l[P];
              ar(I) && Xs(I, y);
            }
          else if (ar(l))
            l._store && (l._store.validated = !0);
          else if (l) {
            var Y = N(l);
            if (typeof Y == "function" && Y !== l.entries)
              for (var re = Y.call(l), H; !(H = re.next()).done; )
                ar(H.value) && Xs(H.value, y);
          }
        }
      }
      function Js(l) {
        {
          var y = l.type;
          if (y == null || typeof y == "string")
            return;
          var P;
          if (typeof y == "function")
            P = y.propTypes;
          else if (typeof y == "object" && (y.$$typeof === d || // Note: Memo only checks outer props here.
          // Inner props are checked in the reconciler.
          y.$$typeof === k))
            P = y.propTypes;
          else
            return;
          if (P) {
            var I = wt(y);
            gm(P, l.props, "prop", I, l);
          } else if (y.PropTypes !== void 0 && !$a) {
            $a = !0;
            var Y = wt(y);
            U("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", Y || "Unknown");
          }
          typeof y.getDefaultProps == "function" && !y.getDefaultProps.isReactClassApproved && U("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
        }
      }
      function vm(l) {
        {
          for (var y = Object.keys(l.props), P = 0; P < y.length; P++) {
            var I = y[P];
            if (I !== "children" && I !== "key") {
              or(l), U("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", I), or(null);
              break;
            }
          }
          l.ref !== null && (or(l), U("Invalid attribute `ref` supplied to `React.Fragment`."), or(null));
        }
      }
      function Zs(l, y, P) {
        var I = Rs(l);
        if (!I) {
          var Y = "";
          (l === void 0 || typeof l == "object" && l !== null && Object.keys(l).length === 0) && (Y += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
          var re = bm(y);
          re ? Y += re : Y += Gs();
          var H;
          l === null ? H = "null" : ye(l) ? H = "array" : l !== void 0 && l.$$typeof === n ? (H = "<" + (wt(l.type) || "Unknown") + " />", Y = " Did you accidentally export a JSX literal instead of a component?") : H = typeof l, U("React.createElement: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", H, Y);
        }
        var ae = jp.apply(this, arguments);
        if (ae == null)
          return ae;
        if (I)
          for (var he = 2; he < arguments.length; he++)
            Ks(arguments[he], l);
        return l === o ? vm(ae) : Js(ae), ae;
      }
      var Qs = !1;
      function xm(l) {
        var y = Zs.bind(null, l);
        return y.type = l, Qs || (Qs = !0, G("React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.")), Object.defineProperty(y, "type", {
          enumerable: !1,
          get: function() {
            return G("Factory.type is deprecated. Access the class directly before passing it to createFactory."), Object.defineProperty(this, "type", {
              value: l
            }), l;
          }
        }), y;
      }
      function wm(l, y, P) {
        for (var I = Rp.apply(this, arguments), Y = 2; Y < arguments.length; Y++)
          Ks(arguments[Y], I.type);
        return Js(I), I;
      }
      function km(l, y) {
        var P = j.transition;
        j.transition = {};
        var I = j.transition;
        j.transition._updatedFibers = /* @__PURE__ */ new Set();
        try {
          l();
        } finally {
          if (j.transition = P, P === null && I._updatedFibers) {
            var Y = I._updatedFibers.size;
            Y > 10 && G("Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."), I._updatedFibers.clear();
          }
        }
      }
      var el = !1, vn = null;
      function Om(l) {
        if (vn === null)
          try {
            var y = ("require" + Math.random()).slice(0, 7), P = e && e[y];
            vn = P.call(e, "timers").setImmediate;
          } catch {
            vn = function(I) {
              el === !1 && (el = !0, typeof MessageChannel > "u" && U("This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."));
              var Y = new MessageChannel();
              Y.port1.onmessage = I, Y.port2.postMessage(void 0);
            };
          }
        return vn(l);
      }
      var ir = 0, tl = !1;
      function rl(l) {
        {
          var y = ir;
          ir++, p.current === null && (p.current = []);
          var P = p.isBatchingLegacy, I;
          try {
            if (p.isBatchingLegacy = !0, I = l(), !P && p.didScheduleLegacyUpdate) {
              var Y = p.current;
              Y !== null && (p.didScheduleLegacyUpdate = !1, Ta(Y));
            }
          } catch (Re) {
            throw xn(y), Re;
          } finally {
            p.isBatchingLegacy = P;
          }
          if (I !== null && typeof I == "object" && typeof I.then == "function") {
            var re = I, H = !1, ae = {
              then: function(Re, ze) {
                H = !0, re.then(function(Fe) {
                  xn(y), ir === 0 ? Na(Fe, Re, ze) : Re(Fe);
                }, function(Fe) {
                  xn(y), ze(Fe);
                });
              }
            };
            return !tl && typeof Promise < "u" && Promise.resolve().then(function() {
            }).then(function() {
              H || (tl = !0, U("You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"));
            }), ae;
          } else {
            var he = I;
            if (xn(y), ir === 0) {
              var Ee = p.current;
              Ee !== null && (Ta(Ee), p.current = null);
              var je = {
                then: function(Re, ze) {
                  p.current === null ? (p.current = [], Na(he, Re, ze)) : Re(he);
                }
              };
              return je;
            } else {
              var Ie = {
                then: function(Re, ze) {
                  Re(he);
                }
              };
              return Ie;
            }
          }
        }
      }
      function xn(l) {
        l !== ir - 1 && U("You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "), ir = l;
      }
      function Na(l, y, P) {
        {
          var I = p.current;
          if (I !== null)
            try {
              Ta(I), Om(function() {
                I.length === 0 ? (p.current = null, y(l)) : Na(l, y, P);
              });
            } catch (Y) {
              P(Y);
            }
          else
            y(l);
        }
      }
      var _a = !1;
      function Ta(l) {
        if (!_a) {
          _a = !0;
          var y = 0;
          try {
            for (; y < l.length; y++) {
              var P = l[y];
              do
                P = P(!0);
              while (P !== null);
            }
            l.length = 0;
          } catch (I) {
            throw l = l.slice(y + 1), I;
          } finally {
            _a = !1;
          }
        }
      }
      var Sm = Zs, Em = wm, Am = xm, Pm = {
        map: mn,
        forEach: Lp,
        count: Dp,
        toArray: Wp,
        only: Up
      };
      t.Children = Pm, t.Component = S, t.Fragment = o, t.Profiler = s, t.PureComponent = M, t.StrictMode = i, t.Suspense = m, t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ce, t.act = rl, t.cloneElement = Em, t.createContext = Yp, t.createElement = Sm, t.createFactory = Am, t.createRef = Q, t.forwardRef = Gp, t.isValidElement = ar, t.lazy = qp, t.memo = Bp, t.startTransition = km, t.unstable_act = rl, t.useCallback = rm, t.useContext = Xp, t.useDebugValue = om, t.useDeferredValue = sm, t.useEffect = Qp, t.useId = lm, t.useImperativeHandle = am, t.useInsertionEffect = em, t.useLayoutEffect = tm, t.useMemo = nm, t.useReducer = Jp, t.useRef = Zp, t.useState = Kp, t.useSyncExternalStore = cm, t.useTransition = im, t.version = r, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
    }();
  }(Vn, Vn.exports)), Vn.exports;
}
var Ru;
function S2() {
  return Ru || (Ru = 1, process.env.NODE_ENV === "production" ? Oo.exports = k2() : Oo.exports = O2()), Oo.exports;
}
S2();
function Cp() {
  return typeof window < "u" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
}
window.IsDesktopApp = Cp;
function Le(e, t, r, n) {
  if (typeof t == "function" ? e !== t || !0 : !t.has(e)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return r === "m" ? n : r === "a" ? n.call(e) : n ? n.value : t.get(e);
}
function Wr(e, t, r, n, a) {
  if (typeof t == "function" ? e !== t || !0 : !t.has(e)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return t.set(e, r), r;
}
var Vt, Je, lr, jn;
const Mu = "__TAURI_TO_IPC_KEY__";
function E2(e, t = !1) {
  return window.__TAURI_INTERNALS__.transformCallback(e, t);
}
class A2 {
  constructor(t) {
    Vt.set(this, void 0), Je.set(this, 0), lr.set(this, []), jn.set(this, void 0), Wr(this, Vt, t || (() => {
    })), this.id = E2((r) => {
      const n = r.index;
      if ("end" in r) {
        n == Le(this, Je, "f") ? this.cleanupCallback() : Wr(this, jn, n);
        return;
      }
      const a = r.message;
      if (n == Le(this, Je, "f")) {
        for (Le(this, Vt, "f").call(this, a), Wr(this, Je, Le(this, Je, "f") + 1); Le(this, Je, "f") in Le(this, lr, "f"); ) {
          const o = Le(this, lr, "f")[Le(this, Je, "f")];
          Le(this, Vt, "f").call(this, o), delete Le(this, lr, "f")[Le(this, Je, "f")], Wr(this, Je, Le(this, Je, "f") + 1);
        }
        Le(this, Je, "f") === Le(this, jn, "f") && this.cleanupCallback();
      } else
        Le(this, lr, "f")[n] = a;
    });
  }
  cleanupCallback() {
    window.__TAURI_INTERNALS__.unregisterCallback(this.id);
  }
  set onmessage(t) {
    Wr(this, Vt, t);
  }
  get onmessage() {
    return Le(this, Vt, "f");
  }
  [(Vt = /* @__PURE__ */ new WeakMap(), Je = /* @__PURE__ */ new WeakMap(), lr = /* @__PURE__ */ new WeakMap(), jn = /* @__PURE__ */ new WeakMap(), Mu)]() {
    return `__CHANNEL__:${this.id}`;
  }
  toJSON() {
    return this[Mu]();
  }
}
async function In(e, t = {}, r) {
  return window.__TAURI_INTERNALS__.invoke(e, t, r);
}
const Rn = "Request cancelled";
async function zu(e, t) {
  const r = t == null ? void 0 : t.signal;
  if (r != null && r.aborted)
    throw new Error(Rn);
  const n = t == null ? void 0 : t.maxRedirections, a = t == null ? void 0 : t.connectTimeout, o = t == null ? void 0 : t.proxy, i = t == null ? void 0 : t.danger;
  t && (delete t.maxRedirections, delete t.connectTimeout, delete t.proxy, delete t.danger);
  const s = t != null && t.headers ? t.headers instanceof Headers ? t.headers : new Headers(t.headers) : new Headers(), c = new Request(e, t), u = await c.arrayBuffer(), d = u.byteLength !== 0 ? Array.from(new Uint8Array(u)) : null;
  for (const [p, V] of c.headers)
    s.get(p) || s.set(p, V);
  const m = (s instanceof Headers ? Array.from(s.entries()) : Array.isArray(s) ? s : Object.entries(s)).map(([p, V]) => [
    p,
    // we need to ensure we have all header values as strings
    // eslint-disable-next-line
    typeof V == "string" ? V : V.toString()
  ]);
  if (r != null && r.aborted)
    throw new Error(Rn);
  const h = await In("plugin:http|fetch", {
    clientConfig: {
      method: c.method,
      url: c.url,
      headers: m,
      data: d,
      maxRedirections: n,
      connectTimeout: a,
      proxy: o,
      danger: i
    }
  }), k = () => In("plugin:http|fetch_cancel", { rid: h });
  if (r != null && r.aborted)
    throw k(), new Error(Rn);
  r == null || r.addEventListener("abort", () => void k());
  const { status: O, statusText: w, url: b, headers: E, rid: N } = await In("plugin:http|fetch_send", {
    rid: h
  }), T = [101, 103, 204, 205, 304].includes(O) ? null : new ReadableStream({
    start: (p) => {
      const V = new A2();
      V.onmessage = (J) => {
        if (r != null && r.aborted) {
          p.error(Rn);
          return;
        }
        const oe = new Uint8Array(J), me = oe[oe.byteLength - 1], ne = oe.slice(0, oe.byteLength - 1);
        if (me == 1) {
          p.close();
          return;
        }
        p.enqueue(ne);
      }, In("plugin:http|fetch_read_body", {
        rid: N,
        streamChannel: V
      }).catch((J) => {
        p.error(J);
      });
    }
  }), j = new Response(T, {
    status: O,
    statusText: w
  });
  return Object.defineProperty(j, "url", { value: b }), Object.defineProperty(j, "headers", {
    value: new Headers(E)
  }), j;
}
function ea(e, t) {
  return Cp() ? t !== void 0 ? zu(e, t) : zu(e) : t !== void 0 ? fetch(e, t) : fetch(e);
}
window.FetchProxy = ea;
class P2 {
  constructor() {
    Pp(this, "ApiTargets", {}), this.ApiTargets = {
      GoggleApi: Hr.GOOGLE_API,
      FunnelApi: Hr.FUNNEL_API,
      CdnApi: Hr.CDN_API,
      GravatarApi: Hr.GRAVATAR_API
    };
  }
  getApiSchemeAndHost() {
    return ks.getInstance().getApiSchemeAndHost();
  }
  async fetch(t, {
    method: r,
    query: n,
    body: a
  }) {
    const o = n && Object.entries(n).reduce(
      (u, [d, m]) => (m && (u[d] = m.toString()), u),
      {}
    ), i = o ? t + "?" + new URLSearchParams(o) : t, s = JSON.stringify(a), c = await ea(i, {
      method: r,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: s
    });
    if (!c.ok)
      throw new Error(`HTTP error! status: ${c.status}`);
    return c.json();
  }
  async fetchMultipartFormData(t, {
    method: r,
    body: n
  }) {
    return (await ea(t, {
      method: r,
      headers: {
        Accept: "application/json"
      },
      credentials: "include",
      body: n
    })).json();
  }
  get({
    endpoint: t,
    query: r
  }) {
    return this.fetch(t, { method: "GET", query: r });
  }
  post({
    endpoint: t,
    query: r,
    body: n
  }) {
    return this.fetch(t, {
      method: "POST",
      query: r,
      body: n
    });
  }
  delete({
    endpoint: t,
    query: r,
    body: n
  }) {
    return this.fetch(t, {
      method: "DELETE",
      query: r,
      body: n
    });
  }
  async postFormVideo({
    endpoint: t,
    formRecord: r,
    uuid: n,
    blob: a,
    blobFileName: o
  }) {
    const i = new FormData();
    return i.append("uuid_idempotency_token", n), Object.entries(r).forEach(([s, c]) => {
      i.append(s, c);
    }), a && o ? i.append("video", a, o) : a && i.append("video", a), this.fetchMultipartFormData(t, {
      method: "POST",
      body: i
    });
  }
  async postForm({
    endpoint: t,
    formRecord: r,
    uuid: n,
    blob: a,
    blobFileName: o
  }) {
    const i = new FormData();
    return i.append("uuid_idempotency_token", n), Object.entries(r).forEach(([s, c]) => {
      i.append(s, c);
    }), a && o ? i.append("file", a, o) : a && i.append("file", a), this.fetchMultipartFormData(t, {
      method: "POST",
      body: i
    });
  }
  camelToSnakeCase(t) {
    return t.replace(/([a-z0])([A-Z])/g, "$1_$2").toLowerCase();
  }
  parseQueryValues(t) {
    return Object.entries(t).reduce(
      (r, [n, a]) => {
        if (!a)
          return r;
        const o = this.camelToSnakeCase(n);
        return Array.isArray(a) ? { ...r, [o]: a.join(",") } : { ...r, [o]: a.toString() };
      },
      {}
    );
  }
  parseBodyValues(t) {
    return Object.entries(t).reduce((r, [n, a]) => {
      if (!a)
        return r;
      const o = this.camelToSnakeCase(n);
      return Array.isArray(a) ? { ...r, [o]: a } : { ...r, [o]: a };
    }, {});
  }
}
var Fu;
(function(e) {
  e[e.Audio = 1] = "Audio", e[e.Cache = 2] = "Cache", e[e.Config = 3] = "Config", e[e.Data = 4] = "Data", e[e.LocalData = 5] = "LocalData", e[e.Document = 6] = "Document", e[e.Download = 7] = "Download", e[e.Picture = 8] = "Picture", e[e.Public = 9] = "Public", e[e.Video = 10] = "Video", e[e.Resource = 11] = "Resource", e[e.Temp = 12] = "Temp", e[e.AppConfig = 13] = "AppConfig", e[e.AppData = 14] = "AppData", e[e.AppLocalData = 15] = "AppLocalData", e[e.AppCache = 16] = "AppCache", e[e.AppLog = 17] = "AppLog", e[e.Desktop = 18] = "Desktop", e[e.Executable = 19] = "Executable", e[e.Font = 20] = "Font", e[e.Home = 21] = "Home", e[e.Runtime = 22] = "Runtime", e[e.Template = 23] = "Template";
})(Fu || (Fu = {}));
class _i extends P2 {
  async authFetch(t, {
    method: r,
    body: n
  }) {
    const a = JSON.stringify(n);
    return await (await ea(t, {
      method: r,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: a
    })).json();
  }
  GetSession() {
    const t = `${this.getApiSchemeAndHost()}/v1/session`;
    return this.get({ endpoint: t }).then((r) => ({
      success: r.success,
      data: {
        loggedIn: r.logged_in,
        user: r.user
      }
    })).catch((r) => ({
      success: !1,
      errorMessage: r.message
    }));
  }
  GetUserProfile(t) {
    const r = `${this.getApiSchemeAndHost()}/v1/user/${t}/profile`;
    return console.log("endpoint", r), this.get({ endpoint: r }).then((n) => ({
      success: n.success,
      data: {
        user: n.user
      }
    })).catch((n) => ({
      success: !1,
      errorMessage: n.message
    }));
  }
  async Login({
    usernameOrEmail: t,
    password: r
  }) {
    console.log("libs/api - Logging in with usernameOrEmail:", t);
    const n = `${this.getApiSchemeAndHost()}/v1/login`;
    console.log("libs/api - Login endpoint", n);
    const a = {
      username_or_email: t,
      password: r
    };
    try {
      const o = await this.authFetch(n, {
        method: "POST",
        body: a
      });
      return {
        success: o.success,
        data: o.success ? { signedSession: o.signed_session } : void 0,
        errorMessage: o.error_message
      };
    } catch (o) {
      return {
        success: !1,
        errorMessage: o.message
      };
    }
  }
  Logout() {
    const t = `${this.getApiSchemeAndHost()}/v1/logout`;
    return this.post({
      endpoint: t
    }).then((r) => ({
      success: r.success
    })).catch((r) => ({
      success: !1,
      errorMessage: r.message
    }));
  }
  async Signup({
    username: t,
    email: r,
    password: n,
    passwordConfirmation: a,
    signupSource: o
  }) {
    const i = `${this.getApiSchemeAndHost()}/v1/create_account`, s = {
      email_address: r,
      password: n,
      password_confirmation: a,
      username: t
    };
    o && (s.signup_source = o);
    try {
      const c = await this.authFetch(i, {
        method: "POST",
        body: s
      });
      return {
        success: c.success,
        data: c.success ? { signedSession: c.signed_session } : void 0,
        errorMessage: c.error_message || Object.values(c.error_fields ?? {}).join(", ")
      };
    } catch (c) {
      return {
        success: !1,
        errorMessage: c.message
      };
    }
  }
}
window.UsersApi = new _i();
const Du = (e) => {
  let t;
  const r = /* @__PURE__ */ new Set(), n = (u, d) => {
    const m = typeof u == "function" ? u(t) : u;
    if (!Object.is(m, t)) {
      const h = t;
      t = d ?? (typeof m != "object" || m === null) ? m : Object.assign({}, t, m), r.forEach((k) => k(t, h));
    }
  }, a = () => t, s = { setState: n, getState: a, getInitialState: () => c, subscribe: (u) => (r.add(u), () => r.delete(u)) }, c = t = e(n, a, s);
  return s;
}, C2 = (e) => e ? Du(e) : Du, $2 = (e) => e;
function N2(e, t = $2) {
  const r = Me.useSyncExternalStore(
    e.subscribe,
    () => t(e.getState()),
    () => t(e.getInitialState())
  );
  return Me.useDebugValue(r), r;
}
const Lu = (e) => {
  const t = C2(e), r = (n) => N2(t, n);
  return Object.assign(r, t), r;
}, _2 = (e) => e ? Lu(e) : Lu, Wu = _2((e) => ({
  isOpen: !1,
  recheckTrigger: 0,
  openModal: () => e({ isOpen: !0 }),
  closeModal: () => e({ isOpen: !1 }),
  triggerRecheck: () => e((t) => ({ recheckTrigger: t.recheckTrigger + 1 }))
})), T2 = "artcraft";
function z2({
  onClose: e,
  videoSrc2D: t,
  videoSrc3D: r,
  onOpenChange: n,
  onArtCraftAuthSuccess: a,
  isSignUp: o = !0
}) {
  const { isOpen: i, recheckTrigger: s, closeModal: c } = Wu(), [u, d] = He(1), [m, h] = He(!1), [k, O] = He(!1), [w, b] = He(o), [E, N] = He(""), T = qe(null), [j, p] = He(!1), [V, J] = He(!1), oe = 3, me = V ? 3 : j ? 2 : u, ne = async () => {
    var f;
    return (f = (await new _i().GetSession()).data) == null ? void 0 : f.loggedIn;
  };
  hy((Z) => {
    console.log("Login success!", Z), d(4);
  }), It(() => {
    ne().then((Z) => {
      if (Z)
        O(!0), c();
      else {
        d(1), h(!1), b(o), N(""), p(!1), J(!1), O(!1);
        const { openModal: te } = Wu.getState();
        te();
      }
    });
  }, [s, c, o]), It(() => {
    n && n(i);
  }, [i, n]);
  const ge = () => {
    c(), e == null || e();
  }, F = async () => {
    u === 2 ? T.current && T.current.requestSubmit() : d(u + 1);
  }, be = () => {
    u > 1 && d(u - 1);
  }, ee = () => /* @__PURE__ */ q("div", { className: "flex items-center justify-center gap-2 mb-2", children: [...Array(oe)].map((Z, te) => /* @__PURE__ */ q(
    "div",
    {
      className: `h-1.5 rounded transition-all duration-300 w-16 ${te < me ? "bg-primary" : "bg-white/30"}`
    },
    te
  )) }), ce = () => {
    window.open("https://discord.gg/75svZP2Vje", "_blank"), p(!1), J(!0);
  }, G = () => {
    if (V)
      return /* @__PURE__ */ $e("div", { className: "flex flex-col items-center justify-center h-full", children: [
        /* @__PURE__ */ q("h2", { className: "text-3xl font-bold mb-2 text-center", children: "Thank you for signing in!" }),
        /* @__PURE__ */ q("p", { className: "text-white/70 mb-6 text-center", children: "You're all set to start creating amazing content." }),
        /* @__PURE__ */ q(
          cr,
          {
            variant: "primary",
            onClick: ge,
            icon: ec,
            iconFlip: !0,
            className: "text-md",
            children: "Get Started"
          }
        )
      ] });
    if (j)
      return /* @__PURE__ */ $e("div", { className: "flex flex-col items-center justify-center h-full", children: [
        /* @__PURE__ */ q("h2", { className: "text-3xl font-bold mb-2 text-center", children: "Join Our Community" }),
        /* @__PURE__ */ q("p", { className: "text-white/70 mb-6 text-center px-24", children: "Connect with other creators, share your work, and get the latest updates in our Discord community." }),
        /* @__PURE__ */ $e("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ q(
            cr,
            {
              variant: "secondary",
              onClick: () => {
                p(!1), J(!0);
              },
              children: "Skip for now"
            }
          ),
          /* @__PURE__ */ q(
            cr,
            {
              variant: "primary",
              onClick: ce,
              icon: dy,
              className: "text-md bg-[#5865F2] hover:bg-[#6a76ff]",
              children: "Join Discord"
            }
          )
        ] })
      ] });
    switch (u) {
      case 1:
        return /* @__PURE__ */ $e("div", { className: "flex flex-col items-center justify-center h-full", children: [
          /* @__PURE__ */ q("h2", { className: "text-3xl font-bold mb-2 text-center", children: "Welcome to ArtCraft" }),
          /* @__PURE__ */ q("p", { className: "text-white/70 mb-6 text-center", children: "Here's what you can do..." }),
          /* @__PURE__ */ $e("div", { className: "grid grid-cols-2 gap-6 h-full grow", children: [
            /* @__PURE__ */ $e("div", { className: "h-full", children: [
              /* @__PURE__ */ q("div", { className: "aspect-[4/3] w-full overflow-hidden bg-black/20 rounded-t-lg", children: /* @__PURE__ */ q(
                "video",
                {
                  className: "object-cover w-full h-full",
                  autoPlay: !0,
                  muted: !0,
                  loop: !0,
                  controls: !1,
                  children: /* @__PURE__ */ q("source", { src: t, type: "video/mp4" })
                }
              ) }),
              /* @__PURE__ */ q("p", { className: "text-center px-1.5 py-2 text-white/90 bg-black/20 rounded-b-lg font-medium text-sm", children: "2D Canvas" })
            ] }),
            /* @__PURE__ */ $e("div", { children: [
              /* @__PURE__ */ q("div", { className: "aspect-[4/3] w-full overflow-hidden bg-black/20 rounded-t-lg", children: /* @__PURE__ */ q(
                "video",
                {
                  className: "object-cover w-full h-full",
                  autoPlay: !0,
                  muted: !0,
                  loop: !0,
                  controls: !1,
                  children: /* @__PURE__ */ q("source", { src: r, type: "video/mp4" })
                }
              ) }),
              /* @__PURE__ */ q("p", { className: "text-center px-1.5 py-2 text-white/90 bg-black/20 rounded-b-lg font-medium text-sm", children: "3D Scene Editor" })
            ] })
          ] })
        ] });
      case 2:
        return /* @__PURE__ */ q(
          y2,
          {
            onSubmit: async (Z, te, g, f) => {
              var A;
              h(!0);
              const x = new _i();
              try {
                let S, C;
                if (w) {
                  if (console.log("Sign up!"), S = await x.Signup({
                    username: Z,
                    email: te,
                    password: g,
                    passwordConfirmation: f,
                    signupSource: T2
                  }), console.log(S), !S.success) {
                    N(
                      S.errorMessage || "Signup failed, please try again."
                    ), h(!1);
                    return;
                  }
                  console.log("Path 1"), C = await x.Login({
                    usernameOrEmail: Z || te,
                    password: g
                  }), console.log(C);
                } else
                  console.log("Path 2"), C = await x.Login({
                    usernameOrEmail: Z || te,
                    password: g
                  }), console.log(C);
                if (!C.success) {
                  N(
                    C.errorMessage || "Login failed, please try again."
                  ), h(!1);
                  return;
                }
                if (O(!0), console.log("ARTCRAFT LOGIN SUCCeSS"), a) {
                  const $ = (A = (await x.GetSession()).data) == null ? void 0 : A.user;
                  console.log("USERINFO"), console.log($), $ && a($);
                }
                p(!0);
              } catch (S) {
                console.error(S), N(
                  "An unexpected error occurred. Please try again."
                );
              } finally {
                h(!1);
              }
            },
            isSignUp: w,
            onToggleMode: () => b((Z) => !Z),
            formRef: T,
            errorMessage: E
          }
        );
      default:
        return null;
    }
  }, U = () => V || j ? null : /* @__PURE__ */ $e("div", { className: "flex items-end justify-center gap-2.5 mt-10 grow", children: [
    u === 2 && /* @__PURE__ */ q(cr, { variant: "secondary", onClick: be, disabled: m, children: "Back" }),
    /* @__PURE__ */ q(
      cr,
      {
        icon: ec,
        iconFlip: !0,
        onClick: F,
        loading: m,
        disabled: m,
        children: u === 1 ? "Continue" : w ? "Sign up" : "Login"
      }
    )
  ] });
  return /* @__PURE__ */ q(ly, { appear: !0, show: i, children: /* @__PURE__ */ $e("div", { className: "fixed inset-0 z-[100]", children: [
    /* @__PURE__ */ q(
      Ho,
      {
        enter: "ease-out duration-300",
        enterFrom: "opacity-0",
        enterTo: "opacity-100",
        leave: "ease-in duration-200",
        leaveFrom: "opacity-100",
        leaveTo: "opacity-0",
        children: /* @__PURE__ */ q("div", { className: "fixed inset-0 cursor-pointer bg-black/80" })
      }
    ),
    /* @__PURE__ */ q("div", { className: "fixed inset-0 flex items-center justify-center p-4", children: /* @__PURE__ */ q(
      Ho,
      {
        enter: "ease-out duration-300",
        enterFrom: "opacity-0 scale-95",
        enterTo: "opacity-100 scale-100",
        leave: "ease-in duration-200",
        leaveFrom: "opacity-100 scale-100",
        leaveTo: "opacity-0 scale-95",
        children: /* @__PURE__ */ q(
          "div",
          {
            className: "relative h-[660px] max-w-4xl w-full rounded-xl bg-[#2C2C2C] text-white shadow-lg border border-white/5",
            onClick: (Z) => Z.stopPropagation(),
            children: /* @__PURE__ */ $e("div", { className: "flex flex-col gap-4 p-8 h-full", children: [
              !V && /* @__PURE__ */ $e(_t, { children: [
                /* @__PURE__ */ $e("span", { className: "text-sm text-center opacity-60 font-medium", children: [
                  "Step ",
                  me,
                  " of ",
                  oe
                ] }),
                ee()
              ] }),
              G(),
              U()
            ] })
          }
        )
      }
    ) })
  ] }) });
}
export {
  z2 as LoginModal,
  Wu as useLoginModalStore
};
