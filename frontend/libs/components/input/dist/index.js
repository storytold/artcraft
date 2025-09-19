import { jsxs as ge, jsx as Q } from "react/jsx-runtime";
import Ht, { useRef as ve, useState as Jr, useEffect as Zr } from "react";
const Kt = "-", Qr = (e) => {
  const t = to(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (i) => {
      const s = i.split(Kt);
      return s[0] === "" && s.length !== 1 && s.shift(), nr(s, t) || eo(i);
    },
    getConflictingClassGroupIds: (i, s) => {
      const f = n[i] || [];
      return s && r[i] ? [...f, ...r[i]] : f;
    }
  };
}, nr = (e, t) => {
  var i;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], r = t.nextPart.get(n), o = r ? nr(e.slice(1), r) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const a = e.join(Kt);
  return (i = t.validators.find(({
    validator: s
  }) => s(a))) == null ? void 0 : i.classGroupId;
}, dn = /^\[(.+)\]$/, eo = (e) => {
  if (dn.test(e)) {
    const t = dn.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, to = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return ro(Object.entries(e.classGroups), n).forEach(([a, i]) => {
    Ot(i, r, a, t);
  }), r;
}, Ot = (e, t, n, r) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : pn(t, o);
      a.classGroupId = n;
      return;
    }
    if (typeof o == "function") {
      if (no(o)) {
        Ot(o(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: n
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      Ot(i, pn(t, a), n, r);
    });
  });
}, pn = (e, t) => {
  let n = e;
  return t.split(Kt).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, no = (e) => e.isThemeGetter, ro = (e, t) => t ? e.map(([n, r]) => {
  const o = r.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [n, o];
}) : e, oo = (e) => {
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
}, rr = "!", ao = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const f = [];
    let l = 0, c = 0, p;
    for (let b = 0; b < s.length; b++) {
      let v = s[b];
      if (l === 0) {
        if (v === o && (r || s.slice(b, b + a) === t)) {
          f.push(s.slice(c, b)), c = b + a;
          continue;
        }
        if (v === "/") {
          p = b;
          continue;
        }
      }
      v === "[" ? l++ : v === "]" && l--;
    }
    const m = f.length === 0 ? s : s.substring(c), w = m.startsWith(rr), E = w ? m.substring(1) : m, y = p && p > c ? p - c : void 0;
    return {
      modifiers: f,
      hasImportantModifier: w,
      baseClassName: E,
      maybePostfixModifierPosition: y
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, so = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, io = (e) => ({
  cache: oo(e.cacheSize),
  parseClassName: ao(e),
  ...Qr(e)
}), lo = /\s+/, co = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(lo);
  let s = "";
  for (let f = i.length - 1; f >= 0; f -= 1) {
    const l = i[f], {
      modifiers: c,
      hasImportantModifier: p,
      baseClassName: m,
      maybePostfixModifierPosition: w
    } = n(l);
    let E = !!w, y = r(E ? m.substring(0, w) : m);
    if (!y) {
      if (!E) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (y = r(m), !y) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      E = !1;
    }
    const b = so(c).join(":"), v = p ? b + rr : b, P = v + y;
    if (a.includes(P))
      continue;
    a.push(P);
    const C = o(y, E);
    for (let S = 0; S < C.length; ++S) {
      const g = C[S];
      a.push(v + g);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function fo() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = or(t)) && (r && (r += " "), r += n);
  return r;
}
const or = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = or(e[r])) && (n && (n += " "), n += t);
  return n;
};
function uo(e, ...t) {
  let n, r, o, a = i;
  function i(f) {
    const l = t.reduce((c, p) => p(c), e());
    return n = io(l), r = n.cache.get, o = n.cache.set, a = s, s(f);
  }
  function s(f) {
    const l = r(f);
    if (l)
      return l;
    const c = co(f, n);
    return o(f, c), c;
  }
  return function() {
    return a(fo.apply(null, arguments));
  };
}
const G = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, ar = /^\[(?:([a-z-]+):)?(.+)\]$/i, po = /^\d+\/\d+$/, mo = /* @__PURE__ */ new Set(["px", "full", "screen"]), go = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, bo = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, ho = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, yo = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, vo = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, pe = (e) => Re(e) || mo.has(e) || po.test(e), xe = (e) => Le(e, "length", Co), Re = (e) => !!e && !Number.isNaN(Number(e)), mt = (e) => Le(e, "number", Re), We = (e) => !!e && Number.isInteger(Number(e)), xo = (e) => e.endsWith("%") && Re(e.slice(0, -1)), O = (e) => ar.test(e), we = (e) => go.test(e), wo = /* @__PURE__ */ new Set(["length", "size", "percentage"]), ko = (e) => Le(e, wo, sr), Ao = (e) => Le(e, "position", sr), Po = /* @__PURE__ */ new Set(["image", "url"]), Eo = (e) => Le(e, Po, To), So = (e) => Le(e, "", Oo), Ye = () => !0, Le = (e, t, n) => {
  const r = ar.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, Co = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  bo.test(e) && !ho.test(e)
), sr = () => !1, Oo = (e) => yo.test(e), To = (e) => vo.test(e), Io = () => {
  const e = G("colors"), t = G("spacing"), n = G("blur"), r = G("brightness"), o = G("borderColor"), a = G("borderRadius"), i = G("borderSpacing"), s = G("borderWidth"), f = G("contrast"), l = G("grayscale"), c = G("hueRotate"), p = G("invert"), m = G("gap"), w = G("gradientColorStops"), E = G("gradientColorStopPositions"), y = G("inset"), b = G("margin"), v = G("opacity"), P = G("padding"), C = G("saturate"), S = G("scale"), g = G("sepia"), X = G("skew"), K = G("space"), N = G("translate"), V = () => ["auto", "contain", "none"], J = () => ["auto", "hidden", "clip", "visible", "scroll"], te = () => ["auto", O, t], A = () => [O, t], ae = () => ["", pe, xe], H = () => ["auto", Re, O], se = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], B = () => ["solid", "dashed", "dotted", "double", "none"], Z = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], ne = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], re = () => ["", "0", O], d = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], h = () => [Re, O];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Ye],
      spacing: [pe, xe],
      blur: ["none", "", we, O],
      brightness: h(),
      borderColor: [e],
      borderRadius: ["none", "", "full", we, O],
      borderSpacing: A(),
      borderWidth: ae(),
      contrast: h(),
      grayscale: re(),
      hueRotate: h(),
      invert: re(),
      gap: A(),
      gradientColorStops: [e],
      gradientColorStopPositions: [xo, xe],
      inset: te(),
      margin: te(),
      opacity: h(),
      padding: A(),
      saturate: h(),
      scale: h(),
      sepia: re(),
      skew: h(),
      space: A(),
      translate: A()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", O]
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
        columns: [we]
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
        object: [...se(), O]
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
        overscroll: V()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": V()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": V()
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
        inset: [y]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [y]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [y]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [y]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [y]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [y]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [y]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [y]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [y]
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
        z: ["auto", We, O]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: te()
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
        flex: ["1", "auto", "initial", "none", O]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: re()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: re()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", We, O]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Ye]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", We, O]
        }, O]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": H()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": H()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Ye]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [We, O]
        }, O]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": H()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": H()
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
        "auto-cols": ["auto", "min", "max", "fr", O]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", O]
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
        justify: ["normal", ...ne()]
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
        content: ["normal", ...ne(), "baseline"]
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
        "place-content": [...ne(), "baseline"]
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
        "space-x": [K]
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
        "space-y": [K]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", O, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [O, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [O, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [we]
        }, we]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [O, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [O, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [O, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [O, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", we, xe]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", mt]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Ye]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", O]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Re, mt]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", pe, O]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", O]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", O]
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
        "placeholder-opacity": [v]
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
        "text-opacity": [v]
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
        decoration: [...B(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", pe, xe]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", pe, O]
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
        indent: A()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", O]
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
        content: ["none", O]
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
        "bg-opacity": [v]
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
        bg: [...se(), Ao]
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
        bg: ["auto", "cover", "contain", ko]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, Eo]
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
        "border-opacity": [v]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...B(), "hidden"]
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
        "divide-opacity": [v]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: B()
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
        outline: ["", ...B()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [pe, O]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [pe, xe]
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
        "ring-opacity": [v]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [pe, xe]
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
        shadow: ["", "inner", "none", we, So]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Ye]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [v]
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
        contrast: [f]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", we, O]
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
        "hue-rotate": [c]
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
        saturate: [C]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [g]
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
        "backdrop-contrast": [f]
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
        "backdrop-hue-rotate": [c]
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
        "backdrop-opacity": [v]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [C]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [g]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", O]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: h()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", O]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: h()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", O]
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
        scale: [S]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [S]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [S]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [We, O]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [N]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [N]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [X]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [X]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", O]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", O]
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
        "scroll-m": A()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": A()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": A()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": A()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": A()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": A()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": A()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": A()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": A()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": A()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": A()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": A()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": A()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": A()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": A()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": A()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": A()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": A()
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
        "will-change": ["auto", "scroll", "contents", "transform", O]
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
        stroke: [pe, xe, mt]
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
}, le = /* @__PURE__ */ uo(Io);
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function No(e, t, n) {
  return (t = Mo(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function mn(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function u(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? mn(Object(n), !0).forEach(function(r) {
      No(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : mn(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function _o(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Mo(e) {
  var t = _o(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const gn = () => {
};
let Jt = {}, ir = {}, lr = null, cr = {
  mark: gn,
  measure: gn
};
try {
  typeof window < "u" && (Jt = window), typeof document < "u" && (ir = document), typeof MutationObserver < "u" && (lr = MutationObserver), typeof performance < "u" && (cr = performance);
} catch {
}
const {
  userAgent: bn = ""
} = Jt.navigator || {}, Ee = Jt, q = ir, hn = lr, et = cr;
Ee.document;
const ye = !!q.documentElement && !!q.head && typeof q.addEventListener == "function" && typeof q.createElement == "function", fr = ~bn.indexOf("MSIE") || ~bn.indexOf("Trident/");
var Ro = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, zo = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, ur = {
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
}, jo = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, dr = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], ee = "classic", ct = "duotone", Fo = "sharp", Lo = "sharp-duotone", pr = [ee, ct, Fo, Lo], Do = {
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
}, $o = {
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
}, Wo = /* @__PURE__ */ new Map([["classic", {
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
}]]), Yo = {
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
}, Go = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], yn = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, Uo = ["kit"], qo = {
  kit: {
    "fa-kit": "fak"
  }
}, Vo = ["fak", "fakd"], Bo = {
  kit: {
    fak: "fa-kit"
  }
}, vn = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, tt = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Xo = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Ho = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Ko = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, Jo = {
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
}, Zo = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Tt = {
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
}, Qo = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], It = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...Xo, ...Qo], ea = ["solid", "regular", "light", "thin", "duotone", "brands"], mr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ta = mr.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), na = [...Object.keys(Zo), ...ea, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", tt.GROUP, tt.SWAP_OPACITY, tt.PRIMARY, tt.SECONDARY].concat(mr.map((e) => "".concat(e, "x"))).concat(ta.map((e) => "w-".concat(e))), ra = {
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
const be = "___FONT_AWESOME___", Nt = 16, gr = "fa", br = "svg-inline--fa", Ie = "data-fa-i2svg", _t = "data-fa-pseudo-element", oa = "data-fa-pseudo-element-pending", Zt = "data-prefix", Qt = "data-icon", xn = "fontawesome-i2svg", aa = "async", sa = ["HTML", "HEAD", "STYLE", "SCRIPT"], hr = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Je(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[ee];
    }
  });
}
const yr = u({}, ur);
yr[ee] = u(u(u(u({}, {
  "fa-duotone": "duotone"
}), ur[ee]), yn.kit), yn["kit-duotone"]);
const ia = Je(yr), Mt = u({}, Yo);
Mt[ee] = u(u(u(u({}, {
  duotone: "fad"
}), Mt[ee]), vn.kit), vn["kit-duotone"]);
const wn = Je(Mt), Rt = u({}, Tt);
Rt[ee] = u(u({}, Rt[ee]), Bo.kit);
const en = Je(Rt), zt = u({}, Jo);
zt[ee] = u(u({}, zt[ee]), qo.kit);
Je(zt);
const la = Ro, vr = "fa-layers-text", ca = zo, fa = u({}, Do);
Je(fa);
const ua = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], gt = jo, da = [...Uo, ...na], Ve = Ee.FontAwesomeConfig || {};
function pa(e) {
  var t = q.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function ma(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
q && typeof q.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [n, r] = t;
  const o = ma(pa(n));
  o != null && (Ve[r] = o);
});
const xr = {
  styleDefault: "solid",
  familyDefault: ee,
  cssPrefix: gr,
  replacementClass: br,
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
Ve.familyPrefix && (Ve.cssPrefix = Ve.familyPrefix);
const Fe = u(u({}, xr), Ve);
Fe.autoReplaceSvg || (Fe.observeMutations = !1);
const k = {};
Object.keys(xr).forEach((e) => {
  Object.defineProperty(k, e, {
    enumerable: !0,
    set: function(t) {
      Fe[e] = t, Be.forEach((n) => n(k));
    },
    get: function() {
      return Fe[e];
    }
  });
});
Object.defineProperty(k, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    Fe.cssPrefix = e, Be.forEach((t) => t(k));
  },
  get: function() {
    return Fe.cssPrefix;
  }
});
Ee.FontAwesomeConfig = k;
const Be = [];
function ga(e) {
  return Be.push(e), () => {
    Be.splice(Be.indexOf(e), 1);
  };
}
const ke = Nt, ue = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function ba(e) {
  if (!e || !ye)
    return;
  const t = q.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = q.head.childNodes;
  let r = null;
  for (let o = n.length - 1; o > -1; o--) {
    const a = n[o], i = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = a);
  }
  return q.head.insertBefore(t, r), e;
}
const ha = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Xe() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += ha[Math.random() * 62 | 0];
  return t;
}
function De(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function tn(e) {
  return e.classList ? De(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function wr(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function ya(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(wr(e[n]), '" '), "").trim();
}
function ft(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function nn(e) {
  return e.size !== ue.size || e.x !== ue.x || e.y !== ue.y || e.rotate !== ue.rotate || e.flipX || e.flipY;
}
function va(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const o = {
    transform: "translate(".concat(n / 2, " 256)")
  }, a = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), f = {
    transform: "".concat(a, " ").concat(i, " ").concat(s)
  }, l = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: f,
    path: l
  };
}
function xa(e) {
  let {
    transform: t,
    width: n = Nt,
    height: r = Nt,
    startCentered: o = !1
  } = e, a = "";
  return o && fr ? a += "translate(".concat(t.x / ke - n / 2, "em, ").concat(t.y / ke - r / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / ke, "em), calc(-50% + ").concat(t.y / ke, "em)) ") : a += "translate(".concat(t.x / ke, "em, ").concat(t.y / ke, "em) "), a += "scale(".concat(t.size / ke * (t.flipX ? -1 : 1), ", ").concat(t.size / ke * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var wa = `:root, :host {
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
function kr() {
  const e = gr, t = br, n = k.cssPrefix, r = k.replacementClass;
  let o = wa;
  if (n !== e || r !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return o;
}
let kn = !1;
function bt() {
  k.autoAddCss && !kn && (ba(kr()), kn = !0);
}
var ka = {
  mixout() {
    return {
      dom: {
        css: kr,
        insertCss: bt
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        bt();
      },
      beforeI2svg() {
        bt();
      }
    };
  }
};
const he = Ee || {};
he[be] || (he[be] = {});
he[be].styles || (he[be].styles = {});
he[be].hooks || (he[be].hooks = {});
he[be].shims || (he[be].shims = []);
var de = he[be];
const Ar = [], Pr = function() {
  q.removeEventListener("DOMContentLoaded", Pr), st = 1, Ar.map((e) => e());
};
let st = !1;
ye && (st = (q.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(q.readyState), st || q.addEventListener("DOMContentLoaded", Pr));
function Aa(e) {
  ye && (st ? setTimeout(e, 0) : Ar.push(e));
}
function Ze(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? wr(e) : "<".concat(t, " ").concat(ya(n), ">").concat(r.map(Ze).join(""), "</").concat(t, ">");
}
function An(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var ht = function(t, n, r, o) {
  var a = Object.keys(t), i = a.length, s = n, f, l, c;
  for (r === void 0 ? (f = 1, c = t[a[0]]) : (f = 0, c = r); f < i; f++)
    l = a[f], c = s(c, t[l], l, t);
  return c;
};
function Pa(e) {
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
function jt(e) {
  const t = Pa(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function Ea(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), o;
  return r >= 55296 && r <= 56319 && n > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (r - 55296) * 1024 + o - 56320 + 65536 : r;
}
function Pn(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return !!r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function Ft(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, o = Pn(t);
  typeof de.hooks.addPack == "function" && !r ? de.hooks.addPack(e, Pn(t)) : de.styles[e] = u(u({}, de.styles[e] || {}), o), e === "fas" && Ft("fa", t);
}
const {
  styles: He,
  shims: Sa
} = de, Er = Object.keys(en), Ca = Er.reduce((e, t) => (e[t] = Object.keys(en[t]), e), {});
let rn = null, Sr = {}, Cr = {}, Or = {}, Tr = {}, Ir = {};
function Oa(e) {
  return ~da.indexOf(e);
}
function Ta(e, t) {
  const n = t.split("-"), r = n[0], o = n.slice(1).join("-");
  return r === e && o !== "" && !Oa(o) ? o : null;
}
const Nr = () => {
  const e = (r) => ht(He, (o, a, i) => (o[i] = ht(a, r, {}), o), {});
  Sr = e((r, o, a) => (o[3] && (r[o[3]] = a), o[2] && o[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = a;
  }), r)), Cr = e((r, o, a) => (r[a] = a, o[2] && o[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = a;
  }), r)), Ir = e((r, o, a) => {
    const i = o[2];
    return r[a] = a, i.forEach((s) => {
      r[s] = a;
    }), r;
  });
  const t = "far" in He || k.autoFetchSvg, n = ht(Sa, (r, o) => {
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
  Or = n.names, Tr = n.unicodes, rn = ut(k.styleDefault, {
    family: k.familyDefault
  });
};
ga((e) => {
  rn = ut(e.styleDefault, {
    family: k.familyDefault
  });
});
Nr();
function on(e, t) {
  return (Sr[e] || {})[t];
}
function Ia(e, t) {
  return (Cr[e] || {})[t];
}
function Te(e, t) {
  return (Ir[e] || {})[t];
}
function _r(e) {
  return Or[e] || {
    prefix: null,
    iconName: null
  };
}
function Na(e) {
  const t = Tr[e], n = on("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Se() {
  return rn;
}
const Mr = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function _a(e) {
  let t = ee;
  const n = Er.reduce((r, o) => (r[o] = "".concat(k.cssPrefix, "-").concat(o), r), {});
  return pr.forEach((r) => {
    (e.includes(n[r]) || e.some((o) => Ca[r].includes(o))) && (t = r);
  }), t;
}
function ut(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = ee
  } = t, r = ia[n][e];
  if (n === ct && !e)
    return "fad";
  const o = wn[n][e] || wn[n][r], a = e in de.styles ? e : null;
  return o || a || null;
}
function Ma(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const o = Ta(k.cssPrefix, r);
    o ? n = o : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function En(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function dt(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const o = It.concat(Ho), a = En(e.filter((p) => o.includes(p))), i = En(e.filter((p) => !It.includes(p))), s = a.filter((p) => (r = p, !dr.includes(p))), [f = null] = s, l = _a(a), c = u(u({}, Ma(i)), {}, {
    prefix: ut(f, {
      family: l
    })
  });
  return u(u(u({}, c), Fa({
    values: e,
    family: l,
    styles: He,
    config: k,
    canonical: c,
    givenPrefix: r
  })), Ra(n, r, c));
}
function Ra(e, t, n) {
  let {
    prefix: r,
    iconName: o
  } = n;
  if (e || !r || !o)
    return {
      prefix: r,
      iconName: o
    };
  const a = t === "fa" ? _r(o) : {}, i = Te(r, o);
  return o = a.iconName || i || o, r = a.prefix || r, r === "far" && !He.far && He.fas && !k.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: o
  };
}
const za = pr.filter((e) => e !== ee || e !== ct), ja = Object.keys(Tt).filter((e) => e !== ee).map((e) => Object.keys(Tt[e])).flat();
function Fa(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: o = "",
    styles: a = {},
    config: i = {}
  } = e, s = n === ct, f = t.includes("fa-duotone") || t.includes("fad"), l = i.familyDefault === "duotone", c = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (f || l || c) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && za.includes(n) && (Object.keys(a).find((m) => ja.includes(m)) || i.autoFetchSvg)) {
    const m = Wo.get(n).defaultShortPrefixId;
    r.prefix = m, r.iconName = Te(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || o === "fa") && (r.prefix = Se() || "fas"), r;
}
class La {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const o = n.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = u(u({}, this.definitions[a] || {}), o[a]), Ft(a, o[a]);
      const i = en[ee][a];
      i && Ft(i, o[a]), Nr();
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
      } = r[o], f = s[2];
      t[a] || (t[a] = {}), f.length > 0 && f.forEach((l) => {
        typeof l == "string" && (t[a][l] = s);
      }), t[a][i] = s;
    }), t;
  }
}
let Sn = [], _e = {};
const ze = {}, Da = Object.keys(ze);
function $a(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return Sn = e, _e = {}, Object.keys(ze).forEach((r) => {
    Da.indexOf(r) === -1 && delete ze[r];
  }), Sn.forEach((r) => {
    const o = r.mixout ? r.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (n[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((i) => {
        n[a] || (n[a] = {}), n[a][i] = o[a][i];
      });
    }), r.hooks) {
      const a = r.hooks();
      Object.keys(a).forEach((i) => {
        _e[i] || (_e[i] = []), _e[i].push(a[i]);
      });
    }
    r.provides && r.provides(ze);
  }), n;
}
function Lt(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), o = 2; o < n; o++)
    r[o - 2] = arguments[o];
  return (_e[e] || []).forEach((i) => {
    t = i.apply(null, [t, ...r]);
  }), t;
}
function Ne(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (_e[e] || []).forEach((a) => {
    a.apply(null, n);
  });
}
function Ce() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return ze[e] ? ze[e].apply(null, t) : void 0;
}
function Dt(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || Se();
  if (t)
    return t = Te(n, t) || t, An(Rr.definitions, n, t) || An(de.styles, n, t);
}
const Rr = new La(), Wa = () => {
  k.autoReplaceSvg = !1, k.observeMutations = !1, Ne("noAuto");
}, Ya = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return ye ? (Ne("beforeI2svg", e), Ce("pseudoElements2svg", e), Ce("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    k.autoReplaceSvg === !1 && (k.autoReplaceSvg = !0), k.observeMutations = !0, Aa(() => {
      Ua({
        autoReplaceSvgRoot: t
      }), Ne("watch", e);
    });
  }
}, Ga = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Te(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = ut(e[0]);
      return {
        prefix: n,
        iconName: Te(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(k.cssPrefix, "-")) > -1 || e.match(la))) {
      const t = dt(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Se(),
        iconName: Te(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Se();
      return {
        prefix: t,
        iconName: Te(t, e) || e
      };
    }
  }
}, ie = {
  noAuto: Wa,
  config: k,
  dom: Ya,
  parse: Ga,
  library: Rr,
  findIconDefinition: Dt,
  toHtml: Ze
}, Ua = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = q
  } = e;
  (Object.keys(de.styles).length > 0 || k.autoFetchSvg) && ye && k.autoReplaceSvg && ie.dom.i2svg({
    node: t
  });
};
function pt(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => Ze(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!ye) return;
      const n = q.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function qa(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: o,
    styles: a,
    transform: i
  } = e;
  if (nn(i) && n.found && !r.found) {
    const {
      width: s,
      height: f
    } = n, l = {
      x: s / f / 2,
      y: 0.5
    };
    o.style = ft(u(u({}, a), {}, {
      "transform-origin": "".concat(l.x + i.x / 16, "em ").concat(l.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function Va(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: o,
    symbol: a
  } = e;
  const i = a === !0 ? "".concat(t, "-").concat(k.cssPrefix, "-").concat(n) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: u(u({}, o), {}, {
        id: i
      }),
      children: r
    }]
  }];
}
function an(e) {
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
    maskId: f,
    titleId: l,
    extra: c,
    watchable: p = !1
  } = e, {
    width: m,
    height: w
  } = n.found ? n : t, E = Vo.includes(r), y = [k.replacementClass, o ? "".concat(k.cssPrefix, "-").concat(o) : ""].filter((g) => c.classes.indexOf(g) === -1).filter((g) => g !== "" || !!g).concat(c.classes).join(" ");
  let b = {
    children: [],
    attributes: u(u({}, c.attributes), {}, {
      "data-prefix": r,
      "data-icon": o,
      class: y,
      role: c.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(m, " ").concat(w)
    })
  };
  const v = E && !~c.classes.indexOf("fa-fw") ? {
    width: "".concat(m / w * 16 * 0.0625, "em")
  } : {};
  p && (b.attributes[Ie] = ""), s && (b.children.push({
    tag: "title",
    attributes: {
      id: b.attributes["aria-labelledby"] || "title-".concat(l || Xe())
    },
    children: [s]
  }), delete b.attributes.title);
  const P = u(u({}, b), {}, {
    prefix: r,
    iconName: o,
    main: t,
    mask: n,
    maskId: f,
    transform: a,
    symbol: i,
    styles: u(u({}, v), c.styles)
  }), {
    children: C,
    attributes: S
  } = n.found && t.found ? Ce("generateAbstractMask", P) || {
    children: [],
    attributes: {}
  } : Ce("generateAbstractIcon", P) || {
    children: [],
    attributes: {}
  };
  return P.children = C, P.attributes = S, i ? Va(P) : qa(P);
}
function Cn(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: o,
    title: a,
    extra: i,
    watchable: s = !1
  } = e, f = u(u(u({}, i.attributes), a ? {
    title: a
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (f[Ie] = "");
  const l = u({}, i.styles);
  nn(o) && (l.transform = xa({
    transform: o,
    startCentered: !0,
    width: n,
    height: r
  }), l["-webkit-transform"] = l.transform);
  const c = ft(l);
  c.length > 0 && (f.style = c);
  const p = [];
  return p.push({
    tag: "span",
    attributes: f,
    children: [t]
  }), a && p.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [a]
  }), p;
}
function Ba(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, o = u(u(u({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), a = ft(r.styles);
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
  styles: yt
} = de;
function $t(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let o = null;
  return Array.isArray(r) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(k.cssPrefix, "-").concat(gt.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(k.cssPrefix, "-").concat(gt.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(k.cssPrefix, "-").concat(gt.PRIMARY),
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
const Xa = {
  found: !1,
  width: 512,
  height: 512
};
function Ha(e, t) {
  !hr && !k.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Wt(e, t) {
  let n = t;
  return t === "fa" && k.styleDefault !== null && (t = Se()), new Promise((r, o) => {
    if (n === "fa") {
      const a = _r(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && yt[t] && yt[t][e]) {
      const a = yt[t][e];
      return r($t(a));
    }
    Ha(e, t), r(u(u({}, Xa), {}, {
      icon: k.showMissingIcons && e ? Ce("missingIconAbstract") || {} : {}
    }));
  });
}
const On = () => {
}, Yt = k.measurePerformance && et && et.mark && et.measure ? et : {
  mark: On,
  measure: On
}, qe = 'FA "6.7.2"', Ka = (e) => (Yt.mark("".concat(qe, " ").concat(e, " begins")), () => zr(e)), zr = (e) => {
  Yt.mark("".concat(qe, " ").concat(e, " ends")), Yt.measure("".concat(qe, " ").concat(e), "".concat(qe, " ").concat(e, " begins"), "".concat(qe, " ").concat(e, " ends"));
};
var sn = {
  begin: Ka,
  end: zr
};
const ot = () => {
};
function Tn(e) {
  return typeof (e.getAttribute ? e.getAttribute(Ie) : null) == "string";
}
function Ja(e) {
  const t = e.getAttribute ? e.getAttribute(Zt) : null, n = e.getAttribute ? e.getAttribute(Qt) : null;
  return t && n;
}
function Za(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(k.replacementClass);
}
function Qa() {
  return k.autoReplaceSvg === !0 ? at.replace : at[k.autoReplaceSvg] || at.replace;
}
function es(e) {
  return q.createElementNS("http://www.w3.org/2000/svg", e);
}
function ts(e) {
  return q.createElement(e);
}
function jr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? es : ts
  } = t;
  if (typeof e == "string")
    return q.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(a) {
    r.setAttribute(a, e.attributes[a]);
  }), (e.children || []).forEach(function(a) {
    r.appendChild(jr(a, {
      ceFn: n
    }));
  }), r;
}
function ns(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const at = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(jr(n), t);
      }), t.getAttribute(Ie) === null && k.keepOriginalSource) {
        let n = q.createComment(ns(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~tn(t).indexOf(k.replacementClass))
      return at.replace(e);
    const r = new RegExp("".concat(k.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const a = n[0].attributes.class.split(" ").reduce((i, s) => (s === k.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = n.map((a) => Ze(a)).join(`
`);
    t.setAttribute(Ie, ""), t.innerHTML = o;
  }
};
function In(e) {
  e();
}
function Fr(e, t) {
  const n = typeof t == "function" ? t : ot;
  if (e.length === 0)
    n();
  else {
    let r = In;
    k.mutateApproach === aa && (r = Ee.requestAnimationFrame || In), r(() => {
      const o = Qa(), a = sn.begin("mutate");
      e.map(o), a(), n();
    });
  }
}
let ln = !1;
function Lr() {
  ln = !0;
}
function Gt() {
  ln = !1;
}
let it = null;
function Nn(e) {
  if (!hn || !k.observeMutations)
    return;
  const {
    treeCallback: t = ot,
    nodeCallback: n = ot,
    pseudoElementsCallback: r = ot,
    observeMutationsRoot: o = q
  } = e;
  it = new hn((a) => {
    if (ln) return;
    const i = Se();
    De(a).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Tn(s.addedNodes[0]) && (k.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && k.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && Tn(s.target) && ~ua.indexOf(s.attributeName))
        if (s.attributeName === "class" && Ja(s.target)) {
          const {
            prefix: f,
            iconName: l
          } = dt(tn(s.target));
          s.target.setAttribute(Zt, f || i), l && s.target.setAttribute(Qt, l);
        } else Za(s.target) && n(s.target);
    });
  }), ye && it.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function rs() {
  it && it.disconnect();
}
function os(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, o) => {
    const a = o.split(":"), i = a[0], s = a.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function as(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = dt(tn(e));
  return o.prefix || (o.prefix = Se()), t && n && (o.prefix = t, o.iconName = n), o.iconName && o.prefix || (o.prefix && r.length > 0 && (o.iconName = Ia(o.prefix, e.innerText) || on(o.prefix, jt(e.innerText))), !o.iconName && k.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function ss(e) {
  const t = De(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return k.autoA11y && (n ? t["aria-labelledby"] = "".concat(k.replacementClass, "-title-").concat(r || Xe()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function is() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: ue,
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
function _n(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: o
  } = as(e), a = ss(e), i = Lt("parseNodeAttributes", {}, e);
  let s = t.styleParser ? os(e) : [];
  return u({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: ue,
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
  styles: ls
} = de;
function Dr(e) {
  const t = k.autoReplaceSvg === "nest" ? _n(e, {
    styleParser: !1
  }) : _n(e);
  return ~t.extra.classes.indexOf(vr) ? Ce("generateLayersText", e, t) : Ce("generateSvgReplacementMutation", e, t);
}
function cs() {
  return [...Go, ...It];
}
function Mn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!ye) return Promise.resolve();
  const n = q.documentElement.classList, r = (c) => n.add("".concat(xn, "-").concat(c)), o = (c) => n.remove("".concat(xn, "-").concat(c)), a = k.autoFetchSvg ? cs() : dr.concat(Object.keys(ls));
  a.includes("fa") || a.push("fa");
  const i = [".".concat(vr, ":not([").concat(Ie, "])")].concat(a.map((c) => ".".concat(c, ":not([").concat(Ie, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = De(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), o("complete");
  else
    return Promise.resolve();
  const f = sn.begin("onTree"), l = s.reduce((c, p) => {
    try {
      const m = Dr(p);
      m && c.push(m);
    } catch (m) {
      hr || m.name === "MissingIcon" && console.error(m);
    }
    return c;
  }, []);
  return new Promise((c, p) => {
    Promise.all(l).then((m) => {
      Fr(m, () => {
        r("active"), r("complete"), o("pending"), typeof t == "function" && t(), f(), c();
      });
    }).catch((m) => {
      f(), p(m);
    });
  });
}
function fs(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  Dr(e).then((n) => {
    n && Fr([n], t);
  });
}
function us(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : Dt(t || {});
    let {
      mask: o
    } = n;
    return o && (o = (o || {}).icon ? o : Dt(o || {})), e(r, u(u({}, n), {}, {
      mask: o
    }));
  };
}
const ds = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = ue,
    symbol: r = !1,
    mask: o = null,
    maskId: a = null,
    title: i = null,
    titleId: s = null,
    classes: f = [],
    attributes: l = {},
    styles: c = {}
  } = t;
  if (!e) return;
  const {
    prefix: p,
    iconName: m,
    icon: w
  } = e;
  return pt(u({
    type: "icon"
  }, e), () => (Ne("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), k.autoA11y && (i ? l["aria-labelledby"] = "".concat(k.replacementClass, "-title-").concat(s || Xe()) : (l["aria-hidden"] = "true", l.focusable = "false")), an({
    icons: {
      main: $t(w),
      mask: o ? $t(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: p,
    iconName: m,
    transform: u(u({}, ue), n),
    symbol: r,
    title: i,
    maskId: a,
    titleId: s,
    extra: {
      attributes: l,
      styles: c,
      classes: f
    }
  })));
};
var ps = {
  mixout() {
    return {
      icon: us(ds)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Mn, e.nodeCallback = fs, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = q,
        callback: r = () => {
        }
      } = t;
      return Mn(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: o,
        titleId: a,
        prefix: i,
        transform: s,
        symbol: f,
        mask: l,
        maskId: c,
        extra: p
      } = n;
      return new Promise((m, w) => {
        Promise.all([Wt(r, i), l.iconName ? Wt(l.iconName, l.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((E) => {
          let [y, b] = E;
          m([t, an({
            icons: {
              main: y,
              mask: b
            },
            prefix: i,
            iconName: r,
            transform: s,
            symbol: f,
            maskId: c,
            title: o,
            titleId: a,
            extra: p,
            watchable: !0
          })]);
        }).catch(w);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: o,
        transform: a,
        styles: i
      } = t;
      const s = ft(i);
      s.length > 0 && (r.style = s);
      let f;
      return nn(a) && (f = Ce("generateAbstractTransformGrouping", {
        main: o,
        transform: a,
        containerWidth: o.width,
        iconWidth: o.width
      })), n.push(f || o.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, ms = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return pt({
          type: "layer"
        }, () => {
          Ne("beforeDOMElementCreation", {
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
              class: ["".concat(k.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, gs = {
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
        return pt({
          type: "counter",
          content: e
        }, () => (Ne("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Ba({
          content: e.toString(),
          title: n,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(k.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, bs = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = ue,
          title: r = null,
          classes: o = [],
          attributes: a = {},
          styles: i = {}
        } = t;
        return pt({
          type: "text",
          content: e
        }, () => (Ne("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Cn({
          content: e,
          transform: u(u({}, ue), n),
          title: r,
          extra: {
            attributes: a,
            styles: i,
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
        extra: a
      } = n;
      let i = null, s = null;
      if (fr) {
        const f = parseInt(getComputedStyle(t).fontSize, 10), l = t.getBoundingClientRect();
        i = l.width / f, s = l.height / f;
      }
      return k.autoA11y && !r && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, Cn({
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
const hs = new RegExp('"', "ug"), Rn = [1105920, 1112319], zn = u(u(u(u({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), $o), ra), Ko), Ut = Object.keys(zn).reduce((e, t) => (e[t.toLowerCase()] = zn[t], e), {}), ys = Object.keys(Ut).reduce((e, t) => {
  const n = Ut[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function vs(e) {
  const t = e.replace(hs, ""), n = Ea(t, 0), r = n >= Rn[0] && n <= Rn[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: jt(o ? t[0] : t),
    isSecondary: r || o
  };
}
function xs(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), o = isNaN(r) ? "normal" : r;
  return (Ut[n] || {})[o] || ys[n];
}
function jn(e, t) {
  const n = "".concat(oa).concat(t.replace(":", "-"));
  return new Promise((r, o) => {
    if (e.getAttribute(n) !== null)
      return r();
    const i = De(e.children).filter((m) => m.getAttribute(_t) === t)[0], s = Ee.getComputedStyle(e, t), f = s.getPropertyValue("font-family"), l = f.match(ca), c = s.getPropertyValue("font-weight"), p = s.getPropertyValue("content");
    if (i && !l)
      return e.removeChild(i), r();
    if (l && p !== "none" && p !== "") {
      const m = s.getPropertyValue("content");
      let w = xs(f, c);
      const {
        value: E,
        isSecondary: y
      } = vs(m), b = l[0].startsWith("FontAwesome");
      let v = on(w, E), P = v;
      if (b) {
        const C = Na(E);
        C.iconName && C.prefix && (v = C.iconName, w = C.prefix);
      }
      if (v && !y && (!i || i.getAttribute(Zt) !== w || i.getAttribute(Qt) !== P)) {
        e.setAttribute(n, P), i && e.removeChild(i);
        const C = is(), {
          extra: S
        } = C;
        S.attributes[_t] = t, Wt(v, w).then((g) => {
          const X = an(u(u({}, C), {}, {
            icons: {
              main: g,
              mask: Mr()
            },
            prefix: w,
            iconName: P,
            extra: S,
            watchable: !0
          })), K = q.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(K, e.firstChild) : e.appendChild(K), K.outerHTML = X.map((N) => Ze(N)).join(`
`), e.removeAttribute(n), r();
        }).catch(o);
      } else
        r();
    } else
      r();
  });
}
function ws(e) {
  return Promise.all([jn(e, "::before"), jn(e, "::after")]);
}
function ks(e) {
  return e.parentNode !== document.head && !~sa.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(_t) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Fn(e) {
  if (ye)
    return new Promise((t, n) => {
      const r = De(e.querySelectorAll("*")).filter(ks).map(ws), o = sn.begin("searchPseudoElements");
      Lr(), Promise.all(r).then(() => {
        o(), Gt(), t();
      }).catch(() => {
        o(), Gt(), n();
      });
    });
}
var As = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Fn, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = q
      } = t;
      k.searchPseudoElements && Fn(n);
    };
  }
};
let Ln = !1;
var Ps = {
  mixout() {
    return {
      dom: {
        unwatch() {
          Lr(), Ln = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Nn(Lt("mutationObserverCallbacks", {}));
      },
      noAuto() {
        rs();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Ln ? Gt() : Nn(Lt("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Dn = (e) => {
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
var Es = {
  mixout() {
    return {
      parse: {
        transform: (e) => Dn(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = Dn(n)), e;
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
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), f = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), l = "rotate(".concat(r.rotate, " 0 0)"), c = {
        transform: "".concat(s, " ").concat(f, " ").concat(l)
      }, p = {
        transform: "translate(".concat(a / 2 * -1, " -256)")
      }, m = {
        outer: i,
        inner: c,
        path: p
      };
      return {
        tag: "g",
        attributes: u({}, m.outer),
        children: [{
          tag: "g",
          attributes: u({}, m.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: u(u({}, n.icon.attributes), m.path)
          }]
        }]
      };
    };
  }
};
const vt = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function $n(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function Ss(e) {
  return e.tag === "g" ? e.children : [e];
}
var Cs = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? dt(n.split(" ").map((o) => o.trim())) : Mr();
        return r.prefix || (r.prefix = Se()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        width: f,
        icon: l
      } = o, {
        width: c,
        icon: p
      } = a, m = va({
        transform: s,
        containerWidth: c,
        iconWidth: f
      }), w = {
        tag: "rect",
        attributes: u(u({}, vt), {}, {
          fill: "white"
        })
      }, E = l.children ? {
        children: l.children.map($n)
      } : {}, y = {
        tag: "g",
        attributes: u({}, m.inner),
        children: [$n(u({
          tag: l.tag,
          attributes: u(u({}, l.attributes), m.path)
        }, E))]
      }, b = {
        tag: "g",
        attributes: u({}, m.outer),
        children: [y]
      }, v = "mask-".concat(i || Xe()), P = "clip-".concat(i || Xe()), C = {
        tag: "mask",
        attributes: u(u({}, vt), {}, {
          id: v,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [w, b]
      }, S = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: P
          },
          children: Ss(p)
        }, C]
      };
      return n.push(S, {
        tag: "rect",
        attributes: u({
          fill: "currentColor",
          "clip-path": "url(#".concat(P, ")"),
          mask: "url(#".concat(v, ")")
        }, vt)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, Os = {
  provides(e) {
    let t = !1;
    Ee.matchMedia && (t = Ee.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: u(u({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = u(u({}, o), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: u(u({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: u(u({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: u(u({}, a), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(i), n.push({
        tag: "path",
        attributes: u(u({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: u(u({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: u(u({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: u(u({}, a), {}, {
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
}, Ts = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, Is = [ka, ps, ms, gs, bs, As, Ps, Es, Cs, Os, Ts];
$a(Is, {
  mixoutsTo: ie
});
ie.noAuto;
ie.config;
ie.library;
ie.dom;
const qt = ie.parse;
ie.findIconDefinition;
ie.toHtml;
const Ns = ie.icon;
ie.layer;
ie.text;
ie.counter;
function _s(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var nt = { exports: {} }, rt = { exports: {} }, $ = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Wn;
function Ms() {
  if (Wn) return $;
  Wn = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, f = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, c = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, m = e ? Symbol.for("react.suspense_list") : 60120, w = e ? Symbol.for("react.memo") : 60115, E = e ? Symbol.for("react.lazy") : 60116, y = e ? Symbol.for("react.block") : 60121, b = e ? Symbol.for("react.fundamental") : 60117, v = e ? Symbol.for("react.responder") : 60118, P = e ? Symbol.for("react.scope") : 60119;
  function C(g) {
    if (typeof g == "object" && g !== null) {
      var X = g.$$typeof;
      switch (X) {
        case t:
          switch (g = g.type, g) {
            case f:
            case l:
            case r:
            case a:
            case o:
            case p:
              return g;
            default:
              switch (g = g && g.$$typeof, g) {
                case s:
                case c:
                case E:
                case w:
                case i:
                  return g;
                default:
                  return X;
              }
          }
        case n:
          return X;
      }
    }
  }
  function S(g) {
    return C(g) === l;
  }
  return $.AsyncMode = f, $.ConcurrentMode = l, $.ContextConsumer = s, $.ContextProvider = i, $.Element = t, $.ForwardRef = c, $.Fragment = r, $.Lazy = E, $.Memo = w, $.Portal = n, $.Profiler = a, $.StrictMode = o, $.Suspense = p, $.isAsyncMode = function(g) {
    return S(g) || C(g) === f;
  }, $.isConcurrentMode = S, $.isContextConsumer = function(g) {
    return C(g) === s;
  }, $.isContextProvider = function(g) {
    return C(g) === i;
  }, $.isElement = function(g) {
    return typeof g == "object" && g !== null && g.$$typeof === t;
  }, $.isForwardRef = function(g) {
    return C(g) === c;
  }, $.isFragment = function(g) {
    return C(g) === r;
  }, $.isLazy = function(g) {
    return C(g) === E;
  }, $.isMemo = function(g) {
    return C(g) === w;
  }, $.isPortal = function(g) {
    return C(g) === n;
  }, $.isProfiler = function(g) {
    return C(g) === a;
  }, $.isStrictMode = function(g) {
    return C(g) === o;
  }, $.isSuspense = function(g) {
    return C(g) === p;
  }, $.isValidElementType = function(g) {
    return typeof g == "string" || typeof g == "function" || g === r || g === l || g === a || g === o || g === p || g === m || typeof g == "object" && g !== null && (g.$$typeof === E || g.$$typeof === w || g.$$typeof === i || g.$$typeof === s || g.$$typeof === c || g.$$typeof === b || g.$$typeof === v || g.$$typeof === P || g.$$typeof === y);
  }, $.typeOf = C, $;
}
var W = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Yn;
function Rs() {
  return Yn || (Yn = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, f = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, c = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, m = e ? Symbol.for("react.suspense_list") : 60120, w = e ? Symbol.for("react.memo") : 60115, E = e ? Symbol.for("react.lazy") : 60116, y = e ? Symbol.for("react.block") : 60121, b = e ? Symbol.for("react.fundamental") : 60117, v = e ? Symbol.for("react.responder") : 60118, P = e ? Symbol.for("react.scope") : 60119;
    function C(x) {
      return typeof x == "string" || typeof x == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      x === r || x === l || x === a || x === o || x === p || x === m || typeof x == "object" && x !== null && (x.$$typeof === E || x.$$typeof === w || x.$$typeof === i || x.$$typeof === s || x.$$typeof === c || x.$$typeof === b || x.$$typeof === v || x.$$typeof === P || x.$$typeof === y);
    }
    function S(x) {
      if (typeof x == "object" && x !== null) {
        var ce = x.$$typeof;
        switch (ce) {
          case t:
            var Qe = x.type;
            switch (Qe) {
              case f:
              case l:
              case r:
              case a:
              case o:
              case p:
                return Qe;
              default:
                var un = Qe && Qe.$$typeof;
                switch (un) {
                  case s:
                  case c:
                  case E:
                  case w:
                  case i:
                    return un;
                  default:
                    return ce;
                }
            }
          case n:
            return ce;
        }
      }
    }
    var g = f, X = l, K = s, N = i, V = t, J = c, te = r, A = E, ae = w, H = n, se = a, B = o, Z = p, ne = !1;
    function re(x) {
      return ne || (ne = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), d(x) || S(x) === f;
    }
    function d(x) {
      return S(x) === l;
    }
    function h(x) {
      return S(x) === s;
    }
    function j(x) {
      return S(x) === i;
    }
    function R(x) {
      return typeof x == "object" && x !== null && x.$$typeof === t;
    }
    function I(x) {
      return S(x) === c;
    }
    function F(x) {
      return S(x) === r;
    }
    function _(x) {
      return S(x) === E;
    }
    function z(x) {
      return S(x) === w;
    }
    function L(x) {
      return S(x) === n;
    }
    function Y(x) {
      return S(x) === a;
    }
    function D(x) {
      return S(x) === o;
    }
    function oe(x) {
      return S(x) === p;
    }
    W.AsyncMode = g, W.ConcurrentMode = X, W.ContextConsumer = K, W.ContextProvider = N, W.Element = V, W.ForwardRef = J, W.Fragment = te, W.Lazy = A, W.Memo = ae, W.Portal = H, W.Profiler = se, W.StrictMode = B, W.Suspense = Z, W.isAsyncMode = re, W.isConcurrentMode = d, W.isContextConsumer = h, W.isContextProvider = j, W.isElement = R, W.isForwardRef = I, W.isFragment = F, W.isLazy = _, W.isMemo = z, W.isPortal = L, W.isProfiler = Y, W.isStrictMode = D, W.isSuspense = oe, W.isValidElementType = C, W.typeOf = S;
  }()), W;
}
var Gn;
function $r() {
  return Gn || (Gn = 1, process.env.NODE_ENV === "production" ? rt.exports = Ms() : rt.exports = Rs()), rt.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var xt, Un;
function zs() {
  if (Un) return xt;
  Un = 1;
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
      var f = Object.getOwnPropertyNames(i).map(function(c) {
        return i[c];
      });
      if (f.join("") !== "0123456789")
        return !1;
      var l = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(c) {
        l[c] = c;
      }), Object.keys(Object.assign({}, l)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return xt = o() ? Object.assign : function(a, i) {
    for (var s, f = r(a), l, c = 1; c < arguments.length; c++) {
      s = Object(arguments[c]);
      for (var p in s)
        t.call(s, p) && (f[p] = s[p]);
      if (e) {
        l = e(s);
        for (var m = 0; m < l.length; m++)
          n.call(s, l[m]) && (f[l[m]] = s[l[m]]);
      }
    }
    return f;
  }, xt;
}
var wt, qn;
function cn() {
  if (qn) return wt;
  qn = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return wt = e, wt;
}
var kt, Vn;
function Wr() {
  return Vn || (Vn = 1, kt = Function.call.bind(Object.prototype.hasOwnProperty)), kt;
}
var At, Bn;
function js() {
  if (Bn) return At;
  Bn = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ cn(), n = {}, r = /* @__PURE__ */ Wr();
    e = function(a) {
      var i = "Warning: " + a;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function o(a, i, s, f, l) {
    if (process.env.NODE_ENV !== "production") {
      for (var c in a)
        if (r(a, c)) {
          var p;
          try {
            if (typeof a[c] != "function") {
              var m = Error(
                (f || "React class") + ": " + s + " type `" + c + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[c] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw m.name = "Invariant Violation", m;
            }
            p = a[c](i, c, f, s, null, t);
          } catch (E) {
            p = E;
          }
          if (p && !(p instanceof Error) && e(
            (f || "React class") + ": type specification of " + s + " `" + c + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof p + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), p instanceof Error && !(p.message in n)) {
            n[p.message] = !0;
            var w = l ? l() : "";
            e(
              "Failed " + s + " type: " + p.message + (w ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, At = o, At;
}
var Pt, Xn;
function Fs() {
  if (Xn) return Pt;
  Xn = 1;
  var e = $r(), t = zs(), n = /* @__PURE__ */ cn(), r = /* @__PURE__ */ Wr(), o = /* @__PURE__ */ js(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(s) {
    var f = "Warning: " + s;
    typeof console < "u" && console.error(f);
    try {
      throw new Error(f);
    } catch {
    }
  });
  function i() {
    return null;
  }
  return Pt = function(s, f) {
    var l = typeof Symbol == "function" && Symbol.iterator, c = "@@iterator";
    function p(d) {
      var h = d && (l && d[l] || d[c]);
      if (typeof h == "function")
        return h;
    }
    var m = "<<anonymous>>", w = {
      array: v("array"),
      bigint: v("bigint"),
      bool: v("boolean"),
      func: v("function"),
      number: v("number"),
      object: v("object"),
      string: v("string"),
      symbol: v("symbol"),
      any: P(),
      arrayOf: C,
      element: S(),
      elementType: g(),
      instanceOf: X,
      node: J(),
      objectOf: N,
      oneOf: K,
      oneOfType: V,
      shape: A,
      exact: ae
    };
    function E(d, h) {
      return d === h ? d !== 0 || 1 / d === 1 / h : d !== d && h !== h;
    }
    function y(d, h) {
      this.message = d, this.data = h && typeof h == "object" ? h : {}, this.stack = "";
    }
    y.prototype = Error.prototype;
    function b(d) {
      if (process.env.NODE_ENV !== "production")
        var h = {}, j = 0;
      function R(F, _, z, L, Y, D, oe) {
        if (L = L || m, D = D || z, oe !== n) {
          if (f) {
            var x = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw x.name = "Invariant Violation", x;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ce = L + ":" + z;
            !h[ce] && // Avoid spamming the console because they are often not actionable except for lib authors
            j < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + D + "` prop on `" + L + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), h[ce] = !0, j++);
          }
        }
        return _[z] == null ? F ? _[z] === null ? new y("The " + Y + " `" + D + "` is marked as required " + ("in `" + L + "`, but its value is `null`.")) : new y("The " + Y + " `" + D + "` is marked as required in " + ("`" + L + "`, but its value is `undefined`.")) : null : d(_, z, L, Y, D);
      }
      var I = R.bind(null, !1);
      return I.isRequired = R.bind(null, !0), I;
    }
    function v(d) {
      function h(j, R, I, F, _, z) {
        var L = j[R], Y = B(L);
        if (Y !== d) {
          var D = Z(L);
          return new y(
            "Invalid " + F + " `" + _ + "` of type " + ("`" + D + "` supplied to `" + I + "`, expected ") + ("`" + d + "`."),
            { expectedType: d }
          );
        }
        return null;
      }
      return b(h);
    }
    function P() {
      return b(i);
    }
    function C(d) {
      function h(j, R, I, F, _) {
        if (typeof d != "function")
          return new y("Property `" + _ + "` of component `" + I + "` has invalid PropType notation inside arrayOf.");
        var z = j[R];
        if (!Array.isArray(z)) {
          var L = B(z);
          return new y("Invalid " + F + " `" + _ + "` of type " + ("`" + L + "` supplied to `" + I + "`, expected an array."));
        }
        for (var Y = 0; Y < z.length; Y++) {
          var D = d(z, Y, I, F, _ + "[" + Y + "]", n);
          if (D instanceof Error)
            return D;
        }
        return null;
      }
      return b(h);
    }
    function S() {
      function d(h, j, R, I, F) {
        var _ = h[j];
        if (!s(_)) {
          var z = B(_);
          return new y("Invalid " + I + " `" + F + "` of type " + ("`" + z + "` supplied to `" + R + "`, expected a single ReactElement."));
        }
        return null;
      }
      return b(d);
    }
    function g() {
      function d(h, j, R, I, F) {
        var _ = h[j];
        if (!e.isValidElementType(_)) {
          var z = B(_);
          return new y("Invalid " + I + " `" + F + "` of type " + ("`" + z + "` supplied to `" + R + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return b(d);
    }
    function X(d) {
      function h(j, R, I, F, _) {
        if (!(j[R] instanceof d)) {
          var z = d.name || m, L = re(j[R]);
          return new y("Invalid " + F + " `" + _ + "` of type " + ("`" + L + "` supplied to `" + I + "`, expected ") + ("instance of `" + z + "`."));
        }
        return null;
      }
      return b(h);
    }
    function K(d) {
      if (!Array.isArray(d))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), i;
      function h(j, R, I, F, _) {
        for (var z = j[R], L = 0; L < d.length; L++)
          if (E(z, d[L]))
            return null;
        var Y = JSON.stringify(d, function(oe, x) {
          var ce = Z(x);
          return ce === "symbol" ? String(x) : x;
        });
        return new y("Invalid " + F + " `" + _ + "` of value `" + String(z) + "` " + ("supplied to `" + I + "`, expected one of " + Y + "."));
      }
      return b(h);
    }
    function N(d) {
      function h(j, R, I, F, _) {
        if (typeof d != "function")
          return new y("Property `" + _ + "` of component `" + I + "` has invalid PropType notation inside objectOf.");
        var z = j[R], L = B(z);
        if (L !== "object")
          return new y("Invalid " + F + " `" + _ + "` of type " + ("`" + L + "` supplied to `" + I + "`, expected an object."));
        for (var Y in z)
          if (r(z, Y)) {
            var D = d(z, Y, I, F, _ + "." + Y, n);
            if (D instanceof Error)
              return D;
          }
        return null;
      }
      return b(h);
    }
    function V(d) {
      if (!Array.isArray(d))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var h = 0; h < d.length; h++) {
        var j = d[h];
        if (typeof j != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + ne(j) + " at index " + h + "."
          ), i;
      }
      function R(I, F, _, z, L) {
        for (var Y = [], D = 0; D < d.length; D++) {
          var oe = d[D], x = oe(I, F, _, z, L, n);
          if (x == null)
            return null;
          x.data && r(x.data, "expectedType") && Y.push(x.data.expectedType);
        }
        var ce = Y.length > 0 ? ", expected one of type [" + Y.join(", ") + "]" : "";
        return new y("Invalid " + z + " `" + L + "` supplied to " + ("`" + _ + "`" + ce + "."));
      }
      return b(R);
    }
    function J() {
      function d(h, j, R, I, F) {
        return H(h[j]) ? null : new y("Invalid " + I + " `" + F + "` supplied to " + ("`" + R + "`, expected a ReactNode."));
      }
      return b(d);
    }
    function te(d, h, j, R, I) {
      return new y(
        (d || "React class") + ": " + h + " type `" + j + "." + R + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + I + "`."
      );
    }
    function A(d) {
      function h(j, R, I, F, _) {
        var z = j[R], L = B(z);
        if (L !== "object")
          return new y("Invalid " + F + " `" + _ + "` of type `" + L + "` " + ("supplied to `" + I + "`, expected `object`."));
        for (var Y in d) {
          var D = d[Y];
          if (typeof D != "function")
            return te(I, F, _, Y, Z(D));
          var oe = D(z, Y, I, F, _ + "." + Y, n);
          if (oe)
            return oe;
        }
        return null;
      }
      return b(h);
    }
    function ae(d) {
      function h(j, R, I, F, _) {
        var z = j[R], L = B(z);
        if (L !== "object")
          return new y("Invalid " + F + " `" + _ + "` of type `" + L + "` " + ("supplied to `" + I + "`, expected `object`."));
        var Y = t({}, j[R], d);
        for (var D in Y) {
          var oe = d[D];
          if (r(d, D) && typeof oe != "function")
            return te(I, F, _, D, Z(oe));
          if (!oe)
            return new y(
              "Invalid " + F + " `" + _ + "` key `" + D + "` supplied to `" + I + "`.\nBad object: " + JSON.stringify(j[R], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(d), null, "  ")
            );
          var x = oe(z, D, I, F, _ + "." + D, n);
          if (x)
            return x;
        }
        return null;
      }
      return b(h);
    }
    function H(d) {
      switch (typeof d) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !d;
        case "object":
          if (Array.isArray(d))
            return d.every(H);
          if (d === null || s(d))
            return !0;
          var h = p(d);
          if (h) {
            var j = h.call(d), R;
            if (h !== d.entries) {
              for (; !(R = j.next()).done; )
                if (!H(R.value))
                  return !1;
            } else
              for (; !(R = j.next()).done; ) {
                var I = R.value;
                if (I && !H(I[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function se(d, h) {
      return d === "symbol" ? !0 : h ? h["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && h instanceof Symbol : !1;
    }
    function B(d) {
      var h = typeof d;
      return Array.isArray(d) ? "array" : d instanceof RegExp ? "object" : se(h, d) ? "symbol" : h;
    }
    function Z(d) {
      if (typeof d > "u" || d === null)
        return "" + d;
      var h = B(d);
      if (h === "object") {
        if (d instanceof Date)
          return "date";
        if (d instanceof RegExp)
          return "regexp";
      }
      return h;
    }
    function ne(d) {
      var h = Z(d);
      switch (h) {
        case "array":
        case "object":
          return "an " + h;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + h;
        default:
          return h;
      }
    }
    function re(d) {
      return !d.constructor || !d.constructor.name ? m : d.constructor.name;
    }
    return w.checkPropTypes = o, w.resetWarningCache = o.resetWarningCache, w.PropTypes = w, w;
  }, Pt;
}
var Et, Hn;
function Ls() {
  if (Hn) return Et;
  Hn = 1;
  var e = /* @__PURE__ */ cn();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, Et = function() {
    function r(i, s, f, l, c, p) {
      if (p !== e) {
        var m = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw m.name = "Invariant Violation", m;
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
  }, Et;
}
var Kn;
function Ds() {
  if (Kn) return nt.exports;
  if (Kn = 1, process.env.NODE_ENV !== "production") {
    var e = $r(), t = !0;
    nt.exports = /* @__PURE__ */ Fs()(e.isElement, t);
  } else
    nt.exports = /* @__PURE__ */ Ls()();
  return nt.exports;
}
var $s = /* @__PURE__ */ Ds();
const M = /* @__PURE__ */ _s($s);
function Jn(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function fe(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Jn(Object(n), !0).forEach(function(r) {
      Me(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Jn(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function lt(e) {
  "@babel/helpers - typeof";
  return lt = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, lt(e);
}
function Me(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Ws(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), o, a;
  for (a = 0; a < r.length; a++)
    o = r[a], !(t.indexOf(o) >= 0) && (n[o] = e[o]);
  return n;
}
function Ys(e, t) {
  if (e == null) return {};
  var n = Ws(e, t), r, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      r = a[o], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Vt(e) {
  return Gs(e) || Us(e) || qs(e) || Vs();
}
function Gs(e) {
  if (Array.isArray(e)) return Bt(e);
}
function Us(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function qs(e, t) {
  if (e) {
    if (typeof e == "string") return Bt(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return Bt(e, t);
  }
}
function Bt(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function Vs() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Bs(e) {
  var t, n = e.beat, r = e.fade, o = e.beatFade, a = e.bounce, i = e.shake, s = e.flash, f = e.spin, l = e.spinPulse, c = e.spinReverse, p = e.pulse, m = e.fixedWidth, w = e.inverse, E = e.border, y = e.listItem, b = e.flip, v = e.size, P = e.rotation, C = e.pull, S = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": o,
    "fa-bounce": a,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": f,
    "fa-spin-reverse": c,
    "fa-spin-pulse": l,
    "fa-pulse": p,
    "fa-fw": m,
    "fa-inverse": w,
    "fa-border": E,
    "fa-li": y,
    "fa-flip": b === !0,
    "fa-flip-horizontal": b === "horizontal" || b === "both",
    "fa-flip-vertical": b === "vertical" || b === "both"
  }, Me(t, "fa-".concat(v), typeof v < "u" && v !== null), Me(t, "fa-rotate-".concat(P), typeof P < "u" && P !== null && P !== 0), Me(t, "fa-pull-".concat(C), typeof C < "u" && C !== null), Me(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(S).map(function(g) {
    return S[g] ? g : null;
  }).filter(function(g) {
    return g;
  });
}
function Xs(e) {
  return e = e - 0, e === e;
}
function Yr(e) {
  return Xs(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var Hs = ["style"];
function Ks(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function Js(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), o = Yr(n.slice(0, r)), a = n.slice(r + 1).trim();
    return o.startsWith("webkit") ? t[Ks(o)] = a : t[o] = a, t;
  }, {});
}
function Gr(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(f) {
    return Gr(e, f);
  }), o = Object.keys(t.attributes || {}).reduce(function(f, l) {
    var c = t.attributes[l];
    switch (l) {
      case "class":
        f.attrs.className = c, delete t.attributes.class;
        break;
      case "style":
        f.attrs.style = Js(c);
        break;
      default:
        l.indexOf("aria-") === 0 || l.indexOf("data-") === 0 ? f.attrs[l.toLowerCase()] = c : f.attrs[Yr(l)] = c;
    }
    return f;
  }, {
    attrs: {}
  }), a = n.style, i = a === void 0 ? {} : a, s = Ys(n, Hs);
  return o.attrs.style = fe(fe({}, o.attrs.style), i), e.apply(void 0, [t.tag, fe(fe({}, o.attrs), s)].concat(Vt(r)));
}
var Ur = !1;
try {
  Ur = process.env.NODE_ENV === "production";
} catch {
}
function Zs() {
  if (!Ur && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Zn(e) {
  if (e && lt(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (qt.icon)
    return qt.icon(e);
  if (e === null)
    return null;
  if (e && lt(e) === "object" && e.prefix && e.iconName)
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
function St(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Me({}, e, t) : {};
}
var Qn = {
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
}, Ke = /* @__PURE__ */ Ht.forwardRef(function(e, t) {
  var n = fe(fe({}, Qn), e), r = n.icon, o = n.mask, a = n.symbol, i = n.className, s = n.title, f = n.titleId, l = n.maskId, c = Zn(r), p = St("classes", [].concat(Vt(Bs(n)), Vt((i || "").split(" ")))), m = St("transform", typeof n.transform == "string" ? qt.transform(n.transform) : n.transform), w = St("mask", Zn(o)), E = Ns(c, fe(fe(fe(fe({}, p), m), w), {}, {
    symbol: a,
    title: s,
    titleId: f,
    maskId: l
  }));
  if (!E)
    return Zs("Could not find icon", c), null;
  var y = E.abstract, b = {
    ref: t
  };
  return Object.keys(n).forEach(function(v) {
    Qn.hasOwnProperty(v) || (b[v] = n[v]);
  }), Qs(y[0], b);
});
Ke.displayName = "FontAwesomeIcon";
Ke.propTypes = {
  beat: M.bool,
  border: M.bool,
  beatFade: M.bool,
  bounce: M.bool,
  className: M.string,
  fade: M.bool,
  flash: M.bool,
  mask: M.oneOfType([M.object, M.array, M.string]),
  maskId: M.string,
  fixedWidth: M.bool,
  inverse: M.bool,
  flip: M.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: M.oneOfType([M.object, M.array, M.string]),
  listItem: M.bool,
  pull: M.oneOf(["right", "left"]),
  pulse: M.bool,
  rotation: M.oneOf([0, 90, 180, 270]),
  shake: M.bool,
  size: M.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: M.bool,
  spinPulse: M.bool,
  spinReverse: M.bool,
  symbol: M.oneOfType([M.bool, M.string]),
  title: M.string,
  titleId: M.string,
  transform: M.oneOfType([M.string, M.object]),
  swapOpacity: M.bool
};
var Qs = Gr.bind(null, Ht.createElement);
const fn = "-", ei = (e) => {
  const t = ni(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(fn);
      return a[0] === "" && a.length !== 1 && a.shift(), qr(a, t) || ti(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const i = n[o] || [];
      return a && r[o] ? [...i, ...r[o]] : i;
    }
  };
}, qr = (e, t) => {
  var n;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], o = t.nextPart.get(r), a = o ? qr(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const i = e.join(fn);
  return (n = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : n.classGroupId;
}, er = /^\[(.+)\]$/, ti = (e) => {
  if (er.test(e)) {
    const t = er.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, ni = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return oi(Object.entries(e.classGroups), n).forEach(([o, a]) => {
    Xt(a, r, o, t);
  }), r;
}, Xt = (e, t, n, r) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : tr(t, o);
      a.classGroupId = n;
      return;
    }
    if (typeof o == "function") {
      if (ri(o)) {
        Xt(o(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: n
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      Xt(i, tr(t, a), n, r);
    });
  });
}, tr = (e, t) => {
  let n = e;
  return t.split(fn).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, ri = (e) => e.isThemeGetter, oi = (e, t) => t ? e.map(([n, r]) => {
  const o = r.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [n, o];
}) : e, ai = (e) => {
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
}, Vr = "!", si = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const f = [];
    let l = 0, c = 0, p;
    for (let b = 0; b < s.length; b++) {
      let v = s[b];
      if (l === 0) {
        if (v === o && (r || s.slice(b, b + a) === t)) {
          f.push(s.slice(c, b)), c = b + a;
          continue;
        }
        if (v === "/") {
          p = b;
          continue;
        }
      }
      v === "[" ? l++ : v === "]" && l--;
    }
    const m = f.length === 0 ? s : s.substring(c), w = m.startsWith(Vr), E = w ? m.substring(1) : m, y = p && p > c ? p - c : void 0;
    return {
      modifiers: f,
      hasImportantModifier: w,
      baseClassName: E,
      maybePostfixModifierPosition: y
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, ii = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, li = (e) => ({
  cache: ai(e.cacheSize),
  parseClassName: si(e),
  ...ei(e)
}), ci = /\s+/, fi = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(ci);
  let s = "";
  for (let f = i.length - 1; f >= 0; f -= 1) {
    const l = i[f], {
      modifiers: c,
      hasImportantModifier: p,
      baseClassName: m,
      maybePostfixModifierPosition: w
    } = n(l);
    let E = !!w, y = r(E ? m.substring(0, w) : m);
    if (!y) {
      if (!E) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (y = r(m), !y) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      E = !1;
    }
    const b = ii(c).join(":"), v = p ? b + Vr : b, P = v + y;
    if (a.includes(P))
      continue;
    a.push(P);
    const C = o(y, E);
    for (let S = 0; S < C.length; ++S) {
      const g = C[S];
      a.push(v + g);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function ui() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = Br(t)) && (r && (r += " "), r += n);
  return r;
}
const Br = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = Br(e[r])) && (n && (n += " "), n += t);
  return n;
};
function di(e, ...t) {
  let n, r, o, a = i;
  function i(f) {
    const l = t.reduce((c, p) => p(c), e());
    return n = li(l), r = n.cache.get, o = n.cache.set, a = s, s(f);
  }
  function s(f) {
    const l = r(f);
    if (l)
      return l;
    const c = fi(f, n);
    return o(f, c), c;
  }
  return function() {
    return a(ui.apply(null, arguments));
  };
}
const U = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, Xr = /^\[(?:([a-z-]+):)?(.+)\]$/i, pi = /^\d+\/\d+$/, mi = /* @__PURE__ */ new Set(["px", "full", "screen"]), gi = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, bi = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, hi = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, yi = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, vi = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, me = (e) => je(e) || mi.has(e) || pi.test(e), Ae = (e) => $e(e, "length", Ci), je = (e) => !!e && !Number.isNaN(Number(e)), Ct = (e) => $e(e, "number", je), Ge = (e) => !!e && Number.isInteger(Number(e)), xi = (e) => e.endsWith("%") && je(e.slice(0, -1)), T = (e) => Xr.test(e), Pe = (e) => gi.test(e), wi = /* @__PURE__ */ new Set(["length", "size", "percentage"]), ki = (e) => $e(e, wi, Hr), Ai = (e) => $e(e, "position", Hr), Pi = /* @__PURE__ */ new Set(["image", "url"]), Ei = (e) => $e(e, Pi, Ti), Si = (e) => $e(e, "", Oi), Ue = () => !0, $e = (e, t, n) => {
  const r = Xr.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, Ci = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  bi.test(e) && !hi.test(e)
), Hr = () => !1, Oi = (e) => yi.test(e), Ti = (e) => vi.test(e), Ii = () => {
  const e = U("colors"), t = U("spacing"), n = U("blur"), r = U("brightness"), o = U("borderColor"), a = U("borderRadius"), i = U("borderSpacing"), s = U("borderWidth"), f = U("contrast"), l = U("grayscale"), c = U("hueRotate"), p = U("invert"), m = U("gap"), w = U("gradientColorStops"), E = U("gradientColorStopPositions"), y = U("inset"), b = U("margin"), v = U("opacity"), P = U("padding"), C = U("saturate"), S = U("scale"), g = U("sepia"), X = U("skew"), K = U("space"), N = U("translate"), V = () => ["auto", "contain", "none"], J = () => ["auto", "hidden", "clip", "visible", "scroll"], te = () => ["auto", T, t], A = () => [T, t], ae = () => ["", me, Ae], H = () => ["auto", je, T], se = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], B = () => ["solid", "dashed", "dotted", "double", "none"], Z = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], ne = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], re = () => ["", "0", T], d = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], h = () => [je, T];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Ue],
      spacing: [me, Ae],
      blur: ["none", "", Pe, T],
      brightness: h(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Pe, T],
      borderSpacing: A(),
      borderWidth: ae(),
      contrast: h(),
      grayscale: re(),
      hueRotate: h(),
      invert: re(),
      gap: A(),
      gradientColorStops: [e],
      gradientColorStopPositions: [xi, Ae],
      inset: te(),
      margin: te(),
      opacity: h(),
      padding: A(),
      saturate: h(),
      scale: h(),
      sepia: re(),
      skew: h(),
      space: A(),
      translate: A()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", T]
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
        columns: [Pe]
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
        object: [...se(), T]
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
        overscroll: V()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": V()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": V()
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
        inset: [y]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [y]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [y]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [y]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [y]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [y]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [y]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [y]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [y]
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
        z: ["auto", Ge, T]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: te()
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
        flex: ["1", "auto", "initial", "none", T]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: re()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: re()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Ge, T]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Ue]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Ge, T]
        }, T]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": H()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": H()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Ue]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Ge, T]
        }, T]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": H()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": H()
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
        "auto-cols": ["auto", "min", "max", "fr", T]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", T]
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
        justify: ["normal", ...ne()]
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
        content: ["normal", ...ne(), "baseline"]
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
        "place-content": [...ne(), "baseline"]
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
        "space-x": [K]
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
        "space-y": [K]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", T, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [T, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [T, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Pe]
        }, Pe]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [T, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [T, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [T, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [T, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Pe, Ae]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Ct]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Ue]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", T]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", je, Ct]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", me, T]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", T]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", T]
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
        "placeholder-opacity": [v]
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
        "text-opacity": [v]
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
        decoration: [...B(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", me, Ae]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", me, T]
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
        indent: A()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", T]
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
        content: ["none", T]
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
        "bg-opacity": [v]
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
        bg: [...se(), Ai]
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
        bg: ["auto", "cover", "contain", ki]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, Ei]
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
        "border-opacity": [v]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...B(), "hidden"]
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
        "divide-opacity": [v]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: B()
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
        outline: ["", ...B()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [me, T]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [me, Ae]
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
        "ring-opacity": [v]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [me, Ae]
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
        shadow: ["", "inner", "none", Pe, Si]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Ue]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [v]
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
        contrast: [f]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", Pe, T]
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
        "hue-rotate": [c]
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
        saturate: [C]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [g]
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
        "backdrop-contrast": [f]
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
        "backdrop-hue-rotate": [c]
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
        "backdrop-opacity": [v]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [C]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [g]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", T]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: h()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", T]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: h()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", T]
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
        scale: [S]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [S]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [S]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [Ge, T]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [N]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [N]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [X]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [X]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", T]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", T]
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
        "scroll-m": A()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": A()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": A()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": A()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": A()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": A()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": A()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": A()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": A()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": A()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": A()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": A()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": A()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": A()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": A()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": A()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": A()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": A()
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
        "will-change": ["auto", "scroll", "contents", "transform", T]
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
        stroke: [me, Ae, Ct]
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
}, Ni = /* @__PURE__ */ di(Ii), _i = ({
  className: e,
  children: t,
  required: n,
  ...r
}) => /* @__PURE__ */ ge(
  "label",
  {
    className: Ni("text-base-fg mb-2 text-[15px] font-medium", e),
    ...r,
    children: [
      t,
      n && /* @__PURE__ */ Q("span", { className: "ml-0.5 text-[#ff6467]", children: "*" })
    ]
  }
), Kr = Ht.forwardRef(
  ({
    label: e,
    icon: t,
    inputClassName: n,
    iconClassName: r,
    className: o,
    id: a,
    isError: i,
    onBlur: s,
    onFocus: f,
    errorMessage: l,
    ...c
  }, p) => /* @__PURE__ */ ge("div", { className: le("flex flex-col", o), children: [
    e && /* @__PURE__ */ Q(_i, { htmlFor: a || e, children: e }),
    /* @__PURE__ */ ge("div", { className: "relative w-full", children: [
      t && /* @__PURE__ */ Q(
        Ke,
        {
          icon: t,
          className: le("text-md absolute pl-3 pt-3", r)
        }
      ),
      /* @__PURE__ */ Q(
        "input",
        {
          ref: p,
          id: a || e || void 0,
          className: le(
            "h-10 w-full rounded-lg px-3 py-2.5 outline-none",
            "bg-ui-panel text-base-fg placeholder-base-fg/50",
            "border border-ui-panel-border transition-all duration-150 ease-in-out hover:border-primary/60 focus:border-primary focus:!outline-none",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-ui-panel-border",
            t && "pl-10",
            i && "outline-red focus:outline-red",
            n
          ),
          onFocus: (m) => {
            f && f(m);
          },
          onBlur: (m) => {
            s && s(m);
          },
          ...c
        }
      ),
      l && /* @__PURE__ */ Q("h6", { className: "absolute z-10 text-red", children: l })
    ] })
  ] })
);
Kr.displayName = "Input";
var Oe = /* @__PURE__ */ ((e) => (e[e.NONE = 0] = "NONE", e[e.INPUT = 1] = "INPUT", e[e.PANEL = 2] = "PANEL", e[e.DIALOGUE = 3] = "DIALOGUE", e))(Oe || {});
const Fi = ({
  x: e,
  y: t,
  z: n,
  onChange: r,
  increment: o = 0.1,
  disabled: a,
  disableHotkeyInput: i,
  enableHotkeyInput: s
}) => {
  const f = ve(null), l = ve(null), c = ve(null), p = ve(!1), m = ve(0), w = ve(""), E = ve(""), y = ve("");
  w.current = e, E.current = t, y.current = n;
  const b = "relative h-6 rounded-r-lg bg-black/25 p-2 text-sm text-white transition-all duration-100 ease-in-out outline-none -outline-offset-2 text-end w-full hover:cursor-e-resize hover:bg-black/40", v = "relative flex items-center before:inline-block before:h-6 before:bg-brand-primary before:text-white before:rounded-l-lg before:w-1.5 before:text-center before:justify-center before:items-center before:font-semibold before:flex before:align-middle before:leading-8 text-xs", P = "hover:cursor-not-allowed hover:bg-brand-secondary";
  function C(N, V) {
    return N === "" || N === "-" || N === "." || /^-?\d*(\.\d{0,2})?$/.test(N) ? N : V;
  }
  function S(N) {
    const V = {
      x: w.current,
      y: E.current,
      z: y.current
    };
    V[N.target.name] = C(
      N.target.value,
      V[N.target.name]
    ), r(V);
  }
  const g = () => {
    var N, V, J;
    (N = f.current) == null || N.blur(), (V = l.current) == null || V.blur(), (J = c.current) == null || J.blur();
  }, X = (N, V) => {
    N.stopPropagation(), g(), m.current = N.clientX, p.current = !0;
    const J = (A) => {
      var Z, ne;
      A.stopPropagation();
      const ae = A.clientX, H = ae === m.current ? 0 : ae > m.current ? 1 : -1;
      m.current = ae;
      const se = {
        x: w.current,
        y: E.current,
        z: y.current
      }, B = parseFloat(se[((Z = V.current) == null ? void 0 : Z.name) ?? ""]) + H * o;
      se[((ne = V.current) == null ? void 0 : ne.name) ?? ""] = (Math.round(B * 1e3) / 1e3).toString(), r(se);
    }, te = () => {
      document.removeEventListener("mousemove", J), document.removeEventListener("mouseup", te), p.current = !1;
    };
    document.addEventListener("mousemove", J), document.addEventListener("mouseup", te);
  }, K = (N) => {
    N.key === "Enter" && N.currentTarget.blur();
  };
  return /* @__PURE__ */ ge("div", { className: "flex w-full flex-col justify-between gap-1.5", children: [
    /* @__PURE__ */ ge(
      "span",
      {
        className: le(
          v,
          "before:bg-axis-x",
          a && "opacity-60"
        ),
        children: [
          /* @__PURE__ */ Q("div", { className: "absolute left-3.5 z-10 font-semibold", children: "X" }),
          /* @__PURE__ */ Q(
            "input",
            {
              className: le(
                b,
                "focus:outline-axis-x",
                a && P
              ),
              type: "text",
              name: "x",
              onChange: S,
              ref: f,
              value: e,
              disabled: a,
              onFocus: () => {
                i(Oe.INPUT);
              },
              onBlur: () => {
                s(Oe.INPUT);
              },
              onMouseDown: (N) => {
                X(N, f);
              },
              onKeyDown: K
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ ge(
      "span",
      {
        className: le(
          v,
          "before:bg-axis-y",
          a && "opacity-60"
        ),
        children: [
          /* @__PURE__ */ Q("div", { className: "absolute left-3.5 z-10 font-semibold", children: "Y" }),
          /* @__PURE__ */ Q(
            "input",
            {
              className: le(
                b,
                "focus:outline-axis-y",
                a && P
              ),
              type: "text",
              name: "y",
              onChange: S,
              ref: l,
              value: t,
              disabled: a,
              onFocus: () => {
                i(Oe.INPUT);
              },
              onBlur: () => {
                s(Oe.INPUT);
              },
              onMouseDown: (N) => {
                X(N, l);
              },
              onKeyDown: K
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ ge(
      "span",
      {
        className: le(
          v,
          "before:bg-axis-z",
          a && "opacity-60"
        ),
        children: [
          /* @__PURE__ */ Q("div", { className: "absolute left-3.5 z-10 font-semibold", children: "Z" }),
          /* @__PURE__ */ Q(
            "input",
            {
              className: le(
                b,
                "focus:outline-axis-z",
                a && P
              ),
              type: "text",
              name: "z",
              onChange: S,
              ref: c,
              value: n,
              disabled: a,
              onFocus: () => {
                i(Oe.INPUT);
              },
              onBlur: () => {
                s(Oe.INPUT);
              },
              onMouseDown: (N) => {
                X(N, c);
              },
              onKeyDown: K
            }
          )
        ]
      }
    )
  ] });
};
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Mi = {
  prefix: "fas",
  iconName: "chevron-up",
  icon: [512, 512, [], "f077", "M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"]
}, Ri = {
  prefix: "fas",
  iconName: "chevron-down",
  icon: [512, 512, [], "f078", "M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"]
}, Li = ({
  value: e,
  onChange: t
}) => {
  const [n, r] = Jr(e.toString());
  Zr(() => {
    r(Math.round(e * 100) / 100 + "");
  }, [e]);
  const o = (l) => {
    const c = l.target.value;
    if (c === "" || !isNaN(Number(c)) && Number(c) <= 100) {
      r(c);
      const p = parseFloat(c);
      c !== "" && t(Math.round(p * 100) / 100);
    }
  }, a = () => {
    n === "" && r(Math.round(e * 100) / 100 + "");
  }, i = () => {
    const l = Math.min(Number(n) + 1, 100);
    r(Math.round(l * 100) / 100 + ""), t(Math.round(l * 100) / 100);
  }, s = () => {
    const l = Math.max(Number(n) - 1, 0);
    r(Math.round(l * 100) / 100 + ""), t(Math.round(l * 100) / 100);
  }, f = "flex h-[15px] w-6 items-center justify-center text-[10px] text-white/80 bg-ui-controls hover:bg-ui-controls-button outline-none focus:outline-none transition-all active:outline-none";
  return /* @__PURE__ */ ge("div", { className: "relative", children: [
    /* @__PURE__ */ Q(
      Kr,
      {
        type: "text",
        value: n,
        onChange: o,
        onBlur: a,
        inputClassName: "w-[70px] h-[30px] rounded-md text-sm"
      }
    ),
    /* @__PURE__ */ ge("div", { className: "absolute right-0 top-0 flex h-[30px] flex-col rounded-r-md border-l border-white/15 bg-gray-800", children: [
      /* @__PURE__ */ Q(
        "button",
        {
          className: le(
            f,
            "rounded-tr-md border-b border-white/10"
          ),
          onClick: i,
          children: /* @__PURE__ */ Q(Ke, { icon: Mi })
        }
      ),
      /* @__PURE__ */ Q(
        "button",
        {
          className: le(f, "rounded-br-md"),
          onClick: s,
          children: /* @__PURE__ */ Q(Ke, { icon: Ri })
        }
      )
    ] })
  ] });
};
export {
  Kr as Input,
  Fi as InputVector,
  Li as NumberInput
};
