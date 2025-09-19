var Wr = Object.defineProperty;
var Yr = (o, s, b) => s in o ? Wr(o, s, { enumerable: !0, configurable: !0, writable: !0, value: b }) : o[s] = b;
var P = (o, s, b) => Yr(o, typeof s != "symbol" ? s + "" : s, b);
class Gt {
  constructor(s) {
    // Typescript type discriminator property
    // Since Vite minification and class name mangling can break instanceof checks,
    // we have a type discriminator property to check against.
    P(this, "kind", "model");
    // A unique frontend-only string for the model
    P(this, "id");
    // A unique identifier that Tauri uses for the model (this 
    // might differ from our backend or other systems)
    P(this, "tauriId");
    // A long name for the model that might need to be abbreviated.
    P(this, "fullName");
    // The type of model (image, video, etc.)
    // TODO: Not sure that this is used for anything
    P(this, "category");
    // What company made the model.
    P(this, "creator");
    // Name for the selector
    P(this, "selectorName");
    // Description for the selector
    P(this, "selectorDescription");
    // Labels for the selector
    P(this, "selectorBadges");
    // A list of filterable "capabilities" that can be used to filter models.
    P(this, "tags");
    this.id = s.id, this.tauriId = s.tauriId, this.fullName = s.fullName, this.category = s.category, this.creator = s.creator, this.selectorName = s.selectorName, this.selectorDescription = s.selectorDescription, this.selectorBadges = s.selectorBadges, this.tags = s.tags ?? [];
  }
  toLegacyBadges() {
    return this.selectorBadges.map((s) => ({ label: s }));
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
}
class G extends Gt {
  constructor(b) {
    if (b.maxGenerationCount < 1)
      throw new Error("maxGenerationCount must be at least 1");
    if (b.defaultGenerationCount < 1)
      throw new Error("defaultGenerationCount must be at least 1");
    if (b.defaultGenerationCount > b.maxGenerationCount)
      throw new Error(
        "defaultGenerationCount must be less than or equal to maxGenerationCount"
      );
    super(b);
    // Typescript type discriminator property
    // Since Vite minification and class name mangling can break instanceof checks,
    // we have a type discriminator property to check against.
    P(this, "kind", "image_model");
    // Maximum number of images that can be generated at once
    P(this, "maxGenerationCount");
    // Default number of images that can be generated at once
    P(this, "defaultGenerationCount");
    // Signals image editing models that focus on editing a single image.
    P(this, "canEditImages");
    // For inpainting models, does it require sending a mask?
    P(this, "usesInpaintingMask");
    // Whether this model supports additional image prompts (reference images)
    P(this, "canUseImagePrompt");
    // Maximum number of image prompts that can be attached
    P(this, "maxImagePromptCount");
    this.maxGenerationCount = b.maxGenerationCount, this.defaultGenerationCount = b.defaultGenerationCount, this.canEditImages = b.canEditImages ?? !1, this.usesInpaintingMask = b.usesInpaintingMask ?? !1, this.canUseImagePrompt = b.canUseImagePrompt ?? !1, this.maxImagePromptCount = Math.max(0, b.maxImagePromptCount ?? 1);
  }
}
class ve extends Gt {
  constructor(b) {
    super(b);
    // Typescript type discriminator property
    // Since Vite minification and class name mangling can break instanceof checks,
    // we have a type discriminator property to check against.
    P(this, "kind", "video_model");
    // Whether the model supports image starting frames
    P(this, "startFrame");
    // Whether the model supports image ending frames
    P(this, "endFrame");
    this.startFrame = b.startFrame, this.endFrame = b.endFrame;
  }
}
var c = /* @__PURE__ */ ((o) => (o.BlackForestLabs = "BlackForestLabs", o.Bytedance = "Bytedance", o.Google = "Google", o.Hailuo = "Hailuo", o.Kling = "Kling", o.Midjourney = "Midjourney", o.OpenAi = "OpenAi", o.Runway = "Runway", o.Stability = "Stability", o.Tencent = "Tencent", o.Recraft = "Recraft", o.Krea = "Krea", o.Fal = "Fal", o.Replicate = "Replicate", o.TensorArt = "TensorArt", o.OpenArt = "OpenArt", o.Higgsfield = "Higgsfield", o.Alibaba = "Alibaba", o.Vidu = "Vidu", o.ArtCraft = "ArtCraft", o))(c || {});
function zr(o) {
  return o && o.__esModule && Object.prototype.hasOwnProperty.call(o, "default") ? o.default : o;
}
var Le = { exports: {} }, m = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Dt;
function Jr() {
  if (Dt) return m;
  Dt = 1;
  var o = Symbol.for("react.element"), s = Symbol.for("react.portal"), b = Symbol.for("react.fragment"), Q = Symbol.for("react.strict_mode"), he = Symbol.for("react.profiler"), X = Symbol.for("react.provider"), ue = Symbol.for("react.context"), se = Symbol.for("react.forward_ref"), ce = Symbol.for("react.suspense"), Z = Symbol.for("react.memo"), q = Symbol.for("react.lazy"), W = Symbol.iterator;
  function le(r) {
    return r === null || typeof r != "object" ? null : (r = W && r[W] || r["@@iterator"], typeof r == "function" ? r : null);
  }
  var N = { isMounted: function() {
    return !1;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, Y = Object.assign, be = {};
  function B(r, i, g) {
    this.props = r, this.context = i, this.refs = be, this.updater = g || N;
  }
  B.prototype.isReactComponent = {}, B.prototype.setState = function(r, i) {
    if (typeof r != "object" && typeof r != "function" && r != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, r, i, "setState");
  }, B.prototype.forceUpdate = function(r) {
    this.updater.enqueueForceUpdate(this, r, "forceUpdate");
  };
  function Ee() {
  }
  Ee.prototype = B.prototype;
  function ee(r, i, g) {
    this.props = r, this.context = i, this.refs = be, this.updater = g || N;
  }
  var te = ee.prototype = new Ee();
  te.constructor = ee, Y(te, B.prototype), te.isPureReactComponent = !0;
  var $ = Array.isArray, O = Object.prototype.hasOwnProperty, L = { current: null }, U = { key: !0, ref: !0, __self: !0, __source: !0 };
  function z(r, i, g) {
    var y, _ = {}, I = null, w = null;
    if (i != null) for (y in i.ref !== void 0 && (w = i.ref), i.key !== void 0 && (I = "" + i.key), i) O.call(i, y) && !U.hasOwnProperty(y) && (_[y] = i[y]);
    var k = arguments.length - 2;
    if (k === 1) _.children = g;
    else if (1 < k) {
      for (var E = Array(k), T = 0; T < k; T++) E[T] = arguments[T + 2];
      _.children = E;
    }
    if (r && r.defaultProps) for (y in k = r.defaultProps, k) _[y] === void 0 && (_[y] = k[y]);
    return { $$typeof: o, type: r, key: I, ref: w, props: _, _owner: L.current };
  }
  function Ce(r, i) {
    return { $$typeof: o, type: r.type, key: i, ref: r.ref, props: r.props, _owner: r._owner };
  }
  function fe(r) {
    return typeof r == "object" && r !== null && r.$$typeof === o;
  }
  function Me(r) {
    var i = { "=": "=0", ":": "=2" };
    return "$" + r.replace(/[=:]/g, function(g) {
      return i[g];
    });
  }
  var Re = /\/+/g;
  function de(r, i) {
    return typeof r == "object" && r !== null && r.key != null ? Me("" + r.key) : i.toString(36);
  }
  function re(r, i, g, y, _) {
    var I = typeof r;
    (I === "undefined" || I === "boolean") && (r = null);
    var w = !1;
    if (r === null) w = !0;
    else switch (I) {
      case "string":
      case "number":
        w = !0;
        break;
      case "object":
        switch (r.$$typeof) {
          case o:
          case s:
            w = !0;
        }
    }
    if (w) return w = r, _ = _(w), r = y === "" ? "." + de(w, 0) : y, $(_) ? (g = "", r != null && (g = r.replace(Re, "$&/") + "/"), re(_, i, g, "", function(T) {
      return T;
    })) : _ != null && (fe(_) && (_ = Ce(_, g + (!_.key || w && w.key === _.key ? "" : ("" + _.key).replace(Re, "$&/") + "/") + r)), i.push(_)), 1;
    if (w = 0, y = y === "" ? "." : y + ":", $(r)) for (var k = 0; k < r.length; k++) {
      I = r[k];
      var E = y + de(I, k);
      w += re(I, i, g, E, _);
    }
    else if (E = le(r), typeof E == "function") for (r = E.call(r), k = 0; !(I = r.next()).done; ) I = I.value, E = y + de(I, k++), w += re(I, i, g, E, _);
    else if (I === "object") throw i = String(r), Error("Objects are not valid as a React child (found: " + (i === "[object Object]" ? "object with keys {" + Object.keys(r).join(", ") + "}" : i) + "). If you meant to render a collection of children, use an array instead.");
    return w;
  }
  function M(r, i, g) {
    if (r == null) return r;
    var y = [], _ = 0;
    return re(r, y, "", "", function(I) {
      return i.call(g, I, _++);
    }), y;
  }
  function K(r) {
    if (r._status === -1) {
      var i = r._result;
      i = i(), i.then(function(g) {
        (r._status === 0 || r._status === -1) && (r._status = 1, r._result = g);
      }, function(g) {
        (r._status === 0 || r._status === -1) && (r._status = 2, r._result = g);
      }), r._status === -1 && (r._status = 0, r._result = i);
    }
    if (r._status === 1) return r._result.default;
    throw r._result;
  }
  var d = { current: null }, J = { transition: null }, we = { ReactCurrentDispatcher: d, ReactCurrentBatchConfig: J, ReactCurrentOwner: L };
  function ne() {
    throw Error("act(...) is not supported in production builds of React.");
  }
  return m.Children = { map: M, forEach: function(r, i, g) {
    M(r, function() {
      i.apply(this, arguments);
    }, g);
  }, count: function(r) {
    var i = 0;
    return M(r, function() {
      i++;
    }), i;
  }, toArray: function(r) {
    return M(r, function(i) {
      return i;
    }) || [];
  }, only: function(r) {
    if (!fe(r)) throw Error("React.Children.only expected to receive a single React element child.");
    return r;
  } }, m.Component = B, m.Fragment = b, m.Profiler = he, m.PureComponent = ee, m.StrictMode = Q, m.Suspense = ce, m.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = we, m.act = ne, m.cloneElement = function(r, i, g) {
    if (r == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + r + ".");
    var y = Y({}, r.props), _ = r.key, I = r.ref, w = r._owner;
    if (i != null) {
      if (i.ref !== void 0 && (I = i.ref, w = L.current), i.key !== void 0 && (_ = "" + i.key), r.type && r.type.defaultProps) var k = r.type.defaultProps;
      for (E in i) O.call(i, E) && !U.hasOwnProperty(E) && (y[E] = i[E] === void 0 && k !== void 0 ? k[E] : i[E]);
    }
    var E = arguments.length - 2;
    if (E === 1) y.children = g;
    else if (1 < E) {
      k = Array(E);
      for (var T = 0; T < E; T++) k[T] = arguments[T + 2];
      y.children = k;
    }
    return { $$typeof: o, type: r.type, key: _, ref: I, props: y, _owner: w };
  }, m.createContext = function(r) {
    return r = { $$typeof: ue, _currentValue: r, _currentValue2: r, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, r.Provider = { $$typeof: X, _context: r }, r.Consumer = r;
  }, m.createElement = z, m.createFactory = function(r) {
    var i = z.bind(null, r);
    return i.type = r, i;
  }, m.createRef = function() {
    return { current: null };
  }, m.forwardRef = function(r) {
    return { $$typeof: se, render: r };
  }, m.isValidElement = fe, m.lazy = function(r) {
    return { $$typeof: q, _payload: { _status: -1, _result: r }, _init: K };
  }, m.memo = function(r, i) {
    return { $$typeof: Z, type: r, compare: i === void 0 ? null : i };
  }, m.startTransition = function(r) {
    var i = J.transition;
    J.transition = {};
    try {
      r();
    } finally {
      J.transition = i;
    }
  }, m.unstable_act = ne, m.useCallback = function(r, i) {
    return d.current.useCallback(r, i);
  }, m.useContext = function(r) {
    return d.current.useContext(r);
  }, m.useDebugValue = function() {
  }, m.useDeferredValue = function(r) {
    return d.current.useDeferredValue(r);
  }, m.useEffect = function(r, i) {
    return d.current.useEffect(r, i);
  }, m.useId = function() {
    return d.current.useId();
  }, m.useImperativeHandle = function(r, i, g) {
    return d.current.useImperativeHandle(r, i, g);
  }, m.useInsertionEffect = function(r, i) {
    return d.current.useInsertionEffect(r, i);
  }, m.useLayoutEffect = function(r, i) {
    return d.current.useLayoutEffect(r, i);
  }, m.useMemo = function(r, i) {
    return d.current.useMemo(r, i);
  }, m.useReducer = function(r, i, g) {
    return d.current.useReducer(r, i, g);
  }, m.useRef = function(r) {
    return d.current.useRef(r);
  }, m.useState = function(r) {
    return d.current.useState(r);
  }, m.useSyncExternalStore = function(r, i, g) {
    return d.current.useSyncExternalStore(r, i, g);
  }, m.useTransition = function() {
    return d.current.useTransition();
  }, m.version = "18.3.1", m;
}
var ye = { exports: {} };
/**
 * @license React
 * react.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
ye.exports;
var Lt;
function Qr() {
  return Lt || (Lt = 1, function(o, s) {
    process.env.NODE_ENV !== "production" && function() {
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
      var b = "18.3.1", Q = Symbol.for("react.element"), he = Symbol.for("react.portal"), X = Symbol.for("react.fragment"), ue = Symbol.for("react.strict_mode"), se = Symbol.for("react.profiler"), ce = Symbol.for("react.provider"), Z = Symbol.for("react.context"), q = Symbol.for("react.forward_ref"), W = Symbol.for("react.suspense"), le = Symbol.for("react.suspense_list"), N = Symbol.for("react.memo"), Y = Symbol.for("react.lazy"), be = Symbol.for("react.offscreen"), B = Symbol.iterator, Ee = "@@iterator";
      function ee(e) {
        if (e === null || typeof e != "object")
          return null;
        var t = B && e[B] || e[Ee];
        return typeof t == "function" ? t : null;
      }
      var te = {
        /**
         * @internal
         * @type {ReactComponent}
         */
        current: null
      }, $ = {
        transition: null
      }, O = {
        current: null,
        // Used to reproduce behavior of `batchedUpdates` in legacy mode.
        isBatchingLegacy: !1,
        didScheduleLegacyUpdate: !1
      }, L = {
        /**
         * @internal
         * @type {ReactComponent}
         */
        current: null
      }, U = {}, z = null;
      function Ce(e) {
        z = e;
      }
      U.setExtraStackFrame = function(e) {
        z = e;
      }, U.getCurrentStack = null, U.getStackAddendum = function() {
        var e = "";
        z && (e += z);
        var t = U.getCurrentStack;
        return t && (e += t() || ""), e;
      };
      var fe = !1, Me = !1, Re = !1, de = !1, re = !1, M = {
        ReactCurrentDispatcher: te,
        ReactCurrentBatchConfig: $,
        ReactCurrentOwner: L
      };
      M.ReactDebugCurrentFrame = U, M.ReactCurrentActQueue = O;
      function K(e) {
        {
          for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), a = 1; a < t; a++)
            n[a - 1] = arguments[a];
          J("warn", e, n);
        }
      }
      function d(e) {
        {
          for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), a = 1; a < t; a++)
            n[a - 1] = arguments[a];
          J("error", e, n);
        }
      }
      function J(e, t, n) {
        {
          var a = M.ReactDebugCurrentFrame, u = a.getStackAddendum();
          u !== "" && (t += "%s", n = n.concat([u]));
          var f = n.map(function(l) {
            return String(l);
          });
          f.unshift("Warning: " + t), Function.prototype.apply.call(console[e], console, f);
        }
      }
      var we = {};
      function ne(e, t) {
        {
          var n = e.constructor, a = n && (n.displayName || n.name) || "ReactClass", u = a + "." + t;
          if (we[u])
            return;
          d("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", t, a), we[u] = !0;
        }
      }
      var r = {
        /**
         * Checks whether or not this composite component is mounted.
         * @param {ReactClass} publicInstance The instance we want to test.
         * @return {boolean} True if mounted, false otherwise.
         * @protected
         * @final
         */
        isMounted: function(e) {
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
        enqueueForceUpdate: function(e, t, n) {
          ne(e, "forceUpdate");
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
        enqueueReplaceState: function(e, t, n, a) {
          ne(e, "replaceState");
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
        enqueueSetState: function(e, t, n, a) {
          ne(e, "setState");
        }
      }, i = Object.assign, g = {};
      Object.freeze(g);
      function y(e, t, n) {
        this.props = e, this.context = t, this.refs = g, this.updater = n || r;
      }
      y.prototype.isReactComponent = {}, y.prototype.setState = function(e, t) {
        if (typeof e != "object" && typeof e != "function" && e != null)
          throw new Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, e, t, "setState");
      }, y.prototype.forceUpdate = function(e) {
        this.updater.enqueueForceUpdate(this, e, "forceUpdate");
      };
      {
        var _ = {
          isMounted: ["isMounted", "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."],
          replaceState: ["replaceState", "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."]
        }, I = function(e, t) {
          Object.defineProperty(y.prototype, e, {
            get: function() {
              K("%s(...) is deprecated in plain JavaScript React classes. %s", t[0], t[1]);
            }
          });
        };
        for (var w in _)
          _.hasOwnProperty(w) && I(w, _[w]);
      }
      function k() {
      }
      k.prototype = y.prototype;
      function E(e, t, n) {
        this.props = e, this.context = t, this.refs = g, this.updater = n || r;
      }
      var T = E.prototype = new k();
      T.constructor = E, i(T, y.prototype), T.isPureReactComponent = !0;
      function $t() {
        var e = {
          current: null
        };
        return Object.seal(e), e;
      }
      var Vt = Array.isArray;
      function ke(e) {
        return Vt(e);
      }
      function Ut(e) {
        {
          var t = typeof Symbol == "function" && Symbol.toStringTag, n = t && e[Symbol.toStringTag] || e.constructor.name || "Object";
          return n;
        }
      }
      function Kt(e) {
        try {
          return Xe(e), !1;
        } catch {
          return !0;
        }
      }
      function Xe(e) {
        return "" + e;
      }
      function xe(e) {
        if (Kt(e))
          return d("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", Ut(e)), Xe(e);
      }
      function Ht(e, t, n) {
        var a = e.displayName;
        if (a)
          return a;
        var u = t.displayName || t.name || "";
        return u !== "" ? n + "(" + u + ")" : n;
      }
      function Ze(e) {
        return e.displayName || "Context";
      }
      function H(e) {
        if (e == null)
          return null;
        if (typeof e.tag == "number" && d("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof e == "function")
          return e.displayName || e.name || null;
        if (typeof e == "string")
          return e;
        switch (e) {
          case X:
            return "Fragment";
          case he:
            return "Portal";
          case se:
            return "Profiler";
          case ue:
            return "StrictMode";
          case W:
            return "Suspense";
          case le:
            return "SuspenseList";
        }
        if (typeof e == "object")
          switch (e.$$typeof) {
            case Z:
              var t = e;
              return Ze(t) + ".Consumer";
            case ce:
              var n = e;
              return Ze(n._context) + ".Provider";
            case q:
              return Ht(e, e.render, "ForwardRef");
            case N:
              var a = e.displayName || null;
              return a !== null ? a : H(e.type) || "Memo";
            case Y: {
              var u = e, f = u._payload, l = u._init;
              try {
                return H(l(f));
              } catch {
                return null;
              }
            }
          }
        return null;
      }
      var pe = Object.prototype.hasOwnProperty, et = {
        key: !0,
        ref: !0,
        __self: !0,
        __source: !0
      }, tt, rt, Ge;
      Ge = {};
      function nt(e) {
        if (pe.call(e, "ref")) {
          var t = Object.getOwnPropertyDescriptor(e, "ref").get;
          if (t && t.isReactWarning)
            return !1;
        }
        return e.ref !== void 0;
      }
      function at(e) {
        if (pe.call(e, "key")) {
          var t = Object.getOwnPropertyDescriptor(e, "key").get;
          if (t && t.isReactWarning)
            return !1;
        }
        return e.key !== void 0;
      }
      function qt(e, t) {
        var n = function() {
          tt || (tt = !0, d("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", t));
        };
        n.isReactWarning = !0, Object.defineProperty(e, "key", {
          get: n,
          configurable: !0
        });
      }
      function Wt(e, t) {
        var n = function() {
          rt || (rt = !0, d("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", t));
        };
        n.isReactWarning = !0, Object.defineProperty(e, "ref", {
          get: n,
          configurable: !0
        });
      }
      function Yt(e) {
        if (typeof e.ref == "string" && L.current && e.__self && L.current.stateNode !== e.__self) {
          var t = H(L.current.type);
          Ge[t] || (d('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', t, e.ref), Ge[t] = !0);
        }
      }
      var Ne = function(e, t, n, a, u, f, l) {
        var p = {
          // This tag allows us to uniquely identify this as a React Element
          $$typeof: Q,
          // Built-in properties that belong on the element
          type: e,
          key: t,
          ref: n,
          props: l,
          // Record the component responsible for creating this element.
          _owner: f
        };
        return p._store = {}, Object.defineProperty(p._store, "validated", {
          configurable: !1,
          enumerable: !1,
          writable: !0,
          value: !1
        }), Object.defineProperty(p, "_self", {
          configurable: !1,
          enumerable: !1,
          writable: !1,
          value: a
        }), Object.defineProperty(p, "_source", {
          configurable: !1,
          enumerable: !1,
          writable: !1,
          value: u
        }), Object.freeze && (Object.freeze(p.props), Object.freeze(p)), p;
      };
      function zt(e, t, n) {
        var a, u = {}, f = null, l = null, p = null, v = null;
        if (t != null) {
          nt(t) && (l = t.ref, Yt(t)), at(t) && (xe(t.key), f = "" + t.key), p = t.__self === void 0 ? null : t.__self, v = t.__source === void 0 ? null : t.__source;
          for (a in t)
            pe.call(t, a) && !et.hasOwnProperty(a) && (u[a] = t[a]);
        }
        var h = arguments.length - 2;
        if (h === 1)
          u.children = n;
        else if (h > 1) {
          for (var C = Array(h), R = 0; R < h; R++)
            C[R] = arguments[R + 2];
          Object.freeze && Object.freeze(C), u.children = C;
        }
        if (e && e.defaultProps) {
          var x = e.defaultProps;
          for (a in x)
            u[a] === void 0 && (u[a] = x[a]);
        }
        if (f || l) {
          var S = typeof e == "function" ? e.displayName || e.name || "Unknown" : e;
          f && qt(u, S), l && Wt(u, S);
        }
        return Ne(e, f, l, p, v, L.current, u);
      }
      function Jt(e, t) {
        var n = Ne(e.type, t, e.ref, e._self, e._source, e._owner, e.props);
        return n;
      }
      function Qt(e, t, n) {
        if (e == null)
          throw new Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
        var a, u = i({}, e.props), f = e.key, l = e.ref, p = e._self, v = e._source, h = e._owner;
        if (t != null) {
          nt(t) && (l = t.ref, h = L.current), at(t) && (xe(t.key), f = "" + t.key);
          var C;
          e.type && e.type.defaultProps && (C = e.type.defaultProps);
          for (a in t)
            pe.call(t, a) && !et.hasOwnProperty(a) && (t[a] === void 0 && C !== void 0 ? u[a] = C[a] : u[a] = t[a]);
        }
        var R = arguments.length - 2;
        if (R === 1)
          u.children = n;
        else if (R > 1) {
          for (var x = Array(R), S = 0; S < R; S++)
            x[S] = arguments[S + 2];
          u.children = x;
        }
        return Ne(e.type, f, l, p, v, h, u);
      }
      function ae(e) {
        return typeof e == "object" && e !== null && e.$$typeof === Q;
      }
      var ot = ".", Xt = ":";
      function Zt(e) {
        var t = /[=:]/g, n = {
          "=": "=0",
          ":": "=2"
        }, a = e.replace(t, function(u) {
          return n[u];
        });
        return "$" + a;
      }
      var it = !1, er = /\/+/g;
      function ut(e) {
        return e.replace(er, "$&/");
      }
      function Be(e, t) {
        return typeof e == "object" && e !== null && e.key != null ? (xe(e.key), Zt("" + e.key)) : t.toString(36);
      }
      function Ie(e, t, n, a, u) {
        var f = typeof e;
        (f === "undefined" || f === "boolean") && (e = null);
        var l = !1;
        if (e === null)
          l = !0;
        else
          switch (f) {
            case "string":
            case "number":
              l = !0;
              break;
            case "object":
              switch (e.$$typeof) {
                case Q:
                case he:
                  l = !0;
              }
          }
        if (l) {
          var p = e, v = u(p), h = a === "" ? ot + Be(p, 0) : a;
          if (ke(v)) {
            var C = "";
            h != null && (C = ut(h) + "/"), Ie(v, t, C, "", function(qr) {
              return qr;
            });
          } else v != null && (ae(v) && (v.key && (!p || p.key !== v.key) && xe(v.key), v = Jt(
            v,
            // Keep both the (mapped) and old keys if they differ, just as
            // traverseAllChildren used to do for objects as children
            n + // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
            (v.key && (!p || p.key !== v.key) ? (
              // $FlowFixMe Flow incorrectly thinks existing element's key can be a number
              // eslint-disable-next-line react-internal/safe-string-coercion
              ut("" + v.key) + "/"
            ) : "") + h
          )), t.push(v));
          return 1;
        }
        var R, x, S = 0, F = a === "" ? ot : a + Xt;
        if (ke(e))
          for (var De = 0; De < e.length; De++)
            R = e[De], x = F + Be(R, De), S += Ie(R, t, n, x, u);
        else {
          var ze = ee(e);
          if (typeof ze == "function") {
            var Tt = e;
            ze === Tt.entries && (it || K("Using Maps as children is not supported. Use an array of keyed ReactElements instead."), it = !0);
            for (var Kr = ze.call(Tt), jt, Hr = 0; !(jt = Kr.next()).done; )
              R = jt.value, x = F + Be(R, Hr++), S += Ie(R, t, n, x, u);
          } else if (f === "object") {
            var At = String(e);
            throw new Error("Objects are not valid as a React child (found: " + (At === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : At) + "). If you meant to render a collection of children, use an array instead.");
          }
        }
        return S;
      }
      function Pe(e, t, n) {
        if (e == null)
          return e;
        var a = [], u = 0;
        return Ie(e, a, "", "", function(f) {
          return t.call(n, f, u++);
        }), a;
      }
      function tr(e) {
        var t = 0;
        return Pe(e, function() {
          t++;
        }), t;
      }
      function rr(e, t, n) {
        Pe(e, function() {
          t.apply(this, arguments);
        }, n);
      }
      function nr(e) {
        return Pe(e, function(t) {
          return t;
        }) || [];
      }
      function ar(e) {
        if (!ae(e))
          throw new Error("React.Children.only expected to receive a single React element child.");
        return e;
      }
      function or(e) {
        var t = {
          $$typeof: Z,
          // As a workaround to support multiple concurrent renderers, we categorize
          // some renderers as primary and others as secondary. We only expect
          // there to be two concurrent renderers at most: React Native (primary) and
          // Fabric (secondary); React DOM (primary) and React ART (secondary).
          // Secondary renderers store their context values on separate fields.
          _currentValue: e,
          _currentValue2: e,
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
        t.Provider = {
          $$typeof: ce,
          _context: t
        };
        var n = !1, a = !1, u = !1;
        {
          var f = {
            $$typeof: Z,
            _context: t
          };
          Object.defineProperties(f, {
            Provider: {
              get: function() {
                return a || (a = !0, d("Rendering <Context.Consumer.Provider> is not supported and will be removed in a future major release. Did you mean to render <Context.Provider> instead?")), t.Provider;
              },
              set: function(l) {
                t.Provider = l;
              }
            },
            _currentValue: {
              get: function() {
                return t._currentValue;
              },
              set: function(l) {
                t._currentValue = l;
              }
            },
            _currentValue2: {
              get: function() {
                return t._currentValue2;
              },
              set: function(l) {
                t._currentValue2 = l;
              }
            },
            _threadCount: {
              get: function() {
                return t._threadCount;
              },
              set: function(l) {
                t._threadCount = l;
              }
            },
            Consumer: {
              get: function() {
                return n || (n = !0, d("Rendering <Context.Consumer.Consumer> is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?")), t.Consumer;
              }
            },
            displayName: {
              get: function() {
                return t.displayName;
              },
              set: function(l) {
                u || (K("Setting `displayName` on Context.Consumer has no effect. You should set it directly on the context with Context.displayName = '%s'.", l), u = !0);
              }
            }
          }), t.Consumer = f;
        }
        return t._currentRenderer = null, t._currentRenderer2 = null, t;
      }
      var me = -1, $e = 0, st = 1, ir = 2;
      function ur(e) {
        if (e._status === me) {
          var t = e._result, n = t();
          if (n.then(function(f) {
            if (e._status === $e || e._status === me) {
              var l = e;
              l._status = st, l._result = f;
            }
          }, function(f) {
            if (e._status === $e || e._status === me) {
              var l = e;
              l._status = ir, l._result = f;
            }
          }), e._status === me) {
            var a = e;
            a._status = $e, a._result = n;
          }
        }
        if (e._status === st) {
          var u = e._result;
          return u === void 0 && d(`lazy: Expected the result of a dynamic import() call. Instead received: %s

Your code should look like: 
  const MyComponent = lazy(() => import('./MyComponent'))

Did you accidentally put curly braces around the import?`, u), "default" in u || d(`lazy: Expected the result of a dynamic import() call. Instead received: %s

Your code should look like: 
  const MyComponent = lazy(() => import('./MyComponent'))`, u), u.default;
        } else
          throw e._result;
      }
      function sr(e) {
        var t = {
          // We use these fields to store the result.
          _status: me,
          _result: e
        }, n = {
          $$typeof: Y,
          _payload: t,
          _init: ur
        };
        {
          var a, u;
          Object.defineProperties(n, {
            defaultProps: {
              configurable: !0,
              get: function() {
                return a;
              },
              set: function(f) {
                d("React.lazy(...): It is not supported to assign `defaultProps` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it."), a = f, Object.defineProperty(n, "defaultProps", {
                  enumerable: !0
                });
              }
            },
            propTypes: {
              configurable: !0,
              get: function() {
                return u;
              },
              set: function(f) {
                d("React.lazy(...): It is not supported to assign `propTypes` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it."), u = f, Object.defineProperty(n, "propTypes", {
                  enumerable: !0
                });
              }
            }
          });
        }
        return n;
      }
      function cr(e) {
        e != null && e.$$typeof === N ? d("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).") : typeof e != "function" ? d("forwardRef requires a render function but was given %s.", e === null ? "null" : typeof e) : e.length !== 0 && e.length !== 2 && d("forwardRef render functions accept exactly two parameters: props and ref. %s", e.length === 1 ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."), e != null && (e.defaultProps != null || e.propTypes != null) && d("forwardRef render functions do not support propTypes or defaultProps. Did you accidentally pass a React component?");
        var t = {
          $$typeof: q,
          render: e
        };
        {
          var n;
          Object.defineProperty(t, "displayName", {
            enumerable: !1,
            configurable: !0,
            get: function() {
              return n;
            },
            set: function(a) {
              n = a, !e.name && !e.displayName && (e.displayName = a);
            }
          });
        }
        return t;
      }
      var ct;
      ct = Symbol.for("react.module.reference");
      function lt(e) {
        return !!(typeof e == "string" || typeof e == "function" || e === X || e === se || re || e === ue || e === W || e === le || de || e === be || fe || Me || Re || typeof e == "object" && e !== null && (e.$$typeof === Y || e.$$typeof === N || e.$$typeof === ce || e.$$typeof === Z || e.$$typeof === q || // This needs to include all possible module reference object
        // types supported by any Flight configuration anywhere since
        // we don't know which Flight build this will end up being used
        // with.
        e.$$typeof === ct || e.getModuleId !== void 0));
      }
      function lr(e, t) {
        lt(e) || d("memo: The first argument must be a component. Instead received: %s", e === null ? "null" : typeof e);
        var n = {
          $$typeof: N,
          type: e,
          compare: t === void 0 ? null : t
        };
        {
          var a;
          Object.defineProperty(n, "displayName", {
            enumerable: !1,
            configurable: !0,
            get: function() {
              return a;
            },
            set: function(u) {
              a = u, !e.name && !e.displayName && (e.displayName = u);
            }
          });
        }
        return n;
      }
      function j() {
        var e = te.current;
        return e === null && d(`Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.`), e;
      }
      function fr(e) {
        var t = j();
        if (e._context !== void 0) {
          var n = e._context;
          n.Consumer === e ? d("Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be removed in a future major release. Did you mean to call useContext(Context) instead?") : n.Provider === e && d("Calling useContext(Context.Provider) is not supported. Did you mean to call useContext(Context) instead?");
        }
        return t.useContext(e);
      }
      function dr(e) {
        var t = j();
        return t.useState(e);
      }
      function pr(e, t, n) {
        var a = j();
        return a.useReducer(e, t, n);
      }
      function mr(e) {
        var t = j();
        return t.useRef(e);
      }
      function gr(e, t) {
        var n = j();
        return n.useEffect(e, t);
      }
      function vr(e, t) {
        var n = j();
        return n.useInsertionEffect(e, t);
      }
      function yr(e, t) {
        var n = j();
        return n.useLayoutEffect(e, t);
      }
      function _r(e, t) {
        var n = j();
        return n.useCallback(e, t);
      }
      function hr(e, t) {
        var n = j();
        return n.useMemo(e, t);
      }
      function br(e, t, n) {
        var a = j();
        return a.useImperativeHandle(e, t, n);
      }
      function Er(e, t) {
        {
          var n = j();
          return n.useDebugValue(e, t);
        }
      }
      function Cr() {
        var e = j();
        return e.useTransition();
      }
      function Rr(e) {
        var t = j();
        return t.useDeferredValue(e);
      }
      function wr() {
        var e = j();
        return e.useId();
      }
      function kr(e, t, n) {
        var a = j();
        return a.useSyncExternalStore(e, t, n);
      }
      var ge = 0, ft, dt, pt, mt, gt, vt, yt;
      function _t() {
      }
      _t.__reactDisabledLog = !0;
      function xr() {
        {
          if (ge === 0) {
            ft = console.log, dt = console.info, pt = console.warn, mt = console.error, gt = console.group, vt = console.groupCollapsed, yt = console.groupEnd;
            var e = {
              configurable: !0,
              enumerable: !0,
              value: _t,
              writable: !0
            };
            Object.defineProperties(console, {
              info: e,
              log: e,
              warn: e,
              error: e,
              group: e,
              groupCollapsed: e,
              groupEnd: e
            });
          }
          ge++;
        }
      }
      function Ir() {
        {
          if (ge--, ge === 0) {
            var e = {
              configurable: !0,
              enumerable: !0,
              writable: !0
            };
            Object.defineProperties(console, {
              log: i({}, e, {
                value: ft
              }),
              info: i({}, e, {
                value: dt
              }),
              warn: i({}, e, {
                value: pt
              }),
              error: i({}, e, {
                value: mt
              }),
              group: i({}, e, {
                value: gt
              }),
              groupCollapsed: i({}, e, {
                value: vt
              }),
              groupEnd: i({}, e, {
                value: yt
              })
            });
          }
          ge < 0 && d("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
        }
      }
      var Ve = M.ReactCurrentDispatcher, Ue;
      function Se(e, t, n) {
        {
          if (Ue === void 0)
            try {
              throw Error();
            } catch (u) {
              var a = u.stack.trim().match(/\n( *(at )?)/);
              Ue = a && a[1] || "";
            }
          return `
` + Ue + e;
        }
      }
      var Ke = !1, Oe;
      {
        var Pr = typeof WeakMap == "function" ? WeakMap : Map;
        Oe = new Pr();
      }
      function ht(e, t) {
        if (!e || Ke)
          return "";
        {
          var n = Oe.get(e);
          if (n !== void 0)
            return n;
        }
        var a;
        Ke = !0;
        var u = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        var f;
        f = Ve.current, Ve.current = null, xr();
        try {
          if (t) {
            var l = function() {
              throw Error();
            };
            if (Object.defineProperty(l.prototype, "props", {
              set: function() {
                throw Error();
              }
            }), typeof Reflect == "object" && Reflect.construct) {
              try {
                Reflect.construct(l, []);
              } catch (F) {
                a = F;
              }
              Reflect.construct(e, [], l);
            } else {
              try {
                l.call();
              } catch (F) {
                a = F;
              }
              e.call(l.prototype);
            }
          } else {
            try {
              throw Error();
            } catch (F) {
              a = F;
            }
            e();
          }
        } catch (F) {
          if (F && a && typeof F.stack == "string") {
            for (var p = F.stack.split(`
`), v = a.stack.split(`
`), h = p.length - 1, C = v.length - 1; h >= 1 && C >= 0 && p[h] !== v[C]; )
              C--;
            for (; h >= 1 && C >= 0; h--, C--)
              if (p[h] !== v[C]) {
                if (h !== 1 || C !== 1)
                  do
                    if (h--, C--, C < 0 || p[h] !== v[C]) {
                      var R = `
` + p[h].replace(" at new ", " at ");
                      return e.displayName && R.includes("<anonymous>") && (R = R.replace("<anonymous>", e.displayName)), typeof e == "function" && Oe.set(e, R), R;
                    }
                  while (h >= 1 && C >= 0);
                break;
              }
          }
        } finally {
          Ke = !1, Ve.current = f, Ir(), Error.prepareStackTrace = u;
        }
        var x = e ? e.displayName || e.name : "", S = x ? Se(x) : "";
        return typeof e == "function" && Oe.set(e, S), S;
      }
      function Sr(e, t, n) {
        return ht(e, !1);
      }
      function Or(e) {
        var t = e.prototype;
        return !!(t && t.isReactComponent);
      }
      function Fe(e, t, n) {
        if (e == null)
          return "";
        if (typeof e == "function")
          return ht(e, Or(e));
        if (typeof e == "string")
          return Se(e);
        switch (e) {
          case W:
            return Se("Suspense");
          case le:
            return Se("SuspenseList");
        }
        if (typeof e == "object")
          switch (e.$$typeof) {
            case q:
              return Sr(e.render);
            case N:
              return Fe(e.type, t, n);
            case Y: {
              var a = e, u = a._payload, f = a._init;
              try {
                return Fe(f(u), t, n);
              } catch {
              }
            }
          }
        return "";
      }
      var bt = {}, Et = M.ReactDebugCurrentFrame;
      function Te(e) {
        if (e) {
          var t = e._owner, n = Fe(e.type, e._source, t ? t.type : null);
          Et.setExtraStackFrame(n);
        } else
          Et.setExtraStackFrame(null);
      }
      function Fr(e, t, n, a, u) {
        {
          var f = Function.call.bind(pe);
          for (var l in e)
            if (f(e, l)) {
              var p = void 0;
              try {
                if (typeof e[l] != "function") {
                  var v = Error((a || "React class") + ": " + n + " type `" + l + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof e[l] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                  throw v.name = "Invariant Violation", v;
                }
                p = e[l](t, l, a, n, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
              } catch (h) {
                p = h;
              }
              p && !(p instanceof Error) && (Te(u), d("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", a || "React class", n, l, typeof p), Te(null)), p instanceof Error && !(p.message in bt) && (bt[p.message] = !0, Te(u), d("Failed %s type: %s", n, p.message), Te(null));
            }
        }
      }
      function oe(e) {
        if (e) {
          var t = e._owner, n = Fe(e.type, e._source, t ? t.type : null);
          Ce(n);
        } else
          Ce(null);
      }
      var He;
      He = !1;
      function Ct() {
        if (L.current) {
          var e = H(L.current.type);
          if (e)
            return `

Check the render method of \`` + e + "`.";
        }
        return "";
      }
      function Tr(e) {
        if (e !== void 0) {
          var t = e.fileName.replace(/^.*[\\\/]/, ""), n = e.lineNumber;
          return `

Check your code at ` + t + ":" + n + ".";
        }
        return "";
      }
      function jr(e) {
        return e != null ? Tr(e.__source) : "";
      }
      var Rt = {};
      function Ar(e) {
        var t = Ct();
        if (!t) {
          var n = typeof e == "string" ? e : e.displayName || e.name;
          n && (t = `

Check the top-level render call using <` + n + ">.");
        }
        return t;
      }
      function wt(e, t) {
        if (!(!e._store || e._store.validated || e.key != null)) {
          e._store.validated = !0;
          var n = Ar(t);
          if (!Rt[n]) {
            Rt[n] = !0;
            var a = "";
            e && e._owner && e._owner !== L.current && (a = " It was passed a child from " + H(e._owner.type) + "."), oe(e), d('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', n, a), oe(null);
          }
        }
      }
      function kt(e, t) {
        if (typeof e == "object") {
          if (ke(e))
            for (var n = 0; n < e.length; n++) {
              var a = e[n];
              ae(a) && wt(a, t);
            }
          else if (ae(e))
            e._store && (e._store.validated = !0);
          else if (e) {
            var u = ee(e);
            if (typeof u == "function" && u !== e.entries)
              for (var f = u.call(e), l; !(l = f.next()).done; )
                ae(l.value) && wt(l.value, t);
          }
        }
      }
      function xt(e) {
        {
          var t = e.type;
          if (t == null || typeof t == "string")
            return;
          var n;
          if (typeof t == "function")
            n = t.propTypes;
          else if (typeof t == "object" && (t.$$typeof === q || // Note: Memo only checks outer props here.
          // Inner props are checked in the reconciler.
          t.$$typeof === N))
            n = t.propTypes;
          else
            return;
          if (n) {
            var a = H(t);
            Fr(n, e.props, "prop", a, e);
          } else if (t.PropTypes !== void 0 && !He) {
            He = !0;
            var u = H(t);
            d("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", u || "Unknown");
          }
          typeof t.getDefaultProps == "function" && !t.getDefaultProps.isReactClassApproved && d("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
        }
      }
      function Dr(e) {
        {
          for (var t = Object.keys(e.props), n = 0; n < t.length; n++) {
            var a = t[n];
            if (a !== "children" && a !== "key") {
              oe(e), d("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", a), oe(null);
              break;
            }
          }
          e.ref !== null && (oe(e), d("Invalid attribute `ref` supplied to `React.Fragment`."), oe(null));
        }
      }
      function It(e, t, n) {
        var a = lt(e);
        if (!a) {
          var u = "";
          (e === void 0 || typeof e == "object" && e !== null && Object.keys(e).length === 0) && (u += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
          var f = jr(t);
          f ? u += f : u += Ct();
          var l;
          e === null ? l = "null" : ke(e) ? l = "array" : e !== void 0 && e.$$typeof === Q ? (l = "<" + (H(e.type) || "Unknown") + " />", u = " Did you accidentally export a JSX literal instead of a component?") : l = typeof e, d("React.createElement: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", l, u);
        }
        var p = zt.apply(this, arguments);
        if (p == null)
          return p;
        if (a)
          for (var v = 2; v < arguments.length; v++)
            kt(arguments[v], e);
        return e === X ? Dr(p) : xt(p), p;
      }
      var Pt = !1;
      function Lr(e) {
        var t = It.bind(null, e);
        return t.type = e, Pt || (Pt = !0, K("React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.")), Object.defineProperty(t, "type", {
          enumerable: !1,
          get: function() {
            return K("Factory.type is deprecated. Access the class directly before passing it to createFactory."), Object.defineProperty(this, "type", {
              value: e
            }), e;
          }
        }), t;
      }
      function Mr(e, t, n) {
        for (var a = Qt.apply(this, arguments), u = 2; u < arguments.length; u++)
          kt(arguments[u], a.type);
        return xt(a), a;
      }
      function Gr(e, t) {
        var n = $.transition;
        $.transition = {};
        var a = $.transition;
        $.transition._updatedFibers = /* @__PURE__ */ new Set();
        try {
          e();
        } finally {
          if ($.transition = n, n === null && a._updatedFibers) {
            var u = a._updatedFibers.size;
            u > 10 && K("Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."), a._updatedFibers.clear();
          }
        }
      }
      var St = !1, je = null;
      function Nr(e) {
        if (je === null)
          try {
            var t = ("require" + Math.random()).slice(0, 7), n = o && o[t];
            je = n.call(o, "timers").setImmediate;
          } catch {
            je = function(u) {
              St === !1 && (St = !0, typeof MessageChannel > "u" && d("This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."));
              var f = new MessageChannel();
              f.port1.onmessage = u, f.port2.postMessage(void 0);
            };
          }
        return je(e);
      }
      var ie = 0, Ot = !1;
      function Ft(e) {
        {
          var t = ie;
          ie++, O.current === null && (O.current = []);
          var n = O.isBatchingLegacy, a;
          try {
            if (O.isBatchingLegacy = !0, a = e(), !n && O.didScheduleLegacyUpdate) {
              var u = O.current;
              u !== null && (O.didScheduleLegacyUpdate = !1, Ye(u));
            }
          } catch (x) {
            throw Ae(t), x;
          } finally {
            O.isBatchingLegacy = n;
          }
          if (a !== null && typeof a == "object" && typeof a.then == "function") {
            var f = a, l = !1, p = {
              then: function(x, S) {
                l = !0, f.then(function(F) {
                  Ae(t), ie === 0 ? qe(F, x, S) : x(F);
                }, function(F) {
                  Ae(t), S(F);
                });
              }
            };
            return !Ot && typeof Promise < "u" && Promise.resolve().then(function() {
            }).then(function() {
              l || (Ot = !0, d("You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"));
            }), p;
          } else {
            var v = a;
            if (Ae(t), ie === 0) {
              var h = O.current;
              h !== null && (Ye(h), O.current = null);
              var C = {
                then: function(x, S) {
                  O.current === null ? (O.current = [], qe(v, x, S)) : x(v);
                }
              };
              return C;
            } else {
              var R = {
                then: function(x, S) {
                  x(v);
                }
              };
              return R;
            }
          }
        }
      }
      function Ae(e) {
        e !== ie - 1 && d("You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "), ie = e;
      }
      function qe(e, t, n) {
        {
          var a = O.current;
          if (a !== null)
            try {
              Ye(a), Nr(function() {
                a.length === 0 ? (O.current = null, t(e)) : qe(e, t, n);
              });
            } catch (u) {
              n(u);
            }
          else
            t(e);
        }
      }
      var We = !1;
      function Ye(e) {
        if (!We) {
          We = !0;
          var t = 0;
          try {
            for (; t < e.length; t++) {
              var n = e[t];
              do
                n = n(!0);
              while (n !== null);
            }
            e.length = 0;
          } catch (a) {
            throw e = e.slice(t + 1), a;
          } finally {
            We = !1;
          }
        }
      }
      var Br = It, $r = Mr, Vr = Lr, Ur = {
        map: Pe,
        forEach: rr,
        count: tr,
        toArray: nr,
        only: ar
      };
      s.Children = Ur, s.Component = y, s.Fragment = X, s.Profiler = se, s.PureComponent = E, s.StrictMode = ue, s.Suspense = W, s.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = M, s.act = Ft, s.cloneElement = $r, s.createContext = or, s.createElement = Br, s.createFactory = Vr, s.createRef = $t, s.forwardRef = cr, s.isValidElement = ae, s.lazy = sr, s.memo = lr, s.startTransition = Gr, s.unstable_act = Ft, s.useCallback = _r, s.useContext = fr, s.useDebugValue = Er, s.useDeferredValue = Rr, s.useEffect = gr, s.useId = wr, s.useImperativeHandle = br, s.useInsertionEffect = vr, s.useLayoutEffect = yr, s.useMemo = hr, s.useReducer = pr, s.useRef = mr, s.useState = dr, s.useSyncExternalStore = kr, s.useTransition = Cr, s.version = b, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
    }();
  }(ye, ye.exports)), ye.exports;
}
var Mt;
function Xr() {
  return Mt || (Mt = 1, process.env.NODE_ENV === "production" ? Le.exports = Jr() : Le.exports = Qr()), Le.exports;
}
var Zr = Xr();
const en = /* @__PURE__ */ zr(Zr), tn = {
  [c.BlackForestLabs]: "/resources/images/services/blackforestlabs.svg",
  [c.Kling]: "/resources/images/services/kling.svg",
  [c.Midjourney]: "/resources/images/services/midjourney.svg",
  [c.OpenAi]: "/resources/images/services/openai.svg",
  [c.Bytedance]: "/resources/images/services/bytedance.svg",
  [c.Google]: "/resources/images/services/google.svg",
  [c.Recraft]: "/resources/images/services/recraft.svg",
  [c.Tencent]: "/resources/images/services/tencent.svg",
  [c.Krea]: "/resources/images/services/krea.svg",
  [c.Fal]: "/resources/images/services/fal.svg",
  [c.Replicate]: "/resources/images/services/replicate.svg",
  [c.TensorArt]: "/resources/images/services/tensorart.svg",
  [c.OpenArt]: "/resources/images/services/openart.svg",
  [c.Higgsfield]: "/resources/images/services/higgsfield.svg",
  [c.Alibaba]: "/resources/images/services/alibaba.svg",
  [c.Vidu]: "/resources/images/services/vidu.svg",
  [c.ArtCraft]: "/resources/images/services/artcraft.svg"
}, rn = "/resources/images/services/generic.svg", nn = (o) => tn[o], an = (o, s = "h-4 w-4 invert") => {
  const b = nn(o) ?? rn;
  return en.createElement("img", {
    src: b,
    alt: `${o} logo`,
    className: s
  });
}, Nt = {
  flux_1_dev: c.BlackForestLabs,
  flux_1_schnell: c.BlackForestLabs,
  flux_pro_1p1: c.BlackForestLabs,
  flux_pro_1p1_ultra: c.BlackForestLabs,
  gpt_image_1: c.OpenAi,
  kling_1p6_pro: c.Kling,
  kling_2p1_pro: c.Kling,
  kling_2p1_master: c.Kling,
  seedance_1p0_lite: c.Bytedance,
  veo_2: c.Google,
  recraft_3: c.Recraft,
  hunyuan_3d: c.Tencent,
  midjourney: c.Midjourney,
  midjourney_v6: c.Midjourney,
  midjourney_v6p1: c.Midjourney,
  midjourney_v6p1_raw: c.Midjourney,
  midjourney_v7: c.Midjourney,
  midjourney_v7_raw: c.Midjourney,
  midjourney_v7_draft_raw: c.Midjourney
}, fn = (o) => {
  const s = Nt[o];
  return s ? an(s, "h-4 w-4 invert") : null;
}, dn = (o) => {
  const s = Nt[o];
  switch (s) {
    case c.BlackForestLabs:
      return "Black Forest Labs";
    case c.OpenAi:
      return "OpenAI";
    case c.Kling:
      return "Kling AI";
    case c.Bytedance:
      return "ByteDance";
    case c.Google:
      return "Google";
    case c.Midjourney:
      return "Midjourney";
    case c.Stability:
      return "Stability AI";
    case c.Runway:
      return "Runway";
    case c.Hailuo:
      return "Hailuo";
    case c.Recraft:
      return "Recraft";
    case c.Tencent:
      return "Tencent";
    case c.Alibaba:
      return "Alibaba";
    case c.Vidu:
      return "Vidu";
    case c.Fal:
      return "Fal";
    case c.Replicate:
      return "Replicate";
    case c.TensorArt:
      return "TensorArt";
    case c.OpenArt:
      return "OpenArt";
    case c.Higgsfield:
      return "Higgsfield";
    case c.Krea:
      return "Krea";
    default:
      return s;
  }
}, pn = (o) => ({
  flux_1_dev: "Flux 1 Dev",
  flux_1_schnell: "Flux 1 Schnell",
  flux_pro_1p1: "Flux Pro 1.1",
  flux_pro_1p1_ultra: "Flux Pro 1.1 Ultra",
  gpt_image_1: "GPT Image 1",
  kling_1p6_pro: "Kling 1.6 Pro",
  kling_2p1_pro: "Kling 2.1 Pro",
  kling_2p1_master: "Kling 2.1 Master",
  seedance_1p0_lite: "Seedance 1.0 Lite",
  veo_2: "Veo 2",
  recraft_3: "Recraft 3",
  hunyuan_3d_2p0: "Hunyuan 3D 2.0",
  hunyuan_3d_2p1: "Hunyuan 3D 2.1",
  hunyuan_3d: "Hunyuan 3D",
  flux_pro_kontext_max: "Flux Pro Kontext Max",
  // Catch-all bucket for Midjourney.
  midjourney: "Midjourney",
  // Specific Midjourney models.
  midjourney_v6: "Midjourney V6",
  midjourney_v6p1: "Midjourney V6.1",
  midjourney_v6p1_raw: "Midjourney V6.1 (Raw)",
  midjourney_v7: "Midjourney V7",
  midjourney_v7_raw: "Midjourney V7 (Raw)",
  midjourney_v7_draft_raw: "Midjourney V7 (Draft Raw)"
  // TODO: add more models here - BFlat
})[o] || o, mn = (o) => ({
  artcraft: "ArtCraft",
  fal: "FAL",
  midjourney: "Midjourney",
  sora: "Sora"
})[o] || o;
var V = /* @__PURE__ */ ((o) => (o.InstructiveEdit = "instructiveEdit", o.MaskedInpainting = "maskedInpainting", o.NonMaskedInpainting = "nonMaskedInpainting", o))(V || {});
const A = c, Je = {
  maxGenerationCount: 1,
  defaultGenerationCount: 1
}, D = (o) => ({
  label: o.label ?? o.info.name,
  description: o.description,
  badges: o.badges,
  capabilities: o.capabilities ?? Je,
  tags: o.tags ?? [],
  ...o
}), _e = [
  //////////////////////////////
  // Image models
  //////////////////////////////
  D({
    id: "midjourney",
    category: "image",
    info: {
      name: "Midjourney",
      tauri_id: "midjourney",
      creator: A.Midjourney
    },
    description: "Incredible style and quality",
    badges: [{ label: "15 sec." }],
    capabilities: { maxGenerationCount: 4, defaultGenerationCount: 4 }
  }),
  D({
    id: "flux_pro_1_1_ultra",
    category: "image",
    info: {
      name: "Flux Pro 1.1 Ultra",
      tauri_id: "flux_pro_11_ultra",
      creator: A.BlackForestLabs
    },
    description: "High quality model",
    badges: [{ label: "15 sec." }],
    capabilities: { maxGenerationCount: 4, defaultGenerationCount: 4 }
  }),
  D({
    id: "flux_pro_1_1",
    category: "image",
    info: {
      name: "Flux Pro 1.1",
      tauri_id: "flux_pro_11",
      creator: A.BlackForestLabs
    },
    description: "High quality model",
    badges: [{ label: "15 sec." }],
    capabilities: { maxGenerationCount: 4, defaultGenerationCount: 4 }
  }),
  D({
    id: "flux_1_dev",
    category: "image",
    info: {
      name: "Flux 1 Dev",
      tauri_id: "flux_1_dev",
      creator: A.BlackForestLabs
    },
    description: "High quality model",
    badges: [{ label: "15 sec." }],
    capabilities: { maxGenerationCount: 4, defaultGenerationCount: 4 }
  }),
  D({
    id: "flux_1_schnell",
    category: "image",
    info: {
      name: "Flux 1 Schnell",
      tauri_id: "flux_1_schnell",
      creator: A.BlackForestLabs
    },
    description: "High quality model",
    badges: [{ label: "15 sec." }],
    capabilities: { maxGenerationCount: 4, defaultGenerationCount: 4 }
  }),
  D({
    id: "gpt_image_1",
    category: "image",
    info: {
      name: "GPT Image 1 (GPT-4o)",
      tauri_id: "gpt_image_1",
      creator: A.OpenAi
    },
    description: "Slow, ultra instructive model",
    badges: [{ label: "45 sec." }],
    capabilities: { maxGenerationCount: 1 },
    tags: ["instructiveEdit"]
  }),
  D({
    id: "flux_pro_kontext_max",
    category: "image",
    info: {
      name: "Flux Pro Kontext Max",
      tauri_id: "flux_pro_kontext_max",
      creator: A.BlackForestLabs
    },
    description: "Fast and high-quality model",
    badges: [{ label: "20 sec." }],
    capabilities: {
      maxGenerationCount: 4
    },
    tags: [V.InstructiveEdit, V.NonMaskedInpainting]
  }),
  D({
    id: "flux_pro_inpaint",
    category: "image",
    info: {
      name: "Flux Pro 1 (Inpainting)",
      tauri_id: "flux_pro_1",
      creator: A.BlackForestLabs
    },
    description: "Fast and high-quality model",
    badges: [{ label: "20 sec." }],
    capabilities: {
      maxGenerationCount: 1
      // NB: For some reason Fal only supports ONE image!
    },
    tags: [V.MaskedInpainting]
  }),
  D({
    id: "flux_dev_juggernaut_inpaint",
    category: "image",
    info: {
      name: "Flux Dev Juggernaut (Inpainting)",
      tauri_id: "flux_dev_juggernaut",
      creator: A.BlackForestLabs
    },
    description: "Fast and high-quality model",
    badges: [{ label: "20 sec." }],
    capabilities: {
      maxGenerationCount: 4
    },
    tags: [V.MaskedInpainting]
  }),
  //////////////////////////////
  // Video models
  //////////////////////////////
  D({
    id: "kling_1_6_pro",
    category: "video",
    info: {
      name: "Kling 1.6 Pro",
      tauri_id: "kling_1.6_pro",
      creator: A.Kling
    },
    description: "Good quality model",
    badges: [{ label: "2 min." }],
    capabilities: { maxGenerationCount: 1 }
  }),
  D({
    id: "kling_2_1_pro",
    category: "video",
    info: {
      name: "Kling 2.1 Pro",
      tauri_id: "kling_2.1_pro",
      creator: A.Kling
    },
    description: "High quality model",
    badges: [{ label: "2 min." }],
    capabilities: { maxGenerationCount: 1 }
  }),
  D({
    id: "kling_2_1_master",
    category: "video",
    info: {
      name: "Kling 2.1 Master",
      tauri_id: "kling_2.1_master",
      creator: A.Kling
    },
    description: "Master quality model ($$)",
    badges: [{ label: "2 min." }],
    capabilities: { maxGenerationCount: 1 }
  }),
  D({
    id: "seedance_1_0_lite",
    category: "video",
    info: {
      name: "Seedance 1.0 Lite",
      tauri_id: "seedance_1.0_lite",
      creator: A.Bytedance
    },
    description: "Fast and high-quality model",
    badges: [{ label: "2 min." }],
    capabilities: { maxGenerationCount: 1 }
  }),
  D({
    id: "veo_2",
    category: "video",
    info: { name: "Google Veo 2", tauri_id: "veo_2", creator: A.Google },
    description: "Fast and high-quality model",
    badges: [{ label: "2 min." }],
    capabilities: { maxGenerationCount: 1 }
  })
], gn = () => _e, vn = (o) => _e.filter((s) => s.category === o), yn = () => _e.filter(
  (o) => {
    var s;
    return o.category === "image" && ((s = o.tags) == null ? void 0 : s.includes("instructiveEdit"));
  }
), _n = () => _e.filter(
  (o) => {
    var s;
    return o.category === "image" && ((s = o.tags) == null ? void 0 : s.includes(V.MaskedInpainting));
  }
), on = (o) => _e.find((s) => s.info.tauri_id === o), hn = (o) => {
  if (!o) return Je;
  const s = on(o.tauriId);
  return (s == null ? void 0 : s.capabilities) ?? Je;
}, Qe = [
  new G({
    id: "midjourney",
    tauriId: "midjourney",
    fullName: "Midjourney",
    category: "image",
    creator: c.Midjourney,
    selectorName: "Midjourney",
    selectorDescription: "Incredible style and quality",
    selectorBadges: ["15 sec."],
    maxGenerationCount: 4,
    defaultGenerationCount: 4,
    canUseImagePrompt: !1,
    maxImagePromptCount: 6
  }),
  new G({
    id: "flux_pro_1_1_ultra",
    tauriId: "flux_pro_11_ultra",
    fullName: "Flux Pro 1.1 Ultra",
    category: "image",
    creator: c.BlackForestLabs,
    selectorName: "Flux Pro 1.1 Ultra",
    selectorDescription: "High quality model",
    selectorBadges: ["15 sec."],
    maxGenerationCount: 4,
    defaultGenerationCount: 4,
    canUseImagePrompt: !0,
    maxImagePromptCount: 6
  }),
  new G({
    id: "flux_pro_1_1",
    tauriId: "flux_pro_11",
    fullName: "Flux Pro 1.1",
    category: "image",
    creator: c.BlackForestLabs,
    selectorName: "Flux Pro 1.1",
    selectorDescription: "High quality model",
    selectorBadges: ["15 sec."],
    maxGenerationCount: 4,
    defaultGenerationCount: 4,
    canUseImagePrompt: !0,
    maxImagePromptCount: 6
  }),
  new G({
    id: "flux_1_dev",
    tauriId: "flux_1_dev",
    fullName: "Flux 1 Dev",
    category: "image",
    creator: c.BlackForestLabs,
    selectorName: "Flux 1 Dev",
    selectorDescription: "High quality model",
    selectorBadges: ["15 sec."],
    maxGenerationCount: 4,
    defaultGenerationCount: 4,
    canUseImagePrompt: !0,
    maxImagePromptCount: 6
  }),
  new G({
    id: "flux_1_schnell",
    tauriId: "flux_1_schnell",
    fullName: "Flux 1 Schnell",
    category: "image",
    creator: c.BlackForestLabs,
    selectorName: "Flux 1 Schnell",
    selectorDescription: "High quality model",
    selectorBadges: ["15 sec."],
    maxGenerationCount: 4,
    defaultGenerationCount: 4,
    canUseImagePrompt: !0,
    maxImagePromptCount: 6
  }),
  new G({
    id: "gemini_25_flash",
    tauriId: "gemini_25_flash",
    fullName: "Gemini 2.5 Flash",
    category: "image",
    creator: c.Google,
    selectorName: "Gemini 2.5 Flash",
    selectorDescription: "Ultra instructive model",
    selectorBadges: ["35 sec."],
    maxGenerationCount: 4,
    defaultGenerationCount: 1,
    canEditImages: !0,
    canUseImagePrompt: !0,
    maxImagePromptCount: 6,
    tags: [V.InstructiveEdit]
  }),
  new G({
    id: "gpt_image_1",
    tauriId: "gpt_image_1",
    fullName: "GPT Image 1 (GPT-4o)",
    category: "image",
    creator: c.OpenAi,
    selectorName: "GPT Image 1 (GPT-4o)",
    selectorDescription: "Slow, ultra instructive model",
    selectorBadges: ["45 sec."],
    maxGenerationCount: 1,
    defaultGenerationCount: 1,
    tags: [V.InstructiveEdit],
    canEditImages: !0,
    canUseImagePrompt: !0,
    maxImagePromptCount: 6
  }),
  new G({
    id: "flux_pro_kontext_max",
    tauriId: "flux_pro_kontext_max",
    fullName: "Flux Pro Kontext Max",
    category: "image",
    creator: c.BlackForestLabs,
    selectorName: "Flux Pro Kontext Max",
    selectorDescription: "Fast instructive editing",
    selectorBadges: ["20 sec."],
    maxGenerationCount: 4,
    defaultGenerationCount: 4,
    canEditImages: !0,
    tags: [V.InstructiveEdit]
  }),
  new G({
    id: "flux_pro_inpaint",
    tauriId: "flux_pro_1",
    fullName: "Flux Pro Inpaint",
    category: "image",
    creator: c.BlackForestLabs,
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
  new G({
    id: "flux_dev_juggernaut_inpaint",
    tauriId: "flux_dev_juggernaut",
    fullName: "Flux Dev Juggernaut Inpaint",
    category: "image",
    creator: c.BlackForestLabs,
    selectorName: "Flux Dev Juggernaut",
    selectorDescription: "Fast inpainting",
    selectorBadges: ["15 sec."],
    maxGenerationCount: 4,
    defaultGenerationCount: 4,
    canEditImages: !0,
    usesInpaintingMask: !0
  })
], un = new Map(
  Qe.map((o) => [o.id, o])
);
if (un.size !== Qe.length)
  throw new Error("All image models must have unique IDs");
const sn = [
  new ve({
    id: "kling_1_6_pro",
    tauriId: "kling_1.6_pro",
    fullName: "Kling 1.6 Pro",
    category: "video",
    creator: c.Kling,
    selectorName: "Kling 1.6 Pro",
    selectorDescription: "Fast video model",
    selectorBadges: ["2 min."],
    startFrame: !0,
    endFrame: !0
  }),
  new ve({
    id: "kling_2_1_pro",
    tauriId: "kling_2.1_pro",
    fullName: "Kling 2.1 Pro",
    category: "video",
    creator: c.Kling,
    selectorName: "Kling 2.1 Pro",
    selectorDescription: "Fast video model",
    selectorBadges: ["2 min."],
    startFrame: !0,
    endFrame: !0
  }),
  new ve({
    id: "kling_2_1_master",
    tauriId: "kling_2.1_master",
    fullName: "Kling 2.1 Master",
    category: "video",
    creator: c.Kling,
    selectorName: "Kling 2.1 Master",
    selectorDescription: "Fast video model",
    selectorBadges: ["2 min."],
    startFrame: !0,
    endFrame: !1
  }),
  new ve({
    id: "seedance_1_0_lite",
    tauriId: "seedance_1.0_lite",
    fullName: "Seedance 1.0 Lite",
    category: "video",
    creator: c.Bytedance,
    selectorName: "Seedance 1.0 Lite",
    selectorDescription: "Fast video model",
    selectorBadges: ["2 min."],
    startFrame: !0,
    endFrame: !1
  }),
  new ve({
    id: "veo_2",
    tauriId: "veo_2",
    fullName: "Google Veo 2",
    category: "video",
    creator: c.Google,
    selectorName: "Google Veo 2",
    selectorDescription: "Fast video model",
    selectorBadges: ["2 min."],
    startFrame: !0,
    endFrame: !1
  })
], Bt = [...Qe, ...sn], cn = new Map(
  Bt.map((o) => [o.id, o])
);
if (cn.size !== Bt.length)
  throw new Error("All models must have unique IDs");
export {
  cn as ALL_MODELS_BY_ID,
  Bt as ALL_MODELS_LIST,
  tn as CREATOR_ICON_PATHS,
  Qe as IMAGE_MODELS,
  un as IMAGE_MODELS_BY_ID,
  G as ImageModel,
  Nt as MODEL_TYPE_TO_CREATOR,
  Gt as Model,
  c as ModelCreator,
  V as ModelTag,
  sn as VIDEO_MODELS,
  ve as VideoModel,
  gn as getAllModels,
  hn as getCapabilitiesForModel,
  an as getCreatorIcon,
  nn as getCreatorIconPath,
  yn as getInstructiveImageEditModels,
  _n as getMaskedInpaintModels,
  fn as getModelCreatorIcon,
  dn as getModelCreatorName,
  pn as getModelDisplayName,
  vn as getModelsByCategory,
  mn as getProviderDisplayName,
  on as lookupModelByTauriId
};
