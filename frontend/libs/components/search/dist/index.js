import { jsxs as qe, jsx as le, Fragment as Wt } from "react/jsx-runtime";
import * as Or from "react";
import Oe, { createContext as Ko, forwardRef as wd, useRef as Se, useState as Ie, useMemo as Pc, Fragment as It, useContext as yn, useEffect as zt, useLayoutEffect as kd, useCallback as bt, isValidElement as Od, cloneElement as Sd, createElement as Ed } from "react";
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Ad = {
  prefix: "fas",
  iconName: "filter-list",
  icon: [512, 512, [], "e17c", "M40 64C24.2 64 9.9 73.3 3.5 87.7s-3.8 31.3 6.8 43L112 243.8 112 368c0 10.1 4.7 19.6 12.8 25.6l64 48c9.7 7.3 22.7 8.4 33.5 3s17.7-16.5 17.7-28.6l0-172.2 101.7-113c10.6-11.7 13.2-28.6 6.8-43S327.8 64 312 64L40 64zM352 384c-17.7 0-32 14.3-32 32s14.3 32 32 32l128 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-128 0zM320 256c0 17.7 14.3 32 32 32l128 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-128 0c-17.7 0-32 14.3-32 32zM416 64c-17.7 0-32 14.3-32 32s14.3 32 32 32l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0z"]
}, Pd = {
  prefix: "fas",
  iconName: "magnifying-glass",
  icon: [512, 512, [128269, "search"], "f002", "M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"]
}, $d = Pd, Cd = {
  prefix: "fas",
  iconName: "circle-xmark",
  icon: [512, 512, [61532, "times-circle", "xmark-circle"], "f057", "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"]
}, Jo = "-", Nd = (e) => {
  const t = Td(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (a) => {
      const o = a.split(Jo);
      return o[0] === "" && o.length !== 1 && o.shift(), $c(o, t) || jd(a);
    },
    getConflictingClassGroupIds: (a, o) => {
      const i = r[a] || [];
      return o && n[a] ? [...i, ...n[a]] : i;
    }
  };
}, $c = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], a = t.nextPart.get(n), o = a ? $c(e.slice(1), a) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const i = e.join(Jo);
  return (r = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : r.classGroupId;
}, Wi = /^\[(.+)\]$/, jd = (e) => {
  if (Wi.test(e)) {
    const t = Wi.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, Td = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return zd(Object.entries(e.classGroups), r).forEach(([a, o]) => {
    Ya(o, n, a, t);
  }), n;
}, Ya = (e, t, r, n) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : Yi(t, a);
      o.classGroupId = r;
      return;
    }
    if (typeof a == "function") {
      if (Id(a)) {
        Ya(a(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: r
      });
      return;
    }
    Object.entries(a).forEach(([o, i]) => {
      Ya(i, Yi(t, o), r, n);
    });
  });
}, Yi = (e, t) => {
  let r = e;
  return t.split(Jo).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, Id = (e) => e.isThemeGetter, zd = (e, t) => t ? e.map(([r, n]) => {
  const a = n.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([i, s]) => [t + i, s])) : o);
  return [r, a];
}) : e, Md = (e) => {
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
}, Cc = "!", Rd = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, a = t[0], o = t.length, i = (s) => {
    const c = [];
    let l = 0, f = 0, u;
    for (let g = 0; g < s.length; g++) {
      let x = s[g];
      if (l === 0) {
        if (x === a && (n || s.slice(g, g + o) === t)) {
          c.push(s.slice(f, g)), f = g + o;
          continue;
        }
        if (x === "/") {
          u = g;
          continue;
        }
      }
      x === "[" ? l++ : x === "]" && l--;
    }
    const m = c.length === 0 ? s : s.substring(f), v = m.startsWith(Cc), w = v ? m.substring(1) : m, h = u && u > f ? u - f : void 0;
    return {
      modifiers: c,
      hasImportantModifier: v,
      baseClassName: w,
      maybePostfixModifierPosition: h
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, _d = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, Fd = (e) => ({
  cache: Md(e.cacheSize),
  parseClassName: Rd(e),
  ...Nd(e)
}), Ld = /\s+/, Dd = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: a
  } = t, o = [], i = e.trim().split(Ld);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: f,
      hasImportantModifier: u,
      baseClassName: m,
      maybePostfixModifierPosition: v
    } = r(l);
    let w = !!v, h = n(w ? m.substring(0, v) : m);
    if (!h) {
      if (!w) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (h = n(m), !h) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      w = !1;
    }
    const g = _d(f).join(":"), x = u ? g + Cc : g, k = x + h;
    if (o.includes(k))
      continue;
    o.push(k);
    const S = a(h, w);
    for (let O = 0; O < S.length; ++O) {
      const p = S[O];
      o.push(x + p);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function Wd() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = Nc(t)) && (n && (n += " "), n += r);
  return n;
}
const Nc = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = Nc(e[n])) && (r && (r += " "), r += t);
  return r;
};
function Yd(e, ...t) {
  let r, n, a, o = i;
  function i(c) {
    const l = t.reduce((f, u) => u(f), e());
    return r = Fd(l), n = r.cache.get, a = r.cache.set, o = s, s(c);
  }
  function s(c) {
    const l = n(c);
    if (l)
      return l;
    const f = Dd(c, r);
    return a(c, f), f;
  }
  return function() {
    return o(Wd.apply(null, arguments));
  };
}
const be = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, jc = /^\[(?:([a-z-]+):)?(.+)\]$/i, qd = /^\d+\/\d+$/, Gd = /* @__PURE__ */ new Set(["px", "full", "screen"]), Ud = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Vd = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Hd = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Bd = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Xd = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Ge = (e) => Xt(e) || Gd.has(e) || qd.test(e), ot = (e) => or(e, "length", np), Xt = (e) => !!e && !Number.isNaN(Number(e)), Ln = (e) => or(e, "number", Xt), dr = (e) => !!e && Number.isInteger(Number(e)), Kd = (e) => e.endsWith("%") && Xt(e.slice(0, -1)), H = (e) => jc.test(e), it = (e) => Ud.test(e), Jd = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Zd = (e) => or(e, Jd, Tc), Qd = (e) => or(e, "position", Tc), ep = /* @__PURE__ */ new Set(["image", "url"]), tp = (e) => or(e, ep, op), rp = (e) => or(e, "", ap), pr = () => !0, or = (e, t, r) => {
  const n = jc.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, np = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  Vd.test(e) && !Hd.test(e)
), Tc = () => !1, ap = (e) => Bd.test(e), op = (e) => Xd.test(e), ip = () => {
  const e = be("colors"), t = be("spacing"), r = be("blur"), n = be("brightness"), a = be("borderColor"), o = be("borderRadius"), i = be("borderSpacing"), s = be("borderWidth"), c = be("contrast"), l = be("grayscale"), f = be("hueRotate"), u = be("invert"), m = be("gap"), v = be("gradientColorStops"), w = be("gradientColorStopPositions"), h = be("inset"), g = be("margin"), x = be("opacity"), k = be("padding"), S = be("saturate"), O = be("scale"), p = be("sepia"), Y = be("skew"), V = be("space"), oe = be("translate"), ie = () => ["auto", "contain", "none"], J = () => ["auto", "hidden", "clip", "visible", "scroll"], ne = () => ["auto", H, t], P = () => [H, t], U = () => ["", Ge, ot], q = () => ["auto", Xt, H], se = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], W = () => ["solid", "dashed", "dotted", "double", "none"], Q = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], ae = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], Z = () => ["", "0", H], d = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], b = () => [Xt, H];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [pr],
      spacing: [Ge, ot],
      blur: ["none", "", it, H],
      brightness: b(),
      borderColor: [e],
      borderRadius: ["none", "", "full", it, H],
      borderSpacing: P(),
      borderWidth: U(),
      contrast: b(),
      grayscale: Z(),
      hueRotate: b(),
      invert: Z(),
      gap: P(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Kd, ot],
      inset: ne(),
      margin: ne(),
      opacity: b(),
      padding: P(),
      saturate: b(),
      scale: b(),
      sepia: Z(),
      skew: b(),
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
        aspect: ["auto", "square", "video", H]
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
        columns: [it]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": d()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": d()
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
        object: [...se(), H]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: J()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": J()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": J()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: ie()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": ie()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": ie()
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
        inset: [h]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [h]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [h]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [h]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [h]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [h]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [h]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [h]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [h]
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
        z: ["auto", dr, H]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ne()
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
        flex: ["1", "auto", "initial", "none", H]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: Z()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: Z()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", dr, H]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [pr]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", dr, H]
        }, H]
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
        "grid-rows": [pr]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [dr, H]
        }, H]
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
        "auto-cols": ["auto", "min", "max", "fr", H]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", H]
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
        justify: ["normal", ...ae()]
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
        content: ["normal", ...ae(), "baseline"]
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
        "place-content": [...ae(), "baseline"]
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
        p: [k]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [k]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [k]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [k]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [k]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [k]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [k]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [k]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [k]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [g]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [g]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [g]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [g]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [g]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [g]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [g]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [g]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [g]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [V]
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
        "space-y": [V]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", H, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [H, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [H, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [it]
        }, it]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [H, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [H, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [H, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [H, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", it, ot]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Ln]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [pr]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", H]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Xt, Ln]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Ge, H]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", H]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", H]
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
        decoration: [...W(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", Ge, ot]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Ge, H]
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
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", H]
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
        content: ["none", H]
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
        bg: [...se(), Qd]
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
        bg: ["auto", "cover", "contain", Zd]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, tp]
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
        from: [w]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [w]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [w]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [v]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [v]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [v]
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
        "border-opacity": [x]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...W(), "hidden"]
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
        divide: W()
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
        outline: ["", ...W()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Ge, H]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Ge, ot]
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
        ring: U()
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
        "ring-offset": [Ge, ot]
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
        shadow: ["", "inner", "none", it, rp]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [pr]
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
        "mix-blend": [...Q(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": Q()
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
        "drop-shadow": ["", "none", it, H]
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
        "hue-rotate": [f]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [u]
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
        "backdrop-grayscale": [l]
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
        "backdrop-invert": [u]
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
        "backdrop-saturate": [S]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", H]
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
        ease: ["linear", "in", "out", "in-out", H]
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
        animate: ["none", "spin", "ping", "pulse", "bounce", H]
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
        rotate: [dr, H]
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
        "skew-x": [Y]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [Y]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", H]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", H]
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
        "will-change": ["auto", "scroll", "contents", "transform", H]
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
        stroke: [Ge, ot, Ln]
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
}, Dn = /* @__PURE__ */ Yd(ip);
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function sp(e, t, r) {
  return (t = cp(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function qi(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function M(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? qi(Object(r), !0).forEach(function(n) {
      sp(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : qi(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function lp(e, t) {
  if (typeof e != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(e, t);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function cp(e) {
  var t = lp(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Gi = () => {
};
let Zo = {}, Ic = {}, zc = null, Mc = {
  mark: Gi,
  measure: Gi
};
try {
  typeof window < "u" && (Zo = window), typeof document < "u" && (Ic = document), typeof MutationObserver < "u" && (zc = MutationObserver), typeof performance < "u" && (Mc = performance);
} catch {
}
const {
  userAgent: Ui = ""
} = Zo.navigator || {}, vt = Zo, xe = Ic, Vi = zc, Yr = Mc;
vt.document;
const tt = !!xe.documentElement && !!xe.head && typeof xe.addEventListener == "function" && typeof xe.createElement == "function", Rc = ~Ui.indexOf("MSIE") || ~Ui.indexOf("Trident/");
var fp = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, up = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, _c = {
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
}, dp = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Fc = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Ee = "classic", vn = "duotone", pp = "sharp", mp = "sharp-duotone", Lc = [Ee, vn, pp, mp], gp = {
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
}, bp = {
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
}, hp = /* @__PURE__ */ new Map([["classic", {
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
}]]), yp = {
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
}, vp = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Hi = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, xp = ["kit"], wp = {
  kit: {
    "fa-kit": "fak"
  }
}, kp = ["fak", "fakd"], Op = {
  kit: {
    fak: "fa-kit"
  }
}, Bi = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, qr = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Sp = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Ep = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Ap = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, Pp = {
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
}, $p = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, qa = {
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
}, Cp = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], Ga = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...Sp, ...Cp], Np = ["solid", "regular", "light", "thin", "duotone", "brands"], Dc = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], jp = Dc.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), Tp = [...Object.keys($p), ...Np, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", qr.GROUP, qr.SWAP_OPACITY, qr.PRIMARY, qr.SECONDARY].concat(Dc.map((e) => "".concat(e, "x"))).concat(jp.map((e) => "w-".concat(e))), Ip = {
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
const Xe = "___FONT_AWESOME___", Ua = 16, Wc = "fa", Yc = "svg-inline--fa", Mt = "data-fa-i2svg", Va = "data-fa-pseudo-element", zp = "data-fa-pseudo-element-pending", Qo = "data-prefix", ei = "data-icon", Xi = "fontawesome-i2svg", Mp = "async", Rp = ["HTML", "HEAD", "STYLE", "SCRIPT"], qc = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Rr(e) {
  return new Proxy(e, {
    get(t, r) {
      return r in t ? t[r] : t[Ee];
    }
  });
}
const Gc = M({}, _c);
Gc[Ee] = M(M(M(M({}, {
  "fa-duotone": "duotone"
}), _c[Ee]), Hi.kit), Hi["kit-duotone"]);
const _p = Rr(Gc), Ha = M({}, yp);
Ha[Ee] = M(M(M(M({}, {
  duotone: "fad"
}), Ha[Ee]), Bi.kit), Bi["kit-duotone"]);
const Ki = Rr(Ha), Ba = M({}, qa);
Ba[Ee] = M(M({}, Ba[Ee]), Op.kit);
const ti = Rr(Ba), Xa = M({}, Pp);
Xa[Ee] = M(M({}, Xa[Ee]), wp.kit);
Rr(Xa);
const Fp = fp, Uc = "fa-layers-text", Lp = up, Dp = M({}, gp);
Rr(Dp);
const Wp = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Wn = dp, Yp = [...xp, ...Tp], Sr = vt.FontAwesomeConfig || {};
function qp(e) {
  var t = xe.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function Gp(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
xe && typeof xe.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, r] = e;
  const n = Gp(qp(t));
  n != null && (Sr[r] = n);
});
const Vc = {
  styleDefault: "solid",
  familyDefault: Ee,
  cssPrefix: Wc,
  replacementClass: Yc,
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
Sr.familyPrefix && (Sr.cssPrefix = Sr.familyPrefix);
const rr = M(M({}, Vc), Sr);
rr.autoReplaceSvg || (rr.observeMutations = !1);
const F = {};
Object.keys(Vc).forEach((e) => {
  Object.defineProperty(F, e, {
    enumerable: !0,
    set: function(t) {
      rr[e] = t, Er.forEach((r) => r(F));
    },
    get: function() {
      return rr[e];
    }
  });
});
Object.defineProperty(F, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    rr.cssPrefix = e, Er.forEach((t) => t(F));
  },
  get: function() {
    return rr.cssPrefix;
  }
});
vt.FontAwesomeConfig = F;
const Er = [];
function Up(e) {
  return Er.push(e), () => {
    Er.splice(Er.indexOf(e), 1);
  };
}
const st = Ua, _e = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function Vp(e) {
  if (!e || !tt)
    return;
  const t = xe.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const r = xe.head.childNodes;
  let n = null;
  for (let a = r.length - 1; a > -1; a--) {
    const o = r[a], i = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (n = o);
  }
  return xe.head.insertBefore(t, n), e;
}
const Hp = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Nr() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += Hp[Math.random() * 62 | 0];
  return t;
}
function ir(e) {
  const t = [];
  for (let r = (e || []).length >>> 0; r--; )
    t[r] = e[r];
  return t;
}
function ri(e) {
  return e.classList ? ir(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function Hc(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Bp(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, '="').concat(Hc(e[r]), '" '), "").trim();
}
function xn(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, ": ").concat(e[r].trim(), ";"), "");
}
function ni(e) {
  return e.size !== _e.size || e.x !== _e.x || e.y !== _e.y || e.rotate !== _e.rotate || e.flipX || e.flipY;
}
function Xp(e) {
  let {
    transform: t,
    containerWidth: r,
    iconWidth: n
  } = e;
  const a = {
    transform: "translate(".concat(r / 2, " 256)")
  }, o = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), c = {
    transform: "".concat(o, " ").concat(i, " ").concat(s)
  }, l = {
    transform: "translate(".concat(n / 2 * -1, " -256)")
  };
  return {
    outer: a,
    inner: c,
    path: l
  };
}
function Kp(e) {
  let {
    transform: t,
    width: r = Ua,
    height: n = Ua,
    startCentered: a = !1
  } = e, o = "";
  return a && Rc ? o += "translate(".concat(t.x / st - r / 2, "em, ").concat(t.y / st - n / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / st, "em), calc(-50% + ").concat(t.y / st, "em)) ") : o += "translate(".concat(t.x / st, "em, ").concat(t.y / st, "em) "), o += "scale(".concat(t.size / st * (t.flipX ? -1 : 1), ", ").concat(t.size / st * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var Jp = `:root, :host {
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
function Bc() {
  const e = Wc, t = Yc, r = F.cssPrefix, n = F.replacementClass;
  let a = Jp;
  if (r !== e || n !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(r, "-")).replace(i, "--".concat(r, "-")).replace(s, ".".concat(n));
  }
  return a;
}
let Ji = !1;
function Yn() {
  F.autoAddCss && !Ji && (Vp(Bc()), Ji = !0);
}
var Zp = {
  mixout() {
    return {
      dom: {
        css: Bc,
        insertCss: Yn
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Yn();
      },
      beforeI2svg() {
        Yn();
      }
    };
  }
};
const Ke = vt || {};
Ke[Xe] || (Ke[Xe] = {});
Ke[Xe].styles || (Ke[Xe].styles = {});
Ke[Xe].hooks || (Ke[Xe].hooks = {});
Ke[Xe].shims || (Ke[Xe].shims = []);
var Fe = Ke[Xe];
const Xc = [], Kc = function() {
  xe.removeEventListener("DOMContentLoaded", Kc), cn = 1, Xc.map((e) => e());
};
let cn = !1;
tt && (cn = (xe.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(xe.readyState), cn || xe.addEventListener("DOMContentLoaded", Kc));
function Qp(e) {
  tt && (cn ? setTimeout(e, 0) : Xc.push(e));
}
function _r(e) {
  const {
    tag: t,
    attributes: r = {},
    children: n = []
  } = e;
  return typeof e == "string" ? Hc(e) : "<".concat(t, " ").concat(Bp(r), ">").concat(n.map(_r).join(""), "</").concat(t, ">");
}
function Zi(e, t, r) {
  if (e && e[t] && e[t][r])
    return {
      prefix: t,
      iconName: r,
      icon: e[t][r]
    };
}
var qn = function(e, t, r, n) {
  var a = Object.keys(e), o = a.length, i = t, s, c, l;
  for (r === void 0 ? (s = 1, l = e[a[0]]) : (s = 0, l = r); s < o; s++)
    c = a[s], l = i(l, e[c], c, e);
  return l;
};
function em(e) {
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
function Jc(e) {
  const t = em(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function tm(e, t) {
  const r = e.length;
  let n = e.charCodeAt(t), a;
  return n >= 55296 && n <= 56319 && r > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (n - 55296) * 1024 + a - 56320 + 65536 : n;
}
function Qi(e) {
  return Object.keys(e).reduce((t, r) => {
    const n = e[r];
    return n.icon ? t[n.iconName] = n.icon : t[r] = n, t;
  }, {});
}
function Ka(e, t) {
  let r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: n = !1
  } = r, a = Qi(t);
  typeof Fe.hooks.addPack == "function" && !n ? Fe.hooks.addPack(e, Qi(t)) : Fe.styles[e] = M(M({}, Fe.styles[e] || {}), a), e === "fas" && Ka("fa", t);
}
const {
  styles: jr,
  shims: rm
} = Fe, Zc = Object.keys(ti), nm = Zc.reduce((e, t) => (e[t] = Object.keys(ti[t]), e), {});
let ai = null, Qc = {}, ef = {}, tf = {}, rf = {}, nf = {};
function am(e) {
  return ~Yp.indexOf(e);
}
function om(e, t) {
  const r = t.split("-"), n = r[0], a = r.slice(1).join("-");
  return n === e && a !== "" && !am(a) ? a : null;
}
const af = () => {
  const e = (n) => qn(jr, (a, o, i) => (a[i] = qn(o, n, {}), a), {});
  Qc = e((n, a, o) => (a[3] && (n[a[3]] = o), a[2] && a[2].filter((i) => typeof i == "number").forEach((i) => {
    n[i.toString(16)] = o;
  }), n)), ef = e((n, a, o) => (n[o] = o, a[2] && a[2].filter((i) => typeof i == "string").forEach((i) => {
    n[i] = o;
  }), n)), nf = e((n, a, o) => {
    const i = a[2];
    return n[o] = o, i.forEach((s) => {
      n[s] = o;
    }), n;
  });
  const t = "far" in jr || F.autoFetchSvg, r = qn(rm, (n, a) => {
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
  tf = r.names, rf = r.unicodes, ai = wn(F.styleDefault, {
    family: F.familyDefault
  });
};
Up((e) => {
  ai = wn(e.styleDefault, {
    family: F.familyDefault
  });
});
af();
function oi(e, t) {
  return (Qc[e] || {})[t];
}
function im(e, t) {
  return (ef[e] || {})[t];
}
function Ct(e, t) {
  return (nf[e] || {})[t];
}
function of(e) {
  return tf[e] || {
    prefix: null,
    iconName: null
  };
}
function sm(e) {
  const t = rf[e], r = oi("fas", e);
  return t || (r ? {
    prefix: "fas",
    iconName: r
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function xt() {
  return ai;
}
const sf = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function lm(e) {
  let t = Ee;
  const r = Zc.reduce((n, a) => (n[a] = "".concat(F.cssPrefix, "-").concat(a), n), {});
  return Lc.forEach((n) => {
    (e.includes(r[n]) || e.some((a) => nm[n].includes(a))) && (t = n);
  }), t;
}
function wn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: r = Ee
  } = t, n = _p[r][e];
  if (r === vn && !e)
    return "fad";
  const a = Ki[r][e] || Ki[r][n], o = e in Fe.styles ? e : null;
  return a || o || null;
}
function cm(e) {
  let t = [], r = null;
  return e.forEach((n) => {
    const a = om(F.cssPrefix, n);
    a ? r = a : n && t.push(n);
  }), {
    iconName: r,
    rest: t
  };
}
function es(e) {
  return e.sort().filter((t, r, n) => n.indexOf(t) === r);
}
function kn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: r = !1
  } = t;
  let n = null;
  const a = Ga.concat(Ep), o = es(e.filter((u) => a.includes(u))), i = es(e.filter((u) => !Ga.includes(u))), s = o.filter((u) => (n = u, !Fc.includes(u))), [c = null] = s, l = lm(o), f = M(M({}, cm(i)), {}, {
    prefix: wn(c, {
      family: l
    })
  });
  return M(M(M({}, f), pm({
    values: e,
    family: l,
    styles: jr,
    config: F,
    canonical: f,
    givenPrefix: n
  })), fm(r, n, f));
}
function fm(e, t, r) {
  let {
    prefix: n,
    iconName: a
  } = r;
  if (e || !n || !a)
    return {
      prefix: n,
      iconName: a
    };
  const o = t === "fa" ? of(a) : {}, i = Ct(n, a);
  return a = o.iconName || i || a, n = o.prefix || n, n === "far" && !jr.far && jr.fas && !F.autoFetchSvg && (n = "fas"), {
    prefix: n,
    iconName: a
  };
}
const um = Lc.filter((e) => e !== Ee || e !== vn), dm = Object.keys(qa).filter((e) => e !== Ee).map((e) => Object.keys(qa[e])).flat();
function pm(e) {
  const {
    values: t,
    family: r,
    canonical: n,
    givenPrefix: a = "",
    styles: o = {},
    config: i = {}
  } = e, s = r === vn, c = t.includes("fa-duotone") || t.includes("fad"), l = i.familyDefault === "duotone", f = n.prefix === "fad" || n.prefix === "fa-duotone";
  if (!s && (c || l || f) && (n.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (n.prefix = "fab"), !n.prefix && um.includes(r) && (Object.keys(o).find((u) => dm.includes(u)) || i.autoFetchSvg)) {
    const u = hp.get(r).defaultShortPrefixId;
    n.prefix = u, n.iconName = Ct(n.prefix, n.iconName) || n.iconName;
  }
  return (n.prefix === "fa" || a === "fa") && (n.prefix = xt() || "fas"), n;
}
let mm = class {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
      r[n] = arguments[n];
    const a = r.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = M(M({}, this.definitions[o] || {}), a[o]), Ka(o, a[o]);
      const i = ti[Ee][o];
      i && Ka(i, a[o]), af();
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
      t[o] || (t[o] = {}), c.length > 0 && c.forEach((l) => {
        typeof l == "string" && (t[o][l] = s);
      }), t[o][i] = s;
    }), t;
  }
}, ts = [], qt = {};
const Kt = {}, gm = Object.keys(Kt);
function bm(e, t) {
  let {
    mixoutsTo: r
  } = t;
  return ts = e, qt = {}, Object.keys(Kt).forEach((n) => {
    gm.indexOf(n) === -1 && delete Kt[n];
  }), ts.forEach((n) => {
    const a = n.mixout ? n.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (r[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((i) => {
        r[o] || (r[o] = {}), r[o][i] = a[o][i];
      });
    }), n.hooks) {
      const o = n.hooks();
      Object.keys(o).forEach((i) => {
        qt[i] || (qt[i] = []), qt[i].push(o[i]);
      });
    }
    n.provides && n.provides(Kt);
  }), r;
}
function Ja(e, t) {
  for (var r = arguments.length, n = new Array(r > 2 ? r - 2 : 0), a = 2; a < r; a++)
    n[a - 2] = arguments[a];
  return (qt[e] || []).forEach((o) => {
    t = o.apply(null, [t, ...n]);
  }), t;
}
function Rt(e) {
  for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++)
    r[n - 1] = arguments[n];
  (qt[e] || []).forEach((a) => {
    a.apply(null, r);
  });
}
function wt() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Kt[e] ? Kt[e].apply(null, t) : void 0;
}
function Za(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const r = e.prefix || xt();
  if (t)
    return t = Ct(r, t) || t, Zi(lf.definitions, r, t) || Zi(Fe.styles, r, t);
}
const lf = new mm(), hm = () => {
  F.autoReplaceSvg = !1, F.observeMutations = !1, Rt("noAuto");
}, ym = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return tt ? (Rt("beforeI2svg", e), wt("pseudoElements2svg", e), wt("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    F.autoReplaceSvg === !1 && (F.autoReplaceSvg = !0), F.observeMutations = !0, Qp(() => {
      xm({
        autoReplaceSvgRoot: t
      }), Rt("watch", e);
    });
  }
}, vm = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Ct(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], r = wn(e[0]);
      return {
        prefix: r,
        iconName: Ct(r, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(F.cssPrefix, "-")) > -1 || e.match(Fp))) {
      const t = kn(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || xt(),
        iconName: Ct(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = xt();
      return {
        prefix: t,
        iconName: Ct(t, e) || e
      };
    }
  }
}, Ne = {
  noAuto: hm,
  config: F,
  dom: ym,
  parse: vm,
  library: lf,
  findIconDefinition: Za,
  toHtml: _r
}, xm = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = xe
  } = e;
  (Object.keys(Fe.styles).length > 0 || F.autoFetchSvg) && tt && F.autoReplaceSvg && Ne.dom.i2svg({
    node: t
  });
};
function On(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((r) => _r(r));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!tt) return;
      const r = xe.createElement("div");
      return r.innerHTML = e.html, r.children;
    }
  }), e;
}
function wm(e) {
  let {
    children: t,
    main: r,
    mask: n,
    attributes: a,
    styles: o,
    transform: i
  } = e;
  if (ni(i) && r.found && !n.found) {
    const {
      width: s,
      height: c
    } = r, l = {
      x: s / c / 2,
      y: 0.5
    };
    a.style = xn(M(M({}, o), {}, {
      "transform-origin": "".concat(l.x + i.x / 16, "em ").concat(l.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function km(e) {
  let {
    prefix: t,
    iconName: r,
    children: n,
    attributes: a,
    symbol: o
  } = e;
  const i = o === !0 ? "".concat(t, "-").concat(F.cssPrefix, "-").concat(r) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: M(M({}, a), {}, {
        id: i
      }),
      children: n
    }]
  }];
}
function ii(e) {
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
    titleId: l,
    extra: f,
    watchable: u = !1
  } = e, {
    width: m,
    height: v
  } = r.found ? r : t, w = kp.includes(n), h = [F.replacementClass, a ? "".concat(F.cssPrefix, "-").concat(a) : ""].filter((p) => f.classes.indexOf(p) === -1).filter((p) => p !== "" || !!p).concat(f.classes).join(" ");
  let g = {
    children: [],
    attributes: M(M({}, f.attributes), {}, {
      "data-prefix": n,
      "data-icon": a,
      class: h,
      role: f.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(m, " ").concat(v)
    })
  };
  const x = w && !~f.classes.indexOf("fa-fw") ? {
    width: "".concat(m / v * 16 * 0.0625, "em")
  } : {};
  u && (g.attributes[Mt] = ""), s && (g.children.push({
    tag: "title",
    attributes: {
      id: g.attributes["aria-labelledby"] || "title-".concat(l || Nr())
    },
    children: [s]
  }), delete g.attributes.title);
  const k = M(M({}, g), {}, {
    prefix: n,
    iconName: a,
    main: t,
    mask: r,
    maskId: c,
    transform: o,
    symbol: i,
    styles: M(M({}, x), f.styles)
  }), {
    children: S,
    attributes: O
  } = r.found && t.found ? wt("generateAbstractMask", k) || {
    children: [],
    attributes: {}
  } : wt("generateAbstractIcon", k) || {
    children: [],
    attributes: {}
  };
  return k.children = S, k.attributes = O, i ? km(k) : wm(k);
}
function rs(e) {
  const {
    content: t,
    width: r,
    height: n,
    transform: a,
    title: o,
    extra: i,
    watchable: s = !1
  } = e, c = M(M(M({}, i.attributes), o ? {
    title: o
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[Mt] = "");
  const l = M({}, i.styles);
  ni(a) && (l.transform = Kp({
    transform: a,
    startCentered: !0,
    width: r,
    height: n
  }), l["-webkit-transform"] = l.transform);
  const f = xn(l);
  f.length > 0 && (c.style = f);
  const u = [];
  return u.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), o && u.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), u;
}
function Om(e) {
  const {
    content: t,
    title: r,
    extra: n
  } = e, a = M(M(M({}, n.attributes), r ? {
    title: r
  } : {}), {}, {
    class: n.classes.join(" ")
  }), o = xn(n.styles);
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
  styles: Gn
} = Fe;
function Qa(e) {
  const t = e[0], r = e[1], [n] = e.slice(4);
  let a = null;
  return Array.isArray(n) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(F.cssPrefix, "-").concat(Wn.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(F.cssPrefix, "-").concat(Wn.SECONDARY),
        fill: "currentColor",
        d: n[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(F.cssPrefix, "-").concat(Wn.PRIMARY),
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
const Sm = {
  found: !1,
  width: 512,
  height: 512
};
function Em(e, t) {
  !qc && !F.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function eo(e, t) {
  let r = t;
  return t === "fa" && F.styleDefault !== null && (t = xt()), new Promise((n, a) => {
    if (r === "fa") {
      const o = of(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && Gn[t] && Gn[t][e]) {
      const o = Gn[t][e];
      return n(Qa(o));
    }
    Em(e, t), n(M(M({}, Sm), {}, {
      icon: F.showMissingIcons && e ? wt("missingIconAbstract") || {} : {}
    }));
  });
}
const ns = () => {
}, to = F.measurePerformance && Yr && Yr.mark && Yr.measure ? Yr : {
  mark: ns,
  measure: ns
}, xr = 'FA "6.7.2"', Am = (e) => (to.mark("".concat(xr, " ").concat(e, " begins")), () => cf(e)), cf = (e) => {
  to.mark("".concat(xr, " ").concat(e, " ends")), to.measure("".concat(xr, " ").concat(e), "".concat(xr, " ").concat(e, " begins"), "".concat(xr, " ").concat(e, " ends"));
};
var si = {
  begin: Am,
  end: cf
};
const en = () => {
};
function as(e) {
  return typeof (e.getAttribute ? e.getAttribute(Mt) : null) == "string";
}
function Pm(e) {
  const t = e.getAttribute ? e.getAttribute(Qo) : null, r = e.getAttribute ? e.getAttribute(ei) : null;
  return t && r;
}
function $m(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(F.replacementClass);
}
function Cm() {
  return F.autoReplaceSvg === !0 ? tn.replace : tn[F.autoReplaceSvg] || tn.replace;
}
function Nm(e) {
  return xe.createElementNS("http://www.w3.org/2000/svg", e);
}
function jm(e) {
  return xe.createElement(e);
}
function ff(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: r = e.tag === "svg" ? Nm : jm
  } = t;
  if (typeof e == "string")
    return xe.createTextNode(e);
  const n = r(e.tag);
  return Object.keys(e.attributes || []).forEach(function(a) {
    n.setAttribute(a, e.attributes[a]);
  }), (e.children || []).forEach(function(a) {
    n.appendChild(ff(a, {
      ceFn: r
    }));
  }), n;
}
function Tm(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const tn = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((r) => {
        t.parentNode.insertBefore(ff(r), t);
      }), t.getAttribute(Mt) === null && F.keepOriginalSource) {
        let r = xe.createComment(Tm(t));
        t.parentNode.replaceChild(r, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], r = e[1];
    if (~ri(t).indexOf(F.replacementClass))
      return tn.replace(e);
    const n = new RegExp("".concat(F.cssPrefix, "-.*"));
    if (delete r[0].attributes.id, r[0].attributes.class) {
      const o = r[0].attributes.class.split(" ").reduce((i, s) => (s === F.replacementClass || s.match(n) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      r[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = r.map((o) => _r(o)).join(`
`);
    t.setAttribute(Mt, ""), t.innerHTML = a;
  }
};
function os(e) {
  e();
}
function uf(e, t) {
  const r = typeof t == "function" ? t : en;
  if (e.length === 0)
    r();
  else {
    let n = os;
    F.mutateApproach === Mp && (n = vt.requestAnimationFrame || os), n(() => {
      const a = Cm(), o = si.begin("mutate");
      e.map(a), o(), r();
    });
  }
}
let li = !1;
function df() {
  li = !0;
}
function ro() {
  li = !1;
}
let fn = null;
function is(e) {
  if (!Vi || !F.observeMutations)
    return;
  const {
    treeCallback: t = en,
    nodeCallback: r = en,
    pseudoElementsCallback: n = en,
    observeMutationsRoot: a = xe
  } = e;
  fn = new Vi((o) => {
    if (li) return;
    const i = xt();
    ir(o).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !as(s.addedNodes[0]) && (F.searchPseudoElements && n(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && F.searchPseudoElements && n(s.target.parentNode), s.type === "attributes" && as(s.target) && ~Wp.indexOf(s.attributeName))
        if (s.attributeName === "class" && Pm(s.target)) {
          const {
            prefix: c,
            iconName: l
          } = kn(ri(s.target));
          s.target.setAttribute(Qo, c || i), l && s.target.setAttribute(ei, l);
        } else $m(s.target) && r(s.target);
    });
  }), tt && fn.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function Im() {
  fn && fn.disconnect();
}
function zm(e) {
  const t = e.getAttribute("style");
  let r = [];
  return t && (r = t.split(";").reduce((n, a) => {
    const o = a.split(":"), i = o[0], s = o.slice(1);
    return i && s.length > 0 && (n[i] = s.join(":").trim()), n;
  }, {})), r;
}
function Mm(e) {
  const t = e.getAttribute("data-prefix"), r = e.getAttribute("data-icon"), n = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = kn(ri(e));
  return a.prefix || (a.prefix = xt()), t && r && (a.prefix = t, a.iconName = r), a.iconName && a.prefix || (a.prefix && n.length > 0 && (a.iconName = im(a.prefix, e.innerText) || oi(a.prefix, Jc(e.innerText))), !a.iconName && F.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function Rm(e) {
  const t = ir(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), r = e.getAttribute("title"), n = e.getAttribute("data-fa-title-id");
  return F.autoA11y && (r ? t["aria-labelledby"] = "".concat(F.replacementClass, "-title-").concat(n || Nr()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function _m() {
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
function ss(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: r,
    prefix: n,
    rest: a
  } = Mm(e), o = Rm(e), i = Ja("parseNodeAttributes", {}, e);
  let s = t.styleParser ? zm(e) : [];
  return M({
    iconName: r,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: n,
    transform: _e,
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
  styles: Fm
} = Fe;
function pf(e) {
  const t = F.autoReplaceSvg === "nest" ? ss(e, {
    styleParser: !1
  }) : ss(e);
  return ~t.extra.classes.indexOf(Uc) ? wt("generateLayersText", e, t) : wt("generateSvgReplacementMutation", e, t);
}
function Lm() {
  return [...vp, ...Ga];
}
function ls(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!tt) return Promise.resolve();
  const r = xe.documentElement.classList, n = (f) => r.add("".concat(Xi, "-").concat(f)), a = (f) => r.remove("".concat(Xi, "-").concat(f)), o = F.autoFetchSvg ? Lm() : Fc.concat(Object.keys(Fm));
  o.includes("fa") || o.push("fa");
  const i = [".".concat(Uc, ":not([").concat(Mt, "])")].concat(o.map((f) => ".".concat(f, ":not([").concat(Mt, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = ir(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    n("pending"), a("complete");
  else
    return Promise.resolve();
  const c = si.begin("onTree"), l = s.reduce((f, u) => {
    try {
      const m = pf(u);
      m && f.push(m);
    } catch (m) {
      qc || m.name === "MissingIcon" && console.error(m);
    }
    return f;
  }, []);
  return new Promise((f, u) => {
    Promise.all(l).then((m) => {
      uf(m, () => {
        n("active"), n("complete"), a("pending"), typeof t == "function" && t(), c(), f();
      });
    }).catch((m) => {
      c(), u(m);
    });
  });
}
function Dm(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  pf(e).then((r) => {
    r && uf([r], t);
  });
}
function Wm(e) {
  return function(t) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const n = (t || {}).icon ? t : Za(t || {});
    let {
      mask: a
    } = r;
    return a && (a = (a || {}).icon ? a : Za(a || {})), e(n, M(M({}, r), {}, {
      mask: a
    }));
  };
}
const Ym = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: r = _e,
    symbol: n = !1,
    mask: a = null,
    maskId: o = null,
    title: i = null,
    titleId: s = null,
    classes: c = [],
    attributes: l = {},
    styles: f = {}
  } = t;
  if (!e) return;
  const {
    prefix: u,
    iconName: m,
    icon: v
  } = e;
  return On(M({
    type: "icon"
  }, e), () => (Rt("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), F.autoA11y && (i ? l["aria-labelledby"] = "".concat(F.replacementClass, "-title-").concat(s || Nr()) : (l["aria-hidden"] = "true", l.focusable = "false")), ii({
    icons: {
      main: Qa(v),
      mask: a ? Qa(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: u,
    iconName: m,
    transform: M(M({}, _e), r),
    symbol: n,
    title: i,
    maskId: o,
    titleId: s,
    extra: {
      attributes: l,
      styles: f,
      classes: c
    }
  })));
};
var qm = {
  mixout() {
    return {
      icon: Wm(Ym)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = ls, e.nodeCallback = Dm, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: r = xe,
        callback: n = () => {
        }
      } = t;
      return ls(r, n);
    }, e.generateSvgReplacementMutation = function(t, r) {
      const {
        iconName: n,
        title: a,
        titleId: o,
        prefix: i,
        transform: s,
        symbol: c,
        mask: l,
        maskId: f,
        extra: u
      } = r;
      return new Promise((m, v) => {
        Promise.all([eo(n, i), l.iconName ? eo(l.iconName, l.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((w) => {
          let [h, g] = w;
          m([t, ii({
            icons: {
              main: h,
              mask: g
            },
            prefix: i,
            iconName: n,
            transform: s,
            symbol: c,
            maskId: f,
            title: a,
            titleId: o,
            extra: u,
            watchable: !0
          })]);
        }).catch(v);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: r,
        attributes: n,
        main: a,
        transform: o,
        styles: i
      } = t;
      const s = xn(i);
      s.length > 0 && (n.style = s);
      let c;
      return ni(o) && (c = wt("generateAbstractTransformGrouping", {
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
}, Gm = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: r = []
        } = t;
        return On({
          type: "layer"
        }, () => {
          Rt("beforeDOMElementCreation", {
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
              class: ["".concat(F.cssPrefix, "-layers"), ...r].join(" ")
            },
            children: n
          }];
        });
      }
    };
  }
}, Um = {
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
        return On({
          type: "counter",
          content: e
        }, () => (Rt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Om({
          content: e.toString(),
          title: r,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(F.cssPrefix, "-layers-counter"), ...n]
          }
        })));
      }
    };
  }
}, Vm = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: r = _e,
          title: n = null,
          classes: a = [],
          attributes: o = {},
          styles: i = {}
        } = t;
        return On({
          type: "text",
          content: e
        }, () => (Rt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), rs({
          content: e,
          transform: M(M({}, _e), r),
          title: n,
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
    e.generateLayersText = function(t, r) {
      const {
        title: n,
        transform: a,
        extra: o
      } = r;
      let i = null, s = null;
      if (Rc) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), l = t.getBoundingClientRect();
        i = l.width / c, s = l.height / c;
      }
      return F.autoA11y && !n && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, rs({
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
const Hm = new RegExp('"', "ug"), cs = [1105920, 1112319], fs = M(M(M(M({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), bp), Ip), Ap), no = Object.keys(fs).reduce((e, t) => (e[t.toLowerCase()] = fs[t], e), {}), Bm = Object.keys(no).reduce((e, t) => {
  const r = no[t];
  return e[t] = r[900] || [...Object.entries(r)][0][1], e;
}, {});
function Xm(e) {
  const t = e.replace(Hm, ""), r = tm(t, 0), n = r >= cs[0] && r <= cs[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: Jc(a ? t[0] : t),
    isSecondary: n || a
  };
}
function Km(e, t) {
  const r = e.replace(/^['"]|['"]$/g, "").toLowerCase(), n = parseInt(t), a = isNaN(n) ? "normal" : n;
  return (no[r] || {})[a] || Bm[r];
}
function us(e, t) {
  const r = "".concat(zp).concat(t.replace(":", "-"));
  return new Promise((n, a) => {
    if (e.getAttribute(r) !== null)
      return n();
    const o = ir(e.children).filter((u) => u.getAttribute(Va) === t)[0], i = vt.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), c = s.match(Lp), l = i.getPropertyValue("font-weight"), f = i.getPropertyValue("content");
    if (o && !c)
      return e.removeChild(o), n();
    if (c && f !== "none" && f !== "") {
      const u = i.getPropertyValue("content");
      let m = Km(s, l);
      const {
        value: v,
        isSecondary: w
      } = Xm(u), h = c[0].startsWith("FontAwesome");
      let g = oi(m, v), x = g;
      if (h) {
        const k = sm(v);
        k.iconName && k.prefix && (g = k.iconName, m = k.prefix);
      }
      if (g && !w && (!o || o.getAttribute(Qo) !== m || o.getAttribute(ei) !== x)) {
        e.setAttribute(r, x), o && e.removeChild(o);
        const k = _m(), {
          extra: S
        } = k;
        S.attributes[Va] = t, eo(g, m).then((O) => {
          const p = ii(M(M({}, k), {}, {
            icons: {
              main: O,
              mask: sf()
            },
            prefix: m,
            iconName: x,
            extra: S,
            watchable: !0
          })), Y = xe.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(Y, e.firstChild) : e.appendChild(Y), Y.outerHTML = p.map((V) => _r(V)).join(`
`), e.removeAttribute(r), n();
        }).catch(a);
      } else
        n();
    } else
      n();
  });
}
function Jm(e) {
  return Promise.all([us(e, "::before"), us(e, "::after")]);
}
function Zm(e) {
  return e.parentNode !== document.head && !~Rp.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Va) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function ds(e) {
  if (tt)
    return new Promise((t, r) => {
      const n = ir(e.querySelectorAll("*")).filter(Zm).map(Jm), a = si.begin("searchPseudoElements");
      df(), Promise.all(n).then(() => {
        a(), ro(), t();
      }).catch(() => {
        a(), ro(), r();
      });
    });
}
var Qm = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = ds, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: r = xe
      } = t;
      F.searchPseudoElements && ds(r);
    };
  }
};
let ps = !1;
var eg = {
  mixout() {
    return {
      dom: {
        unwatch() {
          df(), ps = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        is(Ja("mutationObserverCallbacks", {}));
      },
      noAuto() {
        Im();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        ps ? ro() : is(Ja("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const ms = (e) => {
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
var tg = {
  mixout() {
    return {
      parse: {
        transform: (e) => ms(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-transform");
        return r && (e.transform = ms(r)), e;
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
      }, s = "translate(".concat(n.x * 32, ", ").concat(n.y * 32, ") "), c = "scale(".concat(n.size / 16 * (n.flipX ? -1 : 1), ", ").concat(n.size / 16 * (n.flipY ? -1 : 1), ") "), l = "rotate(".concat(n.rotate, " 0 0)"), f = {
        transform: "".concat(s, " ").concat(c, " ").concat(l)
      }, u = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, m = {
        outer: i,
        inner: f,
        path: u
      };
      return {
        tag: "g",
        attributes: M({}, m.outer),
        children: [{
          tag: "g",
          attributes: M({}, m.inner),
          children: [{
            tag: r.icon.tag,
            children: r.icon.children,
            attributes: M(M({}, r.icon.attributes), m.path)
          }]
        }]
      };
    };
  }
};
const Un = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function gs(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function rg(e) {
  return e.tag === "g" ? e.children : [e];
}
var ng = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-mask"), n = r ? kn(r.split(" ").map((a) => a.trim())) : sf();
        return n.prefix || (n.prefix = xt()), e.mask = n, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        icon: l
      } = a, {
        width: f,
        icon: u
      } = o, m = Xp({
        transform: s,
        containerWidth: f,
        iconWidth: c
      }), v = {
        tag: "rect",
        attributes: M(M({}, Un), {}, {
          fill: "white"
        })
      }, w = l.children ? {
        children: l.children.map(gs)
      } : {}, h = {
        tag: "g",
        attributes: M({}, m.inner),
        children: [gs(M({
          tag: l.tag,
          attributes: M(M({}, l.attributes), m.path)
        }, w))]
      }, g = {
        tag: "g",
        attributes: M({}, m.outer),
        children: [h]
      }, x = "mask-".concat(i || Nr()), k = "clip-".concat(i || Nr()), S = {
        tag: "mask",
        attributes: M(M({}, Un), {}, {
          id: x,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [v, g]
      }, O = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: k
          },
          children: rg(u)
        }, S]
      };
      return r.push(O, {
        tag: "rect",
        attributes: M({
          fill: "currentColor",
          "clip-path": "url(#".concat(k, ")"),
          mask: "url(#".concat(x, ")")
        }, Un)
      }), {
        children: r,
        attributes: n
      };
    };
  }
}, ag = {
  provides(e) {
    let t = !1;
    vt.matchMedia && (t = vt.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const r = [], n = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      r.push({
        tag: "path",
        attributes: M(M({}, n), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = M(M({}, a), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: M(M({}, n), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: M(M({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: M(M({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), r.push(i), r.push({
        tag: "path",
        attributes: M(M({}, n), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: M(M({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || r.push({
        tag: "path",
        attributes: M(M({}, n), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: M(M({}, o), {}, {
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
}, og = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-symbol"), n = r === null ? !1 : r === "" ? !0 : r;
        return e.symbol = n, e;
      }
    };
  }
}, ig = [Zp, qm, Gm, Um, Vm, Qm, eg, tg, ng, ag, og];
bm(ig, {
  mixoutsTo: Ne
});
Ne.noAuto;
Ne.config;
Ne.library;
Ne.dom;
const ao = Ne.parse;
Ne.findIconDefinition;
Ne.toHtml;
const sg = Ne.icon;
Ne.layer;
Ne.text;
Ne.counter;
function lg(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Gr = { exports: {} }, Vn = { exports: {} }, ce = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var bs;
function cg() {
  if (bs) return ce;
  bs = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, u = e ? Symbol.for("react.suspense") : 60113, m = e ? Symbol.for("react.suspense_list") : 60120, v = e ? Symbol.for("react.memo") : 60115, w = e ? Symbol.for("react.lazy") : 60116, h = e ? Symbol.for("react.block") : 60121, g = e ? Symbol.for("react.fundamental") : 60117, x = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
  function S(p) {
    if (typeof p == "object" && p !== null) {
      var Y = p.$$typeof;
      switch (Y) {
        case t:
          switch (p = p.type, p) {
            case c:
            case l:
            case n:
            case o:
            case a:
            case u:
              return p;
            default:
              switch (p = p && p.$$typeof, p) {
                case s:
                case f:
                case w:
                case v:
                case i:
                  return p;
                default:
                  return Y;
              }
          }
        case r:
          return Y;
      }
    }
  }
  function O(p) {
    return S(p) === l;
  }
  return ce.AsyncMode = c, ce.ConcurrentMode = l, ce.ContextConsumer = s, ce.ContextProvider = i, ce.Element = t, ce.ForwardRef = f, ce.Fragment = n, ce.Lazy = w, ce.Memo = v, ce.Portal = r, ce.Profiler = o, ce.StrictMode = a, ce.Suspense = u, ce.isAsyncMode = function(p) {
    return O(p) || S(p) === c;
  }, ce.isConcurrentMode = O, ce.isContextConsumer = function(p) {
    return S(p) === s;
  }, ce.isContextProvider = function(p) {
    return S(p) === i;
  }, ce.isElement = function(p) {
    return typeof p == "object" && p !== null && p.$$typeof === t;
  }, ce.isForwardRef = function(p) {
    return S(p) === f;
  }, ce.isFragment = function(p) {
    return S(p) === n;
  }, ce.isLazy = function(p) {
    return S(p) === w;
  }, ce.isMemo = function(p) {
    return S(p) === v;
  }, ce.isPortal = function(p) {
    return S(p) === r;
  }, ce.isProfiler = function(p) {
    return S(p) === o;
  }, ce.isStrictMode = function(p) {
    return S(p) === a;
  }, ce.isSuspense = function(p) {
    return S(p) === u;
  }, ce.isValidElementType = function(p) {
    return typeof p == "string" || typeof p == "function" || p === n || p === l || p === o || p === a || p === u || p === m || typeof p == "object" && p !== null && (p.$$typeof === w || p.$$typeof === v || p.$$typeof === i || p.$$typeof === s || p.$$typeof === f || p.$$typeof === g || p.$$typeof === x || p.$$typeof === k || p.$$typeof === h);
  }, ce.typeOf = S, ce;
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
var hs;
function fg() {
  return hs || (hs = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, u = e ? Symbol.for("react.suspense") : 60113, m = e ? Symbol.for("react.suspense_list") : 60120, v = e ? Symbol.for("react.memo") : 60115, w = e ? Symbol.for("react.lazy") : 60116, h = e ? Symbol.for("react.block") : 60121, g = e ? Symbol.for("react.fundamental") : 60117, x = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
    function S(y) {
      return typeof y == "string" || typeof y == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      y === n || y === l || y === o || y === a || y === u || y === m || typeof y == "object" && y !== null && (y.$$typeof === w || y.$$typeof === v || y.$$typeof === i || y.$$typeof === s || y.$$typeof === f || y.$$typeof === g || y.$$typeof === x || y.$$typeof === k || y.$$typeof === h);
    }
    function O(y) {
      if (typeof y == "object" && y !== null) {
        var ge = y.$$typeof;
        switch (ge) {
          case t:
            var $e = y.type;
            switch ($e) {
              case c:
              case l:
              case n:
              case o:
              case a:
              case u:
                return $e;
              default:
                var at = $e && $e.$$typeof;
                switch (at) {
                  case s:
                  case f:
                  case w:
                  case v:
                  case i:
                    return at;
                  default:
                    return ge;
                }
            }
          case r:
            return ge;
        }
      }
    }
    var p = c, Y = l, V = s, oe = i, ie = t, J = f, ne = n, P = w, U = v, q = r, se = o, W = a, Q = u, ae = !1;
    function Z(y) {
      return ae || (ae = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), d(y) || O(y) === c;
    }
    function d(y) {
      return O(y) === l;
    }
    function b(y) {
      return O(y) === s;
    }
    function N(y) {
      return O(y) === i;
    }
    function A(y) {
      return typeof y == "object" && y !== null && y.$$typeof === t;
    }
    function E(y) {
      return O(y) === f;
    }
    function j(y) {
      return O(y) === n;
    }
    function $(y) {
      return O(y) === w;
    }
    function C(y) {
      return O(y) === v;
    }
    function T(y) {
      return O(y) === r;
    }
    function z(y) {
      return O(y) === o;
    }
    function I(y) {
      return O(y) === a;
    }
    function G(y) {
      return O(y) === u;
    }
    pe.AsyncMode = p, pe.ConcurrentMode = Y, pe.ContextConsumer = V, pe.ContextProvider = oe, pe.Element = ie, pe.ForwardRef = J, pe.Fragment = ne, pe.Lazy = P, pe.Memo = U, pe.Portal = q, pe.Profiler = se, pe.StrictMode = W, pe.Suspense = Q, pe.isAsyncMode = Z, pe.isConcurrentMode = d, pe.isContextConsumer = b, pe.isContextProvider = N, pe.isElement = A, pe.isForwardRef = E, pe.isFragment = j, pe.isLazy = $, pe.isMemo = C, pe.isPortal = T, pe.isProfiler = z, pe.isStrictMode = I, pe.isSuspense = G, pe.isValidElementType = S, pe.typeOf = O;
  }()), pe;
}
var ys;
function mf() {
  return ys || (ys = 1, process.env.NODE_ENV === "production" ? Vn.exports = cg() : Vn.exports = fg()), Vn.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Hn, vs;
function ug() {
  if (vs) return Hn;
  vs = 1;
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
      var c = Object.getOwnPropertyNames(i).map(function(f) {
        return i[f];
      });
      if (c.join("") !== "0123456789")
        return !1;
      var l = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(f) {
        l[f] = f;
      }), Object.keys(Object.assign({}, l)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Hn = a() ? Object.assign : function(o, i) {
    for (var s, c = n(o), l, f = 1; f < arguments.length; f++) {
      s = Object(arguments[f]);
      for (var u in s)
        t.call(s, u) && (c[u] = s[u]);
      if (e) {
        l = e(s);
        for (var m = 0; m < l.length; m++)
          r.call(s, l[m]) && (c[l[m]] = s[l[m]]);
      }
    }
    return c;
  }, Hn;
}
var Bn, xs;
function ci() {
  if (xs) return Bn;
  xs = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return Bn = e, Bn;
}
var ws, ks;
function gf() {
  return ks || (ks = 1, ws = Function.call.bind(Object.prototype.hasOwnProperty)), ws;
}
var Xn, Os;
function dg() {
  if (Os) return Xn;
  Os = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ ci(), r = {}, n = /* @__PURE__ */ gf();
    e = function(o) {
      var i = "Warning: " + o;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function a(o, i, s, c, l) {
    if (process.env.NODE_ENV !== "production") {
      for (var f in o)
        if (n(o, f)) {
          var u;
          try {
            if (typeof o[f] != "function") {
              var m = Error(
                (c || "React class") + ": " + s + " type `" + f + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[f] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw m.name = "Invariant Violation", m;
            }
            u = o[f](i, f, c, s, null, t);
          } catch (w) {
            u = w;
          }
          if (u && !(u instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + f + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof u + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), u instanceof Error && !(u.message in r)) {
            r[u.message] = !0;
            var v = l ? l() : "";
            e(
              "Failed " + s + " type: " + u.message + (v ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (r = {});
  }, Xn = a, Xn;
}
var Kn, Ss;
function pg() {
  if (Ss) return Kn;
  Ss = 1;
  var e = mf(), t = ug(), r = /* @__PURE__ */ ci(), n = /* @__PURE__ */ gf(), a = /* @__PURE__ */ dg(), o = function() {
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
  return Kn = function(s, c) {
    var l = typeof Symbol == "function" && Symbol.iterator, f = "@@iterator";
    function u(d) {
      var b = d && (l && d[l] || d[f]);
      if (typeof b == "function")
        return b;
    }
    var m = "<<anonymous>>", v = {
      array: x("array"),
      bigint: x("bigint"),
      bool: x("boolean"),
      func: x("function"),
      number: x("number"),
      object: x("object"),
      string: x("string"),
      symbol: x("symbol"),
      any: k(),
      arrayOf: S,
      element: O(),
      elementType: p(),
      instanceOf: Y,
      node: J(),
      objectOf: oe,
      oneOf: V,
      oneOfType: ie,
      shape: P,
      exact: U
    };
    function w(d, b) {
      return d === b ? d !== 0 || 1 / d === 1 / b : d !== d && b !== b;
    }
    function h(d, b) {
      this.message = d, this.data = b && typeof b == "object" ? b : {}, this.stack = "";
    }
    h.prototype = Error.prototype;
    function g(d) {
      if (process.env.NODE_ENV !== "production")
        var b = {}, N = 0;
      function A(j, $, C, T, z, I, G) {
        if (T = T || m, I = I || C, G !== r) {
          if (c) {
            var y = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw y.name = "Invariant Violation", y;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ge = T + ":" + C;
            !b[ge] && // Avoid spamming the console because they are often not actionable except for lib authors
            N < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + I + "` prop on `" + T + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), b[ge] = !0, N++);
          }
        }
        return $[C] == null ? j ? $[C] === null ? new h("The " + z + " `" + I + "` is marked as required " + ("in `" + T + "`, but its value is `null`.")) : new h("The " + z + " `" + I + "` is marked as required in " + ("`" + T + "`, but its value is `undefined`.")) : null : d($, C, T, z, I);
      }
      var E = A.bind(null, !1);
      return E.isRequired = A.bind(null, !0), E;
    }
    function x(d) {
      function b(N, A, E, j, $, C) {
        var T = N[A], z = W(T);
        if (z !== d) {
          var I = Q(T);
          return new h(
            "Invalid " + j + " `" + $ + "` of type " + ("`" + I + "` supplied to `" + E + "`, expected ") + ("`" + d + "`."),
            { expectedType: d }
          );
        }
        return null;
      }
      return g(b);
    }
    function k() {
      return g(i);
    }
    function S(d) {
      function b(N, A, E, j, $) {
        if (typeof d != "function")
          return new h("Property `" + $ + "` of component `" + E + "` has invalid PropType notation inside arrayOf.");
        var C = N[A];
        if (!Array.isArray(C)) {
          var T = W(C);
          return new h("Invalid " + j + " `" + $ + "` of type " + ("`" + T + "` supplied to `" + E + "`, expected an array."));
        }
        for (var z = 0; z < C.length; z++) {
          var I = d(C, z, E, j, $ + "[" + z + "]", r);
          if (I instanceof Error)
            return I;
        }
        return null;
      }
      return g(b);
    }
    function O() {
      function d(b, N, A, E, j) {
        var $ = b[N];
        if (!s($)) {
          var C = W($);
          return new h("Invalid " + E + " `" + j + "` of type " + ("`" + C + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return g(d);
    }
    function p() {
      function d(b, N, A, E, j) {
        var $ = b[N];
        if (!e.isValidElementType($)) {
          var C = W($);
          return new h("Invalid " + E + " `" + j + "` of type " + ("`" + C + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return g(d);
    }
    function Y(d) {
      function b(N, A, E, j, $) {
        if (!(N[A] instanceof d)) {
          var C = d.name || m, T = Z(N[A]);
          return new h("Invalid " + j + " `" + $ + "` of type " + ("`" + T + "` supplied to `" + E + "`, expected ") + ("instance of `" + C + "`."));
        }
        return null;
      }
      return g(b);
    }
    function V(d) {
      if (!Array.isArray(d))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), i;
      function b(N, A, E, j, $) {
        for (var C = N[A], T = 0; T < d.length; T++)
          if (w(C, d[T]))
            return null;
        var z = JSON.stringify(d, function(I, G) {
          var y = Q(G);
          return y === "symbol" ? String(G) : G;
        });
        return new h("Invalid " + j + " `" + $ + "` of value `" + String(C) + "` " + ("supplied to `" + E + "`, expected one of " + z + "."));
      }
      return g(b);
    }
    function oe(d) {
      function b(N, A, E, j, $) {
        if (typeof d != "function")
          return new h("Property `" + $ + "` of component `" + E + "` has invalid PropType notation inside objectOf.");
        var C = N[A], T = W(C);
        if (T !== "object")
          return new h("Invalid " + j + " `" + $ + "` of type " + ("`" + T + "` supplied to `" + E + "`, expected an object."));
        for (var z in C)
          if (n(C, z)) {
            var I = d(C, z, E, j, $ + "." + z, r);
            if (I instanceof Error)
              return I;
          }
        return null;
      }
      return g(b);
    }
    function ie(d) {
      if (!Array.isArray(d))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var b = 0; b < d.length; b++) {
        var N = d[b];
        if (typeof N != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + ae(N) + " at index " + b + "."
          ), i;
      }
      function A(E, j, $, C, T) {
        for (var z = [], I = 0; I < d.length; I++) {
          var G = d[I], y = G(E, j, $, C, T, r);
          if (y == null)
            return null;
          y.data && n(y.data, "expectedType") && z.push(y.data.expectedType);
        }
        var ge = z.length > 0 ? ", expected one of type [" + z.join(", ") + "]" : "";
        return new h("Invalid " + C + " `" + T + "` supplied to " + ("`" + $ + "`" + ge + "."));
      }
      return g(A);
    }
    function J() {
      function d(b, N, A, E, j) {
        return q(b[N]) ? null : new h("Invalid " + E + " `" + j + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return g(d);
    }
    function ne(d, b, N, A, E) {
      return new h(
        (d || "React class") + ": " + b + " type `" + N + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + E + "`."
      );
    }
    function P(d) {
      function b(N, A, E, j, $) {
        var C = N[A], T = W(C);
        if (T !== "object")
          return new h("Invalid " + j + " `" + $ + "` of type `" + T + "` " + ("supplied to `" + E + "`, expected `object`."));
        for (var z in d) {
          var I = d[z];
          if (typeof I != "function")
            return ne(E, j, $, z, Q(I));
          var G = I(C, z, E, j, $ + "." + z, r);
          if (G)
            return G;
        }
        return null;
      }
      return g(b);
    }
    function U(d) {
      function b(N, A, E, j, $) {
        var C = N[A], T = W(C);
        if (T !== "object")
          return new h("Invalid " + j + " `" + $ + "` of type `" + T + "` " + ("supplied to `" + E + "`, expected `object`."));
        var z = t({}, N[A], d);
        for (var I in z) {
          var G = d[I];
          if (n(d, I) && typeof G != "function")
            return ne(E, j, $, I, Q(G));
          if (!G)
            return new h(
              "Invalid " + j + " `" + $ + "` key `" + I + "` supplied to `" + E + "`.\nBad object: " + JSON.stringify(N[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(d), null, "  ")
            );
          var y = G(C, I, E, j, $ + "." + I, r);
          if (y)
            return y;
        }
        return null;
      }
      return g(b);
    }
    function q(d) {
      switch (typeof d) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !d;
        case "object":
          if (Array.isArray(d))
            return d.every(q);
          if (d === null || s(d))
            return !0;
          var b = u(d);
          if (b) {
            var N = b.call(d), A;
            if (b !== d.entries) {
              for (; !(A = N.next()).done; )
                if (!q(A.value))
                  return !1;
            } else
              for (; !(A = N.next()).done; ) {
                var E = A.value;
                if (E && !q(E[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function se(d, b) {
      return d === "symbol" ? !0 : b ? b["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && b instanceof Symbol : !1;
    }
    function W(d) {
      var b = typeof d;
      return Array.isArray(d) ? "array" : d instanceof RegExp ? "object" : se(b, d) ? "symbol" : b;
    }
    function Q(d) {
      if (typeof d > "u" || d === null)
        return "" + d;
      var b = W(d);
      if (b === "object") {
        if (d instanceof Date)
          return "date";
        if (d instanceof RegExp)
          return "regexp";
      }
      return b;
    }
    function ae(d) {
      var b = Q(d);
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
    function Z(d) {
      return !d.constructor || !d.constructor.name ? m : d.constructor.name;
    }
    return v.checkPropTypes = a, v.resetWarningCache = a.resetWarningCache, v.PropTypes = v, v;
  }, Kn;
}
var Jn, Es;
function mg() {
  if (Es) return Jn;
  Es = 1;
  var e = /* @__PURE__ */ ci();
  function t() {
  }
  function r() {
  }
  return r.resetWarningCache = t, Jn = function() {
    function n(i, s, c, l, f, u) {
      if (u !== e) {
        var m = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw m.name = "Invariant Violation", m;
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
  }, Jn;
}
var As;
function gg() {
  if (As) return Gr.exports;
  if (As = 1, process.env.NODE_ENV !== "production") {
    var e = mf(), t = !0;
    Gr.exports = /* @__PURE__ */ pg()(e.isElement, t);
  } else
    Gr.exports = /* @__PURE__ */ mg()();
  return Gr.exports;
}
var bg = /* @__PURE__ */ gg();
const ee = /* @__PURE__ */ lg(bg);
function Ps(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function ze(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Ps(Object(r), !0).forEach(function(n) {
      Gt(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : Ps(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function un(e) {
  "@babel/helpers - typeof";
  return un = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, un(e);
}
function Gt(e, t, r) {
  return t in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function hg(e, t) {
  if (e == null) return {};
  var r = {}, n = Object.keys(e), a, o;
  for (o = 0; o < n.length; o++)
    a = n[o], !(t.indexOf(a) >= 0) && (r[a] = e[a]);
  return r;
}
function yg(e, t) {
  if (e == null) return {};
  var r = hg(e, t), n, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      n = o[a], !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n]);
  }
  return r;
}
function oo(e) {
  return vg(e) || xg(e) || wg(e) || kg();
}
function vg(e) {
  if (Array.isArray(e)) return io(e);
}
function xg(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function wg(e, t) {
  if (e) {
    if (typeof e == "string") return io(e, t);
    var r = Object.prototype.toString.call(e).slice(8, -1);
    if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return io(e, t);
  }
}
function io(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
  return n;
}
function kg() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Og(e) {
  var t, r = e.beat, n = e.fade, a = e.beatFade, o = e.bounce, i = e.shake, s = e.flash, c = e.spin, l = e.spinPulse, f = e.spinReverse, u = e.pulse, m = e.fixedWidth, v = e.inverse, w = e.border, h = e.listItem, g = e.flip, x = e.size, k = e.rotation, S = e.pull, O = (t = {
    "fa-beat": r,
    "fa-fade": n,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": f,
    "fa-spin-pulse": l,
    "fa-pulse": u,
    "fa-fw": m,
    "fa-inverse": v,
    "fa-border": w,
    "fa-li": h,
    "fa-flip": g === !0,
    "fa-flip-horizontal": g === "horizontal" || g === "both",
    "fa-flip-vertical": g === "vertical" || g === "both"
  }, Gt(t, "fa-".concat(x), typeof x < "u" && x !== null), Gt(t, "fa-rotate-".concat(k), typeof k < "u" && k !== null && k !== 0), Gt(t, "fa-pull-".concat(S), typeof S < "u" && S !== null), Gt(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(O).map(function(p) {
    return O[p] ? p : null;
  }).filter(function(p) {
    return p;
  });
}
function Sg(e) {
  return e = e - 0, e === e;
}
function bf(e) {
  return Sg(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, r) {
    return r ? r.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var Eg = ["style"];
function Ag(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function Pg(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, r) {
    var n = r.indexOf(":"), a = bf(r.slice(0, n)), o = r.slice(n + 1).trim();
    return a.startsWith("webkit") ? t[Ag(a)] = o : t[a] = o, t;
  }, {});
}
function hf(e, t) {
  var r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var n = (t.children || []).map(function(c) {
    return hf(e, c);
  }), a = Object.keys(t.attributes || {}).reduce(function(c, l) {
    var f = t.attributes[l];
    switch (l) {
      case "class":
        c.attrs.className = f, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = Pg(f);
        break;
      default:
        l.indexOf("aria-") === 0 || l.indexOf("data-") === 0 ? c.attrs[l.toLowerCase()] = f : c.attrs[bf(l)] = f;
    }
    return c;
  }, {
    attrs: {}
  }), o = r.style, i = o === void 0 ? {} : o, s = yg(r, Eg);
  return a.attrs.style = ze(ze({}, a.attrs.style), i), e.apply(void 0, [t.tag, ze(ze({}, a.attrs), s)].concat(oo(n)));
}
var yf = !1;
try {
  yf = process.env.NODE_ENV === "production";
} catch {
}
function $g() {
  if (!yf && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function $s(e) {
  if (e && un(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (ao.icon)
    return ao.icon(e);
  if (e === null)
    return null;
  if (e && un(e) === "object" && e.prefix && e.iconName)
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
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Gt({}, e, t) : {};
}
var Cs = {
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
}, fi = /* @__PURE__ */ Oe.forwardRef(function(e, t) {
  var r = ze(ze({}, Cs), e), n = r.icon, a = r.mask, o = r.symbol, i = r.className, s = r.title, c = r.titleId, l = r.maskId, f = $s(n), u = Zn("classes", [].concat(oo(Og(r)), oo((i || "").split(" ")))), m = Zn("transform", typeof r.transform == "string" ? ao.transform(r.transform) : r.transform), v = Zn("mask", $s(a)), w = sg(f, ze(ze(ze(ze({}, u), m), v), {}, {
    symbol: o,
    title: s,
    titleId: c,
    maskId: l
  }));
  if (!w)
    return $g("Could not find icon", f), null;
  var h = w.abstract, g = {
    ref: t
  };
  return Object.keys(r).forEach(function(x) {
    Cs.hasOwnProperty(x) || (g[x] = r[x]);
  }), Cg(h[0], g);
});
fi.displayName = "FontAwesomeIcon";
fi.propTypes = {
  beat: ee.bool,
  border: ee.bool,
  beatFade: ee.bool,
  bounce: ee.bool,
  className: ee.string,
  fade: ee.bool,
  flash: ee.bool,
  mask: ee.oneOfType([ee.object, ee.array, ee.string]),
  maskId: ee.string,
  fixedWidth: ee.bool,
  inverse: ee.bool,
  flip: ee.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: ee.oneOfType([ee.object, ee.array, ee.string]),
  listItem: ee.bool,
  pull: ee.oneOf(["right", "left"]),
  pulse: ee.bool,
  rotation: ee.oneOf([0, 90, 180, 270]),
  shake: ee.bool,
  size: ee.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: ee.bool,
  spinPulse: ee.bool,
  spinReverse: ee.bool,
  symbol: ee.oneOfType([ee.bool, ee.string]),
  title: ee.string,
  titleId: ee.string,
  transform: ee.oneOfType([ee.string, ee.object]),
  swapOpacity: ee.bool
};
var Cg = hf.bind(null, Oe.createElement);
const ui = "-", Ng = (e) => {
  const t = Tg(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (a) => {
      const o = a.split(ui);
      return o[0] === "" && o.length !== 1 && o.shift(), vf(o, t) || jg(a);
    },
    getConflictingClassGroupIds: (a, o) => {
      const i = r[a] || [];
      return o && n[a] ? [...i, ...n[a]] : i;
    }
  };
}, vf = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], a = t.nextPart.get(n), o = a ? vf(e.slice(1), a) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const i = e.join(ui);
  return (r = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : r.classGroupId;
}, Ns = /^\[(.+)\]$/, jg = (e) => {
  if (Ns.test(e)) {
    const t = Ns.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, Tg = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return zg(Object.entries(e.classGroups), r).forEach(([a, o]) => {
    so(o, n, a, t);
  }), n;
}, so = (e, t, r, n) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : js(t, a);
      o.classGroupId = r;
      return;
    }
    if (typeof a == "function") {
      if (Ig(a)) {
        so(a(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: r
      });
      return;
    }
    Object.entries(a).forEach(([o, i]) => {
      so(i, js(t, o), r, n);
    });
  });
}, js = (e, t) => {
  let r = e;
  return t.split(ui).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, Ig = (e) => e.isThemeGetter, zg = (e, t) => t ? e.map(([r, n]) => {
  const a = n.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([i, s]) => [t + i, s])) : o);
  return [r, a];
}) : e, Mg = (e) => {
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
}, xf = "!", Rg = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, a = t[0], o = t.length, i = (s) => {
    const c = [];
    let l = 0, f = 0, u;
    for (let g = 0; g < s.length; g++) {
      let x = s[g];
      if (l === 0) {
        if (x === a && (n || s.slice(g, g + o) === t)) {
          c.push(s.slice(f, g)), f = g + o;
          continue;
        }
        if (x === "/") {
          u = g;
          continue;
        }
      }
      x === "[" ? l++ : x === "]" && l--;
    }
    const m = c.length === 0 ? s : s.substring(f), v = m.startsWith(xf), w = v ? m.substring(1) : m, h = u && u > f ? u - f : void 0;
    return {
      modifiers: c,
      hasImportantModifier: v,
      baseClassName: w,
      maybePostfixModifierPosition: h
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, _g = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, Fg = (e) => ({
  cache: Mg(e.cacheSize),
  parseClassName: Rg(e),
  ...Ng(e)
}), Lg = /\s+/, Dg = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: a
  } = t, o = [], i = e.trim().split(Lg);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: f,
      hasImportantModifier: u,
      baseClassName: m,
      maybePostfixModifierPosition: v
    } = r(l);
    let w = !!v, h = n(w ? m.substring(0, v) : m);
    if (!h) {
      if (!w) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (h = n(m), !h) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      w = !1;
    }
    const g = _g(f).join(":"), x = u ? g + xf : g, k = x + h;
    if (o.includes(k))
      continue;
    o.push(k);
    const S = a(h, w);
    for (let O = 0; O < S.length; ++O) {
      const p = S[O];
      o.push(x + p);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function Wg() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = wf(t)) && (n && (n += " "), n += r);
  return n;
}
const wf = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = wf(e[n])) && (r && (r += " "), r += t);
  return r;
};
function Yg(e, ...t) {
  let r, n, a, o = i;
  function i(c) {
    const l = t.reduce((f, u) => u(f), e());
    return r = Fg(l), n = r.cache.get, a = r.cache.set, o = s, s(c);
  }
  function s(c) {
    const l = n(c);
    if (l)
      return l;
    const f = Dg(c, r);
    return a(c, f), f;
  }
  return function() {
    return o(Wg.apply(null, arguments));
  };
}
const he = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, kf = /^\[(?:([a-z-]+):)?(.+)\]$/i, qg = /^\d+\/\d+$/, Gg = /* @__PURE__ */ new Set(["px", "full", "screen"]), Ug = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Vg = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Hg = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Bg = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Xg = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Ue = (e) => Jt(e) || Gg.has(e) || qg.test(e), lt = (e) => sr(e, "length", nb), Jt = (e) => !!e && !Number.isNaN(Number(e)), Qn = (e) => sr(e, "number", Jt), mr = (e) => !!e && Number.isInteger(Number(e)), Kg = (e) => e.endsWith("%") && Jt(e.slice(0, -1)), B = (e) => kf.test(e), ct = (e) => Ug.test(e), Jg = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Zg = (e) => sr(e, Jg, Of), Qg = (e) => sr(e, "position", Of), eb = /* @__PURE__ */ new Set(["image", "url"]), tb = (e) => sr(e, eb, ob), rb = (e) => sr(e, "", ab), gr = () => !0, sr = (e, t, r) => {
  const n = kf.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, nb = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  Vg.test(e) && !Hg.test(e)
), Of = () => !1, ab = (e) => Bg.test(e), ob = (e) => Xg.test(e), ib = () => {
  const e = he("colors"), t = he("spacing"), r = he("blur"), n = he("brightness"), a = he("borderColor"), o = he("borderRadius"), i = he("borderSpacing"), s = he("borderWidth"), c = he("contrast"), l = he("grayscale"), f = he("hueRotate"), u = he("invert"), m = he("gap"), v = he("gradientColorStops"), w = he("gradientColorStopPositions"), h = he("inset"), g = he("margin"), x = he("opacity"), k = he("padding"), S = he("saturate"), O = he("scale"), p = he("sepia"), Y = he("skew"), V = he("space"), oe = he("translate"), ie = () => ["auto", "contain", "none"], J = () => ["auto", "hidden", "clip", "visible", "scroll"], ne = () => ["auto", B, t], P = () => [B, t], U = () => ["", Ue, lt], q = () => ["auto", Jt, B], se = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], W = () => ["solid", "dashed", "dotted", "double", "none"], Q = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], ae = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], Z = () => ["", "0", B], d = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], b = () => [Jt, B];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [gr],
      spacing: [Ue, lt],
      blur: ["none", "", ct, B],
      brightness: b(),
      borderColor: [e],
      borderRadius: ["none", "", "full", ct, B],
      borderSpacing: P(),
      borderWidth: U(),
      contrast: b(),
      grayscale: Z(),
      hueRotate: b(),
      invert: Z(),
      gap: P(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Kg, lt],
      inset: ne(),
      margin: ne(),
      opacity: b(),
      padding: P(),
      saturate: b(),
      scale: b(),
      sepia: Z(),
      skew: b(),
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
        aspect: ["auto", "square", "video", B]
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
        columns: [ct]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": d()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": d()
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
        object: [...se(), B]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: J()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": J()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": J()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: ie()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": ie()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": ie()
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
        inset: [h]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [h]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [h]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [h]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [h]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [h]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [h]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [h]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [h]
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
        z: ["auto", mr, B]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ne()
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
        flex: ["1", "auto", "initial", "none", B]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: Z()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: Z()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", mr, B]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [gr]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", mr, B]
        }, B]
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
        "grid-rows": [gr]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [mr, B]
        }, B]
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
        "auto-cols": ["auto", "min", "max", "fr", B]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", B]
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
        justify: ["normal", ...ae()]
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
        content: ["normal", ...ae(), "baseline"]
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
        "place-content": [...ae(), "baseline"]
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
        p: [k]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [k]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [k]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [k]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [k]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [k]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [k]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [k]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [k]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [g]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [g]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [g]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [g]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [g]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [g]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [g]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [g]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [g]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [V]
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
        "space-y": [V]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", B, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [B, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [B, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [ct]
        }, ct]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [B, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [B, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [B, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [B, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", ct, lt]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Qn]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [gr]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", B]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Jt, Qn]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Ue, B]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", B]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", B]
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
        decoration: [...W(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", Ue, lt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Ue, B]
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
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", B]
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
        content: ["none", B]
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
        bg: [...se(), Qg]
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
        bg: ["auto", "cover", "contain", Zg]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, tb]
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
        from: [w]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [w]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [w]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [v]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [v]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [v]
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
        "border-opacity": [x]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...W(), "hidden"]
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
        divide: W()
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
        outline: ["", ...W()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Ue, B]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Ue, lt]
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
        ring: U()
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
        "ring-offset": [Ue, lt]
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
        shadow: ["", "inner", "none", ct, rb]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [gr]
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
        "mix-blend": [...Q(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": Q()
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
        "drop-shadow": ["", "none", ct, B]
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
        "hue-rotate": [f]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [u]
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
        "backdrop-grayscale": [l]
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
        "backdrop-invert": [u]
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
        "backdrop-saturate": [S]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", B]
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
        ease: ["linear", "in", "out", "in-out", B]
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
        animate: ["none", "spin", "ping", "pulse", "bounce", B]
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
        rotate: [mr, B]
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
        "skew-x": [Y]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [Y]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", B]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", B]
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
        "will-change": ["auto", "scroll", "contents", "transform", B]
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
        stroke: [Ue, lt, Qn]
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
}, sb = /* @__PURE__ */ Yg(ib), lb = ({
  className: e,
  children: t,
  required: r,
  ...n
}) => /* @__PURE__ */ qe(
  "label",
  {
    className: sb("text-base-fg mb-2 text-[15px] font-medium", e),
    ...n,
    children: [
      t,
      r && /* @__PURE__ */ le("span", { className: "ml-0.5 text-[#ff6467]", children: "*" })
    ]
  }
), Sf = Oe.forwardRef(
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
    errorMessage: l,
    ...f
  }, u) => /* @__PURE__ */ qe("div", { className: Dn("flex flex-col", a), children: [
    e && /* @__PURE__ */ le(lb, { htmlFor: o || e, children: e }),
    /* @__PURE__ */ qe("div", { className: "relative w-full", children: [
      t && /* @__PURE__ */ le(
        fi,
        {
          icon: t,
          className: Dn("text-md absolute pl-3 pt-3", n)
        }
      ),
      /* @__PURE__ */ le(
        "input",
        {
          ref: u,
          id: o || e || void 0,
          className: Dn(
            "h-10 w-full rounded-lg px-3 py-2.5 outline-none",
            "bg-ui-panel text-base-fg placeholder-base-fg/50",
            "border border-ui-panel-border transition-all duration-150 ease-in-out hover:border-primary/60 focus:border-primary focus:!outline-none",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-ui-panel-border",
            t && "pl-10",
            i && "outline-red focus:outline-red",
            r
          ),
          onFocus: (m) => {
            c && c(m);
          },
          onBlur: (m) => {
            s && s(m);
          },
          ...f
        }
      ),
      l && /* @__PURE__ */ le("h6", { className: "absolute z-10 text-red", children: l })
    ] })
  ] })
);
Sf.displayName = "Input";
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function cb(e, t, r) {
  return (t = ub(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function Ts(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function R(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Ts(Object(r), !0).forEach(function(n) {
      cb(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : Ts(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function fb(e, t) {
  if (typeof e != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(e, t);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function ub(e) {
  var t = fb(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Is = () => {
};
let di = {}, Ef = {}, Af = null, Pf = {
  mark: Is,
  measure: Is
};
try {
  typeof window < "u" && (di = window), typeof document < "u" && (Ef = document), typeof MutationObserver < "u" && (Af = MutationObserver), typeof performance < "u" && (Pf = performance);
} catch {
}
const {
  userAgent: zs = ""
} = di.navigator || {}, kt = di, we = Ef, Ms = Af, Ur = Pf;
kt.document;
const rt = !!we.documentElement && !!we.head && typeof we.addEventListener == "function" && typeof we.createElement == "function", $f = ~zs.indexOf("MSIE") || ~zs.indexOf("Trident/");
var db = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, pb = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Cf = {
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
}, mb = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Nf = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Ae = "classic", Sn = "duotone", gb = "sharp", bb = "sharp-duotone", jf = [Ae, Sn, gb, bb], hb = {
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
}, yb = {
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
}, vb = /* @__PURE__ */ new Map([["classic", {
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
}]]), xb = {
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
}, wb = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Rs = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, kb = ["kit"], Ob = {
  kit: {
    "fa-kit": "fak"
  }
}, Sb = ["fak", "fakd"], Eb = {
  kit: {
    fak: "fa-kit"
  }
}, _s = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Vr = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Ab = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Pb = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], $b = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, Cb = {
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
}, Nb = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, lo = {
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
}, jb = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], co = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...Ab, ...jb], Tb = ["solid", "regular", "light", "thin", "duotone", "brands"], Tf = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], Ib = Tf.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), zb = [...Object.keys(Nb), ...Tb, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Vr.GROUP, Vr.SWAP_OPACITY, Vr.PRIMARY, Vr.SECONDARY].concat(Tf.map((e) => "".concat(e, "x"))).concat(Ib.map((e) => "w-".concat(e))), Mb = {
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
const Je = "___FONT_AWESOME___", fo = 16, If = "fa", zf = "svg-inline--fa", _t = "data-fa-i2svg", uo = "data-fa-pseudo-element", Rb = "data-fa-pseudo-element-pending", pi = "data-prefix", mi = "data-icon", Fs = "fontawesome-i2svg", _b = "async", Fb = ["HTML", "HEAD", "STYLE", "SCRIPT"], Mf = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Fr(e) {
  return new Proxy(e, {
    get(t, r) {
      return r in t ? t[r] : t[Ae];
    }
  });
}
const Rf = R({}, Cf);
Rf[Ae] = R(R(R(R({}, {
  "fa-duotone": "duotone"
}), Cf[Ae]), Rs.kit), Rs["kit-duotone"]);
const Lb = Fr(Rf), po = R({}, xb);
po[Ae] = R(R(R(R({}, {
  duotone: "fad"
}), po[Ae]), _s.kit), _s["kit-duotone"]);
const Ls = Fr(po), mo = R({}, lo);
mo[Ae] = R(R({}, mo[Ae]), Eb.kit);
const gi = Fr(mo), go = R({}, Cb);
go[Ae] = R(R({}, go[Ae]), Ob.kit);
Fr(go);
const Db = db, _f = "fa-layers-text", Wb = pb, Yb = R({}, hb);
Fr(Yb);
const qb = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], ea = mb, Gb = [...kb, ...zb], Ar = kt.FontAwesomeConfig || {};
function Ub(e) {
  var t = we.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function Vb(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
we && typeof we.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, r] = e;
  const n = Vb(Ub(t));
  n != null && (Ar[r] = n);
});
const Ff = {
  styleDefault: "solid",
  familyDefault: Ae,
  cssPrefix: If,
  replacementClass: zf,
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
Ar.familyPrefix && (Ar.cssPrefix = Ar.familyPrefix);
const nr = R(R({}, Ff), Ar);
nr.autoReplaceSvg || (nr.observeMutations = !1);
const L = {};
Object.keys(Ff).forEach((e) => {
  Object.defineProperty(L, e, {
    enumerable: !0,
    set: function(t) {
      nr[e] = t, Pr.forEach((r) => r(L));
    },
    get: function() {
      return nr[e];
    }
  });
});
Object.defineProperty(L, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    nr.cssPrefix = e, Pr.forEach((t) => t(L));
  },
  get: function() {
    return nr.cssPrefix;
  }
});
kt.FontAwesomeConfig = L;
const Pr = [];
function Hb(e) {
  return Pr.push(e), () => {
    Pr.splice(Pr.indexOf(e), 1);
  };
}
const ft = fo, Le = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function Bb(e) {
  if (!e || !rt)
    return;
  const t = we.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const r = we.head.childNodes;
  let n = null;
  for (let a = r.length - 1; a > -1; a--) {
    const o = r[a], i = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (n = o);
  }
  return we.head.insertBefore(t, n), e;
}
const Xb = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Tr() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += Xb[Math.random() * 62 | 0];
  return t;
}
function lr(e) {
  const t = [];
  for (let r = (e || []).length >>> 0; r--; )
    t[r] = e[r];
  return t;
}
function bi(e) {
  return e.classList ? lr(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function Lf(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Kb(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, '="').concat(Lf(e[r]), '" '), "").trim();
}
function En(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, ": ").concat(e[r].trim(), ";"), "");
}
function hi(e) {
  return e.size !== Le.size || e.x !== Le.x || e.y !== Le.y || e.rotate !== Le.rotate || e.flipX || e.flipY;
}
function Jb(e) {
  let {
    transform: t,
    containerWidth: r,
    iconWidth: n
  } = e;
  const a = {
    transform: "translate(".concat(r / 2, " 256)")
  }, o = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), c = {
    transform: "".concat(o, " ").concat(i, " ").concat(s)
  }, l = {
    transform: "translate(".concat(n / 2 * -1, " -256)")
  };
  return {
    outer: a,
    inner: c,
    path: l
  };
}
function Zb(e) {
  let {
    transform: t,
    width: r = fo,
    height: n = fo,
    startCentered: a = !1
  } = e, o = "";
  return a && $f ? o += "translate(".concat(t.x / ft - r / 2, "em, ").concat(t.y / ft - n / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / ft, "em), calc(-50% + ").concat(t.y / ft, "em)) ") : o += "translate(".concat(t.x / ft, "em, ").concat(t.y / ft, "em) "), o += "scale(".concat(t.size / ft * (t.flipX ? -1 : 1), ", ").concat(t.size / ft * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var Qb = `:root, :host {
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
function Df() {
  const e = If, t = zf, r = L.cssPrefix, n = L.replacementClass;
  let a = Qb;
  if (r !== e || n !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(r, "-")).replace(i, "--".concat(r, "-")).replace(s, ".".concat(n));
  }
  return a;
}
let Ds = !1;
function ta() {
  L.autoAddCss && !Ds && (Bb(Df()), Ds = !0);
}
var eh = {
  mixout() {
    return {
      dom: {
        css: Df,
        insertCss: ta
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        ta();
      },
      beforeI2svg() {
        ta();
      }
    };
  }
};
const Ze = kt || {};
Ze[Je] || (Ze[Je] = {});
Ze[Je].styles || (Ze[Je].styles = {});
Ze[Je].hooks || (Ze[Je].hooks = {});
Ze[Je].shims || (Ze[Je].shims = []);
var De = Ze[Je];
const Wf = [], Yf = function() {
  we.removeEventListener("DOMContentLoaded", Yf), dn = 1, Wf.map((e) => e());
};
let dn = !1;
rt && (dn = (we.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(we.readyState), dn || we.addEventListener("DOMContentLoaded", Yf));
function th(e) {
  rt && (dn ? setTimeout(e, 0) : Wf.push(e));
}
function Lr(e) {
  const {
    tag: t,
    attributes: r = {},
    children: n = []
  } = e;
  return typeof e == "string" ? Lf(e) : "<".concat(t, " ").concat(Kb(r), ">").concat(n.map(Lr).join(""), "</").concat(t, ">");
}
function Ws(e, t, r) {
  if (e && e[t] && e[t][r])
    return {
      prefix: t,
      iconName: r,
      icon: e[t][r]
    };
}
var ra = function(e, t, r, n) {
  var a = Object.keys(e), o = a.length, i = t, s, c, l;
  for (r === void 0 ? (s = 1, l = e[a[0]]) : (s = 0, l = r); s < o; s++)
    c = a[s], l = i(l, e[c], c, e);
  return l;
};
function rh(e) {
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
function qf(e) {
  const t = rh(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function nh(e, t) {
  const r = e.length;
  let n = e.charCodeAt(t), a;
  return n >= 55296 && n <= 56319 && r > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (n - 55296) * 1024 + a - 56320 + 65536 : n;
}
function Ys(e) {
  return Object.keys(e).reduce((t, r) => {
    const n = e[r];
    return n.icon ? t[n.iconName] = n.icon : t[r] = n, t;
  }, {});
}
function bo(e, t) {
  let r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: n = !1
  } = r, a = Ys(t);
  typeof De.hooks.addPack == "function" && !n ? De.hooks.addPack(e, Ys(t)) : De.styles[e] = R(R({}, De.styles[e] || {}), a), e === "fas" && bo("fa", t);
}
const {
  styles: Ir,
  shims: ah
} = De, Gf = Object.keys(gi), oh = Gf.reduce((e, t) => (e[t] = Object.keys(gi[t]), e), {});
let yi = null, Uf = {}, Vf = {}, Hf = {}, Bf = {}, Xf = {};
function ih(e) {
  return ~Gb.indexOf(e);
}
function sh(e, t) {
  const r = t.split("-"), n = r[0], a = r.slice(1).join("-");
  return n === e && a !== "" && !ih(a) ? a : null;
}
const Kf = () => {
  const e = (n) => ra(Ir, (a, o, i) => (a[i] = ra(o, n, {}), a), {});
  Uf = e((n, a, o) => (a[3] && (n[a[3]] = o), a[2] && a[2].filter((i) => typeof i == "number").forEach((i) => {
    n[i.toString(16)] = o;
  }), n)), Vf = e((n, a, o) => (n[o] = o, a[2] && a[2].filter((i) => typeof i == "string").forEach((i) => {
    n[i] = o;
  }), n)), Xf = e((n, a, o) => {
    const i = a[2];
    return n[o] = o, i.forEach((s) => {
      n[s] = o;
    }), n;
  });
  const t = "far" in Ir || L.autoFetchSvg, r = ra(ah, (n, a) => {
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
  Hf = r.names, Bf = r.unicodes, yi = An(L.styleDefault, {
    family: L.familyDefault
  });
};
Hb((e) => {
  yi = An(e.styleDefault, {
    family: L.familyDefault
  });
});
Kf();
function vi(e, t) {
  return (Uf[e] || {})[t];
}
function lh(e, t) {
  return (Vf[e] || {})[t];
}
function Nt(e, t) {
  return (Xf[e] || {})[t];
}
function Jf(e) {
  return Hf[e] || {
    prefix: null,
    iconName: null
  };
}
function ch(e) {
  const t = Bf[e], r = vi("fas", e);
  return t || (r ? {
    prefix: "fas",
    iconName: r
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Ot() {
  return yi;
}
const Zf = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function fh(e) {
  let t = Ae;
  const r = Gf.reduce((n, a) => (n[a] = "".concat(L.cssPrefix, "-").concat(a), n), {});
  return jf.forEach((n) => {
    (e.includes(r[n]) || e.some((a) => oh[n].includes(a))) && (t = n);
  }), t;
}
function An(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: r = Ae
  } = t, n = Lb[r][e];
  if (r === Sn && !e)
    return "fad";
  const a = Ls[r][e] || Ls[r][n], o = e in De.styles ? e : null;
  return a || o || null;
}
function uh(e) {
  let t = [], r = null;
  return e.forEach((n) => {
    const a = sh(L.cssPrefix, n);
    a ? r = a : n && t.push(n);
  }), {
    iconName: r,
    rest: t
  };
}
function qs(e) {
  return e.sort().filter((t, r, n) => n.indexOf(t) === r);
}
function Pn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: r = !1
  } = t;
  let n = null;
  const a = co.concat(Pb), o = qs(e.filter((u) => a.includes(u))), i = qs(e.filter((u) => !co.includes(u))), s = o.filter((u) => (n = u, !Nf.includes(u))), [c = null] = s, l = fh(o), f = R(R({}, uh(i)), {}, {
    prefix: An(c, {
      family: l
    })
  });
  return R(R(R({}, f), gh({
    values: e,
    family: l,
    styles: Ir,
    config: L,
    canonical: f,
    givenPrefix: n
  })), dh(r, n, f));
}
function dh(e, t, r) {
  let {
    prefix: n,
    iconName: a
  } = r;
  if (e || !n || !a)
    return {
      prefix: n,
      iconName: a
    };
  const o = t === "fa" ? Jf(a) : {}, i = Nt(n, a);
  return a = o.iconName || i || a, n = o.prefix || n, n === "far" && !Ir.far && Ir.fas && !L.autoFetchSvg && (n = "fas"), {
    prefix: n,
    iconName: a
  };
}
const ph = jf.filter((e) => e !== Ae || e !== Sn), mh = Object.keys(lo).filter((e) => e !== Ae).map((e) => Object.keys(lo[e])).flat();
function gh(e) {
  const {
    values: t,
    family: r,
    canonical: n,
    givenPrefix: a = "",
    styles: o = {},
    config: i = {}
  } = e, s = r === Sn, c = t.includes("fa-duotone") || t.includes("fad"), l = i.familyDefault === "duotone", f = n.prefix === "fad" || n.prefix === "fa-duotone";
  if (!s && (c || l || f) && (n.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (n.prefix = "fab"), !n.prefix && ph.includes(r) && (Object.keys(o).find((u) => mh.includes(u)) || i.autoFetchSvg)) {
    const u = vb.get(r).defaultShortPrefixId;
    n.prefix = u, n.iconName = Nt(n.prefix, n.iconName) || n.iconName;
  }
  return (n.prefix === "fa" || a === "fa") && (n.prefix = Ot() || "fas"), n;
}
class bh {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
      r[n] = arguments[n];
    const a = r.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = R(R({}, this.definitions[o] || {}), a[o]), bo(o, a[o]);
      const i = gi[Ae][o];
      i && bo(i, a[o]), Kf();
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
      t[o] || (t[o] = {}), c.length > 0 && c.forEach((l) => {
        typeof l == "string" && (t[o][l] = s);
      }), t[o][i] = s;
    }), t;
  }
}
let Gs = [], Ut = {};
const Zt = {}, hh = Object.keys(Zt);
function yh(e, t) {
  let {
    mixoutsTo: r
  } = t;
  return Gs = e, Ut = {}, Object.keys(Zt).forEach((n) => {
    hh.indexOf(n) === -1 && delete Zt[n];
  }), Gs.forEach((n) => {
    const a = n.mixout ? n.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (r[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((i) => {
        r[o] || (r[o] = {}), r[o][i] = a[o][i];
      });
    }), n.hooks) {
      const o = n.hooks();
      Object.keys(o).forEach((i) => {
        Ut[i] || (Ut[i] = []), Ut[i].push(o[i]);
      });
    }
    n.provides && n.provides(Zt);
  }), r;
}
function ho(e, t) {
  for (var r = arguments.length, n = new Array(r > 2 ? r - 2 : 0), a = 2; a < r; a++)
    n[a - 2] = arguments[a];
  return (Ut[e] || []).forEach((o) => {
    t = o.apply(null, [t, ...n]);
  }), t;
}
function Ft(e) {
  for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++)
    r[n - 1] = arguments[n];
  (Ut[e] || []).forEach((a) => {
    a.apply(null, r);
  });
}
function St() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Zt[e] ? Zt[e].apply(null, t) : void 0;
}
function yo(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const r = e.prefix || Ot();
  if (t)
    return t = Nt(r, t) || t, Ws(Qf.definitions, r, t) || Ws(De.styles, r, t);
}
const Qf = new bh(), vh = () => {
  L.autoReplaceSvg = !1, L.observeMutations = !1, Ft("noAuto");
}, xh = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return rt ? (Ft("beforeI2svg", e), St("pseudoElements2svg", e), St("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    L.autoReplaceSvg === !1 && (L.autoReplaceSvg = !0), L.observeMutations = !0, th(() => {
      kh({
        autoReplaceSvgRoot: t
      }), Ft("watch", e);
    });
  }
}, wh = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Nt(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], r = An(e[0]);
      return {
        prefix: r,
        iconName: Nt(r, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(L.cssPrefix, "-")) > -1 || e.match(Db))) {
      const t = Pn(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Ot(),
        iconName: Nt(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Ot();
      return {
        prefix: t,
        iconName: Nt(t, e) || e
      };
    }
  }
}, je = {
  noAuto: vh,
  config: L,
  dom: xh,
  parse: wh,
  library: Qf,
  findIconDefinition: yo,
  toHtml: Lr
}, kh = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = we
  } = e;
  (Object.keys(De.styles).length > 0 || L.autoFetchSvg) && rt && L.autoReplaceSvg && je.dom.i2svg({
    node: t
  });
};
function $n(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((r) => Lr(r));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!rt) return;
      const r = we.createElement("div");
      return r.innerHTML = e.html, r.children;
    }
  }), e;
}
function Oh(e) {
  let {
    children: t,
    main: r,
    mask: n,
    attributes: a,
    styles: o,
    transform: i
  } = e;
  if (hi(i) && r.found && !n.found) {
    const {
      width: s,
      height: c
    } = r, l = {
      x: s / c / 2,
      y: 0.5
    };
    a.style = En(R(R({}, o), {}, {
      "transform-origin": "".concat(l.x + i.x / 16, "em ").concat(l.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function Sh(e) {
  let {
    prefix: t,
    iconName: r,
    children: n,
    attributes: a,
    symbol: o
  } = e;
  const i = o === !0 ? "".concat(t, "-").concat(L.cssPrefix, "-").concat(r) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: R(R({}, a), {}, {
        id: i
      }),
      children: n
    }]
  }];
}
function xi(e) {
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
    titleId: l,
    extra: f,
    watchable: u = !1
  } = e, {
    width: m,
    height: v
  } = r.found ? r : t, w = Sb.includes(n), h = [L.replacementClass, a ? "".concat(L.cssPrefix, "-").concat(a) : ""].filter((p) => f.classes.indexOf(p) === -1).filter((p) => p !== "" || !!p).concat(f.classes).join(" ");
  let g = {
    children: [],
    attributes: R(R({}, f.attributes), {}, {
      "data-prefix": n,
      "data-icon": a,
      class: h,
      role: f.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(m, " ").concat(v)
    })
  };
  const x = w && !~f.classes.indexOf("fa-fw") ? {
    width: "".concat(m / v * 16 * 0.0625, "em")
  } : {};
  u && (g.attributes[_t] = ""), s && (g.children.push({
    tag: "title",
    attributes: {
      id: g.attributes["aria-labelledby"] || "title-".concat(l || Tr())
    },
    children: [s]
  }), delete g.attributes.title);
  const k = R(R({}, g), {}, {
    prefix: n,
    iconName: a,
    main: t,
    mask: r,
    maskId: c,
    transform: o,
    symbol: i,
    styles: R(R({}, x), f.styles)
  }), {
    children: S,
    attributes: O
  } = r.found && t.found ? St("generateAbstractMask", k) || {
    children: [],
    attributes: {}
  } : St("generateAbstractIcon", k) || {
    children: [],
    attributes: {}
  };
  return k.children = S, k.attributes = O, i ? Sh(k) : Oh(k);
}
function Us(e) {
  const {
    content: t,
    width: r,
    height: n,
    transform: a,
    title: o,
    extra: i,
    watchable: s = !1
  } = e, c = R(R(R({}, i.attributes), o ? {
    title: o
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[_t] = "");
  const l = R({}, i.styles);
  hi(a) && (l.transform = Zb({
    transform: a,
    startCentered: !0,
    width: r,
    height: n
  }), l["-webkit-transform"] = l.transform);
  const f = En(l);
  f.length > 0 && (c.style = f);
  const u = [];
  return u.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), o && u.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), u;
}
function Eh(e) {
  const {
    content: t,
    title: r,
    extra: n
  } = e, a = R(R(R({}, n.attributes), r ? {
    title: r
  } : {}), {}, {
    class: n.classes.join(" ")
  }), o = En(n.styles);
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
  styles: na
} = De;
function vo(e) {
  const t = e[0], r = e[1], [n] = e.slice(4);
  let a = null;
  return Array.isArray(n) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(L.cssPrefix, "-").concat(ea.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(L.cssPrefix, "-").concat(ea.SECONDARY),
        fill: "currentColor",
        d: n[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(L.cssPrefix, "-").concat(ea.PRIMARY),
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
const Ah = {
  found: !1,
  width: 512,
  height: 512
};
function Ph(e, t) {
  !Mf && !L.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function xo(e, t) {
  let r = t;
  return t === "fa" && L.styleDefault !== null && (t = Ot()), new Promise((n, a) => {
    if (r === "fa") {
      const o = Jf(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && na[t] && na[t][e]) {
      const o = na[t][e];
      return n(vo(o));
    }
    Ph(e, t), n(R(R({}, Ah), {}, {
      icon: L.showMissingIcons && e ? St("missingIconAbstract") || {} : {}
    }));
  });
}
const Vs = () => {
}, wo = L.measurePerformance && Ur && Ur.mark && Ur.measure ? Ur : {
  mark: Vs,
  measure: Vs
}, wr = 'FA "6.7.2"', $h = (e) => (wo.mark("".concat(wr, " ").concat(e, " begins")), () => eu(e)), eu = (e) => {
  wo.mark("".concat(wr, " ").concat(e, " ends")), wo.measure("".concat(wr, " ").concat(e), "".concat(wr, " ").concat(e, " begins"), "".concat(wr, " ").concat(e, " ends"));
};
var wi = {
  begin: $h,
  end: eu
};
const rn = () => {
};
function Hs(e) {
  return typeof (e.getAttribute ? e.getAttribute(_t) : null) == "string";
}
function Ch(e) {
  const t = e.getAttribute ? e.getAttribute(pi) : null, r = e.getAttribute ? e.getAttribute(mi) : null;
  return t && r;
}
function Nh(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(L.replacementClass);
}
function jh() {
  return L.autoReplaceSvg === !0 ? nn.replace : nn[L.autoReplaceSvg] || nn.replace;
}
function Th(e) {
  return we.createElementNS("http://www.w3.org/2000/svg", e);
}
function Ih(e) {
  return we.createElement(e);
}
function tu(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: r = e.tag === "svg" ? Th : Ih
  } = t;
  if (typeof e == "string")
    return we.createTextNode(e);
  const n = r(e.tag);
  return Object.keys(e.attributes || []).forEach(function(a) {
    n.setAttribute(a, e.attributes[a]);
  }), (e.children || []).forEach(function(a) {
    n.appendChild(tu(a, {
      ceFn: r
    }));
  }), n;
}
function zh(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const nn = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((r) => {
        t.parentNode.insertBefore(tu(r), t);
      }), t.getAttribute(_t) === null && L.keepOriginalSource) {
        let r = we.createComment(zh(t));
        t.parentNode.replaceChild(r, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], r = e[1];
    if (~bi(t).indexOf(L.replacementClass))
      return nn.replace(e);
    const n = new RegExp("".concat(L.cssPrefix, "-.*"));
    if (delete r[0].attributes.id, r[0].attributes.class) {
      const o = r[0].attributes.class.split(" ").reduce((i, s) => (s === L.replacementClass || s.match(n) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      r[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = r.map((o) => Lr(o)).join(`
`);
    t.setAttribute(_t, ""), t.innerHTML = a;
  }
};
function Bs(e) {
  e();
}
function ru(e, t) {
  const r = typeof t == "function" ? t : rn;
  if (e.length === 0)
    r();
  else {
    let n = Bs;
    L.mutateApproach === _b && (n = kt.requestAnimationFrame || Bs), n(() => {
      const a = jh(), o = wi.begin("mutate");
      e.map(a), o(), r();
    });
  }
}
let ki = !1;
function nu() {
  ki = !0;
}
function ko() {
  ki = !1;
}
let pn = null;
function Xs(e) {
  if (!Ms || !L.observeMutations)
    return;
  const {
    treeCallback: t = rn,
    nodeCallback: r = rn,
    pseudoElementsCallback: n = rn,
    observeMutationsRoot: a = we
  } = e;
  pn = new Ms((o) => {
    if (ki) return;
    const i = Ot();
    lr(o).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Hs(s.addedNodes[0]) && (L.searchPseudoElements && n(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && L.searchPseudoElements && n(s.target.parentNode), s.type === "attributes" && Hs(s.target) && ~qb.indexOf(s.attributeName))
        if (s.attributeName === "class" && Ch(s.target)) {
          const {
            prefix: c,
            iconName: l
          } = Pn(bi(s.target));
          s.target.setAttribute(pi, c || i), l && s.target.setAttribute(mi, l);
        } else Nh(s.target) && r(s.target);
    });
  }), rt && pn.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function Mh() {
  pn && pn.disconnect();
}
function Rh(e) {
  const t = e.getAttribute("style");
  let r = [];
  return t && (r = t.split(";").reduce((n, a) => {
    const o = a.split(":"), i = o[0], s = o.slice(1);
    return i && s.length > 0 && (n[i] = s.join(":").trim()), n;
  }, {})), r;
}
function _h(e) {
  const t = e.getAttribute("data-prefix"), r = e.getAttribute("data-icon"), n = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = Pn(bi(e));
  return a.prefix || (a.prefix = Ot()), t && r && (a.prefix = t, a.iconName = r), a.iconName && a.prefix || (a.prefix && n.length > 0 && (a.iconName = lh(a.prefix, e.innerText) || vi(a.prefix, qf(e.innerText))), !a.iconName && L.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function Fh(e) {
  const t = lr(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), r = e.getAttribute("title"), n = e.getAttribute("data-fa-title-id");
  return L.autoA11y && (r ? t["aria-labelledby"] = "".concat(L.replacementClass, "-title-").concat(n || Tr()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function Lh() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: Le,
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
function Ks(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: r,
    prefix: n,
    rest: a
  } = _h(e), o = Fh(e), i = ho("parseNodeAttributes", {}, e);
  let s = t.styleParser ? Rh(e) : [];
  return R({
    iconName: r,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: n,
    transform: Le,
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
  styles: Dh
} = De;
function au(e) {
  const t = L.autoReplaceSvg === "nest" ? Ks(e, {
    styleParser: !1
  }) : Ks(e);
  return ~t.extra.classes.indexOf(_f) ? St("generateLayersText", e, t) : St("generateSvgReplacementMutation", e, t);
}
function Wh() {
  return [...wb, ...co];
}
function Js(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!rt) return Promise.resolve();
  const r = we.documentElement.classList, n = (f) => r.add("".concat(Fs, "-").concat(f)), a = (f) => r.remove("".concat(Fs, "-").concat(f)), o = L.autoFetchSvg ? Wh() : Nf.concat(Object.keys(Dh));
  o.includes("fa") || o.push("fa");
  const i = [".".concat(_f, ":not([").concat(_t, "])")].concat(o.map((f) => ".".concat(f, ":not([").concat(_t, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = lr(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    n("pending"), a("complete");
  else
    return Promise.resolve();
  const c = wi.begin("onTree"), l = s.reduce((f, u) => {
    try {
      const m = au(u);
      m && f.push(m);
    } catch (m) {
      Mf || m.name === "MissingIcon" && console.error(m);
    }
    return f;
  }, []);
  return new Promise((f, u) => {
    Promise.all(l).then((m) => {
      ru(m, () => {
        n("active"), n("complete"), a("pending"), typeof t == "function" && t(), c(), f();
      });
    }).catch((m) => {
      c(), u(m);
    });
  });
}
function Yh(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  au(e).then((r) => {
    r && ru([r], t);
  });
}
function qh(e) {
  return function(t) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const n = (t || {}).icon ? t : yo(t || {});
    let {
      mask: a
    } = r;
    return a && (a = (a || {}).icon ? a : yo(a || {})), e(n, R(R({}, r), {}, {
      mask: a
    }));
  };
}
const Gh = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: r = Le,
    symbol: n = !1,
    mask: a = null,
    maskId: o = null,
    title: i = null,
    titleId: s = null,
    classes: c = [],
    attributes: l = {},
    styles: f = {}
  } = t;
  if (!e) return;
  const {
    prefix: u,
    iconName: m,
    icon: v
  } = e;
  return $n(R({
    type: "icon"
  }, e), () => (Ft("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), L.autoA11y && (i ? l["aria-labelledby"] = "".concat(L.replacementClass, "-title-").concat(s || Tr()) : (l["aria-hidden"] = "true", l.focusable = "false")), xi({
    icons: {
      main: vo(v),
      mask: a ? vo(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: u,
    iconName: m,
    transform: R(R({}, Le), r),
    symbol: n,
    title: i,
    maskId: o,
    titleId: s,
    extra: {
      attributes: l,
      styles: f,
      classes: c
    }
  })));
};
var Uh = {
  mixout() {
    return {
      icon: qh(Gh)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Js, e.nodeCallback = Yh, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: r = we,
        callback: n = () => {
        }
      } = t;
      return Js(r, n);
    }, e.generateSvgReplacementMutation = function(t, r) {
      const {
        iconName: n,
        title: a,
        titleId: o,
        prefix: i,
        transform: s,
        symbol: c,
        mask: l,
        maskId: f,
        extra: u
      } = r;
      return new Promise((m, v) => {
        Promise.all([xo(n, i), l.iconName ? xo(l.iconName, l.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((w) => {
          let [h, g] = w;
          m([t, xi({
            icons: {
              main: h,
              mask: g
            },
            prefix: i,
            iconName: n,
            transform: s,
            symbol: c,
            maskId: f,
            title: a,
            titleId: o,
            extra: u,
            watchable: !0
          })]);
        }).catch(v);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: r,
        attributes: n,
        main: a,
        transform: o,
        styles: i
      } = t;
      const s = En(i);
      s.length > 0 && (n.style = s);
      let c;
      return hi(o) && (c = St("generateAbstractTransformGrouping", {
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
}, Vh = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: r = []
        } = t;
        return $n({
          type: "layer"
        }, () => {
          Ft("beforeDOMElementCreation", {
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
              class: ["".concat(L.cssPrefix, "-layers"), ...r].join(" ")
            },
            children: n
          }];
        });
      }
    };
  }
}, Hh = {
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
        return $n({
          type: "counter",
          content: e
        }, () => (Ft("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Eh({
          content: e.toString(),
          title: r,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(L.cssPrefix, "-layers-counter"), ...n]
          }
        })));
      }
    };
  }
}, Bh = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: r = Le,
          title: n = null,
          classes: a = [],
          attributes: o = {},
          styles: i = {}
        } = t;
        return $n({
          type: "text",
          content: e
        }, () => (Ft("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Us({
          content: e,
          transform: R(R({}, Le), r),
          title: n,
          extra: {
            attributes: o,
            styles: i,
            classes: ["".concat(L.cssPrefix, "-layers-text"), ...a]
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
      if ($f) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), l = t.getBoundingClientRect();
        i = l.width / c, s = l.height / c;
      }
      return L.autoA11y && !n && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, Us({
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
const Xh = new RegExp('"', "ug"), Zs = [1105920, 1112319], Qs = R(R(R(R({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), yb), Mb), $b), Oo = Object.keys(Qs).reduce((e, t) => (e[t.toLowerCase()] = Qs[t], e), {}), Kh = Object.keys(Oo).reduce((e, t) => {
  const r = Oo[t];
  return e[t] = r[900] || [...Object.entries(r)][0][1], e;
}, {});
function Jh(e) {
  const t = e.replace(Xh, ""), r = nh(t, 0), n = r >= Zs[0] && r <= Zs[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: qf(a ? t[0] : t),
    isSecondary: n || a
  };
}
function Zh(e, t) {
  const r = e.replace(/^['"]|['"]$/g, "").toLowerCase(), n = parseInt(t), a = isNaN(n) ? "normal" : n;
  return (Oo[r] || {})[a] || Kh[r];
}
function el(e, t) {
  const r = "".concat(Rb).concat(t.replace(":", "-"));
  return new Promise((n, a) => {
    if (e.getAttribute(r) !== null)
      return n();
    const o = lr(e.children).filter((u) => u.getAttribute(uo) === t)[0], i = kt.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), c = s.match(Wb), l = i.getPropertyValue("font-weight"), f = i.getPropertyValue("content");
    if (o && !c)
      return e.removeChild(o), n();
    if (c && f !== "none" && f !== "") {
      const u = i.getPropertyValue("content");
      let m = Zh(s, l);
      const {
        value: v,
        isSecondary: w
      } = Jh(u), h = c[0].startsWith("FontAwesome");
      let g = vi(m, v), x = g;
      if (h) {
        const k = ch(v);
        k.iconName && k.prefix && (g = k.iconName, m = k.prefix);
      }
      if (g && !w && (!o || o.getAttribute(pi) !== m || o.getAttribute(mi) !== x)) {
        e.setAttribute(r, x), o && e.removeChild(o);
        const k = Lh(), {
          extra: S
        } = k;
        S.attributes[uo] = t, xo(g, m).then((O) => {
          const p = xi(R(R({}, k), {}, {
            icons: {
              main: O,
              mask: Zf()
            },
            prefix: m,
            iconName: x,
            extra: S,
            watchable: !0
          })), Y = we.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(Y, e.firstChild) : e.appendChild(Y), Y.outerHTML = p.map((V) => Lr(V)).join(`
`), e.removeAttribute(r), n();
        }).catch(a);
      } else
        n();
    } else
      n();
  });
}
function Qh(e) {
  return Promise.all([el(e, "::before"), el(e, "::after")]);
}
function ey(e) {
  return e.parentNode !== document.head && !~Fb.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(uo) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function tl(e) {
  if (rt)
    return new Promise((t, r) => {
      const n = lr(e.querySelectorAll("*")).filter(ey).map(Qh), a = wi.begin("searchPseudoElements");
      nu(), Promise.all(n).then(() => {
        a(), ko(), t();
      }).catch(() => {
        a(), ko(), r();
      });
    });
}
var ty = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = tl, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: r = we
      } = t;
      L.searchPseudoElements && tl(r);
    };
  }
};
let rl = !1;
var ry = {
  mixout() {
    return {
      dom: {
        unwatch() {
          nu(), rl = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Xs(ho("mutationObserverCallbacks", {}));
      },
      noAuto() {
        Mh();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        rl ? ko() : Xs(ho("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const nl = (e) => {
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
var ny = {
  mixout() {
    return {
      parse: {
        transform: (e) => nl(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-transform");
        return r && (e.transform = nl(r)), e;
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
      }, s = "translate(".concat(n.x * 32, ", ").concat(n.y * 32, ") "), c = "scale(".concat(n.size / 16 * (n.flipX ? -1 : 1), ", ").concat(n.size / 16 * (n.flipY ? -1 : 1), ") "), l = "rotate(".concat(n.rotate, " 0 0)"), f = {
        transform: "".concat(s, " ").concat(c, " ").concat(l)
      }, u = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, m = {
        outer: i,
        inner: f,
        path: u
      };
      return {
        tag: "g",
        attributes: R({}, m.outer),
        children: [{
          tag: "g",
          attributes: R({}, m.inner),
          children: [{
            tag: r.icon.tag,
            children: r.icon.children,
            attributes: R(R({}, r.icon.attributes), m.path)
          }]
        }]
      };
    };
  }
};
const aa = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function al(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function ay(e) {
  return e.tag === "g" ? e.children : [e];
}
var oy = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-mask"), n = r ? Pn(r.split(" ").map((a) => a.trim())) : Zf();
        return n.prefix || (n.prefix = Ot()), e.mask = n, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        icon: l
      } = a, {
        width: f,
        icon: u
      } = o, m = Jb({
        transform: s,
        containerWidth: f,
        iconWidth: c
      }), v = {
        tag: "rect",
        attributes: R(R({}, aa), {}, {
          fill: "white"
        })
      }, w = l.children ? {
        children: l.children.map(al)
      } : {}, h = {
        tag: "g",
        attributes: R({}, m.inner),
        children: [al(R({
          tag: l.tag,
          attributes: R(R({}, l.attributes), m.path)
        }, w))]
      }, g = {
        tag: "g",
        attributes: R({}, m.outer),
        children: [h]
      }, x = "mask-".concat(i || Tr()), k = "clip-".concat(i || Tr()), S = {
        tag: "mask",
        attributes: R(R({}, aa), {}, {
          id: x,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [v, g]
      }, O = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: k
          },
          children: ay(u)
        }, S]
      };
      return r.push(O, {
        tag: "rect",
        attributes: R({
          fill: "currentColor",
          "clip-path": "url(#".concat(k, ")"),
          mask: "url(#".concat(x, ")")
        }, aa)
      }), {
        children: r,
        attributes: n
      };
    };
  }
}, iy = {
  provides(e) {
    let t = !1;
    kt.matchMedia && (t = kt.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const r = [], n = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      r.push({
        tag: "path",
        attributes: R(R({}, n), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = R(R({}, a), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: R(R({}, n), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: R(R({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: R(R({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), r.push(i), r.push({
        tag: "path",
        attributes: R(R({}, n), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: R(R({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || r.push({
        tag: "path",
        attributes: R(R({}, n), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: R(R({}, o), {}, {
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
}, sy = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-symbol"), n = r === null ? !1 : r === "" ? !0 : r;
        return e.symbol = n, e;
      }
    };
  }
}, ly = [eh, Uh, Vh, Hh, Bh, ty, ry, ny, oy, iy, sy];
yh(ly, {
  mixoutsTo: je
});
je.noAuto;
je.config;
je.library;
je.dom;
const So = je.parse;
je.findIconDefinition;
je.toHtml;
const cy = je.icon;
je.layer;
je.text;
je.counter;
function fy(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Hr = { exports: {} }, oa = { exports: {} }, fe = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ol;
function uy() {
  if (ol) return fe;
  ol = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, u = e ? Symbol.for("react.suspense") : 60113, m = e ? Symbol.for("react.suspense_list") : 60120, v = e ? Symbol.for("react.memo") : 60115, w = e ? Symbol.for("react.lazy") : 60116, h = e ? Symbol.for("react.block") : 60121, g = e ? Symbol.for("react.fundamental") : 60117, x = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
  function S(p) {
    if (typeof p == "object" && p !== null) {
      var Y = p.$$typeof;
      switch (Y) {
        case t:
          switch (p = p.type, p) {
            case c:
            case l:
            case n:
            case o:
            case a:
            case u:
              return p;
            default:
              switch (p = p && p.$$typeof, p) {
                case s:
                case f:
                case w:
                case v:
                case i:
                  return p;
                default:
                  return Y;
              }
          }
        case r:
          return Y;
      }
    }
  }
  function O(p) {
    return S(p) === l;
  }
  return fe.AsyncMode = c, fe.ConcurrentMode = l, fe.ContextConsumer = s, fe.ContextProvider = i, fe.Element = t, fe.ForwardRef = f, fe.Fragment = n, fe.Lazy = w, fe.Memo = v, fe.Portal = r, fe.Profiler = o, fe.StrictMode = a, fe.Suspense = u, fe.isAsyncMode = function(p) {
    return O(p) || S(p) === c;
  }, fe.isConcurrentMode = O, fe.isContextConsumer = function(p) {
    return S(p) === s;
  }, fe.isContextProvider = function(p) {
    return S(p) === i;
  }, fe.isElement = function(p) {
    return typeof p == "object" && p !== null && p.$$typeof === t;
  }, fe.isForwardRef = function(p) {
    return S(p) === f;
  }, fe.isFragment = function(p) {
    return S(p) === n;
  }, fe.isLazy = function(p) {
    return S(p) === w;
  }, fe.isMemo = function(p) {
    return S(p) === v;
  }, fe.isPortal = function(p) {
    return S(p) === r;
  }, fe.isProfiler = function(p) {
    return S(p) === o;
  }, fe.isStrictMode = function(p) {
    return S(p) === a;
  }, fe.isSuspense = function(p) {
    return S(p) === u;
  }, fe.isValidElementType = function(p) {
    return typeof p == "string" || typeof p == "function" || p === n || p === l || p === o || p === a || p === u || p === m || typeof p == "object" && p !== null && (p.$$typeof === w || p.$$typeof === v || p.$$typeof === i || p.$$typeof === s || p.$$typeof === f || p.$$typeof === g || p.$$typeof === x || p.$$typeof === k || p.$$typeof === h);
  }, fe.typeOf = S, fe;
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
var il;
function dy() {
  return il || (il = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, u = e ? Symbol.for("react.suspense") : 60113, m = e ? Symbol.for("react.suspense_list") : 60120, v = e ? Symbol.for("react.memo") : 60115, w = e ? Symbol.for("react.lazy") : 60116, h = e ? Symbol.for("react.block") : 60121, g = e ? Symbol.for("react.fundamental") : 60117, x = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
    function S(y) {
      return typeof y == "string" || typeof y == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      y === n || y === l || y === o || y === a || y === u || y === m || typeof y == "object" && y !== null && (y.$$typeof === w || y.$$typeof === v || y.$$typeof === i || y.$$typeof === s || y.$$typeof === f || y.$$typeof === g || y.$$typeof === x || y.$$typeof === k || y.$$typeof === h);
    }
    function O(y) {
      if (typeof y == "object" && y !== null) {
        var ge = y.$$typeof;
        switch (ge) {
          case t:
            var $e = y.type;
            switch ($e) {
              case c:
              case l:
              case n:
              case o:
              case a:
              case u:
                return $e;
              default:
                var at = $e && $e.$$typeof;
                switch (at) {
                  case s:
                  case f:
                  case w:
                  case v:
                  case i:
                    return at;
                  default:
                    return ge;
                }
            }
          case r:
            return ge;
        }
      }
    }
    var p = c, Y = l, V = s, oe = i, ie = t, J = f, ne = n, P = w, U = v, q = r, se = o, W = a, Q = u, ae = !1;
    function Z(y) {
      return ae || (ae = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), d(y) || O(y) === c;
    }
    function d(y) {
      return O(y) === l;
    }
    function b(y) {
      return O(y) === s;
    }
    function N(y) {
      return O(y) === i;
    }
    function A(y) {
      return typeof y == "object" && y !== null && y.$$typeof === t;
    }
    function E(y) {
      return O(y) === f;
    }
    function j(y) {
      return O(y) === n;
    }
    function $(y) {
      return O(y) === w;
    }
    function C(y) {
      return O(y) === v;
    }
    function T(y) {
      return O(y) === r;
    }
    function z(y) {
      return O(y) === o;
    }
    function I(y) {
      return O(y) === a;
    }
    function G(y) {
      return O(y) === u;
    }
    me.AsyncMode = p, me.ConcurrentMode = Y, me.ContextConsumer = V, me.ContextProvider = oe, me.Element = ie, me.ForwardRef = J, me.Fragment = ne, me.Lazy = P, me.Memo = U, me.Portal = q, me.Profiler = se, me.StrictMode = W, me.Suspense = Q, me.isAsyncMode = Z, me.isConcurrentMode = d, me.isContextConsumer = b, me.isContextProvider = N, me.isElement = A, me.isForwardRef = E, me.isFragment = j, me.isLazy = $, me.isMemo = C, me.isPortal = T, me.isProfiler = z, me.isStrictMode = I, me.isSuspense = G, me.isValidElementType = S, me.typeOf = O;
  }()), me;
}
var sl;
function ou() {
  return sl || (sl = 1, process.env.NODE_ENV === "production" ? oa.exports = uy() : oa.exports = dy()), oa.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var ia, ll;
function py() {
  if (ll) return ia;
  ll = 1;
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
      var c = Object.getOwnPropertyNames(i).map(function(f) {
        return i[f];
      });
      if (c.join("") !== "0123456789")
        return !1;
      var l = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(f) {
        l[f] = f;
      }), Object.keys(Object.assign({}, l)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return ia = a() ? Object.assign : function(o, i) {
    for (var s, c = n(o), l, f = 1; f < arguments.length; f++) {
      s = Object(arguments[f]);
      for (var u in s)
        t.call(s, u) && (c[u] = s[u]);
      if (e) {
        l = e(s);
        for (var m = 0; m < l.length; m++)
          r.call(s, l[m]) && (c[l[m]] = s[l[m]]);
      }
    }
    return c;
  }, ia;
}
var sa, cl;
function Oi() {
  if (cl) return sa;
  cl = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return sa = e, sa;
}
var fl, ul;
function iu() {
  return ul || (ul = 1, fl = Function.call.bind(Object.prototype.hasOwnProperty)), fl;
}
var la, dl;
function my() {
  if (dl) return la;
  dl = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ Oi(), r = {}, n = /* @__PURE__ */ iu();
    e = function(o) {
      var i = "Warning: " + o;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function a(o, i, s, c, l) {
    if (process.env.NODE_ENV !== "production") {
      for (var f in o)
        if (n(o, f)) {
          var u;
          try {
            if (typeof o[f] != "function") {
              var m = Error(
                (c || "React class") + ": " + s + " type `" + f + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[f] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw m.name = "Invariant Violation", m;
            }
            u = o[f](i, f, c, s, null, t);
          } catch (w) {
            u = w;
          }
          if (u && !(u instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + f + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof u + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), u instanceof Error && !(u.message in r)) {
            r[u.message] = !0;
            var v = l ? l() : "";
            e(
              "Failed " + s + " type: " + u.message + (v ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (r = {});
  }, la = a, la;
}
var ca, pl;
function gy() {
  if (pl) return ca;
  pl = 1;
  var e = ou(), t = py(), r = /* @__PURE__ */ Oi(), n = /* @__PURE__ */ iu(), a = /* @__PURE__ */ my(), o = function() {
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
  return ca = function(s, c) {
    var l = typeof Symbol == "function" && Symbol.iterator, f = "@@iterator";
    function u(d) {
      var b = d && (l && d[l] || d[f]);
      if (typeof b == "function")
        return b;
    }
    var m = "<<anonymous>>", v = {
      array: x("array"),
      bigint: x("bigint"),
      bool: x("boolean"),
      func: x("function"),
      number: x("number"),
      object: x("object"),
      string: x("string"),
      symbol: x("symbol"),
      any: k(),
      arrayOf: S,
      element: O(),
      elementType: p(),
      instanceOf: Y,
      node: J(),
      objectOf: oe,
      oneOf: V,
      oneOfType: ie,
      shape: P,
      exact: U
    };
    function w(d, b) {
      return d === b ? d !== 0 || 1 / d === 1 / b : d !== d && b !== b;
    }
    function h(d, b) {
      this.message = d, this.data = b && typeof b == "object" ? b : {}, this.stack = "";
    }
    h.prototype = Error.prototype;
    function g(d) {
      if (process.env.NODE_ENV !== "production")
        var b = {}, N = 0;
      function A(j, $, C, T, z, I, G) {
        if (T = T || m, I = I || C, G !== r) {
          if (c) {
            var y = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw y.name = "Invariant Violation", y;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ge = T + ":" + C;
            !b[ge] && // Avoid spamming the console because they are often not actionable except for lib authors
            N < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + I + "` prop on `" + T + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), b[ge] = !0, N++);
          }
        }
        return $[C] == null ? j ? $[C] === null ? new h("The " + z + " `" + I + "` is marked as required " + ("in `" + T + "`, but its value is `null`.")) : new h("The " + z + " `" + I + "` is marked as required in " + ("`" + T + "`, but its value is `undefined`.")) : null : d($, C, T, z, I);
      }
      var E = A.bind(null, !1);
      return E.isRequired = A.bind(null, !0), E;
    }
    function x(d) {
      function b(N, A, E, j, $, C) {
        var T = N[A], z = W(T);
        if (z !== d) {
          var I = Q(T);
          return new h(
            "Invalid " + j + " `" + $ + "` of type " + ("`" + I + "` supplied to `" + E + "`, expected ") + ("`" + d + "`."),
            { expectedType: d }
          );
        }
        return null;
      }
      return g(b);
    }
    function k() {
      return g(i);
    }
    function S(d) {
      function b(N, A, E, j, $) {
        if (typeof d != "function")
          return new h("Property `" + $ + "` of component `" + E + "` has invalid PropType notation inside arrayOf.");
        var C = N[A];
        if (!Array.isArray(C)) {
          var T = W(C);
          return new h("Invalid " + j + " `" + $ + "` of type " + ("`" + T + "` supplied to `" + E + "`, expected an array."));
        }
        for (var z = 0; z < C.length; z++) {
          var I = d(C, z, E, j, $ + "[" + z + "]", r);
          if (I instanceof Error)
            return I;
        }
        return null;
      }
      return g(b);
    }
    function O() {
      function d(b, N, A, E, j) {
        var $ = b[N];
        if (!s($)) {
          var C = W($);
          return new h("Invalid " + E + " `" + j + "` of type " + ("`" + C + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return g(d);
    }
    function p() {
      function d(b, N, A, E, j) {
        var $ = b[N];
        if (!e.isValidElementType($)) {
          var C = W($);
          return new h("Invalid " + E + " `" + j + "` of type " + ("`" + C + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return g(d);
    }
    function Y(d) {
      function b(N, A, E, j, $) {
        if (!(N[A] instanceof d)) {
          var C = d.name || m, T = Z(N[A]);
          return new h("Invalid " + j + " `" + $ + "` of type " + ("`" + T + "` supplied to `" + E + "`, expected ") + ("instance of `" + C + "`."));
        }
        return null;
      }
      return g(b);
    }
    function V(d) {
      if (!Array.isArray(d))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), i;
      function b(N, A, E, j, $) {
        for (var C = N[A], T = 0; T < d.length; T++)
          if (w(C, d[T]))
            return null;
        var z = JSON.stringify(d, function(I, G) {
          var y = Q(G);
          return y === "symbol" ? String(G) : G;
        });
        return new h("Invalid " + j + " `" + $ + "` of value `" + String(C) + "` " + ("supplied to `" + E + "`, expected one of " + z + "."));
      }
      return g(b);
    }
    function oe(d) {
      function b(N, A, E, j, $) {
        if (typeof d != "function")
          return new h("Property `" + $ + "` of component `" + E + "` has invalid PropType notation inside objectOf.");
        var C = N[A], T = W(C);
        if (T !== "object")
          return new h("Invalid " + j + " `" + $ + "` of type " + ("`" + T + "` supplied to `" + E + "`, expected an object."));
        for (var z in C)
          if (n(C, z)) {
            var I = d(C, z, E, j, $ + "." + z, r);
            if (I instanceof Error)
              return I;
          }
        return null;
      }
      return g(b);
    }
    function ie(d) {
      if (!Array.isArray(d))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var b = 0; b < d.length; b++) {
        var N = d[b];
        if (typeof N != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + ae(N) + " at index " + b + "."
          ), i;
      }
      function A(E, j, $, C, T) {
        for (var z = [], I = 0; I < d.length; I++) {
          var G = d[I], y = G(E, j, $, C, T, r);
          if (y == null)
            return null;
          y.data && n(y.data, "expectedType") && z.push(y.data.expectedType);
        }
        var ge = z.length > 0 ? ", expected one of type [" + z.join(", ") + "]" : "";
        return new h("Invalid " + C + " `" + T + "` supplied to " + ("`" + $ + "`" + ge + "."));
      }
      return g(A);
    }
    function J() {
      function d(b, N, A, E, j) {
        return q(b[N]) ? null : new h("Invalid " + E + " `" + j + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return g(d);
    }
    function ne(d, b, N, A, E) {
      return new h(
        (d || "React class") + ": " + b + " type `" + N + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + E + "`."
      );
    }
    function P(d) {
      function b(N, A, E, j, $) {
        var C = N[A], T = W(C);
        if (T !== "object")
          return new h("Invalid " + j + " `" + $ + "` of type `" + T + "` " + ("supplied to `" + E + "`, expected `object`."));
        for (var z in d) {
          var I = d[z];
          if (typeof I != "function")
            return ne(E, j, $, z, Q(I));
          var G = I(C, z, E, j, $ + "." + z, r);
          if (G)
            return G;
        }
        return null;
      }
      return g(b);
    }
    function U(d) {
      function b(N, A, E, j, $) {
        var C = N[A], T = W(C);
        if (T !== "object")
          return new h("Invalid " + j + " `" + $ + "` of type `" + T + "` " + ("supplied to `" + E + "`, expected `object`."));
        var z = t({}, N[A], d);
        for (var I in z) {
          var G = d[I];
          if (n(d, I) && typeof G != "function")
            return ne(E, j, $, I, Q(G));
          if (!G)
            return new h(
              "Invalid " + j + " `" + $ + "` key `" + I + "` supplied to `" + E + "`.\nBad object: " + JSON.stringify(N[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(d), null, "  ")
            );
          var y = G(C, I, E, j, $ + "." + I, r);
          if (y)
            return y;
        }
        return null;
      }
      return g(b);
    }
    function q(d) {
      switch (typeof d) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !d;
        case "object":
          if (Array.isArray(d))
            return d.every(q);
          if (d === null || s(d))
            return !0;
          var b = u(d);
          if (b) {
            var N = b.call(d), A;
            if (b !== d.entries) {
              for (; !(A = N.next()).done; )
                if (!q(A.value))
                  return !1;
            } else
              for (; !(A = N.next()).done; ) {
                var E = A.value;
                if (E && !q(E[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function se(d, b) {
      return d === "symbol" ? !0 : b ? b["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && b instanceof Symbol : !1;
    }
    function W(d) {
      var b = typeof d;
      return Array.isArray(d) ? "array" : d instanceof RegExp ? "object" : se(b, d) ? "symbol" : b;
    }
    function Q(d) {
      if (typeof d > "u" || d === null)
        return "" + d;
      var b = W(d);
      if (b === "object") {
        if (d instanceof Date)
          return "date";
        if (d instanceof RegExp)
          return "regexp";
      }
      return b;
    }
    function ae(d) {
      var b = Q(d);
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
    function Z(d) {
      return !d.constructor || !d.constructor.name ? m : d.constructor.name;
    }
    return v.checkPropTypes = a, v.resetWarningCache = a.resetWarningCache, v.PropTypes = v, v;
  }, ca;
}
var fa, ml;
function by() {
  if (ml) return fa;
  ml = 1;
  var e = /* @__PURE__ */ Oi();
  function t() {
  }
  function r() {
  }
  return r.resetWarningCache = t, fa = function() {
    function n(i, s, c, l, f, u) {
      if (u !== e) {
        var m = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw m.name = "Invariant Violation", m;
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
  }, fa;
}
var gl;
function hy() {
  if (gl) return Hr.exports;
  if (gl = 1, process.env.NODE_ENV !== "production") {
    var e = ou(), t = !0;
    Hr.exports = /* @__PURE__ */ gy()(e.isElement, t);
  } else
    Hr.exports = /* @__PURE__ */ by()();
  return Hr.exports;
}
var yy = /* @__PURE__ */ hy();
const te = /* @__PURE__ */ fy(yy);
function bl(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function Me(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? bl(Object(r), !0).forEach(function(n) {
      Vt(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : bl(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function mn(e) {
  "@babel/helpers - typeof";
  return mn = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, mn(e);
}
function Vt(e, t, r) {
  return t in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function vy(e, t) {
  if (e == null) return {};
  var r = {}, n = Object.keys(e), a, o;
  for (o = 0; o < n.length; o++)
    a = n[o], !(t.indexOf(a) >= 0) && (r[a] = e[a]);
  return r;
}
function xy(e, t) {
  if (e == null) return {};
  var r = vy(e, t), n, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      n = o[a], !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n]);
  }
  return r;
}
function Eo(e) {
  return wy(e) || ky(e) || Oy(e) || Sy();
}
function wy(e) {
  if (Array.isArray(e)) return Ao(e);
}
function ky(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Oy(e, t) {
  if (e) {
    if (typeof e == "string") return Ao(e, t);
    var r = Object.prototype.toString.call(e).slice(8, -1);
    if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return Ao(e, t);
  }
}
function Ao(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
  return n;
}
function Sy() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Ey(e) {
  var t, r = e.beat, n = e.fade, a = e.beatFade, o = e.bounce, i = e.shake, s = e.flash, c = e.spin, l = e.spinPulse, f = e.spinReverse, u = e.pulse, m = e.fixedWidth, v = e.inverse, w = e.border, h = e.listItem, g = e.flip, x = e.size, k = e.rotation, S = e.pull, O = (t = {
    "fa-beat": r,
    "fa-fade": n,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": f,
    "fa-spin-pulse": l,
    "fa-pulse": u,
    "fa-fw": m,
    "fa-inverse": v,
    "fa-border": w,
    "fa-li": h,
    "fa-flip": g === !0,
    "fa-flip-horizontal": g === "horizontal" || g === "both",
    "fa-flip-vertical": g === "vertical" || g === "both"
  }, Vt(t, "fa-".concat(x), typeof x < "u" && x !== null), Vt(t, "fa-rotate-".concat(k), typeof k < "u" && k !== null && k !== 0), Vt(t, "fa-pull-".concat(S), typeof S < "u" && S !== null), Vt(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(O).map(function(p) {
    return O[p] ? p : null;
  }).filter(function(p) {
    return p;
  });
}
function Ay(e) {
  return e = e - 0, e === e;
}
function su(e) {
  return Ay(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, r) {
    return r ? r.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var Py = ["style"];
function $y(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function Cy(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, r) {
    var n = r.indexOf(":"), a = su(r.slice(0, n)), o = r.slice(n + 1).trim();
    return a.startsWith("webkit") ? t[$y(a)] = o : t[a] = o, t;
  }, {});
}
function lu(e, t) {
  var r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var n = (t.children || []).map(function(c) {
    return lu(e, c);
  }), a = Object.keys(t.attributes || {}).reduce(function(c, l) {
    var f = t.attributes[l];
    switch (l) {
      case "class":
        c.attrs.className = f, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = Cy(f);
        break;
      default:
        l.indexOf("aria-") === 0 || l.indexOf("data-") === 0 ? c.attrs[l.toLowerCase()] = f : c.attrs[su(l)] = f;
    }
    return c;
  }, {
    attrs: {}
  }), o = r.style, i = o === void 0 ? {} : o, s = xy(r, Py);
  return a.attrs.style = Me(Me({}, a.attrs.style), i), e.apply(void 0, [t.tag, Me(Me({}, a.attrs), s)].concat(Eo(n)));
}
var cu = !1;
try {
  cu = process.env.NODE_ENV === "production";
} catch {
}
function Ny() {
  if (!cu && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function hl(e) {
  if (e && mn(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (So.icon)
    return So.icon(e);
  if (e === null)
    return null;
  if (e && mn(e) === "object" && e.prefix && e.iconName)
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
function ua(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Vt({}, e, t) : {};
}
var yl = {
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
}, Ce = /* @__PURE__ */ Oe.forwardRef(function(e, t) {
  var r = Me(Me({}, yl), e), n = r.icon, a = r.mask, o = r.symbol, i = r.className, s = r.title, c = r.titleId, l = r.maskId, f = hl(n), u = ua("classes", [].concat(Eo(Ey(r)), Eo((i || "").split(" ")))), m = ua("transform", typeof r.transform == "string" ? So.transform(r.transform) : r.transform), v = ua("mask", hl(a)), w = cy(f, Me(Me(Me(Me({}, u), m), v), {}, {
    symbol: o,
    title: s,
    titleId: c,
    maskId: l
  }));
  if (!w)
    return Ny("Could not find icon", f), null;
  var h = w.abstract, g = {
    ref: t
  };
  return Object.keys(r).forEach(function(x) {
    yl.hasOwnProperty(x) || (g[x] = r[x]);
  }), jy(h[0], g);
});
Ce.displayName = "FontAwesomeIcon";
Ce.propTypes = {
  beat: te.bool,
  border: te.bool,
  beatFade: te.bool,
  bounce: te.bool,
  className: te.string,
  fade: te.bool,
  flash: te.bool,
  mask: te.oneOfType([te.object, te.array, te.string]),
  maskId: te.string,
  fixedWidth: te.bool,
  inverse: te.bool,
  flip: te.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: te.oneOfType([te.object, te.array, te.string]),
  listItem: te.bool,
  pull: te.oneOf(["right", "left"]),
  pulse: te.bool,
  rotation: te.oneOf([0, 90, 180, 270]),
  shake: te.bool,
  size: te.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: te.bool,
  spinPulse: te.bool,
  spinReverse: te.bool,
  symbol: te.oneOfType([te.bool, te.string]),
  title: te.string,
  titleId: te.string,
  transform: te.oneOfType([te.string, te.object]),
  swapOpacity: te.bool
};
var jy = lu.bind(null, Oe.createElement);
const Si = "-", Ty = (e) => {
  const t = zy(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (a) => {
      const o = a.split(Si);
      return o[0] === "" && o.length !== 1 && o.shift(), fu(o, t) || Iy(a);
    },
    getConflictingClassGroupIds: (a, o) => {
      const i = r[a] || [];
      return o && n[a] ? [...i, ...n[a]] : i;
    }
  };
}, fu = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], a = t.nextPart.get(n), o = a ? fu(e.slice(1), a) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const i = e.join(Si);
  return (r = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : r.classGroupId;
}, vl = /^\[(.+)\]$/, Iy = (e) => {
  if (vl.test(e)) {
    const t = vl.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, zy = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return Ry(Object.entries(e.classGroups), r).forEach(([a, o]) => {
    Po(o, n, a, t);
  }), n;
}, Po = (e, t, r, n) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : xl(t, a);
      o.classGroupId = r;
      return;
    }
    if (typeof a == "function") {
      if (My(a)) {
        Po(a(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: r
      });
      return;
    }
    Object.entries(a).forEach(([o, i]) => {
      Po(i, xl(t, o), r, n);
    });
  });
}, xl = (e, t) => {
  let r = e;
  return t.split(Si).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, My = (e) => e.isThemeGetter, Ry = (e, t) => t ? e.map(([r, n]) => {
  const a = n.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([i, s]) => [t + i, s])) : o);
  return [r, a];
}) : e, _y = (e) => {
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
}, uu = "!", Fy = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, a = t[0], o = t.length, i = (s) => {
    const c = [];
    let l = 0, f = 0, u;
    for (let g = 0; g < s.length; g++) {
      let x = s[g];
      if (l === 0) {
        if (x === a && (n || s.slice(g, g + o) === t)) {
          c.push(s.slice(f, g)), f = g + o;
          continue;
        }
        if (x === "/") {
          u = g;
          continue;
        }
      }
      x === "[" ? l++ : x === "]" && l--;
    }
    const m = c.length === 0 ? s : s.substring(f), v = m.startsWith(uu), w = v ? m.substring(1) : m, h = u && u > f ? u - f : void 0;
    return {
      modifiers: c,
      hasImportantModifier: v,
      baseClassName: w,
      maybePostfixModifierPosition: h
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, Ly = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, Dy = (e) => ({
  cache: _y(e.cacheSize),
  parseClassName: Fy(e),
  ...Ty(e)
}), Wy = /\s+/, Yy = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: a
  } = t, o = [], i = e.trim().split(Wy);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: f,
      hasImportantModifier: u,
      baseClassName: m,
      maybePostfixModifierPosition: v
    } = r(l);
    let w = !!v, h = n(w ? m.substring(0, v) : m);
    if (!h) {
      if (!w) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (h = n(m), !h) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      w = !1;
    }
    const g = Ly(f).join(":"), x = u ? g + uu : g, k = x + h;
    if (o.includes(k))
      continue;
    o.push(k);
    const S = a(h, w);
    for (let O = 0; O < S.length; ++O) {
      const p = S[O];
      o.push(x + p);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function qy() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = du(t)) && (n && (n += " "), n += r);
  return n;
}
const du = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = du(e[n])) && (r && (r += " "), r += t);
  return r;
};
function Gy(e, ...t) {
  let r, n, a, o = i;
  function i(c) {
    const l = t.reduce((f, u) => u(f), e());
    return r = Dy(l), n = r.cache.get, a = r.cache.set, o = s, s(c);
  }
  function s(c) {
    const l = n(c);
    if (l)
      return l;
    const f = Yy(c, r);
    return a(c, f), f;
  }
  return function() {
    return o(qy.apply(null, arguments));
  };
}
const ye = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, pu = /^\[(?:([a-z-]+):)?(.+)\]$/i, Uy = /^\d+\/\d+$/, Vy = /* @__PURE__ */ new Set(["px", "full", "screen"]), Hy = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, By = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Xy = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Ky = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Jy = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Ve = (e) => Qt(e) || Vy.has(e) || Uy.test(e), ut = (e) => cr(e, "length", ov), Qt = (e) => !!e && !Number.isNaN(Number(e)), da = (e) => cr(e, "number", Qt), br = (e) => !!e && Number.isInteger(Number(e)), Zy = (e) => e.endsWith("%") && Qt(e.slice(0, -1)), X = (e) => pu.test(e), dt = (e) => Hy.test(e), Qy = /* @__PURE__ */ new Set(["length", "size", "percentage"]), ev = (e) => cr(e, Qy, mu), tv = (e) => cr(e, "position", mu), rv = /* @__PURE__ */ new Set(["image", "url"]), nv = (e) => cr(e, rv, sv), av = (e) => cr(e, "", iv), hr = () => !0, cr = (e, t, r) => {
  const n = pu.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, ov = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  By.test(e) && !Xy.test(e)
), mu = () => !1, iv = (e) => Ky.test(e), sv = (e) => Jy.test(e), lv = () => {
  const e = ye("colors"), t = ye("spacing"), r = ye("blur"), n = ye("brightness"), a = ye("borderColor"), o = ye("borderRadius"), i = ye("borderSpacing"), s = ye("borderWidth"), c = ye("contrast"), l = ye("grayscale"), f = ye("hueRotate"), u = ye("invert"), m = ye("gap"), v = ye("gradientColorStops"), w = ye("gradientColorStopPositions"), h = ye("inset"), g = ye("margin"), x = ye("opacity"), k = ye("padding"), S = ye("saturate"), O = ye("scale"), p = ye("sepia"), Y = ye("skew"), V = ye("space"), oe = ye("translate"), ie = () => ["auto", "contain", "none"], J = () => ["auto", "hidden", "clip", "visible", "scroll"], ne = () => ["auto", X, t], P = () => [X, t], U = () => ["", Ve, ut], q = () => ["auto", Qt, X], se = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], W = () => ["solid", "dashed", "dotted", "double", "none"], Q = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], ae = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], Z = () => ["", "0", X], d = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], b = () => [Qt, X];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [hr],
      spacing: [Ve, ut],
      blur: ["none", "", dt, X],
      brightness: b(),
      borderColor: [e],
      borderRadius: ["none", "", "full", dt, X],
      borderSpacing: P(),
      borderWidth: U(),
      contrast: b(),
      grayscale: Z(),
      hueRotate: b(),
      invert: Z(),
      gap: P(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Zy, ut],
      inset: ne(),
      margin: ne(),
      opacity: b(),
      padding: P(),
      saturate: b(),
      scale: b(),
      sepia: Z(),
      skew: b(),
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
        aspect: ["auto", "square", "video", X]
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
        columns: [dt]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": d()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": d()
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
        object: [...se(), X]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: J()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": J()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": J()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: ie()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": ie()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": ie()
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
        inset: [h]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [h]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [h]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [h]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [h]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [h]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [h]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [h]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [h]
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
        z: ["auto", br, X]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ne()
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
        flex: ["1", "auto", "initial", "none", X]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: Z()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: Z()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", br, X]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [hr]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", br, X]
        }, X]
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
        "grid-rows": [hr]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [br, X]
        }, X]
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
        "auto-cols": ["auto", "min", "max", "fr", X]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", X]
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
        justify: ["normal", ...ae()]
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
        content: ["normal", ...ae(), "baseline"]
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
        "place-content": [...ae(), "baseline"]
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
        p: [k]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [k]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [k]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [k]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [k]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [k]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [k]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [k]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [k]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [g]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [g]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [g]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [g]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [g]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [g]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [g]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [g]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [g]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [V]
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
        "space-y": [V]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", X, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [X, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [X, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [dt]
        }, dt]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [X, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [X, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [X, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [X, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", dt, ut]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", da]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [hr]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", X]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Qt, da]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Ve, X]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", X]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", X]
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
        decoration: [...W(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", Ve, ut]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Ve, X]
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
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", X]
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
        content: ["none", X]
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
        bg: [...se(), tv]
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
        bg: ["auto", "cover", "contain", ev]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, nv]
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
        from: [w]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [w]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [w]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [v]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [v]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [v]
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
        "border-opacity": [x]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...W(), "hidden"]
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
        divide: W()
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
        outline: ["", ...W()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Ve, X]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Ve, ut]
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
        ring: U()
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
        "ring-offset": [Ve, ut]
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
        shadow: ["", "inner", "none", dt, av]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [hr]
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
        "mix-blend": [...Q(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": Q()
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
        "drop-shadow": ["", "none", dt, X]
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
        "hue-rotate": [f]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [u]
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
        "backdrop-grayscale": [l]
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
        "backdrop-invert": [u]
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
        "backdrop-saturate": [S]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", X]
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
        ease: ["linear", "in", "out", "in-out", X]
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
        animate: ["none", "spin", "ping", "pulse", "bounce", X]
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
        rotate: [br, X]
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
        "skew-x": [Y]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [Y]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", X]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", X]
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
        "will-change": ["auto", "scroll", "contents", "transform", X]
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
        stroke: [Ve, ut, da]
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
}, wl = /* @__PURE__ */ Gy(lv);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Yt = {
  prefix: "fas",
  iconName: "spinner-third",
  icon: [512, 512, [], "f3f4", "M224 32c0-17.7 14.3-32 32-32C397.4 0 512 114.6 512 256c0 46.6-12.5 90.4-34.3 128c-8.8 15.3-28.4 20.5-43.7 11.7s-20.5-28.4-11.7-43.7c16.3-28.2 25.7-61 25.7-96c0-106-86-192-192-192c-17.7 0-32-14.3-32-32z"]
}, cv = ({
  icon: e,
  iconClassName: t,
  children: r,
  className: n,
  htmlFor: a,
  variant: o = "primary",
  disabled: i,
  iconFlip: s = !1,
  loading: c,
  as: l = "button",
  href: f,
  target: u,
  ...m
}) => {
  function v(g) {
    switch (g) {
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
  const w = wl(
    i || c ? "opacity-50 pointer-events-none" : ""
  ), h = wl(
    "w-fit text-sm font-medium rounded-lg px-3 py-2 border border-transparent shadow-sm focus-visible:outline focus-visible:outline-0 focus-visible:outline-offset-0 transition-all duration-150 flex gap-2 items-center justify-center active:scale-95 transform",
    v(o),
    n,
    w
  );
  return a ? /* @__PURE__ */ qe("label", { className: h, htmlFor: a, style: m.style, children: [
    c && !s ? /* @__PURE__ */ le(Ce, { icon: Yt, className: "animate-spin" }) : /* @__PURE__ */ le(Wt, { children: e && !s ? /* @__PURE__ */ le(Ce, { icon: e, className: t }) : null }),
    r,
    c && s ? /* @__PURE__ */ le(Ce, { icon: Yt, className: "animate-spin" }) : /* @__PURE__ */ le(Wt, { children: e && s ? /* @__PURE__ */ le(Ce, { icon: e, className: t }) : null })
  ] }) : l === "link" && f ? /* @__PURE__ */ qe(
    "a",
    {
      href: f,
      className: h,
      style: m.style,
      ...m,
      target: u,
      children: [
        c && !s ? /* @__PURE__ */ le(Ce, { icon: Yt, className: "animate-spin" }) : /* @__PURE__ */ le(Wt, { children: e && !s ? /* @__PURE__ */ le(Ce, { icon: e, className: t }) : null }),
        r,
        c && s ? /* @__PURE__ */ le(Ce, { icon: Yt, className: "animate-spin" }) : /* @__PURE__ */ le(Wt, { children: e && s ? /* @__PURE__ */ le(Ce, { icon: e, className: t }) : null })
      ]
    }
  ) : /* @__PURE__ */ qe(
    "button",
    {
      className: h,
      disabled: i || c,
      ...m,
      htmlFor: a,
      children: [
        c && !s ? /* @__PURE__ */ le(Ce, { icon: Yt, className: "animate-spin" }) : /* @__PURE__ */ le(Wt, { children: e && !s ? /* @__PURE__ */ le(Ce, { icon: e, className: t }) : null }),
        r,
        c && s ? /* @__PURE__ */ le(Ce, { icon: Yt, className: "animate-spin" }) : /* @__PURE__ */ le(Wt, { children: e && s ? /* @__PURE__ */ le(Ce, { icon: e, className: t }) : null })
      ]
    }
  );
};
var an = /* @__PURE__ */ ((e) => (e[e.ALL = 0] = "ALL", e[e.FEATURED = 1] = "FEATURED", e[e.MINE = 2] = "MINE", e[e.BOOKMARKED = 3] = "BOOKMARKED", e))(an || {});
an.FEATURED, an.MINE, an.BOOKMARKED;
var fv = Object.defineProperty, uv = (e, t, r) => t in e ? fv(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r, pa = (e, t, r) => (uv(e, typeof t != "symbol" ? t + "" : t, r), r);
let dv = class {
  constructor() {
    pa(this, "current", this.detect()), pa(this, "handoffState", "pending"), pa(this, "currentId", 0);
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
}, on = new dv();
function pv(e) {
  typeof queueMicrotask == "function" ? queueMicrotask(e) : Promise.resolve().then(e).catch((t) => setTimeout(() => {
    throw t;
  }));
}
function Cn() {
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
    return pv(() => {
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
    let n = Cn();
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
function gu() {
  let [e] = Ie(Cn);
  return zt(() => () => e.dispose(), [e]), e;
}
let yt = (e, t) => {
  on.isServer ? zt(e, t) : kd(e, t);
};
function bu(e) {
  let t = Se(e);
  return yt(() => {
    t.current = e;
  }, [e]), t;
}
let Be = function(e) {
  let t = bu(e);
  return Oe.useCallback((...r) => t.current(...r), [t]);
};
function $o(...e) {
  return Array.from(new Set(e.flatMap((t) => typeof t == "string" ? t.split(" ") : []))).filter(Boolean).join(" ");
}
function Nn(e, t, ...r) {
  if (e in t) {
    let a = t[e];
    return typeof a == "function" ? a(...r) : a;
  }
  let n = new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map((a) => `"${a}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(n, Nn), n;
}
var hu = ((e) => (e[e.None = 0] = "None", e[e.RenderStrategy = 1] = "RenderStrategy", e[e.Static = 2] = "Static", e))(hu || {}), ht = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(ht || {});
function yu() {
  let e = gv();
  return bt((t) => mv({ mergeRefs: e, ...t }), [e]);
}
function mv({ ourProps: e, theirProps: t, slot: r, defaultTag: n, features: a, visible: o = !0, name: i, mergeRefs: s }) {
  s = s ?? bv;
  let c = vu(t, e);
  if (o) return Br(c, r, n, i, s);
  let l = a ?? 0;
  if (l & 2) {
    let { static: f = !1, ...u } = c;
    if (f) return Br(u, r, n, i, s);
  }
  if (l & 1) {
    let { unmount: f = !0, ...u } = c;
    return Nn(f ? 0 : 1, { 0() {
      return null;
    }, 1() {
      return Br({ ...u, hidden: !0, style: { display: "none" } }, r, n, i, s);
    } });
  }
  return Br(c, r, n, i, s);
}
function Br(e, t = {}, r, n, a) {
  let { as: o = r, children: i, refName: s = "ref", ...c } = ma(e, ["unmount", "static"]), l = e.ref !== void 0 ? { [s]: e.ref } : {}, f = typeof i == "function" ? i(t) : i;
  "className" in c && c.className && typeof c.className == "function" && (c.className = c.className(t)), c["aria-labelledby"] && c["aria-labelledby"] === c.id && (c["aria-labelledby"] = void 0);
  let u = {};
  if (t) {
    let m = !1, v = [];
    for (let [w, h] of Object.entries(t)) typeof h == "boolean" && (m = !0), h === !0 && v.push(w.replace(/([A-Z])/g, (g) => `-${g.toLowerCase()}`));
    if (m) {
      u["data-headlessui-state"] = v.join(" ");
      for (let w of v) u[`data-${w}`] = "";
    }
  }
  if (o === It && (Object.keys($t(c)).length > 0 || Object.keys($t(u)).length > 0)) if (!Od(f) || Array.isArray(f) && f.length > 1) {
    if (Object.keys($t(c)).length > 0) throw new Error(['Passing props on "Fragment"!', "", `The current component <${n} /> is rendering a "Fragment".`, "However we need to passthrough the following props:", Object.keys($t(c)).concat(Object.keys($t(u))).map((m) => `  - ${m}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".', "Render a single element as the child so that we can forward the props onto that element."].map((m) => `  - ${m}`).join(`
`)].join(`
`));
  } else {
    let m = f.props, v = m == null ? void 0 : m.className, w = typeof v == "function" ? (...x) => $o(v(...x), c.className) : $o(v, c.className), h = w ? { className: w } : {}, g = vu(f.props, $t(ma(c, ["ref"])));
    for (let x in u) x in g && delete u[x];
    return Sd(f, Object.assign({}, g, u, l, { ref: a(hv(f), l.ref) }, h));
  }
  return Ed(o, Object.assign({}, ma(c, ["ref"]), o !== It && l, o !== It && u), f);
}
function gv() {
  let e = Se([]), t = bt((r) => {
    for (let n of e.current) n != null && (typeof n == "function" ? n(r) : n.current = r);
  }, []);
  return (...r) => {
    if (!r.every((n) => n == null)) return e.current = r, t;
  };
}
function bv(...e) {
  return e.every((t) => t == null) ? void 0 : (t) => {
    for (let r of e) r != null && (typeof r == "function" ? r(t) : r.current = t);
  };
}
function vu(...e) {
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
function Ei(e) {
  var t;
  return Object.assign(wd(e), { displayName: (t = e.displayName) != null ? t : e.name });
}
function $t(e) {
  let t = Object.assign({}, e);
  for (let r in t) t[r] === void 0 && delete t[r];
  return t;
}
function ma(e, t = []) {
  let r = Object.assign({}, e);
  for (let n of t) n in r && delete r[n];
  return r;
}
function hv(e) {
  return Oe.version.split(".")[0] >= "19" ? e.props.ref : e.ref;
}
let yv = Symbol();
function xu(...e) {
  let t = Se(e);
  zt(() => {
    t.current = e;
  }, [e]);
  let r = Be((n) => {
    for (let a of t.current) a != null && (typeof a == "function" ? a(n) : a.current = n);
  });
  return e.every((n) => n == null || (n == null ? void 0 : n[yv])) ? void 0 : r;
}
function vv(e = 0) {
  let [t, r] = Ie(e), n = bt((c) => r(c), [t]), a = bt((c) => r((l) => l | c), [t]), o = bt((c) => (t & c) === c, [t]), i = bt((c) => r((l) => l & ~c), [r]), s = bt((c) => r((l) => l ^ c), [r]);
  return { flags: t, setFlag: n, addFlag: a, hasFlag: o, removeFlag: i, toggleFlag: s };
}
var kl, Ol;
typeof process < "u" && typeof globalThis < "u" && typeof Element < "u" && ((kl = process == null ? void 0 : process.env) == null ? void 0 : kl.NODE_ENV) === "test" && typeof ((Ol = Element == null ? void 0 : Element.prototype) == null ? void 0 : Ol.getAnimations) > "u" && (Element.prototype.getAnimations = function() {
  return console.warn(["Headless UI has polyfilled `Element.prototype.getAnimations` for your tests.", "Please install a proper polyfill e.g. `jsdom-testing-mocks`, to silence these warnings.", "", "Example usage:", "```js", "import { mockAnimationsApi } from 'jsdom-testing-mocks'", "mockAnimationsApi()", "```"].join(`
`)), [];
});
var xv = ((e) => (e[e.None = 0] = "None", e[e.Closed = 1] = "Closed", e[e.Enter = 2] = "Enter", e[e.Leave = 4] = "Leave", e))(xv || {});
function wv(e) {
  let t = {};
  for (let r in e) e[r] === !0 && (t[`data-${r}`] = "");
  return t;
}
function kv(e, t, r, n) {
  let [a, o] = Ie(r), { hasFlag: i, addFlag: s, removeFlag: c } = vv(e && a ? 3 : 0), l = Se(!1), f = Se(!1), u = gu();
  return yt(() => {
    var m;
    if (e) {
      if (r && o(!0), !t) {
        r && s(3);
        return;
      }
      return (m = n == null ? void 0 : n.start) == null || m.call(n, r), Ov(t, { inFlight: l, prepare() {
        f.current ? f.current = !1 : f.current = l.current, l.current = !0, !f.current && (r ? (s(3), c(4)) : (s(4), c(2)));
      }, run() {
        f.current ? r ? (c(3), s(4)) : (c(4), s(3)) : r ? c(1) : s(1);
      }, done() {
        var v;
        f.current && typeof t.getAnimations == "function" && t.getAnimations().length > 0 || (l.current = !1, c(7), r || o(!1), (v = n == null ? void 0 : n.end) == null || v.call(n, r));
      } });
    }
  }, [e, r, t, u]), e ? [a, { closed: i(1), enter: i(2), leave: i(4), transition: i(2) || i(4) }] : [r, { closed: void 0, enter: void 0, leave: void 0, transition: void 0 }];
}
function Ov(e, { prepare: t, run: r, done: n, inFlight: a }) {
  let o = Cn();
  return Ev(e, { prepare: t, inFlight: a }), o.nextFrame(() => {
    r(), o.requestAnimationFrame(() => {
      o.add(Sv(e, n));
    });
  }), o.dispose;
}
function Sv(e, t) {
  var r, n;
  let a = Cn();
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
function Ev(e, { inFlight: t, prepare: r }) {
  if (t != null && t.current) {
    r();
    return;
  }
  let n = e.style.transition;
  e.style.transition = "none", r(), e.offsetHeight, e.style.transition = n;
}
let Ai = Ko(null);
Ai.displayName = "OpenClosedContext";
var jt = ((e) => (e[e.Open = 1] = "Open", e[e.Closed = 2] = "Closed", e[e.Closing = 4] = "Closing", e[e.Opening = 8] = "Opening", e))(jt || {});
function wu() {
  return yn(Ai);
}
function Av({ value: e, children: t }) {
  return Oe.createElement(Ai.Provider, { value: e }, t);
}
function Pv() {
  let e = typeof document > "u";
  return "useSyncExternalStore" in Or ? ((t) => t.useSyncExternalStore)(Or)(() => () => {
  }, () => !1, () => !e) : !1;
}
function ku() {
  let e = Pv(), [t, r] = Or.useState(on.isHandoffComplete);
  return t && on.isHandoffComplete === !1 && r(!1), Or.useEffect(() => {
    t !== !0 && r(!0);
  }, [t]), Or.useEffect(() => on.handoff(), []), e ? !1 : t;
}
function $v() {
  let e = Se(!1);
  return yt(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
}
function Ou(e) {
  var t;
  return !!(e.enter || e.enterFrom || e.enterTo || e.leave || e.leaveFrom || e.leaveTo) || ((t = e.as) != null ? t : Eu) !== It || Oe.Children.count(e.children) === 1;
}
let jn = Ko(null);
jn.displayName = "TransitionContext";
var Cv = ((e) => (e.Visible = "visible", e.Hidden = "hidden", e))(Cv || {});
function Nv() {
  let e = yn(jn);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
function jv() {
  let e = yn(Tn);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
let Tn = Ko(null);
Tn.displayName = "NestingContext";
function In(e) {
  return "children" in e ? In(e.children) : e.current.filter(({ el: t }) => t.current !== null).filter(({ state: t }) => t === "visible").length > 0;
}
function Su(e, t) {
  let r = bu(e), n = Se([]), a = $v(), o = gu(), i = Be((v, w = ht.Hidden) => {
    let h = n.current.findIndex(({ el: g }) => g === v);
    h !== -1 && (Nn(w, { [ht.Unmount]() {
      n.current.splice(h, 1);
    }, [ht.Hidden]() {
      n.current[h].state = "hidden";
    } }), o.microTask(() => {
      var g;
      !In(n) && a.current && ((g = r.current) == null || g.call(r));
    }));
  }), s = Be((v) => {
    let w = n.current.find(({ el: h }) => h === v);
    return w ? w.state !== "visible" && (w.state = "visible") : n.current.push({ el: v, state: "visible" }), () => i(v, ht.Unmount);
  }), c = Se([]), l = Se(Promise.resolve()), f = Se({ enter: [], leave: [] }), u = Be((v, w, h) => {
    c.current.splice(0), t && (t.chains.current[w] = t.chains.current[w].filter(([g]) => g !== v)), t == null || t.chains.current[w].push([v, new Promise((g) => {
      c.current.push(g);
    })]), t == null || t.chains.current[w].push([v, new Promise((g) => {
      Promise.all(f.current[w].map(([x, k]) => k)).then(() => g());
    })]), w === "enter" ? l.current = l.current.then(() => t == null ? void 0 : t.wait.current).then(() => h(w)) : h(w);
  }), m = Be((v, w, h) => {
    Promise.all(f.current[w].splice(0).map(([g, x]) => x)).then(() => {
      var g;
      (g = c.current.shift()) == null || g();
    }).then(() => h(w));
  });
  return Pc(() => ({ children: n, register: s, unregister: i, onStart: u, onStop: m, wait: l, chains: f }), [s, i, n, u, m, f, l]);
}
let Eu = It, Au = hu.RenderStrategy;
function Tv(e, t) {
  var r, n;
  let { transition: a = !0, beforeEnter: o, afterEnter: i, beforeLeave: s, afterLeave: c, enter: l, enterFrom: f, enterTo: u, entered: m, leave: v, leaveFrom: w, leaveTo: h, ...g } = e, [x, k] = Ie(null), S = Se(null), O = Ou(e), p = xu(...O ? [S, t, k] : t === null ? [] : [t]), Y = (r = g.unmount) == null || r ? ht.Unmount : ht.Hidden, { show: V, appear: oe, initial: ie } = Nv(), [J, ne] = Ie(V ? "visible" : "hidden"), P = jv(), { register: U, unregister: q } = P;
  yt(() => U(S), [U, S]), yt(() => {
    if (Y === ht.Hidden && S.current) {
      if (V && J !== "visible") {
        ne("visible");
        return;
      }
      return Nn(J, { hidden: () => q(S), visible: () => U(S) });
    }
  }, [J, S, U, q, V, Y]);
  let se = ku();
  yt(() => {
    if (O && se && J === "visible" && S.current === null) throw new Error("Did you forget to passthrough the `ref` to the actual DOM node?");
  }, [S, J, se, O]);
  let W = ie && !oe, Q = oe && V && ie, ae = Se(!1), Z = Su(() => {
    ae.current || (ne("hidden"), q(S));
  }, P), d = Be((C) => {
    ae.current = !0;
    let T = C ? "enter" : "leave";
    Z.onStart(S, T, (z) => {
      z === "enter" ? o == null || o() : z === "leave" && (s == null || s());
    });
  }), b = Be((C) => {
    let T = C ? "enter" : "leave";
    ae.current = !1, Z.onStop(S, T, (z) => {
      z === "enter" ? i == null || i() : z === "leave" && (c == null || c());
    }), T === "leave" && !In(Z) && (ne("hidden"), q(S));
  });
  zt(() => {
    O && a || (d(V), b(V));
  }, [V, O, a]);
  let N = !(!a || !O || !se || W), [, A] = kv(N, x, V, { start: d, end: b }), E = $t({ ref: p, className: ((n = $o(g.className, Q && l, Q && f, A.enter && l, A.enter && A.closed && f, A.enter && !A.closed && u, A.leave && v, A.leave && !A.closed && w, A.leave && A.closed && h, !A.transition && V && m)) == null ? void 0 : n.trim()) || void 0, ...wv(A) }), j = 0;
  J === "visible" && (j |= jt.Open), J === "hidden" && (j |= jt.Closed), V && J === "hidden" && (j |= jt.Opening), !V && J === "visible" && (j |= jt.Closing);
  let $ = yu();
  return Oe.createElement(Tn.Provider, { value: Z }, Oe.createElement(Av, { value: j }, $({ ourProps: E, theirProps: g, defaultTag: Eu, features: Au, visible: J === "visible", name: "Transition.Child" })));
}
function Iv(e, t) {
  let { show: r, appear: n = !1, unmount: a = !0, ...o } = e, i = Se(null), s = Ou(e), c = xu(...s ? [i, t] : t === null ? [] : [t]);
  ku();
  let l = wu();
  if (r === void 0 && l !== null && (r = (l & jt.Open) === jt.Open), r === void 0) throw new Error("A <Transition /> is used but it is missing a `show={true | false}` prop.");
  let [f, u] = Ie(r ? "visible" : "hidden"), m = Su(() => {
    r || u("hidden");
  }), [v, w] = Ie(!0), h = Se([r]);
  yt(() => {
    v !== !1 && h.current[h.current.length - 1] !== r && (h.current.push(r), w(!1));
  }, [h, r]);
  let g = Pc(() => ({ show: r, appear: n, initial: v }), [r, n, v]);
  yt(() => {
    r ? u("visible") : !In(m) && i.current !== null && u("hidden");
  }, [r, m]);
  let x = { unmount: a }, k = Be(() => {
    var p;
    v && w(!1), (p = e.beforeEnter) == null || p.call(e);
  }), S = Be(() => {
    var p;
    v && w(!1), (p = e.beforeLeave) == null || p.call(e);
  }), O = yu();
  return Oe.createElement(Tn.Provider, { value: m }, Oe.createElement(jn.Provider, { value: g }, O({ ourProps: { ...x, as: It, children: Oe.createElement(Pu, { ref: c, ...x, ...o, beforeEnter: k, beforeLeave: S }) }, theirProps: {}, defaultTag: It, features: Au, visible: f === "visible", name: "Transition" })));
}
function zv(e, t) {
  let r = yn(jn) !== null, n = wu() !== null;
  return Oe.createElement(Oe.Fragment, null, !r && n ? Oe.createElement(Co, { ref: t, ...e }) : Oe.createElement(Pu, { ref: t, ...e }));
}
let Co = Ei(Iv), Pu = Ei(Tv), Mv = Ei(zv), Rv = Object.assign(Co, { Child: Mv, Root: Co });
const Pi = "-", _v = (e) => {
  const t = Lv(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (a) => {
      const o = a.split(Pi);
      return o[0] === "" && o.length !== 1 && o.shift(), $u(o, t) || Fv(a);
    },
    getConflictingClassGroupIds: (a, o) => {
      const i = r[a] || [];
      return o && n[a] ? [...i, ...n[a]] : i;
    }
  };
}, $u = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], a = t.nextPart.get(n), o = a ? $u(e.slice(1), a) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const i = e.join(Pi);
  return (r = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : r.classGroupId;
}, Sl = /^\[(.+)\]$/, Fv = (e) => {
  if (Sl.test(e)) {
    const t = Sl.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, Lv = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return Wv(Object.entries(e.classGroups), r).forEach(([a, o]) => {
    No(o, n, a, t);
  }), n;
}, No = (e, t, r, n) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : El(t, a);
      o.classGroupId = r;
      return;
    }
    if (typeof a == "function") {
      if (Dv(a)) {
        No(a(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: r
      });
      return;
    }
    Object.entries(a).forEach(([o, i]) => {
      No(i, El(t, o), r, n);
    });
  });
}, El = (e, t) => {
  let r = e;
  return t.split(Pi).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, Dv = (e) => e.isThemeGetter, Wv = (e, t) => t ? e.map(([r, n]) => {
  const a = n.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([i, s]) => [t + i, s])) : o);
  return [r, a];
}) : e, Yv = (e) => {
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
}, Cu = "!", qv = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, a = t[0], o = t.length, i = (s) => {
    const c = [];
    let l = 0, f = 0, u;
    for (let g = 0; g < s.length; g++) {
      let x = s[g];
      if (l === 0) {
        if (x === a && (n || s.slice(g, g + o) === t)) {
          c.push(s.slice(f, g)), f = g + o;
          continue;
        }
        if (x === "/") {
          u = g;
          continue;
        }
      }
      x === "[" ? l++ : x === "]" && l--;
    }
    const m = c.length === 0 ? s : s.substring(f), v = m.startsWith(Cu), w = v ? m.substring(1) : m, h = u && u > f ? u - f : void 0;
    return {
      modifiers: c,
      hasImportantModifier: v,
      baseClassName: w,
      maybePostfixModifierPosition: h
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, Gv = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, Uv = (e) => ({
  cache: Yv(e.cacheSize),
  parseClassName: qv(e),
  ..._v(e)
}), Vv = /\s+/, Hv = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: a
  } = t, o = [], i = e.trim().split(Vv);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: f,
      hasImportantModifier: u,
      baseClassName: m,
      maybePostfixModifierPosition: v
    } = r(l);
    let w = !!v, h = n(w ? m.substring(0, v) : m);
    if (!h) {
      if (!w) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (h = n(m), !h) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      w = !1;
    }
    const g = Gv(f).join(":"), x = u ? g + Cu : g, k = x + h;
    if (o.includes(k))
      continue;
    o.push(k);
    const S = a(h, w);
    for (let O = 0; O < S.length; ++O) {
      const p = S[O];
      o.push(x + p);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function Bv() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = Nu(t)) && (n && (n += " "), n += r);
  return n;
}
const Nu = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = Nu(e[n])) && (r && (r += " "), r += t);
  return r;
};
function Xv(e, ...t) {
  let r, n, a, o = i;
  function i(c) {
    const l = t.reduce((f, u) => u(f), e());
    return r = Uv(l), n = r.cache.get, a = r.cache.set, o = s, s(c);
  }
  function s(c) {
    const l = n(c);
    if (l)
      return l;
    const f = Hv(c, r);
    return a(c, f), f;
  }
  return function() {
    return o(Bv.apply(null, arguments));
  };
}
const ve = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, ju = /^\[(?:([a-z-]+):)?(.+)\]$/i, Kv = /^\d+\/\d+$/, Jv = /* @__PURE__ */ new Set(["px", "full", "screen"]), Zv = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Qv = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, e1 = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, t1 = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, r1 = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, He = (e) => er(e) || Jv.has(e) || Kv.test(e), pt = (e) => fr(e, "length", f1), er = (e) => !!e && !Number.isNaN(Number(e)), ga = (e) => fr(e, "number", er), yr = (e) => !!e && Number.isInteger(Number(e)), n1 = (e) => e.endsWith("%") && er(e.slice(0, -1)), K = (e) => ju.test(e), mt = (e) => Zv.test(e), a1 = /* @__PURE__ */ new Set(["length", "size", "percentage"]), o1 = (e) => fr(e, a1, Tu), i1 = (e) => fr(e, "position", Tu), s1 = /* @__PURE__ */ new Set(["image", "url"]), l1 = (e) => fr(e, s1, d1), c1 = (e) => fr(e, "", u1), vr = () => !0, fr = (e, t, r) => {
  const n = ju.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, f1 = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  Qv.test(e) && !e1.test(e)
), Tu = () => !1, u1 = (e) => t1.test(e), d1 = (e) => r1.test(e), p1 = () => {
  const e = ve("colors"), t = ve("spacing"), r = ve("blur"), n = ve("brightness"), a = ve("borderColor"), o = ve("borderRadius"), i = ve("borderSpacing"), s = ve("borderWidth"), c = ve("contrast"), l = ve("grayscale"), f = ve("hueRotate"), u = ve("invert"), m = ve("gap"), v = ve("gradientColorStops"), w = ve("gradientColorStopPositions"), h = ve("inset"), g = ve("margin"), x = ve("opacity"), k = ve("padding"), S = ve("saturate"), O = ve("scale"), p = ve("sepia"), Y = ve("skew"), V = ve("space"), oe = ve("translate"), ie = () => ["auto", "contain", "none"], J = () => ["auto", "hidden", "clip", "visible", "scroll"], ne = () => ["auto", K, t], P = () => [K, t], U = () => ["", He, pt], q = () => ["auto", er, K], se = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], W = () => ["solid", "dashed", "dotted", "double", "none"], Q = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], ae = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], Z = () => ["", "0", K], d = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], b = () => [er, K];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [vr],
      spacing: [He, pt],
      blur: ["none", "", mt, K],
      brightness: b(),
      borderColor: [e],
      borderRadius: ["none", "", "full", mt, K],
      borderSpacing: P(),
      borderWidth: U(),
      contrast: b(),
      grayscale: Z(),
      hueRotate: b(),
      invert: Z(),
      gap: P(),
      gradientColorStops: [e],
      gradientColorStopPositions: [n1, pt],
      inset: ne(),
      margin: ne(),
      opacity: b(),
      padding: P(),
      saturate: b(),
      scale: b(),
      sepia: Z(),
      skew: b(),
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
        aspect: ["auto", "square", "video", K]
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
        columns: [mt]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": d()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": d()
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
        object: [...se(), K]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: J()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": J()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": J()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: ie()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": ie()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": ie()
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
        inset: [h]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [h]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [h]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [h]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [h]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [h]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [h]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [h]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [h]
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
        z: ["auto", yr, K]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ne()
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
        flex: ["1", "auto", "initial", "none", K]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: Z()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: Z()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", yr, K]
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
          span: ["full", yr, K]
        }, K]
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
          span: [yr, K]
        }, K]
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
        "auto-cols": ["auto", "min", "max", "fr", K]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", K]
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
        justify: ["normal", ...ae()]
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
        content: ["normal", ...ae(), "baseline"]
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
        "place-content": [...ae(), "baseline"]
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
        p: [k]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [k]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [k]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [k]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [k]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [k]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [k]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [k]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [k]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [g]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [g]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [g]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [g]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [g]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [g]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [g]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [g]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [g]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [V]
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
        "space-y": [V]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", K, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [K, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [K, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [mt]
        }, mt]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [K, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [K, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [K, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [K, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", mt, pt]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", ga]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", K]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", er, ga]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", He, K]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", K]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", K]
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
        decoration: [...W(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", He, pt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", He, K]
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
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", K]
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
        content: ["none", K]
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
        bg: [...se(), i1]
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
        bg: ["auto", "cover", "contain", o1]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, l1]
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
        from: [w]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [w]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [w]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [v]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [v]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [v]
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
        "border-opacity": [x]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...W(), "hidden"]
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
        divide: W()
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
        outline: ["", ...W()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [He, K]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [He, pt]
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
        ring: U()
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
        "ring-offset": [He, pt]
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
        shadow: ["", "inner", "none", mt, c1]
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
        opacity: [x]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...Q(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": Q()
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
        "drop-shadow": ["", "none", mt, K]
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
        "hue-rotate": [f]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [u]
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
        "backdrop-grayscale": [l]
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
        "backdrop-invert": [u]
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
        "backdrop-saturate": [S]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", K]
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
        ease: ["linear", "in", "out", "in-out", K]
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
        animate: ["none", "spin", "ping", "pulse", "bounce", K]
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
        rotate: [yr, K]
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
        "skew-x": [Y]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [Y]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", K]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", K]
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
        "will-change": ["auto", "scroll", "contents", "transform", K]
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
        stroke: [He, pt, ga]
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
}, Al = /* @__PURE__ */ Xv(p1), m1 = ({
  children: e,
  content: t,
  position: r,
  className: n,
  delay: a = 300,
  closeOnClick: o = !1,
  imageSrc: i,
  description: s,
  interactive: c = !1
}) => {
  const [l, f] = Ie(!1), u = Se(null), m = Se(null), [v, w] = Ie(!1), [h, g] = Ie(!1), x = () => u.current ? u.current.querySelectorAll('[data-headlessui-state="open"]').length > 0 : !1;
  zt(() => {
    const O = new MutationObserver((p) => {
      p.forEach((Y) => {
        Y.type === "attributes" && Y.attributeName === "data-headlessui-state" && Y.target.getAttribute("data-headlessui-state") === "open" && f(!1);
      });
    });
    return u.current && O.observe(u.current, {
      attributes: !0,
      subtree: !0,
      attributeFilter: ["data-headlessui-state"]
    }), () => {
      O.disconnect();
    };
  }, []);
  const k = () => {
    if (u.current) {
      const O = u.current.getBoundingClientRect();
      switch (r) {
        case "top":
          return {
            bottom: O.height + 10,
            left: "50%",
            transform: "translateX(-50%)"
          };
        case "bottom":
          return {
            top: O.height + 10,
            left: "50%",
            transform: "translateX(-50%)"
          };
        case "left":
          return {
            right: O.width + 10,
            top: "50%",
            transform: "translateY(-50%)"
          };
        case "right":
          return {
            left: O.width + 10,
            top: "50%",
            transform: "translateY(-50%)"
          };
        default:
          return {};
      }
    }
    return {};
  }, S = (O) => {
    o && (f(!1), O.stopPropagation());
  };
  return zt(() => {
    x() || f(v || c && h);
  }, [v, h, c]), /* @__PURE__ */ qe(
    "div",
    {
      ref: u,
      onMouseEnter: () => {
        w(!0), x() || f(!0);
      },
      onMouseLeave: () => {
        w(!1), c || f(!1);
      },
      onClick: S,
      className: "relative",
      children: [
        e,
        /* @__PURE__ */ le(
          Rv,
          {
            show: l,
            enter: Al(
              "transition ease-out duration-200",
              a ? `delay-[${a}ms]` : "delay-[300ms]"
            ),
            enterFrom: "opacity-0",
            enterTo: "opacity-100",
            leave: "transition ease-in duration-150",
            leaveFrom: "opacity-100",
            leaveTo: "opacity-0",
            children: /* @__PURE__ */ le(
              "div",
              {
                ref: m,
                onMouseEnter: () => c && g(!0),
                onMouseLeave: () => c && g(!1),
                style: {
                  ...k(),
                  transitionDelay: `${a}ms`,
                  transitionProperty: "opacity",
                  transitionDuration: "200ms",
                  transitionTimingFunction: "ease-out"
                },
                className: Al(
                  "absolute z-10 w-max rounded-lg bg-ui-controls px-2.5 py-1.5 text-[13px] font-medium text-base-fg shadow-xl border border-ui-panel-border",
                  c ? "pointer-events-auto" : "pointer-events-none",
                  n || ""
                ),
                children: /* @__PURE__ */ qe("div", { className: "flex flex-col gap-1", children: [
                  t,
                  i && /* @__PURE__ */ le(
                    "img",
                    {
                      src: i,
                      alt: "tooltip",
                      className: "mb-1 aspect-square w-56 rounded-md"
                    }
                  ),
                  s && /* @__PURE__ */ le("p", { className: "text-sm text-base-fg font-normal", children: s })
                ] })
              }
            )
          }
        )
      ]
    }
  );
};
var Xr = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Iu(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var ba, Pl;
function zu() {
  if (Pl) return ba;
  Pl = 1;
  function e(t) {
    var r = typeof t;
    return t != null && (r == "object" || r == "function");
  }
  return ba = e, ba;
}
var ha, $l;
function g1() {
  if ($l) return ha;
  $l = 1;
  var e = typeof Xr == "object" && Xr && Xr.Object === Object && Xr;
  return ha = e, ha;
}
var ya, Cl;
function Mu() {
  if (Cl) return ya;
  Cl = 1;
  var e = g1(), t = typeof self == "object" && self && self.Object === Object && self, r = e || t || Function("return this")();
  return ya = r, ya;
}
var va, Nl;
function b1() {
  if (Nl) return va;
  Nl = 1;
  var e = Mu(), t = function() {
    return e.Date.now();
  };
  return va = t, va;
}
var xa, jl;
function h1() {
  if (jl) return xa;
  jl = 1;
  var e = /\s/;
  function t(r) {
    for (var n = r.length; n-- && e.test(r.charAt(n)); )
      ;
    return n;
  }
  return xa = t, xa;
}
var wa, Tl;
function y1() {
  if (Tl) return wa;
  Tl = 1;
  var e = h1(), t = /^\s+/;
  function r(n) {
    return n && n.slice(0, e(n) + 1).replace(t, "");
  }
  return wa = r, wa;
}
var ka, Il;
function Ru() {
  if (Il) return ka;
  Il = 1;
  var e = Mu(), t = e.Symbol;
  return ka = t, ka;
}
var Oa, zl;
function v1() {
  if (zl) return Oa;
  zl = 1;
  var e = Ru(), t = Object.prototype, r = t.hasOwnProperty, n = t.toString, a = e ? e.toStringTag : void 0;
  function o(i) {
    var s = r.call(i, a), c = i[a];
    try {
      i[a] = void 0;
      var l = !0;
    } catch {
    }
    var f = n.call(i);
    return l && (s ? i[a] = c : delete i[a]), f;
  }
  return Oa = o, Oa;
}
var Sa, Ml;
function x1() {
  if (Ml) return Sa;
  Ml = 1;
  var e = Object.prototype, t = e.toString;
  function r(n) {
    return t.call(n);
  }
  return Sa = r, Sa;
}
var Ea, Rl;
function w1() {
  if (Rl) return Ea;
  Rl = 1;
  var e = Ru(), t = v1(), r = x1(), n = "[object Null]", a = "[object Undefined]", o = e ? e.toStringTag : void 0;
  function i(s) {
    return s == null ? s === void 0 ? a : n : o && o in Object(s) ? t(s) : r(s);
  }
  return Ea = i, Ea;
}
var Aa, _l;
function k1() {
  if (_l) return Aa;
  _l = 1;
  function e(t) {
    return t != null && typeof t == "object";
  }
  return Aa = e, Aa;
}
var Pa, Fl;
function O1() {
  if (Fl) return Pa;
  Fl = 1;
  var e = w1(), t = k1(), r = "[object Symbol]";
  function n(a) {
    return typeof a == "symbol" || t(a) && e(a) == r;
  }
  return Pa = n, Pa;
}
var $a, Ll;
function S1() {
  if (Ll) return $a;
  Ll = 1;
  var e = y1(), t = zu(), r = O1(), n = NaN, a = /^[-+]0x[0-9a-f]+$/i, o = /^0b[01]+$/i, i = /^0o[0-7]+$/i, s = parseInt;
  function c(l) {
    if (typeof l == "number")
      return l;
    if (r(l))
      return n;
    if (t(l)) {
      var f = typeof l.valueOf == "function" ? l.valueOf() : l;
      l = t(f) ? f + "" : f;
    }
    if (typeof l != "string")
      return l === 0 ? l : +l;
    l = e(l);
    var u = o.test(l);
    return u || i.test(l) ? s(l.slice(2), u ? 2 : 8) : a.test(l) ? n : +l;
  }
  return $a = c, $a;
}
var Ca, Dl;
function E1() {
  if (Dl) return Ca;
  Dl = 1;
  var e = zu(), t = b1(), r = S1(), n = "Expected a function", a = Math.max, o = Math.min;
  function i(s, c, l) {
    var f, u, m, v, w, h, g = 0, x = !1, k = !1, S = !0;
    if (typeof s != "function")
      throw new TypeError(n);
    c = r(c) || 0, e(l) && (x = !!l.leading, k = "maxWait" in l, m = k ? a(r(l.maxWait) || 0, c) : m, S = "trailing" in l ? !!l.trailing : S);
    function O(U) {
      var q = f, se = u;
      return f = u = void 0, g = U, v = s.apply(se, q), v;
    }
    function p(U) {
      return g = U, w = setTimeout(oe, c), x ? O(U) : v;
    }
    function Y(U) {
      var q = U - h, se = U - g, W = c - q;
      return k ? o(W, m - se) : W;
    }
    function V(U) {
      var q = U - h, se = U - g;
      return h === void 0 || q >= c || q < 0 || k && se >= m;
    }
    function oe() {
      var U = t();
      if (V(U))
        return ie(U);
      w = setTimeout(oe, Y(U));
    }
    function ie(U) {
      return w = void 0, S && f ? O(U) : (f = u = void 0, v);
    }
    function J() {
      w !== void 0 && clearTimeout(w), g = 0, f = h = u = w = void 0;
    }
    function ne() {
      return w === void 0 ? v : ie(t());
    }
    function P() {
      var U = t(), q = V(U);
      if (f = arguments, u = this, h = U, q) {
        if (w === void 0)
          return p(h);
        if (k)
          return clearTimeout(w), w = setTimeout(oe, c), O(h);
      }
      return w === void 0 && (w = setTimeout(oe, c)), v;
    }
    return P.cancel = J, P.flush = ne, P;
  }
  return Ca = i, Ca;
}
var A1 = E1();
const P1 = /* @__PURE__ */ Iu(A1);
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function $1(e, t, r) {
  return (t = N1(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function Wl(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function _(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Wl(Object(r), !0).forEach(function(n) {
      $1(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : Wl(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function C1(e, t) {
  if (typeof e != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(e, t);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function N1(e) {
  var t = C1(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Yl = () => {
};
let $i = {}, _u = {}, Fu = null, Lu = {
  mark: Yl,
  measure: Yl
};
try {
  typeof window < "u" && ($i = window), typeof document < "u" && (_u = document), typeof MutationObserver < "u" && (Fu = MutationObserver), typeof performance < "u" && (Lu = performance);
} catch {
}
const {
  userAgent: ql = ""
} = $i.navigator || {}, Et = $i, ke = _u, Gl = Fu, Kr = Lu;
Et.document;
const nt = !!ke.documentElement && !!ke.head && typeof ke.addEventListener == "function" && typeof ke.createElement == "function", Du = ~ql.indexOf("MSIE") || ~ql.indexOf("Trident/");
var j1 = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, T1 = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Wu = {
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
}, I1 = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Yu = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Pe = "classic", zn = "duotone", z1 = "sharp", M1 = "sharp-duotone", qu = [Pe, zn, z1, M1], R1 = {
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
}, _1 = {
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
}, F1 = /* @__PURE__ */ new Map([["classic", {
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
}]]), L1 = {
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
}, D1 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Ul = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, W1 = ["kit"], Y1 = {
  kit: {
    "fa-kit": "fak"
  }
}, q1 = ["fak", "fakd"], G1 = {
  kit: {
    fak: "fa-kit"
  }
}, Vl = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Jr = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, U1 = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], V1 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], H1 = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, B1 = {
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
}, X1 = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, jo = {
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
}, K1 = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], To = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...U1, ...K1], J1 = ["solid", "regular", "light", "thin", "duotone", "brands"], Gu = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], Z1 = Gu.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), Q1 = [...Object.keys(X1), ...J1, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Jr.GROUP, Jr.SWAP_OPACITY, Jr.PRIMARY, Jr.SECONDARY].concat(Gu.map((e) => "".concat(e, "x"))).concat(Z1.map((e) => "w-".concat(e))), e0 = {
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
const Qe = "___FONT_AWESOME___", Io = 16, Uu = "fa", Vu = "svg-inline--fa", Lt = "data-fa-i2svg", zo = "data-fa-pseudo-element", t0 = "data-fa-pseudo-element-pending", Ci = "data-prefix", Ni = "data-icon", Hl = "fontawesome-i2svg", r0 = "async", n0 = ["HTML", "HEAD", "STYLE", "SCRIPT"], Hu = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Dr(e) {
  return new Proxy(e, {
    get(t, r) {
      return r in t ? t[r] : t[Pe];
    }
  });
}
const Bu = _({}, Wu);
Bu[Pe] = _(_(_(_({}, {
  "fa-duotone": "duotone"
}), Wu[Pe]), Ul.kit), Ul["kit-duotone"]);
const a0 = Dr(Bu), Mo = _({}, L1);
Mo[Pe] = _(_(_(_({}, {
  duotone: "fad"
}), Mo[Pe]), Vl.kit), Vl["kit-duotone"]);
const Bl = Dr(Mo), Ro = _({}, jo);
Ro[Pe] = _(_({}, Ro[Pe]), G1.kit);
const ji = Dr(Ro), _o = _({}, B1);
_o[Pe] = _(_({}, _o[Pe]), Y1.kit);
Dr(_o);
const o0 = j1, Xu = "fa-layers-text", i0 = T1, s0 = _({}, R1);
Dr(s0);
const l0 = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Na = I1, c0 = [...W1, ...Q1], $r = Et.FontAwesomeConfig || {};
function f0(e) {
  var t = ke.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function u0(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
ke && typeof ke.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [r, n] = t;
  const a = u0(f0(r));
  a != null && ($r[n] = a);
});
const Ku = {
  styleDefault: "solid",
  familyDefault: Pe,
  cssPrefix: Uu,
  replacementClass: Vu,
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
$r.familyPrefix && ($r.cssPrefix = $r.familyPrefix);
const ar = _(_({}, Ku), $r);
ar.autoReplaceSvg || (ar.observeMutations = !1);
const D = {};
Object.keys(Ku).forEach((e) => {
  Object.defineProperty(D, e, {
    enumerable: !0,
    set: function(t) {
      ar[e] = t, Cr.forEach((r) => r(D));
    },
    get: function() {
      return ar[e];
    }
  });
});
Object.defineProperty(D, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    ar.cssPrefix = e, Cr.forEach((t) => t(D));
  },
  get: function() {
    return ar.cssPrefix;
  }
});
Et.FontAwesomeConfig = D;
const Cr = [];
function d0(e) {
  return Cr.push(e), () => {
    Cr.splice(Cr.indexOf(e), 1);
  };
}
const gt = Io, We = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function p0(e) {
  if (!e || !nt)
    return;
  const t = ke.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const r = ke.head.childNodes;
  let n = null;
  for (let a = r.length - 1; a > -1; a--) {
    const o = r[a], i = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (n = o);
  }
  return ke.head.insertBefore(t, n), e;
}
const m0 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function zr() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += m0[Math.random() * 62 | 0];
  return t;
}
function ur(e) {
  const t = [];
  for (let r = (e || []).length >>> 0; r--; )
    t[r] = e[r];
  return t;
}
function Ti(e) {
  return e.classList ? ur(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function Ju(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function g0(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, '="').concat(Ju(e[r]), '" '), "").trim();
}
function Mn(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, ": ").concat(e[r].trim(), ";"), "");
}
function Ii(e) {
  return e.size !== We.size || e.x !== We.x || e.y !== We.y || e.rotate !== We.rotate || e.flipX || e.flipY;
}
function b0(e) {
  let {
    transform: t,
    containerWidth: r,
    iconWidth: n
  } = e;
  const a = {
    transform: "translate(".concat(r / 2, " 256)")
  }, o = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), c = {
    transform: "".concat(o, " ").concat(i, " ").concat(s)
  }, l = {
    transform: "translate(".concat(n / 2 * -1, " -256)")
  };
  return {
    outer: a,
    inner: c,
    path: l
  };
}
function h0(e) {
  let {
    transform: t,
    width: r = Io,
    height: n = Io,
    startCentered: a = !1
  } = e, o = "";
  return a && Du ? o += "translate(".concat(t.x / gt - r / 2, "em, ").concat(t.y / gt - n / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / gt, "em), calc(-50% + ").concat(t.y / gt, "em)) ") : o += "translate(".concat(t.x / gt, "em, ").concat(t.y / gt, "em) "), o += "scale(".concat(t.size / gt * (t.flipX ? -1 : 1), ", ").concat(t.size / gt * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var y0 = `:root, :host {
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
function Zu() {
  const e = Uu, t = Vu, r = D.cssPrefix, n = D.replacementClass;
  let a = y0;
  if (r !== e || n !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(r, "-")).replace(i, "--".concat(r, "-")).replace(s, ".".concat(n));
  }
  return a;
}
let Xl = !1;
function ja() {
  D.autoAddCss && !Xl && (p0(Zu()), Xl = !0);
}
var v0 = {
  mixout() {
    return {
      dom: {
        css: Zu,
        insertCss: ja
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        ja();
      },
      beforeI2svg() {
        ja();
      }
    };
  }
};
const et = Et || {};
et[Qe] || (et[Qe] = {});
et[Qe].styles || (et[Qe].styles = {});
et[Qe].hooks || (et[Qe].hooks = {});
et[Qe].shims || (et[Qe].shims = []);
var Ye = et[Qe];
const Qu = [], ed = function() {
  ke.removeEventListener("DOMContentLoaded", ed), gn = 1, Qu.map((e) => e());
};
let gn = !1;
nt && (gn = (ke.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(ke.readyState), gn || ke.addEventListener("DOMContentLoaded", ed));
function x0(e) {
  nt && (gn ? setTimeout(e, 0) : Qu.push(e));
}
function Wr(e) {
  const {
    tag: t,
    attributes: r = {},
    children: n = []
  } = e;
  return typeof e == "string" ? Ju(e) : "<".concat(t, " ").concat(g0(r), ">").concat(n.map(Wr).join(""), "</").concat(t, ">");
}
function Kl(e, t, r) {
  if (e && e[t] && e[t][r])
    return {
      prefix: t,
      iconName: r,
      icon: e[t][r]
    };
}
var Ta = function(t, r, n, a) {
  var o = Object.keys(t), i = o.length, s = r, c, l, f;
  for (n === void 0 ? (c = 1, f = t[o[0]]) : (c = 0, f = n); c < i; c++)
    l = o[c], f = s(f, t[l], l, t);
  return f;
};
function w0(e) {
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
function Fo(e) {
  const t = w0(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function k0(e, t) {
  const r = e.length;
  let n = e.charCodeAt(t), a;
  return n >= 55296 && n <= 56319 && r > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (n - 55296) * 1024 + a - 56320 + 65536 : n;
}
function Jl(e) {
  return Object.keys(e).reduce((t, r) => {
    const n = e[r];
    return !!n.icon ? t[n.iconName] = n.icon : t[r] = n, t;
  }, {});
}
function Lo(e, t) {
  let r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: n = !1
  } = r, a = Jl(t);
  typeof Ye.hooks.addPack == "function" && !n ? Ye.hooks.addPack(e, Jl(t)) : Ye.styles[e] = _(_({}, Ye.styles[e] || {}), a), e === "fas" && Lo("fa", t);
}
const {
  styles: Mr,
  shims: O0
} = Ye, td = Object.keys(ji), S0 = td.reduce((e, t) => (e[t] = Object.keys(ji[t]), e), {});
let zi = null, rd = {}, nd = {}, ad = {}, od = {}, id = {};
function E0(e) {
  return ~c0.indexOf(e);
}
function A0(e, t) {
  const r = t.split("-"), n = r[0], a = r.slice(1).join("-");
  return n === e && a !== "" && !E0(a) ? a : null;
}
const sd = () => {
  const e = (n) => Ta(Mr, (a, o, i) => (a[i] = Ta(o, n, {}), a), {});
  rd = e((n, a, o) => (a[3] && (n[a[3]] = o), a[2] && a[2].filter((s) => typeof s == "number").forEach((s) => {
    n[s.toString(16)] = o;
  }), n)), nd = e((n, a, o) => (n[o] = o, a[2] && a[2].filter((s) => typeof s == "string").forEach((s) => {
    n[s] = o;
  }), n)), id = e((n, a, o) => {
    const i = a[2];
    return n[o] = o, i.forEach((s) => {
      n[s] = o;
    }), n;
  });
  const t = "far" in Mr || D.autoFetchSvg, r = Ta(O0, (n, a) => {
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
  ad = r.names, od = r.unicodes, zi = Rn(D.styleDefault, {
    family: D.familyDefault
  });
};
d0((e) => {
  zi = Rn(e.styleDefault, {
    family: D.familyDefault
  });
});
sd();
function Mi(e, t) {
  return (rd[e] || {})[t];
}
function P0(e, t) {
  return (nd[e] || {})[t];
}
function Tt(e, t) {
  return (id[e] || {})[t];
}
function ld(e) {
  return ad[e] || {
    prefix: null,
    iconName: null
  };
}
function $0(e) {
  const t = od[e], r = Mi("fas", e);
  return t || (r ? {
    prefix: "fas",
    iconName: r
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function At() {
  return zi;
}
const cd = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function C0(e) {
  let t = Pe;
  const r = td.reduce((n, a) => (n[a] = "".concat(D.cssPrefix, "-").concat(a), n), {});
  return qu.forEach((n) => {
    (e.includes(r[n]) || e.some((a) => S0[n].includes(a))) && (t = n);
  }), t;
}
function Rn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: r = Pe
  } = t, n = a0[r][e];
  if (r === zn && !e)
    return "fad";
  const a = Bl[r][e] || Bl[r][n], o = e in Ye.styles ? e : null;
  return a || o || null;
}
function N0(e) {
  let t = [], r = null;
  return e.forEach((n) => {
    const a = A0(D.cssPrefix, n);
    a ? r = a : n && t.push(n);
  }), {
    iconName: r,
    rest: t
  };
}
function Zl(e) {
  return e.sort().filter((t, r, n) => n.indexOf(t) === r);
}
function _n(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: r = !1
  } = t;
  let n = null;
  const a = To.concat(V1), o = Zl(e.filter((u) => a.includes(u))), i = Zl(e.filter((u) => !To.includes(u))), s = o.filter((u) => (n = u, !Yu.includes(u))), [c = null] = s, l = C0(o), f = _(_({}, N0(i)), {}, {
    prefix: Rn(c, {
      family: l
    })
  });
  return _(_(_({}, f), z0({
    values: e,
    family: l,
    styles: Mr,
    config: D,
    canonical: f,
    givenPrefix: n
  })), j0(r, n, f));
}
function j0(e, t, r) {
  let {
    prefix: n,
    iconName: a
  } = r;
  if (e || !n || !a)
    return {
      prefix: n,
      iconName: a
    };
  const o = t === "fa" ? ld(a) : {}, i = Tt(n, a);
  return a = o.iconName || i || a, n = o.prefix || n, n === "far" && !Mr.far && Mr.fas && !D.autoFetchSvg && (n = "fas"), {
    prefix: n,
    iconName: a
  };
}
const T0 = qu.filter((e) => e !== Pe || e !== zn), I0 = Object.keys(jo).filter((e) => e !== Pe).map((e) => Object.keys(jo[e])).flat();
function z0(e) {
  const {
    values: t,
    family: r,
    canonical: n,
    givenPrefix: a = "",
    styles: o = {},
    config: i = {}
  } = e, s = r === zn, c = t.includes("fa-duotone") || t.includes("fad"), l = i.familyDefault === "duotone", f = n.prefix === "fad" || n.prefix === "fa-duotone";
  if (!s && (c || l || f) && (n.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (n.prefix = "fab"), !n.prefix && T0.includes(r) && (Object.keys(o).find((m) => I0.includes(m)) || i.autoFetchSvg)) {
    const m = F1.get(r).defaultShortPrefixId;
    n.prefix = m, n.iconName = Tt(n.prefix, n.iconName) || n.iconName;
  }
  return (n.prefix === "fa" || a === "fa") && (n.prefix = At() || "fas"), n;
}
class M0 {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
      r[n] = arguments[n];
    const a = r.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = _(_({}, this.definitions[o] || {}), a[o]), Lo(o, a[o]);
      const i = ji[Pe][o];
      i && Lo(i, a[o]), sd();
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
      t[o] || (t[o] = {}), c.length > 0 && c.forEach((l) => {
        typeof l == "string" && (t[o][l] = s);
      }), t[o][i] = s;
    }), t;
  }
}
let Ql = [], Ht = {};
const tr = {}, R0 = Object.keys(tr);
function _0(e, t) {
  let {
    mixoutsTo: r
  } = t;
  return Ql = e, Ht = {}, Object.keys(tr).forEach((n) => {
    R0.indexOf(n) === -1 && delete tr[n];
  }), Ql.forEach((n) => {
    const a = n.mixout ? n.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (r[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((i) => {
        r[o] || (r[o] = {}), r[o][i] = a[o][i];
      });
    }), n.hooks) {
      const o = n.hooks();
      Object.keys(o).forEach((i) => {
        Ht[i] || (Ht[i] = []), Ht[i].push(o[i]);
      });
    }
    n.provides && n.provides(tr);
  }), r;
}
function Do(e, t) {
  for (var r = arguments.length, n = new Array(r > 2 ? r - 2 : 0), a = 2; a < r; a++)
    n[a - 2] = arguments[a];
  return (Ht[e] || []).forEach((i) => {
    t = i.apply(null, [t, ...n]);
  }), t;
}
function Dt(e) {
  for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++)
    r[n - 1] = arguments[n];
  (Ht[e] || []).forEach((o) => {
    o.apply(null, r);
  });
}
function Pt() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return tr[e] ? tr[e].apply(null, t) : void 0;
}
function Wo(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const r = e.prefix || At();
  if (t)
    return t = Tt(r, t) || t, Kl(fd.definitions, r, t) || Kl(Ye.styles, r, t);
}
const fd = new M0(), F0 = () => {
  D.autoReplaceSvg = !1, D.observeMutations = !1, Dt("noAuto");
}, L0 = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return nt ? (Dt("beforeI2svg", e), Pt("pseudoElements2svg", e), Pt("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    D.autoReplaceSvg === !1 && (D.autoReplaceSvg = !0), D.observeMutations = !0, x0(() => {
      W0({
        autoReplaceSvgRoot: t
      }), Dt("watch", e);
    });
  }
}, D0 = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Tt(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], r = Rn(e[0]);
      return {
        prefix: r,
        iconName: Tt(r, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(D.cssPrefix, "-")) > -1 || e.match(o0))) {
      const t = _n(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || At(),
        iconName: Tt(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = At();
      return {
        prefix: t,
        iconName: Tt(t, e) || e
      };
    }
  }
}, Te = {
  noAuto: F0,
  config: D,
  dom: L0,
  parse: D0,
  library: fd,
  findIconDefinition: Wo,
  toHtml: Wr
}, W0 = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = ke
  } = e;
  (Object.keys(Ye.styles).length > 0 || D.autoFetchSvg) && nt && D.autoReplaceSvg && Te.dom.i2svg({
    node: t
  });
};
function Fn(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((r) => Wr(r));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!nt) return;
      const r = ke.createElement("div");
      return r.innerHTML = e.html, r.children;
    }
  }), e;
}
function Y0(e) {
  let {
    children: t,
    main: r,
    mask: n,
    attributes: a,
    styles: o,
    transform: i
  } = e;
  if (Ii(i) && r.found && !n.found) {
    const {
      width: s,
      height: c
    } = r, l = {
      x: s / c / 2,
      y: 0.5
    };
    a.style = Mn(_(_({}, o), {}, {
      "transform-origin": "".concat(l.x + i.x / 16, "em ").concat(l.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function q0(e) {
  let {
    prefix: t,
    iconName: r,
    children: n,
    attributes: a,
    symbol: o
  } = e;
  const i = o === !0 ? "".concat(t, "-").concat(D.cssPrefix, "-").concat(r) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: _(_({}, a), {}, {
        id: i
      }),
      children: n
    }]
  }];
}
function Ri(e) {
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
    titleId: l,
    extra: f,
    watchable: u = !1
  } = e, {
    width: m,
    height: v
  } = r.found ? r : t, w = q1.includes(n), h = [D.replacementClass, a ? "".concat(D.cssPrefix, "-").concat(a) : ""].filter((p) => f.classes.indexOf(p) === -1).filter((p) => p !== "" || !!p).concat(f.classes).join(" ");
  let g = {
    children: [],
    attributes: _(_({}, f.attributes), {}, {
      "data-prefix": n,
      "data-icon": a,
      class: h,
      role: f.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(m, " ").concat(v)
    })
  };
  const x = w && !~f.classes.indexOf("fa-fw") ? {
    width: "".concat(m / v * 16 * 0.0625, "em")
  } : {};
  u && (g.attributes[Lt] = ""), s && (g.children.push({
    tag: "title",
    attributes: {
      id: g.attributes["aria-labelledby"] || "title-".concat(l || zr())
    },
    children: [s]
  }), delete g.attributes.title);
  const k = _(_({}, g), {}, {
    prefix: n,
    iconName: a,
    main: t,
    mask: r,
    maskId: c,
    transform: o,
    symbol: i,
    styles: _(_({}, x), f.styles)
  }), {
    children: S,
    attributes: O
  } = r.found && t.found ? Pt("generateAbstractMask", k) || {
    children: [],
    attributes: {}
  } : Pt("generateAbstractIcon", k) || {
    children: [],
    attributes: {}
  };
  return k.children = S, k.attributes = O, i ? q0(k) : Y0(k);
}
function ec(e) {
  const {
    content: t,
    width: r,
    height: n,
    transform: a,
    title: o,
    extra: i,
    watchable: s = !1
  } = e, c = _(_(_({}, i.attributes), o ? {
    title: o
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[Lt] = "");
  const l = _({}, i.styles);
  Ii(a) && (l.transform = h0({
    transform: a,
    startCentered: !0,
    width: r,
    height: n
  }), l["-webkit-transform"] = l.transform);
  const f = Mn(l);
  f.length > 0 && (c.style = f);
  const u = [];
  return u.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), o && u.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), u;
}
function G0(e) {
  const {
    content: t,
    title: r,
    extra: n
  } = e, a = _(_(_({}, n.attributes), r ? {
    title: r
  } : {}), {}, {
    class: n.classes.join(" ")
  }), o = Mn(n.styles);
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
  styles: Ia
} = Ye;
function Yo(e) {
  const t = e[0], r = e[1], [n] = e.slice(4);
  let a = null;
  return Array.isArray(n) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(D.cssPrefix, "-").concat(Na.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(D.cssPrefix, "-").concat(Na.SECONDARY),
        fill: "currentColor",
        d: n[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(D.cssPrefix, "-").concat(Na.PRIMARY),
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
const U0 = {
  found: !1,
  width: 512,
  height: 512
};
function V0(e, t) {
  !Hu && !D.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function qo(e, t) {
  let r = t;
  return t === "fa" && D.styleDefault !== null && (t = At()), new Promise((n, a) => {
    if (r === "fa") {
      const o = ld(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && Ia[t] && Ia[t][e]) {
      const o = Ia[t][e];
      return n(Yo(o));
    }
    V0(e, t), n(_(_({}, U0), {}, {
      icon: D.showMissingIcons && e ? Pt("missingIconAbstract") || {} : {}
    }));
  });
}
const tc = () => {
}, Go = D.measurePerformance && Kr && Kr.mark && Kr.measure ? Kr : {
  mark: tc,
  measure: tc
}, kr = 'FA "6.7.2"', H0 = (e) => (Go.mark("".concat(kr, " ").concat(e, " begins")), () => ud(e)), ud = (e) => {
  Go.mark("".concat(kr, " ").concat(e, " ends")), Go.measure("".concat(kr, " ").concat(e), "".concat(kr, " ").concat(e, " begins"), "".concat(kr, " ").concat(e, " ends"));
};
var _i = {
  begin: H0,
  end: ud
};
const sn = () => {
};
function rc(e) {
  return typeof (e.getAttribute ? e.getAttribute(Lt) : null) == "string";
}
function B0(e) {
  const t = e.getAttribute ? e.getAttribute(Ci) : null, r = e.getAttribute ? e.getAttribute(Ni) : null;
  return t && r;
}
function X0(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(D.replacementClass);
}
function K0() {
  return D.autoReplaceSvg === !0 ? ln.replace : ln[D.autoReplaceSvg] || ln.replace;
}
function J0(e) {
  return ke.createElementNS("http://www.w3.org/2000/svg", e);
}
function Z0(e) {
  return ke.createElement(e);
}
function dd(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: r = e.tag === "svg" ? J0 : Z0
  } = t;
  if (typeof e == "string")
    return ke.createTextNode(e);
  const n = r(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    n.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    n.appendChild(dd(o, {
      ceFn: r
    }));
  }), n;
}
function Q0(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const ln = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((r) => {
        t.parentNode.insertBefore(dd(r), t);
      }), t.getAttribute(Lt) === null && D.keepOriginalSource) {
        let r = ke.createComment(Q0(t));
        t.parentNode.replaceChild(r, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], r = e[1];
    if (~Ti(t).indexOf(D.replacementClass))
      return ln.replace(e);
    const n = new RegExp("".concat(D.cssPrefix, "-.*"));
    if (delete r[0].attributes.id, r[0].attributes.class) {
      const o = r[0].attributes.class.split(" ").reduce((i, s) => (s === D.replacementClass || s.match(n) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      r[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = r.map((o) => Wr(o)).join(`
`);
    t.setAttribute(Lt, ""), t.innerHTML = a;
  }
};
function nc(e) {
  e();
}
function pd(e, t) {
  const r = typeof t == "function" ? t : sn;
  if (e.length === 0)
    r();
  else {
    let n = nc;
    D.mutateApproach === r0 && (n = Et.requestAnimationFrame || nc), n(() => {
      const a = K0(), o = _i.begin("mutate");
      e.map(a), o(), r();
    });
  }
}
let Fi = !1;
function md() {
  Fi = !0;
}
function Uo() {
  Fi = !1;
}
let bn = null;
function ac(e) {
  if (!Gl || !D.observeMutations)
    return;
  const {
    treeCallback: t = sn,
    nodeCallback: r = sn,
    pseudoElementsCallback: n = sn,
    observeMutationsRoot: a = ke
  } = e;
  bn = new Gl((o) => {
    if (Fi) return;
    const i = At();
    ur(o).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !rc(s.addedNodes[0]) && (D.searchPseudoElements && n(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && D.searchPseudoElements && n(s.target.parentNode), s.type === "attributes" && rc(s.target) && ~l0.indexOf(s.attributeName))
        if (s.attributeName === "class" && B0(s.target)) {
          const {
            prefix: c,
            iconName: l
          } = _n(Ti(s.target));
          s.target.setAttribute(Ci, c || i), l && s.target.setAttribute(Ni, l);
        } else X0(s.target) && r(s.target);
    });
  }), nt && bn.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function ex() {
  bn && bn.disconnect();
}
function tx(e) {
  const t = e.getAttribute("style");
  let r = [];
  return t && (r = t.split(";").reduce((n, a) => {
    const o = a.split(":"), i = o[0], s = o.slice(1);
    return i && s.length > 0 && (n[i] = s.join(":").trim()), n;
  }, {})), r;
}
function rx(e) {
  const t = e.getAttribute("data-prefix"), r = e.getAttribute("data-icon"), n = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = _n(Ti(e));
  return a.prefix || (a.prefix = At()), t && r && (a.prefix = t, a.iconName = r), a.iconName && a.prefix || (a.prefix && n.length > 0 && (a.iconName = P0(a.prefix, e.innerText) || Mi(a.prefix, Fo(e.innerText))), !a.iconName && D.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function nx(e) {
  const t = ur(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), r = e.getAttribute("title"), n = e.getAttribute("data-fa-title-id");
  return D.autoA11y && (r ? t["aria-labelledby"] = "".concat(D.replacementClass, "-title-").concat(n || zr()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function ax() {
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
function oc(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: r,
    prefix: n,
    rest: a
  } = rx(e), o = nx(e), i = Do("parseNodeAttributes", {}, e);
  let s = t.styleParser ? tx(e) : [];
  return _({
    iconName: r,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: n,
    transform: We,
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
  styles: ox
} = Ye;
function gd(e) {
  const t = D.autoReplaceSvg === "nest" ? oc(e, {
    styleParser: !1
  }) : oc(e);
  return ~t.extra.classes.indexOf(Xu) ? Pt("generateLayersText", e, t) : Pt("generateSvgReplacementMutation", e, t);
}
function ix() {
  return [...D1, ...To];
}
function ic(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!nt) return Promise.resolve();
  const r = ke.documentElement.classList, n = (f) => r.add("".concat(Hl, "-").concat(f)), a = (f) => r.remove("".concat(Hl, "-").concat(f)), o = D.autoFetchSvg ? ix() : Yu.concat(Object.keys(ox));
  o.includes("fa") || o.push("fa");
  const i = [".".concat(Xu, ":not([").concat(Lt, "])")].concat(o.map((f) => ".".concat(f, ":not([").concat(Lt, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = ur(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    n("pending"), a("complete");
  else
    return Promise.resolve();
  const c = _i.begin("onTree"), l = s.reduce((f, u) => {
    try {
      const m = gd(u);
      m && f.push(m);
    } catch (m) {
      Hu || m.name === "MissingIcon" && console.error(m);
    }
    return f;
  }, []);
  return new Promise((f, u) => {
    Promise.all(l).then((m) => {
      pd(m, () => {
        n("active"), n("complete"), a("pending"), typeof t == "function" && t(), c(), f();
      });
    }).catch((m) => {
      c(), u(m);
    });
  });
}
function sx(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  gd(e).then((r) => {
    r && pd([r], t);
  });
}
function lx(e) {
  return function(t) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const n = (t || {}).icon ? t : Wo(t || {});
    let {
      mask: a
    } = r;
    return a && (a = (a || {}).icon ? a : Wo(a || {})), e(n, _(_({}, r), {}, {
      mask: a
    }));
  };
}
const cx = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: r = We,
    symbol: n = !1,
    mask: a = null,
    maskId: o = null,
    title: i = null,
    titleId: s = null,
    classes: c = [],
    attributes: l = {},
    styles: f = {}
  } = t;
  if (!e) return;
  const {
    prefix: u,
    iconName: m,
    icon: v
  } = e;
  return Fn(_({
    type: "icon"
  }, e), () => (Dt("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), D.autoA11y && (i ? l["aria-labelledby"] = "".concat(D.replacementClass, "-title-").concat(s || zr()) : (l["aria-hidden"] = "true", l.focusable = "false")), Ri({
    icons: {
      main: Yo(v),
      mask: a ? Yo(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: u,
    iconName: m,
    transform: _(_({}, We), r),
    symbol: n,
    title: i,
    maskId: o,
    titleId: s,
    extra: {
      attributes: l,
      styles: f,
      classes: c
    }
  })));
};
var fx = {
  mixout() {
    return {
      icon: lx(cx)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = ic, e.nodeCallback = sx, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: r = ke,
        callback: n = () => {
        }
      } = t;
      return ic(r, n);
    }, e.generateSvgReplacementMutation = function(t, r) {
      const {
        iconName: n,
        title: a,
        titleId: o,
        prefix: i,
        transform: s,
        symbol: c,
        mask: l,
        maskId: f,
        extra: u
      } = r;
      return new Promise((m, v) => {
        Promise.all([qo(n, i), l.iconName ? qo(l.iconName, l.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((w) => {
          let [h, g] = w;
          m([t, Ri({
            icons: {
              main: h,
              mask: g
            },
            prefix: i,
            iconName: n,
            transform: s,
            symbol: c,
            maskId: f,
            title: a,
            titleId: o,
            extra: u,
            watchable: !0
          })]);
        }).catch(v);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: r,
        attributes: n,
        main: a,
        transform: o,
        styles: i
      } = t;
      const s = Mn(i);
      s.length > 0 && (n.style = s);
      let c;
      return Ii(o) && (c = Pt("generateAbstractTransformGrouping", {
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
}, ux = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: r = []
        } = t;
        return Fn({
          type: "layer"
        }, () => {
          Dt("beforeDOMElementCreation", {
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
              class: ["".concat(D.cssPrefix, "-layers"), ...r].join(" ")
            },
            children: n
          }];
        });
      }
    };
  }
}, dx = {
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
        return Fn({
          type: "counter",
          content: e
        }, () => (Dt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), G0({
          content: e.toString(),
          title: r,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(D.cssPrefix, "-layers-counter"), ...n]
          }
        })));
      }
    };
  }
}, px = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: r = We,
          title: n = null,
          classes: a = [],
          attributes: o = {},
          styles: i = {}
        } = t;
        return Fn({
          type: "text",
          content: e
        }, () => (Dt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), ec({
          content: e,
          transform: _(_({}, We), r),
          title: n,
          extra: {
            attributes: o,
            styles: i,
            classes: ["".concat(D.cssPrefix, "-layers-text"), ...a]
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
      if (Du) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), l = t.getBoundingClientRect();
        i = l.width / c, s = l.height / c;
      }
      return D.autoA11y && !n && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, ec({
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
const mx = new RegExp('"', "ug"), sc = [1105920, 1112319], lc = _(_(_(_({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), _1), e0), H1), Vo = Object.keys(lc).reduce((e, t) => (e[t.toLowerCase()] = lc[t], e), {}), gx = Object.keys(Vo).reduce((e, t) => {
  const r = Vo[t];
  return e[t] = r[900] || [...Object.entries(r)][0][1], e;
}, {});
function bx(e) {
  const t = e.replace(mx, ""), r = k0(t, 0), n = r >= sc[0] && r <= sc[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: Fo(a ? t[0] : t),
    isSecondary: n || a
  };
}
function hx(e, t) {
  const r = e.replace(/^['"]|['"]$/g, "").toLowerCase(), n = parseInt(t), a = isNaN(n) ? "normal" : n;
  return (Vo[r] || {})[a] || gx[r];
}
function cc(e, t) {
  const r = "".concat(t0).concat(t.replace(":", "-"));
  return new Promise((n, a) => {
    if (e.getAttribute(r) !== null)
      return n();
    const i = ur(e.children).filter((m) => m.getAttribute(zo) === t)[0], s = Et.getComputedStyle(e, t), c = s.getPropertyValue("font-family"), l = c.match(i0), f = s.getPropertyValue("font-weight"), u = s.getPropertyValue("content");
    if (i && !l)
      return e.removeChild(i), n();
    if (l && u !== "none" && u !== "") {
      const m = s.getPropertyValue("content");
      let v = hx(c, f);
      const {
        value: w,
        isSecondary: h
      } = bx(m), g = l[0].startsWith("FontAwesome");
      let x = Mi(v, w), k = x;
      if (g) {
        const S = $0(w);
        S.iconName && S.prefix && (x = S.iconName, v = S.prefix);
      }
      if (x && !h && (!i || i.getAttribute(Ci) !== v || i.getAttribute(Ni) !== k)) {
        e.setAttribute(r, k), i && e.removeChild(i);
        const S = ax(), {
          extra: O
        } = S;
        O.attributes[zo] = t, qo(x, v).then((p) => {
          const Y = Ri(_(_({}, S), {}, {
            icons: {
              main: p,
              mask: cd()
            },
            prefix: v,
            iconName: k,
            extra: O,
            watchable: !0
          })), V = ke.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(V, e.firstChild) : e.appendChild(V), V.outerHTML = Y.map((oe) => Wr(oe)).join(`
`), e.removeAttribute(r), n();
        }).catch(a);
      } else
        n();
    } else
      n();
  });
}
function yx(e) {
  return Promise.all([cc(e, "::before"), cc(e, "::after")]);
}
function vx(e) {
  return e.parentNode !== document.head && !~n0.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(zo) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function fc(e) {
  if (nt)
    return new Promise((t, r) => {
      const n = ur(e.querySelectorAll("*")).filter(vx).map(yx), a = _i.begin("searchPseudoElements");
      md(), Promise.all(n).then(() => {
        a(), Uo(), t();
      }).catch(() => {
        a(), Uo(), r();
      });
    });
}
var xx = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = fc, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: r = ke
      } = t;
      D.searchPseudoElements && fc(r);
    };
  }
};
let uc = !1;
var wx = {
  mixout() {
    return {
      dom: {
        unwatch() {
          md(), uc = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        ac(Do("mutationObserverCallbacks", {}));
      },
      noAuto() {
        ex();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        uc ? Uo() : ac(Do("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const dc = (e) => {
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
var kx = {
  mixout() {
    return {
      parse: {
        transform: (e) => dc(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-transform");
        return r && (e.transform = dc(r)), e;
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
      }, s = "translate(".concat(n.x * 32, ", ").concat(n.y * 32, ") "), c = "scale(".concat(n.size / 16 * (n.flipX ? -1 : 1), ", ").concat(n.size / 16 * (n.flipY ? -1 : 1), ") "), l = "rotate(".concat(n.rotate, " 0 0)"), f = {
        transform: "".concat(s, " ").concat(c, " ").concat(l)
      }, u = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, m = {
        outer: i,
        inner: f,
        path: u
      };
      return {
        tag: "g",
        attributes: _({}, m.outer),
        children: [{
          tag: "g",
          attributes: _({}, m.inner),
          children: [{
            tag: r.icon.tag,
            children: r.icon.children,
            attributes: _(_({}, r.icon.attributes), m.path)
          }]
        }]
      };
    };
  }
};
const za = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function pc(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function Ox(e) {
  return e.tag === "g" ? e.children : [e];
}
var Sx = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-mask"), n = r ? _n(r.split(" ").map((a) => a.trim())) : cd();
        return n.prefix || (n.prefix = At()), e.mask = n, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        icon: l
      } = a, {
        width: f,
        icon: u
      } = o, m = b0({
        transform: s,
        containerWidth: f,
        iconWidth: c
      }), v = {
        tag: "rect",
        attributes: _(_({}, za), {}, {
          fill: "white"
        })
      }, w = l.children ? {
        children: l.children.map(pc)
      } : {}, h = {
        tag: "g",
        attributes: _({}, m.inner),
        children: [pc(_({
          tag: l.tag,
          attributes: _(_({}, l.attributes), m.path)
        }, w))]
      }, g = {
        tag: "g",
        attributes: _({}, m.outer),
        children: [h]
      }, x = "mask-".concat(i || zr()), k = "clip-".concat(i || zr()), S = {
        tag: "mask",
        attributes: _(_({}, za), {}, {
          id: x,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [v, g]
      }, O = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: k
          },
          children: Ox(u)
        }, S]
      };
      return r.push(O, {
        tag: "rect",
        attributes: _({
          fill: "currentColor",
          "clip-path": "url(#".concat(k, ")"),
          mask: "url(#".concat(x, ")")
        }, za)
      }), {
        children: r,
        attributes: n
      };
    };
  }
}, Ex = {
  provides(e) {
    let t = !1;
    Et.matchMedia && (t = Et.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const r = [], n = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      r.push({
        tag: "path",
        attributes: _(_({}, n), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = _(_({}, a), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: _(_({}, n), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: _(_({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: _(_({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), r.push(i), r.push({
        tag: "path",
        attributes: _(_({}, n), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: _(_({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || r.push({
        tag: "path",
        attributes: _(_({}, n), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: _(_({}, o), {}, {
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
}, Ax = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-symbol"), n = r === null ? !1 : r === "" ? !0 : r;
        return e.symbol = n, e;
      }
    };
  }
}, Px = [v0, fx, ux, dx, px, xx, wx, kx, Sx, Ex, Ax];
_0(Px, {
  mixoutsTo: Te
});
Te.noAuto;
Te.config;
Te.library;
Te.dom;
const Ho = Te.parse;
Te.findIconDefinition;
Te.toHtml;
const $x = Te.icon;
Te.layer;
Te.text;
Te.counter;
var Zr = { exports: {} }, Qr = { exports: {} }, ue = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var mc;
function Cx() {
  if (mc) return ue;
  mc = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, u = e ? Symbol.for("react.suspense") : 60113, m = e ? Symbol.for("react.suspense_list") : 60120, v = e ? Symbol.for("react.memo") : 60115, w = e ? Symbol.for("react.lazy") : 60116, h = e ? Symbol.for("react.block") : 60121, g = e ? Symbol.for("react.fundamental") : 60117, x = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
  function S(p) {
    if (typeof p == "object" && p !== null) {
      var Y = p.$$typeof;
      switch (Y) {
        case t:
          switch (p = p.type, p) {
            case c:
            case l:
            case n:
            case o:
            case a:
            case u:
              return p;
            default:
              switch (p = p && p.$$typeof, p) {
                case s:
                case f:
                case w:
                case v:
                case i:
                  return p;
                default:
                  return Y;
              }
          }
        case r:
          return Y;
      }
    }
  }
  function O(p) {
    return S(p) === l;
  }
  return ue.AsyncMode = c, ue.ConcurrentMode = l, ue.ContextConsumer = s, ue.ContextProvider = i, ue.Element = t, ue.ForwardRef = f, ue.Fragment = n, ue.Lazy = w, ue.Memo = v, ue.Portal = r, ue.Profiler = o, ue.StrictMode = a, ue.Suspense = u, ue.isAsyncMode = function(p) {
    return O(p) || S(p) === c;
  }, ue.isConcurrentMode = O, ue.isContextConsumer = function(p) {
    return S(p) === s;
  }, ue.isContextProvider = function(p) {
    return S(p) === i;
  }, ue.isElement = function(p) {
    return typeof p == "object" && p !== null && p.$$typeof === t;
  }, ue.isForwardRef = function(p) {
    return S(p) === f;
  }, ue.isFragment = function(p) {
    return S(p) === n;
  }, ue.isLazy = function(p) {
    return S(p) === w;
  }, ue.isMemo = function(p) {
    return S(p) === v;
  }, ue.isPortal = function(p) {
    return S(p) === r;
  }, ue.isProfiler = function(p) {
    return S(p) === o;
  }, ue.isStrictMode = function(p) {
    return S(p) === a;
  }, ue.isSuspense = function(p) {
    return S(p) === u;
  }, ue.isValidElementType = function(p) {
    return typeof p == "string" || typeof p == "function" || p === n || p === l || p === o || p === a || p === u || p === m || typeof p == "object" && p !== null && (p.$$typeof === w || p.$$typeof === v || p.$$typeof === i || p.$$typeof === s || p.$$typeof === f || p.$$typeof === g || p.$$typeof === x || p.$$typeof === k || p.$$typeof === h);
  }, ue.typeOf = S, ue;
}
var de = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var gc;
function Nx() {
  return gc || (gc = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, u = e ? Symbol.for("react.suspense") : 60113, m = e ? Symbol.for("react.suspense_list") : 60120, v = e ? Symbol.for("react.memo") : 60115, w = e ? Symbol.for("react.lazy") : 60116, h = e ? Symbol.for("react.block") : 60121, g = e ? Symbol.for("react.fundamental") : 60117, x = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
    function S(y) {
      return typeof y == "string" || typeof y == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      y === n || y === l || y === o || y === a || y === u || y === m || typeof y == "object" && y !== null && (y.$$typeof === w || y.$$typeof === v || y.$$typeof === i || y.$$typeof === s || y.$$typeof === f || y.$$typeof === g || y.$$typeof === x || y.$$typeof === k || y.$$typeof === h);
    }
    function O(y) {
      if (typeof y == "object" && y !== null) {
        var ge = y.$$typeof;
        switch (ge) {
          case t:
            var $e = y.type;
            switch ($e) {
              case c:
              case l:
              case n:
              case o:
              case a:
              case u:
                return $e;
              default:
                var at = $e && $e.$$typeof;
                switch (at) {
                  case s:
                  case f:
                  case w:
                  case v:
                  case i:
                    return at;
                  default:
                    return ge;
                }
            }
          case r:
            return ge;
        }
      }
    }
    var p = c, Y = l, V = s, oe = i, ie = t, J = f, ne = n, P = w, U = v, q = r, se = o, W = a, Q = u, ae = !1;
    function Z(y) {
      return ae || (ae = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), d(y) || O(y) === c;
    }
    function d(y) {
      return O(y) === l;
    }
    function b(y) {
      return O(y) === s;
    }
    function N(y) {
      return O(y) === i;
    }
    function A(y) {
      return typeof y == "object" && y !== null && y.$$typeof === t;
    }
    function E(y) {
      return O(y) === f;
    }
    function j(y) {
      return O(y) === n;
    }
    function $(y) {
      return O(y) === w;
    }
    function C(y) {
      return O(y) === v;
    }
    function T(y) {
      return O(y) === r;
    }
    function z(y) {
      return O(y) === o;
    }
    function I(y) {
      return O(y) === a;
    }
    function G(y) {
      return O(y) === u;
    }
    de.AsyncMode = p, de.ConcurrentMode = Y, de.ContextConsumer = V, de.ContextProvider = oe, de.Element = ie, de.ForwardRef = J, de.Fragment = ne, de.Lazy = P, de.Memo = U, de.Portal = q, de.Profiler = se, de.StrictMode = W, de.Suspense = Q, de.isAsyncMode = Z, de.isConcurrentMode = d, de.isContextConsumer = b, de.isContextProvider = N, de.isElement = A, de.isForwardRef = E, de.isFragment = j, de.isLazy = $, de.isMemo = C, de.isPortal = T, de.isProfiler = z, de.isStrictMode = I, de.isSuspense = G, de.isValidElementType = S, de.typeOf = O;
  }()), de;
}
var bc;
function bd() {
  return bc || (bc = 1, process.env.NODE_ENV === "production" ? Qr.exports = Cx() : Qr.exports = Nx()), Qr.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Ma, hc;
function jx() {
  if (hc) return Ma;
  hc = 1;
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
      var c = Object.getOwnPropertyNames(i).map(function(f) {
        return i[f];
      });
      if (c.join("") !== "0123456789")
        return !1;
      var l = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(f) {
        l[f] = f;
      }), Object.keys(Object.assign({}, l)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Ma = a() ? Object.assign : function(o, i) {
    for (var s, c = n(o), l, f = 1; f < arguments.length; f++) {
      s = Object(arguments[f]);
      for (var u in s)
        t.call(s, u) && (c[u] = s[u]);
      if (e) {
        l = e(s);
        for (var m = 0; m < l.length; m++)
          r.call(s, l[m]) && (c[l[m]] = s[l[m]]);
      }
    }
    return c;
  }, Ma;
}
var Ra, yc;
function Li() {
  if (yc) return Ra;
  yc = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return Ra = e, Ra;
}
var _a, vc;
function hd() {
  return vc || (vc = 1, _a = Function.call.bind(Object.prototype.hasOwnProperty)), _a;
}
var Fa, xc;
function Tx() {
  if (xc) return Fa;
  xc = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ Li(), r = {}, n = /* @__PURE__ */ hd();
    e = function(o) {
      var i = "Warning: " + o;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function a(o, i, s, c, l) {
    if (process.env.NODE_ENV !== "production") {
      for (var f in o)
        if (n(o, f)) {
          var u;
          try {
            if (typeof o[f] != "function") {
              var m = Error(
                (c || "React class") + ": " + s + " type `" + f + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[f] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw m.name = "Invariant Violation", m;
            }
            u = o[f](i, f, c, s, null, t);
          } catch (w) {
            u = w;
          }
          if (u && !(u instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + f + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof u + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), u instanceof Error && !(u.message in r)) {
            r[u.message] = !0;
            var v = l ? l() : "";
            e(
              "Failed " + s + " type: " + u.message + (v ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (r = {});
  }, Fa = a, Fa;
}
var La, wc;
function Ix() {
  if (wc) return La;
  wc = 1;
  var e = bd(), t = jx(), r = /* @__PURE__ */ Li(), n = /* @__PURE__ */ hd(), a = /* @__PURE__ */ Tx(), o = function() {
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
  return La = function(s, c) {
    var l = typeof Symbol == "function" && Symbol.iterator, f = "@@iterator";
    function u(d) {
      var b = d && (l && d[l] || d[f]);
      if (typeof b == "function")
        return b;
    }
    var m = "<<anonymous>>", v = {
      array: x("array"),
      bigint: x("bigint"),
      bool: x("boolean"),
      func: x("function"),
      number: x("number"),
      object: x("object"),
      string: x("string"),
      symbol: x("symbol"),
      any: k(),
      arrayOf: S,
      element: O(),
      elementType: p(),
      instanceOf: Y,
      node: J(),
      objectOf: oe,
      oneOf: V,
      oneOfType: ie,
      shape: P,
      exact: U
    };
    function w(d, b) {
      return d === b ? d !== 0 || 1 / d === 1 / b : d !== d && b !== b;
    }
    function h(d, b) {
      this.message = d, this.data = b && typeof b == "object" ? b : {}, this.stack = "";
    }
    h.prototype = Error.prototype;
    function g(d) {
      if (process.env.NODE_ENV !== "production")
        var b = {}, N = 0;
      function A(j, $, C, T, z, I, G) {
        if (T = T || m, I = I || C, G !== r) {
          if (c) {
            var y = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw y.name = "Invariant Violation", y;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ge = T + ":" + C;
            !b[ge] && // Avoid spamming the console because they are often not actionable except for lib authors
            N < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + I + "` prop on `" + T + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), b[ge] = !0, N++);
          }
        }
        return $[C] == null ? j ? $[C] === null ? new h("The " + z + " `" + I + "` is marked as required " + ("in `" + T + "`, but its value is `null`.")) : new h("The " + z + " `" + I + "` is marked as required in " + ("`" + T + "`, but its value is `undefined`.")) : null : d($, C, T, z, I);
      }
      var E = A.bind(null, !1);
      return E.isRequired = A.bind(null, !0), E;
    }
    function x(d) {
      function b(N, A, E, j, $, C) {
        var T = N[A], z = W(T);
        if (z !== d) {
          var I = Q(T);
          return new h(
            "Invalid " + j + " `" + $ + "` of type " + ("`" + I + "` supplied to `" + E + "`, expected ") + ("`" + d + "`."),
            { expectedType: d }
          );
        }
        return null;
      }
      return g(b);
    }
    function k() {
      return g(i);
    }
    function S(d) {
      function b(N, A, E, j, $) {
        if (typeof d != "function")
          return new h("Property `" + $ + "` of component `" + E + "` has invalid PropType notation inside arrayOf.");
        var C = N[A];
        if (!Array.isArray(C)) {
          var T = W(C);
          return new h("Invalid " + j + " `" + $ + "` of type " + ("`" + T + "` supplied to `" + E + "`, expected an array."));
        }
        for (var z = 0; z < C.length; z++) {
          var I = d(C, z, E, j, $ + "[" + z + "]", r);
          if (I instanceof Error)
            return I;
        }
        return null;
      }
      return g(b);
    }
    function O() {
      function d(b, N, A, E, j) {
        var $ = b[N];
        if (!s($)) {
          var C = W($);
          return new h("Invalid " + E + " `" + j + "` of type " + ("`" + C + "` supplied to `" + A + "`, expected a single ReactElement."));
        }
        return null;
      }
      return g(d);
    }
    function p() {
      function d(b, N, A, E, j) {
        var $ = b[N];
        if (!e.isValidElementType($)) {
          var C = W($);
          return new h("Invalid " + E + " `" + j + "` of type " + ("`" + C + "` supplied to `" + A + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return g(d);
    }
    function Y(d) {
      function b(N, A, E, j, $) {
        if (!(N[A] instanceof d)) {
          var C = d.name || m, T = Z(N[A]);
          return new h("Invalid " + j + " `" + $ + "` of type " + ("`" + T + "` supplied to `" + E + "`, expected ") + ("instance of `" + C + "`."));
        }
        return null;
      }
      return g(b);
    }
    function V(d) {
      if (!Array.isArray(d))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), i;
      function b(N, A, E, j, $) {
        for (var C = N[A], T = 0; T < d.length; T++)
          if (w(C, d[T]))
            return null;
        var z = JSON.stringify(d, function(G, y) {
          var ge = Q(y);
          return ge === "symbol" ? String(y) : y;
        });
        return new h("Invalid " + j + " `" + $ + "` of value `" + String(C) + "` " + ("supplied to `" + E + "`, expected one of " + z + "."));
      }
      return g(b);
    }
    function oe(d) {
      function b(N, A, E, j, $) {
        if (typeof d != "function")
          return new h("Property `" + $ + "` of component `" + E + "` has invalid PropType notation inside objectOf.");
        var C = N[A], T = W(C);
        if (T !== "object")
          return new h("Invalid " + j + " `" + $ + "` of type " + ("`" + T + "` supplied to `" + E + "`, expected an object."));
        for (var z in C)
          if (n(C, z)) {
            var I = d(C, z, E, j, $ + "." + z, r);
            if (I instanceof Error)
              return I;
          }
        return null;
      }
      return g(b);
    }
    function ie(d) {
      if (!Array.isArray(d))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var b = 0; b < d.length; b++) {
        var N = d[b];
        if (typeof N != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + ae(N) + " at index " + b + "."
          ), i;
      }
      function A(E, j, $, C, T) {
        for (var z = [], I = 0; I < d.length; I++) {
          var G = d[I], y = G(E, j, $, C, T, r);
          if (y == null)
            return null;
          y.data && n(y.data, "expectedType") && z.push(y.data.expectedType);
        }
        var ge = z.length > 0 ? ", expected one of type [" + z.join(", ") + "]" : "";
        return new h("Invalid " + C + " `" + T + "` supplied to " + ("`" + $ + "`" + ge + "."));
      }
      return g(A);
    }
    function J() {
      function d(b, N, A, E, j) {
        return q(b[N]) ? null : new h("Invalid " + E + " `" + j + "` supplied to " + ("`" + A + "`, expected a ReactNode."));
      }
      return g(d);
    }
    function ne(d, b, N, A, E) {
      return new h(
        (d || "React class") + ": " + b + " type `" + N + "." + A + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + E + "`."
      );
    }
    function P(d) {
      function b(N, A, E, j, $) {
        var C = N[A], T = W(C);
        if (T !== "object")
          return new h("Invalid " + j + " `" + $ + "` of type `" + T + "` " + ("supplied to `" + E + "`, expected `object`."));
        for (var z in d) {
          var I = d[z];
          if (typeof I != "function")
            return ne(E, j, $, z, Q(I));
          var G = I(C, z, E, j, $ + "." + z, r);
          if (G)
            return G;
        }
        return null;
      }
      return g(b);
    }
    function U(d) {
      function b(N, A, E, j, $) {
        var C = N[A], T = W(C);
        if (T !== "object")
          return new h("Invalid " + j + " `" + $ + "` of type `" + T + "` " + ("supplied to `" + E + "`, expected `object`."));
        var z = t({}, N[A], d);
        for (var I in z) {
          var G = d[I];
          if (n(d, I) && typeof G != "function")
            return ne(E, j, $, I, Q(G));
          if (!G)
            return new h(
              "Invalid " + j + " `" + $ + "` key `" + I + "` supplied to `" + E + "`.\nBad object: " + JSON.stringify(N[A], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(d), null, "  ")
            );
          var y = G(C, I, E, j, $ + "." + I, r);
          if (y)
            return y;
        }
        return null;
      }
      return g(b);
    }
    function q(d) {
      switch (typeof d) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !d;
        case "object":
          if (Array.isArray(d))
            return d.every(q);
          if (d === null || s(d))
            return !0;
          var b = u(d);
          if (b) {
            var N = b.call(d), A;
            if (b !== d.entries) {
              for (; !(A = N.next()).done; )
                if (!q(A.value))
                  return !1;
            } else
              for (; !(A = N.next()).done; ) {
                var E = A.value;
                if (E && !q(E[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function se(d, b) {
      return d === "symbol" ? !0 : b ? b["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && b instanceof Symbol : !1;
    }
    function W(d) {
      var b = typeof d;
      return Array.isArray(d) ? "array" : d instanceof RegExp ? "object" : se(b, d) ? "symbol" : b;
    }
    function Q(d) {
      if (typeof d > "u" || d === null)
        return "" + d;
      var b = W(d);
      if (b === "object") {
        if (d instanceof Date)
          return "date";
        if (d instanceof RegExp)
          return "regexp";
      }
      return b;
    }
    function ae(d) {
      var b = Q(d);
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
    function Z(d) {
      return !d.constructor || !d.constructor.name ? m : d.constructor.name;
    }
    return v.checkPropTypes = a, v.resetWarningCache = a.resetWarningCache, v.PropTypes = v, v;
  }, La;
}
var Da, kc;
function zx() {
  if (kc) return Da;
  kc = 1;
  var e = /* @__PURE__ */ Li();
  function t() {
  }
  function r() {
  }
  return r.resetWarningCache = t, Da = function() {
    function n(i, s, c, l, f, u) {
      if (u !== e) {
        var m = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw m.name = "Invariant Violation", m;
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
  }, Da;
}
var Oc;
function Mx() {
  if (Oc) return Zr.exports;
  if (Oc = 1, process.env.NODE_ENV !== "production") {
    var e = bd(), t = !0;
    Zr.exports = /* @__PURE__ */ Ix()(e.isElement, t);
  } else
    Zr.exports = /* @__PURE__ */ zx()();
  return Zr.exports;
}
var Rx = /* @__PURE__ */ Mx();
const re = /* @__PURE__ */ Iu(Rx);
function Sc(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function Re(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Sc(Object(r), !0).forEach(function(n) {
      Bt(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : Sc(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function hn(e) {
  "@babel/helpers - typeof";
  return hn = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, hn(e);
}
function Bt(e, t, r) {
  return t in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function _x(e, t) {
  if (e == null) return {};
  var r = {}, n = Object.keys(e), a, o;
  for (o = 0; o < n.length; o++)
    a = n[o], !(t.indexOf(a) >= 0) && (r[a] = e[a]);
  return r;
}
function Fx(e, t) {
  if (e == null) return {};
  var r = _x(e, t), n, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      n = o[a], !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n]);
  }
  return r;
}
function Bo(e) {
  return Lx(e) || Dx(e) || Wx(e) || Yx();
}
function Lx(e) {
  if (Array.isArray(e)) return Xo(e);
}
function Dx(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Wx(e, t) {
  if (e) {
    if (typeof e == "string") return Xo(e, t);
    var r = Object.prototype.toString.call(e).slice(8, -1);
    if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return Xo(e, t);
  }
}
function Xo(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
  return n;
}
function Yx() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function qx(e) {
  var t, r = e.beat, n = e.fade, a = e.beatFade, o = e.bounce, i = e.shake, s = e.flash, c = e.spin, l = e.spinPulse, f = e.spinReverse, u = e.pulse, m = e.fixedWidth, v = e.inverse, w = e.border, h = e.listItem, g = e.flip, x = e.size, k = e.rotation, S = e.pull, O = (t = {
    "fa-beat": r,
    "fa-fade": n,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": f,
    "fa-spin-pulse": l,
    "fa-pulse": u,
    "fa-fw": m,
    "fa-inverse": v,
    "fa-border": w,
    "fa-li": h,
    "fa-flip": g === !0,
    "fa-flip-horizontal": g === "horizontal" || g === "both",
    "fa-flip-vertical": g === "vertical" || g === "both"
  }, Bt(t, "fa-".concat(x), typeof x < "u" && x !== null), Bt(t, "fa-rotate-".concat(k), typeof k < "u" && k !== null && k !== 0), Bt(t, "fa-pull-".concat(S), typeof S < "u" && S !== null), Bt(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(O).map(function(p) {
    return O[p] ? p : null;
  }).filter(function(p) {
    return p;
  });
}
function Gx(e) {
  return e = e - 0, e === e;
}
function yd(e) {
  return Gx(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, r) {
    return r ? r.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var Ux = ["style"];
function Vx(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function Hx(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, r) {
    var n = r.indexOf(":"), a = yd(r.slice(0, n)), o = r.slice(n + 1).trim();
    return a.startsWith("webkit") ? t[Vx(a)] = o : t[a] = o, t;
  }, {});
}
function vd(e, t) {
  var r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var n = (t.children || []).map(function(c) {
    return vd(e, c);
  }), a = Object.keys(t.attributes || {}).reduce(function(c, l) {
    var f = t.attributes[l];
    switch (l) {
      case "class":
        c.attrs.className = f, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = Hx(f);
        break;
      default:
        l.indexOf("aria-") === 0 || l.indexOf("data-") === 0 ? c.attrs[l.toLowerCase()] = f : c.attrs[yd(l)] = f;
    }
    return c;
  }, {
    attrs: {}
  }), o = r.style, i = o === void 0 ? {} : o, s = Fx(r, Ux);
  return a.attrs.style = Re(Re({}, a.attrs.style), i), e.apply(void 0, [t.tag, Re(Re({}, a.attrs), s)].concat(Bo(n)));
}
var xd = !1;
try {
  xd = process.env.NODE_ENV === "production";
} catch {
}
function Bx() {
  if (!xd && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Ec(e) {
  if (e && hn(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Ho.icon)
    return Ho.icon(e);
  if (e === null)
    return null;
  if (e && hn(e) === "object" && e.prefix && e.iconName)
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
function Wa(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Bt({}, e, t) : {};
}
var Ac = {
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
}, Di = /* @__PURE__ */ Oe.forwardRef(function(e, t) {
  var r = Re(Re({}, Ac), e), n = r.icon, a = r.mask, o = r.symbol, i = r.className, s = r.title, c = r.titleId, l = r.maskId, f = Ec(n), u = Wa("classes", [].concat(Bo(qx(r)), Bo((i || "").split(" ")))), m = Wa("transform", typeof r.transform == "string" ? Ho.transform(r.transform) : r.transform), v = Wa("mask", Ec(a)), w = $x(f, Re(Re(Re(Re({}, u), m), v), {}, {
    symbol: o,
    title: s,
    titleId: c,
    maskId: l
  }));
  if (!w)
    return Bx("Could not find icon", f), null;
  var h = w.abstract, g = {
    ref: t
  };
  return Object.keys(r).forEach(function(x) {
    Ac.hasOwnProperty(x) || (g[x] = r[x]);
  }), Xx(h[0], g);
});
Di.displayName = "FontAwesomeIcon";
Di.propTypes = {
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
var Xx = vd.bind(null, Oe.createElement);
const Qx = ({
  onSearchChange: e,
  placeholder: t = "Search...",
  searchTerm: r = "",
  showFilters: n = !1
}) => {
  const a = Se(null), [o, i] = Ie(r), [s, c] = Ie(r.length > 0);
  zt(() => {
    i(r), c(r.length > 0);
  }, [r]);
  const l = bt(
    P1((m) => {
      e(m);
    }, 500),
    []
  );
  return /* @__PURE__ */ qe("div", { className: "flex gap-2", children: [
    /* @__PURE__ */ qe("div", { className: "relative grow", children: [
      /* @__PURE__ */ le(
        Sf,
        {
          ref: a,
          icon: $d,
          iconClassName: "opacity-50 pt-[11px] text-sm",
          inputClassName: "h-9 rounded-lg text-sm pr-8 pl-9",
          placeholder: t,
          className: "grow",
          value: o,
          onChange: (m) => {
            const v = m.target.value;
            i(v), c(v.length > 0), l(v);
          }
        }
      ),
      s && /* @__PURE__ */ le(
        Di,
        {
          icon: Cd,
          className: "absolute right-2.5 top-1/2 -translate-y-1/2 transform cursor-pointer opacity-50 transition-all duration-100 hover:opacity-100",
          onClick: () => {
            i(""), c(!1), e("");
          }
        }
      )
    ] }),
    n && /* @__PURE__ */ le(m1, { position: "top", content: "Filters", children: /* @__PURE__ */ le(
      cv,
      {
        icon: Ad,
        variant: "secondary",
        className: "h-9 w-9",
        iconClassName: "text-[16px]"
      }
    ) })
  ] });
};
export {
  Qx as SearchFilter
};
