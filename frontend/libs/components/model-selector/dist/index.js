import { jsx as se, jsxs as Ge, Fragment as yn } from "react/jsx-runtime";
import * as ie from "react";
import ue, { createContext as at, forwardRef as Vh, Fragment as Rt, useRef as xe, useState as $e, useMemo as ze, useContext as Ue, useReducer as xd, createRef as $o, useEffect as Le, useId as jr, useCallback as Be, useLayoutEffect as Xs, isValidElement as Uh, cloneElement as qh, createElement as Kh, useSyncExternalStore as Xh } from "react";
import * as ja from "react-dom";
import { createPortal as Jh } from "react-dom";
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Zh = {
  prefix: "fas",
  iconName: "film",
  icon: [512, 512, [127902], "f008", "M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM48 368l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm368-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM48 240l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm368-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM48 112l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16L64 96c-8.8 0-16 7.2-16 16zM416 96c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM160 128l0 64c0 17.7 14.3 32 32 32l128 0c17.7 0 32-14.3 32-32l0-64c0-17.7-14.3-32-32-32L192 96c-17.7 0-32 14.3-32 32zm32 160c-17.7 0-32 14.3-32 32l0 64c0 17.7 14.3 32 32 32l128 0c17.7 0 32-14.3 32-32l0-64c0-17.7-14.3-32-32-32l-128 0z"]
}, Xa = {
  prefix: "fas",
  iconName: "image",
  icon: [512, 512, [], "f03e", "M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6l96 0 32 0 208 0c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z"]
}, Qh = {
  prefix: "fas",
  iconName: "clock",
  icon: [512, 512, [128339, "clock-four"], "f017", "M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120l0 136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2 280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"]
};
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function ey(e, t, n) {
  return (t = ny(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Ic(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function $(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Ic(Object(n), !0).forEach(function(r) {
      ey(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Ic(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function ty(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function ny(e) {
  var t = ty(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const jc = () => {
};
let Js = {}, wd = {}, Ed = null, kd = {
  mark: jc,
  measure: jc
};
try {
  typeof window < "u" && (Js = window), typeof document < "u" && (wd = document), typeof MutationObserver < "u" && (Ed = MutationObserver), typeof performance < "u" && (kd = performance);
} catch {
}
const {
  userAgent: Mc = ""
} = Js.navigator || {}, rn = Js, Ie = wd, Fc = Ed, da = kd;
rn.document;
const Gt = !!Ie.documentElement && !!Ie.head && typeof Ie.addEventListener == "function" && typeof Ie.createElement == "function", Pd = ~Mc.indexOf("MSIE") || ~Mc.indexOf("Trident/");
var ry = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, ay = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Od = {
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
}, oy = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Sd = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Je = "classic", Ja = "duotone", iy = "sharp", sy = "sharp-duotone", Ad = [Je, Ja, iy, sy], ly = {
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
}, cy = {
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
}, uy = /* @__PURE__ */ new Map([["classic", {
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
}]]), fy = {
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
}, dy = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Rc = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, py = ["kit"], my = {
  kit: {
    "fa-kit": "fak"
  }
}, gy = ["fak", "fakd"], hy = {
  kit: {
    fak: "fa-kit"
  }
}, Lc = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, pa = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, yy = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], by = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], vy = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, xy = {
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
}, wy = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Fi = {
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
}, Ey = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], Ri = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...yy, ...Ey], ky = ["solid", "regular", "light", "thin", "duotone", "brands"], Cd = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], Py = Cd.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), Oy = [...Object.keys(wy), ...ky, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", pa.GROUP, pa.SWAP_OPACITY, pa.PRIMARY, pa.SECONDARY].concat(Cd.map((e) => "".concat(e, "x"))).concat(Py.map((e) => "w-".concat(e))), Sy = {
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
const Lt = "___FONT_AWESOME___", Li = 16, _d = "fa", Td = "svg-inline--fa", Sn = "data-fa-i2svg", Di = "data-fa-pseudo-element", Ay = "data-fa-pseudo-element-pending", Zs = "data-prefix", Qs = "data-icon", Dc = "fontawesome-i2svg", Cy = "async", _y = ["HTML", "HEAD", "STYLE", "SCRIPT"], Nd = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Gr(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[Je];
    }
  });
}
const Id = $({}, Od);
Id[Je] = $($($($({}, {
  "fa-duotone": "duotone"
}), Od[Je]), Rc.kit), Rc["kit-duotone"]);
const Ty = Gr(Id), zi = $({}, fy);
zi[Je] = $($($($({}, {
  duotone: "fad"
}), zi[Je]), Lc.kit), Lc["kit-duotone"]);
const zc = Gr(zi), $i = $({}, Fi);
$i[Je] = $($({}, $i[Je]), hy.kit);
const el = Gr($i), Hi = $({}, xy);
Hi[Je] = $($({}, Hi[Je]), my.kit);
Gr(Hi);
const Ny = ry, jd = "fa-layers-text", Iy = ay, jy = $({}, ly);
Gr(jy);
const My = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Ho = oy, Fy = [...py, ...Oy], Or = rn.FontAwesomeConfig || {};
function Ry(e) {
  var t = Ie.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function Ly(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
Ie && typeof Ie.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [n, r] = t;
  const a = Ly(Ry(n));
  a != null && (Or[r] = a);
});
const Md = {
  styleDefault: "solid",
  familyDefault: Je,
  cssPrefix: _d,
  replacementClass: Td,
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
Or.familyPrefix && (Or.cssPrefix = Or.familyPrefix);
const er = $($({}, Md), Or);
er.autoReplaceSvg || (er.observeMutations = !1);
const ne = {};
Object.keys(Md).forEach((e) => {
  Object.defineProperty(ne, e, {
    enumerable: !0,
    set: function(t) {
      er[e] = t, Sr.forEach((n) => n(ne));
    },
    get: function() {
      return er[e];
    }
  });
});
Object.defineProperty(ne, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    er.cssPrefix = e, Sr.forEach((t) => t(ne));
  },
  get: function() {
    return er.cssPrefix;
  }
});
rn.FontAwesomeConfig = ne;
const Sr = [];
function Dy(e) {
  return Sr.push(e), () => {
    Sr.splice(Sr.indexOf(e), 1);
  };
}
const qt = Li, wt = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function zy(e) {
  if (!e || !Gt)
    return;
  const t = Ie.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = Ie.head.childNodes;
  let r = null;
  for (let a = n.length - 1; a > -1; a--) {
    const o = n[a], i = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = o);
  }
  return Ie.head.insertBefore(t, r), e;
}
const $y = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Mr() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += $y[Math.random() * 62 | 0];
  return t;
}
function ir(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function tl(e) {
  return e.classList ? ir(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function Fd(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Hy(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(Fd(e[n]), '" '), "").trim();
}
function Za(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function nl(e) {
  return e.size !== wt.size || e.x !== wt.x || e.y !== wt.y || e.rotate !== wt.rotate || e.flipX || e.flipY;
}
function Wy(e) {
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
function By(e) {
  let {
    transform: t,
    width: n = Li,
    height: r = Li,
    startCentered: a = !1
  } = e, o = "";
  return a && Pd ? o += "translate(".concat(t.x / qt - n / 2, "em, ").concat(t.y / qt - r / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / qt, "em), calc(-50% + ").concat(t.y / qt, "em)) ") : o += "translate(".concat(t.x / qt, "em, ").concat(t.y / qt, "em) "), o += "scale(".concat(t.size / qt * (t.flipX ? -1 : 1), ", ").concat(t.size / qt * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var Gy = `:root, :host {
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
function Rd() {
  const e = _d, t = Td, n = ne.cssPrefix, r = ne.replacementClass;
  let a = Gy;
  if (n !== e || r !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return a;
}
let $c = !1;
function Wo() {
  ne.autoAddCss && !$c && (zy(Rd()), $c = !0);
}
var Yy = {
  mixout() {
    return {
      dom: {
        css: Rd,
        insertCss: Wo
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Wo();
      },
      beforeI2svg() {
        Wo();
      }
    };
  }
};
const Dt = rn || {};
Dt[Lt] || (Dt[Lt] = {});
Dt[Lt].styles || (Dt[Lt].styles = {});
Dt[Lt].hooks || (Dt[Lt].hooks = {});
Dt[Lt].shims || (Dt[Lt].shims = []);
var Et = Dt[Lt];
const Ld = [], Dd = function() {
  Ie.removeEventListener("DOMContentLoaded", Dd), Ma = 1, Ld.map((e) => e());
};
let Ma = !1;
Gt && (Ma = (Ie.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(Ie.readyState), Ma || Ie.addEventListener("DOMContentLoaded", Dd));
function Vy(e) {
  Gt && (Ma ? setTimeout(e, 0) : Ld.push(e));
}
function Yr(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? Fd(e) : "<".concat(t, " ").concat(Hy(n), ">").concat(r.map(Yr).join(""), "</").concat(t, ">");
}
function Hc(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var Bo = function(t, n, r, a) {
  var o = Object.keys(t), i = o.length, s = n, l, c, u;
  for (r === void 0 ? (l = 1, u = t[o[0]]) : (l = 0, u = r); l < i; l++)
    c = o[l], u = s(u, t[c], c, t);
  return u;
};
function Uy(e) {
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
function Wi(e) {
  const t = Uy(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function qy(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), a;
  return r >= 55296 && r <= 56319 && n > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (r - 55296) * 1024 + a - 56320 + 65536 : r;
}
function Wc(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return !!r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function Bi(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, a = Wc(t);
  typeof Et.hooks.addPack == "function" && !r ? Et.hooks.addPack(e, Wc(t)) : Et.styles[e] = $($({}, Et.styles[e] || {}), a), e === "fas" && Bi("fa", t);
}
const {
  styles: Fr,
  shims: Ky
} = Et, zd = Object.keys(el), Xy = zd.reduce((e, t) => (e[t] = Object.keys(el[t]), e), {});
let rl = null, $d = {}, Hd = {}, Wd = {}, Bd = {}, Gd = {};
function Jy(e) {
  return ~Fy.indexOf(e);
}
function Zy(e, t) {
  const n = t.split("-"), r = n[0], a = n.slice(1).join("-");
  return r === e && a !== "" && !Jy(a) ? a : null;
}
const Yd = () => {
  const e = (r) => Bo(Fr, (a, o, i) => (a[i] = Bo(o, r, {}), a), {});
  $d = e((r, a, o) => (a[3] && (r[a[3]] = o), a[2] && a[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = o;
  }), r)), Hd = e((r, a, o) => (r[o] = o, a[2] && a[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = o;
  }), r)), Gd = e((r, a, o) => {
    const i = a[2];
    return r[o] = o, i.forEach((s) => {
      r[s] = o;
    }), r;
  });
  const t = "far" in Fr || ne.autoFetchSvg, n = Bo(Ky, (r, a) => {
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
  Wd = n.names, Bd = n.unicodes, rl = Qa(ne.styleDefault, {
    family: ne.familyDefault
  });
};
Dy((e) => {
  rl = Qa(e.styleDefault, {
    family: ne.familyDefault
  });
});
Yd();
function al(e, t) {
  return ($d[e] || {})[t];
}
function Qy(e, t) {
  return (Hd[e] || {})[t];
}
function vn(e, t) {
  return (Gd[e] || {})[t];
}
function Vd(e) {
  return Wd[e] || {
    prefix: null,
    iconName: null
  };
}
function eb(e) {
  const t = Bd[e], n = al("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function an() {
  return rl;
}
const Ud = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function tb(e) {
  let t = Je;
  const n = zd.reduce((r, a) => (r[a] = "".concat(ne.cssPrefix, "-").concat(a), r), {});
  return Ad.forEach((r) => {
    (e.includes(n[r]) || e.some((a) => Xy[r].includes(a))) && (t = r);
  }), t;
}
function Qa(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = Je
  } = t, r = Ty[n][e];
  if (n === Ja && !e)
    return "fad";
  const a = zc[n][e] || zc[n][r], o = e in Et.styles ? e : null;
  return a || o || null;
}
function nb(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const a = Zy(ne.cssPrefix, r);
    a ? n = a : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function Bc(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function eo(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const a = Ri.concat(by), o = Bc(e.filter((p) => a.includes(p))), i = Bc(e.filter((p) => !Ri.includes(p))), s = o.filter((p) => (r = p, !Sd.includes(p))), [l = null] = s, c = tb(o), u = $($({}, nb(i)), {}, {
    prefix: Qa(l, {
      family: c
    })
  });
  return $($($({}, u), ib({
    values: e,
    family: c,
    styles: Fr,
    config: ne,
    canonical: u,
    givenPrefix: r
  })), rb(n, r, u));
}
function rb(e, t, n) {
  let {
    prefix: r,
    iconName: a
  } = n;
  if (e || !r || !a)
    return {
      prefix: r,
      iconName: a
    };
  const o = t === "fa" ? Vd(a) : {}, i = vn(r, a);
  return a = o.iconName || i || a, r = o.prefix || r, r === "far" && !Fr.far && Fr.fas && !ne.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: a
  };
}
const ab = Ad.filter((e) => e !== Je || e !== Ja), ob = Object.keys(Fi).filter((e) => e !== Je).map((e) => Object.keys(Fi[e])).flat();
function ib(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: a = "",
    styles: o = {},
    config: i = {}
  } = e, s = n === Ja, l = t.includes("fa-duotone") || t.includes("fad"), c = i.familyDefault === "duotone", u = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (l || c || u) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && ab.includes(n) && (Object.keys(o).find((m) => ob.includes(m)) || i.autoFetchSvg)) {
    const m = uy.get(n).defaultShortPrefixId;
    r.prefix = m, r.iconName = vn(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || a === "fa") && (r.prefix = an() || "fas"), r;
}
class sb {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const a = n.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = $($({}, this.definitions[o] || {}), a[o]), Bi(o, a[o]);
      const i = el[Je][o];
      i && Bi(i, a[o]), Yd();
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
let Gc = [], Wn = {};
const qn = {}, lb = Object.keys(qn);
function cb(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return Gc = e, Wn = {}, Object.keys(qn).forEach((r) => {
    lb.indexOf(r) === -1 && delete qn[r];
  }), Gc.forEach((r) => {
    const a = r.mixout ? r.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (n[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((i) => {
        n[o] || (n[o] = {}), n[o][i] = a[o][i];
      });
    }), r.hooks) {
      const o = r.hooks();
      Object.keys(o).forEach((i) => {
        Wn[i] || (Wn[i] = []), Wn[i].push(o[i]);
      });
    }
    r.provides && r.provides(qn);
  }), n;
}
function Gi(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), a = 2; a < n; a++)
    r[a - 2] = arguments[a];
  return (Wn[e] || []).forEach((i) => {
    t = i.apply(null, [t, ...r]);
  }), t;
}
function An(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (Wn[e] || []).forEach((o) => {
    o.apply(null, n);
  });
}
function on() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return qn[e] ? qn[e].apply(null, t) : void 0;
}
function Yi(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || an();
  if (t)
    return t = vn(n, t) || t, Hc(qd.definitions, n, t) || Hc(Et.styles, n, t);
}
const qd = new sb(), ub = () => {
  ne.autoReplaceSvg = !1, ne.observeMutations = !1, An("noAuto");
}, fb = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return Gt ? (An("beforeI2svg", e), on("pseudoElements2svg", e), on("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    ne.autoReplaceSvg === !1 && (ne.autoReplaceSvg = !0), ne.observeMutations = !0, Vy(() => {
      pb({
        autoReplaceSvgRoot: t
      }), An("watch", e);
    });
  }
}, db = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: vn(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = Qa(e[0]);
      return {
        prefix: n,
        iconName: vn(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(ne.cssPrefix, "-")) > -1 || e.match(Ny))) {
      const t = eo(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || an(),
        iconName: vn(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = an();
      return {
        prefix: t,
        iconName: vn(t, e) || e
      };
    }
  }
}, st = {
  noAuto: ub,
  config: ne,
  dom: fb,
  parse: db,
  library: qd,
  findIconDefinition: Yi,
  toHtml: Yr
}, pb = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = Ie
  } = e;
  (Object.keys(Et.styles).length > 0 || ne.autoFetchSvg) && Gt && ne.autoReplaceSvg && st.dom.i2svg({
    node: t
  });
};
function to(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => Yr(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!Gt) return;
      const n = Ie.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function mb(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: a,
    styles: o,
    transform: i
  } = e;
  if (nl(i) && n.found && !r.found) {
    const {
      width: s,
      height: l
    } = n, c = {
      x: s / l / 2,
      y: 0.5
    };
    a.style = Za($($({}, o), {}, {
      "transform-origin": "".concat(c.x + i.x / 16, "em ").concat(c.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function gb(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: a,
    symbol: o
  } = e;
  const i = o === !0 ? "".concat(t, "-").concat(ne.cssPrefix, "-").concat(n) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: $($({}, a), {}, {
        id: i
      }),
      children: r
    }]
  }];
}
function ol(e) {
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
    extra: u,
    watchable: p = !1
  } = e, {
    width: m,
    height: b
  } = n.found ? n : t, x = gy.includes(r), v = [ne.replacementClass, a ? "".concat(ne.cssPrefix, "-").concat(a) : ""].filter((h) => u.classes.indexOf(h) === -1).filter((h) => h !== "" || !!h).concat(u.classes).join(" ");
  let y = {
    children: [],
    attributes: $($({}, u.attributes), {}, {
      "data-prefix": r,
      "data-icon": a,
      class: v,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(m, " ").concat(b)
    })
  };
  const w = x && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(m / b * 16 * 0.0625, "em")
  } : {};
  p && (y.attributes[Sn] = ""), s && (y.children.push({
    tag: "title",
    attributes: {
      id: y.attributes["aria-labelledby"] || "title-".concat(c || Mr())
    },
    children: [s]
  }), delete y.attributes.title);
  const P = $($({}, y), {}, {
    prefix: r,
    iconName: a,
    main: t,
    mask: n,
    maskId: l,
    transform: o,
    symbol: i,
    styles: $($({}, w), u.styles)
  }), {
    children: S,
    attributes: _
  } = n.found && t.found ? on("generateAbstractMask", P) || {
    children: [],
    attributes: {}
  } : on("generateAbstractIcon", P) || {
    children: [],
    attributes: {}
  };
  return P.children = S, P.attributes = _, i ? gb(P) : mb(P);
}
function Yc(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: a,
    title: o,
    extra: i,
    watchable: s = !1
  } = e, l = $($($({}, i.attributes), o ? {
    title: o
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (l[Sn] = "");
  const c = $({}, i.styles);
  nl(a) && (c.transform = By({
    transform: a,
    startCentered: !0,
    width: n,
    height: r
  }), c["-webkit-transform"] = c.transform);
  const u = Za(c);
  u.length > 0 && (l.style = u);
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
function hb(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, a = $($($({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), o = Za(r.styles);
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
  styles: Go
} = Et;
function Vi(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let a = null;
  return Array.isArray(r) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(ne.cssPrefix, "-").concat(Ho.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(ne.cssPrefix, "-").concat(Ho.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(ne.cssPrefix, "-").concat(Ho.PRIMARY),
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
const yb = {
  found: !1,
  width: 512,
  height: 512
};
function bb(e, t) {
  !Nd && !ne.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Ui(e, t) {
  let n = t;
  return t === "fa" && ne.styleDefault !== null && (t = an()), new Promise((r, a) => {
    if (n === "fa") {
      const o = Vd(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && Go[t] && Go[t][e]) {
      const o = Go[t][e];
      return r(Vi(o));
    }
    bb(e, t), r($($({}, yb), {}, {
      icon: ne.showMissingIcons && e ? on("missingIconAbstract") || {} : {}
    }));
  });
}
const Vc = () => {
}, qi = ne.measurePerformance && da && da.mark && da.measure ? da : {
  mark: Vc,
  measure: Vc
}, Er = 'FA "6.7.2"', vb = (e) => (qi.mark("".concat(Er, " ").concat(e, " begins")), () => Kd(e)), Kd = (e) => {
  qi.mark("".concat(Er, " ").concat(e, " ends")), qi.measure("".concat(Er, " ").concat(e), "".concat(Er, " ").concat(e, " begins"), "".concat(Er, " ").concat(e, " ends"));
};
var il = {
  begin: vb,
  end: Kd
};
const Pa = () => {
};
function Uc(e) {
  return typeof (e.getAttribute ? e.getAttribute(Sn) : null) == "string";
}
function xb(e) {
  const t = e.getAttribute ? e.getAttribute(Zs) : null, n = e.getAttribute ? e.getAttribute(Qs) : null;
  return t && n;
}
function wb(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(ne.replacementClass);
}
function Eb() {
  return ne.autoReplaceSvg === !0 ? Oa.replace : Oa[ne.autoReplaceSvg] || Oa.replace;
}
function kb(e) {
  return Ie.createElementNS("http://www.w3.org/2000/svg", e);
}
function Pb(e) {
  return Ie.createElement(e);
}
function Xd(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? kb : Pb
  } = t;
  if (typeof e == "string")
    return Ie.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    r.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    r.appendChild(Xd(o, {
      ceFn: n
    }));
  }), r;
}
function Ob(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const Oa = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(Xd(n), t);
      }), t.getAttribute(Sn) === null && ne.keepOriginalSource) {
        let n = Ie.createComment(Ob(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~tl(t).indexOf(ne.replacementClass))
      return Oa.replace(e);
    const r = new RegExp("".concat(ne.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const o = n[0].attributes.class.split(" ").reduce((i, s) => (s === ne.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = n.map((o) => Yr(o)).join(`
`);
    t.setAttribute(Sn, ""), t.innerHTML = a;
  }
};
function qc(e) {
  e();
}
function Jd(e, t) {
  const n = typeof t == "function" ? t : Pa;
  if (e.length === 0)
    n();
  else {
    let r = qc;
    ne.mutateApproach === Cy && (r = rn.requestAnimationFrame || qc), r(() => {
      const a = Eb(), o = il.begin("mutate");
      e.map(a), o(), n();
    });
  }
}
let sl = !1;
function Zd() {
  sl = !0;
}
function Ki() {
  sl = !1;
}
let Fa = null;
function Kc(e) {
  if (!Fc || !ne.observeMutations)
    return;
  const {
    treeCallback: t = Pa,
    nodeCallback: n = Pa,
    pseudoElementsCallback: r = Pa,
    observeMutationsRoot: a = Ie
  } = e;
  Fa = new Fc((o) => {
    if (sl) return;
    const i = an();
    ir(o).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Uc(s.addedNodes[0]) && (ne.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && ne.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && Uc(s.target) && ~My.indexOf(s.attributeName))
        if (s.attributeName === "class" && xb(s.target)) {
          const {
            prefix: l,
            iconName: c
          } = eo(tl(s.target));
          s.target.setAttribute(Zs, l || i), c && s.target.setAttribute(Qs, c);
        } else wb(s.target) && n(s.target);
    });
  }), Gt && Fa.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function Sb() {
  Fa && Fa.disconnect();
}
function Ab(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, a) => {
    const o = a.split(":"), i = o[0], s = o.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function Cb(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = eo(tl(e));
  return a.prefix || (a.prefix = an()), t && n && (a.prefix = t, a.iconName = n), a.iconName && a.prefix || (a.prefix && r.length > 0 && (a.iconName = Qy(a.prefix, e.innerText) || al(a.prefix, Wi(e.innerText))), !a.iconName && ne.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function _b(e) {
  const t = ir(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return ne.autoA11y && (n ? t["aria-labelledby"] = "".concat(ne.replacementClass, "-title-").concat(r || Mr()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function Tb() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: wt,
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
function Xc(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: a
  } = Cb(e), o = _b(e), i = Gi("parseNodeAttributes", {}, e);
  let s = t.styleParser ? Ab(e) : [];
  return $({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: wt,
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
  styles: Nb
} = Et;
function Qd(e) {
  const t = ne.autoReplaceSvg === "nest" ? Xc(e, {
    styleParser: !1
  }) : Xc(e);
  return ~t.extra.classes.indexOf(jd) ? on("generateLayersText", e, t) : on("generateSvgReplacementMutation", e, t);
}
function Ib() {
  return [...dy, ...Ri];
}
function Jc(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!Gt) return Promise.resolve();
  const n = Ie.documentElement.classList, r = (u) => n.add("".concat(Dc, "-").concat(u)), a = (u) => n.remove("".concat(Dc, "-").concat(u)), o = ne.autoFetchSvg ? Ib() : Sd.concat(Object.keys(Nb));
  o.includes("fa") || o.push("fa");
  const i = [".".concat(jd, ":not([").concat(Sn, "])")].concat(o.map((u) => ".".concat(u, ":not([").concat(Sn, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = ir(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), a("complete");
  else
    return Promise.resolve();
  const l = il.begin("onTree"), c = s.reduce((u, p) => {
    try {
      const m = Qd(p);
      m && u.push(m);
    } catch (m) {
      Nd || m.name === "MissingIcon" && console.error(m);
    }
    return u;
  }, []);
  return new Promise((u, p) => {
    Promise.all(c).then((m) => {
      Jd(m, () => {
        r("active"), r("complete"), a("pending"), typeof t == "function" && t(), l(), u();
      });
    }).catch((m) => {
      l(), p(m);
    });
  });
}
function jb(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  Qd(e).then((n) => {
    n && Jd([n], t);
  });
}
function Mb(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : Yi(t || {});
    let {
      mask: a
    } = n;
    return a && (a = (a || {}).icon ? a : Yi(a || {})), e(r, $($({}, n), {}, {
      mask: a
    }));
  };
}
const Fb = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = wt,
    symbol: r = !1,
    mask: a = null,
    maskId: o = null,
    title: i = null,
    titleId: s = null,
    classes: l = [],
    attributes: c = {},
    styles: u = {}
  } = t;
  if (!e) return;
  const {
    prefix: p,
    iconName: m,
    icon: b
  } = e;
  return to($({
    type: "icon"
  }, e), () => (An("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), ne.autoA11y && (i ? c["aria-labelledby"] = "".concat(ne.replacementClass, "-title-").concat(s || Mr()) : (c["aria-hidden"] = "true", c.focusable = "false")), ol({
    icons: {
      main: Vi(b),
      mask: a ? Vi(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: p,
    iconName: m,
    transform: $($({}, wt), n),
    symbol: r,
    title: i,
    maskId: o,
    titleId: s,
    extra: {
      attributes: c,
      styles: u,
      classes: l
    }
  })));
};
var Rb = {
  mixout() {
    return {
      icon: Mb(Fb)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Jc, e.nodeCallback = jb, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = Ie,
        callback: r = () => {
        }
      } = t;
      return Jc(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: a,
        titleId: o,
        prefix: i,
        transform: s,
        symbol: l,
        mask: c,
        maskId: u,
        extra: p
      } = n;
      return new Promise((m, b) => {
        Promise.all([Ui(r, i), c.iconName ? Ui(c.iconName, c.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((x) => {
          let [v, y] = x;
          m([t, ol({
            icons: {
              main: v,
              mask: y
            },
            prefix: i,
            iconName: r,
            transform: s,
            symbol: l,
            maskId: u,
            title: a,
            titleId: o,
            extra: p,
            watchable: !0
          })]);
        }).catch(b);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        transform: o,
        styles: i
      } = t;
      const s = Za(i);
      s.length > 0 && (r.style = s);
      let l;
      return nl(o) && (l = on("generateAbstractTransformGrouping", {
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
}, Lb = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return to({
          type: "layer"
        }, () => {
          An("beforeDOMElementCreation", {
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
              class: ["".concat(ne.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, Db = {
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
        return to({
          type: "counter",
          content: e
        }, () => (An("beforeDOMElementCreation", {
          content: e,
          params: t
        }), hb({
          content: e.toString(),
          title: n,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(ne.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, zb = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = wt,
          title: r = null,
          classes: a = [],
          attributes: o = {},
          styles: i = {}
        } = t;
        return to({
          type: "text",
          content: e
        }, () => (An("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Yc({
          content: e,
          transform: $($({}, wt), n),
          title: r,
          extra: {
            attributes: o,
            styles: i,
            classes: ["".concat(ne.cssPrefix, "-layers-text"), ...a]
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
      if (Pd) {
        const l = parseInt(getComputedStyle(t).fontSize, 10), c = t.getBoundingClientRect();
        i = c.width / l, s = c.height / l;
      }
      return ne.autoA11y && !r && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, Yc({
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
const $b = new RegExp('"', "ug"), Zc = [1105920, 1112319], Qc = $($($($({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), cy), Sy), vy), Xi = Object.keys(Qc).reduce((e, t) => (e[t.toLowerCase()] = Qc[t], e), {}), Hb = Object.keys(Xi).reduce((e, t) => {
  const n = Xi[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function Wb(e) {
  const t = e.replace($b, ""), n = qy(t, 0), r = n >= Zc[0] && n <= Zc[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: Wi(a ? t[0] : t),
    isSecondary: r || a
  };
}
function Bb(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), a = isNaN(r) ? "normal" : r;
  return (Xi[n] || {})[a] || Hb[n];
}
function eu(e, t) {
  const n = "".concat(Ay).concat(t.replace(":", "-"));
  return new Promise((r, a) => {
    if (e.getAttribute(n) !== null)
      return r();
    const i = ir(e.children).filter((m) => m.getAttribute(Di) === t)[0], s = rn.getComputedStyle(e, t), l = s.getPropertyValue("font-family"), c = l.match(Iy), u = s.getPropertyValue("font-weight"), p = s.getPropertyValue("content");
    if (i && !c)
      return e.removeChild(i), r();
    if (c && p !== "none" && p !== "") {
      const m = s.getPropertyValue("content");
      let b = Bb(l, u);
      const {
        value: x,
        isSecondary: v
      } = Wb(m), y = c[0].startsWith("FontAwesome");
      let w = al(b, x), P = w;
      if (y) {
        const S = eb(x);
        S.iconName && S.prefix && (w = S.iconName, b = S.prefix);
      }
      if (w && !v && (!i || i.getAttribute(Zs) !== b || i.getAttribute(Qs) !== P)) {
        e.setAttribute(n, P), i && e.removeChild(i);
        const S = Tb(), {
          extra: _
        } = S;
        _.attributes[Di] = t, Ui(w, b).then((h) => {
          const G = ol($($({}, S), {}, {
            icons: {
              main: h,
              mask: Ud()
            },
            prefix: b,
            iconName: P,
            extra: _,
            watchable: !0
          })), U = Ie.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(U, e.firstChild) : e.appendChild(U), U.outerHTML = G.map((te) => Yr(te)).join(`
`), e.removeAttribute(n), r();
        }).catch(a);
      } else
        r();
    } else
      r();
  });
}
function Gb(e) {
  return Promise.all([eu(e, "::before"), eu(e, "::after")]);
}
function Yb(e) {
  return e.parentNode !== document.head && !~_y.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Di) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function tu(e) {
  if (Gt)
    return new Promise((t, n) => {
      const r = ir(e.querySelectorAll("*")).filter(Yb).map(Gb), a = il.begin("searchPseudoElements");
      Zd(), Promise.all(r).then(() => {
        a(), Ki(), t();
      }).catch(() => {
        a(), Ki(), n();
      });
    });
}
var Vb = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = tu, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = Ie
      } = t;
      ne.searchPseudoElements && tu(n);
    };
  }
};
let nu = !1;
var Ub = {
  mixout() {
    return {
      dom: {
        unwatch() {
          Zd(), nu = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Kc(Gi("mutationObserverCallbacks", {}));
      },
      noAuto() {
        Sb();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        nu ? Ki() : Kc(Gi("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const ru = (e) => {
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
var qb = {
  mixout() {
    return {
      parse: {
        transform: (e) => ru(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = ru(n)), e;
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
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), l = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), c = "rotate(".concat(r.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(l, " ").concat(c)
      }, p = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, m = {
        outer: i,
        inner: u,
        path: p
      };
      return {
        tag: "g",
        attributes: $({}, m.outer),
        children: [{
          tag: "g",
          attributes: $({}, m.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: $($({}, n.icon.attributes), m.path)
          }]
        }]
      };
    };
  }
};
const Yo = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function au(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function Kb(e) {
  return e.tag === "g" ? e.children : [e];
}
var Xb = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? eo(n.split(" ").map((a) => a.trim())) : Ud();
        return r.prefix || (r.prefix = an()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        width: u,
        icon: p
      } = o, m = Wy({
        transform: s,
        containerWidth: u,
        iconWidth: l
      }), b = {
        tag: "rect",
        attributes: $($({}, Yo), {}, {
          fill: "white"
        })
      }, x = c.children ? {
        children: c.children.map(au)
      } : {}, v = {
        tag: "g",
        attributes: $({}, m.inner),
        children: [au($({
          tag: c.tag,
          attributes: $($({}, c.attributes), m.path)
        }, x))]
      }, y = {
        tag: "g",
        attributes: $({}, m.outer),
        children: [v]
      }, w = "mask-".concat(i || Mr()), P = "clip-".concat(i || Mr()), S = {
        tag: "mask",
        attributes: $($({}, Yo), {}, {
          id: w,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [b, y]
      }, _ = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: P
          },
          children: Kb(p)
        }, S]
      };
      return n.push(_, {
        tag: "rect",
        attributes: $({
          fill: "currentColor",
          "clip-path": "url(#".concat(P, ")"),
          mask: "url(#".concat(w, ")")
        }, Yo)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, Jb = {
  provides(e) {
    let t = !1;
    rn.matchMedia && (t = rn.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: $($({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = $($({}, a), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: $($({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: $($({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: $($({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(i), n.push({
        tag: "path",
        attributes: $($({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: $($({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: $($({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: $($({}, o), {}, {
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
}, Zb = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, Qb = [Yy, Rb, Lb, Db, zb, Vb, Ub, qb, Xb, Jb, Zb];
cb(Qb, {
  mixoutsTo: st
});
st.noAuto;
st.config;
st.library;
st.dom;
const Ji = st.parse;
st.findIconDefinition;
st.toHtml;
const ev = st.icon;
st.layer;
st.text;
st.counter;
function tv(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var ma = { exports: {} }, ga = { exports: {} }, ke = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ou;
function nv() {
  if (ou) return ke;
  ou = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, m = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, x = e ? Symbol.for("react.lazy") : 60116, v = e ? Symbol.for("react.block") : 60121, y = e ? Symbol.for("react.fundamental") : 60117, w = e ? Symbol.for("react.responder") : 60118, P = e ? Symbol.for("react.scope") : 60119;
  function S(h) {
    if (typeof h == "object" && h !== null) {
      var G = h.$$typeof;
      switch (G) {
        case t:
          switch (h = h.type, h) {
            case l:
            case c:
            case r:
            case o:
            case a:
            case p:
              return h;
            default:
              switch (h = h && h.$$typeof, h) {
                case s:
                case u:
                case x:
                case b:
                case i:
                  return h;
                default:
                  return G;
              }
          }
        case n:
          return G;
      }
    }
  }
  function _(h) {
    return S(h) === c;
  }
  return ke.AsyncMode = l, ke.ConcurrentMode = c, ke.ContextConsumer = s, ke.ContextProvider = i, ke.Element = t, ke.ForwardRef = u, ke.Fragment = r, ke.Lazy = x, ke.Memo = b, ke.Portal = n, ke.Profiler = o, ke.StrictMode = a, ke.Suspense = p, ke.isAsyncMode = function(h) {
    return _(h) || S(h) === l;
  }, ke.isConcurrentMode = _, ke.isContextConsumer = function(h) {
    return S(h) === s;
  }, ke.isContextProvider = function(h) {
    return S(h) === i;
  }, ke.isElement = function(h) {
    return typeof h == "object" && h !== null && h.$$typeof === t;
  }, ke.isForwardRef = function(h) {
    return S(h) === u;
  }, ke.isFragment = function(h) {
    return S(h) === r;
  }, ke.isLazy = function(h) {
    return S(h) === x;
  }, ke.isMemo = function(h) {
    return S(h) === b;
  }, ke.isPortal = function(h) {
    return S(h) === n;
  }, ke.isProfiler = function(h) {
    return S(h) === o;
  }, ke.isStrictMode = function(h) {
    return S(h) === a;
  }, ke.isSuspense = function(h) {
    return S(h) === p;
  }, ke.isValidElementType = function(h) {
    return typeof h == "string" || typeof h == "function" || h === r || h === c || h === o || h === a || h === p || h === m || typeof h == "object" && h !== null && (h.$$typeof === x || h.$$typeof === b || h.$$typeof === i || h.$$typeof === s || h.$$typeof === u || h.$$typeof === y || h.$$typeof === w || h.$$typeof === P || h.$$typeof === v);
  }, ke.typeOf = S, ke;
}
var Pe = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var iu;
function rv() {
  return iu || (iu = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, m = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, x = e ? Symbol.for("react.lazy") : 60116, v = e ? Symbol.for("react.block") : 60121, y = e ? Symbol.for("react.fundamental") : 60117, w = e ? Symbol.for("react.responder") : 60118, P = e ? Symbol.for("react.scope") : 60119;
    function S(O) {
      return typeof O == "string" || typeof O == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      O === r || O === c || O === o || O === a || O === p || O === m || typeof O == "object" && O !== null && (O.$$typeof === x || O.$$typeof === b || O.$$typeof === i || O.$$typeof === s || O.$$typeof === u || O.$$typeof === y || O.$$typeof === w || O.$$typeof === P || O.$$typeof === v);
    }
    function _(O) {
      if (typeof O == "object" && O !== null) {
        var Ee = O.$$typeof;
        switch (Ee) {
          case t:
            var qe = O.type;
            switch (qe) {
              case l:
              case c:
              case r:
              case o:
              case a:
              case p:
                return qe;
              default:
                var ht = qe && qe.$$typeof;
                switch (ht) {
                  case s:
                  case u:
                  case x:
                  case b:
                  case i:
                    return ht;
                  default:
                    return Ee;
                }
            }
          case n:
            return Ee;
        }
      }
    }
    var h = l, G = c, U = s, te = i, X = t, Z = u, Q = r, B = x, oe = b, q = n, J = o, Y = a, M = p, K = !1;
    function z(O) {
      return K || (K = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), g(O) || _(O) === l;
    }
    function g(O) {
      return _(O) === c;
    }
    function d(O) {
      return _(O) === s;
    }
    function E(O) {
      return _(O) === i;
    }
    function A(O) {
      return typeof O == "object" && O !== null && O.$$typeof === t;
    }
    function C(O) {
      return _(O) === u;
    }
    function T(O) {
      return _(O) === r;
    }
    function I(O) {
      return _(O) === x;
    }
    function N(O) {
      return _(O) === b;
    }
    function F(O) {
      return _(O) === n;
    }
    function L(O) {
      return _(O) === o;
    }
    function D(O) {
      return _(O) === a;
    }
    function ce(O) {
      return _(O) === p;
    }
    Pe.AsyncMode = h, Pe.ConcurrentMode = G, Pe.ContextConsumer = U, Pe.ContextProvider = te, Pe.Element = X, Pe.ForwardRef = Z, Pe.Fragment = Q, Pe.Lazy = B, Pe.Memo = oe, Pe.Portal = q, Pe.Profiler = J, Pe.StrictMode = Y, Pe.Suspense = M, Pe.isAsyncMode = z, Pe.isConcurrentMode = g, Pe.isContextConsumer = d, Pe.isContextProvider = E, Pe.isElement = A, Pe.isForwardRef = C, Pe.isFragment = T, Pe.isLazy = I, Pe.isMemo = N, Pe.isPortal = F, Pe.isProfiler = L, Pe.isStrictMode = D, Pe.isSuspense = ce, Pe.isValidElementType = S, Pe.typeOf = _;
  }()), Pe;
}
var su;
function ep() {
  return su || (su = 1, process.env.NODE_ENV === "production" ? ga.exports = nv() : ga.exports = rv()), ga.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Vo, lu;
function av() {
  if (lu) return Vo;
  lu = 1;
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
  return Vo = a() ? Object.assign : function(o, i) {
    for (var s, l = r(o), c, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var p in s)
        t.call(s, p) && (l[p] = s[p]);
      if (e) {
        c = e(s);
        for (var m = 0; m < c.length; m++)
          n.call(s, c[m]) && (l[c[m]] = s[c[m]]);
      }
    }
    return l;
  }, Vo;
}
var Uo, cu;
function ll() {
  if (cu) return Uo;
  cu = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return Uo = e, Uo;
}
var qo, uu;
function tp() {
  return uu || (uu = 1, qo = Function.call.bind(Object.prototype.hasOwnProperty)), qo;
}
var Ko, fu;
function ov() {
  if (fu) return Ko;
  fu = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ ll(), n = {}, r = /* @__PURE__ */ tp();
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
      for (var u in o)
        if (r(o, u)) {
          var p;
          try {
            if (typeof o[u] != "function") {
              var m = Error(
                (l || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw m.name = "Invariant Violation", m;
            }
            p = o[u](i, u, l, s, null, t);
          } catch (x) {
            p = x;
          }
          if (p && !(p instanceof Error) && e(
            (l || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof p + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), p instanceof Error && !(p.message in n)) {
            n[p.message] = !0;
            var b = c ? c() : "";
            e(
              "Failed " + s + " type: " + p.message + (b ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, Ko = a, Ko;
}
var Xo, du;
function iv() {
  if (du) return Xo;
  du = 1;
  var e = ep(), t = av(), n = /* @__PURE__ */ ll(), r = /* @__PURE__ */ tp(), a = /* @__PURE__ */ ov(), o = function() {
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
  return Xo = function(s, l) {
    var c = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function p(g) {
      var d = g && (c && g[c] || g[u]);
      if (typeof d == "function")
        return d;
    }
    var m = "<<anonymous>>", b = {
      array: w("array"),
      bigint: w("bigint"),
      bool: w("boolean"),
      func: w("function"),
      number: w("number"),
      object: w("object"),
      string: w("string"),
      symbol: w("symbol"),
      any: P(),
      arrayOf: S,
      element: _(),
      elementType: h(),
      instanceOf: G,
      node: Z(),
      objectOf: te,
      oneOf: U,
      oneOfType: X,
      shape: B,
      exact: oe
    };
    function x(g, d) {
      return g === d ? g !== 0 || 1 / g === 1 / d : g !== g && d !== d;
    }
    function v(g, d) {
      this.message = g, this.data = d && typeof d == "object" ? d : {}, this.stack = "";
    }
    v.prototype = Error.prototype;
    function y(g) {
      if (process.env.NODE_ENV !== "production")
        var d = {}, E = 0;
      function A(T, I, N, F, L, D, ce) {
        if (F = F || m, D = D || N, ce !== n) {
          if (l) {
            var O = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw O.name = "Invariant Violation", O;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var Ee = F + ":" + N;
            !d[Ee] && // Avoid spamming the console because they are often not actionable except for lib authors
            E < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + D + "` prop on `" + F + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), d[Ee] = !0, E++);
          }
        }
        return I[N] == null ? T ? I[N] === null ? new v("The " + L + " `" + D + "` is marked as required " + ("in `" + F + "`, but its value is `null`.")) : new v("The " + L + " `" + D + "` is marked as required in " + ("`" + F + "`, but its value is `undefined`.")) : null : g(I, N, F, L, D);
      }
      var C = A.bind(null, !1);
      return C.isRequired = A.bind(null, !0), C;
    }
    function w(g) {
      function d(E, A, C, T, I, N) {
        var F = E[A], L = Y(F);
        if (L !== g) {
          var D = M(F);
          return new v(
            "Invalid " + T + " `" + I + "` of type " + ("`" + D + "` supplied to `" + C + "`, expected ") + ("`" + g + "`."),
            { expectedType: g }
          );
        }
        return null;
      }
      return y(d);
    }
    function P() {
      return y(i);
    }
    function S(g) {
      function d(E, A, C, T, I) {
        if (typeof g != "function")
          return new v("Property `" + I + "` of component `" + C + "` has invalid PropType notation inside arrayOf.");
        var N = E[A];
        if (!Array.isArray(N)) {
          var F = Y(N);
          return new v("Invalid " + T + " `" + I + "` of type " + ("`" + F + "` supplied to `" + C + "`, expected an array."));
        }
        for (var L = 0; L < N.length; L++) {
          var D = g(N, L, C, T, I + "[" + L + "]", n);
          if (D instanceof Error)
            return D;
        }
        return null;
      }
      return y(d);
    }
    function _() {
      function g(d, E, A, C, T) {
        var I = d[E];
        if (!s(I)) {
          var N = Y(I);
          return new v("Invalid " + C + " `" + T + "` of type " + ("`" + N + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return y(g);
    }
    function h() {
      function g(d, E, A, C, T) {
        var I = d[E];
        if (!e.isValidElementType(I)) {
          var N = Y(I);
          return new v("Invalid " + C + " `" + T + "` of type " + ("`" + N + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return y(g);
    }
    function G(g) {
      function d(E, A, C, T, I) {
        if (!(E[A] instanceof g)) {
          var N = g.name || m, F = z(E[A]);
          return new v("Invalid " + T + " `" + I + "` of type " + ("`" + F + "` supplied to `" + C + "`, expected ") + ("instance of `" + N + "`."));
        }
        return null;
      }
      return y(d);
    }
    function U(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), i;
      function d(E, A, C, T, I) {
        for (var N = E[A], F = 0; F < g.length; F++)
          if (x(N, g[F]))
            return null;
        var L = JSON.stringify(g, function(ce, O) {
          var Ee = M(O);
          return Ee === "symbol" ? String(O) : O;
        });
        return new v("Invalid " + T + " `" + I + "` of value `" + String(N) + "` " + ("supplied to `" + C + "`, expected one of " + L + "."));
      }
      return y(d);
    }
    function te(g) {
      function d(E, A, C, T, I) {
        if (typeof g != "function")
          return new v("Property `" + I + "` of component `" + C + "` has invalid PropType notation inside objectOf.");
        var N = E[A], F = Y(N);
        if (F !== "object")
          return new v("Invalid " + T + " `" + I + "` of type " + ("`" + F + "` supplied to `" + C + "`, expected an object."));
        for (var L in N)
          if (r(N, L)) {
            var D = g(N, L, C, T, I + "." + L, n);
            if (D instanceof Error)
              return D;
          }
        return null;
      }
      return y(d);
    }
    function X(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var d = 0; d < g.length; d++) {
        var E = g[d];
        if (typeof E != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + K(E) + " at index " + d + "."
          ), i;
      }
      function A(C, T, I, N, F) {
        for (var L = [], D = 0; D < g.length; D++) {
          var ce = g[D], O = ce(C, T, I, N, F, n);
          if (O == null)
            return null;
          O.data && r(O.data, "expectedType") && L.push(O.data.expectedType);
        }
        var Ee = L.length > 0 ? ", expected one of type [" + L.join(", ") + "]" : "";
        return new v("Invalid " + N + " `" + F + "` supplied to " + ("`" + I + "`" + Ee + "."));
      }
      return y(A);
    }
    function Z() {
      function g(d, E, A, C, T) {
        return q(d[E]) ? null : new v("Invalid " + C + " `" + T + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return y(g);
    }
    function Q(g, d, E, A, C) {
      return new v(
        (g || "React class") + ": " + d + " type `" + E + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + C + "`."
      );
    }
    function B(g) {
      function d(E, A, C, T, I) {
        var N = E[A], F = Y(N);
        if (F !== "object")
          return new v("Invalid " + T + " `" + I + "` of type `" + F + "` " + ("supplied to `" + C + "`, expected `object`."));
        for (var L in g) {
          var D = g[L];
          if (typeof D != "function")
            return Q(C, T, I, L, M(D));
          var ce = D(N, L, C, T, I + "." + L, n);
          if (ce)
            return ce;
        }
        return null;
      }
      return y(d);
    }
    function oe(g) {
      function d(E, A, C, T, I) {
        var N = E[A], F = Y(N);
        if (F !== "object")
          return new v("Invalid " + T + " `" + I + "` of type `" + F + "` " + ("supplied to `" + C + "`, expected `object`."));
        var L = t({}, E[A], g);
        for (var D in L) {
          var ce = g[D];
          if (r(g, D) && typeof ce != "function")
            return Q(C, T, I, D, M(ce));
          if (!ce)
            return new v(
              "Invalid " + T + " `" + I + "` key `" + D + "` supplied to `" + C + "`.\nBad object: " + JSON.stringify(E[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(g), null, "  ")
            );
          var O = ce(N, D, C, T, I + "." + D, n);
          if (O)
            return O;
        }
        return null;
      }
      return y(d);
    }
    function q(g) {
      switch (typeof g) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !g;
        case "object":
          if (Array.isArray(g))
            return g.every(q);
          if (g === null || s(g))
            return !0;
          var d = p(g);
          if (d) {
            var E = d.call(g), A;
            if (d !== g.entries) {
              for (; !(A = E.next()).done; )
                if (!q(A.value))
                  return !1;
            } else
              for (; !(A = E.next()).done; ) {
                var C = A.value;
                if (C && !q(C[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function J(g, d) {
      return g === "symbol" ? !0 : d ? d["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && d instanceof Symbol : !1;
    }
    function Y(g) {
      var d = typeof g;
      return Array.isArray(g) ? "array" : g instanceof RegExp ? "object" : J(d, g) ? "symbol" : d;
    }
    function M(g) {
      if (typeof g > "u" || g === null)
        return "" + g;
      var d = Y(g);
      if (d === "object") {
        if (g instanceof Date)
          return "date";
        if (g instanceof RegExp)
          return "regexp";
      }
      return d;
    }
    function K(g) {
      var d = M(g);
      switch (d) {
        case "array":
        case "object":
          return "an " + d;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + d;
        default:
          return d;
      }
    }
    function z(g) {
      return !g.constructor || !g.constructor.name ? m : g.constructor.name;
    }
    return b.checkPropTypes = a, b.resetWarningCache = a.resetWarningCache, b.PropTypes = b, b;
  }, Xo;
}
var Jo, pu;
function sv() {
  if (pu) return Jo;
  pu = 1;
  var e = /* @__PURE__ */ ll();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, Jo = function() {
    function r(i, s, l, c, u, p) {
      if (p !== e) {
        var m = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw m.name = "Invariant Violation", m;
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
  }, Jo;
}
var mu;
function lv() {
  if (mu) return ma.exports;
  if (mu = 1, process.env.NODE_ENV !== "production") {
    var e = ep(), t = !0;
    ma.exports = /* @__PURE__ */ iv()(e.isElement, t);
  } else
    ma.exports = /* @__PURE__ */ sv()();
  return ma.exports;
}
var cv = /* @__PURE__ */ lv();
const he = /* @__PURE__ */ tv(cv);
function gu(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function bt(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? gu(Object(n), !0).forEach(function(r) {
      Bn(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : gu(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Ra(e) {
  "@babel/helpers - typeof";
  return Ra = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Ra(e);
}
function Bn(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function uv(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), a, o;
  for (o = 0; o < r.length; o++)
    a = r[o], !(t.indexOf(a) >= 0) && (n[a] = e[a]);
  return n;
}
function fv(e, t) {
  if (e == null) return {};
  var n = uv(e, t), r, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      r = o[a], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Zi(e) {
  return dv(e) || pv(e) || mv(e) || gv();
}
function dv(e) {
  if (Array.isArray(e)) return Qi(e);
}
function pv(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function mv(e, t) {
  if (e) {
    if (typeof e == "string") return Qi(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return Qi(e, t);
  }
}
function Qi(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function gv() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function hv(e) {
  var t, n = e.beat, r = e.fade, a = e.beatFade, o = e.bounce, i = e.shake, s = e.flash, l = e.spin, c = e.spinPulse, u = e.spinReverse, p = e.pulse, m = e.fixedWidth, b = e.inverse, x = e.border, v = e.listItem, y = e.flip, w = e.size, P = e.rotation, S = e.pull, _ = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": l,
    "fa-spin-reverse": u,
    "fa-spin-pulse": c,
    "fa-pulse": p,
    "fa-fw": m,
    "fa-inverse": b,
    "fa-border": x,
    "fa-li": v,
    "fa-flip": y === !0,
    "fa-flip-horizontal": y === "horizontal" || y === "both",
    "fa-flip-vertical": y === "vertical" || y === "both"
  }, Bn(t, "fa-".concat(w), typeof w < "u" && w !== null), Bn(t, "fa-rotate-".concat(P), typeof P < "u" && P !== null && P !== 0), Bn(t, "fa-pull-".concat(S), typeof S < "u" && S !== null), Bn(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(_).map(function(h) {
    return _[h] ? h : null;
  }).filter(function(h) {
    return h;
  });
}
function yv(e) {
  return e = e - 0, e === e;
}
function np(e) {
  return yv(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var bv = ["style"];
function vv(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function xv(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), a = np(n.slice(0, r)), o = n.slice(r + 1).trim();
    return a.startsWith("webkit") ? t[vv(a)] = o : t[a] = o, t;
  }, {});
}
function rp(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(l) {
    return rp(e, l);
  }), a = Object.keys(t.attributes || {}).reduce(function(l, c) {
    var u = t.attributes[c];
    switch (c) {
      case "class":
        l.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        l.attrs.style = xv(u);
        break;
      default:
        c.indexOf("aria-") === 0 || c.indexOf("data-") === 0 ? l.attrs[c.toLowerCase()] = u : l.attrs[np(c)] = u;
    }
    return l;
  }, {
    attrs: {}
  }), o = n.style, i = o === void 0 ? {} : o, s = fv(n, bv);
  return a.attrs.style = bt(bt({}, a.attrs.style), i), e.apply(void 0, [t.tag, bt(bt({}, a.attrs), s)].concat(Zi(r)));
}
var ap = !1;
try {
  ap = process.env.NODE_ENV === "production";
} catch {
}
function wv() {
  if (!ap && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function hu(e) {
  if (e && Ra(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Ji.icon)
    return Ji.icon(e);
  if (e === null)
    return null;
  if (e && Ra(e) === "object" && e.prefix && e.iconName)
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
function Zo(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Bn({}, e, t) : {};
}
var yu = {
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
}, gn = /* @__PURE__ */ ue.forwardRef(function(e, t) {
  var n = bt(bt({}, yu), e), r = n.icon, a = n.mask, o = n.symbol, i = n.className, s = n.title, l = n.titleId, c = n.maskId, u = hu(r), p = Zo("classes", [].concat(Zi(hv(n)), Zi((i || "").split(" ")))), m = Zo("transform", typeof n.transform == "string" ? Ji.transform(n.transform) : n.transform), b = Zo("mask", hu(a)), x = ev(u, bt(bt(bt(bt({}, p), m), b), {}, {
    symbol: o,
    title: s,
    titleId: l,
    maskId: c
  }));
  if (!x)
    return wv("Could not find icon", u), null;
  var v = x.abstract, y = {
    ref: t
  };
  return Object.keys(n).forEach(function(w) {
    yu.hasOwnProperty(w) || (y[w] = n[w]);
  }), Ev(v[0], y);
});
gn.displayName = "FontAwesomeIcon";
gn.propTypes = {
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
var Ev = rp.bind(null, ue.createElement), kv = Object.defineProperty, Pv = (e, t, n) => t in e ? kv(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, We = (e, t, n) => Pv(e, typeof t != "symbol" ? t + "" : t, n);
let op = class {
  constructor(t) {
    We(this, "kind", "model"), We(this, "id"), We(this, "tauriId"), We(this, "fullName"), We(this, "category"), We(this, "creator"), We(this, "selectorName"), We(this, "selectorDescription"), We(this, "selectorBadges"), We(this, "tags"), this.id = t.id, this.tauriId = t.tauriId, this.fullName = t.fullName, this.category = t.category, this.creator = t.creator, this.selectorName = t.selectorName, this.selectorDescription = t.selectorDescription, this.selectorBadges = t.selectorBadges, this.tags = t.tags ?? [];
  }
  toLegacyBadges() {
    return this.selectorBadges.map((t) => ({ label: t }));
  }
  // TODO: This is a method to support migration. Kill it after we no longer need it.
  toLegacyModelConfig() {
    return {
      id: this.id,
      label: this.selectorName,
      description: this.selectorDescription,
      badges: this.toLegacyBadges(),
      category: this.category,
      info: {
        name: this.fullName,
        tauri_id: this.tauriId,
        creator: this.creator
      },
      capabilities: {
        maxGenerationCount: 9,
        // NB: Sentinel value to detect continued use
        defaultGenerationCount: 9
        // NB: Sentinel value to detect continued use
      },
      tags: []
    };
  }
};
class yt extends op {
  constructor(t) {
    if (t.maxGenerationCount < 1)
      throw new Error("maxGenerationCount must be at least 1");
    if (t.defaultGenerationCount < 1)
      throw new Error("defaultGenerationCount must be at least 1");
    if (t.defaultGenerationCount > t.maxGenerationCount)
      throw new Error(
        "defaultGenerationCount must be less than or equal to maxGenerationCount"
      );
    super(t), We(this, "kind", "image_model"), We(this, "maxGenerationCount"), We(this, "defaultGenerationCount"), We(this, "canEditImages"), We(this, "usesInpaintingMask"), We(this, "canUseImagePrompt"), We(this, "maxImagePromptCount"), this.maxGenerationCount = t.maxGenerationCount, this.defaultGenerationCount = t.defaultGenerationCount, this.canEditImages = t.canEditImages ?? !1, this.usesInpaintingMask = t.usesInpaintingMask ?? !1, this.canUseImagePrompt = t.canUseImagePrompt ?? !1, this.maxImagePromptCount = Math.max(0, t.maxImagePromptCount ?? 1);
  }
}
class hr extends op {
  constructor(t) {
    super(t), We(this, "kind", "video_model"), We(this, "startFrame"), We(this, "endFrame"), this.startFrame = t.startFrame, this.endFrame = t.endFrame;
  }
}
var le = /* @__PURE__ */ ((e) => (e.BlackForestLabs = "BlackForestLabs", e.Bytedance = "Bytedance", e.Google = "Google", e.Hailuo = "Hailuo", e.Kling = "Kling", e.Midjourney = "Midjourney", e.OpenAi = "OpenAi", e.Runway = "Runway", e.Stability = "Stability", e.Tencent = "Tencent", e.Recraft = "Recraft", e.Krea = "Krea", e.Fal = "Fal", e.Replicate = "Replicate", e.TensorArt = "TensorArt", e.OpenArt = "OpenArt", e.Higgsfield = "Higgsfield", e.Alibaba = "Alibaba", e.Vidu = "Vidu", e.ArtCraft = "ArtCraft", e))(le || {});
function Ov(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Qo = { exports: {} }, ge = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var bu;
function Sv() {
  if (bu) return ge;
  bu = 1;
  var e = Symbol.for("react.element"), t = Symbol.for("react.portal"), n = Symbol.for("react.fragment"), r = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.provider"), i = Symbol.for("react.context"), s = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), c = Symbol.for("react.memo"), u = Symbol.for("react.lazy"), p = Symbol.iterator;
  function m(d) {
    return d === null || typeof d != "object" ? null : (d = p && d[p] || d["@@iterator"], typeof d == "function" ? d : null);
  }
  var b = { isMounted: function() {
    return !1;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, x = Object.assign, v = {};
  function y(d, E, A) {
    this.props = d, this.context = E, this.refs = v, this.updater = A || b;
  }
  y.prototype.isReactComponent = {}, y.prototype.setState = function(d, E) {
    if (typeof d != "object" && typeof d != "function" && d != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, d, E, "setState");
  }, y.prototype.forceUpdate = function(d) {
    this.updater.enqueueForceUpdate(this, d, "forceUpdate");
  };
  function w() {
  }
  w.prototype = y.prototype;
  function P(d, E, A) {
    this.props = d, this.context = E, this.refs = v, this.updater = A || b;
  }
  var S = P.prototype = new w();
  S.constructor = P, x(S, y.prototype), S.isPureReactComponent = !0;
  var _ = Array.isArray, h = Object.prototype.hasOwnProperty, G = { current: null }, U = { key: !0, ref: !0, __self: !0, __source: !0 };
  function te(d, E, A) {
    var C, T = {}, I = null, N = null;
    if (E != null) for (C in E.ref !== void 0 && (N = E.ref), E.key !== void 0 && (I = "" + E.key), E) h.call(E, C) && !U.hasOwnProperty(C) && (T[C] = E[C]);
    var F = arguments.length - 2;
    if (F === 1) T.children = A;
    else if (1 < F) {
      for (var L = Array(F), D = 0; D < F; D++) L[D] = arguments[D + 2];
      T.children = L;
    }
    if (d && d.defaultProps) for (C in F = d.defaultProps, F) T[C] === void 0 && (T[C] = F[C]);
    return { $$typeof: e, type: d, key: I, ref: N, props: T, _owner: G.current };
  }
  function X(d, E) {
    return { $$typeof: e, type: d.type, key: E, ref: d.ref, props: d.props, _owner: d._owner };
  }
  function Z(d) {
    return typeof d == "object" && d !== null && d.$$typeof === e;
  }
  function Q(d) {
    var E = { "=": "=0", ":": "=2" };
    return "$" + d.replace(/[=:]/g, function(A) {
      return E[A];
    });
  }
  var B = /\/+/g;
  function oe(d, E) {
    return typeof d == "object" && d !== null && d.key != null ? Q("" + d.key) : E.toString(36);
  }
  function q(d, E, A, C, T) {
    var I = typeof d;
    (I === "undefined" || I === "boolean") && (d = null);
    var N = !1;
    if (d === null) N = !0;
    else switch (I) {
      case "string":
      case "number":
        N = !0;
        break;
      case "object":
        switch (d.$$typeof) {
          case e:
          case t:
            N = !0;
        }
    }
    if (N) return N = d, T = T(N), d = C === "" ? "." + oe(N, 0) : C, _(T) ? (A = "", d != null && (A = d.replace(B, "$&/") + "/"), q(T, E, A, "", function(D) {
      return D;
    })) : T != null && (Z(T) && (T = X(T, A + (!T.key || N && N.key === T.key ? "" : ("" + T.key).replace(B, "$&/") + "/") + d)), E.push(T)), 1;
    if (N = 0, C = C === "" ? "." : C + ":", _(d)) for (var F = 0; F < d.length; F++) {
      I = d[F];
      var L = C + oe(I, F);
      N += q(I, E, A, L, T);
    }
    else if (L = m(d), typeof L == "function") for (d = L.call(d), F = 0; !(I = d.next()).done; ) I = I.value, L = C + oe(I, F++), N += q(I, E, A, L, T);
    else if (I === "object") throw E = String(d), Error("Objects are not valid as a React child (found: " + (E === "[object Object]" ? "object with keys {" + Object.keys(d).join(", ") + "}" : E) + "). If you meant to render a collection of children, use an array instead.");
    return N;
  }
  function J(d, E, A) {
    if (d == null) return d;
    var C = [], T = 0;
    return q(d, C, "", "", function(I) {
      return E.call(A, I, T++);
    }), C;
  }
  function Y(d) {
    if (d._status === -1) {
      var E = d._result;
      E = E(), E.then(function(A) {
        (d._status === 0 || d._status === -1) && (d._status = 1, d._result = A);
      }, function(A) {
        (d._status === 0 || d._status === -1) && (d._status = 2, d._result = A);
      }), d._status === -1 && (d._status = 0, d._result = E);
    }
    if (d._status === 1) return d._result.default;
    throw d._result;
  }
  var M = { current: null }, K = { transition: null }, z = { ReactCurrentDispatcher: M, ReactCurrentBatchConfig: K, ReactCurrentOwner: G };
  function g() {
    throw Error("act(...) is not supported in production builds of React.");
  }
  return ge.Children = { map: J, forEach: function(d, E, A) {
    J(d, function() {
      E.apply(this, arguments);
    }, A);
  }, count: function(d) {
    var E = 0;
    return J(d, function() {
      E++;
    }), E;
  }, toArray: function(d) {
    return J(d, function(E) {
      return E;
    }) || [];
  }, only: function(d) {
    if (!Z(d)) throw Error("React.Children.only expected to receive a single React element child.");
    return d;
  } }, ge.Component = y, ge.Fragment = n, ge.Profiler = a, ge.PureComponent = P, ge.StrictMode = r, ge.Suspense = l, ge.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = z, ge.act = g, ge.cloneElement = function(d, E, A) {
    if (d == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + d + ".");
    var C = x({}, d.props), T = d.key, I = d.ref, N = d._owner;
    if (E != null) {
      if (E.ref !== void 0 && (I = E.ref, N = G.current), E.key !== void 0 && (T = "" + E.key), d.type && d.type.defaultProps) var F = d.type.defaultProps;
      for (L in E) h.call(E, L) && !U.hasOwnProperty(L) && (C[L] = E[L] === void 0 && F !== void 0 ? F[L] : E[L]);
    }
    var L = arguments.length - 2;
    if (L === 1) C.children = A;
    else if (1 < L) {
      F = Array(L);
      for (var D = 0; D < L; D++) F[D] = arguments[D + 2];
      C.children = F;
    }
    return { $$typeof: e, type: d.type, key: T, ref: I, props: C, _owner: N };
  }, ge.createContext = function(d) {
    return d = { $$typeof: i, _currentValue: d, _currentValue2: d, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, d.Provider = { $$typeof: o, _context: d }, d.Consumer = d;
  }, ge.createElement = te, ge.createFactory = function(d) {
    var E = te.bind(null, d);
    return E.type = d, E;
  }, ge.createRef = function() {
    return { current: null };
  }, ge.forwardRef = function(d) {
    return { $$typeof: s, render: d };
  }, ge.isValidElement = Z, ge.lazy = function(d) {
    return { $$typeof: u, _payload: { _status: -1, _result: d }, _init: Y };
  }, ge.memo = function(d, E) {
    return { $$typeof: c, type: d, compare: E === void 0 ? null : E };
  }, ge.startTransition = function(d) {
    var E = K.transition;
    K.transition = {};
    try {
      d();
    } finally {
      K.transition = E;
    }
  }, ge.unstable_act = g, ge.useCallback = function(d, E) {
    return M.current.useCallback(d, E);
  }, ge.useContext = function(d) {
    return M.current.useContext(d);
  }, ge.useDebugValue = function() {
  }, ge.useDeferredValue = function(d) {
    return M.current.useDeferredValue(d);
  }, ge.useEffect = function(d, E) {
    return M.current.useEffect(d, E);
  }, ge.useId = function() {
    return M.current.useId();
  }, ge.useImperativeHandle = function(d, E, A) {
    return M.current.useImperativeHandle(d, E, A);
  }, ge.useInsertionEffect = function(d, E) {
    return M.current.useInsertionEffect(d, E);
  }, ge.useLayoutEffect = function(d, E) {
    return M.current.useLayoutEffect(d, E);
  }, ge.useMemo = function(d, E) {
    return M.current.useMemo(d, E);
  }, ge.useReducer = function(d, E, A) {
    return M.current.useReducer(d, E, A);
  }, ge.useRef = function(d) {
    return M.current.useRef(d);
  }, ge.useState = function(d) {
    return M.current.useState(d);
  }, ge.useSyncExternalStore = function(d, E, A) {
    return M.current.useSyncExternalStore(d, E, A);
  }, ge.useTransition = function() {
    return M.current.useTransition();
  }, ge.version = "18.3.1", ge;
}
var Sa = { exports: {} };
/**
 * @license React
 * react.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Sa.exports;
var vu;
function Av() {
  return vu || (vu = 1, function(e, t) {
    process.env.NODE_ENV !== "production" && function() {
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
      var n = "18.3.1", r = Symbol.for("react.element"), a = Symbol.for("react.portal"), o = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), s = Symbol.for("react.profiler"), l = Symbol.for("react.provider"), c = Symbol.for("react.context"), u = Symbol.for("react.forward_ref"), p = Symbol.for("react.suspense"), m = Symbol.for("react.suspense_list"), b = Symbol.for("react.memo"), x = Symbol.for("react.lazy"), v = Symbol.for("react.offscreen"), y = Symbol.iterator, w = "@@iterator";
      function P(f) {
        if (f === null || typeof f != "object")
          return null;
        var k = y && f[y] || f[w];
        return typeof k == "function" ? k : null;
      }
      var S = {
        /**
         * @internal
         * @type {ReactComponent}
         */
        current: null
      }, _ = {
        transition: null
      }, h = {
        current: null,
        // Used to reproduce behavior of `batchedUpdates` in legacy mode.
        isBatchingLegacy: !1,
        didScheduleLegacyUpdate: !1
      }, G = {
        /**
         * @internal
         * @type {ReactComponent}
         */
        current: null
      }, U = {}, te = null;
      function X(f) {
        te = f;
      }
      U.setExtraStackFrame = function(f) {
        te = f;
      }, U.getCurrentStack = null, U.getStackAddendum = function() {
        var f = "";
        te && (f += te);
        var k = U.getCurrentStack;
        return k && (f += k() || ""), f;
      };
      var Z = !1, Q = !1, B = !1, oe = !1, q = !1, J = {
        ReactCurrentDispatcher: S,
        ReactCurrentBatchConfig: _,
        ReactCurrentOwner: G
      };
      J.ReactDebugCurrentFrame = U, J.ReactCurrentActQueue = h;
      function Y(f) {
        {
          for (var k = arguments.length, j = new Array(k > 1 ? k - 1 : 0), R = 1; R < k; R++)
            j[R - 1] = arguments[R];
          K("warn", f, j);
        }
      }
      function M(f) {
        {
          for (var k = arguments.length, j = new Array(k > 1 ? k - 1 : 0), R = 1; R < k; R++)
            j[R - 1] = arguments[R];
          K("error", f, j);
        }
      }
      function K(f, k, j) {
        {
          var R = J.ReactDebugCurrentFrame, V = R.getStackAddendum();
          V !== "" && (k += "%s", j = j.concat([V]));
          var fe = j.map(function(ee) {
            return String(ee);
          });
          fe.unshift("Warning: " + k), Function.prototype.apply.call(console[f], console, fe);
        }
      }
      var z = {};
      function g(f, k) {
        {
          var j = f.constructor, R = j && (j.displayName || j.name) || "ReactClass", V = R + "." + k;
          if (z[V])
            return;
          M("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", k, R), z[V] = !0;
        }
      }
      var d = {
        /**
         * Checks whether or not this composite component is mounted.
         * @param {ReactClass} publicInstance The instance we want to test.
         * @return {boolean} True if mounted, false otherwise.
         * @protected
         * @final
         */
        isMounted: function(f) {
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
        enqueueForceUpdate: function(f, k, j) {
          g(f, "forceUpdate");
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
        enqueueReplaceState: function(f, k, j, R) {
          g(f, "replaceState");
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
        enqueueSetState: function(f, k, j, R) {
          g(f, "setState");
        }
      }, E = Object.assign, A = {};
      Object.freeze(A);
      function C(f, k, j) {
        this.props = f, this.context = k, this.refs = A, this.updater = j || d;
      }
      C.prototype.isReactComponent = {}, C.prototype.setState = function(f, k) {
        if (typeof f != "object" && typeof f != "function" && f != null)
          throw new Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, f, k, "setState");
      }, C.prototype.forceUpdate = function(f) {
        this.updater.enqueueForceUpdate(this, f, "forceUpdate");
      };
      {
        var T = {
          isMounted: ["isMounted", "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."],
          replaceState: ["replaceState", "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."]
        }, I = function(f, k) {
          Object.defineProperty(C.prototype, f, {
            get: function() {
              Y("%s(...) is deprecated in plain JavaScript React classes. %s", k[0], k[1]);
            }
          });
        };
        for (var N in T)
          T.hasOwnProperty(N) && I(N, T[N]);
      }
      function F() {
      }
      F.prototype = C.prototype;
      function L(f, k, j) {
        this.props = f, this.context = k, this.refs = A, this.updater = j || d;
      }
      var D = L.prototype = new F();
      D.constructor = L, E(D, C.prototype), D.isPureReactComponent = !0;
      function ce() {
        var f = {
          current: null
        };
        return Object.seal(f), f;
      }
      var O = Array.isArray;
      function Ee(f) {
        return O(f);
      }
      function qe(f) {
        {
          var k = typeof Symbol == "function" && Symbol.toStringTag, j = k && f[Symbol.toStringTag] || f.constructor.name || "Object";
          return j;
        }
      }
      function ht(f) {
        try {
          return Kl(f), !1;
        } catch {
          return !0;
        }
      }
      function Kl(f) {
        return "" + f;
      }
      function na(f) {
        if (ht(f))
          return M("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", qe(f)), Kl(f);
      }
      function Gg(f, k, j) {
        var R = f.displayName;
        if (R)
          return R;
        var V = k.displayName || k.name || "";
        return V !== "" ? j + "(" + V + ")" : j;
      }
      function Xl(f) {
        return f.displayName || "Context";
      }
      function Ut(f) {
        if (f == null)
          return null;
        if (typeof f.tag == "number" && M("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof f == "function")
          return f.displayName || f.name || null;
        if (typeof f == "string")
          return f;
        switch (f) {
          case o:
            return "Fragment";
          case a:
            return "Portal";
          case s:
            return "Profiler";
          case i:
            return "StrictMode";
          case p:
            return "Suspense";
          case m:
            return "SuspenseList";
        }
        if (typeof f == "object")
          switch (f.$$typeof) {
            case c:
              var k = f;
              return Xl(k) + ".Consumer";
            case l:
              var j = f;
              return Xl(j._context) + ".Provider";
            case u:
              return Gg(f, f.render, "ForwardRef");
            case b:
              var R = f.displayName || null;
              return R !== null ? R : Ut(f.type) || "Memo";
            case x: {
              var V = f, fe = V._payload, ee = V._init;
              try {
                return Ut(ee(fe));
              } catch {
                return null;
              }
            }
          }
        return null;
      }
      var pr = Object.prototype.hasOwnProperty, Jl = {
        key: !0,
        ref: !0,
        __self: !0,
        __source: !0
      }, Zl, Ql, Co;
      Co = {};
      function ec(f) {
        if (pr.call(f, "ref")) {
          var k = Object.getOwnPropertyDescriptor(f, "ref").get;
          if (k && k.isReactWarning)
            return !1;
        }
        return f.ref !== void 0;
      }
      function tc(f) {
        if (pr.call(f, "key")) {
          var k = Object.getOwnPropertyDescriptor(f, "key").get;
          if (k && k.isReactWarning)
            return !1;
        }
        return f.key !== void 0;
      }
      function Yg(f, k) {
        var j = function() {
          Zl || (Zl = !0, M("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", k));
        };
        j.isReactWarning = !0, Object.defineProperty(f, "key", {
          get: j,
          configurable: !0
        });
      }
      function Vg(f, k) {
        var j = function() {
          Ql || (Ql = !0, M("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", k));
        };
        j.isReactWarning = !0, Object.defineProperty(f, "ref", {
          get: j,
          configurable: !0
        });
      }
      function Ug(f) {
        if (typeof f.ref == "string" && G.current && f.__self && G.current.stateNode !== f.__self) {
          var k = Ut(G.current.type);
          Co[k] || (M('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', k, f.ref), Co[k] = !0);
        }
      }
      var _o = function(f, k, j, R, V, fe, ee) {
        var de = {
          // This tag allows us to uniquely identify this as a React Element
          $$typeof: r,
          // Built-in properties that belong on the element
          type: f,
          key: k,
          ref: j,
          props: ee,
          // Record the component responsible for creating this element.
          _owner: fe
        };
        return de._store = {}, Object.defineProperty(de._store, "validated", {
          configurable: !1,
          enumerable: !1,
          writable: !0,
          value: !1
        }), Object.defineProperty(de, "_self", {
          configurable: !1,
          enumerable: !1,
          writable: !1,
          value: R
        }), Object.defineProperty(de, "_source", {
          configurable: !1,
          enumerable: !1,
          writable: !1,
          value: V
        }), Object.freeze && (Object.freeze(de.props), Object.freeze(de)), de;
      };
      function qg(f, k, j) {
        var R, V = {}, fe = null, ee = null, de = null, we = null;
        if (k != null) {
          ec(k) && (ee = k.ref, Ug(k)), tc(k) && (na(k.key), fe = "" + k.key), de = k.__self === void 0 ? null : k.__self, we = k.__source === void 0 ? null : k.__source;
          for (R in k)
            pr.call(k, R) && !Jl.hasOwnProperty(R) && (V[R] = k[R]);
        }
        var _e = arguments.length - 2;
        if (_e === 1)
          V.children = j;
        else if (_e > 1) {
          for (var Fe = Array(_e), Re = 0; Re < _e; Re++)
            Fe[Re] = arguments[Re + 2];
          Object.freeze && Object.freeze(Fe), V.children = Fe;
        }
        if (f && f.defaultProps) {
          var De = f.defaultProps;
          for (R in De)
            V[R] === void 0 && (V[R] = De[R]);
        }
        if (fe || ee) {
          var He = typeof f == "function" ? f.displayName || f.name || "Unknown" : f;
          fe && Yg(V, He), ee && Vg(V, He);
        }
        return _o(f, fe, ee, de, we, G.current, V);
      }
      function Kg(f, k) {
        var j = _o(f.type, k, f.ref, f._self, f._source, f._owner, f.props);
        return j;
      }
      function Xg(f, k, j) {
        if (f == null)
          throw new Error("React.cloneElement(...): The argument must be a React element, but you passed " + f + ".");
        var R, V = E({}, f.props), fe = f.key, ee = f.ref, de = f._self, we = f._source, _e = f._owner;
        if (k != null) {
          ec(k) && (ee = k.ref, _e = G.current), tc(k) && (na(k.key), fe = "" + k.key);
          var Fe;
          f.type && f.type.defaultProps && (Fe = f.type.defaultProps);
          for (R in k)
            pr.call(k, R) && !Jl.hasOwnProperty(R) && (k[R] === void 0 && Fe !== void 0 ? V[R] = Fe[R] : V[R] = k[R]);
        }
        var Re = arguments.length - 2;
        if (Re === 1)
          V.children = j;
        else if (Re > 1) {
          for (var De = Array(Re), He = 0; He < Re; He++)
            De[He] = arguments[He + 2];
          V.children = De;
        }
        return _o(f.type, fe, ee, de, we, _e, V);
      }
      function Dn(f) {
        return typeof f == "object" && f !== null && f.$$typeof === r;
      }
      var nc = ".", Jg = ":";
      function Zg(f) {
        var k = /[=:]/g, j = {
          "=": "=0",
          ":": "=2"
        }, R = f.replace(k, function(V) {
          return j[V];
        });
        return "$" + R;
      }
      var rc = !1, Qg = /\/+/g;
      function ac(f) {
        return f.replace(Qg, "$&/");
      }
      function To(f, k) {
        return typeof f == "object" && f !== null && f.key != null ? (na(f.key), Zg("" + f.key)) : k.toString(36);
      }
      function ra(f, k, j, R, V) {
        var fe = typeof f;
        (fe === "undefined" || fe === "boolean") && (f = null);
        var ee = !1;
        if (f === null)
          ee = !0;
        else
          switch (fe) {
            case "string":
            case "number":
              ee = !0;
              break;
            case "object":
              switch (f.$$typeof) {
                case r:
                case a:
                  ee = !0;
              }
          }
        if (ee) {
          var de = f, we = V(de), _e = R === "" ? nc + To(de, 0) : R;
          if (Ee(we)) {
            var Fe = "";
            _e != null && (Fe = ac(_e) + "/"), ra(we, k, Fe, "", function(Yh) {
              return Yh;
            });
          } else we != null && (Dn(we) && (we.key && (!de || de.key !== we.key) && na(we.key), we = Kg(
            we,
            // Keep both the (mapped) and old keys if they differ, just as
            // traverseAllChildren used to do for objects as children
            j + // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
            (we.key && (!de || de.key !== we.key) ? (
              // $FlowFixMe Flow incorrectly thinks existing element's key can be a number
              // eslint-disable-next-line react-internal/safe-string-coercion
              ac("" + we.key) + "/"
            ) : "") + _e
          )), k.push(we));
          return 1;
        }
        var Re, De, He = 0, Ve = R === "" ? nc : R + Jg;
        if (Ee(f))
          for (var fa = 0; fa < f.length; fa++)
            Re = f[fa], De = Ve + To(Re, fa), He += ra(Re, k, j, De, V);
        else {
          var zo = P(f);
          if (typeof zo == "function") {
            var _c = f;
            zo === _c.entries && (rc || Y("Using Maps as children is not supported. Use an array of keyed ReactElements instead."), rc = !0);
            for (var Bh = zo.call(_c), Tc, Gh = 0; !(Tc = Bh.next()).done; )
              Re = Tc.value, De = Ve + To(Re, Gh++), He += ra(Re, k, j, De, V);
          } else if (fe === "object") {
            var Nc = String(f);
            throw new Error("Objects are not valid as a React child (found: " + (Nc === "[object Object]" ? "object with keys {" + Object.keys(f).join(", ") + "}" : Nc) + "). If you meant to render a collection of children, use an array instead.");
          }
        }
        return He;
      }
      function aa(f, k, j) {
        if (f == null)
          return f;
        var R = [], V = 0;
        return ra(f, R, "", "", function(fe) {
          return k.call(j, fe, V++);
        }), R;
      }
      function eh(f) {
        var k = 0;
        return aa(f, function() {
          k++;
        }), k;
      }
      function th(f, k, j) {
        aa(f, function() {
          k.apply(this, arguments);
        }, j);
      }
      function nh(f) {
        return aa(f, function(k) {
          return k;
        }) || [];
      }
      function rh(f) {
        if (!Dn(f))
          throw new Error("React.Children.only expected to receive a single React element child.");
        return f;
      }
      function ah(f) {
        var k = {
          $$typeof: c,
          // As a workaround to support multiple concurrent renderers, we categorize
          // some renderers as primary and others as secondary. We only expect
          // there to be two concurrent renderers at most: React Native (primary) and
          // Fabric (secondary); React DOM (primary) and React ART (secondary).
          // Secondary renderers store their context values on separate fields.
          _currentValue: f,
          _currentValue2: f,
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
        k.Provider = {
          $$typeof: l,
          _context: k
        };
        var j = !1, R = !1, V = !1;
        {
          var fe = {
            $$typeof: c,
            _context: k
          };
          Object.defineProperties(fe, {
            Provider: {
              get: function() {
                return R || (R = !0, M("Rendering <Context.Consumer.Provider> is not supported and will be removed in a future major release. Did you mean to render <Context.Provider> instead?")), k.Provider;
              },
              set: function(ee) {
                k.Provider = ee;
              }
            },
            _currentValue: {
              get: function() {
                return k._currentValue;
              },
              set: function(ee) {
                k._currentValue = ee;
              }
            },
            _currentValue2: {
              get: function() {
                return k._currentValue2;
              },
              set: function(ee) {
                k._currentValue2 = ee;
              }
            },
            _threadCount: {
              get: function() {
                return k._threadCount;
              },
              set: function(ee) {
                k._threadCount = ee;
              }
            },
            Consumer: {
              get: function() {
                return j || (j = !0, M("Rendering <Context.Consumer.Consumer> is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?")), k.Consumer;
              }
            },
            displayName: {
              get: function() {
                return k.displayName;
              },
              set: function(ee) {
                V || (Y("Setting `displayName` on Context.Consumer has no effect. You should set it directly on the context with Context.displayName = '%s'.", ee), V = !0);
              }
            }
          }), k.Consumer = fe;
        }
        return k._currentRenderer = null, k._currentRenderer2 = null, k;
      }
      var mr = -1, No = 0, oc = 1, oh = 2;
      function ih(f) {
        if (f._status === mr) {
          var k = f._result, j = k();
          if (j.then(function(fe) {
            if (f._status === No || f._status === mr) {
              var ee = f;
              ee._status = oc, ee._result = fe;
            }
          }, function(fe) {
            if (f._status === No || f._status === mr) {
              var ee = f;
              ee._status = oh, ee._result = fe;
            }
          }), f._status === mr) {
            var R = f;
            R._status = No, R._result = j;
          }
        }
        if (f._status === oc) {
          var V = f._result;
          return V === void 0 && M(`lazy: Expected the result of a dynamic import() call. Instead received: %s

Your code should look like: 
  const MyComponent = lazy(() => import('./MyComponent'))

Did you accidentally put curly braces around the import?`, V), "default" in V || M(`lazy: Expected the result of a dynamic import() call. Instead received: %s

Your code should look like: 
  const MyComponent = lazy(() => import('./MyComponent'))`, V), V.default;
        } else
          throw f._result;
      }
      function sh(f) {
        var k = {
          // We use these fields to store the result.
          _status: mr,
          _result: f
        }, j = {
          $$typeof: x,
          _payload: k,
          _init: ih
        };
        {
          var R, V;
          Object.defineProperties(j, {
            defaultProps: {
              configurable: !0,
              get: function() {
                return R;
              },
              set: function(fe) {
                M("React.lazy(...): It is not supported to assign `defaultProps` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it."), R = fe, Object.defineProperty(j, "defaultProps", {
                  enumerable: !0
                });
              }
            },
            propTypes: {
              configurable: !0,
              get: function() {
                return V;
              },
              set: function(fe) {
                M("React.lazy(...): It is not supported to assign `propTypes` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it."), V = fe, Object.defineProperty(j, "propTypes", {
                  enumerable: !0
                });
              }
            }
          });
        }
        return j;
      }
      function lh(f) {
        f != null && f.$$typeof === b ? M("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).") : typeof f != "function" ? M("forwardRef requires a render function but was given %s.", f === null ? "null" : typeof f) : f.length !== 0 && f.length !== 2 && M("forwardRef render functions accept exactly two parameters: props and ref. %s", f.length === 1 ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."), f != null && (f.defaultProps != null || f.propTypes != null) && M("forwardRef render functions do not support propTypes or defaultProps. Did you accidentally pass a React component?");
        var k = {
          $$typeof: u,
          render: f
        };
        {
          var j;
          Object.defineProperty(k, "displayName", {
            enumerable: !1,
            configurable: !0,
            get: function() {
              return j;
            },
            set: function(R) {
              j = R, !f.name && !f.displayName && (f.displayName = R);
            }
          });
        }
        return k;
      }
      var ic;
      ic = Symbol.for("react.module.reference");
      function sc(f) {
        return !!(typeof f == "string" || typeof f == "function" || f === o || f === s || q || f === i || f === p || f === m || oe || f === v || Z || Q || B || typeof f == "object" && f !== null && (f.$$typeof === x || f.$$typeof === b || f.$$typeof === l || f.$$typeof === c || f.$$typeof === u || // This needs to include all possible module reference object
        // types supported by any Flight configuration anywhere since
        // we don't know which Flight build this will end up being used
        // with.
        f.$$typeof === ic || f.getModuleId !== void 0));
      }
      function ch(f, k) {
        sc(f) || M("memo: The first argument must be a component. Instead received: %s", f === null ? "null" : typeof f);
        var j = {
          $$typeof: b,
          type: f,
          compare: k === void 0 ? null : k
        };
        {
          var R;
          Object.defineProperty(j, "displayName", {
            enumerable: !1,
            configurable: !0,
            get: function() {
              return R;
            },
            set: function(V) {
              R = V, !f.name && !f.displayName && (f.displayName = V);
            }
          });
        }
        return j;
      }
      function et() {
        var f = S.current;
        return f === null && M(`Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.`), f;
      }
      function uh(f) {
        var k = et();
        if (f._context !== void 0) {
          var j = f._context;
          j.Consumer === f ? M("Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be removed in a future major release. Did you mean to call useContext(Context) instead?") : j.Provider === f && M("Calling useContext(Context.Provider) is not supported. Did you mean to call useContext(Context) instead?");
        }
        return k.useContext(f);
      }
      function fh(f) {
        var k = et();
        return k.useState(f);
      }
      function dh(f, k, j) {
        var R = et();
        return R.useReducer(f, k, j);
      }
      function ph(f) {
        var k = et();
        return k.useRef(f);
      }
      function mh(f, k) {
        var j = et();
        return j.useEffect(f, k);
      }
      function gh(f, k) {
        var j = et();
        return j.useInsertionEffect(f, k);
      }
      function hh(f, k) {
        var j = et();
        return j.useLayoutEffect(f, k);
      }
      function yh(f, k) {
        var j = et();
        return j.useCallback(f, k);
      }
      function bh(f, k) {
        var j = et();
        return j.useMemo(f, k);
      }
      function vh(f, k, j) {
        var R = et();
        return R.useImperativeHandle(f, k, j);
      }
      function xh(f, k) {
        {
          var j = et();
          return j.useDebugValue(f, k);
        }
      }
      function wh() {
        var f = et();
        return f.useTransition();
      }
      function Eh(f) {
        var k = et();
        return k.useDeferredValue(f);
      }
      function kh() {
        var f = et();
        return f.useId();
      }
      function Ph(f, k, j) {
        var R = et();
        return R.useSyncExternalStore(f, k, j);
      }
      var gr = 0, lc, cc, uc, fc, dc, pc, mc;
      function gc() {
      }
      gc.__reactDisabledLog = !0;
      function Oh() {
        {
          if (gr === 0) {
            lc = console.log, cc = console.info, uc = console.warn, fc = console.error, dc = console.group, pc = console.groupCollapsed, mc = console.groupEnd;
            var f = {
              configurable: !0,
              enumerable: !0,
              value: gc,
              writable: !0
            };
            Object.defineProperties(console, {
              info: f,
              log: f,
              warn: f,
              error: f,
              group: f,
              groupCollapsed: f,
              groupEnd: f
            });
          }
          gr++;
        }
      }
      function Sh() {
        {
          if (gr--, gr === 0) {
            var f = {
              configurable: !0,
              enumerable: !0,
              writable: !0
            };
            Object.defineProperties(console, {
              log: E({}, f, {
                value: lc
              }),
              info: E({}, f, {
                value: cc
              }),
              warn: E({}, f, {
                value: uc
              }),
              error: E({}, f, {
                value: fc
              }),
              group: E({}, f, {
                value: dc
              }),
              groupCollapsed: E({}, f, {
                value: pc
              }),
              groupEnd: E({}, f, {
                value: mc
              })
            });
          }
          gr < 0 && M("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
        }
      }
      var Io = J.ReactCurrentDispatcher, jo;
      function oa(f, k, j) {
        {
          if (jo === void 0)
            try {
              throw Error();
            } catch (V) {
              var R = V.stack.trim().match(/\n( *(at )?)/);
              jo = R && R[1] || "";
            }
          return `
` + jo + f;
        }
      }
      var Mo = !1, ia;
      {
        var Ah = typeof WeakMap == "function" ? WeakMap : Map;
        ia = new Ah();
      }
      function hc(f, k) {
        if (!f || Mo)
          return "";
        {
          var j = ia.get(f);
          if (j !== void 0)
            return j;
        }
        var R;
        Mo = !0;
        var V = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        var fe;
        fe = Io.current, Io.current = null, Oh();
        try {
          if (k) {
            var ee = function() {
              throw Error();
            };
            if (Object.defineProperty(ee.prototype, "props", {
              set: function() {
                throw Error();
              }
            }), typeof Reflect == "object" && Reflect.construct) {
              try {
                Reflect.construct(ee, []);
              } catch (Ve) {
                R = Ve;
              }
              Reflect.construct(f, [], ee);
            } else {
              try {
                ee.call();
              } catch (Ve) {
                R = Ve;
              }
              f.call(ee.prototype);
            }
          } else {
            try {
              throw Error();
            } catch (Ve) {
              R = Ve;
            }
            f();
          }
        } catch (Ve) {
          if (Ve && R && typeof Ve.stack == "string") {
            for (var de = Ve.stack.split(`
`), we = R.stack.split(`
`), _e = de.length - 1, Fe = we.length - 1; _e >= 1 && Fe >= 0 && de[_e] !== we[Fe]; )
              Fe--;
            for (; _e >= 1 && Fe >= 0; _e--, Fe--)
              if (de[_e] !== we[Fe]) {
                if (_e !== 1 || Fe !== 1)
                  do
                    if (_e--, Fe--, Fe < 0 || de[_e] !== we[Fe]) {
                      var Re = `
` + de[_e].replace(" at new ", " at ");
                      return f.displayName && Re.includes("<anonymous>") && (Re = Re.replace("<anonymous>", f.displayName)), typeof f == "function" && ia.set(f, Re), Re;
                    }
                  while (_e >= 1 && Fe >= 0);
                break;
              }
          }
        } finally {
          Mo = !1, Io.current = fe, Sh(), Error.prepareStackTrace = V;
        }
        var De = f ? f.displayName || f.name : "", He = De ? oa(De) : "";
        return typeof f == "function" && ia.set(f, He), He;
      }
      function Ch(f, k, j) {
        return hc(f, !1);
      }
      function _h(f) {
        var k = f.prototype;
        return !!(k && k.isReactComponent);
      }
      function sa(f, k, j) {
        if (f == null)
          return "";
        if (typeof f == "function")
          return hc(f, _h(f));
        if (typeof f == "string")
          return oa(f);
        switch (f) {
          case p:
            return oa("Suspense");
          case m:
            return oa("SuspenseList");
        }
        if (typeof f == "object")
          switch (f.$$typeof) {
            case u:
              return Ch(f.render);
            case b:
              return sa(f.type, k, j);
            case x: {
              var R = f, V = R._payload, fe = R._init;
              try {
                return sa(fe(V), k, j);
              } catch {
              }
            }
          }
        return "";
      }
      var yc = {}, bc = J.ReactDebugCurrentFrame;
      function la(f) {
        if (f) {
          var k = f._owner, j = sa(f.type, f._source, k ? k.type : null);
          bc.setExtraStackFrame(j);
        } else
          bc.setExtraStackFrame(null);
      }
      function Th(f, k, j, R, V) {
        {
          var fe = Function.call.bind(pr);
          for (var ee in f)
            if (fe(f, ee)) {
              var de = void 0;
              try {
                if (typeof f[ee] != "function") {
                  var we = Error((R || "React class") + ": " + j + " type `" + ee + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof f[ee] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                  throw we.name = "Invariant Violation", we;
                }
                de = f[ee](k, ee, R, j, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
              } catch (_e) {
                de = _e;
              }
              de && !(de instanceof Error) && (la(V), M("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", R || "React class", j, ee, typeof de), la(null)), de instanceof Error && !(de.message in yc) && (yc[de.message] = !0, la(V), M("Failed %s type: %s", j, de.message), la(null));
            }
        }
      }
      function zn(f) {
        if (f) {
          var k = f._owner, j = sa(f.type, f._source, k ? k.type : null);
          X(j);
        } else
          X(null);
      }
      var Fo;
      Fo = !1;
      function vc() {
        if (G.current) {
          var f = Ut(G.current.type);
          if (f)
            return `

Check the render method of \`` + f + "`.";
        }
        return "";
      }
      function Nh(f) {
        if (f !== void 0) {
          var k = f.fileName.replace(/^.*[\\\/]/, ""), j = f.lineNumber;
          return `

Check your code at ` + k + ":" + j + ".";
        }
        return "";
      }
      function Ih(f) {
        return f != null ? Nh(f.__source) : "";
      }
      var xc = {};
      function jh(f) {
        var k = vc();
        if (!k) {
          var j = typeof f == "string" ? f : f.displayName || f.name;
          j && (k = `

Check the top-level render call using <` + j + ">.");
        }
        return k;
      }
      function wc(f, k) {
        if (!(!f._store || f._store.validated || f.key != null)) {
          f._store.validated = !0;
          var j = jh(k);
          if (!xc[j]) {
            xc[j] = !0;
            var R = "";
            f && f._owner && f._owner !== G.current && (R = " It was passed a child from " + Ut(f._owner.type) + "."), zn(f), M('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', j, R), zn(null);
          }
        }
      }
      function Ec(f, k) {
        if (typeof f == "object") {
          if (Ee(f))
            for (var j = 0; j < f.length; j++) {
              var R = f[j];
              Dn(R) && wc(R, k);
            }
          else if (Dn(f))
            f._store && (f._store.validated = !0);
          else if (f) {
            var V = P(f);
            if (typeof V == "function" && V !== f.entries)
              for (var fe = V.call(f), ee; !(ee = fe.next()).done; )
                Dn(ee.value) && wc(ee.value, k);
          }
        }
      }
      function kc(f) {
        {
          var k = f.type;
          if (k == null || typeof k == "string")
            return;
          var j;
          if (typeof k == "function")
            j = k.propTypes;
          else if (typeof k == "object" && (k.$$typeof === u || // Note: Memo only checks outer props here.
          // Inner props are checked in the reconciler.
          k.$$typeof === b))
            j = k.propTypes;
          else
            return;
          if (j) {
            var R = Ut(k);
            Th(j, f.props, "prop", R, f);
          } else if (k.PropTypes !== void 0 && !Fo) {
            Fo = !0;
            var V = Ut(k);
            M("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", V || "Unknown");
          }
          typeof k.getDefaultProps == "function" && !k.getDefaultProps.isReactClassApproved && M("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
        }
      }
      function Mh(f) {
        {
          for (var k = Object.keys(f.props), j = 0; j < k.length; j++) {
            var R = k[j];
            if (R !== "children" && R !== "key") {
              zn(f), M("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", R), zn(null);
              break;
            }
          }
          f.ref !== null && (zn(f), M("Invalid attribute `ref` supplied to `React.Fragment`."), zn(null));
        }
      }
      function Pc(f, k, j) {
        var R = sc(f);
        if (!R) {
          var V = "";
          (f === void 0 || typeof f == "object" && f !== null && Object.keys(f).length === 0) && (V += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
          var fe = Ih(k);
          fe ? V += fe : V += vc();
          var ee;
          f === null ? ee = "null" : Ee(f) ? ee = "array" : f !== void 0 && f.$$typeof === r ? (ee = "<" + (Ut(f.type) || "Unknown") + " />", V = " Did you accidentally export a JSX literal instead of a component?") : ee = typeof f, M("React.createElement: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", ee, V);
        }
        var de = qg.apply(this, arguments);
        if (de == null)
          return de;
        if (R)
          for (var we = 2; we < arguments.length; we++)
            Ec(arguments[we], f);
        return f === o ? Mh(de) : kc(de), de;
      }
      var Oc = !1;
      function Fh(f) {
        var k = Pc.bind(null, f);
        return k.type = f, Oc || (Oc = !0, Y("React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.")), Object.defineProperty(k, "type", {
          enumerable: !1,
          get: function() {
            return Y("Factory.type is deprecated. Access the class directly before passing it to createFactory."), Object.defineProperty(this, "type", {
              value: f
            }), f;
          }
        }), k;
      }
      function Rh(f, k, j) {
        for (var R = Xg.apply(this, arguments), V = 2; V < arguments.length; V++)
          Ec(arguments[V], R.type);
        return kc(R), R;
      }
      function Lh(f, k) {
        var j = _.transition;
        _.transition = {};
        var R = _.transition;
        _.transition._updatedFibers = /* @__PURE__ */ new Set();
        try {
          f();
        } finally {
          if (_.transition = j, j === null && R._updatedFibers) {
            var V = R._updatedFibers.size;
            V > 10 && Y("Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."), R._updatedFibers.clear();
          }
        }
      }
      var Sc = !1, ca = null;
      function Dh(f) {
        if (ca === null)
          try {
            var k = ("require" + Math.random()).slice(0, 7), j = e && e[k];
            ca = j.call(e, "timers").setImmediate;
          } catch {
            ca = function(R) {
              Sc === !1 && (Sc = !0, typeof MessageChannel > "u" && M("This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."));
              var V = new MessageChannel();
              V.port1.onmessage = R, V.port2.postMessage(void 0);
            };
          }
        return ca(f);
      }
      var $n = 0, Ac = !1;
      function Cc(f) {
        {
          var k = $n;
          $n++, h.current === null && (h.current = []);
          var j = h.isBatchingLegacy, R;
          try {
            if (h.isBatchingLegacy = !0, R = f(), !j && h.didScheduleLegacyUpdate) {
              var V = h.current;
              V !== null && (h.didScheduleLegacyUpdate = !1, Do(V));
            }
          } catch (De) {
            throw ua(k), De;
          } finally {
            h.isBatchingLegacy = j;
          }
          if (R !== null && typeof R == "object" && typeof R.then == "function") {
            var fe = R, ee = !1, de = {
              then: function(De, He) {
                ee = !0, fe.then(function(Ve) {
                  ua(k), $n === 0 ? Ro(Ve, De, He) : De(Ve);
                }, function(Ve) {
                  ua(k), He(Ve);
                });
              }
            };
            return !Ac && typeof Promise < "u" && Promise.resolve().then(function() {
            }).then(function() {
              ee || (Ac = !0, M("You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"));
            }), de;
          } else {
            var we = R;
            if (ua(k), $n === 0) {
              var _e = h.current;
              _e !== null && (Do(_e), h.current = null);
              var Fe = {
                then: function(De, He) {
                  h.current === null ? (h.current = [], Ro(we, De, He)) : De(we);
                }
              };
              return Fe;
            } else {
              var Re = {
                then: function(De, He) {
                  De(we);
                }
              };
              return Re;
            }
          }
        }
      }
      function ua(f) {
        f !== $n - 1 && M("You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "), $n = f;
      }
      function Ro(f, k, j) {
        {
          var R = h.current;
          if (R !== null)
            try {
              Do(R), Dh(function() {
                R.length === 0 ? (h.current = null, k(f)) : Ro(f, k, j);
              });
            } catch (V) {
              j(V);
            }
          else
            k(f);
        }
      }
      var Lo = !1;
      function Do(f) {
        if (!Lo) {
          Lo = !0;
          var k = 0;
          try {
            for (; k < f.length; k++) {
              var j = f[k];
              do
                j = j(!0);
              while (j !== null);
            }
            f.length = 0;
          } catch (R) {
            throw f = f.slice(k + 1), R;
          } finally {
            Lo = !1;
          }
        }
      }
      var zh = Pc, $h = Rh, Hh = Fh, Wh = {
        map: aa,
        forEach: th,
        count: eh,
        toArray: nh,
        only: rh
      };
      t.Children = Wh, t.Component = C, t.Fragment = o, t.Profiler = s, t.PureComponent = L, t.StrictMode = i, t.Suspense = p, t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = J, t.act = Cc, t.cloneElement = $h, t.createContext = ah, t.createElement = zh, t.createFactory = Hh, t.createRef = ce, t.forwardRef = lh, t.isValidElement = Dn, t.lazy = sh, t.memo = ch, t.startTransition = Lh, t.unstable_act = Cc, t.useCallback = yh, t.useContext = uh, t.useDebugValue = xh, t.useDeferredValue = Eh, t.useEffect = mh, t.useId = kh, t.useImperativeHandle = vh, t.useInsertionEffect = gh, t.useLayoutEffect = hh, t.useMemo = bh, t.useReducer = dh, t.useRef = ph, t.useState = fh, t.useSyncExternalStore = Ph, t.useTransition = wh, t.version = n, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
    }();
  }(Sa, Sa.exports)), Sa.exports;
}
var xu;
function Cv() {
  return xu || (xu = 1, process.env.NODE_ENV === "production" ? Qo.exports = Sv() : Qo.exports = Av()), Qo.exports;
}
var _v = Cv();
const Tv = /* @__PURE__ */ Ov(_v), Nv = {
  [le.BlackForestLabs]: "/resources/images/services/blackforestlabs.svg",
  [le.Kling]: "/resources/images/services/kling.svg",
  [le.Midjourney]: "/resources/images/services/midjourney.svg",
  [le.OpenAi]: "/resources/images/services/openai.svg",
  [le.Bytedance]: "/resources/images/services/bytedance.svg",
  [le.Google]: "/resources/images/services/google.svg",
  [le.Recraft]: "/resources/images/services/recraft.svg",
  [le.Tencent]: "/resources/images/services/tencent.svg",
  [le.Krea]: "/resources/images/services/krea.svg",
  [le.Fal]: "/resources/images/services/fal.svg",
  [le.Replicate]: "/resources/images/services/replicate.svg",
  [le.TensorArt]: "/resources/images/services/tensorart.svg",
  [le.OpenArt]: "/resources/images/services/openart.svg",
  [le.Higgsfield]: "/resources/images/services/higgsfield.svg",
  [le.Alibaba]: "/resources/images/services/alibaba.svg",
  [le.Vidu]: "/resources/images/services/vidu.svg",
  [le.ArtCraft]: "/resources/images/services/artcraft.svg"
}, Iv = "/resources/images/services/generic.svg", jv = (e) => Nv[e], Mv = (e, t = "h-4 w-4 invert") => {
  const n = jv(e) ?? Iv;
  return Tv.createElement("img", {
    src: n,
    alt: `${e} logo`,
    className: t
  });
};
le.BlackForestLabs, le.BlackForestLabs, le.BlackForestLabs, le.BlackForestLabs, le.OpenAi, le.Kling, le.Kling, le.Kling, le.Bytedance, le.Google, le.Recraft, le.Tencent, le.Midjourney, le.Midjourney, le.Midjourney, le.Midjourney, le.Midjourney, le.Midjourney, le.Midjourney;
var kt = /* @__PURE__ */ ((e) => (e.InstructiveEdit = "instructiveEdit", e.MaskedInpainting = "maskedInpainting", e.NonMaskedInpainting = "nonMaskedInpainting", e))(kt || {});
const tt = le, Fv = {
  maxGenerationCount: 1,
  defaultGenerationCount: 1
}, nt = (e) => ({
  label: e.label ?? e.info.name,
  description: e.description,
  badges: e.badges,
  capabilities: e.capabilities ?? Fv,
  tags: e.tags ?? [],
  ...e
});
//////////////////////////////
// Image models
//////////////////////////////
nt({
  id: "midjourney",
  category: "image",
  info: {
    name: "Midjourney",
    tauri_id: "midjourney",
    creator: tt.Midjourney
  },
  description: "Incredible style and quality",
  badges: [{ label: "15 sec." }],
  capabilities: { maxGenerationCount: 4, defaultGenerationCount: 4 }
}), nt({
  id: "flux_pro_1_1_ultra",
  category: "image",
  info: {
    name: "Flux Pro 1.1 Ultra",
    tauri_id: "flux_pro_11_ultra",
    creator: tt.BlackForestLabs
  },
  description: "High quality model",
  badges: [{ label: "15 sec." }],
  capabilities: { maxGenerationCount: 4, defaultGenerationCount: 4 }
}), nt({
  id: "flux_pro_1_1",
  category: "image",
  info: {
    name: "Flux Pro 1.1",
    tauri_id: "flux_pro_11",
    creator: tt.BlackForestLabs
  },
  description: "High quality model",
  badges: [{ label: "15 sec." }],
  capabilities: { maxGenerationCount: 4, defaultGenerationCount: 4 }
}), nt({
  id: "flux_1_dev",
  category: "image",
  info: {
    name: "Flux 1 Dev",
    tauri_id: "flux_1_dev",
    creator: tt.BlackForestLabs
  },
  description: "High quality model",
  badges: [{ label: "15 sec." }],
  capabilities: { maxGenerationCount: 4, defaultGenerationCount: 4 }
}), nt({
  id: "flux_1_schnell",
  category: "image",
  info: {
    name: "Flux 1 Schnell",
    tauri_id: "flux_1_schnell",
    creator: tt.BlackForestLabs
  },
  description: "High quality model",
  badges: [{ label: "15 sec." }],
  capabilities: { maxGenerationCount: 4, defaultGenerationCount: 4 }
}), nt({
  id: "gpt_image_1",
  category: "image",
  info: {
    name: "GPT Image 1 (GPT-4o)",
    tauri_id: "gpt_image_1",
    creator: tt.OpenAi
  },
  description: "Slow, ultra instructive model",
  badges: [{ label: "45 sec." }],
  capabilities: { maxGenerationCount: 1 },
  tags: ["instructiveEdit"]
}), nt({
  id: "flux_pro_kontext_max",
  category: "image",
  info: {
    name: "Flux Pro Kontext Max",
    tauri_id: "flux_pro_kontext_max",
    creator: tt.BlackForestLabs
  },
  description: "Fast and high-quality model",
  badges: [{ label: "20 sec." }],
  capabilities: {
    maxGenerationCount: 4
  },
  tags: [kt.InstructiveEdit, kt.NonMaskedInpainting]
}), nt({
  id: "flux_pro_inpaint",
  category: "image",
  info: {
    name: "Flux Pro 1 (Inpainting)",
    tauri_id: "flux_pro_1",
    creator: tt.BlackForestLabs
  },
  description: "Fast and high-quality model",
  badges: [{ label: "20 sec." }],
  capabilities: {
    maxGenerationCount: 1
    // NB: For some reason Fal only supports ONE image!
  },
  tags: [kt.MaskedInpainting]
}), nt({
  id: "flux_dev_juggernaut_inpaint",
  category: "image",
  info: {
    name: "Flux Dev Juggernaut (Inpainting)",
    tauri_id: "flux_dev_juggernaut",
    creator: tt.BlackForestLabs
  },
  description: "Fast and high-quality model",
  badges: [{ label: "20 sec." }],
  capabilities: {
    maxGenerationCount: 4
  },
  tags: [kt.MaskedInpainting]
}), //////////////////////////////
// Video models
//////////////////////////////
nt({
  id: "kling_1_6_pro",
  category: "video",
  info: {
    name: "Kling 1.6 Pro",
    tauri_id: "kling_1.6_pro",
    creator: tt.Kling
  },
  description: "Good quality model",
  badges: [{ label: "2 min." }],
  capabilities: { maxGenerationCount: 1 }
}), nt({
  id: "kling_2_1_pro",
  category: "video",
  info: {
    name: "Kling 2.1 Pro",
    tauri_id: "kling_2.1_pro",
    creator: tt.Kling
  },
  description: "High quality model",
  badges: [{ label: "2 min." }],
  capabilities: { maxGenerationCount: 1 }
}), nt({
  id: "kling_2_1_master",
  category: "video",
  info: {
    name: "Kling 2.1 Master",
    tauri_id: "kling_2.1_master",
    creator: tt.Kling
  },
  description: "Master quality model ($$)",
  badges: [{ label: "2 min." }],
  capabilities: { maxGenerationCount: 1 }
}), nt({
  id: "seedance_1_0_lite",
  category: "video",
  info: {
    name: "Seedance 1.0 Lite",
    tauri_id: "seedance_1.0_lite",
    creator: tt.Bytedance
  },
  description: "Fast and high-quality model",
  badges: [{ label: "2 min." }],
  capabilities: { maxGenerationCount: 1 }
}), nt({
  id: "veo_2",
  category: "video",
  info: { name: "Google Veo 2", tauri_id: "veo_2", creator: tt.Google },
  description: "Fast and high-quality model",
  badges: [{ label: "2 min." }],
  capabilities: { maxGenerationCount: 1 }
});
const Rn = [
  new yt({
    id: "midjourney",
    tauriId: "midjourney",
    fullName: "Midjourney",
    category: "image",
    creator: le.Midjourney,
    selectorName: "Midjourney",
    selectorDescription: "Incredible style and quality",
    selectorBadges: ["15 sec."],
    maxGenerationCount: 4,
    defaultGenerationCount: 4,
    canUseImagePrompt: !1,
    maxImagePromptCount: 6
  }),
  new yt({
    id: "flux_pro_1_1_ultra",
    tauriId: "flux_pro_11_ultra",
    fullName: "Flux Pro 1.1 Ultra",
    category: "image",
    creator: le.BlackForestLabs,
    selectorName: "Flux Pro 1.1 Ultra",
    selectorDescription: "High quality model",
    selectorBadges: ["15 sec."],
    maxGenerationCount: 4,
    defaultGenerationCount: 4,
    canUseImagePrompt: !0,
    maxImagePromptCount: 6
  }),
  new yt({
    id: "flux_pro_1_1",
    tauriId: "flux_pro_11",
    fullName: "Flux Pro 1.1",
    category: "image",
    creator: le.BlackForestLabs,
    selectorName: "Flux Pro 1.1",
    selectorDescription: "High quality model",
    selectorBadges: ["15 sec."],
    maxGenerationCount: 4,
    defaultGenerationCount: 4,
    canUseImagePrompt: !0,
    maxImagePromptCount: 6
  }),
  new yt({
    id: "flux_1_dev",
    tauriId: "flux_1_dev",
    fullName: "Flux 1 Dev",
    category: "image",
    creator: le.BlackForestLabs,
    selectorName: "Flux 1 Dev",
    selectorDescription: "High quality model",
    selectorBadges: ["15 sec."],
    maxGenerationCount: 4,
    defaultGenerationCount: 4,
    canUseImagePrompt: !0,
    maxImagePromptCount: 6
  }),
  new yt({
    id: "flux_1_schnell",
    tauriId: "flux_1_schnell",
    fullName: "Flux 1 Schnell",
    category: "image",
    creator: le.BlackForestLabs,
    selectorName: "Flux 1 Schnell",
    selectorDescription: "High quality model",
    selectorBadges: ["15 sec."],
    maxGenerationCount: 4,
    defaultGenerationCount: 4,
    canUseImagePrompt: !0,
    maxImagePromptCount: 6
  }),
  new yt({
    id: "gemini_25_flash",
    tauriId: "gemini_25_flash",
    fullName: "Gemini 2.5 Flash",
    category: "image",
    creator: le.Google,
    selectorName: "Gemini 2.5 Flash",
    selectorDescription: "Ultra instructive model",
    selectorBadges: ["35 sec."],
    maxGenerationCount: 4,
    defaultGenerationCount: 1,
    canEditImages: !0,
    canUseImagePrompt: !0,
    maxImagePromptCount: 6,
    tags: [kt.InstructiveEdit]
  }),
  new yt({
    id: "gpt_image_1",
    tauriId: "gpt_image_1",
    fullName: "GPT Image 1 (GPT-4o)",
    category: "image",
    creator: le.OpenAi,
    selectorName: "GPT Image 1 (GPT-4o)",
    selectorDescription: "Slow, ultra instructive model",
    selectorBadges: ["45 sec."],
    maxGenerationCount: 1,
    defaultGenerationCount: 1,
    tags: [kt.InstructiveEdit],
    canEditImages: !0,
    canUseImagePrompt: !0,
    maxImagePromptCount: 6
  }),
  new yt({
    id: "flux_pro_kontext_max",
    tauriId: "flux_pro_kontext_max",
    fullName: "Flux Pro Kontext Max",
    category: "image",
    creator: le.BlackForestLabs,
    selectorName: "Flux Pro Kontext Max",
    selectorDescription: "Fast instructive editing",
    selectorBadges: ["20 sec."],
    maxGenerationCount: 4,
    defaultGenerationCount: 4,
    canEditImages: !0,
    tags: [kt.InstructiveEdit]
  }),
  new yt({
    id: "flux_pro_inpaint",
    tauriId: "flux_pro_1",
    fullName: "Flux Pro Inpaint",
    category: "image",
    creator: le.BlackForestLabs,
    selectorName: "Flux Pro",
    selectorDescription: "Fast inpainting",
    selectorBadges: ["30 sec."],
    maxGenerationCount: 1,
    // NB: Fal only allows one image for some reason!
    defaultGenerationCount: 1,
    // NB: Fal only allows one image for some reason!
    canEditImages: !0,
    usesInpaintingMask: !0
  }),
  new yt({
    id: "flux_dev_juggernaut_inpaint",
    tauriId: "flux_dev_juggernaut",
    fullName: "Flux Dev Juggernaut Inpaint",
    category: "image",
    creator: le.BlackForestLabs,
    selectorName: "Flux Dev Juggernaut",
    selectorDescription: "Fast inpainting",
    selectorBadges: ["15 sec."],
    maxGenerationCount: 4,
    defaultGenerationCount: 4,
    canEditImages: !0,
    usesInpaintingMask: !0
  })
], no = new Map(
  Rn.map((e) => [e.id, e])
);
if (no.size !== Rn.length)
  throw new Error("All image models must have unique IDs");
const ip = [
  new hr({
    id: "kling_1_6_pro",
    tauriId: "kling_1.6_pro",
    fullName: "Kling 1.6 Pro",
    category: "video",
    creator: le.Kling,
    selectorName: "Kling 1.6 Pro",
    selectorDescription: "Fast video model",
    selectorBadges: ["2 min."],
    startFrame: !0,
    endFrame: !0
  }),
  new hr({
    id: "kling_2_1_pro",
    tauriId: "kling_2.1_pro",
    fullName: "Kling 2.1 Pro",
    category: "video",
    creator: le.Kling,
    selectorName: "Kling 2.1 Pro",
    selectorDescription: "Fast video model",
    selectorBadges: ["2 min."],
    startFrame: !0,
    endFrame: !0
  }),
  new hr({
    id: "kling_2_1_master",
    tauriId: "kling_2.1_master",
    fullName: "Kling 2.1 Master",
    category: "video",
    creator: le.Kling,
    selectorName: "Kling 2.1 Master",
    selectorDescription: "Fast video model",
    selectorBadges: ["2 min."],
    startFrame: !0,
    endFrame: !1
  }),
  new hr({
    id: "seedance_1_0_lite",
    tauriId: "seedance_1.0_lite",
    fullName: "Seedance 1.0 Lite",
    category: "video",
    creator: le.Bytedance,
    selectorName: "Seedance 1.0 Lite",
    selectorDescription: "Fast video model",
    selectorBadges: ["2 min."],
    startFrame: !0,
    endFrame: !1
  }),
  new hr({
    id: "veo_2",
    tauriId: "veo_2",
    fullName: "Google Veo 2",
    category: "video",
    creator: le.Google,
    selectorName: "Google Veo 2",
    selectorDescription: "Fast video model",
    selectorBadges: ["2 min."],
    startFrame: !0,
    endFrame: !1
  })
], sp = [...Rn, ...ip], Rv = new Map(
  sp.map((e) => [e.id, e])
);
if (Rv.size !== sp.length)
  throw new Error("All models must have unique IDs");
const Lv = (e, t) => e || t, Vr = (e, t) => e.map((n) => {
  var r;
  return {
    label: n.selectorName,
    icon: Lv(Mv(n.creator), t),
    description: n.selectorDescription,
    badges: (r = n.toLegacyBadges()) == null ? void 0 : r.map((a) => ({
      label: a.label,
      icon: /* @__PURE__ */ se(gn, { icon: Qh })
    })),
    modelConfig: n.toLegacyModelConfig(),
    // Access to full object.
    model: n
  };
}), cS = Vr(
  function() {
    const e = /* @__PURE__ */ new Set();
    return e.add(no.get("flux_pro_1_1")), Rn.filter((t) => !t.usesInpaintingMask).filter((t) => t.id !== "flux_pro_kontext_max").forEach((t) => e.add(t)), Array.from(e);
  }(),
  /* @__PURE__ */ se(gn, { icon: Xa, className: "h-4 w-4" })
), uS = Vr(
  function() {
    const e = /* @__PURE__ */ new Set();
    return e.add(no.get("gpt_image_1")), Rn.filter((t) => {
      var n;
      return (n = t.tags) == null ? void 0 : n.includes(kt.InstructiveEdit);
    }).forEach((t) => e.add(t)), Array.from(e);
  }(),
  /* @__PURE__ */ se(gn, { icon: Xa, className: "h-4 w-4" })
), fS = Vr(
  function() {
    const e = /* @__PURE__ */ new Set();
    return e.add(no.get("gpt_image_1")), Rn.filter((t) => {
      var n;
      return (n = t.tags) == null ? void 0 : n.includes(kt.InstructiveEdit);
    }).forEach((t) => e.add(t)), Array.from(e);
  }(),
  /* @__PURE__ */ se(gn, { icon: Xa, className: "h-4 w-4" })
), dS = Vr(
  //[
  //  ALL_MODELS_BY_ID.get("flux_pro_inpaint")!,
  //  ALL_MODELS_BY_ID.get("flux_dev_juggernaut_inpaint")!,
  //  ALL_MODELS_BY_ID.get("flux_pro_kontext_max")!,
  //],
  function() {
    const e = /* @__PURE__ */ new Set();
    return Rn.filter((t) => t.canEditImages).forEach((t) => e.add(t)), Array.from(e);
  }(),
  /* @__PURE__ */ se(gn, { icon: Xa, className: "h-4 w-4" })
), pS = Vr(
  ip,
  /* @__PURE__ */ se(gn, { icon: Zh, className: "h-4 w-4" })
);
var Dv = /* @__PURE__ */ ((e) => (e.TextToImage = "text-to-image", e.ImageToVideo = "image-to-video", e.Canvas2D = "canvas-2d", e.Stage3D = "stage-3d", e.ImageEditor = "image-editor", e))(Dv || {});
const lp = typeof document < "u" ? ue.useLayoutEffect : () => {
};
function zv(e) {
  const t = xe(null);
  return lp(() => {
    t.current = e;
  }, [
    e
  ]), Be((...n) => {
    const r = t.current;
    return r == null ? void 0 : r(...n);
  }, []);
}
const hn = (e) => {
  var t;
  return (t = e == null ? void 0 : e.ownerDocument) !== null && t !== void 0 ? t : document;
}, xn = (e) => e && "window" in e && e.window === e ? e : hn(e).defaultView || window;
function cp(e, t) {
  return t && e ? e.contains(t) : !1;
}
const es = (e = document) => e.activeElement;
function up(e) {
  return e.target;
}
function $v(e) {
  var t;
  return typeof window > "u" || window.navigator == null ? !1 : ((t = window.navigator.userAgentData) === null || t === void 0 ? void 0 : t.brands.some((n) => e.test(n.brand))) || e.test(window.navigator.userAgent);
}
function Hv(e) {
  var t;
  return typeof window < "u" && window.navigator != null ? e.test(((t = window.navigator.userAgentData) === null || t === void 0 ? void 0 : t.platform) || window.navigator.platform) : !1;
}
function fp(e) {
  let t = null;
  return () => (t == null && (t = e()), t);
}
const Wv = fp(function() {
  return Hv(/^Mac/i);
}), Bv = fp(function() {
  return $v(/Android/i);
});
function dp() {
  let e = xe(/* @__PURE__ */ new Map()), t = Be((a, o, i, s) => {
    let l = s != null && s.once ? (...c) => {
      e.current.delete(i), i(...c);
    } : i;
    e.current.set(i, {
      type: o,
      eventTarget: a,
      fn: l,
      options: s
    }), a.addEventListener(o, l, s);
  }, []), n = Be((a, o, i, s) => {
    var l;
    let c = ((l = e.current.get(i)) === null || l === void 0 ? void 0 : l.fn) || i;
    a.removeEventListener(o, c, s), e.current.delete(i);
  }, []), r = Be(() => {
    e.current.forEach((a, o) => {
      n(a.eventTarget, a.type, o, a.options);
    });
  }, [
    n
  ]);
  return Le(() => r, [
    r
  ]), {
    addGlobalListener: t,
    removeGlobalListener: n,
    removeAllGlobalListeners: r
  };
}
function Gv(e) {
  return e.mozInputSource === 0 && e.isTrusted ? !0 : Bv() && e.pointerType ? e.type === "click" && e.buttons === 1 : e.detail === 0 && !e.pointerType;
}
class pp {
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
function mp(e) {
  let t = xe({
    isFocused: !1,
    observer: null
  });
  lp(() => {
    const r = t.current;
    return () => {
      r.observer && (r.observer.disconnect(), r.observer = null);
    };
  }, []);
  let n = zv((r) => {
    e == null || e(r);
  });
  return Be((r) => {
    if (r.target instanceof HTMLButtonElement || r.target instanceof HTMLInputElement || r.target instanceof HTMLTextAreaElement || r.target instanceof HTMLSelectElement) {
      t.current.isFocused = !0;
      let a = r.target, o = (i) => {
        t.current.isFocused = !1, a.disabled && n(new pp("blur", i)), t.current.observer && (t.current.observer.disconnect(), t.current.observer = null);
      };
      a.addEventListener("focusout", o, {
        once: !0
      }), t.current.observer = new MutationObserver(() => {
        if (t.current.isFocused && a.disabled) {
          var i;
          (i = t.current.observer) === null || i === void 0 || i.disconnect();
          let s = a === document.activeElement ? null : document.activeElement;
          a.dispatchEvent(new FocusEvent("blur", {
            relatedTarget: s
          })), a.dispatchEvent(new FocusEvent("focusout", {
            bubbles: !0,
            relatedTarget: s
          }));
        }
      }), t.current.observer.observe(a, {
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
let Yv = !1, Ur = null, ts = /* @__PURE__ */ new Set(), Ar = /* @__PURE__ */ new Map(), Cn = !1, ns = !1;
const Vv = {
  Tab: !0,
  Escape: !0
};
function cl(e, t) {
  for (let n of ts) n(e, t);
}
function Uv(e) {
  return !(e.metaKey || !Wv() && e.altKey || e.ctrlKey || e.key === "Control" || e.key === "Shift" || e.key === "Meta");
}
function La(e) {
  Cn = !0, Uv(e) && (Ur = "keyboard", cl("keyboard", e));
}
function ft(e) {
  Ur = "pointer", (e.type === "mousedown" || e.type === "pointerdown") && (Cn = !0, cl("pointer", e));
}
function gp(e) {
  Gv(e) && (Cn = !0, Ur = "virtual");
}
function hp(e) {
  e.target === window || e.target === document || Yv || !e.isTrusted || (!Cn && !ns && (Ur = "virtual", cl("virtual", e)), Cn = !1, ns = !1);
}
function yp() {
  Cn = !1, ns = !0;
}
function rs(e) {
  if (typeof window > "u" || Ar.get(xn(e))) return;
  const t = xn(e), n = hn(e);
  let r = t.HTMLElement.prototype.focus;
  t.HTMLElement.prototype.focus = function() {
    Cn = !0, r.apply(this, arguments);
  }, n.addEventListener("keydown", La, !0), n.addEventListener("keyup", La, !0), n.addEventListener("click", gp, !0), t.addEventListener("focus", hp, !0), t.addEventListener("blur", yp, !1), typeof PointerEvent < "u" ? (n.addEventListener("pointerdown", ft, !0), n.addEventListener("pointermove", ft, !0), n.addEventListener("pointerup", ft, !0)) : (n.addEventListener("mousedown", ft, !0), n.addEventListener("mousemove", ft, !0), n.addEventListener("mouseup", ft, !0)), t.addEventListener("beforeunload", () => {
    bp(e);
  }, {
    once: !0
  }), Ar.set(t, {
    focus: r
  });
}
const bp = (e, t) => {
  const n = xn(e), r = hn(e);
  t && r.removeEventListener("DOMContentLoaded", t), Ar.has(n) && (n.HTMLElement.prototype.focus = Ar.get(n).focus, r.removeEventListener("keydown", La, !0), r.removeEventListener("keyup", La, !0), r.removeEventListener("click", gp, !0), n.removeEventListener("focus", hp, !0), n.removeEventListener("blur", yp, !1), typeof PointerEvent < "u" ? (r.removeEventListener("pointerdown", ft, !0), r.removeEventListener("pointermove", ft, !0), r.removeEventListener("pointerup", ft, !0)) : (r.removeEventListener("mousedown", ft, !0), r.removeEventListener("mousemove", ft, !0), r.removeEventListener("mouseup", ft, !0)), Ar.delete(n));
};
function qv(e) {
  const t = hn(e);
  let n;
  return t.readyState !== "loading" ? rs(e) : (n = () => {
    rs(e);
  }, t.addEventListener("DOMContentLoaded", n)), () => bp(e, n);
}
typeof document < "u" && qv();
function vp() {
  return Ur !== "pointer";
}
const Kv = /* @__PURE__ */ new Set([
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
function Xv(e, t, n) {
  let r = hn(n == null ? void 0 : n.target);
  const a = typeof window < "u" ? xn(n == null ? void 0 : n.target).HTMLInputElement : HTMLInputElement, o = typeof window < "u" ? xn(n == null ? void 0 : n.target).HTMLTextAreaElement : HTMLTextAreaElement, i = typeof window < "u" ? xn(n == null ? void 0 : n.target).HTMLElement : HTMLElement, s = typeof window < "u" ? xn(n == null ? void 0 : n.target).KeyboardEvent : KeyboardEvent;
  return e = e || r.activeElement instanceof a && !Kv.has(r.activeElement.type) || r.activeElement instanceof o || r.activeElement instanceof i && r.activeElement.isContentEditable, !(e && t === "keyboard" && n instanceof s && !Vv[n.key]);
}
function Jv(e, t, n) {
  rs(), Le(() => {
    let r = (a, o) => {
      Xv(!!(n != null && n.isTextInput), a, o) && e(vp());
    };
    return ts.add(r), () => {
      ts.delete(r);
    };
  }, t);
}
function Zv(e) {
  let { isDisabled: t, onFocus: n, onBlur: r, onFocusChange: a } = e;
  const o = Be((l) => {
    if (l.target === l.currentTarget)
      return r && r(l), a && a(!1), !0;
  }, [
    r,
    a
  ]), i = mp(o), s = Be((l) => {
    const c = hn(l.target), u = c ? es(c) : es();
    l.target === l.currentTarget && u === up(l.nativeEvent) && (n && n(l), a && a(!0), i(l));
  }, [
    a,
    n,
    i
  ]);
  return {
    focusProps: {
      onFocus: !t && (n || a || r) ? s : void 0,
      onBlur: !t && (r || a) ? o : void 0
    }
  };
}
function Qv(e) {
  let { isDisabled: t, onBlurWithin: n, onFocusWithin: r, onFocusWithinChange: a } = e, o = xe({
    isFocusWithin: !1
  }), { addGlobalListener: i, removeAllGlobalListeners: s } = dp(), l = Be((p) => {
    p.currentTarget.contains(p.target) && o.current.isFocusWithin && !p.currentTarget.contains(p.relatedTarget) && (o.current.isFocusWithin = !1, s(), n && n(p), a && a(!1));
  }, [
    n,
    a,
    o,
    s
  ]), c = mp(l), u = Be((p) => {
    if (!p.currentTarget.contains(p.target)) return;
    const m = hn(p.target), b = es(m);
    if (!o.current.isFocusWithin && b === up(p.nativeEvent)) {
      r && r(p), a && a(!0), o.current.isFocusWithin = !0, c(p);
      let x = p.currentTarget;
      i(m, "focus", (v) => {
        if (o.current.isFocusWithin && !cp(x, v.target)) {
          let y = new pp("blur", new m.defaultView.FocusEvent("blur", {
            relatedTarget: v.target
          }));
          y.target = x, y.currentTarget = x, l(y);
        }
      }, {
        capture: !0
      });
    }
  }, [
    r,
    a,
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
let Da = !1, ei = 0;
function as() {
  Da = !0, setTimeout(() => {
    Da = !1;
  }, 50);
}
function wu(e) {
  e.pointerType === "touch" && as();
}
function e0() {
  if (!(typeof document > "u"))
    return typeof PointerEvent < "u" ? document.addEventListener("pointerup", wu) : document.addEventListener("touchend", as), ei++, () => {
      ei--, !(ei > 0) && (typeof PointerEvent < "u" ? document.removeEventListener("pointerup", wu) : document.removeEventListener("touchend", as));
    };
}
function t0(e) {
  let { onHoverStart: t, onHoverChange: n, onHoverEnd: r, isDisabled: a } = e, [o, i] = $e(!1), s = xe({
    isHovered: !1,
    ignoreEmulatedMouseEvents: !1,
    pointerType: "",
    target: null
  }).current;
  Le(e0, []);
  let { addGlobalListener: l, removeAllGlobalListeners: c } = dp(), { hoverProps: u, triggerHoverEnd: p } = ze(() => {
    let m = (v, y) => {
      if (s.pointerType = y, a || y === "touch" || s.isHovered || !v.currentTarget.contains(v.target)) return;
      s.isHovered = !0;
      let w = v.currentTarget;
      s.target = w, l(hn(v.target), "pointerover", (P) => {
        s.isHovered && s.target && !cp(s.target, P.target) && b(P, P.pointerType);
      }, {
        capture: !0
      }), t && t({
        type: "hoverstart",
        target: w,
        pointerType: y
      }), n && n(!0), i(!0);
    }, b = (v, y) => {
      let w = s.target;
      s.pointerType = "", s.target = null, !(y === "touch" || !s.isHovered || !w) && (s.isHovered = !1, c(), r && r({
        type: "hoverend",
        target: w,
        pointerType: y
      }), n && n(!1), i(!1));
    }, x = {};
    return typeof PointerEvent < "u" ? (x.onPointerEnter = (v) => {
      Da && v.pointerType === "mouse" || m(v, v.pointerType);
    }, x.onPointerLeave = (v) => {
      !a && v.currentTarget.contains(v.target) && b(v, v.pointerType);
    }) : (x.onTouchStart = () => {
      s.ignoreEmulatedMouseEvents = !0;
    }, x.onMouseEnter = (v) => {
      !s.ignoreEmulatedMouseEvents && !Da && m(v, "mouse"), s.ignoreEmulatedMouseEvents = !1;
    }, x.onMouseLeave = (v) => {
      !a && v.currentTarget.contains(v.target) && b(v, "mouse");
    }), {
      hoverProps: x,
      triggerHoverEnd: b
    };
  }, [
    t,
    n,
    r,
    a,
    s,
    l,
    c
  ]);
  return Le(() => {
    a && p({
      currentTarget: s.target
    }, s.pointerType);
  }, [
    a
  ]), {
    hoverProps: u,
    isHovered: o
  };
}
function n0(e = {}) {
  let { autoFocus: t = !1, isTextInput: n, within: r } = e, a = xe({
    isFocused: !1,
    isFocusVisible: t || vp()
  }), [o, i] = $e(!1), [s, l] = $e(() => a.current.isFocused && a.current.isFocusVisible), c = Be(() => l(a.current.isFocused && a.current.isFocusVisible), []), u = Be((b) => {
    a.current.isFocused = b, i(b), c();
  }, [
    c
  ]);
  Jv((b) => {
    a.current.isFocusVisible = b, c();
  }, [], {
    isTextInput: n
  });
  let { focusProps: p } = Zv({
    isDisabled: r,
    onFocusChange: u
  }), { focusWithinProps: m } = Qv({
    isDisabled: !r,
    onFocusWithinChange: u
  });
  return {
    isFocused: o,
    isFocusVisible: s,
    focusProps: r ? m : p
  };
}
var r0 = Object.defineProperty, a0 = (e, t, n) => t in e ? r0(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, ti = (e, t, n) => (a0(e, typeof t != "symbol" ? t + "" : t, n), n);
let o0 = class {
  constructor() {
    ti(this, "current", this.detect()), ti(this, "handoffState", "pending"), ti(this, "currentId", 0);
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
}, On = new o0();
function qr(e) {
  var t, n;
  return On.isServer ? null : e ? "ownerDocument" in e ? e.ownerDocument : "current" in e ? (n = (t = e.current) == null ? void 0 : t.ownerDocument) != null ? n : document : null : document;
}
function xp(e) {
  typeof queueMicrotask == "function" ? queueMicrotask(e) : Promise.resolve().then(e).catch((t) => setTimeout(() => {
    throw t;
  }));
}
function Ln() {
  let e = [], t = { addEventListener(n, r, a, o) {
    return n.addEventListener(r, a, o), t.add(() => n.removeEventListener(r, a, o));
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
    return xp(() => {
      r.current && n[0]();
    }), t.add(() => {
      r.current = !1;
    });
  }, style(n, r, a) {
    let o = n.style.getPropertyValue(r);
    return Object.assign(n.style, { [r]: a }), this.add(() => {
      Object.assign(n.style, { [r]: o });
    });
  }, group(n) {
    let r = Ln();
    return n(r), this.add(() => r.dispose());
  }, add(n) {
    return e.includes(n) || e.push(n), () => {
      let r = e.indexOf(n);
      if (r >= 0) for (let a of e.splice(r, 1)) a();
    };
  }, dispose() {
    for (let n of e.splice(0)) n();
  } };
  return t;
}
function ro() {
  let [e] = $e(Ln);
  return Le(() => () => e.dispose(), [e]), e;
}
let Ye = (e, t) => {
  On.isServer ? Le(e, t) : Xs(e, t);
};
function zt(e) {
  let t = xe(e);
  return Ye(() => {
    t.current = e;
  }, [e]), t;
}
let ve = function(e) {
  let t = zt(e);
  return ue.useCallback((...n) => t.current(...n), [t]);
};
function i0(e) {
  let t = e.width / 2, n = e.height / 2;
  return { top: e.clientY - n, right: e.clientX + t, bottom: e.clientY + n, left: e.clientX - t };
}
function s0(e, t) {
  return !(!e || !t || e.right < t.left || e.left > t.right || e.bottom < t.top || e.top > t.bottom);
}
function l0({ disabled: e = !1 } = {}) {
  let t = xe(null), [n, r] = $e(!1), a = ro(), o = ve(() => {
    t.current = null, r(!1), a.dispose();
  }), i = ve((s) => {
    if (a.dispose(), t.current === null) {
      t.current = s.currentTarget, r(!0);
      {
        let l = qr(s.currentTarget);
        a.addEventListener(l, "pointerup", o, !1), a.addEventListener(l, "pointermove", (c) => {
          if (t.current) {
            let u = i0(c);
            r(s0(u, t.current.getBoundingClientRect()));
          }
        }, !1), a.addEventListener(l, "pointercancel", o, !1);
      }
    }
  });
  return { pressed: n, pressProps: e ? {} : { onPointerDown: i, onPointerUp: o, onClick: o } };
}
function os(...e) {
  return Array.from(new Set(e.flatMap((t) => typeof t == "string" ? t.split(" ") : []))).filter(Boolean).join(" ");
}
function dt(e, t, ...n) {
  if (e in t) {
    let a = t[e];
    return typeof a == "function" ? a(...n) : a;
  }
  let r = new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map((a) => `"${a}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(r, dt), r;
}
var tr = ((e) => (e[e.None = 0] = "None", e[e.RenderStrategy = 1] = "RenderStrategy", e[e.Static = 2] = "Static", e))(tr || {}), nn = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(nn || {});
function gt() {
  let e = u0();
  return Be((t) => c0({ mergeRefs: e, ...t }), [e]);
}
function c0({ ourProps: e, theirProps: t, slot: n, defaultTag: r, features: a, visible: o = !0, name: i, mergeRefs: s }) {
  s = s ?? f0;
  let l = wp(t, e);
  if (o) return ha(l, n, r, i, s);
  let c = a ?? 0;
  if (c & 2) {
    let { static: u = !1, ...p } = l;
    if (u) return ha(p, n, r, i, s);
  }
  if (c & 1) {
    let { unmount: u = !0, ...p } = l;
    return dt(u ? 0 : 1, { 0() {
      return null;
    }, 1() {
      return ha({ ...p, hidden: !0, style: { display: "none" } }, n, r, i, s);
    } });
  }
  return ha(l, n, r, i, s);
}
function ha(e, t = {}, n, r, a) {
  let { as: o = n, children: i, refName: s = "ref", ...l } = ni(e, ["unmount", "static"]), c = e.ref !== void 0 ? { [s]: e.ref } : {}, u = typeof i == "function" ? i(t) : i;
  "className" in l && l.className && typeof l.className == "function" && (l.className = l.className(t)), l["aria-labelledby"] && l["aria-labelledby"] === l.id && (l["aria-labelledby"] = void 0);
  let p = {};
  if (t) {
    let m = !1, b = [];
    for (let [x, v] of Object.entries(t)) typeof v == "boolean" && (m = !0), v === !0 && b.push(x.replace(/([A-Z])/g, (y) => `-${y.toLowerCase()}`));
    if (m) {
      p["data-headlessui-state"] = b.join(" ");
      for (let x of b) p[`data-${x}`] = "";
    }
  }
  if (o === Rt && (Object.keys(bn(l)).length > 0 || Object.keys(bn(p)).length > 0)) if (!Uh(u) || Array.isArray(u) && u.length > 1) {
    if (Object.keys(bn(l)).length > 0) throw new Error(['Passing props on "Fragment"!', "", `The current component <${r} /> is rendering a "Fragment".`, "However we need to passthrough the following props:", Object.keys(bn(l)).concat(Object.keys(bn(p))).map((m) => `  - ${m}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".', "Render a single element as the child so that we can forward the props onto that element."].map((m) => `  - ${m}`).join(`
`)].join(`
`));
  } else {
    let m = u.props, b = m == null ? void 0 : m.className, x = typeof b == "function" ? (...w) => os(b(...w), l.className) : os(b, l.className), v = x ? { className: x } : {}, y = wp(u.props, bn(ni(l, ["ref"])));
    for (let w in p) w in y && delete p[w];
    return qh(u, Object.assign({}, y, p, c, { ref: a(d0(u), c.ref) }, v));
  }
  return Kh(o, Object.assign({}, ni(l, ["ref"]), o !== Rt && c, o !== Rt && p), u);
}
function u0() {
  let e = xe([]), t = Be((n) => {
    for (let r of e.current) r != null && (typeof r == "function" ? r(n) : r.current = n);
  }, []);
  return (...n) => {
    if (!n.every((r) => r == null)) return e.current = n, t;
  };
}
function f0(...e) {
  return e.every((t) => t == null) ? void 0 : (t) => {
    for (let n of e) n != null && (typeof n == "function" ? n(t) : n.current = t);
  };
}
function wp(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let t = {}, n = {};
  for (let r of e) for (let a in r) a.startsWith("on") && typeof r[a] == "function" ? (n[a] != null || (n[a] = []), n[a].push(r[a])) : t[a] = r[a];
  if (t.disabled || t["aria-disabled"]) for (let r in n) /^(on(?:Click|Pointer|Mouse|Key)(?:Down|Up|Press)?)$/.test(r) && (n[r] = [(a) => {
    var o;
    return (o = a == null ? void 0 : a.preventDefault) == null ? void 0 : o.call(a);
  }]);
  for (let r in n) Object.assign(t, { [r](a, ...o) {
    let i = n[r];
    for (let s of i) {
      if ((a instanceof Event || (a == null ? void 0 : a.nativeEvent) instanceof Event) && a.defaultPrevented) return;
      s(a, ...o);
    }
  } });
  return t;
}
function Ep(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let t = {}, n = {};
  for (let r of e) for (let a in r) a.startsWith("on") && typeof r[a] == "function" ? (n[a] != null || (n[a] = []), n[a].push(r[a])) : t[a] = r[a];
  for (let r in n) Object.assign(t, { [r](...a) {
    let o = n[r];
    for (let i of o) i == null || i(...a);
  } });
  return t;
}
function lt(e) {
  var t;
  return Object.assign(Vh(e), { displayName: (t = e.displayName) != null ? t : e.name });
}
function bn(e) {
  let t = Object.assign({}, e);
  for (let n in t) t[n] === void 0 && delete t[n];
  return t;
}
function ni(e, t = []) {
  let n = Object.assign({}, e);
  for (let r of t) r in n && delete n[r];
  return n;
}
function d0(e) {
  return ue.version.split(".")[0] >= "19" ? e.props.ref : e.ref;
}
let p0 = "span";
var Rr = ((e) => (e[e.None = 1] = "None", e[e.Focusable = 2] = "Focusable", e[e.Hidden = 4] = "Hidden", e))(Rr || {});
function m0(e, t) {
  var n;
  let { features: r = 1, ...a } = e, o = { ref: t, "aria-hidden": (r & 2) === 2 ? !0 : (n = a["aria-hidden"]) != null ? n : void 0, hidden: (r & 4) === 4 ? !0 : void 0, style: { position: "fixed", top: 1, left: 1, width: 1, height: 0, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: "0", ...(r & 4) === 4 && (r & 2) !== 2 && { display: "none" } } };
  return gt()({ ourProps: o, theirProps: a, slot: {}, defaultTag: p0, name: "Hidden" });
}
let za = lt(m0);
function kp(e) {
  let t = e.parentElement, n = null;
  for (; t && !(t instanceof HTMLFieldSetElement); ) t instanceof HTMLLegendElement && (n = t), t = t.parentElement;
  let r = (t == null ? void 0 : t.getAttribute("disabled")) === "";
  return r && g0(n) ? !1 : r;
}
function g0(e) {
  if (!e) return !1;
  let t = e.previousElementSibling;
  for (; t !== null; ) {
    if (t instanceof HTMLLegendElement) return !1;
    t = t.previousElementSibling;
  }
  return !0;
}
let Pp = Symbol();
function Op(e, t = !0) {
  return Object.assign(e, { [Pp]: t });
}
function pt(...e) {
  let t = xe(e);
  Le(() => {
    t.current = e;
  }, [e]);
  let n = ve((r) => {
    for (let a of t.current) a != null && (typeof a == "function" ? a(r) : a.current = r);
  });
  return e.every((r) => r == null || (r == null ? void 0 : r[Pp])) ? void 0 : n;
}
var tn = ((e) => (e.Space = " ", e.Enter = "Enter", e.Escape = "Escape", e.Backspace = "Backspace", e.Delete = "Delete", e.ArrowLeft = "ArrowLeft", e.ArrowUp = "ArrowUp", e.ArrowRight = "ArrowRight", e.ArrowDown = "ArrowDown", e.Home = "Home", e.End = "End", e.PageUp = "PageUp", e.PageDown = "PageDown", e.Tab = "Tab", e))(tn || {});
let h0 = at(() => {
});
function y0({ value: e, children: t }) {
  return ue.createElement(h0.Provider, { value: e }, t);
}
function b0(e) {
  if (e === null) return { width: 0, height: 0 };
  let { width: t, height: n } = e.getBoundingClientRect();
  return { width: t, height: n };
}
function v0(e, t = !1) {
  let [n, r] = xd(() => ({}), {}), a = ze(() => b0(e), [e, n]);
  return Ye(() => {
    if (!e) return;
    let o = new ResizeObserver(r);
    return o.observe(e), () => {
      o.disconnect();
    };
  }, [e]), t ? { width: `${a.width}px`, height: `${a.height}px` } : a;
}
let x0 = class extends Map {
  constructor(e) {
    super(), this.factory = e;
  }
  get(e) {
    let t = super.get(e);
    return t === void 0 && (t = this.factory(e), this.set(e, t)), t;
  }
};
function Sp(e, t) {
  let n = e(), r = /* @__PURE__ */ new Set();
  return { getSnapshot() {
    return n;
  }, subscribe(a) {
    return r.add(a), () => r.delete(a);
  }, dispatch(a, ...o) {
    let i = t[a].call(n, ...o);
    i && (n = i, r.forEach((s) => s()));
  } };
}
function Ap(e) {
  return Xh(e.subscribe, e.getSnapshot, e.getSnapshot);
}
let w0 = new x0(() => Sp(() => [], { ADD(e) {
  return this.includes(e) ? this : [...this, e];
}, REMOVE(e) {
  let t = this.indexOf(e);
  if (t === -1) return this;
  let n = this.slice();
  return n.splice(t, 1), n;
} }));
function Cp(e, t) {
  let n = w0.get(t), r = jr(), a = Ap(n);
  if (Ye(() => {
    if (e) return n.dispatch("ADD", r), () => n.dispatch("REMOVE", r);
  }, [n, e]), !e) return !1;
  let o = a.indexOf(r), i = a.length;
  return o === -1 && (o = i, i += 1), o === i - 1;
}
function E0(e, t, n) {
  let r = zt((a) => {
    let o = a.getBoundingClientRect();
    o.x === 0 && o.y === 0 && o.width === 0 && o.height === 0 && n();
  });
  Le(() => {
    if (!e) return;
    let a = t === null ? null : t instanceof HTMLElement ? t : t.current;
    if (!a) return;
    let o = Ln();
    if (typeof ResizeObserver < "u") {
      let i = new ResizeObserver(() => r.current(a));
      i.observe(a), o.add(() => i.disconnect());
    }
    if (typeof IntersectionObserver < "u") {
      let i = new IntersectionObserver(() => r.current(a));
      i.observe(a), o.add(() => i.disconnect());
    }
    return () => o.dispose();
  }, [t, r, e]);
}
let is = ["[contentEditable=true]", "[tabindex]", "a[href]", "area[href]", "button:not([disabled])", "iframe", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])"].map((e) => `${e}:not([tabindex='-1'])`).join(","), k0 = ["[data-autofocus]"].map((e) => `${e}:not([tabindex='-1'])`).join(",");
var Mt = ((e) => (e[e.First = 1] = "First", e[e.Previous = 2] = "Previous", e[e.Next = 4] = "Next", e[e.Last = 8] = "Last", e[e.WrapAround = 16] = "WrapAround", e[e.NoScroll = 32] = "NoScroll", e[e.AutoFocus = 64] = "AutoFocus", e))(Mt || {}), $a = ((e) => (e[e.Error = 0] = "Error", e[e.Overflow = 1] = "Overflow", e[e.Success = 2] = "Success", e[e.Underflow = 3] = "Underflow", e))($a || {}), P0 = ((e) => (e[e.Previous = -1] = "Previous", e[e.Next = 1] = "Next", e))(P0 || {});
function ao(e = document.body) {
  return e == null ? [] : Array.from(e.querySelectorAll(is)).sort((t, n) => Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (n.tabIndex || Number.MAX_SAFE_INTEGER)));
}
function O0(e = document.body) {
  return e == null ? [] : Array.from(e.querySelectorAll(k0)).sort((t, n) => Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (n.tabIndex || Number.MAX_SAFE_INTEGER)));
}
var ul = ((e) => (e[e.Strict = 0] = "Strict", e[e.Loose = 1] = "Loose", e))(ul || {});
function _p(e, t = 0) {
  var n;
  return e === ((n = qr(e)) == null ? void 0 : n.body) ? !1 : dt(t, { 0() {
    return e.matches(is);
  }, 1() {
    let r = e;
    for (; r !== null; ) {
      if (r.matches(is)) return !0;
      r = r.parentElement;
    }
    return !1;
  } });
}
var S0 = ((e) => (e[e.Keyboard = 0] = "Keyboard", e[e.Mouse = 1] = "Mouse", e))(S0 || {});
typeof window < "u" && typeof document < "u" && (document.addEventListener("keydown", (e) => {
  e.metaKey || e.altKey || e.ctrlKey || (document.documentElement.dataset.headlessuiFocusVisible = "");
}, !0), document.addEventListener("click", (e) => {
  e.detail === 1 ? delete document.documentElement.dataset.headlessuiFocusVisible : e.detail === 0 && (document.documentElement.dataset.headlessuiFocusVisible = "");
}, !0));
let A0 = ["textarea", "input"].join(",");
function C0(e) {
  var t, n;
  return (n = (t = e == null ? void 0 : e.matches) == null ? void 0 : t.call(e, A0)) != null ? n : !1;
}
function _0(e, t = (n) => n) {
  return e.slice().sort((n, r) => {
    let a = t(n), o = t(r);
    if (a === null || o === null) return 0;
    let i = a.compareDocumentPosition(o);
    return i & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : i & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
  });
}
function wn(e, t, { sorted: n = !0, relativeTo: r = null, skipElements: a = [] } = {}) {
  let o = Array.isArray(e) ? e.length > 0 ? e[0].ownerDocument : document : e.ownerDocument, i = Array.isArray(e) ? n ? _0(e) : e : t & 64 ? O0(e) : ao(e);
  a.length > 0 && i.length > 1 && (i = i.filter((b) => !a.some((x) => x != null && "current" in x ? (x == null ? void 0 : x.current) === b : x === b))), r = r ?? o.activeElement;
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
  })(), c = t & 32 ? { preventScroll: !0 } : {}, u = 0, p = i.length, m;
  do {
    if (u >= p || u + p <= 0) return 0;
    let b = l + u;
    if (t & 16) b = (b + p) % p;
    else {
      if (b < 0) return 3;
      if (b >= p) return 1;
    }
    m = i[b], m == null || m.focus(c), u += s;
  } while (m !== o.activeElement);
  return t & 6 && C0(m) && m.select(), 2;
}
function Tp() {
  return /iPhone/gi.test(window.navigator.platform) || /Mac/gi.test(window.navigator.platform) && window.navigator.maxTouchPoints > 0;
}
function T0() {
  return /Android/gi.test(window.navigator.userAgent);
}
function N0() {
  return Tp() || T0();
}
function yr(e, t, n, r) {
  let a = zt(n);
  Le(() => {
    if (!e) return;
    function o(i) {
      a.current(i);
    }
    return document.addEventListener(t, o, r), () => document.removeEventListener(t, o, r);
  }, [e, t, r]);
}
function Np(e, t, n, r) {
  let a = zt(n);
  Le(() => {
    if (!e) return;
    function o(i) {
      a.current(i);
    }
    return window.addEventListener(t, o, r), () => window.removeEventListener(t, o, r);
  }, [e, t, r]);
}
const Eu = 30;
function I0(e, t, n) {
  let r = Cp(e, "outside-click"), a = zt(n), o = Be(function(l, c) {
    if (l.defaultPrevented) return;
    let u = c(l);
    if (u === null || !u.getRootNode().contains(u) || !u.isConnected) return;
    let p = function m(b) {
      return typeof b == "function" ? m(b()) : Array.isArray(b) || b instanceof Set ? b : [b];
    }(t);
    for (let m of p) if (m !== null && (m.contains(u) || l.composed && l.composedPath().includes(m))) return;
    return !_p(u, ul.Loose) && u.tabIndex !== -1 && l.preventDefault(), a.current(l, u);
  }, [a, t]), i = xe(null);
  yr(r, "pointerdown", (l) => {
    var c, u;
    i.current = ((u = (c = l.composedPath) == null ? void 0 : c.call(l)) == null ? void 0 : u[0]) || l.target;
  }, !0), yr(r, "mousedown", (l) => {
    var c, u;
    i.current = ((u = (c = l.composedPath) == null ? void 0 : c.call(l)) == null ? void 0 : u[0]) || l.target;
  }, !0), yr(r, "click", (l) => {
    N0() || i.current && (o(l, () => i.current), i.current = null);
  }, !0);
  let s = xe({ x: 0, y: 0 });
  yr(r, "touchstart", (l) => {
    s.current.x = l.touches[0].clientX, s.current.y = l.touches[0].clientY;
  }, !0), yr(r, "touchend", (l) => {
    let c = { x: l.changedTouches[0].clientX, y: l.changedTouches[0].clientY };
    if (!(Math.abs(c.x - s.current.x) >= Eu || Math.abs(c.y - s.current.y) >= Eu)) return o(l, () => l.target instanceof HTMLElement ? l.target : null);
  }, !0), Np(r, "blur", (l) => o(l, () => window.document.activeElement instanceof HTMLIFrameElement ? window.document.activeElement : null), !0);
}
function nr(...e) {
  return ze(() => qr(...e), [...e]);
}
function j0(e, t, n, r) {
  let a = zt(n);
  Le(() => {
    e = e ?? window;
    function o(i) {
      a.current(i);
    }
    return e.addEventListener(t, o, r), () => e.removeEventListener(t, o, r);
  }, [e, t, r]);
}
function M0(e, t) {
  return ze(() => {
    var n;
    if (e.type) return e.type;
    let r = (n = e.as) != null ? n : "button";
    if (typeof r == "string" && r.toLowerCase() === "button" || (t == null ? void 0 : t.tagName) === "BUTTON" && !t.hasAttribute("type")) return "button";
  }, [e.type, e.as, t]);
}
function F0() {
  let e;
  return { before({ doc: t }) {
    var n;
    let r = t.documentElement, a = (n = t.defaultView) != null ? n : window;
    e = Math.max(0, a.innerWidth - r.clientWidth);
  }, after({ doc: t, d: n }) {
    let r = t.documentElement, a = Math.max(0, r.clientWidth - r.offsetWidth), o = Math.max(0, e - a);
    n.style(r, "paddingRight", `${o}px`);
  } };
}
function R0() {
  return Tp() ? { before({ doc: e, d: t, meta: n }) {
    function r(a) {
      return n.containers.flatMap((o) => o()).some((o) => o.contains(a));
    }
    t.microTask(() => {
      var a;
      if (window.getComputedStyle(e.documentElement).scrollBehavior !== "auto") {
        let s = Ln();
        s.style(e.documentElement, "scrollBehavior", "auto"), t.add(() => t.microTask(() => s.dispose()));
      }
      let o = (a = window.scrollY) != null ? a : window.pageYOffset, i = null;
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
        o !== l && window.scrollTo(0, o), i && i.isConnected && (i.scrollIntoView({ block: "nearest" }), i = null);
      });
    });
  } } : {};
}
function L0() {
  return { before({ doc: e, d: t }) {
    t.style(e.documentElement, "overflow", "hidden");
  } };
}
function D0(e) {
  let t = {};
  for (let n of e) Object.assign(t, n(t));
  return t;
}
let En = Sp(() => /* @__PURE__ */ new Map(), { PUSH(e, t) {
  var n;
  let r = (n = this.get(e)) != null ? n : { doc: e, count: 0, d: Ln(), meta: /* @__PURE__ */ new Set() };
  return r.count++, r.meta.add(t), this.set(e, r), this;
}, POP(e, t) {
  let n = this.get(e);
  return n && (n.count--, n.meta.delete(t)), this;
}, SCROLL_PREVENT({ doc: e, d: t, meta: n }) {
  let r = { doc: e, d: t, meta: D0(n) }, a = [R0(), F0(), L0()];
  a.forEach(({ before: o }) => o == null ? void 0 : o(r)), a.forEach(({ after: o }) => o == null ? void 0 : o(r));
}, SCROLL_ALLOW({ d: e }) {
  e.dispose();
}, TEARDOWN({ doc: e }) {
  this.delete(e);
} });
En.subscribe(() => {
  let e = En.getSnapshot(), t = /* @__PURE__ */ new Map();
  for (let [n] of e) t.set(n, n.documentElement.style.overflow);
  for (let n of e.values()) {
    let r = t.get(n.doc) === "hidden", a = n.count !== 0;
    (a && !r || !a && r) && En.dispatch(n.count > 0 ? "SCROLL_PREVENT" : "SCROLL_ALLOW", n), n.count === 0 && En.dispatch("TEARDOWN", n);
  }
});
function z0(e, t, n = () => ({ containers: [] })) {
  let r = Ap(En), a = t ? r.get(t) : void 0, o = a ? a.count > 0 : !1;
  return Ye(() => {
    if (!(!t || !e)) return En.dispatch("PUSH", t, n), () => En.dispatch("POP", t, n);
  }, [e, t]), o;
}
function $0(e, t, n = () => [document.body]) {
  let r = Cp(e, "scroll-lock");
  z0(r, t, (a) => {
    var o;
    return { containers: [...(o = a.containers) != null ? o : [], n] };
  });
}
function H0(e = 0) {
  let [t, n] = $e(e), r = Be((l) => n(l), [t]), a = Be((l) => n((c) => c | l), [t]), o = Be((l) => (t & l) === l, [t]), i = Be((l) => n((c) => c & ~l), [n]), s = Be((l) => n((c) => c ^ l), [n]);
  return { flags: t, setFlag: r, addFlag: a, hasFlag: o, removeFlag: i, toggleFlag: s };
}
var ku, Pu;
typeof process < "u" && typeof globalThis < "u" && typeof Element < "u" && ((ku = process == null ? void 0 : process.env) == null ? void 0 : ku.NODE_ENV) === "test" && typeof ((Pu = Element == null ? void 0 : Element.prototype) == null ? void 0 : Pu.getAnimations) > "u" && (Element.prototype.getAnimations = function() {
  return console.warn(["Headless UI has polyfilled `Element.prototype.getAnimations` for your tests.", "Please install a proper polyfill e.g. `jsdom-testing-mocks`, to silence these warnings.", "", "Example usage:", "```js", "import { mockAnimationsApi } from 'jsdom-testing-mocks'", "mockAnimationsApi()", "```"].join(`
`)), [];
});
var W0 = ((e) => (e[e.None = 0] = "None", e[e.Closed = 1] = "Closed", e[e.Enter = 2] = "Enter", e[e.Leave = 4] = "Leave", e))(W0 || {});
function fl(e) {
  let t = {};
  for (let n in e) e[n] === !0 && (t[`data-${n}`] = "");
  return t;
}
function dl(e, t, n, r) {
  let [a, o] = $e(n), { hasFlag: i, addFlag: s, removeFlag: l } = H0(e && a ? 3 : 0), c = xe(!1), u = xe(!1), p = ro();
  return Ye(() => {
    var m;
    if (e) {
      if (n && o(!0), !t) {
        n && s(3);
        return;
      }
      return (m = r == null ? void 0 : r.start) == null || m.call(r, n), B0(t, { inFlight: c, prepare() {
        u.current ? u.current = !1 : u.current = c.current, c.current = !0, !u.current && (n ? (s(3), l(4)) : (s(4), l(2)));
      }, run() {
        u.current ? n ? (l(3), s(4)) : (l(4), s(3)) : n ? l(1) : s(1);
      }, done() {
        var b;
        u.current && typeof t.getAnimations == "function" && t.getAnimations().length > 0 || (c.current = !1, l(7), n || o(!1), (b = r == null ? void 0 : r.end) == null || b.call(r, n));
      } });
    }
  }, [e, n, t, p]), e ? [a, { closed: i(1), enter: i(2), leave: i(4), transition: i(2) || i(4) }] : [n, { closed: void 0, enter: void 0, leave: void 0, transition: void 0 }];
}
function B0(e, { prepare: t, run: n, done: r, inFlight: a }) {
  let o = Ln();
  return Y0(e, { prepare: t, inFlight: a }), o.nextFrame(() => {
    n(), o.requestAnimationFrame(() => {
      o.add(G0(e, r));
    });
  }), o.dispose;
}
function G0(e, t) {
  var n, r;
  let a = Ln();
  if (!e) return a.dispose;
  let o = !1;
  a.add(() => {
    o = !0;
  });
  let i = (r = (n = e.getAnimations) == null ? void 0 : n.call(e).filter((s) => s instanceof CSSTransition)) != null ? r : [];
  return i.length === 0 ? (t(), a.dispose) : (Promise.allSettled(i.map((s) => s.finished)).then(() => {
    o || t();
  }), a.dispose);
}
function Y0(e, { inFlight: t, prepare: n }) {
  if (t != null && t.current) {
    n();
    return;
  }
  let r = e.style.transition;
  e.style.transition = "none", n(), e.offsetHeight, e.style.transition = r;
}
function oo() {
  return typeof window < "u";
}
function sr(e) {
  return Ip(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function it(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function Tt(e) {
  var t;
  return (t = (Ip(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function Ip(e) {
  return oo() ? e instanceof Node || e instanceof it(e).Node : !1;
}
function Xe(e) {
  return oo() ? e instanceof Element || e instanceof it(e).Element : !1;
}
function _t(e) {
  return oo() ? e instanceof HTMLElement || e instanceof it(e).HTMLElement : !1;
}
function Ou(e) {
  return !oo() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof it(e).ShadowRoot;
}
function Kr(e) {
  const {
    overflow: t,
    overflowX: n,
    overflowY: r,
    display: a
  } = mt(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !["inline", "contents"].includes(a);
}
function V0(e) {
  return ["table", "td", "th"].includes(sr(e));
}
function io(e) {
  return [":popover-open", ":modal"].some((t) => {
    try {
      return e.matches(t);
    } catch {
      return !1;
    }
  });
}
function pl(e) {
  const t = ml(), n = Xe(e) ? mt(e) : e;
  return ["transform", "translate", "scale", "rotate", "perspective"].some((r) => n[r] ? n[r] !== "none" : !1) || (n.containerType ? n.containerType !== "normal" : !1) || !t && (n.backdropFilter ? n.backdropFilter !== "none" : !1) || !t && (n.filter ? n.filter !== "none" : !1) || ["transform", "translate", "scale", "rotate", "perspective", "filter"].some((r) => (n.willChange || "").includes(r)) || ["paint", "layout", "strict", "content"].some((r) => (n.contain || "").includes(r));
}
function U0(e) {
  let t = sn(e);
  for (; _t(t) && !rr(t); ) {
    if (pl(t))
      return t;
    if (io(t))
      return null;
    t = sn(t);
  }
  return null;
}
function ml() {
  return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
function rr(e) {
  return ["html", "body", "#document"].includes(sr(e));
}
function mt(e) {
  return it(e).getComputedStyle(e);
}
function so(e) {
  return Xe(e) ? {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  } : {
    scrollLeft: e.scrollX,
    scrollTop: e.scrollY
  };
}
function sn(e) {
  if (sr(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    Ou(e) && e.host || // Fallback.
    Tt(e)
  );
  return Ou(t) ? t.host : t;
}
function jp(e) {
  const t = sn(e);
  return rr(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : _t(t) && Kr(t) ? t : jp(t);
}
function Lr(e, t, n) {
  var r;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const a = jp(e), o = a === ((r = e.ownerDocument) == null ? void 0 : r.body), i = it(a);
  if (o) {
    const s = ss(i);
    return t.concat(i, i.visualViewport || [], Kr(a) ? a : [], s && n ? Lr(s) : []);
  }
  return t.concat(a, Lr(a, [], n));
}
function ss(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function q0() {
  const e = navigator.userAgentData;
  return e && Array.isArray(e.brands) ? e.brands.map((t) => {
    let {
      brand: n,
      version: r
    } = t;
    return n + "/" + r;
  }).join(" ") : navigator.userAgent;
}
const _n = Math.min, Ke = Math.max, Dr = Math.round, ya = Math.floor, Ct = (e) => ({
  x: e,
  y: e
}), K0 = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
}, X0 = {
  start: "end",
  end: "start"
};
function Su(e, t, n) {
  return Ke(e, _n(t, n));
}
function lr(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function ln(e) {
  return e.split("-")[0];
}
function Xr(e) {
  return e.split("-")[1];
}
function Mp(e) {
  return e === "x" ? "y" : "x";
}
function Fp(e) {
  return e === "y" ? "height" : "width";
}
function Tn(e) {
  return ["top", "bottom"].includes(ln(e)) ? "y" : "x";
}
function Rp(e) {
  return Mp(Tn(e));
}
function J0(e, t, n) {
  n === void 0 && (n = !1);
  const r = Xr(e), a = Rp(e), o = Fp(a);
  let i = a === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
  return t.reference[o] > t.floating[o] && (i = Ha(i)), [i, Ha(i)];
}
function Z0(e) {
  const t = Ha(e);
  return [ls(e), t, ls(t)];
}
function ls(e) {
  return e.replace(/start|end/g, (t) => X0[t]);
}
function Q0(e, t, n) {
  const r = ["left", "right"], a = ["right", "left"], o = ["top", "bottom"], i = ["bottom", "top"];
  switch (e) {
    case "top":
    case "bottom":
      return n ? t ? a : r : t ? r : a;
    case "left":
    case "right":
      return t ? o : i;
    default:
      return [];
  }
}
function e1(e, t, n, r) {
  const a = Xr(e);
  let o = Q0(ln(e), n === "start", r);
  return a && (o = o.map((i) => i + "-" + a), t && (o = o.concat(o.map(ls)))), o;
}
function Ha(e) {
  return e.replace(/left|right|bottom|top/g, (t) => K0[t]);
}
function t1(e) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...e
  };
}
function n1(e) {
  return typeof e != "number" ? t1(e) : {
    top: e,
    right: e,
    bottom: e,
    left: e
  };
}
function Wa(e) {
  const {
    x: t,
    y: n,
    width: r,
    height: a
  } = e;
  return {
    width: r,
    height: a,
    top: n,
    left: t,
    right: t + r,
    bottom: n + a,
    x: t,
    y: n
  };
}
function Au(e, t, n) {
  let {
    reference: r,
    floating: a
  } = e;
  const o = Tn(t), i = Rp(t), s = Fp(i), l = ln(t), c = o === "y", u = r.x + r.width / 2 - a.width / 2, p = r.y + r.height / 2 - a.height / 2, m = r[s] / 2 - a[s] / 2;
  let b;
  switch (l) {
    case "top":
      b = {
        x: u,
        y: r.y - a.height
      };
      break;
    case "bottom":
      b = {
        x: u,
        y: r.y + r.height
      };
      break;
    case "right":
      b = {
        x: r.x + r.width,
        y: p
      };
      break;
    case "left":
      b = {
        x: r.x - a.width,
        y: p
      };
      break;
    default:
      b = {
        x: r.x,
        y: r.y
      };
  }
  switch (Xr(t)) {
    case "start":
      b[i] -= m * (n && c ? -1 : 1);
      break;
    case "end":
      b[i] += m * (n && c ? -1 : 1);
      break;
  }
  return b;
}
const r1 = async (e, t, n) => {
  const {
    placement: r = "bottom",
    strategy: a = "absolute",
    middleware: o = [],
    platform: i
  } = n, s = o.filter(Boolean), l = await (i.isRTL == null ? void 0 : i.isRTL(t));
  let c = await i.getElementRects({
    reference: e,
    floating: t,
    strategy: a
  }), {
    x: u,
    y: p
  } = Au(c, r, l), m = r, b = {}, x = 0;
  for (let v = 0; v < s.length; v++) {
    const {
      name: y,
      fn: w
    } = s[v], {
      x: P,
      y: S,
      data: _,
      reset: h
    } = await w({
      x: u,
      y: p,
      initialPlacement: r,
      placement: m,
      strategy: a,
      middlewareData: b,
      rects: c,
      platform: i,
      elements: {
        reference: e,
        floating: t
      }
    });
    u = P ?? u, p = S ?? p, b = {
      ...b,
      [y]: {
        ...b[y],
        ..._
      }
    }, h && x <= 50 && (x++, typeof h == "object" && (h.placement && (m = h.placement), h.rects && (c = h.rects === !0 ? await i.getElementRects({
      reference: e,
      floating: t,
      strategy: a
    }) : h.rects), {
      x: u,
      y: p
    } = Au(c, m, l)), v = -1);
  }
  return {
    x: u,
    y: p,
    placement: m,
    strategy: a,
    middlewareData: b
  };
};
async function lo(e, t) {
  var n;
  t === void 0 && (t = {});
  const {
    x: r,
    y: a,
    platform: o,
    rects: i,
    elements: s,
    strategy: l
  } = e, {
    boundary: c = "clippingAncestors",
    rootBoundary: u = "viewport",
    elementContext: p = "floating",
    altBoundary: m = !1,
    padding: b = 0
  } = lr(t, e), x = n1(b), v = s[m ? p === "floating" ? "reference" : "floating" : p], y = Wa(await o.getClippingRect({
    element: (n = await (o.isElement == null ? void 0 : o.isElement(v))) == null || n ? v : v.contextElement || await (o.getDocumentElement == null ? void 0 : o.getDocumentElement(s.floating)),
    boundary: c,
    rootBoundary: u,
    strategy: l
  })), w = p === "floating" ? {
    x: r,
    y: a,
    width: i.floating.width,
    height: i.floating.height
  } : i.reference, P = await (o.getOffsetParent == null ? void 0 : o.getOffsetParent(s.floating)), S = await (o.isElement == null ? void 0 : o.isElement(P)) ? await (o.getScale == null ? void 0 : o.getScale(P)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  }, _ = Wa(o.convertOffsetParentRelativeRectToViewportRelativeRect ? await o.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements: s,
    rect: w,
    offsetParent: P,
    strategy: l
  }) : w);
  return {
    top: (y.top - _.top + x.top) / S.y,
    bottom: (_.bottom - y.bottom + x.bottom) / S.y,
    left: (y.left - _.left + x.left) / S.x,
    right: (_.right - y.right + x.right) / S.x
  };
}
const a1 = function(e) {
  return e === void 0 && (e = {}), {
    name: "flip",
    options: e,
    async fn(t) {
      var n, r;
      const {
        placement: a,
        middlewareData: o,
        rects: i,
        initialPlacement: s,
        platform: l,
        elements: c
      } = t, {
        mainAxis: u = !0,
        crossAxis: p = !0,
        fallbackPlacements: m,
        fallbackStrategy: b = "bestFit",
        fallbackAxisSideDirection: x = "none",
        flipAlignment: v = !0,
        ...y
      } = lr(e, t);
      if ((n = o.arrow) != null && n.alignmentOffset)
        return {};
      const w = ln(a), P = Tn(s), S = ln(s) === s, _ = await (l.isRTL == null ? void 0 : l.isRTL(c.floating)), h = m || (S || !v ? [Ha(s)] : Z0(s)), G = x !== "none";
      !m && G && h.push(...e1(s, v, x, _));
      const U = [s, ...h], te = await lo(t, y), X = [];
      let Z = ((r = o.flip) == null ? void 0 : r.overflows) || [];
      if (u && X.push(te[w]), p) {
        const q = J0(a, i, _);
        X.push(te[q[0]], te[q[1]]);
      }
      if (Z = [...Z, {
        placement: a,
        overflows: X
      }], !X.every((q) => q <= 0)) {
        var Q, B;
        const q = (((Q = o.flip) == null ? void 0 : Q.index) || 0) + 1, J = U[q];
        if (J)
          return {
            data: {
              index: q,
              overflows: Z
            },
            reset: {
              placement: J
            }
          };
        let Y = (B = Z.filter((M) => M.overflows[0] <= 0).sort((M, K) => M.overflows[1] - K.overflows[1])[0]) == null ? void 0 : B.placement;
        if (!Y)
          switch (b) {
            case "bestFit": {
              var oe;
              const M = (oe = Z.filter((K) => {
                if (G) {
                  const z = Tn(K.placement);
                  return z === P || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  z === "y";
                }
                return !0;
              }).map((K) => [K.placement, K.overflows.filter((z) => z > 0).reduce((z, g) => z + g, 0)]).sort((K, z) => K[1] - z[1])[0]) == null ? void 0 : oe[0];
              M && (Y = M);
              break;
            }
            case "initialPlacement":
              Y = s;
              break;
          }
        if (a !== Y)
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
async function o1(e, t) {
  const {
    placement: n,
    platform: r,
    elements: a
  } = e, o = await (r.isRTL == null ? void 0 : r.isRTL(a.floating)), i = ln(n), s = Xr(n), l = Tn(n) === "y", c = ["left", "top"].includes(i) ? -1 : 1, u = o && l ? -1 : 1, p = lr(t, e);
  let {
    mainAxis: m,
    crossAxis: b,
    alignmentAxis: x
  } = typeof p == "number" ? {
    mainAxis: p,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: p.mainAxis || 0,
    crossAxis: p.crossAxis || 0,
    alignmentAxis: p.alignmentAxis
  };
  return s && typeof x == "number" && (b = s === "end" ? x * -1 : x), l ? {
    x: b * u,
    y: m * c
  } : {
    x: m * c,
    y: b * u
  };
}
const i1 = function(e) {
  return e === void 0 && (e = 0), {
    name: "offset",
    options: e,
    async fn(t) {
      var n, r;
      const {
        x: a,
        y: o,
        placement: i,
        middlewareData: s
      } = t, l = await o1(t, e);
      return i === ((n = s.offset) == null ? void 0 : n.placement) && (r = s.arrow) != null && r.alignmentOffset ? {} : {
        x: a + l.x,
        y: o + l.y,
        data: {
          ...l,
          placement: i
        }
      };
    }
  };
}, s1 = function(e) {
  return e === void 0 && (e = {}), {
    name: "shift",
    options: e,
    async fn(t) {
      const {
        x: n,
        y: r,
        placement: a
      } = t, {
        mainAxis: o = !0,
        crossAxis: i = !1,
        limiter: s = {
          fn: (y) => {
            let {
              x: w,
              y: P
            } = y;
            return {
              x: w,
              y: P
            };
          }
        },
        ...l
      } = lr(e, t), c = {
        x: n,
        y: r
      }, u = await lo(t, l), p = Tn(ln(a)), m = Mp(p);
      let b = c[m], x = c[p];
      if (o) {
        const y = m === "y" ? "top" : "left", w = m === "y" ? "bottom" : "right", P = b + u[y], S = b - u[w];
        b = Su(P, b, S);
      }
      if (i) {
        const y = p === "y" ? "top" : "left", w = p === "y" ? "bottom" : "right", P = x + u[y], S = x - u[w];
        x = Su(P, x, S);
      }
      const v = s.fn({
        ...t,
        [m]: b,
        [p]: x
      });
      return {
        ...v,
        data: {
          x: v.x - n,
          y: v.y - r,
          enabled: {
            [m]: o,
            [p]: i
          }
        }
      };
    }
  };
}, l1 = function(e) {
  return e === void 0 && (e = {}), {
    name: "size",
    options: e,
    async fn(t) {
      var n, r;
      const {
        placement: a,
        rects: o,
        platform: i,
        elements: s
      } = t, {
        apply: l = () => {
        },
        ...c
      } = lr(e, t), u = await lo(t, c), p = ln(a), m = Xr(a), b = Tn(a) === "y", {
        width: x,
        height: v
      } = o.floating;
      let y, w;
      p === "top" || p === "bottom" ? (y = p, w = m === (await (i.isRTL == null ? void 0 : i.isRTL(s.floating)) ? "start" : "end") ? "left" : "right") : (w = p, y = m === "end" ? "top" : "bottom");
      const P = v - u.top - u.bottom, S = x - u.left - u.right, _ = _n(v - u[y], P), h = _n(x - u[w], S), G = !t.middlewareData.shift;
      let U = _, te = h;
      if ((n = t.middlewareData.shift) != null && n.enabled.x && (te = S), (r = t.middlewareData.shift) != null && r.enabled.y && (U = P), G && !m) {
        const Z = Ke(u.left, 0), Q = Ke(u.right, 0), B = Ke(u.top, 0), oe = Ke(u.bottom, 0);
        b ? te = x - 2 * (Z !== 0 || Q !== 0 ? Z + Q : Ke(u.left, u.right)) : U = v - 2 * (B !== 0 || oe !== 0 ? B + oe : Ke(u.top, u.bottom));
      }
      await l({
        ...t,
        availableWidth: te,
        availableHeight: U
      });
      const X = await i.getDimensions(s.floating);
      return x !== X.width || v !== X.height ? {
        reset: {
          rects: !0
        }
      } : {};
    }
  };
};
function Lp(e) {
  const t = mt(e);
  let n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0;
  const a = _t(e), o = a ? e.offsetWidth : n, i = a ? e.offsetHeight : r, s = Dr(n) !== o || Dr(r) !== i;
  return s && (n = o, r = i), {
    width: n,
    height: r,
    $: s
  };
}
function gl(e) {
  return Xe(e) ? e : e.contextElement;
}
function Kn(e) {
  const t = gl(e);
  if (!_t(t))
    return Ct(1);
  const n = t.getBoundingClientRect(), {
    width: r,
    height: a,
    $: o
  } = Lp(t);
  let i = (o ? Dr(n.width) : n.width) / r, s = (o ? Dr(n.height) : n.height) / a;
  return (!i || !Number.isFinite(i)) && (i = 1), (!s || !Number.isFinite(s)) && (s = 1), {
    x: i,
    y: s
  };
}
const c1 = /* @__PURE__ */ Ct(0);
function Dp(e) {
  const t = it(e);
  return !ml() || !t.visualViewport ? c1 : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function u1(e, t, n) {
  return t === void 0 && (t = !1), !n || t && n !== it(e) ? !1 : t;
}
function Nn(e, t, n, r) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const a = e.getBoundingClientRect(), o = gl(e);
  let i = Ct(1);
  t && (r ? Xe(r) && (i = Kn(r)) : i = Kn(e));
  const s = u1(o, n, r) ? Dp(o) : Ct(0);
  let l = (a.left + s.x) / i.x, c = (a.top + s.y) / i.y, u = a.width / i.x, p = a.height / i.y;
  if (o) {
    const m = it(o), b = r && Xe(r) ? it(r) : r;
    let x = m, v = ss(x);
    for (; v && r && b !== x; ) {
      const y = Kn(v), w = v.getBoundingClientRect(), P = mt(v), S = w.left + (v.clientLeft + parseFloat(P.paddingLeft)) * y.x, _ = w.top + (v.clientTop + parseFloat(P.paddingTop)) * y.y;
      l *= y.x, c *= y.y, u *= y.x, p *= y.y, l += S, c += _, x = it(v), v = ss(x);
    }
  }
  return Wa({
    width: u,
    height: p,
    x: l,
    y: c
  });
}
function hl(e, t) {
  const n = so(e).scrollLeft;
  return t ? t.left + n : Nn(Tt(e)).left + n;
}
function zp(e, t, n) {
  n === void 0 && (n = !1);
  const r = e.getBoundingClientRect(), a = r.left + t.scrollLeft - (n ? 0 : (
    // RTL <body> scrollbar.
    hl(e, r)
  )), o = r.top + t.scrollTop;
  return {
    x: a,
    y: o
  };
}
function f1(e) {
  let {
    elements: t,
    rect: n,
    offsetParent: r,
    strategy: a
  } = e;
  const o = a === "fixed", i = Tt(r), s = t ? io(t.floating) : !1;
  if (r === i || s && o)
    return n;
  let l = {
    scrollLeft: 0,
    scrollTop: 0
  }, c = Ct(1);
  const u = Ct(0), p = _t(r);
  if ((p || !p && !o) && ((sr(r) !== "body" || Kr(i)) && (l = so(r)), _t(r))) {
    const b = Nn(r);
    c = Kn(r), u.x = b.x + r.clientLeft, u.y = b.y + r.clientTop;
  }
  const m = i && !p && !o ? zp(i, l, !0) : Ct(0);
  return {
    width: n.width * c.x,
    height: n.height * c.y,
    x: n.x * c.x - l.scrollLeft * c.x + u.x + m.x,
    y: n.y * c.y - l.scrollTop * c.y + u.y + m.y
  };
}
function d1(e) {
  return Array.from(e.getClientRects());
}
function p1(e) {
  const t = Tt(e), n = so(e), r = e.ownerDocument.body, a = Ke(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth), o = Ke(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let i = -n.scrollLeft + hl(e);
  const s = -n.scrollTop;
  return mt(r).direction === "rtl" && (i += Ke(t.clientWidth, r.clientWidth) - a), {
    width: a,
    height: o,
    x: i,
    y: s
  };
}
function m1(e, t) {
  const n = it(e), r = Tt(e), a = n.visualViewport;
  let o = r.clientWidth, i = r.clientHeight, s = 0, l = 0;
  if (a) {
    o = a.width, i = a.height;
    const c = ml();
    (!c || c && t === "fixed") && (s = a.offsetLeft, l = a.offsetTop);
  }
  return {
    width: o,
    height: i,
    x: s,
    y: l
  };
}
function g1(e, t) {
  const n = Nn(e, !0, t === "fixed"), r = n.top + e.clientTop, a = n.left + e.clientLeft, o = _t(e) ? Kn(e) : Ct(1), i = e.clientWidth * o.x, s = e.clientHeight * o.y, l = a * o.x, c = r * o.y;
  return {
    width: i,
    height: s,
    x: l,
    y: c
  };
}
function Cu(e, t, n) {
  let r;
  if (t === "viewport")
    r = m1(e, n);
  else if (t === "document")
    r = p1(Tt(e));
  else if (Xe(t))
    r = g1(t, n);
  else {
    const a = Dp(e);
    r = {
      x: t.x - a.x,
      y: t.y - a.y,
      width: t.width,
      height: t.height
    };
  }
  return Wa(r);
}
function $p(e, t) {
  const n = sn(e);
  return n === t || !Xe(n) || rr(n) ? !1 : mt(n).position === "fixed" || $p(n, t);
}
function h1(e, t) {
  const n = t.get(e);
  if (n)
    return n;
  let r = Lr(e, [], !1).filter((s) => Xe(s) && sr(s) !== "body"), a = null;
  const o = mt(e).position === "fixed";
  let i = o ? sn(e) : e;
  for (; Xe(i) && !rr(i); ) {
    const s = mt(i), l = pl(i);
    !l && s.position === "fixed" && (a = null), (o ? !l && !a : !l && s.position === "static" && a && ["absolute", "fixed"].includes(a.position) || Kr(i) && !l && $p(e, i)) ? r = r.filter((c) => c !== i) : a = s, i = sn(i);
  }
  return t.set(e, r), r;
}
function y1(e) {
  let {
    element: t,
    boundary: n,
    rootBoundary: r,
    strategy: a
  } = e;
  const o = [...n === "clippingAncestors" ? io(t) ? [] : h1(t, this._c) : [].concat(n), r], i = o[0], s = o.reduce((l, c) => {
    const u = Cu(t, c, a);
    return l.top = Ke(u.top, l.top), l.right = _n(u.right, l.right), l.bottom = _n(u.bottom, l.bottom), l.left = Ke(u.left, l.left), l;
  }, Cu(t, i, a));
  return {
    width: s.right - s.left,
    height: s.bottom - s.top,
    x: s.left,
    y: s.top
  };
}
function b1(e) {
  const {
    width: t,
    height: n
  } = Lp(e);
  return {
    width: t,
    height: n
  };
}
function v1(e, t, n) {
  const r = _t(t), a = Tt(t), o = n === "fixed", i = Nn(e, !0, o, t);
  let s = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const l = Ct(0);
  if (r || !r && !o)
    if ((sr(t) !== "body" || Kr(a)) && (s = so(t)), r) {
      const m = Nn(t, !0, o, t);
      l.x = m.x + t.clientLeft, l.y = m.y + t.clientTop;
    } else a && (l.x = hl(a));
  const c = a && !r && !o ? zp(a, s) : Ct(0), u = i.left + s.scrollLeft - l.x - c.x, p = i.top + s.scrollTop - l.y - c.y;
  return {
    x: u,
    y: p,
    width: i.width,
    height: i.height
  };
}
function ri(e) {
  return mt(e).position === "static";
}
function _u(e, t) {
  if (!_t(e) || mt(e).position === "fixed")
    return null;
  if (t)
    return t(e);
  let n = e.offsetParent;
  return Tt(e) === n && (n = n.ownerDocument.body), n;
}
function Hp(e, t) {
  const n = it(e);
  if (io(e))
    return n;
  if (!_t(e)) {
    let a = sn(e);
    for (; a && !rr(a); ) {
      if (Xe(a) && !ri(a))
        return a;
      a = sn(a);
    }
    return n;
  }
  let r = _u(e, t);
  for (; r && V0(r) && ri(r); )
    r = _u(r, t);
  return r && rr(r) && ri(r) && !pl(r) ? n : r || U0(e) || n;
}
const x1 = async function(e) {
  const t = this.getOffsetParent || Hp, n = this.getDimensions, r = await n(e.floating);
  return {
    reference: v1(e.reference, await t(e.floating), e.strategy),
    floating: {
      x: 0,
      y: 0,
      width: r.width,
      height: r.height
    }
  };
};
function w1(e) {
  return mt(e).direction === "rtl";
}
const E1 = {
  convertOffsetParentRelativeRectToViewportRelativeRect: f1,
  getDocumentElement: Tt,
  getClippingRect: y1,
  getOffsetParent: Hp,
  getElementRects: x1,
  getClientRects: d1,
  getDimensions: b1,
  getScale: Kn,
  isElement: Xe,
  isRTL: w1
};
function Wp(e, t) {
  return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function k1(e, t) {
  let n = null, r;
  const a = Tt(e);
  function o() {
    var s;
    clearTimeout(r), (s = n) == null || s.disconnect(), n = null;
  }
  function i(s, l) {
    s === void 0 && (s = !1), l === void 0 && (l = 1), o();
    const c = e.getBoundingClientRect(), {
      left: u,
      top: p,
      width: m,
      height: b
    } = c;
    if (s || t(), !m || !b)
      return;
    const x = ya(p), v = ya(a.clientWidth - (u + m)), y = ya(a.clientHeight - (p + b)), w = ya(u), P = {
      rootMargin: -x + "px " + -v + "px " + -y + "px " + -w + "px",
      threshold: Ke(0, _n(1, l)) || 1
    };
    let S = !0;
    function _(h) {
      const G = h[0].intersectionRatio;
      if (G !== l) {
        if (!S)
          return i();
        G ? i(!1, G) : r = setTimeout(() => {
          i(!1, 1e-7);
        }, 1e3);
      }
      G === 1 && !Wp(c, e.getBoundingClientRect()) && i(), S = !1;
    }
    try {
      n = new IntersectionObserver(_, {
        ...P,
        // Handle <iframe>s
        root: a.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(_, P);
    }
    n.observe(e);
  }
  return i(!0), o;
}
function P1(e, t, n, r) {
  r === void 0 && (r = {});
  const {
    ancestorScroll: a = !0,
    ancestorResize: o = !0,
    elementResize: i = typeof ResizeObserver == "function",
    layoutShift: s = typeof IntersectionObserver == "function",
    animationFrame: l = !1
  } = r, c = gl(e), u = a || o ? [...c ? Lr(c) : [], ...Lr(t)] : [];
  u.forEach((w) => {
    a && w.addEventListener("scroll", n, {
      passive: !0
    }), o && w.addEventListener("resize", n);
  });
  const p = c && s ? k1(c, n) : null;
  let m = -1, b = null;
  i && (b = new ResizeObserver((w) => {
    let [P] = w;
    P && P.target === c && b && (b.unobserve(t), cancelAnimationFrame(m), m = requestAnimationFrame(() => {
      var S;
      (S = b) == null || S.observe(t);
    })), n();
  }), c && !l && b.observe(c), b.observe(t));
  let x, v = l ? Nn(e) : null;
  l && y();
  function y() {
    const w = Nn(e);
    v && !Wp(v, w) && n(), v = w, x = requestAnimationFrame(y);
  }
  return n(), () => {
    var w;
    u.forEach((P) => {
      a && P.removeEventListener("scroll", n), o && P.removeEventListener("resize", n);
    }), p == null || p(), (w = b) == null || w.disconnect(), b = null, l && cancelAnimationFrame(x);
  };
}
const ai = lo, O1 = i1, S1 = s1, A1 = a1, C1 = l1, _1 = (e, t, n) => {
  const r = /* @__PURE__ */ new Map(), a = {
    platform: E1,
    ...n
  }, o = {
    ...a.platform,
    _c: r
  };
  return r1(e, t, {
    ...a,
    platform: o
  });
};
var Aa = typeof document < "u" ? Xs : Le;
function Ba(e, t) {
  if (e === t)
    return !0;
  if (typeof e != typeof t)
    return !1;
  if (typeof e == "function" && e.toString() === t.toString())
    return !0;
  let n, r, a;
  if (e && t && typeof e == "object") {
    if (Array.isArray(e)) {
      if (n = e.length, n !== t.length) return !1;
      for (r = n; r-- !== 0; )
        if (!Ba(e[r], t[r]))
          return !1;
      return !0;
    }
    if (a = Object.keys(e), n = a.length, n !== Object.keys(t).length)
      return !1;
    for (r = n; r-- !== 0; )
      if (!{}.hasOwnProperty.call(t, a[r]))
        return !1;
    for (r = n; r-- !== 0; ) {
      const o = a[r];
      if (!(o === "_owner" && e.$$typeof) && !Ba(e[o], t[o]))
        return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function Bp(e) {
  return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function Tu(e, t) {
  const n = Bp(e);
  return Math.round(t * n) / n;
}
function oi(e) {
  const t = ie.useRef(e);
  return Aa(() => {
    t.current = e;
  }), t;
}
function T1(e) {
  e === void 0 && (e = {});
  const {
    placement: t = "bottom",
    strategy: n = "absolute",
    middleware: r = [],
    platform: a,
    elements: {
      reference: o,
      floating: i
    } = {},
    transform: s = !0,
    whileElementsMounted: l,
    open: c
  } = e, [u, p] = ie.useState({
    x: 0,
    y: 0,
    strategy: n,
    placement: t,
    middlewareData: {},
    isPositioned: !1
  }), [m, b] = ie.useState(r);
  Ba(m, r) || b(r);
  const [x, v] = ie.useState(null), [y, w] = ie.useState(null), P = ie.useCallback((K) => {
    K !== G.current && (G.current = K, v(K));
  }, []), S = ie.useCallback((K) => {
    K !== U.current && (U.current = K, w(K));
  }, []), _ = o || x, h = i || y, G = ie.useRef(null), U = ie.useRef(null), te = ie.useRef(u), X = l != null, Z = oi(l), Q = oi(a), B = oi(c), oe = ie.useCallback(() => {
    if (!G.current || !U.current)
      return;
    const K = {
      placement: t,
      strategy: n,
      middleware: m
    };
    Q.current && (K.platform = Q.current), _1(G.current, U.current, K).then((z) => {
      const g = {
        ...z,
        // The floating element's position may be recomputed while it's closed
        // but still mounted (such as when transitioning out). To ensure
        // `isPositioned` will be `false` initially on the next open, avoid
        // setting it to `true` when `open === false` (must be specified).
        isPositioned: B.current !== !1
      };
      q.current && !Ba(te.current, g) && (te.current = g, ja.flushSync(() => {
        p(g);
      }));
    });
  }, [m, t, n, Q, B]);
  Aa(() => {
    c === !1 && te.current.isPositioned && (te.current.isPositioned = !1, p((K) => ({
      ...K,
      isPositioned: !1
    })));
  }, [c]);
  const q = ie.useRef(!1);
  Aa(() => (q.current = !0, () => {
    q.current = !1;
  }), []), Aa(() => {
    if (_ && (G.current = _), h && (U.current = h), _ && h) {
      if (Z.current)
        return Z.current(_, h, oe);
      oe();
    }
  }, [_, h, oe, Z, X]);
  const J = ie.useMemo(() => ({
    reference: G,
    floating: U,
    setReference: P,
    setFloating: S
  }), [P, S]), Y = ie.useMemo(() => ({
    reference: _,
    floating: h
  }), [_, h]), M = ie.useMemo(() => {
    const K = {
      position: n,
      left: 0,
      top: 0
    };
    if (!Y.floating)
      return K;
    const z = Tu(Y.floating, u.x), g = Tu(Y.floating, u.y);
    return s ? {
      ...K,
      transform: "translate(" + z + "px, " + g + "px)",
      ...Bp(Y.floating) >= 1.5 && {
        willChange: "transform"
      }
    } : {
      position: n,
      left: z,
      top: g
    };
  }, [n, s, Y.floating, u.x, u.y]);
  return ie.useMemo(() => ({
    ...u,
    update: oe,
    refs: J,
    elements: Y,
    floatingStyles: M
  }), [u, oe, J, Y, M]);
}
const Gp = (e, t) => ({
  ...O1(e),
  options: [e, t]
}), N1 = (e, t) => ({
  ...S1(e),
  options: [e, t]
}), I1 = (e, t) => ({
  ...A1(e),
  options: [e, t]
}), j1 = (e, t) => ({
  ...C1(e),
  options: [e, t]
}), Yp = {
  ...ie
}, M1 = Yp.useInsertionEffect, F1 = M1 || ((e) => e());
function Vp(e) {
  const t = ie.useRef(() => {
    if (process.env.NODE_ENV !== "production")
      throw new Error("Cannot call an event handler while rendering.");
  });
  return F1(() => {
    t.current = e;
  }), ie.useCallback(function() {
    for (var n = arguments.length, r = new Array(n), a = 0; a < n; a++)
      r[a] = arguments[a];
    return t.current == null ? void 0 : t.current(...r);
  }, []);
}
var cs = typeof document < "u" ? Xs : Le;
let Nu = !1, R1 = 0;
const Iu = () => (
  // Ensure the id is unique with multiple independent versions of Floating UI
  // on <React 18
  "floating-ui-" + Math.random().toString(36).slice(2, 6) + R1++
);
function L1() {
  const [e, t] = ie.useState(() => Nu ? Iu() : void 0);
  return cs(() => {
    e == null && t(Iu());
  }, []), ie.useEffect(() => {
    Nu = !0;
  }, []), e;
}
const D1 = Yp.useId, z1 = D1 || L1;
let zr;
process.env.NODE_ENV !== "production" && (zr = /* @__PURE__ */ new Set());
function $1() {
  for (var e, t = arguments.length, n = new Array(t), r = 0; r < t; r++)
    n[r] = arguments[r];
  const a = "Floating UI: " + n.join(" ");
  if (!((e = zr) != null && e.has(a))) {
    var o;
    (o = zr) == null || o.add(a), console.warn(a);
  }
}
function H1() {
  for (var e, t = arguments.length, n = new Array(t), r = 0; r < t; r++)
    n[r] = arguments[r];
  const a = "Floating UI: " + n.join(" ");
  if (!((e = zr) != null && e.has(a))) {
    var o;
    (o = zr) == null || o.add(a), console.error(a);
  }
}
function W1() {
  const e = /* @__PURE__ */ new Map();
  return {
    emit(t, n) {
      var r;
      (r = e.get(t)) == null || r.forEach((a) => a(n));
    },
    on(t, n) {
      e.set(t, [...e.get(t) || [], n]);
    },
    off(t, n) {
      var r;
      e.set(t, ((r = e.get(t)) == null ? void 0 : r.filter((a) => a !== n)) || []);
    }
  };
}
const B1 = /* @__PURE__ */ ie.createContext(null), G1 = /* @__PURE__ */ ie.createContext(null), Y1 = () => {
  var e;
  return ((e = ie.useContext(B1)) == null ? void 0 : e.id) || null;
}, V1 = () => ie.useContext(G1), U1 = "data-floating-ui-focusable";
function q1(e) {
  const {
    open: t = !1,
    onOpenChange: n,
    elements: r
  } = e, a = z1(), o = ie.useRef({}), [i] = ie.useState(() => W1()), s = Y1() != null;
  if (process.env.NODE_ENV !== "production") {
    const b = r.reference;
    b && !Xe(b) && H1("Cannot pass a virtual element to the `elements.reference` option,", "as it must be a real DOM element. Use `refs.setPositionReference()`", "instead.");
  }
  const [l, c] = ie.useState(r.reference), u = Vp((b, x, v) => {
    o.current.openEvent = b ? x : void 0, i.emit("openchange", {
      open: b,
      event: x,
      reason: v,
      nested: s
    }), n == null || n(b, x, v);
  }), p = ie.useMemo(() => ({
    setPositionReference: c
  }), []), m = ie.useMemo(() => ({
    reference: l || r.reference || null,
    floating: r.floating || null,
    domReference: r.reference
  }), [l, r.reference, r.floating]);
  return ie.useMemo(() => ({
    dataRef: o,
    open: t,
    onOpenChange: u,
    elements: m,
    events: i,
    floatingId: a,
    refs: p
  }), [t, u, m, i, a, p]);
}
function K1(e) {
  e === void 0 && (e = {});
  const {
    nodeId: t
  } = e, n = q1({
    ...e,
    elements: {
      reference: null,
      floating: null,
      ...e.elements
    }
  }), r = e.rootContext || n, a = r.elements, [o, i] = ie.useState(null), [s, l] = ie.useState(null), c = (a == null ? void 0 : a.domReference) || o, u = ie.useRef(null), p = V1();
  cs(() => {
    c && (u.current = c);
  }, [c]);
  const m = T1({
    ...e,
    elements: {
      ...a,
      ...s && {
        reference: s
      }
    }
  }), b = ie.useCallback((P) => {
    const S = Xe(P) ? {
      getBoundingClientRect: () => P.getBoundingClientRect(),
      contextElement: P
    } : P;
    l(S), m.refs.setReference(S);
  }, [m.refs]), x = ie.useCallback((P) => {
    (Xe(P) || P === null) && (u.current = P, i(P)), (Xe(m.refs.reference.current) || m.refs.reference.current === null || // Don't allow setting virtual elements using the old technique back to
    // `null` to support `positionReference` + an unstable `reference`
    // callback ref.
    P !== null && !Xe(P)) && m.refs.setReference(P);
  }, [m.refs]), v = ie.useMemo(() => ({
    ...m.refs,
    setReference: x,
    setPositionReference: b,
    domReference: u
  }), [m.refs, x, b]), y = ie.useMemo(() => ({
    ...m.elements,
    domReference: c
  }), [m.elements, c]), w = ie.useMemo(() => ({
    ...m,
    ...r,
    refs: v,
    elements: y,
    nodeId: t
  }), [m, v, y, t, r]);
  return cs(() => {
    r.dataRef.current.floatingContext = w;
    const P = p == null ? void 0 : p.nodesRef.current.find((S) => S.id === t);
    P && (P.context = w);
  }), ie.useMemo(() => ({
    ...m,
    context: w,
    refs: v,
    elements: y
  }), [m, v, y, w]);
}
const ju = "active", Mu = "selected";
function ii(e, t, n) {
  const r = /* @__PURE__ */ new Map(), a = n === "item";
  let o = e;
  if (a && e) {
    const {
      [ju]: i,
      [Mu]: s,
      ...l
    } = e;
    o = l;
  }
  return {
    ...n === "floating" && {
      tabIndex: -1,
      [U1]: ""
    },
    ...o,
    ...t.map((i) => {
      const s = i ? i[n] : null;
      return typeof s == "function" ? e ? s(e) : null : s;
    }).concat(e).reduce((i, s) => (s && Object.entries(s).forEach((l) => {
      let [c, u] = l;
      if (!(a && [ju, Mu].includes(c)))
        if (c.indexOf("on") === 0) {
          if (r.has(c) || r.set(c, []), typeof u == "function") {
            var p;
            (p = r.get(c)) == null || p.push(u), i[c] = function() {
              for (var m, b = arguments.length, x = new Array(b), v = 0; v < b; v++)
                x[v] = arguments[v];
              return (m = r.get(c)) == null ? void 0 : m.map((y) => y(...x)).find((y) => y !== void 0);
            };
          }
        } else
          i[c] = u;
    }), i), {})
  };
}
function X1(e) {
  e === void 0 && (e = []);
  const t = e.map((s) => s == null ? void 0 : s.reference), n = e.map((s) => s == null ? void 0 : s.floating), r = e.map((s) => s == null ? void 0 : s.item), a = ie.useCallback(
    (s) => ii(s, e, "reference"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    t
  ), o = ie.useCallback(
    (s) => ii(s, e, "floating"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    n
  ), i = ie.useCallback(
    (s) => ii(s, e, "item"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    r
  );
  return ie.useMemo(() => ({
    getReferenceProps: a,
    getFloatingProps: o,
    getItemProps: i
  }), [a, o, i]);
}
function Fu(e, t) {
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
const J1 = (e) => ({
  name: "inner",
  options: e,
  async fn(t) {
    const {
      listRef: n,
      overflowRef: r,
      onFallbackChange: a,
      offset: o = 0,
      index: i = 0,
      minItemsVisible: s = 4,
      referenceOverflowThreshold: l = 0,
      scrollRef: c,
      ...u
    } = lr(e, t), {
      rects: p,
      elements: {
        floating: m
      }
    } = t, b = n.current[i], x = (c == null ? void 0 : c.current) || m, v = m.clientTop || x.clientTop, y = m.clientTop !== 0, w = x.clientTop !== 0, P = m === x;
    if (process.env.NODE_ENV !== "production" && (t.placement.startsWith("bottom") || $1('`placement` side must be "bottom" when using the `inner`', "middleware.")), !b)
      return {};
    const S = {
      ...t,
      ...await Gp(-b.offsetTop - m.clientTop - p.reference.height / 2 - b.offsetHeight / 2 - o).fn(t)
    }, _ = await ai(Fu(S, x.scrollHeight + v + m.clientTop), u), h = await ai(S, {
      ...u,
      elementContext: "reference"
    }), G = Ke(0, _.top), U = S.y + G, te = (x.scrollHeight > x.clientHeight ? (X) => X : Dr)(Ke(0, x.scrollHeight + (y && P || w ? v * 2 : 0) - G - Ke(0, _.bottom)));
    if (x.style.maxHeight = te + "px", x.scrollTop = G, a) {
      const X = x.offsetHeight < b.offsetHeight * _n(s, n.current.length) - 1 || h.top >= -l || h.bottom >= -l;
      ja.flushSync(() => a(X));
    }
    return r && (r.current = await ai(Fu({
      ...S,
      y: U
    }, x.offsetHeight + v + m.clientTop), u)), {
      y: U
    };
  }
});
function Z1(e, t) {
  const {
    open: n,
    elements: r
  } = e, {
    enabled: a = !0,
    overflowRef: o,
    scrollRef: i,
    onChange: s
  } = t, l = Vp(s), c = ie.useRef(!1), u = ie.useRef(null), p = ie.useRef(null);
  ie.useEffect(() => {
    if (!a) return;
    function b(v) {
      if (v.ctrlKey || !x || o.current == null)
        return;
      const y = v.deltaY, w = o.current.top >= -0.5, P = o.current.bottom >= -0.5, S = x.scrollHeight - x.clientHeight, _ = y < 0 ? -1 : 1, h = y < 0 ? "max" : "min";
      x.scrollHeight <= x.clientHeight || (!w && y > 0 || !P && y < 0 ? (v.preventDefault(), ja.flushSync(() => {
        l((G) => G + Math[h](y, S * _));
      })) : /firefox/i.test(q0()) && (x.scrollTop += y));
    }
    const x = (i == null ? void 0 : i.current) || r.floating;
    if (n && x)
      return x.addEventListener("wheel", b), requestAnimationFrame(() => {
        u.current = x.scrollTop, o.current != null && (p.current = {
          ...o.current
        });
      }), () => {
        u.current = null, p.current = null, x.removeEventListener("wheel", b);
      };
  }, [a, n, r.floating, o, i, l]);
  const m = ie.useMemo(() => ({
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
      const b = (i == null ? void 0 : i.current) || r.floating;
      if (!(!o.current || !b || !c.current)) {
        if (u.current !== null) {
          const x = b.scrollTop - u.current;
          (o.current.bottom < -0.5 && x < -1 || o.current.top < -0.5 && x > 1) && ja.flushSync(() => l((v) => v + x));
        }
        requestAnimationFrame(() => {
          u.current = b.scrollTop;
        });
      }
    }
  }), [r.floating, l, o, i]);
  return ie.useMemo(() => a ? {
    floating: m
  } : {}, [a, m]);
}
let Jr = at({ styles: void 0, setReference: () => {
}, setFloating: () => {
}, getReferenceProps: () => ({}), getFloatingProps: () => ({}), slot: {} });
Jr.displayName = "FloatingContext";
let yl = at(null);
yl.displayName = "PlacementContext";
function Q1(e) {
  return ze(() => e ? typeof e == "string" ? { to: e } : e : null, [e]);
}
function ex() {
  return Ue(Jr).setReference;
}
function tx() {
  let { getFloatingProps: e, slot: t } = Ue(Jr);
  return Be((...n) => Object.assign({}, e(...n), { "data-anchor": t.anchor }), [e, t]);
}
function nx(e = null) {
  e === !1 && (e = null), typeof e == "string" && (e = { to: e });
  let t = Ue(yl), n = ze(() => e, [JSON.stringify(e, (a, o) => {
    var i;
    return (i = o == null ? void 0 : o.outerHTML) != null ? i : o;
  })]);
  Ye(() => {
    t == null || t(n ?? null);
  }, [t, n]);
  let r = Ue(Jr);
  return ze(() => [r.setFloating, e ? r.styles : {}], [r.setFloating, e, r.styles]);
}
let Ru = 4;
function rx({ children: e, enabled: t = !0 }) {
  let [n, r] = $e(null), [a, o] = $e(0), i = xe(null), [s, l] = $e(null);
  ax(s);
  let c = t && n !== null && s !== null, { to: u = "bottom", gap: p = 0, offset: m = 0, padding: b = 0, inner: x } = ox(n, s), [v, y = "center"] = u.split(" ");
  Ye(() => {
    c && o(0);
  }, [c]);
  let { refs: w, floatingStyles: P, context: S } = K1({ open: c, placement: v === "selection" ? y === "center" ? "bottom" : `bottom-${y}` : y === "center" ? `${v}` : `${v}-${y}`, strategy: "absolute", transform: !1, middleware: [Gp({ mainAxis: v === "selection" ? 0 : p, crossAxis: m }), N1({ padding: b }), v !== "selection" && I1({ padding: b }), v === "selection" && x ? J1({ ...x, padding: b, overflowRef: i, offset: a, minItemsVisible: Ru, referenceOverflowThreshold: b, onFallbackChange(Q) {
    var B, oe;
    if (!Q) return;
    let q = S.elements.floating;
    if (!q) return;
    let J = parseFloat(getComputedStyle(q).scrollPaddingBottom) || 0, Y = Math.min(Ru, q.childElementCount), M = 0, K = 0;
    for (let z of (oe = (B = S.elements.floating) == null ? void 0 : B.childNodes) != null ? oe : []) if (z instanceof HTMLElement) {
      let g = z.offsetTop, d = g + z.clientHeight + J, E = q.scrollTop, A = E + q.clientHeight;
      if (g >= E && d <= A) Y--;
      else {
        K = Math.max(0, Math.min(d, A) - Math.max(g, E)), M = z.clientHeight;
        break;
      }
    }
    Y >= 1 && o((z) => {
      let g = M * Y - K + J;
      return z >= g ? z : g;
    });
  } }) : null, j1({ padding: b, apply({ availableWidth: Q, availableHeight: B, elements: oe }) {
    Object.assign(oe.floating.style, { overflow: "auto", maxWidth: `${Q}px`, maxHeight: `min(var(--anchor-max-height, 100vh), ${B}px)` });
  } })].filter(Boolean), whileElementsMounted: P1 }), [_ = v, h = y] = S.placement.split("-");
  v === "selection" && (_ = "selection");
  let G = ze(() => ({ anchor: [_, h].filter(Boolean).join(" ") }), [_, h]), U = Z1(S, { overflowRef: i, onChange: o }), { getReferenceProps: te, getFloatingProps: X } = X1([U]), Z = ve((Q) => {
    l(Q), w.setFloating(Q);
  });
  return ie.createElement(yl.Provider, { value: r }, ie.createElement(Jr.Provider, { value: { setFloating: Z, setReference: w.setReference, styles: P, getReferenceProps: te, getFloatingProps: X, slot: G } }, e));
}
function ax(e) {
  Ye(() => {
    if (!e) return;
    let t = new MutationObserver(() => {
      let n = window.getComputedStyle(e).maxHeight, r = parseFloat(n);
      if (isNaN(r)) return;
      let a = parseInt(n);
      isNaN(a) || r !== a && (e.style.maxHeight = `${Math.ceil(r)}px`);
    });
    return t.observe(e, { attributes: !0, attributeFilter: ["style"] }), () => {
      t.disconnect();
    };
  }, [e]);
}
function ox(e, t) {
  var n, r, a;
  let o = si((n = e == null ? void 0 : e.gap) != null ? n : "var(--anchor-gap, 0)", t), i = si((r = e == null ? void 0 : e.offset) != null ? r : "var(--anchor-offset, 0)", t), s = si((a = e == null ? void 0 : e.padding) != null ? a : "var(--anchor-padding, 0)", t);
  return { ...e, gap: o, offset: i, padding: s };
}
function si(e, t, n = void 0) {
  let r = ro(), a = ve((l, c) => {
    if (l == null) return [n, null];
    if (typeof l == "number") return [l, null];
    if (typeof l == "string") {
      if (!c) return [n, null];
      let u = Lu(l, c);
      return [u, (p) => {
        let m = Up(l);
        {
          let b = m.map((x) => window.getComputedStyle(c).getPropertyValue(x));
          r.requestAnimationFrame(function x() {
            r.nextFrame(x);
            let v = !1;
            for (let [w, P] of m.entries()) {
              let S = window.getComputedStyle(c).getPropertyValue(P);
              if (b[w] !== S) {
                b[w] = S, v = !0;
                break;
              }
            }
            if (!v) return;
            let y = Lu(l, c);
            u !== y && (p(y), u = y);
          });
        }
        return r.dispose;
      }];
    }
    return [n, null];
  }), o = ze(() => a(e, t)[0], [e, t]), [i = o, s] = $e();
  return Ye(() => {
    let [l, c] = a(e, t);
    if (s(l), !!c) return c(s);
  }, [e, t]), i;
}
function Up(e) {
  let t = /var\((.*)\)/.exec(e);
  if (t) {
    let n = t[1].indexOf(",");
    if (n === -1) return [t[1]];
    let r = t[1].slice(0, n).trim(), a = t[1].slice(n + 1).trim();
    return a ? [r, ...Up(a)] : [r];
  }
  return [];
}
function Lu(e, t) {
  let n = document.createElement("div");
  t.appendChild(n), n.style.setProperty("margin-top", "0px", "important"), n.style.setProperty("margin-top", e, "important");
  let r = parseFloat(window.getComputedStyle(n).marginTop) || 0;
  return t.removeChild(n), r;
}
let co = at(null);
co.displayName = "OpenClosedContext";
var ot = ((e) => (e[e.Open = 1] = "Open", e[e.Closed = 2] = "Closed", e[e.Closing = 4] = "Closing", e[e.Opening = 8] = "Opening", e))(ot || {});
function uo() {
  return Ue(co);
}
function qp({ value: e, children: t }) {
  return ue.createElement(co.Provider, { value: e }, t);
}
function ix({ children: e }) {
  return ue.createElement(co.Provider, { value: null }, e);
}
function sx(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
function lx(e) {
  let t = ve(e), n = xe(!1);
  Le(() => (n.current = !1, () => {
    n.current = !0, xp(() => {
      n.current && t();
    });
  }), [t]);
}
function cx() {
  let e = typeof document > "u";
  return "useSyncExternalStore" in ie ? ((t) => t.useSyncExternalStore)(ie)(() => () => {
  }, () => !1, () => !e) : !1;
}
function bl() {
  let e = cx(), [t, n] = ie.useState(On.isHandoffComplete);
  return t && On.isHandoffComplete === !1 && n(!1), ie.useEffect(() => {
    t !== !0 && n(!0);
  }, [t]), ie.useEffect(() => On.handoff(), []), e ? !1 : t;
}
let ux = at(!1);
function fx() {
  return Ue(ux);
}
function dx(e) {
  let t = fx(), n = Ue(Xp), [r, a] = $e(() => {
    var o;
    if (!t && n !== null) return (o = n.current) != null ? o : null;
    if (On.isServer) return null;
    let i = e == null ? void 0 : e.getElementById("headlessui-portal-root");
    if (i) return i;
    if (e === null) return null;
    let s = e.createElement("div");
    return s.setAttribute("id", "headlessui-portal-root"), e.body.appendChild(s);
  });
  return Le(() => {
    r !== null && (e != null && e.body.contains(r) || e == null || e.body.appendChild(r));
  }, [r, e]), Le(() => {
    t || n !== null && a(n.current);
  }, [n, a, t]), r;
}
let Kp = Rt, px = lt(function(e, t) {
  let { ownerDocument: n = null, ...r } = e, a = xe(null), o = pt(Op((b) => {
    a.current = b;
  }), t), i = nr(a), s = n ?? i, l = dx(s), [c] = $e(() => {
    var b;
    return On.isServer ? null : (b = s == null ? void 0 : s.createElement("div")) != null ? b : null;
  }), u = Ue(us), p = bl();
  Ye(() => {
    !l || !c || l.contains(c) || (c.setAttribute("data-headlessui-portal", ""), l.appendChild(c));
  }, [l, c]), Ye(() => {
    if (c && u) return u.register(c);
  }, [u, c]), lx(() => {
    var b;
    !l || !c || (c instanceof Node && l.contains(c) && l.removeChild(c), l.childNodes.length <= 0 && ((b = l.parentElement) == null || b.removeChild(l)));
  });
  let m = gt();
  return p ? !l || !c ? null : Jh(m({ ourProps: { ref: o }, theirProps: r, slot: {}, defaultTag: Kp, name: "Portal" }), c) : null;
});
function mx(e, t) {
  let n = pt(t), { enabled: r = !0, ownerDocument: a, ...o } = e, i = gt();
  return r ? ue.createElement(px, { ...o, ownerDocument: a, ref: n }) : i({ ourProps: { ref: n }, theirProps: o, slot: {}, defaultTag: Kp, name: "Portal" });
}
let gx = Rt, Xp = at(null);
function hx(e, t) {
  let { target: n, ...r } = e, a = { ref: pt(t) }, o = gt();
  return ue.createElement(Xp.Provider, { value: n }, o({ ourProps: a, theirProps: r, defaultTag: gx, name: "Popover.Group" }));
}
let us = at(null);
function yx() {
  let e = Ue(us), t = xe([]), n = ve((o) => (t.current.push(o), e && e.register(o), () => r(o))), r = ve((o) => {
    let i = t.current.indexOf(o);
    i !== -1 && t.current.splice(i, 1), e && e.unregister(o);
  }), a = ze(() => ({ register: n, unregister: r, portals: t }), [n, r, t]);
  return [t, ze(() => function({ children: o }) {
    return ue.createElement(us.Provider, { value: a }, o);
  }, [a])];
}
let bx = lt(mx), vx = lt(hx), xx = Object.assign(bx, { Group: vx });
function wx({ defaultContainers: e = [], portals: t, mainTreeNode: n } = {}) {
  let r = nr(n), a = ve(() => {
    var o, i;
    let s = [];
    for (let l of e) l !== null && (l instanceof HTMLElement ? s.push(l) : "current" in l && l.current instanceof HTMLElement && s.push(l.current));
    if (t != null && t.current) for (let l of t.current) s.push(l);
    for (let l of (o = r == null ? void 0 : r.querySelectorAll("html > *, body > *")) != null ? o : []) l !== document.body && l !== document.head && l instanceof HTMLElement && l.id !== "headlessui-portal-root" && (n && (l.contains(n) || l.contains((i = n == null ? void 0 : n.getRootNode()) == null ? void 0 : i.host)) || s.some((c) => l.contains(c)) || s.push(l));
    return s;
  });
  return { resolveContainers: a, contains: ve((o) => a().some((i) => i.contains(o))) };
}
let Jp = at(null);
function Zp({ children: e, node: t }) {
  let [n, r] = $e(null), a = Qp(t ?? n);
  return ue.createElement(Jp.Provider, { value: a }, e, a === null && ue.createElement(za, { features: Rr.Hidden, ref: (o) => {
    var i, s;
    if (o) {
      for (let l of (s = (i = qr(o)) == null ? void 0 : i.querySelectorAll("html > *, body > *")) != null ? s : []) if (l !== document.body && l !== document.head && l instanceof HTMLElement && l != null && l.contains(o)) {
        r(l);
        break;
      }
    }
  } }));
}
function Qp(e = null) {
  var t;
  return (t = Ue(Jp)) != null ? t : e;
}
function Ex() {
  let e = xe(!1);
  return Ye(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
}
var Ft = ((e) => (e[e.Forwards = 0] = "Forwards", e[e.Backwards = 1] = "Backwards", e))(Ft || {});
function em() {
  let e = xe(0);
  return Np(!0, "keydown", (t) => {
    t.key === "Tab" && (e.current = t.shiftKey ? 1 : 0);
  }, !0), e;
}
function tm(e) {
  var t;
  return !!(e.enter || e.enterFrom || e.enterTo || e.leave || e.leaveFrom || e.leaveTo) || ((t = e.as) != null ? t : rm) !== Rt || ue.Children.count(e.children) === 1;
}
let fo = at(null);
fo.displayName = "TransitionContext";
var kx = ((e) => (e.Visible = "visible", e.Hidden = "hidden", e))(kx || {});
function Px() {
  let e = Ue(fo);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
function Ox() {
  let e = Ue(po);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
let po = at(null);
po.displayName = "NestingContext";
function mo(e) {
  return "children" in e ? mo(e.children) : e.current.filter(({ el: t }) => t.current !== null).filter(({ state: t }) => t === "visible").length > 0;
}
function nm(e, t) {
  let n = zt(e), r = xe([]), a = Ex(), o = ro(), i = ve((b, x = nn.Hidden) => {
    let v = r.current.findIndex(({ el: y }) => y === b);
    v !== -1 && (dt(x, { [nn.Unmount]() {
      r.current.splice(v, 1);
    }, [nn.Hidden]() {
      r.current[v].state = "hidden";
    } }), o.microTask(() => {
      var y;
      !mo(r) && a.current && ((y = n.current) == null || y.call(n));
    }));
  }), s = ve((b) => {
    let x = r.current.find(({ el: v }) => v === b);
    return x ? x.state !== "visible" && (x.state = "visible") : r.current.push({ el: b, state: "visible" }), () => i(b, nn.Unmount);
  }), l = xe([]), c = xe(Promise.resolve()), u = xe({ enter: [], leave: [] }), p = ve((b, x, v) => {
    l.current.splice(0), t && (t.chains.current[x] = t.chains.current[x].filter(([y]) => y !== b)), t == null || t.chains.current[x].push([b, new Promise((y) => {
      l.current.push(y);
    })]), t == null || t.chains.current[x].push([b, new Promise((y) => {
      Promise.all(u.current[x].map(([w, P]) => P)).then(() => y());
    })]), x === "enter" ? c.current = c.current.then(() => t == null ? void 0 : t.wait.current).then(() => v(x)) : v(x);
  }), m = ve((b, x, v) => {
    Promise.all(u.current[x].splice(0).map(([y, w]) => w)).then(() => {
      var y;
      (y = l.current.shift()) == null || y();
    }).then(() => v(x));
  });
  return ze(() => ({ children: r, register: s, unregister: i, onStart: p, onStop: m, wait: c, chains: u }), [s, i, r, p, m, u, c]);
}
let rm = Rt, am = tr.RenderStrategy;
function Sx(e, t) {
  var n, r;
  let { transition: a = !0, beforeEnter: o, afterEnter: i, beforeLeave: s, afterLeave: l, enter: c, enterFrom: u, enterTo: p, entered: m, leave: b, leaveFrom: x, leaveTo: v, ...y } = e, [w, P] = $e(null), S = xe(null), _ = tm(e), h = pt(..._ ? [S, t, P] : t === null ? [] : [t]), G = (n = y.unmount) == null || n ? nn.Unmount : nn.Hidden, { show: U, appear: te, initial: X } = Px(), [Z, Q] = $e(U ? "visible" : "hidden"), B = Ox(), { register: oe, unregister: q } = B;
  Ye(() => oe(S), [oe, S]), Ye(() => {
    if (G === nn.Hidden && S.current) {
      if (U && Z !== "visible") {
        Q("visible");
        return;
      }
      return dt(Z, { hidden: () => q(S), visible: () => oe(S) });
    }
  }, [Z, S, oe, q, U, G]);
  let J = bl();
  Ye(() => {
    if (_ && J && Z === "visible" && S.current === null) throw new Error("Did you forget to passthrough the `ref` to the actual DOM node?");
  }, [S, Z, J, _]);
  let Y = X && !te, M = te && U && X, K = xe(!1), z = nm(() => {
    K.current || (Q("hidden"), q(S));
  }, B), g = ve((N) => {
    K.current = !0;
    let F = N ? "enter" : "leave";
    z.onStart(S, F, (L) => {
      L === "enter" ? o == null || o() : L === "leave" && (s == null || s());
    });
  }), d = ve((N) => {
    let F = N ? "enter" : "leave";
    K.current = !1, z.onStop(S, F, (L) => {
      L === "enter" ? i == null || i() : L === "leave" && (l == null || l());
    }), F === "leave" && !mo(z) && (Q("hidden"), q(S));
  });
  Le(() => {
    _ && a || (g(U), d(U));
  }, [U, _, a]);
  let E = !(!a || !_ || !J || Y), [, A] = dl(E, w, U, { start: g, end: d }), C = bn({ ref: h, className: ((r = os(y.className, M && c, M && u, A.enter && c, A.enter && A.closed && u, A.enter && !A.closed && p, A.leave && b, A.leave && !A.closed && x, A.leave && A.closed && v, !A.transition && U && m)) == null ? void 0 : r.trim()) || void 0, ...fl(A) }), T = 0;
  Z === "visible" && (T |= ot.Open), Z === "hidden" && (T |= ot.Closed), U && Z === "hidden" && (T |= ot.Opening), !U && Z === "visible" && (T |= ot.Closing);
  let I = gt();
  return ue.createElement(po.Provider, { value: z }, ue.createElement(qp, { value: T }, I({ ourProps: C, theirProps: y, defaultTag: rm, features: am, visible: Z === "visible", name: "Transition.Child" })));
}
function Ax(e, t) {
  let { show: n, appear: r = !1, unmount: a = !0, ...o } = e, i = xe(null), s = tm(e), l = pt(...s ? [i, t] : t === null ? [] : [t]);
  bl();
  let c = uo();
  if (n === void 0 && c !== null && (n = (c & ot.Open) === ot.Open), n === void 0) throw new Error("A <Transition /> is used but it is missing a `show={true | false}` prop.");
  let [u, p] = $e(n ? "visible" : "hidden"), m = nm(() => {
    n || p("hidden");
  }), [b, x] = $e(!0), v = xe([n]);
  Ye(() => {
    b !== !1 && v.current[v.current.length - 1] !== n && (v.current.push(n), x(!1));
  }, [v, n]);
  let y = ze(() => ({ show: n, appear: r, initial: b }), [n, r, b]);
  Ye(() => {
    n ? p("visible") : !mo(m) && i.current !== null && p("hidden");
  }, [n, m]);
  let w = { unmount: a }, P = ve(() => {
    var h;
    b && x(!1), (h = e.beforeEnter) == null || h.call(e);
  }), S = ve(() => {
    var h;
    b && x(!1), (h = e.beforeLeave) == null || h.call(e);
  }), _ = gt();
  return ue.createElement(po.Provider, { value: m }, ue.createElement(fo.Provider, { value: y }, _({ ourProps: { ...w, as: Rt, children: ue.createElement(om, { ref: l, ...w, ...o, beforeEnter: P, beforeLeave: S }) }, theirProps: {}, defaultTag: Rt, features: am, visible: u === "visible", name: "Transition" })));
}
function Cx(e, t) {
  let n = Ue(fo) !== null, r = uo() !== null;
  return ue.createElement(ue.Fragment, null, !n && r ? ue.createElement(fs, { ref: t, ...e }) : ue.createElement(om, { ref: t, ...e }));
}
let fs = lt(Ax), om = lt(Sx), _x = lt(Cx), Tx = Object.assign(fs, { Child: _x, Root: fs });
var Nx = ((e) => (e[e.Open = 0] = "Open", e[e.Closed = 1] = "Closed", e))(Nx || {}), Ix = ((e) => (e[e.TogglePopover = 0] = "TogglePopover", e[e.ClosePopover = 1] = "ClosePopover", e[e.SetButton = 2] = "SetButton", e[e.SetButtonId = 3] = "SetButtonId", e[e.SetPanel = 4] = "SetPanel", e[e.SetPanelId = 5] = "SetPanelId", e))(Ix || {});
let jx = { 0: (e) => ({ ...e, popoverState: dt(e.popoverState, { 0: 1, 1: 0 }), __demoMode: !1 }), 1(e) {
  return e.popoverState === 1 ? e : { ...e, popoverState: 1, __demoMode: !1 };
}, 2(e, t) {
  return e.button === t.button ? e : { ...e, button: t.button };
}, 3(e, t) {
  return e.buttonId === t.buttonId ? e : { ...e, buttonId: t.buttonId };
}, 4(e, t) {
  return e.panel === t.panel ? e : { ...e, panel: t.panel };
}, 5(e, t) {
  return e.panelId === t.panelId ? e : { ...e, panelId: t.panelId };
} }, vl = at(null);
vl.displayName = "PopoverContext";
function go(e) {
  let t = Ue(vl);
  if (t === null) {
    let n = new Error(`<${e} /> is missing a parent <Popover /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(n, go), n;
  }
  return t;
}
let ho = at(null);
ho.displayName = "PopoverAPIContext";
function xl(e) {
  let t = Ue(ho);
  if (t === null) {
    let n = new Error(`<${e} /> is missing a parent <Popover /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(n, xl), n;
  }
  return t;
}
let wl = at(null);
wl.displayName = "PopoverGroupContext";
function im() {
  return Ue(wl);
}
let yo = at(null);
yo.displayName = "PopoverPanelContext";
function Mx() {
  return Ue(yo);
}
function Fx(e, t) {
  return dt(t.type, jx, e, t);
}
let Rx = "div";
function Lx(e, t) {
  var n;
  let { __demoMode: r = !1, ...a } = e, o = xe(null), i = pt(t, Op((z) => {
    o.current = z;
  })), s = xe([]), l = xd(Fx, { __demoMode: r, popoverState: r ? 0 : 1, buttons: s, button: null, buttonId: null, panel: null, panelId: null, beforePanelSentinel: $o(), afterPanelSentinel: $o(), afterButtonSentinel: $o() }), [{ popoverState: c, button: u, buttonId: p, panel: m, panelId: b, beforePanelSentinel: x, afterPanelSentinel: v, afterButtonSentinel: y }, w] = l, P = nr((n = o.current) != null ? n : u), S = ze(() => {
    if (!u || !m) return !1;
    for (let T of document.querySelectorAll("body > *")) if (Number(T == null ? void 0 : T.contains(u)) ^ Number(T == null ? void 0 : T.contains(m))) return !0;
    let z = ao(), g = z.indexOf(u), d = (g + z.length - 1) % z.length, E = (g + 1) % z.length, A = z[d], C = z[E];
    return !m.contains(A) && !m.contains(C);
  }, [u, m]), _ = zt(p), h = zt(b), G = ze(() => ({ buttonId: _, panelId: h, close: () => w({ type: 1 }) }), [_, h, w]), U = im(), te = U == null ? void 0 : U.registerPopover, X = ve(() => {
    var z;
    return (z = U == null ? void 0 : U.isFocusWithinPopoverGroup()) != null ? z : (P == null ? void 0 : P.activeElement) && ((u == null ? void 0 : u.contains(P.activeElement)) || (m == null ? void 0 : m.contains(P.activeElement)));
  });
  Le(() => te == null ? void 0 : te(G), [te, G]);
  let [Z, Q] = yx(), B = Qp(u), oe = wx({ mainTreeNode: B, portals: Z, defaultContainers: [u, m] });
  j0(P == null ? void 0 : P.defaultView, "focus", (z) => {
    var g, d, E, A, C, T;
    z.target !== window && z.target instanceof HTMLElement && c === 0 && (X() || u && m && (oe.contains(z.target) || (d = (g = x.current) == null ? void 0 : g.contains) != null && d.call(g, z.target) || (A = (E = v.current) == null ? void 0 : E.contains) != null && A.call(E, z.target) || (T = (C = y.current) == null ? void 0 : C.contains) != null && T.call(C, z.target) || w({ type: 1 })));
  }, !0), I0(c === 0, oe.resolveContainers, (z, g) => {
    w({ type: 1 }), _p(g, ul.Loose) || (z.preventDefault(), u == null || u.focus());
  });
  let q = ve((z) => {
    w({ type: 1 });
    let g = z ? z instanceof HTMLElement ? z : "current" in z && z.current instanceof HTMLElement ? z.current : u : u;
    g == null || g.focus();
  }), J = ze(() => ({ close: q, isPortalled: S }), [q, S]), Y = ze(() => ({ open: c === 0, close: q }), [c, q]), M = { ref: i }, K = gt();
  return ue.createElement(Zp, { node: B }, ue.createElement(rx, null, ue.createElement(yo.Provider, { value: null }, ue.createElement(vl.Provider, { value: l }, ue.createElement(ho.Provider, { value: J }, ue.createElement(y0, { value: q }, ue.createElement(qp, { value: dt(c, { 0: ot.Open, 1: ot.Closed }) }, ue.createElement(Q, null, K({ ourProps: M, theirProps: a, slot: Y, defaultTag: Rx, name: "Popover" })))))))));
}
let Dx = "button";
function zx(e, t) {
  let n = jr(), { id: r = `headlessui-popover-button-${n}`, disabled: a = !1, autoFocus: o = !1, ...i } = e, [s, l] = go("Popover.Button"), { isPortalled: c } = xl("Popover.Button"), u = xe(null), p = `headlessui-focus-sentinel-${jr()}`, m = im(), b = m == null ? void 0 : m.closeOthers, x = Mx() !== null;
  Le(() => {
    if (!x) return l({ type: 3, buttonId: r }), () => {
      l({ type: 3, buttonId: null });
    };
  }, [x, r, l]);
  let [v] = $e(() => Symbol()), y = pt(u, t, ex(), ve((g) => {
    if (!x) {
      if (g) s.buttons.current.push(v);
      else {
        let d = s.buttons.current.indexOf(v);
        d !== -1 && s.buttons.current.splice(d, 1);
      }
      s.buttons.current.length > 1 && console.warn("You are already using a <Popover.Button /> but only 1 <Popover.Button /> is supported."), g && l({ type: 2, button: g });
    }
  })), w = pt(u, t), P = nr(u), S = ve((g) => {
    var d, E, A;
    if (x) {
      if (s.popoverState === 1) return;
      switch (g.key) {
        case tn.Space:
        case tn.Enter:
          g.preventDefault(), (E = (d = g.target).click) == null || E.call(d), l({ type: 1 }), (A = s.button) == null || A.focus();
          break;
      }
    } else switch (g.key) {
      case tn.Space:
      case tn.Enter:
        g.preventDefault(), g.stopPropagation(), s.popoverState === 1 && (b == null || b(s.buttonId)), l({ type: 0 });
        break;
      case tn.Escape:
        if (s.popoverState !== 0) return b == null ? void 0 : b(s.buttonId);
        if (!u.current || P != null && P.activeElement && !u.current.contains(P.activeElement)) return;
        g.preventDefault(), g.stopPropagation(), l({ type: 1 });
        break;
    }
  }), _ = ve((g) => {
    x || g.key === tn.Space && g.preventDefault();
  }), h = ve((g) => {
    var d, E;
    kp(g.currentTarget) || a || (x ? (l({ type: 1 }), (d = s.button) == null || d.focus()) : (g.preventDefault(), g.stopPropagation(), s.popoverState === 1 && (b == null || b(s.buttonId)), l({ type: 0 }), (E = s.button) == null || E.focus()));
  }), G = ve((g) => {
    g.preventDefault(), g.stopPropagation();
  }), { isFocusVisible: U, focusProps: te } = n0({ autoFocus: o }), { isHovered: X, hoverProps: Z } = t0({ isDisabled: a }), { pressed: Q, pressProps: B } = l0({ disabled: a }), oe = s.popoverState === 0, q = ze(() => ({ open: oe, active: Q || oe, disabled: a, hover: X, focus: U, autofocus: o }), [oe, X, U, Q, a, o]), J = M0(e, s.button), Y = Ep(x ? { ref: w, type: J, onKeyDown: S, onClick: h, disabled: a || void 0, autoFocus: o } : { ref: y, id: s.buttonId, type: J, "aria-expanded": s.popoverState === 0, "aria-controls": s.panel ? s.panelId : void 0, disabled: a || void 0, autoFocus: o, onKeyDown: S, onKeyUp: _, onClick: h, onMouseDown: G }, te, Z, B), M = em(), K = ve(() => {
    let g = s.panel;
    if (!g) return;
    function d() {
      dt(M.current, { [Ft.Forwards]: () => wn(g, Mt.First), [Ft.Backwards]: () => wn(g, Mt.Last) }) === $a.Error && wn(ao().filter((E) => E.dataset.headlessuiFocusGuard !== "true"), dt(M.current, { [Ft.Forwards]: Mt.Next, [Ft.Backwards]: Mt.Previous }), { relativeTo: s.button });
    }
    d();
  }), z = gt();
  return ue.createElement(ue.Fragment, null, z({ ourProps: Y, theirProps: i, slot: q, defaultTag: Dx, name: "Popover.Button" }), oe && !x && c && ue.createElement(za, { id: p, ref: s.afterButtonSentinel, features: Rr.Focusable, "data-headlessui-focus-guard": !0, as: "button", type: "button", onFocus: K }));
}
let $x = "div", Hx = tr.RenderStrategy | tr.Static;
function sm(e, t) {
  let n = jr(), { id: r = `headlessui-popover-backdrop-${n}`, transition: a = !1, ...o } = e, [{ popoverState: i }, s] = go("Popover.Backdrop"), [l, c] = $e(null), u = pt(t, c), p = uo(), [m, b] = dl(a, l, p !== null ? (p & ot.Open) === ot.Open : i === 0), x = ve((w) => {
    if (kp(w.currentTarget)) return w.preventDefault();
    s({ type: 1 });
  }), v = ze(() => ({ open: i === 0 }), [i]), y = { ref: u, id: r, "aria-hidden": !0, onClick: x, ...fl(b) };
  return gt()({ ourProps: y, theirProps: o, slot: v, defaultTag: $x, features: Hx, visible: m, name: "Popover.Backdrop" });
}
let Wx = "div", Bx = tr.RenderStrategy | tr.Static;
function Gx(e, t) {
  let n = jr(), { id: r = `headlessui-popover-panel-${n}`, focus: a = !1, anchor: o, portal: i = !1, modal: s = !1, transition: l = !1, ...c } = e, [u, p] = go("Popover.Panel"), { close: m, isPortalled: b } = xl("Popover.Panel"), x = `headlessui-focus-sentinel-before-${n}`, v = `headlessui-focus-sentinel-after-${n}`, y = xe(null), w = Q1(o), [P, S] = nx(w), _ = tx();
  w && (i = !0);
  let [h, G] = $e(null), U = pt(y, t, w ? P : null, ve((d) => p({ type: 4, panel: d })), G), te = nr(u.button), X = nr(y);
  Ye(() => (p({ type: 5, panelId: r }), () => {
    p({ type: 5, panelId: null });
  }), [r, p]);
  let Z = uo(), [Q, B] = dl(l, h, Z !== null ? (Z & ot.Open) === ot.Open : u.popoverState === 0);
  E0(Q, u.button, () => {
    p({ type: 1 });
  });
  let oe = u.__demoMode ? !1 : s && Q;
  $0(oe, X);
  let q = ve((d) => {
    var E;
    switch (d.key) {
      case tn.Escape:
        if (u.popoverState !== 0 || !y.current || X != null && X.activeElement && !y.current.contains(X.activeElement)) return;
        d.preventDefault(), d.stopPropagation(), p({ type: 1 }), (E = u.button) == null || E.focus();
        break;
    }
  });
  Le(() => {
    var d;
    e.static || u.popoverState === 1 && ((d = e.unmount) == null || d) && p({ type: 4, panel: null });
  }, [u.popoverState, e.unmount, e.static, p]), Le(() => {
    if (u.__demoMode || !a || u.popoverState !== 0 || !y.current) return;
    let d = X == null ? void 0 : X.activeElement;
    y.current.contains(d) || wn(y.current, Mt.First);
  }, [u.__demoMode, a, y.current, u.popoverState]);
  let J = ze(() => ({ open: u.popoverState === 0, close: m }), [u.popoverState, m]), Y = Ep(w ? _() : {}, { ref: U, id: r, onKeyDown: q, onBlur: a && u.popoverState === 0 ? (d) => {
    var E, A, C, T, I;
    let N = d.relatedTarget;
    N && y.current && ((E = y.current) != null && E.contains(N) || (p({ type: 1 }), ((C = (A = u.beforePanelSentinel.current) == null ? void 0 : A.contains) != null && C.call(A, N) || (I = (T = u.afterPanelSentinel.current) == null ? void 0 : T.contains) != null && I.call(T, N)) && N.focus({ preventScroll: !0 })));
  } : void 0, tabIndex: -1, style: { ...c.style, ...S, "--button-width": v0(u.button, !0).width }, ...fl(B) }), M = em(), K = ve(() => {
    let d = y.current;
    if (!d) return;
    function E() {
      dt(M.current, { [Ft.Forwards]: () => {
        var A;
        wn(d, Mt.First) === $a.Error && ((A = u.afterPanelSentinel.current) == null || A.focus());
      }, [Ft.Backwards]: () => {
        var A;
        (A = u.button) == null || A.focus({ preventScroll: !0 });
      } });
    }
    E();
  }), z = ve(() => {
    let d = y.current;
    if (!d) return;
    function E() {
      dt(M.current, { [Ft.Forwards]: () => {
        if (!u.button) return;
        let A = ao(), C = A.indexOf(u.button), T = A.slice(0, C + 1), I = [...A.slice(C + 1), ...T];
        for (let N of I.slice()) if (N.dataset.headlessuiFocusGuard === "true" || h != null && h.contains(N)) {
          let F = I.indexOf(N);
          F !== -1 && I.splice(F, 1);
        }
        wn(I, Mt.First, { sorted: !1 });
      }, [Ft.Backwards]: () => {
        var A;
        wn(d, Mt.Previous) === $a.Error && ((A = u.button) == null || A.focus());
      } });
    }
    E();
  }), g = gt();
  return ue.createElement(ix, null, ue.createElement(yo.Provider, { value: r }, ue.createElement(ho.Provider, { value: { close: m, isPortalled: b } }, ue.createElement(xx, { enabled: i ? e.static || Q : !1, ownerDocument: te }, Q && b && ue.createElement(za, { id: x, ref: u.beforePanelSentinel, features: Rr.Focusable, "data-headlessui-focus-guard": !0, as: "button", type: "button", onFocus: K }), g({ ourProps: Y, theirProps: c, slot: J, defaultTag: Wx, features: Bx, visible: Q, name: "Popover.Panel" }), Q && b && ue.createElement(za, { id: v, ref: u.afterPanelSentinel, features: Rr.Focusable, "data-headlessui-focus-guard": !0, as: "button", type: "button", onFocus: z })))));
}
let Yx = "div";
function Vx(e, t) {
  let n = xe(null), r = pt(n, t), [a, o] = $e([]), i = ve((v) => {
    o((y) => {
      let w = y.indexOf(v);
      if (w !== -1) {
        let P = y.slice();
        return P.splice(w, 1), P;
      }
      return y;
    });
  }), s = ve((v) => (o((y) => [...y, v]), () => i(v))), l = ve(() => {
    var v;
    let y = qr(n);
    if (!y) return !1;
    let w = y.activeElement;
    return (v = n.current) != null && v.contains(w) ? !0 : a.some((P) => {
      var S, _;
      return ((S = y.getElementById(P.buttonId.current)) == null ? void 0 : S.contains(w)) || ((_ = y.getElementById(P.panelId.current)) == null ? void 0 : _.contains(w));
    });
  }), c = ve((v) => {
    for (let y of a) y.buttonId.current !== v && y.close();
  }), u = ze(() => ({ registerPopover: s, unregisterPopover: i, isFocusWithinPopoverGroup: l, closeOthers: c }), [s, i, l, c]), p = ze(() => ({}), []), m = e, b = { ref: r }, x = gt();
  return ue.createElement(Zp, null, ue.createElement(wl.Provider, { value: u }, x({ ourProps: b, theirProps: m, slot: p, defaultTag: Yx, name: "Popover.Group" })));
}
let Ux = lt(Lx), lm = lt(zx), qx = lt(sm), Kx = lt(sm), cm = lt(Gx), Xx = lt(Vx), Jx = Object.assign(Ux, { Button: lm, Backdrop: Kx, Overlay: qx, Panel: cm, Group: Xx });
const El = "-", Zx = (e) => {
  const t = ew(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (a) => {
      const o = a.split(El);
      return o[0] === "" && o.length !== 1 && o.shift(), um(o, t) || Qx(a);
    },
    getConflictingClassGroupIds: (a, o) => {
      const i = n[a] || [];
      return o && r[a] ? [...i, ...r[a]] : i;
    }
  };
}, um = (e, t) => {
  var n;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], a = t.nextPart.get(r), o = a ? um(e.slice(1), a) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const i = e.join(El);
  return (n = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : n.classGroupId;
}, Du = /^\[(.+)\]$/, Qx = (e) => {
  if (Du.test(e)) {
    const t = Du.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, ew = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return nw(Object.entries(e.classGroups), n).forEach(([a, o]) => {
    ds(o, r, a, t);
  }), r;
}, ds = (e, t, n, r) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : zu(t, a);
      o.classGroupId = n;
      return;
    }
    if (typeof a == "function") {
      if (tw(a)) {
        ds(a(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: n
      });
      return;
    }
    Object.entries(a).forEach(([o, i]) => {
      ds(i, zu(t, o), n, r);
    });
  });
}, zu = (e, t) => {
  let n = e;
  return t.split(El).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, tw = (e) => e.isThemeGetter, nw = (e, t) => t ? e.map(([n, r]) => {
  const a = r.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([i, s]) => [t + i, s])) : o);
  return [n, a];
}) : e, rw = (e) => {
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
}, fm = "!", aw = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, a = t[0], o = t.length, i = (s) => {
    const l = [];
    let c = 0, u = 0, p;
    for (let y = 0; y < s.length; y++) {
      let w = s[y];
      if (c === 0) {
        if (w === a && (r || s.slice(y, y + o) === t)) {
          l.push(s.slice(u, y)), u = y + o;
          continue;
        }
        if (w === "/") {
          p = y;
          continue;
        }
      }
      w === "[" ? c++ : w === "]" && c--;
    }
    const m = l.length === 0 ? s : s.substring(u), b = m.startsWith(fm), x = b ? m.substring(1) : m, v = p && p > u ? p - u : void 0;
    return {
      modifiers: l,
      hasImportantModifier: b,
      baseClassName: x,
      maybePostfixModifierPosition: v
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, ow = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, iw = (e) => ({
  cache: rw(e.cacheSize),
  parseClassName: aw(e),
  ...Zx(e)
}), sw = /\s+/, lw = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: a
  } = t, o = [], i = e.trim().split(sw);
  let s = "";
  for (let l = i.length - 1; l >= 0; l -= 1) {
    const c = i[l], {
      modifiers: u,
      hasImportantModifier: p,
      baseClassName: m,
      maybePostfixModifierPosition: b
    } = n(c);
    let x = !!b, v = r(x ? m.substring(0, b) : m);
    if (!v) {
      if (!x) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (v = r(m), !v) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      x = !1;
    }
    const y = ow(u).join(":"), w = p ? y + fm : y, P = w + v;
    if (o.includes(P))
      continue;
    o.push(P);
    const S = a(v, x);
    for (let _ = 0; _ < S.length; ++_) {
      const h = S[_];
      o.push(w + h);
    }
    s = c + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function cw() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = dm(t)) && (r && (r += " "), r += n);
  return r;
}
const dm = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = dm(e[r])) && (n && (n += " "), n += t);
  return n;
};
function uw(e, ...t) {
  let n, r, a, o = i;
  function i(l) {
    const c = t.reduce((u, p) => p(u), e());
    return n = iw(c), r = n.cache.get, a = n.cache.set, o = s, s(l);
  }
  function s(l) {
    const c = r(l);
    if (c)
      return c;
    const u = lw(l, n);
    return a(l, u), u;
  }
  return function() {
    return o(cw.apply(null, arguments));
  };
}
const Te = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, pm = /^\[(?:([a-z-]+):)?(.+)\]$/i, fw = /^\d+\/\d+$/, dw = /* @__PURE__ */ new Set(["px", "full", "screen"]), pw = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, mw = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, gw = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, hw = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, yw = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Nt = (e) => Xn(e) || dw.has(e) || fw.test(e), Kt = (e) => cr(e, "length", Ow), Xn = (e) => !!e && !Number.isNaN(Number(e)), li = (e) => cr(e, "number", Xn), br = (e) => !!e && Number.isInteger(Number(e)), bw = (e) => e.endsWith("%") && Xn(e.slice(0, -1)), pe = (e) => pm.test(e), Xt = (e) => pw.test(e), vw = /* @__PURE__ */ new Set(["length", "size", "percentage"]), xw = (e) => cr(e, vw, mm), ww = (e) => cr(e, "position", mm), Ew = /* @__PURE__ */ new Set(["image", "url"]), kw = (e) => cr(e, Ew, Aw), Pw = (e) => cr(e, "", Sw), vr = () => !0, cr = (e, t, n) => {
  const r = pm.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, Ow = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  mw.test(e) && !gw.test(e)
), mm = () => !1, Sw = (e) => hw.test(e), Aw = (e) => yw.test(e), Cw = () => {
  const e = Te("colors"), t = Te("spacing"), n = Te("blur"), r = Te("brightness"), a = Te("borderColor"), o = Te("borderRadius"), i = Te("borderSpacing"), s = Te("borderWidth"), l = Te("contrast"), c = Te("grayscale"), u = Te("hueRotate"), p = Te("invert"), m = Te("gap"), b = Te("gradientColorStops"), x = Te("gradientColorStopPositions"), v = Te("inset"), y = Te("margin"), w = Te("opacity"), P = Te("padding"), S = Te("saturate"), _ = Te("scale"), h = Te("sepia"), G = Te("skew"), U = Te("space"), te = Te("translate"), X = () => ["auto", "contain", "none"], Z = () => ["auto", "hidden", "clip", "visible", "scroll"], Q = () => ["auto", pe, t], B = () => [pe, t], oe = () => ["", Nt, Kt], q = () => ["auto", Xn, pe], J = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], Y = () => ["solid", "dashed", "dotted", "double", "none"], M = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], K = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], z = () => ["", "0", pe], g = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], d = () => [Xn, pe];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [vr],
      spacing: [Nt, Kt],
      blur: ["none", "", Xt, pe],
      brightness: d(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Xt, pe],
      borderSpacing: B(),
      borderWidth: oe(),
      contrast: d(),
      grayscale: z(),
      hueRotate: d(),
      invert: z(),
      gap: B(),
      gradientColorStops: [e],
      gradientColorStopPositions: [bw, Kt],
      inset: Q(),
      margin: Q(),
      opacity: d(),
      padding: B(),
      saturate: d(),
      scale: d(),
      sepia: z(),
      skew: d(),
      space: B(),
      translate: B()
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
        columns: [Xt]
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
        object: [...J(), pe]
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
        overscroll: X()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": X()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": X()
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
        z: ["auto", br, pe]
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
        order: ["first", "last", "none", br, pe]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [vr]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", br, pe]
        }, pe]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": q()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": q()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [vr]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [br, pe]
        }, pe]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": q()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": q()
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
        gap: [m]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [m]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [m]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...K()]
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
        content: ["normal", ...K(), "baseline"]
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
        "place-content": [...K(), "baseline"]
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
        p: [P]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [P]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [P]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [P]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [P]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [P]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [P]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [P]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [P]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [y]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [y]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [y]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [y]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [y]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [y]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [y]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [y]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [y]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [U]
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
        "space-y": [U]
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
          screen: [Xt]
        }, Xt]
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
        text: ["base", Xt, Kt]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", li]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [vr]
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
        "line-clamp": ["none", Xn, li]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Nt, pe]
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
        "placeholder-opacity": [w]
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
        "text-opacity": [w]
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
        decoration: ["auto", "from-font", Nt, Kt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Nt, pe]
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
        indent: B()
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
        "bg-opacity": [w]
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
        bg: [...J(), ww]
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
        bg: ["auto", "cover", "contain", xw]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, kw]
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
        from: [x]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [x]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [x]
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
        "border-opacity": [w]
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
        "divide-opacity": [w]
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
        outline: ["", ...Y()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Nt, pe]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Nt, Kt]
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
        ring: oe()
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
        "ring-opacity": [w]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [Nt, Kt]
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
        shadow: ["", "inner", "none", Xt, Pw]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [vr]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [w]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...M(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": M()
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
        "drop-shadow": ["", "none", Xt, pe]
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
        invert: [p]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [S]
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
        "backdrop-invert": [p]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [w]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [S]
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
        duration: d()
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
        delay: d()
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
        scale: [_]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [_]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [_]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [br, pe]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [te]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [te]
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
        "scroll-m": B()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": B()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": B()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": B()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": B()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": B()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": B()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": B()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": B()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": B()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": B()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": B()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": B()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": B()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": B()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": B()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": B()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": B()
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
        stroke: [Nt, Kt, li]
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
}, It = /* @__PURE__ */ uw(Cw);
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function _w(e, t, n) {
  return (t = Nw(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function $u(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function H(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? $u(Object(n), !0).forEach(function(r) {
      _w(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : $u(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Tw(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Nw(e) {
  var t = Tw(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Hu = () => {
};
let kl = {}, gm = {}, hm = null, ym = {
  mark: Hu,
  measure: Hu
};
try {
  typeof window < "u" && (kl = window), typeof document < "u" && (gm = document), typeof MutationObserver < "u" && (hm = MutationObserver), typeof performance < "u" && (ym = performance);
} catch {
}
const {
  userAgent: Wu = ""
} = kl.navigator || {}, cn = kl, je = gm, Bu = hm, ba = ym;
cn.document;
const Yt = !!je.documentElement && !!je.head && typeof je.addEventListener == "function" && typeof je.createElement == "function", bm = ~Wu.indexOf("MSIE") || ~Wu.indexOf("Trident/");
var Iw = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, jw = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, vm = {
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
}, Mw = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, xm = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Ze = "classic", bo = "duotone", Fw = "sharp", Rw = "sharp-duotone", wm = [Ze, bo, Fw, Rw], Lw = {
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
}, Dw = {
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
}, zw = /* @__PURE__ */ new Map([["classic", {
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
}]]), $w = {
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
}, Hw = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Gu = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, Ww = ["kit"], Bw = {
  kit: {
    "fa-kit": "fak"
  }
}, Gw = ["fak", "fakd"], Yw = {
  kit: {
    fak: "fa-kit"
  }
}, Yu = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, va = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Vw = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Uw = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], qw = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, Kw = {
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
}, Xw = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, ps = {
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
}, Jw = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], ms = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...Vw, ...Jw], Zw = ["solid", "regular", "light", "thin", "duotone", "brands"], Em = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], Qw = Em.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), e2 = [...Object.keys(Xw), ...Zw, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", va.GROUP, va.SWAP_OPACITY, va.PRIMARY, va.SECONDARY].concat(Em.map((e) => "".concat(e, "x"))).concat(Qw.map((e) => "w-".concat(e))), t2 = {
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
const $t = "___FONT_AWESOME___", gs = 16, km = "fa", Pm = "svg-inline--fa", In = "data-fa-i2svg", hs = "data-fa-pseudo-element", n2 = "data-fa-pseudo-element-pending", Pl = "data-prefix", Ol = "data-icon", Vu = "fontawesome-i2svg", r2 = "async", a2 = ["HTML", "HEAD", "STYLE", "SCRIPT"], Om = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Zr(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[Ze];
    }
  });
}
const Sm = H({}, vm);
Sm[Ze] = H(H(H(H({}, {
  "fa-duotone": "duotone"
}), vm[Ze]), Gu.kit), Gu["kit-duotone"]);
const o2 = Zr(Sm), ys = H({}, $w);
ys[Ze] = H(H(H(H({}, {
  duotone: "fad"
}), ys[Ze]), Yu.kit), Yu["kit-duotone"]);
const Uu = Zr(ys), bs = H({}, ps);
bs[Ze] = H(H({}, bs[Ze]), Yw.kit);
const Sl = Zr(bs), vs = H({}, Kw);
vs[Ze] = H(H({}, vs[Ze]), Bw.kit);
Zr(vs);
const i2 = Iw, Am = "fa-layers-text", s2 = jw, l2 = H({}, Lw);
Zr(l2);
const c2 = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], ci = Mw, u2 = [...Ww, ...e2], Cr = cn.FontAwesomeConfig || {};
function f2(e) {
  var t = je.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function d2(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
je && typeof je.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, n] = e;
  const r = d2(f2(t));
  r != null && (Cr[n] = r);
});
const Cm = {
  styleDefault: "solid",
  familyDefault: Ze,
  cssPrefix: km,
  replacementClass: Pm,
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
Cr.familyPrefix && (Cr.cssPrefix = Cr.familyPrefix);
const ar = H(H({}, Cm), Cr);
ar.autoReplaceSvg || (ar.observeMutations = !1);
const re = {};
Object.keys(Cm).forEach((e) => {
  Object.defineProperty(re, e, {
    enumerable: !0,
    set: function(t) {
      ar[e] = t, _r.forEach((n) => n(re));
    },
    get: function() {
      return ar[e];
    }
  });
});
Object.defineProperty(re, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    ar.cssPrefix = e, _r.forEach((t) => t(re));
  },
  get: function() {
    return ar.cssPrefix;
  }
});
cn.FontAwesomeConfig = re;
const _r = [];
function p2(e) {
  return _r.push(e), () => {
    _r.splice(_r.indexOf(e), 1);
  };
}
const Jt = gs, Pt = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function m2(e) {
  if (!e || !Yt)
    return;
  const t = je.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = je.head.childNodes;
  let r = null;
  for (let a = n.length - 1; a > -1; a--) {
    const o = n[a], i = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = o);
  }
  return je.head.insertBefore(t, r), e;
}
const g2 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function $r() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += g2[Math.random() * 62 | 0];
  return t;
}
function ur(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function Al(e) {
  return e.classList ? ur(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function _m(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function h2(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(_m(e[n]), '" '), "").trim();
}
function vo(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function Cl(e) {
  return e.size !== Pt.size || e.x !== Pt.x || e.y !== Pt.y || e.rotate !== Pt.rotate || e.flipX || e.flipY;
}
function y2(e) {
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
function b2(e) {
  let {
    transform: t,
    width: n = gs,
    height: r = gs,
    startCentered: a = !1
  } = e, o = "";
  return a && bm ? o += "translate(".concat(t.x / Jt - n / 2, "em, ").concat(t.y / Jt - r / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / Jt, "em), calc(-50% + ").concat(t.y / Jt, "em)) ") : o += "translate(".concat(t.x / Jt, "em, ").concat(t.y / Jt, "em) "), o += "scale(".concat(t.size / Jt * (t.flipX ? -1 : 1), ", ").concat(t.size / Jt * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var v2 = `:root, :host {
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
function Tm() {
  const e = km, t = Pm, n = re.cssPrefix, r = re.replacementClass;
  let a = v2;
  if (n !== e || r !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return a;
}
let qu = !1;
function ui() {
  re.autoAddCss && !qu && (m2(Tm()), qu = !0);
}
var x2 = {
  mixout() {
    return {
      dom: {
        css: Tm,
        insertCss: ui
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        ui();
      },
      beforeI2svg() {
        ui();
      }
    };
  }
};
const Ht = cn || {};
Ht[$t] || (Ht[$t] = {});
Ht[$t].styles || (Ht[$t].styles = {});
Ht[$t].hooks || (Ht[$t].hooks = {});
Ht[$t].shims || (Ht[$t].shims = []);
var Ot = Ht[$t];
const Nm = [], Im = function() {
  je.removeEventListener("DOMContentLoaded", Im), Ga = 1, Nm.map((e) => e());
};
let Ga = !1;
Yt && (Ga = (je.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(je.readyState), Ga || je.addEventListener("DOMContentLoaded", Im));
function w2(e) {
  Yt && (Ga ? setTimeout(e, 0) : Nm.push(e));
}
function Qr(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? _m(e) : "<".concat(t, " ").concat(h2(n), ">").concat(r.map(Qr).join(""), "</").concat(t, ">");
}
function Ku(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var fi = function(e, t, n, r) {
  var a = Object.keys(e), o = a.length, i = t, s, l, c;
  for (n === void 0 ? (s = 1, c = e[a[0]]) : (s = 0, c = n); s < o; s++)
    l = a[s], c = i(c, e[l], l, e);
  return c;
};
function E2(e) {
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
function jm(e) {
  const t = E2(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function k2(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), a;
  return r >= 55296 && r <= 56319 && n > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (r - 55296) * 1024 + a - 56320 + 65536 : r;
}
function Xu(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function xs(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, a = Xu(t);
  typeof Ot.hooks.addPack == "function" && !r ? Ot.hooks.addPack(e, Xu(t)) : Ot.styles[e] = H(H({}, Ot.styles[e] || {}), a), e === "fas" && xs("fa", t);
}
const {
  styles: Hr,
  shims: P2
} = Ot, Mm = Object.keys(Sl), O2 = Mm.reduce((e, t) => (e[t] = Object.keys(Sl[t]), e), {});
let _l = null, Fm = {}, Rm = {}, Lm = {}, Dm = {}, zm = {};
function S2(e) {
  return ~u2.indexOf(e);
}
function A2(e, t) {
  const n = t.split("-"), r = n[0], a = n.slice(1).join("-");
  return r === e && a !== "" && !S2(a) ? a : null;
}
const $m = () => {
  const e = (r) => fi(Hr, (a, o, i) => (a[i] = fi(o, r, {}), a), {});
  Fm = e((r, a, o) => (a[3] && (r[a[3]] = o), a[2] && a[2].filter((i) => typeof i == "number").forEach((i) => {
    r[i.toString(16)] = o;
  }), r)), Rm = e((r, a, o) => (r[o] = o, a[2] && a[2].filter((i) => typeof i == "string").forEach((i) => {
    r[i] = o;
  }), r)), zm = e((r, a, o) => {
    const i = a[2];
    return r[o] = o, i.forEach((s) => {
      r[s] = o;
    }), r;
  });
  const t = "far" in Hr || re.autoFetchSvg, n = fi(P2, (r, a) => {
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
  Lm = n.names, Dm = n.unicodes, _l = xo(re.styleDefault, {
    family: re.familyDefault
  });
};
p2((e) => {
  _l = xo(e.styleDefault, {
    family: re.familyDefault
  });
});
$m();
function Tl(e, t) {
  return (Fm[e] || {})[t];
}
function C2(e, t) {
  return (Rm[e] || {})[t];
}
function kn(e, t) {
  return (zm[e] || {})[t];
}
function Hm(e) {
  return Lm[e] || {
    prefix: null,
    iconName: null
  };
}
function _2(e) {
  const t = Dm[e], n = Tl("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function un() {
  return _l;
}
const Wm = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function T2(e) {
  let t = Ze;
  const n = Mm.reduce((r, a) => (r[a] = "".concat(re.cssPrefix, "-").concat(a), r), {});
  return wm.forEach((r) => {
    (e.includes(n[r]) || e.some((a) => O2[r].includes(a))) && (t = r);
  }), t;
}
function xo(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = Ze
  } = t, r = o2[n][e];
  if (n === bo && !e)
    return "fad";
  const a = Uu[n][e] || Uu[n][r], o = e in Ot.styles ? e : null;
  return a || o || null;
}
function N2(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const a = A2(re.cssPrefix, r);
    a ? n = a : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function Ju(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function wo(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const a = ms.concat(Uw), o = Ju(e.filter((p) => a.includes(p))), i = Ju(e.filter((p) => !ms.includes(p))), s = o.filter((p) => (r = p, !xm.includes(p))), [l = null] = s, c = T2(o), u = H(H({}, N2(i)), {}, {
    prefix: xo(l, {
      family: c
    })
  });
  return H(H(H({}, u), F2({
    values: e,
    family: c,
    styles: Hr,
    config: re,
    canonical: u,
    givenPrefix: r
  })), I2(n, r, u));
}
function I2(e, t, n) {
  let {
    prefix: r,
    iconName: a
  } = n;
  if (e || !r || !a)
    return {
      prefix: r,
      iconName: a
    };
  const o = t === "fa" ? Hm(a) : {}, i = kn(r, a);
  return a = o.iconName || i || a, r = o.prefix || r, r === "far" && !Hr.far && Hr.fas && !re.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: a
  };
}
const j2 = wm.filter((e) => e !== Ze || e !== bo), M2 = Object.keys(ps).filter((e) => e !== Ze).map((e) => Object.keys(ps[e])).flat();
function F2(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: a = "",
    styles: o = {},
    config: i = {}
  } = e, s = n === bo, l = t.includes("fa-duotone") || t.includes("fad"), c = i.familyDefault === "duotone", u = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (l || c || u) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && j2.includes(n) && (Object.keys(o).find((p) => M2.includes(p)) || i.autoFetchSvg)) {
    const p = zw.get(n).defaultShortPrefixId;
    r.prefix = p, r.iconName = kn(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || a === "fa") && (r.prefix = un() || "fas"), r;
}
class R2 {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const a = n.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = H(H({}, this.definitions[o] || {}), a[o]), xs(o, a[o]);
      const i = Sl[Ze][o];
      i && xs(i, a[o]), $m();
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
let Zu = [], Gn = {};
const Jn = {}, L2 = Object.keys(Jn);
function D2(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return Zu = e, Gn = {}, Object.keys(Jn).forEach((r) => {
    L2.indexOf(r) === -1 && delete Jn[r];
  }), Zu.forEach((r) => {
    const a = r.mixout ? r.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (n[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((i) => {
        n[o] || (n[o] = {}), n[o][i] = a[o][i];
      });
    }), r.hooks) {
      const o = r.hooks();
      Object.keys(o).forEach((i) => {
        Gn[i] || (Gn[i] = []), Gn[i].push(o[i]);
      });
    }
    r.provides && r.provides(Jn);
  }), n;
}
function ws(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), a = 2; a < n; a++)
    r[a - 2] = arguments[a];
  return (Gn[e] || []).forEach((o) => {
    t = o.apply(null, [t, ...r]);
  }), t;
}
function jn(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (Gn[e] || []).forEach((a) => {
    a.apply(null, n);
  });
}
function fn() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Jn[e] ? Jn[e].apply(null, t) : void 0;
}
function Es(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || un();
  if (t)
    return t = kn(n, t) || t, Ku(Bm.definitions, n, t) || Ku(Ot.styles, n, t);
}
const Bm = new R2(), z2 = () => {
  re.autoReplaceSvg = !1, re.observeMutations = !1, jn("noAuto");
}, $2 = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return Yt ? (jn("beforeI2svg", e), fn("pseudoElements2svg", e), fn("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    re.autoReplaceSvg === !1 && (re.autoReplaceSvg = !0), re.observeMutations = !0, w2(() => {
      W2({
        autoReplaceSvgRoot: t
      }), jn("watch", e);
    });
  }
}, H2 = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: kn(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = xo(e[0]);
      return {
        prefix: n,
        iconName: kn(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(re.cssPrefix, "-")) > -1 || e.match(i2))) {
      const t = wo(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || un(),
        iconName: kn(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = un();
      return {
        prefix: t,
        iconName: kn(t, e) || e
      };
    }
  }
}, ct = {
  noAuto: z2,
  config: re,
  dom: $2,
  parse: H2,
  library: Bm,
  findIconDefinition: Es,
  toHtml: Qr
}, W2 = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = je
  } = e;
  (Object.keys(Ot.styles).length > 0 || re.autoFetchSvg) && Yt && re.autoReplaceSvg && ct.dom.i2svg({
    node: t
  });
};
function Eo(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => Qr(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!Yt) return;
      const n = je.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function B2(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: a,
    styles: o,
    transform: i
  } = e;
  if (Cl(i) && n.found && !r.found) {
    const {
      width: s,
      height: l
    } = n, c = {
      x: s / l / 2,
      y: 0.5
    };
    a.style = vo(H(H({}, o), {}, {
      "transform-origin": "".concat(c.x + i.x / 16, "em ").concat(c.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function G2(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: a,
    symbol: o
  } = e;
  const i = o === !0 ? "".concat(t, "-").concat(re.cssPrefix, "-").concat(n) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: H(H({}, a), {}, {
        id: i
      }),
      children: r
    }]
  }];
}
function Nl(e) {
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
    extra: u,
    watchable: p = !1
  } = e, {
    width: m,
    height: b
  } = n.found ? n : t, x = Gw.includes(r), v = [re.replacementClass, a ? "".concat(re.cssPrefix, "-").concat(a) : ""].filter((h) => u.classes.indexOf(h) === -1).filter((h) => h !== "" || !!h).concat(u.classes).join(" ");
  let y = {
    children: [],
    attributes: H(H({}, u.attributes), {}, {
      "data-prefix": r,
      "data-icon": a,
      class: v,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(m, " ").concat(b)
    })
  };
  const w = x && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(m / b * 16 * 0.0625, "em")
  } : {};
  p && (y.attributes[In] = ""), s && (y.children.push({
    tag: "title",
    attributes: {
      id: y.attributes["aria-labelledby"] || "title-".concat(c || $r())
    },
    children: [s]
  }), delete y.attributes.title);
  const P = H(H({}, y), {}, {
    prefix: r,
    iconName: a,
    main: t,
    mask: n,
    maskId: l,
    transform: o,
    symbol: i,
    styles: H(H({}, w), u.styles)
  }), {
    children: S,
    attributes: _
  } = n.found && t.found ? fn("generateAbstractMask", P) || {
    children: [],
    attributes: {}
  } : fn("generateAbstractIcon", P) || {
    children: [],
    attributes: {}
  };
  return P.children = S, P.attributes = _, i ? G2(P) : B2(P);
}
function Qu(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: a,
    title: o,
    extra: i,
    watchable: s = !1
  } = e, l = H(H(H({}, i.attributes), o ? {
    title: o
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (l[In] = "");
  const c = H({}, i.styles);
  Cl(a) && (c.transform = b2({
    transform: a,
    startCentered: !0,
    width: n,
    height: r
  }), c["-webkit-transform"] = c.transform);
  const u = vo(c);
  u.length > 0 && (l.style = u);
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
function Y2(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, a = H(H(H({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), o = vo(r.styles);
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
  styles: di
} = Ot;
function ks(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let a = null;
  return Array.isArray(r) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(re.cssPrefix, "-").concat(ci.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(re.cssPrefix, "-").concat(ci.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(re.cssPrefix, "-").concat(ci.PRIMARY),
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
const V2 = {
  found: !1,
  width: 512,
  height: 512
};
function U2(e, t) {
  !Om && !re.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Ps(e, t) {
  let n = t;
  return t === "fa" && re.styleDefault !== null && (t = un()), new Promise((r, a) => {
    if (n === "fa") {
      const o = Hm(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && di[t] && di[t][e]) {
      const o = di[t][e];
      return r(ks(o));
    }
    U2(e, t), r(H(H({}, V2), {}, {
      icon: re.showMissingIcons && e ? fn("missingIconAbstract") || {} : {}
    }));
  });
}
const ef = () => {
}, Os = re.measurePerformance && ba && ba.mark && ba.measure ? ba : {
  mark: ef,
  measure: ef
}, kr = 'FA "6.7.2"', q2 = (e) => (Os.mark("".concat(kr, " ").concat(e, " begins")), () => Gm(e)), Gm = (e) => {
  Os.mark("".concat(kr, " ").concat(e, " ends")), Os.measure("".concat(kr, " ").concat(e), "".concat(kr, " ").concat(e, " begins"), "".concat(kr, " ").concat(e, " ends"));
};
var Il = {
  begin: q2,
  end: Gm
};
const Ca = () => {
};
function tf(e) {
  return typeof (e.getAttribute ? e.getAttribute(In) : null) == "string";
}
function K2(e) {
  const t = e.getAttribute ? e.getAttribute(Pl) : null, n = e.getAttribute ? e.getAttribute(Ol) : null;
  return t && n;
}
function X2(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(re.replacementClass);
}
function J2() {
  return re.autoReplaceSvg === !0 ? _a.replace : _a[re.autoReplaceSvg] || _a.replace;
}
function Z2(e) {
  return je.createElementNS("http://www.w3.org/2000/svg", e);
}
function Q2(e) {
  return je.createElement(e);
}
function Ym(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? Z2 : Q2
  } = t;
  if (typeof e == "string")
    return je.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(a) {
    r.setAttribute(a, e.attributes[a]);
  }), (e.children || []).forEach(function(a) {
    r.appendChild(Ym(a, {
      ceFn: n
    }));
  }), r;
}
function eE(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const _a = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(Ym(n), t);
      }), t.getAttribute(In) === null && re.keepOriginalSource) {
        let n = je.createComment(eE(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~Al(t).indexOf(re.replacementClass))
      return _a.replace(e);
    const r = new RegExp("".concat(re.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const o = n[0].attributes.class.split(" ").reduce((i, s) => (s === re.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = n.map((o) => Qr(o)).join(`
`);
    t.setAttribute(In, ""), t.innerHTML = a;
  }
};
function nf(e) {
  e();
}
function Vm(e, t) {
  const n = typeof t == "function" ? t : Ca;
  if (e.length === 0)
    n();
  else {
    let r = nf;
    re.mutateApproach === r2 && (r = cn.requestAnimationFrame || nf), r(() => {
      const a = J2(), o = Il.begin("mutate");
      e.map(a), o(), n();
    });
  }
}
let jl = !1;
function Um() {
  jl = !0;
}
function Ss() {
  jl = !1;
}
let Ya = null;
function rf(e) {
  if (!Bu || !re.observeMutations)
    return;
  const {
    treeCallback: t = Ca,
    nodeCallback: n = Ca,
    pseudoElementsCallback: r = Ca,
    observeMutationsRoot: a = je
  } = e;
  Ya = new Bu((o) => {
    if (jl) return;
    const i = un();
    ur(o).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !tf(s.addedNodes[0]) && (re.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && re.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && tf(s.target) && ~c2.indexOf(s.attributeName))
        if (s.attributeName === "class" && K2(s.target)) {
          const {
            prefix: l,
            iconName: c
          } = wo(Al(s.target));
          s.target.setAttribute(Pl, l || i), c && s.target.setAttribute(Ol, c);
        } else X2(s.target) && n(s.target);
    });
  }), Yt && Ya.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function tE() {
  Ya && Ya.disconnect();
}
function nE(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, a) => {
    const o = a.split(":"), i = o[0], s = o.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function rE(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = wo(Al(e));
  return a.prefix || (a.prefix = un()), t && n && (a.prefix = t, a.iconName = n), a.iconName && a.prefix || (a.prefix && r.length > 0 && (a.iconName = C2(a.prefix, e.innerText) || Tl(a.prefix, jm(e.innerText))), !a.iconName && re.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function aE(e) {
  const t = ur(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return re.autoA11y && (n ? t["aria-labelledby"] = "".concat(re.replacementClass, "-title-").concat(r || $r()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function oE() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: Pt,
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
function af(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: a
  } = rE(e), o = aE(e), i = ws("parseNodeAttributes", {}, e);
  let s = t.styleParser ? nE(e) : [];
  return H({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: Pt,
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
  styles: iE
} = Ot;
function qm(e) {
  const t = re.autoReplaceSvg === "nest" ? af(e, {
    styleParser: !1
  }) : af(e);
  return ~t.extra.classes.indexOf(Am) ? fn("generateLayersText", e, t) : fn("generateSvgReplacementMutation", e, t);
}
function sE() {
  return [...Hw, ...ms];
}
function of(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!Yt) return Promise.resolve();
  const n = je.documentElement.classList, r = (u) => n.add("".concat(Vu, "-").concat(u)), a = (u) => n.remove("".concat(Vu, "-").concat(u)), o = re.autoFetchSvg ? sE() : xm.concat(Object.keys(iE));
  o.includes("fa") || o.push("fa");
  const i = [".".concat(Am, ":not([").concat(In, "])")].concat(o.map((u) => ".".concat(u, ":not([").concat(In, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = ur(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), a("complete");
  else
    return Promise.resolve();
  const l = Il.begin("onTree"), c = s.reduce((u, p) => {
    try {
      const m = qm(p);
      m && u.push(m);
    } catch (m) {
      Om || m.name === "MissingIcon" && console.error(m);
    }
    return u;
  }, []);
  return new Promise((u, p) => {
    Promise.all(c).then((m) => {
      Vm(m, () => {
        r("active"), r("complete"), a("pending"), typeof t == "function" && t(), l(), u();
      });
    }).catch((m) => {
      l(), p(m);
    });
  });
}
function lE(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  qm(e).then((n) => {
    n && Vm([n], t);
  });
}
function cE(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : Es(t || {});
    let {
      mask: a
    } = n;
    return a && (a = (a || {}).icon ? a : Es(a || {})), e(r, H(H({}, n), {}, {
      mask: a
    }));
  };
}
const uE = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = Pt,
    symbol: r = !1,
    mask: a = null,
    maskId: o = null,
    title: i = null,
    titleId: s = null,
    classes: l = [],
    attributes: c = {},
    styles: u = {}
  } = t;
  if (!e) return;
  const {
    prefix: p,
    iconName: m,
    icon: b
  } = e;
  return Eo(H({
    type: "icon"
  }, e), () => (jn("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), re.autoA11y && (i ? c["aria-labelledby"] = "".concat(re.replacementClass, "-title-").concat(s || $r()) : (c["aria-hidden"] = "true", c.focusable = "false")), Nl({
    icons: {
      main: ks(b),
      mask: a ? ks(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: p,
    iconName: m,
    transform: H(H({}, Pt), n),
    symbol: r,
    title: i,
    maskId: o,
    titleId: s,
    extra: {
      attributes: c,
      styles: u,
      classes: l
    }
  })));
};
var fE = {
  mixout() {
    return {
      icon: cE(uE)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = of, e.nodeCallback = lE, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = je,
        callback: r = () => {
        }
      } = t;
      return of(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: a,
        titleId: o,
        prefix: i,
        transform: s,
        symbol: l,
        mask: c,
        maskId: u,
        extra: p
      } = n;
      return new Promise((m, b) => {
        Promise.all([Ps(r, i), c.iconName ? Ps(c.iconName, c.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((x) => {
          let [v, y] = x;
          m([t, Nl({
            icons: {
              main: v,
              mask: y
            },
            prefix: i,
            iconName: r,
            transform: s,
            symbol: l,
            maskId: u,
            title: a,
            titleId: o,
            extra: p,
            watchable: !0
          })]);
        }).catch(b);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        transform: o,
        styles: i
      } = t;
      const s = vo(i);
      s.length > 0 && (r.style = s);
      let l;
      return Cl(o) && (l = fn("generateAbstractTransformGrouping", {
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
}, dE = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return Eo({
          type: "layer"
        }, () => {
          jn("beforeDOMElementCreation", {
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
              class: ["".concat(re.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, pE = {
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
        return Eo({
          type: "counter",
          content: e
        }, () => (jn("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Y2({
          content: e.toString(),
          title: n,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(re.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, mE = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = Pt,
          title: r = null,
          classes: a = [],
          attributes: o = {},
          styles: i = {}
        } = t;
        return Eo({
          type: "text",
          content: e
        }, () => (jn("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Qu({
          content: e,
          transform: H(H({}, Pt), n),
          title: r,
          extra: {
            attributes: o,
            styles: i,
            classes: ["".concat(re.cssPrefix, "-layers-text"), ...a]
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
      if (bm) {
        const l = parseInt(getComputedStyle(t).fontSize, 10), c = t.getBoundingClientRect();
        i = c.width / l, s = c.height / l;
      }
      return re.autoA11y && !r && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, Qu({
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
const gE = new RegExp('"', "ug"), sf = [1105920, 1112319], lf = H(H(H(H({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), Dw), t2), qw), As = Object.keys(lf).reduce((e, t) => (e[t.toLowerCase()] = lf[t], e), {}), hE = Object.keys(As).reduce((e, t) => {
  const n = As[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function yE(e) {
  const t = e.replace(gE, ""), n = k2(t, 0), r = n >= sf[0] && n <= sf[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: jm(a ? t[0] : t),
    isSecondary: r || a
  };
}
function bE(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), a = isNaN(r) ? "normal" : r;
  return (As[n] || {})[a] || hE[n];
}
function cf(e, t) {
  const n = "".concat(n2).concat(t.replace(":", "-"));
  return new Promise((r, a) => {
    if (e.getAttribute(n) !== null)
      return r();
    const o = ur(e.children).filter((p) => p.getAttribute(hs) === t)[0], i = cn.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), l = s.match(s2), c = i.getPropertyValue("font-weight"), u = i.getPropertyValue("content");
    if (o && !l)
      return e.removeChild(o), r();
    if (l && u !== "none" && u !== "") {
      const p = i.getPropertyValue("content");
      let m = bE(s, c);
      const {
        value: b,
        isSecondary: x
      } = yE(p), v = l[0].startsWith("FontAwesome");
      let y = Tl(m, b), w = y;
      if (v) {
        const P = _2(b);
        P.iconName && P.prefix && (y = P.iconName, m = P.prefix);
      }
      if (y && !x && (!o || o.getAttribute(Pl) !== m || o.getAttribute(Ol) !== w)) {
        e.setAttribute(n, w), o && e.removeChild(o);
        const P = oE(), {
          extra: S
        } = P;
        S.attributes[hs] = t, Ps(y, m).then((_) => {
          const h = Nl(H(H({}, P), {}, {
            icons: {
              main: _,
              mask: Wm()
            },
            prefix: m,
            iconName: w,
            extra: S,
            watchable: !0
          })), G = je.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(G, e.firstChild) : e.appendChild(G), G.outerHTML = h.map((U) => Qr(U)).join(`
`), e.removeAttribute(n), r();
        }).catch(a);
      } else
        r();
    } else
      r();
  });
}
function vE(e) {
  return Promise.all([cf(e, "::before"), cf(e, "::after")]);
}
function xE(e) {
  return e.parentNode !== document.head && !~a2.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(hs) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function uf(e) {
  if (Yt)
    return new Promise((t, n) => {
      const r = ur(e.querySelectorAll("*")).filter(xE).map(vE), a = Il.begin("searchPseudoElements");
      Um(), Promise.all(r).then(() => {
        a(), Ss(), t();
      }).catch(() => {
        a(), Ss(), n();
      });
    });
}
var wE = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = uf, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = je
      } = t;
      re.searchPseudoElements && uf(n);
    };
  }
};
let ff = !1;
var EE = {
  mixout() {
    return {
      dom: {
        unwatch() {
          Um(), ff = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        rf(ws("mutationObserverCallbacks", {}));
      },
      noAuto() {
        tE();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        ff ? Ss() : rf(ws("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const df = (e) => {
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
var kE = {
  mixout() {
    return {
      parse: {
        transform: (e) => df(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = df(n)), e;
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
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), l = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), c = "rotate(".concat(r.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(l, " ").concat(c)
      }, p = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, m = {
        outer: i,
        inner: u,
        path: p
      };
      return {
        tag: "g",
        attributes: H({}, m.outer),
        children: [{
          tag: "g",
          attributes: H({}, m.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: H(H({}, n.icon.attributes), m.path)
          }]
        }]
      };
    };
  }
};
const pi = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function pf(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function PE(e) {
  return e.tag === "g" ? e.children : [e];
}
var OE = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? wo(n.split(" ").map((a) => a.trim())) : Wm();
        return r.prefix || (r.prefix = un()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        width: u,
        icon: p
      } = o, m = y2({
        transform: s,
        containerWidth: u,
        iconWidth: l
      }), b = {
        tag: "rect",
        attributes: H(H({}, pi), {}, {
          fill: "white"
        })
      }, x = c.children ? {
        children: c.children.map(pf)
      } : {}, v = {
        tag: "g",
        attributes: H({}, m.inner),
        children: [pf(H({
          tag: c.tag,
          attributes: H(H({}, c.attributes), m.path)
        }, x))]
      }, y = {
        tag: "g",
        attributes: H({}, m.outer),
        children: [v]
      }, w = "mask-".concat(i || $r()), P = "clip-".concat(i || $r()), S = {
        tag: "mask",
        attributes: H(H({}, pi), {}, {
          id: w,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [b, y]
      }, _ = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: P
          },
          children: PE(p)
        }, S]
      };
      return n.push(_, {
        tag: "rect",
        attributes: H({
          fill: "currentColor",
          "clip-path": "url(#".concat(P, ")"),
          mask: "url(#".concat(w, ")")
        }, pi)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, SE = {
  provides(e) {
    let t = !1;
    cn.matchMedia && (t = cn.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: H(H({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = H(H({}, a), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: H(H({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: H(H({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: H(H({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(i), n.push({
        tag: "path",
        attributes: H(H({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: H(H({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: H(H({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: H(H({}, o), {}, {
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
}, AE = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, CE = [x2, fE, dE, pE, mE, wE, EE, kE, OE, SE, AE];
D2(CE, {
  mixoutsTo: ct
});
ct.noAuto;
ct.config;
ct.library;
ct.dom;
const Cs = ct.parse;
ct.findIconDefinition;
ct.toHtml;
const _E = ct.icon;
ct.layer;
ct.text;
ct.counter;
function TE(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var xa = { exports: {} }, mi = { exports: {} }, Oe = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var mf;
function NE() {
  if (mf) return Oe;
  mf = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, m = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, x = e ? Symbol.for("react.lazy") : 60116, v = e ? Symbol.for("react.block") : 60121, y = e ? Symbol.for("react.fundamental") : 60117, w = e ? Symbol.for("react.responder") : 60118, P = e ? Symbol.for("react.scope") : 60119;
  function S(h) {
    if (typeof h == "object" && h !== null) {
      var G = h.$$typeof;
      switch (G) {
        case t:
          switch (h = h.type, h) {
            case l:
            case c:
            case r:
            case o:
            case a:
            case p:
              return h;
            default:
              switch (h = h && h.$$typeof, h) {
                case s:
                case u:
                case x:
                case b:
                case i:
                  return h;
                default:
                  return G;
              }
          }
        case n:
          return G;
      }
    }
  }
  function _(h) {
    return S(h) === c;
  }
  return Oe.AsyncMode = l, Oe.ConcurrentMode = c, Oe.ContextConsumer = s, Oe.ContextProvider = i, Oe.Element = t, Oe.ForwardRef = u, Oe.Fragment = r, Oe.Lazy = x, Oe.Memo = b, Oe.Portal = n, Oe.Profiler = o, Oe.StrictMode = a, Oe.Suspense = p, Oe.isAsyncMode = function(h) {
    return _(h) || S(h) === l;
  }, Oe.isConcurrentMode = _, Oe.isContextConsumer = function(h) {
    return S(h) === s;
  }, Oe.isContextProvider = function(h) {
    return S(h) === i;
  }, Oe.isElement = function(h) {
    return typeof h == "object" && h !== null && h.$$typeof === t;
  }, Oe.isForwardRef = function(h) {
    return S(h) === u;
  }, Oe.isFragment = function(h) {
    return S(h) === r;
  }, Oe.isLazy = function(h) {
    return S(h) === x;
  }, Oe.isMemo = function(h) {
    return S(h) === b;
  }, Oe.isPortal = function(h) {
    return S(h) === n;
  }, Oe.isProfiler = function(h) {
    return S(h) === o;
  }, Oe.isStrictMode = function(h) {
    return S(h) === a;
  }, Oe.isSuspense = function(h) {
    return S(h) === p;
  }, Oe.isValidElementType = function(h) {
    return typeof h == "string" || typeof h == "function" || h === r || h === c || h === o || h === a || h === p || h === m || typeof h == "object" && h !== null && (h.$$typeof === x || h.$$typeof === b || h.$$typeof === i || h.$$typeof === s || h.$$typeof === u || h.$$typeof === y || h.$$typeof === w || h.$$typeof === P || h.$$typeof === v);
  }, Oe.typeOf = S, Oe;
}
var Ae = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var gf;
function IE() {
  return gf || (gf = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, m = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, x = e ? Symbol.for("react.lazy") : 60116, v = e ? Symbol.for("react.block") : 60121, y = e ? Symbol.for("react.fundamental") : 60117, w = e ? Symbol.for("react.responder") : 60118, P = e ? Symbol.for("react.scope") : 60119;
    function S(O) {
      return typeof O == "string" || typeof O == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      O === r || O === c || O === o || O === a || O === p || O === m || typeof O == "object" && O !== null && (O.$$typeof === x || O.$$typeof === b || O.$$typeof === i || O.$$typeof === s || O.$$typeof === u || O.$$typeof === y || O.$$typeof === w || O.$$typeof === P || O.$$typeof === v);
    }
    function _(O) {
      if (typeof O == "object" && O !== null) {
        var Ee = O.$$typeof;
        switch (Ee) {
          case t:
            var qe = O.type;
            switch (qe) {
              case l:
              case c:
              case r:
              case o:
              case a:
              case p:
                return qe;
              default:
                var ht = qe && qe.$$typeof;
                switch (ht) {
                  case s:
                  case u:
                  case x:
                  case b:
                  case i:
                    return ht;
                  default:
                    return Ee;
                }
            }
          case n:
            return Ee;
        }
      }
    }
    var h = l, G = c, U = s, te = i, X = t, Z = u, Q = r, B = x, oe = b, q = n, J = o, Y = a, M = p, K = !1;
    function z(O) {
      return K || (K = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), g(O) || _(O) === l;
    }
    function g(O) {
      return _(O) === c;
    }
    function d(O) {
      return _(O) === s;
    }
    function E(O) {
      return _(O) === i;
    }
    function A(O) {
      return typeof O == "object" && O !== null && O.$$typeof === t;
    }
    function C(O) {
      return _(O) === u;
    }
    function T(O) {
      return _(O) === r;
    }
    function I(O) {
      return _(O) === x;
    }
    function N(O) {
      return _(O) === b;
    }
    function F(O) {
      return _(O) === n;
    }
    function L(O) {
      return _(O) === o;
    }
    function D(O) {
      return _(O) === a;
    }
    function ce(O) {
      return _(O) === p;
    }
    Ae.AsyncMode = h, Ae.ConcurrentMode = G, Ae.ContextConsumer = U, Ae.ContextProvider = te, Ae.Element = X, Ae.ForwardRef = Z, Ae.Fragment = Q, Ae.Lazy = B, Ae.Memo = oe, Ae.Portal = q, Ae.Profiler = J, Ae.StrictMode = Y, Ae.Suspense = M, Ae.isAsyncMode = z, Ae.isConcurrentMode = g, Ae.isContextConsumer = d, Ae.isContextProvider = E, Ae.isElement = A, Ae.isForwardRef = C, Ae.isFragment = T, Ae.isLazy = I, Ae.isMemo = N, Ae.isPortal = F, Ae.isProfiler = L, Ae.isStrictMode = D, Ae.isSuspense = ce, Ae.isValidElementType = S, Ae.typeOf = _;
  }()), Ae;
}
var hf;
function Km() {
  return hf || (hf = 1, process.env.NODE_ENV === "production" ? mi.exports = NE() : mi.exports = IE()), mi.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var gi, yf;
function jE() {
  if (yf) return gi;
  yf = 1;
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
  return gi = a() ? Object.assign : function(o, i) {
    for (var s, l = r(o), c, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var p in s)
        t.call(s, p) && (l[p] = s[p]);
      if (e) {
        c = e(s);
        for (var m = 0; m < c.length; m++)
          n.call(s, c[m]) && (l[c[m]] = s[c[m]]);
      }
    }
    return l;
  }, gi;
}
var hi, bf;
function Ml() {
  if (bf) return hi;
  bf = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return hi = e, hi;
}
var vf, xf;
function Xm() {
  return xf || (xf = 1, vf = Function.call.bind(Object.prototype.hasOwnProperty)), vf;
}
var yi, wf;
function ME() {
  if (wf) return yi;
  wf = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ Ml(), n = {}, r = /* @__PURE__ */ Xm();
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
      for (var u in o)
        if (r(o, u)) {
          var p;
          try {
            if (typeof o[u] != "function") {
              var m = Error(
                (l || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw m.name = "Invariant Violation", m;
            }
            p = o[u](i, u, l, s, null, t);
          } catch (x) {
            p = x;
          }
          if (p && !(p instanceof Error) && e(
            (l || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof p + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), p instanceof Error && !(p.message in n)) {
            n[p.message] = !0;
            var b = c ? c() : "";
            e(
              "Failed " + s + " type: " + p.message + (b ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, yi = a, yi;
}
var bi, Ef;
function FE() {
  if (Ef) return bi;
  Ef = 1;
  var e = Km(), t = jE(), n = /* @__PURE__ */ Ml(), r = /* @__PURE__ */ Xm(), a = /* @__PURE__ */ ME(), o = function() {
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
  return bi = function(s, l) {
    var c = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function p(g) {
      var d = g && (c && g[c] || g[u]);
      if (typeof d == "function")
        return d;
    }
    var m = "<<anonymous>>", b = {
      array: w("array"),
      bigint: w("bigint"),
      bool: w("boolean"),
      func: w("function"),
      number: w("number"),
      object: w("object"),
      string: w("string"),
      symbol: w("symbol"),
      any: P(),
      arrayOf: S,
      element: _(),
      elementType: h(),
      instanceOf: G,
      node: Z(),
      objectOf: te,
      oneOf: U,
      oneOfType: X,
      shape: B,
      exact: oe
    };
    function x(g, d) {
      return g === d ? g !== 0 || 1 / g === 1 / d : g !== g && d !== d;
    }
    function v(g, d) {
      this.message = g, this.data = d && typeof d == "object" ? d : {}, this.stack = "";
    }
    v.prototype = Error.prototype;
    function y(g) {
      if (process.env.NODE_ENV !== "production")
        var d = {}, E = 0;
      function A(T, I, N, F, L, D, ce) {
        if (F = F || m, D = D || N, ce !== n) {
          if (l) {
            var O = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw O.name = "Invariant Violation", O;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var Ee = F + ":" + N;
            !d[Ee] && // Avoid spamming the console because they are often not actionable except for lib authors
            E < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + D + "` prop on `" + F + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), d[Ee] = !0, E++);
          }
        }
        return I[N] == null ? T ? I[N] === null ? new v("The " + L + " `" + D + "` is marked as required " + ("in `" + F + "`, but its value is `null`.")) : new v("The " + L + " `" + D + "` is marked as required in " + ("`" + F + "`, but its value is `undefined`.")) : null : g(I, N, F, L, D);
      }
      var C = A.bind(null, !1);
      return C.isRequired = A.bind(null, !0), C;
    }
    function w(g) {
      function d(E, A, C, T, I, N) {
        var F = E[A], L = Y(F);
        if (L !== g) {
          var D = M(F);
          return new v(
            "Invalid " + T + " `" + I + "` of type " + ("`" + D + "` supplied to `" + C + "`, expected ") + ("`" + g + "`."),
            { expectedType: g }
          );
        }
        return null;
      }
      return y(d);
    }
    function P() {
      return y(i);
    }
    function S(g) {
      function d(E, A, C, T, I) {
        if (typeof g != "function")
          return new v("Property `" + I + "` of component `" + C + "` has invalid PropType notation inside arrayOf.");
        var N = E[A];
        if (!Array.isArray(N)) {
          var F = Y(N);
          return new v("Invalid " + T + " `" + I + "` of type " + ("`" + F + "` supplied to `" + C + "`, expected an array."));
        }
        for (var L = 0; L < N.length; L++) {
          var D = g(N, L, C, T, I + "[" + L + "]", n);
          if (D instanceof Error)
            return D;
        }
        return null;
      }
      return y(d);
    }
    function _() {
      function g(d, E, A, C, T) {
        var I = d[E];
        if (!s(I)) {
          var N = Y(I);
          return new v("Invalid " + C + " `" + T + "` of type " + ("`" + N + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return y(g);
    }
    function h() {
      function g(d, E, A, C, T) {
        var I = d[E];
        if (!e.isValidElementType(I)) {
          var N = Y(I);
          return new v("Invalid " + C + " `" + T + "` of type " + ("`" + N + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return y(g);
    }
    function G(g) {
      function d(E, A, C, T, I) {
        if (!(E[A] instanceof g)) {
          var N = g.name || m, F = z(E[A]);
          return new v("Invalid " + T + " `" + I + "` of type " + ("`" + F + "` supplied to `" + C + "`, expected ") + ("instance of `" + N + "`."));
        }
        return null;
      }
      return y(d);
    }
    function U(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), i;
      function d(E, A, C, T, I) {
        for (var N = E[A], F = 0; F < g.length; F++)
          if (x(N, g[F]))
            return null;
        var L = JSON.stringify(g, function(D, ce) {
          var O = M(ce);
          return O === "symbol" ? String(ce) : ce;
        });
        return new v("Invalid " + T + " `" + I + "` of value `" + String(N) + "` " + ("supplied to `" + C + "`, expected one of " + L + "."));
      }
      return y(d);
    }
    function te(g) {
      function d(E, A, C, T, I) {
        if (typeof g != "function")
          return new v("Property `" + I + "` of component `" + C + "` has invalid PropType notation inside objectOf.");
        var N = E[A], F = Y(N);
        if (F !== "object")
          return new v("Invalid " + T + " `" + I + "` of type " + ("`" + F + "` supplied to `" + C + "`, expected an object."));
        for (var L in N)
          if (r(N, L)) {
            var D = g(N, L, C, T, I + "." + L, n);
            if (D instanceof Error)
              return D;
          }
        return null;
      }
      return y(d);
    }
    function X(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var d = 0; d < g.length; d++) {
        var E = g[d];
        if (typeof E != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + K(E) + " at index " + d + "."
          ), i;
      }
      function A(C, T, I, N, F) {
        for (var L = [], D = 0; D < g.length; D++) {
          var ce = g[D], O = ce(C, T, I, N, F, n);
          if (O == null)
            return null;
          O.data && r(O.data, "expectedType") && L.push(O.data.expectedType);
        }
        var Ee = L.length > 0 ? ", expected one of type [" + L.join(", ") + "]" : "";
        return new v("Invalid " + N + " `" + F + "` supplied to " + ("`" + I + "`" + Ee + "."));
      }
      return y(A);
    }
    function Z() {
      function g(d, E, A, C, T) {
        return q(d[E]) ? null : new v("Invalid " + C + " `" + T + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return y(g);
    }
    function Q(g, d, E, A, C) {
      return new v(
        (g || "React class") + ": " + d + " type `" + E + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + C + "`."
      );
    }
    function B(g) {
      function d(E, A, C, T, I) {
        var N = E[A], F = Y(N);
        if (F !== "object")
          return new v("Invalid " + T + " `" + I + "` of type `" + F + "` " + ("supplied to `" + C + "`, expected `object`."));
        for (var L in g) {
          var D = g[L];
          if (typeof D != "function")
            return Q(C, T, I, L, M(D));
          var ce = D(N, L, C, T, I + "." + L, n);
          if (ce)
            return ce;
        }
        return null;
      }
      return y(d);
    }
    function oe(g) {
      function d(E, A, C, T, I) {
        var N = E[A], F = Y(N);
        if (F !== "object")
          return new v("Invalid " + T + " `" + I + "` of type `" + F + "` " + ("supplied to `" + C + "`, expected `object`."));
        var L = t({}, E[A], g);
        for (var D in L) {
          var ce = g[D];
          if (r(g, D) && typeof ce != "function")
            return Q(C, T, I, D, M(ce));
          if (!ce)
            return new v(
              "Invalid " + T + " `" + I + "` key `" + D + "` supplied to `" + C + "`.\nBad object: " + JSON.stringify(E[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(g), null, "  ")
            );
          var O = ce(N, D, C, T, I + "." + D, n);
          if (O)
            return O;
        }
        return null;
      }
      return y(d);
    }
    function q(g) {
      switch (typeof g) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !g;
        case "object":
          if (Array.isArray(g))
            return g.every(q);
          if (g === null || s(g))
            return !0;
          var d = p(g);
          if (d) {
            var E = d.call(g), A;
            if (d !== g.entries) {
              for (; !(A = E.next()).done; )
                if (!q(A.value))
                  return !1;
            } else
              for (; !(A = E.next()).done; ) {
                var C = A.value;
                if (C && !q(C[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function J(g, d) {
      return g === "symbol" ? !0 : d ? d["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && d instanceof Symbol : !1;
    }
    function Y(g) {
      var d = typeof g;
      return Array.isArray(g) ? "array" : g instanceof RegExp ? "object" : J(d, g) ? "symbol" : d;
    }
    function M(g) {
      if (typeof g > "u" || g === null)
        return "" + g;
      var d = Y(g);
      if (d === "object") {
        if (g instanceof Date)
          return "date";
        if (g instanceof RegExp)
          return "regexp";
      }
      return d;
    }
    function K(g) {
      var d = M(g);
      switch (d) {
        case "array":
        case "object":
          return "an " + d;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + d;
        default:
          return d;
      }
    }
    function z(g) {
      return !g.constructor || !g.constructor.name ? m : g.constructor.name;
    }
    return b.checkPropTypes = a, b.resetWarningCache = a.resetWarningCache, b.PropTypes = b, b;
  }, bi;
}
var vi, kf;
function RE() {
  if (kf) return vi;
  kf = 1;
  var e = /* @__PURE__ */ Ml();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, vi = function() {
    function r(i, s, l, c, u, p) {
      if (p !== e) {
        var m = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw m.name = "Invariant Violation", m;
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
  }, vi;
}
var Pf;
function LE() {
  if (Pf) return xa.exports;
  if (Pf = 1, process.env.NODE_ENV !== "production") {
    var e = Km(), t = !0;
    xa.exports = /* @__PURE__ */ FE()(e.isElement, t);
  } else
    xa.exports = /* @__PURE__ */ RE()();
  return xa.exports;
}
var DE = /* @__PURE__ */ LE();
const ye = /* @__PURE__ */ TE(DE);
function Of(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function vt(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Of(Object(n), !0).forEach(function(r) {
      Yn(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Of(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Va(e) {
  "@babel/helpers - typeof";
  return Va = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Va(e);
}
function Yn(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function zE(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), a, o;
  for (o = 0; o < r.length; o++)
    a = r[o], !(t.indexOf(a) >= 0) && (n[a] = e[a]);
  return n;
}
function $E(e, t) {
  if (e == null) return {};
  var n = zE(e, t), r, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      r = o[a], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function _s(e) {
  return HE(e) || WE(e) || BE(e) || GE();
}
function HE(e) {
  if (Array.isArray(e)) return Ts(e);
}
function WE(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function BE(e, t) {
  if (e) {
    if (typeof e == "string") return Ts(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return Ts(e, t);
  }
}
function Ts(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function GE() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function YE(e) {
  var t, n = e.beat, r = e.fade, a = e.beatFade, o = e.bounce, i = e.shake, s = e.flash, l = e.spin, c = e.spinPulse, u = e.spinReverse, p = e.pulse, m = e.fixedWidth, b = e.inverse, x = e.border, v = e.listItem, y = e.flip, w = e.size, P = e.rotation, S = e.pull, _ = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": l,
    "fa-spin-reverse": u,
    "fa-spin-pulse": c,
    "fa-pulse": p,
    "fa-fw": m,
    "fa-inverse": b,
    "fa-border": x,
    "fa-li": v,
    "fa-flip": y === !0,
    "fa-flip-horizontal": y === "horizontal" || y === "both",
    "fa-flip-vertical": y === "vertical" || y === "both"
  }, Yn(t, "fa-".concat(w), typeof w < "u" && w !== null), Yn(t, "fa-rotate-".concat(P), typeof P < "u" && P !== null && P !== 0), Yn(t, "fa-pull-".concat(S), typeof S < "u" && S !== null), Yn(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(_).map(function(h) {
    return _[h] ? h : null;
  }).filter(function(h) {
    return h;
  });
}
function VE(e) {
  return e = e - 0, e === e;
}
function Jm(e) {
  return VE(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var UE = ["style"];
function qE(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function KE(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), a = Jm(n.slice(0, r)), o = n.slice(r + 1).trim();
    return a.startsWith("webkit") ? t[qE(a)] = o : t[a] = o, t;
  }, {});
}
function Zm(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(l) {
    return Zm(e, l);
  }), a = Object.keys(t.attributes || {}).reduce(function(l, c) {
    var u = t.attributes[c];
    switch (c) {
      case "class":
        l.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        l.attrs.style = KE(u);
        break;
      default:
        c.indexOf("aria-") === 0 || c.indexOf("data-") === 0 ? l.attrs[c.toLowerCase()] = u : l.attrs[Jm(c)] = u;
    }
    return l;
  }, {
    attrs: {}
  }), o = n.style, i = o === void 0 ? {} : o, s = $E(n, UE);
  return a.attrs.style = vt(vt({}, a.attrs.style), i), e.apply(void 0, [t.tag, vt(vt({}, a.attrs), s)].concat(_s(r)));
}
var Qm = !1;
try {
  Qm = process.env.NODE_ENV === "production";
} catch {
}
function XE() {
  if (!Qm && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Sf(e) {
  if (e && Va(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Cs.icon)
    return Cs.icon(e);
  if (e === null)
    return null;
  if (e && Va(e) === "object" && e.prefix && e.iconName)
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
function xi(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Yn({}, e, t) : {};
}
var Af = {
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
}, rt = /* @__PURE__ */ ue.forwardRef(function(e, t) {
  var n = vt(vt({}, Af), e), r = n.icon, a = n.mask, o = n.symbol, i = n.className, s = n.title, l = n.titleId, c = n.maskId, u = Sf(r), p = xi("classes", [].concat(_s(YE(n)), _s((i || "").split(" ")))), m = xi("transform", typeof n.transform == "string" ? Cs.transform(n.transform) : n.transform), b = xi("mask", Sf(a)), x = _E(u, vt(vt(vt(vt({}, p), m), b), {}, {
    symbol: o,
    title: s,
    titleId: l,
    maskId: c
  }));
  if (!x)
    return XE("Could not find icon", u), null;
  var v = x.abstract, y = {
    ref: t
  };
  return Object.keys(n).forEach(function(w) {
    Af.hasOwnProperty(w) || (y[w] = n[w]);
  }), JE(v[0], y);
});
rt.displayName = "FontAwesomeIcon";
rt.propTypes = {
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
var JE = Zm.bind(null, ue.createElement);
const Fl = "-", ZE = (e) => {
  const t = ek(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (a) => {
      const o = a.split(Fl);
      return o[0] === "" && o.length !== 1 && o.shift(), eg(o, t) || QE(a);
    },
    getConflictingClassGroupIds: (a, o) => {
      const i = n[a] || [];
      return o && r[a] ? [...i, ...r[a]] : i;
    }
  };
}, eg = (e, t) => {
  var n;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], a = t.nextPart.get(r), o = a ? eg(e.slice(1), a) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const i = e.join(Fl);
  return (n = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : n.classGroupId;
}, Cf = /^\[(.+)\]$/, QE = (e) => {
  if (Cf.test(e)) {
    const t = Cf.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, ek = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return nk(Object.entries(e.classGroups), n).forEach(([a, o]) => {
    Ns(o, r, a, t);
  }), r;
}, Ns = (e, t, n, r) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : _f(t, a);
      o.classGroupId = n;
      return;
    }
    if (typeof a == "function") {
      if (tk(a)) {
        Ns(a(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: n
      });
      return;
    }
    Object.entries(a).forEach(([o, i]) => {
      Ns(i, _f(t, o), n, r);
    });
  });
}, _f = (e, t) => {
  let n = e;
  return t.split(Fl).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, tk = (e) => e.isThemeGetter, nk = (e, t) => t ? e.map(([n, r]) => {
  const a = r.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([i, s]) => [t + i, s])) : o);
  return [n, a];
}) : e, rk = (e) => {
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
}, tg = "!", ak = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, a = t[0], o = t.length, i = (s) => {
    const l = [];
    let c = 0, u = 0, p;
    for (let y = 0; y < s.length; y++) {
      let w = s[y];
      if (c === 0) {
        if (w === a && (r || s.slice(y, y + o) === t)) {
          l.push(s.slice(u, y)), u = y + o;
          continue;
        }
        if (w === "/") {
          p = y;
          continue;
        }
      }
      w === "[" ? c++ : w === "]" && c--;
    }
    const m = l.length === 0 ? s : s.substring(u), b = m.startsWith(tg), x = b ? m.substring(1) : m, v = p && p > u ? p - u : void 0;
    return {
      modifiers: l,
      hasImportantModifier: b,
      baseClassName: x,
      maybePostfixModifierPosition: v
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, ok = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, ik = (e) => ({
  cache: rk(e.cacheSize),
  parseClassName: ak(e),
  ...ZE(e)
}), sk = /\s+/, lk = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: a
  } = t, o = [], i = e.trim().split(sk);
  let s = "";
  for (let l = i.length - 1; l >= 0; l -= 1) {
    const c = i[l], {
      modifiers: u,
      hasImportantModifier: p,
      baseClassName: m,
      maybePostfixModifierPosition: b
    } = n(c);
    let x = !!b, v = r(x ? m.substring(0, b) : m);
    if (!v) {
      if (!x) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (v = r(m), !v) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      x = !1;
    }
    const y = ok(u).join(":"), w = p ? y + tg : y, P = w + v;
    if (o.includes(P))
      continue;
    o.push(P);
    const S = a(v, x);
    for (let _ = 0; _ < S.length; ++_) {
      const h = S[_];
      o.push(w + h);
    }
    s = c + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function ck() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = ng(t)) && (r && (r += " "), r += n);
  return r;
}
const ng = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = ng(e[r])) && (n && (n += " "), n += t);
  return n;
};
function uk(e, ...t) {
  let n, r, a, o = i;
  function i(l) {
    const c = t.reduce((u, p) => p(u), e());
    return n = ik(c), r = n.cache.get, a = n.cache.set, o = s, s(l);
  }
  function s(l) {
    const c = r(l);
    if (c)
      return c;
    const u = lk(l, n);
    return a(l, u), u;
  }
  return function() {
    return o(ck.apply(null, arguments));
  };
}
const Ne = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, rg = /^\[(?:([a-z-]+):)?(.+)\]$/i, fk = /^\d+\/\d+$/, dk = /* @__PURE__ */ new Set(["px", "full", "screen"]), pk = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, mk = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, gk = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, hk = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, yk = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, jt = (e) => Zn(e) || dk.has(e) || fk.test(e), Zt = (e) => fr(e, "length", Ok), Zn = (e) => !!e && !Number.isNaN(Number(e)), wi = (e) => fr(e, "number", Zn), xr = (e) => !!e && Number.isInteger(Number(e)), bk = (e) => e.endsWith("%") && Zn(e.slice(0, -1)), me = (e) => rg.test(e), Qt = (e) => pk.test(e), vk = /* @__PURE__ */ new Set(["length", "size", "percentage"]), xk = (e) => fr(e, vk, ag), wk = (e) => fr(e, "position", ag), Ek = /* @__PURE__ */ new Set(["image", "url"]), kk = (e) => fr(e, Ek, Ak), Pk = (e) => fr(e, "", Sk), wr = () => !0, fr = (e, t, n) => {
  const r = rg.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, Ok = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  mk.test(e) && !gk.test(e)
), ag = () => !1, Sk = (e) => hk.test(e), Ak = (e) => yk.test(e), Ck = () => {
  const e = Ne("colors"), t = Ne("spacing"), n = Ne("blur"), r = Ne("brightness"), a = Ne("borderColor"), o = Ne("borderRadius"), i = Ne("borderSpacing"), s = Ne("borderWidth"), l = Ne("contrast"), c = Ne("grayscale"), u = Ne("hueRotate"), p = Ne("invert"), m = Ne("gap"), b = Ne("gradientColorStops"), x = Ne("gradientColorStopPositions"), v = Ne("inset"), y = Ne("margin"), w = Ne("opacity"), P = Ne("padding"), S = Ne("saturate"), _ = Ne("scale"), h = Ne("sepia"), G = Ne("skew"), U = Ne("space"), te = Ne("translate"), X = () => ["auto", "contain", "none"], Z = () => ["auto", "hidden", "clip", "visible", "scroll"], Q = () => ["auto", me, t], B = () => [me, t], oe = () => ["", jt, Zt], q = () => ["auto", Zn, me], J = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], Y = () => ["solid", "dashed", "dotted", "double", "none"], M = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], K = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], z = () => ["", "0", me], g = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], d = () => [Zn, me];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [wr],
      spacing: [jt, Zt],
      blur: ["none", "", Qt, me],
      brightness: d(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Qt, me],
      borderSpacing: B(),
      borderWidth: oe(),
      contrast: d(),
      grayscale: z(),
      hueRotate: d(),
      invert: z(),
      gap: B(),
      gradientColorStops: [e],
      gradientColorStopPositions: [bk, Zt],
      inset: Q(),
      margin: Q(),
      opacity: d(),
      padding: B(),
      saturate: d(),
      scale: d(),
      sepia: z(),
      skew: d(),
      space: B(),
      translate: B()
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
        columns: [Qt]
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
        object: [...J(), me]
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
        overscroll: X()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": X()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": X()
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
        z: ["auto", xr, me]
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
        order: ["first", "last", "none", xr, me]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [wr]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", xr, me]
        }, me]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": q()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": q()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [wr]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [xr, me]
        }, me]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": q()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": q()
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
        gap: [m]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [m]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [m]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...K()]
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
        content: ["normal", ...K(), "baseline"]
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
        "place-content": [...K(), "baseline"]
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
        p: [P]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [P]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [P]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [P]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [P]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [P]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [P]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [P]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [P]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [y]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [y]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [y]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [y]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [y]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [y]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [y]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [y]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [y]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [U]
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
        "space-y": [U]
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
          screen: [Qt]
        }, Qt]
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
        text: ["base", Qt, Zt]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", wi]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [wr]
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
        "line-clamp": ["none", Zn, wi]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", jt, me]
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
        "placeholder-opacity": [w]
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
        "text-opacity": [w]
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
        decoration: ["auto", "from-font", jt, Zt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", jt, me]
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
        indent: B()
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
        "bg-opacity": [w]
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
        bg: [...J(), wk]
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
        bg: ["auto", "cover", "contain", xk]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, kk]
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
        from: [x]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [x]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [x]
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
        "border-opacity": [w]
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
        "divide-opacity": [w]
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
        outline: ["", ...Y()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [jt, me]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [jt, Zt]
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
        ring: oe()
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
        "ring-opacity": [w]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [jt, Zt]
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
        shadow: ["", "inner", "none", Qt, Pk]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [wr]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [w]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...M(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": M()
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
        "drop-shadow": ["", "none", Qt, me]
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
        invert: [p]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [S]
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
        "backdrop-invert": [p]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [w]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [S]
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
        duration: d()
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
        delay: d()
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
        scale: [_]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [_]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [_]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [xr, me]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [te]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [te]
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
        "scroll-m": B()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": B()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": B()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": B()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": B()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": B()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": B()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": B()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": B()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": B()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": B()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": B()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": B()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": B()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": B()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": B()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": B()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": B()
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
        stroke: [jt, Zt, wi]
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
}, Tf = /* @__PURE__ */ uk(Ck);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Hn = {
  prefix: "fas",
  iconName: "spinner-third",
  icon: [512, 512, [], "f3f4", "M224 32c0-17.7 14.3-32 32-32C397.4 0 512 114.6 512 256c0 46.6-12.5 90.4-34.3 128c-8.8 15.3-28.4 20.5-43.7 11.7s-20.5-28.4-11.7-43.7c16.3-28.2 25.7-61 25.7-96c0-106-86-192-192-192c-17.7 0-32-14.3-32-32z"]
}, Ei = ({
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
  href: u,
  target: p,
  ...m
}) => {
  function b(y) {
    switch (y) {
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
  const x = Tf(
    i || l ? "opacity-50 pointer-events-none" : ""
  ), v = Tf(
    "w-fit text-sm font-medium rounded-lg px-3 py-2 border border-transparent shadow-sm focus-visible:outline focus-visible:outline-0 focus-visible:outline-offset-0 transition-all duration-150 flex gap-2 items-center justify-center active:scale-95 transform",
    b(o),
    r,
    x
  );
  return a ? /* @__PURE__ */ Ge("label", { className: v, htmlFor: a, style: m.style, children: [
    l && !s ? /* @__PURE__ */ se(rt, { icon: Hn, className: "animate-spin" }) : /* @__PURE__ */ se(yn, { children: e && !s ? /* @__PURE__ */ se(rt, { icon: e, className: t }) : null }),
    n,
    l && s ? /* @__PURE__ */ se(rt, { icon: Hn, className: "animate-spin" }) : /* @__PURE__ */ se(yn, { children: e && s ? /* @__PURE__ */ se(rt, { icon: e, className: t }) : null })
  ] }) : c === "link" && u ? /* @__PURE__ */ Ge(
    "a",
    {
      href: u,
      className: v,
      style: m.style,
      ...m,
      target: p,
      children: [
        l && !s ? /* @__PURE__ */ se(rt, { icon: Hn, className: "animate-spin" }) : /* @__PURE__ */ se(yn, { children: e && !s ? /* @__PURE__ */ se(rt, { icon: e, className: t }) : null }),
        n,
        l && s ? /* @__PURE__ */ se(rt, { icon: Hn, className: "animate-spin" }) : /* @__PURE__ */ se(yn, { children: e && s ? /* @__PURE__ */ se(rt, { icon: e, className: t }) : null })
      ]
    }
  ) : /* @__PURE__ */ Ge(
    "button",
    {
      className: v,
      disabled: i || l,
      ...m,
      htmlFor: a,
      children: [
        l && !s ? /* @__PURE__ */ se(rt, { icon: Hn, className: "animate-spin" }) : /* @__PURE__ */ se(yn, { children: e && !s ? /* @__PURE__ */ se(rt, { icon: e, className: t }) : null }),
        n,
        l && s ? /* @__PURE__ */ se(rt, { icon: Hn, className: "animate-spin" }) : /* @__PURE__ */ se(yn, { children: e && s ? /* @__PURE__ */ se(rt, { icon: e, className: t }) : null })
      ]
    }
  );
};
var Ta = /* @__PURE__ */ ((e) => (e[e.ALL = 0] = "ALL", e[e.FEATURED = 1] = "FEATURED", e[e.MINE = 2] = "MINE", e[e.BOOKMARKED = 3] = "BOOKMARKED", e))(Ta || {});
Ta.FEATURED, Ta.MINE, Ta.BOOKMARKED;
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function _k(e, t, n) {
  return (t = Nk(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Nf(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function W(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Nf(Object(n), !0).forEach(function(r) {
      _k(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Nf(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Tk(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Nk(e) {
  var t = Tk(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const If = () => {
};
let Rl = {}, og = {}, ig = null, sg = {
  mark: If,
  measure: If
};
try {
  typeof window < "u" && (Rl = window), typeof document < "u" && (og = document), typeof MutationObserver < "u" && (ig = MutationObserver), typeof performance < "u" && (sg = performance);
} catch {
}
const {
  userAgent: jf = ""
} = Rl.navigator || {}, dn = Rl, Me = og, Mf = ig, wa = sg;
dn.document;
const Vt = !!Me.documentElement && !!Me.head && typeof Me.addEventListener == "function" && typeof Me.createElement == "function", lg = ~jf.indexOf("MSIE") || ~jf.indexOf("Trident/");
var Ik = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, jk = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, cg = {
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
}, Mk = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, ug = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Qe = "classic", ko = "duotone", Fk = "sharp", Rk = "sharp-duotone", fg = [Qe, ko, Fk, Rk], Lk = {
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
}, Dk = {
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
}, zk = /* @__PURE__ */ new Map([["classic", {
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
}]]), $k = {
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
}, Hk = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Ff = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, Wk = ["kit"], Bk = {
  kit: {
    "fa-kit": "fak"
  }
}, Gk = ["fak", "fakd"], Yk = {
  kit: {
    fak: "fa-kit"
  }
}, Rf = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Ea = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Vk = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Uk = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], qk = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, Kk = {
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
}, Xk = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Is = {
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
}, Jk = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], js = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...Vk, ...Jk], Zk = ["solid", "regular", "light", "thin", "duotone", "brands"], dg = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], Qk = dg.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), eP = [...Object.keys(Xk), ...Zk, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Ea.GROUP, Ea.SWAP_OPACITY, Ea.PRIMARY, Ea.SECONDARY].concat(dg.map((e) => "".concat(e, "x"))).concat(Qk.map((e) => "w-".concat(e))), tP = {
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
const Wt = "___FONT_AWESOME___", Ms = 16, pg = "fa", mg = "svg-inline--fa", Mn = "data-fa-i2svg", Fs = "data-fa-pseudo-element", nP = "data-fa-pseudo-element-pending", Ll = "data-prefix", Dl = "data-icon", Lf = "fontawesome-i2svg", rP = "async", aP = ["HTML", "HEAD", "STYLE", "SCRIPT"], gg = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function ea(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[Qe];
    }
  });
}
const hg = W({}, cg);
hg[Qe] = W(W(W(W({}, {
  "fa-duotone": "duotone"
}), cg[Qe]), Ff.kit), Ff["kit-duotone"]);
const oP = ea(hg), Rs = W({}, $k);
Rs[Qe] = W(W(W(W({}, {
  duotone: "fad"
}), Rs[Qe]), Rf.kit), Rf["kit-duotone"]);
const Df = ea(Rs), Ls = W({}, Is);
Ls[Qe] = W(W({}, Ls[Qe]), Yk.kit);
const zl = ea(Ls), Ds = W({}, Kk);
Ds[Qe] = W(W({}, Ds[Qe]), Bk.kit);
ea(Ds);
const iP = Ik, yg = "fa-layers-text", sP = jk, lP = W({}, Lk);
ea(lP);
const cP = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], ki = Mk, uP = [...Wk, ...eP], Tr = dn.FontAwesomeConfig || {};
function fP(e) {
  var t = Me.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function dP(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
Me && typeof Me.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, n] = e;
  const r = dP(fP(t));
  r != null && (Tr[n] = r);
});
const bg = {
  styleDefault: "solid",
  familyDefault: Qe,
  cssPrefix: pg,
  replacementClass: mg,
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
Tr.familyPrefix && (Tr.cssPrefix = Tr.familyPrefix);
const or = W(W({}, bg), Tr);
or.autoReplaceSvg || (or.observeMutations = !1);
const ae = {};
Object.keys(bg).forEach((e) => {
  Object.defineProperty(ae, e, {
    enumerable: !0,
    set: function(t) {
      or[e] = t, Nr.forEach((n) => n(ae));
    },
    get: function() {
      return or[e];
    }
  });
});
Object.defineProperty(ae, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    or.cssPrefix = e, Nr.forEach((t) => t(ae));
  },
  get: function() {
    return or.cssPrefix;
  }
});
dn.FontAwesomeConfig = ae;
const Nr = [];
function pP(e) {
  return Nr.push(e), () => {
    Nr.splice(Nr.indexOf(e), 1);
  };
}
const en = Ms, St = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function mP(e) {
  if (!e || !Vt)
    return;
  const t = Me.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = Me.head.childNodes;
  let r = null;
  for (let a = n.length - 1; a > -1; a--) {
    const o = n[a], i = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = o);
  }
  return Me.head.insertBefore(t, r), e;
}
const gP = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Wr() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += gP[Math.random() * 62 | 0];
  return t;
}
function dr(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function $l(e) {
  return e.classList ? dr(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function vg(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function hP(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(vg(e[n]), '" '), "").trim();
}
function Po(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function Hl(e) {
  return e.size !== St.size || e.x !== St.x || e.y !== St.y || e.rotate !== St.rotate || e.flipX || e.flipY;
}
function yP(e) {
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
function bP(e) {
  let {
    transform: t,
    width: n = Ms,
    height: r = Ms,
    startCentered: a = !1
  } = e, o = "";
  return a && lg ? o += "translate(".concat(t.x / en - n / 2, "em, ").concat(t.y / en - r / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / en, "em), calc(-50% + ").concat(t.y / en, "em)) ") : o += "translate(".concat(t.x / en, "em, ").concat(t.y / en, "em) "), o += "scale(".concat(t.size / en * (t.flipX ? -1 : 1), ", ").concat(t.size / en * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var vP = `:root, :host {
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
function xg() {
  const e = pg, t = mg, n = ae.cssPrefix, r = ae.replacementClass;
  let a = vP;
  if (n !== e || r !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return a;
}
let zf = !1;
function Pi() {
  ae.autoAddCss && !zf && (mP(xg()), zf = !0);
}
var xP = {
  mixout() {
    return {
      dom: {
        css: xg,
        insertCss: Pi
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Pi();
      },
      beforeI2svg() {
        Pi();
      }
    };
  }
};
const Bt = dn || {};
Bt[Wt] || (Bt[Wt] = {});
Bt[Wt].styles || (Bt[Wt].styles = {});
Bt[Wt].hooks || (Bt[Wt].hooks = {});
Bt[Wt].shims || (Bt[Wt].shims = []);
var At = Bt[Wt];
const wg = [], Eg = function() {
  Me.removeEventListener("DOMContentLoaded", Eg), Ua = 1, wg.map((e) => e());
};
let Ua = !1;
Vt && (Ua = (Me.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(Me.readyState), Ua || Me.addEventListener("DOMContentLoaded", Eg));
function wP(e) {
  Vt && (Ua ? setTimeout(e, 0) : wg.push(e));
}
function ta(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? vg(e) : "<".concat(t, " ").concat(hP(n), ">").concat(r.map(ta).join(""), "</").concat(t, ">");
}
function $f(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var Oi = function(e, t, n, r) {
  var a = Object.keys(e), o = a.length, i = t, s, l, c;
  for (n === void 0 ? (s = 1, c = e[a[0]]) : (s = 0, c = n); s < o; s++)
    l = a[s], c = i(c, e[l], l, e);
  return c;
};
function EP(e) {
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
function kg(e) {
  const t = EP(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function kP(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), a;
  return r >= 55296 && r <= 56319 && n > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (r - 55296) * 1024 + a - 56320 + 65536 : r;
}
function Hf(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function zs(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, a = Hf(t);
  typeof At.hooks.addPack == "function" && !r ? At.hooks.addPack(e, Hf(t)) : At.styles[e] = W(W({}, At.styles[e] || {}), a), e === "fas" && zs("fa", t);
}
const {
  styles: Br,
  shims: PP
} = At, Pg = Object.keys(zl), OP = Pg.reduce((e, t) => (e[t] = Object.keys(zl[t]), e), {});
let Wl = null, Og = {}, Sg = {}, Ag = {}, Cg = {}, _g = {};
function SP(e) {
  return ~uP.indexOf(e);
}
function AP(e, t) {
  const n = t.split("-"), r = n[0], a = n.slice(1).join("-");
  return r === e && a !== "" && !SP(a) ? a : null;
}
const Tg = () => {
  const e = (r) => Oi(Br, (a, o, i) => (a[i] = Oi(o, r, {}), a), {});
  Og = e((r, a, o) => (a[3] && (r[a[3]] = o), a[2] && a[2].filter((i) => typeof i == "number").forEach((i) => {
    r[i.toString(16)] = o;
  }), r)), Sg = e((r, a, o) => (r[o] = o, a[2] && a[2].filter((i) => typeof i == "string").forEach((i) => {
    r[i] = o;
  }), r)), _g = e((r, a, o) => {
    const i = a[2];
    return r[o] = o, i.forEach((s) => {
      r[s] = o;
    }), r;
  });
  const t = "far" in Br || ae.autoFetchSvg, n = Oi(PP, (r, a) => {
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
  Ag = n.names, Cg = n.unicodes, Wl = Oo(ae.styleDefault, {
    family: ae.familyDefault
  });
};
pP((e) => {
  Wl = Oo(e.styleDefault, {
    family: ae.familyDefault
  });
});
Tg();
function Bl(e, t) {
  return (Og[e] || {})[t];
}
function CP(e, t) {
  return (Sg[e] || {})[t];
}
function Pn(e, t) {
  return (_g[e] || {})[t];
}
function Ng(e) {
  return Ag[e] || {
    prefix: null,
    iconName: null
  };
}
function _P(e) {
  const t = Cg[e], n = Bl("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function pn() {
  return Wl;
}
const Ig = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function TP(e) {
  let t = Qe;
  const n = Pg.reduce((r, a) => (r[a] = "".concat(ae.cssPrefix, "-").concat(a), r), {});
  return fg.forEach((r) => {
    (e.includes(n[r]) || e.some((a) => OP[r].includes(a))) && (t = r);
  }), t;
}
function Oo(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = Qe
  } = t, r = oP[n][e];
  if (n === ko && !e)
    return "fad";
  const a = Df[n][e] || Df[n][r], o = e in At.styles ? e : null;
  return a || o || null;
}
function NP(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const a = AP(ae.cssPrefix, r);
    a ? n = a : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function Wf(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function So(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const a = js.concat(Uk), o = Wf(e.filter((p) => a.includes(p))), i = Wf(e.filter((p) => !js.includes(p))), s = o.filter((p) => (r = p, !ug.includes(p))), [l = null] = s, c = TP(o), u = W(W({}, NP(i)), {}, {
    prefix: Oo(l, {
      family: c
    })
  });
  return W(W(W({}, u), FP({
    values: e,
    family: c,
    styles: Br,
    config: ae,
    canonical: u,
    givenPrefix: r
  })), IP(n, r, u));
}
function IP(e, t, n) {
  let {
    prefix: r,
    iconName: a
  } = n;
  if (e || !r || !a)
    return {
      prefix: r,
      iconName: a
    };
  const o = t === "fa" ? Ng(a) : {}, i = Pn(r, a);
  return a = o.iconName || i || a, r = o.prefix || r, r === "far" && !Br.far && Br.fas && !ae.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: a
  };
}
const jP = fg.filter((e) => e !== Qe || e !== ko), MP = Object.keys(Is).filter((e) => e !== Qe).map((e) => Object.keys(Is[e])).flat();
function FP(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: a = "",
    styles: o = {},
    config: i = {}
  } = e, s = n === ko, l = t.includes("fa-duotone") || t.includes("fad"), c = i.familyDefault === "duotone", u = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (l || c || u) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && jP.includes(n) && (Object.keys(o).find((p) => MP.includes(p)) || i.autoFetchSvg)) {
    const p = zk.get(n).defaultShortPrefixId;
    r.prefix = p, r.iconName = Pn(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || a === "fa") && (r.prefix = pn() || "fas"), r;
}
class RP {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const a = n.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = W(W({}, this.definitions[o] || {}), a[o]), zs(o, a[o]);
      const i = zl[Qe][o];
      i && zs(i, a[o]), Tg();
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
let Bf = [], Vn = {};
const Qn = {}, LP = Object.keys(Qn);
function DP(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return Bf = e, Vn = {}, Object.keys(Qn).forEach((r) => {
    LP.indexOf(r) === -1 && delete Qn[r];
  }), Bf.forEach((r) => {
    const a = r.mixout ? r.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (n[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((i) => {
        n[o] || (n[o] = {}), n[o][i] = a[o][i];
      });
    }), r.hooks) {
      const o = r.hooks();
      Object.keys(o).forEach((i) => {
        Vn[i] || (Vn[i] = []), Vn[i].push(o[i]);
      });
    }
    r.provides && r.provides(Qn);
  }), n;
}
function $s(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), a = 2; a < n; a++)
    r[a - 2] = arguments[a];
  return (Vn[e] || []).forEach((o) => {
    t = o.apply(null, [t, ...r]);
  }), t;
}
function Fn(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (Vn[e] || []).forEach((a) => {
    a.apply(null, n);
  });
}
function mn() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Qn[e] ? Qn[e].apply(null, t) : void 0;
}
function Hs(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || pn();
  if (t)
    return t = Pn(n, t) || t, $f(jg.definitions, n, t) || $f(At.styles, n, t);
}
const jg = new RP(), zP = () => {
  ae.autoReplaceSvg = !1, ae.observeMutations = !1, Fn("noAuto");
}, $P = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return Vt ? (Fn("beforeI2svg", e), mn("pseudoElements2svg", e), mn("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    ae.autoReplaceSvg === !1 && (ae.autoReplaceSvg = !0), ae.observeMutations = !0, wP(() => {
      WP({
        autoReplaceSvgRoot: t
      }), Fn("watch", e);
    });
  }
}, HP = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Pn(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = Oo(e[0]);
      return {
        prefix: n,
        iconName: Pn(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(ae.cssPrefix, "-")) > -1 || e.match(iP))) {
      const t = So(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || pn(),
        iconName: Pn(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = pn();
      return {
        prefix: t,
        iconName: Pn(t, e) || e
      };
    }
  }
}, ut = {
  noAuto: zP,
  config: ae,
  dom: $P,
  parse: HP,
  library: jg,
  findIconDefinition: Hs,
  toHtml: ta
}, WP = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = Me
  } = e;
  (Object.keys(At.styles).length > 0 || ae.autoFetchSvg) && Vt && ae.autoReplaceSvg && ut.dom.i2svg({
    node: t
  });
};
function Ao(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => ta(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!Vt) return;
      const n = Me.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function BP(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: a,
    styles: o,
    transform: i
  } = e;
  if (Hl(i) && n.found && !r.found) {
    const {
      width: s,
      height: l
    } = n, c = {
      x: s / l / 2,
      y: 0.5
    };
    a.style = Po(W(W({}, o), {}, {
      "transform-origin": "".concat(c.x + i.x / 16, "em ").concat(c.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function GP(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: a,
    symbol: o
  } = e;
  const i = o === !0 ? "".concat(t, "-").concat(ae.cssPrefix, "-").concat(n) : o;
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
      children: r
    }]
  }];
}
function Gl(e) {
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
    extra: u,
    watchable: p = !1
  } = e, {
    width: m,
    height: b
  } = n.found ? n : t, x = Gk.includes(r), v = [ae.replacementClass, a ? "".concat(ae.cssPrefix, "-").concat(a) : ""].filter((h) => u.classes.indexOf(h) === -1).filter((h) => h !== "" || !!h).concat(u.classes).join(" ");
  let y = {
    children: [],
    attributes: W(W({}, u.attributes), {}, {
      "data-prefix": r,
      "data-icon": a,
      class: v,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(m, " ").concat(b)
    })
  };
  const w = x && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(m / b * 16 * 0.0625, "em")
  } : {};
  p && (y.attributes[Mn] = ""), s && (y.children.push({
    tag: "title",
    attributes: {
      id: y.attributes["aria-labelledby"] || "title-".concat(c || Wr())
    },
    children: [s]
  }), delete y.attributes.title);
  const P = W(W({}, y), {}, {
    prefix: r,
    iconName: a,
    main: t,
    mask: n,
    maskId: l,
    transform: o,
    symbol: i,
    styles: W(W({}, w), u.styles)
  }), {
    children: S,
    attributes: _
  } = n.found && t.found ? mn("generateAbstractMask", P) || {
    children: [],
    attributes: {}
  } : mn("generateAbstractIcon", P) || {
    children: [],
    attributes: {}
  };
  return P.children = S, P.attributes = _, i ? GP(P) : BP(P);
}
function Gf(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: a,
    title: o,
    extra: i,
    watchable: s = !1
  } = e, l = W(W(W({}, i.attributes), o ? {
    title: o
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (l[Mn] = "");
  const c = W({}, i.styles);
  Hl(a) && (c.transform = bP({
    transform: a,
    startCentered: !0,
    width: n,
    height: r
  }), c["-webkit-transform"] = c.transform);
  const u = Po(c);
  u.length > 0 && (l.style = u);
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
function YP(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, a = W(W(W({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), o = Po(r.styles);
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
  styles: Si
} = At;
function Ws(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let a = null;
  return Array.isArray(r) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(ae.cssPrefix, "-").concat(ki.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(ae.cssPrefix, "-").concat(ki.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(ae.cssPrefix, "-").concat(ki.PRIMARY),
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
const VP = {
  found: !1,
  width: 512,
  height: 512
};
function UP(e, t) {
  !gg && !ae.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Bs(e, t) {
  let n = t;
  return t === "fa" && ae.styleDefault !== null && (t = pn()), new Promise((r, a) => {
    if (n === "fa") {
      const o = Ng(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && Si[t] && Si[t][e]) {
      const o = Si[t][e];
      return r(Ws(o));
    }
    UP(e, t), r(W(W({}, VP), {}, {
      icon: ae.showMissingIcons && e ? mn("missingIconAbstract") || {} : {}
    }));
  });
}
const Yf = () => {
}, Gs = ae.measurePerformance && wa && wa.mark && wa.measure ? wa : {
  mark: Yf,
  measure: Yf
}, Pr = 'FA "6.7.2"', qP = (e) => (Gs.mark("".concat(Pr, " ").concat(e, " begins")), () => Mg(e)), Mg = (e) => {
  Gs.mark("".concat(Pr, " ").concat(e, " ends")), Gs.measure("".concat(Pr, " ").concat(e), "".concat(Pr, " ").concat(e, " begins"), "".concat(Pr, " ").concat(e, " ends"));
};
var Yl = {
  begin: qP,
  end: Mg
};
const Na = () => {
};
function Vf(e) {
  return typeof (e.getAttribute ? e.getAttribute(Mn) : null) == "string";
}
function KP(e) {
  const t = e.getAttribute ? e.getAttribute(Ll) : null, n = e.getAttribute ? e.getAttribute(Dl) : null;
  return t && n;
}
function XP(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(ae.replacementClass);
}
function JP() {
  return ae.autoReplaceSvg === !0 ? Ia.replace : Ia[ae.autoReplaceSvg] || Ia.replace;
}
function ZP(e) {
  return Me.createElementNS("http://www.w3.org/2000/svg", e);
}
function QP(e) {
  return Me.createElement(e);
}
function Fg(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? ZP : QP
  } = t;
  if (typeof e == "string")
    return Me.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(a) {
    r.setAttribute(a, e.attributes[a]);
  }), (e.children || []).forEach(function(a) {
    r.appendChild(Fg(a, {
      ceFn: n
    }));
  }), r;
}
function eO(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const Ia = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(Fg(n), t);
      }), t.getAttribute(Mn) === null && ae.keepOriginalSource) {
        let n = Me.createComment(eO(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~$l(t).indexOf(ae.replacementClass))
      return Ia.replace(e);
    const r = new RegExp("".concat(ae.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const o = n[0].attributes.class.split(" ").reduce((i, s) => (s === ae.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = n.map((o) => ta(o)).join(`
`);
    t.setAttribute(Mn, ""), t.innerHTML = a;
  }
};
function Uf(e) {
  e();
}
function Rg(e, t) {
  const n = typeof t == "function" ? t : Na;
  if (e.length === 0)
    n();
  else {
    let r = Uf;
    ae.mutateApproach === rP && (r = dn.requestAnimationFrame || Uf), r(() => {
      const a = JP(), o = Yl.begin("mutate");
      e.map(a), o(), n();
    });
  }
}
let Vl = !1;
function Lg() {
  Vl = !0;
}
function Ys() {
  Vl = !1;
}
let qa = null;
function qf(e) {
  if (!Mf || !ae.observeMutations)
    return;
  const {
    treeCallback: t = Na,
    nodeCallback: n = Na,
    pseudoElementsCallback: r = Na,
    observeMutationsRoot: a = Me
  } = e;
  qa = new Mf((o) => {
    if (Vl) return;
    const i = pn();
    dr(o).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Vf(s.addedNodes[0]) && (ae.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && ae.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && Vf(s.target) && ~cP.indexOf(s.attributeName))
        if (s.attributeName === "class" && KP(s.target)) {
          const {
            prefix: l,
            iconName: c
          } = So($l(s.target));
          s.target.setAttribute(Ll, l || i), c && s.target.setAttribute(Dl, c);
        } else XP(s.target) && n(s.target);
    });
  }), Vt && qa.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function tO() {
  qa && qa.disconnect();
}
function nO(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, a) => {
    const o = a.split(":"), i = o[0], s = o.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function rO(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = So($l(e));
  return a.prefix || (a.prefix = pn()), t && n && (a.prefix = t, a.iconName = n), a.iconName && a.prefix || (a.prefix && r.length > 0 && (a.iconName = CP(a.prefix, e.innerText) || Bl(a.prefix, kg(e.innerText))), !a.iconName && ae.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function aO(e) {
  const t = dr(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return ae.autoA11y && (n ? t["aria-labelledby"] = "".concat(ae.replacementClass, "-title-").concat(r || Wr()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function oO() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: St,
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
function Kf(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: a
  } = rO(e), o = aO(e), i = $s("parseNodeAttributes", {}, e);
  let s = t.styleParser ? nO(e) : [];
  return W({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: St,
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
  styles: iO
} = At;
function Dg(e) {
  const t = ae.autoReplaceSvg === "nest" ? Kf(e, {
    styleParser: !1
  }) : Kf(e);
  return ~t.extra.classes.indexOf(yg) ? mn("generateLayersText", e, t) : mn("generateSvgReplacementMutation", e, t);
}
function sO() {
  return [...Hk, ...js];
}
function Xf(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!Vt) return Promise.resolve();
  const n = Me.documentElement.classList, r = (u) => n.add("".concat(Lf, "-").concat(u)), a = (u) => n.remove("".concat(Lf, "-").concat(u)), o = ae.autoFetchSvg ? sO() : ug.concat(Object.keys(iO));
  o.includes("fa") || o.push("fa");
  const i = [".".concat(yg, ":not([").concat(Mn, "])")].concat(o.map((u) => ".".concat(u, ":not([").concat(Mn, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = dr(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), a("complete");
  else
    return Promise.resolve();
  const l = Yl.begin("onTree"), c = s.reduce((u, p) => {
    try {
      const m = Dg(p);
      m && u.push(m);
    } catch (m) {
      gg || m.name === "MissingIcon" && console.error(m);
    }
    return u;
  }, []);
  return new Promise((u, p) => {
    Promise.all(c).then((m) => {
      Rg(m, () => {
        r("active"), r("complete"), a("pending"), typeof t == "function" && t(), l(), u();
      });
    }).catch((m) => {
      l(), p(m);
    });
  });
}
function lO(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  Dg(e).then((n) => {
    n && Rg([n], t);
  });
}
function cO(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : Hs(t || {});
    let {
      mask: a
    } = n;
    return a && (a = (a || {}).icon ? a : Hs(a || {})), e(r, W(W({}, n), {}, {
      mask: a
    }));
  };
}
const uO = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = St,
    symbol: r = !1,
    mask: a = null,
    maskId: o = null,
    title: i = null,
    titleId: s = null,
    classes: l = [],
    attributes: c = {},
    styles: u = {}
  } = t;
  if (!e) return;
  const {
    prefix: p,
    iconName: m,
    icon: b
  } = e;
  return Ao(W({
    type: "icon"
  }, e), () => (Fn("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), ae.autoA11y && (i ? c["aria-labelledby"] = "".concat(ae.replacementClass, "-title-").concat(s || Wr()) : (c["aria-hidden"] = "true", c.focusable = "false")), Gl({
    icons: {
      main: Ws(b),
      mask: a ? Ws(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: p,
    iconName: m,
    transform: W(W({}, St), n),
    symbol: r,
    title: i,
    maskId: o,
    titleId: s,
    extra: {
      attributes: c,
      styles: u,
      classes: l
    }
  })));
};
var fO = {
  mixout() {
    return {
      icon: cO(uO)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Xf, e.nodeCallback = lO, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = Me,
        callback: r = () => {
        }
      } = t;
      return Xf(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: a,
        titleId: o,
        prefix: i,
        transform: s,
        symbol: l,
        mask: c,
        maskId: u,
        extra: p
      } = n;
      return new Promise((m, b) => {
        Promise.all([Bs(r, i), c.iconName ? Bs(c.iconName, c.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((x) => {
          let [v, y] = x;
          m([t, Gl({
            icons: {
              main: v,
              mask: y
            },
            prefix: i,
            iconName: r,
            transform: s,
            symbol: l,
            maskId: u,
            title: a,
            titleId: o,
            extra: p,
            watchable: !0
          })]);
        }).catch(b);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        transform: o,
        styles: i
      } = t;
      const s = Po(i);
      s.length > 0 && (r.style = s);
      let l;
      return Hl(o) && (l = mn("generateAbstractTransformGrouping", {
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
}, dO = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return Ao({
          type: "layer"
        }, () => {
          Fn("beforeDOMElementCreation", {
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
              class: ["".concat(ae.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, pO = {
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
        return Ao({
          type: "counter",
          content: e
        }, () => (Fn("beforeDOMElementCreation", {
          content: e,
          params: t
        }), YP({
          content: e.toString(),
          title: n,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(ae.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, mO = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = St,
          title: r = null,
          classes: a = [],
          attributes: o = {},
          styles: i = {}
        } = t;
        return Ao({
          type: "text",
          content: e
        }, () => (Fn("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Gf({
          content: e,
          transform: W(W({}, St), n),
          title: r,
          extra: {
            attributes: o,
            styles: i,
            classes: ["".concat(ae.cssPrefix, "-layers-text"), ...a]
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
      if (lg) {
        const l = parseInt(getComputedStyle(t).fontSize, 10), c = t.getBoundingClientRect();
        i = c.width / l, s = c.height / l;
      }
      return ae.autoA11y && !r && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, Gf({
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
const gO = new RegExp('"', "ug"), Jf = [1105920, 1112319], Zf = W(W(W(W({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), Dk), tP), qk), Vs = Object.keys(Zf).reduce((e, t) => (e[t.toLowerCase()] = Zf[t], e), {}), hO = Object.keys(Vs).reduce((e, t) => {
  const n = Vs[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function yO(e) {
  const t = e.replace(gO, ""), n = kP(t, 0), r = n >= Jf[0] && n <= Jf[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: kg(a ? t[0] : t),
    isSecondary: r || a
  };
}
function bO(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), a = isNaN(r) ? "normal" : r;
  return (Vs[n] || {})[a] || hO[n];
}
function Qf(e, t) {
  const n = "".concat(nP).concat(t.replace(":", "-"));
  return new Promise((r, a) => {
    if (e.getAttribute(n) !== null)
      return r();
    const o = dr(e.children).filter((p) => p.getAttribute(Fs) === t)[0], i = dn.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), l = s.match(sP), c = i.getPropertyValue("font-weight"), u = i.getPropertyValue("content");
    if (o && !l)
      return e.removeChild(o), r();
    if (l && u !== "none" && u !== "") {
      const p = i.getPropertyValue("content");
      let m = bO(s, c);
      const {
        value: b,
        isSecondary: x
      } = yO(p), v = l[0].startsWith("FontAwesome");
      let y = Bl(m, b), w = y;
      if (v) {
        const P = _P(b);
        P.iconName && P.prefix && (y = P.iconName, m = P.prefix);
      }
      if (y && !x && (!o || o.getAttribute(Ll) !== m || o.getAttribute(Dl) !== w)) {
        e.setAttribute(n, w), o && e.removeChild(o);
        const P = oO(), {
          extra: S
        } = P;
        S.attributes[Fs] = t, Bs(y, m).then((_) => {
          const h = Gl(W(W({}, P), {}, {
            icons: {
              main: _,
              mask: Ig()
            },
            prefix: m,
            iconName: w,
            extra: S,
            watchable: !0
          })), G = Me.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(G, e.firstChild) : e.appendChild(G), G.outerHTML = h.map((U) => ta(U)).join(`
`), e.removeAttribute(n), r();
        }).catch(a);
      } else
        r();
    } else
      r();
  });
}
function vO(e) {
  return Promise.all([Qf(e, "::before"), Qf(e, "::after")]);
}
function xO(e) {
  return e.parentNode !== document.head && !~aP.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Fs) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function ed(e) {
  if (Vt)
    return new Promise((t, n) => {
      const r = dr(e.querySelectorAll("*")).filter(xO).map(vO), a = Yl.begin("searchPseudoElements");
      Lg(), Promise.all(r).then(() => {
        a(), Ys(), t();
      }).catch(() => {
        a(), Ys(), n();
      });
    });
}
var wO = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = ed, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = Me
      } = t;
      ae.searchPseudoElements && ed(n);
    };
  }
};
let td = !1;
var EO = {
  mixout() {
    return {
      dom: {
        unwatch() {
          Lg(), td = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        qf($s("mutationObserverCallbacks", {}));
      },
      noAuto() {
        tO();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        td ? Ys() : qf($s("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const nd = (e) => {
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
var kO = {
  mixout() {
    return {
      parse: {
        transform: (e) => nd(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = nd(n)), e;
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
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), l = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), c = "rotate(".concat(r.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(l, " ").concat(c)
      }, p = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, m = {
        outer: i,
        inner: u,
        path: p
      };
      return {
        tag: "g",
        attributes: W({}, m.outer),
        children: [{
          tag: "g",
          attributes: W({}, m.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: W(W({}, n.icon.attributes), m.path)
          }]
        }]
      };
    };
  }
};
const Ai = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function rd(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function PO(e) {
  return e.tag === "g" ? e.children : [e];
}
var OO = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? So(n.split(" ").map((a) => a.trim())) : Ig();
        return r.prefix || (r.prefix = pn()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        width: u,
        icon: p
      } = o, m = yP({
        transform: s,
        containerWidth: u,
        iconWidth: l
      }), b = {
        tag: "rect",
        attributes: W(W({}, Ai), {}, {
          fill: "white"
        })
      }, x = c.children ? {
        children: c.children.map(rd)
      } : {}, v = {
        tag: "g",
        attributes: W({}, m.inner),
        children: [rd(W({
          tag: c.tag,
          attributes: W(W({}, c.attributes), m.path)
        }, x))]
      }, y = {
        tag: "g",
        attributes: W({}, m.outer),
        children: [v]
      }, w = "mask-".concat(i || Wr()), P = "clip-".concat(i || Wr()), S = {
        tag: "mask",
        attributes: W(W({}, Ai), {}, {
          id: w,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [b, y]
      }, _ = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: P
          },
          children: PO(p)
        }, S]
      };
      return n.push(_, {
        tag: "rect",
        attributes: W({
          fill: "currentColor",
          "clip-path": "url(#".concat(P, ")"),
          mask: "url(#".concat(w, ")")
        }, Ai)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, SO = {
  provides(e) {
    let t = !1;
    dn.matchMedia && (t = dn.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: W(W({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = W(W({}, a), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: W(W({}, r), {}, {
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
      }), n.push(i), n.push({
        tag: "path",
        attributes: W(W({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: W(W({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: W(W({}, r), {}, {
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
        children: n
      };
    };
  }
}, AO = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, CO = [xP, fO, dO, pO, mO, wO, EO, kO, OO, SO, AO];
DP(CO, {
  mixoutsTo: ut
});
ut.noAuto;
ut.config;
ut.library;
ut.dom;
const Us = ut.parse;
ut.findIconDefinition;
ut.toHtml;
const _O = ut.icon;
ut.layer;
ut.text;
ut.counter;
var ka = { exports: {} }, Ci = { exports: {} }, Se = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ad;
function TO() {
  if (ad) return Se;
  ad = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, m = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, x = e ? Symbol.for("react.lazy") : 60116, v = e ? Symbol.for("react.block") : 60121, y = e ? Symbol.for("react.fundamental") : 60117, w = e ? Symbol.for("react.responder") : 60118, P = e ? Symbol.for("react.scope") : 60119;
  function S(h) {
    if (typeof h == "object" && h !== null) {
      var G = h.$$typeof;
      switch (G) {
        case t:
          switch (h = h.type, h) {
            case l:
            case c:
            case r:
            case o:
            case a:
            case p:
              return h;
            default:
              switch (h = h && h.$$typeof, h) {
                case s:
                case u:
                case x:
                case b:
                case i:
                  return h;
                default:
                  return G;
              }
          }
        case n:
          return G;
      }
    }
  }
  function _(h) {
    return S(h) === c;
  }
  return Se.AsyncMode = l, Se.ConcurrentMode = c, Se.ContextConsumer = s, Se.ContextProvider = i, Se.Element = t, Se.ForwardRef = u, Se.Fragment = r, Se.Lazy = x, Se.Memo = b, Se.Portal = n, Se.Profiler = o, Se.StrictMode = a, Se.Suspense = p, Se.isAsyncMode = function(h) {
    return _(h) || S(h) === l;
  }, Se.isConcurrentMode = _, Se.isContextConsumer = function(h) {
    return S(h) === s;
  }, Se.isContextProvider = function(h) {
    return S(h) === i;
  }, Se.isElement = function(h) {
    return typeof h == "object" && h !== null && h.$$typeof === t;
  }, Se.isForwardRef = function(h) {
    return S(h) === u;
  }, Se.isFragment = function(h) {
    return S(h) === r;
  }, Se.isLazy = function(h) {
    return S(h) === x;
  }, Se.isMemo = function(h) {
    return S(h) === b;
  }, Se.isPortal = function(h) {
    return S(h) === n;
  }, Se.isProfiler = function(h) {
    return S(h) === o;
  }, Se.isStrictMode = function(h) {
    return S(h) === a;
  }, Se.isSuspense = function(h) {
    return S(h) === p;
  }, Se.isValidElementType = function(h) {
    return typeof h == "string" || typeof h == "function" || h === r || h === c || h === o || h === a || h === p || h === m || typeof h == "object" && h !== null && (h.$$typeof === x || h.$$typeof === b || h.$$typeof === i || h.$$typeof === s || h.$$typeof === u || h.$$typeof === y || h.$$typeof === w || h.$$typeof === P || h.$$typeof === v);
  }, Se.typeOf = S, Se;
}
var Ce = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var od;
function NO() {
  return od || (od = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, m = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, x = e ? Symbol.for("react.lazy") : 60116, v = e ? Symbol.for("react.block") : 60121, y = e ? Symbol.for("react.fundamental") : 60117, w = e ? Symbol.for("react.responder") : 60118, P = e ? Symbol.for("react.scope") : 60119;
    function S(O) {
      return typeof O == "string" || typeof O == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      O === r || O === c || O === o || O === a || O === p || O === m || typeof O == "object" && O !== null && (O.$$typeof === x || O.$$typeof === b || O.$$typeof === i || O.$$typeof === s || O.$$typeof === u || O.$$typeof === y || O.$$typeof === w || O.$$typeof === P || O.$$typeof === v);
    }
    function _(O) {
      if (typeof O == "object" && O !== null) {
        var Ee = O.$$typeof;
        switch (Ee) {
          case t:
            var qe = O.type;
            switch (qe) {
              case l:
              case c:
              case r:
              case o:
              case a:
              case p:
                return qe;
              default:
                var ht = qe && qe.$$typeof;
                switch (ht) {
                  case s:
                  case u:
                  case x:
                  case b:
                  case i:
                    return ht;
                  default:
                    return Ee;
                }
            }
          case n:
            return Ee;
        }
      }
    }
    var h = l, G = c, U = s, te = i, X = t, Z = u, Q = r, B = x, oe = b, q = n, J = o, Y = a, M = p, K = !1;
    function z(O) {
      return K || (K = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), g(O) || _(O) === l;
    }
    function g(O) {
      return _(O) === c;
    }
    function d(O) {
      return _(O) === s;
    }
    function E(O) {
      return _(O) === i;
    }
    function A(O) {
      return typeof O == "object" && O !== null && O.$$typeof === t;
    }
    function C(O) {
      return _(O) === u;
    }
    function T(O) {
      return _(O) === r;
    }
    function I(O) {
      return _(O) === x;
    }
    function N(O) {
      return _(O) === b;
    }
    function F(O) {
      return _(O) === n;
    }
    function L(O) {
      return _(O) === o;
    }
    function D(O) {
      return _(O) === a;
    }
    function ce(O) {
      return _(O) === p;
    }
    Ce.AsyncMode = h, Ce.ConcurrentMode = G, Ce.ContextConsumer = U, Ce.ContextProvider = te, Ce.Element = X, Ce.ForwardRef = Z, Ce.Fragment = Q, Ce.Lazy = B, Ce.Memo = oe, Ce.Portal = q, Ce.Profiler = J, Ce.StrictMode = Y, Ce.Suspense = M, Ce.isAsyncMode = z, Ce.isConcurrentMode = g, Ce.isContextConsumer = d, Ce.isContextProvider = E, Ce.isElement = A, Ce.isForwardRef = C, Ce.isFragment = T, Ce.isLazy = I, Ce.isMemo = N, Ce.isPortal = F, Ce.isProfiler = L, Ce.isStrictMode = D, Ce.isSuspense = ce, Ce.isValidElementType = S, Ce.typeOf = _;
  }()), Ce;
}
var id;
function zg() {
  return id || (id = 1, process.env.NODE_ENV === "production" ? Ci.exports = TO() : Ci.exports = NO()), Ci.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var _i, sd;
function IO() {
  if (sd) return _i;
  sd = 1;
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
  return _i = a() ? Object.assign : function(o, i) {
    for (var s, l = r(o), c, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var p in s)
        t.call(s, p) && (l[p] = s[p]);
      if (e) {
        c = e(s);
        for (var m = 0; m < c.length; m++)
          n.call(s, c[m]) && (l[c[m]] = s[c[m]]);
      }
    }
    return l;
  }, _i;
}
var Ti, ld;
function Ul() {
  if (ld) return Ti;
  ld = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return Ti = e, Ti;
}
var cd, ud;
function $g() {
  return ud || (ud = 1, cd = Function.call.bind(Object.prototype.hasOwnProperty)), cd;
}
var Ni, fd;
function jO() {
  if (fd) return Ni;
  fd = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ Ul(), n = {}, r = /* @__PURE__ */ $g();
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
      for (var u in o)
        if (r(o, u)) {
          var p;
          try {
            if (typeof o[u] != "function") {
              var m = Error(
                (l || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw m.name = "Invariant Violation", m;
            }
            p = o[u](i, u, l, s, null, t);
          } catch (x) {
            p = x;
          }
          if (p && !(p instanceof Error) && e(
            (l || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof p + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), p instanceof Error && !(p.message in n)) {
            n[p.message] = !0;
            var b = c ? c() : "";
            e(
              "Failed " + s + " type: " + p.message + (b ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, Ni = a, Ni;
}
var Ii, dd;
function MO() {
  if (dd) return Ii;
  dd = 1;
  var e = zg(), t = IO(), n = /* @__PURE__ */ Ul(), r = /* @__PURE__ */ $g(), a = /* @__PURE__ */ jO(), o = function() {
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
  return Ii = function(s, l) {
    var c = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function p(g) {
      var d = g && (c && g[c] || g[u]);
      if (typeof d == "function")
        return d;
    }
    var m = "<<anonymous>>", b = {
      array: w("array"),
      bigint: w("bigint"),
      bool: w("boolean"),
      func: w("function"),
      number: w("number"),
      object: w("object"),
      string: w("string"),
      symbol: w("symbol"),
      any: P(),
      arrayOf: S,
      element: _(),
      elementType: h(),
      instanceOf: G,
      node: Z(),
      objectOf: te,
      oneOf: U,
      oneOfType: X,
      shape: B,
      exact: oe
    };
    function x(g, d) {
      return g === d ? g !== 0 || 1 / g === 1 / d : g !== g && d !== d;
    }
    function v(g, d) {
      this.message = g, this.data = d && typeof d == "object" ? d : {}, this.stack = "";
    }
    v.prototype = Error.prototype;
    function y(g) {
      if (process.env.NODE_ENV !== "production")
        var d = {}, E = 0;
      function A(T, I, N, F, L, D, ce) {
        if (F = F || m, D = D || N, ce !== n) {
          if (l) {
            var O = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw O.name = "Invariant Violation", O;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var Ee = F + ":" + N;
            !d[Ee] && // Avoid spamming the console because they are often not actionable except for lib authors
            E < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + D + "` prop on `" + F + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), d[Ee] = !0, E++);
          }
        }
        return I[N] == null ? T ? I[N] === null ? new v("The " + L + " `" + D + "` is marked as required " + ("in `" + F + "`, but its value is `null`.")) : new v("The " + L + " `" + D + "` is marked as required in " + ("`" + F + "`, but its value is `undefined`.")) : null : g(I, N, F, L, D);
      }
      var C = A.bind(null, !1);
      return C.isRequired = A.bind(null, !0), C;
    }
    function w(g) {
      function d(E, A, C, T, I, N) {
        var F = E[A], L = Y(F);
        if (L !== g) {
          var D = M(F);
          return new v(
            "Invalid " + T + " `" + I + "` of type " + ("`" + D + "` supplied to `" + C + "`, expected ") + ("`" + g + "`."),
            { expectedType: g }
          );
        }
        return null;
      }
      return y(d);
    }
    function P() {
      return y(i);
    }
    function S(g) {
      function d(E, A, C, T, I) {
        if (typeof g != "function")
          return new v("Property `" + I + "` of component `" + C + "` has invalid PropType notation inside arrayOf.");
        var N = E[A];
        if (!Array.isArray(N)) {
          var F = Y(N);
          return new v("Invalid " + T + " `" + I + "` of type " + ("`" + F + "` supplied to `" + C + "`, expected an array."));
        }
        for (var L = 0; L < N.length; L++) {
          var D = g(N, L, C, T, I + "[" + L + "]", n);
          if (D instanceof Error)
            return D;
        }
        return null;
      }
      return y(d);
    }
    function _() {
      function g(d, E, A, C, T) {
        var I = d[E];
        if (!s(I)) {
          var N = Y(I);
          return new v("Invalid " + C + " `" + T + "` of type " + ("`" + N + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return y(g);
    }
    function h() {
      function g(d, E, A, C, T) {
        var I = d[E];
        if (!e.isValidElementType(I)) {
          var N = Y(I);
          return new v("Invalid " + C + " `" + T + "` of type " + ("`" + N + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return y(g);
    }
    function G(g) {
      function d(E, A, C, T, I) {
        if (!(E[A] instanceof g)) {
          var N = g.name || m, F = z(E[A]);
          return new v("Invalid " + T + " `" + I + "` of type " + ("`" + F + "` supplied to `" + C + "`, expected ") + ("instance of `" + N + "`."));
        }
        return null;
      }
      return y(d);
    }
    function U(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), i;
      function d(E, A, C, T, I) {
        for (var N = E[A], F = 0; F < g.length; F++)
          if (x(N, g[F]))
            return null;
        var L = JSON.stringify(g, function(D, ce) {
          var O = M(ce);
          return O === "symbol" ? String(ce) : ce;
        });
        return new v("Invalid " + T + " `" + I + "` of value `" + String(N) + "` " + ("supplied to `" + C + "`, expected one of " + L + "."));
      }
      return y(d);
    }
    function te(g) {
      function d(E, A, C, T, I) {
        if (typeof g != "function")
          return new v("Property `" + I + "` of component `" + C + "` has invalid PropType notation inside objectOf.");
        var N = E[A], F = Y(N);
        if (F !== "object")
          return new v("Invalid " + T + " `" + I + "` of type " + ("`" + F + "` supplied to `" + C + "`, expected an object."));
        for (var L in N)
          if (r(N, L)) {
            var D = g(N, L, C, T, I + "." + L, n);
            if (D instanceof Error)
              return D;
          }
        return null;
      }
      return y(d);
    }
    function X(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var d = 0; d < g.length; d++) {
        var E = g[d];
        if (typeof E != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + K(E) + " at index " + d + "."
          ), i;
      }
      function A(C, T, I, N, F) {
        for (var L = [], D = 0; D < g.length; D++) {
          var ce = g[D], O = ce(C, T, I, N, F, n);
          if (O == null)
            return null;
          O.data && r(O.data, "expectedType") && L.push(O.data.expectedType);
        }
        var Ee = L.length > 0 ? ", expected one of type [" + L.join(", ") + "]" : "";
        return new v("Invalid " + N + " `" + F + "` supplied to " + ("`" + I + "`" + Ee + "."));
      }
      return y(A);
    }
    function Z() {
      function g(d, E, A, C, T) {
        return q(d[E]) ? null : new v("Invalid " + C + " `" + T + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return y(g);
    }
    function Q(g, d, E, A, C) {
      return new v(
        (g || "React class") + ": " + d + " type `" + E + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + C + "`."
      );
    }
    function B(g) {
      function d(E, A, C, T, I) {
        var N = E[A], F = Y(N);
        if (F !== "object")
          return new v("Invalid " + T + " `" + I + "` of type `" + F + "` " + ("supplied to `" + C + "`, expected `object`."));
        for (var L in g) {
          var D = g[L];
          if (typeof D != "function")
            return Q(C, T, I, L, M(D));
          var ce = D(N, L, C, T, I + "." + L, n);
          if (ce)
            return ce;
        }
        return null;
      }
      return y(d);
    }
    function oe(g) {
      function d(E, A, C, T, I) {
        var N = E[A], F = Y(N);
        if (F !== "object")
          return new v("Invalid " + T + " `" + I + "` of type `" + F + "` " + ("supplied to `" + C + "`, expected `object`."));
        var L = t({}, E[A], g);
        for (var D in L) {
          var ce = g[D];
          if (r(g, D) && typeof ce != "function")
            return Q(C, T, I, D, M(ce));
          if (!ce)
            return new v(
              "Invalid " + T + " `" + I + "` key `" + D + "` supplied to `" + C + "`.\nBad object: " + JSON.stringify(E[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(g), null, "  ")
            );
          var O = ce(N, D, C, T, I + "." + D, n);
          if (O)
            return O;
        }
        return null;
      }
      return y(d);
    }
    function q(g) {
      switch (typeof g) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !g;
        case "object":
          if (Array.isArray(g))
            return g.every(q);
          if (g === null || s(g))
            return !0;
          var d = p(g);
          if (d) {
            var E = d.call(g), A;
            if (d !== g.entries) {
              for (; !(A = E.next()).done; )
                if (!q(A.value))
                  return !1;
            } else
              for (; !(A = E.next()).done; ) {
                var C = A.value;
                if (C && !q(C[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function J(g, d) {
      return g === "symbol" ? !0 : d ? d["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && d instanceof Symbol : !1;
    }
    function Y(g) {
      var d = typeof g;
      return Array.isArray(g) ? "array" : g instanceof RegExp ? "object" : J(d, g) ? "symbol" : d;
    }
    function M(g) {
      if (typeof g > "u" || g === null)
        return "" + g;
      var d = Y(g);
      if (d === "object") {
        if (g instanceof Date)
          return "date";
        if (g instanceof RegExp)
          return "regexp";
      }
      return d;
    }
    function K(g) {
      var d = M(g);
      switch (d) {
        case "array":
        case "object":
          return "an " + d;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + d;
        default:
          return d;
      }
    }
    function z(g) {
      return !g.constructor || !g.constructor.name ? m : g.constructor.name;
    }
    return b.checkPropTypes = a, b.resetWarningCache = a.resetWarningCache, b.PropTypes = b, b;
  }, Ii;
}
var ji, pd;
function FO() {
  if (pd) return ji;
  pd = 1;
  var e = /* @__PURE__ */ Ul();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, ji = function() {
    function r(i, s, l, c, u, p) {
      if (p !== e) {
        var m = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw m.name = "Invariant Violation", m;
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
  }, ji;
}
var md;
function RO() {
  if (md) return ka.exports;
  if (md = 1, process.env.NODE_ENV !== "production") {
    var e = zg(), t = !0;
    ka.exports = /* @__PURE__ */ MO()(e.isElement, t);
  } else
    ka.exports = /* @__PURE__ */ FO()();
  return ka.exports;
}
var LO = /* @__PURE__ */ RO();
const be = /* @__PURE__ */ sx(LO);
function gd(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function xt(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? gd(Object(n), !0).forEach(function(r) {
      Un(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : gd(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Ka(e) {
  "@babel/helpers - typeof";
  return Ka = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Ka(e);
}
function Un(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function DO(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), a, o;
  for (o = 0; o < r.length; o++)
    a = r[o], !(t.indexOf(a) >= 0) && (n[a] = e[a]);
  return n;
}
function zO(e, t) {
  if (e == null) return {};
  var n = DO(e, t), r, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      r = o[a], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function qs(e) {
  return $O(e) || HO(e) || WO(e) || BO();
}
function $O(e) {
  if (Array.isArray(e)) return Ks(e);
}
function HO(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function WO(e, t) {
  if (e) {
    if (typeof e == "string") return Ks(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return Ks(e, t);
  }
}
function Ks(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function BO() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function GO(e) {
  var t, n = e.beat, r = e.fade, a = e.beatFade, o = e.bounce, i = e.shake, s = e.flash, l = e.spin, c = e.spinPulse, u = e.spinReverse, p = e.pulse, m = e.fixedWidth, b = e.inverse, x = e.border, v = e.listItem, y = e.flip, w = e.size, P = e.rotation, S = e.pull, _ = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": l,
    "fa-spin-reverse": u,
    "fa-spin-pulse": c,
    "fa-pulse": p,
    "fa-fw": m,
    "fa-inverse": b,
    "fa-border": x,
    "fa-li": v,
    "fa-flip": y === !0,
    "fa-flip-horizontal": y === "horizontal" || y === "both",
    "fa-flip-vertical": y === "vertical" || y === "both"
  }, Un(t, "fa-".concat(w), typeof w < "u" && w !== null), Un(t, "fa-rotate-".concat(P), typeof P < "u" && P !== null && P !== 0), Un(t, "fa-pull-".concat(S), typeof S < "u" && S !== null), Un(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(_).map(function(h) {
    return _[h] ? h : null;
  }).filter(function(h) {
    return h;
  });
}
function YO(e) {
  return e = e - 0, e === e;
}
function Hg(e) {
  return YO(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var VO = ["style"];
function UO(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function qO(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), a = Hg(n.slice(0, r)), o = n.slice(r + 1).trim();
    return a.startsWith("webkit") ? t[UO(a)] = o : t[a] = o, t;
  }, {});
}
function Wg(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(l) {
    return Wg(e, l);
  }), a = Object.keys(t.attributes || {}).reduce(function(l, c) {
    var u = t.attributes[c];
    switch (c) {
      case "class":
        l.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        l.attrs.style = qO(u);
        break;
      default:
        c.indexOf("aria-") === 0 || c.indexOf("data-") === 0 ? l.attrs[c.toLowerCase()] = u : l.attrs[Hg(c)] = u;
    }
    return l;
  }, {
    attrs: {}
  }), o = n.style, i = o === void 0 ? {} : o, s = zO(n, VO);
  return a.attrs.style = xt(xt({}, a.attrs.style), i), e.apply(void 0, [t.tag, xt(xt({}, a.attrs), s)].concat(qs(r)));
}
var Bg = !1;
try {
  Bg = process.env.NODE_ENV === "production";
} catch {
}
function KO() {
  if (!Bg && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function hd(e) {
  if (e && Ka(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Us.icon)
    return Us.icon(e);
  if (e === null)
    return null;
  if (e && Ka(e) === "object" && e.prefix && e.iconName)
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
function Mi(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Un({}, e, t) : {};
}
var yd = {
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
}, Ir = /* @__PURE__ */ ue.forwardRef(function(e, t) {
  var n = xt(xt({}, yd), e), r = n.icon, a = n.mask, o = n.symbol, i = n.className, s = n.title, l = n.titleId, c = n.maskId, u = hd(r), p = Mi("classes", [].concat(qs(GO(n)), qs((i || "").split(" ")))), m = Mi("transform", typeof n.transform == "string" ? Us.transform(n.transform) : n.transform), b = Mi("mask", hd(a)), x = _O(u, xt(xt(xt(xt({}, p), m), b), {}, {
    symbol: o,
    title: s,
    titleId: l,
    maskId: c
  }));
  if (!x)
    return KO("Could not find icon", u), null;
  var v = x.abstract, y = {
    ref: t
  };
  return Object.keys(n).forEach(function(w) {
    yd.hasOwnProperty(w) || (y[w] = n[w]);
  }), XO(v[0], y);
});
Ir.displayName = "FontAwesomeIcon";
Ir.propTypes = {
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
var XO = Wg.bind(null, ue.createElement);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const JO = {
  prefix: "fas",
  iconName: "chevron-up",
  icon: [512, 512, [], "f077", "M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"]
}, ZO = {
  prefix: "fas",
  iconName: "circle-check",
  icon: [512, 512, [61533, "check-circle"], "f058", "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"]
}, QO = {
  prefix: "fas",
  iconName: "check",
  icon: [448, 512, [10003, 10004], "f00c", "M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"]
}, eS = ({
  items: e = [],
  onSelect: t,
  onAdd: n,
  triggerIcon: r,
  showAddButton: a = !1,
  disableAddButton: o = !1,
  showIconsInList: i = !1,
  mode: s = "default",
  triggerLabel: l,
  children: c,
  buttonClassName: u,
  panelClassName: p,
  onPanelAction: m,
  panelTitle: b,
  position: x = "top",
  align: v = "start",
  panelActionLabel: y,
  onOpenChange: w
}) => {
  const P = e.find((J) => J.selected), S = (J, Y) => {
    s === "button" && J.action && m ? (m(J.action), Y()) : (t == null || t(J), Y());
  }, _ = It(
    "text-sm font-medium rounded-lg px-3 py-2 shadow-sm",
    "flex gap-2 items-center justify-center outline-none",
    "transition-all duration-150",
    "bg-ui-controls/60 px-3 text-base-fg hover:bg-ui-controls/90 border border-ui-controls-border",
    "active:scale-95 transform",
    u
  ), h = {
    top: "bottom-full",
    bottom: "top-full"
  }, G = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0"
  }, [U, te] = $e(!1), X = xe(null), Z = xe(null);
  Le(() => () => {
    X.current && clearTimeout(X.current);
  }, []);
  const Q = (J, Y) => {
    s === "hoverSelect" && (te(!0), X.current && (clearTimeout(X.current), X.current = null), J || (X.current = setTimeout(() => {
      Y();
    }, 100)));
  }, B = (J) => {
    s === "hoverSelect" && (te(!1), X.current && clearTimeout(X.current), X.current = setTimeout(() => {
      U || J();
    }, 300));
  }, oe = () => {
    s === "hoverSelect" && (te(!0), X.current && (clearTimeout(X.current), X.current = null));
  }, q = (J) => {
    s === "hoverSelect" && (te(!1), X.current && clearTimeout(X.current), X.current = setTimeout(() => {
      J();
    }, 300));
  };
  return /* @__PURE__ */ se("div", { className: "relative inline-block", children: /* @__PURE__ */ se(Jx, { children: ({ open: J, close: Y }) => /* @__PURE__ */ Ge(yn, { children: [
    (Le(() => {
      w == null || w(J);
    }, [J]), null),
    /* @__PURE__ */ Ge(
      lm,
      {
        className: _,
        onMouseEnter: () => Q(J, () => {
          Z.current && !J && Z.current.click();
        }),
        onMouseLeave: () => B(Y),
        onClick: (M) => {
          s === "hoverSelect" && J && (M.preventDefault(), M.stopPropagation());
        },
        ref: Z,
        children: [
          r,
          s === "toggle" && P ? /* @__PURE__ */ se("span", { className: "truncate", children: P.label }) : null,
          s === "default" && l ? /* @__PURE__ */ se("span", { className: "truncate", children: l }) : null,
          s === "hoverSelect" && P ? /* @__PURE__ */ Ge("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ se("span", { className: "opacity-70", children: l }),
            /* @__PURE__ */ Ge("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ se("span", { className: "truncate", children: P.label }),
              /* @__PURE__ */ se(Ir, { icon: JO, className: "text-sm" })
            ] })
          ] }) : null
        ]
      }
    ),
    /* @__PURE__ */ se(
      Tx,
      {
        show: J,
        enter: "transition duration-100 ease-out",
        enterFrom: x === "bottom" ? "translate-y-2 opacity-0" : "-translate-y-2 opacity-0",
        enterTo: "translate-y-0 opacity-100",
        leave: "transition duration-100 ease-in",
        leaveFrom: "translate-y-0 opacity-100",
        leaveTo: x === "bottom" ? "translate-y-2 opacity-0" : "-translate-y-2 opacity-0",
        children: /* @__PURE__ */ se(
          cm,
          {
            static: !0,
            className: It(
              "absolute transform-gpu z-10",
              h[x],
              G[v],
              x === "bottom" ? "origin-top" : "origin-bottom"
            ),
            children: /* @__PURE__ */ Ge(
              "div",
              {
                className: It(
                  "z-10 min-w-48 mt-2 rounded-lg bg-ui-panel p-1.5 shadow-lg border border-ui-panel-border",
                  x === "top" ? "mb-2" : "mt-2",
                  p
                ),
                onMouseEnter: oe,
                onMouseLeave: () => q(Y),
                children: [
                  b && /* @__PURE__ */ Ge("div", { className: "mb-2 mt-0.5 flex justify-between px-1.5 text-sm font-normal text-base-fg opacity-70", children: [
                    b,
                    y && /* @__PURE__ */ se(
                      "button",
                      {
                        onClick: () => {
                          m == null || m(y), Y();
                        },
                        className: "text-end text-sm text-base-fg/85 hover:underline",
                        children: y
                      }
                    )
                  ] }),
                  s === "default" && c ? /* @__PURE__ */ se("div", { className: "text-sm text-base-fg", children: typeof c == "function" ? c(Y) : c }) : s === "hoverSelect" ? /* @__PURE__ */ Ge("div", { className: "flex flex-col gap-0 text-sm text-base-fg", children: [
                    e.map((M, K) => /* @__PURE__ */ Ge("div", { children: [
                      /* @__PURE__ */ se(
                        "div",
                        {
                          onClick: () => {
                            M.disabled || S(M, Y);
                          },
                          className: It(
                            "group flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 transition-all",
                            M.selected ? "bg-black/40 border-l-4 border-primary" : "hover:bg-black/20",
                            M.disabled ? "!cursor-not-allowed opacity-50" : ""
                          ),
                          style: { minHeight: 48 },
                          children: /* @__PURE__ */ Ge("div", { className: "flex items-center gap-2 w-full", children: [
                            /* @__PURE__ */ Ge("div", { className: "flex items-start gap-2 grow", children: [
                              i && /* @__PURE__ */ se("span", { className: "mt-1 flex h-5 w-5 items-center justify-center text-lg text-base-fg/80", children: M.icon }),
                              /* @__PURE__ */ Ge("div", { className: "flex flex-1 flex-col min-w-0", children: [
                                /* @__PURE__ */ se("div", { className: "flex items-center gap-2 min-w-0", children: /* @__PURE__ */ se("span", { className: "truncate font-semibold text-base-fg text-base", children: M.label }) }),
                                M.description && /* @__PURE__ */ se("div", { className: "truncate text-xs text-base-fg/60 mt-0.5", children: M.description }),
                                /* @__PURE__ */ se("div", { className: "flex flex-row gap-1 flex-wrap mt-1.5", children: M.badges && Array.isArray(M.badges) && M.badges.map((z, g) => /* @__PURE__ */ se(
                                  "div",
                                  {
                                    className: "flex items-center gap-1 min-w-0",
                                    children: /* @__PURE__ */ Ge("span", { className: "inline-flex items-center rounded bg-black/40 px-1.5 py-0.5 text-xs font-medium text-base-fg gap-1", children: [
                                      (z == null ? void 0 : z.icon) && /* @__PURE__ */ se("span", { children: z.icon }),
                                      (z == null ? void 0 : z.label) || ""
                                    ] })
                                  },
                                  g
                                )) })
                              ] })
                            ] }),
                            M.selected && /* @__PURE__ */ se("span", { className: "text-primary text-xl font-bold bg-white rounded-full p-0 h-4 w-4 flex items-center justify-center mr-1", children: /* @__PURE__ */ se(Ir, { icon: ZO }) })
                          ] })
                        }
                      ),
                      M.divider && /* @__PURE__ */ se("div", { className: "my-1 border-t border-white/10" })
                    ] }, K)),
                    a && n && /* @__PURE__ */ se(
                      Ei,
                      {
                        variant: "secondary",
                        className: It(
                          "w-full mb-0.5 mt-2 border-none py-1",
                          o ? "cursor-not-allowed bg-[#7B7B84]/50 opacity-50" : "bg-[#7B7B84] hover:bg-[#8c8c96]"
                        ),
                        onClick: n,
                        disabled: o,
                        children: "+ Add"
                      }
                    )
                  ] }) : /* @__PURE__ */ Ge("div", { className: "flex flex-col gap-0 text-sm text-base-fg", children: [
                    e.map((M, K) => /* @__PURE__ */ Ge("div", { children: [
                      /* @__PURE__ */ Ge(
                        Ei,
                        {
                          className: It(
                            "flex w-full items-center shadow-none justify-between px-1.5",
                            "bg-transparent hover:bg-ui-controls/60",
                            s === "toggle" && M.selected ? "hover:bg-ui-controls/80" : "",
                            M.disabled ? "!cursor-not-allowed opacity-50" : "",
                            "border-0"
                          ),
                          onClick: () => !M.disabled && S(M, Y),
                          variant: "secondary",
                          disabled: M.disabled,
                          children: [
                            /* @__PURE__ */ Ge("div", { className: "flex items-center gap-2 truncate", children: [
                              i && M.icon,
                              s === "toggle" ? /* @__PURE__ */ se(
                                "span",
                                {
                                  className: It(
                                    "truncate",
                                    M.selected ? "text-base-fg" : "text-base-fg/70"
                                  ),
                                  children: M.label
                                }
                              ) : /* @__PURE__ */ se("span", { className: "truncate", children: M.label })
                            ] }),
                            s === "toggle" && /* @__PURE__ */ se(
                              "span",
                              {
                                className: It(
                                  "ml-2 h-5 w-5 rounded-full border flex items-center justify-center transition-colors",
                                  M.selected ? "border-primary bg-primary" : "border-transparent bg-transparent"
                                ),
                                children: M.selected && /* @__PURE__ */ se(
                                  Ir,
                                  {
                                    icon: QO,
                                    className: "text-base-fg text-xs font-bold"
                                  }
                                )
                              }
                            )
                          ]
                        }
                      ),
                      M.divider && /* @__PURE__ */ se("div", { className: "my-1 border-t border-white/10" })
                    ] }, K)),
                    a && n && /* @__PURE__ */ se(
                      Ei,
                      {
                        variant: "secondary",
                        className: It(
                          "w-full mb-0.5 mt-2 py-1 border-0",
                          o ? "cursor-not-allowed opacity-50" : ""
                        ),
                        onClick: n,
                        disabled: o,
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
}, bd = (e) => {
  let t;
  const n = /* @__PURE__ */ new Set(), r = (c, u) => {
    const p = typeof c == "function" ? c(t) : c;
    if (!Object.is(p, t)) {
      const m = t;
      t = u ?? (typeof p != "object" || p === null) ? p : Object.assign({}, t, p), n.forEach((b) => b(t, m));
    }
  }, a = () => t, s = { setState: r, getState: a, getInitialState: () => l, subscribe: (c) => (n.add(c), () => n.delete(c)) }, l = t = e(r, a, s);
  return s;
}, tS = (e) => e ? bd(e) : bd, nS = (e) => e;
function rS(e, t = nS) {
  const n = ue.useSyncExternalStore(
    e.subscribe,
    () => t(e.getState()),
    () => t(e.getInitialState())
  );
  return ue.useDebugValue(n), n;
}
const vd = (e) => {
  const t = tS(e), n = (r) => rS(t, r);
  return Object.assign(n, t), n;
}, aS = (e) => e ? vd(e) : vd, ql = aS((e) => ({
  selectedModels: {},
  setSelectedModel: (t, n) => e((r) => ({
    selectedModels: {
      ...r.selectedModels,
      [t]: n
    }
  }))
})), mS = (e) => {
  const { selectedModels: t } = ql(), n = t[e];
  if (n && n.kind === "image_model")
    return n;
}, gS = (e) => {
  const { selectedModels: t } = ql(), n = t[e];
  if (n && n.kind === "video_model")
    return n;
};
function hS({
  items: e,
  page: t,
  ...n
}) {
  var l;
  const { selectedModels: r, setSelectedModel: a } = ql(), o = r[t] || ((l = e[0]) == null ? void 0 : l.model);
  Le(() => {
    !r[t] && e[0] && a(t, e[0].model);
  }, []);
  const i = (c) => {
    console.log(`Model selector changed on page "${t}": `, c.model), a(t, c.model);
  }, s = ze(
    () => e.map((c) => ({
      ...c,
      selected: c.model === o
    })),
    [e, o]
  );
  return /* @__PURE__ */ se(
    eS,
    {
      items: s,
      onSelect: i,
      mode: "hoverSelect",
      ...n,
      buttonClassName: "border-0 bg-transparent p-0 hover:bg-transparent text-lg hover:opacity-80 shadow-none"
    }
  );
}
export {
  uS as CANVAS_2D_PAGE_MODEL_LIST,
  hS as ClassyModelSelector,
  dS as IMAGE_EDITOR_PAGE_MODEL_LIST,
  pS as IMAGE_TO_VIDEO_PAGE_MODEL_LIST,
  Dv as ModelPage,
  fS as STAGE_3D_PAGE_MODEL_LIST,
  cS as TEXT_TO_IMAGE_PAGE_MODEL_LIST,
  mS as getSelectedImageModel,
  gS as getSelectedVideoModel,
  ql as useClassyModelSelectorStore
};
